"""Fixed operation RPC over stdin for the loopback host. Never takes executable paths."""

import json
import os
import secrets
import sys
import time
from typing import Any

from tools.local_p0.control import Control, Fault, digest


def run(c: Control, op: str, b: dict[str, Any], token: str, csrf: str) -> Any:
    if op.startswith("oidc."):
        from .oidc_store import handle

        return handle(c, op, b, token)
    if op == "worker":
        c.reconcile_publications()
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
        if (
            os.environ.get("FB_OIDC_REQUIRED") == "1"
            and not c.conn.execute("SELECT 1 FROM oidc_tokens WHERE session=?", (r[0],)).fetchone()
        ):
            raise Fault("PREVIEW_SESSION_EXPIRED", 410)
        c.permit(session[0], r[1])
        from tools.compiler.server_adapter import candidate

        manifest, _ir, lock = candidate(c.candidates / r[4])
        if manifest["form"]["siteId"] != r[1] or manifest["form"]["formId"] != r[2]:
            raise Fault("PREVIEW_SESSION_SCOPE", 403)
        if r[3] >= 0:
            d = c.draft(session[0], r[1], r[2])
            if d["version"] != r[3] or manifest["inputs"]["definition"] != "sha256:" + digest(
                d["definition"]
            ):
                raise Fault("PREVIEW_SESSION_EXPIRED", 410)
        if c.conn.execute("SELECT 1 FROM gate_intents LIMIT 1").fetchone():
            raise Fault("E-ADMISSION-UNAVAILABLE", 503)
        c.gate("form:" + r[1] + ":" + r[2])
        for binding in lock["bindings"]:
            key = binding["key"]
            if key["facet"] == "server":
                c.gate(
                    "fbk:"
                    + key["plugin"]
                    + "@"
                    + key["version"]
                    + "#"
                    + key["capability"]
                    + "/server"
                )
        if "blockLock" in manifest["inputs"]:
            block_lock = json.loads(
                (c.candidates / r[4])
                .parent.parent.joinpath("private", r[4], "block-lock.json")
                .read_text()
            )
            c._block_policy(
                {"dependencies": {"blocks": {str(i): v["pin"] for i, v in enumerate(block_lock)}}}
            )
        return {"candidateId": r[4], "partial": "previewProjection" in manifest["inputs"]}
    user = c.actor(token, None if op in ("session", "catalog") else csrf)
    if op == "preview.status":
        preview = b["previewSessionId"]
        row = c.conn.execute(
            "SELECT session FROM previews WHERE token=?", (digest(preview),)
        ).fetchone()
        if not row or row[0] != digest(token):
            raise Fault("PREVIEW_SESSION_EXPIRED", 410)
        try:
            run(c, "preview.check", {}, preview, "")
        except Fault as error:
            c.conn.execute("DELETE FROM previews WHERE token=?", (digest(preview),))
            return {"active": False, "code": error.code}
        return {"active": True}
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
    if op == "catalog":
        return {
            "statuses": [
                {"pin": r[0], "digest": r[1], "state": r[2], "version": r[3]}
                for r in c.conn.execute("SELECT pin,digest,state,version FROM block_status")
            ]
        }
    if op == "logout":
        c.conn.execute("DELETE FROM oidc_tokens WHERE session=?", (digest(token),))
        c.conn.execute("DELETE FROM previews WHERE session=?", (digest(token),))
        c.conn.execute("DELETE FROM sessions WHERE token=?", (digest(token),))
        return {"ok": True}
    if op == "translate":
        from tools.local_p0.translation import draft_translations

        return draft_translations(b)
    if op == "review.get":
        return c.review_row(user, b["id"])
    if op == "reject":
        return c.reject(user, b["id"])
    if op == "recheck":
        return c.recheck(user, b["id"], b["snapshotHash"])
    if op == "approve":
        return c.approve(user, b["id"], b.get("dataContractAck") is True)
    if op == "publication.begin":
        return c.begin_publication(user, b["id"])
    if op == "publication.built":
        return c.publication_built(user, b["operation"], b["fence"], b["candidateId"])
    if op == "publication.fail":
        return c.finish_failed(
            user, b["operation"], b.get("code", "BUILD_FAILED"), expected_fence=b.get("fence")
        )
    if op == "publication.cancel":
        return c.finish_failed(user, b["operation"], "CANCELLED_BY_USER", True)
    if op == "publication.get":
        return c.operation(user, b["operation"])
    if op == "activate":
        return c.activate(
            user, b["id"], b["candidateId"], b["snapshotHash"], b.get("operation"), b.get("fence")
        )
    site = b["site"]
    c.permit(user, site)
    if op == "list":
        return {
            "forms": [
                {"formId": r[0], "version": r[1], "title": r[2] or r[0]}
                for r in c.conn.execute(
                    "SELECT d.form,d.version,m.title FROM drafts d LEFT JOIN form_meta m "
                    "ON m.site=d.site AND m.form=d.form WHERE d.site=? ORDER BY d.form",
                    (site,),
                )
            ]
        }
    if op == "deployment.get":
        c.permit(user, site, "security")
        return c.deployment()
    if op == "deployment.change":
        return c.deploy_adapters(user, site, b["expected"], b["adapters"])
    if op == "policy.ledger":
        return c.sync_ledger(user, site, b["seq"], b["state"], b["commit"])
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
    if op == "hold.get":
        return c.object_holds(site, form, b.get("release"))
    if op == "hold.change":
        return c.change_hold(
            user,
            site,
            form,
            b["expected"],
            b["source"],
            b["incident"],
            b["blocked"],
            b.get("release"),
        )
    if op == "contract":
        return c.data_contract(user, site, form)
    if op == "save":
        return c.save(user, site, form, b["expected"], b["definition"], b.get("title"))
    if op == "clone":
        return c.clone(user, site, b["release"], form, b["title"])
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
        return c.review(user, site, form, b["version"], b.get("dataContractAck") is True)
    if op == "preview.policy":
        c.permit(user, site, "editor")
        d = c.draft(user, site, form)
        blocked = False
        if d["definition"].get("dependencies", {}).get("capabilities", {}):
            c.ingest()
            blocked = bool(c.derive(c.policy()))
        return {"blocked": blocked}
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
            c._block_policy(d["definition"])
            if d["definition"].get("dependencies", {}).get("capabilities", {}):
                c.ingest()
                if c.derive(c.policy()) and not b.get("partial"):
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
        for r in c.conn.execute(
            "SELECT id FROM reviews WHERE site=? AND form=?", (site, form)
        ).fetchall():
            c.review_row(user, r[0])
        return {
            "operations": [
                c.operation(user, r[0])
                for r in c.conn.execute(
                    "SELECT id FROM operations WHERE site=? AND form=? ORDER BY rowid DESC",
                    (site, form),
                ).fetchall()
            ],
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
                {"id": r[0], "state": r[1], "author": r[2], "staleReason": r[3] or ""}
                for r in c.conn.execute(
                    "SELECT r.id,r.state,r.author,m.stale_reason FROM reviews r "
                    "LEFT JOIN review_meta m ON m.id=r.id "
                    "WHERE r.site=? AND r.form=? ORDER BY r.rowid DESC",
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
