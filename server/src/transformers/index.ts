import {posix} from "path";
import memoized from "nano-memoize";
import picomatch from "picomatch";
import {ModernoOptions} from "../configure";
import {Resource} from "../providers/resource-provider";
import {
    CSS_CONTENT_TYPE,
    HTML_CONTENT_TYPE,
    JAVASCRIPT_CONTENT_TYPE,
    SASS_CONTENT_TYPE,
    SCSS_CONTENT_TYPE,
    TYPESCRIPT_CONTENT_TYPE
} from "../util/mime-types";
import {useBabelTransformer} from "./babel-transformer";
import {useEsBuildTransformer} from "./esbuild-transformer";
import {useHtmlTransformer} from "./html-transformer";
import {useSassTransformer} from "./sass-transformer";

export type SourceMap = {
    version: number;
    sources: string[];
    names: string[];
    sourceRoot?: string;
    sourcesContent?: string[];
    mappings: string;
    file: string;
}

export type TransformerOutput = {
    content: string
    map?: SourceMap | null;
    headers: {
        "content-type": typeof JAVASCRIPT_CONTENT_TYPE | typeof HTML_CONTENT_TYPE | typeof CSS_CONTENT_TYPE,
        "content-length": number,
        "x-transformer": "babel-transformer" | "sass-transformer" | "html-transformer" | "esbuild-transformer"
    },
    links?: string[] // absolute filenames of all imported files
    includedFiles?: string[]  // absolute filenames of all included files (e.g. sass imports)
}

export const useTransformers = memoized((options: ModernoOptions) => {

    const {htmlTransformer} = useHtmlTransformer(options);
    const {esbuildTransformer} = useEsBuildTransformer(options);
    const {babelTransformer} = useBabelTransformer(options);
    const {sassTransformer} = useSassTransformer(options);

    const include = options.transform?.include && picomatch(options.transform.include);
    const exclude = options.transform?.exclude && picomatch(options.transform.exclude);

    function shouldTransform({headers, pathname, query}: Resource) {
        let should = headers["x-transformer"] !== "none" && headers["cache-control"] === "no-cache" || !!query?.type;
        if (should) {
            should = !(include && !include(pathname) || exclude && exclude(pathname));
        }
        return should;
    }

    async function applyTransformer(filename, content, contentType, query): Promise<TransformerOutput | void> {
        switch (contentType) {
            case HTML_CONTENT_TYPE:
                return htmlTransformer(filename, content);
            case CSS_CONTENT_TYPE:
            case SASS_CONTENT_TYPE:
            case SCSS_CONTENT_TYPE:
                return sassTransformer(filename, content, query.type);
            case JAVASCRIPT_CONTENT_TYPE:
            case TYPESCRIPT_CONTENT_TYPE:
                if (options.babel) {
                    return babelTransformer(filename, content);
                } else {
                    return esbuildTransformer(filename, content);
                }
        }
    }

    async function transformContent(resource: Resource) {
        try {
            const hrtime = process.hrtime();

            const filename = resource.filename;
            const content = resource.content instanceof Buffer ? resource.content.toString("utf-8") : resource.content;
            const contentType = resource.headers["content-type"];

            const transformed = await applyTransformer(filename, content, contentType, resource.query);
            if (transformed) {
                resource.content = transformed.content;

                resource.headers["content-type"] = transformed.headers["content-type"];
                resource.headers["content-length"] = transformed.headers["content-length"];
                resource.headers["x-transformer"] = transformed.headers["x-transformer"];
                resource.headers["x-transform-duration"] = `${formatHrtime(process.hrtime(hrtime))}sec`;

                if (transformed.links) {
                    // TODO: check all the transformers to make sure this resolution is no longer necessary
                    const base = posix.dirname(resource.pathname);
                    resource.links = transformed.links.map(link => {
                        return posix.resolve(base, link);
                    });
                }

                if (transformed.includedFiles) {
                    resource.watch = transformed.includedFiles;
                }

                return transformed.map;
            }

        } catch (error) {
            error.message = `unable to transform: ${resource.filename}\n${error.message}`;
            throw error;
        }
    }

    function formatHrtime(hrtime: [number, number]) {
        return (hrtime[0] + (hrtime[1] / 1e9)).toFixed(3);
    }

    return {
        shouldTransform,
        transformContent
    };
});