<div align="center">

# SKYDRAGO DEV

### FX Markets × Quantitative Research × Trading Systems Engineering

Building deterministic risk, market-data, backtesting, and research tooling with explicit assumptions, reproducible logic, and no manufactured performance claims.

</div>

---

## What I Build

My engineering direction is centered on the intersection of **foreign-exchange markets** and **software systems**:

- FX / Forex market research tooling
- Position sizing and risk-management systems
- Backtesting methodology and execution assumptions
- Market-data ingestion, validation, and analytics
- Session, volatility, spread, and exposure analysis
- Trading automation and execution engineering
- Quantitative/statistical research workflows

The operating standard is simple: **public claims should be supported by working code, assumptions should be explicit, and research should be reproducible.**

## Public Portfolio Snapshot

| Repository | Status | What it demonstrates |
| --- | --- | --- |
| [`skycli`](https://github.com/SKYDRAGO-DEV/skycli) | **Flagship — FX Risk CLI v0.3.0** | Position sizing, pip-value conversion, directional R:R, native FX exposure, explicit account-currency notional valuation, drawdown-aware risk budgeting, automated tests and CI |
| [`cloud-infra`](https://github.com/SKYDRAGO-DEV/cloud-infra) | **Supporting** | Terraform infrastructure, Kubernetes manifests, infrastructure validation, secret/state hygiene and CI discipline |
| [`rust-web-api`](https://github.com/SKYDRAGO-DEV/rust-web-api) | **Supporting** | Runnable Axum API foundation, typed Rust modules, JWT utilities, tests and strict CI |
| [`algorithms-datastructures`](https://github.com/SKYDRAGO-DEV/algorithms-datastructures) | **Reference** | TypeScript/Python algorithm implementations with real tests and validation |
| [`typescript-fullstack`](https://github.com/SKYDRAGO-DEV/typescript-fullstack) | **Legacy / secondary** | Small TypeScript/Express API experiment retained without simulated authentication claims |
| [`devops-toolkit`](https://github.com/SKYDRAGO-DEV/devops-toolkit) | **Legacy / superseded** | Historical AWS Terraform work superseded by `cloud-infra` |

Off-topic hobby projects and upstream forks are not treated as flagship work.

## Featured FX System

### [`FX Risk CLI`](https://github.com/SKYDRAGO-DEV/skycli)

A tested TypeScript command-line system for transparent Forex risk calculations and deterministic account-level risk controls.

Current implementation includes:

- Risk-based position sizing
- Standard and JPY-pair pip-size handling
- Pip-value conversion into account currency
- Explicit quote-currency → account-currency conversion requirements
- Configurable contract size, lot step, and minimum lot
- Risk-safe lot rounding
- Direction-aware long/short reward-to-risk validation
- Multi-position native-currency exposure aggregation
- Explicit account-currency exposure valuation from supplied conversion factors
- Gross absolute and net converted notional reporting
- Drawdown-aware risk-budget calculation
- Aggregate modeled open-risk limits
- `allowed`, `reduced`, and `blocked` pre-trade risk states
- Human-readable and JSON output
- Strict TypeScript checks and automated financial-calculation tests
- CI verification on Node.js 20 and 22
- Production-dependency auditing
- Security, contribution, and changelog documentation

The tool intentionally does **not** connect to brokers, fetch live prices, place trades, calculate VaR/CVaR, estimate P&L, model broker margin, or claim profitability. Converted exposure is explicitly treated as a notional equivalent, and the risk-budget layer is a deterministic policy gate rather than a probabilistic portfolio-risk model.

## Quant / Trading Engineering Principles

```text
Data integrity
    ↓
Explicit assumptions
    ↓
Reproducible research
    ↓
Risk-first architecture
    ↓
Testable strategy logic
    ↓
Realistic execution modelling
    ↓
Transparent evaluation
```

Core principles:

- No manufactured performance metrics
- No guaranteed-return claims
- No hidden execution assumptions
- No synthetic GitHub activity
- Separation of signal, risk, valuation, and execution logic
- Native exposure separated from account-currency valuation
- Notional valuation separated from VaR/P&L/margin claims
- Spread, slippage, fees, timezone, and data-quality effects treated explicitly where relevant
- Out-of-sample and walk-forward validation preferred over in-sample storytelling

## Demonstrated Engineering Stack

Public repositories currently support claims around:

- **TypeScript / Node.js** — FX risk CLI and API tooling
- **Python** — algorithms and data-oriented utilities
- **Rust / Axum** — typed API and systems-oriented development
- **Terraform** — infrastructure as code
- **Kubernetes** — deployment/orchestration manifests
- **GitHub Actions** — CI, testing, formatting and validation automation

Technologies such as **MQL4/MQL5, MetaTrader integrations, Pine Script, broker APIs, FIX connectivity, live execution, and production trading deployment are not claimed here until substantive public implementation exists.**

## Portfolio Architecture

The Forex/Quant portfolio is being developed around substantive systems rather than placeholder repositories:

| Area | Engineering objective |
| --- | --- |
| **Risk** | Pip value, position sizing, currency exposure, account valuation, drawdown and aggregate open-risk controls |
| **FX Research** | Market statistics, volatility, correlation, session and spread analytics |
| **Backtesting** | Strategy interfaces, execution assumptions, trade accounting and validation |
| **Market Data** | Ingestion, validation, normalization, storage and feature generation |
| **Execution** | Broker/API abstractions, order handling, monitoring and execution analytics |
| **Trading Automation** | Testable workflows with clear separation between research and live execution |

Repositories are promoted to flagship status only when they contain meaningful implementation, tests, documentation, and reproducible examples.

## Research Standard

For quantitative or strategy-oriented work, published results should document, where applicable:

- data source and date range
- timezone and session definitions
- missing-data and bad-tick handling
- spread, commission, slippage, swap, and latency assumptions
- look-ahead / leakage controls
- parameter-selection process
- out-of-sample or walk-forward evaluation
- drawdown and risk statistics

**Backtested or simulated results are not equivalent to live-trading performance.**

## Collaboration

Interested in technically serious work around **FX research, quantitative tooling, market data, backtesting, risk systems, and trading infrastructure**.

---

<sub>Research and educational work only. Nothing published here constitutes financial or investment advice. Trading involves substantial risk, and historical or simulated results do not guarantee future performance.</sub>
