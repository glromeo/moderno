const staticResource = require("@moderno/browser-toolkit/static-resource");

const preProcess = (filename, code) => `// [HMR]
import {createHotContext, performReactRefresh} from "/moderno/react-fast-refresh.js"; 
import.meta.hot = createHotContext(import.meta.url);

${code}

import.meta.hot.accept(performReactRefresh);
`;

module.exports = {
    extends: require("@moderno/browser-toolkit"),
    mount: {
        "/moderno/react-fast-refresh.js": staticResource(__dirname, "client/index.js"),
        "/moderno/react-fast-refresh/runtime.js": staticResource(__dirname, "client/runtime.js")
    },
    babel: {
        plugins: [
            require("react-refresh/babel"),
            require("@babel/plugin-syntax-class-properties")
        ]
    },
    transform: {
        preProcess
    }
};
