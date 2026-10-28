#!/bin/bash
# in-situ shots of all landmark keys of szluohu
cd /tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/gbareal/targets/kit
OUT=../../../gba/szluohu/shots/${1:-i1}
V='[["kk_plan","overlay","hkkingkey"],["dw_plan","overlay","szdiwang"],["dwb_plan","overlay","szdiwang_b"],["gm_plan","overlay","szguomao"],["seg_plan","overlay","szseg"],["cm_plan","overlay","szcitymark"],["bn_plan","overlay","szbaoneng"],["gt_plan","overlay","szgrandtheatre"],["ms_plan","overlay","szmuseumold"],["st_plan","overlay","szstation"],["lp_plan","overlay","szluohuport"],
["sky_a",22.5455,114.1035,1800,12,200,0],["sky_n",22.5455,114.1035,1800,12,200,1],
["kk_a",22.5457,114.1016,420,25,210,0],["dw_a",22.5453,114.1055,380,25,150,0],["gm_a",22.5432,114.1147,260,22,200,0],["gm_n",22.5432,114.1147,260,22,200,1],
["seg_a",22.5440,114.0823,450,20,220,0],["cm_a",22.5610,114.1001,500,18,200,0],["bn_a",22.5666,114.1048,450,18,160,0],
["gt_a",22.5453,114.1004,260,30,190,0],["ms_a",22.5451,114.0965,180,30,200,0],["st_a",22.5345,114.1121,380,32,250,0],["lp_a",22.5310,114.1133,260,35,170,0],["st_n",22.5340,114.1125,500,30,230,1]]'
QS='k=hkkingkey,szdiwang,szdiwang_b,szguomao,szseg,szcitymark,szbaoneng,szgrandtheatre,szmuseumold,szstation,szluohuport&tw=7000' bash ../../../lm33/kit/browser.sh node shoot.js $OUT ../../../gba/szluohu/szluohu.js,../../../sgreal/mod_roads/roads.js,../../../sgreal/mod_bld/bld.js,insitu.js "$V"
python3 ../../../gba/szluohu/shrink.py $OUT 1100
