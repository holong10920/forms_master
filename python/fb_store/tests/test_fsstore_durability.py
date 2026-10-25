"""Directory durability: every directory whose entries change is synced (CP3 review M2)."""

import errno
import fcntl
import hashlib
import os
from pathlib import Path
from typing import Any

import pytest

from fb_store import fsstore
from fb_store.fsstore import FsReleaseObjectStore, PutResult

KEY = "releases/rel_a/assets/app.js"
DATA = b"payload"
SHA = hashlib.sha256(DATA).hexdigest()


def _record_syncs(monkeypatch: pytest.MonkeyPatch) -> list[int]:
    inodes: list[int] = []
    real = fsstore._sync

    def recording(fd: int) -> None:
        inodes.append(os.fstat(fd).st_ino)
        real(fd)

    monkeypatch.setattr(fsstore, "_sync", recording)
    return inodes


def test_new_parents_root_and_target_dir_are_synced(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    synced = _record_syncs(monkeypatch)
    root = tmp_path / "new" / "root"
    FsReleaseObjectStore(root).put_write_once(KEY, DATA, SHA)
    for directory in (
        tmp_path,
        tmp_path / "new",
        root,
        root / "releases",
        root / "releases/rel_a",
        root / "releases/rel_a/assets",
    ):
        assert directory.stat().st_ino in synced, f"{directory} not synced"


def test_already_exists_path_syncs_the_directory(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    store = FsReleaseObjectStore(tmp_path)
    store.put_write_once(KEY, DATA, SHA)
    synced = _record_syncs(monkeypatch)
    assert store.put_write_once(KEY, DATA, SHA) is PutResult.ALREADY_EXISTS
    assert (tmp_path / "releases/rel_a/assets").stat().st_ino in synced


def test_failed_directory_sync_after_link_is_repaired_by_retry(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    linked = False
    real_link, real_sync = os.link, fsstore._sync

    def link(*args: Any, **kwargs: Any) -> None:
        nonlocal linked
        real_link(*args, **kwargs)
        linked = True

    def sync(fd: int) -> None:
        if linked:
            raise OSError(5, "injected dir fsync error")
        real_sync(fd)

    monkeypatch.setattr(os, "link", link)
    monkeypatch.setattr(fsstore, "_sync", sync)
    store = FsReleaseObjectStore(tmp_path)
    with pytest.raises(OSError, match="injected"):
        store.put_write_once(KEY, DATA, SHA)
    monkeypatch.undo()
    # The object is visible (link happened) but the put reported failure; the caller retries.
    synced = _record_syncs(monkeypatch)
    assert store.put_write_once(KEY, DATA, SHA) is PutResult.ALREADY_EXISTS
    assert (tmp_path / "releases/rel_a/assets").stat().st_ino in synced
    assert not any(p.name.startswith(".tmp-") for p in tmp_path.rglob("*"))


def test_mkdir_failure_leaves_nothing(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    store = FsReleaseObjectStore(tmp_path)
    store.put_write_once("releases/x/y.js", DATA, SHA)  # root exists

    def fail(*_args: Any, **_kwargs: Any) -> None:
        raise OSError(28, "injected ENOSPC")

    monkeypatch.setattr(os, "mkdir", fail)
    with pytest.raises(OSError, match="injected"):
        store.put_write_once(KEY, DATA, SHA)
    monkeypatch.undo()
    assert not (tmp_path / KEY).exists()
    assert not any(p.name.startswith(".tmp-") for p in tmp_path.rglob("*"))


@pytest.mark.parametrize(
    ("err", "fails"),
    [
        (err, False)
        for err in sorted(
            {errno.ENOTSUP, errno.EINVAL, errno.ENOTTY}
            | ({errno.EOPNOTSUPP} if hasattr(errno, "EOPNOTSUPP") else set())
        )
    ]
    + [(errno.EIO, True), (errno.ENOSPC, True)],
)
def test_full_fsync_fallback_only_when_unsupported(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, err: int, fails: bool
) -> None:
    if fsstore._FULLFSYNC is None:
        pytest.skip("platform without F_FULLFSYNC")

    def fcntl_fail(_fd: int, _cmd: int, *_args: Any) -> int:
        raise OSError(err, "injected")

    monkeypatch.setattr(fcntl, "fcntl", fcntl_fail)
    store = FsReleaseObjectStore(tmp_path)
    if fails:
        with pytest.raises(OSError, match="injected"):
            store.put_write_once(KEY, DATA, SHA)
    else:
        assert store.put_write_once(KEY, DATA, SHA) is PutResult.CREATED
