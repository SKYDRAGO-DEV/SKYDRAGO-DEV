import { assessTrade, evidenceStatus, PROFILES, DEMOS } from "./engine.mjs";

const form = document.querySelector("#tradeForm");
const evidenceList = document.querySelector("#evidenceList");
const exportButton = document.querySelector("#exportBtn");
const evidenceProgress = document.querySelector("#evidenceProgress");
const methodLabel = document.querySelector("#methodLabel");
const processStatus = document.querySelector("#processStatus");
const processNote = document.querySelector("#processNote");
const riskStatus = document.querySelector("#riskStatus");
const resultNote = document.querySelector("#resultNote");
const notices = document.querySelector("#notices");

const money = (amount, currency) => currency + " " + new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(amount);
const decimal = (amount, places = 4) => new Intl.NumberFormat("en-US", { maximumFractionDigits: places }).format(amount);

let lastPlan = null;
let lastCalculation = null;
let checksByStyle = Object.create(null);

function input(name) {
  const element = form.elements.namedItem(name);
  if (!element || !("value" in element)) throw new Error("Missing field: " + name);
  return element;
}
function number(name, optional = false) {
  const value = input(name).value.trim();
  return optional && value === "" ? null : value === "" ? NaN : Number(value);
}
function readPlan() {
  return {
    symbol: input("symbol").value.trim().toUpperCase() || "UNSPECIFIED",
    style: input("style").value,
    side: input("side").value,
    currency: input("currency").value.trim().toUpperCase(),
    equity: number("equity"), riskPercent: number("riskPercent"),
    entry: number("entry"), stop: number("stop"), target: number("target"),
    pointValue: number("pointValue"), tickSize: number("tickSize", true),
    quantityStep: number("quantityStep"), minQty: number("minQty"),
    roundTripFeePerUnit: number("roundTripFeePerUnit"),
    slippagePoints: number("slippagePoints"),
    dailyHeadroom: number("dailyHeadroom", true),
    totalHeadroom: number("totalHeadroom", true),
    combinedOpenRiskLimit: number("combinedOpenRiskLimit", true),
    existingOpenRisk: number("existingOpenRisk")
  };
}
function setText(id, value) {
  document.getElementById(id).textContent = value;
}
function addNotice(message, kind = "warn") {
  const node = document.createElement("p");
  node.className = "notice" + (kind === "error" ? " error" : "");
  node.textContent = message;
  notices.append(node);
}
function currentChecks() {
  const style = input("style").value;
  return checksByStyle[style] || (checksByStyle[style] = Object.create(null));
}
function updateProcess() {
  const status = evidenceStatus(input("style").value, currentChecks());
  evidenceProgress.textContent = status.completed + " / " + status.total;
  if (!lastCalculation) {
    processStatus.textContent = "NOT EVALUATED";
    processStatus.className = "";
    processNote.textContent = "Calculate risk first, then complete the evidence checklist. This is not permission to trade.";
    exportButton.disabled = true;
    return;
  }
  exportButton.disabled = false; // Blocked plans can still be journaled.
  if (lastCalculation.status === "BLOCKED") {
    processStatus.textContent = "BLOCKED";
    processStatus.className = "blocked";
    processNote.textContent = "Risk constraints or modeled costs block this plan. Export for review, not execution.";
  } else if (!status.allCompleted) {
    processStatus.textContent = "REVIEW EVIDENCE";
    processStatus.className = "";
    processNote.textContent = "Risk was modeled, but methodology checks remain self-unconfirmed.";
  } else {
    processStatus.textContent = "READY TO REVIEW";
    processStatus.className = "complete";
    processNote.textContent = "Risk model and self-attested checklist are complete. NOT a trade signal or order authorization.";
  }
}
function renderChecks() {
  const style = input("style").value;
  methodLabel.textContent = PROFILES[style].name.toUpperCase();
  evidenceList.replaceChildren();
  const active = currentChecks();
  for (const [key, label] of PROFILES[style].fields) {
    const row = document.createElement("label");
    row.className = "check-row";
    const box = document.createElement("input");
    box.type = "checkbox";
    box.checked = active[key] === true;
    box.addEventListener("change", () => {
      active[key] = box.checked;
      updateProcess();
    });
    const text = document.createElement("span");
    text.textContent = label;
    row.append(box, text);
    evidenceList.append(row);
  }
  updateProcess();
}
function showFailure(error) {
  lastCalculation = null;
  lastPlan = null;
  riskStatus.textContent = "INVALID PLAN";
  riskStatus.className = "result-status blocked";
  resultNote.textContent = error instanceof Error ? error.message : "Plan validation failed";
  for (const id of ["sizeValue", "budgetValue", "lossValue", "rrValue", "winValue", "bindingValue"]) setText(id, "—");
  notices.replaceChildren();
  addNotice("Fail-closed: no quantity is produced for missing or invalid inputs.", "error");
  updateProcess();
}
function evaluate(event) {
  if (event) event.preventDefault();
  notices.replaceChildren();
  try {
    const plan = readPlan();
    const result = assessTrade(plan);
    lastPlan = plan;
    lastCalculation = result;
    riskStatus.textContent = result.status === "BLOCKED" ? "RISK BLOCKED" : "RISK MODELED";
    riskStatus.className = "result-status " + (result.status === "BLOCKED" ? "blocked" : "good");
    resultNote.textContent = result.status === "BLOCKED"
      ? result.blockedReasons.join(" ")
      : "A maximum modeled quantity—not a recommendation. Confirm real market costs.";
    setText("sizeValue", decimal(result.quantity, 8));
    setText("budgetValue", money(result.budget, result.currency));
    setText("lossValue", money(result.modeledRisk, result.currency));
    setText("rrValue", result.netRR === null ? "N/A" : "1 : " + decimal(result.netRR, 2));
    setText("winValue", result.breakEvenWinRate === null ? "N/A" : decimal(result.breakEvenWinRate * 100, 1) + "%");
    setText("bindingValue", result.bindingConstraint);
    for (const message of result.blockedReasons) addNotice(message, "error");
    for (const message of result.warnings) addNotice(message);
    updateProcess();
  } catch (error) {
    showFailure(error);
  }
}
function loadDemo(key) {
  const demo = DEMOS[key];
  if (!demo) return;
  for (const [name, value] of Object.entries(demo)) {
    if (form.elements.namedItem(name)) input(name).value = value === null ? "" : String(value);
  }
  checksByStyle = Object.create(null);
  document.querySelectorAll("[data-demo]").forEach(button => {
    button.classList.toggle("active", button.dataset.demo === key);
  });
  renderChecks();
  evaluate();
}
function exportReport() {
  if (!lastPlan || !lastCalculation) return;
  const style = lastPlan.style;
  const status = evidenceStatus(style, currentChecks());
  const report = {
    schema: "tradegate.research-plan.v1",
    generatedAt: new Date().toISOString(),
    educationalOnly: true,
    privacy: "Locally generated export; inspect before sharing.",
    contractAssumptionsVerifiedByApp: false,
    source: "SKYDRAGO DEV / TRADEGATE",
    plan: lastPlan,
    riskModel: lastCalculation,
    process: {
      label: processStatus.textContent,
      traderSelfAttested: true,
      method: PROFILES[style].name,
      evidence: PROFILES[style].fields.map(([key, text]) => ({
        key, text, confirmed: currentChecks()[key] === true
      })),
      checked: status.completed,
      total: status.total
    },
    limitations: [
      "No real-time quotes, automatic contract specification or broker connection",
      "No margin, liquidation, actual stop-fill or prop-firm compliance engine",
      "No verified edge, profit prediction, order execution or investment advice",
      "User-provided monetary contract value and costs; actual loss may be higher"
    ]
  };
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "tradegate-" + style + "-" + new Date().toISOString().slice(0, 10) + ".json";
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 5000);
}
form.addEventListener("submit", evaluate);
form.addEventListener("input", () => {
  lastPlan = null;
  lastCalculation = null;
  riskStatus.textContent = "RECALCULATE";
  riskStatus.className = "result-status";
  resultNote.textContent = "Inputs changed. Evaluate again before using any prior quantity.";
  for (const id of ["sizeValue", "budgetValue", "lossValue", "rrValue", "winValue", "bindingValue"]) setText(id, "—");
  notices.replaceChildren();
  updateProcess();
});
input("style").addEventListener("change", renderChecks);
document.querySelectorAll("[data-demo]").forEach(button =>
  button.addEventListener("click", () => loadDemo(button.dataset.demo)));
document.getElementById("clearBtn").addEventListener("click", () => loadDemo("equity"));
exportButton.addEventListener("click", exportReport);
renderChecks();
loadDemo("equity");
