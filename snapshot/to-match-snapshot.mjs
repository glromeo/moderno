
import {snapshot} from "./index.js";
import {diffLines, diffChars} from "diff";

jasmine.getEnv().addReporter({

    jasmineStarted(suiteInfo) {
        console.group("jasmine: started", suiteInfo);
    },

    suiteStarted(result) {
        console.group(`jasmine suite: ${result.fullName} %c...`, "color: gray");
    },

    specStarted(result) {
        console.log(`jasmine spec: ${result.description} %c...`, "color: gray");
    },

    specDone({failedExpectations, description, passedExpectations, pendingReason, status}) {
        if (status === "pending") {
            console.log(
                `jasmine spec: ${description}%c - %cPENDING%c because ${pendingReason}`,
                "color: gray",
                "color: orange",
                "color: auto"
            );
        } else {
            console.log(
                `jasmine spec: ${
                    description
                }%c - %c${passedExpectations.length} PASSED%c, %c${failedExpectations.length} FAILED`,
                "color: gray",
                "color: green",
                "color: gray",
                "color: red"
            );
        }

        for (let i = 0; i < failedExpectations.length; i++) {
            const failure = failedExpectations[i];

            if (failure.message.startsWith("expected snapshot:")) {

                const start = failure.message.indexOf("\n") + 1;
                const end = failure.message.indexOf("\nto match:\n", start);
                const actual = failure.message.slice(start, end);
                const expected = failure.message.slice(end + 11, -1);

                const diff = diffLines(expected, actual);
                let message = "jasmine spec failure: snapshot doesn't match:\n";
                let styles = [], pending;

                diff.forEach((part) => {
                    if (part.added === part.removed) {
                        if (pending) {
                            message += "%c" + pending.value;
                            if (pending.added) {
                                styles.push("background-color: #282; color: #8F8");
                            } else {
                                styles.push("background-color: #822; color: #F88");
                            }
                            pending = undefined;
                        }
                        message += "%c" + part.value;
                        styles.push("color: auto; background-color: #333");
                    } else if (!pending) {
                        pending = part;
                    } else {
                        const oldStr = pending.value;
                        const newStr = part.value;
                        const backgroundStyle = "background-color: #228; color: #88F";
                        diffChars(oldStr, newStr).forEach(function (part) {
                            message += "%c" + part.value;
                            if (part.added) {
                                styles.push("border: 1px solid #4F4; background-color: #282; color: #8F8");
                            } else if (part.removed) {
                                styles.push("border: 1px solid #F44; background-color: #822; color: #F88");
                            } else {
                                styles.push(backgroundStyle);
                            }
                        });
                        pending = undefined;
                    }
                });

                if (pending) {
                    message += "%c" + pending.value;
                    if (pending.added) {
                        styles.push("background-color: #343; color: #4F4");
                    } else {
                        styles.push("background-color: #433; color: #F44");
                    }
                    pending = undefined;
                }

                console.log(`${message}\n%c${failure.stack.trim()}`,
                    ...styles,
                    "color: orange;"
                );
            } else {
                console.log(`jasmine spec failure: ${failure.message}\n%c${failure.stack.trim()}`,
                    "color: orange;"
                );
            }

        }
    },

    suiteDone({failedExpectations, fullName, status}) {
        console.groupEnd();
        console.log(
            `jasmine suite: ${fullName} %c- %c${status.toUpperCase()}`,
            "color: gray",
            status === "passed" ? "color:green" : status === "pending" ? "color:orange" : "color:red"
        );
        for (let i = 0; i < failedExpectations.length; i++) {
            console.log("jasmine: suite failure: " + failedExpectations[i].message);
            console.log(failedExpectations[i].stack);
        }
    },

    jasmineDone({overallStatus, totalTime, failedExpectations}) {
        console.groupEnd();
        console.log(
            `jasmine: done: status %c${overallStatus}%c, total-time: %c${totalTime}ms`,
            overallStatus === "passed" ? "color:green" : overallStatus === "pending" ? "color:orange" : "color:red",
            "color: auto",
            "color: cornflowerblue"
        );
        for (let i = 0; i < failedExpectations.length; i++) {
            console.log("jasmine: global failure: " + failedExpectations[i].message, failedExpectations[i].stack);
        }
    }
});

beforeEach(function () {
    jasmine.addMatchers({
        toMatchSnapshot: function (util) {
            return {
                compare(actual, expected) {
                    actual = snapshot(actual);
                    expected = typeof expected === "string" ? expected : snapshot(expected);
                    return {
                        pass: actual === expected,
                        message: `expected snapshot:\n${actual}\nto match:\n${expected}\n`
                    };
                }
            };
        }
    });
});
