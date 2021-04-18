import {SleekGrid} from "../sleek-grid.js";

SleekGrid.features.after(function createdCallback() {
    this.sorted = {}
});

SleekGrid.features.after(function columnHeaderCallback(columnHeader) {

    function toggleSort(column) {
        return column.sort = !column.sort ? "asc" : column.sort = column.sort === "asc" ? "desc" : undefined;
    }

    columnHeader.querySelector(".sort-icon").addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        const {index} = this.columnContext(event);
        toggleSort(this.properties.columns[index]);
        this.requestUpdate({columns: [...this.properties.columns]});
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
