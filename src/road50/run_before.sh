#!/bin/bash
# diagnostics of the live data for every city (one heavy-lock session)
cd "$(dirname "$0")"
for c in ${CITIES:-sg hk nyc tyo bay gba}; do node --max-old-space-size=2500 diag.js $c --png --tag before > out/${c}_before.log 2>&1; echo "$c done $?"; done
