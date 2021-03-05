import fastDiff from "fast-diff";

let snapshots = {};

onmessage = async function ({data}) {
    if (data.load) {
        try {
            const response = await fetch("/snapshots" + data.load);
            snapshots = Object.create(await response.json());
        } catch (e) {
            snapshots = {};
        } finally {
            postMessage("ready");
        }
    } else if (data.save) {
        try {
            const response = await fetch("/snapshots" + data.save, {
                method: "PUT",
                headers: {
                    "content-type": "application/json; charset=UTF-8"
                },
                body: JSON.stringify(snapshots)
            });
            postMessage(response.ok ? "done" : "failed");
        } catch (err) {
            console.log("error saving snapshots:", err);
            postMessage("failed");
        }
    } else if (data.match) {

        const {
            match: actual,
            name,
            key,
            counter
        } = data;

        snapshots[name] = snapshots[name] || [];

        const expected = snapshots[name][counter] || (snapshots[name][counter] = actual);

        postMessage({
            key,
            match: {
                pass: actual === expected,
                message: "actual snapshot doesn't match expected"
            }
        });

        console.time("worker diff");
        const parts = fastDiff(expected, actual);
        console.timeEnd("worker diff");

        postMessage({
            key,
            diff: parts
        });
    }
};
