import random
import sqlite3
import threading
import time
from pathlib import Path

import pytest

from fb_store.errors import Conflict
from fb_store.sqlite import open_database, transaction, with_conflict_retry


def test_second_writer_gets_conflict_immediately(tmp_path: Path) -> None:
    path = tmp_path / "t.sqlite3"
    a = open_database(path)
    a.execute("CREATE TABLE t (k TEXT PRIMARY KEY) STRICT")
    b = open_database(path)
    a.execute("BEGIN IMMEDIATE")
    started = time.monotonic()
    with pytest.raises(Conflict), transaction(b):
        pass
    assert time.monotonic() - started < 1.0
    a.execute("ROLLBACK")
    with transaction(b) as tx:  # lock released: the next writer proceeds
        tx.action("INSERT INTO t VALUES ('x')")
    assert not b.in_transaction


def test_reader_is_not_blocked_by_writer(tmp_path: Path) -> None:
    path = tmp_path / "t.sqlite3"
    a = open_database(path)
    a.execute("CREATE TABLE t (k TEXT PRIMARY KEY) STRICT")
    a.execute("INSERT INTO t VALUES ('committed')")
    b = open_database(path)
    a.execute("BEGIN IMMEDIATE")
    a.execute("INSERT INTO t VALUES ('uncommitted')")
    assert [r[0] for r in b.execute("SELECT k FROM t")] == ["committed"]
    a.execute("ROLLBACK")


def test_retry_then_success() -> None:
    calls = 0
    delays: list[float] = []

    def flaky() -> str:
        nonlocal calls
        calls += 1
        if calls <= 2:
            raise Conflict("busy")
        return "ok"

    result = with_conflict_retry(flaky, rng=random.Random(0), sleep=delays.append)
    assert result == "ok"
    assert calls == 3
    assert len(delays) == 2
    assert all(0 <= d <= min(0.2, 0.01 * 2**i) for i, d in enumerate(delays))


def test_retry_is_bounded() -> None:
    calls = 0

    def always() -> None:
        nonlocal calls
        calls += 1
        raise Conflict("busy")

    with pytest.raises(Conflict):
        with_conflict_retry(always, rng=random.Random(0), sleep=lambda _d: None)
    assert calls == 5


@pytest.mark.parametrize("kwargs", [{"attempts": 0}, {"base_delay_s": -1.0}, {"max_delay_s": -1.0}])
def test_retry_arguments_are_validated(kwargs: dict[str, float]) -> None:
    with pytest.raises(ValueError):
        with_conflict_retry(lambda: None, **kwargs)  # type: ignore[arg-type]


def test_non_conflict_errors_are_not_retried() -> None:
    calls = 0

    def broken() -> None:
        nonlocal calls
        calls += 1
        raise ValueError("bug")

    with pytest.raises(ValueError):
        with_conflict_retry(broken, sleep=lambda _d: None)
    assert calls == 1


def test_concurrent_cas_increments_lose_no_update(tmp_path: Path) -> None:
    path = tmp_path / "t.sqlite3"
    setup = open_database(path)
    setup.execute("CREATE TABLE counter (k TEXT PRIMARY KEY, n INTEGER NOT NULL) STRICT")
    setup.execute("INSERT INTO counter VALUES ('c', 0)")
    workers, per_worker = 8, 25
    barrier = threading.Barrier(workers, timeout=10)
    errors: list[BaseException] = []
    conflicts = 0
    lock = threading.Lock()

    def work() -> None:
        nonlocal conflicts
        try:
            conn = open_database(path)
            try:
                barrier.wait()
                for _ in range(per_worker):

                    def increment(conn: sqlite3.Connection = conn) -> None:
                        nonlocal conflicts
                        try:
                            with transaction(conn) as tx:
                                n = tx.query("SELECT n FROM counter WHERE k = 'c'")[0][0]
                                tx.require_one(
                                    "UPDATE counter SET n = ? WHERE k = 'c' AND n = ?", (n + 1, n)
                                )
                        except Conflict:
                            with lock:
                                conflicts += 1
                            raise

                    with_conflict_retry(
                        increment, attempts=200, base_delay_s=0.001, max_delay_s=0.01
                    )

            finally:
                conn.close()
        except BaseException as e:
            with lock:
                errors.append(e)

    threads = [threading.Thread(target=work) for _ in range(workers)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    assert not errors, errors
    assert setup.execute("SELECT n FROM counter").fetchone()[0] == workers * per_worker
    assert conflicts > 0, "test did not exercise contention"
