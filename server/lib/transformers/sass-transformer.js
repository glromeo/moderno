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
const cssResultModule = cssText => `// [HMR] Update CSSResult
import {createHotContext} from "/moderno/browser-toolkit.js"; 
import.meta.hot = createHotContext(import.meta.url);

import {css} from "/web_modules/lit-element.js";
const cssResult = css\`
${cssText.replace(/([$`\\])/g, "\\$1")}\`;
export default cssResult; 

// Even new custom element instances would use the original cssResult instance

import.meta.hot.dispose(() => {
    return import.meta.hot.cssResult || cssResult;
});

import.meta.hot.accept(({module, recycled: cssResult}) => {
    import.meta.hot.cssResult = cssResult;
    cssResult.cssText = module.default.cssText;
    cssResult.styleSheet.replaceSync(module.default.cssText);
});
`;
const styleModule = cssText => `// [HMR] Reload Style
import {createHotContext} from "/moderno/browser-toolkit.js"; 
import.meta.hot = createHotContext(import.meta.url);

const styleElement = document.createElement("style");
document.head
    .appendChild(styleElement)
    .appendChild(document.createTextNode(\`
${cssText.replace(/([$`\\])/g, "\\$1")}\`));

import.meta.hot.dispose(() => document.head.removeChild(styleElement));
import.meta.hot.accept(true);
`;
exports.useSassTransformer = nano_memoize_1.default((options) => {
    const { sassImporter } = sass_importer_1.useSassImporter(options);
    const makeModule = options.sass.moduleType === "style" ? styleModule : cssResultModule;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Fzcy10cmFuc2Zvcm1lci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90cmFuc2Zvcm1lcnMvc2Fzcy10cmFuc2Zvcm1lci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxnRUFBb0M7QUFDcEMsMERBQTZCO0FBQzdCLGdEQUF3QjtBQUV4QixtREFBNkU7QUFDN0UseURBQXNEO0FBR3RELE1BQU0sZUFBZSxHQUFHLE9BQU8sQ0FBQyxFQUFFLENBQUM7Ozs7OztFQU1qQyxPQUFPLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxNQUFNLENBQUM7Ozs7Ozs7Ozs7Ozs7O0NBY3JDLENBQUM7QUFFRixNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsRUFBRSxDQUFDOzs7Ozs7OztFQVE3QixPQUFPLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxNQUFNLENBQUM7Ozs7Q0FJckMsQ0FBQztBQUVXLFFBQUEsa0JBQWtCLEdBQUcsc0JBQVEsQ0FBQyxDQUFDLE9BQXVCLEVBQUUsRUFBRTtJQUVuRSxNQUFNLEVBQUMsWUFBWSxFQUFDLEdBQUcsK0JBQWUsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUVoRCxNQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLFVBQVUsS0FBSyxPQUFPLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsZUFBZSxDQUFDO0lBRXZGLEtBQUssVUFBVSxlQUFlLENBQUMsUUFBZ0IsRUFBRSxPQUFlLEVBQUUsSUFBSTtRQUVsRSxNQUFNLEVBQUMsR0FBRyxFQUFFLEtBQUssRUFBQyxHQUFHLG1CQUFJLENBQUMsVUFBVSxDQUFDO1lBQ2pDLEdBQUcsT0FBTyxDQUFDLElBQUk7WUFDZixJQUFJLEVBQUUsT0FBTztZQUNiLFFBQVEsRUFBRSxZQUFZLENBQUMsUUFBUSxDQUFDO1NBQ25DLENBQUMsQ0FBQztRQUVILE9BQU8sR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ2hDLElBQUksSUFBSSxLQUFLLFFBQVEsRUFBRTtZQUNuQixPQUFPLEdBQUcsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1NBQ2pDO1FBRUQsMEZBQTBGO1FBQzFGLHdGQUF3RjtRQUV4RixNQUFNLE9BQU8sR0FBRyxjQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBRXZDLE9BQU87WUFDSCxPQUFPLEVBQUUsT0FBTztZQUNoQixPQUFPLEVBQUU7Z0JBQ0wsY0FBYyxFQUFFLElBQUksS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLG9DQUF1QixDQUFDLENBQUMsQ0FBQyw2QkFBZ0I7Z0JBQzlFLGdCQUFnQixFQUFFLE1BQU0sQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDO2dCQUM1QyxlQUFlLEVBQUUsa0JBQWtCO2FBQ3RDO1lBQ0QsYUFBYSxFQUFFLEtBQUssQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsY0FBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUM7U0FDdEYsQ0FBQztJQUNOLENBQUM7SUFFRCxPQUFPO1FBQ0gsZUFBZTtLQUNsQixDQUFDO0FBQ04sQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgbWVtb2l6ZWQgZnJvbSBcIm5hbm8tbWVtb2l6ZVwiO1xyXG5pbXBvcnQgc2FzcyBmcm9tIFwibm9kZS1zYXNzXCI7XHJcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XHJcbmltcG9ydCB7TW9kZXJub09wdGlvbnN9IGZyb20gXCIuLi9jb25maWd1cmVcIjtcclxuaW1wb3J0IHtDU1NfQ09OVEVOVF9UWVBFLCBKQVZBU0NSSVBUX0NPTlRFTlRfVFlQRX0gZnJvbSBcIi4uL3V0aWwvbWltZS10eXBlc1wiO1xyXG5pbXBvcnQge3VzZVNhc3NJbXBvcnRlcn0gZnJvbSBcIi4uL3V0aWwvc2Fzcy1pbXBvcnRlclwiO1xyXG5pbXBvcnQge1RyYW5zZm9ybWVyT3V0cHV0fSBmcm9tIFwiLi9pbmRleFwiO1xyXG5cclxuY29uc3QgY3NzUmVzdWx0TW9kdWxlID0gY3NzVGV4dCA9PiBgLy8gW0hNUl0gVXBkYXRlIENTU1Jlc3VsdFxyXG5pbXBvcnQge2NyZWF0ZUhvdENvbnRleHR9IGZyb20gXCIvbW9kZXJuby9icm93c2VyLXRvb2xraXQuanNcIjsgXHJcbmltcG9ydC5tZXRhLmhvdCA9IGNyZWF0ZUhvdENvbnRleHQoaW1wb3J0Lm1ldGEudXJsKTtcclxuXHJcbmltcG9ydCB7Y3NzfSBmcm9tIFwiL3dlYl9tb2R1bGVzL2xpdC1lbGVtZW50LmpzXCI7XHJcbmNvbnN0IGNzc1Jlc3VsdCA9IGNzc1xcYFxyXG4ke2Nzc1RleHQucmVwbGFjZSgvKFskYFxcXFxdKS9nLCBcIlxcXFwkMVwiKX1cXGA7XHJcbmV4cG9ydCBkZWZhdWx0IGNzc1Jlc3VsdDsgXHJcblxyXG4vLyBFdmVuIG5ldyBjdXN0b20gZWxlbWVudCBpbnN0YW5jZXMgd291bGQgdXNlIHRoZSBvcmlnaW5hbCBjc3NSZXN1bHQgaW5zdGFuY2VcclxuXHJcbmltcG9ydC5tZXRhLmhvdC5kaXNwb3NlKCgpID0+IHtcclxuICAgIHJldHVybiBpbXBvcnQubWV0YS5ob3QuY3NzUmVzdWx0IHx8IGNzc1Jlc3VsdDtcclxufSk7XHJcblxyXG5pbXBvcnQubWV0YS5ob3QuYWNjZXB0KCh7bW9kdWxlLCByZWN5Y2xlZDogY3NzUmVzdWx0fSkgPT4ge1xyXG4gICAgaW1wb3J0Lm1ldGEuaG90LmNzc1Jlc3VsdCA9IGNzc1Jlc3VsdDtcclxuICAgIGNzc1Jlc3VsdC5jc3NUZXh0ID0gbW9kdWxlLmRlZmF1bHQuY3NzVGV4dDtcclxuICAgIGNzc1Jlc3VsdC5zdHlsZVNoZWV0LnJlcGxhY2VTeW5jKG1vZHVsZS5kZWZhdWx0LmNzc1RleHQpO1xyXG59KTtcclxuYDtcclxuXHJcbmNvbnN0IHN0eWxlTW9kdWxlID0gY3NzVGV4dCA9PiBgLy8gW0hNUl0gUmVsb2FkIFN0eWxlXHJcbmltcG9ydCB7Y3JlYXRlSG90Q29udGV4dH0gZnJvbSBcIi9tb2Rlcm5vL2Jyb3dzZXItdG9vbGtpdC5qc1wiOyBcclxuaW1wb3J0Lm1ldGEuaG90ID0gY3JlYXRlSG90Q29udGV4dChpbXBvcnQubWV0YS51cmwpO1xyXG5cclxuY29uc3Qgc3R5bGVFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInN0eWxlXCIpO1xyXG5kb2N1bWVudC5oZWFkXHJcbiAgICAuYXBwZW5kQ2hpbGQoc3R5bGVFbGVtZW50KVxyXG4gICAgLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKFxcYFxyXG4ke2Nzc1RleHQucmVwbGFjZSgvKFskYFxcXFxdKS9nLCBcIlxcXFwkMVwiKX1cXGApKTtcclxuXHJcbmltcG9ydC5tZXRhLmhvdC5kaXNwb3NlKCgpID0+IGRvY3VtZW50LmhlYWQucmVtb3ZlQ2hpbGQoc3R5bGVFbGVtZW50KSk7XHJcbmltcG9ydC5tZXRhLmhvdC5hY2NlcHQodHJ1ZSk7XHJcbmA7XHJcblxyXG5leHBvcnQgY29uc3QgdXNlU2Fzc1RyYW5zZm9ybWVyID0gbWVtb2l6ZWQoKG9wdGlvbnM6IE1vZGVybm9PcHRpb25zKSA9PiB7XHJcblxyXG4gICAgY29uc3Qge3Nhc3NJbXBvcnRlcn0gPSB1c2VTYXNzSW1wb3J0ZXIob3B0aW9ucyk7XHJcblxyXG4gICAgY29uc3QgbWFrZU1vZHVsZSA9IG9wdGlvbnMuc2Fzcy5tb2R1bGVUeXBlID09PSBcInN0eWxlXCIgPyBzdHlsZU1vZHVsZSA6IGNzc1Jlc3VsdE1vZHVsZTtcclxuXHJcbiAgICBhc3luYyBmdW5jdGlvbiBzYXNzVHJhbnNmb3JtZXIoZmlsZW5hbWU6IHN0cmluZywgY29udGVudDogc3RyaW5nLCB0eXBlKTogUHJvbWlzZTxUcmFuc2Zvcm1lck91dHB1dD4ge1xyXG5cclxuICAgICAgICBjb25zdCB7Y3NzLCBzdGF0c30gPSBzYXNzLnJlbmRlclN5bmMoe1xyXG4gICAgICAgICAgICAuLi5vcHRpb25zLnNhc3MsXHJcbiAgICAgICAgICAgIGRhdGE6IGNvbnRlbnQsXHJcbiAgICAgICAgICAgIGltcG9ydGVyOiBzYXNzSW1wb3J0ZXIoZmlsZW5hbWUpXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGNvbnRlbnQgPSBjc3MudG9TdHJpbmcoXCJ1dGYtOFwiKTtcclxuICAgICAgICBpZiAodHlwZSA9PT0gXCJtb2R1bGVcIikge1xyXG4gICAgICAgICAgICBjb250ZW50ID0gbWFrZU1vZHVsZShjb250ZW50KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGxpbmtzIGlzIHVuZGVmaW5lZCBzaW5jZSBzYXNzIGhhcyBhbHJlYWR5IGluY2x1ZGVkIHRoZSBAaW1wb3J0cyBzbyBubyBuZWVkIHRvIHB1c2ggdGhlbVxyXG4gICAgICAgIC8vIHlldCB3ZSBuZWVkIHRoZSB3YXRjaCBhcnJheSB0byByZWxvYWQgdGhlIG1vZHVsZSB3aGVuIGFuIGltcG9ydGVkIGZpbGUgaGFzIGNoYW5nZWQuLi5cclxuXHJcbiAgICAgICAgY29uc3QgZGlybmFtZSA9IHBhdGguZGlybmFtZShmaWxlbmFtZSk7XHJcblxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGNvbnRlbnQ6IGNvbnRlbnQsXHJcbiAgICAgICAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAgICAgICAgIFwiY29udGVudC10eXBlXCI6IHR5cGUgPT09IFwibW9kdWxlXCIgPyBKQVZBU0NSSVBUX0NPTlRFTlRfVFlQRSA6IENTU19DT05URU5UX1RZUEUsXHJcbiAgICAgICAgICAgICAgICBcImNvbnRlbnQtbGVuZ3RoXCI6IEJ1ZmZlci5ieXRlTGVuZ3RoKGNvbnRlbnQpLFxyXG4gICAgICAgICAgICAgICAgXCJ4LXRyYW5zZm9ybWVyXCI6IFwic2Fzcy10cmFuc2Zvcm1lclwiXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGluY2x1ZGVkRmlsZXM6IHN0YXRzLmluY2x1ZGVkRmlsZXMubWFwKGluY2x1ZGVkID0+IHBhdGgucmVzb2x2ZShkaXJuYW1lLCBpbmNsdWRlZCkpXHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHNhc3NUcmFuc2Zvcm1lclxyXG4gICAgfTtcclxufSk7XHJcbiJdfQ==