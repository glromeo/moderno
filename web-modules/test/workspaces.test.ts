import log from "@moderno/logger";
import {fail} from "assert";
import {expect} from "chai";
import * as path from "path";
import {useWebModules} from "../src";
import {readWorkspaces} from "../src/workspaces";

log.level = "error";

describe("workspaces", function () {

    let {resolveImport} = useWebModules({
        rootDir: path.join(__dirname, "fixture/workspaces"),
        resolve: {paths: [path.join(__dirname, "fixture/workspaces/node_modules")]},
        clean: true
    });

    it("can resolve workspaces modules", async function () {
        expect(await resolveImport("module-a")).to.equal("/workspaces/module-a/styles.scss");

        try {
            await resolveImport("module-b");
            fail("despite the directory for the module is there the index.js is missing");
        } catch ({message}) {
            expect(message).to.match(/Cannot find module 'module-b'/);
        }
        try {
            await resolveImport("module-c");
            fail("module-c should be imported as @workspaces/module-c");
        } catch ({message}) {
            expect(message).to.match(/Cannot find module 'module-c'/);
        }

        expect(await resolveImport("@workspaces/module-c")).to.equal("/workspaces/group/module-c/index.js");

        try {
            await resolveImport("whatever");
            fail("whatever should not resolve");
        } catch ({message}) {
            expect(message).to.match(/Cannot find module 'whatever'/);
        }
    });

    it("can scan workspace fixture", async function () {

        let workspaces = readWorkspaces(path.join(__dirname, "fixture"));

        expect([...workspaces]).to.have.members([
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
    });

});
