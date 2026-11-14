#!/bin/bash
# assemble ../szhouhai.js from the parts (data from gen.py)
cd "$(dirname "$0")"
{ cat src_head.js; cat data.js; cat src_lib.js; for f in src_crt.js src_tencent.js src_hanking.js src_towers.js src_port.js src_sites.js; do [ -f $f ] && cat $f; done; echo '}'; } > ../szhouhai.js
node --check ../szhouhai.js && echo ok $(wc -c < ../szhouhai.js)
