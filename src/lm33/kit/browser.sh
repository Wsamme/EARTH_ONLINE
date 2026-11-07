#!/usr/bin/env bash
# Portable browser lock for the appshot flow described in the city briefs.
set -euo pipefail
exec flock "${TMPDIR:-/tmp}/earth-online-browser.lock" "$@"
