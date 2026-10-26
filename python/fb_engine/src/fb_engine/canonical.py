"""Version 1 structured canonicalization, spec #1 section 7.6.5."""

import re
import unicodedata

TRIM = (
    "\u0009\u000a\u000b\u000c\u000d\u0020\u00a0\u1680"
    "\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a"
    "\u2028\u2029\u202f\u205f\u3000\ufeff"
)


def canonical(value: str, kind: str) -> str:
    if kind.startswith("choice.") or kind.startswith("plugin:"):
        return value
    text = value.strip(TRIM)
    if kind == "textarea":
        text = text.replace("\r\n", "\n")
    if kind == "email":
        text = "".join(chr(ord(c) - 0xFEE0) if "\uff01" <= c <= "\uff5e" else c for c in text)
    if kind in ("tel", "postal"):
        text = "".join(chr(ord(c) - 0xFEE0) if "\uff10" <= c <= "\uff19" else c for c in text)
        text = "".join(c for c in text if c not in TRIM + "-\uff0d\u30fc\u2010")
    if kind == "katakana":
        text = re.sub(r"[\uff61-\uff9f]+", lambda m: unicodedata.normalize("NFKC", m[0]), text)
    return text
