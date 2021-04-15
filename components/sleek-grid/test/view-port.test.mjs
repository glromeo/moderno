import {importColumns, importRows} from "../lib/utility.mjs";
import {ViewPortRange} from "../lib/view-port.mjs";

describe("view-port", function () {

    it("move around", function () {

        let columns = new Array(100).fill({width: 30});
        columns = importColumns(columns, c => c.width);
        let rows = new Array(100).fill({height: 20});
        rows = importRows(rows, r => r.height);

        let {left, width} = columns[columns.length - 1];
        let {top, height} = rows[rows.length - 1];
        let totalWidth = left + width;
        let totalHeight = top + height;

        expect(totalWidth).toBe(3000);
        expect(totalHeight).toBe(2000);

        let viewPortRange = new ViewPortRange({
            columns: columns,
            rows: rows,
            scrollArea: {
                clientWidth: totalWidth,
                clientHeight: totalHeight
            },
            viewPort: {
                scrollLeft: 0,
                scrollTop: 0,
                clientWidth: 100,
                clientHeight: 100
            }
        });

        expect(viewPortRange({
            scrollLeft: 0,
            scrollTop: 0,
            clientWidth: 100,
            clientHeight: 100
        })).toMatchObject({
            leftIndex: 0,
            topIndex: 0,
            rightIndex: 4 /* 3.333... */,
            bottomIndex: 5
        });

        expect(viewPortRange({
            scrollLeft: 1,
            scrollTop: 1,
            clientWidth: 100,
            clientHeight: 100
        })).toMatchObject({
            leftIndex: 0,
            topIndex: 0,
            rightIndex: 4 /* 3.366... */,
            bottomIndex: 6
        });

        expect(viewPortRange({
            scrollLeft: 30,
            scrollTop: 20,
            clientWidth: 100,
            clientHeight: 100
        })).toMatchObject({
            leftIndex: 1,
            topIndex: 1,
            rightIndex: 5,
            bottomIndex: 6
        });

        expect(viewPortRange({
            scrollLeft: 31,
            scrollTop: 21,
            clientWidth: 100,
            clientHeight: 100
        })).toMatchObject({
            leftIndex: 1,
            topIndex: 1,
            rightIndex: 5,
            bottomIndex: 7
        });

        expect(viewPortRange({
            scrollLeft: 25,
            scrollTop: 15,
            clientWidth: 130,
            clientHeight: 120
        })).toMatchObject({
            leftIndex: 0,
            topIndex: 0,
            rightIndex: 6,
            bottomIndex: 7 /* 6.75 */,
        });
    });

    it("jump around", function () {

        let columns = new Array(100).fill({width: 30});
        columns = importColumns(columns, c => c.width);
        let rows = new Array(100).fill({height: 20});
        rows = importRows(rows, r => r.height);

        let {left, width} = columns[columns.length - 1];
        let {top, height} = rows[rows.length - 1];
        let totalWidth = left + width;
        let totalHeight = top + height;

        expect(totalWidth).toBe(3000);
        expect(totalHeight).toBe(2000);

        let viewPortRange = new ViewPortRange({
            columns: columns,
            rows: rows,
            scrollArea: {
                clientWidth: totalWidth,
                clientHeight: totalHeight
            },
            viewPort: {
                scrollLeft: 3000 - 350,
                scrollTop: 2000 - 235,
                clientWidth: 310,
                clientHeight: 205
            }
        });

        expect(viewPortRange({
            scrollLeft: 3000 - 360,
            scrollTop: 2000 - 240,
            clientWidth: 300,
            clientHeight: 200
        }).previous).toMatchObject({
            leftIndex: Math.floor((3000 - 350) / 30),
            topIndex: Math.floor((2000 - 235) / 20),
            rightIndex: Math.ceil((3000 - 350 + 310) / 30),
            bottomIndex: Math.ceil((2000 - 235 + 205) / 20)
        });

        expect(viewPortRange({
            scrollLeft: 0,
            scrollTop: 0,
            clientWidth: 100,
            clientHeight: 100
        })).toMatchObject({
            leftIndex: 0,
            topIndex: 0,
            rightIndex: 4 /* 3.333... */,
            bottomIndex: 5
        });

        expect(viewPortRange({
            scrollLeft: 1480,
            scrollTop: 990,
            clientWidth: 300,
            clientHeight: 200
        })).toMatchObject({
            leftIndex: Math.floor(1480 / 30),
            topIndex: Math.floor(990 / 20),
            rightIndex: Math.ceil((1480 + 300) / 30),
            bottomIndex: Math.ceil((990 + 200) / 20)
        });

    });
});
