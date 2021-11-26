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
    const crossorigin = options.cors.credentials === true
        ? "crossorigin=use-credentials;"
        : options.cors.credentials === false
            ? "crossorigin=anonymous;"
            : "crossorigin;";
    /**
     *  __        __         _                               ____
     *  \ \      / /__  _ __| | _____ _ __   __ _  ___ ___  |  _ \ ___  ___  ___  _   _ _ __ ___ ___  ___
     *   \ \ /\ / / _ \| '__| |/ / __| '_ \ / _` |/ __/ _ \ | |_) / _ \/ __|/ _ \| | | | '__/ __/ _ \/ __|
     *    \ V  V / (_) | |  |   <\__ \ |_) | (_| | (_|  __/ |  _ <  __/\__ \ (_) | |_| | | | (_|  __/\__ \
     *     \_/\_/ \___/|_|  |_|\_\___/ .__/ \__,_|\___\___| |_| \_\___||___/\___/ \__,_|_|  \___\___||___/
     *                               |_|
     */
    router.get("/*", async function workspaceMiddleware(req, res) {
        let url = req.url, isHMR = false;
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
                        return `<${link}>; rel=preload; ${crossorigin} as=${link.endsWith(".css") ? "style" : "script"}`;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVxdWVzdC1oYW5kbGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3JlcXVlc3QtaGFuZGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSw2REFBa0M7QUFDbEMsa0RBQTBCO0FBQzFCLGdEQUFrQztBQUNsQyxxREFBa0Q7QUFFbEQsMkJBQTRCO0FBRTVCLDBFQUEyQztBQUMzQyxpQ0FBMEM7QUFDMUMsZ0VBQW9DO0FBQ3BDLGdEQUF3QjtBQUV4QixxRUFBa0U7QUFDbEUscUNBQXNDO0FBQ3RDLGtEQUErQztBQUMvQyxrREFBOEM7QUFJakMsUUFBQSxpQkFBaUIsR0FBRyxzQkFBUSxDQUFDLENBQW9CLE9BQXVCLEVBQUUsRUFBRTtJQUVyRixNQUFNLEVBQUMsZUFBZSxFQUFDLEdBQUcsdUNBQW1CLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDdkQsTUFBTSxFQUFDLFNBQVMsRUFBQyxHQUFHLHlCQUFZLENBQUMsT0FBTyxDQUFDLENBQUM7SUFFMUMsTUFBTSxNQUFNLEdBQUcscUJBQVksQ0FBSSxPQUFPLENBQUMsQ0FBQztJQUV4Qzs7Ozs7OztPQU9HO0lBQ0gsTUFBTSxDQUFDLEdBQUcsQ0FBQyxjQUFjLEVBQUUsU0FBUyxtQkFBbUIsQ0FBQyxHQUFXLEVBQUUsR0FBVztRQUM1RSxNQUFNLEVBQUMsUUFBUSxFQUFDLEdBQUcsdUJBQVEsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDckMsTUFBTSxRQUFRLEdBQUcsY0FBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLFFBQVEsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUN0RSxRQUFRLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQzVCLENBQUMsQ0FBQyxDQUFDO0lBRUgsU0FBUyxRQUFRLENBQUksUUFBZ0IsRUFBRSxHQUEyRTtRQUM5RyxhQUFRLENBQUMsUUFBUSxFQUFFLENBQUMsR0FBRyxF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LEVBQUUsR0FBVyxFQUFFLEVBQUUsQ0FBQyxVQUFVLEdBQUc7UUFDcEQsSUFBSSxHQUFHLEVBQUU7WUFDTCxNQUFNLEdBQUcsQ0FBQztTQUNiO2FBQU07WUFDSCxNQUFNLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQztTQUMzQjtJQUNMLENBQUMsQ0FBQztJQUVGLE9BQU8sU0FBUyxjQUFjLENBQUMsR0FBVyxFQUFFLEdBQVc7UUFDbkQsZ0JBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLE1BQU8sRUFBRSxlQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQy9DLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztJQUNuQyxDQUFDLENBQUM7QUFDTixDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBsb2cgZnJvbSBcIkBtb2Rlcm5vL2xvZ2dlclwiO1xyXG5pbXBvcnQgY2hhbGsgZnJvbSBcImNoYWxrXCI7XHJcbmltcG9ydCBjb3JzTWlkZGxld2FyZSBmcm9tIFwiY29yc1wiO1xyXG5pbXBvcnQge3BhcnNlIGFzIHBhcnNlVVJMfSBmcm9tIFwiZmFzdC11cmwtcGFyc2VyXCI7XHJcbmltcG9ydCBSb3V0ZXIsIHtSZXEsIFJlc30gZnJvbSBcImZpbmQtbXktd2F5XCI7XHJcbmltcG9ydCB7cmVhZEZpbGV9IGZyb20gXCJmc1wiO1xyXG5pbXBvcnQge1NlcnZlclJlc3BvbnNlfSBmcm9tIFwiaHR0cFwiO1xyXG5pbXBvcnQgSHR0cFN0YXR1cyBmcm9tIFwiaHR0cC1zdGF0dXMtY29kZXNcIjtcclxuaW1wb3J0IHtIdHRwMlNlcnZlclJlc3BvbnNlfSBmcm9tIFwiaHR0cDJcIjtcclxuaW1wb3J0IG1lbW9pemVkIGZyb20gXCJuYW5vLW1lbW9pemVcIjtcclxuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0IHtNb2Rlcm5vT3B0aW9uc30gZnJvbSBcIi4vY29uZmlndXJlXCI7XHJcbmltcG9ydCB7dXNlUmVzb3VyY2VQcm92aWRlcn0gZnJvbSBcIi4vcHJvdmlkZXJzL3Jlc291cmNlLXByb3ZpZGVyXCI7XHJcbmltcG9ydCB7Y3JlYXRlUm91dGVyfSBmcm9tIFwiLi9yb3V0ZXJcIjtcclxuaW1wb3J0IHt1c2VIdHRwMlB1c2h9IGZyb20gXCIuL3V0aWwvaHR0cDItcHVzaFwiO1xyXG5pbXBvcnQge2NvbnRlbnRUeXBlfSBmcm9tIFwiLi91dGlsL21pbWUtdHlwZXNcIjtcclxuXHJcbnR5cGUgVmVyc2lvbiA9IFJvdXRlci5IVFRQVmVyc2lvbi5WMSB8IFJvdXRlci5IVFRQVmVyc2lvbi5WMjtcclxuXHJcbmV4cG9ydCBjb25zdCB1c2VSZXF1ZXN0SGFuZGxlciA9IG1lbW9pemVkKDxWIGV4dGVuZHMgVmVyc2lvbj4ob3B0aW9uczogTW9kZXJub09wdGlvbnMpID0+IHtcclxuXHJcbiAgICBjb25zdCB7cHJvdmlkZVJlc291cmNlfSA9IHVzZVJlc291cmNlUHJvdmlkZXIob3B0aW9ucyk7XHJcbiAgICBjb25zdCB7aHR0cDJQdXNofSA9IHVzZUh0dHAyUHVzaChvcHRpb25zKTtcclxuXHJcbiAgICBjb25zdCByb3V0ZXIgPSBjcmVhdGVSb3V0ZXI8Vj4ob3B0aW9ucyk7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiAgIF9fX18gIF8gICAgICAgIF8gICBfICAgICAgICBfX19fXHJcbiAgICAgKiAgLyBfX198fCB8XyBfXyBffCB8XyhfKSBfX18gIHwgIF8gXFwgX19fICBfX18gIF9fXyAgXyAgIF8gXyBfXyBfX18gX19fICBfX19cclxuICAgICAqICBcXF9fXyBcXHwgX18vIF9gIHwgX198IHwvIF9ffCB8IHxfKSAvIF8gXFwvIF9ffC8gXyBcXHwgfCB8IHwgJ19fLyBfXy8gXyBcXC8gX198XHJcbiAgICAgKiAgIF9fXykgfCB8fCAoX3wgfCB8X3wgfCAoX18gIHwgIF8gPCAgX18vXFxfXyBcXCAoXykgfCB8X3wgfCB8IHwgKF98ICBfXy9cXF9fIFxcXHJcbiAgICAgKiAgfF9fX18vIFxcX19cXF9fLF98XFxfX3xffFxcX19ffCB8X3wgXFxfXFxfX198fF9fXy9cXF9fXy8gXFxfXyxffF98ICBcXF9fX1xcX19ffHxfX18vXHJcbiAgICAgKlxyXG4gICAgICovXHJcbiAgICByb3V0ZXIuZ2V0KFwiL3Jlc291cmNlcy8qXCIsIGZ1bmN0aW9uIHJlc291cmNlc01pZGRsZXdhcmUocmVxOiBSZXE8Vj4sIHJlczogUmVzPFY+KSB7XHJcbiAgICAgICAgY29uc3Qge3BhdGhuYW1lfSA9IHBhcnNlVVJMKHJlcS51cmwpO1xyXG4gICAgICAgIGNvbnN0IGZpbGVuYW1lID0gcGF0aC5qb2luKG9wdGlvbnMucmVzb3VyY2VzLCBwYXRobmFtZS5zdWJzdHJpbmcoMTApKTtcclxuICAgICAgICBzZW5kRmlsZShmaWxlbmFtZSwgcmVzKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGZ1bmN0aW9uIHNlbmRGaWxlPFY+KGZpbGVuYW1lOiBzdHJpbmcsIHJlczogViBleHRlbmRzIFJvdXRlci5IVFRQVmVyc2lvbi5WMSA/IFNlcnZlclJlc3BvbnNlIDogSHR0cDJTZXJ2ZXJSZXNwb25zZSkge1xyXG4gICAgICAgIHJlYWRGaWxlKGZpbGVuYW1lLCAoZXJyLCBkYXRhKSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChlcnIpIHtcclxuICAgICAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoSHR0cFN0YXR1cy5OT1RfRk9VTkQpO1xyXG4gICAgICAgICAgICAgICAgcmVzLmVuZCgpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmVzLndyaXRlSGVhZChIdHRwU3RhdHVzLk9LLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgXCJjb250ZW50LXR5cGVcIjogY29udGVudFR5cGUoZmlsZW5hbWUpLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiY2FjaGUtY29udHJvbFwiOiBcInB1YmxpYywgbWF4LWFnZT04NjQwMCwgaW1tdXRhYmxlXCJcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgcmVzLmVuZChkYXRhKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGNyb3Nzb3JpZ2luID0gb3B0aW9ucy5jb3JzLmNyZWRlbnRpYWxzID09PSB0cnVlXHJcbiAgICAgICAgPyBcImNyb3Nzb3JpZ2luPXVzZS1jcmVkZW50aWFscztcIlxyXG4gICAgICAgIDogb3B0aW9ucy5jb3JzLmNyZWRlbnRpYWxzID09PSBmYWxzZVxyXG4gICAgICAgICAgICA/IFwiY3Jvc3NvcmlnaW49YW5vbnltb3VzO1wiXHJcbiAgICAgICAgICAgIDogXCJjcm9zc29yaWdpbjtcIjtcclxuXHJcbiAgICAvKipcclxuICAgICAqICBfXyAgICAgICAgX18gICAgICAgICBfICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF9fX19cclxuICAgICAqICBcXCBcXCAgICAgIC8gL19fICBfIF9ffCB8IF9fX19fIF8gX18gICBfXyBfICBfX18gX19fICB8ICBfIFxcIF9fXyAgX19fICBfX18gIF8gICBfIF8gX18gX19fIF9fXyAgX19fXHJcbiAgICAgKiAgIFxcIFxcIC9cXCAvIC8gXyBcXHwgJ19ffCB8LyAvIF9ffCAnXyBcXCAvIF9gIHwvIF9fLyBfIFxcIHwgfF8pIC8gXyBcXC8gX198LyBfIFxcfCB8IHwgfCAnX18vIF9fLyBfIFxcLyBfX3xcclxuICAgICAqICAgIFxcIFYgIFYgLyAoXykgfCB8ICB8ICAgPFxcX18gXFwgfF8pIHwgKF98IHwgKF98ICBfXy8gfCAgXyA8ICBfXy9cXF9fIFxcIChfKSB8IHxffCB8IHwgfCAoX3wgIF9fL1xcX18gXFxcclxuICAgICAqICAgICBcXF8vXFxfLyBcXF9fXy98X3wgIHxffFxcX1xcX19fLyAuX18vIFxcX18sX3xcXF9fX1xcX19ffCB8X3wgXFxfXFxfX198fF9fXy9cXF9fXy8gXFxfXyxffF98ICBcXF9fX1xcX19ffHxfX18vXHJcbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8X3xcclxuICAgICAqL1xyXG4gICAgcm91dGVyLmdldChcIi8qXCIsIGFzeW5jIGZ1bmN0aW9uIHdvcmtzcGFjZU1pZGRsZXdhcmUocmVxOiBSZXE8Vj4sIHJlczogUmVzPFY+KSB7XHJcblxyXG4gICAgICAgIGxldCB1cmwgPSByZXEudXJsLCBpc0hNUjogYm9vbGVhbiA9IGZhbHNlO1xyXG4gICAgICAgIGlmICh1cmwpIHRyeSB7XHJcblxyXG4gICAgICAgICAgICBpZiAodXJsLmVuZHNXaXRoKFwiLkhNUlwiKSkge1xyXG4gICAgICAgICAgICAgICAgbGV0IGhtclF1ZXJ5ID0gdXJsLmxhc3RJbmRleE9mKFwidj1cIik7XHJcbiAgICAgICAgICAgICAgICBpc0hNUiA9IGhtclF1ZXJ5ID4gMDtcclxuICAgICAgICAgICAgICAgIHVybCA9IGlzSE1SID8gdXJsLnNsaWNlKDAsIGhtclF1ZXJ5IC0gMSkgOiB1cmw7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGxldCB7XHJcbiAgICAgICAgICAgICAgICBwYXRobmFtZSxcclxuICAgICAgICAgICAgICAgIGhlYWRlcnMsXHJcbiAgICAgICAgICAgICAgICBjb250ZW50LFxyXG4gICAgICAgICAgICAgICAgbGlua3NcclxuICAgICAgICAgICAgfSA9IGF3YWl0IHByb3ZpZGVSZXNvdXJjZSh1cmwpO1xyXG5cclxuICAgICAgICAgICAgaGVhZGVycyA9IHsuLi5oZWFkZXJzfTtcclxuXHJcbiAgICAgICAgICAgIGlmIChsaW5rcyAmJiBvcHRpb25zLmh0dHAyID09PSBcInByZWxvYWRcIiAmJiAhaXNITVIpIHtcclxuICAgICAgICAgICAgICAgIGhlYWRlcnMubGluayA9IGxpbmtzLm1hcChsaW5rID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBwcm92aWRlUmVzb3VyY2UobGluaykuY2F0Y2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsb2cud2FybihcImZhaWxlZCB0byBwcmUtd2FybSBjYWNoZSB3aXRoOlwiLCBsaW5rKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYDwke2xpbmt9PjsgcmVsPXByZWxvYWQ7ICR7Y3Jvc3NvcmlnaW59IGFzPSR7bGluay5lbmRzV2l0aChcIi5jc3NcIikgPyBcInN0eWxlXCIgOiBcInNjcmlwdFwifWA7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmVzLndyaXRlSGVhZCgyMDAsIGhlYWRlcnMpO1xyXG5cclxuICAgICAgICAgICAgaWYgKGxpbmtzICYmIG9wdGlvbnMuaHR0cDIgPT09IFwicHVzaFwiICYmIHJlcyBpbnN0YW5jZW9mIEh0dHAyU2VydmVyUmVzcG9uc2UgJiYgIWlzSE1SKSB7XHJcbiAgICAgICAgICAgICAgICBodHRwMlB1c2gocmVzLnN0cmVhbSwgcGF0aG5hbWUsIGxpbmtzKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmVzLmVuZChjb250ZW50KTtcclxuXHJcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IHtjb2RlLCBoZWFkZXJzID0ge30sIG1lc3NhZ2UsIHN0YWNrfSA9IGVycm9yO1xyXG5cclxuICAgICAgICAgICAgaWYgKHN0YWNrKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBjb2RlID0gSHR0cFN0YXR1cy5JTlRFUk5BTF9TRVJWRVJfRVJST1I7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB0ZXh0ID0gSHR0cFN0YXR1cy5nZXRTdGF0dXNUZXh0KGNvZGUpO1xyXG4gICAgICAgICAgICAgICAgbG9nLmVycm9yYCR7Y29kZX0gJyR7dGV4dH0nIGhhbmRsaW5nOiAke3VybH1gO1xyXG4gICAgICAgICAgICAgICAgbG9nLmVycm9yKGVycm9yKTtcclxuICAgICAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoY29kZSwgaGVhZGVycyk7XHJcbiAgICAgICAgICAgICAgICByZXMuZW5kKHN0YWNrKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHRleHQgPSBIdHRwU3RhdHVzLmdldFN0YXR1c1RleHQoY29kZSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoY29kZSA9PT0gMzA4KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gdG9kbzogY2hlY2sgcGVybWFuZW50IHJlZGlyZWN0IGJlaGF2aW91clxyXG4gICAgICAgICAgICAgICAgICAgIGxvZy53YXJuYCR7Y29kZX0gJyR7dGV4dH0nICR7dXJsfSAtPiAke2hlYWRlcnMubG9jYXRpb259YDtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbG9nLmVycm9yYCR7Y29kZX0gJyR7dGV4dH0nICR7bWVzc2FnZSB8fCBcImhhbmRsaW5nOiBcIiArIHVybH1gO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmVzLndyaXRlSGVhZChjb2RlLCBoZWFkZXJzKTtcclxuICAgICAgICAgICAgICAgIHJlcy5lbmQobWVzc2FnZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICAvKipcclxuICAgICAqICAgIF9fX18gICAgICAgICAgICAgICAgICAgICAgX19fICAgICAgIF8gICAgICAgXyAgICAgICAgIF9fICBfXyBfICAgICBfICAgICBfIF9cclxuICAgICAqICAgLyBfX198XyBfXyBfX18gIF9fXyBfX18gICAvIF8gXFwgXyBfXyhfKSBfXyBfKF8pXyBfXyAgIHwgIFxcLyAgKF8pIF9ffCB8IF9ffCB8IHwgX19fX18gICAgICBfX19fIF8gXyBfXyBfX19cclxuICAgICAqICB8IHwgICB8ICdfXy8gXyBcXC8gX18vIF9ffCB8IHwgfCB8ICdfX3wgfC8gX2AgfCB8ICdfIFxcICB8IHxcXC98IHwgfC8gX2AgfC8gX2AgfCB8LyBfIFxcIFxcIC9cXCAvIC8gX2AgfCAnX18vIF8gXFxcclxuICAgICAqICB8IHxfX198IHwgfCAoXykgXFxfXyBcXF9fIFxcIHwgfF98IHwgfCAgfCB8IChffCB8IHwgfCB8IHwgfCB8ICB8IHwgfCAoX3wgfCAoX3wgfCB8ICBfXy9cXCBWICBWIC8gKF98IHwgfCB8ICBfXy9cclxuICAgICAqICAgXFxfX19ffF98ICBcXF9fXy98X19fL19fXy8gIFxcX19fL3xffCAgfF98XFxfXywgfF98X3wgfF98IHxffCAgfF98X3xcXF9fLF98XFxfXyxffF98XFxfX198IFxcXy9cXF8vIFxcX18sX3xffCAgXFxfX198XHJcbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHxfX18vXHJcbiAgICAgKi9cclxuICAgIGNvbnN0IGNvcnMgPSBjb3JzTWlkZGxld2FyZShvcHRpb25zLmNvcnMpO1xyXG5cclxuICAgIGNvbnN0IG5leHQgPSAocmVxOiBSZXE8Vj4sIHJlczogUmVzPFY+KSA9PiBmdW5jdGlvbiAoZXJyKSB7XHJcbiAgICAgICAgaWYgKGVycikge1xyXG4gICAgICAgICAgICB0aHJvdyBlcnI7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcm91dGVyLmxvb2t1cChyZXEsIHJlcyk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICByZXR1cm4gZnVuY3Rpb24gcmVxdWVzdEhhbmRsZXIocmVxOiBSZXE8Vj4sIHJlczogUmVzPFY+KTogdm9pZCB7XHJcbiAgICAgICAgbG9nLmRlYnVnKHJlcS5tZXRob2QhLCBjaGFsay5tYWdlbnRhKHJlcS51cmwpKTtcclxuICAgICAgICBjb3JzKHJlcSwgcmVzLCBuZXh0KHJlcSwgcmVzKSk7XHJcbiAgICB9O1xyXG59KTtcclxuIl19