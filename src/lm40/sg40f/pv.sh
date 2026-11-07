# pv.sh key tx ty tz dist elev azim [W H] -> pv/<key>_<azim>.png
cd /tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad
k=$1; shift
node lm22/marina/ndump.js lm40/sg40f/sg40f.js $k lm40/sg40f/x_$k.bin >/dev/null && python3 lm22/marina/nrender.py lm40/sg40f/x_$k.bin lm40/sg40f/pv/${k}_$6.png "$@" && rm -f lm40/sg40f/x_$k.bin
