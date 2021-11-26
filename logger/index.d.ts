import {Chalk} from "chalk";

declare type Log = (strings:TemplateStringsArray|string, ...keys: any[]) => void;

declare type Level =
    "trace" | "debug" | "info" | "warn" | "error" | "nothing" |
    "TRACE" | "DEBUG" | "INFO" | "WARN" | "ERROR" | "NOTHING";

interface Logger extends Log {

    colors: {
        default: Chalk,
        trace: Chalk,
        debug: Chalk,
        info: Chalk,
        warn: Chalk,
        error: Chalk
    }

    TRACE: 4,
    DEBUG: 3,
    INFO: 2,
    WARN: 1,
    ERROR: 0,
    NOTHING: -1,

    trace: Log;
    debug: Log;
    info: Log;
    warn: Log;
    error: Log;

    setLevel(level: Level | 4 | 3 | 2 | 1 | 0 | -1): void;

    stringify(o: any, color?: Chalk): string | any;

    write(text: string): void;

    compact: boolean;

    details: boolean;

    level: Level | 4 | 3 | 2 | 1 | 0 | -1;

    includes(level: Level): boolean;
}

declare let log: Logger;

export default log;