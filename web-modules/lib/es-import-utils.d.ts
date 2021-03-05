export declare function isBare(url: string): boolean;
export declare function posixPathnameToModuleUrl(pathname: string): string;
export declare const pathnameToModuleUrl: typeof posixPathnameToModuleUrl;
export declare function parseModuleUrl(pathname: string): [string | null, string | null];
export declare const toPosix: (pathname: any) => any;
