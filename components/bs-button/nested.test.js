import {render, text} from "@moderno/workbench";
import {html} from "lit-html";
import "./bs-button.js";

describe("bootstrap buttons", function () {

    it("primary", async function () {
        return;
        const element = await render(html`<bs-button type="primary">Primary</bs-button>`);
    });

    it("secondary", async function () {
        return;
        const element = await render(html`
                <bs-button type="secondary">Secondary</bs-button>
            `);
    });

    it("success", async function () {
        return;
        const element = await render(html`
                <bs-button type="success">Success</bs-button>
            `);
    });

    it("danger", async function () {
        return;
        const element = await render(html`
                <bs-button type="danger">Danger</bs-button>
            `);
    });

    it("warning", async function () {
        return;
        const element = await render(html`
                <bs-button type="warning">Warning</bs-button>
            `);
    });

    it("info", async function () {
        return;
        const element = await render(html`
                <bs-button type="info">Info</bs-button>
            `);
    });

    it("light", async function () {
        return;
        const element = await render(html`
                <bs-button type="light">Light</bs-button>
            `);
    });

    it("dark", async function () {
        return;
        const element = await render(html`
                <bs-button type="dark">Dark</bs-button>
            `);
    });

    it("link", async function () {
        return;
        const element = await render(html`
                <bs-button type="link">Link</bs-button>
            `);
    });

    describe("nested", function () {

        it("primary", async function () {
            const element = render(html`<bs-button type="primary">Primary</bs-button>`);
        });

        it("secondary", async function () {
            const element = await render(html`
                <bs-button type="secondary">Secondary</bs-button>
            `);
        });

        it("success", async function () {
            const element = await render(html`
                <bs-button type="success">Success</bs-button>
            `);
        });

        it("danger", async function () {
            const element = await render(html`
                <bs-button type="danger">Danger</bs-button>
            `);
        });

        it("warning", async function () {
            const element = await render(html`
                <bs-button type="warning">Warning</bs-button>
            `);
        });

        it("info", async function () {
            const element = await render(html`
                <bs-button type="info">Info</bs-button>
            `);
        });

        it("light", async function () {
            const element = await render(html`
                <bs-button type="light">Light</bs-button>
            `);
        });

        it("dark", async function () {
            const element = await render(html`
                <bs-button type="dark">Dark</bs-button>
            `);
        });

        it("link", async function () {
            const element = await render(html`
                <bs-button type="link">Link</bs-button>
            `);
        });

    });

});
