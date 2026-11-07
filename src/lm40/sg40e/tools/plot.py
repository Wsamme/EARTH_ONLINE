# plot a ref target: python3 plot.py <ref.json> <key> <out.png> [half] [cx cz]
import json, sys, matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
D = json.load(open(sys.argv[1]))['targets']; k = sys.argv[2]; t = D[k]
half = float(sys.argv[4]) if len(sys.argv) > 4 else t['radius']
cx, cz = (float(sys.argv[5]), float(sys.argv[6])) if len(sys.argv) > 6 else (0, 0)
fig, ax = plt.subplots(figsize=(float(__import__("os").environ.get("FS","9")),)*2)
for a in t.get('areas', []):
    xs = [p[0] for p in a['ring']]; zs = [p[1] for p in a['ring']]
    ax.fill(xs, zs, color='#dfe', alpha=0.5, zorder=0); ax.text(sum(xs)/len(xs), sum(zs)/len(zs), a['kind'] + ':' + str(a.get('name')), fontsize=6, color='g')
for r in t['roads']:
    xs = [p[0] for p in r['pts']]; zs = [p[1] for p in r['pts']]
    c = 'red' if r.get('br') else 'orange' if r['cls'] <= 9 else 'silver' if r['cls'] <= 11 else 'lightgreen'
    ax.plot(xs, zs, '-', color=c, lw=2.5 if r['cls'] <= 9 else 1.2, zorder=1)
    if r.get('br') or r.get('name'):
        m = len(r['pts'])//2; ax.text(r['pts'][m][0], r['pts'][m][1], (r.get('name') or '') + (' br' + str([round(e,1) for e in r.get('elev', [])][:3]) if r.get('br') else ''), fontsize=5, color='r' if r.get('br') else 'k')
for b in t['buildings']:
    xs = [p[0] for p in b['ring']] + [b['ring'][0][0]]; zs = [p[1] for p in b['ring']] + [b['ring'][0][1]]
    ax.fill(xs, zs, color='#bbb', alpha=0.6, zorder=2); ax.plot(xs, zs, 'k-', lw=0.6, zorder=3)
    c = b['centroid']; ax.text(c[0], c[1], '%s\n%s h%s' % ((b.get('name') or '')[:22], b['osm'], b['h']), fontsize=5, ha='center', zorder=4)
for p in t['pois']:
    ax.plot(p['at'][0], p['at'][1], 'b.', zorder=5); ax.text(p['at'][0], p['at'][1], p['name'][:28], fontsize=5, color='b', zorder=5)
ax.plot(0, 0, 'm+', ms=14)
ax.set_xlim(cx - half, cx + half); ax.set_ylim(cz + half, cz - half); ax.set_aspect('equal'); ax.grid(alpha=0.3)
plt.tight_layout(); plt.savefig(sys.argv[3], dpi=80)
