import hashlib
import json
import subprocess
import sys
import threading
from pathlib import Path

from fb_store.errors import PayloadIntegrityError
from fb_store.fsstore import FsReleaseObjectStore, PutResult

KEY = "staging/d/app.js"


def _sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _run_threads(root: Path, payloads: list[bytes]) -> list[object]:
    store = FsReleaseObjectStore(root)
    barrier = threading.Barrier(len(payloads), timeout=10)
    errors: list[BaseException] = []
    lock = threading.Lock()
    results: list[object] = [None] * len(payloads)

    def work(i: int) -> None:
        try:
            barrier.wait()
            results[i] = store.put_write_once(KEY, payloads[i], _sha(payloads[i]))
        except PayloadIntegrityError as e:
            results[i] = e
        except BaseException as e:
            with lock:
                errors.append(e)

    threads = [threading.Thread(target=work, args=(i,)) for i in range(len(payloads))]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    assert not errors, errors
    return results


def _no_temp_files(root: Path) -> bool:
    return not any(p.name.startswith(".tmp-") for p in root.rglob("*"))


def test_threads_same_bytes_one_created(tmp_path: Path) -> None:
    results = _run_threads(tmp_path, [b"same"] * 8)
    assert results.count(PutResult.CREATED) == 1
    assert results.count(PutResult.ALREADY_EXISTS) == 7
    assert _no_temp_files(tmp_path)


def test_threads_different_bytes_one_wins(tmp_path: Path) -> None:
    results = _run_threads(tmp_path, [b"first", b"second"])
    assert results.count(PutResult.CREATED) == 1
    assert sum(isinstance(r, PayloadIntegrityError) for r in results) == 1
    winner = b"first" if results[0] is PutResult.CREATED else b"second"
    assert FsReleaseObjectStore(tmp_path).read(KEY) == winner
    assert _no_temp_files(tmp_path)


_WORKER = """
import hashlib, json, sys, time
from pathlib import Path
from fb_store.errors import PayloadIntegrityError
from fb_store.fsstore import FsReleaseObjectStore
root, data, start = Path(sys.argv[1]), sys.argv[2].encode(), float(sys.argv[3])
while time.time() < start:
    pass
try:
    store = FsReleaseObjectStore(root)
    r = store.put_write_once("staging/d/app.js", data, hashlib.sha256(data).hexdigest())
    print(json.dumps(r.value))
except PayloadIntegrityError:
    print(json.dumps("integrity"))
"""


def _run_processes(root: Path, payloads: list[str]) -> list[str]:
    import time

    start = time.time() + 1.0
    procs = [
        subprocess.Popen(
            [sys.executable, "-c", _WORKER, str(root), p, str(start)],
            stdout=subprocess.PIPE,
            text=True,
        )
        for p in payloads
    ]
    return [json.loads(p.communicate(timeout=30)[0]) for p in procs]


def test_processes_same_bytes_one_created(tmp_path: Path) -> None:
    results = _run_processes(tmp_path, ["same"] * 6)
    assert sorted(results) == ["already_exists"] * 5 + ["created"]
    assert _no_temp_files(tmp_path)


def test_processes_different_bytes_one_wins(tmp_path: Path) -> None:
    results = _run_processes(tmp_path, ["aaa", "bbb", "ccc"])
    assert results.count("created") == 1
    assert results.count("integrity") == 2
    winner = ["aaa", "bbb", "ccc"][results.index("created")]
    assert FsReleaseObjectStore(tmp_path).read(KEY) == winner.encode()
    assert _no_temp_files(tmp_path)
