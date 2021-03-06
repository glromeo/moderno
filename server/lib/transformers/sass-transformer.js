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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Fzcy10cmFuc2Zvcm1lci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90cmFuc2Zvcm1lcnMvc2Fzcy10cmFuc2Zvcm1lci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxnRUFBb0M7QUFDcEMsMERBQTZCO0FBQzdCLGdEQUF3QjtBQUV4QixtREFBNkU7QUFDN0UseURBQXNEO0FBR3RELE1BQU0sZUFBZSxHQUFHLE9BQU8sQ0FBQyxFQUFFLENBQUM7Ozs7OztFQU1qQyxPQUFPLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxNQUFNLENBQUM7Ozs7Ozs7Ozs7Ozs7O0NBY3JDLENBQUM7QUFFRixNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsRUFBRSxDQUFDOzs7Ozs7OztFQVE3QixPQUFPLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxNQUFNLENBQUM7Ozs7Q0FJckMsQ0FBQztBQUVXLFFBQUEsa0JBQWtCLEdBQUcsc0JBQVEsQ0FBQyxDQUFDLE9BQXVCLEVBQUUsRUFBRTtJQUVuRSxNQUFNLEVBQUMsWUFBWSxFQUFDLEdBQUcsK0JBQWUsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUVoRCxNQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLFVBQVUsS0FBSyxPQUFPLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsZUFBZSxDQUFDO0lBRXZGLEtBQUssVUFBVSxlQUFlLENBQUMsUUFBZ0IsRUFBRSxPQUFlLEVBQUUsSUFBSTtRQUVsRSxNQUFNLEVBQUMsR0FBRyxFQUFFLEtBQUssRUFBQyxHQUFHLG1CQUFJLENBQUMsVUFBVSxDQUFDO1lBQ2pDLEdBQUcsT0FBTyxDQUFDLElBQUk7WUFDZixJQUFJLEVBQUUsT0FBTztZQUNiLFFBQVEsRUFBRSxZQUFZLENBQUMsUUFBUSxDQUFDO1NBQ25DLENBQUMsQ0FBQztRQUVILE9BQU8sR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ2hDLElBQUksSUFBSSxLQUFLLFFBQVEsRUFBRTtZQUNuQixPQUFPLEdBQUcsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1NBQ2pDO1FBRUQsMEZBQTBGO1FBQzFGLHdGQUF3RjtRQUV4RixNQUFNLE9BQU8sR0FBRyxjQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBRXZDLE9BQU87WUFDSCxPQUFPLEVBQUUsT0FBTztZQUNoQixPQUFPLEVBQUU7Z0JBQ0wsY0FBYyxFQUFFLElBQUksS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLG9DQUF1QixDQUFDLENBQUMsQ0FBQyw2QkFBZ0I7Z0JBQzlFLGdCQUFnQixFQUFFLE1BQU0sQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDO2dCQUM1QyxlQUFlLEVBQUUsa0JBQWtCO2FBQ3RDO1lBQ0QsYUFBYSxFQUFFLEtBQUssQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsY0FBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUM7U0FDdEYsQ0FBQztJQUNOLENBQUM7SUFFRCxPQUFPO1FBQ0gsZUFBZTtLQUNsQixDQUFDO0FBQ04sQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgbWVtb2l6ZWQgZnJvbSBcIm5hbm8tbWVtb2l6ZVwiO1xuaW1wb3J0IHNhc3MgZnJvbSBcIm5vZGUtc2Fzc1wiO1xuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCB7TW9kZXJub09wdGlvbnN9IGZyb20gXCIuLi9jb25maWd1cmVcIjtcbmltcG9ydCB7Q1NTX0NPTlRFTlRfVFlQRSwgSkFWQVNDUklQVF9DT05URU5UX1RZUEV9IGZyb20gXCIuLi91dGlsL21pbWUtdHlwZXNcIjtcbmltcG9ydCB7dXNlU2Fzc0ltcG9ydGVyfSBmcm9tIFwiLi4vdXRpbC9zYXNzLWltcG9ydGVyXCI7XG5pbXBvcnQge1RyYW5zZm9ybWVyT3V0cHV0fSBmcm9tIFwiLi9pbmRleFwiO1xuXG5jb25zdCBjc3NSZXN1bHRNb2R1bGUgPSBjc3NUZXh0ID0+IGAvLyBbSE1SXSBVcGRhdGUgQ1NTUmVzdWx0XG5pbXBvcnQge2NyZWF0ZUhvdENvbnRleHR9IGZyb20gXCIvbW9kZXJuby9icm93c2VyLXRvb2xraXQuanNcIjsgXG5pbXBvcnQubWV0YS5ob3QgPSBjcmVhdGVIb3RDb250ZXh0KGltcG9ydC5tZXRhLnVybCk7XG5cbmltcG9ydCB7Y3NzfSBmcm9tIFwiL3dlYl9tb2R1bGVzL2xpdC1lbGVtZW50LmpzXCI7XG5jb25zdCBjc3NSZXN1bHQgPSBjc3NcXGBcbiR7Y3NzVGV4dC5yZXBsYWNlKC8oWyRgXFxcXF0pL2csIFwiXFxcXCQxXCIpfVxcYDtcbmV4cG9ydCBkZWZhdWx0IGNzc1Jlc3VsdDsgXG5cbi8vIEV2ZW4gbmV3IGN1c3RvbSBlbGVtZW50IGluc3RhbmNlcyB3b3VsZCB1c2UgdGhlIG9yaWdpbmFsIGNzc1Jlc3VsdCBpbnN0YW5jZVxuXG5pbXBvcnQubWV0YS5ob3QuZGlzcG9zZSgoKSA9PiB7XG4gICAgcmV0dXJuIGltcG9ydC5tZXRhLmhvdC5jc3NSZXN1bHQgfHwgY3NzUmVzdWx0O1xufSk7XG5cbmltcG9ydC5tZXRhLmhvdC5hY2NlcHQoKHttb2R1bGUsIHJlY3ljbGVkOiBjc3NSZXN1bHR9KSA9PiB7XG4gICAgaW1wb3J0Lm1ldGEuaG90LmNzc1Jlc3VsdCA9IGNzc1Jlc3VsdDtcbiAgICBjc3NSZXN1bHQuY3NzVGV4dCA9IG1vZHVsZS5kZWZhdWx0LmNzc1RleHQ7XG4gICAgY3NzUmVzdWx0LnN0eWxlU2hlZXQucmVwbGFjZVN5bmMobW9kdWxlLmRlZmF1bHQuY3NzVGV4dCk7XG59KTtcbmA7XG5cbmNvbnN0IHN0eWxlTW9kdWxlID0gY3NzVGV4dCA9PiBgLy8gW0hNUl0gUmVsb2FkIFN0eWxlXG5pbXBvcnQge2NyZWF0ZUhvdENvbnRleHR9IGZyb20gXCIvbW9kZXJuby9icm93c2VyLXRvb2xraXQuanNcIjsgXG5pbXBvcnQubWV0YS5ob3QgPSBjcmVhdGVIb3RDb250ZXh0KGltcG9ydC5tZXRhLnVybCk7XG5cbmNvbnN0IHN0eWxlRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzdHlsZVwiKTtcbmRvY3VtZW50LmhlYWRcbiAgICAuYXBwZW5kQ2hpbGQoc3R5bGVFbGVtZW50KVxuICAgIC5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShcXGBcbiR7Y3NzVGV4dC5yZXBsYWNlKC8oWyRgXFxcXF0pL2csIFwiXFxcXCQxXCIpfVxcYCkpO1xuXG5pbXBvcnQubWV0YS5ob3QuZGlzcG9zZSgoKSA9PiBkb2N1bWVudC5oZWFkLnJlbW92ZUNoaWxkKHN0eWxlRWxlbWVudCkpO1xuaW1wb3J0Lm1ldGEuaG90LmFjY2VwdCh0cnVlKTtcbmA7XG5cbmV4cG9ydCBjb25zdCB1c2VTYXNzVHJhbnNmb3JtZXIgPSBtZW1vaXplZCgob3B0aW9uczogTW9kZXJub09wdGlvbnMpID0+IHtcblxuICAgIGNvbnN0IHtzYXNzSW1wb3J0ZXJ9ID0gdXNlU2Fzc0ltcG9ydGVyKG9wdGlvbnMpO1xuXG4gICAgY29uc3QgbWFrZU1vZHVsZSA9IG9wdGlvbnMuc2Fzcy5tb2R1bGVUeXBlID09PSBcInN0eWxlXCIgPyBzdHlsZU1vZHVsZSA6IGNzc1Jlc3VsdE1vZHVsZTtcblxuICAgIGFzeW5jIGZ1bmN0aW9uIHNhc3NUcmFuc2Zvcm1lcihmaWxlbmFtZTogc3RyaW5nLCBjb250ZW50OiBzdHJpbmcsIHR5cGUpOiBQcm9taXNlPFRyYW5zZm9ybWVyT3V0cHV0PiB7XG5cbiAgICAgICAgY29uc3Qge2Nzcywgc3RhdHN9ID0gc2Fzcy5yZW5kZXJTeW5jKHtcbiAgICAgICAgICAgIC4uLm9wdGlvbnMuc2FzcyxcbiAgICAgICAgICAgIGRhdGE6IGNvbnRlbnQsXG4gICAgICAgICAgICBpbXBvcnRlcjogc2Fzc0ltcG9ydGVyKGZpbGVuYW1lKVxuICAgICAgICB9KTtcblxuICAgICAgICBjb250ZW50ID0gY3NzLnRvU3RyaW5nKFwidXRmLThcIik7XG4gICAgICAgIGlmICh0eXBlID09PSBcIm1vZHVsZVwiKSB7XG4gICAgICAgICAgICBjb250ZW50ID0gbWFrZU1vZHVsZShjb250ZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGxpbmtzIGlzIHVuZGVmaW5lZCBzaW5jZSBzYXNzIGhhcyBhbHJlYWR5IGluY2x1ZGVkIHRoZSBAaW1wb3J0cyBzbyBubyBuZWVkIHRvIHB1c2ggdGhlbVxuICAgICAgICAvLyB5ZXQgd2UgbmVlZCB0aGUgd2F0Y2ggYXJyYXkgdG8gcmVsb2FkIHRoZSBtb2R1bGUgd2hlbiBhbiBpbXBvcnRlZCBmaWxlIGhhcyBjaGFuZ2VkLi4uXG5cbiAgICAgICAgY29uc3QgZGlybmFtZSA9IHBhdGguZGlybmFtZShmaWxlbmFtZSk7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGNvbnRlbnQ6IGNvbnRlbnQsXG4gICAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAgICAgXCJjb250ZW50LXR5cGVcIjogdHlwZSA9PT0gXCJtb2R1bGVcIiA/IEpBVkFTQ1JJUFRfQ09OVEVOVF9UWVBFIDogQ1NTX0NPTlRFTlRfVFlQRSxcbiAgICAgICAgICAgICAgICBcImNvbnRlbnQtbGVuZ3RoXCI6IEJ1ZmZlci5ieXRlTGVuZ3RoKGNvbnRlbnQpLFxuICAgICAgICAgICAgICAgIFwieC10cmFuc2Zvcm1lclwiOiBcInNhc3MtdHJhbnNmb3JtZXJcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGluY2x1ZGVkRmlsZXM6IHN0YXRzLmluY2x1ZGVkRmlsZXMubWFwKGluY2x1ZGVkID0+IHBhdGgucmVzb2x2ZShkaXJuYW1lLCBpbmNsdWRlZCkpXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgc2Fzc1RyYW5zZm9ybWVyXG4gICAgfTtcbn0pO1xuIl19