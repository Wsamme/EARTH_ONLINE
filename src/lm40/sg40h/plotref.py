# plot a ref target: python3 plotref.py ref.json key out.png [half] [cx cz] [labels-min-area]
import sys, json
import matplotlib; matplotlib.use('Agg')
import matplotlib.pyplot as plt
ref = json.load(open(sys.argv[1])); k = sys.argv[2]; out = sys.argv[3]
T = ref['targets'][k]
half = float(sys.argv[4]) if len(sys.argv) > 4 else T['radius']
cx = float(sys.argv[5]) if len(sys.argv) > 6 else 0; cz = float(sys.argv[6]) if len(sys.argv) > 6 else 0
amin = float(sys.argv[7]) if len(sys.argv) > 7 else 150
fig, ax = plt.subplots(figsize=(9, 9), dpi=90)
for a in T.get('areas', []):
    r = a.get('ring') or a.get('pts')
    if not r: continue
    xs = [p[0] for p in r] + [r[0][0]]; zs = [p[1] for p in r] + [r[0][1]]
    ax.fill(xs, zs, alpha=0.15, color='g'); ax.plot(xs, zs, 'g-', lw=0.5)
    ax.text(sum(xs)/len(xs), sum(zs)/len(zs), a.get('kind', '') + ' ' + str(a.get('name') or ''), fontsize=6, color='darkgreen')
for rd in T['roads']:
    p = rd.get('pts') or rd.get('line')
    xs = [q[0] for q in p]; zs = [q[1] for q in p]
    c = 'r' if rd.get('br') else ('#888' if rd.get('cls', 10) >= 10 else '#444')
    ax.plot(xs, zs, '-', color=c, lw=0.6 if rd.get('cls', 10) >= 10 else 1.2)
    if rd.get('name') and len(p) > 1:
        m = p[len(p)//2]; ax.text(m[0], m[1], rd['name'][:20], fontsize=5, color=c)
for b in T['buildings']:
    r = b['ring']; xs = [p[0] for p in r] + [r[0][0]]; zs = [p[1] for p in r] + [r[0][1]]
    ax.fill(xs, zs, alpha=0.35, color='tab:blue'); ax.plot(xs, zs, 'b-', lw=0.4)
    if b['area'] >= amin:
        c = b['centroid']; ax.text(c[0], c[1], '%s\n%s h%s' % (b['osm'], (b['name'] or '')[:18], b['h']), fontsize=5)
for p in T['pois']:
    ax.plot(p['at'][0], p['at'][1], 'm.', ms=3)
    ax.text(p['at'][0], p['at'][1], (p.get('name') or '')[:22], fontsize=5, color='m')
ax.set_xlim(cx - half, cx + half); ax.set_ylim(cz + half, cz - half); ax.set_aspect('equal'); ax.grid(lw=0.2)
plt.tight_layout(); plt.savefig(out)
