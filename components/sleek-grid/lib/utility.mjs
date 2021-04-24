import {memoize} from "./nano-memoize.mjs";
import {cloneCell} from "./templates.js";

export function totalWidth(columns) {
    const column = columns[columns.length - 1];
    return column ? column.left + column.width : 0;
}

export function totalHeight(rows) {
    const row = rows[rows.length - 1];
    return row ? row.top + row.height : 0;
}

export function findColumnIndex(columns, edge) {
    let middle, distance, start = 0, end = columns.length - 1;
    while (start < end) {
        middle = (start + end) >> 1;
        const {left, width} = columns[middle];
        distance = edge - left;
        if (distance >= width) {
            start = middle + 1; // search to the right
        } else if (distance < 0) {
            end = middle - 1; // search to the left
        } else {
            return middle;
        }
    }
    return start;
}

export function findRowIndex(rows, edge) {
    let middle, distance, start = 0, end = rows.length - 1;
    while (start < end) {
        middle = (start + end) >> 1;
        const {top, height} = rows[middle];
        distance = edge - top;
        if (distance >= height) {
            start = middle + 1; // search to the bottom
        } else if (distance < 0) {
            end = middle - 1; // search to the top
        } else {
            return middle;
        }
    }
    return start;
}

export const createFilter = memoize((filterId, columns, external) => {
    const filters = [];
    const body = columns.reduce((code, {name, search}, index) => {
        if (search) {
            const filter = new RegExp("^" + escapeRegex(search).replace(/\\\*/g, ".*"), "i");
            filters.push(filter);
            const field = JSON.stringify(name);
            return code + `\n&& this[${filters.length - 1}].test(row[${field}]) // [${index}] ${field} ${filter}`;
        } else {
            return code;
        }
    }, "row.index = index;\nreturn true") + "\n" + sourceURL("filter", `sleek-grid[grid-id="${filterId}"]`);
    if (filters.length > 0) {
        return new Function("row", "index", body).bind(filters);
    }
});

export const applyFilter = memoize((filter, rows) => {
    if (filter) {
        rows = rows.filter(filter);
    } else {
        if (rows[0] && rows[0].index === undefined) {
            for (let index = 0; index < rows.length; index++) {
                rows[index].index = index;
            }
        }
    }
    return rows;
});

export const applySort = memoize((columns, rows) => {
    let column = columns.find(column => column.sort);
    if (column) {
        let sorting = column.sort === "asc" ? 1 : -1;
        const name = column.name;
        return [...rows].sort(function (leftRow, rightRow) {
            const leftCell = leftRow[name];
            const rightCell = rightRow[name];
            return leftCell === rightCell ? 0 : leftCell < rightCell ? -sorting : sorting;
        });
    }
    return rows;
});

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
    return str.replace(REGEX_SPECIAL_CHARS, "\\$1");
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
                document.body.removeEventListener("pointerup", mouseDragHandler);
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
        document.body.addEventListener("pointerup", mouseDragHandler);
    };
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
    };
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
