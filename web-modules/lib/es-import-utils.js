"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toPosix = exports.parseModuleUrl = exports.pathnameToModuleUrl = exports.posixPathnameToModuleUrl = exports.isBare = void 0;
const path_1 = __importDefault(require("path"));
function isBare(url) {
    let cc = url[0];
    if (cc === "/")
        return false;
    if (cc === ".") {
        if (url.length === 1)
            return false;
        cc = url[1];
        if (cc === "/")
            return false;
        if (cc === ".") {
            if (url.length === 2)
                return false;
            cc = url[2];
            if (cc === "/")
                return false;
        }
    }
    if (url[1] === ":") {
        let s = url[2];
        if (s === "/" || s === "\\")
            return false;
    }
    return true;
}
exports.isBare = isBare;
function posixPathnameToModuleUrl(pathname) {
    const index = pathname.lastIndexOf("/node_modules/");
    return index !== -1 ? pathname.substring(index + 14) : pathname;
}
exports.posixPathnameToModuleUrl = posixPathnameToModuleUrl;
const BACKSLASH_REGEXP = /\\/g;
const POSIX_SEP = path_1.default.posix.sep;
exports.pathnameToModuleUrl = path_1.default.sep === POSIX_SEP
    ? posixPathnameToModuleUrl
    : function (filename) {
        return posixPathnameToModuleUrl(filename.replace(BACKSLASH_REGEXP, POSIX_SEP));
    };
function parseModuleUrl(pathname) {
    let namespace = pathname[0] === "@";
    let separator = namespace ? pathname.indexOf("/", pathname.indexOf("/", 1) + 1) : pathname.indexOf("/", 0);
    if (separator === -1)
        return [
            pathname,
            null
        ];
    if (separator > 2 || /^\w\w/.test(pathname))
        return [
            pathname.substring(0, separator),
            pathname.substring(separator + 1)
        ];
    return [
        null,
        pathname
    ];
}
exports.parseModuleUrl = parseModuleUrl;
exports.toPosix = path_1.default.sep === "/"
    ? pathname => pathname
    : pathname => pathname.replace(/\\/g, "/");
//# sourceMappingURL=es-import-utils.js.map