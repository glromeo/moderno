import fastDiff from "fast-diff";
import {css, customElement, LitElement, property} from "lit-element";
import {html} from "lit-html";
import {unsafeHTML} from "lit-html/directives/unsafe-html.js";
import styles from "./styles.scss";

const HTML_ESCAPE = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
    "\r": ""
};

@customElement("html-diff")
export default class HtmlDiff extends LitElement {

    static styles = [styles, css`

        :host {
            display: contents;
        }

        #main {
            box-sizing: border-box;
            overflow-y: auto;
            overflow-x: hidden;
            min-width: unset;
            height: 10rem;
        }

        #container {
            width: 100%;
            display: flex;
            align-items: stretch;
        }
        
        #expected {
            flex: 1 1 0;
            overflow-x: scroll;
        }

        #actual {
            flex: 1 1 0;
            overflow-x: scroll;
        }
        
        #actual .diff {
            background-color: #FED;
            color: #864;
            white-space: pre;
        }

        #expected .diff {
            background-color: #DEF;
            color: #468;
            white-space: pre;
        }

        #actual .header {
            color: darkred;
            border-bottom: 2px solid darkred;
            font-weight: bold;
        }

        #expected .header {
            color: darkblue;
            border-bottom: 2px solid darkblue;
            font-weight: bold;
        }

        .same {
            background-color: white;
            color: dimgrey;
            white-space: pre;
        }

        .expected {
            background-color: lightskyblue;
            color: darkblue;
            white-space: pre;
        }

        .actual {
            background-color: lightpink;
            color: darkred;
            white-space: pre;
        }

        span.expected,
        span.actual {
            font-weight: bold;
        }    
        
        .body {
            font-family: var(--font-family-monospace);
        }
            
    `].filter(style => style);

    @property({type: String})
    title;
    @property({type: String})
    left;
    @property({type: String})
    right;
    @property({type: String})
    diff = [];

    updated(changed) {
        if (changed.has("left") || changed.has("right")) {
            console.time("diff");
            this.diff = fastDiff(this.left || "", this.right || "");
            console.timeEnd("diff");
        }
    }

    render() {

        let expected = "", actual = "", line, span = false, typeClass;

        for (let [type, text] of this.diff) {

            typeClass = type > 0 ? "actual" : type < 0 ? "expected" : "same";
            text = text.replace(/[&<>"'\\/\r]/g, match => HTML_ESCAPE[match]);

            do {
                const nl = text.indexOf("\n");
                if (nl === -1) {
                    if (!line) {
                        line = type === 0 ? [text, text] : type === 1 ? ["", `<span class="actual">${text}`] : [`<span class="expected">${text}`, ""];
                        span = type !== 0;
                    } else {
                        if (span) {
                            line = [line[0] + "</span>", line[1] + "</span>"];
                        }
                        line = type === 0 ? [line[0] + text, line[1] + text] : type === 1 ? [line[0], `${line[1]}<span class="actual">${text}`] : [`${line[0]}<span class="expected">${text}`, line[1]];
                        span = type !== 0;
                    }
                    break;
                } else {
                    const next = text.substring(0, nl);
                    text = text.substring(nl + 1);
                    if (!line) {
                        if (type <= 0) {
                            expected += `<div class="${typeClass}">${next}</div>\n`;
                        }
                        if (type >= 0) {
                            actual += `<div class="${typeClass}">${next}</div>\n`;
                        }
                    } else {
                        if (span) {
                            line = [line[0] + "</span>", line[1] + "</span>"];
                        }
                        line = type === 0 ? [line[0] + next, line[1] + next] : type === 1 ? [line[0], `${line[1]}<span class="actual">${next}`] : [`${line[0]}<span class="expected">${next}`, line[1]];
                        expected += `<div class="diff">${line[0]}</div>\n`;
                        actual += `<div class="diff">${line[1]}</div>\n`;
                        line = undefined;
                    }
                }
            } while (text);

        }

        if (line) {
            expected += `<div class="${typeClass}">${line[0]}</div>\n`;
            actual += `<div class="${typeClass}">${line[1]}</div>\n`;
        }

        return html`
            <div id="main" style="height: auto;">
                <div id="container">
                    <div id="expected" class="d-flex flex-column">
                        <div class="header">Expected:</div>
                        <div class="body flex-fill" style="min-width: fit-content;">
                            ${unsafeHTML(expected)}
                        </div>
                    </div>
                    <div style="padding: 1rem;"></div>
                    <div id="actual" class="d-flex flex-column">
                        <div class="header">Actual:</div>
                        <div class="body flex-fill" style="min-width: fit-content;">
                            ${unsafeHTML(actual)}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}
