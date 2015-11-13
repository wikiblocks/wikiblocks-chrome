if (typeof Map === "undefined") {
  Map = function() { this.clear(); };
  Map.prototype = {
    set: function(k, v) { this._[k] = v; return this; },
    get: function(k) { return this._[k]; },
    has: function(k) { return k in this._; },
    delete: function(k) { return k in this._ && delete this._[k]; },
    clear: function() { this._ = Object.create(null); },
    get size() { var n = 0; for (var k in this._) ++n; return n; },
    forEach: function(c) { for (var k in this._) c(this._[k], k, this); }
  };
} else (function() {
  var m = new Map;
  if (m.set(0, 0) !== m) {
    m = m.set;
    Map.prototype.set = function() { m.apply(this, arguments); return this; };
  }
})();

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  factory((global.xhr = {}));
}(this, function (exports) { 'use strict';

  function _dsv(delimiter) {
    var reFormat = new RegExp("[\"" + delimiter + "\n]"),
        delimiterCode = delimiter.charCodeAt(0);

    function parse(text, f) {
      var o;
      return parseRows(text, function(row, i) {
        if (o) return o(row, i - 1);
        var a = new Function("d", "return {" + row.map(function(name, i) {
          return JSON.stringify(name) + ": d[" + i + "]";
        }).join(",") + "}");
        o = f ? function(row, i) { return f(a(row), i); } : a;
      });
    }

    function parseRows(text, f) {
      var EOL = {}, // sentinel value for end-of-line
          EOF = {}, // sentinel value for end-of-file
          rows = [], // output rows
          N = text.length,
          I = 0, // current character index
          n = 0, // the current line number
          t, // the current token
          eol; // is the current token followed by EOL?

      function token() {
        if (I >= N) return EOF; // special case: end of file
        if (eol) return eol = false, EOL; // special case: end of line

        // special case: quotes
        var j = I;
        if (text.charCodeAt(j) === 34) {
          var i = j;
          while (i++ < N) {
            if (text.charCodeAt(i) === 34) {
              if (text.charCodeAt(i + 1) !== 34) break;
              ++i;
            }
          }
          I = i + 2;
          var c = text.charCodeAt(i + 1);
          if (c === 13) {
            eol = true;
            if (text.charCodeAt(i + 2) === 10) ++I;
          } else if (c === 10) {
            eol = true;
          }
          return text.slice(j + 1, i).replace(/""/g, "\"");
        }

        // common case: find next delimiter or newline
        while (I < N) {
          var c = text.charCodeAt(I++), k = 1;
          if (c === 10) eol = true; // \n
          else if (c === 13) { eol = true; if (text.charCodeAt(I) === 10) ++I, ++k; } // \r|\r\n
          else if (c !== delimiterCode) continue;
          return text.slice(j, I - k);
        }

        // special case: last token before EOF
        return text.slice(j);
      }

      while ((t = token()) !== EOF) {
        var a = [];
        while (t !== EOL && t !== EOF) {
          a.push(t);
          t = token();
        }
        if (f && (a = f(a, n++)) == null) continue;
        rows.push(a);
      }

      return rows;
    }

    function format(rows) {
      if (Array.isArray(rows[0])) return formatRows(rows); // deprecated; use formatRows
      var fieldSet = Object.create(null), fields = [];

      // Compute unique fields in order of discovery.
      rows.forEach(function(row) {
        for (var field in row) {
          if (!((field += "") in fieldSet)) {
            fields.push(fieldSet[field] = field);
          }
        }
      });

      return [fields.map(formatValue).join(delimiter)].concat(rows.map(function(row) {
        return fields.map(function(field) {
          return formatValue(row[field]);
        }).join(delimiter);
      })).join("\n");
    }

    function formatRows(rows) {
      return rows.map(formatRow).join("\n");
    }

    function formatRow(row) {
      return row.map(formatValue).join(delimiter);
    }

    function formatValue(text) {
      return reFormat.test(text) ? "\"" + text.replace(/\"/g, "\"\"") + "\"" : text;
    }

    return {
      parse: parse,
      parseRows: parseRows,
      format: format,
      formatRows: formatRows
    };
  }

  var csv = _dsv(",");
  var tsv = _dsv("\t");

  function dispatch() {
    return new Dispatch(arguments);
  }

  function Dispatch(types) {
    var i = -1,
        n = types.length,
        callbacksByType = {},
        callbackByName = {},
        type,
        that = this;

    that.on = function(type, callback) {
      type = parseType(type);

      // Return the current callback, if any.
      if (arguments.length < 2) {
        return (callback = callbackByName[type.name]) && callback.value;
      }

      // If a type was specified…
      if (type.type) {
        var callbacks = callbacksByType[type.type],
            callback0 = callbackByName[type.name],
            i;

        // Remove the current callback, if any, using copy-on-remove.
        if (callback0) {
          callback0.value = null;
          i = callbacks.indexOf(callback0);
          callbacksByType[type.type] = callbacks = callbacks.slice(0, i).concat(callbacks.slice(i + 1));
          delete callbackByName[type.name];
        }

        // Add the new callback, if any.
        if (callback) {
          callback = {value: callback};
          callbackByName[type.name] = callback;
          callbacks.push(callback);
        }
      }

      // Otherwise, if a null callback was specified, remove all callbacks with the given name.
      else if (callback == null) {
        for (var otherType in callbacksByType) {
          if (callback = callbackByName[otherType + type.name]) {
            callback.value = null;
            var callbacks = callbacksByType[otherType], i = callbacks.indexOf(callback);
            callbacksByType[otherType] = callbacks.slice(0, i).concat(callbacks.slice(i + 1));
            delete callbackByName[callback.name];
          }
        }
      }

      return that;
    };

    while (++i < n) {
      type = types[i] + "";
      if (!type || (type in that)) throw new Error("illegal or duplicate type: " + type);
      callbacksByType[type] = [];
      that[type] = applier(type);
    }

    function parseType(type) {
      var i = (type += "").indexOf("."), name = type;
      if (i >= 0) type = type.slice(0, i); else name += ".";
      if (type && !callbacksByType.hasOwnProperty(type)) throw new Error("unknown type: " + type);
      return {type: type, name: name};
    }

    function applier(type) {
      return function() {
        var callbacks = callbacksByType[type], // Defensive reference; copy-on-remove.
            callback,
            callbackValue,
            i = -1,
            n = callbacks.length;

        while (++i < n) {
          if (callbackValue = (callback = callbacks[i]).value) {
            callbackValue.apply(this, arguments);
          }
        }

        return that;
      };
    }
  }

  dispatch.prototype = Dispatch.prototype;

  function xhr(url, callback) {
    var xhr,
        event = dispatch("beforesend", "progress", "load", "error"),
        mimeType,
        headers = new Map,
        request = new XMLHttpRequest,
        response,
        responseType;

    // If IE does not support CORS, use XDomainRequest.
    if (typeof XDomainRequest !== "undefined"
        && !("withCredentials" in request)
        && /^(http(s)?:)?\/\//.test(url)) request = new XDomainRequest;

    "onload" in request
        ? request.onload = request.onerror = respond
        : request.onreadystatechange = function() { request.readyState > 3 && respond(); };

    function respond() {
      var status = request.status, result;
      if (!status && hasResponse(request)
          || status >= 200 && status < 300
          || status === 304) {
        if (response) {
          try {
            result = response.call(xhr, request);
          } catch (e) {
            event.error.call(xhr, e);
            return;
          }
        } else {
          result = request;
        }
        event.load.call(xhr, result);
      } else {
        event.error.call(xhr, request);
      }
    }

    request.onprogress = function(e) {
      event.progress.call(xhr, e);
    };

    xhr = {
      header: function(name, value) {
        name = (name + "").toLowerCase();
        if (arguments.length < 2) return headers.get(name);
        if (value == null) headers.delete(name);
        else headers.set(name, value + "");
        return xhr;
      },

      // If mimeType is non-null and no Accept header is set, a default is used.
      mimeType: function(value) {
        if (!arguments.length) return mimeType;
        mimeType = value == null ? null : value + "";
        return xhr;
      },

      // Specifies what type the response value should take;
      // for instance, arraybuffer, blob, document, or text.
      responseType: function(value) {
        if (!arguments.length) return responseType;
        responseType = value;
        return xhr;
      },

      // Specify how to convert the response content to a specific type;
      // changes the callback value on "load" events.
      response: function(value) {
        response = value;
        return xhr;
      },

      // Alias for send("GET", …).
      get: function(data, callback) {
        return xhr.send("GET", data, callback);
      },

      // Alias for send("POST", …).
      post: function(data, callback) {
        return xhr.send("POST", data, callback);
      },

      // If callback is non-null, it will be used for error and load events.
      send: function(method, data, callback) {
        if (!callback && typeof data === "function") callback = data, data = null;
        if (callback && callback.length === 1) callback = fixCallback(callback);
        request.open(method, url, true);
        if (mimeType != null && !headers.has("accept")) headers.set("accept", mimeType + ",*/*");
        if (request.setRequestHeader) headers.forEach(function(value, name) { request.setRequestHeader(name, value); });
        if (mimeType != null && request.overrideMimeType) request.overrideMimeType(mimeType);
        if (responseType != null) request.responseType = responseType;
        if (callback) xhr.on("error", callback).on("load", function(request) { callback(null, request); });
        event.beforesend.call(xhr, request);
        request.send(data == null ? null : data);
        return xhr;
      },

      abort: function() {
        request.abort();
        return xhr;
      },

      on: function() {
        var value = event.on.apply(event, arguments);
        return value === event ? xhr : value;
      }
    };

    return callback
        ? xhr.get(callback)
        : xhr;
  }function fixCallback(callback) {
    return function(error, request) {
      callback(error == null ? request : null);
    };
  }

  function hasResponse(request) {
    var type = request.responseType;
    return type && type !== "text"
        ? request.response // null on error
        : request.responseText; // "" on error
  }

  function xhrDsv(defaultMimeType, dsv) {
    return function(url, row, callback) {
      if (arguments.length < 3) callback = row, row = null;
      var r = xhr(url).mimeType(defaultMimeType);
      r.row = function(_) { return arguments.length ? r.response(responseOf(dsv, row = _)) : row; };
      r.row(row);
      return callback ? r.get(callback) : r;
    };
  }function responseOf(dsv, row) {
    return function(request) {
      return dsv.parse(request.responseText, row);
    };
  }

  var _tsv = xhrDsv("text/tab-separated-values", tsv);

  var _csv = xhrDsv("text/csv", csv);

  function xhrType(defaultMimeType, response) {
    return function(url, callback) {
      var r = xhr(url).mimeType(defaultMimeType).response(response);
      return callback ? r.get(callback) : r;
    };
  }

  var xml = xhrType("application/xml", function(request) {
    return request.responseXML;
  });

  var _text = xhrType("text/plain", function(request) {
    return request.responseText;
  });

  var json = xhrType("application/json", function(request) {
    return JSON.parse(request.responseText);
  });

  var html = xhrType("text/html", function(request) {
    return document.createRange().createContextualFragment(request.responseText);
  });

  exports.xhr = xhr;
  exports.html = html;
  exports.json = json;
  exports.text = _text;
  exports.xml = xml;
  exports.csv = _csv;
  exports.tsv = _tsv;

}));
