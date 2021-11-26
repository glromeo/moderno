import Router, {Config, HTTPVersion, Req, Res} from "find-my-way";
import Server from "http-proxy";
import {ModernoOptions} from "./configure";
import {useWatcher} from "./watcher";

export function createRouter<V extends HTTPVersion = HTTPVersion.V1>(options: ModernoOptions) {

    const watcher = useWatcher(options);

    const router = Router<V>({
        onBadUrl(path:string, req: Req<V>, res: Res<V>) {
            res.statusCode = 400;
            res.end(`Malformed URL: ${path}`);
        },
        ...options.router
    } as Config<V>);

    options.middleware.forEach(middleware => middleware(router, options, watcher));

    if (options.proxy) {
        for (const [path, serverOptions] of Object.entries(options.proxy)) {
            const proxy = Server.createProxyServer(serverOptions);
            // @ts-ignore Note that this is a problem because HTTP-PROXY doesn't support HTTP2 headers!
            router.all(path, proxy.web.bind(proxy));
        }
    }

    return router;
}
