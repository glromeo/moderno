import resolve from "resolve";
import log from "@moderno/logger";
import {PackageMeta, readJson} from "./utility";

export function collectEntryModules(resolveOptions: resolve.SyncOpts, squash: Set<string>, debug?: boolean) {

    const readManifest = (module: string): PackageMeta | null => {
        try {
            return readJson(resolve.sync(`${module}/package.json`, resolveOptions));
        } catch (ignored) {
            log.debug`unable to read package.json for: ${module}`;
            return null;
        }
    };

    const collectDependencies = (entryModule: PackageMeta) => new Set([
        ...Object.keys(entryModule.dependencies || {}),
        ...Object.keys(entryModule.peerDependencies || {})
    ]);

    const entryModules = new Set<string>();
    const visited = new Map<string, string>();

    const asciiTree = debug ? {
        content: "#dependencies\r\n",
        tab: "##",
        enter() {
            this.tab += "#";
        },
        exit() {
            this.tab = this.tab.slice(0, -1);
        },
        add(text) {
            this.content += `${this.tab}${text}\r\n`;
        },
        write() {
            const asciiTree: { generate(string): string } = require("ascii-tree");
            process.stdout.write(asciiTree.generate(this.content) + "\n");
        }
    } : null;

    const collectEntryModules = (entryModule: PackageMeta | null, ancestor?: string) => {
        if (entryModule) {
            for (const dependency of collectDependencies(entryModule)) {
                if (!squash.has(dependency)) {
                    asciiTree?.add(dependency);
                    if (visited.has(dependency)) {
                        if (visited.get(dependency) !== ancestor) {
                            entryModules.add(dependency);
                        }
                    } else {
                        visited.set(dependency, ancestor!);
                        asciiTree?.enter();
                        collectEntryModules(readManifest(dependency), ancestor || dependency);
                        asciiTree?.exit();
                    }
                }
            }
        }
    };

    collectEntryModules(readManifest("."));

    asciiTree?.write();

    return entryModules;
}
