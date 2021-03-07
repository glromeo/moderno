module.exports = {
    mount: {
        "/workbench": "./",
        "/@moderno": "../",
        "/node_modules": "../node_modules"
    },
    babel: {
        plugins: [
            ["babel-plugin-istanbul", {"exclude": ["**/*.test.js", "**/*.test.mjs"]}],
            ["@babel/plugin-proposal-decorators", {decoratorsBeforeExport: true}],
            ["@babel/plugin-proposal-class-properties"]
        ]
    },
    debug: true,
    push: true,
    cache: true,
    clean: false,
    web_modules: {
        standalone: ["mocha", "chai"],
        terser: false
    },

    specs: [
        "components/**/*.spec.js",
        "test/*.spec.mjs"
    ],

    plugins: [
        require("./index.js")
    ]
};
