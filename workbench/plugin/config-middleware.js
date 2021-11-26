const log = require("@moderno/logger");

module.exports = function (router, {workbench}) {

    router.get("/workbench.config", function (req, res) {
        log.debug("workbench configuration");
        if (workbench) {
            res.writeHead(200, {
                "content-type": "application/json; charset=UTF-8"
            });
            const cfg = {...workbench};
            for (const key of Object.keys(cfg)) {
                if (typeof cfg[key] === "function") {
                    cfg[key] = {__function__: cfg[key].toString()};
                }
            }
            res.end(JSON.stringify(cfg));
        } else {
            res.writeHead(404);
            res.end();
        }
    });
};
