import "../components/failure-message.mjs";

export default ({beforeSuite, afterSuite, beforeEach}) => {

    let currentSuiteElement = document.getElementById("report");

    beforeSuite.add(function (userContext) {

        document.getElementById("navigator").suites.set(this.id, userContext.suite);

        const testSuiteElement = document.createElement("test-suite");
        testSuiteElement.setAttribute("id", this.id);
        testSuiteElement.setAttribute("title", this.description);

        currentSuiteElement = currentSuiteElement.appendChild(testSuiteElement);
    });


    afterSuite.add(function (userContext) {
        currentSuiteElement = currentSuiteElement.parentElement;
    });

    const reportComponent = document.getElementById("report");

    return {

        suiteElement: reportComponent,

        jasmineStarted(suiteInfo) {
            reportComponent.running = true;
            reportComponent.progress = 0;
            reportComponent.total = suiteInfo.totalSpecsDefined;
        },

        suiteStarted(result) {
            this.suiteElement = document.getElementById(result.id);
            this.suiteElement.running = true;
        },

        specDone(result) {
            let suiteElement = this.suiteElement;

            const passed = result.passedExpectations;
            const failed = result.failedExpectations;

            Promise.all(failed.map(failure => new Promise((resolve, reject) => {
                window.sourceMappedStackTrace.mapStackTrace(failure.stack, resolve);
            }).then(function (lines) {
                failure.lines = lines;
            }))).then(function ([...stacks]) {
                suiteElement.requestUpdate();
            });

            suiteElement.specs.push(result);
            suiteElement[result.status]++;

            reportComponent.progress++;
            reportComponent[result.status].push(result);
        },

        suiteDone(result) {
            let suiteElement = this.suiteElement;
            suiteElement.running = "done";

            const passed = result.passedExpectations;
            const failed = result.failedExpectations;

            Promise.all(failed.map(failure => new Promise((resolve, reject) => {
                window.sourceMappedStackTrace.mapStackTrace(failure.stack, resolve);
            }).then(function (lines) {
                failure.lines = lines;
            }))).then(function ([...stacks]) {
                suiteElement.requestUpdate();
            });

            document.getElementById("navigator").suites.merge(result.id, {
                ...result,
                specs: suiteElement.specs,
                passed: suiteElement.passed,
                failed: suiteElement.failed,
                pending: suiteElement.pending
            });
        },

        jasmineDone() {
            reportComponent.running = false;
        }
    };
}
