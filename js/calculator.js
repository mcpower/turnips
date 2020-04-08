"use strict";
function getInputNum(id) {
    var elt = document.getElementById(id);
    assert(elt !== null);
    var out = parseInt(elt.value, 10);
    if (isNaN(out)) {
        return undefined;
    }
    else {
        return out;
    }
}
function setInputNum(id, num) {
    var elt = document.getElementById(id);
    assert(elt !== null);
    var out = num !== undefined ? num.toString() : "";
    elt.value = out;
}
function toNull(x) {
    return (x !== null && x !== void 0 ? x : null);
}
function fromNull(x) {
    return (x !== null && x !== void 0 ? x : undefined);
}
function updateOutput() {
    var _a;
    console.log("updating!");
    var buy = getInputNum("buy");
    var sell = [];
    for (var i = 0; i < 12; i++) {
        sell.push(getInputNum("sell" + i));
    }
    var turnips = Turnips.fromInput(buy, sell);
    var firstWeek = !!((_a = document.getElementById("first-week")) === null || _a === void 0 ? void 0 : _a.checked);
    var patterns = firstWeek ? turnips.generateFirstBuyWeek() : turnips.generateAllPatterns();
    var output = patterns.map(function (res) { return res.toString(); }).join("\n").replace(/,(?=\d)/g, ", ") || "No solutions found!";
    document.getElementById("calculator-output").innerText = output;
    localStorage.setItem("input", JSON.stringify({ buy: toNull(buy), sell: sell.map(toNull), firstWeek: firstWeek }));
}
function loadSavedInput() {
    try {
        var savedString = localStorage.getItem("input");
        if (savedString === null) {
            return;
        }
        var saved = JSON.parse(savedString);
        if (typeof saved !== "object" || saved === null) {
            return;
        }
        if ("buy" in saved) {
            var buy = saved.buy;
            if (typeof buy === "number" || buy === null) {
                setInputNum("buy", fromNull(buy));
            }
        }
        if ("sell" in saved) {
            var sell = saved.sell;
            if (Array.isArray(sell)) {
                sell.forEach(function (val, i) {
                    if (i < 12 && typeof val === "number" || val === null) {
                        setInputNum("sell" + i, fromNull(val));
                    }
                });
            }
        }
        if ("firstWeek" in saved) {
            if (saved.firstWeek === true) {
                var elt = document.getElementById("first-week");
                if (elt) {
                    elt.checked = true;
                }
            }
        }
    }
    catch (e) {
    }
}
window.addEventListener("load", function () {
    document.addEventListener("input", function () { return updateOutput(); });
    loadSavedInput();
    updateOutput();
});
