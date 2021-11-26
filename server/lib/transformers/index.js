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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvdHJhbnNmb3JtZXJzL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLCtCQUEyQjtBQUMzQixnRUFBb0M7QUFDcEMsMERBQWtDO0FBR2xDLG1EQU80QjtBQUM1QiwyREFBd0Q7QUFDeEQsK0RBQTREO0FBQzVELHlEQUFzRDtBQUN0RCx5REFBc0Q7QUF3QnpDLFFBQUEsZUFBZSxHQUFHLHNCQUFRLENBQUMsQ0FBQyxPQUF1QixFQUFFLEVBQUU7O0lBRWhFLE1BQU0sRUFBQyxlQUFlLEVBQUMsR0FBRyxxQ0FBa0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUN0RCxNQUFNLEVBQUMsa0JBQWtCLEVBQUMsR0FBRywyQ0FBcUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUM1RCxNQUFNLEVBQUMsZ0JBQWdCLEVBQUMsR0FBRyx1Q0FBbUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUN4RCxNQUFNLEVBQUMsZUFBZSxFQUFDLEdBQUcscUNBQWtCLENBQUMsT0FBTyxDQUFDLENBQUM7SUFFdEQsTUFBTSxPQUFPLEdBQUcsQ0FBQSxNQUFBLE9BQU8sQ0FBQyxTQUFTLDBDQUFFLE9BQU8sS0FBSSxtQkFBUyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDbkYsTUFBTSxPQUFPLEdBQUcsQ0FBQSxNQUFBLE9BQU8sQ0FBQyxTQUFTLDBDQUFFLE9BQU8sS0FBSSxtQkFBUyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUM7SUFFbkYsU0FBUyxlQUFlLENBQUMsRUFBQyxPQUFPLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBVztRQUN6RCxJQUFJLE1BQU0sR0FBRyxPQUFPLENBQUMsZUFBZSxDQUFDLEtBQUssTUFBTSxJQUFJLE9BQU8sQ0FBQyxlQUFlLENBQUMsS0FBSyxVQUFVLElBQUksQ0FBQyxDQUFDLENBQUEsS0FBSyxh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QWEsRUFBRTtvQkFDM0IsUUFBUSxDQUFDLEtBQUssR0FBRyxXQUFXLENBQUMsYUFBYSxDQUFDO2lCQUM5QztnQkFFRCxPQUFPLFdBQVcsQ0FBQyxHQUFHLENBQUM7YUFDMUI7U0FFSjtRQUFDLE9BQU8sS0FBSyxFQUFFO1lBQ1osS0FBSyxDQUFDLE9BQU8sR0FBRyx3QkFBd0IsUUFBUSxDQUFDLFFBQVEsS0FBSyxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDOUUsTUFBTSxLQUFLLENBQUM7U0FDZjtJQUNMLENBQUM7SUFFRCxTQUFTLFlBQVksQ0FBQyxNQUF3QjtRQUMxQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3RELENBQUM7SUFFRCxPQUFPO1FBQ0gsZUFBZTtRQUNmLGdCQUFnQjtLQUNuQixDQUFDO0FBQ04sQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge3Bvc2l4fSBmcm9tIFwicGF0aFwiO1xyXG5pbXBvcnQgbWVtb2l6ZWQgZnJvbSBcIm5hbm8tbWVtb2l6ZVwiO1xyXG5pbXBvcnQgcGljb21hdGNoIGZyb20gXCJwaWNvbWF0Y2hcIjtcclxuaW1wb3J0IHtNb2Rlcm5vT3B0aW9uc30gZnJvbSBcIi4uL2NvbmZpZ3VyZVwiO1xyXG5pbXBvcnQge1Jlc291cmNlfSBmcm9tIFwiLi4vcHJvdmlkZXJzL3Jlc291cmNlLXByb3ZpZGVyXCI7XHJcbmltcG9ydCB7XHJcbiAgICBDU1NfQ09OVEVOVF9UWVBFLFxyXG4gICAgSFRNTF9DT05URU5UX1RZUEUsXHJcbiAgICBKQVZBU0NSSVBUX0NPTlRFTlRfVFlQRSxcclxuICAgIFNBU1NfQ09OVEVOVF9UWVBFLFxyXG4gICAgU0NTU19DT05URU5UX1RZUEUsXHJcbiAgICBUWVBFU0NSSVBUX0NPTlRFTlRfVFlQRVxyXG59IGZyb20gXCIuLi91dGlsL21pbWUtdHlwZXNcIjtcclxuaW1wb3J0IHt1c2VCYWJlbFRyYW5zZm9ybWVyfSBmcm9tIFwiLi9iYWJlbC10cmFuc2Zvcm1lclwiO1xyXG5pbXBvcnQge3VzZUVzQnVpbGRUcmFuc2Zvcm1lcn0gZnJvbSBcIi4vZXNidWlsZC10cmFuc2Zvcm1lclwiO1xyXG5pbXBvcnQge3VzZUh0bWxUcmFuc2Zvcm1lcn0gZnJvbSBcIi4vaHRtbC10cmFuc2Zvcm1lclwiO1xyXG5pbXBvcnQge3VzZVNhc3NUcmFuc2Zvcm1lcn0gZnJvbSBcIi4vc2Fzcy10cmFuc2Zvcm1lclwiO1xyXG5cclxuZXhwb3J0IHR5cGUgU291cmNlTWFwID0ge1xyXG4gICAgdmVyc2lvbjogbnVtYmVyO1xyXG4gICAgc291cmNlczogc3RyaW5nW107XHJcbiAgICBuYW1lczogc3RyaW5nW107XHJcbiAgICBzb3VyY2VSb290Pzogc3RyaW5nO1xyXG4gICAgc291cmNlc0NvbnRlbnQ/OiBzdHJpbmdbXTtcclxuICAgIG1hcHBpbmdzOiBzdHJpbmc7XHJcbiAgICBmaWxlOiBzdHJpbmc7XHJcbn1cclxuXHJcbmV4cG9ydCB0eXBlIFRyYW5zZm9ybWVyT3V0cHV0ID0ge1xyXG4gICAgY29udGVudDogc3RyaW5nXHJcbiAgICBtYXA/OiBTb3VyY2VNYXAgfCBudWxsO1xyXG4gICAgaGVhZGVyczoge1xyXG4gICAgICAgIFwiY29udGVudC10eXBlXCI6IHR5cGVvZiBKQVZBU0NSSVBUX0NPTlRFTlRfVFlQRSB8IHR5cGVvZiBIVE1MX0NPTlRFTlRfVFlQRSB8IHR5cGVvZiBDU1NfQ09OVEVOVF9UWVBFLFxyXG4gICAgICAgIFwiY29udGVudC1sZW5ndGhcIjogbnVtYmVyLFxyXG4gICAgICAgIFwieC10cmFuc2Zvcm1lclwiOiBcImJhYmVsLXRyYW5zZm9ybWVyXCIgfCBcInNhc3MtdHJhbnNmb3JtZXJcIiB8IFwiaHRtbC10cmFuc2Zvcm1lclwiIHwgXCJlc2J1aWxkLXRyYW5zZm9ybWVyXCJcclxuICAgIH0sXHJcbiAgICBsaW5rcz86IHN0cmluZ1tdIC8vIGFic29sdXRlIGZpbGVuYW1lcyBvZiBhbGwgaW1wb3J0ZWQgZmlsZXNcclxuICAgIGluY2x1ZGVkRmlsZXM/OiBzdHJpbmdbXSAgLy8gYWJzb2x1dGUgZmlsZW5hbWVzIG9mIGFsbCBpbmNsdWRlZCBmaWxlcyAoZS5nLiBzYXNzIGltcG9ydHMpXHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCB1c2VUcmFuc2Zvcm1lcnMgPSBtZW1vaXplZCgob3B0aW9uczogTW9kZXJub09wdGlvbnMpID0+IHtcclxuXHJcbiAgICBjb25zdCB7aHRtbFRyYW5zZm9ybWVyfSA9IHVzZUh0bWxUcmFuc2Zvcm1lcihvcHRpb25zKTtcclxuICAgIGNvbnN0IHtlc2J1aWxkVHJhbnNmb3JtZXJ9ID0gdXNlRXNCdWlsZFRyYW5zZm9ybWVyKG9wdGlvbnMpO1xyXG4gICAgY29uc3Qge2JhYmVsVHJhbnNmb3JtZXJ9ID0gdXNlQmFiZWxUcmFuc2Zvcm1lcihvcHRpb25zKTtcclxuICAgIGNvbnN0IHtzYXNzVHJhbnNmb3JtZXJ9ID0gdXNlU2Fzc1RyYW5zZm9ybWVyKG9wdGlvbnMpO1xyXG5cclxuICAgIGNvbnN0IGluY2x1ZGUgPSBvcHRpb25zLnRyYW5zZm9ybT8uaW5jbHVkZSAmJiBwaWNvbWF0Y2gob3B0aW9ucy50cmFuc2Zvcm0uaW5jbHVkZSk7XHJcbiAgICBjb25zdCBleGNsdWRlID0gb3B0aW9ucy50cmFuc2Zvcm0/LmV4Y2x1ZGUgJiYgcGljb21hdGNoKG9wdGlvbnMudHJhbnNmb3JtLmV4Y2x1ZGUpO1xyXG5cclxuICAgIGZ1bmN0aW9uIHNob3VsZFRyYW5zZm9ybSh7aGVhZGVycywgcGF0aG5hbWUsIHF1ZXJ5fTogUmVzb3VyY2UpIHtcclxuICAgICAgICBsZXQgc2hvdWxkID0gaGVhZGVyc1tcIngtdHJhbnNmb3JtZXJcIl0gIT09IFwibm9uZVwiICYmIGhlYWRlcnNbXCJjYWNoZS1jb250cm9sXCJdID09PSBcIm5vLWNhY2hlXCIgfHwgISFxdWVyeT8udHlwZTtcclxuICAgICAgICBpZiAoc2hvdWxkKSB7XHJcbiAgICAgICAgICAgIHNob3VsZCA9ICEoaW5jbHVkZSAmJiAhaW5jbHVkZShwYXRobmFtZSkgfHwgZXhjbHVkZSAmJiBleGNsdWRlKHBhdGhuYW1lKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBzaG91bGQ7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgZnVuY3Rpb24gYXBwbHlUcmFuc2Zvcm1lcihmaWxlbmFtZSwgY29udGVudCwgY29udGVudFR5cGUsIHF1ZXJ5KTogUHJvbWlzZTxUcmFuc2Zvcm1lck91dHB1dCB8IHZvaWQ+IHtcclxuICAgICAgICBzd2l0Y2ggKGNvbnRlbnRUeXBlKSB7XHJcbiAgICAgICAgICAgIGNhc2UgSFRNTF9DT05URU5UX1RZUEU6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gaHRtbFRyYW5zZm9ybWVyKGZpbGVuYW1lLCBjb250ZW50KTtcclxuICAgICAgICAgICAgY2FzZSBDU1NfQ09OVEVOVF9UWVBFOlxyXG4gICAgICAgICAgICBjYXNlIFNBU1NfQ09OVEVOVF9UWVBFOlxyXG4gICAgICAgICAgICBjYXNlIFNDU1NfQ09OVEVOVF9UWVBFOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHNhc3NUcmFuc2Zvcm1lcihmaWxlbmFtZSwgY29udGVudCwgcXVlcnkudHlwZSk7XHJcbiAgICAgICAgICAgIGNhc2UgSkFWQVNDUklQVF9DT05URU5UX1RZUEU6XHJcbiAgICAgICAgICAgIGNhc2UgVFlQRVNDUklQVF9DT05URU5UX1RZUEU6XHJcbiAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5iYWJlbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBiYWJlbFRyYW5zZm9ybWVyKGZpbGVuYW1lLCBjb250ZW50KTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVzYnVpbGRUcmFuc2Zvcm1lcihmaWxlbmFtZSwgY29udGVudCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGZ1bmN0aW9uIHRyYW5zZm9ybUNvbnRlbnQocmVzb3VyY2U6IFJlc291cmNlKSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgaHJ0aW1lID0gcHJvY2Vzcy5ocnRpbWUoKTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IGZpbGVuYW1lID0gcmVzb3VyY2UuZmlsZW5hbWU7XHJcbiAgICAgICAgICAgIGNvbnN0IGNvbnRlbnQgPSByZXNvdXJjZS5jb250ZW50IGluc3RhbmNlb2YgQnVmZmVyID8gcmVzb3VyY2UuY29udGVudC50b1N0cmluZyhcInV0Zi04XCIpIDogcmVzb3VyY2UuY29udGVudDtcclxuICAgICAgICAgICAgY29uc3QgY29udGVudFR5cGUgPSByZXNvdXJjZS5oZWFkZXJzW1wiY29udGVudC10eXBlXCJdO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgdHJhbnNmb3JtZWQgPSBhd2FpdCBhcHBseVRyYW5zZm9ybWVyKGZpbGVuYW1lLCBjb250ZW50LCBjb250ZW50VHlwZSwgcmVzb3VyY2UucXVlcnkpO1xyXG4gICAgICAgICAgICBpZiAodHJhbnNmb3JtZWQpIHtcclxuICAgICAgICAgICAgICAgIHJlc291cmNlLmNvbnRlbnQgPSB0cmFuc2Zvcm1lZC5jb250ZW50O1xyXG5cclxuICAgICAgICAgICAgICAgIHJlc291cmNlLmhlYWRlcnNbXCJjb250ZW50LXR5cGVcIl0gPSB0cmFuc2Zvcm1lZC5oZWFkZXJzW1wiY29udGVudC10eXBlXCJdO1xyXG4gICAgICAgICAgICAgICAgcmVzb3VyY2UuaGVhZGVyc1tcImNvbnRlbnQtbGVuZ3RoXCJdID0gdHJhbnNmb3JtZWQuaGVhZGVyc1tcImNvbnRlbnQtbGVuZ3RoXCJdO1xyXG4gICAgICAgICAgICAgICAgcmVzb3VyY2UuaGVhZGVyc1tcIngtdHJhbnNmb3JtZXJcIl0gPSB0cmFuc2Zvcm1lZC5oZWFkZXJzW1wieC10cmFuc2Zvcm1lclwiXTtcclxuICAgICAgICAgICAgICAgIHJlc291cmNlLmhlYWRlcnNbXCJ4LXRyYW5zZm9ybS1kdXJhdGlvblwiXSA9IGAke2Zvcm1hdEhydGltZShwcm9jZXNzLmhydGltZShocnRpbWUpKX1zZWNgO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICh0cmFuc2Zvcm1lZC5saW5rcykge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFRPRE86IGNoZWNrIGFsbCB0aGUgdHJhbnNmb3JtZXJzIHRvIG1ha2Ugc3VyZSB0aGlzIHJlc29sdXRpb24gaXMgbm8gbG9uZ2VyIG5lY2Vzc2FyeVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGJhc2UgPSBwb3NpeC5kaXJuYW1lKHJlc291cmNlLnBhdGhuYW1lKTtcclxuICAgICAgICAgICAgICAgICAgICByZXNvdXJjZS5saW5rcyA9IHRyYW5zZm9ybWVkLmxpbmtzLm1hcChsaW5rID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHBvc2l4LnJlc29sdmUoYmFzZSwgbGluayk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHRyYW5zZm9ybWVkLmluY2x1ZGVkRmlsZXMpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXNvdXJjZS53YXRjaCA9IHRyYW5zZm9ybWVkLmluY2x1ZGVkRmlsZXM7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRyYW5zZm9ybWVkLm1hcDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICBlcnJvci5tZXNzYWdlID0gYHVuYWJsZSB0byB0cmFuc2Zvcm06ICR7cmVzb3VyY2UuZmlsZW5hbWV9XFxuJHtlcnJvci5tZXNzYWdlfWA7XHJcbiAgICAgICAgICAgIHRocm93IGVycm9yO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBmb3JtYXRIcnRpbWUoaHJ0aW1lOiBbbnVtYmVyLCBudW1iZXJdKSB7XHJcbiAgICAgICAgcmV0dXJuIChocnRpbWVbMF0gKyAoaHJ0aW1lWzFdIC8gMWU5KSkudG9GaXhlZCgzKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHNob3VsZFRyYW5zZm9ybSxcclxuICAgICAgICB0cmFuc2Zvcm1Db250ZW50XHJcbiAgICB9O1xyXG59KTsiXX0=