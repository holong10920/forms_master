"""Synthetic local draft adapter. No network, auth, admission or submission ledger."""

import argparse
import json
import sys
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any

from fb_contracts.jcs import canonical_json
from fb_contracts.schema import validate_schema
from fb_engine.core import IR, Cell, EngineError, Value, normalize, snapshot
from fb_store.clock import Clock, SystemClock, is_expired
from fb_store.migrations import apply_migrations
from fb_store.sqlite import check_item_size, open_database, transaction


def filter_draft(ir: IR, current: str, raw: IR) -> IR:
    fields = {f["id"]: f for f in ir["nodes"]}
    values: dict[str, Value] = {}
    for key, value in raw.items():
        if key not in fields:
            raise EngineError("UNKNOWN_FIELD")
        if fields[key]["type"] == "calculated":
            continue
        normalized = normalize(value, fields[key])
        if normalized is not None:
            values[key] = normalized
    view = snapshot(ir, {"current": current, "values": values})
    if current not in view["path"] or any(
        s["id"] == current and s["kind"] == "complete" for s in ir["steps"]
    ):
        raise EngineError("E-DRAFT-STEP")
    result: dict[str, Any] = {}
    for f in ir["nodes"]:
        if (
            f["id"] not in view["active"]
            or f["classification"] != "public"
            or f.get("persist") != "allowed"
            or f.get("submit") == "displayOnly"
            or f["type"] == "calculated"
        ):
            continue
        value = view["effective"].get(f["id"])
        if value is None:
            continue
        if f["type"] == "group":
            items: dict[str, dict[str, Cell]] = {}
            for item_id in value["order"]:
                items[item_id] = {
                    child["id"]: value["items"][item_id][child["id"]]
                    for child in f["fields"]
                    if child["classification"] == "public"
                    and child.get("persist") == "allowed"
                    and child.get("submit") != "displayOnly"
                    and child["type"] != "calculated"
                    and child["id"] in value["items"][item_id]
                }
            value = {"order": value["order"], "items": items}
        result[f["id"]] = value
    return result


class DraftStore:
    """Binding is selected by bootstrap; client values cannot change it."""

    def __init__(self, path: Path, ir: IR, release_id: str, revision: str, clock: Clock) -> None:
        self.conn = open_database(path)
        self.ir, self.release_id, self.revision, self.clock = ir, release_id, revision, clock
        apply_migrations(self.conn, Path(__file__).with_name("migrations"), clock=clock)

    def close(self) -> None:
        self.conn.close()

    def save(self, session_id: str, expected_version: int, current: str, values: IR) -> int:
        if expected_version < 0:
            raise ValueError("invalid draft version")
        now = self.clock.now().astimezone(UTC)
        document = {"current": current, "values": filter_draft(self.ir, current, values)}
        check_item_size(document)
        encoded = canonical_json(document).decode("utf-8")
        params = (
            self.ir["form"]["formId"],
            self.ir["form"]["siteId"],
            self.release_id,
            self.revision,
            expected_version + 1,
            (now + timedelta(hours=72)).isoformat(),
            encoded,
            session_id,
        )
        with transaction(self.conn) as tx:
            if expected_version == 0:
                tx.require_one(
                    "INSERT INTO s1_synthetic_drafts "
                    "(form_id,site_id,release_id,revision,version,expires_at,document,session_id) "
                    "VALUES (?,?,?,?,?,?,?,?) ON CONFLICT DO NOTHING",
                    params,
                )
            else:
                tx.require_one(
                    "UPDATE s1_synthetic_drafts SET form_id=?,site_id=?,release_id=?,revision=?,"
                    "version=?,expires_at=?,document=? WHERE session_id=? AND version=? "
                    "AND release_id=? AND revision=? AND expires_at>? AND form_id=? AND site_id=?",
                    (
                        *params,
                        expected_version,
                        self.release_id,
                        self.revision,
                        now.isoformat(),
                        self.ir["form"]["formId"],
                        self.ir["form"]["siteId"],
                    ),
                )
        return expected_version + 1

    def load(self, session_id: str) -> IR:
        row = self.conn.execute(
            "SELECT * FROM s1_synthetic_drafts WHERE session_id=?", (session_id,)
        ).fetchone()
        if row is None:
            return {"status": "missing"}
        if is_expired(datetime.fromisoformat(row["expires_at"]), self.clock.now()):
            return {"status": "expired"}
        if (
            row["release_id"] != self.release_id
            or row["revision"] != self.revision
            or row["form_id"] != self.ir["form"]["formId"]
            or row["site_id"] != self.ir["form"]["siteId"]
        ):
            return {"status": "incompatible"}
        document = json.loads(row["document"])
        document["values"] = filter_draft(self.ir, document["current"], document["values"])
        return {
            "status": "restored",
            "version": row["version"],
            "draft": {
                **document,
                "releaseId": self.release_id,
                "revision": self.revision,
                "expiresAt": datetime.fromisoformat(row["expires_at"]).timestamp() * 1000,
            },
        }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--ir", required=True, type=Path)
    parser.add_argument("--db", required=True, type=Path)
    parser.add_argument("--action", choices=("save", "load"), required=True)
    args = parser.parse_args()
    ir: IR = json.loads(args.ir.read_text())
    if not validate_schema("engine-ir/v1", ir).valid:
        raise ValueError("invalid trusted IR")
    request: IR = json.load(sys.stdin)
    store = DraftStore(args.db, ir, "synthetic-release-1", "synthetic-revision-1", SystemClock())
    try:
        if args.action == "save":
            result = {
                "version": store.save(
                    "synthetic-session",
                    request["expectedVersion"],
                    request["current"],
                    request["values"],
                )
            }
        else:
            result = store.load("synthetic-session")
        print(json.dumps(result))
    finally:
        store.close()


if __name__ == "__main__":
    main()
