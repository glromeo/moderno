"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useWatcher = void 0;
const chalk_1 = __importDefault(require("chalk"));
const chokidar_1 = __importDefault(require("chokidar"));
const nano_memoize_1 = __importDefault(require("nano-memoize"));
const logger_1 = __importDefault(require("@moderno/logger"));
exports.useWatcher = nano_memoize_1.default(({ rootDir, watcher: options }) => {
    var _a;
    const watcher = chokidar_1.default.watch([], {
        ...options,
        cwd: rootDir,
        atomic: false,
        ignored: [
            ...(_a = options === null || options === void 0 ? void 0 : options.ignored) !== null && _a !== void 0 ? _a : [],
            "**/web_modules/**",
            "**/node_modules/**"
        ]
    });
    logger_1.default.debug("created chokidar watcher");
    if (logger_1.default.includes("debug")) {
        watcher.on("all", (event, file) => logger_1.default.debug("watcher", event, file));
    }
    watcher.on("ready", () => logger_1.default.info("workspace watcher is", chalk_1.default.bold("ready")));
    return watcher;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2F0Y2hlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy93YXRjaGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLGtEQUEwQjtBQUMxQix3REFBNkM7QUFDN0MsZ0VBQW9DO0FBQ3BDLDZEQUFrQztBQUdyQixRQUFBLFVBQVUsR0FBRyxzQkFBUSxDQUFDLENBQUMsRUFBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBaUIsRUFBYSxFQUFFOztJQUUxRixNQUFNLE9BQU8sR0FBRyxrQkFBUSxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUU7UUFDL0IsR0FBRyxPQUFPO1FBQ1YsR0FBRyxFQUFFLE9BQU87UUFDWixNQUFNLEVBQUUsS0FBSztRQUNiLE9BQU8sRUFBRTtZQUNMLEdBQUcsTUFBQSxPQUFPLGFBQVAsT0FBTyx1QkFBUCxPQUFPLENBQUUsT0FBTyxtQ0FBSSxFQUFFO1lBQ3pCLG1CQUFtQjtZQUNuQixvQkFBb0I7U0FDdkI7S0FDSixDQUFDLENBQUM7SUFFSCxnQkFBRyxDQUFDLEtBQUssQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO0lBRXRDLElBQUksZ0JBQUcsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEVBQUU7UUFDdkIsT0FBTyxDQUFDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLEVBQUUsQ0FBQyxnQkFBRyxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7S0FDekU7SUFDRCxPQUFPLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxHQUFHLEVBQUUsQ0FBQyxnQkFBRyxDQUFDLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxlQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUVqRixPQUFPLE9BQU8sQ0FBQztBQUNuQixDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBjaGFsayBmcm9tIFwiY2hhbGtcIjtcclxuaW1wb3J0IGNob2tpZGFyLCB7RlNXYXRjaGVyfSBmcm9tIFwiY2hva2lkYXJcIjtcclxuaW1wb3J0IG1lbW9pemVkIGZyb20gXCJuYW5vLW1lbW9pemVcIjtcclxuaW1wb3J0IGxvZyBmcm9tIFwiQG1vZGVybm8vbG9nZ2VyXCI7XHJcbmltcG9ydCB7TW9kZXJub09wdGlvbnN9IGZyb20gXCIuL2NvbmZpZ3VyZVwiO1xyXG5cclxuZXhwb3J0IGNvbnN0IHVzZVdhdGNoZXIgPSBtZW1vaXplZCgoe3Jvb3REaXIsIHdhdGNoZXI6IG9wdGlvbnN9OiBNb2Rlcm5vT3B0aW9ucyk6IEZTV2F0Y2hlciA9PiB7XHJcblxyXG4gICAgY29uc3Qgd2F0Y2hlciA9IGNob2tpZGFyLndhdGNoKFtdLCB7XHJcbiAgICAgICAgLi4ub3B0aW9ucyxcclxuICAgICAgICBjd2Q6IHJvb3REaXIsXHJcbiAgICAgICAgYXRvbWljOiBmYWxzZSxcclxuICAgICAgICBpZ25vcmVkOiBbXHJcbiAgICAgICAgICAgIC4uLm9wdGlvbnM/Lmlnbm9yZWQgPz8gW10sXHJcbiAgICAgICAgICAgIFwiKiovd2ViX21vZHVsZXMvKipcIixcclxuICAgICAgICAgICAgXCIqKi9ub2RlX21vZHVsZXMvKipcIlxyXG4gICAgICAgIF1cclxuICAgIH0pO1xyXG5cclxuICAgIGxvZy5kZWJ1ZyhcImNyZWF0ZWQgY2hva2lkYXIgd2F0Y2hlclwiKTtcclxuXHJcbiAgICBpZiAobG9nLmluY2x1ZGVzKFwiZGVidWdcIikpIHtcclxuICAgICAgICB3YXRjaGVyLm9uKFwiYWxsXCIsIChldmVudCwgZmlsZSkgPT4gbG9nLmRlYnVnKFwid2F0Y2hlclwiLCBldmVudCwgZmlsZSkpO1xyXG4gICAgfVxyXG4gICAgd2F0Y2hlci5vbihcInJlYWR5XCIsICgpID0+IGxvZy5pbmZvKFwid29ya3NwYWNlIHdhdGNoZXIgaXNcIiwgY2hhbGsuYm9sZChcInJlYWR5XCIpKSk7XHJcblxyXG4gICAgcmV0dXJuIHdhdGNoZXI7XHJcbn0pO1xyXG4iXX0=