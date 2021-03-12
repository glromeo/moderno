import "@moderno/components";
import {css, customElement, LitElement, property} from "lit-element";
import {html, nothing} from "lit-html";
import styles from "./styles.scss";
import {smoothScrollbar, smoothScrollbarStyle} from "./common-styles.js";

@customElement("test-report")
export class TestReport extends LitElement {

    // language=CSS

    static styles = [styles, smoothScrollbarStyle, css`
        :host {
            display: contents;
        }

        #report {
        }

        #header {
            flex: 0 0 auto;
            border-bottom: 1px solid lightgray;
            padding: .166rem 0 .166rem .66rem !important;
        }

        :host([dark]) #header {
            border-bottom: 1px solid #444;
        }

        #body {
            min-height: 0;
        }

        #content {
            min-height: 100%;
        }

        #footer {
            border-top: 1px solid lightgray;
            min-height: 2rem;
        }

        :host([dark]) #footer {
            border-top: 1px solid #444;
        }

        a.rounded-pill {
            text-decoration: none;
        }
        
        #summary {
            line-height: 1.333em;
        }
        
    `].filter(css => css);

    @property({type: Number})
    suites = 0;
    @property({type: Number})
    specs = 0;

    @property({type: Array})
    passed = [];
    @property({type: Array})
    failed = [];
    @property({type: Array})
    pending = [];

    @property({type: Boolean})
    running = false;
    @property({type: Number})
    progress = 0;
    @property({type: Number})
    total = 0;

    @property({type: String})
    tab = "tests";

    firstUpdated() {
        const body = this.shadowRoot.getElementById("body");
        if (smoothScrollbar(body)) {
            body.querySelector(".scroll-content").style.height = "100%";
        }
    }

    render() {
        const passedCount = this.passed ? this.passed.length : 0;
        const failedCount = this.failed ? this.failed.length : 0;
        const pendingCount = this.pending ? this.pending.length : 0;

        const passedStyle = passedCount > 0 ? "opacity: 1" : "opacity: 0.5";
        const failedStyle = failedCount > 0 ? "opacity: 1" : "opacity: 0.5";
        const pendingStyle = pendingCount > 0 ? "opacity: 1" : "opacity: 0.5";

        const progress = this.total ? 100 * this.progress / this.total : 0;
        const level = failedCount > 0 ? "danger" : pendingCount > 0 ? "warning" : "success";

        return html`
            <resizable-element class="pt-2" persist="report" top>
                <div id="report" class="h-100 w-100 d-flex flex-column position-relative surface">
                    <div class="pace" style="display: ${this.running ? "block" : "none"}">
                        <div class="pace-progress">
                            <div class="pace-inner bg-${level}" style="width: ${progress}%"></div>
                        </div>
                    </div>
                    <div id="header" class="d-flex flex-row align-items-center overflow-hidden">
                        <a href="#" class="m-1 py-1 px-3 rounded-pill ${this.tab === "tests" ? "text-white bg-primary" : "bg-light"}" @click=${() => this.tab = "tests"}>Tests</a>
                        <a href="#" class="m-1 py-1 px-3 rounded-pill ${this.tab === "coverage" ? "text-white bg-primary" : "bg-light"}" @click=${() => this.tab = "coverage"}>Coverage</a>
                        <div class="flex-fill text-center">${this.specs ? `${this.specs} specs in ${this.suites} suites}` : nothing}</div>
                        <div id="summary" class="pr-3 d-flex flex-row align-items-center">
                            <fa-icon name="check-circle" class="text-success mx-1" style=${passedStyle}></fa-icon>
                            <span class="text-success mr-2 text-nowrap" style=${passedStyle}>${passedCount} passed</span>
                            <fa-icon name="times-circle" class="text-danger mx-1" style=${failedStyle}></fa-icon>
                            <span class="text-danger mr-2 text-nowrap" style=${failedStyle}>${failedCount} failed</span>
                            <fa-icon name="clock" class="text-warning mx-1" style=${pendingStyle}></fa-icon>
                            <span class="text-warning text-nowrap" style=${pendingStyle}>${pendingCount} pending</span>
                        </div>
                    </div>
                    ${this.tab === "tests" ? html`
                        <div id="body" class="flex-fill">
                            <div id="content" class="position-relative">
                                <slot></slot>
                            </div>
                        </div>
                    ` : html`
                        <iframe class="flex-fill" src="/coverage/index.html" frameborder="0"></iframe>
                    `}
                    <div id="footer" class="d-flex flex-row align-items-center">
                        <div class="flex-fill"></div>
                        <div class="position-relative">
                            <div class="pace-activity"></div>
                        </div>
                    </div>
                </div>
            </resizable-element>        
        `;
    }
}
