#!/bin/bash
# concatenate the module: header + helper library + parts; test-build all keys, then replace sg40b.js atomically
D=/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/lm40/sg40b
{ cat $D/parts/p0_head.js; echo '{'; head -138 $D/tools/lib.js; for f in $D/parts/p[1-9]*.js; do cat $f; echo; done; echo '}'; } > $D/tools/tmp.js
node $D/../../lm22/marina/nstat.js $D/tools/tmp.js sgchinatowncx,sgalabrar,sgfuktakchi,sgyuehhai,sgjinrikisha,sgmaxwell,sgyingfo,sgsiangcho,sgcantonment,sgordbr,sgjiakkim,sguesquare > $D/tools/stat.txt 2>&1 && mv $D/tools/tmp.js $D/sg40b.js && echo BUILD-OK || { echo BUILD-FAILED; tail -5 $D/tools/stat.txt; }
