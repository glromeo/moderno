const path = require("path");
const fs = require("fs");

// jest.mock("@moderno/logger", () => ({
//     trace: jest.fn(),
//     debug: jest.fn(),
//     info: jest.fn(),
//     warn: jest.fn(),
//     error: jest.fn()
// }));

const baseDir = path.resolve(__dirname, "..");
const rootDir = path.resolve(__dirname);

module.exports = {

    baseDir,
    rootDir,

    log: require("@moderno/logger"),

    resolve(filename) {
        return path.resolve(rootDir, filename);
    },

    readFileSync(filename) {
        try {
            return fs.readFileSync(path.resolve(rootDir, filename));
        } catch (ignored) {
            return fs.readFileSync(path.resolve(baseDir, filename));
        }
    },

    useFixture(options = {}) {

        const log = require("@moderno/logger");

        const {configure} = require("../../src/configure.ts");
        const {useWatcher} = require("../../src/watcher.ts");
        const {startServer} = require("../../src/server.ts");
        const fetch = require("node-fetch");
        const https = require("https");
        const fs = require("fs");
        const path = require("path");

        options.server = {port: Math.floor(3000 + Math.random() * 6000)};

        const config = configure({root: __dirname, options: `${__dirname}/es-next-server.config.js`}, options);

        const watcher = useWatcher(config);

        const {Readable, Writable} = require("stream");

        const fixture = {
            baseDir: process.cwd(),
            rootDir: __dirname,
            config: options,
            server: {
                async start() {
                    log.info("starting server on port:", config.server.port);
                    const {server, address} = await startServer(config);
                    fixture.server.instance = server;
                    fixture.server.address = address;
                    return server;
                },
                async stop() {
                    if (!fixture.server.instance) {
                        throw "server has not been started yet";
                    } else {
                        const stopped = fixture.server.instance.shutdown();
                        log.info("stopping server...");
                        return await stopped;
                    }
                }
            },
            fetch(pathname, options = {}) {
                if (!fixture.server.address) {
                    fail("server must be started before invoking fetch");
                }
                if (!options.agent) {
                    options.agent = new https.Agent({
                        ca: fs.readFileSync(`cert/codebite.pem`),
                        key: fs.readFileSync(`cert/localhost.key`),
                        cert: fs.readFileSync(`cert/localhost.crt`)
                    });
                }
                return fetch(fixture.server.address + pathname, options);
            },
            watcher,
            mock: {
                req(url = "/", {method = "GET", type = "json", headers = {}, payload = {}} = {}) {
                    const content = type === "json" ? JSON.stringify(payload) : qs.stringify(payload);
                    const req = Readable.from(method === "GET" || method === "OPTIONS" ? [] : [content]);
                    Object.assign(req, {
                        method,
                        mode: "cors",
                        cache: "no-cache",
                        credentials: "same-origin",
                        headers: {
                            "content-type": type === "json" ? "application/json" : "application/x-www-form-urlencoded",
                            ...headers
                        },
                        redirect: "follow",
                        referrerPolicy: "no-referrer"
                    });
                    return req;
                },
                res(options = {}) {
                    const res = new Writable();
                    const headers = new Map();
                    res._write = jest.fn().mockImplementation(function (chunk, encoding, done) {
                        res.data.push(chunk.toString());
                        done();
                    });
                    res.getHeader = jest.fn().mockImplementation((name) => headers.get(name));
                    res.hasHeader = jest.fn().mockImplementation((name) => headers.has(name));
                    res.removeHeader = jest.fn().mockImplementation((name) => headers.delete(name));
                    res.setHeader = jest.fn().mockImplementation((name, value) => headers.set(name, value));
                    res.end = jest.spyOn(res, "end");
                    return res;
                }
            },
            resolve() {
                return path.resolve(__dirname, ...arguments);
            }
        };

        return fixture;
    }
};
