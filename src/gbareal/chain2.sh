#!/bin/bash
cd /tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad
until grep -q "done rc" gbareal/b5.log; do sleep 5; done
grep -q "done rc=0" gbareal/b5.log || exit 1
bash gbareal/run.sh b6_misc.py > gbareal/b6.log 2>&1 || exit 1
bash gbareal/run.sh b3b_speckle.py > gbareal/b3b.log 2>&1 || exit 1
bash gbareal/run.sh b7_encode.py > gbareal/b7.log 2>&1 || exit 1
bash gbareal/stage.sh > gbareal/stage.log 2>&1 || exit 1
bash gbareal/run.sh b8_cover.py > gbareal/b8.log 2>&1
echo CHAIN DONE >> gbareal/stage.log
