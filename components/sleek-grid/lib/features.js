import {SleekGrid} from "./sleek-grid.js";

function toggleSort(column) {
    return column.sort = !column.sort ? "asc" : column.sort = column.sort === "asc" ? "desc" : undefined;
}

SleekGrid.prototype.theme = function (theme) {
    if (theme === "light") {
        this.style.setProperty("--primary-color", "dodgerblue");
        this.style.setProperty("--text-color", "black");
        this.style.setProperty("--background-color", "white");
        this.style.setProperty("--even-rows-background", "white");
        this.style.setProperty("--odd-rows-background", "#eee");
        this.style.setProperty("--border-color", "lightgrey");
        this.style.setProperty("--shadow-color", "rgba(0, 0, 0, 0.25)");
        this.style.setProperty("--border-color-active", "black");
        return;
    }
    if (theme === "dark") {
        this.style.setProperty("--primary-color", "dodgerblue");
        this.style.setProperty("--text-color", "white");
        this.style.setProperty("--background-color", "#444");
        this.style.setProperty("--even-rows-background", "#222");
        this.style.setProperty("--odd-rows-background", "#111");
        this.style.setProperty("--border-color", "#333");
        this.style.setProperty("--shadow-color", "rgba(0, 0, 0, 1)");
        this.style.setProperty("--border-color-active", "white");
        return;
    }
    if (theme) {
        if (theme.backgroundColor) this.style.setProperty("--background-color", theme.backgroundColor);
        if (theme.borderColor) this.style.setProperty("--border-color", theme.borderColor);
        if (theme.shadowColor) this.style.setProperty("--shadow-color", theme.shadowColor);
        if (theme.evenRowsBackground) this.style.setProperty("--even-rows-background", theme.evenRowsBackground);
        if (theme.oddRowsBackground) this.style.setProperty("--odd-rows-background", theme.oddRowsBackground);
    }
}

SleekGrid.prototype.columnHeaderCallback = function (cellElement, column, index) {

    cellElement.querySelector(".sort-icon").addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const sort = toggleSort(column);
        for (const active of this.shadowRoot.querySelectorAll(".cell[sort]")) {
            active.removeAttribute("sort");
        }
        if (sort) {
            cellElement.setAttribute("sort", sort);
        }
        this.sort();
    }, true);

    cellElement.querySelector(".search-icon").addEventListener("mousedown", (event) => {
        if (focused) {
            event.target.focus();
        } else {
            event.preventDefault();
            event.stopPropagation();
            input.focus();
        }
    }, true);

    const input = cellElement.querySelector(".search-input");
    let focused;
    input.addEventListener("focus", () => focused = true);
    input.addEventListener("blur", () => focused = false);
    input.addEventListener("input", () => {
        column.search = input.value;
        this.filter();
    });

    cellElement.querySelector(".search-label").addEventListener("click", (event) => {
        const {extentOffset, anchorOffset, focusNode} = this.shadowRoot.getSelection();
        if (extentOffset === anchorOffset || focusNode.parentNode !== event.target) {
            input.focus();
        }
    }, false);

}

