(function() {
    const data = [...document.querySelectorAll("li svg.svg-inline--fa.fa-2x")].reduce((m, svg) => {
        const name = svg.getAttribute("data-icon");
        const p = svg.getAttribute("data-prefix");
        const variant = p === "fas" ? "solid" : p === "far" ? "regular" : p === "fal" ? "light" : "duotone";
        (m[name] = m[name] || {})[variant] = svg.parentElement.innerHTML;
        return m;
    }, window.__fa_icons__ || {});

    const filename = "fa-icons.json";

    const blob = new Blob([JSON.stringify(data, undefined, 4)], {type: "text/json"}),
        e = document.createEvent("MouseEvents"),
        a = document.createElement("a");

    a.download = filename;
    a.href = window.URL.createObjectURL(blob);
    a.dataset.downloadurl = ["text/json", a.download, a.href].join(":");
    e.initMouseEvent("click", true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
    a.dispatchEvent(e);
})();
