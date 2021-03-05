const staticResource = require("./static-resource");

module.exports = {
    mount: {
        "/moderno/browser-toolkit.js": staticResource(__dirname, "lib/index.js")
    }
};