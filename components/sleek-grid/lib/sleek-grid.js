import {renderDynamicStyle} from "./styles/dynamic.js";
import {sleekStyle} from "./styles/sleek.js";
import {staticStyle} from "./styles/static.js";
import {cloneGridTemplate} from "./templates/grid.js";
import {createCell, createColumnHeaderCell, createRowHeaderCell} from "./templates/headers.js";
import {
    createCapturingHandler,
    createDragHandler,
    escapeRegex,
    textWidth,
    totalColumnWidth,
    totalRowHeight,
    visibleRange
} from "./utility.js";

const H_SCROLL_BUFFER_PX = 160;
const V_SCROLL_BUFFER_PX = 90;

/**
 * Custom component implementing the Grid
 */
export class SleekGrid extends HTMLElement {

    constructor() {
        super();

        const dynamicStyle = new CSSStyleSheet();

        this.attachShadow({mode: "open"}).adoptedStyleSheets = [
            staticStyle,
            sleekStyle,
            dynamicStyle
        ];

        this.updateStyle = () => {
            const cssText = renderDynamicStyle(this);
            dynamicStyle.replaceSync(cssText);
        };

        this.shadowRoot.appendChild(cloneGridTemplate());

        this.stub = this.shadowRoot.getElementById("stub");
        this.viewPort = this.shadowRoot.getElementById("view-port");
        this.scrollArea = this.shadowRoot.getElementById("scroll-area");
        this.topHeader = this.shadowRoot.getElementById("top-header");
        this.leftHeader = this.shadowRoot.getElementById("left-header");
        this.sheet = this.shadowRoot.getElementById("sheet");

        this.properties = {
            rows: [],
            columns: [],
        }; // keeps a copy of the properties set on the custom element

        this.pendingUpdates = [];

        this.rows = [];
        this.columns = [];

        this.headerWidthResizeCallback = createDragHandler(this.headerWidthResizeCallback.bind(this));
        this.headerHeightResizeCallback = createDragHandler(this.headerHeightResizeCallback.bind(this));
        this.columnResizeCallback = createDragHandler(this.columnResizeCallback.bind(this));
        this.rowResizeCallback = createDragHandler(this.rowResizeCallback.bind(this));
        this.columnFitCallback = createCapturingHandler(this.columnFitCallback.bind(this));
    }

    set data(data) {
        this.pendingUpdates.push(() => {
            this.properties.columns = data.columns.map((column, index) => {
                column.index = index;
                if (column.width === undefined) {
                    column.width = this.viewPort.clientWidth / data.columns.length;
                }
                return column;
            });
            this.properties.rows = data.rows.map((row, index) => {
                row.index = index;
                return row;
            });
        })
        this.requestUpdate();
    }

    requestUpdate(force) {
        cancelAnimationFrame(this.requestedAnimationFrame);
        this.requestedAnimationFrame = requestAnimationFrame(() => {
            for (const pendingUpdate of this.pendingUpdates) {
                pendingUpdate();
            }
            const changed = new Map([
                ["columns", this.properties.columns],
                ["rows", this.properties.rows]
            ]);
            for (const [property, value] of changed) {
                if (this[property] === value) changed.delete(property);
            }
            console.log("changed properties:", changed, this.properties);
            this.updated(changed, force);
            this.pendingUpdates.length = 0;
        });
    }

    updated(changed, force) {
        if (changed.has("columns") || changed.has("rows")) {
            const columns = changed.get("columns");
            const rows = changed.get("rows");
            if (this.autosize === "quick") {
                for (const column of columns) {
                    const labelWidth = textWidth(column.label);
                    column.width = labelWidth;
                    for (const row of rows) {
                        column.width += textWidth(row[column.name]);
                    }
                    column.width = Math.max(column.width / (rows.length + 1), labelWidth + 32);
                    column.left = undefined;
                }
            }
            this.filter(columns, rows);
        } else {
            if (force) this.render();
        }
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
        this.render(columns, rows);
    }

    connectedCallback() {

        this.theme(this.getAttribute("theme") || "light");
        this.render(this.columns, this.rows, this.viewPort);

        let refreshViewPort = this.refreshViewPort.bind(this, this.viewPort);
        let pendingRefreshViewport = null;
        this.viewPort.addEventListener("scroll", () => {
            cancelAnimationFrame(pendingRefreshViewport);
            pendingRefreshViewport = requestAnimationFrame(refreshViewPort);
        });

        let pendingResize;
        const resizeObserver = new ResizeObserver(([entry]) => {
            cancelAnimationFrame(pendingResize);
            pendingResize = requestAnimationFrame(() => {
                if (this.viewPort.clientWidth !== this.state.clientWidth) {
                    this.resizeScrollAreaWidth(this.columns);
                }
                if (this.viewPort.clientHeight !== this.state.clientHeight) {
                    this.resizeScrollAreaHeight(this.rows);
                }
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

    render(columns, rows, viewPort = this.state) {

        console.log("render:", columns.length, rows.length, viewPort);
        const {
            scrollLeft,
            scrollTop,
            clientWidth,
            clientHeight
        } = viewPort;

        if (columns !== this.columns) {
            this.resizeScrollAreaWidth(columns);
            const viewPortLeft = scrollLeft - H_SCROLL_BUFFER_PX;
            const viewPortRight = scrollLeft + clientWidth + H_SCROLL_BUFFER_PX;
            this.renderColumnHeaders(columns, viewPortLeft, viewPortRight);
        }
        if (rows !== this.rows) {
            this.resizeScrollAreaHeight(rows);
            const viewPortTop = scrollTop - V_SCROLL_BUFFER_PX;
            const viewPortBottom = scrollTop + clientHeight + V_SCROLL_BUFFER_PX;
            this.renderRowHeaders(rows, viewPortTop, viewPortBottom);
        }
        if (columns !== this.columns || rows !== this.rows) {
            this.renderSheet(columns, rows);
        }

        this.columns = columns;
        this.rows = rows;

        this.updateStyle();

        this.state = {
            scrollLeft,
            scrollTop,
            clientWidth,
            clientHeight
        };

        this.refreshViewPort(viewPort);
    }

    renderColumnHeaders(columns, viewPortLeft, viewPortRight) {
        const [leftIndex, rightIndex] = visibleRange(columns, "left", "width", viewPortLeft, viewPortRight);
        let innerHTML = "";
        for (const column of columns.slice(leftIndex, rightIndex)) {
            innerHTML += createColumnHeaderCell(column);
        }
        this.topHeader.innerHTML = innerHTML;
        this.addEventListeners(columns);
        this.leftIndex = leftIndex;
        this.rightIndex = rightIndex;
    }

    renderRowHeaders(rows, viewPortTop, viewPortBottom) {
        const [topIndex, bottomIndex] = visibleRange(rows, "top", "height", viewPortTop, viewPortBottom);
        let innerHTML = "";
        for (const row of rows.slice(topIndex, bottomIndex)) {
            innerHTML += createRowHeaderCell(row);
        }
        this.leftHeader.innerHTML = innerHTML;
        this.topIndex = topIndex;
        this.bottomIndex = bottomIndex;
    }

    renderSheet(columns, rows) {
        let innerHTML = "";
        const visibleColumns = columns.slice(this.leftIndex, this.rightIndex);
        for (let rowIndex = this.topIndex; rowIndex < this.bottomIndex; ++rowIndex) {
            let row = rows[rowIndex];
            innerHTML += `<div class="row ${rowIndex % 2 ? "odd" : "even"}">`;
            for (const column of visibleColumns) {
                innerHTML += createCell(column, row);
            }
            innerHTML += `</div>`;
        }
        this.sheet.innerHTML = innerHTML;
    }

    resizeScrollAreaWidth(columns) {
        this.headerWidth = this.stub.clientWidth;
        this.viewPort.style.setProperty("--header-width", `${this.headerWidth}px`);
        this.totalWidth = columns.reduce(totalColumnWidth, 0);
        this.scrollArea.style.width = `${this.totalWidth}px`;
    }

    resizeScrollAreaHeight(rows) {
        this.headerHeight = this.stub.clientHeight;
        this.viewPort.style.setProperty("--header-height", `${this.headerHeight}px`);
        const headerPadding = Math.min(8, Math.max(2, 2 + (this.headerHeight - 32) * 6 / 10));
        this.viewPort.style.setProperty("--header-padding", `${headerPadding}px`);
        this.totalHeight = rows.reduce(totalRowHeight, 0);
        this.scrollArea.style.height = `${this.totalHeight}px`;
    }

    scrollTo(x, y) {
        this.viewPort.scrollTo(x, y);
    }

    theme(theme) {
    }

    refreshViewPort(viewPort = this.viewPort) {

        const state = this.state;

        const scrollLeft = viewPort.scrollLeft;
        const scrollTop = viewPort.scrollTop;
        const horizontalScroll = scrollLeft - state.scrollLeft;
        const verticalScroll = scrollTop - state.scrollTop;

        const viewportWidth = viewPort.clientWidth;
        const viewportHeight = viewPort.clientHeight;
        const horizontalResize = viewportWidth - state.clientWidth;
        const verticalResize = viewportHeight - state.clientHeight;

        const visibleLeft = scrollLeft - H_SCROLL_BUFFER_PX;
        const visibleRight = scrollLeft + viewportWidth + H_SCROLL_BUFFER_PX;
        const visibleTop = scrollTop - V_SCROLL_BUFFER_PX;
        const visibleBottom = scrollTop + viewportHeight + V_SCROLL_BUFFER_PX;

        state.scrollLeft = viewPort.scrollLeft;
        state.scrollTop = viewPort.scrollTop;
        state.clientWidth = viewPort.clientWidth;
        state.clientHeight = viewPort.clientHeight;

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
            this.enterLeft(leftIndex, visibleLeft);
        }

        if (horizontalScroll > 0 || horizontalResize > 0) {
            this.enterRight(rightIndex, visibleRight);
        }

        if (verticalScroll < 0) {
            this.enterTop(visibleTop);
        }
        if (verticalScroll > 0 || verticalResize > 0) {
            this.enterBottom(visibleBottom);
        }

        this.addEventListeners();
        this.updateStyle();
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

    enterLeft(leftIndex, visibleLeft) {
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

    enterRight(rightIndex, visibleRight) {
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
    addEventListeners(columns = this.columns) {
        for (const handle of this.shadowRoot.querySelectorAll("#stub .handle")) {
            if (handle.hasAttribute("column")) {
                handle.addEventListener("mousedown", this.headerWidthResizeCallback);
            } else {
                const rowIndex = Number(handle.getAttribute("row"));
                handle.addEventListener("mousedown", this.headerHeightResizeCallback);
            }
        }
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
                const column = columns[columnIndex];
                const cell = handle.parentElement;
                this.columnHeaderCallback(cell, column, columnIndex);
            } else {
                const rowIndex = Number(handle.getAttribute("row"));
                handle.addEventListener("mousedown", this.rowResizeCallback);
            }
        }
    }

    columnHeaderCallback(cell, column, columnIndex) {
    }

    headerWidthResizeCallback({pageX: initialPageX}) {
        const initialWidth = this.headerWidth;
        const cell = this.stub;
        return ({pageX}) => {
            let width = initialWidth + pageX - initialPageX;
            let delta = width - this.headerWidth;
            if (Math.abs(delta) > 3) {
                this.headerWidth = width;
                cell.style.width = `${width}px`;
                this.resizeScrollAreaWidth(this.columns);
                this.updateStyle();
            }
        }
    }

    headerHeightResizeCallback({pageY: initialPageY}) {
        const initialHeight = this.headerHeight;
        const cell = this.stub;
        return ({pageY}) => {
            let height = initialHeight + pageY - initialPageY;
            let delta = height - this.headerHeight;
            if (Math.abs(delta) > 3) {
                this.headerHeight = height;
                cell.style.height = `${height}px`;
                this.resizeScrollAreaHeight(this.rows);
                this.updateStyle();
            }
        }
    }

    columnResizeCallback({pageX: initialPageX}, handle) {

        const columnIndex = Number(handle.getAttribute("column"));
        const column = this.columns[columnIndex];
        const initialWidth = column.width;
        const cell = handle.parentElement;

        return ({pageX}) => {
            let width = initialWidth + pageX - initialPageX;
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
                column.width = width;
                cell.style.width = `${width}px`;
                for (let c = columnIndex + 1; c < this.rightIndex; c++) {
                    this.columns[c].left += delta;
                }
                this.updateStyle();
            }
        }
    }

    rowResizeCallback({pageY: initialPageY}, handle) {
        const rowIndex = Number(handle.getAttribute("row"));
        const row = this.rows[rowIndex];
        const initialHeight = this.headerHeight;
        const cell = handle.parentElement;
        return ({pageY}) => {
            let height = initialHeight + pageY - initialPageY;
            if (row.maxHeight !== undefined) {
                height = Math.min(height, row.maxHeight);
            }
            if (row.minHeight !== undefined) {
                height = Math.max(height, row.minHeight);
            } else {
                height = Math.max(height, 20);
            }
            let delta = height - row.height;
            if (Math.abs(delta) > 3) {
                row.height = height;
                cell.style.height = `${height}px`;
                for (let r = rowIndex + 1; r < this.bottomIndex; r++) {
                    this.rows[r].top += delta;
                }
                this.updateStyle();
            }
        }
    }

    columnFitCallback(event) {
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
        let delta = width - cell.clientWidth - 1;
        if (Math.abs(delta) > 3) {
            column.width = width;
            for (let c = columnIndex + 1; c < this.rightIndex; c++) {
                this.columns[c].left += delta;
            }
            this.updateStyle();
        }

        handle.classList.remove("active");

        sizer.remove();
        this.classList.remove("busy");
    }

    swap(leftIndex, rightIndex) {

        const tx = this.columns[leftIndex].width;

        this.viewPort.querySelectorAll(`.c-${leftIndex}`).forEach(cell => cell.classList.add("hidden"));
        for (let i=leftIndex+1; i<rightIndex; i++) {
            this.viewPort.querySelectorAll(`.c-${i}`).forEach(cell => {
                cell.style.transform = `translate(-${tx}px, 0)`
            });
        }
        return;

        const columns = [
            ...this.columns.slice(0, leftIndex),
            this.columns[rightIndex],
            ...this.columns.slice(leftIndex+1, rightIndex),
            this.columns[leftIndex],
            ...this.columns.slice(rightIndex+1),
        ];
        this.render(columns, this.rows);
    }
}
