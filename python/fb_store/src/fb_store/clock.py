"""Injectable clock; all datetimes are timezone-aware UTC."""

from datetime import UTC, datetime, timedelta
from typing import Protocol


def _require_aware(value: datetime) -> None:
    if value.tzinfo is None or value.utcoffset() is None:
        raise ValueError("naive datetime; use timezone-aware UTC")


class Clock(Protocol):
    def now(self) -> datetime: ...


class SystemClock:
    def now(self) -> datetime:
        return datetime.now(UTC)


class FakeClock:
    """Deterministic clock for tests (lease expiry, TTL; spec #5 CT-10, CT-21)."""

    def __init__(self, start: datetime) -> None:
        _require_aware(start)
        self._now = start

    def now(self) -> datetime:
        return self._now

    def advance(self, delta: timedelta) -> None:
        if delta < timedelta(0):
            raise ValueError("clock cannot go backwards")
        self._now += delta


def is_expired(expires_at: datetime, now: datetime) -> bool:
    """Logical expiration (spec #5 section 5.2): an item is gone once ``expires_at <= now``,
    whether or not it has been physically deleted."""
    _require_aware(expires_at)
    _require_aware(now)
    return expires_at <= now
