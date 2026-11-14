# list road lines near the Lingdingyang bridge in a roads pickle (read only): python3 decks.py [pkl]
import sys, pickle, math
sys.path.insert(0, '/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/gbareal')
import common as C
src = sys.argv[1] if len(sys.argv) > 1 else C.OUT + 'roads_b4.pkl'
R = pickle.load(open(src, 'rb')); lines = R['lines']; elev = R['elev']
print('keys', list(R.keys()), 'line keys', list(lines[0].keys()))
X0, Y0 = C.w(113.7255883, 22.5553635)
for i, l in enumerate(lines):
    cs = list(l['g'].coords)
    if not any(-9000 < x - X0 < 7000 and -5000 < y - Y0 < 5000 for x, y in cs): continue
    if l["c"] > 3: continue
    E = elev.get(i)
    print(i, l['c'], l['br'], l.get('name'), l.get('bname'), l.get('layer'), len(cs), 'from %.0f,%.0f to %.0f,%.0f' % (cs[0][0]-X0, cs[0][1]-Y0, cs[-1][0]-X0, cs[-1][1]-Y0), 'E', (min(E), max(E)) if E else None)
