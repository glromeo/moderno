import memoized from "nano-memoize";
import sass from "node-sass";
import path from "path";
import {ModernoOptions} from "../configure";
import {CSS_CONTENT_TYPE, JAVASCRIPT_CONTENT_TYPE} from "../util/mime-types";
import {useSassImporter} from "../util/sass-importer";
import {TransformerOutput} from "./index";

const cssResultModule = cssText => `\
import {css} from "/web_modules/lit-element.js";
const cssResult = css\`
${cssText.replace(/([$`\\])/g, "\\$1")}\`;
export default cssResult; 
`;

const cssResultModuleHMR = cssText => `// [HMR] CSSResult
import {createHotContext} from "/moderno/browser-toolkit.js"; 
import.meta.hot = createHotContext(import.meta.url);

${cssResultModule(cssText)}
import.meta.hot.dispose(() => {
    return import.meta.hot.cssResult || cssResult;
});

import.meta.hot.accept(({module, recycled: cssResult}) => {
    import.meta.hot.cssResult = cssResult;
    cssResult.cssText = module.default.cssText;
    cssResult.styleSheet.replaceSync(module.default.cssText);
});
`;

const styleModule = cssText => `\
const cssText = \`
${cssText.replace(/([$`\\])/g, "\\$1")}\`;

const styleElement = document.createElement("style");

document.head.appendChild(styleElement).appendChild(document.createTextNode(cssText));
`;

const styleModuleHMR = cssText => `// [HMR] Style
import {createHotContext} from "/moderno/browser-toolkit.js"; 
import.meta.hot = createHotContext(import.meta.url);

${styleModule(cssText)}
import.meta.hot.dispose(() => document.head.removeChild(styleElement));
import.meta.hot.accept(true);
`;

export const useSassTransformer = memoized((options: ModernoOptions) => {

    const {sassImporter} = useSassImporter(options);

    const isHMR = options.sass.HMR;

    const makeModule = options.sass.moduleType === "style"
        ? isHMR ? styleModuleHMR : styleModule
        : isHMR ? cssResultModuleHMR : cssResultModule;

    async function sassTransformer(filename: string, content: string, type): Promise<TransformerOutput> {

        const {css, stats} = sass.renderSync({
            ...options.sass,
            data: content,
            importer: sassImporter(filename)
        });

        content = css.toString("utf-8");
        if (type === "module") {
            content = makeModule(content);
        }

        // links is undefined since sass has already included the @imports so no need to push them
        // yet we need the watch array to reload the module when an imported file has changed...

        const dirname = path.dirname(filename);

        return {
            content: content,
            headers: {
                "content-type": type === "module" ? JAVASCRIPT_CONTENT_TYPE : CSS_CONTENT_TYPE,
                "content-length": Buffer.byteLength(content),
                "x-transformer": "sass-transformer"
            },
            includedFiles: stats.includedFiles.map(included => path.resolve(dirname, included))
        };
    }

    return {
        sassTransformer
    };
});
