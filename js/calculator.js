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
}
window.addEventListener("load", function () {
    document.addEventListener("input", function () { return updateOutput(); });
    updateOutput();
});
