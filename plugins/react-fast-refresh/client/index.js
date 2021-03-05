import reactRefreshRuntime from "./runtime.js";
import * as hmr from "/moderno/browser-toolkit.js";

reactRefreshRuntime.injectIntoGlobalHook(window);

window.$RefreshSig$ = reactRefreshRuntime.createSignatureFunctionForTransform;

export function createHotContext(url) {
    const {pathname} = new URL(url).pathname;
    window.$RefreshReg$ = (type, id) => reactRefreshRuntime.register(type, pathname + " " + id);
    return hmr.createHotContext(url);
}

let timeout;

export function performReactRefresh({module}) {
    clearTimeout(timeout);
    timeout = setTimeout(reactRefreshRuntime.performReactRefresh, 25);
}
