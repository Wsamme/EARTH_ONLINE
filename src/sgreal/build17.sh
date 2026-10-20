set -e
cd /tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad
python3 sgreal/patch17.py city-brush-v16.html city-brush-v17.html
python3 - <<'PY'
import re
s = open('city-brush-v17.html').read()
m = re.findall(r'<script>(.*?)</script>', s, re.S); open('main17.js', 'w').write(max(m, key=len))
PY
node --check main17.js
python3 sgreal/mktest.py city-brush-v17.html sgreal/site/test.html
