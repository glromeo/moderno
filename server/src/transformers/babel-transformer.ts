import {parseSync, transformFromAstSync, TransformOptions} from "@babel/core";
import {useWebModulesPlugin} from "@moderno/web-modules";
import memoized from "nano-memoize";
import path from "path";
import {ModernoOptions} from "../configure";
import {JAVASCRIPT_CONTENT_TYPE} from "../util/mime-types";
import {TransformerOutput} from "./index";

export const useBabelTransformer = memoized((options: ModernoOptions, sourceMaps: "inline" | "auto" = "auto") => {

    const {resolveImports, rewriteImports} = useWebModulesPlugin(options);

    const preProcess = options.transform && options.transform.preProcess;

    async function babelTransformer(filename:string, content:string): Promise<TransformerOutput> {

        const babelOptions: TransformOptions = {
            ...options.babel,
            sourceMaps: sourceMaps === "auto" ? options.babel.sourceMaps : options.babel.sourceMaps && "inline",
            babelrc: true,
            filename: filename
        };

        const source = preProcess ? preProcess(filename, content) : content;
        const parsedAst = parseSync(source, babelOptions)!;
        const importMap = await resolveImports(filename, parsedAst);

        let {code, map, metadata} = transformFromAstSync(parsedAst, source, {
            ...babelOptions,
            plugins: [
                ...babelOptions.plugins!,
                [rewriteImports, {importMap}]
            ]
        })!;

        if (!code) {
            throw new Error(`Babel transformer failed to transform: ${filename}`);
        }

        if (map) {
            code += "\n//# sourceMappingURL=" + path.basename(filename) + ".map\n";
        } else {
            code += "\n";
        }

        return {
            content: code,
            headers: {
                "content-type": JAVASCRIPT_CONTENT_TYPE,
                "content-length": Buffer.byteLength(code),
                "x-transformer": "babel-transformer"
            },
            map,
            links: [...metadata!["imports"]]
        };
    }

    return {
        babelTransformer
    };
});
