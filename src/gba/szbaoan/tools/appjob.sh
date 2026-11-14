#!/bin/bash
# full-app sessions (run under lm33/kit/browser.sh from SC): bash gba/szbaoan/tools/appjob.sh <tag> <steps>
cd /tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad; T=$1; shift; O=gba/szbaoan/shots/$T
for S in "$@"; do echo "=== $S $(date +%T)"; case $S in
  west) PAGE=t_szbaoan.html NEAR=22.612,113.818,4500 node lm20/kit/appshot.js $O/west '[["xw_a",22.5945,113.8300,1500,40,200,13],["xw_b",22.5975,113.8270,450,25,240,16],["xw_n",22.5945,113.8300,1300,35,220,20.5],["t3_a",22.6300,113.8070,1600,35,200,13],["t3_n",22.6300,113.8070,1400,30,160,20.5],["sat_b",22.6431,113.7998,600,25,160,15]]';;
  north) PAGE=t_szbaoan.html NEAR=22.715,113.768,3500 node lm20/kit/appshot.js $O/north '[["wl_a",22.7287,113.7666,1700,45,200,13],["wl_b",22.7290,113.7640,500,25,150,16],["wl_n",22.7287,113.7666,1500,40,200,20.5],["sw_a",22.7011,113.7694,2300,35,200,13],["sw_n",22.7011,113.7694,2300,30,200,20.5]]';;
  bay) PAGE=t_szbaoan.html NEAR=22.553,113.880,2500 node lm20/kit/appshot.js $O/bay '[["bay_a",22.5520,113.8800,1500,35,200,13],["st_b",22.5610,113.8763,450,25,140,16],["gl_b",22.5443,113.8831,380,12,170,16],["bay_n",22.5520,113.8800,1500,30,200,20.5]]';;
  link) PAGE=t_szbaoan.html NEAR=22.556,113.73,4000 node lm20/kit/appshot.js $O/link '[["lk_a",22.5553,113.7256,3000,8,19,13],["lk_b",22.5578,113.7333,600,10,40,16],["lk_n",22.5553,113.7256,3200,8,30,20.5]]';;
esac; done; echo "=== done $(date +%T)"
