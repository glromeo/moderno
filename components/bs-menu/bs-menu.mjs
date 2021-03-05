import bootstrapStyles from "bootstrap/dist/css/bootstrap.css";
import {css, customElement, LitElement, property} from "lit-element";
import {html, nothing} from "lit-html";

@customElement("bs-menu")
class BSMenu extends LitElement {

    // language=CSS

    static styles = [bootstrapStyles, css`
        :host {
            display: contents;
        }
    `];

    @property({type: Array})
    items = [];

    @property({type: Object})
    active;

    @property({type: Object})
    suite;

    @property({type: String})
    search;

    async updated(changed) {
        if (changed.has("active")) {
            this.dispatchEvent(new CustomEvent("bs:active", {
                detail: this.active
            }));
        }
        if (changed.has("suite")) {
            document.getElementById("test-iframe");
        }
    }

    filterItem(item) {
        return !this.search || item.text.match(this.search);
    }

    renderItem(item) {
        return item.text;
    }

    clickCallback({target}) {
        const item = target.closest("a").item;
        this.active = item === this.active ? undefined : item;
    }

    render() {
        const active = this.active;
        const itemTemplate = item => {
            let classNames = "py-1 px-2 border-dark list-group-item list-group-item-action l-0";
            if (item === active) {
                classNames += " active";
            }
            if (item.disabled) {
                classNames += " disabled";
            }
            return html`
                <a href="#" class=${classNames} .item=${item}>
                    <fa-icon name=${item === active ? "folder-open" : "folder"}></fa-icon>
                    <span class="pl-1 align-middle">${this.renderItem(item)}</span>
                </a>
                ${item.content || nothing}
            `;
        };
        return this.items.length > 0 ? html`
            <div class="list-group" @click=${this.clickCallback}>
                ${this.items.filter(item => this.filterItem(item)).map(itemTemplate)}
            </div>
        ` : nothing;
    }
}
