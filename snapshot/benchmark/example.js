const fastDiff = require("fast-diff");
const fs = require("fs");

const left = fs.readFileSync("./fixture-left.txt", "UTF-8");
const right = fs.readFileSync("./fixture-right.txt", "UTF-8");

const HTML_ESCAPE = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
    "\r": ""
};

const http = require("http");
const port = 4000;

http.createServer((request, response) => {

    let expected = "", actual = "", line, span = false;

    console.time("diff");

    const parts = fastDiff(left, right);

    console.timeEnd("diff");

    for (let [type, text] of parts) {

        const typeClass = type > 0 ? "add" : type < 0 ? "remove" : "same";
        text = text.replace(/[&<>"'\\/\r]/g, match => HTML_ESCAPE[match]);

        do {
            const nl = text.indexOf("\n");
            if (nl === -1) {
                if (!line) {
                    line = type === 0 ? [text, text] : type === 1 ? ["", `<span class="add">${text}`] : [`<span class="remove">${text}`, ""];
                    span = type !== 0;
                } else {
                    if (span) {
                        line = [line[0] + "</span>", line[1] + "</span>"];
                    }
                    line = type === 0 ? [line[0] + text, line[1] + text] : type === 1 ? [line[0], `${line[1]}<span class="add">${text}`] : [`${line[0]}<span class="remove">${text}`, line[1]];
                    span = type !== 0;
                }
                break;
            } else {
                const next = text.substring(0, nl);
                text = text.substring(nl + 1);
                if (!line) {
                    if (type <= 0) {
                        expected += `<div class="${typeClass}">${next}</div>\n`;
                    }
                    if (type >= 0) {
                        actual += `<div class="${typeClass}">${next}</div>\n`;
                    }
                } else {
                    if (span) {
                        line = [line[0] + "</span>", line[1] + "</span>"];
                    }
                    line = type === 0 ? [line[0] + next, line[1] + next] : type === 1 ? [line[0], `${line[1]}<span class="add">${next}`] : [`${line[0]}<span class="remove">${next}`, line[1]];
                    expected += `<div class="diff">${line[0]}</div>\n`;
                    actual += `<div class="diff">${line[1]}</div>\n`;
                    line = undefined;
                }
            }
        } while (text);

    }

    response.writeHead(200, {"content-type": "text/html; charset=UTF-8"});
    response.end(`<html lang="en">
<head>
    <title>Example</title>
    <style type="text/css">
        html {
            box-sizing: border-box;
            font-size: 14px;
            font-family: Consolas, monospace;
        }

        body {
            margin: 0;
            width: 100vw;
            height: 100vh;
            overflow-y: scroll;
            overflow-x: hidden;
        }

        .same {
            background-color: white;
            color: darkgray;
            white-space: pre;
        }

        .diff {
            background-color: lightgray;
            color: black;
            white-space: pre;
        }

        .add {
            background-color: lightskyblue;
            color: darkblue;
            white-space: pre;
        }

        .remove {
            background-color: lightpink;
            color: darkred;
            white-space: pre;
        }

        span.add {
            font-weight: bold;
        }

        .container {
            width: 100%;
            display: flex;
            align-items: stretch;
        }
        
        .expected {
            flex: 1 1 auto;
            min-width: 0px;
            overflow-x: scroll;
        }

        .actual {
            flex: 1 1 auto;
            min-width: 0px;
            overflow-x: scroll;
        }
        
    </style>
</head>
<body>
<div class="container">
    <div class="expected">${expected}</div>
    <div style="padding: 1rem;"></div>
    <div class="actual">${actual}</div>
</div>
</body>
</html>
    `);

}).listen(port, (err) => {
    console.log(`ready, go to: http://localhost:${port}`);
});