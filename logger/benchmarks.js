const Benchmark = require("benchmark");
const readline = require("readline");
const log = require("./index.js");

log.details = false;
log.write = function (item) {
    // process.stdout.write(item);
    // readline.cursorTo(process.stdout, 0, 0);
};

const outcomes = [];

new Benchmark.Suite("@moderno/logger")

    // .add("console.log", function () {
    //     console.log("hello world!", 123456, "abc", new Date(), {abc: 123}, new Error());
    //     readline.cursorTo(process.stdout, 0, 0);
    // })

    .add("simple", function () {
        log.info("hello world!", 123456, "abc", new Date(), {abc: 123}, new Error());
    })

    .add("tagged templates ...", function () {
        log.info`hello world! ${123456} ${new Date()} ${{abc: 123}}${new Error()}`;
    })

    .add("detailed", function () {
        log.info("hello world!", 123456, "abc", new Date(), {abc: 123}, new Error());
    })

    .add("detailed tagged templates", function () {
        log.info`hello world! ${123456} ${new Date()} ${{abc: 123}}${new Error()}`;
    })

    .on("cycle", function ({target}) {
        outcomes.push(target.toString());
        if (target.name.endsWith("...")) {
            log.details = true;
        }
    })

    .on("complete", function () {
        readline.cursorTo(process.stdout, 0, 0);
        readline.clearScreenDown(process.stdout, () => {
            outcomes.forEach(outcome=>console.log(outcome));
            console.log("Fastest is " + this.filter("fastest").map("name"));
        });
    })

    .run({"async": true});