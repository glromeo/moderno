import {expect} from "chai";
import * as path from "path";
import {useWebModules, WebModulesOptions} from "../src";
import log from "@moderno/logger";

log.level = "error";

describe("resolve import", function () {

    function setup(dirname: string) {
        const rootDir = path.resolve(__dirname, dirname);
        const webModulesDir = path.resolve(__dirname, "fixture/web_modules");

        const options: WebModulesOptions = {
            clean: true,
            rootDir: rootDir,
            environment: "development",
            resolve: {
                paths: [path.resolve(__dirname, "fixture/node_modules")]
            },
            external: [],
            esbuild: {}
        };
        return {
            rootDir,
            webModulesDir,
            ...useWebModules(options)
        };
    }

    it("urls go unmodified", async function () {

        let {resolveImport} = setup("fixture");

        expect(await resolveImport("http://127.0.0.1:8080/echo?query=message"))
            .to.equal("http://127.0.0.1:8080/echo?query=message");
        expect(await resolveImport("file:///echo.do?query=message"))
            .to.equal("file:///echo.do?query=message");
    });

    it("if an importMap import is present for the pathname resolve to it", async function () {

        let {resolveImport, importMap} = setup("fixture");

        importMap.imports = {
            "wathever/pathname": "expected/result"
        };

        expect(await resolveImport("wathever/pathname")).to.equal("expected/result");
        expect(await resolveImport("wathever/pathname?query=preserved")).to.equal("expected/result?query=preserved");
    });

    it("a bundled file is resolved to the web module, even if its ext is missing", async function () {

        let {resolveImport, importMap} = setup("fixture");

        importMap.imports = {};

        expect(await resolveImport("lit-html/lib/default-template-processor")).to.equal("/web_modules/lit-html.js");
    });

    it("typescript sourcefiles in modules are treated as assets (not bundled)", async function () {

        let {resolveImport, importMap} = setup("fixture");

        importMap.imports = {};

        expect(await resolveImport("lit-html/src/lit-html")).to.equal("/node_modules/lit-html/src/lit-html.ts");
    });

    it("extensionless files are left extensionless", async function () {

        let {rootDir, resolveImport, importMap} = setup("fixture");

        importMap.imports = {};

        expect(await resolveImport("lit-html/LICENSE")).to.equal("/node_modules/lit-html/LICENSE");
    });

    it("directories resolve to index", async function () {

        let {rootDir, resolveImport, importMap} = setup("fixture");

        importMap.imports = {};

        expect(await resolveImport("./home")).to.equal("./home/index.ts");
        expect(await resolveImport("./home", path.join(rootDir, "importer.ts"))).to.equal("./home/index.ts");
        expect(await resolveImport("./home", path.join(rootDir, "importer.js"))).to.equal("./home/index.ts");
    });

    it("relative imports", async function () {

        let {rootDir, resolveImport} = setup("fixture/workspaces");

        expect(await resolveImport("./epsilon.alpha", "/importer.js")).to.equal("./epsilon.alpha?type=module");

        // should resolve fixture/alpha/beta/delta.sigma adding query for type=module
        expect(await resolveImport("./delta.sigma", "/importer.js")).to.equal(
            "./delta.sigma?type=module"
        );
        // ...leaving any existing query alone
        expect(await resolveImport("./delta.sigma?q=e", "/importer.js")).to.equal("./delta.sigma?type=module&q=e");

    });


    it("lit-html/lit-html.js", async function () {

        let {rootDir, webModulesDir, resolveImport, importMap} = setup("fixture");

        importMap.imports = {
            "@fixture/lit-element": "/workspaces/index.js",
            "lit-html/lit-html.js": "/web_modules/lit-html.js",
            "lit-html/lib/default-template-processor.js": "/web_modules/lit-html.js",
            "lit-html/lib/parts.js": "/web_modules/lit-html.js",
            "lit-html/lib/directive.js": "/web_modules/lit-html.js",
            "lit-html/lib/dom.js": "/web_modules/lit-html.js",
            "lit-html/lib/part.js": "/web_modules/lit-html.js",
            "lit-html/lib/template-instance.js": "/web_modules/lit-html.js",
            "lit-html/lib/template.js": "/web_modules/lit-html.js",
            "lit-html/lib/template-result.js": "/web_modules/lit-html.js",
            "lit-html/lib/render.js": "/web_modules/lit-html.js",
            "lit-html/lib/template-factory.js": "/web_modules/lit-html.js",
            "lit-html": "/web_modules/lit-html.js"
        };

        expect(await resolveImport("lit-html")).to.equal(
            "/web_modules/lit-html.js"
        );
        expect(await resolveImport("lit-html/lit-html.js")).to.equal(
            "/web_modules/lit-html.js"
        );
        expect(await resolveImport("lit-html/lib/parts.js")).to.equal(
            "/web_modules/lit-html.js"
        );
        expect(await resolveImport("lit-html/lib/shady-render.js")).to.equal(
            "/web_modules/lit-html/lib/shady-render.js"
        );
        expect(await resolveImport("lit-html/directives/unsafe-html.js")).to.equal(
            "/web_modules/lit-html/directives/unsafe-html.js"
        );
    });

    it("bootstrap", async function () {
        let {resolveImport} = setup("fixture");
        expect(await resolveImport("bootstrap")).to.equal("/web_modules/bootstrap.js");
        expect(await resolveImport("bootstrap/dist/css/bootstrap.css", "/importer.js")).to.equal(
            "/node_modules/bootstrap/dist/css/bootstrap.css?type=module"
        );
    });

    it("lit-html", async function () {
        let {resolveImport} = setup("fixture");
        expect(await resolveImport("lit-html")).to.equal("/web_modules/lit-html.js");
        expect(await resolveImport("lit-html/lit-html.js")).to.equal("/web_modules/lit-html.js");
        expect(await resolveImport("lit-html/lib/render.js")).to.equal("/web_modules/lit-html.js");
        expect(await resolveImport("lit-html/lib/shady-render.js")).to.equal("/web_modules/lit-html/lib/shady-render.js");
    });

    it("relative imports of asset files", async function () {
        let {resolveImport} = setup("fixture");
        expect(await resolveImport("./styles")).to.equal("./styles"); // This falls under ext-less case
        expect(await resolveImport("./styles", "/importer.js")).to.equal("./styles?type=module");
        expect(await resolveImport("./styles.css", "/importer.js")).to.equal("./styles.css?type=module");
        expect(await resolveImport("../styles.scss", "/importer.js")).to.equal("../styles.scss?type=module");
    });

    it("tippy.js", async function () {
        let {resolveImport} = setup("fixture");
        expect(await resolveImport("tippy.js")).to.equal("/web_modules/tippy.js");
    });

    it("react-icons/bs imported from a .tsx file", async function () {
        let {resolveImport} = setup("fixture");
        expect(await resolveImport("react-icons/bs")).to.equal("/web_modules/react-icons/bs/index.esm.js");
        expect(await resolveImport("react-icons/bs", "/importer.tsx")).to.equal("/web_modules/react-icons/bs/index.esm.js");
    })

});
