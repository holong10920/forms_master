"""Negative fixture proves import-linter rejects the forbidden dependency direction."""

import os
import subprocess
import sys
from pathlib import Path


def test_forbidden_import_is_rejected(tmp_path: Path) -> None:
    for name in ("a", "b"):
        (tmp_path / name).mkdir()
        (tmp_path / name / "__init__.py").write_text("import b\n" if name == "a" else "")
    config = tmp_path / ".importlinter"
    config.write_text(
        "[importlinter]\nroot_packages = a\n    b\n"
        "[importlinter:contract:negative]\nname = no a to b\ntype = forbidden\n"
        "source_modules = a\nforbidden_modules = b\n"
    )
    env = {**os.environ, "PYTHONPATH": str(tmp_path)}
    result = subprocess.run(
        [str(Path(sys.executable).parent / "lint-imports"), "--config", str(config)],
        cwd=tmp_path,
        env=env,
        capture_output=True,
        text=True,
        check=False,
        timeout=30,
    )
    assert result.returncode == 1
    assert "no a to b BROKEN" in result.stdout
    assert "a -> b" in result.stdout
