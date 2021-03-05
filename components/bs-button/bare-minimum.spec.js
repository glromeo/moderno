import {render, text} from "@moderno/workbench";
import {html} from "lit-html";
import "./bs-button.js";

const fixture = render("bare minimum", html`<bs-button type="${text("type", "primary")}">Click ME!</bs-button>`);

describe("unit tests", function () {

    it("match snapshot", async function () {
        await expectAsync(fixture).toMatchSnapshot();
    });
});
