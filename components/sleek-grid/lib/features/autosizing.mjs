import {textWidth} from "../utility.mjs";

export function importColumns(columns, columnWidth) {
    const imported = new Array(columns.length);
    let left = 0, index = 0;
    while (index < columns.length) {
        const column = columns[index];
        const width = columnWidth(column, index);
        imported[index++] = {
            ...column,
            left,
            width
        };
        left += width;
    }
    return imported;
}

export function importRows(rows, rowHeight) {
    const imported = new Array(rows.length);
    let top = 0, index = 0;
    while (index < rows.length) {
        const row = rows[index];
        const height = rowHeight(row, index);
        imported[index++] = {
            ...row,
            top,
            height
        };
        top += height;
    }
    return imported;
}

export function autosizeColumns({mode, columns, rows, viewPort}) {
    if (mode === "quick") {
        return function quickTextWidth({label, name}) {
            let width = textWidth(label);
            for (const row of rows) {
                width = Math.max(width, textWidth(row[name]));
            }
            return (.6 * width) + 32;
        };
    } else {
        const width = viewPort.clientWidth / columns.length;
        return () => width;
    }
}

export function autosizeRows(properties) {
    return () => 32;
}
