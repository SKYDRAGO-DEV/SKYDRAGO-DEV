"""Transparent, dependency-free L2 order-book feature research.

Educational snapshot calculations only: not a feed handler, predictive model,
execution strategy, spoofing detector, or order-level (MBO/L3) reconstruction.

Run: python3 -m research.l2_reference research/examples/synthetic_books.json
"""
from __future__ import annotations

import argparse
from dataclasses import dataclass
import json
import math
from pathlib import Path
from typing import Any, Mapping


def _positive(value: Any, label: str) -> float:
    if isinstance(value, bool) or not isinstance(value, (float, int)):
        raise ValueError(f"{label} must be a real number")
    number = float(value)
    if not math.isfinite(number) or number <= 0:
        raise ValueError(f"{label} must be finite and positive")
    return number


@dataclass(frozen=True)
class Level:
    price: float
    size: float

    def __post_init__(self) -> None:
        _positive(self.price, "price")
        _positive(self.size, "size")

    @classmethod
    def from_dict(cls, data: Mapping[str, Any]) -> "Level":
        if not isinstance(data, dict):
            raise ValueError("each book level must be a JSON object")
        return cls(
            price=_positive(data.get("price"), "price"),
            size=_positive(data.get("size"), "size"),
        )


@dataclass(frozen=True)
class Book:
    timestamp_ms: int
    bids: tuple[Level, ...]
    asks: tuple[Level, ...]

    def __post_init__(self) -> None:
        if isinstance(self.timestamp_ms, bool) or not isinstance(self.timestamp_ms, int) or self.timestamp_ms < 0:
            raise ValueError("timestamp_ms must be a non-negative integer")
        if not self.bids or not self.asks:
            raise ValueError("both book sides require at least one level")
        if any(self.bids[i].price <= self.bids[i + 1].price for i in range(len(self.bids) - 1)):
            raise ValueError("bids must be strictly descending without duplicate prices")
        if any(self.asks[i].price >= self.asks[i + 1].price for i in range(len(self.asks) - 1)):
            raise ValueError("asks must be strictly ascending without duplicate prices")
        if self.bids[0].price >= self.asks[0].price:
            raise ValueError("locked/crossed books are outside this reference model")

    @classmethod
    def from_dict(cls, data: Mapping[str, Any]) -> "Book":
        if not isinstance(data, dict):
            raise ValueError("each snapshot must be a JSON object")
        bids, asks = data.get("bids"), data.get("asks")
        if not isinstance(bids, list) or not isinstance(asks, list):
            raise ValueError("bids and asks must be lists")
        return cls(
            timestamp_ms=data.get("timestamp_ms"),
            bids=tuple(Level.from_dict(level) for level in bids),
            asks=tuple(Level.from_dict(level) for level in asks),
        )


def _bounded(number: float, label: str) -> float:
    if not math.isfinite(number):
        raise ValueError(f"{label} exceeds finite floating-point range")
    return number


def midprice(book: Book) -> float:
    bid, ask = book.bids[0].price, book.asks[0].price
    return _bounded(bid + (ask - bid) / 2, "midprice")


def microprice(book: Book) -> float:
    """Queue-weighted opposite-price estimator at the best bid/ask only."""
    bid, ask = book.bids[0], book.asks[0]
    max_size = max(bid.size, ask.size)
    b, a = bid.size / max_size, ask.size / max_size
    return _bounded(bid.price + (ask.price - bid.price) * b / (b + a), "microprice")


def queue_imbalance(book: Book) -> float:
    bid_size, ask_size = book.bids[0].size, book.asks[0].size
    m = max(bid_size, ask_size)
    return (bid_size / m - ask_size / m) / (bid_size / m + ask_size / m)


def depth_imbalance(book: Book, levels: int = 5) -> float:
    """L2 sum-size imbalance over up to k price levels on each side."""
    if isinstance(levels, bool) or not isinstance(levels, int) or levels < 1:
        raise ValueError("levels must be a positive integer")
    bids, asks = book.bids[:levels], book.asks[:levels]
    scale = max([level.size for level in bids + asks])
    bid_depth = _bounded(math.fsum(level.size / scale for level in bids), "bid depth")
    ask_depth = _bounded(math.fsum(level.size / scale for level in asks), "ask depth")
    return (bid_depth - ask_depth) / (bid_depth + ask_depth)


def event_ofi(previous: Book, current: Book) -> float:
    """Best-quote OFI event increment, Cont–Kukanov–Stoikov convention.

    Captures changes in *displayed* best-quote supply and demand;
    cannot distinguish trades from cancellations without event/trade data.
    """
    if current.timestamp_ms <= previous.timestamp_ms:
        raise ValueError("book timestamps must be strictly increasing")
    old_bid, new_bid = previous.bids[0], current.bids[0]
    old_ask, new_ask = previous.asks[0], current.asks[0]
    if new_bid.price > old_bid.price:
        bid_term = new_bid.size
    elif new_bid.price < old_bid.price:
        bid_term = -old_bid.size
    else:
        bid_term = new_bid.size - old_bid.size
    if new_ask.price < old_ask.price:
        ask_term = -new_ask.size
    elif new_ask.price > old_ask.price:
        ask_term = old_ask.size
    else:
        ask_term = old_ask.size - new_ask.size
    return _bounded(bid_term + ask_term, "order flow imbalance")


def features(books: list[Book], levels: int = 5) -> list[dict[str, float | int | None]]:
    """One record per timestamp, no interpolation or forward-looking windows."""
    result: list[dict[str, float | int | None]] = []
    previous = None
    for book in books:
        if previous is not None and book.timestamp_ms <= previous.timestamp_ms:
            raise ValueError("unsorted, duplicate or stale timestamps")
        ofi = event_ofi(previous, book) if previous is not None else None
        denominator = (previous.bids[0].size + previous.asks[0].size) / 2 if previous is not None else None
        normalized = ofi / denominator if ofi is not None and denominator is not None else None
        row = {
            "timestamp_ms": book.timestamp_ms,
            "bid": book.bids[0].price,
            "ask": book.asks[0].price,
            "midprice": midprice(book),
            "microprice": microprice(book),
            "spread_bps": _bounded(
                (book.asks[0].price - book.bids[0].price) / midprice(book) * 10000,
                "spread in basis points",
            ),
            "queue_imbalance": queue_imbalance(book),
            "depth_imbalance": depth_imbalance(book, levels),
            "ofi_increment": ofi,
            "ofi_per_previous_mean_best_depth": _bounded(normalized, "normalized OFI") if normalized is not None else None,
        }
        result.append(row)
        previous = book
    return result


def main() -> None:
    parser = argparse.ArgumentParser(description="Synthetic/research L2 book features, not trading signals")
    parser.add_argument("path", type=Path, help="JSON array of time-ordered book snapshots")
    parser.add_argument("--levels", type=int, default=5, help="L2 depth levels to aggregate (default 5)")
    args = parser.parse_args()
    raw = json.loads(args.path.read_text(encoding="utf-8"))
    if not isinstance(raw, list) or not raw:
        parser.error("input must be a non-empty JSON snapshot array")
    books = [Book.from_dict(item) for item in raw]
    print(json.dumps({"dataset": "user-supplied / illustrative unless independently verified",
                      "features": features(books, args.levels)}, indent=2, allow_nan=False))


if __name__ == "__main__":
    main()
