"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectEntryModules = void 0;
const resolve_1 = __importDefault(require("resolve"));
const logger_1 = __importDefault(require("@moderno/logger"));
const utility_1 = require("./utility");
function collectEntryModules(resolveOptions, squash, debug) {
    const readManifest = (module) => {
        try {
            return utility_1.readJson(resolve_1.default.sync(`${module}/package.json`, resolveOptions));
        }
        catch (ignored) {
            logger_1.default.debug `unable to read package.json for: ${module}`;
            return null;
        }
    };
    const collectDependencies = (entryModule) => new Set([
        ...Object.keys(entryModule.dependencies || {}),
        ...Object.keys(entryModule.peerDependencies || {})
    ]);
    const entryModules = new Set();
    const visited = new Map();
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
            const asciiTree = require("ascii-tree");
            process.stdout.write(asciiTree.generate(this.content) + "\n");
        }
    } : null;
    const collectEntryModules = (entryModule, ancestor) => {
        if (entryModule) {
            for (const dependency of collectDependencies(entryModule)) {
                if (!squash.has(dependency)) {
                    asciiTree?.add(dependency);
                    if (visited.has(dependency)) {
                        if (visited.get(dependency) !== ancestor) {
                            entryModules.add(dependency);
                        }
                    }
                    else {
                        visited.set(dependency, ancestor);
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
exports.collectEntryModules = collectEntryModules;
//# sourceMappingURL=entry-modules.js.map