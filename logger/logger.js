const chalk = require("chalk");
const util = require("util");
const {sep} = require("path");

const colors = {
    trace: chalk.gray,
    debug: chalk.blueBright,
    info: chalk.black,
    warn: chalk.yellow,
    error: chalk.red
};

function stringify(o, color) {
    const type = typeof o;
    if (type === "object") {
        return util.inspect(o, {colors: true, depth: 3});
    } else if (type === "string") {
        return color && o.charCodeAt(0) !== 27 && o !== " " ? color(o) : o;
    } else {
        return color && color(String(o)) || String(o);
    }
}

let write = process.stdout.write.bind(process.stdout);

const DEFAULT_DETAILS_LENGTH = 30;

let detailsLength = DEFAULT_DETAILS_LENGTH;

function getStackTrace(error, stack) {
    return stack;
}

function callSite(error, depth) {
    const prepareStackTrace = Error.prepareStackTrace;
    Error.prepareStackTrace = getStackTrace;
    const stack = error.stack;
    Error.prepareStackTrace = prepareStackTrace;
    return stack[depth];
}

let compact = process.stdout.columns < 120;

function getDetails() {
    const cs = callSite(new Error(), 3);
    const coords = chalk.blueBright(cs.getLineNumber()) + ":" + chalk.blueBright(cs.getColumnNumber());
    const columns = detailsLength - coords.length + 20;
    let fileName = cs.getFileName();
    let to = Math.max(fileName.lastIndexOf("."), 0);
    let from = fileName.lastIndexOf(sep, to) + 1;
    fileName = fileName.slice(from, to);
    if (fileName.length > columns) {
        fileName = fileName.substring(0, columns - 1) + "~";
    } else {
        fileName = fileName.padEnd(columns, " ");
    }
    return chalk.underline(fileName + coords);
}

function writeln(color, head, tail) {

    const count = tail.length;

    const iso = new Date().toISOString();
    const date = chalk.blue(iso.substring(0, 10));
    const time = chalk.blueBright(iso.substring(11, 19));
    const msec = chalk.cyan(iso.substring(19, 23));
    const timestamp = `${date} ${time}${msec}`;

    const details = detailsLength && getDetails();

    let line = compact
        ? details
            ? `${details}\n${timestamp.padStart(detailsLength + 30, " ")} > `
            : timestamp + " > "
        : details
            ? `${timestamp} |${details}| `
            : timestamp + " | ";

    if (Array.isArray(head) && count === (head.length - 1)) {
        for (let i = 0; i < count; i++) {
            if (head[i].length) {
                line += stringify(head[i], color);
            }
            line += stringify(tail[i], color);
        }
        if (head[count].length) {
            line += stringify(head[count], color);
        }
    } else {
        line += stringify(head, color);
        for (const item of tail) {
            line += " " + stringify(item, color);
        }
    }

    write(line + "\n");
}

function log(strings, ...keys) {
    writeln(null, strings, keys);
}

module.exports = log;

let threshold = 2;

Object.assign(module.exports, {

    colors,

    TRACE: 4,
    DEBUG: 3,
    INFO: 2,
    WARN: 1,
    ERROR: 0,
    NOTHING: -1,

    trace(strings, ...keys) {
        if (threshold >= 4) {
            writeln(colors.trace, strings, keys);
        }
    },

    debug(strings, ...keys) {
        if (threshold >= 3) {
            writeln(colors.debug, strings, keys);
        }
    },

    info(strings, ...keys) {
        if (threshold >= 2) {
            writeln(undefined, strings, keys);
        }
    },

    warn(strings, ...keys) {
        if (threshold >= 1) {
            writeln(colors.warn, strings, keys);
        }
    },

    error(strings, ...keys) {
        if (threshold >= 0) {
            writeln(colors.error, strings, keys);
        }
    },

    setLevel(value) {
        this.level = value;
    },

    includes(level) {
        switch (level.toLowerCase()) {
            case "trace":
                return threshold >= 4;
            case "debug":
                return threshold >= 3;
            case "info":
                return threshold >= 2;
            case "warn":
                return threshold >= 1;
            case "error":
                return threshold >= 0;
            default:
                return false;
        }
    },

    stringify
});

Object.defineProperty(module.exports, "write", {
    enumerable: true,
    get: () => write,
    set: fn => write = fn
});

Object.defineProperty(module.exports, "details", {
    enumerable: true,
    get: () => detailsLength,
    set: length => {
        if (length === true) {
            detailsLength = DEFAULT_DETAILS_LENGTH;
        } else if (length === false) {
            detailsLength = 0;
        } else {
            detailsLength = Number(length);
        }
    }
});

Object.defineProperty(module.exports, "compact", {
    enumerable: true,
    get: () => compact,
    set: value => compact = value
});

Object.defineProperty(module.exports, "level", {
    enumerable: true,
    get: () => {
        switch (threshold) {
            case 4:
                return "trace";
            case 3:
                return "debug";
            case 2:
                return "info";
            case 1:
                return "warn";
            case 0:
                return "error";
            default:
                return "nothing";
        }
    },
    set: level => {
        if (typeof level === "number") {
            if (isNaN(level)) {
                throw new Error("cannot set level: " + level);
            }
            threshold = level;
            return;
        } else {
            switch (level.toLowerCase()) {
                case "trace":
                    threshold = 4;
                    return log;
                case "debug":
                    threshold = 3;
                    return log;
                case "info":
                    threshold = 2;
                    return log;
                case "warn":
                    threshold = 1;
                    return log;
                case "error":
                    threshold = 0;
                    return log;
                case "nothing":
                    threshold = -1;
                    return log;
            }
        }
        throw new Error("cannot set level: " + level);
    }
});

module.exports.level = "info";
