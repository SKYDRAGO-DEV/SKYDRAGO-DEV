# TRADEGATE — Universal Trading Risk Workbench

A reproducible pre-trade risk and evidence planner for different trading methods. Built with HTML/CSS/JavaScript, a separately testable calculation engine, and no runtime dependencies.

**Research MVP v0.1.** Not brokerage software, a trade signal, live risk monitoring, a profit forecast, or an automated compliance engine. Local static application, no account sign-in, order execution, user-data backend or automatic persistence.

## Who can use it?

| Trading approach | Additional self-review |
| --- | --- |
| Price Action / SMC | market structure, objective invalidation, session context and rule-based entry |
| Quant / Systematic | data provenance, OOS and walk-forward evidence, leakage and execution-cost checks |
| Orderflow / DOM / L2 | venue, feed integrity, trade prints versus cancellations, liquidity and futures-to-CFD differences |
| EA / Algorithmic | OOS validation, broker specs, kill-switch/outage protection and demo forward tests |
| Hybrid / Discretionary | setup thesis, context, measurable confirmation and execution discipline |

The **risk math is universal; the evidence checklist differs by trading method**. Users manually self-attest checks; the application does not verify them.

## Run locally

From the GitHub repository root:

~~~bash
python3 -m http.server 8000 --bind 127.0.0.1
~~~

Open http://127.0.0.1:8000/tradegate/ on the same computer. ES modules may be blocked from direct file URLs. GitHub Pages hosting is not automatically enabled by committing files.

The UI contains four **hypothetical** examples—shares, NQ-like futures, gold CFD, and EURUSD FX. No prices, contract values or instrument specifications are supplied from a live feed.

## Test the risk engine

Requires Node 20+; no package installation:

~~~bash
node --check tradegate/engine.mjs
node --check tradegate/app.mjs
node --test tradegate/tests/engine.test.mjs
~~~

GitHub CI: [Node 20/22 test workflow](../.github/workflows/tradegate-ci.yml).

## Risk engine specification

All monetary inputs must be denominated in the **same account currency**.

**Instrument contract value** is user-input: the amount in account currency corresponding to a price change of 1.0 for one quantity unit. It must be independently verified for the actual instrument and broker. There is no hidden pip, lot or exchange-rate assumption.

**Round-trip slippage allowance** is measured in quoted-price points; **round-trip fee per unit** is in account currency. Both are conservative user-provided estimates, not independently observed costs.

~~~text
stopDistance      = abs(entry - stop)
targetDistance    = abs(target - entry)
lossPerUnit       = (stopDistance + slippagePoints) * pointValue + feePerUnit
netRewardPerUnit  = (targetDistance - slippagePoints) * pointValue - feePerUnit
requestedRisk     = equity * riskPercent / 100

aggregateRemaining = max(combinedOpenRiskLimit - existingOpenRisk, 0)
                     (only when this optional cap is configured)

budget            = min(requestedRisk, dailyHeadroom,
                        totalHeadroom, aggregateRemaining)
                    (ignore missing optional caps AND report that omission)
quantity          = floorToBrokerQuantityStep(budget / lossPerUnit)
                    (zero when below broker minimum)
modeledLoss       = quantity * lossPerUnit
netRR             = netRewardPerUnit / lossPerUnit
breakevenWinRate  = lossPerUnit / (lossPerUnit + netRewardPerUnit)
                    (only for positive net reward; hypothetical binary payoff)
~~~

Optional **daily and total headroom** are monetary amounts supplied by the user *after* other obligations the figures are intended to include. The separate **combined open-risk** cap subtracts existing modeled open risk. The app does not derive the rules of a broker or funded firm.

A blocked trade, non-positive net reward, invalid stop direction, unaligned tick, invalid price/size, non-finite calculation or insufficient budget never receives a suggested quantity. The process outcome is **READY TO REVIEW** after self-attestation—not BUY, SELL or permission to trade.

The breakeven win-rate formula is an idealized two-outcome calculation, not an empirical win-rate estimate or a signal.

## Important instrument boundaries

- **Equities:** for a USD-quoted share and USD account, a one-share 1 USD move has 1 USD value. Other currencies require account-currency conversion.
- **Exchange futures:** derive point value from exchange tick value / tick size in the account currency. Confirm exchange and broker specification; [CME mechanics](https://www.cmegroup.com/education/courses/introduction-to-futures/calculating-futures-contract-profit-or-loss).
- **Forex and CFDs:** broker contract size, quote-to-account conversion, lot increment and tick value differ. Gold and NAS100 CFDs are not globally standardized.
- **Orderflow L2:** futures DOM is not a consolidated OTC CFD/FX order book. Visible liquidity alone cannot distinguish executions, cancellations, spoofing or hidden intentions.
- **EA/Bots:** modelled size does not validate all proprietary prop-firm rules, broker margin or algorithm safety.

Stops are not guaranteed execution prices. Gaps, slippage, commissions, execution latency, order rejection and volatility can make actual losses substantially greater than calculated risk.

## Privacy and disclosure

No brokerage credentials, tokens or user-tracking SDKs are required. The app does not store entered amounts automatically. Clicking **Export research plan JSON** initiates a local browser download of the user's inputs, modeled risk and manually checked evidence. Review this file before sharing it.

One external design dependency remains: CSS may fetch fonts from Google Fonts. Remove the font import in style.css for a completely network-isolated style.

## Current limitations

No live data, brokerage execution, market depth, PnL history, strategy backtests, scenario Monte Carlo, broker margin modelling, stop-fill guarantees or prop-firm certifications. Users must independently validate monetary value per price unit, risk headrooms and costs. This is educational software, not investment advice.

## Companion work and references

[SKYDRAGO L2 Research Lab](../research/README.md) · [FX Risk CLI](https://github.com/SKYDRAGO-DEV/skycli) · [CME Futures Education](https://www.cmegroup.com/education/courses/introduction-to-futures/calculating-futures-contract-profit-or-loss) · [Cont, Kukanov, Stoikov — Order Book Events](https://arxiv.org/abs/1011.6402)

Public source availability does not itself establish open-source licensing. Check the repository's legal status before copying or redistributing.
