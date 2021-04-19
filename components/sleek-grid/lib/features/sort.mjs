import {SleekGrid} from "../sleek-grid.js";

SleekGrid.features.after(function createdCallback() {
    this.sorted = {};
});

SleekGrid.features.after(function columnHeaderCallback(columnHeader) {
    columnHeader.querySelector(".sort-icon").addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        const {index: columnIndex} = this.columnContext(event);
        this.requestUpdate({
            columns: [...this.properties.columns.map((column, index) => {
                if (index === columnIndex) {
                    return {...column, sort: !column.sort ? "asc" : column.sort === "asc" ? "desc" : undefined};
                } else {
                    return {...column, sort: undefined};
                }
            })]
        });
    });
});

SleekGrid.features.before("render", next => function sort({columns, rows}) {

    const sorted = this.sorted;

    if (columns !== this.properties.columns || rows !== this.properties.rows) {

        sorted.columns = columns;

        let column = columns.find(column => column.sort), sorting;
        if (column) {
            sorting = column.sort === "asc" ? 1 : -1;
        } else {
            sorting = undefined;
            sorted.rows = rows;
        }

        if (sorting) {
            const name = column.name;
            sorted.rows = [...rows].sort(function (leftRow, rightRow) {
                const leftCell = leftRow[name];
                const rightCell = rightRow[name];
                return leftCell === rightCell ? 0 : leftCell < rightCell ? -sorting : sorting;
            });
        } else {
            sorted.rows = rows;
        }
    }

    next(sorted);
});
