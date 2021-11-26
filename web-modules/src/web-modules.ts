import log from "@moderno/logger";
import chalk from "chalk";
import {parse} from "fast-url-parser";
import {existsSync, mkdirSync, promises as fsp, rmdirSync} from "fs";
import memoized from "nano-memoize";
import path, {posix} from "path";
import resolve, {Opts} from "resolve";
import {generateCjsProxy, parseCjsReady} from "./cjs-entry-proxy";
import {collectEntryModules} from "./entry-modules";
import {isBare, parseModuleUrl, pathnameToModuleUrl, toPosix} from "./es-import-utils";
import {generateEsmProxy, parseEsmReady} from "./esm-entry-proxy";
import {ImportResolver, WebModulesFactory, WebModulesOptions} from "./index";
import {useNotifications} from "./notifications";
import {closestManifest, readImportMap, stripExt, writeImportMap} from "./utility";
import {readWorkspaces} from "./workspaces";
import * as esbuild from "esbuild";
import {replaceRequire} from "./replace-require";

export type EntryProxyResult = {
    code: string         // The entry proxy code
    imports: string[]    // Imports that will end up in the importMap as imports because they have been squashed in
    external: string[]   // Imports that have to be treated as external during the bundling of this module
}

export function defaultOptions(): WebModulesOptions {
    return require(require.resolve(`${process.cwd()}/web-modules.config.js`));
}

/**
 *   __        __   _       __  __           _       _
 *   \ \      / /__| |__   |  \/  | ___   __| |_   _| | ___  ___
 *    \ \ /\ / / _ \ '_ \  | |\/| |/ _ \ / _` | | | | |/ _ \/ __|
 *     \ V  V /  __/ |_) | | |  | | (_) | (_| | |_| | |  __/\__ \
 *      \_/\_/ \___|_.__/  |_|  |_|\___/ \__,_|\__,_|_|\___||___/
 *
 * @param config
 */
export const useWebModules = memoized<WebModulesFactory>((options: WebModulesOptions = defaultOptions()) => {

    if (!options.environment) options.environment = "development";
    if (!options.resolve) options.resolve = {};
    if (!options.resolve.extensions) options.resolve.extensions = [".ts", ".tsx", ".js", ".jsx"];
    if (!options.external) options.external = ["@babel/runtime/**"];
    if (!options.esbuild) options.esbuild = {};

    const notify = useNotifications(options);

    options.esbuild = {
        define: {
            "process.env.NODE_ENV": `"${options.environment}"`,
            ...options.esbuild.define
        },
        sourcemap: true,
        target: ["chrome80"],
        ...options.esbuild,
        format: "esm",
        bundle: true
    };

    const ALREADY_RESOLVED = Promise.resolve();
    const resolveOptions = {
        basedir: options.rootDir,
        includeCoreModules: false,
        packageFilter(pkg: any, pkgfile: string) {
            return {main: pkg.module || pkg["jsnext:main"] || pkg.main};
        },
        ...options.resolve
    } as Opts;

    const outDir = path.join(options.rootDir, "web_modules");
    if (options.clean && existsSync(outDir)) {
        rmdirSync(outDir, {recursive: true});
        log.warn("cleaned web_modules directory");
    }
    mkdirSync(outDir, {recursive: true});

    const importMap = readImportMap(options.rootDir, outDir);

    const workspaces = readWorkspaces(options.rootDir);

    const squash = new Set<string>(options.squash); // TODO: shall I resurrect squash feature?
    const entryModules = collectEntryModules(resolveOptions, squash);
    const isModule = /\.m?[tj]sx?$/;

    const ignore = function () {
    };

    const isResolved = ((re) => re.test.bind(re))(/^\/(web_modules|workspaces|moderno)\//);

    /**
     *                       _          _____                           _
     *                      | |        |_   _|                         | |
     *   _ __ ___  ___  ___ | |_   _____ | | _ __ ___  _ __   ___  _ __| |_
     *  | '__/ _ \/ __|/ _ \| \ \ / / _ \| || '_ ` _ \| '_ \ / _ \| '__| __|
     *  | | |  __/\__ \ (_) | |\ V /  __/| || | | | | | |_) | (_) | |  | |_
     *  |_|  \___||___/\___/|_| \_/ \___\___/_| |_| |_| .__/ \___/|_|   \__|
     *                                                | |
     *                                                |_|
     *
     * @param url
     * @param importer
     */
    const resolveImport: ImportResolver = async (url, importer?) => {

        if (url[0] === "/" && isResolved(url)) return url;

        let {
            hostname,
            pathname,
            search
        } = parse(url);

        if (hostname !== null) {
            return url;
        }

        let resolved = importMap.imports[pathname];
        if (!resolved) {
            const [module] = parseModuleUrl(pathname);
            if (module) {
                const filename = resolve.sync(pathname, resolveOptions);
                pathname = pathnameToModuleUrl(filename);
                if (workspaces.has(module)) {
                    resolved = posix.join(workspaces.get(module)!, pathname.slice(module.length + 1));
                } else {
                    resolved = importMap.imports[pathname];
                    if (!resolved) {
                        await bundleWebModule(pathname);
                        resolved = importMap.imports[pathname];
                    }
                }
            } else {
                const basedir = importer ? path.dirname(importer) : options.rootDir;
                const filename = resolve.sync(pathname, {...resolveOptions, basedir});
                pathname = toPosix(path.relative(basedir, filename));
                resolved = isBare(pathname) ? `./${pathname}` : pathname;
            }
        }

        const type = importer ? resolveModuleType(resolved, importer) : null;
        if (type) {
            search = search ? `?type=${type}&${search.slice(1)}` : `?type=${type}`;
        }

        if (search) {
            return resolved + search;
        } else {
            return resolved;
        }
    };

    function resolveModuleType(filename: string, importer: string): string | null {
        const ext = posix.extname(filename);
        if (!isModule.test(ext) && isModule.test(importer)) {
            return "module";
        } else {
            return null;
        }
    }

    const pendingTasks = new Map<string, Promise<void>>();

    /**
     *             _           _ _     ___        __   _     __  __           _       _
     *    ___  ___| |__  _   _(_) | __| \ \      / /__| |__ |  \/  | ___   __| |_   _| | ___
     *   / _ \/ __| '_ \| | | | | |/ _` |\ \ /\ / / _ \ '_ \| |\/| |/ _ \ / _` | | | | |/ _ \
     *  |  __/\__ \ |_) | |_| | | | (_| | \ V  V /  __/ |_) | |  | | (_) | (_| | |_| | |  __/
     *   \___||___/_.__/ \__,_|_|_|\__,_|  \_/\_/ \___|_.__/|_|  |_|\___/ \__,_|\__,_|_|\___|
     *
     * @param source
     */
    function bundleWebModule(source: string): Promise<void> {
        if (importMap.imports[source]) {
            return ALREADY_RESOLVED;
        }
        let pendingTask = pendingTasks.get(source);
        if (pendingTask === undefined) {
            pendingTasks.set(source, pendingTask = bundleWebModuleTask(source));
        }
        return pendingTask;
    }

    let ready = Promise.all([
        parseCjsReady,
        parseEsmReady
    ]);

    let resolveEntryFile = function (source: string) {
        try {
            return resolve.sync(source, resolveOptions);
        } catch (error) {
            log.warn("nothing to bundle for:", chalk.magenta(source), `(${chalk.gray(error.message)})`);
            return null;
        }
    };

    async function bundleWebModuleTask(source: string): Promise<void> {

        let startTime = Date.now();
        log.debug("bundling web module:", source);

        const bundleNotification = notify(`bundling web module: ${source}`, "info");
        try {
            const entryFile = resolveEntryFile(source);
            if (!entryFile) {
                importMap.imports[source] = `/web_modules/${source}`;
                notify(`nothing to bundle for: ${source}`, "success", true);
                return;
            }
            if (!(entryFile.endsWith(".js") || entryFile.endsWith(".mjs"))) {
                importMap.imports[source] = `/web_modules/${source}`;
                const outFile = path.resolve(outDir, source);
                mkdirSync(path.dirname(outFile), {recursive: true});
                await Promise.all([
                    fsp.copyFile(entryFile, outFile),
                    writeImportMap(outDir, importMap)
                ]);
                const elapsed = Date.now() - startTime;
                log.info`copied: ${chalk.magenta(source)} in: ${chalk.magenta(String(elapsed))}ms`;
                bundleNotification.update(`copied: ${source} in: ${elapsed}ms`, "success");
                return;
            }
            let entryUrl = pathnameToModuleUrl(entryFile);
            let pkg = closestManifest(entryFile);
            let isESM = pkg.module || pkg["jsnext:main"]
                || entryFile.endsWith(".mjs")
                || entryFile.indexOf("\\es\\") > 0
                || entryFile.indexOf("\\esm\\") > 0;

            const [entryModule, pathname] = parseModuleUrl(source);
            if (entryModule && !importMap.imports[entryModule] && entryModule !== source) {
                await bundleWebModule(entryModule);
                if (importMap.imports[entryUrl]) {
                    const elapsed = Date.now() - startTime;
                    log.info`already bundled: ${chalk.magenta(source)}`;
                    bundleNotification.update(`already bundled: ${source}`, "success");
                    return;
                }
            }

            let outName = `${stripExt(source)}.js`;
            let outUrl = `/web_modules/${outName}`;
            let outFile = path.join(outDir, outName);

            if (pathname) {

                await esbuild.build({
                    ...options.esbuild,
                    entryPoints: [entryUrl],
                    outfile: outFile,
                    plugins: [{
                        name: "web_modules",
                        setup(build) {
                            build.onResolve({filter: /./}, async ({path: url, importer, kind}) => {
                                if (isBare(url)) {
                                    if (url === entryUrl) {
                                        return {path: entryFile};
                                    }
                                    let webModuleUrl = importMap.imports[url];
                                    if (webModuleUrl) {
                                        return {path: webModuleUrl, external: true, namespace: "web_modules"};
                                    }
                                    let [m] = parseModuleUrl(url);
                                    if (entryModules.has(m!)) {
                                        return {
                                            path: await resolveImport(url),
                                            external: true,
                                            namespace: "web_modules"
                                        };
                                    }
                                    return null;
                                } else {
                                    let bareUrl = resolveToBareUrl(importer, url);
                                    let webModuleUrl = importMap.imports[bareUrl];
                                    if (webModuleUrl) {
                                        return {path: webModuleUrl, external: true, namespace: "web_modules"};
                                    }
                                    // return {
                                    //     path: `/web_modules/${bareUrl}`,
                                    //     external: true,
                                    //     namespace: "web_modules"
                                    // };
                                    return null;
                                }
                            });
                        }
                    }]
                });

            } else {

                let entryProxy = isESM ? generateEsmProxy(entryFile) : generateCjsProxy(entryFile);
                let imported = new Set<string>(entryProxy.imports);
                let external = new Set<string>(entryProxy.external);
                let required = new Map<string, string>();

                // NOTE: externals are not handled at the moment hence the warning
                if (external.size) {
                    log.warn(`${source} has ${external.size} externals: ${external.size < 20 ? entryProxy.external : "..."}`);
                }

                await esbuild.build({
                    ...options.esbuild,
                    stdin: {
                        contents: entryProxy.code,
                        resolveDir: options.rootDir,
                        sourcefile: `entry-proxy`,
                        loader: "js"
                    },
                    outfile: outFile,
                    plugins: [{
                        name: "web_modules",
                        setup(build) {
                            build.onResolve({filter: /./}, async function ({path: url, importer, kind}) {
                                if (kind === "require-call") {

                                }
                                if (isBare(url)) {
                                    if (imported.has(url)) {
                                        let webModuleUrl = importMap.imports[url];
                                        if (webModuleUrl) {
                                            imported.delete(url);
                                            return {path: webModuleUrl, external: true, namespace: "web_modules"};
                                        }
                                        return null;
                                    }
                                    let [m] = parseModuleUrl(url);
                                    if (entryModules.has(m!)) {
                                        return {
                                            path: await resolveImport(url),
                                            external: true,
                                            namespace: "web_modules"
                                        };
                                    }
                                    return null;
                                }
                                // if (external.has(url)) {
                                //     let bareUrl = resolveToBareUrl(importer, url);
                                //     return {
                                //         path: `/web_modules/${bareUrl}`,
                                //         external: true,
                                //         namespace: "web_modules"
                                //     };
                                // }
                                return null;
                            });
                        }
                    }]
                });

                for (const i of imported) {
                    if (!importMap.imports[i]) {
                        importMap.imports[i] = outUrl;
                    } else {
                        log.warn("an import mapping already exists for:", i, "and is:", importMap.imports[i]);
                    }
                }
            }

            importMap.imports[source] = outUrl;
            importMap.imports[entryUrl] = outUrl;

            await Promise.all([
                replaceRequire(outFile, resolveImport, options.esbuild!.sourcemap),
                writeImportMap(outDir, importMap)
            ]);

            const elapsed = Date.now() - startTime;
            log.info`bundled: ${chalk.magenta(source)} in: ${chalk.magenta(String(elapsed))}ms`;

            bundleNotification.update(`bundled: ${source} in: ${elapsed}ms`, "success");

        } finally {
            pendingTasks.delete(source);
        }
    }

    function resolveToBareUrl(importer, url) {
        let absolute = resolve.sync(path.join(path.dirname(importer), url), resolveOptions);
        return pathnameToModuleUrl(absolute);
    }

    return {
        options,
        outDir,
        importMap,
        resolveImport,
        bundleWebModule
    };
});
