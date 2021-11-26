const log = require("@moderno/logger");
const {expect} = require("chai");
const {config: {rootDir}} = require("@moderno/server");
const {readdirSync, unlinkSync, readFileSync, existsSync, createReadStream} = require("fs");
const http = require("http");
const path = require("path");
const puppeteer = require("puppeteer");

describe("integration test", function () {

    const port = 8080;
    const sockets = new Set();

    before(async function () {

        this.server = http.createServer({}, function (req, res) {
            res.writeHead(200, {
                "content-type": req.url.endsWith("html")
                    ? "text/html; charset=UTF-8"
                    : req.url.endsWith("css")
                        ? "text/css; charset=UTF-8"
                        : req.url.endsWith("js")
                            ? "application/javascript; charset=UTF-8"
                            : "text/plain; charset=UTF-8"
            });
            const basedir = req.url.startsWith("/node_modules")
                ? path.resolve(__dirname, "..")
                : __dirname;
            const filename = path.join(basedir, req.url);
            log.info(filename);
            const rs = createReadStream(filename);
            rs.on("error", function (error) {
                res.end(error.message);
            });
            rs.pipe(res);
        }).listen(port);

        await new Promise(resolve => this.server.on("listening", resolve));

        this.server.on("connection", (socket) => {
            sockets.add(socket);
            socket.once("close", function () {
                return sockets.delete(socket);
            });
        });

        this.browser = await puppeteer.launch({headless: false});
    });

    after(async function () {

        this.server.close();

        for (const socket of sockets) {
            socket.destroy();
            sockets.delete(socket);
        }

        this.browser.close();
    });

    it("server", async function () {

        this.timeout(Number.MAX_SAFE_INTEGER);

        await new Promise(resolve => {
        });

    });

    it("puppeteer", async function () {

        this.timeout(Number.MAX_SAFE_INTEGER);

        const page = await this.browser.newPage();
        await page.goto(`http://localhost:${port}/fixture/index.html`, {waitUntil: "load"});

        page.on("console", msg => log.info("page:", msg.text()));

        await page.addScriptTag({type: "text/javascript", path: "./runner.js"});
        await page.evaluate(() => {
            return Promise.resolve(jasmine).then(async function () {
                await import("./sample.test.js");
                jasmine.getEnv().execute();
                return jasmineDone;
            });
        });

        log.info(await page.content());

        await new Promise(resolve => {
        });
    });
});
