export function ViewPortRange(grid) {

    const HZ_OVERFLOW = 3 * 150;
    const VT_OVERFLOW = 3 * 32;

    const {
        columns,
        rows,
        scrollArea: {
            clientWidth: totalWidth, clientHeight: totalHeight
        },
        viewPort: {
            scrollLeft, scrollTop, clientWidth, clientHeight
        }
    } = grid;

    const binarySearchThresholdX = Math.log2(columns.length) * totalWidth / columns.length;
    const binarySearchThresholdY = Math.log2(rows.length) * totalHeight / rows.length;

    const left = Math.max(0, scrollLeft - HZ_OVERFLOW);
    const right = Math.min(totalWidth, scrollLeft + clientWidth + HZ_OVERFLOW);
    const top = Math.max(0, scrollTop, -VT_OVERFLOW);
    const bottom = Math.min(totalHeight, scrollTop + clientHeight + VT_OVERFLOW);

    const state = {

        left: left,
        top: top,
        right: right,
        bottom: bottom,

        topIndex: rowIndex(top),
        bottomIndex: rows.length ? 1 + rowIndex(bottom - 1) : 0,
        leftIndex: columnIndex(left),
        rightIndex: columns.length ? 1 + columnIndex(right - 1) : 0,

        previous: null
    };

    function update({scrollLeft, scrollTop, clientWidth, clientHeight}) {

        const left = Math.max(0, scrollLeft - HZ_OVERFLOW);
        const right = Math.min(totalWidth, scrollLeft + clientWidth + HZ_OVERFLOW);
        const top = Math.max(0, scrollTop - VT_OVERFLOW);
        const bottom = Math.min(totalHeight, scrollTop + clientHeight + VT_OVERFLOW);

        state.previous = {
            topIndex: state.topIndex,
            bottomIndex: state.bottomIndex,
            leftIndex: state.leftIndex,
            rightIndex: state.rightIndex
        }

        if (top < state.top) {
            if (top < state.top - binarySearchThresholdY) {
                state.topIndex = rowIndex(top, 0, state.topIndex);
            } else {
                state.topIndex = moveUp(top, state.topIndex);
            }
        }

        if (bottom < state.bottom) {
            if (bottom < state.bottom - binarySearchThresholdY) {
                state.bottomIndex = 1 + rowIndex(bottom - 1, state.topIndex, state.bottomIndex - 1);
            } else {
                state.bottomIndex = 1 + moveUp(bottom - 1, state.bottomIndex - 1);
            }
        }

        if (bottom > state.bottom) {
            if (bottom > state.bottom + binarySearchThresholdY) {
                state.bottomIndex = 1 + rowIndex(bottom - 1, state.bottomIndex - 1);
            } else {
                state.bottomIndex = 1 + moveDown(bottom - 1, state.bottomIndex - 1);
            }
        }

        if (top > state.top) {
            if (top > state.top + binarySearchThresholdY) {
                state.topIndex = rowIndex(top, state.topIndex, state.bottomIndex - 1);
            } else {
                state.topIndex = moveDown(top, state.topIndex);
            }
        }

        if (left < state.left) {
            if (left < state.left - binarySearchThresholdX) {
                state.leftIndex = columnIndex(left, 0, state.leftIndex);
            } else {
                state.leftIndex = moveLeft(left, state.leftIndex);
            }
        }

        if (right < state.right) {
            if (right < state.right - binarySearchThresholdX) {
                state.rightIndex = 1 + columnIndex(right - 1, state.leftIndex, state.rightIndex - 1);
            } else {
                state.rightIndex = 1 + moveLeft(right - 1, state.rightIndex - 1);
            }
        }

        if (right > state.right) {
            if (right > state.right + binarySearchThresholdX) {
                state.rightIndex = 1 + columnIndex(right - 1, state.rightIndex - 1);
            } else {
                state.rightIndex = 1 + moveRight(right - 1, state.rightIndex - 1);
            }
        }

        if (left > state.left) {
            if (left > state.left + binarySearchThresholdX) {
                state.leftIndex = columnIndex(left, state.leftIndex, state.rightIndex - 1);
            } else {
                state.leftIndex = moveRight(left, state.leftIndex);
            }
        }

        state.left = left;
        state.right = right;
        state.top = top;
        state.bottom = bottom;

        return state;
    }

    update.state = state;

    update.refresh = function (offset) {
        state.right += offset;
        state.bottom += offset;
        grid.refresh();
    }

    return update;

    function columnIndex(edge, start = 0, end = columns.length - 1) {
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

    function rowIndex(edge, start = 0, end = rows.length - 1) {
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

    function moveUp(top, rowIndex) {
        let row;
        while ((row = rows[rowIndex]) && row.top > top) {
            rowIndex--;
        }
        return row ? rowIndex : 0;
    }

    function moveDown(top, rowIndex) {
        let row;
        while ((row = rows[rowIndex]) && row.top + row.height <= top) {
            rowIndex++;
        }
        return row ? rowIndex : rows.length - 1;
    }

    function moveLeft(left, columnIndex) {
        let column;
        while ((column = columns[columnIndex]) && column.left > left) {
            columnIndex--;
        }
        return column ? columnIndex : 0;
    }

    function moveRight(left, columnIndex) {
        let column;
        while ((column = columns[columnIndex]) && column.left + column.width <= left) {
            columnIndex++;
        }
        return column ? columnIndex : columns.length - 1;

    }
}
