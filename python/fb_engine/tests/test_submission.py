"""Untrusted payload cannot select IR or supply authoritative computed values."""

import json
from pathlib import Path
from typing import Any

import pytest

from fb_engine.core import evaluate_submission

ROOT = Path(__file__).resolve().parents[3]


def trusted(name: str) -> dict[str, Any]:
    d = json.loads((ROOT / f"contracts/fixtures/engine/{name}.json").read_text())
    return {"nodes": d["fields"], "steps": d["steps"], "conditions": d.get("conditions", {})}


@pytest.mark.parametrize(
    ("extra", "code"),
    [
        ({"packingKit": "yes"}, "E-INACTIVE-DATA-PRESENT"),
        ({"evil": 1}, "UNKNOWN_FIELD"),
        ({"ir": {}}, "UNKNOWN_FIELD"),
        ({"store": None}, "E-PAYLOAD-NULL"),
        ({"store": 3}, "E-TYPE"),
    ],
)
def test_reject_payload(extra: dict[str, Any], code: str) -> None:
    result = evaluate_submission(
        trusted("pc"), {"purchaseMethod": "store", "store": "fictional", **extra}
    )
    assert not result["ok"]
    assert result["errors"][0]["code"] == code
    assert result["payload"] == {}


def test_server_calculated_recomputed() -> None:
    result = evaluate_submission(
        trusted("calculated"), {"a": 3, "b": 7, "flag": False, "total": 999}
    )
    assert result["ok"]
    assert result["payload"]["total"] == 21


@pytest.mark.parametrize("authority", [None, False, True])
def test_authoritative_fail_closed(authority: bool | None) -> None:
    result = evaluate_submission(
        trusted("pc"),
        {"purchaseMethod": "store", "store": "fictional"},
        ("synthetic-existence",),
        {"synthetic-existence": authority},
    )
    assert result["ok"] is (authority is True)


def test_group_stable_error_identity_and_inactive_child() -> None:
    result = evaluate_submission(
        trusted("groups"),
        {"show": True, "products": [{"itemId": "itm_a", "enabled": False, "note": "inactive"}]},
    )
    assert result["errors"] == [
        {"code": "E-INACTIVE-DATA-PRESENT", "path": "grp_products[itm_a]/fld_note"}
    ]


def test_large_integer_is_a_diagnostic_not_float_conversion_failure() -> None:
    result = evaluate_submission(trusted("calculated"), {"a": 10**400, "b": 1, "flag": False})
    assert result["errors"] == [{"code": "E-NUM-RANGE", "path": "fld_a"}]
