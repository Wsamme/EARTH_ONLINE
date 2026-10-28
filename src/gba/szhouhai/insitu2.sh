#!/bin/bash
cd /tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/gbareal/targets/kit
V='[["crt_a",22.5178,113.9416,650,14,135,0],["crt_c",22.5178,113.9416,260,8,135,0],["crt_n",22.5178,113.9416,800,12,135,1],["tc_a",22.5250,113.9303,520,22,10,0],["tc_n",22.5250,113.9303,620,18,10,1],
["hk_a",22.5435,113.9318,600,18,15,0],["hk_c",22.5435,113.9318,260,12,60,0],["ob_a",22.5088,113.9374,600,12,120,0],["bi_a",22.5310,113.9420,600,14,75,0],
["sbd_a",22.5262,113.9653,620,14,5,0],["sbd_n",22.5262,113.9653,700,12,5,1],["sp_a",22.5213,113.9450,700,30,140,0],["sp_n",22.5213,113.9450,800,28,140,1],
["brg_s",22.4975,113.9520,260,6,225,0],["brg_p",22.4720,113.9615,600,8,240,0],["brg_n",22.4800,113.9580,2200,10,240,1],["bay_n",22.512,113.945,3800,10,10,1]]'
QS='k=hkcrtower,sztencent,szhanking,szonebay,szbayinno,szcmbhq,szhuiyun,szbayport,hkszbaysports&tw=16000&c=22.500,113.950&r=5500' bash ../../../lm33/kit/browser.sh node shoot.js ../../../gba/szhouhai/shots/is2 \
  ../../../gba/szhouhai/szhouhai.js,../../../hk/hkx_nt/hkx_nt.js,../../../sgreal/mod_roads/roads.js,../../../sgreal/mod_bld/bld.js,insitu.js "$V"
