#!/bin/bash
# one browser session (run under lm33/kit/browser.sh): model-alone and in-situ runs. usage: bash tools/job.sh <tag> <steps...>
SC=/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad; G=$SC/gba/szeast; TAG=$1; shift
M=../../../gba/szeast/szeast.js,../../../sgreal/mod_roads/roads.js,../../../sgreal/mod_bld/bld.js
for S in "$@"; do
  echo "=== $S $(date +%T)"
  case $S in
    alone) (cd $SC/lm16/kit && timeout 900 node shoot.js $G/shots/$TAG/alone ../../gba/szeast/szeast.js ${KEYS:-szhongfa,szvanke,szwutongtv});;
    hongfa) (cd $SC/gbareal/targets/kit && QS='k=szhongfa,szwutongtv' timeout 1200 node shoot.js $G/shots/$TAG/hongfa $M,insitu.js \
      '[["hf_plan","overlay","szhongfa"],["tv_plan","overlay","szwutongtv",60],["hf_a",22.580191,114.177286,420,32,315,0],["hf_b",22.580191,114.177286,230,22,290,0],["hf_n",22.580191,114.177286,420,30,315,1],["tv_a",22.570988,114.188777,520,12,200,0],["tv_b",22.5725,114.1875,1800,8,10,0],["tv_n",22.570988,114.188777,600,10,200,1]]');;
    vanke) (cd $SC/gbareal/targets/kit && QS='k=szvanke' timeout 1200 node shoot.js $G/shots/$TAG/vanke $M,insitu.js \
      '[["vk_plan","overlay","szvanke"],["vk_a",22.600693,114.299829,520,30,160,0],["vk_b",22.600693,114.299829,260,12,200,0],["vk_n",22.600693,114.299829,520,28,160,1]]');;
  esac
done
echo "=== done $(date +%T)"
