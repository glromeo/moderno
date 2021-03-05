"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useRouter = void 0;
const logger_1 = __importDefault(require("@moderno/logger"));
const web_modules_1 = require("@moderno/web-modules");
const chalk_1 = __importDefault(require("chalk"));
const fast_url_parser_1 = require("fast-url-parser");
const fs_1 = require("fs");
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const path_1 = __importDefault(require("path"));
const mime_types_1 = require("../util/mime-types");
const resource_provider_1 = require("./resource-provider");
function useRouter(options) {
    const { bundleWebModule } = web_modules_1.useWebModules(options);
    const { rootDir = process.cwd(), mount = {} } = options;
    const regExp = /\/[^/?]+/;
    async function resolve(pathname) {
        const match = regExp.exec(pathname);
        if (match) {
            const segment = match[0];
            if (segment === "/web_modules") {
                return { route: segment, filename: path_1.default.join(rootDir, pathname) };
            }
            else if (segment === "/workspaces") {
                return { route: segment, filename: path_1.default.join(rootDir, pathname.substring("/workspaces".length)) };
            }
            else if (mount[segment]) {
                return { route: segment, filename: path_1.default.join(mount[segment], pathname.substring(segment.length)) };
            }
            else if (mount[pathname]) {
                return { route: pathname, filename: "", resource: mount[pathname] };
            }
        }
        return { route: "/", filename: path_1.default.join(rootDir, pathname) };
    }
    async function route(url) {
        let { pathname, query } = fast_url_parser_1.parse(url, true);
        if (pathname.endsWith("ss.js") /* try and support openwc style for module names */) {
            if (pathname.endsWith(".scss.js") || pathname.endsWith(".sass.js") || pathname.endsWith(".css.js")) {
                pathname = pathname.slice(0, -3);
                query.type = "module";
            }
        }
        const { route, filename, resource } = await resolve(pathname);
        if (resource) {
            // @ts-ignore
            return { ...resource, links: resource_provider_1.NO_LINKS };
        }
        const stats = await fs_1.promises.stat(filename).catch(error => {
            if (error.code === "ENOENT") {
                if (route === "/web_modules" && !filename.endsWith(".map")) {
                    logger_1.default.warn("lazy loading:", chalk_1.default.magenta(filename));
                    return bundleWebModule(pathname.substring(13)).then(() => fs_1.promises.stat(filename));
                }
            }
            throw error;
        }).catch(error => {
            if (error.code === "ENOENT") {
                if (pathname === "/favicon.ico") {
                    throw { code: http_status_codes_1.default.PERMANENT_REDIRECT, headers: { "location": "/resources/javascript.png" } };
                }
                else {
                    throw { code: http_status_codes_1.default.NOT_FOUND, message: error.stack };
                }
            }
            else {
                throw { code: http_status_codes_1.default.INTERNAL_SERVER_ERROR, message: error.stack };
            }
        });
        if (stats.isDirectory()) {
            let location;
            try {
                const { home } = require(path_1.default.resolve(filename, "package.json"));
                location = path_1.default.posix.join(pathname, home || "index.html");
            }
            catch (ignored) {
                location = path_1.default.posix.join(pathname, "index.html");
            }
            throw { code: http_status_codes_1.default.PERMANENT_REDIRECT, headers: { "location": location } };
        }
        else {
            return {
                pathname,
                query,
                filename,
                content: await fs_1.promises.readFile(filename),
                headers: {
                    "content-type": mime_types_1.contentType(filename),
                    "content-length": stats.size,
                    "last-modified": stats.mtime.toUTCString(),
                    "cache-control": route === "/web_modules" || route === "/node_modules" || route.startsWith("/esnext-") ? "public, max-age=86400, immutable" : "no-cache"
                },
                links: resource_provider_1.NO_LINKS
            };
        }
    }
    return {
        route
    };
}
exports.useRouter = useRouter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3Byb3ZpZGVycy9yb3V0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsNkRBQWtDO0FBQ2xDLHNEQUFtRDtBQUNuRCxrREFBMEI7QUFDMUIscURBQWtEO0FBQ2xELDJCQUFrQztBQUNsQywwRUFBMkM7QUFDM0MsZ0RBQXdCO0FBRXhCLG1EQUErQztBQUMvQywyREFBdUQ7QUFFdkQsU0FBZ0IsU0FBUyxDQUFDLE9BQXVCO0lBRTdDLE1BQU0sRUFBQyxlQUFlLEVBQUMsR0FBRywyQkFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBRWpELE1BQU0sRUFDRixPQUFPLEdBQUcsT0FBTyxDQUFDLEdBQUcsRUFBRSxFQUN2QixLQUFLLEdBQUcsRUFBRSxFQUNiLEdBQUcsT0FBTyxDQUFDO0lBRVosTUFBTSxNQUFNLEdBQUcsVUFBVSxDQUFDO0lBRTFCLEtBQUssVUFBVSxPQUFPLENBQUMsUUFBUTtRQUMzQixNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3BDLElBQUksS0FBSyxFQUFFO1lBQ1AsTUFBTSxPQUFPLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3pCLElBQUksT0FBTyxLQUFLLGNBQWMsRUFBRTtnQkFDNUIsT0FBTyxFQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLGNBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxFQUFDLENBQUM7YUFDbkU7aUJBQU0sSUFBSSxPQUFPLEtBQUssYUFBYSxFQUFFO2dCQUNsQyxPQUFPLEVBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsY0FBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBQyxDQUFDO2FBQ25HO2lCQUFN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QUUsNEJBQVE7YUFDbEIsQ0FBQztTQUNMO0lBQ0wsQ0FBQztJQUVELE9BQU87UUFDSCxLQUFLO0tBQ1IsQ0FBQztBQUNOLENBQUM7QUEvRkQsOEJBK0ZDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGxvZyBmcm9tIFwiQG1vZGVybm8vbG9nZ2VyXCI7XHJcbmltcG9ydCB7dXNlV2ViTW9kdWxlc30gZnJvbSBcIkBtb2Rlcm5vL3dlYi1tb2R1bGVzXCI7XHJcbmltcG9ydCBjaGFsayBmcm9tIFwiY2hhbGtcIjtcclxuaW1wb3J0IHtwYXJzZSBhcyBwYXJzZVVSTH0gZnJvbSBcImZhc3QtdXJsLXBhcnNlclwiO1xyXG5pbXBvcnQge3Byb21pc2VzIGFzIGZzfSBmcm9tIFwiZnNcIjtcclxuaW1wb3J0IEh0dHBTdGF0dXMgZnJvbSBcImh0dHAtc3RhdHVzLWNvZGVzXCI7XHJcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XHJcbmltcG9ydCB7TW9kZXJub09wdGlvbnN9IGZyb20gXCIuLi9jb25maWd1cmVcIjtcclxuaW1wb3J0IHtjb250ZW50VHlwZX0gZnJvbSBcIi4uL3V0aWwvbWltZS10eXBlc1wiO1xyXG5pbXBvcnQge05PX0xJTktTLCBSZXNvdXJjZX0gZnJvbSBcIi4vcmVzb3VyY2UtcHJvdmlkZXJcIjtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB1c2VSb3V0ZXIob3B0aW9uczogTW9kZXJub09wdGlvbnMpIHtcclxuXHJcbiAgICBjb25zdCB7YnVuZGxlV2ViTW9kdWxlfSA9IHVzZVdlYk1vZHVsZXMob3B0aW9ucyk7XHJcblxyXG4gICAgY29uc3Qge1xyXG4gICAgICAgIHJvb3REaXIgPSBwcm9jZXNzLmN3ZCgpLFxyXG4gICAgICAgIG1vdW50ID0ge31cclxuICAgIH0gPSBvcHRpb25zO1xyXG5cclxuICAgIGNvbnN0IHJlZ0V4cCA9IC9cXC9bXi8/XSsvO1xyXG5cclxuICAgIGFzeW5jIGZ1bmN0aW9uIHJlc29sdmUocGF0aG5hbWUpIHtcclxuICAgICAgICBjb25zdCBtYXRjaCA9IHJlZ0V4cC5leGVjKHBhdGhuYW1lKTtcclxuICAgICAgICBpZiAobWF0Y2gpIHtcclxuICAgICAgICAgICAgY29uc3Qgc2VnbWVudCA9IG1hdGNoWzBdO1xyXG4gICAgICAgICAgICBpZiAoc2VnbWVudCA9PT0gXCIvd2ViX21vZHVsZXNcIikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHtyb3V0ZTogc2VnbWVudCwgZmlsZW5hbWU6IHBhdGguam9pbihyb290RGlyLCBwYXRobmFtZSl9O1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHNlZ21lbnQgPT09IFwiL3dvcmtzcGFjZXNcIikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHtyb3V0ZTogc2VnbWVudCwgZmlsZW5hbWU6IHBhdGguam9pbihyb290RGlyLCBwYXRobmFtZS5zdWJzdHJpbmcoXCIvd29ya3NwYWNlc1wiLmxlbmd0aCkpfTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChtb3VudFtzZWdtZW50XSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHtyb3V0ZTogc2VnbWVudCwgZmlsZW5hbWU6IHBhdGguam9pbihtb3VudFtzZWdtZW50XSwgcGF0aG5hbWUuc3Vic3RyaW5nKHNlZ21lbnQubGVuZ3RoKSl9O1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKG1vdW50W3BhdGhuYW1lXSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHtyb3V0ZTogcGF0aG5hbWUsIGZpbGVuYW1lOiBcIlwiLCByZXNvdXJjZTogbW91bnRbcGF0aG5hbWVdfTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4ge3JvdXRlOiBcIi9cIiwgZmlsZW5hbWU6IHBhdGguam9pbihyb290RGlyLCBwYXRobmFtZSl9O1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGZ1bmN0aW9uIHJvdXRlKHVybDogc3RyaW5nKTogUHJvbWlzZTxSZXNvdXJjZT4ge1xyXG5cclxuICAgICAgICBsZXQge3BhdGhuYW1lLCBxdWVyeX0gPSBwYXJzZVVSTCh1cmwsIHRydWUpO1xyXG5cclxuICAgICAgICBpZiAocGF0aG5hbWUuZW5kc1dpdGgoXCJzcy5qc1wiKSAvKiB0cnkgYW5kIHN1cHBvcnQgb3BlbndjIHN0eWxlIGZvciBtb2R1bGUgbmFtZXMgKi8pIHtcclxuICAgICAgICAgICAgaWYgKHBhdGhuYW1lLmVuZHNXaXRoKFwiLnNjc3MuanNcIikgfHwgcGF0aG5hbWUuZW5kc1dpdGgoXCIuc2Fzcy5qc1wiKSB8fCBwYXRobmFtZS5lbmRzV2l0aChcIi5jc3MuanNcIikpIHtcclxuICAgICAgICAgICAgICAgIHBhdGhuYW1lID0gcGF0aG5hbWUuc2xpY2UoMCwgLTMpO1xyXG4gICAgICAgICAgICAgICAgcXVlcnkudHlwZSA9IFwibW9kdWxlXCI7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHtyb3V0ZSwgZmlsZW5hbWUsIHJlc291cmNlfSA9IGF3YWl0IHJlc29sdmUocGF0aG5hbWUpO1xyXG5cclxuICAgICAgICBpZiAocmVzb3VyY2UpIHtcclxuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxyXG4gICAgICAgICAgICByZXR1cm4gey4uLnJlc291cmNlLCBsaW5rczogTk9fTElOS1N9IGFzIFJlc291cmNlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3Qgc3RhdHMgPSBhd2FpdCBmcy5zdGF0KGZpbGVuYW1lKS5jYXRjaChlcnJvciA9PiB7XHJcbiAgICAgICAgICAgIGlmIChlcnJvci5jb2RlID09PSBcIkVOT0VOVFwiKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAocm91dGUgPT09IFwiL3dlYl9tb2R1bGVzXCIgJiYgIWZpbGVuYW1lLmVuZHNXaXRoKFwiLm1hcFwiKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGxvZy53YXJuKFwibGF6eSBsb2FkaW5nOlwiLCBjaGFsay5tYWdlbnRhKGZpbGVuYW1lKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGJ1bmRsZVdlYk1vZHVsZShwYXRobmFtZS5zdWJzdHJpbmcoMTMpKS50aGVuKCgpID0+IGZzLnN0YXQoZmlsZW5hbWUpKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcclxuICAgICAgICB9KS5jYXRjaChlcnJvciA9PiB7XHJcbiAgICAgICAgICAgIGlmIChlcnJvci5jb2RlID09PSBcIkVOT0VOVFwiKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAocGF0aG5hbWUgPT09IFwiL2Zhdmljb24uaWNvXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyB7Y29kZTogSHR0cFN0YXR1cy5QRVJNQU5FTlRfUkVESVJFQ1QsIGhlYWRlcnM6IHtcImxvY2F0aW9uXCI6IFwiL3Jlc291cmNlcy9qYXZhc2NyaXB0LnBuZ1wifX07XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHRocm93IHtjb2RlOiBIdHRwU3RhdHVzLk5PVF9GT1VORCwgbWVzc2FnZTogZXJyb3Iuc3RhY2t9O1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cge2NvZGU6IEh0dHBTdGF0dXMuSU5URVJOQUxfU0VSVkVSX0VSUk9SLCBtZXNzYWdlOiBlcnJvci5zdGFja307XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgaWYgKHN0YXRzLmlzRGlyZWN0b3J5KCkpIHtcclxuICAgICAgICAgICAgbGV0IGxvY2F0aW9uO1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgY29uc3Qge2hvbWV9ID0gcmVxdWlyZShwYXRoLnJlc29sdmUoZmlsZW5hbWUsIFwicGFja2FnZS5qc29uXCIpKTtcclxuICAgICAgICAgICAgICAgIGxvY2F0aW9uID0gcGF0aC5wb3NpeC5qb2luKHBhdGhuYW1lLCBob21lIHx8IFwiaW5kZXguaHRtbFwiKTtcclxuICAgICAgICAgICAgfSBjYXRjaCAoaWdub3JlZCkge1xyXG4gICAgICAgICAgICAgICAgbG9jYXRpb24gPSBwYXRoLnBvc2l4LmpvaW4ocGF0aG5hbWUsIFwiaW5kZXguaHRtbFwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aHJvdyB7Y29kZTogSHR0cFN0YXR1cy5QRVJNQU5FTlRfUkVESVJFQ1QsIGhlYWRlcnM6IHtcImxvY2F0aW9uXCI6IGxvY2F0aW9ufX07XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgIHBhdGhuYW1lLFxyXG4gICAgICAgICAgICAgICAgcXVlcnksXHJcbiAgICAgICAgICAgICAgICBmaWxlbmFtZSxcclxuICAgICAgICAgICAgICAgIGNvbnRlbnQ6IGF3YWl0IGZzLnJlYWRGaWxlKGZpbGVuYW1lKSxcclxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAgICAgICAgICAgICBcImNvbnRlbnQtdHlwZVwiOiBjb250ZW50VHlwZShmaWxlbmFtZSksXHJcbiAgICAgICAgICAgICAgICAgICAgXCJjb250ZW50LWxlbmd0aFwiOiBzdGF0cy5zaXplLFxyXG4gICAgICAgICAgICAgICAgICAgIFwibGFzdC1tb2RpZmllZFwiOiBzdGF0cy5tdGltZS50b1VUQ1N0cmluZygpLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiY2FjaGUtY29udHJvbFwiOiByb3V0ZSA9PT0gXCIvd2ViX21vZHVsZXNcIiB8fCByb3V0ZSA9PT0gXCIvbm9kZV9tb2R1bGVzXCIgfHwgcm91dGUuc3RhcnRzV2l0aChcIi9lc25leHQtXCIpID8gXCJwdWJsaWMsIG1heC1hZ2U9ODY0MDAsIGltbXV0YWJsZVwiIDogXCJuby1jYWNoZVwiXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgbGlua3M6IE5PX0xJTktTXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgcm91dGVcclxuICAgIH07XHJcbn1cclxuIl19