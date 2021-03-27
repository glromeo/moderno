export function renderDynamicStyle(grid) {

    const {
        columns,
        rows,
        leftIndex,
        rightIndex,
        topIndex,
        bottomIndex,
        headerHeight,
        headerWidth,
        totalWidth,
        totalHeight
    } = grid;

    let style = `.handle[row]{width:${headerWidth}px;}\n.handle[column]{height:${headerHeight}px;}\n`;
    for (const {index, left, width} of columns.slice(leftIndex, rightIndex)) {
        style += `.c-${index}{left:${left}px;width:${width}px;}\n`;
    }
    for (const {height, index, top} of rows.slice(topIndex, bottomIndex)) {
        style += `.r-${index}{top:${top}px;height:${height}px;}\n`;
    }

    style += `
        #stub .overflow.right {
            left:${headerWidth}px;
            height:${headerHeight}px;
        }
        #stub .overflow.bottom {
            top:${headerHeight}px;
            width:${headerWidth}px;
        }
        #top-header {
            margin-left:${headerWidth}px;
            height:${headerHeight}px;
            width:${totalWidth - 2}px;
        }
        #left-header {
            width:${headerWidth}px;
            height:${totalHeight - headerHeight}px;
        }
        #sheet {
            top:${headerHeight}px;
            left:${headerWidth}px;
        }
    `;

    return style;
}
