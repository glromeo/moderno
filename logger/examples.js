const log = require("./index.js");

log.level = log.TRACE; // ...or just "trace"

log.details = true;

log.trace("Hello world!");
log.debug("Hello world!");
log.info("Hello world!");
log.warn("Hello world!");
log.error("Hello world!");

const {trace, debug, info, warn, error, setLevel} = log;

setLevel("trace");

trace`Hello world!`
debug`Hello world!`
info`Hello world!`
warn`Hello world!`
error`Hello world!`
