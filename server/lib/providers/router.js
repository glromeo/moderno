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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3Byb3ZpZGVycy9yb3V0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsNkRBQWtDO0FBQ2xDLHNEQUFtRDtBQUNuRCxrREFBMEI7QUFDMUIscURBQWtEO0FBQ2xELDJCQUFrQztBQUNsQywwRUFBMkM7QUFDM0MsZ0RBQXdCO0FBRXhCLG1EQUErQztBQUMvQywyREFBdUQ7QUFFdkQsU0FBZ0IsU0FBUyxDQUFDLE9BQXVCO0lBRTdDLE1BQU0sRUFBQyxlQUFlLEVBQUMsR0FBRywyQkFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBRWpELE1BQU0sRUFDRixPQUFPLEdBQUcsT0FBTyxDQUFDLEdBQUcsRUFBRSxFQUN2QixLQUFLLEdBQUcsRUFBRSxFQUNiLEdBQUcsT0FBTyxDQUFDO0lBRVosTUFBTSxNQUFNLEdBQUcsVUFBVSxDQUFDO0lBRTFCLEtBQUssVUFBVSxPQUFPLENBQUMsUUFBUTtRQUMzQixNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3BDLElBQUksS0FBSyxFQUFFO1lBQ1AsTUFBTSxPQUFPLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3pCLElBQUksT0FBTyxLQUFLLGNBQWMsRUFBRTtnQkFDNUIsT0FBTyxFQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLGNBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxFQUFDLENBQUM7YUFDbkU7aUJBQU0sSUFBSSxPQUFPLEtBQUssYUFBYSxFQUFFO2dCQUNsQyxPQUFPLEVBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsY0FBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBQyxDQUFDO2FBQ25HO2lCQUFN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QUUsNEJBQVE7YUFDbEIsQ0FBQztTQUNMO0lBQ0wsQ0FBQztJQUVELE9BQU87UUFDSCxLQUFLO0tBQ1IsQ0FBQztBQUNOLENBQUM7QUEvRkQsOEJBK0ZDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGxvZyBmcm9tIFwiQG1vZGVybm8vbG9nZ2VyXCI7XG5pbXBvcnQge3VzZVdlYk1vZHVsZXN9IGZyb20gXCJAbW9kZXJuby93ZWItbW9kdWxlc1wiO1xuaW1wb3J0IGNoYWxrIGZyb20gXCJjaGFsa1wiO1xuaW1wb3J0IHtwYXJzZSBhcyBwYXJzZVVSTH0gZnJvbSBcImZhc3QtdXJsLXBhcnNlclwiO1xuaW1wb3J0IHtwcm9taXNlcyBhcyBmc30gZnJvbSBcImZzXCI7XG5pbXBvcnQgSHR0cFN0YXR1cyBmcm9tIFwiaHR0cC1zdGF0dXMtY29kZXNcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQge01vZGVybm9PcHRpb25zfSBmcm9tIFwiLi4vY29uZmlndXJlXCI7XG5pbXBvcnQge2NvbnRlbnRUeXBlfSBmcm9tIFwiLi4vdXRpbC9taW1lLXR5cGVzXCI7XG5pbXBvcnQge05PX0xJTktTLCBSZXNvdXJjZX0gZnJvbSBcIi4vcmVzb3VyY2UtcHJvdmlkZXJcIjtcblxuZXhwb3J0IGZ1bmN0aW9uIHVzZVJvdXRlcihvcHRpb25zOiBNb2Rlcm5vT3B0aW9ucykge1xuXG4gICAgY29uc3Qge2J1bmRsZVdlYk1vZHVsZX0gPSB1c2VXZWJNb2R1bGVzKG9wdGlvbnMpO1xuXG4gICAgY29uc3Qge1xuICAgICAgICByb290RGlyID0gcHJvY2Vzcy5jd2QoKSxcbiAgICAgICAgbW91bnQgPSB7fVxuICAgIH0gPSBvcHRpb25zO1xuXG4gICAgY29uc3QgcmVnRXhwID0gL1xcL1teLz9dKy87XG5cbiAgICBhc3luYyBmdW5jdGlvbiByZXNvbHZlKHBhdGhuYW1lKSB7XG4gICAgICAgIGNvbnN0IG1hdGNoID0gcmVnRXhwLmV4ZWMocGF0aG5hbWUpO1xuICAgICAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgICAgIGNvbnN0IHNlZ21lbnQgPSBtYXRjaFswXTtcbiAgICAgICAgICAgIGlmIChzZWdtZW50ID09PSBcIi93ZWJfbW9kdWxlc1wiKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtyb3V0ZTogc2VnbWVudCwgZmlsZW5hbWU6IHBhdGguam9pbihyb290RGlyLCBwYXRobmFtZSl9O1xuICAgICAgICAgICAgfSBlbHNlIGlmIChzZWdtZW50ID09PSBcIi93b3Jrc3BhY2VzXCIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4ge3JvdXRlOiBzZWdtZW50LCBmaWxlbmFtZTogcGF0aC5qb2luKHJvb3REaXIsIHBhdGhuYW1lLnN1YnN0cmluZyhcIi93b3Jrc3BhY2VzXCIubGVuZ3RoKSl9O1xuICAgICAgICAgICAgfSBlbHNlIGlmIChtb3VudFtzZWdtZW50XSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB7cm91dGU6IHNlZ21lbnQsIGZpbGVuYW1lOiBwYXRoLmpvaW4obW91bnRbc2VnbWVudF0sIHBhdGhuYW1lLnN1YnN0cmluZyhzZWdtZW50Lmxlbmd0aCkpfTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAobW91bnRbcGF0aG5hbWVdKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtyb3V0ZTogcGF0aG5hbWUsIGZpbGVuYW1lOiBcIlwiLCByZXNvdXJjZTogbW91bnRbcGF0aG5hbWVdfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4ge3JvdXRlOiBcIi9cIiwgZmlsZW5hbWU6IHBhdGguam9pbihyb290RGlyLCBwYXRobmFtZSl9O1xuICAgIH1cblxuICAgIGFzeW5jIGZ1bmN0aW9uIHJvdXRlKHVybDogc3RyaW5nKTogUHJvbWlzZTxSZXNvdXJjZT4ge1xuXG4gICAgICAgIGxldCB7cGF0aG5hbWUsIHF1ZXJ5fSA9IHBhcnNlVVJMKHVybCwgdHJ1ZSk7XG5cbiAgICAgICAgaWYgKHBhdGhuYW1lLmVuZHNXaXRoKFwic3MuanNcIikgLyogdHJ5IGFuZCBzdXBwb3J0IG9wZW53YyBzdHlsZSBmb3IgbW9kdWxlIG5hbWVzICovKSB7XG4gICAgICAgICAgICBpZiAocGF0aG5hbWUuZW5kc1dpdGgoXCIuc2Nzcy5qc1wiKSB8fCBwYXRobmFtZS5lbmRzV2l0aChcIi5zYXNzLmpzXCIpIHx8IHBhdGhuYW1lLmVuZHNXaXRoKFwiLmNzcy5qc1wiKSkge1xuICAgICAgICAgICAgICAgIHBhdGhuYW1lID0gcGF0aG5hbWUuc2xpY2UoMCwgLTMpO1xuICAgICAgICAgICAgICAgIHF1ZXJ5LnR5cGUgPSBcIm1vZHVsZVwiO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qge3JvdXRlLCBmaWxlbmFtZSwgcmVzb3VyY2V9ID0gYXdhaXQgcmVzb2x2ZShwYXRobmFtZSk7XG5cbiAgICAgICAgaWYgKHJlc291cmNlKSB7XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICByZXR1cm4gey4uLnJlc291cmNlLCBsaW5rczogTk9fTElOS1N9IGFzIFJlc291cmNlO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgc3RhdHMgPSBhd2FpdCBmcy5zdGF0KGZpbGVuYW1lKS5jYXRjaChlcnJvciA9PiB7XG4gICAgICAgICAgICBpZiAoZXJyb3IuY29kZSA9PT0gXCJFTk9FTlRcIikge1xuICAgICAgICAgICAgICAgIGlmIChyb3V0ZSA9PT0gXCIvd2ViX21vZHVsZXNcIiAmJiAhZmlsZW5hbWUuZW5kc1dpdGgoXCIubWFwXCIpKSB7XG4gICAgICAgICAgICAgICAgICAgIGxvZy53YXJuKFwibGF6eSBsb2FkaW5nOlwiLCBjaGFsay5tYWdlbnRhKGZpbGVuYW1lKSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBidW5kbGVXZWJNb2R1bGUocGF0aG5hbWUuc3Vic3RyaW5nKDEzKSkudGhlbigoKSA9PiBmcy5zdGF0KGZpbGVuYW1lKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgIH0pLmNhdGNoKGVycm9yID0+IHtcbiAgICAgICAgICAgIGlmIChlcnJvci5jb2RlID09PSBcIkVOT0VOVFwiKSB7XG4gICAgICAgICAgICAgICAgaWYgKHBhdGhuYW1lID09PSBcIi9mYXZpY29uLmljb1wiKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IHtjb2RlOiBIdHRwU3RhdHVzLlBFUk1BTkVOVF9SRURJUkVDVCwgaGVhZGVyczoge1wibG9jYXRpb25cIjogXCIvcmVzb3VyY2VzL2phdmFzY3JpcHQucG5nXCJ9fTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyB7Y29kZTogSHR0cFN0YXR1cy5OT1RfRk9VTkQsIG1lc3NhZ2U6IGVycm9yLnN0YWNrfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93IHtjb2RlOiBIdHRwU3RhdHVzLklOVEVSTkFMX1NFUlZFUl9FUlJPUiwgbWVzc2FnZTogZXJyb3Iuc3RhY2t9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoc3RhdHMuaXNEaXJlY3RvcnkoKSkge1xuICAgICAgICAgICAgbGV0IGxvY2F0aW9uO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCB7aG9tZX0gPSByZXF1aXJlKHBhdGgucmVzb2x2ZShmaWxlbmFtZSwgXCJwYWNrYWdlLmpzb25cIikpO1xuICAgICAgICAgICAgICAgIGxvY2F0aW9uID0gcGF0aC5wb3NpeC5qb2luKHBhdGhuYW1lLCBob21lIHx8IFwiaW5kZXguaHRtbFwiKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGlnbm9yZWQpIHtcbiAgICAgICAgICAgICAgICBsb2NhdGlvbiA9IHBhdGgucG9zaXguam9pbihwYXRobmFtZSwgXCJpbmRleC5odG1sXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhyb3cge2NvZGU6IEh0dHBTdGF0dXMuUEVSTUFORU5UX1JFRElSRUNULCBoZWFkZXJzOiB7XCJsb2NhdGlvblwiOiBsb2NhdGlvbn19O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBwYXRobmFtZSxcbiAgICAgICAgICAgICAgICBxdWVyeSxcbiAgICAgICAgICAgICAgICBmaWxlbmFtZSxcbiAgICAgICAgICAgICAgICBjb250ZW50OiBhd2FpdCBmcy5yZWFkRmlsZShmaWxlbmFtZSksXG4gICAgICAgICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgICAgICAgICBcImNvbnRlbnQtdHlwZVwiOiBjb250ZW50VHlwZShmaWxlbmFtZSksXG4gICAgICAgICAgICAgICAgICAgIFwiY29udGVudC1sZW5ndGhcIjogc3RhdHMuc2l6ZSxcbiAgICAgICAgICAgICAgICAgICAgXCJsYXN0LW1vZGlmaWVkXCI6IHN0YXRzLm10aW1lLnRvVVRDU3RyaW5nKCksXG4gICAgICAgICAgICAgICAgICAgIFwiY2FjaGUtY29udHJvbFwiOiByb3V0ZSA9PT0gXCIvd2ViX21vZHVsZXNcIiB8fCByb3V0ZSA9PT0gXCIvbm9kZV9tb2R1bGVzXCIgfHwgcm91dGUuc3RhcnRzV2l0aChcIi9lc25leHQtXCIpID8gXCJwdWJsaWMsIG1heC1hZ2U9ODY0MDAsIGltbXV0YWJsZVwiIDogXCJuby1jYWNoZVwiXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBsaW5rczogTk9fTElOS1NcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICByb3V0ZVxuICAgIH07XG59XG4iXX0=