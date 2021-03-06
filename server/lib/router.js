"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRouter = void 0;
const find_my_way_1 = __importDefault(require("find-my-way"));
const http_proxy_1 = __importDefault(require("http-proxy"));
const watcher_1 = require("./watcher");
function createRouter(options) {
    const watcher = watcher_1.useWatcher(options);
    const router = find_my_way_1.default({
        onBadUrl(path, req, res) {
            res.statusCode = 400;
            res.end(`Malformed URL: ${path}`);
        },
        ...options.router
    });
    options.middleware.forEach(middleware => middleware(router, options, watcher));
    if (options.proxy) {
        for (const [path, serverOptions] of Object.entries(options.proxy)) {
            const proxy = http_proxy_1.default.createProxyServer(serverOptions);
            // @ts-ignore Note that this is a problem because HTTP-PROXY doesn't support HTTP2 headers!
            router.all(path, proxy.web.bind(proxy));
        }
    }
    return router;
}
exports.createRouter = createRouter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3JvdXRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSw4REFBa0U7QUFDbEUsNERBQWdDO0FBRWhDLHVDQUFxQztBQUVyQyxTQUFnQixZQUFZLENBQXlDLE9BQXVCO0lBRXhGLE1BQU0sT0FBTyxHQUFHLG9CQUFVLENBQUMsT0FBTyxDQUFDLENBQUM7SUFFcEMsTUFBTSxNQUFNLEdBQUcscUJBQU0sQ0FBSTtRQUNyQixRQUFRLENBQUMsSUFBVyxFQUFFLEdBQVcsRUFBRSxHQUFXO1lBQzFDLEdBQUcsQ0FBQyxVQUFVLEdBQUcsR0FBRyxDQUFDO1lBQ3JCLEdBQUcsQ0FBQyxHQUFHLENBQUMsa0JBQWtCLElBQUksRUFBRSxDQUFDLENBQUM7UUFDdEMsQ0FBQztRQUNELEdBQUcsT0FBTyxDQUFDLE1BQU07S0FDUCxDQUFDLENBQUM7SUFFaEIsT0FBTyxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO0lBRS9FLElBQUksT0FBTyxDQUFDLEtBQUssRUFBRTtRQUNmLEtBQUssTUFBTSxDQUFDLElBQUksRUFBRSxhQUFhLENBQUMsSUFBSSxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRTtZQUMvRCxNQUFNLEtBQUssR0FBRyxvQkFBTSxDQUFDLGlCQUFpQixDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBQ3RELDJGQUEyRjtZQUMzRixNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1NBQzNDO0tBQ0o7SUFFRCxPQUFPLE1BQU0sQ0FBQztBQUNsQixDQUFDO0FBdkJELG9DQXVCQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSb3V0ZXIsIHtDb25maWcsIEhUVFBWZXJzaW9uLCBSZXEsIFJlc30gZnJvbSBcImZpbmQtbXktd2F5XCI7XG5pbXBvcnQgU2VydmVyIGZyb20gXCJodHRwLXByb3h5XCI7XG5pbXBvcnQge01vZGVybm9PcHRpb25zfSBmcm9tIFwiLi9jb25maWd1cmVcIjtcbmltcG9ydCB7dXNlV2F0Y2hlcn0gZnJvbSBcIi4vd2F0Y2hlclwiO1xuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlUm91dGVyPFYgZXh0ZW5kcyBIVFRQVmVyc2lvbiA9IEhUVFBWZXJzaW9uLlYxPihvcHRpb25zOiBNb2Rlcm5vT3B0aW9ucykge1xuXG4gICAgY29uc3Qgd2F0Y2hlciA9IHVzZVdhdGNoZXIob3B0aW9ucyk7XG5cbiAgICBjb25zdCByb3V0ZXIgPSBSb3V0ZXI8Vj4oe1xuICAgICAgICBvbkJhZFVybChwYXRoOnN0cmluZywgcmVxOiBSZXE8Vj4sIHJlczogUmVzPFY+KSB7XG4gICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDQwMDtcbiAgICAgICAgICAgIHJlcy5lbmQoYE1hbGZvcm1lZCBVUkw6ICR7cGF0aH1gKTtcbiAgICAgICAgfSxcbiAgICAgICAgLi4ub3B0aW9ucy5yb3V0ZXJcbiAgICB9IGFzIENvbmZpZzxWPik7XG5cbiAgICBvcHRpb25zLm1pZGRsZXdhcmUuZm9yRWFjaChtaWRkbGV3YXJlID0+IG1pZGRsZXdhcmUocm91dGVyLCBvcHRpb25zLCB3YXRjaGVyKSk7XG5cbiAgICBpZiAob3B0aW9ucy5wcm94eSkge1xuICAgICAgICBmb3IgKGNvbnN0IFtwYXRoLCBzZXJ2ZXJPcHRpb25zXSBvZiBPYmplY3QuZW50cmllcyhvcHRpb25zLnByb3h5KSkge1xuICAgICAgICAgICAgY29uc3QgcHJveHkgPSBTZXJ2ZXIuY3JlYXRlUHJveHlTZXJ2ZXIoc2VydmVyT3B0aW9ucyk7XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlIE5vdGUgdGhhdCB0aGlzIGlzIGEgcHJvYmxlbSBiZWNhdXNlIEhUVFAtUFJPWFkgZG9lc24ndCBzdXBwb3J0IEhUVFAyIGhlYWRlcnMhXG4gICAgICAgICAgICByb3V0ZXIuYWxsKHBhdGgsIHByb3h5LndlYi5iaW5kKHByb3h5KSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcm91dGVyO1xufVxuIl19