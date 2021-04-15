import {SleekGrid} from "../sleek-grid.js";
import {createCellSizer, createDragHandler} from "../utility.mjs";

SleekGrid.features.after(function createdCallback() {
    const sleekGrid = this;
    const {
        classList,
        style,
        viewPort,
        stub,
        leftHeader,
        scrollArea,
        sheet
    } = sleekGrid;

    function headerWidthResizeCallback({pageX: initialPageX}) {
        const initialWidth = stub.clientWidth;
        return ({pageX}) => {
            let width = initialWidth + Math.ceil(pageX - initialPageX);
            let delta = width - stub.clientWidth;
            if (Math.abs(delta) > 3) {
                stub.style.width = `${width}px`;
                sleekGrid.updateHeaderWidth(width);
            }
        }
    }

    sleekGrid.updateHeaderWidth = function (width = stub.clientWidth) {
        const cssWidth = `${width}px`;
        style.setProperty("--header-width", cssWidth);
    }

    function headerHeightResizeCallback({pageY: initialPageY}) {
        const initialHeight = stub.clientHeight;
        return ({pageY}) => {
            let height = initialHeight + Math.ceil(pageY - initialPageY);
            let delta = height - stub.clientHeight;
            if (Math.abs(delta) > 3) {
                stub.style.height = `${height}px`;
                sleekGrid.updateHeaderHeight(height);
            }
        }
    }

    sleekGrid.updateHeaderHeight = function (height = stub.clientHeight) {
        const heightPx = `${height}px`;
        const padding = Math.min(8, Math.max(2, 2 + (height - 32) * 6 / 10));
        style.setProperty("--header-height", heightPx);
        style.setProperty("--header-padding", `${padding}px`);
    }

    function columnResizeCallback({pageX: initialPageX}, handle) {
        const {columns} = sleekGrid;
        const columnHeaderCell = handle.parentElement;
        const columnIndex = columnHeaderCell.index;
        const column = columns[columnIndex];
        let translation;
        return ({pageX}) => {
            if (pageX !== undefined) {
                let width = column.width + pageX - initialPageX;
                if (column.maxWidth !== undefined) {
                    width = Math.min(width, column.maxWidth);
                }
                if (column.minWidth !== undefined) {
                    width = Math.max(width, column.minWidth);
                } else {
                    width = Math.max(width, 20);
                }
                const delta = Math.floor(width - column.width);
                if (Math.abs(delta) > 3) {
                    translation = width - column.width;
                    const cssWidth = `${width}px`;
                    columnHeaderCell.style.width = cssWidth;
                    for (const {style} of sheet.querySelectorAll(`.c-${columnIndex}`)) {
                        style.width = cssWidth;
                    }
                    const cssTransform = `translateX(${translation}px)`;
                    for (const {style} of scrollArea.querySelectorAll(`.c-${columnIndex} ~ .cell`)) {
                        style.transform = cssTransform;
                    }
                }
            } else if (translation !== undefined) {
                translation = Math.floor(translation);
                column.width += translation;

                for (const {style, offsetLeft} of scrollArea.querySelectorAll(`.c-${columnIndex} ~ .cell`)) {
                    style.left = `${offsetLeft + translation}px`;
                    style.transform = null;
                }
                for (let nextColumnIndex = columnIndex + 1; nextColumnIndex < columns.length; ++nextColumnIndex) {
                    columns[nextColumnIndex].left += translation;
                }
                sleekGrid.viewPortRange.refresh(translation);
            }
        }
    }

    function rowResizeCallback({pageY: initialPageY}, handle) {
        const {rows} = sleekGrid;
        const rowHeaderCell = handle.parentElement;
        const rowIndex = rowHeaderCell.index;
        const row = rows[rowIndex];
        let translation;
        return ({pageY}) => {
            if (pageY !== undefined) {
                let height = row.height + pageY - initialPageY;
                if (row.maxHeight !== undefined) {
                    height = Math.min(height, row.maxHeight);
                }
                if (row.minHeight !== undefined) {
                    height = Math.max(height, row.minHeight);
                } else {
                    height = Math.max(height, 32);
                }
                let delta = Math.floor(height - row.height);
                if (Math.abs(delta) > 3) {
                    translation = height - row.height;

                    const cssHeight = `${height}px`;
                    rowHeaderCell.style.height = cssHeight;
                    for (const {style} of sheet.querySelectorAll(`.r-${rowIndex}`)) {
                        style.height = cssHeight;
                    }

                    const cssTransform = `translateY(${translation}px)`;
                    for (const {style} of leftHeader.querySelectorAll(`.r-${rowIndex} ~ .cell`)) {
                        style.transform = cssTransform;
                    }

                    let rowElement = sheet.querySelector(`[row="${rowIndex}"]`);
                    rowElement.style.height = cssHeight;
                    for (let nextRowIndex = rowIndex + 1; (rowElement = rowElement.nextSibling); nextRowIndex++) {
                        rowElement.style.transform = `translateY(${rows[nextRowIndex].top + translation}px)`;
                    }
                }
            } else if (translation !== undefined) {
                translation = Math.floor(translation);
                row.height += translation;

                const cssHeight = `${row.height}px`;
                rowHeaderCell.style.height = cssHeight;
                for (const {style} of sheet.querySelectorAll(`.r-${rowIndex}`)) {
                    style.height = cssHeight;
                }

                for (const {style, offsetTop} of leftHeader.querySelectorAll(`.r-${rowIndex} ~ .cell`)) {
                    style.top = `${offsetTop + translation}px`;
                    style.transform = null;
                }
                let rowElement = sheet.querySelector(`[row="${rowIndex}"]`);
                rowElement.style.height = cssHeight;
                let nextRowIndex = rowIndex + 1;
                while ((rowElement = rowElement.nextSibling)) {
                    const rowTop = rows[nextRowIndex++].top += translation;
                    rowElement.style.transform = `translateY(${rowTop}px)`;
                }
                while (nextRowIndex < rows.length) {
                    rows[nextRowIndex++].top += translation;
                }
                sleekGrid.viewPortRange.refresh(translation);
            }
        }
    }

    const sizer = createCellSizer(sleekGrid);

    function maxWidth(columnIndex) {
        const column = sleekGrid.columns[columnIndex];
        let width = 0;
        for (const row of sleekGrid.rows) {
            width = Math.max(width, sizer(column, row).clientWidth);
        }
        return width;
    }

    function maxHeight(rowIndex) {
        const row = sleekGrid.rows[rowIndex];
        let height = 0;
        for (const column of sleekGrid.columns) {
            height = Math.max(height, sizer(column, row).clientHeight);
        }
        return height;
    }

    const createAutosizeHandler = (callback, computeSize) => function (event) {
        event.preventDefault();
        event.stopPropagation();
        if (!classList.contains("busy")) {
            const handle = event.target;
            const headerCell = handle.parentElement;
            handle.classList.add("active");
            classList.add("busy");
            requestAnimationFrame(() => {
                const preferredSize = computeSize(headerCell.index);
                callback(event, headerCell.index, Math.floor(preferredSize));
                classList.remove("busy");
                handle.classList.remove("active");
            });
        }
    };

    function columnFitCallback(event, columnIndex, columnWidth) {
        const {columns} = sleekGrid;
        const column = columns[columnIndex];
        const translation = columnWidth - column.width;
        const cssWidth = `${columnWidth}px`;

        for (const {style} of scrollArea.querySelectorAll(`.c-${columnIndex}`)) {
            style.width = cssWidth;
        }

        for (const {style, offsetLeft} of scrollArea.querySelectorAll(`.c-${columnIndex} ~ .cell`)) {
            style.left = `${offsetLeft + translation}px`;
        }

        for (let nextColumnIndex = columnIndex + 1; nextColumnIndex < columns.length; ++nextColumnIndex) {
            columns[nextColumnIndex].left += translation;
        }

        column.width = columnWidth;

        sleekGrid.viewPortRange.refresh(translation);
    }

    function rowFitCallback(event, rowIndex, rowHeight) {
        const {rows} = sleekGrid;
        const row = rows[rowIndex];
        const translation =  rowHeight - row.height;
        const cssHeight = `${rowHeight}px`;

        for (const {style} of scrollArea.querySelectorAll(`.r-${rowIndex}`)) {
            style.height = cssHeight;
        }
        for (const {style, offsetTop} of leftHeader.querySelectorAll(`.r-${rowIndex} ~ .cell`)) {
            style.top = `${offsetTop + translation}px`;
        }
        let rowElement = sheet.querySelector(`[row="${rowIndex}"]`);
        let nextRowIndex = rowIndex + 1;
        while ((rowElement = rowElement.nextSibling)) {
            const rowTop = rows[nextRowIndex++].top += translation;
            rowElement.style.transform = `translateY(${rowTop}px)`;
        }
        while (nextRowIndex < rows.length) {
            rows[nextRowIndex++].top += translation;
        }

        row.height = rowHeight;

        sleekGrid.viewPortRange.refresh(translation);
    }

    // =========================================================================================================
    // VIEWPORT LISTENERS
    // =========================================================================================================

    for (const [type, handlers] of Object.entries({
        mousedown: {
            "stub handle width-handle": createDragHandler(headerWidthResizeCallback),
            "stub handle height-handle": createDragHandler(headerHeightResizeCallback),
            "handle width-handle": createDragHandler(columnResizeCallback),
            "handle height-handle": createDragHandler(rowResizeCallback),
        },
        dblclick: {
            "handle width-handle": createAutosizeHandler(columnFitCallback, maxWidth),
            "handle height-handle": createAutosizeHandler(rowFitCallback, maxHeight)
        }
    })) {
        viewPort.addEventListener(type, event => {
            const handler = handlers[event.target.className];
            if (handler) {
                handler(event);
            }
        });
    }

});

SleekGrid.features.after(function connectedCallback() {
    this.updateHeaderWidth();
    this.updateHeaderHeight();
});

SleekGrid.features.after(function disconnectedCallback() {
    style.setProperty("--header-width", null);
    style.setProperty("--header-height", null);
    style.setProperty("--header-padding", null);
});
