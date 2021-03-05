import {init, parse as parseEsm} from "es-module-lexer";
import {readFileSync} from "fs";
import {dirname} from "path";
import {isBare, pathnameToModuleUrl} from "./es-import-utils";
import {EntryProxyResult} from "./web-modules";

export const parseEsmReady = init;

function scanEsm(
    filename: string,
    collected = new Set<string>(),
    imports = new Map<string, string[]>(),
    external:string[] = []
): { exports: Map<string, string[]>, external: string[] } {

    function notYetCollected(e) {
        return !collected.has(e) && collected.add(e);
    }

    function scanEsm(filename:string, module:string|null) {

        let source = readFileSync(filename, "utf-8");
        let [
            imported,
            exported
        ] = parseEsm(source);

        for (const e of exported) if (e === "default" && module !== null) {
            external.push(module);
            return;
        }

        let resolveOptions = {paths: [dirname(filename)]};

        for (const {s, e} of imported) {
            let module = source.substring(s, e);
            if (!isBare(module)) {
                if (module === "..") {
                    module = "../index";
                } else if (module === ".") {
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
    return {exports: imports, external};
}


export type PluginEsmProxyOptions = {
    entryModules: Set<string>
}

export function generateEsmProxy(entryId: string): EntryProxyResult {
    const {exports, external} = scanEsm(entryId);
    let code = "";
    let imports: string[] = [];
    for (const [filename, exported] of exports.entries()) {
        let moduleUrl = pathnameToModuleUrl(filename);
        if (exported.length > 0) {
            code += `export {\n${exported.join(",\n")}\n} from "${moduleUrl}";\n`;
        }
        imports.push(moduleUrl);
    }
    if (entryId.endsWith("redux-toolkit.esm.js")) {
        code += `export * from "redux";`;
    }
    return {
        code: code || readFileSync(entryId, "utf-8"),
        imports,
        external
    };
}

