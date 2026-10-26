"""OS-owner CLI-only local candidate publication; not canonical release activation."""

import argparse
import hashlib
import json
import os
from pathlib import Path
from typing import Any

from fb_store.fsstore import FsReleaseObjectStore
from fb_store.migrations import apply_migrations
from fb_store.sqlite import open_database, transaction

from .server_adapter import candidate

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "var/s2-publication"


class LocalPublisher:
    def __init__(self, data: Path) -> None:
        data.mkdir(parents=True, exist_ok=True)
        self.data = data
        self.objects = FsReleaseObjectStore(data / "objects")
        self.conn = open_database(data / "active.sqlite3")
        apply_migrations(self.conn, Path(__file__).with_name("migrations"))

    def close(self) -> None:
        self.conn.close()

    def authorize(self, actor_uid: int) -> None:
        if actor_uid != os.getuid() or actor_uid != ROOT.stat().st_uid:
            raise PermissionError("E-LOCAL-OWNER-REQUIRED")

    def publish(self, path: Path, expected: int, actor_uid: int) -> dict[str, Any]:
        self.authorize(actor_uid)
        manifest, _, _ = candidate(path)
        if "previewProjection" in manifest["inputs"]:
            raise ValueError("PREVIEW_ONLY")
        private = path.parent.parent / "private" / path.name
        integrity = json.loads((private / "local-integrity.json").read_text())
        if (
            integrity["indexHtmlDigest"]
            != hashlib.sha256((path / "index.html").read_bytes()).hexdigest()
        ):
            raise ValueError("E-INDEX-INTEGRITY")
        # Keep the local dev namespace separate. A canonical REL activation still needs K13.
        if not (
            (path.name.startswith("dev_") and manifest.get("localCandidateFormat") == 1)
            or (path.name.startswith("rel_") and manifest.get("lrmFormat") == 1)
        ):
            raise ValueError("E-NOT-LOCAL-CANDIDATE")
        for name in [a["path"] for a in manifest["inventory"]] + ["index.html"]:
            raw = (path / name).read_bytes()
            self.objects.put_write_once(
                f"releases/{path.name}/{name}", raw, hashlib.sha256(raw).hexdigest()
            )
        for p in private.iterdir():
            if p.name not in {
                "candidate-manifest.json",
                "data-contract.json",
                "chunk-manifest.json",
                "capability-lock.json",
                "block-lock.json",
                "local-integrity.json",
                "lrm.json",
                "chunk-plan.json",
                "semantic-fixtures.json",
                "attestation.json",
                "provenance.json",
            }:
                raise ValueError("E-UNEXPECTED-PRIVATE-FILE")
            raw = p.read_bytes()
            self.objects.put_write_once(
                f"releases/{path.name}/_private/{p.name}", raw, hashlib.sha256(raw).hexdigest()
            )
        with transaction(self.conn) as tx:
            tx.action(
                "INSERT INTO local_releases VALUES (?,?,?) ON CONFLICT DO NOTHING",
                (path.name, manifest["form"]["siteId"], manifest["form"]["formId"]),
            )
            self._pointer(
                tx, manifest["form"]["siteId"], manifest["form"]["formId"], path.name, expected
            )
            tx.action(
                "INSERT INTO local_publication_audit (action,candidate_id,actor) "
                "VALUES ('publish',?,'OS-owner')",
                (path.name,),
            )
        return {
            "candidateId": path.name,
            "version": expected + 1,
            "mode": "local-synthetic-candidate",
        }

    def _pointer(self, tx: Any, site: str, form: str, target: str, expected: int) -> None:
        if expected == 0:
            tx.require_one(
                "INSERT INTO local_active VALUES (?,?,?,1) ON CONFLICT DO NOTHING",
                (site, form, target),
            )
        else:
            tx.require_one(
                "UPDATE local_active SET candidate_id=?,version=version+1 "
                "WHERE site_id=? AND form_id=? AND version=?",
                (target, site, form, expected),
            )

    def rollback(
        self, site: str, form: str, target: str, expected: int, actor_uid: int
    ) -> dict[str, Any]:
        self.authorize(actor_uid)
        release = self.data / "objects/releases" / target
        manifest, _, _ = candidate(release)
        if manifest["form"]["siteId"] != site or manifest["form"]["formId"] != form:
            raise ValueError("E-ROLLBACK-SITE")
        # Read through the no-follow integrity port before changing the pointer.
        for asset in manifest["inventory"]:
            self.objects.read(f"releases/{target}/{asset['path']}")
        with transaction(self.conn) as tx:
            tx.check(
                "SELECT candidate_id FROM local_releases "
                "WHERE candidate_id=? AND site_id=? AND form_id=?",
                (target, site, form),
            )
            self._pointer(tx, site, form, target, expected)
            tx.action(
                "INSERT INTO local_publication_audit (action,candidate_id,actor) "
                "VALUES ('rollback',?,'OS-owner')",
                (target,),
            )
        return {"candidateId": target, "version": expected + 1, "mode": "local-synthetic-candidate"}

    def active(self, site: str, form: str) -> dict[str, Any]:
        row = self.conn.execute(
            "SELECT candidate_id,version FROM local_active WHERE site_id=? AND form_id=?",
            (site, form),
        ).fetchone()
        return {"candidateId": row[0], "version": row[1]} if row else {}


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("action", choices=("publish", "rollback", "active"))
    args = p.parse_args()
    request = json.loads(input())
    store = LocalPublisher(DATA)
    try:
        if args.action == "publish":
            result = store.publish(Path(request["path"]), request["expected"], os.getuid())
        elif args.action == "rollback":
            result = store.rollback(
                request["site"],
                request["form"],
                request["target"],
                request["expected"],
                os.getuid(),
            )
        else:
            result = store.active(request["site"], request["form"])
        print(json.dumps(result))
    finally:
        store.close()


if __name__ == "__main__":
    main()
