import {css, customElement, LitElement, property} from "lit-element";
import {html, nothing} from "lit-html";

let drag = null, release = null;

window.addEventListener("mousemove", function (event) {
    if (drag) {
        event.preventDefault();
        event.stopPropagation();
        requestAnimationFrame(() => drag(event));
    }
});

window.addEventListener("mouseup", event => {
    if (release) {
        event.preventDefault();
        event.stopPropagation();
        requestAnimationFrame(() => release(event));
    }
});

const TRANSITION_MS = 33;

@customElement("resizable-section")
class ResizableSection extends LitElement {

    // language=CSS
    static styles = [css`
        :host {
            box-sizing: border-box;
            display: block;
            position: relative;
            transition: ${TRANSITION_MS}ms ease;
        }
        
        .resizer {
            box-sizing: border-box;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            user-select: none;
            position: absolute;
            opacity: 0;
        }
        
        .resizer.active {
            position: fixed;
            z-index: 20000;
        }
        
        :host([resizer]) .resizer:hover, 
        :host([resizer]) .resizer.active {
            opacity: 1;
        }
        
        .resizer.top {
            bottom: unset;
        }
        
        .resizer.right {
            left: unset;
        }
        
        .resizer.bottom {
            top: unset;
        }
        
        .resizer.left {
            right: unset;
        }
        
        .resizer.right, .resizer.left {
            cursor: ew-resize;
        }
        
        .resizer.top, .resizer.bottom {
            cursor: ns-resize;
        }
    `];

    @property({type: Boolean})
    top;
    @property({type: Boolean})
    right;
    @property({type: Boolean})
    bottom;
    @property({type: Boolean})
    left;

    @property({type: Boolean})
    resizer;

    @property({type: String})
    border = document.theme === "light" ? "2px dashed rgba(32,64,128,.5)" : "2px dashed rgba(128,192,224,.5)";

    @property({
        converter: {
            fromAttribute: (value, type) => `${value}-csstext`,
            toAttribute: (value, type) => value.slice(0, -8)
        }
    })
    persist;

    activate(event) {

        if (drag) return;

        const originX = event.screenX;
        const originY = event.screenY;

        const path = event.path || event.composedPath();
        const resizer = path[0].id ? path[0] : path[0].parentElement;
        const vertical = resizer.id === "top" || resizer.id === "bottom";
        const originalCssText = resizer.style.cssText;

        const {left, top, width, height} = resizer.getBoundingClientRect();

        if (this.resizer) {
            resizer.classList.add("active");
            resizer.style.top = `${top}px`;
            resizer.style.left = `${left}px`;
        }

        const clear = () => {
            resizer.style.cssText = originalCssText;
            resizer.classList.remove("active");
            drag = null;
            release = null;
            if (this.persist) {
                localStorage.setItem(this.persist, this.style.cssText);
            }
        };

        if (vertical) {
            const {height} = this.getBoundingClientRect();
            const sign = resizer.id === "top" ? -1 : 1;

            resizer.style.width = `${width}px`;

            this.style.height = this.style.maxHeight = this.style.minHeight = `${height}px`;

            drag = ({screenY}) => {
                if (this.resizer) {
                    resizer.style.transform = `translateY(${screenY - originY}px)`;
                } else {
                    this.style.height = this.style.maxHeight = this.style.minHeight = `${height + sign * (screenY - originY)}px`;
                }
            };

            release = ({screenY}) => {
                this.style.height = this.style.maxHeight = this.style.minHeight = `${height + sign * (screenY - originY)}px`;
                resizer.style.visibility = "hidden";
                setTimeout(clear, TRANSITION_MS);
            };
        } else {
            const {width} = this.getBoundingClientRect();
            const sign = resizer.id === "left" ? -1 : 1;

            resizer.style.height = `${height}px`;

            this.style.width = this.style.maxWidth = this.style.minWidth = `${width}px`;

            drag = ({screenX}) => {
                if (this.resizer) {
                    resizer.style.transform = `translateX(${screenX - originX}px)`;
                } else {
                    this.style.width = this.style.maxWidth = this.style.minWidth = `${width + sign * (screenX - originX)}px`;
                }
            };

            release = ({screenX, screenY}) => {
                const sign = resizer.id === "left" ? -1 : 1;
                this.style.width = this.style.maxWidth = this.style.minWidth = `${width + sign * (screenX - originX)}px`;
                resizer.style.visibility = "hidden";
                setTimeout(clear, TRANSITION_MS);
            };
        }
    }

    render() {
        if (this.persist) {
            const stored = localStorage.getItem(this.persist);
            if (stored) {
                this.style.cssText = stored;
            }
        }

        const borderWidth = this.border.substring(0, this.border.indexOf(" "));

        const computedStyle = window.getComputedStyle(this, null);
        const paddingTop = computedStyle["padding-top"];
        const gapTop = `calc((${paddingTop} - ${borderWidth})/2)`;
        const paddingRight = computedStyle["padding-right"];
        const gapRight = `calc((${paddingRight} - ${borderWidth})/2)`;
        const paddingBottom = computedStyle["padding-bottom"];
        const gapBottom = `calc((${paddingBottom} - ${borderWidth})/2)`;
        const paddingLeft = computedStyle["padding-left"];
        const gapLeft = `calc((${paddingLeft} - ${borderWidth})/2)`;

        return html`
            ${this.top ? html`
                <div id="top" @mousedown=${this.activate} class="resizer top" style="height: ${paddingTop}; padding: ${gapTop} 0;">
                     <div style="width: 100%; border-top: ${this.border};"></div>
                </div>
            ` : nothing}
            ${this.right ? html`
                <div id="right" @mousedown=${this.activate} class="resizer right" style="width: ${paddingRight}; padding: 0 ${gapRight};">
                    <div style="height: 100%; border-left: ${this.border};"></div>     
                </div>
            ` : nothing}
            ${this.bottom ? html`
                <div id="bottom" @mousedown=${this.activate} class="resizer bottom" style="height: ${paddingBottom}; padding: ${gapBottom} 0;">
                    <div style="width: 100%; border-top: ${this.border};"></div>                         
                </div>
            ` : nothing}
            ${this.left ? html`
                <div id="left" @mousedown=${this.activate} class="resizer left" style="width: ${paddingLeft}; padding: 0 ${gapLeft};">
                    <div style="height: 100%; border-left: ${this.border};"></div>
                </div>
            ` : nothing}
            <slot></slot>
        `;
    }
}
