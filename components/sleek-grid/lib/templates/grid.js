import {createTemplate} from "../utility.js";

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
                <div class="handle actionable" column="-1"></div>
                <div class="handle actionable" row="-1"></div>
                <div class="text" style="visibility: hidden">999</div>
            </div>
            <div class="overflow right"></div>
            <div class="overflow bottom"></div>
        </div>
        <div id="top-header" class="header"></div>
        <div id="left-header" class="header"></div>
        <div id="sheet" class="sheet"></div>
    </div>
</div>
`);
