
export default function (sleekGrid) {

    const {
        createTopHeaderCellCell,
        updateHeaderHeight,
        properties,
        render,
    } = sleekGrid;

    sleekGrid.createTopHeaderCellCell = function (columnIndex, recycled) {


        function getColumn(headerCell) {
            return sleekGrid.columns[headerCell.columnIndex];
        }

        searchLabel.addEventListener("click", (event) => {

            const column = getColumn(headerCell);
            if (column.dragging) return;
        }, false);

        searchLabel.addEventListener("pointerdown", () => {

            // column.dragging = true;

            // this.shadowRoot.adoptedStyleSheets[3].replaceSync(`
            //     .c-${column.index} {
            //         box-shadow: 10px 10px 10px black;
            //         z-index: 100;
            //     }
            // `)
            //
            // document.addEventListener("mousemove", (event)=>{
            //     this.shadowRoot.adoptedStyleSheets[3].replaceSync(`
            //     .c-${column.index} {
            //         box-shadow: 10px 10px 10px black;
            //         z-index: 100;
            //         transform: translate(${event.offsetX}px, ${event.offsetY}px);
            //     }
            // `)

            // });
        });

        sortIcon.addEventListener("click", (event) => {

        }, true);

        return headerCell;
    }


    swap(leftIndex, rightIndex) {

        const tx = this.columns[leftIndex].width;
        this.columns[leftIndex].hidden = true;

        const columnNodes = this.viewPort.querySelectorAll(`.c-${leftIndex}`);
        columnNodes.forEach(cell => cell.classList.add("hidden"));
        for (let i = leftIndex + 1; i < this.columns.length; i++) {
            this.viewPort.querySelectorAll(`.c-${i}`).forEach(cell => {
                cell.style.transform = `translate(-${tx}px, 0)`
            });
        }

        const nextSiblingCell = columnNodes.item(1).nextSibling;
        nextSiblingCell.addEventListener("transitionend", () => {
            this.columns.splice(leftIndex, 1);
            // this.updateTotalWidth(this.columns);
            this.viewPortScrollCallback();
            this.updateStyle();
        });

        return () => {
            columnNodes.forEach(cell => cell.classList.remove("hidden"));
            for (let i = leftIndex + 1; i < this.columns.length; i++) {
                this.viewPort.querySelectorAll(`.c-${i}`).forEach(cell => {
                    cell.style.transform = null;
                });
            }
            nextSiblingCell.addEventListener("transitionend", () => {
                this.columns.splice(leftIndex, 1);
                // this.updateTotalWidth(this.columns);
                this.viewPortScrollCallback();
                this.updateStyle();
            });
        }
    }

    deleteColumn(columnIndex) {
        const {index, width: horizontalShift} = this.columns[columnIndex];

        const nodeColumn = this.viewPort.querySelectorAll(`.c-${index}`);

        this.enterRight(this.viewPort.scrollLeft + this.viewPort.clientWidth + horizontalShift);

        nodeColumn.forEach(cell => {
            cell.classList.add("hidden");
            while ((cell = cell.nextSibling)) {
                cell.classList.add("translated");
                cell.style.transform = `translate(-${horizontalShift}px, 0)`;
            }
        });

        setTimeout(() => {
            this.columns.splice(columnIndex, 1);
            this.rightIndex--;
            // this.updateTotalWidth(this.columns);
            this.updateStyle();
            nodeColumn.forEach(cell => {
                let sibling = cell.nextSibling;
                while (sibling) {
                    sibling.classList.remove("translated");
                    sibling.style.transform = null;
                    sibling = sibling.nextSibling
                }
            });
        }, 500); // keep this in synch with the transition!
    }

    insertColumn(columnIndex, column = this.properties.columns[columnIndex]) {
        let headerSiblingCell = this.topHeader.querySelector(`.c-${columnIndex + 1}`);

        for (let i = this.columns.length - 1; i >= columnIndex; i--) {
            this.viewPort.querySelectorAll(`.c-${i}`).forEach(cell => {
                cell.classList.remove(`c-${i}`);
                cell.classList.add(`c-${i + 1}`);
            });
        }

        this.columns.splice(columnIndex, 0, {...column});

        this.columns.forEach((column, index) => columnIndex = index);

        let innerHTML = createTopHeaderCellCell(index);
        this.rows.slice(this.topIndex, this.bottomIndex).forEach((row, index) => {
            innerHTML += createCell(column, row);
        });
        let template = document.createElement("div");
        template.innerHTML = innerHTML;
        if (headerSiblingCell) {
            this.topHeader.insertBefore(template.firstChild, headerSiblingCell);
            this.sheet.querySelectorAll(`.c-${index + 1}`).forEach(cell => {
                cell.parentElement.insertBefore(template.firstChild, cell);
            });
        } else {
            this.topHeader.appendChild(template.firstChild);
            this.sheet.querySelectorAll(`.row`).forEach(row => {
                row.appendChild(template.firstChild);
            });
        }
        // this.updateTotalWidth(this.columns);
        this.viewPortScrollCallback();
        this.updateStyle();
    }
}
