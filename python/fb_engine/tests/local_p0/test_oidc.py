"""Mock OIDC durable code/state replay, PKCE and server-owned RBAC contracts."""

from pathlib import Path
from typing import Any

import pytest
from tools.local_p0.control import Control, Fault
from tools.local_p0.oidc_store import handle


def test_pkce_code_replay_state_expiry_and_session_rotation(tmp_path: Path) -> None:
    import base64
    import hashlib

    c = Control(tmp_path)
    try:
        verifier = "synthetic-verifier-with-at-least-forty-three-characters"
        challenge = (
            base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest())
            .decode()
            .rstrip("=")
        )
        args: dict[str, Any] = {
            "user": "synthetic-editor",
            "nonce": "nonce",
            "challenge": challenge,
            "redirect": "http://localhost:4174/auth/callback",
        }
        code = handle(c, "oidc.issue", args, "")["code"]
        with pytest.raises(Fault, match="OIDC_PKCE"):
            handle(
                c,
                "oidc.exchange",
                {"code": code, "verifier": "incorrect", "redirect": args["redirect"]},
                "",
            )
        assert (
            handle(
                c,
                "oidc.exchange",
                {"code": code, "verifier": verifier, "redirect": args["redirect"]},
                "",
            )["user"]
            == "synthetic-editor"
        )
        with pytest.raises(Fault, match="OIDC_CODE"):
            handle(
                c,
                "oidc.exchange",
                {"code": code, "verifier": verifier, "redirect": args["redirect"]},
                "",
            )
        handle(c, "oidc.start", {"state": "state", "verifier": verifier}, "")
        assert handle(c, "oidc.state", {"state": "state"}, "")["verifier"] == verifier
        with pytest.raises(Fault, match="OIDC_STATE"):
            handle(c, "oidc.state", {"state": "state"}, "")
        handle(c, "oidc.start", {"state": "expired"}, "")
        c.conn.execute("UPDATE oidc_states SET expires=0")
        with pytest.raises(Fault, match="OIDC_STATE"):
            handle(c, "oidc.state", {"state": "expired"}, "")
        before = c.login("synthetic-editor")
        after = handle(
            c,
            "oidc.complete",
            {"user": "synthetic-viewer", "envelope": "synthetic-encrypted-envelope"},
            before["token"],
        )
        with pytest.raises(Fault, match="UNAUTHORIZED"):
            c.actor(before["token"])
        assert c.actor(after["token"]) == "synthetic-viewer"
        with pytest.raises(Fault, match="FORBIDDEN"):
            c.permit("synthetic-viewer", "site_sports_synthetic", "editor")
        with pytest.raises(Fault, match="FORBIDDEN"):
            c.permit("synthetic-viewer", "site_other_synthetic")
    finally:
        c.close()


def test_expired_and_legacy_session_rejected_when_bff_is_required(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    c = Control(tmp_path)
    try:
        legacy = c.login("synthetic-editor")
        monkeypatch.setenv("FB_OIDC_REQUIRED", "1")
        with pytest.raises(Fault, match="UNAUTHORIZED"):
            c.actor(legacy["token"])
        session = handle(
            c, "oidc.complete", {"user": "synthetic-viewer", "envelope": "synthetic-ciphertext"}, ""
        )
        assert c.actor(session["token"]) == "synthetic-viewer"
        c.conn.execute("UPDATE sessions SET seen=0")
        with pytest.raises(Fault, match="UNAUTHORIZED"):
            c.actor(session["token"])
    finally:
        c.close()
