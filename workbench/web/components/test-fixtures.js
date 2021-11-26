import "@moderno/components";
import {css, customElement, LitElement, property} from "lit-element";
import {html} from "lit-html";
import {smoothScrollbar, smoothScrollbarStyle} from "./common-styles.js";
import styles from "./styles.scss";

const THEME_ICONS = {
    "auto": "adjust",
    "light": "sun",
    "dark": "moon"
};

@customElement("test-fixtures")
export class TestFixtures extends LitElement {

    static styles = [styles, smoothScrollbarStyle, css`
        :host {
            display: contents;
        }
        :host > div {
            flex: 1 1 0;
            min-height: 0;
        }
        #header {
            white-space: nowrap;
            overflow: hidden; 
            min-height: 2.5rem;
            font-size: 1.25rem;
        }
        #body {
            min-height: 0;
        }
        #footer {
            min-height: 1.5rem;
        }
    `].filter(css => css);

    slots = new Set(["root"]);

    constructor() {
        super();
        const {searchParams} = new URL(document.location);
        this.module = searchParams.get("spec");
    }

    @property()
    theme = localStorage.getItem("theme") || "auto";

    @property()
    graphPaperRGB = localStorage.getItem("graph-paper-rgb") || "000";

    toggleGraphPaperColor({target}) {
        const toggle = parseInt(target.closest("[data-toggle]").dataset.toggle);
        const [r, g, b] = this.graphPaperRGB;
        this.graphPaperRGB = [
            toggle === 0 ? r === "0" ? "f" : "0" : r,
            toggle === 1 ? g === "0" ? "f" : "0" : g,
            toggle === 2 ? b === "0" ? "f" : "0" : b
        ].join("");
        if (this.graphPaperRGB !== "000") {
            localStorage.setItem("graph-paper-rgb", this.graphPaperRGB);
        } else {
            localStorage.removeItem("graph-paper-rgb");
        }
    }

    firstUpdated() {
        const body = this.shadowRoot.getElementById("body");
        if (smoothScrollbar(body)) {
            body.querySelector(".scroll-content").style.height = "100%";
            body.querySelector(".scrollbar-track-y").style.right = "2px";
        }
    }

    render() {
        const {module, theme, graphPaperRGB} = this;
        return html`
            <div class="d-flex flex-column h-100 w-100 position-relative surface">
                <div id="header" class="d-flex flex-row align-items-center mx-3">
                    <div>
                        <fa-icon name="home"></fa-icon>
                        <a class="align-middle" @click=${this.gotoSpec} href="/workbench/frame.html?module=${module}">${module}</a>
                    </div>
                    <div class="flex-fill"></div>
                    <div>
                        <fa-icon-solid name="circle" xs @click=${this.toggleGraphPaperColor} 
                                       data-toggle="0" class="mr-1 text-danger" 
                                       style="opacity: ${graphPaperRGB[0] === "f" ? 1 : 0.25}"></fa-icon-solid>
                        <fa-icon-solid name="circle" xs @click=${this.toggleGraphPaperColor} 
                                       data-toggle="1" class="mr-1 text-success" 
                                       style="opacity: ${graphPaperRGB[1] === "f" ? 1 : 0.25}"></fa-icon-solid>
                        <fa-icon-solid name="circle" xs @click=${this.toggleGraphPaperColor} 
                                       data-toggle="2" class="mr-1 text-primary mr-2" 
                                       style="opacity: ${graphPaperRGB[2] === "f" ? 1 : 0.25}"></fa-icon-solid>
                        <fa-icon name=${THEME_ICONS[theme]} @click=${this.toggleTheme}></fa-icon>
                    </div>
                </div>
                <div id="body" class="flex-fill">
                    <div class="graph-paper __${graphPaperRGB}__ mx-3" style="min-height: 100%">
                        ${[...this.slots].map(slot => html`
                            <div class="d-flex flex-row flex-wrap"><slot name=${slot}></slot></div>
                        `)}
                    </div>
                </div>                    
                <div id="footer" class="d-flex flex-row align-items-center menu">
                    <div class="flex-fill"></div>
                </div>
            </div>
        `;
    }

    gotoSpec(e) {
        e.preventDefault();
        window.top.location = e.target.getAttribute("href");
    }

    toggleTheme() {
        if (document.prefersTheme === "dark") {
            if (this.theme === "auto") {
                localStorage.setItem("theme", "light");
            } else if (this.theme === "light") {
                localStorage.setItem("theme", "dark");
            } else if (this.theme === "dark") {
                localStorage.removeItem("theme");
            }
        } else {
            if (this.theme === "auto") {
                localStorage.setItem("theme", "dark");
            } else if (this.theme === "dark") {
                localStorage.setItem("theme", "light");
            } else if (this.theme === "light") {
                localStorage.removeItem("theme");
            }
        }
        location.reload();
    }
}
