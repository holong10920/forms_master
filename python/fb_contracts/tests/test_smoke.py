import fb_contracts


def test_package_identity() -> None:
    assert fb_contracts.__name__ == "fb_contracts"
