# build szluohu.js from src/*.js (order below) and the data block D (data.json, made by mkdata.py)
import json, os
H = os.path.dirname(os.path.abspath(__file__)) + '/'
ORDER = ['head', 'kk100', 'diwang', 'guomao', 'towers', 'low', 'dongmen', 'hqb']
D = json.load(open(H + 'data.json')) if os.path.exists(H + 'data.json') else {}
s = ''
for n in ORDER:
    f = H + 'src/' + n + '.js'
    if os.path.exists(f): s += open(f).read() + '\n'
s = s.replace('/*@DATA@*/', json.dumps(D, separators=(',', ':')))
s += '}\n'
open(H + 'szluohu.js', 'w').write(s)
print('szluohu.js', len(s))
