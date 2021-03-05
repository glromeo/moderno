"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useEsBuildTransformer = void 0;
const es_module_lexer_1 = require("es-module-lexer");
const esbuild_1 = require("esbuild");
const web_modules_1 = require("@moderno/web-modules");
const nano_memoize_1 = __importDefault(require("nano-memoize"));
const mime_types_1 = require("../util/mime-types");
exports.useEsBuildTransformer = nano_memoize_1.default((options, sourceMaps = "auto") => {
    const { resolveImport } = web_modules_1.useWebModules(options);
    let esbuild;
    let setup = async () => {
        await es_module_lexer_1.init;
        return esbuild = await esbuild_1.startService();
    };
    async function esbuildTransformer(filename, content) {
        let { code, map } = await (esbuild || await setup()).transform(content, {
            sourcefile: filename,
            define: { "process.env.NODE_ENV": `"development"` },
            sourcemap: "inline",
            loader: "tsx"
        }).catch(reason => {
            console.error(reason);
        });
        if (!code) {
            throw new Error(`esbuild transformer failed to transform: ${filename}`);
        }
        let links = new Set();
        let [imports] = es_module_lexer_1.parse(code);
        let l = 0, rewritten = "";
        for (const { s, e, se } of imports) {
            if (se === 0) {
                continue;
            }
            let url = code.substring(s, e);
            let resolved = await resolveImport(url, filename);
            if (resolved) {
                rewritten += code.substring(l, s);
                rewritten += resolved;
                links.add(resolved);
            }
            else {
                rewritten += code.substring(l, e);
                links.add(url);
            }
            l = e;
        }
        code = rewritten + code.substring(l);
        return {
            content: code,
            headers: {
                "content-type": mime_types_1.JAVASCRIPT_CONTENT_TYPE,
                "content-length": Buffer.byteLength(code),
                "x-transformer": "esbuild-transformer"
            },
            map,
            links: [...links]
        };
    }
    return {
        esbuildTransformer
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXNidWlsZC10cmFuc2Zvcm1lci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90cmFuc2Zvcm1lcnMvZXNidWlsZC10cmFuc2Zvcm1lci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxxREFBNEM7QUFDNUMscUNBQXFDO0FBQ3JDLHNEQUFtRDtBQUNuRCxnRUFBb0M7QUFHcEMsbURBQTJEO0FBRzlDLFFBQUEscUJBQXFCLEdBQUcsc0JBQVEsQ0FBQyxDQUFDLE9BQXVCLEVBQUUsYUFBZ0MsTUFBTSxFQUFFLEVBQUU7SUFFOUcsTUFBTSxFQUFDLGFBQWEsRUFBQyxHQUFHLDJCQUFhLENBQUMsT0FBTyxDQUFDLENBQUM7SUFFL0MsSUFBSSxPQUFPLENBQUM7SUFDWixJQUFJLEtBQUssR0FBRyxLQUFLLElBQUksRUFBRTtRQUNuQixNQUFNLHNCQUFJLENBQUM7UUFDWCxPQUFPLE9BQU8sR0FBRyxNQUFNLHNCQUFZLEVBQUUsQ0FBQztJQUMxQyxDQUFDLENBQUM7SUFFRixLQUFLLFVBQVUsa0JBQWtCLENBQUMsUUFBZSxFQUFFLE9BQWM7UUFFN0QsSUFBSSxFQUFDLElBQUksRUFBRSxHQUFHLEVBQUMsR0FBRyxNQUFNLENBQUMsT0FBTyxJQUFJLE1BQU0sS0FBSyxFQUFFLENBQUMsQ0FBQyxTQUFTLENBQUMsT0FBTyxFQUFFO1lBQ2xFLFVBQVUsRUFBRSxRQUFRO1lBQ3BCLE1BQU0sRUFBRSxFQUFDLHNCQUFzQixFQUFFLGVBQWUsRUFBQztZQUNqRCxTQUFTLEVBQUUsUUFBUTtZQUNuQixNQUFNLEVBQUUsS0FBSztTQUNoQixDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxFQUFFO1lBQ2QsT0FBTyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUMxQixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxJQUFJLEVBQUU7WUFDUCxNQUFNLElBQUksS0FBSyxDQUFDLDRDQUE0QyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1NBQzNFO1FBRUQsSUFBSSxLQUFLLEdBQUcsSUFBSSxHQUFHLEVBQVUsQ0FBQztRQUM5QixJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsdUJBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM1QixJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsU0FBUyxHQUFXLEVBQUUsQ0FBQztRQUNsQyxLQUFLLE1BQU0sRUFBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBQyxJQUFJLE9BQU8sRUFBRTtZQUM5QixJQUFJLEVBQUUsS0FBSyxDQUFDLEVBQUU7Z0JBQ1YsU0FBUzthQUNaO1lBQ0QsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDL0IsSUFBSSxRQUFRLEdBQUcsTUFBTSxhQUFhLENBQUMsR0FBRyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQ2xELElBQUksUUFBUSxFQUFFO2dCQUNWLFNBQVMsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDbEMsU0FBUyxJQUFJLFFBQVEsQ0FBQztnQkFDdEIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQzthQUN2QjtpQkFBTTtnQkFDSCxTQUFTLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ2xDLEtBQUssQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7YUFDbEI7WUFDRCxDQUFDLEdBQUcsQ0FBQyxDQUFDO1NBQ1Q7UUFDRCxJQUFJLEdBQUcsU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFckMsT0FBTztZQUNILE9BQU8sRUFBRSxJQUFJO1lBQ2IsT0FBTyxFQUFFO2dCQUNMLGNBQWMsRUFBRSxvQ0FBdUI7Z0JBQ3ZDLGdCQUFnQixFQUFFLE1BQU0sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDO2dCQUN6QyxlQUFlLEVBQUUscUJBQXFCO2FBQ3pDO1lBQ0QsR0FBRztZQUNILEtBQUssRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDO1NBQ3BCLENBQUM7SUFDTixDQUFDO0lBRUQsT0FBTztRQUNILGtCQUFrQjtLQUNyQixDQUFDO0FBQ04sQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge2luaXQsIHBhcnNlfSBmcm9tIFwiZXMtbW9kdWxlLWxleGVyXCI7XHJcbmltcG9ydCB7c3RhcnRTZXJ2aWNlfSBmcm9tIFwiZXNidWlsZFwiO1xyXG5pbXBvcnQge3VzZVdlYk1vZHVsZXN9IGZyb20gXCJAbW9kZXJuby93ZWItbW9kdWxlc1wiO1xyXG5pbXBvcnQgbWVtb2l6ZWQgZnJvbSBcIm5hbm8tbWVtb2l6ZVwiO1xyXG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xyXG5pbXBvcnQge01vZGVybm9PcHRpb25zfSBmcm9tIFwiLi4vY29uZmlndXJlXCI7XHJcbmltcG9ydCB7SkFWQVNDUklQVF9DT05URU5UX1RZUEV9IGZyb20gXCIuLi91dGlsL21pbWUtdHlwZXNcIjtcclxuaW1wb3J0IHtUcmFuc2Zvcm1lck91dHB1dH0gZnJvbSBcIi4vaW5kZXhcIjtcclxuXHJcbmV4cG9ydCBjb25zdCB1c2VFc0J1aWxkVHJhbnNmb3JtZXIgPSBtZW1vaXplZCgob3B0aW9uczogTW9kZXJub09wdGlvbnMsIHNvdXJjZU1hcHM6IFwiaW5saW5lXCIgfCBcImF1dG9cIiA9IFwiYXV0b1wiKSA9PiB7XHJcblxyXG4gICAgY29uc3Qge3Jlc29sdmVJbXBvcnR9ID0gdXNlV2ViTW9kdWxlcyhvcHRpb25zKTtcclxuXHJcbiAgICBsZXQgZXNidWlsZDtcclxuICAgIGxldCBzZXR1cCA9IGFzeW5jICgpID0+IHtcclxuICAgICAgICBhd2FpdCBpbml0O1xyXG4gICAgICAgIHJldHVybiBlc2J1aWxkID0gYXdhaXQgc3RhcnRTZXJ2aWNlKCk7XHJcbiAgICB9O1xyXG5cclxuICAgIGFzeW5jIGZ1bmN0aW9uIGVzYnVpbGRUcmFuc2Zvcm1lcihmaWxlbmFtZTpzdHJpbmcsIGNvbnRlbnQ6c3RyaW5nKTogUHJvbWlzZTxUcmFuc2Zvcm1lck91dHB1dD4ge1xyXG5cclxuICAgICAgICBsZXQge2NvZGUsIG1hcH0gPSBhd2FpdCAoZXNidWlsZCB8fCBhd2FpdCBzZXR1cCgpKS50cmFuc2Zvcm0oY29udGVudCwge1xyXG4gICAgICAgICAgICBzb3VyY2VmaWxlOiBmaWxlbmFtZSxcclxuICAgICAgICAgICAgZGVmaW5lOiB7XCJwcm9jZXNzLmVudi5OT0RFX0VOVlwiOiBgXCJkZXZlbG9wbWVudFwiYH0sXHJcbiAgICAgICAgICAgIHNvdXJjZW1hcDogXCJpbmxpbmVcIixcclxuICAgICAgICAgICAgbG9hZGVyOiBcInRzeFwiXHJcbiAgICAgICAgfSkuY2F0Y2gocmVhc29uID0+IHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihyZWFzb24pO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBpZiAoIWNvZGUpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBlc2J1aWxkIHRyYW5zZm9ybWVyIGZhaWxlZCB0byB0cmFuc2Zvcm06ICR7ZmlsZW5hbWV9YCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgbGlua3MgPSBuZXcgU2V0PHN0cmluZz4oKTtcclxuICAgICAgICBsZXQgW2ltcG9ydHNdID0gcGFyc2UoY29kZSk7XHJcbiAgICAgICAgbGV0IGwgPSAwLCByZXdyaXR0ZW46IHN0cmluZyA9IFwiXCI7XHJcbiAgICAgICAgZm9yIChjb25zdCB7cywgZSwgc2V9IG9mIGltcG9ydHMpIHtcclxuICAgICAgICAgICAgaWYgKHNlID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBsZXQgdXJsID0gY29kZS5zdWJzdHJpbmcocywgZSk7XHJcbiAgICAgICAgICAgIGxldCByZXNvbHZlZCA9IGF3YWl0IHJlc29sdmVJbXBvcnQodXJsLCBmaWxlbmFtZSk7XHJcbiAgICAgICAgICAgIGlmIChyZXNvbHZlZCkge1xyXG4gICAgICAgICAgICAgICAgcmV3cml0dGVuICs9IGNvZGUuc3Vic3RyaW5nKGwsIHMpO1xyXG4gICAgICAgICAgICAgICAgcmV3cml0dGVuICs9IHJlc29sdmVkO1xyXG4gICAgICAgICAgICAgICAgbGlua3MuYWRkKHJlc29sdmVkKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHJld3JpdHRlbiArPSBjb2RlLnN1YnN0cmluZyhsLCBlKTtcclxuICAgICAgICAgICAgICAgIGxpbmtzLmFkZCh1cmwpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGwgPSBlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb2RlID0gcmV3cml0dGVuICsgY29kZS5zdWJzdHJpbmcobCk7XHJcblxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGNvbnRlbnQ6IGNvZGUsXHJcbiAgICAgICAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAgICAgICAgIFwiY29udGVudC10eXBlXCI6IEpBVkFTQ1JJUFRfQ09OVEVOVF9UWVBFLFxyXG4gICAgICAgICAgICAgICAgXCJjb250ZW50LWxlbmd0aFwiOiBCdWZmZXIuYnl0ZUxlbmd0aChjb2RlKSxcclxuICAgICAgICAgICAgICAgIFwieC10cmFuc2Zvcm1lclwiOiBcImVzYnVpbGQtdHJhbnNmb3JtZXJcIlxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBtYXAsXHJcbiAgICAgICAgICAgIGxpbmtzOiBbLi4ubGlua3NdXHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGVzYnVpbGRUcmFuc2Zvcm1lclxyXG4gICAgfTtcclxufSk7XHJcbiJdfQ==