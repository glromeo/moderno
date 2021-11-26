import fastDiff from "fast-diff";

export default () => ({

    jasmineStarted(suiteInfo) {
        console.group("jasmine: started", suiteInfo);
    },

    suiteStarted(result) {
        console.group(`jasmine suite: ${result.fullName} ...`);
    },

    specStarted(result) {
        console.log(`jasmine spec: ${result.description} ...`);
    },

    specDone({failedExpectations, description, passedExpectations, pendingReason, status}) {
        if (status === "pending") {
            console.log(`jasmine spec: ${description} - PENDING because ${pendingReason}`);
        } else {
            console.log(`jasmine spec: ${description} - ${passedExpectations.length} PASSED, ${failedExpectations.length} FAILED`);
        }

        for (let i = 0; i < failedExpectations.length; i++) {
            const failure = failedExpectations[i];

            if (failure.message.startsWith("expected snapshot:")) {
                console.group(`jasmine spec failure: snapshot doesn't match!\n\t${failure.stack.trim()}`);

                const start = failure.message.indexOf("\n") + 1;
                const end = failure.message.indexOf("\nto match:\n", start);
                const left = failure.message.slice(start, end);
                const right = failure.message.slice(end + 11, -1);

                const parts = [] || fastDiff(left, right);
                let message, styles;

                console.group("expected:");

                message = "";
                for (let [type, text] of parts) if (type === 0) {
                    message += text;
                } else if (type < 0) {
                    message += text;
                }

                console.log(message);
                console.groupEnd();

                console.group("actual:");

                message = "";
                for (let [type, text] of parts) if (type === 0) {
                    message += text;
                } else if (type > 0) {
                    message += text;
                }

                console.log(message);
                console.groupEnd();

                console.groupEnd();
            } else {
                console.log(`jasmine spec failure: ${(failure.message)}\n${failure.stack.trim()}`,
                    "color: orange;"
                );
            }
        }
    },

    suiteDone({failedExpectations, fullName, status}) {
        console.groupEnd();
        console.log(`jasmine suite: ${fullName} - ${status.toUpperCase()}`);
        for (let i = 0; i < failedExpectations.length; i++) {
            console.log("jasmine: suite failure: " + failedExpectations[i].message);
            console.log(failedExpectations[i].stack);
        }
    },

    jasmineDone({overallStatus, totalTime, failedExpectations}) {
        console.groupEnd();
        console.log(`jasmine: done: status ${overallStatus}, total-time: ${totalTime}ms`);
        for (let i = 0; i < failedExpectations.length; i++) {
            console.log("jasmine: global failure: " + failedExpectations[i].message, failedExpectations[i].stack);
        }
    }

});
