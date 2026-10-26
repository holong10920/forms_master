"""Fixed operation RPC over stdin for the loopback host. Never takes executable paths."""

import json
import secrets
import sys
import time
from typing import Any

from tools.local_p0.control import Control, Fault, digest


def run(c: Control, op: str, b: dict[str, Any], token: str, csrf: str) -> Any:
    if op == "worker":
        return c.worker()
    if op == "login":
        with c.atomic():
            result = c.login(b["user"])
            if token:
                c.conn.execute("DELETE FROM previews WHERE session=?", (digest(token),))
                c.conn.execute("DELETE FROM sessions WHERE token=?", (digest(token),))
        return result
    if op == "preview.check":
        r = c.conn.execute(
            "SELECT session,site,form,version,candidate,expires FROM previews WHERE token=?",
            (digest(token),),
        ).fetchone()
        if not r or r[5] < time.time():
            raise Fault("PREVIEW_SESSION_EXPIRED", 410)
        c.actor(b.get("adminToken", "")) if b.get("adminToken") else None
        session = c.conn.execute(
            "SELECT user,created,seen FROM sessions WHERE token=?", (r[0],)
        ).fetchone()
        if not session or time.time() - session[1] > 28800 or time.time() - session[2] > 1800:
            raise Fault("PREVIEW_SESSION_EXPIRED", 410)
        c.permit(session[0], r[1])
        d = c.draft(session[0], r[1], r[2])
        if r[3] >= 0 and d["version"] != r[3]:
            raise Fault("PREVIEW_SESSION_EXPIRED", 410)
        if c.conn.execute("SELECT 1 FROM gate_intents LIMIT 1").fetchone():
            raise Fault("E-ADMISSION-UNAVAILABLE", 503)
        if d["definition"].get("dependencies"):
            for key in c.policy()["fbks"]:
                c.gate("fbk:" + key)
        return {"candidateId": r[4]}
    user = c.actor(token, None if op == "session" else csrf)
    if op == "session":
        row = c.conn.execute("SELECT csrf FROM sessions WHERE token=?", (digest(token),)).fetchone()
        return {
            "user": user,
            "csrf": row[0],
            "sites": [
                {"id": r[0], "roles": json.loads(r[1])}
                for r in c.conn.execute("SELECT site,roles FROM memberships WHERE user=?", (user,))
            ],
        }
    if op == "logout":
        c.conn.execute("DELETE FROM previews WHERE session=?", (digest(token),))
        c.conn.execute("DELETE FROM sessions WHERE token=?", (digest(token),))
        return {"ok": True}
    if op == "review.get":
        return c.review_row(user, b["id"])
    if op == "approve":
        return c.approve(user, b["id"], b.get("dataContractAck") is True)
    if op == "activate":
        return c.activate(user, b["id"], b["candidateId"], b["snapshotHash"])
    site = b["site"]
    c.permit(user, site)
    if op == "list":
        return {
            "forms": [
                {"formId": r[0], "version": r[1]}
                for r in c.conn.execute(
                    "SELECT form,version FROM drafts WHERE site=? ORDER BY form", (site,)
                )
            ]
        }
    if op == "policy.get":
        c.permit(user, site, "security")
        return c.policy()
    if op == "policy.repair":
        return c.repair_policy(user, site, b["expected"])
    if op == "policy.change":
        if b["source"] != "override":
            raise Fault("FORBIDDEN", 403)
        return c.change_policy(
            user, site, b["expected"], b["source"], b["value"], b.get("key", "local-incident")
        )
    form = b["form"]
    if op == "save":
        return c.save(user, site, form, b["expected"], b["definition"])
    if op == "get":
        return c.draft(user, site, form)
    if op == "delete":
        c.permit(user, site, "editor")
        with c.atomic():
            if c.conn.execute(
                "SELECT 1 FROM local_active WHERE site_id=? AND form_id=?", (site, form)
            ).fetchone():
                raise Fault("PUBLISHED_FORM_DELETE_FORBIDDEN")
            q = c.conn.execute(
                "DELETE FROM drafts WHERE site=? AND form=? AND version=?",
                (site, form, b["expected"]),
            )
            if q.rowcount != 1:
                raise Fault("VERSION_CONFLICT")
            c.conn.execute("DELETE FROM previews WHERE site=? AND form=?", (site, form))
            c.audit(user, site, form, "draft.delete")
        return {"ok": True}
    if op == "review":
        return c.review(user, site, form, b["version"])
    if op == "preview.register":
        c.permit(user, site)
        with c.atomic():
            if b.get("id"):
                r = c.review_row(user, b["id"])
                if r["site"] != site or r["form"] != form:
                    raise Fault("FORM_SCOPE", 403)
                d = {"version": -1, "definition": r["definition"]}
            else:
                c.permit(user, site, "editor")
                d = c.draft(user, site, form)
            if (not b.get("id") and d["version"] != b["version"]) or digest(d["definition"]) != b[
                "snapshotHash"
            ]:
                raise Fault("VERSION_CONFLICT")
            if d["definition"].get("dependencies"):
                c.ingest()
                if c.derive(c.policy()):
                    raise Fault("REVIEW_RECHECK_REQUIRED")
            preview = secrets.token_urlsafe(32)
            c.conn.execute(
                "INSERT INTO previews VALUES (?,?,?,?,?,?,?)",
                (
                    digest(preview),
                    digest(token),
                    site,
                    form,
                    d["version"],
                    b["candidateId"],
                    time.time() + 1800,
                ),
            )
            c.audit(user, site, form, "preview.create")
        return {"previewSessionId": preview}
    if op == "history":
        return {
            "active": c.publisher.active(site, form),
            "releases": [
                {"id": r[0], "review": r[1], "at": r[2]}
                for r in c.conn.execute(
                    "SELECT id,review,at FROM managed_releases "
                    "WHERE site=? AND form=? ORDER BY at DESC",
                    (site, form),
                )
            ],
            "reviews": [
                {"id": r[0], "state": r[1], "author": r[2]}
                for r in c.conn.execute(
                    "SELECT id,state,author FROM reviews "
                    "WHERE site=? AND form=? ORDER BY rowid DESC",
                    (site, form),
                )
            ],
            "audit": [
                {"action": r[0], "actor": r[1], "target": r[2]}
                for r in c.conn.execute(
                    "SELECT action,actor,target FROM audit "
                    "WHERE site=? AND form=? ORDER BY id DESC LIMIT 50",
                    (site, form),
                )
            ],
        }
    if op == "rollback":
        return c.rollback(user, site, form, b["release"], b["expected"])
    raise Fault("NOT_FOUND", 404)


def main() -> None:
    c = None
    try:
        request = json.load(sys.stdin)
        c = Control()
        result = run(
            c,
            request["op"],
            request.get("body", {}),
            request.get("token", ""),
            request.get("csrf", ""),
        )
        print(json.dumps({"status": 200, "body": result}))
    except Fault as e:
        print(
            json.dumps({"status": e.status, "body": {"code": e.code, "retryable": e.status == 503}})
        )
    except (KeyError, TypeError, ValueError):
        print(json.dumps({"status": 400, "body": {"code": "INVALID_REQUEST"}}))
    except Exception:
        print(json.dumps({"status": 503, "body": {"code": "STORE_UNAVAILABLE", "retryable": True}}))
    finally:
        if c:
            c.close()


if __name__ == "__main__":
    main()
