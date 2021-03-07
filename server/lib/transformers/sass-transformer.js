"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSassTransformer = void 0;
const nano_memoize_1 = __importDefault(require("nano-memoize"));
const node_sass_1 = __importDefault(require("node-sass"));
const path_1 = __importDefault(require("path"));
const mime_types_1 = require("../util/mime-types");
const sass_importer_1 = require("../util/sass-importer");
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
exports.useSassTransformer = nano_memoize_1.default((options) => {
    const { sassImporter } = sass_importer_1.useSassImporter(options);
    const isHMR = options.sass.HMR;
    const makeModule = options.sass.moduleType === "style"
        ? isHMR ? styleModuleHMR : styleModule
        : isHMR ? cssResultModuleHMR : cssResultModule;
    async function sassTransformer(filename, content, type) {
        const { css, stats } = node_sass_1.default.renderSync({
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
        const dirname = path_1.default.dirname(filename);
        return {
            content: content,
            headers: {
                "content-type": type === "module" ? mime_types_1.JAVASCRIPT_CONTENT_TYPE : mime_types_1.CSS_CONTENT_TYPE,
                "content-length": Buffer.byteLength(content),
                "x-transformer": "sass-transformer"
            },
            includedFiles: stats.includedFiles.map(included => path_1.default.resolve(dirname, included))
        };
    }
    return {
        sassTransformer
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Fzcy10cmFuc2Zvcm1lci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90cmFuc2Zvcm1lcnMvc2Fzcy10cmFuc2Zvcm1lci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxnRUFBb0M7QUFDcEMsMERBQTZCO0FBQzdCLGdEQUF3QjtBQUV4QixtREFBNkU7QUFDN0UseURBQXNEO0FBR3RELE1BQU0sZUFBZSxHQUFHLE9BQU8sQ0FBQyxFQUFFLENBQUM7OztFQUdqQyxPQUFPLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxNQUFNLENBQUM7O0NBRXJDLENBQUM7QUFFRixNQUFNLGtCQUFrQixHQUFHLE9BQU8sQ0FBQyxFQUFFLENBQUM7Ozs7RUFJcEMsZUFBZSxDQUFDLE9BQU8sQ0FBQzs7Ozs7Ozs7OztDQVV6QixDQUFDO0FBRUYsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLEVBQUUsQ0FBQzs7RUFFN0IsT0FBTyxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsTUFBTSxDQUFDOzs7OztDQUtyQyxDQUFDO0FBRUYsTUFBTSxjQUFjLEdBQUcsT0FBTyxDQUFDLEVBQUUsQ0FBQzs7OztFQUloQyxXQUFXLENBQUMsT0FBTyxDQUFDOzs7Q0FHckIsQ0FBQztBQUVXLFFBQUEsa0JBQWtCLEdBQUcsc0JBQVEsQ0FBQyxDQUFDLE9BQXVCLEVBQUUsRUFBRTtJQUVuRSxNQUFNLEVBQUMsWUFBWSxFQUFDLEdBQUcsK0JBQWUsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUVoRCxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQztJQUUvQixNQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLFVBQVUsS0FBSyxPQUFPO1FBQ2xELENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsV0FBVztRQUN0QyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsZUFBZSxDQUFDO0lBRW5ELEtBQUssVUFBVSxlQUFlLENBQUMsUUFBZ0IsRUFBRSxPQUFlLEVBQUUsSUFBSTtRQUVsRSxNQUFNLEVBQUMsR0FBRyxFQUFFLEtBQUssRUFBQyxHQUFHLG1CQUFJLENBQUMsVUFBVSxDQUFDO1lBQ2pDLEdBQUcsT0FBTyxDQUFDLElBQUk7WUFDZixJQUFJLEVBQUUsT0FBTztZQUNiLFFBQVEsRUFBRSxZQUFZLENBQUMsUUFBUSxDQUFDO1NBQ25DLENBQUMsQ0FBQztRQUVILE9BQU8sR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ2hDLElBQUksSUFBSSxLQUFLLFFBQVEsRUFBRTtZQUNuQixPQUFPLEdBQUcsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1NBQ2pDO1FBRUQsMEZBQTBGO1FBQzFGLHdGQUF3RjtRQUV4RixNQUFNLE9BQU8sR0FBRyxjQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBRXZDLE9BQU87WUFDSCxPQUFPLEVBQUUsT0FBTztZQUNoQixPQUFPLEVBQUU7Z0JBQ0wsY0FBYyxFQUFFLElBQUksS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLG9DQUF1QixDQUFDLENBQUMsQ0FBQyw2QkFBZ0I7Z0JBQzlFLGdCQUFnQixFQUFFLE1BQU0sQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDO2dCQUM1QyxlQUFlLEVBQUUsa0JBQWtCO2FBQ3RDO1lBQ0QsYUFBYSxFQUFFLEtBQUssQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsY0FBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUM7U0FDdEYsQ0FBQztJQUNOLENBQUM7SUFFRCxPQUFPO1FBQ0gsZUFBZTtLQUNsQixDQUFDO0FBQ04sQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgbWVtb2l6ZWQgZnJvbSBcIm5hbm8tbWVtb2l6ZVwiO1xyXG5pbXBvcnQgc2FzcyBmcm9tIFwibm9kZS1zYXNzXCI7XHJcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XHJcbmltcG9ydCB7TW9kZXJub09wdGlvbnN9IGZyb20gXCIuLi9jb25maWd1cmVcIjtcclxuaW1wb3J0IHtDU1NfQ09OVEVOVF9UWVBFLCBKQVZBU0NSSVBUX0NPTlRFTlRfVFlQRX0gZnJvbSBcIi4uL3V0aWwvbWltZS10eXBlc1wiO1xyXG5pbXBvcnQge3VzZVNhc3NJbXBvcnRlcn0gZnJvbSBcIi4uL3V0aWwvc2Fzcy1pbXBvcnRlclwiO1xyXG5pbXBvcnQge1RyYW5zZm9ybWVyT3V0cHV0fSBmcm9tIFwiLi9pbmRleFwiO1xyXG5cclxuY29uc3QgY3NzUmVzdWx0TW9kdWxlID0gY3NzVGV4dCA9PiBgXFxcclxuaW1wb3J0IHtjc3N9IGZyb20gXCIvd2ViX21vZHVsZXMvbGl0LWVsZW1lbnQuanNcIjtcclxuY29uc3QgY3NzUmVzdWx0ID0gY3NzXFxgXHJcbiR7Y3NzVGV4dC5yZXBsYWNlKC8oWyRgXFxcXF0pL2csIFwiXFxcXCQxXCIpfVxcYDtcclxuZXhwb3J0IGRlZmF1bHQgY3NzUmVzdWx0OyBcclxuYDtcclxuXHJcbmNvbnN0IGNzc1Jlc3VsdE1vZHVsZUhNUiA9IGNzc1RleHQgPT4gYC8vIFtITVJdIENTU1Jlc3VsdFxyXG5pbXBvcnQge2NyZWF0ZUhvdENvbnRleHR9IGZyb20gXCIvbW9kZXJuby9icm93c2VyLXRvb2xraXQuanNcIjsgXHJcbmltcG9ydC5tZXRhLmhvdCA9IGNyZWF0ZUhvdENvbnRleHQoaW1wb3J0Lm1ldGEudXJsKTtcclxuXHJcbiR7Y3NzUmVzdWx0TW9kdWxlKGNzc1RleHQpfVxyXG5pbXBvcnQubWV0YS5ob3QuZGlzcG9zZSgoKSA9PiB7XHJcbiAgICByZXR1cm4gaW1wb3J0Lm1ldGEuaG90LmNzc1Jlc3VsdCB8fCBjc3NSZXN1bHQ7XHJcbn0pO1xyXG5cclxuaW1wb3J0Lm1ldGEuaG90LmFjY2VwdCgoe21vZHVsZSwgcmVjeWNsZWQ6IGNzc1Jlc3VsdH0pID0+IHtcclxuICAgIGltcG9ydC5tZXRhLmhvdC5jc3NSZXN1bHQgPSBjc3NSZXN1bHQ7XHJcbiAgICBjc3NSZXN1bHQuY3NzVGV4dCA9IG1vZHVsZS5kZWZhdWx0LmNzc1RleHQ7XHJcbiAgICBjc3NSZXN1bHQuc3R5bGVTaGVldC5yZXBsYWNlU3luYyhtb2R1bGUuZGVmYXVsdC5jc3NUZXh0KTtcclxufSk7XHJcbmA7XHJcblxyXG5jb25zdCBzdHlsZU1vZHVsZSA9IGNzc1RleHQgPT4gYFxcXHJcbmNvbnN0IGNzc1RleHQgPSBcXGBcclxuJHtjc3NUZXh0LnJlcGxhY2UoLyhbJGBcXFxcXSkvZywgXCJcXFxcJDFcIil9XFxgO1xyXG5cclxuY29uc3Qgc3R5bGVFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInN0eWxlXCIpO1xyXG5cclxuZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzdHlsZUVsZW1lbnQpLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGNzc1RleHQpKTtcclxuYDtcclxuXHJcbmNvbnN0IHN0eWxlTW9kdWxlSE1SID0gY3NzVGV4dCA9PiBgLy8gW0hNUl0gU3R5bGVcclxuaW1wb3J0IHtjcmVhdGVIb3RDb250ZXh0fSBmcm9tIFwiL21vZGVybm8vYnJvd3Nlci10b29sa2l0LmpzXCI7IFxyXG5pbXBvcnQubWV0YS5ob3QgPSBjcmVhdGVIb3RDb250ZXh0KGltcG9ydC5tZXRhLnVybCk7XHJcblxyXG4ke3N0eWxlTW9kdWxlKGNzc1RleHQpfVxyXG5pbXBvcnQubWV0YS5ob3QuZGlzcG9zZSgoKSA9PiBkb2N1bWVudC5oZWFkLnJlbW92ZUNoaWxkKHN0eWxlRWxlbWVudCkpO1xyXG5pbXBvcnQubWV0YS5ob3QuYWNjZXB0KHRydWUpO1xyXG5gO1xyXG5cclxuZXhwb3J0IGNvbnN0IHVzZVNhc3NUcmFuc2Zvcm1lciA9IG1lbW9pemVkKChvcHRpb25zOiBNb2Rlcm5vT3B0aW9ucykgPT4ge1xyXG5cclxuICAgIGNvbnN0IHtzYXNzSW1wb3J0ZXJ9ID0gdXNlU2Fzc0ltcG9ydGVyKG9wdGlvbnMpO1xyXG5cclxuICAgIGNvbnN0IGlzSE1SID0gb3B0aW9ucy5zYXNzLkhNUjtcclxuXHJcbiAgICBjb25zdCBtYWtlTW9kdWxlID0gb3B0aW9ucy5zYXNzLm1vZHVsZVR5cGUgPT09IFwic3R5bGVcIlxyXG4gICAgICAgID8gaXNITVIgPyBzdHlsZU1vZHVsZUhNUiA6IHN0eWxlTW9kdWxlXHJcbiAgICAgICAgOiBpc0hNUiA/IGNzc1Jlc3VsdE1vZHVsZUhNUiA6IGNzc1Jlc3VsdE1vZHVsZTtcclxuXHJcbiAgICBhc3luYyBmdW5jdGlvbiBzYXNzVHJhbnNmb3JtZXIoZmlsZW5hbWU6IHN0cmluZywgY29udGVudDogc3RyaW5nLCB0eXBlKTogUHJvbWlzZTxUcmFuc2Zvcm1lck91dHB1dD4ge1xyXG5cclxuICAgICAgICBjb25zdCB7Y3NzLCBzdGF0c30gPSBzYXNzLnJlbmRlclN5bmMoe1xyXG4gICAgICAgICAgICAuLi5vcHRpb25zLnNhc3MsXHJcbiAgICAgICAgICAgIGRhdGE6IGNvbnRlbnQsXHJcbiAgICAgICAgICAgIGltcG9ydGVyOiBzYXNzSW1wb3J0ZXIoZmlsZW5hbWUpXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGNvbnRlbnQgPSBjc3MudG9TdHJpbmcoXCJ1dGYtOFwiKTtcclxuICAgICAgICBpZiAodHlwZSA9PT0gXCJtb2R1bGVcIikge1xyXG4gICAgICAgICAgICBjb250ZW50ID0gbWFrZU1vZHVsZShjb250ZW50KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGxpbmtzIGlzIHVuZGVmaW5lZCBzaW5jZSBzYXNzIGhhcyBhbHJlYWR5IGluY2x1ZGVkIHRoZSBAaW1wb3J0cyBzbyBubyBuZWVkIHRvIHB1c2ggdGhlbVxyXG4gICAgICAgIC8vIHlldCB3ZSBuZWVkIHRoZSB3YXRjaCBhcnJheSB0byByZWxvYWQgdGhlIG1vZHVsZSB3aGVuIGFuIGltcG9ydGVkIGZpbGUgaGFzIGNoYW5nZWQuLi5cclxuXHJcbiAgICAgICAgY29uc3QgZGlybmFtZSA9IHBhdGguZGlybmFtZShmaWxlbmFtZSk7XHJcblxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGNvbnRlbnQ6IGNvbnRlbnQsXHJcbiAgICAgICAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAgICAgICAgIFwiY29udGVudC10eXBlXCI6IHR5cGUgPT09IFwibW9kdWxlXCIgPyBKQVZBU0NSSVBUX0NPTlRFTlRfVFlQRSA6IENTU19DT05URU5UX1RZUEUsXHJcbiAgICAgICAgICAgICAgICBcImNvbnRlbnQtbGVuZ3RoXCI6IEJ1ZmZlci5ieXRlTGVuZ3RoKGNvbnRlbnQpLFxyXG4gICAgICAgICAgICAgICAgXCJ4LXRyYW5zZm9ybWVyXCI6IFwic2Fzcy10cmFuc2Zvcm1lclwiXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGluY2x1ZGVkRmlsZXM6IHN0YXRzLmluY2x1ZGVkRmlsZXMubWFwKGluY2x1ZGVkID0+IHBhdGgucmVzb2x2ZShkaXJuYW1lLCBpbmNsdWRlZCkpXHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHNhc3NUcmFuc2Zvcm1lclxyXG4gICAgfTtcclxufSk7XHJcbiJdfQ==