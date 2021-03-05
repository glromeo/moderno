import { ImportResolver } from "./index";
export declare function replaceRequire(filename: string, resolveImport: ImportResolver, sourcemap: any): Promise<[void, void] | undefined>;
