import {SleekGrid} from "../sleek-grid.js";
import {textWidth} from "../utility.mjs";

function importColumns(columns, columnWidth) {
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

function importRows(rows, rowHeight) {
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

function autosizeColumns({mode, columns, rows, viewPort}) {
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

function autosizeRows(properties) {
    return () => 32;
}

SleekGrid.features.before("render", next => function autosize(props) {

    if (props.columns[0]?.left === undefined || props.rows[0]?.top === undefined) {
        const args = {mode: this.autosize, ...props, ...this.viewPort.getBoundingClientRect()};
        props.columns = importColumns(props.columns, autosizeColumns(args));
        props.rows = importRows(props.rows, autosizeRows(args));
    }

    next(props);
});
