import {cloneGridTemplate, createCell, createColumnHeaderCell, createRowHeaderCell} from "./templates.js";
import {escapeRegex, toggleSort, visibleRange} from "./utility.js";

const H_SCROLL_BUFFER_PX = 150;
const V_SCROLL_BUFFER_PX = 50;

const baseUrl = import.meta.url.slice(0, -"/virtualized-grid.js".length);

const staticStyle = new CSSStyleSheet();
fetch(`${baseUrl}/style.css`).then(response => response.text()).then(css => staticStyle.replaceSync(css));

function totalColumnWidth(width, column) {
    column.left = width;
    return width + column.width;
}

function totalRowHeight(height, row) {
    row.top = height;
    return height + row.height;
}

/**
 * Custom component implementing the Grid
 */
customElements.define("virtualized-grid", class extends HTMLElement {

    constructor() {
        super();

        this.attachShadow({mode: "open"}).adoptedStyleSheets = [
            staticStyle,
            this.dynamicStyle = new CSSStyleSheet()
        ];

        this.shadowRoot.appendChild(cloneGridTemplate());

        this.viewPort = this.shadowRoot.getElementById("view-port");
        this.scrollArea = this.shadowRoot.getElementById("scroll-area");
        this.topHeader = this.shadowRoot.getElementById("top-header");
        this.leftHeader = this.shadowRoot.getElementById("left-header");
        this.sheet = this.shadowRoot.getElementById("sheet");

        this.properties = {
            rows: [],
            columns: [],
        }; // keeps a copy of the properties set on the custom element

        Object.defineProperty(this, "data", {
            set(data) {
                requestAnimationFrame(() => {
                    this.properties.columns = data.columns.map(function (column, index) {
                        column.index = index;
                        return column;
                    });
                    this.properties.rows = data.rows.map(function (row, index) {
                        row.index = index;
                        return row;
                    });
                    this.filter();
                });
            }
        });

        this.rows = [];
        this.columns = [];

        this.refreshViewPort = this.refreshViewPort.bind(this);
        this.columnResizeCallback = this.columnResizeCallback.bind(this);
        this.rowResizeCallback = this.rowResizeCallback.bind(this);
        this.columnFitCallback = this.columnFitCallback.bind(this);
    }

    filter(columns = this.properties.columns, rows = this.properties.rows) {
        const filters = columns.filter(column => column.search).map(column => {
            const regExp = new RegExp(escapeRegex(column.search), "i");
            return row => regExp.test(row[column.name]);
        });

        rows = rows.filter(row => filters.every(f => f(row)));
        this.sort(columns, rows);
    }

    sort(columns = this.columns, rows = this.rows) {
        let column = columns.find(column => column.sort);
        if (column) {
            const {name, sort} = column;
            const sortValue = sort === "asc" ? 1 : -1;
            rows = [...rows];
            rows = rows.sort(function (leftRow, rightRow) {
                const leftCell = leftRow[name];
                const rightCell = rightRow[name];
                return leftCell === rightCell ? 0 : leftCell < rightCell ? -sortValue : sortValue;
            });
        }
        this.rows = rows;
        this.columns = columns;
        this.render();
    }

    connectedCallback() {

        this.theme(this.getAttribute("theme") || "light");
        this.render();

        let pendingRefreshViewport = null;
        const refreshViewPort = () => {
            cancelAnimationFrame(pendingRefreshViewport);
            pendingRefreshViewport = requestAnimationFrame(this.refreshViewPort);
        };
        this.viewPort.addEventListener("scroll", refreshViewPort);

        let pendingResize = null;
        const resizeObserver = new ResizeObserver(([entry]) => {
            cancelAnimationFrame(pendingResize);
            pendingResize = requestAnimationFrame(() => {
                console.log("resize observer:", entry);
                this.resizeScrollArea();
                this.refreshViewPort();
            });
        });
        resizeObserver.observe(this.viewPort);

        this.disconnectedCallback = () => {
            this.viewPort.removeEventListener("scroll", refreshViewPort);
            resizeObserver.unobserve(this.viewPort);
            this.disconnectedCallback = undefined;
        };
    }

    render() {
        console.log("rendering grid");

        const {
            scrollLeft,
            scrollTop,
            clientWidth,
            clientHeight
        } = this.viewPort;

        this.resizeScrollArea();

        // todo: move buffer constants in utility

        this.renderColumnHeaders(scrollLeft - H_SCROLL_BUFFER_PX, scrollLeft + clientWidth + H_SCROLL_BUFFER_PX);
        this.renderRowHeaders(scrollTop - V_SCROLL_BUFFER_PX, scrollTop + clientHeight + V_SCROLL_BUFFER_PX);

        this.addEventListeners();
        this.replaceStyle();
        this.renderSheet();

        this.state = {
            scrollLeft,
            scrollTop,
            clientWidth,
            clientHeight
        };

        this.refreshViewPort();
    }

    renderColumnHeaders(viewPortLeft, viewPortRight) {
        let [leftIndex, rightIndex] = visibleRange(this.columns, "left", "width", viewPortLeft, viewPortRight);
        this.leftIndex = leftIndex;
        this.rightIndex = rightIndex;
        this.topHeader.innerHTML = this.columns.slice(leftIndex, rightIndex).map(createColumnHeaderCell).join("");
    }

    renderRowHeaders(viewPortTop, viewPortBottom) {
        let [topIndex, bottomIndex] = visibleRange(this.rows, "top", "height", viewPortTop, viewPortBottom);
        this.topIndex = topIndex;
        this.bottomIndex = bottomIndex;
        this.leftHeader.innerHTML = this.rows.slice(topIndex, bottomIndex).map(createRowHeaderCell).join("");
    }

    renderSheet() {
        let sheetHTML = "";
        for (let rowIndex = this.topIndex; rowIndex < this.bottomIndex; ++rowIndex) {
            let row = this.rows[rowIndex];
            let rowHTML = ``;
            for (let columnIndex = this.leftIndex; columnIndex < this.rightIndex; ++columnIndex) {
                let column = this.columns[columnIndex];
                rowHTML += createCell(column, row);
            }
            sheetHTML += `<div class="row ${rowIndex % 2 ? "odd" : "even"}">${rowHTML}</div>`;
        }
        this.sheet.innerHTML = sheetHTML;
    }

    resizeScrollArea() {
        console.log("resizing viewport");
        const stickySizer = this.shadowRoot.getElementById("sticky-sizer");

        this.sheetLeft = stickySizer.clientWidth;
        this.sheetTop = stickySizer.clientHeight;

        const stickyWidthPx = `${this.sheetLeft}px`;
        this.style.setProperty("--stub-width", stickyWidthPx);
        this.width = this.columns.reduce(totalColumnWidth, 0);
        this.scrollArea.style.width = `${this.width}px`;

        const stickyHeightPx = `${this.sheetTop}px`;
        this.style.setProperty("--stub-height", stickyHeightPx);
        this.height = this.rows.reduce(totalRowHeight, 0);
        this.scrollArea.style.height = `${this.height}px`;
    }

    scrollTo(x, y) {
        this.viewPort.scrollTo(x, y);
    }

    theme(theme) {
        if (theme === "light") {
            this.style.setProperty("--primary-color", "dodgerblue");
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
            this.style.setProperty("--primary-color", "dodgerblue");
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

    refreshViewPort() {

        const state = this.state;

        const scrollLeft = this.viewPort.scrollLeft;
        const scrollTop = this.viewPort.scrollTop;
        const horizontalScroll = scrollLeft - state.scrollLeft;
        const verticalScroll = scrollTop - state.scrollTop;

        const viewportWidth = this.viewPort.clientWidth;
        const viewportHeight = this.viewPort.clientHeight;
        const horizontalResize = viewportWidth - state.clientWidth;
        const verticalResize = viewportHeight - state.clientHeight;

        const visibleLeft = scrollLeft - H_SCROLL_BUFFER_PX;
        const visibleRight = scrollLeft + viewportWidth + H_SCROLL_BUFFER_PX;
        const visibleTop = scrollTop - V_SCROLL_BUFFER_PX;
        const visibleBottom = scrollTop + viewportHeight + V_SCROLL_BUFFER_PX;

        state.scrollLeft = this.viewPort.scrollLeft;
        state.scrollTop = this.viewPort.scrollTop;
        state.clientWidth = this.viewPort.clientWidth;
        state.clientHeight = this.viewPort.clientHeight;

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

        let leftIndex = this.leftIndex;
        let rightIndex = this.rightIndex;

        if (horizontalScroll < 0) {
            let column, headerHTML = "";
            while ((column = this.columns[--leftIndex]) && (column.left + column.width) >= visibleLeft) {
                headerHTML = createColumnHeaderCell(column) + headerHTML;
            }
            ++leftIndex;
            if (headerHTML) {
                this.topHeader.insertAdjacentHTML("afterbegin", headerHTML);
                const entered = this.columns.slice(leftIndex, this.leftIndex);
                let rowElement = this.sheet.firstElementChild;
                for (let rowIndex = this.topIndex; rowElement && rowIndex < this.bottomIndex; rowIndex++) {
                    let rowHTML = "";
                    for (const column of entered) {
                        rowHTML += createCell(column, this.rows[rowIndex]);
                    }
                    rowElement.insertAdjacentHTML("afterbegin", rowHTML);
                    rowElement = rowElement.nextElementSibling;
                }
                this.leftIndex = leftIndex;
            }
        }

        if (horizontalScroll > 0 || horizontalResize > 0) {
            let column, headerHTML = "";
            while ((column = this.columns[rightIndex]) && column.left <= visibleRight) {
                headerHTML += createColumnHeaderCell(column);
                ++rightIndex;
            }
            if (headerHTML) {
                this.topHeader.insertAdjacentHTML("beforeend", headerHTML);
                const entered = this.columns.slice(this.rightIndex, rightIndex);
                let rowElement = this.sheet.firstElementChild;
                for (let rowIndex = this.topIndex; rowElement && rowIndex < this.bottomIndex; rowIndex++) {
                    let rowHTML = "";
                    for (const column of entered) {
                        rowHTML += createCell(column, this.rows[rowIndex]);
                    }
                    rowElement.insertAdjacentHTML("beforeend", rowHTML);
                    rowElement = rowElement.nextElementSibling;
                }
                this.rightIndex = rightIndex;
            }
        }

        if (verticalScroll < 0) {
            this.enterTop(visibleTop);
        }
        if (verticalScroll > 0 || verticalResize > 0) {
            this.enterBottom(visibleBottom);
        }

        this.addEventListeners();
        this.replaceStyle();
    }

    leaveTop(visibleTop) {
        const {leftHeader, sheet, rows} = this;
        let row;
        while ((row = rows[this.topIndex]) && (row.top + row.height < visibleTop)) {
            let headerCell = leftHeader.firstElementChild;
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
        const {leftHeader, sheet, rows} = this;
        let row;
        while ((row = rows[--this.bottomIndex]) && (row.top > visibleBottom)) {
            let headerCell = leftHeader.lastElementChild;
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
        const {topHeader, columns} = this;
        let column;
        while ((column = columns[this.leftIndex]) && (column.left + column.width < visibleLeft)) {
            let headerCell = topHeader.firstElementChild;
            if (headerCell) {
                headerCell.remove();
                let rowElement = this.sheet.firstElementChild;
                if (rowElement) do {
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
        const {topHeader, columns} = this;
        let column;
        while ((column = columns[--this.rightIndex]) && (column.left > visibleRight)) {
            let headerCell = topHeader.lastElementChild;
            if (headerCell) {
                headerCell.remove();
                let rowElement = this.sheet.firstElementChild;
                if (rowElement) do {
                    rowElement.lastElementChild.remove();
                } while ((rowElement = rowElement.nextElementSibling));
            }
        }
        ++this.rightIndex;
        if (this.rightIndex < this.leftIndex) {
            this.leftIndex = this.rightIndex;
        }
    }

    enterTop(visibleTop) {
        const {rows, columns} = this;
        let rowIndex = this.topIndex;
        let headerHTML = "", rowsHTML = "";
        let row;
        while ((row = rows[--rowIndex]) && (row.top + row.height >= visibleTop)) {
            let rowHTML = "";
            for (let columnIndex = this.leftIndex; columnIndex < this.rightIndex; columnIndex++) {
                rowHTML += createCell(columns[columnIndex], row);
            }
            rowsHTML = `<div row="${rowIndex}" class="row ${rowIndex % 2 ? "odd" : "even"}">${rowHTML}</div>${rowsHTML}`;
            headerHTML = createRowHeaderCell(this.rows[rowIndex]) + headerHTML;
        }
        this.leftHeader.insertAdjacentHTML("afterbegin", headerHTML);
        this.sheet.insertAdjacentHTML("afterbegin", rowsHTML);
        this.topIndex = ++rowIndex;
    }

    enterBottom(visibleBottom) {
        const {rows, columns} = this;
        let rowIndex = this.bottomIndex;
        let headerHTML = "", rowsHTML = "";
        let row;
        while ((row = rows[rowIndex]) && (row.top < visibleBottom)) {
            let rowHTML = "";
            for (let columnIndex = this.leftIndex; columnIndex < this.rightIndex; columnIndex++) {
                rowHTML += createCell(columns[columnIndex], row);
            }
            rowsHTML = `${rowsHTML}<div row="${rowIndex}" class="row ${rowIndex % 2 ? "odd" : "even"}">${rowHTML}</div>`;
            headerHTML += createRowHeaderCell(this.rows[rowIndex]);
            ++rowIndex;
        }
        this.leftHeader.insertAdjacentHTML("beforeend", headerHTML);
        this.sheet.insertAdjacentHTML("beforeend", rowsHTML);
        this.bottomIndex = rowIndex;
    }

    /**
     * Adds event listeners to the newly added cells od the grid...
     */
    addEventListeners() {
        for (const handle of this.shadowRoot.querySelectorAll(".header .handle:not(.actionable)")) {
            handle.classList.add("actionable");
            if (handle.hasAttribute("column")) {
                handle.addEventListener("mousedown", this.columnResizeCallback);
                handle.addEventListener("click", (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                });
                handle.addEventListener("dblclick", this.columnFitCallback, true);

                const columnIndex = Number(handle.getAttribute("column"));
                const column = this.columns[columnIndex];
                const cell = handle.parentElement;
                cell.querySelector(".sort").addEventListener("click", (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    console.log("sorting column:", columnIndex);
                    toggleSort(column);
                    this.sort();
                }, true);
                const input = cell.querySelector("input");
                let focused;
                input.addEventListener("focus", () => focused = true);
                input.addEventListener("blur", () => focused = false);
                input.addEventListener("input", () => {
                    column.search = input.value;
                    this.filter();
                });
                cell.querySelector(".search").addEventListener("mousedown", (event) => {
                    if (focused) {
                        event.target.focus();
                    } else {
                        event.preventDefault();
                        event.stopPropagation();
                        input.focus();
                    }
                }, true);
                cell.querySelector("label").addEventListener("click", (event) => {
                    const {extentOffset, anchorOffset, focusNode} = this.shadowRoot.getSelection();
                    if (extentOffset === anchorOffset || focusNode.parentNode !== event.target) {
                        input.focus();
                    }
                }, true);
            } else {
                const rowIndex = Number(handle.getAttribute("row"));
                handle.addEventListener("mousedown", this.rowResizeCallback);
            }
        }
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
                document.body.removeEventListener("pointermove", mouseDragHandler);
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
        document.body.addEventListener("pointermove", mouseDragHandler);
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
        this.sheet.prepend(sizer);

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
                document.body.removeEventListener("pointermove", mouseDragHandler);
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

        document.body.addEventListener("pointermove", mouseDragHandler);
    }

    replaceStyle() {
        let style = `.handle[row]{width:${this.sheetLeft}px;}\n.handle[column]{height:${this.sheetTop}px;}\n`;
        for (const {index, left, width} of this.columns.slice(this.leftIndex, this.rightIndex)) {
            style += `.c-${index}{left:${left}px;width:${width}px;}\n`;
        }
        for (const {height, index, top} of this.rows.slice(this.topIndex, this.bottomIndex)) {
            style += `.r-${index}{top:${top}px;height:${height}px;}\n`;
        }
        this.dynamicStyle.replaceSync(style);
    }

});

