import {sleekStyle} from "./styles/sleek.js";
import {staticStyle} from "./styles/static.js";
import {cloneCell, cloneColumnHeader, cloneGridTemplate, cloneRow, cloneRowHeader} from "./templates.js";
import {sourceCode} from "./utility.mjs";
import {ViewPortRange} from "./view-port.mjs";

let gridId = 0;

export const _ROW_ = Symbol();
export const _ROW_HEADER_ = Symbol();

export class SleekGrid extends HTMLElement {

    constructor() {
        super();

        this.setAttribute("grid-id", gridId);

        this.attachShadow({mode: "open"}).adoptedStyleSheets = [
            staticStyle,
            sleekStyle,
            this.gridStyle = new CSSStyleSheet()
        ];

        this.shadowRoot.appendChild(cloneGridTemplate());

        this.stub = this.shadowRoot.getElementById("stub");
        this.viewPort = this.shadowRoot.getElementById("view-port");
        this.scrollArea = this.shadowRoot.getElementById("scroll-area");
        this.columnHeader = this.shadowRoot.getElementById("top-header");
        this.rowHeader = this.shadowRoot.getElementById("left-header");
        this.sheet = this.shadowRoot.getElementById("sheet");

        this.pendingUpdate = null;

        this.properties = {
            rows: [],
            columns: []
        }; // keeps a copy of the properties set on the custom element

        this.autosize = "quick";
        this.rows = [];
        this.columns = [];

        this.createdCallback();
    }

    createdCallback() {
    }

    // =========================================================================================================
    // PROPERTIES
    // =========================================================================================================

    requestUpdate(properties = this.properties) {
        cancelAnimationFrame(this.pendingUpdate);
        this.pendingUpdate = requestAnimationFrame(() => {
            properties = {...this.properties, ...properties};
            this.render(properties);
            this.properties = properties;
        });
    }

    set data(data) {
        this.requestUpdate(data);
    }

    // =========================================================================================================
    // MOUNT/UNMOUNT
    // =========================================================================================================

    connectedCallback() {

        this.viewPort.range = new ViewPortRange(this);
        this.viewPort.range.onchange = this.viewPortUpdated;

        const {columns, rows} = this.properties;
        this.render({columns: [...columns], rows: [...rows]});
    }

    disconnectedCallback() {

        this.viewPort.range.destroy();
    }

    // =========================================================================================================
    // RENDERING
    // =========================================================================================================

    render(properties) {

        const {range} = this.viewPort;
        const {
            topIndex: lastTopIndex,
            bottomIndex: lastBottomIndex,
            leftIndex: lastLeftIndex,
            rightIndex: lastRightIndex
        } = range;

        range.properties = properties;
        const {
            topIndex,
            bottomIndex,
            leftIndex,
            rightIndex
        } = range;

        const lastRows = new Map();
        for (let rowIndex = lastTopIndex; rowIndex < lastBottomIndex; ++rowIndex) {
            const lastRow = this.rows[rowIndex];
            lastRows.set(lastRow.index ?? rowIndex, lastRow);
        }

        this.columns = properties.columns;
        this.rows = properties.rows;

        let columnIndex = leftIndex;
        let columnHeaderCell = this.columnHeader.firstChild;
        while (columnIndex < rightIndex && columnHeaderCell) {
            this.createColumnHeader(columnIndex++, columnHeaderCell);
            columnHeaderCell = columnHeaderCell.nextSibling;
        }
        if (columnHeaderCell) do {
        } while (columnHeaderCell !== this.columnHeader.removeChild(this.columnHeader.lastChild));
        while (columnIndex < rightIndex) {
            this.columnHeader.appendChild(this.createColumnHeader(columnIndex++, columnHeaderCell));
        }

        for (let rowIndex = topIndex; rowIndex < bottomIndex; ++rowIndex) {
            const row = this.rows[rowIndex];
            const key = row.index ?? rowIndex;
            const recycled = lastRows.get(key);
            if (recycled) {
                lastRows.delete(key);
                row[_ROW_HEADER_] = this.createRowHeader(rowIndex, recycled[_ROW_HEADER_]);
                row[_ROW_] = this.createRow(rowIndex, leftIndex, rightIndex, recycled[_ROW_]);
            } else {
                row[_ROW_HEADER_] = this.rowHeader.appendChild(this.createRowHeader(rowIndex));
                row[_ROW_] = this.sheet.appendChild(this.createRow(rowIndex, leftIndex, rightIndex));
                row[_ROW_HEADER_].classList.add("enter");
                row[_ROW_].classList.add("enter");
            }
        }

        for (const lastRow of lastRows.values()) {
            lastRow[_ROW_HEADER_].classList.add("leave");
            lastRow[_ROW_].classList.add("leave");
        }

        this.scrollArea.classList.add("rendering");
        setTimeout(() => {
            this.scrollArea.classList.remove("rendering");
            for (const entered of this.scrollArea.querySelectorAll(".enter")) {
                entered.classList.remove("enter");
            }
            for (const left of this.scrollArea.querySelectorAll(".leave")) {
                left.remove();
            }
        }, 300);

        let gridStyle = "";
        for (let columnIndex = 0; columnIndex < rightIndex; ++columnIndex) {
            const {left, width} = this.columns[columnIndex];
            gridStyle += `.c-${columnIndex}{left:${left}px;width:${width}px;}\n`;
        }
        for (let rowIndex = 0; rowIndex < bottomIndex; ++rowIndex) {
            const {top, height} = this.rows[rowIndex];
            gridStyle += `.r-${rowIndex}{transform:translateY(${top}px);height:${height}px;}\n`;
        }
        this.gridStyle.replace(gridStyle);
    }

    scrollTo(x, y) {
        this.viewPort.scrollTo(x, y);
    }

    viewPortUpdated({topIndex, bottomIndex, leftIndex, rightIndex}, last) {
        let enterIndexStart;
        let enterIndexEnd;
        let leaveIndexStart;
        let leaveIndexEnd;

        if (topIndex < last.topIndex || bottomIndex < last.bottomIndex) {
            enterIndexStart = topIndex;
            enterIndexEnd = Math.min(bottomIndex, last.topIndex);
            leaveIndexStart = Math.max(bottomIndex, last.topIndex);
            leaveIndexEnd = last.bottomIndex;
            this.refreshRows(enterIndexStart, enterIndexEnd, leaveIndexStart, leaveIndexEnd, leftIndex, rightIndex);
        }

        if (bottomIndex > last.bottomIndex || topIndex > last.topIndex) {
            enterIndexStart = Math.max(topIndex, last.bottomIndex);
            enterIndexEnd = bottomIndex;
            leaveIndexStart = last.topIndex;
            leaveIndexEnd = Math.min(topIndex, last.bottomIndex);
            this.refreshRows(enterIndexStart, enterIndexEnd, leaveIndexStart, leaveIndexEnd, leftIndex, rightIndex);
        }

        if (leftIndex < last.leftIndex || rightIndex < last.rightIndex) {
            enterIndexStart = leftIndex;
            enterIndexEnd = Math.min(last.leftIndex, rightIndex);
            leaveIndexStart = Math.max(last.leftIndex, rightIndex);
            leaveIndexEnd = last.rightIndex;
            this.goLeft(enterIndexStart, enterIndexEnd, leaveIndexStart, leaveIndexEnd, topIndex, bottomIndex);
        }

        if (rightIndex > last.rightIndex || leftIndex > last.leftIndex) {
            enterIndexStart = Math.max(last.rightIndex, leftIndex);
            enterIndexEnd = rightIndex;
            leaveIndexStart = last.leftIndex;
            leaveIndexEnd = Math.min(last.rightIndex, leftIndex);
            this.goRight(enterIndexStart, enterIndexEnd, leaveIndexStart, leaveIndexEnd, topIndex, bottomIndex);
        }

        let gridStyle = "";
        for (let columnIndex = 0; columnIndex < rightIndex; ++columnIndex) {
            const {left, width} = this.columns[columnIndex];
            gridStyle += `.c-${columnIndex}{left:${left}px;width:${width}px;}\n`;
        }
        for (let rowIndex = 0; rowIndex < bottomIndex; ++rowIndex) {
            const {top, height} = this.rows[rowIndex];
            gridStyle += `.r-${rowIndex}{transform:translateY(${top}px);height:${height}px;}\n`;
        }
        this.gridStyle.replace(gridStyle);
    }

    refreshRows(enterIndexStart, enterIndexEnd, leaveIndexStart, leaveIndexEnd, leftIndex, rightIndex) {
        const {rows} = this;
        let leaveIndex = leaveIndexStart;
        let enterIndex = enterIndexStart;
        while (enterIndex < enterIndexEnd && leaveIndex < leaveIndexEnd) {
            rows[enterIndex][_ROW_HEADER_] = this.createRowHeader(enterIndex, rows[leaveIndex][_ROW_HEADER_]);
            rows[enterIndex][_ROW_] = this.createRow(enterIndex, leftIndex, rightIndex, rows[leaveIndex][_ROW_]);
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
            rows[enterIndex][_ROW_HEADER_] = this.rowHeader.appendChild(this.createRowHeader(enterIndex));
            rows[enterIndex][_ROW_] = this.sheet.appendChild(this.createRow(enterIndex, leftIndex, rightIndex));
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
            rowElement = rows[rowIndex][_ROW_];
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
        while (--enterIndex >= enterIndexStart && --leaveIndex >= leaveIndexStart) {
            columnHeader.insertBefore(this.createColumnHeader(enterIndex, columnHeader.lastChild), columnHeader.firstChild);
        }
        while (--leaveIndex >= leaveIndexStart) {
            columnHeader.lastChild.remove();
        }
        while (enterIndex >= enterIndexStart) {
            columnHeader.insertBefore(this.createColumnHeader(enterIndex--), columnHeader.firstChild);
        }
        for (let rowIndex = topIndex, rowElement; rowIndex < bottomIndex; ++rowIndex) {
            rowElement = rows[rowIndex][_ROW_];
            enterIndex = enterIndexEnd;
            leaveIndex = leaveIndexEnd;
            while (--enterIndex >= enterIndexStart && --leaveIndex >= leaveIndexStart) {
                rowElement.insertBefore(this.createCell(enterIndex, rowIndex, rowElement.lastChild), rowElement.firstChild);
            }
            while (--leaveIndex >= leaveIndexStart) {
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
