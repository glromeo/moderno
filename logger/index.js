const util = require("util");
const {sep} = require("path");
const quotes = require("./quotes.js");

const BACKGROUND = {
    BLACK: "\x1B[40m",	            // Applies non-bold/bright black to background
    RED: "\x1B[41m",	            // Applies non-bold/bright red to background
    GREEN: "\x1B[42m",	            // Applies non-bold/bright green to background
    YELLOW: "\x1B[43m",	            // Applies non-bold/bright yellow to background
    BLUE: "\x1B[44m",	            // Applies non-bold/bright blue to background
    MAGENTA: "\x1B[45m",	        // Applies non-bold/bright magenta to background
    CYAN: "\x1B[46m",	            // Applies non-bold/bright cyan to background
    WHITE: "\x1B[47m",	            // Applies non-bold/bright white to background
    EXTENDED: "\x1B[48m",	        // Applies extended color value to the background
    DEFAULT: "\x1B[49m",	        // Applies only the background portion of the defaults
    BRIGHT_BLACK: "\x1B[100m",	    // Applies bold/bright black to background
    BRIGHT_RED: "\x1B[101m",	    // Applies bold/bright red to background
    BRIGHT_GREEN: "\x1B[102m",	    // Applies bold/bright green to background
    BRIGHT_YELLOW: "\x1B[103m",	    // Applies bold/bright yellow to background
    BRIGHT_BLUE: "\x1B[104m",	    // Applies bold/bright blue to background
    BRIGHT_MAGENTA: "\x1B[105m",	// Applies bold/bright magenta to background
    BRIGHT_CYAN: "\x1B[106m",	    // Applies bold/bright cyan to background
    BRIGHT_WHITE: "\x1B[107m",	    // Applies bold/bright white to background
};

const COLOR = {
    BLACK: "\x1B[30m",	            // Applies non-bold/bright black to foreground
    RED: "\x1B[31m",	            // Applies non-bold/bright red to foreground
    GREEN: "\x1B[32m",	            // Applies non-bold/bright green to foreground
    YELLOW: "\x1B[33m",	            // Applies non-bold/bright yellow to foreground
    BLUE: "\x1B[34m",	            // Applies non-bold/bright blue to foreground
    MAGENTA: "\x1B[35m",	        // Applies non-bold/bright magenta to foreground
    CYAN: "\x1B[36m",	            // Applies non-bold/bright cyan to foreground
    WHITE: "\x1B[37m",	            // Applies non-bold/bright white to foreground
    EXTENDED: "\x1B[38m",	        // Applies extended color value to the foreground
    DEFAULT: "\x1B[39m",	        // Applies only the foreground portion of the defaults
    BRIGHT_BLACK: "\x1B[90m",	    // Applies bold/bright black to foreground
    BRIGHT_RED: "\x1B[91m",	        // Applies bold/bright red to foreground
    BRIGHT_GREEN: "\x1B[92m",	    // Applies bold/bright green to foreground
    BRIGHT_YELLOW: "\x1B[93m",	    // Applies bold/bright yellow to foreground
    BRIGHT_BLUE: "\x1B[94m",	    // Applies bold/bright blue to foreground
    BRIGHT_MAGENTA: "\x1B[95m",     // Applies bold/bright magenta to foreground
    BRIGHT_CYAN: "\x1B[96m",	    // Applies bold/bright cyan to foreground
    BRIGHT_WHITE: "\x1B[97m",	    // Applies bold/bright white to foreground
};

const colors = {
    trace: COLOR.BRIGHT_BLACK,
    debug: COLOR.BLUE,
    info: COLOR.BLACK,
    warn: COLOR.YELLOW,
    error: COLOR.RED
};

const flags = {
    trace: BACKGROUND.BRIGHT_BLACK + " " + COLOR.BRIGHT_BLACK + BACKGROUND.DEFAULT + " ",
    debug: BACKGROUND.BLUE + " " + COLOR.BRIGHT_BLUE + BACKGROUND.DEFAULT + " ",
    info: COLOR.BRIGHT_WHITE + BACKGROUND.BRIGHT_BLUE + " " + COLOR.DEFAULT + BACKGROUND.DEFAULT + " ",
    warn: COLOR.BRIGHT_YELLOW + BACKGROUND.YELLOW + "!" + COLOR.YELLOW + BACKGROUND.DEFAULT + " ",
    error: COLOR.BRIGHT_RED + BACKGROUND.RED + "X" + COLOR.RED + BACKGROUND.DEFAULT + " ",
};

function stringify(o) {
    const type = typeof o;
    if (type === "object") {
        return util.inspect(o, {colors: true, depth: 3});
    } else if (type === "string") {
        return o.charCodeAt(0) !== 27 && o !== " " ? o : COLOR.DEFAULT + o;
    } else {
        return o;
    }
}

let write = process.stdout.write.bind(process.stdout);

let lastDay = -1;

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

function writeln(flag, color, head, tail) {

    const count = tail.length;

    const date = new Date();
    if (date.getDay() > lastDay) {
        write(COLOR.RED + date.toDateString() + COLOR.DEFAULT + " – " + quotes[Math.floor(Math.random() * quotes.length)] + "\n");
        lastDay = date.getDay();
    }

    const time = date.toLocaleTimeString();
    const msec = String(date.getMilliseconds()).padStart(3, "0");
    const timestamp = `${COLOR.BRIGHT_BLACK + time + COLOR.BRIGHT_BLACK}.${msec} ${flag}`;

    const cs = callSite(new Error(), 2);
    const fileName = cs.getFileName();
    const suffix = COLOR.BRIGHT_BLACK + fileName.substring(fileName.lastIndexOf(sep) + 1) + COLOR.BLACK + ":" + COLOR.BRIGHT_BLUE + cs.getLineNumber() + COLOR.DEFAULT;

    let line = timestamp;

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

    write(line + `\x1B[${process.stdout.columns - suffix.length + 21}G${suffix}\n`);
}

function log(strings, ...keys) {
    writeln(flags.info, colors.info, strings, keys);
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
            writeln(flags.trace, colors.trace, strings, keys);
        }
    },

    debug(strings, ...keys) {
        if (threshold >= 3) {
            writeln(flags.debug, colors.debug, strings, keys);
        }
    },

    info(strings, ...keys) {
        if (threshold >= 2) {
            writeln(flags.info, colors.info, strings, keys);
        }
    },

    warn(strings, ...keys) {
        if (threshold >= 1) {
            writeln(flags.warn, colors.warn, strings, keys);
        }
    },

    error(strings, ...keys) {
        if (threshold >= 0) {
            writeln(flags.error, colors.error, strings, keys);
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
