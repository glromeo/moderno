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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVxdWVzdC1oYW5kbGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3JlcXVlc3QtaGFuZGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxrREFBMEI7QUFDMUIsZ0RBQWtDO0FBQ2xDLHFEQUFrRDtBQUVsRCwyQkFBNEI7QUFFNUIsMEVBQTJDO0FBQzNDLGlDQUEwQztBQUMxQyxnRUFBb0M7QUFDcEMsZ0RBQWlDO0FBQ2pDLDZEQUFrQztBQUVsQyxxRUFBa0U7QUFDbEUscUNBQXNDO0FBQ3RDLGtEQUErQztBQUMvQyxrREFBOEM7QUFJakMsUUFBQSxpQkFBaUIsR0FBRyxzQkFBUSxDQUFDLENBQW9CLE9BQXVCLEVBQUUsRUFBRTtJQUVyRixNQUFNLEVBQUMsZUFBZSxFQUFDLEdBQUcsdUNBQW1CLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDdkQsTUFBTSxFQUFDLFNBQVMsRUFBQyxHQUFHLHlCQUFZLENBQUMsT0FBTyxDQUFDLENBQUM7SUFFMUMsTUFBTSxNQUFNLEdBQUcscUJBQVksQ0FBSSxPQUFPLENBQUMsQ0FBQztJQUV4Qzs7Ozs7OztPQU9HO0lBQ0gsTUFBTSxDQUFDLEdBQUcsQ0FBQyxjQUFjLEVBQUUsU0FBUyxtQkFBbUIsQ0FBQyxHQUFXLEVBQUUsR0FBVztRQUM1RSxNQUFNLEVBQUMsUUFBUSxFQUFDLEdBQUcsdUJBQVEsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDckMsTUFBTSxRQUFRLEdBQUcsY0FBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLFFBQVEsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUN0RSxRQUFRLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQzVCLENBQUMsQ0FBQyxDQUFDO0lBRUgsU0FBUyxRQUFRLENBQUksUUFBZ0IsRUFBRSxHQUEyRTtRQUM5RyxhQUFRLENBQUMsUUFBUSxFQUFFLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxFQUFFO1lBQzdCLElBQUksR0FBRyxFQUFFO2dCQUNMLEdBQUcsQ0FBQyxTQUFTLENBQUMsMkJBQVUsQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDcEMsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDO2FBQ2I7aUJBQU07Z0JBQ0gsR0FBRyxDQUFDLFNBQVMsQ0FBQywyQkFBVSxDQUFDLEVBQUUsRUFBRTtvQkFDekIsY0FBYyxFQUFFLHdCQUFXLENBQUMsUUFBUSxDQUFDO29CQUNyQyxlQUFlLEVBQUUsa0NBQWtDO2lCQUN0RCxDQUFDLENBQUM7Z0JBQ0gsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUNqQjtRQUNMLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVEOzs7Ozs7O09BT0c7SUFDSCxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxLQUFLLFVBQVUsbUJBQW1CLENBQUMsR0FBVyxFQUFFLEdBQVc7UUFFeEUsSUFBSSxHQUFHLEdBQUcsR0FBRyxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUM7UUFDekIsSUFBSSxHQUFHO1lBQUUsSUFBSTtnQkFFVCxJQUFJLEdBQUcsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEVBQUU7b0JBQ3RCLElBQUksUUFBUSxHQUFHLEdBQUcsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQ3JDLEtBQUssR0FBRyxRQUFRLEdBQUcsQ0FBQyxDQUFDO29CQUNyQixHQUFHLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxRQUFRLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQztpQkFDbEQ7Z0JBRUQsSUFBSSxFQUNBLFFBQVEsRUFDUixPQUFPLEVBQ1AsT0FBTyxFQUNQLEtBQUssRUFDUixHQUFHLE1BQU0sZUFBZSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUUvQixPQUFPLEdBQUcsRUFBQyxHQUFHLE9BQU8sRUFBQyxDQUFDO2dCQUV2QixJQUFJLEtBQUssSUFBSSxPQUFPLENBQUMsS0FBSyxLQUFLLFNBQVMsSUFBSSxDQUFDLEtBQUssRUFBRTtvQkFDaEQsT0FBTyxDQUFDLElBQUksR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFO3dCQUM1QixlQUFlLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFDOzRCQUN4QixnQkFBRyxDQUFDLElBQUksQ0FBQyxnQ0FBZ0MsRUFBRSxJQUFJLENBQUMsQ0FBQzt3QkFDckQsQ0FBQyxDQUFDLENBQUM7d0JBQ0gsT0FBTyxJQUFJLElBQUksbUNBQW1DLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUM7b0JBQ25HLENBQUMsQ0FBQyxDQUFDO2lCQUNOO2dCQUVELEdBQUcsQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFDO2dCQUU1QixJQUFJLEtBQUssSUFBSSxPQUFPLENBQUMsS0FBSyxLQUFLLE1BQU0sSUFBSSxHQUFHLFlBQVksMkJBQW1CLElBQUksQ0FBQyxLQUFLLEVBQUU7b0JBQ25GLFNBQVMsQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQztpQkFDMUM7Z0JBRUQsR0FBRyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQzthQUVwQjtZQUFDLE9BQU8sS0FBSyxFQUFFO2dCQUVaLE1BQU0sRUFBQyxJQUFJLEVBQUUsT0FBTyxHQUFHLEVBQUUsRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFDLEdBQUcsS0FBSyxDQUFDO2dCQUVuRCxJQUFJLEtBQUssRUFBRTtvQkFDUCxNQUFNLElBQUksR0FBRywyQkFBVSxDQUFDLHFCQUFxQixDQUFDO29CQUM5QyxNQUFNLElBQUksR0FBRywyQkFBVSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDNUMsZ0JBQUcsQ0FBQyxLQUFLLENBQUEsR0FBRyxJQUFJLEtBQUssSUFBSSxlQUFlLEdBQUcsRUFBRSxDQUFDO29CQUM5QyxnQkFBRyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDakIsR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7b0JBQzdCLEdBQUcsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7aUJBQ2xCO3FCQUFNO29CQUNILE1BQU0sSUFBSSxHQUFHLDJCQUFVLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDO29CQUM1QyxJQUFJLElBQUksS0FBSyxHQUFHLEVBQUU7d0JBQ2QsMkNBQTJDO3dCQUMzQyxnQkFBRyxDQUFDLElBQUksQ0FBQSxHQUFHLElBQUksS0FBSyxJQUFJLEtBQUssR0FBRyxPQUFPLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQztxQkFDN0Q7eUJBQU07d0JBQ0gsZ0JBQUcsQ0FBQyxLQUFLLENBQUEsR0FBRyxJQUFJLEtBQUssSUFBSSxLQUFLLE9BQU8sSUFBSSxZQUFZLEdBQUcsR0FBRyxFQUFFLENBQUM7cUJBQ2pFO29CQUNELEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO29CQUM3QixHQUFHLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO2lCQUNwQjthQUNKO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFSDs7Ozs7OztPQU9HO0lBQ0gsTUFBTSxJQUFJLEdBQUcsY0FBYyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUUxQyxNQUFNLElBQUksR0FBRyxDQUFDLEdBQVcsRUFBRSxHQUFXLEVBQUUsRUFBRSxDQUFDLFVBQVUsR0FBRztRQUNwRCxJQUFJLEdBQUcsRUFBRTtZQUNMLE1BQU0sR0FBRyxDQUFDO1NBQ2I7YUFBTTtZQUNILE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1NBQzNCO0lBQ0wsQ0FBQyxDQUFDO0lBRUYsT0FBTyxTQUFTLGNBQWMsQ0FBQyxHQUFXLEVBQUUsR0FBVztRQUNuRCxnQkFBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsTUFBTyxFQUFFLGVBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDL0MsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQ25DLENBQUMsQ0FBQztBQUNOLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGNoYWxrIGZyb20gXCJjaGFsa1wiO1xuaW1wb3J0IGNvcnNNaWRkbGV3YXJlIGZyb20gXCJjb3JzXCI7XG5pbXBvcnQge3BhcnNlIGFzIHBhcnNlVVJMfSBmcm9tIFwiZmFzdC11cmwtcGFyc2VyXCI7XG5pbXBvcnQgUm91dGVyLCB7UmVxLCBSZXN9IGZyb20gXCJmaW5kLW15LXdheVwiO1xuaW1wb3J0IHtyZWFkRmlsZX0gZnJvbSBcImZzXCI7XG5pbXBvcnQge1NlcnZlclJlc3BvbnNlfSBmcm9tIFwiaHR0cFwiO1xuaW1wb3J0IEh0dHBTdGF0dXMgZnJvbSBcImh0dHAtc3RhdHVzLWNvZGVzXCI7XG5pbXBvcnQge0h0dHAyU2VydmVyUmVzcG9uc2V9IGZyb20gXCJodHRwMlwiO1xuaW1wb3J0IG1lbW9pemVkIGZyb20gXCJuYW5vLW1lbW9pemVcIjtcbmltcG9ydCBwYXRoLCB7cG9zaXh9IGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgbG9nIGZyb20gXCJAbW9kZXJuby9sb2dnZXJcIjtcbmltcG9ydCB7TW9kZXJub09wdGlvbnN9IGZyb20gXCIuL2NvbmZpZ3VyZVwiO1xuaW1wb3J0IHt1c2VSZXNvdXJjZVByb3ZpZGVyfSBmcm9tIFwiLi9wcm92aWRlcnMvcmVzb3VyY2UtcHJvdmlkZXJcIjtcbmltcG9ydCB7Y3JlYXRlUm91dGVyfSBmcm9tIFwiLi9yb3V0ZXJcIjtcbmltcG9ydCB7dXNlSHR0cDJQdXNofSBmcm9tIFwiLi91dGlsL2h0dHAyLXB1c2hcIjtcbmltcG9ydCB7Y29udGVudFR5cGV9IGZyb20gXCIuL3V0aWwvbWltZS10eXBlc1wiO1xuXG50eXBlIFZlcnNpb24gPSBSb3V0ZXIuSFRUUFZlcnNpb24uVjEgfCBSb3V0ZXIuSFRUUFZlcnNpb24uVjI7XG5cbmV4cG9ydCBjb25zdCB1c2VSZXF1ZXN0SGFuZGxlciA9IG1lbW9pemVkKDxWIGV4dGVuZHMgVmVyc2lvbj4ob3B0aW9uczogTW9kZXJub09wdGlvbnMpID0+IHtcblxuICAgIGNvbnN0IHtwcm92aWRlUmVzb3VyY2V9ID0gdXNlUmVzb3VyY2VQcm92aWRlcihvcHRpb25zKTtcbiAgICBjb25zdCB7aHR0cDJQdXNofSA9IHVzZUh0dHAyUHVzaChvcHRpb25zKTtcblxuICAgIGNvbnN0IHJvdXRlciA9IGNyZWF0ZVJvdXRlcjxWPihvcHRpb25zKTtcblxuICAgIC8qKlxuICAgICAqICAgX19fXyAgXyAgICAgICAgXyAgIF8gICAgICAgIF9fX19cbiAgICAgKiAgLyBfX198fCB8XyBfXyBffCB8XyhfKSBfX18gIHwgIF8gXFwgX19fICBfX18gIF9fXyAgXyAgIF8gXyBfXyBfX18gX19fICBfX19cbiAgICAgKiAgXFxfX18gXFx8IF9fLyBfYCB8IF9ffCB8LyBfX3wgfCB8XykgLyBfIFxcLyBfX3wvIF8gXFx8IHwgfCB8ICdfXy8gX18vIF8gXFwvIF9ffFxuICAgICAqICAgX19fKSB8IHx8IChffCB8IHxffCB8IChfXyAgfCAgXyA8ICBfXy9cXF9fIFxcIChfKSB8IHxffCB8IHwgfCAoX3wgIF9fL1xcX18gXFxcbiAgICAgKiAgfF9fX18vIFxcX19cXF9fLF98XFxfX3xffFxcX19ffCB8X3wgXFxfXFxfX198fF9fXy9cXF9fXy8gXFxfXyxffF98ICBcXF9fX1xcX19ffHxfX18vXG4gICAgICpcbiAgICAgKi9cbiAgICByb3V0ZXIuZ2V0KFwiL3Jlc291cmNlcy8qXCIsIGZ1bmN0aW9uIHJlc291cmNlc01pZGRsZXdhcmUocmVxOiBSZXE8Vj4sIHJlczogUmVzPFY+KSB7XG4gICAgICAgIGNvbnN0IHtwYXRobmFtZX0gPSBwYXJzZVVSTChyZXEudXJsKTtcbiAgICAgICAgY29uc3QgZmlsZW5hbWUgPSBwYXRoLmpvaW4ob3B0aW9ucy5yZXNvdXJjZXMsIHBhdGhuYW1lLnN1YnN0cmluZygxMCkpO1xuICAgICAgICBzZW5kRmlsZShmaWxlbmFtZSwgcmVzKTtcbiAgICB9KTtcblxuICAgIGZ1bmN0aW9uIHNlbmRGaWxlPFY+KGZpbGVuYW1lOiBzdHJpbmcsIHJlczogViBleHRlbmRzIFJvdXRlci5IVFRQVmVyc2lvbi5WMSA/IFNlcnZlclJlc3BvbnNlIDogSHR0cDJTZXJ2ZXJSZXNwb25zZSkge1xuICAgICAgICByZWFkRmlsZShmaWxlbmFtZSwgKGVyciwgZGF0YSkgPT4ge1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoSHR0cFN0YXR1cy5OT1RfRk9VTkQpO1xuICAgICAgICAgICAgICAgIHJlcy5lbmQoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVzLndyaXRlSGVhZChIdHRwU3RhdHVzLk9LLCB7XG4gICAgICAgICAgICAgICAgICAgIFwiY29udGVudC10eXBlXCI6IGNvbnRlbnRUeXBlKGZpbGVuYW1lKSxcbiAgICAgICAgICAgICAgICAgICAgXCJjYWNoZS1jb250cm9sXCI6IFwicHVibGljLCBtYXgtYWdlPTg2NDAwLCBpbW11dGFibGVcIlxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJlcy5lbmQoZGF0YSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqICBfXyAgICAgICAgX18gICAgICAgICBfICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF9fX19cbiAgICAgKiAgXFwgXFwgICAgICAvIC9fXyAgXyBfX3wgfCBfX19fXyBfIF9fICAgX18gXyAgX19fIF9fXyAgfCAgXyBcXCBfX18gIF9fXyAgX19fICBfICAgXyBfIF9fIF9fXyBfX18gIF9fX1xuICAgICAqICAgXFwgXFwgL1xcIC8gLyBfIFxcfCAnX198IHwvIC8gX198ICdfIFxcIC8gX2AgfC8gX18vIF8gXFwgfCB8XykgLyBfIFxcLyBfX3wvIF8gXFx8IHwgfCB8ICdfXy8gX18vIF8gXFwvIF9ffFxuICAgICAqICAgIFxcIFYgIFYgLyAoXykgfCB8ICB8ICAgPFxcX18gXFwgfF8pIHwgKF98IHwgKF98ICBfXy8gfCAgXyA8ICBfXy9cXF9fIFxcIChfKSB8IHxffCB8IHwgfCAoX3wgIF9fL1xcX18gXFxcbiAgICAgKiAgICAgXFxfL1xcXy8gXFxfX18vfF98ICB8X3xcXF9cXF9fXy8gLl9fLyBcXF9fLF98XFxfX19cXF9fX3wgfF98IFxcX1xcX19ffHxfX18vXFxfX18vIFxcX18sX3xffCAgXFxfX19cXF9fX3x8X19fL1xuICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHxffFxuICAgICAqL1xuICAgIHJvdXRlci5nZXQoXCIvKlwiLCBhc3luYyBmdW5jdGlvbiB3b3Jrc3BhY2VNaWRkbGV3YXJlKHJlcTogUmVxPFY+LCByZXM6IFJlczxWPikge1xuXG4gICAgICAgIGxldCB1cmwgPSByZXEudXJsLCBpc0hNUjtcbiAgICAgICAgaWYgKHVybCkgdHJ5IHtcblxuICAgICAgICAgICAgaWYgKHVybC5lbmRzV2l0aChcIi5ITVJcIikpIHtcbiAgICAgICAgICAgICAgICBsZXQgaG1yUXVlcnkgPSB1cmwubGFzdEluZGV4T2YoXCJ2PVwiKTtcbiAgICAgICAgICAgICAgICBpc0hNUiA9IGhtclF1ZXJ5ID4gMDtcbiAgICAgICAgICAgICAgICB1cmwgPSBpc0hNUiA/IHVybC5zbGljZSgwLCBobXJRdWVyeSAtIDEpIDogdXJsO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBsZXQge1xuICAgICAgICAgICAgICAgIHBhdGhuYW1lLFxuICAgICAgICAgICAgICAgIGhlYWRlcnMsXG4gICAgICAgICAgICAgICAgY29udGVudCxcbiAgICAgICAgICAgICAgICBsaW5rc1xuICAgICAgICAgICAgfSA9IGF3YWl0IHByb3ZpZGVSZXNvdXJjZSh1cmwpO1xuXG4gICAgICAgICAgICBoZWFkZXJzID0gey4uLmhlYWRlcnN9O1xuXG4gICAgICAgICAgICBpZiAobGlua3MgJiYgb3B0aW9ucy5odHRwMiA9PT0gXCJwcmVsb2FkXCIgJiYgIWlzSE1SKSB7XG4gICAgICAgICAgICAgICAgaGVhZGVycy5saW5rID0gbGlua3MubWFwKGxpbmsgPT4ge1xuICAgICAgICAgICAgICAgICAgICBwcm92aWRlUmVzb3VyY2UobGluaykuY2F0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9nLndhcm4oXCJmYWlsZWQgdG8gcHJlLXdhcm0gY2FjaGUgd2l0aDpcIiwgbGluayk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYDwke2xpbmt9PjsgY3Jvc3NvcmlnaW47IHJlbD1wcmVsb2FkOyBhcz0ke2xpbmsuZW5kc1dpdGgoXCIuY3NzXCIpID8gXCJzdHlsZVwiIDogXCJzY3JpcHRcIn1gO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXMud3JpdGVIZWFkKDIwMCwgaGVhZGVycyk7XG5cbiAgICAgICAgICAgIGlmIChsaW5rcyAmJiBvcHRpb25zLmh0dHAyID09PSBcInB1c2hcIiAmJiByZXMgaW5zdGFuY2VvZiBIdHRwMlNlcnZlclJlc3BvbnNlICYmICFpc0hNUikge1xuICAgICAgICAgICAgICAgIGh0dHAyUHVzaChyZXMuc3RyZWFtLCBwYXRobmFtZSwgbGlua3MpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXMuZW5kKGNvbnRlbnQpO1xuXG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG5cbiAgICAgICAgICAgIGNvbnN0IHtjb2RlLCBoZWFkZXJzID0ge30sIG1lc3NhZ2UsIHN0YWNrfSA9IGVycm9yO1xuXG4gICAgICAgICAgICBpZiAoc3RhY2spIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjb2RlID0gSHR0cFN0YXR1cy5JTlRFUk5BTF9TRVJWRVJfRVJST1I7XG4gICAgICAgICAgICAgICAgY29uc3QgdGV4dCA9IEh0dHBTdGF0dXMuZ2V0U3RhdHVzVGV4dChjb2RlKTtcbiAgICAgICAgICAgICAgICBsb2cuZXJyb3JgJHtjb2RlfSAnJHt0ZXh0fScgaGFuZGxpbmc6ICR7dXJsfWA7XG4gICAgICAgICAgICAgICAgbG9nLmVycm9yKGVycm9yKTtcbiAgICAgICAgICAgICAgICByZXMud3JpdGVIZWFkKGNvZGUsIGhlYWRlcnMpO1xuICAgICAgICAgICAgICAgIHJlcy5lbmQoc3RhY2spO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zdCB0ZXh0ID0gSHR0cFN0YXR1cy5nZXRTdGF0dXNUZXh0KGNvZGUpO1xuICAgICAgICAgICAgICAgIGlmIChjb2RlID09PSAzMDgpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gdG9kbzogY2hlY2sgcGVybWFuZW50IHJlZGlyZWN0IGJlaGF2aW91clxuICAgICAgICAgICAgICAgICAgICBsb2cud2FybmAke2NvZGV9ICcke3RleHR9JyAke3VybH0gLT4gJHtoZWFkZXJzLmxvY2F0aW9ufWA7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbG9nLmVycm9yYCR7Y29kZX0gJyR7dGV4dH0nICR7bWVzc2FnZSB8fCBcImhhbmRsaW5nOiBcIiArIHVybH1gO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXMud3JpdGVIZWFkKGNvZGUsIGhlYWRlcnMpO1xuICAgICAgICAgICAgICAgIHJlcy5lbmQobWVzc2FnZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqICAgIF9fX18gICAgICAgICAgICAgICAgICAgICAgX19fICAgICAgIF8gICAgICAgXyAgICAgICAgIF9fICBfXyBfICAgICBfICAgICBfIF9cbiAgICAgKiAgIC8gX19ffF8gX18gX19fICBfX18gX19fICAgLyBfIFxcIF8gX18oXykgX18gXyhfKV8gX18gICB8ICBcXC8gIChfKSBfX3wgfCBfX3wgfCB8IF9fX19fICAgICAgX19fXyBfIF8gX18gX19fXG4gICAgICogIHwgfCAgIHwgJ19fLyBfIFxcLyBfXy8gX198IHwgfCB8IHwgJ19ffCB8LyBfYCB8IHwgJ18gXFwgIHwgfFxcL3wgfCB8LyBfYCB8LyBfYCB8IHwvIF8gXFwgXFwgL1xcIC8gLyBfYCB8ICdfXy8gXyBcXFxuICAgICAqICB8IHxfX198IHwgfCAoXykgXFxfXyBcXF9fIFxcIHwgfF98IHwgfCAgfCB8IChffCB8IHwgfCB8IHwgfCB8ICB8IHwgfCAoX3wgfCAoX3wgfCB8ICBfXy9cXCBWICBWIC8gKF98IHwgfCB8ICBfXy9cbiAgICAgKiAgIFxcX19fX3xffCAgXFxfX18vfF9fXy9fX18vICBcXF9fXy98X3wgIHxffFxcX18sIHxffF98IHxffCB8X3wgIHxffF98XFxfXyxffFxcX18sX3xffFxcX19ffCBcXF8vXFxfLyBcXF9fLF98X3wgIFxcX19ffFxuICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfF9fXy9cbiAgICAgKi9cbiAgICBjb25zdCBjb3JzID0gY29yc01pZGRsZXdhcmUob3B0aW9ucy5jb3JzKTtcblxuICAgIGNvbnN0IG5leHQgPSAocmVxOiBSZXE8Vj4sIHJlczogUmVzPFY+KSA9PiBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJvdXRlci5sb29rdXAocmVxLCByZXMpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHJldHVybiBmdW5jdGlvbiByZXF1ZXN0SGFuZGxlcihyZXE6IFJlcTxWPiwgcmVzOiBSZXM8Vj4pOiB2b2lkIHtcbiAgICAgICAgbG9nLmRlYnVnKHJlcS5tZXRob2QhLCBjaGFsay5tYWdlbnRhKHJlcS51cmwpKTtcbiAgICAgICAgY29ycyhyZXEsIHJlcywgbmV4dChyZXEsIHJlcykpO1xuICAgIH07XG59KTtcbiJdfQ==