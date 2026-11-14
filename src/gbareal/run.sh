#!/bin/bash
# run one gbareal stage from gbareal/ under the shared heavy lock: bash gbareal/run.sh b1_land.py [args]
cd /tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad
exec bash lm33/kit/heavy.sh bash -c "cd gbareal && python3 $*"
