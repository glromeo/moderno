"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configure = exports.defaultOptions = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const logger_1 = __importDefault(require("@moderno/logger"));
function loadConfig(pathname) {
    try {
        let config = require(path_1.default.resolve(pathname));
        if (config.extends) {
            const base = config.extends;
            delete config.extends;
            config = assignConfig(base, config);
        }
        return config;
    }
    catch (error) {
        logger_1.default.error(`Unable to load config '${pathname}' from '${process.cwd()}'\n`, error);
        process.exit(1);
    }
}
function resolveConfig(pathname) {
    try {
        return require.resolve(path_1.default.resolve(pathname));
    }
    catch (ignored) {
        return null;
    }
}
function assignConfig(target, source) {
    if (source !== undefined && source !== null) {
        if (target instanceof Array && source instanceof Array) {
            const merged = new Set(target);
            for (const item of source) {
                merged.add(item);
            }
            target.length = 0;
            target.push(...merged);
        }
        else if (target instanceof Object && source instanceof Object) {
            for (const [k, v] of Object.entries(source)) {
                if (target[k] && (v.constructor === Object || v.constructor === Array)) {
                    assignConfig(target[k], v);
                }
                else {
                    target[k] = v;
                }
            }
        }
    }
}
function statDirectory(pathname) {
    try {
        return fs_1.default.statSync(pathname);
    }
    catch (ignored) {
        throw new Error(`ENOENT: no such file or directory '${pathname}'`);
    }
}
function resolveDirectory(name) {
    const pathname = path_1.default.resolve(name);
    if (!statDirectory(pathname).isDirectory()) {
        throw new Error(`ENODIR: not a directory '${pathname}'`);
    }
    return pathname;
}
function defaultOptions(args) {
    const baseDir = path_1.default.resolve(__dirname, "..");
    const rootDir = args.root ? resolveDirectory(args.root) : process.cwd();
    const readTextFileSync = (filename) => {
        try {
            return fs_1.default.readFileSync(path_1.default.resolve(rootDir, filename), "utf-8");
        }
        catch (ignored) {
            return fs_1.default.readFileSync(path_1.default.resolve(baseDir, filename), "utf-8");
        }
    };
    return Object.assign({
        rootDir,
        log: {
            level: "info"
        },
        http2: "push",
        server: {
            protocol: "https",
            host: "localhost",
            port: 3000,
            options: {
                get key() {
                    return readTextFileSync("cert/localhost.key");
                },
                get cert() {
                    return readTextFileSync("cert/localhost.crt");
                },
                allowHTTP1: true
            }
        },
        resources: path_1.default.resolve(baseDir, "resources"),
        watcher: {
            cwd: rootDir,
            atomic: false,
            ignored: [
                "node_modules/**",
                "web_modules/**"
            ]
        },
        router: {
            ignoreTrailingSlash: true,
            allowUnsafeRegex: true
        },
        middleware: [],
        proxy: {
            "/api": { target: "http://localhost:9000" }
        },
        cors: {
            origin: "*",
            methods: "GET, HEAD, PUT, POST, DELETE, PATCH",
            allowedHeaders: "X-Requested-With, Accept, Content-Type",
            credentials: true
        },
        cache: true,
        deflate: true,
        etag: {
            weak: false
        },
        mount: {
            "/": rootDir
        },
        babel: {
            babelrc: true,
            caller: {
                name: "@moderno/server",
                supportsStaticESM: true
            },
            sourceType: "module",
            sourceMaps: true,
            plugins: [
                ["@babel/plugin-syntax-import-meta"],
                ["@babel/plugin-transform-runtime", {
                        "corejs": false,
                        "helpers": true,
                        "regenerator": false,
                        "useESModules": true,
                        "absoluteRuntime": false,
                        "version": "7.10.5"
                    }]
            ]
        },
        sass: {
            extensions: [".scss", ".css", ".sass"],
            outputStyle: "expanded",
            HMR: true
        }
    }, require("@moderno/web-modules/web-modules.config.js"));
}
exports.defaultOptions = defaultOptions;
function configure(args = {}, override) {
    let options = defaultOptions(args);
    if (args.config) {
        assignConfig(options, loadConfig(args.config));
    }
    else {
        const rootConfig = resolveConfig(path_1.default.join(options.rootDir, "moderno.config"));
        const localConfig = resolveConfig("moderno.config");
        if (rootConfig) {
            if (localConfig !== rootConfig) {
                assignConfig(options, loadConfig(rootConfig));
            }
        }
        else {
            logger_1.default.debug(`no config found in '${options.rootDir}'`);
        }
        if (localConfig) {
            assignConfig(options, loadConfig(localConfig));
        }
        else {
            logger_1.default.debug(`no config found in '${process.cwd()}'`);
        }
    }
    if (override) {
        assignConfig(options, override);
    }
    const plugins = options.plugins || [];
    if (args.plugin) {
        const names = Array.isArray(args.plugin) ? args.plugin : [args.plugin];
        for (const name of names)
            try {
                plugins.push(require.resolve(name, { paths: [options.rootDir] }));
            }
            catch (error) {
                try {
                    plugins.push(require.resolve(name, { paths: [__dirname] }));
                }
                catch (error) {
                    logger_1.default.error("plugin '" + name + "' resolution failed:", error);
                    process.exit(1);
                }
            }
    }
    for (let plugin of plugins)
        try {
            if (typeof plugin === "string") {
                plugin = require(plugin);
            }
            if (plugin.extends) {
                assignConfig(plugin.extends, plugin);
                plugin = plugin.extends;
                delete plugin.extends;
            }
            assignConfig(options, plugin);
        }
        catch (error) {
            logger_1.default.error("plugin '" + plugin + "' loading failed:", error);
            process.exit(1);
        }
    if (options.log) {
        Object.assign(logger_1.default, options.log);
    }
    if (args.debug) {
        logger_1.default.level = "debug";
    }
    logger_1.default.debug("configured:", options);
    return options;
}
exports.configure = configure;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlndXJlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2NvbmZpZ3VyZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFNQSw0Q0FBb0I7QUFHcEIsZ0RBQXdCO0FBQ3hCLDZEQUFrQztBQXlDbEMsU0FBUyxVQUFVLENBQUMsUUFBZ0I7SUFDaEMsSUFBSTtRQUNBLElBQUksTUFBTSxHQUFHLE9BQU8sQ0FBQyxjQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFDN0MsSUFBSSxNQUFNLENBQUMsT0FBTyxFQUFFO1lBQ2hCLE1BQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUM7WUFDNUIsT0FBTyxNQUFNLENBQUMsT0FBTyxDQUFDO1lBQ3RCLE1BQU0sR0FBRyxZQUFZLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1NBQ3ZDO1FBQ0QsT0FBTyxNQUFNLENBQUM7S0FDakI7SUFBQyxPQUFPLEtBQUssRUFBRTtRQUNaLGdCQUFHLENBQUMsS0FBSyxDQUFDLDBCQUEwQixRQUFRLFdBQVcsT0FBTyxDQUFDLEdBQUcsRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDbEYsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUNuQjtBQUNMLENBQUM7QUFFRCxTQUFTLGFBQWEsQ0FBQyxRQUFnQjtJQUNuQyxJQUFJO1FBQ0EsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLGNBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztLQUNsRDtJQUFDLE9BQU8sT0FBTyxFQUFFO1FBQ2QsT0FBTyxJQUFJLENBQUM7S0FDZjtBQUNMLENBQUM7QUFFRCxTQUFTLFlBQVksQ0FBSSxNQUFTLEVBQUUsTUFBVztJQUMzQyxJQUFJLE1BQU0sS0FBSyxTQUFTLElBQUksTUFBTSxLQUFLLElBQUksRUFBRTtRQUN6QyxJQUFJLE1BQU0sWUFBWSxLQUFLLElBQUksTUFB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LE1BQU0sQ0FBbUIsQ0FBQzthQUM5QztZQUNELElBQUksTUFBTSxDQUFDLE9BQU8sRUFBRTtnQkFDaEIsWUFBWSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBQ3JDLE1BQU0sR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDO2dCQUN4QixPQUFPLE1BQU0sQ0FBQyxPQUFPLENBQUM7YUFDekI7WUFDRCxZQUFZLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1NBQ2pDO1FBQUMsT0FBTyxLQUFLLEVBQUU7WUFDWixnQkFBRyxDQUFDLEtBQUssQ0FBQyxVQUFVLEdBQUcsTUFBTSxHQUFHLG1CQUFtQixFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzVELE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDbkI7SUFFRCxJQUFJLE9BQU8sQ0FBQyxHQUFHLEVBQUU7UUFDYixNQUFNLENBQUMsTUFBTSxDQUFDLGdCQUFHLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0tBQ25DO0lBRUQsSUFBSSxJQUFJLENBQUMsS0FBSyxFQUFFO1FBQ1osZ0JBQUcsQ0FBQyxLQUFLLEdBQUcsT0FBTyxDQUFDO0tBQ3ZCO0lBRUQsZ0JBQUcsQ0FBQyxLQUFLLENBQUMsYUFBYSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBRWxDLE9BQU8sT0FBTyxDQUFDO0FBQ25CLENBQUM7QUFyRUQsOEJBcUVDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtUcmFuc2Zvcm1PcHRpb25zfSBmcm9tIFwiQGJhYmVsL2NvcmVcIjtcbmltcG9ydCB7RlNXYXRjaGVyLCBXYXRjaE9wdGlvbnN9IGZyb20gXCJjaG9raWRhclwiO1xuaW1wb3J0IHtDb3JzT3B0aW9uc30gZnJvbSBcImNvcnNcIjtcbmltcG9ydCB7V2ViTW9kdWxlc09wdGlvbnN9IGZyb20gXCJAbW9kZXJuby93ZWItbW9kdWxlc1wiO1xuaW1wb3J0IHtPcHRpb25zfSBmcm9tIFwiZXRhZ1wiO1xuaW1wb3J0IFJvdXRlciwge0hUVFBWZXJzaW9ufSBmcm9tIFwiZmluZC1teS13YXlcIjtcbmltcG9ydCBmcyBmcm9tIFwiZnNcIjtcbmltcG9ydCBTZXJ2ZXIgZnJvbSBcImh0dHAtcHJveHlcIjtcbmltcG9ydCB7U3luY09wdGlvbnN9IGZyb20gXCJub2RlLXNhc3NcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgbG9nIGZyb20gXCJAbW9kZXJuby9sb2dnZXJcIjtcbmltcG9ydCB7U2VydmVyT3B0aW9uc30gZnJvbSBcIi4vc2VydmVyXCI7XG5pbXBvcnQge01lc3NhZ2luZ09wdGlvbnN9IGZyb20gXCIuL21lc3NhZ2luZ1wiO1xuXG5leHBvcnQgdHlwZSBGaW5kTXlXYXlNaWRkbGV3YXJlID0gKFxuICAgIHJvdXRlcjogUm91dGVyLkluc3RhbmNlPEhUVFBWZXJzaW9uLlYxIHwgSFRUUFZlcnNpb24uVjI+LFxuICAgIG9wdGlvbnM6IE1vZGVybm9PcHRpb25zLFxuICAgIHdhdGNoZXI6IEZTV2F0Y2hlclxuKSA9PiB2b2lkO1xuXG5leHBvcnQgdHlwZSBNb2Rlcm5vT3B0aW9ucyA9IFdlYk1vZHVsZXNPcHRpb25zICYge1xuICAgIGV4dGVuZHM/OiBNb2Rlcm5vT3B0aW9uc1xuICAgIHJvb3REaXI6IHN0cmluZ1xuICAgIGxvZz86IHtcbiAgICAgICAgbGV2ZWw6IFwidHJhY2VcIiB8IFwiZGVidWdcIiB8IFwiaW5mb1wiIHwgXCJ3YXJuXCIgfCBcImVycm9yXCIgfCBcIm5vdGhpbmdcIlxuICAgICAgICBkZXRhaWxzPzogYm9vbGVhblxuICAgICAgICBjb21wYWN0PzogYm9vbGVhblxuICAgIH1cbiAgICBodHRwMj86IFwicHVzaFwiIHwgXCJwcmVsb2FkXCIgfCBmYWxzZVxuICAgIHNlcnZlcj86IFNlcnZlck9wdGlvbnNcbiAgICByZXNvdXJjZXM6IHN0cmluZ1xuICAgIHdhdGNoZXI/OiBXYXRjaE9wdGlvbnNcbiAgICByb3V0ZXI6IFJvdXRlci5Db25maWc8SFRUUFZlcnNpb24uVjEgfCBIVFRQVmVyc2lvbi5WMj5cbiAgICBtaWRkbGV3YXJlOiBGaW5kTXlXYXlNaWRkbGV3YXJlW11cbiAgICBwcm94eTogeyBbcGF0aDogc3RyaW5nXTogU2VydmVyLlNlcnZlck9wdGlvbnMgfVxuICAgIGNvcnM6IENvcnNPcHRpb25zXG4gICAgZXRhZzogT3B0aW9uc1xuICAgIGNhY2hlPzogYm9vbGVhblxuICAgIGVuY29kaW5nOiBcImd6aXBcIiB8IFwiYnJvdGxpXCIgfCBcImJyXCIgfCBcImRlZmxhdGVcIiB8IFwiZGVmbGF0ZS1yYXdcIiB8IHVuZGVmaW5lZFxuICAgIHRyYW5zZm9ybToge1xuICAgICAgICBpbmNsdWRlOiBzdHJpbmcgfCBzdHJpbmdbXVxuICAgICAgICBleGNsdWRlOiBzdHJpbmcgfCBzdHJpbmdbXVxuICAgICAgICBwcmVQcm9jZXNzPyhmaWxlbmFtZTogc3RyaW5nLCBjb2RlOiBzdHJpbmcpOiBzdHJpbmdcbiAgICB9XG4gICAgbW91bnQ6IHsgW3BhdGg6IHN0cmluZ106IHN0cmluZyB9XG4gICAgYmFiZWw6IFRyYW5zZm9ybU9wdGlvbnNcbiAgICBzYXNzOiBTeW5jT3B0aW9ucyAmIHsgSE1SOiBib29sZWFuIH1cbiAgICBtZXNzYWdpbmc/OiBNZXNzYWdpbmdPcHRpb25zXG4gICAgcGx1Z2luczogKE1vZGVybm9PcHRpb25zfHN0cmluZylbXVxufVxuXG5mdW5jdGlvbiBsb2FkQ29uZmlnKHBhdGhuYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIHRyeSB7XG4gICAgICAgIGxldCBjb25maWcgPSByZXF1aXJlKHBhdGgucmVzb2x2ZShwYXRobmFtZSkpO1xuICAgICAgICBpZiAoY29uZmlnLmV4dGVuZHMpIHtcbiAgICAgICAgICAgIGNvbnN0IGJhc2UgPSBjb25maWcuZXh0ZW5kcztcbiAgICAgICAgICAgIGRlbGV0ZSBjb25maWcuZXh0ZW5kcztcbiAgICAgICAgICAgIGNvbmZpZyA9IGFzc2lnbkNvbmZpZyhiYXNlLCBjb25maWcpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjb25maWc7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgbG9nLmVycm9yKGBVbmFibGUgdG8gbG9hZCBjb25maWcgJyR7cGF0aG5hbWV9JyBmcm9tICcke3Byb2Nlc3MuY3dkKCl9J1xcbmAsIGVycm9yKTtcbiAgICAgICAgcHJvY2Vzcy5leGl0KDEpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gcmVzb2x2ZUNvbmZpZyhwYXRobmFtZTogc3RyaW5nKTogc3RyaW5nIHwgbnVsbCB7XG4gICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIHJlcXVpcmUucmVzb2x2ZShwYXRoLnJlc29sdmUocGF0aG5hbWUpKTtcbiAgICB9IGNhdGNoIChpZ25vcmVkKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gYXNzaWduQ29uZmlnPFY+KHRhcmdldDogViwgc291cmNlOiBhbnkpIHtcbiAgICBpZiAoc291cmNlICE9PSB1bmRlZmluZWQgJiYgc291cmNlICE9PSBudWxsKSB7XG4gICAgICAgIGlmICh0YXJnZXQgaW5zdGFuY2VvZiBBcnJheSAmJiBzb3VyY2UgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICAgICAgY29uc3QgbWVyZ2VkID0gbmV3IFNldCh0YXJnZXQpO1xuICAgICAgICAgICAgZm9yIChjb25zdCBpdGVtIG9mIHNvdXJjZSkge1xuICAgICAgICAgICAgICAgIG1lcmdlZC5hZGQoaXRlbSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0YXJnZXQubGVuZ3RoID0gMDtcbiAgICAgICAgICAgIHRhcmdldC5wdXNoKC4uLm1lcmdlZCk7XG4gICAgICAgIH0gZWxzZSBpZiAodGFyZ2V0IGluc3RhbmNlb2YgT2JqZWN0ICYmIHNvdXJjZSBpbnN0YW5jZW9mIE9iamVjdCkge1xuICAgICAgICAgICAgZm9yIChjb25zdCBbaywgdl0gb2YgT2JqZWN0LmVudHJpZXM8b2JqZWN0Pihzb3VyY2UpKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRhcmdldFtrXSAmJiAodi5jb25zdHJ1Y3RvciA9PT0gT2JqZWN0IHx8IHYuY29uc3RydWN0b3IgPT09IEFycmF5KSkge1xuICAgICAgICAgICAgICAgICAgICBhc3NpZ25Db25maWcodGFyZ2V0W2tdLCB2KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0YXJnZXRba10gPSB2O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gc3RhdERpcmVjdG9yeShwYXRobmFtZSkge1xuICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBmcy5zdGF0U3luYyhwYXRobmFtZSk7XG4gICAgfSBjYXRjaCAoaWdub3JlZCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEVOT0VOVDogbm8gc3VjaCBmaWxlIG9yIGRpcmVjdG9yeSAnJHtwYXRobmFtZX0nYCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiByZXNvbHZlRGlyZWN0b3J5KG5hbWUpIHtcbiAgICBjb25zdCBwYXRobmFtZSA9IHBhdGgucmVzb2x2ZShuYW1lKTtcbiAgICBpZiAoIXN0YXREaXJlY3RvcnkocGF0aG5hbWUpLmlzRGlyZWN0b3J5KCkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBFTk9ESVI6IG5vdCBhIGRpcmVjdG9yeSAnJHtwYXRobmFtZX0nYCk7XG4gICAgfVxuICAgIHJldHVybiBwYXRobmFtZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRlZmF1bHRPcHRpb25zKGFyZ3M6IEFyZ3MpOiBNb2Rlcm5vT3B0aW9ucyB7XG5cbiAgICBjb25zdCBiYXNlRGlyID0gcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuLlwiKTtcbiAgICBjb25zdCByb290RGlyID0gYXJncy5yb290ID8gcmVzb2x2ZURpcmVjdG9yeShhcmdzLnJvb3QpIDogcHJvY2Vzcy5jd2QoKTtcblxuICAgIGNvbnN0IHJlYWRUZXh0RmlsZVN5bmMgPSAoZmlsZW5hbWUpID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldHVybiBmcy5yZWFkRmlsZVN5bmMocGF0aC5yZXNvbHZlKHJvb3REaXIsIGZpbGVuYW1lKSwgXCJ1dGYtOFwiKTtcbiAgICAgICAgfSBjYXRjaCAoaWdub3JlZCkge1xuICAgICAgICAgICAgcmV0dXJuIGZzLnJlYWRGaWxlU3luYyhwYXRoLnJlc29sdmUoYmFzZURpciwgZmlsZW5hbWUpLCBcInV0Zi04XCIpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHJldHVybiBPYmplY3QuYXNzaWduKHtcbiAgICAgICAgcm9vdERpcixcbiAgICAgICAgbG9nOiB7XG4gICAgICAgICAgICBsZXZlbDogXCJpbmZvXCJcbiAgICAgICAgfSxcbiAgICAgICAgaHR0cDI6IFwicHVzaFwiLFxuICAgICAgICBzZXJ2ZXI6IHtcbiAgICAgICAgICAgIHByb3RvY29sOiBcImh0dHBzXCIsXG4gICAgICAgICAgICBob3N0OiBcImxvY2FsaG9zdFwiLFxuICAgICAgICAgICAgcG9ydDogMzAwMCxcbiAgICAgICAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgICAgICAgICBnZXQga2V5KCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVhZFRleHRGaWxlU3luYyhcImNlcnQvbG9jYWxob3N0LmtleVwiKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGdldCBjZXJ0KCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVhZFRleHRGaWxlU3luYyhcImNlcnQvbG9jYWxob3N0LmNydFwiKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGFsbG93SFRUUDE6IHRydWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgcmVzb3VyY2VzOiBwYXRoLnJlc29sdmUoYmFzZURpciwgXCJyZXNvdXJjZXNcIiksXG4gICAgICAgIHdhdGNoZXI6IHtcbiAgICAgICAgICAgIGN3ZDogcm9vdERpcixcbiAgICAgICAgICAgIGF0b21pYzogZmFsc2UsXG4gICAgICAgICAgICBpZ25vcmVkOiBbXG4gICAgICAgICAgICAgICAgXCJub2RlX21vZHVsZXMvKipcIixcbiAgICAgICAgICAgICAgICBcIndlYl9tb2R1bGVzLyoqXCJcbiAgICAgICAgICAgIF1cbiAgICAgICAgfSxcbiAgICAgICAgcm91dGVyOiB7XG4gICAgICAgICAgICBpZ25vcmVUcmFpbGluZ1NsYXNoOiB0cnVlLFxuICAgICAgICAgICAgYWxsb3dVbnNhZmVSZWdleDogdHJ1ZVxuICAgICAgICB9LFxuICAgICAgICBtaWRkbGV3YXJlOiBbXSxcbiAgICAgICAgcHJveHk6IHtcbiAgICAgICAgICAgIFwiL2FwaVwiOiB7dGFyZ2V0OiBcImh0dHA6Ly9sb2NhbGhvc3Q6OTAwMFwifVxuICAgICAgICB9LFxuICAgICAgICBjb3JzOiB7XG4gICAgICAgICAgICBvcmlnaW46IFwiKlwiLFxuICAgICAgICAgICAgbWV0aG9kczogXCJHRVQsIEhFQUQsIFBVVCwgUE9TVCwgREVMRVRFLCBQQVRDSFwiLFxuICAgICAgICAgICAgYWxsb3dlZEhlYWRlcnM6IFwiWC1SZXF1ZXN0ZWQtV2l0aCwgQWNjZXB0LCBDb250ZW50LVR5cGVcIixcbiAgICAgICAgICAgIGNyZWRlbnRpYWxzOiB0cnVlXG4gICAgICAgIH0sXG4gICAgICAgIGNhY2hlOiB0cnVlLFxuICAgICAgICBkZWZsYXRlOiB0cnVlLFxuICAgICAgICBldGFnOiB7XG4gICAgICAgICAgICB3ZWFrOiBmYWxzZVxuICAgICAgICB9LFxuICAgICAgICBtb3VudDoge1xuICAgICAgICAgICAgXCIvXCI6IHJvb3REaXJcbiAgICAgICAgfSxcbiAgICAgICAgYmFiZWw6IHtcbiAgICAgICAgICAgIGJhYmVscmM6IHRydWUsXG4gICAgICAgICAgICBjYWxsZXI6IHtcbiAgICAgICAgICAgICAgICBuYW1lOiBcIkBtb2Rlcm5vL3NlcnZlclwiLFxuICAgICAgICAgICAgICAgIHN1cHBvcnRzU3RhdGljRVNNOiB0cnVlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc291cmNlVHlwZTogXCJtb2R1bGVcIixcbiAgICAgICAgICAgIHNvdXJjZU1hcHM6IHRydWUsXG4gICAgICAgICAgICBwbHVnaW5zOiBbXG4gICAgICAgICAgICAgICAgW1wiQGJhYmVsL3BsdWdpbi1zeW50YXgtaW1wb3J0LW1ldGFcIl0sXG4gICAgICAgICAgICAgICAgW1wiQGJhYmVsL3BsdWdpbi10cmFuc2Zvcm0tcnVudGltZVwiLCB7XG4gICAgICAgICAgICAgICAgICAgIFwiY29yZWpzXCI6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBcImhlbHBlcnNcIjogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgXCJyZWdlbmVyYXRvclwiOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgXCJ1c2VFU01vZHVsZXNcIjogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgXCJhYnNvbHV0ZVJ1bnRpbWVcIjogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIFwidmVyc2lvblwiOiBcIjcuMTAuNVwiXG4gICAgICAgICAgICAgICAgfV1cbiAgICAgICAgICAgIF1cbiAgICAgICAgfSxcbiAgICAgICAgc2Fzczoge1xuICAgICAgICAgICAgZXh0ZW5zaW9uczogW1wiLnNjc3NcIiwgXCIuY3NzXCIsIFwiLnNhc3NcIl0sXG4gICAgICAgICAgICBvdXRwdXRTdHlsZTogXCJleHBhbmRlZFwiLFxuICAgICAgICAgICAgSE1SOiB0cnVlXG4gICAgICAgIH1cbiAgICB9LCByZXF1aXJlKFwiQG1vZGVybm8vd2ViLW1vZHVsZXMvd2ViLW1vZHVsZXMuY29uZmlnLmpzXCIpKTtcbn1cblxuZXhwb3J0IHR5cGUgQXJncyA9IHtcbiAgICBjb25maWc/OiBzdHJpbmdcbiAgICByb290Pzogc3RyaW5nXG4gICAgcGx1Z2luPzogc3RyaW5nIHwgc3RyaW5nW11cbiAgICBkZWJ1Zz86IGJvb2xlYW5cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbmZpZ3VyZShhcmdzOiBBcmdzID0ge30sIG92ZXJyaWRlPyk6IFJlYWRvbmx5PE1vZGVybm9PcHRpb25zPiB7XG5cbiAgICBsZXQgb3B0aW9uczogTW9kZXJub09wdGlvbnMgPSBkZWZhdWx0T3B0aW9ucyhhcmdzKTtcblxuICAgIGlmIChhcmdzLmNvbmZpZykge1xuICAgICAgICBhc3NpZ25Db25maWcob3B0aW9ucywgbG9hZENvbmZpZyhhcmdzLmNvbmZpZykpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IHJvb3RDb25maWcgPSByZXNvbHZlQ29uZmlnKHBhdGguam9pbihvcHRpb25zLnJvb3REaXIsIFwibW9kZXJuby5jb25maWdcIikpO1xuICAgICAgICBjb25zdCBsb2NhbENvbmZpZyA9IHJlc29sdmVDb25maWcoXCJtb2Rlcm5vLmNvbmZpZ1wiKTtcbiAgICAgICAgaWYgKHJvb3RDb25maWcpIHtcbiAgICAgICAgICAgIGlmIChsb2NhbENvbmZpZyAhPT0gcm9vdENvbmZpZykge1xuICAgICAgICAgICAgICAgIGFzc2lnbkNvbmZpZyhvcHRpb25zLCBsb2FkQ29uZmlnKHJvb3RDb25maWcpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGxvZy5kZWJ1Zyhgbm8gY29uZmlnIGZvdW5kIGluICcke29wdGlvbnMucm9vdERpcn0nYCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGxvY2FsQ29uZmlnKSB7XG4gICAgICAgICAgICBhc3NpZ25Db25maWcob3B0aW9ucywgbG9hZENvbmZpZyhsb2NhbENvbmZpZykpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbG9nLmRlYnVnKGBubyBjb25maWcgZm91bmQgaW4gJyR7cHJvY2Vzcy5jd2QoKX0nYCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAob3ZlcnJpZGUpIHtcbiAgICAgICAgYXNzaWduQ29uZmlnKG9wdGlvbnMsIG92ZXJyaWRlKTtcbiAgICB9XG5cbiAgICBjb25zdCBwbHVnaW5zID0gb3B0aW9ucy5wbHVnaW5zIHx8IFtdO1xuXG4gICAgaWYgKGFyZ3MucGx1Z2luKSB7XG4gICAgICAgIGNvbnN0IG5hbWVzID0gQXJyYXkuaXNBcnJheShhcmdzLnBsdWdpbikgPyBhcmdzLnBsdWdpbiA6IFthcmdzLnBsdWdpbl07XG4gICAgICAgIGZvciAoY29uc3QgbmFtZSBvZiBuYW1lcykgdHJ5IHtcbiAgICAgICAgICAgIHBsdWdpbnMucHVzaChyZXF1aXJlLnJlc29sdmUobmFtZSwge3BhdGhzOiBbb3B0aW9ucy5yb290RGlyXX0pKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgcGx1Z2lucy5wdXNoKHJlcXVpcmUucmVzb2x2ZShuYW1lLCB7cGF0aHM6IFtfX2Rpcm5hbWVdfSkpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBsb2cuZXJyb3IoXCJwbHVnaW4gJ1wiICsgbmFtZSArIFwiJyByZXNvbHV0aW9uIGZhaWxlZDpcIiwgZXJyb3IpO1xuICAgICAgICAgICAgICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZvciAobGV0IHBsdWdpbiBvZiBwbHVnaW5zKSB0cnkge1xuICAgICAgICBpZiAodHlwZW9mIHBsdWdpbiA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgcGx1Z2luID0gcmVxdWlyZShwbHVnaW4pIGFzIE1vZGVybm9PcHRpb25zO1xuICAgICAgICB9XG4gICAgICAgIGlmIChwbHVnaW4uZXh0ZW5kcykge1xuICAgICAgICAgICAgYXNzaWduQ29uZmlnKHBsdWdpbi5leHRlbmRzLCBwbHVnaW4pO1xuICAgICAgICAgICAgcGx1Z2luID0gcGx1Z2luLmV4dGVuZHM7XG4gICAgICAgICAgICBkZWxldGUgcGx1Z2luLmV4dGVuZHM7XG4gICAgICAgIH1cbiAgICAgICAgYXNzaWduQ29uZmlnKG9wdGlvbnMsIHBsdWdpbik7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgbG9nLmVycm9yKFwicGx1Z2luICdcIiArIHBsdWdpbiArIFwiJyBsb2FkaW5nIGZhaWxlZDpcIiwgZXJyb3IpO1xuICAgICAgICBwcm9jZXNzLmV4aXQoMSk7XG4gICAgfVxuXG4gICAgaWYgKG9wdGlvbnMubG9nKSB7XG4gICAgICAgIE9iamVjdC5hc3NpZ24obG9nLCBvcHRpb25zLmxvZyk7XG4gICAgfVxuXG4gICAgaWYgKGFyZ3MuZGVidWcpIHtcbiAgICAgICAgbG9nLmxldmVsID0gXCJkZWJ1Z1wiO1xuICAgIH1cblxuICAgIGxvZy5kZWJ1ZyhcImNvbmZpZ3VyZWQ6XCIsIG9wdGlvbnMpO1xuXG4gICAgcmV0dXJuIG9wdGlvbnM7XG59XG4iXX0=