"""Execute under the same kernel sandbox as each Python role; no credential output."""

import json
import socket
import sys

from tools.local_p0.config import enforce

enforce()
role = sys.argv[1]
s = socket.socket()
try:
    s.settimeout(1)
    s.connect(("198.51.100.1", 80))
except PermissionError:
    denied = True
else:
    raise RuntimeError("E-EGRESS-NOT-DENIED")
finally:
    s.close()
with socket.create_connection(("127.0.0.1", 4175), timeout=2) as local:
    local.sendall(b"GET / HTTP/1.1\r\nHost: 127.0.0.1:4175\r\nConnection: close\r\n\r\n")
    if b"200" not in local.recv(128):
        raise RuntimeError("E-LOCAL-DENIED")
print(json.dumps({"role": role, "externalDeniedByKernel": denied, "localAllowed": True}))
