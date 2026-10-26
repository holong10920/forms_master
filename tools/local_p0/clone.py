"""Declarative published-snapshot cloning; preserve values, pins and public keys."""

import copy
import uuid
from typing import Any


def clone_definition(source: dict[str, Any], form: str) -> dict[str, Any]:
    definition = copy.deepcopy(source)
    ids: set[str] = set()

    def collect(value: Any) -> None:
        if isinstance(value, dict):
            if isinstance(value.get("id"), str) and value["id"].startswith(
                ("fld_", "grp_", "stp_", "inst_")
            ):
                ids.add(value["id"])
            for child in value.values():
                collect(child)
        elif isinstance(value, list):
            for child in value:
                collect(child)

    collect(definition)
    ids.update(definition.get("conditions", {}))
    replacements = {old: old.split("_", 1)[0] + "_" + uuid.uuid4().hex for old in ids}

    def remap(value: Any, key: str = "") -> Any:
        if isinstance(value, dict):
            if key == "const":
                return value
            return {
                (replacements.get(k, k) if key == "conditions" else k): remap(v, k)
                for k, v in value.items()
            }
        if isinstance(value, list):
            return [remap(v, key) for v in value]
        if isinstance(value, str):
            if key in ("id", "cond", "block", "to", "default"):
                return replacements.get(value, value)
            if key in ("ref", "field"):
                if value.startswith("$local:"):
                    return "$local:" + replacements.get(value[7:], value[7:])
                if ":@" in value:
                    instance, export = value.split(":@", 1)
                    return replacements.get(instance, instance) + ":@" + export
        return value

    result: dict[str, Any] = remap(definition)
    result["formId"] = form
    return result
