"""Published snapshot clone and form metadata stay inside local site/CAS contracts."""

from pathlib import Path
from typing import Any

import pytest
from tools.local_p0.clone import clone_definition
from tools.local_p0.control import Control, Fault


def test_clone_remaps_structural_references_without_rewriting_values() -> None:
    source: dict[str, Any] = {
        "formId": "frm_old",
        "fields": [{"id": "fld_a", "key": "sameKey", "visibleWhen": {"cond": "cnd_a"}}],
        "conditions": {
            "cnd_a": {
                "label": {"ja": "同じ"},
                "when": {"op": "eq", "args": [{"ref": "$local:fld_a"}, {"const": "fld_a"}]},
            }
        },
        "blockInstances": [{"id": "inst_a", "block": "customer", "alias": "customer"}],
        "steps": [
            {
                "id": "stp_a",
                "content": [{"field": "$local:fld_a"}, {"block": "inst_a"}],
                "transitions": [{"default": "stp_b"}],
            },
            {"id": "stp_b"},
        ],
    }
    cloned = clone_definition(source, "frm_new")
    fid = cloned["fields"][0]["id"]
    cid = cloned["fields"][0]["visibleWhen"]["cond"]
    assert fid != "fld_a" and cid != "cnd_a"
    assert cloned["conditions"][cid]["when"]["args"] == [
        {"ref": "$local:" + fid},
        {"const": "fld_a"},
    ]
    assert (
        cloned["steps"][0]["content"][1]["block"] == cloned["blockInstances"][0]["id"] != "inst_a"
    )
    assert cloned["steps"][0]["transitions"][0]["default"] == cloned["steps"][1]["id"]
    assert cloned["fields"][0]["key"] == "sameKey" and source["fields"][0]["id"] == "fld_a"


def test_metadata_cas_and_authorized_published_clone(tmp_path: Path) -> None:
    c = Control(tmp_path)
    try:
        site = "site_sports_synthetic"
        d: dict[str, Any] = {"formId": "frm_old", "siteId": site, "fields": [], "steps": []}
        c.save("synthetic-editor", site, "frm_old", 0, d, "合成フォーム")
        assert c.draft("synthetic-reviewer", site, "frm_old")["title"] == "合成フォーム"
        with pytest.raises(Fault, match="VERSION_CONFLICT"):
            c.save("synthetic-editor", site, "frm_old", 0, d, "競合")
        assert c.draft("synthetic-editor", site, "frm_old")["title"] == "合成フォーム"
        rid = c.review("synthetic-editor", site, "frm_old", 1)["id"]
        with c.atomic():
            c.conn.execute("UPDATE reviews SET state='PUBLISHED' WHERE id=?", (rid,))
            c.conn.execute(
                "INSERT INTO managed_releases VALUES ('dev_clone',?,?,?,'[]',0)",
                (site, "frm_old", rid),
            )
        result = c.clone("synthetic-editor", site, "dev_clone", "frm_new", "合成コピー")
        assert result["clonedFrom"] == "dev_clone" and result["version"] == 1
        assert c.draft("synthetic-editor", site, "frm_new")["title"] == "合成コピー"
        with pytest.raises(Fault, match="FORBIDDEN"):
            c.clone("synthetic-other", site, "dev_clone", "frm_denied", "拒否")
        with pytest.raises(Fault, match="NOT_FOUND"):
            c.clone("synthetic-editor", "site_pc_synthetic", "dev_clone", "frm_cross", "拒否")
    finally:
        c.close()
