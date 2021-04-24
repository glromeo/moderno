import icons from "./icons.js";
import {createTemplate} from "./utility.mjs";

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
                <div class="stub handle width-handle"></div>
                <div class="stub handle height-handle"></div>
                <div class="cell-text" style="visibility: hidden">999</div>
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

export const cloneTopHeaderCell = createTemplate(`
<div class="ch cell c-0">
    <div class="handle width-handle"></div>
    <div class="cell-content">
        <input class="search-input" type="text" autocomplete="off" required value="">
        <hr class="search-hr">
        <label class="search-label">
            <p></p>
            <svg class="sort-icon" viewBox="0 0 512 512"><path fill="currentColor" d="${icons.arrowUp}"></path></svg>
        </label>
        <svg class="search-icon" viewBox="0 0 512 512"><path fill="currentColor" d="${icons.search}"></path></svg>
    </div>
</div>
`, function render({columns}, columnIndex) {
    const {label, search, sort} = columns[columnIndex];
    const headerContent = this.childNodes[1];
    this.columnIndex = columnIndex;
    this.className = `ch cell c-${columnIndex}`;
    const headerLabel = headerContent.childNodes[2];
    headerLabel.firstChild.replaceWith(label);
    const headerInput = headerContent.childNodes[0];
    if (headerInput.value !== search) {
        headerInput.value = search || "";
        if (search) {
            this.setAttribute("search", search);
        } else {
            this.removeAttribute("search");
        }
    }
    if (sort) {
        this.setAttribute("sort", sort);
    } else {
        this.removeAttribute("sort");
    }
});

export const cloneLeftHeaderCell = createTemplate(`
<div class="rh cell r-0">
    <div class="cell-text" value=""></div>
    <div class="handle height-handle"></div>
</div>
`, function render({rows}, rowIndex) {
    this.rowIndex = rowIndex;
    this.className = `rh cell r-${rowIndex}`;
    this.firstChild.replaceChildren(rows[rowIndex].label ?? "n/a");
});

export const cloneCell = createTemplate(`
<div class="cell c-0">
    <div class="cell-text"></div>
</div>
`, function render({columns, rows}, columnIndex, rowIndex) {
    const content = rows[rowIndex][columns[columnIndex].name];
    this.columnIndex = columnIndex;
    this.rowIndex = rowIndex;
    this.className = `cell c-${columnIndex}`;
    this.firstChild.replaceChildren(content ?? "");
});

export const cloneRow = createTemplate(`
<div class="row even"></div>
`, function render(grid, rowIndex, leftIndex, rightIndex) {
    this.rowIndex = rowIndex;
    if (grid.rows[rowIndex].index % 2) {
        this.className = `row odd  r-${rowIndex}`;
    } else {
        this.className = `row even r-${rowIndex}`;
    }
    let columnIndex = leftIndex;
    let recycledCell = this.firstChild;
    if (recycledCell) {
        while (recycledCell && columnIndex < rightIndex) {
            recycledCell.render(columnIndex++, rowIndex);
            recycledCell = recycledCell.nextSibling;
        }
        if (recycledCell) do {} while (recycledCell !== this.removeChild(this.lastChild));
    }
    while (columnIndex < rightIndex) {
        const cell = cloneCell(grid);
        cell.render(columnIndex++, rowIndex);
        grid.onCell(cell);
        this.appendChild(cell);
    }
});
