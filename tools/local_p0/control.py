"""SQLite local P0 control plane. Membership is server-owned, gates are transactional."""

import hashlib
import json
import os
import secrets
import sqlite3
import time
from contextlib import contextmanager, nullcontext
from pathlib import Path
from typing import Any

from tools.compiler.local_publish import LocalPublisher
from tools.local_p0.config import ROOT, enforce

from fb_contracts.jcs import canonical_json
from fb_store.errors import Conflict
from fb_store.fsstore import FsBlobStore

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
    "synthetic-viewer": {"site_sports_synthetic": ["viewer"], "site_pc_synthetic": ["viewer"]},
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
CREATE TABLE IF NOT EXISTS key_ledger(site TEXT,form TEXT,path TEXT,identity TEXT,
 PRIMARY KEY(site,form,path));
CREATE TABLE IF NOT EXISTS identity_types(site TEXT,form TEXT,identity TEXT,type TEXT,
 PRIMARY KEY(site,form,identity));
CREATE TABLE IF NOT EXISTS block_status(pin TEXT PRIMARY KEY,digest TEXT,state TEXT,
 version INTEGER);
CREATE TABLE IF NOT EXISTS review_contracts(id TEXT PRIMARY KEY,document TEXT);
CREATE TABLE IF NOT EXISTS control_meta(key TEXT PRIMARY KEY);
CREATE TABLE IF NOT EXISTS trusted_ledger(prk TEXT PRIMARY KEY,seq INTEGER,state TEXT,
 commit_id TEXT);
CREATE TABLE IF NOT EXISTS deployments(id TEXT PRIMARY KEY,version INTEGER,adapters TEXT);
CREATE TABLE IF NOT EXISTS object_security(key TEXT PRIMARY KEY,version INTEGER,sources TEXT);
CREATE TABLE IF NOT EXISTS memberships(user TEXT,site TEXT,roles TEXT,PRIMARY KEY(user,site));
CREATE TABLE IF NOT EXISTS oidc_tokens(session TEXT PRIMARY KEY,envelope TEXT);
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user TEXT,csrf TEXT,
 created REAL,seen REAL);
CREATE TABLE IF NOT EXISTS form_meta(site TEXT,form TEXT,title TEXT,cloned_from TEXT,
 PRIMARY KEY(site,form));
CREATE TABLE IF NOT EXISTS drafts(site TEXT,form TEXT,version INTEGER,definition TEXT,author TEXT,
 PRIMARY KEY(site,form));
CREATE TABLE IF NOT EXISTS review_meta(id TEXT PRIMARY KEY,platform TEXT,stale_reason TEXT);
CREATE TABLE IF NOT EXISTS operations(id TEXT PRIMARY KEY,review TEXT,site TEXT,form TEXT,
 state TEXT,version INTEGER,candidate TEXT,error TEXT,updated REAL,base INTEGER,platform TEXT);
CREATE UNIQUE INDEX IF NOT EXISTS one_active_publication ON operations(review)
 WHERE state IN ('BUILDING','VERIFYING','ACTIVATING');
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
    def __init__(self, data: Path = DATA, candidates: Path = ROOT / "var/s2-candidates/r") -> None:
        enforce()
        self.data = data
        self.candidates = candidates
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
        self.blobs = FsBlobStore(data / "blobs")
        self.conn = self.publisher.conn
        self.conn.execute("PRAGMA busy_timeout = 1500")
        self.conn.executescript(SCHEMA)
        with self.atomic():
            new = self.conn.execute(
                "INSERT OR IGNORE INTO control_meta VALUES ('policy-v2')"
            ).rowcount
            if new:
                self.conn.execute(
                    "INSERT OR IGNORE INTO deployments VALUES ('current',1,?)",
                    (json.dumps([*FBKS, EFFECT]),),
                )
                self.conn.execute(
                    "INSERT OR IGNORE INTO trusted_ledger SELECT "
                    "prk,ledger_seq,ledger,'local-legacy-checkpoint' FROM capabilities"
                )
                self.conn.execute(
                    "INSERT OR IGNORE INTO object_security SELECT key,1,'{}' FROM gates "
                    "WHERE (key LIKE 'form:%' OR key LIKE 'release:%') AND blockers='[]'"
                )
        with self.atomic():
            if self.conn.execute(
                "INSERT OR IGNORE INTO control_meta VALUES ('form-availability-v1')"
            ).rowcount:
                for row in self.conn.execute("SELECT site,form FROM drafts").fetchall():
                    key = "form:" + row[0] + ":" + row[1]
                    if not self.conn.execute("SELECT 1 FROM gates WHERE key=?", (key,)).fetchone():
                        if (
                            self.head(row[0], row[1])
                            or self.conn.execute(
                                "SELECT 1 FROM object_security WHERE key=?", (key,)
                            ).fetchone()
                        ):
                            raise Fault("E-ADMISSION-UNAVAILABLE", 503)
                        self.conn.execute("INSERT INTO gates VALUES (?,'[]')", (key,))
                    self.conn.execute(
                        "INSERT OR IGNORE INTO object_security VALUES (?,1,'{}')", (key,)
                    )
        self.deployment()
        from .blocks import catalog

        for pin, entry in catalog().items():
            self.conn.execute(
                "INSERT OR IGNORE INTO block_status VALUES (?,?,'published',1)",
                (pin, entry["digest"]),
            )
        with self.atomic():
            if self.conn.execute(
                "INSERT OR IGNORE INTO control_meta VALUES ('key-ledger-v1')"
            ).rowcount:
                for row in self.conn.execute(
                    "SELECT site,form,definition FROM reviews WHERE state='PUBLISHED'"
                ).fetchall():
                    self._key_check(row[0], row[1], self._document(row[2]), reserve=True)
        for user, sites in USERS.items():
            for site, roles in sites.items():
                self.conn.execute(
                    "INSERT OR IGNORE INTO memberships VALUES (?,?,?)",
                    (user, site, json.dumps(roles)),
                )
        self.conn.execute("INSERT OR IGNORE INTO gates VALUES (?, '[]')", ("fbk:" + EFFECT,))

    def _document_ref(self, value: dict[str, Any]) -> str:
        raw = canonical_json(value)
        checksum = hashlib.sha256(raw).hexdigest()
        self.blobs.put_if_absent(checksum, raw)
        return json.dumps(
            {
                "snapshotRef": {
                    "blobKey": "sha256/" + checksum,
                    "sha256": checksum,
                    "size": len(raw),
                    "format": "jcs-json",
                }
            }
        )

    def _document(self, raw: str) -> dict[str, Any]:
        value: dict[str, Any] = json.loads(raw)
        if set(value) == {"snapshotRef"}:
            value = json.loads(self.blobs.get_verified(value["snapshotRef"]))
            if not isinstance(value, dict):
                raise Fault("E-SNAPSHOT-INTEGRITY", 503)
        return value

    def _block_policy(self, definition: dict[str, Any]) -> None:
        from .blocks import catalog

        entries = catalog() if definition.get("dependencies", {}).get("blocks") else {}
        for pin in definition.get("dependencies", {}).get("blocks", {}).values():
            row = self.conn.execute(
                "SELECT digest,state FROM block_status WHERE pin=?", (pin,)
            ).fetchone()
            if not row or pin not in entries or row[0] != entries[pin]["digest"]:
                raise Fault("E-BLOCK-UNAVAILABLE", 503)
            if row[1] == "vulnerable":
                raise Fault("E-BLOCK-VULNERABLE", 409)
            if row[1] not in ("published", "deprecated"):
                raise Fault("E-BLOCK-UNAVAILABLE", 503)

    def block_status(
        self, user: str, site: str, pin: str, expected: int, state: str
    ) -> dict[str, Any]:
        self.permit(user, site, "security")
        if state not in ("published", "deprecated", "vulnerable"):
            raise Fault("BLOCK_STATE", 400)
        with self.atomic():
            if (
                self.conn.execute(
                    "UPDATE block_status SET version=version+1,state=? WHERE pin=? AND version=?",
                    (state, pin, expected),
                ).rowcount
                != 1
            ):
                raise Fault("VERSION_CONFLICT")
            self.audit(user, site, "", "block.status", pin)
        return {"pin": pin, "state": state, "version": expected + 1}

    def _key_check(
        self, site: str, form: str, definition: dict[str, Any], reserve: bool = False
    ) -> list[dict[str, Any]]:
        from .blocks import contract

        fields = contract(definition)
        seen: set[str] = set()
        for f in fields:
            if f["path"] in seen:
                raise Fault("KEY_COLLISION")
            seen.add(f["path"])
            prior = self.conn.execute(
                "SELECT identity FROM key_ledger WHERE site=? AND form=? AND path=?",
                (site, form, f["path"]),
            ).fetchone()
            if prior and prior[0] != f["identity"]:
                raise Fault("KEY_COLLISION")
            shape = self.conn.execute(
                "SELECT type FROM identity_types WHERE site=? AND form=? AND identity=?",
                (site, form, f["identity"]),
            ).fetchone()
            if shape and shape[0] != f["type"]:
                raise Fault("BREAKING_FIELD_REPLACEMENT_REQUIRED")
            old = [
                r[0]
                for r in self.conn.execute(
                    "SELECT path FROM key_ledger WHERE site=? AND form=? AND identity=? "
                    "AND path<>? ORDER BY path",
                    (site, form, f["identity"], f["path"]),
                )
            ]
            f["renamedFrom"] = old
            if reserve:
                self.conn.execute(
                    "INSERT OR IGNORE INTO key_ledger VALUES (?,?,?,?)",
                    (site, form, f["path"], f["identity"]),
                )
                self.conn.execute(
                    "INSERT OR IGNORE INTO identity_types VALUES (?,?,?,?)",
                    (site, form, f["identity"], f["type"]),
                )
        return fields

    def data_contract(self, user: str, site: str, form: str) -> dict[str, Any]:
        d = self.draft(user, site, form)
        fields = self._key_check(site, form, d["definition"])
        active = self.publisher.active(site, form)
        old: list[dict[str, Any]] = []
        if active:
            r = self.conn.execute(
                "SELECT review FROM managed_releases WHERE id=?", (active["candidateId"],)
            ).fetchone()
            if r:
                meta = self.conn.execute(
                    "SELECT document FROM review_contracts WHERE id=?", (r[0],)
                ).fetchone()
                if meta:
                    old = self._document(meta[0])["fields"]
                else:
                    snapshot = self.review_row(user, r[0])
                    from .blocks import contract

                    old = contract(snapshot["definition"])

        def compare(rows: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
            return {f["identity"]: {k: v for k, v in f.items() if k != "renamedFrom"} for f in rows}

        before, after = compare(old), compare(fields)
        changed = (
            sorted(k for k in set(before) | set(after) if before.get(k) != after.get(k))
            if active
            else []
        )
        return {
            "fields": fields,
            "changes": [
                {"identity": k, "before": before.get(k), "after": after.get(k)} for k in changed
            ],
            "ackRequired": bool(changed),
        }

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
        if (
            os.environ.get("FB_OIDC_REQUIRED") == "1"
            and not self.conn.execute(
                "SELECT 1 FROM oidc_tokens WHERE session=?", (digest(token),)
            ).fetchone()
        ):
            raise Fault("UNAUTHORIZED", 401)
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
        meta = self.conn.execute(
            "SELECT title,cloned_from FROM form_meta WHERE site=? AND form=?", (site, form)
        ).fetchone()
        return {
            "version": r[0],
            "definition": self._document(r[1]),
            "title": meta[0] if meta else form,
            "clonedFrom": meta[1] if meta else None,
        }

    def save(
        self,
        user: str,
        site: str,
        form: str,
        expected: int,
        definition: dict[str, Any],
        title: str | None = None,
    ) -> dict[str, Any]:
        self.permit(user, site, "editor")
        if title is not None and (
            not isinstance(title, str) or not title.strip() or len(title) > 200
        ):
            raise Fault("FORM_TITLE", 400)
        if definition.get("siteId") != site or definition.get("formId") != form:
            raise Fault("FORM_SCOPE", 403)
        if len(canonical_json(definition)) > 2_000_000:
            raise Fault("DEFINITION_TOO_LARGE", 413)
        with nullcontext() if self.conn.in_transaction else self.atomic():
            self._key_check(site, form, definition)
            from .blocks import contract

            prior = self.conn.execute(
                "SELECT definition FROM drafts WHERE site=? AND form=?", (site, form)
            ).fetchone()
            if prior:
                ranks = {"public": 0, "personal": 1, "secret": 2}
                old = {f["identity"]: f for f in contract(self._document(prior[0]))}
                for field in contract(definition):
                    before = old.get(field["identity"])
                    if before and ranks.get(str(field.get("classification")), -1) < ranks.get(
                        str(before.get("classification")), -1
                    ):
                        raise Fault("CLASSIFICATION_DOWNGRADE_FORBIDDEN", 403)
            stored = self._document_ref(definition)
            if expected == 0:
                q = self.conn.execute(
                    "INSERT OR IGNORE INTO drafts VALUES (?,?,1,?,?)",
                    (site, form, stored, user),
                )
            else:
                q = self.conn.execute(
                    "UPDATE drafts SET definition=?,version=version+1,author=? "
                    "WHERE site=? AND form=? AND version=?",
                    (stored, user, site, form, expected),
                )
            if q.rowcount != 1:
                raise Fault("VERSION_CONFLICT")
            if title is not None:
                self.conn.execute(
                    "INSERT INTO form_meta VALUES (?,?,?,NULL) ON CONFLICT(site,form) "
                    "DO UPDATE SET title=excluded.title",
                    (site, form, title.strip()),
                )
            if expected == 0:
                key = "form:" + site + ":" + form
                self.conn.execute("INSERT OR IGNORE INTO gates VALUES (?, '[]')", (key,))
                self.conn.execute("INSERT OR IGNORE INTO object_security VALUES (?,1,'{}')", (key,))
            self.conn.execute("DELETE FROM previews WHERE site=? AND form=?", (site, form))
            self.audit(user, site, form, "draft.save", str(expected + 1))
        return self.draft(user, site, form)

    def clone(self, user: str, site: str, release: str, form: str, title: str) -> dict[str, Any]:
        """Clone an immutable published snapshot within one authorized site."""
        from .clone import clone_definition

        self.permit(user, site, "editor")
        with self.atomic():
            row = self.conn.execute(
                "SELECT review FROM managed_releases WHERE id=? AND site=?", (release, site)
            ).fetchone()
            if not row:
                raise Fault("NOT_FOUND", 404)
            source = self.conn.execute(
                "SELECT definition FROM reviews WHERE id=? AND site=? AND state='PUBLISHED'",
                (row[0], site),
            ).fetchone()
            if not source:
                raise Fault("E-SNAPSHOT-INTEGRITY", 503)
            definition = clone_definition(self._document(source[0]), form)
            self._review_dependencies(definition)
            result = self.save(user, site, form, 0, definition, title)
            self.conn.execute(
                "UPDATE form_meta SET cloned_from=? WHERE site=? AND form=?", (release, site, form)
            )
            self.audit(user, site, form, "draft.clone", release)
            return {**result, "clonedFrom": release}

    def policy(self) -> dict[str, Any]:
        r = self.conn.execute(
            "SELECT version,ledger,overrides,m3,fbks,ledger_seq FROM capabilities WHERE prk=?",
            (PLUGIN,),
        ).fetchone()
        if not r:
            raise Fault("E-ADMISSION-UNAVAILABLE", 503)
        ledger = self.conn.execute(
            "SELECT seq,state FROM trusted_ledger WHERE prk=?", (PLUGIN,)
        ).fetchone()
        if not ledger or ledger[0] != r[5] or ledger[1] != r[1]:
            raise Fault("E-LEDGER-UNAVAILABLE", 503)
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

    def ingest(self, ledger_seq: int | None = None) -> None:
        # Local trusted 1.0.0 manifest only. Missing existing projections are repaired fail-closed.
        r = self.conn.execute("SELECT 1 FROM capabilities WHERE prk=?", (PLUGIN,)).fetchone()
        if r:
            p = self.policy()
            if ledger_seq is not None and ledger_seq != p["seq"]:
                raise Fault("LEDGER_STALE")
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
        ledger = self.conn.execute(
            "SELECT seq,state FROM trusted_ledger WHERE prk=?", (PLUGIN,)
        ).fetchone()
        if not ledger:
            self.conn.execute(
                "INSERT INTO trusted_ledger VALUES (?,1,'active','approved-local-fixture')",
                (PLUGIN,),
            )
            ledger = (1, "active")
        if ledger_seq is not None and ledger_seq != ledger[0]:
            raise Fault("LEDGER_STALE")
        p = {"ledger": ledger[1], "seq": ledger[0], "overrides": {}, "m3": False, "fbks": FBKS}
        self._opening_supported(p)
        self.conn.execute(
            "INSERT INTO capabilities VALUES (?,?,?,?,?,?,?)",
            (PLUGIN, 1, ledger[1], "{}", 0, json.dumps(FBKS), ledger[0]),
        )
        for fbk in FBKS:
            self.conn.execute(
                "INSERT INTO gates VALUES (?,?)", ("fbk:" + fbk, json.dumps(self.derive(p)))
            )

    def repair_policy(self, user: str, site: str, expected: int) -> dict[str, Any]:
        self.permit(user, site, "security")
        with self.atomic():
            p = self.policy()
            if p["version"] != expected:
                raise Fault("VERSION_CONFLICT")
            self.conn.execute("INSERT OR IGNORE INTO gate_intents VALUES (?)", (PLUGIN,))
            self._project_policy(p, expected, repair=True)
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
            self._project_policy(p, expected)
            if source == "ledger":
                self.conn.execute(
                    "UPDATE trusted_ledger SET seq=?,state=?,commit_id='local-fixture-"
                    "update' WHERE prk=?",
                    (p["seq"], p["ledger"], PLUGIN),
                )
            self.audit(user, site, "", "policy." + source)
        return self.policy()

    def deployment(self) -> dict[str, Any]:
        row = self.conn.execute(
            "SELECT version,adapters FROM deployments WHERE id='current'"
        ).fetchone()
        if not row:
            raise Fault("E-ADMISSION-UNAVAILABLE", 503)
        return {"version": row[0], "adapters": json.loads(row[1])}

    def _opening_supported(self, p: dict[str, Any]) -> None:
        if not self.derive(p) and not set(p["fbks"]).issubset(self.deployment()["adapters"]):
            raise Fault("ADAPTER_NOT_DEPLOYED")

    def _project_policy(self, p: dict[str, Any], expected: int, repair: bool = False) -> None:
        self._opening_supported(p)
        q = self.conn.execute(
            "UPDATE capabilities SET version=version+1,ledger=?,overrides=?,m3=?,ledger_seq=? "
            "WHERE prk=? AND version=?",
            (p["ledger"], json.dumps(p["overrides"]), int(p["m3"]), p["seq"], PLUGIN, expected),
        )
        if q.rowcount != 1:
            raise Fault("VERSION_CONFLICT")
        for fbk in p["fbks"]:
            blockers = json.dumps(self.derive(p))
            if repair:
                self.conn.execute(
                    "INSERT INTO gates VALUES (?,?) ON CONFLICT(key) "
                    "DO UPDATE SET blockers=excluded.blockers",
                    ("fbk:" + fbk, blockers),
                )
            else:
                if (
                    self.conn.execute(
                        "UPDATE gates SET blockers=? WHERE key=?", (blockers, "fbk:" + fbk)
                    ).rowcount
                    != 1
                ):
                    raise Fault("E-ADMISSION-UNAVAILABLE", 503)

    def sync_ledger(
        self, user: str, site: str, seq: int, state: str, commit: str
    ) -> dict[str, Any]:
        """Trusted local ledger fixture input; no GitHub/network access or HEAD claims."""
        self.permit(user, site, "security")
        if (
            state not in ("active", "deprecated", "vulnerable", "revoked")
            or type(seq) is not int
            or seq < 1
            or not commit
        ):
            raise Fault("POLICY_VALUE", 400)
        with self.atomic():
            old = self.conn.execute(
                "SELECT seq,state,commit_id FROM trusted_ledger WHERE prk=?", (PLUGIN,)
            ).fetchone()
            if old and seq <= old[0]:
                return {"seq": old[0], "state": old[1], "changed": False}
            existing = self.conn.execute(
                "SELECT 1 FROM capabilities WHERE prk=?", (PLUGIN,)
            ).fetchone()
            if existing:
                p = self.policy()
                p["ledger"], p["seq"] = state, seq
                self._project_policy(p, p["version"])
            self.conn.execute(
                "INSERT INTO trusted_ledger VALUES (?,?,?,?) ON CONFLICT(prk) "
                "DO UPDATE SET seq=excluded.seq,state=excluded.state,commit_id=excluded.commit_id",
                (PLUGIN, seq, state, commit),
            )
            self.audit(user, site, "", "ledger.sync", str(seq))
        return {"seq": seq, "state": state, "changed": True}

    def deploy_adapters(
        self, user: str, site: str, expected: int, adapters: list[str]
    ) -> dict[str, Any]:
        self.permit(user, site, "security")
        if len(adapters) != len(set(adapters)) or not set(adapters).issubset([*FBKS, EFFECT]):
            raise Fault("ADAPTER_INVENTORY", 400)
        with self.atomic():
            d = self.deployment()
            if d["version"] != expected:
                raise Fault("VERSION_CONFLICT")
            # Only revoked ledger/override sources may exempt an adapter. M3 alone cannot.
            row = self.conn.execute("SELECT 1 FROM capabilities WHERE prk=?", (PLUGIN,)).fetchone()
            if row:
                p = self.policy()
                exempt = p["ledger"] == "revoked" or any(p["overrides"].values())
                for fbk in p["fbks"]:
                    self.gate_exists("fbk:" + fbk)
                    if fbk not in adapters and not exempt:
                        raise Fault("ADAPTER_REQUIRED")
            if EFFECT not in adapters:
                raise Fault("ADAPTER_REQUIRED")
            self.conn.execute(
                "UPDATE deployments SET version=version+1,adapters=? WHERE id='current' AND"
                " version=?",
                (json.dumps(sorted(adapters)), expected),
            )
            self.audit(user, site, "", "deployment.activate", str(expected + 1))
        return self.deployment()

    def gate_exists(self, key: str) -> None:
        if not self.conn.execute("SELECT 1 FROM gates WHERE key=?", (key,)).fetchone():
            raise Fault("E-ADMISSION-UNAVAILABLE", 503)

    def object_holds(self, site: str, form: str, release: str | None = None) -> dict[str, Any]:
        if release:
            if not self.conn.execute(
                "SELECT 1 FROM managed_releases WHERE id=? AND site=? AND form=?",
                (release, site, form),
            ).fetchone():
                raise Fault("NOT_FOUND", 404)
            key = "release:" + release
        else:
            key = "form:" + site + ":" + form
        self.gate_exists(key)
        row = self.conn.execute(
            "SELECT version,sources FROM object_security WHERE key=?", (key,)
        ).fetchone()
        if not row:
            raise Fault("E-ADMISSION-UNAVAILABLE", 503)
        return {"key": key, "version": row[0], "sources": json.loads(row[1])}

    def change_hold(
        self,
        user: str,
        site: str,
        form: str,
        expected: int,
        source: str,
        incident: str,
        blocked: bool,
        release: str | None = None,
    ) -> dict[str, Any]:
        self.permit(user, site)
        roles = json.loads(
            self.conn.execute(
                "SELECT roles FROM memberships WHERE user=? AND site=?", (user, site)
            ).fetchone()[0]
        )
        if "security" not in roles and not (
            not release and source == "M4" and "site-admin" in roles
        ):
            raise Fault("FORBIDDEN", 403)
        if (source not in ("M4", "M5") and not release) or not incident:
            raise Fault("HOLD_VALUE", 400)
        with self.atomic():
            state = self.object_holds(site, form, release)
            if state["version"] != expected:
                raise Fault("VERSION_CONFLICT")
            name = source + ":" + incident
            if blocked:
                state["sources"][name] = source
            else:
                state["sources"].pop(name, None)
            values = set(state["sources"].values())
            blockers = (
                (["rel#security"] if values else [])
                if release
                else sorted(
                    (["form#paused"] if "M4" in values else [])
                    + (["form#suspended"] if "M5" in values else [])
                )
            )
            self.conn.execute(
                "UPDATE object_security SET version=version+1,sources=? WHERE key=? AND version=?",
                (json.dumps(state["sources"]), state["key"], expected),
            )
            if (
                self.conn.execute(
                    "UPDATE gates SET blockers=? WHERE key=?", (json.dumps(blockers), state["key"])
                ).rowcount
                != 1
            ):
                raise Fault("E-ADMISSION-UNAVAILABLE", 503)
            self.audit(user, site, form, "security.hold", name)
        return self.object_holds(site, form, release)

    def gate(self, key: str) -> None:
        row = self.conn.execute("SELECT blockers FROM gates WHERE key=?", (key,)).fetchone()
        if not row:
            raise Fault("E-ADMISSION-UNAVAILABLE", 503)
        blockers = json.loads(row[0])
        if blockers:
            code = "E-RELEASE-SUSPENDED" if key.startswith("release:") else "E-CAPABILITY-BLOCKED"
            if "form#suspended" in blockers:
                code = "E-FORM-SUSPENDED"
            elif "form#paused" in blockers:
                code = "E-FORM-SUBMISSION-PAUSED"
            raise Fault(code, 423)

    def check(self, site: str, form: str, release: str, fbks: list[str]) -> None:
        if self.conn.execute("SELECT 1 FROM gate_intents LIMIT 1").fetchone():
            raise Fault("E-ADMISSION-UNAVAILABLE", 503)
        for key in ["form:" + site + ":" + form, "release:" + release, *["fbk:" + f for f in fbks]]:
            self.gate(key)

    def review(
        self, user: str, site: str, form: str, version: int, ack: bool = False
    ) -> dict[str, Any]:
        self.permit(user, site, "editor")
        with self.atomic():
            d = self.draft(user, site, form)
            if d["version"] != version:
                raise Fault("VERSION_CONFLICT")
            self._block_policy(d["definition"])
            contract = self.data_contract(user, site, form)
            if contract["ackRequired"] and not ack:
                raise Fault("DATA_CONTRACT_ACK_REQUIRED")
            if d["definition"].get("dependencies", {}).get("capabilities", {}):
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
                    self._document_ref(d["definition"]),
                    digest(d["definition"]),
                    user,
                    "",
                    "OPEN",
                    self.head(site, form),
                ),
            )
            self.conn.execute("INSERT INTO review_meta VALUES (?,?,'')", (rid, self.platform()))
            self.conn.execute(
                "INSERT INTO review_contracts VALUES (?,?)", (rid, self._document_ref(contract))
            )
            self.audit(user, site, form, "review.open", rid)
        return {"id": rid, "state": "OPEN"}

    def platform(self) -> str:
        paths = [
            *sorted((ROOT / "packages/form-engine/src").glob("*.ts")),
            *sorted((ROOT / "packages/static-runtime/src").glob("*.ts")),
            *sorted((ROOT / "tools/compiler/src").glob("*.ts")),
            *sorted((ROOT / "tools/local_p0/web").glob("*")),
            *sorted((ROOT / "contracts/schemas").glob("*/*.json")),
            ROOT / "tools/local_p0/control.py",
            ROOT / "tools/local_p0/rpc.py",
            ROOT / "tools/local_p0/blocks.py",
            ROOT / "tools/local_p0/clone.py",
            ROOT / "plugins/store-selector/plugin.manifest.json",
        ]
        return "dev_platform_" + digest(
            {str(p.relative_to(ROOT)): hashlib.sha256(p.read_bytes()).hexdigest() for p in paths}
        )

    def _review_dependencies(self, definition: dict[str, Any]) -> None:
        self._block_policy(definition)
        if definition.get("dependencies", {}).get("capabilities", {}):
            p = self.policy()
            if self.derive(p):
                raise Fault("REVIEW_RECHECK_REQUIRED")
            self._opening_supported(p)
            for fbk in p["fbks"]:
                self.gate("fbk:" + fbk)

    def reject(self, user: str, rid: str) -> dict[str, Any]:
        with self.atomic():
            r = self.review_row(user, rid)
            self.permit(user, r["site"], "reviewer")
            if r["author"] == user:
                raise Fault("FORBIDDEN", 403)
            if r["state"] != "OPEN":
                raise Fault("REVIEW_STALE")
            self.conn.execute(
                "UPDATE reviews SET state='REJECTED' WHERE id=? AND state='OPEN'", (rid,)
            )
            self.audit(user, r["site"], r["form"], "review.reject", rid)
        return self.review_row(user, rid)

    def recheck(self, user: str, rid: str, snapshot_hash: str) -> dict[str, Any]:
        # Persist any pointer-stale detection before returning a refusal.
        r = self.review_row(user, rid)
        self.permit(user, r["site"], "reviewer")
        if r["staleReason"] == "pointer" or r["state"] not in ("STALE", "OPEN"):
            raise Fault("REVIEW_STALE")
        with self.atomic():
            r = self.review_row(user, rid)
            if r["staleReason"] == "pointer" or r["digest"] != snapshot_hash:
                raise Fault("REVIEW_STALE")
            self._review_dependencies(r["definition"])
            self.conn.execute(
                "INSERT INTO review_meta VALUES (?,?,?) ON CONFLICT(id) DO UPDATE SET "
                "platform=excluded.platform,stale_reason=excluded.stale_reason",
                (rid, self.platform(), ""),
            )
            self.conn.execute("UPDATE reviews SET state='OPEN',approver='' WHERE id=?", (rid,))
            self.audit(user, r["site"], r["form"], "review.recheck", rid)
        return self.review_row(user, rid)

    def review_row(self, user: str, rid: str) -> dict[str, Any]:
        if not self.conn.in_transaction:
            with self.atomic():
                return self.review_row(user, rid)
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
        r["definition"] = self._document(r["definition"])
        meta = self.conn.execute(
            "SELECT platform,stale_reason FROM review_meta WHERE id=?", (rid,)
        ).fetchone()
        r["platform"], r["staleReason"] = (meta[0], meta[1]) if meta else ("legacy-unpinned", "")
        reason = r["staleReason"]
        if r["state"] in ("OPEN", "APPROVED", "STALE"):
            if r["base"] != self.head(r["site"], r["form"]):
                reason = "pointer"
            elif r["state"] in ("OPEN", "APPROVED"):
                try:
                    self._review_dependencies(r["definition"])
                except Fault as e:
                    if e.code not in (
                        "REVIEW_RECHECK_REQUIRED",
                        "ADAPTER_NOT_DEPLOYED",
                        "E-CAPABILITY-BLOCKED",
                    ):
                        raise
                    reason = "dependency"
                if not reason and r["platform"] != self.platform():
                    reason = "platform"
            if reason:
                self.conn.execute("UPDATE reviews SET state='STALE' WHERE id=?", (rid,))
                self.conn.execute(
                    "INSERT INTO review_meta VALUES (?,?,?) ON CONFLICT(id) DO UPDATE SET "
                    "stale_reason=excluded.stale_reason",
                    (rid, r["platform"], reason),
                )
                r["state"], r["staleReason"] = "STALE", reason
        return r

    def approve(self, user: str, rid: str, ack: bool) -> dict[str, Any]:
        stale_code = ""
        with self.atomic():
            r = self.review_row(user, rid)
            self.permit(user, r["site"], "reviewer")
            if r["author"] == user or not ack:
                raise Fault("FORBIDDEN", 403)
            if r["state"] != "OPEN":
                stale_code = (
                    "REVIEW_RECHECK_REQUIRED"
                    if r["staleReason"] in ("dependency", "platform")
                    else "REVIEW_STALE"
                )
            else:
                self.conn.execute(
                    "UPDATE reviews SET state='APPROVED',approver=? WHERE id=? AND state='OPEN'",
                    (user, rid),
                )
                self.audit(user, r["site"], r["form"], "review.approve", rid)
        if stale_code:
            raise Fault(stale_code)
        return self.review_row(user, rid)

    def operation(self, user: str, opid: str) -> dict[str, Any]:
        row = self.conn.execute("SELECT * FROM operations WHERE id=?", (opid,)).fetchone()
        if not row:
            raise Fault("NOT_FOUND", 404)
        keys = [
            "id",
            "review",
            "site",
            "form",
            "state",
            "fence",
            "candidateId",
            "error",
            "updated",
            "base",
            "platform",
        ]
        result = dict(zip(keys, row, strict=True))
        self.permit(user, result["site"])
        return result

    def begin_publication(self, user: str, rid: str) -> dict[str, Any]:
        # Reading outside the transaction also persists detected staleness on a refusal.
        r = self.review_row(user, rid)
        self.permit(user, r["site"], "publisher")
        with self.atomic():
            r = self.review_row(user, rid)
            if r["state"] in ("PUBLISHING", "PUBLISHED"):
                old = self.conn.execute(
                    "SELECT id FROM operations WHERE review=? ORDER BY rowid DESC LIMIT 1", (rid,)
                ).fetchone()
                if old:
                    return self.operation(user, old[0])
                raise Fault("REVIEW_STALE")
            if r["state"] != "APPROVED":
                raise Fault("REVIEW_STALE")
            self._review_dependencies(r["definition"])
            form_key = "form:" + r["site"] + ":" + r["form"]
            if self.conn.execute("SELECT 1 FROM gates WHERE key=?", (form_key,)).fetchone():
                self.gate(form_key)
            self.gate("fbk:" + EFFECT)
            opid = "op_" + secrets.token_hex(12)
            self.conn.execute(
                "INSERT INTO operations VALUES (?,?,?,?,?,1,'','',?,?,?)",
                (
                    opid,
                    rid,
                    r["site"],
                    r["form"],
                    "BUILDING",
                    time.time(),
                    r["base"],
                    r["platform"],
                ),
            )
            self.conn.execute(
                "UPDATE reviews SET state='PUBLISHING' WHERE id=? AND state='APPROVED'", (rid,)
            )
            self.audit(user, r["site"], r["form"], "publication.begin", opid)
        return self.operation(user, opid)

    def publication_built(
        self, user: str, opid: str, fence: int, candidate_id: str
    ) -> dict[str, Any]:
        with self.atomic():
            op = self.operation(user, opid)
            self.permit(user, op["site"], "publisher")
            if op["state"] == "VERIFYING" and op["candidateId"] == candidate_id:
                return op
            if op["state"] != "BUILDING" or op["fence"] != fence:
                raise Fault("OPERATION_FENCED")
            self.conn.execute(
                "UPDATE operations SET "
                "state='VERIFYING',version=version+1,candidate=?,updated=? WHERE id=? AND "
                "version=?",
                (candidate_id, time.time(), opid, fence),
            )
        return self.operation(user, opid)

    def finish_failed(
        self,
        user: str,
        opid: str,
        code: str,
        cancel: bool = False,
        expected_fence: int | None = None,
    ) -> dict[str, Any]:
        with self.atomic():
            op = self.operation(user, opid)
            self.permit(user, op["site"], "publisher")
            if op["state"] not in ("BUILDING", "VERIFYING", "ACTIVATING"):
                return op
            if expected_fence is not None and op["fence"] != expected_fence:
                raise Fault("OPERATION_FENCED")
            stale = self.head(op["site"], op["form"]) != op["base"]
            state = "SUPERSEDED" if stale else "CANCELLED" if cancel else "FAILED"
            self.conn.execute(
                "UPDATE operations SET state=?,version=version+1,error=?,updated=? WHERE id=?",
                (state, code[:100], time.time(), opid),
            )
            self.conn.execute(
                "UPDATE reviews SET state=? WHERE id=? AND state='PUBLISHING'",
                ("STALE" if stale else "APPROVED", op["review"]),
            )
            if stale:
                self.conn.execute(
                    "UPDATE review_meta SET stale_reason='pointer' WHERE id=?", (op["review"],)
                )
            self.audit(user, op["site"], op["form"], "publication." + state.lower(), opid)
        return self.operation(user, opid)

    def reconcile_publications(self, now: float | None = None) -> int:
        cutoff = (time.time() if now is None else now) - 120
        recovered = 0
        with self.atomic():
            for row in self.conn.execute(
                "SELECT id,review,site,form,base FROM operations WHERE state IN "
                "('BUILDING','VERIFYING','ACTIVATING') AND updated<?",
                (cutoff,),
            ).fetchall():
                opid, rid, site, form, base = row
                stale = self.head(site, form) != base
                self.conn.execute(
                    "UPDATE operations SET "
                    "state=?,version=version+1,error='INTERRUPTED',updated=? WHERE id=?",
                    ("SUPERSEDED" if stale else "FAILED", time.time(), opid),
                )
                self.conn.execute(
                    "UPDATE reviews SET state=? WHERE id=? AND state='PUBLISHING'",
                    ("STALE" if stale else "APPROVED", rid),
                )
                if stale:
                    self.conn.execute(
                        "UPDATE review_meta SET stale_reason='pointer' WHERE id=?", (rid,)
                    )
                self.audit("system:reconciler", site, form, "publication.recover", opid)
                recovered += 1
        return recovered

    def activate(
        self,
        user: str,
        rid: str,
        candidate_id: str,
        snapshot_hash: str,
        opid: str | None = None,
        fence: int | None = None,
    ) -> dict[str, Any]:
        from tools.compiler.server_adapter import candidate

        if opid is None:
            op = self.begin_publication(user, rid)
            if op["state"] != "ACTIVATED":
                op = self.publication_built(user, op["id"], op["fence"], candidate_id)
            opid, fence = op["id"], op["fence"]
        op = self.operation(user, opid)
        self.permit(user, op["site"], "publisher")
        r = self.review_row(user, rid)
        if op["review"] != rid or op["candidateId"] != candidate_id or r["digest"] != snapshot_hash:
            raise Fault("OPERATION_SCOPE", 403)
        if op["state"] == "ACTIVATED":
            return {"candidateId": candidate_id, "version": op["base"] + 1, "operation": opid}
        if op["state"] != "VERIFYING" or op["fence"] != fence:
            raise Fault("OPERATION_FENCED")
        if r["state"] != "PUBLISHING":
            raise Fault("REVIEW_STALE")
        path = self.candidates / candidate_id
        manifest, _, lock = candidate(path)
        if "previewProjection" in manifest["inputs"]:
            raise Fault("PREVIEW_ONLY", 403)
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
            "block-lock.json",
            "local-integrity.json",
            *(
                [
                    "lrm.json",
                    "chunk-plan.json",
                    "semantic-fixtures.json",
                    "attestation.json",
                    "provenance.json",
                ]
                if manifest.get("lrmFormat") == 1
                else []
            ),
        ]:
            raw = (private / name).read_bytes()
            self.publisher.objects.put_write_once(
                f"releases/{candidate_id}/_private/{name}", raw, hashlib.sha256(raw).hexdigest()
            )
        candidate(self.data / "objects/releases" / candidate_id)
        checked_deployment = self.deployment()["version"]
        fbks = FBKS if lock["bindings"] else []
        with self.atomic():
            r = self.review_row(user, rid)
            current_op = self.operation(user, opid)
            if current_op["state"] == "ACTIVATED":
                return {
                    "candidateId": candidate_id,
                    "version": current_op["base"] + 1,
                    "operation": opid,
                }
            if current_op["state"] != "VERIFYING" or current_op["fence"] != fence:
                raise Fault("OPERATION_FENCED")
            if r["state"] != "PUBLISHING" or r["base"] != self.head(r["site"], r["form"]):
                raise Fault("POINTER_CHANGED")
            if op["platform"] != self.platform():
                raise Fault("PLATFORM_CHANGED")
            if self.deployment()["version"] != checked_deployment:
                raise Fault("DEPLOYMENT_CHANGED")
            self._block_policy(r["definition"])
            self._key_check(r["site"], r["form"], r["definition"], reserve=True)
            if fbks:
                self.ingest()
                if self.derive(self.policy()):
                    raise Fault("REVIEW_RECHECK_REQUIRED")
            for key in ["form:" + r["site"] + ":" + r["form"], "release:" + candidate_id]:
                self.conn.execute("INSERT OR IGNORE INTO gates VALUES (?, '[]')", (key,))
                self.conn.execute("INSERT OR IGNORE INTO object_security VALUES (?,1,'{}')", (key,))
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
            self.conn.execute(
                "UPDATE operations SET state='ACTIVATED',version=version+1,updated=? WHERE "
                "id=? AND version=?",
                (time.time(), opid, fence),
            )
            self.audit(user, r["site"], r["form"], "release.activate", candidate_id)
        return {"candidateId": candidate_id, "version": r["base"] + 1, "operation": opid}

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
        manifest, _, _ = candidate(self.data / "objects/releases" / release)
        pins = (
            json.loads(self.publisher.objects.read(f"releases/{release}/_private/block-lock.json"))
            if "blockLock" in manifest["inputs"]
            else []
        )
        with self.atomic():
            self._block_policy(
                {"dependencies": {"blocks": {str(i): b["pin"] for i, b in enumerate(pins)}}}
            )
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
        done, blocked = 0, 0
        pending = self.conn.execute("SELECT id FROM outbox WHERE state='PENDING'").fetchall()
        for (sid,) in pending:
            try:
                with self.atomic():
                    row = self.conn.execute(
                        "SELECT state FROM outbox WHERE id=?", (sid,)
                    ).fetchone()
                    if not row or row[0] != "PENDING":
                        continue
                    r = self.conn.execute(
                        "SELECT site,form,release FROM submissions WHERE id=?", (sid,)
                    ).fetchone()
                    if not r or self.admission(r[2]) is None:
                        raise Fault("E-ADMISSION-UNAVAILABLE", 503)
                    self.conn.execute(
                        "INSERT OR IGNORE INTO mock_effects VALUES (?,?,?)", (sid, sid, time.time())
                    )
                    self.conn.execute(
                        "UPDATE outbox SET state='DONE' WHERE id=? AND state='PENDING'", (sid,)
                    )
                    done += 1
            except Fault:
                # Keep this record retryable; a hold on one form must not starve other forms/sites.
                blocked += 1
        return {"mockEffects": done, **({"blocked": blocked} if blocked else {})}
