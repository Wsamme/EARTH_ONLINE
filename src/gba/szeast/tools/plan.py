# plan plot of a ref target: python3 plan.py <key> [half-extent m] [cx,cz] -> ../plans/<key>.png
import json, sys, os
import matplotlib; matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
plt.rcParams['font.sans-serif'] = ['Noto Sans CJK SC', 'WenQuanYi Zen Hei', 'DejaVu Sans']
SC = '/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/'
R = json.load(open(SC + 'gba/ref_szeast.json'))['targets']
k = sys.argv[1]; t = R[k]
E = float(sys.argv[2]) if len(sys.argv) > 2 else t['radius']
cx, cz = (map(float, sys.argv[3].split(','))) if len(sys.argv) > 3 else (0, 0)
fig, ax = plt.subplots(figsize=(8, 8), dpi=100)
T = t['terrain']; n = T['n']; st = T['step']; H = np.array(T['rows_north_to_south'])
xs = (np.arange(n) - (n - 1)/2)*st
X, Z = np.meshgrid(xs, xs)
cs = ax.contour(X, Z, H, levels=20, colors='#bbb', linewidths=0.5); ax.clabel(cs, fontsize=5, fmt='%.0f')
cols = {0:'#e33', 1:'#e33', 2:'#e80', 3:'#e80', 4:'#ca0', 5:'#ca0', 10:'#888', 11:'#aaa', 12:'#6a6', 15:'#33a', 17:'#0aa'}
for r in t['roads']:
    p = np.array(r['pts']); c = cols.get(r['cls'], '#999')
    ax.plot(p[:, 0], p[:, 1], color=c, lw=2.0 if r['cls'] < 10 else 0.8, ls='--' if r.get('bridge') else '-')
for b in t['buildings']:
    p = np.array(b['ring']); ax.fill(p[:, 0], p[:, 1], color='#f6b' if b.get('type') == 'religious' else '#999', alpha=0.6, lw=0.4, ec='k')
    nm = b.get('zh') or b.get('en') or ''
    if nm and abs(b['centroid'][0] - cx) < E and abs(b['centroid'][1] - cz) < E: ax.text(b['centroid'][0], b['centroid'][1], nm[:10], fontsize=6, ha='center')
for p in t['pois']:
    if abs(p['at'][0] - cx) < E and abs(p['at'][1] - cz) < E:
        ax.plot(*p['at'], 'r.', ms=4); ax.text(p['at'][0], p['at'][1], p['name'][:12], fontsize=5, color='r')
if os.environ.get('EXTRA'):
    for kk, P in json.load(open(os.environ['EXTRA'])).items():
        Ps = P if isinstance(P[0][0], list) else [P]
        for Q in Ps:
            Q = np.array(Q); ax.plot(Q[:, 0], Q[:, 1], 'b-' if len(Q) > 1 else 'bo', lw=1.5, ms=4)
            ax.text(Q[0][0], Q[0][1], kk, fontsize=5, color='b')
ax.set_xlim(cx - E, cx + E); ax.set_ylim(cz + E, cz - E); ax.set_aspect('equal'); ax.grid(alpha=0.3)
os.makedirs(SC + 'gba/szeast/plans', exist_ok=True)
out = SC + 'gba/szeast/plans/%s%s.png' % (k, sys.argv[4] if len(sys.argv) > 4 else '')
fig.savefig(out, bbox_inches='tight'); print(out)
