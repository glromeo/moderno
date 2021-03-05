const fastGlob = require("fast-glob");
const path = require("path");

module.exports = function FindPlugin({on, options}) {

    const DEFAULT_SPECS_PATTERN = [
        "**/*.test.mjs",
        "**/*.test.js",
        "**/*.spec.mjs",
        "**/*.spec.js"
    ];

    const rootDir = options.rootDir;
    const specs = options.specs || DEFAULT_SPECS_PATTERN;

    on("find-specs", async (payload, send) => {
        const prefix = path.relative(rootDir, process.cwd());
        const entries = await fastGlob(specs, {cwd: process.cwd(), objectMode: true});
        send("specs", entries.map(entry => {
            return `/${path.join(prefix, entry.path).replace(/\\/g, "/")}`;
        }));
    });
};

