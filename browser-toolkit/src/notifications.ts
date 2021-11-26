import {on} from "./messaging";

const sheet = new CSSStyleSheet();

// @ts-ignore
sheet.replaceSync(`

#container {
    
    position: fixed;
    z-index: 10000;
    top: 8px;
    right: 8px;
    max-width: 0;
    height: 30vw;
    background: none;
    opacity: 0;
    transition: opacity 0.25s ease-out, max-width 0.125s ease-out;
    
    display: flex;
    flex-direction: column;
    text-align: right;
    overflow: visible;
}

#container.visible {
    max-width: 60vw;
    opacity: 1;
    transition: opacity 0.25s ease-in, max-width 0.5s ease-in;
}

#container.visible.timeout {
    opacity: .9;
}

.slot {
    overflow: visible;
    max-height: 0;
    opacity: 0;
    transition: all 0.25s ease-out;
}

.slot.connected {
    max-height: 0;
    opacity: 1;
    transition: all 0.25s ease-in;
}

.notification {
    font-family: sans-serif;
    font-size: 13px !important;

    max-width: calc(60vw - 40px);
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow-x: hidden;

    display: inline-block;
    border-radius: 8px;
    margin: 4px;
    padding: 8px 16px;
    pointer-events: none;
    position: relative;
    color: white;
    background: black;
    box-shadow: -2px 3px 2px 0 rgba(0, 0, 0, 0.125), 4px 4px 2px 0 rgba(0, 0, 0, 0.125);
}

.notification.sticky {
    padding-right: 32px;
}

.notification.sticky:after {
    position: absolute;
    content: '✕';
    font-weight: bolder;
    right: 12px;
    top: 8px;
    cursor: pointer;
    pointer-events: all;
}

.notification.primary {
    background: #3e3f3a;
}

.notification.secondary {
    background: slategray;
}

.notification.info {
    background: cornflowerblue;
}

.notification.success {
    background: forestgreen;
}

.notification.warning {
    background: orange;
}

.notification.danger {
    background: crimson;
}

`);

customElements.define("esnext-notifications", class extends HTMLElement {

        renderRoot: ShadowRoot;

        hideTimeout: number = 0;
        ready: Promise<void> = Promise.resolve();

        constructor() {
            super();

            this.renderRoot = this.attachShadow({mode: "open"});
            this.renderRoot["adoptedStyleSheets"] = [sheet];
            this.renderRoot.innerHTML = `<div id="container">${this.innerHTML}</div>`;

            let autoHide;
            this.addEventListener("mouseenter", () => {
                autoHide = !!this.hideTimeout;
                this.show();
            });
            this.addEventListener("mouseout", () => {
                this.show(autoHide);
            });
        }

        get containerElement(): HTMLDivElement {
            return this.renderRoot.getElementById("container") as HTMLDivElement;
        }

        set items(items) {
            this.containerElement.innerHTML = "";
            for (const item of items) {
                this.add(item);
            }
        }

        connectedCallback() {

            const removeAddCallback = on("notification:add", notification => this.add(notification));
            const removeUpdateCallback = on("notification:update", notification => this.update(notification));

            on("close", () => {
                if (this.parentElement) this.parentElement.removeChild(this);
            });

            this.disconnectedCallback = () => {
                removeAddCallback();
                removeUpdateCallback();
            }
        }

        disconnectedCallback() {
        }

        show(autoHide = false) {
            if (autoHide) {
                this.hide(2500);
            } else {
                window.clearTimeout(this.hideTimeout);
                this.containerElement.classList.remove("timeout");
            }
            this.containerElement.classList.add("visible");
        }

        hide(timeoutMs = 0) {
            window.clearTimeout(this.hideTimeout);
            this.containerElement.classList.add("timeout");
            this.hideTimeout = window.setTimeout(() => {
                this.containerElement.classList.remove("visible");
            }, timeoutMs);
        }

        add({id, type = "default", message = ""}, sticky = false) {
            this.ready = (async (ready) => {
                await ready;
                let slot: HTMLDivElement | null = document.createElement("div");
                slot.classList.add("slot");
                slot.setAttribute("id", id);
                const notification = document.createElement("div");
                notification.setAttribute("class", `notification ${type}`);
                const dismiss = () => {
                    if (slot) {
                        slot.style.maxHeight = "";
                        slot.classList.remove("connected");
                        slot.addEventListener("transitionend", (event) => {
                            if (slot) {
                                this.containerElement.removeChild(slot);
                                slot = null;
                            }
                        });
                    }
                };
                if (sticky) {
                    notification.classList.add("sticky");
                    notification.addEventListener("click", dismiss);
                } else {
                    window.setTimeout(dismiss, 3000);
                }
                notification.innerHTML = message;
                slot.appendChild(notification);
                this.containerElement.appendChild(slot);
                this.show(true);
                return new Promise<void>(resolve => window.setTimeout(() => {
                    if (slot) {
                        slot.classList.add("connected");
                        slot.style.maxHeight = `${notification.getBoundingClientRect().height + 8}px`;
                    }
                    window.setTimeout(resolve, 125);
                }));
            })(this.ready);
        }

        // TODO: handle change in sticky/dismiss
        update({id, type = "default", message = ""}) {
            this.ready = (async (ready) => {
                await ready;
                const slot = this.renderRoot.getElementById(id);
                if (!slot) {
                    return;
                }
                const notification = slot.firstElementChild;
                if (notification) {
                    notification.setAttribute("class", `notification ${type}`);
                    notification.innerHTML = message;
                }
                this.show(true);
            })(this.ready);
        }
    }
);

on("open", () => {
    document.body.appendChild(document.createElement("esnext-notifications"));
});
