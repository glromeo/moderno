import {FSWatcher} from "chokidar";
import HttpStatus from "http-status-codes";
import http2, {ServerHttp2Stream} from "http2";
import memoized from "nano-memoize";
import log from "@moderno/logger";
import {ModernoOptions} from "../configure";
import {useResourceProvider} from "../providers/resource-provider";

export const useHttp2Push = memoized((options: ModernoOptions) => {

    const {provideResource} = useResourceProvider(options);

    const {
        HTTP2_HEADER_PATH,
        NGHTTP2_REFUSED_STREAM
    } = http2.constants;

    function http2Push(stream: ServerHttp2Stream, pathname, urls: readonly string[]) {
        for (const url of urls) {
            provideResource(url).then(resource => {
                if (stream.destroyed) {
                    return;
                }
                if (!stream.pushAllowed) {
                    log.debug("not allowed pushing from:", pathname);
                    return;
                }
                stream.pushStream({[HTTP2_HEADER_PATH]: url}, function (err, push) {

                    if (err) {
                        log.warn("cannot push stream for:", url, "from:", pathname, err);
                        return;
                    }

                    push.on("error", function (err: any) {
                        if (push.rstCode === NGHTTP2_REFUSED_STREAM) {
                            log.debug("NGHTTP2_REFUSED_STREAM", url);
                        } else if (err.code === "ERR_HTTP2_STREAM_ERROR") {
                            log.warn("ERR_HTTP2_STREAM_ERROR", url);
                        } else {
                            log.error(err.code, url, err.message);
                        }
                    });

                    if (!push.destroyed) {
                        push.respond({
                            ...resource.headers,
                            ":status": HttpStatus.OK
                        });
                        push.end(resource.content);
                    }
                });
            }).catch(err => {
                log.warn("error pushing:", url, "from:", pathname, err);
            });
        }
    }

    return {
        http2Push
    };
});
