# T12 / canonical K13 handoff

Status: **BLOCKED_BY_ENVIRONMENT / VERIFICATION_PENDING**. Owner: platform/build maintainer.
Exit deadline: before full S2 acceptance. Local synthetic host acceptance does not close this gate.
No registry troubleshooting, container build or canonical container verification was performed
in this handoff. Cached Playwright Node 24.14.1 is incompatible with required Node 24.22.1.

## Required image and source

- Node **24.22.1**, pnpm **12.15.0**, repository-pinned Python 3.13/uv and frozen dependencies.
- Linux builder with Git for local provenance reads; UTC, C.UTF-8, umask 022, `/build` workdir.
- Verified immutable image reference `repository@sha256:<actual-digest>`; never a floating tag
  or a manually invented hash. Inspect local RepoDigests and record actual runtime versions.
- A committed-source snapshot matching the implementation SHA, plus authorized/sanitized local
  Git provenance metadata. No working-tree overlay, home, credentials, runtime `var`, `spikes`,
  host node_modules/.venv, Docker socket or production connector configuration.
- Linux pnpm and uv caches must already be prepared and verified for offline frozen installs.
  Missing packages/tooling block the run; do not weaken version pins or enable arbitrary egress.

## Commands — templates, NOT EXECUTED

Set the following to real verified local artifacts; placeholder values are not executable evidence:

```sh
builder_ref='repository@sha256:<actual-verified-digest>'
clean_snapshot='/absolute/path/to/committed-source-snapshot'
pnpm_cache='/absolute/path/to/verified-linux-pnpm-store'
uv_cache='/absolute/path/to/verified-linux-uv-cache'

# Inspect and execute the exact locally cached image; do not pull during verification.
docker image inspect "$builder_ref" --format '{{json .RepoDigests}}'
docker run --pull=never --network=none --rm "$builder_ref" node --version
docker run --pull=never --network=none --rm "$builder_ref" pnpm --version

# Only if a wrapper image is needed: its Dockerfile must FROM the verified digest.
# Build context must contain only audited builder inputs, never credentials/runtime data.
docker build --pull=false --network=none \
  --build-arg VERIFIED_BUILDER="$builder_ref" \
  -f /absolute/path/to/audited-builder.Dockerfile \
  -t fb-builder:local /absolute/path/to/audited-builder-context
# Inspect/record the resulting real digest before selecting it for the execution below.

# Each independent run gets a fresh copy of the same committed snapshot.
docker run --pull=never --network=none --rm \
  -e TZ=UTC -e LANG=C.UTF-8 -e LC_ALL=C.UTF-8 -e FB_DATA_MODE=synthetic \
  -e UV_CACHE_DIR=/uv-cache \
  -v "$clean_snapshot:/build" -v "$pnpm_cache:/pnpm-cache:ro" \
  -v "$uv_cache:/uv-cache" -w /build "$builder_ref" \
  sh -eu -c 'umask 022
    test "$(node --version)" = v24.22.1
    test "$(pnpm --version)" = 12.15.0
    pnpm install --frozen-lockfile --offline --store-dir /pnpm-cache
    uv sync --locked --offline
    pnpm verify
    node tools/compiler/src/cli.ts release sports sports-subtle pc-plugin
  '
```

The wrapper Dockerfile, exact image pin, Linux dependency cache and sanitized clean-snapshot
provenance packaging still require preparation/verification. The host release orchestrator
currently reads local Git HEAD/status. Do not substitute unrelated or fabricated source metadata.
The commands above are an operator template, not a claim that a ready builder already exists.

## Canonical A/B acceptance

1. Run from two independent clean snapshots, different absolute work directories and empty
   build caches, inside the same verified image digest. Record actual image/toolchain/source.
2. Compare JCS LRM/release ID, final `index.html`, every inventory file byte, Chunk Plan and
   Chunk Manifest. Any difference is `E-BUILD-NON-REPRODUCIBLE`; do not activate a release.
3. Re-run integrity/corruption negatives and TS-generated/Python-evaluated semantic fixtures.
   Verify immutable registration, two-revision publish/rollback, pinned old revision, plugin
   isolation and zero Motion modules/imports/chunks for Sports Motion-none.
4. Measure emitted initial graph: Sports-none JS gzip <= 12 KiB; HTML+CSS+JS gzip <= 16 KiB.
   List resources; report IR/fonts/images separately. Preserve synthetic/network gates.
5. Bind the trusted real image digest and successful container runs into release provenance and
   attestation. **Current code intentionally labels output HOST_ONLY / VERIFICATION_PENDING**:
   merely running it inside Docker does not change that label or authorize canonical PASS.
   Trusted container-builder attestation wiring must be implemented and verified as part of T12.
6. Platform/product owner reviews execution evidence before approving full G2/S2. External IdP,
   AWS/DynamoDB and production network behavior remain outside the local acceptance evidence.

Do not edit pending flags or digest fields by hand to close a gate. No P1/deployment work is
part of this runbook. G9/G10 remain BLOCKED.
