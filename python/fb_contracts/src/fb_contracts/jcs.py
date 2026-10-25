"""RFC 8785 (JCS) canonical JSON.

Serialization is delegated to ``rfc8785``; this module only enforces the S0 value domain so that
Python and TypeScript accept and reject the same inputs.
"""

import math
from typing import Any, cast

import rfc8785

MAX_SAFE_MAGNITUDE = 2**53 - 1
# Maximum container nesting (root container = depth 1). Same limit in packages/contracts/src/jcs.ts.
MAX_DEPTH = 128


class JcsError(ValueError):
    code = "E-JCS-UNSUPPORTED-VALUE"


def _is_well_formed(s: str) -> bool:
    try:
        s.encode("utf-8")
    except UnicodeEncodeError:
        return False
    return True


def _assert_supported(value: object, path: str, depth: int) -> None:
    if value is None or isinstance(value, bool):
        return
    if isinstance(value, int | float):
        if isinstance(value, float) and not math.isfinite(value):
            raise JcsError(f"non-finite number at {path}")
        if abs(value) > MAX_SAFE_MAGNITUDE:
            raise JcsError(f"number outside ±(2^53-1) at {path}")
        return
    if isinstance(value, str):
        if not _is_well_formed(value):
            raise JcsError(f"lone surrogate in string at {path}")
        return
    if isinstance(value, list | dict) and depth >= MAX_DEPTH:
        raise JcsError(f"nesting deeper than {MAX_DEPTH} at {path}")
    if isinstance(value, list):
        for index, item in enumerate(value):
            _assert_supported(item, f"{path}/{index}", depth + 1)
        return
    if isinstance(value, dict):
        for key, item in value.items():
            if not isinstance(key, str):
                raise JcsError(f"non-string key at {path}")
            if not _is_well_formed(key):
                raise JcsError(f"lone surrogate in key at {path}")
            _assert_supported(item, f"{path}/{key}", depth + 1)
        return
    raise JcsError(f"unsupported {type(value).__name__} at {path}")


def canonical_json(value: object) -> bytes:
    _assert_supported(value, "", 0)
    # The value domain is checked above; rfc8785's input type alias is private.
    return rfc8785.dumps(cast(Any, value))
