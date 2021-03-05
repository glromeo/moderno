import {MultiMap} from "./multi-map";

export type Message = { type: string, data?: any };
export type SendMessage = (type: string, data?: any) => void;
export type MessageCallback = (data: any, send: SendMessage) => void;
export type OnMessage = (type: string, cb: MessageCallback) => void;

const queue: string[] = [];
const callbacks = new MultiMap<string, MessageCallback>();

const ws = new WebSocket(`${location.protocol === "http:" ? "ws:" : "wss:"}//${location.host}/`, "esnext-dev");

ws.onopen = event => {
    send("hello", {time: new Date().toUTCString()});
    const subset = callbacks.get("open");
    if (subset) for (const callback of subset) {
        callback(undefined, send);
    }
    queue.forEach(item => ws.send(item));
    queue.length = 0;
};

ws.onmessage = event => {
    const message = event.data;
    const {type, data = undefined} = message.charAt(0) === "{" ? JSON.parse(message) : {type: message};
    const subset = callbacks.get(type);
    if (subset) for (const callback of subset) {
        callback(data, send);
    } else {
        console.log(type, data || "");
    }
};

ws.onerror = event => {
    console.log("websocket error", event);
};

ws.onclose = event => {
    const subset = callbacks.get("close");
    if (subset) for (const callback of subset) {
        callback(undefined, send);
    }
};

export function send(type: string, data?: any) {
    const text = data === undefined ? JSON.stringify({type}) : JSON.stringify({type, data});
    if (ws.readyState !== ws.OPEN) {
        queue.push(text);
    } else {
        ws.send(text);
    }
}

export function on(type: string, cb: MessageCallback) {
    callbacks.add(type, cb);
    console.log(`added message listener for: %c${type}`, "color:magenta");
    return function () {
        callbacks.remove(type, cb);
    }
}
