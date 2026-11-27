#!/bin/bash
# lm50 (Singapore): build a full-app test page with extra modules.   bash R/lm50/kit_sg/mkapp50.sh <name> [lm50/sg50a/sg50a.js,...]
# -> SC/lm50/sg/site/t_<name>.html + t_<name>-app.js (~9.3 MB; delete both after the run). Modules are paths relative to R.
set -e
SC=/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad; R=/home/claude/earth_online/src; D=$SC/lm50/sg/site
mkdir -p $D; [ -e $D/sgdata ] || ln -s /home/claude/earth_online/site/sgdata $D/sgdata
cd $R && EXTRA_MODS="$2" APPJS=t_$1-app.js bash $SC/lm33/kit/heavy.sh python3 sgreal/patch17.py city-brush-v16.html $D/t_$1.html | grep -v '^post \|^modules' | tail -3
python3 $(dirname "$0")/mkpage.py $D/t_$1.html $D/t_$1-app.js
node --check $D/t_$1-app.js && echo "syntax ok  ->  PAGE=lm50/sg/site/t_$1.html"
