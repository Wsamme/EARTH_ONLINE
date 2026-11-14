#!/bin/bash
# szoct in-situ batch 1 (run inside one browser lock)
cd /tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/gbareal/targets/kit
M=../../../gba/szoct/szoct.js,../../../sgreal/mod_roads/roads.js,../../../sgreal/mod_bld/bld.js,insitu.js
O=../../../gba/szoct/shots
QS='k=szocttower,szhexiangning' timeout 400 node shoot.js $O/is1 $M '[["oct_plan","overlay","szocttower"],["hxn_plan","overlay","szhexiangning"],["oct_a",22.537558,113.977542,900,22,200,0],["oct_c",22.5381,113.9775,260,12,150,0],["oct_n",22.537558,113.977542,900,22,200,1],["hxn_a",22.535975,113.976736,220,30,20,0],["hxn_n",22.535975,113.976736,220,30,20,1]]'
QS='k=szoct_probe&site=szwindow&tw=4000' timeout 500 node shoot.js $O/is2 $M,../../../gba/szoct/tools/sitekit.js '[["w_a",22.537418,113.968028,1300,35,200,0],["w_e",22.537039,113.969436,330,18,160,0],["w_n",22.537418,113.968028,1300,35,200,1]]'
