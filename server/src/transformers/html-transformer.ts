import {useWebModules} from "@moderno/web-modules";
import {escape} from "he";
import {Parser} from "htmlparser2";
import memoized from "nano-memoize";
import log from "@moderno/logger";
import {HTML_CONTENT_TYPE} from "../util/mime-types";
import {useBabelTransformer} from "./babel-transformer";
import {TransformerOutput} from "./index";

export type TransformResult = { html: string, imports: Set<string> };

export const useHtmlTransformer = memoized(config => {

    const {babelTransformer} = useBabelTransformer(config, "inline");
    const {resolveImport} = useWebModules(config);

    function openTag(name, attribs) {
        const keys = Object.keys(attribs);
        if (keys.length > 0) {
            let html = "<" + name;
            for (const name of keys) if (attribs.hasOwnProperty(name)) {
                html += ` ${name}="${escape(attribs[name])}"`;
            } else {
                html += " " + name;
            }
            return html + ">";
        } else {
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

    const transformHtmlAsync = async (filename, content) => new Promise<TransformResult>(async (resolve, reject) => {

        const imports = new Set<string>();
        let scriptCount = 0;
        let scriptContext;
        let html: (string | Promise<string>)[] = [];

        const stream = new Parser({

            onprocessinginstruction(name, data) {
                html.push(processingInstruction(data));
            },

            onopentag(name, attribs) {

                if (name === "script" && !scriptContext) {
                    if (attribs.type === "module") {
                        const src = attribs.src;
                        if (src) {
                            html.push(
                                resolveImport(src, filename).then(relativeUrl => {
                                    imports.add(relativeUrl);
                                    attribs.src = relativeUrl;
                                    return openTag(name, attribs);
                                })
                            );
                        } else {
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
                    html.push(
                        babelTransformer(scriptname, text).then(({content, links}) => {
                            for (const importUrl of links!) {
                                imports.add(importUrl);
                            }
                            return content;
                        })
                    );
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
                log.error("failed to transform html file: ", filename);
                reject(error);
            },

            async onend() {
                for (let h = 0; h < html.length; h++) if (typeof html[h] !== "string") try {
                    html[h] = await html[h];
                } catch (error) {
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

    async function htmlTransformer(filename:string, content:string): Promise<TransformerOutput> {
        const {html, imports} = await transformHtmlAsync(filename, content);
        return {
            content: html,
            headers: {
                "content-type": HTML_CONTENT_TYPE,
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
