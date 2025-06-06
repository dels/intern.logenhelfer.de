var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn2, res) => function __init() {
  return fn2 && (res = (0, fn2[__getOwnPropNames(fn2)[0]])(fn2 = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
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

// node_modules/.pnpm/jquery@3.7.1/node_modules/jquery/dist/jquery.js
var require_jquery = __commonJS({
  "node_modules/.pnpm/jquery@3.7.1/node_modules/jquery/dist/jquery.js"(exports, module) {
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
      function toType2(obj) {
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
        var length = !!obj && "length" in obj && obj.length, type = toType2(obj);
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
        function markFunction(fn2) {
          fn2[expando] = true;
          return fn2;
        }
        function assert(fn2) {
          var el = document3.createElement("fieldset");
          try {
            return !!fn2(el);
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
        function createPositionalPseudo(fn2) {
          return markFunction(function(argument) {
            argument = +argument;
            return markFunction(function(seed, matches2) {
              var j, matchIndexes = fn2([], seed.length, argument), i2 = matchIndexes.length;
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
          var fn2 = Expr.attrHandle[name.toLowerCase()], val = fn2 && hasOwn.call(Expr.attrHandle, name.toLowerCase()) ? fn2(elem, name, !documentIsHTML) : void 0;
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
                var cache, outerCache, node, nodeIndex, start2, dir2 = simple !== forward ? "nextSibling" : "previousSibling", parent = elem.parentNode, name = ofType && elem.nodeName.toLowerCase(), useCache = !xml && !ofType, diff = false;
                if (parent) {
                  if (simple) {
                    while (dir2) {
                      node = elem;
                      while (node = node[dir2]) {
                        if (ofType ? nodeName(node, name) : node.nodeType === 1) {
                          return false;
                        }
                      }
                      start2 = dir2 = type === "only" && !start2 && "nextSibling";
                    }
                    return true;
                  }
                  start2 = [forward ? parent.firstChild : parent.lastChild];
                  if (forward && useCache) {
                    outerCache = parent[expando] || (parent[expando] = {});
                    cache = outerCache[type] || [];
                    nodeIndex = cache[0] === dirruns && cache[1];
                    diff = nodeIndex && cache[2];
                    node = nodeIndex && parent.childNodes[nodeIndex];
                    while (node = ++nodeIndex && node && node[dir2] || // Fallback to seeking `elem` from the start
                    (diff = nodeIndex = 0) || start2.pop()) {
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
                      while (node = ++nodeIndex && node && node[dir2] || (diff = nodeIndex = 0) || start2.pop()) {
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
              var args, fn2 = Expr.pseudos[pseudo] || Expr.setFilters[pseudo.toLowerCase()] || find.error("unsupported pseudo: " + pseudo);
              if (fn2[expando]) {
                return fn2(argument);
              }
              if (fn2.length > 1) {
                args = [pseudo, pseudo, "", argument];
                return Expr.setFilters.hasOwnProperty(pseudo.toLowerCase()) ? markFunction(function(seed, matches2) {
                  var idx, matched = fn2(seed, argument), i2 = matched.length;
                  while (i2--) {
                    idx = indexOf.call(seed, matched[i2]);
                    seed[idx] = !(matches2[idx] = matched[i2]);
                  }
                }) : function(elem) {
                  return fn2(elem, 0, args);
                };
              }
              return fn2;
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
              var hash3 = window2.location && window2.location.hash;
              return hash3 && hash3.slice(1) === elem.id;
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
      }, function(name, fn2) {
        jQuery2.fn[name] = function(until, selector) {
          var matched = jQuery2.map(this, fn2, until);
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
                  } else if (arg && arg.length && toType2(arg) !== "string") {
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
          has: function(fn2) {
            return fn2 ? jQuery2.inArray(fn2, list) > -1 : list.length > 0;
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
            "catch": function(fn2) {
              return promise.then(null, fn2);
            },
            // Keep pipe for back-compat
            pipe: function() {
              var fns = arguments;
              return jQuery2.Deferred(function(newDefer) {
                jQuery2.each(tuples, function(_i, tuple) {
                  var fn2 = isFunction(fns[tuple[4]]) && fns[tuple[4]];
                  deferred[tuple[1]](function() {
                    var returned = fn2 && fn2.apply(this, arguments);
                    if (returned && isFunction(returned.promise)) {
                      returned.promise().progress(newDefer.notify).done(newDefer.resolve).fail(newDefer.reject);
                    } else {
                      newDefer[tuple[0] + "With"](
                        this,
                        fn2 ? [returned] : arguments
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
      jQuery2.fn.ready = function(fn2) {
        readyList.then(fn2).catch(function(error) {
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
      var access = function(elems, fn2, key, value, chainable, emptyGet, raw) {
        var i = 0, len = elems.length, bulk = key == null;
        if (toType2(key) === "object") {
          chainable = true;
          for (i in key) {
            access(elems, fn2, i, key[i], true, emptyGet, raw);
          }
        } else if (value !== void 0) {
          chainable = true;
          if (!isFunction(value)) {
            raw = true;
          }
          if (bulk) {
            if (raw) {
              fn2.call(elems, value);
              fn2 = null;
            } else {
              bulk = fn2;
              fn2 = function(elem, _key, value2) {
                return bulk.call(jQuery2(elem), value2);
              };
            }
          }
          if (fn2) {
            for (; i < len; i++) {
              fn2(
                elems[i],
                key,
                raw ? value : value.call(elems[i], i, fn2(elems[i], key))
              );
            }
          }
        }
        if (chainable) {
          return elems;
        }
        if (bulk) {
          return fn2.call(elems);
        }
        return len ? fn2(elems[0], key) : emptyGet;
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
      function Data2() {
        this.expando = jQuery2.expando + Data2.uid++;
      }
      Data2.uid = 1;
      Data2.prototype = {
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
      var dataPriv = new Data2();
      var dataUser = new Data2();
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
          var queue = jQuery2.queue(elem, type), startLength = queue.length, fn2 = queue.shift(), hooks = jQuery2._queueHooks(elem, type), next = function() {
            jQuery2.dequeue(elem, type);
          };
          if (fn2 === "inprogress") {
            fn2 = queue.shift();
            startLength--;
          }
          if (fn2) {
            if (type === "fx") {
              queue.unshift("inprogress");
            }
            delete hooks.stop;
            fn2.call(elem, next, hooks);
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
            if (toType2(elem) === "object") {
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
      function on(elem, types, selector, data, fn2, one) {
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
        if (data == null && fn2 == null) {
          fn2 = selector;
          data = selector = void 0;
        } else if (fn2 == null) {
          if (typeof selector === "string") {
            fn2 = data;
            data = void 0;
          } else {
            fn2 = data;
            data = selector;
            selector = void 0;
          }
        }
        if (fn2 === false) {
          fn2 = returnFalse;
        } else if (!fn2) {
          return elem;
        }
        if (one === 1) {
          origFn = fn2;
          fn2 = function(event) {
            jQuery2().off(event);
            return origFn.apply(this, arguments);
          };
          fn2.guid = origFn.guid || (origFn.guid = jQuery2.guid++);
        }
        return elem.each(function() {
          jQuery2.event.add(this, types, fn2, data, selector);
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
        on: function(types, selector, data, fn2) {
          return on(this, types, selector, data, fn2);
        },
        one: function(types, selector, data, fn2) {
          return on(this, types, selector, data, fn2, 1);
        },
        off: function(types, selector, fn2) {
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
            fn2 = selector;
            selector = void 0;
          }
          if (fn2 === false) {
            fn2 = returnFalse;
          }
          return this.each(function() {
            jQuery2.event.remove(this, types, fn2, selector);
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
      function Tween(elem, options, prop, end2, easing) {
        return new Tween.prototype.init(elem, options, prop, end2, easing);
      }
      jQuery2.Tween = Tween;
      Tween.prototype = {
        constructor: Tween,
        init: function(elem, options, prop, end2, easing, unit) {
          this.elem = elem;
          this.prop = prop;
          this.easing = easing || jQuery2.easing._default;
          this.options = options;
          this.start = this.now = this.cur();
          this.end = end2;
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
          createTween: function(prop, end2) {
            var tween = jQuery2.Tween(
              elem,
              animation.opts,
              prop,
              end2,
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
      jQuery2.speed = function(speed, easing, fn2) {
        var opt = speed && typeof speed === "object" ? jQuery2.extend({}, speed) : {
          complete: fn2 || !fn2 && easing || isFunction(speed) && speed,
          duration: speed,
          easing: fn2 && easing || easing && !isFunction(easing) && easing
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
              var value, option, i, options = elem.options, index = elem.selectedIndex, one = elem.type === "select-one", values = one ? null : [], max2 = one ? index + 1 : options.length;
              if (index < 0) {
                i = max2;
              } else {
                i = one ? index : 0;
              }
              for (; i < max2; i++) {
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
        } else if (!traditional && toType2(obj) === "object") {
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
      support.createHTMLDocument = function() {
        var body = document2.implementation.createHTMLDocument("").body;
        body.innerHTML = "<form></form><form></form>";
        return body.childNodes.length === 2;
      }();
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
        return jQuery2.grep(jQuery2.timers, function(fn2) {
          return elem === fn2.elem;
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
          var offsetParent, offset2, doc, elem = this[0], parentOffset = { top: 0, left: 0 };
          if (jQuery2.css(elem, "position") === "fixed") {
            offset2 = elem.getBoundingClientRect();
          } else {
            offset2 = this.offset();
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
            top: offset2.top - parentOffset.top - jQuery2.css(elem, "marginTop", true),
            left: offset2.left - parentOffset.left - jQuery2.css(elem, "marginLeft", true)
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
        var top2 = "pageYOffset" === prop;
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
                !top2 ? val2 : win.pageXOffset,
                top2 ? val2 : win.pageYOffset
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
        jQuery2.fn[type] = function(fn2) {
          return this.on(type, fn2);
        };
      });
      jQuery2.fn.extend({
        bind: function(types, data, fn2) {
          return this.on(types, null, data, fn2);
        },
        unbind: function(types, fn2) {
          return this.off(types, null, fn2);
        },
        delegate: function(selector, types, data, fn2) {
          return this.on(types, selector, data, fn2);
        },
        undelegate: function(selector, types, fn2) {
          return arguments.length === 1 ? this.off(selector, "**") : this.off(types, selector || "**", fn2);
        },
        hover: function(fnOver, fnOut) {
          return this.on("mouseenter", fnOver).on("mouseleave", fnOut || fnOver);
        }
      });
      jQuery2.each(
        "blur focus focusin focusout resize scroll click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup contextmenu".split(" "),
        function(_i, name) {
          jQuery2.fn[name] = function(data, fn2) {
            return arguments.length > 0 ? this.on(name, null, data, fn2) : this.trigger(name);
          };
        }
      );
      var rtrim = /^[\s\uFEFF\xA0]+|([^\s\uFEFF\xA0])[\s\uFEFF\xA0]+$/g;
      jQuery2.proxy = function(fn2, context) {
        var tmp, args, proxy;
        if (typeof context === "string") {
          tmp = fn2[context];
          context = fn2;
          fn2 = tmp;
        }
        if (!isFunction(fn2)) {
          return void 0;
        }
        args = slice.call(arguments, 2);
        proxy = function() {
          return fn2.apply(context || this, args.concat(slice.call(arguments)));
        };
        proxy.guid = fn2.guid = fn2.guid || jQuery2.guid++;
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
      jQuery2.type = toType2;
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

// node_modules/.pnpm/jquery-contextmenu@2.9.2_jquery@3.7.1/node_modules/jquery-contextmenu/dist/jquery.contextMenu.js
var require_jquery_contextMenu = __commonJS({
  "node_modules/.pnpm/jquery-contextmenu@2.9.2_jquery@3.7.1/node_modules/jquery-contextmenu/dist/jquery.contextMenu.js"(exports) {
    init_shim_jquery();
    (function(factory) {
      if (typeof define === "function" && define.amd) {
        define(["jquery"], factory);
      } else if (typeof exports === "object") {
        factory(require_jquery());
      } else {
        factory(jQuery);
      }
    })(function($7) {
      "use strict";
      $7.support.htmlMenuitem = "HTMLMenuItemElement" in window;
      $7.support.htmlCommand = "HTMLCommandElement" in window;
      $7.support.eventSelectstart = "onselectstart" in document.documentElement;
      if (!$7.ui || !$7.widget) {
        $7.cleanData = /* @__PURE__ */ function(orig) {
          return function(elems) {
            var events, elem, i;
            for (i = 0; elems[i] != null; i++) {
              elem = elems[i];
              try {
                events = $7._data(elem, "events");
                if (events && events.remove) {
                  $7(elem).triggerHandler("remove");
                }
              } catch (e) {
              }
            }
            orig(elems);
          };
        }($7.cleanData);
      }
      var $currentTrigger = null, initialized = false, $win = $7(window), counter = 0, namespaces = {}, menus = {}, types = {}, defaults = {
        // selector of contextMenu trigger
        selector: null,
        // where to append the menu to
        appendTo: null,
        // method to trigger context menu ["right", "left", "hover"]
        trigger: "right",
        // hide menu when mouse leaves trigger / menu elements
        autoHide: false,
        // ms to wait before showing a hover-triggered context menu
        delay: 200,
        // flag denoting if a second trigger should simply move (true) or rebuild (false) an open menu
        // as long as the trigger happened on one of the trigger-element's child nodes
        reposition: true,
        // Flag denoting if a second trigger should close the menu, as long as
        // the trigger happened on one of the trigger-element's child nodes.
        // This overrides the reposition option.
        hideOnSecondTrigger: false,
        //ability to select submenu
        selectableSubMenu: false,
        // Default classname configuration to be able avoid conflicts in frameworks
        classNames: {
          hover: "context-menu-hover",
          // Item hover
          disabled: "context-menu-disabled",
          // Item disabled
          visible: "context-menu-visible",
          // Item visible
          notSelectable: "context-menu-not-selectable",
          // Item not selectable
          icon: "context-menu-icon",
          iconEdit: "context-menu-icon-edit",
          iconCut: "context-menu-icon-cut",
          iconCopy: "context-menu-icon-copy",
          iconPaste: "context-menu-icon-paste",
          iconDelete: "context-menu-icon-delete",
          iconAdd: "context-menu-icon-add",
          iconQuit: "context-menu-icon-quit",
          iconLoadingClass: "context-menu-icon-loading"
        },
        // determine position to show menu at
        determinePosition: function($menu) {
          if ($7.ui && $7.ui.position) {
            $menu.css("display", "block").position({
              my: "center top",
              at: "center bottom",
              of: this,
              offset: "0 5",
              collision: "fit"
            }).css("display", "none");
          } else {
            var offset2 = this.offset();
            offset2.top += this.outerHeight();
            offset2.left += this.outerWidth() / 2 - $menu.outerWidth() / 2;
            $menu.css(offset2);
          }
        },
        // position menu
        position: function(opt, x, y) {
          var offset2;
          if (!x && !y) {
            opt.determinePosition.call(this, opt.$menu);
            return;
          } else if (x === "maintain" && y === "maintain") {
            offset2 = opt.$menu.position();
          } else {
            var offsetParentOffset = opt.$menu.offsetParent().offset();
            offset2 = { top: y - offsetParentOffset.top, left: x - offsetParentOffset.left };
          }
          var bottom2 = $win.scrollTop() + $win.height(), right2 = $win.scrollLeft() + $win.width(), height = opt.$menu.outerHeight(), width = opt.$menu.outerWidth();
          if (offset2.top + height > bottom2) {
            offset2.top -= height;
          }
          if (offset2.top < 0) {
            offset2.top = 0;
          }
          if (offset2.left + width > right2) {
            offset2.left -= width;
          }
          if (offset2.left < 0) {
            offset2.left = 0;
          }
          opt.$menu.css(offset2);
        },
        // position the sub-menu
        positionSubmenu: function($menu) {
          if (typeof $menu === "undefined") {
            return;
          }
          if ($7.ui && $7.ui.position) {
            $menu.css("display", "block").position({
              my: "left top-5",
              at: "right top",
              of: this,
              collision: "flipfit fit"
            }).css("display", "");
          } else {
            var offset2 = {
              top: -9,
              left: this.outerWidth() - 5
            };
            $menu.css(offset2);
          }
        },
        // offset to add to zIndex
        zIndex: 1,
        // show hide animation settings
        animation: {
          duration: 50,
          show: "slideDown",
          hide: "slideUp"
        },
        // events
        events: {
          preShow: $7.noop,
          show: $7.noop,
          hide: $7.noop,
          activated: $7.noop
        },
        // default callback
        callback: null,
        // list of contextMenu items
        items: {}
      }, hoveract = {
        timer: null,
        pageX: null,
        pageY: null
      }, zindex = function($t) {
        var zin = 0, $tt = $t;
        while (true) {
          zin = Math.max(zin, parseInt($tt.css("z-index"), 10) || 0);
          $tt = $tt.parent();
          if (!$tt || !$tt.length || "html body".indexOf($tt.prop("nodeName").toLowerCase()) > -1) {
            break;
          }
        }
        return zin;
      }, handle = {
        // abort anything
        abortevent: function(e) {
          e.preventDefault();
          e.stopImmediatePropagation();
        },
        // contextmenu show dispatcher
        contextmenu: function(e) {
          var $this = $7(this);
          if (e.data.events.preShow($this, e) === false) {
            return;
          }
          if (e.data.trigger === "right") {
            e.preventDefault();
            e.stopImmediatePropagation();
          }
          if (e.data.trigger !== "right" && e.data.trigger !== "demand" && e.originalEvent) {
            return;
          }
          if (typeof e.mouseButton !== "undefined" && e.data) {
            if (!(e.data.trigger === "left" && e.mouseButton === 0) && !(e.data.trigger === "right" && e.mouseButton === 2)) {
              return;
            }
          }
          if ($this.hasClass("context-menu-active")) {
            return;
          }
          if (!$this.hasClass("context-menu-disabled")) {
            $currentTrigger = $this;
            if (e.data.build) {
              var built = e.data.build($currentTrigger, e);
              if (built === false) {
                return;
              }
              e.data = $7.extend(true, {}, defaults, e.data, built || {});
              if (!e.data.items || $7.isEmptyObject(e.data.items)) {
                if (window.console) {
                  (console.error || console.log).call(console, "No items specified to show in contextMenu");
                }
                throw new Error("No Items specified");
              }
              e.data.$trigger = $currentTrigger;
              op.create(e.data);
            }
            op.show.call($this, e.data, e.pageX, e.pageY);
          }
        },
        // contextMenu left-click trigger
        click: function(e) {
          e.preventDefault();
          e.stopImmediatePropagation();
          $7(this).trigger($7.Event("contextmenu", { data: e.data, pageX: e.pageX, pageY: e.pageY }));
        },
        // contextMenu right-click trigger
        mousedown: function(e) {
          var $this = $7(this);
          if ($currentTrigger && $currentTrigger.length && !$currentTrigger.is($this)) {
            $currentTrigger.data("contextMenu").$menu.trigger("contextmenu:hide");
          }
          if (e.button === 2) {
            $currentTrigger = $this.data("contextMenuActive", true);
          }
        },
        // contextMenu right-click trigger
        mouseup: function(e) {
          var $this = $7(this);
          if ($this.data("contextMenuActive") && $currentTrigger && $currentTrigger.length && $currentTrigger.is($this) && !$this.hasClass("context-menu-disabled")) {
            e.preventDefault();
            e.stopImmediatePropagation();
            $currentTrigger = $this;
            $this.trigger($7.Event("contextmenu", { data: e.data, pageX: e.pageX, pageY: e.pageY }));
          }
          $this.removeData("contextMenuActive");
        },
        // contextMenu hover trigger
        mouseenter: function(e) {
          var $this = $7(this), $related = $7(e.relatedTarget), $document = $7(document);
          if ($related.is(".context-menu-list") || $related.closest(".context-menu-list").length) {
            return;
          }
          if ($currentTrigger && $currentTrigger.length) {
            return;
          }
          hoveract.pageX = e.pageX;
          hoveract.pageY = e.pageY;
          hoveract.data = e.data;
          $document.on("mousemove.contextMenuShow", handle.mousemove);
          hoveract.timer = setTimeout(function() {
            hoveract.timer = null;
            $document.off("mousemove.contextMenuShow");
            $currentTrigger = $this;
            $this.trigger($7.Event("contextmenu", {
              data: hoveract.data,
              pageX: hoveract.pageX,
              pageY: hoveract.pageY
            }));
          }, e.data.delay);
        },
        // contextMenu hover trigger
        mousemove: function(e) {
          hoveract.pageX = e.pageX;
          hoveract.pageY = e.pageY;
        },
        // contextMenu hover trigger
        mouseleave: function(e) {
          var $related = $7(e.relatedTarget);
          if ($related.is(".context-menu-list") || $related.closest(".context-menu-list").length) {
            return;
          }
          try {
            clearTimeout(hoveract.timer);
          } catch (e2) {
          }
          hoveract.timer = null;
        },
        // click on layer to hide contextMenu
        layerClick: function(e) {
          var $this = $7(this), root = $this.data("contextMenuRoot"), button = e.button, x = e.pageX, y = e.pageY, fakeClick = x === void 0, target, offset2;
          e.preventDefault();
          setTimeout(function() {
            if (fakeClick) {
              if (root !== null && typeof root !== "undefined" && root.$menu !== null && typeof root.$menu !== "undefined") {
                root.$menu.trigger("contextmenu:hide");
              }
              return;
            }
            var $window;
            var triggerAction = root.trigger === "left" && button === 0 || root.trigger === "right" && button === 2;
            if (document.elementFromPoint && root.$layer) {
              root.$layer.hide();
              target = document.elementFromPoint(x - $win.scrollLeft(), y - $win.scrollTop());
              if (target !== null && target.isContentEditable) {
                var range = document.createRange(), sel = window.getSelection();
                range.selectNode(target);
                range.collapse(true);
                sel.removeAllRanges();
                sel.addRange(range);
              }
              $7(target).trigger(e);
              root.$layer.show();
            }
            if (root.hideOnSecondTrigger && triggerAction && root.$menu !== null && typeof root.$menu !== "undefined") {
              root.$menu.trigger("contextmenu:hide");
              return;
            }
            if (root.reposition && triggerAction) {
              if (document.elementFromPoint) {
                if (root.$trigger.is(target)) {
                  root.position.call(root.$trigger, root, x, y);
                  return;
                }
              } else {
                offset2 = root.$trigger.offset();
                $window = $7(window);
                offset2.top += $window.scrollTop();
                if (offset2.top <= e.pageY) {
                  offset2.left += $window.scrollLeft();
                  if (offset2.left <= e.pageX) {
                    offset2.bottom = offset2.top + root.$trigger.outerHeight();
                    if (offset2.bottom >= e.pageY) {
                      offset2.right = offset2.left + root.$trigger.outerWidth();
                      if (offset2.right >= e.pageX) {
                        root.position.call(root.$trigger, root, x, y);
                        return;
                      }
                    }
                  }
                }
              }
            }
            if (target && triggerAction) {
              root.$trigger.one("contextmenu:hidden", function() {
                $7(target).contextMenu({ x, y, button });
              });
            }
            if (root !== null && typeof root !== "undefined" && root.$menu !== null && typeof root.$menu !== "undefined") {
              root.$menu.trigger("contextmenu:hide");
            }
          }, 50);
        },
        // key handled :hover
        keyStop: function(e, opt) {
          if (!opt.isInput) {
            e.preventDefault();
          }
          e.stopPropagation();
        },
        key: function(e) {
          var opt = {};
          if ($currentTrigger) {
            opt = $currentTrigger.data("contextMenu") || {};
          }
          if (typeof opt.zIndex === "undefined") {
            opt.zIndex = 0;
          }
          var targetZIndex = 0;
          var getZIndexOfTriggerTarget = function(target) {
            if (target.style.zIndex !== "") {
              targetZIndex = target.style.zIndex;
            } else {
              if (target.offsetParent !== null && typeof target.offsetParent !== "undefined") {
                getZIndexOfTriggerTarget(target.offsetParent);
              } else if (target.parentElement !== null && typeof target.parentElement !== "undefined") {
                getZIndexOfTriggerTarget(target.parentElement);
              }
            }
          };
          getZIndexOfTriggerTarget(e.target);
          if (opt.$menu && parseInt(targetZIndex, 10) > parseInt(opt.$menu.css("zIndex"), 10)) {
            return;
          }
          switch (e.keyCode) {
            case 9:
            case 38:
              handle.keyStop(e, opt);
              if (opt.isInput) {
                if (e.keyCode === 9 && e.shiftKey) {
                  e.preventDefault();
                  if (opt.$selected) {
                    opt.$selected.find("input, textarea, select").blur();
                  }
                  if (opt.$menu !== null && typeof opt.$menu !== "undefined") {
                    opt.$menu.trigger("prevcommand");
                  }
                  return;
                } else if (e.keyCode === 38 && opt.$selected.find("input, textarea, select").prop("type") === "checkbox") {
                  e.preventDefault();
                  return;
                }
              } else if (e.keyCode !== 9 || e.shiftKey) {
                if (opt.$menu !== null && typeof opt.$menu !== "undefined") {
                  opt.$menu.trigger("prevcommand");
                }
                return;
              }
              break;
            // omitting break;
            // case 9: // tab - reached through omitted break;
            case 40:
              handle.keyStop(e, opt);
              if (opt.isInput) {
                if (e.keyCode === 9) {
                  e.preventDefault();
                  if (opt.$selected) {
                    opt.$selected.find("input, textarea, select").blur();
                  }
                  if (opt.$menu !== null && typeof opt.$menu !== "undefined") {
                    opt.$menu.trigger("nextcommand");
                  }
                  return;
                } else if (e.keyCode === 40 && opt.$selected.find("input, textarea, select").prop("type") === "checkbox") {
                  e.preventDefault();
                  return;
                }
              } else {
                if (opt.$menu !== null && typeof opt.$menu !== "undefined") {
                  opt.$menu.trigger("nextcommand");
                }
                return;
              }
              break;
            case 37:
              handle.keyStop(e, opt);
              if (opt.isInput || !opt.$selected || !opt.$selected.length) {
                break;
              }
              if (!opt.$selected.parent().hasClass("context-menu-root")) {
                var $parent = opt.$selected.parent().parent();
                opt.$selected.trigger("contextmenu:blur");
                opt.$selected = $parent;
                return;
              }
              break;
            case 39:
              handle.keyStop(e, opt);
              if (opt.isInput || !opt.$selected || !opt.$selected.length) {
                break;
              }
              var itemdata = opt.$selected.data("contextMenu") || {};
              if (itemdata.$menu && opt.$selected.hasClass("context-menu-submenu")) {
                opt.$selected = null;
                itemdata.$selected = null;
                itemdata.$menu.trigger("nextcommand");
                return;
              }
              break;
            case 35:
            // end
            case 36:
              if (opt.$selected && opt.$selected.find("input, textarea, select").length) {
                return;
              } else {
                (opt.$selected && opt.$selected.parent() || opt.$menu).children(":not(." + opt.classNames.disabled + ", ." + opt.classNames.notSelectable + ")")[e.keyCode === 36 ? "first" : "last"]().trigger("contextmenu:focus");
                e.preventDefault();
                return;
              }
              break;
            case 13:
              handle.keyStop(e, opt);
              if (opt.isInput) {
                if (opt.$selected && !opt.$selected.is("textarea, select")) {
                  e.preventDefault();
                  return;
                }
                break;
              }
              if (typeof opt.$selected !== "undefined" && opt.$selected !== null) {
                opt.$selected.trigger("mouseup");
              }
              return;
            case 32:
            // space
            case 33:
            // page up
            case 34:
              handle.keyStop(e, opt);
              return;
            case 27:
              handle.keyStop(e, opt);
              if (opt.$menu !== null && typeof opt.$menu !== "undefined") {
                opt.$menu.trigger("contextmenu:hide");
              }
              return;
            default:
              var k = String.fromCharCode(e.keyCode).toUpperCase();
              if (opt.accesskeys && opt.accesskeys[k]) {
                opt.accesskeys[k].$node.trigger(opt.accesskeys[k].$menu ? "contextmenu:focus" : "mouseup");
                return;
              }
              break;
          }
          e.stopPropagation();
          if (typeof opt.$selected !== "undefined" && opt.$selected !== null) {
            opt.$selected.trigger(e);
          }
        },
        // select previous possible command in menu
        prevItem: function(e) {
          e.stopPropagation();
          var opt = $7(this).data("contextMenu") || {};
          var root = $7(this).data("contextMenuRoot") || {};
          if (opt.$selected) {
            var $s = opt.$selected;
            opt = opt.$selected.parent().data("contextMenu") || {};
            opt.$selected = $s;
          }
          var $children = opt.$menu.children(), $prev = !opt.$selected || !opt.$selected.prev().length ? $children.last() : opt.$selected.prev(), $round = $prev;
          while ($prev.hasClass(root.classNames.disabled) || $prev.hasClass(root.classNames.notSelectable) || $prev.is(":hidden")) {
            if ($prev.prev().length) {
              $prev = $prev.prev();
            } else {
              $prev = $children.last();
            }
            if ($prev.is($round)) {
              return;
            }
          }
          if (opt.$selected) {
            handle.itemMouseleave.call(opt.$selected.get(0), e);
          }
          handle.itemMouseenter.call($prev.get(0), e);
          var $input = $prev.find("input, textarea, select");
          if ($input.length) {
            $input.focus();
          }
        },
        // select next possible command in menu
        nextItem: function(e) {
          e.stopPropagation();
          var opt = $7(this).data("contextMenu") || {};
          var root = $7(this).data("contextMenuRoot") || {};
          if (opt.$selected) {
            var $s = opt.$selected;
            opt = opt.$selected.parent().data("contextMenu") || {};
            opt.$selected = $s;
          }
          var $children = opt.$menu.children(), $next = !opt.$selected || !opt.$selected.next().length ? $children.first() : opt.$selected.next(), $round = $next;
          while ($next.hasClass(root.classNames.disabled) || $next.hasClass(root.classNames.notSelectable) || $next.is(":hidden")) {
            if ($next.next().length) {
              $next = $next.next();
            } else {
              $next = $children.first();
            }
            if ($next.is($round)) {
              return;
            }
          }
          if (opt.$selected) {
            handle.itemMouseleave.call(opt.$selected.get(0), e);
          }
          handle.itemMouseenter.call($next.get(0), e);
          var $input = $next.find("input, textarea, select");
          if ($input.length) {
            $input.focus();
          }
        },
        // flag that we're inside an input so the key handler can act accordingly
        focusInput: function() {
          var $this = $7(this).closest(".context-menu-item"), data = $this.data(), opt = data.contextMenu, root = data.contextMenuRoot;
          root.$selected = opt.$selected = $this;
          root.isInput = opt.isInput = true;
        },
        // flag that we're inside an input so the key handler can act accordingly
        blurInput: function() {
          var $this = $7(this).closest(".context-menu-item"), data = $this.data(), opt = data.contextMenu, root = data.contextMenuRoot;
          root.isInput = opt.isInput = false;
        },
        // :hover on menu
        menuMouseenter: function() {
          var root = $7(this).data().contextMenuRoot;
          root.hovering = true;
        },
        // :hover on menu
        menuMouseleave: function(e) {
          var root = $7(this).data().contextMenuRoot;
          if (root.$layer && root.$layer.is(e.relatedTarget)) {
            root.hovering = false;
          }
        },
        // :hover done manually so key handling is possible
        itemMouseenter: function(e) {
          var $this = $7(this), data = $this.data(), opt = data.contextMenu, root = data.contextMenuRoot;
          root.hovering = true;
          if (e && root.$layer && root.$layer.is(e.relatedTarget)) {
            e.preventDefault();
            e.stopImmediatePropagation();
          }
          (opt.$menu ? opt : root).$menu.children("." + root.classNames.hover).trigger("contextmenu:blur").children(".hover").trigger("contextmenu:blur");
          if ($this.hasClass(root.classNames.disabled) || $this.hasClass(root.classNames.notSelectable)) {
            opt.$selected = null;
            return;
          }
          $this.trigger("contextmenu:focus");
        },
        // :hover done manually so key handling is possible
        itemMouseleave: function(e) {
          var $this = $7(this), data = $this.data(), opt = data.contextMenu, root = data.contextMenuRoot;
          if (root !== opt && root.$layer && root.$layer.is(e.relatedTarget)) {
            if (typeof root.$selected !== "undefined" && root.$selected !== null) {
              root.$selected.trigger("contextmenu:blur");
            }
            e.preventDefault();
            e.stopImmediatePropagation();
            root.$selected = opt.$selected = opt.$node;
            return;
          }
          if (opt && opt.$menu && opt.$menu.hasClass("context-menu-visible")) {
            return;
          }
          $this.trigger("contextmenu:blur");
        },
        // contextMenu item click
        itemClick: function(e) {
          var $this = $7(this), data = $this.data(), opt = data.contextMenu, root = data.contextMenuRoot, key = data.contextMenuKey, callback;
          if (!opt.items[key] || $this.is("." + root.classNames.disabled + ", .context-menu-separator, ." + root.classNames.notSelectable) || $this.is(".context-menu-submenu") && root.selectableSubMenu === false) {
            return;
          }
          e.preventDefault();
          e.stopImmediatePropagation();
          if ($7.isFunction(opt.callbacks[key]) && Object.prototype.hasOwnProperty.call(opt.callbacks, key)) {
            callback = opt.callbacks[key];
          } else if ($7.isFunction(root.callback)) {
            callback = root.callback;
          } else {
            return;
          }
          if (callback.call(root.$trigger, key, root, e) !== false) {
            root.$menu.trigger("contextmenu:hide");
          } else if (root.$menu.parent().length) {
            op.update.call(root.$trigger, root);
          }
        },
        // ignore click events on input elements
        inputClick: function(e) {
          e.stopImmediatePropagation();
        },
        // hide <menu>
        hideMenu: function(e, data) {
          var root = $7(this).data("contextMenuRoot");
          op.hide.call(root.$trigger, root, data && data.force);
        },
        // focus <command>
        focusItem: function(e) {
          e.stopPropagation();
          var $this = $7(this), data = $this.data(), opt = data.contextMenu, root = data.contextMenuRoot;
          if ($this.hasClass(root.classNames.disabled) || $this.hasClass(root.classNames.notSelectable)) {
            return;
          }
          $this.addClass([root.classNames.hover, root.classNames.visible].join(" ")).parent().find(".context-menu-item").not($this).removeClass(root.classNames.visible).filter("." + root.classNames.hover).trigger("contextmenu:blur");
          opt.$selected = root.$selected = $this;
          if (opt && opt.$node && opt.$node.hasClass("context-menu-submenu")) {
            opt.$node.addClass(root.classNames.hover);
          }
          if (opt.$node) {
            root.positionSubmenu.call(opt.$node, opt.$menu);
          }
        },
        // blur <command>
        blurItem: function(e) {
          e.stopPropagation();
          var $this = $7(this), data = $this.data(), opt = data.contextMenu, root = data.contextMenuRoot;
          if (opt.autoHide) {
            $this.removeClass(root.classNames.visible);
          }
          $this.removeClass(root.classNames.hover);
          opt.$selected = null;
        }
      }, op = {
        show: function(opt, x, y) {
          var $trigger = $7(this), css = {};
          $7("#context-menu-layer").trigger("mousedown");
          opt.$trigger = $trigger;
          if (opt.events.show.call($trigger, opt) === false) {
            $currentTrigger = null;
            return;
          }
          var hasVisibleItems = op.update.call($trigger, opt);
          if (hasVisibleItems === false) {
            $currentTrigger = null;
            return;
          }
          opt.position.call($trigger, opt, x, y);
          if (opt.zIndex) {
            var additionalZValue = opt.zIndex;
            if (typeof opt.zIndex === "function") {
              additionalZValue = opt.zIndex.call($trigger, opt);
            }
            css.zIndex = zindex($trigger) + additionalZValue;
          }
          op.layer.call(opt.$menu, opt, css.zIndex);
          opt.$menu.find("ul").css("zIndex", css.zIndex + 1);
          opt.$menu.css(css)[opt.animation.show](opt.animation.duration, function() {
            $trigger.trigger("contextmenu:visible");
            op.activated(opt);
            opt.events.activated(opt);
          });
          $trigger.data("contextMenu", opt).addClass("context-menu-active");
          $7(document).off("keydown.contextMenu").on("keydown.contextMenu", handle.key);
          if (opt.autoHide) {
            $7(document).on("mousemove.contextMenuAutoHide", function(e) {
              var pos = $trigger.offset();
              pos.right = pos.left + $trigger.outerWidth();
              pos.bottom = pos.top + $trigger.outerHeight();
              if (opt.$layer && !opt.hovering && (!(e.pageX >= pos.left && e.pageX <= pos.right) || !(e.pageY >= pos.top && e.pageY <= pos.bottom))) {
                setTimeout(function() {
                  if (!opt.hovering && opt.$menu !== null && typeof opt.$menu !== "undefined") {
                    opt.$menu.trigger("contextmenu:hide");
                  }
                }, 50);
              }
            });
          }
        },
        hide: function(opt, force) {
          var $trigger = $7(this);
          if (!opt) {
            opt = $trigger.data("contextMenu") || {};
          }
          if (!force && opt.events && opt.events.hide.call($trigger, opt) === false) {
            return;
          }
          $trigger.removeData("contextMenu").removeClass("context-menu-active");
          if (opt.$layer) {
            setTimeout(/* @__PURE__ */ function($layer) {
              return function() {
                $layer.remove();
              };
            }(opt.$layer), 10);
            try {
              delete opt.$layer;
            } catch (e) {
              opt.$layer = null;
            }
          }
          $currentTrigger = null;
          opt.$menu.find("." + opt.classNames.hover).trigger("contextmenu:blur");
          opt.$selected = null;
          opt.$menu.find("." + opt.classNames.visible).removeClass(opt.classNames.visible);
          $7(document).off(".contextMenuAutoHide").off("keydown.contextMenu");
          if (opt.$menu) {
            opt.$menu[opt.animation.hide](opt.animation.duration, function() {
              if (opt.build) {
                opt.$menu.remove();
                $7.each(opt, function(key) {
                  switch (key) {
                    case "ns":
                    case "selector":
                    case "build":
                    case "trigger":
                      return true;
                    default:
                      opt[key] = void 0;
                      try {
                        delete opt[key];
                      } catch (e) {
                      }
                      return true;
                  }
                });
              }
              setTimeout(function() {
                $trigger.trigger("contextmenu:hidden");
              }, 10);
            });
          }
        },
        create: function(opt, root) {
          if (typeof root === "undefined") {
            root = opt;
          }
          opt.$menu = $7('<ul class="context-menu-list"></ul>').addClass(opt.className || "").data({
            "contextMenu": opt,
            "contextMenuRoot": root
          });
          if (opt.dataAttr) {
            $7.each(opt.dataAttr, function(key, item) {
              opt.$menu.attr("data-" + opt.key, item);
            });
          }
          $7.each(["callbacks", "commands", "inputs"], function(i, k) {
            opt[k] = {};
            if (!root[k]) {
              root[k] = {};
            }
          });
          if (!root.accesskeys) {
            root.accesskeys = {};
          }
          function createNameNode(item) {
            var $name = $7("<span></span>");
            if (item._accesskey) {
              if (item._beforeAccesskey) {
                $name.append(document.createTextNode(item._beforeAccesskey));
              }
              $7("<span></span>").addClass("context-menu-accesskey").text(item._accesskey).appendTo($name);
              if (item._afterAccesskey) {
                $name.append(document.createTextNode(item._afterAccesskey));
              }
            } else {
              if (item.isHtmlName) {
                if (typeof item.accesskey !== "undefined") {
                  throw new Error("accesskeys are not compatible with HTML names and cannot be used together in the same item");
                }
                $name.html(item.name);
              } else {
                $name.text(item.name);
              }
            }
            return $name;
          }
          $7.each(opt.items, function(key, item) {
            var $t = $7('<li class="context-menu-item"></li>').addClass(item.className || ""), $label = null, $input = null;
            $t.on("click", $7.noop);
            if (typeof item === "string" || item.type === "cm_separator") {
              item = { type: "cm_seperator" };
            }
            item.$node = $t.data({
              "contextMenu": opt,
              "contextMenuRoot": root,
              "contextMenuKey": key
            });
            if (typeof item.accesskey !== "undefined") {
              var aks = splitAccesskey(item.accesskey);
              for (var i = 0, ak; ak = aks[i]; i++) {
                if (!root.accesskeys[ak]) {
                  root.accesskeys[ak] = item;
                  var matched = item.name.match(new RegExp("^(.*?)(" + ak + ")(.*)$", "i"));
                  if (matched) {
                    item._beforeAccesskey = matched[1];
                    item._accesskey = matched[2];
                    item._afterAccesskey = matched[3];
                  }
                  break;
                }
              }
            }
            if (item.type && types[item.type]) {
              types[item.type].call($t, item, opt, root);
              $7.each([opt, root], function(i2, k) {
                k.commands[key] = item;
                if ($7.isFunction(item.callback) && (typeof k.callbacks[key] === "undefined" || typeof opt.type === "undefined")) {
                  k.callbacks[key] = item.callback;
                }
              });
            } else {
              if (item.type === "cm_seperator") {
                $t.addClass("context-menu-separator " + root.classNames.notSelectable);
              } else if (item.type === "html") {
                $t.addClass("context-menu-html " + root.classNames.notSelectable);
              } else if (item.type !== "sub" && item.type) {
                $label = $7("<label></label>").appendTo($t);
                createNameNode(item).appendTo($label);
                $t.addClass("context-menu-input");
                opt.hasTypes = true;
                $7.each([opt, root], function(i2, k) {
                  k.commands[key] = item;
                  k.inputs[key] = item;
                });
              } else if (item.items) {
                item.type = "sub";
              }
              switch (item.type) {
                case "cm_seperator":
                  break;
                case "text":
                  $input = $7('<input type="text" value="1" name="" />').attr("name", "context-menu-input-" + key).val(item.value || "").appendTo($label);
                  break;
                case "textarea":
                  $input = $7('<textarea name=""></textarea>').attr("name", "context-menu-input-" + key).val(item.value || "").appendTo($label);
                  if (item.height) {
                    $input.height(item.height);
                  }
                  break;
                case "checkbox":
                  $input = $7('<input type="checkbox" value="1" name="" />').attr("name", "context-menu-input-" + key).val(item.value || "").prop("checked", !!item.selected).prependTo($label);
                  break;
                case "radio":
                  $input = $7('<input type="radio" value="1" name="" />').attr("name", "context-menu-input-" + item.radio).val(item.value || "").prop("checked", !!item.selected).prependTo($label);
                  break;
                case "select":
                  $input = $7('<select name=""></select>').attr("name", "context-menu-input-" + key).appendTo($label);
                  if (item.options) {
                    $7.each(item.options, function(value, text) {
                      $7("<option></option>").val(value).text(text).appendTo($input);
                    });
                    $input.val(item.selected);
                  }
                  break;
                case "sub":
                  createNameNode(item).appendTo($t);
                  item.appendTo = item.$node;
                  $t.data("contextMenu", item).addClass("context-menu-submenu");
                  item.callback = null;
                  if ("function" === typeof item.items.then) {
                    op.processPromises(item, root, item.items);
                  } else {
                    op.create(item, root);
                  }
                  break;
                case "html":
                  $7(item.html).appendTo($t);
                  break;
                default:
                  $7.each([opt, root], function(i2, k) {
                    k.commands[key] = item;
                    if ($7.isFunction(item.callback) && (typeof k.callbacks[key] === "undefined" || typeof opt.type === "undefined")) {
                      k.callbacks[key] = item.callback;
                    }
                  });
                  createNameNode(item).appendTo($t);
                  break;
              }
              if (item.type && item.type !== "sub" && item.type !== "html" && item.type !== "cm_seperator") {
                $input.on("focus", handle.focusInput).on("blur", handle.blurInput);
                if (item.events) {
                  $input.on(item.events, opt);
                }
              }
              if (item.icon) {
                if ($7.isFunction(item.icon)) {
                  item._icon = item.icon.call(this, this, $t, key, item);
                } else {
                  if (typeof item.icon === "string" && (item.icon.substring(0, 4) === "fab " || item.icon.substring(0, 4) === "fas " || item.icon.substring(0, 4) === "fad " || item.icon.substring(0, 4) === "far " || item.icon.substring(0, 4) === "fal ")) {
                    $t.addClass(root.classNames.icon + " " + root.classNames.icon + "--fa5");
                    item._icon = $7('<i class="' + item.icon + '"></i>');
                  } else if (typeof item.icon === "string" && item.icon.substring(0, 3) === "fa-") {
                    item._icon = root.classNames.icon + " " + root.classNames.icon + "--fa fa " + item.icon;
                  } else {
                    item._icon = root.classNames.icon + " " + root.classNames.icon + "-" + item.icon;
                  }
                }
                if (typeof item._icon === "string") {
                  $t.addClass(item._icon);
                } else {
                  $t.prepend(item._icon);
                }
              }
            }
            item.$input = $input;
            item.$label = $label;
            $t.appendTo(opt.$menu);
            if (!opt.hasTypes && $7.support.eventSelectstart) {
              $t.on("selectstart.disableTextSelect", handle.abortevent);
            }
          });
          if (!opt.$node) {
            opt.$menu.css("display", "none").addClass("context-menu-root");
          }
          opt.$menu.appendTo(opt.appendTo || document.body);
        },
        resize: function($menu, nested) {
          var domMenu;
          $menu.css({ position: "absolute", display: "block" });
          $menu.data(
            "width",
            (domMenu = $menu.get(0)).getBoundingClientRect ? Math.ceil(domMenu.getBoundingClientRect().width) : $menu.outerWidth() + 1
          );
          $menu.css({
            position: "static",
            minWidth: "0px",
            maxWidth: "100000px"
          });
          $menu.find("> li > ul").each(function() {
            op.resize($7(this), true);
          });
          if (!nested) {
            $menu.find("ul").addBack().css({
              position: "",
              display: "",
              minWidth: "",
              maxWidth: ""
            }).outerWidth(function() {
              return $7(this).data("width");
            });
          }
        },
        update: function(opt, root) {
          var $trigger = this;
          if (typeof root === "undefined") {
            root = opt;
            op.resize(opt.$menu);
          }
          var hasVisibleItems = false;
          opt.$menu.children().each(function() {
            var $item = $7(this), key = $item.data("contextMenuKey"), item = opt.items[key], disabled = $7.isFunction(item.disabled) && item.disabled.call($trigger, key, root) || item.disabled === true, visible;
            if ($7.isFunction(item.visible)) {
              visible = item.visible.call($trigger, key, root);
            } else if (typeof item.visible !== "undefined") {
              visible = item.visible === true;
            } else {
              visible = true;
            }
            if (visible) {
              hasVisibleItems = true;
            }
            $item[visible ? "show" : "hide"]();
            $item[disabled ? "addClass" : "removeClass"](root.classNames.disabled);
            if ($7.isFunction(item.icon)) {
              $item.removeClass(item._icon);
              var iconResult = item.icon.call(this, $trigger, $item, key, item);
              if (typeof iconResult === "string") {
                $item.addClass(iconResult);
              } else {
                $item.prepend(iconResult);
              }
            }
            if (item.type) {
              $item.find("input, select, textarea").prop("disabled", disabled);
              switch (item.type) {
                case "text":
                case "textarea":
                  item.$input.val(item.value || "");
                  break;
                case "checkbox":
                case "radio":
                  item.$input.val(item.value || "").prop("checked", !!item.selected);
                  break;
                case "select":
                  item.$input.val((item.selected === 0 ? "0" : item.selected) || "");
                  break;
              }
            }
            if (item.$menu) {
              var subMenuHasVisibleItems = op.update.call($trigger, item, root);
              if (subMenuHasVisibleItems) {
                hasVisibleItems = true;
              }
            }
          });
          return hasVisibleItems;
        },
        layer: function(opt, zIndex) {
          var $layer = opt.$layer = $7('<div id="context-menu-layer"></div>').css({
            height: $win.height(),
            width: $win.width(),
            display: "block",
            position: "fixed",
            "z-index": zIndex - 1,
            top: 0,
            left: 0,
            opacity: 0,
            filter: "alpha(opacity=0)",
            "background-color": "#000"
          }).data("contextMenuRoot", opt).appendTo(document.body).on("contextmenu", handle.abortevent).on("mousedown", handle.layerClick);
          if (typeof document.body.style.maxWidth === "undefined") {
            $layer.css({
              "position": "absolute",
              "height": $7(document).height()
            });
          }
          return $layer;
        },
        processPromises: function(opt, root, promise) {
          opt.$node.addClass(root.classNames.iconLoadingClass);
          function completedPromise(opt2, root2, items) {
            if (typeof items === "undefined") {
              errorPromise(void 0);
            }
            finishPromiseProcess(opt2, root2, items);
          }
          function errorPromise(opt2, root2, errorItem) {
            if (typeof errorItem === "undefined") {
              errorItem = {
                "error": {
                  name: "No items and no error item",
                  icon: "context-menu-icon context-menu-icon-quit"
                }
              };
              if (window.console) {
                (console.error || console.log).call(console, 'When you reject a promise, provide an "items" object, equal to normal sub-menu items');
              }
            } else if (typeof errorItem === "string") {
              errorItem = { "error": { name: errorItem } };
            }
            finishPromiseProcess(opt2, root2, errorItem);
          }
          function finishPromiseProcess(opt2, root2, items) {
            if (typeof root2.$menu === "undefined" || !root2.$menu.is(":visible")) {
              return;
            }
            opt2.$node.removeClass(root2.classNames.iconLoadingClass);
            opt2.items = items;
            op.create(opt2, root2, true);
            op.update(opt2, root2);
            root2.positionSubmenu.call(opt2.$node, opt2.$menu);
          }
          promise.then(completedPromise.bind(this, opt, root), errorPromise.bind(this, opt, root));
        },
        // operation that will run after contextMenu showed on screen
        activated: function(opt) {
          var $menu = opt.$menu;
          var $menuOffset = $menu.offset();
          var winHeight = $7(window).height();
          var winScrollTop = $7(window).scrollTop();
          var menuHeight = $menu.height();
          if (menuHeight > winHeight) {
            $menu.css({
              "height": winHeight + "px",
              "overflow-x": "hidden",
              "overflow-y": "auto",
              "top": winScrollTop + "px"
            });
          } else if ($menuOffset.top < winScrollTop || $menuOffset.top + menuHeight > winScrollTop + winHeight) {
            $menu.css({
              "top": winScrollTop + "px"
            });
          }
        }
      };
      function splitAccesskey(val) {
        var t = val.split(/\s+/);
        var keys = [];
        for (var i = 0, k; k = t[i]; i++) {
          k = k.charAt(0).toUpperCase();
          keys.push(k);
        }
        return keys;
      }
      $7.fn.contextMenu = function(operation) {
        var $t = this, $o = operation;
        if (this.length > 0) {
          if (typeof operation === "undefined") {
            this.first().trigger("contextmenu");
          } else if (typeof operation.x !== "undefined" && typeof operation.y !== "undefined") {
            this.first().trigger($7.Event("contextmenu", {
              pageX: operation.x,
              pageY: operation.y,
              mouseButton: operation.button
            }));
          } else if (operation === "hide") {
            var $menu = this.first().data("contextMenu") ? this.first().data("contextMenu").$menu : null;
            if ($menu) {
              $menu.trigger("contextmenu:hide");
            }
          } else if (operation === "destroy") {
            $7.contextMenu("destroy", { context: this });
          } else if ($7.isPlainObject(operation)) {
            operation.context = this;
            $7.contextMenu("create", operation);
          } else if (operation) {
            this.removeClass("context-menu-disabled");
          } else if (!operation) {
            this.addClass("context-menu-disabled");
          }
        } else {
          $7.each(menus, function() {
            if (this.selector === $t.selector) {
              $o.data = this;
              $7.extend($o.data, { trigger: "demand" });
            }
          });
          handle.contextmenu.call($o.target, $o);
        }
        return this;
      };
      $7.contextMenu = function(operation, options) {
        if (typeof operation !== "string") {
          options = operation;
          operation = "create";
        }
        if (typeof options === "string") {
          options = { selector: options };
        } else if (typeof options === "undefined") {
          options = {};
        }
        var o = $7.extend(true, {}, defaults, options || {});
        var $document = $7(document);
        var $context = $document;
        var _hasContext = false;
        if (!o.context || !o.context.length) {
          o.context = document;
        } else {
          $context = $7(o.context).first();
          o.context = $context.get(0);
          _hasContext = !$7(o.context).is(document);
        }
        switch (operation) {
          case "update":
            if (_hasContext) {
              op.update($context);
            } else {
              for (var menu in menus) {
                if (menus.hasOwnProperty(menu)) {
                  op.update(menus[menu]);
                }
              }
            }
            break;
          case "create":
            if (!o.selector) {
              throw new Error("No selector specified");
            }
            if (o.selector.match(/.context-menu-(list|item|input)($|\s)/)) {
              throw new Error('Cannot bind to selector "' + o.selector + '" as it contains a reserved className');
            }
            if (!o.build && (!o.items || $7.isEmptyObject(o.items))) {
              throw new Error("No Items specified");
            }
            counter++;
            o.ns = ".contextMenu" + counter;
            if (!_hasContext) {
              namespaces[o.selector] = o.ns;
            }
            menus[o.ns] = o;
            if (!o.trigger) {
              o.trigger = "right";
            }
            if (!initialized) {
              var itemClick = o.itemClickEvent === "click" ? "click.contextMenu" : "mouseup.contextMenu";
              var contextMenuItemObj = {
                // 'mouseup.contextMenu': handle.itemClick,
                // 'click.contextMenu': handle.itemClick,
                "contextmenu:focus.contextMenu": handle.focusItem,
                "contextmenu:blur.contextMenu": handle.blurItem,
                "contextmenu.contextMenu": handle.abortevent,
                "mouseenter.contextMenu": handle.itemMouseenter,
                "mouseleave.contextMenu": handle.itemMouseleave
              };
              contextMenuItemObj[itemClick] = handle.itemClick;
              $document.on({
                "contextmenu:hide.contextMenu": handle.hideMenu,
                "prevcommand.contextMenu": handle.prevItem,
                "nextcommand.contextMenu": handle.nextItem,
                "contextmenu.contextMenu": handle.abortevent,
                "mouseenter.contextMenu": handle.menuMouseenter,
                "mouseleave.contextMenu": handle.menuMouseleave
              }, ".context-menu-list").on("mouseup.contextMenu", ".context-menu-input", handle.inputClick).on(contextMenuItemObj, ".context-menu-item");
              initialized = true;
            }
            $context.on("contextmenu" + o.ns, o.selector, o, handle.contextmenu);
            if (_hasContext) {
              $context.on("remove" + o.ns, function() {
                $7(this).contextMenu("destroy");
              });
            }
            switch (o.trigger) {
              case "hover":
                $context.on("mouseenter" + o.ns, o.selector, o, handle.mouseenter).on("mouseleave" + o.ns, o.selector, o, handle.mouseleave);
                break;
              case "left":
                $context.on("click" + o.ns, o.selector, o, handle.click);
                break;
              case "touchstart":
                $context.on("touchstart" + o.ns, o.selector, o, handle.click);
                break;
            }
            if (!o.build) {
              op.create(o);
            }
            break;
          case "destroy":
            var $visibleMenu;
            if (_hasContext) {
              var context = o.context;
              $7.each(menus, function(ns, o2) {
                if (!o2) {
                  return true;
                }
                if (!$7(context).is(o2.selector)) {
                  return true;
                }
                $visibleMenu = $7(".context-menu-list").filter(":visible");
                if ($visibleMenu.length && $visibleMenu.data().contextMenuRoot.$trigger.is($7(o2.context).find(o2.selector))) {
                  $visibleMenu.trigger("contextmenu:hide", { force: true });
                }
                try {
                  if (menus[o2.ns].$menu) {
                    menus[o2.ns].$menu.remove();
                  }
                  delete menus[o2.ns];
                } catch (e) {
                  menus[o2.ns] = null;
                }
                $7(o2.context).off(o2.ns);
                return true;
              });
            } else if (!o.selector) {
              $document.off(".contextMenu .contextMenuAutoHide");
              $7.each(menus, function(ns, o2) {
                $7(o2.context).off(o2.ns);
              });
              namespaces = {};
              menus = {};
              counter = 0;
              initialized = false;
              $7("#context-menu-layer, .context-menu-list").remove();
            } else if (namespaces[o.selector]) {
              $visibleMenu = $7(".context-menu-list").filter(":visible");
              if ($visibleMenu.length && $visibleMenu.data().contextMenuRoot.$trigger.is(o.selector)) {
                $visibleMenu.trigger("contextmenu:hide", { force: true });
              }
              try {
                if (menus[namespaces[o.selector]].$menu) {
                  menus[namespaces[o.selector]].$menu.remove();
                }
                delete menus[namespaces[o.selector]];
              } catch (e) {
                menus[namespaces[o.selector]] = null;
              }
              $document.off(namespaces[o.selector]);
            }
            break;
          case "html5":
            if (!$7.support.htmlCommand && !$7.support.htmlMenuitem || typeof options === "boolean" && options) {
              $7('menu[type="context"]').each(function() {
                if (this.id) {
                  $7.contextMenu({
                    selector: "[contextmenu=" + this.id + "]",
                    items: $7.contextMenu.fromMenu(this)
                  });
                }
              }).css("display", "none");
            }
            break;
          default:
            throw new Error('Unknown operation "' + operation + '"');
        }
        return this;
      };
      $7.contextMenu.setInputValues = function(opt, data) {
        if (typeof data === "undefined") {
          data = {};
        }
        $7.each(opt.inputs, function(key, item) {
          switch (item.type) {
            case "text":
            case "textarea":
              item.value = data[key] || "";
              break;
            case "checkbox":
              item.selected = data[key] ? true : false;
              break;
            case "radio":
              item.selected = (data[item.radio] || "") === item.value;
              break;
            case "select":
              item.selected = data[key] || "";
              break;
          }
        });
      };
      $7.contextMenu.getInputValues = function(opt, data) {
        if (typeof data === "undefined") {
          data = {};
        }
        $7.each(opt.inputs, function(key, item) {
          switch (item.type) {
            case "text":
            case "textarea":
            case "select":
              data[key] = item.$input.val();
              break;
            case "checkbox":
              data[key] = item.$input.prop("checked");
              break;
            case "radio":
              if (item.$input.prop("checked")) {
                data[item.radio] = item.value;
              }
              break;
          }
        });
        return data;
      };
      function inputLabel(node) {
        return node.id && $7('label[for="' + node.id + '"]').val() || node.name;
      }
      function menuChildren(items, $children, counter2) {
        if (!counter2) {
          counter2 = 0;
        }
        $children.each(function() {
          var $node = $7(this), node = this, nodeName = this.nodeName.toLowerCase(), label, item;
          if (nodeName === "label" && $node.find("input, textarea, select").length) {
            label = $node.text();
            $node = $node.children().first();
            node = $node.get(0);
            nodeName = node.nodeName.toLowerCase();
          }
          switch (nodeName) {
            // http://www.whatwg.org/specs/web-apps/current-work/multipage/interactive-elements.html#the-menu-element
            case "menu":
              item = { name: $node.attr("label"), items: {} };
              counter2 = menuChildren(item.items, $node.children(), counter2);
              break;
            // http://www.whatwg.org/specs/web-apps/current-work/multipage/commands.html#using-the-a-element-to-define-a-command
            case "a":
            // http://www.whatwg.org/specs/web-apps/current-work/multipage/commands.html#using-the-button-element-to-define-a-command
            case "button":
              item = {
                name: $node.text(),
                disabled: !!$node.attr("disabled"),
                callback: /* @__PURE__ */ function() {
                  return function() {
                    $node.get(0).click();
                  };
                }()
              };
              break;
            // http://www.whatwg.org/specs/web-apps/current-work/multipage/commands.html#using-the-command-element-to-define-a-command
            case "menuitem":
            case "command":
              switch ($node.attr("type")) {
                case void 0:
                case "command":
                case "menuitem":
                  item = {
                    name: $node.attr("label"),
                    disabled: !!$node.attr("disabled"),
                    icon: $node.attr("icon"),
                    callback: /* @__PURE__ */ function() {
                      return function() {
                        $node.get(0).click();
                      };
                    }()
                  };
                  break;
                case "checkbox":
                  item = {
                    type: "checkbox",
                    disabled: !!$node.attr("disabled"),
                    name: $node.attr("label"),
                    selected: !!$node.attr("checked")
                  };
                  break;
                case "radio":
                  item = {
                    type: "radio",
                    disabled: !!$node.attr("disabled"),
                    name: $node.attr("label"),
                    radio: $node.attr("radiogroup"),
                    value: $node.attr("id"),
                    selected: !!$node.attr("checked")
                  };
                  break;
                default:
                  item = void 0;
              }
              break;
            case "hr":
              item = "-------";
              break;
            case "input":
              switch ($node.attr("type")) {
                case "text":
                  item = {
                    type: "text",
                    name: label || inputLabel(node),
                    disabled: !!$node.attr("disabled"),
                    value: $node.val()
                  };
                  break;
                case "checkbox":
                  item = {
                    type: "checkbox",
                    name: label || inputLabel(node),
                    disabled: !!$node.attr("disabled"),
                    selected: !!$node.attr("checked")
                  };
                  break;
                case "radio":
                  item = {
                    type: "radio",
                    name: label || inputLabel(node),
                    disabled: !!$node.attr("disabled"),
                    radio: !!$node.attr("name"),
                    value: $node.val(),
                    selected: !!$node.attr("checked")
                  };
                  break;
                default:
                  item = void 0;
                  break;
              }
              break;
            case "select":
              item = {
                type: "select",
                name: label || inputLabel(node),
                disabled: !!$node.attr("disabled"),
                selected: $node.val(),
                options: {}
              };
              $node.children().each(function() {
                item.options[this.value] = $7(this).text();
              });
              break;
            case "textarea":
              item = {
                type: "textarea",
                name: label || inputLabel(node),
                disabled: !!$node.attr("disabled"),
                value: $node.val()
              };
              break;
            case "label":
              break;
            default:
              item = { type: "html", html: $node.clone(true) };
              break;
          }
          if (item) {
            counter2++;
            items["key" + counter2] = item;
          }
        });
        return counter2;
      }
      $7.contextMenu.fromMenu = function(element) {
        var $this = $7(element), items = {};
        menuChildren(items, $this.children());
        return items;
      };
      $7.contextMenu.defaults = defaults;
      $7.contextMenu.types = types;
      $7.contextMenu.handle = handle;
      $7.contextMenu.op = op;
      $7.contextMenu.menus = menus;
    });
  }
});

// node_modules/.pnpm/select2@4.1.0-rc.0/node_modules/select2/dist/js/select2.js
var require_select2 = __commonJS({
  "node_modules/.pnpm/select2@4.1.0-rc.0/node_modules/select2/dist/js/select2.js"(exports, module) {
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
      var S2 = function() {
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
              var main2, req, makeMap, handlers, defined = {}, waiting = {}, config = {}, defining = {}, hasOwn = Object.prototype.hasOwnProperty, aps = [].slice, jsSuffixRegExp = /\.js$/;
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
                  main2.apply(undef, args);
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
              main2 = function(name, deps, callback, relName) {
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
                  main2(undef, deps, callback, relName);
                } else {
                  setTimeout(function() {
                    main2(undef, deps, callback, relName);
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
        ], function($7) {
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
            var $el = $7(el);
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
                return $7(element).data(name);
              }
              return $7(element).data(name);
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
        ], function($7, Utils) {
          function Results($element, options, dataAdapter) {
            this.$element = $element;
            this.data = dataAdapter;
            this.options = options;
            Results.__super__.constructor.call(this);
          }
          Utils.Extend(Results, Utils.Observable);
          Results.prototype.render = function() {
            var $results = $7(
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
            var $message = $7(
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
                var $option = $7(this);
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
              var $option = $7(option);
              var label = document.createElement("strong");
              label.className = "select2-results__group";
              this.template(data, label);
              var $children = [];
              for (var c = 0; c < data.children.length; c++) {
                var child = data.children[c];
                var $child = this.option(child);
                $children.push($child);
              }
              var $childrenContainer = $7("<ul></ul>", {
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
            if ($7.fn.mousewheel) {
              this.$results.on("mousewheel", function(e) {
                var top2 = self.$results.scrollTop();
                var bottom2 = self.$results.get(0).scrollHeight - top2 + e.deltaY;
                var isAtTop = e.deltaY > 0 && top2 - e.deltaY <= 0;
                var isAtBottom = e.deltaY < 0 && bottom2 <= self.$results.height();
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
                var $this = $7(this);
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
                  element: $7(this)
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
              $7(container).append(content);
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
        ], function($7, Utils, KEYS) {
          function BaseSelection($element, options) {
            this.$element = $element;
            this.options = options;
            BaseSelection.__super__.constructor.call(this);
          }
          Utils.Extend(BaseSelection, Utils.Observable);
          BaseSelection.prototype.render = function() {
            var $selection = $7(
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
              if (document.activeElement == self.$selection[0] || $7.contains(self.$selection[0], document.activeElement)) {
                return;
              }
              self.trigger("blur", evt);
            }, 1);
          };
          BaseSelection.prototype._attachCloseHandler = function(container) {
            $7(document.body).on("mousedown.select2." + container.id, function(e) {
              var $target = $7(e.target);
              var $select = $target.closest(".select2");
              var $all = $7(".select2.select2-container--open");
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
            $7(document.body).off("mousedown.select2." + container.id);
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
        ], function($7, BaseSelection, Utils, KEYS) {
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
            return $7("<span></span>");
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
        ], function($7, BaseSelection, Utils) {
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
                var $remove = $7(this);
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
            var $container = $7(
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
        ], function($7, KEYS, Utils) {
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
            var $remove = $7(
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
        ], function($7, Utils, KEYS) {
          function Search(decorated, $element, options) {
            decorated.call(this, $element, options);
          }
          Search.prototype.render = function(decorated) {
            var searchLabel = this.options.get("translations").get("search");
            var $search = $7(
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
        ], function($7) {
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
              var evt = $7.Event("select2:" + name, {
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
        ], function($7, require2) {
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
            this.dict = $7.extend({}, translation.all(), this.dict);
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
        ], function(BaseAdapter, Utils, $7) {
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
                return self.item($7(selectedElement));
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
              var $option = $7(this);
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
            return $7(option);
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
                var $child = $7($children[c]);
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
            item = $7.extend({}, {
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
            return $7.extend({}, defaults, item);
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
        ], function(SelectAdapter, Utils, $7) {
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
              return self.item($7(this)).id;
            }).get();
            var $options = [];
            function onlyItem(item2) {
              return function() {
                return $7(this).val() == item2.id;
              };
            }
            for (var d = 0; d < data.length; d++) {
              var item = this._normalizeItem(data[d]);
              if (existingIds.indexOf(item.id) >= 0) {
                var $existingOption = $existing.filter(onlyItem(item));
                var existingData = this.item($existingOption);
                var newData = $7.extend(true, {}, item, existingData);
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
        ], function(ArrayAdapter, Utils, $7) {
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
                return $7.extend({}, params, {
                  q: params.term
                });
              },
              transport: function(params, success, failure) {
                var $request = $7.ajax(params);
                $request.then(success);
                $request.fail(failure);
                return $request;
              }
            };
            return $7.extend({}, defaults, options, true);
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
            var options = $7.extend({
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
        ], function($7) {
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
              $7(this).remove();
            });
          };
          return Tags;
        });
        S22.define("select2/data/tokenizer", [
          "jquery"
        ], function($7) {
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
                return $7(this).val() === item.id;
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
              var partParams = $7.extend({}, params, {
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
        ], function($7, Utils) {
          function Dropdown2($element, options) {
            this.$element = $element;
            this.options = options;
            Dropdown2.__super__.constructor.call(this);
          }
          Utils.Extend(Dropdown2, Utils.Observable);
          Dropdown2.prototype.render = function() {
            var $dropdown = $7(
              '<span class="select2-dropdown"><span class="select2-results"></span></span>'
            );
            $dropdown.attr("dir", this.options.get("dir"));
            this.$dropdown = $dropdown;
            return $dropdown;
          };
          Dropdown2.prototype.bind = function() {
          };
          Dropdown2.prototype.position = function($dropdown, $container) {
          };
          Dropdown2.prototype.destroy = function() {
            this.$dropdown.remove();
          };
          return Dropdown2;
        });
        S22.define("select2/dropdown/search", [
          "jquery"
        ], function($7) {
          function Search() {
          }
          Search.prototype.render = function(decorated) {
            var $rendered = decorated.call(this);
            var searchLabel = this.options.get("translations").get("search");
            var $search = $7(
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
              $7(this).off("keyup");
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
        ], function($7) {
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
            var isLoadMoreVisible = $7.contains(
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
            var params = $7.extend({}, { page: 1 }, this.lastParams);
            params.page++;
            this.trigger("query:append", params);
          };
          InfiniteScroll.prototype.showLoadingMore = function(_, data) {
            return data.pagination && data.pagination.more;
          };
          InfiniteScroll.prototype.createLoadingMore = function() {
            var $option = $7(
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
        ], function($7, Utils) {
          function AttachBody(decorated, $element, options) {
            this.$dropdownParent = $7(options.get("dropdownParent") || document.body);
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
            var $container = $7("<span></span>");
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
                x: $7(this).scrollLeft(),
                y: $7(this).scrollTop()
              });
            });
            $watchers.on(scrollEvent, function(ev) {
              var position = Utils.GetData(this, "select2-scroll-position");
              $7(this).scrollTop(position.y);
            });
            $7(window).on(
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
            $7(window).off(scrollEvent + " " + resizeEvent + " " + orientationEvent);
          };
          AttachBody.prototype._positionDropdown = function() {
            var $window = $7(window);
            var isCurrentlyAbove = this.$dropdown[0].classList.contains("select2-dropdown--above");
            var isCurrentlyBelow = this.$dropdown[0].classList.contains("select2-dropdown--below");
            var newDirection = null;
            var offset2 = this.$container.offset();
            offset2.bottom = offset2.top + this.$container.outerHeight(false);
            var container = {
              height: this.$container.outerHeight(false)
            };
            container.top = offset2.top;
            container.bottom = offset2.top + container.height;
            var dropdown = {
              height: this.$dropdown.outerHeight(false)
            };
            var viewport2 = {
              top: $window.scrollTop(),
              bottom: $window.scrollTop() + $window.height()
            };
            var enoughRoomAbove = viewport2.top < offset2.top - dropdown.height;
            var enoughRoomBelow = viewport2.bottom > offset2.bottom + dropdown.height;
            var css = {
              left: offset2.left,
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
            if ($7.contains(document.body, $offsetParent[0]) || $offsetParent[0].isConnected) {
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
        ], function($7, ResultsList, SingleSelection, MultipleSelection, Placeholder, AllowClear, SelectionSearch, SelectionCSS, EventRelay, Utils, Translation, DIACRITICS, SelectData, ArrayData, AjaxData, Tags, Tokenizer, MinimumInputLength, MaximumInputLength, MaximumSelectionLength, Dropdown2, DropdownSearch, HidePlaceholder, InfiniteScroll, AttachBody, MinimumResultsForSearch, SelectOnClose, CloseOnSelect, DropdownCSS, TagsSearchHighlight, EnglishTranslation) {
          function Defaults() {
            this.reset();
          }
          Defaults.prototype.apply = function(options) {
            options = $7.extend(true, {}, this.defaults, options);
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
                options.dropdownAdapter = Dropdown2;
              } else {
                var SearchableDropdown = Utils.Decorate(Dropdown2, DropdownSearch);
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
                var match = $7.extend(true, {}, data);
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
            if ($7.isEmptyObject(language)) {
              return [];
            }
            if ($7.isPlainObject(language)) {
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
              } else if ($7.isPlainObject(language)) {
                languageData = new Translation(language);
              } else {
                languageData = language;
              }
              translations.extend(languageData);
            }
            return translations;
          };
          Defaults.prototype.set = function(key, value) {
            var camelKey = $7.camelCase(key);
            var data = {};
            data[camelKey] = value;
            var convertedData = Utils._convertData(data);
            $7.extend(true, this.defaults, convertedData);
          };
          var defaults = new Defaults();
          return defaults;
        });
        S22.define("select2/options", [
          "jquery",
          "./defaults",
          "./utils"
        ], function($7, Defaults, Utils) {
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
            if ($7.fn.jquery && $7.fn.jquery.substr(0, 2) == "1." && $e[0].dataset) {
              dataset = $7.extend(true, {}, $e[0].dataset, dataset);
            }
            var data = $7.extend(true, {}, Utils.GetData($e[0]), dataset);
            data = Utils._convertData(data);
            for (var key in data) {
              if (excludedData.indexOf(key) > -1) {
                continue;
              }
              if ($7.isPlainObject(this.options[key])) {
                $7.extend(this.options[key], data[key]);
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
        ], function($7, Options, Utils, KEYS) {
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
            var WIDTH2 = /^width:(([-+]?([0-9]*\.)?[0-9]+)(px|em|ex|%|in|cm|mm|pt|pc))/i;
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
                var matches = attr.match(WIDTH2);
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
            var $container = $7(
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
        S22.define("jquery-mousewheel", [
          "jquery"
        ], function($7) {
          return $7;
        });
        S22.define("jquery.select2", [
          "jquery",
          "jquery-mousewheel",
          "./select2/core",
          "./select2/defaults",
          "./select2/utils"
        ], function($7, _, Select2, Defaults, Utils) {
          if ($7.fn.select2 == null) {
            var thisMethods = ["open", "close", "destroy"];
            $7.fn.select2 = function(options) {
              options = options || {};
              if (typeof options === "object") {
                this.each(function() {
                  var instanceOptions = $7.extend(true, {}, options);
                  var instance = new Select2($7(this), instanceOptions);
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
          if ($7.fn.select2.defaults == null) {
            $7.fn.select2.defaults = Defaults;
          }
          return Select2;
        });
        return {
          define: S22.define,
          require: S22.require
        };
      }();
      var select2 = S2.require("jquery.select2");
      jQuery2.fn.select2.amd = S2;
      return select2;
    });
  }
});

// app/javascript/application.js
init_shim_jquery();
var import_jquery5 = __toESM(require_jquery());

// node_modules/.pnpm/bootstrap@5.3.6_@popperjs+core@2.11.8/node_modules/bootstrap/dist/js/bootstrap.esm.js
init_shim_jquery();

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/index.js
var lib_exports = {};
__export(lib_exports, {
  afterMain: () => afterMain,
  afterRead: () => afterRead,
  afterWrite: () => afterWrite,
  applyStyles: () => applyStyles_default,
  arrow: () => arrow_default,
  auto: () => auto,
  basePlacements: () => basePlacements,
  beforeMain: () => beforeMain,
  beforeRead: () => beforeRead,
  beforeWrite: () => beforeWrite,
  bottom: () => bottom,
  clippingParents: () => clippingParents,
  computeStyles: () => computeStyles_default,
  createPopper: () => createPopper3,
  createPopperBase: () => createPopper,
  createPopperLite: () => createPopper2,
  detectOverflow: () => detectOverflow,
  end: () => end,
  eventListeners: () => eventListeners_default,
  flip: () => flip_default,
  hide: () => hide_default,
  left: () => left,
  main: () => main,
  modifierPhases: () => modifierPhases,
  offset: () => offset_default,
  placements: () => placements,
  popper: () => popper,
  popperGenerator: () => popperGenerator,
  popperOffsets: () => popperOffsets_default,
  preventOverflow: () => preventOverflow_default,
  read: () => read,
  reference: () => reference,
  right: () => right,
  start: () => start,
  top: () => top,
  variationPlacements: () => variationPlacements,
  viewport: () => viewport,
  write: () => write
});
init_shim_jquery();

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/enums.js
init_shim_jquery();
var top = "top";
var bottom = "bottom";
var right = "right";
var left = "left";
var auto = "auto";
var basePlacements = [top, bottom, right, left];
var start = "start";
var end = "end";
var clippingParents = "clippingParents";
var viewport = "viewport";
var popper = "popper";
var reference = "reference";
var variationPlacements = /* @__PURE__ */ basePlacements.reduce(function(acc, placement) {
  return acc.concat([placement + "-" + start, placement + "-" + end]);
}, []);
var placements = /* @__PURE__ */ [].concat(basePlacements, [auto]).reduce(function(acc, placement) {
  return acc.concat([placement, placement + "-" + start, placement + "-" + end]);
}, []);
var beforeRead = "beforeRead";
var read = "read";
var afterRead = "afterRead";
var beforeMain = "beforeMain";
var main = "main";
var afterMain = "afterMain";
var beforeWrite = "beforeWrite";
var write = "write";
var afterWrite = "afterWrite";
var modifierPhases = [beforeRead, read, afterRead, beforeMain, main, afterMain, beforeWrite, write, afterWrite];

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/modifiers/index.js
init_shim_jquery();

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/modifiers/applyStyles.js
init_shim_jquery();

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/dom-utils/getNodeName.js
init_shim_jquery();
function getNodeName(element) {
  return element ? (element.nodeName || "").toLowerCase() : null;
}

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/dom-utils/instanceOf.js
init_shim_jquery();

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/dom-utils/getWindow.js
init_shim_jquery();
function getWindow(node) {
  if (node == null) {
    return window;
  }
  if (node.toString() !== "[object Window]") {
    var ownerDocument = node.ownerDocument;
    return ownerDocument ? ownerDocument.defaultView || window : window;
  }
  return node;
}

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/dom-utils/instanceOf.js
function isElement(node) {
  var OwnElement = getWindow(node).Element;
  return node instanceof OwnElement || node instanceof Element;
}
function isHTMLElement(node) {
  var OwnElement = getWindow(node).HTMLElement;
  return node instanceof OwnElement || node instanceof HTMLElement;
}
function isShadowRoot(node) {
  if (typeof ShadowRoot === "undefined") {
    return false;
  }
  var OwnElement = getWindow(node).ShadowRoot;
  return node instanceof OwnElement || node instanceof ShadowRoot;
}

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/modifiers/applyStyles.js
function applyStyles(_ref) {
  var state = _ref.state;
  Object.keys(state.elements).forEach(function(name) {
    var style = state.styles[name] || {};
    var attributes = state.attributes[name] || {};
    var element = state.elements[name];
    if (!isHTMLElement(element) || !getNodeName(element)) {
      return;
    }
    Object.assign(element.style, style);
    Object.keys(attributes).forEach(function(name2) {
      var value = attributes[name2];
      if (value === false) {
        element.removeAttribute(name2);
      } else {
        element.setAttribute(name2, value === true ? "" : value);
      }
    });
  });
}
function effect(_ref2) {
  var state = _ref2.state;
  var initialStyles = {
    popper: {
      position: state.options.strategy,
      left: "0",
      top: "0",
      margin: "0"
    },
    arrow: {
      position: "absolute"
    },
    reference: {}
  };
  Object.assign(state.elements.popper.style, initialStyles.popper);
  state.styles = initialStyles;
  if (state.elements.arrow) {
    Object.assign(state.elements.arrow.style, initialStyles.arrow);
  }
  return function() {
    Object.keys(state.elements).forEach(function(name) {
      var element = state.elements[name];
      var attributes = state.attributes[name] || {};
      var styleProperties = Object.keys(state.styles.hasOwnProperty(name) ? state.styles[name] : initialStyles[name]);
      var style = styleProperties.reduce(function(style2, property) {
        style2[property] = "";
        return style2;
      }, {});
      if (!isHTMLElement(element) || !getNodeName(element)) {
        return;
      }
      Object.assign(element.style, style);
      Object.keys(attributes).forEach(function(attribute) {
        element.removeAttribute(attribute);
      });
    });
  };
}
var applyStyles_default = {
  name: "applyStyles",
  enabled: true,
  phase: "write",
  fn: applyStyles,
  effect,
  requires: ["computeStyles"]
};

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/modifiers/arrow.js
init_shim_jquery();

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/utils/getBasePlacement.js
init_shim_jquery();
function getBasePlacement(placement) {
  return placement.split("-")[0];
}

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/dom-utils/getLayoutRect.js
init_shim_jquery();

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/dom-utils/getBoundingClientRect.js
init_shim_jquery();

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/utils/math.js
init_shim_jquery();
var max = Math.max;
var min = Math.min;
var round = Math.round;

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/dom-utils/isLayoutViewport.js
init_shim_jquery();

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/utils/userAgent.js
init_shim_jquery();
function getUAString() {
  var uaData = navigator.userAgentData;
  if (uaData != null && uaData.brands && Array.isArray(uaData.brands)) {
    return uaData.brands.map(function(item) {
      return item.brand + "/" + item.version;
    }).join(" ");
  }
  return navigator.userAgent;
}

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/dom-utils/isLayoutViewport.js
function isLayoutViewport() {
  return !/^((?!chrome|android).)*safari/i.test(getUAString());
}

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/dom-utils/getBoundingClientRect.js
function getBoundingClientRect(element, includeScale, isFixedStrategy) {
  if (includeScale === void 0) {
    includeScale = false;
  }
  if (isFixedStrategy === void 0) {
    isFixedStrategy = false;
  }
  var clientRect = element.getBoundingClientRect();
  var scaleX = 1;
  var scaleY = 1;
  if (includeScale && isHTMLElement(element)) {
    scaleX = element.offsetWidth > 0 ? round(clientRect.width) / element.offsetWidth || 1 : 1;
    scaleY = element.offsetHeight > 0 ? round(clientRect.height) / element.offsetHeight || 1 : 1;
  }
  var _ref = isElement(element) ? getWindow(element) : window, visualViewport = _ref.visualViewport;
  var addVisualOffsets = !isLayoutViewport() && isFixedStrategy;
  var x = (clientRect.left + (addVisualOffsets && visualViewport ? visualViewport.offsetLeft : 0)) / scaleX;
  var y = (clientRect.top + (addVisualOffsets && visualViewport ? visualViewport.offsetTop : 0)) / scaleY;
  var width = clientRect.width / scaleX;
  var height = clientRect.height / scaleY;
  return {
    width,
    height,
    top: y,
    right: x + width,
    bottom: y + height,
    left: x,
    x,
    y
  };
}

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/dom-utils/getLayoutRect.js
function getLayoutRect(element) {
  var clientRect = getBoundingClientRect(element);
  var width = element.offsetWidth;
  var height = element.offsetHeight;
  if (Math.abs(clientRect.width - width) <= 1) {
    width = clientRect.width;
  }
  if (Math.abs(clientRect.height - height) <= 1) {
    height = clientRect.height;
  }
  return {
    x: element.offsetLeft,
    y: element.offsetTop,
    width,
    height
  };
}

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/dom-utils/contains.js
init_shim_jquery();
function contains(parent, child) {
  var rootNode = child.getRootNode && child.getRootNode();
  if (parent.contains(child)) {
    return true;
  } else if (rootNode && isShadowRoot(rootNode)) {
    var next = child;
    do {
      if (next && parent.isSameNode(next)) {
        return true;
      }
      next = next.parentNode || next.host;
    } while (next);
  }
  return false;
}

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/dom-utils/getOffsetParent.js
init_shim_jquery();

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/dom-utils/getComputedStyle.js
init_shim_jquery();
function getComputedStyle2(element) {
  return getWindow(element).getComputedStyle(element);
}

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/dom-utils/isTableElement.js
init_shim_jquery();
function isTableElement(element) {
  return ["table", "td", "th"].indexOf(getNodeName(element)) >= 0;
}

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/dom-utils/getParentNode.js
init_shim_jquery();

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/dom-utils/getDocumentElement.js
init_shim_jquery();
function getDocumentElement(element) {
  return ((isElement(element) ? element.ownerDocument : (
    // $FlowFixMe[prop-missing]
    element.document
  )) || window.document).documentElement;
}

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/dom-utils/getParentNode.js
function getParentNode(element) {
  if (getNodeName(element) === "html") {
    return element;
  }
  return (
    // this is a quicker (but less type safe) way to save quite some bytes from the bundle
    // $FlowFixMe[incompatible-return]
    // $FlowFixMe[prop-missing]
    element.assignedSlot || // step into the shadow DOM of the parent of a slotted node
    element.parentNode || // DOM Element detected
    (isShadowRoot(element) ? element.host : null) || // ShadowRoot detected
    // $FlowFixMe[incompatible-call]: HTMLElement is a Node
    getDocumentElement(element)
  );
}

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/dom-utils/getOffsetParent.js
function getTrueOffsetParent(element) {
  if (!isHTMLElement(element) || // https://github.com/popperjs/popper-core/issues/837
  getComputedStyle2(element).position === "fixed") {
    return null;
  }
  return element.offsetParent;
}
function getContainingBlock(element) {
  var isFirefox = /firefox/i.test(getUAString());
  var isIE = /Trident/i.test(getUAString());
  if (isIE && isHTMLElement(element)) {
    var elementCss = getComputedStyle2(element);
    if (elementCss.position === "fixed") {
      return null;
    }
  }
  var currentNode = getParentNode(element);
  if (isShadowRoot(currentNode)) {
    currentNode = currentNode.host;
  }
  while (isHTMLElement(currentNode) && ["html", "body"].indexOf(getNodeName(currentNode)) < 0) {
    var css = getComputedStyle2(currentNode);
    if (css.transform !== "none" || css.perspective !== "none" || css.contain === "paint" || ["transform", "perspective"].indexOf(css.willChange) !== -1 || isFirefox && css.willChange === "filter" || isFirefox && css.filter && css.filter !== "none") {
      return currentNode;
    } else {
      currentNode = currentNode.parentNode;
    }
  }
  return null;
}
function getOffsetParent(element) {
  var window2 = getWindow(element);
  var offsetParent = getTrueOffsetParent(element);
  while (offsetParent && isTableElement(offsetParent) && getComputedStyle2(offsetParent).position === "static") {
    offsetParent = getTrueOffsetParent(offsetParent);
  }
  if (offsetParent && (getNodeName(offsetParent) === "html" || getNodeName(offsetParent) === "body" && getComputedStyle2(offsetParent).position === "static")) {
    return window2;
  }
  return offsetParent || getContainingBlock(element) || window2;
}

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/utils/getMainAxisFromPlacement.js
init_shim_jquery();
function getMainAxisFromPlacement(placement) {
  return ["top", "bottom"].indexOf(placement) >= 0 ? "x" : "y";
}

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/utils/within.js
init_shim_jquery();
function within(min2, value, max2) {
  return max(min2, min(value, max2));
}
function withinMaxClamp(min2, value, max2) {
  var v = within(min2, value, max2);
  return v > max2 ? max2 : v;
}

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/utils/mergePaddingObject.js
init_shim_jquery();

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/utils/getFreshSideObject.js
init_shim_jquery();
function getFreshSideObject() {
  return {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  };
}

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/utils/mergePaddingObject.js
function mergePaddingObject(paddingObject) {
  return Object.assign({}, getFreshSideObject(), paddingObject);
}

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/utils/expandToHashMap.js
init_shim_jquery();
function expandToHashMap(value, keys) {
  return keys.reduce(function(hashMap, key) {
    hashMap[key] = value;
    return hashMap;
  }, {});
}

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/modifiers/arrow.js
var toPaddingObject = function toPaddingObject2(padding, state) {
  padding = typeof padding === "function" ? padding(Object.assign({}, state.rects, {
    placement: state.placement
  })) : padding;
  return mergePaddingObject(typeof padding !== "number" ? padding : expandToHashMap(padding, basePlacements));
};
function arrow(_ref) {
  var _state$modifiersData$;
  var state = _ref.state, name = _ref.name, options = _ref.options;
  var arrowElement = state.elements.arrow;
  var popperOffsets2 = state.modifiersData.popperOffsets;
  var basePlacement = getBasePlacement(state.placement);
  var axis = getMainAxisFromPlacement(basePlacement);
  var isVertical = [left, right].indexOf(basePlacement) >= 0;
  var len = isVertical ? "height" : "width";
  if (!arrowElement || !popperOffsets2) {
    return;
  }
  var paddingObject = toPaddingObject(options.padding, state);
  var arrowRect = getLayoutRect(arrowElement);
  var minProp = axis === "y" ? top : left;
  var maxProp = axis === "y" ? bottom : right;
  var endDiff = state.rects.reference[len] + state.rects.reference[axis] - popperOffsets2[axis] - state.rects.popper[len];
  var startDiff = popperOffsets2[axis] - state.rects.reference[axis];
  var arrowOffsetParent = getOffsetParent(arrowElement);
  var clientSize = arrowOffsetParent ? axis === "y" ? arrowOffsetParent.clientHeight || 0 : arrowOffsetParent.clientWidth || 0 : 0;
  var centerToReference = endDiff / 2 - startDiff / 2;
  var min2 = paddingObject[minProp];
  var max2 = clientSize - arrowRect[len] - paddingObject[maxProp];
  var center = clientSize / 2 - arrowRect[len] / 2 + centerToReference;
  var offset2 = within(min2, center, max2);
  var axisProp = axis;
  state.modifiersData[name] = (_state$modifiersData$ = {}, _state$modifiersData$[axisProp] = offset2, _state$modifiersData$.centerOffset = offset2 - center, _state$modifiersData$);
}
function effect2(_ref2) {
  var state = _ref2.state, options = _ref2.options;
  var _options$element = options.element, arrowElement = _options$element === void 0 ? "[data-popper-arrow]" : _options$element;
  if (arrowElement == null) {
    return;
  }
  if (typeof arrowElement === "string") {
    arrowElement = state.elements.popper.querySelector(arrowElement);
    if (!arrowElement) {
      return;
    }
  }
  if (!contains(state.elements.popper, arrowElement)) {
    return;
  }
  state.elements.arrow = arrowElement;
}
var arrow_default = {
  name: "arrow",
  enabled: true,
  phase: "main",
  fn: arrow,
  effect: effect2,
  requires: ["popperOffsets"],
  requiresIfExists: ["preventOverflow"]
};

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/modifiers/computeStyles.js
init_shim_jquery();

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/utils/getVariation.js
init_shim_jquery();
function getVariation(placement) {
  return placement.split("-")[1];
}

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/modifiers/computeStyles.js
var unsetSides = {
  top: "auto",
  right: "auto",
  bottom: "auto",
  left: "auto"
};
function roundOffsetsByDPR(_ref, win) {
  var x = _ref.x, y = _ref.y;
  var dpr = win.devicePixelRatio || 1;
  return {
    x: round(x * dpr) / dpr || 0,
    y: round(y * dpr) / dpr || 0
  };
}
function mapToStyles(_ref2) {
  var _Object$assign2;
  var popper2 = _ref2.popper, popperRect = _ref2.popperRect, placement = _ref2.placement, variation = _ref2.variation, offsets = _ref2.offsets, position = _ref2.position, gpuAcceleration = _ref2.gpuAcceleration, adaptive = _ref2.adaptive, roundOffsets = _ref2.roundOffsets, isFixed = _ref2.isFixed;
  var _offsets$x = offsets.x, x = _offsets$x === void 0 ? 0 : _offsets$x, _offsets$y = offsets.y, y = _offsets$y === void 0 ? 0 : _offsets$y;
  var _ref3 = typeof roundOffsets === "function" ? roundOffsets({
    x,
    y
  }) : {
    x,
    y
  };
  x = _ref3.x;
  y = _ref3.y;
  var hasX = offsets.hasOwnProperty("x");
  var hasY = offsets.hasOwnProperty("y");
  var sideX = left;
  var sideY = top;
  var win = window;
  if (adaptive) {
    var offsetParent = getOffsetParent(popper2);
    var heightProp = "clientHeight";
    var widthProp = "clientWidth";
    if (offsetParent === getWindow(popper2)) {
      offsetParent = getDocumentElement(popper2);
      if (getComputedStyle2(offsetParent).position !== "static" && position === "absolute") {
        heightProp = "scrollHeight";
        widthProp = "scrollWidth";
      }
    }
    offsetParent = offsetParent;
    if (placement === top || (placement === left || placement === right) && variation === end) {
      sideY = bottom;
      var offsetY = isFixed && offsetParent === win && win.visualViewport ? win.visualViewport.height : (
        // $FlowFixMe[prop-missing]
        offsetParent[heightProp]
      );
      y -= offsetY - popperRect.height;
      y *= gpuAcceleration ? 1 : -1;
    }
    if (placement === left || (placement === top || placement === bottom) && variation === end) {
      sideX = right;
      var offsetX = isFixed && offsetParent === win && win.visualViewport ? win.visualViewport.width : (
        // $FlowFixMe[prop-missing]
        offsetParent[widthProp]
      );
      x -= offsetX - popperRect.width;
      x *= gpuAcceleration ? 1 : -1;
    }
  }
  var commonStyles = Object.assign({
    position
  }, adaptive && unsetSides);
  var _ref4 = roundOffsets === true ? roundOffsetsByDPR({
    x,
    y
  }, getWindow(popper2)) : {
    x,
    y
  };
  x = _ref4.x;
  y = _ref4.y;
  if (gpuAcceleration) {
    var _Object$assign;
    return Object.assign({}, commonStyles, (_Object$assign = {}, _Object$assign[sideY] = hasY ? "0" : "", _Object$assign[sideX] = hasX ? "0" : "", _Object$assign.transform = (win.devicePixelRatio || 1) <= 1 ? "translate(" + x + "px, " + y + "px)" : "translate3d(" + x + "px, " + y + "px, 0)", _Object$assign));
  }
  return Object.assign({}, commonStyles, (_Object$assign2 = {}, _Object$assign2[sideY] = hasY ? y + "px" : "", _Object$assign2[sideX] = hasX ? x + "px" : "", _Object$assign2.transform = "", _Object$assign2));
}
function computeStyles(_ref5) {
  var state = _ref5.state, options = _ref5.options;
  var _options$gpuAccelerat = options.gpuAcceleration, gpuAcceleration = _options$gpuAccelerat === void 0 ? true : _options$gpuAccelerat, _options$adaptive = options.adaptive, adaptive = _options$adaptive === void 0 ? true : _options$adaptive, _options$roundOffsets = options.roundOffsets, roundOffsets = _options$roundOffsets === void 0 ? true : _options$roundOffsets;
  var commonStyles = {
    placement: getBasePlacement(state.placement),
    variation: getVariation(state.placement),
    popper: state.elements.popper,
    popperRect: state.rects.popper,
    gpuAcceleration,
    isFixed: state.options.strategy === "fixed"
  };
  if (state.modifiersData.popperOffsets != null) {
    state.styles.popper = Object.assign({}, state.styles.popper, mapToStyles(Object.assign({}, commonStyles, {
      offsets: state.modifiersData.popperOffsets,
      position: state.options.strategy,
      adaptive,
      roundOffsets
    })));
  }
  if (state.modifiersData.arrow != null) {
    state.styles.arrow = Object.assign({}, state.styles.arrow, mapToStyles(Object.assign({}, commonStyles, {
      offsets: state.modifiersData.arrow,
      position: "absolute",
      adaptive: false,
      roundOffsets
    })));
  }
  state.attributes.popper = Object.assign({}, state.attributes.popper, {
    "data-popper-placement": state.placement
  });
}
var computeStyles_default = {
  name: "computeStyles",
  enabled: true,
  phase: "beforeWrite",
  fn: computeStyles,
  data: {}
};

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/modifiers/eventListeners.js
init_shim_jquery();
var passive = {
  passive: true
};
function effect3(_ref) {
  var state = _ref.state, instance = _ref.instance, options = _ref.options;
  var _options$scroll = options.scroll, scroll = _options$scroll === void 0 ? true : _options$scroll, _options$resize = options.resize, resize = _options$resize === void 0 ? true : _options$resize;
  var window2 = getWindow(state.elements.popper);
  var scrollParents = [].concat(state.scrollParents.reference, state.scrollParents.popper);
  if (scroll) {
    scrollParents.forEach(function(scrollParent) {
      scrollParent.addEventListener("scroll", instance.update, passive);
    });
  }
  if (resize) {
    window2.addEventListener("resize", instance.update, passive);
  }
  return function() {
    if (scroll) {
      scrollParents.forEach(function(scrollParent) {
        scrollParent.removeEventListener("scroll", instance.update, passive);
      });
    }
    if (resize) {
      window2.removeEventListener("resize", instance.update, passive);
    }
  };
}
var eventListeners_default = {
  name: "eventListeners",
  enabled: true,
  phase: "write",
  fn: function fn() {
  },
  effect: effect3,
  data: {}
};

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/modifiers/flip.js
init_shim_jquery();

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/utils/getOppositePlacement.js
init_shim_jquery();
var hash = {
  left: "right",
  right: "left",
  bottom: "top",
  top: "bottom"
};
function getOppositePlacement(placement) {
  return placement.replace(/left|right|bottom|top/g, function(matched) {
    return hash[matched];
  });
}

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/utils/getOppositeVariationPlacement.js
init_shim_jquery();
var hash2 = {
  start: "end",
  end: "start"
};
function getOppositeVariationPlacement(placement) {
  return placement.replace(/start|end/g, function(matched) {
    return hash2[matched];
  });
}

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/utils/detectOverflow.js
init_shim_jquery();

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/dom-utils/getClippingRect.js
init_shim_jquery();

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/dom-utils/getViewportRect.js
init_shim_jquery();

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/dom-utils/getWindowScrollBarX.js
init_shim_jquery();

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/dom-utils/getWindowScroll.js
init_shim_jquery();
function getWindowScroll(node) {
  var win = getWindow(node);
  var scrollLeft = win.pageXOffset;
  var scrollTop = win.pageYOffset;
  return {
    scrollLeft,
    scrollTop
  };
}

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/dom-utils/getWindowScrollBarX.js
function getWindowScrollBarX(element) {
  return getBoundingClientRect(getDocumentElement(element)).left + getWindowScroll(element).scrollLeft;
}

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/dom-utils/getViewportRect.js
function getViewportRect(element, strategy) {
  var win = getWindow(element);
  var html = getDocumentElement(element);
  var visualViewport = win.visualViewport;
  var width = html.clientWidth;
  var height = html.clientHeight;
  var x = 0;
  var y = 0;
  if (visualViewport) {
    width = visualViewport.width;
    height = visualViewport.height;
    var layoutViewport = isLayoutViewport();
    if (layoutViewport || !layoutViewport && strategy === "fixed") {
      x = visualViewport.offsetLeft;
      y = visualViewport.offsetTop;
    }
  }
  return {
    width,
    height,
    x: x + getWindowScrollBarX(element),
    y
  };
}

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/dom-utils/getDocumentRect.js
init_shim_jquery();
function getDocumentRect(element) {
  var _element$ownerDocumen;
  var html = getDocumentElement(element);
  var winScroll = getWindowScroll(element);
  var body = (_element$ownerDocumen = element.ownerDocument) == null ? void 0 : _element$ownerDocumen.body;
  var width = max(html.scrollWidth, html.clientWidth, body ? body.scrollWidth : 0, body ? body.clientWidth : 0);
  var height = max(html.scrollHeight, html.clientHeight, body ? body.scrollHeight : 0, body ? body.clientHeight : 0);
  var x = -winScroll.scrollLeft + getWindowScrollBarX(element);
  var y = -winScroll.scrollTop;
  if (getComputedStyle2(body || html).direction === "rtl") {
    x += max(html.clientWidth, body ? body.clientWidth : 0) - width;
  }
  return {
    width,
    height,
    x,
    y
  };
}

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/dom-utils/listScrollParents.js
init_shim_jquery();

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/dom-utils/getScrollParent.js
init_shim_jquery();

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/dom-utils/isScrollParent.js
init_shim_jquery();
function isScrollParent(element) {
  var _getComputedStyle = getComputedStyle2(element), overflow = _getComputedStyle.overflow, overflowX = _getComputedStyle.overflowX, overflowY = _getComputedStyle.overflowY;
  return /auto|scroll|overlay|hidden/.test(overflow + overflowY + overflowX);
}

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/dom-utils/getScrollParent.js
function getScrollParent(node) {
  if (["html", "body", "#document"].indexOf(getNodeName(node)) >= 0) {
    return node.ownerDocument.body;
  }
  if (isHTMLElement(node) && isScrollParent(node)) {
    return node;
  }
  return getScrollParent(getParentNode(node));
}

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/dom-utils/listScrollParents.js
function listScrollParents(element, list) {
  var _element$ownerDocumen;
  if (list === void 0) {
    list = [];
  }
  var scrollParent = getScrollParent(element);
  var isBody = scrollParent === ((_element$ownerDocumen = element.ownerDocument) == null ? void 0 : _element$ownerDocumen.body);
  var win = getWindow(scrollParent);
  var target = isBody ? [win].concat(win.visualViewport || [], isScrollParent(scrollParent) ? scrollParent : []) : scrollParent;
  var updatedList = list.concat(target);
  return isBody ? updatedList : (
    // $FlowFixMe[incompatible-call]: isBody tells us target will be an HTMLElement here
    updatedList.concat(listScrollParents(getParentNode(target)))
  );
}

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/utils/rectToClientRect.js
init_shim_jquery();
function rectToClientRect(rect) {
  return Object.assign({}, rect, {
    left: rect.x,
    top: rect.y,
    right: rect.x + rect.width,
    bottom: rect.y + rect.height
  });
}

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/dom-utils/getClippingRect.js
function getInnerBoundingClientRect(element, strategy) {
  var rect = getBoundingClientRect(element, false, strategy === "fixed");
  rect.top = rect.top + element.clientTop;
  rect.left = rect.left + element.clientLeft;
  rect.bottom = rect.top + element.clientHeight;
  rect.right = rect.left + element.clientWidth;
  rect.width = element.clientWidth;
  rect.height = element.clientHeight;
  rect.x = rect.left;
  rect.y = rect.top;
  return rect;
}
function getClientRectFromMixedType(element, clippingParent, strategy) {
  return clippingParent === viewport ? rectToClientRect(getViewportRect(element, strategy)) : isElement(clippingParent) ? getInnerBoundingClientRect(clippingParent, strategy) : rectToClientRect(getDocumentRect(getDocumentElement(element)));
}
function getClippingParents(element) {
  var clippingParents2 = listScrollParents(getParentNode(element));
  var canEscapeClipping = ["absolute", "fixed"].indexOf(getComputedStyle2(element).position) >= 0;
  var clipperElement = canEscapeClipping && isHTMLElement(element) ? getOffsetParent(element) : element;
  if (!isElement(clipperElement)) {
    return [];
  }
  return clippingParents2.filter(function(clippingParent) {
    return isElement(clippingParent) && contains(clippingParent, clipperElement) && getNodeName(clippingParent) !== "body";
  });
}
function getClippingRect(element, boundary, rootBoundary, strategy) {
  var mainClippingParents = boundary === "clippingParents" ? getClippingParents(element) : [].concat(boundary);
  var clippingParents2 = [].concat(mainClippingParents, [rootBoundary]);
  var firstClippingParent = clippingParents2[0];
  var clippingRect = clippingParents2.reduce(function(accRect, clippingParent) {
    var rect = getClientRectFromMixedType(element, clippingParent, strategy);
    accRect.top = max(rect.top, accRect.top);
    accRect.right = min(rect.right, accRect.right);
    accRect.bottom = min(rect.bottom, accRect.bottom);
    accRect.left = max(rect.left, accRect.left);
    return accRect;
  }, getClientRectFromMixedType(element, firstClippingParent, strategy));
  clippingRect.width = clippingRect.right - clippingRect.left;
  clippingRect.height = clippingRect.bottom - clippingRect.top;
  clippingRect.x = clippingRect.left;
  clippingRect.y = clippingRect.top;
  return clippingRect;
}

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/utils/computeOffsets.js
init_shim_jquery();
function computeOffsets(_ref) {
  var reference2 = _ref.reference, element = _ref.element, placement = _ref.placement;
  var basePlacement = placement ? getBasePlacement(placement) : null;
  var variation = placement ? getVariation(placement) : null;
  var commonX = reference2.x + reference2.width / 2 - element.width / 2;
  var commonY = reference2.y + reference2.height / 2 - element.height / 2;
  var offsets;
  switch (basePlacement) {
    case top:
      offsets = {
        x: commonX,
        y: reference2.y - element.height
      };
      break;
    case bottom:
      offsets = {
        x: commonX,
        y: reference2.y + reference2.height
      };
      break;
    case right:
      offsets = {
        x: reference2.x + reference2.width,
        y: commonY
      };
      break;
    case left:
      offsets = {
        x: reference2.x - element.width,
        y: commonY
      };
      break;
    default:
      offsets = {
        x: reference2.x,
        y: reference2.y
      };
  }
  var mainAxis = basePlacement ? getMainAxisFromPlacement(basePlacement) : null;
  if (mainAxis != null) {
    var len = mainAxis === "y" ? "height" : "width";
    switch (variation) {
      case start:
        offsets[mainAxis] = offsets[mainAxis] - (reference2[len] / 2 - element[len] / 2);
        break;
      case end:
        offsets[mainAxis] = offsets[mainAxis] + (reference2[len] / 2 - element[len] / 2);
        break;
      default:
    }
  }
  return offsets;
}

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/utils/detectOverflow.js
function detectOverflow(state, options) {
  if (options === void 0) {
    options = {};
  }
  var _options = options, _options$placement = _options.placement, placement = _options$placement === void 0 ? state.placement : _options$placement, _options$strategy = _options.strategy, strategy = _options$strategy === void 0 ? state.strategy : _options$strategy, _options$boundary = _options.boundary, boundary = _options$boundary === void 0 ? clippingParents : _options$boundary, _options$rootBoundary = _options.rootBoundary, rootBoundary = _options$rootBoundary === void 0 ? viewport : _options$rootBoundary, _options$elementConte = _options.elementContext, elementContext = _options$elementConte === void 0 ? popper : _options$elementConte, _options$altBoundary = _options.altBoundary, altBoundary = _options$altBoundary === void 0 ? false : _options$altBoundary, _options$padding = _options.padding, padding = _options$padding === void 0 ? 0 : _options$padding;
  var paddingObject = mergePaddingObject(typeof padding !== "number" ? padding : expandToHashMap(padding, basePlacements));
  var altContext = elementContext === popper ? reference : popper;
  var popperRect = state.rects.popper;
  var element = state.elements[altBoundary ? altContext : elementContext];
  var clippingClientRect = getClippingRect(isElement(element) ? element : element.contextElement || getDocumentElement(state.elements.popper), boundary, rootBoundary, strategy);
  var referenceClientRect = getBoundingClientRect(state.elements.reference);
  var popperOffsets2 = computeOffsets({
    reference: referenceClientRect,
    element: popperRect,
    strategy: "absolute",
    placement
  });
  var popperClientRect = rectToClientRect(Object.assign({}, popperRect, popperOffsets2));
  var elementClientRect = elementContext === popper ? popperClientRect : referenceClientRect;
  var overflowOffsets = {
    top: clippingClientRect.top - elementClientRect.top + paddingObject.top,
    bottom: elementClientRect.bottom - clippingClientRect.bottom + paddingObject.bottom,
    left: clippingClientRect.left - elementClientRect.left + paddingObject.left,
    right: elementClientRect.right - clippingClientRect.right + paddingObject.right
  };
  var offsetData = state.modifiersData.offset;
  if (elementContext === popper && offsetData) {
    var offset2 = offsetData[placement];
    Object.keys(overflowOffsets).forEach(function(key) {
      var multiply = [right, bottom].indexOf(key) >= 0 ? 1 : -1;
      var axis = [top, bottom].indexOf(key) >= 0 ? "y" : "x";
      overflowOffsets[key] += offset2[axis] * multiply;
    });
  }
  return overflowOffsets;
}

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/utils/computeAutoPlacement.js
init_shim_jquery();
function computeAutoPlacement(state, options) {
  if (options === void 0) {
    options = {};
  }
  var _options = options, placement = _options.placement, boundary = _options.boundary, rootBoundary = _options.rootBoundary, padding = _options.padding, flipVariations = _options.flipVariations, _options$allowedAutoP = _options.allowedAutoPlacements, allowedAutoPlacements = _options$allowedAutoP === void 0 ? placements : _options$allowedAutoP;
  var variation = getVariation(placement);
  var placements2 = variation ? flipVariations ? variationPlacements : variationPlacements.filter(function(placement2) {
    return getVariation(placement2) === variation;
  }) : basePlacements;
  var allowedPlacements = placements2.filter(function(placement2) {
    return allowedAutoPlacements.indexOf(placement2) >= 0;
  });
  if (allowedPlacements.length === 0) {
    allowedPlacements = placements2;
  }
  var overflows = allowedPlacements.reduce(function(acc, placement2) {
    acc[placement2] = detectOverflow(state, {
      placement: placement2,
      boundary,
      rootBoundary,
      padding
    })[getBasePlacement(placement2)];
    return acc;
  }, {});
  return Object.keys(overflows).sort(function(a, b) {
    return overflows[a] - overflows[b];
  });
}

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/modifiers/flip.js
function getExpandedFallbackPlacements(placement) {
  if (getBasePlacement(placement) === auto) {
    return [];
  }
  var oppositePlacement = getOppositePlacement(placement);
  return [getOppositeVariationPlacement(placement), oppositePlacement, getOppositeVariationPlacement(oppositePlacement)];
}
function flip(_ref) {
  var state = _ref.state, options = _ref.options, name = _ref.name;
  if (state.modifiersData[name]._skip) {
    return;
  }
  var _options$mainAxis = options.mainAxis, checkMainAxis = _options$mainAxis === void 0 ? true : _options$mainAxis, _options$altAxis = options.altAxis, checkAltAxis = _options$altAxis === void 0 ? true : _options$altAxis, specifiedFallbackPlacements = options.fallbackPlacements, padding = options.padding, boundary = options.boundary, rootBoundary = options.rootBoundary, altBoundary = options.altBoundary, _options$flipVariatio = options.flipVariations, flipVariations = _options$flipVariatio === void 0 ? true : _options$flipVariatio, allowedAutoPlacements = options.allowedAutoPlacements;
  var preferredPlacement = state.options.placement;
  var basePlacement = getBasePlacement(preferredPlacement);
  var isBasePlacement = basePlacement === preferredPlacement;
  var fallbackPlacements = specifiedFallbackPlacements || (isBasePlacement || !flipVariations ? [getOppositePlacement(preferredPlacement)] : getExpandedFallbackPlacements(preferredPlacement));
  var placements2 = [preferredPlacement].concat(fallbackPlacements).reduce(function(acc, placement2) {
    return acc.concat(getBasePlacement(placement2) === auto ? computeAutoPlacement(state, {
      placement: placement2,
      boundary,
      rootBoundary,
      padding,
      flipVariations,
      allowedAutoPlacements
    }) : placement2);
  }, []);
  var referenceRect = state.rects.reference;
  var popperRect = state.rects.popper;
  var checksMap = /* @__PURE__ */ new Map();
  var makeFallbackChecks = true;
  var firstFittingPlacement = placements2[0];
  for (var i = 0; i < placements2.length; i++) {
    var placement = placements2[i];
    var _basePlacement = getBasePlacement(placement);
    var isStartVariation = getVariation(placement) === start;
    var isVertical = [top, bottom].indexOf(_basePlacement) >= 0;
    var len = isVertical ? "width" : "height";
    var overflow = detectOverflow(state, {
      placement,
      boundary,
      rootBoundary,
      altBoundary,
      padding
    });
    var mainVariationSide = isVertical ? isStartVariation ? right : left : isStartVariation ? bottom : top;
    if (referenceRect[len] > popperRect[len]) {
      mainVariationSide = getOppositePlacement(mainVariationSide);
    }
    var altVariationSide = getOppositePlacement(mainVariationSide);
    var checks = [];
    if (checkMainAxis) {
      checks.push(overflow[_basePlacement] <= 0);
    }
    if (checkAltAxis) {
      checks.push(overflow[mainVariationSide] <= 0, overflow[altVariationSide] <= 0);
    }
    if (checks.every(function(check) {
      return check;
    })) {
      firstFittingPlacement = placement;
      makeFallbackChecks = false;
      break;
    }
    checksMap.set(placement, checks);
  }
  if (makeFallbackChecks) {
    var numberOfChecks = flipVariations ? 3 : 1;
    var _loop = function _loop2(_i2) {
      var fittingPlacement = placements2.find(function(placement2) {
        var checks2 = checksMap.get(placement2);
        if (checks2) {
          return checks2.slice(0, _i2).every(function(check) {
            return check;
          });
        }
      });
      if (fittingPlacement) {
        firstFittingPlacement = fittingPlacement;
        return "break";
      }
    };
    for (var _i = numberOfChecks; _i > 0; _i--) {
      var _ret = _loop(_i);
      if (_ret === "break") break;
    }
  }
  if (state.placement !== firstFittingPlacement) {
    state.modifiersData[name]._skip = true;
    state.placement = firstFittingPlacement;
    state.reset = true;
  }
}
var flip_default = {
  name: "flip",
  enabled: true,
  phase: "main",
  fn: flip,
  requiresIfExists: ["offset"],
  data: {
    _skip: false
  }
};

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/modifiers/hide.js
init_shim_jquery();
function getSideOffsets(overflow, rect, preventedOffsets) {
  if (preventedOffsets === void 0) {
    preventedOffsets = {
      x: 0,
      y: 0
    };
  }
  return {
    top: overflow.top - rect.height - preventedOffsets.y,
    right: overflow.right - rect.width + preventedOffsets.x,
    bottom: overflow.bottom - rect.height + preventedOffsets.y,
    left: overflow.left - rect.width - preventedOffsets.x
  };
}
function isAnySideFullyClipped(overflow) {
  return [top, right, bottom, left].some(function(side) {
    return overflow[side] >= 0;
  });
}
function hide(_ref) {
  var state = _ref.state, name = _ref.name;
  var referenceRect = state.rects.reference;
  var popperRect = state.rects.popper;
  var preventedOffsets = state.modifiersData.preventOverflow;
  var referenceOverflow = detectOverflow(state, {
    elementContext: "reference"
  });
  var popperAltOverflow = detectOverflow(state, {
    altBoundary: true
  });
  var referenceClippingOffsets = getSideOffsets(referenceOverflow, referenceRect);
  var popperEscapeOffsets = getSideOffsets(popperAltOverflow, popperRect, preventedOffsets);
  var isReferenceHidden = isAnySideFullyClipped(referenceClippingOffsets);
  var hasPopperEscaped = isAnySideFullyClipped(popperEscapeOffsets);
  state.modifiersData[name] = {
    referenceClippingOffsets,
    popperEscapeOffsets,
    isReferenceHidden,
    hasPopperEscaped
  };
  state.attributes.popper = Object.assign({}, state.attributes.popper, {
    "data-popper-reference-hidden": isReferenceHidden,
    "data-popper-escaped": hasPopperEscaped
  });
}
var hide_default = {
  name: "hide",
  enabled: true,
  phase: "main",
  requiresIfExists: ["preventOverflow"],
  fn: hide
};

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/modifiers/offset.js
init_shim_jquery();
function distanceAndSkiddingToXY(placement, rects, offset2) {
  var basePlacement = getBasePlacement(placement);
  var invertDistance = [left, top].indexOf(basePlacement) >= 0 ? -1 : 1;
  var _ref = typeof offset2 === "function" ? offset2(Object.assign({}, rects, {
    placement
  })) : offset2, skidding = _ref[0], distance = _ref[1];
  skidding = skidding || 0;
  distance = (distance || 0) * invertDistance;
  return [left, right].indexOf(basePlacement) >= 0 ? {
    x: distance,
    y: skidding
  } : {
    x: skidding,
    y: distance
  };
}
function offset(_ref2) {
  var state = _ref2.state, options = _ref2.options, name = _ref2.name;
  var _options$offset = options.offset, offset2 = _options$offset === void 0 ? [0, 0] : _options$offset;
  var data = placements.reduce(function(acc, placement) {
    acc[placement] = distanceAndSkiddingToXY(placement, state.rects, offset2);
    return acc;
  }, {});
  var _data$state$placement = data[state.placement], x = _data$state$placement.x, y = _data$state$placement.y;
  if (state.modifiersData.popperOffsets != null) {
    state.modifiersData.popperOffsets.x += x;
    state.modifiersData.popperOffsets.y += y;
  }
  state.modifiersData[name] = data;
}
var offset_default = {
  name: "offset",
  enabled: true,
  phase: "main",
  requires: ["popperOffsets"],
  fn: offset
};

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/modifiers/popperOffsets.js
init_shim_jquery();
function popperOffsets(_ref) {
  var state = _ref.state, name = _ref.name;
  state.modifiersData[name] = computeOffsets({
    reference: state.rects.reference,
    element: state.rects.popper,
    strategy: "absolute",
    placement: state.placement
  });
}
var popperOffsets_default = {
  name: "popperOffsets",
  enabled: true,
  phase: "read",
  fn: popperOffsets,
  data: {}
};

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/modifiers/preventOverflow.js
init_shim_jquery();

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/utils/getAltAxis.js
init_shim_jquery();
function getAltAxis(axis) {
  return axis === "x" ? "y" : "x";
}

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/modifiers/preventOverflow.js
function preventOverflow(_ref) {
  var state = _ref.state, options = _ref.options, name = _ref.name;
  var _options$mainAxis = options.mainAxis, checkMainAxis = _options$mainAxis === void 0 ? true : _options$mainAxis, _options$altAxis = options.altAxis, checkAltAxis = _options$altAxis === void 0 ? false : _options$altAxis, boundary = options.boundary, rootBoundary = options.rootBoundary, altBoundary = options.altBoundary, padding = options.padding, _options$tether = options.tether, tether = _options$tether === void 0 ? true : _options$tether, _options$tetherOffset = options.tetherOffset, tetherOffset = _options$tetherOffset === void 0 ? 0 : _options$tetherOffset;
  var overflow = detectOverflow(state, {
    boundary,
    rootBoundary,
    padding,
    altBoundary
  });
  var basePlacement = getBasePlacement(state.placement);
  var variation = getVariation(state.placement);
  var isBasePlacement = !variation;
  var mainAxis = getMainAxisFromPlacement(basePlacement);
  var altAxis = getAltAxis(mainAxis);
  var popperOffsets2 = state.modifiersData.popperOffsets;
  var referenceRect = state.rects.reference;
  var popperRect = state.rects.popper;
  var tetherOffsetValue = typeof tetherOffset === "function" ? tetherOffset(Object.assign({}, state.rects, {
    placement: state.placement
  })) : tetherOffset;
  var normalizedTetherOffsetValue = typeof tetherOffsetValue === "number" ? {
    mainAxis: tetherOffsetValue,
    altAxis: tetherOffsetValue
  } : Object.assign({
    mainAxis: 0,
    altAxis: 0
  }, tetherOffsetValue);
  var offsetModifierState = state.modifiersData.offset ? state.modifiersData.offset[state.placement] : null;
  var data = {
    x: 0,
    y: 0
  };
  if (!popperOffsets2) {
    return;
  }
  if (checkMainAxis) {
    var _offsetModifierState$;
    var mainSide = mainAxis === "y" ? top : left;
    var altSide = mainAxis === "y" ? bottom : right;
    var len = mainAxis === "y" ? "height" : "width";
    var offset2 = popperOffsets2[mainAxis];
    var min2 = offset2 + overflow[mainSide];
    var max2 = offset2 - overflow[altSide];
    var additive = tether ? -popperRect[len] / 2 : 0;
    var minLen = variation === start ? referenceRect[len] : popperRect[len];
    var maxLen = variation === start ? -popperRect[len] : -referenceRect[len];
    var arrowElement = state.elements.arrow;
    var arrowRect = tether && arrowElement ? getLayoutRect(arrowElement) : {
      width: 0,
      height: 0
    };
    var arrowPaddingObject = state.modifiersData["arrow#persistent"] ? state.modifiersData["arrow#persistent"].padding : getFreshSideObject();
    var arrowPaddingMin = arrowPaddingObject[mainSide];
    var arrowPaddingMax = arrowPaddingObject[altSide];
    var arrowLen = within(0, referenceRect[len], arrowRect[len]);
    var minOffset = isBasePlacement ? referenceRect[len] / 2 - additive - arrowLen - arrowPaddingMin - normalizedTetherOffsetValue.mainAxis : minLen - arrowLen - arrowPaddingMin - normalizedTetherOffsetValue.mainAxis;
    var maxOffset = isBasePlacement ? -referenceRect[len] / 2 + additive + arrowLen + arrowPaddingMax + normalizedTetherOffsetValue.mainAxis : maxLen + arrowLen + arrowPaddingMax + normalizedTetherOffsetValue.mainAxis;
    var arrowOffsetParent = state.elements.arrow && getOffsetParent(state.elements.arrow);
    var clientOffset = arrowOffsetParent ? mainAxis === "y" ? arrowOffsetParent.clientTop || 0 : arrowOffsetParent.clientLeft || 0 : 0;
    var offsetModifierValue = (_offsetModifierState$ = offsetModifierState == null ? void 0 : offsetModifierState[mainAxis]) != null ? _offsetModifierState$ : 0;
    var tetherMin = offset2 + minOffset - offsetModifierValue - clientOffset;
    var tetherMax = offset2 + maxOffset - offsetModifierValue;
    var preventedOffset = within(tether ? min(min2, tetherMin) : min2, offset2, tether ? max(max2, tetherMax) : max2);
    popperOffsets2[mainAxis] = preventedOffset;
    data[mainAxis] = preventedOffset - offset2;
  }
  if (checkAltAxis) {
    var _offsetModifierState$2;
    var _mainSide = mainAxis === "x" ? top : left;
    var _altSide = mainAxis === "x" ? bottom : right;
    var _offset = popperOffsets2[altAxis];
    var _len = altAxis === "y" ? "height" : "width";
    var _min = _offset + overflow[_mainSide];
    var _max = _offset - overflow[_altSide];
    var isOriginSide = [top, left].indexOf(basePlacement) !== -1;
    var _offsetModifierValue = (_offsetModifierState$2 = offsetModifierState == null ? void 0 : offsetModifierState[altAxis]) != null ? _offsetModifierState$2 : 0;
    var _tetherMin = isOriginSide ? _min : _offset - referenceRect[_len] - popperRect[_len] - _offsetModifierValue + normalizedTetherOffsetValue.altAxis;
    var _tetherMax = isOriginSide ? _offset + referenceRect[_len] + popperRect[_len] - _offsetModifierValue - normalizedTetherOffsetValue.altAxis : _max;
    var _preventedOffset = tether && isOriginSide ? withinMaxClamp(_tetherMin, _offset, _tetherMax) : within(tether ? _tetherMin : _min, _offset, tether ? _tetherMax : _max);
    popperOffsets2[altAxis] = _preventedOffset;
    data[altAxis] = _preventedOffset - _offset;
  }
  state.modifiersData[name] = data;
}
var preventOverflow_default = {
  name: "preventOverflow",
  enabled: true,
  phase: "main",
  fn: preventOverflow,
  requiresIfExists: ["offset"]
};

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/createPopper.js
init_shim_jquery();

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/dom-utils/getCompositeRect.js
init_shim_jquery();

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/dom-utils/getNodeScroll.js
init_shim_jquery();

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/dom-utils/getHTMLElementScroll.js
init_shim_jquery();
function getHTMLElementScroll(element) {
  return {
    scrollLeft: element.scrollLeft,
    scrollTop: element.scrollTop
  };
}

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/dom-utils/getNodeScroll.js
function getNodeScroll(node) {
  if (node === getWindow(node) || !isHTMLElement(node)) {
    return getWindowScroll(node);
  } else {
    return getHTMLElementScroll(node);
  }
}

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/dom-utils/getCompositeRect.js
function isElementScaled(element) {
  var rect = element.getBoundingClientRect();
  var scaleX = round(rect.width) / element.offsetWidth || 1;
  var scaleY = round(rect.height) / element.offsetHeight || 1;
  return scaleX !== 1 || scaleY !== 1;
}
function getCompositeRect(elementOrVirtualElement, offsetParent, isFixed) {
  if (isFixed === void 0) {
    isFixed = false;
  }
  var isOffsetParentAnElement = isHTMLElement(offsetParent);
  var offsetParentIsScaled = isHTMLElement(offsetParent) && isElementScaled(offsetParent);
  var documentElement = getDocumentElement(offsetParent);
  var rect = getBoundingClientRect(elementOrVirtualElement, offsetParentIsScaled, isFixed);
  var scroll = {
    scrollLeft: 0,
    scrollTop: 0
  };
  var offsets = {
    x: 0,
    y: 0
  };
  if (isOffsetParentAnElement || !isOffsetParentAnElement && !isFixed) {
    if (getNodeName(offsetParent) !== "body" || // https://github.com/popperjs/popper-core/issues/1078
    isScrollParent(documentElement)) {
      scroll = getNodeScroll(offsetParent);
    }
    if (isHTMLElement(offsetParent)) {
      offsets = getBoundingClientRect(offsetParent, true);
      offsets.x += offsetParent.clientLeft;
      offsets.y += offsetParent.clientTop;
    } else if (documentElement) {
      offsets.x = getWindowScrollBarX(documentElement);
    }
  }
  return {
    x: rect.left + scroll.scrollLeft - offsets.x,
    y: rect.top + scroll.scrollTop - offsets.y,
    width: rect.width,
    height: rect.height
  };
}

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/utils/orderModifiers.js
init_shim_jquery();
function order(modifiers) {
  var map = /* @__PURE__ */ new Map();
  var visited = /* @__PURE__ */ new Set();
  var result = [];
  modifiers.forEach(function(modifier) {
    map.set(modifier.name, modifier);
  });
  function sort(modifier) {
    visited.add(modifier.name);
    var requires = [].concat(modifier.requires || [], modifier.requiresIfExists || []);
    requires.forEach(function(dep) {
      if (!visited.has(dep)) {
        var depModifier = map.get(dep);
        if (depModifier) {
          sort(depModifier);
        }
      }
    });
    result.push(modifier);
  }
  modifiers.forEach(function(modifier) {
    if (!visited.has(modifier.name)) {
      sort(modifier);
    }
  });
  return result;
}
function orderModifiers(modifiers) {
  var orderedModifiers = order(modifiers);
  return modifierPhases.reduce(function(acc, phase) {
    return acc.concat(orderedModifiers.filter(function(modifier) {
      return modifier.phase === phase;
    }));
  }, []);
}

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/utils/debounce.js
init_shim_jquery();
function debounce(fn2) {
  var pending;
  return function() {
    if (!pending) {
      pending = new Promise(function(resolve) {
        Promise.resolve().then(function() {
          pending = void 0;
          resolve(fn2());
        });
      });
    }
    return pending;
  };
}

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/utils/mergeByName.js
init_shim_jquery();
function mergeByName(modifiers) {
  var merged = modifiers.reduce(function(merged2, current) {
    var existing = merged2[current.name];
    merged2[current.name] = existing ? Object.assign({}, existing, current, {
      options: Object.assign({}, existing.options, current.options),
      data: Object.assign({}, existing.data, current.data)
    }) : current;
    return merged2;
  }, {});
  return Object.keys(merged).map(function(key) {
    return merged[key];
  });
}

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/createPopper.js
var DEFAULT_OPTIONS = {
  placement: "bottom",
  modifiers: [],
  strategy: "absolute"
};
function areValidElements() {
  for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }
  return !args.some(function(element) {
    return !(element && typeof element.getBoundingClientRect === "function");
  });
}
function popperGenerator(generatorOptions) {
  if (generatorOptions === void 0) {
    generatorOptions = {};
  }
  var _generatorOptions = generatorOptions, _generatorOptions$def = _generatorOptions.defaultModifiers, defaultModifiers3 = _generatorOptions$def === void 0 ? [] : _generatorOptions$def, _generatorOptions$def2 = _generatorOptions.defaultOptions, defaultOptions = _generatorOptions$def2 === void 0 ? DEFAULT_OPTIONS : _generatorOptions$def2;
  return function createPopper4(reference2, popper2, options) {
    if (options === void 0) {
      options = defaultOptions;
    }
    var state = {
      placement: "bottom",
      orderedModifiers: [],
      options: Object.assign({}, DEFAULT_OPTIONS, defaultOptions),
      modifiersData: {},
      elements: {
        reference: reference2,
        popper: popper2
      },
      attributes: {},
      styles: {}
    };
    var effectCleanupFns = [];
    var isDestroyed = false;
    var instance = {
      state,
      setOptions: function setOptions(setOptionsAction) {
        var options2 = typeof setOptionsAction === "function" ? setOptionsAction(state.options) : setOptionsAction;
        cleanupModifierEffects();
        state.options = Object.assign({}, defaultOptions, state.options, options2);
        state.scrollParents = {
          reference: isElement(reference2) ? listScrollParents(reference2) : reference2.contextElement ? listScrollParents(reference2.contextElement) : [],
          popper: listScrollParents(popper2)
        };
        var orderedModifiers = orderModifiers(mergeByName([].concat(defaultModifiers3, state.options.modifiers)));
        state.orderedModifiers = orderedModifiers.filter(function(m) {
          return m.enabled;
        });
        runModifierEffects();
        return instance.update();
      },
      // Sync update – it will always be executed, even if not necessary. This
      // is useful for low frequency updates where sync behavior simplifies the
      // logic.
      // For high frequency updates (e.g. `resize` and `scroll` events), always
      // prefer the async Popper#update method
      forceUpdate: function forceUpdate() {
        if (isDestroyed) {
          return;
        }
        var _state$elements = state.elements, reference3 = _state$elements.reference, popper3 = _state$elements.popper;
        if (!areValidElements(reference3, popper3)) {
          return;
        }
        state.rects = {
          reference: getCompositeRect(reference3, getOffsetParent(popper3), state.options.strategy === "fixed"),
          popper: getLayoutRect(popper3)
        };
        state.reset = false;
        state.placement = state.options.placement;
        state.orderedModifiers.forEach(function(modifier) {
          return state.modifiersData[modifier.name] = Object.assign({}, modifier.data);
        });
        for (var index = 0; index < state.orderedModifiers.length; index++) {
          if (state.reset === true) {
            state.reset = false;
            index = -1;
            continue;
          }
          var _state$orderedModifie = state.orderedModifiers[index], fn2 = _state$orderedModifie.fn, _state$orderedModifie2 = _state$orderedModifie.options, _options = _state$orderedModifie2 === void 0 ? {} : _state$orderedModifie2, name = _state$orderedModifie.name;
          if (typeof fn2 === "function") {
            state = fn2({
              state,
              options: _options,
              name,
              instance
            }) || state;
          }
        }
      },
      // Async and optimistically optimized update – it will not be executed if
      // not necessary (debounced to run at most once-per-tick)
      update: debounce(function() {
        return new Promise(function(resolve) {
          instance.forceUpdate();
          resolve(state);
        });
      }),
      destroy: function destroy() {
        cleanupModifierEffects();
        isDestroyed = true;
      }
    };
    if (!areValidElements(reference2, popper2)) {
      return instance;
    }
    instance.setOptions(options).then(function(state2) {
      if (!isDestroyed && options.onFirstUpdate) {
        options.onFirstUpdate(state2);
      }
    });
    function runModifierEffects() {
      state.orderedModifiers.forEach(function(_ref) {
        var name = _ref.name, _ref$options = _ref.options, options2 = _ref$options === void 0 ? {} : _ref$options, effect4 = _ref.effect;
        if (typeof effect4 === "function") {
          var cleanupFn = effect4({
            state,
            name,
            instance,
            options: options2
          });
          var noopFn = function noopFn2() {
          };
          effectCleanupFns.push(cleanupFn || noopFn);
        }
      });
    }
    function cleanupModifierEffects() {
      effectCleanupFns.forEach(function(fn2) {
        return fn2();
      });
      effectCleanupFns = [];
    }
    return instance;
  };
}
var createPopper = /* @__PURE__ */ popperGenerator();

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/popper.js
init_shim_jquery();

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/popper-lite.js
init_shim_jquery();
var defaultModifiers = [eventListeners_default, popperOffsets_default, computeStyles_default, applyStyles_default];
var createPopper2 = /* @__PURE__ */ popperGenerator({
  defaultModifiers
});

// node_modules/.pnpm/@popperjs+core@2.11.8/node_modules/@popperjs/core/lib/popper.js
var defaultModifiers2 = [eventListeners_default, popperOffsets_default, computeStyles_default, applyStyles_default, offset_default, flip_default, preventOverflow_default, arrow_default, hide_default];
var createPopper3 = /* @__PURE__ */ popperGenerator({
  defaultModifiers: defaultModifiers2
});

// node_modules/.pnpm/bootstrap@5.3.6_@popperjs+core@2.11.8/node_modules/bootstrap/dist/js/bootstrap.esm.js
var elementMap = /* @__PURE__ */ new Map();
var Data = {
  set(element, key, instance) {
    if (!elementMap.has(element)) {
      elementMap.set(element, /* @__PURE__ */ new Map());
    }
    const instanceMap = elementMap.get(element);
    if (!instanceMap.has(key) && instanceMap.size !== 0) {
      console.error(`Bootstrap doesn't allow more than one instance per element. Bound instance: ${Array.from(instanceMap.keys())[0]}.`);
      return;
    }
    instanceMap.set(key, instance);
  },
  get(element, key) {
    if (elementMap.has(element)) {
      return elementMap.get(element).get(key) || null;
    }
    return null;
  },
  remove(element, key) {
    if (!elementMap.has(element)) {
      return;
    }
    const instanceMap = elementMap.get(element);
    instanceMap.delete(key);
    if (instanceMap.size === 0) {
      elementMap.delete(element);
    }
  }
};
var MAX_UID = 1e6;
var MILLISECONDS_MULTIPLIER = 1e3;
var TRANSITION_END = "transitionend";
var parseSelector = (selector) => {
  if (selector && window.CSS && window.CSS.escape) {
    selector = selector.replace(/#([^\s"#']+)/g, (match, id) => `#${CSS.escape(id)}`);
  }
  return selector;
};
var toType = (object) => {
  if (object === null || object === void 0) {
    return `${object}`;
  }
  return Object.prototype.toString.call(object).match(/\s([a-z]+)/i)[1].toLowerCase();
};
var getUID = (prefix) => {
  do {
    prefix += Math.floor(Math.random() * MAX_UID);
  } while (document.getElementById(prefix));
  return prefix;
};
var getTransitionDurationFromElement = (element) => {
  if (!element) {
    return 0;
  }
  let {
    transitionDuration,
    transitionDelay
  } = window.getComputedStyle(element);
  const floatTransitionDuration = Number.parseFloat(transitionDuration);
  const floatTransitionDelay = Number.parseFloat(transitionDelay);
  if (!floatTransitionDuration && !floatTransitionDelay) {
    return 0;
  }
  transitionDuration = transitionDuration.split(",")[0];
  transitionDelay = transitionDelay.split(",")[0];
  return (Number.parseFloat(transitionDuration) + Number.parseFloat(transitionDelay)) * MILLISECONDS_MULTIPLIER;
};
var triggerTransitionEnd = (element) => {
  element.dispatchEvent(new Event(TRANSITION_END));
};
var isElement2 = (object) => {
  if (!object || typeof object !== "object") {
    return false;
  }
  if (typeof object.jquery !== "undefined") {
    object = object[0];
  }
  return typeof object.nodeType !== "undefined";
};
var getElement = (object) => {
  if (isElement2(object)) {
    return object.jquery ? object[0] : object;
  }
  if (typeof object === "string" && object.length > 0) {
    return document.querySelector(parseSelector(object));
  }
  return null;
};
var isVisible = (element) => {
  if (!isElement2(element) || element.getClientRects().length === 0) {
    return false;
  }
  const elementIsVisible = getComputedStyle(element).getPropertyValue("visibility") === "visible";
  const closedDetails = element.closest("details:not([open])");
  if (!closedDetails) {
    return elementIsVisible;
  }
  if (closedDetails !== element) {
    const summary = element.closest("summary");
    if (summary && summary.parentNode !== closedDetails) {
      return false;
    }
    if (summary === null) {
      return false;
    }
  }
  return elementIsVisible;
};
var isDisabled = (element) => {
  if (!element || element.nodeType !== Node.ELEMENT_NODE) {
    return true;
  }
  if (element.classList.contains("disabled")) {
    return true;
  }
  if (typeof element.disabled !== "undefined") {
    return element.disabled;
  }
  return element.hasAttribute("disabled") && element.getAttribute("disabled") !== "false";
};
var findShadowRoot = (element) => {
  if (!document.documentElement.attachShadow) {
    return null;
  }
  if (typeof element.getRootNode === "function") {
    const root = element.getRootNode();
    return root instanceof ShadowRoot ? root : null;
  }
  if (element instanceof ShadowRoot) {
    return element;
  }
  if (!element.parentNode) {
    return null;
  }
  return findShadowRoot(element.parentNode);
};
var noop = () => {
};
var reflow = (element) => {
  element.offsetHeight;
};
var getjQuery = () => {
  if (window.jQuery && !document.body.hasAttribute("data-bs-no-jquery")) {
    return window.jQuery;
  }
  return null;
};
var DOMContentLoadedCallbacks = [];
var onDOMContentLoaded = (callback) => {
  if (document.readyState === "loading") {
    if (!DOMContentLoadedCallbacks.length) {
      document.addEventListener("DOMContentLoaded", () => {
        for (const callback2 of DOMContentLoadedCallbacks) {
          callback2();
        }
      });
    }
    DOMContentLoadedCallbacks.push(callback);
  } else {
    callback();
  }
};
var isRTL = () => document.documentElement.dir === "rtl";
var defineJQueryPlugin = (plugin) => {
  onDOMContentLoaded(() => {
    const $7 = getjQuery();
    if ($7) {
      const name = plugin.NAME;
      const JQUERY_NO_CONFLICT = $7.fn[name];
      $7.fn[name] = plugin.jQueryInterface;
      $7.fn[name].Constructor = plugin;
      $7.fn[name].noConflict = () => {
        $7.fn[name] = JQUERY_NO_CONFLICT;
        return plugin.jQueryInterface;
      };
    }
  });
};
var execute = (possibleCallback, args = [], defaultValue = possibleCallback) => {
  return typeof possibleCallback === "function" ? possibleCallback.call(...args) : defaultValue;
};
var executeAfterTransition = (callback, transitionElement, waitForTransition = true) => {
  if (!waitForTransition) {
    execute(callback);
    return;
  }
  const durationPadding = 5;
  const emulatedDuration = getTransitionDurationFromElement(transitionElement) + durationPadding;
  let called = false;
  const handler = ({
    target
  }) => {
    if (target !== transitionElement) {
      return;
    }
    called = true;
    transitionElement.removeEventListener(TRANSITION_END, handler);
    execute(callback);
  };
  transitionElement.addEventListener(TRANSITION_END, handler);
  setTimeout(() => {
    if (!called) {
      triggerTransitionEnd(transitionElement);
    }
  }, emulatedDuration);
};
var getNextActiveElement = (list, activeElement, shouldGetNext, isCycleAllowed) => {
  const listLength = list.length;
  let index = list.indexOf(activeElement);
  if (index === -1) {
    return !shouldGetNext && isCycleAllowed ? list[listLength - 1] : list[0];
  }
  index += shouldGetNext ? 1 : -1;
  if (isCycleAllowed) {
    index = (index + listLength) % listLength;
  }
  return list[Math.max(0, Math.min(index, listLength - 1))];
};
var namespaceRegex = /[^.]*(?=\..*)\.|.*/;
var stripNameRegex = /\..*/;
var stripUidRegex = /::\d+$/;
var eventRegistry = {};
var uidEvent = 1;
var customEvents = {
  mouseenter: "mouseover",
  mouseleave: "mouseout"
};
var nativeEvents = /* @__PURE__ */ new Set(["click", "dblclick", "mouseup", "mousedown", "contextmenu", "mousewheel", "DOMMouseScroll", "mouseover", "mouseout", "mousemove", "selectstart", "selectend", "keydown", "keypress", "keyup", "orientationchange", "touchstart", "touchmove", "touchend", "touchcancel", "pointerdown", "pointermove", "pointerup", "pointerleave", "pointercancel", "gesturestart", "gesturechange", "gestureend", "focus", "blur", "change", "reset", "select", "submit", "focusin", "focusout", "load", "unload", "beforeunload", "resize", "move", "DOMContentLoaded", "readystatechange", "error", "abort", "scroll"]);
function makeEventUid(element, uid) {
  return uid && `${uid}::${uidEvent++}` || element.uidEvent || uidEvent++;
}
function getElementEvents(element) {
  const uid = makeEventUid(element);
  element.uidEvent = uid;
  eventRegistry[uid] = eventRegistry[uid] || {};
  return eventRegistry[uid];
}
function bootstrapHandler(element, fn2) {
  return function handler(event) {
    hydrateObj(event, {
      delegateTarget: element
    });
    if (handler.oneOff) {
      EventHandler.off(element, event.type, fn2);
    }
    return fn2.apply(element, [event]);
  };
}
function bootstrapDelegationHandler(element, selector, fn2) {
  return function handler(event) {
    const domElements = element.querySelectorAll(selector);
    for (let {
      target
    } = event; target && target !== this; target = target.parentNode) {
      for (const domElement of domElements) {
        if (domElement !== target) {
          continue;
        }
        hydrateObj(event, {
          delegateTarget: target
        });
        if (handler.oneOff) {
          EventHandler.off(element, event.type, selector, fn2);
        }
        return fn2.apply(target, [event]);
      }
    }
  };
}
function findHandler(events, callable, delegationSelector = null) {
  return Object.values(events).find((event) => event.callable === callable && event.delegationSelector === delegationSelector);
}
function normalizeParameters(originalTypeEvent, handler, delegationFunction) {
  const isDelegated = typeof handler === "string";
  const callable = isDelegated ? delegationFunction : handler || delegationFunction;
  let typeEvent = getTypeEvent(originalTypeEvent);
  if (!nativeEvents.has(typeEvent)) {
    typeEvent = originalTypeEvent;
  }
  return [isDelegated, callable, typeEvent];
}
function addHandler(element, originalTypeEvent, handler, delegationFunction, oneOff) {
  if (typeof originalTypeEvent !== "string" || !element) {
    return;
  }
  let [isDelegated, callable, typeEvent] = normalizeParameters(originalTypeEvent, handler, delegationFunction);
  if (originalTypeEvent in customEvents) {
    const wrapFunction = (fn3) => {
      return function(event) {
        if (!event.relatedTarget || event.relatedTarget !== event.delegateTarget && !event.delegateTarget.contains(event.relatedTarget)) {
          return fn3.call(this, event);
        }
      };
    };
    callable = wrapFunction(callable);
  }
  const events = getElementEvents(element);
  const handlers = events[typeEvent] || (events[typeEvent] = {});
  const previousFunction = findHandler(handlers, callable, isDelegated ? handler : null);
  if (previousFunction) {
    previousFunction.oneOff = previousFunction.oneOff && oneOff;
    return;
  }
  const uid = makeEventUid(callable, originalTypeEvent.replace(namespaceRegex, ""));
  const fn2 = isDelegated ? bootstrapDelegationHandler(element, handler, callable) : bootstrapHandler(element, callable);
  fn2.delegationSelector = isDelegated ? handler : null;
  fn2.callable = callable;
  fn2.oneOff = oneOff;
  fn2.uidEvent = uid;
  handlers[uid] = fn2;
  element.addEventListener(typeEvent, fn2, isDelegated);
}
function removeHandler(element, events, typeEvent, handler, delegationSelector) {
  const fn2 = findHandler(events[typeEvent], handler, delegationSelector);
  if (!fn2) {
    return;
  }
  element.removeEventListener(typeEvent, fn2, Boolean(delegationSelector));
  delete events[typeEvent][fn2.uidEvent];
}
function removeNamespacedHandlers(element, events, typeEvent, namespace) {
  const storeElementEvent = events[typeEvent] || {};
  for (const [handlerKey, event] of Object.entries(storeElementEvent)) {
    if (handlerKey.includes(namespace)) {
      removeHandler(element, events, typeEvent, event.callable, event.delegationSelector);
    }
  }
}
function getTypeEvent(event) {
  event = event.replace(stripNameRegex, "");
  return customEvents[event] || event;
}
var EventHandler = {
  on(element, event, handler, delegationFunction) {
    addHandler(element, event, handler, delegationFunction, false);
  },
  one(element, event, handler, delegationFunction) {
    addHandler(element, event, handler, delegationFunction, true);
  },
  off(element, originalTypeEvent, handler, delegationFunction) {
    if (typeof originalTypeEvent !== "string" || !element) {
      return;
    }
    const [isDelegated, callable, typeEvent] = normalizeParameters(originalTypeEvent, handler, delegationFunction);
    const inNamespace = typeEvent !== originalTypeEvent;
    const events = getElementEvents(element);
    const storeElementEvent = events[typeEvent] || {};
    const isNamespace = originalTypeEvent.startsWith(".");
    if (typeof callable !== "undefined") {
      if (!Object.keys(storeElementEvent).length) {
        return;
      }
      removeHandler(element, events, typeEvent, callable, isDelegated ? handler : null);
      return;
    }
    if (isNamespace) {
      for (const elementEvent of Object.keys(events)) {
        removeNamespacedHandlers(element, events, elementEvent, originalTypeEvent.slice(1));
      }
    }
    for (const [keyHandlers, event] of Object.entries(storeElementEvent)) {
      const handlerKey = keyHandlers.replace(stripUidRegex, "");
      if (!inNamespace || originalTypeEvent.includes(handlerKey)) {
        removeHandler(element, events, typeEvent, event.callable, event.delegationSelector);
      }
    }
  },
  trigger(element, event, args) {
    if (typeof event !== "string" || !element) {
      return null;
    }
    const $7 = getjQuery();
    const typeEvent = getTypeEvent(event);
    const inNamespace = event !== typeEvent;
    let jQueryEvent = null;
    let bubbles = true;
    let nativeDispatch = true;
    let defaultPrevented = false;
    if (inNamespace && $7) {
      jQueryEvent = $7.Event(event, args);
      $7(element).trigger(jQueryEvent);
      bubbles = !jQueryEvent.isPropagationStopped();
      nativeDispatch = !jQueryEvent.isImmediatePropagationStopped();
      defaultPrevented = jQueryEvent.isDefaultPrevented();
    }
    const evt = hydrateObj(new Event(event, {
      bubbles,
      cancelable: true
    }), args);
    if (defaultPrevented) {
      evt.preventDefault();
    }
    if (nativeDispatch) {
      element.dispatchEvent(evt);
    }
    if (evt.defaultPrevented && jQueryEvent) {
      jQueryEvent.preventDefault();
    }
    return evt;
  }
};
function hydrateObj(obj, meta = {}) {
  for (const [key, value] of Object.entries(meta)) {
    try {
      obj[key] = value;
    } catch (_unused) {
      Object.defineProperty(obj, key, {
        configurable: true,
        get() {
          return value;
        }
      });
    }
  }
  return obj;
}
function normalizeData(value) {
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  if (value === Number(value).toString()) {
    return Number(value);
  }
  if (value === "" || value === "null") {
    return null;
  }
  if (typeof value !== "string") {
    return value;
  }
  try {
    return JSON.parse(decodeURIComponent(value));
  } catch (_unused) {
    return value;
  }
}
function normalizeDataKey(key) {
  return key.replace(/[A-Z]/g, (chr) => `-${chr.toLowerCase()}`);
}
var Manipulator = {
  setDataAttribute(element, key, value) {
    element.setAttribute(`data-bs-${normalizeDataKey(key)}`, value);
  },
  removeDataAttribute(element, key) {
    element.removeAttribute(`data-bs-${normalizeDataKey(key)}`);
  },
  getDataAttributes(element) {
    if (!element) {
      return {};
    }
    const attributes = {};
    const bsKeys = Object.keys(element.dataset).filter((key) => key.startsWith("bs") && !key.startsWith("bsConfig"));
    for (const key of bsKeys) {
      let pureKey = key.replace(/^bs/, "");
      pureKey = pureKey.charAt(0).toLowerCase() + pureKey.slice(1);
      attributes[pureKey] = normalizeData(element.dataset[key]);
    }
    return attributes;
  },
  getDataAttribute(element, key) {
    return normalizeData(element.getAttribute(`data-bs-${normalizeDataKey(key)}`));
  }
};
var Config = class {
  // Getters
  static get Default() {
    return {};
  }
  static get DefaultType() {
    return {};
  }
  static get NAME() {
    throw new Error('You have to implement the static method "NAME", for each component!');
  }
  _getConfig(config) {
    config = this._mergeConfigObj(config);
    config = this._configAfterMerge(config);
    this._typeCheckConfig(config);
    return config;
  }
  _configAfterMerge(config) {
    return config;
  }
  _mergeConfigObj(config, element) {
    const jsonConfig = isElement2(element) ? Manipulator.getDataAttribute(element, "config") : {};
    return {
      ...this.constructor.Default,
      ...typeof jsonConfig === "object" ? jsonConfig : {},
      ...isElement2(element) ? Manipulator.getDataAttributes(element) : {},
      ...typeof config === "object" ? config : {}
    };
  }
  _typeCheckConfig(config, configTypes = this.constructor.DefaultType) {
    for (const [property, expectedTypes] of Object.entries(configTypes)) {
      const value = config[property];
      const valueType = isElement2(value) ? "element" : toType(value);
      if (!new RegExp(expectedTypes).test(valueType)) {
        throw new TypeError(`${this.constructor.NAME.toUpperCase()}: Option "${property}" provided type "${valueType}" but expected type "${expectedTypes}".`);
      }
    }
  }
};
var VERSION = "5.3.6";
var BaseComponent = class extends Config {
  constructor(element, config) {
    super();
    element = getElement(element);
    if (!element) {
      return;
    }
    this._element = element;
    this._config = this._getConfig(config);
    Data.set(this._element, this.constructor.DATA_KEY, this);
  }
  // Public
  dispose() {
    Data.remove(this._element, this.constructor.DATA_KEY);
    EventHandler.off(this._element, this.constructor.EVENT_KEY);
    for (const propertyName of Object.getOwnPropertyNames(this)) {
      this[propertyName] = null;
    }
  }
  // Private
  _queueCallback(callback, element, isAnimated = true) {
    executeAfterTransition(callback, element, isAnimated);
  }
  _getConfig(config) {
    config = this._mergeConfigObj(config, this._element);
    config = this._configAfterMerge(config);
    this._typeCheckConfig(config);
    return config;
  }
  // Static
  static getInstance(element) {
    return Data.get(getElement(element), this.DATA_KEY);
  }
  static getOrCreateInstance(element, config = {}) {
    return this.getInstance(element) || new this(element, typeof config === "object" ? config : null);
  }
  static get VERSION() {
    return VERSION;
  }
  static get DATA_KEY() {
    return `bs.${this.NAME}`;
  }
  static get EVENT_KEY() {
    return `.${this.DATA_KEY}`;
  }
  static eventName(name) {
    return `${name}${this.EVENT_KEY}`;
  }
};
var getSelector = (element) => {
  let selector = element.getAttribute("data-bs-target");
  if (!selector || selector === "#") {
    let hrefAttribute = element.getAttribute("href");
    if (!hrefAttribute || !hrefAttribute.includes("#") && !hrefAttribute.startsWith(".")) {
      return null;
    }
    if (hrefAttribute.includes("#") && !hrefAttribute.startsWith("#")) {
      hrefAttribute = `#${hrefAttribute.split("#")[1]}`;
    }
    selector = hrefAttribute && hrefAttribute !== "#" ? hrefAttribute.trim() : null;
  }
  return selector ? selector.split(",").map((sel) => parseSelector(sel)).join(",") : null;
};
var SelectorEngine = {
  find(selector, element = document.documentElement) {
    return [].concat(...Element.prototype.querySelectorAll.call(element, selector));
  },
  findOne(selector, element = document.documentElement) {
    return Element.prototype.querySelector.call(element, selector);
  },
  children(element, selector) {
    return [].concat(...element.children).filter((child) => child.matches(selector));
  },
  parents(element, selector) {
    const parents = [];
    let ancestor = element.parentNode.closest(selector);
    while (ancestor) {
      parents.push(ancestor);
      ancestor = ancestor.parentNode.closest(selector);
    }
    return parents;
  },
  prev(element, selector) {
    let previous = element.previousElementSibling;
    while (previous) {
      if (previous.matches(selector)) {
        return [previous];
      }
      previous = previous.previousElementSibling;
    }
    return [];
  },
  // TODO: this is now unused; remove later along with prev()
  next(element, selector) {
    let next = element.nextElementSibling;
    while (next) {
      if (next.matches(selector)) {
        return [next];
      }
      next = next.nextElementSibling;
    }
    return [];
  },
  focusableChildren(element) {
    const focusables = ["a", "button", "input", "textarea", "select", "details", "[tabindex]", '[contenteditable="true"]'].map((selector) => `${selector}:not([tabindex^="-"])`).join(",");
    return this.find(focusables, element).filter((el) => !isDisabled(el) && isVisible(el));
  },
  getSelectorFromElement(element) {
    const selector = getSelector(element);
    if (selector) {
      return SelectorEngine.findOne(selector) ? selector : null;
    }
    return null;
  },
  getElementFromSelector(element) {
    const selector = getSelector(element);
    return selector ? SelectorEngine.findOne(selector) : null;
  },
  getMultipleElementsFromSelector(element) {
    const selector = getSelector(element);
    return selector ? SelectorEngine.find(selector) : [];
  }
};
var enableDismissTrigger = (component, method = "hide") => {
  const clickEvent = `click.dismiss${component.EVENT_KEY}`;
  const name = component.NAME;
  EventHandler.on(document, clickEvent, `[data-bs-dismiss="${name}"]`, function(event) {
    if (["A", "AREA"].includes(this.tagName)) {
      event.preventDefault();
    }
    if (isDisabled(this)) {
      return;
    }
    const target = SelectorEngine.getElementFromSelector(this) || this.closest(`.${name}`);
    const instance = component.getOrCreateInstance(target);
    instance[method]();
  });
};
var NAME$f = "alert";
var DATA_KEY$a = "bs.alert";
var EVENT_KEY$b = `.${DATA_KEY$a}`;
var EVENT_CLOSE = `close${EVENT_KEY$b}`;
var EVENT_CLOSED = `closed${EVENT_KEY$b}`;
var CLASS_NAME_FADE$5 = "fade";
var CLASS_NAME_SHOW$8 = "show";
var Alert = class _Alert extends BaseComponent {
  // Getters
  static get NAME() {
    return NAME$f;
  }
  // Public
  close() {
    const closeEvent = EventHandler.trigger(this._element, EVENT_CLOSE);
    if (closeEvent.defaultPrevented) {
      return;
    }
    this._element.classList.remove(CLASS_NAME_SHOW$8);
    const isAnimated = this._element.classList.contains(CLASS_NAME_FADE$5);
    this._queueCallback(() => this._destroyElement(), this._element, isAnimated);
  }
  // Private
  _destroyElement() {
    this._element.remove();
    EventHandler.trigger(this._element, EVENT_CLOSED);
    this.dispose();
  }
  // Static
  static jQueryInterface(config) {
    return this.each(function() {
      const data = _Alert.getOrCreateInstance(this);
      if (typeof config !== "string") {
        return;
      }
      if (data[config] === void 0 || config.startsWith("_") || config === "constructor") {
        throw new TypeError(`No method named "${config}"`);
      }
      data[config](this);
    });
  }
};
enableDismissTrigger(Alert, "close");
defineJQueryPlugin(Alert);
var NAME$e = "button";
var DATA_KEY$9 = "bs.button";
var EVENT_KEY$a = `.${DATA_KEY$9}`;
var DATA_API_KEY$6 = ".data-api";
var CLASS_NAME_ACTIVE$3 = "active";
var SELECTOR_DATA_TOGGLE$5 = '[data-bs-toggle="button"]';
var EVENT_CLICK_DATA_API$6 = `click${EVENT_KEY$a}${DATA_API_KEY$6}`;
var Button = class _Button extends BaseComponent {
  // Getters
  static get NAME() {
    return NAME$e;
  }
  // Public
  toggle() {
    this._element.setAttribute("aria-pressed", this._element.classList.toggle(CLASS_NAME_ACTIVE$3));
  }
  // Static
  static jQueryInterface(config) {
    return this.each(function() {
      const data = _Button.getOrCreateInstance(this);
      if (config === "toggle") {
        data[config]();
      }
    });
  }
};
EventHandler.on(document, EVENT_CLICK_DATA_API$6, SELECTOR_DATA_TOGGLE$5, (event) => {
  event.preventDefault();
  const button = event.target.closest(SELECTOR_DATA_TOGGLE$5);
  const data = Button.getOrCreateInstance(button);
  data.toggle();
});
defineJQueryPlugin(Button);
var NAME$d = "swipe";
var EVENT_KEY$9 = ".bs.swipe";
var EVENT_TOUCHSTART = `touchstart${EVENT_KEY$9}`;
var EVENT_TOUCHMOVE = `touchmove${EVENT_KEY$9}`;
var EVENT_TOUCHEND = `touchend${EVENT_KEY$9}`;
var EVENT_POINTERDOWN = `pointerdown${EVENT_KEY$9}`;
var EVENT_POINTERUP = `pointerup${EVENT_KEY$9}`;
var POINTER_TYPE_TOUCH = "touch";
var POINTER_TYPE_PEN = "pen";
var CLASS_NAME_POINTER_EVENT = "pointer-event";
var SWIPE_THRESHOLD = 40;
var Default$c = {
  endCallback: null,
  leftCallback: null,
  rightCallback: null
};
var DefaultType$c = {
  endCallback: "(function|null)",
  leftCallback: "(function|null)",
  rightCallback: "(function|null)"
};
var Swipe = class _Swipe extends Config {
  constructor(element, config) {
    super();
    this._element = element;
    if (!element || !_Swipe.isSupported()) {
      return;
    }
    this._config = this._getConfig(config);
    this._deltaX = 0;
    this._supportPointerEvents = Boolean(window.PointerEvent);
    this._initEvents();
  }
  // Getters
  static get Default() {
    return Default$c;
  }
  static get DefaultType() {
    return DefaultType$c;
  }
  static get NAME() {
    return NAME$d;
  }
  // Public
  dispose() {
    EventHandler.off(this._element, EVENT_KEY$9);
  }
  // Private
  _start(event) {
    if (!this._supportPointerEvents) {
      this._deltaX = event.touches[0].clientX;
      return;
    }
    if (this._eventIsPointerPenTouch(event)) {
      this._deltaX = event.clientX;
    }
  }
  _end(event) {
    if (this._eventIsPointerPenTouch(event)) {
      this._deltaX = event.clientX - this._deltaX;
    }
    this._handleSwipe();
    execute(this._config.endCallback);
  }
  _move(event) {
    this._deltaX = event.touches && event.touches.length > 1 ? 0 : event.touches[0].clientX - this._deltaX;
  }
  _handleSwipe() {
    const absDeltaX = Math.abs(this._deltaX);
    if (absDeltaX <= SWIPE_THRESHOLD) {
      return;
    }
    const direction = absDeltaX / this._deltaX;
    this._deltaX = 0;
    if (!direction) {
      return;
    }
    execute(direction > 0 ? this._config.rightCallback : this._config.leftCallback);
  }
  _initEvents() {
    if (this._supportPointerEvents) {
      EventHandler.on(this._element, EVENT_POINTERDOWN, (event) => this._start(event));
      EventHandler.on(this._element, EVENT_POINTERUP, (event) => this._end(event));
      this._element.classList.add(CLASS_NAME_POINTER_EVENT);
    } else {
      EventHandler.on(this._element, EVENT_TOUCHSTART, (event) => this._start(event));
      EventHandler.on(this._element, EVENT_TOUCHMOVE, (event) => this._move(event));
      EventHandler.on(this._element, EVENT_TOUCHEND, (event) => this._end(event));
    }
  }
  _eventIsPointerPenTouch(event) {
    return this._supportPointerEvents && (event.pointerType === POINTER_TYPE_PEN || event.pointerType === POINTER_TYPE_TOUCH);
  }
  // Static
  static isSupported() {
    return "ontouchstart" in document.documentElement || navigator.maxTouchPoints > 0;
  }
};
var NAME$c = "carousel";
var DATA_KEY$8 = "bs.carousel";
var EVENT_KEY$8 = `.${DATA_KEY$8}`;
var DATA_API_KEY$5 = ".data-api";
var ARROW_LEFT_KEY$1 = "ArrowLeft";
var ARROW_RIGHT_KEY$1 = "ArrowRight";
var TOUCHEVENT_COMPAT_WAIT = 500;
var ORDER_NEXT = "next";
var ORDER_PREV = "prev";
var DIRECTION_LEFT = "left";
var DIRECTION_RIGHT = "right";
var EVENT_SLIDE = `slide${EVENT_KEY$8}`;
var EVENT_SLID = `slid${EVENT_KEY$8}`;
var EVENT_KEYDOWN$1 = `keydown${EVENT_KEY$8}`;
var EVENT_MOUSEENTER$1 = `mouseenter${EVENT_KEY$8}`;
var EVENT_MOUSELEAVE$1 = `mouseleave${EVENT_KEY$8}`;
var EVENT_DRAG_START = `dragstart${EVENT_KEY$8}`;
var EVENT_LOAD_DATA_API$3 = `load${EVENT_KEY$8}${DATA_API_KEY$5}`;
var EVENT_CLICK_DATA_API$5 = `click${EVENT_KEY$8}${DATA_API_KEY$5}`;
var CLASS_NAME_CAROUSEL = "carousel";
var CLASS_NAME_ACTIVE$2 = "active";
var CLASS_NAME_SLIDE = "slide";
var CLASS_NAME_END = "carousel-item-end";
var CLASS_NAME_START = "carousel-item-start";
var CLASS_NAME_NEXT = "carousel-item-next";
var CLASS_NAME_PREV = "carousel-item-prev";
var SELECTOR_ACTIVE = ".active";
var SELECTOR_ITEM = ".carousel-item";
var SELECTOR_ACTIVE_ITEM = SELECTOR_ACTIVE + SELECTOR_ITEM;
var SELECTOR_ITEM_IMG = ".carousel-item img";
var SELECTOR_INDICATORS = ".carousel-indicators";
var SELECTOR_DATA_SLIDE = "[data-bs-slide], [data-bs-slide-to]";
var SELECTOR_DATA_RIDE = '[data-bs-ride="carousel"]';
var KEY_TO_DIRECTION = {
  [ARROW_LEFT_KEY$1]: DIRECTION_RIGHT,
  [ARROW_RIGHT_KEY$1]: DIRECTION_LEFT
};
var Default$b = {
  interval: 5e3,
  keyboard: true,
  pause: "hover",
  ride: false,
  touch: true,
  wrap: true
};
var DefaultType$b = {
  interval: "(number|boolean)",
  // TODO:v6 remove boolean support
  keyboard: "boolean",
  pause: "(string|boolean)",
  ride: "(boolean|string)",
  touch: "boolean",
  wrap: "boolean"
};
var Carousel = class _Carousel extends BaseComponent {
  constructor(element, config) {
    super(element, config);
    this._interval = null;
    this._activeElement = null;
    this._isSliding = false;
    this.touchTimeout = null;
    this._swipeHelper = null;
    this._indicatorsElement = SelectorEngine.findOne(SELECTOR_INDICATORS, this._element);
    this._addEventListeners();
    if (this._config.ride === CLASS_NAME_CAROUSEL) {
      this.cycle();
    }
  }
  // Getters
  static get Default() {
    return Default$b;
  }
  static get DefaultType() {
    return DefaultType$b;
  }
  static get NAME() {
    return NAME$c;
  }
  // Public
  next() {
    this._slide(ORDER_NEXT);
  }
  nextWhenVisible() {
    if (!document.hidden && isVisible(this._element)) {
      this.next();
    }
  }
  prev() {
    this._slide(ORDER_PREV);
  }
  pause() {
    if (this._isSliding) {
      triggerTransitionEnd(this._element);
    }
    this._clearInterval();
  }
  cycle() {
    this._clearInterval();
    this._updateInterval();
    this._interval = setInterval(() => this.nextWhenVisible(), this._config.interval);
  }
  _maybeEnableCycle() {
    if (!this._config.ride) {
      return;
    }
    if (this._isSliding) {
      EventHandler.one(this._element, EVENT_SLID, () => this.cycle());
      return;
    }
    this.cycle();
  }
  to(index) {
    const items = this._getItems();
    if (index > items.length - 1 || index < 0) {
      return;
    }
    if (this._isSliding) {
      EventHandler.one(this._element, EVENT_SLID, () => this.to(index));
      return;
    }
    const activeIndex = this._getItemIndex(this._getActive());
    if (activeIndex === index) {
      return;
    }
    const order2 = index > activeIndex ? ORDER_NEXT : ORDER_PREV;
    this._slide(order2, items[index]);
  }
  dispose() {
    if (this._swipeHelper) {
      this._swipeHelper.dispose();
    }
    super.dispose();
  }
  // Private
  _configAfterMerge(config) {
    config.defaultInterval = config.interval;
    return config;
  }
  _addEventListeners() {
    if (this._config.keyboard) {
      EventHandler.on(this._element, EVENT_KEYDOWN$1, (event) => this._keydown(event));
    }
    if (this._config.pause === "hover") {
      EventHandler.on(this._element, EVENT_MOUSEENTER$1, () => this.pause());
      EventHandler.on(this._element, EVENT_MOUSELEAVE$1, () => this._maybeEnableCycle());
    }
    if (this._config.touch && Swipe.isSupported()) {
      this._addTouchEventListeners();
    }
  }
  _addTouchEventListeners() {
    for (const img of SelectorEngine.find(SELECTOR_ITEM_IMG, this._element)) {
      EventHandler.on(img, EVENT_DRAG_START, (event) => event.preventDefault());
    }
    const endCallBack = () => {
      if (this._config.pause !== "hover") {
        return;
      }
      this.pause();
      if (this.touchTimeout) {
        clearTimeout(this.touchTimeout);
      }
      this.touchTimeout = setTimeout(() => this._maybeEnableCycle(), TOUCHEVENT_COMPAT_WAIT + this._config.interval);
    };
    const swipeConfig = {
      leftCallback: () => this._slide(this._directionToOrder(DIRECTION_LEFT)),
      rightCallback: () => this._slide(this._directionToOrder(DIRECTION_RIGHT)),
      endCallback: endCallBack
    };
    this._swipeHelper = new Swipe(this._element, swipeConfig);
  }
  _keydown(event) {
    if (/input|textarea/i.test(event.target.tagName)) {
      return;
    }
    const direction = KEY_TO_DIRECTION[event.key];
    if (direction) {
      event.preventDefault();
      this._slide(this._directionToOrder(direction));
    }
  }
  _getItemIndex(element) {
    return this._getItems().indexOf(element);
  }
  _setActiveIndicatorElement(index) {
    if (!this._indicatorsElement) {
      return;
    }
    const activeIndicator = SelectorEngine.findOne(SELECTOR_ACTIVE, this._indicatorsElement);
    activeIndicator.classList.remove(CLASS_NAME_ACTIVE$2);
    activeIndicator.removeAttribute("aria-current");
    const newActiveIndicator = SelectorEngine.findOne(`[data-bs-slide-to="${index}"]`, this._indicatorsElement);
    if (newActiveIndicator) {
      newActiveIndicator.classList.add(CLASS_NAME_ACTIVE$2);
      newActiveIndicator.setAttribute("aria-current", "true");
    }
  }
  _updateInterval() {
    const element = this._activeElement || this._getActive();
    if (!element) {
      return;
    }
    const elementInterval = Number.parseInt(element.getAttribute("data-bs-interval"), 10);
    this._config.interval = elementInterval || this._config.defaultInterval;
  }
  _slide(order2, element = null) {
    if (this._isSliding) {
      return;
    }
    const activeElement = this._getActive();
    const isNext = order2 === ORDER_NEXT;
    const nextElement = element || getNextActiveElement(this._getItems(), activeElement, isNext, this._config.wrap);
    if (nextElement === activeElement) {
      return;
    }
    const nextElementIndex = this._getItemIndex(nextElement);
    const triggerEvent = (eventName) => {
      return EventHandler.trigger(this._element, eventName, {
        relatedTarget: nextElement,
        direction: this._orderToDirection(order2),
        from: this._getItemIndex(activeElement),
        to: nextElementIndex
      });
    };
    const slideEvent = triggerEvent(EVENT_SLIDE);
    if (slideEvent.defaultPrevented) {
      return;
    }
    if (!activeElement || !nextElement) {
      return;
    }
    const isCycling = Boolean(this._interval);
    this.pause();
    this._isSliding = true;
    this._setActiveIndicatorElement(nextElementIndex);
    this._activeElement = nextElement;
    const directionalClassName = isNext ? CLASS_NAME_START : CLASS_NAME_END;
    const orderClassName = isNext ? CLASS_NAME_NEXT : CLASS_NAME_PREV;
    nextElement.classList.add(orderClassName);
    reflow(nextElement);
    activeElement.classList.add(directionalClassName);
    nextElement.classList.add(directionalClassName);
    const completeCallBack = () => {
      nextElement.classList.remove(directionalClassName, orderClassName);
      nextElement.classList.add(CLASS_NAME_ACTIVE$2);
      activeElement.classList.remove(CLASS_NAME_ACTIVE$2, orderClassName, directionalClassName);
      this._isSliding = false;
      triggerEvent(EVENT_SLID);
    };
    this._queueCallback(completeCallBack, activeElement, this._isAnimated());
    if (isCycling) {
      this.cycle();
    }
  }
  _isAnimated() {
    return this._element.classList.contains(CLASS_NAME_SLIDE);
  }
  _getActive() {
    return SelectorEngine.findOne(SELECTOR_ACTIVE_ITEM, this._element);
  }
  _getItems() {
    return SelectorEngine.find(SELECTOR_ITEM, this._element);
  }
  _clearInterval() {
    if (this._interval) {
      clearInterval(this._interval);
      this._interval = null;
    }
  }
  _directionToOrder(direction) {
    if (isRTL()) {
      return direction === DIRECTION_LEFT ? ORDER_PREV : ORDER_NEXT;
    }
    return direction === DIRECTION_LEFT ? ORDER_NEXT : ORDER_PREV;
  }
  _orderToDirection(order2) {
    if (isRTL()) {
      return order2 === ORDER_PREV ? DIRECTION_LEFT : DIRECTION_RIGHT;
    }
    return order2 === ORDER_PREV ? DIRECTION_RIGHT : DIRECTION_LEFT;
  }
  // Static
  static jQueryInterface(config) {
    return this.each(function() {
      const data = _Carousel.getOrCreateInstance(this, config);
      if (typeof config === "number") {
        data.to(config);
        return;
      }
      if (typeof config === "string") {
        if (data[config] === void 0 || config.startsWith("_") || config === "constructor") {
          throw new TypeError(`No method named "${config}"`);
        }
        data[config]();
      }
    });
  }
};
EventHandler.on(document, EVENT_CLICK_DATA_API$5, SELECTOR_DATA_SLIDE, function(event) {
  const target = SelectorEngine.getElementFromSelector(this);
  if (!target || !target.classList.contains(CLASS_NAME_CAROUSEL)) {
    return;
  }
  event.preventDefault();
  const carousel = Carousel.getOrCreateInstance(target);
  const slideIndex = this.getAttribute("data-bs-slide-to");
  if (slideIndex) {
    carousel.to(slideIndex);
    carousel._maybeEnableCycle();
    return;
  }
  if (Manipulator.getDataAttribute(this, "slide") === "next") {
    carousel.next();
    carousel._maybeEnableCycle();
    return;
  }
  carousel.prev();
  carousel._maybeEnableCycle();
});
EventHandler.on(window, EVENT_LOAD_DATA_API$3, () => {
  const carousels = SelectorEngine.find(SELECTOR_DATA_RIDE);
  for (const carousel of carousels) {
    Carousel.getOrCreateInstance(carousel);
  }
});
defineJQueryPlugin(Carousel);
var NAME$b = "collapse";
var DATA_KEY$7 = "bs.collapse";
var EVENT_KEY$7 = `.${DATA_KEY$7}`;
var DATA_API_KEY$4 = ".data-api";
var EVENT_SHOW$6 = `show${EVENT_KEY$7}`;
var EVENT_SHOWN$6 = `shown${EVENT_KEY$7}`;
var EVENT_HIDE$6 = `hide${EVENT_KEY$7}`;
var EVENT_HIDDEN$6 = `hidden${EVENT_KEY$7}`;
var EVENT_CLICK_DATA_API$4 = `click${EVENT_KEY$7}${DATA_API_KEY$4}`;
var CLASS_NAME_SHOW$7 = "show";
var CLASS_NAME_COLLAPSE = "collapse";
var CLASS_NAME_COLLAPSING = "collapsing";
var CLASS_NAME_COLLAPSED = "collapsed";
var CLASS_NAME_DEEPER_CHILDREN = `:scope .${CLASS_NAME_COLLAPSE} .${CLASS_NAME_COLLAPSE}`;
var CLASS_NAME_HORIZONTAL = "collapse-horizontal";
var WIDTH = "width";
var HEIGHT = "height";
var SELECTOR_ACTIVES = ".collapse.show, .collapse.collapsing";
var SELECTOR_DATA_TOGGLE$4 = '[data-bs-toggle="collapse"]';
var Default$a = {
  parent: null,
  toggle: true
};
var DefaultType$a = {
  parent: "(null|element)",
  toggle: "boolean"
};
var Collapse = class _Collapse extends BaseComponent {
  constructor(element, config) {
    super(element, config);
    this._isTransitioning = false;
    this._triggerArray = [];
    const toggleList = SelectorEngine.find(SELECTOR_DATA_TOGGLE$4);
    for (const elem of toggleList) {
      const selector = SelectorEngine.getSelectorFromElement(elem);
      const filterElement = SelectorEngine.find(selector).filter((foundElement) => foundElement === this._element);
      if (selector !== null && filterElement.length) {
        this._triggerArray.push(elem);
      }
    }
    this._initializeChildren();
    if (!this._config.parent) {
      this._addAriaAndCollapsedClass(this._triggerArray, this._isShown());
    }
    if (this._config.toggle) {
      this.toggle();
    }
  }
  // Getters
  static get Default() {
    return Default$a;
  }
  static get DefaultType() {
    return DefaultType$a;
  }
  static get NAME() {
    return NAME$b;
  }
  // Public
  toggle() {
    if (this._isShown()) {
      this.hide();
    } else {
      this.show();
    }
  }
  show() {
    if (this._isTransitioning || this._isShown()) {
      return;
    }
    let activeChildren = [];
    if (this._config.parent) {
      activeChildren = this._getFirstLevelChildren(SELECTOR_ACTIVES).filter((element) => element !== this._element).map((element) => _Collapse.getOrCreateInstance(element, {
        toggle: false
      }));
    }
    if (activeChildren.length && activeChildren[0]._isTransitioning) {
      return;
    }
    const startEvent = EventHandler.trigger(this._element, EVENT_SHOW$6);
    if (startEvent.defaultPrevented) {
      return;
    }
    for (const activeInstance of activeChildren) {
      activeInstance.hide();
    }
    const dimension = this._getDimension();
    this._element.classList.remove(CLASS_NAME_COLLAPSE);
    this._element.classList.add(CLASS_NAME_COLLAPSING);
    this._element.style[dimension] = 0;
    this._addAriaAndCollapsedClass(this._triggerArray, true);
    this._isTransitioning = true;
    const complete = () => {
      this._isTransitioning = false;
      this._element.classList.remove(CLASS_NAME_COLLAPSING);
      this._element.classList.add(CLASS_NAME_COLLAPSE, CLASS_NAME_SHOW$7);
      this._element.style[dimension] = "";
      EventHandler.trigger(this._element, EVENT_SHOWN$6);
    };
    const capitalizedDimension = dimension[0].toUpperCase() + dimension.slice(1);
    const scrollSize = `scroll${capitalizedDimension}`;
    this._queueCallback(complete, this._element, true);
    this._element.style[dimension] = `${this._element[scrollSize]}px`;
  }
  hide() {
    if (this._isTransitioning || !this._isShown()) {
      return;
    }
    const startEvent = EventHandler.trigger(this._element, EVENT_HIDE$6);
    if (startEvent.defaultPrevented) {
      return;
    }
    const dimension = this._getDimension();
    this._element.style[dimension] = `${this._element.getBoundingClientRect()[dimension]}px`;
    reflow(this._element);
    this._element.classList.add(CLASS_NAME_COLLAPSING);
    this._element.classList.remove(CLASS_NAME_COLLAPSE, CLASS_NAME_SHOW$7);
    for (const trigger of this._triggerArray) {
      const element = SelectorEngine.getElementFromSelector(trigger);
      if (element && !this._isShown(element)) {
        this._addAriaAndCollapsedClass([trigger], false);
      }
    }
    this._isTransitioning = true;
    const complete = () => {
      this._isTransitioning = false;
      this._element.classList.remove(CLASS_NAME_COLLAPSING);
      this._element.classList.add(CLASS_NAME_COLLAPSE);
      EventHandler.trigger(this._element, EVENT_HIDDEN$6);
    };
    this._element.style[dimension] = "";
    this._queueCallback(complete, this._element, true);
  }
  // Private
  _isShown(element = this._element) {
    return element.classList.contains(CLASS_NAME_SHOW$7);
  }
  _configAfterMerge(config) {
    config.toggle = Boolean(config.toggle);
    config.parent = getElement(config.parent);
    return config;
  }
  _getDimension() {
    return this._element.classList.contains(CLASS_NAME_HORIZONTAL) ? WIDTH : HEIGHT;
  }
  _initializeChildren() {
    if (!this._config.parent) {
      return;
    }
    const children = this._getFirstLevelChildren(SELECTOR_DATA_TOGGLE$4);
    for (const element of children) {
      const selected = SelectorEngine.getElementFromSelector(element);
      if (selected) {
        this._addAriaAndCollapsedClass([element], this._isShown(selected));
      }
    }
  }
  _getFirstLevelChildren(selector) {
    const children = SelectorEngine.find(CLASS_NAME_DEEPER_CHILDREN, this._config.parent);
    return SelectorEngine.find(selector, this._config.parent).filter((element) => !children.includes(element));
  }
  _addAriaAndCollapsedClass(triggerArray, isOpen) {
    if (!triggerArray.length) {
      return;
    }
    for (const element of triggerArray) {
      element.classList.toggle(CLASS_NAME_COLLAPSED, !isOpen);
      element.setAttribute("aria-expanded", isOpen);
    }
  }
  // Static
  static jQueryInterface(config) {
    const _config = {};
    if (typeof config === "string" && /show|hide/.test(config)) {
      _config.toggle = false;
    }
    return this.each(function() {
      const data = _Collapse.getOrCreateInstance(this, _config);
      if (typeof config === "string") {
        if (typeof data[config] === "undefined") {
          throw new TypeError(`No method named "${config}"`);
        }
        data[config]();
      }
    });
  }
};
EventHandler.on(document, EVENT_CLICK_DATA_API$4, SELECTOR_DATA_TOGGLE$4, function(event) {
  if (event.target.tagName === "A" || event.delegateTarget && event.delegateTarget.tagName === "A") {
    event.preventDefault();
  }
  for (const element of SelectorEngine.getMultipleElementsFromSelector(this)) {
    Collapse.getOrCreateInstance(element, {
      toggle: false
    }).toggle();
  }
});
defineJQueryPlugin(Collapse);
var NAME$a = "dropdown";
var DATA_KEY$6 = "bs.dropdown";
var EVENT_KEY$6 = `.${DATA_KEY$6}`;
var DATA_API_KEY$3 = ".data-api";
var ESCAPE_KEY$2 = "Escape";
var TAB_KEY$1 = "Tab";
var ARROW_UP_KEY$1 = "ArrowUp";
var ARROW_DOWN_KEY$1 = "ArrowDown";
var RIGHT_MOUSE_BUTTON = 2;
var EVENT_HIDE$5 = `hide${EVENT_KEY$6}`;
var EVENT_HIDDEN$5 = `hidden${EVENT_KEY$6}`;
var EVENT_SHOW$5 = `show${EVENT_KEY$6}`;
var EVENT_SHOWN$5 = `shown${EVENT_KEY$6}`;
var EVENT_CLICK_DATA_API$3 = `click${EVENT_KEY$6}${DATA_API_KEY$3}`;
var EVENT_KEYDOWN_DATA_API = `keydown${EVENT_KEY$6}${DATA_API_KEY$3}`;
var EVENT_KEYUP_DATA_API = `keyup${EVENT_KEY$6}${DATA_API_KEY$3}`;
var CLASS_NAME_SHOW$6 = "show";
var CLASS_NAME_DROPUP = "dropup";
var CLASS_NAME_DROPEND = "dropend";
var CLASS_NAME_DROPSTART = "dropstart";
var CLASS_NAME_DROPUP_CENTER = "dropup-center";
var CLASS_NAME_DROPDOWN_CENTER = "dropdown-center";
var SELECTOR_DATA_TOGGLE$3 = '[data-bs-toggle="dropdown"]:not(.disabled):not(:disabled)';
var SELECTOR_DATA_TOGGLE_SHOWN = `${SELECTOR_DATA_TOGGLE$3}.${CLASS_NAME_SHOW$6}`;
var SELECTOR_MENU = ".dropdown-menu";
var SELECTOR_NAVBAR = ".navbar";
var SELECTOR_NAVBAR_NAV = ".navbar-nav";
var SELECTOR_VISIBLE_ITEMS = ".dropdown-menu .dropdown-item:not(.disabled):not(:disabled)";
var PLACEMENT_TOP = isRTL() ? "top-end" : "top-start";
var PLACEMENT_TOPEND = isRTL() ? "top-start" : "top-end";
var PLACEMENT_BOTTOM = isRTL() ? "bottom-end" : "bottom-start";
var PLACEMENT_BOTTOMEND = isRTL() ? "bottom-start" : "bottom-end";
var PLACEMENT_RIGHT = isRTL() ? "left-start" : "right-start";
var PLACEMENT_LEFT = isRTL() ? "right-start" : "left-start";
var PLACEMENT_TOPCENTER = "top";
var PLACEMENT_BOTTOMCENTER = "bottom";
var Default$9 = {
  autoClose: true,
  boundary: "clippingParents",
  display: "dynamic",
  offset: [0, 2],
  popperConfig: null,
  reference: "toggle"
};
var DefaultType$9 = {
  autoClose: "(boolean|string)",
  boundary: "(string|element)",
  display: "string",
  offset: "(array|string|function)",
  popperConfig: "(null|object|function)",
  reference: "(string|element|object)"
};
var Dropdown = class _Dropdown extends BaseComponent {
  constructor(element, config) {
    super(element, config);
    this._popper = null;
    this._parent = this._element.parentNode;
    this._menu = SelectorEngine.next(this._element, SELECTOR_MENU)[0] || SelectorEngine.prev(this._element, SELECTOR_MENU)[0] || SelectorEngine.findOne(SELECTOR_MENU, this._parent);
    this._inNavbar = this._detectNavbar();
  }
  // Getters
  static get Default() {
    return Default$9;
  }
  static get DefaultType() {
    return DefaultType$9;
  }
  static get NAME() {
    return NAME$a;
  }
  // Public
  toggle() {
    return this._isShown() ? this.hide() : this.show();
  }
  show() {
    if (isDisabled(this._element) || this._isShown()) {
      return;
    }
    const relatedTarget = {
      relatedTarget: this._element
    };
    const showEvent = EventHandler.trigger(this._element, EVENT_SHOW$5, relatedTarget);
    if (showEvent.defaultPrevented) {
      return;
    }
    this._createPopper();
    if ("ontouchstart" in document.documentElement && !this._parent.closest(SELECTOR_NAVBAR_NAV)) {
      for (const element of [].concat(...document.body.children)) {
        EventHandler.on(element, "mouseover", noop);
      }
    }
    this._element.focus();
    this._element.setAttribute("aria-expanded", true);
    this._menu.classList.add(CLASS_NAME_SHOW$6);
    this._element.classList.add(CLASS_NAME_SHOW$6);
    EventHandler.trigger(this._element, EVENT_SHOWN$5, relatedTarget);
  }
  hide() {
    if (isDisabled(this._element) || !this._isShown()) {
      return;
    }
    const relatedTarget = {
      relatedTarget: this._element
    };
    this._completeHide(relatedTarget);
  }
  dispose() {
    if (this._popper) {
      this._popper.destroy();
    }
    super.dispose();
  }
  update() {
    this._inNavbar = this._detectNavbar();
    if (this._popper) {
      this._popper.update();
    }
  }
  // Private
  _completeHide(relatedTarget) {
    const hideEvent = EventHandler.trigger(this._element, EVENT_HIDE$5, relatedTarget);
    if (hideEvent.defaultPrevented) {
      return;
    }
    if ("ontouchstart" in document.documentElement) {
      for (const element of [].concat(...document.body.children)) {
        EventHandler.off(element, "mouseover", noop);
      }
    }
    if (this._popper) {
      this._popper.destroy();
    }
    this._menu.classList.remove(CLASS_NAME_SHOW$6);
    this._element.classList.remove(CLASS_NAME_SHOW$6);
    this._element.setAttribute("aria-expanded", "false");
    Manipulator.removeDataAttribute(this._menu, "popper");
    EventHandler.trigger(this._element, EVENT_HIDDEN$5, relatedTarget);
    this._element.focus();
  }
  _getConfig(config) {
    config = super._getConfig(config);
    if (typeof config.reference === "object" && !isElement2(config.reference) && typeof config.reference.getBoundingClientRect !== "function") {
      throw new TypeError(`${NAME$a.toUpperCase()}: Option "reference" provided type "object" without a required "getBoundingClientRect" method.`);
    }
    return config;
  }
  _createPopper() {
    if (typeof lib_exports === "undefined") {
      throw new TypeError("Bootstrap's dropdowns require Popper (https://popper.js.org/docs/v2/)");
    }
    let referenceElement = this._element;
    if (this._config.reference === "parent") {
      referenceElement = this._parent;
    } else if (isElement2(this._config.reference)) {
      referenceElement = getElement(this._config.reference);
    } else if (typeof this._config.reference === "object") {
      referenceElement = this._config.reference;
    }
    const popperConfig = this._getPopperConfig();
    this._popper = createPopper3(referenceElement, this._menu, popperConfig);
  }
  _isShown() {
    return this._menu.classList.contains(CLASS_NAME_SHOW$6);
  }
  _getPlacement() {
    const parentDropdown = this._parent;
    if (parentDropdown.classList.contains(CLASS_NAME_DROPEND)) {
      return PLACEMENT_RIGHT;
    }
    if (parentDropdown.classList.contains(CLASS_NAME_DROPSTART)) {
      return PLACEMENT_LEFT;
    }
    if (parentDropdown.classList.contains(CLASS_NAME_DROPUP_CENTER)) {
      return PLACEMENT_TOPCENTER;
    }
    if (parentDropdown.classList.contains(CLASS_NAME_DROPDOWN_CENTER)) {
      return PLACEMENT_BOTTOMCENTER;
    }
    const isEnd = getComputedStyle(this._menu).getPropertyValue("--bs-position").trim() === "end";
    if (parentDropdown.classList.contains(CLASS_NAME_DROPUP)) {
      return isEnd ? PLACEMENT_TOPEND : PLACEMENT_TOP;
    }
    return isEnd ? PLACEMENT_BOTTOMEND : PLACEMENT_BOTTOM;
  }
  _detectNavbar() {
    return this._element.closest(SELECTOR_NAVBAR) !== null;
  }
  _getOffset() {
    const {
      offset: offset2
    } = this._config;
    if (typeof offset2 === "string") {
      return offset2.split(",").map((value) => Number.parseInt(value, 10));
    }
    if (typeof offset2 === "function") {
      return (popperData) => offset2(popperData, this._element);
    }
    return offset2;
  }
  _getPopperConfig() {
    const defaultBsPopperConfig = {
      placement: this._getPlacement(),
      modifiers: [{
        name: "preventOverflow",
        options: {
          boundary: this._config.boundary
        }
      }, {
        name: "offset",
        options: {
          offset: this._getOffset()
        }
      }]
    };
    if (this._inNavbar || this._config.display === "static") {
      Manipulator.setDataAttribute(this._menu, "popper", "static");
      defaultBsPopperConfig.modifiers = [{
        name: "applyStyles",
        enabled: false
      }];
    }
    return {
      ...defaultBsPopperConfig,
      ...execute(this._config.popperConfig, [void 0, defaultBsPopperConfig])
    };
  }
  _selectMenuItem({
    key,
    target
  }) {
    const items = SelectorEngine.find(SELECTOR_VISIBLE_ITEMS, this._menu).filter((element) => isVisible(element));
    if (!items.length) {
      return;
    }
    getNextActiveElement(items, target, key === ARROW_DOWN_KEY$1, !items.includes(target)).focus();
  }
  // Static
  static jQueryInterface(config) {
    return this.each(function() {
      const data = _Dropdown.getOrCreateInstance(this, config);
      if (typeof config !== "string") {
        return;
      }
      if (typeof data[config] === "undefined") {
        throw new TypeError(`No method named "${config}"`);
      }
      data[config]();
    });
  }
  static clearMenus(event) {
    if (event.button === RIGHT_MOUSE_BUTTON || event.type === "keyup" && event.key !== TAB_KEY$1) {
      return;
    }
    const openToggles = SelectorEngine.find(SELECTOR_DATA_TOGGLE_SHOWN);
    for (const toggle of openToggles) {
      const context = _Dropdown.getInstance(toggle);
      if (!context || context._config.autoClose === false) {
        continue;
      }
      const composedPath = event.composedPath();
      const isMenuTarget = composedPath.includes(context._menu);
      if (composedPath.includes(context._element) || context._config.autoClose === "inside" && !isMenuTarget || context._config.autoClose === "outside" && isMenuTarget) {
        continue;
      }
      if (context._menu.contains(event.target) && (event.type === "keyup" && event.key === TAB_KEY$1 || /input|select|option|textarea|form/i.test(event.target.tagName))) {
        continue;
      }
      const relatedTarget = {
        relatedTarget: context._element
      };
      if (event.type === "click") {
        relatedTarget.clickEvent = event;
      }
      context._completeHide(relatedTarget);
    }
  }
  static dataApiKeydownHandler(event) {
    const isInput = /input|textarea/i.test(event.target.tagName);
    const isEscapeEvent = event.key === ESCAPE_KEY$2;
    const isUpOrDownEvent = [ARROW_UP_KEY$1, ARROW_DOWN_KEY$1].includes(event.key);
    if (!isUpOrDownEvent && !isEscapeEvent) {
      return;
    }
    if (isInput && !isEscapeEvent) {
      return;
    }
    event.preventDefault();
    const getToggleButton = this.matches(SELECTOR_DATA_TOGGLE$3) ? this : SelectorEngine.prev(this, SELECTOR_DATA_TOGGLE$3)[0] || SelectorEngine.next(this, SELECTOR_DATA_TOGGLE$3)[0] || SelectorEngine.findOne(SELECTOR_DATA_TOGGLE$3, event.delegateTarget.parentNode);
    const instance = _Dropdown.getOrCreateInstance(getToggleButton);
    if (isUpOrDownEvent) {
      event.stopPropagation();
      instance.show();
      instance._selectMenuItem(event);
      return;
    }
    if (instance._isShown()) {
      event.stopPropagation();
      instance.hide();
      getToggleButton.focus();
    }
  }
};
EventHandler.on(document, EVENT_KEYDOWN_DATA_API, SELECTOR_DATA_TOGGLE$3, Dropdown.dataApiKeydownHandler);
EventHandler.on(document, EVENT_KEYDOWN_DATA_API, SELECTOR_MENU, Dropdown.dataApiKeydownHandler);
EventHandler.on(document, EVENT_CLICK_DATA_API$3, Dropdown.clearMenus);
EventHandler.on(document, EVENT_KEYUP_DATA_API, Dropdown.clearMenus);
EventHandler.on(document, EVENT_CLICK_DATA_API$3, SELECTOR_DATA_TOGGLE$3, function(event) {
  event.preventDefault();
  Dropdown.getOrCreateInstance(this).toggle();
});
defineJQueryPlugin(Dropdown);
var NAME$9 = "backdrop";
var CLASS_NAME_FADE$4 = "fade";
var CLASS_NAME_SHOW$5 = "show";
var EVENT_MOUSEDOWN = `mousedown.bs.${NAME$9}`;
var Default$8 = {
  className: "modal-backdrop",
  clickCallback: null,
  isAnimated: false,
  isVisible: true,
  // if false, we use the backdrop helper without adding any element to the dom
  rootElement: "body"
  // give the choice to place backdrop under different elements
};
var DefaultType$8 = {
  className: "string",
  clickCallback: "(function|null)",
  isAnimated: "boolean",
  isVisible: "boolean",
  rootElement: "(element|string)"
};
var Backdrop = class extends Config {
  constructor(config) {
    super();
    this._config = this._getConfig(config);
    this._isAppended = false;
    this._element = null;
  }
  // Getters
  static get Default() {
    return Default$8;
  }
  static get DefaultType() {
    return DefaultType$8;
  }
  static get NAME() {
    return NAME$9;
  }
  // Public
  show(callback) {
    if (!this._config.isVisible) {
      execute(callback);
      return;
    }
    this._append();
    const element = this._getElement();
    if (this._config.isAnimated) {
      reflow(element);
    }
    element.classList.add(CLASS_NAME_SHOW$5);
    this._emulateAnimation(() => {
      execute(callback);
    });
  }
  hide(callback) {
    if (!this._config.isVisible) {
      execute(callback);
      return;
    }
    this._getElement().classList.remove(CLASS_NAME_SHOW$5);
    this._emulateAnimation(() => {
      this.dispose();
      execute(callback);
    });
  }
  dispose() {
    if (!this._isAppended) {
      return;
    }
    EventHandler.off(this._element, EVENT_MOUSEDOWN);
    this._element.remove();
    this._isAppended = false;
  }
  // Private
  _getElement() {
    if (!this._element) {
      const backdrop = document.createElement("div");
      backdrop.className = this._config.className;
      if (this._config.isAnimated) {
        backdrop.classList.add(CLASS_NAME_FADE$4);
      }
      this._element = backdrop;
    }
    return this._element;
  }
  _configAfterMerge(config) {
    config.rootElement = getElement(config.rootElement);
    return config;
  }
  _append() {
    if (this._isAppended) {
      return;
    }
    const element = this._getElement();
    this._config.rootElement.append(element);
    EventHandler.on(element, EVENT_MOUSEDOWN, () => {
      execute(this._config.clickCallback);
    });
    this._isAppended = true;
  }
  _emulateAnimation(callback) {
    executeAfterTransition(callback, this._getElement(), this._config.isAnimated);
  }
};
var NAME$8 = "focustrap";
var DATA_KEY$5 = "bs.focustrap";
var EVENT_KEY$5 = `.${DATA_KEY$5}`;
var EVENT_FOCUSIN$2 = `focusin${EVENT_KEY$5}`;
var EVENT_KEYDOWN_TAB = `keydown.tab${EVENT_KEY$5}`;
var TAB_KEY = "Tab";
var TAB_NAV_FORWARD = "forward";
var TAB_NAV_BACKWARD = "backward";
var Default$7 = {
  autofocus: true,
  trapElement: null
  // The element to trap focus inside of
};
var DefaultType$7 = {
  autofocus: "boolean",
  trapElement: "element"
};
var FocusTrap = class extends Config {
  constructor(config) {
    super();
    this._config = this._getConfig(config);
    this._isActive = false;
    this._lastTabNavDirection = null;
  }
  // Getters
  static get Default() {
    return Default$7;
  }
  static get DefaultType() {
    return DefaultType$7;
  }
  static get NAME() {
    return NAME$8;
  }
  // Public
  activate() {
    if (this._isActive) {
      return;
    }
    if (this._config.autofocus) {
      this._config.trapElement.focus();
    }
    EventHandler.off(document, EVENT_KEY$5);
    EventHandler.on(document, EVENT_FOCUSIN$2, (event) => this._handleFocusin(event));
    EventHandler.on(document, EVENT_KEYDOWN_TAB, (event) => this._handleKeydown(event));
    this._isActive = true;
  }
  deactivate() {
    if (!this._isActive) {
      return;
    }
    this._isActive = false;
    EventHandler.off(document, EVENT_KEY$5);
  }
  // Private
  _handleFocusin(event) {
    const {
      trapElement
    } = this._config;
    if (event.target === document || event.target === trapElement || trapElement.contains(event.target)) {
      return;
    }
    const elements = SelectorEngine.focusableChildren(trapElement);
    if (elements.length === 0) {
      trapElement.focus();
    } else if (this._lastTabNavDirection === TAB_NAV_BACKWARD) {
      elements[elements.length - 1].focus();
    } else {
      elements[0].focus();
    }
  }
  _handleKeydown(event) {
    if (event.key !== TAB_KEY) {
      return;
    }
    this._lastTabNavDirection = event.shiftKey ? TAB_NAV_BACKWARD : TAB_NAV_FORWARD;
  }
};
var SELECTOR_FIXED_CONTENT = ".fixed-top, .fixed-bottom, .is-fixed, .sticky-top";
var SELECTOR_STICKY_CONTENT = ".sticky-top";
var PROPERTY_PADDING = "padding-right";
var PROPERTY_MARGIN = "margin-right";
var ScrollBarHelper = class {
  constructor() {
    this._element = document.body;
  }
  // Public
  getWidth() {
    const documentWidth = document.documentElement.clientWidth;
    return Math.abs(window.innerWidth - documentWidth);
  }
  hide() {
    const width = this.getWidth();
    this._disableOverFlow();
    this._setElementAttributes(this._element, PROPERTY_PADDING, (calculatedValue) => calculatedValue + width);
    this._setElementAttributes(SELECTOR_FIXED_CONTENT, PROPERTY_PADDING, (calculatedValue) => calculatedValue + width);
    this._setElementAttributes(SELECTOR_STICKY_CONTENT, PROPERTY_MARGIN, (calculatedValue) => calculatedValue - width);
  }
  reset() {
    this._resetElementAttributes(this._element, "overflow");
    this._resetElementAttributes(this._element, PROPERTY_PADDING);
    this._resetElementAttributes(SELECTOR_FIXED_CONTENT, PROPERTY_PADDING);
    this._resetElementAttributes(SELECTOR_STICKY_CONTENT, PROPERTY_MARGIN);
  }
  isOverflowing() {
    return this.getWidth() > 0;
  }
  // Private
  _disableOverFlow() {
    this._saveInitialAttribute(this._element, "overflow");
    this._element.style.overflow = "hidden";
  }
  _setElementAttributes(selector, styleProperty, callback) {
    const scrollbarWidth = this.getWidth();
    const manipulationCallBack = (element) => {
      if (element !== this._element && window.innerWidth > element.clientWidth + scrollbarWidth) {
        return;
      }
      this._saveInitialAttribute(element, styleProperty);
      const calculatedValue = window.getComputedStyle(element).getPropertyValue(styleProperty);
      element.style.setProperty(styleProperty, `${callback(Number.parseFloat(calculatedValue))}px`);
    };
    this._applyManipulationCallback(selector, manipulationCallBack);
  }
  _saveInitialAttribute(element, styleProperty) {
    const actualValue = element.style.getPropertyValue(styleProperty);
    if (actualValue) {
      Manipulator.setDataAttribute(element, styleProperty, actualValue);
    }
  }
  _resetElementAttributes(selector, styleProperty) {
    const manipulationCallBack = (element) => {
      const value = Manipulator.getDataAttribute(element, styleProperty);
      if (value === null) {
        element.style.removeProperty(styleProperty);
        return;
      }
      Manipulator.removeDataAttribute(element, styleProperty);
      element.style.setProperty(styleProperty, value);
    };
    this._applyManipulationCallback(selector, manipulationCallBack);
  }
  _applyManipulationCallback(selector, callBack) {
    if (isElement2(selector)) {
      callBack(selector);
      return;
    }
    for (const sel of SelectorEngine.find(selector, this._element)) {
      callBack(sel);
    }
  }
};
var NAME$7 = "modal";
var DATA_KEY$4 = "bs.modal";
var EVENT_KEY$4 = `.${DATA_KEY$4}`;
var DATA_API_KEY$2 = ".data-api";
var ESCAPE_KEY$1 = "Escape";
var EVENT_HIDE$4 = `hide${EVENT_KEY$4}`;
var EVENT_HIDE_PREVENTED$1 = `hidePrevented${EVENT_KEY$4}`;
var EVENT_HIDDEN$4 = `hidden${EVENT_KEY$4}`;
var EVENT_SHOW$4 = `show${EVENT_KEY$4}`;
var EVENT_SHOWN$4 = `shown${EVENT_KEY$4}`;
var EVENT_RESIZE$1 = `resize${EVENT_KEY$4}`;
var EVENT_CLICK_DISMISS = `click.dismiss${EVENT_KEY$4}`;
var EVENT_MOUSEDOWN_DISMISS = `mousedown.dismiss${EVENT_KEY$4}`;
var EVENT_KEYDOWN_DISMISS$1 = `keydown.dismiss${EVENT_KEY$4}`;
var EVENT_CLICK_DATA_API$2 = `click${EVENT_KEY$4}${DATA_API_KEY$2}`;
var CLASS_NAME_OPEN = "modal-open";
var CLASS_NAME_FADE$3 = "fade";
var CLASS_NAME_SHOW$4 = "show";
var CLASS_NAME_STATIC = "modal-static";
var OPEN_SELECTOR$1 = ".modal.show";
var SELECTOR_DIALOG = ".modal-dialog";
var SELECTOR_MODAL_BODY = ".modal-body";
var SELECTOR_DATA_TOGGLE$2 = '[data-bs-toggle="modal"]';
var Default$6 = {
  backdrop: true,
  focus: true,
  keyboard: true
};
var DefaultType$6 = {
  backdrop: "(boolean|string)",
  focus: "boolean",
  keyboard: "boolean"
};
var Modal = class _Modal extends BaseComponent {
  constructor(element, config) {
    super(element, config);
    this._dialog = SelectorEngine.findOne(SELECTOR_DIALOG, this._element);
    this._backdrop = this._initializeBackDrop();
    this._focustrap = this._initializeFocusTrap();
    this._isShown = false;
    this._isTransitioning = false;
    this._scrollBar = new ScrollBarHelper();
    this._addEventListeners();
  }
  // Getters
  static get Default() {
    return Default$6;
  }
  static get DefaultType() {
    return DefaultType$6;
  }
  static get NAME() {
    return NAME$7;
  }
  // Public
  toggle(relatedTarget) {
    return this._isShown ? this.hide() : this.show(relatedTarget);
  }
  show(relatedTarget) {
    if (this._isShown || this._isTransitioning) {
      return;
    }
    const showEvent = EventHandler.trigger(this._element, EVENT_SHOW$4, {
      relatedTarget
    });
    if (showEvent.defaultPrevented) {
      return;
    }
    this._isShown = true;
    this._isTransitioning = true;
    this._scrollBar.hide();
    document.body.classList.add(CLASS_NAME_OPEN);
    this._adjustDialog();
    this._backdrop.show(() => this._showElement(relatedTarget));
  }
  hide() {
    if (!this._isShown || this._isTransitioning) {
      return;
    }
    const hideEvent = EventHandler.trigger(this._element, EVENT_HIDE$4);
    if (hideEvent.defaultPrevented) {
      return;
    }
    this._isShown = false;
    this._isTransitioning = true;
    this._focustrap.deactivate();
    this._element.classList.remove(CLASS_NAME_SHOW$4);
    this._queueCallback(() => this._hideModal(), this._element, this._isAnimated());
  }
  dispose() {
    EventHandler.off(window, EVENT_KEY$4);
    EventHandler.off(this._dialog, EVENT_KEY$4);
    this._backdrop.dispose();
    this._focustrap.deactivate();
    super.dispose();
  }
  handleUpdate() {
    this._adjustDialog();
  }
  // Private
  _initializeBackDrop() {
    return new Backdrop({
      isVisible: Boolean(this._config.backdrop),
      // 'static' option will be translated to true, and booleans will keep their value,
      isAnimated: this._isAnimated()
    });
  }
  _initializeFocusTrap() {
    return new FocusTrap({
      trapElement: this._element
    });
  }
  _showElement(relatedTarget) {
    if (!document.body.contains(this._element)) {
      document.body.append(this._element);
    }
    this._element.style.display = "block";
    this._element.removeAttribute("aria-hidden");
    this._element.setAttribute("aria-modal", true);
    this._element.setAttribute("role", "dialog");
    this._element.scrollTop = 0;
    const modalBody = SelectorEngine.findOne(SELECTOR_MODAL_BODY, this._dialog);
    if (modalBody) {
      modalBody.scrollTop = 0;
    }
    reflow(this._element);
    this._element.classList.add(CLASS_NAME_SHOW$4);
    const transitionComplete = () => {
      if (this._config.focus) {
        this._focustrap.activate();
      }
      this._isTransitioning = false;
      EventHandler.trigger(this._element, EVENT_SHOWN$4, {
        relatedTarget
      });
    };
    this._queueCallback(transitionComplete, this._dialog, this._isAnimated());
  }
  _addEventListeners() {
    EventHandler.on(this._element, EVENT_KEYDOWN_DISMISS$1, (event) => {
      if (event.key !== ESCAPE_KEY$1) {
        return;
      }
      if (this._config.keyboard) {
        this.hide();
        return;
      }
      this._triggerBackdropTransition();
    });
    EventHandler.on(window, EVENT_RESIZE$1, () => {
      if (this._isShown && !this._isTransitioning) {
        this._adjustDialog();
      }
    });
    EventHandler.on(this._element, EVENT_MOUSEDOWN_DISMISS, (event) => {
      EventHandler.one(this._element, EVENT_CLICK_DISMISS, (event2) => {
        if (this._element !== event.target || this._element !== event2.target) {
          return;
        }
        if (this._config.backdrop === "static") {
          this._triggerBackdropTransition();
          return;
        }
        if (this._config.backdrop) {
          this.hide();
        }
      });
    });
  }
  _hideModal() {
    this._element.style.display = "none";
    this._element.setAttribute("aria-hidden", true);
    this._element.removeAttribute("aria-modal");
    this._element.removeAttribute("role");
    this._isTransitioning = false;
    this._backdrop.hide(() => {
      document.body.classList.remove(CLASS_NAME_OPEN);
      this._resetAdjustments();
      this._scrollBar.reset();
      EventHandler.trigger(this._element, EVENT_HIDDEN$4);
    });
  }
  _isAnimated() {
    return this._element.classList.contains(CLASS_NAME_FADE$3);
  }
  _triggerBackdropTransition() {
    const hideEvent = EventHandler.trigger(this._element, EVENT_HIDE_PREVENTED$1);
    if (hideEvent.defaultPrevented) {
      return;
    }
    const isModalOverflowing = this._element.scrollHeight > document.documentElement.clientHeight;
    const initialOverflowY = this._element.style.overflowY;
    if (initialOverflowY === "hidden" || this._element.classList.contains(CLASS_NAME_STATIC)) {
      return;
    }
    if (!isModalOverflowing) {
      this._element.style.overflowY = "hidden";
    }
    this._element.classList.add(CLASS_NAME_STATIC);
    this._queueCallback(() => {
      this._element.classList.remove(CLASS_NAME_STATIC);
      this._queueCallback(() => {
        this._element.style.overflowY = initialOverflowY;
      }, this._dialog);
    }, this._dialog);
    this._element.focus();
  }
  /**
   * The following methods are used to handle overflowing modals
   */
  _adjustDialog() {
    const isModalOverflowing = this._element.scrollHeight > document.documentElement.clientHeight;
    const scrollbarWidth = this._scrollBar.getWidth();
    const isBodyOverflowing = scrollbarWidth > 0;
    if (isBodyOverflowing && !isModalOverflowing) {
      const property = isRTL() ? "paddingLeft" : "paddingRight";
      this._element.style[property] = `${scrollbarWidth}px`;
    }
    if (!isBodyOverflowing && isModalOverflowing) {
      const property = isRTL() ? "paddingRight" : "paddingLeft";
      this._element.style[property] = `${scrollbarWidth}px`;
    }
  }
  _resetAdjustments() {
    this._element.style.paddingLeft = "";
    this._element.style.paddingRight = "";
  }
  // Static
  static jQueryInterface(config, relatedTarget) {
    return this.each(function() {
      const data = _Modal.getOrCreateInstance(this, config);
      if (typeof config !== "string") {
        return;
      }
      if (typeof data[config] === "undefined") {
        throw new TypeError(`No method named "${config}"`);
      }
      data[config](relatedTarget);
    });
  }
};
EventHandler.on(document, EVENT_CLICK_DATA_API$2, SELECTOR_DATA_TOGGLE$2, function(event) {
  const target = SelectorEngine.getElementFromSelector(this);
  if (["A", "AREA"].includes(this.tagName)) {
    event.preventDefault();
  }
  EventHandler.one(target, EVENT_SHOW$4, (showEvent) => {
    if (showEvent.defaultPrevented) {
      return;
    }
    EventHandler.one(target, EVENT_HIDDEN$4, () => {
      if (isVisible(this)) {
        this.focus();
      }
    });
  });
  const alreadyOpen = SelectorEngine.findOne(OPEN_SELECTOR$1);
  if (alreadyOpen) {
    Modal.getInstance(alreadyOpen).hide();
  }
  const data = Modal.getOrCreateInstance(target);
  data.toggle(this);
});
enableDismissTrigger(Modal);
defineJQueryPlugin(Modal);
var NAME$6 = "offcanvas";
var DATA_KEY$3 = "bs.offcanvas";
var EVENT_KEY$3 = `.${DATA_KEY$3}`;
var DATA_API_KEY$1 = ".data-api";
var EVENT_LOAD_DATA_API$2 = `load${EVENT_KEY$3}${DATA_API_KEY$1}`;
var ESCAPE_KEY = "Escape";
var CLASS_NAME_SHOW$3 = "show";
var CLASS_NAME_SHOWING$1 = "showing";
var CLASS_NAME_HIDING = "hiding";
var CLASS_NAME_BACKDROP = "offcanvas-backdrop";
var OPEN_SELECTOR = ".offcanvas.show";
var EVENT_SHOW$3 = `show${EVENT_KEY$3}`;
var EVENT_SHOWN$3 = `shown${EVENT_KEY$3}`;
var EVENT_HIDE$3 = `hide${EVENT_KEY$3}`;
var EVENT_HIDE_PREVENTED = `hidePrevented${EVENT_KEY$3}`;
var EVENT_HIDDEN$3 = `hidden${EVENT_KEY$3}`;
var EVENT_RESIZE = `resize${EVENT_KEY$3}`;
var EVENT_CLICK_DATA_API$1 = `click${EVENT_KEY$3}${DATA_API_KEY$1}`;
var EVENT_KEYDOWN_DISMISS = `keydown.dismiss${EVENT_KEY$3}`;
var SELECTOR_DATA_TOGGLE$1 = '[data-bs-toggle="offcanvas"]';
var Default$5 = {
  backdrop: true,
  keyboard: true,
  scroll: false
};
var DefaultType$5 = {
  backdrop: "(boolean|string)",
  keyboard: "boolean",
  scroll: "boolean"
};
var Offcanvas = class _Offcanvas extends BaseComponent {
  constructor(element, config) {
    super(element, config);
    this._isShown = false;
    this._backdrop = this._initializeBackDrop();
    this._focustrap = this._initializeFocusTrap();
    this._addEventListeners();
  }
  // Getters
  static get Default() {
    return Default$5;
  }
  static get DefaultType() {
    return DefaultType$5;
  }
  static get NAME() {
    return NAME$6;
  }
  // Public
  toggle(relatedTarget) {
    return this._isShown ? this.hide() : this.show(relatedTarget);
  }
  show(relatedTarget) {
    if (this._isShown) {
      return;
    }
    const showEvent = EventHandler.trigger(this._element, EVENT_SHOW$3, {
      relatedTarget
    });
    if (showEvent.defaultPrevented) {
      return;
    }
    this._isShown = true;
    this._backdrop.show();
    if (!this._config.scroll) {
      new ScrollBarHelper().hide();
    }
    this._element.setAttribute("aria-modal", true);
    this._element.setAttribute("role", "dialog");
    this._element.classList.add(CLASS_NAME_SHOWING$1);
    const completeCallBack = () => {
      if (!this._config.scroll || this._config.backdrop) {
        this._focustrap.activate();
      }
      this._element.classList.add(CLASS_NAME_SHOW$3);
      this._element.classList.remove(CLASS_NAME_SHOWING$1);
      EventHandler.trigger(this._element, EVENT_SHOWN$3, {
        relatedTarget
      });
    };
    this._queueCallback(completeCallBack, this._element, true);
  }
  hide() {
    if (!this._isShown) {
      return;
    }
    const hideEvent = EventHandler.trigger(this._element, EVENT_HIDE$3);
    if (hideEvent.defaultPrevented) {
      return;
    }
    this._focustrap.deactivate();
    this._element.blur();
    this._isShown = false;
    this._element.classList.add(CLASS_NAME_HIDING);
    this._backdrop.hide();
    const completeCallback = () => {
      this._element.classList.remove(CLASS_NAME_SHOW$3, CLASS_NAME_HIDING);
      this._element.removeAttribute("aria-modal");
      this._element.removeAttribute("role");
      if (!this._config.scroll) {
        new ScrollBarHelper().reset();
      }
      EventHandler.trigger(this._element, EVENT_HIDDEN$3);
    };
    this._queueCallback(completeCallback, this._element, true);
  }
  dispose() {
    this._backdrop.dispose();
    this._focustrap.deactivate();
    super.dispose();
  }
  // Private
  _initializeBackDrop() {
    const clickCallback = () => {
      if (this._config.backdrop === "static") {
        EventHandler.trigger(this._element, EVENT_HIDE_PREVENTED);
        return;
      }
      this.hide();
    };
    const isVisible2 = Boolean(this._config.backdrop);
    return new Backdrop({
      className: CLASS_NAME_BACKDROP,
      isVisible: isVisible2,
      isAnimated: true,
      rootElement: this._element.parentNode,
      clickCallback: isVisible2 ? clickCallback : null
    });
  }
  _initializeFocusTrap() {
    return new FocusTrap({
      trapElement: this._element
    });
  }
  _addEventListeners() {
    EventHandler.on(this._element, EVENT_KEYDOWN_DISMISS, (event) => {
      if (event.key !== ESCAPE_KEY) {
        return;
      }
      if (this._config.keyboard) {
        this.hide();
        return;
      }
      EventHandler.trigger(this._element, EVENT_HIDE_PREVENTED);
    });
  }
  // Static
  static jQueryInterface(config) {
    return this.each(function() {
      const data = _Offcanvas.getOrCreateInstance(this, config);
      if (typeof config !== "string") {
        return;
      }
      if (data[config] === void 0 || config.startsWith("_") || config === "constructor") {
        throw new TypeError(`No method named "${config}"`);
      }
      data[config](this);
    });
  }
};
EventHandler.on(document, EVENT_CLICK_DATA_API$1, SELECTOR_DATA_TOGGLE$1, function(event) {
  const target = SelectorEngine.getElementFromSelector(this);
  if (["A", "AREA"].includes(this.tagName)) {
    event.preventDefault();
  }
  if (isDisabled(this)) {
    return;
  }
  EventHandler.one(target, EVENT_HIDDEN$3, () => {
    if (isVisible(this)) {
      this.focus();
    }
  });
  const alreadyOpen = SelectorEngine.findOne(OPEN_SELECTOR);
  if (alreadyOpen && alreadyOpen !== target) {
    Offcanvas.getInstance(alreadyOpen).hide();
  }
  const data = Offcanvas.getOrCreateInstance(target);
  data.toggle(this);
});
EventHandler.on(window, EVENT_LOAD_DATA_API$2, () => {
  for (const selector of SelectorEngine.find(OPEN_SELECTOR)) {
    Offcanvas.getOrCreateInstance(selector).show();
  }
});
EventHandler.on(window, EVENT_RESIZE, () => {
  for (const element of SelectorEngine.find("[aria-modal][class*=show][class*=offcanvas-]")) {
    if (getComputedStyle(element).position !== "fixed") {
      Offcanvas.getOrCreateInstance(element).hide();
    }
  }
});
enableDismissTrigger(Offcanvas);
defineJQueryPlugin(Offcanvas);
var ARIA_ATTRIBUTE_PATTERN = /^aria-[\w-]*$/i;
var DefaultAllowlist = {
  // Global attributes allowed on any supplied element below.
  "*": ["class", "dir", "id", "lang", "role", ARIA_ATTRIBUTE_PATTERN],
  a: ["target", "href", "title", "rel"],
  area: [],
  b: [],
  br: [],
  col: [],
  code: [],
  dd: [],
  div: [],
  dl: [],
  dt: [],
  em: [],
  hr: [],
  h1: [],
  h2: [],
  h3: [],
  h4: [],
  h5: [],
  h6: [],
  i: [],
  img: ["src", "srcset", "alt", "title", "width", "height"],
  li: [],
  ol: [],
  p: [],
  pre: [],
  s: [],
  small: [],
  span: [],
  sub: [],
  sup: [],
  strong: [],
  u: [],
  ul: []
};
var uriAttributes = /* @__PURE__ */ new Set(["background", "cite", "href", "itemtype", "longdesc", "poster", "src", "xlink:href"]);
var SAFE_URL_PATTERN = /^(?!javascript:)(?:[a-z0-9+.-]+:|[^&:/?#]*(?:[/?#]|$))/i;
var allowedAttribute = (attribute, allowedAttributeList) => {
  const attributeName = attribute.nodeName.toLowerCase();
  if (allowedAttributeList.includes(attributeName)) {
    if (uriAttributes.has(attributeName)) {
      return Boolean(SAFE_URL_PATTERN.test(attribute.nodeValue));
    }
    return true;
  }
  return allowedAttributeList.filter((attributeRegex) => attributeRegex instanceof RegExp).some((regex) => regex.test(attributeName));
};
function sanitizeHtml(unsafeHtml, allowList, sanitizeFunction) {
  if (!unsafeHtml.length) {
    return unsafeHtml;
  }
  if (sanitizeFunction && typeof sanitizeFunction === "function") {
    return sanitizeFunction(unsafeHtml);
  }
  const domParser = new window.DOMParser();
  const createdDocument = domParser.parseFromString(unsafeHtml, "text/html");
  const elements = [].concat(...createdDocument.body.querySelectorAll("*"));
  for (const element of elements) {
    const elementName = element.nodeName.toLowerCase();
    if (!Object.keys(allowList).includes(elementName)) {
      element.remove();
      continue;
    }
    const attributeList = [].concat(...element.attributes);
    const allowedAttributes = [].concat(allowList["*"] || [], allowList[elementName] || []);
    for (const attribute of attributeList) {
      if (!allowedAttribute(attribute, allowedAttributes)) {
        element.removeAttribute(attribute.nodeName);
      }
    }
  }
  return createdDocument.body.innerHTML;
}
var NAME$5 = "TemplateFactory";
var Default$4 = {
  allowList: DefaultAllowlist,
  content: {},
  // { selector : text ,  selector2 : text2 , }
  extraClass: "",
  html: false,
  sanitize: true,
  sanitizeFn: null,
  template: "<div></div>"
};
var DefaultType$4 = {
  allowList: "object",
  content: "object",
  extraClass: "(string|function)",
  html: "boolean",
  sanitize: "boolean",
  sanitizeFn: "(null|function)",
  template: "string"
};
var DefaultContentType = {
  entry: "(string|element|function|null)",
  selector: "(string|element)"
};
var TemplateFactory = class extends Config {
  constructor(config) {
    super();
    this._config = this._getConfig(config);
  }
  // Getters
  static get Default() {
    return Default$4;
  }
  static get DefaultType() {
    return DefaultType$4;
  }
  static get NAME() {
    return NAME$5;
  }
  // Public
  getContent() {
    return Object.values(this._config.content).map((config) => this._resolvePossibleFunction(config)).filter(Boolean);
  }
  hasContent() {
    return this.getContent().length > 0;
  }
  changeContent(content) {
    this._checkContent(content);
    this._config.content = {
      ...this._config.content,
      ...content
    };
    return this;
  }
  toHtml() {
    const templateWrapper = document.createElement("div");
    templateWrapper.innerHTML = this._maybeSanitize(this._config.template);
    for (const [selector, text] of Object.entries(this._config.content)) {
      this._setContent(templateWrapper, text, selector);
    }
    const template = templateWrapper.children[0];
    const extraClass = this._resolvePossibleFunction(this._config.extraClass);
    if (extraClass) {
      template.classList.add(...extraClass.split(" "));
    }
    return template;
  }
  // Private
  _typeCheckConfig(config) {
    super._typeCheckConfig(config);
    this._checkContent(config.content);
  }
  _checkContent(arg) {
    for (const [selector, content] of Object.entries(arg)) {
      super._typeCheckConfig({
        selector,
        entry: content
      }, DefaultContentType);
    }
  }
  _setContent(template, content, selector) {
    const templateElement = SelectorEngine.findOne(selector, template);
    if (!templateElement) {
      return;
    }
    content = this._resolvePossibleFunction(content);
    if (!content) {
      templateElement.remove();
      return;
    }
    if (isElement2(content)) {
      this._putElementInTemplate(getElement(content), templateElement);
      return;
    }
    if (this._config.html) {
      templateElement.innerHTML = this._maybeSanitize(content);
      return;
    }
    templateElement.textContent = content;
  }
  _maybeSanitize(arg) {
    return this._config.sanitize ? sanitizeHtml(arg, this._config.allowList, this._config.sanitizeFn) : arg;
  }
  _resolvePossibleFunction(arg) {
    return execute(arg, [void 0, this]);
  }
  _putElementInTemplate(element, templateElement) {
    if (this._config.html) {
      templateElement.innerHTML = "";
      templateElement.append(element);
      return;
    }
    templateElement.textContent = element.textContent;
  }
};
var NAME$4 = "tooltip";
var DISALLOWED_ATTRIBUTES = /* @__PURE__ */ new Set(["sanitize", "allowList", "sanitizeFn"]);
var CLASS_NAME_FADE$2 = "fade";
var CLASS_NAME_MODAL = "modal";
var CLASS_NAME_SHOW$2 = "show";
var SELECTOR_TOOLTIP_INNER = ".tooltip-inner";
var SELECTOR_MODAL = `.${CLASS_NAME_MODAL}`;
var EVENT_MODAL_HIDE = "hide.bs.modal";
var TRIGGER_HOVER = "hover";
var TRIGGER_FOCUS = "focus";
var TRIGGER_CLICK = "click";
var TRIGGER_MANUAL = "manual";
var EVENT_HIDE$2 = "hide";
var EVENT_HIDDEN$2 = "hidden";
var EVENT_SHOW$2 = "show";
var EVENT_SHOWN$2 = "shown";
var EVENT_INSERTED = "inserted";
var EVENT_CLICK$1 = "click";
var EVENT_FOCUSIN$1 = "focusin";
var EVENT_FOCUSOUT$1 = "focusout";
var EVENT_MOUSEENTER = "mouseenter";
var EVENT_MOUSELEAVE = "mouseleave";
var AttachmentMap = {
  AUTO: "auto",
  TOP: "top",
  RIGHT: isRTL() ? "left" : "right",
  BOTTOM: "bottom",
  LEFT: isRTL() ? "right" : "left"
};
var Default$3 = {
  allowList: DefaultAllowlist,
  animation: true,
  boundary: "clippingParents",
  container: false,
  customClass: "",
  delay: 0,
  fallbackPlacements: ["top", "right", "bottom", "left"],
  html: false,
  offset: [0, 6],
  placement: "top",
  popperConfig: null,
  sanitize: true,
  sanitizeFn: null,
  selector: false,
  template: '<div class="tooltip" role="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>',
  title: "",
  trigger: "hover focus"
};
var DefaultType$3 = {
  allowList: "object",
  animation: "boolean",
  boundary: "(string|element)",
  container: "(string|element|boolean)",
  customClass: "(string|function)",
  delay: "(number|object)",
  fallbackPlacements: "array",
  html: "boolean",
  offset: "(array|string|function)",
  placement: "(string|function)",
  popperConfig: "(null|object|function)",
  sanitize: "boolean",
  sanitizeFn: "(null|function)",
  selector: "(string|boolean)",
  template: "string",
  title: "(string|element|function)",
  trigger: "string"
};
var Tooltip = class _Tooltip extends BaseComponent {
  constructor(element, config) {
    if (typeof lib_exports === "undefined") {
      throw new TypeError("Bootstrap's tooltips require Popper (https://popper.js.org/docs/v2/)");
    }
    super(element, config);
    this._isEnabled = true;
    this._timeout = 0;
    this._isHovered = null;
    this._activeTrigger = {};
    this._popper = null;
    this._templateFactory = null;
    this._newContent = null;
    this.tip = null;
    this._setListeners();
    if (!this._config.selector) {
      this._fixTitle();
    }
  }
  // Getters
  static get Default() {
    return Default$3;
  }
  static get DefaultType() {
    return DefaultType$3;
  }
  static get NAME() {
    return NAME$4;
  }
  // Public
  enable() {
    this._isEnabled = true;
  }
  disable() {
    this._isEnabled = false;
  }
  toggleEnabled() {
    this._isEnabled = !this._isEnabled;
  }
  toggle() {
    if (!this._isEnabled) {
      return;
    }
    if (this._isShown()) {
      this._leave();
      return;
    }
    this._enter();
  }
  dispose() {
    clearTimeout(this._timeout);
    EventHandler.off(this._element.closest(SELECTOR_MODAL), EVENT_MODAL_HIDE, this._hideModalHandler);
    if (this._element.getAttribute("data-bs-original-title")) {
      this._element.setAttribute("title", this._element.getAttribute("data-bs-original-title"));
    }
    this._disposePopper();
    super.dispose();
  }
  show() {
    if (this._element.style.display === "none") {
      throw new Error("Please use show on visible elements");
    }
    if (!(this._isWithContent() && this._isEnabled)) {
      return;
    }
    const showEvent = EventHandler.trigger(this._element, this.constructor.eventName(EVENT_SHOW$2));
    const shadowRoot = findShadowRoot(this._element);
    const isInTheDom = (shadowRoot || this._element.ownerDocument.documentElement).contains(this._element);
    if (showEvent.defaultPrevented || !isInTheDom) {
      return;
    }
    this._disposePopper();
    const tip = this._getTipElement();
    this._element.setAttribute("aria-describedby", tip.getAttribute("id"));
    const {
      container
    } = this._config;
    if (!this._element.ownerDocument.documentElement.contains(this.tip)) {
      container.append(tip);
      EventHandler.trigger(this._element, this.constructor.eventName(EVENT_INSERTED));
    }
    this._popper = this._createPopper(tip);
    tip.classList.add(CLASS_NAME_SHOW$2);
    if ("ontouchstart" in document.documentElement) {
      for (const element of [].concat(...document.body.children)) {
        EventHandler.on(element, "mouseover", noop);
      }
    }
    const complete = () => {
      EventHandler.trigger(this._element, this.constructor.eventName(EVENT_SHOWN$2));
      if (this._isHovered === false) {
        this._leave();
      }
      this._isHovered = false;
    };
    this._queueCallback(complete, this.tip, this._isAnimated());
  }
  hide() {
    if (!this._isShown()) {
      return;
    }
    const hideEvent = EventHandler.trigger(this._element, this.constructor.eventName(EVENT_HIDE$2));
    if (hideEvent.defaultPrevented) {
      return;
    }
    const tip = this._getTipElement();
    tip.classList.remove(CLASS_NAME_SHOW$2);
    if ("ontouchstart" in document.documentElement) {
      for (const element of [].concat(...document.body.children)) {
        EventHandler.off(element, "mouseover", noop);
      }
    }
    this._activeTrigger[TRIGGER_CLICK] = false;
    this._activeTrigger[TRIGGER_FOCUS] = false;
    this._activeTrigger[TRIGGER_HOVER] = false;
    this._isHovered = null;
    const complete = () => {
      if (this._isWithActiveTrigger()) {
        return;
      }
      if (!this._isHovered) {
        this._disposePopper();
      }
      this._element.removeAttribute("aria-describedby");
      EventHandler.trigger(this._element, this.constructor.eventName(EVENT_HIDDEN$2));
    };
    this._queueCallback(complete, this.tip, this._isAnimated());
  }
  update() {
    if (this._popper) {
      this._popper.update();
    }
  }
  // Protected
  _isWithContent() {
    return Boolean(this._getTitle());
  }
  _getTipElement() {
    if (!this.tip) {
      this.tip = this._createTipElement(this._newContent || this._getContentForTemplate());
    }
    return this.tip;
  }
  _createTipElement(content) {
    const tip = this._getTemplateFactory(content).toHtml();
    if (!tip) {
      return null;
    }
    tip.classList.remove(CLASS_NAME_FADE$2, CLASS_NAME_SHOW$2);
    tip.classList.add(`bs-${this.constructor.NAME}-auto`);
    const tipId = getUID(this.constructor.NAME).toString();
    tip.setAttribute("id", tipId);
    if (this._isAnimated()) {
      tip.classList.add(CLASS_NAME_FADE$2);
    }
    return tip;
  }
  setContent(content) {
    this._newContent = content;
    if (this._isShown()) {
      this._disposePopper();
      this.show();
    }
  }
  _getTemplateFactory(content) {
    if (this._templateFactory) {
      this._templateFactory.changeContent(content);
    } else {
      this._templateFactory = new TemplateFactory({
        ...this._config,
        // the `content` var has to be after `this._config`
        // to override config.content in case of popover
        content,
        extraClass: this._resolvePossibleFunction(this._config.customClass)
      });
    }
    return this._templateFactory;
  }
  _getContentForTemplate() {
    return {
      [SELECTOR_TOOLTIP_INNER]: this._getTitle()
    };
  }
  _getTitle() {
    return this._resolvePossibleFunction(this._config.title) || this._element.getAttribute("data-bs-original-title");
  }
  // Private
  _initializeOnDelegatedTarget(event) {
    return this.constructor.getOrCreateInstance(event.delegateTarget, this._getDelegateConfig());
  }
  _isAnimated() {
    return this._config.animation || this.tip && this.tip.classList.contains(CLASS_NAME_FADE$2);
  }
  _isShown() {
    return this.tip && this.tip.classList.contains(CLASS_NAME_SHOW$2);
  }
  _createPopper(tip) {
    const placement = execute(this._config.placement, [this, tip, this._element]);
    const attachment = AttachmentMap[placement.toUpperCase()];
    return createPopper3(this._element, tip, this._getPopperConfig(attachment));
  }
  _getOffset() {
    const {
      offset: offset2
    } = this._config;
    if (typeof offset2 === "string") {
      return offset2.split(",").map((value) => Number.parseInt(value, 10));
    }
    if (typeof offset2 === "function") {
      return (popperData) => offset2(popperData, this._element);
    }
    return offset2;
  }
  _resolvePossibleFunction(arg) {
    return execute(arg, [this._element, this._element]);
  }
  _getPopperConfig(attachment) {
    const defaultBsPopperConfig = {
      placement: attachment,
      modifiers: [{
        name: "flip",
        options: {
          fallbackPlacements: this._config.fallbackPlacements
        }
      }, {
        name: "offset",
        options: {
          offset: this._getOffset()
        }
      }, {
        name: "preventOverflow",
        options: {
          boundary: this._config.boundary
        }
      }, {
        name: "arrow",
        options: {
          element: `.${this.constructor.NAME}-arrow`
        }
      }, {
        name: "preSetPlacement",
        enabled: true,
        phase: "beforeMain",
        fn: (data) => {
          this._getTipElement().setAttribute("data-popper-placement", data.state.placement);
        }
      }]
    };
    return {
      ...defaultBsPopperConfig,
      ...execute(this._config.popperConfig, [void 0, defaultBsPopperConfig])
    };
  }
  _setListeners() {
    const triggers = this._config.trigger.split(" ");
    for (const trigger of triggers) {
      if (trigger === "click") {
        EventHandler.on(this._element, this.constructor.eventName(EVENT_CLICK$1), this._config.selector, (event) => {
          const context = this._initializeOnDelegatedTarget(event);
          context.toggle();
        });
      } else if (trigger !== TRIGGER_MANUAL) {
        const eventIn = trigger === TRIGGER_HOVER ? this.constructor.eventName(EVENT_MOUSEENTER) : this.constructor.eventName(EVENT_FOCUSIN$1);
        const eventOut = trigger === TRIGGER_HOVER ? this.constructor.eventName(EVENT_MOUSELEAVE) : this.constructor.eventName(EVENT_FOCUSOUT$1);
        EventHandler.on(this._element, eventIn, this._config.selector, (event) => {
          const context = this._initializeOnDelegatedTarget(event);
          context._activeTrigger[event.type === "focusin" ? TRIGGER_FOCUS : TRIGGER_HOVER] = true;
          context._enter();
        });
        EventHandler.on(this._element, eventOut, this._config.selector, (event) => {
          const context = this._initializeOnDelegatedTarget(event);
          context._activeTrigger[event.type === "focusout" ? TRIGGER_FOCUS : TRIGGER_HOVER] = context._element.contains(event.relatedTarget);
          context._leave();
        });
      }
    }
    this._hideModalHandler = () => {
      if (this._element) {
        this.hide();
      }
    };
    EventHandler.on(this._element.closest(SELECTOR_MODAL), EVENT_MODAL_HIDE, this._hideModalHandler);
  }
  _fixTitle() {
    const title = this._element.getAttribute("title");
    if (!title) {
      return;
    }
    if (!this._element.getAttribute("aria-label") && !this._element.textContent.trim()) {
      this._element.setAttribute("aria-label", title);
    }
    this._element.setAttribute("data-bs-original-title", title);
    this._element.removeAttribute("title");
  }
  _enter() {
    if (this._isShown() || this._isHovered) {
      this._isHovered = true;
      return;
    }
    this._isHovered = true;
    this._setTimeout(() => {
      if (this._isHovered) {
        this.show();
      }
    }, this._config.delay.show);
  }
  _leave() {
    if (this._isWithActiveTrigger()) {
      return;
    }
    this._isHovered = false;
    this._setTimeout(() => {
      if (!this._isHovered) {
        this.hide();
      }
    }, this._config.delay.hide);
  }
  _setTimeout(handler, timeout) {
    clearTimeout(this._timeout);
    this._timeout = setTimeout(handler, timeout);
  }
  _isWithActiveTrigger() {
    return Object.values(this._activeTrigger).includes(true);
  }
  _getConfig(config) {
    const dataAttributes = Manipulator.getDataAttributes(this._element);
    for (const dataAttribute of Object.keys(dataAttributes)) {
      if (DISALLOWED_ATTRIBUTES.has(dataAttribute)) {
        delete dataAttributes[dataAttribute];
      }
    }
    config = {
      ...dataAttributes,
      ...typeof config === "object" && config ? config : {}
    };
    config = this._mergeConfigObj(config);
    config = this._configAfterMerge(config);
    this._typeCheckConfig(config);
    return config;
  }
  _configAfterMerge(config) {
    config.container = config.container === false ? document.body : getElement(config.container);
    if (typeof config.delay === "number") {
      config.delay = {
        show: config.delay,
        hide: config.delay
      };
    }
    if (typeof config.title === "number") {
      config.title = config.title.toString();
    }
    if (typeof config.content === "number") {
      config.content = config.content.toString();
    }
    return config;
  }
  _getDelegateConfig() {
    const config = {};
    for (const [key, value] of Object.entries(this._config)) {
      if (this.constructor.Default[key] !== value) {
        config[key] = value;
      }
    }
    config.selector = false;
    config.trigger = "manual";
    return config;
  }
  _disposePopper() {
    if (this._popper) {
      this._popper.destroy();
      this._popper = null;
    }
    if (this.tip) {
      this.tip.remove();
      this.tip = null;
    }
  }
  // Static
  static jQueryInterface(config) {
    return this.each(function() {
      const data = _Tooltip.getOrCreateInstance(this, config);
      if (typeof config !== "string") {
        return;
      }
      if (typeof data[config] === "undefined") {
        throw new TypeError(`No method named "${config}"`);
      }
      data[config]();
    });
  }
};
defineJQueryPlugin(Tooltip);
var NAME$3 = "popover";
var SELECTOR_TITLE = ".popover-header";
var SELECTOR_CONTENT = ".popover-body";
var Default$2 = {
  ...Tooltip.Default,
  content: "",
  offset: [0, 8],
  placement: "right",
  template: '<div class="popover" role="tooltip"><div class="popover-arrow"></div><h3 class="popover-header"></h3><div class="popover-body"></div></div>',
  trigger: "click"
};
var DefaultType$2 = {
  ...Tooltip.DefaultType,
  content: "(null|string|element|function)"
};
var Popover = class _Popover extends Tooltip {
  // Getters
  static get Default() {
    return Default$2;
  }
  static get DefaultType() {
    return DefaultType$2;
  }
  static get NAME() {
    return NAME$3;
  }
  // Overrides
  _isWithContent() {
    return this._getTitle() || this._getContent();
  }
  // Private
  _getContentForTemplate() {
    return {
      [SELECTOR_TITLE]: this._getTitle(),
      [SELECTOR_CONTENT]: this._getContent()
    };
  }
  _getContent() {
    return this._resolvePossibleFunction(this._config.content);
  }
  // Static
  static jQueryInterface(config) {
    return this.each(function() {
      const data = _Popover.getOrCreateInstance(this, config);
      if (typeof config !== "string") {
        return;
      }
      if (typeof data[config] === "undefined") {
        throw new TypeError(`No method named "${config}"`);
      }
      data[config]();
    });
  }
};
defineJQueryPlugin(Popover);
var NAME$2 = "scrollspy";
var DATA_KEY$2 = "bs.scrollspy";
var EVENT_KEY$2 = `.${DATA_KEY$2}`;
var DATA_API_KEY = ".data-api";
var EVENT_ACTIVATE = `activate${EVENT_KEY$2}`;
var EVENT_CLICK = `click${EVENT_KEY$2}`;
var EVENT_LOAD_DATA_API$1 = `load${EVENT_KEY$2}${DATA_API_KEY}`;
var CLASS_NAME_DROPDOWN_ITEM = "dropdown-item";
var CLASS_NAME_ACTIVE$1 = "active";
var SELECTOR_DATA_SPY = '[data-bs-spy="scroll"]';
var SELECTOR_TARGET_LINKS = "[href]";
var SELECTOR_NAV_LIST_GROUP = ".nav, .list-group";
var SELECTOR_NAV_LINKS = ".nav-link";
var SELECTOR_NAV_ITEMS = ".nav-item";
var SELECTOR_LIST_ITEMS = ".list-group-item";
var SELECTOR_LINK_ITEMS = `${SELECTOR_NAV_LINKS}, ${SELECTOR_NAV_ITEMS} > ${SELECTOR_NAV_LINKS}, ${SELECTOR_LIST_ITEMS}`;
var SELECTOR_DROPDOWN = ".dropdown";
var SELECTOR_DROPDOWN_TOGGLE$1 = ".dropdown-toggle";
var Default$1 = {
  offset: null,
  // TODO: v6 @deprecated, keep it for backwards compatibility reasons
  rootMargin: "0px 0px -25%",
  smoothScroll: false,
  target: null,
  threshold: [0.1, 0.5, 1]
};
var DefaultType$1 = {
  offset: "(number|null)",
  // TODO v6 @deprecated, keep it for backwards compatibility reasons
  rootMargin: "string",
  smoothScroll: "boolean",
  target: "element",
  threshold: "array"
};
var ScrollSpy = class _ScrollSpy extends BaseComponent {
  constructor(element, config) {
    super(element, config);
    this._targetLinks = /* @__PURE__ */ new Map();
    this._observableSections = /* @__PURE__ */ new Map();
    this._rootElement = getComputedStyle(this._element).overflowY === "visible" ? null : this._element;
    this._activeTarget = null;
    this._observer = null;
    this._previousScrollData = {
      visibleEntryTop: 0,
      parentScrollTop: 0
    };
    this.refresh();
  }
  // Getters
  static get Default() {
    return Default$1;
  }
  static get DefaultType() {
    return DefaultType$1;
  }
  static get NAME() {
    return NAME$2;
  }
  // Public
  refresh() {
    this._initializeTargetsAndObservables();
    this._maybeEnableSmoothScroll();
    if (this._observer) {
      this._observer.disconnect();
    } else {
      this._observer = this._getNewObserver();
    }
    for (const section of this._observableSections.values()) {
      this._observer.observe(section);
    }
  }
  dispose() {
    this._observer.disconnect();
    super.dispose();
  }
  // Private
  _configAfterMerge(config) {
    config.target = getElement(config.target) || document.body;
    config.rootMargin = config.offset ? `${config.offset}px 0px -30%` : config.rootMargin;
    if (typeof config.threshold === "string") {
      config.threshold = config.threshold.split(",").map((value) => Number.parseFloat(value));
    }
    return config;
  }
  _maybeEnableSmoothScroll() {
    if (!this._config.smoothScroll) {
      return;
    }
    EventHandler.off(this._config.target, EVENT_CLICK);
    EventHandler.on(this._config.target, EVENT_CLICK, SELECTOR_TARGET_LINKS, (event) => {
      const observableSection = this._observableSections.get(event.target.hash);
      if (observableSection) {
        event.preventDefault();
        const root = this._rootElement || window;
        const height = observableSection.offsetTop - this._element.offsetTop;
        if (root.scrollTo) {
          root.scrollTo({
            top: height,
            behavior: "smooth"
          });
          return;
        }
        root.scrollTop = height;
      }
    });
  }
  _getNewObserver() {
    const options = {
      root: this._rootElement,
      threshold: this._config.threshold,
      rootMargin: this._config.rootMargin
    };
    return new IntersectionObserver((entries) => this._observerCallback(entries), options);
  }
  // The logic of selection
  _observerCallback(entries) {
    const targetElement = (entry) => this._targetLinks.get(`#${entry.target.id}`);
    const activate = (entry) => {
      this._previousScrollData.visibleEntryTop = entry.target.offsetTop;
      this._process(targetElement(entry));
    };
    const parentScrollTop = (this._rootElement || document.documentElement).scrollTop;
    const userScrollsDown = parentScrollTop >= this._previousScrollData.parentScrollTop;
    this._previousScrollData.parentScrollTop = parentScrollTop;
    for (const entry of entries) {
      if (!entry.isIntersecting) {
        this._activeTarget = null;
        this._clearActiveClass(targetElement(entry));
        continue;
      }
      const entryIsLowerThanPrevious = entry.target.offsetTop >= this._previousScrollData.visibleEntryTop;
      if (userScrollsDown && entryIsLowerThanPrevious) {
        activate(entry);
        if (!parentScrollTop) {
          return;
        }
        continue;
      }
      if (!userScrollsDown && !entryIsLowerThanPrevious) {
        activate(entry);
      }
    }
  }
  _initializeTargetsAndObservables() {
    this._targetLinks = /* @__PURE__ */ new Map();
    this._observableSections = /* @__PURE__ */ new Map();
    const targetLinks = SelectorEngine.find(SELECTOR_TARGET_LINKS, this._config.target);
    for (const anchor of targetLinks) {
      if (!anchor.hash || isDisabled(anchor)) {
        continue;
      }
      const observableSection = SelectorEngine.findOne(decodeURI(anchor.hash), this._element);
      if (isVisible(observableSection)) {
        this._targetLinks.set(decodeURI(anchor.hash), anchor);
        this._observableSections.set(anchor.hash, observableSection);
      }
    }
  }
  _process(target) {
    if (this._activeTarget === target) {
      return;
    }
    this._clearActiveClass(this._config.target);
    this._activeTarget = target;
    target.classList.add(CLASS_NAME_ACTIVE$1);
    this._activateParents(target);
    EventHandler.trigger(this._element, EVENT_ACTIVATE, {
      relatedTarget: target
    });
  }
  _activateParents(target) {
    if (target.classList.contains(CLASS_NAME_DROPDOWN_ITEM)) {
      SelectorEngine.findOne(SELECTOR_DROPDOWN_TOGGLE$1, target.closest(SELECTOR_DROPDOWN)).classList.add(CLASS_NAME_ACTIVE$1);
      return;
    }
    for (const listGroup of SelectorEngine.parents(target, SELECTOR_NAV_LIST_GROUP)) {
      for (const item of SelectorEngine.prev(listGroup, SELECTOR_LINK_ITEMS)) {
        item.classList.add(CLASS_NAME_ACTIVE$1);
      }
    }
  }
  _clearActiveClass(parent) {
    parent.classList.remove(CLASS_NAME_ACTIVE$1);
    const activeNodes = SelectorEngine.find(`${SELECTOR_TARGET_LINKS}.${CLASS_NAME_ACTIVE$1}`, parent);
    for (const node of activeNodes) {
      node.classList.remove(CLASS_NAME_ACTIVE$1);
    }
  }
  // Static
  static jQueryInterface(config) {
    return this.each(function() {
      const data = _ScrollSpy.getOrCreateInstance(this, config);
      if (typeof config !== "string") {
        return;
      }
      if (data[config] === void 0 || config.startsWith("_") || config === "constructor") {
        throw new TypeError(`No method named "${config}"`);
      }
      data[config]();
    });
  }
};
EventHandler.on(window, EVENT_LOAD_DATA_API$1, () => {
  for (const spy of SelectorEngine.find(SELECTOR_DATA_SPY)) {
    ScrollSpy.getOrCreateInstance(spy);
  }
});
defineJQueryPlugin(ScrollSpy);
var NAME$1 = "tab";
var DATA_KEY$1 = "bs.tab";
var EVENT_KEY$1 = `.${DATA_KEY$1}`;
var EVENT_HIDE$1 = `hide${EVENT_KEY$1}`;
var EVENT_HIDDEN$1 = `hidden${EVENT_KEY$1}`;
var EVENT_SHOW$1 = `show${EVENT_KEY$1}`;
var EVENT_SHOWN$1 = `shown${EVENT_KEY$1}`;
var EVENT_CLICK_DATA_API = `click${EVENT_KEY$1}`;
var EVENT_KEYDOWN = `keydown${EVENT_KEY$1}`;
var EVENT_LOAD_DATA_API = `load${EVENT_KEY$1}`;
var ARROW_LEFT_KEY = "ArrowLeft";
var ARROW_RIGHT_KEY = "ArrowRight";
var ARROW_UP_KEY = "ArrowUp";
var ARROW_DOWN_KEY = "ArrowDown";
var HOME_KEY = "Home";
var END_KEY = "End";
var CLASS_NAME_ACTIVE = "active";
var CLASS_NAME_FADE$1 = "fade";
var CLASS_NAME_SHOW$1 = "show";
var CLASS_DROPDOWN = "dropdown";
var SELECTOR_DROPDOWN_TOGGLE = ".dropdown-toggle";
var SELECTOR_DROPDOWN_MENU = ".dropdown-menu";
var NOT_SELECTOR_DROPDOWN_TOGGLE = `:not(${SELECTOR_DROPDOWN_TOGGLE})`;
var SELECTOR_TAB_PANEL = '.list-group, .nav, [role="tablist"]';
var SELECTOR_OUTER = ".nav-item, .list-group-item";
var SELECTOR_INNER = `.nav-link${NOT_SELECTOR_DROPDOWN_TOGGLE}, .list-group-item${NOT_SELECTOR_DROPDOWN_TOGGLE}, [role="tab"]${NOT_SELECTOR_DROPDOWN_TOGGLE}`;
var SELECTOR_DATA_TOGGLE = '[data-bs-toggle="tab"], [data-bs-toggle="pill"], [data-bs-toggle="list"]';
var SELECTOR_INNER_ELEM = `${SELECTOR_INNER}, ${SELECTOR_DATA_TOGGLE}`;
var SELECTOR_DATA_TOGGLE_ACTIVE = `.${CLASS_NAME_ACTIVE}[data-bs-toggle="tab"], .${CLASS_NAME_ACTIVE}[data-bs-toggle="pill"], .${CLASS_NAME_ACTIVE}[data-bs-toggle="list"]`;
var Tab = class _Tab extends BaseComponent {
  constructor(element) {
    super(element);
    this._parent = this._element.closest(SELECTOR_TAB_PANEL);
    if (!this._parent) {
      return;
    }
    this._setInitialAttributes(this._parent, this._getChildren());
    EventHandler.on(this._element, EVENT_KEYDOWN, (event) => this._keydown(event));
  }
  // Getters
  static get NAME() {
    return NAME$1;
  }
  // Public
  show() {
    const innerElem = this._element;
    if (this._elemIsActive(innerElem)) {
      return;
    }
    const active = this._getActiveElem();
    const hideEvent = active ? EventHandler.trigger(active, EVENT_HIDE$1, {
      relatedTarget: innerElem
    }) : null;
    const showEvent = EventHandler.trigger(innerElem, EVENT_SHOW$1, {
      relatedTarget: active
    });
    if (showEvent.defaultPrevented || hideEvent && hideEvent.defaultPrevented) {
      return;
    }
    this._deactivate(active, innerElem);
    this._activate(innerElem, active);
  }
  // Private
  _activate(element, relatedElem) {
    if (!element) {
      return;
    }
    element.classList.add(CLASS_NAME_ACTIVE);
    this._activate(SelectorEngine.getElementFromSelector(element));
    const complete = () => {
      if (element.getAttribute("role") !== "tab") {
        element.classList.add(CLASS_NAME_SHOW$1);
        return;
      }
      element.removeAttribute("tabindex");
      element.setAttribute("aria-selected", true);
      this._toggleDropDown(element, true);
      EventHandler.trigger(element, EVENT_SHOWN$1, {
        relatedTarget: relatedElem
      });
    };
    this._queueCallback(complete, element, element.classList.contains(CLASS_NAME_FADE$1));
  }
  _deactivate(element, relatedElem) {
    if (!element) {
      return;
    }
    element.classList.remove(CLASS_NAME_ACTIVE);
    element.blur();
    this._deactivate(SelectorEngine.getElementFromSelector(element));
    const complete = () => {
      if (element.getAttribute("role") !== "tab") {
        element.classList.remove(CLASS_NAME_SHOW$1);
        return;
      }
      element.setAttribute("aria-selected", false);
      element.setAttribute("tabindex", "-1");
      this._toggleDropDown(element, false);
      EventHandler.trigger(element, EVENT_HIDDEN$1, {
        relatedTarget: relatedElem
      });
    };
    this._queueCallback(complete, element, element.classList.contains(CLASS_NAME_FADE$1));
  }
  _keydown(event) {
    if (![ARROW_LEFT_KEY, ARROW_RIGHT_KEY, ARROW_UP_KEY, ARROW_DOWN_KEY, HOME_KEY, END_KEY].includes(event.key)) {
      return;
    }
    event.stopPropagation();
    event.preventDefault();
    const children = this._getChildren().filter((element) => !isDisabled(element));
    let nextActiveElement;
    if ([HOME_KEY, END_KEY].includes(event.key)) {
      nextActiveElement = children[event.key === HOME_KEY ? 0 : children.length - 1];
    } else {
      const isNext = [ARROW_RIGHT_KEY, ARROW_DOWN_KEY].includes(event.key);
      nextActiveElement = getNextActiveElement(children, event.target, isNext, true);
    }
    if (nextActiveElement) {
      nextActiveElement.focus({
        preventScroll: true
      });
      _Tab.getOrCreateInstance(nextActiveElement).show();
    }
  }
  _getChildren() {
    return SelectorEngine.find(SELECTOR_INNER_ELEM, this._parent);
  }
  _getActiveElem() {
    return this._getChildren().find((child) => this._elemIsActive(child)) || null;
  }
  _setInitialAttributes(parent, children) {
    this._setAttributeIfNotExists(parent, "role", "tablist");
    for (const child of children) {
      this._setInitialAttributesOnChild(child);
    }
  }
  _setInitialAttributesOnChild(child) {
    child = this._getInnerElement(child);
    const isActive = this._elemIsActive(child);
    const outerElem = this._getOuterElement(child);
    child.setAttribute("aria-selected", isActive);
    if (outerElem !== child) {
      this._setAttributeIfNotExists(outerElem, "role", "presentation");
    }
    if (!isActive) {
      child.setAttribute("tabindex", "-1");
    }
    this._setAttributeIfNotExists(child, "role", "tab");
    this._setInitialAttributesOnTargetPanel(child);
  }
  _setInitialAttributesOnTargetPanel(child) {
    const target = SelectorEngine.getElementFromSelector(child);
    if (!target) {
      return;
    }
    this._setAttributeIfNotExists(target, "role", "tabpanel");
    if (child.id) {
      this._setAttributeIfNotExists(target, "aria-labelledby", `${child.id}`);
    }
  }
  _toggleDropDown(element, open) {
    const outerElem = this._getOuterElement(element);
    if (!outerElem.classList.contains(CLASS_DROPDOWN)) {
      return;
    }
    const toggle = (selector, className) => {
      const element2 = SelectorEngine.findOne(selector, outerElem);
      if (element2) {
        element2.classList.toggle(className, open);
      }
    };
    toggle(SELECTOR_DROPDOWN_TOGGLE, CLASS_NAME_ACTIVE);
    toggle(SELECTOR_DROPDOWN_MENU, CLASS_NAME_SHOW$1);
    outerElem.setAttribute("aria-expanded", open);
  }
  _setAttributeIfNotExists(element, attribute, value) {
    if (!element.hasAttribute(attribute)) {
      element.setAttribute(attribute, value);
    }
  }
  _elemIsActive(elem) {
    return elem.classList.contains(CLASS_NAME_ACTIVE);
  }
  // Try to get the inner element (usually the .nav-link)
  _getInnerElement(elem) {
    return elem.matches(SELECTOR_INNER_ELEM) ? elem : SelectorEngine.findOne(SELECTOR_INNER_ELEM, elem);
  }
  // Try to get the outer element (usually the .nav-item)
  _getOuterElement(elem) {
    return elem.closest(SELECTOR_OUTER) || elem;
  }
  // Static
  static jQueryInterface(config) {
    return this.each(function() {
      const data = _Tab.getOrCreateInstance(this);
      if (typeof config !== "string") {
        return;
      }
      if (data[config] === void 0 || config.startsWith("_") || config === "constructor") {
        throw new TypeError(`No method named "${config}"`);
      }
      data[config]();
    });
  }
};
EventHandler.on(document, EVENT_CLICK_DATA_API, SELECTOR_DATA_TOGGLE, function(event) {
  if (["A", "AREA"].includes(this.tagName)) {
    event.preventDefault();
  }
  if (isDisabled(this)) {
    return;
  }
  Tab.getOrCreateInstance(this).show();
});
EventHandler.on(window, EVENT_LOAD_DATA_API, () => {
  for (const element of SelectorEngine.find(SELECTOR_DATA_TOGGLE_ACTIVE)) {
    Tab.getOrCreateInstance(element);
  }
});
defineJQueryPlugin(Tab);
var NAME = "toast";
var DATA_KEY = "bs.toast";
var EVENT_KEY = `.${DATA_KEY}`;
var EVENT_MOUSEOVER = `mouseover${EVENT_KEY}`;
var EVENT_MOUSEOUT = `mouseout${EVENT_KEY}`;
var EVENT_FOCUSIN = `focusin${EVENT_KEY}`;
var EVENT_FOCUSOUT = `focusout${EVENT_KEY}`;
var EVENT_HIDE = `hide${EVENT_KEY}`;
var EVENT_HIDDEN = `hidden${EVENT_KEY}`;
var EVENT_SHOW = `show${EVENT_KEY}`;
var EVENT_SHOWN = `shown${EVENT_KEY}`;
var CLASS_NAME_FADE = "fade";
var CLASS_NAME_HIDE = "hide";
var CLASS_NAME_SHOW = "show";
var CLASS_NAME_SHOWING = "showing";
var DefaultType = {
  animation: "boolean",
  autohide: "boolean",
  delay: "number"
};
var Default = {
  animation: true,
  autohide: true,
  delay: 5e3
};
var Toast = class _Toast extends BaseComponent {
  constructor(element, config) {
    super(element, config);
    this._timeout = null;
    this._hasMouseInteraction = false;
    this._hasKeyboardInteraction = false;
    this._setListeners();
  }
  // Getters
  static get Default() {
    return Default;
  }
  static get DefaultType() {
    return DefaultType;
  }
  static get NAME() {
    return NAME;
  }
  // Public
  show() {
    const showEvent = EventHandler.trigger(this._element, EVENT_SHOW);
    if (showEvent.defaultPrevented) {
      return;
    }
    this._clearTimeout();
    if (this._config.animation) {
      this._element.classList.add(CLASS_NAME_FADE);
    }
    const complete = () => {
      this._element.classList.remove(CLASS_NAME_SHOWING);
      EventHandler.trigger(this._element, EVENT_SHOWN);
      this._maybeScheduleHide();
    };
    this._element.classList.remove(CLASS_NAME_HIDE);
    reflow(this._element);
    this._element.classList.add(CLASS_NAME_SHOW, CLASS_NAME_SHOWING);
    this._queueCallback(complete, this._element, this._config.animation);
  }
  hide() {
    if (!this.isShown()) {
      return;
    }
    const hideEvent = EventHandler.trigger(this._element, EVENT_HIDE);
    if (hideEvent.defaultPrevented) {
      return;
    }
    const complete = () => {
      this._element.classList.add(CLASS_NAME_HIDE);
      this._element.classList.remove(CLASS_NAME_SHOWING, CLASS_NAME_SHOW);
      EventHandler.trigger(this._element, EVENT_HIDDEN);
    };
    this._element.classList.add(CLASS_NAME_SHOWING);
    this._queueCallback(complete, this._element, this._config.animation);
  }
  dispose() {
    this._clearTimeout();
    if (this.isShown()) {
      this._element.classList.remove(CLASS_NAME_SHOW);
    }
    super.dispose();
  }
  isShown() {
    return this._element.classList.contains(CLASS_NAME_SHOW);
  }
  // Private
  _maybeScheduleHide() {
    if (!this._config.autohide) {
      return;
    }
    if (this._hasMouseInteraction || this._hasKeyboardInteraction) {
      return;
    }
    this._timeout = setTimeout(() => {
      this.hide();
    }, this._config.delay);
  }
  _onInteraction(event, isInteracting) {
    switch (event.type) {
      case "mouseover":
      case "mouseout": {
        this._hasMouseInteraction = isInteracting;
        break;
      }
      case "focusin":
      case "focusout": {
        this._hasKeyboardInteraction = isInteracting;
        break;
      }
    }
    if (isInteracting) {
      this._clearTimeout();
      return;
    }
    const nextElement = event.relatedTarget;
    if (this._element === nextElement || this._element.contains(nextElement)) {
      return;
    }
    this._maybeScheduleHide();
  }
  _setListeners() {
    EventHandler.on(this._element, EVENT_MOUSEOVER, (event) => this._onInteraction(event, true));
    EventHandler.on(this._element, EVENT_MOUSEOUT, (event) => this._onInteraction(event, false));
    EventHandler.on(this._element, EVENT_FOCUSIN, (event) => this._onInteraction(event, true));
    EventHandler.on(this._element, EVENT_FOCUSOUT, (event) => this._onInteraction(event, false));
  }
  _clearTimeout() {
    clearTimeout(this._timeout);
    this._timeout = null;
  }
  // Static
  static jQueryInterface(config) {
    return this.each(function() {
      const data = _Toast.getOrCreateInstance(this, config);
      if (typeof config === "string") {
        if (typeof data[config] === "undefined") {
          throw new TypeError(`No method named "${config}"`);
        }
        data[config](this);
      }
    });
  }
};
enableDismissTrigger(Toast);
defineJQueryPlugin(Toast);

// app/javascript/application.js
var import_jquery_contextmenu3 = __toESM(require_jquery_contextMenu());

// node_modules/.pnpm/jquery-ui@1.14.1/node_modules/jquery-ui/ui/widgets/datepicker.js
init_shim_jquery();
(function(factory) {
  "use strict";
  if (typeof define === "function" && define.amd) {
    define([
      "jquery",
      "../version",
      "../keycode"
    ], factory);
  } else {
    factory(jQuery);
  }
})(function($7) {
  "use strict";
  $7.extend($7.ui, { datepicker: { version: "1.14.1" } });
  var datepicker_instActive;
  function datepicker_getZindex(elem) {
    var position, value;
    while (elem.length && elem[0] !== document) {
      position = elem.css("position");
      if (position === "absolute" || position === "relative" || position === "fixed") {
        value = parseInt(elem.css("zIndex"), 10);
        if (!isNaN(value) && value !== 0) {
          return value;
        }
      }
      elem = elem.parent();
    }
    return 0;
  }
  function Datepicker() {
    this._curInst = null;
    this._keyEvent = false;
    this._disabledInputs = [];
    this._datepickerShowing = false;
    this._inDialog = false;
    this._mainDivId = "ui-datepicker-div";
    this._inlineClass = "ui-datepicker-inline";
    this._appendClass = "ui-datepicker-append";
    this._triggerClass = "ui-datepicker-trigger";
    this._dialogClass = "ui-datepicker-dialog";
    this._disableClass = "ui-datepicker-disabled";
    this._unselectableClass = "ui-datepicker-unselectable";
    this._currentClass = "ui-datepicker-current-day";
    this._dayOverClass = "ui-datepicker-days-cell-over";
    this.regional = [];
    this.regional[""] = {
      // Default regional settings
      closeText: "Done",
      // Display text for close link
      prevText: "Prev",
      // Display text for previous month link
      nextText: "Next",
      // Display text for next month link
      currentText: "Today",
      // Display text for current month link
      monthNames: [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
      ],
      // Names of months for drop-down and formatting
      monthNamesShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
      // For formatting
      dayNames: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      // For formatting
      dayNamesShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      // For formatting
      dayNamesMin: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
      // Column headings for days starting at Sunday
      weekHeader: "Wk",
      // Column header for week of the year
      dateFormat: "mm/dd/yy",
      // See format options on parseDate
      firstDay: 0,
      // The first day of the week, Sun = 0, Mon = 1, ...
      isRTL: false,
      // True if right-to-left language, false if left-to-right
      showMonthAfterYear: false,
      // True if the year select precedes month, false for month then year
      yearSuffix: "",
      // Additional text to append to the year in the month headers,
      selectMonthLabel: "Select month",
      // Invisible label for month selector
      selectYearLabel: "Select year"
      // Invisible label for year selector
    };
    this._defaults = {
      // Global defaults for all the date picker instances
      showOn: "focus",
      // "focus" for popup on focus,
      // "button" for trigger button, or "both" for either
      showAnim: "fadeIn",
      // Name of jQuery animation for popup
      showOptions: {},
      // Options for enhanced animations
      defaultDate: null,
      // Used when field is blank: actual date,
      // +/-number for offset from today, null for today
      appendText: "",
      // Display text following the input box, e.g. showing the format
      buttonText: "...",
      // Text for trigger button
      buttonImage: "",
      // URL for trigger button image
      buttonImageOnly: false,
      // True if the image appears alone, false if it appears on a button
      hideIfNoPrevNext: false,
      // True to hide next/previous month links
      // if not applicable, false to just disable them
      navigationAsDateFormat: false,
      // True if date formatting applied to prev/today/next links
      gotoCurrent: false,
      // True if today link goes back to current selection instead
      changeMonth: false,
      // True if month can be selected directly, false if only prev/next
      changeYear: false,
      // True if year can be selected directly, false if only prev/next
      yearRange: "c-10:c+10",
      // Range of years to display in drop-down,
      // either relative to today's year (-nn:+nn), relative to currently displayed year
      // (c-nn:c+nn), absolute (nnnn:nnnn), or a combination of the above (nnnn:-n)
      showOtherMonths: false,
      // True to show dates in other months, false to leave blank
      selectOtherMonths: false,
      // True to allow selection of dates in other months, false for unselectable
      showWeek: false,
      // True to show week of the year, false to not show it
      calculateWeek: this.iso8601Week,
      // How to calculate the week of the year,
      // takes a Date and returns the number of the week for it
      shortYearCutoff: "+10",
      // Short year values < this are in the current century,
      // > this are in the previous century,
      // string value starting with "+" for current year + value
      minDate: null,
      // The earliest selectable date, or null for no limit
      maxDate: null,
      // The latest selectable date, or null for no limit
      duration: "fast",
      // Duration of display/closure
      beforeShowDay: null,
      // Function that takes a date and returns an array with
      // [0] = true if selectable, false if not, [1] = custom CSS class name(s) or "",
      // [2] = cell title (optional), e.g. $.datepicker.noWeekends
      beforeShow: null,
      // Function that takes an input field and
      // returns a set of custom settings for the date picker
      onSelect: null,
      // Define a callback function when a date is selected
      onChangeMonthYear: null,
      // Define a callback function when the month or year is changed
      onClose: null,
      // Define a callback function when the datepicker is closed
      onUpdateDatepicker: null,
      // Define a callback function when the datepicker is updated
      numberOfMonths: 1,
      // Number of months to show at a time
      showCurrentAtPos: 0,
      // The position in multipe months at which to show the current month (starting at 0)
      stepMonths: 1,
      // Number of months to step back/forward
      stepBigMonths: 12,
      // Number of months to step back/forward for the big links
      altField: "",
      // Selector for an alternate field to store selected dates into
      altFormat: "",
      // The date format to use for the alternate field
      constrainInput: true,
      // The input is constrained by the current date format
      showButtonPanel: false,
      // True to show button panel, false to not show it
      autoSize: false,
      // True to size the input for the date format, false to leave as is
      disabled: false
      // The initial disabled state
    };
    $7.extend(this._defaults, this.regional[""]);
    this.regional.en = $7.extend(true, {}, this.regional[""]);
    this.regional["en-US"] = $7.extend(true, {}, this.regional.en);
    this.dpDiv = datepicker_bindHover($7("<div id='" + this._mainDivId + "' class='ui-datepicker ui-widget ui-widget-content ui-helper-clearfix ui-corner-all'></div>"));
  }
  $7.extend(Datepicker.prototype, {
    /* Class name added to elements to indicate already configured with a date picker. */
    markerClassName: "hasDatepicker",
    //Keep track of the maximum number of rows displayed (see #7043)
    maxRows: 4,
    // TODO rename to "widget" when switching to widget factory
    _widgetDatepicker: function() {
      return this.dpDiv;
    },
    /* Override the default settings for all instances of the date picker.
     * @param  settings  object - the new settings to use as defaults (anonymous object)
     * @return the manager object
     */
    setDefaults: function(settings) {
      datepicker_extendRemove(this._defaults, settings || {});
      return this;
    },
    /* Attach the date picker to a jQuery selection.
     * @param  target	element - the target input field or division or span
     * @param  settings  object - the new settings to use for this date picker instance (anonymous)
     */
    _attachDatepicker: function(target, settings) {
      var nodeName, inline, inst;
      nodeName = target.nodeName.toLowerCase();
      inline = nodeName === "div" || nodeName === "span";
      if (!target.id) {
        this.uuid += 1;
        target.id = "dp" + this.uuid;
      }
      inst = this._newInst($7(target), inline);
      inst.settings = $7.extend({}, settings || {});
      if (nodeName === "input") {
        this._connectDatepicker(target, inst);
      } else if (inline) {
        this._inlineDatepicker(target, inst);
      }
    },
    /* Create a new instance object. */
    _newInst: function(target, inline) {
      var id = target[0].id.replace(/([^A-Za-z0-9_\-])/g, "\\\\$1");
      return {
        id,
        input: target,
        // associated target
        selectedDay: 0,
        selectedMonth: 0,
        selectedYear: 0,
        // current selection
        drawMonth: 0,
        drawYear: 0,
        // month being drawn
        inline,
        // is datepicker inline or not
        dpDiv: !inline ? this.dpDiv : (
          // presentation div
          datepicker_bindHover($7("<div class='" + this._inlineClass + " ui-datepicker ui-widget ui-widget-content ui-helper-clearfix ui-corner-all'></div>"))
        )
      };
    },
    /* Attach the date picker to an input field. */
    _connectDatepicker: function(target, inst) {
      var input = $7(target);
      inst.append = $7([]);
      inst.trigger = $7([]);
      if (input.hasClass(this.markerClassName)) {
        return;
      }
      this._attachments(input, inst);
      input.addClass(this.markerClassName).on("keydown", this._doKeyDown).on("keypress", this._doKeyPress).on("keyup", this._doKeyUp);
      this._autoSize(inst);
      $7.data(target, "datepicker", inst);
      if (inst.settings.disabled) {
        this._disableDatepicker(target);
      }
    },
    /* Make attachments based on settings. */
    _attachments: function(input, inst) {
      var showOn, buttonText, buttonImage, appendText = this._get(inst, "appendText"), isRTL2 = this._get(inst, "isRTL");
      if (inst.append) {
        inst.append.remove();
      }
      if (appendText) {
        inst.append = $7("<span>").addClass(this._appendClass).text(appendText);
        input[isRTL2 ? "before" : "after"](inst.append);
      }
      input.off("focus", this._showDatepicker);
      if (inst.trigger) {
        inst.trigger.remove();
      }
      showOn = this._get(inst, "showOn");
      if (showOn === "focus" || showOn === "both") {
        input.on("focus", this._showDatepicker);
      }
      if (showOn === "button" || showOn === "both") {
        buttonText = this._get(inst, "buttonText");
        buttonImage = this._get(inst, "buttonImage");
        if (this._get(inst, "buttonImageOnly")) {
          inst.trigger = $7("<img>").addClass(this._triggerClass).attr({
            src: buttonImage,
            alt: buttonText,
            title: buttonText
          });
        } else {
          inst.trigger = $7("<button type='button'>").addClass(this._triggerClass);
          if (buttonImage) {
            inst.trigger.html(
              $7("<img>").attr({
                src: buttonImage,
                alt: buttonText,
                title: buttonText
              })
            );
          } else {
            inst.trigger.text(buttonText);
          }
        }
        input[isRTL2 ? "before" : "after"](inst.trigger);
        inst.trigger.on("click", function() {
          if ($7.datepicker._datepickerShowing && $7.datepicker._lastInput === input[0]) {
            $7.datepicker._hideDatepicker();
          } else if ($7.datepicker._datepickerShowing && $7.datepicker._lastInput !== input[0]) {
            $7.datepicker._hideDatepicker();
            $7.datepicker._showDatepicker(input[0]);
          } else {
            $7.datepicker._showDatepicker(input[0]);
          }
          return false;
        });
      }
    },
    /* Apply the maximum length for the date format. */
    _autoSize: function(inst) {
      if (this._get(inst, "autoSize") && !inst.inline) {
        var findMax, max2, maxI, i, date = new Date(2009, 12 - 1, 20), dateFormat = this._get(inst, "dateFormat");
        if (dateFormat.match(/[DM]/)) {
          findMax = function(names) {
            max2 = 0;
            maxI = 0;
            for (i = 0; i < names.length; i++) {
              if (names[i].length > max2) {
                max2 = names[i].length;
                maxI = i;
              }
            }
            return maxI;
          };
          date.setMonth(findMax(this._get(inst, dateFormat.match(/MM/) ? "monthNames" : "monthNamesShort")));
          date.setDate(findMax(this._get(inst, dateFormat.match(/DD/) ? "dayNames" : "dayNamesShort")) + 20 - date.getDay());
        }
        inst.input.attr("size", this._formatDate(inst, date).length);
      }
    },
    /* Attach an inline date picker to a div. */
    _inlineDatepicker: function(target, inst) {
      var divSpan = $7(target);
      if (divSpan.hasClass(this.markerClassName)) {
        return;
      }
      divSpan.addClass(this.markerClassName).append(inst.dpDiv);
      $7.data(target, "datepicker", inst);
      this._setDate(inst, this._getDefaultDate(inst), true);
      this._updateDatepicker(inst);
      this._updateAlternate(inst);
      if (inst.settings.disabled) {
        this._disableDatepicker(target);
      }
      inst.dpDiv.css("display", "block");
    },
    /* Pop-up the date picker in a "dialog" box.
     * @param  input element - ignored
     * @param  date	string or Date - the initial date to display
     * @param  onSelect  function - the function to call when a date is selected
     * @param  settings  object - update the dialog date picker instance's settings (anonymous object)
     * @param  pos int[2] - coordinates for the dialog's position within the screen or
     *					event - with x/y coordinates or
     *					leave empty for default (screen centre)
     * @return the manager object
     */
    _dialogDatepicker: function(input, date, onSelect, settings, pos) {
      var id, browserWidth, browserHeight, scrollX, scrollY, inst = this._dialogInst;
      if (!inst) {
        this.uuid += 1;
        id = "dp" + this.uuid;
        this._dialogInput = $7("<input type='text' id='" + id + "' style='position: absolute; top: -100px; width: 0px;'/>");
        this._dialogInput.on("keydown", this._doKeyDown);
        $7("body").append(this._dialogInput);
        inst = this._dialogInst = this._newInst(this._dialogInput, false);
        inst.settings = {};
        $7.data(this._dialogInput[0], "datepicker", inst);
      }
      datepicker_extendRemove(inst.settings, settings || {});
      date = date && date.constructor === Date ? this._formatDate(inst, date) : date;
      this._dialogInput.val(date);
      this._pos = pos ? pos.length ? pos : [pos.pageX, pos.pageY] : null;
      if (!this._pos) {
        browserWidth = document.documentElement.clientWidth;
        browserHeight = document.documentElement.clientHeight;
        scrollX = document.documentElement.scrollLeft || document.body.scrollLeft;
        scrollY = document.documentElement.scrollTop || document.body.scrollTop;
        this._pos = // should use actual width/height below
        [browserWidth / 2 - 100 + scrollX, browserHeight / 2 - 150 + scrollY];
      }
      this._dialogInput.css("left", this._pos[0] + 20 + "px").css("top", this._pos[1] + "px");
      inst.settings.onSelect = onSelect;
      this._inDialog = true;
      this.dpDiv.addClass(this._dialogClass);
      this._showDatepicker(this._dialogInput[0]);
      if ($7.blockUI) {
        $7.blockUI(this.dpDiv);
      }
      $7.data(this._dialogInput[0], "datepicker", inst);
      return this;
    },
    /* Detach a datepicker from its control.
     * @param  target	element - the target input field or division or span
     */
    _destroyDatepicker: function(target) {
      var nodeName, $target = $7(target), inst = $7.data(target, "datepicker");
      if (!$target.hasClass(this.markerClassName)) {
        return;
      }
      nodeName = target.nodeName.toLowerCase();
      $7.removeData(target, "datepicker");
      if (nodeName === "input") {
        inst.append.remove();
        inst.trigger.remove();
        $target.removeClass(this.markerClassName).off("focus", this._showDatepicker).off("keydown", this._doKeyDown).off("keypress", this._doKeyPress).off("keyup", this._doKeyUp);
      } else if (nodeName === "div" || nodeName === "span") {
        $target.removeClass(this.markerClassName).empty();
      }
      $7.datepicker._hideDatepicker();
      if (datepicker_instActive === inst) {
        datepicker_instActive = null;
        this._curInst = null;
      }
    },
    /* Enable the date picker to a jQuery selection.
     * @param  target	element - the target input field or division or span
     */
    _enableDatepicker: function(target) {
      var nodeName, inline, $target = $7(target), inst = $7.data(target, "datepicker");
      if (!$target.hasClass(this.markerClassName)) {
        return;
      }
      nodeName = target.nodeName.toLowerCase();
      if (nodeName === "input") {
        target.disabled = false;
        inst.trigger.filter("button").each(function() {
          this.disabled = false;
        }).end().filter("img").css({ opacity: "1.0", cursor: "" });
      } else if (nodeName === "div" || nodeName === "span") {
        inline = $target.children("." + this._inlineClass);
        inline.children().removeClass("ui-state-disabled");
        inline.find("select.ui-datepicker-month, select.ui-datepicker-year").prop("disabled", false);
      }
      this._disabledInputs = $7.map(
        this._disabledInputs,
        // Delete entry
        function(value) {
          return value === target ? null : value;
        }
      );
    },
    /* Disable the date picker to a jQuery selection.
     * @param  target	element - the target input field or division or span
     */
    _disableDatepicker: function(target) {
      var nodeName, inline, $target = $7(target), inst = $7.data(target, "datepicker");
      if (!$target.hasClass(this.markerClassName)) {
        return;
      }
      nodeName = target.nodeName.toLowerCase();
      if (nodeName === "input") {
        target.disabled = true;
        inst.trigger.filter("button").each(function() {
          this.disabled = true;
        }).end().filter("img").css({ opacity: "0.5", cursor: "default" });
      } else if (nodeName === "div" || nodeName === "span") {
        inline = $target.children("." + this._inlineClass);
        inline.children().addClass("ui-state-disabled");
        inline.find("select.ui-datepicker-month, select.ui-datepicker-year").prop("disabled", true);
      }
      this._disabledInputs = $7.map(
        this._disabledInputs,
        // Delete entry
        function(value) {
          return value === target ? null : value;
        }
      );
      this._disabledInputs[this._disabledInputs.length] = target;
    },
    /* Is the first field in a jQuery collection disabled as a datepicker?
     * @param  target	element - the target input field or division or span
     * @return boolean - true if disabled, false if enabled
     */
    _isDisabledDatepicker: function(target) {
      if (!target) {
        return false;
      }
      for (var i = 0; i < this._disabledInputs.length; i++) {
        if (this._disabledInputs[i] === target) {
          return true;
        }
      }
      return false;
    },
    /* Retrieve the instance data for the target control.
     * @param  target  element - the target input field or division or span
     * @return  object - the associated instance data
     * @throws  error if a jQuery problem getting data
     */
    _getInst: function(target) {
      try {
        return $7.data(target, "datepicker");
      } catch (err) {
        throw "Missing instance data for this datepicker";
      }
    },
    /* Update or retrieve the settings for a date picker attached to an input field or division.
     * @param  target  element - the target input field or division or span
     * @param  name	object - the new settings to update or
     *				string - the name of the setting to change or retrieve,
     *				when retrieving also "all" for all instance settings or
     *				"defaults" for all global defaults
     * @param  value   any - the new value for the setting
     *				(omit if above is an object or to retrieve a value)
     */
    _optionDatepicker: function(target, name, value) {
      var settings, date, minDate, maxDate, inst = this._getInst(target);
      if (arguments.length === 2 && typeof name === "string") {
        return name === "defaults" ? $7.extend({}, $7.datepicker._defaults) : inst ? name === "all" ? $7.extend({}, inst.settings) : this._get(inst, name) : null;
      }
      settings = name || {};
      if (typeof name === "string") {
        settings = {};
        settings[name] = value;
      }
      if (inst) {
        if (this._curInst === inst) {
          this._hideDatepicker();
        }
        date = this._getDateDatepicker(target, true);
        minDate = this._getMinMaxDate(inst, "min");
        maxDate = this._getMinMaxDate(inst, "max");
        datepicker_extendRemove(inst.settings, settings);
        if (minDate !== null && settings.dateFormat !== void 0 && settings.minDate === void 0) {
          inst.settings.minDate = this._formatDate(inst, minDate);
        }
        if (maxDate !== null && settings.dateFormat !== void 0 && settings.maxDate === void 0) {
          inst.settings.maxDate = this._formatDate(inst, maxDate);
        }
        if ("disabled" in settings) {
          if (settings.disabled) {
            this._disableDatepicker(target);
          } else {
            this._enableDatepicker(target);
          }
        }
        this._attachments($7(target), inst);
        this._autoSize(inst);
        this._setDate(inst, date);
        this._updateAlternate(inst);
        this._updateDatepicker(inst);
      }
    },
    // Change method deprecated
    _changeDatepicker: function(target, name, value) {
      this._optionDatepicker(target, name, value);
    },
    /* Redraw the date picker attached to an input field or division.
     * @param  target  element - the target input field or division or span
     */
    _refreshDatepicker: function(target) {
      var inst = this._getInst(target);
      if (inst) {
        this._updateDatepicker(inst);
      }
    },
    /* Set the dates for a jQuery selection.
     * @param  target element - the target input field or division or span
     * @param  date	Date - the new date
     */
    _setDateDatepicker: function(target, date) {
      var inst = this._getInst(target);
      if (inst) {
        this._setDate(inst, date);
        this._updateDatepicker(inst);
        this._updateAlternate(inst);
      }
    },
    /* Get the date(s) for the first entry in a jQuery selection.
     * @param  target element - the target input field or division or span
     * @param  noDefault boolean - true if no default date is to be used
     * @return Date - the current date
     */
    _getDateDatepicker: function(target, noDefault) {
      var inst = this._getInst(target);
      if (inst && !inst.inline) {
        this._setDateFromField(inst, noDefault);
      }
      return inst ? this._getDate(inst) : null;
    },
    /* Handle keystrokes. */
    _doKeyDown: function(event) {
      var onSelect, dateStr, sel, inst = $7.datepicker._getInst(event.target), handled = true, isRTL2 = inst.dpDiv.is(".ui-datepicker-rtl");
      inst._keyEvent = true;
      if ($7.datepicker._datepickerShowing) {
        switch (event.keyCode) {
          case 9:
            $7.datepicker._hideDatepicker();
            handled = false;
            break;
          // hide on tab out
          case 13:
            sel = $7("td." + $7.datepicker._dayOverClass + ":not(." + $7.datepicker._currentClass + ")", inst.dpDiv);
            if (sel[0]) {
              $7.datepicker._selectDay(event.target, inst.selectedMonth, inst.selectedYear, sel[0]);
            }
            onSelect = $7.datepicker._get(inst, "onSelect");
            if (onSelect) {
              dateStr = $7.datepicker._formatDate(inst);
              onSelect.apply(inst.input ? inst.input[0] : null, [dateStr, inst]);
            } else {
              $7.datepicker._hideDatepicker();
            }
            return false;
          // don't submit the form
          case 27:
            $7.datepicker._hideDatepicker();
            break;
          // hide on escape
          case 33:
            $7.datepicker._adjustDate(event.target, event.ctrlKey ? -$7.datepicker._get(inst, "stepBigMonths") : -$7.datepicker._get(inst, "stepMonths"), "M");
            break;
          // previous month/year on page up/+ ctrl
          case 34:
            $7.datepicker._adjustDate(event.target, event.ctrlKey ? +$7.datepicker._get(inst, "stepBigMonths") : +$7.datepicker._get(inst, "stepMonths"), "M");
            break;
          // next month/year on page down/+ ctrl
          case 35:
            if (event.ctrlKey || event.metaKey) {
              $7.datepicker._clearDate(event.target);
            }
            handled = event.ctrlKey || event.metaKey;
            break;
          // clear on ctrl or command +end
          case 36:
            if (event.ctrlKey || event.metaKey) {
              $7.datepicker._gotoToday(event.target);
            }
            handled = event.ctrlKey || event.metaKey;
            break;
          // current on ctrl or command +home
          case 37:
            if (event.ctrlKey || event.metaKey) {
              $7.datepicker._adjustDate(event.target, isRTL2 ? 1 : -1, "D");
            }
            handled = event.ctrlKey || event.metaKey;
            if (event.originalEvent.altKey) {
              $7.datepicker._adjustDate(event.target, event.ctrlKey ? -$7.datepicker._get(inst, "stepBigMonths") : -$7.datepicker._get(inst, "stepMonths"), "M");
            }
            break;
          case 38:
            if (event.ctrlKey || event.metaKey) {
              $7.datepicker._adjustDate(event.target, -7, "D");
            }
            handled = event.ctrlKey || event.metaKey;
            break;
          // -1 week on ctrl or command +up
          case 39:
            if (event.ctrlKey || event.metaKey) {
              $7.datepicker._adjustDate(event.target, isRTL2 ? -1 : 1, "D");
            }
            handled = event.ctrlKey || event.metaKey;
            if (event.originalEvent.altKey) {
              $7.datepicker._adjustDate(event.target, event.ctrlKey ? +$7.datepicker._get(inst, "stepBigMonths") : +$7.datepicker._get(inst, "stepMonths"), "M");
            }
            break;
          case 40:
            if (event.ctrlKey || event.metaKey) {
              $7.datepicker._adjustDate(event.target, 7, "D");
            }
            handled = event.ctrlKey || event.metaKey;
            break;
          // +1 week on ctrl or command +down
          default:
            handled = false;
        }
      } else if (event.keyCode === 36 && event.ctrlKey) {
        $7.datepicker._showDatepicker(this);
      } else {
        handled = false;
      }
      if (handled) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    /* Filter entered characters - based on date format. */
    _doKeyPress: function(event) {
      var chars, chr, inst = $7.datepicker._getInst(event.target);
      if ($7.datepicker._get(inst, "constrainInput")) {
        chars = $7.datepicker._possibleChars($7.datepicker._get(inst, "dateFormat"));
        chr = String.fromCharCode(event.charCode == null ? event.keyCode : event.charCode);
        return event.ctrlKey || event.metaKey || (chr < " " || !chars || chars.indexOf(chr) > -1);
      }
    },
    /* Synchronise manual entry and field/alternate field. */
    _doKeyUp: function(event) {
      var date, inst = $7.datepicker._getInst(event.target);
      if (inst.input.val() !== inst.lastVal) {
        try {
          date = $7.datepicker.parseDate(
            $7.datepicker._get(inst, "dateFormat"),
            inst.input ? inst.input.val() : null,
            $7.datepicker._getFormatConfig(inst)
          );
          if (date) {
            $7.datepicker._setDateFromField(inst);
            $7.datepicker._updateAlternate(inst);
            $7.datepicker._updateDatepicker(inst);
          }
        } catch (err) {
        }
      }
      return true;
    },
    /* Pop-up the date picker for a given input field.
     * If false returned from beforeShow event handler do not show.
     * @param  input  element - the input field attached to the date picker or
     *					event - if triggered by focus
     */
    _showDatepicker: function(input) {
      input = input.target || input;
      if (input.nodeName.toLowerCase() !== "input") {
        input = $7("input", input.parentNode)[0];
      }
      if ($7.datepicker._isDisabledDatepicker(input) || $7.datepicker._lastInput === input) {
        return;
      }
      var inst, beforeShow, beforeShowSettings, isFixed, offset2, showAnim, duration;
      inst = $7.datepicker._getInst(input);
      if ($7.datepicker._curInst && $7.datepicker._curInst !== inst) {
        $7.datepicker._curInst.dpDiv.stop(true, true);
        if (inst && $7.datepicker._datepickerShowing) {
          $7.datepicker._hideDatepicker($7.datepicker._curInst.input[0]);
        }
      }
      beforeShow = $7.datepicker._get(inst, "beforeShow");
      beforeShowSettings = beforeShow ? beforeShow.apply(input, [input, inst]) : {};
      if (beforeShowSettings === false) {
        return;
      }
      datepicker_extendRemove(inst.settings, beforeShowSettings);
      inst.lastVal = null;
      $7.datepicker._lastInput = input;
      $7.datepicker._setDateFromField(inst);
      if ($7.datepicker._inDialog) {
        input.value = "";
      }
      if (!$7.datepicker._pos) {
        $7.datepicker._pos = $7.datepicker._findPos(input);
        $7.datepicker._pos[1] += input.offsetHeight;
      }
      isFixed = false;
      $7(input).parents().each(function() {
        isFixed |= $7(this).css("position") === "fixed";
        return !isFixed;
      });
      offset2 = { left: $7.datepicker._pos[0], top: $7.datepicker._pos[1] };
      $7.datepicker._pos = null;
      inst.dpDiv.empty();
      inst.dpDiv.css({ position: "absolute", display: "block", top: "-1000px" });
      $7.datepicker._updateDatepicker(inst);
      offset2 = $7.datepicker._checkOffset(inst, offset2, isFixed);
      inst.dpDiv.css({
        position: $7.datepicker._inDialog && $7.blockUI ? "static" : isFixed ? "fixed" : "absolute",
        display: "none",
        left: offset2.left + "px",
        top: offset2.top + "px"
      });
      if (!inst.inline) {
        showAnim = $7.datepicker._get(inst, "showAnim");
        duration = $7.datepicker._get(inst, "duration");
        inst.dpDiv.css("z-index", datepicker_getZindex($7(input)) + 1);
        $7.datepicker._datepickerShowing = true;
        if ($7.effects && $7.effects.effect[showAnim]) {
          inst.dpDiv.show(showAnim, $7.datepicker._get(inst, "showOptions"), duration);
        } else {
          inst.dpDiv[showAnim || "show"](showAnim ? duration : null);
        }
        if ($7.datepicker._shouldFocusInput(inst)) {
          inst.input.trigger("focus");
        }
        $7.datepicker._curInst = inst;
      }
    },
    /* Generate the date picker content. */
    _updateDatepicker: function(inst) {
      this.maxRows = 4;
      datepicker_instActive = inst;
      inst.dpDiv.empty().append(this._generateHTML(inst));
      this._attachHandlers(inst);
      var origyearshtml, numMonths = this._getNumberOfMonths(inst), cols = numMonths[1], width = 17, activeCell = inst.dpDiv.find("." + this._dayOverClass + " a"), onUpdateDatepicker = $7.datepicker._get(inst, "onUpdateDatepicker");
      if (activeCell.length > 0) {
        datepicker_handleMouseover.apply(activeCell.get(0));
      }
      inst.dpDiv.removeClass("ui-datepicker-multi-2 ui-datepicker-multi-3 ui-datepicker-multi-4").width("");
      if (cols > 1) {
        inst.dpDiv.addClass("ui-datepicker-multi-" + cols).css("width", width * cols + "em");
      }
      inst.dpDiv[(numMonths[0] !== 1 || numMonths[1] !== 1 ? "add" : "remove") + "Class"]("ui-datepicker-multi");
      inst.dpDiv[(this._get(inst, "isRTL") ? "add" : "remove") + "Class"]("ui-datepicker-rtl");
      if (inst === $7.datepicker._curInst && $7.datepicker._datepickerShowing && $7.datepicker._shouldFocusInput(inst)) {
        inst.input.trigger("focus");
      }
      if (inst.yearshtml) {
        origyearshtml = inst.yearshtml;
        setTimeout(function() {
          if (origyearshtml === inst.yearshtml && inst.yearshtml) {
            inst.dpDiv.find("select.ui-datepicker-year").first().replaceWith(inst.yearshtml);
          }
          origyearshtml = inst.yearshtml = null;
        }, 0);
      }
      if (onUpdateDatepicker) {
        onUpdateDatepicker.apply(inst.input ? inst.input[0] : null, [inst]);
      }
    },
    _shouldFocusInput: function(inst) {
      return inst.input && inst.input.is(":visible") && !inst.input.is(":disabled");
    },
    /* Check positioning to remain on screen. */
    _checkOffset: function(inst, offset2, isFixed) {
      var dpWidth = inst.dpDiv.outerWidth(), dpHeight = inst.dpDiv.outerHeight(), inputWidth = inst.input ? inst.input.outerWidth() : 0, inputHeight = inst.input ? inst.input.outerHeight() : 0, viewWidth = document.documentElement.clientWidth + (isFixed ? 0 : $7(document).scrollLeft()), viewHeight = document.documentElement.clientHeight + (isFixed ? 0 : $7(document).scrollTop());
      offset2.left -= this._get(inst, "isRTL") ? dpWidth - inputWidth : 0;
      offset2.left -= isFixed && offset2.left === inst.input.offset().left ? $7(document).scrollLeft() : 0;
      offset2.top -= isFixed && offset2.top === inst.input.offset().top + inputHeight ? $7(document).scrollTop() : 0;
      offset2.left -= Math.min(offset2.left, offset2.left + dpWidth > viewWidth && viewWidth > dpWidth ? Math.abs(offset2.left + dpWidth - viewWidth) : 0);
      offset2.top -= Math.min(offset2.top, offset2.top + dpHeight > viewHeight && viewHeight > dpHeight ? Math.abs(dpHeight + inputHeight) : 0);
      return offset2;
    },
    /* Find an object's position on the screen. */
    _findPos: function(obj) {
      var position, inst = this._getInst(obj), isRTL2 = this._get(inst, "isRTL");
      while (obj && (obj.type === "hidden" || obj.nodeType !== 1 || $7.expr.pseudos.hidden(obj))) {
        obj = obj[isRTL2 ? "previousSibling" : "nextSibling"];
      }
      position = $7(obj).offset();
      return [position.left, position.top];
    },
    /* Hide the date picker from view.
     * @param  input  element - the input field attached to the date picker
     */
    _hideDatepicker: function(input) {
      var showAnim, duration, postProcess, onClose, inst = this._curInst;
      if (!inst || input && inst !== $7.data(input, "datepicker")) {
        return;
      }
      if (this._datepickerShowing) {
        showAnim = this._get(inst, "showAnim");
        duration = this._get(inst, "duration");
        postProcess = function() {
          $7.datepicker._tidyDialog(inst);
        };
        if ($7.effects && $7.effects.effect[showAnim]) {
          inst.dpDiv.hide(showAnim, $7.datepicker._get(inst, "showOptions"), duration, postProcess);
        } else {
          inst.dpDiv[showAnim === "slideDown" ? "slideUp" : showAnim === "fadeIn" ? "fadeOut" : "hide"](showAnim ? duration : null, postProcess);
        }
        if (!showAnim) {
          postProcess();
        }
        this._datepickerShowing = false;
        onClose = this._get(inst, "onClose");
        if (onClose) {
          onClose.apply(inst.input ? inst.input[0] : null, [inst.input ? inst.input.val() : "", inst]);
        }
        this._lastInput = null;
        if (this._inDialog) {
          this._dialogInput.css({ position: "absolute", left: "0", top: "-100px" });
          if ($7.blockUI) {
            $7.unblockUI();
            $7("body").append(this.dpDiv);
          }
        }
        this._inDialog = false;
      }
    },
    /* Tidy up after a dialog display. */
    _tidyDialog: function(inst) {
      inst.dpDiv.removeClass(this._dialogClass).off(".ui-datepicker-calendar");
    },
    /* Close date picker if clicked elsewhere. */
    _checkExternalClick: function(event) {
      if (!$7.datepicker._curInst) {
        return;
      }
      var $target = $7(event.target), inst = $7.datepicker._getInst($target[0]);
      if ($target[0].id !== $7.datepicker._mainDivId && $target.parents("#" + $7.datepicker._mainDivId).length === 0 && !$target.hasClass($7.datepicker.markerClassName) && !$target.closest("." + $7.datepicker._triggerClass).length && $7.datepicker._datepickerShowing && !($7.datepicker._inDialog && $7.blockUI) || $target.hasClass($7.datepicker.markerClassName) && $7.datepicker._curInst !== inst) {
        $7.datepicker._hideDatepicker();
      }
    },
    /* Adjust one of the date sub-fields. */
    _adjustDate: function(id, offset2, period) {
      var target = $7(id), inst = this._getInst(target[0]);
      if (this._isDisabledDatepicker(target[0])) {
        return;
      }
      this._adjustInstDate(inst, offset2, period);
      this._updateDatepicker(inst);
    },
    /* Action for current link. */
    _gotoToday: function(id) {
      var date, target = $7(id), inst = this._getInst(target[0]);
      if (this._get(inst, "gotoCurrent") && inst.currentDay) {
        inst.selectedDay = inst.currentDay;
        inst.drawMonth = inst.selectedMonth = inst.currentMonth;
        inst.drawYear = inst.selectedYear = inst.currentYear;
      } else {
        date = /* @__PURE__ */ new Date();
        inst.selectedDay = date.getDate();
        inst.drawMonth = inst.selectedMonth = date.getMonth();
        inst.drawYear = inst.selectedYear = date.getFullYear();
      }
      this._notifyChange(inst);
      this._adjustDate(target);
    },
    /* Action for selecting a new month/year. */
    _selectMonthYear: function(id, select, period) {
      var target = $7(id), inst = this._getInst(target[0]);
      inst["selected" + (period === "M" ? "Month" : "Year")] = inst["draw" + (period === "M" ? "Month" : "Year")] = parseInt(select.options[select.selectedIndex].value, 10);
      this._notifyChange(inst);
      this._adjustDate(target);
    },
    /* Action for selecting a day. */
    _selectDay: function(id, month, year, td) {
      var inst, target = $7(id);
      if ($7(td).hasClass(this._unselectableClass) || this._isDisabledDatepicker(target[0])) {
        return;
      }
      inst = this._getInst(target[0]);
      inst.selectedDay = inst.currentDay = parseInt($7("a", td).attr("data-date"));
      inst.selectedMonth = inst.currentMonth = month;
      inst.selectedYear = inst.currentYear = year;
      this._selectDate(id, this._formatDate(
        inst,
        inst.currentDay,
        inst.currentMonth,
        inst.currentYear
      ));
    },
    /* Erase the input field and hide the date picker. */
    _clearDate: function(id) {
      var target = $7(id);
      this._selectDate(target, "");
    },
    /* Update the input field with the selected date. */
    _selectDate: function(id, dateStr) {
      var onSelect, target = $7(id), inst = this._getInst(target[0]);
      dateStr = dateStr != null ? dateStr : this._formatDate(inst);
      if (inst.input) {
        inst.input.val(dateStr);
      }
      this._updateAlternate(inst);
      onSelect = this._get(inst, "onSelect");
      if (onSelect) {
        onSelect.apply(inst.input ? inst.input[0] : null, [dateStr, inst]);
      } else if (inst.input) {
        inst.input.trigger("change");
      }
      if (inst.inline) {
        this._updateDatepicker(inst);
      } else {
        this._hideDatepicker();
        this._lastInput = inst.input[0];
        if (typeof inst.input[0] !== "object") {
          inst.input.trigger("focus");
        }
        this._lastInput = null;
      }
    },
    /* Update any alternate field to synchronise with the main field. */
    _updateAlternate: function(inst) {
      var altFormat, date, dateStr, altField = this._get(inst, "altField");
      if (altField) {
        altFormat = this._get(inst, "altFormat") || this._get(inst, "dateFormat");
        date = this._getDate(inst);
        dateStr = this.formatDate(altFormat, date, this._getFormatConfig(inst));
        $7(document).find(altField).val(dateStr);
      }
    },
    /* Set as beforeShowDay function to prevent selection of weekends.
     * @param  date  Date - the date to customise
     * @return [boolean, string] - is this date selectable?, what is its CSS class?
     */
    noWeekends: function(date) {
      var day = date.getDay();
      return [day > 0 && day < 6, ""];
    },
    /* Set as calculateWeek to determine the week of the year based on the ISO 8601 definition.
     * @param  date  Date - the date to get the week for
     * @return  number - the number of the week within the year that contains this date
     */
    iso8601Week: function(date) {
      var time, checkDate = new Date(date.getTime());
      checkDate.setDate(checkDate.getDate() + 4 - (checkDate.getDay() || 7));
      time = checkDate.getTime();
      checkDate.setMonth(0);
      checkDate.setDate(1);
      return Math.floor(Math.round((time - checkDate) / 864e5) / 7) + 1;
    },
    /* Parse a string value into a date object.
     * See formatDate below for the possible formats.
     *
     * @param  format string - the expected format of the date
     * @param  value string - the date in the above format
     * @param  settings Object - attributes include:
     *					shortYearCutoff  number - the cutoff year for determining the century (optional)
     *					dayNamesShort	string[7] - abbreviated names of the days from Sunday (optional)
     *					dayNames		string[7] - names of the days from Sunday (optional)
     *					monthNamesShort string[12] - abbreviated names of the months (optional)
     *					monthNames		string[12] - names of the months (optional)
     * @return  Date - the extracted date value or null if value is blank
     */
    parseDate: function(format, value, settings) {
      if (format == null || value == null) {
        throw "Invalid arguments";
      }
      value = typeof value === "object" ? value.toString() : value + "";
      if (value === "") {
        return null;
      }
      var iFormat, dim, extra, iValue = 0, shortYearCutoffTemp = (settings ? settings.shortYearCutoff : null) || this._defaults.shortYearCutoff, shortYearCutoff = typeof shortYearCutoffTemp !== "string" ? shortYearCutoffTemp : (/* @__PURE__ */ new Date()).getFullYear() % 100 + parseInt(shortYearCutoffTemp, 10), dayNamesShort = (settings ? settings.dayNamesShort : null) || this._defaults.dayNamesShort, dayNames = (settings ? settings.dayNames : null) || this._defaults.dayNames, monthNamesShort = (settings ? settings.monthNamesShort : null) || this._defaults.monthNamesShort, monthNames = (settings ? settings.monthNames : null) || this._defaults.monthNames, year = -1, month = -1, day = -1, doy = -1, literal = false, date, lookAhead = function(match) {
        var matches = iFormat + 1 < format.length && format.charAt(iFormat + 1) === match;
        if (matches) {
          iFormat++;
        }
        return matches;
      }, getNumber = function(match) {
        var isDoubled = lookAhead(match), size = match === "@" ? 14 : match === "!" ? 20 : match === "y" && isDoubled ? 4 : match === "o" ? 3 : 2, minSize = match === "y" ? size : 1, digits = new RegExp("^\\d{" + minSize + "," + size + "}"), num = value.substring(iValue).match(digits);
        if (!num) {
          throw "Missing number at position " + iValue;
        }
        iValue += num[0].length;
        return parseInt(num[0], 10);
      }, getName = function(match, shortNames, longNames) {
        var index = -1, names = $7.map(lookAhead(match) ? longNames : shortNames, function(v, k) {
          return [[k, v]];
        }).sort(function(a, b) {
          return -(a[1].length - b[1].length);
        });
        $7.each(names, function(i, pair) {
          var name = pair[1];
          if (value.substr(iValue, name.length).toLowerCase() === name.toLowerCase()) {
            index = pair[0];
            iValue += name.length;
            return false;
          }
        });
        if (index !== -1) {
          return index + 1;
        } else {
          throw "Unknown name at position " + iValue;
        }
      }, checkLiteral = function() {
        if (value.charAt(iValue) !== format.charAt(iFormat)) {
          throw "Unexpected literal at position " + iValue;
        }
        iValue++;
      };
      for (iFormat = 0; iFormat < format.length; iFormat++) {
        if (literal) {
          if (format.charAt(iFormat) === "'" && !lookAhead("'")) {
            literal = false;
          } else {
            checkLiteral();
          }
        } else {
          switch (format.charAt(iFormat)) {
            case "d":
              day = getNumber("d");
              break;
            case "D":
              getName("D", dayNamesShort, dayNames);
              break;
            case "o":
              doy = getNumber("o");
              break;
            case "m":
              month = getNumber("m");
              break;
            case "M":
              month = getName("M", monthNamesShort, monthNames);
              break;
            case "y":
              year = getNumber("y");
              break;
            case "@":
              date = new Date(getNumber("@"));
              year = date.getFullYear();
              month = date.getMonth() + 1;
              day = date.getDate();
              break;
            case "!":
              date = new Date((getNumber("!") - this._ticksTo1970) / 1e4);
              year = date.getFullYear();
              month = date.getMonth() + 1;
              day = date.getDate();
              break;
            case "'":
              if (lookAhead("'")) {
                checkLiteral();
              } else {
                literal = true;
              }
              break;
            default:
              checkLiteral();
          }
        }
      }
      if (iValue < value.length) {
        extra = value.substr(iValue);
        if (!/^\s+/.test(extra)) {
          throw "Extra/unparsed characters found in date: " + extra;
        }
      }
      if (year === -1) {
        year = (/* @__PURE__ */ new Date()).getFullYear();
      } else if (year < 100) {
        year += (/* @__PURE__ */ new Date()).getFullYear() - (/* @__PURE__ */ new Date()).getFullYear() % 100 + (year <= shortYearCutoff ? 0 : -100);
      }
      if (doy > -1) {
        month = 1;
        day = doy;
        do {
          dim = this._getDaysInMonth(year, month - 1);
          if (day <= dim) {
            break;
          }
          month++;
          day -= dim;
        } while (true);
      }
      date = this._daylightSavingAdjust(new Date(year, month - 1, day));
      if (date.getFullYear() !== year || date.getMonth() + 1 !== month || date.getDate() !== day) {
        throw "Invalid date";
      }
      return date;
    },
    /* Standard date formats. */
    ATOM: "yy-mm-dd",
    // RFC 3339 (ISO 8601)
    COOKIE: "D, dd M yy",
    ISO_8601: "yy-mm-dd",
    RFC_822: "D, d M y",
    RFC_850: "DD, dd-M-y",
    RFC_1036: "D, d M y",
    RFC_1123: "D, d M yy",
    RFC_2822: "D, d M yy",
    RSS: "D, d M y",
    // RFC 822
    TICKS: "!",
    TIMESTAMP: "@",
    W3C: "yy-mm-dd",
    // ISO 8601
    _ticksTo1970: ((1970 - 1) * 365 + Math.floor(1970 / 4) - Math.floor(1970 / 100) + Math.floor(1970 / 400)) * 24 * 60 * 60 * 1e7,
    /* Format a date object into a string value.
     * The format can be combinations of the following:
     * d  - day of month (no leading zero)
     * dd - day of month (two digit)
     * o  - day of year (no leading zeros)
     * oo - day of year (three digit)
     * D  - day name short
     * DD - day name long
     * m  - month of year (no leading zero)
     * mm - month of year (two digit)
     * M  - month name short
     * MM - month name long
     * y  - year (two digit)
     * yy - year (four digit)
     * @ - Unix timestamp (ms since 01/01/1970)
     * ! - Windows ticks (100ns since 01/01/0001)
     * "..." - literal text
     * '' - single quote
     *
     * @param  format string - the desired format of the date
     * @param  date Date - the date value to format
     * @param  settings Object - attributes include:
     *					dayNamesShort	string[7] - abbreviated names of the days from Sunday (optional)
     *					dayNames		string[7] - names of the days from Sunday (optional)
     *					monthNamesShort string[12] - abbreviated names of the months (optional)
     *					monthNames		string[12] - names of the months (optional)
     * @return  string - the date in the above format
     */
    formatDate: function(format, date, settings) {
      if (!date) {
        return "";
      }
      var iFormat, dayNamesShort = (settings ? settings.dayNamesShort : null) || this._defaults.dayNamesShort, dayNames = (settings ? settings.dayNames : null) || this._defaults.dayNames, monthNamesShort = (settings ? settings.monthNamesShort : null) || this._defaults.monthNamesShort, monthNames = (settings ? settings.monthNames : null) || this._defaults.monthNames, lookAhead = function(match) {
        var matches = iFormat + 1 < format.length && format.charAt(iFormat + 1) === match;
        if (matches) {
          iFormat++;
        }
        return matches;
      }, formatNumber = function(match, value, len) {
        var num = "" + value;
        if (lookAhead(match)) {
          while (num.length < len) {
            num = "0" + num;
          }
        }
        return num;
      }, formatName = function(match, value, shortNames, longNames) {
        return lookAhead(match) ? longNames[value] : shortNames[value];
      }, output = "", literal = false;
      if (date) {
        for (iFormat = 0; iFormat < format.length; iFormat++) {
          if (literal) {
            if (format.charAt(iFormat) === "'" && !lookAhead("'")) {
              literal = false;
            } else {
              output += format.charAt(iFormat);
            }
          } else {
            switch (format.charAt(iFormat)) {
              case "d":
                output += formatNumber("d", date.getDate(), 2);
                break;
              case "D":
                output += formatName("D", date.getDay(), dayNamesShort, dayNames);
                break;
              case "o":
                output += formatNumber(
                  "o",
                  Math.round((new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 864e5),
                  3
                );
                break;
              case "m":
                output += formatNumber("m", date.getMonth() + 1, 2);
                break;
              case "M":
                output += formatName("M", date.getMonth(), monthNamesShort, monthNames);
                break;
              case "y":
                output += lookAhead("y") ? date.getFullYear() : (date.getFullYear() % 100 < 10 ? "0" : "") + date.getFullYear() % 100;
                break;
              case "@":
                output += date.getTime();
                break;
              case "!":
                output += date.getTime() * 1e4 + this._ticksTo1970;
                break;
              case "'":
                if (lookAhead("'")) {
                  output += "'";
                } else {
                  literal = true;
                }
                break;
              default:
                output += format.charAt(iFormat);
            }
          }
        }
      }
      return output;
    },
    /* Extract all possible characters from the date format. */
    _possibleChars: function(format) {
      var iFormat, chars = "", literal = false, lookAhead = function(match) {
        var matches = iFormat + 1 < format.length && format.charAt(iFormat + 1) === match;
        if (matches) {
          iFormat++;
        }
        return matches;
      };
      for (iFormat = 0; iFormat < format.length; iFormat++) {
        if (literal) {
          if (format.charAt(iFormat) === "'" && !lookAhead("'")) {
            literal = false;
          } else {
            chars += format.charAt(iFormat);
          }
        } else {
          switch (format.charAt(iFormat)) {
            case "d":
            case "m":
            case "y":
            case "@":
              chars += "0123456789";
              break;
            case "D":
            case "M":
              return null;
            // Accept anything
            case "'":
              if (lookAhead("'")) {
                chars += "'";
              } else {
                literal = true;
              }
              break;
            default:
              chars += format.charAt(iFormat);
          }
        }
      }
      return chars;
    },
    /* Get a setting value, defaulting if necessary. */
    _get: function(inst, name) {
      return inst.settings[name] !== void 0 ? inst.settings[name] : this._defaults[name];
    },
    /* Parse existing date and initialise date picker. */
    _setDateFromField: function(inst, noDefault) {
      if (inst.input.val() === inst.lastVal) {
        return;
      }
      var dateFormat = this._get(inst, "dateFormat"), dates = inst.lastVal = inst.input ? inst.input.val() : null, defaultDate = this._getDefaultDate(inst), date = defaultDate, settings = this._getFormatConfig(inst);
      try {
        date = this.parseDate(dateFormat, dates, settings) || defaultDate;
      } catch (event) {
        dates = noDefault ? "" : dates;
      }
      inst.selectedDay = date.getDate();
      inst.drawMonth = inst.selectedMonth = date.getMonth();
      inst.drawYear = inst.selectedYear = date.getFullYear();
      inst.currentDay = dates ? date.getDate() : 0;
      inst.currentMonth = dates ? date.getMonth() : 0;
      inst.currentYear = dates ? date.getFullYear() : 0;
      this._adjustInstDate(inst);
    },
    /* Retrieve the default date shown on opening. */
    _getDefaultDate: function(inst) {
      return this._restrictMinMax(
        inst,
        this._determineDate(inst, this._get(inst, "defaultDate"), /* @__PURE__ */ new Date())
      );
    },
    /* A date may be specified as an exact value or a relative one. */
    _determineDate: function(inst, date, defaultDate) {
      var offsetNumeric = function(offset2) {
        var date2 = /* @__PURE__ */ new Date();
        date2.setDate(date2.getDate() + offset2);
        return date2;
      }, offsetString = function(offset2) {
        try {
          return $7.datepicker.parseDate(
            $7.datepicker._get(inst, "dateFormat"),
            offset2,
            $7.datepicker._getFormatConfig(inst)
          );
        } catch (e) {
        }
        var date2 = (offset2.toLowerCase().match(/^c/) ? $7.datepicker._getDate(inst) : null) || /* @__PURE__ */ new Date(), year = date2.getFullYear(), month = date2.getMonth(), day = date2.getDate(), pattern = /([+\-]?[0-9]+)\s*(d|D|w|W|m|M|y|Y)?/g, matches = pattern.exec(offset2);
        while (matches) {
          switch (matches[2] || "d") {
            case "d":
            case "D":
              day += parseInt(matches[1], 10);
              break;
            case "w":
            case "W":
              day += parseInt(matches[1], 10) * 7;
              break;
            case "m":
            case "M":
              month += parseInt(matches[1], 10);
              day = Math.min(day, $7.datepicker._getDaysInMonth(year, month));
              break;
            case "y":
            case "Y":
              year += parseInt(matches[1], 10);
              day = Math.min(day, $7.datepicker._getDaysInMonth(year, month));
              break;
          }
          matches = pattern.exec(offset2);
        }
        return new Date(year, month, day);
      }, newDate = date == null || date === "" ? defaultDate : typeof date === "string" ? offsetString(date) : typeof date === "number" ? isNaN(date) ? defaultDate : offsetNumeric(date) : new Date(date.getTime());
      newDate = newDate && newDate.toString() === "Invalid Date" ? defaultDate : newDate;
      if (newDate) {
        newDate.setHours(0);
        newDate.setMinutes(0);
        newDate.setSeconds(0);
        newDate.setMilliseconds(0);
      }
      return this._daylightSavingAdjust(newDate);
    },
    /* Handle switch to/from daylight saving.
     * Hours may be non-zero on daylight saving cut-over:
     * > 12 when midnight changeover, but then cannot generate
     * midnight datetime, so jump to 1AM, otherwise reset.
     * @param  date  (Date) the date to check
     * @return  (Date) the corrected date
     */
    _daylightSavingAdjust: function(date) {
      if (!date) {
        return null;
      }
      date.setHours(date.getHours() > 12 ? date.getHours() + 2 : 0);
      return date;
    },
    /* Set the date(s) directly. */
    _setDate: function(inst, date, noChange) {
      var clear = !date, origMonth = inst.selectedMonth, origYear = inst.selectedYear, newDate = this._restrictMinMax(inst, this._determineDate(inst, date, /* @__PURE__ */ new Date()));
      inst.selectedDay = inst.currentDay = newDate.getDate();
      inst.drawMonth = inst.selectedMonth = inst.currentMonth = newDate.getMonth();
      inst.drawYear = inst.selectedYear = inst.currentYear = newDate.getFullYear();
      if ((origMonth !== inst.selectedMonth || origYear !== inst.selectedYear) && !noChange) {
        this._notifyChange(inst);
      }
      this._adjustInstDate(inst);
      if (inst.input) {
        inst.input.val(clear ? "" : this._formatDate(inst));
      }
    },
    /* Retrieve the date(s) directly. */
    _getDate: function(inst) {
      var startDate = !inst.currentYear || inst.input && inst.input.val() === "" ? null : this._daylightSavingAdjust(new Date(
        inst.currentYear,
        inst.currentMonth,
        inst.currentDay
      ));
      return startDate;
    },
    /* Attach the onxxx handlers.  These are declared statically so
     * they work with static code transformers like Caja.
     */
    _attachHandlers: function(inst) {
      var stepMonths = this._get(inst, "stepMonths"), id = "#" + inst.id.replace(/\\\\/g, "\\");
      inst.dpDiv.find("[data-handler]").map(function() {
        var handler = {
          prev: function() {
            $7.datepicker._adjustDate(id, -stepMonths, "M");
          },
          next: function() {
            $7.datepicker._adjustDate(id, +stepMonths, "M");
          },
          hide: function() {
            $7.datepicker._hideDatepicker();
          },
          today: function() {
            $7.datepicker._gotoToday(id);
          },
          selectDay: function() {
            $7.datepicker._selectDay(id, +this.getAttribute("data-month"), +this.getAttribute("data-year"), this);
            return false;
          },
          selectMonth: function() {
            $7.datepicker._selectMonthYear(id, this, "M");
            return false;
          },
          selectYear: function() {
            $7.datepicker._selectMonthYear(id, this, "Y");
            return false;
          }
        };
        $7(this).on(this.getAttribute("data-event"), handler[this.getAttribute("data-handler")]);
      });
    },
    /* Generate the HTML for the current state of the date picker. */
    _generateHTML: function(inst) {
      var maxDraw, prevText, prev, nextText, next, currentText, gotoDate, controls, buttonPanel, firstDay, showWeek, dayNames, dayNamesMin, monthNames, monthNamesShort, beforeShowDay, showOtherMonths, selectOtherMonths, defaultDate, html, dow, row, group, col, selectedDate, cornerClass, calender, thead, day, daysInMonth, leadDays, curRows, numRows, printDate, dRow, tbody, daySettings, otherMonth, unselectable, tempDate = /* @__PURE__ */ new Date(), today = this._daylightSavingAdjust(
        new Date(tempDate.getFullYear(), tempDate.getMonth(), tempDate.getDate())
      ), isRTL2 = this._get(inst, "isRTL"), showButtonPanel = this._get(inst, "showButtonPanel"), hideIfNoPrevNext = this._get(inst, "hideIfNoPrevNext"), navigationAsDateFormat = this._get(inst, "navigationAsDateFormat"), numMonths = this._getNumberOfMonths(inst), showCurrentAtPos = this._get(inst, "showCurrentAtPos"), stepMonths = this._get(inst, "stepMonths"), isMultiMonth = numMonths[0] !== 1 || numMonths[1] !== 1, currentDate = this._daylightSavingAdjust(!inst.currentDay ? new Date(9999, 9, 9) : new Date(inst.currentYear, inst.currentMonth, inst.currentDay)), minDate = this._getMinMaxDate(inst, "min"), maxDate = this._getMinMaxDate(inst, "max"), drawMonth = inst.drawMonth - showCurrentAtPos, drawYear = inst.drawYear;
      if (drawMonth < 0) {
        drawMonth += 12;
        drawYear--;
      }
      if (maxDate) {
        maxDraw = this._daylightSavingAdjust(new Date(
          maxDate.getFullYear(),
          maxDate.getMonth() - numMonths[0] * numMonths[1] + 1,
          maxDate.getDate()
        ));
        maxDraw = minDate && maxDraw < minDate ? minDate : maxDraw;
        while (this._daylightSavingAdjust(new Date(drawYear, drawMonth, 1)) > maxDraw) {
          drawMonth--;
          if (drawMonth < 0) {
            drawMonth = 11;
            drawYear--;
          }
        }
      }
      inst.drawMonth = drawMonth;
      inst.drawYear = drawYear;
      prevText = this._get(inst, "prevText");
      prevText = !navigationAsDateFormat ? prevText : this.formatDate(
        prevText,
        this._daylightSavingAdjust(new Date(drawYear, drawMonth - stepMonths, 1)),
        this._getFormatConfig(inst)
      );
      if (this._canAdjustMonth(inst, -1, drawYear, drawMonth)) {
        prev = $7("<a>").attr({
          "class": "ui-datepicker-prev ui-corner-all",
          "data-handler": "prev",
          "data-event": "click",
          title: prevText
        }).append(
          $7("<span>").addClass("ui-icon ui-icon-circle-triangle-" + (isRTL2 ? "e" : "w")).text(prevText)
        )[0].outerHTML;
      } else if (hideIfNoPrevNext) {
        prev = "";
      } else {
        prev = $7("<a>").attr({
          "class": "ui-datepicker-prev ui-corner-all ui-state-disabled",
          title: prevText
        }).append(
          $7("<span>").addClass("ui-icon ui-icon-circle-triangle-" + (isRTL2 ? "e" : "w")).text(prevText)
        )[0].outerHTML;
      }
      nextText = this._get(inst, "nextText");
      nextText = !navigationAsDateFormat ? nextText : this.formatDate(
        nextText,
        this._daylightSavingAdjust(new Date(drawYear, drawMonth + stepMonths, 1)),
        this._getFormatConfig(inst)
      );
      if (this._canAdjustMonth(inst, 1, drawYear, drawMonth)) {
        next = $7("<a>").attr({
          "class": "ui-datepicker-next ui-corner-all",
          "data-handler": "next",
          "data-event": "click",
          title: nextText
        }).append(
          $7("<span>").addClass("ui-icon ui-icon-circle-triangle-" + (isRTL2 ? "w" : "e")).text(nextText)
        )[0].outerHTML;
      } else if (hideIfNoPrevNext) {
        next = "";
      } else {
        next = $7("<a>").attr({
          "class": "ui-datepicker-next ui-corner-all ui-state-disabled",
          title: nextText
        }).append(
          $7("<span>").attr("class", "ui-icon ui-icon-circle-triangle-" + (isRTL2 ? "w" : "e")).text(nextText)
        )[0].outerHTML;
      }
      currentText = this._get(inst, "currentText");
      gotoDate = this._get(inst, "gotoCurrent") && inst.currentDay ? currentDate : today;
      currentText = !navigationAsDateFormat ? currentText : this.formatDate(currentText, gotoDate, this._getFormatConfig(inst));
      controls = "";
      if (!inst.inline) {
        controls = $7("<button>").attr({
          type: "button",
          "class": "ui-datepicker-close ui-state-default ui-priority-primary ui-corner-all",
          "data-handler": "hide",
          "data-event": "click"
        }).text(this._get(inst, "closeText"))[0].outerHTML;
      }
      buttonPanel = "";
      if (showButtonPanel) {
        buttonPanel = $7("<div class='ui-datepicker-buttonpane ui-widget-content'>").append(isRTL2 ? controls : "").append(this._isInRange(inst, gotoDate) ? $7("<button>").attr({
          type: "button",
          "class": "ui-datepicker-current ui-state-default ui-priority-secondary ui-corner-all",
          "data-handler": "today",
          "data-event": "click"
        }).text(currentText) : "").append(isRTL2 ? "" : controls)[0].outerHTML;
      }
      firstDay = parseInt(this._get(inst, "firstDay"), 10);
      firstDay = isNaN(firstDay) ? 0 : firstDay;
      showWeek = this._get(inst, "showWeek");
      dayNames = this._get(inst, "dayNames");
      dayNamesMin = this._get(inst, "dayNamesMin");
      monthNames = this._get(inst, "monthNames");
      monthNamesShort = this._get(inst, "monthNamesShort");
      beforeShowDay = this._get(inst, "beforeShowDay");
      showOtherMonths = this._get(inst, "showOtherMonths");
      selectOtherMonths = this._get(inst, "selectOtherMonths");
      defaultDate = this._getDefaultDate(inst);
      html = "";
      for (row = 0; row < numMonths[0]; row++) {
        group = "";
        this.maxRows = 4;
        for (col = 0; col < numMonths[1]; col++) {
          selectedDate = this._daylightSavingAdjust(new Date(drawYear, drawMonth, inst.selectedDay));
          cornerClass = " ui-corner-all";
          calender = "";
          if (isMultiMonth) {
            calender += "<div class='ui-datepicker-group";
            if (numMonths[1] > 1) {
              switch (col) {
                case 0:
                  calender += " ui-datepicker-group-first";
                  cornerClass = " ui-corner-" + (isRTL2 ? "right" : "left");
                  break;
                case numMonths[1] - 1:
                  calender += " ui-datepicker-group-last";
                  cornerClass = " ui-corner-" + (isRTL2 ? "left" : "right");
                  break;
                default:
                  calender += " ui-datepicker-group-middle";
                  cornerClass = "";
                  break;
              }
            }
            calender += "'>";
          }
          calender += "<div class='ui-datepicker-header ui-widget-header ui-helper-clearfix" + cornerClass + "'>" + (/all|left/.test(cornerClass) && row === 0 ? isRTL2 ? next : prev : "") + (/all|right/.test(cornerClass) && row === 0 ? isRTL2 ? prev : next : "") + this._generateMonthYearHeader(
            inst,
            drawMonth,
            drawYear,
            minDate,
            maxDate,
            row > 0 || col > 0,
            monthNames,
            monthNamesShort
          ) + // draw month headers
          "</div><table class='ui-datepicker-calendar'><thead><tr>";
          thead = showWeek ? "<th class='ui-datepicker-week-col'>" + this._get(inst, "weekHeader") + "</th>" : "";
          for (dow = 0; dow < 7; dow++) {
            day = (dow + firstDay) % 7;
            thead += "<th scope='col'" + ((dow + firstDay + 6) % 7 >= 5 ? " class='ui-datepicker-week-end'" : "") + "><span title='" + dayNames[day] + "'>" + dayNamesMin[day] + "</span></th>";
          }
          calender += thead + "</tr></thead><tbody>";
          daysInMonth = this._getDaysInMonth(drawYear, drawMonth);
          if (drawYear === inst.selectedYear && drawMonth === inst.selectedMonth) {
            inst.selectedDay = Math.min(inst.selectedDay, daysInMonth);
          }
          leadDays = (this._getFirstDayOfMonth(drawYear, drawMonth) - firstDay + 7) % 7;
          curRows = Math.ceil((leadDays + daysInMonth) / 7);
          numRows = isMultiMonth ? this.maxRows > curRows ? this.maxRows : curRows : curRows;
          this.maxRows = numRows;
          printDate = this._daylightSavingAdjust(new Date(drawYear, drawMonth, 1 - leadDays));
          for (dRow = 0; dRow < numRows; dRow++) {
            calender += "<tr>";
            tbody = !showWeek ? "" : "<td class='ui-datepicker-week-col'>" + this._get(inst, "calculateWeek")(printDate) + "</td>";
            for (dow = 0; dow < 7; dow++) {
              daySettings = beforeShowDay ? beforeShowDay.apply(inst.input ? inst.input[0] : null, [printDate]) : [true, ""];
              otherMonth = printDate.getMonth() !== drawMonth;
              unselectable = otherMonth && !selectOtherMonths || !daySettings[0] || minDate && printDate < minDate || maxDate && printDate > maxDate;
              tbody += "<td class='" + ((dow + firstDay + 6) % 7 >= 5 ? " ui-datepicker-week-end" : "") + // highlight weekends
              (otherMonth ? " ui-datepicker-other-month" : "") + // highlight days from other months
              (printDate.getTime() === selectedDate.getTime() && drawMonth === inst.selectedMonth && inst._keyEvent || // user pressed key
              defaultDate.getTime() === printDate.getTime() && defaultDate.getTime() === selectedDate.getTime() ? (
                // or defaultDate is current printedDate and defaultDate is selectedDate
                " " + this._dayOverClass
              ) : "") + // highlight selected day
              (unselectable ? " " + this._unselectableClass + " ui-state-disabled" : "") + // highlight unselectable days
              (otherMonth && !showOtherMonths ? "" : " " + daySettings[1] + // highlight custom dates
              (printDate.getTime() === currentDate.getTime() ? " " + this._currentClass : "") + // highlight selected day
              (printDate.getTime() === today.getTime() ? " ui-datepicker-today" : "")) + "'" + // highlight today (if different)
              ((!otherMonth || showOtherMonths) && daySettings[2] ? " title='" + daySettings[2].replace(/'/g, "&#39;") + "'" : "") + // cell title
              (unselectable ? "" : " data-handler='selectDay' data-event='click' data-month='" + printDate.getMonth() + "' data-year='" + printDate.getFullYear() + "'") + ">" + // actions
              (otherMonth && !showOtherMonths ? "&#xa0;" : (
                // display for other months
                unselectable ? "<span class='ui-state-default'>" + printDate.getDate() + "</span>" : "<a class='ui-state-default" + (printDate.getTime() === today.getTime() ? " ui-state-highlight" : "") + (printDate.getTime() === currentDate.getTime() ? " ui-state-active" : "") + // highlight selected day
                (otherMonth ? " ui-priority-secondary" : "") + // distinguish dates from other months
                "' href='#' aria-current='" + (printDate.getTime() === currentDate.getTime() ? "true" : "false") + // mark date as selected for screen reader
                "' data-date='" + printDate.getDate() + // store date as data
                "'>" + printDate.getDate() + "</a>"
              )) + "</td>";
              printDate.setDate(printDate.getDate() + 1);
              printDate = this._daylightSavingAdjust(printDate);
            }
            calender += tbody + "</tr>";
          }
          drawMonth++;
          if (drawMonth > 11) {
            drawMonth = 0;
            drawYear++;
          }
          calender += "</tbody></table>" + (isMultiMonth ? "</div>" + (numMonths[0] > 0 && col === numMonths[1] - 1 ? "<div class='ui-datepicker-row-break'></div>" : "") : "");
          group += calender;
        }
        html += group;
      }
      html += buttonPanel;
      inst._keyEvent = false;
      return html;
    },
    /* Generate the month and year header. */
    _generateMonthYearHeader: function(inst, drawMonth, drawYear, minDate, maxDate, secondary, monthNames, monthNamesShort) {
      var inMinYear, inMaxYear, month, years, thisYear, determineYear, year, endYear, changeMonth = this._get(inst, "changeMonth"), changeYear = this._get(inst, "changeYear"), showMonthAfterYear = this._get(inst, "showMonthAfterYear"), selectMonthLabel = this._get(inst, "selectMonthLabel"), selectYearLabel = this._get(inst, "selectYearLabel"), html = "<div class='ui-datepicker-title'>", monthHtml = "";
      if (secondary || !changeMonth) {
        monthHtml += "<span class='ui-datepicker-month'>" + monthNames[drawMonth] + "</span>";
      } else {
        inMinYear = minDate && minDate.getFullYear() === drawYear;
        inMaxYear = maxDate && maxDate.getFullYear() === drawYear;
        monthHtml += "<select class='ui-datepicker-month' aria-label='" + selectMonthLabel + "' data-handler='selectMonth' data-event='change'>";
        for (month = 0; month < 12; month++) {
          if ((!inMinYear || month >= minDate.getMonth()) && (!inMaxYear || month <= maxDate.getMonth())) {
            monthHtml += "<option value='" + month + "'" + (month === drawMonth ? " selected='selected'" : "") + ">" + monthNamesShort[month] + "</option>";
          }
        }
        monthHtml += "</select>";
      }
      if (!showMonthAfterYear) {
        html += monthHtml + (secondary || !(changeMonth && changeYear) ? "&#xa0;" : "");
      }
      if (!inst.yearshtml) {
        inst.yearshtml = "";
        if (secondary || !changeYear) {
          html += "<span class='ui-datepicker-year'>" + drawYear + "</span>";
        } else {
          years = this._get(inst, "yearRange").split(":");
          thisYear = (/* @__PURE__ */ new Date()).getFullYear();
          determineYear = function(value) {
            var year2 = value.match(/c[+\-].*/) ? drawYear + parseInt(value.substring(1), 10) : value.match(/[+\-].*/) ? thisYear + parseInt(value, 10) : parseInt(value, 10);
            return isNaN(year2) ? thisYear : year2;
          };
          year = determineYear(years[0]);
          endYear = Math.max(year, determineYear(years[1] || ""));
          year = minDate ? Math.max(year, minDate.getFullYear()) : year;
          endYear = maxDate ? Math.min(endYear, maxDate.getFullYear()) : endYear;
          inst.yearshtml += "<select class='ui-datepicker-year' aria-label='" + selectYearLabel + "' data-handler='selectYear' data-event='change'>";
          for (; year <= endYear; year++) {
            inst.yearshtml += "<option value='" + year + "'" + (year === drawYear ? " selected='selected'" : "") + ">" + year + "</option>";
          }
          inst.yearshtml += "</select>";
          html += inst.yearshtml;
          inst.yearshtml = null;
        }
      }
      html += this._get(inst, "yearSuffix");
      if (showMonthAfterYear) {
        html += (secondary || !(changeMonth && changeYear) ? "&#xa0;" : "") + monthHtml;
      }
      html += "</div>";
      return html;
    },
    /* Adjust one of the date sub-fields. */
    _adjustInstDate: function(inst, offset2, period) {
      var year = inst.selectedYear + (period === "Y" ? offset2 : 0), month = inst.selectedMonth + (period === "M" ? offset2 : 0), day = Math.min(inst.selectedDay, this._getDaysInMonth(year, month)) + (period === "D" ? offset2 : 0), date = this._restrictMinMax(inst, this._daylightSavingAdjust(new Date(year, month, day)));
      inst.selectedDay = date.getDate();
      inst.drawMonth = inst.selectedMonth = date.getMonth();
      inst.drawYear = inst.selectedYear = date.getFullYear();
      if (period === "M" || period === "Y") {
        this._notifyChange(inst);
      }
    },
    /* Ensure a date is within any min/max bounds. */
    _restrictMinMax: function(inst, date) {
      var minDate = this._getMinMaxDate(inst, "min"), maxDate = this._getMinMaxDate(inst, "max"), newDate = minDate && date < minDate ? minDate : date;
      return maxDate && newDate > maxDate ? maxDate : newDate;
    },
    /* Notify change of month/year. */
    _notifyChange: function(inst) {
      var onChange = this._get(inst, "onChangeMonthYear");
      if (onChange) {
        onChange.apply(
          inst.input ? inst.input[0] : null,
          [inst.selectedYear, inst.selectedMonth + 1, inst]
        );
      }
    },
    /* Determine the number of months to show. */
    _getNumberOfMonths: function(inst) {
      var numMonths = this._get(inst, "numberOfMonths");
      return numMonths == null ? [1, 1] : typeof numMonths === "number" ? [1, numMonths] : numMonths;
    },
    /* Determine the current maximum date - ensure no time components are set. */
    _getMinMaxDate: function(inst, minMax) {
      return this._determineDate(inst, this._get(inst, minMax + "Date"), null);
    },
    /* Find the number of days in a given month. */
    _getDaysInMonth: function(year, month) {
      return 32 - this._daylightSavingAdjust(new Date(year, month, 32)).getDate();
    },
    /* Find the day of the week of the first of a month. */
    _getFirstDayOfMonth: function(year, month) {
      return new Date(year, month, 1).getDay();
    },
    /* Determines if we should allow a "next/prev" month display change. */
    _canAdjustMonth: function(inst, offset2, curYear, curMonth) {
      var numMonths = this._getNumberOfMonths(inst), date = this._daylightSavingAdjust(new Date(
        curYear,
        curMonth + (offset2 < 0 ? offset2 : numMonths[0] * numMonths[1]),
        1
      ));
      if (offset2 < 0) {
        date.setDate(this._getDaysInMonth(date.getFullYear(), date.getMonth()));
      }
      return this._isInRange(inst, date);
    },
    /* Is the given date in the accepted range? */
    _isInRange: function(inst, date) {
      var yearSplit, currentYear, minDate = this._getMinMaxDate(inst, "min"), maxDate = this._getMinMaxDate(inst, "max"), minYear = null, maxYear = null, years = this._get(inst, "yearRange");
      if (years) {
        yearSplit = years.split(":");
        currentYear = (/* @__PURE__ */ new Date()).getFullYear();
        minYear = parseInt(yearSplit[0], 10);
        maxYear = parseInt(yearSplit[1], 10);
        if (yearSplit[0].match(/[+\-].*/)) {
          minYear += currentYear;
        }
        if (yearSplit[1].match(/[+\-].*/)) {
          maxYear += currentYear;
        }
      }
      return (!minDate || date.getTime() >= minDate.getTime()) && (!maxDate || date.getTime() <= maxDate.getTime()) && (!minYear || date.getFullYear() >= minYear) && (!maxYear || date.getFullYear() <= maxYear);
    },
    /* Provide the configuration settings for formatting/parsing. */
    _getFormatConfig: function(inst) {
      var shortYearCutoff = this._get(inst, "shortYearCutoff");
      shortYearCutoff = typeof shortYearCutoff !== "string" ? shortYearCutoff : (/* @__PURE__ */ new Date()).getFullYear() % 100 + parseInt(shortYearCutoff, 10);
      return {
        shortYearCutoff,
        dayNamesShort: this._get(inst, "dayNamesShort"),
        dayNames: this._get(inst, "dayNames"),
        monthNamesShort: this._get(inst, "monthNamesShort"),
        monthNames: this._get(inst, "monthNames")
      };
    },
    /* Format the given date for display. */
    _formatDate: function(inst, day, month, year) {
      if (!day) {
        inst.currentDay = inst.selectedDay;
        inst.currentMonth = inst.selectedMonth;
        inst.currentYear = inst.selectedYear;
      }
      var date = day ? typeof day === "object" ? day : this._daylightSavingAdjust(new Date(year, month, day)) : this._daylightSavingAdjust(new Date(inst.currentYear, inst.currentMonth, inst.currentDay));
      return this.formatDate(this._get(inst, "dateFormat"), date, this._getFormatConfig(inst));
    }
  });
  function datepicker_bindHover(dpDiv) {
    var selector = "button, .ui-datepicker-prev, .ui-datepicker-next, .ui-datepicker-calendar td a";
    return dpDiv.on("mouseout", selector, function() {
      $7(this).removeClass("ui-state-hover");
      if (this.className.indexOf("ui-datepicker-prev") !== -1) {
        $7(this).removeClass("ui-datepicker-prev-hover");
      }
      if (this.className.indexOf("ui-datepicker-next") !== -1) {
        $7(this).removeClass("ui-datepicker-next-hover");
      }
    }).on("mouseover", selector, datepicker_handleMouseover);
  }
  function datepicker_handleMouseover() {
    if (!$7.datepicker._isDisabledDatepicker(datepicker_instActive.inline ? datepicker_instActive.dpDiv.parent()[0] : datepicker_instActive.input[0])) {
      $7(this).parents(".ui-datepicker-calendar").find("a").removeClass("ui-state-hover");
      $7(this).addClass("ui-state-hover");
      if (this.className.indexOf("ui-datepicker-prev") !== -1) {
        $7(this).addClass("ui-datepicker-prev-hover");
      }
      if (this.className.indexOf("ui-datepicker-next") !== -1) {
        $7(this).addClass("ui-datepicker-next-hover");
      }
    }
  }
  function datepicker_extendRemove(target, props) {
    $7.extend(target, props);
    for (var name in props) {
      if (props[name] == null) {
        target[name] = props[name];
      }
    }
    return target;
  }
  $7.fn.datepicker = function(options) {
    if (!this.length) {
      return this;
    }
    if (!$7.datepicker.initialized) {
      $7(document).on("mousedown", $7.datepicker._checkExternalClick);
      $7.datepicker.initialized = true;
    }
    if ($7("#" + $7.datepicker._mainDivId).length === 0) {
      $7("body").append($7.datepicker.dpDiv);
    }
    var otherArgs = Array.prototype.slice.call(arguments, 1);
    if (typeof options === "string" && (options === "isDisabled" || options === "getDate" || options === "widget")) {
      return $7.datepicker["_" + options + "Datepicker"].apply($7.datepicker, [this[0]].concat(otherArgs));
    }
    if (options === "option" && arguments.length === 2 && typeof arguments[1] === "string") {
      return $7.datepicker["_" + options + "Datepicker"].apply($7.datepicker, [this[0]].concat(otherArgs));
    }
    return this.each(function() {
      if (typeof options === "string") {
        $7.datepicker["_" + options + "Datepicker"].apply($7.datepicker, [this].concat(otherArgs));
      } else {
        $7.datepicker._attachDatepicker(this, options);
      }
    });
  };
  $7.datepicker = new Datepicker();
  $7.datepicker.initialized = false;
  $7.datepicker.uuid = (/* @__PURE__ */ new Date()).getTime();
  $7.datepicker.version = "1.14.1";
  return $7.datepicker;
});

// app/javascript/application.js
var import_select2 = __toESM(require_select2());

// app/javascript/dynamic_nested_fields.js
init_shim_jquery();

// app/javascript/autolink_table_rows.js
init_shim_jquery();
var import_jquery2 = __toESM(require_jquery());
var import_jquery_contextmenu = __toESM(require_jquery_contextMenu());
window.$ = window.jQuery = import_jquery2.default;
(0, import_jquery2.default)(function() {
  import_jquery2.default.contextMenu({
    selector: "table.autolink tr",
    build: function(trigger, e) {
      let entries = (0, import_jquery2.default)(e.target).closest("tr").data("context-menu");
      if (entries === void 0) {
        return false;
      }
      let items = {
        callback: function() {
        },
        items: {}
      };
      entries.forEach((elem, i) => {
        if (elem.path) {
          items.items["item" + i] = {
            ...elem,
            callback: () => {
              window.location.href = elem.path;
            }
          };
        } else {
          items.items["item" + i] = elem;
        }
      });
      return items;
    }
  });
  (0, import_jquery2.default)("table.autolink tr").each(function(i, elem) {
    const tr = (0, import_jquery2.default)(elem);
    const showLink = (0, import_jquery2.default)("a.show", elem);
    const editLink = (0, import_jquery2.default)("a.edit", elem);
    if (showLink.length === 0) return;
    tr.data("context-menu", [
      {
        name: "Details...",
        icon: "show",
        path: showLink.attr("href")
      }
    ]);
    (0, import_jquery2.default)(elem).on("click", function() {
      window.location.href = showLink.attr("href");
    }).addClass("link");
  });
});

// app/javascript/calendar.js
init_shim_jquery();
var import_jquery3 = __toESM(require_jquery());
var import_jquery_contextmenu2 = __toESM(require_jquery_contextMenu());
window.$ = window.jQuery = import_jquery3.default;
(0, import_jquery3.default)(function() {
  import_jquery3.default.contextMenu({
    selector: "table.calendar",
    build: function(trigger, e) {
      const entries = (0, import_jquery3.default)(e.target).closest("td").data("context-menu");
      if (!entries) return false;
      let items = {
        callback: function() {
        },
        items: {}
      };
      entries.forEach((elem, i) => {
        if (elem.path) {
          items.items["item" + i] = {
            ...elem,
            callback: () => {
              window.location.href = elem.path;
            }
          };
        } else {
          items.items["item" + i] = elem;
        }
      });
      return items;
    }
  });
  (0, import_jquery3.default)("table.calendar td:not(.time)").on("click", function() {
    const entries = (0, import_jquery3.default)(this).data("context-menu");
    if (entries && entries[1] && entries[1].path) {
      window.location.href = entries[1].path;
    }
  });
  (0, import_jquery3.default)("table.calendar.month tbody td div").on("click", function() {
    const path = (0, import_jquery3.default)(this).data("path");
    if (path) {
      window.location.href = path;
    }
  });
});

// app/javascript/addresses.js
init_shim_jquery();
window.set_purpose = function() {
  const anchor = $(this).closest(".fields").find(".fields_for_address_purpose");
  switch ($(this).val()) {
    case "0":
      anchor.find("input").val("Privat");
      anchor.hide();
      break;
    case "1":
      anchor.find("input").val("Gesch\xE4ftlich");
      anchor.hide();
      break;
    case "2":
      anchor.find("input").val("");
      anchor.show();
      break;
  }
};
window.restore_dynamicsm = function(anchor) {
  anchor.find("select.type_of_address").css({ width: "20em" }).select2().on("change", window.set_purpose);
};
$(document).on("click", ".remove_fields", function(event) {
  $(this).closest(".fields").find("dl").remove();
  $(this).closest(".fields").find("input[type=hidden]").val("1");
  $(this).closest(".fields").hide();
  event.preventDefault();
});
$(document).on("click", ".add_fields", function(event) {
  console.log("adding fields");
  const time = (/* @__PURE__ */ new Date()).getTime();
  const regexp = new RegExp($(this).data("id"), "g");
  $(this).before($(this).data("fields").replace(regexp, time));
  event.preventDefault();
  window.restore_dynamicsm($(event.target).closest(".fields"));
});

// app/javascript/jquery.mailto.js
init_shim_jquery();
var import_jquery4 = __toESM(require_jquery());
window.$ = window.jQuery = import_jquery4.default;
import_jquery4.default.fn.mailTo = function() {
  const replacements = {
    und: "@",
    bei: "@",
    at: "@",
    punkt: ".",
    dot: ".",
    minus: "-",
    dash: "-"
  };
  this.each(function() {
    const $el = (0, import_jquery4.default)(this);
    let address = $el.text();
    for (const [k, v] of Object.entries(replacements)) {
      const regex = new RegExp(`\\s*[\\(\\[]\\s*${k}\\s*[\\)\\]]\\s*`, "gi");
      address = address.replace(regex, v);
    }
    $el.attr("href", `mailto:${address}`);
    $el.text(address);
  });
  return this;
};

// app/javascript/application.js
window.$ = window.jQuery = import_jquery5.default;
(0, import_jquery5.default)(function() {
  (0, import_jquery5.default)("section select:not(:disabled):not(.very-small)").css({ width: "20em" }).select2();
  (0, import_jquery5.default)("section input.datepicker").datepicker({ dateFormat: window.cur_locale_date_format });
  (0, import_jquery5.default)("section input.datepicker-mmyy").datepicker({ dateFormat: window.cur_locale_date_format_mmyy });
  (0, import_jquery5.default)("#tabs").tabs();
  (0, import_jquery5.default)('[data-behaviour="mailto"]').mailTo();
  if ((0, import_jquery5.default)(".best_in_place").length && import_jquery5.default.fn.best_in_place) {
    (0, import_jquery5.default)(".best_in_place").best_in_place();
    (0, import_jquery5.default)(".best_in_place").on("ajax:success", function() {
      (0, import_jquery5.default)(this).closest("tr").effect("highlight");
    });
  }
});
window.s4 = function() {
  return ((1 + Math.random()) * 65536 | 0).toString(16).substring(1);
};
window.random_password = function() {
  return s4() + s4() + s4() + s4() + s4() + s4() + s4() + s4() + s4();
};
window.random_email = function() {
  return "invalid-mail-" + s4() + "-" + s4() + s4() + s4() + "@fwze.de";
};
window.random_credentials = function() {
  (0, import_jquery5.default)(".random-email-input").val(random_email());
  (0, import_jquery5.default)(".random-password-input").val(random_password());
};
(0, import_jquery5.default)(function() {
  (0, import_jquery5.default)('[data-behaviour="mailto"]').mailTo();
});
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

select2/dist/js/select2.js:
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

bootstrap/dist/js/bootstrap.esm.js:
  (*!
    * Bootstrap v5.3.6 (https://getbootstrap.com/)
    * Copyright 2011-2025 The Bootstrap Authors (https://github.com/twbs/bootstrap/graphs/contributors)
    * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
    *)

jquery-ui/ui/widgets/datepicker.js:
  (*!
   * jQuery UI Datepicker 1.14.1
   * https://jqueryui.com
   *
   * Copyright OpenJS Foundation and other contributors
   * Released under the MIT license.
   * https://jquery.org/license
   *)
*/
//# sourceMappingURL=/assets/application.js.map
