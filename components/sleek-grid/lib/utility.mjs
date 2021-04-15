import {cloneCell} from "./templates.js";

export function importColumns(columns, columnWidth) {
    const imported = new Array(columns.length);
    let left = 0, index = 0;
    while (index < columns.length) {
        const column = columns[index];
        const width = columnWidth(column);
        imported[index++] = {
            ...column,
            left,
            width
        };
        left += width;
    }
    return imported;
}

export function importRows(rows, rowHeight) {
    const imported = new Array(rows.length);
    let top = 0, index = 0;
    while (index < rows.length) {
        const row = rows[index];
        const height = rowHeight(row);
        imported[index++] = {
            ...row,
            top,
            height
        };
        top += height;
    }
    return imported;
}

export function createTemplate(innerHTML) {
    const template = document.createElement("template");
    template.innerHTML = innerHTML.split("\n").map(line => line.trim()).join("");
    const recycling = document.createDocumentFragment();
    return [
        () => template.content.cloneNode(true).firstChild,
        recycling
    ];
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


export function textWidth(text) {
    return text ? String(text).length * 12.5 : 20;
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
