import fs from "fs";
import {dirname} from "path";
import {SourceMapConsumer, SourceMapGenerator} from "source-map";
import {ImportResolver} from "./index";

const {readFile, writeFile} = fs.promises;

async function shiftSourceMap(filename: string, offset: number, sourcemap) {
    if (sourcemap === true) {
        let sourcemapfile = filename + ".map";
        let original = JSON.parse(await readFile(sourcemapfile, "utf-8"));
        let generator = new SourceMapGenerator({
            file: original.file,
            sourceRoot: original.sourceRoot
        });
        await SourceMapConsumer.with(original, null, consumer => {
            consumer.eachMapping(({name, source, originalLine, originalColumn, generatedLine, generatedColumn}) => {
                const mapping = {
                    name: name,
                    source: source,
                    original: {line: originalLine, column: originalColumn},
                    generated: {line: generatedLine + offset, column: generatedColumn}
                };
                generator.addMapping(mapping);
            });
        });
        return writeFile(sourcemapfile, generator.toString());
    }
}

export async function replaceRequire(filename: string, resolveImport: ImportResolver, sourcemap) {

    let code: string = await readFile(filename, "utf-8");

    let requires = new Set<string>();
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
