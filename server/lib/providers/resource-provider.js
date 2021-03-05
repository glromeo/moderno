"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useResourceProvider = exports.NO_QUERY = exports.NO_LINKS = void 0;
const chalk_1 = __importDefault(require("chalk"));
const etag_1 = __importDefault(require("etag"));
const fs_1 = require("fs");
const nano_memoize_1 = __importDefault(require("nano-memoize"));
const path_1 = __importDefault(require("path"));
const logger_1 = __importDefault(require("@moderno/logger"));
const transformers_1 = require("../transformers");
const mime_types_1 = require("../util/mime-types");
const multi_map_1 = require("../util/multi-map");
const zlib_1 = require("../util/zlib");
const watcher_1 = require("../watcher");
const messaging_1 = require("../messaging");
const router_1 = require("./router");
exports.NO_LINKS = Object.freeze([]);
exports.NO_QUERY = Object.freeze({});
exports.useResourceProvider = nano_memoize_1.default(function (options) {
    const cache = new Map();
    const watched = new multi_map_1.MultiMap();
    const dependants = new multi_map_1.MultiMap();
    const ws = messaging_1.useMessaging(options);
    const watcher = watcher_1.useWatcher(options);
    function watch(filename, url) {
        const relative = path_1.default.relative(options.rootDir, filename);
        if (!watched.has(relative)) {
            watcher.add(relative);
        }
        watched.add(relative, url);
    }
    function unwatch(filename, url = null) {
        if (url !== null) {
            let urls = watched.get(filename);
            if (urls) {
                urls.delete(url);
                if (!urls.size) {
                    watcher.unwatch(filename);
                }
            }
        }
        else {
            watched.delete(filename);
            watcher.unwatch(filename);
        }
    }
    watcher.on("change", function (filename) {
        const urls = watched.get(filename);
        if (urls) {
            for (const url of urls) {
                const resource = cache.get(url);
                if (resource) {
                    logger_1.default.debug("change:", filename, "->", url);
                    cache.set(url, Promise.resolve(resource).then(reload).then(pipeline).then(resource => {
                        cache.set(url, resource);
                        return resource;
                    }));
                }
                else {
                    logger_1.default.warn("no cache entry for:", url);
                    unwatch(filename, url);
                }
                ws.broadcast("hmr:update", { url });
            }
        }
        else {
            logger_1.default.warn("no urls for filename:", filename);
            unwatch(filename);
        }
    });
    watcher.on("unlink", function (event, filename) {
        const urls = watched.get(filename);
        if (urls)
            for (const url of urls) {
                logger_1.default.debug("unlink:", filename, "->", url);
                let resource = cache.get(url);
                if (resource && !(resource instanceof Promise)) {
                    unwatch(resource.filename);
                    if (resource.watch) {
                        for (const filename of resource.watch)
                            unwatch(filename, url);
                    }
                    cache.delete(url);
                }
            }
        unwatch(filename);
    });
    const { route } = router_1.useRouter(options);
    const { shouldTransform, transformContent } = transformers_1.useTransformers(options);
    const { applyCompression } = zlib_1.useZlib(options);
    /**
     *          _            _ _
     *         (_)          | (_)
     *    _ __  _ _ __   ___| |_ _ __   ___
     *   | '_ \| | '_ \ / _ \ | | '_ \ / _ \
     *   | |_) | | |_) |  __/ | | | | |  __/
     *   | .__/|_| .__/ \___|_|_|_| |_|\___|
     *   | |     | |
     *   |_|     |_|
     *
     * @param resource
     */
    async function pipeline(resource) {
        if (shouldTransform(resource)) {
            const sourceMap = await transformContent(resource);
            if (sourceMap) {
                storeSourceMap(resource.filename, resource.pathname, resource.query, sourceMap);
            }
        }
        await etagHeader(resource);
        if (options.encoding) {
            await compressContent(resource);
        }
        return resource;
    }
    function storeSourceMap(filename, pathname, query, map) {
        const content = applyCompression(JSON.stringify(map), "deflate");
        const sourceMapUrl = pathname + ".map";
        const sourceMapFilename = filename + ".map";
        cache.set(sourceMapUrl, {
            filename: sourceMapFilename,
            pathname: sourceMapUrl,
            query: query,
            content: content,
            headers: {
                "content-type": mime_types_1.JSON_CONTENT_TYPE,
                "content-length": content.length,
                "content-encoding": "deflate",
                "last-modified": new Date().toUTCString(),
                "cache-control": "no-cache"
            },
            links: exports.NO_LINKS
        });
    }
    async function reload(resource) {
        const stats = await fs_1.promises.stat(resource.filename);
        resource.content = await fs_1.promises.readFile(resource.filename);
        resource.headers["content-type"] = mime_types_1.contentType(resource.filename);
        resource.headers["content-length"] = stats.size;
        resource.headers["last-modified"] = stats.mtime.toUTCString();
        return resource;
    }
    async function etagHeader({ headers, pathname }) {
        headers["etag"] = etag_1.default(`${pathname} ${headers["content-length"]} ${headers["last-modified"]}`, options.etag);
    }
    async function compressContent(resource) {
        try {
            resource.content = applyCompression(resource.content);
            resource.headers = {
                ...(resource.headers),
                "content-length": resource.content.length,
                "content-encoding": options.encoding
            };
        }
        catch (err) {
            logger_1.default.error(`failed to deflate resource: ${resource.filename}`, err);
        }
    }
    return {
        async provideResource(url) {
            let resource = cache.get(url);
            if (resource) {
                logger_1.default.debug("retrieved from cache:", chalk_1.default.magenta(url));
            }
            else {
                resource = route(url).then(pipeline).then(resource => {
                    if (options.cache && resource.filename) {
                        cache.set(url, resource);
                        watch(resource.filename, url);
                        if (resource.watch) {
                            for (const filename of resource.watch)
                                watch(filename, url);
                        }
                    }
                    return resource;
                }).finally(function () {
                    if (!options.cache) {
                        cache.delete(url);
                    }
                });
                cache.set(url, resource);
            }
            return resource;
        }
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzb3VyY2UtcHJvdmlkZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvcHJvdmlkZXJzL3Jlc291cmNlLXByb3ZpZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLGtEQUEwQjtBQUMxQixnREFBd0I7QUFDeEIsMkJBQWtDO0FBRWxDLGdFQUFvQztBQUNwQyxnREFBd0I7QUFDeEIsNkRBQWtDO0FBRWxDLGtEQUEyRDtBQUMzRCxtREFBa0U7QUFDbEUsaURBQTJDO0FBQzNDLHVDQUFxQztBQUNyQyx3Q0FBc0M7QUFDdEMsNENBQTBDO0FBQzFDLHFDQUFtQztBQWdCdEIsUUFBQSxRQUFRLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUM3QixRQUFBLFFBQVEsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBRTdCLFFBQUEsbUJBQW1CLEdBQUcsc0JBQVEsQ0FBQyxVQUFVLE9BQXVCO0lBRXpFLE1BQU0sS0FBSyxHQUFHLElBQUksR0FBRyxFQUF3QyxDQUFDO0lBQzlELE1BQU0sT0FBTyxHQUFHLElBQUksb0JBQVEsRUFBa0IsQ0FBQztJQUMvQyxNQUFNLFVBQVUsR0FBRyxJQUFJLG9CQUFRLEVBQWtCLENBQUM7SUFFbEQsTUFBTSxFQUFFLEdBQUcsd0JBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUNqQyxNQUFNLE9BQU8sR0FBRyxvQkFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBRXBDLFNBQVMsS0FBSyxDQUFDLFFBQWdCLEVBQUUsR0FBVztRQUN4QyxNQUFNLFFBQVEsR0FBRyxjQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDMUQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUU7WUFDeEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztTQUN6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LFFBQVEsRUFBRSxHQUFHLENBQUMsQ0FBQzt3QkFDOUIsSUFBSSxRQUFRLENBQUMsS0FBSyxFQUFFOzRCQUNoQixLQUFLLE1BQU0sUUFBUSxJQUFJLFFBQVEsQ0FBQyxLQUFLO2dDQUFFLEtBQUssQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLENBQUM7eUJBQy9EO3FCQUNKO29CQUNELE9BQU8sUUFBUSxDQUFDO2dCQUNwQixDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUM7b0JBQ1AsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUU7d0JBQ2hCLEtBQUssQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7cUJBQ3JCO2dCQUNMLENBQUMsQ0FBQyxDQUFDO2dCQUVILEtBQUssQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLFFBQVEsQ0FBQyxDQUFDO2FBQzVCO1lBQ0QsT0FBTyxRQUFRLENBQUM7UUFDcEIsQ0FBQztLQUNKLENBQUM7QUFDTixDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBjaGFsayBmcm9tIFwiY2hhbGtcIjtcclxuaW1wb3J0IGV0YWcgZnJvbSBcImV0YWdcIjtcclxuaW1wb3J0IHtwcm9taXNlcyBhcyBmc30gZnJvbSBcImZzXCI7XHJcbmltcG9ydCB7T3V0Z29pbmdIdHRwSGVhZGVyc30gZnJvbSBcImh0dHBcIjtcclxuaW1wb3J0IG1lbW9pemVkIGZyb20gXCJuYW5vLW1lbW9pemVcIjtcclxuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0IGxvZyBmcm9tIFwiQG1vZGVybm8vbG9nZ2VyXCI7XHJcbmltcG9ydCB7TW9kZXJub09wdGlvbnN9IGZyb20gXCIuLi9jb25maWd1cmVcIjtcclxuaW1wb3J0IHtTb3VyY2VNYXAsIHVzZVRyYW5zZm9ybWVyc30gZnJvbSBcIi4uL3RyYW5zZm9ybWVyc1wiO1xyXG5pbXBvcnQge2NvbnRlbnRUeXBlLCBKU09OX0NPTlRFTlRfVFlQRX0gZnJvbSBcIi4uL3V0aWwvbWltZS10eXBlc1wiO1xyXG5pbXBvcnQge011bHRpTWFwfSBmcm9tIFwiLi4vdXRpbC9tdWx0aS1tYXBcIjtcclxuaW1wb3J0IHt1c2VabGlifSBmcm9tIFwiLi4vdXRpbC96bGliXCI7XHJcbmltcG9ydCB7dXNlV2F0Y2hlcn0gZnJvbSBcIi4uL3dhdGNoZXJcIjtcclxuaW1wb3J0IHt1c2VNZXNzYWdpbmd9IGZyb20gXCIuLi9tZXNzYWdpbmdcIjtcclxuaW1wb3J0IHt1c2VSb3V0ZXJ9IGZyb20gXCIuL3JvdXRlclwiO1xyXG5cclxuXHJcbmV4cG9ydCB0eXBlIFF1ZXJ5ID0geyBbbmFtZTogc3RyaW5nXTogc3RyaW5nIH07XHJcblxyXG5leHBvcnQgdHlwZSBSZXNvdXJjZSA9IHtcclxuICAgIHBhdGhuYW1lOiBzdHJpbmdcclxuICAgIHF1ZXJ5OiBRdWVyeVxyXG4gICAgZmlsZW5hbWU6IHN0cmluZ1xyXG4gICAgY29udGVudDogc3RyaW5nIHwgQnVmZmVyXHJcbiAgICBoZWFkZXJzOiBPdXRnb2luZ0h0dHBIZWFkZXJzXHJcbiAgICBsaW5rczogcmVhZG9ubHkgc3RyaW5nW11cclxuICAgIHdhdGNoPzogcmVhZG9ubHkgc3RyaW5nW11cclxuICAgIG9uY2hhbmdlPzogKCkgPT4gdm9pZFxyXG59XHJcblxyXG5leHBvcnQgY29uc3QgTk9fTElOS1MgPSBPYmplY3QuZnJlZXplKFtdKTtcclxuZXhwb3J0IGNvbnN0IE5PX1FVRVJZID0gT2JqZWN0LmZyZWV6ZSh7fSk7XHJcblxyXG5leHBvcnQgY29uc3QgdXNlUmVzb3VyY2VQcm92aWRlciA9IG1lbW9pemVkKGZ1bmN0aW9uIChvcHRpb25zOiBNb2Rlcm5vT3B0aW9ucykge1xyXG5cclxuICAgIGNvbnN0IGNhY2hlID0gbmV3IE1hcDxzdHJpbmcsIFJlc291cmNlIHwgUHJvbWlzZTxSZXNvdXJjZT4+KCk7XHJcbiAgICBjb25zdCB3YXRjaGVkID0gbmV3IE11bHRpTWFwPHN0cmluZywgc3RyaW5nPigpO1xyXG4gICAgY29uc3QgZGVwZW5kYW50cyA9IG5ldyBNdWx0aU1hcDxzdHJpbmcsIHN0cmluZz4oKTtcclxuXHJcbiAgICBjb25zdCB3cyA9IHVzZU1lc3NhZ2luZyhvcHRpb25zKTtcclxuICAgIGNvbnN0IHdhdGNoZXIgPSB1c2VXYXRjaGVyKG9wdGlvbnMpO1xyXG5cclxuICAgIGZ1bmN0aW9uIHdhdGNoKGZpbGVuYW1lOiBzdHJpbmcsIHVybDogc3RyaW5nKSB7XHJcbiAgICAgICAgY29uc3QgcmVsYXRpdmUgPSBwYXRoLnJlbGF0aXZlKG9wdGlvbnMucm9vdERpciwgZmlsZW5hbWUpO1xyXG4gICAgICAgIGlmICghd2F0Y2hlZC5oYXMocmVsYXRpdmUpKSB7XHJcbiAgICAgICAgICAgIHdhdGNoZXIuYWRkKHJlbGF0aXZlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgd2F0Y2hlZC5hZGQocmVsYXRpdmUsIHVybCk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gdW53YXRjaChmaWxlbmFtZTogc3RyaW5nLCB1cmw6IHN0cmluZyB8IG51bGwgPSBudWxsKSB7XHJcbiAgICAgICAgaWYgKHVybCAhPT0gbnVsbCkge1xyXG4gICAgICAgICAgICBsZXQgdXJscyA9IHdhdGNoZWQuZ2V0KGZpbGVuYW1lKTtcclxuICAgICAgICAgICAgaWYgKHVybHMpIHtcclxuICAgICAgICAgICAgICAgIHVybHMuZGVsZXRlKHVybCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXVybHMuc2l6ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHdhdGNoZXIudW53YXRjaChmaWxlbmFtZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB3YXRjaGVkLmRlbGV0ZShmaWxlbmFtZSk7XHJcbiAgICAgICAgICAgIHdhdGNoZXIudW53YXRjaChmaWxlbmFtZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHdhdGNoZXIub24oXCJjaGFuZ2VcIiwgZnVuY3Rpb24gKGZpbGVuYW1lOiBzdHJpbmcpIHtcclxuICAgICAgICBjb25zdCB1cmxzID0gd2F0Y2hlZC5nZXQoZmlsZW5hbWUpO1xyXG4gICAgICAgIGlmICh1cmxzKSB7XHJcbiAgICAgICAgICAgIGZvciAoY29uc3QgdXJsIG9mIHVybHMpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHJlc291cmNlID0gY2FjaGUuZ2V0KHVybCk7XHJcbiAgICAgICAgICAgICAgICBpZiAocmVzb3VyY2UpIHtcclxuICAgICAgICAgICAgICAgICAgICBsb2cuZGVidWcoXCJjaGFuZ2U6XCIsIGZpbGVuYW1lLCBcIi0+XCIsIHVybCk7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FjaGUuc2V0KHVybCwgUHJvbWlzZS5yZXNvbHZlKHJlc291cmNlKS50aGVuKHJlbG9hZCkudGhlbihwaXBlbGluZSkudGhlbihyZXNvdXJjZSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhY2hlLnNldCh1cmwsIHJlc291cmNlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc291cmNlO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbG9nLndhcm4oXCJubyBjYWNoZSBlbnRyeSBmb3I6XCIsIHVybCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdW53YXRjaChmaWxlbmFtZSwgdXJsKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHdzLmJyb2FkY2FzdChcImhtcjp1cGRhdGVcIiwge3VybH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgbG9nLndhcm4oXCJubyB1cmxzIGZvciBmaWxlbmFtZTpcIiwgZmlsZW5hbWUpO1xyXG4gICAgICAgICAgICB1bndhdGNoKGZpbGVuYW1lKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICB3YXRjaGVyLm9uKFwidW5saW5rXCIsIGZ1bmN0aW9uIChldmVudCwgZmlsZW5hbWUpIHtcclxuICAgICAgICBjb25zdCB1cmxzID0gd2F0Y2hlZC5nZXQoZmlsZW5hbWUpO1xyXG4gICAgICAgIGlmICh1cmxzKSBmb3IgKGNvbnN0IHVybCBvZiB1cmxzKSB7XHJcbiAgICAgICAgICAgIGxvZy5kZWJ1ZyhcInVubGluazpcIiwgZmlsZW5hbWUsIFwiLT5cIiwgdXJsKTtcclxuICAgICAgICAgICAgbGV0IHJlc291cmNlID0gY2FjaGUuZ2V0KHVybCk7XHJcbiAgICAgICAgICAgIGlmIChyZXNvdXJjZSAmJiAhKHJlc291cmNlIGluc3RhbmNlb2YgUHJvbWlzZSkpIHtcclxuICAgICAgICAgICAgICAgIHVud2F0Y2gocmVzb3VyY2UuZmlsZW5hbWUpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHJlc291cmNlLndhdGNoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBmaWxlbmFtZSBvZiByZXNvdXJjZS53YXRjaCkgdW53YXRjaChmaWxlbmFtZSwgdXJsKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNhY2hlLmRlbGV0ZSh1cmwpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHVud2F0Y2goZmlsZW5hbWUpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc3Qge3JvdXRlfSA9IHVzZVJvdXRlcihvcHRpb25zKTtcclxuICAgIGNvbnN0IHtzaG91bGRUcmFuc2Zvcm0sIHRyYW5zZm9ybUNvbnRlbnR9ID0gdXNlVHJhbnNmb3JtZXJzKG9wdGlvbnMpO1xyXG4gICAgY29uc3Qge2FwcGx5Q29tcHJlc3Npb259ID0gdXNlWmxpYihvcHRpb25zKTtcclxuXHJcbiAgICAvKipcclxuICAgICAqICAgICAgICAgIF8gICAgICAgICAgICBfIF9cclxuICAgICAqICAgICAgICAgKF8pICAgICAgICAgIHwgKF8pXHJcbiAgICAgKiAgICBfIF9fICBfIF8gX18gICBfX198IHxfIF8gX18gICBfX19cclxuICAgICAqICAgfCAnXyBcXHwgfCAnXyBcXCAvIF8gXFwgfCB8ICdfIFxcIC8gXyBcXFxyXG4gICAgICogICB8IHxfKSB8IHwgfF8pIHwgIF9fLyB8IHwgfCB8IHwgIF9fL1xyXG4gICAgICogICB8IC5fXy98X3wgLl9fLyBcXF9fX3xffF98X3wgfF98XFxfX198XHJcbiAgICAgKiAgIHwgfCAgICAgfCB8XHJcbiAgICAgKiAgIHxffCAgICAgfF98XHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHJlc291cmNlXHJcbiAgICAgKi9cclxuICAgIGFzeW5jIGZ1bmN0aW9uIHBpcGVsaW5lKHJlc291cmNlOiBSZXNvdXJjZSkge1xyXG4gICAgICAgIGlmIChzaG91bGRUcmFuc2Zvcm0ocmVzb3VyY2UpKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHNvdXJjZU1hcCA9IGF3YWl0IHRyYW5zZm9ybUNvbnRlbnQocmVzb3VyY2UpO1xyXG4gICAgICAgICAgICBpZiAoc291cmNlTWFwKSB7XHJcbiAgICAgICAgICAgICAgICBzdG9yZVNvdXJjZU1hcChyZXNvdXJjZS5maWxlbmFtZSwgcmVzb3VyY2UucGF0aG5hbWUsIHJlc291cmNlLnF1ZXJ5LCBzb3VyY2VNYXApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGF3YWl0IGV0YWdIZWFkZXIocmVzb3VyY2UpO1xyXG4gICAgICAgIGlmIChvcHRpb25zLmVuY29kaW5nKSB7XHJcbiAgICAgICAgICAgIGF3YWl0IGNvbXByZXNzQ29udGVudChyZXNvdXJjZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByZXNvdXJjZTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBzdG9yZVNvdXJjZU1hcChmaWxlbmFtZTogc3RyaW5nLCBwYXRobmFtZTogc3RyaW5nLCBxdWVyeTogUXVlcnksIG1hcD86IFNvdXJjZU1hcCB8IG51bGwpIHtcclxuXHJcbiAgICAgICAgY29uc3QgY29udGVudCA9IGFwcGx5Q29tcHJlc3Npb24oSlNPTi5zdHJpbmdpZnkobWFwKSwgXCJkZWZsYXRlXCIpO1xyXG4gICAgICAgIGNvbnN0IHNvdXJjZU1hcFVybCA9IHBhdGhuYW1lICsgXCIubWFwXCI7XHJcbiAgICAgICAgY29uc3Qgc291cmNlTWFwRmlsZW5hbWUgPSBmaWxlbmFtZSArIFwiLm1hcFwiO1xyXG5cclxuICAgICAgICBjYWNoZS5zZXQoc291cmNlTWFwVXJsLCB7XHJcbiAgICAgICAgICAgIGZpbGVuYW1lOiBzb3VyY2VNYXBGaWxlbmFtZSxcclxuICAgICAgICAgICAgcGF0aG5hbWU6IHNvdXJjZU1hcFVybCxcclxuICAgICAgICAgICAgcXVlcnk6IHF1ZXJ5LFxyXG4gICAgICAgICAgICBjb250ZW50OiBjb250ZW50LFxyXG4gICAgICAgICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgICAgICAgICBcImNvbnRlbnQtdHlwZVwiOiBKU09OX0NPTlRFTlRfVFlQRSxcclxuICAgICAgICAgICAgICAgIFwiY29udGVudC1sZW5ndGhcIjogY29udGVudC5sZW5ndGgsIC8vIEJ1ZmZlci5ieXRlTGVuZ3RoKGNvbnRlbnQpLFxyXG4gICAgICAgICAgICAgICAgXCJjb250ZW50LWVuY29kaW5nXCI6IFwiZGVmbGF0ZVwiLFxyXG4gICAgICAgICAgICAgICAgXCJsYXN0LW1vZGlmaWVkXCI6IG5ldyBEYXRlKCkudG9VVENTdHJpbmcoKSxcclxuICAgICAgICAgICAgICAgIFwiY2FjaGUtY29udHJvbFwiOiBcIm5vLWNhY2hlXCJcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgbGlua3M6IE5PX0xJTktTXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgZnVuY3Rpb24gcmVsb2FkKHJlc291cmNlOiBSZXNvdXJjZSk6IFByb21pc2U8UmVzb3VyY2U+IHtcclxuICAgICAgICBjb25zdCBzdGF0cyA9IGF3YWl0IGZzLnN0YXQocmVzb3VyY2UuZmlsZW5hbWUpO1xyXG4gICAgICAgIHJlc291cmNlLmNvbnRlbnQgPSBhd2FpdCBmcy5yZWFkRmlsZShyZXNvdXJjZS5maWxlbmFtZSk7XHJcbiAgICAgICAgcmVzb3VyY2UuaGVhZGVyc1tcImNvbnRlbnQtdHlwZVwiXSA9IGNvbnRlbnRUeXBlKHJlc291cmNlLmZpbGVuYW1lKTtcclxuICAgICAgICByZXNvdXJjZS5oZWFkZXJzW1wiY29udGVudC1sZW5ndGhcIl0gPSBzdGF0cy5zaXplO1xyXG4gICAgICAgIHJlc291cmNlLmhlYWRlcnNbXCJsYXN0LW1vZGlmaWVkXCJdID0gc3RhdHMubXRpbWUudG9VVENTdHJpbmcoKTtcclxuICAgICAgICByZXR1cm4gcmVzb3VyY2U7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgZnVuY3Rpb24gZXRhZ0hlYWRlcih7aGVhZGVycywgcGF0aG5hbWV9OiBSZXNvdXJjZSkge1xyXG4gICAgICAgIGhlYWRlcnNbXCJldGFnXCJdID0gZXRhZyhgJHtwYXRobmFtZX0gJHtoZWFkZXJzW1wiY29udGVudC1sZW5ndGhcIl19ICR7aGVhZGVyc1tcImxhc3QtbW9kaWZpZWRcIl19YCwgb3B0aW9ucy5ldGFnKTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBmdW5jdGlvbiBjb21wcmVzc0NvbnRlbnQocmVzb3VyY2U6IFJlc291cmNlKSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgcmVzb3VyY2UuY29udGVudCA9IGFwcGx5Q29tcHJlc3Npb24ocmVzb3VyY2UuY29udGVudCk7XHJcbiAgICAgICAgICAgIHJlc291cmNlLmhlYWRlcnMgPSB7XHJcbiAgICAgICAgICAgICAgICAuLi4ocmVzb3VyY2UuaGVhZGVycyksXHJcbiAgICAgICAgICAgICAgICBcImNvbnRlbnQtbGVuZ3RoXCI6IHJlc291cmNlLmNvbnRlbnQubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgXCJjb250ZW50LWVuY29kaW5nXCI6IG9wdGlvbnMuZW5jb2RpbmdcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgICAgbG9nLmVycm9yKGBmYWlsZWQgdG8gZGVmbGF0ZSByZXNvdXJjZTogJHtyZXNvdXJjZS5maWxlbmFtZX1gLCBlcnIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGFzeW5jIHByb3ZpZGVSZXNvdXJjZSh1cmw6IHN0cmluZyk6IFByb21pc2U8UmVzb3VyY2U+IHtcclxuICAgICAgICAgICAgbGV0IHJlc291cmNlID0gY2FjaGUuZ2V0KHVybCk7XHJcbiAgICAgICAgICAgIGlmIChyZXNvdXJjZSkge1xyXG4gICAgICAgICAgICAgICAgbG9nLmRlYnVnKFwicmV0cmlldmVkIGZyb20gY2FjaGU6XCIsIGNoYWxrLm1hZ2VudGEodXJsKSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXNvdXJjZSA9IHJvdXRlKHVybCkudGhlbihwaXBlbGluZSkudGhlbihyZXNvdXJjZSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMuY2FjaGUgJiYgcmVzb3VyY2UuZmlsZW5hbWUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FjaGUuc2V0KHVybCwgcmVzb3VyY2UpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB3YXRjaChyZXNvdXJjZS5maWxlbmFtZSwgdXJsKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlc291cmNlLndhdGNoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGZpbGVuYW1lIG9mIHJlc291cmNlLndhdGNoKSB3YXRjaChmaWxlbmFtZSwgdXJsKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzb3VyY2U7XHJcbiAgICAgICAgICAgICAgICB9KS5maW5hbGx5KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIW9wdGlvbnMuY2FjaGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FjaGUuZGVsZXRlKHVybCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FjaGUuc2V0KHVybCwgcmVzb3VyY2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiByZXNvdXJjZTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59KTtcclxuXHJcbiJdfQ==