"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useNotifications = exports.Notification = exports.notifications = void 0;
const events_1 = __importDefault(require("events"));
exports.notifications = new events_1.default();
class Notification {
    constructor(message, type = "info", sticky = false, error) {
        this.id = ++Notification.counter;
        this.type = type;
        this.message = message;
        this.sticky = sticky;
        if (error) {
            this.error = error;
        }
        this.timeMs = Date.now();
    }
    update(message, type, sticky) {
        this.message = message;
        if (type !== undefined) {
            this.type = type;
        }
        if (sticky !== undefined) {
            this.sticky = sticky;
        }
        exports.notifications.emit("update", this);
    }
}
exports.Notification = Notification;
Notification.counter = 0;
function useNotifications(options) {
    if (options.notify) {
        return (message, type = "info", sticky = false, error) => {
            const notification = new Notification(message, type, sticky, error);
            exports.notifications.emit("new", notification);
            return notification;
        };
    }
    else {
        const MOCK_NOTIFICATION = {
            id: 0,
            message: "",
            sticky: false,
            timeMs: 0,
            type: "primary",
            update(message, type, sticky) {
            }
        };
        return () => MOCK_NOTIFICATION;
    }
}
exports.useNotifications = useNotifications;
//# sourceMappingURL=notifications.js.map