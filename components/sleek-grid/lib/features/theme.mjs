import {SleekGrid} from "../sleek-grid.js";

SleekGrid.features.after(function createdCallback() {
    const {style} = this;

    const theme = this.getAttribute("theme") || "light";

    if (theme === "light") {
        style.setProperty("--primary-color", "dodgerblue");
        style.setProperty("--text-color", "black");
        style.setProperty("--background-color", "white");
        style.setProperty("--even-rows-background", "white");
        style.setProperty("--odd-rows-background", "#eee");
        style.setProperty("--border-color", "lightgrey");
        style.setProperty("--shadow-color", "rgba(0, 0, 0, 0.25)");
        style.setProperty("--border-color-active", "black");
        return;
    }

    if (theme === "dark") {
        style.setProperty("--primary-color", "dodgerblue");
        style.setProperty("--text-color", "white");
        style.setProperty("--background-color", "#444");
        style.setProperty("--even-rows-background", "#222");
        style.setProperty("--odd-rows-background", "#111");
        style.setProperty("--border-color", "#333");
        style.setProperty("--shadow-color", "rgba(0, 0, 0, 1)");
        style.setProperty("--border-color-active", "white");
        return;
    }

    if (theme) {
        if (theme.backgroundColor) {
            style.setProperty("--background-color", theme.backgroundColor);
        }
        if (theme.borderColor) {
            style.setProperty("--border-color", theme.borderColor);
        }
        if (theme.shadowColor) {
            style.setProperty("--shadow-color", theme.shadowColor);
        }
        if (theme.evenRowsBackground) {
            style.setProperty("--even-rows-background", theme.evenRowsBackground);
        }
        if (theme.oddRowsBackground) {
            style.setProperty("--odd-rows-background", theme.oddRowsBackground);
        }
    }
});

