"""Immutable review snapshot and approved review state machine, local synthetic adapter."""

import json
from pathlib import Path
from typing import Any

import pytest
from tools.local_p0.config import ROOT
from tools.local_p0.control import Control, Fault

SITE = "site_pc_synthetic"
EDITOR = "synthetic-editor"
REVIEWER = "synthetic-reviewer"
SECURITY = "synthetic-security"


@pytest.fixture
def item(tmp_path: Path) -> Any:
    c = Control(tmp_path)
    definition = json.loads((ROOT / "contracts/fixtures/engine/pc-plugin.json").read_text())
    c.save(EDITOR, SITE, definition["formId"], 0, definition)
    review = c.review(EDITOR, SITE, definition["formId"], 1)
    yield c, review["id"]
    c.close()


def test_reject_is_terminal_snapshot_unchanged(item: Any) -> None:
    c, rid = item
    before = c.review_row(REVIEWER, rid)
    with pytest.raises(Fault, match="FORBIDDEN"):
        c.reject(EDITOR, rid)
    assert c.reject(REVIEWER, rid)["state"] == "REJECTED"
    with pytest.raises(Fault, match="REVIEW_STALE"):
        c.recheck(REVIEWER, rid, before["digest"])
    after = c.review_row(REVIEWER, rid)
    assert before["definition"] == after["definition"] and before["digest"] == after["digest"]


def test_pointer_stale_is_persisted_and_cannot_recheck(item: Any) -> None:
    c, rid = item
    r = c.review_row(REVIEWER, rid)
    c.conn.execute("INSERT INTO local_releases VALUES (?,?,?)", ("dev_other", SITE, r["form"]))
    c.conn.execute("INSERT INTO local_active VALUES (?,?,?,1)", (SITE, r["form"], "dev_other"))
    with pytest.raises(Fault, match="REVIEW_STALE"):
        c.approve(REVIEWER, rid, True)
    assert c.conn.execute("SELECT state FROM reviews WHERE id=?", (rid,)).fetchone()[0] == "STALE"
    assert c.review_row(REVIEWER, rid)["staleReason"] == "pointer"
    with pytest.raises(Fault, match="REVIEW_STALE"):
        c.recheck(REVIEWER, rid, r["digest"])


def test_dependency_stale_requires_recheck_and_new_approval(item: Any) -> None:
    c, rid = item
    r = c.approve(REVIEWER, rid, True)
    c.change_policy(SECURITY, SITE, c.policy()["version"], "override", True)
    with pytest.raises(Fault, match="REVIEW_RECHECK_REQUIRED"):
        c.approve(REVIEWER, rid, True)
    assert c.review_row(REVIEWER, rid)["staleReason"] == "dependency"
    with pytest.raises(Fault, match="REVIEW_RECHECK_REQUIRED"):
        c.recheck(REVIEWER, rid, r["digest"])
    c.change_policy(SECURITY, SITE, c.policy()["version"], "override", False)
    with pytest.raises(Fault, match="FORBIDDEN"):
        c.recheck(EDITOR, rid, r["digest"])
    refreshed = c.recheck(REVIEWER, rid, r["digest"])
    assert refreshed["state"] == "OPEN" and refreshed["approver"] == ""
    assert refreshed["definition"] == r["definition"]
    assert c.approve(REVIEWER, rid, True)["state"] == "APPROVED"


def test_platform_stale_requires_recheck(item: Any, monkeypatch: pytest.MonkeyPatch) -> None:
    c, rid = item
    r = c.review_row(REVIEWER, rid)
    monkeypatch.setattr(c, "platform", lambda: "dev_platform_synthetic_next")
    with pytest.raises(Fault, match="REVIEW_RECHECK_REQUIRED"):
        c.approve(REVIEWER, rid, True)
    assert c.review_row(REVIEWER, rid)["staleReason"] == "platform"
    refreshed = c.recheck(REVIEWER, rid, r["digest"])
    assert refreshed["platform"] == "dev_platform_synthetic_next" and refreshed["state"] == "OPEN"


def test_missing_ledger_fails_closed(item: Any) -> None:
    c, rid = item
    c.conn.execute("DELETE FROM trusted_ledger")
    with pytest.raises(Fault) as e:
        c.approve(REVIEWER, rid, True)
    assert e.value.status == 503
    assert c.conn.execute("SELECT state FROM reviews WHERE id=?", (rid,)).fetchone()[0] == "OPEN"
