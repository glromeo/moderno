module.exports = {
    mount: {
        "/workbench": "../workbench",
        "/@moderno": "../",
        "/node_modules": "../../node_modules"
    },
    babel: {
        filename: "file.jsx",
        presets: ["@babel/preset-react"],
        plugins: [
            ["@babel/plugin-proposal-decorators", {decoratorsBeforeExport: true}],
            ["@babel/plugin-proposal-class-properties"]
        ]
    },
    sass: {
        moduleType: "style"
    },
    server: {
        port: 4000
    },
    push: true,
    cache: true,
    clean: false,
    nodeModules: [require("path").resolve(__dirname, "../../node_modules")],
    web_modules: {
        terser: false
    },
    resolve: {
        rootDir: __dirname,
        paths: [require("path").resolve(__dirname, "../../node_modules")]
    }
};
