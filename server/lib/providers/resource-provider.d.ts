/// <reference types="node" />
import { OutgoingHttpHeaders } from "http";
export declare type Query = {
    [name: string]: string;
};
export declare type Resource = {
    pathname: string;
    query: Query;
    filename: string;
    content: string | Buffer;
    headers: OutgoingHttpHeaders;
    links: readonly string[];
    watch?: readonly string[];
    onchange?: () => void;
};
export declare const NO_LINKS: readonly never[];
export declare const NO_QUERY: Readonly<{}>;
export declare const useResourceProvider: any;
