var __commonJS = (callback, module) => () => {
  if (!module) {
    module = {exports: {}};
    callback(module.exports, module);
  }
  return module.exports;
};

// ../../node_modules/react-refresh/cjs/react-refresh-runtime.development.js
var require_react_refresh_runtime_development = __commonJS((exports) => {
  /** @license React v0.9.0
   * react-refresh-runtime.development.js
   *
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   */
  "use strict";
  if (true) {
    (function() {
      "use strict";
      var REACT_ELEMENT_TYPE = 60103;
      var REACT_PORTAL_TYPE = 60106;
      var REACT_FRAGMENT_TYPE = 60107;
      var REACT_STRICT_MODE_TYPE = 60108;
      var REACT_PROFILER_TYPE = 60114;
      var REACT_PROVIDER_TYPE = 60109;
      var REACT_CONTEXT_TYPE = 60110;
      var REACT_FORWARD_REF_TYPE = 60112;
      var REACT_SUSPENSE_TYPE = 60113;
      var REACT_SUSPENSE_LIST_TYPE = 60120;
      var REACT_MEMO_TYPE = 60115;
      var REACT_LAZY_TYPE = 60116;
      var REACT_BLOCK_TYPE = 60121;
      var REACT_SERVER_BLOCK_TYPE = 60122;
      var REACT_FUNDAMENTAL_TYPE = 60117;
      var REACT_SCOPE_TYPE = 60119;
      var REACT_OPAQUE_ID_TYPE = 60128;
      var REACT_DEBUG_TRACING_MODE_TYPE = 60129;
      var REACT_OFFSCREEN_TYPE = 60130;
      var REACT_LEGACY_HIDDEN_TYPE = 60131;
      if (typeof Symbol === "function" && Symbol.for) {
        var symbolFor = Symbol.for;
        REACT_ELEMENT_TYPE = symbolFor("react.element");
        REACT_PORTAL_TYPE = symbolFor("react.portal");
        REACT_FRAGMENT_TYPE = symbolFor("react.fragment");
        REACT_STRICT_MODE_TYPE = symbolFor("react.strict_mode");
        REACT_PROFILER_TYPE = symbolFor("react.profiler");
        REACT_PROVIDER_TYPE = symbolFor("react.provider");
        REACT_CONTEXT_TYPE = symbolFor("react.context");
        REACT_FORWARD_REF_TYPE = symbolFor("react.forward_ref");
        REACT_SUSPENSE_TYPE = symbolFor("react.suspense");
        REACT_SUSPENSE_LIST_TYPE = symbolFor("react.suspense_list");
        REACT_MEMO_TYPE = symbolFor("react.memo");
        REACT_LAZY_TYPE = symbolFor("react.lazy");
        REACT_BLOCK_TYPE = symbolFor("react.block");
        REACT_SERVER_BLOCK_TYPE = symbolFor("react.server.block");
        REACT_FUNDAMENTAL_TYPE = symbolFor("react.fundamental");
        REACT_SCOPE_TYPE = symbolFor("react.scope");
        REACT_OPAQUE_ID_TYPE = symbolFor("react.opaque.id");
        REACT_DEBUG_TRACING_MODE_TYPE = symbolFor("react.debug_trace_mode");
        REACT_OFFSCREEN_TYPE = symbolFor("react.offscreen");
        REACT_LEGACY_HIDDEN_TYPE = symbolFor("react.legacy_hidden");
      }
      var PossiblyWeakMap = typeof WeakMap === "function" ? WeakMap : Map;
      var allFamiliesByID = new Map();
      var allFamiliesByType = new PossiblyWeakMap();
      var allSignaturesByType = new PossiblyWeakMap();
      var updatedFamiliesByType = new PossiblyWeakMap();
      var pendingUpdates = [];
      var helpersByRendererID = new Map();
      var helpersByRoot = new Map();
      var mountedRoots = new Set();
      var failedRoots = new Set();
      var rootElements = typeof WeakMap === "function" ? new WeakMap() : null;
      var isPerformingRefresh = false;
      function computeFullKey(signature) {
        if (signature.fullKey !== null) {
          return signature.fullKey;
        }
        var fullKey = signature.ownKey;
        var hooks;
        try {
          hooks = signature.getCustomHooks();
        } catch (err) {
          signature.forceReset = true;
          signature.fullKey = fullKey;
          return fullKey;
        }
        for (var i = 0; i < hooks.length; i++) {
          var hook = hooks[i];
          if (typeof hook !== "function") {
            signature.forceReset = true;
            signature.fullKey = fullKey;
            return fullKey;
          }
          var nestedHookSignature = allSignaturesByType.get(hook);
          if (nestedHookSignature === void 0) {
            continue;
          }
          var nestedHookKey = computeFullKey(nestedHookSignature);
          if (nestedHookSignature.forceReset) {
            signature.forceReset = true;
          }
          fullKey += "\n---\n" + nestedHookKey;
        }
        signature.fullKey = fullKey;
        return fullKey;
      }
      function haveEqualSignatures(prevType, nextType) {
        var prevSignature = allSignaturesByType.get(prevType);
        var nextSignature = allSignaturesByType.get(nextType);
        if (prevSignature === void 0 && nextSignature === void 0) {
          return true;
        }
        if (prevSignature === void 0 || nextSignature === void 0) {
          return false;
        }
        if (computeFullKey(prevSignature) !== computeFullKey(nextSignature)) {
          return false;
        }
        if (nextSignature.forceReset) {
          return false;
        }
        return true;
      }
      function isReactClass(type) {
        return type.prototype && type.prototype.isReactComponent;
      }
      function canPreserveStateBetween(prevType, nextType) {
        if (isReactClass(prevType) || isReactClass(nextType)) {
          return false;
        }
        if (haveEqualSignatures(prevType, nextType)) {
          return true;
        }
        return false;
      }
      function resolveFamily(type) {
        return updatedFamiliesByType.get(type);
      }
      function cloneMap(map) {
        var clone = new Map();
        map.forEach(function(value, key) {
          clone.set(key, value);
        });
        return clone;
      }
      function cloneSet(set) {
        var clone = new Set();
        set.forEach(function(value) {
          clone.add(value);
        });
        return clone;
      }
      function performReactRefresh() {
        if (pendingUpdates.length === 0) {
          return null;
        }
        if (isPerformingRefresh) {
          return null;
        }
        isPerformingRefresh = true;
        try {
          var staleFamilies = new Set();
          var updatedFamilies = new Set();
          var updates = pendingUpdates;
          pendingUpdates = [];
          updates.forEach(function(_ref) {
            var family = _ref[0], nextType = _ref[1];
            var prevType = family.current;
            updatedFamiliesByType.set(prevType, family);
            updatedFamiliesByType.set(nextType, family);
            family.current = nextType;
            if (canPreserveStateBetween(prevType, nextType)) {
              updatedFamilies.add(family);
            } else {
              staleFamilies.add(family);
            }
          });
          var update = {
            updatedFamilies,
            staleFamilies
          };
          helpersByRendererID.forEach(function(helpers) {
            helpers.setRefreshHandler(resolveFamily);
          });
          var didError = false;
          var firstError = null;
          var failedRootsSnapshot = cloneSet(failedRoots);
          var mountedRootsSnapshot = cloneSet(mountedRoots);
          var helpersByRootSnapshot = cloneMap(helpersByRoot);
          failedRootsSnapshot.forEach(function(root) {
            var helpers = helpersByRootSnapshot.get(root);
            if (helpers === void 0) {
              throw new Error("Could not find helpers for a root. This is a bug in React Refresh.");
            }
            if (!failedRoots.has(root)) {
            }
            if (rootElements === null) {
              return;
            }
            if (!rootElements.has(root)) {
              return;
            }
            var element = rootElements.get(root);
            try {
              helpers.scheduleRoot(root, element);
            } catch (err) {
              if (!didError) {
                didError = true;
                firstError = err;
              }
            }
          });
          mountedRootsSnapshot.forEach(function(root) {
            var helpers = helpersByRootSnapshot.get(root);
            if (helpers === void 0) {
              throw new Error("Could not find helpers for a root. This is a bug in React Refresh.");
            }
            if (!mountedRoots.has(root)) {
            }
            try {
              helpers.scheduleRefresh(root, update);
            } catch (err) {
              if (!didError) {
                didError = true;
                firstError = err;
              }
            }
          });
          if (didError) {
            throw firstError;
          }
          return update;
        } finally {
          isPerformingRefresh = false;
        }
      }
      function register(type, id) {
        {
          if (type === null) {
            return;
          }
          if (typeof type !== "function" && typeof type !== "object") {
            return;
          }
          if (allFamiliesByType.has(type)) {
            return;
          }
          var family = allFamiliesByID.get(id);
          if (family === void 0) {
            family = {
              current: type
            };
            allFamiliesByID.set(id, family);
          } else {
            pendingUpdates.push([family, type]);
          }
          allFamiliesByType.set(type, family);
          if (typeof type === "object" && type !== null) {
            switch (type.$$typeof) {
              case REACT_FORWARD_REF_TYPE:
                register(type.render, id + "$render");
                break;
              case REACT_MEMO_TYPE:
                register(type.type, id + "$type");
                break;
            }
          }
        }
      }
      function setSignature(type, key) {
        var forceReset = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : false;
        var getCustomHooks = arguments.length > 3 ? arguments[3] : void 0;
        {
          allSignaturesByType.set(type, {
            forceReset,
            ownKey: key,
            fullKey: null,
            getCustomHooks: getCustomHooks || function() {
              return [];
            }
          });
        }
      }
      function collectCustomHooksForSignature(type) {
        {
          var signature = allSignaturesByType.get(type);
          if (signature !== void 0) {
            computeFullKey(signature);
          }
        }
      }
      function getFamilyByID(id) {
        {
          return allFamiliesByID.get(id);
        }
      }
      function getFamilyByType(type) {
        {
          return allFamiliesByType.get(type);
        }
      }
      function findAffectedHostInstances(families) {
        {
          var affectedInstances = new Set();
          mountedRoots.forEach(function(root) {
            var helpers = helpersByRoot.get(root);
            if (helpers === void 0) {
              throw new Error("Could not find helpers for a root. This is a bug in React Refresh.");
            }
            var instancesForRoot = helpers.findHostInstancesForRefresh(root, families);
            instancesForRoot.forEach(function(inst) {
              affectedInstances.add(inst);
            });
          });
          return affectedInstances;
        }
      }
      function injectIntoGlobalHook(globalObject) {
        {
          var hook = globalObject.__REACT_DEVTOOLS_GLOBAL_HOOK__;
          if (hook === void 0) {
            var nextID = 0;
            globalObject.__REACT_DEVTOOLS_GLOBAL_HOOK__ = hook = {
              renderers: new Map(),
              supportsFiber: true,
              inject: function(injected) {
                return nextID++;
              },
              onScheduleFiberRoot: function(id, root, children) {
              },
              onCommitFiberRoot: function(id, root, maybePriorityLevel, didError) {
              },
              onCommitFiberUnmount: function() {
              }
            };
          }
          var oldInject = hook.inject;
          hook.inject = function(injected) {
            var id = oldInject.apply(this, arguments);
            if (typeof injected.scheduleRefresh === "function" && typeof injected.setRefreshHandler === "function") {
              helpersByRendererID.set(id, injected);
            }
            return id;
          };
          hook.renderers.forEach(function(injected, id) {
            if (typeof injected.scheduleRefresh === "function" && typeof injected.setRefreshHandler === "function") {
              helpersByRendererID.set(id, injected);
            }
          });
          var oldOnCommitFiberRoot = hook.onCommitFiberRoot;
          var oldOnScheduleFiberRoot = hook.onScheduleFiberRoot || function() {
          };
          hook.onScheduleFiberRoot = function(id, root, children) {
            if (!isPerformingRefresh) {
              failedRoots.delete(root);
              if (rootElements !== null) {
                rootElements.set(root, children);
              }
            }
            return oldOnScheduleFiberRoot.apply(this, arguments);
          };
          hook.onCommitFiberRoot = function(id, root, maybePriorityLevel, didError) {
            var helpers = helpersByRendererID.get(id);
            if (helpers === void 0) {
              return;
            }
            helpersByRoot.set(root, helpers);
            var current = root.current;
            var alternate = current.alternate;
            if (alternate !== null) {
              var wasMounted = alternate.memoizedState != null && alternate.memoizedState.element != null;
              var isMounted = current.memoizedState != null && current.memoizedState.element != null;
              if (!wasMounted && isMounted) {
                mountedRoots.add(root);
                failedRoots.delete(root);
              } else if (wasMounted && isMounted)
                ;
              else if (wasMounted && !isMounted) {
                mountedRoots.delete(root);
                if (didError) {
                  failedRoots.add(root);
                } else {
                  helpersByRoot.delete(root);
                }
              } else if (!wasMounted && !isMounted) {
                if (didError) {
                  failedRoots.add(root);
                }
              }
            } else {
              mountedRoots.add(root);
            }
            return oldOnCommitFiberRoot.apply(this, arguments);
          };
        }
      }
      function hasUnrecoverableErrors() {
        return false;
      }
      function _getMountedRootCount() {
        {
          return mountedRoots.size;
        }
      }
      function createSignatureFunctionForTransform() {
        {
          var status = "needsSignature";
          var savedType;
          var hasCustomHooks;
          return function(type, key, forceReset, getCustomHooks) {
            switch (status) {
              case "needsSignature":
                if (type !== void 0) {
                  savedType = type;
                  hasCustomHooks = typeof getCustomHooks === "function";
                  setSignature(type, key, forceReset, getCustomHooks);
                  status = "needsCustomHooks";
                }
                break;
              case "needsCustomHooks":
                if (hasCustomHooks) {
                  collectCustomHooksForSignature(savedType);
                }
                status = "resolved";
                break;
            }
            return type;
          };
        }
      }
      function isLikelyComponentType(type) {
        {
          switch (typeof type) {
            case "function": {
              if (type.prototype != null) {
                if (type.prototype.isReactComponent) {
                  return true;
                }
                var ownNames = Object.getOwnPropertyNames(type.prototype);
                if (ownNames.length > 1 || ownNames[0] !== "constructor") {
                  return false;
                }
                if (type.prototype.__proto__ !== Object.prototype) {
                  return false;
                }
              }
              var name = type.name || type.displayName;
              return typeof name === "string" && /^[A-Z]/.test(name);
            }
            case "object": {
              if (type != null) {
                switch (type.$$typeof) {
                  case REACT_FORWARD_REF_TYPE:
                  case REACT_MEMO_TYPE:
                    return true;
                  default:
                    return false;
                }
              }
              return false;
            }
            default: {
              return false;
            }
          }
        }
      }
      exports._getMountedRootCount = _getMountedRootCount;
      exports.collectCustomHooksForSignature = collectCustomHooksForSignature;
      exports.createSignatureFunctionForTransform = createSignatureFunctionForTransform;
      exports.findAffectedHostInstances = findAffectedHostInstances;
      exports.getFamilyByID = getFamilyByID;
      exports.getFamilyByType = getFamilyByType;
      exports.hasUnrecoverableErrors = hasUnrecoverableErrors;
      exports.injectIntoGlobalHook = injectIntoGlobalHook;
      exports.isLikelyComponentType = isLikelyComponentType;
      exports.performReactRefresh = performReactRefresh;
      exports.register = register;
      exports.setSignature = setSignature;
    })();
  }
});

// ../../node_modules/react-refresh/runtime.js
var require_runtime = __commonJS((exports, module) => {
  "use strict";
  if (false) {
    module.exports = null;
  } else {
    module.exports = require_react_refresh_runtime_development();
  }
});
export default require_runtime();
