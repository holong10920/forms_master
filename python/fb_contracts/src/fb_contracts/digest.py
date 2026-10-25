"""SHA-256 helpers over raw bytes and canonical JSON."""

import hashlib
import re

from fb_contracts.jcs import canonical_json

_SHA256_HEX = re.compile(r"[0-9a-f]{64}")


def sha256_hex(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def jcs_sha256_hex(value: object) -> str:
    return sha256_hex(canonical_json(value))


def is_sha256_hex(s: str) -> bool:
    return _SHA256_HEX.fullmatch(s) is not None
