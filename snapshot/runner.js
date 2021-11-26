const jasmineReady = new Promise(resolve => {
    Object.defineProperty(window, "jasmine", {
        enumerable: true,
        configurable: true,
        get() {
            return jasmineReady;
        },
        set(value) {
            Object.defineProperty(window, "jasmine", {enumerable: true, value});
            resolve(value);
        }
    });
});

const jasmineDone = new Promise(resolve => {
    Object.defineProperty(window, "jasmineDone", {
        enumerable: true,
        configurable: true,
        get() {
            return jasmineReady;
        },
        set(value) {
            Object.defineProperty(window, "jasmineDone", {enumerable: true, value});
            resolve(value);
        }
    });
})

const jasmineScript = document.createElement("script");
jasmineScript.setAttribute("type", "text/javascript");
jasmineScript.setAttribute("src", "/node_modules/jasmine-core/lib/jasmine-core/jasmine.js");
jasmineScript.onload = async function () {

    console.log("jasmineScript.onload", Date.now());

    const jasmineRequire = window.jasmineRequire;
    const jasmine = jasmineRequire.core(jasmineRequire);

    const jasmineInterface = jasmineRequire.interface(jasmine, jasmine.getEnv());

    jasmineInterface.before = jasmineInterface.beforeAll;
    jasmineInterface.after = jasmineInterface.afterAll;

    Object.assign(window, jasmineInterface);

    jasmine.getEnv().addReporter({

        jasmineStarted(suiteInfo) {
            console.group("jasmine: started", suiteInfo);
        },

        suiteStarted(result) {
            console.group("jasmine: suite started", result);
        },

        specStarted(result) {
            console.log("jasmine: spec started", result.description);
        },

        specDone(result) {
            if (result.status === "pending") {
                console.log("jasmine: spec done:", result.fullName, "pending reason:", result.pendingReason);
            } else {
                console.log(
                    "jasmine: spec done:", result.fullName,
                    "passed:", result.passedExpectations.length,
                    "failed:", result.failedExpectations.length
                );
            }

            for (let i = 0; i < result.failedExpectations.length; i++) {
                console.warn("jasmine: spec failure: " + result.failedExpectations[i].message, result.failedExpectations[i].stack);
            }

            console.log("jasmine: specs passed:", result.passedExpectations.length);
        },

        suiteDone(result) {
            console.groupEnd("jasmine: suite started", result);

            console.log("jasmine: suite:", result.description, "status:", result.status);
            for (let i = 0; i < result.failedExpectations.length; i++) {
                console.log("jasmine: suite failure: " + result.failedExpectations[i].message, result.failedExpectations[i].stack);
            }
        },

        jasmineDone(runDetails) {
            console.groupEnd("jasmine: started");

            console.log("jasmine: done:", runDetails);
            for (let i = 0; i < runDetails.failedExpectations.length; i++) {
                console.log("jasmine: global failure: " + result.failedExpectations[i].message, result.failedExpectations[i].stack);
            }

            window.jasmineDone = true;
        }
    });

    jasmine.getEnv().configure({
        random: false,
        failFast: false,
        oneFailurePerSpec: false,
        hideDisabled: false,
        specFiler: spec => true
    });

};

document.head.append(jasmineScript);
