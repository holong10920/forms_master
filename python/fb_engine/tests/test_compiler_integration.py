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


def test_control_publication_is_atomic_pinned_and_idempotent(
    built: dict[str, Any], tmp_path: Path
) -> None:
    from tools.local_p0.control import Control, Fault, digest

    c = Control(tmp_path / "control", Path(built["sports"]["directory"]).parent)
    try:
        definition = json.loads((ROOT / "contracts/fixtures/engine/sports.json").read_text())
        site, form = definition["siteId"], definition["formId"]
        c.save("synthetic-editor", site, form, 0, definition)
        rid = c.review("synthetic-editor", site, form, 1)["id"]
        c.approve("synthetic-reviewer", rid, True)
        op = c.begin_publication("synthetic-publisher", rid)
        cid = built["sports"]["candidateId"]
        op = c.publication_built("synthetic-publisher", op["id"], op["fence"], cid)
        result = c.activate(
            "synthetic-publisher", rid, cid, digest(definition), op["id"], op["fence"]
        )
        assert result["version"] == 1 and c.publisher.active(site, form)["candidateId"] == cid
        assert c.operation("synthetic-publisher", op["id"])["state"] == "ACTIVATED"
        assert c.review_row("synthetic-reviewer", rid)["state"] == "PUBLISHED"
        assert (
            c.activate("synthetic-publisher", rid, cid, digest(definition), op["id"], op["fence"])
            == result
        )
        assert c.publisher.active(site, form)["version"] == 1
        with pytest.raises(Fault, match="OPERATION_SCOPE"):
            c.activate("synthetic-publisher", rid, cid, "wrong-snapshot", op["id"], op["fence"])
    finally:
        c.close()


def test_control_cancel_during_copy_fences_activation(
    built: dict[str, Any], tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    from tools.local_p0.control import Control, Fault, digest

    c = Control(tmp_path / "control", Path(built["sports"]["directory"]).parent)
    try:
        definition = json.loads((ROOT / "contracts/fixtures/engine/sports.json").read_text())
        site, form = definition["siteId"], definition["formId"]
        c.save("synthetic-editor", site, form, 0, definition)
        rid = c.review("synthetic-editor", site, form, 1)["id"]
        c.approve("synthetic-reviewer", rid, True)
        op = c.begin_publication("synthetic-publisher", rid)
        cid = built["sports"]["candidateId"]
        op = c.publication_built("synthetic-publisher", op["id"], op["fence"], cid)
        real = c.publisher.objects.put_write_once
        cancelled = False

        def copy(key: str, raw: bytes, checksum: str) -> Any:
            nonlocal cancelled
            result = real(key, raw, checksum)
            if not cancelled:
                cancelled = True
                c.finish_failed("synthetic-publisher", op["id"], "CANCELLED_BY_USER", True)
            return result

        monkeypatch.setattr(c.publisher.objects, "put_write_once", copy)
        with pytest.raises(Fault, match="OPERATION_FENCED"):
            c.activate("synthetic-publisher", rid, cid, digest(definition), op["id"], op["fence"])
        assert not c.publisher.active(site, form)
        assert c.operation("synthetic-publisher", op["id"])["state"] == "CANCELLED"
        assert c.review_row("synthetic-reviewer", rid)["state"] == "APPROVED"
    finally:
        c.close()


def test_review_preview_checks_pinned_lock_not_mutated_draft(
    built: dict[str, Any], tmp_path: Path
) -> None:
    from tools.local_p0.control import Control, Fault, digest
    from tools.local_p0.rpc import run

    c = Control(tmp_path / "control", Path(built["pc-plugin"]["directory"]).parent)
    try:
        d = json.loads((ROOT / "contracts/fixtures/engine/pc-plugin.json").read_text())
        site, form = d["siteId"], d["formId"]
        c.save("synthetic-editor", site, form, 0, d)
        rid = c.review("synthetic-editor", site, form, 1)["id"]
        later = json.loads(json.dumps(d))
        later.pop("dependencies")
        store = next(f for f in later["fields"] if f["id"] == "fld_store")
        store["type"] = "text"
        store["classification"] = "personal"
        c.save("synthetic-editor", site, form, 1, later)
        s = c.login("synthetic-reviewer")
        preview = run(
            c,
            "preview.register",
            {
                "site": site,
                "form": form,
                "id": rid,
                "version": 1,
                "candidateId": built["pc-plugin"]["candidateId"],
                "snapshotHash": digest(d),
            },
            s["token"],
            s["csrf"],
        )
        assert run(c, "preview.status", preview, s["token"], s["csrf"]) == {"active": True}
        other = c.login("synthetic-publisher")
        with pytest.raises(Fault, match="PREVIEW_SESSION_EXPIRED"):
            run(c, "preview.status", preview, other["token"], other["csrf"])
        c.change_policy("synthetic-security", site, c.policy()["version"], "override", True)
        with pytest.raises(Fault, match="E-CAPABILITY-BLOCKED"):
            run(c, "preview.check", {}, preview["previewSessionId"], "")
        assert run(c, "preview.status", preview, s["token"], s["csrf"]) == {
            "active": False,
            "code": "E-CAPABILITY-BLOCKED",
        }
        with pytest.raises(Fault, match="PREVIEW_SESSION_EXPIRED"):
            run(c, "preview.check", {}, preview["previewSessionId"], "")
    finally:
        c.close()
