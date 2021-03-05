import "@moderno/components";
import {css, customElement, LitElement, property} from "lit-element";
import {html} from "lit-html";

import {on} from "/moderno/browser-toolkit.js";

import styles from "./styles.scss";

@customElement("test-workbench")
export class TestWorkbench extends LitElement {

    static styles = [styles, css`
    // 1
        :host {
            display: contents;
        }
        .border-dark {
            border-color: rgb(90,140,180) !important;
            border-width: 2px;
        }
        .workbench {
            min-width: 0;
            overflow: hidden;
            padding: .5rem .5rem .5rem 0;
            display: flex;
            flex-direction: column;
        }
        #pills div {
            overflow: visible;
        }
    `];

    constructor() {
        super();

        if (window.matchMedia("(prefers-color-scheme)").media !== "not all") {
            console.log("🎉 Dark mode is supported");
        }

        this.theme = localStorage.getItem("theme") || "light";
        this.addEventListener("theme", event => this.theme = event.detail.theme);

        on("open", () => this.connected = true);
        on("close", () => this.connected = false);
        // on("hmr:reload", ({path}) => {
        //     console.log(`detected change in: ${path}`);
        //     if (this.reload) {
        //         console.log(`reloading!...`);
        //         location.reload();
        //     } else {
        //         this.changed = this.changed.indexOf(path) > 0 ? this.changed : [...this.changed, path];
        //     }
        // });
    }

    @property({type: String, reflect: true})
    theme;

    @property({type: Boolean, reflect: true})
    connected = false;

    @property({type: Boolean, reflect: true})
    reload = localStorage.getItem("reload") !== "disable";

    @property({type: Array})
    changed = [];

    toggleReload() {
        this.reload = !this.reload;
        if (this.reload) {
            console.log("reload enabled");
            localStorage.removeItem("reload");
            if (this.changed.length) {
                console.log("changes were detected, reloading!...");
                location.reload();
           }
        } else {
            console.log("reload disabled");
            localStorage.setItem("reload", "disable");
        }
    }

    render() {
        return html`
            <div class="w-100 h-100 d-flex align-items-stretch backdrop" style="overflow-x: auto">
                <resizable-section id="nav" class="pr-2 d-flex flex-column" persist="nav:resizer" right>
                    <slot name="navigator"></slot>
                    <div id="pills" class="m-2 d-flex flex-row align-items-center">
                        <div class="p-2 rounded-pill surface border border-dark" style="min-height: 3.2rem; min-width: 3.2rem;">
                            <fa-icon lg name=${this.connected ? "handshake" : "handshake-slash"} variant="light"></fa-icon>
                        </div>
                        <div class="ml-2 p-2 rounded-pill surface border border-dark" style="min-height: 1.6rem; min-width: 1.6rem;">
                            <fa-icon md name=${this.reload ? "sync" : "ban"} variant="light" @click=${this.toggleReload}></fa-icon>
                            <alert-badge .alerts=${this.changed} style="top: -2.25em;"></alert-badge>
                        </div>
                    </div>
                </resizable-section>
                <div class="workbench flex-fill">
                    <slot name="fixtures"></slot>
                    <slot name="report"></slot>                
                </div>
            </div>
        `;

    }
}
