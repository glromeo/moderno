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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Fzcy1iYWJlbC1wbHVnaW4taWlmZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlsL3Nhc3MtYmFiZWwtcGx1Z2luLWlpZmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxzQ0FBaUQ7QUFDakQsOEVBQThHO0FBQzlHLG9FQUFtRDtBQUNuRCwrQkFBb0M7QUFFcEMsTUFBTSxPQUFPLEdBQUcsZUFBUSxDQUFDOzs7Q0FHeEIsQ0FBQyxDQUFDO0FBRUgsa0JBQWUsNkJBQU8sQ0FBQyxDQUFDLEdBQUcsRUFBRSxPQUFPLEVBQUUsRUFBRTtJQUNwQyxHQUFHLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBRXJCLE1BQU0sRUFDRixLQUFLLEVBQ0wsaUJBQWlCLEVBQ2pCLE1BQU0sRUFDTixVQUFVLEVBQ1YsU0FBUyxFQUNULGVBQWUsRUFDZixlQUFlLEVBQ2Ysa0JBQWtCLEVBQ3JCLEdBQUcsT0FBTyxDQUFDO0lBRVosU0FBUyxvQkFBb0I7UUFDekIsTUFBTSxPQUFPLEdBQUcsZUFBZSxDQUFDLENBQUMsQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7UUFDbEUsSUFBSSxFQUFFLEdBQTBDLFlBQUMsQ0FBQyxjQUFjLEVBQUUsQ0FBQztRQUNuRSxPQUFPO1lBQ0gsVUFBVSxFQUFFLEVBQUU7WUFDZCxVQUFVLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRTtnQkFDMUIsRUFBRSxHQUFHLFlBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLEVBQUUsWUFBQyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUMvQyxPQUFPLFlBQUMsQ0FBQyxtQkFBbUIsQ0FDeEIsWUFBQyxDQUFDLG9CQUFvQixDQUFDLEdBQUcsRUFBRSxFQUFFLEVBQUUsWUFBQyxDQUFDLGlCQUFpQixDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsWUFBQyxDQUFDLGdCQUFnQixDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FDekYsQ0FBQztZQUNOLENBQUMsQ0FBQztTQUNMLENBQUM7SUFDTixDQUFDO0lBRUQsU0FBUyxvQkFBb0I7UUFDekIsTUFBTSxPQUFPLEdBQUcsZUFBZSxDQUFDLENBQUMsQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7UUFDbEUsT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxFQUFFLE9BQU8sRUFBRSxFQUFFLENBQUMsWUFBQyxDQUFDLGdCQUFnQixDQUFDLEdBQUcsRUFBRSxZQUFDLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUUsWUFBQyxDQUFDLGNBQWMsRUFBRSxDQUFDLENBQUM7SUFDaEgsQ0FBQztJQUVEOztPQUVHO0lBQ0gsU0FBUyxlQUFlLENBQUMsTUFBTSxFQUFFLFNBQVM7UUFDdEMsTUFBTSxNQUFNLEdBQUcsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLGNBQU8sQ0FBQyxrQkFBa0IsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDO1FBQ2pGLE1BQU0sS0FBSyxHQUFHLFlBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUM1QixPQUFPLFlBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsWUFBQyxDQUFDLFVBQVUsQ0FBQyxZQUFDLENBQUMsWUFBWSxDQUFDLEdBQUcsS0FBSyxDQUFDLEdBQUcsSUFBSSxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDckcsQ0FBQztJQUVELE9BQU87UUFDSCxPQUFPLEVBQUU7WUFDTCxPQUFPLEVBQUU7Z0JBQ0wsSUFBSSxDQUFDLElBQUk7b0JBQ0wsSUFBSSxDQUFDLG1DQUFRLENBQUMsSUFBSSxDQUFDO3dCQUFFLE9BQU87b0JBRTVCLE1BQU0sRUFBQyxJQUFJLEVBQUMsR0FBRyxrRUFBdUMsQ0FBQyxJQUFJLEVBQUU7d0JBQ3pELEtBQUs7d0JBQ0wsTUFBTTt3QkFDTixVQUFVO3dCQUNWLGlCQUFpQjt3QkFDakIsU0FBUztxQkFDWixDQUFDLENBQUM7b0JBRUgsNENBQTRDO29CQUM1QyxNQUFNLFFBQVEsR0FBOEMsRUFBRSxDQUFDO29CQUUvRCx1RUFBdUU7b0JBQ3ZFLE1BQU0sU0FBUyxHQUFtQixFQUFFLENBQUM7b0JBRXJDLDREQUE0RDtvQkFDNUQsSUFBSSxnQkFBZ0IsR0FBRyxFQUFFLENBQUM7b0JBQzFCLElBQUkscUNBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRTt3QkFDbEIsTUFBTSxtQkFBbUIsR0FBRyxvQkFBb0IsRUFBRSxDQUFDO3dCQUNuRCxnQkFBZ0IsR0FBRyxtQkFBbUIsQ0FBQyxVQUFVLENBQUM7d0JBQ2xELFFBQVEsQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsVUFBVSxDQUFDLENBQUM7d0JBQzlDLFNBQVMsQ0FBQyxJQUFJLENBQUMsWUFBQyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztxQkFDakQ7b0JBRUQsd0dBQXdHO29CQUN4RyxNQUFNLGdCQUFnQixHQUFHLG9CQUFvQixFQUFFLENBQUM7b0JBQ2hELEtBQUssTUFBTSxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFO3dCQUMxQyxRQUFRLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDO3dCQUN6RCxTQUFTLENBQUMsSUFBSSxDQUFDLFlBQUMsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7cUJBQy9DO29CQUVELHNHQUFzRztvQkFDdEcsTUFBTSxFQUFDLElBQUksRUFBRSxVQUFVLEVBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDO29CQUNyQyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsR0FBRyxFQUFFLENBQUM7b0JBQzFCLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxHQUFHLEVBQUUsQ0FBQztvQkFFcEIsNEJBQTRCO29CQUM1QixNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUM7d0JBQ3hCLGlCQUFpQixFQUFFLFFBQVE7d0JBQzNCLFlBQVksRUFBRSxTQUFTO3FCQUMxQixDQUFDLENBQUM7b0JBRUgscUJBQXFCO29CQUNyQiw0RkFBNEY7b0JBQzVGLDBCQUEwQjtvQkFDMUIsdUNBQXVDO29CQUN2QyxxRUFBcUU7b0JBQ3JFLEtBQUssSUFBSSxlQUFlLElBQUksZ0JBQWdCLEVBQUU7d0JBQzFDLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFLGVBQWUsQ0FBQyxDQUFDO3FCQUMvQztvQkFDRCxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ2hFLE1BQU0sVUFBVSxHQUFHLFVBQVUsQ0FBQyxHQUFHLENBQUMsd0JBQXdCLENBQUMsQ0FBQztvQkFDNUQsVUFBVSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUUsVUFBVSxDQUFDLENBQUM7b0JBQzdDLFVBQVUsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUMzQyxDQUFDO2FBQ0o7U0FDSjtLQUNKLENBQUM7QUFDTixDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7dGVtcGxhdGUsIHR5cGVzIGFzIHR9IGZyb20gXCJAYmFiZWwvY29yZVwiO1xuaW1wb3J0IHtoYXNFeHBvcnRzLCBpc01vZHVsZSwgcmV3cml0ZU1vZHVsZVN0YXRlbWVudHNBbmRQcmVwYXJlSGVhZGVyfSBmcm9tIFwiQGJhYmVsL2hlbHBlci1tb2R1bGUtdHJhbnNmb3Jtc1wiO1xuaW1wb3J0IHtkZWNsYXJlfSBmcm9tIFwiQGJhYmVsL2hlbHBlci1wbHVnaW4tdXRpbHNcIjtcbmltcG9ydCB7cGFyc2UsIHJlc29sdmV9IGZyb20gXCJwYXRoXCI7XG5cbmNvbnN0IHdyYXBwZXIgPSB0ZW1wbGF0ZShgXG4gICAgKGZ1bmN0aW9uKElNUE9SVF9OQU1FUykge1xuICAgIH0pKEJST1dTRVJfQVJHVU1FTlRTKTtcbmApO1xuXG5leHBvcnQgZGVmYXVsdCBkZWNsYXJlKChhcGksIG9wdGlvbnMpID0+IHtcbiAgICBhcGkuYXNzZXJ0VmVyc2lvbig3KTtcblxuICAgIGNvbnN0IHtcbiAgICAgICAgbG9vc2UsXG4gICAgICAgIGFsbG93VG9wTGV2ZWxUaGlzLFxuICAgICAgICBzdHJpY3QsXG4gICAgICAgIHN0cmljdE1vZGUsXG4gICAgICAgIG5vSW50ZXJvcCxcbiAgICAgICAgZXhwb3J0TmFtZXNwYWNlLFxuICAgICAgICBpbXBvcnROYW1lc3BhY2UsXG4gICAgICAgIGltcG9ydFJlbGF0aXZlUGF0aFxuICAgIH0gPSBvcHRpb25zO1xuXG4gICAgZnVuY3Rpb24gYnVpbGRFeHBvcnROYW1lc3BhY2UoKSB7XG4gICAgICAgIGNvbnN0IG1lbWJlcnMgPSBleHBvcnROYW1lc3BhY2UgPyBleHBvcnROYW1lc3BhY2Uuc3BsaXQoXCIuXCIpIDogW107XG4gICAgICAgIGxldCBpZDogdC5NZW1iZXJFeHByZXNzaW9uIHwgdC5UaGlzRXhwcmVzc2lvbiA9IHQudGhpc0V4cHJlc3Npb24oKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGV4cHJlc3Npb246IGlkLFxuICAgICAgICAgICAgc3RhdGVtZW50czogbWVtYmVycy5tYXAoc2VnID0+IHtcbiAgICAgICAgICAgICAgICBpZCA9IHQubWVtYmVyRXhwcmVzc2lvbihpZCwgdC5pZGVudGlmaWVyKHNlZykpO1xuICAgICAgICAgICAgICAgIHJldHVybiB0LmV4cHJlc3Npb25TdGF0ZW1lbnQoXG4gICAgICAgICAgICAgICAgICAgIHQuYXNzaWdubWVudEV4cHJlc3Npb24oXCI9XCIsIGlkLCB0LmxvZ2ljYWxFeHByZXNzaW9uKFwifHxcIiwgaWQsIHQub2JqZWN0RXhwcmVzc2lvbihbXSkpKVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9KVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGJ1aWxkSW1wb3J0TmFtZXNwYWNlKCkge1xuICAgICAgICBjb25zdCBtZW1iZXJzID0gaW1wb3J0TmFtZXNwYWNlID8gaW1wb3J0TmFtZXNwYWNlLnNwbGl0KFwiLlwiKSA6IFtdO1xuICAgICAgICByZXR1cm4gbWVtYmVycy5yZWR1Y2UoKGFjYywgY3VycmVudCkgPT4gdC5tZW1iZXJFeHByZXNzaW9uKGFjYywgdC5pZGVudGlmaWVyKGN1cnJlbnQpKSwgdC50aGlzRXhwcmVzc2lvbigpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBCdWlsZCB0aGUgbWVtYmVyIGV4cHJlc3Npb24gdGhhdCByZWFkcyBmcm9tIGEgZ2xvYmFsIGZvciBhIGdpdmVuIHNvdXJjZS5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBidWlsZEJyb3dzZXJBcmcoc291cmNlLCBuYW1lc3BhY2UpIHtcbiAgICAgICAgY29uc3QgaWRQYXRoID0gaW1wb3J0UmVsYXRpdmVQYXRoID8gcmVzb2x2ZShpbXBvcnRSZWxhdGl2ZVBhdGgsIHNvdXJjZSkgOiBzb3VyY2U7XG4gICAgICAgIGNvbnN0IHBhcnRzID0gcGFyc2UoaWRQYXRoKTtcbiAgICAgICAgcmV0dXJuIHQubWVtYmVyRXhwcmVzc2lvbihuYW1lc3BhY2UsIHQuaWRlbnRpZmllcih0LnRvSWRlbnRpZmllcihgJHtwYXJ0cy5kaXJ9LyR7cGFydHMubmFtZX1gKSkpO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIHZpc2l0b3I6IHtcbiAgICAgICAgICAgIFByb2dyYW06IHtcbiAgICAgICAgICAgICAgICBleGl0KHBhdGgpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFpc01vZHVsZShwYXRoKSkgcmV0dXJuO1xuXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHttZXRhfSA9IHJld3JpdGVNb2R1bGVTdGF0ZW1lbnRzQW5kUHJlcGFyZUhlYWRlcihwYXRoLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb29zZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0cmljdCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0cmljdE1vZGUsXG4gICAgICAgICAgICAgICAgICAgICAgICBhbGxvd1RvcExldmVsVGhpcyxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vSW50ZXJvcFxuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBUaGUgYXJndW1lbnRzIG9mIHRoZSBvdXRlciwgSUlGRSBmdW5jdGlvblxuICAgICAgICAgICAgICAgICAgICBjb25zdCBpaWZlQXJnczogKHQuTWVtYmVyRXhwcmVzc2lvbiB8IHQuVGhpc0V4cHJlc3Npb24pW10gPSBbXTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBUaGUgY29ycmVzcG9uZGluZyBhcmd1bWVudHMgdG8gdGhlIGlubmVyIGZ1bmN0aW9uIGNhbGxlZCBieSB0aGUgSUlGRVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBpbm5lckFyZ3M6IHQuSWRlbnRpZmllcltdID0gW107XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gSWYgZXhwb3J0cyBhcmUgZGV0ZWN0ZWQsIHNldCB1cCB0aGUgZXhwb3J0IG5hbWVzcGFjZSBpbmZvXG4gICAgICAgICAgICAgICAgICAgIGxldCBleHBvcnRTdGF0ZW1lbnRzID0gW107XG4gICAgICAgICAgICAgICAgICAgIGlmIChoYXNFeHBvcnRzKG1ldGEpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBleHBvcnROYW1lc3BhY2VJbmZvID0gYnVpbGRFeHBvcnROYW1lc3BhY2UoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGV4cG9ydFN0YXRlbWVudHMgPSBleHBvcnROYW1lc3BhY2VJbmZvLnN0YXRlbWVudHM7XG4gICAgICAgICAgICAgICAgICAgICAgICBpaWZlQXJncy5wdXNoKGV4cG9ydE5hbWVzcGFjZUluZm8uZXhwcmVzc2lvbik7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbm5lckFyZ3MucHVzaCh0LmlkZW50aWZpZXIobWV0YS5leHBvcnROYW1lKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvLyBHZXQgdGhlIGltcG9ydCBuYW1lc3BhY2UgYW5kIGJ1aWxkIHVwIHRoZSAyIHNldHMgb2YgYXJndW1lbnRzIGJhc2VkIG9uIHRoZSBtb2R1bGUncyBpbXBvcnQgc3RhdGVtZW50c1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBpbXBvcnRFeHByZXNzaW9uID0gYnVpbGRJbXBvcnROYW1lc3BhY2UoKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBbc291cmNlLCBtZXRhZGF0YV0gb2YgbWV0YS5zb3VyY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlpZmVBcmdzLnB1c2goYnVpbGRCcm93c2VyQXJnKHNvdXJjZSwgaW1wb3J0RXhwcmVzc2lvbikpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5uZXJBcmdzLnB1c2godC5pZGVudGlmaWVyKG1ldGFkYXRhLm5hbWUpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIENhY2hlIHRoZSBtb2R1bGUncyBib2R5IGFuZCBkaXJlY3RpdmVzIGFuZCB0aGVuIGNsZWFyIHRoZW0gb3V0IHNvIHRoZXkgY2FuIGJlIHdyYXBwZWQgd2l0aCB0aGUgSUlGRVxuICAgICAgICAgICAgICAgICAgICBjb25zdCB7Ym9keSwgZGlyZWN0aXZlc30gPSBwYXRoLm5vZGU7XG4gICAgICAgICAgICAgICAgICAgIHBhdGgubm9kZS5kaXJlY3RpdmVzID0gW107XG4gICAgICAgICAgICAgICAgICAgIHBhdGgubm9kZS5ib2R5ID0gW107XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gR2V0IHRoZSBpaWZlIHdyYXBwZXIgTm9kZVxuICAgICAgICAgICAgICAgICAgICBjb25zdCB3cmFwcGVkQm9keSA9IHdyYXBwZXIoe1xuICAgICAgICAgICAgICAgICAgICAgICAgQlJPV1NFUl9BUkdVTUVOVFM6IGlpZmVBcmdzLFxuICAgICAgICAgICAgICAgICAgICAgICAgSU1QT1JUX05BTUVTOiBpbm5lckFyZ3NcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gUmUtYnVpbGQgdGhlIHBhdGg6XG4gICAgICAgICAgICAgICAgICAgIC8vICAtIEFkZCB0aGUgc3RhdGVtZW50cyB0aGF0IGVuc3VyZSB0aGUgZXhwb3J0IG5hbWVzcGFjZSBleGlzdHMgKGlmIHRoZSBtb2R1bGUgaGFzIGV4cG9ydHMpXG4gICAgICAgICAgICAgICAgICAgIC8vICAtIEFkZCB0aGUgSUlGRSB3cmFwcGVyXG4gICAgICAgICAgICAgICAgICAgIC8vICAtIFF1ZXJ5IHRoZSB3cmFwcGVyIHRvIGdldCBpdHMgYm9keVxuICAgICAgICAgICAgICAgICAgICAvLyAgLSBBZGQgdGhlIGNhY2hlZCBkaXJlY3RpdmVzIGFuZCBvcmlnaW5hbCBib2R5IHRvIHRoZSBJSUZFIHdyYXBwZXJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgZXhwb3J0U3RhdGVtZW50IG9mIGV4cG9ydFN0YXRlbWVudHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGgucHVzaENvbnRhaW5lcihcImJvZHlcIiwgZXhwb3J0U3RhdGVtZW50KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjb25zdCB1bWRXcmFwcGVyID0gcGF0aC5wdXNoQ29udGFpbmVyKFwiYm9keVwiLCBbd3JhcHBlZEJvZHldKVswXTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdW1kRmFjdG9yeSA9IHVtZFdyYXBwZXIuZ2V0KFwiZXhwcmVzc2lvbi5jYWxsZWUuYm9keVwiKTtcbiAgICAgICAgICAgICAgICAgICAgdW1kRmFjdG9yeS5wdXNoQ29udGFpbmVyKFwiYm9keVwiLCBkaXJlY3RpdmVzKTtcbiAgICAgICAgICAgICAgICAgICAgdW1kRmFjdG9yeS5wdXNoQ29udGFpbmVyKFwiYm9keVwiLCBib2R5KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xufSk7XG4iXX0=