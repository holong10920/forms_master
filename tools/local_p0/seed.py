"""OS-owner CLI: seed approved G3 synthetic reference definitions through local review roles."""

import json
import sys
from typing import Any

from tools.local_p0.config import ROOT
from tools.local_p0.control import Control, digest


def main() -> None:
    c = Control()
    results: list[dict[str, Any]] = []
    try:
        for line in sys.stdin:
            row = json.loads(line)
            name = row["name"]
            if name not in ("sports", "sports-subtle", "pc-plugin"):
                raise ValueError("E-NOT-REFERENCE")
            definition = json.loads((ROOT / f"contracts/fixtures/engine/{name}.json").read_text())
            site, form = definition["siteId"], definition["formId"]
            old = c.conn.execute(
                "SELECT version FROM drafts WHERE site=? AND form=?", (site, form)
            ).fetchone()
            saved = c.save("synthetic-editor", site, form, int(old[0]) if old else 0, definition)
            review = c.review("synthetic-editor", site, form, saved["version"])
            c.approve("synthetic-reviewer", review["id"], True)
            result = c.activate(
                "synthetic-publisher", review["id"], row["candidateId"], digest(definition)
            )
            results.append({"name": name, "url": row["url"], **result})
        sports = next(r for r in results if r["name"] == "sports")
        c.rollback(
            "synthetic-publisher",
            "site_sports_synthetic",
            "frm_sports",
            sports["candidateId"],
            c.head("site_sports_synthetic", "frm_sports"),
        )
        print(
            json.dumps(
                {
                    "references": results,
                    "sportsActive": c.publisher.active("site_sports_synthetic", "frm_sports"),
                },
                indent=2,
            )
        )
    finally:
        c.close()


if __name__ == "__main__":
    main()
