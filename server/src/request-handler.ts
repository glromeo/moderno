import chalk from "chalk";
import corsMiddleware from "cors";
import {parse as parseURL} from "fast-url-parser";
import Router, {Req, Res} from "find-my-way";
import {readFile} from "fs";
import {ServerResponse} from "http";
import HttpStatus from "http-status-codes";
import {Http2ServerResponse} from "http2";
import memoized from "nano-memoize";
import path, {posix} from "path";
import log from "@moderno/logger";
import {ModernoOptions} from "./configure";
import {useResourceProvider} from "./providers/resource-provider";
import {createRouter} from "./router";
import {useHttp2Push} from "./util/http2-push";
import {contentType} from "./util/mime-types";

type Version = Router.HTTPVersion.V1 | Router.HTTPVersion.V2;

export const useRequestHandler = memoized(<V extends Version>(options: ModernoOptions) => {

    const {provideResource} = useResourceProvider(options);
    const {http2Push} = useHttp2Push(options);

    const router = createRouter<V>(options);

    /**
     *   ____  _        _   _        ____
     *  / ___|| |_ __ _| |_(_) ___  |  _ \ ___  ___  ___  _   _ _ __ ___ ___  ___
     *  \___ \| __/ _` | __| |/ __| | |_) / _ \/ __|/ _ \| | | | '__/ __/ _ \/ __|
     *   ___) | || (_| | |_| | (__  |  _ <  __/\__ \ (_) | |_| | | | (_|  __/\__ \
     *  |____/ \__\__,_|\__|_|\___| |_| \_\___||___/\___/ \__,_|_|  \___\___||___/
     *
     */
    router.get("/resources/*", function resourcesMiddleware(req: Req<V>, res: Res<V>) {
        const {pathname} = parseURL(req.url);
        const filename = path.join(options.resources, pathname.substring(10));
        sendFile(filename, res);
    });

    function sendFile<V>(filename: string, res: V extends Router.HTTPVersion.V1 ? ServerResponse : Http2ServerResponse) {
        readFile(filename, (err, data) => {
            if (err) {
                res.writeHead(HttpStatus.NOT_FOUND);
                res.end();
            } else {
                res.writeHead(HttpStatus.OK, {
                    "content-type": contentType(filename),
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
    router.get("/*", async function workspaceMiddleware(req: Req<V>, res: Res<V>) {

        let url = req.url, isHMR;
        if (url) try {

            if (url.endsWith(".HMR")) {
                let hmrQuery = url.lastIndexOf("v=");
                isHMR = hmrQuery > 0;
                url = isHMR ? url.slice(0, hmrQuery - 1) : url;
            }

            let {
                pathname,
                headers,
                content,
                links
            } = await provideResource(url);

            headers = {...headers};

            if (links && options.http2 === "preload" && !isHMR) {
                headers.link = links.map(link => {
                    provideResource(link).catch(function () {
                        log.warn("failed to pre-warm cache with:", link);
                    });
                    return `<${link}>; crossorigin; rel=preload; as=${link.endsWith(".css") ? "style" : "script"}`;
                });
            }

            res.writeHead(200, headers);

            if (links && options.http2 === "push" && res instanceof Http2ServerResponse && !isHMR) {
                http2Push(res.stream, pathname, links);
            }

            res.end(content);

        } catch (error) {

            const {code, headers = {}, message, stack} = error;

            if (stack) {
                const code = HttpStatus.INTERNAL_SERVER_ERROR;
                const text = HttpStatus.getStatusText(code);
                log.error`${code} '${text}' handling: ${url}`;
                log.error(error);
                res.writeHead(code, headers);
                res.end(stack);
            } else {
                const text = HttpStatus.getStatusText(code);
                if (code === 308) {
                    // todo: check permanent redirect behaviour
                    log.warn`${code} '${text}' ${url} -> ${headers.location}`;
                } else {
                    log.error`${code} '${text}' ${message || "handling: " + url}`;
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
    const cors = corsMiddleware(options.cors);

    const next = (req: Req<V>, res: Res<V>) => function (err) {
        if (err) {
            throw err;
        } else {
            router.lookup(req, res);
        }
    };

    return function requestHandler(req: Req<V>, res: Res<V>): void {
        log.debug(req.method!, chalk.magenta(req.url));
        cors(req, res, next(req, res));
    };
});
