#!/usr/bin/env python3
"""Read-only GitHub portfolio integrity check; Python standard library only.

Never handles repository secrets or modifies GitHub settings. Checks the public
repository inventory, original-vs-fork attribution, and expected maintenance files.
Misleading public descriptions are warnings until the owner can edit metadata.
"""
from __future__ import annotations

import json
import os
import sys
from urllib.error import HTTPError
from urllib.parse import quote
from urllib.request import Request, urlopen

OWNER = "SKYDRAGO-DEV"
EXPECTED_FORKS = {
    "algorithms-datastructures": False,
    "cloud-infra": False,
    "deno": True,
    "devops-toolkit": False,
    "grafana": True,
    "knex": True,
    "next.js": True,
    "pulumi": True,
    "rust-web-api": False,
    "skycli": False,
    "SKYDRAGO-DEV": False,
    "snake-game": False,
    "tokio": True,
    "typescript-fullstack": False,
    "valcier-frameforge": False,
}
MAINTAINED = {
    "skycli": True,
    "valcier-frameforge": True,
    "algorithms-datastructures": True,
    "rust-web-api": False,
    "cloud-infra": False,
}
COMMON_FILES = (
    "README.md",
    "SECURITY.md",
    "CONTRIBUTING.md",
    ".github/dependabot.yml",
    ".github/workflows/ci.yml",
)


def request_json(path: str):
    """Fetch public GitHub REST API JSON without logging credentials."""
    token = os.environ.get("GH_AUDIT_TOKEN", "").strip()
    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "skydrago-portfolio-integrity",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = Request("https://api.github.com" + path, headers=headers)
    with urlopen(req, timeout=20) as response:
        return json.load(response)


def list_public_repos():
    repos = []
    for page in range(1, 101):
        batch = request_json(f"/users/{OWNER}/repos?per_page=100&page={page}")
        if not isinstance(batch, list):
            raise ValueError("Unexpected repository response")
        repos.extend(batch)
        if len(batch) < 100:
            return repos
    raise RuntimeError("Repository pagination exceeded safety cap")


def file_exists(name: str, path: str) -> bool:
    uri = (
        f"/repos/{OWNER}/{quote(name, safe='')}/contents/"
        + quote(path, safe="/")
    )
    try:
        request_json(uri)
    except HTTPError as exc:
        if exc.code == 404:
            return False
        raise
    return True


def metadata_warnings(name: str, description: str) -> list[str]:
    """Detect known mismatches; never pretend this is semantic code analysis."""
    value = (description or "").lower()
    notices = []
    if name == "skycli" and ("fx" not in value or "risk" not in value):
        notices.append("skycli About description does not identify its FX risk purpose")
    if name == "cloud-infra" and ("azure" in value or "pulumi" in value):
        notices.append("cloud-infra description advertises absent Azure/Pulumi scope")
    if name == "rust-web-api" and "production-ready" in value:
        notices.append("rust-web-api description claims production readiness")
    if name == "typescript-fullstack" and (
        "react" in value or "postgresql" in value or "redis" in value
    ):
        notices.append("typescript-fullstack describes an unimplemented frontend/database")
    if name == "devops-toolkit" and ("gcp" in value or "kubernetes" in value):
        notices.append("devops-toolkit description overstates legacy repository scope")
    if name == "valcier-frameforge" and not value.strip():
        notices.append("valcier-frameforge lacks a repository About description")
    if name == "SKYDRAGO-DEV" and "senior software engineer" in value:
        notices.append("profile metadata title should be backed by independent evidence")
    return notices


def evaluate(repos: list[dict], exists) -> tuple[list[str], list[str]]:
    """Pure audit core: errors block CI; metadata warnings are actionable."""
    problems: list[str] = []
    warnings: list[str] = []
    by_name = {r["name"]: r for r in repos}
    for name, expected_fork in EXPECTED_FORKS.items():
        row = by_name.get(name)
        if row is None:
            problems.append(f"Expected public repository missing: {name}")
            continue
        if bool(row.get("fork")) != expected_fork:
            problems.append(f"Fork attribution changed: {name}")
        warnings.extend(metadata_warnings(name, row.get("description") or ""))
    for name, has_codeql in MAINTAINED.items():
        if name not in by_name:
            continue
        required = list(COMMON_FILES)
        if has_codeql:
            required.append(".github/workflows/codeql.yml")
        for path in required:
            if not exists(name, path):
                problems.append(f"{name}: missing {path}")
    return problems, warnings


def main() -> int:
    repos = list_public_repos()
    problems, warnings = evaluate(repos, file_exists)
    forks = sum(bool(r.get("fork")) for r in repos)
    summary = [
        "# SKYDRAGO DEV — Portfolio integrity",
        "",
        f"Public repos: **{len(repos)}**; original: **{len(repos) - forks}**; forks: **{forks}**.",
        "",
        "## Blocking integrity checks",
        *([f"- ❌ {item}" for item in problems] if problems else ["- ✅ Required portfolio files and fork attribution verified."]),
        "",
        "## Non-blocking metadata follow-ups",
        *([f"- ⚠️ {item}" for item in warnings] if warnings else ["- ✅ No known description mismatches detected."]),
        "",
        "This read-only audit does not verify code correctness, security settings, licenses, deployment, achievements or professional seniority.",
    ]
    output = "\n".join(summary) + "\n"
    print(output)
    dest = os.environ.get("GITHUB_STEP_SUMMARY")
    if dest:
        with open(dest, "a", encoding="utf-8") as handle:
            handle.write(output)
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
