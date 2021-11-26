"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@babel/core");
const helper_module_transforms_1 = require("@babel/helper-module-transforms");
const helper_plugin_utils_1 = require("@babel/helper-plugin-utils");
const path_1 = require("path");
const wrapper = core_1.template(`
    (function(IMPORT_NAMES) {
    })(BROWSER_ARGUMENTS);
`);
exports.default = helper_plugin_utils_1.declare((api, options) => {
    api.assertVersion(7);
    const { loose, allowTopLevelThis, strict, strictMode, noInterop, exportNamespace, importNamespace, importRelativePath } = options;
    function buildExportNamespace() {
        const members = exportNamespace ? exportNamespace.split(".") : [];
        let id = core_1.types.thisExpression();
        return {
            expression: id,
            statements: members.map(seg => {
                id = core_1.types.memberExpression(id, core_1.types.identifier(seg));
                return core_1.types.expressionStatement(core_1.types.assignmentExpression("=", id, core_1.types.logicalExpression("||", id, core_1.types.objectExpression([]))));
            })
        };
    }
    function buildImportNamespace() {
        const members = importNamespace ? importNamespace.split(".") : [];
        return members.reduce((acc, current) => core_1.types.memberExpression(acc, core_1.types.identifier(current)), core_1.types.thisExpression());
    }
    /**
     * Build the member expression that reads from a global for a given source.
     */
    function buildBrowserArg(source, namespace) {
        const idPath = importRelativePath ? path_1.resolve(importRelativePath, source) : source;
        const parts = path_1.parse(idPath);
        return core_1.types.memberExpression(namespace, core_1.types.identifier(core_1.types.toIdentifier(`${parts.dir}/${parts.name}`)));
    }
    return {
        visitor: {
            Program: {
                exit(path) {
                    if (!helper_module_transforms_1.isModule(path))
                        return;
                    const { meta } = helper_module_transforms_1.rewriteModuleStatementsAndPrepareHeader(path, {
                        loose,
                        strict,
                        strictMode,
                        allowTopLevelThis,
                        noInterop
                    });
                    // The arguments of the outer, IIFE function
                    const iifeArgs = [];
                    // The corresponding arguments to the inner function called by the IIFE
                    const innerArgs = [];
                    // If exports are detected, set up the export namespace info
                    let exportStatements = [];
                    if (helper_module_transforms_1.hasExports(meta)) {
                        const exportNamespaceInfo = buildExportNamespace();
                        exportStatements = exportNamespaceInfo.statements;
                        iifeArgs.push(exportNamespaceInfo.expression);
                        innerArgs.push(core_1.types.identifier(meta.exportName));
                    }
                    // Get the import namespace and build up the 2 sets of arguments based on the module's import statements
                    const importExpression = buildImportNamespace();
                    for (const [source, metadata] of meta.source) {
                        iifeArgs.push(buildBrowserArg(source, importExpression));
                        innerArgs.push(core_1.types.identifier(metadata.name));
                    }
                    // Cache the module's body and directives and then clear them out so they can be wrapped with the IIFE
                    const { body, directives } = path.node;
                    path.node.directives = [];
                    path.node.body = [];
                    // Get the iife wrapper Node
                    const wrappedBody = wrapper({
                        BROWSER_ARGUMENTS: iifeArgs,
                        IMPORT_NAMES: innerArgs
                    });
                    // Re-build the path:
                    //  - Add the statements that ensure the export namespace exists (if the module has exports)
                    //  - Add the IIFE wrapper
                    //  - Query the wrapper to get its body
                    //  - Add the cached directives and original body to the IIFE wrapper
                    for (let exportStatement of exportStatements) {
                        path.pushContainer("body", exportStatement);
                    }
                    const umdWrapper = path.pushContainer("body", [wrappedBody])[0];
                    const umdFactory = umdWrapper.get("expression.callee.body");
                    umdFactory.pushContainer("body", directives);
                    umdFactory.pushContainer("body", body);
                }
            }
        }
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Fzcy1iYWJlbC1wbHVnaW4taWlmZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlsL3Nhc3MtYmFiZWwtcGx1Z2luLWlpZmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxzQ0FBaUQ7QUFDakQsOEVBQThHO0FBQzlHLG9FQUFtRDtBQUNuRCwrQkFBb0M7QUFFcEMsTUFBTSxPQUFPLEdBQUcsZUFBUSxDQUFDOzs7Q0FHeEIsQ0FBQyxDQUFDO0FBRUgsa0JBQWUsNkJBQU8sQ0FBQyxDQUFDLEdBQUcsRUFBRSxPQUFPLEVBQUUsRUFBRTtJQUNwQyxHQUFHLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBRXJCLE1BQU0sRUFDRixLQUFLLEVBQ0wsaUJBQWlCLEVBQ2pCLE1BQU0sRUFDTixVQUFVLEVBQ1YsU0FBUyxFQUNULGVBQWUsRUFDZixlQUFlLEVBQ2Ysa0JBQWtCLEVBQ3JCLEdBQUcsT0FBTyxDQUFDO0lBRVosU0FBUyxvQkFBb0I7UUFDekIsTUFBTSxPQUFPLEdBQUcsZUFBZSxDQUFDLENBQUMsQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7UUFDbEUsSUFBSSxFQUFFLEdBQTBDLFlBQUMsQ0FBQyxjQUFjLEVBQUUsQ0FBQztRQUNuRSxPQUFPO1lBQ0gsVUFBVSxFQUFFLEVBQUU7WUFDZCxVQUFVLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRTtnQkFDMUIsRUFBRSxHQUFHLFlBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLEVBQUUsWUFBQyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUMvQyxPQUFPLFlBQUMsQ0FBQyxtQkFBbUIsQ0FDeEIsWUFBQyxDQUFDLG9CQUFvQixDQUFDLEdBQUcsRUFBRSxFQUFFLEVBQUUsWUFBQyxDQUFDLGlCQUFpQixDQUFDLElBQUksRUFBRSxFQUFFLEVB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QUFHLEVBQUUsQ0FBQztvQkFFcEIsNEJBQTRCO29CQUM1QixNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUM7d0JBQ3hCLGlCQUFpQixFQUFFLFFBQVE7d0JBQzNCLFlBQVksRUFBRSxTQUFTO3FCQUMxQixDQUFDLENBQUM7b0JBRUgscUJBQXFCO29CQUNyQiw0RkFBNEY7b0JBQzVGLDBCQUEwQjtvQkFDMUIsdUNBQXVDO29CQUN2QyxxRUFBcUU7b0JBQ3JFLEtBQUssSUFBSSxlQUFlLElBQUksZ0JBQWdCLEVBQUU7d0JBQzFDLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFLGVBQWUsQ0FBQyxDQUFDO3FCQUMvQztvQkFDRCxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ2hFLE1BQU0sVUFBVSxHQUFHLFVBQVUsQ0FBQyxHQUFHLENBQUMsd0JBQXdCLENBQUMsQ0FBQztvQkFDNUQsVUFBVSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUUsVUFBVSxDQUFDLENBQUM7b0JBQzdDLFVBQVUsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUMzQyxDQUFDO2FBQ0o7U0FDSjtLQUNKLENBQUM7QUFDTixDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7dGVtcGxhdGUsIHR5cGVzIGFzIHR9IGZyb20gXCJAYmFiZWwvY29yZVwiO1xyXG5pbXBvcnQge2hhc0V4cG9ydHMsIGlzTW9kdWxlLCByZXdyaXRlTW9kdWxlU3RhdGVtZW50c0FuZFByZXBhcmVIZWFkZXJ9IGZyb20gXCJAYmFiZWwvaGVscGVyLW1vZHVsZS10cmFuc2Zvcm1zXCI7XHJcbmltcG9ydCB7ZGVjbGFyZX0gZnJvbSBcIkBiYWJlbC9oZWxwZXItcGx1Z2luLXV0aWxzXCI7XHJcbmltcG9ydCB7cGFyc2UsIHJlc29sdmV9IGZyb20gXCJwYXRoXCI7XHJcblxyXG5jb25zdCB3cmFwcGVyID0gdGVtcGxhdGUoYFxyXG4gICAgKGZ1bmN0aW9uKElNUE9SVF9OQU1FUykge1xyXG4gICAgfSkoQlJPV1NFUl9BUkdVTUVOVFMpO1xyXG5gKTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGRlY2xhcmUoKGFwaSwgb3B0aW9ucykgPT4ge1xyXG4gICAgYXBpLmFzc2VydFZlcnNpb24oNyk7XHJcblxyXG4gICAgY29uc3Qge1xyXG4gICAgICAgIGxvb3NlLFxyXG4gICAgICAgIGFsbG93VG9wTGV2ZWxUaGlzLFxyXG4gICAgICAgIHN0cmljdCxcclxuICAgICAgICBzdHJpY3RNb2RlLFxyXG4gICAgICAgIG5vSW50ZXJvcCxcclxuICAgICAgICBleHBvcnROYW1lc3BhY2UsXHJcbiAgICAgICAgaW1wb3J0TmFtZXNwYWNlLFxyXG4gICAgICAgIGltcG9ydFJlbGF0aXZlUGF0aFxyXG4gICAgfSA9IG9wdGlvbnM7XHJcblxyXG4gICAgZnVuY3Rpb24gYnVpbGRFeHBvcnROYW1lc3BhY2UoKSB7XHJcbiAgICAgICAgY29uc3QgbWVtYmVycyA9IGV4cG9ydE5hbWVzcGFjZSA/IGV4cG9ydE5hbWVzcGFjZS5zcGxpdChcIi5cIikgOiBbXTtcclxuICAgICAgICBsZXQgaWQ6IHQuTWVtYmVyRXhwcmVzc2lvbiB8IHQuVGhpc0V4cHJlc3Npb24gPSB0LnRoaXNFeHByZXNzaW9uKCk7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgZXhwcmVzc2lvbjogaWQsXHJcbiAgICAgICAgICAgIHN0YXRlbWVudHM6IG1lbWJlcnMubWFwKHNlZyA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZCA9IHQubWVtYmVyRXhwcmVzc2lvbihpZCwgdC5pZGVudGlmaWVyKHNlZykpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHQuZXhwcmVzc2lvblN0YXRlbWVudChcclxuICAgICAgICAgICAgICAgICAgICB0LmFzc2lnbm1lbnRFeHByZXNzaW9uKFwiPVwiLCBpZCwgdC5sb2dpY2FsRXhwcmVzc2lvbihcInx8XCIsIGlkLCB0Lm9iamVjdEV4cHJlc3Npb24oW10pKSlcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBidWlsZEltcG9ydE5hbWVzcGFjZSgpIHtcclxuICAgICAgICBjb25zdCBtZW1iZXJzID0gaW1wb3J0TmFtZXNwYWNlID8gaW1wb3J0TmFtZXNwYWNlLnNwbGl0KFwiLlwiKSA6IFtdO1xyXG4gICAgICAgIHJldHVybiBtZW1iZXJzLnJlZHVjZSgoYWNjLCBjdXJyZW50KSA9PiB0Lm1lbWJlckV4cHJlc3Npb24oYWNjLCB0LmlkZW50aWZpZXIoY3VycmVudCkpLCB0LnRoaXNFeHByZXNzaW9uKCkpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQnVpbGQgdGhlIG1lbWJlciBleHByZXNzaW9uIHRoYXQgcmVhZHMgZnJvbSBhIGdsb2JhbCBmb3IgYSBnaXZlbiBzb3VyY2UuXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIGJ1aWxkQnJvd3NlckFyZyhzb3VyY2UsIG5hbWVzcGFjZSkge1xyXG4gICAgICAgIGNvbnN0IGlkUGF0aCA9IGltcG9ydFJlbGF0aXZlUGF0aCA/IHJlc29sdmUoaW1wb3J0UmVsYXRpdmVQYXRoLCBzb3VyY2UpIDogc291cmNlO1xyXG4gICAgICAgIGNvbnN0IHBhcnRzID0gcGFyc2UoaWRQYXRoKTtcclxuICAgICAgICByZXR1cm4gdC5tZW1iZXJFeHByZXNzaW9uKG5hbWVzcGFjZSwgdC5pZGVudGlmaWVyKHQudG9JZGVudGlmaWVyKGAke3BhcnRzLmRpcn0vJHtwYXJ0cy5uYW1lfWApKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICB2aXNpdG9yOiB7XHJcbiAgICAgICAgICAgIFByb2dyYW06IHtcclxuICAgICAgICAgICAgICAgIGV4aXQocGF0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghaXNNb2R1bGUocGF0aCkpIHJldHVybjtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qge21ldGF9ID0gcmV3cml0ZU1vZHVsZVN0YXRlbWVudHNBbmRQcmVwYXJlSGVhZGVyKHBhdGgsIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbG9vc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0cmljdCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RyaWN0TW9kZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWxsb3dUb3BMZXZlbFRoaXMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vSW50ZXJvcFxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBUaGUgYXJndW1lbnRzIG9mIHRoZSBvdXRlciwgSUlGRSBmdW5jdGlvblxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGlpZmVBcmdzOiAodC5NZW1iZXJFeHByZXNzaW9uIHwgdC5UaGlzRXhwcmVzc2lvbilbXSA9IFtdO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBUaGUgY29ycmVzcG9uZGluZyBhcmd1bWVudHMgdG8gdGhlIGlubmVyIGZ1bmN0aW9uIGNhbGxlZCBieSB0aGUgSUlGRVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGlubmVyQXJnczogdC5JZGVudGlmaWVyW10gPSBbXTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gSWYgZXhwb3J0cyBhcmUgZGV0ZWN0ZWQsIHNldCB1cCB0aGUgZXhwb3J0IG5hbWVzcGFjZSBpbmZvXHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGV4cG9ydFN0YXRlbWVudHMgPSBbXTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoaGFzRXhwb3J0cyhtZXRhKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBleHBvcnROYW1lc3BhY2VJbmZvID0gYnVpbGRFeHBvcnROYW1lc3BhY2UoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZXhwb3J0U3RhdGVtZW50cyA9IGV4cG9ydE5hbWVzcGFjZUluZm8uc3RhdGVtZW50cztcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWlmZUFyZ3MucHVzaChleHBvcnROYW1lc3BhY2VJbmZvLmV4cHJlc3Npb24pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbm5lckFyZ3MucHVzaCh0LmlkZW50aWZpZXIobWV0YS5leHBvcnROYW1lKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBHZXQgdGhlIGltcG9ydCBuYW1lc3BhY2UgYW5kIGJ1aWxkIHVwIHRoZSAyIHNldHMgb2YgYXJndW1lbnRzIGJhc2VkIG9uIHRoZSBtb2R1bGUncyBpbXBvcnQgc3RhdGVtZW50c1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGltcG9ydEV4cHJlc3Npb24gPSBidWlsZEltcG9ydE5hbWVzcGFjZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgW3NvdXJjZSwgbWV0YWRhdGFdIG9mIG1ldGEuc291cmNlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlpZmVBcmdzLnB1c2goYnVpbGRCcm93c2VyQXJnKHNvdXJjZSwgaW1wb3J0RXhwcmVzc2lvbikpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbm5lckFyZ3MucHVzaCh0LmlkZW50aWZpZXIobWV0YWRhdGEubmFtZSkpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gQ2FjaGUgdGhlIG1vZHVsZSdzIGJvZHkgYW5kIGRpcmVjdGl2ZXMgYW5kIHRoZW4gY2xlYXIgdGhlbSBvdXQgc28gdGhleSBjYW4gYmUgd3JhcHBlZCB3aXRoIHRoZSBJSUZFXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qge2JvZHksIGRpcmVjdGl2ZXN9ID0gcGF0aC5ub2RlO1xyXG4gICAgICAgICAgICAgICAgICAgIHBhdGgubm9kZS5kaXJlY3RpdmVzID0gW107XHJcbiAgICAgICAgICAgICAgICAgICAgcGF0aC5ub2RlLmJvZHkgPSBbXTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gR2V0IHRoZSBpaWZlIHdyYXBwZXIgTm9kZVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHdyYXBwZWRCb2R5ID0gd3JhcHBlcih7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIEJST1dTRVJfQVJHVU1FTlRTOiBpaWZlQXJncyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgSU1QT1JUX05BTUVTOiBpbm5lckFyZ3NcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gUmUtYnVpbGQgdGhlIHBhdGg6XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gIC0gQWRkIHRoZSBzdGF0ZW1lbnRzIHRoYXQgZW5zdXJlIHRoZSBleHBvcnQgbmFtZXNwYWNlIGV4aXN0cyAoaWYgdGhlIG1vZHVsZSBoYXMgZXhwb3J0cylcclxuICAgICAgICAgICAgICAgICAgICAvLyAgLSBBZGQgdGhlIElJRkUgd3JhcHBlclxyXG4gICAgICAgICAgICAgICAgICAgIC8vICAtIFF1ZXJ5IHRoZSB3cmFwcGVyIHRvIGdldCBpdHMgYm9keVxyXG4gICAgICAgICAgICAgICAgICAgIC8vICAtIEFkZCB0aGUgY2FjaGVkIGRpcmVjdGl2ZXMgYW5kIG9yaWdpbmFsIGJvZHkgdG8gdGhlIElJRkUgd3JhcHBlclxyXG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGV4cG9ydFN0YXRlbWVudCBvZiBleHBvcnRTdGF0ZW1lbnRzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGgucHVzaENvbnRhaW5lcihcImJvZHlcIiwgZXhwb3J0U3RhdGVtZW50KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdW1kV3JhcHBlciA9IHBhdGgucHVzaENvbnRhaW5lcihcImJvZHlcIiwgW3dyYXBwZWRCb2R5XSlbMF07XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdW1kRmFjdG9yeSA9IHVtZFdyYXBwZXIuZ2V0KFwiZXhwcmVzc2lvbi5jYWxsZWUuYm9keVwiKTtcclxuICAgICAgICAgICAgICAgICAgICB1bWRGYWN0b3J5LnB1c2hDb250YWluZXIoXCJib2R5XCIsIGRpcmVjdGl2ZXMpO1xyXG4gICAgICAgICAgICAgICAgICAgIHVtZEZhY3RvcnkucHVzaENvbnRhaW5lcihcImJvZHlcIiwgYm9keSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59KTtcclxuIl19