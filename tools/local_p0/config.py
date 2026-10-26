"""Fail-closed synthetic configuration shared by host/adapter/worker."""

import json
import os
import socket
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CONFIG = ROOT / "tools/local_p0/environment.json"


def enforce() -> dict[str, object]:
    value: dict[str, object] = json.loads(CONFIG.read_text())
    if (
        value
        != {
            "dataMode": "synthetic",
            "connectors": ["mock-store-directory", "effect-mock-log"],
            "allowedEffects": ["@platform/effect-mock-log#recordSubmission"],
        }
        or os.environ.get("FB_DATA_MODE", "synthetic") != "synthetic"
    ):
        raise RuntimeError("E-SYNTHETIC-ONLY")
    # Host does not consume credentials. Refuse common connector credential environments.
    if any(
        os.environ.get(k) for k in ("AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "SMTP_PASSWORD")
    ):
        raise RuntimeError("E-REAL-CREDENTIAL-ENV")
    if os.environ.get("FB_NETWORK_SANDBOX") == "required":
        probe = socket.socket()
        try:
            probe.settimeout(1)
            probe.connect(("198.51.100.1", 80))
        except PermissionError:
            pass
        else:
            raise RuntimeError("E-KERNEL-NETWORK-SANDBOX-REQUIRED")
        finally:
            probe.close()
    return value
