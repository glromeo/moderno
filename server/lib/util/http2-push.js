"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useHttp2Push = void 0;
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const http2_1 = __importDefault(require("http2"));
const nano_memoize_1 = __importDefault(require("nano-memoize"));
const logger_1 = __importDefault(require("@moderno/logger"));
const resource_provider_1 = require("../providers/resource-provider");
exports.useHttp2Push = nano_memoize_1.default((options) => {
    const { provideResource } = resource_provider_1.useResourceProvider(options);
    const { HTTP2_HEADER_PATH, NGHTTP2_REFUSED_STREAM } = http2_1.default.constants;
    function http2Push(stream, pathname, urls) {
        for (const url of urls) {
            provideResource(url).then(resource => {
                if (stream.destroyed) {
                    return;
                }
                if (!stream.pushAllowed) {
                    logger_1.default.debug("not allowed pushing from:", pathname);
                    return;
                }
                stream.pushStream({ [HTTP2_HEADER_PATH]: url }, function (err, push) {
                    if (err) {
                        logger_1.default.warn("cannot push stream for:", url, "from:", pathname, err);
                        return;
                    }
                    push.on("error", function (err) {
                        if (push.rstCode === NGHTTP2_REFUSED_STREAM) {
                            logger_1.default.debug("NGHTTP2_REFUSED_STREAM", url);
                        }
                        else if (err.code === "ERR_HTTP2_STREAM_ERROR") {
                            logger_1.default.warn("ERR_HTTP2_STREAM_ERROR", url);
                        }
                        else {
                            logger_1.default.error(err.code, url, err.message);
                        }
                    });
                    if (!push.destroyed) {
                        push.respond({
                            ...resource.headers,
                            ":status": http_status_codes_1.default.OK
                        });
                        push.end(resource.content);
                    }
                });
            }).catch(err => {
                logger_1.default.warn("error pushing:", url, "from:", pathname, err);
            });
        }
    }
    return {
        http2Push
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHR0cDItcHVzaC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlsL2h0dHAyLXB1c2gudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQ0EsMEVBQTJDO0FBQzNDLGtEQUErQztBQUMvQyxnRUFBb0M7QUFDcEMsNkRBQWtDO0FBRWxDLHNFQUFtRTtBQUV0RCxRQUFBLFlBQVksR0FBRyxzQkFBUSxDQUFDLENBQUMsT0FBdUIsRUFBRSxFQUFFO0lBRTdELE1BQU0sRUFBQyxlQUFlLEVBQUMsR0FBRyx1Q0FBbUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUV2RCxNQUFNLEVBQ0YsaUJBQWlCLEVBQ2pCLHNCQUFzQixFQUN6QixHQUFHLGVBQUssQ0FBQyxTQUFTLENBQUM7SUFFcEIsU0FBUyxTQUFTLENBQUMsTUFBeUIsRUFBRSxRQUFRLEVBQUUsSUFBdUI7UUFDM0UsS0FBSyxNQUFNLEdBQUcsSUFBSSxJQUFJLEVBQUU7WUFDcEIsZUFBZSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRTtnQkFDakMsSUFBSSxNQUFNLENBQUMsU0FBUyxFQUFFO29CQUNsQixPQUFPO2lCQUNWO2dCQUNELElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxFQUFFO29CQUNyQixnQkFBRyxDQUFDLEtBQUssQ0FBQywyQkFBMkIsRUFBRSxRQUFRLENBQUMsQ0FBQztvQkFDakQsT0FBTztpQkFDVjtnQkFDRCxNQUFNLENBQUMsVUFBVSxDQUFDLEVBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFLEdBQUcsRUFBQyxFQUFFLFVBQVUsR0FBRyxFQUFFLElBQUk7b0JBRTdELElBQUksR0FBRyxFQUFFO3dCQUNMLGdCQUFHLENBQUMsSUFBSSxDQUFDLHlCQUF5QixFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLEdBQUcsQ0FBQyxDQUFDO3dCQUNqRSxPQUFPO3FCQUNWO29CQUVELElBQUksQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLFVBQVUsR0FBUTt3QkFDL0IsSUFBSSxJQUFJLENBQUMsT0FBTyxLQUFLLHNCQUFzQixFQUFFOzRCQUN6QyxnQkFBRyxDQUFDLEtBQUssQ0FBQyx3QkFBd0IsRUFBRSxHQUFHLENBQUMsQ0FBQzt5QkFDNUM7NkJBQU0sSUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLHdCQUF3QixFQUFFOzRCQUM5QyxnQkFBRyxDQUFDLElBQUksQ0FBQyx3QkFBd0IsRUFBRSxHQUFHLENBQUMsQ0FBQzt5QkFDM0M7NkJBQU07NEJBQ0gsZ0JBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO3lCQUN6QztvQkFDTCxDQUFDLENBQUMsQ0FBQztvQkFFSCxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRTt3QkFDakIsSUFBSSxDQUFDLE9BQU8sQ0FBQzs0QkFDVCxHQUFHLFFBQVEsQ0FBQyxPQUFPOzRCQUNuQixTQUFTLEVBQUUsMkJBQVUsQ0FBQyxFQUFFO3lCQUMzQixDQUFDLENBQUM7d0JBQ0gsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUM7cUJBQzlCO2dCQUNMLENBQUMsQ0FBQyxDQUFDO1lBQ1AsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFO2dCQUNYLGdCQUFHLENBQUMsSUFBSSxDQUFDLGdCQUFnQixFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQzVELENBQUMsQ0FBQyxDQUFDO1NBQ047SUFDTCxDQUFDO0lBRUQsT0FBTztRQUNILFNBQVM7S0FDWixDQUFDO0FBQ04sQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge0ZTV2F0Y2hlcn0gZnJvbSBcImNob2tpZGFyXCI7XG5pbXBvcnQgSHR0cFN0YXR1cyBmcm9tIFwiaHR0cC1zdGF0dXMtY29kZXNcIjtcbmltcG9ydCBodHRwMiwge1NlcnZlckh0dHAyU3RyZWFtfSBmcm9tIFwiaHR0cDJcIjtcbmltcG9ydCBtZW1vaXplZCBmcm9tIFwibmFuby1tZW1vaXplXCI7XG5pbXBvcnQgbG9nIGZyb20gXCJAbW9kZXJuby9sb2dnZXJcIjtcbmltcG9ydCB7TW9kZXJub09wdGlvbnN9IGZyb20gXCIuLi9jb25maWd1cmVcIjtcbmltcG9ydCB7dXNlUmVzb3VyY2VQcm92aWRlcn0gZnJvbSBcIi4uL3Byb3ZpZGVycy9yZXNvdXJjZS1wcm92aWRlclwiO1xuXG5leHBvcnQgY29uc3QgdXNlSHR0cDJQdXNoID0gbWVtb2l6ZWQoKG9wdGlvbnM6IE1vZGVybm9PcHRpb25zKSA9PiB7XG5cbiAgICBjb25zdCB7cHJvdmlkZVJlc291cmNlfSA9IHVzZVJlc291cmNlUHJvdmlkZXIob3B0aW9ucyk7XG5cbiAgICBjb25zdCB7XG4gICAgICAgIEhUVFAyX0hFQURFUl9QQVRILFxuICAgICAgICBOR0hUVFAyX1JFRlVTRURfU1RSRUFNXG4gICAgfSA9IGh0dHAyLmNvbnN0YW50cztcblxuICAgIGZ1bmN0aW9uIGh0dHAyUHVzaChzdHJlYW06IFNlcnZlckh0dHAyU3RyZWFtLCBwYXRobmFtZSwgdXJsczogcmVhZG9ubHkgc3RyaW5nW10pIHtcbiAgICAgICAgZm9yIChjb25zdCB1cmwgb2YgdXJscykge1xuICAgICAgICAgICAgcHJvdmlkZVJlc291cmNlKHVybCkudGhlbihyZXNvdXJjZSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHN0cmVhbS5kZXN0cm95ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIXN0cmVhbS5wdXNoQWxsb3dlZCkge1xuICAgICAgICAgICAgICAgICAgICBsb2cuZGVidWcoXCJub3QgYWxsb3dlZCBwdXNoaW5nIGZyb206XCIsIHBhdGhuYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBzdHJlYW0ucHVzaFN0cmVhbSh7W0hUVFAyX0hFQURFUl9QQVRIXTogdXJsfSwgZnVuY3Rpb24gKGVyciwgcHVzaCkge1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvZy53YXJuKFwiY2Fubm90IHB1c2ggc3RyZWFtIGZvcjpcIiwgdXJsLCBcImZyb206XCIsIHBhdGhuYW1lLCBlcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcHVzaC5vbihcImVycm9yXCIsIGZ1bmN0aW9uIChlcnI6IGFueSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHB1c2gucnN0Q29kZSA9PT0gTkdIVFRQMl9SRUZVU0VEX1NUUkVBTSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvZy5kZWJ1ZyhcIk5HSFRUUDJfUkVGVVNFRF9TVFJFQU1cIiwgdXJsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZXJyLmNvZGUgPT09IFwiRVJSX0hUVFAyX1NUUkVBTV9FUlJPUlwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9nLndhcm4oXCJFUlJfSFRUUDJfU1RSRUFNX0VSUk9SXCIsIHVybCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvZy5lcnJvcihlcnIuY29kZSwgdXJsLCBlcnIubWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICghcHVzaC5kZXN0cm95ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHB1c2gucmVzcG9uZCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLi4ucmVzb3VyY2UuaGVhZGVycyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIjpzdGF0dXNcIjogSHR0cFN0YXR1cy5PS1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBwdXNoLmVuZChyZXNvdXJjZS5jb250ZW50KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSkuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgICBsb2cud2FybihcImVycm9yIHB1c2hpbmc6XCIsIHVybCwgXCJmcm9tOlwiLCBwYXRobmFtZSwgZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgaHR0cDJQdXNoXG4gICAgfTtcbn0pO1xuIl19