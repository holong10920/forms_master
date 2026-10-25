import json
from typing import Any

import pytest

from fb_contracts.digest import is_sha256_hex, jcs_sha256_hex, sha256_hex

from .fixtures import read_fixture

FIXTURE: dict[str, Any] = read_fixture("digest/sha256-hex.json")


@pytest.mark.parametrize("case", FIXTURE["rawDigests"])
def test_sha256_hex(case: dict[str, str]) -> None:
    assert sha256_hex(case["utf8"].encode("utf-8")) == case["sha256"]


@pytest.mark.parametrize("case", FIXTURE["isSha256Hex"])
def test_is_sha256_hex(case: dict[str, Any]) -> None:
    assert is_sha256_hex(case["s"]) is case["ok"]


@pytest.mark.parametrize("case", FIXTURE["jcsDigests"])
def test_jcs_sha256_hex(case: dict[str, str]) -> None:
    assert jcs_sha256_hex(json.loads(case["input"])) == case["sha256"]
