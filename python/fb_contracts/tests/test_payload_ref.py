from typing import Any

import pytest

from fb_contracts.payload_ref import SemanticError, check_payload_ref

from .fixtures import read_fixture

CASES: list[dict[str, Any]] = read_fixture("semantic/payload-ref.json")["cases"]


def test_semantic_fixture_count() -> None:
    assert len(CASES) == 6


@pytest.mark.parametrize("case", CASES, ids=[c["name"] for c in CASES])
def test_payload_ref_semantics(case: dict[str, Any]) -> None:
    expected = [SemanticError(e["code"], e["path"]) for e in case["errors"]]
    assert check_payload_ref(case["ref"]) == expected
