const fs = require("fs");
const path = require("path");

module.exports = function () {

    const filename = path.resolve(...arguments);
    const stats = fs.statSync(filename);
    const content = fs.readFileSync(filename);

    return {
        filename,
        content: content,
        headers: {
            "content-type": "application/javascript; charset=UTF-8",
            "content-length": stats.size,
            "last-modified": stats.mtime.toUTCString(),
            "cache-control": "public, max-age=86400, immutable",
            "x-transformer": "none",
            "x-resource-type": "static"
        }
    };
}