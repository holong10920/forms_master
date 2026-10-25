"""get_verified fails closed on every bad input (CP3 review M3); no blocking reads."""

import hashlib
import os
import signal
import threading
from collections.abc import Iterator
from pathlib import Path

import pytest

from fb_store.errors import InvalidStoreKey, PayloadIntegrityError, StoreError
from fb_store.fsstore import FsBlobStore, FsReleaseObjectStore

DATA = b'{"k":1}'
SHA = hashlib.sha256(DATA).hexdigest()
BLOB = {"blobKey": f"sha256/{SHA}", "sha256": SHA, "size": len(DATA), "format": "jcs-json"}


@pytest.fixture(autouse=True)
def _no_hang() -> Iterator[None]:
    def timeout(*_args: object) -> None:
        raise TimeoutError("operation blocked")

    previous = signal.signal(signal.SIGALRM, timeout)
    signal.alarm(5)
    yield
    signal.alarm(0)
    signal.signal(signal.SIGALRM, previous)


@pytest.mark.parametrize(
    "ref",
    [
        {**BLOB, "size": True},
        {k: v for k, v in BLOB.items() if k != "format"},
        {**BLOB, "format": "raw"},
        {**BLOB, "extra": 1},
        [BLOB],
        "sha256/x",
        None,
        {"inline": float("nan"), "sha256": SHA, "size": 1, "format": "jcs-json"},
        {"inline": "\ud800", "sha256": SHA, "size": 1, "format": "jcs-json"},
    ],
    ids=[
        "size-bool",
        "format-missing",
        "format-raw",
        "extra-key",
        "list",
        "string",
        "none",
        "nan",
        "surrogate",
    ],
)
def test_malformed_refs_fail_closed(tmp_path: Path, ref: object) -> None:
    store = FsBlobStore(tmp_path)
    store.put_if_absent(SHA, DATA)
    with pytest.raises(PayloadIntegrityError):
        store.get_verified(ref)


def _blob_path(root: Path) -> Path:
    (root / "sha256").mkdir(parents=True, exist_ok=True)
    return root / "sha256" / SHA


def test_directory_at_blob_key(tmp_path: Path) -> None:
    _blob_path(tmp_path).mkdir()
    with pytest.raises(PayloadIntegrityError):
        FsBlobStore(tmp_path).get_verified(BLOB)
    with pytest.raises(StoreError):
        FsBlobStore(tmp_path).put_if_absent(SHA, DATA)


def test_fifo_at_blob_key_does_not_block(tmp_path: Path) -> None:
    os.mkfifo(_blob_path(tmp_path))
    with pytest.raises(PayloadIntegrityError):
        FsBlobStore(tmp_path).get_verified(BLOB)
    with pytest.raises(InvalidStoreKey):
        FsBlobStore(tmp_path).put_if_absent(SHA, DATA)
    assert not any(p.name.startswith(".tmp-") for p in tmp_path.rglob("*"))


def test_unreadable_blob(tmp_path: Path) -> None:
    store = FsBlobStore(tmp_path)
    store.put_if_absent(SHA, DATA)
    os.chmod(_blob_path(tmp_path), 0o000)
    try:
        with pytest.raises(PayloadIntegrityError):
            store.get_verified(BLOB)
    finally:
        os.chmod(_blob_path(tmp_path), 0o444)


def test_prefix_is_a_file(tmp_path: Path) -> None:
    (tmp_path / "sha256").write_bytes(b"x")
    with pytest.raises(PayloadIntegrityError):
        FsBlobStore(tmp_path).get_verified(BLOB)


def test_oversized_object_is_rejected_before_reading(tmp_path: Path) -> None:
    path = _blob_path(tmp_path)
    with path.open("wb") as f:
        f.truncate(512 * 1024 * 1024)  # sparse
    with pytest.raises(PayloadIntegrityError):
        FsBlobStore(tmp_path).get_verified(BLOB)


def test_long_segment_is_an_invalid_key(tmp_path: Path) -> None:
    with pytest.raises(InvalidStoreKey):
        FsReleaseObjectStore(tmp_path).put_write_once("staging/" + "a" * 300 + "/x.js", DATA, SHA)


def test_reader_never_sees_a_partial_object(tmp_path: Path) -> None:
    store = FsReleaseObjectStore(tmp_path)
    payload = os.urandom(1 << 20)
    sha = hashlib.sha256(payload).hexdigest()
    stop = threading.Event()
    bad: list[int] = []
    errors: list[BaseException] = []
    observed = threading.Event()

    def reader() -> None:
        try:
            while not stop.is_set():
                try:
                    got = store.read("staging/r/big.bin")
                except FileNotFoundError:
                    continue
                if got != payload:
                    bad.append(len(got))
                observed.set()
                stop.set()
        except BaseException as e:
            errors.append(e)
            stop.set()

    thread = threading.Thread(target=reader)
    thread.start()
    store.put_write_once("staging/r/big.bin", payload, sha)
    stop.wait(5)
    stop.set()
    thread.join()
    assert not errors, errors
    assert observed.is_set(), "reader did not observe the published object"
    assert bad == []


def _count_reads(monkeypatch: pytest.MonkeyPatch) -> list[int]:
    sizes: list[int] = []
    real = os.read

    def counting(fd: int, n: int) -> bytes:
        out = real(fd, n)
        sizes.append(len(out))
        return out

    monkeypatch.setattr(os, "read", counting)
    return sizes


@pytest.mark.parametrize("size", [len(DATA), float(len(DATA))], ids=["int", "integral-float"])
def test_oversized_object_is_not_read(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, size: float
) -> None:
    with _blob_path(tmp_path).open("wb") as f:
        f.truncate(512 * 1024 * 1024)
    reads = _count_reads(monkeypatch)
    with pytest.raises(PayloadIntegrityError):
        FsBlobStore(tmp_path).get_verified({**BLOB, "size": size})
    assert sum(reads) == 0


def test_reput_over_oversized_object_is_not_read(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    (tmp_path / "staging" / "d").mkdir(parents=True)
    with (tmp_path / "staging/d/x.js").open("wb") as f:
        f.truncate(512 * 1024 * 1024)
    reads = _count_reads(monkeypatch)
    with pytest.raises(PayloadIntegrityError):
        FsReleaseObjectStore(tmp_path).put_write_once("staging/d/x.js", DATA, SHA)
    assert sum(reads) == 0
