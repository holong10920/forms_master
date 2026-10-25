import json
from pathlib import Path
from typing import Any

CONTRACTS_DIR = Path(__file__).resolve().parents[3] / "contracts"


def read_fixture(relative_path: str) -> Any:
    return json.loads((CONTRACTS_DIR / "fixtures" / relative_path).read_text(encoding="utf-8"))
