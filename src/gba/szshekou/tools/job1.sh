#!/bin/bash
# run inside lm33/kit/browser.sh: model-alone + two in-situ runs (sites through tools/sitewrap.js)
SC=/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad; T=$SC/gba/szshekou/tools; O=$SC/gba/szshekou/shots/${1:-r1}
mkdir -p $O
if [ -z "$NOALONE" ]; then cd $SC/lm16/kit && node shoot.js $O/m ../../gba/szshekou/szshekou.js ${KEYS:-szdesignsociety,szcruise,szchiwantinhau,szsongtomb,szleftfort,szqhconf,szqhshimao}; fi
M=../../../gba/szshekou/szshekou.js,../../../gba/szshekou/tools/sitewrap.js,../../../sgreal/mod_roads/roads.js,../../../sgreal/mod_bld/bld.js,insitu.js
cd $SC/gbareal/targets/kit
if [ -z "$NOA" ]; then QS='k=szdesignsociety,szcruise,szchiwantinhau,szsongtomb,szleftfort,site_szseaworld,site_szshekouport&r=1800' node shoot.js $O/a $M "$(cat $T/views_a.json)"; fi
if [ -z "$NOB" ]; then QS='k=szqhconf,szqhshimao,site_sznantou,site_szqianhaistone,site_szqhhub&r=1500' node shoot.js $O/b $M "$(cat $T/views_b.json)"; fi
python3 $T/shrink.py $O
