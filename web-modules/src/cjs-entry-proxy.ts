import {init as initCjs, parse as parseCjs} from "cjs-module-lexer";
import {readFileSync} from "fs";
import { dirname } from "path";
import {isBare, pathnameToModuleUrl, toPosix} from "./es-import-utils";
import {EntryProxyResult} from "./web-modules";

export const parseCjsReady = initCjs();

function scanCjs(
    filename: string,
    collected = new Set<string>()
): Set<string> {
    let source = readFileSync(filename, "utf-8");
    let {
        exports,
        reexports,
    } = parseCjs(source);

    for (const e of exports) {
        collected.add(e);
    }

    for (let required of reexports) {
        if (!isBare(required)) {
            if (required === "..") {
                required = "../index";
            } else if (required === ".") {
                required = "./index";
            }
            let requiredFilename = require.resolve(required, {paths: [dirname(filename)]});
            scanCjs(requiredFilename, collected);
        }
    }

    return collected;
}

export type PluginCjsProxyOptions = {
    entryModules: Set<string>
}

export function generateCjsProxy(entryId: string):EntryProxyResult {
    const entryUrl = toPosix(entryId);
    const exports = scanCjs(entryId);
    exports.delete("__esModule");
    let proxy = "";
    if (!exports.has("default")) {
        proxy += `import __default__ from "${entryUrl}";\nexport default __default__;\n`;
    }
    if (exports.size > 0) {
        proxy += `export {\n${Array.from(exports).join(",\n")}\n} from "${entryUrl}";\n`;
    } else {
        let moduleInstance = require(entryId);
        if (!(!moduleInstance || moduleInstance.constructor !== Object)) {
            let filteredExports = Object.keys(moduleInstance).filter(function (moduleExport) {
                return moduleExport !== "default" && moduleExport !== "__esModule";
            });
            proxy += `export {\n${filteredExports.join(",\n")}\n} from "${entryUrl}";\n`;
        }
    }
    return {
        code: proxy || readFileSync(entryId, "utf-8"),
        imports: [pathnameToModuleUrl(entryId)],
        external: []
    };
}

