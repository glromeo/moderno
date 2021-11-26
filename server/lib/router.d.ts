import Router, { HTTPVersion } from "find-my-way";
import { ModernoOptions } from "./configure";
export declare function createRouter<V extends HTTPVersion = HTTPVersion.V1>(options: ModernoOptions): Router.Instance<V>;
