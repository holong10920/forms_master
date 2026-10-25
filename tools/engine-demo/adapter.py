"""Local synthetic IPC adapter. Trusted IR is selected by --ir, never client request data."""

import argparse
import json
import sys
from pathlib import Path
from typing import Any

from fb_contracts.schema import validate_schema
from fb_engine.core import evaluate_case, evaluate_submission


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--ir", required=True, type=Path)
    parser.add_argument("--submission", action="store_true")
    args = parser.parse_args()
    ir: dict[str, Any] = json.loads(args.ir.read_text())
    if not validate_schema("engine-ir/v1", ir).valid:
        raise ValueError("invalid trusted fixture IR")
    if args.submission:
        print(json.dumps(evaluate_submission(ir, json.load(sys.stdin)), ensure_ascii=True))
    else:
        cases: list[dict[str, Any]] = json.load(sys.stdin)
        print(json.dumps([evaluate_case(ir, case) for case in cases], ensure_ascii=True))


if __name__ == "__main__":
    main()
