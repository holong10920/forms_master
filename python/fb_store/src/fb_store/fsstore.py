"""Write-once local filesystem stores (spec #5 sections 5.3 and 11.1).

Implements the BlobStore and ReleaseObjectStore ports.

Every path component below the store root is opened through a directory file descriptor with
O_NOFOLLOW, so a symlink anywhere in the key path is refused rather than followed (no
check-then-use race). Writes go to a temp file in the target directory, are synced, made
read-only, then published with link(2), which fails if the name exists. Every directory whose
entries change (new parents, the root, the target directory) is synced before put() returns, on
the ALREADY_EXISTS path too. On macOS, syncs use F_FULLFSYNC (plain fsync is not a stable-storage
barrier there). Only regular files are read, without blocking. An existing object with different
bytes is an integrity incident, never overwritten.
"""

import enum
import errno
import fcntl
import hashlib
import os
import re
import stat
import uuid
from collections.abc import Iterator, Mapping
from contextlib import contextmanager, suppress
from pathlib import Path

from fb_contracts.digest import is_sha256_hex
from fb_contracts.jcs import JcsError, canonical_json
from fb_contracts.payload_ref import check_payload_ref
from fb_contracts.schema import validate_schema
from fb_store.errors import DigestMismatch, InvalidStoreKey, PayloadIntegrityError, StoreError

_SEGMENT = re.compile(r"[A-Za-z0-9_-][A-Za-z0-9._-]*")
MAX_KEY_LENGTH = 1024
MAX_SEGMENT_BYTES = 255
_TMP_PREFIX = ".tmp-"
_DIR_FLAGS = os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW
_FULLFSYNC = getattr(fcntl, "F_FULLFSYNC", None)


class PutResult(enum.Enum):
    CREATED = "created"
    ALREADY_EXISTS = "already_exists"


_FULLFSYNC_UNSUPPORTED = {errno.ENOTSUP, errno.EINVAL, errno.ENOTTY}
if hasattr(errno, "EOPNOTSUPP"):
    _FULLFSYNC_UNSUPPORTED.add(errno.EOPNOTSUPP)


def _sync(fd: int) -> None:
    """fsync, plus F_FULLFSYNC where the platform has it (macOS). Like SQLite, a filesystem that
    does not support F_FULLFSYNC falls back to the plain fsync already done; other errors raise."""
    os.fsync(fd)
    if _FULLFSYNC is not None:
        try:
            fcntl.fcntl(fd, _FULLFSYNC)
        except OSError as e:
            if e.errno not in _FULLFSYNC_UNSUPPORTED:
                raise


def _split_key(key: str, prefixes: frozenset[str]) -> list[str]:
    if not key or len(key) > MAX_KEY_LENGTH:
        raise InvalidStoreKey(f"invalid key length: {len(key)}")
    segments = key.split("/")
    if len(segments) < 2 or segments[0] not in prefixes:
        raise InvalidStoreKey(f"key must start with one of {sorted(prefixes)}: {key!r}")
    for segment in segments:
        if (
            _SEGMENT.fullmatch(segment) is None
            or segment in (".", "..")
            or len(segment) > MAX_SEGMENT_BYTES
        ):
            raise InvalidStoreKey(f"invalid key segment {segment[:40]!r} in key")
    return segments


def _open_dir(name: str, dir_fd: int, create: bool) -> int:
    """Opens (and with ``create``, makes) a child directory; a newly made one is synced into
    its parent."""
    if create:
        try:
            os.mkdir(name, 0o700, dir_fd=dir_fd)
        except FileExistsError:
            pass
        else:
            _sync(dir_fd)
    try:
        return os.open(name, _DIR_FLAGS, dir_fd=dir_fd)
    except OSError as e:
        if e.errno in (errno.ELOOP, errno.ENOTDIR):
            raise InvalidStoreKey(f"path component is not a plain directory: {name!r}") from e
        raise


def _read_regular(name: str, dir_fd: int, expected_size: int | None = None) -> bytes:
    """Reads a regular file without following symlinks or blocking on FIFOs/devices."""
    try:
        fd = os.open(name, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK, dir_fd=dir_fd)
    except OSError as e:
        if e.errno == errno.ELOOP:
            raise InvalidStoreKey(f"object is a symlink: {name!r}") from e
        raise
    try:
        info = os.fstat(fd)
        if not stat.S_ISREG(info.st_mode):
            raise InvalidStoreKey(f"object is not a regular file: {name!r}")
        if expected_size is not None and info.st_size != expected_size:
            raise PayloadIntegrityError(f"object size {info.st_size} != expected {expected_size}")
        chunks = []
        while chunk := os.read(fd, 1 << 20):
            chunks.append(chunk)
        return b"".join(chunks)
    finally:
        os.close(fd)


def _ensure_root(root: Path) -> None:
    """Creates the root (0700) and syncs every directory whose entries changed."""
    missing = []
    current = root
    while not current.exists():
        missing.append(current)
        current = current.parent
    for directory in reversed(missing):
        with suppress(FileExistsError):
            directory.mkdir(mode=0o700)
        parent_fd = os.open(directory.parent, os.O_RDONLY | os.O_DIRECTORY)
        try:
            _sync(parent_fd)
        finally:
            os.close(parent_fd)


class _WriteOnceFs:
    def __init__(self, root: Path, prefixes: frozenset[str]) -> None:
        self._root = root
        self._prefixes = prefixes

    @contextmanager
    def _parent_dir(self, segments: list[str], create: bool) -> Iterator[int]:
        if create:
            _ensure_root(self._root)
        fd = os.open(self._root, _DIR_FLAGS & ~os.O_NOFOLLOW)  # the root itself may be a symlink
        try:
            for name in segments[:-1]:
                child = _open_dir(name, fd, create)
                os.close(fd)
                fd = child
            yield fd
        finally:
            os.close(fd)

    @staticmethod
    def _compare_existing(name: str, dir_fd: int, data: bytes, sha256: str, key: str) -> PutResult:
        try:
            existing = _read_regular(name, dir_fd, expected_size=len(data))
        except PayloadIntegrityError:
            raise PayloadIntegrityError(f"{key!r} exists with different content") from None
        if hashlib.sha256(existing).hexdigest() != sha256:
            raise PayloadIntegrityError(f"{key!r} exists with different content")
        _sync(dir_fd)  # a racing writer may have linked it without syncing yet
        return PutResult.ALREADY_EXISTS

    def put(self, key: str, data: bytes, sha256: str) -> PutResult:
        segments = _split_key(key, self._prefixes)
        if hashlib.sha256(data).hexdigest() != sha256:
            raise DigestMismatch(f"sha256 does not match data for {key!r}")
        name = segments[-1]
        with self._parent_dir(segments, create=True) as dir_fd:
            with suppress(FileNotFoundError):
                return self._compare_existing(name, dir_fd, data, sha256, key)
            tmp = f"{_TMP_PREFIX}{uuid.uuid4().hex}"
            fd = os.open(
                tmp, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600, dir_fd=dir_fd
            )
            try:
                try:
                    view = memoryview(data)
                    while view:
                        view = view[os.write(fd, view) :]
                    _sync(fd)
                    os.fchmod(fd, 0o444)
                finally:
                    os.close(fd)
                try:
                    os.link(tmp, name, src_dir_fd=dir_fd, dst_dir_fd=dir_fd, follow_symlinks=False)
                except FileExistsError:
                    return self._compare_existing(name, dir_fd, data, sha256, key)
                _sync(dir_fd)
                return PutResult.CREATED
            finally:
                with suppress(FileNotFoundError):
                    os.unlink(tmp, dir_fd=dir_fd)

    def read(self, key: str, expected_size: int | None = None) -> bytes:
        segments = _split_key(key, self._prefixes)
        if not self._root.exists():
            raise FileNotFoundError(key)
        with self._parent_dir(segments, create=False) as dir_fd:
            return _read_regular(segments[-1], dir_fd, expected_size)


class FsReleaseObjectStore:
    """Release store: keys ``staging/...`` and ``releases/...`` (spec #5 section 6.2)."""

    def __init__(self, root: Path) -> None:
        self._fs = _WriteOnceFs(root, frozenset({"staging", "releases"}))

    def put_write_once(self, key: str, data: bytes, sha256: str) -> PutResult:
        return self._fs.put(key, data, sha256)

    def read(self, key: str) -> bytes:
        return self._fs.read(key)


class FsBlobStore:
    """Content-addressed blob store: key ``sha256/<hex>`` (spec #5 section 5.3)."""

    def __init__(self, root: Path) -> None:
        self._fs = _WriteOnceFs(root, frozenset({"sha256"}))

    def put_if_absent(self, sha256: str, data: bytes) -> PutResult:
        if not is_sha256_hex(sha256):
            raise InvalidStoreKey(f"not a lowercase sha256: {sha256!r}")
        return self._fs.put(f"sha256/{sha256}", data, sha256)

    def get_verified(self, ref: object) -> bytes:
        """Returns the payload bytes after checking them against ``ref``. Fails closed: a
        structurally or semantically invalid ref, a missing, unreadable, non-regular or
        mismatching blob, or an unsupported inline value all raise ``PayloadIntegrityError``
        (E-PAYLOAD-INTEGRITY)."""
        if not isinstance(ref, Mapping):
            raise PayloadIntegrityError("PayloadRef is not an object")
        if not validate_schema("payload-ref/v1", dict(ref)).valid or check_payload_ref(ref):
            raise PayloadIntegrityError("PayloadRef fails structural or semantic checks")
        sha256 = str(ref["sha256"])
        size = ref["size"]
        try:
            if "inline" in ref:
                data = canonical_json(ref["inline"])
            else:
                # The schema guarantees an integral size; JSON may carry it as 7.0.
                expected = int(size) if isinstance(size, int | float) else None
                data = self._fs.read(f"sha256/{sha256}", expected_size=expected)
        except PayloadIntegrityError:
            raise
        except (OSError, StoreError, JcsError) as e:
            raise PayloadIntegrityError(f"blob {sha256} unavailable: {type(e).__name__}") from e
        if hashlib.sha256(data).hexdigest() != sha256 or len(data) != size:
            raise PayloadIntegrityError(f"blob does not match its reference: {sha256}")
        return data
