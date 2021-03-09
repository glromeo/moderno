"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useTransformers = void 0;
const path_1 = require("path");
const nano_memoize_1 = __importDefault(require("nano-memoize"));
const picomatch_1 = __importDefault(require("picomatch"));
const mime_types_1 = require("../util/mime-types");
const babel_transformer_1 = require("./babel-transformer");
const esbuild_transformer_1 = require("./esbuild-transformer");
const html_transformer_1 = require("./html-transformer");
const sass_transformer_1 = require("./sass-transformer");
exports.useTransformers = nano_memoize_1.default((options) => {
    var _a, _b;
    const { htmlTransformer } = html_transformer_1.useHtmlTransformer(options);
    const { esbuildTransformer } = esbuild_transformer_1.useEsBuildTransformer(options);
    const { babelTransformer } = babel_transformer_1.useBabelTransformer(options);
    const { sassTransformer } = sass_transformer_1.useSassTransformer(options);
    const include = ((_a = options.transform) === null || _a === void 0 ? void 0 : _a.include) && picomatch_1.default(options.transform.include);
    const exclude = ((_b = options.transform) === null || _b === void 0 ? void 0 : _b.exclude) && picomatch_1.default(options.transform.exclude);
    function shouldTransform({ headers, pathname, query }) {
        let should = headers["x-transformer"] !== "none" && headers["cache-control"] === "no-cache" || !!(query === null || query === void 0 ? void 0 : query.type);
        if (should) {
            should = !(include && !include(pathname) || exclude && exclude(pathname));
        }
        return should;
    }
    async function applyTransformer(filename, content, contentType, query) {
        switch (contentType) {
            case mime_types_1.HTML_CONTENT_TYPE:
                return htmlTransformer(filename, content);
            case mime_types_1.CSS_CONTENT_TYPE:
            case mime_types_1.SASS_CONTENT_TYPE:
            case mime_types_1.SCSS_CONTENT_TYPE:
                return sassTransformer(filename, content, query.type);
            case mime_types_1.JAVASCRIPT_CONTENT_TYPE:
            case mime_types_1.TYPESCRIPT_CONTENT_TYPE:
                if (options.babel) {
                    return babelTransformer(filename, content);
                }
                else {
                    return esbuildTransformer(filename, content);
                }
        }
    }
    async function transformContent(resource) {
        try {
            const hrtime = process.hrtime();
            const filename = resource.filename;
            const content = resource.content instanceof Buffer ? resource.content.toString("utf-8") : resource.content;
            const contentType = resource.headers["content-type"];
            const transformed = await applyTransformer(filename, content, contentType, resource.query);
            if (transformed) {
                resource.content = transformed.content;
                resource.headers["content-type"] = transformed.headers["content-type"];
                resource.headers["content-length"] = transformed.headers["content-length"];
                resource.headers["x-transformer"] = transformed.headers["x-transformer"];
                resource.headers["x-transform-duration"] = `${formatHrtime(process.hrtime(hrtime))}sec`;
                if (transformed.links) {
                    // TODO: check all the transformers to make sure this resolution is no longer necessary
                    const base = path_1.posix.dirname(resource.pathname);
                    resource.links = transformed.links.map(link => {
                        return path_1.posix.resolve(base, link);
                    });
                }
                if (transformed.includedFiles) {
                    resource.watch = transformed.includedFiles;
                }
                return transformed.map;
            }
        }
        catch (error) {
            error.message = `unable to transform: ${resource.filename}\n${error.message}`;
            throw error;
        }
    }
    function formatHrtime(hrtime) {
        return (hrtime[0] + (hrtime[1] / 1e9)).toFixed(3);
    }
    return {
        shouldTransform,
        transformContent
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvdHJhbnNmb3JtZXJzL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLCtCQUEyQjtBQUMzQixnRUFBb0M7QUFDcEMsMERBQWtDO0FBR2xDLG1EQU80QjtBQUM1QiwyREFBd0Q7QUFDeEQsK0RBQTREO0FBQzVELHlEQUFzRDtBQUN0RCx5REFBc0Q7QUF3QnpDLFFBQUEsZUFBZSxHQUFHLHNCQUFRLENBQUMsQ0FBQyxPQUF1QixFQUFFLEVBQUU7O0lBRWhFLE1BQU0sRUFBQyxlQUFlLEVBQUMsR0FBRyxxQ0FBa0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUN0RCxNQUFNLEVBQUMsa0JBQWtCLEVBQUMsR0FBRywyQ0FBcUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUM1RCxNQUFNLEVBQUMsZ0JBQWdCLEVBQUMsR0FBRyx1Q0FBbUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUN4RCxNQUFNLEVBQUMsZUFBZSxFQUFDLEdBQUcscUNBQWtCLENBQUMsT0FBTyxDQUFDLENBQUM7SUFFdEQsTUFBTSxPQUFPLEdBQUcsQ0FBQSxNQUFBLE9BQU8sQ0FBQyxTQUFTLDBDQUFFLE9BQU8sS0FBSSxtQkFBUyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDbkYsTUFBTSxPQUFPLEdBQUcsQ0FBQSxNQUFBLE9BQU8sQ0FBQyxTQUFTLDBDQUFFLE9BQU8sS0FBSSxtQkFBUyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUM7SUFFbkYsU0FBUyxlQUFlLENBQUMsRUFBQyxPQUFPLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBVztRQUN6RCxJQUFJLE1BQU0sR0FBRyxPQUFPLENBQUMsZUFBZSxDQUFDLEtBQUssTUFBTSxJQUFJLE9BQU8sQ0FBQyxlQUFlLENBQUMsS0FBSyxVQUFVLElBQUksQ0FBQyxDQUFDLENBQUEsS0FBSyxh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QWEsRUFBRTtvQkFDM0IsUUFBUSxDQUFDLEtBQUssR0FBRyxXQUFXLENBQUMsYUFBYSxDQUFDO2lCQUM5QztnQkFFRCxPQUFPLFdBQVcsQ0FBQyxHQUFHLENBQUM7YUFDMUI7U0FFSjtRQUFDLE9BQU8sS0FBSyxFQUFFO1lBQ1osS0FBSyxDQUFDLE9BQU8sR0FBRyx3QkFBd0IsUUFBUSxDQUFDLFFBQVEsS0FBSyxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDOUUsTUFBTSxLQUFLLENBQUM7U0FDZjtJQUNMLENBQUM7SUFFRCxTQUFTLFlBQVksQ0FBQyxNQUF3QjtRQUMxQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3RELENBQUM7SUFFRCxPQUFPO1FBQ0gsZUFBZTtRQUNmLGdCQUFnQjtLQUNuQixDQUFDO0FBQ04sQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge3Bvc2l4fSBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IG1lbW9pemVkIGZyb20gXCJuYW5vLW1lbW9pemVcIjtcbmltcG9ydCBwaWNvbWF0Y2ggZnJvbSBcInBpY29tYXRjaFwiO1xuaW1wb3J0IHtNb2Rlcm5vT3B0aW9uc30gZnJvbSBcIi4uL2NvbmZpZ3VyZVwiO1xuaW1wb3J0IHtSZXNvdXJjZX0gZnJvbSBcIi4uL3Byb3ZpZGVycy9yZXNvdXJjZS1wcm92aWRlclwiO1xuaW1wb3J0IHtcbiAgICBDU1NfQ09OVEVOVF9UWVBFLFxuICAgIEhUTUxfQ09OVEVOVF9UWVBFLFxuICAgIEpBVkFTQ1JJUFRfQ09OVEVOVF9UWVBFLFxuICAgIFNBU1NfQ09OVEVOVF9UWVBFLFxuICAgIFNDU1NfQ09OVEVOVF9UWVBFLFxuICAgIFRZUEVTQ1JJUFRfQ09OVEVOVF9UWVBFXG59IGZyb20gXCIuLi91dGlsL21pbWUtdHlwZXNcIjtcbmltcG9ydCB7dXNlQmFiZWxUcmFuc2Zvcm1lcn0gZnJvbSBcIi4vYmFiZWwtdHJhbnNmb3JtZXJcIjtcbmltcG9ydCB7dXNlRXNCdWlsZFRyYW5zZm9ybWVyfSBmcm9tIFwiLi9lc2J1aWxkLXRyYW5zZm9ybWVyXCI7XG5pbXBvcnQge3VzZUh0bWxUcmFuc2Zvcm1lcn0gZnJvbSBcIi4vaHRtbC10cmFuc2Zvcm1lclwiO1xuaW1wb3J0IHt1c2VTYXNzVHJhbnNmb3JtZXJ9IGZyb20gXCIuL3Nhc3MtdHJhbnNmb3JtZXJcIjtcblxuZXhwb3J0IHR5cGUgU291cmNlTWFwID0ge1xuICAgIHZlcnNpb246IG51bWJlcjtcbiAgICBzb3VyY2VzOiBzdHJpbmdbXTtcbiAgICBuYW1lczogc3RyaW5nW107XG4gICAgc291cmNlUm9vdD86IHN0cmluZztcbiAgICBzb3VyY2VzQ29udGVudD86IHN0cmluZ1tdO1xuICAgIG1hcHBpbmdzOiBzdHJpbmc7XG4gICAgZmlsZTogc3RyaW5nO1xufVxuXG5leHBvcnQgdHlwZSBUcmFuc2Zvcm1lck91dHB1dCA9IHtcbiAgICBjb250ZW50OiBzdHJpbmdcbiAgICBtYXA/OiBTb3VyY2VNYXAgfCBudWxsO1xuICAgIGhlYWRlcnM6IHtcbiAgICAgICAgXCJjb250ZW50LXR5cGVcIjogdHlwZW9mIEpBVkFTQ1JJUFRfQ09OVEVOVF9UWVBFIHwgdHlwZW9mIEhUTUxfQ09OVEVOVF9UWVBFIHwgdHlwZW9mIENTU19DT05URU5UX1RZUEUsXG4gICAgICAgIFwiY29udGVudC1sZW5ndGhcIjogbnVtYmVyLFxuICAgICAgICBcIngtdHJhbnNmb3JtZXJcIjogXCJiYWJlbC10cmFuc2Zvcm1lclwiIHwgXCJzYXNzLXRyYW5zZm9ybWVyXCIgfCBcImh0bWwtdHJhbnNmb3JtZXJcIiB8IFwiZXNidWlsZC10cmFuc2Zvcm1lclwiXG4gICAgfSxcbiAgICBsaW5rcz86IHN0cmluZ1tdIC8vIGFic29sdXRlIGZpbGVuYW1lcyBvZiBhbGwgaW1wb3J0ZWQgZmlsZXNcbiAgICBpbmNsdWRlZEZpbGVzPzogc3RyaW5nW10gIC8vIGFic29sdXRlIGZpbGVuYW1lcyBvZiBhbGwgaW5jbHVkZWQgZmlsZXMgKGUuZy4gc2FzcyBpbXBvcnRzKVxufVxuXG5leHBvcnQgY29uc3QgdXNlVHJhbnNmb3JtZXJzID0gbWVtb2l6ZWQoKG9wdGlvbnM6IE1vZGVybm9PcHRpb25zKSA9PiB7XG5cbiAgICBjb25zdCB7aHRtbFRyYW5zZm9ybWVyfSA9IHVzZUh0bWxUcmFuc2Zvcm1lcihvcHRpb25zKTtcbiAgICBjb25zdCB7ZXNidWlsZFRyYW5zZm9ybWVyfSA9IHVzZUVzQnVpbGRUcmFuc2Zvcm1lcihvcHRpb25zKTtcbiAgICBjb25zdCB7YmFiZWxUcmFuc2Zvcm1lcn0gPSB1c2VCYWJlbFRyYW5zZm9ybWVyKG9wdGlvbnMpO1xuICAgIGNvbnN0IHtzYXNzVHJhbnNmb3JtZXJ9ID0gdXNlU2Fzc1RyYW5zZm9ybWVyKG9wdGlvbnMpO1xuXG4gICAgY29uc3QgaW5jbHVkZSA9IG9wdGlvbnMudHJhbnNmb3JtPy5pbmNsdWRlICYmIHBpY29tYXRjaChvcHRpb25zLnRyYW5zZm9ybS5pbmNsdWRlKTtcbiAgICBjb25zdCBleGNsdWRlID0gb3B0aW9ucy50cmFuc2Zvcm0/LmV4Y2x1ZGUgJiYgcGljb21hdGNoKG9wdGlvbnMudHJhbnNmb3JtLmV4Y2x1ZGUpO1xuXG4gICAgZnVuY3Rpb24gc2hvdWxkVHJhbnNmb3JtKHtoZWFkZXJzLCBwYXRobmFtZSwgcXVlcnl9OiBSZXNvdXJjZSkge1xuICAgICAgICBsZXQgc2hvdWxkID0gaGVhZGVyc1tcIngtdHJhbnNmb3JtZXJcIl0gIT09IFwibm9uZVwiICYmIGhlYWRlcnNbXCJjYWNoZS1jb250cm9sXCJdID09PSBcIm5vLWNhY2hlXCIgfHwgISFxdWVyeT8udHlwZTtcbiAgICAgICAgaWYgKHNob3VsZCkge1xuICAgICAgICAgICAgc2hvdWxkID0gIShpbmNsdWRlICYmICFpbmNsdWRlKHBhdGhuYW1lKSB8fCBleGNsdWRlICYmIGV4Y2x1ZGUocGF0aG5hbWUpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc2hvdWxkO1xuICAgIH1cblxuICAgIGFzeW5jIGZ1bmN0aW9uIGFwcGx5VHJhbnNmb3JtZXIoZmlsZW5hbWUsIGNvbnRlbnQsIGNvbnRlbnRUeXBlLCBxdWVyeSk6IFByb21pc2U8VHJhbnNmb3JtZXJPdXRwdXQgfCB2b2lkPiB7XG4gICAgICAgIHN3aXRjaCAoY29udGVudFR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgSFRNTF9DT05URU5UX1RZUEU6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGh0bWxUcmFuc2Zvcm1lcihmaWxlbmFtZSwgY29udGVudCk7XG4gICAgICAgICAgICBjYXNlIENTU19DT05URU5UX1RZUEU6XG4gICAgICAgICAgICBjYXNlIFNBU1NfQ09OVEVOVF9UWVBFOlxuICAgICAgICAgICAgY2FzZSBTQ1NTX0NPTlRFTlRfVFlQRTpcbiAgICAgICAgICAgICAgICByZXR1cm4gc2Fzc1RyYW5zZm9ybWVyKGZpbGVuYW1lLCBjb250ZW50LCBxdWVyeS50eXBlKTtcbiAgICAgICAgICAgIGNhc2UgSkFWQVNDUklQVF9DT05URU5UX1RZUEU6XG4gICAgICAgICAgICBjYXNlIFRZUEVTQ1JJUFRfQ09OVEVOVF9UWVBFOlxuICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLmJhYmVsKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBiYWJlbFRyYW5zZm9ybWVyKGZpbGVuYW1lLCBjb250ZW50KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZXNidWlsZFRyYW5zZm9ybWVyKGZpbGVuYW1lLCBjb250ZW50KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhc3luYyBmdW5jdGlvbiB0cmFuc2Zvcm1Db250ZW50KHJlc291cmNlOiBSZXNvdXJjZSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgaHJ0aW1lID0gcHJvY2Vzcy5ocnRpbWUoKTtcblxuICAgICAgICAgICAgY29uc3QgZmlsZW5hbWUgPSByZXNvdXJjZS5maWxlbmFtZTtcbiAgICAgICAgICAgIGNvbnN0IGNvbnRlbnQgPSByZXNvdXJjZS5jb250ZW50IGluc3RhbmNlb2YgQnVmZmVyID8gcmVzb3VyY2UuY29udGVudC50b1N0cmluZyhcInV0Zi04XCIpIDogcmVzb3VyY2UuY29udGVudDtcbiAgICAgICAgICAgIGNvbnN0IGNvbnRlbnRUeXBlID0gcmVzb3VyY2UuaGVhZGVyc1tcImNvbnRlbnQtdHlwZVwiXTtcblxuICAgICAgICAgICAgY29uc3QgdHJhbnNmb3JtZWQgPSBhd2FpdCBhcHBseVRyYW5zZm9ybWVyKGZpbGVuYW1lLCBjb250ZW50LCBjb250ZW50VHlwZSwgcmVzb3VyY2UucXVlcnkpO1xuICAgICAgICAgICAgaWYgKHRyYW5zZm9ybWVkKSB7XG4gICAgICAgICAgICAgICAgcmVzb3VyY2UuY29udGVudCA9IHRyYW5zZm9ybWVkLmNvbnRlbnQ7XG5cbiAgICAgICAgICAgICAgICByZXNvdXJjZS5oZWFkZXJzW1wiY29udGVudC10eXBlXCJdID0gdHJhbnNmb3JtZWQuaGVhZGVyc1tcImNvbnRlbnQtdHlwZVwiXTtcbiAgICAgICAgICAgICAgICByZXNvdXJjZS5oZWFkZXJzW1wiY29udGVudC1sZW5ndGhcIl0gPSB0cmFuc2Zvcm1lZC5oZWFkZXJzW1wiY29udGVudC1sZW5ndGhcIl07XG4gICAgICAgICAgICAgICAgcmVzb3VyY2UuaGVhZGVyc1tcIngtdHJhbnNmb3JtZXJcIl0gPSB0cmFuc2Zvcm1lZC5oZWFkZXJzW1wieC10cmFuc2Zvcm1lclwiXTtcbiAgICAgICAgICAgICAgICByZXNvdXJjZS5oZWFkZXJzW1wieC10cmFuc2Zvcm0tZHVyYXRpb25cIl0gPSBgJHtmb3JtYXRIcnRpbWUocHJvY2Vzcy5ocnRpbWUoaHJ0aW1lKSl9c2VjYDtcblxuICAgICAgICAgICAgICAgIGlmICh0cmFuc2Zvcm1lZC5saW5rcykge1xuICAgICAgICAgICAgICAgICAgICAvLyBUT0RPOiBjaGVjayBhbGwgdGhlIHRyYW5zZm9ybWVycyB0byBtYWtlIHN1cmUgdGhpcyByZXNvbHV0aW9uIGlzIG5vIGxvbmdlciBuZWNlc3NhcnlcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYmFzZSA9IHBvc2l4LmRpcm5hbWUocmVzb3VyY2UucGF0aG5hbWUpO1xuICAgICAgICAgICAgICAgICAgICByZXNvdXJjZS5saW5rcyA9IHRyYW5zZm9ybWVkLmxpbmtzLm1hcChsaW5rID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBwb3NpeC5yZXNvbHZlKGJhc2UsIGxpbmspO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAodHJhbnNmb3JtZWQuaW5jbHVkZWRGaWxlcykge1xuICAgICAgICAgICAgICAgICAgICByZXNvdXJjZS53YXRjaCA9IHRyYW5zZm9ybWVkLmluY2x1ZGVkRmlsZXM7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRyYW5zZm9ybWVkLm1hcDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgZXJyb3IubWVzc2FnZSA9IGB1bmFibGUgdG8gdHJhbnNmb3JtOiAke3Jlc291cmNlLmZpbGVuYW1lfVxcbiR7ZXJyb3IubWVzc2FnZX1gO1xuICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBmb3JtYXRIcnRpbWUoaHJ0aW1lOiBbbnVtYmVyLCBudW1iZXJdKSB7XG4gICAgICAgIHJldHVybiAoaHJ0aW1lWzBdICsgKGhydGltZVsxXSAvIDFlOSkpLnRvRml4ZWQoMyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgc2hvdWxkVHJhbnNmb3JtLFxuICAgICAgICB0cmFuc2Zvcm1Db250ZW50XG4gICAgfTtcbn0pOyJdfQ==