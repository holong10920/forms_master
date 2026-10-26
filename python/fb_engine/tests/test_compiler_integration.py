"""Compiler mock authority and local candidate publication security regressions."""

import json
import os
import subprocess
from pathlib import Path
from shutil import which
from typing import Any

import pytest
from tools.compiler.local_publish import LocalPublisher
from tools.compiler.server_adapter import execute

from fb_store.errors import ConditionFailed

ROOT = Path(__file__).resolve().parents[3]


@pytest.fixture(scope="module")
def built(tmp_path_factory: pytest.TempPathFactory) -> dict[str, Any]:
    out = tmp_path_factory.mktemp("compiled-local")
    script = """
import {compile} from "./tools/compiler/src/build.ts";
import {readFileSync} from "node:fs";
const out={};
for(const name of ["sports","pc-plugin"]){
 const d=JSON.parse(readFileSync(`contracts/fixtures/engine/${name}.json`,"utf8"));
 out[name]=await compile(d,process.argv[1]);
}
const d=JSON.parse(readFileSync("contracts/fixtures/engine/sports.json","utf8"));
d.fields.find(f=>f.id==="fld_email").required=true;
out.second=await compile(d,process.argv[1]);
console.log(JSON.stringify(out));
"""
    node = which("node")
    if node is None:
        raise RuntimeError("Node preflight required")
    result = subprocess.run(
        [node, "--input-type=module", "-e", script, str(out)],
        cwd=ROOT,
        check=True,
        capture_output=True,
        text=True,
        timeout=45,
    )
    value: dict[str, Any] = json.loads(result.stdout)
    return value


def test_pinned_store_authority_rejects_other_site_and_inactive_values(
    built: dict[str, Any],
) -> None:
    path = Path(built["pc-plugin"]["directory"])
    rows = execute(path, "store-list", {})
    assert isinstance(rows, list) and {r["id"] for r in rows} == {"ST-1001", "ST-1002"}
    payload = {
        "deviceType": "peripheral",
        "purchaseMethod": "store",
        "store": "ST-1001",
        "customerName": "Synthetic",
        "consent": True,
    }
    result = execute(path, "submit", {"payload": payload, "idempotencyKey": "synthetic-unit"})
    assert isinstance(result, dict) and result["ok"]
    payload["store"] = "ST-9001"
    result = execute(path, "submit", {"payload": payload, "idempotencyKey": "synthetic-unit"})
    assert isinstance(result, dict) and result["errors"][0]["code"] == "storeNotAvailable"
    with pytest.raises(ValueError, match="E-REQUEST"):
        execute(
            path,
            "submit",
            {
                "payload": payload,
                "idempotencyKey": "synthetic-unit",
                "siteId": "site_other_synthetic",
            },
        )
    payload["purchaseMethod"] = "takuhai"
    payload["packingKit"] = "yes"
    result = execute(path, "submit", {"payload": payload, "idempotencyKey": "synthetic-unit"})
    assert isinstance(result, dict) and result["errors"][0]["code"] == "E-INACTIVE-DATA-PRESENT"


def test_backend_facet_hash_mismatch_fails_closed(
    built: dict[str, Any], tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    import tools.compiler.server_adapter as adapter

    source = tmp_path / "plugins/store-selector/server/store_selector_server.py"
    source.parent.mkdir(parents=True)
    source.write_text("# mismatched adapter\n")
    monkeypatch.setattr(adapter, "ROOT", tmp_path)
    with pytest.raises(ValueError, match="E-SERVER-ADAPTER-UNAVAILABLE"):
        execute(Path(built["pc-plugin"]["directory"]), "store-list", {})


def test_publish_two_revisions_rollback_cas_owner_and_immutability(
    built: dict[str, Any], tmp_path: Path
) -> None:
    store = LocalPublisher(tmp_path / "publication")
    a, b = Path(built["sports"]["directory"]), Path(built["second"]["directory"])
    try:
        with pytest.raises(PermissionError):
            store.publish(a, 0, os.getuid() + 1)
        assert store.publish(a, 0, os.getuid())["version"] == 1
        assert store.publish(b, 1, os.getuid())["version"] == 2
        with pytest.raises(ConditionFailed):
            store.publish(a, 1, os.getuid())
        assert store.active("site_sports_synthetic", "frm_sports")["candidateId"] == b.name
        assert (
            store.rollback("site_sports_synthetic", "frm_sports", a.name, 2, os.getuid())["version"]
            == 3
        )
        assert store.active("site_sports_synthetic", "frm_sports")["candidateId"] == a.name
        assert store.conn.execute("SELECT COUNT(*) FROM local_publication_audit").fetchone()[0] == 3
        with pytest.raises(ValueError, match="E-ROLLBACK-SITE"):
            store.rollback("site_other", "frm_sports", a.name, 3, os.getuid())
        original = (a / "index.html").read_bytes()
        assert store.objects.read(f"releases/{a.name}/index.html") == original
        metadata = json.loads(
            (b.parent.parent / "private" / b.name / "candidate-manifest.json").read_text()
        )
        asset = metadata["inventory"][0]["path"]
        target = tmp_path / "publication/objects/releases" / b.name / asset
        target.chmod(0o600)
        target.write_bytes(b"tampered")
        with pytest.raises(ValueError, match="E-ASSET-INTEGRITY"):
            store.rollback("site_sports_synthetic", "frm_sports", b.name, 3, os.getuid())
        assert store.active("site_sports_synthetic", "frm_sports")["candidateId"] == a.name
    finally:
        store.close()
