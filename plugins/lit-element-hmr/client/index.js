import {createHotContext} from "/moderno/browser-toolkit.js";

import {LitElement} from "/web_modules/lit-element.js";

function* shadowPiercingWalk(node) {
    const treeWalker = document.createTreeWalker(node, NodeFilter.SHOW_ELEMENT);
    let currentNode = treeWalker.currentNode;
    while (currentNode) {
        if (currentNode instanceof LitElement) {
            if (currentNode.shadowRoot) {
                yield* shadowPiercingWalk(currentNode.shadowRoot);
            }
            yield currentNode;
        }
        currentNode = treeWalker.nextNode();
    }
}

function performHotElementRefresh(tagName, that) {

    const thisProps = new Set(Object.getOwnPropertyNames(this.prototype));
    const thatProps = new Set(Object.getOwnPropertyNames(that.prototype));

    for (const prop of Object.getOwnPropertyNames(that.prototype)) {
        Object.defineProperty(this.prototype, prop, Object.getOwnPropertyDescriptor(that.prototype, prop));
    }

    for (const existingProp of thisProps) {
        if (!thatProps.has(existingProp)) delete (this.prototype)[existingProp];
    }

    that.finalize();

    for (const node of shadowPiercingWalk(document.body)) {
        if (node.tagName === tagName) {
            node.__HOT_RELOAD__ = true;
            node.requestUpdate().then(()=>node.__HOT_RELOAD__ = false);
        }
    }
}

let originalDefine = customElements.define;

let hotElements = new Map();

customElements.define = function (name, clazz, options) {
    let key = window.$HotElementUrl$+" "+name;
    if (!hotElements.has(key)) {
        hotElements.set(key, {name, clazz, options});
        originalDefine.apply(this, arguments);
    } else {
        performHotElementRefresh.call(hotElements.get(key).clazz, name.toUpperCase(), clazz);
    }
}

export function createHotElementContext(url) {
    window.$HotElementUrl$ = new URL(url).pathname;
    return createHotContext(url);
}
