"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useHtmlTransformer = void 0;
const web_modules_1 = require("@moderno/web-modules");
const he_1 = require("he");
const htmlparser2_1 = require("htmlparser2");
const nano_memoize_1 = __importDefault(require("nano-memoize"));
const logger_1 = __importDefault(require("@moderno/logger"));
const mime_types_1 = require("../util/mime-types");
const babel_transformer_1 = require("./babel-transformer");
exports.useHtmlTransformer = nano_memoize_1.default(config => {
    const { babelTransformer } = babel_transformer_1.useBabelTransformer(config, "inline");
    const { resolveImport } = web_modules_1.useWebModules(config);
    function openTag(name, attribs) {
        const keys = Object.keys(attribs);
        if (keys.length > 0) {
            let html = "<" + name;
            for (const name of keys)
                if (attribs.hasOwnProperty(name)) {
                    html += ` ${name}="${he_1.escape(attribs[name])}"`;
                }
                else {
                    html += " " + name;
                }
            return html + ">";
        }
        else {
            return "<" + name + ">";
        }
    }
    function closeTag(name) {
        return "</" + name + ">";
    }
    function processingInstruction(data) {
        return "<" + data + ">";
    }
    function comment(text) {
        return "<!--" + text + "-->";
    }
    const transformHtmlAsync = async (filename, content) => new Promise(async (resolve, reject) => {
        const imports = new Set();
        let scriptCount = 0;
        let scriptContext;
        let html = [];
        const stream = new htmlparser2_1.Parser({
            onprocessinginstruction(name, data) {
                html.push(processingInstruction(data));
            },
            onopentag(name, attribs) {
                if (name === "script" && !scriptContext) {
                    if (attribs.type === "module") {
                        if (attribs.src) {
                            html.push(resolveImport(attribs.src, filename).then(relativeUrl => {
                                imports.add(relativeUrl);
                                attribs.src = relativeUrl;
                                return openTag(name, attribs);
                            }));
                        }
                        else {
                            html.push(openTag(name, attribs));
                            ++scriptCount;
                            scriptContext = html;
                            html = [];
                        }
                        return;
                    }
                }
                html.push(openTag(name, attribs));
            },
            onclosetag(name) {
                if (name === "script" && scriptContext) {
                    const text = html.join("");
                    html = scriptContext;
                    const scriptname = filename + " <" + scriptCount + "> [sm]";
                    html.push(babelTransformer(scriptname, text).then(({ content, links }) => {
                        for (const importUrl of links) {
                            imports.add(importUrl);
                        }
                        return content;
                    }));
                    scriptContext = undefined;
                }
                html.push(closeTag(name));
            },
            ontext(text) {
                html.push(text);
            },
            oncomment(text) {
                html.push(comment(text));
            },
            oncdatastart() {
                html.push("<![CDATA[");
            },
            oncdataend() {
                html.push("]]>");
            },
            onerror(error) {
                logger_1.default.error("failed to transform html file: ", filename);
                reject(error);
            },
            async onend() {
                for (let h = 0; h < html.length; h++)
                    if (typeof html[h] !== "string")
                        try {
                            html[h] = await html[h];
                        }
                        catch (error) {
                            reject(error);
                        }
                resolve({
                    html: html.join(""),
                    imports
                });
            }
        }, {
            xmlMode: false,
            decodeEntities: true,
            recognizeCDATA: true,
            recognizeSelfClosing: true
        });
        stream.end(content);
    });
    async function htmlTransformer(filename, content) {
        const { html, imports } = await transformHtmlAsync(filename, content);
        return {
            content: html,
            headers: {
                "content-type": mime_types_1.HTML_CONTENT_TYPE,
                "content-length": Buffer.byteLength(html),
                "x-transformer": "html-transformer"
            },
            links: [...imports]
        };
    }
    return {
        htmlTransformer
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHRtbC10cmFuc2Zvcm1lci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90cmFuc2Zvcm1lcnMvaHRtbC10cmFuc2Zvcm1lci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxzREFBbUQ7QUFDbkQsMkJBQTBCO0FBQzFCLDZDQUFtQztBQUNuQyxnRUFBb0M7QUFDcEMsNkRBQWtDO0FBQ2xDLG1EQUFxRDtBQUNyRCwyREFBd0Q7QUFLM0MsUUFBQSxrQkFBa0IsR0FBRyxzQkFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFO0lBRWhELE1BQU0sRUFBQyxnQkFBZ0IsRUFBQyxHQUFHLHVDQUFtQixDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQztJQUNqRSxNQUFNLEVBQUMsYUFBYSxFQUFDLEdBQUcsMkJBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUU5QyxTQUFTLE9BQU8sQ0FBQyxJQUFJLEVBQUUsT0FBTztRQUMxQixNQUFNLElBQUksR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ2xDLElBQUksSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7WUFDakIsSUFBSSxJQUFJLEdBQUcsR0FBRyxHQUFHLElBQUksQ0FBQztZQUN0QixLQUFLLE1BQU0sSUFBSSxJQUFJLElBQUk7Z0JBQUUsSUFBSSxPQUFPLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxFQUFFO29CQUN2RCxJQUFJLElBQUksSUFBSSxJQUFJLEtBQUssV0FBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUM7aUJBQ2pEO3FCQUFNO29CQUNILElBQUksSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDO2lCQUN0QjtZQUNELE9BQU8sSUFBSSxHQUFHLEdBQUcsQ0FBQztTQUNyQjthQUFNO1lBQ0gsT0FBTyxHQUFHLEdBQUcsSUFBSSxHQUFHLEdBQUcsQ0FBQztTQUMzQjtJQUNMLENBQUM7SUFFRCxTQUFT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QyxDQUFDO1FBRUgsTUFBTSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUN4QixDQUFDLENBQUMsQ0FBQztJQUVILEtBQUssVUFBVSxlQUFlLENBQUMsUUFBZSxFQUFFLE9BQWM7UUFDMUQsTUFBTSxFQUFDLElBQUksRUFBRSxPQUFPLEVBQUMsR0FBRyxNQUFNLGtCQUFrQixDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUNwRSxPQUFPO1lBQ0gsT0FBTyxFQUFFLElBQUk7WUFDYixPQUFPLEVBQUU7Z0JBQ0wsY0FBYyxFQUFFLDhCQUFpQjtnQkFDakMsZ0JBQWdCLEVBQUUsTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUM7Z0JBQ3pDLGVBQWUsRUFBRSxrQkFBa0I7YUFDdEM7WUFDRCxLQUFLLEVBQUUsQ0FBQyxHQUFHLE9BQU8sQ0FBQztTQUN0QixDQUFDO0lBQ04sQ0FBQztJQUVELE9BQU87UUFDSCxlQUFlO0tBQ2xCLENBQUM7QUFDTixDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7dXNlV2ViTW9kdWxlc30gZnJvbSBcIkBtb2Rlcm5vL3dlYi1tb2R1bGVzXCI7XHJcbmltcG9ydCB7ZXNjYXBlfSBmcm9tIFwiaGVcIjtcclxuaW1wb3J0IHtQYXJzZXJ9IGZyb20gXCJodG1scGFyc2VyMlwiO1xyXG5pbXBvcnQgbWVtb2l6ZWQgZnJvbSBcIm5hbm8tbWVtb2l6ZVwiO1xyXG5pbXBvcnQgbG9nIGZyb20gXCJAbW9kZXJuby9sb2dnZXJcIjtcclxuaW1wb3J0IHtIVE1MX0NPTlRFTlRfVFlQRX0gZnJvbSBcIi4uL3V0aWwvbWltZS10eXBlc1wiO1xyXG5pbXBvcnQge3VzZUJhYmVsVHJhbnNmb3JtZXJ9IGZyb20gXCIuL2JhYmVsLXRyYW5zZm9ybWVyXCI7XHJcbmltcG9ydCB7VHJhbnNmb3JtZXJPdXRwdXR9IGZyb20gXCIuL2luZGV4XCI7XHJcblxyXG5leHBvcnQgdHlwZSBUcmFuc2Zvcm1SZXN1bHQgPSB7IGh0bWw6IHN0cmluZywgaW1wb3J0czogU2V0PHN0cmluZz4gfTtcclxuXHJcbmV4cG9ydCBjb25zdCB1c2VIdG1sVHJhbnNmb3JtZXIgPSBtZW1vaXplZChjb25maWcgPT4ge1xyXG5cclxuICAgIGNvbnN0IHtiYWJlbFRyYW5zZm9ybWVyfSA9IHVzZUJhYmVsVHJhbnNmb3JtZXIoY29uZmlnLCBcImlubGluZVwiKTtcclxuICAgIGNvbnN0IHtyZXNvbHZlSW1wb3J0fSA9IHVzZVdlYk1vZHVsZXMoY29uZmlnKTtcclxuXHJcbiAgICBmdW5jdGlvbiBvcGVuVGFnKG5hbWUsIGF0dHJpYnMpIHtcclxuICAgICAgICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXMoYXR0cmlicyk7XHJcbiAgICAgICAgaWYgKGtleXMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICBsZXQgaHRtbCA9IFwiPFwiICsgbmFtZTtcclxuICAgICAgICAgICAgZm9yIChjb25zdCBuYW1lIG9mIGtleXMpIGlmIChhdHRyaWJzLmhhc093blByb3BlcnR5KG5hbWUpKSB7XHJcbiAgICAgICAgICAgICAgICBodG1sICs9IGAgJHtuYW1lfT1cIiR7ZXNjYXBlKGF0dHJpYnNbbmFtZV0pfVwiYDtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGh0bWwgKz0gXCIgXCIgKyBuYW1lO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBodG1sICsgXCI+XCI7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuIFwiPFwiICsgbmFtZSArIFwiPlwiO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBjbG9zZVRhZyhuYW1lKSB7XHJcbiAgICAgICAgcmV0dXJuIFwiPC9cIiArIG5hbWUgKyBcIj5cIjtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBwcm9jZXNzaW5nSW5zdHJ1Y3Rpb24oZGF0YSkge1xyXG4gICAgICAgIHJldHVybiBcIjxcIiArIGRhdGEgKyBcIj5cIjtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBjb21tZW50KHRleHQpIHtcclxuICAgICAgICByZXR1cm4gXCI8IS0tXCIgKyB0ZXh0ICsgXCItLT5cIjtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCB0cmFuc2Zvcm1IdG1sQXN5bmMgPSBhc3luYyAoZmlsZW5hbWUsIGNvbnRlbnQpID0+IG5ldyBQcm9taXNlPFRyYW5zZm9ybVJlc3VsdD4oYXN5bmMgKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG5cclxuICAgICAgICBjb25zdCBpbXBvcnRzID0gbmV3IFNldDxzdHJpbmc+KCk7XHJcbiAgICAgICAgbGV0IHNjcmlwdENvdW50ID0gMDtcclxuICAgICAgICBsZXQgc2NyaXB0Q29udGV4dDtcclxuICAgICAgICBsZXQgaHRtbDogKHN0cmluZyB8IFByb21pc2U8c3RyaW5nPilbXSA9IFtdO1xyXG5cclxuICAgICAgICBjb25zdCBzdHJlYW0gPSBuZXcgUGFyc2VyKHtcclxuXHJcbiAgICAgICAgICAgIG9ucHJvY2Vzc2luZ2luc3RydWN0aW9uKG5hbWUsIGRhdGEpIHtcclxuICAgICAgICAgICAgICAgIGh0bWwucHVzaChwcm9jZXNzaW5nSW5zdHJ1Y3Rpb24oZGF0YSkpO1xyXG4gICAgICAgICAgICB9LFxyXG5cclxuICAgICAgICAgICAgb25vcGVudGFnKG5hbWUsIGF0dHJpYnMpIHtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAobmFtZSA9PT0gXCJzY3JpcHRcIiAmJiAhc2NyaXB0Q29udGV4dCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChhdHRyaWJzLnR5cGUgPT09IFwibW9kdWxlXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGF0dHJpYnMuc3JjKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBodG1sLnB1c2goXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZUltcG9ydChhdHRyaWJzLnNyYywgZmlsZW5hbWUpLnRoZW4ocmVsYXRpdmVVcmwgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbXBvcnRzLmFkZChyZWxhdGl2ZVVybCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF0dHJpYnMuc3JjID0gcmVsYXRpdmVVcmw7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBvcGVuVGFnKG5hbWUsIGF0dHJpYnMpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaHRtbC5wdXNoKG9wZW5UYWcobmFtZSwgYXR0cmlicykpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKytzY3JpcHRDb3VudDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjcmlwdENvbnRleHQgPSBodG1sO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaHRtbCA9IFtdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaHRtbC5wdXNoKG9wZW5UYWcobmFtZSwgYXR0cmlicykpO1xyXG4gICAgICAgICAgICB9LFxyXG5cclxuICAgICAgICAgICAgb25jbG9zZXRhZyhuYW1lKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAobmFtZSA9PT0gXCJzY3JpcHRcIiAmJiBzY3JpcHRDb250ZXh0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdGV4dCA9IGh0bWwuam9pbihcIlwiKTtcclxuICAgICAgICAgICAgICAgICAgICBodG1sID0gc2NyaXB0Q29udGV4dDtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBzY3JpcHRuYW1lID0gZmlsZW5hbWUgKyBcIiA8XCIgKyBzY3JpcHRDb3VudCArIFwiPiBbc21dXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgaHRtbC5wdXNoKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBiYWJlbFRyYW5zZm9ybWVyKHNjcmlwdG5hbWUsIHRleHQpLnRoZW4oKHtjb250ZW50LCBsaW5rc30pID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgaW1wb3J0VXJsIG9mIGxpbmtzISkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGltcG9ydHMuYWRkKGltcG9ydFVybCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY29udGVudDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgICAgIHNjcmlwdENvbnRleHQgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBodG1sLnB1c2goY2xvc2VUYWcobmFtZSkpO1xyXG4gICAgICAgICAgICB9LFxyXG5cclxuICAgICAgICAgICAgb250ZXh0KHRleHQpIHtcclxuICAgICAgICAgICAgICAgIGh0bWwucHVzaCh0ZXh0KTtcclxuICAgICAgICAgICAgfSxcclxuXHJcbiAgICAgICAgICAgIG9uY29tbWVudCh0ZXh0KSB7XHJcbiAgICAgICAgICAgICAgICBodG1sLnB1c2goY29tbWVudCh0ZXh0KSk7XHJcbiAgICAgICAgICAgIH0sXHJcblxyXG4gICAgICAgICAgICBvbmNkYXRhc3RhcnQoKSB7XHJcbiAgICAgICAgICAgICAgICBodG1sLnB1c2goXCI8IVtDREFUQVtcIik7XHJcbiAgICAgICAgICAgIH0sXHJcblxyXG4gICAgICAgICAgICBvbmNkYXRhZW5kKCkge1xyXG4gICAgICAgICAgICAgICAgaHRtbC5wdXNoKFwiXV0+XCIpO1xyXG4gICAgICAgICAgICB9LFxyXG5cclxuICAgICAgICAgICAgb25lcnJvcihlcnJvcikge1xyXG4gICAgICAgICAgICAgICAgbG9nLmVycm9yKFwiZmFpbGVkIHRvIHRyYW5zZm9ybSBodG1sIGZpbGU6IFwiLCBmaWxlbmFtZSk7XHJcbiAgICAgICAgICAgICAgICByZWplY3QoZXJyb3IpO1xyXG4gICAgICAgICAgICB9LFxyXG5cclxuICAgICAgICAgICAgYXN5bmMgb25lbmQoKSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBoID0gMDsgaCA8IGh0bWwubGVuZ3RoOyBoKyspIGlmICh0eXBlb2YgaHRtbFtoXSAhPT0gXCJzdHJpbmdcIikgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICBodG1sW2hdID0gYXdhaXQgaHRtbFtoXTtcclxuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycm9yKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJlc29sdmUoe1xyXG4gICAgICAgICAgICAgICAgICAgIGh0bWw6IGh0bWwuam9pbihcIlwiKSxcclxuICAgICAgICAgICAgICAgICAgICBpbXBvcnRzXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9LCB7XHJcbiAgICAgICAgICAgIHhtbE1vZGU6IGZhbHNlLFxyXG4gICAgICAgICAgICBkZWNvZGVFbnRpdGllczogdHJ1ZSxcclxuICAgICAgICAgICAgcmVjb2duaXplQ0RBVEE6IHRydWUsXHJcbiAgICAgICAgICAgIHJlY29nbml6ZVNlbGZDbG9zaW5nOiB0cnVlXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHN0cmVhbS5lbmQoY29udGVudCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBhc3luYyBmdW5jdGlvbiBodG1sVHJhbnNmb3JtZXIoZmlsZW5hbWU6c3RyaW5nLCBjb250ZW50OnN0cmluZyk6IFByb21pc2U8VHJhbnNmb3JtZXJPdXRwdXQ+IHtcclxuICAgICAgICBjb25zdCB7aHRtbCwgaW1wb3J0c30gPSBhd2FpdCB0cmFuc2Zvcm1IdG1sQXN5bmMoZmlsZW5hbWUsIGNvbnRlbnQpO1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGNvbnRlbnQ6IGh0bWwsXHJcbiAgICAgICAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAgICAgICAgIFwiY29udGVudC10eXBlXCI6IEhUTUxfQ09OVEVOVF9UWVBFLFxyXG4gICAgICAgICAgICAgICAgXCJjb250ZW50LWxlbmd0aFwiOiBCdWZmZXIuYnl0ZUxlbmd0aChodG1sKSxcclxuICAgICAgICAgICAgICAgIFwieC10cmFuc2Zvcm1lclwiOiBcImh0bWwtdHJhbnNmb3JtZXJcIlxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBsaW5rczogWy4uLmltcG9ydHNdXHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGh0bWxUcmFuc2Zvcm1lclxyXG4gICAgfTtcclxufSk7XHJcbiJdfQ==