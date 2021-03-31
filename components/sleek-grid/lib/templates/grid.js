import {createTemplate, stripeAt} from "../utility.js";
import icons from "./icons.js";

/**
 * sheet: it's used to offset (see stub cell) the top left of the cells so that they align with the headers
 *        note that it has a dimension of 0x0 and cells are shown because overflow-x and overflow-y are visible
 *
 * @type {HTMLTemplateElement}
 */
export const cloneGridTemplate = createTemplate(`
<div id="view-port">
    <div id="scroll-area">
        <div id="stub" class="header">
            <div class="cell">
                <div class="handle vt"></div>
                <div class="handle hz"></div>
                <div class="text" style="visibility: hidden">999</div>
            </div>
            <div id="stub-hide-right"></div>
            <div id="stub-hide-bottom"></div>
        </div>
        <div id="top-header" class="header"></div>
        <div id="left-header" class="header"></div>
        <div id="sheet" class="sheet"></div>
    </div>
</div>
`);



export const topHeaderCache = [];

const cloneTopHeaderCell = createTemplate(`
<div class="cell">
    <div class="handle vt"></div>
    <div class="content">
        <input class="search-input" type="text" autocomplete="off" required>
        <hr class="search-hr">
        <label class="search-label">
            <svg class="sort-icon" viewBox="0 0 512 512"><path fill="currentColor" d="${icons.arrowUp}"></path></svg>
        </label>
        <svg class="search-icon" viewBox="0 0 512 512"><path fill="currentColor" d="${icons.search}"></path></svg>
    </div>
</div>
`);

export const createTopHeaderCell = column => {
    const {index, sort, search} = column;
    const cell = false && topHeaderCache.pop() || cloneTopHeaderCell();
    cell.className = `cell c-${index}`;
    if (sort) {
        cell.setAttribute("sort", sort);
    } else {
        cell.removeAttribute("sort");
    }
    if (search) {
        cell.setAttribute("search", search);
    } else {
        cell.removeAttribute("search");
    }
    const content = cell.children[1];
    const input = content.children[0];
    input.value = search || "";
    const label = content.children[2];
    label.replaceChildren(column.label, label.lastElementChild);
    return cell;
}



export const leftHeaderCache = [];

const cloneLeftHeaderCellTemplate = createTemplate(`
<div class="cell">
    <div class="text"></div>
    <div class="handle hz"></div>
</div>
`);

export const createLeftHeaderCell = row => {
    const {index, label} = row;
    const cell = false && leftHeaderCache.pop() || cloneLeftHeaderCellTemplate();
    cell.className = `cell r-${index}`;
    cell.children[0].replaceChildren(label);
    return cell;
};



export const rowCache = [];

const cloneRowTemplate = createTemplate(`<div class="row"></div>`);

export const createRow = (rows, rowIndex, columns, fromColumn, toColumn) => {
    const row = rows[rowIndex];
    let popped = false && rowCache.pop();
    if (popped) {
        sheetCellCache.push(...popped.children);
    }
    const rowElement = popped || cloneRowTemplate();
    rowElement.setAttribute("row", row.index);
    const children = new Array(toColumn - fromColumn);
    for (let c = fromColumn; c < toColumn; ++c) {
        let column = columns[c];
        children[c] = createCell(column, row, stripeAt(rowIndex));
    }
    rowElement.replaceChildren.apply(rowElement, children);
    return rowElement;
};



export const sheetCellCache = [];

const cloneSheetCellTemplate = createTemplate(`<div class="cell"><div class="text"></div></div>`);

export const createCell = (column, row, classes) => {
    const cell = false && sheetCellCache.pop() || cloneSheetCellTemplate();
    cell.className = `cell c-${column.index} r-${row.index}`;
    if (classes) {
        cell.classList.add(classes)
    }
    cell.children[0].replaceChildren(row[column.name]);
    return cell;
};
