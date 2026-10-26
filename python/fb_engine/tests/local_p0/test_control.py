"""Local control security contracts; SQLite only, never DynamoDB verification."""

import json
import threading
from pathlib import Path
from typing import Any

import pytest
from tools.local_p0.control import EFFECT, FBKS, Control, Fault

EDITOR = "synthetic-editor"
SECURITY = "synthetic-security"
SITE = "site_sports_synthetic"


@pytest.fixture
def control(tmp_path: Path) -> Any:
    c = Control(tmp_path)
    yield c
    c.close()


def seed(c: Control) -> None:
    with c.atomic():
        c.ingest()
        for key in ("form:" + SITE + ":frm_test", "release:dev_test"):
            c.conn.execute("INSERT INTO gates VALUES (?,'[]')", (key,))
        c.conn.execute(
            "INSERT INTO managed_releases VALUES (?,?,?,?,?,0)",
            ("dev_test", SITE, "frm_test", "review_test", json.dumps([*FBKS, EFFECT])),
        )


def test_membership_csrf_and_draft_cas(control: Control) -> None:
    c = control
    session = c.login(EDITOR)
    assert c.actor(session["token"], session["csrf"]) == EDITOR
    with pytest.raises(Fault, match="CSRF"):
        c.actor(session["token"], "wrong")
    definition = {"siteId": SITE, "formId": "frm_test", "fields": [], "steps": []}
    assert c.save(EDITOR, SITE, "frm_test", 0, definition)["version"] == 1
    with pytest.raises(Fault, match="VERSION_CONFLICT"):
        c.save(EDITOR, SITE, "frm_test", 0, definition)
    with pytest.raises(Fault, match="FORBIDDEN"):
        c.draft("synthetic-other", SITE, "frm_test")
    with pytest.raises(Fault, match="FORBIDDEN"):
        c.save("synthetic-reviewer", SITE, "frm_test", 1, definition)


def test_review_snapshot_is_immutable_and_role_separated(control: Control) -> None:
    c = control
    d: dict[str, Any] = {"siteId": SITE, "formId": "frm_test", "fields": [], "steps": []}
    c.save(EDITOR, SITE, "frm_test", 0, d)
    r = c.review(EDITOR, SITE, "frm_test", 1)
    d["fields"] = [{"key": "changed"}]
    c.save(EDITOR, SITE, "frm_test", 1, d)
    assert c.review_row("synthetic-reviewer", r["id"])["definition"]["fields"] == []
    with pytest.raises(Fault, match="FORBIDDEN"):
        c.approve(EDITOR, r["id"], True)
    c.approve("synthetic-reviewer", r["id"], True)
    with pytest.raises(Fault, match="REVIEW_STALE"):
        c.approve("synthetic-reviewer", r["id"], True)


def test_idempotency_outbox_and_effect_gate(control: Control) -> None:
    c = control
    seed(c)
    request: dict[str, Any] = {"payload": {"synthetic": "yes"}, "idempotencyKey": "test-key"}
    one = c.submit("dev_test", request, request["payload"])
    assert c.submit("dev_test", request, request["payload"]) == one
    with pytest.raises(Fault, match="IDEMPOTENCY_KEY_REUSED"):
        c.submit("dev_test", {**request, "payload": {}}, {})
    c.conn.execute("UPDATE gates SET blockers='[\"hold\"]' WHERE key=?", ("fbk:" + EFFECT,))
    with pytest.raises(Fault):
        c.worker()
    assert c.conn.execute("SELECT COUNT(*) FROM mock_effects").fetchone()[0] == 0
    c.conn.execute("UPDATE gates SET blockers='[]' WHERE key=?", ("fbk:" + EFFECT,))
    assert c.worker() == {"mockEffects": 1}
    assert c.worker() == {"mockEffects": 0}
    assert c.conn.execute("SELECT COUNT(*) FROM submissions").fetchone()[0] == 1


@pytest.mark.parametrize(
    "first,second", [("override", "m3"), ("m3", "override"), ("ledger", "override")]
)
def test_policy_sources_never_erase_other_blockers(
    control: Control, first: str, second: str
) -> None:
    c = control
    seed(c)
    for source in (first, second):
        p = c.policy()
        c.change_policy(
            SECURITY, SITE, p["version"], source, "revoked" if source == "ledger" else True
        )
    p = c.policy()
    c.change_policy(SECURITY, SITE, p["version"], second, False)
    with pytest.raises(Fault, match="E-CAPABILITY-BLOCKED"):
        c.admission("dev_test")
    p = c.policy()
    blockers = c.derive(p)
    assert all(
        json.loads(r[0]) == blockers
        for r in c.conn.execute(
            "SELECT blockers FROM gates WHERE key IN (?,?)", tuple("fbk:" + f for f in FBKS)
        )
    )


def test_missing_gate_policy_update_rolls_back_and_intent_blocks(control: Control) -> None:
    c = control
    seed(c)
    c.conn.execute("DELETE FROM gates WHERE key=?", ("fbk:" + FBKS[0],))
    with pytest.raises(Fault, match="E-ADMISSION-UNAVAILABLE"):
        c.change_policy(SECURITY, SITE, 1, "override", True)
    assert c.policy()["version"] == 1
    with pytest.raises(Fault, match="E-ADMISSION-UNAVAILABLE"):
        c.admission("dev_test")
    c.conn.execute("INSERT INTO gate_intents VALUES ('repair')")
    with pytest.raises(Fault, match="E-ADMISSION-UNAVAILABLE"):
        c.admission("dev_test")


def test_ct26_sqlite_controlled_revoke_before_admission(control: Control) -> None:
    c = control
    seed(c)
    read = threading.Event()
    committed = threading.Event()
    errors: list[BaseException] = []
    results: list[str] = []

    def adapter() -> None:
        other = Control(c.data)
        try:
            other.admission("dev_test")  # pre-adapter read, intentionally not a lock
            read.set()
            assert committed.wait(5)
            with pytest.raises(Fault, match="E-CAPABILITY-BLOCKED"):
                other.submit("dev_test", {"payload": {}, "idempotencyKey": "racing"}, {})
            results.append("blocked-at-commit")
        except BaseException as e:
            errors.append(e)
        finally:
            other.close()

    t = threading.Thread(target=adapter)
    t.start()
    assert read.wait(5)
    c.change_policy(SECURITY, SITE, 1, "override", True)
    committed.set()
    t.join(6)
    assert not t.is_alive() and not errors
    assert results == ["blocked-at-commit"]
    assert c.conn.execute("SELECT COUNT(*) FROM submissions").fetchone()[0] == 0


def test_ct26_sqlite_admission_before_revoke_then_effect_blocked(control: Control) -> None:
    c = control
    seed(c)
    c.submit("dev_test", {"payload": {}, "idempotencyKey": "before"}, {})
    c.change_policy(SECURITY, SITE, 1, "override", True)
    with pytest.raises(Fault):
        c.worker()
    assert c.conn.execute("SELECT COUNT(*) FROM submissions").fetchone()[0] == 1
    assert c.conn.execute("SELECT COUNT(*) FROM mock_effects").fetchone()[0] == 0


def test_vg17_synthetic_connector_and_credential_guards(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    from tools.local_p0 import config

    p = tmp_path / "environment.json"
    baseline = json.loads(config.CONFIG.read_text())
    monkeypatch.setattr(config, "CONFIG", p)
    for change in (
        {"dataMode": "real"},
        {"connectors": ["smtp"]},
        {"allowedEffects": ["send-mail"]},
    ):
        p.write_text(json.dumps({**baseline, **change}))
        with pytest.raises(RuntimeError, match="E-SYNTHETIC-ONLY"):
            config.enforce()
    p.write_text(json.dumps(baseline))
    monkeypatch.setenv("AWS_ACCESS_KEY_ID", "synthetic-disallowed-env-marker")
    with pytest.raises(RuntimeError, match="E-REAL-CREDENTIAL-ENV"):
        config.enforce()
    monkeypatch.delenv("AWS_ACCESS_KEY_ID")
    monkeypatch.setenv("FB_DATA_MODE", "real")
    with pytest.raises(RuntimeError, match="E-SYNTHETIC-ONLY"):
        config.enforce()


@pytest.mark.parametrize(
    "op", ["login", "get", "approve", "activate", "preview.check", "worker", "policy.change"]
)
def test_vg17_store_unavailable_rpc_fails_closed(
    op: str, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    import io
    import sqlite3

    from tools.local_p0 import rpc

    def unavailable() -> None:
        raise sqlite3.OperationalError("synthetic store unavailable")

    monkeypatch.setattr(rpc, "Control", unavailable)
    monkeypatch.setattr("sys.stdin", io.StringIO(json.dumps({"op": op})))
    rpc.main()
    result = json.loads(capsys.readouterr().out)
    assert result["status"] == 503
    assert result["body"]["code"] == "STORE_UNAVAILABLE"


def test_ct26_cas_and_existing_ingestion_preserve_m3(control: Control) -> None:
    c = control
    seed(c)
    c.change_policy(SECURITY, SITE, 1, "m3", True)
    with c.atomic():
        c.ingest()
    assert c.policy()["m3"] is True
    with pytest.raises(Fault, match="VERSION_CONFLICT"):
        c.change_policy(SECURITY, SITE, 1, "override", False)
    for f in FBKS:
        with pytest.raises(Fault, match="E-CAPABILITY-BLOCKED"):
            c.gate("fbk:" + f)


def test_control_initialization_retries_foundation_conflict(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    from tools.compiler.local_publish import LocalPublisher
    from tools.local_p0 import control

    from fb_store.errors import Conflict

    real = LocalPublisher
    calls = 0

    def busy(path: Path) -> Any:
        nonlocal calls
        calls += 1
        if calls < 3:
            raise Conflict("synthetic lock contention")
        return real(path)

    monkeypatch.setattr("tools.local_p0.control.LocalPublisher", busy)
    monkeypatch.setattr("tools.local_p0.control.time.sleep", lambda _: None)
    c = control.Control(tmp_path)
    c.close()
    assert calls == 3


def test_missing_gate_is_not_reopened_by_ingestion_and_repair_preserves_m3(
    control: Control,
) -> None:
    c = control
    seed(c)
    c.change_policy(SECURITY, SITE, 1, "m3", True)
    c.conn.execute("DELETE FROM gates WHERE key=?", ("fbk:" + FBKS[0],))
    with pytest.raises(Fault, match="E-ADMISSION-UNAVAILABLE"), c.atomic():
        c.ingest()
    assert c.conn.execute("SELECT 1 FROM gates WHERE key=?", ("fbk:" + FBKS[0],)).fetchone() is None
    with pytest.raises(Fault, match="FORBIDDEN"):
        c.repair_policy(EDITOR, SITE, 2)
    c.repair_policy(SECURITY, SITE, 2)
    with pytest.raises(Fault, match="E-CAPABILITY-BLOCKED"):
        c.admission("dev_test")
    assert c.policy()["m3"] is True
    assert c.conn.execute("SELECT COUNT(*) FROM gate_intents").fetchone()[0] == 0


def test_override_before_ingestion_is_404(control: Control) -> None:
    with pytest.raises(Fault) as e:
        control.change_policy(SECURITY, SITE, 1, "override", True)
    assert e.value.status == 404
