import socket

import pytest
from pytest_socket import SocketBlockedError


@pytest.mark.filterwarnings("ignore:A test tried to use socket")
def test_outbound_socket_is_blocked() -> None:
    with pytest.raises(SocketBlockedError):
        socket.create_connection(("127.0.0.1", 9))
