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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFiZWwtdHJhbnNmb3JtZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvdHJhbnNmb3JtZXJzL2JhYmVsLXRyYW5zZm9ybWVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLHNDQUE4RTtBQUM5RSxzREFBeUQ7QUFDekQsZ0VBQW9DO0FBQ3BDLGdEQUF3QjtBQUV4QixtREFBMkQ7QUFHOUMsUUFBQSxtQkFBbUIsR0FBRyxzQkFBUSxDQUFDLENBQUMsT0FBdUIsRUFBRSxhQUFnQyxNQUFNLEVBQUUsRUFBRTtJQUU1RyxNQUFNLEVBQUMsY0FBYyxFQUFFLGNBQWMsRUFBQyxHQUFHLGlDQUFtQixDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBRXRFLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxTQUFTLElBQUksT0FBTyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUM7SUFFckUsS0FBSyxVQUFVLGdCQUFnQixDQUFDLFFBQWUsRUFBRSxPQUFjO1FBRTNELE1BQU0sWUFBWSxHQUFxQjtZQUNuQyxHQUFHLE9BQU8sQ0FBQyxLQUFLO1lBQ2hCLFVBQVUsRUFBRSxVQUFVLEtBQUssTUFBTSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxVQUFVLElBQUksUUFBUTtZQUNuRyxPQUFPLEVBQUUsSUFBSTtZQUNiLFFBQVEsRUFBRSxRQUFRO1NBQ3JCLENBQUM7UUFFRixNQUFNLE1BQU0sR0FBRyxVQUFVLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQztRQUNwRSxNQUFNLFNBQVMsR0FBRyxnQkFBUyxDQUFDLE1BQU0sRUFBRSxZQUFZLENBQUUsQ0FBQztRQUNuRCxNQUFNLFNBQVMsR0FBRyxNQUFNLGNBQWMsQ0FBQyxRQUFRLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFFNUQsSUFBSSxFQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsUUFBUSxFQUFDLEdBQUcsMkJBQW9CLENBQUMsU0FBUyxFQUFFLE1BQU0sRUFBRTtZQUNoRSxHQUFHLFlBQVk7WUFDZixPQUFPLEVBQUU7Z0JBQ0wsR0FBRyxZQUFZLENBQUMsT0FBUTtnQkFDeEIsQ0FBQyxjQUFjLEVBQUUsRUFBQyxTQUFTLEVBQUMsQ0FBQzthQUNoQztTQUNKLENBQUUsQ0FBQztRQUVKLElBQUksQ0FBQyxJQUFJLEVBQUU7WUFDUCxNQUFNLElBQUksS0FBSyxDQUFDLDBDQUEwQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1NBQ3pFO1FBRUQsSUFBSSxHQUFHLEVBQUU7WUFDTCxJQUFJLElBQUkseUJBQXlCLEdBQUcsY0FBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsR0FBRyxRQUFRLENBQUM7U0FDMUU7YUFBTTtZQUNILElBQUksSUFBSSxJQUFJLENBQUM7U0FDaEI7UUFFRCxPQUFPO1lBQ0gsT0FBTyxFQUFFLElBQUk7WUFDYixPQUFPLEVBQUU7Z0JBQ0wsY0FBYyxFQUFFLG9DQUF1QjtnQkFDdkMsZ0JBQWdCLEVBQUUsTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUM7Z0JBQ3pDLGVBQWUsRUFBRSxtQkFBbUI7YUFDdkM7WUFDRCxHQUFHO1lBQ0gsS0FBSyxFQUFFLENBQUMsR0FBRyxRQUFTLENBQUMsU0FBUyxDQUFDLENBQUM7U0FDbkMsQ0FBQztJQUNOLENBQUM7SUFFRCxPQUFPO1FBQ0gsZ0JBQWdCO0tBQ25CLENBQUM7QUFDTixDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7cGFyc2VTeW5jLCB0cmFuc2Zvcm1Gcm9tQXN0U3luYywgVHJhbnNmb3JtT3B0aW9uc30gZnJvbSBcIkBiYWJlbC9jb3JlXCI7XG5pbXBvcnQge3VzZVdlYk1vZHVsZXNQbHVnaW59IGZyb20gXCJAbW9kZXJuby93ZWItbW9kdWxlc1wiO1xuaW1wb3J0IG1lbW9pemVkIGZyb20gXCJuYW5vLW1lbW9pemVcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQge01vZGVybm9PcHRpb25zfSBmcm9tIFwiLi4vY29uZmlndXJlXCI7XG5pbXBvcnQge0pBVkFTQ1JJUFRfQ09OVEVOVF9UWVBFfSBmcm9tIFwiLi4vdXRpbC9taW1lLXR5cGVzXCI7XG5pbXBvcnQge1RyYW5zZm9ybWVyT3V0cHV0fSBmcm9tIFwiLi9pbmRleFwiO1xuXG5leHBvcnQgY29uc3QgdXNlQmFiZWxUcmFuc2Zvcm1lciA9IG1lbW9pemVkKChvcHRpb25zOiBNb2Rlcm5vT3B0aW9ucywgc291cmNlTWFwczogXCJpbmxpbmVcIiB8IFwiYXV0b1wiID0gXCJhdXRvXCIpID0+IHtcblxuICAgIGNvbnN0IHtyZXNvbHZlSW1wb3J0cywgcmV3cml0ZUltcG9ydHN9ID0gdXNlV2ViTW9kdWxlc1BsdWdpbihvcHRpb25zKTtcblxuICAgIGNvbnN0IHByZVByb2Nlc3MgPSBvcHRpb25zLnRyYW5zZm9ybSAmJiBvcHRpb25zLnRyYW5zZm9ybS5wcmVQcm9jZXNzO1xuXG4gICAgYXN5bmMgZnVuY3Rpb24gYmFiZWxUcmFuc2Zvcm1lcihmaWxlbmFtZTpzdHJpbmcsIGNvbnRlbnQ6c3RyaW5nKTogUHJvbWlzZTxUcmFuc2Zvcm1lck91dHB1dD4ge1xuXG4gICAgICAgIGNvbnN0IGJhYmVsT3B0aW9uczogVHJhbnNmb3JtT3B0aW9ucyA9IHtcbiAgICAgICAgICAgIC4uLm9wdGlvbnMuYmFiZWwsXG4gICAgICAgICAgICBzb3VyY2VNYXBzOiBzb3VyY2VNYXBzID09PSBcImF1dG9cIiA/IG9wdGlvbnMuYmFiZWwuc291cmNlTWFwcyA6IG9wdGlvbnMuYmFiZWwuc291cmNlTWFwcyAmJiBcImlubGluZVwiLFxuICAgICAgICAgICAgYmFiZWxyYzogdHJ1ZSxcbiAgICAgICAgICAgIGZpbGVuYW1lOiBmaWxlbmFtZVxuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IHNvdXJjZSA9IHByZVByb2Nlc3MgPyBwcmVQcm9jZXNzKGZpbGVuYW1lLCBjb250ZW50KSA6IGNvbnRlbnQ7XG4gICAgICAgIGNvbnN0IHBhcnNlZEFzdCA9IHBhcnNlU3luYyhzb3VyY2UsIGJhYmVsT3B0aW9ucykhO1xuICAgICAgICBjb25zdCBpbXBvcnRNYXAgPSBhd2FpdCByZXNvbHZlSW1wb3J0cyhmaWxlbmFtZSwgcGFyc2VkQXN0KTtcblxuICAgICAgICBsZXQge2NvZGUsIG1hcCwgbWV0YWRhdGF9ID0gdHJhbnNmb3JtRnJvbUFzdFN5bmMocGFyc2VkQXN0LCBzb3VyY2UsIHtcbiAgICAgICAgICAgIC4uLmJhYmVsT3B0aW9ucyxcbiAgICAgICAgICAgIHBsdWdpbnM6IFtcbiAgICAgICAgICAgICAgICAuLi5iYWJlbE9wdGlvbnMucGx1Z2lucyEsXG4gICAgICAgICAgICAgICAgW3Jld3JpdGVJbXBvcnRzLCB7aW1wb3J0TWFwfV1cbiAgICAgICAgICAgIF1cbiAgICAgICAgfSkhO1xuXG4gICAgICAgIGlmICghY29kZSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBCYWJlbCB0cmFuc2Zvcm1lciBmYWlsZWQgdG8gdHJhbnNmb3JtOiAke2ZpbGVuYW1lfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG1hcCkge1xuICAgICAgICAgICAgY29kZSArPSBcIlxcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPVwiICsgcGF0aC5iYXNlbmFtZShmaWxlbmFtZSkgKyBcIi5tYXBcXG5cIjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvZGUgKz0gXCJcXG5cIjtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBjb250ZW50OiBjb2RlLFxuICAgICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgICAgIFwiY29udGVudC10eXBlXCI6IEpBVkFTQ1JJUFRfQ09OVEVOVF9UWVBFLFxuICAgICAgICAgICAgICAgIFwiY29udGVudC1sZW5ndGhcIjogQnVmZmVyLmJ5dGVMZW5ndGgoY29kZSksXG4gICAgICAgICAgICAgICAgXCJ4LXRyYW5zZm9ybWVyXCI6IFwiYmFiZWwtdHJhbnNmb3JtZXJcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1hcCxcbiAgICAgICAgICAgIGxpbmtzOiBbLi4ubWV0YWRhdGEhW1wiaW1wb3J0c1wiXV1cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBiYWJlbFRyYW5zZm9ybWVyXG4gICAgfTtcbn0pO1xuIl19