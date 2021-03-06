"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useRequestHandler = void 0;
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
        logger_1.default.debug(req.method, req.url);
        cors(req, res, next(req, res));
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVxdWVzdC1oYW5kbGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3JlcXVlc3QtaGFuZGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxnREFBa0M7QUFDbEMscURBQWtEO0FBRWxELDJCQUE0QjtBQUU1QiwwRUFBMkM7QUFDM0MsaUNBQTBDO0FBQzFDLGdFQUFvQztBQUNwQyxnREFBaUM7QUFDakMsNkRBQWtDO0FBRWxDLHFFQUFrRTtBQUNsRSxxQ0FBc0M7QUFDdEMsa0RBQStDO0FBQy9DLGtEQUE4QztBQUlqQyxRQUFBLGlCQUFpQixHQUFHLHNCQUFRLENBQUMsQ0FBb0IsT0FBdUIsRUFBRSxFQUFFO0lBRXJGLE1BQU0sRUFBQyxlQUFlLEVBQUMsR0FBRyx1Q0FBbUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUN2RCxNQUFNLEVBQUMsU0FBUyxFQUFDLEdBQUcseUJBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUUxQyxNQUFNLE1BQU0sR0FBRyxxQkFBWSxDQUFJLE9BQU8sQ0FBQyxDQUFDO0lBRXhDOzs7Ozs7O09BT0c7SUFDSCxNQUFNLENBQUMsR0FBRyxDQUFDLGNBQWMsRUFBRSxTQUFTLG1CQUFtQixDQUFDLEdBQVcsRUFBRSxHQUFXO1FBQzVFLE1BQU0sRUFBQyxRQUFRLEVBQUMsR0FBRyx1QkFBUSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNyQyxNQUFNLFFBQVEsR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsUUFBUSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3RFLFFBQVEsQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDNUIsQ0FBQyxDQUFDLENBQUM7SUFFSCxTQUFTLFFBQVEsQ0FBSSxRQUFnQixFQUFFLEdBQTJFO1FBQzlHLGFBQVEsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFF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QUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxNQUFPLEVBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2hDLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztJQUNuQyxDQUFDLENBQUM7QUFDTixDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBjb3JzTWlkZGxld2FyZSBmcm9tIFwiY29yc1wiO1xuaW1wb3J0IHtwYXJzZSBhcyBwYXJzZVVSTH0gZnJvbSBcImZhc3QtdXJsLXBhcnNlclwiO1xuaW1wb3J0IFJvdXRlciwge1JlcSwgUmVzfSBmcm9tIFwiZmluZC1teS13YXlcIjtcbmltcG9ydCB7cmVhZEZpbGV9IGZyb20gXCJmc1wiO1xuaW1wb3J0IHtTZXJ2ZXJSZXNwb25zZX0gZnJvbSBcImh0dHBcIjtcbmltcG9ydCBIdHRwU3RhdHVzIGZyb20gXCJodHRwLXN0YXR1cy1jb2Rlc1wiO1xuaW1wb3J0IHtIdHRwMlNlcnZlclJlc3BvbnNlfSBmcm9tIFwiaHR0cDJcIjtcbmltcG9ydCBtZW1vaXplZCBmcm9tIFwibmFuby1tZW1vaXplXCI7XG5pbXBvcnQgcGF0aCwge3Bvc2l4fSBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IGxvZyBmcm9tIFwiQG1vZGVybm8vbG9nZ2VyXCI7XG5pbXBvcnQge01vZGVybm9PcHRpb25zfSBmcm9tIFwiLi9jb25maWd1cmVcIjtcbmltcG9ydCB7dXNlUmVzb3VyY2VQcm92aWRlcn0gZnJvbSBcIi4vcHJvdmlkZXJzL3Jlc291cmNlLXByb3ZpZGVyXCI7XG5pbXBvcnQge2NyZWF0ZVJvdXRlcn0gZnJvbSBcIi4vcm91dGVyXCI7XG5pbXBvcnQge3VzZUh0dHAyUHVzaH0gZnJvbSBcIi4vdXRpbC9odHRwMi1wdXNoXCI7XG5pbXBvcnQge2NvbnRlbnRUeXBlfSBmcm9tIFwiLi91dGlsL21pbWUtdHlwZXNcIjtcblxudHlwZSBWZXJzaW9uID0gUm91dGVyLkhUVFBWZXJzaW9uLlYxIHwgUm91dGVyLkhUVFBWZXJzaW9uLlYyO1xuXG5leHBvcnQgY29uc3QgdXNlUmVxdWVzdEhhbmRsZXIgPSBtZW1vaXplZCg8ViBleHRlbmRzIFZlcnNpb24+KG9wdGlvbnM6IE1vZGVybm9PcHRpb25zKSA9PiB7XG5cbiAgICBjb25zdCB7cHJvdmlkZVJlc291cmNlfSA9IHVzZVJlc291cmNlUHJvdmlkZXIob3B0aW9ucyk7XG4gICAgY29uc3Qge2h0dHAyUHVzaH0gPSB1c2VIdHRwMlB1c2gob3B0aW9ucyk7XG5cbiAgICBjb25zdCByb3V0ZXIgPSBjcmVhdGVSb3V0ZXI8Vj4ob3B0aW9ucyk7XG5cbiAgICAvKipcbiAgICAgKiAgIF9fX18gIF8gICAgICAgIF8gICBfICAgICAgICBfX19fXG4gICAgICogIC8gX19ffHwgfF8gX18gX3wgfF8oXykgX19fICB8ICBfIFxcIF9fXyAgX19fICBfX18gIF8gICBfIF8gX18gX19fIF9fXyAgX19fXG4gICAgICogIFxcX19fIFxcfCBfXy8gX2AgfCBfX3wgfC8gX198IHwgfF8pIC8gXyBcXC8gX198LyBfIFxcfCB8IHwgfCAnX18vIF9fLyBfIFxcLyBfX3xcbiAgICAgKiAgIF9fXykgfCB8fCAoX3wgfCB8X3wgfCAoX18gIHwgIF8gPCAgX18vXFxfXyBcXCAoXykgfCB8X3wgfCB8IHwgKF98ICBfXy9cXF9fIFxcXG4gICAgICogIHxfX19fLyBcXF9fXFxfXyxffFxcX198X3xcXF9fX3wgfF98IFxcX1xcX19ffHxfX18vXFxfX18vIFxcX18sX3xffCAgXFxfX19cXF9fX3x8X19fL1xuICAgICAqXG4gICAgICovXG4gICAgcm91dGVyLmdldChcIi9yZXNvdXJjZXMvKlwiLCBmdW5jdGlvbiByZXNvdXJjZXNNaWRkbGV3YXJlKHJlcTogUmVxPFY+LCByZXM6IFJlczxWPikge1xuICAgICAgICBjb25zdCB7cGF0aG5hbWV9ID0gcGFyc2VVUkwocmVxLnVybCk7XG4gICAgICAgIGNvbnN0IGZpbGVuYW1lID0gcGF0aC5qb2luKG9wdGlvbnMucmVzb3VyY2VzLCBwYXRobmFtZS5zdWJzdHJpbmcoMTApKTtcbiAgICAgICAgc2VuZEZpbGUoZmlsZW5hbWUsIHJlcyk7XG4gICAgfSk7XG5cbiAgICBmdW5jdGlvbiBzZW5kRmlsZTxWPihmaWxlbmFtZTogc3RyaW5nLCByZXM6IFYgZXh0ZW5kcyBSb3V0ZXIuSFRUUFZlcnNpb24uVjEgPyBTZXJ2ZXJSZXNwb25zZSA6IEh0dHAyU2VydmVyUmVzcG9uc2UpIHtcbiAgICAgICAgcmVhZEZpbGUoZmlsZW5hbWUsIChlcnIsIGRhdGEpID0+IHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICByZXMud3JpdGVIZWFkKEh0dHBTdGF0dXMuTk9UX0ZPVU5EKTtcbiAgICAgICAgICAgICAgICByZXMuZW5kKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoSHR0cFN0YXR1cy5PSywge1xuICAgICAgICAgICAgICAgICAgICBcImNvbnRlbnQtdHlwZVwiOiBjb250ZW50VHlwZShmaWxlbmFtZSksXG4gICAgICAgICAgICAgICAgICAgIFwiY2FjaGUtY29udHJvbFwiOiBcInB1YmxpYywgbWF4LWFnZT04NjQwMCwgaW1tdXRhYmxlXCJcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICByZXMuZW5kKGRhdGEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiAgX18gICAgICAgIF9fICAgICAgICAgXyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfX19fXG4gICAgICogIFxcIFxcICAgICAgLyAvX18gIF8gX198IHwgX19fX18gXyBfXyAgIF9fIF8gIF9fXyBfX18gIHwgIF8gXFwgX19fICBfX18gIF9fXyAgXyAgIF8gXyBfXyBfX18gX19fICBfX19cbiAgICAgKiAgIFxcIFxcIC9cXCAvIC8gXyBcXHwgJ19ffCB8LyAvIF9ffCAnXyBcXCAvIF9gIHwvIF9fLyBfIFxcIHwgfF8pIC8gXyBcXC8gX198LyBfIFxcfCB8IHwgfCAnX18vIF9fLyBfIFxcLyBfX3xcbiAgICAgKiAgICBcXCBWICBWIC8gKF8pIHwgfCAgfCAgIDxcXF9fIFxcIHxfKSB8IChffCB8IChffCAgX18vIHwgIF8gPCAgX18vXFxfXyBcXCAoXykgfCB8X3wgfCB8IHwgKF98ICBfXy9cXF9fIFxcXG4gICAgICogICAgIFxcXy9cXF8vIFxcX19fL3xffCAgfF98XFxfXFxfX18vIC5fXy8gXFxfXyxffFxcX19fXFxfX198IHxffCBcXF9cXF9fX3x8X19fL1xcX19fLyBcXF9fLF98X3wgIFxcX19fXFxfX198fF9fXy9cbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8X3xcbiAgICAgKi9cbiAgICByb3V0ZXIuZ2V0KFwiLypcIiwgYXN5bmMgZnVuY3Rpb24gd29ya3NwYWNlTWlkZGxld2FyZShyZXE6IFJlcTxWPiwgcmVzOiBSZXM8Vj4pIHtcblxuICAgICAgICBsZXQgdXJsID0gcmVxLnVybCwgaXNITVI7XG4gICAgICAgIGlmICh1cmwpIHRyeSB7XG5cbiAgICAgICAgICAgIGlmICh1cmwuZW5kc1dpdGgoXCIuSE1SXCIpKSB7XG4gICAgICAgICAgICAgICAgbGV0IGhtclF1ZXJ5ID0gdXJsLmxhc3RJbmRleE9mKFwidj1cIik7XG4gICAgICAgICAgICAgICAgaXNITVIgPSBobXJRdWVyeSA+IDA7XG4gICAgICAgICAgICAgICAgdXJsID0gaXNITVIgPyB1cmwuc2xpY2UoMCwgaG1yUXVlcnkgLSAxKSA6IHVybDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbGV0IHtcbiAgICAgICAgICAgICAgICBwYXRobmFtZSxcbiAgICAgICAgICAgICAgICBoZWFkZXJzLFxuICAgICAgICAgICAgICAgIGNvbnRlbnQsXG4gICAgICAgICAgICAgICAgbGlua3NcbiAgICAgICAgICAgIH0gPSBhd2FpdCBwcm92aWRlUmVzb3VyY2UodXJsKTtcblxuICAgICAgICAgICAgaGVhZGVycyA9IHsuLi5oZWFkZXJzfTtcblxuICAgICAgICAgICAgaWYgKGxpbmtzICYmIG9wdGlvbnMuaHR0cDIgPT09IFwicHJlbG9hZFwiICYmICFpc0hNUikge1xuICAgICAgICAgICAgICAgIGhlYWRlcnMubGluayA9IGxpbmtzLm1hcChsaW5rID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcHJvdmlkZVJlc291cmNlKGxpbmspLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvZy53YXJuKFwiZmFpbGVkIHRvIHByZS13YXJtIGNhY2hlIHdpdGg6XCIsIGxpbmspO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGA8JHtsaW5rfT47IGNyb3Nzb3JpZ2luOyByZWw9cHJlbG9hZDsgYXM9JHtsaW5rLmVuZHNXaXRoKFwiLmNzc1wiKSA/IFwic3R5bGVcIiA6IFwic2NyaXB0XCJ9YDtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmVzLndyaXRlSGVhZCgyMDAsIGhlYWRlcnMpO1xuXG4gICAgICAgICAgICBpZiAobGlua3MgJiYgb3B0aW9ucy5odHRwMiA9PT0gXCJwdXNoXCIgJiYgcmVzIGluc3RhbmNlb2YgSHR0cDJTZXJ2ZXJSZXNwb25zZSAmJiAhaXNITVIpIHtcbiAgICAgICAgICAgICAgICBodHRwMlB1c2gocmVzLnN0cmVhbSwgcGF0aG5hbWUsIGxpbmtzKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmVzLmVuZChjb250ZW50KTtcblxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuXG4gICAgICAgICAgICBjb25zdCB7Y29kZSwgaGVhZGVycyA9IHt9LCBtZXNzYWdlLCBzdGFja30gPSBlcnJvcjtcblxuICAgICAgICAgICAgaWYgKHN0YWNrKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY29kZSA9IEh0dHBTdGF0dXMuSU5URVJOQUxfU0VSVkVSX0VSUk9SO1xuICAgICAgICAgICAgICAgIGNvbnN0IHRleHQgPSBIdHRwU3RhdHVzLmdldFN0YXR1c1RleHQoY29kZSk7XG4gICAgICAgICAgICAgICAgbG9nLmVycm9yYCR7Y29kZX0gJyR7dGV4dH0nIGhhbmRsaW5nOiAke3VybH1gO1xuICAgICAgICAgICAgICAgIGxvZy5lcnJvcihlcnJvcik7XG4gICAgICAgICAgICAgICAgcmVzLndyaXRlSGVhZChjb2RlLCBoZWFkZXJzKTtcbiAgICAgICAgICAgICAgICByZXMuZW5kKHN0YWNrKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdGV4dCA9IEh0dHBTdGF0dXMuZ2V0U3RhdHVzVGV4dChjb2RlKTtcbiAgICAgICAgICAgICAgICBpZiAoY29kZSA9PT0gMzA4KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHRvZG86IGNoZWNrIHBlcm1hbmVudCByZWRpcmVjdCBiZWhhdmlvdXJcbiAgICAgICAgICAgICAgICAgICAgbG9nLndhcm5gJHtjb2RlfSAnJHt0ZXh0fScgJHt1cmx9IC0+ICR7aGVhZGVycy5sb2NhdGlvbn1gO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGxvZy5lcnJvcmAke2NvZGV9ICcke3RleHR9JyAke21lc3NhZ2UgfHwgXCJoYW5kbGluZzogXCIgKyB1cmx9YDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmVzLndyaXRlSGVhZChjb2RlLCBoZWFkZXJzKTtcbiAgICAgICAgICAgICAgICByZXMuZW5kKG1lc3NhZ2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiAgICBfX19fICAgICAgICAgICAgICAgICAgICAgIF9fXyAgICAgICBfICAgICAgIF8gICAgICAgICBfXyAgX18gXyAgICAgXyAgICAgXyBfXG4gICAgICogICAvIF9fX3xfIF9fIF9fXyAgX19fIF9fXyAgIC8gXyBcXCBfIF9fKF8pIF9fIF8oXylfIF9fICAgfCAgXFwvICAoXykgX198IHwgX198IHwgfCBfX19fXyAgICAgIF9fX18gXyBfIF9fIF9fX1xuICAgICAqICB8IHwgICB8ICdfXy8gXyBcXC8gX18vIF9ffCB8IHwgfCB8ICdfX3wgfC8gX2AgfCB8ICdfIFxcICB8IHxcXC98IHwgfC8gX2AgfC8gX2AgfCB8LyBfIFxcIFxcIC9cXCAvIC8gX2AgfCAnX18vIF8gXFxcbiAgICAgKiAgfCB8X19ffCB8IHwgKF8pIFxcX18gXFxfXyBcXCB8IHxffCB8IHwgIHwgfCAoX3wgfCB8IHwgfCB8IHwgfCAgfCB8IHwgKF98IHwgKF98IHwgfCAgX18vXFwgViAgViAvIChffCB8IHwgfCAgX18vXG4gICAgICogICBcXF9fX198X3wgIFxcX19fL3xfX18vX19fLyAgXFxfX18vfF98ICB8X3xcXF9fLCB8X3xffCB8X3wgfF98ICB8X3xffFxcX18sX3xcXF9fLF98X3xcXF9fX3wgXFxfL1xcXy8gXFxfXyxffF98ICBcXF9fX3xcbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHxfX18vXG4gICAgICovXG4gICAgY29uc3QgY29ycyA9IGNvcnNNaWRkbGV3YXJlKG9wdGlvbnMuY29ycyk7XG5cbiAgICBjb25zdCBuZXh0ID0gKHJlcTogUmVxPFY+LCByZXM6IFJlczxWPikgPT4gZnVuY3Rpb24gKGVycikge1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICB0aHJvdyBlcnI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByb3V0ZXIubG9va3VwKHJlcSwgcmVzKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gcmVxdWVzdEhhbmRsZXIocmVxOiBSZXE8Vj4sIHJlczogUmVzPFY+KTogdm9pZCB7XG4gICAgICAgIGxvZy5kZWJ1ZyhyZXEubWV0aG9kISwgcmVxLnVybCk7XG4gICAgICAgIGNvcnMocmVxLCByZXMsIG5leHQocmVxLCByZXMpKTtcbiAgICB9O1xufSk7XG4iXX0=