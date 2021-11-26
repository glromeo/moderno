function createTemplate(innerHTML) {
    const template = document.createElement("template");
    template.innerHTML = innerHTML;
    return () => template.content.cloneNode(true).firstElementChild;
}

export const cloneListTemplate = createTemplate(`
<div id="view-port">
    <div id="scroll-area">
        <div id="heading" class="heading">Heading</div>
        <div id="top" class="filler"></div>
        <div id="bottom" class="filler"></div>
    </div>
</div>
`);


