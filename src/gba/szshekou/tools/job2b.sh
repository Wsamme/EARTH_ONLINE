#!/bin/bash
SC=/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad; T=$SC/gba/szshekou/tools; O=$SC/gba/szshekou/shots/${1:-app1}
cd $SC && env PAGE=t_szshekou.html NEAR=22.503,113.902,6500 node lm20/kit/appshot.js $O "$(cat $T/${VIEWS:-views_app.json})"
python3 $T/shrink.py $O
