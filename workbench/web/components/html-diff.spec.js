import {html} from "lit-html";
import "./html-diff.js";
import {render, text} from "@moderno/workbench";

describe("html-diff", function () {

    const fixture = render(html`<html-diff title=${text("title", "Difference")}></html-diff>`);

    it("sample code diff", async function () {
        fixture.left = `
            I am the very model of a modern Major-General,
            I've information vegetable, animal, and mineral,
            I know the kings of England, and I quote the fights historical,
            From Marathon to Waterloo, in order categorical.
        `;
        fixture.right = `
            I am the very model of a cartoon individual,
            My animation's comical, unusual, and whimsical,
            I'm quite adept at funny gags, comedic theory I have read,
            From wicked puns and stupid jokes to anvils that drop on your head.
        `;
        await fixture.updateComplete;
        await fixture.updateComplete;
        await expectAsync(fixture).toMatchSnapshot();
    });

    describe("html-diff2", function () {
    /**
     * @type {LitElement}
     */
    const fixture2 = render(html`<html-diff title=${text("title", "Difference")}></html-diff>`);

    it("sample code diff 2", async function () {
        fixture2.left = `
            I am the very model of a modern Major-General,
            I've information vegetable, animal, and mineral,
            I know the kings of England, and I quote the fights historical,
            From Marathon to Waterloo, in order categorical.
        `;
        fixture2.right = `
            I am the very model of a cartoon individual,
            My animation's comical, unusual, and whimsical,
            I'm quite adept at funny gags, comedic theory I have read,
            From wicked puns and stupid jokes to anvils that drop on your head.
        `;
        await fixture2.updateComplete;
        await fixture2.updateComplete;
        await expectAsync(fixture2).toMatchSnapshot();
    });
    });

});
