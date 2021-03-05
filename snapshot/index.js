import he from "he";
import {isVoid} from "./void-elements.js";

const parser = new DOMParser();

function parseHTML(html) {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.firstElementChild;
}

const DEFAULTS = {
    tab: "  ",
    comments: false
};

/**
 * Given a Node creates a snapshot that can be used to compare it to another Node or to store it for later
 *
 * @param {Node|Element|string} root
 * @param {{
 *  [indent]: string,
 *  [comments]: boolean
 * }} options
 * @returns {string}
 */
export function snapshot(root, options = {}) {

    options = {...DEFAULTS, ...options};

    /**
     * @type {Node|Element}
     */
    let node = typeof root === "string" ? root = parseHTML(root) : root;
    /**
     * @type {string}
     */
    let currentIndent = "";
    /**
     * @type {string}
     */
    let __snapshot__ = "";

    const end = root.parentNode || null;

    main: while (node !== end) {

        if (Node.DOCUMENT_NODE === node.nodeType) {
            __snapshot__ += currentIndent + "<!DOCTYPE " + node.firstChild["name"] + ">\n";
            node = node.firstElementChild;
            continue;
        } else if (Node.ELEMENT_NODE === node.nodeType) {
            __snapshot__ += `${currentIndent}<${node.nodeName.toLowerCase()}`;
            for (const {name, value} of node.attributes) {
                __snapshot__ += value ? ` ${name}="${he.escape(value)}"` : ` ${name}`;
            }
            __snapshot__ += ">";
            if (node.shadowRoot) {
                currentIndent += "  ";
                __snapshot__ += `\n${currentIndent}#shadow-root (${node.shadowRoot.mode})\n`;
                currentIndent += "\u25B8" + options.tab.substring(1);
                node = node.shadowRoot.firstChild;
            } else if (node.firstElementChild) {
                currentIndent += options.tab;
                __snapshot__ += "\n";
                node = node.firstChild;
                continue;
            } else if (node.tagName === "SCRIPT") {
                __snapshot__ += "…";
            } else {
                __snapshot__ += node.textContent;
            }
        } else if (Node.TEXT_NODE === node.nodeType) {
            node.nodeValue.split("\n").map(line => line.trim()).filter(line => line).forEach(line => {
                __snapshot__ += currentIndent + options.tab + line + "\n";
            });
        } else if (Node.CDATA_SECTION_NODE === node.nodeType) {
        } else if (Node.PROCESSING_INSTRUCTION_NODE === node.nodeType) {
        } else if (Node.COMMENT_NODE === node.nodeType) {
            if (options.comments) {
                const lines = node.nodeValue.split("\n");
                if (lines.length > 1) {
                    __snapshot__ += currentIndent + "<!--\n";
                    lines.map(line => line.trim()).filter(line => line).forEach(line => {
                        __snapshot__ += `${currentIndent}  ${line}\n`;
                    });
                    __snapshot__ += currentIndent + "-->\n";
                } else {
                    __snapshot__ += `${currentIndent}<!-- ${lines[0].trim()} -->\n`;
                }
            }
        } else if (Node.DOCUMENT_TYPE_NODE === node.nodeType) {
        } else if (Node.DOCUMENT_FRAGMENT_NODE === node.nodeType) {
        }

        while (true) {

            if (Node.ELEMENT_NODE === node.nodeType) {
                if (isVoid(node)) {
                    __snapshot__ += "\n";
                } else if (node.firstElementChild) {
                    currentIndent = currentIndent.slice(0, -2);
                    __snapshot__ += `${currentIndent}</${node.nodeName.toLowerCase()}>\n`;
                } else {
                    __snapshot__ += `</${node.nodeName.toLowerCase()}>\n`;
                }
            }

            if (node.nextSibling) {
                node = node.nextSibling;
                continue main;
            }

            if (node.parentNode instanceof ShadowRoot) {
                const host = node.parentNode.host;
                currentIndent = currentIndent.slice(0, -2);
                if (host.firstChild) {
                    node = host.firstChild;
                    continue main;
                } else {
                    node = host;
                    continue;
                }
            }

            node = node.parentElement;

            if (node === end) {
                break main;
            }
        }

    }

    return __snapshot__.trim();
}
