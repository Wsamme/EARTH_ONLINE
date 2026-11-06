cd /tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/lm40/sg40f
python3 -c "
s=open('src.js').read(); s=s.replace('__DATA__',open('data.json').read().strip()).replace('__SITES__',open('sites.json').read().strip()); open('sg40f.js','w').write(s)"
