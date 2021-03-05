const staticResource = require("@moderno/browser-toolkit/static-resource");

const preProcess = (filename, code) => `// [HMR]
import {createHotElementContext} from "/moderno/lit-element-hmr.js"; 
import.meta.hot = createHotElementContext(import.meta.url);

${code}

import.meta.hot.accept(true);
`;

module.exports = {
    extends: require("@moderno/browser-toolkit"),
    mount: {
        "/moderno/lit-element-hmr.js": staticResource(__dirname, "client/index.js")
    },
    transform: {
        preProcess(filename, code) {
            if (code.indexOf(" LitElement {") > 0) {
                return preProcess(filename, code);
            }
            return code;
        }
    }
};
