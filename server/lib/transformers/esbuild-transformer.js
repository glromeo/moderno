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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXNidWlsZC10cmFuc2Zvcm1lci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90cmFuc2Zvcm1lcnMvZXNidWlsZC10cmFuc2Zvcm1lci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxxREFBNEM7QUFDNUMscUNBQXFDO0FBQ3JDLHNEQUFtRDtBQUNuRCxnRUFBb0M7QUFHcEMsbURBQTJEO0FBRzlDLFFBQUEscUJBQXFCLEdBQUcsc0JBQVEsQ0FBQyxDQUFDLE9BQXVCLEVBQUUsYUFBZ0MsTUFBTSxFQUFFLEVBQUU7SUFFOUcsTUFBTSxFQUFDLGFBQWEsRUFBQyxHQUFHLDJCQUFhLENBQUMsT0FBTyxDQUFDLENBQUM7SUFFL0MsSUFBSSxPQUFPLENBQUM7SUFDWixJQUFJLEtBQUssR0FBRyxLQUFLLElBQUksRUFBRTtRQUNuQixNQUFNLHNCQUFJLENBQUM7UUFDWCxPQUFPLE9BQU8sR0FBRyxNQUFNLHNCQUFZLEVBQUUsQ0FBQztJQUMxQyxDQUFDLENBQUM7SUFFRixLQUFLLFVBQVUsa0JBQWtCLENBQUMsUUFBZSxFQUFFLE9BQWM7UUFFN0QsSUFBSSxFQUFDLElBQUksRUFBRSxHQUFHLEVBQUMsR0FBRyxNQUFNLENBQUMsT0FBTyxJQUFJLE1BQU0sS0FBSyxFQUFFLENBQUMsQ0FBQyxTQUFTLENBQUMsT0FBTyxFQUFFO1lBQ2xFLFVBQVUsRUFBRSxRQUFRO1lBQ3BCLE1BQU0sRUFBRSxFQUFDLHNCQUFzQixFQUFFLGVBQWUsRUFBQztZQUNqRCxTQUFTLEVBQUUsUUFBUTtZQUNuQixNQUFNLEVBQUUsS0FBSztTQUNoQixDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxFQUFFO1lBQ2QsT0FBTyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUMxQixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxJQUFJLEVBQUU7WUFDUCxNQUFNLElBQUksS0FBSyxDQUFDLDRDQUE0QyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1NBQzNFO1FBRUQsSUFBSSxLQUFLLEdBQUcsSUFBSSxHQUFHLEVBQVUsQ0FBQztRQUM5QixJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsdUJBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM1QixJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsU0FBUyxHQUFXLEVBQUUsQ0FBQztRQUNsQyxLQUFLLE1BQU0sRUFBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBQyxJQUFJLE9BQU8sRUFBRTtZQUM5QixJQUFJLEVBQUUsS0FBSyxDQUFDLEVBQUU7Z0JBQ1YsU0FBUzthQUNaO1lBQ0QsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDL0IsSUFBSSxRQUFRLEdBQUcsTUFBTSxhQUFhLENBQUMsR0FBRyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQ2xELElBQUksUUFBUSxFQUFFO2dCQUNWLFNBQVMsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDbEMsU0FBUyxJQUFJLFFBQVEsQ0FBQztnQkFDdEIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQzthQUN2QjtpQkFBTTtnQkFDSCxTQUFTLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ2xDLEtBQUssQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7YUFDbEI7WUFDRCxDQUFDLEdBQUcsQ0FBQyxDQUFDO1NBQ1Q7UUFDRCxJQUFJLEdBQUcsU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFckMsT0FBTztZQUNILE9BQU8sRUFBRSxJQUFJO1lBQ2IsT0FBTyxFQUFFO2dCQUNMLGNBQWMsRUFBRSxvQ0FBdUI7Z0JBQ3ZDLGdCQUFnQixFQUFFLE1BQU0sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDO2dCQUN6QyxlQUFlLEVBQUUscUJBQXFCO2FBQ3pDO1lBQ0QsR0FBRztZQUNILEtBQUssRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDO1NBQ3BCLENBQUM7SUFDTixDQUFDO0lBRUQsT0FBTztRQUNILGtCQUFrQjtLQUNyQixDQUFDO0FBQ04sQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge2luaXQsIHBhcnNlfSBmcm9tIFwiZXMtbW9kdWxlLWxleGVyXCI7XG5pbXBvcnQge3N0YXJ0U2VydmljZX0gZnJvbSBcImVzYnVpbGRcIjtcbmltcG9ydCB7dXNlV2ViTW9kdWxlc30gZnJvbSBcIkBtb2Rlcm5vL3dlYi1tb2R1bGVzXCI7XG5pbXBvcnQgbWVtb2l6ZWQgZnJvbSBcIm5hbm8tbWVtb2l6ZVwiO1xuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCB7TW9kZXJub09wdGlvbnN9IGZyb20gXCIuLi9jb25maWd1cmVcIjtcbmltcG9ydCB7SkFWQVNDUklQVF9DT05URU5UX1RZUEV9IGZyb20gXCIuLi91dGlsL21pbWUtdHlwZXNcIjtcbmltcG9ydCB7VHJhbnNmb3JtZXJPdXRwdXR9IGZyb20gXCIuL2luZGV4XCI7XG5cbmV4cG9ydCBjb25zdCB1c2VFc0J1aWxkVHJhbnNmb3JtZXIgPSBtZW1vaXplZCgob3B0aW9uczogTW9kZXJub09wdGlvbnMsIHNvdXJjZU1hcHM6IFwiaW5saW5lXCIgfCBcImF1dG9cIiA9IFwiYXV0b1wiKSA9PiB7XG5cbiAgICBjb25zdCB7cmVzb2x2ZUltcG9ydH0gPSB1c2VXZWJNb2R1bGVzKG9wdGlvbnMpO1xuXG4gICAgbGV0IGVzYnVpbGQ7XG4gICAgbGV0IHNldHVwID0gYXN5bmMgKCkgPT4ge1xuICAgICAgICBhd2FpdCBpbml0O1xuICAgICAgICByZXR1cm4gZXNidWlsZCA9IGF3YWl0IHN0YXJ0U2VydmljZSgpO1xuICAgIH07XG5cbiAgICBhc3luYyBmdW5jdGlvbiBlc2J1aWxkVHJhbnNmb3JtZXIoZmlsZW5hbWU6c3RyaW5nLCBjb250ZW50OnN0cmluZyk6IFByb21pc2U8VHJhbnNmb3JtZXJPdXRwdXQ+IHtcblxuICAgICAgICBsZXQge2NvZGUsIG1hcH0gPSBhd2FpdCAoZXNidWlsZCB8fCBhd2FpdCBzZXR1cCgpKS50cmFuc2Zvcm0oY29udGVudCwge1xuICAgICAgICAgICAgc291cmNlZmlsZTogZmlsZW5hbWUsXG4gICAgICAgICAgICBkZWZpbmU6IHtcInByb2Nlc3MuZW52Lk5PREVfRU5WXCI6IGBcImRldmVsb3BtZW50XCJgfSxcbiAgICAgICAgICAgIHNvdXJjZW1hcDogXCJpbmxpbmVcIixcbiAgICAgICAgICAgIGxvYWRlcjogXCJ0c3hcIlxuICAgICAgICB9KS5jYXRjaChyZWFzb24gPT4ge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihyZWFzb24pO1xuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoIWNvZGUpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgZXNidWlsZCB0cmFuc2Zvcm1lciBmYWlsZWQgdG8gdHJhbnNmb3JtOiAke2ZpbGVuYW1lfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGxpbmtzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgICAgIGxldCBbaW1wb3J0c10gPSBwYXJzZShjb2RlKTtcbiAgICAgICAgbGV0IGwgPSAwLCByZXdyaXR0ZW46IHN0cmluZyA9IFwiXCI7XG4gICAgICAgIGZvciAoY29uc3Qge3MsIGUsIHNlfSBvZiBpbXBvcnRzKSB7XG4gICAgICAgICAgICBpZiAoc2UgPT09IDApIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldCB1cmwgPSBjb2RlLnN1YnN0cmluZyhzLCBlKTtcbiAgICAgICAgICAgIGxldCByZXNvbHZlZCA9IGF3YWl0IHJlc29sdmVJbXBvcnQodXJsLCBmaWxlbmFtZSk7XG4gICAgICAgICAgICBpZiAocmVzb2x2ZWQpIHtcbiAgICAgICAgICAgICAgICByZXdyaXR0ZW4gKz0gY29kZS5zdWJzdHJpbmcobCwgcyk7XG4gICAgICAgICAgICAgICAgcmV3cml0dGVuICs9IHJlc29sdmVkO1xuICAgICAgICAgICAgICAgIGxpbmtzLmFkZChyZXNvbHZlZCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJld3JpdHRlbiArPSBjb2RlLnN1YnN0cmluZyhsLCBlKTtcbiAgICAgICAgICAgICAgICBsaW5rcy5hZGQodXJsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGwgPSBlO1xuICAgICAgICB9XG4gICAgICAgIGNvZGUgPSByZXdyaXR0ZW4gKyBjb2RlLnN1YnN0cmluZyhsKTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgY29udGVudDogY29kZSxcbiAgICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgICBcImNvbnRlbnQtdHlwZVwiOiBKQVZBU0NSSVBUX0NPTlRFTlRfVFlQRSxcbiAgICAgICAgICAgICAgICBcImNvbnRlbnQtbGVuZ3RoXCI6IEJ1ZmZlci5ieXRlTGVuZ3RoKGNvZGUpLFxuICAgICAgICAgICAgICAgIFwieC10cmFuc2Zvcm1lclwiOiBcImVzYnVpbGQtdHJhbnNmb3JtZXJcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1hcCxcbiAgICAgICAgICAgIGxpbmtzOiBbLi4ubGlua3NdXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgZXNidWlsZFRyYW5zZm9ybWVyXG4gICAgfTtcbn0pO1xuIl19