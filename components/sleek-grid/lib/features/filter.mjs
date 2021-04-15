import {SleekGrid} from "../sleek-grid.js";
import {escapeRegex, sourceURL} from "../utility.mjs";

SleekGrid.features.after(function createdCallback() {
    this.filtered = {}
});

SleekGrid.features.after(function columnHeaderCallback(columnHeader) {

    const searchInput = columnHeader.lastChild.firstChild;
    const searchLabel = searchInput.nextSibling.nextSibling;
    const searchIcon = searchLabel.nextSibling;

    let focused;
    searchInput.addEventListener("focus", () => {
        focused = true;
        searchInput.closest(".cell").scrollIntoView({behavior: "smooth", block: "end", inline: "nearest"});
    });
    searchInput.addEventListener("blur", () => focused = false);
    searchInput.addEventListener("input", event => {
        const {index} = this.columnContext(event);
        this.properties.columns[index].search = searchInput.value;
        this.requestUpdate({columns: [...this.properties.columns]});
    });
    searchIcon.addEventListener("mousedown", (event) => {
        if (focused) {
            event.target.focus();
        } else {
            event.preventDefault();
            event.stopPropagation();
            searchInput.focus();
        }
    }, true);
    searchLabel.addEventListener("click", (event) => {
        const {extentOffset, anchorOffset, focusNode} = this.shadowRoot.getSelection();
        if (extentOffset === anchorOffset || focusNode.parentNode !== event.target) {
            searchInput.focus();
        }
    }, false);
});

function createFilter(columns, filterId) {
    const filters = [];
    const body = columns.reduce((code, {name, search}, index) => {
        if (search) {
            const filter = new RegExp(escapeRegex(search).replace(/\\\*/g, ".*"), "i");
            filters.push(filter);
            const field = JSON.stringify(name);
            return code + `\n&& this[${filters.length - 1}].test(row[${field}]) // [${index}] ${field} ${filter}`
        } else {
            return code;
        }
    }, "return true") + "\n" + sourceURL("filter", `sleek-grid[grid-id="${filterId}"]`);
    if (filters.length > 0) {
        return new Function("row", body).bind(filters);
    }
}

function apply(filter, rows) {
    if (filter) {
        rows = rows.filter(filter);
        if (rows.length === 0) {
            return [columns.reduce(function (row, column) {
                if (column.search) {
                    row[column.name] = "NO MATCH";
                }
                return row;
            }, {})]
        }
    }
    return rows;
}

SleekGrid.features.before("render", next => function filter({columns, rows}) {

    const filtered = this.filtered;

    if (columns !== this.properties.columns) {
        filtered.columns = columns.filter(column => !column.disabled);
        this.filter = createFilter(filtered.columns, this.getAttribute("grid-id"));
        filtered.rows = apply(this.filter, rows);
    }

    if (rows !== this.properties.rows) {
        filtered.rows = apply(this.filter, rows);
    }

    console.log("filtered", filtered);

    next(filtered);
});
