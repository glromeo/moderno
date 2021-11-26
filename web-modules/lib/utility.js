"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.closestManifest = exports.writeImportMap = exports.readImportMap = exports.stripExt = exports.readJson = void 0;
const chalk_1 = __importDefault(require("chalk"));
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const logger_1 = __importDefault(require("@moderno/logger"));
function readJson(filename) {
    return JSON.parse(fs_1.readFileSync(filename, "utf-8"));
}
exports.readJson = readJson;
function stripExt(filename) {
    const end = filename.lastIndexOf(".");
    return end > 0 ? filename.substring(0, end) : filename;
}
exports.stripExt = stripExt;
function readImportMap(rootDir, outDir) {
    try {
        let importMap = JSON.parse(fs_1.readFileSync(`${outDir}/import-map.json`, "utf-8"));
        for (const [key, pathname] of Object.entries(importMap.imports)) {
            try {
                let { mtime } = fs_1.statSync(path_1.default.join(rootDir, String(pathname)));
                logger_1.default.debug("web_module:", chalk_1.default.green(key), "->", chalk_1.default.gray(pathname), "mtime:", mtime);
            }
            catch (e) {
                delete importMap.imports[key];
            }
        }
        return importMap;
    }
    catch (e) {
        return { imports: {} };
    }
}
exports.readImportMap = readImportMap;
function writeImportMap(outDir, importMap) {
    return fs_1.promises.writeFile(`${outDir}/import-map.json`, JSON.stringify(importMap, null, "  "));
}
exports.writeImportMap = writeImportMap;
function closestManifest(entryModule) {
    let dirname = path_1.default.dirname(entryModule);
    while (true)
        try {
            return readJson(`${dirname}/package.json`);
        }
        catch (e) {
            const parent = path_1.default.dirname(dirname);
            if (parent.endsWith("node_modules")) {
                break;
            }
            dirname = parent;
        }
    throw new Error("No package.json found starting from: " + entryModule);
}
exports.closestManifest = closestManifest;
//# sourceMappingURL=utility.js.map