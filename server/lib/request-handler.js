"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useRequestHandler = void 0;
const logger_1 = __importDefault(require("@moderno/logger"));
const chalk_1 = __importDefault(require("chalk"));
const cors_1 = __importDefault(require("cors"));
const fast_url_parser_1 = require("fast-url-parser");
const fs_1 = require("fs");
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const http2_1 = require("http2");
const nano_memoize_1 = __importDefault(require("nano-memoize"));
const path_1 = __importDefault(require("path"));
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
    const crossorigin = options.cors.credentials ? "crossorigin=use-credentials" : "crossorigin=anonymous";
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
                        return `<${link}>; rel=preload; ${crossorigin}; as=${link.endsWith(".css") ? "style" : "script"}`;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVxdWVzdC1oYW5kbGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3JlcXVlc3QtaGFuZGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSw2REFBa0M7QUFDbEMsa0RBQTBCO0FBQzFCLGdEQUFrQztBQUNsQyxxREFBa0Q7QUFFbEQsMkJBQTRCO0FBRTVCLDBFQUEyQztBQUMzQyxpQ0FBMEM7QUFDMUMsZ0VBQW9DO0FBQ3BDLGdEQUF3QjtBQUV4QixxRUFBa0U7QUFDbEUscUNBQXNDO0FBQ3RDLGtEQUErQztBQUMvQyxrREFBOEM7QUFJakMsUUFBQSxpQkFBaUIsR0FBRyxzQkFBUSxDQUFDLENBQW9CLE9BQXVCLEVBQUUsRUFBRTtJQUVyRixNQUFNLEVBQUMsZUFBZSxFQUFDLEdBQUcsdUNBQW1CLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDdkQsTUFBTSxFQUFDLFNBQVMsRUFBQyxHQUFHLHlCQUFZLENBQUMsT0FBTyxDQUFDLENBQUM7SUFFMUMsTUFBTSxNQUFNLEdBQUcscUJBQVksQ0FBSSxPQUFPLENBQUMsQ0FBQztJQUV4Qzs7Ozs7OztPQU9HO0lBQ0gsTUFBTSxDQUFDLEdBQUcsQ0FBQyxjQUFjLEVBQUUsU0FBUyxtQkFBbUIsQ0FBQyxHQUFXLEVBQUUsR0FBVztRQUM1RSxNQUFNLEVBQUMsUUFBUSxFQUFDLEdBQUcsdUJBQVEsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDckMsTUFBTSxRQUFRLEdBQUcsY0FBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLFFBQVEsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUN0RSxRQUFRLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQzVCLENBQUMsQ0FBQyxDQUFDO0lBRUgsU0FBUyxRQUFRLENBQUksUUFBZ0IsRUFBRSxHQUEyRTtRQUM5RyxhQUFRLENBQUMsUUFBUSxFQUFFLENBQUMsR0FBRyxF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QU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1NBQzNCO0lBQ0wsQ0FBQyxDQUFDO0lBRUYsT0FBTyxTQUFTLGNBQWMsQ0FBQyxHQUFXLEVBQUUsR0FBVztRQUNuRCxnQkFBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsTUFBTyxFQUFFLGVBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDL0MsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQ25DLENBQUMsQ0FBQztBQUNOLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGxvZyBmcm9tIFwiQG1vZGVybm8vbG9nZ2VyXCI7XHJcbmltcG9ydCBjaGFsayBmcm9tIFwiY2hhbGtcIjtcclxuaW1wb3J0IGNvcnNNaWRkbGV3YXJlIGZyb20gXCJjb3JzXCI7XHJcbmltcG9ydCB7cGFyc2UgYXMgcGFyc2VVUkx9IGZyb20gXCJmYXN0LXVybC1wYXJzZXJcIjtcclxuaW1wb3J0IFJvdXRlciwge1JlcSwgUmVzfSBmcm9tIFwiZmluZC1teS13YXlcIjtcclxuaW1wb3J0IHtyZWFkRmlsZX0gZnJvbSBcImZzXCI7XHJcbmltcG9ydCB7U2VydmVyUmVzcG9uc2V9IGZyb20gXCJodHRwXCI7XHJcbmltcG9ydCBIdHRwU3RhdHVzIGZyb20gXCJodHRwLXN0YXR1cy1jb2Rlc1wiO1xyXG5pbXBvcnQge0h0dHAyU2VydmVyUmVzcG9uc2V9IGZyb20gXCJodHRwMlwiO1xyXG5pbXBvcnQgbWVtb2l6ZWQgZnJvbSBcIm5hbm8tbWVtb2l6ZVwiO1xyXG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xyXG5pbXBvcnQge01vZGVybm9PcHRpb25zfSBmcm9tIFwiLi9jb25maWd1cmVcIjtcclxuaW1wb3J0IHt1c2VSZXNvdXJjZVByb3ZpZGVyfSBmcm9tIFwiLi9wcm92aWRlcnMvcmVzb3VyY2UtcHJvdmlkZXJcIjtcclxuaW1wb3J0IHtjcmVhdGVSb3V0ZXJ9IGZyb20gXCIuL3JvdXRlclwiO1xyXG5pbXBvcnQge3VzZUh0dHAyUHVzaH0gZnJvbSBcIi4vdXRpbC9odHRwMi1wdXNoXCI7XHJcbmltcG9ydCB7Y29udGVudFR5cGV9IGZyb20gXCIuL3V0aWwvbWltZS10eXBlc1wiO1xyXG5cclxudHlwZSBWZXJzaW9uID0gUm91dGVyLkhUVFBWZXJzaW9uLlYxIHwgUm91dGVyLkhUVFBWZXJzaW9uLlYyO1xyXG5cclxuZXhwb3J0IGNvbnN0IHVzZVJlcXVlc3RIYW5kbGVyID0gbWVtb2l6ZWQoPFYgZXh0ZW5kcyBWZXJzaW9uPihvcHRpb25zOiBNb2Rlcm5vT3B0aW9ucykgPT4ge1xyXG5cclxuICAgIGNvbnN0IHtwcm92aWRlUmVzb3VyY2V9ID0gdXNlUmVzb3VyY2VQcm92aWRlcihvcHRpb25zKTtcclxuICAgIGNvbnN0IHtodHRwMlB1c2h9ID0gdXNlSHR0cDJQdXNoKG9wdGlvbnMpO1xyXG5cclxuICAgIGNvbnN0IHJvdXRlciA9IGNyZWF0ZVJvdXRlcjxWPihvcHRpb25zKTtcclxuXHJcbiAgICAvKipcclxuICAgICAqICAgX19fXyAgXyAgICAgICAgXyAgIF8gICAgICAgIF9fX19cclxuICAgICAqICAvIF9fX3x8IHxfIF9fIF98IHxfKF8pIF9fXyAgfCAgXyBcXCBfX18gIF9fXyAgX19fICBfICAgXyBfIF9fIF9fXyBfX18gIF9fX1xyXG4gICAgICogIFxcX19fIFxcfCBfXy8gX2AgfCBfX3wgfC8gX198IHwgfF8pIC8gXyBcXC8gX198LyBfIFxcfCB8IHwgfCAnX18vIF9fLyBfIFxcLyBfX3xcclxuICAgICAqICAgX19fKSB8IHx8IChffCB8IHxffCB8IChfXyAgfCAgXyA8ICBfXy9cXF9fIFxcIChfKSB8IHxffCB8IHwgfCAoX3wgIF9fL1xcX18gXFxcclxuICAgICAqICB8X19fXy8gXFxfX1xcX18sX3xcXF9ffF98XFxfX198IHxffCBcXF9cXF9fX3x8X19fL1xcX19fLyBcXF9fLF98X3wgIFxcX19fXFxfX198fF9fXy9cclxuICAgICAqXHJcbiAgICAgKi9cclxuICAgIHJvdXRlci5nZXQoXCIvcmVzb3VyY2VzLypcIiwgZnVuY3Rpb24gcmVzb3VyY2VzTWlkZGxld2FyZShyZXE6IFJlcTxWPiwgcmVzOiBSZXM8Vj4pIHtcclxuICAgICAgICBjb25zdCB7cGF0aG5hbWV9ID0gcGFyc2VVUkwocmVxLnVybCk7XHJcbiAgICAgICAgY29uc3QgZmlsZW5hbWUgPSBwYXRoLmpvaW4ob3B0aW9ucy5yZXNvdXJjZXMsIHBhdGhuYW1lLnN1YnN0cmluZygxMCkpO1xyXG4gICAgICAgIHNlbmRGaWxlKGZpbGVuYW1lLCByZXMpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgZnVuY3Rpb24gc2VuZEZpbGU8Vj4oZmlsZW5hbWU6IHN0cmluZywgcmVzOiBWIGV4dGVuZHMgUm91dGVyLkhUVFBWZXJzaW9uLlYxID8gU2VydmVyUmVzcG9uc2UgOiBIdHRwMlNlcnZlclJlc3BvbnNlKSB7XHJcbiAgICAgICAgcmVhZEZpbGUoZmlsZW5hbWUsIChlcnIsIGRhdGEpID0+IHtcclxuICAgICAgICAgICAgaWYgKGVycikge1xyXG4gICAgICAgICAgICAgICAgcmVzLndyaXRlSGVhZChIdHRwU3RhdHVzLk5PVF9GT1VORCk7XHJcbiAgICAgICAgICAgICAgICByZXMuZW5kKCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXMud3JpdGVIZWFkKEh0dHBTdGF0dXMuT0ssIHtcclxuICAgICAgICAgICAgICAgICAgICBcImNvbnRlbnQtdHlwZVwiOiBjb250ZW50VHlwZShmaWxlbmFtZSksXHJcbiAgICAgICAgICAgICAgICAgICAgXCJjYWNoZS1jb250cm9sXCI6IFwicHVibGljLCBtYXgtYWdlPTg2NDAwLCBpbW11dGFibGVcIlxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICByZXMuZW5kKGRhdGEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgY3Jvc3NvcmlnaW4gPSBvcHRpb25zLmNvcnMuY3JlZGVudGlhbHMgPyBcImNyb3Nzb3JpZ2luPXVzZS1jcmVkZW50aWFsc1wiIDogXCJjcm9zc29yaWdpbj1hbm9ueW1vdXNcIjtcclxuXHJcbiAgICAvKipcclxuICAgICAqICBfXyAgICAgICAgX18gICAgICAgICBfICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF9fX19cclxuICAgICAqICBcXCBcXCAgICAgIC8gL19fICBfIF9ffCB8IF9fX19fIF8gX18gICBfXyBfICBfX18gX19fICB8ICBfIFxcIF9fXyAgX19fICBfX18gIF8gICBfIF8gX18gX19fIF9fXyAgX19fXHJcbiAgICAgKiAgIFxcIFxcIC9cXCAvIC8gXyBcXHwgJ19ffCB8LyAvIF9ffCAnXyBcXCAvIF9gIHwvIF9fLyBfIFxcIHwgfF8pIC8gXyBcXC8gX198LyBfIFxcfCB8IHwgfCAnX18vIF9fLyBfIFxcLyBfX3xcclxuICAgICAqICAgIFxcIFYgIFYgLyAoXykgfCB8ICB8ICAgPFxcX18gXFwgfF8pIHwgKF98IHwgKF98ICBfXy8gfCAgXyA8ICBfXy9cXF9fIFxcIChfKSB8IHxffCB8IHwgfCAoX3wgIF9fL1xcX18gXFxcclxuICAgICAqICAgICBcXF8vXFxfLyBcXF9fXy98X3wgIHxffFxcX1xcX19fLyAuX18vIFxcX18sX3xcXF9fX1xcX19ffCB8X3wgXFxfXFxfX198fF9fXy9cXF9fXy8gXFxfXyxffF98ICBcXF9fX1xcX19ffHxfX18vXHJcbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8X3xcclxuICAgICAqL1xyXG4gICAgcm91dGVyLmdldChcIi8qXCIsIGFzeW5jIGZ1bmN0aW9uIHdvcmtzcGFjZU1pZGRsZXdhcmUocmVxOiBSZXE8Vj4sIHJlczogUmVzPFY+KSB7XHJcblxyXG4gICAgICAgIGxldCB1cmwgPSByZXEudXJsLCBpc0hNUjtcclxuICAgICAgICBpZiAodXJsKSB0cnkge1xyXG5cclxuICAgICAgICAgICAgaWYgKHVybC5lbmRzV2l0aChcIi5ITVJcIikpIHtcclxuICAgICAgICAgICAgICAgIGxldCBobXJRdWVyeSA9IHVybC5sYXN0SW5kZXhPZihcInY9XCIpO1xyXG4gICAgICAgICAgICAgICAgaXNITVIgPSBobXJRdWVyeSA+IDA7XHJcbiAgICAgICAgICAgICAgICB1cmwgPSBpc0hNUiA/IHVybC5zbGljZSgwLCBobXJRdWVyeSAtIDEpIDogdXJsO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBsZXQge1xyXG4gICAgICAgICAgICAgICAgcGF0aG5hbWUsXHJcbiAgICAgICAgICAgICAgICBoZWFkZXJzLFxyXG4gICAgICAgICAgICAgICAgY29udGVudCxcclxuICAgICAgICAgICAgICAgIGxpbmtzXHJcbiAgICAgICAgICAgIH0gPSBhd2FpdCBwcm92aWRlUmVzb3VyY2UodXJsKTtcclxuXHJcbiAgICAgICAgICAgIGhlYWRlcnMgPSB7Li4uaGVhZGVyc307XHJcblxyXG4gICAgICAgICAgICBpZiAobGlua3MgJiYgb3B0aW9ucy5odHRwMiA9PT0gXCJwcmVsb2FkXCIgJiYgIWlzSE1SKSB7XHJcbiAgICAgICAgICAgICAgICBoZWFkZXJzLmxpbmsgPSBsaW5rcy5tYXAobGluayA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgcHJvdmlkZVJlc291cmNlKGxpbmspLmNhdGNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbG9nLndhcm4oXCJmYWlsZWQgdG8gcHJlLXdhcm0gY2FjaGUgd2l0aDpcIiwgbGluayk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGA8JHtsaW5rfT47IHJlbD1wcmVsb2FkOyAke2Nyb3Nzb3JpZ2lufTsgYXM9JHtsaW5rLmVuZHNXaXRoKFwiLmNzc1wiKSA/IFwic3R5bGVcIiA6IFwic2NyaXB0XCJ9YDtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXMud3JpdGVIZWFkKDIwMCwgaGVhZGVycyk7XHJcblxyXG4gICAgICAgICAgICBpZiAobGlua3MgJiYgb3B0aW9ucy5odHRwMiA9PT0gXCJwdXNoXCIgJiYgcmVzIGluc3RhbmNlb2YgSHR0cDJTZXJ2ZXJSZXNwb25zZSAmJiAhaXNITVIpIHtcclxuICAgICAgICAgICAgICAgIGh0dHAyUHVzaChyZXMuc3RyZWFtLCBwYXRobmFtZSwgbGlua3MpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXMuZW5kKGNvbnRlbnQpO1xyXG5cclxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG5cclxuICAgICAgICAgICAgY29uc3Qge2NvZGUsIGhlYWRlcnMgPSB7fSwgbWVzc2FnZSwgc3RhY2t9ID0gZXJyb3I7XHJcblxyXG4gICAgICAgICAgICBpZiAoc3RhY2spIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGNvZGUgPSBIdHRwU3RhdHVzLklOVEVSTkFMX1NFUlZFUl9FUlJPUjtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHRleHQgPSBIdHRwU3RhdHVzLmdldFN0YXR1c1RleHQoY29kZSk7XHJcbiAgICAgICAgICAgICAgICBsb2cuZXJyb3JgJHtjb2RlfSAnJHt0ZXh0fScgaGFuZGxpbmc6ICR7dXJsfWA7XHJcbiAgICAgICAgICAgICAgICBsb2cuZXJyb3IoZXJyb3IpO1xyXG4gICAgICAgICAgICAgICAgcmVzLndyaXRlSGVhZChjb2RlLCBoZWFkZXJzKTtcclxuICAgICAgICAgICAgICAgIHJlcy5lbmQoc3RhY2spO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgdGV4dCA9IEh0dHBTdGF0dXMuZ2V0U3RhdHVzVGV4dChjb2RlKTtcclxuICAgICAgICAgICAgICAgIGlmIChjb2RlID09PSAzMDgpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyB0b2RvOiBjaGVjayBwZXJtYW5lbnQgcmVkaXJlY3QgYmVoYXZpb3VyXHJcbiAgICAgICAgICAgICAgICAgICAgbG9nLndhcm5gJHtjb2RlfSAnJHt0ZXh0fScgJHt1cmx9IC0+ICR7aGVhZGVycy5sb2NhdGlvbn1gO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBsb2cuZXJyb3JgJHtjb2RlfSAnJHt0ZXh0fScgJHttZXNzYWdlIHx8IFwiaGFuZGxpbmc6IFwiICsgdXJsfWA7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXMud3JpdGVIZWFkKGNvZGUsIGhlYWRlcnMpO1xyXG4gICAgICAgICAgICAgICAgcmVzLmVuZChtZXNzYWdlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogICAgX19fXyAgICAgICAgICAgICAgICAgICAgICBfX18gICAgICAgXyAgICAgICBfICAgICAgICAgX18gIF9fIF8gICAgIF8gICAgIF8gX1xyXG4gICAgICogICAvIF9fX3xfIF9fIF9fXyAgX19fIF9fXyAgIC8gXyBcXCBfIF9fKF8pIF9fIF8oXylfIF9fICAgfCAgXFwvICAoXykgX198IHwgX198IHwgfCBfX19fXyAgICAgIF9fX18gXyBfIF9fIF9fX1xyXG4gICAgICogIHwgfCAgIHwgJ19fLyBfIFxcLyBfXy8gX198IHwgfCB8IHwgJ19ffCB8LyBfYCB8IHwgJ18gXFwgIHwgfFxcL3wgfCB8LyBfYCB8LyBfYCB8IHwvIF8gXFwgXFwgL1xcIC8gLyBfYCB8ICdfXy8gXyBcXFxyXG4gICAgICogIHwgfF9fX3wgfCB8IChfKSBcXF9fIFxcX18gXFwgfCB8X3wgfCB8ICB8IHwgKF98IHwgfCB8IHwgfCB8IHwgIHwgfCB8IChffCB8IChffCB8IHwgIF9fL1xcIFYgIFYgLyAoX3wgfCB8IHwgIF9fL1xyXG4gICAgICogICBcXF9fX198X3wgIFxcX19fL3xfX18vX19fLyAgXFxfX18vfF98ICB8X3xcXF9fLCB8X3xffCB8X3wgfF98ICB8X3xffFxcX18sX3xcXF9fLF98X3xcXF9fX3wgXFxfL1xcXy8gXFxfXyxffF98ICBcXF9fX3xcclxuICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfF9fXy9cclxuICAgICAqL1xyXG4gICAgY29uc3QgY29ycyA9IGNvcnNNaWRkbGV3YXJlKG9wdGlvbnMuY29ycyk7XHJcblxyXG4gICAgY29uc3QgbmV4dCA9IChyZXE6IFJlcTxWPiwgcmVzOiBSZXM8Vj4pID0+IGZ1bmN0aW9uIChlcnIpIHtcclxuICAgICAgICBpZiAoZXJyKSB7XHJcbiAgICAgICAgICAgIHRocm93IGVycjtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByb3V0ZXIubG9va3VwKHJlcSwgcmVzKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiBmdW5jdGlvbiByZXF1ZXN0SGFuZGxlcihyZXE6IFJlcTxWPiwgcmVzOiBSZXM8Vj4pOiB2b2lkIHtcclxuICAgICAgICBsb2cuZGVidWcocmVxLm1ldGhvZCEsIGNoYWxrLm1hZ2VudGEocmVxLnVybCkpO1xyXG4gICAgICAgIGNvcnMocmVxLCByZXMsIG5leHQocmVxLCByZXMpKTtcclxuICAgIH07XHJcbn0pO1xyXG4iXX0=