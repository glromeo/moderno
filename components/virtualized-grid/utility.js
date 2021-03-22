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

const EMPTY_RANGE = [0, 0];

export function visibleRange(items, pos, dim, min, max) {
    if (items.length === 0) {
        return EMPTY_RANGE;
    }
    let mid = 0;
    const item = items[mid++];
    let d = item[pos] + item[dim] - min;
    if (d < 0) {
        let start = 1, end = items.length >> 1;
        while (start < end) {
            const item = items[mid = (start + end) >> 1];
            d = item[pos] + item[dim] - min;
            if (d === 0) break;
            if (d < 0) {
                start = mid + 1;
            } else {
                end = mid - 1;
            }
        }
    }
    let from = mid - 1, start = mid, end = items.length - 1;
    while (start < end) {
        const item = items[mid = (start + end) >> 1];
        d = item[pos] - max;
        if (d === 0) break;
        if (d < 0) {
            start = mid + 1;
        } else {
            end = mid - 1;
        }
    }
    return [from, start];
}
