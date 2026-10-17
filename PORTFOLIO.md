# SKYDRAGO DEV — Public Engineering Portfolio

> A source-linked map of what exists, what is experimental, and what is not yet implemented.

This inventory is intentionally conservative. **Source code, tests and CI logs—not promotional descriptions or badges—are the primary evidence.** A public repository is not automatically production-ready, and a fork is not original authorship.

## Maintained focus

| Repository | Portfolio tier | Implemented and verifiable | Important boundaries |
| --- | --- | --- | --- |
| [FX Risk CLI / `skycli`](https://github.com/SKYDRAGO-DEV/skycli) | Flagship: FX risk / CLI | TypeScript command-line risk calculations, FX pip/account conversion, exposure valuation and drawdown-aware policy gates; test and CI configuration | No live prices, broker execution, profitability or VaR claims |
| [VALCIER FRAMEFORGE](https://github.com/SKYDRAGO-DEV/valcier-frameforge) | Prototype: creative workflows | FastAPI + SQLite demo, UI, deterministic storyboard, DAG validation, simulated job state and automated tests | **No AI image/video generation**, no production-grade auth or Internet-safe demo mode |
| [cloud-infra](https://github.com/SKYDRAGO-DEV/cloud-infra) | Supporting: IaC | Terraform for AWS/GCP, Kubernetes deployment references and static CI checks | No verified cloud production rollout, Azure, Pulumi or CDK |
| [rust-web-api](https://github.com/SKYDRAGO-DEV/rust-web-api) | Supporting: backend | Axum health API, JWT utilities and tests, graceful shutdown, Rust CI | Not a production-ready authenticated API service |
| [algorithms-datastructures](https://github.com/SKYDRAGO-DEV/algorithms-datastructures) | Supporting: foundations | TypeScript/Python graph, sorting and data-structure implementations with tests | No claim of Go/Rust implementations or comprehensive coverage |

## Historical / learning projects

| Repository | Status |
| --- | --- |
| [typescript-fullstack](https://github.com/SKYDRAGO-DEV/typescript-fullstack) | Legacy Express/TypeScript API prototype; no React frontend or production database |
| [devops-toolkit](https://github.com/SKYDRAGO-DEV/devops-toolkit) | Superseded Terraform/CI experiment; `cloud-infra` is the preferred current reference |
| [snake-game](https://github.com/SKYDRAGO-DEV/snake-game) | Browser game experiment; not part of the engineering flagship portfolio |
| [SKYDRAGO-DEV](https://github.com/SKYDRAGO-DEV/SKYDRAGO-DEV) | This profile and portfolio documentation repository |

These are *portfolio classifications*, not claims that GitHub repository Archive settings have been enabled.

## Upstream forks — not original SKYDRAGO DEV products

- [deno](https://github.com/SKYDRAGO-DEV/deno) — upstream [denoland/deno](https://github.com/denoland/deno)
- [grafana](https://github.com/SKYDRAGO-DEV/grafana) — upstream [grafana/grafana](https://github.com/grafana/grafana)
- [knex](https://github.com/SKYDRAGO-DEV/knex) — upstream [knex/knex](https://github.com/knex/knex)
- [next.js](https://github.com/SKYDRAGO-DEV/next.js) — upstream [vercel/next.js](https://github.com/vercel/next.js)
- [pulumi](https://github.com/SKYDRAGO-DEV/pulumi) — upstream [pulumi/pulumi](https://github.com/pulumi/pulumi)
- [tokio](https://github.com/SKYDRAGO-DEV/tokio) — upstream [tokio-rs/tokio](https://github.com/tokio-rs/tokio)

Forking is useful for learning and contribution, but a fork alone is not evidence of original engineering or upstream maintainer status.

## Quality and safety contract

For each maintained project, the preferred evidence is:

1. **Executable quick start** with version/environment prerequisites.
2. **Clearly defined scope** with no unimplemented features described as shipped.
3. **Repeatable tests and CI**, with failures and unsupported cases visible.
4. **Security boundaries** and an appropriate confidential reporting path.
5. **Dependency and workflow hygiene**, including least-privilege CI and update review.
6. **Explicit licence status** before advertising third-party reuse rights.
7. **No synthetic stars, achievements, uptime, release results or trading performance.**

Do not infer that all controls are currently satisfied merely because they appear in this contract. Each repository must be audited independently.

## Engineering direction

The principal long-term focus is robust **FX/quantitative research and risk-aware trading-system architecture**, with supporting backend, infrastructure and tooling expertise. Future roadmap topics—live brokerage adapters, strategy research, risk aggregation, media-generation integrations and cloud deployment—are not represented as completed until implemented, tested and documented.

> Financial/trading software is research and education only. Simulated or backtested outcomes are not live-execution evidence and do not imply guaranteed returns.

Last portfolio inventory: 17 October 2026. Repository functionality and security settings may change; inspect the linked source and Actions for current evidence.
