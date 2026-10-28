#!/bin/bash
# alone.sh <tag> <keys> [view json] : model-alone shots via lm16 kit through the shared browser lock -> shots/<tag>/, log alone_<tag>.log
SC=/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad
cd $SC/lm16/kit && bash ../../lm33/kit/browser.sh timeout 900 node shoot.js ../../gba/szeast/shots/$1 ../../gba/szeast/szeast.js "$2" "$3"
