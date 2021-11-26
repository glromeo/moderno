import { FSWatcher } from "chokidar";
import { ModernoOptions } from "./configure";
export declare type Message = {
    type: string;
    data?: any;
};
export declare type SendMessage = (type: string, data?: any) => void;
export declare type MessageCallback = (data: any, send: SendMessage) => void;
export declare type OnMessage = (type: string, cb: MessageCallback) => void;
export declare type MessagingContext = {
    on: OnMessage;
    broadcast: SendMessage;
    options: ModernoOptions;
    watcher: FSWatcher;
};
export declare type MessagingEndpoint = (messagingContext: MessagingContext) => void;
export declare type MessagingOptions = {
    plugins?: (MessagingEndpoint)[];
};
export declare const useMessaging: any;
