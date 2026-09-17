<div align="center">

# SKYDRAGO DEV

### Quantitative Trading Systems Engineering

**FX Risk · Quant Research · Backtesting Architecture · Market/Data Infrastructure**

Building risk-first software for foreign-exchange research and trading-system development with explicit assumptions, reproducible logic, automated verification, and no manufactured performance claims.

[![FX Risk CLI CI](https://github.com/SKYDRAGO-DEV/skycli/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/SKYDRAGO-DEV/skycli/actions/workflows/ci.yml)
[![Cloud Infra CI](https://github.com/SKYDRAGO-DEV/cloud-infra/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/SKYDRAGO-DEV/cloud-infra/actions/workflows/ci.yml)
[![Rust API CI](https://github.com/SKYDRAGO-DEV/rust-web-api/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/SKYDRAGO-DEV/rust-web-api/actions/workflows/ci.yml)
[![Algorithms CI](https://github.com/SKYDRAGO-DEV/algorithms-datastructures/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/SKYDRAGO-DEV/algorithms-datastructures/actions/workflows/ci.yml)

</div>

---

## Engineering Focus

My public work is centered on the intersection of **FX markets, quantitative research, risk systems, and software engineering**.

The operating standard is:

> **Evidence over claims. Explicit assumptions over hidden assumptions. Reproducible tests over screenshots. Risk controls before execution.**

Primary areas:

- deterministic FX position sizing and pip-value mathematics;
- currency exposure and account-currency valuation;
- pre-trade and drawdown-aware risk controls;
- market-data and quantitative research architecture;
- realistic backtesting/execution assumptions;
- infrastructure for APIs, research services, and data workloads;
- testable automation with clear research/live-execution boundaries.

## Verified Public Portfolio

| Repository | Role | Verified engineering signal |
| --- | --- | --- |
| [`skycli`](https://github.com/SKYDRAGO-DEV/skycli) | **Flagship · FX Risk CLI v0.3.0** | Position sizing, pip-value conversion, directional R:R, native FX exposure, account-currency notional valuation, aggregate/drawdown-aware risk budgeting, floating-point lot-step regression coverage, Node 20/22 CI and production-dependency audit |
| [`cloud-infra`](https://github.com/SKYDRAGO-DEV/cloud-infra) | **Supporting · Infrastructure** | AWS/GCP Terraform, VPC-native GKE ranges, private Cloud SQL service networking, Kubernetes deployment primitives, tracked-secret guardrails, deploy-script validation and Terraform/Kubernetes CI |
| [`rust-web-api`](https://github.com/SKYDRAGO-DEV/rust-web-api) | **Supporting · Backend Systems** | Axum health service, typed models, JWT utilities/tests, validated bind configuration, graceful shutdown, rustfmt + Clippy + compile + test CI |
| [`algorithms-datastructures`](https://github.com/SKYDRAGO-DEV/algorithms-datastructures) | **Reference · CS Foundations** | TypeScript/Python algorithms, cycle-safe graph logic, validated Dijkstra/Union-Find boundaries, negative-aware counting sort, data structures, Jest + Python unit tests |
| [`typescript-fullstack`](https://github.com/SKYDRAGO-DEV/typescript-fullstack) | **Archive · Secondary** | Small Express/TypeScript API retained as engineering history; import-safe application construction, sanitized 5xx responses and executable HTTP route tests |
| [`devops-toolkit`](https://github.com/SKYDRAGO-DEV/devops-toolkit) | **Archive · Superseded** | Earlier AWS/Terraform work retained for history; superseded by `cloud-infra` |

Upstream forks and off-topic hobby projects are intentionally excluded from the flagship portfolio signal.

## Flagship — FX Risk CLI

### [`skycli`](https://github.com/SKYDRAGO-DEV/skycli)

A deterministic TypeScript CLI for transparent FX risk calculations and account-level pre-trade controls.

Current implementation includes:

- standard and JPY-pair pip-size handling;
- explicit quote-currency → account-currency conversion;
- configurable contract size, lot step, and minimum lot;
- risk-safe lot rounding with decimal-boundary regression coverage;
- direction-aware long/short reward-to-risk validation;
- multi-position native-currency exposure aggregation;
- supplied-rate account-currency notional valuation;
- gross absolute and net converted notional reporting;
- drawdown-aware risk budgeting;
- aggregate modeled open-risk limits;
- `allowed`, `reduced`, and `blocked` pre-trade states;
- human-readable and JSON CLI output;
- strict TypeScript verification and automated financial-calculation tests;
- CI on Node.js 20 and 22 plus production-dependency auditing.

### Deliberate boundaries

`skycli` does **not** currently claim live market-data ingestion, broker connectivity, order placement, VaR/CVaR, broker-margin modeling, P&L forecasting, strategy profitability, or live-trading performance.

Converted exposure is a deterministic notional equivalent—not VaR, P&L, margin, or a forecast.

## System Architecture Direction

The portfolio is being developed as separable, testable layers rather than one opaque “trading bot”:

```text
Market Data
    ↓
Validation / Normalization
    ↓
Research / Features
    ↓
Strategy Logic
    ↓
Risk Engine
    ↓
Execution Adapter
    ↓
Monitoring / Analytics

Backtesting + evaluation reproduce the same assumptions
where practical, with explicit spread/slippage/fee models.
```

| Layer | Public status |
| --- | --- |
| **Risk engine / FX calculations** | Substantive implementation in `skycli` |
| **Infrastructure** | Supporting Terraform/Kubernetes implementation in `cloud-infra` |
| **Backend/API foundations** | Supporting Rust/Axum implementation |
| **CS / algorithm foundations** | Tested TypeScript + Python reference work |
| **FX research engine** | Engineering direction; not yet promoted as a flagship implementation |
| **Backtesting engine** | Engineering direction; no performance claims until substantive implementation and validation exist |
| **Market-data pipeline** | Engineering direction |
| **Broker/live execution** | Not publicly implemented or claimed |

## Quant / Trading Engineering Standard

For strategy, research, or backtesting work, the intended evidence standard includes, where applicable:

- data source, instrument coverage, and date range;
- timezone and session definitions;
- missing-data / bad-tick handling;
- spread, commission, slippage, swap, and latency assumptions;
- look-ahead and data-leakage controls;
- parameter-selection methodology;
- in-sample vs out-of-sample separation;
- walk-forward or other robustness validation;
- drawdown, distribution, and risk statistics;
- execution constraints and liquidity assumptions;
- reproducible configuration and tests.

**Backtested or simulated results are not equivalent to live execution evidence.**

## Engineering Principles

```text
Data integrity
    ↓
Explicit assumptions
    ↓
Reproducible research
    ↓
Risk-first architecture
    ↓
Testable logic
    ↓
Realistic execution modelling
    ↓
Transparent evaluation
```

- No manufactured performance metrics.
- No guaranteed-return or “perfect strategy” claims.
- No hidden execution assumptions.
- No synthetic GitHub activity used as engineering evidence.
- Separate signal, valuation, risk, execution, and evaluation concerns.
- Prefer fail-closed behavior for missing risk/security dependencies.
- Treat floating-point, boundary, malformed-input, cycle, and deployment-path edge cases as correctness problems—not cosmetic details.
- Promote repositories to flagship status only after meaningful implementation, tests, documentation, and reproducible verification exist.

## Demonstrated Stack

**Trading / Quant:** FX risk mathematics, exposure modeling, deterministic portfolio-risk policy logic  
**Languages:** TypeScript, Python, Rust  
**Backend:** Node.js, Express, Axum  
**Infrastructure:** Terraform, Kubernetes, AWS/GCP configuration patterns  
**Quality:** GitHub Actions, automated tests, type checking, rustfmt, Clippy, dependency auditing, configuration validation

Technologies such as **MQL4/MQL5, MetaTrader integrations, Pine Script, FIX connectivity, broker APIs, and live trading deployment are not claimed as demonstrated public capabilities until substantive implementation exists.**

## Collaboration

Interested in technically serious work around:

**FX/quant research · market-data engineering · backtesting · risk systems · trading infrastructure · execution architecture · developer tooling**

---

<sub>Research and educational software only. Nothing published here constitutes financial or investment advice. Trading involves substantial risk; historical, backtested, or simulated results do not guarantee future performance.</sub>
