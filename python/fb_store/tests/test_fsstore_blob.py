import hashlib
import os
from pathlib import Path

import pytest

from fb_contracts.jcs import canonical_json
from fb_store.errors import DigestMismatch, PayloadIntegrityError
from fb_store.fsstore import FsBlobStore, PutResult

DATA = b'{"k":1}'
SHA = hashlib.sha256(DATA).hexdigest()


def _ref(**overrides: object) -> dict[str, object]:
    ref: dict[str, object] = {
        "blobKey": f"sha256/{SHA}",
        "sha256": SHA,
        "size": len(DATA),
        "format": "jcs-json",
    }
    ref.update(overrides)
    return ref


def _make_writable(path: Path) -> None:
    os.chmod(path, 0o644)


def test_put_then_get_verified(tmp_path: Path) -> None:
    store = FsBlobStore(tmp_path)
    assert store.put_if_absent(SHA, DATA) is PutResult.CREATED
    assert store.get_verified(_ref()) == DATA


def test_second_put_same_bytes_is_noop(tmp_path: Path) -> None:
    store = FsBlobStore(tmp_path)
    store.put_if_absent(SHA, DATA)
    assert store.put_if_absent(SHA, DATA) is PutResult.ALREADY_EXISTS


def test_put_rejects_digest_mismatch_and_writes_nothing(tmp_path: Path) -> None:
    store = FsBlobStore(tmp_path)
    with pytest.raises(DigestMismatch):
        store.put_if_absent("0" * 64, DATA)
    assert list(tmp_path.rglob("*")) == []


def test_corrupted_blob_fails_integrity(tmp_path: Path) -> None:
    store = FsBlobStore(tmp_path)
    store.put_if_absent(SHA, DATA)
    path = tmp_path / "sha256" / SHA
    _make_writable(path)
    path.write_bytes(b'{"k":2}')
    with pytest.raises(PayloadIntegrityError):
        store.get_verified(_ref())


def test_truncated_blob_fails_integrity(tmp_path: Path) -> None:
    store = FsBlobStore(tmp_path)
    store.put_if_absent(SHA, DATA)
    path = tmp_path / "sha256" / SHA
    _make_writable(path)
    path.write_bytes(DATA[:3])
    with pytest.raises(PayloadIntegrityError):
        store.get_verified(_ref())


def test_wrong_size_fails_integrity(tmp_path: Path) -> None:
    store = FsBlobStore(tmp_path)
    store.put_if_absent(SHA, DATA)
    with pytest.raises(PayloadIntegrityError):
        store.get_verified(_ref(size=len(DATA) + 1))


def test_missing_blob_fails_integrity(tmp_path: Path) -> None:
    with pytest.raises(PayloadIntegrityError):
        FsBlobStore(tmp_path).get_verified(_ref())


def test_semantically_invalid_ref_fails_integrity(tmp_path: Path) -> None:
    store = FsBlobStore(tmp_path)
    store.put_if_absent(SHA, DATA)
    with pytest.raises(PayloadIntegrityError):
        store.get_verified(_ref(blobKey=f"sha256/{'b' * 64}"))


def test_inline_ref_is_verified_and_returns_canonical_bytes(tmp_path: Path) -> None:
    inline = {"k": 1}
    body = canonical_json(inline)
    ref = {
        "inline": inline,
        "sha256": hashlib.sha256(body).hexdigest(),
        "size": len(body),
        "format": "jcs-json",
    }
    assert FsBlobStore(tmp_path).get_verified(ref) == body
    with pytest.raises(PayloadIntegrityError):
        FsBlobStore(tmp_path).get_verified({**ref, "inline": {"k": 2}})
