import chai from "chai";
import path from "path";
import sinon from "sinon";
import sinon_chai from "sinon-chai";

chai.use(sinon_chai);

declare global {
    namespace NodeJS {
        interface Global {
            assert: typeof chai.assert
            expect: typeof chai.expect
        }
    }
}

global.assert = chai.assert;
global.expect = chai.expect;

export {assert, expect} from "chai";

export {
    match,
    spy,
    stub,
    mock,
    fake
} from "sinon";

export {
    chai,
    sinon
};

export function mockquire(module: string, stub: any, requireOptions = {paths: [callerDirname()]}) {
    const resolved = require.resolve(module, requireOptions);
    delete require.cache[resolved];
    require(resolved);
    let cached = require.cache[resolved]!;
    cached.exports = new Proxy(cached.exports, {
        get(target: any, p: string) {
            if (stub.hasOwnProperty(p)) {
                return stub[p];
            } else {
                return target[p];
            }
        }
    });
}

export function unrequire(module: string, requireOptions = {paths: [callerDirname()]}) {
    delete require.cache[require.resolve(module, requireOptions)];
}

function stacktrace():NodeJS.CallSite[] {
    const prepareStackTrace = Error.prepareStackTrace;
    Error.prepareStackTrace = function captureOnce(_, stack) {
        Error.prepareStackTrace = prepareStackTrace;
        return stack;
    };
    return (new Error()).stack as any;
}

function callerDirname(depth: number = 1) {
    let stack = stacktrace();
    let frame = stack[2 + (isNaN(depth) ? 1 : Math.min(depth, stack.length - 2))];
    let filename = frame?.getFileName();
    return filename ? path.dirname(filename) : process.cwd();
}