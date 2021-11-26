import {render, text} from "@moderno/workbench";
import {html} from "lit-html";

import "./bs-button.js";

// jasmine.DEFAULT_TIMEOUT_INTERVAL = 250;

describe("bootstrap buttons", function () {

    it("primary", async function () {
        const element = await render(html`<bs-button type="primary">${text("label", "Primary")}</bs-button>`);
    });

    it("secondary", async function () {
        const element = await render(html`<bs-button type="secondary">${text("label", "Secondary")}</bs-button>`);
    });

    it("success", async function () {
        const element = await render(html`<bs-button type="success">Success</bs-button>`);
    });

    it("danger", async function () {
        const element = await render(html`<bs-button type="danger">Danger</bs-button>`);
    });

    it("warning", async function () {
        const element = await render(html`<bs-button type="warning">Warning</bs-button>`);
    });

    it("info", async function () {
        const element = await render(html`<bs-button type="info">Info</bs-button>`);
    });

    it("light", async function () {
        const element = await render(html`<bs-button type="light">Light</bs-button>`);
    });

    it("dark", async function () {
        const element = await render(html`<bs-button type="dark">Dark</bs-button>`);
    });

    it("link", async function () {
        const element = await render(html`<bs-button type="link">Link</bs-button>`);
    });

});

describe("button styles", function () {

    before(function () {
        /* await render(html`<bs-button type="info">${title}</bs-button>`)*/
    });

    it("primary", async function () {
        const element = await render(html`<bs-button type="primary">Primary</bs-button>`);
    });

    it("secondary", async function () {
        const element = await render(html`<bs-button type="secondary">Secondary</bs-button>`);
        throw new Error("123");
    });

    it("success", async function () {
        const element = await render(html`<bs-button type="success">Success</bs-button>`);
    });

    it("danger", async function () {
        const element = await render(html`<bs-button type="danger">Danger</bs-button>`);
    });

    it("warning", async function () {
        const element = await render(html`<bs-button type="warning">Warning</bs-button>`);
    });

    it("info", async function () {
        const element = await render(html`<bs-button type="info">Info</bs-button>`);
    });

    it("light", async function () {
        const element = await render(html`<bs-button type="light">Light</bs-button>`);
    });

    it("dark", async function () {
        const element = await render(html`<bs-button type="dark">Dark</bs-button>`);
    });

    it("link", async function () {
        const element = await render(html`<bs-button type="link">Link</bs-button>`);
    });


    describe("sample inner suite", function () {

        it("fails miserably", async function () {
            expect(1).to.equal(2);
        });

        it("throws an Error", async function () {
            throw new Error("sample error");
        });

        it("never resolves", async function () {
            return new Promise(resolve => {
            });
        });

        it("stays pending");

    });

});


