"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _level = _interopRequireDefault(require("level"));

var _path = _interopRequireDefault(require("path"));

var _md = _interopRequireDefault(require("md5"));

var utils = _interopRequireWildcard(require("./utils.js"));

var _tokenizer = _interopRequireDefault(require("./tokenizer.js"));

function construct_index(index) {
  return "0x001_" + index.toString();
}

function construct_key(key) {
  return "0x002_" + key.toString();
}

function stringify(value) {
  if (utils.isString(value)) {
    return value;
  } else if (utils.isNumber(value)) {
    return value.toString();
  } else if (utils.isArray(value) || utils.isObject(value)) {
    return JSON.stringify(value);
  }
}

var Min =
/*#__PURE__*/
function () {
  function Min() {
    var _this2 = this;

    (0, _classCallCheck2["default"])(this, Min);

    if (arguments.length > 0) {
      var db_address = arguments[0];
      var options = arguments[1] || {};
      return (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee() {
        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.prev = 0;

                if (db_address.indexOf("/") < 0 && db_address.indexOf("\\") < 0) {
                  db_address = _path["default"].join(process.cwd(), db_address);
                }

                _this2.db = (0, _level["default"])(db_address, options);
                _context.next = 5;
                return _this2.get_doc_count();

              case 5:
                _this2.doc_count = _context.sent;
                console.log("Leveldb selected: " + db_address);
                _context.next = 13;
                break;

              case 9:
                _context.prev = 9;
                _context.t0 = _context["catch"](0);
                console.error("Leveldb setup failed at: " + db_address + " \nPlease check your db_address and options.");
                console.error(_context.t0);

              case 13:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, null, [[0, 9]]);
      }))();
    }
  }

  (0, _createClass2["default"])(Min, [{
    key: "set_db",
    value: function set_db(db_address, options) {
      try {
        if (db_address.indexOf("/") < 0 && db_address.indexOf("\\") < 0) {
          db_address = _path["default"].join(process.cwd(), db_address);
        }

        options = options || {};
        this.db = (0, _level["default"])(db_address, options);

        var _this = this;

        this.db.get("0x000_doc_count", function (err, val) {
          if (!val && err) {
            if (err.type === "NotFoundError") {
              _this.doc_count = 0;
            } else {
              throw err;
            }
          } else {
            _this.doc_count = parseInt(val) ? parseInt(val) : 0;
          }

          console.log(_this.doc_count);
        });
        console.log("Leveldb selected: " + db_address);
      } catch (e) {
        console.error("Leveldb setup failed at: " + db_address + " \nPlease check your db_address and options.");
        console.error(e);
      }
    }
  }, {
    key: "init_options",
    value: function init_options(options) {
      if (!options) {
        options = {};
      }

      if (!("key_weight" in options) || !utils.isNumber(options["key_weight"])) {
        options["key_weight"] = 1;
      }

      if (!("value_weight_calc" in options)) {
        options["value_weight_calc"] = false;
      }

      if (!("default_value_weight" in options) || !utils.isNumber(options["default_value_weight"])) {
        options["default_value_weight"] = 1;
      }

      if (!("value_weights" in options) || !utils.isObject(options["value_weights"])) {
        options["value_weights"] = {};
      }

      return options;
    }
  }, {
    key: "get_tokens",
    value: function get_tokens(key, value, options) {
      var tokens = {};
      var temp_tokens = {};

      if (options["key_weight"]) {
        var _temp_tokens = (0, _tokenizer["default"])(key);

        utils.mergeTokens(tokens, _temp_tokens);
      }

      if (options["value_weight_calc"]) {
        var default_value_weight = options["default_value_weight"];
        var value_weights = options["value_weights"];

        if (utils.isString(value)) {
          temp_tokens = (0, _tokenizer["default"])(value);
          utils.mergeTokens(tokens, temp_tokens, default_value_weight);
        } else if (utils.isObject(value)) {
          for (var _i = 0, _Object$keys = Object.keys(value); _i < _Object$keys.length; _i++) {
            var _key = _Object$keys[_i];

            if (_key in value_weights || default_value_weight > 0) {
              temp_tokens = (0, _tokenizer["default"])(value[_key]);
              var weight = _key in value_weights ? value_weights[_key] : default_value_weight;
              utils.mergeTokens(tokens, temp_tokens, weight);
            }
          }
        } else if (utils.isArray(value)) {
          for (var i = 0; i < value.length; i++) {
            if (i in value_weights || default_value_weight > 0) {
              temp_tokens = (0, _tokenizer["default"])(value[i]);

              var _weight = i in value_weights ? value_weights[i] : default_value_weight;

              utils.mergeTokens(tokens, temp_tokens, _weight);
            }
          }
        }
      }

      return tokens;
    }
  }, {
    key: "search_index",
    value: function search_index(token) {
      var _this3 = this;

      return new Promise(function (resolve, reject) {
        _this3.db.get(construct_index(token)).then(function (result) {
          resolve(JSON.parse(result));
        })["catch"](function (e) {
          if (e.type === "NotFoundError") {
            // v: {docId:tf,...}
            resolve({
              t: token,
              l: 0,
              v: {}
            });
          } else {
            console.error(e);
            reject(e);
          }
        });
      });
    }
  }, {
    key: "get_doc_count",
    value: function () {
      var _get_doc_count = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee2() {
        return _regenerator["default"].wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return this.db.get("0x000_doc_count")["catch"](function (e) {
                  return e.type === "NotFoundError" ? 0 : false;
                });

              case 2:
                return _context2.abrupt("return", _context2.sent);

              case 3:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function get_doc_count() {
        return _get_doc_count.apply(this, arguments);
      }

      return get_doc_count;
    }()
  }, {
    key: "create",
    value: function () {
      var _create = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee3(key, value, options) {
        var _this4 = this;

        var doc_id, tokens, promise_arr, _i2, _Object$keys2, token, ops;

        return _regenerator["default"].wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                doc_id = (0, _md["default"])(key);
                this.doc_count += 1;
                tokens = this.get_tokens(key, value, options);
                promise_arr = [];

                for (_i2 = 0, _Object$keys2 = Object.keys(tokens); _i2 < _Object$keys2.length; _i2++) {
                  token = _Object$keys2[_i2];
                  promise_arr.push(this.search_index(token));
                }

                _context3.next = 7;
                return Promise.all(promise_arr).then(function (results) {
                  var ops = [];
                  var _iteratorNormalCompletion = true;
                  var _didIteratorError = false;
                  var _iteratorError = undefined;

                  try {
                    for (var _iterator = results[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                      var obj = _step.value;

                      if (!(doc_id in obj["v"])) {
                        obj["l"] += 1;
                      }

                      obj["v"][doc_id] = tokens[obj["t"]];
                      ops.push({
                        type: "put",
                        key: construct_index(obj["t"]),
                        value: JSON.stringify(obj)
                      });
                    }
                  } catch (err) {
                    _didIteratorError = true;
                    _iteratorError = err;
                  } finally {
                    try {
                      if (!_iteratorNormalCompletion && _iterator["return"] != null) {
                        _iterator["return"]();
                      }
                    } finally {
                      if (_didIteratorError) {
                        throw _iteratorError;
                      }
                    }
                  }

                  ops.push({
                    type: "put",
                    key: construct_key(doc_id),
                    value: JSON.stringify({
                      k: key,
                      v: JSON.stringify(value),
                      o: JSON.stringify(options)
                    })
                  });
                  ops.push({
                    type: "put",
                    key: "0x000_doc_count",
                    value: _this4.doc_count.toString()
                  });
                  return ops;
                })["catch"](function (e) {
                  console.error("Oops...The Create operation is interrupted by an internal error.");
                  return e;
                });

              case 7:
                ops = _context3.sent;
                return _context3.abrupt("return", new Promise(function (resolve, reject) {
                  if (ops instanceof EvalError) {
                    _this4.doc_count -= 1;
                    reject(ops);
                  }

                  _this4.db.batch(ops).then(function (info) {
                    resolve("Put: " + key + " successfully.");
                  })["catch"](function (e) {
                    _this4.doc_count -= 1;
                    console.error(e);
                    console.error("Oops...The Create operation is interrupted by an internal error.");
                    reject(e);
                  });
                }));

              case 9:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function create(_x, _x2, _x3) {
        return _create.apply(this, arguments);
      }

      return create;
    }()
  }, {
    key: "update",
    value: function () {
      var _update = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee4(key, value, options, prev_obj) {
        var _this5 = this;

        var doc_id, tokens, prev_tokens, diff_tokens, promise_arr, _i3, _Object$keys3, token, ops;

        return _regenerator["default"].wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                doc_id = (0, _md["default"])(key);
                tokens = this.get_tokens(key, value, options);
                prev_tokens = this.get_tokens(prev_obj["k"], prev_obj["v"], prev_obj["o"]);
                diff_tokens = utils.diffTokens(prev_tokens, tokens);
                promise_arr = [];

                for (_i3 = 0, _Object$keys3 = Object.keys(diff_tokens); _i3 < _Object$keys3.length; _i3++) {
                  token = _Object$keys3[_i3];
                  promise_arr.push(this.search_index(token));
                }

                tokens = diff_tokens;
                _context4.next = 9;
                return Promise.all(promise_arr).then(function (results) {
                  var ops = [];
                  var _iteratorNormalCompletion2 = true;
                  var _didIteratorError2 = false;
                  var _iteratorError2 = undefined;

                  try {
                    for (var _iterator2 = results[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                      var obj = _step2.value;

                      //DEL:
                      if (tokens[obj["t"]] <= 0) {
                        obj["l"] -= 1;
                        delete obj["v"][doc_id]; //there is no other doc related to this index, delete it

                        if (obj["l"] === 0 && Object.keys(obj["v"]).length === 0) {
                          ops.push({
                            type: "del",
                            key: construct_index(obj["t"])
                          });
                          continue;
                        }
                      } else {
                        //UPDATE
                        if (!(doc_id in obj["v"])) {
                          obj["l"] += 1;
                        }

                        obj["v"][doc_id] = tokens[obj["t"]];
                      }

                      ops.push({
                        type: "put",
                        key: construct_index(obj["t"]),
                        value: JSON.stringify(obj)
                      });
                    }
                  } catch (err) {
                    _didIteratorError2 = true;
                    _iteratorError2 = err;
                  } finally {
                    try {
                      if (!_iteratorNormalCompletion2 && _iterator2["return"] != null) {
                        _iterator2["return"]();
                      }
                    } finally {
                      if (_didIteratorError2) {
                        throw _iteratorError2;
                      }
                    }
                  }

                  ops.push({
                    type: "put",
                    key: construct_key(doc_id),
                    value: JSON.stringify({
                      k: key,
                      v: JSON.stringify(value),
                      o: JSON.stringify(options)
                    })
                  });
                  return ops;
                })["catch"](function (e) {
                  console.error("Oops...The Create operation is interrupted by an internal error.");
                  return e;
                });

              case 9:
                ops = _context4.sent;
                return _context4.abrupt("return", new Promise(function (resolve, reject) {
                  if (ops instanceof EvalError) {
                    reject(ops);
                  }

                  _this5.db.batch(ops).then(function (info) {
                    resolve("Put: " + key + " successfully.");
                  })["catch"](function (e) {
                    console.error(e);
                    console.error("Oops...The Create operation is interrupted by an internal error.");
                    reject(e);
                  });
                }));

              case 11:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function update(_x4, _x5, _x6, _x7) {
        return _update.apply(this, arguments);
      }

      return update;
    }()
  }, {
    key: "put",
    value: function () {
      var _put = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee5(key, value, options) {
        var doc_id, doc_count, obj;
        return _regenerator["default"].wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                doc_id = (0, _md["default"])(key);
                doc_count = this.doc_count;
                console.log(this.doc_count);

                if (!(!doc_count && doc_count !== 0)) {
                  _context5.next = 6;
                  break;
                }

                console.error("There are some internal errors inside the db about the docs' count, the PUT operation failed."); //TODO this.doc_count_fix()

                return _context5.abrupt("return", Promise.reject(false));

              case 6:
                _context5.next = 8;
                return this.db.get(construct_key(doc_id))["catch"](function (e) {
                  if (e.type === "NotFoundError") {
                    return false;
                  }
                });

              case 8:
                obj = _context5.sent;
                options = this.init_options(options);
                _context5.prev = 10;

                if (obj) {
                  _context5.next = 17;
                  break;
                }

                _context5.next = 14;
                return this.create(key, value, options);

              case 14:
                return _context5.abrupt("return", _context5.sent);

              case 17:
                obj = JSON.parse(obj);
                obj["v"] = JSON.parse(obj["v"]);
                obj["o"] = JSON.parse(obj["o"]);

                if (!(key === obj["k"] && value === obj["v"] && options === obj["o"])) {
                  _context5.next = 24;
                  break;
                }

                return _context5.abrupt("return", true);

              case 24:
                _context5.next = 26;
                return this.update(key, value, options, obj);

              case 26:
                return _context5.abrupt("return", _context5.sent);

              case 27:
                _context5.next = 32;
                break;

              case 29:
                _context5.prev = 29;
                _context5.t0 = _context5["catch"](10);
                return _context5.abrupt("return", _context5.t0);

              case 32:
              case "end":
                return _context5.stop();
            }
          }
        }, _callee5, this, [[10, 29]]);
      }));

      function put(_x8, _x9, _x10) {
        return _put.apply(this, arguments);
      }

      return put;
    }()
  }, {
    key: "del",
    value: function () {
      var _del = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee6(key) {
        var _this6 = this;

        var doc_id, doc_count, obj, value, options, tokens, promise_arr, _i4, _Object$keys4, token, ops;

        return _regenerator["default"].wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                doc_id = (0, _md["default"])(key);
                doc_count = this.doc_count;

                if (!(!doc_count && doc_count !== 0)) {
                  _context6.next = 5;
                  break;
                }

                console.error("There are some internal errors inside the db about the docs' count, the DEL operation failed."); //TODO this.doc_count_fix()

                return _context6.abrupt("return", Promise.reject(false));

              case 5:
                _context6.next = 7;
                return this.db.get(construct_key(doc_id))["catch"](function (e) {
                  if (e.type === "NotFoundError") {
                    return false;
                  }
                });

              case 7:
                obj = _context6.sent;
                _context6.prev = 8;

                if (obj) {
                  _context6.next = 13;
                  break;
                }

                return _context6.abrupt("return", Promise.resolve("The input key is not exist."));

              case 13:
                obj = JSON.parse(obj);
                this.doc_count -= 1;
                value = JSON.parse(obj["v"]);
                options = JSON.parse(obj["o"]);
                tokens = this.get_tokens(key, value, options);
                promise_arr = [];

                for (_i4 = 0, _Object$keys4 = Object.keys(tokens); _i4 < _Object$keys4.length; _i4++) {
                  token = _Object$keys4[_i4];
                  promise_arr.push(this.search_index(token));
                }

                _context6.next = 22;
                return Promise.all(promise_arr).then(function (results) {
                  var ops = [];
                  var _iteratorNormalCompletion3 = true;
                  var _didIteratorError3 = false;
                  var _iteratorError3 = undefined;

                  try {
                    for (var _iterator3 = results[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                      var _obj = _step3.value;
                      //DEL:
                      _obj["l"] -= 1;
                      delete _obj["v"][doc_id]; //there is no other doc related to this index, delete it

                      if (_obj["l"] === 0 && Object.keys(_obj["v"]).length === 0) {
                        ops.push({
                          type: "del",
                          key: construct_index(_obj["t"])
                        });
                      } else {
                        ops.push({
                          type: "put",
                          key: construct_index(_obj["t"]),
                          value: JSON.stringify(_obj)
                        });
                      }
                    }
                  } catch (err) {
                    _didIteratorError3 = true;
                    _iteratorError3 = err;
                  } finally {
                    try {
                      if (!_iteratorNormalCompletion3 && _iterator3["return"] != null) {
                        _iterator3["return"]();
                      }
                    } finally {
                      if (_didIteratorError3) {
                        throw _iteratorError3;
                      }
                    }
                  }

                  ops.push({
                    type: "del",
                    key: construct_key(doc_id)
                  });
                  ops.push({
                    type: "put",
                    key: "0x000_doc_count",
                    value: _this6.doc_count.toString()
                  });
                  return ops;
                })["catch"](function (e) {
                  console.error("Oops...The Delete operation is interrupted by an internal error.");
                  return e;
                });

              case 22:
                ops = _context6.sent;
                return _context6.abrupt("return", new Promise(function (resolve, reject) {
                  if (ops instanceof EvalError) {
                    _this6.doc_count += 1;
                    reject(ops);
                  }

                  _this6.db.batch(ops).then(function (info) {
                    resolve("Del: " + key + " successfully.");
                  })["catch"](function (e) {
                    _this6.doc_count += 1;
                    console.error(e);
                    console.error("Oops...The Delete operation is interrupted by an internal error.");
                    reject(e);
                  });
                }));

              case 24:
                _context6.next = 29;
                break;

              case 26:
                _context6.prev = 26;
                _context6.t0 = _context6["catch"](8);
                return _context6.abrupt("return", _context6.t0);

              case 29:
              case "end":
                return _context6.stop();
            }
          }
        }, _callee6, this, [[8, 26]]);
      }));

      function del(_x11) {
        return _del.apply(this, arguments);
      }

      return del;
    }()
  }, {
    key: "get",
    value: function () {
      var _get = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee7(key) {
        var doc_id, obj;
        return _regenerator["default"].wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                doc_id = (0, _md["default"])(key);
                _context7.next = 3;
                return this.db.get(construct_key(doc_id))["catch"](function (e) {
                  if (e.type === "NotFoundError") {
                    return false;
                  }
                });

              case 3:
                obj = _context7.sent;
                _context7.prev = 4;
                obj = JSON.parse(obj);
                return _context7.abrupt("return", {
                  key: obj["k"],
                  value: JSON.parse(obj["v"]),
                  options: JSON.parse(obj["o"])
                });

              case 9:
                _context7.prev = 9;
                _context7.t0 = _context7["catch"](4);
                console.error("Oops...The Get operation is interrupted by an internal error.");
                return _context7.abrupt("return", _context7.t0);

              case 13:
              case "end":
                return _context7.stop();
            }
          }
        }, _callee7, this, [[4, 9]]);
      }));

      function get(_x12) {
        return _get.apply(this, arguments);
      }

      return get;
    }()
  }, {
    key: "get_all",
    value: function get_all() {
      this.db.createReadStream().on('data', function (data) {
        console.log(data.key, '=', data.value);
      }).on('error', function (err) {
        console.log('Oh my!', err);
      }).on('close', function () {
        console.log('Stream closed');
      }).on('end', function () {
        console.log('Stream ended');
      });
    }
  }]);
  return Min;
}();

module.exports = Min;