module.exports = function (config, watcher, on) {

    on("echo", async (payload, send) => send("echo", payload));

};
