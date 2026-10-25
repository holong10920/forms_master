import hashlib
import stat
from pathlib import Path

import pytest

from fb_store.errors import PayloadIntegrityError
from fb_store.fsstore import FsReleaseObjectStore, PutResult

KEY = "releases/rel_abc/assets/app.js"


def _sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def test_write_once_then_read(tmp_path: Path) -> None:
    store = FsReleaseObjectStore(tmp_path)
    assert store.put_write_once(KEY, b"a", _sha(b"a")) is PutResult.CREATED
    assert store.read(KEY) == b"a"


def test_same_content_again_is_noop(tmp_path: Path) -> None:
    store = FsReleaseObjectStore(tmp_path)
    store.put_write_once(KEY, b"a", _sha(b"a"))
    assert store.put_write_once(KEY, b"a", _sha(b"a")) is PutResult.ALREADY_EXISTS


def test_different_content_is_integrity_error_and_original_kept(tmp_path: Path) -> None:
    store = FsReleaseObjectStore(tmp_path)
    store.put_write_once(KEY, b"a", _sha(b"a"))
    with pytest.raises(PayloadIntegrityError):
        store.put_write_once(KEY, b"b", _sha(b"b"))
    assert store.read(KEY) == b"a"


def test_written_object_is_read_only(tmp_path: Path) -> None:
    FsReleaseObjectStore(tmp_path).put_write_once(KEY, b"a", _sha(b"a"))
    mode = stat.S_IMODE((tmp_path / KEY).stat().st_mode)
    assert mode == 0o444


def test_read_missing_key(tmp_path: Path) -> None:
    with pytest.raises(FileNotFoundError):
        FsReleaseObjectStore(tmp_path).read(KEY)


def test_empty_object_round_trips(tmp_path: Path) -> None:
    store = FsReleaseObjectStore(tmp_path)
    store.put_write_once("staging/d/empty.css", b"", _sha(b""))
    assert store.read("staging/d/empty.css") == b""
