"""Local data directory layout (gitignored ``var/`` by default)."""

from dataclasses import dataclass
from pathlib import Path

from fb_store.migrations import apply_migrations
from fb_store.sqlite import open_database

MIGRATIONS_DIR = Path(__file__).parent / "migrations"


@dataclass(frozen=True)
class DataLayout:
    root: Path

    @property
    def sqlite_path(self) -> Path:
        return self.root / "fb.sqlite3"

    @property
    def blob_root(self) -> Path:
        return self.root / "blobs"

    @property
    def release_root(self) -> Path:
        return self.root / "release-store"


def init_data_dir(
    root: Path, migrations_dir: Path = MIGRATIONS_DIR
) -> tuple[DataLayout, list[str]]:
    """Creates the layout and applies migrations. The data directory, store roots and database
    file are owner-only (0700 / 0600), also when they already existed; parents of the data
    directory are left as they are."""
    layout = DataLayout(root)
    for directory in (layout.root, layout.blob_root, layout.release_root):
        directory.mkdir(mode=0o700, parents=True, exist_ok=True)
        directory.chmod(0o700)
    layout.sqlite_path.touch(mode=0o600, exist_ok=True)
    layout.sqlite_path.chmod(0o600)
    conn = open_database(layout.sqlite_path)
    try:
        applied = apply_migrations(conn, migrations_dir)
    finally:
        conn.close()
    return layout, applied
