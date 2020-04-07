function getInputNum(id: string): number | undefined {
    const elt = document.getElementById(id) as HTMLInputElement | null;
    assert(elt !== null);
    const out = parseInt(elt.value, 10);
    if (isNaN(out)) {
        return undefined;
    } else {
        return out;
    }
}

// NOTE: if calculating prices is expensive, we should probably
// avoid recalculating everything on any input change
function updateOutput() {
    console.log("updating!");
    // gets the input
    const buy = getInputNum("buy");
    const sell: (number | undefined)[] = [];
    for (let i = 0; i < 12; i++) {
        sell.push(getInputNum("sell" + i));
    }

    const turnips = Turnips.fromInput(buy, sell);
    const output = turnips.generateAllPatterns().map((res) => res.toString()).join("\n").replace(/,(?=\d)/g, ", ") || "No solutions found!";
    document.getElementById("calculator-output")!.innerText = output;
}

window.addEventListener("load", () => {
    document.addEventListener("input", () => updateOutput());
    updateOutput();
});
