describe("sass importer", function () {

    const {promisify} = require("util");
    const path = require("path");
    const fs = require("fs");

    const chokidar = require("chokidar");
    const watcher = chokidar.watch([], {
        cwd: path.resolve(__dirname, "fixture/sass-importer"),
        atomic: false
    });

    const sass = require("node-sass");
    const sassRender = promisify(sass.render);

    const {useSassImporter} = require("../src/util/sass-importer.ts");
    const {sassImporter} = useSassImporter({}, watcher);

    const log = require("@moderno/logger");

    it("simple", async function () {

        const basedir = path.resolve(__dirname, "fixture/sass-importer/simple");
        const basefile = path.resolve(basedir, "styles.scss");

        const result = await sassRender({
            data: fs.readFileSync(basefile, "utf-8"),
            importer: sassImporter(basefile),
            outputStyle: "compressed"
        });

        expect(result.css.toString()).toMatch("html{background-color:chocolate}body{background-color:blue}\n");
    });

    it("fragment", async function () {

        const basedir = path.resolve(__dirname, "fixture/sass-importer/fragment");
        const basefile = path.resolve(basedir, "styles.scss");

        const result = await sassRender({
            data: fs.readFileSync(basefile, "utf-8"),
            importer: sassImporter(basefile),
            outputStyle: "compressed"
        });

        expect(result.css.toString()).toMatch("html{background-color:#d2691e}\n");
    });

    it("module", async function () {

        const basedir = path.resolve(__dirname, "fixture/sass-importer/module");
        const basefile = path.resolve(basedir, "styles.scss");

        const result = await sassRender({
            data: fs.readFileSync(basefile, "utf-8"),
            importer: sassImporter(basefile),
            outputStyle: "compressed"
        }).catch(err => {
            log.error`failed to transform file:'${path.relative(basedir, err.file)}' at (${err.line}:${err.column})\n\t${err.formatted}`;
        });

        expect(result.css.toString()).toMatch("@media (min-width: 1200px){" +
            ".flex-xl-row{flex-direction:row !important}" +
            ".flex-xl-column{flex-direction:column !important}" +
            ".flex-xl-row-reverse{flex-direction:row-reverse !important}" +
            ".flex-xl-column-reverse{flex-direction:column-reverse !important}" +
            ".flex-xl-wrap{flex-wrap:wrap !important}" +
            ".flex-xl-nowrap{flex-wrap:nowrap !important}" +
            ".flex-xl-wrap-reverse{flex-wrap:wrap-reverse !important}" +
            ".flex-xl-fill{flex:1 1 auto !important}" +
            ".flex-xl-grow-0{flex-grow:0 !important}" +
            ".flex-xl-grow-1{flex-grow:1 !important}" +
            ".flex-xl-shrink-0{flex-shrink:0 !important}" +
            ".flex-xl-shrink-1{flex-shrink:1 !important}" +
            ".justify-content-xl-start{justify-content:flex-start !important}" +
            ".justify-content-xl-end{justify-content:flex-end !important}" +
            ".justify-content-xl-center{justify-content:center !important}" +
            ".justify-content-xl-between{justify-content:space-between !important}" +
            ".justify-content-xl-around{justify-content:space-around !important}" +
            ".align-items-xl-start{align-items:flex-start !important}" +
            ".align-items-xl-end{align-items:flex-end !important}" +
            ".align-items-xl-center{align-items:center !important}" +
            ".align-items-xl-baseline{align-items:baseline !important}" +
            ".align-items-xl-stretch{align-items:stretch !important}" +
            ".align-content-xl-start{align-content:flex-start !important}" +
            ".align-content-xl-end{align-content:flex-end !important}" +
            ".align-content-xl-center{align-content:center !important}" +
            ".align-content-xl-between{align-content:space-between !important}" +
            ".align-content-xl-around{align-content:space-around !important}" +
            ".align-content-xl-stretch{align-content:stretch !important}" +
            ".align-self-xl-auto{align-self:auto !important}" +
            ".align-self-xl-start{align-self:flex-start !important}" +
            ".align-self-xl-end{align-self:flex-end !important}" +
            ".align-self-xl-center{align-self:center !important}" +
            ".align-self-xl-baseline{align-self:baseline !important}" +
            ".align-self-xl-stretch{align-self:stretch !important}" +
            "}" +
            "body{font-size:2px}\n");
    });

    it("import json in a flat set of variables", async function () {

        const basedir = path.resolve(__dirname, "fixture/sass-importer/json");
        const basefile = path.resolve(basedir, "styles.scss");

        const result = await sassRender({
            data: fs.readFileSync(basefile, "utf-8"),
            importer: sassImporter(basefile),
            outputStyle: "compressed"
        });

        expect(result.css.toString()).toMatch(".background{color:#000}.foreground{color:red}\n");
    });

    it("import (kind of) es module", async function () {

        const basedir = path.resolve(__dirname, "fixture/sass-importer/iife");
        const basefile = path.resolve(basedir, "styles.scss");

        const result = await sassRender({
            data: fs.readFileSync(basefile, "utf-8"),
            importer: sassImporter(basefile),
            outputStyle: "compressed"
        });

        expect(result.css.toString()).toMatch(".background{color:#000}.foreground{color:red}\n");
    });

    /**
     * todo: I could generalize a config.sass.forceInclusion or something similar instead of just checking .css...
     */
    it("import css including the contents because @import won't work in adopted styles", async function () {

        const basedir = path.resolve(__dirname, "fixture/sass-importer/css");
        const basefile = path.resolve(basedir, "styles.scss");

        const result = await sassRender({
            data: fs.readFileSync(basefile, "utf-8"),
            importer: sassImporter(basefile),
            outputStyle: "compressed"
        });

        expect(result.css.toString()).toMatch("html{background-color:chocolate}body{background-color:blue}\n");
    });
});
