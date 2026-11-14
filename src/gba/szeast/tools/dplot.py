# dplot.py key : plot data.json entries of a key
import json, sys
import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
plt.rcParams['font.sans-serif'] = ['Noto Sans CJK SC', 'DejaVu Sans']
D = json.load(open('data.json'))[sys.argv[1]]
fig, ax = plt.subplots(figsize=(8, 8), dpi=90)
def draw(nm, v, c):
    if isinstance(v, dict):
        if 'r' in v: v = v['r']
        elif 'p' in v: v = v['p']
        else:
            for kk, vv in v.items(): draw(kk, vv, c)
            return
    if not isinstance(v, list) or not v: return
    if isinstance(v[0], (int, float)): ax.plot(v[0], v[1], 'o', color=c, ms=3); ax.text(v[0], v[1], nm, fontsize=6); return
    if isinstance(v[0], dict) or (isinstance(v[0], list) and v[0] and isinstance(v[0][0], list)):
        for e in v: draw('', e, c)
        return
    xs = [p[0] for p in v]; zs = [p[1] for p in v]; ax.plot(xs + [xs[0]] if len(v) > 2 and nm not in ('st', 'coast') else xs, zs + [zs[0]] if len(v) > 2 and nm not in ('st', 'coast') else zs, '-', color=c, lw=0.8)
cols = 'krbgmcy'
for i, (nm, v) in enumerate(D.items()):
    if nm == 'T': continue
    draw(nm, v, cols[i % len(cols)])
ax.set_aspect('equal'); ax.invert_yaxis(); ax.grid(alpha=.3)
fig.savefig('../plans/d_%s.png' % sys.argv[1], bbox_inches='tight')
