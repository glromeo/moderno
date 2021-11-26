#! /usr/bin/env node
const log = require("@moderno/logger");
const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

(async () => {

    const startTime = Date.now();
    const headless = true;
    const devtools = false;

    process.on("unhandledRejection", (reason, p) => {
        log.error("Unhandled Rejection at Promise", p, reason);
    }).on("uncaughtException", err => {
        log.error("Uncaught Exception thrown", err);
    }).on("SIGINT", async () => {
        log.info("ctrl+c detected...");
        process.exit(0);
    }).on("exit", () => {
        log.info("puppeteer has done in:", Date.now() - startTime);
    });

    const browser = await puppeteer.launch({
        headless,
        devtools,
        defaultViewport: null,
        ignoreHTTPSErrors: true
    });

    const page = await browser.newPage();

    await page.evaluateOnNewDocument(`
        Object.defineProperty(window, "puppeteer", {value: true});
        Object.defineProperty(window, "headless", {value: ${headless}});
        Object.defineProperty(window, "devtools", {value: ${devtools}});
    `);

    await page.exposeFunction("backboneSend", message => {
        console.log(message);
    });

    await page.setRequestInterception(true);

    page.on("load", async () => {
    });

    page.on("request", async req => {

        req.respond({
            status: 200,
            headers: {},
            body: "Hello"
        });
    });

    let indent = `  `;

    const CONSOLE_MSG_TYPES = {
        debug: "debug",
        error: "error",
        warning: "warn",
        log: "info"
    };

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

    await page.goto(`https://localhost/workbench/headless.html`, {waitUntil: "load"});

    await browser.close();

})();
