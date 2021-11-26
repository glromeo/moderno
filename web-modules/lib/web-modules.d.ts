import { WebModulesFactory, WebModulesOptions } from "./index";
export declare type EntryProxyResult = {
    code: string;
    imports: string[];
    external: string[];
};
export declare function defaultOptions(): WebModulesOptions;
export declare const useWebModules: WebModulesFactory;
