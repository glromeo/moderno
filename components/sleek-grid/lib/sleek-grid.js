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

const H_SCROLL_BUFFER_PX = 200;
const V_SCROLL_BUFFER_PX = 150;

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

        let handle = this.stub.firstElementChild.firstElementChild;
        handle.addEventListener("mousedown", createDragHandler(this.headerWidthResizeCallback.bind(this)));
        handle = handle.nextElementSibling;
        handle.addEventListener("mousedown", createDragHandler(this.headerHeightResizeCallback.bind(this)));

        this.properties = {
            rows: [],
            columns: [],
        }; // keeps a copy of the properties set on the custom element

        this.pendingUpdates = [];

        this.rows = [];
        this.columns = [];

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
            this.renderTopHeader(columns, viewPortLeft, viewPortRight);
        }
        if (rows !== this.rows) {
            this.resizeScrollAreaHeight(rows);
            const viewPortTop = scrollTop - V_SCROLL_BUFFER_PX;
            const viewPortBottom = scrollTop + clientHeight + V_SCROLL_BUFFER_PX;
            this.renderLeftHeader(rows, viewPortTop, viewPortBottom);
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

    renderTopHeader(columns, viewPortLeft, viewPortRight) {
        const [leftIndex, rightIndex] = visibleRange(columns, "left", "width", viewPortLeft, viewPortRight);
        let innerHTML = "";
        for (const column of columns.slice(leftIndex, rightIndex)) {
            innerHTML += createColumnHeaderCell(column);
        }
        this.topHeader.innerHTML = innerHTML;
        let headerCell = this.topHeader.firstElementChild, columnIndex = leftIndex;
        while (headerCell) {
            this.configureTopHeaderCell(headerCell, columns[columnIndex], columnIndex++);
            headerCell = headerCell.nextElementSibling;
        }
        this.leftIndex = leftIndex;
        this.rightIndex = rightIndex;
    }

    configureTopHeaderCell(headerCell, column, columnIndex) {
        const handle = headerCell.firstElementChild;
        handle.addEventListener("mousedown", this.columnResizeCallback);
        handle.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
        });
        handle.addEventListener("dblclick", this.columnFitCallback, true);
    }

    renderLeftHeader(rows, viewPortTop, viewPortBottom) {
        const [topIndex, bottomIndex] = visibleRange(rows, "top", "height", viewPortTop, viewPortBottom);
        let innerHTML = "";
        for (const row of rows.slice(topIndex, bottomIndex)) {
            innerHTML += createRowHeaderCell(row);
        }
        this.leftHeader.innerHTML = innerHTML;
        let headerCell = this.leftHeader.firstElementChild, rowIndex = topIndex;
        while (headerCell) {
            this.configureLeftHeaderCell(headerCell, rows[rowIndex], rowIndex++);
            headerCell = headerCell.nextElementSibling;
        }
        this.topIndex = topIndex;
        this.bottomIndex = bottomIndex;
    }

    configureLeftHeaderCell(headerCell, row, rowIndex) {
        const handle = headerCell.lastElementChild;
        handle.addEventListener("mousedown", this.rowResizeCallback);
        return handle;
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

        if (horizontalScroll < 0) {
            this.enterLeft(visibleLeft);
        }

        if (horizontalScroll > 0 || horizontalResize > 0) {
            this.enterRight(visibleRight);
        }

        if (verticalScroll < 0) {
            this.enterTop(visibleTop);
        }
        if (verticalScroll > 0 || verticalResize > 0) {
            this.enterBottom(visibleBottom);
        }

        this.updateStyle();
    }

    leaveTop(visibleTop) {
        const {leftHeader, sheet, rows} = this;
        let row, topIndex = this.topIndex;
        while ((row = rows[topIndex]) && (row.top + row.height < visibleTop)) {
            if (leftHeader.firstElementChild) {
                leftHeader.removeChild(leftHeader.firstElementChild);
                sheet.removeChild(sheet.firstElementChild);
            }
            ++topIndex;
        }
        if (topIndex > this.bottomIndex) {
            this.bottomIndex = topIndex;
        }
        this.topIndex = topIndex;
    }

    leaveBottom(visibleBottom) {
        const {leftHeader, sheet, rows} = this;
        let row, bottomIndex = this.bottomIndex;
        while ((row = rows[--bottomIndex]) && (row.top > visibleBottom)) {
            if (leftHeader.lastElementChild) {
                leftHeader.removeChild(leftHeader.lastElementChild);
                sheet.removeChild(sheet.lastElementChild);
            }
        }
        if (++bottomIndex < this.topIndex) {
            this.topIndex = bottomIndex;
        }
        this.bottomIndex = bottomIndex;
    }

    leaveLeft(visibleLeft) {
        const {topHeader, sheet, columns} = this;
        let column, leftIndex = this.leftIndex;
        while ((column = columns[leftIndex]) && (column.left + column.width < visibleLeft)) {
            if (topHeader.firstElementChild) {
                topHeader.removeChild(topHeader.firstElementChild);
                let rowElement = sheet.firstElementChild;
                while (rowElement) {
                    rowElement.removeChild(rowElement.firstElementChild);
                    rowElement = rowElement.nextElementSibling;
                }
            }
            leftIndex++;
        }
        if (leftIndex > this.rightIndex) {
            this.rightIndex = leftIndex;
        }
        this.leftIndex = leftIndex;
    }

    leaveRight(visibleRight) {
        const {topHeader, columns} = this;
        let column, rightIndex = this.rightIndex;
        while ((column = columns[--rightIndex]) && (column.left > visibleRight)) {
            if (topHeader.lastElementChild) {
                topHeader.removeChild(topHeader.lastElementChild);
                let rowElement = this.sheet.firstElementChild;
                while (rowElement) {
                    rowElement.removeChild(rowElement.lastElementChild);
                    rowElement = rowElement.nextElementSibling;
                }
            }
        }
        if (++rightIndex < this.leftIndex) {
            this.leftIndex = rightIndex;
        }
        this.rightIndex = rightIndex;
    }

    enterTop(visibleTop) {
        const {rows, columns, leftIndex, rightIndex, leftHeader, sheet} = this;
        let row, topIndex = this.topIndex;
        let headerHTML = "", rowsHTML = "";
        while ((row = rows[--topIndex]) && (row.top + row.height >= visibleTop)) {
            let rowHTML = "";
            for (let columnIndex = leftIndex; columnIndex < rightIndex; columnIndex++) {
                rowHTML += createCell(columns[columnIndex], row);
            }
            rowsHTML = `<div row="${topIndex}" class="row ${topIndex % 2 ? "odd" : "even"}">${rowHTML}</div>` + rowsHTML;
            headerHTML = createRowHeaderCell(rows[topIndex]) + headerHTML;
        }
        if (++topIndex < this.topIndex) {
            sheet.insertAdjacentHTML("afterbegin", rowsHTML);
            leftHeader.insertAdjacentHTML("afterbegin", headerHTML);
            let headerCell = leftHeader.firstElementChild;
            let rowIndex = topIndex;
            do {
                this.configureLeftHeaderCell(headerCell, rows[rowIndex], rowIndex);
                headerCell = headerCell.nextElementSibling;
            } while (++rowIndex < this.topIndex);
            this.topIndex = topIndex;
        }
    }

    enterBottom(visibleBottom) {
        const {rows, columns, leftIndex, rightIndex, leftHeader, sheet} = this;
        let row, bottomIndex = this.bottomIndex;
        let headerHTML = "", rowsHTML = "";
        while ((row = rows[bottomIndex]) && (row.top < visibleBottom)) {
            let rowHTML = "";
            for (let columnIndex = leftIndex; columnIndex < rightIndex; columnIndex++) {
                rowHTML += createCell(columns[columnIndex], row);
            }
            rowsHTML += `<div row="${bottomIndex}" class="row ${bottomIndex % 2 ? "odd" : "even"}">${rowHTML}</div>`;
            headerHTML += createRowHeaderCell(rows[bottomIndex]);
            ++bottomIndex;
        }
        if (bottomIndex > this.bottomIndex) {
            sheet.insertAdjacentHTML("beforeend", rowsHTML);
            leftHeader.insertAdjacentHTML("beforeend", headerHTML);
            let headerCell = leftHeader.lastElementChild;
            let rowIndex = bottomIndex - 1;
            do {
                this.configureLeftHeaderCell(headerCell, rows[rowIndex], rowIndex);
                headerCell = headerCell.previousElementSibling;
            } while (rowIndex-- > this.bottomIndex)
            this.bottomIndex = bottomIndex;
        }
    }

    enterLeft(visibleLeft) {
        const {columns, rows, topIndex, bottomIndex, topHeader, sheet} = this;
        let column, leftIndex = this.leftIndex;
        let headerHTML = "";
        while ((column = columns[--leftIndex]) && (column.left + column.width) >= visibleLeft) {
            headerHTML = createColumnHeaderCell(column) + headerHTML;
        }
        let rightIndex = this.leftIndex;
        if (++leftIndex < rightIndex) {
            let rowElement = sheet.firstElementChild;
            for (let rowIndex = topIndex; rowElement && rowIndex < bottomIndex; rowIndex++) {
                let rowHTML = "", columnIndex = leftIndex;
                while (columnIndex < rightIndex) {
                    rowHTML += createCell(columns[columnIndex++], rows[rowIndex]);
                }
                rowElement.insertAdjacentHTML("afterbegin", rowHTML);
                rowElement = rowElement.nextElementSibling;
            }
            topHeader.insertAdjacentHTML("afterbegin", headerHTML);
            let headerCell = topHeader.firstElementChild;
            for (let columnIndex = leftIndex; columnIndex < rightIndex; ++columnIndex) {
                this.configureTopHeaderCell(headerCell, columns[columnIndex], columnIndex);
                headerCell = headerCell.nextElementSibling;
            }
            this.leftIndex = leftIndex;
        }
    }

    enterRight(visibleRight) {
        const {columns, rows, topIndex, bottomIndex, topHeader, sheet} = this;
        let column, rightIndex = this.rightIndex;
        let headerHTML = "";
        while ((column = columns[rightIndex]) && column.left <= visibleRight) {
            headerHTML += createColumnHeaderCell(column);
            ++rightIndex;
        }
        let leftIndex = this.rightIndex;
        if (leftIndex < rightIndex) {
            let rowElement = sheet.firstElementChild;
            for (let rowIndex = topIndex; rowElement && rowIndex < bottomIndex; rowIndex++) {
                let rowHTML = "", columnIndex = leftIndex;
                while (columnIndex < rightIndex) {
                    rowHTML += createCell(columns[columnIndex++], rows[rowIndex]);
                }
                rowElement.insertAdjacentHTML("beforeend", rowHTML);
                rowElement = rowElement.nextElementSibling;
            }
            topHeader.insertAdjacentHTML("beforeend", headerHTML);
            let headerCell = topHeader.lastElementChild;
            for (let columnIndex = rightIndex-1; columnIndex >= leftIndex; --columnIndex) {
                this.configureTopHeaderCell(headerCell, columns[columnIndex], columnIndex);
                headerCell = headerCell.previousElementSibling;
            }
            this.rightIndex = rightIndex;
        }
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
        for (let i = leftIndex + 1; i < rightIndex; i++) {
            this.viewPort.querySelectorAll(`.c-${i}`).forEach(cell => {
                cell.style.transform = `translate(-${tx}px, 0)`
            });
        }
        return;

        const columns = [
            ...this.columns.slice(0, leftIndex),
            this.columns[rightIndex],
            ...this.columns.slice(leftIndex + 1, rightIndex),
            this.columns[leftIndex],
            ...this.columns.slice(rightIndex + 1),
        ];
        this.render(columns, this.rows);
    }
}
