import styles from "./styles.mjs";
import {cloneListTemplate} from "./template.mjs";

export class SleekList extends HTMLElement {

    constructor() {
        super();

        this.attachShadow({mode: "open"}).adoptedStyleSheets = [
            styles
        ];

        this.shadowRoot.appendChild(cloneListTemplate());

        this.stub = this.shadowRoot.getElementById("stub");
        this.viewPort = this.shadowRoot.getElementById("view-port");
        this.scrollArea = this.shadowRoot.getElementById("scroll-area");
        this.heading = this.shadowRoot.getElementById("heading");
        this.top = this.shadowRoot.getElementById("top");
        this.bottom = this.shadowRoot.getElementById("bottom");

        this.data = [];

        this.interactionObserver = new IntersectionObserver(function (entries) {
            for (const entry of entries) {
                console.log(entry.target.id, entry.intersectionRatio);
            }
        }, {
            root: this.viewPort,
            rootMargin: "0px 0px 0px 0px",
            threshold: 0.0
        });
        this.interactionObserver.observe(this.top);
        this.interactionObserver.observe(this.bottom);
    }

    set items(data) {
        this.data = data;
        requestAnimationFrame(()=> this.render());
    }

    connectedCallback() {
        this.render();
    }

    render() {
        let clientHeight = this.viewPort.clientHeight;
        for (let i = 0; i < this.data.length; i++) {
            let item = this.scrollArea.insertBefore(this.createItem(i, this.data[i]), this.bottom);
            this.interactionObserver.observe(item);
            if (item.offsetTop > clientHeight) {
                break;
            }
        }
    }

    createItem(index, text) {
        let item = document.createElement("div");
        item.id = `item-${index}`;
        item.className = "item";
        item.setAttribute("index", index);
        item.innerHTML = text;
        return item
    }
}
