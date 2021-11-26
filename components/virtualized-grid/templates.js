import icons from "./icons.js";

/**
 * sheet: it's used to offset (see sticky-sizer) the top left of the cells so that they align with the headers
 *        note that it has a dimension of 0x0 and cells are shown because overflow-x and overflow-y are visible
 *
 * @type {HTMLTemplateElement}
 */
const template = document.createElement("template");
template.innerHTML = `
<div id="view-port" style="width: 100%; height: 100%; overflow: auto">
    <div id="scroll-area" style="position: relative">
        <div id="stub" class="header">
            <div id="sticky-sizer" class="cell">
                <div class="text" style="visibility: hidden">Hello!</div>
            </div>
            <div class="overflow right"></div>
            <div class="overflow bottom"></div>
        </div>
        <div id="sticky-rows" class="header"></div>
        <div id="sticky-columns" class="header"></div>
        <div id="sheet" class="sheet"></div>
    </div>
</div>
`;
export const cloneGridTemplate = () => template.content.cloneNode(true);

export const createColumnHeaderCell = ({index, label, sort, search}) => `
<div class="cell c-${index}" ${sort && `sort="${sort}"` || ""} ${search && `search="${search}"` || ""}>
    <div class="handle" column="${index}"></div>
    <div class="content">
        <input class="heading" type="text" placeholder="search" autocomplete="off" required value="${search||""}">
        <hr class="heading">
        <label class="heading">
            ${label}
            <svg class="sort" viewBox="0 0 512 512"><path fill="currentColor" d="${icons.arrowUp}"></path></svg>
        </label>
        <svg class="search" viewBox="0 0 512 512"><path fill="currentColor" d="${icons.search}"></path></svg>
    </div>
</div>
`;

export const createRowHeaderCell = ({index, label}) => `
<div class="cell r-${index}">
    <div class="text">${label}</div>
    <div class="handle" row="${index}"></div>
</div>
`;

export const createCell = (column, row) => `
<div class="cell c-${column.index} r-${row.index}">
    <div class="text">${row[column.name]}</div>
</div>
`;

