![logo](https://github.com/glromeo/moderno/raw/master/web-modules/logo.png)

The purpose of this library is to create ESM micro bundles to be served during development.
Similar to [esinstall](https://www.npmjs.com/package/esinstall) from which I took a LOT of inspiration the goal is to
make let the browser consume node_modules today.

## Installation

```
npm install @moderno/web-modules
```

## Javascript/Typescript API

```typescript
import {useWebModules} from "exnext-web-modules";

let {bundleWebModule} = useWebModules(options);

await bundleWebModule("react");  // bundles react into /web_modules/react.js

await bundleWebModule("lit-html");  // bundles lit-html into /web_modules/lit-html.js
                                    // because of the esm entry proxy this micro-bundle 
                                    // will include all the files in lib

await bundleWebModule("lit-html/directives/repeat.js");  // bundles lit-html/directives/repeat into 
                                                         // /web_modules/lit-html/directives/repeat.js
                                                         // NOTE: directives are not part of 
                                                         // lit-hmtl micro-bundle
```

## Comman Line Interface
It wouldbe a nice have to be able to create web_modules from the command line but I don't have the time to invest in this effort. 


A big thank you to Rich Harris for the amazing [Rollup.js](https://rollupjs.org), Guy Bedford for [cjs-module-lexer](https://github.com/guybedford/cjs-module-lexer)
and [es-module-lexer](https://github.com/guybedford/ed-module-lexer) without which this PoC couldn't be possible 
and Fred K. Schott because [Snowpack](https://www.snowpack.dev/) has been a great source of inspiration.
