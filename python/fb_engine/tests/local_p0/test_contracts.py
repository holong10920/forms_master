"""Append-only per-form key ownership, immutable blob documents and block policy."""

import json
from pathlib import Path
from typing import Any

import pytest
from tools.local_p0.control import Control, Fault

from fb_store.errors import PayloadIntegrityError

SITE = "site_sports_synthetic"
FORM = "frm_contract"
EDITOR = "synthetic-editor"


@pytest.fixture
def c(tmp_path: Path) -> Any:
    store = Control(tmp_path)
    yield store
    store.close()


def definition() -> dict[str, Any]:
    return {
        "schemaVersion": "1.0.0",
        "kind": "form",
        "siteId": SITE,
        "formId": FORM,
        "fields": [
            {"id": "fld_original", "key": "name", "type": "text", "classification": "personal"}
        ],
        "steps": [],
    }


def test_draft_and_review_use_verified_content_addressed_blobs(c: Control) -> None:
    d = definition()
    c.save(EDITOR, SITE, FORM, 0, d)
    raw = json.loads(
        c.conn.execute("SELECT definition FROM drafts WHERE form=?", (FORM,)).fetchone()[0]
    )
    assert set(raw) == {"snapshotRef"} and raw["snapshotRef"]["format"] == "jcs-json"
    rid = c.review(EDITOR, SITE, FORM, 1)["id"]
    snapshot = c.review_row("synthetic-reviewer", rid)
    assert snapshot["definition"] == d
    later = definition()
    later["fields"][0]["label"] = {"ja": "Later"}
    c.save(EDITOR, SITE, FORM, 1, later)
    assert c.review_row("synthetic-reviewer", rid)["definition"] == d
    blob = c.data / "blobs" / raw["snapshotRef"]["blobKey"]
    blob.chmod(0o600)
    blob.write_bytes(b"{}")
    with pytest.raises(PayloadIntegrityError):
        c.review_row("synthetic-reviewer", rid)


def test_reserved_key_survives_rename_and_cannot_change_owner_or_type(c: Control) -> None:
    d = definition()
    with c.atomic():
        c._key_check(SITE, FORM, d, reserve=True)
    renamed = definition()
    renamed["fields"][0]["key"] = "displayName"
    with c.atomic():
        rows = c._key_check(SITE, FORM, renamed, reserve=True)
    assert rows[0]["renamedFrom"] == ["name"]
    with c.atomic():
        c._key_check(SITE, FORM, d, reserve=True)
    other = definition()
    other["fields"][0]["id"] = "fld_replacement"
    with pytest.raises(Fault, match="KEY_COLLISION"):
        c.save(EDITOR, SITE, FORM, 0, other)
    changed = definition()
    changed["fields"][0]["type"] = "number"
    with pytest.raises(Fault, match="BREAKING_FIELD_REPLACEMENT_REQUIRED"):
        c.save(EDITOR, SITE, FORM, 0, changed)


def test_block_alias_ownership_pin_upgrade_and_vulnerable_gate(c: Control) -> None:
    d = definition()
    d["fields"] = []
    d["dependencies"] = {"blocks": {"customer": "blk_customer_info@r1"}}
    d["blockInstances"] = [
        {"id": "inst_original", "alias": "customer", "block": "customer", "inputs": {}}
    ]
    c.save(EDITOR, SITE, FORM, 0, d)
    with c.atomic():
        c._key_check(SITE, FORM, d, reserve=True)
    replacement = json.loads(json.dumps(d))
    replacement["blockInstances"][0]["id"] = "inst_new"
    with pytest.raises(Fault, match="KEY_COLLISION"):
        c.save(EDITOR, SITE, FORM, 1, replacement)
    upgraded = json.loads(json.dumps(d))
    upgraded["dependencies"]["blocks"]["customer"] = "blk_customer_info@r2"
    c.save(EDITOR, SITE, FORM, 1, upgraded)
    c.block_status("synthetic-security", SITE, "blk_customer_info@r2", 1, "vulnerable")
    with pytest.raises(Fault, match="E-BLOCK-VULNERABLE"):
        c.review(EDITOR, SITE, FORM, 2)
    c.block_status("synthetic-security", SITE, "blk_customer_info@r2", 2, "published")
    assert c.review(EDITOR, SITE, FORM, 2)["state"] == "OPEN"


def test_business_editor_cannot_downgrade_field_classification(tmp_path: Path) -> None:
    c = Control(tmp_path)
    try:
        site, form = "site_sports_synthetic", "frm_classification"
        original = {
            "siteId": site,
            "formId": form,
            "fields": [
                {"id": "fld_person", "key": "name", "type": "text", "classification": "personal"}
            ],
            "steps": [],
        }
        c.save("synthetic-editor", site, form, 0, original)
        lower = json.loads(json.dumps(original))
        lower["fields"][0]["classification"] = "public"
        with pytest.raises(Fault, match="CLASSIFICATION_DOWNGRADE_FORBIDDEN"):
            c.save("synthetic-editor", site, form, 1, lower)
        assert c.draft("synthetic-editor", site, form)["version"] == 1
    finally:
        c.close()
