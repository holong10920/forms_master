"""Execute against running synthetic localhost host under its kernel network sandbox."""

import http.client
import json
from urllib.parse import urlsplit

from tools.local_p0.control import Control


def status(url: str, payload: object = None) -> int:
    target = urlsplit(url)
    if target.scheme != "http" or target.hostname != "127.0.0.1" or target.port not in (4173, 4175):
        raise ValueError("E-NOT-LOOPBACK")
    conn = http.client.HTTPConnection("127.0.0.1", target.port, timeout=5)
    try:
        conn.request(
            "GET" if payload is None else "POST",
            target.path,
            None if payload is None else json.dumps(payload),
            {"Content-Type": "application/json"},
        )
        response = conn.getresponse()
        response.read()
        return response.status
    finally:
        conn.close()


def main() -> None:
    c = Control()
    url = (
        "http://127.0.0.1:4173/r/"
        + c.publisher.active("site_pc_synthetic", "frm_pc_reference")["candidateId"]
    )
    before = c.conn.execute("SELECT COUNT(*) FROM submissions").fetchone()[0]
    initial = status(url + "/api/store-list")
    if initial != 200:
        raise RuntimeError("E-INITIAL-QUERY")
    key = "local-p0-acceptance"
    c.change_policy(
        "synthetic-security", "site_pc_synthetic", c.policy()["version"], "override", True, key
    )
    try:
        query = status(url + "/api/store-list")
        submit = status(url + "/api/submit", {"payload": {}, "idempotencyKey": "synthetic-blocked"})
        if query != 423 or submit != 423:
            raise RuntimeError("E-REVOCATION-ADMISSION")
        after = c.conn.execute("SELECT COUNT(*) FROM submissions").fetchone()[0]
        if after != before:
            raise RuntimeError("E-REVOKED-SUBMISSION")
    finally:
        c.change_policy(
            "synthetic-security", "site_pc_synthetic", c.policy()["version"], "override", False, key
        )
        c.close()
    preview = status("http://127.0.0.1:4175/api/preview/bootstrap")
    if preview not in (403, 410):
        raise RuntimeError("E-PREVIEW-UNAUTHENTICATED")
    print(
        json.dumps(
            {
                "revokedQuery": query,
                "revokedSubmit": submit,
                "newSubmissions": after - before,
                "resumeQuery": status(url + "/api/store-list"),
                "unauthenticatedPreview": preview,
                "scope": "SQLite local synthetic; not DynamoDB verification",
            }
        )
    )


if __name__ == "__main__":
    main()
