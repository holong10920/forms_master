"""Both evaluators consume independent expected values for every P0 operator."""

import ast
import json
from pathlib import Path
from typing import Any

import pytest

from fb_engine.core import evaluate

ROOT = Path(__file__).resolve().parents[3]
CASES: list[dict[str, Any]] = json.loads(
    (ROOT / "contracts/fixtures/engine/operators.json").read_text()
)["cases"]


@pytest.mark.parametrize("case", CASES, ids=[c["name"] for c in CASES])
def test_operator(case: dict[str, Any]) -> None:
    assert evaluate(case["expression"], lambda _: None, {}) == case["expected"]


def test_core_imports_are_pure() -> None:
    for path in (ROOT / "python/fb_engine/src/fb_engine").glob("*.py"):
        tree = ast.parse(path.read_text())
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                assert all(
                    n.name.split(".")[0] in {"math", "typing", "collections"} for n in node.names
                )
            if isinstance(node, ast.ImportFrom):
                assert (node.module or "").split(".")[0] in {
                    "math",
                    "typing",
                    "collections",
                    "fb_engine",
                    "fb_contracts",
                }
