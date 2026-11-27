# cut stage.pkl down to Shenzhen + 2 km (box) -> stage_sz.pkl, with an STRtree-friendly layout
import pickle
S = pickle.load(open('/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/lm50/sz/stage.pkl', 'rb')); F = S['frame']
def w(lon, lat): return ((lon - F['lon0'])*F['MX'], (lat - F['lat0'])*F['MY'])
x0, y0 = w(113.74, 22.43); x1, y1 = w(114.64, 22.87)
def inb(P): return any(x0 <= x <= x1 and y0 <= y <= y1 for x, y in P)
S['bld'] = [b for b in S['bld'] if b['rings'] and inb(b['rings'][0][:1])]
S['lines'] = [l for l in S['lines'] if inb(l['P'])]
print(len(S['bld']), len(S['lines']))
pickle.dump(S, open('/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/lm50/sz/stage_sz.pkl', 'wb'), protocol=4)
