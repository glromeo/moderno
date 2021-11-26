import bootstrapStyles from "bootstrap/dist/css/bootstrap.css";
import { customElement, LitElement, property, css } from "lit-element";
import { html, nothing } from "lit-html";

@customElement("bs-textfield")
class BSTextfield extends LitElement {

    static styles = [bootstrapStyles, css`
        :host {
            display: block;
        }
        .custom-border {
            border-color: lightgray !important;
            border-width: 1.5px;
        }
        :host([dark]) .custom-border {
            border-color: #333 !important;
            border-width: 1.5px;
        }
        .input-group-prepend .custom-border{
            border-right: none;
        }
        .input-group-append .custom-border{
            border-left: none;
        }
        .input-group input {
            border-top-left-radius: 1rem;
            border-bottom-left-radius: 1rem;
        }
        .input-group .input-group-append .input-group-text {
            border-top-right-radius: 1rem;
            border-bottom-right-radius: 1rem;
        }
        label {
            position: absolute;
            top: -1em;
            left: 1.5em;
            font-size: 0.5em;
            font-weight: bold;
            background: white;
            padding: 0 .33em;
            color: rgb(90,140,180);
        }
        
        :host([dark]) .form-control {
            color: #ccc;
            background-color: #181818;
        }
        
        .form-control:focus {
            box-shadow: none;
        }

        .input-group-text {
            background-color: white;        
        }

        :host([dark]) .input-group-text {
            background-color: #181818;        
        }
    `];

    @property({ type: String })
    placeholder;

    @property({ type: String })
    type = "text";

    @property({ type: String })
    label;

    @property({ type: String })
    value;

    changeCallback({ target }) {
        this.dispatchEvent(new CustomEvent("bs:change", {
            composed: true,
            bubbles: true,
            detail: {
                value: target.value
            }
        }))
    }

    clickCallback({ target }) {
        this.shadowRoot.querySelector("input").focus();
    }

    get input() {
        return this.shadowRoot.getElementById("input");
    }

    render() {
        const hasPrepend = this.querySelector("[slot=prepend]");
        const hasAppend = this.querySelector("[slot=append]");
        return html`
            <div class="input-group custom-border position-relative">
                ${hasPrepend ? html`
                    <div class="input-group-prepend" @click=${this.clickCallback}>
                        <div class="input-group-text py-0 px-2 custom-border">
                            <slot name="prepend"></slot>
                        </div>
                    </div>
                `: nothing}
                <input  id="input" type="text" 
                        placeholder=${this.placeholder} 
                        .value=${this.value}
                        @input=${this.changeCallback}
                        class="form-control custom-border"
                        spellcheck="false"
                        autocomplete="off">
                <label for="input">${this.label}</label>
                ${hasAppend ? html`
                    <div class="input-group-append" @click=${this.clickCallback}>
                        <div class="input-group-text py-0 px-2 custom-border">
                            <slot name="append"></slot>
                        </div>
                    </div>
                `: nothing}
            </div>
        `;
    }
}
