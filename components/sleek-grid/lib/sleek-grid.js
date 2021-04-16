import {sleekStyle} from "./styles/sleek.js";
import {staticStyle} from "./styles/static.js";
import {cloneCell, cloneColumnHeader, cloneGridTemplate, cloneRow, cloneRowHeader} from "./templates.js";
import {importColumns, importRows, sourceCode, textWidth} from "./utility.mjs";
import {ViewPortRange} from "./view-port.mjs";

let gridId = 0;

const $RR = Symbol("row");
const $RH = Symbol("row-header");
const $CH = Symbol("column-header");

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
        this.columnHeader = this.shadowRoot.getElementById("top-header");
        this.rowHeader = this.shadowRoot.getElementById("left-header");
        this.sheet = this.shadowRoot.getElementById("sheet");

        const refresh = this.refresh.bind(this);
        this.resizeObserver = new ResizeObserver(refresh);
        this.resizeObserver.observe(this.viewPort);
        this.viewPort.addEventListener("scroll", refresh, {passive: true});

        this.properties = {
            rows: [],
            columns: []
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
        };
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

        let columnIndex = leftIndex, ch = this.columnHeader.firstChild;
        while (ch && columnIndex < rightIndex) {
            this.createColumnHeader(columnIndex++, ch);
            ch = ch.nextSibling;
        }
        if (ch) {
            let last;
            do {
                last = this.columnHeader.removeChild(this.columnHeader.lastChild);
            } while (last !== ch);
        }
        while (columnIndex < rightIndex) {
            this.columnHeader.appendChild(this.createColumnHeader(columnIndex++));
        }

        for (let rowIndex = topIndex; rowIndex < bottomIndex; ++rowIndex) {
            this.rows[rowIndex][$RH] = this.rowHeader.appendChild(this.createRowHeader(rowIndex));
            this.rows[rowIndex][$RR] = this.sheet.appendChild(this.createRow(rowIndex, leftIndex, rightIndex));
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
            };
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

        let {
            topIndex,
            bottomIndex,
            leftIndex,
            rightIndex,
            previous
        } = this.viewPortRange(this.viewPort);

        if (topIndex < previous.topIndex) {
            this.moveVertically(
                topIndex, Math.min(bottomIndex, previous.topIndex),
                Math.max(bottomIndex, previous.topIndex), previous.bottomIndex,
                leftIndex, rightIndex
            );
        }

        if (bottomIndex > previous.bottomIndex) {
            this.moveVertically(
                Math.max(topIndex, previous.bottomIndex), bottomIndex,
                previous.topIndex, Math.min(topIndex, previous.bottomIndex),
                leftIndex, rightIndex
            );
        }

        if (leftIndex < previous.leftIndex) {
            this.goLeft(
                leftIndex, Math.min(previous.leftIndex, rightIndex),
                Math.max(previous.leftIndex, rightIndex), previous.rightIndex,
                topIndex, bottomIndex
            );
        }

        if (rightIndex > previous.rightIndex) {
            this.goRight(
                Math.max(previous.rightIndex, leftIndex), rightIndex,
                previous.leftIndex, Math.min(previous.rightIndex, leftIndex),
                topIndex, bottomIndex
            );
        }
    }

    moveVertically(enterIndexStart, enterIndexEnd, leaveIndexStart, leaveIndexEnd, leftIndex, rightIndex) {
        const {rows} = this;
        let leaveIndex = leaveIndexStart;
        let enterIndex = enterIndexStart;
        while (enterIndex < enterIndexEnd && leaveIndex < leaveIndexEnd) {
            rows[enterIndex][$RH] = this.createRowHeader(enterIndex, rows[leaveIndex][$RH]);
            rows[enterIndex][$RR] = this.createRow(enterIndex, leftIndex, rightIndex, rows[leaveIndex][$RR]);
            rows[leaveIndex][$RH] = undefined;
            rows[leaveIndex][$RR] = undefined;
            ++enterIndex;
            ++leaveIndex;
        }
        while (leaveIndex < leaveIndexEnd) {
            rows[leaveIndex][$RH].remove();
            rows[leaveIndex][$RR].remove();
            rows[leaveIndex][$RH] = undefined;
            rows[leaveIndex][$RR] = undefined;
            ++leaveIndex;
        }
        while (enterIndex < enterIndexEnd) {
            rows[enterIndex][$RH] = this.rowHeader.appendChild(this.createRowHeader(enterIndex));
            rows[enterIndex][$RR] = this.sheet.appendChild(this.createRow(enterIndex, leftIndex, rightIndex));
            ++enterIndex;
        }
    }

    goRight(enterIndexStart, enterIndexEnd, leaveIndexStart, leaveIndexEnd, topIndex, bottomIndex) {
        const {columnHeader, rows} = this;
        let enterIndex = enterIndexStart;
        let leaveIndex = leaveIndexStart;
        while (enterIndex < enterIndexEnd && leaveIndex++ < leaveIndexEnd) {
            columnHeader.appendChild(this.createColumnHeader(enterIndex++, columnHeader.firstChild));
        }
        while (leaveIndex++ < leaveIndexEnd) {
            columnHeader.firstChild.remove();
        }
        while (enterIndex < enterIndexEnd) {
            columnHeader.appendChild(this.createColumnHeader(enterIndex++));
        }
        for (let rowIndex = topIndex, rowElement; rowIndex < bottomIndex; ++rowIndex) {
            rowElement = rows[rowIndex][$RR];
            enterIndex = enterIndexStart;
            leaveIndex = leaveIndexStart;
            while (enterIndex < enterIndexEnd && leaveIndex++ < leaveIndexEnd) {
                rowElement.appendChild(this.createCell(enterIndex++, rowIndex, rowElement.firstChild));
            }
            while (leaveIndex++ < leaveIndexEnd) {
                rowElement.firstChild.remove();
            }
            while (enterIndex < enterIndexEnd) {
                rowElement.appendChild(this.createCell(enterIndex++, rowIndex));
            }
        }
    }

    goLeft(enterIndexStart, enterIndexEnd, leaveIndexStart, leaveIndexEnd, topIndex, bottomIndex) {
        const {columnHeader, rows} = this;
        let enterIndex = enterIndexEnd;
        let leaveIndex = leaveIndexEnd;
        while (--enterIndex >= enterIndexStart && --leaveIndex >= leaveIndexEnd) {
            columnHeader.insertBefore(this.createColumnHeader(enterIndex, columnHeader.lastChild), columnHeader.firstChild);
        }
        while (leaveIndex-- >= leaveIndexStart) {
            columnHeader.lastChild.remove();
        }
        while (enterIndex >= enterIndexStart) {
            columnHeader.insertBefore(this.createColumnHeader(enterIndex--), columnHeader.firstChild);
        }
        for (let rowIndex = topIndex, rowElement; rowIndex < bottomIndex; ++rowIndex) {
            rowElement = rows[rowIndex][$RR];
            enterIndex = enterIndexEnd;
            leaveIndex = leaveIndexEnd;
            while (--enterIndex >= enterIndexStart && --leaveIndex >= leaveIndexEnd) {
                rowElement.insertBefore(this.createCell(enterIndex, rowIndex, rowElement.lastChild), rowElement.firstChild);
            }
            while (leaveIndex-- >= leaveIndexStart) {
                rowElement.lastChild.remove();
            }
            while (enterIndex >= enterIndexStart) {
                rowElement.insertBefore(this.createCell(enterIndex--, rowIndex), rowElement.firstChild);
            }
        }
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
        };
    }

    createColumnHeader(columnIndex, recycled) {
        const columnHeader = recycled || cloneColumnHeader(this);
        columnHeader.render(columnIndex);
        if (!recycled) {
            this.columnHeaderCallback(columnHeader);
        }
        return columnHeader;
    }

    columnHeaderCallback(columnHeader) {
    }

    createRowHeader(rowIndex, recycled) {
        const rowHeader = recycled || cloneRowHeader(this);
        rowHeader.render(rowIndex);
        if (!recycled) {
            this.rowHeaderCallback(rowHeader);
        }
        return rowHeader;
    }

    rowHeaderCallback(rowHeader) {
    }

    createCell(columnIndex, rowIndex, recycled) {
        const cellElement = recycled || cloneCell(this);
        cellElement.render(columnIndex, rowIndex);
        return cellElement;
    }

    createRow(rowIndex, leftIndex, rightIndex, recycled) {
        const row = recycled || cloneRow(this);
        row.render(rowIndex, leftIndex, rightIndex);
        return row;
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
                next = factory(next.bind(this));
                factory = advices.shift();
            }
            SleekGrid.prototype[name] = next;
            next.apply(this, arguments);
        };
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
            };
        } else {
            SleekGrid.prototype[name] = advice;
        }
    }
};
