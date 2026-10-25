"""Local adapter uses S0 transactional primitives; pure evaluator has no store import."""

import importlib.util
import json
import sqlite3
from copy import deepcopy
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any

import pytest

from fb_store.clock import FakeClock
from fb_store.errors import ConditionFailed

ROOT = Path(__file__).resolve().parents[3]
spec = importlib.util.spec_from_file_location(
    "synthetic_drafts", ROOT / "tools/engine-demo/local_adapter.py"
)
assert spec and spec.loader
adapter = importlib.util.module_from_spec(spec)
spec.loader.exec_module(adapter)


def trusted() -> dict[str, Any]:
    d = json.loads((ROOT / "contracts/fixtures/engine/pc.json").read_text())
    return {
        "form": {"formId": d["formId"], "siteId": d["siteId"]},
        "nodes": d["fields"],
        "steps": d["steps"],
        "conditions": d.get("conditions", {}),
    }


def test_restart_filtering_cas_expiration_and_pin(tmp_path: Path) -> None:
    ir = trusted()
    clock = FakeClock(datetime(2026, 10, 25, tzinfo=UTC))
    path = tmp_path / "drafts.sqlite"
    store = adapter.DraftStore(path, ir, "synthetic-r1", "synthetic-rev1", clock)
    values = {
        "fld_method": "takuhai",
        "fld_kit": "yes",
        "fld_token": "synthetic-private",
        "fld_store": "synthetic-personal",
    }
    original = deepcopy(values)
    assert store.save("synthetic-session", 0, "stp_takuhai", values) == 1
    assert values == original
    raw = store.conn.execute("SELECT document FROM s1_synthetic_drafts").fetchone()[0]
    assert "synthetic-private" not in raw and "synthetic-personal" not in raw
    store.close()
    store = adapter.DraftStore(path, ir, "synthetic-r1", "synthetic-rev1", clock)
    assert store.load("synthetic-session")["draft"]["values"] == {
        "fld_method": "takuhai",
        "fld_kit": "yes",
    }
    other = adapter.DraftStore(path, ir, "synthetic-r1", "synthetic-rev1", clock)
    assert store.save("synthetic-session", 1, "stp_takuhai", values) == 2
    with pytest.raises(ConditionFailed):
        other.save("synthetic-session", 1, "stp_takuhai", values)
    other.close()
    incompatible = adapter.DraftStore(path, ir, "synthetic-r2", "synthetic-rev1", clock)
    assert incompatible.load("synthetic-session")["status"] == "incompatible"
    with pytest.raises(ConditionFailed):
        incompatible.save("synthetic-session", 2, "stp_takuhai", values)
    incompatible.close()
    cross_form = deepcopy(ir)
    cross_form["form"]["formId"] = "frm_other"
    cross = adapter.DraftStore(path, cross_form, "synthetic-r1", "synthetic-rev1", clock)
    assert cross.load("synthetic-session")["status"] == "incompatible"
    with pytest.raises(ConditionFailed):
        cross.save("synthetic-session", 2, "stp_takuhai", values)
    cross.close()
    assert store.conn.execute("SELECT COUNT(*) FROM s1_synthetic_drafts").fetchone()[0] == 1
    clock.advance(timedelta(hours=72))
    assert store.load("synthetic-session")["status"] == "expired"
    store.close()


def test_storage_failure_keeps_input_and_previous_committed_document(tmp_path: Path) -> None:
    store = adapter.DraftStore(
        tmp_path / "draft.sqlite",
        trusted(),
        "r",
        "rev",
        FakeClock(datetime(2026, 10, 25, tzinfo=UTC)),
    )
    values = {"fld_method": "takuhai", "fld_kit": "yes"}
    store.save("synthetic-session", 0, "stp_takuhai", values)
    before = deepcopy(values)
    store.conn.execute("PRAGMA query_only=ON")
    with pytest.raises(sqlite3.OperationalError):
        store.save("synthetic-session", 1, "stp_takuhai", values)
    assert values == before
    assert store.load("synthetic-session")["version"] == 1
    store.close()
