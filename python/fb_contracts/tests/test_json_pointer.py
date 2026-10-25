from fb_contracts.schema import json_pointer


def test_escapes_tilde_and_slash() -> None:
    assert json_pointer(["a/b", "m~n", 0]) == "/a~1b/m~0n/0"


def test_root_is_empty_string() -> None:
    assert json_pointer([]) == ""
