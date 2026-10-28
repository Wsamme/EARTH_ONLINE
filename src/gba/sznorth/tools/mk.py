# assemble gba/sznorth/sznorth.js from src/*.js and tmp/D.json
import json, glob, os
H = os.path.dirname(os.path.abspath(__file__)) + '/..'
d = json.load(open(H + '/tmp/D.json'))
src = ''.join(open(f).read() for f in sorted(glob.glob(H + '/src/*.js')))
j = lambda o: json.dumps(o, ensure_ascii=False, separators=(',', ':'))
src = src.replace('/*@D*/null', j(d['D'])).replace('/*@S*/null', j(d['S'])).replace('/*@PL*/null', j(d['PL']))
if not src.rstrip().endswith('}'): src += '\n}\n'
open(H + '/sznorth.js', 'w').write(src); print('sznorth.js', len(src))
