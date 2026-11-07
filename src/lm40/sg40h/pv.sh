#!/bin/bash
# pv.sh key tx ty tz dist elev azim [W H]
SC=/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad
cd $SC/lm40/sg40h
node $SC/lm22/marina/ndump.js sg40h.js $1 pv/$1.bin >/dev/null 2>&1 && python3 $SC/lm22/marina/nrender.py pv/$1.bin pv/$1_$7.png $2 $3 $4 $5 $6 $7 ${8:-520} ${9:-340}; rm -f pv/$1.bin
