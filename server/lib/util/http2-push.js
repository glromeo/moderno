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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHR0cDItcHVzaC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlsL2h0dHAyLXB1c2gudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQ0EsMEVBQTJDO0FBQzNDLGtEQUErQztBQUMvQyxnRUFBb0M7QUFDcEMsNkRBQWtDO0FBRWxDLHNFQUFtRTtBQUV0RCxRQUFBLFlBQVksR0FBRyxzQkFBUSxDQUFDLENBQUMsT0FBdUIsRUFBRSxFQUFFO0lBRTdELE1BQU0sRUFBQyxlQUFlLEVBQUMsR0FBRyx1Q0FBbUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUV2RCxNQUFNLEVBQ0YsaUJBQWlCLEVBQ2pCLHNCQUFzQixFQUN6QixHQUFHLGVBQUssQ0FBQyxTQUFTLENBQUM7SUFFcEIsU0FBUyxTQUFTLENBQUMsTUFBeUIsRUFBRSxRQUFRLEVBQUUsSUFBdUI7UUFDM0UsS0FBSyxNQUFNLEdBQUcsSUFBSSxJQUFJLEVBQUU7WUFDcEIsZUFBZSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRTtnQkFDakMsSUFBSSxNQUFNLENBQUMsU0FBUyxFQUFFO29CQUNsQixPQUFPO2lCQUNWO2dCQUNELElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxFQUFFO29CQUNyQixnQkFBRyxDQUFDLEtBQUssQ0FBQywyQkFBMkIsRUFBRSxRQUFRLENBQUMsQ0FBQztvQkFDakQsT0FBTztpQkFDVjtnQkFDRCxNQUFNLENBQUMsVUFBVSxDQUFDLEVBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFLEdBQUcsRUFBQyxFQUFFLFVBQVUsR0FBRyxFQUFFLElBQUk7b0JBRTdELElBQUksR0FBRyxFQUFFO3dCQUNMLGdCQUFHLENBQUMsSUFBSSxDQUFDLHlCQUF5QixFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLEdBQUcsQ0FBQyxDQUFDO3dCQUNqRSxPQUFPO3FCQUNWO29CQUVELElBQUksQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLFVBQVUsR0FBUTt3QkFDL0IsSUFBSSxJQUFJLENBQUMsT0FBTyxLQUFLLHNCQUFzQixFQUFFOzRCQUN6QyxnQkFBRyxDQUFDLEtBQUssQ0FBQyx3QkFBd0IsRUFBRSxHQUFHLENBQUMsQ0FBQzt5QkFDNUM7NkJBQU0sSUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLHdCQUF3QixFQUFFOzRCQUM5QyxnQkFBRyxDQUFDLElBQUksQ0FBQyx3QkFBd0IsRUFBRSxHQUFHLENBQUMsQ0FBQzt5QkFDM0M7NkJBQU07NEJBQ0gsZ0JBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO3lCQUN6QztvQkFDTCxDQUFDLENBQUMsQ0FBQztvQkFFSCxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRTt3QkFDakIsSUFBSSxDQUFDLE9BQU8sQ0FBQzs0QkFDVCxHQUFHLFFBQVEsQ0FBQyxPQUFPOzRCQUNuQixTQUFTLEVBQUUsMkJBQVUsQ0FBQyxFQUFFO3lCQUMzQixDQUFDLENBQUM7d0JBQ0gsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUM7cUJBQzlCO2dCQUNMLENBQUMsQ0FBQyxDQUFDO1lBQ1AsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFO2dCQUNYLGdCQUFHLENBQUMsSUFBSSxDQUFDLGdCQUFnQixFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQzVELENBQUMsQ0FBQyxDQUFDO1NBQ047SUFDTCxDQUFDO0lBRUQsT0FBTztRQUNILFNBQVM7S0FDWixDQUFDO0FBQ04sQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge0ZTV2F0Y2hlcn0gZnJvbSBcImNob2tpZGFyXCI7XHJcbmltcG9ydCBIdHRwU3RhdHVzIGZyb20gXCJodHRwLXN0YXR1cy1jb2Rlc1wiO1xyXG5pbXBvcnQgaHR0cDIsIHtTZXJ2ZXJIdHRwMlN0cmVhbX0gZnJvbSBcImh0dHAyXCI7XHJcbmltcG9ydCBtZW1vaXplZCBmcm9tIFwibmFuby1tZW1vaXplXCI7XHJcbmltcG9ydCBsb2cgZnJvbSBcIkBtb2Rlcm5vL2xvZ2dlclwiO1xyXG5pbXBvcnQge01vZGVybm9PcHRpb25zfSBmcm9tIFwiLi4vY29uZmlndXJlXCI7XHJcbmltcG9ydCB7dXNlUmVzb3VyY2VQcm92aWRlcn0gZnJvbSBcIi4uL3Byb3ZpZGVycy9yZXNvdXJjZS1wcm92aWRlclwiO1xyXG5cclxuZXhwb3J0IGNvbnN0IHVzZUh0dHAyUHVzaCA9IG1lbW9pemVkKChvcHRpb25zOiBNb2Rlcm5vT3B0aW9ucykgPT4ge1xyXG5cclxuICAgIGNvbnN0IHtwcm92aWRlUmVzb3VyY2V9ID0gdXNlUmVzb3VyY2VQcm92aWRlcihvcHRpb25zKTtcclxuXHJcbiAgICBjb25zdCB7XHJcbiAgICAgICAgSFRUUDJfSEVBREVSX1BBVEgsXHJcbiAgICAgICAgTkdIVFRQMl9SRUZVU0VEX1NUUkVBTVxyXG4gICAgfSA9IGh0dHAyLmNvbnN0YW50cztcclxuXHJcbiAgICBmdW5jdGlvbiBodHRwMlB1c2goc3RyZWFtOiBTZXJ2ZXJIdHRwMlN0cmVhbSwgcGF0aG5hbWUsIHVybHM6IHJlYWRvbmx5IHN0cmluZ1tdKSB7XHJcbiAgICAgICAgZm9yIChjb25zdCB1cmwgb2YgdXJscykge1xyXG4gICAgICAgICAgICBwcm92aWRlUmVzb3VyY2UodXJsKS50aGVuKHJlc291cmNlID0+IHtcclxuICAgICAgICAgICAgICAgIGlmIChzdHJlYW0uZGVzdHJveWVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKCFzdHJlYW0ucHVzaEFsbG93ZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICBsb2cuZGVidWcoXCJub3QgYWxsb3dlZCBwdXNoaW5nIGZyb206XCIsIHBhdGhuYW1lKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBzdHJlYW0ucHVzaFN0cmVhbSh7W0hUVFAyX0hFQURFUl9QQVRIXTogdXJsfSwgZnVuY3Rpb24gKGVyciwgcHVzaCkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvZy53YXJuKFwiY2Fubm90IHB1c2ggc3RyZWFtIGZvcjpcIiwgdXJsLCBcImZyb206XCIsIHBhdGhuYW1lLCBlcnIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBwdXNoLm9uKFwiZXJyb3JcIiwgZnVuY3Rpb24gKGVycjogYW55KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwdXNoLnJzdENvZGUgPT09IE5HSFRUUDJfUkVGVVNFRF9TVFJFQU0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvZy5kZWJ1ZyhcIk5HSFRUUDJfUkVGVVNFRF9TVFJFQU1cIiwgdXJsKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChlcnIuY29kZSA9PT0gXCJFUlJfSFRUUDJfU1RSRUFNX0VSUk9SXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvZy53YXJuKFwiRVJSX0hUVFAyX1NUUkVBTV9FUlJPUlwiLCB1cmwpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9nLmVycm9yKGVyci5jb2RlLCB1cmwsIGVyci5tZXNzYWdlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoIXB1c2guZGVzdHJveWVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHB1c2gucmVzcG9uZCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuLi5yZXNvdXJjZS5oZWFkZXJzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCI6c3RhdHVzXCI6IEh0dHBTdGF0dXMuT0tcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHB1c2guZW5kKHJlc291cmNlLmNvbnRlbnQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KS5jYXRjaChlcnIgPT4ge1xyXG4gICAgICAgICAgICAgICAgbG9nLndhcm4oXCJlcnJvciBwdXNoaW5nOlwiLCB1cmwsIFwiZnJvbTpcIiwgcGF0aG5hbWUsIGVycik7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGh0dHAyUHVzaFxyXG4gICAgfTtcclxufSk7XHJcbiJdfQ==