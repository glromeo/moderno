import {render, text} from "@moderno/workbench";
import {html} from "lit-html";
import "./bs-button.js";

describe("bootstrap buttons", function () {

    it("just a button", async function () {
        const element = render(html`<bs-button type="${text("type", "primary")}">Click ME!</bs-button>`);
    });

});
