"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.replaceRequire = void 0;
const fs_1 = __importDefault(require("fs"));
const source_map_1 = require("source-map");
const { readFile, writeFile } = fs_1.default.promises;
async function shiftSourceMap(filename, offset, sourcemap) {
    if (sourcemap === true) {
        let sourcemapfile = filename + ".map";
        let original = JSON.parse(await readFile(sourcemapfile, "utf-8"));
        let generator = new source_map_1.SourceMapGenerator({
            file: original.file,
            sourceRoot: original.sourceRoot
        });
        await source_map_1.SourceMapConsumer.with(original, null, consumer => {
            consumer.eachMapping(({ name, source, originalLine, originalColumn, generatedLine, generatedColumn }) => {
                const mapping = {
                    name: name,
                    source: source,
                    original: { line: originalLine, column: originalColumn },
                    generated: { line: generatedLine + offset, column: generatedColumn }
                };
                generator.addMapping(mapping);
            });
        });
        return writeFile(sourcemapfile, generator.toString());
    }
}
async function replaceRequire(filename, resolveImport, sourcemap) {
    let code = await readFile(filename, "utf-8");
    let requires = new Set();
    let re = /require\s*\(([^)]+)\)/g;
    for (let match = re.exec(code); match; match = re.exec(code)) {
        let required = match[1].trim().slice(1, -1);
        requires.add(await resolveImport(required, filename));
    }
    if (requires.size) {
        let r = 0;
        let cjsImports = ``;
        let cjsRequire = `function require(name) {\n  switch(name) {\n`;
        for (const url of requires) {
            cjsImports += `import require$${r} from "${url}";\n`;
            cjsRequire += `    case "${url}": return require$${r++};\n`;
        }
        cjsRequire += `  }\n}\n`;
        let extended = cjsImports + cjsRequire + code;
        return Promise.all([writeFile(filename, extended), shiftSourceMap(filename, 2 * (2 + requires.size), sourcemap)]);
    }
}
exports.replaceRequire = replaceRequire;
//# sourceMappingURL=replace-require.js.map