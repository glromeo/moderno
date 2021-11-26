import {send, on} from "/moderno/browser-toolkit.js";
import {css, customElement, html, LitElement, property} from "lit-element";
import {nothing, render} from "lit-html";
import {ifDefined} from "lit-html/directives/if-defined.js";
import {smoothScrollbar, smoothScrollbarStyle} from "./common-styles.js";
import {rippleEffect} from "./ripple-effect.js";
import rippleStyle from "./ripple-effect.scss";

import styles from "./styles.scss";


function listItemText(text) {
    const span = document.createElement("span");
    span.setAttribute("class", "pl-2 align-middle");
    span.innerHTML = text;
    return span;
}

@customElement("test-navigator")
export class TestNavigator extends LitElement {

    // language=CSS

    static styles = [styles, rippleStyle, smoothScrollbarStyle, css`
        :host {
            display: contents;
        }

        .navigator {
            min-height: 0;
        }

        #heading {
            position: relative;
            z-index: 1000;
            height: 2.5rem;
            font-size: 1.125em;
            margin-bottom: .5rem !important;
            background-color: white;
            outline: 0px solid rgba(100, 149, 237, .75);
            overflow: unset;
            transition: background .25s ease-in-out, outline-width .25s ease-in-out;
        }

        :host([dark]) #heading {
            background-color: #222;
            outline: 0px solid rgba(100, 149, 237, .75);
        }

        #heading.active {
            background-color: hsl(215, 75%, 90%);
            outline: 2px solid hsla(215, 75%, 50%, .5);
        }

        :host([dark]) #heading.active {
            background-color: hsl(215, 75%, 20%);
            outline: 2px solid hsla(215, 75%, 50%, .5);
        }

        .list-item {
            border-top: 1px solid transparent;
            border-bottom: 1px solid transparent;
            min-height: 2.5rem;
            max-height: 2.5rem;
            font-size: 1em;
            position: relative;
            transition: background 66ms ease-in-out;
        }

        .list-item span {
            line-height: 1.25rem;
        }

        .list-item.spec {
            color: hsl(215, 75%, 40%);
            cursor: pointer;
        }

        :host([dark]) .list-item.spec {
            color: hsl(215, 75%, 60%);
        }

        .list-item:hover {
            background-color: #eee;
            border-top: 1px solid #ddd;
            border-bottom: 1px solid #ddd;
            transition: background 66ms ease-in-out;
        }

        :host([dark]) .list-item:hover {
            background-color: #282828;
            border-top: 1px solid #333;
            border-bottom: 1px solid #333;
        }

        .list-item.spec:hover,
        .list-item.spec.ripple-active {
            background-color: hsl(215, 75%, 90%);
            border-top: 1px solid hsl(215, 75%, 80%);
            border-bottom: 1px solid hsl(215, 75%, 80%);
            transition: background 66ms ease-in-out;
        }

        :host([dark]) .list-item.spec:hover,
        :host([dark]) .list-item.spec.ripple-active {
            background-color: hsl(215, 75%, 20%);
            border-top: 1px solid hsl(215, 75%, 30%);
            border-bottom: 1px solid hsl(215, 75%, 30%);
            transition: background 66ms ease-in-out;
        }


        input.search {
            border: none;
            margin: 0;
            padding: 0;
            outline: none;
            min-width: 0;
        }

        .search-hilight {
            background-color: lightgoldenrodyellow;
            outline: 1px solid lightgray;
        }

        :host([dark]) .search-hilight {
            background-color: #440;
            outline: 1px solid #880;
        }

        .suite {
            white-space: nowrap;
            font-weight: bold;
            text-transform: capitalize;
            border-top: 2px solid;
            border-bottom: 1px solid lightgray;
        }

        :host([dark]) .suite {
            border-bottom: 1px solid #444;
        }

        .suite:hover {
            background-color: #eee;
        }

        :host([dark]) .suite:hover {
            background-color: #282828;
        }

        .fixture {
            border-top: 1px solid lightgray;
        }

        :host([dark]) .fixture {
            border-top: 1px solid #333;
        }

        .fixture:hover {
            background-color: #eee;
        }

        :host([dark]) .fixture:hover {
            background-color: #282828;
        }
    `];

    @property({type: String})
    search;

    @property({type: Boolean})
    searchActive = false;

    spec = "";

    @property({type: Object})
    specs = [];

    constructor() {
        super();
        const navigator = this;

        this.clearSearch();

        const {searchParams} = new URL(location);
        if (!searchParams.has("spec")) {

            send("find-specs");
            on("specs", entries => navigator.specs = entries);

        } else {
            navigator.spec = searchParams.get("spec");

            navigator.suites = new class extends Map {
                set(key, value) {
                    const that = super.set(key, value);
                    navigator.requestUpdate();
                    return that;
                }

                delete(key) {
                    const that = super.delete(key);
                    navigator.requestUpdate();
                    return that;
                }

                merge(key, value) {
                    return this.set(key, {...this.get(key), ...value});
                }
            };
        }
    }

    load({target}) {
        const item = target.closest(".list-item");
        if (item) {
            const path = item.path;
            const search = `?spec=${encodeURI(path)}`;
            if (location.search !== search) {
                location.href = `/workbench/index.html${search}`;
            }
        } else {
            location.href = `/workbench/index.html`;
        }
    }

    updateSearch({target}) {
        if (target.value) {
            const regExp = new RegExp(target.value, "ig");
            const hilight = `<span class="search-hilight">${target.value}</span>`;
            this.search = function (text) {
                const split = text.split(regExp);
                return {
                    matches: split.length > 1,
                    rewrite: listItemText(split.join(hilight))
                };
            };
        } else {
            this.clearSearch();
        }
    }

    clearSearch() {
        this.search = function (text) {
            return {
                matches: true,
                rewrite: listItemText(text)
            };
        };
    }

    activateSearch() {
        this.searchActive = true;
    }

    disableSearch() {
        this.searchActive = false;
    }

    selectSearch() {
        this.shadowRoot.getElementById("search").select();
    }

    clickSearch() {
        if (this.searchActive) {
            this.clearSearch();
            this.disableSearch();
        } else {
            this.activateSearch();
            this.selectSearch();
        }
    }

    firstUpdated() {
        smoothScrollbar(this.shadowRoot.getElementById("suite"));
    }

    render() {
        const spec = this.spec ? this.spec.substring(this.spec.lastIndexOf("/") + 1) : undefined;
        return html`
            <div class="navigator pl-2 py-2 flex-fill d-flex flex-column align-items-stretch">
                <div id="heading" class="p-2 d-flex flex-row ${this.searchActive ? "active" : "inactive"} surface input">
                    <fa-icon name="folder-tree" type="button" @click=${this.load} class="mr-0"></fa-icon>
                    <input id="search" class="search flex-fill" type="text" class="align-middle"
                           @focus=${this.activateSearch}
                           @blur=${this.disableSearch} 
                           @click=${this.selectSearch}
                           @input=${this.updateSearch}
                           @change=${this.updateSearch}
                           value=${ifDefined(spec)}
                           spellcheck="false"
                           autocomplete="off">
                    <fa-icon name="search" type="button" @click=${this.clickSearch}></fa-icon>
                </div>
                <div id="specs" class="d-flex flex-column align-items-stretch paper-sheet surface">
                    <!-- @see this.renderSpecs(...) -->
                </div>
                <div id="suite" class="d-flex flex-column paper-sheet surface">
                    ${this.renderSuites(this.suites)}
                </div>
            </div>
        `;
    }

    renderSuites(suites = []) {
        return [...suites].sort(([l], [r]) => l < r ? -1 : r === l ? 0 : 1).map(([id, suite]) => {
            const status = suite.status;
            const level = status === undefined ?
                "primary" : suite.failed ?
                    "danger" : suite.pending ?
                        "warning" : "success";
            const icon = status === undefined ?
                "question-circle" : suite.failed ?
                    "times-circle" : suite.pending ?
                        "clock" : "check-circle";
            return html`
                <div id="${id}" title="${suite.description}" @click=${() => this.suite = suite}
                     class="p-2 suite text-${level} ${suite === this.suite && "selected" || ""}">
                    <fa-icon name=${icon} style="margin-right: 0.125em"></fa-icon>
                    <span class="align-middle">${suite.fullName}</span>
                </div>
                ${this.renderFixtures(suite.fixtures)}                        
            `;
        });
    }

    renderFixtures(fixtures = []) {
        return fixtures.map((fixture, index) => {
            return html`
                <div index="${index}" class="fixture d-flex flex-column"
                     .fixture=${fixture}
                     @click=${this.fixtureClicked} 
                     @mouseenter=${this.fixtureEnter} 
                     @mouseleave=${this.fixtureLeave}>
                    <div class="p-2">
                        <fa-icon name="edit" style="margin: 0 1px;"></fa-icon>
                        <span class="align-middle">${fixture.getAttribute("name")}</span>
                    </div>
                    <div class="flex-fill pr-2" style="padding-left: 2.75em;">
                        ${fixture.knobs}
                    </div>
                </div>
            `;
        });
    }

    fixtureClicked(e) {
        e.stopPropagation();
        const {fixture} = e.target.closest(".fixture");
    }

    fixtureEnter(e) {
        const {fixture} = e.target.closest(".fixture");
        fixture.classList.add("hover");
    }

    fixtureLeave(e) {
        const {fixture} = e.target.closest(".fixture");
        fixture.classList.remove("hover");
    }

    updated(changed) {
        if (changed.has("specs") || changed.has("search") || this.__HOT_RELOAD__) {
            this.renderSpecs();
        }
    }

    renderSpecs(paths = this.specs) {

        const tree = {};

        for (const path of paths) {
            let at = tree;
            const split = path.split("/");
            const name = split.pop();
            for (const step of split) {
                at = at[step] || (at[step] = {});
            }
            at[name] = path;
        }

        const recurse = (node, indent) => {
            if (node) {
                const tr = [];
                for (let name of Object.keys(node)) {
                    const {matches, rewrite} = this.search(name);
                    if (typeof node[name] === "object") {
                        const children = recurse(node[name], indent + 1);
                        if (matches || children) tr.push(html`
                            <div class="list-item p-2 d-flex flex-row">
                                <fa-icon name="folder-open" style="margin-left: ${indent * .666}em"></fa-icon>
                                ${rewrite}
                            </div>
                        `);
                        if (children) tr.push(...children);
                    } else {
                        if (matches) tr.push(html`
                            <div class="list-item p-2 d-flex flex-row spec ripple-surface"
                                 @click=${this.load} .path=${node[name]} 
                                 @mousedown=${rippleEffect}>
                                <fa-icon name="file-alt" style="margin-left: ${indent * .666}em"></fa-icon>
                                ${rewrite}
                            </div>
                        `);
                    }
                }
                if (tr.length) return tr;
            }
        };

        render(recurse(tree[""], 0) || nothing, this.shadowRoot.getElementById("specs"));
    }
}
