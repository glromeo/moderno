export interface PackageMeta {
    name: string;
    version: string;
    dependencies: {
        [name: string]: string;
    };
    peerDependencies: {
        [name: string]: string;
    };
    devDependencies: {
        [name: string]: string;
    };
    [key: string]: any;
}
export interface ImportMap {
    imports: {
        [packageName: string]: string;
    };
}
export declare function readJson(filename: any): any;
export declare function stripExt(filename: string): string;
export declare function readImportMap(rootDir: string, outDir: string): ImportMap;
export declare function writeImportMap(outDir: string, importMap: ImportMap): Promise<void>;
export declare function closestManifest(entryModule: string): any;
