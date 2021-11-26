import db from "mime-db";

export const JSON_CONTENT_TYPE = "application/json; charset=UTF-8";
export const TEXT_CONTENT_TYPE = "text/plain; charset=UTF-8";
export const JAVASCRIPT_CONTENT_TYPE = "application/javascript; charset=UTF-8";
export const TYPESCRIPT_CONTENT_TYPE = "application/x-typescript; charset=UTF-8";
export const HTML_CONTENT_TYPE = "text/html; charset=UTF-8";
export const SASS_CONTENT_TYPE = "text/x-sass; charset=UTF-8";
export const SCSS_CONTENT_TYPE = "text/x-scss; charset=UTF-8";
export const CSS_CONTENT_TYPE = "text/css; charset=UTF-8";

const mimeTypes = new Map();

for (const contentType of Object.getOwnPropertyNames(db)) {
    const mimeType = db[contentType];
    if (mimeType.extensions) for (const ext of mimeType.extensions) {
        mimeTypes.set(ext, mimeType);
        mimeType.contentType = `${contentType}; charset=${mimeType.charset || "UTF-8"}`;
    }
}

const JAVASCRIPT_MIME_TYPE = mimeTypes.get("js");
JAVASCRIPT_MIME_TYPE.extensions.push("jsx");
mimeTypes.set("jsx", JAVASCRIPT_MIME_TYPE);

const TYPESCRIPT_MIME_TYPE = {
    "source": "unknown",
    "charset": "UTF-8",
    "compressible": true,
    "extensions": ["ts", "tsx"],
    "contentType": "application/x-typescript; charset=UTF-8"
};
mimeTypes.set("ts", TYPESCRIPT_MIME_TYPE);
mimeTypes.set("tsx", mimeTypes.get("ts"));

export function contentType(filename = "") {
    const mimeType = mimeTypes.get(filename);
    if (mimeType) {
        return mimeType.contentType;
    }
    const dot = filename.lastIndexOf(".") + 1;
    if (dot > 0) {
        const mimeType = mimeTypes.get(filename.substring(dot));
        if (mimeType) {
            return mimeType.contentType;
        }
    }
}
