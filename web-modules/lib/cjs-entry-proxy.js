"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCjsProxy = exports.parseCjsReady = void 0;
const cjs_module_lexer_1 = require("cjs-module-lexer");
const fs_1 = require("fs");
const path_1 = require("path");
const es_import_utils_1 = require("./es-import-utils");
exports.parseCjsReady = cjs_module_lexer_1.init();
function scanCjs(filename, collected = new Set()) {
    let source = fs_1.readFileSync(filename, "utf-8");
    let { exports, reexports, } = cjs_module_lexer_1.parse(source);
    for (const e of exports) {
        collected.add(e);
    }
    for (let required of reexports) {
        if (!es_import_utils_1.isBare(required)) {
            if (required === "..") {
                required = "../index";
            }
            else if (required === ".") {
                required = "./index";
            }
            let requiredFilename = require.resolve(required, { paths: [path_1.dirname(filename)] });
            scanCjs(requiredFilename, collected);
        }
    }
    return collected;
}
function generateCjsProxy(entryId) {
    const entryUrl = es_import_utils_1.toPosix(entryId);
    const exports = scanCjs(entryId);
    exports.delete("__esModule");
    let proxy = "";
    if (!exports.has("default")) {
        proxy += `import __default__ from "${entryUrl}";\nexport default __default__;\n`;
    }
    if (exports.size > 0) {
        proxy += `export {\n${Array.from(exports).join(",\n")}\n} from "${entryUrl}";\n`;
    }
    else {
        let moduleInstance = require(entryId);
        if (!(!moduleInstance || moduleInstance.constructor !== Object)) {
            let filteredExports = Object.keys(moduleInstance).filter(function (moduleExport) {
                return moduleExport !== "default" && moduleExport !== "__esModule";
            });
            proxy += `export {\n${filteredExports.join(",\n")}\n} from "${entryUrl}";\n`;
        }
    }
    return {
        code: proxy || fs_1.readFileSync(entryId, "utf-8"),
        imports: [es_import_utils_1.pathnameToModuleUrl(entryId)],
        external: []
    };
}
exports.generateCjsProxy = generateCjsProxy;
//# sourceMappingURL=cjs-entry-proxy.js.map