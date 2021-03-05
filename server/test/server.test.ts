describe("server", function () {

    const {configure} = require("lib/configure.ts");

    const http = require("http");
    const http2 = require("http2");
    const https = require("https");

    const {readFileSync} = require("fs");
    const {startServer} = require("lib/server.ts");
    const {contentText} = require("lib/util/content-utils.js");
    const fetch = require("node-fetch");

    const ca = readFileSync(`cert/codebite.pem`, "UTF-8");

    jest.mock("lib/request-handler.ts", function () {
        return {
            createRequestHandler(config, watcher) {
                expect(watcher).toBeDefined();
                return function (req, res) {
                    const isHttp2 = parseFloat(req.httpVersion) >= 2;
                    if (req.method === "POST") {
                        res.writeHead(200, isHttp2 ? undefined : "OK", {
                            "content-type": req.headers["content-type"]
                        });
                        req.pipe(res);
                    } else {
                        res.writeHead(200, isHttp2 ? undefined : "OK", {
                            "content-type": "text/plain; charset=UTF-8"
                        });
                        res.end("HELLO");
                    }
                };
            }
        };
    });

    describe("basic http functionality", function () {

        const config = configure({root: "test/fixture/server"}, {
            server: {
                protocol: "http",
                port: 8080
            },
            http2: false
        });

        let module, server, address;

        beforeAll(async function () {
            const instance = await startServer(config);
            module = instance.module;
            server = instance.server;
            address = instance.address;
        });

        afterAll(async function () {
            await server.shutdown();
        });

        it("the server was started using http module", function () {
            expect(module).toStrictEqual(http);
        });

        it("simple get functionality", async function () {
            expect(await fetch(`${address}/`).then(res => {
                expect(res.ok).toBe(true);
                expect(res.headers.get("content-type")).toBe("text/plain; charset=UTF-8");
                return res.text();
            })).toMatch("HELLO");
        });

        it("simple post functionality", async function () {
            expect(await fetch(`${address}/`, {
                method: "POST",
                headers: {"content-type": "application/json; charset=UTF-8"},
                body: JSON.stringify({message: "HELLO"})
            }).then(res => {
                expect(res.ok).toBe(true);
                expect(res.headers.get("content-type")).toBe("application/json; charset=UTF-8");
                return res.json();
            }).then(({message}) => {
                return message;
            })).toMatch("HELLO");
        });
    });

    describe("basic https functionality", function () {

        const config = configure({root: "test/fixture/server"}, {
            server: {
                port: 8443
            },
            http2: false
        });

        let module, server, address, agent;

        beforeAll(async function () {
            const instance = await startServer(config);
            module = instance.module;
            server = instance.server;
            address = instance.address;
            agent = new https.Agent({ca});
        });

        afterAll(async function () {
            await server.shutdown();
        });

        it("the server was started using http module", function () {
            expect(module).toStrictEqual(https);
        });

        it("simple get functionality", async function () {
            expect(await fetch(`${address}/`, {agent}).then(res => {
                expect(res.ok).toBe(true);
                expect(res.headers.get("content-type")).toBe("text/plain; charset=UTF-8");
                return res.text();
            })).toMatch("HELLO");
        });

        it("simple post functionality", async function () {
            expect(await fetch(`${address}/`, {
                agent,
                method: "POST",
                headers: {"content-type": "application/json; charset=UTF-8"},
                body: JSON.stringify({message: "HELLO"})
            }).then(res => {
                expect(res.ok).toBe(true);
                expect(res.headers.get("content-type")).toBe("application/json; charset=UTF-8");
                return res.json();
            }).then(({message}) => {
                return message;
            })).toMatch("HELLO");
        });
    });

    describe("basic http2 functionality", function () {

        const config = configure({root: "test/fixture/server"}, {
            server: {
                port: 9443
            },
            http2: "preload"
        });

        let module, server, address, agent;

        beforeAll(async function () {
            const instance = await startServer(config);
            module = instance.module;
            server = instance.server;
            address = instance.address;
            agent = new https.Agent({ca});
        });

        afterAll(async function () {
            await server.shutdown();
        });

        it("the server was started using http2 module", function () {
            expect(module).toStrictEqual(http2);
        });

        it("simple get functionality", async function () {
            expect(await fetch(`${address}/`, {agent}).then(res => {
                expect(res.ok).toBe(true);
                expect(res.headers.get("content-type")).toBe("text/plain; charset=UTF-8");
                return res.text();
            })).toMatch("HELLO");
        });

        it("simple post functionality", async function () {
            expect(await fetch(`${address}/`, {
                agent,
                method: "POST",
                headers: {"content-type": "application/json; charset=UTF-8"},
                body: JSON.stringify({message: "HELLO"})
            }).then(res => {
                expect(res.ok).toBe(true);
                expect(res.headers.get("content-type")).toBe("application/json; charset=UTF-8");
                return res.json();
            }).then(({message}) => {
                return message;
            })).toMatch("HELLO");
        });

        it("http2 connect", async function () {

            const client = http2.connect(`${address}`, {ca});

            await Promise.all([
                new Promise(async done => {
                    const get = client.request({
                        ":path": "/",
                        ":method": "GET"
                    });
                    get.on("response", async (headers, flags) => {
                        expect(headers[":status"]).toBe(200);
                        expect(headers["content-type"]).toBe("text/plain; charset=UTF-8");
                        expect(flags).toBe(4);
                        expect(await contentText(get)).toMatch("HELLO");
                        done();
                    });
                }),
                new Promise(async done => {
                    const post = client.request({
                        ":path": "/",
                        ":method": "POST",
                        "content-type": "application/json; charset=UTF-8"
                    });
                    post.on("response", async (headers, flags) => {
                        expect(headers[":status"]).toBe(200);
                        expect(headers["content-type"]).toBe("application/json; charset=UTF-8");
                        expect(flags).toBe(4);
                        expect(JSON.parse(await contentText(post))).toMatchObject({
                            message: "HELLO H2"
                        });
                        done();
                    });
                    post.end(JSON.stringify({message: "HELLO H2"}));
                })
            ]);

            await new Promise(closed => client.close(closed));
        });
    });

    describe("http2 over http", function () {

        const config = configure({root: "test/fixture/server"}, {
            server: {
                protocol: "http",
                port: 9090
            },
            http2: "link"
        });

        let server, address, agent;

        beforeAll(async function () {
            const instance = await startServer(config);
            server = instance.server;
            address = instance.address;
            agent = new https.Agent({ca});
        });

        afterAll(async function () {
            await server.shutdown();
        });

        it("can start/stop a server with pending connections", async exit => {

            const client = http2.connect(`${address}`);

            client.on("close", exit);

            const closed = new Promise(closed => {
                client.on("error", function (err) {
                    expect(err.code).toMatch("ECONNRESET");
                    client.close(closed);
                });
            });

            await new Promise(next => {
                const req = client.request({
                    ":path": "/",
                    ":method": "POST",
                    "content-type": "text/plain; charset=UTF-8"
                });
                req.on("error", function (err) {
                    expect(err.code).toMatch("ECONNRESET");
                });
                req.on("response", (headers, flags) => {
                    expect(headers[":status"]).toBe(200);
                    expect(headers["content-type"]).toBe("text/plain; charset=UTF-8");
                    expect(flags).toBe(4);
                    server.shutdown();
                    req.end("late message");
                });
            });

            await closed;

            expect(client.closed).toBe(true);
        });

    });

});


