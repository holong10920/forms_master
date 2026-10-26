"""Internal-only mock OIDC/BFF durable state, single-use codes and encrypted token envelope."""

import base64
import hashlib
import secrets
import time
from typing import Any

from tools.local_p0.control import USERS, Control, Fault, digest

SCHEMA = """
CREATE TABLE IF NOT EXISTS oidc_states(id TEXT PRIMARY KEY,document TEXT,expires REAL);
CREATE TABLE IF NOT EXISTS oidc_codes(id TEXT PRIMARY KEY,user TEXT,nonce TEXT,challenge TEXT,
 redirect TEXT,expires REAL);
CREATE TABLE IF NOT EXISTS oidc_tokens(session TEXT PRIMARY KEY,envelope TEXT);
"""


def handle(c: Control, op: str, b: dict[str, Any], token: str) -> Any:
    import json

    c.conn.executescript(SCHEMA)
    with c.atomic():
        c.conn.execute("DELETE FROM oidc_states WHERE expires<?", (time.time(),))
        c.conn.execute("DELETE FROM oidc_codes WHERE expires<?", (time.time(),))
        if op == "oidc.start":
            c.conn.execute(
                "INSERT INTO oidc_states VALUES (?,?,?)",
                (digest(b["state"]), json.dumps({**b, "previous": token}), time.time() + 300),
            )
            return {"ok": True}
        if op == "oidc.state":
            row = c.conn.execute(
                "SELECT document FROM oidc_states WHERE id=?", (digest(b["state"]),)
            ).fetchone()
            if not row:
                raise Fault("OIDC_STATE", 401)
            c.conn.execute("DELETE FROM oidc_states WHERE id=?", (digest(b["state"]),))
            return json.loads(row[0])
        if op == "oidc.issue":
            if b["user"] not in USERS:
                raise Fault("OIDC_SUBJECT", 403)
            code = secrets.token_urlsafe(32)
            c.conn.execute(
                "INSERT INTO oidc_codes VALUES (?,?,?,?,?,?)",
                (
                    digest(code),
                    b["user"],
                    b["nonce"],
                    b["challenge"],
                    b["redirect"],
                    time.time() + 60,
                ),
            )
            return {"code": code}
        if op == "oidc.exchange":
            row = c.conn.execute(
                "SELECT user,nonce,challenge,redirect FROM oidc_codes WHERE id=?",
                (digest(b["code"]),),
            ).fetchone()
            if not row:
                raise Fault("OIDC_CODE", 401)
            c.conn.execute("DELETE FROM oidc_codes WHERE id=?", (digest(b["code"]),))
            challenge = (
                base64.urlsafe_b64encode(hashlib.sha256(b["verifier"].encode()).digest())
                .decode()
                .rstrip("=")
            )
            if not secrets.compare_digest(challenge, row[2]) or b["redirect"] != row[3]:
                raise Fault("OIDC_PKCE", 401)
            return {"user": row[0], "nonce": row[1]}
        if op == "oidc.complete":
            result = c.login(b["user"])
            c.conn.execute(
                "INSERT INTO oidc_tokens VALUES (?,?)", (digest(result["token"]), b["envelope"])
            )
            if token:
                c.conn.execute("DELETE FROM previews WHERE session=?", (digest(token),))
                c.conn.execute("DELETE FROM sessions WHERE token=?", (digest(token),))
                c.conn.execute("DELETE FROM oidc_tokens WHERE session=?", (digest(token),))
            return result
    raise Fault("NOT_FOUND", 404)
