
export function calculateScrollbarDimensions() {
    let sample = document.createElement("div");
    sample.style.cssText = `
        width: 100vw;
        height: 100vh;
        overflow: scroll;
        position: fixed;
        visibility: hidden;
	`;
    document.body.appendChild(sample);
    let dimensions = {
        width: sample.offsetWidth - sample.clientWidth,
        height: sample.offsetHeight - sample.clientHeight
    };
    document.body.removeChild(sample);
    return dimensions;
}

const REGEX_SPECIAL_CHARS = /([-*+?.^${}(|)[\]])/g;

export function escapeRegex(str) {
    return str.replace(REGEX_SPECIAL_CHARS, '\\$1');
}

export function toggleSort(column) {
    column.sort = !column.sort ? "asc" : column.sort = column.sort === "asc" ? "desc" : undefined;
}
