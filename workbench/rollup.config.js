const resolve = require("rollup-plugin-node-resolve");
const commonjs = require("rollup-plugin-commonjs");
const babel = require("rollup-plugin-babel");
const copy = require("rollup-plugin-copy");

const litcss = require("./rollup-plugin-lit-css.js");

const babelConfig = require("./babel.config.js");

module.exports = {
    input: ["main.js"],
    inlineDynamicImports: true,
    output: {
        file: "dist/main.js",
        format: "es",
        name: "Workbench",
        sourcemap: true,
        sourcemapFile: "dist/main.js.map"
    },
    plugins: [
        litcss(),
        babel({
            ...babelConfig,
            babelrc: false,
            sourceMap: true,
            extensions: [".ts", ".js", ".mjs"]
        }),
        resolve({
            extensions: [".mjs", ".js", ".json", ".ts"]
        }),
        commonjs(),
        // copy({
        //     targets: [
        //         {src: "index.html", dest: "dist"}
        //     ]
        // })
    ]
};
