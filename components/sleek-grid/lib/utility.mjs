import {cloneCell} from "./templates.js";

export function textWidth(text) {
    return text ? String(text).length * 12.5 : 20;
}

export function createTemplate(innerHTML, render) {
    const template = document.createElement("template");
    template.innerHTML = innerHTML.split("\n").map(line => line.trim()).join("");
    if (render) {
        return (props) => {
            const root = template.content.cloneNode(true).firstChild;
            root.render = render.bind(root, props);
            return root;
        };
    } else {
        return () => template.content.cloneNode(true).firstChild;
    }
}

export function calculateScrollbarDimensions() {
    let sample = document.createElement("div");
    sample.style.cssText = `
        width: 100vw;
        height: 100vh;
        overflow: scroll;
        position: fixed;
        visibility: hidden;
	`;
    document.body.appendChild(sample);
    let dimensions = {
        width: sample.offsetWidth - sample.clientWidth,
        height: sample.offsetHeight - sample.clientHeight
    };
    document.body.removeChild(sample);
    return dimensions;
}

const REGEX_SPECIAL_CHARS = /([-*+?.^${}(|)[\]])/g;

export function escapeRegex(str) {
    return str.replace(REGEX_SPECIAL_CHARS, '\\$1');
}

let dragAnimationFrame;

export function createDragHandler(triggerHandler) {
    return triggerEvent => {
        triggerEvent.preventDefault();
        triggerEvent.stopPropagation();
        const handle = triggerEvent.target;
        handle.classList.add("active");
        const dragHandler = triggerHandler(triggerEvent, handle);
        const mouseDragHandler = dragEvent => {
            dragEvent.preventDefault();
            dragEvent.stopPropagation();
            cancelAnimationFrame(dragAnimationFrame);
            if (dragEvent.buttons !== 1) {
                handle.classList.remove("active");
                document.body.removeEventListener("pointermove", mouseDragHandler);
                document.body.removeEventListener("mouseup", mouseDragHandler);
                dragAnimationFrame = requestAnimationFrame(function () {
                    dragHandler(dragEvent);
                    dragHandler({});
                });
            } else {
                dragAnimationFrame = requestAnimationFrame(function () {
                    dragHandler(dragEvent);
                });
            }
        };
        document.body.addEventListener("pointermove", mouseDragHandler);
        document.body.addEventListener("mouseup", mouseDragHandler);
    }
}

export function childIndex(children, node) {
    let index = -1;
    for (const child of children) {
        ++index;
        if (child === node) return index;
    }
    return index;
}

export function createCellSizer({stub}) {

    const cell = cloneCell();
    cell.className = `cell column-sizer row-sizer`;
    cell.style.cssText = `position:fixed;visibility:hidden;left:0;top:0;width:auto;height:auto;`;

    stub.appendChild(cell);

    const textElement = cell.firstChild;
    textElement.replaceChildren("Hello");

    return function (column, row) {
        textElement.innerText = row[column.name];
        return textElement;
    }
}

export function parametersList(fn) {
    if (fn) {
        const code = fn.toString();
        return code.substring(code.indexOf("("), 1 + code.lastIndexOf(")", code.indexOf("{")));
    } else {
        return "()";
    }
}

export function sourceCode(fn) {
    if (fn) {
        const code = fn.toString();
        return code.substring(code.indexOf("{") + 1, code.lastIndexOf("}")).trim();
    } else {
        return "undefined";
    }
}

export function sourceURL(path, name) {
    return `//# sourceURL=moderno://sleekgrid/${path}/${name}`;
}