import {FSWatcher} from "chokidar";
import {Handler, HTTPVersion} from "find-my-way";
import {Server as HttpServer} from "http";
import {Http2Server} from "http2";
import {Server as HttpsServer} from "https";
import {Socket} from "net";
import log from "@moderno/logger";
import {useMessaging} from "./messaging";
import {ModernoOptions} from "./configure";
import {useRequestHandler} from "./request-handler";
import {useWatcher} from "./watcher";

export type ServerOptions = {
    protocol?: "http" | "https"
    host?: string
    port?: number
    options?: {
        key?: string
        cert?: string
        allowHTTP1?: boolean
    }
}

export const DEFAULT_SERVER_OPTIONS: ServerOptions = {
    protocol: "http",
    host: "localhost",
    port: 3000
};

export type Services = {
    watcher?: FSWatcher
    handler?: Handler<HTTPVersion.V1 | HTTPVersion.V2>
}

export async function startServer(options: ModernoOptions) {

    const {
        server: {
            protocol,
            host,
            port,
            options: {
                key, cert, allowHTTP1
            } = {} as any
        } = DEFAULT_SERVER_OPTIONS
    } = options;

    const watcher = useWatcher(options);
    const handler = useRequestHandler(options);

    let module, server: HttpServer | HttpsServer | Http2Server;

    if (options.http2) {
        module = require("http2");
        if (protocol === "http") {
            server = module.createServer({allowHTTP1}, handler);
        } else {
            server = module.createSecureServer({key, cert, allowHTTP1}, handler);
        }
    } else {
        if (protocol === "http") {
            module = require("http");
            server = module.createServer(handler);
        } else {
            module = require("https");
            server = module.createServer({key, cert}, handler);
        }
    }

    server.on("upgrade", useMessaging(options).handleUpgrade);

    await new Promise<void>(listening => server.listen(port, host, listening));

    const address = `${protocol}://${host}:${port}`;
    log.info(`server started on ${address}`);

    const sockets = new Set<Socket>();

    for (const event of ["connection", "secureConnection"]) server.on(event, function (socket) {
        sockets.add(socket);
        socket.on("close", () => sockets.delete(socket));
    });

    let closed;

    async function shutdown(this: any) {
        if (closed) {
            log.debug("shutdown in progress...");
            await closed;
        }

        closed = new Promise(closed => server.on("close", closed));

        if (sockets.size > 0) {
            log.debug(`closing ${sockets.size} pending socket...`);
            for (const socket of sockets) {
                socket.destroy();
                sockets.delete(socket);
            }
        }

        log.debug(`closing chokidar watcher...`);
        await watcher.close();

        server.close();
        await closed;
        log.info("server closed");

        return closed;
    }

    return {
        options,
        module,
        server,
        watcher,
        handler,
        address,
        shutdown
    };
}
