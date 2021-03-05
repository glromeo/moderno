import {customElement, LitElement, property} from "lit-element";
import {html, nothing} from "lit-html";

import "./html-diff.js";

@customElement("failure-message")
export default class FailureMessage extends LitElement {

    @property({type: String})
    text;

    @property({type: Object})
    details;

    @property({type: Object})
    detailsHTML = nothing;

    async showDetails() {
        if (this.detailsHTML === nothing) {
            const details = await this.details;
            this.detailsHTML = html`
            <html-diff .diff=${details}></html-diff>
        `;
        } else {
            this.detailsHTML = nothing;
        }
    }

    render() {
        return html`
            <div>${this.text}<fa-icon name="question-circle" @click=${this.showDetails}></fa-icon></div>
            ${this.detailsHTML}
        `;
    }
}