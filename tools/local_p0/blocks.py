"""Read-only approved local shared-block catalog; no code facets or network resolution."""

import hashlib
import json
import re
from typing import Any

from tools.local_p0.config import ROOT


def catalog() -> dict[str, dict[str, Any]]:
    registry: dict[str, str] = json.loads(
        (ROOT / "contracts/fixtures/blocks/registry.json").read_text()
    )
    result = {}
    for pin, checksum in registry.items():
        if not re.fullmatch(r"blk_customer_info@r[12]", pin):
            raise ValueError("E-BLOCK-UNTRUSTED")
        raw = (ROOT / "contracts/fixtures/blocks" / (pin + ".json")).read_bytes()
        if hashlib.sha256(raw).hexdigest() != checksum:
            raise ValueError("E-BLOCK-INTEGRITY")
        result[pin] = {"digest": checksum, "block": json.loads(raw)}
    return result


def contract(definition: dict[str, Any]) -> list[dict[str, Any]]:
    result = []
    for field in definition.get("fields", []):
        result.append(
            {
                "path": field["key"],
                "identity": field["id"],
                "type": field["type"],
                "classification": field.get("classification"),
                "required": field.get("required", False) or field.get("requiredWhen", False),
            }
        )
    pins = definition.get("dependencies", {}).get("blocks", {})
    entries = catalog() if definition.get("blockInstances") else {}
    for instance in definition.get("blockInstances", []):
        pin = pins.get(instance["block"])
        if pin not in entries:
            raise ValueError("E-BLOCK-PIN")
        alias, iid = instance["alias"], instance["id"]
        result.append(
            {
                "path": alias,
                "identity": iid,
                "type": "blockAlias",
                "classification": "public",
                "required": False,
            }
        )
        for f in entries[pin]["block"]["fields"]:
            result.append(
                {
                    "path": alias + "." + f["key"],
                    "identity": iid + ":" + f["id"],
                    "type": f["type"],
                    "inputs": {
                        k: instance.get("inputs", {}).get(k, v.get("default"))
                        for k, v in entries[pin]["block"]["inputs"].items()
                    },
                    "classification": f.get("classification"),
                    "required": f.get("required", False) or f.get("requiredWhen", False),
                }
            )
    return result
