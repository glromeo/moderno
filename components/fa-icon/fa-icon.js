import bootstrapStyles from "bootstrap/dist/css/bootstrap.css";
import {customElement, html, LitElement, property} from "lit-element";
import {ifDefined} from "lit-html/directives/if-defined";
import styles from "./fa-icon.scss";
import duotone from "./variants/duotone.js";
import light from "./variants/light.js";
import regular from "./variants/regular.js";
import solid from "./variants/solid.js";

const variants = {
    regular,
    light,
    solid,
    duotone
};

@customElement("fa-icon")
export class FAIcon extends LitElement {

    static styles = [bootstrapStyles, styles];

    @property({type: String})
    name;

    @property({type: String})
    variant = "regular";

    @property({type: String})
    type;

    @property({type: Number})
    rotate;

    @property({type: Boolean})
    disabled;

    @property({converter: csv => csv.split(",").map(s => s.trim())})
    symbols;

    constructor() {
        super();
        this.addEventListener("click", this.clickCallback.bind(this));
        this.addEventListener("keyDown", this.keydownCallback.bind(this));
    }

    change() {
        if (this.symbols) {
            this.name = this.symbols[this.symbols.indexOf(this.name) + 1] || this.symbols[0];
            this.notifyEvent("change", {name: this.name});
        }
    }

    clickCallback(event) {
        if (this.disabled) {
            return preventAndStop(event);
        } else {
            this.change();
        }
    }

    keydownCallback(event) {
        const {code} = event;
        if (code === "Enter") {
            this.notifyEvent("keydown", {code, target: this, name: this.name});
            this.change();
        }
    }

    render() {
        const className = `${this.name} ${this.variant} ${this.type ? "text-" + this.type : ""}`;
        try {
            const icon = variants[this.variant][this.name];
            return html`
                <svg class="${className}" viewBox=${icon.viewBox}
                     transform=${ifDefined(this.rotate !== undefined ? `rotate(${this.rotate})` : undefined)} 
                >
                    ${icon.svg}
                </svg>
            `;
        } catch (e) {
            fetch(`./files/${this.name}/${this.variant}.svg`).then(async response => {
                if (response.ok) {
                    const svg = await response.text();
                    this.shadowRoot.innerHTML = svg;
                }
            }).catch(error => {
                console.error("cannot render icon name:", this.name, "variant:", this.variant, error);
            });
        }
    }
}

@customElement("fa-icon-solid")
export class FAIconSolid extends FAIcon {
    constructor() {
        super();
        this.variant = "solid";
    }
}

@customElement("fa-icon-duotone")
export class FAIconDuoTone extends FAIcon {
    constructor() {
        super();
        this.variant = "duotone";
    }
}

@customElement("fa-icon-light")
export class FAIconLight extends FAIcon {
    constructor() {
        super();
        this.variant = "light";
    }
}
