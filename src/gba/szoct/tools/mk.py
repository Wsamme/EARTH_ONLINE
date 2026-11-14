# build szoct.js = src/core.js + src/*.js parts + '}' with the site data inlined
import json, re, os
SC='/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/gba/szoct/'
D=json.load(open(SC+'tools/data.json'))
KEEPPOI={'szwindow':r'微缩|喷泉|门$|金字塔|救世|Louvre','szsplendid':r'.','szhappyvalley':r'.','szocth':r'曲水湾|飞来的爱|狂欢|剧场','szoctloft':r'OCAT|当代','szsafari':r'.','szsustech':r'图书馆|体育|中心|楼|院','szhitsz':r'.'}
for k,d in D.items():
    d['poi']=[p for p in d['poi'] if re.search(KEEPPOI.get(k,'.'),p[0])]
    for b in d['b']: b.pop('en',None)
parts=['core.js','lm.js']+[p for p in ['site_common.js','window.js','splendid.js','happy.js','octh.js','loft.js','safari.js','campus.js'] if os.path.exists(SC+'src/'+p)]
src=''.join(open(SC+'src/'+p).read()+'\n' for p in parts)+'}\n'
src=src.replace('/*@DATA@*/null',json.dumps(D,ensure_ascii=False,separators=(',',':')))
open(SC+'szoct.js','w').write(src); print('szoct.js',len(src),'bytes, parts',parts)
