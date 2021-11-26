import {directive, html, render as litHtmlRender} from "lit-html";

export const context = {
    suite: {id: "suite0", fixtures: []}
};

const requestNavigatorUpdate = navigator.webdriver
    ? () => undefined
    : () => document.getElementById("navigator").requestUpdate();

let fixtureKnobs;

function ordinal(n) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function render() {

    const [name, template] = arguments.length === 1 ? [undefined, arguments[0]] : arguments;

    const {id, fixtures} = context.suite;

    const fixturesElement = document.getElementById("fixtures");
    if (!fixturesElement.slots.has(id)) {
        fixturesElement.slots.add(id);
        fixturesElement.requestUpdate();
    }

    const fixture = document.createElement("test-fixture");
    fixture.setAttribute("name", name ? name : `${ordinal(fixtures.length + 1)} fixture`);
    fixture.setAttribute("slot", id);
    fixtureKnobs = [];
    litHtmlRender(template, fixture);
    fixture.knobs = fixtureKnobs;
    fixtureKnobs = undefined;

    fixtures.push(fixture);

    requestNavigatorUpdate();

    return fixturesElement.appendChild(fixture).firstElementChild;
}

export const text = directive(function (label, defaultValue) {
    return function (part) {

        function commitValue(value = defaultValue) {
            part.setValue(value);
            part.commit();
        }

        function clear(e) {
            const parentElement = e.target.closest("bs-textfield");
            commitValue(defaultValue);
            parentElement.input.value = defaultValue;
            e.stopPropagation();
        }

        fixtureKnobs.push(html`
            <bs-textfield class="mb-1" placeholder=${label} .value=${defaultValue} @bs:change=${e => commitValue(e.detail.value)}>
                <fa-icon sm slot="append" name="times" class="text-primary" @click=${clear}></fa-icon>                                
            </bs-textfield>
        `);
        commitValue();
    };
});
