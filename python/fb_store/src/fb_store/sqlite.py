"""SQLite primitives for the local domain store (spec #5 sections 3, 5.2, 11).

Provides connection settings, ``BEGIN IMMEDIATE`` transactions, conditional writes, and mapping
of lock contention to ``Conflict``. The DynamoDB limits (100 actions and 4 MB per transaction,
400 KB per item) are enforced for work submitted through ``Tx.action``/``require_one``/``check``
and ``check_item_size``: repositories must route every write and condition check through them
(``Tx.query`` is for reads only; SQL literals and multi-row statements are not measured).
SQLite locks the whole database, not single items, so tests on this adapter do not show
DynamoDB's per-item conflict or throughput behaviour (spec #5 section 11.2).
"""

import random
import sqlite3
import sys
import time
from collections.abc import Callable, Iterator, Mapping, Sequence
from contextlib import contextmanager
from pathlib import Path

from fb_contracts.jcs import canonical_json
from fb_store.errors import ConditionFailed, Conflict, ItemTooLarge, TransactionTooLarge

MAX_TX_ACTIONS = 100
MAX_TX_BYTES = 4 * 1024 * 1024
MAX_ITEM_BYTES = 400 * 1024

_CONTENTION = {sqlite3.SQLITE_BUSY, sqlite3.SQLITE_LOCKED}


def _is_contention(error: sqlite3.OperationalError) -> bool:
    return (getattr(error, "sqlite_errorcode", 0) & 0xFF) in _CONTENTION


def _execute(conn: sqlite3.Connection, sql: str, params: Sequence[object] = ()) -> sqlite3.Cursor:
    try:
        return conn.execute(sql, params)
    except sqlite3.OperationalError as e:
        if _is_contention(e):
            raise Conflict(str(e)) from e
        raise


def open_database(path: Path) -> sqlite3.Connection:
    """Opens a connection with explicit transaction control and fail-fast locking."""
    conn = sqlite3.connect(path, autocommit=True, check_same_thread=True)
    conn.row_factory = sqlite3.Row
    for pragma in (
        "PRAGMA journal_mode = WAL",
        "PRAGMA synchronous = FULL",
        "PRAGMA foreign_keys = ON",
        "PRAGMA busy_timeout = 0",
        "PRAGMA trusted_schema = OFF",
    ):
        _execute(conn, pragma)
    if sys.platform == "darwin":  # plain fsync is not a stable-storage barrier on macOS
        _execute(conn, "PRAGMA fullfsync = ON")
        _execute(conn, "PRAGMA checkpoint_fullfsync = ON")
    return conn


def _param_bytes(params: Sequence[object]) -> int:
    total = 0
    for p in params:
        if isinstance(p, str):
            total += len(p.encode("utf-8"))
        elif isinstance(p, bytes | bytearray | memoryview):
            total += len(p)
    return total


class Tx:
    """An open ``BEGIN IMMEDIATE`` transaction. Writes and condition checks are actions."""

    def __init__(self, conn: sqlite3.Connection) -> None:
        self._conn = conn
        self.actions = 0
        self.bytes = 0

    def action(self, sql: str, params: Sequence[object] = ()) -> sqlite3.Cursor:
        self.actions += 1
        self.bytes += _param_bytes(params)
        if self.actions > MAX_TX_ACTIONS:
            raise TransactionTooLarge(f"more than {MAX_TX_ACTIONS} actions")
        if self.bytes > MAX_TX_BYTES:
            raise TransactionTooLarge(f"more than {MAX_TX_BYTES} bytes")
        return _execute(self._conn, sql, params)

    def require_one(self, sql: str, params: Sequence[object] = ()) -> None:
        """Conditional write (CAS): raises ``ConditionFailed`` unless exactly one row changed.
        For INSERT/UPDATE/DELETE, with or without RETURNING."""
        cursor = self.action(sql, params)
        changed = len(cursor.fetchall()) if cursor.description is not None else cursor.rowcount
        if changed != 1:
            raise ConditionFailed(f"condition matched {changed} rows")

    def check(self, sql: str, params: Sequence[object] = ()) -> None:
        """Condition check (DynamoDB ConditionCheck): a SELECT that must return exactly one row.
        Counts as an action."""
        rows = self.action(sql, params).fetchall()
        if len(rows) != 1:
            raise ConditionFailed(f"condition check returned {len(rows)} rows")

    def query(self, sql: str, params: Sequence[object] = ()) -> list[sqlite3.Row]:
        """Read only; not counted. Writes must use ``action``/``require_one``."""
        return list(_execute(self._conn, sql, params).fetchall())


@contextmanager
def transaction(conn: sqlite3.Connection) -> Iterator[Tx]:
    """``BEGIN IMMEDIATE`` ... ``COMMIT``; any exception rolls back and is re-raised."""
    _execute(conn, "BEGIN IMMEDIATE")
    try:
        yield Tx(conn)
        _execute(conn, "COMMIT")
    except BaseException:
        if conn.in_transaction:
            conn.execute("ROLLBACK")
        raise


def check_item_size(item: Mapping[str, object]) -> int:
    """Size of an item as the byte length of its canonical JSON. This approximates DynamoDB's
    attribute-name-plus-value size; it is not an exact or always-larger bound (deeply nested
    empty lists/maps can count more in DynamoDB). Raises ``ItemTooLarge`` above 400 KB."""
    size = len(canonical_json(dict(item)))
    if size > MAX_ITEM_BYTES:
        raise ItemTooLarge(f"item is {size} bytes (limit {MAX_ITEM_BYTES})")
    return size


def with_conflict_retry[T](
    fn: Callable[[], T],
    *,
    attempts: int = 5,
    base_delay_s: float = 0.01,
    max_delay_s: float = 0.2,
    rng: random.Random | None = None,
    sleep: Callable[[float], None] = time.sleep,
) -> T:
    """Retries ``fn`` on ``Conflict`` only, with full-jitter exponential backoff; re-raises the
    last ``Conflict`` after ``attempts`` calls."""
    if attempts < 1 or base_delay_s < 0 or max_delay_s < 0:
        raise ValueError("attempts must be >= 1 and delays >= 0")
    rand = rng or random.Random()  # noqa: S311 - jitter, not security
    for attempt in range(attempts):
        try:
            return fn()
        except Conflict:
            if attempt == attempts - 1:
                raise
            sleep(rand.uniform(0, min(max_delay_s, base_delay_s * 2**attempt)))
    raise AssertionError("unreachable")
