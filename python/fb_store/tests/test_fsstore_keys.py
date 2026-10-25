import hashlib
import os
from pathlib import Path

import pytest

from fb_store.errors import InvalidStoreKey
from fb_store.fsstore import FsBlobStore, FsReleaseObjectStore

DATA = b"x"
SHA = hashlib.sha256(DATA).hexdigest()

BAD_KEYS = [
    "../x",
    "/abs",
    "staging/../releases/x",
    "staging/./x",
    "staging/a\\b",
    "staging/.hidden",
    "staging//x",
    "staging/x/",
    "other/x",
    "staging",
    "",
    "staging/%2e%2e/x",
    "staging/a b",
    "staging/é",
    "staging/a\x00b",
    "staging/" + "a" * 1100,
]


@pytest.mark.parametrize("key", BAD_KEYS)
def test_invalid_keys_are_rejected_for_write_and_read(tmp_path: Path, key: str) -> None:
    store = FsReleaseObjectStore(tmp_path / "root")
    with pytest.raises(InvalidStoreKey):
        store.put_write_once(key, DATA, SHA)
    with pytest.raises(InvalidStoreKey):
        store.read(key)
    assert not (tmp_path / "x").exists()


def test_symlinked_directory_inside_root_is_rejected(tmp_path: Path) -> None:
    root = tmp_path / "root"
    outside = tmp_path / "outside"
    (root / "staging").mkdir(parents=True)
    outside.mkdir()
    os.symlink(outside, root / "staging" / "evil")
    store = FsReleaseObjectStore(root)
    with pytest.raises(InvalidStoreKey):
        store.put_write_once("staging/evil/x.js", DATA, SHA)
    with pytest.raises(InvalidStoreKey):
        store.read("staging/evil/x.js")
    assert list(outside.iterdir()) == []


def test_symlinked_final_file_is_not_followed(tmp_path: Path) -> None:
    root = tmp_path / "root"
    target = tmp_path / "secret.txt"
    target.write_bytes(b"secret")
    (root / "staging" / "d").mkdir(parents=True)
    os.symlink(target, root / "staging" / "d" / "x.js")
    store = FsReleaseObjectStore(root)
    with pytest.raises(InvalidStoreKey):
        store.read("staging/d/x.js")
    with pytest.raises(InvalidStoreKey):
        store.put_write_once("staging/d/x.js", DATA, SHA)
    assert target.read_bytes() == b"secret"


def test_blob_store_only_accepts_lowercase_sha256(tmp_path: Path) -> None:
    store = FsBlobStore(tmp_path)
    with pytest.raises(InvalidStoreKey):
        store.put_if_absent("../" + SHA[3:], DATA)
    with pytest.raises(InvalidStoreKey):
        store.put_if_absent(SHA.upper(), DATA)


def test_crash_leftover_temp_file_is_harmless(tmp_path: Path) -> None:
    store = FsReleaseObjectStore(tmp_path)
    (tmp_path / "staging" / "x").mkdir(parents=True)
    (tmp_path / "staging" / "x" / ".tmp-dead").write_bytes(b"partial")
    store.put_write_once("staging/x/a.js", DATA, SHA)
    assert store.read("staging/x/a.js") == DATA
    with pytest.raises(InvalidStoreKey):
        store.read("staging/x/.tmp-dead")
