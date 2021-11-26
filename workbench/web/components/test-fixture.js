import {css, customElement, html, LitElement} from "lit-element";

@customElement("test-fixture")
export class TestFixture extends LitElement {

    // language=CSS

    static styles = [css`
        :host {
            display: block;
            padding: 5px;
            min-width: 0;
            min-height: 0;
        }
        :host(.hover) {
            background-color: rgba(128, 128, 128, .25);
            outline: 1px solid rgba(128, 128, 128, .333);
            box-shadow: 0px 0px 1px rgba(128, 128, 128, .25);
        }
    `];

    render() {
        return html`
            <div id="hz"></div>
            <div id="vt"></div>
            <slot></slot>
        `;
    }
}
