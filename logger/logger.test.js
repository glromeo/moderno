const {expect, spy, mockRequire} = require("@moderno/testing");

describe("@moderno/logger", function () {

    mockRequire("chalk", new Proxy({}, {
        get: (target, p) => target[p] || (target[p] = text => p + "[" + text + "]")
    }));

    const chalk = require("chalk");

    const log = require("@moderno/logger");
    const {
        colors,
        trace,
        debug,
        info,
        warn,
        error
    } = log;

    let toISOString;

    beforeEach(function () {
        log.compact = false;
        log.details = false;
        log.write = spy();
        let instant = 0;
        toISOString = global.Date.prototype.toISOString;
        global.Date.prototype.toISOString = spy(() => "1974-04-12T08:30:00." + String(instant++).padStart(3, "0"));
    });

    afterEach(function () {
        global.Date.prototype.toISOString = toISOString;
    });

    it("can just log", function () {
        log`hello world`;
        expect(log.write).to.have.been.calledWith("blueBright[08:30:00]cyan[.000] | hello world\n");
    });

    it("colors", function () {
        expect(colors.trace).to.equal(chalk.gray);
        expect(colors.debug).to.equal(chalk.blueBright);
        expect(colors.info).to.equal(chalk.black);
        expect(colors.warn).to.equal(chalk.yellow);
        expect(colors.error).to.equal(chalk.red);
    });

    it("levels", function () {

        expect(log.level).to.equal("info");
        log.level = "warn";
        expect(log.level).to.equal("warn");
        log.level = "error";
        expect(log.level).to.equal("error");
        log.level = "nothing";
        expect(log.level).to.equal("nothing");
        log.level = "debug";
        expect(log.level).to.equal("debug");

        // noinspection JSValidateTypes
        expect(() => log.level = "unknown").to.throw("cannot set level: unknown");
        // noinspection JSValidateTypes
        expect(() => log.level = NaN).to.throw("cannot set level: NaN");

        log.level = "info";
        expect(log.level).to.equal("info");

        log.info("info");
        expect(log.write).to.callCount(1);
        log.debug("debug");
        expect(log.write).to.callCount(1);
        log.error("error");
        expect(log.write).to.callCount(2);
    });

    it("logging (classic)", function () {

        log.info("info", 123);

        expect(log.write.firstCall).to.calledWith(
            `blue[1974-04-12] blueBright[08:30:00]cyan[.000] | info 123\n`
        );

        log.debug("debug");
        expect(log.write).to.callCount(1);

        log.warn("warning", {a: 0}, {e1: {e2: {e3: {e4: {e5: 0}}}}}, new Error("any error"));

        expect(log.write.secondCall).to.calledWithMatch(
            "blue[1974-04-12] blueBright[08:30:00]cyan[.001]"
        );
        expect(log.write.secondCall).to.calledWithMatch(
            "yellow[warning]"
        );
        expect(log.write.secondCall).to.calledWithMatch(
            "{ a: [33m0[39m }"
        );
        expect(log.write.secondCall).to.calledWithMatch(
            "Error: any error\n    at Context.<anonymous> ("
        );
        expect(log.write.secondCall).to.calledWithMatch(
            "{\n  e1: { e2: { e3: { e4: \u001B[36m[Object]\u001B[39m } } }\n}"
        );
        expect(log.write.secondCall).to.calledWithMatch(/[\n]$/);

        log.trace("trace");
        expect(log.write).to.callCount(2);
    });

    it("logging (tagged template)", function () {

        log.level = "TRACE";

        expect(log.level).to.equal("trace");

        trace`trace ${123} ${chalk.green("green")} `;

        expect(log.write.firstCall).to.calledWith(
            "blue[1974-04-12] blueBright[08:30:00]cyan[.000] | gray[trace ]gray[123] gray[green[green]] \n"
        );
        expect(log.write).to.callCount(1);

        debug`debug`;

        expect(log.write.secondCall).to.calledWith(
            "blue[1974-04-12] blueBright[08:30:00]cyan[.001] | blueBright[debug]\n");

        warn`warning ${{a: 0}}, ${new Error("any error")} ${{e1: {e2: {e3: {e4: {e5: 0}}}}}}`;

        expect(log.write.thirdCall).to.calledWithMatch(
            "blue[1974-04-12] blueBright[08:30:00]cyan[.002]"
        );
        expect(log.write.thirdCall).to.calledWithMatch(
            "yellow[warning ]"
        );
        expect(log.write.thirdCall).to.calledWithMatch(
            "{ a: [33m0[39m }"
        );
        expect(log.write.thirdCall).to.calledWithMatch(
            "Error: any error\n    at Context.<anonymous> ("
        );
        expect(log.write.thirdCall).to.calledWithMatch(
            "{\n  e1: { e2: { e3: { e4: \u001B[36m[Object]\u001B[39m } } }\n}"
        );
        expect(log.write.thirdCall).to.calledWithMatch(/[\n]$/);

        info`info`;
        error`error`;

        expect(log.write).to.callCount(5);
    });

    it("logging nothing", function () {

        global.Date.prototype.toISOString = () => fail("shouldn't call timestamp()");

        log.level = log.NOTHING;

        log.trace`it doesn't matter`;
        log.debug`it doesn't matter`;
        log.info`it doesn't matter`;
        log.warn`it doesn't matter`;
        log.error`it doesn't matter`;

        expect(log.write).not.to.have.been.called;
    });

    it("stringify", function () {
        expect(log.stringify("something", chalk.black)).to.equal(chalk.black("something"));
        expect(log.stringify("something", null)).to.equal("something");
        expect(log.stringify("something")).to.equal("something");
    });

    it("can log timestamp, file and line number", function () {

        expect(log.details).not.to.be.ok;

        log.setLevel("info");
        log.details = true;

        log.info("details enabled!");
        log.warn("details enabled!");
        log.error("details enabled!");

        expect(log.write.firstCall).to.calledWith(
            "blue[1974-04-12] blueBright[08:30:00]cyan[.000] |" +
            "underline[unit.test           blueBright[212]:blueBright[13]]| details enabled!\n"
        );
        expect(log.write.secondCall).to.calledWith(
            "blue[1974-04-12] blueBright[08:30:00]cyan[.001] |" +
            "underline[unit.test           blueBright[213]:blueBright[13]]| yellow[details enabled!]\n"
        );
        expect(log.write.thirdCall).to.calledWith(
            "blue[1974-04-12] blueBright[08:30:00]cyan[.002] |" +
            "underline[unit.test           blueBright[214]:blueBright[13]]| red[details enabled!]\n"
        );

        log.details = false;

        log.info("details disabled!");

        expect(log.write).to.calledWith(
            `blue[1974-04-12] blueBright[08:30:00]cyan[.003] | details disabled!\n`
        );
    });

    it("long filename in details", function () {
        log.details = 14;
        log.info("details enabled!");
        expect(log.write).to.calledWith(
            "blue[1974-04-12] blueBright[08:30:00]cyan[.000] |" +
            "underline[uni~blueBright[240]:blueBright[13]]| details enabled!\n"
        );
        expect(log.compact).not.to.be.ok;
    });
});
