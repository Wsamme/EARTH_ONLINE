#!/bin/bash
# road50: put the repaired road files of the test stage into the live site folder (owner / coordinator only; not run by road50).
#   bash src/road50/release.sh sg hk nyc tyo bay      # the five single-file cities
#   bash src/road50/release.sh gba                     # Greater Bay: only AFTER the Guangzhou extension has re-staged gbadata,
#                                                        and after re-running the repair on that new data (see README)
# Each live road file is first copied to $BACKUP/<city>data/<file>.v48.bak (outside site/, so it is not deployed). Only the road files change (names / refs indices are unchanged,
# so the base files stay). Then deploy as usual; no page rebuild is needed for the data.
set -e
cd "$(dirname "$0")/../.."
SITE=site
STAGE=${STAGE:-/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/road50/stage}
BACKUP=${BACKUP:-src/road50/backup}
declare -A DIRS=([sg]=sgdata [hk]=hkdata [nyc]=nycdata [tyo]=tyodata [bay]=baydata [gba]=gbadata)
for c in "$@"; do
  d=${DIRS[$c]}
  if [ "$c" = gba ]; then files=$(cd $STAGE/$d && ls gba_rc*.txt); else files=${c}_roads.bin; fi
  for f in $files; do
    [ -f $STAGE/$d/$f ] && [ ! -L $STAGE/$d/$f ] || { echo "missing $STAGE/$d/$f"; exit 1; }
    mkdir -p $BACKUP/$d; [ -f $BACKUP/$d/$f.v48.bak ] || cp -p $SITE/$d/$f $BACKUP/$d/$f.v48.bak
    cp $STAGE/$d/$f $SITE/$d/$f
  done
  echo "$c: $(echo $files | wc -w) road file(s) released"
done
