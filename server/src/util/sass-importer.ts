import babel from "@babel/core";
import fs from "fs";
import memoized from "nano-memoize";
import {ImporterReturnType, SyncContext, SyncImporter} from "node-sass";
import path from "path";
import log from "@moderno/logger";

const EXTENSIONS = new Set([".scss", ".sass", ".css"]);
const PATHS = [];

export const useSassImporter = memoized(config => {

    const realpathSyncImpl = typeof fs.realpathSync.native === "function" ? fs.realpathSync.native : fs.realpathSync;

    function realpathSync(x) {
        try {
            return realpathSyncImpl(x);
        } catch (realpathErr) {
            if (realpathErr.code !== "ENOENT") throw realpathErr;
        }
        return x;
    }

    function isFile(file) {
        try {
            const stat = fs.statSync(file);
            return stat.isFile() || stat.isFIFO();
        } catch (e) {
            if (e && (e.code === "ENOENT" || e.code === "ENOTDIR")) return false;
            throw e;
        }
    }

    function isDirectory(dir) {
        try {
            const stat = fs.statSync(dir);
            return stat.isDirectory();
        } catch (e) {
            if (e && (e.code === "ENOENT" || e.code === "ENOTDIR")) return false;
            throw e;
        }
    }

    function flatMap(obj) {
        const result: [string, string][] = [];
        Object.entries<CSSRule | string>(obj).forEach(entry => {
            const [key, value] = entry;
            if (typeof value === "string") {
                result.push([key, value]);
            } else {
                const cssText = value.cssText;
                if (cssText) {
                    result.push([key, cssText]);
                } else {
                    for (const [k, v] of flatMap(value)) {
                        result.push([`${key}-${k}`, v]);
                    }
                }
            }
        });
        return result;
    }

    class IIFE {

        static MOCK_MODULES = {
            litElement: {
                css: (strings, ...values) => ({
                    cssText: values.reduce((acc, v, idx) => acc + v + strings[idx + 1], strings[0])
                })
            }
        };

        static BABEL_OPTIONS = {
            plugins: [require("./sass-babel-plugin-iife")]
        };

        default?: string;

        constructor(mocks = null) {
            Object.assign(this, IIFE.MOCK_MODULES, mocks);
        }

        import(pathname) {
            const source = fs.readFileSync(pathname, "utf-8");
            const out = babel.transformSync(source, IIFE.BABEL_OPTIONS);
            if (out?.code) {
                eval(out.code);
            }
            return this.default;
        }
    }


    const nodeModulesPaths = require("resolve/lib/node-modules-paths");

    class Resolver {

        private basedir: string;
        private filename: string;
        private paths: string[];
        private extensions: Set<string>;

        constructor(options?: {
            basedir: string
            filename: string
            extensions?: string[]
            paths?: string[]
        }) {
            this.basedir = options?.basedir ?? process.cwd();
            this.filename = options?.filename ?? "stdin";
            this.extensions = options?.extensions ? new Set(options.extensions) : EXTENSIONS;
            this.paths = options?.paths ?? PATHS;
        }

        resolve(url) {

            const parent = this.filename !== "stdin" ? this.filename : this.basedir;
            const root = realpathSync(path.resolve(this.basedir));

            let m;
            if (url.startsWith("~")) {
                m = this.loadNodeModulesSync(url.substring(1), root);
            } else {
                var res = path.resolve(root, url);
                if (url === "." || url === ".." || url.slice(-1) === "/") {
                    res += "/";
                }
                m = this.loadAsFileSync(res) || this.loadAsDirectorySync(res) || this.loadNodeModulesSync(url, root);
            }
            if (m) {
                return realpathSync(m);
            }
            // else {
            //     var err = new Error("Cannot find module '" + url + "' from '" + parent + "'");
            //     err.code = "MODULE_NOT_FOUND";
            //     throw err;
            // }
        }

        loadAsFileSync(pathname) {

            if (isFile(pathname)) return pathname;

            const e = pathname.lastIndexOf(path.sep) + 1;
            const f = `${pathname.slice(0, e)}_${pathname.slice(e)}`;

            if (isFile(f)) return f;

            let file;
            for (const ext of this.extensions) {
                file = pathname + ext;
                if (isFile(file)) return file;
                file = f + ext;
                if (isFile(file)) return file;
            }
        }

        loadAsDirectorySync(pathname) {

            const pkgfile = path.join(isDirectory(pathname) ? realpathSync(pathname) : pathname, "/package.json");

            if (isFile(pkgfile)) {
                try {
                    var pkg = JSON.parse(fs.readFileSync(pkgfile, "utf-8"));
                } catch (ignored) {
                }
                if (pkg) {
                    let main = pkg.sass || pkg.style || pkg.main;
                    if (typeof main !== "string") {
                        const mainError = new TypeError("package “" + pkg.name + "” `sass, style or main` is not a string");
                        mainError["code"] = "INVALID_PACKAGE_MAIN";
                        throw mainError;
                    }
                    if (main === "." || main === "./") {
                        main = "index";
                    }
                    try {
                        const m = this.loadAsFileSync(path.resolve(pathname, main));
                        if (m) return m;
                        const n = this.loadAsDirectorySync(path.resolve(pathname, main));
                        if (n) return n;
                    } catch (e) {
                    }
                }
            }
            return this.loadAsFileSync(path.join(pathname, "/styles.scss"));
        }

        loadNodeModulesSync(url, start) {
            for (let dir of nodeModulesPaths(start, this, url)) {
                dir = path.join(dir, url);
                if (isDirectory(path.dirname(dir))) {
                    if (isDirectory(dir)) {
                        return this.loadAsDirectorySync(dir);
                    } else {
                        return this.loadAsFileSync(dir);
                    }
                }
            }
        }
    }

    function sassImporter(basefile: string):SyncImporter {
        return function (this: SyncContext, url: string, file: string): ImporterReturnType {
            const filename = file === "stdin" ? basefile : file;
            const basedir = path.resolve(config.rootDir, path.dirname(filename));
            const ext = url.substring(url.lastIndexOf("."));
            if (ext !== url && !EXTENSIONS.has(ext)) {
                const resolver = new Resolver({
                    basedir,
                    filename: file,
                    extensions: [ext]
                });
                const resolved = resolver.resolve(url);
                if (resolved) {
                    let obj;
                    if (ext === ".json") {
                        obj = require(resolved);
                    } else if (ext === ".js") {
                        obj = new IIFE().import(resolved);
                    }
                    const variables = flatMap(obj).map(([key, value]) => `$${key}: ${value};`).join("\n");
                    return {contents: variables};
                } else {
                    log.error("cannot resolve sass import:", url);
                    return null;
                }
            } else {
                const resolver = new Resolver({
                    basedir,
                    filename: file
                });
                const resolved = resolver.resolve(url);
                if (resolved) {
                    const ext = resolved.substring(resolved.lastIndexOf("."));
                    if (".css" === ext) {
                        return {contents: fs.readFileSync(resolved, "utf-8")};
                    } else {
                        return {file: resolved};
                    }
                } else {
                    log.error("cannot resolve sass import:", url);
                    return null;
                }
            }
        };
    }

    return {sassImporter};
});
