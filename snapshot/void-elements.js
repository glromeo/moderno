const VOID_ELEMENTS = new Set([
    "AREA",
    "BASE",
    "BR",
    "COL",
    "COMMAND",
    "EMBED",
    "HR",
    "IMG",
    "INPUT",
    "KEYGEN",
    "LINK",
    "MENUITEM",
    "META",
    "PARAM",
    "SOURCE",
    "TRACK",
    "WBR"
]);

export default VOID_ELEMENTS;

export function isVoid({tagName}) {
    return VOID_ELEMENTS.has(tagName);
}