import {on} from "./messaging";

export type AcceptCallbackArgs = {
    module: any
    recycled?: any
}
export type AcceptCallback = (AcceptCallbackArgs) => void;
export type DisposeCallback = () => void;

const acceptCallbacks = new Map<string, AcceptCallback>();
const disposeCallbacks = new Map<string, DisposeCallback>();

const DO_NOTHING = () => undefined;

export function createHotContext(url: string) {
    let {pathname, search} = new URL(url);
    let id = pathname + search.slice(0, search.endsWith(".HMR") ? search.lastIndexOf("v=") - 1 : search.length);
    return {
        accept(cb: AcceptCallback | true = true) {
            if (cb === true) {
                acceptCallbacks.set(id, DO_NOTHING);
            } else {
                acceptCallbacks.set(id, cb);
            }
        },
        dispose(cb: DisposeCallback) {
            disposeCallbacks.set(id, cb);
        }
    };
}

let updateCount = 0;

on("hmr:update", ({url}) => {
    console.log("[HMR] update", url);
    const disposeCallback = disposeCallbacks.get(url);
    let recycled;
    if (disposeCallback) {
        recycled = disposeCallback();
        console.log("[HMR] disposed version:", updateCount+".HMR");
    }
    import(`${url}${url.indexOf("?") > 0 ? "&" : "?"}v=${++updateCount}.HMR`).then(module => {
        const acceptCallback = acceptCallbacks.get(url);
        if (acceptCallback) {
            try {
                acceptCallback({module, recycled});
                console.log("[HMR] accepted version:", updateCount+".HMR");
                return
            } catch(error) {
                console.log("[HMR] error", error);
            }
        }
        console.log("[HMR] reload");
        location.reload();
    });
});

on("hmr:reload", ({url}) => {
    console.log("[HMR] reload", url);
    location.reload();
});
