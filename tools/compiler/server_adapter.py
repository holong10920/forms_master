"""Local synthetic read/validation authority; no business writes or external network."""

import argparse
import base64
import hashlib
import importlib.util
import json
import re
import sys
from pathlib import Path
from typing import Any

from fb_contracts.jcs import canonical_json
from fb_engine.core import evaluate_submission

ROOT = Path(__file__).resolve().parents[2]


def candidate(path: Path) -> tuple[dict[str, Any], dict[str, Any], dict[str, Any]]:
    metadata = (
        path / "_private"
        if (path / "_private").is_dir()
        else path.parent.parent / "private" / path.name
    )
    raw = (metadata / "candidate-manifest.json").read_bytes()
    manifest: dict[str, Any] = json.loads(raw)
    ident = (
        "dev_"
        + base64.b32encode(hashlib.sha256(canonical_json(manifest)).digest()).decode().lower()[:26]
    )
    if ident != path.name:
        raise ValueError("E-CANDIDATE-INTEGRITY")
    for asset in manifest["inventory"]:
        name = asset["path"]
        if not re.fullmatch(r"assets/[a-z0-9.-]+", name):
            raise ValueError("E-PATH")
        if "sha256:" + hashlib.sha256((path / name).read_bytes()).hexdigest() != asset["sha256"]:
            raise ValueError("E-ASSET-INTEGRITY")
    ir_asset = next(a for a in manifest["inventory"] if a["path"].startswith("assets/form-ir."))
    ir: dict[str, Any] = json.loads((path / ir_asset["path"]).read_bytes())
    lock: dict[str, Any] = json.loads((metadata / "capability-lock.json").read_text())
    if (
        manifest["inputs"]["capabilityLock"]
        != "sha256:" + hashlib.sha256(canonical_json(lock)).hexdigest()
    ):
        raise ValueError("E-LOCK-INTEGRITY")
    for filename, key in [
        ("data-contract.json", "dataContract"),
        ("chunk-manifest.json", "chunkManifest"),
    ]:
        if (
            manifest["inputs"][key]
            != "sha256:" + hashlib.sha256((metadata / filename).read_bytes()).hexdigest()
        ):
            raise ValueError("E-PRIVATE-INTEGRITY")
    seal = json.loads((metadata / "local-integrity.json").read_text())
    if (
        seal["manifestDigest"] != hashlib.sha256(canonical_json(manifest)).hexdigest()
        or seal["indexHtmlDigest"] != hashlib.sha256((path / "index.html").read_bytes()).hexdigest()
    ):
        raise ValueError("E-INDEX-INTEGRITY")
    return manifest, ir, lock


def execute(
    path: Path, action: str, request: dict[str, Any]
) -> dict[str, Any] | list[dict[str, str]]:
    from tools.local_p0.config import enforce
    from tools.local_p0.control import DATA, Control

    enforce()
    manifest, ir, lock = candidate(path)
    managed = path.parent.resolve() == (DATA / "objects/releases").resolve()
    if managed:
        control = Control()
        try:
            if action == "submit":
                replay = control.replay(path.name, request)
                if replay is not None:
                    return replay
            managed = control.admission(path.name) is not None
        finally:
            control.close()
    module = None
    if lock["bindings"]:
        source = ROOT / "plugins/store-selector/server/store_selector_server.py"
        wanted = "sha256:" + hashlib.sha256(source.read_bytes()).hexdigest()
        server = [b for b in lock["bindings"] if b["key"]["facet"] == "server"]
        if len(server) != 2 or any(
            b["sourceDigest"] != wanted or b["key"]["version"] != "1.0.0" for b in server
        ):
            raise ValueError("E-SERVER-ADAPTER-UNAVAILABLE")
        spec = importlib.util.spec_from_file_location("pinned_store_selector", source)
        if spec is None or spec.loader is None:
            raise ValueError("E-SERVER-ADAPTER-UNAVAILABLE")
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
    context = {"siteId": manifest["form"]["siteId"]}
    if action == "store-list":
        if module is None:
            raise ValueError("E-CAPABILITY-NOT-USED")
        rows: list[dict[str, str]] = module.query_store_list({}, context)
        return rows
    if set(request) != {"payload", "idempotencyKey"} or not isinstance(
        request["idempotencyKey"], str
    ):
        raise ValueError("E-REQUEST")
    payload = request["payload"]
    if (
        isinstance(payload, dict)
        and "store" in payload
        and (
            not isinstance(payload["store"], str)
            or not re.fullmatch(r"ST-[0-9]{4}", payload["store"])
        )
    ):
        return {
            "ok": False,
            "errors": [{"code": "storeNotAvailable", "path": "fld_store"}],
            "payload": {},
        }
    result = evaluate_submission(ir, payload)
    if (
        result["ok"]
        and "store" in result["payload"]
        and (
            module is None
            or not module.validate_store_id(result["payload"]["store"], {}, context)["ok"]
        )
    ):
        return {
            "ok": False,
            "errors": [{"code": "storeNotAvailable", "path": "fld_store"}],
            "payload": {},
        }
    if managed and action == "submit" and result["ok"]:
        control = Control()
        try:
            return control.submit(path.name, request, result["payload"])
        finally:
            control.close()
    return result


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--candidate", required=True, type=Path)
    p.add_argument("--action", choices=("store-list", "submit"), required=True)
    args = p.parse_args()
    from tools.local_p0.control import Fault

    try:
        print(json.dumps(execute(args.candidate, args.action, json.load(sys.stdin))))
    except Fault as e:
        print(
            json.dumps(
                {
                    "ok": False,
                    "httpStatus": e.status,
                    "errors": [{"code": e.code, "path": ""}],
                    "payload": {},
                }
            )
        )


if __name__ == "__main__":
    main()
