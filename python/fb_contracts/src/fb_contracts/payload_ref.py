"""Semantic checks of a structurally valid PayloadRef (spec #5 section 5.3).

Same order and codes as ``checkPayloadRef`` in ``packages/contracts/src/payload-ref.ts``.
"""

from collections.abc import Mapping
from typing import NamedTuple

from fb_contracts.digest import is_sha256_hex


class SemanticError(NamedTuple):
    code: str
    path: str


def check_payload_ref(ref: Mapping[str, object]) -> list[SemanticError]:
    errors: list[SemanticError] = []
    has_inline = "inline" in ref
    blob_key = ref.get("blobKey")
    has_blob_key = blob_key is not None
    if has_inline == has_blob_key:
        errors.append(SemanticError("E-PAYLOADREF-STORAGE", ""))
    sha256 = ref.get("sha256")
    if not isinstance(sha256, str) or not is_sha256_hex(sha256):
        errors.append(SemanticError("E-DIGEST-FORMAT", "/sha256"))
    if has_blob_key and blob_key != f"sha256/{sha256}":
        errors.append(SemanticError("E-PAYLOADREF-BLOBKEY", "/blobKey"))
    return errors
