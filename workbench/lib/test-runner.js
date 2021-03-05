#! /usr/bin/env node
const log = require("@moderno/logger");
const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

const HttpStatus = require("http-status-codes");

const {configure} = require("server/lib/configure.js");
const {createWatcher} = require("server/lib/watcher.js");
const {useResourceProvider} = require("server/lib/resource-provider.js");

const WS_CONFIG_FILE = "websockets.config.js";

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

    const config = configure(args, {...require("../index.js")});

    const watcher = createWatcher(config);

    const {provideResource} = useResourceProvider(config, watcher);

    const listeners = new Map();

    log.level = "debug";

    function on(name, listener) {
        listeners.set(name, listener);
        log.info("added message listener:", name);
    }

    for (const basedir of Object.values(config.mount)) {
        const filename = path.resolve(config.rootDir, basedir, WS_CONFIG_FILE);
        if (fs.existsSync(filename)) {
            const module = path.resolve(config.rootDir, filename);
            const context = {
                dirname: path.dirname(module),
                filename: module
            };
            require(module).call(context, config, watcher, on);
        }
    }

    function marshall(header, payload) {
        return payload ? `${header}:${JSON.stringify(payload)}` : header;
    }

    function unmarshall(message) {
        const sep = message.indexOf(":");
        let header, payload;
        if (sep !== -1) {
            header = message.substring(0, sep);
            payload = JSON.parse(message.substring(sep + 1));
        } else {
            header = message;
        }
        return {header, payload};
    }

    process.on("unhandledRejection", (reason, p) => {
        log.error("Unhandled Rejection at Promise", p, reason);
    }).on("uncaughtException", err => {
        log.error("Uncaught Exception thrown", err);
    }).on("SIGINT", async () => {
        log.info("ctrl+c detected...");
        process.exit(0);
    }).on("exit", () => {
        log.info("finished in:", Date.now() - startTime);
    });

    const browser = await puppeteer.launch({
        headless: false && headless,
        devtools: true|| devtools,
        defaultViewport: null,
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
    ];

    [
        // "/components/bs-button/bs-button.test.js",
        // "/components/bs-button/nested.test.js",
        "/components/bs-button/simple.test.js"

    ].forEach((spec, specIndex) => {

        const pageIndex = specIndex % pagePool.length;

        pagePool[pageIndex] = new Promise(async (resolve, reject) => {

            const page = await pagePool[pageIndex];

            await page.evaluateOnNewDocument(`
                Object.defineProperty(window, "puppeteer", {value: true});
                Object.defineProperty(window, "headless", {value: ${headless}});
                Object.defineProperty(window, "devtools", {value: ${devtools}});
            `);

            await page.exposeFunction("backboneSend", message => {
                const {header, payload} = unmarshall(message);
                const listener = listeners.get(header);
                if (listener) {
                    listener.call(listeners, payload, (header, payload) => {
                        // ws.send(marshall(header, payload))
                    });
                }
            });

            await page.setRequestInterception(true);

            page.on("load", async () => {
                await page.evaluate(time => {
                    window.backboneReceive(`connected:${time}`);
                }, JSON.stringify({since: new Date().toUTCString()}));
            });

            page.on("request", async req => {

                const url = req.url();
                log.debug(req.method(), url);

                if (url === "https://localhost/workbench.config") {
                    if (config.workbench) {
                        const cfg = {...config.workbench};
                        for (const key of Object.keys(cfg)) {
                            if (typeof cfg[key] === "function") {
                                cfg[key] = {__function__: cfg[key].toString()};
                            }
                        }
                        req.respond({
                            status: 200,
                            contentType: "application/json; charset=UTF-8",
                            body: JSON.stringify(cfg)
                        });
                    } else {
                        req.respond({
                            status: 404,
                            contentType: "text/plain",
                            body: "Not Found!"
                        });
                    }
                    return;
                }

                try {
                    const {content, headers} = await provideResource(url, req.headers());

                    req.respond({
                        status: 200,
                        headers,
                        body: content
                    });

                } catch (error) {
                    const {code, headers = {}, message, stack} = error;
                    if (stack) {
                        const code = HttpStatus.INTERNAL_SERVER_ERROR;
                        const text = HttpStatus.getStatusText(code);
                        log.error`${code} '${text}' handling: ${url}`;
                        log.error(error);

                        req.respond({
                            status: code,
                            headers,
                            body: stack
                        });

                    } else {
                        const text = HttpStatus.getStatusText(code);
                        if (code === 308) {
                            // todo: check permanent redirect behaviour
                            log.warn`${code} '${text}' ${url} -> ${headers.location}`;
                        } else {
                            log.error`${code} '${text}' ${message || "handling: " + url}`;
                        }

                        req.respond({
                            status: code,
                            headers,
                            body: message
                        });
                    }
                }


            });

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

            await page.goto(`https://localhost/workbench/dist/headless.html?spec=${spec}`, {waitUntil: "load"});

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

})();
