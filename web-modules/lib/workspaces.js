"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readWorkspaces = void 0;
const logger_1 = __importDefault(require("@moderno/logger"));
const glob_1 = require("glob");
const path_1 = __importStar(require("path"));
const es_import_utils_1 = require("./es-import-utils");
const utility_1 = require("./utility");
function readManifest(basedir, makeRelative, entries = new Map()) {
    logger_1.default.debug("reading manifest from:", basedir);
    try {
        let { name, workspaces } = utility_1.readJson(path_1.default.join(basedir, "package.json"));
        entries.set(name, makeRelative(basedir));
        if (workspaces)
            for (const workspace of workspaces) {
                let manifests = glob_1.glob.sync(`${workspace}/package.json`, {
                    cwd: basedir,
                    nonull: true
                });
                for (const manifest of manifests) {
                    let dirname = path_1.default.dirname(path_1.default.join(basedir, manifest));
                    readManifest(dirname, makeRelative, entries);
                }
            }
        return entries;
    }
    catch (ignored) {
        logger_1.default.debug("no package.json found at:", basedir);
    }
}
function readWorkspaces(rootDir) {
    const makeRelative = pathname => path_1.posix.join("/workspaces", es_import_utils_1.toPosix(path_1.default.relative(rootDir, pathname)));
    let workspaces = readManifest(rootDir, makeRelative);
    return workspaces;
}
exports.readWorkspaces = readWorkspaces;
//# sourceMappingURL=workspaces.js.map