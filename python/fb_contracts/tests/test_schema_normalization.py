from typing import Any

import pytest
from referencing.exceptions import Unresolvable

from fb_contracts.schema import (
    CONTRACTS_DIR,
    SchemaError,
    build_validator,
    validate_schema,
    validate_with,
)

from .fixtures import read_fixture

CASES: list[dict[str, Any]] = read_fixture("schema-normalization/cases.json")["cases"]
SCHEMA_IDS = sorted(
    str(p.relative_to(CONTRACTS_DIR / "schemas")).removesuffix(".schema.json")
    for p in (CONTRACTS_DIR / "schemas").glob("*/v*.schema.json")
)


def test_normalization_fixture_count() -> None:
    assert len(CASES) == 7


@pytest.mark.parametrize("case", CASES, ids=[c["name"] for c in CASES])
def test_normalization_parity(case: dict[str, Any]) -> None:
    result = validate_with(build_validator(case["schema"]), case["instance"])
    expected = [SchemaError(e["instancePath"], e["keyword"]) for e in case["expected"]]
    assert result.valid is (not expected)
    assert result.errors == expected


@pytest.mark.parametrize("schema_id", SCHEMA_IDS)
def test_canonical_schema_compiles(schema_id: str) -> None:
    validate_schema(schema_id, None)


def test_remote_ref_is_not_fetched() -> None:
    validator = build_validator(
        {"$ref": "https://schemas.forms-poc.invalid/payload-ref/v1.schema.json"}
    )
    with pytest.raises(Unresolvable):
        validator.is_valid({})
