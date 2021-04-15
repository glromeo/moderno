import {sleekStyle} from "./styles/sleek.js";
import {staticStyle} from "./styles/static.js";
import {
    cellsRecycle,
    cloneCell,
    cloneColumnHeader,
    cloneGridTemplate,
    cloneRow,
    cloneRowHeader,
    columnHeadersRecycle,
    rowHeadersRecycle,
    rowsRecycle,
} from "./templates.js";
import {importColumns, importRows, sourceCode, textWidth} from "./utility.mjs";
import {ViewPortRange} from "./view-port.mjs";

let gridId = 0;

/**
 * Custom component implementing the Grid
 */
export class SleekGrid extends HTMLElement {

    constructor() {
        super();

        this.setAttribute("grid-id", gridId);

        this.attachShadow({mode: "open"}).adoptedStyleSheets = [
            staticStyle,
            sleekStyle
        ];

        this.shadowRoot.appendChild(cloneGridTemplate());

        this.stub = this.shadowRoot.getElementById("stub");
        this.viewPort = this.shadowRoot.getElementById("view-port");
        this.scrollArea = this.shadowRoot.getElementById("scroll-area");
        this.topHeader = this.shadowRoot.getElementById("top-header");
        this.leftHeader = this.shadowRoot.getElementById("left-header");
        this.sheet = this.shadowRoot.getElementById("sheet");

        const refresh = this.refresh.bind(this);
        this.resizeObserver = new ResizeObserver(refresh);
        this.resizeObserver.observe(this.viewPort);
        this.viewPort.addEventListener("scroll", refresh, {passive: true});

        this.properties = {
            rows: [],
            columns: [],
        }; // keeps a copy of the properties set on the custom element

        this.autosize = "quick";
        this.rows = [];
        this.columns = [];

        this.features = {};

        this.createdCallback();

        let pendingUpdate;
        this.requestUpdate = (properties = this.properties) => {
            cancelAnimationFrame(pendingUpdate);
            pendingUpdate = requestAnimationFrame(() => {
                properties = {...this.properties, ...properties};
                this.render(properties);
                this.properties = properties;
            });
        }
    }

    set data(data) {
        this.requestUpdate(data);
    }

    // =========================================================================================================
    // PROPERTIES
    // =========================================================================================================

    createdCallback() {
    }

    // =========================================================================================================
    // MOUNT/UNMOUNT
    // =========================================================================================================

    connectedCallback() {
        const {columns, rows} = this.properties;
        this.render({columns: [...columns], rows: [...rows]});
    }

    disconnectedCallback() {
    }

    // =========================================================================================================
    // RENDERING
    // =========================================================================================================

    render({columns, rows}) {

        if (columns !== this.columns) {
            this.columns = importColumns(columns, this.columnWidthFunction(columns, rows));
            const {left, width} = this.columns[this.columns.length - 1] || {left: 0, width: 0};
            this.scrollArea.style.width = `${left + width}px`;
        }

        if (rows !== this.rows) {
            this.rows = importRows(rows, this.rowHeightFunction(columns, rows));
            const {top, height} = this.rows[this.rows.length - 1] || {top: 0, height: 0};
            this.scrollArea.style.height = `${top + height}px`;
        }

        this.viewPortRange = ViewPortRange(this);

        const {
            topIndex,
            bottomIndex,
            leftIndex,
            rightIndex
        } = this.viewPortRange.state;

        // console.log("render:", this.columns.length, this.rows.length, {
        //     topIndex,
        //     bottomIndex,
        //     leftIndex,
        //     rightIndex
        // }, new Error().stack);

        let columnIndex = leftIndex, ch = this.topHeader.firstChild;
        while (ch && columnIndex < rightIndex) {
            this.createColumnHeader(columnIndex++, ch);
            ch = ch.nextSibling;
        }
        if (ch) {
            let last;
            do {
                last = this.topHeader.removeChild(this.topHeader.lastChild);
            } while (last !== ch);
        }
        while (columnIndex < rightIndex) {
            this.topHeader.appendChild(this.createColumnHeader(columnIndex++));
        }

        let rowIndex = topIndex, rh = this.leftHeader.firstChild, row = this.sheet.firstElementChild;
        while (rh && rowIndex < bottomIndex) {
            this.createRow(rowIndex, leftIndex, rightIndex, row);
            this.createRowHeader(rowIndex++, rh);
            rh = rh.nextSibling;
            row = row.nextSibling;
        }
        if (rh) {
            let last;
            do {
                this.sheet.removeChild(this.sheet.lastChild);
                last = this.leftHeader.removeChild(this.leftHeader.lastChild);
            } while (last !== rh);
        }
        while (rowIndex < bottomIndex) {
            this.sheet.appendChild(this.createRow(rowIndex, leftIndex, rightIndex));
            this.leftHeader.appendChild(this.createRowHeader(rowIndex++));
        }
    }

    columnWidthFunction(columns, rows) {
        if (this.autosize === "quick") {
            return ({label, name}) => {
                let width = textWidth(label);
                for (const row of rows) {
                    width = Math.max(width, textWidth(row[name]));
                }
                return (.6 * width) + 32;
            }
        } else {
            const width = this.viewPort.clientWidth / columns.length;
            return () => width;
        }
    }

    rowHeightFunction(columns, rows) {
        return index => 32;
    }

    scrollTo(x, y) {
        this.viewPort.scrollTo(x, y);
    }

    refresh() {

        const {leftHeader, topHeader, sheet} = this;

        let {
            topIndex,
            bottomIndex,
            leftIndex,
            rightIndex,
            previous
        } = this.viewPortRange(this.viewPort);

        // =========================================================================================================
        // LEAVE
        // =========================================================================================================

        if (topIndex > previous.topIndex) {
            this.recycleTop(topIndex - previous.topIndex, leftHeader, sheet);
        }
        if (bottomIndex < previous.bottomIndex) {
            this.recycleBottom(previous.bottomIndex - bottomIndex, leftHeader, sheet);
        }

        if (leftIndex > previous.leftIndex) {
            this.recycleLeft(leftIndex - previous.leftIndex, topHeader, sheet);
        }
        if (rightIndex < previous.rightIndex) {
            this.recycleRight(previous.rightIndex - rightIndex, topHeader, sheet);
        }

        // =========================================================================================================
        // ENTER
        // =========================================================================================================

        if (leftIndex < previous.leftIndex) {
            for (let columnIndex = Math.min(previous.leftIndex, rightIndex) - 1; columnIndex >= leftIndex; --columnIndex) {
                topHeader.prepend(this.createColumnHeader(columnIndex));
                let rowElement = sheet.firstChild;
                let rowIndex = topIndex;
                while (rowElement) {
                    rowElement.prepend(this.createCell(columnIndex, rowIndex++));
                    rowElement = rowElement.nextSibling;
                }
            }
        }

        if (rightIndex > previous.rightIndex) {
            for (let columnIndex = Math.max(previous.rightIndex, leftIndex); columnIndex < rightIndex; ++columnIndex) {
                topHeader.append(this.createColumnHeader(columnIndex));
                let rowElement = sheet.firstChild;
                let rowIndex = topIndex;
                while (rowElement) {
                    rowElement.append(this.createCell(columnIndex, rowIndex++));
                    rowElement = rowElement.nextSibling;
                }
            }
        }

        if (topIndex < previous.topIndex) {
            for (let rowIndex = Math.min(previous.topIndex, bottomIndex) - 1; rowIndex >= topIndex; --rowIndex) {
                sheet.prepend(this.createRow(rowIndex, leftIndex, rightIndex));
                leftHeader.prepend(this.createRowHeader(rowIndex));
            }
        }

        if (bottomIndex > previous.bottomIndex) {
            for (let rowIndex = Math.max(previous.bottomIndex, topIndex); rowIndex < bottomIndex; ++rowIndex) {
                sheet.append(this.createRow(rowIndex, leftIndex, rightIndex));
                leftHeader.append(this.createRowHeader(rowIndex));
            }
        }
    }

    createColumnHeader(columnIndex, recycled = columnHeadersRecycle.lastChild) {
        const {label, left, width, search, sort} = this.columns[columnIndex];
        const columnHeader = recycled || cloneColumnHeader();
        const headerContent = columnHeader.childNodes[1];
        columnHeader.index = columnIndex;
        columnHeader.className = `ch cell c-${columnIndex}`;
        columnHeader.style.left = `${left}px`
        columnHeader.style.width = `${width}px`;
        const headerLabel = headerContent.childNodes[2];
        headerLabel.firstChild.replaceWith(label);
        const headerInput = headerContent.childNodes[0];
        if (headerInput.value !== search) {
            headerInput.value = search || "";
            if (search) {
                columnHeader.setAttribute("search", search);
            } else {
                columnHeader.removeAttribute("search");
            }
        }
        if (sort) {
            columnHeader.setAttribute("sort", sort);
        } else {
            columnHeader.removeAttribute("sort");
        }
        if (!recycled) {
            this.columnHeaderCallback(columnHeader);
        }
        return columnHeader;
    }

    columnHeaderCallback(columnHeader) {
    }

    // TODO: filter breaks index alignment

    columnContext(event) {
        const header = event.target.closest(".ch");
        const index = header.index;
        const column = this.columns[index];
        return {
            header,
            column,
            index
        }
    }

    createRowHeader(rowIndex, recycled = rowHeadersRecycle.lastChild) {
        const {label, top, height} = this.rows[rowIndex];
        const rowHeader = recycled || cloneRowHeader();
        rowHeader.index = rowIndex;
        rowHeader.className = `rh cell r-${rowHeader.index}`;
        rowHeader.style.top = `${top}px`;
        rowHeader.style.height = `${height}px`;
        rowHeader.firstChild.replaceChildren(label ?? "n/a");
        if (!recycled) {
            this.rowHeaderCallback(rowHeader);
        }
        return rowHeader;
    }

    rowHeaderCallback(rowHeader) {
    }

    createCell(columnIndex, rowIndex, recycled = cellsRecycle.lastChild) {
        const {columns, rows} = this;
        const {name, left, width} = columns[columnIndex];
        const content = rows[rowIndex][name];
        const cellElement = recycled || cloneCell();
        cellElement.className = `cell c-${columnIndex} r-${rowIndex}`;
        cellElement.style.left = `${left}px`
        cellElement.style.width = `${width}px`;
        cellElement.firstChild.replaceChildren(content ?? "");
        return cellElement;
    }

    createRow(rowIndex, leftIndex, rightIndex, recycled = rowsRecycle.lastChild) {
        const row = recycled || cloneRow();
        const {top, height} = this.rows[rowIndex];
        if (rowIndex % 2) {
            row.className = "row odd";
        } else {
            row.className = "row even";
        }
        row.setAttribute("row", rowIndex);
        row.style.transform = `translateY(${top}px)`;
        row.style.height = `${height}px`;
        row.index = rowIndex;

        let columnIndex = leftIndex;
        let recycledCell = row.firstChild;
        if (recycledCell) {
            while (recycledCell && columnIndex < rightIndex) {
                this.createCell(columnIndex++, rowIndex, recycledCell);
                recycledCell = recycledCell.nextSibling;
            }
            if (recycledCell) do {
                cellsRecycle.appendChild(row.lastChild);
            } while (cellsRecycle.lastChild !== recycledCell);
        }
        while (columnIndex < rightIndex) {
            row.appendChild(this.createCell(columnIndex++, rowIndex));
        }
        return row;
    }

    recycleTop(count, rowHeaders, sheet) {
        const headerNodes = rowHeaders.childNodes;
        const sheetNodes = sheet.childNodes;
        if (count < headerNodes.length && count > 0) {
            rowHeadersRecycle.append(...Array.prototype.slice.call(headerNodes, 0, count));
            rowsRecycle.append(...Array.prototype.slice.call(sheetNodes, 0, count));
        } else {
            rowHeadersRecycle.append(...headerNodes);
            rowsRecycle.append(...sheetNodes);
        }
    }

    recycleBottom(count, rowHeaders, sheet) {
        const headerNodes = rowHeaders.childNodes;
        const sheetNodes = sheet.childNodes;
        if (count < headerNodes.length && count > 0) {
            rowHeadersRecycle.append(...Array.prototype.slice.call(headerNodes, headerNodes.length - count));
            rowsRecycle.append(...Array.prototype.slice.call(sheetNodes, sheetNodes.length - count));
        } else {
            rowHeadersRecycle.append(...headerNodes);
            rowsRecycle.append(...sheetNodes);
        }
    }

    recycleLeft(count, columnHeaders, sheet) {
        if (count < columnHeaders.childNodes.length && count > 0) {
            do {
                columnHeadersRecycle.appendChild(columnHeaders.firstChild);
                let rowElement = sheet.firstChild;
                while (rowElement) {
                    cellsRecycle.appendChild(rowElement.firstChild);
                    rowElement = rowElement.nextSibling;
                }
            } while (--count)
        } else {
            columnHeadersRecycle.append(...columnHeaders.childNodes);
            let nextRow = sheet.firstChild;
            while (nextRow) {
                cellsRecycle.append(...nextRow.childNodes);
                nextRow = nextRow.nextSibling;
            }
        }
    }

    recycleRight(count, columnHeaders, sheet) {
        if (count < columnHeaders.childNodes.length && count > 0) {
            do {
                columnHeadersRecycle.appendChild(columnHeaders.lastChild);
                let rowElement = sheet.firstChild;
                while (rowElement) {
                    cellsRecycle.appendChild(rowElement.lastChild);
                    rowElement = rowElement.nextSibling;
                }
            } while (--count)
        } else {
            columnHeadersRecycle.append(...columnHeaders.childNodes);
            let nextRow = sheet.firstChild;
            while (nextRow) {
                cellsRecycle.append(...nextRow.childNodes);
                nextRow = nextRow.nextSibling;
            }
        }
    }
}

SleekGrid.features = {

    advices: {},

    validate(advice, name) {
        if (!name) {
            throw new Error("A SleekGrid advice must be a named function e.g. function createdCallback() {...}");
        }
        if (!SleekGrid.prototype.hasOwnProperty(name)) {
            throw new Error(`Not a SleekGrid feature: ${name}`);
        }
        if (typeof SleekGrid.prototype[name] !== "function") {
            throw new Error(`Not a valid SleekGrid feature: ${name}\n`);
        }
    },

    before(name, factory) {
        const advices = this.advices[name] || (this.advices[name] = [SleekGrid.prototype[name]]);
        if (advices.length === 1) SleekGrid.prototype[name] = function before() {
            let next = advices.shift();
            let factory = advices.shift();
            while (factory) {
                next = factory(next.bind(this))
                factory = advices.shift();
            }
            SleekGrid.prototype[name] = next;
            next.apply(this, arguments);
        }
        advices.push(factory);
    },

    after(advice) {
        const name = advice.name;
        this.validate(advice, name);
        if (sourceCode(SleekGrid.prototype[name])) {
            const chain = SleekGrid.prototype[name];
            SleekGrid.prototype[name] = function after() {
                chain.apply(this, arguments);
                advice.apply(this, arguments);
            }
        } else {
            SleekGrid.prototype[name] = advice;
        }
    }
}
