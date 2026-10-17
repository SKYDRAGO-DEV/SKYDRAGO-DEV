"""Offline tests for the profile-inventory health gate."""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from portfolio_health import EXPECTED_FORKS, MAINTAINED, evaluate, metadata_warnings


def inventory():
    return [
        {"name": name, "fork": fork, "description": ""}
        for name, fork in EXPECTED_FORKS.items()
    ]


class PortfolioAuditTests(unittest.TestCase):
    def test_expected_baseline_passes(self):
        problems, warnings = evaluate(inventory(), lambda _repo, _path: True)
        self.assertEqual(problems, [])
        self.assertTrue(isinstance(warnings, list))

    def test_missing_mandatory_file_blocks(self):
        problems, _ = evaluate(
            inventory(),
            lambda repo, path: not (
                repo == "skycli" and path == ".github/workflows/ci.yml"
            ),
        )
        self.assertIn("skycli: missing .github/workflows/ci.yml", problems)

    def test_changed_fork_attribution_blocks(self):
        rows = inventory()
        next(row for row in rows if row["name"] == "deno")["fork"] = False
        problems, _ = evaluate(rows, lambda _repo, _path: True)
        self.assertIn("Fork attribution changed: deno", problems)

    def test_missing_repo_blocks(self):
        problems, _ = evaluate(
            [r for r in inventory() if r["name"] != "cloud-infra"],
            lambda _repo, _path: True,
        )
        self.assertIn("Expected public repository missing: cloud-infra", problems)

    def test_claim_detection(self):
        warnings = metadata_warnings(
            "rust-web-api", "Blazing fast production-ready REST API"
        )
        self.assertEqual(
            warnings, ["rust-web-api description claims production readiness"]
        )

    def test_codeql_is_required_only_on_implemented_language_repos(self):
        visited = []
        evaluate(inventory(), lambda repo, path: visited.append((repo, path)) or True)
        for repo, flag in MAINTAINED.items():
            self.assertEqual((".github/workflows/codeql.yml" in [p for n, p in visited if n == repo]), flag)


if __name__ == "__main__":
    unittest.main()
