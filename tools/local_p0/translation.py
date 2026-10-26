"""Draft-translation contract for Admin (ja <-> vi).

Request: {"source": "ja"|"vi", "target": "ja"|"vi", "texts": [{"id": str, "text": str}, ...]}.
Response (once a provider is approved): {"drafts": [{"id": str, "text": str}, ...]}; drafts are
editable suggestions that Admin only writes into empty target cells.

No translation provider or API key is approved for this PoC, so after validating the request this
always fails with TRANSLATION_PROVIDER_UNAVAILABLE and sends nothing anywhere.
"""

from typing import Any

from tools.local_p0.control import Fault

LANGUAGES = ("ja", "vi")


def draft_translations(body: dict[str, Any]) -> dict[str, Any]:
    source, target, texts = body.get("source"), body.get("target"), body.get("texts")
    if source not in LANGUAGES or target not in LANGUAGES or source == target:
        raise Fault("TRANSLATION_LANGUAGE", 400)
    if (
        not isinstance(texts, list)
        or not 0 < len(texts) <= 500
        or any(
            not isinstance(t, dict)
            or not isinstance(t.get("id"), str)
            or not isinstance(t.get("text"), str)
            or len(t["text"]) > 2000
            for t in texts
        )
    ):
        raise Fault("TRANSLATION_INPUT", 400)
    raise Fault("TRANSLATION_PROVIDER_UNAVAILABLE", 503)
