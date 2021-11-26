import {LitElement} from "lit-element";

const connectedCallback = LitElement.prototype.connectedCallback;
LitElement.prototype.connectedCallback = function () {
    this.setAttribute(document.theme, "");
    return connectedCallback.apply(this);
};

import("@moderno/components");

import("./web/components/test-fixture.js");
import("./web/components/test-fixtures.js");
import("./web/components/test-navigator.mjs");
import("./web/components/test-report.js");
import("./web/components/test-suite.js");
import("./web/components/test-workbench.js");

import("./web/boot.js");

document.body.removeAttribute("hidden");