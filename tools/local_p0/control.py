"""SQLite local P0 control plane. Membership is server-owned, gates are transactional."""

import hashlib
import json
import secrets
import sqlite3
import time
from contextlib import contextmanager
from pathlib import Path
from typing import Any

from tools.compiler.local_publish import LocalPublisher
from tools.local_p0.config import ROOT, enforce

from fb_contracts.jcs import canonical_json
from fb_store.errors import Conflict

DATA = ROOT / "var/s2-publication"
PLUGIN = "@platform/store-selector@1.0.0"
FBKS = [PLUGIN + "#storeList/server", PLUGIN + "#storeIdValid/server"]
EFFECT = "@platform/effect-mock-log#recordSubmission/server"
USERS = {
    "synthetic-editor": {"site_sports_synthetic": ["editor"], "site_pc_synthetic": ["editor"]},
    "synthetic-reviewer": {
        "site_sports_synthetic": ["reviewer"],
        "site_pc_synthetic": ["reviewer"],
    },
    "synthetic-publisher": {
        "site_sports_synthetic": ["publisher"],
        "site_pc_synthetic": ["publisher"],
    },
    "synthetic-other": {"site_other_synthetic": ["editor"]},
    "synthetic-security": {
        "site_sports_synthetic": ["security"],
        "site_pc_synthetic": ["security"],
    },
}


class Fault(Exception):
    def __init__(self, code: str, status: int = 409) -> None:
        self.code, self.status = code, status
        super().__init__(code)


def digest(value: Any) -> str:
    return hashlib.sha256(canonical_json(value)).hexdigest()


SCHEMA = """
CREATE TABLE IF NOT EXISTS memberships(user TEXT,site TEXT,roles TEXT,PRIMARY KEY(user,site));
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user TEXT,csrf TEXT,
 created REAL,seen REAL);
CREATE TABLE IF NOT EXISTS drafts(site TEXT,form TEXT,version INTEGER,definition TEXT,author TEXT,
 PRIMARY KEY(site,form));
CREATE TABLE IF NOT EXISTS reviews(id TEXT PRIMARY KEY,site TEXT,form TEXT,version INTEGER,
 definition TEXT,digest TEXT,author TEXT,approver TEXT,state TEXT,base INTEGER);
CREATE TABLE IF NOT EXISTS previews(token TEXT PRIMARY KEY,session TEXT,site TEXT,form TEXT,
 version INTEGER,candidate TEXT,expires REAL);
CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY,at REAL,actor TEXT,site TEXT,
 form TEXT,action TEXT,target TEXT);
CREATE TABLE IF NOT EXISTS capabilities(prk TEXT PRIMARY KEY,version INTEGER,ledger TEXT,
 overrides TEXT,m3 INTEGER,fbks TEXT,ledger_seq INTEGER);
CREATE TABLE IF NOT EXISTS gates(key TEXT PRIMARY KEY,blockers TEXT);
CREATE TABLE IF NOT EXISTS gate_intents(prk TEXT PRIMARY KEY);
CREATE TABLE IF NOT EXISTS managed_releases(id TEXT PRIMARY KEY,site TEXT,form TEXT,review TEXT,
 fbks TEXT,at REAL);
CREATE TABLE IF NOT EXISTS submissions(id TEXT PRIMARY KEY,site TEXT,form TEXT,release TEXT,
 idem TEXT,hash TEXT,payload TEXT,receipt TEXT,UNIQUE(site,form,idem));
CREATE TABLE IF NOT EXISTS outbox(id TEXT PRIMARY KEY,submission TEXT UNIQUE,state TEXT);
CREATE TABLE IF NOT EXISTS mock_effects(id TEXT PRIMARY KEY,submission TEXT UNIQUE,at REAL);
"""


class Control:
    def __init__(self, data: Path = DATA) -> None:
        enforce()
        self.data = data
        for attempt in range(3):
            try:
                self.publisher = LocalPublisher(data)
                break
            except (sqlite3.OperationalError, Conflict) as e:
                if attempt == 2 or (
                    not isinstance(e, Conflict)
                    and (getattr(e, "sqlite_errorcode", 0) & 255) not in (5, 6)
                ):
                    raise
                time.sleep(0.1 * (attempt + 1))
        self.conn = self.publisher.conn
        self.conn.execute("PRAGMA busy_timeout = 1500")
        self.conn.executescript(SCHEMA)
        for user, sites in USERS.items():
            for site, roles in sites.items():
                self.conn.execute(
                    "INSERT OR IGNORE INTO memberships VALUES (?,?,?)",
                    (user, site, json.dumps(roles)),
                )
        self.conn.execute("INSERT OR IGNORE INTO gates VALUES (?, '[]')", ("fbk:" + EFFECT,))

    def close(self) -> None:
        self.publisher.close()

    @contextmanager
    def atomic(self) -> Any:
        self.conn.execute("BEGIN IMMEDIATE")
        try:
            yield
            self.conn.execute("COMMIT")
        except BaseException:
            self.conn.execute("ROLLBACK")
            raise

    def audit(self, actor: str, site: str, form: str, action: str, target: str = "") -> None:
        self.conn.execute(
            "INSERT INTO audit(at,actor,site,form,action,target) VALUES (?,?,?,?,?,?)",
            (time.time(), actor, site, form, action, target),
        )

    def login(self, user: str) -> dict[str, Any]:
        if user not in USERS:
            raise Fault("FORBIDDEN", 403)
        token, csrf = secrets.token_urlsafe(32), secrets.token_urlsafe(32)
        self.conn.execute(
            "INSERT INTO sessions VALUES (?,?,?,?,?)",
            (digest(token), user, csrf, time.time(), time.time()),
        )
        return {"token": token, "csrf": csrf, "user": user}

    def actor(self, token: str, csrf: str | None = None) -> str:
        row = self.conn.execute("SELECT * FROM sessions WHERE token=?", (digest(token),)).fetchone()
        if not row or time.time() - row[3] > 28800 or time.time() - row[4] > 1800:
            raise Fault("UNAUTHORIZED", 401)
        if csrf is not None and not secrets.compare_digest(csrf, row[2]):
            raise Fault("CSRF", 403)
        self.conn.execute("UPDATE sessions SET seen=? WHERE token=?", (time.time(), digest(token)))
        return str(row[1])

    def permit(self, user: str, site: str, role: str | None = None) -> None:
        row = self.conn.execute(
            "SELECT roles FROM memberships WHERE user=? AND site=?", (user, site)
        ).fetchone()
        if not row or (role and role not in json.loads(row[0])):
            raise Fault("FORBIDDEN", 403)

    def head(self, site: str, form: str) -> int:
        return int(self.publisher.active(site, form).get("version", 0))

    def draft(self, user: str, site: str, form: str) -> dict[str, Any]:
        self.permit(user, site)
        r = self.conn.execute(
            "SELECT version,definition FROM drafts WHERE site=? AND form=?", (site, form)
        ).fetchone()
        if not r:
            raise Fault("NOT_FOUND", 404)
        return {"version": r[0], "definition": json.loads(r[1])}

    def save(
        self, user: str, site: str, form: str, expected: int, definition: dict[str, Any]
    ) -> dict[str, Any]:
        self.permit(user, site, "editor")
        if definition.get("siteId") != site or definition.get("formId") != form:
            raise Fault("FORM_SCOPE", 403)
        if len(canonical_json(definition)) > 2_000_000:
            raise Fault("DEFINITION_TOO_LARGE", 413)
        with self.atomic():
            if expected == 0:
                q = self.conn.execute(
                    "INSERT OR IGNORE INTO drafts VALUES (?,?,1,?,?)",
                    (site, form, json.dumps(definition), user),
                )
            else:
                q = self.conn.execute(
                    "UPDATE drafts SET definition=?,version=version+1,author=? "
                    "WHERE site=? AND form=? AND version=?",
                    (json.dumps(definition), user, site, form, expected),
                )
            if q.rowcount != 1:
                raise Fault("VERSION_CONFLICT")
            self.conn.execute("DELETE FROM previews WHERE site=? AND form=?", (site, form))
            self.audit(user, site, form, "draft.save", str(expected + 1))
        return self.draft(user, site, form)

    def policy(self) -> dict[str, Any]:
        r = self.conn.execute(
            "SELECT version,ledger,overrides,m3,fbks,ledger_seq FROM capabilities WHERE prk=?",
            (PLUGIN,),
        ).fetchone()
        if not r:
            raise Fault("E-ADMISSION-UNAVAILABLE", 503)
        return {
            "version": r[0],
            "ledger": r[1],
            "overrides": json.loads(r[2]),
            "m3": bool(r[3]),
            "fbks": json.loads(r[4]),
            "seq": r[5],
        }

    def derive(self, p: dict[str, Any]) -> list[str]:
        return sorted(
            set(
                (["ledger:" + p["ledger"]] if p["ledger"] in ["vulnerable", "revoked"] else [])
                + (["M3"] if p["m3"] else [])
                + ["override:" + k for k, v in p["overrides"].items() if v]
            )
        )

    def ingest(self) -> None:
        # Local trusted 1.0.0 manifest only. Missing existing projections are repaired fail-closed.
        r = self.conn.execute("SELECT 1 FROM capabilities WHERE prk=?", (PLUGIN,)).fetchone()
        if r:
            p = self.policy()
            for fbk in p["fbks"]:
                if not self.conn.execute(
                    "SELECT 1 FROM gates WHERE key=?", ("fbk:" + fbk,)
                ).fetchone():
                    raise Fault("E-ADMISSION-UNAVAILABLE", 503)
            return
        if any(
            self.conn.execute("SELECT 1 FROM gates WHERE key=?", ("fbk:" + f,)).fetchone()
            for f in FBKS
        ):
            raise Fault("E-ADMISSION-UNAVAILABLE", 503)
        self.conn.execute(
            "INSERT INTO capabilities VALUES (?,?,?,?,?,?,?)",
            (PLUGIN, 1, "active", "{}", 0, json.dumps(FBKS), 1),
        )
        for fbk in FBKS:
            self.conn.execute("INSERT INTO gates VALUES (?, '[]')", ("fbk:" + fbk,))

    def repair_policy(self, user: str, site: str, expected: int) -> dict[str, Any]:
        self.permit(user, site, "security")
        with self.atomic():
            p = self.policy()
            if p["version"] != expected:
                raise Fault("VERSION_CONFLICT")
            self.conn.execute("INSERT OR IGNORE INTO gate_intents VALUES (?)", (PLUGIN,))
            self.conn.execute(
                "UPDATE capabilities SET version=version+1 WHERE prk=? AND version=?",
                (PLUGIN, expected),
            )
            for fbk in p["fbks"]:
                self.conn.execute(
                    "INSERT INTO gates VALUES (?,?) ON CONFLICT(key) "
                    "DO UPDATE SET blockers=excluded.blockers",
                    ("fbk:" + fbk, json.dumps(self.derive(p))),
                )
            self.conn.execute("DELETE FROM gate_intents WHERE prk=?", (PLUGIN,))
            self.audit(user, site, "", "policy.repair")
        return self.policy()

    def change_policy(
        self,
        user: str,
        site: str,
        expected: int,
        source: str,
        value: Any,
        key: str = "local-incident",
    ) -> dict[str, Any]:
        self.permit(user, site, "security")
        with self.atomic():
            if not self.conn.execute(
                "SELECT 1 FROM capabilities WHERE prk=?", (PLUGIN,)
            ).fetchone():
                raise Fault("CAPABILITY_NOT_INGESTED", 404)
            p = self.policy()
            if p["version"] != expected:
                raise Fault("VERSION_CONFLICT")
            if source == "ledger":
                if value not in ["active", "deprecated", "vulnerable", "revoked"]:
                    raise Fault("POLICY_VALUE", 400)
                p["ledger"], p["seq"] = value, p["seq"] + 1
            elif source == "m3":
                p["m3"] = bool(value)
            elif source == "override":
                p["overrides"][key] = bool(value)
            else:
                raise Fault("POLICY_SOURCE", 400)
            self.conn.execute(
                "UPDATE capabilities SET version=version+1,ledger=?,overrides=?,m3=?,ledger_seq=? "
                "WHERE prk=? AND version=?",
                (p["ledger"], json.dumps(p["overrides"]), int(p["m3"]), p["seq"], PLUGIN, expected),
            )
            for fbk in p["fbks"]:
                q = self.conn.execute(
                    "UPDATE gates SET blockers=? WHERE key=?",
                    (json.dumps(self.derive(p)), "fbk:" + fbk),
                )
                if q.rowcount != 1:
                    raise Fault("E-ADMISSION-UNAVAILABLE", 503)
            self.audit(user, site, "", "policy." + source)
        return self.policy()

    def gate(self, key: str) -> None:
        row = self.conn.execute("SELECT blockers FROM gates WHERE key=?", (key,)).fetchone()
        if not row:
            raise Fault("E-ADMISSION-UNAVAILABLE", 503)
        if json.loads(row[0]):
            raise Fault("E-CAPABILITY-BLOCKED", 423)

    def check(self, site: str, form: str, release: str, fbks: list[str]) -> None:
        if self.conn.execute("SELECT 1 FROM gate_intents LIMIT 1").fetchone():
            raise Fault("E-ADMISSION-UNAVAILABLE", 503)
        for key in ["form:" + site + ":" + form, "release:" + release, *["fbk:" + f for f in fbks]]:
            self.gate(key)

    def review(self, user: str, site: str, form: str, version: int) -> dict[str, Any]:
        self.permit(user, site, "editor")
        with self.atomic():
            d = self.draft(user, site, form)
            if d["version"] != version:
                raise Fault("VERSION_CONFLICT")
            if d["definition"].get("dependencies"):
                self.ingest()
                if self.derive(self.policy()):
                    raise Fault("REVIEW_RECHECK_REQUIRED")
            rid = "review_" + secrets.token_hex(12)
            self.conn.execute(
                "INSERT INTO reviews VALUES (?,?,?,?,?,?,?,?,?,?)",
                (
                    rid,
                    site,
                    form,
                    version,
                    json.dumps(d["definition"]),
                    digest(d["definition"]),
                    user,
                    "",
                    "OPEN",
                    self.head(site, form),
                ),
            )
            self.audit(user, site, form, "review.open", rid)
        return {"id": rid, "state": "OPEN"}

    def review_row(self, user: str, rid: str) -> dict[str, Any]:
        row = self.conn.execute("SELECT * FROM reviews WHERE id=?", (rid,)).fetchone()
        if not row:
            raise Fault("NOT_FOUND", 404)
        self.permit(user, row[1])
        keys = [
            "id",
            "site",
            "form",
            "version",
            "definition",
            "digest",
            "author",
            "approver",
            "state",
            "base",
        ]
        r = dict(zip(keys, row, strict=True))
        r["definition"] = json.loads(r["definition"])
        if r["state"] in ("OPEN", "APPROVED") and r["base"] != self.head(r["site"], r["form"]):
            self.conn.execute("UPDATE reviews SET state='STALE' WHERE id=?", (rid,))
            r["state"] = "STALE"
        return r

    def approve(self, user: str, rid: str, ack: bool) -> dict[str, Any]:
        with self.atomic():
            r = self.review_row(user, rid)
            self.permit(user, r["site"], "reviewer")
            if r["author"] == user or not ack:
                raise Fault("FORBIDDEN", 403)
            if r["state"] != "OPEN":
                raise Fault("REVIEW_STALE")
            if r["definition"].get("dependencies") and self.derive(self.policy()):
                raise Fault("REVIEW_RECHECK_REQUIRED")
            self.conn.execute(
                "UPDATE reviews SET state='APPROVED',approver=? WHERE id=?", (user, rid)
            )
            self.audit(user, r["site"], r["form"], "review.approve", rid)
        return self.review_row(user, rid)

    def activate(
        self, user: str, rid: str, candidate_id: str, snapshot_hash: str
    ) -> dict[str, Any]:
        from tools.compiler.server_adapter import candidate

        r = self.review_row(user, rid)
        self.permit(user, r["site"], "publisher")
        if r["digest"] != snapshot_hash or r["state"] != "APPROVED":
            raise Fault("REVIEW_STALE")
        path = ROOT / "var/s2-candidates/r" / candidate_id
        manifest, _, lock = candidate(path)
        if (
            manifest["form"]["siteId"] != r["site"]
            or manifest["form"]["formId"] != r["form"]
            or manifest["inputs"]["definition"] != "sha256:" + snapshot_hash
        ):
            raise Fault("RELEASE_SCOPE", 403)
        # Immutable copy may leave harmless orphan objects on CAS failure; pointer stays atomic.
        private = path.parent.parent / "private" / candidate_id
        for name in [a["path"] for a in manifest["inventory"]] + ["index.html"]:
            raw = (path / name).read_bytes()
            self.publisher.objects.put_write_once(
                f"releases/{candidate_id}/{name}", raw, hashlib.sha256(raw).hexdigest()
            )
        for name in [
            "candidate-manifest.json",
            "data-contract.json",
            "chunk-manifest.json",
            "capability-lock.json",
            "local-integrity.json",
        ]:
            raw = (private / name).read_bytes()
            self.publisher.objects.put_write_once(
                f"releases/{candidate_id}/_private/{name}", raw, hashlib.sha256(raw).hexdigest()
            )
        fbks = FBKS if lock["bindings"] else []
        with self.atomic():
            r = self.review_row(user, rid)
            if r["state"] != "APPROVED" or r["base"] != self.head(r["site"], r["form"]):
                raise Fault("POINTER_CHANGED")
            if fbks:
                self.ingest()
                if self.derive(self.policy()):
                    raise Fault("REVIEW_RECHECK_REQUIRED")
            for key in ["form:" + r["site"] + ":" + r["form"], "release:" + candidate_id]:
                self.conn.execute("INSERT OR IGNORE INTO gates VALUES (?, '[]')", (key,))
            self.check(r["site"], r["form"], candidate_id, [*fbks, EFFECT])
            self.conn.execute(
                "INSERT OR IGNORE INTO local_releases VALUES (?,?,?)",
                (candidate_id, r["site"], r["form"]),
            )
            self.conn.execute(
                "INSERT OR IGNORE INTO managed_releases VALUES (?,?,?,?,?,?)",
                (candidate_id, r["site"], r["form"], rid, json.dumps([*fbks, EFFECT]), time.time()),
            )
            self.pointer(r["site"], r["form"], candidate_id, r["base"])
            self.conn.execute("UPDATE reviews SET state='PUBLISHED' WHERE id=?", (rid,))
            self.audit(user, r["site"], r["form"], "release.activate", candidate_id)
        return {"candidateId": candidate_id, "version": r["base"] + 1}

    def pointer(self, site: str, form: str, release: str, expected: int) -> None:
        if expected == 0:
            q = self.conn.execute(
                "INSERT OR IGNORE INTO local_active VALUES (?,?,?,1)", (site, form, release)
            )
        else:
            q = self.conn.execute(
                "UPDATE local_active SET candidate_id=?,version=version+1 "
                "WHERE site_id=? AND form_id=? AND version=?",
                (release, site, form, expected),
            )
        if q.rowcount != 1:
            raise Fault("POINTER_CHANGED")

    def rollback(
        self, user: str, site: str, form: str, release: str, expected: int
    ) -> dict[str, Any]:
        from tools.compiler.server_adapter import candidate

        self.permit(user, site, "publisher")
        row = self.conn.execute(
            "SELECT fbks FROM managed_releases WHERE id=? AND site=? AND form=?",
            (release, site, form),
        ).fetchone()
        if not row:
            raise Fault("ROLLBACK_TARGET_INELIGIBLE")
        candidate(self.data / "objects/releases" / release)
        with self.atomic():
            self.check(site, form, release, json.loads(row[0]))
            self.pointer(site, form, release, expected)
            self.audit(user, site, form, "release.rollback", release)
        return {"candidateId": release, "version": expected + 1}

    def admission(self, release: str) -> tuple[str, str, list[str]] | None:
        row = self.conn.execute(
            "SELECT site,form,fbks FROM managed_releases WHERE id=?", (release,)
        ).fetchone()
        if not row:
            return None
        fbks = json.loads(row[2])
        self.check(row[0], row[1], release, fbks)
        return row[0], row[1], fbks

    def replay(self, release: str, request: dict[str, Any]) -> dict[str, Any] | None:
        row = self.conn.execute(
            "SELECT site,form FROM managed_releases WHERE id=?", (release,)
        ).fetchone()
        if not row or not isinstance(request.get("idempotencyKey"), str):
            return None
        old = self.conn.execute(
            "SELECT hash,receipt FROM submissions WHERE site=? AND form=? AND idem=?",
            (row[0], row[1], request["idempotencyKey"]),
        ).fetchone()
        if old:
            if old[0] != digest({"release": release, "values": request["payload"]}):
                raise Fault("IDEMPOTENCY_KEY_REUSED")
            result: dict[str, Any] = json.loads(old[1])
            return result
        return None

    def submit(
        self, release: str, request: dict[str, Any], payload: dict[str, Any]
    ) -> dict[str, Any]:
        with self.atomic():
            replay = self.replay(release, request)
            if replay is not None:
                return replay
            admission = self.admission(release)
            if admission is None:
                raise Fault("E-ADMISSION-UNAVAILABLE", 503)
            site, form, _ = admission
            h = digest({"release": release, "values": request["payload"]})
            old = self.conn.execute(
                "SELECT hash,receipt FROM submissions WHERE site=? AND form=? AND idem=?",
                (site, form, request["idempotencyKey"]),
            ).fetchone()
            if old:
                if old[0] != h:
                    raise Fault("IDEMPOTENCY_KEY_REUSED")
                result: dict[str, Any] = json.loads(old[1])
                return result
            sid = "synthetic_" + secrets.token_hex(12)
            receipt = {"ok": True, "receipt": sid, "synthetic": True}
            self.conn.execute(
                "INSERT INTO submissions VALUES (?,?,?,?,?,?,?,?)",
                (
                    sid,
                    site,
                    form,
                    release,
                    request["idempotencyKey"],
                    h,
                    json.dumps(payload),
                    json.dumps(receipt),
                ),
            )
            self.conn.execute("INSERT INTO outbox VALUES (?,?,'PENDING')", (sid, sid))
        return receipt

    def worker(self) -> dict[str, Any]:
        enforce()
        done = 0
        with self.atomic():
            for (sid,) in self.conn.execute(
                "SELECT id FROM outbox WHERE state='PENDING'"
            ).fetchall():
                r = self.conn.execute(
                    "SELECT site,form,release FROM submissions WHERE id=?", (sid,)
                ).fetchone()
                self.admission(r[2])
                self.conn.execute(
                    "INSERT OR IGNORE INTO mock_effects VALUES (?,?,?)", (sid, sid, time.time())
                )
                self.conn.execute("UPDATE outbox SET state='DONE' WHERE id=?", (sid,))
                done += 1
        return {"mockEffects": done}
