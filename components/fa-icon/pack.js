const fs = require("fs");

const {DOMParser, XMLSerializer} = require("xmldom");
const parser = new DOMParser();
const serializer = new XMLSerializer();

const icons = {
    duotone: {},
    light: {},
    regular: {},
    solid: {}
};

const names = require("./icons.json").forEach(name => {

    fs.readdirSync(`./files/${name}`).forEach(variant => {

        const xml = fs.readFileSync(`./files/${name}/${variant}`, "UTF-8");
        const {documentElement: svg} = parser.parseFromString(xml, "application/xml");

        icons[variant.substring(0, variant.lastIndexOf("."))][name] = {
            viewBox: svg.getAttribute("viewBox"),
            svg: serializer.serializeToString(svg.firstChild).replace(` xmlns="http://www.w3.org/2000/svg"`, "")
        };

    });
});

function esModule(icons) {
    const code = [];
    const json = JSON.stringify(icons, function (key, value) {
        if (key === "svg") {
            code.push("svg`" + value + "`");
            return "<value>";
        } else {
            return value;
        }
    }, "  ");
    code.push("");
    const defaultExport = json.split(/"<value>"/).map((line, index) => line + code[index]);
    return `import {svg} from "lit-element";\n\nexport default ${defaultExport}`;
}

for (const variant of Object.keys(icons)) {
    fs.writeFileSync(`./variants/${variant}.js`, esModule(icons[variant]));
}

