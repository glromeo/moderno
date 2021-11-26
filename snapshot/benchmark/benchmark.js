const Benchmark = require("benchmark");
const fastDiff = require("fast-diff");
const {diffChars} = require("diff");
const fs = require("fs");

const left = fs.readFileSync("./fixture-left.txt", "UTF-8");
const right = fs.readFileSync("./fixture-right.txt", "UTF-8");

let length;

new Benchmark.Suite("diff")

    .add("fast-diff", function () {
        length = fastDiff(left, right).map(([type, text]) => {
            return `${type}:${text}`;
        }).length;
    })

    .add("diff", function () {
        length = diffChars(left, right).map(({added, removed, value}) => {
            return `${added + removed}:${value}`;
        }).length;
    })

    .on("cycle", function ({target}) {
        console.log("length:", length, String(target));
    })

    .on("complete", function () {
        console.log("Fastest is " + this.filter("fastest").map("name"));
    })

    .run({"async": true});