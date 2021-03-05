// src/multi-map.ts
var MultiMap = class extends Map {
  add(key, value) {
    let set = super.get(key);
    if (!set) {
      set = new Set();
      super.set(key, set);
    }
    set.add(value);
    return this;
  }
  remove(key, value) {
    let set = super.get(key);
    if (set) {
      set.delete(value);
      if (!set.size) {
        super.delete(key);
      }
    }
    return this;
  }
};

// src/messaging.ts
var queue = [];
var callbacks = new MultiMap();
var ws = new WebSocket(`${location.protocol === "http:" ? "ws:" : "wss:"}//${location.host}/`, "esnext-dev");
ws.onopen = (event) => {
  send("hello", {time: new Date().toUTCString()});
  const subset = callbacks.get("open");
  if (subset)
    for (const callback of subset) {
      callback(void 0, send);
    }
  queue.forEach((item) => ws.send(item));
  queue.length = 0;
};
ws.onmessage = (event) => {
  const message = event.data;
  const {type, data = void 0} = message.charAt(0) === "{" ? JSON.parse(message) : {type: message};
  const subset = callbacks.get(type);
  if (subset)
    for (const callback of subset) {
      callback(data, send);
    }
  else {
    console.log(type, data || "");
  }
};
ws.onerror = (event) => {
  console.log("websocket error", event);
};
ws.onclose = (event) => {
  const subset = callbacks.get("close");
  if (subset)
    for (const callback of subset) {
      callback(void 0, send);
    }
};
function send(type, data) {
  const text = data === void 0 ? JSON.stringify({type}) : JSON.stringify({type, data});
  if (ws.readyState !== ws.OPEN) {
    queue.push(text);
  } else {
    ws.send(text);
  }
}
function on(type, cb) {
  callbacks.add(type, cb);
  console.log(`added message listener for: %c${type}`, "color:magenta");
  return function() {
    callbacks.remove(type, cb);
  };
}

// src/notifications.ts
var sheet = new CSSStyleSheet();
sheet.replaceSync(`

#container {
    
    position: fixed;
    z-index: 10000;
    top: 8px;
    right: 8px;
    max-width: 0;
    height: 30vw;
    background: none;
    opacity: 0;
    transition: opacity 0.25s ease-out, max-width 0.125s ease-out;
    
    display: flex;
    flex-direction: column;
    text-align: right;
    overflow: visible;
}

#container.visible {
    max-width: 60vw;
    opacity: 1;
    transition: opacity 0.25s ease-in, max-width 0.5s ease-in;
}

#container.visible.timeout {
    opacity: .9;
}

.slot {
    overflow: visible;
    max-height: 0;
    opacity: 0;
    transition: all 0.25s ease-out;
}

.slot.connected {
    max-height: 0;
    opacity: 1;
    transition: all 0.25s ease-in;
}

.notification {
    font-family: sans-serif;
    font-size: 13px !important;

    max-width: calc(60vw - 40px);
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow-x: hidden;

    display: inline-block;
    border-radius: 8px;
    margin: 4px;
    padding: 8px 16px;
    pointer-events: none;
    position: relative;
    color: white;
    background: black;
    box-shadow: -2px 3px 2px 0 rgba(0, 0, 0, 0.125), 4px 4px 2px 0 rgba(0, 0, 0, 0.125);
}

.notification.sticky {
    padding-right: 32px;
}

.notification.sticky:after {
    position: absolute;
    content: '\u2715';
    font-weight: bolder;
    right: 12px;
    top: 8px;
    cursor: pointer;
    pointer-events: all;
}

.notification.primary {
    background: #3e3f3a;
}

.notification.secondary {
    background: slategray;
}

.notification.info {
    background: cornflowerblue;
}

.notification.success {
    background: forestgreen;
}

.notification.warning {
    background: orange;
}

.notification.danger {
    background: crimson;
}

`);
customElements.define("esnext-notifications", class extends HTMLElement {
  constructor() {
    super();
    this.hideTimeout = 0;
    this.ready = Promise.resolve();
    this.renderRoot = this.attachShadow({mode: "open"});
    this.renderRoot["adoptedStyleSheets"] = [sheet];
    this.renderRoot.innerHTML = `<div id="container">${this.innerHTML}</div>`;
    let autoHide;
    this.addEventListener("mouseenter", () => {
      autoHide = !!this.hideTimeout;
      this.show();
    });
    this.addEventListener("mouseout", () => {
      this.show(autoHide);
    });
  }
  get containerElement() {
    return this.renderRoot.getElementById("container");
  }
  set items(items) {
    this.containerElement.innerHTML = "";
    for (const item of items) {
      this.add(item);
    }
  }
  connectedCallback() {
    const removeAddCallback = on("notification:add", (notification) => this.add(notification));
    const removeUpdateCallback = on("notification:update", (notification) => this.update(notification));
    on("close", () => {
      if (this.parentElement)
        this.parentElement.removeChild(this);
    });
    this.disconnectedCallback = () => {
      removeAddCallback();
      removeUpdateCallback();
    };
  }
  disconnectedCallback() {
  }
  show(autoHide = false) {
    if (autoHide) {
      this.hide(2500);
    } else {
      window.clearTimeout(this.hideTimeout);
      this.containerElement.classList.remove("timeout");
    }
    this.containerElement.classList.add("visible");
  }
  hide(timeoutMs = 0) {
    window.clearTimeout(this.hideTimeout);
    this.containerElement.classList.add("timeout");
    this.hideTimeout = window.setTimeout(() => {
      this.containerElement.classList.remove("visible");
    }, timeoutMs);
  }
  add({id, type = "default", message = ""}, sticky = false) {
    this.ready = (async (ready) => {
      await ready;
      let slot = document.createElement("div");
      slot.classList.add("slot");
      slot.setAttribute("id", id);
      const notification = document.createElement("div");
      notification.setAttribute("class", `notification ${type}`);
      const dismiss = () => {
        if (slot) {
          slot.style.maxHeight = "";
          slot.classList.remove("connected");
          slot.addEventListener("transitionend", (event) => {
            if (slot) {
              this.containerElement.removeChild(slot);
              slot = null;
            }
          });
        }
      };
      if (sticky) {
        notification.classList.add("sticky");
        notification.addEventListener("click", dismiss);
      } else {
        window.setTimeout(dismiss, 3e3);
      }
      notification.innerHTML = message;
      slot.appendChild(notification);
      this.containerElement.appendChild(slot);
      this.show(true);
      return new Promise((resolve) => window.setTimeout(() => {
        if (slot) {
          slot.classList.add("connected");
          slot.style.maxHeight = `${notification.getBoundingClientRect().height + 8}px`;
        }
        window.setTimeout(resolve, 125);
      }));
    })(this.ready);
  }
  update({id, type = "default", message = ""}) {
    this.ready = (async (ready) => {
      await ready;
      const slot = this.renderRoot.getElementById(id);
      if (!slot) {
        return;
      }
      const notification = slot.firstElementChild;
      if (notification) {
        notification.setAttribute("class", `notification ${type}`);
        notification.innerHTML = message;
      }
      this.show(true);
    })(this.ready);
  }
});
on("open", () => {
  document.body.appendChild(document.createElement("esnext-notifications"));
});

// src/import-meta-hot.ts
var acceptCallbacks = new Map();
var disposeCallbacks = new Map();
var DO_NOTHING = () => void 0;
function createHotContext(url) {
  let {pathname, search} = new URL(url);
  let id = pathname + search.slice(0, search.endsWith(".HMR") ? search.lastIndexOf("v=") - 1 : search.length);
  return {
    accept(cb = true) {
      if (cb === true) {
        acceptCallbacks.set(id, DO_NOTHING);
      } else {
        acceptCallbacks.set(id, cb);
      }
    },
    dispose(cb) {
      disposeCallbacks.set(id, cb);
    }
  };
}
var updateCount = 0;
on("hmr:update", ({url}) => {
  console.log("[HMR] update", url);
  const disposeCallback = disposeCallbacks.get(url);
  let recycled;
  if (disposeCallback) {
    recycled = disposeCallback();
    console.log("[HMR] disposed version:", updateCount + ".HMR");
  }
  import(`${url}${url.indexOf("?") > 0 ? "&" : "?"}v=${++updateCount}.HMR`).then((module) => {
    const acceptCallback = acceptCallbacks.get(url);
    if (acceptCallback) {
      try {
        acceptCallback({module, recycled});
        console.log("[HMR] accepted version:", updateCount + ".HMR");
        return;
      } catch (error) {
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
export {
  createHotContext,
  on,
  send
};
