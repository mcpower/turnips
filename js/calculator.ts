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

function setInputNum(id: string, num: number | undefined) {
    const elt = document.getElementById(id) as HTMLInputElement | null;
    assert(elt !== null);
    // NOTE: num.toString() could be in exponential form like 1e50
    // we're gonna assume that we're not gonna pass in those values :P
    const out = num !== undefined ? num.toString() : "";
    elt.value = out;
}

function toNull<T>(x: T | undefined): T | null {
    return x ?? null;
}

function fromNull<T>(x: T | null): T | undefined {
    return x ?? undefined;
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
    const firstWeek = !!(document.getElementById("first-week") as HTMLInputElement | null)?.checked;
    const patterns = firstWeek ? turnips.generateFirstBuyWeek() : turnips.generateAllPatterns();
    const output = patterns.map((res) => res.toString()).join("\n").replace(/,(?=\d)/g, ", ") || "No solutions found!";
    document.getElementById("calculator-output")!.innerText = output;

    localStorage.setItem("input", JSON.stringify({buy: toNull(buy), sell: sell.map(toNull), firstWeek}));
}

function loadSavedInput() {
    try {
        const savedString = localStorage.getItem("input");
        if (savedString === null) {
            return;
        }
        // this is safe, as we're in a try block
        const saved = JSON.parse(savedString);
        if (typeof saved !== "object" || saved === null) {
            return;
        }
        // saved is guaranteed to be object-like.
        // from now on, gracefully handle sell/buy errors.

        if ("buy" in saved) {
            const buy = saved.buy;
            if (typeof buy === "number" || buy === null) {
                setInputNum("buy", fromNull(buy));
            }
        }

        if ("sell" in saved) {
            const sell = saved.sell;
            if (Array.isArray(sell)) {
                sell.forEach((val, i) => {
                    if (i < 12 && typeof val === "number" || val === null) {
                        setInputNum("sell" + i, fromNull(val));
                    }
                });
            }
        }

        if ("firstWeek" in saved) {
            if (saved.firstWeek === true) {
                const elt = document.getElementById("first-week") as HTMLInputElement | null;
                if (elt) {
                    elt.checked = true;
                }
            }
        }
    } catch (e) {

    }
}

window.addEventListener("load", () => {
    document.addEventListener("input", () => updateOutput());
    loadSavedInput();
    updateOutput();
});
