"""ja/vi localization: provider-less draft-translation contract; bilingual drafts persist."""

from pathlib import Path
from typing import Any

import pytest
from tools.local_p0.control import Control, Fault
from tools.local_p0.rpc import run
from tools.local_p0.translation import draft_translations

TEXTS = [{"id": "field:fld_method:label", "text": "買取方法を選択してください"}]


def test_no_approved_provider_reports_unavailable_after_validation() -> None:
    with pytest.raises(Fault) as unavailable:
        draft_translations({"source": "ja", "target": "vi", "texts": TEXTS})
    assert (unavailable.value.code, unavailable.value.status) == (
        "TRANSLATION_PROVIDER_UNAVAILABLE",
        503,
    )
    cases: list[tuple[dict[str, Any], str]] = [
        ({"source": "ja", "target": "ja", "texts": TEXTS}, "TRANSLATION_LANGUAGE"),
        ({"source": "en", "target": "vi", "texts": TEXTS}, "TRANSLATION_LANGUAGE"),
        ({"source": "vi", "target": "ja", "texts": []}, "TRANSLATION_INPUT"),
        ({"source": "vi", "target": "ja", "texts": [{"id": 1, "text": "x"}]}, "TRANSLATION_INPUT"),
        (
            {"source": "ja", "target": "vi", "texts": [{"id": "a", "text": "x" * 2001}]},
            "TRANSLATION_INPUT",
        ),
        ({"source": "ja", "target": "vi", "texts": TEXTS * 501}, "TRANSLATION_INPUT"),
    ]
    for body, code in cases:
        with pytest.raises(Fault) as invalid:
            draft_translations(body)
        assert (invalid.value.code, invalid.value.status) == (code, 400)


def test_translate_rpc_requires_session_and_csrf(tmp_path: Path) -> None:
    c = Control(tmp_path)
    try:
        body = {"source": "ja", "target": "vi", "texts": TEXTS}
        with pytest.raises(Fault, match="UNAUTHORIZED"):
            run(c, "translate", body, "", "")
        login = c.login("synthetic-editor")
        with pytest.raises(Fault, match="CSRF"):
            run(c, "translate", body, login["token"], "wrong")
        with pytest.raises(Fault, match="TRANSLATION_PROVIDER_UNAVAILABLE"):
            run(c, "translate", body, login["token"], login["csrf"])
    finally:
        c.close()


def test_bilingual_draft_round_trips_without_changing_ids_keys_or_values(tmp_path: Path) -> None:
    c = Control(tmp_path)
    try:
        site, form = "site_sports_synthetic", "frm_l10n"
        definition: dict[str, Any] = {
            "formId": form,
            "siteId": site,
            "locale": {"default": "ja", "supported": ["ja", "vi"]},
            "texts": {"next": {"ja": "次へ", "vi": "Tiếp theo"}, "formTitle": {"vi": "Thu mua"}},
            "fields": [
                {
                    "id": "fld_method",
                    "key": "method",
                    "type": "choice.radio",
                    "label": {
                        "ja": "買取方法を選択してください",
                        "vi": "Vui lòng chọn phương thức thu mua",
                    },
                    "help": {"vi": "Chọn một phương thức"},
                    "options": [
                        {
                            "value": "store",
                            "label": {"ja": "店頭買取", "vi": "Bán trực tiếp tại cửa hàng"},
                        },
                        {
                            "value": "delivery",
                            "label": {"ja": "宅配買取", "vi": "Thu mua qua giao hàng"},
                        },
                    ],
                }
            ],
            "steps": [{"id": "stp_a", "title": {"ja": "方法", "vi": "Phương thức"}}],
        }
        c.save("synthetic-editor", site, form, 0, definition, "合成フォーム")
        loaded = c.draft("synthetic-reviewer", site, form)["definition"]
        assert loaded == definition
        field = loaded["fields"][0]
        assert [o["value"] for o in field["options"]] == ["store", "delivery"]
        assert (field["id"], field["key"]) == ("fld_method", "method")
    finally:
        c.close()
