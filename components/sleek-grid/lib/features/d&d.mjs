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

    this.onEnterCell = function (event) {
        const cell = event.target.closest(".cell");
        if (cell.columnIndex !== undefined) {
            event.stopPropagation();
            positionOverlay(highlight, cell);
        }
    };

    const dropzone = document.createElement("div");
    dropzone.id = "dropzone";
    dropzone.className = "c-0 r-0";
    dropzone.columnIndex = undefined;
    shadowRoot.appendChild(dropzone);

    const dragHandlers = {
        "search-label": createDragHandler(columnDragging)
    };

    topHeader.addEventListener("pointerdown", event => {
        const handler = dragHandlers[event.target.className];
        if (handler) {
            handler(event);
        }
    });

    function columnDragging({pageX: initialX, pageY: initialY}, handle, stop) {

        const topHeaderCell = handle.closest(".cell");
        const {columns, leftIndex, rightIndex} = sleekGrid;

        const dragIndex = topHeaderCell.columnIndex;
        const dragColumn = columns[dragIndex];

        let dropIndex = dragIndex;

        const minLeft = columns[leftIndex].left;
        const maxRight = columns[rightIndex - 1].left + columns[rightIndex - 1].width;
        const dragX = dragColumn.left - initialX;

        const ghost = createGhostColumn(sleekGrid, dragIndex, topHeaderCell.getBoundingClientRect());
        viewPort.classList.add("animate");
        viewPort.querySelectorAll(`.c-${dragIndex}`).forEach(cell => {
            cell.classList.add("detached");
        });

        function packLeft(dropX) {
            let index = leftIndex;
            let column = columns[index];
            if (column === dragColumn) {
                column = columns[++index];
            }
            let left = minLeft;
            while (column && left + column.width < dropX) {
                column.left = left;
                left += column.width;
                column = columns[++index];
                if (column === dragColumn) {
                    column = columns[++index];
                }
            }
            dragColumn.left = left;
            return index;
        }

        function packRight(dropX) {
            let index = rightIndex - 1;
            let column = columns[index];
            if (column === dragColumn) {
                column = columns[--index];
            }
            let right = maxRight;
            while (column && right - column.width > dropX) {
                right -= column.width;
                column.left = right;
                column = columns[--index];
                if (column === dragColumn) {
                    column = columns[--index];
                }
            }
            right -= dragColumn.width;
            dragColumn.left = right;
            return index;
        }

        return ({pageX, pageY}) => {
            pageY = Math.max(initialY - 20, Math.min(initialY + 30, pageY));
            if (pageX !== undefined) {
                const dropX = Math.max(0, pageX + dragX);
                if (dropX > dragColumn.left) {
                    dropIndex = packLeft(dropX);
                } else if (dropX < dragColumn.left) {
                    dropIndex = packRight(dropX);
                }
                ghost.style.transform = `translate(${(pageX - initialX)}px, ${(pageY - initialY)}px)`;
                sleekGrid.replaceGridStyle();
            } else {
                viewPort.querySelectorAll(`.c-${dragIndex}`).forEach(cell => {
                    cell.classList.remove("detached");
                });
                viewPort.classList.remove("animate");
                ghost.dispose();

                if (dropIndex !== dragIndex) {
                    if (dragIndex < dropIndex) {
                        --dropIndex;
                    }
                    const sorted = [...sleekGrid.properties.columns];
                    sorted.splice(dropIndex, 0, ...sorted.splice(dragIndex, 1));

                    sleekGrid.requestUpdate({columns: sorted});
                }
            }
        };
    }

    function positionOverlay(target, cell) {
        const {right: viewPortRight, bottom: viewPortBottom} = viewPort.getBoundingClientRect();
        const {left, top, right, bottom} = cell.getBoundingClientRect();
        const width = Math.min(right, viewPortRight) - left;
        const height = Math.min(bottom, viewPortBottom) - top;
        target.columnIndex = cell.columnIndex;
        target.rowIndex = cell.rowIndex;
        target.style.cssText = `transform:translate(${left}px, ${top}px);width:${width - 1}px;height:${height - 1}px`;
    }
};

function createGhostColumn(grid, dragIndex, {left, top, right, bottom}) {
    const {viewPort, sheet, columns, rows, topIndex, bottomIndex} = grid;
    const dragColumn = columns[dragIndex];
    const field = dragColumn.name;

    const ghost = document.createElement("div");
    ghost.id = "ghost";
    ghost.style.cssText = `left:${left - 5}px;top:${top - 5}px;width:${right - left - 20}px;height:${viewPort.clientHeight - 20}px;overflow:hidden;`;
    ghost.innerHTML = `
        <div class="header">${dragColumn.label}</div>
        ${rows.slice(topIndex, bottomIndex).map(row => `
            <div class="${row.index % 2 ? "odd" : "even"} r-${row.index}">${row[field]}</div>    
        `).join("\n")}
    `;
    viewPort.appendChild(ghost);
    requestAnimationFrame(function () {
        ghost.style.opacity = "1";
    });
    ghost.dispose = function () {
        ghost.style.opacity = null;
        setTimeout(function () {
            ghost.remove();
        }, 300);
    };
    return ghost;
}
