import {renderDynamicStyle} from "./styles/dynamic.js";
import {sleekStyle} from "./styles/sleek.js";
import {staticStyle} from "./styles/static.js";
import {
    cloneGridTemplate,
    createCell,
    createLeftHeaderCell,
    createRow,
    createTopHeaderCell, leftHeaderCache, rowCache, sheetCellCache,
    topHeaderCache
} from "./templates/grid.js";
import {createCapturingHandler, createDragHandler, escapeRegex, stripeAt, textWidth, visibleRange} from "./utility.js";

const H_SCROLL_BUFFER_PX = 300;
const V_SCROLL_BUFFER_PX = 100;

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

        this.fragment = document.createDocumentFragment();
        this.headerFragment = document.createDocumentFragment();

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

        this.state = {}

        this.pendingUpdates = [];

        this.rows = [];
        this.columns = [];

        this.columnResizeCallback = createDragHandler(this.columnResizeCallback.bind(this));
        this.rowResizeCallback = createDragHandler(this.rowResizeCallback.bind(this));
        this.columnFitCallback = createCapturingHandler(this.columnFitCallback.bind(this));

        this.createLeftHeaderCell = row => {
            const cell = createLeftHeaderCell(row);
            this.configureLeftHeaderCell(cell, row);
            return cell;
        };

        this.createTopHeaderCell = column => {
            const cell = createTopHeaderCell(column);
            this.configureTopHeaderCell(cell, column);
            return cell;
        }
    }

    set data(data) {
        this.pendingUpdates.push(() => {
            this.properties.columns = data.columns.map((column, index) => {
                return {
                    ...column,
                    index,
                    width: column.width ?? this.viewPort.clientWidth / data.columns.length
                };
            });
            this.properties.rows = data.rows.map((row, index) => {
                row.index = index;
                return row;
            });
        })
        this.requestUpdate();
    }

    connectedCallback() {

        this.updateHeaderDimensions();

        this.theme(this.getAttribute("theme") || "light");
        this.render(this.columns, this.rows);

        let viewPortScrollListener = () => {
            cancelAnimationFrame(this.pendingRefresh);
            this.pendingRefresh = requestAnimationFrame(() => {
                this.viewPortScrollCallback();
            });
        };
        this.viewPort.addEventListener("scroll", viewPortScrollListener);

        const resizeObserver = new ResizeObserver(([entry]) => {
            cancelAnimationFrame(this.pendingResize);
            this.pendingResize = requestAnimationFrame(() => {
                this.viewPortResizeCallback();
            });
        });
        resizeObserver.observe(this.viewPort);

        this.disconnectedCallback = () => {
            this.viewPort.removeEventListener("scroll", viewPortScrollListener);
            resizeObserver.unobserve(this.viewPort);
            this.disconnectedCallback = undefined;
        };
    }

    requestUpdate(force) {
        cancelAnimationFrame(this.pendingUpdate);
        this.pendingUpdate = requestAnimationFrame(() => {
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

    render(columns, rows) {

        console.log("render:", columns.length, rows.length, this.viewPort);
        const {
            scrollLeft,
            scrollTop,
            clientWidth,
            clientHeight
        } = this.viewPort;

        if (columns !== this.columns) {
            this.updateTotalWidth(columns);
            const viewPortLeft = Math.max(0, scrollLeft - H_SCROLL_BUFFER_PX);
            const viewPortRight = Math.min(scrollLeft + clientWidth + H_SCROLL_BUFFER_PX);
            this.renderTopHeader(columns, viewPortLeft, viewPortRight);
        }
        if (rows !== this.rows) {
            this.updateTotalHeight(rows);
            const viewPortTop = scrollTop - V_SCROLL_BUFFER_PX;
            const viewPortBottom = scrollTop + clientHeight + V_SCROLL_BUFFER_PX;
            this.renderLeftHeader(rows, viewPortTop, viewPortBottom);
        }
        if (columns !== this.columns || rows !== this.rows) {
            this.renderSheet(columns, rows);
        }

        this.columns = columns;
        this.rows = rows;

        this.state.viewPort = {
            scrollLeft,
            scrollTop,
            clientWidth,
            clientHeight
        };

        this.updateStyle();
    }

    renderTopHeader(columns, viewPortLeft, viewPortRight) {
        const [leftIndex, rightIndex] = visibleRange(columns, "left", "width", viewPortLeft, viewPortRight);
        this.topHeader.replaceChildren(...columns
            .slice(leftIndex, rightIndex)
            .map(this.createTopHeaderCell)
        );
        this.leftIndex = leftIndex;
        this.rightIndex = rightIndex;
    }

    configureTopHeaderCell(cell, column) {
        if (!cell.column) {
            const handle = cell.firstElementChild;
            handle.addEventListener("mousedown", this.columnResizeCallback);
            handle.addEventListener("click", (event) => {
                event.preventDefault();
                event.stopPropagation();
            });
            handle.addEventListener("dblclick", this.columnFitCallback, true);
        }
        cell.column = column;
    }

    renderLeftHeader(rows, viewPortTop, viewPortBottom) {
        const [topIndex, bottomIndex] = visibleRange(rows, "top", "height", viewPortTop, viewPortBottom);
        this.leftHeader.replaceChildren(...rows
            .slice(topIndex, bottomIndex)
            .map(this.createLeftHeaderCell)
        );
        this.topIndex = topIndex;
        this.bottomIndex = bottomIndex;
    }

    configureLeftHeaderCell(cell, row) {
        if (!cell.row) {
            const handle = cell.lastElementChild;
            handle.addEventListener("mousedown", this.rowResizeCallback);
        }
        cell.row = row;
    }

    renderSheet(columns, rows) {
        for (let rowIndex = this.topIndex; rowIndex < this.bottomIndex; ++rowIndex) {
            this.fragment.appendChild(createRow(rows, rowIndex, columns, this.leftIndex, this.rightIndex));
        }
        this.sheet.replaceChildren(this.fragment);
    }

    updateTotalWidth(columns) {
        this.totalWidth = 0;
        for (const column of columns) {
            column.left = this.totalWidth;
            this.totalWidth += column.width;
        }
    }

    updateTotalHeight(rows) {
        this.totalHeight = 0;
        for (const row of rows) {
            row.top = this.totalHeight;
            this.totalHeight += row.height;
        }
    }

    updateHeaderDimensions() {
        this.headerWidth = this.stub.clientWidth;
        this.headerHeight = this.stub.clientHeight;
    }

    scrollTo(x, y) {
        this.viewPort.scrollTo(x, y);
    }

    theme(theme) {
    }

    viewPortScrollCallback() {
        const {clientHeight, clientWidth, scrollLeft, scrollTop} = this.viewPort;
        const snapshot = this.state.viewPort;

        const horizontalScroll = scrollLeft - snapshot.scrollLeft;
        const verticalScroll = scrollTop - snapshot.scrollTop;

        const horizontalResize = clientWidth - snapshot.clientWidth;
        const verticalResize = clientHeight - snapshot.clientHeight;

        const visibleLeft = scrollLeft - H_SCROLL_BUFFER_PX;
        const visibleRight = scrollLeft + clientWidth + H_SCROLL_BUFFER_PX;
        const visibleTop = scrollTop - V_SCROLL_BUFFER_PX;
        const visibleBottom = scrollTop + clientHeight + V_SCROLL_BUFFER_PX;

        snapshot.scrollLeft = scrollLeft;
        snapshot.scrollTop = scrollTop;
        snapshot.clientWidth = clientWidth;
        snapshot.clientHeight = clientHeight;

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

    viewPortResizeCallback() {

        const snapshot = this.state.viewPort;
        const clientWidth = this.viewPort.clientWidth;
        const clientHeight = this.viewPort.clientHeight;
        const horizontalResize = clientWidth - snapshot.clientWidth;
        const verticalResize = clientHeight - snapshot.clientHeight;

        if (horizontalResize) {
            const visibleRight = snapshot.scrollLeft + clientWidth + H_SCROLL_BUFFER_PX;
            if (horizontalResize < 0) {
                this.leaveRight(visibleRight);
            } else {
                this.enterRight(visibleRight);
            }
            snapshot.clientWidth = clientWidth;
        }

        if (verticalResize) {
            const visibleBottom = snapshot.scrollTop + clientHeight + V_SCROLL_BUFFER_PX;
            if (verticalResize < 0) {
                this.leaveBottom(visibleBottom);
            } else {
                this.enterBottom(visibleBottom);
            }
            snapshot.clientHeight = clientHeight;
        }

        this.updateStyle();
    }

    leaveTop(visibleTop) {
        const {leftHeader, sheet, rows} = this;
        let row, topIndex = this.topIndex;
        while ((row = rows[topIndex]) && (row.top + row.height < visibleTop)) {
            if (leftHeader.firstElementChild) {
                leftHeaderCache.push(leftHeader.removeChild(leftHeader.firstElementChild));
                rowCache.push(sheet.removeChild(sheet.firstElementChild));
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
                leftHeaderCache.push(leftHeader.removeChild(leftHeader.lastElementChild));
                rowCache.push(sheet.removeChild(sheet.lastElementChild));
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
                topHeaderCache.push(topHeader.removeChild(topHeader.firstElementChild));
                let rowElement = sheet.firstElementChild;
                while (rowElement) {
                    sheetCellCache.push(rowElement.removeChild(rowElement.firstElementChild));
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
                topHeaderCache.push(topHeader.removeChild(topHeader.lastElementChild));
                let rowElement = this.sheet.firstElementChild;
                while (rowElement) {
                    sheetCellCache.push(rowElement.removeChild(rowElement.lastElementChild));
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
        while ((row = rows[--topIndex]) && (row.top + row.height >= visibleTop)) {
            sheet.prepend(createRow(rows, topIndex, columns, leftIndex, rightIndex));
            leftHeader.prepend(this.createLeftHeaderCell(rows[topIndex]));
        }
        this.topIndex = ++topIndex;
    }

    enterBottom(visibleBottom) {
        const {rows, columns, leftIndex, rightIndex, leftHeader, sheet} = this;
        let row, bottomIndex = this.bottomIndex;
        while ((row = rows[bottomIndex]) && (row.top < visibleBottom)) {
            sheet.append(createRow(rows, bottomIndex, columns, leftIndex, rightIndex));
            leftHeader.append(this.createLeftHeaderCell(rows[bottomIndex]));
            ++bottomIndex;
        }
        this.bottomIndex = bottomIndex;
    }

    enterLeft(visibleLeft) {
        const {columns, rows, topIndex, bottomIndex, topHeader, sheet} = this;
        let column, leftIndex = this.leftIndex;
        while ((column = columns[--leftIndex]) && (column.left + column.width) >= visibleLeft) {
            topHeader.prepend(this.createTopHeaderCell(column));
            let rowElement = sheet.firstElementChild;
            for (let rowIndex = topIndex; rowElement && rowIndex < bottomIndex; rowIndex++) {
                rowElement.prepend(createCell(column, rows[rowIndex], stripeAt(rowIndex)));
                rowElement = rowElement.nextElementSibling;
            }
        }
        this.leftIndex = ++leftIndex;
    }

    enterRight(visibleRight) {
        const {columns, rows, topIndex, bottomIndex, topHeader, sheet} = this;
        let column, rightIndex = this.rightIndex;
        while ((column = columns[rightIndex]) && column.left <= visibleRight) {
            topHeader.append(this.createTopHeaderCell(column));
            let rowElement = sheet.firstElementChild;
            for (let rowIndex = topIndex; rowElement && rowIndex < bottomIndex; rowIndex++) {
                rowElement.append(createCell(column, rows[rowIndex], stripeAt(rowIndex)));
                rowElement = rowElement.nextElementSibling;
            }
            ++rightIndex;
        }
        this.rightIndex = rightIndex;
    }

    headerWidthResizeCallback({pageX: initialPageX}) {
        const initialWidth = this.headerWidth;
        const cell = this.stub;
        return ({pageX}) => {
            let width = initialWidth + pageX - initialPageX;
            let delta = width - this.headerWidth;
            if (Math.abs(delta) > 3) {
                cell.style.width = `${width}px`;
                this.updateHeaderDimensions();
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
                cell.style.height = `${height}px`;
                this.updateHeaderDimensions();
                this.updateStyle();
            }
        }
    }

    columnResizeCallback({pageX: initialPageX}, handle) {

        const cell = handle.parentElement;
        const column = cell.column;
        const initialWidth = column.width;

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
                let next = cell;
                while ((next = next.nextElementSibling)) {
                    next.column.left += delta;
                }
                this.updateStyle();
            }
        }
    }

    rowResizeCallback({pageY: initialPageY}, handle) {
        const cell = handle.parentElement;
        const row = cell.row;
        const initialHeight = this.headerHeight;
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
                let next = cell;
                while ((next = next.nextElementSibling)) {
                    next.row.top += delta;
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

        const cell = handle.parentElement;
        const column = cell.column;

        let width = 0;
        for (const row of this.rows) {
            textSizer.innerText = row[column.name];
            width = Math.max(width, sizer.clientWidth);
        }
        let delta = width - cell.clientWidth - 1;
        if (Math.abs(delta) > 3) {
            column.width = width;
            let next = cell;
            while ((next = next.nextElementSibling)) {
                next.column.left += delta;
            }
            this.updateStyle();
        }

        handle.classList.remove("active");

        sizer.remove();
        this.classList.remove("busy");
    }

    swap(leftIndex, rightIndex) {

        const tx = this.columns[leftIndex].width;
        this.columns[leftIndex].hidden = true;

        const columnNodes = this.viewPort.querySelectorAll(`.c-${leftIndex}`);
        columnNodes.forEach(cell => cell.classList.add("hidden"));
        for (let i = leftIndex + 1; i < this.columns.length; i++) {
            this.viewPort.querySelectorAll(`.c-${i}`).forEach(cell => {
                cell.style.transform = `translate(-${tx}px, 0)`
            });
        }

        const nextSiblingCell = columnNodes.item(1).nextElementSibling;
        nextSiblingCell.addEventListener("transitionend", () => {
            this.columns.splice(leftIndex, 1);
            this.updateTotalWidth(this.columns);
            this.viewPortScrollCallback();
            this.updateStyle();
        });

        return () => {
            columnNodes.forEach(cell => cell.classList.remove("hidden"));
            for (let i = leftIndex + 1; i < this.columns.length; i++) {
                this.viewPort.querySelectorAll(`.c-${i}`).forEach(cell => {
                    cell.style.transform = null;
                });
            }
            nextSiblingCell.addEventListener("transitionend", () => {
                this.columns.splice(leftIndex, 1);
                this.updateTotalWidth(this.columns);
                this.viewPortScrollCallback();
                this.updateStyle();
            });
        }
    }

    deleteColumn(columnIndex) {
        const {index, width: horizontalShift} = this.columns[columnIndex];

        const nodeColumn = this.viewPort.querySelectorAll(`.c-${index}`);

        this.enterRight(this.viewPort.scrollLeft + this.viewPort.clientWidth + H_SCROLL_BUFFER_PX + horizontalShift);

        nodeColumn.forEach(cell => {
            cell.classList.add("hidden");
            while ((cell = cell.nextElementSibling)) {
                cell.classList.add("translated");
                cell.style.transform = `translate(-${horizontalShift}px, 0)`;
            }
        });

        setTimeout(() => {
            this.columns.splice(columnIndex, 1);
            this.rightIndex--;
            this.updateTotalWidth(this.columns);
            this.updateStyle();
            nodeColumn.forEach(cell => {
                let sibling = cell.nextElementSibling;
                while (sibling) {
                    sibling.classList.remove("translated");
                    sibling.style.transform = null;
                    sibling = sibling.nextElementSibling
                }
            });
        }, 500); // keep this in synch with the transition!
    }

    detachColumn(columnIndex) {
        const {index, width: horizontalShift} = this.columns[columnIndex];
        const nodeColumn = this.viewPort.querySelectorAll(`.c-${index}`);

        let slice = cloneVerticalSliceTemplate();
        slice.firstElementChild.lastElementChild.lastElementChild.replaceChildren(...nodeColumn);
        slice.firstElementChild.lastElementChild.firstElementChild.append(nodeColumn[0]);
        this.shadowRoot.appendChild(slice);
    }

    insertColumn(index, column = this.properties.columns[index]) {
        let headerSiblingCell = this.topHeader.querySelector(`.c-${index + 1}`);

        for (let i = this.columns.length - 1; i >= index; i--) {
            this.viewPort.querySelectorAll(`.c-${i}`).forEach(cell => {
                cell.classList.remove(`c-${i}`);
                cell.classList.add(`c-${i + 1}`);
            });
        }

        this.columns.splice(index, 0, {...column});

        this.columns.forEach((column, index) => column.index = index);

        let innerHTML = createTopHeaderCell(column);
        this.rows.slice(this.topIndex, this.bottomIndex).forEach((row, index) => {
            innerHTML += createCell(column, row, stripeAt(this.topIndex + index));
        });
        let template = document.createElement("div");
        template.innerHTML = innerHTML;
        if (headerSiblingCell) {
            this.topHeader.insertBefore(template.firstElementChild, headerSiblingCell);
            this.sheet.querySelectorAll(`.c-${index + 1}`).forEach(cell => {
                cell.parentElement.insertBefore(template.firstElementChild, cell);
            });
        } else {
            this.topHeader.appendChild(template.firstElementChild);
            this.sheet.querySelectorAll(`.row`).forEach(row => {
                row.appendChild(template.firstElementChild);
            });
        }
        this.updateTotalWidth(this.columns);
        this.viewPortScrollCallback();
        this.updateStyle();
    }

}
