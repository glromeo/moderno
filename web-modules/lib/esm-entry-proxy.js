"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateEsmProxy = exports.parseEsmReady = void 0;
const es_module_lexer_1 = require("es-module-lexer");
const fs_1 = require("fs");
const path_1 = require("path");
const es_import_utils_1 = require("./es-import-utils");
exports.parseEsmReady = es_module_lexer_1.init;
function scanEsm(filename, collected = new Set(), imports = new Map(), external = []) {
    function notYetCollected(e) {
        return !collected.has(e) && collected.add(e);
    }
    function scanEsm(filename, module) {
        let source = fs_1.readFileSync(filename, "utf-8");
        let [imported, exported] = es_module_lexer_1.parse(source);
        for (const e of exported)
            if (e === "default" && module !== null) {
                external.push(module);
                return;
            }
        let resolveOptions = { paths: [path_1.dirname(filename)] };
        for (const { s, e } of imported) {
            let module = source.substring(s, e);
            if (!es_import_utils_1.isBare(module)) {
                if (module === "..") {
                    module = "../index";
                }
                else if (module === ".") {
                    module = "./index";
                }
                const filename = require.resolve(module, resolveOptions);
                if (!imports.has(filename)) {
                    scanEsm(filename, module);
                }
            }
        }
        imports.set(filename, exported.filter(notYetCollected));
    }
    scanEsm(filename, null);
    return { exports: imports, external };
}
function generateEsmProxy(entryId) {
    const { exports, external } = scanEsm(entryId);
    let code = "";
    let imports = [];
    for (const [filename, exported] of exports.entries()) {
        let moduleUrl = es_import_utils_1.pathnameToModuleUrl(filename);
        if (exported.length > 0) {
            code += `export {\n${exported.join(",\n")}\n} from "${moduleUrl}";\n`;
        }
        imports.push(moduleUrl);
    }
    if (entryId.endsWith("redux-toolkit.esm.js")) {
        code += `export * from "redux";`;
    }
    return {
        code: code || fs_1.readFileSync(entryId, "utf-8"),
        imports,
        external
    };
}
exports.generateEsmProxy = generateEsmProxy;
//# sourceMappingURL=esm-entry-proxy.js.map