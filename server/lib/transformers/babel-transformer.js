"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useBabelTransformer = void 0;
const core_1 = require("@babel/core");
const web_modules_1 = require("@moderno/web-modules");
const nano_memoize_1 = __importDefault(require("nano-memoize"));
const path_1 = __importDefault(require("path"));
const mime_types_1 = require("../util/mime-types");
exports.useBabelTransformer = nano_memoize_1.default((options, sourceMaps = "auto") => {
    const { resolveImports, rewriteImports } = web_modules_1.useWebModulesPlugin(options);
    const preProcess = options.transform && options.transform.preProcess;
    async function babelTransformer(filename, content) {
        const babelOptions = {
            ...options.babel,
            sourceMaps: sourceMaps === "auto" ? options.babel.sourceMaps : options.babel.sourceMaps && "inline",
            babelrc: true,
            filename: filename
        };
        const source = preProcess ? preProcess(filename, content) : content;
        const parsedAst = core_1.parseSync(source, babelOptions);
        const importMap = await resolveImports(filename, parsedAst);
        let { code, map, metadata } = core_1.transformFromAstSync(parsedAst, source, {
            ...babelOptions,
            plugins: [
                ...babelOptions.plugins,
                [rewriteImports, { importMap }]
            ]
        });
        if (!code) {
            throw new Error(`Babel transformer failed to transform: ${filename}`);
        }
        if (map) {
            code += "\n//# sourceMappingURL=" + path_1.default.basename(filename) + ".map\n";
        }
        else {
            code += "\n";
        }
        return {
            content: code,
            headers: {
                "content-type": mime_types_1.JAVASCRIPT_CONTENT_TYPE,
                "content-length": Buffer.byteLength(code),
                "x-transformer": "babel-transformer"
            },
            map,
            links: [...metadata["imports"]]
        };
    }
    return {
        babelTransformer
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFiZWwtdHJhbnNmb3JtZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvdHJhbnNmb3JtZXJzL2JhYmVsLXRyYW5zZm9ybWVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLHNDQUE4RTtBQUM5RSxzREFBeUQ7QUFDekQsZ0VBQW9DO0FBQ3BDLGdEQUF3QjtBQUV4QixtREFBMkQ7QUFHOUMsUUFBQSxtQkFBbUIsR0FBRyxzQkFBUSxDQUFDLENBQUMsT0FBdUIsRUFBRSxhQUFnQyxNQUFNLEVBQUUsRUFBRTtJQUU1RyxNQUFNLEVBQUMsY0FBYyxFQUFFLGNBQWMsRUFBQyxHQUFHLGlDQUFtQixDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBRXRFLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxTQUFTLElBQUksT0FBTyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUM7SUFFckUsS0FBSyxVQUFVLGdCQUFnQixDQUFDLFFBQWUsRUFBRSxPQUFjO1FBRTNELE1BQU0sWUFBWSxHQUFxQjtZQUNuQyxHQUFHLE9BQU8sQ0FBQyxLQUFLO1lBQ2hCLFVBQVUsRUFBRSxVQUFVLEtBQUssTUFBTSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxVQUFVLElBQUksUUFBUTtZQUNuRyxPQUFPLEVBQUUsSUFBSTtZQUNiLFFBQVEsRUFBRSxRQUFRO1NBQ3JCLENBQUM7UUFFRixNQUFNLE1BQU0sR0FBRyxVQUFVLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQztRQUNwRSxNQUFNLFNBQVMsR0FBRyxnQkFBUyxDQUFDLE1BQU0sRUFBRSxZQUFZLENBQUUsQ0FBQztRQUNuRCxNQUFNLFNBQVMsR0FBRyxNQUFNLGNBQWMsQ0FBQyxRQUFRLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFFNUQsSUFBSSxFQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsUUFBUSxFQUFDLEdBQUcsMkJBQW9CLENBQUMsU0FBUyxFQUFFLE1BQU0sRUFBRTtZQUNoRSxHQUFHLFlBQVk7WUFDZixPQUFPLEVBQUU7Z0JBQ0wsR0FBRyxZQUFZLENBQUMsT0FBUTtnQkFDeEIsQ0FBQyxjQUFjLEVBQUUsRUFBQyxTQUFTLEVBQUMsQ0FBQzthQUNoQztTQUNKLENBQUUsQ0FBQztRQUVKLElBQUksQ0FBQyxJQUFJLEVBQUU7WUFDUCxNQUFNLElBQUksS0FBSyxDQUFDLDBDQUEwQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1NBQ3pFO1FBRUQsSUFBSSxHQUFHLEVBQUU7WUFDTCxJQUFJLElBQUkseUJBQXlCLEdBQUcsY0FBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsR0FBRyxRQUFRLENBQUM7U0FDMUU7YUFBTTtZQUNILElBQUksSUFBSSxJQUFJLENBQUM7U0FDaEI7UUFFRCxPQUFPO1lBQ0gsT0FBTyxFQUFFLElBQUk7WUFDYixPQUFPLEVBQUU7Z0JBQ0wsY0FBYyxFQUFFLG9DQUF1QjtnQkFDdkMsZ0JBQWdCLEVBQUUsTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUM7Z0JBQ3pDLGVBQWUsRUFBRSxtQkFBbUI7YUFDdkM7WUFDRCxHQUFHO1lBQ0gsS0FBSyxFQUFFLENBQUMsR0FBRyxRQUFTLENBQUMsU0FBUyxDQUFDLENBQUM7U0FDbkMsQ0FBQztJQUNOLENBQUM7SUFFRCxPQUFPO1FBQ0gsZ0JBQWdCO0tBQ25CLENBQUM7QUFDTixDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7cGFyc2VTeW5jLCB0cmFuc2Zvcm1Gcm9tQXN0U3luYywgVHJhbnNmb3JtT3B0aW9uc30gZnJvbSBcIkBiYWJlbC9jb3JlXCI7XHJcbmltcG9ydCB7dXNlV2ViTW9kdWxlc1BsdWdpbn0gZnJvbSBcIkBtb2Rlcm5vL3dlYi1tb2R1bGVzXCI7XHJcbmltcG9ydCBtZW1vaXplZCBmcm9tIFwibmFuby1tZW1vaXplXCI7XHJcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XHJcbmltcG9ydCB7TW9kZXJub09wdGlvbnN9IGZyb20gXCIuLi9jb25maWd1cmVcIjtcclxuaW1wb3J0IHtKQVZBU0NSSVBUX0NPTlRFTlRfVFlQRX0gZnJvbSBcIi4uL3V0aWwvbWltZS10eXBlc1wiO1xyXG5pbXBvcnQge1RyYW5zZm9ybWVyT3V0cHV0fSBmcm9tIFwiLi9pbmRleFwiO1xyXG5cclxuZXhwb3J0IGNvbnN0IHVzZUJhYmVsVHJhbnNmb3JtZXIgPSBtZW1vaXplZCgob3B0aW9uczogTW9kZXJub09wdGlvbnMsIHNvdXJjZU1hcHM6IFwiaW5saW5lXCIgfCBcImF1dG9cIiA9IFwiYXV0b1wiKSA9PiB7XHJcblxyXG4gICAgY29uc3Qge3Jlc29sdmVJbXBvcnRzLCByZXdyaXRlSW1wb3J0c30gPSB1c2VXZWJNb2R1bGVzUGx1Z2luKG9wdGlvbnMpO1xyXG5cclxuICAgIGNvbnN0IHByZVByb2Nlc3MgPSBvcHRpb25zLnRyYW5zZm9ybSAmJiBvcHRpb25zLnRyYW5zZm9ybS5wcmVQcm9jZXNzO1xyXG5cclxuICAgIGFzeW5jIGZ1bmN0aW9uIGJhYmVsVHJhbnNmb3JtZXIoZmlsZW5hbWU6c3RyaW5nLCBjb250ZW50OnN0cmluZyk6IFByb21pc2U8VHJhbnNmb3JtZXJPdXRwdXQ+IHtcclxuXHJcbiAgICAgICAgY29uc3QgYmFiZWxPcHRpb25zOiBUcmFuc2Zvcm1PcHRpb25zID0ge1xyXG4gICAgICAgICAgICAuLi5vcHRpb25zLmJhYmVsLFxyXG4gICAgICAgICAgICBzb3VyY2VNYXBzOiBzb3VyY2VNYXBzID09PSBcImF1dG9cIiA/IG9wdGlvbnMuYmFiZWwuc291cmNlTWFwcyA6IG9wdGlvbnMuYmFiZWwuc291cmNlTWFwcyAmJiBcImlubGluZVwiLFxyXG4gICAgICAgICAgICBiYWJlbHJjOiB0cnVlLFxyXG4gICAgICAgICAgICBmaWxlbmFtZTogZmlsZW5hbWVcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBjb25zdCBzb3VyY2UgPSBwcmVQcm9jZXNzID8gcHJlUHJvY2VzcyhmaWxlbmFtZSwgY29udGVudCkgOiBjb250ZW50O1xyXG4gICAgICAgIGNvbnN0IHBhcnNlZEFzdCA9IHBhcnNlU3luYyhzb3VyY2UsIGJhYmVsT3B0aW9ucykhO1xyXG4gICAgICAgIGNvbnN0IGltcG9ydE1hcCA9IGF3YWl0IHJlc29sdmVJbXBvcnRzKGZpbGVuYW1lLCBwYXJzZWRBc3QpO1xyXG5cclxuICAgICAgICBsZXQge2NvZGUsIG1hcCwgbWV0YWRhdGF9ID0gdHJhbnNmb3JtRnJvbUFzdFN5bmMocGFyc2VkQXN0LCBzb3VyY2UsIHtcclxuICAgICAgICAgICAgLi4uYmFiZWxPcHRpb25zLFxyXG4gICAgICAgICAgICBwbHVnaW5zOiBbXHJcbiAgICAgICAgICAgICAgICAuLi5iYWJlbE9wdGlvbnMucGx1Z2lucyEsXHJcbiAgICAgICAgICAgICAgICBbcmV3cml0ZUltcG9ydHMsIHtpbXBvcnRNYXB9XVxyXG4gICAgICAgICAgICBdXHJcbiAgICAgICAgfSkhO1xyXG5cclxuICAgICAgICBpZiAoIWNvZGUpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBCYWJlbCB0cmFuc2Zvcm1lciBmYWlsZWQgdG8gdHJhbnNmb3JtOiAke2ZpbGVuYW1lfWApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKG1hcCkge1xyXG4gICAgICAgICAgICBjb2RlICs9IFwiXFxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9XCIgKyBwYXRoLmJhc2VuYW1lKGZpbGVuYW1lKSArIFwiLm1hcFxcblwiO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGNvZGUgKz0gXCJcXG5cIjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGNvbnRlbnQ6IGNvZGUsXHJcbiAgICAgICAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAgICAgICAgIFwiY29udGVudC10eXBlXCI6IEpBVkFTQ1JJUFRfQ09OVEVOVF9UWVBFLFxyXG4gICAgICAgICAgICAgICAgXCJjb250ZW50LWxlbmd0aFwiOiBCdWZmZXIuYnl0ZUxlbmd0aChjb2RlKSxcclxuICAgICAgICAgICAgICAgIFwieC10cmFuc2Zvcm1lclwiOiBcImJhYmVsLXRyYW5zZm9ybWVyXCJcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgbWFwLFxyXG4gICAgICAgICAgICBsaW5rczogWy4uLm1ldGFkYXRhIVtcImltcG9ydHNcIl1dXHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGJhYmVsVHJhbnNmb3JtZXJcclxuICAgIH07XHJcbn0pO1xyXG4iXX0=