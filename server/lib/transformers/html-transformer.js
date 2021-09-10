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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHRtbC10cmFuc2Zvcm1lci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90cmFuc2Zvcm1lcnMvaHRtbC10cmFuc2Zvcm1lci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxzREFBbUQ7QUFDbkQsMkJBQTBCO0FBQzFCLDZDQUFtQztBQUNuQyxnRUFBb0M7QUFDcEMsNkRBQWtDO0FBQ2xDLG1EQUFxRDtBQUNyRCwyREFBd0Q7QUFLM0MsUUFBQSxrQkFBa0IsR0FBRyxzQkFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFO0lBRWhELE1BQU0sRUFBQyxnQkFBZ0IsRUFBQyxHQUFHLHVDQUFtQixDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQztJQUNqRSxNQUFNLEVBQUMsYUFBYSxFQUFDLEdBQUcsMkJBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUU5QyxTQUFTLE9BQU8sQ0FBQyxJQUFJLEVBQUUsT0FBTztRQUMxQixNQUFNLElBQUksR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ2xDLElBQUksSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7WUFDakIsSUFBSSxJQUFJLEdBQUcsR0FBRyxHQUFHLElBQUksQ0FBQztZQUN0QixLQUFLLE1BQU0sSUFBSSxJQUFJLElBQUk7Z0JBQUUsSUFBSSxPQUFPLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxFQUFFO29CQUN2RCxJQUFJLElBQUksSUFBSSxJQUFJLEtBQUssV0FBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUM7aUJBQ2pEO3FCQUFNO29CQUNILElBQUksSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDO2lCQUN0QjtZQUNELE9BQU8sSUFBSSxHQUFHLEdBQUcsQ0FBQztTQUNyQjthQUFNO1lBQ0gsT0FBTyxHQUFHLEdBQUcsSUFBSSxHQUFHLEdBQUcsQ0FBQztTQUMzQjtJQUNMLENBQUM7SUFFRCxTQUFT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b0IsRUFBRSxJQUFJO1NBQzdCLENBQUMsQ0FBQztRQUVILE1BQU0sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDeEIsQ0FBQyxDQUFDLENBQUM7SUFFSCxLQUFLLFVBQVUsZUFBZSxDQUFDLFFBQWUsRUFBRSxPQUFjO1FBQzFELE1BQU0sRUFBQyxJQUFJLEVBQUUsT0FBTyxFQUFDLEdBQUcsTUFBTSxrQkFBa0IsQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDcEUsT0FBTztZQUNILE9BQU8sRUFBRSxJQUFJO1lBQ2IsT0FBTyxFQUFFO2dCQUNMLGNBQWMsRUFBRSw4QkFBaUI7Z0JBQ2pDLGdCQUFnQixFQUFFLE1BQU0sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDO2dCQUN6QyxlQUFlLEVBQUUsa0JBQWtCO2FBQ3RDO1lBQ0QsS0FBSyxFQUFFLENBQUMsR0FBRyxPQUFPLENBQUM7U0FDdEIsQ0FBQztJQUNOLENBQUM7SUFFRCxPQUFPO1FBQ0gsZUFBZTtLQUNsQixDQUFDO0FBQ04sQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge3VzZVdlYk1vZHVsZXN9IGZyb20gXCJAbW9kZXJuby93ZWItbW9kdWxlc1wiO1xyXG5pbXBvcnQge2VzY2FwZX0gZnJvbSBcImhlXCI7XHJcbmltcG9ydCB7UGFyc2VyfSBmcm9tIFwiaHRtbHBhcnNlcjJcIjtcclxuaW1wb3J0IG1lbW9pemVkIGZyb20gXCJuYW5vLW1lbW9pemVcIjtcclxuaW1wb3J0IGxvZyBmcm9tIFwiQG1vZGVybm8vbG9nZ2VyXCI7XHJcbmltcG9ydCB7SFRNTF9DT05URU5UX1RZUEV9IGZyb20gXCIuLi91dGlsL21pbWUtdHlwZXNcIjtcclxuaW1wb3J0IHt1c2VCYWJlbFRyYW5zZm9ybWVyfSBmcm9tIFwiLi9iYWJlbC10cmFuc2Zvcm1lclwiO1xyXG5pbXBvcnQge1RyYW5zZm9ybWVyT3V0cHV0fSBmcm9tIFwiLi9pbmRleFwiO1xyXG5cclxuZXhwb3J0IHR5cGUgVHJhbnNmb3JtUmVzdWx0ID0geyBodG1sOiBzdHJpbmcsIGltcG9ydHM6IFNldDxzdHJpbmc+IH07XHJcblxyXG5leHBvcnQgY29uc3QgdXNlSHRtbFRyYW5zZm9ybWVyID0gbWVtb2l6ZWQoY29uZmlnID0+IHtcclxuXHJcbiAgICBjb25zdCB7YmFiZWxUcmFuc2Zvcm1lcn0gPSB1c2VCYWJlbFRyYW5zZm9ybWVyKGNvbmZpZywgXCJpbmxpbmVcIik7XHJcbiAgICBjb25zdCB7cmVzb2x2ZUltcG9ydH0gPSB1c2VXZWJNb2R1bGVzKGNvbmZpZyk7XHJcblxyXG4gICAgZnVuY3Rpb24gb3BlblRhZyhuYW1lLCBhdHRyaWJzKSB7XHJcbiAgICAgICAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKGF0dHJpYnMpO1xyXG4gICAgICAgIGlmIChrZXlzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgbGV0IGh0bWwgPSBcIjxcIiArIG5hbWU7XHJcbiAgICAgICAgICAgIGZvciAoY29uc3QgbmFtZSBvZiBrZXlzKSBpZiAoYXR0cmlicy5oYXNPd25Qcm9wZXJ0eShuYW1lKSkge1xyXG4gICAgICAgICAgICAgICAgaHRtbCArPSBgICR7bmFtZX09XCIke2VzY2FwZShhdHRyaWJzW25hbWVdKX1cImA7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBodG1sICs9IFwiIFwiICsgbmFtZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gaHRtbCArIFwiPlwiO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVybiBcIjxcIiArIG5hbWUgKyBcIj5cIjtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gY2xvc2VUYWcobmFtZSkge1xyXG4gICAgICAgIHJldHVybiBcIjwvXCIgKyBuYW1lICsgXCI+XCI7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gcHJvY2Vzc2luZ0luc3RydWN0aW9uKGRhdGEpIHtcclxuICAgICAgICByZXR1cm4gXCI8XCIgKyBkYXRhICsgXCI+XCI7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gY29tbWVudCh0ZXh0KSB7XHJcbiAgICAgICAgcmV0dXJuIFwiPCEtLVwiICsgdGV4dCArIFwiLS0+XCI7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgdHJhbnNmb3JtSHRtbEFzeW5jID0gYXN5bmMgKGZpbGVuYW1lLCBjb250ZW50KSA9PiBuZXcgUHJvbWlzZTxUcmFuc2Zvcm1SZXN1bHQ+KGFzeW5jIChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuXHJcbiAgICAgICAgY29uc3QgaW1wb3J0cyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xyXG4gICAgICAgIGxldCBzY3JpcHRDb3VudCA9IDA7XHJcbiAgICAgICAgbGV0IHNjcmlwdENvbnRleHQ7XHJcbiAgICAgICAgbGV0IGh0bWw6IChzdHJpbmcgfCBQcm9taXNlPHN0cmluZz4pW10gPSBbXTtcclxuXHJcbiAgICAgICAgY29uc3Qgc3RyZWFtID0gbmV3IFBhcnNlcih7XHJcblxyXG4gICAgICAgICAgICBvbnByb2Nlc3NpbmdpbnN0cnVjdGlvbihuYW1lLCBkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICBodG1sLnB1c2gocHJvY2Vzc2luZ0luc3RydWN0aW9uKGRhdGEpKTtcclxuICAgICAgICAgICAgfSxcclxuXHJcbiAgICAgICAgICAgIG9ub3BlbnRhZyhuYW1lLCBhdHRyaWJzKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKG5hbWUgPT09IFwic2NyaXB0XCIgJiYgIXNjcmlwdENvbnRleHQpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoYXR0cmlicy50eXBlID09PSBcIm1vZHVsZVwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHNyYyA9IGF0dHJpYnMuc3JjO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3JjKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBodG1sLnB1c2goXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZUltcG9ydChzcmMsIGZpbGVuYW1lKS50aGVuKHJlbGF0aXZlVXJsID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW1wb3J0cy5hZGQocmVsYXRpdmVVcmwpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdHRyaWJzLnNyYyA9IHJlbGF0aXZlVXJsO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gb3BlblRhZyhuYW1lLCBhdHRyaWJzKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGh0bWwucHVzaChvcGVuVGFnKG5hbWUsIGF0dHJpYnMpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICsrc2NyaXB0Q291bnQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY3JpcHRDb250ZXh0ID0gaHRtbDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGh0bWwgPSBbXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGh0bWwucHVzaChvcGVuVGFnKG5hbWUsIGF0dHJpYnMpKTtcclxuICAgICAgICAgICAgfSxcclxuXHJcbiAgICAgICAgICAgIG9uY2xvc2V0YWcobmFtZSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKG5hbWUgPT09IFwic2NyaXB0XCIgJiYgc2NyaXB0Q29udGV4dCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRleHQgPSBodG1sLmpvaW4oXCJcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgaHRtbCA9IHNjcmlwdENvbnRleHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2NyaXB0bmFtZSA9IGZpbGVuYW1lICsgXCIgPFwiICsgc2NyaXB0Q291bnQgKyBcIj4gW3NtXVwiO1xyXG4gICAgICAgICAgICAgICAgICAgIGh0bWwucHVzaChcclxuICAgICAgICAgICAgICAgICAgICAgICAgYmFiZWxUcmFuc2Zvcm1lcihzY3JpcHRuYW1lLCB0ZXh0KS50aGVuKCh7Y29udGVudCwgbGlua3N9KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGltcG9ydFVybCBvZiBsaW5rcyEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbXBvcnRzLmFkZChpbXBvcnRVcmwpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRlbnQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgICBzY3JpcHRDb250ZXh0ID0gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaHRtbC5wdXNoKGNsb3NlVGFnKG5hbWUpKTtcclxuICAgICAgICAgICAgfSxcclxuXHJcbiAgICAgICAgICAgIG9udGV4dCh0ZXh0KSB7XHJcbiAgICAgICAgICAgICAgICBodG1sLnB1c2godGV4dCk7XHJcbiAgICAgICAgICAgIH0sXHJcblxyXG4gICAgICAgICAgICBvbmNvbW1lbnQodGV4dCkge1xyXG4gICAgICAgICAgICAgICAgaHRtbC5wdXNoKGNvbW1lbnQodGV4dCkpO1xyXG4gICAgICAgICAgICB9LFxyXG5cclxuICAgICAgICAgICAgb25jZGF0YXN0YXJ0KCkge1xyXG4gICAgICAgICAgICAgICAgaHRtbC5wdXNoKFwiPCFbQ0RBVEFbXCIpO1xyXG4gICAgICAgICAgICB9LFxyXG5cclxuICAgICAgICAgICAgb25jZGF0YWVuZCgpIHtcclxuICAgICAgICAgICAgICAgIGh0bWwucHVzaChcIl1dPlwiKTtcclxuICAgICAgICAgICAgfSxcclxuXHJcbiAgICAgICAgICAgIG9uZXJyb3IoZXJyb3IpIHtcclxuICAgICAgICAgICAgICAgIGxvZy5lcnJvcihcImZhaWxlZCB0byB0cmFuc2Zvcm0gaHRtbCBmaWxlOiBcIiwgZmlsZW5hbWUpO1xyXG4gICAgICAgICAgICAgICAgcmVqZWN0KGVycm9yKTtcclxuICAgICAgICAgICAgfSxcclxuXHJcbiAgICAgICAgICAgIGFzeW5jIG9uZW5kKCkge1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaCA9IDA7IGggPCBodG1sLmxlbmd0aDsgaCsrKSBpZiAodHlwZW9mIGh0bWxbaF0gIT09IFwic3RyaW5nXCIpIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaHRtbFtoXSA9IGF3YWl0IGh0bWxbaF07XHJcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnJvcik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKHtcclxuICAgICAgICAgICAgICAgICAgICBodG1sOiBodG1sLmpvaW4oXCJcIiksXHJcbiAgICAgICAgICAgICAgICAgICAgaW1wb3J0c1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfSwge1xyXG4gICAgICAgICAgICB4bWxNb2RlOiBmYWxzZSxcclxuICAgICAgICAgICAgZGVjb2RlRW50aXRpZXM6IHRydWUsXHJcbiAgICAgICAgICAgIHJlY29nbml6ZUNEQVRBOiB0cnVlLFxyXG4gICAgICAgICAgICByZWNvZ25pemVTZWxmQ2xvc2luZzogdHJ1ZVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBzdHJlYW0uZW5kKGNvbnRlbnQpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgYXN5bmMgZnVuY3Rpb24gaHRtbFRyYW5zZm9ybWVyKGZpbGVuYW1lOnN0cmluZywgY29udGVudDpzdHJpbmcpOiBQcm9taXNlPFRyYW5zZm9ybWVyT3V0cHV0PiB7XHJcbiAgICAgICAgY29uc3Qge2h0bWwsIGltcG9ydHN9ID0gYXdhaXQgdHJhbnNmb3JtSHRtbEFzeW5jKGZpbGVuYW1lLCBjb250ZW50KTtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBjb250ZW50OiBodG1sLFxyXG4gICAgICAgICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgICAgICAgICBcImNvbnRlbnQtdHlwZVwiOiBIVE1MX0NPTlRFTlRfVFlQRSxcclxuICAgICAgICAgICAgICAgIFwiY29udGVudC1sZW5ndGhcIjogQnVmZmVyLmJ5dGVMZW5ndGgoaHRtbCksXHJcbiAgICAgICAgICAgICAgICBcIngtdHJhbnNmb3JtZXJcIjogXCJodG1sLXRyYW5zZm9ybWVyXCJcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgbGlua3M6IFsuLi5pbXBvcnRzXVxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBodG1sVHJhbnNmb3JtZXJcclxuICAgIH07XHJcbn0pO1xyXG4iXX0=