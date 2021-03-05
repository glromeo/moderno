const path = require("path");
const fs = require("fs");

fs.readdirSync("./import").forEach(name => {

    const imported = require(`./import/${name}`);

    const parentdir = path.join(__dirname, "files");
    fs.mkdirSync(parentdir, {recursive: true});

    Object.entries(imported).forEach(([name, variants]) => {
        const dirname = path.join(parentdir, name);
        fs.mkdirSync(dirname, {recursive: true});
        Object.entries(variants).forEach(([variant, content]) => {
            const filename = path.join(dirname, variant + ".svg");
            console.log(filename);
            fs.writeFileSync(filename, content);
        });
    });
});
