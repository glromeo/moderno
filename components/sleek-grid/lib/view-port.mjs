const HZ_OVERFLOW = 3 * 150;
const VT_OVERFLOW = 3 * 32;

export function ViewPortRange(grid) {

    const {viewPort, gridStyle} = grid;

    let {columns, rows} = grid;
    let [sheetWidth, sheetHeight] = [totalWidth(columns), totalHeight(rows)];

    this.left = Math.max(0, viewPort.scrollLeft - HZ_OVERFLOW);
    this.top = Math.max(0, viewPort.scrollTop, -VT_OVERFLOW);
    this.right = Math.min(sheetWidth, viewPort.scrollLeft + viewPort.clientWidth + HZ_OVERFLOW);
    this.bottom = Math.min(sheetHeight, viewPort.scrollTop + viewPort.clientHeight + VT_OVERFLOW);

    this.topIndex = findRowIndex(this.top);
    this.bottomIndex = rows.length ? 1 + findRowIndex(this.bottom - 1) : 0;
    this.leftIndex = findColumnIndex(this.left);
    this.rightIndex = columns.length ? 1 + findColumnIndex(this.right - 1) : 0;

    let previous = {};

    const updateViewPort = () => {

        previous = {
            topIndex: this.topIndex,
            bottomIndex: this.bottomIndex,
            leftIndex: this.leftIndex,
            rightIndex: this.rightIndex
        };

        this.left = Math.max(0, viewPort.scrollLeft - HZ_OVERFLOW);
        this.top = Math.max(0, viewPort.scrollTop - VT_OVERFLOW);
        this.right = Math.min(sheetWidth, viewPort.scrollLeft + viewPort.clientWidth + HZ_OVERFLOW);
        this.bottom = Math.min(sheetHeight, viewPort.scrollTop + viewPort.clientHeight + VT_OVERFLOW);

        this.topIndex = findRowIndex(this.top);
        this.bottomIndex = rows.length ? 1 + findRowIndex(this.bottom - 1) : 0;
        this.leftIndex = findColumnIndex(this.left);
        this.rightIndex = columns.length ? 1 + findColumnIndex(this.right - 1) : 0;

        updateGridStyle(this);
    };

    function updateGridStyle({topIndex, bottomIndex, leftIndex, rightIndex}) {
        let style = "";
        for (let columnIndex = leftIndex; columnIndex < rightIndex; ++columnIndex) {
            const {left, width} = columns[columnIndex];
            style += `.c-${columnIndex}{left:${left}px;width:${width}px;}\n`;
        }
        for (let rowIndex = topIndex; rowIndex < bottomIndex; ++rowIndex) {
            const {top, height} = rows[rowIndex];
            style += `.r-${rowIndex}{transform:translateY(${top}px);height:${height}px;}\n`;
        }
        gridStyle.replace(style);
    }

    function findColumnIndex(edge, start = 0, end = columns.length - 1) {
        let middle, distance;
        while (start < end) {
            middle = (start + end) >> 1;
            const {left, width} = columns[middle];
            distance = edge - left;
            if (distance >= width) {
                start = middle + 1; // search to the right
            } else if (distance < 0) {
                end = middle - 1; // search to the left
            } else {
                return middle;
            }
        }
        return start;
    }

    function findRowIndex(edge, start = 0, end = rows.length - 1) {
        let middle, distance;
        while (start < end) {
            middle = (start + end) >> 1;
            const {top, height} = rows[middle];
            distance = edge - top;
            if (distance >= height) {
                start = middle + 1; // search to the bottom
            } else if (distance < 0) {
                end = middle - 1; // search to the top
            } else {
                return middle;
            }
        }
        return start;
    }

    Object.defineProperty(this, "properties", {
        set: properties => {
            let shouldUpdate;

            if (columns !== properties.columns) {
                columns = properties.columns;
                sheetWidth = totalWidth(columns);
                if (sheetWidth) {
                    grid.style.setProperty("--sheet-width", `${sheetWidth}px`);
                } else {
                    grid.style.setProperty("--sheet-width", "auto");
                }
                shouldUpdate = true;
            }

            if (rows !== properties.rows) {
                rows = properties.rows;
                sheetHeight = totalHeight(rows);
                if (sheetHeight) {
                    grid.style.setProperty("--sheet-height", `${sheetHeight}px`);
                } else {
                    grid.style.setProperty("--sheet-height", "auto");
                }
                shouldUpdate = true;
            }

            if (shouldUpdate) {
                updateViewPort();
            }
        }
    });

    this.resize = () => {
        throw new Error("No onchange callback assigned");
    };

    Object.defineProperty(this, "onchange", {
        set: callback => {

            this.resize = (columnTranslation, rowTranslation) => {
                if (columnTranslation) {
                    this.right += columnTranslation;
                }
                if (rowTranslation) {
                    this.bottom += rowTranslation;
                }
                updateViewPort();
                callback.call(grid, this, previous);
            };

            const resize = () => {
                updateViewPort();
                callback.call(grid, this, previous);
            };

            const observer = new ResizeObserver(resize);
            observer.observe(viewPort);
            viewPort.addEventListener("scroll", resize, {passive: true});

            this.destroy = function () {
                observer.disconnect();
                viewPort.removeEventListener("scroll", resize, {passive: true});
            };
        }
    });
}

function totalWidth(columns) {
    const column = columns[columns.length - 1];
    return column ? column.left + column.width : 0;
}

function totalHeight(rows) {
    const row = rows[rows.length - 1];
    return row ? row.top + row.height : 0;
}
