const sass = require("node-sass");
const path = require("path");
const {sync: resolve} = require("resolve");

const {useSassImporter} = require("../server/lib/util/sass-importer.js");

const cssResultModule = cssText => `\
import {css} from "lit-element";
export default css\`
${cssText.replace(/([$`\\])/g, "\\$1")}\`;
`;

const notBare = /^\.?\.?\//

module.exports = function litcss(options) {
    const {sassImporter} = useSassImporter({rootDir:process.cwd()})
    const isStyle = /\.(css|sass|scss)$/;
    return {
        name: "lit-css",
        resolveId(source, importer) {
            if (isStyle.exec(source)) {
                return `css:${path.resolve(path.dirname(importer), notBare.test(source) ? source : resolve(source))}`;
            }
            return null;
        },
        load(id) {
            if (id.startsWith("css:")) {
                const filename = id.substring(4);
                const {css} = sass.renderSync({
                    file: filename,
                    importer: sassImporter(filename, "node")
                });
                return cssResultModule(css.toString("utf-8"));
            }
            return null;
        }
    };
};
