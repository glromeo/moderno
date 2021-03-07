"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useRequestHandler = void 0;
const chalk_1 = __importDefault(require("chalk"));
const cors_1 = __importDefault(require("cors"));
const fast_url_parser_1 = require("fast-url-parser");
const fs_1 = require("fs");
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const http2_1 = require("http2");
const nano_memoize_1 = __importDefault(require("nano-memoize"));
const path_1 = __importDefault(require("path"));
const logger_1 = __importDefault(require("@moderno/logger"));
const resource_provider_1 = require("./providers/resource-provider");
const router_1 = require("./router");
const http2_push_1 = require("./util/http2-push");
const mime_types_1 = require("./util/mime-types");
exports.useRequestHandler = nano_memoize_1.default((options) => {
    const { provideResource } = resource_provider_1.useResourceProvider(options);
    const { http2Push } = http2_push_1.useHttp2Push(options);
    const router = router_1.createRouter(options);
    /**
     *   ____  _        _   _        ____
     *  / ___|| |_ __ _| |_(_) ___  |  _ \ ___  ___  ___  _   _ _ __ ___ ___  ___
     *  \___ \| __/ _` | __| |/ __| | |_) / _ \/ __|/ _ \| | | | '__/ __/ _ \/ __|
     *   ___) | || (_| | |_| | (__  |  _ <  __/\__ \ (_) | |_| | | | (_|  __/\__ \
     *  |____/ \__\__,_|\__|_|\___| |_| \_\___||___/\___/ \__,_|_|  \___\___||___/
     *
     */
    router.get("/resources/*", function resourcesMiddleware(req, res) {
        const { pathname } = fast_url_parser_1.parse(req.url);
        const filename = path_1.default.join(options.resources, pathname.substring(10));
        sendFile(filename, res);
    });
    function sendFile(filename, res) {
        fs_1.readFile(filename, (err, data) => {
            if (err) {
                res.writeHead(http_status_codes_1.default.NOT_FOUND);
                res.end();
            }
            else {
                res.writeHead(http_status_codes_1.default.OK, {
                    "content-type": mime_types_1.contentType(filename),
                    "cache-control": "public, max-age=86400, immutable"
                });
                res.end(data);
            }
        });
    }
    /**
     *  __        __         _                               ____
     *  \ \      / /__  _ __| | _____ _ __   __ _  ___ ___  |  _ \ ___  ___  ___  _   _ _ __ ___ ___  ___
     *   \ \ /\ / / _ \| '__| |/ / __| '_ \ / _` |/ __/ _ \ | |_) / _ \/ __|/ _ \| | | | '__/ __/ _ \/ __|
     *    \ V  V / (_) | |  |   <\__ \ |_) | (_| | (_|  __/ |  _ <  __/\__ \ (_) | |_| | | | (_|  __/\__ \
     *     \_/\_/ \___/|_|  |_|\_\___/ .__/ \__,_|\___\___| |_| \_\___||___/\___/ \__,_|_|  \___\___||___/
     *                               |_|
     */
    router.get("/*", async function workspaceMiddleware(req, res) {
        let url = req.url, isHMR;
        if (url)
            try {
                if (url.endsWith(".HMR")) {
                    let hmrQuery = url.lastIndexOf("v=");
                    isHMR = hmrQuery > 0;
                    url = isHMR ? url.slice(0, hmrQuery - 1) : url;
                }
                let { pathname, headers, content, links } = await provideResource(url);
                headers = { ...headers };
                if (links && options.http2 === "preload" && !isHMR) {
                    headers.link = links.map(link => {
                        provideResource(link).catch(function () {
                            logger_1.default.warn("failed to pre-warm cache with:", link);
                        });
                        return `<${link}>; crossorigin; rel=preload; as=${link.endsWith(".css") ? "style" : "script"}`;
                    });
                }
                res.writeHead(200, headers);
                if (links && options.http2 === "push" && res instanceof http2_1.Http2ServerResponse && !isHMR) {
                    http2Push(res.stream, pathname, links);
                }
                res.end(content);
            }
            catch (error) {
                const { code, headers = {}, message, stack } = error;
                if (stack) {
                    const code = http_status_codes_1.default.INTERNAL_SERVER_ERROR;
                    const text = http_status_codes_1.default.getStatusText(code);
                    logger_1.default.error `${code} '${text}' handling: ${url}`;
                    logger_1.default.error(error);
                    res.writeHead(code, headers);
                    res.end(stack);
                }
                else {
                    const text = http_status_codes_1.default.getStatusText(code);
                    if (code === 308) {
                        // todo: check permanent redirect behaviour
                        logger_1.default.warn `${code} '${text}' ${url} -> ${headers.location}`;
                    }
                    else {
                        logger_1.default.error `${code} '${text}' ${message || "handling: " + url}`;
                    }
                    res.writeHead(code, headers);
                    res.end(message);
                }
            }
    });
    /**
     *    ____                      ___       _       _         __  __ _     _     _ _
     *   / ___|_ __ ___  ___ ___   / _ \ _ __(_) __ _(_)_ __   |  \/  (_) __| | __| | | _____      ____ _ _ __ ___
     *  | |   | '__/ _ \/ __/ __| | | | | '__| |/ _` | | '_ \  | |\/| | |/ _` |/ _` | |/ _ \ \ /\ / / _` | '__/ _ \
     *  | |___| | | (_) \__ \__ \ | |_| | |  | | (_| | | | | | | |  | | | (_| | (_| | |  __/\ V  V / (_| | | |  __/
     *   \____|_|  \___/|___/___/  \___/|_|  |_|\__, |_|_| |_| |_|  |_|_|\__,_|\__,_|_|\___| \_/\_/ \__,_|_|  \___|
     *                                          |___/
     */
    const cors = cors_1.default(options.cors);
    const next = (req, res) => function (err) {
        if (err) {
            throw err;
        }
        else {
            router.lookup(req, res);
        }
    };
    return function requestHandler(req, res) {
        logger_1.default.debug(req.method, chalk_1.default.magenta(req.url));
        cors(req, res, next(req, res));
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVxdWVzdC1oYW5kbGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3JlcXVlc3QtaGFuZGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxrREFBMEI7QUFDMUIsZ0RBQWtDO0FBQ2xDLHFEQUFrRDtBQUVsRCwyQkFBNEI7QUFFNUIsMEVBQTJDO0FBQzNDLGlDQUEwQztBQUMxQyxnRUFBb0M7QUFDcEMsZ0RBQWlDO0FBQ2pDLDZEQUFrQztBQUVsQyxxRUFBa0U7QUFDbEUscUNBQXNDO0FBQ3RDLGtEQUErQztBQUMvQyxrREFBOEM7QUFJakMsUUFBQSxpQkFBaUIsR0FBRyxzQkFBUSxDQUFDLENBQW9CLE9BQXVCLEVBQUUsRUFBRTtJQUVyRixNQUFNLEVBQUMsZUFBZSxFQUFDLEdBQUcsdUNBQW1CLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDdkQsTUFBTSxFQUFDLFNBQVMsRUFBQyxHQUFHLHlCQUFZLENBQUMsT0FBTyxDQUFDLENBQUM7SUFFMUMsTUFBTSxNQUFNLEdBQUcscUJBQVksQ0FBSSxPQUFPLENBQUMsQ0FBQztJQUV4Qzs7Ozs7OztPQU9HO0lBQ0gsTUFBTSxDQUFDLEdBQUcsQ0FBQyxjQUFjLEVBQUUsU0FBUyxtQkFBbUIsQ0FBQyxHQUFXLEVBQUUsR0FBVztRQUM1RSxNQUFNLEVBQUMsUUFBUSxFQUFDLEdBQUcsdUJBQVEsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDckMsTUFBTSxRQUFRLEdBQUcsY0FBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLFFBQVEsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUN0RSxRQUFRLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQzVCLENBQUMsQ0FBQyxDQUFDO0lBRUgsU0FBUyxRQUFRLENBQUksUUFBZ0IsRUFBRSxHQUEyRTtRQUM5RyxhQUFRLENBQUMsUUFBUSxFQUFFLENBQUMsR0FBRyxF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QUNuRCxnQkFBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsTUFBTyxFQUFFLGVBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDL0MsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQ25DLENBQUMsQ0FBQztBQUNOLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGNoYWxrIGZyb20gXCJjaGFsa1wiO1xyXG5pbXBvcnQgY29yc01pZGRsZXdhcmUgZnJvbSBcImNvcnNcIjtcclxuaW1wb3J0IHtwYXJzZSBhcyBwYXJzZVVSTH0gZnJvbSBcImZhc3QtdXJsLXBhcnNlclwiO1xyXG5pbXBvcnQgUm91dGVyLCB7UmVxLCBSZXN9IGZyb20gXCJmaW5kLW15LXdheVwiO1xyXG5pbXBvcnQge3JlYWRGaWxlfSBmcm9tIFwiZnNcIjtcclxuaW1wb3J0IHtTZXJ2ZXJSZXNwb25zZX0gZnJvbSBcImh0dHBcIjtcclxuaW1wb3J0IEh0dHBTdGF0dXMgZnJvbSBcImh0dHAtc3RhdHVzLWNvZGVzXCI7XHJcbmltcG9ydCB7SHR0cDJTZXJ2ZXJSZXNwb25zZX0gZnJvbSBcImh0dHAyXCI7XHJcbmltcG9ydCBtZW1vaXplZCBmcm9tIFwibmFuby1tZW1vaXplXCI7XHJcbmltcG9ydCBwYXRoLCB7cG9zaXh9IGZyb20gXCJwYXRoXCI7XHJcbmltcG9ydCBsb2cgZnJvbSBcIkBtb2Rlcm5vL2xvZ2dlclwiO1xyXG5pbXBvcnQge01vZGVybm9PcHRpb25zfSBmcm9tIFwiLi9jb25maWd1cmVcIjtcclxuaW1wb3J0IHt1c2VSZXNvdXJjZVByb3ZpZGVyfSBmcm9tIFwiLi9wcm92aWRlcnMvcmVzb3VyY2UtcHJvdmlkZXJcIjtcclxuaW1wb3J0IHtjcmVhdGVSb3V0ZXJ9IGZyb20gXCIuL3JvdXRlclwiO1xyXG5pbXBvcnQge3VzZUh0dHAyUHVzaH0gZnJvbSBcIi4vdXRpbC9odHRwMi1wdXNoXCI7XHJcbmltcG9ydCB7Y29udGVudFR5cGV9IGZyb20gXCIuL3V0aWwvbWltZS10eXBlc1wiO1xyXG5cclxudHlwZSBWZXJzaW9uID0gUm91dGVyLkhUVFBWZXJzaW9uLlYxIHwgUm91dGVyLkhUVFBWZXJzaW9uLlYyO1xyXG5cclxuZXhwb3J0IGNvbnN0IHVzZVJlcXVlc3RIYW5kbGVyID0gbWVtb2l6ZWQoPFYgZXh0ZW5kcyBWZXJzaW9uPihvcHRpb25zOiBNb2Rlcm5vT3B0aW9ucykgPT4ge1xyXG5cclxuICAgIGNvbnN0IHtwcm92aWRlUmVzb3VyY2V9ID0gdXNlUmVzb3VyY2VQcm92aWRlcihvcHRpb25zKTtcclxuICAgIGNvbnN0IHtodHRwMlB1c2h9ID0gdXNlSHR0cDJQdXNoKG9wdGlvbnMpO1xyXG5cclxuICAgIGNvbnN0IHJvdXRlciA9IGNyZWF0ZVJvdXRlcjxWPihvcHRpb25zKTtcclxuXHJcbiAgICAvKipcclxuICAgICAqICAgX19fXyAgXyAgICAgICAgXyAgIF8gICAgICAgIF9fX19cclxuICAgICAqICAvIF9fX3x8IHxfIF9fIF98IHxfKF8pIF9fXyAgfCAgXyBcXCBfX18gIF9fXyAgX19fICBfICAgXyBfIF9fIF9fXyBfX18gIF9fX1xyXG4gICAgICogIFxcX19fIFxcfCBfXy8gX2AgfCBfX3wgfC8gX198IHwgfF8pIC8gXyBcXC8gX198LyBfIFxcfCB8IHwgfCAnX18vIF9fLyBfIFxcLyBfX3xcclxuICAgICAqICAgX19fKSB8IHx8IChffCB8IHxffCB8IChfXyAgfCAgXyA8ICBfXy9cXF9fIFxcIChfKSB8IHxffCB8IHwgfCAoX3wgIF9fL1xcX18gXFxcclxuICAgICAqICB8X19fXy8gXFxfX1xcX18sX3xcXF9ffF98XFxfX198IHxffCBcXF9cXF9fX3x8X19fL1xcX19fLyBcXF9fLF98X3wgIFxcX19fXFxfX198fF9fXy9cclxuICAgICAqXHJcbiAgICAgKi9cclxuICAgIHJvdXRlci5nZXQoXCIvcmVzb3VyY2VzLypcIiwgZnVuY3Rpb24gcmVzb3VyY2VzTWlkZGxld2FyZShyZXE6IFJlcTxWPiwgcmVzOiBSZXM8Vj4pIHtcclxuICAgICAgICBjb25zdCB7cGF0aG5hbWV9ID0gcGFyc2VVUkwocmVxLnVybCk7XHJcbiAgICAgICAgY29uc3QgZmlsZW5hbWUgPSBwYXRoLmpvaW4ob3B0aW9ucy5yZXNvdXJjZXMsIHBhdGhuYW1lLnN1YnN0cmluZygxMCkpO1xyXG4gICAgICAgIHNlbmRGaWxlKGZpbGVuYW1lLCByZXMpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgZnVuY3Rpb24gc2VuZEZpbGU8Vj4oZmlsZW5hbWU6IHN0cmluZywgcmVzOiBWIGV4dGVuZHMgUm91dGVyLkhUVFBWZXJzaW9uLlYxID8gU2VydmVyUmVzcG9uc2UgOiBIdHRwMlNlcnZlclJlc3BvbnNlKSB7XHJcbiAgICAgICAgcmVhZEZpbGUoZmlsZW5hbWUsIChlcnIsIGRhdGEpID0+IHtcclxuICAgICAgICAgICAgaWYgKGVycikge1xyXG4gICAgICAgICAgICAgICAgcmVzLndyaXRlSGVhZChIdHRwU3RhdHVzLk5PVF9GT1VORCk7XHJcbiAgICAgICAgICAgICAgICByZXMuZW5kKCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXMud3JpdGVIZWFkKEh0dHBTdGF0dXMuT0ssIHtcclxuICAgICAgICAgICAgICAgICAgICBcImNvbnRlbnQtdHlwZVwiOiBjb250ZW50VHlwZShmaWxlbmFtZSksXHJcbiAgICAgICAgICAgICAgICAgICAgXCJjYWNoZS1jb250cm9sXCI6IFwicHVibGljLCBtYXgtYWdlPTg2NDAwLCBpbW11dGFibGVcIlxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICByZXMuZW5kKGRhdGEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiAgX18gICAgICAgIF9fICAgICAgICAgXyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfX19fXHJcbiAgICAgKiAgXFwgXFwgICAgICAvIC9fXyAgXyBfX3wgfCBfX19fXyBfIF9fICAgX18gXyAgX19fIF9fXyAgfCAgXyBcXCBfX18gIF9fXyAgX19fICBfICAgXyBfIF9fIF9fXyBfX18gIF9fX1xyXG4gICAgICogICBcXCBcXCAvXFwgLyAvIF8gXFx8ICdfX3wgfC8gLyBfX3wgJ18gXFwgLyBfYCB8LyBfXy8gXyBcXCB8IHxfKSAvIF8gXFwvIF9ffC8gXyBcXHwgfCB8IHwgJ19fLyBfXy8gXyBcXC8gX198XHJcbiAgICAgKiAgICBcXCBWICBWIC8gKF8pIHwgfCAgfCAgIDxcXF9fIFxcIHxfKSB8IChffCB8IChffCAgX18vIHwgIF8gPCAgX18vXFxfXyBcXCAoXykgfCB8X3wgfCB8IHwgKF98ICBfXy9cXF9fIFxcXHJcbiAgICAgKiAgICAgXFxfL1xcXy8gXFxfX18vfF98ICB8X3xcXF9cXF9fXy8gLl9fLyBcXF9fLF98XFxfX19cXF9fX3wgfF98IFxcX1xcX19ffHxfX18vXFxfX18vIFxcX18sX3xffCAgXFxfX19cXF9fX3x8X19fL1xyXG4gICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfF98XHJcbiAgICAgKi9cclxuICAgIHJvdXRlci5nZXQoXCIvKlwiLCBhc3luYyBmdW5jdGlvbiB3b3Jrc3BhY2VNaWRkbGV3YXJlKHJlcTogUmVxPFY+LCByZXM6IFJlczxWPikge1xyXG5cclxuICAgICAgICBsZXQgdXJsID0gcmVxLnVybCwgaXNITVI7XHJcbiAgICAgICAgaWYgKHVybCkgdHJ5IHtcclxuXHJcbiAgICAgICAgICAgIGlmICh1cmwuZW5kc1dpdGgoXCIuSE1SXCIpKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgaG1yUXVlcnkgPSB1cmwubGFzdEluZGV4T2YoXCJ2PVwiKTtcclxuICAgICAgICAgICAgICAgIGlzSE1SID0gaG1yUXVlcnkgPiAwO1xyXG4gICAgICAgICAgICAgICAgdXJsID0gaXNITVIgPyB1cmwuc2xpY2UoMCwgaG1yUXVlcnkgLSAxKSA6IHVybDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgbGV0IHtcclxuICAgICAgICAgICAgICAgIHBhdGhuYW1lLFxyXG4gICAgICAgICAgICAgICAgaGVhZGVycyxcclxuICAgICAgICAgICAgICAgIGNvbnRlbnQsXHJcbiAgICAgICAgICAgICAgICBsaW5rc1xyXG4gICAgICAgICAgICB9ID0gYXdhaXQgcHJvdmlkZVJlc291cmNlKHVybCk7XHJcblxyXG4gICAgICAgICAgICBoZWFkZXJzID0gey4uLmhlYWRlcnN9O1xyXG5cclxuICAgICAgICAgICAgaWYgKGxpbmtzICYmIG9wdGlvbnMuaHR0cDIgPT09IFwicHJlbG9hZFwiICYmICFpc0hNUikge1xyXG4gICAgICAgICAgICAgICAgaGVhZGVycy5saW5rID0gbGlua3MubWFwKGxpbmsgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHByb3ZpZGVSZXNvdXJjZShsaW5rKS5jYXRjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvZy53YXJuKFwiZmFpbGVkIHRvIHByZS13YXJtIGNhY2hlIHdpdGg6XCIsIGxpbmspO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBgPCR7bGlua30+OyBjcm9zc29yaWdpbjsgcmVsPXByZWxvYWQ7IGFzPSR7bGluay5lbmRzV2l0aChcIi5jc3NcIikgPyBcInN0eWxlXCIgOiBcInNjcmlwdFwifWA7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmVzLndyaXRlSGVhZCgyMDAsIGhlYWRlcnMpO1xyXG5cclxuICAgICAgICAgICAgaWYgKGxpbmtzICYmIG9wdGlvbnMuaHR0cDIgPT09IFwicHVzaFwiICYmIHJlcyBpbnN0YW5jZW9mIEh0dHAyU2VydmVyUmVzcG9uc2UgJiYgIWlzSE1SKSB7XHJcbiAgICAgICAgICAgICAgICBodHRwMlB1c2gocmVzLnN0cmVhbSwgcGF0aG5hbWUsIGxpbmtzKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmVzLmVuZChjb250ZW50KTtcclxuXHJcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IHtjb2RlLCBoZWFkZXJzID0ge30sIG1lc3NhZ2UsIHN0YWNrfSA9IGVycm9yO1xyXG5cclxuICAgICAgICAgICAgaWYgKHN0YWNrKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBjb2RlID0gSHR0cFN0YXR1cy5JTlRFUk5BTF9TRVJWRVJfRVJST1I7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB0ZXh0ID0gSHR0cFN0YXR1cy5nZXRTdGF0dXNUZXh0KGNvZGUpO1xyXG4gICAgICAgICAgICAgICAgbG9nLmVycm9yYCR7Y29kZX0gJyR7dGV4dH0nIGhhbmRsaW5nOiAke3VybH1gO1xyXG4gICAgICAgICAgICAgICAgbG9nLmVycm9yKGVycm9yKTtcclxuICAgICAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoY29kZSwgaGVhZGVycyk7XHJcbiAgICAgICAgICAgICAgICByZXMuZW5kKHN0YWNrKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHRleHQgPSBIdHRwU3RhdHVzLmdldFN0YXR1c1RleHQoY29kZSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoY29kZSA9PT0gMzA4KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gdG9kbzogY2hlY2sgcGVybWFuZW50IHJlZGlyZWN0IGJlaGF2aW91clxyXG4gICAgICAgICAgICAgICAgICAgIGxvZy53YXJuYCR7Y29kZX0gJyR7dGV4dH0nICR7dXJsfSAtPiAke2hlYWRlcnMubG9jYXRpb259YDtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbG9nLmVycm9yYCR7Y29kZX0gJyR7dGV4dH0nICR7bWVzc2FnZSB8fCBcImhhbmRsaW5nOiBcIiArIHVybH1gO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmVzLndyaXRlSGVhZChjb2RlLCBoZWFkZXJzKTtcclxuICAgICAgICAgICAgICAgIHJlcy5lbmQobWVzc2FnZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICAvKipcclxuICAgICAqICAgIF9fX18gICAgICAgICAgICAgICAgICAgICAgX19fICAgICAgIF8gICAgICAgXyAgICAgICAgIF9fICBfXyBfICAgICBfICAgICBfIF9cclxuICAgICAqICAgLyBfX198XyBfXyBfX18gIF9fXyBfX18gICAvIF8gXFwgXyBfXyhfKSBfXyBfKF8pXyBfXyAgIHwgIFxcLyAgKF8pIF9ffCB8IF9ffCB8IHwgX19fX18gICAgICBfX19fIF8gXyBfXyBfX19cclxuICAgICAqICB8IHwgICB8ICdfXy8gXyBcXC8gX18vIF9ffCB8IHwgfCB8ICdfX3wgfC8gX2AgfCB8ICdfIFxcICB8IHxcXC98IHwgfC8gX2AgfC8gX2AgfCB8LyBfIFxcIFxcIC9cXCAvIC8gX2AgfCAnX18vIF8gXFxcclxuICAgICAqICB8IHxfX198IHwgfCAoXykgXFxfXyBcXF9fIFxcIHwgfF98IHwgfCAgfCB8IChffCB8IHwgfCB8IHwgfCB8ICB8IHwgfCAoX3wgfCAoX3wgfCB8ICBfXy9cXCBWICBWIC8gKF98IHwgfCB8ICBfXy9cclxuICAgICAqICAgXFxfX19ffF98ICBcXF9fXy98X19fL19fXy8gIFxcX19fL3xffCAgfF98XFxfXywgfF98X3wgfF98IHxffCAgfF98X3xcXF9fLF98XFxfXyxffF98XFxfX198IFxcXy9cXF8vIFxcX18sX3xffCAgXFxfX198XHJcbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHxfX18vXHJcbiAgICAgKi9cclxuICAgIGNvbnN0IGNvcnMgPSBjb3JzTWlkZGxld2FyZShvcHRpb25zLmNvcnMpO1xyXG5cclxuICAgIGNvbnN0IG5leHQgPSAocmVxOiBSZXE8Vj4sIHJlczogUmVzPFY+KSA9PiBmdW5jdGlvbiAoZXJyKSB7XHJcbiAgICAgICAgaWYgKGVycikge1xyXG4gICAgICAgICAgICB0aHJvdyBlcnI7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcm91dGVyLmxvb2t1cChyZXEsIHJlcyk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICByZXR1cm4gZnVuY3Rpb24gcmVxdWVzdEhhbmRsZXIocmVxOiBSZXE8Vj4sIHJlczogUmVzPFY+KTogdm9pZCB7XHJcbiAgICAgICAgbG9nLmRlYnVnKHJlcS5tZXRob2QhLCBjaGFsay5tYWdlbnRhKHJlcS51cmwpKTtcclxuICAgICAgICBjb3JzKHJlcSwgcmVzLCBuZXh0KHJlcSwgcmVzKSk7XHJcbiAgICB9O1xyXG59KTtcclxuIl19