const {pathnameToModuleUrl} = require("../../lib/es-import-utils");
const {posix} = require("path");
const esbuild = require("esbuild");

const time = Date.now();

esbuild.build({
    entryPoints: ["@babel/runtime/helpers/esm/decorate.js"],
    bundle: true,
    format: "esm",
    sourcemap: true,
    outdir: "./out",
    // outfile: "D:\\Workspace\\@moderno\\@moderno/web-modules\\test\\fixture\\out\\web_modules\\react-icons\\bs\\index.esm.js",
    // splitting: true,
    metafile: "./out/meta.json",
    plugins: [{
        name: "meta",
        setup(build) {
            build.onResolve({filter: /./}, args => {
                let importer = pathnameToModuleUrl(args.importer);
                console.log(posix.join(posix.dirname(importer), args.path));
                return null;
            });
        }
    }]
}).then(() => {
    console.log("elapsed time:" + ((Date.now() - time) / 1000).toFixed(2));
});