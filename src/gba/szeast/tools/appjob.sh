#!/bin/bash
# full-app shots (run under lm33/kit/browser.sh): bash tools/appjob.sh <tag> <groups...>  (page sgreal/site/t_szeast.html built by mkgba.sh)
SC=/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad; cd $SC; TAG=$1; shift
for S in "$@"; do
  echo "=== $S $(date +%T)"
  case $S in
    west) W=1000 H=620 PAGE=t_szeast.html NEAR=22.574,114.19,6500 timeout 1500 node gba/szeast/tools/appshot404.js gba/szeast/shots/$TAG/west '[["xh_a",22.5815,114.172,1700,35,200,13],["hf_a",22.5802,114.1773,450,28,315,16],["hf_n",22.5802,114.1773,600,30,315,20.5],["tv_a",22.571,114.1888,900,8,250,13],["tv_n",22.571,114.1888,1100,8,250,20.5],["wt_a",22.5823,114.2146,450,25,200,13],["rs_a",22.56994,114.147046,1000,22,0,13],["cy_a",22.5465,114.2265,480,35,200,13],["cy_b",22.5462,114.2262,170,16,160,16],["cy_n",22.5465,114.2265,480,35,200,20.5]]';;
    east) W=1000 H=620 PAGE=t_szeast.html NEAR=22.60,114.285,5000 timeout 1500 node gba/szeast/tools/appshot404.js gba/szeast/shots/$TAG/east '[["yt_a",22.5747,114.2679,3200,35,180,13],["yt_b",22.5725,114.2655,900,20,160,15],["yt_n",22.5747,114.2679,3200,35,180,20.5],["vk_a",22.6007,114.2998,620,30,160,13],["vk_n",22.6007,114.2998,620,28,160,20.5],["dm_a",22.5952,114.3029,950,30,160,13],["dm_b",22.597,114.30523,150,14,220,16],["dm_n",22.5952,114.3029,950,30,160,20.5],["oe_a",22.6346,114.2692,650,35,200,13],["oe_n",22.6346,114.2692,650,35,200,20.5]]';;
    dapeng) W=1000 H=620 PAGE=t_szeast.html NEAR=22.595,114.506,2500 timeout 1500 node gba/szeast/tools/appshot404.js gba/szeast/shots/$TAG/dapeng '[["dp_a",22.598,114.5078,650,35,200,13],["dp_b",22.596953,114.508822,170,14,0,16],["dp_n",22.598,114.5078,650,35,200,20.5],["jc_a",22.5916,114.5055,950,35,160,13],["jc_n",22.5916,114.5055,950,35,160,20.5]]';;
  esac
done
echo "=== done $(date +%T)"
