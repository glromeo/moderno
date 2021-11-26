#! /usr/bin/env node
const log = require("@moderno/logger");
const puppeteer = require("puppeteer");

const {configure} = require("server/lib/configure.js");
const {startServer} = require("server/lib/server.js");

const args = require("yargs")
    .scriptName("test-runner")
    .usage("$0 <cmd> [args]")
    .option("config", {
        alias: ["c"],
        description: "Specify server config file (this will override base config as appropriate)",
        type: "string"
    })
    .option("root", {
        alias: ["rootDir", "r"],
        description: "root directory (defaults to the process current working directory)",
        type: "string"
    })
    .option("module", {
        alias: ["m"],
        description: "Add module to the server (a module is a server plugin)",
        type: "string"
    })
    .option("debug", {
        alias: ["d"],
        description: "debug",
        type: "boolean"
    })
    .option("interactive", {
        alias: ["i"],
        description: "interactive",
        type: "boolean"
    })
    .option("devtools", {
        alias: ["t"],
        description: "devtools",
        type: "boolean"
    })
    .help()
    .alias("help", "h").argv;

(async () => {

    const startTime = Date.now();
    const headless = !args.interactive;
    const devtools = args.devtools;

    const config = configure(args, {
        ...require("../index.js"),
        server: {
            port: 4000
        }
    });

    const {server} = await startServer(config).then(runtime => {
        const {server} = runtime;
        process
            .on("unhandledRejection", (reason, p) => {
                log.error("Unhandled Rejection at Promise", p, reason);
            })
            .on("uncaughtException", err => {
                log.error("Uncaught Exception thrown", err);
            })
            .on("SIGINT", async () => {
                log.info("ctrl+c detected...");
                await server.shutdown();
                process.exit(0);
            })
            .on("exit", () => {
                log.info("finished in:", Date.now() - startTime);
            });
        return runtime;
    }).catch(error => {
        log.error("unable to start server", error);
        process.exit(2);
    });

    const browser = await puppeteer.launch({
        headless,
        devtools,
        ignoreHTTPSErrors: true
    });

    const CONSOLE_MSG_TYPES = {
        debug: "debug",
        error: "error",
        warning: "warn",
        log: "info"
    };

    const pagePool = [
        browser.newPage(),
        browser.newPage(),
        browser.newPage(),
        browser.newPage()
    ];

    [
        "/components/bs-button/bs-button.test.js",
        "/components/bs-button/nested.test.js",
        "/components/bs-button/simple.test.js"

    ].forEach((spec, specIndex) => {

        const pageIndex = specIndex % pagePool.length;

        pagePool[pageIndex] = new Promise(async (resolve, reject) => {

            const page = await pagePool[pageIndex];

            let indent = `spec ${specIndex}: `;

            page.on("console", msg => {
                const type = msg.type();
                if (type === "startGroup") {
                    log.info(indent + msg.text());
                    indent += "|   ";
                    return;
                } else if (type === "endGroup") {
                    indent = indent.slice(0, -4);
                    return;
                }
                const level = CONSOLE_MSG_TYPES[type] || "info";
                log[level](indent + msg.text());
            });

            await page.goto(`https://localhost:4000/workbench/headless.html?spec=${spec}`, {waitUntil: "load"});

            page.evaluate(function () {
                return window.jasmineDone;
            }).then(function (status) {
                log.info(status);
                resolve(page);
            }).catch(function (error) {
                log.info("error:", error.message, error.stack);
                resolve(page);
            });

        });

    });

    await Promise.all(pagePool);

    await browser.close();

    await server.shutdown();
})();
