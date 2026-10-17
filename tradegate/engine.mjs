/**
 * TRADEGATE: deterministic, broker-agnostic, pre-trade risk calculations.
 * No market data, signals, execution, or claim of broker/prop-firm compliance.
 * Inputs and output monetary amounts must share the same account currency.
 */

export class PlanError extends Error {
  constructor(message) { super(message); this.name = "PlanError"; }
}

export const PROFILES = Object.freeze({
  priceAction: {
    name: "Price Action",
    fields: [
      ["structure", "Higher-timeframe structure documented"],
      ["invalidation", "Setup invalidation is objective"],
      ["context", "Session / event context checked"],
      ["entry", "Entry trigger is rule-based"]
    ]
  },
  quant: {
    name: "Quant / Systematic",
    fields: [
      ["source", "Dataset provenance and timezone checked"],
      ["oos", "Out-of-sample / walk-forward evidence reviewed"],
      ["leakage", "Look-ahead and leakage checks completed"],
      ["costs", "Execution costs and sensitivity tested"]
    ]
  },
  orderflow: {
    name: "Orderflow / L2",
    fields: [
      ["feed", "Venue, depth feed and timestamps validated"],
      ["prints", "Trade prints vs resting order changes distinguished"],
      ["liquidity", "Visible liquidity / cancellations considered"],
      ["basis", "Futures-vs-CFD instrument differences acknowledged"]
    ]
  },
  ea: {
    name: "EA / Algo Bot",
    fields: [
      ["backtest", "Out-of-sample test with execution costs completed"],
      ["broker", "Contract spec, spread and margin verified"],
      ["failsafe", "Kill switch, disconnect and duplicate-order safeguards tested"],
      ["forward", "Paper/demo forward-test and monitoring reviewed"]
    ]
  },
  hybrid: {
    name: "Hybrid / Discretionary",
    fields: [
      ["playbook", "Trade thesis and invalidation documented"],
      ["context", "Market / session / event context reviewed"],
      ["confirmation", "Chosen confluence is measurable, not hindsight"],
      ["discipline", "Risk and journal process agreed before execution"]
    ]
  }
});

const finite = (n, label) => {
  if (typeof n !== "number" || !Number.isFinite(n)) {
    throw new PlanError(label + " must be a finite number");
  }
  return n;
};
const positive = (n, label) => {
  finite(n, label);
  if (n <= 0) throw new PlanError(label + " must be greater than zero");
  return n;
};
const nonNegative = (n, label) => {
  finite(n, label);
  if (n < 0) throw new PlanError(label + " cannot be negative");
  return n;
};
const optionalCap = (v, label) => {
  if (v === null || v === undefined || v === "") return null;
  return nonNegative(v, label);
};
const safe = (n, label) => {
  if (!Number.isFinite(n) || n < 0) throw new PlanError(label + " exceeded safe numeric range");
  return n;
};

function validateTickPrice(value, tickSize, name) {
  // Tick precision and price origin are venue-specific; optional alignment
  // check assumes price increments are integer multiples of specified tick.
  const increments = value / tickSize;
  if (!Number.isFinite(increments) || Math.abs(increments) > Number.MAX_SAFE_INTEGER) {
    throw new PlanError(name + " cannot be verified at this tick precision");
  }
  if (Math.abs(increments - Math.round(increments)) > 1e-7) {
    throw new PlanError(name + " is not aligned to the configured tick size");
  }
}

function floorToStep(raw, step) {
  const increments = raw / step;
  if (!Number.isFinite(increments) || increments > Number.MAX_SAFE_INTEGER) {
    throw new PlanError("quantity step exceeds safe floating-point precision");
  }
  const nearest = Math.round(increments);
  const tolerance = 8 * Number.EPSILON * Math.max(1, increments);
  const count = Math.abs(increments - nearest) <= tolerance ? nearest : Math.floor(increments);
  const result = count * step;
  if (!Number.isFinite(result)) throw new PlanError("rounded quantity is not finite");
  return Number(result.toPrecision(14));
}

/**
 * Monetary pointValue: account-currency value of a 1.0 price move per one
 * quantity unit (contract / share / lot). Verify it with venue/broker.
 *
 * headrooms: remaining monetary amounts *after* all other commitments,
 * unless 'openRisk' is explicitly subtracted via maxCombinedOpenRisk.
 */
export function assessTrade(plan) {
  if (!plan || typeof plan !== "object") throw new PlanError("Plan is required");
  const currency = String(plan.currency || "").trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) throw new PlanError("Use a 3-letter account currency");
  const side = plan.side;
  if (side !== "long" && side !== "short") throw new PlanError("Side must be long or short");
  if (!PROFILES[plan.style]) throw new PlanError("Select a recognised trading style");

  const equity = positive(plan.equity, "Equity");
  const riskPercent = positive(plan.riskPercent, "Risk percent");
  if (riskPercent > 100) throw new PlanError("Risk percent cannot exceed 100");
  const entry = positive(plan.entry, "Entry");
  const stop = positive(plan.stop, "Stop");
  const target = positive(plan.target, "Target");
  const pointValue = positive(plan.pointValue, "Monetary point value");
  const step = positive(plan.quantityStep, "Quantity step");
  const minQty = positive(plan.minQty, "Minimum quantity");
  const fee = nonNegative(plan.roundTripFeePerUnit, "Round-trip fee");
  const slippage = nonNegative(plan.slippagePoints, "Round-trip slippage allowance");
  const tickSize = optionalCap(plan.tickSize, "Tick size");
  if (tickSize === 0) throw new PlanError("Tick size must be positive when set");

  if (side === "long" && !(stop < entry && target > entry)) {
    throw new PlanError("Long plan requires stop below entry and target above entry");
  }
  if (side === "short" && !(stop > entry && target < entry)) {
    throw new PlanError("Short plan requires stop above entry and target below entry");
  }
  if (tickSize !== null) {
    validateTickPrice(entry, tickSize, "Entry");
    validateTickPrice(stop, tickSize, "Stop");
    validateTickPrice(target, tickSize, "Target");
  }
  if (step < 1e-8) throw new PlanError("Quantity steps below 1e-8 are not supported");

  const stopDistance = Math.abs(entry - stop);
  const targetDistance = Math.abs(target - entry);
  // Slippage is a user-provided allowance across the round trip.
  const lossPerUnit = safe((stopDistance + slippage) * pointValue + fee, "Risk per quantity unit");
  const rewardPerUnit = (targetDistance - slippage) * pointValue - fee;
  if (!Number.isFinite(rewardPerUnit)) throw new PlanError("Reward per unit is not finite");
  if (lossPerUnit <= 0) throw new PlanError("Risk per unit must be greater than zero");

  const requestedRisk = safe(equity * (riskPercent / 100), "Requested risk");
  const dailyHeadroom = optionalCap(plan.dailyHeadroom, "Daily loss headroom");
  const totalHeadroom = optionalCap(plan.totalHeadroom, "Total loss headroom");
  const combinedOpenRiskLimit = optionalCap(plan.combinedOpenRiskLimit, "Combined open-risk limit");
  const existingOpenRisk = nonNegative(plan.existingOpenRisk, "Existing modeled open risk");
  if (combinedOpenRiskLimit !== null && existingOpenRisk > combinedOpenRiskLimit) {
    // Respect breached limit rather than silently ignoring it.
  }

  const caps = [{ name: "Per-trade risk", amount: requestedRisk }];
  if (dailyHeadroom !== null) caps.push({ name: "Daily loss headroom", amount: dailyHeadroom });
  if (totalHeadroom !== null) caps.push({ name: "Total loss headroom", amount: totalHeadroom });
  if (combinedOpenRiskLimit !== null) {
    caps.push({ name: "Aggregate open-risk capacity", amount: Math.max(combinedOpenRiskLimit - existingOpenRisk, 0) });
  }
  const bindingCap = caps.reduce((a, b) => b.amount < a.amount ? b : a);
  const budget = bindingCap.amount;
  const rawQty = safe(budget / lossPerUnit, "Raw quantity");
  let quantity = floorToStep(rawQty, step);
  if (quantity < minQty) quantity = 0;

  // Fail safely if floating-point rounding could overstate the risk budget.
  for (let i = 0; i < 4 && quantity > 0; i++) {
    if (quantity * lossPerUnit <= budget + Math.max(1, budget) * 1e-12) break;
    quantity = Number(Math.max(0, quantity - step).toPrecision(14));
  }
  const modeledRisk = safe(quantity * lossPerUnit, "Modeled risk");
  if (modeledRisk > budget + Math.max(1, budget) * 1e-12) {
    throw new PlanError("Cannot produce a safe rounded quantity");
  }
  const netReward = quantity * rewardPerUnit;
  if (!Number.isFinite(netReward)) throw new PlanError("Modeled reward is not finite");

  const warnings = [];
  if (dailyHeadroom === null) warnings.push("Daily loss headroom not supplied; no daily-rule compliance checked.");
  if (totalHeadroom === null) warnings.push("Total loss headroom not supplied; no total-rule compliance checked.");
  if (combinedOpenRiskLimit === null) warnings.push("Aggregate open-risk limit not supplied.");
  if (tickSize === null) warnings.push("Tick-size alignment not checked.");
  if (rewardPerUnit <= 0) warnings.push("Estimated reward after costs is non-positive.");
  warnings.push("Stops can slip or gap; modeled risk is not a guaranteed loss ceiling.");
  warnings.push("Verify monetary point value, minimum size, fees and permissions with the actual broker.");

  const blockedReasons = [];
  if (quantity <= 0) blockedReasons.push("Available risk budget cannot accommodate minimum trade size.");
  if (rewardPerUnit <= 0) blockedReasons.push("Reward after modeled costs must be positive.");
  const status = blockedReasons.length ? "BLOCKED" : "RISK_SIZED";
  return {
    status, side, style: plan.style, currency,
    equity, riskPercent, entry, stop, target, pointValue, tickSize,
    stopDistance, targetDistance, feePerUnit: fee, slippagePoints: slippage,
    lossPerUnit, rewardPerUnit,
    requestedRisk, budget, bindingConstraint: bindingCap.name,
    quantity, minQty, quantityStep: step,
    modeledRisk, netReward,
    netRR: rewardPerUnit > 0 ? rewardPerUnit / lossPerUnit : null,
    breakEvenWinRate: rewardPerUnit > 0 ? lossPerUnit / (lossPerUnit + rewardPerUnit) : null,
    caps, warnings, blockedReasons
  };
}

export function evidenceStatus(style, checks) {
  const required = PROFILES[style];
  if (!required) throw new PlanError("Unknown style");
  const checked = required.fields.filter(([key]) => checks && checks[key] === true).length;
  return { completed: checked, total: required.fields.length, allCompleted: checked === required.fields.length };
}

export const DEMOS = Object.freeze({
  equity: {
    symbol: "DEMO-SHARE", currency: "USD", style: "priceAction", side: "long",
    equity: 10000, riskPercent: 1, entry: 100, stop: 98, target: 106,
    pointValue: 1, tickSize: 0.01, quantityStep: 1, minQty: 1,
    roundTripFeePerUnit: 0.02, slippagePoints: 0.02,
    dailyHeadroom: null, totalHeadroom: null, combinedOpenRiskLimit: 300, existingOpenRisk: 50
  },
  futures: {
    symbol: "DEMO-NQ", currency: "USD", style: "orderflow", side: "short",
    equity: 25000, riskPercent: 1, entry: 20000, stop: 20010, target: 19970,
    pointValue: 20, tickSize: 0.25, quantityStep: 1, minQty: 1,
    roundTripFeePerUnit: 5, slippagePoints: 0.5,
    dailyHeadroom: 300, totalHeadroom: 1000, combinedOpenRiskLimit: 500, existingOpenRisk: 0
  },
  cfd: {
    symbol: "DEMO-XAUUSD", currency: "USD", style: "hybrid", side: "long",
    equity: 5000, riskPercent: 0.5, entry: 2500, stop: 2495, target: 2515,
    pointValue: 100, tickSize: 0.01, quantityStep: 0.01, minQty: 0.01,
    roundTripFeePerUnit: 7, slippagePoints: 0.1,
    dailyHeadroom: 100, totalHeadroom: 400, combinedOpenRiskLimit: 80, existingOpenRisk: 10
  },
  fx: {
    symbol: "DEMO-EURUSD", currency: "USD", style: "ea", side: "long",
    equity: 5000, riskPercent: 0.5, entry: 1.1000, stop: 1.0980, target: 1.1050,
    pointValue: 100000, tickSize: 0.0001, quantityStep: 0.01, minQty: 0.01,
    roundTripFeePerUnit: 7, slippagePoints: 0.0001,
    dailyHeadroom: 150, totalHeadroom: 400, combinedOpenRiskLimit: 80, existingOpenRisk: 10
  }
});
