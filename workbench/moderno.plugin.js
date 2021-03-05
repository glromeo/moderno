module.exports = {

    mount: {
        "/workbench": __dirname
    },

    transform: {
        exclude: ["/workbench/dist/**"]
    },

    babel: {
        plugins: [
            ["babel-plugin-istanbul", {"exclude": ["**/*.test.js", "**/*.test.mjs"]}]
        ]
    },

    watcher: {
        ignored: ["coverage/**"],
    },

    workbench: {
        random: false,
        failFast: false,
        oneFailurePerSpec: false,
        hideDisabled: false,
        specFiler: spec => true
    },

    middleware: [
        require("./lib/endpoint/config-middleware.js"),
        require("./lib/endpoint/snapshots-middleware.js")
    ],

    web_modules: {
        standalone: [
            "smooth-scrollbar"
        ]
    },

    messaging: {
        plugins: [
            require("./lib/endpoint/find-plugin.js"),
            require("./lib/endpoint/coverage-plugin.js")
        ]
    }
};
