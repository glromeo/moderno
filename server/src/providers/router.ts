import log from "@moderno/logger";
import {useWebModules} from "@moderno/web-modules";
import chalk from "chalk";
import {parse as parseURL} from "fast-url-parser";
import {promises as fs} from "fs";
import HttpStatus from "http-status-codes";
import path from "path";
import {ModernoOptions} from "../configure";
import {contentType} from "../util/mime-types";
import {NO_LINKS, Resource} from "./resource-provider";

export function useRouter(options: ModernoOptions) {

    const {bundleWebModule} = useWebModules(options);

    const {
        rootDir = process.cwd(),
        mount = {}
    } = options;

    const regExp = /\/[^/?]+/;

    async function resolve(pathname) {
        const match = regExp.exec(pathname);
        if (match) {
            const segment = match[0];
            if (segment === "/web_modules") {
                return {route: segment, filename: path.join(rootDir, pathname)};
            } else if (segment === "/workspaces") {
                return {route: segment, filename: path.join(rootDir, pathname.substring("/workspaces".length))};
            } else if (mount[segment]) {
                return {route: segment, filename: path.join(mount[segment], pathname.substring(segment.length))};
            } else if (mount[pathname]) {
                return {route: pathname, filename: "", resource: mount[pathname]};
            }
        }
        return {route: "/", filename: path.join(rootDir, pathname)};
    }

    async function route(url: string): Promise<Resource> {

        let {pathname, query} = parseURL(url, true);

        if (pathname.endsWith("ss.js") /* try and support openwc style for module names */) {
            if (pathname.endsWith(".scss.js") || pathname.endsWith(".sass.js") || pathname.endsWith(".css.js")) {
                pathname = pathname.slice(0, -3);
                query.type = "module";
            }
        }

        const {route, filename, resource} = await resolve(pathname);

        if (resource) {
            // @ts-ignore
            return {...resource, links: NO_LINKS} as Resource;
        }

        const stats = await fs.stat(filename).catch(error => {
            if (error.code === "ENOENT") {
                if (route === "/web_modules" && !filename.endsWith(".map")) {
                    log.warn("lazy loading:", chalk.magenta(filename));
                    return bundleWebModule(pathname.substring(13)).then(() => fs.stat(filename));
                }
            }
            throw error;
        }).catch(error => {
            if (error.code === "ENOENT") {
                if (pathname === "/favicon.ico") {
                    throw {code: HttpStatus.PERMANENT_REDIRECT, headers: {"location": "/resources/javascript.png"}};
                } else {
                    throw {code: HttpStatus.NOT_FOUND, message: error.stack};
                }
            } else {
                throw {code: HttpStatus.INTERNAL_SERVER_ERROR, message: error.stack};
            }
        });

        if (stats.isDirectory()) {
            let location;
            try {
                const {home} = require(path.resolve(filename, "package.json"));
                location = path.posix.join(pathname, home || "index.html");
            } catch (ignored) {
                location = path.posix.join(pathname, "index.html");
            }
            throw {code: HttpStatus.PERMANENT_REDIRECT, headers: {"location": location}};
        } else {
            return {
                pathname,
                query,
                filename,
                content: await fs.readFile(filename),
                headers: {
                    "content-type": contentType(filename),
                    "content-length": stats.size,
                    "last-modified": stats.mtime.toUTCString(),
                    "cache-control": route === "/web_modules" || route === "/node_modules" || route.startsWith("/esnext-") ? "public, max-age=86400, immutable" : "no-cache"
                },
                links: NO_LINKS
            };
        }
    }

    return {
        route
    };
}
