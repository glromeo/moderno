import {BuildOptions} from "esbuild";
import {Opts} from "resolve";
import {ImportMap} from "./utility";


//   __  __           _       _        _______
//  |  \/  |         | |     | |      |__   __|
//  | \  / | ___   __| |_   _| | ___     | |_   _ _ __   ___  ___
//  | |\/| |/ _ \ / _` | | | | |/ _ \    | | | | | '_ \ / _ \/ __|
//  | |  | | (_) | (_| | |_| | |  __/    | | |_| | |_) |  __/\__ \
//  |_|  |_|\___/ \__,_|\__,_|_|\___|    |_|\__, | .__/ \___||___/
//                                           __/ | |
//                                          |___/|_|

export type WebModulesOptions = {
    rootDir: string
    clean?: boolean                 // cleans the contents of web_modules before init
    init?: boolean                  // bundle all the dependencies at startup
    environment?: string
    resolve: Opts
    external?: string | string[]
    squash?: string[]
    esbuild?: BuildOptions
    notify?: boolean
};

export type ImportResolver = (url: string, importer?: string) => Promise<string>;

export type WebModulesAPI = {
    options: WebModulesOptions
    outDir: string
    importMap: ImportMap
    resolveImport: ImportResolver
    bundleWebModule: (source: string) => Promise<void>
}

export type WebModulesFactory = (options?: WebModulesOptions) => WebModulesAPI;

export type WebModulesNotificationType = "primary" | "secondary" | "info" | "success" | "warning" | "danger";

export interface WebModulesNotification {
    id: number;
    timeMs: number;
    sticky: boolean;
    type: WebModulesNotificationType;
    message: string;
}

//   __  __           _       _        ______                       _
//  |  \/  |         | |     | |      |  ____|                     | |
//  | \  / | ___   __| |_   _| | ___  | |__  __  ___ __   ___  _ __| |_ ___
//  | |\/| |/ _ \ / _` | | | | |/ _ \ |  __| \ \/ / '_ \ / _ \| '__| __/ __|
//  | |  | | (_) | (_| | |_| | |  __/ | |____ >  <| |_) | (_) | |  | |_\__ \
//  |_|  |_|\___/ \__,_|\__,_|_|\___| |______/_/\_\ .__/ \___/|_|   \__|___/
//                                                | |
//                                                |_|

export {
    notifications
} from "./notifications";

export {
    isBare,
    parseModuleUrl,
    pathnameToModuleUrl,
    toPosix
} from "./es-import-utils";

export {
    useWebModulesPlugin
} from "./babel-plugin-web-modules";

export {
    useWebModules
} from "./web-modules";
