import chalk from "chalk";
import {FSWatcher} from "chokidar";
import {notifications, WebModulesNotification} from "@moderno/web-modules";
import memoized from "nano-memoize";
import log from "@moderno/logger";
import WebSocket from "ws";
import {ModernoOptions} from "./configure";
import {MultiMap} from "./util/multi-map";
import {useWatcher} from "./watcher";

export type Message = { type: string, data?: any };
export type SendMessage = (type: string, data?: any) => void;
export type MessageCallback = (data: any, send: SendMessage) => void;
export type OnMessage = (type: string, cb: MessageCallback) => void;
export type MessagingContext = { on: OnMessage, broadcast: SendMessage, options: ModernoOptions, watcher: FSWatcher };
export type MessagingEndpoint = (messagingContext: MessagingContext) => void;
export type MessagingOptions = {
    plugins?: (MessagingEndpoint)[]
}

export const useMessaging = memoized((options: ModernoOptions) => {

    const sockets = new Set<WebSocket>();

    function broadcast(type: string, data?: any) {
        const message = data === undefined ? type : JSON.stringify({type, data});
        for (const ws of sockets) {
            ws.send(message);
        }
    }

    const callbacks = new MultiMap<string, MessageCallback>();

    function on(type: string, cb: MessageCallback) {
        callbacks.add(type, cb);
        log.debug("added message listener for:", chalk.magenta(type));
    }

    const watcher = useWatcher(options);

    for (const plugin of options.messaging?.plugins ?? []) {
        plugin({on, broadcast, options, watcher});
    }

    function openCallback(ws: WebSocket) {

        function send(type: string, data?: any) {
            const message = data === undefined ? type : JSON.stringify({type, data});
            return ws.send(message);
        }

        log.debug("client connected:", ws.url);
        sockets.add(ws);

        ws.on("error", () => {
            log.debug("client error:", ws.url);
        });

        ws.on("close", () => {
            log.debug("client disconnected:", ws.url);
            sockets.delete(ws);
        });

        ws.on("message", function (message: string) {
            const {type, data}: Message = message[0] === "{" ? JSON.parse(message) : {type: message};
            if (callbacks.has(type)) for (const callback of callbacks.get(type)!) {
                callback(data, send);
            }
        });

        ws.send(JSON.stringify({type: "hello", data: {time: new Date().toUTCString()}}));
    }

    function errorCallback(error) {
        log.error("websocket error:", error);
    }

    function closeCallback() {
        log.info("websocket closed");
    }

    notifications.on("create", (notification: WebModulesNotification) => {
        broadcast("notification:new", notification);
    });

    notifications.on("update", (notification: WebModulesNotification) => {
        broadcast("notification:update", notification);
    });

    return {
        handleUpgrade(req, socket, head) {
            if (req.headers["sec-websocket-protocol"] === "esnext-dev") {
                const wss = new WebSocket.Server({noServer: true});
                wss.on("open", openCallback);
                wss.on("error", errorCallback);
                wss.on("close", closeCallback);
                wss.handleUpgrade(req, socket, head, client => wss.emit("open", client, req));
                log.info("websocket ready");
            }
        },
        broadcast
    };
});
