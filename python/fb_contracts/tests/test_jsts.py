import json
from typing import Any

import pytest
from jsonschema import Draft202012Validator

from .fixtures import CONTRACTS_DIR

SUITE_DIR = CONTRACTS_DIR / "vendor/json-schema-test-suite"
SKIPS: list[dict[str, Any]] = json.loads((SUITE_DIR / "SKIPS.json").read_text(encoding="utf-8"))
FILES = sorted((SUITE_DIR / "tests/draft2020-12").glob("*.json"))


def _skipped(file: str, group: str, test: str) -> bool:
    return any(
        s["file"] == file and s["group"] == group and s["test"] in (None, test) for s in SKIPS
    )


def _cases() -> list[Any]:
    cases = []
    for path in FILES:
        for group in json.loads(path.read_text(encoding="utf-8")):
            for t in group["tests"]:
                marks = []
                if _skipped(path.name, group["description"], t["description"]):
                    marks.append(pytest.mark.skip(reason="listed in SKIPS.json"))
                cases.append(
                    pytest.param(
                        group["schema"],
                        t["data"],
                        t["valid"],
                        id=f"{path.name}::{group['description']}::{t['description']}",
                        marks=marks,
                    )
                )
    return cases


def test_subset_has_16_keyword_files() -> None:
    assert len(FILES) == 16


@pytest.mark.parametrize(("schema", "data", "valid"), _cases())
def test_json_schema_test_suite(schema: Any, data: Any, valid: bool) -> None:
    # Same validator settings as fb_contracts.schema (Draft 2020-12, no format checker).
    assert Draft202012Validator(schema).is_valid(data) is valid
