import EventEmitter from "events";
import {WebModulesNotification, WebModulesNotificationType, WebModulesOptions} from "./index";

export const notifications = new EventEmitter();

export class Notification implements WebModulesNotification {

    private static counter: number = 0;

    id: number;
    timeMs: number;
    sticky: boolean;
    type: WebModulesNotificationType;
    message: string;
    error?: Error;

    constructor(
        message: string,
        type: WebModulesNotificationType = "info",
        sticky: boolean = false,
        error?: Error
    ) {
        this.id = ++Notification.counter;
        this.type = type;
        this.message = message;
        this.sticky = sticky;
        if (error) {
            this.error = error;
        }
        this.timeMs = Date.now();
    }

    update(message: string, type?: WebModulesNotificationType, sticky?: boolean) {
        this.message = message;
        if (type !== undefined) {
            this.type = type;
        }
        if (sticky !== undefined) {
            this.sticky = sticky;
        }
        notifications.emit("update", this);
    }
}

export function useNotifications(options: WebModulesOptions) {

    if (options.notify) {
        return (message: string, type: WebModulesNotificationType = "info", sticky: boolean = false, error?) => {
            const notification = new Notification(message, type, sticky, error);
            notifications.emit("new", notification);
            return notification;
        };
    } else {
        const MOCK_NOTIFICATION: Notification = {
            id: 0,
            message: "",
            sticky: false,
            timeMs: 0,
            type: "primary",
            update(message: string, type?: WebModulesNotificationType, sticky?: boolean): void {
            }
        };
        return () => MOCK_NOTIFICATION;
    }
}