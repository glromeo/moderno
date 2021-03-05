import commonStyles from "@moderno/components/styles.scss";
import {customElement, LitElement, property} from "lit-element";
import {html} from "lit-html";

@customElement("bs-button")
class BSButton extends LitElement {

    static styles = [commonStyles];

    @property()
    label;

    @property()
    type;

    render() {
        return html`<button type="button" class="btn btn-${this.type}"><slot></slot></button>`;
    }
}
