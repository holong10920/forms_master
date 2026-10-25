"""Ordered, checksummed SQL migrations; each file applies atomically with its bookkeeping row.

Transaction control (BEGIN, COMMIT, ROLLBACK, SAVEPOINT, ...), ATTACH/DETACH and unsafe PRAGMA
are denied by the SQLite authorizer while a migration file runs, so a file can neither end
the runner's
transaction early (wherever the statement appears: mid-line, after a comment) nor write another
database or change connection settings. Trigger bodies (BEGIN ... END) are not transaction
control and are allowed.
"""

import hashlib
import re
import sqlite3
from pathlib import Path

from fb_store.clock import Clock, SystemClock
from fb_store.errors import MigrationError
from fb_store.sqlite import transaction

_FILE = re.compile(r"(\d{4})_[a-z0-9_]+\.sql")

_BOOKKEEPING = """CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  sha256 TEXT NOT NULL,
  applied_at TEXT NOT NULL
) STRICT"""

_DENIED_ACTIONS = {
    sqlite3.SQLITE_TRANSACTION,
    sqlite3.SQLITE_SAVEPOINT,
    sqlite3.SQLITE_ATTACH,
    sqlite3.SQLITE_DETACH,
}


# Only inherently read-only PRAGMAs: arguments can select a table/index or check limit,
# so arg2 being non-NULL is not evidence of a settings write. Settings PRAGMAs are
# denied even in query form. Unknown names fail closed. SQLite internally invokes
# quick_check while ALTER TABLE validates existing rows in STRICT tables.
_READ_ONLY_PRAGMAS = frozenset(
    {
        "quick_check",
        "integrity_check",
        "foreign_key_check",
        "foreign_key_list",
        "table_info",
        "table_xinfo",
        "table_list",
        "index_info",
        "index_xinfo",
        "index_list",
        "database_list",
    }
)


def _deny_unsafe_actions(action: int, arg1: str | None, *_args: object) -> int:
    if action == sqlite3.SQLITE_PRAGMA:
        return (
            sqlite3.SQLITE_OK
            if arg1 is not None and arg1.lower() in _READ_ONLY_PRAGMAS
            else sqlite3.SQLITE_DENY
        )
    return sqlite3.SQLITE_DENY if action in _DENIED_ACTIONS else sqlite3.SQLITE_OK


def _load(migrations_dir: Path) -> list[tuple[str, str, str]]:
    found: dict[str, tuple[str, str, str]] = {}
    for path in sorted(migrations_dir.iterdir()):
        if path.suffix.lower() != ".sql":
            continue
        if not path.is_file():
            raise MigrationError(f"migration is not a regular file: {path.name}")
        match = _FILE.fullmatch(path.name)
        if match is None:
            raise MigrationError(f"migration file name must be NNNN_name.sql: {path.name}")
        version = match.group(1)
        if version in found:
            raise MigrationError(f"duplicate migration version {version}")
        raw = path.read_bytes()  # checksum over exact bytes (CRLF edits are changes)
        try:
            sql = raw.decode("utf-8")
        except UnicodeDecodeError as e:
            raise MigrationError(f"{path.name} is not UTF-8") from e
        found[version] = (version, hashlib.sha256(raw).hexdigest(), sql)
    return [found[v] for v in sorted(found)]


def _applied(conn: sqlite3.Connection) -> dict[str, str]:
    return {r[0]: r[1] for r in conn.execute("SELECT version, sha256 FROM schema_migrations")}


def _check_history(migrations: list[tuple[str, str, str]], applied: dict[str, str]) -> None:
    on_disk = {version: digest for version, digest, _sql in migrations}
    for version, digest in applied.items():
        if version not in on_disk:
            raise MigrationError(f"applied migration {version} is missing on disk")
        if on_disk[version] != digest:
            raise MigrationError(f"applied migration {version} was modified")
    newest = max(applied, default="")
    for version in on_disk:
        if version not in applied and version < newest:
            raise MigrationError(f"migration {version} is older than applied {newest}")


def apply_migrations(
    conn: sqlite3.Connection, migrations_dir: Path, clock: Clock | None = None
) -> list[str]:
    """Applies pending migrations in version order and returns the versions this call applied.

    Requires a connection from ``fb_store.sqlite.open_database`` (``autocommit=True``). Each file
    runs in its own ``BEGIN IMMEDIATE`` transaction that re-reads the applied set under the write
    lock, so concurrent runners apply each file once; lock contention raises ``Conflict``.
    """
    if conn.autocommit is not True or conn.in_transaction:
        raise MigrationError("connection must be autocommit=True with no open transaction")
    clock = clock or SystemClock()
    migrations = _load(migrations_dir)
    with transaction(conn) as tx:
        tx.action(_BOOKKEEPING)
    _check_history(migrations, _applied(conn))
    done = []
    for version, digest, sql in migrations:
        with transaction(conn):
            applied = _applied(conn)
            _check_history(migrations, applied)
            if version in applied:
                continue
            conn.set_authorizer(_deny_unsafe_actions)
            try:
                conn.executescript(sql)
            except sqlite3.Error as e:
                raise MigrationError(f"migration {version} failed: {e}") from e
            finally:
                conn.set_authorizer(None)
            try:
                conn.execute(
                    "INSERT INTO schema_migrations (version, sha256, applied_at) VALUES (?, ?, ?)",
                    (version, digest, clock.now().strftime("%Y-%m-%dT%H:%M:%SZ")),
                )
            except sqlite3.Error as e:
                raise MigrationError(f"migration {version} bookkeeping failed: {e}") from e
        done.append(version)
    return done
