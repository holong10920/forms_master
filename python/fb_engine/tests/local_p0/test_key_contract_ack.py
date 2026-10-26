"""Data Contract acknowledgement and permanent reservation during local publication."""

import json
from pathlib import Path
from typing import Any

import pytest
from tools.local_p0.control import Control, Fault


def test_changed_contract_requires_editor_ack_and_records_rename(tmp_path: Path) -> None:
    c = Control(tmp_path)
    try:
        site, form = "site_sports_synthetic", "frm_ack"
        d: dict[str, Any] = {
            "siteId": site,
            "formId": form,
            "fields": [
                {"id": "fld_a", "key": "name", "type": "text", "classification": "personal"}
            ],
            "steps": [],
        }
        c.save("synthetic-editor", site, form, 0, d)
        rid = c.review("synthetic-editor", site, form, 1)["id"]
        # Fixture represents the atomic publication boundary, with frozen reviewed contract.
        with c.atomic():
            c._key_check(site, form, d, reserve=True)
            c.conn.execute("UPDATE reviews SET state='PUBLISHED' WHERE id=?", (rid,))
            c.conn.execute("INSERT INTO local_releases VALUES ('dev_old',?,?)", (site, form))
            c.conn.execute(
                "INSERT INTO managed_releases VALUES ('dev_old',?,?,?,'[]',0)", (site, form, rid)
            )
            c.conn.execute("INSERT INTO local_active VALUES (?,?,'dev_old',1)", (site, form))
        renamed = json.loads(json.dumps(d))
        renamed["fields"][0]["key"] = "displayName"
        c.save("synthetic-editor", site, form, 1, renamed)
        contract = c.data_contract("synthetic-editor", site, form)
        assert contract["ackRequired"] and contract["fields"][0]["renamedFrom"] == ["name"]
        with pytest.raises(Fault, match="DATA_CONTRACT_ACK_REQUIRED"):
            c.review("synthetic-editor", site, form, 2)
        assert c.review("synthetic-editor", site, form, 2, True)["state"] == "OPEN"
    finally:
        c.close()
