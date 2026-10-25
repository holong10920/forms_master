import hashlib
import json
from typing import Any

import pytest

from fb_contracts.jcs import JcsError, canonical_json

from .fixtures import read_fixture

CASES: list[dict[str, Any]] = read_fixture("jcs/cases.json")["cases"]


def test_fixture_file_has_cases() -> None:
    assert len(CASES) == 16


@pytest.mark.parametrize("case", CASES, ids=[c["name"] for c in CASES])
def test_jcs_parity_fixture(case: dict[str, Any]) -> None:
    value = json.loads(case["input"])
    if "error" in case:
        with pytest.raises(JcsError) as excinfo:
            canonical_json(value)
        assert excinfo.value.code == case["error"]
        return
    out = canonical_json(value)
    assert out == case["canonical"].encode("utf-8")
    assert hashlib.sha256(out).hexdigest() == case["sha256"]


@pytest.mark.parametrize(
    "value",
    [float("nan"), float("inf"), {1: "non-string key"}, (1, 2), {"a": {1, 2}}, b"bytes"],
    ids=["nan", "inf", "int-key", "tuple", "set", "bytes"],
)
def test_jcs_rejects_non_json_values(value: object) -> None:
    with pytest.raises(JcsError):
        canonical_json(value)
