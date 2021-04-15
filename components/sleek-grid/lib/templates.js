import {createTemplate} from "./utility.mjs";
import icons from "./icons.js";

/**
 * sheet: it's used to offset (see stub cell) the top left of the cells so that they align with the headers
 *        note that it has a dimension of 0x0 and cells are shown because overflow-x and overflow-y are visible
 *
 * @type {HTMLTemplateElement}
 */
export const [cloneGridTemplate] = createTemplate(`
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

export const [cloneColumnHeader, columnHeadersRecycle] = createTemplate(`
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
`);

export const [cloneRowHeader, rowHeadersRecycle] = createTemplate(`
<div class="rh cell r-0">
    <div class="cell-text" value=""></div>
    <div class="handle height-handle"></div>
</div>
`,);

export const [cloneCell, cellsRecycle] = createTemplate(`
<div class="cell c-0 r-0">
    <div class="cell-text"></div>
</div>
`);

export const [cloneRow, rowsRecycle] = createTemplate(`
<div class="row even" row="0">
    <div class="cell">
        <div class="cell-text"></div>
    </div>
</div>
`);
