"If you're reading turnips.js, you should know that it's compiled from turnips.ts :D";

function assert(cond: boolean, msg?: string): asserts cond {
    if (!cond) {
        throw new Error(msg);
    }
}

const SCALE = 10000;

class Interval {
    l: number;
    r: number;

    constructor(l: number, r: number) {
        // l and r are pre-scaled
        assert(!isNaN(l) && !isNaN(r), "invalid interval: NaN");
        assert(l <= r, `invalid interval: ${l} > ${r}`);
        this.l = l;
        this.r = r;
    }

    neg(): Interval {
        return new Interval(-this.r, -this.l);
    }

    add(other: Interval): Interval {
        return new Interval(this.l + other.l, this.r + other.r);
    }

    sub(other: Interval): Interval {
        return this.add(other.neg());
    }

    mul(other: Interval): Interval {
        const candidates = [this.l * other.l, this.l * other.r, this.r * other.l, this.r * other.r];
        return new Interval(Math.min(...candidates) / SCALE, Math.max(...candidates) / SCALE);
    }

    div(other: Interval): Interval {
        // does this even work????
        // it should????
        const candidates = [this.l / other.l, this.l / other.r, this.r / other.l, this.r / other.r];
        return new Interval(Math.min(...candidates) * SCALE, Math.max(...candidates) * SCALE);
    }

    intersect(other: Interval): Interval | undefined {
        // max L, min R
        const l = Math.max(this.l, other.l);
        const r = Math.min(this.r, other.r);
        if (l > r) {
            return undefined;
        } else {
            return new Interval(l, r);
        }
    }

    toString(): string {
        return `${this.l / SCALE}..${this.r / SCALE}`;
    }

    toHumanString(): string {
        // "round up" l and r
        const l = ((this.l + SCALE - 1) / SCALE) | 0;
        const r = ((this.r + SCALE - 1) / SCALE) | 0;
        return `${l}..${r}`;
    }

    static fromLR(l: number, r: number): Interval {
        return new Interval(l * SCALE, r * SCALE);
    }
}

class Turnips {
    /**
     * The buying price.
     */
    buy: Interval;
    /**
     * The selling prices, as a 12-long list.
     */
    sell: Interval[];

    pattern: number | undefined;

    /**
     * @param buy The buy price.
     * @param sell The selling prices, as a 14-long list.
     */
    constructor(buy: Interval, sell: Interval[], pattern?: number) {
        assert(sell.length == 14);
        this.buy = buy;
        this.sell = sell;
        this.pattern = pattern;
    }

    copy(): Turnips {
        return new Turnips(this.buy, [...this.sell], this.pattern);
    }

    /**
     * Updates an interval IN-PLACE as a multiple of the buy price.
     * @param idx 
     * @param interval 
     * @returns The new interval, or undefined if it did not work.
     */
    updateRel(idx: number, mul: Interval): Interval | undefined {
        return this.update(idx, this.buy.mul(mul));
    }

    /**
     * Updates an interval IN-PLACE.
     * @param idx 
     * @param interval 
     * @returns The new interval, or undefined if it did not work.
     */
    update(idx: number, interval: Interval): Interval | undefined {
        const updated = this.sell[idx].intersect(interval);
        if (updated === undefined) {
            return undefined;
        }
        this.sell[idx] = updated;
        return updated;
    }

    /**
     * Shared logic for "decreasing" drops.
     * @param start First half-day to start decreasing.
     * @param end The half-day after decreasing finishes. Must be greater than start.
     * @param startRel The starting price, relative to buy.
     * @param dropRel The half-day drop, relative to buy.
     * @returns Mutated self, if succeded, otherwise undefined.
     */
    decreasing(start: number, end: number, startRel: Interval, dropRel: Interval): Turnips | undefined {
        assert(start < end);

        let temp = this.updateRel(start, startRel);
        if (!temp) return;
        let lastPrice: Interval = temp;
        const drop = this.buy.mul(dropRel);
        
        // go forward.
        // work in [start+1, end-1]
        for (let work = start+1; work < end; work++) {
            temp = this.update(work, lastPrice.sub(drop));
            if (!temp) return;
            lastPrice = temp;
        }

        // go backwards.
        // this only needs to start at the left-most "non-update"
        // i.e. when calling this.update doesn't do anything.
        // we may as well do everything, though...

        // lastPrice == sell[end - 1]
        // let's go backwards, starting with the one before lastPrice
        // i.e. end - 2
        // work in [start, end-2]
        for (let work = end-2; work >= start; work--) {
            temp = this.update(work, lastPrice.add(drop));
            if (!temp) return;
            lastPrice = temp;
        }

        return this;
    }

    /**
     * Updates this IN-PLACE as if it were pattern 0 with the given params.
     * If failed, self will be in an inconsistent state.
     * @param decPhaseLen1Is3 
     * @param hiPhaseLen1 
     * @param hiPhaseLen3 
     * @returns Mutated self, if succeded, otherwise undefined.
     */
    pattern0(decPhaseLen1Is3: boolean, hiPhaseLen1: number, hiPhaseLen3: number): Turnips | undefined {
        this.pattern = 0;
        const decPhaseLen1 = decPhaseLen1Is3 ? 3 : 2;
        const decPhaseLen2 = 5 - decPhaseLen1;
        
        assert(0 <= hiPhaseLen1 && hiPhaseLen1 <= 6);
        const hiPhaseLen2and3 = 7 - hiPhaseLen1;
        assert(0 <= hiPhaseLen3 && hiPhaseLen3 <= hiPhaseLen2and3 - 1);

        let work = 2;
        for (let i = 0; i < hiPhaseLen1; i++) {
            if (!this.updateRel(work++, Interval.fromLR(0.9, 1.4))) return;
        }

        if (!this.decreasing(work, work + decPhaseLen1, Interval.fromLR(0.6, 0.8), Interval.fromLR(0.04, 0.1))) return;
        work += decPhaseLen1;

        for (let i = 0; i < (hiPhaseLen2and3 - hiPhaseLen3); i++) {
            if (!this.updateRel(work++, Interval.fromLR(0.9, 1.4))) return;
        }

        if (!this.decreasing(work, work + decPhaseLen2, Interval.fromLR(0.6, 0.8), Interval.fromLR(0.04, 0.1))) return;
        work += decPhaseLen2;

        for (let i = 0; i < hiPhaseLen3; i++) {
            if (!this.updateRel(work++, Interval.fromLR(0.9, 1.4))) return;
        }

        assert(work === 14);
        return this;
    }

    /**
     * Updates this IN-PLACE as if it were pattern 1 with a given peakStart.
     * If failed, self will be in an inconsistent state.
     * @param peakStart 
     * @returns Mutated self, if succeded, otherwise undefined.
     */
    pattern1(peakStart: number): Turnips | undefined {
        this.pattern = 1;
        assert(3 <= peakStart && peakStart <= 9);
        if (!this.decreasing(2, peakStart, Interval.fromLR(0.85, 0.9), Interval.fromLR(0.03, 0.05))) return;
        let work = peakStart;
        if (!this.updateRel(work++, Interval.fromLR(0.9, 1.4))) return;
        if (!this.updateRel(work++, Interval.fromLR(1.4, 2.0))) return;
        if (!this.updateRel(work++, Interval.fromLR(2.0, 6.0))) return;
        if (!this.updateRel(work++, Interval.fromLR(1.4, 2.0))) return;
        if (!this.updateRel(work++, Interval.fromLR(0.9, 1.4))) return;
        for (; work < 14; work++) {
            if (!this.updateRel(work, Interval.fromLR(0.4, 0.9))) return;
        }
        return this;
    }

    /**
     * Updates this IN-PLACE as if it were pattern 2.
     * If failed, self will be in an inconsistent state.
     * @returns Mutated self, if succeded, otherwise undefined.
     */
    pattern2(): Turnips | undefined {
        this.pattern = 2;
        return this.decreasing(2, 14, Interval.fromLR(0.85, 0.9), Interval.fromLR(0.03, 0.05));
    }

    /**
     * Updates this IN-PLACE as if it were pattern 3 with a given peakStart.
     * If failed, self will be in an inconsistent state.
     * @param peakStart 
     * @returns Mutated self, if succeded, otherwise undefined.
     */
    pattern3(peakStart: number): Turnips | undefined {
        this.pattern = 3;
        assert(2 <= peakStart && peakStart <= 9);
        let work = 2;
        
        if (peakStart > 2) {
            if (!this.decreasing(2, peakStart, Interval.fromLR(0.4, 0.9), Interval.fromLR(0.03, 0.05))) return;
            work = peakStart;
        }
        if (!this.updateRel(work++, Interval.fromLR(0.9, 1.4))) return;
        if (!this.updateRel(work++, Interval.fromLR(0.9, 1.4))) return;

        let peak = this.updateRel(work+1, Interval.fromLR(1.4, 2.0));
        if (!peak) return;

        // left and right of peak is between buy*1.4 and peak (minus one)
        // update left and right, then update peak based on left/right
        // how many times do we need to do this update back-and-forth?
        // my gut says one back-and-forth, similar to decreasings.
        // but there's two sides to this peak!!

        // we can use some heuristics - peak is either small (we already have a peak),
        // or it's big (no peak information).
        // if it's small, we shouldn't need to repeat the back-and-forth
        // if it's big... we'd update peak's lower endpoint to be higher and higher
        // (if left and right) are known
        // which doesn't make a difference for left and right (as long as it's within range!)
        
        const leftRightRange = new Interval(this.buy.l * 1.4 - SCALE, peak.r - SCALE);
        const left = this.update(work, leftRightRange);
        const right = this.update(work+2, leftRightRange);
        if (!left || !right) return;
        
        // now update peak to be bigger than left and right (+1)
        // i.e. update with left.l+1, right.l+1
        // we don't care what the max of this update is
        peak = this.update(work+1, new Interval(Math.max(left.l, right.l) + SCALE, 700 * SCALE));
        if (!peak) return;

        work += 3;

        if (work < 14) {
            if (!this.decreasing(work, 14, Interval.fromLR(0.4, 0.9), Interval.fromLR(0.03, 0.05))) return;
        }

        return this;
    }

    generatePattern0(): Turnips[] {
        let out: Turnips[] = [];
        for (let decPhaseLen1Is3 = 0; decPhaseLen1Is3 < 2; decPhaseLen1Is3++) {
            for (let hiPhaseLen1 = 0; hiPhaseLen1 <= 6; hiPhaseLen1++) {
                const hiPhaseLen2and3 = 7 - hiPhaseLen1;
                for (let hiPhaseLen3 = 0; hiPhaseLen3 <= hiPhaseLen2and3 - 1; hiPhaseLen3++) {
                    const candidate = this.copy().pattern0(decPhaseLen1Is3 === 1, hiPhaseLen1, hiPhaseLen3);
                    if (candidate) {
                        out.push(candidate);
                    }
                }
            }
        }
        return out;
    }

    generatePattern1(): Turnips[] {
        let out: Turnips[] = [];
        for (let peakStart = 3; peakStart <= 9; peakStart++) {
            const candidate = this.copy().pattern1(peakStart);
            if (candidate) {
                out.push(candidate);
            }
        }
        return out;
    }

    generatePattern2(): Turnips[] {
        let out: Turnips[] = [];
        const candidate = this.copy().pattern2();
        if (candidate) {
            out.push(candidate);
        }
        return out;
    }

    generatePattern3(): Turnips[] {
        let out: Turnips[] = [];
        for (let peakStart = 2; peakStart <= 9; peakStart++) {
            const candidate = this.copy().pattern3(peakStart);
            if (candidate) {
                out.push(candidate);
            }
        }
        return out;
    }

    generateAllPatterns(): Turnips[] {
        return [...this.generatePattern0(), ...this.generatePattern1(), ...this.generatePattern2(), ...this.generatePattern3()];
    }

    generateFirstBuyWeek(): Turnips[] {
        let newThis = this.copy();
        newThis.buy = Interval.fromLR(90, 110);
        return newThis.generatePattern3();
    }

    toString(): string {
        return `Turnips { pattern: ${this.pattern ?? '?'}, buy: ${this.buy}, sell: ${this.sell.slice(2)} }`
    }

    static fromInput(buy: number | undefined, sell: (number | undefined)[]) {
        assert(sell.length <= 12);
        sell.push(...new Array(12 - sell.length));
        assert(sell.length == 12);
        const buyInterval =
            buy !== undefined ?
            Interval.fromLR(buy, buy) : // Buy price is set.
            Interval.fromLR(90, 110);
        const sellIntervals = sell.map((price) =>
            price !== undefined ?
            Interval.fromLR(price-1, price) : // As we round up, assume it can be price-1 to price.
            Interval.fromLR(1, 700));
        return new Turnips(buyInterval, [Interval.fromLR(0, 0), Interval.fromLR(0, 0), ...sellIntervals]);
    }
}

// const turnips = Turnips.fromInput(100, [50, 46, 133, 131, 164, 187, undefined, 50, 45, 43, 37, 33]); // my first week
const turnips = Turnips.fromInput(98, [94, 74, 66, 58]); // my turnips as of writing
turnips.generateAllPatterns().forEach(t => console.log(t.toString()));
