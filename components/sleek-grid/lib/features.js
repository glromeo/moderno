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

const configureTopHeaderCell = SleekGrid.prototype.configureTopHeaderCell;

SleekGrid.prototype.configureTopHeaderCell = function (headerCell, column) {

    configureTopHeaderCell.call(this, headerCell, column);

    const searchInput = headerCell.lastElementChild.firstElementChild;
    const searchLabel = searchInput.nextElementSibling.nextElementSibling;
    const sortIcon = searchLabel.firstElementChild;
    const searchIcon = searchLabel.nextElementSibling;

    let focused;
    searchInput.addEventListener("focus", () => focused = true);
    searchInput.addEventListener("blur", () => focused = false);
    searchInput.addEventListener("input", () => {
        column.search = searchInput.value;
        this.filter();
    });

    searchLabel.addEventListener("click", (event) => {
        const {extentOffset, anchorOffset, focusNode} = this.shadowRoot.getSelection();
        if (extentOffset === anchorOffset || focusNode.parentNode !== event.target) {
            searchInput.focus();
        }
    }, false);

    sortIcon.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const sort = toggleSort(column);
        for (const active of this.shadowRoot.querySelectorAll(".cell[sort]")) {
            active.removeAttribute("sort");
        }
        if (sort) {
            headerCell.setAttribute("sort", sort);
        }
        this.sort();
    }, true);

    searchIcon.addEventListener("mousedown", (event) => {
        if (focused) {
            event.target.focus();
        } else {
            event.preventDefault();
            event.stopPropagation();
            searchInput.focus();
        }
    }, true);

}

const updateHeaderHeight = SleekGrid.prototype.updateHeaderDimensions;

SleekGrid.prototype.updateHeaderDimensions = function () {
    updateHeaderHeight.call(this);
    const headerPadding = Math.min(8, Math.max(2, 2 + (this.headerHeight - 32) * 6 / 10));
    this.viewPort.style.setProperty("--header-padding", `${headerPadding}px`);
}
