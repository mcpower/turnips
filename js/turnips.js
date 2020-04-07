"use strict";
"If you're reading turnips.js, you should know that it's compiled from turnips.ts :D";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
function assert(cond, msg) {
    if (!cond) {
        throw new Error(msg);
    }
}
var SCALE = 10000;
var Interval = (function () {
    function Interval(l, r) {
        assert(!isNaN(l) && !isNaN(r), "invalid interval: NaN");
        assert(l <= r, "invalid interval: " + l + " > " + r);
        this.l = l;
        this.r = r;
    }
    Interval.prototype.neg = function () {
        return new Interval(-this.r, -this.l);
    };
    Interval.prototype.add = function (other) {
        return new Interval(this.l + other.l, this.r + other.r);
    };
    Interval.prototype.sub = function (other) {
        return this.add(other.neg());
    };
    Interval.prototype.mul = function (other) {
        var candidates = [this.l * other.l, this.l * other.r, this.r * other.l, this.r * other.r];
        return new Interval(Math.min.apply(Math, candidates) / SCALE, Math.max.apply(Math, candidates) / SCALE);
    };
    Interval.prototype.div = function (other) {
        var candidates = [this.l / other.l, this.l / other.r, this.r / other.l, this.r / other.r];
        return new Interval(Math.min.apply(Math, candidates) * SCALE, Math.max.apply(Math, candidates) * SCALE);
    };
    Interval.prototype.intersect = function (other) {
        var l = Math.max(this.l, other.l);
        var r = Math.min(this.r, other.r);
        if (l > r) {
            return undefined;
        }
        else {
            return new Interval(l, r);
        }
    };
    Interval.prototype.toString = function () {
        return this.l / SCALE + ".." + this.r / SCALE;
    };
    Interval.prototype.toHumanString = function () {
        var l = ((this.l + SCALE - 1) / SCALE) | 0;
        var r = ((this.r + SCALE - 1) / SCALE) | 0;
        return l + ".." + r;
    };
    Interval.fromLR = function (l, r) {
        return new Interval(l * SCALE, r * SCALE);
    };
    return Interval;
}());
var Turnips = (function () {
    function Turnips(buy, sell, pattern) {
        assert(sell.length == 14);
        this.buy = buy;
        this.sell = sell;
        this.pattern = pattern;
    }
    Turnips.prototype.copy = function () {
        return new Turnips(this.buy, __spreadArrays(this.sell), this.pattern);
    };
    Turnips.prototype.updateRel = function (idx, mul) {
        return this.update(idx, this.buy.mul(mul));
    };
    Turnips.prototype.update = function (idx, interval) {
        var updated = this.sell[idx].intersect(interval);
        if (updated === undefined) {
            return undefined;
        }
        this.sell[idx] = updated;
        return updated;
    };
    Turnips.prototype.decreasing = function (start, end, startRel, dropRel) {
        assert(start < end);
        var temp = this.updateRel(start, startRel);
        if (!temp)
            return;
        var lastPrice = temp;
        var drop = this.buy.mul(dropRel);
        for (var work = start + 1; work < end; work++) {
            temp = this.update(work, lastPrice.sub(drop));
            if (!temp)
                return;
            lastPrice = temp;
        }
        for (var work = end - 2; work >= start; work--) {
            temp = this.update(work, lastPrice.add(drop));
            if (!temp)
                return;
            lastPrice = temp;
        }
        return this;
    };
    Turnips.prototype.pattern0 = function (decPhaseLen1Is3, hiPhaseLen1, hiPhaseLen3) {
        this.pattern = 0;
        var decPhaseLen1 = decPhaseLen1Is3 ? 3 : 2;
        var decPhaseLen2 = 5 - decPhaseLen1;
        assert(0 <= hiPhaseLen1 && hiPhaseLen1 <= 6);
        var hiPhaseLen2and3 = 7 - hiPhaseLen1;
        assert(0 <= hiPhaseLen3 && hiPhaseLen3 <= hiPhaseLen2and3 - 1);
        var work = 2;
        for (var i = 0; i < hiPhaseLen1; i++) {
            if (!this.updateRel(work++, Interval.fromLR(0.9, 1.4)))
                return;
        }
        if (!this.decreasing(work, work + decPhaseLen1, Interval.fromLR(0.6, 0.8), Interval.fromLR(0.04, 0.1)))
            return;
        work += decPhaseLen1;
        for (var i = 0; i < (hiPhaseLen2and3 - hiPhaseLen3); i++) {
            if (!this.updateRel(work++, Interval.fromLR(0.9, 1.4)))
                return;
        }
        if (!this.decreasing(work, work + decPhaseLen2, Interval.fromLR(0.6, 0.8), Interval.fromLR(0.04, 0.1)))
            return;
        work += decPhaseLen2;
        for (var i = 0; i < hiPhaseLen3; i++) {
            if (!this.updateRel(work++, Interval.fromLR(0.9, 1.4)))
                return;
        }
        assert(work === 14);
        return this;
    };
    Turnips.prototype.pattern1 = function (peakStart) {
        this.pattern = 1;
        assert(3 <= peakStart && peakStart <= 9);
        if (!this.decreasing(2, peakStart, Interval.fromLR(0.85, 0.9), Interval.fromLR(0.03, 0.05)))
            return;
        var work = peakStart;
        if (!this.updateRel(work++, Interval.fromLR(0.9, 1.4)))
            return;
        if (!this.updateRel(work++, Interval.fromLR(1.4, 2.0)))
            return;
        if (!this.updateRel(work++, Interval.fromLR(2.0, 6.0)))
            return;
        if (!this.updateRel(work++, Interval.fromLR(1.4, 2.0)))
            return;
        if (!this.updateRel(work++, Interval.fromLR(0.9, 1.4)))
            return;
        for (; work < 14; work++) {
            if (!this.updateRel(work, Interval.fromLR(0.4, 0.9)))
                return;
        }
        return this;
    };
    Turnips.prototype.pattern2 = function () {
        this.pattern = 2;
        return this.decreasing(2, 14, Interval.fromLR(0.85, 0.9), Interval.fromLR(0.03, 0.05));
    };
    Turnips.prototype.pattern3 = function (peakStart) {
        this.pattern = 3;
        assert(2 <= peakStart && peakStart <= 9);
        var work = 2;
        if (peakStart > 2) {
            if (!this.decreasing(2, peakStart, Interval.fromLR(0.4, 0.9), Interval.fromLR(0.03, 0.05)))
                return;
            work = peakStart;
        }
        if (!this.updateRel(work++, Interval.fromLR(0.9, 1.4)))
            return;
        if (!this.updateRel(work++, Interval.fromLR(0.9, 1.4)))
            return;
        var peak = this.updateRel(work + 1, Interval.fromLR(1.4, 2.0));
        if (!peak)
            return;
        var leftRightRange = new Interval(this.buy.l * 1.4 - SCALE, peak.r - SCALE);
        var left = this.update(work, leftRightRange);
        var right = this.update(work + 2, leftRightRange);
        if (!left || !right)
            return;
        peak = this.update(work + 1, new Interval(Math.max(left.l, right.l) + SCALE, 700 * SCALE));
        if (!peak)
            return;
        work += 3;
        if (work < 14) {
            if (!this.decreasing(work, 14, Interval.fromLR(0.4, 0.9), Interval.fromLR(0.03, 0.05)))
                return;
        }
        return this;
    };
    Turnips.prototype.generatePattern0 = function () {
        var out = [];
        for (var decPhaseLen1Is3 = 0; decPhaseLen1Is3 < 2; decPhaseLen1Is3++) {
            for (var hiPhaseLen1 = 0; hiPhaseLen1 <= 6; hiPhaseLen1++) {
                var hiPhaseLen2and3 = 7 - hiPhaseLen1;
                for (var hiPhaseLen3 = 0; hiPhaseLen3 <= hiPhaseLen2and3 - 1; hiPhaseLen3++) {
                    var candidate = this.copy().pattern0(decPhaseLen1Is3 === 1, hiPhaseLen1, hiPhaseLen3);
                    if (candidate) {
                        out.push(candidate);
                    }
                }
            }
        }
        return out;
    };
    Turnips.prototype.generatePattern1 = function () {
        var out = [];
        for (var peakStart = 3; peakStart <= 9; peakStart++) {
            var candidate = this.copy().pattern1(peakStart);
            if (candidate) {
                out.push(candidate);
            }
        }
        return out;
    };
    Turnips.prototype.generatePattern2 = function () {
        var out = [];
        var candidate = this.copy().pattern2();
        if (candidate) {
            out.push(candidate);
        }
        return out;
    };
    Turnips.prototype.generatePattern3 = function () {
        var out = [];
        for (var peakStart = 2; peakStart <= 9; peakStart++) {
            var candidate = this.copy().pattern3(peakStart);
            if (candidate) {
                out.push(candidate);
            }
        }
        return out;
    };
    Turnips.prototype.generateAllPatterns = function () {
        return __spreadArrays(this.generatePattern0(), this.generatePattern1(), this.generatePattern2(), this.generatePattern3());
    };
    Turnips.prototype.generateFirstBuyWeek = function () {
        var newThis = this.copy();
        newThis.buy = Interval.fromLR(90, 110);
        return newThis.generatePattern3();
    };
    Turnips.prototype.toString = function () {
        var _a;
        return "Turnips { pattern: " + (_a = this.pattern, (_a !== null && _a !== void 0 ? _a : '?')) + ", buy: " + this.buy + ", sell: " + this.sell.slice(2) + " }";
    };
    Turnips.fromInput = function (buy, sell) {
        assert(sell.length <= 12);
        sell.push.apply(sell, new Array(12 - sell.length));
        assert(sell.length == 12);
        var buyInterval = buy !== undefined ?
            Interval.fromLR(buy, buy) :
            Interval.fromLR(90, 110);
        var sellIntervals = sell.map(function (price) {
            return price !== undefined ?
                Interval.fromLR(price - 1, price) :
                Interval.fromLR(1, 700);
        });
        return new Turnips(buyInterval, __spreadArrays([Interval.fromLR(0, 0), Interval.fromLR(0, 0)], sellIntervals));
    };
    return Turnips;
}());
console.log("turnips.ts loaded");
