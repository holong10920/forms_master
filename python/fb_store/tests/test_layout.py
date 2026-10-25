import json
import subprocess
import sys
from pathlib import Path

from fb_store.layout import init_data_dir


def test_init_data_dir_creates_layout(tmp_path: Path) -> None:
    layout, applied = init_data_dir(tmp_path / "var")
    assert applied == []
    assert layout.sqlite_path == tmp_path / "var" / "fb.sqlite3"
    assert layout.sqlite_path.is_file()
    assert layout.blob_root.is_dir()
    assert layout.release_root.is_dir()
    for directory in (layout.root, layout.blob_root, layout.release_root):
        assert (directory.stat().st_mode & 0o777) == 0o700
    assert (layout.sqlite_path.stat().st_mode & 0o777) == 0o600


def test_existing_open_data_dir_is_tightened(tmp_path: Path) -> None:
    root = tmp_path / "var"
    root.mkdir(mode=0o755)
    root.chmod(0o755)
    layout, _ = init_data_dir(root)
    assert (layout.root.stat().st_mode & 0o777) == 0o700


def test_init_applies_migrations_once(tmp_path: Path) -> None:
    fixtures = Path(__file__).parent / "migrations_fixture" / "ok"
    _, first = init_data_dir(tmp_path / "var", fixtures)
    _, second = init_data_dir(tmp_path / "var", fixtures)
    assert (first, second) == (["0001", "0002"], [])


def test_cli_init_is_idempotent(tmp_path: Path) -> None:
    for _ in range(2):
        out = subprocess.run(
            [sys.executable, "-m", "fb_store", "init", "--data-dir", str(tmp_path / "var")],
            capture_output=True,
            text=True,
            check=True,
        )
        report = json.loads(out.stdout)
        assert report["appliedMigrations"] == []
        assert report["sqlite"].endswith("fb.sqlite3")
