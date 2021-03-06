import {expect} from "chai";
import * as path from "path";
import {useWebModules} from "../src";
import {readWorkspaces} from "../src/workspaces";
import log from "@moderno/logger";

log.level = "error";

describe("workspaces", function () {

    let {resolveImport} = useWebModules({
        rootDir: path.join(__dirname, "fixture/workspaces"),
        resolve: {paths: [path.join(__dirname, "fixture/workspaces/node_modules")]},
        clean: true
    })

    it("can resolve workspaces modules", async function () {
        // expect(await resolveImport("module-a")).to.equal("/workspaces/module-a/index.js");
        //
        // expect(await resolveImport("module-b")).to.equal("/workspaces/group/module-b/index.js");

        expect(await resolveImport("module-c").catch(err => err.message))
            .to.match(/Cannot find module 'module-c'/);

        expect(await resolveImport("@workspaces/module-c")).to.equal("/workspaces/group/module-c/index.js");

        expect(await resolveImport("whatever").catch(err => err.message))
            .to.match(/Cannot find module 'whatever'/);
    });

    it("can scan workspace fixture", async function () {

        let {imports} = readWorkspaces(path.join(__dirname, "fixture"));

        expect(Object.keys(imports)).to.have.members([
            "@test/fixture",
            "@fixture/babel-runtime",
            "@fixture/bootstrap",
            "@fixture/lit-element",
            "@fixture/lit-html",
            "@fixture/react",
            "@fixture/redux",
            "@fixture/iife",
            "@fixture/ant-design"
        ]);
    })

});
