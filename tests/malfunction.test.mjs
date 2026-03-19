import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Duplicated from site/js/app.js (no build step, so we copy the pure function)
function malfunctionChance(reliabilityPct) {
    const condShotDec = 0.01 - (reliabilityPct / 10000);
    return (2 * condShotDec * 2000) / 10;
}

describe("malfunctionChance", () => {
    it("93% reliability → 0.28%", () => {
        assert.equal(+malfunctionChance(93).toFixed(2), 0.28);
    });

    it("78% reliability → 0.88%", () => {
        assert.equal(+malfunctionChance(78).toFixed(2), 0.88);
    });

    it("100% reliability → 0% (perfect)", () => {
        assert.equal(malfunctionChance(100), 0);
    });

    it("0% reliability → 4% (worst case)", () => {
        assert.equal(malfunctionChance(0), 4);
    });

    it("50% reliability → 2%", () => {
        assert.equal(malfunctionChance(50), 2);
    });

    it("returns a number", () => {
        assert.equal(typeof malfunctionChance(85), "number");
    });

    it("higher reliability → lower malfunction chance", () => {
        assert.ok(malfunctionChance(90) < malfunctionChance(80));
    });
});
