const {resolve} = require("path");
const {readFileSync} = require("fs");

const rootDir = __dirname;

module.exports = {
    rootDir: rootDir,
    nodeModules: [resolve(rootDir, "node_modules"), resolve(rootDir, "..", "node_modules")],
    webModules: resolve(rootDir, "web_modules"),
    mount: {
        "/workbench": "../workbench",
        "/@moderno": "../",
        "/node_modules": "../node_modules"
    },
    babel: {
        plugins: [
            ["babel-plugin-istanbul", {"exclude": ["**/*.test.js","**/*.test.mjs"]}],
            ["@babel/plugin-proposal-decorators", {decoratorsBeforeExport: true}],
            ["@babel/plugin-proposal-class-properties"],
            ["@babel/plugin-transform-runtime", {
                "corejs": false,
                "helpers": true,
                "regenerator": false,
                "useESModules": true,
                "absoluteRuntime": true,
                "version": "7.5.5"
            }]
        ]
    },
    push: true,
    cache: true,
    clean: false,
    web_modules: {
        standalone: ["mocha", "chai"],
        terser: false
    }
};
