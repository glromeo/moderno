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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3JvdXRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSw4REFBa0U7QUFDbEUsNERBQWdDO0FBRWhDLHVDQUFxQztBQUVyQyxTQUFnQixZQUFZLENBQXlDLE9BQXVCO0lBRXhGLE1BQU0sT0FBTyxHQUFHLG9CQUFVLENBQUMsT0FBTyxDQUFDLENBQUM7SUFFcEMsTUFBTSxNQUFNLEdBQUcscUJBQU0sQ0FBSTtRQUNyQixRQUFRLENBQUMsSUFBVyxFQUFFLEdBQVcsRUFBRSxHQUFXO1lBQzFDLEdBQUcsQ0FBQyxVQUFVLEdBQUcsR0FBRyxDQUFDO1lBQ3JCLEdBQUcsQ0FBQyxHQUFHLENBQUMsa0JBQWtCLElBQUksRUFBRSxDQUFDLENBQUM7UUFDdEMsQ0FBQztRQUNELEdBQUcsT0FBTyxDQUFDLE1BQU07S0FDUCxDQUFDLENBQUM7SUFFaEIsT0FBTyxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO0lBRS9FLElBQUksT0FBTyxDQUFDLEtBQUssRUFBRTtRQUNmLEtBQUssTUFBTSxDQUFDLElBQUksRUFBRSxhQUFhLENBQUMsSUFBSSxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRTtZQUMvRCxNQUFNLEtBQUssR0FBRyxvQkFBTSxDQUFDLGlCQUFpQixDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBQ3RELDJGQUEyRjtZQUMzRixNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1NBQzNDO0tBQ0o7SUFFRCxPQUFPLE1BQU0sQ0FBQztBQUNsQixDQUFDO0FBdkJELG9DQXVCQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSb3V0ZXIsIHtDb25maWcsIEhUVFBWZXJzaW9uLCBSZXEsIFJlc30gZnJvbSBcImZpbmQtbXktd2F5XCI7XHJcbmltcG9ydCBTZXJ2ZXIgZnJvbSBcImh0dHAtcHJveHlcIjtcclxuaW1wb3J0IHtNb2Rlcm5vT3B0aW9uc30gZnJvbSBcIi4vY29uZmlndXJlXCI7XHJcbmltcG9ydCB7dXNlV2F0Y2hlcn0gZnJvbSBcIi4vd2F0Y2hlclwiO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVJvdXRlcjxWIGV4dGVuZHMgSFRUUFZlcnNpb24gPSBIVFRQVmVyc2lvbi5WMT4ob3B0aW9uczogTW9kZXJub09wdGlvbnMpIHtcclxuXHJcbiAgICBjb25zdCB3YXRjaGVyID0gdXNlV2F0Y2hlcihvcHRpb25zKTtcclxuXHJcbiAgICBjb25zdCByb3V0ZXIgPSBSb3V0ZXI8Vj4oe1xyXG4gICAgICAgIG9uQmFkVXJsKHBhdGg6c3RyaW5nLCByZXE6IFJlcTxWPiwgcmVzOiBSZXM8Vj4pIHtcclxuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA0MDA7XHJcbiAgICAgICAgICAgIHJlcy5lbmQoYE1hbGZvcm1lZCBVUkw6ICR7cGF0aH1gKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIC4uLm9wdGlvbnMucm91dGVyXHJcbiAgICB9IGFzIENvbmZpZzxWPik7XHJcblxyXG4gICAgb3B0aW9ucy5taWRkbGV3YXJlLmZvckVhY2gobWlkZGxld2FyZSA9PiBtaWRkbGV3YXJlKHJvdXRlciwgb3B0aW9ucywgd2F0Y2hlcikpO1xyXG5cclxuICAgIGlmIChvcHRpb25zLnByb3h5KSB7XHJcbiAgICAgICAgZm9yIChjb25zdCBbcGF0aCwgc2VydmVyT3B0aW9uc10gb2YgT2JqZWN0LmVudHJpZXMob3B0aW9ucy5wcm94eSkpIHtcclxuICAgICAgICAgICAgY29uc3QgcHJveHkgPSBTZXJ2ZXIuY3JlYXRlUHJveHlTZXJ2ZXIoc2VydmVyT3B0aW9ucyk7XHJcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmUgTm90ZSB0aGF0IHRoaXMgaXMgYSBwcm9ibGVtIGJlY2F1c2UgSFRUUC1QUk9YWSBkb2Vzbid0IHN1cHBvcnQgSFRUUDIgaGVhZGVycyFcclxuICAgICAgICAgICAgcm91dGVyLmFsbChwYXRoLCBwcm94eS53ZWIuYmluZChwcm94eSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcm91dGVyO1xyXG59XHJcbiJdfQ==