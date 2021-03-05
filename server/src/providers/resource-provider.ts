import chalk from "chalk";
import etag from "etag";
import {promises as fs} from "fs";
import {OutgoingHttpHeaders} from "http";
import memoized from "nano-memoize";
import path from "path";
import log from "@moderno/logger";
import {ModernoOptions} from "../configure";
import {SourceMap, useTransformers} from "../transformers";
import {contentType, JSON_CONTENT_TYPE} from "../util/mime-types";
import {MultiMap} from "../util/multi-map";
import {useZlib} from "../util/zlib";
import {useWatcher} from "../watcher";
import {useMessaging} from "../messaging";
import {useRouter} from "./router";


export type Query = { [name: string]: string };

export type Resource = {
    pathname: string
    query: Query
    filename: string
    content: string | Buffer
    headers: OutgoingHttpHeaders
    links: readonly string[]
    watch?: readonly string[]
    onchange?: () => void
}

export const NO_LINKS = Object.freeze([]);
export const NO_QUERY = Object.freeze({});

export const useResourceProvider = memoized(function (options: ModernoOptions) {

    const cache = new Map<string, Resource | Promise<Resource>>();
    const watched = new MultiMap<string, string>();
    const dependants = new MultiMap<string, string>();

    const ws = useMessaging(options);
    const watcher = useWatcher(options);

    function watch(filename: string, url: string) {
        const relative = path.relative(options.rootDir, filename);
        if (!watched.has(relative)) {
            watcher.add(relative);
        }
        watched.add(relative, url);
    }

    function unwatch(filename: string, url: string | null = null) {
        if (url !== null) {
            let urls = watched.get(filename);
            if (urls) {
                urls.delete(url);
                if (!urls.size) {
                    watcher.unwatch(filename);
                }
            }
        } else {
            watched.delete(filename);
            watcher.unwatch(filename);
        }
    }

    watcher.on("change", function (filename: string) {
        const urls = watched.get(filename);
        if (urls) {
            for (const url of urls) {
                const resource = cache.get(url);
                if (resource) {
                    log.debug("change:", filename, "->", url);
                    cache.set(url, Promise.resolve(resource).then(reload).then(pipeline).then(resource => {
                        cache.set(url, resource);
                        return resource;
                    }));
                } else {
                    log.warn("no cache entry for:", url);
                    unwatch(filename, url);
                }
                ws.broadcast("hmr:update", {url});
            }
        } else {
            log.warn("no urls for filename:", filename);
            unwatch(filename);
        }
    });

    watcher.on("unlink", function (event, filename) {
        const urls = watched.get(filename);
        if (urls) for (const url of urls) {
            log.debug("unlink:", filename, "->", url);
            let resource = cache.get(url);
            if (resource && !(resource instanceof Promise)) {
                unwatch(resource.filename);
                if (resource.watch) {
                    for (const filename of resource.watch) unwatch(filename, url);
                }
                cache.delete(url);
            }
        }
        unwatch(filename);
    });

    const {route} = useRouter(options);
    const {shouldTransform, transformContent} = useTransformers(options);
    const {applyCompression} = useZlib(options);

    /**
     *          _            _ _
     *         (_)          | (_)
     *    _ __  _ _ __   ___| |_ _ __   ___
     *   | '_ \| | '_ \ / _ \ | | '_ \ / _ \
     *   | |_) | | |_) |  __/ | | | | |  __/
     *   | .__/|_| .__/ \___|_|_|_| |_|\___|
     *   | |     | |
     *   |_|     |_|
     *
     * @param resource
     */
    async function pipeline(resource: Resource) {
        if (shouldTransform(resource)) {
            const sourceMap = await transformContent(resource);
            if (sourceMap) {
                storeSourceMap(resource.filename, resource.pathname, resource.query, sourceMap);
            }
        }
        await etagHeader(resource);
        if (options.encoding) {
            await compressContent(resource);
        }
        return resource;
    }

    function storeSourceMap(filename: string, pathname: string, query: Query, map?: SourceMap | null) {

        const content = applyCompression(JSON.stringify(map), "deflate");
        const sourceMapUrl = pathname + ".map";
        const sourceMapFilename = filename + ".map";

        cache.set(sourceMapUrl, {
            filename: sourceMapFilename,
            pathname: sourceMapUrl,
            query: query,
            content: content,
            headers: {
                "content-type": JSON_CONTENT_TYPE,
                "content-length": content.length, // Buffer.byteLength(content),
                "content-encoding": "deflate",
                "last-modified": new Date().toUTCString(),
                "cache-control": "no-cache"
            },
            links: NO_LINKS
        });
    }

    async function reload(resource: Resource): Promise<Resource> {
        const stats = await fs.stat(resource.filename);
        resource.content = await fs.readFile(resource.filename);
        resource.headers["content-type"] = contentType(resource.filename);
        resource.headers["content-length"] = stats.size;
        resource.headers["last-modified"] = stats.mtime.toUTCString();
        return resource;
    }

    async function etagHeader({headers, pathname}: Resource) {
        headers["etag"] = etag(`${pathname} ${headers["content-length"]} ${headers["last-modified"]}`, options.etag);
    }

    async function compressContent(resource: Resource) {
        try {
            resource.content = applyCompression(resource.content);
            resource.headers = {
                ...(resource.headers),
                "content-length": resource.content.length,
                "content-encoding": options.encoding
            };
        } catch (err) {
            log.error(`failed to deflate resource: ${resource.filename}`, err);
        }
    }

    return {
        async provideResource(url: string): Promise<Resource> {
            let resource = cache.get(url);
            if (resource) {
                log.debug("retrieved from cache:", chalk.magenta(url));
            } else {
                resource = route(url).then(pipeline).then(resource => {
                    if (options.cache && resource.filename) {
                        cache.set(url, resource);
                        watch(resource.filename, url);
                        if (resource.watch) {
                            for (const filename of resource.watch) watch(filename, url);
                        }
                    }
                    return resource;
                }).finally(function () {
                    if (!options.cache) {
                        cache.delete(url);
                    }
                });

                cache.set(url, resource);
            }
            return resource;
        }
    };
});

