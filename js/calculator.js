"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var BLANK_INPUT = {
    buy: undefined,
    sell: Array(12).map(function (_) { return undefined; }),
    firstWeek: false,
};
function getInputNum(id) {
    var elt = document.getElementById(id);
    if (elt === null) {
        console.warn("input with id=" + id + " not found");
        return undefined;
    }
    var out = parseInt(elt.value, 10);
    if (isNaN(out)) {
        return undefined;
    }
    else {
        return out;
    }
}
function setInputNum(id, num) {
    var _a, _b;
    var elt = document.getElementById(id);
    if (elt === null) {
        console.warn("input with id=" + id + " not found");
        return;
    }
    var out = (_b = (_a = num) === null || _a === void 0 ? void 0 : _a.toString(), (_b !== null && _b !== void 0 ? _b : ""));
    elt.value = out;
}
function getInputBool(id) {
    var elt = document.getElementById(id);
    if (elt === null) {
        console.warn("input with id=" + id + " not found");
        return false;
    }
    return elt.checked;
}
function setInputBool(id, bool) {
    var elt = document.getElementById(id);
    if (elt === null) {
        console.warn("input with id=" + id + " not found");
        return;
    }
    elt.checked = bool;
}
function getInput() {
    var buy = getInputNum("buy");
    var sell = [];
    for (var i = 0; i < 12; i++) {
        sell.push(getInputNum("sell" + i));
    }
    var firstWeek = getInputBool("first-week");
    return { buy: buy, sell: sell, firstWeek: firstWeek };
}
function setInput(input) {
    setInputNum("buy", input.buy);
    for (var i = 0; i < 12; i++) {
        setInputNum("sell" + i, input.sell[i]);
    }
    setInputBool("first-week", input.firstWeek);
    updateOutput();
}
function clearInput() {
    setInput(BLANK_INPUT);
}
function loadInput() {
    var out = __assign({}, BLANK_INPUT);
    var savedString = localStorage.getItem("input");
    if (savedString === null) {
        return out;
    }
    var saved;
    try {
        saved = JSON.parse(savedString);
    }
    catch (e) {
        return out;
    }
    if (typeof saved !== "object" || saved === null) {
        return out;
    }
    if ("buy" in saved) {
        var buy = saved.buy;
        if (typeof buy === "number") {
            out.buy = buy;
        }
    }
    if ("sell" in saved) {
        var sell = saved.sell;
        if (Array.isArray(sell)) {
            var safeSell = sell.map(function (val) { return typeof val === "number" ? val : undefined; });
            if (safeSell.length === 12) {
                out.sell = safeSell;
            }
        }
    }
    if ("firstWeek" in saved) {
        var firstWeek = saved.firstWeek;
        if (typeof firstWeek === "boolean") {
            out.firstWeek = firstWeek;
        }
    }
    return out;
}
function saveInput(input) {
    localStorage.setItem("input", JSON.stringify({
        buy: toNull(input.buy),
        sell: input.sell.map(toNull),
        firstWeek: input.firstWeek,
    }));
}
function toNull(x) {
    return (x !== null && x !== void 0 ? x : null);
}
function fromNull(x) {
    return (x !== null && x !== void 0 ? x : undefined);
}
function updateOutput() {
    var input = getInput();
    var turnips = Turnips.fromInput(input.buy, input.sell);
    var patterns = input.firstWeek ? turnips.generateFirstBuyWeek() : turnips.generateAllPatterns();
    var output = patterns.map(function (res) { return res.toString(); }).join("\n").replace(/,(?=\d)/g, ", ") || "No solutions found!";
    document.getElementById("calculator-output").innerText = output;
    saveInput(input);
}
function loadSavedInput() {
    setInput(loadInput());
}
window.addEventListener("load", function () {
    var _a;
    document.addEventListener("input", function () { return updateOutput(); });
    (_a = document.getElementById("clear-button")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", function () { return clearInput(); });
    loadSavedInput();
});
