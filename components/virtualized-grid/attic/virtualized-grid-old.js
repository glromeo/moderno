const H_SCROLL_BUFFER_PX = 0;
const V_SCROLL_BUFFER_PX = 0;

const template = document.createElement("template");
template.innerHTML = `
<div id="view-port" style="width: 100%; height: 100%; overflow: auto">
    <div id="scroll-area" style="position: relative">
        <div id="stub" class="header">
            <div id="sticky-sizer" class="cell">
                <div class="text">Hello!</div>
            </div>
            <div id="overflow-right"></div>
            <div id="overflow-bottom"></div>
        </div>
        <div id="sticky-rows" class="header"></div>
        <div id="sticky-columns" class="header"></div>
        <div id="sheet" class="sheet"></div>
    </div>
</div>
`;

const style = new CSSStyleSheet();

style.replaceSync(`
    :host {
        --stub-width: 0px;
        --stub-height: 0px;
        display: contents;
        color: var(--text-color)
    }
    
    * {
        box-sizing: border-box;
    }
    
    #view-port {
        background-color: var(--background-color);
    }
    
    #stub {
        position: fixed;
        z-index: 100;
        left: 0;
        top: 0;
        width: var(--stub-width);
        height: var(--stub-height);
        border-right: 1px solid var(--border-color);
        border-bottom: 1px solid var(--border-color);
        box-shadow: 1px 1px 3px var(--shadow-color);
    }
    
    #stub #overflow-right {
        position: fixed;
        top: 0px;
        left: var(--stub-width);
        width: 3px;
        height: var(--stub-height);
        background-color: var(--background-color);
        box-shadow: 1px -3px 3px var(--background-color);
        border-bottom: 1px solid var(--border-color);
    }

    #stub #overflow-bottom {
        position: fixed;
        top: var(--stub-height);
        left: 0px;
        height: 3px;
        width: var(--stub-width);
        background-color: var(--background-color);
        box-shadow: -3px 1px 3px var(--background-color);
        border-right: 1px solid var(--border-color);
    }
    
    #stub .text {
        visibility: hidden;
    }
    
    #sticky-rows {
        position: sticky;
        top: 0;
        width: 100%;
        height: var(--stub-height);
        z-index: 10;
        box-shadow: 1px 0px 3px var(--shadow-color);
        margin-left: var(--stub-width);
    }
    
    #sticky-rows .cell {
        height: 100%;
    }
    
    #sticky-rows .handle {
        float: right;
        width: 1px;
        background-color: black;
        z-index: 100;
        position: relative;
        left: 1px;
    }

    #sticky-rows .handle::after {
        content: "";
        width: 9px;
        position: absolute;
        top: 0;
        bottom: 0;
        margin-left: -4px;
        background-color: transparent;
        cursor: ew-resize;
        z-index: 200;
    }
    
    #sticky-columns {
        position: sticky;
        left: 0;
        width: var(--stub-width);
        height: 100%;
        z-index: 10;
        box-shadow: 0px 1px 3px var(--shadow-color);
    }
    
    #sticky-columns .cell {
        text-align: center;
        width: 100%;
    }
    
    #sticky-columns .handle {
        float: bottom;
        width: 1px;
        background-color: black;
        z-index: 100;
        position: relative;
        top: 1px;
    }

    #sticky-columns .handle::after {
        content: "";
        height: 9px;
        position: absolute;
        left: 0;
        right: 0;
        margin-top: -4px;
        background-color: transparent;
        cursor: ns-resize;
        z-index: 200;
    }
    
    #sheet {
        position: absolute;
        top: var(--stub-height);
        left: var(--stub-width);
        width: calc(100% - var(--stub-width));
        height: calc(100% - var(--stub-height));
    }
    
    .header {
        background: var(--background-color);
    }
    
    .cell {
        position: absolute;
        box-sizing: border-box;
    }
    
    .cell .text {
        padding: 8px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    
    .cell {
        border-right: 1px solid var(--border-color);
        border-bottom: 1px solid var(--border-color);
    }
    
    .row {
        display: contents;
    }
    
    .row.even .cell {
        background-color: var(--even-rows-background);
    }

    .row.odd .cell {
        background-color: var(--odd-rows-background);
    }    
`);

function totalColumnWidth(width, column, index) {
    column.index = index;
    column.left = width;
    return width + column.width;
}

function totalRowHeight(height, row, index) {
    row.index = index;
    row.top = height;
    return height + row.height;
}

/**
 * Custom component implementing the Grid
 */
customElements.define("virtualized-grid", class extends HTMLElement {

    constructor() {
        super();

        this.attachShadow({mode: 'open'}).adoptedStyleSheets = [style];

        this.shadowRoot.appendChild(template.content.cloneNode(true));

        this.viewPort = this.shadowRoot.getElementById("view-port");
        this.scrollArea = this.shadowRoot.getElementById("scroll-area");
        this.stickyRows = this.shadowRoot.getElementById("sticky-rows");
        this.stickyColumns = this.shadowRoot.getElementById("sticky-columns");
        this.sheet = this.shadowRoot.getElementById("sheet");

        Object.defineProperty(this, "data", {
            set(data) {
                this.init(data);
            }
        });

        this.rows = [];
        this.rows.sticky = [];
        this.columns = [];
        this.columns.sticky = [];

        this.topIndex = 0;
        this.leftIndex = 0;

        this.scrollCallback = this.scrollCallback.bind(this)
        this.columnResizeCallback = this.columnResizeCallback.bind(this);
        this.scrollTo = (x, y) => this.viewPort.scrollTo(x, y);

    }

    theme(theme) {
        if (theme === "light") {
            this.style.setProperty("--text-color", "black");
            this.style.setProperty("--background-color", "white");
            this.style.setProperty("--even-rows-background", "white");
            this.style.setProperty("--odd-rows-background", "#eee");
            this.style.setProperty("--border-color", "lightgrey");
            this.style.setProperty("--shadow-color", "rgba(0, 0, 0, 0.25)");
            return;
        }
        if (theme === "dark") {
            this.style.setProperty("--text-color", "white");
            this.style.setProperty("--background-color", "#444");
            this.style.setProperty("--even-rows-background", "#222");
            this.style.setProperty("--odd-rows-background", "#111");
            this.style.setProperty("--border-color", "#333");
            this.style.setProperty("--shadow-color", "rgba(0, 0, 0, 1)");
            return;
        }
        if (theme) {
            if (theme.backgroundColor) this.style.setProperty("--background-color", theme.backgroundColor);
            if (theme.borderColor) this.style.setProperty("--border-color", theme.borderColor);
            if (theme.shadowColor) this.style.setProperty("--shadow-color", theme.shadowColor);
            if (theme.evenRowsBackground) this.style.setProperty("--even-rows-background", theme.evenRowsBackground);
            if (theme.oddRowsBackground) this.style.setProperty("--odd-rows-background", theme.oddRowsBackground);
        }
    }

    connectedCallback() {

        this.theme(this.getAttribute("theme") || "light")
        this.init();

        let ro = new ResizeObserver(entries => {
            for (let entry of entries) {
                const cr = entry.contentRect;
                console.log('Element:', entry.target);
                console.log(`Element size: ${cr.width}px x ${cr.height}px`);
                console.log(`Element padding: ${cr.top}px ; ${cr.left}px`);
            }
        });
        ro.observe(this.viewPort);

        this.fragment = document.createDocumentFragment();

        let pendingAnimationFrame = null;

        this.viewPort.addEventListener("scroll", () => {
            cancelAnimationFrame(pendingAnimationFrame);
            pendingAnimationFrame = requestAnimationFrame(this.scrollCallback);
        });

        for (const header of this.shadowRoot.querySelectorAll(".header")) {
            header.addEventListener("mousedown", this.columnResizeCallback);
        }
    }

    init({columns = [], rows = []} = {}) {

        console.log('initialising grid');

        this.rows = rows;
        this.rows.sticky = [];
        this.columns = columns;
        this.columns.sticky = [];

        const stickySizer = this.shadowRoot.getElementById("sticky-sizer");

        this.sheetLeft = stickySizer.clientWidth;
        this.sheetTop = stickySizer.clientHeight;

        const stickyWidthPx = `${this.columns.sticky.reduce(totalColumnWidth, this.sheetLeft)}px`;
        this.style.setProperty("--stub-width", stickyWidthPx);
        this.width = this.columns.reduce(totalColumnWidth, 0);
        this.scrollArea.style.width = `${this.width}px`;

        const stickyHeightPx = `${this.rows.sticky.reduce(totalRowHeight, this.sheetTop)}px`;
        this.style.setProperty("--stub-height", stickyHeightPx);
        this.height = this.rows.reduce(totalRowHeight, 0);
        this.scrollArea.style.height = `${this.height}px`;

        const viewPortWidth = this.viewPort.clientWidth + H_SCROLL_BUFFER_PX;
        const viewPortHeight = this.viewPort.clientHeight + V_SCROLL_BUFFER_PX;

        let columnIndex = this.leftIndex;
        let column, stickyRowsHTML = ''
        while ((column = this.columns[columnIndex]) && column.left < viewPortWidth) {
            stickyRowsHTML += this.createColumnHeaderCell(column);
            ++columnIndex;
        }
        this.stickyRows.innerHTML = stickyRowsHTML;
        this.rightIndex = columnIndex;

        let rowIndex = this.topIndex;
        let row, stickyColumnsHTML = ''
        while ((row = rows[rowIndex]) && row.top < viewPortHeight) {
            stickyColumnsHTML += this.createRowHeaderCell(row);
            ++rowIndex;
        }
        this.stickyColumns.innerHTML = stickyColumnsHTML;
        this.bottomIndex = rowIndex;

        let sheetHTML = ''
        for (let rowIndex = this.topIndex; rowIndex < this.bottomIndex; ++rowIndex) {
            let row = rows[rowIndex];
            let rowHTML = ``
            for (let columnIndex = this.leftIndex; columnIndex < this.rightIndex; ++columnIndex) {
                let column = columns[columnIndex];
                rowHTML += this.createCell(column, row);
            }
            sheetHTML += `<div class="row ${rowIndex % 2 ? "odd" : "even"}">${rowHTML}</div>`;
        }
        this.sheet.innerHTML = sheetHTML;

        this.lastScrollLeft = this.viewPort.scrollLeft;
        this.lastScrollTop = this.viewPort.scrollTop;
    }

    columnResizeCallback(triggerEvent) {
        const handle = triggerEvent.target;
        if (handle.getAttribute("class") === "handle") {
            triggerEvent.preventDefault();

            const handleIndex = 1 + parseInt(handle.getAttribute("column"));
            const column = this.columns[handleIndex - 1];
            const cell = handle.parentElement;

            const initialWidth = column.width;
            const offset = triggerEvent.pageX;

            const mouseDragHandler = (dragEvent) => {
                dragEvent.preventDefault();
                const primaryButtonPressed = dragEvent.buttons === 1;
                if (!primaryButtonPressed) {
                    document.body.removeEventListener('pointermove', mouseDragHandler);
                    return;
                }
                let delta = dragEvent.pageX - offset;
                let width = initialWidth + delta;
                if (column.maxWidth !== undefined) {
                    width = Math.min(width, column.maxWidth);
                }
                if (column.maxWidth !== undefined) {
                    width = Math.max(width, column.minWidth);
                }
                column.width = width;
                cell.style.width = `${width}px`;

                for (let columnIndex = handleIndex; columnIndex < this.rightIndex; columnIndex++) {
                    const left = this.columns[columnIndex].left += delta;
                }
            };

            document.body.addEventListener('pointermove', mouseDragHandler);
        }
    }

    scrollCallback() {

        const scrollLeft = this.viewPort.scrollLeft;
        const scrollTop = this.viewPort.scrollTop;

        const horizontalScroll = scrollLeft - this.lastScrollLeft;
        const verticalScroll = scrollTop - this.lastScrollTop;

        const viewportWidth = this.viewPort.clientWidth;
        const viewportHeight = this.viewPort.clientHeight;

        const visibleLeft = scrollLeft - H_SCROLL_BUFFER_PX;
        const visibleRight = scrollLeft + viewportWidth + H_SCROLL_BUFFER_PX;
        const visibleTop = scrollTop - V_SCROLL_BUFFER_PX;
        const visibleBottom = scrollTop + viewportHeight + V_SCROLL_BUFFER_PX;

        this.lastScrollLeft = scrollLeft;
        this.lastScrollTop = scrollTop;

        // =========================================================================================================
        // LEAVE
        // =========================================================================================================

        if (verticalScroll > 0) {
            this.leaveTop(visibleTop);
        }
        if (verticalScroll < 0) {
            this.leaveBottom(visibleBottom);
        }
        if (horizontalScroll > 0) {
            this.leaveLeft(visibleLeft);
        }
        if (horizontalScroll < 0) {
            this.leaveRight(visibleRight);
        }

        // =========================================================================================================
        // ENTER
        // =========================================================================================================

        let rightIndex = this.rightIndex;
        if (horizontalScroll > 0) {
            let column;
            let html = '';
            while ((column = this.columns[rightIndex]) && column.left <= visibleRight) {
                html += this.createColumnHeaderCell(column);
                ++rightIndex;
            }
            this.stickyRows.insertAdjacentHTML("beforeend", html);
        }

        let leftIndex = this.leftIndex;
        if (horizontalScroll < 0) {
            let column;
            let html = '';
            while ((column = this.columns[--leftIndex]) && (column.left + column.width) >= visibleLeft) {
                html = this.createColumnHeaderCell(column) + html;
            }
            ++leftIndex;
            this.stickyRows.insertAdjacentHTML("afterbegin", html);
        }

        if (leftIndex < this.leftIndex) {
            this.enterLeft(leftIndex);
        }
        if (rightIndex > this.rightIndex) {
            this.enterRight(rightIndex);
        }

        if (verticalScroll < 0) {
            this.enterTop(visibleTop, leftIndex, rightIndex);
        }
        if (verticalScroll > 0) {
            this.enterBottom(visibleBottom, leftIndex, rightIndex);
        }
    }


    leaveTop(visibleTop) {
        const {stickyColumns: rowHeader, sheet, rows} = this;
        let row;
        while ((row = rows[this.topIndex]) && (row.top + row.height < visibleTop)) {
            let headerCell = rowHeader.firstElementChild;
            if (headerCell) {
                headerCell.remove();
                sheet.firstElementChild.remove();
            }
            ++this.topIndex;
        }
        if (this.topIndex > this.bottomIndex) {
            this.bottomIndex = this.topIndex;
        }
    }


    leaveBottom(visibleBottom) {
        const {stickyColumns: rowHeader, sheet, rows} = this;
        let row;
        while ((row = rows[--this.bottomIndex]) && (row.top > visibleBottom)) {
            let headerCell = rowHeader.lastElementChild;
            if (headerCell) {
                headerCell.remove();
                sheet.lastElementChild.remove();
            }
        }
        ++this.bottomIndex;
        if (this.bottomIndex < this.topIndex) {
            this.topIndex = this.bottomIndex;
        }
    }


    leaveLeft(visibleLeft) {
        const {stickyRows: columnHeader, columns} = this;
        let column;
        while ((column = columns[this.leftIndex]) && (column.left + column.width < visibleLeft)) {
            let headerCell = columnHeader.firstElementChild;
            if (headerCell) {
                headerCell.remove();
                let rowElement = this.sheet.firstElementChild;
                do {
                    rowElement.firstElementChild.remove();
                } while ((rowElement = rowElement.nextElementSibling));
            }
            this.leftIndex++;
        }
        if (this.leftIndex > this.rightIndex) {
            this.rightIndex = this.leftIndex;
        }
    }


    leaveRight(visibleRight) {
        const {stickyRows: columnHeader, columns} = this;
        let column;
        while ((column = columns[--this.rightIndex]) && (column.left > visibleRight)) {
            let headerCell = columnHeader.lastElementChild;
            if (headerCell) {
                headerCell.remove();
                let rowElement = this.sheet.firstElementChild;
                do {
                    rowElement.lastElementChild.remove();
                } while ((rowElement = rowElement.nextElementSibling));
            }
        }
        ++this.rightIndex;
        if (this.rightIndex < this.leftIndex) {
            this.leftIndex = this.rightIndex;
        }
    }


    enterRight(enterRightIndex) {
        let rowElement = this.sheet.firstElementChild;
        for (let rowIndex = this.topIndex; rowIndex < this.bottomIndex; rowIndex++) {
            let row = this.rows[rowIndex];
            let html = '';
            let columnIndex = this.rightIndex;
            while (columnIndex < enterRightIndex) {
                html += this.createCell(this.columns[columnIndex++], row);
            }
            rowElement.insertAdjacentHTML("beforeend", html);
            rowElement = rowElement.nextElementSibling;
        }
        this.rightIndex = enterRightIndex;
    }


    enterLeft(enterLeftIndex) {
        let rowElement = this.sheet.firstElementChild;
        for (let rowIndex = this.topIndex; rowIndex < this.bottomIndex; rowIndex++) {
            let row = this.rows[rowIndex];
            let html = '';
            let columnIndex = enterLeftIndex;
            while (columnIndex < this.leftIndex) {
                html += this.createCell(this.columns[columnIndex++], row);
            }
            rowElement.insertAdjacentHTML("afterbegin", html);
            rowElement = rowElement.nextElementSibling;
        }
        this.leftIndex = enterLeftIndex;
    }


    enterBottom(visibleBottom, leftIndex, rightIndex) {
        const {rows, columns} = this;
        let rowIndex = this.bottomIndex;
        let headerHTML = '', rowsHTML = '';
        let row;
        while ((row = rows[rowIndex]) && (row.top < visibleBottom)) {
            let rowHTML = '';
            for (let columnIndex = leftIndex; columnIndex < rightIndex; columnIndex++) {
                rowHTML += this.createCell(columns[columnIndex], row);
            }
            rowsHTML = `${rowsHTML}<div row="${rowIndex}" class="row ${rowIndex % 2 ? "odd" : "even"}">${rowHTML}</div>`;
            headerHTML += this.createRowHeaderCell(this.rows[rowIndex]);
            ++rowIndex;
        }
        this.bottomIndex = rowIndex;
        this.stickyColumns.insertAdjacentHTML("beforeend", headerHTML);
        this.sheet.insertAdjacentHTML("beforeend", rowsHTML);
    }

    enterTop(visibleTop, leftIndex, rightIndex) {
        const {rows, columns} = this;
        let rowIndex = this.topIndex;
        let headerHTML = '', rowsHTML = '';
        let row;
        while ((row = rows[--rowIndex]) && (row.top + row.height >= visibleTop)) {
            let rowHTML = '';
            for (let columnIndex = leftIndex; columnIndex < rightIndex; columnIndex++) {
                rowHTML += this.createCell(columns[columnIndex], row);
            }
            rowsHTML = `<div row="${rowIndex}" class="row ${rowIndex % 2 ? "odd" : "even"}">${rowHTML}</div>${rowsHTML}`;
            headerHTML = this.createRowHeaderCell(this.rows[rowIndex]) + headerHTML;
        }
        this.topIndex = ++rowIndex;
        this.stickyColumns.insertAdjacentHTML("afterbegin", headerHTML);
        this.sheet.insertAdjacentHTML("afterbegin", rowsHTML);
    }

    createColumnHeaderCell({index, label, left, width}) {
        return `<div class="cell" style="left:${left}px;width:${width}px">
            <div class="text">${label}</div>
            <div class="handle" column="${index}" style="left:1px;top:-${this.sheetTop}px;width:1px;height:${this.sheetTop}px"></div>
        </div> `;
    }

    createRowHeaderCell({index, label, top, height}) {
        return `<div class="cell" style="top:${top}px;height:${height}px">
            <div class="text">${label}</div>
            <div class="handle" row="${index}" style="left:0px;top:1px;height:1px;width:${this.sheetLeft}px"></div>
        </div>`;
    }

    createCell(column, row) {
        let {left, width, name} = column;
        let {top, height} = row;
        return `<div class="cell" style="left:${left}px;top:${top}px;width:${(width)}px;height:${(height)}px">
            <div class="text">${row[column.name]}</div>
        </div>`;
    }

});

function calculateScrollbarDimensions() {
    let sample = document.createElement("div");
    sample.style.cssText = `
        width: 100px;
        height: 100px;
        overflow: scroll;
        position: absolute;
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
