describe("configure", function () {

    const path = require("path");
    const fs = require("fs");

    const {log, rootDir, resolve} = require("fixture/index.js");
    const {configure} = require("lib/configure.ts");

    it("root must be valid", async function () {

        let args = {root: "test/fixture/cli"};
        expect(configure(args)).toMatchObject({rootDir: `${resolve("cli")}`});

        args = {root: "/void/path"};
        expect(() => configure(args)).toThrowError(`ENOENT: no such file or directory '${resolve("/void/path")}'`);

        args = {root: `${rootDir}/cli/not.a.dir`};
        expect(() => configure(args)).toThrowError(`ENODIR: not a directory '${resolve("cli/not.a.dir")}'`);
    });

    it("config must be valid", async function () {
        const filename = "missing.config";
        const cwd = process.cwd();
        const args = {options: filename};
        expect(() => configure(args)).toThrowError(`Unable to load config '${filename}' from '${cwd}'`);
    });

    it("default configuration checks", async function () {

        jest.spyOn(log, "debug");

        const baseDir = process.cwd();
        const rootDir = path.resolve("test/fixture/configure/default");

        expect(baseDir).toMatch("@moderno/server");

        expect(configure({root: "test/fixture/configure/default"})).toMatchObject({
            baseDir,
            rootDir,
            nodeModules: path.resolve(rootDir, "node_modules"),
            webModules: path.resolve(rootDir, "web_modules"),
            resources: path.resolve(baseDir, "resources"),
            babel: {
                babelrc: true,
                caller: {
                    name: "@moderno/server",
                    supportsStaticESM: true
                },
                sourceType: "module",
                sourceMaps: true,
                plugins: [
                    ["@babel/plugin-syntax-import-meta"],
                    ["@babel/plugin-transform-runtime", {
                        "corejs": false,
                        "helpers": true,
                        "regenerator": false,
                        "useESModules": true,
                        "absoluteRuntime": false,
                        "version": "7.10.5"
                    }]

                ]
            }
        });

        expect(log.debug).toHaveBeenCalledWith(`no config found in '${rootDir}'`);

        expect(log.level).toBe("info");
    });

    it("config is frozen", async function () {
        const config = configure();
        config["http2"] = false;
        expect(config["http2"]).toBe("push");
    });

    it("debug mode", async function () {
        const config = configure({debug: true});
        expect(config.log.level).toBe("info");
        expect(log.level).toBe("debug");
    });

    it("can load config from a file", function () {

        const filename = "config-" + Date.now() + ".js";
        const pathname = resolve(filename);
        const content = {
            log: {level: "trace"}
        };

        fs.writeFileSync(pathname, `module.exports = ${JSON.stringify(content, undefined, " ")}`);

        let config = configure({options: `test/fixture/${filename}`});
        expect(config.log.level).toEqual("trace");

        fs.unlinkSync(pathname);
    });

    it("loads moderno.config if present", function () {
        expect(configure({root: "test/fixture/configure/present"})).toMatchObject({log: {level: "warn"}});
    });

});
