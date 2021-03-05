import "@moderno/components";
import styles from "./styles.scss";

import {css, customElement, LitElement, property} from "lit-element";
import {html, nothing} from "lit-html";

@customElement("test-suite")
export class TestSuite extends LitElement {

    // language=CSS

    static styles = [styles, css`
        :host {
            display: contents;
        }

        .suite {
            font-family: var(--font-family-monospace);
        }
        
        #header {
            font-family: var(--font-family-sans-serif);
            border-bottom: .25rem solid white;
            box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.125);
        }
        
        :host([dark]) #header {
            border-bottom: .25rem solid #222;
            box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.125);
        }

        #description {
            font-weight: bold;
            max-width: 50%;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        
        #content {
            overflow: hidden;
            transition: height 0.3s ease-out, border-bottom 0.3s ease-out;
        }

        .results {
            border-bottom: 1px solid lightgray;
        }

        :host([dark]) .results {
            border-bottom: 1px solid #444;
        }

        .results.length-0 {
            display: none !important;
        }

        .flex-fill {
            min-width: 0;
        }

        .summary {
            line-height: 1.333em;
        }
    `];

    @property()
    title;

    @property({type: Array})
    specs = [];

    @property({type: Number})
    passed = 0;
    @property({type: Number})
    failed = 0;
    @property({type: Number})
    pending = 0;

    @property({type: Boolean})
    running = false;
    @property({type: Number})
    progress = 0;
    @property({type: Number})
    total = 0;

    @property({type: Boolean})
    isCollapsed;

    toggleContent() {
        this.isCollapsed = !this.isCollapsed;
    }

    updated(changed) {
        if (changed.has("isCollapsed") && this.isCollapsed !== undefined) {
            const contentElement = this.shadowRoot.getElementById("content");
            if (this.isCollapsed) {
                this.collapseContent(contentElement);
            } else {
                this.expandContent(contentElement);
            }
        }
    }

    collapseContent(element) {
        const sectionHeight = element.scrollHeight;
        const elementTransition = element.style.transition;
        element.style.transition = "";
        requestAnimationFrame(() => {
            element.style.height = sectionHeight + "px";
            element.style.transition = elementTransition;
            requestAnimationFrame(() => {
                element.style.height = 0 + "px";
            });
        });
    }

    expandContent(element) {
        const sectionHeight = element.scrollHeight;
        element.style.height = sectionHeight + "px";
        const transitionedCallback = function (e) {
            element.removeEventListener("transitionend", transitionedCallback);
            element.style.height = null;
        };
        element.addEventListener("transitionend", transitionedCallback);
    }

    render() {
        const level = this.failed > 0 ? "danger" : this.pending > 0 ? "warning" : "success";

        const passedStyle = this.passed > 0 ? "opacity: 1" : "opacity: 0.5";
        const failedStyle = this.failed > 0 ? "opacity: 1" : "opacity: 0.5";
        const pendingStyle = this.pending > 0 ? "opacity: 1" : "opacity: 0.5";

        return html`
            <div class="suite d-flex flex-column flex-fill">
                <div id="header" class="d-flex flex-row align-items-center position-relative border-${level}">
                    <div id="description" class="pt-2 pb-1 pl-2 text-${level}">
                        <fa-icon name=${this.isCollapsed ? "caret-up" : "caret-down"} @click=${this.toggleContent}></fa-icon>
                        <span class="text-capitalize align-middle" style="padding-left: 0.1rem">${this.title}</span>
                    </div>
                    <div class="flex-fill"></div>
                    ${this.running ? html`
                        <div class="summary py-1 pr-3 d-flex flex-row align-items-center">
                            <fa-icon name="check-circle" class="text-success mx-1" style=${passedStyle}></fa-icon>
                            <span class="text-success mr-1" style=${passedStyle}>${this.passed}</span>
                            <fa-icon name="times-circle" class="text-danger mx-1" style=${failedStyle}></fa-icon>
                            <span class="text-danger mr-1" style=${failedStyle}>${this.failed}</span>
                            <fa-icon name="clock" class="text-warning mx-1" style=${pendingStyle}></fa-icon>
                            <span class="text-warning mr-1" style=${pendingStyle}>${this.pending}</span>
                        </div>
                    ` : nothing}
                </div>
                <div id="content" class="flex-fill d-flex flex-column">
                    <div class="results d-flex flex-column align-items-stretch length-${this.specs.length}">
                        ${this.specs.map(spec => this.renderSpec(spec))}
                    </div>
                    <slot></slot>
                </div>
            </div>
        `;
    }

    icons = {
        "passed": "check-circle",
        "failed": "times-circle",
        "pending": "clock"
    };

    renderSpec({status, description, failedExpectations}) {
        const level = status === "failed" ? "danger" : status === "pending" ? "warning" : "success";
        return html`
            <div class="py-1 d-flex flex-row align-items-center text-${level} spec">
                <fa-icon name=${this.icons[status]} class="mx-2"></fa-icon>
                <span class="text-capitalize">${description}</span>
            </div>
            ${failedExpectations.map(({message, lines, details, more}, index) => html`
                <div class="d-flex flex-row align-items-center text-danger" style="padding-left: 1.66rem">
                    <fa-icon name="exclamation-circle" class="mx-1"></fa-icon>
                    <span class="flex-fill">${message}</span>                   
                </div>
                ${lines ? this.renderStackTrace(lines, failedExpectations[index], more) : nothing}
                ${more ? html`
                    <div class="text-dark px-1">
                        <html-diff .diff=${details}></html-diff>
                    </div>
                ` : nothing}
            `)}
        `;
    }

    renderStackTrace(lines, failedExpectation, more) {
        const showDetails = () => {
            failedExpectation.more = !more;
            this.requestUpdate();
        };
        lines = lines.map((line) => html`
            <div class="d-flex flex-row align-items-center text-dark" style="padding-left: 3.5rem">
                <span class="text-nowrap overflow-hidden" style="text-overflow: ellipsis">${line}</span>
            </div>
        `);
        lines.push(html`
            <div class="my-1 d-flex flex-row align-items-center text-dark" style="padding-left: 3.5rem">
                <span class="text-nowrap overflow-hidden" style="text-overflow: ellipsis">
                    <a href="#" @click=${showDetails}>...${more ? "hide" : "show"} diff</a>
                </span>
            </div>
        `);
        return lines;
    }
}
