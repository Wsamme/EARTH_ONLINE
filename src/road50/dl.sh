#!/bin/bash
# road50: download one openstreetmap.fr extract into its own folder, check its md5, keep its state file.
#   bash src/road50/dl.sh <region folder name> <url of the .osm.pbf>
set -e
SC=/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad
D=$SC/road50/dl/$1; U=$2; F=$(basename $U); B=${U%.osm.pbf}
mkdir -p $D; cd $D
curl -sS --retry 3 -o $F.md5 $U.md5
curl -sS --retry 3 -o $(basename $B).state.txt $B.state.txt
curl -sS --retry 3 -C - -o $F $U
want=$(awk '{print $1}' $F.md5); got=$(md5sum $F | awk '{print $1}')
[ "$want" = "$got" ] && echo "md5 OK $F $got $(stat -c %s $F) bytes" || { echo "md5 MISMATCH $F want $want got $got"; exit 1; }
