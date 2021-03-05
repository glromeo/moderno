function createNode(fragment, children = null) {
    if (children) {
        children = new Map(children.map(child => [child.fragment.charCodeAt(0), child]));
    }
    return {
        fragment,
        children,
        store: null,
        variable: null,
        wildcard: null
    };
}

function sliceNode(node, fragment, sliceIndex) {
    const existing = {...node, fragment: node.fragment.slice(sliceIndex)};
    Object.assign(node, createNode(fragment, [existing]));
    return existing;
}

function splitNode(node, fragment, splitIndex) {
    const existing = {...node, fragment: node.fragment.slice(splitIndex)};
    const added = createNode(fragment.slice(splitIndex));
    Object.assign(node, createNode(node.fragment.slice(0, splitIndex), [existing, added]));
    return added;
}

class Router {

    constructor() {
        this.rootNode = createNode("/");
    }

    createStore() {
        return Object.create(null);
    }

    register(path) {
        if (typeof path !== "string") {
            throw new TypeError("path must be a string");
        }
        if (path[0] !== "/") {
            throw new Error("path must be absolute");
        }

        const endsWithWildcard = path.endsWith("*");
        if (endsWithWildcard) {
            path = path.slice(0, -1);
        }

        let node = this.rootNode;

        const regExp = /(?<fragment>\/[^:]*)(?<variable>:[^/]+)?/g;
        let match = regExp.exec(path);
        while (match) {
            let {
                fragment,
                variable
            } = match.groups;

            match = regExp.exec(path); // lookahead used by if (variable) {...}

            if (fragment) {

                let j = 0;
                while (true) {

                    if (j === fragment.length) {
                        if (j < node.fragment.length) sliceNode(node, fragment, j);
                        break;
                    }

                    if (j === node.fragment.length) {
                        const cc = fragment.charCodeAt(j);
                        if (node.children === null) {
                            node.children = new Map();
                        } else if (node.children.has(cc)) {
                            node = node.children.get(cc);
                            fragment = fragment.slice(j);
                            j = 0;
                            continue;
                        }
                        const child = createNode(fragment.slice(j));
                        node.children.set(cc, child);
                        node = child;
                        break;
                    }

                    if (fragment[j] !== node.fragment[j]) {
                        node = splitNode(node, fragment, j);
                        break;
                    }

                    ++j;
                }
            }

            if (variable) {
                const name = variable.slice(1);
                if (node.variable === null) {
                    node.variable = {
                        name,
                        child: null,
                        store: null
                    };
                } else if (node.variable.name !== name) {
                    throw new Error(`Cannot create route "${path}" with variable "${name}", ` +
                        `a route already exists with a different variable name "${node.variable.name}" ` +
                        `in the same location`);
                }

                if (match) {
                    if (node.variable.child === null) {
                        node.variable.child = createNode(match.groups.fragment);
                    }
                    node = node.variable.child;
                } else {
                    node = node.variable;
                    break;
                }
            }
        }

        if (endsWithWildcard) {
            if (node.wildcard === null) {
                node.wildcard = this.createStore();
            }
            return node.wildcard;
        }

        if (node.store === null) {
            node.store = this.createStore();
        }

        return node.store;
    }

    find(url) {
        if (url === "" || url[0] !== "/") {
            return null;
        }

        const queryIndex = url.indexOf("?");
        const urlLength = queryIndex >= 0 ? queryIndex : url.length;

        return matchRoute(url, urlLength, this.rootNode, 0);
    }

    debugTree() {
        return require("object-treeify")(debugNode(this.rootNode)).replace(/^.{3}/gm, "");
    }

}

function matchRoute(url, urlLength, node, startIndex) {
    const {fragment} = node;
    const fragmentLength = fragment.length;
    const fragmentEndIndex = startIndex + fragmentLength;

    if (fragmentLength > 1) {
        if (fragmentEndIndex > urlLength) {
            return null;
        }
        if (fragmentLength < 15) {
            for (let i = 1, j = startIndex + 1; i < fragmentLength; ++i, ++j) {
                if (fragment[i] !== url[j]) {
                    return null;
                }
            }
        } else if (url.indexOf(fragment, startIndex) !== startIndex) {
            return null;
        }
    }

    startIndex = fragmentEndIndex;

    if (startIndex === urlLength) {
        if (node.store !== null) {
            return {
                store: node.store,
                params: {}
            };
        }
        if (node.wildcard !== null) {
            return {
                store: node.wildcard,
                params: {"*": ""}
            };
        }
        return null;
    }

    if (node.children !== null) {
        const child = node.children.get(url.charCodeAt(startIndex));
        if (child !== undefined) {
            const route = matchRoute(url, urlLength, child, startIndex);
            if (route !== null) {
                return route;
            }
        }
    }

    if (node.variable !== null) {
        const variable = node.variable;
        const slashIndex = url.indexOf("/", startIndex);

        if (slashIndex >= startIndex && slashIndex < urlLength) {
            if (variable.child !== null && slashIndex !== startIndex) {
                const route = matchRoute(url, urlLength, variable.child, slashIndex);
                if (route !== null) {
                    route.params[variable.name] = url.slice(startIndex, slashIndex);
                    return route;
                }
            }
        } else if (variable.store !== null) {
            const params = {};
            params[variable.name] = url.slice(startIndex, urlLength);
            return {
                store: variable.store,
                params
            };
        }
    }

    if (node.wildcard !== null) {
        return {
            store: node.wildcard,
            params: {
                "*": url.slice(startIndex, urlLength)
            }
        };
    }

    return null;
}

function debugNode(node) {
    if (node.store === null && node.children === null) { // Can compress output better
        if (node.variable === null) { // There is only a wildcard store
            return {[node.fragment + "* (s)"]: null};
        }

        if (node.wildcard === null) { // There is only a parametric child
            if (node.variable.store === null) {
                return {
                    [node.fragment + ":" + node.variable.name]:
                        debugNode(node.variable.child)
                };
            }

            if (node.variable.child === null) {
                return {
                    [node.fragment + ":" + node.variable.name + " (s)"]: null
                };
            }
        }
    }

    const childRoutes = {};

    if (node.children !== null) {
        for (const childNode of node.children.values()) {
            Object.assign(childRoutes, debugNode(childNode));
        }
    }

    if (node.variable !== null) {
        const {variable} = node;
        const label = ":" + variable.name + debugStore(variable.store);

        childRoutes[label] = variable.child === null
            ? null
            : debugNode(variable.child);
    }

    if (node.wildcard !== null) {
        childRoutes["* (s)"] = null;
    }

    return {
        [node.fragment + debugStore(node.store)]: childRoutes
    };
}

function debugStore(store) {
    return store === null ? "" : " (s)";
}

module.exports = Router;
