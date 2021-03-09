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
                        const src = attribs.src;
                        if (src) {
                            html.push(resolveImport(src, filename).then(relativeUrl => {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHRtbC10cmFuc2Zvcm1lci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90cmFuc2Zvcm1lcnMvaHRtbC10cmFuc2Zvcm1lci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxzREFBbUQ7QUFDbkQsMkJBQTBCO0FBQzFCLDZDQUFtQztBQUNuQyxnRUFBb0M7QUFDcEMsNkRBQWtDO0FBQ2xDLG1EQUFxRDtBQUNyRCwyREFBd0Q7QUFLM0MsUUFBQSxrQkFBa0IsR0FBRyxzQkFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFO0lBRWhELE1BQU0sRUFBQyxnQkFBZ0IsRUFBQyxHQUFHLHVDQUFtQixDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQztJQUNqRSxNQUFNLEVBQUMsYUFBYSxFQUFDLEdBQUcsMkJBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUU5QyxTQUFTLE9BQU8sQ0FBQyxJQUFJLEVBQUUsT0FBTztRQUMxQixNQUFNLElBQUksR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ2xDLElBQUksSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7WUFDakIsSUFBSSxJQUFJLEdBQUcsR0FBRyxHQUFHLElBQUksQ0FBQztZQUN0QixLQUFLLE1BQU0sSUFBSSxJQUFJLElBQUk7Z0JBQUUsSUFBSSxPQUFPLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxFQUFFO29CQUN2RCxJQUFJLElBQUksSUFBSSxJQUFJLEtBQUssV0FBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUM7aUJBQ2pEO3FCQUFNO29CQUNILElBQUksSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDO2lCQUN0QjtZQUNELE9BQU8sSUFBSSxHQUFHLEdBQUcsQ0FBQztTQUNyQjthQUFNO1lBQ0gsT0FBTyxHQUFHLEdBQUcsSUFBSSxHQUFHLEdBQUcsQ0FBQztTQUMzQjtJQUNMLENBQUM7SUFFRCxTQUFT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b0IsRUFBRSxJQUFJO1NBQzdCLENBQUMsQ0FBQztRQUVILE1BQU0sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDeEIsQ0FBQyxDQUFDLENBQUM7SUFFSCxLQUFLLFVBQVUsZUFBZSxDQUFDLFFBQWUsRUFBRSxPQUFjO1FBQzFELE1BQU0sRUFBQyxJQUFJLEVBQUUsT0FBTyxFQUFDLEdBQUcsTUFBTSxrQkFBa0IsQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDcEUsT0FBTztZQUNILE9BQU8sRUFBRSxJQUFJO1lBQ2IsT0FBTyxFQUFFO2dCQUNMLGNBQWMsRUFBRSw4QkFBaUI7Z0JBQ2pDLGdCQUFnQixFQUFFLE1BQU0sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDO2dCQUN6QyxlQUFlLEVBQUUsa0JBQWtCO2FBQ3RDO1lBQ0QsS0FBSyxFQUFFLENBQUMsR0FBRyxPQUFPLENBQUM7U0FDdEIsQ0FBQztJQUNOLENBQUM7SUFFRCxPQUFPO1FBQ0gsZUFBZTtLQUNsQixDQUFDO0FBQ04sQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge3VzZVdlYk1vZHVsZXN9IGZyb20gXCJAbW9kZXJuby93ZWItbW9kdWxlc1wiO1xuaW1wb3J0IHtlc2NhcGV9IGZyb20gXCJoZVwiO1xuaW1wb3J0IHtQYXJzZXJ9IGZyb20gXCJodG1scGFyc2VyMlwiO1xuaW1wb3J0IG1lbW9pemVkIGZyb20gXCJuYW5vLW1lbW9pemVcIjtcbmltcG9ydCBsb2cgZnJvbSBcIkBtb2Rlcm5vL2xvZ2dlclwiO1xuaW1wb3J0IHtIVE1MX0NPTlRFTlRfVFlQRX0gZnJvbSBcIi4uL3V0aWwvbWltZS10eXBlc1wiO1xuaW1wb3J0IHt1c2VCYWJlbFRyYW5zZm9ybWVyfSBmcm9tIFwiLi9iYWJlbC10cmFuc2Zvcm1lclwiO1xuaW1wb3J0IHtUcmFuc2Zvcm1lck91dHB1dH0gZnJvbSBcIi4vaW5kZXhcIjtcblxuZXhwb3J0IHR5cGUgVHJhbnNmb3JtUmVzdWx0ID0geyBodG1sOiBzdHJpbmcsIGltcG9ydHM6IFNldDxzdHJpbmc+IH07XG5cbmV4cG9ydCBjb25zdCB1c2VIdG1sVHJhbnNmb3JtZXIgPSBtZW1vaXplZChjb25maWcgPT4ge1xuXG4gICAgY29uc3Qge2JhYmVsVHJhbnNmb3JtZXJ9ID0gdXNlQmFiZWxUcmFuc2Zvcm1lcihjb25maWcsIFwiaW5saW5lXCIpO1xuICAgIGNvbnN0IHtyZXNvbHZlSW1wb3J0fSA9IHVzZVdlYk1vZHVsZXMoY29uZmlnKTtcblxuICAgIGZ1bmN0aW9uIG9wZW5UYWcobmFtZSwgYXR0cmlicykge1xuICAgICAgICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXMoYXR0cmlicyk7XG4gICAgICAgIGlmIChrZXlzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGxldCBodG1sID0gXCI8XCIgKyBuYW1lO1xuICAgICAgICAgICAgZm9yIChjb25zdCBuYW1lIG9mIGtleXMpIGlmIChhdHRyaWJzLmhhc093blByb3BlcnR5KG5hbWUpKSB7XG4gICAgICAgICAgICAgICAgaHRtbCArPSBgICR7bmFtZX09XCIke2VzY2FwZShhdHRyaWJzW25hbWVdKX1cImA7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGh0bWwgKz0gXCIgXCIgKyBuYW1lO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGh0bWwgKyBcIj5cIjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBcIjxcIiArIG5hbWUgKyBcIj5cIjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNsb3NlVGFnKG5hbWUpIHtcbiAgICAgICAgcmV0dXJuIFwiPC9cIiArIG5hbWUgKyBcIj5cIjtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwcm9jZXNzaW5nSW5zdHJ1Y3Rpb24oZGF0YSkge1xuICAgICAgICByZXR1cm4gXCI8XCIgKyBkYXRhICsgXCI+XCI7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY29tbWVudCh0ZXh0KSB7XG4gICAgICAgIHJldHVybiBcIjwhLS1cIiArIHRleHQgKyBcIi0tPlwiO1xuICAgIH1cblxuICAgIGNvbnN0IHRyYW5zZm9ybUh0bWxBc3luYyA9IGFzeW5jIChmaWxlbmFtZSwgY29udGVudCkgPT4gbmV3IFByb21pc2U8VHJhbnNmb3JtUmVzdWx0Pihhc3luYyAocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cbiAgICAgICAgY29uc3QgaW1wb3J0cyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgICAgICBsZXQgc2NyaXB0Q291bnQgPSAwO1xuICAgICAgICBsZXQgc2NyaXB0Q29udGV4dDtcbiAgICAgICAgbGV0IGh0bWw6IChzdHJpbmcgfCBQcm9taXNlPHN0cmluZz4pW10gPSBbXTtcblxuICAgICAgICBjb25zdCBzdHJlYW0gPSBuZXcgUGFyc2VyKHtcblxuICAgICAgICAgICAgb25wcm9jZXNzaW5naW5zdHJ1Y3Rpb24obmFtZSwgZGF0YSkge1xuICAgICAgICAgICAgICAgIGh0bWwucHVzaChwcm9jZXNzaW5nSW5zdHJ1Y3Rpb24oZGF0YSkpO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgb25vcGVudGFnKG5hbWUsIGF0dHJpYnMpIHtcblxuICAgICAgICAgICAgICAgIGlmIChuYW1lID09PSBcInNjcmlwdFwiICYmICFzY3JpcHRDb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChhdHRyaWJzLnR5cGUgPT09IFwibW9kdWxlXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHNyYyA9IGF0dHJpYnMuc3JjO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNyYykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGh0bWwucHVzaChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZUltcG9ydChzcmMsIGZpbGVuYW1lKS50aGVuKHJlbGF0aXZlVXJsID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGltcG9ydHMuYWRkKHJlbGF0aXZlVXJsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF0dHJpYnMuc3JjID0gcmVsYXRpdmVVcmw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gb3BlblRhZyhuYW1lLCBhdHRyaWJzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBodG1sLnB1c2gob3BlblRhZyhuYW1lLCBhdHRyaWJzKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKytzY3JpcHRDb3VudDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY3JpcHRDb250ZXh0ID0gaHRtbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBodG1sID0gW107XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBodG1sLnB1c2gob3BlblRhZyhuYW1lLCBhdHRyaWJzKSk7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBvbmNsb3NldGFnKG5hbWUpIHtcbiAgICAgICAgICAgICAgICBpZiAobmFtZSA9PT0gXCJzY3JpcHRcIiAmJiBzY3JpcHRDb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRleHQgPSBodG1sLmpvaW4oXCJcIik7XG4gICAgICAgICAgICAgICAgICAgIGh0bWwgPSBzY3JpcHRDb250ZXh0O1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzY3JpcHRuYW1lID0gZmlsZW5hbWUgKyBcIiA8XCIgKyBzY3JpcHRDb3VudCArIFwiPiBbc21dXCI7XG4gICAgICAgICAgICAgICAgICAgIGh0bWwucHVzaChcbiAgICAgICAgICAgICAgICAgICAgICAgIGJhYmVsVHJhbnNmb3JtZXIoc2NyaXB0bmFtZSwgdGV4dCkudGhlbigoe2NvbnRlbnQsIGxpbmtzfSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgaW1wb3J0VXJsIG9mIGxpbmtzISkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbXBvcnRzLmFkZChpbXBvcnRVcmwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY29udGVudDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIHNjcmlwdENvbnRleHQgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGh0bWwucHVzaChjbG9zZVRhZyhuYW1lKSk7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBvbnRleHQodGV4dCkge1xuICAgICAgICAgICAgICAgIGh0bWwucHVzaCh0ZXh0KTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIG9uY29tbWVudCh0ZXh0KSB7XG4gICAgICAgICAgICAgICAgaHRtbC5wdXNoKGNvbW1lbnQodGV4dCkpO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgb25jZGF0YXN0YXJ0KCkge1xuICAgICAgICAgICAgICAgIGh0bWwucHVzaChcIjwhW0NEQVRBW1wiKTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIG9uY2RhdGFlbmQoKSB7XG4gICAgICAgICAgICAgICAgaHRtbC5wdXNoKFwiXV0+XCIpO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgb25lcnJvcihlcnJvcikge1xuICAgICAgICAgICAgICAgIGxvZy5lcnJvcihcImZhaWxlZCB0byB0cmFuc2Zvcm0gaHRtbCBmaWxlOiBcIiwgZmlsZW5hbWUpO1xuICAgICAgICAgICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBhc3luYyBvbmVuZCgpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBoID0gMDsgaCA8IGh0bWwubGVuZ3RoOyBoKyspIGlmICh0eXBlb2YgaHRtbFtoXSAhPT0gXCJzdHJpbmdcIikgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgaHRtbFtoXSA9IGF3YWl0IGh0bWxbaF07XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgIGh0bWw6IGh0bWwuam9pbihcIlwiKSxcbiAgICAgICAgICAgICAgICAgICAgaW1wb3J0c1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0sIHtcbiAgICAgICAgICAgIHhtbE1vZGU6IGZhbHNlLFxuICAgICAgICAgICAgZGVjb2RlRW50aXRpZXM6IHRydWUsXG4gICAgICAgICAgICByZWNvZ25pemVDREFUQTogdHJ1ZSxcbiAgICAgICAgICAgIHJlY29nbml6ZVNlbGZDbG9zaW5nOiB0cnVlXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHN0cmVhbS5lbmQoY29udGVudCk7XG4gICAgfSk7XG5cbiAgICBhc3luYyBmdW5jdGlvbiBodG1sVHJhbnNmb3JtZXIoZmlsZW5hbWU6c3RyaW5nLCBjb250ZW50OnN0cmluZyk6IFByb21pc2U8VHJhbnNmb3JtZXJPdXRwdXQ+IHtcbiAgICAgICAgY29uc3Qge2h0bWwsIGltcG9ydHN9ID0gYXdhaXQgdHJhbnNmb3JtSHRtbEFzeW5jKGZpbGVuYW1lLCBjb250ZW50KTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGNvbnRlbnQ6IGh0bWwsXG4gICAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAgICAgXCJjb250ZW50LXR5cGVcIjogSFRNTF9DT05URU5UX1RZUEUsXG4gICAgICAgICAgICAgICAgXCJjb250ZW50LWxlbmd0aFwiOiBCdWZmZXIuYnl0ZUxlbmd0aChodG1sKSxcbiAgICAgICAgICAgICAgICBcIngtdHJhbnNmb3JtZXJcIjogXCJodG1sLXRyYW5zZm9ybWVyXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBsaW5rczogWy4uLmltcG9ydHNdXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgaHRtbFRyYW5zZm9ybWVyXG4gICAgfTtcbn0pO1xuIl19