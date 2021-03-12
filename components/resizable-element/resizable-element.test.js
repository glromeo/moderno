import {render} from "@moderno/workbench";
import {html} from "lit-html";
import "./resizable-element.js";

describe("bootstrap buttons", function () {

    const element = render(html`
        <resizable-element top left right bottom style="background-color:red; padding: 3em">
            <img src="https://interactive-examples.mdn.mozilla.net/media/examples/grapefruit-slice-332-332.jpg" 
                 alt="Grapefruit slice atop a pile of other slices" style="display: block; width: 100%; height: 100%; pointer-events: none;">
        </resizable-element>
    `);

    it("can be resized", async function () {

    });

});
