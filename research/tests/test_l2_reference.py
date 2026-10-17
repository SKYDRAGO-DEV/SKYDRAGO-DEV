"""Offline L2 / market microstructure correctness and input validation tests."""
import json
import math
from pathlib import Path
import unittest

from research.l2_reference import (
    Book, Level, depth_imbalance, event_ofi, features, microprice, midprice,
    queue_imbalance,
)

FIXTURE = Path(__file__).resolve().parents[1] / "examples" / "synthetic_books.json"


def books():
    return [Book.from_dict(row) for row in json.loads(FIXTURE.read_text(encoding="utf-8"))]


class MicrostructureTests(unittest.TestCase):
    def test_mid_and_opposite_queue_weighted_microprice(self):
        first = books()[0]
        self.assertEqual(midprice(first), 100.25)
        self.assertAlmostEqual(microprice(first), (100.5 * 10 + 100 * 12) / 22)
        self.assertLess(microprice(first), midprice(first))

    def test_best_queue_imbalance_is_bounded(self):
        first = books()[0]
        self.assertAlmostEqual(queue_imbalance(first), -2 / 22)
        self.assertGreaterEqual(queue_imbalance(first), -1)
        self.assertLessEqual(queue_imbalance(first), 1)

    def test_multilevel_depth_is_separate_from_top_of_book(self):
        first = books()[0]
        self.assertAlmostEqual(depth_imbalance(first, levels=3), 2 / 94)
        self.assertAlmostEqual(depth_imbalance(first, levels=1), -2 / 22)
        self.assertNotAlmostEqual(depth_imbalance(first, levels=1), depth_imbalance(first, levels=3))

    def test_ofi_same_quotes_tracks_displayed_queue_changes(self):
        first, second, _ = books()
        self.assertEqual(event_ofi(first, second), 9.0)

    def test_ofi_when_bid_rises_and_ask_rises(self):
        _, second, third = books()
        self.assertEqual(event_ofi(second, third), 19.0)

    def test_features_have_no_first_observation_ofi(self):
        records = features(books())
        self.assertEqual(len(records), 3)
        self.assertIsNone(records[0]["ofi_increment"])
        self.assertEqual(records[1]["ofi_increment"], 9)
        self.assertAlmostEqual(records[1]["ofi_per_previous_mean_best_depth"], 9 / 11)
        self.assertTrue(all(math.isfinite(v) for rec in records for v in rec.values() if isinstance(v, float)))

    def test_cannot_process_duplicate_or_reversed_timestamps(self):
        original = books()[0]
        duplicate = Book(timestamp_ms=0, bids=original.bids, asks=original.asks)
        with self.assertRaisesRegex(ValueError, "strictly increasing"):
            event_ofi(original, duplicate)
        with self.assertRaisesRegex(ValueError, "stale"):
            features([original, duplicate])

    def test_invalid_levels_or_book_depth(self):
        with self.assertRaisesRegex(ValueError, "positive integer"):
            depth_imbalance(books()[0], 0)
        with self.assertRaisesRegex(ValueError, "positive integer"):
            depth_imbalance(books()[0], True)
        with self.assertRaisesRegex(ValueError, "descending"):
            Book(1, (Level(99, 5), Level(100, 2)), (Level(101, 4),))
        with self.assertRaisesRegex(ValueError, "ascending"):
            Book(1, (Level(100, 2),), (Level(101, 4), Level(100.5, 5)))
        with self.assertRaisesRegex(ValueError, "locked/crossed"):
            Book(1, (Level(101, 2),), (Level(101, 4),))

    def test_non_finite_zero_and_boolean_sizes_rejected(self):
        for bad in (float("nan"), float("inf"), 0, -1, True):
            with self.subTest(bad=bad), self.assertRaises(ValueError):
                Level(100, bad)

    def test_malformed_snapshots_rejected(self):
        for bad in ({}, [], {"timestamp_ms": 1, "bids": 3, "asks": []}):
            with self.subTest(bad=bad), self.assertRaises(ValueError):
                Book.from_dict(bad)

    def test_price_up_does_not_imply_proven_alpha(self):
        # Validate descriptive accounting, not forecasts or benchmark PnL.
        obs = features(books())
        self.assertGreater(obs[1]["ofi_increment"], 0)
        self.assertEqual(obs[0]["midprice"], obs[1]["midprice"])

    def test_requires_strictly_increasing_stamps(self):
        first, second, _ = books()
        with self.assertRaises(ValueError):
            features([second, first])


if __name__ == "__main__":
    unittest.main()
