const log = require("@moderno/logger");
const {basename, join, parse} = require("path");
const {readFileSync, writeFileSync} = require("fs");
const {parse: parseURL} = require("fast-url-parser");

module.exports = function (router, {rootDir}, watcher) {

    router.get("/snapshots", function (req, res) {
        log.debug("load snapshots");
        const {query} = parseURL(req.url, true);
        if (query.spec) {
            const {dir, name} = parse(query.spec);
            const path = join(rootDir, dir, name + ".snapshots.json");
            res.writeHead(200, {
                "content-type": "application/json; charset=UTF-8"
            });
            try {
                res.end(readFileSync(path, "UTF-8"));
            } catch (e) {
                log.warn(`couldn't read snapshots for '${basename(path)}'`, e.code === "ENOENT" ? "not found" : e);
                res.end("{}");
            }
        } else {
            res.writeHead(200, {
                "content-type": "application/json; charset=UTF-8"
            });
            res.end("{}");
        }
    });

    router.put("/snapshots", function (req, res) {
        log.debug("save snapshots");
        const {query} = parseURL(req.url, true);
        if (query.spec) {
            const {dir, name} = parse(query.spec);
            const path = join(rootDir, dir, name + ".snapshots.json");
            try {
                let data = "";
                req.on("data", chunk => {
                    data += chunk;
                });
                req.on("end", () => {
                    try {
                        writeFileSync(path, data);
                    } catch (e) {
                        log.warn("couldn't write snapshots in:", path, e);
                    }
                });
            } catch (e) {
            }
            res.writeHead(200);
            res.end();
        } else {
            res.writeHead(404);
            res.end();
        }
    });
};
