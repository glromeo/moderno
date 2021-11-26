describe("babel transformer", function () {

    // describe("unit tests", function () {

        // const {useBabelTransformer} = require("lib/pipeline/babel-transformer.ts");
        // const {babelTransformer} = useBabelTransformer({
        //     rootDir: `${__dirname}/fixture`,
        //     babel: {
        //         babelrc: false,
        //         caller: {
        //             name: "@moderno/server",
        //             supportsStaticESM: true
        //         },
        //         sourceType: "module",
        //         sourceMaps: true,
        //         plugins: [
        //             ["@babel/plugin-syntax-import-meta"]
        //         ]
        //     }
        // });
        //
        // it("css", async function () {
        //
        //     const {content:actual} = await babelTransformer("testfile.js", `
        //         require("./fixture/sample.css");
        //         import("./fixture/sample.css");
        //         import("./fixture/sample.css").then(()=>{});
        //         const STYLES = require("./fixture/sample.css");
        //         import styles from "./fixture/sample.css";
        //         import "./fixture/sample.css";
        //     `);
        //     expect(actual.replace(/\s+/g, " ").trim()).toMatch(`
        //         import styles from "/fixture/sample.css?type=module";
        //         import "/fixture/sample.css?type=module";
        //     `.replace(/\s+/g, " ").trim());
        // })

    // });

    describe("integration tests", function () {

        const {useFixture} = require("fixture/index.js");
        const {server: {start, stop}, fetch} = useFixture();

        beforeAll(start);
        afterAll(stop);

        it("can resolve bare import graphql-tag", async function () {

            const js = await fetch("/src/graphql-tag-importer.js").then(response => {
                expect(response.status).toBe(200);
                return response.text();
            });

            expect(js).toContain("import gql from \"/web_modules/graphql-tag/src/index.ts\";");
        });

        it("can transpile cjs to es2015", async function () {

            const js = await fetch("/web_modules/graphql-tag/src/index.js").then(response => {
                expect(response.status).toBe(200);
                return response.text();
            });

            const expected = expect(js);
            expected.toContain(`import e from"/web_modules/graphql/language/parser";`);
            expected.toContain("var s=c;export default s;");
        });

        it("graphql parser.js has a default export", async function () {

            const js = await fetch("/web_modules/graphql/language/parser.mjs").then(response => {
                expect(response.status).toBe(200);
                return response.text();
            });

            expect(js).toContain(`import{isCollection as e,forEach as n,getAsyncIterator as t,$$asyncIterator as r,isAsyncIterable as i}from"/web_modules/iterall";`);
        });

        it("can resolve lit-element", async function () {

            const js = await fetch("/src/hello-world.mjs").then(response => {
                expect(response.status).toBe(200);
                return response.text();
            });

            const expected = expect(js);
            expect(js).toContain("import { customElement, html, LitElement } from \"/web_modules/lit-element/lit-element.js\";");
        });

        it("can resolve scss", async function () {

            const js = await fetch("/src/styled-component.mjs").then(response => {
                expect(response.status).toBe(200);
                return response.text();
            });

            const expected = expect(js);
            expect(js).toContain("import style from \"/src/w3.scss?type=module\";");
        });

    });

});
