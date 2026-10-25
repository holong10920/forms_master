"""Failure injection: an error before the object is linked leaves no object and no temp file.

A failure after link (directory sync) is covered in test_fsstore_durability.py.
"""

import hashlib
import os
from pathlib import Path
from typing import Any

import pytest

from fb_store.errors import PayloadIntegrityError
from fb_store.fsstore import FsReleaseObjectStore, PutResult

KEY = "staging/d/app.js"
DATA = b"payload"
SHA = hashlib.sha256(DATA).hexdigest()


def _no_temp_files(root: Path) -> bool:
    return not any(p.name.startswith(".tmp-") for p in root.rglob("*"))


def _fail(*_args: Any, **_kwargs: Any) -> Any:
    raise OSError(5, "injected I/O error")


@pytest.mark.parametrize("step", ["write", "fsync", "fchmod", "link"])
def test_failure_at_step_leaves_nothing(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, step: str
) -> None:
    monkeypatch.setattr(os, step, _fail)
    store = FsReleaseObjectStore(tmp_path)
    with pytest.raises(OSError, match="injected"):
        store.put_write_once(KEY, DATA, SHA)
    monkeypatch.undo()
    assert not (tmp_path / KEY).exists()
    assert _no_temp_files(tmp_path)
    assert store.put_write_once(KEY, DATA, SHA) is PutResult.CREATED


def test_short_writes_are_completed(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    real_write = os.write

    def one_byte_write(fd: int, data: Any) -> int:
        return real_write(fd, bytes(data)[:1])

    monkeypatch.setattr(os, "write", one_byte_write)
    store = FsReleaseObjectStore(tmp_path)
    store.put_write_once(KEY, DATA, SHA)
    monkeypatch.undo()
    assert store.read(KEY) == DATA


def test_partial_object_at_final_path_is_detected(tmp_path: Path) -> None:
    (tmp_path / "staging" / "d").mkdir(parents=True)
    (tmp_path / KEY).write_bytes(DATA[:3])
    with pytest.raises(PayloadIntegrityError):
        FsReleaseObjectStore(tmp_path).put_write_once(KEY, DATA, SHA)
