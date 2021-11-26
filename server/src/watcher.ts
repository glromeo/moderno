import chalk from "chalk";
import chokidar, {FSWatcher} from "chokidar";
import memoized from "nano-memoize";
import log from "@moderno/logger";
import {ModernoOptions} from "./configure";

export const useWatcher = memoized(({rootDir, watcher: options}: ModernoOptions): FSWatcher => {

    const watcher = chokidar.watch([], {
        ...options,
        cwd: rootDir,
        atomic: false,
        ignored: [
            ...options?.ignored ?? [],
            "**/web_modules/**",
            "**/node_modules/**"
        ]
    });

    log.debug("created chokidar watcher");

    if (log.includes("debug")) {
        watcher.on("all", (event, file) => log.debug("watcher", event, file));
    }
    watcher.on("ready", () => log.info("workspace watcher is", chalk.bold("ready")));

    return watcher;
});
