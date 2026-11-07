#!/bin/bash
# rend.sh key name tx ty tz dist elev azim [W H]
cd /tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/lm40/sg40d
node ../../lm22/marina/ndump.js sg40d.js $1 x_$1.bin >/dev/null && python3 ../../lm22/marina/nrender.py x_$1.bin sh/$2.png $3 $4 $5 $6 $7 $8 ${9:-560} ${10:-400}; rm -f x_$1.bin
