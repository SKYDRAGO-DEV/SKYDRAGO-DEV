<div align="center">

# SKYDRAGO DEV

### FX Markets × Quantitative Research × Trading Systems Engineering

Building deterministic risk, market-data, backtesting, and research tooling with explicit assumptions, reproducible logic, and no manufactured performance claims.

</div>

---

## Focus

My engineering direction is centered on the intersection of **foreign-exchange markets** and **software systems**:

- FX / Forex market research
- Quantitative analysis and statistical testing
- Backtesting methodology and execution assumptions
- Position sizing and risk-management tooling
- Market-data ingestion, validation, and analytics
- Trading automation and execution engineering
- Session, volatility, spread, and exposure analysis

The standard is simple: **research should be reproducible, assumptions should be explicit, and public claims should be supported by working code.**

## Featured FX System

### [`FX Risk CLI`](https://github.com/SKYDRAGO-DEV/skycli)

A tested TypeScript command-line utility for deterministic Forex risk calculations.

Current implementation includes:

- Risk-based position sizing
- Standard and JPY-pair pip-size handling
- Pip-value conversion into account currency
- Explicit quote-currency → account-currency conversion requirements
- Configurable contract size, lot step, and minimum lot
- Risk-safe lot rounding
- Direction-aware long/short reward-to-risk validation
- Human-readable and JSON output
- Strict TypeScript checks and automated tests
- CI verification on Node.js 20 and 22

The tool intentionally does **not** connect to brokers, fetch live prices, place trades, or claim profitability. Its purpose is transparent and testable pre-trade risk calculation.

## Engineering Foundation

Public work currently demonstrates experience across:

- **Python** — algorithms, data-oriented tooling, research-oriented development
- **Rust** — API and systems-oriented development
- **TypeScript / Node.js** — CLI and application tooling
- **PostgreSQL / SQL** — application data infrastructure
- **Terraform** — infrastructure as code
- **Docker / Kubernetes** — containerized deployment and orchestration
- **GitHub Actions** — CI and engineering automation

I intentionally separate technologies demonstrated publicly from technologies or trading systems that are still being developed.

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
- Separation of signal, risk, and execution logic
- Spread, slippage, fees, timezone, and data-quality effects treated explicitly where relevant
- Out-of-sample and walk-forward validation preferred over in-sample storytelling

## Portfolio Architecture

The Forex/Quant portfolio is being developed around substantive systems rather than placeholder repositories:

| Area | Engineering objective |
| --- | --- |
| **Risk** | Pip value, position sizing, exposure, drawdown and portfolio-risk controls |
| **FX Research** | Market statistics, volatility, correlation, session and spread analytics |
| **Backtesting** | Strategy interfaces, execution assumptions, trade accounting and validation |
| **Market Data** | Ingestion, validation, normalization, storage and feature generation |
| **Execution** | Broker/API abstractions, order handling, monitoring and execution analytics |
| **Trading Automation** | Testable workflows with clear separation between research and live execution |

Repositories are promoted here only when they contain meaningful implementation, tests, documentation, and reproducible examples.

## Supporting Engineering Work

A small number of non-trading repositories remain public because they document software-engineering foundations relevant to quantitative and trading systems:

- [`cloud-infra`](https://github.com/SKYDRAGO-DEV/cloud-infra) — infrastructure-as-code and container orchestration work
- [`algorithms-datastructures`](https://github.com/SKYDRAGO-DEV/algorithms-datastructures) — algorithm and data-structure implementations

Other legacy repositories are treated as secondary, archival, or refactoring candidates rather than flagship work.

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
