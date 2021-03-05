describe("websockets", function () {

    const {configure} = require("lib/configure.ts");
    const {readFileSync} = require("fs");
    const {startServer} = require("lib/server.ts");
    const {contentText} = require("lib/util/content-utils.js");

    const ca = readFileSync(`cert/codebite.pem`, "UTF-8");

    jest.mock("lib/request-handler.ts", function () {
        return {
            createRequestHandler(config, watcher) {
                return function (req, res) {
                    res.writeHead(200, "OK", {"content-type": "text/plain; charset=UTF-8"});
                    res.end("HELLO");
                };
            }
        };
    });

    const config = configure({root: "test/fixture/websockets"}, {
        server: {
            protocol: "http",
            port: 4040
        },
        http2: false
    });

    let server, address;

    beforeAll(async function () {
        const instance = await startServer(config);
        server = instance.server;
        address = instance.address;
    });

    afterAll(async function () {
        await server.shutdown();
    });

    it("echo", () => new Promise(function (resolve) {

        const WebSocket = require("ws");

        const ws = new WebSocket(address.replace("http://", "ws://"), {origin: address});

        ws.on("open", function open() {
            ws.send(`echo:"Hello"`);
        });

        ws.on("close", function close() {
            resolve();
        });

        ws.on("message", function (data) {
            if (data.startsWith("echo:")) {
                expect(data.substring(5)).toMatch("Hello");
                ws.close();
            }
        });
    }));

});
