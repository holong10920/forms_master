#!/bin/sh
set -eu
# CLI decision: no Docker/mirror/download fallback. Missing scanner is a failing gate.
repo_root=$(CDPATH='' cd -- "$(dirname -- "$0")/../.." && pwd)
if ! command -v gitleaks >/dev/null 2>&1; then
  echo 'BLOCKED: Gitleaks CLI 8.30.1 is required; security gate is not PASS.' >&2
  exit 127
fi
if [ "$(gitleaks version)" != '8.30.1' ]; then
  echo 'BLOCKED: expected Gitleaks CLI 8.30.1.' >&2
  exit 2
fi
exec gitleaks dir "${1:-$repo_root}" --config "$repo_root/.gitleaks.toml" --redact --no-banner --exit-code 1
