import {SleekGrid} from "../sleek-grid.js";
import {createDragHandler} from "../utility.mjs";

SleekGrid.prototype.dragndrop = function dragndrop() {

    const sleekGrid = this;
    const {shadowRoot, viewPort, sheet, topHeader} = sleekGrid;

    const highlight = document.createElement("div");
    highlight.id = "highlight";
    highlight.className = "c-0 r-0";
    shadowRoot.appendChild(highlight);
    sheet.addEventListener("pointerenter", () => highlight.classList.add("visible"));
    sheet.addEventListener("pointerleave", () => highlight.classList.remove("visible"));

    this.onEnterCell = onEnterCell.bind(this, highlight);

    const dropZone = document.createElement("div");
    dropZone.id = "drop-zone";
    dropZone.className = "c-0 r-0";
    dropZone.columnIndex = undefined;
    shadowRoot.appendChild(dropZone);

    this.onEnterTopHeaderCell = onEnterCell.bind(this, dropZone);

    const dragHandlers = {
        "search-label": createDragHandler(columnDragging)
    };

    topHeader.addEventListener("pointerdown", event => {
        const handler = dragHandlers[event.target.className];
        if (handler) {
            handler(event);
        }
    });

    function columnDragging({pageX: initialX, pageY: initialY}, handle) {
        topHeader.classList.add("dnd");
        dropZone.classList.add("visible");
        const topHeaderCell = handle.closest(".cell");
        const ghost = topHeaderCell.cloneNode(true);
        const {left, top} = topHeaderCell.getBoundingClientRect();
        ghost.id = "ghost";
        ghost.style.cssText = `left:${left - initialX}px;top:${top - initialY - 2}px;transform:translate(${initialX}px,${initialY}px);`;
        viewPort.appendChild(ghost);
        return ({pageX, pageY}) => {
            if (pageX !== undefined) {
                ghost.style.transform = `translate(${pageX}px, ${pageY}px)`;
            } else {
                topHeader.classList.remove("dnd");
                dropZone.classList.remove("visible");
                ghost.remove();
                if (dropZone.columnIndex !== undefined) {
                    sleekGrid.swap(topHeaderCell.columnIndex, dropZone.columnIndex);
                }
                dropZone.columnIndex = undefined;
            }
        };
    }

    function onEnterCell(target, event) {
        const cell = event.target.closest(".cell");
        if (cell.columnIndex !== undefined) {
            event.stopPropagation();
            const {right: viewPortRight, bottom: viewPortBottom} = viewPort.getBoundingClientRect();
            const {left, top, right, bottom} = cell.getBoundingClientRect();
            const width = Math.min(right, viewPortRight) - left;
            const height = Math.min(bottom, viewPortBottom) - top;
            target.columnIndex = cell.columnIndex;
            target.rowIndex = cell.rowIndex;
            target.style.cssText = `transform:translate(${left}px, ${top}px);width:${width - 1}px;height:${height - 1}px`;
        }
    };
};
