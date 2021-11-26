const path = require("path");

module.exports = {

    mount: {
        "/workbench": path.resolve(__dirname, "..")
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
        require("./config-middleware.js"),
        require("./snapshots-middleware.js")
    ],

    messaging: {
        plugins: [
            require("./find-plugin.js"),
            require("./coverage-plugin.js")
        ]
    }
};
