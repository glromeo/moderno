const HZ_OVERFLOW = 0; // 3 * 150;
const VT_OVERFLOW = 0; // 3 * 32;

export function ViewPortRange(grid) {

    const {viewPort} = grid;

    let {columns, rows} = grid;
    let [sheetWidth, sheetHeight] = [totalWidth(columns), totalHeight(rows)];
    let binarySearchThresholdX = Math.log2(columns.length) * sheetWidth / columns.length;
    let binarySearchThresholdY = Math.log2(rows.length) * sheetHeight / rows.length;

    this.left = Math.max(0, viewPort.scrollLeft - HZ_OVERFLOW);
    this.top = Math.max(0, viewPort.scrollTop, -VT_OVERFLOW);
    this.right = Math.min(sheetWidth, viewPort.scrollLeft + viewPort.clientWidth + HZ_OVERFLOW);
    this.bottom = Math.min(sheetHeight, viewPort.scrollTop + viewPort.clientHeight + VT_OVERFLOW);

    this.topIndex = findRowIndex(this.top);
    this.bottomIndex = rows.length ? 1 + findRowIndex(this.bottom - 1) : 0;
    this.leftIndex = findColumnIndex(this.left);
    this.rightIndex = columns.length ? 1 + findColumnIndex(this.right - 1) : 0;

    let previous = {};

    const update = () => {

        previous = {
            topIndex: this.topIndex,
            bottomIndex: this.bottomIndex,
            leftIndex: this.leftIndex,
            rightIndex: this.rightIndex
        };

        const {scrollLeft, scrollTop, clientWidth, clientHeight} = viewPort;

        const left = Math.max(0, scrollLeft - HZ_OVERFLOW);
        const top = Math.max(0, scrollTop - VT_OVERFLOW);
        const right = Math.min(sheetWidth, scrollLeft + clientWidth + HZ_OVERFLOW);
        const bottom = Math.min(sheetHeight, scrollTop + clientHeight + VT_OVERFLOW);

        if (this.bottomIndex <= 0) {
            this.bottomIndex = rows.length ? 1 + findRowIndex(bottom - 1) : 0;
        } else {
            if (top < this.top) {
                if (top < this.top - binarySearchThresholdY) {
                    this.topIndex = findRowIndex(top, 0, this.topIndex);
                } else {
                    this.topIndex = decreaseRowIndex(top, this.topIndex);
                }
            }
            if (bottom < this.bottom) {
                if (bottom < this.bottom - binarySearchThresholdY) {
                    this.bottomIndex = 1 + findRowIndex(bottom - 1, this.topIndex, this.bottomIndex - 1);
                } else {
                    this.bottomIndex = 1 + decreaseRowIndex(bottom - 1, this.bottomIndex - 1);
                }
            }
            if (bottom > this.bottom) {
                if (bottom > this.bottom + binarySearchThresholdY) {
                    this.bottomIndex = 1 + findRowIndex(bottom - 1, this.bottomIndex - 1);
                } else {
                    this.bottomIndex = 1 + increaseRowIndex(bottom - 1, this.bottomIndex - 1);
                }
            }
            if (top > this.top) {
                if (top > this.top + binarySearchThresholdY) {
                    this.topIndex = findRowIndex(top, this.topIndex, this.bottomIndex - 1);
                } else {
                    this.topIndex = increaseRowIndex(top, this.topIndex);
                }
            }
        }

        if (this.rightIndex <= 0) {
            this.rightIndex = columns.length ? 1 + findColumnIndex(right - 1) : 0;
        } else {
            if (left < this.left) {
                if (left < this.left - binarySearchThresholdX) {
                    this.leftIndex = findColumnIndex(left, 0, this.leftIndex);
                } else {
                    this.leftIndex = decreaseColumnIndex(left, this.leftIndex);
                }
            }
            if (right < this.right) {
                if (right < this.right - binarySearchThresholdX) {
                    this.rightIndex = 1 + findColumnIndex(right - 1, this.leftIndex, this.rightIndex - 1);
                } else {
                    this.rightIndex = 1 + decreaseColumnIndex(right - 1, this.rightIndex - 1);
                }
            }
            if (right > this.right) {
                if (right > this.right + binarySearchThresholdX) {
                    this.rightIndex = 1 + findColumnIndex(right - 1, this.rightIndex - 1);
                } else {
                    this.rightIndex = 1 + increaseColumnIndex(right - 1, this.rightIndex - 1);
                }
            }
            if (left > this.left) {
                if (left > this.left + binarySearchThresholdX) {
                    this.leftIndex = findColumnIndex(left, this.leftIndex, this.rightIndex - 1);
                } else {
                    this.leftIndex = increaseColumnIndex(left, this.leftIndex);
                }
            }
        }

        this.left = left;
        this.right = right;
        this.top = top;
        this.bottom = bottom;
    };

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

    function decreaseRowIndex(edge, rowIndex) {
        let row;
        while ((row = rows[rowIndex]) && row.top > edge) {
            rowIndex--;
        }
        return row ? rowIndex : 0;
    }

    function increaseRowIndex(edge, rowIndex) {
        let row;
        while ((row = rows[rowIndex]) && row.top + row.height <= edge) {
            rowIndex++;
        }
        return row ? rowIndex : rows.length - 1;
    }

    function decreaseColumnIndex(edge, columnIndex) {
        let column;
        while ((column = columns[columnIndex]) && column.left > edge) {
            columnIndex--;
        }
        return column ? columnIndex : 0;
    }

    function increaseColumnIndex(edge, columnIndex) {
        let column;
        while ((column = columns[columnIndex]) && column.left + column.width <= edge) {
            columnIndex++;
        }
        return column ? columnIndex : columns.length - 1;
    }

    Object.defineProperty(this, "properties", {
        set: properties => {
            let shouldUpdate;

            if (columns !== properties.columns) {
                columns = properties.columns;
                sheetWidth = totalWidth(columns);
                if (sheetWidth) {
                    grid.style.setProperty("--sheet-width", `${sheetWidth}px`);
                    binarySearchThresholdX = Math.log2(columns.length) * sheetWidth / columns.length;
                } else {
                    grid.style.setProperty("--sheet-width", "auto");
                    binarySearchThresholdX = 0;
                }
                shouldUpdate = true;
            }

            if (rows !== properties.rows) {
                rows = properties.rows;
                sheetHeight = totalHeight(rows);
                if (sheetHeight) {
                    grid.style.setProperty("--sheet-height", `${sheetHeight}px`);
                    binarySearchThresholdY = Math.log2(rows.length) * sheetHeight / rows.length;
                } else {
                    grid.style.setProperty("--sheet-height", "auto");
                    binarySearchThresholdY = 0;
                }
                shouldUpdate = true;
            }

            if (shouldUpdate) {
                this.bottomIndex = Math.min(this.bottomIndex, rows.length);
                this.rightIndex = Math.min(this.rightIndex, columns.length);
                update();
            }
        }
    });

    this.resize = () => {
        throw new Error("No onchange callback assigned");
    };

    Object.defineProperty(this, "onchange", {
        set: callback => {

            let animationFrame;

            this.resize = (columnTranslation, rowTranslation) => {
                if (!animationFrame) animationFrame = requestAnimationFrame(() => {
                    animationFrame = null;
                    if (columnTranslation) {
                        this.right += columnTranslation;
                    }
                    if (rowTranslation) {
                        this.bottom += rowTranslation;
                    }
                    update();
                    callback.call(grid, this, previous);
                });
            };

            const resize = () => {
                if (!animationFrame) animationFrame = requestAnimationFrame(() => {
                    animationFrame = null;
                    update();
                    callback.call(grid, this, previous);
                });
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
