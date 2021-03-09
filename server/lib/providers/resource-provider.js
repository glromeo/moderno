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
                logger_1.default.trace("retrieved from cache:", chalk_1.default.magenta(url));
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
                    if (!options.cache) {
                        cache.delete(url);
                    }
                    return resource;
                }).catch(function (error) {
                    cache.delete(url);
                    throw error;
                });
                cache.set(url, resource);
            }
            return resource;
        }
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzb3VyY2UtcHJvdmlkZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvcHJvdmlkZXJzL3Jlc291cmNlLXByb3ZpZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLGtEQUEwQjtBQUMxQixnREFBd0I7QUFDeEIsMkJBQWtDO0FBRWxDLGdFQUFvQztBQUNwQyxnREFBd0I7QUFDeEIsNkRBQWtDO0FBRWxDLGtEQUEyRDtBQUMzRCxtREFBa0U7QUFDbEUsaURBQTJDO0FBQzNDLHVDQUFxQztBQUNyQyx3Q0FBc0M7QUFDdEMsNENBQTBDO0FBQzFDLHFDQUFtQztBQWdCdEIsUUFBQSxRQUFRLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUM3QixRQUFBLFFBQVEsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBRTdCLFFBQUEsbUJBQW1CLEdBQUcsc0JBQVEsQ0FBQyxVQUFVLE9BQXVCO0lBRXpFLE1BQU0sS0FBSyxHQUFHLElBQUksR0FBRyxFQUF3QyxDQUFDO0lBQzlELE1BQU0sT0FBTyxHQUFHLElBQUksb0JBQVEsRUFBa0IsQ0FBQztJQUMvQyxNQUFNLFVBQVUsR0FBRyxJQUFJLG9CQUFRLEVBQWtCLENBQUM7SUFFbEQsTUFBTSxFQUFFLEdBQUcsd0JBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUNqQyxNQUFNLE9BQU8sR0FBRyxvQkFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBRXBDLFNBQVMsS0FBSyxDQUFDLFFBQWdCLEVBQUUsR0FBVztRQUN4QyxNQUFNLFFBQVEsR0FBRyxjQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDMUQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUU7WUFDeEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztTQUN6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LFFBQVEsRUFBRSxHQUFHLENBQUMsQ0FBQzt3QkFDOUIsSUFBSSxRQUFRLENBQUMsS0FBSyxFQUFFOzRCQUNoQixLQUFLLE1BQU0sUUFBUSxJQUFJLFFBQVEsQ0FBQyxLQUFLO2dDQUFFLEtBQUssQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLENBQUM7eUJBQy9EO3FCQUNKO29CQUNELElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFO3dCQUNoQixLQUFLLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO3FCQUNyQjtvQkFDRCxPQUFPLFFBQVEsQ0FBQztnQkFDcEIsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFVBQVUsS0FBSztvQkFDcEIsS0FBSyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFDbEIsTUFBTSxLQUFLLENBQUM7Z0JBQ2hCLENBQUMsQ0FBQyxDQUFDO2dCQUVILEtBQUssQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLFFBQVEsQ0FBQyxDQUFDO2FBQzVCO1lBQ0QsT0FBTyxRQUFRLENBQUM7UUFDcEIsQ0FBQztLQUNKLENBQUM7QUFDTixDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBjaGFsayBmcm9tIFwiY2hhbGtcIjtcbmltcG9ydCBldGFnIGZyb20gXCJldGFnXCI7XG5pbXBvcnQge3Byb21pc2VzIGFzIGZzfSBmcm9tIFwiZnNcIjtcbmltcG9ydCB7T3V0Z29pbmdIdHRwSGVhZGVyc30gZnJvbSBcImh0dHBcIjtcbmltcG9ydCBtZW1vaXplZCBmcm9tIFwibmFuby1tZW1vaXplXCI7XG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IGxvZyBmcm9tIFwiQG1vZGVybm8vbG9nZ2VyXCI7XG5pbXBvcnQge01vZGVybm9PcHRpb25zfSBmcm9tIFwiLi4vY29uZmlndXJlXCI7XG5pbXBvcnQge1NvdXJjZU1hcCwgdXNlVHJhbnNmb3JtZXJzfSBmcm9tIFwiLi4vdHJhbnNmb3JtZXJzXCI7XG5pbXBvcnQge2NvbnRlbnRUeXBlLCBKU09OX0NPTlRFTlRfVFlQRX0gZnJvbSBcIi4uL3V0aWwvbWltZS10eXBlc1wiO1xuaW1wb3J0IHtNdWx0aU1hcH0gZnJvbSBcIi4uL3V0aWwvbXVsdGktbWFwXCI7XG5pbXBvcnQge3VzZVpsaWJ9IGZyb20gXCIuLi91dGlsL3psaWJcIjtcbmltcG9ydCB7dXNlV2F0Y2hlcn0gZnJvbSBcIi4uL3dhdGNoZXJcIjtcbmltcG9ydCB7dXNlTWVzc2FnaW5nfSBmcm9tIFwiLi4vbWVzc2FnaW5nXCI7XG5pbXBvcnQge3VzZVJvdXRlcn0gZnJvbSBcIi4vcm91dGVyXCI7XG5cblxuZXhwb3J0IHR5cGUgUXVlcnkgPSB7IFtuYW1lOiBzdHJpbmddOiBzdHJpbmcgfTtcblxuZXhwb3J0IHR5cGUgUmVzb3VyY2UgPSB7XG4gICAgcGF0aG5hbWU6IHN0cmluZ1xuICAgIHF1ZXJ5OiBRdWVyeVxuICAgIGZpbGVuYW1lOiBzdHJpbmdcbiAgICBjb250ZW50OiBzdHJpbmcgfCBCdWZmZXJcbiAgICBoZWFkZXJzOiBPdXRnb2luZ0h0dHBIZWFkZXJzXG4gICAgbGlua3M6IHJlYWRvbmx5IHN0cmluZ1tdXG4gICAgd2F0Y2g/OiByZWFkb25seSBzdHJpbmdbXVxuICAgIG9uY2hhbmdlPzogKCkgPT4gdm9pZFxufVxuXG5leHBvcnQgY29uc3QgTk9fTElOS1MgPSBPYmplY3QuZnJlZXplKFtdKTtcbmV4cG9ydCBjb25zdCBOT19RVUVSWSA9IE9iamVjdC5mcmVlemUoe30pO1xuXG5leHBvcnQgY29uc3QgdXNlUmVzb3VyY2VQcm92aWRlciA9IG1lbW9pemVkKGZ1bmN0aW9uIChvcHRpb25zOiBNb2Rlcm5vT3B0aW9ucykge1xuXG4gICAgY29uc3QgY2FjaGUgPSBuZXcgTWFwPHN0cmluZywgUmVzb3VyY2UgfCBQcm9taXNlPFJlc291cmNlPj4oKTtcbiAgICBjb25zdCB3YXRjaGVkID0gbmV3IE11bHRpTWFwPHN0cmluZywgc3RyaW5nPigpO1xuICAgIGNvbnN0IGRlcGVuZGFudHMgPSBuZXcgTXVsdGlNYXA8c3RyaW5nLCBzdHJpbmc+KCk7XG5cbiAgICBjb25zdCB3cyA9IHVzZU1lc3NhZ2luZyhvcHRpb25zKTtcbiAgICBjb25zdCB3YXRjaGVyID0gdXNlV2F0Y2hlcihvcHRpb25zKTtcblxuICAgIGZ1bmN0aW9uIHdhdGNoKGZpbGVuYW1lOiBzdHJpbmcsIHVybDogc3RyaW5nKSB7XG4gICAgICAgIGNvbnN0IHJlbGF0aXZlID0gcGF0aC5yZWxhdGl2ZShvcHRpb25zLnJvb3REaXIsIGZpbGVuYW1lKTtcbiAgICAgICAgaWYgKCF3YXRjaGVkLmhhcyhyZWxhdGl2ZSkpIHtcbiAgICAgICAgICAgIHdhdGNoZXIuYWRkKHJlbGF0aXZlKTtcbiAgICAgICAgfVxuICAgICAgICB3YXRjaGVkLmFkZChyZWxhdGl2ZSwgdXJsKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB1bndhdGNoKGZpbGVuYW1lOiBzdHJpbmcsIHVybDogc3RyaW5nIHwgbnVsbCA9IG51bGwpIHtcbiAgICAgICAgaWYgKHVybCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgbGV0IHVybHMgPSB3YXRjaGVkLmdldChmaWxlbmFtZSk7XG4gICAgICAgICAgICBpZiAodXJscykge1xuICAgICAgICAgICAgICAgIHVybHMuZGVsZXRlKHVybCk7XG4gICAgICAgICAgICAgICAgaWYgKCF1cmxzLnNpemUpIHtcbiAgICAgICAgICAgICAgICAgICAgd2F0Y2hlci51bndhdGNoKGZpbGVuYW1lKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB3YXRjaGVkLmRlbGV0ZShmaWxlbmFtZSk7XG4gICAgICAgICAgICB3YXRjaGVyLnVud2F0Y2goZmlsZW5hbWUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgd2F0Y2hlci5vbihcImNoYW5nZVwiLCBmdW5jdGlvbiAoZmlsZW5hbWU6IHN0cmluZykge1xuICAgICAgICBjb25zdCB1cmxzID0gd2F0Y2hlZC5nZXQoZmlsZW5hbWUpO1xuICAgICAgICBpZiAodXJscykge1xuICAgICAgICAgICAgZm9yIChjb25zdCB1cmwgb2YgdXJscykge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc291cmNlID0gY2FjaGUuZ2V0KHVybCk7XG4gICAgICAgICAgICAgICAgaWYgKHJlc291cmNlKSB7XG4gICAgICAgICAgICAgICAgICAgIGxvZy5kZWJ1ZyhcImNoYW5nZTpcIiwgZmlsZW5hbWUsIFwiLT5cIiwgdXJsKTtcbiAgICAgICAgICAgICAgICAgICAgY2FjaGUuc2V0KHVybCwgUHJvbWlzZS5yZXNvbHZlKHJlc291cmNlKS50aGVuKHJlbG9hZCkudGhlbihwaXBlbGluZSkudGhlbihyZXNvdXJjZSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYWNoZS5zZXQodXJsLCByZXNvdXJjZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzb3VyY2U7XG4gICAgICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBsb2cud2FybihcIm5vIGNhY2hlIGVudHJ5IGZvcjpcIiwgdXJsKTtcbiAgICAgICAgICAgICAgICAgICAgdW53YXRjaChmaWxlbmFtZSwgdXJsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgd3MuYnJvYWRjYXN0KFwiaG1yOnVwZGF0ZVwiLCB7dXJsfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsb2cud2FybihcIm5vIHVybHMgZm9yIGZpbGVuYW1lOlwiLCBmaWxlbmFtZSk7XG4gICAgICAgICAgICB1bndhdGNoKGZpbGVuYW1lKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgd2F0Y2hlci5vbihcInVubGlua1wiLCBmdW5jdGlvbiAoZXZlbnQsIGZpbGVuYW1lKSB7XG4gICAgICAgIGNvbnN0IHVybHMgPSB3YXRjaGVkLmdldChmaWxlbmFtZSk7XG4gICAgICAgIGlmICh1cmxzKSBmb3IgKGNvbnN0IHVybCBvZiB1cmxzKSB7XG4gICAgICAgICAgICBsb2cuZGVidWcoXCJ1bmxpbms6XCIsIGZpbGVuYW1lLCBcIi0+XCIsIHVybCk7XG4gICAgICAgICAgICBsZXQgcmVzb3VyY2UgPSBjYWNoZS5nZXQodXJsKTtcbiAgICAgICAgICAgIGlmIChyZXNvdXJjZSAmJiAhKHJlc291cmNlIGluc3RhbmNlb2YgUHJvbWlzZSkpIHtcbiAgICAgICAgICAgICAgICB1bndhdGNoKHJlc291cmNlLmZpbGVuYW1lKTtcbiAgICAgICAgICAgICAgICBpZiAocmVzb3VyY2Uud2F0Y2gpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBmaWxlbmFtZSBvZiByZXNvdXJjZS53YXRjaCkgdW53YXRjaChmaWxlbmFtZSwgdXJsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2FjaGUuZGVsZXRlKHVybCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdW53YXRjaChmaWxlbmFtZSk7XG4gICAgfSk7XG5cbiAgICBjb25zdCB7cm91dGV9ID0gdXNlUm91dGVyKG9wdGlvbnMpO1xuICAgIGNvbnN0IHtzaG91bGRUcmFuc2Zvcm0sIHRyYW5zZm9ybUNvbnRlbnR9ID0gdXNlVHJhbnNmb3JtZXJzKG9wdGlvbnMpO1xuICAgIGNvbnN0IHthcHBseUNvbXByZXNzaW9ufSA9IHVzZVpsaWIob3B0aW9ucyk7XG5cbiAgICAvKipcbiAgICAgKiAgICAgICAgICBfICAgICAgICAgICAgXyBfXG4gICAgICogICAgICAgICAoXykgICAgICAgICAgfCAoXylcbiAgICAgKiAgICBfIF9fICBfIF8gX18gICBfX198IHxfIF8gX18gICBfX19cbiAgICAgKiAgIHwgJ18gXFx8IHwgJ18gXFwgLyBfIFxcIHwgfCAnXyBcXCAvIF8gXFxcbiAgICAgKiAgIHwgfF8pIHwgfCB8XykgfCAgX18vIHwgfCB8IHwgfCAgX18vXG4gICAgICogICB8IC5fXy98X3wgLl9fLyBcXF9fX3xffF98X3wgfF98XFxfX198XG4gICAgICogICB8IHwgICAgIHwgfFxuICAgICAqICAgfF98ICAgICB8X3xcbiAgICAgKlxuICAgICAqIEBwYXJhbSByZXNvdXJjZVxuICAgICAqL1xuICAgIGFzeW5jIGZ1bmN0aW9uIHBpcGVsaW5lKHJlc291cmNlOiBSZXNvdXJjZSkge1xuICAgICAgICBpZiAoc2hvdWxkVHJhbnNmb3JtKHJlc291cmNlKSkge1xuICAgICAgICAgICAgY29uc3Qgc291cmNlTWFwID0gYXdhaXQgdHJhbnNmb3JtQ29udGVudChyZXNvdXJjZSk7XG4gICAgICAgICAgICBpZiAoc291cmNlTWFwKSB7XG4gICAgICAgICAgICAgICAgc3RvcmVTb3VyY2VNYXAocmVzb3VyY2UuZmlsZW5hbWUsIHJlc291cmNlLnBhdGhuYW1lLCByZXNvdXJjZS5xdWVyeSwgc291cmNlTWFwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBhd2FpdCBldGFnSGVhZGVyKHJlc291cmNlKTtcbiAgICAgICAgaWYgKG9wdGlvbnMuZW5jb2RpbmcpIHtcbiAgICAgICAgICAgIGF3YWl0IGNvbXByZXNzQ29udGVudChyZXNvdXJjZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc291cmNlO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHN0b3JlU291cmNlTWFwKGZpbGVuYW1lOiBzdHJpbmcsIHBhdGhuYW1lOiBzdHJpbmcsIHF1ZXJ5OiBRdWVyeSwgbWFwPzogU291cmNlTWFwIHwgbnVsbCkge1xuXG4gICAgICAgIGNvbnN0IGNvbnRlbnQgPSBhcHBseUNvbXByZXNzaW9uKEpTT04uc3RyaW5naWZ5KG1hcCksIFwiZGVmbGF0ZVwiKTtcbiAgICAgICAgY29uc3Qgc291cmNlTWFwVXJsID0gcGF0aG5hbWUgKyBcIi5tYXBcIjtcbiAgICAgICAgY29uc3Qgc291cmNlTWFwRmlsZW5hbWUgPSBmaWxlbmFtZSArIFwiLm1hcFwiO1xuXG4gICAgICAgIGNhY2hlLnNldChzb3VyY2VNYXBVcmwsIHtcbiAgICAgICAgICAgIGZpbGVuYW1lOiBzb3VyY2VNYXBGaWxlbmFtZSxcbiAgICAgICAgICAgIHBhdGhuYW1lOiBzb3VyY2VNYXBVcmwsXG4gICAgICAgICAgICBxdWVyeTogcXVlcnksXG4gICAgICAgICAgICBjb250ZW50OiBjb250ZW50LFxuICAgICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgICAgIFwiY29udGVudC10eXBlXCI6IEpTT05fQ09OVEVOVF9UWVBFLFxuICAgICAgICAgICAgICAgIFwiY29udGVudC1sZW5ndGhcIjogY29udGVudC5sZW5ndGgsIC8vIEJ1ZmZlci5ieXRlTGVuZ3RoKGNvbnRlbnQpLFxuICAgICAgICAgICAgICAgIFwiY29udGVudC1lbmNvZGluZ1wiOiBcImRlZmxhdGVcIixcbiAgICAgICAgICAgICAgICBcImxhc3QtbW9kaWZpZWRcIjogbmV3IERhdGUoKS50b1VUQ1N0cmluZygpLFxuICAgICAgICAgICAgICAgIFwiY2FjaGUtY29udHJvbFwiOiBcIm5vLWNhY2hlXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBsaW5rczogTk9fTElOS1NcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgYXN5bmMgZnVuY3Rpb24gcmVsb2FkKHJlc291cmNlOiBSZXNvdXJjZSk6IFByb21pc2U8UmVzb3VyY2U+IHtcbiAgICAgICAgY29uc3Qgc3RhdHMgPSBhd2FpdCBmcy5zdGF0KHJlc291cmNlLmZpbGVuYW1lKTtcbiAgICAgICAgcmVzb3VyY2UuY29udGVudCA9IGF3YWl0IGZzLnJlYWRGaWxlKHJlc291cmNlLmZpbGVuYW1lKTtcbiAgICAgICAgcmVzb3VyY2UuaGVhZGVyc1tcImNvbnRlbnQtdHlwZVwiXSA9IGNvbnRlbnRUeXBlKHJlc291cmNlLmZpbGVuYW1lKTtcbiAgICAgICAgcmVzb3VyY2UuaGVhZGVyc1tcImNvbnRlbnQtbGVuZ3RoXCJdID0gc3RhdHMuc2l6ZTtcbiAgICAgICAgcmVzb3VyY2UuaGVhZGVyc1tcImxhc3QtbW9kaWZpZWRcIl0gPSBzdGF0cy5tdGltZS50b1VUQ1N0cmluZygpO1xuICAgICAgICByZXR1cm4gcmVzb3VyY2U7XG4gICAgfVxuXG4gICAgYXN5bmMgZnVuY3Rpb24gZXRhZ0hlYWRlcih7aGVhZGVycywgcGF0aG5hbWV9OiBSZXNvdXJjZSkge1xuICAgICAgICBoZWFkZXJzW1wiZXRhZ1wiXSA9IGV0YWcoYCR7cGF0aG5hbWV9ICR7aGVhZGVyc1tcImNvbnRlbnQtbGVuZ3RoXCJdfSAke2hlYWRlcnNbXCJsYXN0LW1vZGlmaWVkXCJdfWAsIG9wdGlvbnMuZXRhZyk7XG4gICAgfVxuXG4gICAgYXN5bmMgZnVuY3Rpb24gY29tcHJlc3NDb250ZW50KHJlc291cmNlOiBSZXNvdXJjZSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmVzb3VyY2UuY29udGVudCA9IGFwcGx5Q29tcHJlc3Npb24ocmVzb3VyY2UuY29udGVudCk7XG4gICAgICAgICAgICByZXNvdXJjZS5oZWFkZXJzID0ge1xuICAgICAgICAgICAgICAgIC4uLihyZXNvdXJjZS5oZWFkZXJzKSxcbiAgICAgICAgICAgICAgICBcImNvbnRlbnQtbGVuZ3RoXCI6IHJlc291cmNlLmNvbnRlbnQubGVuZ3RoLFxuICAgICAgICAgICAgICAgIFwiY29udGVudC1lbmNvZGluZ1wiOiBvcHRpb25zLmVuY29kaW5nXG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGxvZy5lcnJvcihgZmFpbGVkIHRvIGRlZmxhdGUgcmVzb3VyY2U6ICR7cmVzb3VyY2UuZmlsZW5hbWV9YCwgZXJyKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIGFzeW5jIHByb3ZpZGVSZXNvdXJjZSh1cmw6IHN0cmluZyk6IFByb21pc2U8UmVzb3VyY2U+IHtcbiAgICAgICAgICAgIGxldCByZXNvdXJjZSA9IGNhY2hlLmdldCh1cmwpO1xuICAgICAgICAgICAgaWYgKHJlc291cmNlKSB7XG4gICAgICAgICAgICAgICAgbG9nLnRyYWNlKFwicmV0cmlldmVkIGZyb20gY2FjaGU6XCIsIGNoYWxrLm1hZ2VudGEodXJsKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlc291cmNlID0gcm91dGUodXJsKS50aGVuKHBpcGVsaW5lKS50aGVuKHJlc291cmNlID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMuY2FjaGUgJiYgcmVzb3VyY2UuZmlsZW5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhY2hlLnNldCh1cmwsIHJlc291cmNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdhdGNoKHJlc291cmNlLmZpbGVuYW1lLCB1cmwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlc291cmNlLndhdGNoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBmaWxlbmFtZSBvZiByZXNvdXJjZS53YXRjaCkgd2F0Y2goZmlsZW5hbWUsIHVybCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKCFvcHRpb25zLmNhY2hlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYWNoZS5kZWxldGUodXJsKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzb3VyY2U7XG4gICAgICAgICAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhY2hlLmRlbGV0ZSh1cmwpO1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIGNhY2hlLnNldCh1cmwsIHJlc291cmNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZXNvdXJjZTtcbiAgICAgICAgfVxuICAgIH07XG59KTtcblxuIl19