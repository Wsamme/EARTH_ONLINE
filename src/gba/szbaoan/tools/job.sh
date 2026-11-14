#!/bin/bash
# one browser session (run under lm33/kit/browser.sh): model-alone shots and in-situ runs. usage: bash tools/job.sh <tag> <steps...>
SC=/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad; G=$SC/gba/szbaoan; TAG=$1; shift
M=../../../gba/szbaoan/szbaoan.js,../../../sgreal/mod_roads/roads.js,../../../sgreal/mod_bld/bld.js
for S in "$@"; do
  echo "=== $S $(date +%T)"
  case $S in
    alone) (cd $SC/lm16/kit && node shoot.js $G/shots/$TAG/alone ../../gba/szbaoan/szbaoan.js ${KEYS:-szszlink,szszlink_w,szszlink_e,szt3,szt3_c,szt3_p,szsatellite,szatctower,szworld,szbaoanstadium,szbayglory,szbayeye});;
    link) (cd $SC/gbareal/targets/kit && QS='k=szszlink,szszlink_w,szszlink_e&tw=12000' node shoot.js $G/shots/$TAG/link $M,../../../gba/szbaoan/tools/linkshim.js,insitu.js \
      '[["link_plan","overlay","szszlink",1700],["anc_plan","overlay","szszlink",140],["link_side",22.5553435,113.7255956,2700,4,19,0],["link_tw",22.5577827,113.7332539,520,10,40,0],["link_anc",22.5595130,113.7386880,380,18,70,0],["link_app",22.5644486,113.7507763,1700,9,19,0],["link_n",22.5553435,113.7255956,3200,8,30,1]]');;
    air) (cd $SC/gbareal/targets/kit && QS='k=szt3,szt3_c,szt3_p,szsatellite,szatctower' node shoot.js $G/shots/$TAG/air $M,insitu.js \
      '[["t3_plan","overlay","szt3"],["sat_plan","overlay","szsatellite"],["twr_plan","overlay","szatctower",60],["t3_a",22.629986,113.806991,1500,35,200,0],["t3_b",22.62818,113.80845,520,22,140,0],["sat_a",22.64311,113.799793,700,30,160,0],["twr_a",22.636853,113.803817,260,8,120,0],["t3_n",22.629986,113.806991,1300,30,160,1]]');;
    world) (cd $SC/gbareal/targets/kit && QS='k=szworld&r=1800' node shoot.js $G/shots/$TAG/world $M,insitu.js \
      '[["w_plan","overlay","szworld"],["w_a",22.701069,113.769362,2300,35,200,0],["w_b",22.701069,113.769362,650,22,140,0],["w_n",22.701069,113.769362,2300,30,200,1]]');;
    bay) (cd $SC/gbareal/targets/kit && QS='k=szbaoanstadium,szbayglory,szbayeye' node shoot.js $G/shots/$TAG/bay $M,insitu.js \
      '[["st_plan","overlay","szbaoanstadium"],["gl_plan","overlay","szbayglory",120],["ey_plan","overlay","szbayeye"],["st_a",22.560972,113.876322,420,25,150,0],["st_n",22.560972,113.876322,520,22,150,1],["gl_a",22.54425,113.883072,330,12,170,0],["gl_n",22.54425,113.883072,420,10,170,1],["ey_a",22.550556,113.879393,520,40,160,0]]');;
  esac
done
echo "=== done $(date +%T)"
