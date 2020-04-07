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
    console.log("updating!");
    var buy = getInputNum("buy");
    var sell = [];
    for (var i = 0; i < 12; i++) {
        sell.push(getInputNum("sell" + i));
    }
    var turnips = Turnips.fromInput(buy, sell);
    var output = turnips.generateAllPatterns().map(function (res) { return res.toString(); }).join("\n").replace(/,(?=\d)/g, ", ") || "No solutions found!";
    document.getElementById("calculator-output").innerText = output;
    localStorage.setItem("input", JSON.stringify({ buy: toNull(buy), sell: sell.map(toNull) }));
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
        if (!("sell" in saved) || !("buy" in saved)) {
            return;
        }
        var buy = saved.buy;
        if (typeof buy === "number" || buy === null) {
            setInputNum("buy", fromNull(buy));
        }
        var sell = saved.sell;
        if (Array.isArray(sell)) {
            sell.forEach(function (val, i) {
                if (i < 12 && typeof val === "number" || val === null) {
                    setInputNum("sell" + i, fromNull(val));
                }
            });
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
