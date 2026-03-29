#!/usr/bin/env bash
set -euo pipefail

export HOME="$PWD"
export COREPACK_HOME="$PWD/.cache/node/corepack"
export XDG_CACHE_HOME="$PWD/.cache"

"$@"
