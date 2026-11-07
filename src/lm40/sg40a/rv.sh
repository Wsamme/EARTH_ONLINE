#!/bin/bash
# rv.sh key out.png tx ty tz dist elev azim [W H]
D=/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad
K=$1; O=$2; shift 2
node $D/lm22/marina/ndump.js $D/lm40/sg40a/sg40a.js $K $D/lm40/sg40a/x_$K.bin > /dev/null && python3 $D/lm22/marina/nrender.py $D/lm40/sg40a/x_$K.bin $O "$@"; rm -f $D/lm40/sg40a/x_$K.bin
