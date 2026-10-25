import fb_store


def test_package_identity() -> None:
    assert fb_store.__name__ == "fb_store"
