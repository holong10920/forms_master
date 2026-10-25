import sqlite3
from datetime import UTC, datetime
from pathlib import Path

import pytest

from fb_store.clock import FakeClock
from fb_store.errors import MigrationError
from fb_store.migrations import apply_migrations
from fb_store.sqlite import open_database

FIXTURES = Path(__file__).parent / "migrations_fixture"
CLOCK = FakeClock(datetime(2026, 10, 25, tzinfo=UTC))


@pytest.fixture
def conn(tmp_path: Path) -> sqlite3.Connection:
    return open_database(tmp_path / "m.sqlite3")


def _tables(conn: sqlite3.Connection) -> set[str]:
    return {r[0] for r in conn.execute("SELECT name FROM sqlite_master WHERE type = 'table'")}


def test_applies_in_order_and_is_idempotent(conn: sqlite3.Connection) -> None:
    assert apply_migrations(conn, FIXTURES / "ok", CLOCK) == ["0001", "0002"]
    assert apply_migrations(conn, FIXTURES / "ok", CLOCK) == []
    assert {"a", "b", "schema_migrations"} <= _tables(conn)
    rows = conn.execute(
        "SELECT version, applied_at FROM schema_migrations ORDER BY version"
    ).fetchall()
    assert [tuple(r) for r in rows] == [
        ("0001", "2026-10-25T00:00:00Z"),
        ("0002", "2026-10-25T00:00:00Z"),
    ]


def test_failed_migration_is_atomic(conn: sqlite3.Connection) -> None:
    with pytest.raises(MigrationError):
        apply_migrations(conn, FIXTURES / "broken", CLOCK)
    assert "x" not in _tables(conn)
    assert conn.execute("SELECT count(*) FROM schema_migrations").fetchone()[0] == 0
    assert not conn.in_transaction


def test_edited_applied_migration_is_rejected(conn: sqlite3.Connection, tmp_path: Path) -> None:
    d = tmp_path / "m"
    d.mkdir()
    (d / "0001_a.sql").write_text("CREATE TABLE a (k TEXT) STRICT;\n")
    apply_migrations(conn, d, CLOCK)
    (d / "0001_a.sql").write_text("CREATE TABLE a (k TEXT, extra TEXT) STRICT;\n")
    with pytest.raises(MigrationError):
        apply_migrations(conn, d, CLOCK)


def test_late_lower_version_is_rejected(conn: sqlite3.Connection, tmp_path: Path) -> None:
    d = tmp_path / "m"
    d.mkdir()
    (d / "0002_b.sql").write_text("CREATE TABLE b (k TEXT) STRICT;\n")
    apply_migrations(conn, d, CLOCK)
    (d / "0001_late.sql").write_text("CREATE TABLE late (k TEXT) STRICT;\n")
    with pytest.raises(MigrationError):
        apply_migrations(conn, d, CLOCK)
    assert "late" not in _tables(conn)


@pytest.mark.parametrize("fixture", ["txstmt", "badname", "dup"])
def test_invalid_migration_sets_are_rejected(conn: sqlite3.Connection, fixture: str) -> None:
    with pytest.raises(MigrationError):
        apply_migrations(conn, FIXTURES / fixture, CLOCK)
    assert _tables(conn) <= {"schema_migrations"}


def _one_file(tmp_path: Path, sql: str, name: str = "0001_a.sql") -> Path:
    d = tmp_path / "m"
    d.mkdir(exist_ok=True)
    (d / name).write_bytes(sql.encode("utf-8"))
    return d


@pytest.mark.parametrize(
    "sql",
    [
        "CREATE TABLE a (k TEXT) STRICT; COMMIT; CREATE TABLEE broken (k);",
        "CREATE TABLE a (k TEXT) STRICT; COMMIT; CREATE TABLE b (k TEXT) STRICT;",
        "CREATE TABLE a (k TEXT) STRICT;\n/* x */ COMMIT;\nCREATE TABLE b (k TEXT) STRICT;",
        "CREATE TABLE a (k TEXT) STRICT;\ncommit transaction;",
        "CREATE TABLE a (k TEXT) STRICT;\nEND;",
        "SAVEPOINT s; CREATE TABLE a (k TEXT) STRICT; RELEASE s;",
        "CREATE TABLE a (k TEXT) STRICT; ROLLBACK;",
    ],
    ids=[
        "mid-line-commit-then-error",
        "mid-line-commit",
        "comment-commit",
        "lowercase",
        "end",
        "savepoint",
        "rollback",
    ],
)
def test_transaction_control_anywhere_is_denied_atomically(
    conn: sqlite3.Connection, tmp_path: Path, sql: str
) -> None:
    with pytest.raises(MigrationError):
        apply_migrations(conn, _one_file(tmp_path, sql), CLOCK)
    assert _tables(conn) == {"schema_migrations"}
    assert conn.execute("SELECT count(*) FROM schema_migrations").fetchone()[0] == 0
    assert not conn.in_transaction


def test_trigger_and_case_end_are_allowed(conn: sqlite3.Connection, tmp_path: Path) -> None:
    sql = (
        "CREATE TABLE t (k INTEGER) STRICT;\nCREATE TABLE log (k INTEGER) STRICT;\n"
        "CREATE TRIGGER t_ins AFTER INSERT ON t BEGIN\n"
        "  INSERT INTO log VALUES (CASE WHEN new.k > 0 THEN new.k\n  ELSE 0\n  END);\nEND;\n"
    )
    assert apply_migrations(conn, _one_file(tmp_path, sql), CLOCK) == ["0001"]
    conn.execute("INSERT INTO t VALUES (5)")
    assert conn.execute("SELECT k FROM log").fetchone()[0] == 5


def test_crlf_edit_is_a_change(conn: sqlite3.Connection, tmp_path: Path) -> None:
    d = _one_file(tmp_path, "CREATE TABLE a (k TEXT) STRICT;\n")
    apply_migrations(conn, d, CLOCK)
    (d / "0001_a.sql").write_bytes(b"CREATE TABLE a (k TEXT) STRICT;\r\n")
    with pytest.raises(MigrationError, match="modified"):
        apply_migrations(conn, d, CLOCK)


def test_deleted_applied_file_is_detected(conn: sqlite3.Connection, tmp_path: Path) -> None:
    d = _one_file(tmp_path, "CREATE TABLE a (k TEXT) STRICT;\n")
    apply_migrations(conn, d, CLOCK)
    (d / "0001_a.sql").unlink()
    with pytest.raises(MigrationError, match="missing"):
        apply_migrations(conn, d, CLOCK)


def test_uppercase_extension_is_rejected(conn: sqlite3.Connection, tmp_path: Path) -> None:
    with pytest.raises(MigrationError):
        apply_migrations(conn, _one_file(tmp_path, "SELECT 1;", "0001_a.SQL"), CLOCK)


def test_non_autocommit_connection_is_rejected(tmp_path: Path) -> None:
    legacy = sqlite3.connect(tmp_path / "l.sqlite3")
    with pytest.raises(MigrationError):
        apply_migrations(legacy, FIXTURES / "ok", CLOCK)


def test_interrupt_rolls_back(conn: sqlite3.Connection) -> None:
    class Interrupting(FakeClock):
        def now(self) -> datetime:
            raise KeyboardInterrupt

    with pytest.raises(KeyboardInterrupt):
        apply_migrations(conn, FIXTURES / "ok", Interrupting(datetime(2026, 10, 25, tzinfo=UTC)))
    assert not conn.in_transaction
    assert _tables(conn) == {"schema_migrations"}


def test_concurrent_runners_apply_each_file_once(tmp_path: Path) -> None:
    import threading

    from fb_store.sqlite import with_conflict_retry

    path = tmp_path / "c.sqlite3"
    # Create the file (and switch it to WAL) once: concurrent first opens of a fresh database
    # contend on the journal-mode switch and fail fast with Conflict, which is not under test here.
    open_database(path).close()
    results: list[list[str]] = []
    lock = threading.Lock()
    barrier = threading.Barrier(4, timeout=10)

    errors: list[BaseException] = []

    def run() -> None:
        try:
            c = open_database(path)
            try:
                barrier.wait()
                out = with_conflict_retry(
                    lambda: apply_migrations(c, FIXTURES / "ok", CLOCK),
                    attempts=200,
                    max_delay_s=0.01,
                )
                with lock:
                    results.append(out)
            finally:
                c.close()
        except BaseException as e:
            with lock:
                errors.append(e)

    threads = [threading.Thread(target=run) for _ in range(4)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    assert not errors, errors
    assert len(results) == 4
    # A failed attempt may already have committed a file. Retrying the whole runner
    # returns only versions from the final successful call, not all prior progress.
    reported = [v for r in results for v in r]
    assert len(reported) == len(set(reported))
    assert set(reported) <= {"0001", "0002"}
    check = open_database(path)
    try:
        assert [
            r[0] for r in check.execute("SELECT version FROM schema_migrations ORDER BY version")
        ] == ["0001", "0002"]
        assert check.execute("SELECT count(*) FROM b").fetchone()[0] == 1
    finally:
        check.close()


def test_retry_after_partial_progress_keeps_durable_history(conn: sqlite3.Connection) -> None:
    from fb_store.errors import Conflict
    from fb_store.sqlite import with_conflict_retry

    class OnceContended(FakeClock):
        def __init__(self) -> None:
            super().__init__(datetime(2026, 10, 25, tzinfo=UTC))
            self.calls = 0

        def now(self) -> datetime:
            self.calls += 1
            if self.calls == 2:
                raise Conflict("synthetic contention after first committed file")
            return super().now()

    clock = OnceContended()
    reported = with_conflict_retry(
        lambda: apply_migrations(conn, FIXTURES / "ok", clock), attempts=2, base_delay_s=0
    )
    assert reported == ["0002"]
    assert [
        r[0] for r in conn.execute("SELECT version FROM schema_migrations ORDER BY version")
    ] == ["0001", "0002"]
    assert conn.execute("SELECT k, v FROM b").fetchall()[0]["v"] == 1
    assert apply_migrations(conn, FIXTURES / "ok", CLOCK) == []


@pytest.mark.parametrize(
    "sql",
    [
        "ATTACH DATABASE ':memory:' AS other; CREATE TABLE other.t (k TEXT);",
        "PRAGMA query_only = ON; CREATE TABLE a (k TEXT) STRICT;",
        "CREATE TABLE a (k TEXT) STRICT; PRAGMA busy_timeout = 5000;",
    ],
    ids=["attach", "pragma-query-only", "pragma-busy-timeout"],
)
def test_attach_and_pragma_are_denied(conn: sqlite3.Connection, tmp_path: Path, sql: str) -> None:
    with pytest.raises(MigrationError):
        apply_migrations(conn, _one_file(tmp_path, sql), CLOCK)
    assert _tables(conn) == {"schema_migrations"}
    assert conn.execute("PRAGMA busy_timeout").fetchone()[0] == 0
    assert conn.execute("PRAGMA query_only").fetchone()[0] == 0
    assert [r[1] for r in conn.execute("PRAGMA database_list")] == ["main"]


@pytest.mark.parametrize(
    "sql",
    [
        "INSERT INTO schema_migrations VALUES ('0001', 'x', 'y');",
        "DROP TABLE schema_migrations;",
    ],
    ids=["own-bookkeeping-row", "drop-bookkeeping"],
)
def test_bookkeeping_tampering_is_a_migration_error(
    conn: sqlite3.Connection, tmp_path: Path, sql: str
) -> None:
    with pytest.raises(MigrationError):
        apply_migrations(conn, _one_file(tmp_path, sql), CLOCK)
    assert conn.execute("SELECT count(*) FROM schema_migrations").fetchone()[0] == 0
    assert not conn.in_transaction


def test_non_utf8_file_is_a_migration_error(conn: sqlite3.Connection, tmp_path: Path) -> None:
    d = tmp_path / "m"
    d.mkdir()
    (d / "0001_a.sql").write_bytes(b"CREATE TABLE \xff (k TEXT);")
    with pytest.raises(MigrationError):
        apply_migrations(conn, d, CLOCK)


def test_directory_named_like_a_migration_is_rejected(
    conn: sqlite3.Connection, tmp_path: Path
) -> None:
    d = tmp_path / "m"
    (d / "0001_x.sql").mkdir(parents=True)
    with pytest.raises(MigrationError):
        apply_migrations(conn, d, CLOCK)


@pytest.mark.parametrize(
    "column", ["note TEXT", "score INTEGER NOT NULL DEFAULT 1 CHECK(score > 0)"]
)
def test_alter_strict_table_with_existing_rows(
    conn: sqlite3.Connection, tmp_path: Path, column: str
) -> None:
    d = _one_file(
        tmp_path, "CREATE TABLE t (id INTEGER PRIMARY KEY) STRICT; INSERT INTO t VALUES(1);"
    )
    assert apply_migrations(conn, d, CLOCK) == ["0001"]
    (d / "0002_add.sql").write_text(f"ALTER TABLE t ADD COLUMN {column};")
    assert apply_migrations(conn, d, CLOCK) == ["0002"]
    assert len(conn.execute("PRAGMA table_info(t)").fetchall()) == 2
    assert conn.execute("SELECT id FROM t").fetchone()[0] == 1
    assert apply_migrations(conn, d, CLOCK) == []
    if column.startswith("score"):
        with pytest.raises(sqlite3.IntegrityError):
            conn.execute("INSERT INTO t VALUES(2, 0)")


@pytest.mark.parametrize(
    "tail",
    [
        "ALTER TABLE t ADD COLUMN score INTEGER DEFAULT 0 CHECK(score > 0);",
        "INSERT INTO absent VALUES(1);",
    ],
)
def test_failed_alter_rolls_back_entire_file(
    conn: sqlite3.Connection, tmp_path: Path, tail: str
) -> None:
    d = _one_file(tmp_path, "CREATE TABLE t (id INTEGER) STRICT; INSERT INTO t VALUES(1);")
    apply_migrations(conn, d, CLOCK)
    (d / "0002_fail.sql").write_text(
        "ALTER TABLE t ADD COLUMN note TEXT; INSERT INTO t(id) VALUES(2);" + tail
    )
    with pytest.raises(MigrationError):
        apply_migrations(conn, d, CLOCK)
    assert [r[1] for r in conn.execute("PRAGMA table_info(t)")] == ["id"]
    assert [r[0] for r in conn.execute("SELECT id FROM t")] == [1]
    assert [r[0] for r in conn.execute("SELECT version FROM schema_migrations")] == ["0001"]
    assert not conn.in_transaction


@pytest.mark.parametrize(
    "pragma",
    [
        "quick_check",
        "quick_check(1)",
        "main.quick_check('t')",
        "integrity_check(1)",
        "foreign_key_check(t)",
        "foreign_key_list(t)",
        "table_info(t)",
        "table_xinfo(t)",
        "table_list",
        "index_info(idx)",
        "index_xinfo(idx)",
        "index_list(t)",
        "database_list",
        "TaBlE_InFo = 't'",
    ],
)
def test_read_only_pragmas_with_arguments_are_allowed(
    conn: sqlite3.Connection, tmp_path: Path, pragma: str
) -> None:
    sql = f"CREATE TABLE t (id INTEGER) STRICT; CREATE INDEX idx ON t(id); PRAGMA {pragma};"
    assert apply_migrations(conn, _one_file(tmp_path, sql), CLOCK) == ["0001"]


@pytest.mark.parametrize(
    "pragma",
    [
        "writable_schema=ON",
        "trusted_schema(ON)",
        "foreign_keys=OFF",
        "journal_mode=OFF",
        "synchronous=OFF",
        "fullfsync=OFF",
        "checkpoint_fullfsync=OFF",
        "ignore_check_constraints=ON",
        "schema_version=123",
        "user_version=123",
        "locking_mode=EXCLUSIVE",
        "optimize",
        "wal_checkpoint",
        "shrink_memory",
        "incremental_vacuum",
        "unknown_pragma",
        "busy_timeout",
        "query_only",
        "main.WrItAbLe_ScHeMa(ON)",
    ],
)
def test_settings_and_unknown_pragmas_fail_closed_atomically(
    conn: sqlite3.Connection, tmp_path: Path, pragma: str
) -> None:
    settings = [
        "writable_schema",
        "trusted_schema",
        "foreign_keys",
        "journal_mode",
        "synchronous",
        "fullfsync",
        "checkpoint_fullfsync",
        "ignore_check_constraints",
        "schema_version",
        "user_version",
        "locking_mode",
        "busy_timeout",
        "query_only",
    ]
    # Initialize bookkeeping before capturing schema_version.
    empty = tmp_path / "empty"
    empty.mkdir()
    apply_migrations(conn, empty, CLOCK)
    before = {name: conn.execute(f"PRAGMA {name}").fetchone()[0] for name in settings}
    with pytest.raises(MigrationError):
        apply_migrations(
            conn,
            _one_file(tmp_path, f"CREATE TABLE t (id INTEGER) STRICT; PRAGMA {pragma};"),
            CLOCK,
        )
    assert _tables(conn) == {"schema_migrations"}
    assert conn.execute("SELECT count(*) FROM schema_migrations").fetchone()[0] == 0
    assert {name: conn.execute(f"PRAGMA {name}").fetchone()[0] for name in settings} == before
    assert not conn.in_transaction
