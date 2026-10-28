#!/bin/bash
# one browser hold: rebuild nothing; model-alone + in-situ (job1) then the app (job2)
SC=/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad
bash $SC/gba/szshekou/tools/job1.sh ${1:-r2}
bash $SC/gba/szshekou/tools/job2.sh ${2:-app2}
