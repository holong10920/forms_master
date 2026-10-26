"""Publication ownership/fencing, interruption recovery and review coupling (SQLite local)."""

from pathlib import Path
from typing import Any

import pytest
from tools.local_p0.control import Control, Fault

SITE = "site_sports_synthetic"
PUBLISHER = "synthetic-publisher"


@pytest.fixture
def approved(tmp_path: Path) -> Any:
    c = Control(tmp_path)
    definition = {"siteId": SITE, "formId": "frm_operation", "fields": [], "steps": []}
    c.save("synthetic-editor", SITE, "frm_operation", 0, definition)
    rid = c.review("synthetic-editor", SITE, "frm_operation", 1)["id"]
    c.approve("synthetic-reviewer", rid, True)
    yield c, rid
    c.close()


def test_one_live_operation_and_role_separation(approved: Any) -> None:
    c, rid = approved
    with pytest.raises(Fault, match="FORBIDDEN"):
        c.begin_publication("synthetic-editor", rid)
    op = c.begin_publication(PUBLISHER, rid)
    assert op["state"] == "BUILDING" and op["fence"] == 1
    assert c.begin_publication(PUBLISHER, rid)["id"] == op["id"]
    assert c.review_row(PUBLISHER, rid)["state"] == "PUBLISHING"
    with pytest.raises(Fault, match="FORBIDDEN"):
        c.operation("synthetic-other", op["id"])


def test_cancel_fences_build_and_permits_new_attempt(approved: Any) -> None:
    c, rid = approved
    op = c.begin_publication(PUBLISHER, rid)
    cancelled = c.finish_failed(PUBLISHER, op["id"], "CANCELLED_BY_USER", True)
    assert cancelled["state"] == "CANCELLED"
    with pytest.raises(Fault, match="OPERATION_FENCED"):
        c.publication_built(PUBLISHER, op["id"], 1, "dev_synthetic")
    assert c.review_row(PUBLISHER, rid)["state"] == "APPROVED"
    new = c.begin_publication(PUBLISHER, rid)
    assert new["id"] != op["id"]


def test_built_is_idempotent_for_same_artifact_and_fails_other_fence(approved: Any) -> None:
    c, rid = approved
    op = c.begin_publication(PUBLISHER, rid)
    built = c.publication_built(PUBLISHER, op["id"], 1, "dev_synthetic")
    assert built["state"] == "VERIFYING" and built["fence"] == 2
    assert c.publication_built(PUBLISHER, op["id"], 1, "dev_synthetic")["fence"] == 2
    with pytest.raises(Fault, match="OPERATION_FENCED"):
        c.publication_built(PUBLISHER, op["id"], 1, "dev_different")


def test_pointer_change_supersedes_and_stales_review(approved: Any) -> None:
    c, rid = approved
    op = c.begin_publication(PUBLISHER, rid)
    c.conn.execute("INSERT INTO local_releases VALUES (?,?,?)", ("dev_new", SITE, "frm_operation"))
    c.conn.execute("INSERT INTO local_active VALUES (?,?,?,1)", (SITE, "frm_operation", "dev_new"))
    result = c.finish_failed(PUBLISHER, op["id"], "POINTER_CHANGED")
    assert result["state"] == "SUPERSEDED"
    assert c.review_row(PUBLISHER, rid)["staleReason"] == "pointer"


def test_interrupted_process_recovered_and_old_owner_fenced(approved: Any) -> None:
    c, rid = approved
    op = c.begin_publication(PUBLISHER, rid)
    assert c.reconcile_publications(op["updated"] + 121) == 1
    assert c.operation(PUBLISHER, op["id"])["state"] == "FAILED"
    assert c.review_row(PUBLISHER, rid)["state"] == "APPROVED"
    with pytest.raises(Fault, match="OPERATION_FENCED"):
        c.publication_built(PUBLISHER, op["id"], op["fence"], "dev_synthetic")


def test_old_builder_cannot_fail_new_fence(approved: Any) -> None:
    c, rid = approved
    op = c.begin_publication(PUBLISHER, rid)
    c.publication_built(PUBLISHER, op["id"], 1, "dev_synthetic")
    with pytest.raises(Fault, match="OPERATION_FENCED"):
        c.finish_failed(PUBLISHER, op["id"], "BUILD_FAILED", expected_fence=1)
    assert c.operation(PUBLISHER, op["id"])["state"] == "VERIFYING"
