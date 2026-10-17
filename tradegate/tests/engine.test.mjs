import assert from "node:assert/strict";
import test from "node:test";
import { assessTrade, evidenceStatus, DEMOS, PROFILES, PlanError } from "../engine.mjs";

const plan = (data = {}) => ({ ...DEMOS.equity, ...data });
const approx = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, String(a) + " != " + String(b));

test("five distinct trading evidence profiles exist", () => {
  assert.deepEqual(Object.keys(PROFILES).sort(), ["ea", "hybrid", "orderflow", "priceAction", "quant"]);
  for (const profile of Object.values(PROFILES)) assert.equal(profile.fields.length, 4);
});
test("checks are self-attested and per method", () => {
  assert.deepEqual(evidenceStatus("quant", {}), { completed: 0, total: 4, allCompleted: false });
  assert.deepEqual(evidenceStatus("ea", Object.fromEntries(PROFILES.ea.fields.map(([k]) => [k, true]))), { completed: 4, total: 4, allCompleted: true });
  assert.throws(() => evidenceStatus("unlisted", {}), PlanError);
});
test("equities: net modeled risk, R:R and breakeven win rate account for costs", () => {
  const r = assessTrade(plan());
  assert.equal(r.status, "RISK_SIZED");
  assert.equal(r.bindingConstraint, "Per-trade risk");
  assert.equal(r.quantity, 49);
  approx(r.lossPerUnit, 2.04);
  approx(r.rewardPerUnit, 5.96);
  approx(r.modeledRisk, 99.96);
  approx(r.netRR, 5.96 / 2.04);
  approx(r.breakEvenWinRate, 2.04 / 8);
});
test("futures: NQ-style $20 per point per contract, fees and assumed slippage", () => {
  const r = assessTrade(DEMOS.futures);
  assert.equal(r.status, "RISK_SIZED");
  assert.equal(r.side, "short");
  assert.equal(r.quantity, 1);
  assert.equal(r.lossPerUnit, 215);
  assert.equal(r.rewardPerUnit, 585);
  assert.equal(r.modeledRisk, 215);
  assert.equal(r.bindingConstraint, "Per-trade risk");
});
test("CFD: custom $100 per price point per lot and .01 step", () => {
  const r = assessTrade(DEMOS.cfd);
  assert.equal(r.quantity, 0.04);
  approx(r.lossPerUnit, 517);
  approx(r.modeledRisk, 20.68);
});
test("FX: USD-quoted EURUSD example with explicit user-provided lot value", () => {
  const r = assessTrade(DEMOS.fx);
  assert.equal(r.status, "RISK_SIZED");
  assert.equal(r.quantity, 0.11);
  approx(r.modeledRisk, r.quantity * r.lossPerUnit, 1e-7);
});
test("daily monetary headroom binds and reduces size", () => {
  const r = assessTrade(plan({ dailyHeadroom: 22 }));
  assert.equal(r.bindingConstraint, "Daily loss headroom");
  assert.equal(r.quantity, 10);
  assert.ok(r.modeledRisk <= 22);
});
test("total monetary headroom binds independently", () => {
  const r = assessTrade(plan({ totalHeadroom: 5 }));
  assert.equal(r.bindingConstraint, "Total loss headroom");
  assert.equal(r.quantity, 2);
});
test("aggregate risk headroom subtracts existing exposure", () => {
  const r = assessTrade(plan({combinedOpenRiskLimit: 70, existingOpenRisk: 62}));
  assert.equal(r.bindingConstraint, "Aggregate open-risk capacity");
  assert.equal(r.quantity, 3);
});
test("no remaining combined risk capacity is blocked", () => {
  const r = assessTrade(plan({ combinedOpenRiskLimit: 50, existingOpenRisk: 60 }));
  assert.equal(r.status, "BLOCKED");
  assert.equal(r.quantity, 0);
  assert.ok(r.blockedReasons.some(x => x.includes("minimum trade")));
});
test("minimum quantity above risk budget produces blocked result", () => {
  const r = assessTrade(plan({ minQty: 1000 }));
  assert.equal(r.status, "BLOCKED");
});
test("negative net reward after modeled costs blocks", () => {
  const r = assessTrade(plan({ target: 100.01, roundTripFeePerUnit: 2 }));
  assert.equal(r.status, "BLOCKED");
  assert.equal(r.netRR, null);
});
test("optional headrooms are explicitly not evaluated", () => {
  const r = assessTrade(plan({ dailyHeadroom: null, totalHeadroom: null }));
  assert.ok(r.warnings.some(x => x.includes("Daily loss headroom not supplied")));
  assert.ok(r.warnings.some(x => x.includes("Total loss headroom not supplied")));
});
test("long invalid stop or target is rejected", () => {
  assert.throws(() => assessTrade(plan({ stop: 101 })), /Long plan requires/);
  assert.throws(() => assessTrade(plan({ target: 98 })), /Long plan requires/);
});
test("short invalid stop or target is rejected", () => {
  assert.throws(() => assessTrade(plan({ side: "short", stop: 98, target: 106 })), /Short plan requires/);
});
test("tick misalignment rejected, not silently quantized", () => {
  assert.throws(() => assessTrade(plan({ tickSize: 0.25, entry: 100.1 })), /not aligned/);
});
test("non-finite or missing numeric inputs fail closed", () => {
  for (const riskPercent of [NaN, Infinity, 0, -1, 101]) {
    assert.throws(() => assessTrade(plan({ riskPercent })));
  }
  assert.throws(() => assessTrade(plan({ equity: NaN })), PlanError);
  assert.throws(() => assessTrade(plan({ pointValue: 0 })), PlanError);
  assert.throws(() => assessTrade(plan({ existingOpenRisk: -1 })), PlanError);
});
test("unsafe quantity precision and derived overflow fail closed", () => {
  assert.throws(() => assessTrade(plan({ quantityStep: 1e-12 })), /below 1e-8/);
  assert.throws(() => assessTrade(plan({ quantityStep: 1e-8, pointValue: Number.MIN_VALUE, roundTripFeePerUnit: 0 })), PlanError);
  assert.throws(() => assessTrade(plan({ pointValue: Number.MAX_VALUE, slippagePoints: Number.MAX_VALUE })), PlanError);
});
test("zero risk capacity cannot create a trade even with integer step", () => {
  const r = assessTrade(plan({ dailyHeadroom: 0 }));
  assert.equal(r.quantity, 0);
  assert.equal(r.status, "BLOCKED");
});
test("bounded matrix: proposed modeled risk never exceeds supplied caps", () => {
  for (const riskPercent of [0.1, 0.5, 1, 2]) {
    for (const stop of [80, 90, 95, 98, 99]) {
      for (const step of [1, 0.1, 0.01]) {
        const r = assessTrade(plan({ riskPercent, stop, quantityStep: step, minQty: step, dailyHeadroom: 44 }));
        assert.ok(Number.isFinite(r.quantity));
        assert.ok(r.modeledRisk <= r.budget + 1e-8);
        assert.ok(r.modeledRisk <= r.requestedRisk + 1e-8);
      }
    }
  }
});
