import log from "@moderno/logger";
import {glob} from "glob";
import path, {posix} from "path";
import {toPosix} from "./es-import-utils";
import {readJson} from "./utility";

type PathConverter = (pathname: any) => string;

function readManifest(basedir: string, makeRelative: PathConverter, entries = new Map<string, string>()) {
    log.debug("reading manifest from:", basedir);
    try {
        let {name, workspaces} = readJson(path.join(basedir, "package.json"));
        entries.set(name, makeRelative(basedir));
        if (workspaces) for (const workspace of workspaces) {
            let manifests = glob.sync(`${workspace}/package.json`, {
                cwd: basedir,
                nonull: true
            });
            for (const manifest of manifests) {
                let dirname = path.dirname(path.join(basedir, manifest));
                readManifest(dirname, makeRelative, entries);
            }
        }
        return entries;

    } catch (ignored) {
        log.debug("no package.json found at:", basedir);
    }
}

export function readWorkspaces(rootDir: string): Map<string, string> {
    const makeRelative = pathname => posix.join("/workspaces", toPosix(path.relative(rootDir, pathname)));
    let workspaces = readManifest(rootDir, makeRelative)!;
    return workspaces;
}
