import {autosizeColumns, autosizeRows, importColumns, importRows} from "./features/autosizing.mjs";
import {sleekStyle} from "./styles/sleek.js";
import {staticStyle} from "./styles/static.js";
import {cloneCell, cloneGridTemplate, cloneLeftHeaderCell, cloneRow, cloneTopHeaderCell} from "./templates.js";
import {
    applyFilter,
    applySort,
    createFilter,
    findColumnIndex,
    findRowIndex,
    totalHeight,
    totalWidth
} from "./utility.mjs";

const HZ_OVERFLOW = 3 * 150;
const VT_OVERFLOW = 3 * 32;

let gridId = 0;

export const _ROW_ = Symbol();
export const _ROW_HEADER_ = Symbol();

export class SleekGrid extends HTMLElement {

    constructor() {
        super();

        this.setAttribute("grid-id", gridId);

        const gridStyle = new CSSStyleSheet();
        this.gridStyle = gridStyle;

        this.attachShadow({mode: "open"}).adoptedStyleSheets = [
            staticStyle,
            sleekStyle,
            gridStyle
        ];

        this.shadowRoot.appendChild(cloneGridTemplate());

        this.stub = this.shadowRoot.getElementById("stub");
        this.viewPort = this.shadowRoot.getElementById("view-port");
        this.scrollArea = this.shadowRoot.getElementById("scroll-area");
        this.topHeader = this.shadowRoot.getElementById("top-header");
        this.leftHeader = this.shadowRoot.getElementById("left-header");
        this.sheet = this.shadowRoot.getElementById("sheet");

        this.pendingUpdate = undefined;

        this.autosize = "quick";
        this.rows = [];
        this.columns = [];

        this.properties = {
            rows: [],
            columns: []
        };

        this.refresh = requestAnimationFrame.bind(window, this.refresh.bind(this));
        this.resizeObserver = new ResizeObserver(this.refresh);

        this.sheetWidth = this.scrollArea.clientWidth;
        this.sheetHeight = this.scrollArea.clientHeight;

        this.features();
    }

    features() {
        this?.theming();
        this?.resizing();
        this?.dragndrop();
    }

    // =========================================================================================================
    // PROPERTIES
    // =========================================================================================================

    requestUpdate(changes) {
        if (!this.pendingUpdate) {
            this.pendingUpdate = Object.create(null);
            setTimeout(() => {
                this.update(this.pendingUpdate);
                this.pendingUpdate = undefined;
            }, 0);
        }
        Object.assign(this.pendingUpdate, changes);
    }

    update(changed = this.properties) {
        Object.assign(this.properties, changed);
        const properties = Object.assign(Object.create(this.properties), changed);
        this.filter(properties);
        this.sort(properties);
        this.resize(properties);
        this.render(properties);
    }

    set data({columns, rows}) {
        this.requestUpdate({columns, rows});
    }

    // =========================================================================================================
    // MOUNT/UNMOUNT
    // =========================================================================================================

    connectedCallback() {
        this.update();
        this.resizeObserver.observe(this.viewPort);
        this.viewPort.addEventListener("scroll", this.refresh, {passive: true});
    }

    disconnectedCallback() {
        this.resizeObserver.disconnect();
        this.viewPort.removeEventListener("scroll", this.refresh, {passive: true});
    }

    // =========================================================================================================
    // RENDERING
    // =========================================================================================================

    filter(properties) {

        let filter = createFilter(this.getAttribute("grid-id"), properties.columns, properties.external);

        properties.rows = applyFilter(filter, properties.rows);

        if (filter && properties.rows.length === 0) {
            properties.rows = [properties.columns.reduce(function (row, column) {
                if (column.search) {
                    row[column.name] = "NO MATCH";
                }
                return row;
            }, {})];
        }
    }

    sort(properties) {
        properties.rows = applySort(properties.columns, properties.rows);
    }

    resize(properties) {

        if (properties.hasOwnProperty("columns")) {
            properties.columns = importColumns(properties.columns, autosizeColumns({
                mode: this.autosize,
                columns: properties.columns,
                rows: properties.rows ?? this.rows,
                viewPort: this.viewPort.getBoundingClientRect()
            }));

            this.sheetWidth = totalWidth(properties.columns);
            if (this.sheetWidth) {
                this.style.setProperty("--sheet-width", `${this.sheetWidth}px`);
            } else {
                this.style.setProperty("--sheet-width", "auto");
                this.sheetWidth = this.scrollArea.clientWidth;
            }
        }

        if (properties.hasOwnProperty("rows")) {
            properties.rows = importRows(properties.rows, autosizeRows({
                mode: this.autosize,
                columns: properties.columns ?? this.columns,
                rows: properties.rows,
                viewPort: this.viewPort.getBoundingClientRect()
            }));

            this.sheetHeight = totalHeight(properties.rows);
            if (this.sheetHeight) {
                this.style.setProperty("--sheet-height", `${this.sheetHeight}px`);
            } else {
                this.style.setProperty("--sheet-height", "auto");
                this.sheetHeight = this.scrollArea.clientHeight;
            }
        }

        Object.assign(properties, this.range(properties));
    }

    range({columns = this.columns, rows = this.rows} = this) {
        const left = Math.max(0, this.viewPort.scrollLeft - HZ_OVERFLOW);
        const top = Math.max(0, this.viewPort.scrollTop - VT_OVERFLOW);
        const right = Math.min(this.sheetWidth, this.viewPort.scrollLeft + this.viewPort.clientWidth + HZ_OVERFLOW);
        const bottom = Math.min(this.sheetHeight, this.viewPort.scrollTop + this.viewPort.clientHeight + VT_OVERFLOW);
        return {
            topIndex: findRowIndex(rows, top),
            bottomIndex: rows.length ? 1 + findRowIndex(rows, bottom - 1) : 0,
            leftIndex: findColumnIndex(columns, left),
            rightIndex: columns.length ? 1 + findColumnIndex(columns, right - 1) : 0
        };
    }

    replaceGridStyle(style = "") {
        const {columns, rows, topIndex, bottomIndex, leftIndex, rightIndex} = this;

        for (let columnIndex = leftIndex; columnIndex < rightIndex; ++columnIndex) {
            const {left, width} = columns[columnIndex];
            style += `.c-${columnIndex}{left:${left}px;width:${width}px}\n`;
        }
        for (let rowIndex = topIndex; rowIndex < bottomIndex; ++rowIndex) {
            const {top, height} = rows[rowIndex];
            style += `.r-${rowIndex}{transform:translateY(${top}px);height:${height}px}\n`;
        }
        this.gridStyle.replace(style);
    }

    render(properties) {

        const recycle = new Map();
        for (let rowIndex = this.topIndex; rowIndex < this.bottomIndex; ++rowIndex) {
            const lastRow = this.rows[rowIndex];
            recycle.set(lastRow.index ?? rowIndex, lastRow);
        }

        Object.assign(this, properties);

        this.replaceGridStyle();

        let columnIndex = this.leftIndex;
        let topHeaderCell = this.topHeader.firstChild;
        while (columnIndex < this.rightIndex && topHeaderCell) {
            this.useTopHeaderCell(columnIndex++, topHeaderCell);
            topHeaderCell = topHeaderCell.nextSibling;
        }
        if (topHeaderCell) do {
        } while (topHeaderCell !== this.topHeader.removeChild(this.topHeader.lastChild));
        while (columnIndex < this.rightIndex) {
            this.topHeader.appendChild(this.useTopHeaderCell(columnIndex++, topHeaderCell));
        }

        for (let rowIndex = this.topIndex; rowIndex < this.bottomIndex; ++rowIndex) {
            const row = this.rows[rowIndex];
            const key = row.rowIndex ?? rowIndex;
            const recycled = recycle.get(key);
            if (recycled) {
                recycle.delete(key);
                row[_ROW_HEADER_] = this.useLeftHeaderCell(rowIndex, recycled[_ROW_HEADER_]);
                row[_ROW_] = this.useRow(rowIndex, this.leftIndex, this.rightIndex, recycled[_ROW_]);
            } else {
                row[_ROW_HEADER_] = this.leftHeader.appendChild(this.useLeftHeaderCell(rowIndex));
                row[_ROW_] = this.sheet.appendChild(this.useRow(rowIndex, this.leftIndex, this.rightIndex));
            }
        }

        for (const lastRow of recycle.values()) {
            lastRow[_ROW_HEADER_].remove();
            lastRow[_ROW_].remove();
        }
    }

    scrollTo(x, y) {
        this.viewPort.scrollTo(x, y);
    }

    refresh() {
        const {topIndex, bottomIndex, leftIndex, rightIndex} = this.range();
        let enterIndexStart, enterIndexEnd, leaveIndexStart, leaveIndexEnd;

        if (topIndex < this.topIndex || bottomIndex < this.bottomIndex) {
            enterIndexStart = topIndex;
            enterIndexEnd = Math.min(bottomIndex, this.topIndex);
            leaveIndexStart = Math.max(bottomIndex, this.topIndex);
            leaveIndexEnd = this.bottomIndex;
            this.refreshRows(enterIndexStart, enterIndexEnd, leaveIndexStart, leaveIndexEnd, leftIndex, rightIndex);
        }

        if (bottomIndex > this.bottomIndex || topIndex > this.topIndex) {
            enterIndexStart = Math.max(topIndex, this.bottomIndex);
            enterIndexEnd = bottomIndex;
            leaveIndexStart = this.topIndex;
            leaveIndexEnd = Math.min(topIndex, this.bottomIndex);
            this.refreshRows(enterIndexStart, enterIndexEnd, leaveIndexStart, leaveIndexEnd, leftIndex, rightIndex);
        }

        if (leftIndex < this.leftIndex || rightIndex < this.rightIndex) {
            enterIndexStart = leftIndex;
            enterIndexEnd = Math.min(this.leftIndex, rightIndex);
            leaveIndexStart = Math.max(this.leftIndex, rightIndex);
            leaveIndexEnd = this.rightIndex;
            this.goLeft(enterIndexStart, enterIndexEnd, leaveIndexStart, leaveIndexEnd, topIndex, bottomIndex);
        }

        if (rightIndex > this.rightIndex || leftIndex > this.leftIndex) {
            enterIndexStart = Math.max(this.rightIndex, leftIndex);
            enterIndexEnd = rightIndex;
            leaveIndexStart = this.leftIndex;
            leaveIndexEnd = Math.min(this.rightIndex, leftIndex);
            this.goRight(enterIndexStart, enterIndexEnd, leaveIndexStart, leaveIndexEnd, topIndex, bottomIndex);
        }

        Object.assign(this, {topIndex, bottomIndex, leftIndex, rightIndex});
        this.replaceGridStyle();
    }

    refreshRows(enterIndexStart, enterIndexEnd, leaveIndexStart, leaveIndexEnd, leftIndex, rightIndex) {
        const {rows} = this;
        let leaveIndex = leaveIndexStart;
        let enterIndex = enterIndexStart;
        while (enterIndex < enterIndexEnd && leaveIndex < leaveIndexEnd) {
            rows[enterIndex][_ROW_HEADER_] = this.useLeftHeaderCell(enterIndex, rows[leaveIndex][_ROW_HEADER_]);
            rows[enterIndex][_ROW_] = this.useRow(enterIndex, leftIndex, rightIndex, rows[leaveIndex][_ROW_]);
            rows[leaveIndex][_ROW_HEADER_] = undefined;
            rows[leaveIndex][_ROW_] = undefined;
            ++enterIndex;
            ++leaveIndex;
        }
        while (leaveIndex < leaveIndexEnd) {
            rows[leaveIndex][_ROW_HEADER_].remove();
            rows[leaveIndex][_ROW_].remove();
            rows[leaveIndex][_ROW_HEADER_] = undefined;
            rows[leaveIndex][_ROW_] = undefined;
            ++leaveIndex;
        }
        while (enterIndex < enterIndexEnd) {
            rows[enterIndex][_ROW_HEADER_] = this.leftHeader.appendChild(this.useLeftHeaderCell(enterIndex));
            rows[enterIndex][_ROW_] = this.sheet.appendChild(this.useRow(enterIndex, leftIndex, rightIndex));
            ++enterIndex;
        }
    }

    goRight(enterIndexStart, enterIndexEnd, leaveIndexStart, leaveIndexEnd, topIndex, bottomIndex) {
        const {topHeader, rows} = this;
        let enterIndex = enterIndexStart;
        let leaveIndex = leaveIndexStart;
        while (enterIndex < enterIndexEnd && leaveIndex++ < leaveIndexEnd) {
            topHeader.appendChild(this.useTopHeaderCell(enterIndex++, topHeader.firstChild));
        }
        while (leaveIndex++ < leaveIndexEnd) {
            topHeader.firstChild.remove();
        }
        while (enterIndex < enterIndexEnd) {
            topHeader.appendChild(this.useTopHeaderCell(enterIndex++));
        }
        for (let rowIndex = topIndex, rowElement; rowIndex < bottomIndex; ++rowIndex) {
            rowElement = rows[rowIndex][_ROW_];
            enterIndex = enterIndexStart;
            leaveIndex = leaveIndexStart;
            while (enterIndex < enterIndexEnd && leaveIndex++ < leaveIndexEnd) {
                rowElement.appendChild(this.useCell(enterIndex++, rowIndex, rowElement.firstChild));
            }
            while (leaveIndex++ < leaveIndexEnd) {
                rowElement.firstChild.remove();
            }
            while (enterIndex < enterIndexEnd) {
                rowElement.appendChild(this.useCell(enterIndex++, rowIndex));
            }
        }
    }

    goLeft(enterIndexStart, enterIndexEnd, leaveIndexStart, leaveIndexEnd, topIndex, bottomIndex) {
        const {topHeader, rows} = this;
        let enterIndex = enterIndexEnd;
        let leaveIndex = leaveIndexEnd;
        while (--enterIndex >= enterIndexStart && --leaveIndex >= leaveIndexStart) {
            topHeader.insertBefore(this.useTopHeaderCell(enterIndex, topHeader.lastChild), topHeader.firstChild);
        }
        while (--leaveIndex >= leaveIndexStart) {
            topHeader.lastChild.remove();
        }
        while (enterIndex >= enterIndexStart) {
            topHeader.insertBefore(this.useTopHeaderCell(enterIndex--), topHeader.firstChild);
        }
        for (let rowIndex = topIndex, rowElement; rowIndex < bottomIndex; ++rowIndex) {
            rowElement = rows[rowIndex][_ROW_];
            enterIndex = enterIndexEnd;
            leaveIndex = leaveIndexEnd;
            while (--enterIndex >= enterIndexStart && --leaveIndex >= leaveIndexStart) {
                rowElement.insertBefore(this.useCell(enterIndex, rowIndex, rowElement.lastChild), rowElement.firstChild);
            }
            while (--leaveIndex >= leaveIndexStart) {
                rowElement.lastChild.remove();
            }
            while (enterIndex >= enterIndexStart) {
                rowElement.insertBefore(this.useCell(enterIndex--, rowIndex), rowElement.firstChild);
            }
        }
    }

    // TODO: filter breaks index alignment

    columnContext(event) {
        const header = event.target.closest(".ch");
        const index = header.columnIndex;
        const column = this.columns[index];
        return {
            header,
            column,
            index
        };
    }

    useTopHeaderCell(columnIndex, recycled) {
        const topHeaderCell = recycled || cloneTopHeaderCell(this);
        topHeaderCell.render(columnIndex);
        if (!recycled) {
            this.onTopHeaderCell(topHeaderCell);
        }
        return topHeaderCell;
    }

    onTopHeaderCell(cell) {
        cell.lastChild.addEventListener("pointerenter", this.onEnterTopHeaderCell, {capture:true});
        cell.lastChild.addEventListener("pointerleave", this.onLeaveTopHeaderCell, {capture:true});

        const searchInput = cell.lastChild.firstChild;
        const searchLabel = searchInput.nextSibling.nextSibling;
        const searchIcon = searchLabel.nextSibling;

        let focused;
        searchInput.addEventListener("focus", () => {
            focused = true;
            searchInput.closest(".cell").scrollIntoView({behavior: "smooth", block: "end", inline: "nearest"});
        });
        searchInput.addEventListener("blur", () => focused = false);
        searchInput.addEventListener("input", event => {
            const {index} = this.columnContext(event);
            this.properties.columns[index].search = searchInput.value;
            this.requestUpdate({columns: [...this.properties.columns]});
        });
        searchIcon.addEventListener("pointerdown", (event) => {
            if (focused) {
                event.target.focus();
            } else {
                event.preventDefault();
                event.stopPropagation();
                searchInput.focus();
            }
        }, true);
        searchLabel.addEventListener("click", (event) => {
            const {extentOffset, anchorOffset, focusNode} = this.shadowRoot.getSelection();
            if (extentOffset === anchorOffset || focusNode.parentNode !== event.target) {
                searchInput.focus();
            }
        }, false);

        const sortIcon = searchLabel.lastChild;

        sortIcon.addEventListener("pointerdown", event => {
            event.preventDefault();
            event.stopPropagation();
        });

        sortIcon.addEventListener("click", event => {
            event.preventDefault();
            event.stopPropagation();
            const {index: columnIndex} = this.columnContext(event);
            this.requestUpdate({
                columns: [...this.properties.columns.map((column, index) => {
                    if (index === columnIndex) {
                        return {...column, sort: !column.sort ? "asc" : column.sort === "asc" ? "desc" : undefined};
                    } else {
                        return {...column, sort: undefined};
                    }
                })]
            });
        });
    }

    onEnterTopHeaderCell(cell) {

    }

    onLeaveTopHeaderCell(cell) {

    }

    useLeftHeaderCell(rowIndex, recycled) {
        const leftHeaderCell = recycled || cloneLeftHeaderCell(this);
        leftHeaderCell.render(rowIndex);
        if (!recycled) {
            this.onLeftHeaderCell(leftHeaderCell);
        }
        return leftHeaderCell;
    }

    onLeftHeaderCell(cell) {
        cell.lastChild.addEventListener("pointerenter", this.onEnterLeftHeaderCell, {capture:true});
        cell.lastChild.addEventListener("pointerleave", this.onLeaveLeftHeaderCell, {capture:true});
    }

    onEnterLeftHeaderCell(cell) {

    }

    onLeaveLeftHeaderCell(cell) {

    }

    useCell(columnIndex, rowIndex, recycled) {
        const cellElement = recycled || cloneCell(this);
        cellElement.render(columnIndex, rowIndex);
        if (!recycled) {
            this.onCell(cellElement);
        }
        return cellElement;
    }

    onCell(cell) {
        cell.lastChild.addEventListener("pointerenter", this.onEnterCell, {capture:true});
        cell.lastChild.addEventListener("pointerleave", this.onLeaveCell, {capture:true});
    }

    onEnterCell(cell) {

    }

    onLeaveCell(cell) {

    }

    useRow(rowIndex, leftIndex, rightIndex, recycled) {
        const rowElement = recycled || cloneRow(this);
        rowElement.render(rowIndex, leftIndex, rightIndex);
        return rowElement;
    }

    swap(leftIndex, rightIndex) {

        if (leftIndex === rightIndex) {
            return
        } else if (leftIndex > rightIndex) {
            const smaller = rightIndex;
            rightIndex = leftIndex;
            leftIndex = smaller;
        }

        const diff = this.columns[rightIndex].width - this.columns[leftIndex].width;

        const left = this.columns[leftIndex].left;
        const right = this.columns[rightIndex].left + diff;
        this.columns[leftIndex].left = right;
        this.columns[rightIndex].left = left;

        for (let columnIndex = leftIndex+1; columnIndex < rightIndex; columnIndex++) {
            this.columns[columnIndex].left += diff;
        }

        this.viewPort.classList.add("animate");

        this.replaceGridStyle(`
             .cell.c-${leftIndex},
             .cell.c-${leftIndex+1},
             .cell.c-${rightIndex},
             .cell.c-${rightIndex+1}{
                border-left: 1px solid var(--border-color);
                margin-left: -1px;
            }
        `);

        setTimeout(()=>{
            this.viewPort.classList.remove("animate");
            const c = this.properties.columns[leftIndex];
            this.properties.columns[leftIndex] = this.properties.columns[rightIndex];
            this.properties.columns[rightIndex] = c;
            this.requestUpdate({columns:[...this.properties.columns]});
        }, 300);
    }
}
