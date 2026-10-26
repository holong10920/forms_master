"""CT-26 SQLite domain interleavings, with trusted ledger/deployment inputs supplied as fixtures.

Not Git ledger integration, DynamoDB Local, AWS or production concurrency evidence.
"""

import json
import threading
from collections.abc import Callable
from pathlib import Path
from typing import Any

import pytest
from tools.local_p0.control import EFFECT, FBKS, PLUGIN, Control, Fault

SITE = "site_pc_synthetic"
SEC = "synthetic-security"
FORM = "frm_ct26"
REL = "dev_ct26"


@pytest.fixture
def c(tmp_path: Path) -> Any:
    store = Control(tmp_path)
    with store.atomic():
        store.ingest()
        for key in ("form:" + SITE + ":" + FORM, "release:" + REL):
            store.conn.execute("INSERT INTO gates VALUES (?, '[]')", (key,))
            store.conn.execute("INSERT INTO object_security VALUES (?,1,'{}')", (key,))
        store.conn.execute(
            "INSERT INTO managed_releases VALUES (?,?,?,?,?,0)",
            (REL, SITE, FORM, "review_fixture", json.dumps([*FBKS, EFFECT])),
        )
    yield store
    store.close()


def projected(c: Control) -> None:
    expected = c.derive(c.policy())
    for f in FBKS:
        assert (
            json.loads(
                c.conn.execute("SELECT blockers FROM gates WHERE key=?", ("fbk:" + f,)).fetchone()[
                    0
                ]
            )
            == expected
        )


def ordered(
    c: Control, first: Callable[[Control], None], second: Callable[[Control], None]
) -> None:
    """Both connections exist before commits; allow the second commit only after first finishes."""
    ready = threading.Barrier(2)
    committed = threading.Event()
    errors: list[BaseException] = []

    def worker(action: Callable[[Control], None], later: bool) -> None:
        other = None
        try:
            other = Control(c.data)
            ready.wait(5)
            if later:
                assert committed.wait(5)
            action(other)
        except BaseException as e:
            errors.append(e)
        finally:
            if not later:
                committed.set()
            if other:
                other.close()

    a = threading.Thread(target=worker, args=(first, False))
    b = threading.Thread(target=worker, args=(second, True))
    a.start()
    b.start()
    a.join(8)
    b.join(8)
    assert not a.is_alive() and not b.is_alive() and not errors, errors


def test_ct26_01_ingestion_and_override(tmp_path: Path) -> None:
    c = Control(tmp_path)
    try:
        with pytest.raises(Fault) as e:
            c.change_policy(SEC, SITE, 1, "override", True)
        assert e.value.status == 404
        with c.atomic():
            c.ingest()
        c.change_policy(SEC, SITE, 1, "override", True)
        projected(c)
    finally:
        c.close()


def test_ct26_02_override_add_and_close(c: Control) -> None:
    c.change_policy(SEC, SITE, 1, "override", True, "B")

    def add(a: Control) -> None:
        a.change_policy(SEC, SITE, 2, "override", True, "A")

    def close(b: Control) -> None:
        with pytest.raises(Fault, match="VERSION_CONFLICT"):
            b.change_policy(SEC, SITE, 2, "override", False, "B")
        b.change_policy(SEC, SITE, b.policy()["version"], "override", False, "B")

    ordered(c, add, close)
    assert c.policy()["overrides"] == {"A": True, "B": False}
    projected(c)


def test_ct26_03_override_and_m3(c: Control) -> None:
    def override(a: Control) -> None:
        a.change_policy(SEC, SITE, 1, "override", True)

    def m3(b: Control) -> None:
        with pytest.raises(Fault, match="VERSION_CONFLICT"):
            b.change_policy(SEC, SITE, 1, "m3", True)
        b.change_policy(SEC, SITE, b.policy()["version"], "m3", True)

    ordered(c, override, m3)
    c.change_policy(SEC, SITE, c.policy()["version"], "override", False)
    assert c.policy()["m3"]
    projected(c)


def test_ct26_04_ledger_and_override(c: Control) -> None:
    def ledger(a: Control) -> None:
        a.sync_ledger(SEC, SITE, 2, "revoked", "synthetic-ledger-2")

    def resume(b: Control) -> None:
        with pytest.raises(Fault, match="VERSION_CONFLICT"):
            b.change_policy(SEC, SITE, 1, "override", False)
        b.change_policy(SEC, SITE, b.policy()["version"], "override", False)

    ordered(c, ledger, resume)
    assert c.policy()["ledger"] == "revoked"
    projected(c)


@pytest.mark.parametrize("revoke_first", [True, False])
def test_ct26_05_revoke_and_submit(c: Control, revoke_first: bool) -> None:
    def revoke(a: Control) -> None:
        a.change_policy(SEC, SITE, 1, "override", True)

    def submit(b: Control) -> None:
        request = {"payload": {}, "idempotencyKey": "synthetic-ct26"}
        if revoke_first:
            with pytest.raises(Fault) as e:
                b.submit(REL, request, {})
            assert e.value.status == 423
        else:
            assert b.submit(REL, request, {})["ok"]

    ordered(c, revoke if revoke_first else submit, submit if revoke_first else revoke)
    assert c.conn.execute("SELECT COUNT(*) FROM submissions").fetchone()[0] == int(not revoke_first)
    projected(c)


@pytest.mark.parametrize("repair_first", [True, False])
def test_ct26_06_repair_and_override(c: Control, repair_first: bool) -> None:
    def repair(a: Control) -> None:
        expected = 1
        if not repair_first:
            with pytest.raises(Fault, match="VERSION_CONFLICT"):
                a.repair_policy(SEC, SITE, expected)
            expected = a.policy()["version"]
        a.repair_policy(SEC, SITE, expected)

    def revoke(b: Control) -> None:
        expected = 1
        if repair_first:
            with pytest.raises(Fault, match="VERSION_CONFLICT"):
                b.change_policy(SEC, SITE, expected, "override", True)
            expected = b.policy()["version"]
        b.change_policy(SEC, SITE, expected, "override", True)

    ordered(c, repair if repair_first else revoke, revoke if repair_first else repair)
    assert c.derive(c.policy())
    projected(c)


def test_ct26_07_missing_gate(c: Control) -> None:
    c.conn.execute("DELETE FROM gates WHERE key=?", ("fbk:" + FBKS[0],))
    with pytest.raises(Fault) as e:
        c.admission(REL)
    assert e.value.status == 503
    with pytest.raises(Fault):
        c.change_policy(SEC, SITE, 1, "override", True)
    assert c.policy()["version"] == 1
    c.repair_policy(SEC, SITE, 1)
    projected(c)


def test_ct26_08_missing_authority(c: Control) -> None:
    c.conn.execute("DELETE FROM capabilities WHERE prk=?", (PLUGIN,))
    with pytest.raises(Fault) as e:
        c.policy()
    assert e.value.status == 503
    with pytest.raises(Fault) as e:
        c.change_policy(SEC, SITE, 1, "override", True)
    assert e.value.status == 404


@pytest.mark.parametrize("last", [True, False])
def test_ct26_09_resume_revoke_same_override(c: Control, last: bool) -> None:
    def first(a: Control) -> None:
        a.change_policy(SEC, SITE, 1, "override", not last)

    def second(b: Control) -> None:
        with pytest.raises(Fault, match="VERSION_CONFLICT"):
            b.change_policy(SEC, SITE, 1, "override", last)
        b.change_policy(SEC, SITE, b.policy()["version"], "override", last)

    ordered(c, first, second)
    assert bool(c.derive(c.policy())) == last
    projected(c)


@pytest.mark.parametrize("deploy_first", [True, False])
def test_ct26_10_deployment_exemption_and_open_gate(c: Control, deploy_first: bool) -> None:
    c.change_policy(SEC, SITE, 1, "override", True)

    def deploy(a: Control) -> None:
        if deploy_first:
            a.deploy_adapters(SEC, SITE, 1, [EFFECT])
        else:
            with pytest.raises(Fault, match="ADAPTER_REQUIRED"):
                a.deploy_adapters(SEC, SITE, 1, [EFFECT])

    def resume(b: Control) -> None:
        if deploy_first:
            with pytest.raises(Fault, match="ADAPTER_NOT_DEPLOYED"):
                b.change_policy(SEC, SITE, 2, "override", False)
        else:
            b.change_policy(SEC, SITE, 2, "override", False)

    ordered(c, deploy if deploy_first else resume, resume if deploy_first else deploy)
    assert bool(c.derive(c.policy())) == deploy_first
    projected(c)


def test_m3_alone_cannot_exempt_adapter(c: Control) -> None:
    c.change_policy(SEC, SITE, 1, "m3", True)
    with pytest.raises(Fault, match="ADAPTER_REQUIRED"):
        c.deploy_adapters(SEC, SITE, 1, [EFFECT])


@pytest.mark.parametrize("sync_first", [True, False])
def test_ct26_11_ledger_and_ingestion(tmp_path: Path, sync_first: bool) -> None:
    c = Control(tmp_path)
    try:
        if sync_first:
            c.sync_ledger(SEC, SITE, 2, "revoked", "synthetic-ledger-2")
            with pytest.raises(Fault, match="LEDGER_STALE"), c.atomic():
                c.ingest(1)
            with c.atomic():
                c.ingest()
        else:
            with c.atomic():
                c.ingest()
            c.sync_ledger(SEC, SITE, 2, "revoked", "synthetic-ledger-2")
        assert c.policy()["seq"] == 2 and c.policy()["ledger"] == "revoked"
        projected(c)
    finally:
        c.close()


@pytest.mark.parametrize("newest_first", [True, False])
def test_ct26_11a_ledger_never_moves_back(c: Control, newest_first: bool) -> None:
    def old(a: Control) -> None:
        a.sync_ledger(SEC, SITE, 2, "vulnerable", "synthetic-ledger-2")

    def new(b: Control) -> None:
        b.sync_ledger(SEC, SITE, 3, "revoked", "synthetic-ledger-3")

    ordered(c, new if newest_first else old, old if newest_first else new)
    assert c.policy()["seq"] == 3 and c.policy()["ledger"] == "revoked"
    projected(c)


@pytest.mark.parametrize("add_first", [True, False])
@pytest.mark.parametrize("release", [None, REL])
def test_ct26_12_13_independent_object_holds(
    c: Control, add_first: bool, release: str | None
) -> None:
    """Two connections read version 2; stale writer retries without dropping the other incident."""
    source_a, source_b = ("security", "security") if release else ("M4", "M5")
    c.change_hold(SEC, SITE, FORM, 1, source_a, "A", True, release)
    conflicts: list[str] = []

    def mutate(store: Control, source: str, incident: str, blocked: bool) -> None:
        try:
            store.change_hold(SEC, SITE, FORM, 2, source, incident, blocked, release)
        except Fault as error:
            assert error.code == "VERSION_CONFLICT"
            conflicts.append(incident)
            current = store.object_holds(SITE, FORM, release)
            store.change_hold(
                SEC, SITE, FORM, current["version"], source, incident, blocked, release
            )

    def add(store: Control) -> None:
        mutate(store, source_b, "B", True)

    def clear(store: Control) -> None:
        mutate(store, source_a, "A", False)

    ordered(c, add if add_first else clear, clear if add_first else add)
    assert conflicts == (["A"] if add_first else ["B"])
    holds = c.object_holds(SITE, FORM, release)
    assert holds["sources"] == {source_b + ":B": source_b}
    assert holds["version"] == 4
    with pytest.raises(Fault, match="E-RELEASE-SUSPENDED" if release else "E-FORM-SUSPENDED"):
        c.admission(REL)
