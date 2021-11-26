import { ModernoOptions } from "../configure";
import { Resource } from "./resource-provider";
export declare function useRouter(options: ModernoOptions): {
    route: (url: string) => Promise<Resource>;
};
