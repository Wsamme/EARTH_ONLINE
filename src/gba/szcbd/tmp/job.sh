#!/bin/bash
# one browser session: model-alone shots of the given keys (arg1, comma list or 'all'), then in-situ views (arg2 json, QS env K)
SC=/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad; OUT=$SC/gba/szcbd/shots/$3
mkdir -p $OUT
if [ "$1" != "none" ]; then cd $SC/lm16/kit && node shoot.js $OUT ../../gba/szcbd/szcbd.js $([ "$1" = all ] || echo $1); fi
if [ "$2" != "none" ]; then cd $SC/gbareal/targets/kit && QS="k=$K$EXTRA" node shoot.js $OUT ../../../gba/szcbd/szcbd.js$MODS,../../../sgreal/mod_roads/roads.js,../../../sgreal/mod_bld/bld.js,insitu.js "$2"; fi
