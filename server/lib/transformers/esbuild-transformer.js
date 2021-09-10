"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useEsBuildTransformer = void 0;
const es_module_lexer_1 = require("es-module-lexer");
const esbuild_1 = __importDefault(require("esbuild"));
const web_modules_1 = require("@moderno/web-modules");
const nano_memoize_1 = __importDefault(require("nano-memoize"));
const mime_types_1 = require("../util/mime-types");
exports.useEsBuildTransformer = nano_memoize_1.default((options, sourceMaps = "auto") => {
    const { resolveImport } = web_modules_1.useWebModules(options);
    async function esbuildTransformer(filename, content) {
        let { code, map } = await esbuild_1.default.transform(content, {
            sourcefile: filename,
            define: { "process.env.NODE_ENV": `"development"` },
            sourcemap: "inline",
            loader: "tsx"
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
            map: JSON.parse(map),
            links: [...links]
        };
    }
    return {
        esbuildTransformer
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXNidWlsZC10cmFuc2Zvcm1lci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90cmFuc2Zvcm1lcnMvZXNidWlsZC10cmFuc2Zvcm1lci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxxREFBNEM7QUFDNUMsc0RBQThCO0FBQzlCLHNEQUFtRDtBQUNuRCxnRUFBb0M7QUFFcEMsbURBQTJEO0FBRzlDLFFBQUEscUJBQXFCLEdBQUcsc0JBQVEsQ0FBQyxDQUFDLE9BQXVCLEVBQUUsYUFBZ0MsTUFBTSxFQUFFLEVBQUU7SUFFOUcsTUFBTSxFQUFDLGFBQWEsRUFBQyxHQUFHLDJCQUFhLENBQUMsT0FBTyxDQUFDLENBQUM7SUFFL0MsS0FBSyxVQUFVLGtCQUFrQixDQUFDLFFBQWUsRUFBRSxPQUFjO1FBRTdELElBQUksRUFBQyxJQUFJLEVBQUUsR0FBRyxFQUFDLEdBQUcsTUFBTSxpQkFBTyxDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUU7WUFDL0MsVUFBVSxFQUFFLFFBQVE7WUFDcEIsTUFBTSxFQUFFLEVBQUMsc0JBQXNCLEVBQUUsZUFBZSxFQUFDO1lBQ2pELFNBQVMsRUFBRSxRQUFRO1lBQ25CLE1BQU0sRUFBRSxLQUFLO1NBQ2hCLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxJQUFJLEVBQUU7WUFDUCxNQUFNLElBQUksS0FBSyxDQUFDLDRDQUE0QyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1NBQzNFO1FBRUQsSUFBSSxLQUFLLEdBQUcsSUFBSSxHQUFHLEVBQVUsQ0FBQztRQUM5QixJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsdUJBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM1QixJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsU0FBUyxHQUFXLEVBQUUsQ0FBQztRQUNsQyxLQUFLLE1BQU0sRUFBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBQyxJQUFJLE9BQU8sRUFBRTtZQUM5QixJQUFJLEVBQUUsS0FBSyxDQUFDLEVBQUU7Z0JBQ1YsU0FBUzthQUNaO1lBQ0QsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDL0IsSUFBSSxRQUFRLEdBQUcsTUFBTSxhQUFhLENBQUMsR0FBRyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQ2xELElBQUksUUFBUSxFQUFFO2dCQUNWLFNBQVMsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDbEMsU0FBUyxJQUFJLFFBQVEsQ0FBQztnQkFDdEIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQzthQUN2QjtpQkFBTTtnQkFDSCxTQUFTLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ2xDLEtBQUssQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7YUFDbEI7WUFDRCxDQUFDLEdBQUcsQ0FBQyxDQUFDO1NBQ1Q7UUFDRCxJQUFJLEdBQUcsU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFckMsT0FBTztZQUNILE9BQU8sRUFBRSxJQUFJO1lBQ2IsT0FBTyxFQUFFO2dCQUNMLGNBQWMsRUFBRSxvQ0FBdUI7Z0JBQ3ZDLGdCQUFnQixFQUFFLE1BQU0sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDO2dCQUN6QyxlQUFlLEVBQUUscUJBQXFCO2FBQ3pDO1lBQ0QsR0FBRyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDO1lBQ3BCLEtBQUssRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDO1NBQ3BCLENBQUM7SUFDTixDQUFDO0lBRUQsT0FBTztRQUNILGtCQUFrQjtLQUNyQixDQUFDO0FBQ04sQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge2luaXQsIHBhcnNlfSBmcm9tIFwiZXMtbW9kdWxlLWxleGVyXCI7XHJcbmltcG9ydCBlc2J1aWxkIGZyb20gXCJlc2J1aWxkXCI7XHJcbmltcG9ydCB7dXNlV2ViTW9kdWxlc30gZnJvbSBcIkBtb2Rlcm5vL3dlYi1tb2R1bGVzXCI7XHJcbmltcG9ydCBtZW1vaXplZCBmcm9tIFwibmFuby1tZW1vaXplXCI7XHJcbmltcG9ydCB7TW9kZXJub09wdGlvbnN9IGZyb20gXCIuLi9jb25maWd1cmVcIjtcclxuaW1wb3J0IHtKQVZBU0NSSVBUX0NPTlRFTlRfVFlQRX0gZnJvbSBcIi4uL3V0aWwvbWltZS10eXBlc1wiO1xyXG5pbXBvcnQge1RyYW5zZm9ybWVyT3V0cHV0fSBmcm9tIFwiLi9pbmRleFwiO1xyXG5cclxuZXhwb3J0IGNvbnN0IHVzZUVzQnVpbGRUcmFuc2Zvcm1lciA9IG1lbW9pemVkKChvcHRpb25zOiBNb2Rlcm5vT3B0aW9ucywgc291cmNlTWFwczogXCJpbmxpbmVcIiB8IFwiYXV0b1wiID0gXCJhdXRvXCIpID0+IHtcclxuXHJcbiAgICBjb25zdCB7cmVzb2x2ZUltcG9ydH0gPSB1c2VXZWJNb2R1bGVzKG9wdGlvbnMpO1xyXG5cclxuICAgIGFzeW5jIGZ1bmN0aW9uIGVzYnVpbGRUcmFuc2Zvcm1lcihmaWxlbmFtZTpzdHJpbmcsIGNvbnRlbnQ6c3RyaW5nKTogUHJvbWlzZTxUcmFuc2Zvcm1lck91dHB1dD4ge1xyXG5cclxuICAgICAgICBsZXQge2NvZGUsIG1hcH0gPSBhd2FpdCBlc2J1aWxkLnRyYW5zZm9ybShjb250ZW50LCB7XHJcbiAgICAgICAgICAgIHNvdXJjZWZpbGU6IGZpbGVuYW1lLFxyXG4gICAgICAgICAgICBkZWZpbmU6IHtcInByb2Nlc3MuZW52Lk5PREVfRU5WXCI6IGBcImRldmVsb3BtZW50XCJgfSxcclxuICAgICAgICAgICAgc291cmNlbWFwOiBcImlubGluZVwiLFxyXG4gICAgICAgICAgICBsb2FkZXI6IFwidHN4XCJcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgaWYgKCFjb2RlKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgZXNidWlsZCB0cmFuc2Zvcm1lciBmYWlsZWQgdG8gdHJhbnNmb3JtOiAke2ZpbGVuYW1lfWApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGxpbmtzID0gbmV3IFNldDxzdHJpbmc+KCk7XHJcbiAgICAgICAgbGV0IFtpbXBvcnRzXSA9IHBhcnNlKGNvZGUpO1xyXG4gICAgICAgIGxldCBsID0gMCwgcmV3cml0dGVuOiBzdHJpbmcgPSBcIlwiO1xyXG4gICAgICAgIGZvciAoY29uc3Qge3MsIGUsIHNlfSBvZiBpbXBvcnRzKSB7XHJcbiAgICAgICAgICAgIGlmIChzZSA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgbGV0IHVybCA9IGNvZGUuc3Vic3RyaW5nKHMsIGUpO1xyXG4gICAgICAgICAgICBsZXQgcmVzb2x2ZWQgPSBhd2FpdCByZXNvbHZlSW1wb3J0KHVybCwgZmlsZW5hbWUpO1xyXG4gICAgICAgICAgICBpZiAocmVzb2x2ZWQpIHtcclxuICAgICAgICAgICAgICAgIHJld3JpdHRlbiArPSBjb2RlLnN1YnN0cmluZyhsLCBzKTtcclxuICAgICAgICAgICAgICAgIHJld3JpdHRlbiArPSByZXNvbHZlZDtcclxuICAgICAgICAgICAgICAgIGxpbmtzLmFkZChyZXNvbHZlZCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXdyaXR0ZW4gKz0gY29kZS5zdWJzdHJpbmcobCwgZSk7XHJcbiAgICAgICAgICAgICAgICBsaW5rcy5hZGQodXJsKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBsID0gZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29kZSA9IHJld3JpdHRlbiArIGNvZGUuc3Vic3RyaW5nKGwpO1xyXG5cclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBjb250ZW50OiBjb2RlLFxyXG4gICAgICAgICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgICAgICAgICBcImNvbnRlbnQtdHlwZVwiOiBKQVZBU0NSSVBUX0NPTlRFTlRfVFlQRSxcclxuICAgICAgICAgICAgICAgIFwiY29udGVudC1sZW5ndGhcIjogQnVmZmVyLmJ5dGVMZW5ndGgoY29kZSksXHJcbiAgICAgICAgICAgICAgICBcIngtdHJhbnNmb3JtZXJcIjogXCJlc2J1aWxkLXRyYW5zZm9ybWVyXCJcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgbWFwOiBKU09OLnBhcnNlKG1hcCksXHJcbiAgICAgICAgICAgIGxpbmtzOiBbLi4ubGlua3NdXHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGVzYnVpbGRUcmFuc2Zvcm1lclxyXG4gICAgfTtcclxufSk7XHJcbiJdfQ==