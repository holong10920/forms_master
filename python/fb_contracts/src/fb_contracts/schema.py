"""JSON Schema (Draft 2020-12) validation against the canonical schemas in ``contracts/schemas``.

Settings and error normalization match ``@fb/contracts`` (``packages/contracts/src/schema.ts``).
"""

import json
import re
from collections.abc import Iterable
from functools import cache
from pathlib import Path
from typing import Any, NamedTuple

from jsonschema import Draft202012Validator
from referencing import Registry

# Repo-relative location; packaging the schemas for deployment is out of S0 scope.
CONTRACTS_DIR = Path(__file__).resolve().parents[4] / "contracts"

_SCHEMA_ID = re.compile(r"[a-z0-9-]+/v[1-9][0-9]*")


class SchemaError(NamedTuple):
    instance_path: str
    keyword: str


class SchemaResult(NamedTuple):
    valid: bool
    errors: list[SchemaError]


def json_pointer(path: Iterable[str | int]) -> str:
    return "".join("/" + str(p).replace("~", "~0").replace("/", "~1") for p in path)


def build_validator(schema: dict[str, Any]) -> Draft202012Validator:
    """Draft 2020-12 validator with no format checker (``format`` is annotation only) and an empty
    registry, so a non-local ``$ref`` fails instead of being fetched over the network."""
    Draft202012Validator.check_schema(schema)
    return Draft202012Validator(schema, registry=Registry())


def _is_at_or_below(path: str, ancestor: str) -> bool:
    return path == ancestor or path.startswith(ancestor + "/")


def _utf16(s: str) -> bytes:
    # Sort by UTF-16 code units to match JavaScript string comparison.
    return s.encode("utf-16-be", "surrogatepass")


def normalize_errors(errors: Iterable[SchemaError]) -> list[SchemaError]:
    """Normalization contract shared with ``normalizeErrors`` in TS: drop every error at or below
    the instance path of a ``oneOf`` error, except ``oneOf`` errors with no ``oneOf`` error strictly
    above them; de-duplicate; sort by UTF-16 code units of (instance path, keyword)."""
    items = list(errors)
    one_of_paths = [e.instance_path for e in items if e.keyword == "oneOf"]
    kept: set[SchemaError] = set()
    for e in items:
        covering = [p for p in one_of_paths if _is_at_or_below(e.instance_path, p)]
        if not covering or (e.keyword == "oneOf" and all(p == e.instance_path for p in covering)):
            kept.add(e)
    return sorted(kept, key=lambda e: (_utf16(e.instance_path), _utf16(e.keyword)))


def validate_with(validator: Draft202012Validator, instance: object) -> SchemaResult:
    # Top-level errors only; detail inside oneOf branches lives in error.context.
    errors = normalize_errors(
        SchemaError(json_pointer(e.absolute_path), str(e.validator))
        for e in validator.iter_errors(instance)
    )
    return SchemaResult(valid=not errors, errors=errors)


@cache
def _validator(schema_id: str) -> Draft202012Validator:
    if _SCHEMA_ID.fullmatch(schema_id) is None:
        raise ValueError(f"malformed schema id: {schema_id!r}")
    schema: dict[str, Any] = json.loads(
        (CONTRACTS_DIR / "schemas" / f"{schema_id}.schema.json").read_text(encoding="utf-8")
    )
    return build_validator(schema)


def validate_schema(schema_id: str, instance: object) -> SchemaResult:
    return validate_with(_validator(schema_id), instance)
