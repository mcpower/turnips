type Input = {
    buy: number | undefined;
    // Dynamically guaranteed to be 12 long.
    sell: (number | undefined)[];
    firstWeek: boolean;
}

const BLANK_INPUT: Input = {
    buy: undefined,
    sell: Array(12).map((_) => undefined),
    firstWeek: false,
}

function getInputNum(id: string): number | undefined {
    const elt = document.getElementById(id) as HTMLInputElement | null;
    if (elt === null) {
        console.warn(`input with id=${id} not found`);
        return undefined;
    }
    const out = parseInt(elt.value, 10);
    if (isNaN(out)) {
        return undefined;
    } else {
        return out;
    }
}

function setInputNum(id: string, num: number | undefined) {
    const elt = document.getElementById(id) as HTMLInputElement | null;
    if (elt === null) {
        console.warn(`input with id=${id} not found`);
        return;
    }
    // NOTE: num.toString() could be in exponential form like 1e50
    // we're gonna assume that we're not gonna pass in those values :P
    const out = num?.toString() ?? "";
    elt.value = out;
}

function getInputBool(id: string): boolean {
    const elt = document.getElementById(id) as HTMLInputElement | null;
    if (elt === null) {
        console.warn(`input with id=${id} not found`);
        return false;
    }
    return elt.checked;
}

function setInputBool(id: string, bool: boolean) {
    const elt = document.getElementById(id) as HTMLInputElement | null;
    if (elt === null) {
        console.warn(`input with id=${id} not found`);
        return;
    }
    elt.checked = bool;
}

function getInput(): Input {
    const buy = getInputNum("buy");
    const sell: (number | undefined)[] = [];
    for (let i = 0; i < 12; i++) {
        sell.push(getInputNum("sell" + i));
    }
    const firstWeek = getInputBool("first-week");
    return { buy, sell, firstWeek };
}

// Updates output too.
function setInput(input: Input) {
    setInputNum("buy", input.buy);
    for (let i = 0; i < 12; i++) {
        setInputNum("sell" + i, input.sell[i])
    }
    setInputBool("first-week", input.firstWeek);
    updateOutput();
}

function clearInput() {
    setInput(BLANK_INPUT);
}

function loadInput(): Input {
    const out = { ...BLANK_INPUT };
    const savedString = localStorage.getItem("input");
    if (savedString === null) {
        return out;
    }
    let saved;
    try {
        // this is safe, as we're in a try block
        saved = JSON.parse(savedString);
    } catch (e) {
        return out;
    }
    if (typeof saved !== "object" || saved === null) {
        return out;
    }

    if ("buy" in saved) {
        const buy = saved.buy as unknown;
        if (typeof buy === "number") {
            out.buy = buy;
        }
    }

    if ("sell" in saved) {
        const sell = saved.sell as unknown;
        if (Array.isArray(sell)) {
            let safeSell = sell.map((val) => typeof val === "number" ? val : undefined);
            if (safeSell.length === 12) {
                out.sell = safeSell;
            }
        }
    }

    if ("firstWeek" in saved) {
        const firstWeek = saved.firstWeek as unknown;
        if (typeof firstWeek === "boolean") {
            out.firstWeek = firstWeek;
        }
    }

    return out;
}

function saveInput(input: Input) {
    localStorage.setItem("input", JSON.stringify({
        buy: toNull(input.buy),
        sell: input.sell.map(toNull),
        firstWeek: input.firstWeek,
    }));
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
    const input = getInput();
    const turnips = Turnips.fromInput(input.buy, input.sell);
    const patterns = input.firstWeek ? turnips.generateFirstBuyWeek() : turnips.generateAllPatterns();
    const output = patterns.map((res) => res.toString()).join("\n").replace(/,(?=\d)/g, ", ") || "No solutions found!";
    document.getElementById("calculator-output")!.innerText = output;

    saveInput(input);
}

function loadSavedInput() {
    setInput(loadInput());
}

window.addEventListener("load", () => {
    document.addEventListener("input", () => updateOutput());
    document.getElementById("clear-button")?.addEventListener("click", () => clearInput());
    loadSavedInput();
});
