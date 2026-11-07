import sys, json, math
sys.path.insert(0, '/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/lm26/sgouter/tools')
import hgt_lib as h
P = json.load(open(sys.argv[1])); R = {k: int(v) for k, v in (a.split(':') for a in sys.argv[2].split(','))}
for p in P:
    X, Y = h.xy(p['lat'], p['lon']); r = R.get(p['type'], 50)
    top = max(h.hC(X + math.cos(a/12*2*math.pi)*r*f, Y + math.sin(a/12*2*math.pi)*r*f) for a in range(12) for f in (0, 0.35, 0.7)) + 0.6
    g = [h.hC(X + dx, Y - dz) for dx in range(-r, r + 1, 5) for dz in range(-r, r + 1, 5) if dx*dx + dz*dz <= r*r]
    print(p['type'], 'base %.1f' % top, 'ground min %.1f max %.1f' % (min(g), max(g)), 'drop %.1f' % (top - min(g)))
