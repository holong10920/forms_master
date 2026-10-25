"""``python -m fb_store init --data-dir <path>``: create the local data directory."""

import argparse
import json
from pathlib import Path

from fb_store.layout import init_data_dir


def main() -> None:
    parser = argparse.ArgumentParser(prog="python -m fb_store")
    sub = parser.add_subparsers(dest="command", required=True)
    init = sub.add_parser("init", help="create the local data directory and apply migrations")
    init.add_argument("--data-dir", type=Path, default=Path("var"))
    args = parser.parse_args()
    layout, applied = init_data_dir(args.data_dir)
    print(
        json.dumps(
            {
                "dataDir": str(layout.root),
                "sqlite": str(layout.sqlite_path),
                "appliedMigrations": applied,
            }
        )
    )


if __name__ == "__main__":
    main()
