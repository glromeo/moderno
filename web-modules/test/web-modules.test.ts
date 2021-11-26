import {expect} from "chai";
import * as fs from "fs";
import {existsSync, readFileSync, statSync} from "fs";
import * as mocha from "mocha";
import * as path from "path";
import {join, relative, resolve} from "path";
import {SourceMapConsumer} from "source-map";
import {WebModulesOptions} from "../src";
import {defaultOptions, useWebModules} from "../src/web-modules";
import log from "@moderno/logger";

log.level = "error";

function readExports(path: string) {
    let out = fs.readFileSync(join(__dirname, path), "utf-8");
    let regExp = /export\s*{([^}]+)}/g;
    let exports = [], match;
    while ((match = regExp.exec(out))) {
        exports.push(...match[1].split(",").map(e => e.split(" as ").pop()!.trim()));
    }
    if (/export\s+default\s+/.test(out)) {
        exports.push("default");
    }
    return exports;
}

function readImportMap(path: string) {
    return JSON.parse(fs.readFileSync(join(__dirname, path), "utf-8"));
}

function readSourceMap(path: string) {
    let out = fs.readFileSync(join(__dirname, path), "utf-8");
    return JSON.parse(out);
}

function readTextFile(path: string) {
    return readFileSync(join(__dirname, path), "utf-8");
}

describe("web modules (esbuild)", function () {

    const fixtureDir = resolve(__dirname, "fixture");

    function useFixture(workspace: string, override: Partial<WebModulesOptions> = defaultOptions()) {
        let rootDir = path.join(fixtureDir, workspace);
        let outDir = path.join(rootDir, "/web_modules");
        return {
            rootDir,
            ...useWebModules({
                ...override,
                clean: true,
                rootDir: rootDir,
                resolve: {
                    ...override.resolve,
                    moduleDirectory: ["fixture/node_modules"]
                }
            })
        };
    }

    it("ant-design", async function (this: mocha.Context) {

        this.timeout(15000);

        let {bundleWebModule, resolveImport} = useFixture("ant-design", {
            squash: ["antd", "@ant-design/icons"]
        });

        await bundleWebModule("@ant-design/icons");
        await bundleWebModule("@ant-design/icons/es/icons/AccountBookFilled.js");
    });

    it("can read configuration", function () {
        const cwd = process.cwd();
        process.chdir(fixtureDir);
        let {outDir} = useWebModules();
        process.chdir(cwd);
        expect(relative(fixtureDir, outDir).replace(/\\/g, "/")).to.equal("web_modules");
    });

    it("can bundle react", async function () {

        let {bundleWebModule} = useFixture("/react");

        await bundleWebModule("react");

        let exports = readExports(`fixture/react/web_modules/react.js`);
        expect(exports).to.have.members([
            "Children",
            "Component",
            "Fragment",
            "Profiler",
            "PureComponent",
            "StrictMode",
            "Suspense",
            "__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED",
            "cloneElement",
            "createContext",
            "createElement",
            "createFactory",
            "createRef",
            "forwardRef",
            "isValidElement",
            "lazy",
            "memo",
            "useCallback",
            "useContext",
            "useDebugValue",
            "useEffect",
            "useImperativeHandle",
            "useLayoutEffect",
            "useMemo",
            "useReducer",
            "useRef",
            "useState",
            "version",
            "default"
        ]);

        let {imports} = readImportMap(`fixture/react/web_modules/import-map.json`);
        expect(imports).to.have.keys([
            "react",
            "react/index.js",
            "object-assign",
            "object-assign/index.js"
        ]);

        await SourceMapConsumer.with(readSourceMap(`fixture/react/web_modules/react.js.map`), null, consumer => {
            // var _assign = require('object-assign');
            // ----------------------^ (16:22) NOTE: sourcemap columns start at 0 not 1 !!!
            expect(
                consumer.generatedPositionFor({
                    source: "../../node_modules/react/cjs/react.development.js",
                    line: 16,
                    column: 22
                })
            ).to.eql({
                line: 41, column: 32, lastColumn: null
            });
            //   var maybeIterator = MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL] || ...
            // -----------------------------------------------^ (78:48)
            expect(
                consumer.generatedPositionFor({
                    source: "../../node_modules/react/cjs/react.development.js",
                    line: 78,
                    column: 47
                })
            ).to.eql({
                line: 92, column: 55, lastColumn: 68
            });
            //         var REACT_LAZY_TYPE = 60116;
            // ------------------------------^ (48:30)
            expect(
                consumer.originalPositionFor({line: 48, column: 30})
            ).to.eql({
                source: "../../node_modules/react/cjs/react.development.js",
                line: 31,
                column: 4,
                name: null
            });
        });
    });

    it("can bundle react-dom (production)", async function (this: mocha.Context) {

        this.timeout(10000);

        let {bundleWebModule} = useFixture("/react", {esbuild: {define: {"process.env.NODE_ENV": `"production"`}}});

        const reactDomReady = bundleWebModule("react-dom");
        expect(bundleWebModule("react-dom")).to.equal(reactDomReady);                                    // PENDING TASK
        await reactDomReady;

        expect(bundleWebModule("react-dom")).to.equal(bundleWebModule("react-dom"));                 // ALREADY_RESOLVED

        let exports = readExports(`fixture/react/web_modules/react-dom.js`);
        expect(exports).to.have.members([
            "__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED",
            "createPortal",
            "findDOMNode",
            "flushSync",
            "hydrate",
            "render",
            "unmountComponentAtNode",
            "unstable_batchedUpdates",
            "unstable_createPortal",
            "unstable_renderSubtreeIntoContainer",
            "version",
            "default"
        ]);

        let {imports} = readImportMap(`fixture/react/web_modules/import-map.json`);
        expect(imports).to.have.keys([
            "react-dom",
            "react-dom/index.js",
            "object-assign",
            "object-assign/index.js",
            "react",
            "react/index.js"
        ]);

        let out = readTextFile(`fixture/react/web_modules/react-dom.js`);
        expect(out).to.have.string("export_render as render,"); // default export workaround
        expect(out).to.have.string("module.exports = require_react_dom_production_min();"); // make sure define works
    });

    it("can bundle prop-types", async function () {

        let {bundleWebModule, resolveImport} = useFixture("/react");

        await bundleWebModule("prop-types");

        let exports = readExports(`fixture/react/web_modules/prop-types.js`);
        expect(exports).to.have.members([
            "PropTypes",
            "any",
            "array",
            "arrayOf",
            "bool",
            "checkPropTypes",
            "element",
            "elementType",
            "exact",
            "func",
            "instanceOf",
            "node",
            "number",
            "object",
            "objectOf",
            "oneOf",
            "oneOfType",
            "resetWarningCache",
            "shape",
            "string",
            "symbol",
            "default"
        ]);

        let {imports} = readImportMap(`fixture/react/web_modules/import-map.json`);
        expect(imports).to.have.keys([
            "object-assign",
            "object-assign/index.js",
            "prop-types",
            "prop-types/index.js",
            "react-is",
            "react-is/index.js"
        ]);

    });

    it("can bundle react-icons", async function () {

        let {bundleWebModule, outDir} = useFixture("/react");

        await bundleWebModule("react-icons/bs");

        expect(existsSync(join(__dirname, "/web_modules/react-icons.js"))).to.be.false;

        await bundleWebModule("react-icons");

        let exports = readExports(`fixture/react/web_modules/react-icons.js`); /// <<<<<<<<< resolve from import map
        expect(exports).to.have.members([
            "DefaultContext",
            "GenIcon",
            "IconBase",
            "IconContext",
            "IconsManifest"
        ]);

        let {imports} = readImportMap(`fixture/react/web_modules/import-map.json`);
        expect(imports).to.include.keys([
            "object-assign",
            "object-assign/index.js",
            "react",
            "react-icons",
            "react-icons/bs/index.esm.js",
            "react-icons/lib/esm/index.js",
            "react/index.js"
        ]);

        expect(existsSync(join(outDir, "/react-icons.js"))).to.be.true;
        expect(existsSync(join(outDir, "/react-icons/bs.js"))).to.be.true;
    });

    it("can bundle countries-and-timezones", async function () {

        let {bundleWebModule, resolveImport} = useFixture("/iife");

        await bundleWebModule("countries-and-timezones");

        let exports = readExports(`fixture/iife/web_modules/countries-and-timezones.js`);
        expect(exports).to.have.members([
            "getAllCountries",
            "getAllTimezones",
            "getCountry",
            "getCountryForTimezone",
            "getTimezone",
            "getTimezonesForCountry",
            "default"
        ]);

        let {imports} = readImportMap(`fixture/iife/web_modules/import-map.json`);
        expect(imports).to.include.keys([
            "countries-and-timezones/dist/index.js",
            "countries-and-timezones"
        ]);

    });

    it("can bundle antd (shallow)", async function (this: mocha.Context) {

        this.timeout(15000);

        let {bundleWebModule, resolveImport} = useFixture("/ant-design", {
            squash: ["@babel/runtime"]
        });

        await bundleWebModule("antd");

        let exports = readExports(`fixture/ant-design/web_modules/antd.js`);
        expect(exports).to.include.members([
            "AutoComplete",
            "version"
        ]);

        let {imports} = readImportMap(`fixture/ant-design/web_modules/import-map.json`);
        expect(imports).to.include({
            "antd": "/web_modules/antd.js",
            "antd/es/index.js": "/web_modules/antd.js"
        });

    });

    it("can bundle rc-resize-observer (dependency of antd)", async function (this: mocha.Context) {

        let {bundleWebModule, resolveImport} = useFixture("/ant-design");

        await bundleWebModule("rc-resize-observer");

        let exports = readExports(`fixture/ant-design/web_modules/rc-resize-observer.js`);
        expect(exports).to.include.members([
            "default"
        ]);

        let {imports} = readImportMap(`fixture/ant-design/web_modules/import-map.json`);
        expect(imports).to.include({
            "rc-resize-observer/es/index.js": "/web_modules/rc-resize-observer.js",
            "rc-resize-observer": "/web_modules/rc-resize-observer.js"
        });

    });

    it("can bundle moment (dependency of antd)", async function () {
        let {bundleWebModule} = useFixture("/react");
        await bundleWebModule("moment");
        expect(existsSync(join(__dirname, "fixture/react/web_modules/moment.js"))).to.be.true;
    });

    it("can bundle lodash (dependency of antd)", async function () {
        let {bundleWebModule, resolveImport} = useFixture("/react");
        expect(await resolveImport("util")).to.equal("/web_modules/util.js");
        await bundleWebModule("lodash");
        expect(existsSync(join(__dirname, "fixture/react/web_modules/lodash.js"))).to.be.true;
    });

    it("can bundle lit-html (with ts sourcemap)", async function () {

        let {bundleWebModule, resolveImport} = useFixture("/lit-html");

        await bundleWebModule("lit-html");

        let exports = readExports(`fixture/lit-html/web_modules/lit-html.js`);
        expect(exports).to.have.members([
            "AttributeCommitter",
            "AttributePart",
            "BooleanAttributePart",
            "DefaultTemplateProcessor",
            "EventPart",
            "NodePart",
            "PropertyCommitter",
            "PropertyPart",
            "SVGTemplateResult",
            "Template",
            "TemplateInstance",
            "TemplateResult",
            "boundAttributeSuffix",
            "createMarker",
            "defaultTemplateProcessor",
            "directive",
            "html",
            "isCEPolyfill",
            "isDirective",
            "isIterable",
            "isPrimitive",
            "isTemplatePartActive",
            "lastAttributeNameRegex",
            "marker",
            "markerRegex",
            "noChange",
            "nodeMarker",
            "nothing",
            "parts",
            "removeNodes",
            "render",
            "reparentNodes",
            "svg",
            "templateCaches",
            "templateFactory"
        ]);

        let {imports} = readImportMap(`fixture/lit-html/web_modules/import-map.json`);
        expect(imports).to.include.keys([
            "lit-html",
            "lit-html/lit-html.js",
            "lit-html/lib/default-template-processor.js",
            "lit-html/lib/parts.js",
            "lit-html/lib/directive.js",
            "lit-html/lib/dom.js",
            "lit-html/lib/part.js",
            "lit-html/lib/template-instance.js",
            "lit-html/lib/template.js",
            "lit-html/lib/template-result.js",
            "lit-html/lib/render.js",
            "lit-html/lib/template-factory.js"
        ]);

        await SourceMapConsumer.with(readSourceMap(`fixture/lit-html/web_modules/lit-html.js.map`), null, consumer => {
            expect(consumer.sources).to.include.members([
                "../../node_modules/lit-html/src/lib/directive.ts",
                "../../node_modules/lit-html/src/lib/dom.ts",
                "../../node_modules/lit-html/src/lib/part.ts",
                "../../node_modules/lit-html/src/lib/template.ts",
                "../../node_modules/lit-html/src/lib/template-instance.ts",
                "../../node_modules/lit-html/src/lib/template-result.ts",
                "../../node_modules/lit-html/src/lib/parts.ts",
                "../../node_modules/lit-html/src/lib/default-template-processor.ts",
                "../../node_modules/lit-html/src/lib/template-factory.ts",
                "../../node_modules/lit-html/src/lib/render.ts",
                "../../node_modules/lit-html/src/lit-html.ts"
            ]);

            // const directives = new WeakMap<object, true>();
            // -----------------------^ (17:23)

            expect(
                consumer.originalPositionFor({line: 2, column: 21})
            ).to.eql({
                source: "../../node_modules/lit-html/src/lib/directive.ts",
                line: 17,
                column: 23,
                name: null
            });

            //   (window['litHtmlVersions'] || (window['litHtmlVersions'] = [])).push('1.3.0');
            // ---^ (59:3)

            expect(
                consumer.generatedPositionFor({
                    source: "../../node_modules/lit-html/src/lit-html.ts",
                    line: 59,
                    column: 3
                })
            ).to.eql({
                line: 652, column: 2, lastColumn: 9
            });
        });

        expect(await resolveImport("lit-html/lib/render.js")).to.equal("/web_modules/lit-html.js");
        expect(await resolveImport("lit-html/lib/shady-render.js")).to.equal("/web_modules/lit-html/lib/shady-render.js");
        expect(await resolveImport("lit-html/directives/repeat.js")).to.equal("/web_modules/lit-html/directives/repeat.js");

        expect(
            readTextFile(`fixture/lit-html/web_modules/lit-html/directives/repeat.js`)
        ).to.have.string(
            `import { createMarker, directive, NodePart, removeNodes, reparentNodes } from "/web_modules/lit-html.js";`
        );
    });

    it("can bundle lit-html/lib/shady-render.js (minified)", async function () {

        let {bundleWebModule, resolveImport} = useFixture("/lit-html", {esbuild: {minify: true}});

        expect(await resolveImport("lit-html/lib/shady-render.js")).to.equal("/web_modules/lit-html/lib/shady-render.js");
        expect(existsSync(join(__dirname, "fixture/web_modules/lit-html/lib/shady-render.js"))).to.be.false;

        await bundleWebModule("lit-html/lib/shady-render.js");

        let exports = readExports(`fixture/lit-html/web_modules/lit-html.js`);
        expect(exports).to.have.members([
            "AttributeCommitter",
            "AttributePart",
            "BooleanAttributePart",
            "DefaultTemplateProcessor",
            "EventPart",
            "NodePart",
            "PropertyCommitter",
            "PropertyPart",
            "SVGTemplateResult",
            "Template",
            "TemplateInstance",
            "TemplateResult",
            "boundAttributeSuffix",
            "createMarker",
            "defaultTemplateProcessor",
            "directive",
            "html",
            "isCEPolyfill",
            "isDirective",
            "isIterable",
            "isPrimitive",
            "isTemplatePartActive",
            "lastAttributeNameRegex",
            "marker",
            "markerRegex",
            "noChange",
            "nodeMarker",
            "nothing",
            "parts",
            "removeNodes",
            "render",
            "reparentNodes",
            "svg",
            "templateCaches",
            "templateFactory"
        ]);

        let {imports} = readImportMap(`fixture/lit-html/web_modules/import-map.json`);
        expect(imports).to.include.keys([
            "lit-html",
            "lit-html/lit-html.js",
            "lit-html/lib/default-template-processor.js",
            "lit-html/lib/parts.js",
            "lit-html/lib/directive.js",
            "lit-html/lib/dom.js",
            "lit-html/lib/part.js",
            "lit-html/lib/template-instance.js",
            "lit-html/lib/template.js",
            "lit-html/lib/template-result.js",
            "lit-html/lib/render.js",
            "lit-html/lib/template-factory.js",
            "lit-html/lib/shady-render.js"
        ]);

        expect(statSync(join(__dirname, "fixture/lit-html/web_modules/lit-html.js")).size).to.be.lessThan(12000);
        expect(statSync(join(__dirname, "fixture/lit-html/web_modules/lit-html/lib/shady-render.js")).size).to.be.lessThan(25000);
    });

    it("to bundle lit-html is a prerequisite to bundle lit-html/lib/shady-render.js", async function () {
        let {bundleWebModule, resolveImport} = useFixture("/lit-html");
        await bundleWebModule("lit-html/lib/shady-render.js");
        expect(existsSync(join(__dirname, "fixture/lit-html/web_modules/lit-html.js"))).to.be.true;
    });

    it("to bundle lit-html is a prerequisite to bundle lit-html/lib/shady-render.js", async function () {
        let {bundleWebModule, resolveImport} = useFixture("/lit-html");
        await bundleWebModule("lit-html/lib/shady-render.js");
        expect(existsSync(join(__dirname, "fixture/lit-html/web_modules/lit-html.js"))).to.be.true;
    });

    it("can bundle lit-element", async function () {

        let {bundleWebModule} = useFixture("/lit-element");

        await bundleWebModule("lit-element");

        let exports = readExports(`fixture/lit-element/web_modules/lit-element.js`);
        expect(exports).to.have.members([
            "CSSResult",
            "LitElement",
            "ReactiveElement",
            "SVGTemplateResult",
            "TemplateResult",
            "UpdatingElement",
            "css",
            "customElement",
            "defaultConverter",
            "eventOptions",
            "html",
            "internalProperty",
            "notEqual",
            "property",
            "query",
            "queryAll",
            "queryAssignedNodes",
            "queryAsync",
            "state",
            "supportsAdoptingStyleSheets",
            "svg",
            "unsafeCSS"
        ]);

        let {imports} = readImportMap(`fixture/lit-element/web_modules/import-map.json`);
        expect(imports).to.include.keys([
            "lit-element",
            "lit-element/lib/css-tag.js",
            "lit-element/lit-element.js",
            "lit-html",
            "lit-html/lib/directive.js",
            "lit-html/lib/shady-render.js",
            "lit-html/lib/template.js",
            "lit-html/lit-html.js"
        ]);

        expect(
            readTextFile(`fixture/lit-element/web_modules/lit-element.js`)
        ).to.have.string(
            `// test/fixture/node_modules/lit-element/lit-element.js\n` +
            `import { render } from "/web_modules/lit-html/lib/shady-render.js";`
        );
    });

    it("can bundle bootstrap", async function () {

        let {bundleWebModule} = useFixture("/bootstrap");

        await bundleWebModule("bootstrap");

        let exports = readExports(`fixture/bootstrap/web_modules/bootstrap.js`);
        expect(exports).to.have.members([
            "Alert",
            "Button",
            "Carousel",
            "Collapse",
            "Dropdown",
            "Modal",
            "Popover",
            "Offcanvas",
            "Scrollspy",
            "Tab",
            "Toast",
            "Tooltip",
            "Util",
            "default"
        ]);

        await bundleWebModule("bootstrap/dist/css/bootstrap.css");

        let {imports} = readImportMap(`fixture/bootstrap/web_modules/import-map.json`);
        expect(imports).to.include.keys([
            "jquery/dist/jquery.js",
            "jquery",
            "popper.js/dist/esm/popper.js",
            "popper.js",
            "bootstrap/dist/js/bootstrap.js",
            "bootstrap",
            "bootstrap/dist/css/bootstrap.css"
        ]);

        expect(imports["bootstrap/dist/css/bootstrap.css"]).to.equal("/web_modules/bootstrap/dist/css/bootstrap.css");

        // expect(
        //     readTextFile(`fixture/bootstrap/web_modules/bootstrap/dist/css/bootstrap.js`)
        // ).to.have.string(
        //     `// sass:bootstrap/dist/css/bootstrap.css\ndocument.head.appendChild(document.createElement("style"))`
        // );
    });


    it("can bundle @babel/runtime/helpers/...", async function () {

        let {bundleWebModule} = useFixture("/babel-runtime");

        await bundleWebModule("@babel/runtime/helpers/esm/decorate.js");
        await bundleWebModule("@babel/runtime/helpers/esm/extends.js");

        let decorateContent = readTextFile(`fixture/babel-runtime/web_modules/@babel/runtime/helpers/esm/decorate.js`);

        expect(decorateContent).not.to.have.string("var require_arrayWithHoles = __commonJS((exports, module) => {");

        expect(decorateContent).to.have.string(
            "function _arrayWithHoles(arr) {\n" +
            "  if (Array.isArray(arr))\n" +
            "    return arr;\n" +
            "}"
        );

        let {imports} = readImportMap(`fixture/babel-runtime/web_modules/import-map.json`);
        expect(imports).to.have.keys([
            "@babel/runtime",
            "@babel/runtime/helpers/esm/decorate.js",
            "@babel/runtime/helpers/esm/extends.js"
        ]);

        expect(existsSync(`fixture/babel-runtime/web_modules/@babel/runtime.js`)).to.be.false;
    });


    it("can bundle redux & co.", async function (this: mocha.Context) {

        this.timeout(10000);

        let {bundleWebModule} = useFixture("/redux");

        await bundleWebModule("react-redux");
        await bundleWebModule("react-redux/es/connect/connect.js");

        return;

        await bundleWebModule("@reduxjs/toolkit");
        await bundleWebModule("redux");
        await bundleWebModule("redux-logger");
        await bundleWebModule("redux-thunk");
        await bundleWebModule("react-redux");

        let exports = readExports(`fixture/redux/web_modules/redux.js`);
        expect(exports).to.include.members([
            "applyMiddleware",
            "bindActionCreators",
            "combineReducers",
            "compose",
            "createStore"
        ]);

        expect(
            readTextFile(`fixture/redux/web_modules/@reduxjs/toolkit.js`)
        ).to.have.string(
            `import * as redux_star from "/web_modules/redux.js";`
        );

        let {imports} = readImportMap(`fixture/redux/web_modules/import-map.json`);
        expect(imports).to.include.keys([
            "@reduxjs/toolkit",
            "@reduxjs/toolkit/dist/redux-toolkit.esm.js",
            "react",
            "react-dom",
            "react-is",
            "react-redux",
            "react-redux/es/hooks/useStore.js",
            "react-redux/es/index.js",
            "react-redux/es/utils/batch.js",
            "react/index.js",
            "redux",
            "redux-logger",
            "redux-logger/dist/redux-logger.js",
            "redux-thunk",
            "redux-thunk/es/index.js",
            "redux/es/redux.js"
        ]);
    });

    it("react & react-dom share object-assign", async function (this: mocha.Context) {

        this.timeout(10000);

        let {bundleWebModule, resolveImport} = useFixture("/react");

        await bundleWebModule("react");
        await bundleWebModule("react-dom");

        let {imports} = readImportMap(`fixture/react/web_modules/import-map.json`);
        expect(imports["object-assign"]).to.equal("/web_modules/object-assign.js");

        expect(existsSync(join(__dirname, "/web_modules/object-assign.js"))).to.be.false;

        await bundleWebModule("object-assign/index.js");

        let exports = readExports(`fixture/react/web_modules/object-assign.js`);
        expect(exports).to.have.members([
            "default"
        ]);

        expect(await resolveImport("object-assign/index.js")).to.equal("/web_modules/object-assign.js");
    });

    it("can bundle @ant-design/icons", async function (this: mocha.Context) {

        this.timeout(60000);

        let {outDir, bundleWebModule, resolveImport} = useFixture("/ant-design");

        await bundleWebModule("@ant-design/icons");

        let {imports} = readImportMap(`/fixture/ant-design/web_modules/import-map.json`);
        expect(imports["@ant-design/icons"]).to.equal("/web_modules/@ant-design/icons.js");

        expect(existsSync(join(outDir, "/@ant-design/icons.js"))).to.be.true;
        expect(existsSync(join(outDir, "/@babel/runtime/helpers/esm/typeof.js"))).to.be.true;
    });
});
