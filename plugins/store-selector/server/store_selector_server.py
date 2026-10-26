"""Pinned 1.0.0 synthetic connector. Site comes from trusted candidate context."""

from typing import Any

STORES: dict[str, list[dict[str, str]]] = {
    "site_pc_synthetic": [
        {"id": "ST-1001", "name": "架空・東店", "prefecture": "13"},
        {"id": "ST-1002", "name": "架空・西店", "prefecture": "27"},
    ],
    "site_other_synthetic": [{"id": "ST-9001", "name": "架空・別サイト店", "prefecture": "13"}],
}


def query_store_list(inputs: dict[str, Any], ctx: dict[str, Any]) -> list[dict[str, str]]:
    rows = STORES.get(ctx["siteId"], [])
    pref = inputs.get("prefecture")
    return [dict(row) for row in rows if not pref or row["prefecture"] == pref]


def validate_store_id(value: object, inputs: dict[str, Any], ctx: dict[str, Any]) -> dict[str, Any]:
    return {
        "ok": any(row["id"] == value for row in query_store_list(inputs, ctx)),
        "code": "storeNotAvailable",
    }
