import { TransformOptions } from "@babel/core";
import { FSWatcher, WatchOptions } from "chokidar";
import { CorsOptions } from "cors";
import { WebModulesOptions } from "@moderno/web-modules";
import { Options } from "etag";
import Router, { HTTPVersion } from "find-my-way";
import Server from "http-proxy";
import { SyncOptions } from "node-sass";
import { ServerOptions } from "./server";
import { MessagingOptions } from "./messaging";
export declare type FindMyWayMiddleware = (router: Router.Instance<HTTPVersion.V1 | HTTPVersion.V2>, options: ModernoOptions, watcher: FSWatcher) => void;
export declare type ModernoOptions = WebModulesOptions & {
    extends?: ModernoOptions;
    rootDir: string;
    log?: {
        level: "trace" | "debug" | "info" | "warn" | "error" | "nothing";
        details?: boolean;
        compact?: boolean;
    };
    http2?: "push" | "preload" | false;
    server?: ServerOptions;
    resources: string;
    watcher?: WatchOptions;
    router: Router.Config<HTTPVersion.V1 | HTTPVersion.V2>;
    middleware: FindMyWayMiddleware[];
    proxy: {
        [path: string]: Server.ServerOptions;
    };
    cors: CorsOptions;
    etag: Options;
    cache?: boolean;
    encoding: "gzip" | "brotli" | "br" | "deflate" | "deflate-raw" | undefined;
    transform: {
        include: string | string[];
        exclude: string | string[];
        preProcess?(filename: string, code: string): string;
    };
    mount: {
        [path: string]: string;
    };
    babel: TransformOptions;
    sass: SyncOptions;
    messaging?: MessagingOptions;
    plugins: (ModernoOptions | string)[];
};
export declare function defaultOptions(args: Args): ModernoOptions;
export declare type Args = {
    config?: string;
    root?: string;
    plugin?: string | string[];
    debug?: boolean;
    production?: boolean;
};
export declare function configure(args?: Args, override?: any): Readonly<ModernoOptions>;
