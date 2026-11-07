#!/bin/bash
# full-app run (inside the browser lock): build the test page from the current module, shoot, delete the page
SC=/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad
cd $SC && EXTRA_MODS=lm40/sg40h/sg40h.js bash lm20/kit/mkapp.sh sg40h signs,light,wx,core,crown,w1,w2,w3,w4,w5 && \
  env PAGE=t_sg40h.html NEAR=1.372,103.978,4800 node lm40/kit/appshot.js lm40/sg40h/app "$(tr -d '\n' < lm40/sg40h/views_app.json)"
rc=$?; rm -f $SC/sgreal/site/t_sg40h.html; exit $rc
