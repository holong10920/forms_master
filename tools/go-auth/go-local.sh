#!/bin/sh
# Keep verification toolchains and caches outside existing project state.
set -eu
export GOTOOLCHAIN=go1.27.3
export GOPATH=/tmp/forms-go
export GOMODCACHE=/tmp/forms-go-mod
export GOCACHE=/tmp/forms-go-build
export GOPROXY=https://proxy.golang.org
export GOSUMDB=sum.golang.org
exec go "$@"
