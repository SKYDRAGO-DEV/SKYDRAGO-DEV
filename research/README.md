# MARKET MICROSTRUCTURE / L2 RESEARCH NOTES

> **SKYDRAGO DEV · Reproducible Quant Research**  
> **Status:** educational prototype with a deterministic, synthetic fixture. **No live ATAS/Rithmic/MT5 integration, prediction, backtest, order execution or performance claim.**

A minimal, inspectable Python reference for how *displayed* limit-order-book states become descriptive research features. The code operates on **price-level snapshots (L2)**, does not identify individual orders and is deliberately independent of broker credentials and vendor APIs.

## Instrument panel — what's measured

| Feature | Definition | What it can / cannot establish |
| --- | --- | --- |
| Mid-price | $m=(b+a)/2$ | Quote midpoint; not a tradeable fill |
| Spread (bps) | $10^4(a-b)/m$ | Displayed best-quote friction; not realized execution cost |
| Best-queue imbalance | $(Q_b-Q_a)/(Q_b+Q_a)$ | Relative displayed liquidity; not true buyer/seller intent |
| Multi-level L2 imbalance | $(\sum_{i=1}^{k}B_i-\sum_{i=1}^{k}A_i)/(\sum_{i=1}^{k}B_i+\sum_{i=1}^{k}A_i)$ | Aggregated book-depth asymmetry over top `k` levels; not a causal forecast |
| Microprice | $(aQ_b+bQ_a)/(Q_b+Q_a)$ | Opposite-queue-weighted best quote; *estimator*, not an executable price |
| Best-quote OFI increment | Quote-event accounting based on best bid/ask price and size updates | Approximation from consecutive snapshots; not signed trade delta or an independent trade feed |

Notation: $b,a$ are best bid/ask prices; $Q_b,Q_a$ are resting displayed sizes at those prices; $B_i,A_i$ are quantities at the *i*th price level on each side.

### Best-quote OFI (Cont–Kukanov–Stoikov convention)

For successive snapshots $(b_{t-1},Q^b_{t-1},a_{t-1},Q^a_{t-1})$ and $(b_t,Q^b_t,a_t,Q^a_t)$:

$$

e_t = \mathbf{1}_{b_t\ge b_{t-1}}Q_t^b-\mathbf{1}_{b_t\le b_{t-1}}Q_{t-1}^b
-\mathbf{1}_{a_t\le a_{t-1}}Q_t^a+\mathbf{1}_{a_t\ge a_{t-1}}Q_{t-1}^a

$$

When best quotes don't move: $\mathrm{OFI}_t = \Delta Q^b_t-\Delta Q^a_t$. When quotes improve or worsen, the piecewise event formula accounts for the complete displayed best-level size at the changing price. Aggregated OFI over an event window is the **sum of event increments**, not the final queue imbalance.

**Tiny reproducible calculation:** best bid stays at 100.0 with displayed quantity **10 → 15**, best ask stays at 100.5 with quantity **12 → 8**. The displayed best-quote OFI increment is $+5 - (-4)=+9$ units. The mid-price is **unchanged**, illustrating why positive OFI alone is **not** a trading signal.

A study by Cont, Kukanov and Stoikov reported that short-interval price impact related to best-quote order-flow imbalance and available market depth in their dataset. Those results are *not* validated on the synthetic examples here, and no performance or market-transfer inference is made.

## Run the lab locally

No dependencies outside the Python 3.11+ standard library.

```bash
python3 -m research.l2_reference research/examples/synthetic_books.json --levels 3
python3 -m unittest discover -s research/tests -p 'test_*.py' -v
```

The output is a JSON object with a record per timestamp and explanatory feature names. The first observation has `ofi_increment: null` because there is no previous snapshot; all timestamps must be strictly increasing. The included [fixture](examples/synthetic_books.json) is explicitly **synthetic** and contains no market feed.

[Read the implementation](l2_reference.py) · [Inspect unit tests](tests/test_l2_reference.py) · [CI workflow](../.github/workflows/l2-research.yml)

## Research architecture — premium ideas, real constraints

| Subsystem | Research idea | Minimum validation necessary |
| --- | --- | --- |
| **Liquidity Pressure** | Track queue imbalance, microprice displacement and normalized OFI | Calibrate by spread, instrument, depth and volatility regime; test stability out of sample |
| **Queue Dynamics** | Separate cancellations/additions from trades with synchronized quotes and prints | Full event sequencing and feed-gap detection; L2 alone cannot attribute changes |
| **Absorption Hypothesis** | Evaluate repeated aggressive trades against resilient displayed depth | Aligned trade prints + L2; replay review, latency and venue constraints; no definitive iceberg claim without order-level evidence |
| **Execution Friction** | Estimate spread, fees, slippage, adverse selection, market impact and latency | Conservative marketable-fill models, partial fills and tail-cost sensitivity |
| **Research Integrity** | Walk-forward validation, purged/embargoed splits when labels overlap, multiple-testing controls | Frozen hypotheses, holdout tests, confidence intervals and clear negative results |
| **Regime Analysis** | Depth resilience, volatility clustering, session transitions, conditional feature behavior | Robustness across sessions, event days and new periods; no universal directional guarantee |

### L2 is not L3, and futures DOM is not a CFD order book

- **L1/top of book:** best displayed bid/ask and sizes.
- **L2/aggregated depth:** displayed quantities at multiple price levels. It may show order-book pressure or visible replenishment, **not necessarily** order IDs, queue ownership or hidden liquidity.
- **L3/MBO:** per-order messages, when supplied and decoded under exchange/feed rules. It permits richer queue-lifecycle reconstruction but still does not reveal all hidden intent.
- **Trades/prints:** separately timestamped executions needed for aggressive-volume delta, absorption testing and more precise flow attribution. A snapshot-only OFI is **not executed volume delta**.
- **Feed integrity:** real analysis needs instrument-specific tick rules, sequence numbers, snapshot/resync, stale-update handling, clock offsets, venue definitions, gap flags, contract-roll adjustments and latency timestamps. This reference intentionally contains none of these feed systems.
- **Cross-market caution:** CME GC/NQ futures orderflow from ATAS/Rithmic is a *different venue/instrument* from XAUUSD or NAS100 CFDs on MT5. OTC FX/CFDs lack a single consolidated global central-limit-order book. Futures liquidity may be explored as a contextual proxy but cannot be relabelled as the CFD broker's true depth, or used to guarantee direction.

## Test an edge, not a story

An empirical strategy study must pre-register a horizon and labels, compare the microprice/OFI model to simple baselines, consider selection and feed survivorship bias, measure out-of-sample calibration, account for transaction costs, and report failures. A snapshot study on three manufactured examples cannot establish profitable execution.

**Research taxonomy**

```text
VENUE EVENT DATA
   → sequence/gap validation
   → book reconstruction + trade alignment
   → event-time features (OFI / microprice / depth)
   → timestamp-safe labels and baselines
   → walk-forward evaluation + cost model
   → out-of-sample diagnostics
   → (only if justified) paper execution review
```

## Sources and further reading

- Rama Cont, Arseniy Kukanov, Sasha Stoikov, *The Price Impact of Order Book Events*, **Journal of Financial Econometrics**, 12(1), 2014. [SSRN abstract](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=1712822).
- Sasha Stoikov, [author's overview of the 2014 price-impact research](https://www.sashastoikov.com/finance/2015/3/12/the-price-impact-of-order-book-events).
- GitHub Docs, [Profile READMEs](https://docs.github.com/en/account-and-profile/how-tos/profile-customization/managing-your-profile-readme).

**Licensing:** The repo's public visibility is not itself permission to reuse source; verify the current legal status before copying or redistributing. This material is research/education, not investment advice.
