import icons from "./icons.js";

export const createColumnHeaderCell = ({index, label, sort, search, width}) => `
<div class="cell c-${index}" ${sort && `sort="${sort}"` || ""} ${search && `search="${search}"` || ""}>
    <div class="handle" column="${index}"></div>
    <div class="content">
        <input class="search-input" type="text" autocomplete="off" required value="${search||""}">
        <hr class="search-hr">
        <label class="search-label">
            ${label}
            <svg class="sort-icon" viewBox="0 0 512 512"><path fill="currentColor" d="${icons.arrowUp}"></path></svg>
        </label>
        <svg class="search-icon" viewBox="0 0 512 512"><path fill="currentColor" d="${icons.search}"></path></svg>
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

