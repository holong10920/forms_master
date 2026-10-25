import sqlite3
from pathlib import Path

import pytest

from fb_store.errors import ConditionFailed, ItemTooLarge, TransactionTooLarge
from fb_store.sqlite import (
    MAX_ITEM_BYTES,
    MAX_TX_ACTIONS,
    check_item_size,
    open_database,
    transaction,
)


@pytest.fixture
def conn(tmp_path: Path) -> sqlite3.Connection:
    c = open_database(tmp_path / "t.sqlite3")
    c.execute(
        "CREATE TABLE t (k TEXT PRIMARY KEY, v TEXT, version INTEGER NOT NULL DEFAULT 0) STRICT"
    )
    return c


def _count(conn: sqlite3.Connection) -> int:
    return int(conn.execute("SELECT count(*) FROM t").fetchone()[0])


def test_pragmas(conn: sqlite3.Connection) -> None:
    assert conn.execute("PRAGMA journal_mode").fetchone()[0] == "wal"
    assert conn.execute("PRAGMA foreign_keys").fetchone()[0] == 1
    assert conn.execute("PRAGMA synchronous").fetchone()[0] == 2  # FULL
    assert conn.execute("PRAGMA busy_timeout").fetchone()[0] == 0
    assert conn.execute("PRAGMA trusted_schema").fetchone()[0] == 0


def test_commit_on_success(conn: sqlite3.Connection) -> None:
    with transaction(conn) as tx:
        tx.action("INSERT INTO t (k, v) VALUES (?, ?)", ("a", "1"))
    assert _count(conn) == 1
    assert not conn.in_transaction


def test_rollback_on_exception_leaves_nothing(conn: sqlite3.Connection) -> None:
    with pytest.raises(RuntimeError), transaction(conn) as tx:
        tx.action("INSERT INTO t (k, v) VALUES (?, ?)", ("a", "1"))
        tx.action("INSERT INTO t (k, v) VALUES (?, ?)", ("b", "2"))
        raise RuntimeError("boom")
    assert _count(conn) == 0
    assert not conn.in_transaction


def test_sql_error_mid_transaction_rolls_back(conn: sqlite3.Connection) -> None:
    with pytest.raises(sqlite3.IntegrityError), transaction(conn) as tx:
        tx.action("INSERT INTO t (k, v) VALUES (?, ?)", ("a", "1"))
        tx.action("INSERT INTO t (k, v) VALUES (?, ?)", ("a", "dup"))
    assert _count(conn) == 0


def test_action_limit(conn: sqlite3.Connection) -> None:
    with transaction(conn) as tx:
        for i in range(MAX_TX_ACTIONS):
            tx.action("INSERT INTO t (k, v) VALUES (?, ?)", (f"k{i}", "v"))
    assert _count(conn) == 100
    conn.execute("DELETE FROM t")
    with pytest.raises(TransactionTooLarge), transaction(conn) as tx:
        for i in range(MAX_TX_ACTIONS + 1):
            tx.action("INSERT INTO t (k, v) VALUES (?, ?)", (f"k{i}", "v"))
    assert _count(conn) == 0


def test_byte_limit(conn: sqlite3.Connection) -> None:
    with pytest.raises(TransactionTooLarge), transaction(conn) as tx:
        tx.action("INSERT INTO t (k, v) VALUES (?, ?)", ("a", "x" * (4 * 1024 * 1024 + 1)))
    assert _count(conn) == 0


def test_query_does_not_count_as_action(conn: sqlite3.Connection) -> None:
    with transaction(conn) as tx:
        for _ in range(MAX_TX_ACTIONS + 5):
            tx.query("SELECT 1")
        tx.action("INSERT INTO t (k, v) VALUES (?, ?)", ("a", "1"))
    assert _count(conn) == 1


def test_require_one_cas_success_and_stale_version(conn: sqlite3.Connection) -> None:
    conn.execute("INSERT INTO t (k, v, version) VALUES ('a', 'old', 1)")
    cas = "UPDATE t SET v = ?, version = version + 1 WHERE k = ? AND version = ?"
    with transaction(conn) as tx:
        tx.require_one(cas, ("new", "a", 1))
    with pytest.raises(ConditionFailed), transaction(conn) as tx:
        tx.action("INSERT INTO t (k, v) VALUES ('b', 'side-effect')")
        tx.require_one(cas, ("stale", "a", 1))
    rows = conn.execute("SELECT k, v, version FROM t ORDER BY k").fetchall()
    assert [tuple(r) for r in rows] == [("a", "new", 2)]


def test_require_one_with_returning(conn: sqlite3.Connection) -> None:
    conn.execute("INSERT INTO t (k, v, version) VALUES ('a', 'old', 1)")
    with transaction(conn) as tx:
        tx.require_one("UPDATE t SET version = version + 1 WHERE k = 'a' RETURNING version")
    assert conn.execute("SELECT version FROM t").fetchone()[0] == 2


def test_check_is_a_counted_condition(conn: sqlite3.Connection) -> None:
    conn.execute("INSERT INTO t (k, v, version) VALUES ('a', 'x', 3)")
    with transaction(conn) as tx:
        tx.check("SELECT 1 FROM t WHERE k = ? AND version = ?", ("a", 3))
        assert tx.actions == 1
    with pytest.raises(ConditionFailed), transaction(conn) as tx:
        tx.action("INSERT INTO t (k, v) VALUES ('b', 'side-effect')")
        tx.check("SELECT 1 FROM t WHERE k = ? AND version = ?", ("a", 2))
    assert _count(conn) == 1


def test_macos_full_fsync(conn: sqlite3.Connection) -> None:
    import sys

    expected = 1 if sys.platform == "darwin" else 0
    assert conn.execute("PRAGMA fullfsync").fetchone()[0] == expected
    assert conn.execute("PRAGMA checkpoint_fullfsync").fetchone()[0] == expected


def test_item_size() -> None:
    assert check_item_size({"v": "x" * 1000}) == 1008
    assert check_item_size({"v": "x" * (MAX_ITEM_BYTES - 8)}) == MAX_ITEM_BYTES
    with pytest.raises(ItemTooLarge):
        check_item_size({"v": "x" * (MAX_ITEM_BYTES - 7)})
