from typing import Any

import pytest

from fb_contracts.schema import SchemaError, validate_schema

from .fixtures import CONTRACTS_DIR, read_fixture

FIXTURE_DIR = CONTRACTS_DIR / "fixtures/schema/payload-ref/v1"
FILES = sorted(
    f"schema/payload-ref/v1/{kind}/{p.name}"
    for kind in ("valid", "invalid")
    for p in (FIXTURE_DIR / kind).glob("*.json")
)


def test_fixture_count() -> None:
    assert len(FILES) == 9


@pytest.mark.parametrize("file", FILES)
def test_payload_ref_schema_fixture(file: str) -> None:
    fixture: dict[str, Any] = read_fixture(file)
    result = validate_schema("payload-ref/v1", fixture["instance"])
    expected = fixture["expected"]
    assert result.valid is expected["valid"]
    assert result.errors == [
        SchemaError(e["instancePath"], e["keyword"]) for e in expected["errors"]
    ]


@pytest.mark.parametrize(
    "schema_id", ["../x/v1", "payload-ref", "Payload-Ref/v1", "payload-ref/v1/.."]
)
def test_rejects_malformed_schema_ids(schema_id: str) -> None:
    with pytest.raises(ValueError):
        validate_schema(schema_id, {})
