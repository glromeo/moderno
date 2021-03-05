import chalk from "chalk";
import {Service, startService} from "esbuild";
import {sassPlugin} from "esbuild-sass-plugin";
import {parse} from "fast-url-parser";
import {existsSync, mkdirSync, rmdirSync, statSync} from "fs";
import memoized from "nano-memoize";
import path, {posix} from "path";
import resolve, {Opts} from "resolve";
import log from "@moderno/logger";
import {generateCjsProxy, parseCjsReady} from "./cjs-entry-proxy";
import {collectEntryModules} from "./entry-modules";
import {isBare, parseModuleUrl, pathnameToModuleUrl} from "./es-import-utils";
import {generateEsmProxy, parseEsmReady} from "./esm-entry-proxy";
import {ImportResolver, WebModulesFactory, WebModulesOptions} from "./index";
import {useNotifications} from "./notifications";
import {replaceRequire} from "./replace-require";
import {closestManifest, readImportMap, stripExt, writeImportMap} from "./utility";
import {readWorkspaces} from "./workspaces";

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

    const importMap = {
        imports: {
            ...readImportMap(options.rootDir, outDir).imports,
            ...readWorkspaces(options.rootDir).imports
        }
    };

    const squash = new Set<string>(options.squash);
    const entryModules = collectEntryModules(resolveOptions, squash);
    const isModule = /\.m?[tj]sx?$/;

    const ignore = function () {
    };

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
            let [module, filename] = parseModuleUrl(pathname);
            if (module && !importMap.imports[module]) {
                await bundleWebModule(module);
                resolved = importMap.imports[module];
            }
            if (filename) {
                let ext = posix.extname(filename);
                if (!ext) {
                    const basedir = importer ? path.dirname(importer) : options.rootDir;
                    filename = resolveFilename(module, filename, basedir);
                    ext = path.extname(filename);
                }
                const type = importer ? resolveModuleType(ext, importer) : null;
                if (type) {
                    search = search ? `?type=${type}&${search.slice(1)}` : `?type=${type}`;
                }
                if (module) {
                    if (ext === ".js" || ext === ".mjs") {
                        let bundled = importMap.imports[posix.join(module, filename)];
                        if (bundled) {
                            resolved = bundled;
                        } else {
                            let target = `${module}/${filename}`;
                            await bundleWebModule(target);
                            resolved = `/web_modules/${target}`;
                        }
                    } else {
                        resolved = `/node_modules/${module}/${filename}`;
                    }
                } else {
                    resolved = filename;
                }
            }
        }

        if (search) {
            return resolved + search;
        } else {
            return resolved;
        }
    };

    function resolveFilename(module: string | null, filename: string, basedir: string): string {
        let pathname, resolved;
        if (module) {
            pathname = resolve.sync(`${module}/${filename}`, resolveOptions);
            resolved = parseModuleUrl(pathnameToModuleUrl(pathname))[1]!;
        } else {
            pathname = path.join(basedir, filename);
            resolved = filename;
        }
        try {
            let stats = statSync(pathname);
            if (stats.isDirectory()) {
                pathname = path.join(pathname, "index");
                for (const ext of options.resolve.extensions!) {
                    if (existsSync(pathname + ext)) {
                        return `${resolved}/index${ext}`;
                    }
                }
            }
            return resolved;
        } catch (ignored) {
            for (const ext of options.resolve.extensions!) {
                if (existsSync(pathname + ext)) {
                    return `${resolved}${ext}`;
                }
            }
            return resolved;
        }
    }

    function resolveModuleType(ext: string, importer: string): string | null {
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

    let esbuild: Service;

    let stylePlugin = sassPlugin({
        basedir: options.rootDir,
        cache: false,
        type: "style"
    });

    let ready = Promise.all([
        startService(),
        parseCjsReady,
        parseEsmReady
    ]).then(([service]) => esbuild = service);

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
            let entryUrl = pathnameToModuleUrl(entryFile);
            let pkg = closestManifest(entryFile);
            let isESM = pkg.module || pkg["jsnext:main"]
                || entryFile.endsWith(".mjs")
                || entryFile.indexOf("\\es\\") > 0
                || entryFile.indexOf("\\esm\\") > 0;

            const [entryModule, pathname] = parseModuleUrl(source);
            if (entryModule && !importMap.imports[entryModule] && entryModule !== source) {
                await bundleWebModule(entryModule);
            }

            let outName = `${stripExt(source)}.js`;
            let outUrl = `/web_modules/${outName}`;
            let outFile = path.join(outDir, outName);

            if (pathname) {

                await (esbuild || await ready).build({
                    ...options.esbuild,
                    entryPoints: [entryUrl],
                    outfile: outFile,
                    plugins: [stylePlugin, {
                        name: "web_modules",
                        setup(build) {
                            build.onResolve({filter: /./}, async ({path: url, importer}) => {
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

                // NOTE: externals are disabled at the moment
                if (external.size) {
                    log.warn(`${source} has ${external.size} externals: ${external.size < 20 ? entryProxy.external : "..."}`);
                }

                await (esbuild || await ready).build({
                    ...options.esbuild,
                    stdin: {
                        contents: entryProxy.code,
                        resolveDir: options.rootDir,
                        sourcefile: `entry-proxy`,
                        loader: "js"
                    },
                    outfile: outFile,
                    plugins: [stylePlugin, {
                        name: "web_modules",
                        setup(build) {
                            build.onResolve({filter: /./}, async ({path: url, importer}) => {
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
                                if (external.has(url) && false) {
                                    let bareUrl = resolveToBareUrl(importer, url);
                                    return {
                                        path: `/web_modules/${bareUrl}`,
                                        external: true,
                                        namespace: "web_modules"
                                    };
                                }
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
