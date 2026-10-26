#!/bin/sh
set -eu
export PATH="$PWD/.tools/bin:$PATH"
export UV_CACHE_DIR="${UV_CACHE_DIR:-/tmp/forms-master-uv-cache}"
export FB_DATA_MODE=synthetic
export FB_NETWORK_SANDBOX=required
if [ "$(uname -s)" != Darwin ] || [ ! -x /usr/bin/sandbox-exec ]; then
  echo 'BLOCKED_BY_ENVIRONMENT: verified local network sandbox required' >&2
  exit 1
fi
exec /usr/bin/sandbox-exec -f tools/local_p0/network.sb /usr/bin/env -i   PATH="$PATH" HOME="$HOME" TMPDIR="${TMPDIR:-/tmp}" LANG=en_US.UTF-8   UV_CACHE_DIR="$UV_CACHE_DIR" FB_DATA_MODE=synthetic FB_NETWORK_SANDBOX=required   node tools/local_p0/host.ts
