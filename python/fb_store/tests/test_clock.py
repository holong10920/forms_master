from datetime import UTC, datetime, timedelta

import pytest

from fb_store.clock import FakeClock, SystemClock, is_expired

T0 = datetime(2026, 10, 25, 12, 0, tzinfo=UTC)


def test_fake_clock_advances() -> None:
    clock = FakeClock(T0)
    assert clock.now() == T0
    clock.advance(timedelta(seconds=90))
    assert clock.now() == T0 + timedelta(seconds=90)


def test_fake_clock_rejects_naive_and_backwards() -> None:
    with pytest.raises(ValueError):
        FakeClock(datetime(2026, 10, 25))  # naive on purpose
    with pytest.raises(ValueError):
        FakeClock(T0).advance(timedelta(seconds=-1))


def test_system_clock_is_aware_utc() -> None:
    assert SystemClock().now().utcoffset() == timedelta(0)


def test_logical_expiration_boundary() -> None:
    assert is_expired(T0, T0) is True
    assert is_expired(T0 + timedelta(microseconds=1), T0) is False
    assert is_expired(T0 - timedelta(seconds=1), T0) is True
    with pytest.raises(ValueError):
        is_expired(datetime(2026, 10, 25), T0)  # naive on purpose
