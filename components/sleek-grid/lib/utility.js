export function createTemplate(innerHTML) {
    const template = document.createElement("template");
    template.innerHTML = innerHTML;
    return () => template.content.cloneNode(true);
}

export function totalColumnWidth(width, column) {
    column.left = width;
    return width + column.width;
}

export function totalRowHeight(height, row) {
    row.top = height;
    return height + row.height;
}

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

const EMPTY_RANGE = [0, 0];

export function visibleRange(items, pos, dim, min, max, mid = 0) {
    if (items.length === 0) {
        return EMPTY_RANGE;
    }
    const item = items[mid++];
    let d = item[pos] + item[dim] - min;
    if (d < 0) {
        let start = mid, end = items.length >> 1;
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

export function textWidth(text) {
    return text ? String(text).length * 12.5 : 20;
}

export function createCapturingHandler(callback) {
    return function (event) {
        event.preventDefault();
        event.stopPropagation();
        return callback(event);
    }
}

export function createDragHandler(triggerHandler) {
    return triggerEvent => {
        triggerEvent.preventDefault();
        triggerEvent.stopPropagation();
        const handle = triggerEvent.target;
        handle.classList.add("active");
        const dragHandler = triggerHandler(triggerEvent, handle);
        const mouseDragHandler = dragEvent => {
            dragEvent.preventDefault();
            const primaryButtonPressed = dragEvent.buttons === 1;
            if (!primaryButtonPressed) {
                handle.classList.remove("active");
                document.body.removeEventListener("pointermove", mouseDragHandler);
                return;
            }
            dragHandler(dragEvent);
        };
        document.body.addEventListener("pointermove", mouseDragHandler);
    }
}
