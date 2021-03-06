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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2F0Y2hlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy93YXRjaGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLGtEQUEwQjtBQUMxQix3REFBNkM7QUFDN0MsZ0VBQW9DO0FBQ3BDLDZEQUFrQztBQUdyQixRQUFBLFVBQVUsR0FBRyxzQkFBUSxDQUFDLENBQUMsRUFBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBaUIsRUFBYSxFQUFFOztJQUUxRixNQUFNLE9BQU8sR0FBRyxrQkFBUSxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUU7UUFDL0IsR0FBRyxPQUFPO1FBQ1YsR0FBRyxFQUFFLE9BQU87UUFDWixNQUFNLEVBQUUsS0FBSztRQUNiLE9BQU8sRUFBRTtZQUNMLEdBQUcsTUFBQSxPQUFPLGFBQVAsT0FBTyx1QkFBUCxPQUFPLENBQUUsT0FBTyxtQ0FBSSxFQUFFO1lBQ3pCLG1CQUFtQjtZQUNuQixvQkFBb0I7U0FDdkI7S0FDSixDQUFDLENBQUM7SUFFSCxnQkFBRyxDQUFDLEtBQUssQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO0lBRXRDLElBQUksZ0JBQUcsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEVBQUU7UUFDdkIsT0FBTyxDQUFDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLEVBQUUsQ0FBQyxnQkFBRyxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7S0FDekU7SUFDRCxPQUFPLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxHQUFHLEVBQUUsQ0FBQyxnQkFBRyxDQUFDLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxlQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUVqRixPQUFPLE9BQU8sQ0FBQztBQUNuQixDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBjaGFsayBmcm9tIFwiY2hhbGtcIjtcbmltcG9ydCBjaG9raWRhciwge0ZTV2F0Y2hlcn0gZnJvbSBcImNob2tpZGFyXCI7XG5pbXBvcnQgbWVtb2l6ZWQgZnJvbSBcIm5hbm8tbWVtb2l6ZVwiO1xuaW1wb3J0IGxvZyBmcm9tIFwiQG1vZGVybm8vbG9nZ2VyXCI7XG5pbXBvcnQge01vZGVybm9PcHRpb25zfSBmcm9tIFwiLi9jb25maWd1cmVcIjtcblxuZXhwb3J0IGNvbnN0IHVzZVdhdGNoZXIgPSBtZW1vaXplZCgoe3Jvb3REaXIsIHdhdGNoZXI6IG9wdGlvbnN9OiBNb2Rlcm5vT3B0aW9ucyk6IEZTV2F0Y2hlciA9PiB7XG5cbiAgICBjb25zdCB3YXRjaGVyID0gY2hva2lkYXIud2F0Y2goW10sIHtcbiAgICAgICAgLi4ub3B0aW9ucyxcbiAgICAgICAgY3dkOiByb290RGlyLFxuICAgICAgICBhdG9taWM6IGZhbHNlLFxuICAgICAgICBpZ25vcmVkOiBbXG4gICAgICAgICAgICAuLi5vcHRpb25zPy5pZ25vcmVkID8/IFtdLFxuICAgICAgICAgICAgXCIqKi93ZWJfbW9kdWxlcy8qKlwiLFxuICAgICAgICAgICAgXCIqKi9ub2RlX21vZHVsZXMvKipcIlxuICAgICAgICBdXG4gICAgfSk7XG5cbiAgICBsb2cuZGVidWcoXCJjcmVhdGVkIGNob2tpZGFyIHdhdGNoZXJcIik7XG5cbiAgICBpZiAobG9nLmluY2x1ZGVzKFwiZGVidWdcIikpIHtcbiAgICAgICAgd2F0Y2hlci5vbihcImFsbFwiLCAoZXZlbnQsIGZpbGUpID0+IGxvZy5kZWJ1ZyhcIndhdGNoZXJcIiwgZXZlbnQsIGZpbGUpKTtcbiAgICB9XG4gICAgd2F0Y2hlci5vbihcInJlYWR5XCIsICgpID0+IGxvZy5pbmZvKFwid29ya3NwYWNlIHdhdGNoZXIgaXNcIiwgY2hhbGsuYm9sZChcInJlYWR5XCIpKSk7XG5cbiAgICByZXR1cm4gd2F0Y2hlcjtcbn0pO1xuIl19