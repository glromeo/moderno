import {snapshot} from "@moderno/snapshot";

const worker = new Worker("./web/reporters/snapshot-reporter.worker.mjs", {type: "module"});

export default (jasmineInterface) => {

    const {beforeAll, afterAll, beforeEach} = jasmineInterface;

    const pending = new Map();

    worker.onmessage = function ({data}) {
        if (typeof data === "string") {
            pending.get(data).call();
        } else if (data.key) {
            pending.get(data.key).call(null, data);
        }
    };

    beforeAll(async function () {
        await new Promise(ready => {
            worker.postMessage({"load": document.location.search});
            pending.set("ready", ready);
        });
    });

    afterAll(async function () {
        await new Promise((done, failed) => {
            worker.postMessage({"save": document.location.search});
            pending.set("done", done);
            pending.set("failed", failed);
        });

    });

    const details = {};

    let nextSpec;

    beforeEach(function () {

        const {
            id: spec,
            fullName: name
        } = nextSpec;

        details[spec] = new Map();

        let counter = 0;

        jasmine.addAsyncMatchers({
            toMatchSnapshot: function (util) {
                return {
                    compare(actual) {
                        actual = typeof actual === "string" ? actual : snapshot(actual);
                        const key = spec + "#" + counter;
                        return new Promise(resolveMatch => {
                            pending.set(key, function (data) {
                                details[spec].set(data.match.message, new Promise(function (resolveDiff) {
                                    pending.set(key, function (data) {
                                        resolveDiff(data.diff);
                                    });
                                }));
                                resolveMatch(data.match);
                            });
                            worker.postMessage({"match": actual, name, key, counter});
                            ++counter;
                        });
                    }
                };
            }
        });
    });

    return {
        specStarted(result) {
            nextSpec = result;
        },
        specDone(result) {
            const failures = result.failedExpectations;
            for (const failure of failures) {
                const failureDetails = details[result.id];
                if (failureDetails.has(failure.message)) {
                    failureDetails.get(failure.message).then(details => failure.details = details);
                }
            }
        }
    };
}
