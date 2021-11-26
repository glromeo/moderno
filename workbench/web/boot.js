const config = fetch("/workbench.config").then(response => response.ok ? response.json() : {}).then(cfg => {
    for (const key of Object.keys(cfg)) {
        if (typeof cfg[key] === "object") {
            const fn = cfg[key].__function__;
            if (fn) {
                cfg[key] = eval(fn);
            }
        }
    }
    console.debug("workbench configuration:", cfg);
    return cfg;
});

const render = import("./render.js");

const coverageReporter = import("./reporters/coverage-reporter.mjs");
const snapshotReporter = import("./reporters/snapshot-reporter.mjs");

if (window.headless) {
    var headlessReporter = import("./reporters/headless-reporter.mjs");
} else {
    var consoleReporter = import("./reporters/console-reporter.mjs");
    var htmlReporter = import("./reporters/html-reporter.mjs");
}

const loadScript = ({src, type = "text/javascript"}) => new Promise(resolve => {
    const script = document.createElement("script");
    script.setAttribute("type", type);
    script.setAttribute("src", src);
    script.onload = resolve;
    document.head.appendChild(script);
});

// TODO: make a module of this and maybe rewrite it too!!!
loadScript({src: "/node_modules/sourcemapped-stacktrace/dist/sourcemapped-stacktrace.js"});

loadScript({src: "/node_modules/jasmine-core/lib/jasmine-core/jasmine.js"}).then(async function boot() {

    const jasmineRequire = window.jasmineRequire;
    const jasmine = jasmineRequire.core(jasmineRequire);
    const env = jasmine.getEnv();

    const jasmineInterface = jasmineRequire.interface(jasmine, env);

    jasmineInterface.before = jasmineInterface.beforeAll;
    jasmineInterface.after = jasmineInterface.afterAll;

    jasmineInterface.beforeSuite = new Set();
    jasmineInterface.afterSuite = new Set();

    for (const method of ["describe", "fdescribe", "xdescribe"]) {
        const original = jasmineInterface[method];
        jasmineInterface[method] = function (description, specDefinitions) {
            return original.call(this, description, function () {
                const userContext = this.sharedUserContext();
                try {
                    for (const beforeSuite of jasmineInterface.beforeSuite) {
                        beforeSuite.call(this, userContext);
                    }
                    specDefinitions.apply(this);
                } finally {
                    for (const afterSuite of jasmineInterface.afterSuite) {
                        afterSuite.call(this, userContext);
                    }
                }
            });
        };
    }

    jasmineInterface.beforeSuite.add(function (userContext) {
        userContext.suite = Object.create(this.result);
        userContext.suite.fixtures = [];
    });

    const {context} = await render;

    jasmineInterface.beforeEach(function () {
        context.suite = this.suite;
    });

    const addReporter = async reporter => reporter && env.addReporter((await reporter).default(jasmineInterface));
    await addReporter(coverageReporter);
    await addReporter(snapshotReporter);
    await addReporter(headlessReporter);
    await addReporter(consoleReporter);
    await addReporter(htmlReporter);

    if (window.headless) env.addReporter({
        jasmineDone: result => window.jasmineResolve(result.overallStatus)
    });

    Object.assign(window, jasmineInterface);

    env.configure(await config);

    const {searchParams} = new URL(document.location);
    const specURL = searchParams.get("spec");
    if (specURL) {
        await import(specURL);
        env.execute();
    }

});
