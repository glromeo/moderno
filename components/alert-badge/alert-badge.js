import {css, customElement, LitElement, property} from "lit-element";
import {html} from "lit-html";

import styles from "../styles.scss";

@customElement("alert-badge")
class AlertBadge extends LitElement {

    static styles = [styles, css`
        :host {
            display: block;
            position: relative;
            overflow: visible;
        }
        .badge {
            position: absolute;
            top: -100%;
            right: -100%;
        }
    `];

    @property({type: Array})
    alerts = [];

    @property({type: String})
    type = "danger";

    render() {
        const count = this.alerts.length;
        const title = this.alerts.join("\n");
        return html`
            <span class="badge badge-pill badge-${this.type}" ?hidden=${!count} title="${title}">
                ${count}
            </span>
        `;
    }
}
