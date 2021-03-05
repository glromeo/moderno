import mime from "../src/util/mime-types";

describe("mime types", function () {

    it("lookup by plain ext without .", function () {
        expect(mime.contentType("js")).to.equal("application/javascript; charset=UTF-8");
        expect(mime.contentType()).to.be.undefined;
    });

    it(". is supported but discouraged", function () {
        expect(mime.contentType(".js")).to.equal("application/javascript; charset=UTF-8");
    });

    it("supports ts, tsx and jsx", function () {
        expect(mime.contentType("ts")).to.equal("application/x-typescript; charset=UTF-8");
        expect(mime.contentType("tsx")).to.equal("application/x-typescript; charset=UTF-8");
        expect(mime.contentType("jsx")).to.equal("application/javascript; charset=UTF-8");
    });

    it("can lookup by full filename (no urls!)", function () {
        expect(mime.contentType("path/file.html")).to.equal("text/html; charset=UTF-8");
        expect(mime.contentType("path/file.html?q=v")).to.be.undefined;
        expect(mime.contentType("path/file")).to.be.undefined;
    });

});
