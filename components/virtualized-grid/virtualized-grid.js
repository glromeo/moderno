import icons from "./icons.js";

const H_SCROLL_BUFFER_PX = 150;
const V_SCROLL_BUFFER_PX = 50;

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

const baseUrl = import.meta.url.slice(0, -"/virtualized-grid.js".length);

const style = new CSSStyleSheet();
fetch(`${baseUrl}/style.css`).then(response => response.text()).then(css => style.replaceSync(css));

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

        this.styleOverride = new CSSStyleSheet();
        this.styleOverride.replaceSync(``);

        this.attachShadow({mode: 'open'}).adoptedStyleSheets = [
            style,
            this.styleOverride
        ];

        this.shadowRoot.appendChild(template.content.cloneNode(true));

        this.viewPort = this.shadowRoot.getElementById("view-port");
        this.scrollArea = this.shadowRoot.getElementById("scroll-area");
        this.stickyRows = this.shadowRoot.getElementById("sticky-rows");
        this.stickyColumns = this.shadowRoot.getElementById("sticky-columns");
        this.sheet = this.shadowRoot.getElementById("sheet");

        this.properties = {}; // keeps a copy of the properties set on the custom element

        Object.defineProperty(this, "data", {
            set(data) {
                requestAnimationFrame(() => {
                    this.properties.columns = [...data.columns];
                    this.properties.rows = [...data.rows];
                    this.init(data);
                });
            }
        });

        this.rows = [];
        this.rows.sticky = [];
        this.columns = [];
        this.columns.sticky = [];

        this.topIndex = 0;
        this.leftIndex = 0;

        this.refreshViewPort = this.refreshViewPort.bind(this);
        this.columnResizeCallback = this.columnResizeCallback.bind(this);
        this.rowResizeCallback = this.rowResizeCallback.bind(this);
        this.columnFitCallback = this.columnFitCallback.bind(this);
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
            this.style.setProperty("--border-color-active", "black");
            return;
        }
        if (theme === "dark") {
            this.style.setProperty("--text-color", "white");
            this.style.setProperty("--background-color", "#444");
            this.style.setProperty("--even-rows-background", "#222");
            this.style.setProperty("--odd-rows-background", "#111");
            this.style.setProperty("--border-color", "#333");
            this.style.setProperty("--shadow-color", "rgba(0, 0, 0, 1)");
            this.style.setProperty("--border-color-active", "white");
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

        let pendingSrollAnimationFrame = null;
        const refreshViewPort = () => {
            cancelAnimationFrame(pendingSrollAnimationFrame);
            pendingSrollAnimationFrame = requestAnimationFrame(this.refreshViewPort);
        };
        this.viewPort.addEventListener("scroll", refreshViewPort);

        const resizeObserver = new ResizeObserver(() => {
            this.resizeViewPort();
            this.refreshViewPort();
        });
        resizeObserver.observe(this.viewPort);

        this.disconnectedCallback = () => {
            this.viewPort.removeEventListener("scroll", refreshViewPort);
            resizeObserver.unobserve(this.viewPort);
            this.disconnectedCallback = undefined;
        };
    }

    init({columns = [], rows = []} = {}) {

        console.log('initialising grid');

        this.rows = rows;
        this.rows.sticky = [];
        this.columns = columns;
        this.columns.sticky = [];

        this.resizeViewPort();

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

        this.addEventListeners();
        this.replaceStyle();

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

        this.viewPortSnapshot = {
            scrollLeft: this.viewPort.scrollLeft,
            scrollTop: this.viewPort.scrollTop,
            clientWidth: this.viewPort.clientWidth,
            clientHeight: this.viewPort.clientHeight,
        };
    }

    resizeViewPort() {
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
    }

    columnResizeCallback(event) {
        event.preventDefault();
        event.stopPropagation();
        const handle = event.target;
        handle.classList.add("active");

        const columnIndex = Number(handle.getAttribute("column"));
        const initialPageX = event.pageX;

        const column = this.columns[columnIndex];
        const cell = handle.parentElement;

        const initialWidth = column.width;

        const mouseDragHandler = (event) => {
            event.preventDefault();
            const primaryButtonPressed = event.buttons === 1;
            if (!primaryButtonPressed) {
                handle.classList.remove("active");
                cell.style.width = null;
                document.body.removeEventListener('pointermove', mouseDragHandler);
                return;
            }
            let width = initialWidth + event.pageX - initialPageX;
            if (column.maxWidth !== undefined) {
                width = Math.min(width, column.maxWidth);
            }
            if (column.minWidth !== undefined) {
                width = Math.max(width, column.minWidth);
            } else {
                width = Math.max(width, 20);
            }
            let delta = width - column.width;
            if (Math.abs(delta) > 3) {
                console.log("delta:", delta);
                column.width = width;
                cell.style.width = `${width}px`;
                for (let c = columnIndex + 1; c < this.rightIndex; c++) {
                    this.columns[c].left += delta;
                }
                this.replaceStyle();
            }
        };
        document.body.addEventListener('pointermove', mouseDragHandler);
    }

    columnFitCallback(event) {
        event.preventDefault();
        event.stopPropagation();
        const handle = event.target;
        handle.classList.add("active");

        this.classList.add("busy");
        let sizer = this.sheet.firstElementChild.firstElementChild.cloneNode(true);
        let textSizer = sizer.firstElementChild;
        sizer.style.cssText = `z-index: 1000;background: red; left:0; top: 0; position: absolute; width: unset; height: unset;`;
        this.sheet.prepend(sizer)

        const columnIndex = Number(handle.getAttribute("column"));
        const column = this.columns[columnIndex];
        const cell = handle.parentElement;

        let width = 0;
        for (const row of this.rows) {
            textSizer.innerText = row[column.name];
            width = Math.max(width, sizer.clientWidth);
        }
        width += 4;
        let delta = width - cell.clientWidth - 1;
        if (Math.abs(delta) > 3) {
            column.width = width;
            for (let c = columnIndex + 1; c < this.rightIndex; c++) {
                this.columns[c].left += delta;
            }
            this.replaceStyle();
        }

        handle.classList.remove("active");

        sizer.remove();
        this.classList.remove("busy");
    }

    rowResizeCallback(event) {
        event.preventDefault();
        event.stopPropagation();
        const handle = event.target;
        handle.classList.add("active");

        const rowIndex = Number(handle.getAttribute("row"));
        const initialPageY = event.pageY;

        const row = this.rows[rowIndex];
        const cell = handle.parentElement;

        const initialHeight = row.height;

        const mouseDragHandler = (event) => {
            event.preventDefault();
            const primaryButtonPressed = event.buttons === 1;
            if (!primaryButtonPressed) {
                handle.classList.remove("active");
                document.body.removeEventListener('pointermove', mouseDragHandler);
                return;
            }
            let height = initialHeight + event.pageY - initialPageY;
            if (row.maxHeight !== undefined) {
                height = Math.min(height, row.maxHeight);
            }
            if (row.minHeight !== undefined) {
                height = Math.max(height, row.minHeight);
            } else {
                height = Math.max(height, 20);
            }
            let delta = height - row.height;
            row.height = height;
            cell.style.height = `${height}px`;

            for (let r = rowIndex + 1; r < this.bottomIndex; r++) {
                this.rows[r].top += delta;
            }

            this.replaceStyle();
        };

        document.body.addEventListener('pointermove', mouseDragHandler);
    }

    refreshViewPort() {

        const scrollLeft = this.viewPort.scrollLeft;
        const scrollTop = this.viewPort.scrollTop;
        const horizontalScroll = scrollLeft - this.viewPortSnapshot.scrollLeft;
        const verticalScroll = scrollTop - this.viewPortSnapshot.scrollTop;

        const viewportWidth = this.viewPort.clientWidth;
        const viewportHeight = this.viewPort.clientHeight;
        const horizontalResize = viewportWidth - this.viewPortSnapshot.clientWidth;
        const verticalResize = viewportHeight - this.viewPortSnapshot.clientHeight;

        const visibleLeft = scrollLeft - H_SCROLL_BUFFER_PX;
        const visibleRight = scrollLeft + viewportWidth + H_SCROLL_BUFFER_PX;
        const visibleTop = scrollTop - V_SCROLL_BUFFER_PX;
        const visibleBottom = scrollTop + viewportHeight + V_SCROLL_BUFFER_PX;

        this.viewPortSnapshot = {
            scrollLeft: this.viewPort.scrollLeft,
            scrollTop: this.viewPort.scrollTop,
            clientWidth: this.viewPort.clientWidth,
            clientHeight: this.viewPort.clientHeight,
        }

        // =========================================================================================================
        // LEAVE
        // =========================================================================================================

        if (verticalScroll > 0) {
            this.leaveTop(visibleTop);
        }
        if (verticalScroll < 0 || verticalResize < 0) {
            this.leaveBottom(visibleBottom);
        }
        if (horizontalScroll > 0) {
            this.leaveLeft(visibleLeft);
        }
        if (horizontalScroll < 0 || horizontalResize < 0) {
            this.leaveRight(visibleRight);
        }

        // =========================================================================================================
        // ENTER
        // =========================================================================================================

        let rightIndex = this.rightIndex;
        if (horizontalScroll > 0 || horizontalResize > 0) {
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
        if (verticalScroll > 0 || verticalResize > 0) {
            this.enterBottom(visibleBottom, leftIndex, rightIndex);
        }

        this.addEventListeners();
        this.replaceStyle();
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

    createColumnHeaderCell({index, label, sort, search}) {
        const searching = typeof search === "string";
        return `<div class="cell c-${index}" ${sort && `sort="${sort}"` || ""} ${searching && `search="${search}"` || ""}>
            <div class="handle" column="${index}"></div>
            ${searching ? `<div class="label">${label}</div>`: ""}
            <div class="text">                
                ${searching ? `<input type="text" value="${search}" placeholder="search">` : label}
                <svg class="sort" viewBox="0 0 512 512"><path fill="currentColor" d="${icons.arrowUp}"></path></svg>
                <svg class="search" viewBox="0 0 512 512"><path fill="currentColor" d="${icons.search}"></path></svg>
            </div>
        </div> `;
    }

    createRowHeaderCell({index, label}) {
        return `<div class="cell r-${index}">
            <div class="text">${label}</div>
            <div class="handle" row="${index}"></div>
        </div>`;
    }

    createCell(column, row) {
        return `<div class="cell c-${column.index} r-${row.index}">
            <div class="text">${row[column.name]}</div>
        </div>`;
    }

    replaceStyle() {
        let style = `.handle[row]{width:${this.sheetLeft}px;}\n.handle[column]{height:${this.sheetTop}px;}\n`;
        for (let columnIndex = this.leftIndex; columnIndex < this.rightIndex; columnIndex++) {
            let column = this.columns[columnIndex];
            style += `.c-${columnIndex}{left:${column.left}px;width:${column.width}px;}\n`
        }
        for (let rowIndex = this.topIndex; rowIndex < this.bottomIndex; rowIndex++) {
            let row = this.rows[rowIndex];
            style += `.r-${rowIndex}{top:${row.top}px;height:${row.height}px;}\n`
        }
        this.styleOverride.replaceSync(style);
    }

    addEventListeners() {
        for (const handle of this.shadowRoot.querySelectorAll(".header .handle:not(.actionable)")) {
            handle.classList.add("actionable");
            if (handle.hasAttribute("column")) {
                handle.addEventListener("mousedown", this.columnResizeCallback);
                handle.addEventListener("click", (event)=>{
                    event.preventDefault();
                    event.stopPropagation();
                });
                handle.addEventListener("dblclick", this.columnFitCallback, true);

                const columnIndex = Number(handle.getAttribute("column"));
                const cell = handle.nextElementSibling;
                cell.addEventListener("mousedown", (event)=>{
                    if (!event.target.classList.contains("text")) {
                        event.preventDefault();
                    }
                    event.stopPropagation();
                });
                cell.firstElementChild.addEventListener("click", (event) => {
                    console.log("sorting column:", columnIndex);
                    const column = this.columns[columnIndex];

                    if (this.sortColumn && this.sortColumn !== column) {
                        this.sortColumn.sort = undefined;
                    }
                    this.sortColumn = column;

                    if (column.sort === undefined) {
                        column.sort = "asc";
                    } else {
                        if (column.sort === "asc") {
                            column.sort = "desc";
                        } else {
                            column.sort = undefined;
                        }
                    }
                    if (column.sort) {
                        const sortValue = column.sort === "asc" ? 1 : -1;
                        const compareFunction = column.compareFunction || ((firstCell, secondCell) => {
                            return firstCell === secondCell ? 0 : firstCell < secondCell ? -sortValue : sortValue;
                        });
                        this.rows = [...this.rows];
                        this.rows.sort((firstRow, secondRow) => compareFunction(firstRow[column.name], secondRow[column.name]));
                    } else {
                        this.rows = this.properties.rows;
                    }
                    // for (const cell of this.scrollArea.querySelectorAll(".cell")) {
                    //     cell.style.backgroundColor = "red";
                    // }
                    this.init({
                        columns: this.columns,
                        rows: this.rows,
                    });
                });
                cell.lastElementChild.addEventListener("click", (event) => {
                    console.log("searching column:", columnIndex);
                    const column = this.columns[columnIndex];
                    if (typeof column.search === "string") {
                        column.search = undefined;
                    } else {
                        column.search = "";
                    }
                    this.init({
                        columns: this.columns,
                        rows: this.rows,
                    });
                });
            } else {
                const rowIndex = Number(handle.getAttribute("row"));
                handle.addEventListener("mousedown", this.rowResizeCallback);
            }
        }
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
