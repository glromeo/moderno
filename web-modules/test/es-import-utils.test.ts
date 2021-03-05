import {expect} from "chai";
import {pathnameToModuleUrl, isBare, parseModuleUrl, toPosix} from "../src";
import * as path from "path";
import log from "@moderno/logger";

log.level = "error";

describe("ES Import Utils", function () {

    it("isBare", function () {
        expect(isBare("a:b/c")).to.be.true;
        expect(isBare("C:/Folder/file.txt")).to.be.false;
        expect(isBare("C:\\Folder\\file.txt")).to.be.false;
        expect(isBare(".")).to.be.false;
        expect(isBare("..")).to.be.false;
        expect(isBare("./")).to.be.false;
        expect(isBare("../")).to.be.false;
        expect(isBare(".a")).to.be.true;
        expect(isBare("..a")).to.be.true;
        expect(isBare("/root")).to.be.false;
    });

    it("pathnameToModuleUrl", async function () {

        const sep = path.sep;

        expect(pathnameToModuleUrl("anode_modules/abc/def"))
            .to.equal("anode_modules/abc/def");

        expect(pathnameToModuleUrl(`${sep}node_modulesque${sep}abc${sep}def`))
            .to.equal("/node_modulesque/abc/def");

        expect(pathnameToModuleUrl("/moderno/node_modules/@babel/core/lib/parse.js"))
            .to.equal("@babel/core/lib/parse.js");

        expect(pathnameToModuleUrl("abc/def"))
            .to.equal("abc/def");

        expect(pathnameToModuleUrl(`C:${sep}moderno${sep}node_modules${sep}@babel${sep}core${sep}lib${sep}parse.js`))
            .to.equal("@babel/core/lib/parse.js");

    });

    it("parsePathname", function () {

        expect(parseModuleUrl("@module/name/path/file.ext")).to.eql([
            "@module/name",
            "path/file.ext"
        ]);
        expect(parseModuleUrl("module/base/path/file.ext")).to.eql([
            "module",
            "base/path/file.ext"
        ]);
        expect(parseModuleUrl("module.ext")).to.eql([
            "module.ext",
            null
        ]);
        expect(parseModuleUrl("/path/file.ext")).to.eql([
            null,
            "/path/file.ext"
        ]);
        expect(parseModuleUrl("./file.ext")).to.eql([
            null,
            "./file.ext"
        ]);
        expect(parseModuleUrl("../file.ext")).to.eql([
            null,
            "../file.ext"
        ]);
        expect(parseModuleUrl(".module/file.ext")).to.eql([
            ".module",
            "file.ext"
        ]);
        expect(parseModuleUrl("@/path/file.ext")).to.eql([
            "@/path",
            "file.ext"
        ]);
    });

    it("toPosix", function () {

        const sep = path.sep;

        expect(toPosix(`C:${sep}Folder${sep}file.txt`)).to.equal("C:/Folder/file.txt");
        expect(toPosix(`C:${sep}Folder${sep}file.txt`)).to.equal("C:/Folder/file.txt");
    });

});
