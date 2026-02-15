"use strict";
(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // ../node_modules/.pnpm/jquery@3.7.1/node_modules/jquery/dist/jquery.js
  var require_jquery = __commonJS({
    "../node_modules/.pnpm/jquery@3.7.1/node_modules/jquery/dist/jquery.js"(exports, module) {
      init_shim_jquery();
      (function(global, factory) {
        "use strict";
        if (typeof module === "object" && typeof module.exports === "object") {
          module.exports = global.document ? factory(global, true) : function(w) {
            if (!w.document) {
              throw new Error("jQuery requires a window with a document");
            }
            return factory(w);
          };
        } else {
          factory(global);
        }
      })(typeof window !== "undefined" ? window : exports, function(window2, noGlobal) {
        "use strict";
        var arr = [];
        var getProto = Object.getPrototypeOf;
        var slice = arr.slice;
        var flat = arr.flat ? function(array) {
          return arr.flat.call(array);
        } : function(array) {
          return arr.concat.apply([], array);
        };
        var push = arr.push;
        var indexOf = arr.indexOf;
        var class2type = {};
        var toString = class2type.toString;
        var hasOwn = class2type.hasOwnProperty;
        var fnToString = hasOwn.toString;
        var ObjectFunctionString = fnToString.call(Object);
        var support = {};
        var isFunction = function isFunction2(obj) {
          return typeof obj === "function" && typeof obj.nodeType !== "number" && typeof obj.item !== "function";
        };
        var isWindow = function isWindow2(obj) {
          return obj != null && obj === obj.window;
        };
        var document2 = window2.document;
        var preservedScriptAttributes = {
          type: true,
          src: true,
          nonce: true,
          noModule: true
        };
        function DOMEval(code, node, doc) {
          doc = doc || document2;
          var i, val, script = doc.createElement("script");
          script.text = code;
          if (node) {
            for (i in preservedScriptAttributes) {
              val = node[i] || node.getAttribute && node.getAttribute(i);
              if (val) {
                script.setAttribute(i, val);
              }
            }
          }
          doc.head.appendChild(script).parentNode.removeChild(script);
        }
        function toType(obj) {
          if (obj == null) {
            return obj + "";
          }
          return typeof obj === "object" || typeof obj === "function" ? class2type[toString.call(obj)] || "object" : typeof obj;
        }
        var version = "3.7.1", rhtmlSuffix = /HTML$/i, jQuery2 = function(selector, context) {
          return new jQuery2.fn.init(selector, context);
        };
        jQuery2.fn = jQuery2.prototype = {
          // The current version of jQuery being used
          jquery: version,
          constructor: jQuery2,
          // The default length of a jQuery object is 0
          length: 0,
          toArray: function() {
            return slice.call(this);
          },
          // Get the Nth element in the matched element set OR
          // Get the whole matched element set as a clean array
          get: function(num) {
            if (num == null) {
              return slice.call(this);
            }
            return num < 0 ? this[num + this.length] : this[num];
          },
          // Take an array of elements and push it onto the stack
          // (returning the new matched element set)
          pushStack: function(elems) {
            var ret = jQuery2.merge(this.constructor(), elems);
            ret.prevObject = this;
            return ret;
          },
          // Execute a callback for every element in the matched set.
          each: function(callback) {
            return jQuery2.each(this, callback);
          },
          map: function(callback) {
            return this.pushStack(jQuery2.map(this, function(elem, i) {
              return callback.call(elem, i, elem);
            }));
          },
          slice: function() {
            return this.pushStack(slice.apply(this, arguments));
          },
          first: function() {
            return this.eq(0);
          },
          last: function() {
            return this.eq(-1);
          },
          even: function() {
            return this.pushStack(jQuery2.grep(this, function(_elem, i) {
              return (i + 1) % 2;
            }));
          },
          odd: function() {
            return this.pushStack(jQuery2.grep(this, function(_elem, i) {
              return i % 2;
            }));
          },
          eq: function(i) {
            var len = this.length, j = +i + (i < 0 ? len : 0);
            return this.pushStack(j >= 0 && j < len ? [this[j]] : []);
          },
          end: function() {
            return this.prevObject || this.constructor();
          },
          // For internal use only.
          // Behaves like an Array's method, not like a jQuery method.
          push,
          sort: arr.sort,
          splice: arr.splice
        };
        jQuery2.extend = jQuery2.fn.extend = function() {
          var options, name, src, copy, copyIsArray, clone, target = arguments[0] || {}, i = 1, length = arguments.length, deep = false;
          if (typeof target === "boolean") {
            deep = target;
            target = arguments[i] || {};
            i++;
          }
          if (typeof target !== "object" && !isFunction(target)) {
            target = {};
          }
          if (i === length) {
            target = this;
            i--;
          }
          for (; i < length; i++) {
            if ((options = arguments[i]) != null) {
              for (name in options) {
                copy = options[name];
                if (name === "__proto__" || target === copy) {
                  continue;
                }
                if (deep && copy && (jQuery2.isPlainObject(copy) || (copyIsArray = Array.isArray(copy)))) {
                  src = target[name];
                  if (copyIsArray && !Array.isArray(src)) {
                    clone = [];
                  } else if (!copyIsArray && !jQuery2.isPlainObject(src)) {
                    clone = {};
                  } else {
                    clone = src;
                  }
                  copyIsArray = false;
                  target[name] = jQuery2.extend(deep, clone, copy);
                } else if (copy !== void 0) {
                  target[name] = copy;
                }
              }
            }
          }
          return target;
        };
        jQuery2.extend({
          // Unique for each copy of jQuery on the page
          expando: "jQuery" + (version + Math.random()).replace(/\D/g, ""),
          // Assume jQuery is ready without the ready module
          isReady: true,
          error: function(msg) {
            throw new Error(msg);
          },
          noop: function() {
          },
          isPlainObject: function(obj) {
            var proto, Ctor;
            if (!obj || toString.call(obj) !== "[object Object]") {
              return false;
            }
            proto = getProto(obj);
            if (!proto) {
              return true;
            }
            Ctor = hasOwn.call(proto, "constructor") && proto.constructor;
            return typeof Ctor === "function" && fnToString.call(Ctor) === ObjectFunctionString;
          },
          isEmptyObject: function(obj) {
            var name;
            for (name in obj) {
              return false;
            }
            return true;
          },
          // Evaluates a script in a provided context; falls back to the global one
          // if not specified.
          globalEval: function(code, options, doc) {
            DOMEval(code, { nonce: options && options.nonce }, doc);
          },
          each: function(obj, callback) {
            var length, i = 0;
            if (isArrayLike(obj)) {
              length = obj.length;
              for (; i < length; i++) {
                if (callback.call(obj[i], i, obj[i]) === false) {
                  break;
                }
              }
            } else {
              for (i in obj) {
                if (callback.call(obj[i], i, obj[i]) === false) {
                  break;
                }
              }
            }
            return obj;
          },
          // Retrieve the text value of an array of DOM nodes
          text: function(elem) {
            var node, ret = "", i = 0, nodeType = elem.nodeType;
            if (!nodeType) {
              while (node = elem[i++]) {
                ret += jQuery2.text(node);
              }
            }
            if (nodeType === 1 || nodeType === 11) {
              return elem.textContent;
            }
            if (nodeType === 9) {
              return elem.documentElement.textContent;
            }
            if (nodeType === 3 || nodeType === 4) {
              return elem.nodeValue;
            }
            return ret;
          },
          // results is for internal usage only
          makeArray: function(arr2, results) {
            var ret = results || [];
            if (arr2 != null) {
              if (isArrayLike(Object(arr2))) {
                jQuery2.merge(
                  ret,
                  typeof arr2 === "string" ? [arr2] : arr2
                );
              } else {
                push.call(ret, arr2);
              }
            }
            return ret;
          },
          inArray: function(elem, arr2, i) {
            return arr2 == null ? -1 : indexOf.call(arr2, elem, i);
          },
          isXMLDoc: function(elem) {
            var namespace = elem && elem.namespaceURI, docElem = elem && (elem.ownerDocument || elem).documentElement;
            return !rhtmlSuffix.test(namespace || docElem && docElem.nodeName || "HTML");
          },
          // Support: Android <=4.0 only, PhantomJS 1 only
          // push.apply(_, arraylike) throws on ancient WebKit
          merge: function(first, second) {
            var len = +second.length, j = 0, i = first.length;
            for (; j < len; j++) {
              first[i++] = second[j];
            }
            first.length = i;
            return first;
          },
          grep: function(elems, callback, invert) {
            var callbackInverse, matches = [], i = 0, length = elems.length, callbackExpect = !invert;
            for (; i < length; i++) {
              callbackInverse = !callback(elems[i], i);
              if (callbackInverse !== callbackExpect) {
                matches.push(elems[i]);
              }
            }
            return matches;
          },
          // arg is for internal usage only
          map: function(elems, callback, arg) {
            var length, value, i = 0, ret = [];
            if (isArrayLike(elems)) {
              length = elems.length;
              for (; i < length; i++) {
                value = callback(elems[i], i, arg);
                if (value != null) {
                  ret.push(value);
                }
              }
            } else {
              for (i in elems) {
                value = callback(elems[i], i, arg);
                if (value != null) {
                  ret.push(value);
                }
              }
            }
            return flat(ret);
          },
          // A global GUID counter for objects
          guid: 1,
          // jQuery.support is not used in Core but other projects attach their
          // properties to it so it needs to exist.
          support
        });
        if (typeof Symbol === "function") {
          jQuery2.fn[Symbol.iterator] = arr[Symbol.iterator];
        }
        jQuery2.each(
          "Boolean Number String Function Array Date RegExp Object Error Symbol".split(" "),
          function(_i, name) {
            class2type["[object " + name + "]"] = name.toLowerCase();
          }
        );
        function isArrayLike(obj) {
          var length = !!obj && "length" in obj && obj.length, type = toType(obj);
          if (isFunction(obj) || isWindow(obj)) {
            return false;
          }
          return type === "array" || length === 0 || typeof length === "number" && length > 0 && length - 1 in obj;
        }
        function nodeName(elem, name) {
          return elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase();
        }
        var pop = arr.pop;
        var sort = arr.sort;
        var splice = arr.splice;
        var whitespace = "[\\x20\\t\\r\\n\\f]";
        var rtrimCSS = new RegExp(
          "^" + whitespace + "+|((?:^|[^\\\\])(?:\\\\.)*)" + whitespace + "+$",
          "g"
        );
        jQuery2.contains = function(a, b) {
          var bup = b && b.parentNode;
          return a === bup || !!(bup && bup.nodeType === 1 && // Support: IE 9 - 11+
          // IE doesn't have `contains` on SVG.
          (a.contains ? a.contains(bup) : a.compareDocumentPosition && a.compareDocumentPosition(bup) & 16));
        };
        var rcssescape = /([\0-\x1f\x7f]|^-?\d)|^-$|[^\x80-\uFFFF\w-]/g;
        function fcssescape(ch, asCodePoint) {
          if (asCodePoint) {
            if (ch === "\0") {
              return "\uFFFD";
            }
            return ch.slice(0, -1) + "\\" + ch.charCodeAt(ch.length - 1).toString(16) + " ";
          }
          return "\\" + ch;
        }
        jQuery2.escapeSelector = function(sel) {
          return (sel + "").replace(rcssescape, fcssescape);
        };
        var preferredDoc = document2, pushNative = push;
        (function() {
          var i, Expr, outermostContext, sortInput, hasDuplicate, push2 = pushNative, document3, documentElement2, documentIsHTML, rbuggyQSA, matches, expando = jQuery2.expando, dirruns = 0, done = 0, classCache = createCache(), tokenCache = createCache(), compilerCache = createCache(), nonnativeSelectorCache = createCache(), sortOrder = function(a, b) {
            if (a === b) {
              hasDuplicate = true;
            }
            return 0;
          }, booleans = "checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped", identifier = "(?:\\\\[\\da-fA-F]{1,6}" + whitespace + "?|\\\\[^\\r\\n\\f]|[\\w-]|[^\0-\\x7f])+", attributes = "\\[" + whitespace + "*(" + identifier + ")(?:" + whitespace + // Operator (capture 2)
          "*([*^$|!~]?=)" + whitespace + // "Attribute values must be CSS identifiers [capture 5] or strings [capture 3 or capture 4]"
          `*(?:'((?:\\\\.|[^\\\\'])*)'|"((?:\\\\.|[^\\\\"])*)"|(` + identifier + "))|)" + whitespace + "*\\]", pseudos = ":(" + identifier + `)(?:\\((('((?:\\\\.|[^\\\\'])*)'|"((?:\\\\.|[^\\\\"])*)")|((?:\\\\.|[^\\\\()[\\]]|` + attributes + ")*)|.*)\\)|)", rwhitespace = new RegExp(whitespace + "+", "g"), rcomma = new RegExp("^" + whitespace + "*," + whitespace + "*"), rleadingCombinator = new RegExp("^" + whitespace + "*([>+~]|" + whitespace + ")" + whitespace + "*"), rdescend = new RegExp(whitespace + "|>"), rpseudo = new RegExp(pseudos), ridentifier = new RegExp("^" + identifier + "$"), matchExpr = {
            ID: new RegExp("^#(" + identifier + ")"),
            CLASS: new RegExp("^\\.(" + identifier + ")"),
            TAG: new RegExp("^(" + identifier + "|[*])"),
            ATTR: new RegExp("^" + attributes),
            PSEUDO: new RegExp("^" + pseudos),
            CHILD: new RegExp(
              "^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(" + whitespace + "*(even|odd|(([+-]|)(\\d*)n|)" + whitespace + "*(?:([+-]|)" + whitespace + "*(\\d+)|))" + whitespace + "*\\)|)",
              "i"
            ),
            bool: new RegExp("^(?:" + booleans + ")$", "i"),
            // For use in libraries implementing .is()
            // We use this for POS matching in `select`
            needsContext: new RegExp("^" + whitespace + "*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" + whitespace + "*((?:-\\d)?\\d*)" + whitespace + "*\\)|)(?=[^-]|$)", "i")
          }, rinputs = /^(?:input|select|textarea|button)$/i, rheader = /^h\d$/i, rquickExpr2 = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/, rsibling = /[+~]/, runescape = new RegExp("\\\\[\\da-fA-F]{1,6}" + whitespace + "?|\\\\([^\\r\\n\\f])", "g"), funescape = function(escape, nonHex) {
            var high = "0x" + escape.slice(1) - 65536;
            if (nonHex) {
              return nonHex;
            }
            return high < 0 ? String.fromCharCode(high + 65536) : String.fromCharCode(high >> 10 | 55296, high & 1023 | 56320);
          }, unloadHandler = function() {
            setDocument();
          }, inDisabledFieldset = addCombinator(
            function(elem) {
              return elem.disabled === true && nodeName(elem, "fieldset");
            },
            { dir: "parentNode", next: "legend" }
          );
          function safeActiveElement() {
            try {
              return document3.activeElement;
            } catch (err) {
            }
          }
          try {
            push2.apply(
              arr = slice.call(preferredDoc.childNodes),
              preferredDoc.childNodes
            );
            arr[preferredDoc.childNodes.length].nodeType;
          } catch (e) {
            push2 = {
              apply: function(target, els) {
                pushNative.apply(target, slice.call(els));
              },
              call: function(target) {
                pushNative.apply(target, slice.call(arguments, 1));
              }
            };
          }
          function find(selector, context, results, seed) {
            var m, i2, elem, nid, match, groups, newSelector, newContext = context && context.ownerDocument, nodeType = context ? context.nodeType : 9;
            results = results || [];
            if (typeof selector !== "string" || !selector || nodeType !== 1 && nodeType !== 9 && nodeType !== 11) {
              return results;
            }
            if (!seed) {
              setDocument(context);
              context = context || document3;
              if (documentIsHTML) {
                if (nodeType !== 11 && (match = rquickExpr2.exec(selector))) {
                  if (m = match[1]) {
                    if (nodeType === 9) {
                      if (elem = context.getElementById(m)) {
                        if (elem.id === m) {
                          push2.call(results, elem);
                          return results;
                        }
                      } else {
                        return results;
                      }
                    } else {
                      if (newContext && (elem = newContext.getElementById(m)) && find.contains(context, elem) && elem.id === m) {
                        push2.call(results, elem);
                        return results;
                      }
                    }
                  } else if (match[2]) {
                    push2.apply(results, context.getElementsByTagName(selector));
                    return results;
                  } else if ((m = match[3]) && context.getElementsByClassName) {
                    push2.apply(results, context.getElementsByClassName(m));
                    return results;
                  }
                }
                if (!nonnativeSelectorCache[selector + " "] && (!rbuggyQSA || !rbuggyQSA.test(selector))) {
                  newSelector = selector;
                  newContext = context;
                  if (nodeType === 1 && (rdescend.test(selector) || rleadingCombinator.test(selector))) {
                    newContext = rsibling.test(selector) && testContext(context.parentNode) || context;
                    if (newContext != context || !support.scope) {
                      if (nid = context.getAttribute("id")) {
                        nid = jQuery2.escapeSelector(nid);
                      } else {
                        context.setAttribute("id", nid = expando);
                      }
                    }
                    groups = tokenize(selector);
                    i2 = groups.length;
                    while (i2--) {
                      groups[i2] = (nid ? "#" + nid : ":scope") + " " + toSelector(groups[i2]);
                    }
                    newSelector = groups.join(",");
                  }
                  try {
                    push2.apply(
                      results,
                      newContext.querySelectorAll(newSelector)
                    );
                    return results;
                  } catch (qsaError) {
                    nonnativeSelectorCache(selector, true);
                  } finally {
                    if (nid === expando) {
                      context.removeAttribute("id");
                    }
                  }
                }
              }
            }
            return select(selector.replace(rtrimCSS, "$1"), context, results, seed);
          }
          function createCache() {
            var keys = [];
            function cache(key, value) {
              if (keys.push(key + " ") > Expr.cacheLength) {
                delete cache[keys.shift()];
              }
              return cache[key + " "] = value;
            }
            return cache;
          }
          function markFunction(fn) {
            fn[expando] = true;
            return fn;
          }
          function assert(fn) {
            var el = document3.createElement("fieldset");
            try {
              return !!fn(el);
            } catch (e) {
              return false;
            } finally {
              if (el.parentNode) {
                el.parentNode.removeChild(el);
              }
              el = null;
            }
          }
          function createInputPseudo(type) {
            return function(elem) {
              return nodeName(elem, "input") && elem.type === type;
            };
          }
          function createButtonPseudo(type) {
            return function(elem) {
              return (nodeName(elem, "input") || nodeName(elem, "button")) && elem.type === type;
            };
          }
          function createDisabledPseudo(disabled) {
            return function(elem) {
              if ("form" in elem) {
                if (elem.parentNode && elem.disabled === false) {
                  if ("label" in elem) {
                    if ("label" in elem.parentNode) {
                      return elem.parentNode.disabled === disabled;
                    } else {
                      return elem.disabled === disabled;
                    }
                  }
                  return elem.isDisabled === disabled || // Where there is no isDisabled, check manually
                  elem.isDisabled !== !disabled && inDisabledFieldset(elem) === disabled;
                }
                return elem.disabled === disabled;
              } else if ("label" in elem) {
                return elem.disabled === disabled;
              }
              return false;
            };
          }
          function createPositionalPseudo(fn) {
            return markFunction(function(argument) {
              argument = +argument;
              return markFunction(function(seed, matches2) {
                var j, matchIndexes = fn([], seed.length, argument), i2 = matchIndexes.length;
                while (i2--) {
                  if (seed[j = matchIndexes[i2]]) {
                    seed[j] = !(matches2[j] = seed[j]);
                  }
                }
              });
            });
          }
          function testContext(context) {
            return context && typeof context.getElementsByTagName !== "undefined" && context;
          }
          function setDocument(node) {
            var subWindow, doc = node ? node.ownerDocument || node : preferredDoc;
            if (doc == document3 || doc.nodeType !== 9 || !doc.documentElement) {
              return document3;
            }
            document3 = doc;
            documentElement2 = document3.documentElement;
            documentIsHTML = !jQuery2.isXMLDoc(document3);
            matches = documentElement2.matches || documentElement2.webkitMatchesSelector || documentElement2.msMatchesSelector;
            if (documentElement2.msMatchesSelector && // Support: IE 11+, Edge 17 - 18+
            // IE/Edge sometimes throw a "Permission denied" error when strict-comparing
            // two documents; shallow comparisons work.
            // eslint-disable-next-line eqeqeq
            preferredDoc != document3 && (subWindow = document3.defaultView) && subWindow.top !== subWindow) {
              subWindow.addEventListener("unload", unloadHandler);
            }
            support.getById = assert(function(el) {
              documentElement2.appendChild(el).id = jQuery2.expando;
              return !document3.getElementsByName || !document3.getElementsByName(jQuery2.expando).length;
            });
            support.disconnectedMatch = assert(function(el) {
              return matches.call(el, "*");
            });
            support.scope = assert(function() {
              return document3.querySelectorAll(":scope");
            });
            support.cssHas = assert(function() {
              try {
                document3.querySelector(":has(*,:jqfake)");
                return false;
              } catch (e) {
                return true;
              }
            });
            if (support.getById) {
              Expr.filter.ID = function(id) {
                var attrId = id.replace(runescape, funescape);
                return function(elem) {
                  return elem.getAttribute("id") === attrId;
                };
              };
              Expr.find.ID = function(id, context) {
                if (typeof context.getElementById !== "undefined" && documentIsHTML) {
                  var elem = context.getElementById(id);
                  return elem ? [elem] : [];
                }
              };
            } else {
              Expr.filter.ID = function(id) {
                var attrId = id.replace(runescape, funescape);
                return function(elem) {
                  var node2 = typeof elem.getAttributeNode !== "undefined" && elem.getAttributeNode("id");
                  return node2 && node2.value === attrId;
                };
              };
              Expr.find.ID = function(id, context) {
                if (typeof context.getElementById !== "undefined" && documentIsHTML) {
                  var node2, i2, elems, elem = context.getElementById(id);
                  if (elem) {
                    node2 = elem.getAttributeNode("id");
                    if (node2 && node2.value === id) {
                      return [elem];
                    }
                    elems = context.getElementsByName(id);
                    i2 = 0;
                    while (elem = elems[i2++]) {
                      node2 = elem.getAttributeNode("id");
                      if (node2 && node2.value === id) {
                        return [elem];
                      }
                    }
                  }
                  return [];
                }
              };
            }
            Expr.find.TAG = function(tag, context) {
              if (typeof context.getElementsByTagName !== "undefined") {
                return context.getElementsByTagName(tag);
              } else {
                return context.querySelectorAll(tag);
              }
            };
            Expr.find.CLASS = function(className, context) {
              if (typeof context.getElementsByClassName !== "undefined" && documentIsHTML) {
                return context.getElementsByClassName(className);
              }
            };
            rbuggyQSA = [];
            assert(function(el) {
              var input;
              documentElement2.appendChild(el).innerHTML = "<a id='" + expando + "' href='' disabled='disabled'></a><select id='" + expando + "-\r\\' disabled='disabled'><option selected=''></option></select>";
              if (!el.querySelectorAll("[selected]").length) {
                rbuggyQSA.push("\\[" + whitespace + "*(?:value|" + booleans + ")");
              }
              if (!el.querySelectorAll("[id~=" + expando + "-]").length) {
                rbuggyQSA.push("~=");
              }
              if (!el.querySelectorAll("a#" + expando + "+*").length) {
                rbuggyQSA.push(".#.+[+~]");
              }
              if (!el.querySelectorAll(":checked").length) {
                rbuggyQSA.push(":checked");
              }
              input = document3.createElement("input");
              input.setAttribute("type", "hidden");
              el.appendChild(input).setAttribute("name", "D");
              documentElement2.appendChild(el).disabled = true;
              if (el.querySelectorAll(":disabled").length !== 2) {
                rbuggyQSA.push(":enabled", ":disabled");
              }
              input = document3.createElement("input");
              input.setAttribute("name", "");
              el.appendChild(input);
              if (!el.querySelectorAll("[name='']").length) {
                rbuggyQSA.push("\\[" + whitespace + "*name" + whitespace + "*=" + whitespace + `*(?:''|"")`);
              }
            });
            if (!support.cssHas) {
              rbuggyQSA.push(":has");
            }
            rbuggyQSA = rbuggyQSA.length && new RegExp(rbuggyQSA.join("|"));
            sortOrder = function(a, b) {
              if (a === b) {
                hasDuplicate = true;
                return 0;
              }
              var compare = !a.compareDocumentPosition - !b.compareDocumentPosition;
              if (compare) {
                return compare;
              }
              compare = (a.ownerDocument || a) == (b.ownerDocument || b) ? a.compareDocumentPosition(b) : (
                // Otherwise we know they are disconnected
                1
              );
              if (compare & 1 || !support.sortDetached && b.compareDocumentPosition(a) === compare) {
                if (a === document3 || a.ownerDocument == preferredDoc && find.contains(preferredDoc, a)) {
                  return -1;
                }
                if (b === document3 || b.ownerDocument == preferredDoc && find.contains(preferredDoc, b)) {
                  return 1;
                }
                return sortInput ? indexOf.call(sortInput, a) - indexOf.call(sortInput, b) : 0;
              }
              return compare & 4 ? -1 : 1;
            };
            return document3;
          }
          find.matches = function(expr, elements) {
            return find(expr, null, null, elements);
          };
          find.matchesSelector = function(elem, expr) {
            setDocument(elem);
            if (documentIsHTML && !nonnativeSelectorCache[expr + " "] && (!rbuggyQSA || !rbuggyQSA.test(expr))) {
              try {
                var ret = matches.call(elem, expr);
                if (ret || support.disconnectedMatch || // As well, disconnected nodes are said to be in a document
                // fragment in IE 9
                elem.document && elem.document.nodeType !== 11) {
                  return ret;
                }
              } catch (e) {
                nonnativeSelectorCache(expr, true);
              }
            }
            return find(expr, document3, null, [elem]).length > 0;
          };
          find.contains = function(context, elem) {
            if ((context.ownerDocument || context) != document3) {
              setDocument(context);
            }
            return jQuery2.contains(context, elem);
          };
          find.attr = function(elem, name) {
            if ((elem.ownerDocument || elem) != document3) {
              setDocument(elem);
            }
            var fn = Expr.attrHandle[name.toLowerCase()], val = fn && hasOwn.call(Expr.attrHandle, name.toLowerCase()) ? fn(elem, name, !documentIsHTML) : void 0;
            if (val !== void 0) {
              return val;
            }
            return elem.getAttribute(name);
          };
          find.error = function(msg) {
            throw new Error("Syntax error, unrecognized expression: " + msg);
          };
          jQuery2.uniqueSort = function(results) {
            var elem, duplicates = [], j = 0, i2 = 0;
            hasDuplicate = !support.sortStable;
            sortInput = !support.sortStable && slice.call(results, 0);
            sort.call(results, sortOrder);
            if (hasDuplicate) {
              while (elem = results[i2++]) {
                if (elem === results[i2]) {
                  j = duplicates.push(i2);
                }
              }
              while (j--) {
                splice.call(results, duplicates[j], 1);
              }
            }
            sortInput = null;
            return results;
          };
          jQuery2.fn.uniqueSort = function() {
            return this.pushStack(jQuery2.uniqueSort(slice.apply(this)));
          };
          Expr = jQuery2.expr = {
            // Can be adjusted by the user
            cacheLength: 50,
            createPseudo: markFunction,
            match: matchExpr,
            attrHandle: {},
            find: {},
            relative: {
              ">": { dir: "parentNode", first: true },
              " ": { dir: "parentNode" },
              "+": { dir: "previousSibling", first: true },
              "~": { dir: "previousSibling" }
            },
            preFilter: {
              ATTR: function(match) {
                match[1] = match[1].replace(runescape, funescape);
                match[3] = (match[3] || match[4] || match[5] || "").replace(runescape, funescape);
                if (match[2] === "~=") {
                  match[3] = " " + match[3] + " ";
                }
                return match.slice(0, 4);
              },
              CHILD: function(match) {
                match[1] = match[1].toLowerCase();
                if (match[1].slice(0, 3) === "nth") {
                  if (!match[3]) {
                    find.error(match[0]);
                  }
                  match[4] = +(match[4] ? match[5] + (match[6] || 1) : 2 * (match[3] === "even" || match[3] === "odd"));
                  match[5] = +(match[7] + match[8] || match[3] === "odd");
                } else if (match[3]) {
                  find.error(match[0]);
                }
                return match;
              },
              PSEUDO: function(match) {
                var excess, unquoted = !match[6] && match[2];
                if (matchExpr.CHILD.test(match[0])) {
                  return null;
                }
                if (match[3]) {
                  match[2] = match[4] || match[5] || "";
                } else if (unquoted && rpseudo.test(unquoted) && // Get excess from tokenize (recursively)
                (excess = tokenize(unquoted, true)) && // advance to the next closing parenthesis
                (excess = unquoted.indexOf(")", unquoted.length - excess) - unquoted.length)) {
                  match[0] = match[0].slice(0, excess);
                  match[2] = unquoted.slice(0, excess);
                }
                return match.slice(0, 3);
              }
            },
            filter: {
              TAG: function(nodeNameSelector) {
                var expectedNodeName = nodeNameSelector.replace(runescape, funescape).toLowerCase();
                return nodeNameSelector === "*" ? function() {
                  return true;
                } : function(elem) {
                  return nodeName(elem, expectedNodeName);
                };
              },
              CLASS: function(className) {
                var pattern = classCache[className + " "];
                return pattern || (pattern = new RegExp("(^|" + whitespace + ")" + className + "(" + whitespace + "|$)")) && classCache(className, function(elem) {
                  return pattern.test(
                    typeof elem.className === "string" && elem.className || typeof elem.getAttribute !== "undefined" && elem.getAttribute("class") || ""
                  );
                });
              },
              ATTR: function(name, operator, check) {
                return function(elem) {
                  var result = find.attr(elem, name);
                  if (result == null) {
                    return operator === "!=";
                  }
                  if (!operator) {
                    return true;
                  }
                  result += "";
                  if (operator === "=") {
                    return result === check;
                  }
                  if (operator === "!=") {
                    return result !== check;
                  }
                  if (operator === "^=") {
                    return check && result.indexOf(check) === 0;
                  }
                  if (operator === "*=") {
                    return check && result.indexOf(check) > -1;
                  }
                  if (operator === "$=") {
                    return check && result.slice(-check.length) === check;
                  }
                  if (operator === "~=") {
                    return (" " + result.replace(rwhitespace, " ") + " ").indexOf(check) > -1;
                  }
                  if (operator === "|=") {
                    return result === check || result.slice(0, check.length + 1) === check + "-";
                  }
                  return false;
                };
              },
              CHILD: function(type, what, _argument, first, last) {
                var simple = type.slice(0, 3) !== "nth", forward = type.slice(-4) !== "last", ofType = what === "of-type";
                return first === 1 && last === 0 ? (
                  // Shortcut for :nth-*(n)
                  function(elem) {
                    return !!elem.parentNode;
                  }
                ) : function(elem, _context, xml) {
                  var cache, outerCache, node, nodeIndex, start, dir2 = simple !== forward ? "nextSibling" : "previousSibling", parent = elem.parentNode, name = ofType && elem.nodeName.toLowerCase(), useCache = !xml && !ofType, diff = false;
                  if (parent) {
                    if (simple) {
                      while (dir2) {
                        node = elem;
                        while (node = node[dir2]) {
                          if (ofType ? nodeName(node, name) : node.nodeType === 1) {
                            return false;
                          }
                        }
                        start = dir2 = type === "only" && !start && "nextSibling";
                      }
                      return true;
                    }
                    start = [forward ? parent.firstChild : parent.lastChild];
                    if (forward && useCache) {
                      outerCache = parent[expando] || (parent[expando] = {});
                      cache = outerCache[type] || [];
                      nodeIndex = cache[0] === dirruns && cache[1];
                      diff = nodeIndex && cache[2];
                      node = nodeIndex && parent.childNodes[nodeIndex];
                      while (node = ++nodeIndex && node && node[dir2] || // Fallback to seeking `elem` from the start
                      (diff = nodeIndex = 0) || start.pop()) {
                        if (node.nodeType === 1 && ++diff && node === elem) {
                          outerCache[type] = [dirruns, nodeIndex, diff];
                          break;
                        }
                      }
                    } else {
                      if (useCache) {
                        outerCache = elem[expando] || (elem[expando] = {});
                        cache = outerCache[type] || [];
                        nodeIndex = cache[0] === dirruns && cache[1];
                        diff = nodeIndex;
                      }
                      if (diff === false) {
                        while (node = ++nodeIndex && node && node[dir2] || (diff = nodeIndex = 0) || start.pop()) {
                          if ((ofType ? nodeName(node, name) : node.nodeType === 1) && ++diff) {
                            if (useCache) {
                              outerCache = node[expando] || (node[expando] = {});
                              outerCache[type] = [dirruns, diff];
                            }
                            if (node === elem) {
                              break;
                            }
                          }
                        }
                      }
                    }
                    diff -= last;
                    return diff === first || diff % first === 0 && diff / first >= 0;
                  }
                };
              },
              PSEUDO: function(pseudo, argument) {
                var args, fn = Expr.pseudos[pseudo] || Expr.setFilters[pseudo.toLowerCase()] || find.error("unsupported pseudo: " + pseudo);
                if (fn[expando]) {
                  return fn(argument);
                }
                if (fn.length > 1) {
                  args = [pseudo, pseudo, "", argument];
                  return Expr.setFilters.hasOwnProperty(pseudo.toLowerCase()) ? markFunction(function(seed, matches2) {
                    var idx, matched = fn(seed, argument), i2 = matched.length;
                    while (i2--) {
                      idx = indexOf.call(seed, matched[i2]);
                      seed[idx] = !(matches2[idx] = matched[i2]);
                    }
                  }) : function(elem) {
                    return fn(elem, 0, args);
                  };
                }
                return fn;
              }
            },
            pseudos: {
              // Potentially complex pseudos
              not: markFunction(function(selector) {
                var input = [], results = [], matcher = compile(selector.replace(rtrimCSS, "$1"));
                return matcher[expando] ? markFunction(function(seed, matches2, _context, xml) {
                  var elem, unmatched = matcher(seed, null, xml, []), i2 = seed.length;
                  while (i2--) {
                    if (elem = unmatched[i2]) {
                      seed[i2] = !(matches2[i2] = elem);
                    }
                  }
                }) : function(elem, _context, xml) {
                  input[0] = elem;
                  matcher(input, null, xml, results);
                  input[0] = null;
                  return !results.pop();
                };
              }),
              has: markFunction(function(selector) {
                return function(elem) {
                  return find(selector, elem).length > 0;
                };
              }),
              contains: markFunction(function(text) {
                text = text.replace(runescape, funescape);
                return function(elem) {
                  return (elem.textContent || jQuery2.text(elem)).indexOf(text) > -1;
                };
              }),
              // "Whether an element is represented by a :lang() selector
              // is based solely on the element's language value
              // being equal to the identifier C,
              // or beginning with the identifier C immediately followed by "-".
              // The matching of C against the element's language value is performed case-insensitively.
              // The identifier C does not have to be a valid language name."
              // https://www.w3.org/TR/selectors/#lang-pseudo
              lang: markFunction(function(lang) {
                if (!ridentifier.test(lang || "")) {
                  find.error("unsupported lang: " + lang);
                }
                lang = lang.replace(runescape, funescape).toLowerCase();
                return function(elem) {
                  var elemLang;
                  do {
                    if (elemLang = documentIsHTML ? elem.lang : elem.getAttribute("xml:lang") || elem.getAttribute("lang")) {
                      elemLang = elemLang.toLowerCase();
                      return elemLang === lang || elemLang.indexOf(lang + "-") === 0;
                    }
                  } while ((elem = elem.parentNode) && elem.nodeType === 1);
                  return false;
                };
              }),
              // Miscellaneous
              target: function(elem) {
                var hash = window2.location && window2.location.hash;
                return hash && hash.slice(1) === elem.id;
              },
              root: function(elem) {
                return elem === documentElement2;
              },
              focus: function(elem) {
                return elem === safeActiveElement() && document3.hasFocus() && !!(elem.type || elem.href || ~elem.tabIndex);
              },
              // Boolean properties
              enabled: createDisabledPseudo(false),
              disabled: createDisabledPseudo(true),
              checked: function(elem) {
                return nodeName(elem, "input") && !!elem.checked || nodeName(elem, "option") && !!elem.selected;
              },
              selected: function(elem) {
                if (elem.parentNode) {
                  elem.parentNode.selectedIndex;
                }
                return elem.selected === true;
              },
              // Contents
              empty: function(elem) {
                for (elem = elem.firstChild; elem; elem = elem.nextSibling) {
                  if (elem.nodeType < 6) {
                    return false;
                  }
                }
                return true;
              },
              parent: function(elem) {
                return !Expr.pseudos.empty(elem);
              },
              // Element/input types
              header: function(elem) {
                return rheader.test(elem.nodeName);
              },
              input: function(elem) {
                return rinputs.test(elem.nodeName);
              },
              button: function(elem) {
                return nodeName(elem, "input") && elem.type === "button" || nodeName(elem, "button");
              },
              text: function(elem) {
                var attr;
                return nodeName(elem, "input") && elem.type === "text" && // Support: IE <10 only
                // New HTML5 attribute values (e.g., "search") appear
                // with elem.type === "text"
                ((attr = elem.getAttribute("type")) == null || attr.toLowerCase() === "text");
              },
              // Position-in-collection
              first: createPositionalPseudo(function() {
                return [0];
              }),
              last: createPositionalPseudo(function(_matchIndexes, length) {
                return [length - 1];
              }),
              eq: createPositionalPseudo(function(_matchIndexes, length, argument) {
                return [argument < 0 ? argument + length : argument];
              }),
              even: createPositionalPseudo(function(matchIndexes, length) {
                var i2 = 0;
                for (; i2 < length; i2 += 2) {
                  matchIndexes.push(i2);
                }
                return matchIndexes;
              }),
              odd: createPositionalPseudo(function(matchIndexes, length) {
                var i2 = 1;
                for (; i2 < length; i2 += 2) {
                  matchIndexes.push(i2);
                }
                return matchIndexes;
              }),
              lt: createPositionalPseudo(function(matchIndexes, length, argument) {
                var i2;
                if (argument < 0) {
                  i2 = argument + length;
                } else if (argument > length) {
                  i2 = length;
                } else {
                  i2 = argument;
                }
                for (; --i2 >= 0; ) {
                  matchIndexes.push(i2);
                }
                return matchIndexes;
              }),
              gt: createPositionalPseudo(function(matchIndexes, length, argument) {
                var i2 = argument < 0 ? argument + length : argument;
                for (; ++i2 < length; ) {
                  matchIndexes.push(i2);
                }
                return matchIndexes;
              })
            }
          };
          Expr.pseudos.nth = Expr.pseudos.eq;
          for (i in { radio: true, checkbox: true, file: true, password: true, image: true }) {
            Expr.pseudos[i] = createInputPseudo(i);
          }
          for (i in { submit: true, reset: true }) {
            Expr.pseudos[i] = createButtonPseudo(i);
          }
          function setFilters() {
          }
          setFilters.prototype = Expr.filters = Expr.pseudos;
          Expr.setFilters = new setFilters();
          function tokenize(selector, parseOnly) {
            var matched, match, tokens, type, soFar, groups, preFilters, cached = tokenCache[selector + " "];
            if (cached) {
              return parseOnly ? 0 : cached.slice(0);
            }
            soFar = selector;
            groups = [];
            preFilters = Expr.preFilter;
            while (soFar) {
              if (!matched || (match = rcomma.exec(soFar))) {
                if (match) {
                  soFar = soFar.slice(match[0].length) || soFar;
                }
                groups.push(tokens = []);
              }
              matched = false;
              if (match = rleadingCombinator.exec(soFar)) {
                matched = match.shift();
                tokens.push({
                  value: matched,
                  // Cast descendant combinators to space
                  type: match[0].replace(rtrimCSS, " ")
                });
                soFar = soFar.slice(matched.length);
              }
              for (type in Expr.filter) {
                if ((match = matchExpr[type].exec(soFar)) && (!preFilters[type] || (match = preFilters[type](match)))) {
                  matched = match.shift();
                  tokens.push({
                    value: matched,
                    type,
                    matches: match
                  });
                  soFar = soFar.slice(matched.length);
                }
              }
              if (!matched) {
                break;
              }
            }
            if (parseOnly) {
              return soFar.length;
            }
            return soFar ? find.error(selector) : (
              // Cache the tokens
              tokenCache(selector, groups).slice(0)
            );
          }
          function toSelector(tokens) {
            var i2 = 0, len = tokens.length, selector = "";
            for (; i2 < len; i2++) {
              selector += tokens[i2].value;
            }
            return selector;
          }
          function addCombinator(matcher, combinator, base) {
            var dir2 = combinator.dir, skip = combinator.next, key = skip || dir2, checkNonElements = base && key === "parentNode", doneName = done++;
            return combinator.first ? (
              // Check against closest ancestor/preceding element
              function(elem, context, xml) {
                while (elem = elem[dir2]) {
                  if (elem.nodeType === 1 || checkNonElements) {
                    return matcher(elem, context, xml);
                  }
                }
                return false;
              }
            ) : (
              // Check against all ancestor/preceding elements
              function(elem, context, xml) {
                var oldCache, outerCache, newCache = [dirruns, doneName];
                if (xml) {
                  while (elem = elem[dir2]) {
                    if (elem.nodeType === 1 || checkNonElements) {
                      if (matcher(elem, context, xml)) {
                        return true;
                      }
                    }
                  }
                } else {
                  while (elem = elem[dir2]) {
                    if (elem.nodeType === 1 || checkNonElements) {
                      outerCache = elem[expando] || (elem[expando] = {});
                      if (skip && nodeName(elem, skip)) {
                        elem = elem[dir2] || elem;
                      } else if ((oldCache = outerCache[key]) && oldCache[0] === dirruns && oldCache[1] === doneName) {
                        return newCache[2] = oldCache[2];
                      } else {
                        outerCache[key] = newCache;
                        if (newCache[2] = matcher(elem, context, xml)) {
                          return true;
                        }
                      }
                    }
                  }
                }
                return false;
              }
            );
          }
          function elementMatcher(matchers) {
            return matchers.length > 1 ? function(elem, context, xml) {
              var i2 = matchers.length;
              while (i2--) {
                if (!matchers[i2](elem, context, xml)) {
                  return false;
                }
              }
              return true;
            } : matchers[0];
          }
          function multipleContexts(selector, contexts, results) {
            var i2 = 0, len = contexts.length;
            for (; i2 < len; i2++) {
              find(selector, contexts[i2], results);
            }
            return results;
          }
          function condense(unmatched, map, filter, context, xml) {
            var elem, newUnmatched = [], i2 = 0, len = unmatched.length, mapped = map != null;
            for (; i2 < len; i2++) {
              if (elem = unmatched[i2]) {
                if (!filter || filter(elem, context, xml)) {
                  newUnmatched.push(elem);
                  if (mapped) {
                    map.push(i2);
                  }
                }
              }
            }
            return newUnmatched;
          }
          function setMatcher(preFilter, selector, matcher, postFilter, postFinder, postSelector) {
            if (postFilter && !postFilter[expando]) {
              postFilter = setMatcher(postFilter);
            }
            if (postFinder && !postFinder[expando]) {
              postFinder = setMatcher(postFinder, postSelector);
            }
            return markFunction(function(seed, results, context, xml) {
              var temp, i2, elem, matcherOut, preMap = [], postMap = [], preexisting = results.length, elems = seed || multipleContexts(
                selector || "*",
                context.nodeType ? [context] : context,
                []
              ), matcherIn = preFilter && (seed || !selector) ? condense(elems, preMap, preFilter, context, xml) : elems;
              if (matcher) {
                matcherOut = postFinder || (seed ? preFilter : preexisting || postFilter) ? (
                  // ...intermediate processing is necessary
                  []
                ) : (
                  // ...otherwise use results directly
                  results
                );
                matcher(matcherIn, matcherOut, context, xml);
              } else {
                matcherOut = matcherIn;
              }
              if (postFilter) {
                temp = condense(matcherOut, postMap);
                postFilter(temp, [], context, xml);
                i2 = temp.length;
                while (i2--) {
                  if (elem = temp[i2]) {
                    matcherOut[postMap[i2]] = !(matcherIn[postMap[i2]] = elem);
                  }
                }
              }
              if (seed) {
                if (postFinder || preFilter) {
                  if (postFinder) {
                    temp = [];
                    i2 = matcherOut.length;
                    while (i2--) {
                      if (elem = matcherOut[i2]) {
                        temp.push(matcherIn[i2] = elem);
                      }
                    }
                    postFinder(null, matcherOut = [], temp, xml);
                  }
                  i2 = matcherOut.length;
                  while (i2--) {
                    if ((elem = matcherOut[i2]) && (temp = postFinder ? indexOf.call(seed, elem) : preMap[i2]) > -1) {
                      seed[temp] = !(results[temp] = elem);
                    }
                  }
                }
              } else {
                matcherOut = condense(
                  matcherOut === results ? matcherOut.splice(preexisting, matcherOut.length) : matcherOut
                );
                if (postFinder) {
                  postFinder(null, results, matcherOut, xml);
                } else {
                  push2.apply(results, matcherOut);
                }
              }
            });
          }
          function matcherFromTokens(tokens) {
            var checkContext, matcher, j, len = tokens.length, leadingRelative = Expr.relative[tokens[0].type], implicitRelative = leadingRelative || Expr.relative[" "], i2 = leadingRelative ? 1 : 0, matchContext = addCombinator(function(elem) {
              return elem === checkContext;
            }, implicitRelative, true), matchAnyContext = addCombinator(function(elem) {
              return indexOf.call(checkContext, elem) > -1;
            }, implicitRelative, true), matchers = [function(elem, context, xml) {
              var ret = !leadingRelative && (xml || context != outermostContext) || ((checkContext = context).nodeType ? matchContext(elem, context, xml) : matchAnyContext(elem, context, xml));
              checkContext = null;
              return ret;
            }];
            for (; i2 < len; i2++) {
              if (matcher = Expr.relative[tokens[i2].type]) {
                matchers = [addCombinator(elementMatcher(matchers), matcher)];
              } else {
                matcher = Expr.filter[tokens[i2].type].apply(null, tokens[i2].matches);
                if (matcher[expando]) {
                  j = ++i2;
                  for (; j < len; j++) {
                    if (Expr.relative[tokens[j].type]) {
                      break;
                    }
                  }
                  return setMatcher(
                    i2 > 1 && elementMatcher(matchers),
                    i2 > 1 && toSelector(
                      // If the preceding token was a descendant combinator, insert an implicit any-element `*`
                      tokens.slice(0, i2 - 1).concat({ value: tokens[i2 - 2].type === " " ? "*" : "" })
                    ).replace(rtrimCSS, "$1"),
                    matcher,
                    i2 < j && matcherFromTokens(tokens.slice(i2, j)),
                    j < len && matcherFromTokens(tokens = tokens.slice(j)),
                    j < len && toSelector(tokens)
                  );
                }
                matchers.push(matcher);
              }
            }
            return elementMatcher(matchers);
          }
          function matcherFromGroupMatchers(elementMatchers, setMatchers) {
            var bySet = setMatchers.length > 0, byElement = elementMatchers.length > 0, superMatcher = function(seed, context, xml, results, outermost) {
              var elem, j, matcher, matchedCount = 0, i2 = "0", unmatched = seed && [], setMatched = [], contextBackup = outermostContext, elems = seed || byElement && Expr.find.TAG("*", outermost), dirrunsUnique = dirruns += contextBackup == null ? 1 : Math.random() || 0.1, len = elems.length;
              if (outermost) {
                outermostContext = context == document3 || context || outermost;
              }
              for (; i2 !== len && (elem = elems[i2]) != null; i2++) {
                if (byElement && elem) {
                  j = 0;
                  if (!context && elem.ownerDocument != document3) {
                    setDocument(elem);
                    xml = !documentIsHTML;
                  }
                  while (matcher = elementMatchers[j++]) {
                    if (matcher(elem, context || document3, xml)) {
                      push2.call(results, elem);
                      break;
                    }
                  }
                  if (outermost) {
                    dirruns = dirrunsUnique;
                  }
                }
                if (bySet) {
                  if (elem = !matcher && elem) {
                    matchedCount--;
                  }
                  if (seed) {
                    unmatched.push(elem);
                  }
                }
              }
              matchedCount += i2;
              if (bySet && i2 !== matchedCount) {
                j = 0;
                while (matcher = setMatchers[j++]) {
                  matcher(unmatched, setMatched, context, xml);
                }
                if (seed) {
                  if (matchedCount > 0) {
                    while (i2--) {
                      if (!(unmatched[i2] || setMatched[i2])) {
                        setMatched[i2] = pop.call(results);
                      }
                    }
                  }
                  setMatched = condense(setMatched);
                }
                push2.apply(results, setMatched);
                if (outermost && !seed && setMatched.length > 0 && matchedCount + setMatchers.length > 1) {
                  jQuery2.uniqueSort(results);
                }
              }
              if (outermost) {
                dirruns = dirrunsUnique;
                outermostContext = contextBackup;
              }
              return unmatched;
            };
            return bySet ? markFunction(superMatcher) : superMatcher;
          }
          function compile(selector, match) {
            var i2, setMatchers = [], elementMatchers = [], cached = compilerCache[selector + " "];
            if (!cached) {
              if (!match) {
                match = tokenize(selector);
              }
              i2 = match.length;
              while (i2--) {
                cached = matcherFromTokens(match[i2]);
                if (cached[expando]) {
                  setMatchers.push(cached);
                } else {
                  elementMatchers.push(cached);
                }
              }
              cached = compilerCache(
                selector,
                matcherFromGroupMatchers(elementMatchers, setMatchers)
              );
              cached.selector = selector;
            }
            return cached;
          }
          function select(selector, context, results, seed) {
            var i2, tokens, token, type, find2, compiled = typeof selector === "function" && selector, match = !seed && tokenize(selector = compiled.selector || selector);
            results = results || [];
            if (match.length === 1) {
              tokens = match[0] = match[0].slice(0);
              if (tokens.length > 2 && (token = tokens[0]).type === "ID" && context.nodeType === 9 && documentIsHTML && Expr.relative[tokens[1].type]) {
                context = (Expr.find.ID(
                  token.matches[0].replace(runescape, funescape),
                  context
                ) || [])[0];
                if (!context) {
                  return results;
                } else if (compiled) {
                  context = context.parentNode;
                }
                selector = selector.slice(tokens.shift().value.length);
              }
              i2 = matchExpr.needsContext.test(selector) ? 0 : tokens.length;
              while (i2--) {
                token = tokens[i2];
                if (Expr.relative[type = token.type]) {
                  break;
                }
                if (find2 = Expr.find[type]) {
                  if (seed = find2(
                    token.matches[0].replace(runescape, funescape),
                    rsibling.test(tokens[0].type) && testContext(context.parentNode) || context
                  )) {
                    tokens.splice(i2, 1);
                    selector = seed.length && toSelector(tokens);
                    if (!selector) {
                      push2.apply(results, seed);
                      return results;
                    }
                    break;
                  }
                }
              }
            }
            (compiled || compile(selector, match))(
              seed,
              context,
              !documentIsHTML,
              results,
              !context || rsibling.test(selector) && testContext(context.parentNode) || context
            );
            return results;
          }
          support.sortStable = expando.split("").sort(sortOrder).join("") === expando;
          setDocument();
          support.sortDetached = assert(function(el) {
            return el.compareDocumentPosition(document3.createElement("fieldset")) & 1;
          });
          jQuery2.find = find;
          jQuery2.expr[":"] = jQuery2.expr.pseudos;
          jQuery2.unique = jQuery2.uniqueSort;
          find.compile = compile;
          find.select = select;
          find.setDocument = setDocument;
          find.tokenize = tokenize;
          find.escape = jQuery2.escapeSelector;
          find.getText = jQuery2.text;
          find.isXML = jQuery2.isXMLDoc;
          find.selectors = jQuery2.expr;
          find.support = jQuery2.support;
          find.uniqueSort = jQuery2.uniqueSort;
        })();
        var dir = function(elem, dir2, until) {
          var matched = [], truncate = until !== void 0;
          while ((elem = elem[dir2]) && elem.nodeType !== 9) {
            if (elem.nodeType === 1) {
              if (truncate && jQuery2(elem).is(until)) {
                break;
              }
              matched.push(elem);
            }
          }
          return matched;
        };
        var siblings = function(n, elem) {
          var matched = [];
          for (; n; n = n.nextSibling) {
            if (n.nodeType === 1 && n !== elem) {
              matched.push(n);
            }
          }
          return matched;
        };
        var rneedsContext = jQuery2.expr.match.needsContext;
        var rsingleTag = /^<([a-z][^\/\0>:\x20\t\r\n\f]*)[\x20\t\r\n\f]*\/?>(?:<\/\1>|)$/i;
        function winnow(elements, qualifier, not) {
          if (isFunction(qualifier)) {
            return jQuery2.grep(elements, function(elem, i) {
              return !!qualifier.call(elem, i, elem) !== not;
            });
          }
          if (qualifier.nodeType) {
            return jQuery2.grep(elements, function(elem) {
              return elem === qualifier !== not;
            });
          }
          if (typeof qualifier !== "string") {
            return jQuery2.grep(elements, function(elem) {
              return indexOf.call(qualifier, elem) > -1 !== not;
            });
          }
          return jQuery2.filter(qualifier, elements, not);
        }
        jQuery2.filter = function(expr, elems, not) {
          var elem = elems[0];
          if (not) {
            expr = ":not(" + expr + ")";
          }
          if (elems.length === 1 && elem.nodeType === 1) {
            return jQuery2.find.matchesSelector(elem, expr) ? [elem] : [];
          }
          return jQuery2.find.matches(expr, jQuery2.grep(elems, function(elem2) {
            return elem2.nodeType === 1;
          }));
        };
        jQuery2.fn.extend({
          find: function(selector) {
            var i, ret, len = this.length, self = this;
            if (typeof selector !== "string") {
              return this.pushStack(jQuery2(selector).filter(function() {
                for (i = 0; i < len; i++) {
                  if (jQuery2.contains(self[i], this)) {
                    return true;
                  }
                }
              }));
            }
            ret = this.pushStack([]);
            for (i = 0; i < len; i++) {
              jQuery2.find(selector, self[i], ret);
            }
            return len > 1 ? jQuery2.uniqueSort(ret) : ret;
          },
          filter: function(selector) {
            return this.pushStack(winnow(this, selector || [], false));
          },
          not: function(selector) {
            return this.pushStack(winnow(this, selector || [], true));
          },
          is: function(selector) {
            return !!winnow(
              this,
              // If this is a positional/relative selector, check membership in the returned set
              // so $("p:first").is("p:last") won't return true for a doc with two "p".
              typeof selector === "string" && rneedsContext.test(selector) ? jQuery2(selector) : selector || [],
              false
            ).length;
          }
        });
        var rootjQuery, rquickExpr = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]+))$/, init = jQuery2.fn.init = function(selector, context, root) {
          var match, elem;
          if (!selector) {
            return this;
          }
          root = root || rootjQuery;
          if (typeof selector === "string") {
            if (selector[0] === "<" && selector[selector.length - 1] === ">" && selector.length >= 3) {
              match = [null, selector, null];
            } else {
              match = rquickExpr.exec(selector);
            }
            if (match && (match[1] || !context)) {
              if (match[1]) {
                context = context instanceof jQuery2 ? context[0] : context;
                jQuery2.merge(this, jQuery2.parseHTML(
                  match[1],
                  context && context.nodeType ? context.ownerDocument || context : document2,
                  true
                ));
                if (rsingleTag.test(match[1]) && jQuery2.isPlainObject(context)) {
                  for (match in context) {
                    if (isFunction(this[match])) {
                      this[match](context[match]);
                    } else {
                      this.attr(match, context[match]);
                    }
                  }
                }
                return this;
              } else {
                elem = document2.getElementById(match[2]);
                if (elem) {
                  this[0] = elem;
                  this.length = 1;
                }
                return this;
              }
            } else if (!context || context.jquery) {
              return (context || root).find(selector);
            } else {
              return this.constructor(context).find(selector);
            }
          } else if (selector.nodeType) {
            this[0] = selector;
            this.length = 1;
            return this;
          } else if (isFunction(selector)) {
            return root.ready !== void 0 ? root.ready(selector) : (
              // Execute immediately if ready is not present
              selector(jQuery2)
            );
          }
          return jQuery2.makeArray(selector, this);
        };
        init.prototype = jQuery2.fn;
        rootjQuery = jQuery2(document2);
        var rparentsprev = /^(?:parents|prev(?:Until|All))/, guaranteedUnique = {
          children: true,
          contents: true,
          next: true,
          prev: true
        };
        jQuery2.fn.extend({
          has: function(target) {
            var targets = jQuery2(target, this), l = targets.length;
            return this.filter(function() {
              var i = 0;
              for (; i < l; i++) {
                if (jQuery2.contains(this, targets[i])) {
                  return true;
                }
              }
            });
          },
          closest: function(selectors, context) {
            var cur, i = 0, l = this.length, matched = [], targets = typeof selectors !== "string" && jQuery2(selectors);
            if (!rneedsContext.test(selectors)) {
              for (; i < l; i++) {
                for (cur = this[i]; cur && cur !== context; cur = cur.parentNode) {
                  if (cur.nodeType < 11 && (targets ? targets.index(cur) > -1 : (
                    // Don't pass non-elements to jQuery#find
                    cur.nodeType === 1 && jQuery2.find.matchesSelector(cur, selectors)
                  ))) {
                    matched.push(cur);
                    break;
                  }
                }
              }
            }
            return this.pushStack(matched.length > 1 ? jQuery2.uniqueSort(matched) : matched);
          },
          // Determine the position of an element within the set
          index: function(elem) {
            if (!elem) {
              return this[0] && this[0].parentNode ? this.first().prevAll().length : -1;
            }
            if (typeof elem === "string") {
              return indexOf.call(jQuery2(elem), this[0]);
            }
            return indexOf.call(
              this,
              // If it receives a jQuery object, the first element is used
              elem.jquery ? elem[0] : elem
            );
          },
          add: function(selector, context) {
            return this.pushStack(
              jQuery2.uniqueSort(
                jQuery2.merge(this.get(), jQuery2(selector, context))
              )
            );
          },
          addBack: function(selector) {
            return this.add(
              selector == null ? this.prevObject : this.prevObject.filter(selector)
            );
          }
        });
        function sibling(cur, dir2) {
          while ((cur = cur[dir2]) && cur.nodeType !== 1) {
          }
          return cur;
        }
        jQuery2.each({
          parent: function(elem) {
            var parent = elem.parentNode;
            return parent && parent.nodeType !== 11 ? parent : null;
          },
          parents: function(elem) {
            return dir(elem, "parentNode");
          },
          parentsUntil: function(elem, _i, until) {
            return dir(elem, "parentNode", until);
          },
          next: function(elem) {
            return sibling(elem, "nextSibling");
          },
          prev: function(elem) {
            return sibling(elem, "previousSibling");
          },
          nextAll: function(elem) {
            return dir(elem, "nextSibling");
          },
          prevAll: function(elem) {
            return dir(elem, "previousSibling");
          },
          nextUntil: function(elem, _i, until) {
            return dir(elem, "nextSibling", until);
          },
          prevUntil: function(elem, _i, until) {
            return dir(elem, "previousSibling", until);
          },
          siblings: function(elem) {
            return siblings((elem.parentNode || {}).firstChild, elem);
          },
          children: function(elem) {
            return siblings(elem.firstChild);
          },
          contents: function(elem) {
            if (elem.contentDocument != null && // Support: IE 11+
            // <object> elements with no `data` attribute has an object
            // `contentDocument` with a `null` prototype.
            getProto(elem.contentDocument)) {
              return elem.contentDocument;
            }
            if (nodeName(elem, "template")) {
              elem = elem.content || elem;
            }
            return jQuery2.merge([], elem.childNodes);
          }
        }, function(name, fn) {
          jQuery2.fn[name] = function(until, selector) {
            var matched = jQuery2.map(this, fn, until);
            if (name.slice(-5) !== "Until") {
              selector = until;
            }
            if (selector && typeof selector === "string") {
              matched = jQuery2.filter(selector, matched);
            }
            if (this.length > 1) {
              if (!guaranteedUnique[name]) {
                jQuery2.uniqueSort(matched);
              }
              if (rparentsprev.test(name)) {
                matched.reverse();
              }
            }
            return this.pushStack(matched);
          };
        });
        var rnothtmlwhite = /[^\x20\t\r\n\f]+/g;
        function createOptions(options) {
          var object = {};
          jQuery2.each(options.match(rnothtmlwhite) || [], function(_, flag) {
            object[flag] = true;
          });
          return object;
        }
        jQuery2.Callbacks = function(options) {
          options = typeof options === "string" ? createOptions(options) : jQuery2.extend({}, options);
          var firing, memory, fired, locked, list = [], queue = [], firingIndex = -1, fire = function() {
            locked = locked || options.once;
            fired = firing = true;
            for (; queue.length; firingIndex = -1) {
              memory = queue.shift();
              while (++firingIndex < list.length) {
                if (list[firingIndex].apply(memory[0], memory[1]) === false && options.stopOnFalse) {
                  firingIndex = list.length;
                  memory = false;
                }
              }
            }
            if (!options.memory) {
              memory = false;
            }
            firing = false;
            if (locked) {
              if (memory) {
                list = [];
              } else {
                list = "";
              }
            }
          }, self = {
            // Add a callback or a collection of callbacks to the list
            add: function() {
              if (list) {
                if (memory && !firing) {
                  firingIndex = list.length - 1;
                  queue.push(memory);
                }
                (function add(args) {
                  jQuery2.each(args, function(_, arg) {
                    if (isFunction(arg)) {
                      if (!options.unique || !self.has(arg)) {
                        list.push(arg);
                      }
                    } else if (arg && arg.length && toType(arg) !== "string") {
                      add(arg);
                    }
                  });
                })(arguments);
                if (memory && !firing) {
                  fire();
                }
              }
              return this;
            },
            // Remove a callback from the list
            remove: function() {
              jQuery2.each(arguments, function(_, arg) {
                var index;
                while ((index = jQuery2.inArray(arg, list, index)) > -1) {
                  list.splice(index, 1);
                  if (index <= firingIndex) {
                    firingIndex--;
                  }
                }
              });
              return this;
            },
            // Check if a given callback is in the list.
            // If no argument is given, return whether or not list has callbacks attached.
            has: function(fn) {
              return fn ? jQuery2.inArray(fn, list) > -1 : list.length > 0;
            },
            // Remove all callbacks from the list
            empty: function() {
              if (list) {
                list = [];
              }
              return this;
            },
            // Disable .fire and .add
            // Abort any current/pending executions
            // Clear all callbacks and values
            disable: function() {
              locked = queue = [];
              list = memory = "";
              return this;
            },
            disabled: function() {
              return !list;
            },
            // Disable .fire
            // Also disable .add unless we have memory (since it would have no effect)
            // Abort any pending executions
            lock: function() {
              locked = queue = [];
              if (!memory && !firing) {
                list = memory = "";
              }
              return this;
            },
            locked: function() {
              return !!locked;
            },
            // Call all callbacks with the given context and arguments
            fireWith: function(context, args) {
              if (!locked) {
                args = args || [];
                args = [context, args.slice ? args.slice() : args];
                queue.push(args);
                if (!firing) {
                  fire();
                }
              }
              return this;
            },
            // Call all the callbacks with the given arguments
            fire: function() {
              self.fireWith(this, arguments);
              return this;
            },
            // To know if the callbacks have already been called at least once
            fired: function() {
              return !!fired;
            }
          };
          return self;
        };
        function Identity(v) {
          return v;
        }
        function Thrower(ex) {
          throw ex;
        }
        function adoptValue(value, resolve, reject, noValue) {
          var method;
          try {
            if (value && isFunction(method = value.promise)) {
              method.call(value).done(resolve).fail(reject);
            } else if (value && isFunction(method = value.then)) {
              method.call(value, resolve, reject);
            } else {
              resolve.apply(void 0, [value].slice(noValue));
            }
          } catch (value2) {
            reject.apply(void 0, [value2]);
          }
        }
        jQuery2.extend({
          Deferred: function(func) {
            var tuples = [
              // action, add listener, callbacks,
              // ... .then handlers, argument index, [final state]
              [
                "notify",
                "progress",
                jQuery2.Callbacks("memory"),
                jQuery2.Callbacks("memory"),
                2
              ],
              [
                "resolve",
                "done",
                jQuery2.Callbacks("once memory"),
                jQuery2.Callbacks("once memory"),
                0,
                "resolved"
              ],
              [
                "reject",
                "fail",
                jQuery2.Callbacks("once memory"),
                jQuery2.Callbacks("once memory"),
                1,
                "rejected"
              ]
            ], state = "pending", promise = {
              state: function() {
                return state;
              },
              always: function() {
                deferred.done(arguments).fail(arguments);
                return this;
              },
              "catch": function(fn) {
                return promise.then(null, fn);
              },
              // Keep pipe for back-compat
              pipe: function() {
                var fns = arguments;
                return jQuery2.Deferred(function(newDefer) {
                  jQuery2.each(tuples, function(_i, tuple) {
                    var fn = isFunction(fns[tuple[4]]) && fns[tuple[4]];
                    deferred[tuple[1]](function() {
                      var returned = fn && fn.apply(this, arguments);
                      if (returned && isFunction(returned.promise)) {
                        returned.promise().progress(newDefer.notify).done(newDefer.resolve).fail(newDefer.reject);
                      } else {
                        newDefer[tuple[0] + "With"](
                          this,
                          fn ? [returned] : arguments
                        );
                      }
                    });
                  });
                  fns = null;
                }).promise();
              },
              then: function(onFulfilled, onRejected, onProgress) {
                var maxDepth = 0;
                function resolve(depth, deferred2, handler, special) {
                  return function() {
                    var that = this, args = arguments, mightThrow = function() {
                      var returned, then;
                      if (depth < maxDepth) {
                        return;
                      }
                      returned = handler.apply(that, args);
                      if (returned === deferred2.promise()) {
                        throw new TypeError("Thenable self-resolution");
                      }
                      then = returned && // Support: Promises/A+ section 2.3.4
                      // https://promisesaplus.com/#point-64
                      // Only check objects and functions for thenability
                      (typeof returned === "object" || typeof returned === "function") && returned.then;
                      if (isFunction(then)) {
                        if (special) {
                          then.call(
                            returned,
                            resolve(maxDepth, deferred2, Identity, special),
                            resolve(maxDepth, deferred2, Thrower, special)
                          );
                        } else {
                          maxDepth++;
                          then.call(
                            returned,
                            resolve(maxDepth, deferred2, Identity, special),
                            resolve(maxDepth, deferred2, Thrower, special),
                            resolve(
                              maxDepth,
                              deferred2,
                              Identity,
                              deferred2.notifyWith
                            )
                          );
                        }
                      } else {
                        if (handler !== Identity) {
                          that = void 0;
                          args = [returned];
                        }
                        (special || deferred2.resolveWith)(that, args);
                      }
                    }, process = special ? mightThrow : function() {
                      try {
                        mightThrow();
                      } catch (e) {
                        if (jQuery2.Deferred.exceptionHook) {
                          jQuery2.Deferred.exceptionHook(
                            e,
                            process.error
                          );
                        }
                        if (depth + 1 >= maxDepth) {
                          if (handler !== Thrower) {
                            that = void 0;
                            args = [e];
                          }
                          deferred2.rejectWith(that, args);
                        }
                      }
                    };
                    if (depth) {
                      process();
                    } else {
                      if (jQuery2.Deferred.getErrorHook) {
                        process.error = jQuery2.Deferred.getErrorHook();
                      } else if (jQuery2.Deferred.getStackHook) {
                        process.error = jQuery2.Deferred.getStackHook();
                      }
                      window2.setTimeout(process);
                    }
                  };
                }
                return jQuery2.Deferred(function(newDefer) {
                  tuples[0][3].add(
                    resolve(
                      0,
                      newDefer,
                      isFunction(onProgress) ? onProgress : Identity,
                      newDefer.notifyWith
                    )
                  );
                  tuples[1][3].add(
                    resolve(
                      0,
                      newDefer,
                      isFunction(onFulfilled) ? onFulfilled : Identity
                    )
                  );
                  tuples[2][3].add(
                    resolve(
                      0,
                      newDefer,
                      isFunction(onRejected) ? onRejected : Thrower
                    )
                  );
                }).promise();
              },
              // Get a promise for this deferred
              // If obj is provided, the promise aspect is added to the object
              promise: function(obj) {
                return obj != null ? jQuery2.extend(obj, promise) : promise;
              }
            }, deferred = {};
            jQuery2.each(tuples, function(i, tuple) {
              var list = tuple[2], stateString = tuple[5];
              promise[tuple[1]] = list.add;
              if (stateString) {
                list.add(
                  function() {
                    state = stateString;
                  },
                  // rejected_callbacks.disable
                  // fulfilled_callbacks.disable
                  tuples[3 - i][2].disable,
                  // rejected_handlers.disable
                  // fulfilled_handlers.disable
                  tuples[3 - i][3].disable,
                  // progress_callbacks.lock
                  tuples[0][2].lock,
                  // progress_handlers.lock
                  tuples[0][3].lock
                );
              }
              list.add(tuple[3].fire);
              deferred[tuple[0]] = function() {
                deferred[tuple[0] + "With"](this === deferred ? void 0 : this, arguments);
                return this;
              };
              deferred[tuple[0] + "With"] = list.fireWith;
            });
            promise.promise(deferred);
            if (func) {
              func.call(deferred, deferred);
            }
            return deferred;
          },
          // Deferred helper
          when: function(singleValue) {
            var remaining = arguments.length, i = remaining, resolveContexts = Array(i), resolveValues = slice.call(arguments), primary = jQuery2.Deferred(), updateFunc = function(i2) {
              return function(value) {
                resolveContexts[i2] = this;
                resolveValues[i2] = arguments.length > 1 ? slice.call(arguments) : value;
                if (!--remaining) {
                  primary.resolveWith(resolveContexts, resolveValues);
                }
              };
            };
            if (remaining <= 1) {
              adoptValue(
                singleValue,
                primary.done(updateFunc(i)).resolve,
                primary.reject,
                !remaining
              );
              if (primary.state() === "pending" || isFunction(resolveValues[i] && resolveValues[i].then)) {
                return primary.then();
              }
            }
            while (i--) {
              adoptValue(resolveValues[i], updateFunc(i), primary.reject);
            }
            return primary.promise();
          }
        });
        var rerrorNames = /^(Eval|Internal|Range|Reference|Syntax|Type|URI)Error$/;
        jQuery2.Deferred.exceptionHook = function(error, asyncError) {
          if (window2.console && window2.console.warn && error && rerrorNames.test(error.name)) {
            window2.console.warn(
              "jQuery.Deferred exception: " + error.message,
              error.stack,
              asyncError
            );
          }
        };
        jQuery2.readyException = function(error) {
          window2.setTimeout(function() {
            throw error;
          });
        };
        var readyList = jQuery2.Deferred();
        jQuery2.fn.ready = function(fn) {
          readyList.then(fn).catch(function(error) {
            jQuery2.readyException(error);
          });
          return this;
        };
        jQuery2.extend({
          // Is the DOM ready to be used? Set to true once it occurs.
          isReady: false,
          // A counter to track how many items to wait for before
          // the ready event fires. See trac-6781
          readyWait: 1,
          // Handle when the DOM is ready
          ready: function(wait) {
            if (wait === true ? --jQuery2.readyWait : jQuery2.isReady) {
              return;
            }
            jQuery2.isReady = true;
            if (wait !== true && --jQuery2.readyWait > 0) {
              return;
            }
            readyList.resolveWith(document2, [jQuery2]);
          }
        });
        jQuery2.ready.then = readyList.then;
        function completed() {
          document2.removeEventListener("DOMContentLoaded", completed);
          window2.removeEventListener("load", completed);
          jQuery2.ready();
        }
        if (document2.readyState === "complete" || document2.readyState !== "loading" && !document2.documentElement.doScroll) {
          window2.setTimeout(jQuery2.ready);
        } else {
          document2.addEventListener("DOMContentLoaded", completed);
          window2.addEventListener("load", completed);
        }
        var access = function(elems, fn, key, value, chainable, emptyGet, raw) {
          var i = 0, len = elems.length, bulk = key == null;
          if (toType(key) === "object") {
            chainable = true;
            for (i in key) {
              access(elems, fn, i, key[i], true, emptyGet, raw);
            }
          } else if (value !== void 0) {
            chainable = true;
            if (!isFunction(value)) {
              raw = true;
            }
            if (bulk) {
              if (raw) {
                fn.call(elems, value);
                fn = null;
              } else {
                bulk = fn;
                fn = function(elem, _key, value2) {
                  return bulk.call(jQuery2(elem), value2);
                };
              }
            }
            if (fn) {
              for (; i < len; i++) {
                fn(
                  elems[i],
                  key,
                  raw ? value : value.call(elems[i], i, fn(elems[i], key))
                );
              }
            }
          }
          if (chainable) {
            return elems;
          }
          if (bulk) {
            return fn.call(elems);
          }
          return len ? fn(elems[0], key) : emptyGet;
        };
        var rmsPrefix = /^-ms-/, rdashAlpha = /-([a-z])/g;
        function fcamelCase(_all, letter) {
          return letter.toUpperCase();
        }
        function camelCase(string) {
          return string.replace(rmsPrefix, "ms-").replace(rdashAlpha, fcamelCase);
        }
        var acceptData = function(owner) {
          return owner.nodeType === 1 || owner.nodeType === 9 || !+owner.nodeType;
        };
        function Data() {
          this.expando = jQuery2.expando + Data.uid++;
        }
        Data.uid = 1;
        Data.prototype = {
          cache: function(owner) {
            var value = owner[this.expando];
            if (!value) {
              value = {};
              if (acceptData(owner)) {
                if (owner.nodeType) {
                  owner[this.expando] = value;
                } else {
                  Object.defineProperty(owner, this.expando, {
                    value,
                    configurable: true
                  });
                }
              }
            }
            return value;
          },
          set: function(owner, data, value) {
            var prop, cache = this.cache(owner);
            if (typeof data === "string") {
              cache[camelCase(data)] = value;
            } else {
              for (prop in data) {
                cache[camelCase(prop)] = data[prop];
              }
            }
            return cache;
          },
          get: function(owner, key) {
            return key === void 0 ? this.cache(owner) : (
              // Always use camelCase key (gh-2257)
              owner[this.expando] && owner[this.expando][camelCase(key)]
            );
          },
          access: function(owner, key, value) {
            if (key === void 0 || key && typeof key === "string" && value === void 0) {
              return this.get(owner, key);
            }
            this.set(owner, key, value);
            return value !== void 0 ? value : key;
          },
          remove: function(owner, key) {
            var i, cache = owner[this.expando];
            if (cache === void 0) {
              return;
            }
            if (key !== void 0) {
              if (Array.isArray(key)) {
                key = key.map(camelCase);
              } else {
                key = camelCase(key);
                key = key in cache ? [key] : key.match(rnothtmlwhite) || [];
              }
              i = key.length;
              while (i--) {
                delete cache[key[i]];
              }
            }
            if (key === void 0 || jQuery2.isEmptyObject(cache)) {
              if (owner.nodeType) {
                owner[this.expando] = void 0;
              } else {
                delete owner[this.expando];
              }
            }
          },
          hasData: function(owner) {
            var cache = owner[this.expando];
            return cache !== void 0 && !jQuery2.isEmptyObject(cache);
          }
        };
        var dataPriv = new Data();
        var dataUser = new Data();
        var rbrace = /^(?:\{[\w\W]*\}|\[[\w\W]*\])$/, rmultiDash = /[A-Z]/g;
        function getData(data) {
          if (data === "true") {
            return true;
          }
          if (data === "false") {
            return false;
          }
          if (data === "null") {
            return null;
          }
          if (data === +data + "") {
            return +data;
          }
          if (rbrace.test(data)) {
            return JSON.parse(data);
          }
          return data;
        }
        function dataAttr(elem, key, data) {
          var name;
          if (data === void 0 && elem.nodeType === 1) {
            name = "data-" + key.replace(rmultiDash, "-$&").toLowerCase();
            data = elem.getAttribute(name);
            if (typeof data === "string") {
              try {
                data = getData(data);
              } catch (e) {
              }
              dataUser.set(elem, key, data);
            } else {
              data = void 0;
            }
          }
          return data;
        }
        jQuery2.extend({
          hasData: function(elem) {
            return dataUser.hasData(elem) || dataPriv.hasData(elem);
          },
          data: function(elem, name, data) {
            return dataUser.access(elem, name, data);
          },
          removeData: function(elem, name) {
            dataUser.remove(elem, name);
          },
          // TODO: Now that all calls to _data and _removeData have been replaced
          // with direct calls to dataPriv methods, these can be deprecated.
          _data: function(elem, name, data) {
            return dataPriv.access(elem, name, data);
          },
          _removeData: function(elem, name) {
            dataPriv.remove(elem, name);
          }
        });
        jQuery2.fn.extend({
          data: function(key, value) {
            var i, name, data, elem = this[0], attrs = elem && elem.attributes;
            if (key === void 0) {
              if (this.length) {
                data = dataUser.get(elem);
                if (elem.nodeType === 1 && !dataPriv.get(elem, "hasDataAttrs")) {
                  i = attrs.length;
                  while (i--) {
                    if (attrs[i]) {
                      name = attrs[i].name;
                      if (name.indexOf("data-") === 0) {
                        name = camelCase(name.slice(5));
                        dataAttr(elem, name, data[name]);
                      }
                    }
                  }
                  dataPriv.set(elem, "hasDataAttrs", true);
                }
              }
              return data;
            }
            if (typeof key === "object") {
              return this.each(function() {
                dataUser.set(this, key);
              });
            }
            return access(this, function(value2) {
              var data2;
              if (elem && value2 === void 0) {
                data2 = dataUser.get(elem, key);
                if (data2 !== void 0) {
                  return data2;
                }
                data2 = dataAttr(elem, key);
                if (data2 !== void 0) {
                  return data2;
                }
                return;
              }
              this.each(function() {
                dataUser.set(this, key, value2);
              });
            }, null, value, arguments.length > 1, null, true);
          },
          removeData: function(key) {
            return this.each(function() {
              dataUser.remove(this, key);
            });
          }
        });
        jQuery2.extend({
          queue: function(elem, type, data) {
            var queue;
            if (elem) {
              type = (type || "fx") + "queue";
              queue = dataPriv.get(elem, type);
              if (data) {
                if (!queue || Array.isArray(data)) {
                  queue = dataPriv.access(elem, type, jQuery2.makeArray(data));
                } else {
                  queue.push(data);
                }
              }
              return queue || [];
            }
          },
          dequeue: function(elem, type) {
            type = type || "fx";
            var queue = jQuery2.queue(elem, type), startLength = queue.length, fn = queue.shift(), hooks = jQuery2._queueHooks(elem, type), next = function() {
              jQuery2.dequeue(elem, type);
            };
            if (fn === "inprogress") {
              fn = queue.shift();
              startLength--;
            }
            if (fn) {
              if (type === "fx") {
                queue.unshift("inprogress");
              }
              delete hooks.stop;
              fn.call(elem, next, hooks);
            }
            if (!startLength && hooks) {
              hooks.empty.fire();
            }
          },
          // Not public - generate a queueHooks object, or return the current one
          _queueHooks: function(elem, type) {
            var key = type + "queueHooks";
            return dataPriv.get(elem, key) || dataPriv.access(elem, key, {
              empty: jQuery2.Callbacks("once memory").add(function() {
                dataPriv.remove(elem, [type + "queue", key]);
              })
            });
          }
        });
        jQuery2.fn.extend({
          queue: function(type, data) {
            var setter = 2;
            if (typeof type !== "string") {
              data = type;
              type = "fx";
              setter--;
            }
            if (arguments.length < setter) {
              return jQuery2.queue(this[0], type);
            }
            return data === void 0 ? this : this.each(function() {
              var queue = jQuery2.queue(this, type, data);
              jQuery2._queueHooks(this, type);
              if (type === "fx" && queue[0] !== "inprogress") {
                jQuery2.dequeue(this, type);
              }
            });
          },
          dequeue: function(type) {
            return this.each(function() {
              jQuery2.dequeue(this, type);
            });
          },
          clearQueue: function(type) {
            return this.queue(type || "fx", []);
          },
          // Get a promise resolved when queues of a certain type
          // are emptied (fx is the type by default)
          promise: function(type, obj) {
            var tmp, count = 1, defer = jQuery2.Deferred(), elements = this, i = this.length, resolve = function() {
              if (!--count) {
                defer.resolveWith(elements, [elements]);
              }
            };
            if (typeof type !== "string") {
              obj = type;
              type = void 0;
            }
            type = type || "fx";
            while (i--) {
              tmp = dataPriv.get(elements[i], type + "queueHooks");
              if (tmp && tmp.empty) {
                count++;
                tmp.empty.add(resolve);
              }
            }
            resolve();
            return defer.promise(obj);
          }
        });
        var pnum = /[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source;
        var rcssNum = new RegExp("^(?:([+-])=|)(" + pnum + ")([a-z%]*)$", "i");
        var cssExpand = ["Top", "Right", "Bottom", "Left"];
        var documentElement = document2.documentElement;
        var isAttached = function(elem) {
          return jQuery2.contains(elem.ownerDocument, elem);
        }, composed = { composed: true };
        if (documentElement.getRootNode) {
          isAttached = function(elem) {
            return jQuery2.contains(elem.ownerDocument, elem) || elem.getRootNode(composed) === elem.ownerDocument;
          };
        }
        var isHiddenWithinTree = function(elem, el) {
          elem = el || elem;
          return elem.style.display === "none" || elem.style.display === "" && // Otherwise, check computed style
          // Support: Firefox <=43 - 45
          // Disconnected elements can have computed display: none, so first confirm that elem is
          // in the document.
          isAttached(elem) && jQuery2.css(elem, "display") === "none";
        };
        function adjustCSS(elem, prop, valueParts, tween) {
          var adjusted, scale, maxIterations = 20, currentValue = tween ? function() {
            return tween.cur();
          } : function() {
            return jQuery2.css(elem, prop, "");
          }, initial = currentValue(), unit = valueParts && valueParts[3] || (jQuery2.cssNumber[prop] ? "" : "px"), initialInUnit = elem.nodeType && (jQuery2.cssNumber[prop] || unit !== "px" && +initial) && rcssNum.exec(jQuery2.css(elem, prop));
          if (initialInUnit && initialInUnit[3] !== unit) {
            initial = initial / 2;
            unit = unit || initialInUnit[3];
            initialInUnit = +initial || 1;
            while (maxIterations--) {
              jQuery2.style(elem, prop, initialInUnit + unit);
              if ((1 - scale) * (1 - (scale = currentValue() / initial || 0.5)) <= 0) {
                maxIterations = 0;
              }
              initialInUnit = initialInUnit / scale;
            }
            initialInUnit = initialInUnit * 2;
            jQuery2.style(elem, prop, initialInUnit + unit);
            valueParts = valueParts || [];
          }
          if (valueParts) {
            initialInUnit = +initialInUnit || +initial || 0;
            adjusted = valueParts[1] ? initialInUnit + (valueParts[1] + 1) * valueParts[2] : +valueParts[2];
            if (tween) {
              tween.unit = unit;
              tween.start = initialInUnit;
              tween.end = adjusted;
            }
          }
          return adjusted;
        }
        var defaultDisplayMap = {};
        function getDefaultDisplay(elem) {
          var temp, doc = elem.ownerDocument, nodeName2 = elem.nodeName, display = defaultDisplayMap[nodeName2];
          if (display) {
            return display;
          }
          temp = doc.body.appendChild(doc.createElement(nodeName2));
          display = jQuery2.css(temp, "display");
          temp.parentNode.removeChild(temp);
          if (display === "none") {
            display = "block";
          }
          defaultDisplayMap[nodeName2] = display;
          return display;
        }
        function showHide(elements, show) {
          var display, elem, values = [], index = 0, length = elements.length;
          for (; index < length; index++) {
            elem = elements[index];
            if (!elem.style) {
              continue;
            }
            display = elem.style.display;
            if (show) {
              if (display === "none") {
                values[index] = dataPriv.get(elem, "display") || null;
                if (!values[index]) {
                  elem.style.display = "";
                }
              }
              if (elem.style.display === "" && isHiddenWithinTree(elem)) {
                values[index] = getDefaultDisplay(elem);
              }
            } else {
              if (display !== "none") {
                values[index] = "none";
                dataPriv.set(elem, "display", display);
              }
            }
          }
          for (index = 0; index < length; index++) {
            if (values[index] != null) {
              elements[index].style.display = values[index];
            }
          }
          return elements;
        }
        jQuery2.fn.extend({
          show: function() {
            return showHide(this, true);
          },
          hide: function() {
            return showHide(this);
          },
          toggle: function(state) {
            if (typeof state === "boolean") {
              return state ? this.show() : this.hide();
            }
            return this.each(function() {
              if (isHiddenWithinTree(this)) {
                jQuery2(this).show();
              } else {
                jQuery2(this).hide();
              }
            });
          }
        });
        var rcheckableType = /^(?:checkbox|radio)$/i;
        var rtagName = /<([a-z][^\/\0>\x20\t\r\n\f]*)/i;
        var rscriptType = /^$|^module$|\/(?:java|ecma)script/i;
        (function() {
          var fragment = document2.createDocumentFragment(), div = fragment.appendChild(document2.createElement("div")), input = document2.createElement("input");
          input.setAttribute("type", "radio");
          input.setAttribute("checked", "checked");
          input.setAttribute("name", "t");
          div.appendChild(input);
          support.checkClone = div.cloneNode(true).cloneNode(true).lastChild.checked;
          div.innerHTML = "<textarea>x</textarea>";
          support.noCloneChecked = !!div.cloneNode(true).lastChild.defaultValue;
          div.innerHTML = "<option></option>";
          support.option = !!div.lastChild;
        })();
        var wrapMap = {
          // XHTML parsers do not magically insert elements in the
          // same way that tag soup parsers do. So we cannot shorten
          // this by omitting <tbody> or other required elements.
          thead: [1, "<table>", "</table>"],
          col: [2, "<table><colgroup>", "</colgroup></table>"],
          tr: [2, "<table><tbody>", "</tbody></table>"],
          td: [3, "<table><tbody><tr>", "</tr></tbody></table>"],
          _default: [0, "", ""]
        };
        wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead;
        wrapMap.th = wrapMap.td;
        if (!support.option) {
          wrapMap.optgroup = wrapMap.option = [1, "<select multiple='multiple'>", "</select>"];
        }
        function getAll(context, tag) {
          var ret;
          if (typeof context.getElementsByTagName !== "undefined") {
            ret = context.getElementsByTagName(tag || "*");
          } else if (typeof context.querySelectorAll !== "undefined") {
            ret = context.querySelectorAll(tag || "*");
          } else {
            ret = [];
          }
          if (tag === void 0 || tag && nodeName(context, tag)) {
            return jQuery2.merge([context], ret);
          }
          return ret;
        }
        function setGlobalEval(elems, refElements) {
          var i = 0, l = elems.length;
          for (; i < l; i++) {
            dataPriv.set(
              elems[i],
              "globalEval",
              !refElements || dataPriv.get(refElements[i], "globalEval")
            );
          }
        }
        var rhtml = /<|&#?\w+;/;
        function buildFragment(elems, context, scripts, selection, ignored) {
          var elem, tmp, tag, wrap, attached, j, fragment = context.createDocumentFragment(), nodes = [], i = 0, l = elems.length;
          for (; i < l; i++) {
            elem = elems[i];
            if (elem || elem === 0) {
              if (toType(elem) === "object") {
                jQuery2.merge(nodes, elem.nodeType ? [elem] : elem);
              } else if (!rhtml.test(elem)) {
                nodes.push(context.createTextNode(elem));
              } else {
                tmp = tmp || fragment.appendChild(context.createElement("div"));
                tag = (rtagName.exec(elem) || ["", ""])[1].toLowerCase();
                wrap = wrapMap[tag] || wrapMap._default;
                tmp.innerHTML = wrap[1] + jQuery2.htmlPrefilter(elem) + wrap[2];
                j = wrap[0];
                while (j--) {
                  tmp = tmp.lastChild;
                }
                jQuery2.merge(nodes, tmp.childNodes);
                tmp = fragment.firstChild;
                tmp.textContent = "";
              }
            }
          }
          fragment.textContent = "";
          i = 0;
          while (elem = nodes[i++]) {
            if (selection && jQuery2.inArray(elem, selection) > -1) {
              if (ignored) {
                ignored.push(elem);
              }
              continue;
            }
            attached = isAttached(elem);
            tmp = getAll(fragment.appendChild(elem), "script");
            if (attached) {
              setGlobalEval(tmp);
            }
            if (scripts) {
              j = 0;
              while (elem = tmp[j++]) {
                if (rscriptType.test(elem.type || "")) {
                  scripts.push(elem);
                }
              }
            }
          }
          return fragment;
        }
        var rtypenamespace = /^([^.]*)(?:\.(.+)|)/;
        function returnTrue() {
          return true;
        }
        function returnFalse() {
          return false;
        }
        function on(elem, types, selector, data, fn, one) {
          var origFn, type;
          if (typeof types === "object") {
            if (typeof selector !== "string") {
              data = data || selector;
              selector = void 0;
            }
            for (type in types) {
              on(elem, type, selector, data, types[type], one);
            }
            return elem;
          }
          if (data == null && fn == null) {
            fn = selector;
            data = selector = void 0;
          } else if (fn == null) {
            if (typeof selector === "string") {
              fn = data;
              data = void 0;
            } else {
              fn = data;
              data = selector;
              selector = void 0;
            }
          }
          if (fn === false) {
            fn = returnFalse;
          } else if (!fn) {
            return elem;
          }
          if (one === 1) {
            origFn = fn;
            fn = function(event) {
              jQuery2().off(event);
              return origFn.apply(this, arguments);
            };
            fn.guid = origFn.guid || (origFn.guid = jQuery2.guid++);
          }
          return elem.each(function() {
            jQuery2.event.add(this, types, fn, data, selector);
          });
        }
        jQuery2.event = {
          global: {},
          add: function(elem, types, handler, data, selector) {
            var handleObjIn, eventHandle, tmp, events, t, handleObj, special, handlers, type, namespaces, origType, elemData = dataPriv.get(elem);
            if (!acceptData(elem)) {
              return;
            }
            if (handler.handler) {
              handleObjIn = handler;
              handler = handleObjIn.handler;
              selector = handleObjIn.selector;
            }
            if (selector) {
              jQuery2.find.matchesSelector(documentElement, selector);
            }
            if (!handler.guid) {
              handler.guid = jQuery2.guid++;
            }
            if (!(events = elemData.events)) {
              events = elemData.events = /* @__PURE__ */ Object.create(null);
            }
            if (!(eventHandle = elemData.handle)) {
              eventHandle = elemData.handle = function(e) {
                return typeof jQuery2 !== "undefined" && jQuery2.event.triggered !== e.type ? jQuery2.event.dispatch.apply(elem, arguments) : void 0;
              };
            }
            types = (types || "").match(rnothtmlwhite) || [""];
            t = types.length;
            while (t--) {
              tmp = rtypenamespace.exec(types[t]) || [];
              type = origType = tmp[1];
              namespaces = (tmp[2] || "").split(".").sort();
              if (!type) {
                continue;
              }
              special = jQuery2.event.special[type] || {};
              type = (selector ? special.delegateType : special.bindType) || type;
              special = jQuery2.event.special[type] || {};
              handleObj = jQuery2.extend({
                type,
                origType,
                data,
                handler,
                guid: handler.guid,
                selector,
                needsContext: selector && jQuery2.expr.match.needsContext.test(selector),
                namespace: namespaces.join(".")
              }, handleObjIn);
              if (!(handlers = events[type])) {
                handlers = events[type] = [];
                handlers.delegateCount = 0;
                if (!special.setup || special.setup.call(elem, data, namespaces, eventHandle) === false) {
                  if (elem.addEventListener) {
                    elem.addEventListener(type, eventHandle);
                  }
                }
              }
              if (special.add) {
                special.add.call(elem, handleObj);
                if (!handleObj.handler.guid) {
                  handleObj.handler.guid = handler.guid;
                }
              }
              if (selector) {
                handlers.splice(handlers.delegateCount++, 0, handleObj);
              } else {
                handlers.push(handleObj);
              }
              jQuery2.event.global[type] = true;
            }
          },
          // Detach an event or set of events from an element
          remove: function(elem, types, handler, selector, mappedTypes) {
            var j, origCount, tmp, events, t, handleObj, special, handlers, type, namespaces, origType, elemData = dataPriv.hasData(elem) && dataPriv.get(elem);
            if (!elemData || !(events = elemData.events)) {
              return;
            }
            types = (types || "").match(rnothtmlwhite) || [""];
            t = types.length;
            while (t--) {
              tmp = rtypenamespace.exec(types[t]) || [];
              type = origType = tmp[1];
              namespaces = (tmp[2] || "").split(".").sort();
              if (!type) {
                for (type in events) {
                  jQuery2.event.remove(elem, type + types[t], handler, selector, true);
                }
                continue;
              }
              special = jQuery2.event.special[type] || {};
              type = (selector ? special.delegateType : special.bindType) || type;
              handlers = events[type] || [];
              tmp = tmp[2] && new RegExp("(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)");
              origCount = j = handlers.length;
              while (j--) {
                handleObj = handlers[j];
                if ((mappedTypes || origType === handleObj.origType) && (!handler || handler.guid === handleObj.guid) && (!tmp || tmp.test(handleObj.namespace)) && (!selector || selector === handleObj.selector || selector === "**" && handleObj.selector)) {
                  handlers.splice(j, 1);
                  if (handleObj.selector) {
                    handlers.delegateCount--;
                  }
                  if (special.remove) {
                    special.remove.call(elem, handleObj);
                  }
                }
              }
              if (origCount && !handlers.length) {
                if (!special.teardown || special.teardown.call(elem, namespaces, elemData.handle) === false) {
                  jQuery2.removeEvent(elem, type, elemData.handle);
                }
                delete events[type];
              }
            }
            if (jQuery2.isEmptyObject(events)) {
              dataPriv.remove(elem, "handle events");
            }
          },
          dispatch: function(nativeEvent) {
            var i, j, ret, matched, handleObj, handlerQueue, args = new Array(arguments.length), event = jQuery2.event.fix(nativeEvent), handlers = (dataPriv.get(this, "events") || /* @__PURE__ */ Object.create(null))[event.type] || [], special = jQuery2.event.special[event.type] || {};
            args[0] = event;
            for (i = 1; i < arguments.length; i++) {
              args[i] = arguments[i];
            }
            event.delegateTarget = this;
            if (special.preDispatch && special.preDispatch.call(this, event) === false) {
              return;
            }
            handlerQueue = jQuery2.event.handlers.call(this, event, handlers);
            i = 0;
            while ((matched = handlerQueue[i++]) && !event.isPropagationStopped()) {
              event.currentTarget = matched.elem;
              j = 0;
              while ((handleObj = matched.handlers[j++]) && !event.isImmediatePropagationStopped()) {
                if (!event.rnamespace || handleObj.namespace === false || event.rnamespace.test(handleObj.namespace)) {
                  event.handleObj = handleObj;
                  event.data = handleObj.data;
                  ret = ((jQuery2.event.special[handleObj.origType] || {}).handle || handleObj.handler).apply(matched.elem, args);
                  if (ret !== void 0) {
                    if ((event.result = ret) === false) {
                      event.preventDefault();
                      event.stopPropagation();
                    }
                  }
                }
              }
            }
            if (special.postDispatch) {
              special.postDispatch.call(this, event);
            }
            return event.result;
          },
          handlers: function(event, handlers) {
            var i, handleObj, sel, matchedHandlers, matchedSelectors, handlerQueue = [], delegateCount = handlers.delegateCount, cur = event.target;
            if (delegateCount && // Support: IE <=9
            // Black-hole SVG <use> instance trees (trac-13180)
            cur.nodeType && // Support: Firefox <=42
            // Suppress spec-violating clicks indicating a non-primary pointer button (trac-3861)
            // https://www.w3.org/TR/DOM-Level-3-Events/#event-type-click
            // Support: IE 11 only
            // ...but not arrow key "clicks" of radio inputs, which can have `button` -1 (gh-2343)
            !(event.type === "click" && event.button >= 1)) {
              for (; cur !== this; cur = cur.parentNode || this) {
                if (cur.nodeType === 1 && !(event.type === "click" && cur.disabled === true)) {
                  matchedHandlers = [];
                  matchedSelectors = {};
                  for (i = 0; i < delegateCount; i++) {
                    handleObj = handlers[i];
                    sel = handleObj.selector + " ";
                    if (matchedSelectors[sel] === void 0) {
                      matchedSelectors[sel] = handleObj.needsContext ? jQuery2(sel, this).index(cur) > -1 : jQuery2.find(sel, this, null, [cur]).length;
                    }
                    if (matchedSelectors[sel]) {
                      matchedHandlers.push(handleObj);
                    }
                  }
                  if (matchedHandlers.length) {
                    handlerQueue.push({ elem: cur, handlers: matchedHandlers });
                  }
                }
              }
            }
            cur = this;
            if (delegateCount < handlers.length) {
              handlerQueue.push({ elem: cur, handlers: handlers.slice(delegateCount) });
            }
            return handlerQueue;
          },
          addProp: function(name, hook) {
            Object.defineProperty(jQuery2.Event.prototype, name, {
              enumerable: true,
              configurable: true,
              get: isFunction(hook) ? function() {
                if (this.originalEvent) {
                  return hook(this.originalEvent);
                }
              } : function() {
                if (this.originalEvent) {
                  return this.originalEvent[name];
                }
              },
              set: function(value) {
                Object.defineProperty(this, name, {
                  enumerable: true,
                  configurable: true,
                  writable: true,
                  value
                });
              }
            });
          },
          fix: function(originalEvent) {
            return originalEvent[jQuery2.expando] ? originalEvent : new jQuery2.Event(originalEvent);
          },
          special: {
            load: {
              // Prevent triggered image.load events from bubbling to window.load
              noBubble: true
            },
            click: {
              // Utilize native event to ensure correct state for checkable inputs
              setup: function(data) {
                var el = this || data;
                if (rcheckableType.test(el.type) && el.click && nodeName(el, "input")) {
                  leverageNative(el, "click", true);
                }
                return false;
              },
              trigger: function(data) {
                var el = this || data;
                if (rcheckableType.test(el.type) && el.click && nodeName(el, "input")) {
                  leverageNative(el, "click");
                }
                return true;
              },
              // For cross-browser consistency, suppress native .click() on links
              // Also prevent it if we're currently inside a leveraged native-event stack
              _default: function(event) {
                var target = event.target;
                return rcheckableType.test(target.type) && target.click && nodeName(target, "input") && dataPriv.get(target, "click") || nodeName(target, "a");
              }
            },
            beforeunload: {
              postDispatch: function(event) {
                if (event.result !== void 0 && event.originalEvent) {
                  event.originalEvent.returnValue = event.result;
                }
              }
            }
          }
        };
        function leverageNative(el, type, isSetup) {
          if (!isSetup) {
            if (dataPriv.get(el, type) === void 0) {
              jQuery2.event.add(el, type, returnTrue);
            }
            return;
          }
          dataPriv.set(el, type, false);
          jQuery2.event.add(el, type, {
            namespace: false,
            handler: function(event) {
              var result, saved = dataPriv.get(this, type);
              if (event.isTrigger & 1 && this[type]) {
                if (!saved) {
                  saved = slice.call(arguments);
                  dataPriv.set(this, type, saved);
                  this[type]();
                  result = dataPriv.get(this, type);
                  dataPriv.set(this, type, false);
                  if (saved !== result) {
                    event.stopImmediatePropagation();
                    event.preventDefault();
                    return result;
                  }
                } else if ((jQuery2.event.special[type] || {}).delegateType) {
                  event.stopPropagation();
                }
              } else if (saved) {
                dataPriv.set(this, type, jQuery2.event.trigger(
                  saved[0],
                  saved.slice(1),
                  this
                ));
                event.stopPropagation();
                event.isImmediatePropagationStopped = returnTrue;
              }
            }
          });
        }
        jQuery2.removeEvent = function(elem, type, handle) {
          if (elem.removeEventListener) {
            elem.removeEventListener(type, handle);
          }
        };
        jQuery2.Event = function(src, props) {
          if (!(this instanceof jQuery2.Event)) {
            return new jQuery2.Event(src, props);
          }
          if (src && src.type) {
            this.originalEvent = src;
            this.type = src.type;
            this.isDefaultPrevented = src.defaultPrevented || src.defaultPrevented === void 0 && // Support: Android <=2.3 only
            src.returnValue === false ? returnTrue : returnFalse;
            this.target = src.target && src.target.nodeType === 3 ? src.target.parentNode : src.target;
            this.currentTarget = src.currentTarget;
            this.relatedTarget = src.relatedTarget;
          } else {
            this.type = src;
          }
          if (props) {
            jQuery2.extend(this, props);
          }
          this.timeStamp = src && src.timeStamp || Date.now();
          this[jQuery2.expando] = true;
        };
        jQuery2.Event.prototype = {
          constructor: jQuery2.Event,
          isDefaultPrevented: returnFalse,
          isPropagationStopped: returnFalse,
          isImmediatePropagationStopped: returnFalse,
          isSimulated: false,
          preventDefault: function() {
            var e = this.originalEvent;
            this.isDefaultPrevented = returnTrue;
            if (e && !this.isSimulated) {
              e.preventDefault();
            }
          },
          stopPropagation: function() {
            var e = this.originalEvent;
            this.isPropagationStopped = returnTrue;
            if (e && !this.isSimulated) {
              e.stopPropagation();
            }
          },
          stopImmediatePropagation: function() {
            var e = this.originalEvent;
            this.isImmediatePropagationStopped = returnTrue;
            if (e && !this.isSimulated) {
              e.stopImmediatePropagation();
            }
            this.stopPropagation();
          }
        };
        jQuery2.each({
          altKey: true,
          bubbles: true,
          cancelable: true,
          changedTouches: true,
          ctrlKey: true,
          detail: true,
          eventPhase: true,
          metaKey: true,
          pageX: true,
          pageY: true,
          shiftKey: true,
          view: true,
          "char": true,
          code: true,
          charCode: true,
          key: true,
          keyCode: true,
          button: true,
          buttons: true,
          clientX: true,
          clientY: true,
          offsetX: true,
          offsetY: true,
          pointerId: true,
          pointerType: true,
          screenX: true,
          screenY: true,
          targetTouches: true,
          toElement: true,
          touches: true,
          which: true
        }, jQuery2.event.addProp);
        jQuery2.each({ focus: "focusin", blur: "focusout" }, function(type, delegateType) {
          function focusMappedHandler(nativeEvent) {
            if (document2.documentMode) {
              var handle = dataPriv.get(this, "handle"), event = jQuery2.event.fix(nativeEvent);
              event.type = nativeEvent.type === "focusin" ? "focus" : "blur";
              event.isSimulated = true;
              handle(nativeEvent);
              if (event.target === event.currentTarget) {
                handle(event);
              }
            } else {
              jQuery2.event.simulate(
                delegateType,
                nativeEvent.target,
                jQuery2.event.fix(nativeEvent)
              );
            }
          }
          jQuery2.event.special[type] = {
            // Utilize native event if possible so blur/focus sequence is correct
            setup: function() {
              var attaches;
              leverageNative(this, type, true);
              if (document2.documentMode) {
                attaches = dataPriv.get(this, delegateType);
                if (!attaches) {
                  this.addEventListener(delegateType, focusMappedHandler);
                }
                dataPriv.set(this, delegateType, (attaches || 0) + 1);
              } else {
                return false;
              }
            },
            trigger: function() {
              leverageNative(this, type);
              return true;
            },
            teardown: function() {
              var attaches;
              if (document2.documentMode) {
                attaches = dataPriv.get(this, delegateType) - 1;
                if (!attaches) {
                  this.removeEventListener(delegateType, focusMappedHandler);
                  dataPriv.remove(this, delegateType);
                } else {
                  dataPriv.set(this, delegateType, attaches);
                }
              } else {
                return false;
              }
            },
            // Suppress native focus or blur if we're currently inside
            // a leveraged native-event stack
            _default: function(event) {
              return dataPriv.get(event.target, type);
            },
            delegateType
          };
          jQuery2.event.special[delegateType] = {
            setup: function() {
              var doc = this.ownerDocument || this.document || this, dataHolder = document2.documentMode ? this : doc, attaches = dataPriv.get(dataHolder, delegateType);
              if (!attaches) {
                if (document2.documentMode) {
                  this.addEventListener(delegateType, focusMappedHandler);
                } else {
                  doc.addEventListener(type, focusMappedHandler, true);
                }
              }
              dataPriv.set(dataHolder, delegateType, (attaches || 0) + 1);
            },
            teardown: function() {
              var doc = this.ownerDocument || this.document || this, dataHolder = document2.documentMode ? this : doc, attaches = dataPriv.get(dataHolder, delegateType) - 1;
              if (!attaches) {
                if (document2.documentMode) {
                  this.removeEventListener(delegateType, focusMappedHandler);
                } else {
                  doc.removeEventListener(type, focusMappedHandler, true);
                }
                dataPriv.remove(dataHolder, delegateType);
              } else {
                dataPriv.set(dataHolder, delegateType, attaches);
              }
            }
          };
        });
        jQuery2.each({
          mouseenter: "mouseover",
          mouseleave: "mouseout",
          pointerenter: "pointerover",
          pointerleave: "pointerout"
        }, function(orig, fix) {
          jQuery2.event.special[orig] = {
            delegateType: fix,
            bindType: fix,
            handle: function(event) {
              var ret, target = this, related = event.relatedTarget, handleObj = event.handleObj;
              if (!related || related !== target && !jQuery2.contains(target, related)) {
                event.type = handleObj.origType;
                ret = handleObj.handler.apply(this, arguments);
                event.type = fix;
              }
              return ret;
            }
          };
        });
        jQuery2.fn.extend({
          on: function(types, selector, data, fn) {
            return on(this, types, selector, data, fn);
          },
          one: function(types, selector, data, fn) {
            return on(this, types, selector, data, fn, 1);
          },
          off: function(types, selector, fn) {
            var handleObj, type;
            if (types && types.preventDefault && types.handleObj) {
              handleObj = types.handleObj;
              jQuery2(types.delegateTarget).off(
                handleObj.namespace ? handleObj.origType + "." + handleObj.namespace : handleObj.origType,
                handleObj.selector,
                handleObj.handler
              );
              return this;
            }
            if (typeof types === "object") {
              for (type in types) {
                this.off(type, selector, types[type]);
              }
              return this;
            }
            if (selector === false || typeof selector === "function") {
              fn = selector;
              selector = void 0;
            }
            if (fn === false) {
              fn = returnFalse;
            }
            return this.each(function() {
              jQuery2.event.remove(this, types, fn, selector);
            });
          }
        });
        var rnoInnerhtml = /<script|<style|<link/i, rchecked = /checked\s*(?:[^=]|=\s*.checked.)/i, rcleanScript = /^\s*<!\[CDATA\[|\]\]>\s*$/g;
        function manipulationTarget(elem, content) {
          if (nodeName(elem, "table") && nodeName(content.nodeType !== 11 ? content : content.firstChild, "tr")) {
            return jQuery2(elem).children("tbody")[0] || elem;
          }
          return elem;
        }
        function disableScript(elem) {
          elem.type = (elem.getAttribute("type") !== null) + "/" + elem.type;
          return elem;
        }
        function restoreScript(elem) {
          if ((elem.type || "").slice(0, 5) === "true/") {
            elem.type = elem.type.slice(5);
          } else {
            elem.removeAttribute("type");
          }
          return elem;
        }
        function cloneCopyEvent(src, dest) {
          var i, l, type, pdataOld, udataOld, udataCur, events;
          if (dest.nodeType !== 1) {
            return;
          }
          if (dataPriv.hasData(src)) {
            pdataOld = dataPriv.get(src);
            events = pdataOld.events;
            if (events) {
              dataPriv.remove(dest, "handle events");
              for (type in events) {
                for (i = 0, l = events[type].length; i < l; i++) {
                  jQuery2.event.add(dest, type, events[type][i]);
                }
              }
            }
          }
          if (dataUser.hasData(src)) {
            udataOld = dataUser.access(src);
            udataCur = jQuery2.extend({}, udataOld);
            dataUser.set(dest, udataCur);
          }
        }
        function fixInput(src, dest) {
          var nodeName2 = dest.nodeName.toLowerCase();
          if (nodeName2 === "input" && rcheckableType.test(src.type)) {
            dest.checked = src.checked;
          } else if (nodeName2 === "input" || nodeName2 === "textarea") {
            dest.defaultValue = src.defaultValue;
          }
        }
        function domManip(collection, args, callback, ignored) {
          args = flat(args);
          var fragment, first, scripts, hasScripts, node, doc, i = 0, l = collection.length, iNoClone = l - 1, value = args[0], valueIsFunction = isFunction(value);
          if (valueIsFunction || l > 1 && typeof value === "string" && !support.checkClone && rchecked.test(value)) {
            return collection.each(function(index) {
              var self = collection.eq(index);
              if (valueIsFunction) {
                args[0] = value.call(this, index, self.html());
              }
              domManip(self, args, callback, ignored);
            });
          }
          if (l) {
            fragment = buildFragment(args, collection[0].ownerDocument, false, collection, ignored);
            first = fragment.firstChild;
            if (fragment.childNodes.length === 1) {
              fragment = first;
            }
            if (first || ignored) {
              scripts = jQuery2.map(getAll(fragment, "script"), disableScript);
              hasScripts = scripts.length;
              for (; i < l; i++) {
                node = fragment;
                if (i !== iNoClone) {
                  node = jQuery2.clone(node, true, true);
                  if (hasScripts) {
                    jQuery2.merge(scripts, getAll(node, "script"));
                  }
                }
                callback.call(collection[i], node, i);
              }
              if (hasScripts) {
                doc = scripts[scripts.length - 1].ownerDocument;
                jQuery2.map(scripts, restoreScript);
                for (i = 0; i < hasScripts; i++) {
                  node = scripts[i];
                  if (rscriptType.test(node.type || "") && !dataPriv.access(node, "globalEval") && jQuery2.contains(doc, node)) {
                    if (node.src && (node.type || "").toLowerCase() !== "module") {
                      if (jQuery2._evalUrl && !node.noModule) {
                        jQuery2._evalUrl(node.src, {
                          nonce: node.nonce || node.getAttribute("nonce")
                        }, doc);
                      }
                    } else {
                      DOMEval(node.textContent.replace(rcleanScript, ""), node, doc);
                    }
                  }
                }
              }
            }
          }
          return collection;
        }
        function remove(elem, selector, keepData) {
          var node, nodes = selector ? jQuery2.filter(selector, elem) : elem, i = 0;
          for (; (node = nodes[i]) != null; i++) {
            if (!keepData && node.nodeType === 1) {
              jQuery2.cleanData(getAll(node));
            }
            if (node.parentNode) {
              if (keepData && isAttached(node)) {
                setGlobalEval(getAll(node, "script"));
              }
              node.parentNode.removeChild(node);
            }
          }
          return elem;
        }
        jQuery2.extend({
          htmlPrefilter: function(html) {
            return html;
          },
          clone: function(elem, dataAndEvents, deepDataAndEvents) {
            var i, l, srcElements, destElements, clone = elem.cloneNode(true), inPage = isAttached(elem);
            if (!support.noCloneChecked && (elem.nodeType === 1 || elem.nodeType === 11) && !jQuery2.isXMLDoc(elem)) {
              destElements = getAll(clone);
              srcElements = getAll(elem);
              for (i = 0, l = srcElements.length; i < l; i++) {
                fixInput(srcElements[i], destElements[i]);
              }
            }
            if (dataAndEvents) {
              if (deepDataAndEvents) {
                srcElements = srcElements || getAll(elem);
                destElements = destElements || getAll(clone);
                for (i = 0, l = srcElements.length; i < l; i++) {
                  cloneCopyEvent(srcElements[i], destElements[i]);
                }
              } else {
                cloneCopyEvent(elem, clone);
              }
            }
            destElements = getAll(clone, "script");
            if (destElements.length > 0) {
              setGlobalEval(destElements, !inPage && getAll(elem, "script"));
            }
            return clone;
          },
          cleanData: function(elems) {
            var data, elem, type, special = jQuery2.event.special, i = 0;
            for (; (elem = elems[i]) !== void 0; i++) {
              if (acceptData(elem)) {
                if (data = elem[dataPriv.expando]) {
                  if (data.events) {
                    for (type in data.events) {
                      if (special[type]) {
                        jQuery2.event.remove(elem, type);
                      } else {
                        jQuery2.removeEvent(elem, type, data.handle);
                      }
                    }
                  }
                  elem[dataPriv.expando] = void 0;
                }
                if (elem[dataUser.expando]) {
                  elem[dataUser.expando] = void 0;
                }
              }
            }
          }
        });
        jQuery2.fn.extend({
          detach: function(selector) {
            return remove(this, selector, true);
          },
          remove: function(selector) {
            return remove(this, selector);
          },
          text: function(value) {
            return access(this, function(value2) {
              return value2 === void 0 ? jQuery2.text(this) : this.empty().each(function() {
                if (this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9) {
                  this.textContent = value2;
                }
              });
            }, null, value, arguments.length);
          },
          append: function() {
            return domManip(this, arguments, function(elem) {
              if (this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9) {
                var target = manipulationTarget(this, elem);
                target.appendChild(elem);
              }
            });
          },
          prepend: function() {
            return domManip(this, arguments, function(elem) {
              if (this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9) {
                var target = manipulationTarget(this, elem);
                target.insertBefore(elem, target.firstChild);
              }
            });
          },
          before: function() {
            return domManip(this, arguments, function(elem) {
              if (this.parentNode) {
                this.parentNode.insertBefore(elem, this);
              }
            });
          },
          after: function() {
            return domManip(this, arguments, function(elem) {
              if (this.parentNode) {
                this.parentNode.insertBefore(elem, this.nextSibling);
              }
            });
          },
          empty: function() {
            var elem, i = 0;
            for (; (elem = this[i]) != null; i++) {
              if (elem.nodeType === 1) {
                jQuery2.cleanData(getAll(elem, false));
                elem.textContent = "";
              }
            }
            return this;
          },
          clone: function(dataAndEvents, deepDataAndEvents) {
            dataAndEvents = dataAndEvents == null ? false : dataAndEvents;
            deepDataAndEvents = deepDataAndEvents == null ? dataAndEvents : deepDataAndEvents;
            return this.map(function() {
              return jQuery2.clone(this, dataAndEvents, deepDataAndEvents);
            });
          },
          html: function(value) {
            return access(this, function(value2) {
              var elem = this[0] || {}, i = 0, l = this.length;
              if (value2 === void 0 && elem.nodeType === 1) {
                return elem.innerHTML;
              }
              if (typeof value2 === "string" && !rnoInnerhtml.test(value2) && !wrapMap[(rtagName.exec(value2) || ["", ""])[1].toLowerCase()]) {
                value2 = jQuery2.htmlPrefilter(value2);
                try {
                  for (; i < l; i++) {
                    elem = this[i] || {};
                    if (elem.nodeType === 1) {
                      jQuery2.cleanData(getAll(elem, false));
                      elem.innerHTML = value2;
                    }
                  }
                  elem = 0;
                } catch (e) {
                }
              }
              if (elem) {
                this.empty().append(value2);
              }
            }, null, value, arguments.length);
          },
          replaceWith: function() {
            var ignored = [];
            return domManip(this, arguments, function(elem) {
              var parent = this.parentNode;
              if (jQuery2.inArray(this, ignored) < 0) {
                jQuery2.cleanData(getAll(this));
                if (parent) {
                  parent.replaceChild(elem, this);
                }
              }
            }, ignored);
          }
        });
        jQuery2.each({
          appendTo: "append",
          prependTo: "prepend",
          insertBefore: "before",
          insertAfter: "after",
          replaceAll: "replaceWith"
        }, function(name, original) {
          jQuery2.fn[name] = function(selector) {
            var elems, ret = [], insert = jQuery2(selector), last = insert.length - 1, i = 0;
            for (; i <= last; i++) {
              elems = i === last ? this : this.clone(true);
              jQuery2(insert[i])[original](elems);
              push.apply(ret, elems.get());
            }
            return this.pushStack(ret);
          };
        });
        var rnumnonpx = new RegExp("^(" + pnum + ")(?!px)[a-z%]+$", "i");
        var rcustomProp = /^--/;
        var getStyles = function(elem) {
          var view = elem.ownerDocument.defaultView;
          if (!view || !view.opener) {
            view = window2;
          }
          return view.getComputedStyle(elem);
        };
        var swap = function(elem, options, callback) {
          var ret, name, old = {};
          for (name in options) {
            old[name] = elem.style[name];
            elem.style[name] = options[name];
          }
          ret = callback.call(elem);
          for (name in options) {
            elem.style[name] = old[name];
          }
          return ret;
        };
        var rboxStyle = new RegExp(cssExpand.join("|"), "i");
        (function() {
          function computeStyleTests() {
            if (!div) {
              return;
            }
            container.style.cssText = "position:absolute;left:-11111px;width:60px;margin-top:1px;padding:0;border:0";
            div.style.cssText = "position:relative;display:block;box-sizing:border-box;overflow:scroll;margin:auto;border:1px;padding:1px;width:60%;top:1%";
            documentElement.appendChild(container).appendChild(div);
            var divStyle = window2.getComputedStyle(div);
            pixelPositionVal = divStyle.top !== "1%";
            reliableMarginLeftVal = roundPixelMeasures(divStyle.marginLeft) === 12;
            div.style.right = "60%";
            pixelBoxStylesVal = roundPixelMeasures(divStyle.right) === 36;
            boxSizingReliableVal = roundPixelMeasures(divStyle.width) === 36;
            div.style.position = "absolute";
            scrollboxSizeVal = roundPixelMeasures(div.offsetWidth / 3) === 12;
            documentElement.removeChild(container);
            div = null;
          }
          function roundPixelMeasures(measure) {
            return Math.round(parseFloat(measure));
          }
          var pixelPositionVal, boxSizingReliableVal, scrollboxSizeVal, pixelBoxStylesVal, reliableTrDimensionsVal, reliableMarginLeftVal, container = document2.createElement("div"), div = document2.createElement("div");
          if (!div.style) {
            return;
          }
          div.style.backgroundClip = "content-box";
          div.cloneNode(true).style.backgroundClip = "";
          support.clearCloneStyle = div.style.backgroundClip === "content-box";
          jQuery2.extend(support, {
            boxSizingReliable: function() {
              computeStyleTests();
              return boxSizingReliableVal;
            },
            pixelBoxStyles: function() {
              computeStyleTests();
              return pixelBoxStylesVal;
            },
            pixelPosition: function() {
              computeStyleTests();
              return pixelPositionVal;
            },
            reliableMarginLeft: function() {
              computeStyleTests();
              return reliableMarginLeftVal;
            },
            scrollboxSize: function() {
              computeStyleTests();
              return scrollboxSizeVal;
            },
            // Support: IE 9 - 11+, Edge 15 - 18+
            // IE/Edge misreport `getComputedStyle` of table rows with width/height
            // set in CSS while `offset*` properties report correct values.
            // Behavior in IE 9 is more subtle than in newer versions & it passes
            // some versions of this test; make sure not to make it pass there!
            //
            // Support: Firefox 70+
            // Only Firefox includes border widths
            // in computed dimensions. (gh-4529)
            reliableTrDimensions: function() {
              var table, tr, trChild, trStyle;
              if (reliableTrDimensionsVal == null) {
                table = document2.createElement("table");
                tr = document2.createElement("tr");
                trChild = document2.createElement("div");
                table.style.cssText = "position:absolute;left:-11111px;border-collapse:separate";
                tr.style.cssText = "box-sizing:content-box;border:1px solid";
                tr.style.height = "1px";
                trChild.style.height = "9px";
                trChild.style.display = "block";
                documentElement.appendChild(table).appendChild(tr).appendChild(trChild);
                trStyle = window2.getComputedStyle(tr);
                reliableTrDimensionsVal = parseInt(trStyle.height, 10) + parseInt(trStyle.borderTopWidth, 10) + parseInt(trStyle.borderBottomWidth, 10) === tr.offsetHeight;
                documentElement.removeChild(table);
              }
              return reliableTrDimensionsVal;
            }
          });
        })();
        function curCSS(elem, name, computed) {
          var width, minWidth, maxWidth, ret, isCustomProp = rcustomProp.test(name), style = elem.style;
          computed = computed || getStyles(elem);
          if (computed) {
            ret = computed.getPropertyValue(name) || computed[name];
            if (isCustomProp && ret) {
              ret = ret.replace(rtrimCSS, "$1") || void 0;
            }
            if (ret === "" && !isAttached(elem)) {
              ret = jQuery2.style(elem, name);
            }
            if (!support.pixelBoxStyles() && rnumnonpx.test(ret) && rboxStyle.test(name)) {
              width = style.width;
              minWidth = style.minWidth;
              maxWidth = style.maxWidth;
              style.minWidth = style.maxWidth = style.width = ret;
              ret = computed.width;
              style.width = width;
              style.minWidth = minWidth;
              style.maxWidth = maxWidth;
            }
          }
          return ret !== void 0 ? (
            // Support: IE <=9 - 11 only
            // IE returns zIndex value as an integer.
            ret + ""
          ) : ret;
        }
        function addGetHookIf(conditionFn, hookFn) {
          return {
            get: function() {
              if (conditionFn()) {
                delete this.get;
                return;
              }
              return (this.get = hookFn).apply(this, arguments);
            }
          };
        }
        var cssPrefixes = ["Webkit", "Moz", "ms"], emptyStyle = document2.createElement("div").style, vendorProps = {};
        function vendorPropName(name) {
          var capName = name[0].toUpperCase() + name.slice(1), i = cssPrefixes.length;
          while (i--) {
            name = cssPrefixes[i] + capName;
            if (name in emptyStyle) {
              return name;
            }
          }
        }
        function finalPropName(name) {
          var final = jQuery2.cssProps[name] || vendorProps[name];
          if (final) {
            return final;
          }
          if (name in emptyStyle) {
            return name;
          }
          return vendorProps[name] = vendorPropName(name) || name;
        }
        var rdisplayswap = /^(none|table(?!-c[ea]).+)/, cssShow = { position: "absolute", visibility: "hidden", display: "block" }, cssNormalTransform = {
          letterSpacing: "0",
          fontWeight: "400"
        };
        function setPositiveNumber(_elem, value, subtract) {
          var matches = rcssNum.exec(value);
          return matches ? (
            // Guard against undefined "subtract", e.g., when used as in cssHooks
            Math.max(0, matches[2] - (subtract || 0)) + (matches[3] || "px")
          ) : value;
        }
        function boxModelAdjustment(elem, dimension, box, isBorderBox, styles, computedVal) {
          var i = dimension === "width" ? 1 : 0, extra = 0, delta = 0, marginDelta = 0;
          if (box === (isBorderBox ? "border" : "content")) {
            return 0;
          }
          for (; i < 4; i += 2) {
            if (box === "margin") {
              marginDelta += jQuery2.css(elem, box + cssExpand[i], true, styles);
            }
            if (!isBorderBox) {
              delta += jQuery2.css(elem, "padding" + cssExpand[i], true, styles);
              if (box !== "padding") {
                delta += jQuery2.css(elem, "border" + cssExpand[i] + "Width", true, styles);
              } else {
                extra += jQuery2.css(elem, "border" + cssExpand[i] + "Width", true, styles);
              }
            } else {
              if (box === "content") {
                delta -= jQuery2.css(elem, "padding" + cssExpand[i], true, styles);
              }
              if (box !== "margin") {
                delta -= jQuery2.css(elem, "border" + cssExpand[i] + "Width", true, styles);
              }
            }
          }
          if (!isBorderBox && computedVal >= 0) {
            delta += Math.max(0, Math.ceil(
              elem["offset" + dimension[0].toUpperCase() + dimension.slice(1)] - computedVal - delta - extra - 0.5
              // If offsetWidth/offsetHeight is unknown, then we can't determine content-box scroll gutter
              // Use an explicit zero to avoid NaN (gh-3964)
            )) || 0;
          }
          return delta + marginDelta;
        }
        function getWidthOrHeight(elem, dimension, extra) {
          var styles = getStyles(elem), boxSizingNeeded = !support.boxSizingReliable() || extra, isBorderBox = boxSizingNeeded && jQuery2.css(elem, "boxSizing", false, styles) === "border-box", valueIsBorderBox = isBorderBox, val = curCSS(elem, dimension, styles), offsetProp = "offset" + dimension[0].toUpperCase() + dimension.slice(1);
          if (rnumnonpx.test(val)) {
            if (!extra) {
              return val;
            }
            val = "auto";
          }
          if ((!support.boxSizingReliable() && isBorderBox || // Support: IE 10 - 11+, Edge 15 - 18+
          // IE/Edge misreport `getComputedStyle` of table rows with width/height
          // set in CSS while `offset*` properties report correct values.
          // Interestingly, in some cases IE 9 doesn't suffer from this issue.
          !support.reliableTrDimensions() && nodeName(elem, "tr") || // Fall back to offsetWidth/offsetHeight when value is "auto"
          // This happens for inline elements with no explicit setting (gh-3571)
          val === "auto" || // Support: Android <=4.1 - 4.3 only
          // Also use offsetWidth/offsetHeight for misreported inline dimensions (gh-3602)
          !parseFloat(val) && jQuery2.css(elem, "display", false, styles) === "inline") && // Make sure the element is visible & connected
          elem.getClientRects().length) {
            isBorderBox = jQuery2.css(elem, "boxSizing", false, styles) === "border-box";
            valueIsBorderBox = offsetProp in elem;
            if (valueIsBorderBox) {
              val = elem[offsetProp];
            }
          }
          val = parseFloat(val) || 0;
          return val + boxModelAdjustment(
            elem,
            dimension,
            extra || (isBorderBox ? "border" : "content"),
            valueIsBorderBox,
            styles,
            // Provide the current computed size to request scroll gutter calculation (gh-3589)
            val
          ) + "px";
        }
        jQuery2.extend({
          // Add in style property hooks for overriding the default
          // behavior of getting and setting a style property
          cssHooks: {
            opacity: {
              get: function(elem, computed) {
                if (computed) {
                  var ret = curCSS(elem, "opacity");
                  return ret === "" ? "1" : ret;
                }
              }
            }
          },
          // Don't automatically add "px" to these possibly-unitless properties
          cssNumber: {
            animationIterationCount: true,
            aspectRatio: true,
            borderImageSlice: true,
            columnCount: true,
            flexGrow: true,
            flexShrink: true,
            fontWeight: true,
            gridArea: true,
            gridColumn: true,
            gridColumnEnd: true,
            gridColumnStart: true,
            gridRow: true,
            gridRowEnd: true,
            gridRowStart: true,
            lineHeight: true,
            opacity: true,
            order: true,
            orphans: true,
            scale: true,
            widows: true,
            zIndex: true,
            zoom: true,
            // SVG-related
            fillOpacity: true,
            floodOpacity: true,
            stopOpacity: true,
            strokeMiterlimit: true,
            strokeOpacity: true
          },
          // Add in properties whose names you wish to fix before
          // setting or getting the value
          cssProps: {},
          // Get and set the style property on a DOM Node
          style: function(elem, name, value, extra) {
            if (!elem || elem.nodeType === 3 || elem.nodeType === 8 || !elem.style) {
              return;
            }
            var ret, type, hooks, origName = camelCase(name), isCustomProp = rcustomProp.test(name), style = elem.style;
            if (!isCustomProp) {
              name = finalPropName(origName);
            }
            hooks = jQuery2.cssHooks[name] || jQuery2.cssHooks[origName];
            if (value !== void 0) {
              type = typeof value;
              if (type === "string" && (ret = rcssNum.exec(value)) && ret[1]) {
                value = adjustCSS(elem, name, ret);
                type = "number";
              }
              if (value == null || value !== value) {
                return;
              }
              if (type === "number" && !isCustomProp) {
                value += ret && ret[3] || (jQuery2.cssNumber[origName] ? "" : "px");
              }
              if (!support.clearCloneStyle && value === "" && name.indexOf("background") === 0) {
                style[name] = "inherit";
              }
              if (!hooks || !("set" in hooks) || (value = hooks.set(elem, value, extra)) !== void 0) {
                if (isCustomProp) {
                  style.setProperty(name, value);
                } else {
                  style[name] = value;
                }
              }
            } else {
              if (hooks && "get" in hooks && (ret = hooks.get(elem, false, extra)) !== void 0) {
                return ret;
              }
              return style[name];
            }
          },
          css: function(elem, name, extra, styles) {
            var val, num, hooks, origName = camelCase(name), isCustomProp = rcustomProp.test(name);
            if (!isCustomProp) {
              name = finalPropName(origName);
            }
            hooks = jQuery2.cssHooks[name] || jQuery2.cssHooks[origName];
            if (hooks && "get" in hooks) {
              val = hooks.get(elem, true, extra);
            }
            if (val === void 0) {
              val = curCSS(elem, name, styles);
            }
            if (val === "normal" && name in cssNormalTransform) {
              val = cssNormalTransform[name];
            }
            if (extra === "" || extra) {
              num = parseFloat(val);
              return extra === true || isFinite(num) ? num || 0 : val;
            }
            return val;
          }
        });
        jQuery2.each(["height", "width"], function(_i, dimension) {
          jQuery2.cssHooks[dimension] = {
            get: function(elem, computed, extra) {
              if (computed) {
                return rdisplayswap.test(jQuery2.css(elem, "display")) && // Support: Safari 8+
                // Table columns in Safari have non-zero offsetWidth & zero
                // getBoundingClientRect().width unless display is changed.
                // Support: IE <=11 only
                // Running getBoundingClientRect on a disconnected node
                // in IE throws an error.
                (!elem.getClientRects().length || !elem.getBoundingClientRect().width) ? swap(elem, cssShow, function() {
                  return getWidthOrHeight(elem, dimension, extra);
                }) : getWidthOrHeight(elem, dimension, extra);
              }
            },
            set: function(elem, value, extra) {
              var matches, styles = getStyles(elem), scrollboxSizeBuggy = !support.scrollboxSize() && styles.position === "absolute", boxSizingNeeded = scrollboxSizeBuggy || extra, isBorderBox = boxSizingNeeded && jQuery2.css(elem, "boxSizing", false, styles) === "border-box", subtract = extra ? boxModelAdjustment(
                elem,
                dimension,
                extra,
                isBorderBox,
                styles
              ) : 0;
              if (isBorderBox && scrollboxSizeBuggy) {
                subtract -= Math.ceil(
                  elem["offset" + dimension[0].toUpperCase() + dimension.slice(1)] - parseFloat(styles[dimension]) - boxModelAdjustment(elem, dimension, "border", false, styles) - 0.5
                );
              }
              if (subtract && (matches = rcssNum.exec(value)) && (matches[3] || "px") !== "px") {
                elem.style[dimension] = value;
                value = jQuery2.css(elem, dimension);
              }
              return setPositiveNumber(elem, value, subtract);
            }
          };
        });
        jQuery2.cssHooks.marginLeft = addGetHookIf(
          support.reliableMarginLeft,
          function(elem, computed) {
            if (computed) {
              return (parseFloat(curCSS(elem, "marginLeft")) || elem.getBoundingClientRect().left - swap(elem, { marginLeft: 0 }, function() {
                return elem.getBoundingClientRect().left;
              })) + "px";
            }
          }
        );
        jQuery2.each({
          margin: "",
          padding: "",
          border: "Width"
        }, function(prefix, suffix) {
          jQuery2.cssHooks[prefix + suffix] = {
            expand: function(value) {
              var i = 0, expanded = {}, parts = typeof value === "string" ? value.split(" ") : [value];
              for (; i < 4; i++) {
                expanded[prefix + cssExpand[i] + suffix] = parts[i] || parts[i - 2] || parts[0];
              }
              return expanded;
            }
          };
          if (prefix !== "margin") {
            jQuery2.cssHooks[prefix + suffix].set = setPositiveNumber;
          }
        });
        jQuery2.fn.extend({
          css: function(name, value) {
            return access(this, function(elem, name2, value2) {
              var styles, len, map = {}, i = 0;
              if (Array.isArray(name2)) {
                styles = getStyles(elem);
                len = name2.length;
                for (; i < len; i++) {
                  map[name2[i]] = jQuery2.css(elem, name2[i], false, styles);
                }
                return map;
              }
              return value2 !== void 0 ? jQuery2.style(elem, name2, value2) : jQuery2.css(elem, name2);
            }, name, value, arguments.length > 1);
          }
        });
        function Tween(elem, options, prop, end, easing) {
          return new Tween.prototype.init(elem, options, prop, end, easing);
        }
        jQuery2.Tween = Tween;
        Tween.prototype = {
          constructor: Tween,
          init: function(elem, options, prop, end, easing, unit) {
            this.elem = elem;
            this.prop = prop;
            this.easing = easing || jQuery2.easing._default;
            this.options = options;
            this.start = this.now = this.cur();
            this.end = end;
            this.unit = unit || (jQuery2.cssNumber[prop] ? "" : "px");
          },
          cur: function() {
            var hooks = Tween.propHooks[this.prop];
            return hooks && hooks.get ? hooks.get(this) : Tween.propHooks._default.get(this);
          },
          run: function(percent) {
            var eased, hooks = Tween.propHooks[this.prop];
            if (this.options.duration) {
              this.pos = eased = jQuery2.easing[this.easing](
                percent,
                this.options.duration * percent,
                0,
                1,
                this.options.duration
              );
            } else {
              this.pos = eased = percent;
            }
            this.now = (this.end - this.start) * eased + this.start;
            if (this.options.step) {
              this.options.step.call(this.elem, this.now, this);
            }
            if (hooks && hooks.set) {
              hooks.set(this);
            } else {
              Tween.propHooks._default.set(this);
            }
            return this;
          }
        };
        Tween.prototype.init.prototype = Tween.prototype;
        Tween.propHooks = {
          _default: {
            get: function(tween) {
              var result;
              if (tween.elem.nodeType !== 1 || tween.elem[tween.prop] != null && tween.elem.style[tween.prop] == null) {
                return tween.elem[tween.prop];
              }
              result = jQuery2.css(tween.elem, tween.prop, "");
              return !result || result === "auto" ? 0 : result;
            },
            set: function(tween) {
              if (jQuery2.fx.step[tween.prop]) {
                jQuery2.fx.step[tween.prop](tween);
              } else if (tween.elem.nodeType === 1 && (jQuery2.cssHooks[tween.prop] || tween.elem.style[finalPropName(tween.prop)] != null)) {
                jQuery2.style(tween.elem, tween.prop, tween.now + tween.unit);
              } else {
                tween.elem[tween.prop] = tween.now;
              }
            }
          }
        };
        Tween.propHooks.scrollTop = Tween.propHooks.scrollLeft = {
          set: function(tween) {
            if (tween.elem.nodeType && tween.elem.parentNode) {
              tween.elem[tween.prop] = tween.now;
            }
          }
        };
        jQuery2.easing = {
          linear: function(p) {
            return p;
          },
          swing: function(p) {
            return 0.5 - Math.cos(p * Math.PI) / 2;
          },
          _default: "swing"
        };
        jQuery2.fx = Tween.prototype.init;
        jQuery2.fx.step = {};
        var fxNow, inProgress, rfxtypes = /^(?:toggle|show|hide)$/, rrun = /queueHooks$/;
        function schedule() {
          if (inProgress) {
            if (document2.hidden === false && window2.requestAnimationFrame) {
              window2.requestAnimationFrame(schedule);
            } else {
              window2.setTimeout(schedule, jQuery2.fx.interval);
            }
            jQuery2.fx.tick();
          }
        }
        function createFxNow() {
          window2.setTimeout(function() {
            fxNow = void 0;
          });
          return fxNow = Date.now();
        }
        function genFx(type, includeWidth) {
          var which, i = 0, attrs = { height: type };
          includeWidth = includeWidth ? 1 : 0;
          for (; i < 4; i += 2 - includeWidth) {
            which = cssExpand[i];
            attrs["margin" + which] = attrs["padding" + which] = type;
          }
          if (includeWidth) {
            attrs.opacity = attrs.width = type;
          }
          return attrs;
        }
        function createTween(value, prop, animation) {
          var tween, collection = (Animation.tweeners[prop] || []).concat(Animation.tweeners["*"]), index = 0, length = collection.length;
          for (; index < length; index++) {
            if (tween = collection[index].call(animation, prop, value)) {
              return tween;
            }
          }
        }
        function defaultPrefilter(elem, props, opts) {
          var prop, value, toggle, hooks, oldfire, propTween, restoreDisplay, display, isBox = "width" in props || "height" in props, anim = this, orig = {}, style = elem.style, hidden = elem.nodeType && isHiddenWithinTree(elem), dataShow = dataPriv.get(elem, "fxshow");
          if (!opts.queue) {
            hooks = jQuery2._queueHooks(elem, "fx");
            if (hooks.unqueued == null) {
              hooks.unqueued = 0;
              oldfire = hooks.empty.fire;
              hooks.empty.fire = function() {
                if (!hooks.unqueued) {
                  oldfire();
                }
              };
            }
            hooks.unqueued++;
            anim.always(function() {
              anim.always(function() {
                hooks.unqueued--;
                if (!jQuery2.queue(elem, "fx").length) {
                  hooks.empty.fire();
                }
              });
            });
          }
          for (prop in props) {
            value = props[prop];
            if (rfxtypes.test(value)) {
              delete props[prop];
              toggle = toggle || value === "toggle";
              if (value === (hidden ? "hide" : "show")) {
                if (value === "show" && dataShow && dataShow[prop] !== void 0) {
                  hidden = true;
                } else {
                  continue;
                }
              }
              orig[prop] = dataShow && dataShow[prop] || jQuery2.style(elem, prop);
            }
          }
          propTween = !jQuery2.isEmptyObject(props);
          if (!propTween && jQuery2.isEmptyObject(orig)) {
            return;
          }
          if (isBox && elem.nodeType === 1) {
            opts.overflow = [style.overflow, style.overflowX, style.overflowY];
            restoreDisplay = dataShow && dataShow.display;
            if (restoreDisplay == null) {
              restoreDisplay = dataPriv.get(elem, "display");
            }
            display = jQuery2.css(elem, "display");
            if (display === "none") {
              if (restoreDisplay) {
                display = restoreDisplay;
              } else {
                showHide([elem], true);
                restoreDisplay = elem.style.display || restoreDisplay;
                display = jQuery2.css(elem, "display");
                showHide([elem]);
              }
            }
            if (display === "inline" || display === "inline-block" && restoreDisplay != null) {
              if (jQuery2.css(elem, "float") === "none") {
                if (!propTween) {
                  anim.done(function() {
                    style.display = restoreDisplay;
                  });
                  if (restoreDisplay == null) {
                    display = style.display;
                    restoreDisplay = display === "none" ? "" : display;
                  }
                }
                style.display = "inline-block";
              }
            }
          }
          if (opts.overflow) {
            style.overflow = "hidden";
            anim.always(function() {
              style.overflow = opts.overflow[0];
              style.overflowX = opts.overflow[1];
              style.overflowY = opts.overflow[2];
            });
          }
          propTween = false;
          for (prop in orig) {
            if (!propTween) {
              if (dataShow) {
                if ("hidden" in dataShow) {
                  hidden = dataShow.hidden;
                }
              } else {
                dataShow = dataPriv.access(elem, "fxshow", { display: restoreDisplay });
              }
              if (toggle) {
                dataShow.hidden = !hidden;
              }
              if (hidden) {
                showHide([elem], true);
              }
              anim.done(function() {
                if (!hidden) {
                  showHide([elem]);
                }
                dataPriv.remove(elem, "fxshow");
                for (prop in orig) {
                  jQuery2.style(elem, prop, orig[prop]);
                }
              });
            }
            propTween = createTween(hidden ? dataShow[prop] : 0, prop, anim);
            if (!(prop in dataShow)) {
              dataShow[prop] = propTween.start;
              if (hidden) {
                propTween.end = propTween.start;
                propTween.start = 0;
              }
            }
          }
        }
        function propFilter(props, specialEasing) {
          var index, name, easing, value, hooks;
          for (index in props) {
            name = camelCase(index);
            easing = specialEasing[name];
            value = props[index];
            if (Array.isArray(value)) {
              easing = value[1];
              value = props[index] = value[0];
            }
            if (index !== name) {
              props[name] = value;
              delete props[index];
            }
            hooks = jQuery2.cssHooks[name];
            if (hooks && "expand" in hooks) {
              value = hooks.expand(value);
              delete props[name];
              for (index in value) {
                if (!(index in props)) {
                  props[index] = value[index];
                  specialEasing[index] = easing;
                }
              }
            } else {
              specialEasing[name] = easing;
            }
          }
        }
        function Animation(elem, properties, options) {
          var result, stopped, index = 0, length = Animation.prefilters.length, deferred = jQuery2.Deferred().always(function() {
            delete tick.elem;
          }), tick = function() {
            if (stopped) {
              return false;
            }
            var currentTime = fxNow || createFxNow(), remaining = Math.max(0, animation.startTime + animation.duration - currentTime), temp = remaining / animation.duration || 0, percent = 1 - temp, index2 = 0, length2 = animation.tweens.length;
            for (; index2 < length2; index2++) {
              animation.tweens[index2].run(percent);
            }
            deferred.notifyWith(elem, [animation, percent, remaining]);
            if (percent < 1 && length2) {
              return remaining;
            }
            if (!length2) {
              deferred.notifyWith(elem, [animation, 1, 0]);
            }
            deferred.resolveWith(elem, [animation]);
            return false;
          }, animation = deferred.promise({
            elem,
            props: jQuery2.extend({}, properties),
            opts: jQuery2.extend(true, {
              specialEasing: {},
              easing: jQuery2.easing._default
            }, options),
            originalProperties: properties,
            originalOptions: options,
            startTime: fxNow || createFxNow(),
            duration: options.duration,
            tweens: [],
            createTween: function(prop, end) {
              var tween = jQuery2.Tween(
                elem,
                animation.opts,
                prop,
                end,
                animation.opts.specialEasing[prop] || animation.opts.easing
              );
              animation.tweens.push(tween);
              return tween;
            },
            stop: function(gotoEnd) {
              var index2 = 0, length2 = gotoEnd ? animation.tweens.length : 0;
              if (stopped) {
                return this;
              }
              stopped = true;
              for (; index2 < length2; index2++) {
                animation.tweens[index2].run(1);
              }
              if (gotoEnd) {
                deferred.notifyWith(elem, [animation, 1, 0]);
                deferred.resolveWith(elem, [animation, gotoEnd]);
              } else {
                deferred.rejectWith(elem, [animation, gotoEnd]);
              }
              return this;
            }
          }), props = animation.props;
          propFilter(props, animation.opts.specialEasing);
          for (; index < length; index++) {
            result = Animation.prefilters[index].call(animation, elem, props, animation.opts);
            if (result) {
              if (isFunction(result.stop)) {
                jQuery2._queueHooks(animation.elem, animation.opts.queue).stop = result.stop.bind(result);
              }
              return result;
            }
          }
          jQuery2.map(props, createTween, animation);
          if (isFunction(animation.opts.start)) {
            animation.opts.start.call(elem, animation);
          }
          animation.progress(animation.opts.progress).done(animation.opts.done, animation.opts.complete).fail(animation.opts.fail).always(animation.opts.always);
          jQuery2.fx.timer(
            jQuery2.extend(tick, {
              elem,
              anim: animation,
              queue: animation.opts.queue
            })
          );
          return animation;
        }
        jQuery2.Animation = jQuery2.extend(Animation, {
          tweeners: {
            "*": [function(prop, value) {
              var tween = this.createTween(prop, value);
              adjustCSS(tween.elem, prop, rcssNum.exec(value), tween);
              return tween;
            }]
          },
          tweener: function(props, callback) {
            if (isFunction(props)) {
              callback = props;
              props = ["*"];
            } else {
              props = props.match(rnothtmlwhite);
            }
            var prop, index = 0, length = props.length;
            for (; index < length; index++) {
              prop = props[index];
              Animation.tweeners[prop] = Animation.tweeners[prop] || [];
              Animation.tweeners[prop].unshift(callback);
            }
          },
          prefilters: [defaultPrefilter],
          prefilter: function(callback, prepend) {
            if (prepend) {
              Animation.prefilters.unshift(callback);
            } else {
              Animation.prefilters.push(callback);
            }
          }
        });
        jQuery2.speed = function(speed, easing, fn) {
          var opt = speed && typeof speed === "object" ? jQuery2.extend({}, speed) : {
            complete: fn || !fn && easing || isFunction(speed) && speed,
            duration: speed,
            easing: fn && easing || easing && !isFunction(easing) && easing
          };
          if (jQuery2.fx.off) {
            opt.duration = 0;
          } else {
            if (typeof opt.duration !== "number") {
              if (opt.duration in jQuery2.fx.speeds) {
                opt.duration = jQuery2.fx.speeds[opt.duration];
              } else {
                opt.duration = jQuery2.fx.speeds._default;
              }
            }
          }
          if (opt.queue == null || opt.queue === true) {
            opt.queue = "fx";
          }
          opt.old = opt.complete;
          opt.complete = function() {
            if (isFunction(opt.old)) {
              opt.old.call(this);
            }
            if (opt.queue) {
              jQuery2.dequeue(this, opt.queue);
            }
          };
          return opt;
        };
        jQuery2.fn.extend({
          fadeTo: function(speed, to, easing, callback) {
            return this.filter(isHiddenWithinTree).css("opacity", 0).show().end().animate({ opacity: to }, speed, easing, callback);
          },
          animate: function(prop, speed, easing, callback) {
            var empty = jQuery2.isEmptyObject(prop), optall = jQuery2.speed(speed, easing, callback), doAnimation = function() {
              var anim = Animation(this, jQuery2.extend({}, prop), optall);
              if (empty || dataPriv.get(this, "finish")) {
                anim.stop(true);
              }
            };
            doAnimation.finish = doAnimation;
            return empty || optall.queue === false ? this.each(doAnimation) : this.queue(optall.queue, doAnimation);
          },
          stop: function(type, clearQueue, gotoEnd) {
            var stopQueue = function(hooks) {
              var stop = hooks.stop;
              delete hooks.stop;
              stop(gotoEnd);
            };
            if (typeof type !== "string") {
              gotoEnd = clearQueue;
              clearQueue = type;
              type = void 0;
            }
            if (clearQueue) {
              this.queue(type || "fx", []);
            }
            return this.each(function() {
              var dequeue = true, index = type != null && type + "queueHooks", timers = jQuery2.timers, data = dataPriv.get(this);
              if (index) {
                if (data[index] && data[index].stop) {
                  stopQueue(data[index]);
                }
              } else {
                for (index in data) {
                  if (data[index] && data[index].stop && rrun.test(index)) {
                    stopQueue(data[index]);
                  }
                }
              }
              for (index = timers.length; index--; ) {
                if (timers[index].elem === this && (type == null || timers[index].queue === type)) {
                  timers[index].anim.stop(gotoEnd);
                  dequeue = false;
                  timers.splice(index, 1);
                }
              }
              if (dequeue || !gotoEnd) {
                jQuery2.dequeue(this, type);
              }
            });
          },
          finish: function(type) {
            if (type !== false) {
              type = type || "fx";
            }
            return this.each(function() {
              var index, data = dataPriv.get(this), queue = data[type + "queue"], hooks = data[type + "queueHooks"], timers = jQuery2.timers, length = queue ? queue.length : 0;
              data.finish = true;
              jQuery2.queue(this, type, []);
              if (hooks && hooks.stop) {
                hooks.stop.call(this, true);
              }
              for (index = timers.length; index--; ) {
                if (timers[index].elem === this && timers[index].queue === type) {
                  timers[index].anim.stop(true);
                  timers.splice(index, 1);
                }
              }
              for (index = 0; index < length; index++) {
                if (queue[index] && queue[index].finish) {
                  queue[index].finish.call(this);
                }
              }
              delete data.finish;
            });
          }
        });
        jQuery2.each(["toggle", "show", "hide"], function(_i, name) {
          var cssFn = jQuery2.fn[name];
          jQuery2.fn[name] = function(speed, easing, callback) {
            return speed == null || typeof speed === "boolean" ? cssFn.apply(this, arguments) : this.animate(genFx(name, true), speed, easing, callback);
          };
        });
        jQuery2.each({
          slideDown: genFx("show"),
          slideUp: genFx("hide"),
          slideToggle: genFx("toggle"),
          fadeIn: { opacity: "show" },
          fadeOut: { opacity: "hide" },
          fadeToggle: { opacity: "toggle" }
        }, function(name, props) {
          jQuery2.fn[name] = function(speed, easing, callback) {
            return this.animate(props, speed, easing, callback);
          };
        });
        jQuery2.timers = [];
        jQuery2.fx.tick = function() {
          var timer, i = 0, timers = jQuery2.timers;
          fxNow = Date.now();
          for (; i < timers.length; i++) {
            timer = timers[i];
            if (!timer() && timers[i] === timer) {
              timers.splice(i--, 1);
            }
          }
          if (!timers.length) {
            jQuery2.fx.stop();
          }
          fxNow = void 0;
        };
        jQuery2.fx.timer = function(timer) {
          jQuery2.timers.push(timer);
          jQuery2.fx.start();
        };
        jQuery2.fx.interval = 13;
        jQuery2.fx.start = function() {
          if (inProgress) {
            return;
          }
          inProgress = true;
          schedule();
        };
        jQuery2.fx.stop = function() {
          inProgress = null;
        };
        jQuery2.fx.speeds = {
          slow: 600,
          fast: 200,
          // Default speed
          _default: 400
        };
        jQuery2.fn.delay = function(time, type) {
          time = jQuery2.fx ? jQuery2.fx.speeds[time] || time : time;
          type = type || "fx";
          return this.queue(type, function(next, hooks) {
            var timeout = window2.setTimeout(next, time);
            hooks.stop = function() {
              window2.clearTimeout(timeout);
            };
          });
        };
        (function() {
          var input = document2.createElement("input"), select = document2.createElement("select"), opt = select.appendChild(document2.createElement("option"));
          input.type = "checkbox";
          support.checkOn = input.value !== "";
          support.optSelected = opt.selected;
          input = document2.createElement("input");
          input.value = "t";
          input.type = "radio";
          support.radioValue = input.value === "t";
        })();
        var boolHook, attrHandle = jQuery2.expr.attrHandle;
        jQuery2.fn.extend({
          attr: function(name, value) {
            return access(this, jQuery2.attr, name, value, arguments.length > 1);
          },
          removeAttr: function(name) {
            return this.each(function() {
              jQuery2.removeAttr(this, name);
            });
          }
        });
        jQuery2.extend({
          attr: function(elem, name, value) {
            var ret, hooks, nType = elem.nodeType;
            if (nType === 3 || nType === 8 || nType === 2) {
              return;
            }
            if (typeof elem.getAttribute === "undefined") {
              return jQuery2.prop(elem, name, value);
            }
            if (nType !== 1 || !jQuery2.isXMLDoc(elem)) {
              hooks = jQuery2.attrHooks[name.toLowerCase()] || (jQuery2.expr.match.bool.test(name) ? boolHook : void 0);
            }
            if (value !== void 0) {
              if (value === null) {
                jQuery2.removeAttr(elem, name);
                return;
              }
              if (hooks && "set" in hooks && (ret = hooks.set(elem, value, name)) !== void 0) {
                return ret;
              }
              elem.setAttribute(name, value + "");
              return value;
            }
            if (hooks && "get" in hooks && (ret = hooks.get(elem, name)) !== null) {
              return ret;
            }
            ret = jQuery2.find.attr(elem, name);
            return ret == null ? void 0 : ret;
          },
          attrHooks: {
            type: {
              set: function(elem, value) {
                if (!support.radioValue && value === "radio" && nodeName(elem, "input")) {
                  var val = elem.value;
                  elem.setAttribute("type", value);
                  if (val) {
                    elem.value = val;
                  }
                  return value;
                }
              }
            }
          },
          removeAttr: function(elem, value) {
            var name, i = 0, attrNames = value && value.match(rnothtmlwhite);
            if (attrNames && elem.nodeType === 1) {
              while (name = attrNames[i++]) {
                elem.removeAttribute(name);
              }
            }
          }
        });
        boolHook = {
          set: function(elem, value, name) {
            if (value === false) {
              jQuery2.removeAttr(elem, name);
            } else {
              elem.setAttribute(name, name);
            }
            return name;
          }
        };
        jQuery2.each(jQuery2.expr.match.bool.source.match(/\w+/g), function(_i, name) {
          var getter = attrHandle[name] || jQuery2.find.attr;
          attrHandle[name] = function(elem, name2, isXML) {
            var ret, handle, lowercaseName = name2.toLowerCase();
            if (!isXML) {
              handle = attrHandle[lowercaseName];
              attrHandle[lowercaseName] = ret;
              ret = getter(elem, name2, isXML) != null ? lowercaseName : null;
              attrHandle[lowercaseName] = handle;
            }
            return ret;
          };
        });
        var rfocusable = /^(?:input|select|textarea|button)$/i, rclickable = /^(?:a|area)$/i;
        jQuery2.fn.extend({
          prop: function(name, value) {
            return access(this, jQuery2.prop, name, value, arguments.length > 1);
          },
          removeProp: function(name) {
            return this.each(function() {
              delete this[jQuery2.propFix[name] || name];
            });
          }
        });
        jQuery2.extend({
          prop: function(elem, name, value) {
            var ret, hooks, nType = elem.nodeType;
            if (nType === 3 || nType === 8 || nType === 2) {
              return;
            }
            if (nType !== 1 || !jQuery2.isXMLDoc(elem)) {
              name = jQuery2.propFix[name] || name;
              hooks = jQuery2.propHooks[name];
            }
            if (value !== void 0) {
              if (hooks && "set" in hooks && (ret = hooks.set(elem, value, name)) !== void 0) {
                return ret;
              }
              return elem[name] = value;
            }
            if (hooks && "get" in hooks && (ret = hooks.get(elem, name)) !== null) {
              return ret;
            }
            return elem[name];
          },
          propHooks: {
            tabIndex: {
              get: function(elem) {
                var tabindex = jQuery2.find.attr(elem, "tabindex");
                if (tabindex) {
                  return parseInt(tabindex, 10);
                }
                if (rfocusable.test(elem.nodeName) || rclickable.test(elem.nodeName) && elem.href) {
                  return 0;
                }
                return -1;
              }
            }
          },
          propFix: {
            "for": "htmlFor",
            "class": "className"
          }
        });
        if (!support.optSelected) {
          jQuery2.propHooks.selected = {
            get: function(elem) {
              var parent = elem.parentNode;
              if (parent && parent.parentNode) {
                parent.parentNode.selectedIndex;
              }
              return null;
            },
            set: function(elem) {
              var parent = elem.parentNode;
              if (parent) {
                parent.selectedIndex;
                if (parent.parentNode) {
                  parent.parentNode.selectedIndex;
                }
              }
            }
          };
        }
        jQuery2.each([
          "tabIndex",
          "readOnly",
          "maxLength",
          "cellSpacing",
          "cellPadding",
          "rowSpan",
          "colSpan",
          "useMap",
          "frameBorder",
          "contentEditable"
        ], function() {
          jQuery2.propFix[this.toLowerCase()] = this;
        });
        function stripAndCollapse(value) {
          var tokens = value.match(rnothtmlwhite) || [];
          return tokens.join(" ");
        }
        function getClass(elem) {
          return elem.getAttribute && elem.getAttribute("class") || "";
        }
        function classesToArray(value) {
          if (Array.isArray(value)) {
            return value;
          }
          if (typeof value === "string") {
            return value.match(rnothtmlwhite) || [];
          }
          return [];
        }
        jQuery2.fn.extend({
          addClass: function(value) {
            var classNames, cur, curValue, className, i, finalValue;
            if (isFunction(value)) {
              return this.each(function(j) {
                jQuery2(this).addClass(value.call(this, j, getClass(this)));
              });
            }
            classNames = classesToArray(value);
            if (classNames.length) {
              return this.each(function() {
                curValue = getClass(this);
                cur = this.nodeType === 1 && " " + stripAndCollapse(curValue) + " ";
                if (cur) {
                  for (i = 0; i < classNames.length; i++) {
                    className = classNames[i];
                    if (cur.indexOf(" " + className + " ") < 0) {
                      cur += className + " ";
                    }
                  }
                  finalValue = stripAndCollapse(cur);
                  if (curValue !== finalValue) {
                    this.setAttribute("class", finalValue);
                  }
                }
              });
            }
            return this;
          },
          removeClass: function(value) {
            var classNames, cur, curValue, className, i, finalValue;
            if (isFunction(value)) {
              return this.each(function(j) {
                jQuery2(this).removeClass(value.call(this, j, getClass(this)));
              });
            }
            if (!arguments.length) {
              return this.attr("class", "");
            }
            classNames = classesToArray(value);
            if (classNames.length) {
              return this.each(function() {
                curValue = getClass(this);
                cur = this.nodeType === 1 && " " + stripAndCollapse(curValue) + " ";
                if (cur) {
                  for (i = 0; i < classNames.length; i++) {
                    className = classNames[i];
                    while (cur.indexOf(" " + className + " ") > -1) {
                      cur = cur.replace(" " + className + " ", " ");
                    }
                  }
                  finalValue = stripAndCollapse(cur);
                  if (curValue !== finalValue) {
                    this.setAttribute("class", finalValue);
                  }
                }
              });
            }
            return this;
          },
          toggleClass: function(value, stateVal) {
            var classNames, className, i, self, type = typeof value, isValidValue = type === "string" || Array.isArray(value);
            if (isFunction(value)) {
              return this.each(function(i2) {
                jQuery2(this).toggleClass(
                  value.call(this, i2, getClass(this), stateVal),
                  stateVal
                );
              });
            }
            if (typeof stateVal === "boolean" && isValidValue) {
              return stateVal ? this.addClass(value) : this.removeClass(value);
            }
            classNames = classesToArray(value);
            return this.each(function() {
              if (isValidValue) {
                self = jQuery2(this);
                for (i = 0; i < classNames.length; i++) {
                  className = classNames[i];
                  if (self.hasClass(className)) {
                    self.removeClass(className);
                  } else {
                    self.addClass(className);
                  }
                }
              } else if (value === void 0 || type === "boolean") {
                className = getClass(this);
                if (className) {
                  dataPriv.set(this, "__className__", className);
                }
                if (this.setAttribute) {
                  this.setAttribute(
                    "class",
                    className || value === false ? "" : dataPriv.get(this, "__className__") || ""
                  );
                }
              }
            });
          },
          hasClass: function(selector) {
            var className, elem, i = 0;
            className = " " + selector + " ";
            while (elem = this[i++]) {
              if (elem.nodeType === 1 && (" " + stripAndCollapse(getClass(elem)) + " ").indexOf(className) > -1) {
                return true;
              }
            }
            return false;
          }
        });
        var rreturn = /\r/g;
        jQuery2.fn.extend({
          val: function(value) {
            var hooks, ret, valueIsFunction, elem = this[0];
            if (!arguments.length) {
              if (elem) {
                hooks = jQuery2.valHooks[elem.type] || jQuery2.valHooks[elem.nodeName.toLowerCase()];
                if (hooks && "get" in hooks && (ret = hooks.get(elem, "value")) !== void 0) {
                  return ret;
                }
                ret = elem.value;
                if (typeof ret === "string") {
                  return ret.replace(rreturn, "");
                }
                return ret == null ? "" : ret;
              }
              return;
            }
            valueIsFunction = isFunction(value);
            return this.each(function(i) {
              var val;
              if (this.nodeType !== 1) {
                return;
              }
              if (valueIsFunction) {
                val = value.call(this, i, jQuery2(this).val());
              } else {
                val = value;
              }
              if (val == null) {
                val = "";
              } else if (typeof val === "number") {
                val += "";
              } else if (Array.isArray(val)) {
                val = jQuery2.map(val, function(value2) {
                  return value2 == null ? "" : value2 + "";
                });
              }
              hooks = jQuery2.valHooks[this.type] || jQuery2.valHooks[this.nodeName.toLowerCase()];
              if (!hooks || !("set" in hooks) || hooks.set(this, val, "value") === void 0) {
                this.value = val;
              }
            });
          }
        });
        jQuery2.extend({
          valHooks: {
            option: {
              get: function(elem) {
                var val = jQuery2.find.attr(elem, "value");
                return val != null ? val : (
                  // Support: IE <=10 - 11 only
                  // option.text throws exceptions (trac-14686, trac-14858)
                  // Strip and collapse whitespace
                  // https://html.spec.whatwg.org/#strip-and-collapse-whitespace
                  stripAndCollapse(jQuery2.text(elem))
                );
              }
            },
            select: {
              get: function(elem) {
                var value, option, i, options = elem.options, index = elem.selectedIndex, one = elem.type === "select-one", values = one ? null : [], max = one ? index + 1 : options.length;
                if (index < 0) {
                  i = max;
                } else {
                  i = one ? index : 0;
                }
                for (; i < max; i++) {
                  option = options[i];
                  if ((option.selected || i === index) && // Don't return options that are disabled or in a disabled optgroup
                  !option.disabled && (!option.parentNode.disabled || !nodeName(option.parentNode, "optgroup"))) {
                    value = jQuery2(option).val();
                    if (one) {
                      return value;
                    }
                    values.push(value);
                  }
                }
                return values;
              },
              set: function(elem, value) {
                var optionSet, option, options = elem.options, values = jQuery2.makeArray(value), i = options.length;
                while (i--) {
                  option = options[i];
                  if (option.selected = jQuery2.inArray(jQuery2.valHooks.option.get(option), values) > -1) {
                    optionSet = true;
                  }
                }
                if (!optionSet) {
                  elem.selectedIndex = -1;
                }
                return values;
              }
            }
          }
        });
        jQuery2.each(["radio", "checkbox"], function() {
          jQuery2.valHooks[this] = {
            set: function(elem, value) {
              if (Array.isArray(value)) {
                return elem.checked = jQuery2.inArray(jQuery2(elem).val(), value) > -1;
              }
            }
          };
          if (!support.checkOn) {
            jQuery2.valHooks[this].get = function(elem) {
              return elem.getAttribute("value") === null ? "on" : elem.value;
            };
          }
        });
        var location = window2.location;
        var nonce = { guid: Date.now() };
        var rquery = /\?/;
        jQuery2.parseXML = function(data) {
          var xml, parserErrorElem;
          if (!data || typeof data !== "string") {
            return null;
          }
          try {
            xml = new window2.DOMParser().parseFromString(data, "text/xml");
          } catch (e) {
          }
          parserErrorElem = xml && xml.getElementsByTagName("parsererror")[0];
          if (!xml || parserErrorElem) {
            jQuery2.error("Invalid XML: " + (parserErrorElem ? jQuery2.map(parserErrorElem.childNodes, function(el) {
              return el.textContent;
            }).join("\n") : data));
          }
          return xml;
        };
        var rfocusMorph = /^(?:focusinfocus|focusoutblur)$/, stopPropagationCallback = function(e) {
          e.stopPropagation();
        };
        jQuery2.extend(jQuery2.event, {
          trigger: function(event, data, elem, onlyHandlers) {
            var i, cur, tmp, bubbleType, ontype, handle, special, lastElement, eventPath = [elem || document2], type = hasOwn.call(event, "type") ? event.type : event, namespaces = hasOwn.call(event, "namespace") ? event.namespace.split(".") : [];
            cur = lastElement = tmp = elem = elem || document2;
            if (elem.nodeType === 3 || elem.nodeType === 8) {
              return;
            }
            if (rfocusMorph.test(type + jQuery2.event.triggered)) {
              return;
            }
            if (type.indexOf(".") > -1) {
              namespaces = type.split(".");
              type = namespaces.shift();
              namespaces.sort();
            }
            ontype = type.indexOf(":") < 0 && "on" + type;
            event = event[jQuery2.expando] ? event : new jQuery2.Event(type, typeof event === "object" && event);
            event.isTrigger = onlyHandlers ? 2 : 3;
            event.namespace = namespaces.join(".");
            event.rnamespace = event.namespace ? new RegExp("(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)") : null;
            event.result = void 0;
            if (!event.target) {
              event.target = elem;
            }
            data = data == null ? [event] : jQuery2.makeArray(data, [event]);
            special = jQuery2.event.special[type] || {};
            if (!onlyHandlers && special.trigger && special.trigger.apply(elem, data) === false) {
              return;
            }
            if (!onlyHandlers && !special.noBubble && !isWindow(elem)) {
              bubbleType = special.delegateType || type;
              if (!rfocusMorph.test(bubbleType + type)) {
                cur = cur.parentNode;
              }
              for (; cur; cur = cur.parentNode) {
                eventPath.push(cur);
                tmp = cur;
              }
              if (tmp === (elem.ownerDocument || document2)) {
                eventPath.push(tmp.defaultView || tmp.parentWindow || window2);
              }
            }
            i = 0;
            while ((cur = eventPath[i++]) && !event.isPropagationStopped()) {
              lastElement = cur;
              event.type = i > 1 ? bubbleType : special.bindType || type;
              handle = (dataPriv.get(cur, "events") || /* @__PURE__ */ Object.create(null))[event.type] && dataPriv.get(cur, "handle");
              if (handle) {
                handle.apply(cur, data);
              }
              handle = ontype && cur[ontype];
              if (handle && handle.apply && acceptData(cur)) {
                event.result = handle.apply(cur, data);
                if (event.result === false) {
                  event.preventDefault();
                }
              }
            }
            event.type = type;
            if (!onlyHandlers && !event.isDefaultPrevented()) {
              if ((!special._default || special._default.apply(eventPath.pop(), data) === false) && acceptData(elem)) {
                if (ontype && isFunction(elem[type]) && !isWindow(elem)) {
                  tmp = elem[ontype];
                  if (tmp) {
                    elem[ontype] = null;
                  }
                  jQuery2.event.triggered = type;
                  if (event.isPropagationStopped()) {
                    lastElement.addEventListener(type, stopPropagationCallback);
                  }
                  elem[type]();
                  if (event.isPropagationStopped()) {
                    lastElement.removeEventListener(type, stopPropagationCallback);
                  }
                  jQuery2.event.triggered = void 0;
                  if (tmp) {
                    elem[ontype] = tmp;
                  }
                }
              }
            }
            return event.result;
          },
          // Piggyback on a donor event to simulate a different one
          // Used only for `focus(in | out)` events
          simulate: function(type, elem, event) {
            var e = jQuery2.extend(
              new jQuery2.Event(),
              event,
              {
                type,
                isSimulated: true
              }
            );
            jQuery2.event.trigger(e, null, elem);
          }
        });
        jQuery2.fn.extend({
          trigger: function(type, data) {
            return this.each(function() {
              jQuery2.event.trigger(type, data, this);
            });
          },
          triggerHandler: function(type, data) {
            var elem = this[0];
            if (elem) {
              return jQuery2.event.trigger(type, data, elem, true);
            }
          }
        });
        var rbracket = /\[\]$/, rCRLF = /\r?\n/g, rsubmitterTypes = /^(?:submit|button|image|reset|file)$/i, rsubmittable = /^(?:input|select|textarea|keygen)/i;
        function buildParams(prefix, obj, traditional, add) {
          var name;
          if (Array.isArray(obj)) {
            jQuery2.each(obj, function(i, v) {
              if (traditional || rbracket.test(prefix)) {
                add(prefix, v);
              } else {
                buildParams(
                  prefix + "[" + (typeof v === "object" && v != null ? i : "") + "]",
                  v,
                  traditional,
                  add
                );
              }
            });
          } else if (!traditional && toType(obj) === "object") {
            for (name in obj) {
              buildParams(prefix + "[" + name + "]", obj[name], traditional, add);
            }
          } else {
            add(prefix, obj);
          }
        }
        jQuery2.param = function(a, traditional) {
          var prefix, s = [], add = function(key, valueOrFunction) {
            var value = isFunction(valueOrFunction) ? valueOrFunction() : valueOrFunction;
            s[s.length] = encodeURIComponent(key) + "=" + encodeURIComponent(value == null ? "" : value);
          };
          if (a == null) {
            return "";
          }
          if (Array.isArray(a) || a.jquery && !jQuery2.isPlainObject(a)) {
            jQuery2.each(a, function() {
              add(this.name, this.value);
            });
          } else {
            for (prefix in a) {
              buildParams(prefix, a[prefix], traditional, add);
            }
          }
          return s.join("&");
        };
        jQuery2.fn.extend({
          serialize: function() {
            return jQuery2.param(this.serializeArray());
          },
          serializeArray: function() {
            return this.map(function() {
              var elements = jQuery2.prop(this, "elements");
              return elements ? jQuery2.makeArray(elements) : this;
            }).filter(function() {
              var type = this.type;
              return this.name && !jQuery2(this).is(":disabled") && rsubmittable.test(this.nodeName) && !rsubmitterTypes.test(type) && (this.checked || !rcheckableType.test(type));
            }).map(function(_i, elem) {
              var val = jQuery2(this).val();
              if (val == null) {
                return null;
              }
              if (Array.isArray(val)) {
                return jQuery2.map(val, function(val2) {
                  return { name: elem.name, value: val2.replace(rCRLF, "\r\n") };
                });
              }
              return { name: elem.name, value: val.replace(rCRLF, "\r\n") };
            }).get();
          }
        });
        var r20 = /%20/g, rhash = /#.*$/, rantiCache = /([?&])_=[^&]*/, rheaders = /^(.*?):[ \t]*([^\r\n]*)$/mg, rlocalProtocol = /^(?:about|app|app-storage|.+-extension|file|res|widget):$/, rnoContent = /^(?:GET|HEAD)$/, rprotocol = /^\/\//, prefilters = {}, transports = {}, allTypes = "*/".concat("*"), originAnchor = document2.createElement("a");
        originAnchor.href = location.href;
        function addToPrefiltersOrTransports(structure) {
          return function(dataTypeExpression, func) {
            if (typeof dataTypeExpression !== "string") {
              func = dataTypeExpression;
              dataTypeExpression = "*";
            }
            var dataType, i = 0, dataTypes = dataTypeExpression.toLowerCase().match(rnothtmlwhite) || [];
            if (isFunction(func)) {
              while (dataType = dataTypes[i++]) {
                if (dataType[0] === "+") {
                  dataType = dataType.slice(1) || "*";
                  (structure[dataType] = structure[dataType] || []).unshift(func);
                } else {
                  (structure[dataType] = structure[dataType] || []).push(func);
                }
              }
            }
          };
        }
        function inspectPrefiltersOrTransports(structure, options, originalOptions, jqXHR) {
          var inspected = {}, seekingTransport = structure === transports;
          function inspect(dataType) {
            var selected;
            inspected[dataType] = true;
            jQuery2.each(structure[dataType] || [], function(_, prefilterOrFactory) {
              var dataTypeOrTransport = prefilterOrFactory(options, originalOptions, jqXHR);
              if (typeof dataTypeOrTransport === "string" && !seekingTransport && !inspected[dataTypeOrTransport]) {
                options.dataTypes.unshift(dataTypeOrTransport);
                inspect(dataTypeOrTransport);
                return false;
              } else if (seekingTransport) {
                return !(selected = dataTypeOrTransport);
              }
            });
            return selected;
          }
          return inspect(options.dataTypes[0]) || !inspected["*"] && inspect("*");
        }
        function ajaxExtend(target, src) {
          var key, deep, flatOptions = jQuery2.ajaxSettings.flatOptions || {};
          for (key in src) {
            if (src[key] !== void 0) {
              (flatOptions[key] ? target : deep || (deep = {}))[key] = src[key];
            }
          }
          if (deep) {
            jQuery2.extend(true, target, deep);
          }
          return target;
        }
        function ajaxHandleResponses(s, jqXHR, responses) {
          var ct, type, finalDataType, firstDataType, contents = s.contents, dataTypes = s.dataTypes;
          while (dataTypes[0] === "*") {
            dataTypes.shift();
            if (ct === void 0) {
              ct = s.mimeType || jqXHR.getResponseHeader("Content-Type");
            }
          }
          if (ct) {
            for (type in contents) {
              if (contents[type] && contents[type].test(ct)) {
                dataTypes.unshift(type);
                break;
              }
            }
          }
          if (dataTypes[0] in responses) {
            finalDataType = dataTypes[0];
          } else {
            for (type in responses) {
              if (!dataTypes[0] || s.converters[type + " " + dataTypes[0]]) {
                finalDataType = type;
                break;
              }
              if (!firstDataType) {
                firstDataType = type;
              }
            }
            finalDataType = finalDataType || firstDataType;
          }
          if (finalDataType) {
            if (finalDataType !== dataTypes[0]) {
              dataTypes.unshift(finalDataType);
            }
            return responses[finalDataType];
          }
        }
        function ajaxConvert(s, response, jqXHR, isSuccess) {
          var conv2, current, conv, tmp, prev, converters = {}, dataTypes = s.dataTypes.slice();
          if (dataTypes[1]) {
            for (conv in s.converters) {
              converters[conv.toLowerCase()] = s.converters[conv];
            }
          }
          current = dataTypes.shift();
          while (current) {
            if (s.responseFields[current]) {
              jqXHR[s.responseFields[current]] = response;
            }
            if (!prev && isSuccess && s.dataFilter) {
              response = s.dataFilter(response, s.dataType);
            }
            prev = current;
            current = dataTypes.shift();
            if (current) {
              if (current === "*") {
                current = prev;
              } else if (prev !== "*" && prev !== current) {
                conv = converters[prev + " " + current] || converters["* " + current];
                if (!conv) {
                  for (conv2 in converters) {
                    tmp = conv2.split(" ");
                    if (tmp[1] === current) {
                      conv = converters[prev + " " + tmp[0]] || converters["* " + tmp[0]];
                      if (conv) {
                        if (conv === true) {
                          conv = converters[conv2];
                        } else if (converters[conv2] !== true) {
                          current = tmp[0];
                          dataTypes.unshift(tmp[1]);
                        }
                        break;
                      }
                    }
                  }
                }
                if (conv !== true) {
                  if (conv && s.throws) {
                    response = conv(response);
                  } else {
                    try {
                      response = conv(response);
                    } catch (e) {
                      return {
                        state: "parsererror",
                        error: conv ? e : "No conversion from " + prev + " to " + current
                      };
                    }
                  }
                }
              }
            }
          }
          return { state: "success", data: response };
        }
        jQuery2.extend({
          // Counter for holding the number of active queries
          active: 0,
          // Last-Modified header cache for next request
          lastModified: {},
          etag: {},
          ajaxSettings: {
            url: location.href,
            type: "GET",
            isLocal: rlocalProtocol.test(location.protocol),
            global: true,
            processData: true,
            async: true,
            contentType: "application/x-www-form-urlencoded; charset=UTF-8",
            /*
            timeout: 0,
            data: null,
            dataType: null,
            username: null,
            password: null,
            cache: null,
            throws: false,
            traditional: false,
            headers: {},
            */
            accepts: {
              "*": allTypes,
              text: "text/plain",
              html: "text/html",
              xml: "application/xml, text/xml",
              json: "application/json, text/javascript"
            },
            contents: {
              xml: /\bxml\b/,
              html: /\bhtml/,
              json: /\bjson\b/
            },
            responseFields: {
              xml: "responseXML",
              text: "responseText",
              json: "responseJSON"
            },
            // Data converters
            // Keys separate source (or catchall "*") and destination types with a single space
            converters: {
              // Convert anything to text
              "* text": String,
              // Text to html (true = no transformation)
              "text html": true,
              // Evaluate text as a json expression
              "text json": JSON.parse,
              // Parse text as xml
              "text xml": jQuery2.parseXML
            },
            // For options that shouldn't be deep extended:
            // you can add your own custom options here if
            // and when you create one that shouldn't be
            // deep extended (see ajaxExtend)
            flatOptions: {
              url: true,
              context: true
            }
          },
          // Creates a full fledged settings object into target
          // with both ajaxSettings and settings fields.
          // If target is omitted, writes into ajaxSettings.
          ajaxSetup: function(target, settings) {
            return settings ? (
              // Building a settings object
              ajaxExtend(ajaxExtend(target, jQuery2.ajaxSettings), settings)
            ) : (
              // Extending ajaxSettings
              ajaxExtend(jQuery2.ajaxSettings, target)
            );
          },
          ajaxPrefilter: addToPrefiltersOrTransports(prefilters),
          ajaxTransport: addToPrefiltersOrTransports(transports),
          // Main method
          ajax: function(url, options) {
            if (typeof url === "object") {
              options = url;
              url = void 0;
            }
            options = options || {};
            var transport, cacheURL, responseHeadersString, responseHeaders, timeoutTimer, urlAnchor, completed2, fireGlobals, i, uncached, s = jQuery2.ajaxSetup({}, options), callbackContext = s.context || s, globalEventContext = s.context && (callbackContext.nodeType || callbackContext.jquery) ? jQuery2(callbackContext) : jQuery2.event, deferred = jQuery2.Deferred(), completeDeferred = jQuery2.Callbacks("once memory"), statusCode = s.statusCode || {}, requestHeaders = {}, requestHeadersNames = {}, strAbort = "canceled", jqXHR = {
              readyState: 0,
              // Builds headers hashtable if needed
              getResponseHeader: function(key) {
                var match;
                if (completed2) {
                  if (!responseHeaders) {
                    responseHeaders = {};
                    while (match = rheaders.exec(responseHeadersString)) {
                      responseHeaders[match[1].toLowerCase() + " "] = (responseHeaders[match[1].toLowerCase() + " "] || []).concat(match[2]);
                    }
                  }
                  match = responseHeaders[key.toLowerCase() + " "];
                }
                return match == null ? null : match.join(", ");
              },
              // Raw string
              getAllResponseHeaders: function() {
                return completed2 ? responseHeadersString : null;
              },
              // Caches the header
              setRequestHeader: function(name, value) {
                if (completed2 == null) {
                  name = requestHeadersNames[name.toLowerCase()] = requestHeadersNames[name.toLowerCase()] || name;
                  requestHeaders[name] = value;
                }
                return this;
              },
              // Overrides response content-type header
              overrideMimeType: function(type) {
                if (completed2 == null) {
                  s.mimeType = type;
                }
                return this;
              },
              // Status-dependent callbacks
              statusCode: function(map) {
                var code;
                if (map) {
                  if (completed2) {
                    jqXHR.always(map[jqXHR.status]);
                  } else {
                    for (code in map) {
                      statusCode[code] = [statusCode[code], map[code]];
                    }
                  }
                }
                return this;
              },
              // Cancel the request
              abort: function(statusText) {
                var finalText = statusText || strAbort;
                if (transport) {
                  transport.abort(finalText);
                }
                done(0, finalText);
                return this;
              }
            };
            deferred.promise(jqXHR);
            s.url = ((url || s.url || location.href) + "").replace(rprotocol, location.protocol + "//");
            s.type = options.method || options.type || s.method || s.type;
            s.dataTypes = (s.dataType || "*").toLowerCase().match(rnothtmlwhite) || [""];
            if (s.crossDomain == null) {
              urlAnchor = document2.createElement("a");
              try {
                urlAnchor.href = s.url;
                urlAnchor.href = urlAnchor.href;
                s.crossDomain = originAnchor.protocol + "//" + originAnchor.host !== urlAnchor.protocol + "//" + urlAnchor.host;
              } catch (e) {
                s.crossDomain = true;
              }
            }
            if (s.data && s.processData && typeof s.data !== "string") {
              s.data = jQuery2.param(s.data, s.traditional);
            }
            inspectPrefiltersOrTransports(prefilters, s, options, jqXHR);
            if (completed2) {
              return jqXHR;
            }
            fireGlobals = jQuery2.event && s.global;
            if (fireGlobals && jQuery2.active++ === 0) {
              jQuery2.event.trigger("ajaxStart");
            }
            s.type = s.type.toUpperCase();
            s.hasContent = !rnoContent.test(s.type);
            cacheURL = s.url.replace(rhash, "");
            if (!s.hasContent) {
              uncached = s.url.slice(cacheURL.length);
              if (s.data && (s.processData || typeof s.data === "string")) {
                cacheURL += (rquery.test(cacheURL) ? "&" : "?") + s.data;
                delete s.data;
              }
              if (s.cache === false) {
                cacheURL = cacheURL.replace(rantiCache, "$1");
                uncached = (rquery.test(cacheURL) ? "&" : "?") + "_=" + nonce.guid++ + uncached;
              }
              s.url = cacheURL + uncached;
            } else if (s.data && s.processData && (s.contentType || "").indexOf("application/x-www-form-urlencoded") === 0) {
              s.data = s.data.replace(r20, "+");
            }
            if (s.ifModified) {
              if (jQuery2.lastModified[cacheURL]) {
                jqXHR.setRequestHeader("If-Modified-Since", jQuery2.lastModified[cacheURL]);
              }
              if (jQuery2.etag[cacheURL]) {
                jqXHR.setRequestHeader("If-None-Match", jQuery2.etag[cacheURL]);
              }
            }
            if (s.data && s.hasContent && s.contentType !== false || options.contentType) {
              jqXHR.setRequestHeader("Content-Type", s.contentType);
            }
            jqXHR.setRequestHeader(
              "Accept",
              s.dataTypes[0] && s.accepts[s.dataTypes[0]] ? s.accepts[s.dataTypes[0]] + (s.dataTypes[0] !== "*" ? ", " + allTypes + "; q=0.01" : "") : s.accepts["*"]
            );
            for (i in s.headers) {
              jqXHR.setRequestHeader(i, s.headers[i]);
            }
            if (s.beforeSend && (s.beforeSend.call(callbackContext, jqXHR, s) === false || completed2)) {
              return jqXHR.abort();
            }
            strAbort = "abort";
            completeDeferred.add(s.complete);
            jqXHR.done(s.success);
            jqXHR.fail(s.error);
            transport = inspectPrefiltersOrTransports(transports, s, options, jqXHR);
            if (!transport) {
              done(-1, "No Transport");
            } else {
              jqXHR.readyState = 1;
              if (fireGlobals) {
                globalEventContext.trigger("ajaxSend", [jqXHR, s]);
              }
              if (completed2) {
                return jqXHR;
              }
              if (s.async && s.timeout > 0) {
                timeoutTimer = window2.setTimeout(function() {
                  jqXHR.abort("timeout");
                }, s.timeout);
              }
              try {
                completed2 = false;
                transport.send(requestHeaders, done);
              } catch (e) {
                if (completed2) {
                  throw e;
                }
                done(-1, e);
              }
            }
            function done(status, nativeStatusText, responses, headers) {
              var isSuccess, success, error, response, modified, statusText = nativeStatusText;
              if (completed2) {
                return;
              }
              completed2 = true;
              if (timeoutTimer) {
                window2.clearTimeout(timeoutTimer);
              }
              transport = void 0;
              responseHeadersString = headers || "";
              jqXHR.readyState = status > 0 ? 4 : 0;
              isSuccess = status >= 200 && status < 300 || status === 304;
              if (responses) {
                response = ajaxHandleResponses(s, jqXHR, responses);
              }
              if (!isSuccess && jQuery2.inArray("script", s.dataTypes) > -1 && jQuery2.inArray("json", s.dataTypes) < 0) {
                s.converters["text script"] = function() {
                };
              }
              response = ajaxConvert(s, response, jqXHR, isSuccess);
              if (isSuccess) {
                if (s.ifModified) {
                  modified = jqXHR.getResponseHeader("Last-Modified");
                  if (modified) {
                    jQuery2.lastModified[cacheURL] = modified;
                  }
                  modified = jqXHR.getResponseHeader("etag");
                  if (modified) {
                    jQuery2.etag[cacheURL] = modified;
                  }
                }
                if (status === 204 || s.type === "HEAD") {
                  statusText = "nocontent";
                } else if (status === 304) {
                  statusText = "notmodified";
                } else {
                  statusText = response.state;
                  success = response.data;
                  error = response.error;
                  isSuccess = !error;
                }
              } else {
                error = statusText;
                if (status || !statusText) {
                  statusText = "error";
                  if (status < 0) {
                    status = 0;
                  }
                }
              }
              jqXHR.status = status;
              jqXHR.statusText = (nativeStatusText || statusText) + "";
              if (isSuccess) {
                deferred.resolveWith(callbackContext, [success, statusText, jqXHR]);
              } else {
                deferred.rejectWith(callbackContext, [jqXHR, statusText, error]);
              }
              jqXHR.statusCode(statusCode);
              statusCode = void 0;
              if (fireGlobals) {
                globalEventContext.trigger(
                  isSuccess ? "ajaxSuccess" : "ajaxError",
                  [jqXHR, s, isSuccess ? success : error]
                );
              }
              completeDeferred.fireWith(callbackContext, [jqXHR, statusText]);
              if (fireGlobals) {
                globalEventContext.trigger("ajaxComplete", [jqXHR, s]);
                if (!--jQuery2.active) {
                  jQuery2.event.trigger("ajaxStop");
                }
              }
            }
            return jqXHR;
          },
          getJSON: function(url, data, callback) {
            return jQuery2.get(url, data, callback, "json");
          },
          getScript: function(url, callback) {
            return jQuery2.get(url, void 0, callback, "script");
          }
        });
        jQuery2.each(["get", "post"], function(_i, method) {
          jQuery2[method] = function(url, data, callback, type) {
            if (isFunction(data)) {
              type = type || callback;
              callback = data;
              data = void 0;
            }
            return jQuery2.ajax(jQuery2.extend({
              url,
              type: method,
              dataType: type,
              data,
              success: callback
            }, jQuery2.isPlainObject(url) && url));
          };
        });
        jQuery2.ajaxPrefilter(function(s) {
          var i;
          for (i in s.headers) {
            if (i.toLowerCase() === "content-type") {
              s.contentType = s.headers[i] || "";
            }
          }
        });
        jQuery2._evalUrl = function(url, options, doc) {
          return jQuery2.ajax({
            url,
            // Make this explicit, since user can override this through ajaxSetup (trac-11264)
            type: "GET",
            dataType: "script",
            cache: true,
            async: false,
            global: false,
            // Only evaluate the response if it is successful (gh-4126)
            // dataFilter is not invoked for failure responses, so using it instead
            // of the default converter is kludgy but it works.
            converters: {
              "text script": function() {
              }
            },
            dataFilter: function(response) {
              jQuery2.globalEval(response, options, doc);
            }
          });
        };
        jQuery2.fn.extend({
          wrapAll: function(html) {
            var wrap;
            if (this[0]) {
              if (isFunction(html)) {
                html = html.call(this[0]);
              }
              wrap = jQuery2(html, this[0].ownerDocument).eq(0).clone(true);
              if (this[0].parentNode) {
                wrap.insertBefore(this[0]);
              }
              wrap.map(function() {
                var elem = this;
                while (elem.firstElementChild) {
                  elem = elem.firstElementChild;
                }
                return elem;
              }).append(this);
            }
            return this;
          },
          wrapInner: function(html) {
            if (isFunction(html)) {
              return this.each(function(i) {
                jQuery2(this).wrapInner(html.call(this, i));
              });
            }
            return this.each(function() {
              var self = jQuery2(this), contents = self.contents();
              if (contents.length) {
                contents.wrapAll(html);
              } else {
                self.append(html);
              }
            });
          },
          wrap: function(html) {
            var htmlIsFunction = isFunction(html);
            return this.each(function(i) {
              jQuery2(this).wrapAll(htmlIsFunction ? html.call(this, i) : html);
            });
          },
          unwrap: function(selector) {
            this.parent(selector).not("body").each(function() {
              jQuery2(this).replaceWith(this.childNodes);
            });
            return this;
          }
        });
        jQuery2.expr.pseudos.hidden = function(elem) {
          return !jQuery2.expr.pseudos.visible(elem);
        };
        jQuery2.expr.pseudos.visible = function(elem) {
          return !!(elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length);
        };
        jQuery2.ajaxSettings.xhr = function() {
          try {
            return new window2.XMLHttpRequest();
          } catch (e) {
          }
        };
        var xhrSuccessStatus = {
          // File protocol always yields status code 0, assume 200
          0: 200,
          // Support: IE <=9 only
          // trac-1450: sometimes IE returns 1223 when it should be 204
          1223: 204
        }, xhrSupported = jQuery2.ajaxSettings.xhr();
        support.cors = !!xhrSupported && "withCredentials" in xhrSupported;
        support.ajax = xhrSupported = !!xhrSupported;
        jQuery2.ajaxTransport(function(options) {
          var callback, errorCallback;
          if (support.cors || xhrSupported && !options.crossDomain) {
            return {
              send: function(headers, complete) {
                var i, xhr = options.xhr();
                xhr.open(
                  options.type,
                  options.url,
                  options.async,
                  options.username,
                  options.password
                );
                if (options.xhrFields) {
                  for (i in options.xhrFields) {
                    xhr[i] = options.xhrFields[i];
                  }
                }
                if (options.mimeType && xhr.overrideMimeType) {
                  xhr.overrideMimeType(options.mimeType);
                }
                if (!options.crossDomain && !headers["X-Requested-With"]) {
                  headers["X-Requested-With"] = "XMLHttpRequest";
                }
                for (i in headers) {
                  xhr.setRequestHeader(i, headers[i]);
                }
                callback = function(type) {
                  return function() {
                    if (callback) {
                      callback = errorCallback = xhr.onload = xhr.onerror = xhr.onabort = xhr.ontimeout = xhr.onreadystatechange = null;
                      if (type === "abort") {
                        xhr.abort();
                      } else if (type === "error") {
                        if (typeof xhr.status !== "number") {
                          complete(0, "error");
                        } else {
                          complete(
                            // File: protocol always yields status 0; see trac-8605, trac-14207
                            xhr.status,
                            xhr.statusText
                          );
                        }
                      } else {
                        complete(
                          xhrSuccessStatus[xhr.status] || xhr.status,
                          xhr.statusText,
                          // Support: IE <=9 only
                          // IE9 has no XHR2 but throws on binary (trac-11426)
                          // For XHR2 non-text, let the caller handle it (gh-2498)
                          (xhr.responseType || "text") !== "text" || typeof xhr.responseText !== "string" ? { binary: xhr.response } : { text: xhr.responseText },
                          xhr.getAllResponseHeaders()
                        );
                      }
                    }
                  };
                };
                xhr.onload = callback();
                errorCallback = xhr.onerror = xhr.ontimeout = callback("error");
                if (xhr.onabort !== void 0) {
                  xhr.onabort = errorCallback;
                } else {
                  xhr.onreadystatechange = function() {
                    if (xhr.readyState === 4) {
                      window2.setTimeout(function() {
                        if (callback) {
                          errorCallback();
                        }
                      });
                    }
                  };
                }
                callback = callback("abort");
                try {
                  xhr.send(options.hasContent && options.data || null);
                } catch (e) {
                  if (callback) {
                    throw e;
                  }
                }
              },
              abort: function() {
                if (callback) {
                  callback();
                }
              }
            };
          }
        });
        jQuery2.ajaxPrefilter(function(s) {
          if (s.crossDomain) {
            s.contents.script = false;
          }
        });
        jQuery2.ajaxSetup({
          accepts: {
            script: "text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"
          },
          contents: {
            script: /\b(?:java|ecma)script\b/
          },
          converters: {
            "text script": function(text) {
              jQuery2.globalEval(text);
              return text;
            }
          }
        });
        jQuery2.ajaxPrefilter("script", function(s) {
          if (s.cache === void 0) {
            s.cache = false;
          }
          if (s.crossDomain) {
            s.type = "GET";
          }
        });
        jQuery2.ajaxTransport("script", function(s) {
          if (s.crossDomain || s.scriptAttrs) {
            var script, callback;
            return {
              send: function(_, complete) {
                script = jQuery2("<script>").attr(s.scriptAttrs || {}).prop({ charset: s.scriptCharset, src: s.url }).on("load error", callback = function(evt) {
                  script.remove();
                  callback = null;
                  if (evt) {
                    complete(evt.type === "error" ? 404 : 200, evt.type);
                  }
                });
                document2.head.appendChild(script[0]);
              },
              abort: function() {
                if (callback) {
                  callback();
                }
              }
            };
          }
        });
        var oldCallbacks = [], rjsonp = /(=)\?(?=&|$)|\?\?/;
        jQuery2.ajaxSetup({
          jsonp: "callback",
          jsonpCallback: function() {
            var callback = oldCallbacks.pop() || jQuery2.expando + "_" + nonce.guid++;
            this[callback] = true;
            return callback;
          }
        });
        jQuery2.ajaxPrefilter("json jsonp", function(s, originalSettings, jqXHR) {
          var callbackName, overwritten, responseContainer, jsonProp = s.jsonp !== false && (rjsonp.test(s.url) ? "url" : typeof s.data === "string" && (s.contentType || "").indexOf("application/x-www-form-urlencoded") === 0 && rjsonp.test(s.data) && "data");
          if (jsonProp || s.dataTypes[0] === "jsonp") {
            callbackName = s.jsonpCallback = isFunction(s.jsonpCallback) ? s.jsonpCallback() : s.jsonpCallback;
            if (jsonProp) {
              s[jsonProp] = s[jsonProp].replace(rjsonp, "$1" + callbackName);
            } else if (s.jsonp !== false) {
              s.url += (rquery.test(s.url) ? "&" : "?") + s.jsonp + "=" + callbackName;
            }
            s.converters["script json"] = function() {
              if (!responseContainer) {
                jQuery2.error(callbackName + " was not called");
              }
              return responseContainer[0];
            };
            s.dataTypes[0] = "json";
            overwritten = window2[callbackName];
            window2[callbackName] = function() {
              responseContainer = arguments;
            };
            jqXHR.always(function() {
              if (overwritten === void 0) {
                jQuery2(window2).removeProp(callbackName);
              } else {
                window2[callbackName] = overwritten;
              }
              if (s[callbackName]) {
                s.jsonpCallback = originalSettings.jsonpCallback;
                oldCallbacks.push(callbackName);
              }
              if (responseContainer && isFunction(overwritten)) {
                overwritten(responseContainer[0]);
              }
              responseContainer = overwritten = void 0;
            });
            return "script";
          }
        });
        support.createHTMLDocument = (function() {
          var body = document2.implementation.createHTMLDocument("").body;
          body.innerHTML = "<form></form><form></form>";
          return body.childNodes.length === 2;
        })();
        jQuery2.parseHTML = function(data, context, keepScripts) {
          if (typeof data !== "string") {
            return [];
          }
          if (typeof context === "boolean") {
            keepScripts = context;
            context = false;
          }
          var base, parsed, scripts;
          if (!context) {
            if (support.createHTMLDocument) {
              context = document2.implementation.createHTMLDocument("");
              base = context.createElement("base");
              base.href = document2.location.href;
              context.head.appendChild(base);
            } else {
              context = document2;
            }
          }
          parsed = rsingleTag.exec(data);
          scripts = !keepScripts && [];
          if (parsed) {
            return [context.createElement(parsed[1])];
          }
          parsed = buildFragment([data], context, scripts);
          if (scripts && scripts.length) {
            jQuery2(scripts).remove();
          }
          return jQuery2.merge([], parsed.childNodes);
        };
        jQuery2.fn.load = function(url, params, callback) {
          var selector, type, response, self = this, off = url.indexOf(" ");
          if (off > -1) {
            selector = stripAndCollapse(url.slice(off));
            url = url.slice(0, off);
          }
          if (isFunction(params)) {
            callback = params;
            params = void 0;
          } else if (params && typeof params === "object") {
            type = "POST";
          }
          if (self.length > 0) {
            jQuery2.ajax({
              url,
              // If "type" variable is undefined, then "GET" method will be used.
              // Make value of this field explicit since
              // user can override it through ajaxSetup method
              type: type || "GET",
              dataType: "html",
              data: params
            }).done(function(responseText) {
              response = arguments;
              self.html(selector ? (
                // If a selector was specified, locate the right elements in a dummy div
                // Exclude scripts to avoid IE 'Permission Denied' errors
                jQuery2("<div>").append(jQuery2.parseHTML(responseText)).find(selector)
              ) : (
                // Otherwise use the full result
                responseText
              ));
            }).always(callback && function(jqXHR, status) {
              self.each(function() {
                callback.apply(this, response || [jqXHR.responseText, status, jqXHR]);
              });
            });
          }
          return this;
        };
        jQuery2.expr.pseudos.animated = function(elem) {
          return jQuery2.grep(jQuery2.timers, function(fn) {
            return elem === fn.elem;
          }).length;
        };
        jQuery2.offset = {
          setOffset: function(elem, options, i) {
            var curPosition, curLeft, curCSSTop, curTop, curOffset, curCSSLeft, calculatePosition, position = jQuery2.css(elem, "position"), curElem = jQuery2(elem), props = {};
            if (position === "static") {
              elem.style.position = "relative";
            }
            curOffset = curElem.offset();
            curCSSTop = jQuery2.css(elem, "top");
            curCSSLeft = jQuery2.css(elem, "left");
            calculatePosition = (position === "absolute" || position === "fixed") && (curCSSTop + curCSSLeft).indexOf("auto") > -1;
            if (calculatePosition) {
              curPosition = curElem.position();
              curTop = curPosition.top;
              curLeft = curPosition.left;
            } else {
              curTop = parseFloat(curCSSTop) || 0;
              curLeft = parseFloat(curCSSLeft) || 0;
            }
            if (isFunction(options)) {
              options = options.call(elem, i, jQuery2.extend({}, curOffset));
            }
            if (options.top != null) {
              props.top = options.top - curOffset.top + curTop;
            }
            if (options.left != null) {
              props.left = options.left - curOffset.left + curLeft;
            }
            if ("using" in options) {
              options.using.call(elem, props);
            } else {
              curElem.css(props);
            }
          }
        };
        jQuery2.fn.extend({
          // offset() relates an element's border box to the document origin
          offset: function(options) {
            if (arguments.length) {
              return options === void 0 ? this : this.each(function(i) {
                jQuery2.offset.setOffset(this, options, i);
              });
            }
            var rect, win, elem = this[0];
            if (!elem) {
              return;
            }
            if (!elem.getClientRects().length) {
              return { top: 0, left: 0 };
            }
            rect = elem.getBoundingClientRect();
            win = elem.ownerDocument.defaultView;
            return {
              top: rect.top + win.pageYOffset,
              left: rect.left + win.pageXOffset
            };
          },
          // position() relates an element's margin box to its offset parent's padding box
          // This corresponds to the behavior of CSS absolute positioning
          position: function() {
            if (!this[0]) {
              return;
            }
            var offsetParent, offset, doc, elem = this[0], parentOffset = { top: 0, left: 0 };
            if (jQuery2.css(elem, "position") === "fixed") {
              offset = elem.getBoundingClientRect();
            } else {
              offset = this.offset();
              doc = elem.ownerDocument;
              offsetParent = elem.offsetParent || doc.documentElement;
              while (offsetParent && (offsetParent === doc.body || offsetParent === doc.documentElement) && jQuery2.css(offsetParent, "position") === "static") {
                offsetParent = offsetParent.parentNode;
              }
              if (offsetParent && offsetParent !== elem && offsetParent.nodeType === 1) {
                parentOffset = jQuery2(offsetParent).offset();
                parentOffset.top += jQuery2.css(offsetParent, "borderTopWidth", true);
                parentOffset.left += jQuery2.css(offsetParent, "borderLeftWidth", true);
              }
            }
            return {
              top: offset.top - parentOffset.top - jQuery2.css(elem, "marginTop", true),
              left: offset.left - parentOffset.left - jQuery2.css(elem, "marginLeft", true)
            };
          },
          // This method will return documentElement in the following cases:
          // 1) For the element inside the iframe without offsetParent, this method will return
          //    documentElement of the parent window
          // 2) For the hidden or detached element
          // 3) For body or html element, i.e. in case of the html node - it will return itself
          //
          // but those exceptions were never presented as a real life use-cases
          // and might be considered as more preferable results.
          //
          // This logic, however, is not guaranteed and can change at any point in the future
          offsetParent: function() {
            return this.map(function() {
              var offsetParent = this.offsetParent;
              while (offsetParent && jQuery2.css(offsetParent, "position") === "static") {
                offsetParent = offsetParent.offsetParent;
              }
              return offsetParent || documentElement;
            });
          }
        });
        jQuery2.each({ scrollLeft: "pageXOffset", scrollTop: "pageYOffset" }, function(method, prop) {
          var top = "pageYOffset" === prop;
          jQuery2.fn[method] = function(val) {
            return access(this, function(elem, method2, val2) {
              var win;
              if (isWindow(elem)) {
                win = elem;
              } else if (elem.nodeType === 9) {
                win = elem.defaultView;
              }
              if (val2 === void 0) {
                return win ? win[prop] : elem[method2];
              }
              if (win) {
                win.scrollTo(
                  !top ? val2 : win.pageXOffset,
                  top ? val2 : win.pageYOffset
                );
              } else {
                elem[method2] = val2;
              }
            }, method, val, arguments.length);
          };
        });
        jQuery2.each(["top", "left"], function(_i, prop) {
          jQuery2.cssHooks[prop] = addGetHookIf(
            support.pixelPosition,
            function(elem, computed) {
              if (computed) {
                computed = curCSS(elem, prop);
                return rnumnonpx.test(computed) ? jQuery2(elem).position()[prop] + "px" : computed;
              }
            }
          );
        });
        jQuery2.each({ Height: "height", Width: "width" }, function(name, type) {
          jQuery2.each({
            padding: "inner" + name,
            content: type,
            "": "outer" + name
          }, function(defaultExtra, funcName) {
            jQuery2.fn[funcName] = function(margin, value) {
              var chainable = arguments.length && (defaultExtra || typeof margin !== "boolean"), extra = defaultExtra || (margin === true || value === true ? "margin" : "border");
              return access(this, function(elem, type2, value2) {
                var doc;
                if (isWindow(elem)) {
                  return funcName.indexOf("outer") === 0 ? elem["inner" + name] : elem.document.documentElement["client" + name];
                }
                if (elem.nodeType === 9) {
                  doc = elem.documentElement;
                  return Math.max(
                    elem.body["scroll" + name],
                    doc["scroll" + name],
                    elem.body["offset" + name],
                    doc["offset" + name],
                    doc["client" + name]
                  );
                }
                return value2 === void 0 ? (
                  // Get width or height on the element, requesting but not forcing parseFloat
                  jQuery2.css(elem, type2, extra)
                ) : (
                  // Set width or height on the element
                  jQuery2.style(elem, type2, value2, extra)
                );
              }, type, chainable ? margin : void 0, chainable);
            };
          });
        });
        jQuery2.each([
          "ajaxStart",
          "ajaxStop",
          "ajaxComplete",
          "ajaxError",
          "ajaxSuccess",
          "ajaxSend"
        ], function(_i, type) {
          jQuery2.fn[type] = function(fn) {
            return this.on(type, fn);
          };
        });
        jQuery2.fn.extend({
          bind: function(types, data, fn) {
            return this.on(types, null, data, fn);
          },
          unbind: function(types, fn) {
            return this.off(types, null, fn);
          },
          delegate: function(selector, types, data, fn) {
            return this.on(types, selector, data, fn);
          },
          undelegate: function(selector, types, fn) {
            return arguments.length === 1 ? this.off(selector, "**") : this.off(types, selector || "**", fn);
          },
          hover: function(fnOver, fnOut) {
            return this.on("mouseenter", fnOver).on("mouseleave", fnOut || fnOver);
          }
        });
        jQuery2.each(
          "blur focus focusin focusout resize scroll click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup contextmenu".split(" "),
          function(_i, name) {
            jQuery2.fn[name] = function(data, fn) {
              return arguments.length > 0 ? this.on(name, null, data, fn) : this.trigger(name);
            };
          }
        );
        var rtrim = /^[\s\uFEFF\xA0]+|([^\s\uFEFF\xA0])[\s\uFEFF\xA0]+$/g;
        jQuery2.proxy = function(fn, context) {
          var tmp, args, proxy;
          if (typeof context === "string") {
            tmp = fn[context];
            context = fn;
            fn = tmp;
          }
          if (!isFunction(fn)) {
            return void 0;
          }
          args = slice.call(arguments, 2);
          proxy = function() {
            return fn.apply(context || this, args.concat(slice.call(arguments)));
          };
          proxy.guid = fn.guid = fn.guid || jQuery2.guid++;
          return proxy;
        };
        jQuery2.holdReady = function(hold) {
          if (hold) {
            jQuery2.readyWait++;
          } else {
            jQuery2.ready(true);
          }
        };
        jQuery2.isArray = Array.isArray;
        jQuery2.parseJSON = JSON.parse;
        jQuery2.nodeName = nodeName;
        jQuery2.isFunction = isFunction;
        jQuery2.isWindow = isWindow;
        jQuery2.camelCase = camelCase;
        jQuery2.type = toType;
        jQuery2.now = Date.now;
        jQuery2.isNumeric = function(obj) {
          var type = jQuery2.type(obj);
          return (type === "number" || type === "string") && // parseFloat NaNs numeric-cast false positives ("")
          // ...but misinterprets leading-number strings, particularly hex literals ("0x...")
          // subtraction forces infinities to NaN
          !isNaN(obj - parseFloat(obj));
        };
        jQuery2.trim = function(text) {
          return text == null ? "" : (text + "").replace(rtrim, "$1");
        };
        if (typeof define === "function" && define.amd) {
          define("jquery", [], function() {
            return jQuery2;
          });
        }
        var _jQuery = window2.jQuery, _$ = window2.$;
        jQuery2.noConflict = function(deep) {
          if (window2.$ === jQuery2) {
            window2.$ = _$;
          }
          if (deep && window2.jQuery === jQuery2) {
            window2.jQuery = _jQuery;
          }
          return jQuery2;
        };
        if (typeof noGlobal === "undefined") {
          window2.jQuery = window2.$ = jQuery2;
        }
        return jQuery2;
      });
    }
  });

  // app/javascript/shim-jquery.js
  var import_jquery;
  var init_shim_jquery = __esm({
    "app/javascript/shim-jquery.js"() {
      "use strict";
      import_jquery = __toESM(require_jquery());
      window.$ = window.jQuery = import_jquery.default;
    }
  });

  // ../node_modules/.pnpm/select2@4.1.0-rc.0/node_modules/select2/dist/js/select2.full.js
  var require_select2_full = __commonJS({
    "../node_modules/.pnpm/select2@4.1.0-rc.0/node_modules/select2/dist/js/select2.full.js"(exports, module) {
      init_shim_jquery();
      (function(factory) {
        if (typeof define === "function" && define.amd) {
          define(["jquery"], factory);
        } else if (typeof module === "object" && module.exports) {
          module.exports = function(root, jQuery2) {
            if (jQuery2 === void 0) {
              if (typeof window !== "undefined") {
                jQuery2 = require_jquery();
              } else {
                jQuery2 = require_jquery()(root);
              }
            }
            factory(jQuery2);
            return jQuery2;
          };
        } else {
          factory(jQuery);
        }
      })(function(jQuery2) {
        var S2 = (function() {
          if (jQuery2 && jQuery2.fn && jQuery2.fn.select2 && jQuery2.fn.select2.amd) {
            var S22 = jQuery2.fn.select2.amd;
          }
          var S22;
          (function() {
            if (!S22 || !S22.requirejs) {
              if (!S22) {
                S22 = {};
              } else {
                require2 = S22;
              }
              var requirejs, require2, define2;
              (function(undef) {
                var main, req, makeMap, handlers, defined = {}, waiting = {}, config = {}, defining = {}, hasOwn = Object.prototype.hasOwnProperty, aps = [].slice, jsSuffixRegExp = /\.js$/;
                function hasProp(obj, prop) {
                  return hasOwn.call(obj, prop);
                }
                function normalize(name, baseName) {
                  var nameParts, nameSegment, mapValue, foundMap, lastIndex, foundI, foundStarMap, starI, i, j, part, normalizedBaseParts, baseParts = baseName && baseName.split("/"), map = config.map, starMap = map && map["*"] || {};
                  if (name) {
                    name = name.split("/");
                    lastIndex = name.length - 1;
                    if (config.nodeIdCompat && jsSuffixRegExp.test(name[lastIndex])) {
                      name[lastIndex] = name[lastIndex].replace(jsSuffixRegExp, "");
                    }
                    if (name[0].charAt(0) === "." && baseParts) {
                      normalizedBaseParts = baseParts.slice(0, baseParts.length - 1);
                      name = normalizedBaseParts.concat(name);
                    }
                    for (i = 0; i < name.length; i++) {
                      part = name[i];
                      if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                      } else if (part === "..") {
                        if (i === 0 || i === 1 && name[2] === ".." || name[i - 1] === "..") {
                          continue;
                        } else if (i > 0) {
                          name.splice(i - 1, 2);
                          i -= 2;
                        }
                      }
                    }
                    name = name.join("/");
                  }
                  if ((baseParts || starMap) && map) {
                    nameParts = name.split("/");
                    for (i = nameParts.length; i > 0; i -= 1) {
                      nameSegment = nameParts.slice(0, i).join("/");
                      if (baseParts) {
                        for (j = baseParts.length; j > 0; j -= 1) {
                          mapValue = map[baseParts.slice(0, j).join("/")];
                          if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                              foundMap = mapValue;
                              foundI = i;
                              break;
                            }
                          }
                        }
                      }
                      if (foundMap) {
                        break;
                      }
                      if (!foundStarMap && starMap && starMap[nameSegment]) {
                        foundStarMap = starMap[nameSegment];
                        starI = i;
                      }
                    }
                    if (!foundMap && foundStarMap) {
                      foundMap = foundStarMap;
                      foundI = starI;
                    }
                    if (foundMap) {
                      nameParts.splice(0, foundI, foundMap);
                      name = nameParts.join("/");
                    }
                  }
                  return name;
                }
                function makeRequire(relName, forceSync) {
                  return function() {
                    var args = aps.call(arguments, 0);
                    if (typeof args[0] !== "string" && args.length === 1) {
                      args.push(null);
                    }
                    return req.apply(undef, args.concat([relName, forceSync]));
                  };
                }
                function makeNormalize(relName) {
                  return function(name) {
                    return normalize(name, relName);
                  };
                }
                function makeLoad(depName) {
                  return function(value) {
                    defined[depName] = value;
                  };
                }
                function callDep(name) {
                  if (hasProp(waiting, name)) {
                    var args = waiting[name];
                    delete waiting[name];
                    defining[name] = true;
                    main.apply(undef, args);
                  }
                  if (!hasProp(defined, name) && !hasProp(defining, name)) {
                    throw new Error("No " + name);
                  }
                  return defined[name];
                }
                function splitPrefix(name) {
                  var prefix, index = name ? name.indexOf("!") : -1;
                  if (index > -1) {
                    prefix = name.substring(0, index);
                    name = name.substring(index + 1, name.length);
                  }
                  return [prefix, name];
                }
                function makeRelParts(relName) {
                  return relName ? splitPrefix(relName) : [];
                }
                makeMap = function(name, relParts) {
                  var plugin, parts = splitPrefix(name), prefix = parts[0], relResourceName = relParts[1];
                  name = parts[1];
                  if (prefix) {
                    prefix = normalize(prefix, relResourceName);
                    plugin = callDep(prefix);
                  }
                  if (prefix) {
                    if (plugin && plugin.normalize) {
                      name = plugin.normalize(name, makeNormalize(relResourceName));
                    } else {
                      name = normalize(name, relResourceName);
                    }
                  } else {
                    name = normalize(name, relResourceName);
                    parts = splitPrefix(name);
                    prefix = parts[0];
                    name = parts[1];
                    if (prefix) {
                      plugin = callDep(prefix);
                    }
                  }
                  return {
                    f: prefix ? prefix + "!" + name : name,
                    //fullName
                    n: name,
                    pr: prefix,
                    p: plugin
                  };
                };
                function makeConfig(name) {
                  return function() {
                    return config && config.config && config.config[name] || {};
                  };
                }
                handlers = {
                  require: function(name) {
                    return makeRequire(name);
                  },
                  exports: function(name) {
                    var e = defined[name];
                    if (typeof e !== "undefined") {
                      return e;
                    } else {
                      return defined[name] = {};
                    }
                  },
                  module: function(name) {
                    return {
                      id: name,
                      uri: "",
                      exports: defined[name],
                      config: makeConfig(name)
                    };
                  }
                };
                main = function(name, deps, callback, relName) {
                  var cjsModule, depName, ret, map, i, relParts, args = [], callbackType = typeof callback, usingExports;
                  relName = relName || name;
                  relParts = makeRelParts(relName);
                  if (callbackType === "undefined" || callbackType === "function") {
                    deps = !deps.length && callback.length ? ["require", "exports", "module"] : deps;
                    for (i = 0; i < deps.length; i += 1) {
                      map = makeMap(deps[i], relParts);
                      depName = map.f;
                      if (depName === "require") {
                        args[i] = handlers.require(name);
                      } else if (depName === "exports") {
                        args[i] = handlers.exports(name);
                        usingExports = true;
                      } else if (depName === "module") {
                        cjsModule = args[i] = handlers.module(name);
                      } else if (hasProp(defined, depName) || hasProp(waiting, depName) || hasProp(defining, depName)) {
                        args[i] = callDep(depName);
                      } else if (map.p) {
                        map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                        args[i] = defined[depName];
                      } else {
                        throw new Error(name + " missing " + depName);
                      }
                    }
                    ret = callback ? callback.apply(defined[name], args) : void 0;
                    if (name) {
                      if (cjsModule && cjsModule.exports !== undef && cjsModule.exports !== defined[name]) {
                        defined[name] = cjsModule.exports;
                      } else if (ret !== undef || !usingExports) {
                        defined[name] = ret;
                      }
                    }
                  } else if (name) {
                    defined[name] = callback;
                  }
                };
                requirejs = require2 = req = function(deps, callback, relName, forceSync, alt) {
                  if (typeof deps === "string") {
                    if (handlers[deps]) {
                      return handlers[deps](callback);
                    }
                    return callDep(makeMap(deps, makeRelParts(callback)).f);
                  } else if (!deps.splice) {
                    config = deps;
                    if (config.deps) {
                      req(config.deps, config.callback);
                    }
                    if (!callback) {
                      return;
                    }
                    if (callback.splice) {
                      deps = callback;
                      callback = relName;
                      relName = null;
                    } else {
                      deps = undef;
                    }
                  }
                  callback = callback || function() {
                  };
                  if (typeof relName === "function") {
                    relName = forceSync;
                    forceSync = alt;
                  }
                  if (forceSync) {
                    main(undef, deps, callback, relName);
                  } else {
                    setTimeout(function() {
                      main(undef, deps, callback, relName);
                    }, 4);
                  }
                  return req;
                };
                req.config = function(cfg) {
                  return req(cfg);
                };
                requirejs._defined = defined;
                define2 = function(name, deps, callback) {
                  if (typeof name !== "string") {
                    throw new Error("See almond README: incorrect module build, no module name");
                  }
                  if (!deps.splice) {
                    callback = deps;
                    deps = [];
                  }
                  if (!hasProp(defined, name) && !hasProp(waiting, name)) {
                    waiting[name] = [name, deps, callback];
                  }
                };
                define2.amd = {
                  jQuery: true
                };
              })();
              S22.requirejs = requirejs;
              S22.require = require2;
              S22.define = define2;
            }
          })();
          S22.define("almond", function() {
          });
          S22.define("jquery", [], function() {
            var _$ = jQuery2 || $;
            if (_$ == null && console && console.error) {
              console.error(
                "Select2: An instance of jQuery or a jQuery-compatible library was not found. Make sure that you are including jQuery before Select2 on your web page."
              );
            }
            return _$;
          });
          S22.define("select2/utils", [
            "jquery"
          ], function($3) {
            var Utils = {};
            Utils.Extend = function(ChildClass, SuperClass) {
              var __hasProp = {}.hasOwnProperty;
              function BaseConstructor() {
                this.constructor = ChildClass;
              }
              for (var key in SuperClass) {
                if (__hasProp.call(SuperClass, key)) {
                  ChildClass[key] = SuperClass[key];
                }
              }
              BaseConstructor.prototype = SuperClass.prototype;
              ChildClass.prototype = new BaseConstructor();
              ChildClass.__super__ = SuperClass.prototype;
              return ChildClass;
            };
            function getMethods(theClass) {
              var proto = theClass.prototype;
              var methods = [];
              for (var methodName in proto) {
                var m = proto[methodName];
                if (typeof m !== "function") {
                  continue;
                }
                if (methodName === "constructor") {
                  continue;
                }
                methods.push(methodName);
              }
              return methods;
            }
            Utils.Decorate = function(SuperClass, DecoratorClass) {
              var decoratedMethods = getMethods(DecoratorClass);
              var superMethods = getMethods(SuperClass);
              function DecoratedClass() {
                var unshift = Array.prototype.unshift;
                var argCount = DecoratorClass.prototype.constructor.length;
                var calledConstructor = SuperClass.prototype.constructor;
                if (argCount > 0) {
                  unshift.call(arguments, SuperClass.prototype.constructor);
                  calledConstructor = DecoratorClass.prototype.constructor;
                }
                calledConstructor.apply(this, arguments);
              }
              DecoratorClass.displayName = SuperClass.displayName;
              function ctr() {
                this.constructor = DecoratedClass;
              }
              DecoratedClass.prototype = new ctr();
              for (var m = 0; m < superMethods.length; m++) {
                var superMethod = superMethods[m];
                DecoratedClass.prototype[superMethod] = SuperClass.prototype[superMethod];
              }
              var calledMethod = function(methodName) {
                var originalMethod = function() {
                };
                if (methodName in DecoratedClass.prototype) {
                  originalMethod = DecoratedClass.prototype[methodName];
                }
                var decoratedMethod2 = DecoratorClass.prototype[methodName];
                return function() {
                  var unshift = Array.prototype.unshift;
                  unshift.call(arguments, originalMethod);
                  return decoratedMethod2.apply(this, arguments);
                };
              };
              for (var d = 0; d < decoratedMethods.length; d++) {
                var decoratedMethod = decoratedMethods[d];
                DecoratedClass.prototype[decoratedMethod] = calledMethod(decoratedMethod);
              }
              return DecoratedClass;
            };
            var Observable = function() {
              this.listeners = {};
            };
            Observable.prototype.on = function(event, callback) {
              this.listeners = this.listeners || {};
              if (event in this.listeners) {
                this.listeners[event].push(callback);
              } else {
                this.listeners[event] = [callback];
              }
            };
            Observable.prototype.trigger = function(event) {
              var slice = Array.prototype.slice;
              var params = slice.call(arguments, 1);
              this.listeners = this.listeners || {};
              if (params == null) {
                params = [];
              }
              if (params.length === 0) {
                params.push({});
              }
              params[0]._type = event;
              if (event in this.listeners) {
                this.invoke(this.listeners[event], slice.call(arguments, 1));
              }
              if ("*" in this.listeners) {
                this.invoke(this.listeners["*"], arguments);
              }
            };
            Observable.prototype.invoke = function(listeners, params) {
              for (var i = 0, len = listeners.length; i < len; i++) {
                listeners[i].apply(this, params);
              }
            };
            Utils.Observable = Observable;
            Utils.generateChars = function(length) {
              var chars = "";
              for (var i = 0; i < length; i++) {
                var randomChar = Math.floor(Math.random() * 36);
                chars += randomChar.toString(36);
              }
              return chars;
            };
            Utils.bind = function(func, context) {
              return function() {
                func.apply(context, arguments);
              };
            };
            Utils._convertData = function(data) {
              for (var originalKey in data) {
                var keys = originalKey.split("-");
                var dataLevel = data;
                if (keys.length === 1) {
                  continue;
                }
                for (var k = 0; k < keys.length; k++) {
                  var key = keys[k];
                  key = key.substring(0, 1).toLowerCase() + key.substring(1);
                  if (!(key in dataLevel)) {
                    dataLevel[key] = {};
                  }
                  if (k == keys.length - 1) {
                    dataLevel[key] = data[originalKey];
                  }
                  dataLevel = dataLevel[key];
                }
                delete data[originalKey];
              }
              return data;
            };
            Utils.hasScroll = function(index, el) {
              var $el = $3(el);
              var overflowX = el.style.overflowX;
              var overflowY = el.style.overflowY;
              if (overflowX === overflowY && (overflowY === "hidden" || overflowY === "visible")) {
                return false;
              }
              if (overflowX === "scroll" || overflowY === "scroll") {
                return true;
              }
              return $el.innerHeight() < el.scrollHeight || $el.innerWidth() < el.scrollWidth;
            };
            Utils.escapeMarkup = function(markup) {
              var replaceMap = {
                "\\": "&#92;",
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;",
                "/": "&#47;"
              };
              if (typeof markup !== "string") {
                return markup;
              }
              return String(markup).replace(/[&<>"'\/\\]/g, function(match) {
                return replaceMap[match];
              });
            };
            Utils.__cache = {};
            var id = 0;
            Utils.GetUniqueElementId = function(element) {
              var select2Id = element.getAttribute("data-select2-id");
              if (select2Id != null) {
                return select2Id;
              }
              if (element.id) {
                select2Id = "select2-data-" + element.id;
              } else {
                select2Id = "select2-data-" + (++id).toString() + "-" + Utils.generateChars(4);
              }
              element.setAttribute("data-select2-id", select2Id);
              return select2Id;
            };
            Utils.StoreData = function(element, name, value) {
              var id2 = Utils.GetUniqueElementId(element);
              if (!Utils.__cache[id2]) {
                Utils.__cache[id2] = {};
              }
              Utils.__cache[id2][name] = value;
            };
            Utils.GetData = function(element, name) {
              var id2 = Utils.GetUniqueElementId(element);
              if (name) {
                if (Utils.__cache[id2]) {
                  if (Utils.__cache[id2][name] != null) {
                    return Utils.__cache[id2][name];
                  }
                  return $3(element).data(name);
                }
                return $3(element).data(name);
              } else {
                return Utils.__cache[id2];
              }
            };
            Utils.RemoveData = function(element) {
              var id2 = Utils.GetUniqueElementId(element);
              if (Utils.__cache[id2] != null) {
                delete Utils.__cache[id2];
              }
              element.removeAttribute("data-select2-id");
            };
            Utils.copyNonInternalCssClasses = function(dest, src) {
              var classes;
              var destinationClasses = dest.getAttribute("class").trim().split(/\s+/);
              destinationClasses = destinationClasses.filter(function(clazz) {
                return clazz.indexOf("select2-") === 0;
              });
              var sourceClasses = src.getAttribute("class").trim().split(/\s+/);
              sourceClasses = sourceClasses.filter(function(clazz) {
                return clazz.indexOf("select2-") !== 0;
              });
              var replacements = destinationClasses.concat(sourceClasses);
              dest.setAttribute("class", replacements.join(" "));
            };
            return Utils;
          });
          S22.define("select2/results", [
            "jquery",
            "./utils"
          ], function($3, Utils) {
            function Results($element, options, dataAdapter) {
              this.$element = $element;
              this.data = dataAdapter;
              this.options = options;
              Results.__super__.constructor.call(this);
            }
            Utils.Extend(Results, Utils.Observable);
            Results.prototype.render = function() {
              var $results = $3(
                '<ul class="select2-results__options" role="listbox"></ul>'
              );
              if (this.options.get("multiple")) {
                $results.attr("aria-multiselectable", "true");
              }
              this.$results = $results;
              return $results;
            };
            Results.prototype.clear = function() {
              this.$results.empty();
            };
            Results.prototype.displayMessage = function(params) {
              var escapeMarkup = this.options.get("escapeMarkup");
              this.clear();
              this.hideLoading();
              var $message = $3(
                '<li role="alert" aria-live="assertive" class="select2-results__option"></li>'
              );
              var message = this.options.get("translations").get(params.message);
              $message.append(
                escapeMarkup(
                  message(params.args)
                )
              );
              $message[0].className += " select2-results__message";
              this.$results.append($message);
            };
            Results.prototype.hideMessages = function() {
              this.$results.find(".select2-results__message").remove();
            };
            Results.prototype.append = function(data) {
              this.hideLoading();
              var $options = [];
              if (data.results == null || data.results.length === 0) {
                if (this.$results.children().length === 0) {
                  this.trigger("results:message", {
                    message: "noResults"
                  });
                }
                return;
              }
              data.results = this.sort(data.results);
              for (var d = 0; d < data.results.length; d++) {
                var item = data.results[d];
                var $option = this.option(item);
                $options.push($option);
              }
              this.$results.append($options);
            };
            Results.prototype.position = function($results, $dropdown) {
              var $resultsContainer = $dropdown.find(".select2-results");
              $resultsContainer.append($results);
            };
            Results.prototype.sort = function(data) {
              var sorter = this.options.get("sorter");
              return sorter(data);
            };
            Results.prototype.highlightFirstItem = function() {
              var $options = this.$results.find(".select2-results__option--selectable");
              var $selected = $options.filter(".select2-results__option--selected");
              if ($selected.length > 0) {
                $selected.first().trigger("mouseenter");
              } else {
                $options.first().trigger("mouseenter");
              }
              this.ensureHighlightVisible();
            };
            Results.prototype.setClasses = function() {
              var self = this;
              this.data.current(function(selected) {
                var selectedIds = selected.map(function(s) {
                  return s.id.toString();
                });
                var $options = self.$results.find(".select2-results__option--selectable");
                $options.each(function() {
                  var $option = $3(this);
                  var item = Utils.GetData(this, "data");
                  var id = "" + item.id;
                  if (item.element != null && item.element.selected || item.element == null && selectedIds.indexOf(id) > -1) {
                    this.classList.add("select2-results__option--selected");
                    $option.attr("aria-selected", "true");
                  } else {
                    this.classList.remove("select2-results__option--selected");
                    $option.attr("aria-selected", "false");
                  }
                });
              });
            };
            Results.prototype.showLoading = function(params) {
              this.hideLoading();
              var loadingMore = this.options.get("translations").get("searching");
              var loading = {
                disabled: true,
                loading: true,
                text: loadingMore(params)
              };
              var $loading = this.option(loading);
              $loading.className += " loading-results";
              this.$results.prepend($loading);
            };
            Results.prototype.hideLoading = function() {
              this.$results.find(".loading-results").remove();
            };
            Results.prototype.option = function(data) {
              var option = document.createElement("li");
              option.classList.add("select2-results__option");
              option.classList.add("select2-results__option--selectable");
              var attrs = {
                "role": "option"
              };
              var matches = window.Element.prototype.matches || window.Element.prototype.msMatchesSelector || window.Element.prototype.webkitMatchesSelector;
              if (data.element != null && matches.call(data.element, ":disabled") || data.element == null && data.disabled) {
                attrs["aria-disabled"] = "true";
                option.classList.remove("select2-results__option--selectable");
                option.classList.add("select2-results__option--disabled");
              }
              if (data.id == null) {
                option.classList.remove("select2-results__option--selectable");
              }
              if (data._resultId != null) {
                option.id = data._resultId;
              }
              if (data.title) {
                option.title = data.title;
              }
              if (data.children) {
                attrs.role = "group";
                attrs["aria-label"] = data.text;
                option.classList.remove("select2-results__option--selectable");
                option.classList.add("select2-results__option--group");
              }
              for (var attr in attrs) {
                var val = attrs[attr];
                option.setAttribute(attr, val);
              }
              if (data.children) {
                var $option = $3(option);
                var label = document.createElement("strong");
                label.className = "select2-results__group";
                this.template(data, label);
                var $children = [];
                for (var c = 0; c < data.children.length; c++) {
                  var child = data.children[c];
                  var $child = this.option(child);
                  $children.push($child);
                }
                var $childrenContainer = $3("<ul></ul>", {
                  "class": "select2-results__options select2-results__options--nested",
                  "role": "none"
                });
                $childrenContainer.append($children);
                $option.append(label);
                $option.append($childrenContainer);
              } else {
                this.template(data, option);
              }
              Utils.StoreData(option, "data", data);
              return option;
            };
            Results.prototype.bind = function(container, $container) {
              var self = this;
              var id = container.id + "-results";
              this.$results.attr("id", id);
              container.on("results:all", function(params) {
                self.clear();
                self.append(params.data);
                if (container.isOpen()) {
                  self.setClasses();
                  self.highlightFirstItem();
                }
              });
              container.on("results:append", function(params) {
                self.append(params.data);
                if (container.isOpen()) {
                  self.setClasses();
                }
              });
              container.on("query", function(params) {
                self.hideMessages();
                self.showLoading(params);
              });
              container.on("select", function() {
                if (!container.isOpen()) {
                  return;
                }
                self.setClasses();
                if (self.options.get("scrollAfterSelect")) {
                  self.highlightFirstItem();
                }
              });
              container.on("unselect", function() {
                if (!container.isOpen()) {
                  return;
                }
                self.setClasses();
                if (self.options.get("scrollAfterSelect")) {
                  self.highlightFirstItem();
                }
              });
              container.on("open", function() {
                self.$results.attr("aria-expanded", "true");
                self.$results.attr("aria-hidden", "false");
                self.setClasses();
                self.ensureHighlightVisible();
              });
              container.on("close", function() {
                self.$results.attr("aria-expanded", "false");
                self.$results.attr("aria-hidden", "true");
                self.$results.removeAttr("aria-activedescendant");
              });
              container.on("results:toggle", function() {
                var $highlighted = self.getHighlightedResults();
                if ($highlighted.length === 0) {
                  return;
                }
                $highlighted.trigger("mouseup");
              });
              container.on("results:select", function() {
                var $highlighted = self.getHighlightedResults();
                if ($highlighted.length === 0) {
                  return;
                }
                var data = Utils.GetData($highlighted[0], "data");
                if ($highlighted.hasClass("select2-results__option--selected")) {
                  self.trigger("close", {});
                } else {
                  self.trigger("select", {
                    data
                  });
                }
              });
              container.on("results:previous", function() {
                var $highlighted = self.getHighlightedResults();
                var $options = self.$results.find(".select2-results__option--selectable");
                var currentIndex = $options.index($highlighted);
                if (currentIndex <= 0) {
                  return;
                }
                var nextIndex = currentIndex - 1;
                if ($highlighted.length === 0) {
                  nextIndex = 0;
                }
                var $next = $options.eq(nextIndex);
                $next.trigger("mouseenter");
                var currentOffset = self.$results.offset().top;
                var nextTop = $next.offset().top;
                var nextOffset = self.$results.scrollTop() + (nextTop - currentOffset);
                if (nextIndex === 0) {
                  self.$results.scrollTop(0);
                } else if (nextTop - currentOffset < 0) {
                  self.$results.scrollTop(nextOffset);
                }
              });
              container.on("results:next", function() {
                var $highlighted = self.getHighlightedResults();
                var $options = self.$results.find(".select2-results__option--selectable");
                var currentIndex = $options.index($highlighted);
                var nextIndex = currentIndex + 1;
                if (nextIndex >= $options.length) {
                  return;
                }
                var $next = $options.eq(nextIndex);
                $next.trigger("mouseenter");
                var currentOffset = self.$results.offset().top + self.$results.outerHeight(false);
                var nextBottom = $next.offset().top + $next.outerHeight(false);
                var nextOffset = self.$results.scrollTop() + nextBottom - currentOffset;
                if (nextIndex === 0) {
                  self.$results.scrollTop(0);
                } else if (nextBottom > currentOffset) {
                  self.$results.scrollTop(nextOffset);
                }
              });
              container.on("results:focus", function(params) {
                params.element[0].classList.add("select2-results__option--highlighted");
                params.element[0].setAttribute("aria-selected", "true");
              });
              container.on("results:message", function(params) {
                self.displayMessage(params);
              });
              if ($3.fn.mousewheel) {
                this.$results.on("mousewheel", function(e) {
                  var top = self.$results.scrollTop();
                  var bottom = self.$results.get(0).scrollHeight - top + e.deltaY;
                  var isAtTop = e.deltaY > 0 && top - e.deltaY <= 0;
                  var isAtBottom = e.deltaY < 0 && bottom <= self.$results.height();
                  if (isAtTop) {
                    self.$results.scrollTop(0);
                    e.preventDefault();
                    e.stopPropagation();
                  } else if (isAtBottom) {
                    self.$results.scrollTop(
                      self.$results.get(0).scrollHeight - self.$results.height()
                    );
                    e.preventDefault();
                    e.stopPropagation();
                  }
                });
              }
              this.$results.on(
                "mouseup",
                ".select2-results__option--selectable",
                function(evt) {
                  var $this = $3(this);
                  var data = Utils.GetData(this, "data");
                  if ($this.hasClass("select2-results__option--selected")) {
                    if (self.options.get("multiple")) {
                      self.trigger("unselect", {
                        originalEvent: evt,
                        data
                      });
                    } else {
                      self.trigger("close", {});
                    }
                    return;
                  }
                  self.trigger("select", {
                    originalEvent: evt,
                    data
                  });
                }
              );
              this.$results.on(
                "mouseenter",
                ".select2-results__option--selectable",
                function(evt) {
                  var data = Utils.GetData(this, "data");
                  self.getHighlightedResults().removeClass("select2-results__option--highlighted").attr("aria-selected", "false");
                  self.trigger("results:focus", {
                    data,
                    element: $3(this)
                  });
                }
              );
            };
            Results.prototype.getHighlightedResults = function() {
              var $highlighted = this.$results.find(".select2-results__option--highlighted");
              return $highlighted;
            };
            Results.prototype.destroy = function() {
              this.$results.remove();
            };
            Results.prototype.ensureHighlightVisible = function() {
              var $highlighted = this.getHighlightedResults();
              if ($highlighted.length === 0) {
                return;
              }
              var $options = this.$results.find(".select2-results__option--selectable");
              var currentIndex = $options.index($highlighted);
              var currentOffset = this.$results.offset().top;
              var nextTop = $highlighted.offset().top;
              var nextOffset = this.$results.scrollTop() + (nextTop - currentOffset);
              var offsetDelta = nextTop - currentOffset;
              nextOffset -= $highlighted.outerHeight(false) * 2;
              if (currentIndex <= 2) {
                this.$results.scrollTop(0);
              } else if (offsetDelta > this.$results.outerHeight() || offsetDelta < 0) {
                this.$results.scrollTop(nextOffset);
              }
            };
            Results.prototype.template = function(result, container) {
              var template = this.options.get("templateResult");
              var escapeMarkup = this.options.get("escapeMarkup");
              var content = template(result, container);
              if (content == null) {
                container.style.display = "none";
              } else if (typeof content === "string") {
                container.innerHTML = escapeMarkup(content);
              } else {
                $3(container).append(content);
              }
            };
            return Results;
          });
          S22.define("select2/keys", [], function() {
            var KEYS = {
              BACKSPACE: 8,
              TAB: 9,
              ENTER: 13,
              SHIFT: 16,
              CTRL: 17,
              ALT: 18,
              ESC: 27,
              SPACE: 32,
              PAGE_UP: 33,
              PAGE_DOWN: 34,
              END: 35,
              HOME: 36,
              LEFT: 37,
              UP: 38,
              RIGHT: 39,
              DOWN: 40,
              DELETE: 46
            };
            return KEYS;
          });
          S22.define("select2/selection/base", [
            "jquery",
            "../utils",
            "../keys"
          ], function($3, Utils, KEYS) {
            function BaseSelection($element, options) {
              this.$element = $element;
              this.options = options;
              BaseSelection.__super__.constructor.call(this);
            }
            Utils.Extend(BaseSelection, Utils.Observable);
            BaseSelection.prototype.render = function() {
              var $selection = $3(
                '<span class="select2-selection" role="combobox"  aria-haspopup="true" aria-expanded="false"></span>'
              );
              this._tabindex = 0;
              if (Utils.GetData(this.$element[0], "old-tabindex") != null) {
                this._tabindex = Utils.GetData(this.$element[0], "old-tabindex");
              } else if (this.$element.attr("tabindex") != null) {
                this._tabindex = this.$element.attr("tabindex");
              }
              $selection.attr("title", this.$element.attr("title"));
              $selection.attr("tabindex", this._tabindex);
              $selection.attr("aria-disabled", "false");
              this.$selection = $selection;
              return $selection;
            };
            BaseSelection.prototype.bind = function(container, $container) {
              var self = this;
              var resultsId = container.id + "-results";
              this.container = container;
              this.$selection.on("focus", function(evt) {
                self.trigger("focus", evt);
              });
              this.$selection.on("blur", function(evt) {
                self._handleBlur(evt);
              });
              this.$selection.on("keydown", function(evt) {
                self.trigger("keypress", evt);
                if (evt.which === KEYS.SPACE) {
                  evt.preventDefault();
                }
              });
              container.on("results:focus", function(params) {
                self.$selection.attr("aria-activedescendant", params.data._resultId);
              });
              container.on("selection:update", function(params) {
                self.update(params.data);
              });
              container.on("open", function() {
                self.$selection.attr("aria-expanded", "true");
                self.$selection.attr("aria-owns", resultsId);
                self._attachCloseHandler(container);
              });
              container.on("close", function() {
                self.$selection.attr("aria-expanded", "false");
                self.$selection.removeAttr("aria-activedescendant");
                self.$selection.removeAttr("aria-owns");
                self.$selection.trigger("focus");
                self._detachCloseHandler(container);
              });
              container.on("enable", function() {
                self.$selection.attr("tabindex", self._tabindex);
                self.$selection.attr("aria-disabled", "false");
              });
              container.on("disable", function() {
                self.$selection.attr("tabindex", "-1");
                self.$selection.attr("aria-disabled", "true");
              });
            };
            BaseSelection.prototype._handleBlur = function(evt) {
              var self = this;
              window.setTimeout(function() {
                if (document.activeElement == self.$selection[0] || $3.contains(self.$selection[0], document.activeElement)) {
                  return;
                }
                self.trigger("blur", evt);
              }, 1);
            };
            BaseSelection.prototype._attachCloseHandler = function(container) {
              $3(document.body).on("mousedown.select2." + container.id, function(e) {
                var $target = $3(e.target);
                var $select = $target.closest(".select2");
                var $all = $3(".select2.select2-container--open");
                $all.each(function() {
                  if (this == $select[0]) {
                    return;
                  }
                  var $element = Utils.GetData(this, "element");
                  $element.select2("close");
                });
              });
            };
            BaseSelection.prototype._detachCloseHandler = function(container) {
              $3(document.body).off("mousedown.select2." + container.id);
            };
            BaseSelection.prototype.position = function($selection, $container) {
              var $selectionContainer = $container.find(".selection");
              $selectionContainer.append($selection);
            };
            BaseSelection.prototype.destroy = function() {
              this._detachCloseHandler(this.container);
            };
            BaseSelection.prototype.update = function(data) {
              throw new Error("The `update` method must be defined in child classes.");
            };
            BaseSelection.prototype.isEnabled = function() {
              return !this.isDisabled();
            };
            BaseSelection.prototype.isDisabled = function() {
              return this.options.get("disabled");
            };
            return BaseSelection;
          });
          S22.define("select2/selection/single", [
            "jquery",
            "./base",
            "../utils",
            "../keys"
          ], function($3, BaseSelection, Utils, KEYS) {
            function SingleSelection() {
              SingleSelection.__super__.constructor.apply(this, arguments);
            }
            Utils.Extend(SingleSelection, BaseSelection);
            SingleSelection.prototype.render = function() {
              var $selection = SingleSelection.__super__.render.call(this);
              $selection[0].classList.add("select2-selection--single");
              $selection.html(
                '<span class="select2-selection__rendered"></span><span class="select2-selection__arrow" role="presentation"><b role="presentation"></b></span>'
              );
              return $selection;
            };
            SingleSelection.prototype.bind = function(container, $container) {
              var self = this;
              SingleSelection.__super__.bind.apply(this, arguments);
              var id = container.id + "-container";
              this.$selection.find(".select2-selection__rendered").attr("id", id).attr("role", "textbox").attr("aria-readonly", "true");
              this.$selection.attr("aria-labelledby", id);
              this.$selection.attr("aria-controls", id);
              this.$selection.on("mousedown", function(evt) {
                if (evt.which !== 1) {
                  return;
                }
                self.trigger("toggle", {
                  originalEvent: evt
                });
              });
              this.$selection.on("focus", function(evt) {
              });
              this.$selection.on("blur", function(evt) {
              });
              container.on("focus", function(evt) {
                if (!container.isOpen()) {
                  self.$selection.trigger("focus");
                }
              });
            };
            SingleSelection.prototype.clear = function() {
              var $rendered = this.$selection.find(".select2-selection__rendered");
              $rendered.empty();
              $rendered.removeAttr("title");
            };
            SingleSelection.prototype.display = function(data, container) {
              var template = this.options.get("templateSelection");
              var escapeMarkup = this.options.get("escapeMarkup");
              return escapeMarkup(template(data, container));
            };
            SingleSelection.prototype.selectionContainer = function() {
              return $3("<span></span>");
            };
            SingleSelection.prototype.update = function(data) {
              if (data.length === 0) {
                this.clear();
                return;
              }
              var selection = data[0];
              var $rendered = this.$selection.find(".select2-selection__rendered");
              var formatted = this.display(selection, $rendered);
              $rendered.empty().append(formatted);
              var title = selection.title || selection.text;
              if (title) {
                $rendered.attr("title", title);
              } else {
                $rendered.removeAttr("title");
              }
            };
            return SingleSelection;
          });
          S22.define("select2/selection/multiple", [
            "jquery",
            "./base",
            "../utils"
          ], function($3, BaseSelection, Utils) {
            function MultipleSelection($element, options) {
              MultipleSelection.__super__.constructor.apply(this, arguments);
            }
            Utils.Extend(MultipleSelection, BaseSelection);
            MultipleSelection.prototype.render = function() {
              var $selection = MultipleSelection.__super__.render.call(this);
              $selection[0].classList.add("select2-selection--multiple");
              $selection.html(
                '<ul class="select2-selection__rendered"></ul>'
              );
              return $selection;
            };
            MultipleSelection.prototype.bind = function(container, $container) {
              var self = this;
              MultipleSelection.__super__.bind.apply(this, arguments);
              var id = container.id + "-container";
              this.$selection.find(".select2-selection__rendered").attr("id", id);
              this.$selection.on("click", function(evt) {
                self.trigger("toggle", {
                  originalEvent: evt
                });
              });
              this.$selection.on(
                "click",
                ".select2-selection__choice__remove",
                function(evt) {
                  if (self.isDisabled()) {
                    return;
                  }
                  var $remove = $3(this);
                  var $selection = $remove.parent();
                  var data = Utils.GetData($selection[0], "data");
                  self.trigger("unselect", {
                    originalEvent: evt,
                    data
                  });
                }
              );
              this.$selection.on(
                "keydown",
                ".select2-selection__choice__remove",
                function(evt) {
                  if (self.isDisabled()) {
                    return;
                  }
                  evt.stopPropagation();
                }
              );
            };
            MultipleSelection.prototype.clear = function() {
              var $rendered = this.$selection.find(".select2-selection__rendered");
              $rendered.empty();
              $rendered.removeAttr("title");
            };
            MultipleSelection.prototype.display = function(data, container) {
              var template = this.options.get("templateSelection");
              var escapeMarkup = this.options.get("escapeMarkup");
              return escapeMarkup(template(data, container));
            };
            MultipleSelection.prototype.selectionContainer = function() {
              var $container = $3(
                '<li class="select2-selection__choice"><button type="button" class="select2-selection__choice__remove" tabindex="-1"><span aria-hidden="true">&times;</span></button><span class="select2-selection__choice__display"></span></li>'
              );
              return $container;
            };
            MultipleSelection.prototype.update = function(data) {
              this.clear();
              if (data.length === 0) {
                return;
              }
              var $selections = [];
              var selectionIdPrefix = this.$selection.find(".select2-selection__rendered").attr("id") + "-choice-";
              for (var d = 0; d < data.length; d++) {
                var selection = data[d];
                var $selection = this.selectionContainer();
                var formatted = this.display(selection, $selection);
                var selectionId = selectionIdPrefix + Utils.generateChars(4) + "-";
                if (selection.id) {
                  selectionId += selection.id;
                } else {
                  selectionId += Utils.generateChars(4);
                }
                $selection.find(".select2-selection__choice__display").append(formatted).attr("id", selectionId);
                var title = selection.title || selection.text;
                if (title) {
                  $selection.attr("title", title);
                }
                var removeItem = this.options.get("translations").get("removeItem");
                var $remove = $selection.find(".select2-selection__choice__remove");
                $remove.attr("title", removeItem());
                $remove.attr("aria-label", removeItem());
                $remove.attr("aria-describedby", selectionId);
                Utils.StoreData($selection[0], "data", selection);
                $selections.push($selection);
              }
              var $rendered = this.$selection.find(".select2-selection__rendered");
              $rendered.append($selections);
            };
            return MultipleSelection;
          });
          S22.define("select2/selection/placeholder", [], function() {
            function Placeholder(decorated, $element, options) {
              this.placeholder = this.normalizePlaceholder(options.get("placeholder"));
              decorated.call(this, $element, options);
            }
            Placeholder.prototype.normalizePlaceholder = function(_, placeholder) {
              if (typeof placeholder === "string") {
                placeholder = {
                  id: "",
                  text: placeholder
                };
              }
              return placeholder;
            };
            Placeholder.prototype.createPlaceholder = function(decorated, placeholder) {
              var $placeholder = this.selectionContainer();
              $placeholder.html(this.display(placeholder));
              $placeholder[0].classList.add("select2-selection__placeholder");
              $placeholder[0].classList.remove("select2-selection__choice");
              var placeholderTitle = placeholder.title || placeholder.text || $placeholder.text();
              this.$selection.find(".select2-selection__rendered").attr(
                "title",
                placeholderTitle
              );
              return $placeholder;
            };
            Placeholder.prototype.update = function(decorated, data) {
              var singlePlaceholder = data.length == 1 && data[0].id != this.placeholder.id;
              var multipleSelections = data.length > 1;
              if (multipleSelections || singlePlaceholder) {
                return decorated.call(this, data);
              }
              this.clear();
              var $placeholder = this.createPlaceholder(this.placeholder);
              this.$selection.find(".select2-selection__rendered").append($placeholder);
            };
            return Placeholder;
          });
          S22.define("select2/selection/allowClear", [
            "jquery",
            "../keys",
            "../utils"
          ], function($3, KEYS, Utils) {
            function AllowClear() {
            }
            AllowClear.prototype.bind = function(decorated, container, $container) {
              var self = this;
              decorated.call(this, container, $container);
              if (this.placeholder == null) {
                if (this.options.get("debug") && window.console && console.error) {
                  console.error(
                    "Select2: The `allowClear` option should be used in combination with the `placeholder` option."
                  );
                }
              }
              this.$selection.on(
                "mousedown",
                ".select2-selection__clear",
                function(evt) {
                  self._handleClear(evt);
                }
              );
              container.on("keypress", function(evt) {
                self._handleKeyboardClear(evt, container);
              });
            };
            AllowClear.prototype._handleClear = function(_, evt) {
              if (this.isDisabled()) {
                return;
              }
              var $clear = this.$selection.find(".select2-selection__clear");
              if ($clear.length === 0) {
                return;
              }
              evt.stopPropagation();
              var data = Utils.GetData($clear[0], "data");
              var previousVal = this.$element.val();
              this.$element.val(this.placeholder.id);
              var unselectData = {
                data
              };
              this.trigger("clear", unselectData);
              if (unselectData.prevented) {
                this.$element.val(previousVal);
                return;
              }
              for (var d = 0; d < data.length; d++) {
                unselectData = {
                  data: data[d]
                };
                this.trigger("unselect", unselectData);
                if (unselectData.prevented) {
                  this.$element.val(previousVal);
                  return;
                }
              }
              this.$element.trigger("input").trigger("change");
              this.trigger("toggle", {});
            };
            AllowClear.prototype._handleKeyboardClear = function(_, evt, container) {
              if (container.isOpen()) {
                return;
              }
              if (evt.which == KEYS.DELETE || evt.which == KEYS.BACKSPACE) {
                this._handleClear(evt);
              }
            };
            AllowClear.prototype.update = function(decorated, data) {
              decorated.call(this, data);
              this.$selection.find(".select2-selection__clear").remove();
              this.$selection[0].classList.remove("select2-selection--clearable");
              if (this.$selection.find(".select2-selection__placeholder").length > 0 || data.length === 0) {
                return;
              }
              var selectionId = this.$selection.find(".select2-selection__rendered").attr("id");
              var removeAll = this.options.get("translations").get("removeAllItems");
              var $remove = $3(
                '<button type="button" class="select2-selection__clear" tabindex="-1"><span aria-hidden="true">&times;</span></button>'
              );
              $remove.attr("title", removeAll());
              $remove.attr("aria-label", removeAll());
              $remove.attr("aria-describedby", selectionId);
              Utils.StoreData($remove[0], "data", data);
              this.$selection.prepend($remove);
              this.$selection[0].classList.add("select2-selection--clearable");
            };
            return AllowClear;
          });
          S22.define("select2/selection/search", [
            "jquery",
            "../utils",
            "../keys"
          ], function($3, Utils, KEYS) {
            function Search(decorated, $element, options) {
              decorated.call(this, $element, options);
            }
            Search.prototype.render = function(decorated) {
              var searchLabel = this.options.get("translations").get("search");
              var $search = $3(
                '<span class="select2-search select2-search--inline"><textarea class="select2-search__field" type="search" tabindex="-1" autocorrect="off" autocapitalize="none" spellcheck="false" role="searchbox" aria-autocomplete="list" ></textarea></span>'
              );
              this.$searchContainer = $search;
              this.$search = $search.find("textarea");
              this.$search.prop("autocomplete", this.options.get("autocomplete"));
              this.$search.attr("aria-label", searchLabel());
              var $rendered = decorated.call(this);
              this._transferTabIndex();
              $rendered.append(this.$searchContainer);
              return $rendered;
            };
            Search.prototype.bind = function(decorated, container, $container) {
              var self = this;
              var resultsId = container.id + "-results";
              var selectionId = container.id + "-container";
              decorated.call(this, container, $container);
              self.$search.attr("aria-describedby", selectionId);
              container.on("open", function() {
                self.$search.attr("aria-controls", resultsId);
                self.$search.trigger("focus");
              });
              container.on("close", function() {
                self.$search.val("");
                self.resizeSearch();
                self.$search.removeAttr("aria-controls");
                self.$search.removeAttr("aria-activedescendant");
                self.$search.trigger("focus");
              });
              container.on("enable", function() {
                self.$search.prop("disabled", false);
                self._transferTabIndex();
              });
              container.on("disable", function() {
                self.$search.prop("disabled", true);
              });
              container.on("focus", function(evt) {
                self.$search.trigger("focus");
              });
              container.on("results:focus", function(params) {
                if (params.data._resultId) {
                  self.$search.attr("aria-activedescendant", params.data._resultId);
                } else {
                  self.$search.removeAttr("aria-activedescendant");
                }
              });
              this.$selection.on("focusin", ".select2-search--inline", function(evt) {
                self.trigger("focus", evt);
              });
              this.$selection.on("focusout", ".select2-search--inline", function(evt) {
                self._handleBlur(evt);
              });
              this.$selection.on("keydown", ".select2-search--inline", function(evt) {
                evt.stopPropagation();
                self.trigger("keypress", evt);
                self._keyUpPrevented = evt.isDefaultPrevented();
                var key = evt.which;
                if (key === KEYS.BACKSPACE && self.$search.val() === "") {
                  var $previousChoice = self.$selection.find(".select2-selection__choice").last();
                  if ($previousChoice.length > 0) {
                    var item = Utils.GetData($previousChoice[0], "data");
                    self.searchRemoveChoice(item);
                    evt.preventDefault();
                  }
                }
              });
              this.$selection.on("click", ".select2-search--inline", function(evt) {
                if (self.$search.val()) {
                  evt.stopPropagation();
                }
              });
              var msie = document.documentMode;
              var disableInputEvents = msie && msie <= 11;
              this.$selection.on(
                "input.searchcheck",
                ".select2-search--inline",
                function(evt) {
                  if (disableInputEvents) {
                    self.$selection.off("input.search input.searchcheck");
                    return;
                  }
                  self.$selection.off("keyup.search");
                }
              );
              this.$selection.on(
                "keyup.search input.search",
                ".select2-search--inline",
                function(evt) {
                  if (disableInputEvents && evt.type === "input") {
                    self.$selection.off("input.search input.searchcheck");
                    return;
                  }
                  var key = evt.which;
                  if (key == KEYS.SHIFT || key == KEYS.CTRL || key == KEYS.ALT) {
                    return;
                  }
                  if (key == KEYS.TAB) {
                    return;
                  }
                  self.handleSearch(evt);
                }
              );
            };
            Search.prototype._transferTabIndex = function(decorated) {
              this.$search.attr("tabindex", this.$selection.attr("tabindex"));
              this.$selection.attr("tabindex", "-1");
            };
            Search.prototype.createPlaceholder = function(decorated, placeholder) {
              this.$search.attr("placeholder", placeholder.text);
            };
            Search.prototype.update = function(decorated, data) {
              var searchHadFocus = this.$search[0] == document.activeElement;
              this.$search.attr("placeholder", "");
              decorated.call(this, data);
              this.resizeSearch();
              if (searchHadFocus) {
                this.$search.trigger("focus");
              }
            };
            Search.prototype.handleSearch = function() {
              this.resizeSearch();
              if (!this._keyUpPrevented) {
                var input = this.$search.val();
                this.trigger("query", {
                  term: input
                });
              }
              this._keyUpPrevented = false;
            };
            Search.prototype.searchRemoveChoice = function(decorated, item) {
              this.trigger("unselect", {
                data: item
              });
              this.$search.val(item.text);
              this.handleSearch();
            };
            Search.prototype.resizeSearch = function() {
              this.$search.css("width", "25px");
              var width = "100%";
              if (this.$search.attr("placeholder") === "") {
                var minimumWidth = this.$search.val().length + 1;
                width = minimumWidth * 0.75 + "em";
              }
              this.$search.css("width", width);
            };
            return Search;
          });
          S22.define("select2/selection/selectionCss", [
            "../utils"
          ], function(Utils) {
            function SelectionCSS() {
            }
            SelectionCSS.prototype.render = function(decorated) {
              var $selection = decorated.call(this);
              var selectionCssClass = this.options.get("selectionCssClass") || "";
              if (selectionCssClass.indexOf(":all:") !== -1) {
                selectionCssClass = selectionCssClass.replace(":all:", "");
                Utils.copyNonInternalCssClasses($selection[0], this.$element[0]);
              }
              $selection.addClass(selectionCssClass);
              return $selection;
            };
            return SelectionCSS;
          });
          S22.define("select2/selection/eventRelay", [
            "jquery"
          ], function($3) {
            function EventRelay() {
            }
            EventRelay.prototype.bind = function(decorated, container, $container) {
              var self = this;
              var relayEvents = [
                "open",
                "opening",
                "close",
                "closing",
                "select",
                "selecting",
                "unselect",
                "unselecting",
                "clear",
                "clearing"
              ];
              var preventableEvents = [
                "opening",
                "closing",
                "selecting",
                "unselecting",
                "clearing"
              ];
              decorated.call(this, container, $container);
              container.on("*", function(name, params) {
                if (relayEvents.indexOf(name) === -1) {
                  return;
                }
                params = params || {};
                var evt = $3.Event("select2:" + name, {
                  params
                });
                self.$element.trigger(evt);
                if (preventableEvents.indexOf(name) === -1) {
                  return;
                }
                params.prevented = evt.isDefaultPrevented();
              });
            };
            return EventRelay;
          });
          S22.define("select2/translation", [
            "jquery",
            "require"
          ], function($3, require2) {
            function Translation(dict) {
              this.dict = dict || {};
            }
            Translation.prototype.all = function() {
              return this.dict;
            };
            Translation.prototype.get = function(key) {
              return this.dict[key];
            };
            Translation.prototype.extend = function(translation) {
              this.dict = $3.extend({}, translation.all(), this.dict);
            };
            Translation._cache = {};
            Translation.loadPath = function(path) {
              if (!(path in Translation._cache)) {
                var translations = require2(path);
                Translation._cache[path] = translations;
              }
              return new Translation(Translation._cache[path]);
            };
            return Translation;
          });
          S22.define("select2/diacritics", [], function() {
            var diacritics = {
              "\u24B6": "A",
              "\uFF21": "A",
              "\xC0": "A",
              "\xC1": "A",
              "\xC2": "A",
              "\u1EA6": "A",
              "\u1EA4": "A",
              "\u1EAA": "A",
              "\u1EA8": "A",
              "\xC3": "A",
              "\u0100": "A",
              "\u0102": "A",
              "\u1EB0": "A",
              "\u1EAE": "A",
              "\u1EB4": "A",
              "\u1EB2": "A",
              "\u0226": "A",
              "\u01E0": "A",
              "\xC4": "A",
              "\u01DE": "A",
              "\u1EA2": "A",
              "\xC5": "A",
              "\u01FA": "A",
              "\u01CD": "A",
              "\u0200": "A",
              "\u0202": "A",
              "\u1EA0": "A",
              "\u1EAC": "A",
              "\u1EB6": "A",
              "\u1E00": "A",
              "\u0104": "A",
              "\u023A": "A",
              "\u2C6F": "A",
              "\uA732": "AA",
              "\xC6": "AE",
              "\u01FC": "AE",
              "\u01E2": "AE",
              "\uA734": "AO",
              "\uA736": "AU",
              "\uA738": "AV",
              "\uA73A": "AV",
              "\uA73C": "AY",
              "\u24B7": "B",
              "\uFF22": "B",
              "\u1E02": "B",
              "\u1E04": "B",
              "\u1E06": "B",
              "\u0243": "B",
              "\u0182": "B",
              "\u0181": "B",
              "\u24B8": "C",
              "\uFF23": "C",
              "\u0106": "C",
              "\u0108": "C",
              "\u010A": "C",
              "\u010C": "C",
              "\xC7": "C",
              "\u1E08": "C",
              "\u0187": "C",
              "\u023B": "C",
              "\uA73E": "C",
              "\u24B9": "D",
              "\uFF24": "D",
              "\u1E0A": "D",
              "\u010E": "D",
              "\u1E0C": "D",
              "\u1E10": "D",
              "\u1E12": "D",
              "\u1E0E": "D",
              "\u0110": "D",
              "\u018B": "D",
              "\u018A": "D",
              "\u0189": "D",
              "\uA779": "D",
              "\u01F1": "DZ",
              "\u01C4": "DZ",
              "\u01F2": "Dz",
              "\u01C5": "Dz",
              "\u24BA": "E",
              "\uFF25": "E",
              "\xC8": "E",
              "\xC9": "E",
              "\xCA": "E",
              "\u1EC0": "E",
              "\u1EBE": "E",
              "\u1EC4": "E",
              "\u1EC2": "E",
              "\u1EBC": "E",
              "\u0112": "E",
              "\u1E14": "E",
              "\u1E16": "E",
              "\u0114": "E",
              "\u0116": "E",
              "\xCB": "E",
              "\u1EBA": "E",
              "\u011A": "E",
              "\u0204": "E",
              "\u0206": "E",
              "\u1EB8": "E",
              "\u1EC6": "E",
              "\u0228": "E",
              "\u1E1C": "E",
              "\u0118": "E",
              "\u1E18": "E",
              "\u1E1A": "E",
              "\u0190": "E",
              "\u018E": "E",
              "\u24BB": "F",
              "\uFF26": "F",
              "\u1E1E": "F",
              "\u0191": "F",
              "\uA77B": "F",
              "\u24BC": "G",
              "\uFF27": "G",
              "\u01F4": "G",
              "\u011C": "G",
              "\u1E20": "G",
              "\u011E": "G",
              "\u0120": "G",
              "\u01E6": "G",
              "\u0122": "G",
              "\u01E4": "G",
              "\u0193": "G",
              "\uA7A0": "G",
              "\uA77D": "G",
              "\uA77E": "G",
              "\u24BD": "H",
              "\uFF28": "H",
              "\u0124": "H",
              "\u1E22": "H",
              "\u1E26": "H",
              "\u021E": "H",
              "\u1E24": "H",
              "\u1E28": "H",
              "\u1E2A": "H",
              "\u0126": "H",
              "\u2C67": "H",
              "\u2C75": "H",
              "\uA78D": "H",
              "\u24BE": "I",
              "\uFF29": "I",
              "\xCC": "I",
              "\xCD": "I",
              "\xCE": "I",
              "\u0128": "I",
              "\u012A": "I",
              "\u012C": "I",
              "\u0130": "I",
              "\xCF": "I",
              "\u1E2E": "I",
              "\u1EC8": "I",
              "\u01CF": "I",
              "\u0208": "I",
              "\u020A": "I",
              "\u1ECA": "I",
              "\u012E": "I",
              "\u1E2C": "I",
              "\u0197": "I",
              "\u24BF": "J",
              "\uFF2A": "J",
              "\u0134": "J",
              "\u0248": "J",
              "\u24C0": "K",
              "\uFF2B": "K",
              "\u1E30": "K",
              "\u01E8": "K",
              "\u1E32": "K",
              "\u0136": "K",
              "\u1E34": "K",
              "\u0198": "K",
              "\u2C69": "K",
              "\uA740": "K",
              "\uA742": "K",
              "\uA744": "K",
              "\uA7A2": "K",
              "\u24C1": "L",
              "\uFF2C": "L",
              "\u013F": "L",
              "\u0139": "L",
              "\u013D": "L",
              "\u1E36": "L",
              "\u1E38": "L",
              "\u013B": "L",
              "\u1E3C": "L",
              "\u1E3A": "L",
              "\u0141": "L",
              "\u023D": "L",
              "\u2C62": "L",
              "\u2C60": "L",
              "\uA748": "L",
              "\uA746": "L",
              "\uA780": "L",
              "\u01C7": "LJ",
              "\u01C8": "Lj",
              "\u24C2": "M",
              "\uFF2D": "M",
              "\u1E3E": "M",
              "\u1E40": "M",
              "\u1E42": "M",
              "\u2C6E": "M",
              "\u019C": "M",
              "\u24C3": "N",
              "\uFF2E": "N",
              "\u01F8": "N",
              "\u0143": "N",
              "\xD1": "N",
              "\u1E44": "N",
              "\u0147": "N",
              "\u1E46": "N",
              "\u0145": "N",
              "\u1E4A": "N",
              "\u1E48": "N",
              "\u0220": "N",
              "\u019D": "N",
              "\uA790": "N",
              "\uA7A4": "N",
              "\u01CA": "NJ",
              "\u01CB": "Nj",
              "\u24C4": "O",
              "\uFF2F": "O",
              "\xD2": "O",
              "\xD3": "O",
              "\xD4": "O",
              "\u1ED2": "O",
              "\u1ED0": "O",
              "\u1ED6": "O",
              "\u1ED4": "O",
              "\xD5": "O",
              "\u1E4C": "O",
              "\u022C": "O",
              "\u1E4E": "O",
              "\u014C": "O",
              "\u1E50": "O",
              "\u1E52": "O",
              "\u014E": "O",
              "\u022E": "O",
              "\u0230": "O",
              "\xD6": "O",
              "\u022A": "O",
              "\u1ECE": "O",
              "\u0150": "O",
              "\u01D1": "O",
              "\u020C": "O",
              "\u020E": "O",
              "\u01A0": "O",
              "\u1EDC": "O",
              "\u1EDA": "O",
              "\u1EE0": "O",
              "\u1EDE": "O",
              "\u1EE2": "O",
              "\u1ECC": "O",
              "\u1ED8": "O",
              "\u01EA": "O",
              "\u01EC": "O",
              "\xD8": "O",
              "\u01FE": "O",
              "\u0186": "O",
              "\u019F": "O",
              "\uA74A": "O",
              "\uA74C": "O",
              "\u0152": "OE",
              "\u01A2": "OI",
              "\uA74E": "OO",
              "\u0222": "OU",
              "\u24C5": "P",
              "\uFF30": "P",
              "\u1E54": "P",
              "\u1E56": "P",
              "\u01A4": "P",
              "\u2C63": "P",
              "\uA750": "P",
              "\uA752": "P",
              "\uA754": "P",
              "\u24C6": "Q",
              "\uFF31": "Q",
              "\uA756": "Q",
              "\uA758": "Q",
              "\u024A": "Q",
              "\u24C7": "R",
              "\uFF32": "R",
              "\u0154": "R",
              "\u1E58": "R",
              "\u0158": "R",
              "\u0210": "R",
              "\u0212": "R",
              "\u1E5A": "R",
              "\u1E5C": "R",
              "\u0156": "R",
              "\u1E5E": "R",
              "\u024C": "R",
              "\u2C64": "R",
              "\uA75A": "R",
              "\uA7A6": "R",
              "\uA782": "R",
              "\u24C8": "S",
              "\uFF33": "S",
              "\u1E9E": "S",
              "\u015A": "S",
              "\u1E64": "S",
              "\u015C": "S",
              "\u1E60": "S",
              "\u0160": "S",
              "\u1E66": "S",
              "\u1E62": "S",
              "\u1E68": "S",
              "\u0218": "S",
              "\u015E": "S",
              "\u2C7E": "S",
              "\uA7A8": "S",
              "\uA784": "S",
              "\u24C9": "T",
              "\uFF34": "T",
              "\u1E6A": "T",
              "\u0164": "T",
              "\u1E6C": "T",
              "\u021A": "T",
              "\u0162": "T",
              "\u1E70": "T",
              "\u1E6E": "T",
              "\u0166": "T",
              "\u01AC": "T",
              "\u01AE": "T",
              "\u023E": "T",
              "\uA786": "T",
              "\uA728": "TZ",
              "\u24CA": "U",
              "\uFF35": "U",
              "\xD9": "U",
              "\xDA": "U",
              "\xDB": "U",
              "\u0168": "U",
              "\u1E78": "U",
              "\u016A": "U",
              "\u1E7A": "U",
              "\u016C": "U",
              "\xDC": "U",
              "\u01DB": "U",
              "\u01D7": "U",
              "\u01D5": "U",
              "\u01D9": "U",
              "\u1EE6": "U",
              "\u016E": "U",
              "\u0170": "U",
              "\u01D3": "U",
              "\u0214": "U",
              "\u0216": "U",
              "\u01AF": "U",
              "\u1EEA": "U",
              "\u1EE8": "U",
              "\u1EEE": "U",
              "\u1EEC": "U",
              "\u1EF0": "U",
              "\u1EE4": "U",
              "\u1E72": "U",
              "\u0172": "U",
              "\u1E76": "U",
              "\u1E74": "U",
              "\u0244": "U",
              "\u24CB": "V",
              "\uFF36": "V",
              "\u1E7C": "V",
              "\u1E7E": "V",
              "\u01B2": "V",
              "\uA75E": "V",
              "\u0245": "V",
              "\uA760": "VY",
              "\u24CC": "W",
              "\uFF37": "W",
              "\u1E80": "W",
              "\u1E82": "W",
              "\u0174": "W",
              "\u1E86": "W",
              "\u1E84": "W",
              "\u1E88": "W",
              "\u2C72": "W",
              "\u24CD": "X",
              "\uFF38": "X",
              "\u1E8A": "X",
              "\u1E8C": "X",
              "\u24CE": "Y",
              "\uFF39": "Y",
              "\u1EF2": "Y",
              "\xDD": "Y",
              "\u0176": "Y",
              "\u1EF8": "Y",
              "\u0232": "Y",
              "\u1E8E": "Y",
              "\u0178": "Y",
              "\u1EF6": "Y",
              "\u1EF4": "Y",
              "\u01B3": "Y",
              "\u024E": "Y",
              "\u1EFE": "Y",
              "\u24CF": "Z",
              "\uFF3A": "Z",
              "\u0179": "Z",
              "\u1E90": "Z",
              "\u017B": "Z",
              "\u017D": "Z",
              "\u1E92": "Z",
              "\u1E94": "Z",
              "\u01B5": "Z",
              "\u0224": "Z",
              "\u2C7F": "Z",
              "\u2C6B": "Z",
              "\uA762": "Z",
              "\u24D0": "a",
              "\uFF41": "a",
              "\u1E9A": "a",
              "\xE0": "a",
              "\xE1": "a",
              "\xE2": "a",
              "\u1EA7": "a",
              "\u1EA5": "a",
              "\u1EAB": "a",
              "\u1EA9": "a",
              "\xE3": "a",
              "\u0101": "a",
              "\u0103": "a",
              "\u1EB1": "a",
              "\u1EAF": "a",
              "\u1EB5": "a",
              "\u1EB3": "a",
              "\u0227": "a",
              "\u01E1": "a",
              "\xE4": "a",
              "\u01DF": "a",
              "\u1EA3": "a",
              "\xE5": "a",
              "\u01FB": "a",
              "\u01CE": "a",
              "\u0201": "a",
              "\u0203": "a",
              "\u1EA1": "a",
              "\u1EAD": "a",
              "\u1EB7": "a",
              "\u1E01": "a",
              "\u0105": "a",
              "\u2C65": "a",
              "\u0250": "a",
              "\uA733": "aa",
              "\xE6": "ae",
              "\u01FD": "ae",
              "\u01E3": "ae",
              "\uA735": "ao",
              "\uA737": "au",
              "\uA739": "av",
              "\uA73B": "av",
              "\uA73D": "ay",
              "\u24D1": "b",
              "\uFF42": "b",
              "\u1E03": "b",
              "\u1E05": "b",
              "\u1E07": "b",
              "\u0180": "b",
              "\u0183": "b",
              "\u0253": "b",
              "\u24D2": "c",
              "\uFF43": "c",
              "\u0107": "c",
              "\u0109": "c",
              "\u010B": "c",
              "\u010D": "c",
              "\xE7": "c",
              "\u1E09": "c",
              "\u0188": "c",
              "\u023C": "c",
              "\uA73F": "c",
              "\u2184": "c",
              "\u24D3": "d",
              "\uFF44": "d",
              "\u1E0B": "d",
              "\u010F": "d",
              "\u1E0D": "d",
              "\u1E11": "d",
              "\u1E13": "d",
              "\u1E0F": "d",
              "\u0111": "d",
              "\u018C": "d",
              "\u0256": "d",
              "\u0257": "d",
              "\uA77A": "d",
              "\u01F3": "dz",
              "\u01C6": "dz",
              "\u24D4": "e",
              "\uFF45": "e",
              "\xE8": "e",
              "\xE9": "e",
              "\xEA": "e",
              "\u1EC1": "e",
              "\u1EBF": "e",
              "\u1EC5": "e",
              "\u1EC3": "e",
              "\u1EBD": "e",
              "\u0113": "e",
              "\u1E15": "e",
              "\u1E17": "e",
              "\u0115": "e",
              "\u0117": "e",
              "\xEB": "e",
              "\u1EBB": "e",
              "\u011B": "e",
              "\u0205": "e",
              "\u0207": "e",
              "\u1EB9": "e",
              "\u1EC7": "e",
              "\u0229": "e",
              "\u1E1D": "e",
              "\u0119": "e",
              "\u1E19": "e",
              "\u1E1B": "e",
              "\u0247": "e",
              "\u025B": "e",
              "\u01DD": "e",
              "\u24D5": "f",
              "\uFF46": "f",
              "\u1E1F": "f",
              "\u0192": "f",
              "\uA77C": "f",
              "\u24D6": "g",
              "\uFF47": "g",
              "\u01F5": "g",
              "\u011D": "g",
              "\u1E21": "g",
              "\u011F": "g",
              "\u0121": "g",
              "\u01E7": "g",
              "\u0123": "g",
              "\u01E5": "g",
              "\u0260": "g",
              "\uA7A1": "g",
              "\u1D79": "g",
              "\uA77F": "g",
              "\u24D7": "h",
              "\uFF48": "h",
              "\u0125": "h",
              "\u1E23": "h",
              "\u1E27": "h",
              "\u021F": "h",
              "\u1E25": "h",
              "\u1E29": "h",
              "\u1E2B": "h",
              "\u1E96": "h",
              "\u0127": "h",
              "\u2C68": "h",
              "\u2C76": "h",
              "\u0265": "h",
              "\u0195": "hv",
              "\u24D8": "i",
              "\uFF49": "i",
              "\xEC": "i",
              "\xED": "i",
              "\xEE": "i",
              "\u0129": "i",
              "\u012B": "i",
              "\u012D": "i",
              "\xEF": "i",
              "\u1E2F": "i",
              "\u1EC9": "i",
              "\u01D0": "i",
              "\u0209": "i",
              "\u020B": "i",
              "\u1ECB": "i",
              "\u012F": "i",
              "\u1E2D": "i",
              "\u0268": "i",
              "\u0131": "i",
              "\u24D9": "j",
              "\uFF4A": "j",
              "\u0135": "j",
              "\u01F0": "j",
              "\u0249": "j",
              "\u24DA": "k",
              "\uFF4B": "k",
              "\u1E31": "k",
              "\u01E9": "k",
              "\u1E33": "k",
              "\u0137": "k",
              "\u1E35": "k",
              "\u0199": "k",
              "\u2C6A": "k",
              "\uA741": "k",
              "\uA743": "k",
              "\uA745": "k",
              "\uA7A3": "k",
              "\u24DB": "l",
              "\uFF4C": "l",
              "\u0140": "l",
              "\u013A": "l",
              "\u013E": "l",
              "\u1E37": "l",
              "\u1E39": "l",
              "\u013C": "l",
              "\u1E3D": "l",
              "\u1E3B": "l",
              "\u017F": "l",
              "\u0142": "l",
              "\u019A": "l",
              "\u026B": "l",
              "\u2C61": "l",
              "\uA749": "l",
              "\uA781": "l",
              "\uA747": "l",
              "\u01C9": "lj",
              "\u24DC": "m",
              "\uFF4D": "m",
              "\u1E3F": "m",
              "\u1E41": "m",
              "\u1E43": "m",
              "\u0271": "m",
              "\u026F": "m",
              "\u24DD": "n",
              "\uFF4E": "n",
              "\u01F9": "n",
              "\u0144": "n",
              "\xF1": "n",
              "\u1E45": "n",
              "\u0148": "n",
              "\u1E47": "n",
              "\u0146": "n",
              "\u1E4B": "n",
              "\u1E49": "n",
              "\u019E": "n",
              "\u0272": "n",
              "\u0149": "n",
              "\uA791": "n",
              "\uA7A5": "n",
              "\u01CC": "nj",
              "\u24DE": "o",
              "\uFF4F": "o",
              "\xF2": "o",
              "\xF3": "o",
              "\xF4": "o",
              "\u1ED3": "o",
              "\u1ED1": "o",
              "\u1ED7": "o",
              "\u1ED5": "o",
              "\xF5": "o",
              "\u1E4D": "o",
              "\u022D": "o",
              "\u1E4F": "o",
              "\u014D": "o",
              "\u1E51": "o",
              "\u1E53": "o",
              "\u014F": "o",
              "\u022F": "o",
              "\u0231": "o",
              "\xF6": "o",
              "\u022B": "o",
              "\u1ECF": "o",
              "\u0151": "o",
              "\u01D2": "o",
              "\u020D": "o",
              "\u020F": "o",
              "\u01A1": "o",
              "\u1EDD": "o",
              "\u1EDB": "o",
              "\u1EE1": "o",
              "\u1EDF": "o",
              "\u1EE3": "o",
              "\u1ECD": "o",
              "\u1ED9": "o",
              "\u01EB": "o",
              "\u01ED": "o",
              "\xF8": "o",
              "\u01FF": "o",
              "\u0254": "o",
              "\uA74B": "o",
              "\uA74D": "o",
              "\u0275": "o",
              "\u0153": "oe",
              "\u01A3": "oi",
              "\u0223": "ou",
              "\uA74F": "oo",
              "\u24DF": "p",
              "\uFF50": "p",
              "\u1E55": "p",
              "\u1E57": "p",
              "\u01A5": "p",
              "\u1D7D": "p",
              "\uA751": "p",
              "\uA753": "p",
              "\uA755": "p",
              "\u24E0": "q",
              "\uFF51": "q",
              "\u024B": "q",
              "\uA757": "q",
              "\uA759": "q",
              "\u24E1": "r",
              "\uFF52": "r",
              "\u0155": "r",
              "\u1E59": "r",
              "\u0159": "r",
              "\u0211": "r",
              "\u0213": "r",
              "\u1E5B": "r",
              "\u1E5D": "r",
              "\u0157": "r",
              "\u1E5F": "r",
              "\u024D": "r",
              "\u027D": "r",
              "\uA75B": "r",
              "\uA7A7": "r",
              "\uA783": "r",
              "\u24E2": "s",
              "\uFF53": "s",
              "\xDF": "s",
              "\u015B": "s",
              "\u1E65": "s",
              "\u015D": "s",
              "\u1E61": "s",
              "\u0161": "s",
              "\u1E67": "s",
              "\u1E63": "s",
              "\u1E69": "s",
              "\u0219": "s",
              "\u015F": "s",
              "\u023F": "s",
              "\uA7A9": "s",
              "\uA785": "s",
              "\u1E9B": "s",
              "\u24E3": "t",
              "\uFF54": "t",
              "\u1E6B": "t",
              "\u1E97": "t",
              "\u0165": "t",
              "\u1E6D": "t",
              "\u021B": "t",
              "\u0163": "t",
              "\u1E71": "t",
              "\u1E6F": "t",
              "\u0167": "t",
              "\u01AD": "t",
              "\u0288": "t",
              "\u2C66": "t",
              "\uA787": "t",
              "\uA729": "tz",
              "\u24E4": "u",
              "\uFF55": "u",
              "\xF9": "u",
              "\xFA": "u",
              "\xFB": "u",
              "\u0169": "u",
              "\u1E79": "u",
              "\u016B": "u",
              "\u1E7B": "u",
              "\u016D": "u",
              "\xFC": "u",
              "\u01DC": "u",
              "\u01D8": "u",
              "\u01D6": "u",
              "\u01DA": "u",
              "\u1EE7": "u",
              "\u016F": "u",
              "\u0171": "u",
              "\u01D4": "u",
              "\u0215": "u",
              "\u0217": "u",
              "\u01B0": "u",
              "\u1EEB": "u",
              "\u1EE9": "u",
              "\u1EEF": "u",
              "\u1EED": "u",
              "\u1EF1": "u",
              "\u1EE5": "u",
              "\u1E73": "u",
              "\u0173": "u",
              "\u1E77": "u",
              "\u1E75": "u",
              "\u0289": "u",
              "\u24E5": "v",
              "\uFF56": "v",
              "\u1E7D": "v",
              "\u1E7F": "v",
              "\u028B": "v",
              "\uA75F": "v",
              "\u028C": "v",
              "\uA761": "vy",
              "\u24E6": "w",
              "\uFF57": "w",
              "\u1E81": "w",
              "\u1E83": "w",
              "\u0175": "w",
              "\u1E87": "w",
              "\u1E85": "w",
              "\u1E98": "w",
              "\u1E89": "w",
              "\u2C73": "w",
              "\u24E7": "x",
              "\uFF58": "x",
              "\u1E8B": "x",
              "\u1E8D": "x",
              "\u24E8": "y",
              "\uFF59": "y",
              "\u1EF3": "y",
              "\xFD": "y",
              "\u0177": "y",
              "\u1EF9": "y",
              "\u0233": "y",
              "\u1E8F": "y",
              "\xFF": "y",
              "\u1EF7": "y",
              "\u1E99": "y",
              "\u1EF5": "y",
              "\u01B4": "y",
              "\u024F": "y",
              "\u1EFF": "y",
              "\u24E9": "z",
              "\uFF5A": "z",
              "\u017A": "z",
              "\u1E91": "z",
              "\u017C": "z",
              "\u017E": "z",
              "\u1E93": "z",
              "\u1E95": "z",
              "\u01B6": "z",
              "\u0225": "z",
              "\u0240": "z",
              "\u2C6C": "z",
              "\uA763": "z",
              "\u0386": "\u0391",
              "\u0388": "\u0395",
              "\u0389": "\u0397",
              "\u038A": "\u0399",
              "\u03AA": "\u0399",
              "\u038C": "\u039F",
              "\u038E": "\u03A5",
              "\u03AB": "\u03A5",
              "\u038F": "\u03A9",
              "\u03AC": "\u03B1",
              "\u03AD": "\u03B5",
              "\u03AE": "\u03B7",
              "\u03AF": "\u03B9",
              "\u03CA": "\u03B9",
              "\u0390": "\u03B9",
              "\u03CC": "\u03BF",
              "\u03CD": "\u03C5",
              "\u03CB": "\u03C5",
              "\u03B0": "\u03C5",
              "\u03CE": "\u03C9",
              "\u03C2": "\u03C3",
              "\u2019": "'"
            };
            return diacritics;
          });
          S22.define("select2/data/base", [
            "../utils"
          ], function(Utils) {
            function BaseAdapter($element, options) {
              BaseAdapter.__super__.constructor.call(this);
            }
            Utils.Extend(BaseAdapter, Utils.Observable);
            BaseAdapter.prototype.current = function(callback) {
              throw new Error("The `current` method must be defined in child classes.");
            };
            BaseAdapter.prototype.query = function(params, callback) {
              throw new Error("The `query` method must be defined in child classes.");
            };
            BaseAdapter.prototype.bind = function(container, $container) {
            };
            BaseAdapter.prototype.destroy = function() {
            };
            BaseAdapter.prototype.generateResultId = function(container, data) {
              var id = container.id + "-result-";
              id += Utils.generateChars(4);
              if (data.id != null) {
                id += "-" + data.id.toString();
              } else {
                id += "-" + Utils.generateChars(4);
              }
              return id;
            };
            return BaseAdapter;
          });
          S22.define("select2/data/select", [
            "./base",
            "../utils",
            "jquery"
          ], function(BaseAdapter, Utils, $3) {
            function SelectAdapter($element, options) {
              this.$element = $element;
              this.options = options;
              SelectAdapter.__super__.constructor.call(this);
            }
            Utils.Extend(SelectAdapter, BaseAdapter);
            SelectAdapter.prototype.current = function(callback) {
              var self = this;
              var data = Array.prototype.map.call(
                this.$element[0].querySelectorAll(":checked"),
                function(selectedElement) {
                  return self.item($3(selectedElement));
                }
              );
              callback(data);
            };
            SelectAdapter.prototype.select = function(data) {
              var self = this;
              data.selected = true;
              if (data.element != null && data.element.tagName.toLowerCase() === "option") {
                data.element.selected = true;
                this.$element.trigger("input").trigger("change");
                return;
              }
              if (this.$element.prop("multiple")) {
                this.current(function(currentData) {
                  var val2 = [];
                  data = [data];
                  data.push.apply(data, currentData);
                  for (var d = 0; d < data.length; d++) {
                    var id = data[d].id;
                    if (val2.indexOf(id) === -1) {
                      val2.push(id);
                    }
                  }
                  self.$element.val(val2);
                  self.$element.trigger("input").trigger("change");
                });
              } else {
                var val = data.id;
                this.$element.val(val);
                this.$element.trigger("input").trigger("change");
              }
            };
            SelectAdapter.prototype.unselect = function(data) {
              var self = this;
              if (!this.$element.prop("multiple")) {
                return;
              }
              data.selected = false;
              if (data.element != null && data.element.tagName.toLowerCase() === "option") {
                data.element.selected = false;
                this.$element.trigger("input").trigger("change");
                return;
              }
              this.current(function(currentData) {
                var val = [];
                for (var d = 0; d < currentData.length; d++) {
                  var id = currentData[d].id;
                  if (id !== data.id && val.indexOf(id) === -1) {
                    val.push(id);
                  }
                }
                self.$element.val(val);
                self.$element.trigger("input").trigger("change");
              });
            };
            SelectAdapter.prototype.bind = function(container, $container) {
              var self = this;
              this.container = container;
              container.on("select", function(params) {
                self.select(params.data);
              });
              container.on("unselect", function(params) {
                self.unselect(params.data);
              });
            };
            SelectAdapter.prototype.destroy = function() {
              this.$element.find("*").each(function() {
                Utils.RemoveData(this);
              });
            };
            SelectAdapter.prototype.query = function(params, callback) {
              var data = [];
              var self = this;
              var $options = this.$element.children();
              $options.each(function() {
                if (this.tagName.toLowerCase() !== "option" && this.tagName.toLowerCase() !== "optgroup") {
                  return;
                }
                var $option = $3(this);
                var option = self.item($option);
                var matches = self.matches(params, option);
                if (matches !== null) {
                  data.push(matches);
                }
              });
              callback({
                results: data
              });
            };
            SelectAdapter.prototype.addOptions = function($options) {
              this.$element.append($options);
            };
            SelectAdapter.prototype.option = function(data) {
              var option;
              if (data.children) {
                option = document.createElement("optgroup");
                option.label = data.text;
              } else {
                option = document.createElement("option");
                if (option.textContent !== void 0) {
                  option.textContent = data.text;
                } else {
                  option.innerText = data.text;
                }
              }
              if (data.id !== void 0) {
                option.value = data.id;
              }
              if (data.disabled) {
                option.disabled = true;
              }
              if (data.selected) {
                option.selected = true;
              }
              if (data.title) {
                option.title = data.title;
              }
              var normalizedData = this._normalizeItem(data);
              normalizedData.element = option;
              Utils.StoreData(option, "data", normalizedData);
              return $3(option);
            };
            SelectAdapter.prototype.item = function($option) {
              var data = {};
              data = Utils.GetData($option[0], "data");
              if (data != null) {
                return data;
              }
              var option = $option[0];
              if (option.tagName.toLowerCase() === "option") {
                data = {
                  id: $option.val(),
                  text: $option.text(),
                  disabled: $option.prop("disabled"),
                  selected: $option.prop("selected"),
                  title: $option.prop("title")
                };
              } else if (option.tagName.toLowerCase() === "optgroup") {
                data = {
                  text: $option.prop("label"),
                  children: [],
                  title: $option.prop("title")
                };
                var $children = $option.children("option");
                var children = [];
                for (var c = 0; c < $children.length; c++) {
                  var $child = $3($children[c]);
                  var child = this.item($child);
                  children.push(child);
                }
                data.children = children;
              }
              data = this._normalizeItem(data);
              data.element = $option[0];
              Utils.StoreData($option[0], "data", data);
              return data;
            };
            SelectAdapter.prototype._normalizeItem = function(item) {
              if (item !== Object(item)) {
                item = {
                  id: item,
                  text: item
                };
              }
              item = $3.extend({}, {
                text: ""
              }, item);
              var defaults = {
                selected: false,
                disabled: false
              };
              if (item.id != null) {
                item.id = item.id.toString();
              }
              if (item.text != null) {
                item.text = item.text.toString();
              }
              if (item._resultId == null && item.id && this.container != null) {
                item._resultId = this.generateResultId(this.container, item);
              }
              return $3.extend({}, defaults, item);
            };
            SelectAdapter.prototype.matches = function(params, data) {
              var matcher = this.options.get("matcher");
              return matcher(params, data);
            };
            return SelectAdapter;
          });
          S22.define("select2/data/array", [
            "./select",
            "../utils",
            "jquery"
          ], function(SelectAdapter, Utils, $3) {
            function ArrayAdapter($element, options) {
              this._dataToConvert = options.get("data") || [];
              ArrayAdapter.__super__.constructor.call(this, $element, options);
            }
            Utils.Extend(ArrayAdapter, SelectAdapter);
            ArrayAdapter.prototype.bind = function(container, $container) {
              ArrayAdapter.__super__.bind.call(this, container, $container);
              this.addOptions(this.convertToOptions(this._dataToConvert));
            };
            ArrayAdapter.prototype.select = function(data) {
              var $option = this.$element.find("option").filter(function(i, elm) {
                return elm.value == data.id.toString();
              });
              if ($option.length === 0) {
                $option = this.option(data);
                this.addOptions($option);
              }
              ArrayAdapter.__super__.select.call(this, data);
            };
            ArrayAdapter.prototype.convertToOptions = function(data) {
              var self = this;
              var $existing = this.$element.find("option");
              var existingIds = $existing.map(function() {
                return self.item($3(this)).id;
              }).get();
              var $options = [];
              function onlyItem(item2) {
                return function() {
                  return $3(this).val() == item2.id;
                };
              }
              for (var d = 0; d < data.length; d++) {
                var item = this._normalizeItem(data[d]);
                if (existingIds.indexOf(item.id) >= 0) {
                  var $existingOption = $existing.filter(onlyItem(item));
                  var existingData = this.item($existingOption);
                  var newData = $3.extend(true, {}, item, existingData);
                  var $newOption = this.option(newData);
                  $existingOption.replaceWith($newOption);
                  continue;
                }
                var $option = this.option(item);
                if (item.children) {
                  var $children = this.convertToOptions(item.children);
                  $option.append($children);
                }
                $options.push($option);
              }
              return $options;
            };
            return ArrayAdapter;
          });
          S22.define("select2/data/ajax", [
            "./array",
            "../utils",
            "jquery"
          ], function(ArrayAdapter, Utils, $3) {
            function AjaxAdapter($element, options) {
              this.ajaxOptions = this._applyDefaults(options.get("ajax"));
              if (this.ajaxOptions.processResults != null) {
                this.processResults = this.ajaxOptions.processResults;
              }
              AjaxAdapter.__super__.constructor.call(this, $element, options);
            }
            Utils.Extend(AjaxAdapter, ArrayAdapter);
            AjaxAdapter.prototype._applyDefaults = function(options) {
              var defaults = {
                data: function(params) {
                  return $3.extend({}, params, {
                    q: params.term
                  });
                },
                transport: function(params, success, failure) {
                  var $request = $3.ajax(params);
                  $request.then(success);
                  $request.fail(failure);
                  return $request;
                }
              };
              return $3.extend({}, defaults, options, true);
            };
            AjaxAdapter.prototype.processResults = function(results) {
              return results;
            };
            AjaxAdapter.prototype.query = function(params, callback) {
              var matches = [];
              var self = this;
              if (this._request != null) {
                if (typeof this._request.abort === "function") {
                  this._request.abort();
                }
                this._request = null;
              }
              var options = $3.extend({
                type: "GET"
              }, this.ajaxOptions);
              if (typeof options.url === "function") {
                options.url = options.url.call(this.$element, params);
              }
              if (typeof options.data === "function") {
                options.data = options.data.call(this.$element, params);
              }
              function request() {
                var $request = options.transport(options, function(data) {
                  var results = self.processResults(data, params);
                  if (self.options.get("debug") && window.console && console.error) {
                    if (!results || !results.results || !Array.isArray(results.results)) {
                      console.error(
                        "Select2: The AJAX results did not return an array in the `results` key of the response."
                      );
                    }
                  }
                  callback(results);
                }, function() {
                  if ("status" in $request && ($request.status === 0 || $request.status === "0")) {
                    return;
                  }
                  self.trigger("results:message", {
                    message: "errorLoading"
                  });
                });
                self._request = $request;
              }
              if (this.ajaxOptions.delay && params.term != null) {
                if (this._queryTimeout) {
                  window.clearTimeout(this._queryTimeout);
                }
                this._queryTimeout = window.setTimeout(request, this.ajaxOptions.delay);
              } else {
                request();
              }
            };
            return AjaxAdapter;
          });
          S22.define("select2/data/tags", [
            "jquery"
          ], function($3) {
            function Tags(decorated, $element, options) {
              var tags = options.get("tags");
              var createTag = options.get("createTag");
              if (createTag !== void 0) {
                this.createTag = createTag;
              }
              var insertTag = options.get("insertTag");
              if (insertTag !== void 0) {
                this.insertTag = insertTag;
              }
              decorated.call(this, $element, options);
              if (Array.isArray(tags)) {
                for (var t = 0; t < tags.length; t++) {
                  var tag = tags[t];
                  var item = this._normalizeItem(tag);
                  var $option = this.option(item);
                  this.$element.append($option);
                }
              }
            }
            Tags.prototype.query = function(decorated, params, callback) {
              var self = this;
              this._removeOldTags();
              if (params.term == null || params.page != null) {
                decorated.call(this, params, callback);
                return;
              }
              function wrapper(obj, child) {
                var data = obj.results;
                for (var i = 0; i < data.length; i++) {
                  var option = data[i];
                  var checkChildren = option.children != null && !wrapper({
                    results: option.children
                  }, true);
                  var optionText = (option.text || "").toUpperCase();
                  var paramsTerm = (params.term || "").toUpperCase();
                  var checkText = optionText === paramsTerm;
                  if (checkText || checkChildren) {
                    if (child) {
                      return false;
                    }
                    obj.data = data;
                    callback(obj);
                    return;
                  }
                }
                if (child) {
                  return true;
                }
                var tag = self.createTag(params);
                if (tag != null) {
                  var $option = self.option(tag);
                  $option.attr("data-select2-tag", "true");
                  self.addOptions([$option]);
                  self.insertTag(data, tag);
                }
                obj.results = data;
                callback(obj);
              }
              decorated.call(this, params, wrapper);
            };
            Tags.prototype.createTag = function(decorated, params) {
              if (params.term == null) {
                return null;
              }
              var term = params.term.trim();
              if (term === "") {
                return null;
              }
              return {
                id: term,
                text: term
              };
            };
            Tags.prototype.insertTag = function(_, data, tag) {
              data.unshift(tag);
            };
            Tags.prototype._removeOldTags = function(_) {
              var $options = this.$element.find("option[data-select2-tag]");
              $options.each(function() {
                if (this.selected) {
                  return;
                }
                $3(this).remove();
              });
            };
            return Tags;
          });
          S22.define("select2/data/tokenizer", [
            "jquery"
          ], function($3) {
            function Tokenizer(decorated, $element, options) {
              var tokenizer = options.get("tokenizer");
              if (tokenizer !== void 0) {
                this.tokenizer = tokenizer;
              }
              decorated.call(this, $element, options);
            }
            Tokenizer.prototype.bind = function(decorated, container, $container) {
              decorated.call(this, container, $container);
              this.$search = container.dropdown.$search || container.selection.$search || $container.find(".select2-search__field");
            };
            Tokenizer.prototype.query = function(decorated, params, callback) {
              var self = this;
              function createAndSelect(data) {
                var item = self._normalizeItem(data);
                var $existingOptions = self.$element.find("option").filter(function() {
                  return $3(this).val() === item.id;
                });
                if (!$existingOptions.length) {
                  var $option = self.option(item);
                  $option.attr("data-select2-tag", true);
                  self._removeOldTags();
                  self.addOptions([$option]);
                }
                select(item);
              }
              function select(data) {
                self.trigger("select", {
                  data
                });
              }
              params.term = params.term || "";
              var tokenData = this.tokenizer(params, this.options, createAndSelect);
              if (tokenData.term !== params.term) {
                if (this.$search.length) {
                  this.$search.val(tokenData.term);
                  this.$search.trigger("focus");
                }
                params.term = tokenData.term;
              }
              decorated.call(this, params, callback);
            };
            Tokenizer.prototype.tokenizer = function(_, params, options, callback) {
              var separators = options.get("tokenSeparators") || [];
              var term = params.term;
              var i = 0;
              var createTag = this.createTag || function(params2) {
                return {
                  id: params2.term,
                  text: params2.term
                };
              };
              while (i < term.length) {
                var termChar = term[i];
                if (separators.indexOf(termChar) === -1) {
                  i++;
                  continue;
                }
                var part = term.substr(0, i);
                var partParams = $3.extend({}, params, {
                  term: part
                });
                var data = createTag(partParams);
                if (data == null) {
                  i++;
                  continue;
                }
                callback(data);
                term = term.substr(i + 1) || "";
                i = 0;
              }
              return {
                term
              };
            };
            return Tokenizer;
          });
          S22.define("select2/data/minimumInputLength", [], function() {
            function MinimumInputLength(decorated, $e, options) {
              this.minimumInputLength = options.get("minimumInputLength");
              decorated.call(this, $e, options);
            }
            MinimumInputLength.prototype.query = function(decorated, params, callback) {
              params.term = params.term || "";
              if (params.term.length < this.minimumInputLength) {
                this.trigger("results:message", {
                  message: "inputTooShort",
                  args: {
                    minimum: this.minimumInputLength,
                    input: params.term,
                    params
                  }
                });
                return;
              }
              decorated.call(this, params, callback);
            };
            return MinimumInputLength;
          });
          S22.define("select2/data/maximumInputLength", [], function() {
            function MaximumInputLength(decorated, $e, options) {
              this.maximumInputLength = options.get("maximumInputLength");
              decorated.call(this, $e, options);
            }
            MaximumInputLength.prototype.query = function(decorated, params, callback) {
              params.term = params.term || "";
              if (this.maximumInputLength > 0 && params.term.length > this.maximumInputLength) {
                this.trigger("results:message", {
                  message: "inputTooLong",
                  args: {
                    maximum: this.maximumInputLength,
                    input: params.term,
                    params
                  }
                });
                return;
              }
              decorated.call(this, params, callback);
            };
            return MaximumInputLength;
          });
          S22.define("select2/data/maximumSelectionLength", [], function() {
            function MaximumSelectionLength(decorated, $e, options) {
              this.maximumSelectionLength = options.get("maximumSelectionLength");
              decorated.call(this, $e, options);
            }
            MaximumSelectionLength.prototype.bind = function(decorated, container, $container) {
              var self = this;
              decorated.call(this, container, $container);
              container.on("select", function() {
                self._checkIfMaximumSelected();
              });
            };
            MaximumSelectionLength.prototype.query = function(decorated, params, callback) {
              var self = this;
              this._checkIfMaximumSelected(function() {
                decorated.call(self, params, callback);
              });
            };
            MaximumSelectionLength.prototype._checkIfMaximumSelected = function(_, successCallback) {
              var self = this;
              this.current(function(currentData) {
                var count = currentData != null ? currentData.length : 0;
                if (self.maximumSelectionLength > 0 && count >= self.maximumSelectionLength) {
                  self.trigger("results:message", {
                    message: "maximumSelected",
                    args: {
                      maximum: self.maximumSelectionLength
                    }
                  });
                  return;
                }
                if (successCallback) {
                  successCallback();
                }
              });
            };
            return MaximumSelectionLength;
          });
          S22.define("select2/dropdown", [
            "jquery",
            "./utils"
          ], function($3, Utils) {
            function Dropdown($element, options) {
              this.$element = $element;
              this.options = options;
              Dropdown.__super__.constructor.call(this);
            }
            Utils.Extend(Dropdown, Utils.Observable);
            Dropdown.prototype.render = function() {
              var $dropdown = $3(
                '<span class="select2-dropdown"><span class="select2-results"></span></span>'
              );
              $dropdown.attr("dir", this.options.get("dir"));
              this.$dropdown = $dropdown;
              return $dropdown;
            };
            Dropdown.prototype.bind = function() {
            };
            Dropdown.prototype.position = function($dropdown, $container) {
            };
            Dropdown.prototype.destroy = function() {
              this.$dropdown.remove();
            };
            return Dropdown;
          });
          S22.define("select2/dropdown/search", [
            "jquery"
          ], function($3) {
            function Search() {
            }
            Search.prototype.render = function(decorated) {
              var $rendered = decorated.call(this);
              var searchLabel = this.options.get("translations").get("search");
              var $search = $3(
                '<span class="select2-search select2-search--dropdown"><input class="select2-search__field" type="search" tabindex="-1" autocorrect="off" autocapitalize="none" spellcheck="false" role="searchbox" aria-autocomplete="list" /></span>'
              );
              this.$searchContainer = $search;
              this.$search = $search.find("input");
              this.$search.prop("autocomplete", this.options.get("autocomplete"));
              this.$search.attr("aria-label", searchLabel());
              $rendered.prepend($search);
              return $rendered;
            };
            Search.prototype.bind = function(decorated, container, $container) {
              var self = this;
              var resultsId = container.id + "-results";
              decorated.call(this, container, $container);
              this.$search.on("keydown", function(evt) {
                self.trigger("keypress", evt);
                self._keyUpPrevented = evt.isDefaultPrevented();
              });
              this.$search.on("input", function(evt) {
                $3(this).off("keyup");
              });
              this.$search.on("keyup input", function(evt) {
                self.handleSearch(evt);
              });
              container.on("open", function() {
                self.$search.attr("tabindex", 0);
                self.$search.attr("aria-controls", resultsId);
                self.$search.trigger("focus");
                window.setTimeout(function() {
                  self.$search.trigger("focus");
                }, 0);
              });
              container.on("close", function() {
                self.$search.attr("tabindex", -1);
                self.$search.removeAttr("aria-controls");
                self.$search.removeAttr("aria-activedescendant");
                self.$search.val("");
                self.$search.trigger("blur");
              });
              container.on("focus", function() {
                if (!container.isOpen()) {
                  self.$search.trigger("focus");
                }
              });
              container.on("results:all", function(params) {
                if (params.query.term == null || params.query.term === "") {
                  var showSearch = self.showSearch(params);
                  if (showSearch) {
                    self.$searchContainer[0].classList.remove("select2-search--hide");
                  } else {
                    self.$searchContainer[0].classList.add("select2-search--hide");
                  }
                }
              });
              container.on("results:focus", function(params) {
                if (params.data._resultId) {
                  self.$search.attr("aria-activedescendant", params.data._resultId);
                } else {
                  self.$search.removeAttr("aria-activedescendant");
                }
              });
            };
            Search.prototype.handleSearch = function(evt) {
              if (!this._keyUpPrevented) {
                var input = this.$search.val();
                this.trigger("query", {
                  term: input
                });
              }
              this._keyUpPrevented = false;
            };
            Search.prototype.showSearch = function(_, params) {
              return true;
            };
            return Search;
          });
          S22.define("select2/dropdown/hidePlaceholder", [], function() {
            function HidePlaceholder(decorated, $element, options, dataAdapter) {
              this.placeholder = this.normalizePlaceholder(options.get("placeholder"));
              decorated.call(this, $element, options, dataAdapter);
            }
            HidePlaceholder.prototype.append = function(decorated, data) {
              data.results = this.removePlaceholder(data.results);
              decorated.call(this, data);
            };
            HidePlaceholder.prototype.normalizePlaceholder = function(_, placeholder) {
              if (typeof placeholder === "string") {
                placeholder = {
                  id: "",
                  text: placeholder
                };
              }
              return placeholder;
            };
            HidePlaceholder.prototype.removePlaceholder = function(_, data) {
              var modifiedData = data.slice(0);
              for (var d = data.length - 1; d >= 0; d--) {
                var item = data[d];
                if (this.placeholder.id === item.id) {
                  modifiedData.splice(d, 1);
                }
              }
              return modifiedData;
            };
            return HidePlaceholder;
          });
          S22.define("select2/dropdown/infiniteScroll", [
            "jquery"
          ], function($3) {
            function InfiniteScroll(decorated, $element, options, dataAdapter) {
              this.lastParams = {};
              decorated.call(this, $element, options, dataAdapter);
              this.$loadingMore = this.createLoadingMore();
              this.loading = false;
            }
            InfiniteScroll.prototype.append = function(decorated, data) {
              this.$loadingMore.remove();
              this.loading = false;
              decorated.call(this, data);
              if (this.showLoadingMore(data)) {
                this.$results.append(this.$loadingMore);
                this.loadMoreIfNeeded();
              }
            };
            InfiniteScroll.prototype.bind = function(decorated, container, $container) {
              var self = this;
              decorated.call(this, container, $container);
              container.on("query", function(params) {
                self.lastParams = params;
                self.loading = true;
              });
              container.on("query:append", function(params) {
                self.lastParams = params;
                self.loading = true;
              });
              this.$results.on("scroll", this.loadMoreIfNeeded.bind(this));
            };
            InfiniteScroll.prototype.loadMoreIfNeeded = function() {
              var isLoadMoreVisible = $3.contains(
                document.documentElement,
                this.$loadingMore[0]
              );
              if (this.loading || !isLoadMoreVisible) {
                return;
              }
              var currentOffset = this.$results.offset().top + this.$results.outerHeight(false);
              var loadingMoreOffset = this.$loadingMore.offset().top + this.$loadingMore.outerHeight(false);
              if (currentOffset + 50 >= loadingMoreOffset) {
                this.loadMore();
              }
            };
            InfiniteScroll.prototype.loadMore = function() {
              this.loading = true;
              var params = $3.extend({}, { page: 1 }, this.lastParams);
              params.page++;
              this.trigger("query:append", params);
            };
            InfiniteScroll.prototype.showLoadingMore = function(_, data) {
              return data.pagination && data.pagination.more;
            };
            InfiniteScroll.prototype.createLoadingMore = function() {
              var $option = $3(
                '<li class="select2-results__option select2-results__option--load-more"role="option" aria-disabled="true"></li>'
              );
              var message = this.options.get("translations").get("loadingMore");
              $option.html(message(this.lastParams));
              return $option;
            };
            return InfiniteScroll;
          });
          S22.define("select2/dropdown/attachBody", [
            "jquery",
            "../utils"
          ], function($3, Utils) {
            function AttachBody(decorated, $element, options) {
              this.$dropdownParent = $3(options.get("dropdownParent") || document.body);
              decorated.call(this, $element, options);
            }
            AttachBody.prototype.bind = function(decorated, container, $container) {
              var self = this;
              decorated.call(this, container, $container);
              container.on("open", function() {
                self._showDropdown();
                self._attachPositioningHandler(container);
                self._bindContainerResultHandlers(container);
              });
              container.on("close", function() {
                self._hideDropdown();
                self._detachPositioningHandler(container);
              });
              this.$dropdownContainer.on("mousedown", function(evt) {
                evt.stopPropagation();
              });
            };
            AttachBody.prototype.destroy = function(decorated) {
              decorated.call(this);
              this.$dropdownContainer.remove();
            };
            AttachBody.prototype.position = function(decorated, $dropdown, $container) {
              $dropdown.attr("class", $container.attr("class"));
              $dropdown[0].classList.remove("select2");
              $dropdown[0].classList.add("select2-container--open");
              $dropdown.css({
                position: "absolute",
                top: -999999
              });
              this.$container = $container;
            };
            AttachBody.prototype.render = function(decorated) {
              var $container = $3("<span></span>");
              var $dropdown = decorated.call(this);
              $container.append($dropdown);
              this.$dropdownContainer = $container;
              return $container;
            };
            AttachBody.prototype._hideDropdown = function(decorated) {
              this.$dropdownContainer.detach();
            };
            AttachBody.prototype._bindContainerResultHandlers = function(decorated, container) {
              if (this._containerResultsHandlersBound) {
                return;
              }
              var self = this;
              container.on("results:all", function() {
                self._positionDropdown();
                self._resizeDropdown();
              });
              container.on("results:append", function() {
                self._positionDropdown();
                self._resizeDropdown();
              });
              container.on("results:message", function() {
                self._positionDropdown();
                self._resizeDropdown();
              });
              container.on("select", function() {
                self._positionDropdown();
                self._resizeDropdown();
              });
              container.on("unselect", function() {
                self._positionDropdown();
                self._resizeDropdown();
              });
              this._containerResultsHandlersBound = true;
            };
            AttachBody.prototype._attachPositioningHandler = function(decorated, container) {
              var self = this;
              var scrollEvent = "scroll.select2." + container.id;
              var resizeEvent = "resize.select2." + container.id;
              var orientationEvent = "orientationchange.select2." + container.id;
              var $watchers = this.$container.parents().filter(Utils.hasScroll);
              $watchers.each(function() {
                Utils.StoreData(this, "select2-scroll-position", {
                  x: $3(this).scrollLeft(),
                  y: $3(this).scrollTop()
                });
              });
              $watchers.on(scrollEvent, function(ev) {
                var position = Utils.GetData(this, "select2-scroll-position");
                $3(this).scrollTop(position.y);
              });
              $3(window).on(
                scrollEvent + " " + resizeEvent + " " + orientationEvent,
                function(e) {
                  self._positionDropdown();
                  self._resizeDropdown();
                }
              );
            };
            AttachBody.prototype._detachPositioningHandler = function(decorated, container) {
              var scrollEvent = "scroll.select2." + container.id;
              var resizeEvent = "resize.select2." + container.id;
              var orientationEvent = "orientationchange.select2." + container.id;
              var $watchers = this.$container.parents().filter(Utils.hasScroll);
              $watchers.off(scrollEvent);
              $3(window).off(scrollEvent + " " + resizeEvent + " " + orientationEvent);
            };
            AttachBody.prototype._positionDropdown = function() {
              var $window = $3(window);
              var isCurrentlyAbove = this.$dropdown[0].classList.contains("select2-dropdown--above");
              var isCurrentlyBelow = this.$dropdown[0].classList.contains("select2-dropdown--below");
              var newDirection = null;
              var offset = this.$container.offset();
              offset.bottom = offset.top + this.$container.outerHeight(false);
              var container = {
                height: this.$container.outerHeight(false)
              };
              container.top = offset.top;
              container.bottom = offset.top + container.height;
              var dropdown = {
                height: this.$dropdown.outerHeight(false)
              };
              var viewport = {
                top: $window.scrollTop(),
                bottom: $window.scrollTop() + $window.height()
              };
              var enoughRoomAbove = viewport.top < offset.top - dropdown.height;
              var enoughRoomBelow = viewport.bottom > offset.bottom + dropdown.height;
              var css = {
                left: offset.left,
                top: container.bottom
              };
              var $offsetParent = this.$dropdownParent;
              if ($offsetParent.css("position") === "static") {
                $offsetParent = $offsetParent.offsetParent();
              }
              var parentOffset = {
                top: 0,
                left: 0
              };
              if ($3.contains(document.body, $offsetParent[0]) || $offsetParent[0].isConnected) {
                parentOffset = $offsetParent.offset();
              }
              css.top -= parentOffset.top;
              css.left -= parentOffset.left;
              if (!isCurrentlyAbove && !isCurrentlyBelow) {
                newDirection = "below";
              }
              if (!enoughRoomBelow && enoughRoomAbove && !isCurrentlyAbove) {
                newDirection = "above";
              } else if (!enoughRoomAbove && enoughRoomBelow && isCurrentlyAbove) {
                newDirection = "below";
              }
              if (newDirection == "above" || isCurrentlyAbove && newDirection !== "below") {
                css.top = container.top - parentOffset.top - dropdown.height;
              }
              if (newDirection != null) {
                this.$dropdown[0].classList.remove("select2-dropdown--below");
                this.$dropdown[0].classList.remove("select2-dropdown--above");
                this.$dropdown[0].classList.add("select2-dropdown--" + newDirection);
                this.$container[0].classList.remove("select2-container--below");
                this.$container[0].classList.remove("select2-container--above");
                this.$container[0].classList.add("select2-container--" + newDirection);
              }
              this.$dropdownContainer.css(css);
            };
            AttachBody.prototype._resizeDropdown = function() {
              var css = {
                width: this.$container.outerWidth(false) + "px"
              };
              if (this.options.get("dropdownAutoWidth")) {
                css.minWidth = css.width;
                css.position = "relative";
                css.width = "auto";
              }
              this.$dropdown.css(css);
            };
            AttachBody.prototype._showDropdown = function(decorated) {
              this.$dropdownContainer.appendTo(this.$dropdownParent);
              this._positionDropdown();
              this._resizeDropdown();
            };
            return AttachBody;
          });
          S22.define("select2/dropdown/minimumResultsForSearch", [], function() {
            function countResults(data) {
              var count = 0;
              for (var d = 0; d < data.length; d++) {
                var item = data[d];
                if (item.children) {
                  count += countResults(item.children);
                } else {
                  count++;
                }
              }
              return count;
            }
            function MinimumResultsForSearch(decorated, $element, options, dataAdapter) {
              this.minimumResultsForSearch = options.get("minimumResultsForSearch");
              if (this.minimumResultsForSearch < 0) {
                this.minimumResultsForSearch = Infinity;
              }
              decorated.call(this, $element, options, dataAdapter);
            }
            MinimumResultsForSearch.prototype.showSearch = function(decorated, params) {
              if (countResults(params.data.results) < this.minimumResultsForSearch) {
                return false;
              }
              return decorated.call(this, params);
            };
            return MinimumResultsForSearch;
          });
          S22.define("select2/dropdown/selectOnClose", [
            "../utils"
          ], function(Utils) {
            function SelectOnClose() {
            }
            SelectOnClose.prototype.bind = function(decorated, container, $container) {
              var self = this;
              decorated.call(this, container, $container);
              container.on("close", function(params) {
                self._handleSelectOnClose(params);
              });
            };
            SelectOnClose.prototype._handleSelectOnClose = function(_, params) {
              if (params && params.originalSelect2Event != null) {
                var event = params.originalSelect2Event;
                if (event._type === "select" || event._type === "unselect") {
                  return;
                }
              }
              var $highlightedResults = this.getHighlightedResults();
              if ($highlightedResults.length < 1) {
                return;
              }
              var data = Utils.GetData($highlightedResults[0], "data");
              if (data.element != null && data.element.selected || data.element == null && data.selected) {
                return;
              }
              this.trigger("select", {
                data
              });
            };
            return SelectOnClose;
          });
          S22.define("select2/dropdown/closeOnSelect", [], function() {
            function CloseOnSelect() {
            }
            CloseOnSelect.prototype.bind = function(decorated, container, $container) {
              var self = this;
              decorated.call(this, container, $container);
              container.on("select", function(evt) {
                self._selectTriggered(evt);
              });
              container.on("unselect", function(evt) {
                self._selectTriggered(evt);
              });
            };
            CloseOnSelect.prototype._selectTriggered = function(_, evt) {
              var originalEvent = evt.originalEvent;
              if (originalEvent && (originalEvent.ctrlKey || originalEvent.metaKey)) {
                return;
              }
              this.trigger("close", {
                originalEvent,
                originalSelect2Event: evt
              });
            };
            return CloseOnSelect;
          });
          S22.define("select2/dropdown/dropdownCss", [
            "../utils"
          ], function(Utils) {
            function DropdownCSS() {
            }
            DropdownCSS.prototype.render = function(decorated) {
              var $dropdown = decorated.call(this);
              var dropdownCssClass = this.options.get("dropdownCssClass") || "";
              if (dropdownCssClass.indexOf(":all:") !== -1) {
                dropdownCssClass = dropdownCssClass.replace(":all:", "");
                Utils.copyNonInternalCssClasses($dropdown[0], this.$element[0]);
              }
              $dropdown.addClass(dropdownCssClass);
              return $dropdown;
            };
            return DropdownCSS;
          });
          S22.define("select2/dropdown/tagsSearchHighlight", [
            "../utils"
          ], function(Utils) {
            function TagsSearchHighlight() {
            }
            TagsSearchHighlight.prototype.highlightFirstItem = function(decorated) {
              var $options = this.$results.find(
                ".select2-results__option--selectable:not(.select2-results__option--selected)"
              );
              if ($options.length > 0) {
                var $firstOption = $options.first();
                var data = Utils.GetData($firstOption[0], "data");
                var firstElement = data.element;
                if (firstElement && firstElement.getAttribute) {
                  if (firstElement.getAttribute("data-select2-tag") === "true") {
                    $firstOption.trigger("mouseenter");
                    return;
                  }
                }
              }
              decorated.call(this);
            };
            return TagsSearchHighlight;
          });
          S22.define("select2/i18n/en", [], function() {
            return {
              errorLoading: function() {
                return "The results could not be loaded.";
              },
              inputTooLong: function(args) {
                var overChars = args.input.length - args.maximum;
                var message = "Please delete " + overChars + " character";
                if (overChars != 1) {
                  message += "s";
                }
                return message;
              },
              inputTooShort: function(args) {
                var remainingChars = args.minimum - args.input.length;
                var message = "Please enter " + remainingChars + " or more characters";
                return message;
              },
              loadingMore: function() {
                return "Loading more results\u2026";
              },
              maximumSelected: function(args) {
                var message = "You can only select " + args.maximum + " item";
                if (args.maximum != 1) {
                  message += "s";
                }
                return message;
              },
              noResults: function() {
                return "No results found";
              },
              searching: function() {
                return "Searching\u2026";
              },
              removeAllItems: function() {
                return "Remove all items";
              },
              removeItem: function() {
                return "Remove item";
              },
              search: function() {
                return "Search";
              }
            };
          });
          S22.define("select2/defaults", [
            "jquery",
            "./results",
            "./selection/single",
            "./selection/multiple",
            "./selection/placeholder",
            "./selection/allowClear",
            "./selection/search",
            "./selection/selectionCss",
            "./selection/eventRelay",
            "./utils",
            "./translation",
            "./diacritics",
            "./data/select",
            "./data/array",
            "./data/ajax",
            "./data/tags",
            "./data/tokenizer",
            "./data/minimumInputLength",
            "./data/maximumInputLength",
            "./data/maximumSelectionLength",
            "./dropdown",
            "./dropdown/search",
            "./dropdown/hidePlaceholder",
            "./dropdown/infiniteScroll",
            "./dropdown/attachBody",
            "./dropdown/minimumResultsForSearch",
            "./dropdown/selectOnClose",
            "./dropdown/closeOnSelect",
            "./dropdown/dropdownCss",
            "./dropdown/tagsSearchHighlight",
            "./i18n/en"
          ], function($3, ResultsList, SingleSelection, MultipleSelection, Placeholder, AllowClear, SelectionSearch, SelectionCSS, EventRelay, Utils, Translation, DIACRITICS, SelectData, ArrayData, AjaxData, Tags, Tokenizer, MinimumInputLength, MaximumInputLength, MaximumSelectionLength, Dropdown, DropdownSearch, HidePlaceholder, InfiniteScroll, AttachBody, MinimumResultsForSearch, SelectOnClose, CloseOnSelect, DropdownCSS, TagsSearchHighlight, EnglishTranslation) {
            function Defaults() {
              this.reset();
            }
            Defaults.prototype.apply = function(options) {
              options = $3.extend(true, {}, this.defaults, options);
              if (options.dataAdapter == null) {
                if (options.ajax != null) {
                  options.dataAdapter = AjaxData;
                } else if (options.data != null) {
                  options.dataAdapter = ArrayData;
                } else {
                  options.dataAdapter = SelectData;
                }
                if (options.minimumInputLength > 0) {
                  options.dataAdapter = Utils.Decorate(
                    options.dataAdapter,
                    MinimumInputLength
                  );
                }
                if (options.maximumInputLength > 0) {
                  options.dataAdapter = Utils.Decorate(
                    options.dataAdapter,
                    MaximumInputLength
                  );
                }
                if (options.maximumSelectionLength > 0) {
                  options.dataAdapter = Utils.Decorate(
                    options.dataAdapter,
                    MaximumSelectionLength
                  );
                }
                if (options.tags) {
                  options.dataAdapter = Utils.Decorate(options.dataAdapter, Tags);
                }
                if (options.tokenSeparators != null || options.tokenizer != null) {
                  options.dataAdapter = Utils.Decorate(
                    options.dataAdapter,
                    Tokenizer
                  );
                }
              }
              if (options.resultsAdapter == null) {
                options.resultsAdapter = ResultsList;
                if (options.ajax != null) {
                  options.resultsAdapter = Utils.Decorate(
                    options.resultsAdapter,
                    InfiniteScroll
                  );
                }
                if (options.placeholder != null) {
                  options.resultsAdapter = Utils.Decorate(
                    options.resultsAdapter,
                    HidePlaceholder
                  );
                }
                if (options.selectOnClose) {
                  options.resultsAdapter = Utils.Decorate(
                    options.resultsAdapter,
                    SelectOnClose
                  );
                }
                if (options.tags) {
                  options.resultsAdapter = Utils.Decorate(
                    options.resultsAdapter,
                    TagsSearchHighlight
                  );
                }
              }
              if (options.dropdownAdapter == null) {
                if (options.multiple) {
                  options.dropdownAdapter = Dropdown;
                } else {
                  var SearchableDropdown = Utils.Decorate(Dropdown, DropdownSearch);
                  options.dropdownAdapter = SearchableDropdown;
                }
                if (options.minimumResultsForSearch !== 0) {
                  options.dropdownAdapter = Utils.Decorate(
                    options.dropdownAdapter,
                    MinimumResultsForSearch
                  );
                }
                if (options.closeOnSelect) {
                  options.dropdownAdapter = Utils.Decorate(
                    options.dropdownAdapter,
                    CloseOnSelect
                  );
                }
                if (options.dropdownCssClass != null) {
                  options.dropdownAdapter = Utils.Decorate(
                    options.dropdownAdapter,
                    DropdownCSS
                  );
                }
                options.dropdownAdapter = Utils.Decorate(
                  options.dropdownAdapter,
                  AttachBody
                );
              }
              if (options.selectionAdapter == null) {
                if (options.multiple) {
                  options.selectionAdapter = MultipleSelection;
                } else {
                  options.selectionAdapter = SingleSelection;
                }
                if (options.placeholder != null) {
                  options.selectionAdapter = Utils.Decorate(
                    options.selectionAdapter,
                    Placeholder
                  );
                }
                if (options.allowClear) {
                  options.selectionAdapter = Utils.Decorate(
                    options.selectionAdapter,
                    AllowClear
                  );
                }
                if (options.multiple) {
                  options.selectionAdapter = Utils.Decorate(
                    options.selectionAdapter,
                    SelectionSearch
                  );
                }
                if (options.selectionCssClass != null) {
                  options.selectionAdapter = Utils.Decorate(
                    options.selectionAdapter,
                    SelectionCSS
                  );
                }
                options.selectionAdapter = Utils.Decorate(
                  options.selectionAdapter,
                  EventRelay
                );
              }
              options.language = this._resolveLanguage(options.language);
              options.language.push("en");
              var uniqueLanguages = [];
              for (var l = 0; l < options.language.length; l++) {
                var language = options.language[l];
                if (uniqueLanguages.indexOf(language) === -1) {
                  uniqueLanguages.push(language);
                }
              }
              options.language = uniqueLanguages;
              options.translations = this._processTranslations(
                options.language,
                options.debug
              );
              return options;
            };
            Defaults.prototype.reset = function() {
              function stripDiacritics(text) {
                function match(a) {
                  return DIACRITICS[a] || a;
                }
                return text.replace(/[^\u0000-\u007E]/g, match);
              }
              function matcher(params, data) {
                if (params.term == null || params.term.trim() === "") {
                  return data;
                }
                if (data.children && data.children.length > 0) {
                  var match = $3.extend(true, {}, data);
                  for (var c = data.children.length - 1; c >= 0; c--) {
                    var child = data.children[c];
                    var matches = matcher(params, child);
                    if (matches == null) {
                      match.children.splice(c, 1);
                    }
                  }
                  if (match.children.length > 0) {
                    return match;
                  }
                  return matcher(params, match);
                }
                var original = stripDiacritics(data.text).toUpperCase();
                var term = stripDiacritics(params.term).toUpperCase();
                if (original.indexOf(term) > -1) {
                  return data;
                }
                return null;
              }
              this.defaults = {
                amdLanguageBase: "./i18n/",
                autocomplete: "off",
                closeOnSelect: true,
                debug: false,
                dropdownAutoWidth: false,
                escapeMarkup: Utils.escapeMarkup,
                language: {},
                matcher,
                minimumInputLength: 0,
                maximumInputLength: 0,
                maximumSelectionLength: 0,
                minimumResultsForSearch: 0,
                selectOnClose: false,
                scrollAfterSelect: false,
                sorter: function(data) {
                  return data;
                },
                templateResult: function(result) {
                  return result.text;
                },
                templateSelection: function(selection) {
                  return selection.text;
                },
                theme: "default",
                width: "resolve"
              };
            };
            Defaults.prototype.applyFromElement = function(options, $element) {
              var optionLanguage = options.language;
              var defaultLanguage = this.defaults.language;
              var elementLanguage = $element.prop("lang");
              var parentLanguage = $element.closest("[lang]").prop("lang");
              var languages = Array.prototype.concat.call(
                this._resolveLanguage(elementLanguage),
                this._resolveLanguage(optionLanguage),
                this._resolveLanguage(defaultLanguage),
                this._resolveLanguage(parentLanguage)
              );
              options.language = languages;
              return options;
            };
            Defaults.prototype._resolveLanguage = function(language) {
              if (!language) {
                return [];
              }
              if ($3.isEmptyObject(language)) {
                return [];
              }
              if ($3.isPlainObject(language)) {
                return [language];
              }
              var languages;
              if (!Array.isArray(language)) {
                languages = [language];
              } else {
                languages = language;
              }
              var resolvedLanguages = [];
              for (var l = 0; l < languages.length; l++) {
                resolvedLanguages.push(languages[l]);
                if (typeof languages[l] === "string" && languages[l].indexOf("-") > 0) {
                  var languageParts = languages[l].split("-");
                  var baseLanguage = languageParts[0];
                  resolvedLanguages.push(baseLanguage);
                }
              }
              return resolvedLanguages;
            };
            Defaults.prototype._processTranslations = function(languages, debug) {
              var translations = new Translation();
              for (var l = 0; l < languages.length; l++) {
                var languageData = new Translation();
                var language = languages[l];
                if (typeof language === "string") {
                  try {
                    languageData = Translation.loadPath(language);
                  } catch (e) {
                    try {
                      language = this.defaults.amdLanguageBase + language;
                      languageData = Translation.loadPath(language);
                    } catch (ex) {
                      if (debug && window.console && console.warn) {
                        console.warn(
                          'Select2: The language file for "' + language + '" could not be automatically loaded. A fallback will be used instead.'
                        );
                      }
                    }
                  }
                } else if ($3.isPlainObject(language)) {
                  languageData = new Translation(language);
                } else {
                  languageData = language;
                }
                translations.extend(languageData);
              }
              return translations;
            };
            Defaults.prototype.set = function(key, value) {
              var camelKey = $3.camelCase(key);
              var data = {};
              data[camelKey] = value;
              var convertedData = Utils._convertData(data);
              $3.extend(true, this.defaults, convertedData);
            };
            var defaults = new Defaults();
            return defaults;
          });
          S22.define("select2/options", [
            "jquery",
            "./defaults",
            "./utils"
          ], function($3, Defaults, Utils) {
            function Options(options, $element) {
              this.options = options;
              if ($element != null) {
                this.fromElement($element);
              }
              if ($element != null) {
                this.options = Defaults.applyFromElement(this.options, $element);
              }
              this.options = Defaults.apply(this.options);
            }
            Options.prototype.fromElement = function($e) {
              var excludedData = ["select2"];
              if (this.options.multiple == null) {
                this.options.multiple = $e.prop("multiple");
              }
              if (this.options.disabled == null) {
                this.options.disabled = $e.prop("disabled");
              }
              if (this.options.autocomplete == null && $e.prop("autocomplete")) {
                this.options.autocomplete = $e.prop("autocomplete");
              }
              if (this.options.dir == null) {
                if ($e.prop("dir")) {
                  this.options.dir = $e.prop("dir");
                } else if ($e.closest("[dir]").prop("dir")) {
                  this.options.dir = $e.closest("[dir]").prop("dir");
                } else {
                  this.options.dir = "ltr";
                }
              }
              $e.prop("disabled", this.options.disabled);
              $e.prop("multiple", this.options.multiple);
              if (Utils.GetData($e[0], "select2Tags")) {
                if (this.options.debug && window.console && console.warn) {
                  console.warn(
                    'Select2: The `data-select2-tags` attribute has been changed to use the `data-data` and `data-tags="true"` attributes and will be removed in future versions of Select2.'
                  );
                }
                Utils.StoreData($e[0], "data", Utils.GetData($e[0], "select2Tags"));
                Utils.StoreData($e[0], "tags", true);
              }
              if (Utils.GetData($e[0], "ajaxUrl")) {
                if (this.options.debug && window.console && console.warn) {
                  console.warn(
                    "Select2: The `data-ajax-url` attribute has been changed to `data-ajax--url` and support for the old attribute will be removed in future versions of Select2."
                  );
                }
                $e.attr("ajax--url", Utils.GetData($e[0], "ajaxUrl"));
                Utils.StoreData($e[0], "ajax-Url", Utils.GetData($e[0], "ajaxUrl"));
              }
              var dataset = {};
              function upperCaseLetter(_, letter) {
                return letter.toUpperCase();
              }
              for (var attr = 0; attr < $e[0].attributes.length; attr++) {
                var attributeName = $e[0].attributes[attr].name;
                var prefix = "data-";
                if (attributeName.substr(0, prefix.length) == prefix) {
                  var dataName = attributeName.substring(prefix.length);
                  var dataValue = Utils.GetData($e[0], dataName);
                  var camelDataName = dataName.replace(/-([a-z])/g, upperCaseLetter);
                  dataset[camelDataName] = dataValue;
                }
              }
              if ($3.fn.jquery && $3.fn.jquery.substr(0, 2) == "1." && $e[0].dataset) {
                dataset = $3.extend(true, {}, $e[0].dataset, dataset);
              }
              var data = $3.extend(true, {}, Utils.GetData($e[0]), dataset);
              data = Utils._convertData(data);
              for (var key in data) {
                if (excludedData.indexOf(key) > -1) {
                  continue;
                }
                if ($3.isPlainObject(this.options[key])) {
                  $3.extend(this.options[key], data[key]);
                } else {
                  this.options[key] = data[key];
                }
              }
              return this;
            };
            Options.prototype.get = function(key) {
              return this.options[key];
            };
            Options.prototype.set = function(key, val) {
              this.options[key] = val;
            };
            return Options;
          });
          S22.define("select2/core", [
            "jquery",
            "./options",
            "./utils",
            "./keys"
          ], function($3, Options, Utils, KEYS) {
            var Select2 = function($element, options) {
              if (Utils.GetData($element[0], "select2") != null) {
                Utils.GetData($element[0], "select2").destroy();
              }
              this.$element = $element;
              this.id = this._generateId($element);
              options = options || {};
              this.options = new Options(options, $element);
              Select2.__super__.constructor.call(this);
              var tabindex = $element.attr("tabindex") || 0;
              Utils.StoreData($element[0], "old-tabindex", tabindex);
              $element.attr("tabindex", "-1");
              var DataAdapter = this.options.get("dataAdapter");
              this.dataAdapter = new DataAdapter($element, this.options);
              var $container = this.render();
              this._placeContainer($container);
              var SelectionAdapter = this.options.get("selectionAdapter");
              this.selection = new SelectionAdapter($element, this.options);
              this.$selection = this.selection.render();
              this.selection.position(this.$selection, $container);
              var DropdownAdapter = this.options.get("dropdownAdapter");
              this.dropdown = new DropdownAdapter($element, this.options);
              this.$dropdown = this.dropdown.render();
              this.dropdown.position(this.$dropdown, $container);
              var ResultsAdapter = this.options.get("resultsAdapter");
              this.results = new ResultsAdapter($element, this.options, this.dataAdapter);
              this.$results = this.results.render();
              this.results.position(this.$results, this.$dropdown);
              var self = this;
              this._bindAdapters();
              this._registerDomEvents();
              this._registerDataEvents();
              this._registerSelectionEvents();
              this._registerDropdownEvents();
              this._registerResultsEvents();
              this._registerEvents();
              this.dataAdapter.current(function(initialData) {
                self.trigger("selection:update", {
                  data: initialData
                });
              });
              $element[0].classList.add("select2-hidden-accessible");
              $element.attr("aria-hidden", "true");
              this._syncAttributes();
              Utils.StoreData($element[0], "select2", this);
              $element.data("select2", this);
            };
            Utils.Extend(Select2, Utils.Observable);
            Select2.prototype._generateId = function($element) {
              var id = "";
              if ($element.attr("id") != null) {
                id = $element.attr("id");
              } else if ($element.attr("name") != null) {
                id = $element.attr("name") + "-" + Utils.generateChars(2);
              } else {
                id = Utils.generateChars(4);
              }
              id = id.replace(/(:|\.|\[|\]|,)/g, "");
              id = "select2-" + id;
              return id;
            };
            Select2.prototype._placeContainer = function($container) {
              $container.insertAfter(this.$element);
              var width = this._resolveWidth(this.$element, this.options.get("width"));
              if (width != null) {
                $container.css("width", width);
              }
            };
            Select2.prototype._resolveWidth = function($element, method) {
              var WIDTH = /^width:(([-+]?([0-9]*\.)?[0-9]+)(px|em|ex|%|in|cm|mm|pt|pc))/i;
              if (method == "resolve") {
                var styleWidth = this._resolveWidth($element, "style");
                if (styleWidth != null) {
                  return styleWidth;
                }
                return this._resolveWidth($element, "element");
              }
              if (method == "element") {
                var elementWidth = $element.outerWidth(false);
                if (elementWidth <= 0) {
                  return "auto";
                }
                return elementWidth + "px";
              }
              if (method == "style") {
                var style = $element.attr("style");
                if (typeof style !== "string") {
                  return null;
                }
                var attrs = style.split(";");
                for (var i = 0, l = attrs.length; i < l; i = i + 1) {
                  var attr = attrs[i].replace(/\s/g, "");
                  var matches = attr.match(WIDTH);
                  if (matches !== null && matches.length >= 1) {
                    return matches[1];
                  }
                }
                return null;
              }
              if (method == "computedstyle") {
                var computedStyle = window.getComputedStyle($element[0]);
                return computedStyle.width;
              }
              return method;
            };
            Select2.prototype._bindAdapters = function() {
              this.dataAdapter.bind(this, this.$container);
              this.selection.bind(this, this.$container);
              this.dropdown.bind(this, this.$container);
              this.results.bind(this, this.$container);
            };
            Select2.prototype._registerDomEvents = function() {
              var self = this;
              this.$element.on("change.select2", function() {
                self.dataAdapter.current(function(data) {
                  self.trigger("selection:update", {
                    data
                  });
                });
              });
              this.$element.on("focus.select2", function(evt) {
                self.trigger("focus", evt);
              });
              this._syncA = Utils.bind(this._syncAttributes, this);
              this._syncS = Utils.bind(this._syncSubtree, this);
              this._observer = new window.MutationObserver(function(mutations) {
                self._syncA();
                self._syncS(mutations);
              });
              this._observer.observe(this.$element[0], {
                attributes: true,
                childList: true,
                subtree: false
              });
            };
            Select2.prototype._registerDataEvents = function() {
              var self = this;
              this.dataAdapter.on("*", function(name, params) {
                self.trigger(name, params);
              });
            };
            Select2.prototype._registerSelectionEvents = function() {
              var self = this;
              var nonRelayEvents = ["toggle", "focus"];
              this.selection.on("toggle", function() {
                self.toggleDropdown();
              });
              this.selection.on("focus", function(params) {
                self.focus(params);
              });
              this.selection.on("*", function(name, params) {
                if (nonRelayEvents.indexOf(name) !== -1) {
                  return;
                }
                self.trigger(name, params);
              });
            };
            Select2.prototype._registerDropdownEvents = function() {
              var self = this;
              this.dropdown.on("*", function(name, params) {
                self.trigger(name, params);
              });
            };
            Select2.prototype._registerResultsEvents = function() {
              var self = this;
              this.results.on("*", function(name, params) {
                self.trigger(name, params);
              });
            };
            Select2.prototype._registerEvents = function() {
              var self = this;
              this.on("open", function() {
                self.$container[0].classList.add("select2-container--open");
              });
              this.on("close", function() {
                self.$container[0].classList.remove("select2-container--open");
              });
              this.on("enable", function() {
                self.$container[0].classList.remove("select2-container--disabled");
              });
              this.on("disable", function() {
                self.$container[0].classList.add("select2-container--disabled");
              });
              this.on("blur", function() {
                self.$container[0].classList.remove("select2-container--focus");
              });
              this.on("query", function(params) {
                if (!self.isOpen()) {
                  self.trigger("open", {});
                }
                this.dataAdapter.query(params, function(data) {
                  self.trigger("results:all", {
                    data,
                    query: params
                  });
                });
              });
              this.on("query:append", function(params) {
                this.dataAdapter.query(params, function(data) {
                  self.trigger("results:append", {
                    data,
                    query: params
                  });
                });
              });
              this.on("keypress", function(evt) {
                var key = evt.which;
                if (self.isOpen()) {
                  if (key === KEYS.ESC || key === KEYS.UP && evt.altKey) {
                    self.close(evt);
                    evt.preventDefault();
                  } else if (key === KEYS.ENTER || key === KEYS.TAB) {
                    self.trigger("results:select", {});
                    evt.preventDefault();
                  } else if (key === KEYS.SPACE && evt.ctrlKey) {
                    self.trigger("results:toggle", {});
                    evt.preventDefault();
                  } else if (key === KEYS.UP) {
                    self.trigger("results:previous", {});
                    evt.preventDefault();
                  } else if (key === KEYS.DOWN) {
                    self.trigger("results:next", {});
                    evt.preventDefault();
                  }
                } else {
                  if (key === KEYS.ENTER || key === KEYS.SPACE || key === KEYS.DOWN && evt.altKey) {
                    self.open();
                    evt.preventDefault();
                  }
                }
              });
            };
            Select2.prototype._syncAttributes = function() {
              this.options.set("disabled", this.$element.prop("disabled"));
              if (this.isDisabled()) {
                if (this.isOpen()) {
                  this.close();
                }
                this.trigger("disable", {});
              } else {
                this.trigger("enable", {});
              }
            };
            Select2.prototype._isChangeMutation = function(mutations) {
              var self = this;
              if (mutations.addedNodes && mutations.addedNodes.length > 0) {
                for (var n = 0; n < mutations.addedNodes.length; n++) {
                  var node = mutations.addedNodes[n];
                  if (node.selected) {
                    return true;
                  }
                }
              } else if (mutations.removedNodes && mutations.removedNodes.length > 0) {
                return true;
              } else if (Array.isArray(mutations)) {
                return mutations.some(function(mutation) {
                  return self._isChangeMutation(mutation);
                });
              }
              return false;
            };
            Select2.prototype._syncSubtree = function(mutations) {
              var changed = this._isChangeMutation(mutations);
              var self = this;
              if (changed) {
                this.dataAdapter.current(function(currentData) {
                  self.trigger("selection:update", {
                    data: currentData
                  });
                });
              }
            };
            Select2.prototype.trigger = function(name, args) {
              var actualTrigger = Select2.__super__.trigger;
              var preTriggerMap = {
                "open": "opening",
                "close": "closing",
                "select": "selecting",
                "unselect": "unselecting",
                "clear": "clearing"
              };
              if (args === void 0) {
                args = {};
              }
              if (name in preTriggerMap) {
                var preTriggerName = preTriggerMap[name];
                var preTriggerArgs = {
                  prevented: false,
                  name,
                  args
                };
                actualTrigger.call(this, preTriggerName, preTriggerArgs);
                if (preTriggerArgs.prevented) {
                  args.prevented = true;
                  return;
                }
              }
              actualTrigger.call(this, name, args);
            };
            Select2.prototype.toggleDropdown = function() {
              if (this.isDisabled()) {
                return;
              }
              if (this.isOpen()) {
                this.close();
              } else {
                this.open();
              }
            };
            Select2.prototype.open = function() {
              if (this.isOpen()) {
                return;
              }
              if (this.isDisabled()) {
                return;
              }
              this.trigger("query", {});
            };
            Select2.prototype.close = function(evt) {
              if (!this.isOpen()) {
                return;
              }
              this.trigger("close", { originalEvent: evt });
            };
            Select2.prototype.isEnabled = function() {
              return !this.isDisabled();
            };
            Select2.prototype.isDisabled = function() {
              return this.options.get("disabled");
            };
            Select2.prototype.isOpen = function() {
              return this.$container[0].classList.contains("select2-container--open");
            };
            Select2.prototype.hasFocus = function() {
              return this.$container[0].classList.contains("select2-container--focus");
            };
            Select2.prototype.focus = function(data) {
              if (this.hasFocus()) {
                return;
              }
              this.$container[0].classList.add("select2-container--focus");
              this.trigger("focus", {});
            };
            Select2.prototype.enable = function(args) {
              if (this.options.get("debug") && window.console && console.warn) {
                console.warn(
                  'Select2: The `select2("enable")` method has been deprecated and will be removed in later Select2 versions. Use $element.prop("disabled") instead.'
                );
              }
              if (args == null || args.length === 0) {
                args = [true];
              }
              var disabled = !args[0];
              this.$element.prop("disabled", disabled);
            };
            Select2.prototype.data = function() {
              if (this.options.get("debug") && arguments.length > 0 && window.console && console.warn) {
                console.warn(
                  'Select2: Data can no longer be set using `select2("data")`. You should consider setting the value instead using `$element.val()`.'
                );
              }
              var data = [];
              this.dataAdapter.current(function(currentData) {
                data = currentData;
              });
              return data;
            };
            Select2.prototype.val = function(args) {
              if (this.options.get("debug") && window.console && console.warn) {
                console.warn(
                  'Select2: The `select2("val")` method has been deprecated and will be removed in later Select2 versions. Use $element.val() instead.'
                );
              }
              if (args == null || args.length === 0) {
                return this.$element.val();
              }
              var newVal = args[0];
              if (Array.isArray(newVal)) {
                newVal = newVal.map(function(obj) {
                  return obj.toString();
                });
              }
              this.$element.val(newVal).trigger("input").trigger("change");
            };
            Select2.prototype.destroy = function() {
              Utils.RemoveData(this.$container[0]);
              this.$container.remove();
              this._observer.disconnect();
              this._observer = null;
              this._syncA = null;
              this._syncS = null;
              this.$element.off(".select2");
              this.$element.attr(
                "tabindex",
                Utils.GetData(this.$element[0], "old-tabindex")
              );
              this.$element[0].classList.remove("select2-hidden-accessible");
              this.$element.attr("aria-hidden", "false");
              Utils.RemoveData(this.$element[0]);
              this.$element.removeData("select2");
              this.dataAdapter.destroy();
              this.selection.destroy();
              this.dropdown.destroy();
              this.results.destroy();
              this.dataAdapter = null;
              this.selection = null;
              this.dropdown = null;
              this.results = null;
            };
            Select2.prototype.render = function() {
              var $container = $3(
                '<span class="select2 select2-container"><span class="selection"></span><span class="dropdown-wrapper" aria-hidden="true"></span></span>'
              );
              $container.attr("dir", this.options.get("dir"));
              this.$container = $container;
              this.$container[0].classList.add("select2-container--" + this.options.get("theme"));
              Utils.StoreData($container[0], "element", this.$element);
              return $container;
            };
            return Select2;
          });
          S22.define("select2/dropdown/attachContainer", [], function() {
            function AttachContainer(decorated, $element, options) {
              decorated.call(this, $element, options);
            }
            AttachContainer.prototype.position = function(decorated, $dropdown, $container) {
              var $dropdownContainer = $container.find(".dropdown-wrapper");
              $dropdownContainer.append($dropdown);
              $dropdown[0].classList.add("select2-dropdown--below");
              $container[0].classList.add("select2-container--below");
            };
            return AttachContainer;
          });
          S22.define("select2/dropdown/stopPropagation", [], function() {
            function StopPropagation() {
            }
            StopPropagation.prototype.bind = function(decorated, container, $container) {
              decorated.call(this, container, $container);
              var stoppedEvents = [
                "blur",
                "change",
                "click",
                "dblclick",
                "focus",
                "focusin",
                "focusout",
                "input",
                "keydown",
                "keyup",
                "keypress",
                "mousedown",
                "mouseenter",
                "mouseleave",
                "mousemove",
                "mouseover",
                "mouseup",
                "search",
                "touchend",
                "touchstart"
              ];
              this.$dropdown.on(stoppedEvents.join(" "), function(evt) {
                evt.stopPropagation();
              });
            };
            return StopPropagation;
          });
          S22.define("select2/selection/stopPropagation", [], function() {
            function StopPropagation() {
            }
            StopPropagation.prototype.bind = function(decorated, container, $container) {
              decorated.call(this, container, $container);
              var stoppedEvents = [
                "blur",
                "change",
                "click",
                "dblclick",
                "focus",
                "focusin",
                "focusout",
                "input",
                "keydown",
                "keyup",
                "keypress",
                "mousedown",
                "mouseenter",
                "mouseleave",
                "mousemove",
                "mouseover",
                "mouseup",
                "search",
                "touchend",
                "touchstart"
              ];
              this.$selection.on(stoppedEvents.join(" "), function(evt) {
                evt.stopPropagation();
              });
            };
            return StopPropagation;
          });
          (function(factory) {
            if (typeof S22.define === "function" && S22.define.amd) {
              S22.define("jquery-mousewheel", ["jquery"], factory);
            } else if (typeof exports === "object") {
              module.exports = factory;
            } else {
              factory(jQuery2);
            }
          })(function($3) {
            var toFix = ["wheel", "mousewheel", "DOMMouseScroll", "MozMousePixelScroll"], toBind = "onwheel" in document || document.documentMode >= 9 ? ["wheel"] : ["mousewheel", "DomMouseScroll", "MozMousePixelScroll"], slice = Array.prototype.slice, nullLowestDeltaTimeout, lowestDelta;
            if ($3.event.fixHooks) {
              for (var i = toFix.length; i; ) {
                $3.event.fixHooks[toFix[--i]] = $3.event.mouseHooks;
              }
            }
            var special = $3.event.special.mousewheel = {
              version: "3.1.12",
              setup: function() {
                if (this.addEventListener) {
                  for (var i2 = toBind.length; i2; ) {
                    this.addEventListener(toBind[--i2], handler, false);
                  }
                } else {
                  this.onmousewheel = handler;
                }
                $3.data(this, "mousewheel-line-height", special.getLineHeight(this));
                $3.data(this, "mousewheel-page-height", special.getPageHeight(this));
              },
              teardown: function() {
                if (this.removeEventListener) {
                  for (var i2 = toBind.length; i2; ) {
                    this.removeEventListener(toBind[--i2], handler, false);
                  }
                } else {
                  this.onmousewheel = null;
                }
                $3.removeData(this, "mousewheel-line-height");
                $3.removeData(this, "mousewheel-page-height");
              },
              getLineHeight: function(elem) {
                var $elem = $3(elem), $parent = $elem["offsetParent" in $3.fn ? "offsetParent" : "parent"]();
                if (!$parent.length) {
                  $parent = $3("body");
                }
                return parseInt($parent.css("fontSize"), 10) || parseInt($elem.css("fontSize"), 10) || 16;
              },
              getPageHeight: function(elem) {
                return $3(elem).height();
              },
              settings: {
                adjustOldDeltas: true,
                // see shouldAdjustOldDeltas() below
                normalizeOffset: true
                // calls getBoundingClientRect for each event
              }
            };
            $3.fn.extend({
              mousewheel: function(fn) {
                return fn ? this.bind("mousewheel", fn) : this.trigger("mousewheel");
              },
              unmousewheel: function(fn) {
                return this.unbind("mousewheel", fn);
              }
            });
            function handler(event) {
              var orgEvent = event || window.event, args = slice.call(arguments, 1), delta = 0, deltaX = 0, deltaY = 0, absDelta = 0, offsetX = 0, offsetY = 0;
              event = $3.event.fix(orgEvent);
              event.type = "mousewheel";
              if ("detail" in orgEvent) {
                deltaY = orgEvent.detail * -1;
              }
              if ("wheelDelta" in orgEvent) {
                deltaY = orgEvent.wheelDelta;
              }
              if ("wheelDeltaY" in orgEvent) {
                deltaY = orgEvent.wheelDeltaY;
              }
              if ("wheelDeltaX" in orgEvent) {
                deltaX = orgEvent.wheelDeltaX * -1;
              }
              if ("axis" in orgEvent && orgEvent.axis === orgEvent.HORIZONTAL_AXIS) {
                deltaX = deltaY * -1;
                deltaY = 0;
              }
              delta = deltaY === 0 ? deltaX : deltaY;
              if ("deltaY" in orgEvent) {
                deltaY = orgEvent.deltaY * -1;
                delta = deltaY;
              }
              if ("deltaX" in orgEvent) {
                deltaX = orgEvent.deltaX;
                if (deltaY === 0) {
                  delta = deltaX * -1;
                }
              }
              if (deltaY === 0 && deltaX === 0) {
                return;
              }
              if (orgEvent.deltaMode === 1) {
                var lineHeight = $3.data(this, "mousewheel-line-height");
                delta *= lineHeight;
                deltaY *= lineHeight;
                deltaX *= lineHeight;
              } else if (orgEvent.deltaMode === 2) {
                var pageHeight = $3.data(this, "mousewheel-page-height");
                delta *= pageHeight;
                deltaY *= pageHeight;
                deltaX *= pageHeight;
              }
              absDelta = Math.max(Math.abs(deltaY), Math.abs(deltaX));
              if (!lowestDelta || absDelta < lowestDelta) {
                lowestDelta = absDelta;
                if (shouldAdjustOldDeltas(orgEvent, absDelta)) {
                  lowestDelta /= 40;
                }
              }
              if (shouldAdjustOldDeltas(orgEvent, absDelta)) {
                delta /= 40;
                deltaX /= 40;
                deltaY /= 40;
              }
              delta = Math[delta >= 1 ? "floor" : "ceil"](delta / lowestDelta);
              deltaX = Math[deltaX >= 1 ? "floor" : "ceil"](deltaX / lowestDelta);
              deltaY = Math[deltaY >= 1 ? "floor" : "ceil"](deltaY / lowestDelta);
              if (special.settings.normalizeOffset && this.getBoundingClientRect) {
                var boundingRect = this.getBoundingClientRect();
                offsetX = event.clientX - boundingRect.left;
                offsetY = event.clientY - boundingRect.top;
              }
              event.deltaX = deltaX;
              event.deltaY = deltaY;
              event.deltaFactor = lowestDelta;
              event.offsetX = offsetX;
              event.offsetY = offsetY;
              event.deltaMode = 0;
              args.unshift(event, delta, deltaX, deltaY);
              if (nullLowestDeltaTimeout) {
                clearTimeout(nullLowestDeltaTimeout);
              }
              nullLowestDeltaTimeout = setTimeout(nullLowestDelta, 200);
              return ($3.event.dispatch || $3.event.handle).apply(this, args);
            }
            function nullLowestDelta() {
              lowestDelta = null;
            }
            function shouldAdjustOldDeltas(orgEvent, absDelta) {
              return special.settings.adjustOldDeltas && orgEvent.type === "mousewheel" && absDelta % 120 === 0;
            }
          });
          S22.define("jquery.select2", [
            "jquery",
            "jquery-mousewheel",
            "./select2/core",
            "./select2/defaults",
            "./select2/utils"
          ], function($3, _, Select2, Defaults, Utils) {
            if ($3.fn.select2 == null) {
              var thisMethods = ["open", "close", "destroy"];
              $3.fn.select2 = function(options) {
                options = options || {};
                if (typeof options === "object") {
                  this.each(function() {
                    var instanceOptions = $3.extend(true, {}, options);
                    var instance = new Select2($3(this), instanceOptions);
                  });
                  return this;
                } else if (typeof options === "string") {
                  var ret;
                  var args = Array.prototype.slice.call(arguments, 1);
                  this.each(function() {
                    var instance = Utils.GetData(this, "select2");
                    if (instance == null && window.console && console.error) {
                      console.error(
                        "The select2('" + options + "') method was called on an element that is not using Select2."
                      );
                    }
                    ret = instance[options].apply(instance, args);
                  });
                  if (thisMethods.indexOf(options) > -1) {
                    return this;
                  }
                  return ret;
                } else {
                  throw new Error("Invalid arguments for Select2: " + options);
                }
              };
            }
            if ($3.fn.select2.defaults == null) {
              $3.fn.select2.defaults = Defaults;
            }
            return Select2;
          });
          return {
            define: S22.define,
            require: S22.require
          };
        })();
        var select2 = S2.require("jquery.select2");
        jQuery2.fn.select2.amd = S2;
        return select2;
      });
    }
  });

  // app/javascript/select2.js
  init_shim_jquery();
  var import_select2_full = __toESM(require_select2_full());
  (function($3, undefined2) {
    "use strict";
    if (window.Select2 !== undefined2) {
      return;
    }
    var KEY, AbstractSelect2, SingleSelect2, MultiSelect2;
    KEY = {
      TAB: 9,
      ENTER: 13,
      ESC: 27,
      SPACE: 32,
      LEFT: 37,
      UP: 38,
      RIGHT: 39,
      DOWN: 40,
      SHIFT: 16,
      CTRL: 17,
      ALT: 18,
      PAGE_UP: 33,
      PAGE_DOWN: 34,
      HOME: 36,
      END: 35,
      BACKSPACE: 8,
      DELETE: 46,
      isArrow: function(k) {
        k = k.which ? k.which : k;
        switch (k) {
          case KEY.LEFT:
          case KEY.RIGHT:
          case KEY.UP:
          case KEY.DOWN:
            return true;
        }
        return false;
      },
      isControl: function(k) {
        k = k.which ? k.which : k;
        switch (k) {
          case KEY.SHIFT:
          case KEY.CTRL:
          case KEY.ALT:
            return true;
        }
        return false;
      },
      isFunctionKey: function(k) {
        k = k.which ? k.which : k;
        return k >= 112 && k <= 123;
      }
    };
    function indexOf(value, array) {
      var i = 0, l = array.length, v;
      if (value.constructor === String) {
        for (; i < l; i = i + 1) if (value.localeCompare(array[i]) === 0) return i;
      } else {
        for (; i < l; i = i + 1) {
          v = array[i];
          if (v.constructor === String) {
            if (v.localeCompare(value) === 0) return i;
          } else {
            if (v === value) return i;
          }
        }
      }
      return -1;
    }
    function equal(a, b) {
      if (a === b) return true;
      if (a === undefined2 || b === undefined2) return false;
      if (a === null || b === null) return false;
      if (a.constructor === String) return a.localeCompare(b) === 0;
      if (b.constructor === String) return b.localeCompare(a) === 0;
      return false;
    }
    function splitVal(string, separator) {
      var val, i, l;
      if (string === null || string.length < 1) return [];
      val = string.split(separator);
      for (i = 0, l = val.length; i < l; i = i + 1) val[i] = $3.trim(val[i]);
      return val;
    }
    function getSideBorderPadding(element) {
      return element.outerWidth() - element.width();
    }
    function installKeyUpChangeEvent(element) {
      element.bind("keydown", function() {
        element.data("keyup-change-value", element.val());
      });
      element.bind("keyup", function() {
        if (element.val() !== element.data("keyup-change-value")) {
          element.trigger("keyup-change");
        }
      });
    }
    $3(document).delegate("*", "mousemove", function(e) {
      $3(document).data("select2-lastpos", { x: e.pageX, y: e.pageY });
    });
    function installFilteredMouseMove(element) {
      element.bind("mousemove", function(e) {
        var lastpos = $3(document).data("select2-lastpos");
        if (lastpos === undefined2 || lastpos.x !== e.pageX || lastpos.y !== e.pageY) {
          $3(e.target).trigger("mousemove-filtered", e);
        }
      });
    }
    function debounce(quietMillis, fn) {
      var timeout;
      return function() {
        window.clearTimeout(timeout);
        timeout = window.setTimeout(fn, quietMillis);
      };
    }
    function installDebouncedScroll(threshold, element) {
      var notify = debounce(threshold, function(e) {
        element.trigger("scroll-debounced", e);
      });
      element.bind("scroll", function(e) {
        if (indexOf(e.target, element.get()) >= 0) notify(e);
      });
    }
    function killEvent(event) {
      event.preventDefault();
      event.stopPropagation();
    }
    function measureTextWidth(e) {
      var sizer, width;
      sizer = $3("<div></div>").css({
        position: "absolute",
        left: "-1000px",
        top: "-1000px",
        display: "none",
        fontSize: e.css("fontSize"),
        fontFamily: e.css("fontFamily"),
        fontStyle: e.css("fontStyle"),
        fontWeight: e.css("fontWeight"),
        letterSpacing: e.css("letterSpacing"),
        textTransform: e.css("textTransform"),
        whiteSpace: "nowrap"
      });
      sizer.text(e.val());
      $3("body").append(sizer);
      width = sizer.width();
      sizer.remove();
      return width;
    }
    function ajax(options) {
      var timeout, requestSequence = 0, handler = null, quietMillis = options.quietMillis || 100;
      return function(query) {
        window.clearTimeout(timeout);
        timeout = window.setTimeout(function() {
          requestSequence += 1;
          var requestNumber = requestSequence, data = options.data, transport = options.transport || $3.ajax;
          data = data.call(this, query.term, query.page);
          if (null !== handler) {
            handler.abort();
          }
          handler = transport.call(null, {
            url: options.url,
            dataType: options.dataType,
            data,
            success: function(data2) {
              if (requestNumber < requestSequence) {
                return;
              }
              query.callback(options.results(data2, query.page));
            }
          });
        }, quietMillis);
      };
    }
    function local(options) {
      var data = options, text = function(item) {
        return item.text;
      };
      if (!$3.isArray(data)) {
        text = data.text;
        if (!$3.isFunction(text)) text = function(item) {
          return item[data.text];
        };
        data = data.results;
      }
      return function(query) {
        var t = query.term.toUpperCase(), filtered = {};
        if (t === "") {
          query.callback({ results: data });
          return;
        }
        filtered.results = $3(data).filter(function() {
          return text(this).toUpperCase().indexOf(t) >= 0;
        }).get();
        query.callback(filtered);
      };
    }
    function tags(data) {
      if ($3.isFunction(data)) {
        return data;
      }
      return function(query) {
        var t = query.term.toUpperCase(), filtered = { results: [] };
        $3(data).each(function() {
          var isObject = this.text !== undefined2, text = isObject ? this.text : this;
          if (t === "" || text.toUpperCase().indexOf(t) >= 0) {
            filtered.results.push(isObject ? this : { id: this, text: this });
          }
        });
        query.callback(filtered);
      };
    }
    $3(document).ready(function() {
      $3(document).delegate("*", "mousedown focusin", function(e) {
        var target = $3(e.target).closest("div.select2-container").get(0);
        $3(document).find("div.select2-container-active").each(function() {
          if (this !== target) $3(this).data("select2").blur();
        });
      });
    });
    function clazz(SuperClass, methods) {
      var constructor = function() {
      };
      constructor.prototype = new SuperClass();
      constructor.prototype.constructor = constructor;
      constructor.prototype.parent = SuperClass.prototype;
      constructor.prototype = $3.extend(constructor.prototype, methods);
      return constructor;
    }
    AbstractSelect2 = clazz(Object, {
      bind: function(func) {
        var self = this;
        return function() {
          func.apply(self, arguments);
        };
      },
      init: function(opts) {
        var results, search, resultsSelector = ".select2-results";
        this.opts = opts = this.prepareOpts(opts);
        this.id = opts.id;
        if (opts.element.data("select2") !== undefined2) {
          this.destroy();
        }
        this.container = this.createContainer();
        if (opts.element.attr("class") !== undefined2) {
          this.container.addClass(opts.element.attr("class"));
        }
        this.opts.element.data("select2", this).hide().after(this.container);
        this.container.data("select2", this);
        this.dropdown = this.container.find(".select2-drop");
        this.results = results = this.container.find(resultsSelector);
        this.search = search = this.container.find("input[type=text]");
        this.resultsPage = 0;
        this.initContainer();
        installFilteredMouseMove(this.results);
        this.container.delegate(resultsSelector, "mousemove-filtered", this.bind(this.highlightUnderEvent));
        installDebouncedScroll(80, this.results);
        this.container.delegate(resultsSelector, "scroll-debounced", this.bind(this.loadMoreIfNeeded));
        if ($3.fn.mousewheel) {
          results.mousewheel(function(e, delta, deltaX, deltaY) {
            var top = results.scrollTop(), height;
            if (deltaY > 0 && top - deltaY <= 0) {
              results.scrollTop(0);
              killEvent(e);
            } else if (deltaY < 0 && results.get(0).scrollHeight - results.scrollTop() + deltaY <= results.height()) {
              results.scrollTop(results.get(0).scrollHeight - results.height());
              killEvent(e);
            }
          });
        }
        installKeyUpChangeEvent(search);
        search.bind("keyup-change", this.bind(this.updateResults));
        search.bind("focus", function() {
          search.addClass("select2-focused");
        });
        search.bind("blur", function() {
          search.removeClass("select2-focused");
        });
        this.container.delegate(resultsSelector, "click", this.bind(function(e) {
          if ($3(e.target).closest(".select2-result:not(.select2-disabled)").length > 0) {
            this.highlightUnderEvent(e);
            this.selectHighlighted(e);
          } else {
            killEvent(e);
            this.focusSearch();
          }
        }));
        if ($3.isFunction(this.opts.initSelection)) {
          this.initSelection();
          this.monitorSource();
        }
      },
      destroy: function() {
        var select2 = this.opts.element.data("select2");
        if (select2 !== undefined2) {
          select2.container.remove();
          select2.opts.element.removeData("select2").unbind(".select2").show();
        }
      },
      prepareOpts: function(opts) {
        var element, select, idKey;
        element = opts.element;
        if (element.get(0).tagName.toLowerCase() === "select") {
          this.select = select = opts.element;
        }
        if (select) {
          $3.each(["id", "multiple", "ajax", "query", "createSearchChoice", "initSelection", "data", "tags"], function() {
            if (this in opts) {
              throw new Error("Option '" + this + "' is not allowed for Select2 when attached to a <select> element.");
            }
          });
        }
        opts = $3.extend({}, {
          formatResult: function(data) {
            return data.text;
          },
          formatSelection: function(data) {
            return data.text;
          },
          formatNoMatches: function() {
            return "No matches found";
          },
          formatInputTooShort: function(input, min) {
            return "Please enter " + (min - input.length) + " more characters";
          },
          minimumResultsForSearch: 0,
          minimumInputLength: 0,
          id: function(e) {
            return e.id;
          }
        }, opts);
        if (typeof opts.id !== "function") {
          idKey = opts.id;
          opts.id = function(e) {
            return e[idKey];
          };
        }
        if (select) {
          opts.query = this.bind(function(query) {
            var data = { results: [], more: false }, term = query.term.toUpperCase(), placeholder = this.getPlaceholder();
            element.find("option").each(function(i) {
              var e = $3(this), text = e.text();
              if (i === 0 && placeholder !== undefined2 && text === "") return true;
              if (text.toUpperCase().indexOf(term) >= 0) {
                data.results.push({ id: e.attr("value"), text });
              }
            });
            query.callback(data);
          });
          opts.id = function(e) {
            return e.id;
          };
        } else {
          if (!("query" in opts)) {
            if ("ajax" in opts) {
              opts.query = ajax(opts.ajax);
            } else if ("data" in opts) {
              opts.query = local(opts.data);
            } else if ("tags" in opts) {
              opts.query = tags(opts.tags);
              opts.createSearchChoice = function(term) {
                return { id: term, text: term };
              };
              opts.initSelection = function(element2) {
                var data = [];
                $3(splitVal(element2.val(), ",")).each(function() {
                  data.push({ id: this, text: this });
                });
                return data;
              };
            }
          }
        }
        if (typeof opts.query !== "function") {
          throw "query function not defined for Select2 " + opts.element.attr("id");
        }
        return opts;
      },
      /**
       * Monitor the original element for changes and update select2 accordingly
       */
      monitorSource: function() {
        this.opts.element.bind("change.select2", this.bind(function(e) {
          if (this.opts.element.data("select2-change-triggered") !== true) {
            this.initSelection();
          }
        }));
      },
      /**
       * Triggers the change event on the source element
       */
      triggerChange: function() {
        this.opts.element.data("select2-change-triggered", true);
        this.opts.element.trigger("change");
        this.opts.element.data("select2-change-triggered", false);
      },
      opened: function() {
        return this.container.hasClass("select2-dropdown-open");
      },
      open: function() {
        if (this.opened()) return;
        this.container.addClass("select2-dropdown-open").addClass("select2-container-active");
        this.updateResults(true);
        this.dropdown.show();
        this.focusSearch();
      },
      close: function() {
        if (!this.opened()) return;
        this.dropdown.hide();
        this.container.removeClass("select2-dropdown-open");
        this.results.empty();
        this.clearSearch();
      },
      clearSearch: function() {
      },
      ensureHighlightVisible: function() {
        var results = this.results, children, index, child, hb, rb, y, more;
        children = results.children(".select2-result");
        index = this.highlight();
        if (index < 0) return;
        child = $3(children[index]);
        hb = child.offset().top + child.outerHeight();
        if (index === children.length - 1) {
          more = results.find("li.select2-more-results");
          if (more.length > 0) {
            hb = more.offset().top + more.outerHeight();
          }
        }
        rb = results.offset().top + results.outerHeight();
        if (hb > rb) {
          results.scrollTop(results.scrollTop() + (hb - rb));
        }
        y = child.offset().top - results.offset().top;
        if (y < 0) {
          results.scrollTop(results.scrollTop() + y);
        }
      },
      moveHighlight: function(delta) {
        var choices = this.results.children(".select2-result"), index = this.highlight();
        while (index > -1 && index < choices.length) {
          index += delta;
          if (!$3(choices[index]).hasClass("select2-disabled")) {
            this.highlight(index);
            break;
          }
        }
      },
      highlight: function(index) {
        var choices = this.results.children(".select2-result");
        if (arguments.length === 0) {
          return indexOf(choices.filter(".select2-highlighted")[0], choices.get());
        }
        choices.removeClass("select2-highlighted");
        if (index >= choices.length) index = choices.length - 1;
        if (index < 0) index = 0;
        $3(choices[index]).addClass("select2-highlighted");
        this.ensureHighlightVisible();
        if (this.opened()) this.focusSearch();
      },
      highlightUnderEvent: function(event) {
        var el = $3(event.target).closest(".select2-result");
        if (el.length > 0) {
          this.highlight(el.index());
        }
      },
      loadMoreIfNeeded: function() {
        var results = this.results, more = results.find("li.select2-more-results"), below, offset = -1, page = this.resultsPage + 1;
        if (more.length === 0) return;
        below = more.offset().top - results.offset().top - results.height();
        if (below <= 0) {
          more.addClass("select2-active");
          this.opts.query({ term: this.search.val(), page, callback: this.bind(function(data) {
            var parts = [], self = this;
            $3(data.results).each(function() {
              parts.push("<li class='select2-result'>");
              parts.push(self.opts.formatResult(this));
              parts.push("</li>");
            });
            more.before(parts.join(""));
            results.find(".select2-result").each(function(i) {
              var e = $3(this);
              if (e.data("select2-data") !== undefined2) {
                offset = i;
              } else {
                e.data("select2-data", data.results[i - offset - 1]);
              }
            });
            if (data.more) {
              more.removeClass("select2-active");
            } else {
              more.remove();
            }
            this.resultsPage = page;
          }) });
        }
      },
      /**
       * @param initial whether or not this is the call to this method right after the dropdown has been opened
       */
      updateResults: function(initial) {
        var search = this.search, results = this.results, opts = this.opts, self = this;
        search.addClass("select2-active");
        function render(html) {
          results.html(html);
          results.scrollTop(0);
          search.removeClass("select2-active");
        }
        if (search.val().length < opts.minimumInputLength) {
          render("<li class='select2-no-results'>" + opts.formatInputTooShort(search.val(), opts.minimumInputLength) + "</li>");
          return;
        }
        this.resultsPage = 1;
        opts.query({ term: search.val(), page: this.resultsPage, callback: this.bind(function(data) {
          var parts = [], def;
          if (this.opts.createSearchChoice && search.val() !== "") {
            def = this.opts.createSearchChoice.call(null, search.val(), data.results);
            if (def !== undefined2 && def !== null && self.id(def) !== undefined2 && self.id(def) !== null) {
              if ($3(data.results).filter(
                function() {
                  return equal(self.id(this), self.id(def));
                }
              ).length === 0) {
                data.results.unshift(def);
              }
            }
          }
          if (data.results.length === 0) {
            render("<li class='select2-no-results'>" + opts.formatNoMatches(search.val()) + "</li>");
            return;
          }
          $3(data.results).each(function() {
            parts.push("<li class='select2-result'>");
            parts.push(opts.formatResult(this));
            parts.push("</li>");
          });
          if (data.more === true) {
            parts.push("<li class='select2-more-results'>Loading more results...</li>");
          }
          render(parts.join(""));
          results.children(".select2-result").each(function(i) {
            var d = data.results[i];
            $3(this).data("select2-data", d);
          });
          this.postprocessResults(data, initial);
        }) });
      },
      cancel: function() {
        this.close();
      },
      blur: function() {
        window.setTimeout(this.bind(function() {
          this.close();
          this.container.removeClass("select2-container-active");
          this.clearSearch();
          this.selection.find(".select2-search-choice-focus").removeClass("select2-search-choice-focus");
          this.search.blur();
        }), 10);
      },
      focusSearch: function() {
        window.setTimeout(this.bind(function() {
          this.search.focus();
        }), 10);
      },
      selectHighlighted: function() {
        var data = this.results.find(".select2-highlighted:not(.select2-disabled)").data("select2-data");
        if (data) {
          this.onSelect(data);
        }
      },
      getPlaceholder: function() {
        return this.opts.element.attr("placeholder") || this.opts.element.data("placeholder") || this.opts.placeholder;
      },
      /**
       * Get the desired width for the container element.  This is
       * derived first from option `width` passed to select2, then
       * the inline 'style' on the original element, and finally
       * falls back to the jQuery calculated element width.
       *
       * @returns The width string (with units) for the container.
       */
      getContainerWidth: function() {
        var style, attrs, matches, i, l;
        if (this.opts.width !== undefined2)
          return this.opts.width;
        style = this.opts.element.attr("style");
        if (style !== undefined2) {
          attrs = style.split(";");
          for (i = 0, l = attrs.length; i < l; i = i + 1) {
            matches = attrs[i].replace(/\s/g, "").match(/width:(([-+]?([0-9]*\.)?[0-9]+)(px|em|ex|%|in|cm|mm|pt|pc))/);
            if (matches !== null && matches.length >= 1)
              return matches[1];
          }
        }
        return this.opts.element.width() + "px";
      }
    });
    SingleSelect2 = clazz(AbstractSelect2, {
      createContainer: function() {
        return $3("<div></div>", {
          "class": "select2-container",
          "style": "width: " + this.getContainerWidth()
        }).html([
          "    <a href='javascript:void(0)' class='select2-choice'>",
          "   <span></span><abbr class='select2-search-choice-close' style='display:none;'></abbr>",
          "   <div><b></b></div>",
          "</a>",
          "    <div class='select2-drop' style='display:none;'>",
          "   <div class='select2-search'>",
          "       <input type='text' autocomplete='off'/>",
          "   </div>",
          "   <ul class='select2-results'>",
          "   </ul>",
          "</div>"
        ].join(""));
      },
      open: function() {
        if (this.opened()) return;
        this.parent.open.apply(this, arguments);
      },
      close: function() {
        if (!this.opened()) return;
        this.parent.close.apply(this, arguments);
      },
      focus: function() {
        this.close();
        this.selection.focus();
      },
      isFocused: function() {
        return this.selection.is(":focus");
      },
      cancel: function() {
        this.parent.cancel.apply(this, arguments);
        this.selection.focus();
      },
      initContainer: function() {
        var selection, container = this.container, clickingInside = false, selector = ".select2-choice";
        this.selection = selection = container.find(selector);
        this.search.bind("keydown", this.bind(function(e) {
          switch (e.which) {
            case KEY.UP:
            case KEY.DOWN:
              this.moveHighlight(e.which === KEY.UP ? -1 : 1);
              killEvent(e);
              return;
            case KEY.TAB:
            case KEY.ENTER:
              this.selectHighlighted();
              killEvent(e);
              return;
            case KEY.ESC:
              this.cancel(e);
              e.preventDefault();
              return;
          }
        }));
        container.delegate(selector, "click", this.bind(function(e) {
          clickingInside = true;
          if (this.opened()) {
            this.close();
            selection.focus();
          } else {
            this.open();
          }
          e.preventDefault();
          clickingInside = false;
        }));
        container.delegate(selector, "keydown", this.bind(function(e) {
          if (e.which === KEY.TAB || KEY.isControl(e) || KEY.isFunctionKey(e) || e.which === KEY.ESC) {
            return;
          }
          this.open();
          if (e.which === KEY.PAGE_UP || e.which === KEY.PAGE_DOWN || e.which === KEY.SPACE) {
            killEvent(e);
          }
          if (e.which === KEY.ENTER) {
            killEvent(e);
          }
        }));
        container.delegate(selector, "focus", function() {
          container.addClass("select2-container-active");
        });
        container.delegate(selector, "blur", this.bind(function() {
          if (clickingInside) return;
          if (!this.opened()) this.blur();
        }));
        selection.delegate("abbr", "click", this.bind(function(e) {
          this.val("");
          killEvent(e);
          this.close();
          this.triggerChange();
        }));
        this.setPlaceholder();
      },
      /**
       * Sets selection based on source element's value
       */
      initSelection: function() {
        var selected;
        if (this.opts.element.val() === "") {
          this.updateSelection({ id: "", text: "" });
        } else {
          selected = this.opts.initSelection.call(null, this.opts.element);
          if (selected !== undefined2 && selected !== null) {
            this.updateSelection(selected);
          }
        }
        this.close();
        this.setPlaceholder();
      },
      prepareOpts: function() {
        var opts = this.parent.prepareOpts.apply(this, arguments);
        if (opts.element.get(0).tagName.toLowerCase() === "select") {
          opts.initSelection = function(element) {
            var selected = element.find(":selected");
            return { id: selected.attr("value"), text: selected.text() };
          };
        }
        return opts;
      },
      setPlaceholder: function() {
        var placeholder = this.getPlaceholder();
        if (this.opts.element.val() === "" && placeholder !== undefined2) {
          if (this.select && this.select.find("option:first").text() !== "") return;
          if (typeof placeholder === "object") {
            this.updateSelection(placeholder);
          } else {
            this.selection.find("span").html(placeholder);
          }
          this.selection.addClass("select2-default");
          this.selection.find("abbr").hide();
        }
      },
      postprocessResults: function(data, initial) {
        var selected = 0, self = this, showSearchInput = true;
        this.results.find(".select2-result").each(function(i) {
          if (equal(self.id($3(this).data("select2-data")), self.opts.element.val())) {
            selected = i;
            return false;
          }
        });
        this.highlight(selected);
        if (initial === true) {
          showSearchInput = data.results.length >= this.opts.minimumResultsForSearch;
          this.search.parent().toggle(showSearchInput);
          this.container[showSearchInput ? "addClass" : "removeClass"]("select2-with-searchbox");
        }
      },
      onSelect: function(data) {
        var old = this.opts.element.val();
        this.opts.element.val(this.id(data));
        this.updateSelection(data);
        this.close();
        this.selection.focus();
        if (!equal(old, this.id(data))) {
          this.triggerChange();
        }
      },
      updateSelection: function(data) {
        this.selection.find("span").html(this.opts.formatSelection(data));
        this.selection.removeClass("select2-default");
        if (this.opts.allowClear && this.getPlaceholder() !== undefined2) {
          this.selection.find("abbr").show();
        }
      },
      val: function() {
        var val, data = null;
        if (arguments.length === 0) {
          return this.opts.element.val();
        }
        val = arguments[0];
        if (this.select) {
          this.select.val(val).find(":selected").each(function() {
            data = { id: $3(this).attr("value"), text: $3(this).text() };
            return false;
          });
          this.updateSelection(data);
        } else {
          this.opts.element.val(!val ? "" : this.id(val));
          this.updateSelection(val);
        }
        this.setPlaceholder();
      },
      clearSearch: function() {
        this.search.val("");
      }
    });
    MultiSelect2 = clazz(AbstractSelect2, {
      createContainer: function() {
        return $3("<div></div>", {
          "class": "select2-container select2-container-multi",
          "style": "width: " + this.getContainerWidth()
        }).html([
          "    <ul class='select2-choices'>",
          //"<li class='select2-search-choice'><span>California</span><a href="javascript:void(0)" class="select2-search-choice-close"></a></li>" ,
          "  <li class='select2-search-field'>",
          "    <input type='text' autocomplete='off' style='width: 25px;'>",
          "  </li>",
          "</ul>",
          "<div class='select2-drop' style='display:none;'>",
          "   <ul class='select2-results'>",
          "   </ul>",
          "</div>"
        ].join(""));
      },
      prepareOpts: function() {
        var opts = this.parent.prepareOpts.apply(this, arguments);
        opts = $3.extend({}, {
          closeOnSelect: true
        }, opts);
        if (opts.element.get(0).tagName.toLowerCase() === "select") {
          opts.initSelection = function(element) {
            var data = [];
            element.find(":selected").each(function() {
              data.push({ id: $3(this).attr("value"), text: $3(this).text() });
            });
            return data;
          };
        }
        return opts;
      },
      initContainer: function() {
        var selector = ".select2-choices", selection;
        this.searchContainer = this.container.find(".select2-search-field");
        this.selection = selection = this.container.find(selector);
        this.search.bind("keydown", this.bind(function(e) {
          if (e.which === KEY.BACKSPACE && this.search.val() === "") {
            this.close();
            var choices, selected = selection.find(".select2-search-choice-focus");
            if (selected.length > 0) {
              this.unselect(selected.first());
              this.search.width(10);
              killEvent(e);
              return;
            }
            choices = selection.find(".select2-search-choice");
            if (choices.length > 0) {
              choices.last().addClass("select2-search-choice-focus");
            }
          } else {
            selection.find(".select2-search-choice-focus").removeClass("select2-search-choice-focus");
          }
          if (this.opened()) {
            switch (e.which) {
              case KEY.UP:
              case KEY.DOWN:
                this.moveHighlight(e.which === KEY.UP ? -1 : 1);
                killEvent(e);
                return;
              case KEY.ENTER:
                this.selectHighlighted();
                killEvent(e);
                return;
              case KEY.ESC:
                this.cancel(e);
                e.preventDefault();
                return;
            }
          }
          if (e.which === KEY.TAB || KEY.isControl(e) || KEY.isFunctionKey(e) || e.which === KEY.BACKSPACE || e.which === KEY.ESC) {
            return;
          }
          this.open();
          if (e.which === KEY.PAGE_UP || e.which === KEY.PAGE_DOWN) {
            killEvent(e);
          }
        }));
        this.search.bind("keyup", this.bind(this.resizeSearch));
        this.container.delegate(selector, "click", this.bind(function(e) {
          this.open();
          this.focusSearch();
          e.preventDefault();
        }));
        this.container.delegate(selector, "focus", this.bind(function() {
          this.container.addClass("select2-container-active");
          this.clearPlaceholder();
        }));
        this.clearSearch();
      },
      initSelection: function() {
        var data;
        if (this.opts.element.val() === "") {
          this.updateSelection([]);
        }
        if (this.select || this.opts.element.val() !== "") {
          data = this.opts.initSelection.call(null, this.opts.element);
          if (data !== undefined2 && data !== null) {
            this.updateSelection(data);
          }
        }
        this.close();
        this.clearSearch();
      },
      clearSearch: function() {
        var placeholder = this.getPlaceholder();
        if (placeholder !== undefined2 && this.getVal().length === 0 && this.search.hasClass("select2-focused") === false) {
          this.search.val(placeholder).addClass("select2-default");
          this.search.width(this.getContainerWidth());
        } else {
          this.search.val("").width(10);
        }
      },
      clearPlaceholder: function() {
        if (this.search.hasClass("select2-default")) {
          this.search.val("").removeClass("select2-default");
        }
      },
      open: function() {
        if (this.opened()) return;
        this.parent.open.apply(this, arguments);
        this.resizeSearch();
        this.focusSearch();
      },
      close: function() {
        if (!this.opened()) return;
        this.parent.close.apply(this, arguments);
      },
      focus: function() {
        this.close();
        this.search.focus();
      },
      isFocused: function() {
        return this.search.hasClass("select2-focused");
      },
      updateSelection: function(data) {
        var ids = [], filtered = [], self = this;
        $3(data).each(function() {
          if (indexOf(self.id(this), ids) < 0) {
            ids.push(self.id(this));
            filtered.push(this);
          }
        });
        data = filtered;
        this.selection.find(".select2-search-choice").remove();
        $3(data).each(function() {
          self.addSelectedChoice(this);
        });
        self.postprocessResults();
      },
      onSelect: function(data) {
        this.addSelectedChoice(data);
        if (this.select) {
          this.postprocessResults();
        }
        if (this.opts.closeOnSelect) {
          this.close();
          this.search.width(10);
        } else {
          this.search.width(10);
          this.resizeSearch();
        }
        this.triggerChange();
        this.focusSearch();
      },
      cancel: function() {
        this.close();
        this.focusSearch();
      },
      addSelectedChoice: function(data) {
        var choice, id = this.id(data), parts, val = this.getVal();
        parts = [
          "<li class='select2-search-choice'>",
          this.opts.formatSelection(data),
          "<a href='javascript:void(0)' class='select2-search-choice-close' tabindex='-1'></a>",
          "</li>"
        ];
        choice = $3(parts.join(""));
        choice.find("a").bind("click dblclick", this.bind(function(e) {
          this.unselect($3(e.target));
          this.selection.find(".select2-search-choice-focus").removeClass("select2-search-choice-focus");
          killEvent(e);
          this.close();
          this.focusSearch();
        })).bind("focus", this.bind(function() {
          this.container.addClass("select2-container-active");
        }));
        choice.data("select2-data", data);
        choice.insertBefore(this.searchContainer);
        val.push(id);
        this.setVal(val);
      },
      unselect: function(selected) {
        var val = this.getVal(), index;
        selected = selected.closest(".select2-search-choice");
        if (selected.length === 0) {
          throw "Invalid argument: " + selected + ". Must be .select2-search-choice";
        }
        index = indexOf(this.id(selected.data("select2-data")), val);
        if (index >= 0) {
          val.splice(index, 1);
          this.setVal(val);
          if (this.select) this.postprocessResults();
        }
        selected.remove();
        this.triggerChange();
      },
      postprocessResults: function() {
        var val = this.getVal(), choices = this.results.find(".select2-result"), self = this;
        choices.each(function() {
          var choice = $3(this), id = self.id(choice.data("select2-data"));
          if (indexOf(id, val) >= 0) {
            choice.addClass("select2-disabled");
          } else {
            choice.removeClass("select2-disabled");
          }
        });
        choices.each(function(i) {
          if (!$3(this).hasClass("select2-disabled")) {
            self.highlight(i);
            return false;
          }
        });
      },
      resizeSearch: function() {
        var minimumWidth, left, maxWidth, containerLeft, searchWidth;
        minimumWidth = measureTextWidth(this.search) + 10;
        left = this.search.offset().left;
        maxWidth = this.selection.width();
        containerLeft = this.selection.offset().left;
        searchWidth = maxWidth - (left - containerLeft) - getSideBorderPadding(this.search);
        if (searchWidth < minimumWidth) {
          searchWidth = maxWidth - getSideBorderPadding(this.search);
        }
        if (searchWidth < 40) {
          searchWidth = maxWidth - getSideBorderPadding(this.search);
        }
        this.search.width(searchWidth);
      },
      getVal: function() {
        var val;
        if (this.select) {
          val = this.select.val();
          return val === null ? [] : val;
        } else {
          val = this.opts.element.val();
          return splitVal(val, ",");
        }
      },
      setVal: function(val) {
        var unique = [];
        if (this.select) {
          this.select.val(val);
        } else {
          $3(val).each(function() {
            if (indexOf(this, unique) < 0) unique.push(this);
          });
          this.opts.element.val(unique.length === 0 ? "" : unique.join(","));
        }
      },
      val: function() {
        var val, data = [], self = this;
        if (arguments.length === 0) {
          return this.getVal();
        }
        val = arguments[0];
        if (this.select) {
          this.setVal(val);
          this.select.find(":selected").each(function() {
            data.push({ id: $3(this).attr("value"), text: $3(this).text() });
          });
          this.updateSelection(data);
        } else {
          val = val === null ? [] : val;
          this.setVal(val);
          $3(val).each(function() {
            data.push(self.id(this));
          });
          this.setVal(data);
          this.updateSelection(val);
        }
        this.clearSearch();
      }
    });
    $3.fn.select2 = function() {
      var args = Array.prototype.slice.call(arguments, 0), opts, select2, value, multiple, allowedMethods = ["val", "destroy", "open", "close", "focus", "isFocused"];
      this.each(function() {
        if (args.length === 0 || typeof args[0] === "object") {
          opts = args.length === 0 ? {} : $3.extend({}, args[0]);
          opts.element = $3(this);
          if (opts.element.get(0).tagName.toLowerCase() === "select") {
            multiple = opts.element.attr("multiple");
          } else {
            multiple = opts.multiple || false;
            if ("tags" in opts) {
              opts.multiple = multiple = true;
            }
          }
          select2 = multiple ? new MultiSelect2() : new SingleSelect2();
          select2.init(opts);
        } else if (typeof args[0] === "string") {
          if (indexOf(args[0], allowedMethods) < 0) {
            throw "Unknown method: " + args[0];
          }
          value = undefined2;
          select2 = $3(this).data("select2");
          if (select2 === undefined2) return;
          value = select2[args[0]].apply(select2, args.slice(1));
          if (value !== undefined2) {
            return false;
          }
        } else {
          throw "Invalid arguments to select2 plugin: " + args;
        }
      });
      return value === undefined2 ? this : value;
    };
    window.Select2 = {
      query: {
        ajax,
        local,
        tags
      },
      util: {
        debounce
      },
      "class": {
        "abstract": AbstractSelect2,
        "single": SingleSelect2,
        "multi": MultiSelect2
      }
    };
  })(jQuery);
})();
/*! Bundled license information:

jquery/dist/jquery.js:
  (*!
   * jQuery JavaScript Library v3.7.1
   * https://jquery.com/
   *
   * Copyright OpenJS Foundation and other contributors
   * Released under the MIT license
   * https://jquery.org/license
   *
   * Date: 2023-08-28T13:37Z
   *)

select2/dist/js/select2.full.js:
  (*!
   * Select2 4.1.0-rc.0
   * https://select2.github.io
   *
   * Released under the MIT license
   * https://github.com/select2/select2/blob/master/LICENSE.md
   *)
  (**
   * @license almond 0.3.3 Copyright jQuery Foundation and other contributors.
   * Released under MIT license, http://github.com/requirejs/almond/LICENSE
   *)
  (*!
   * jQuery Mousewheel 3.1.13
   *
   * Copyright jQuery Foundation and other contributors
   * Released under the MIT license
   * http://jquery.org/license
   *)
*/
//# sourceMappingURL=/assets/select2.js.map
