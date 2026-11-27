# Plan overlay of one key against the real footprints of its refs (offline, no browser).
# usage: python3 oplan.py <module.js> <key> <ref.json> [<refkey>=key] <out.png> [half=1.3*radius m]
# (lm50 Shenzhen copy of lm50/ty50kit/oplan.py: Greater Bay frame; reads R/lm50/ref_sz50x.json made by refs_sz.py; hull rule as the app)
# Places the key with its LAST SG_PLACES entry (lat, lon, rot) like the app, builds the app's hull (vertices below 25 m, convex hull
# grown 3 m: tyoreal.js sgrLandmarkHulls) and applies the app's hiding rule (sgrSkipB: a real building is hidden when its centre or
# more than half of its outline vertices lie in the hull). Prints the hidden real buildings, CLASHES (kept real buildings that the
# model's lower 4 m overlaps by > 2 m2) and the offset between the model's lower-4 m plan centroid and the target footprint (meta.osm).
# PNG: grey = real kept, red = real hidden, orange = clash, blue line = hull, green = model below 4 m, thin lines = roads (bridges dark).
import sys, os, json, math, subprocess, tempfile, struct
import numpy as np
from PIL import Image, ImageDraw
from shapely.geometry import Polygon, Point, MultiPoint
from shapely.ops import unary_union
HERE = os.path.dirname(os.path.abspath(__file__))
a = sys.argv[1:]
mod, key, reff = a[0], a[1], a[2]
if len(a) >= 5 and not a[3].endswith('.png'): refkey, outp, rest = a[3], a[4], a[5:]
else: refkey, outp, rest = key, a[3], a[4:]
REF = json.load(open(reff))['targets'][refkey]
tmp = tempfile.NamedTemporaryFile(suffix='.bin', delete=False).name
info = json.loads(subprocess.run(['node', os.path.join(HERE, 'ndump.js'), mod, key, tmp], check=True, capture_output=True, text=True).stdout.strip().split('\n')[-1])
b = open(tmp, 'rb').read(); n = struct.unpack('<I', b[4:8])[0]; os.remove(tmp)
P = np.frombuffer(b, dtype=np.dtype([('p', '<f4', 9), ('c', 'u1', 4)]), count=n, offset=8)['p'].reshape(n, 3, 3).astype(np.float64)
pl = info['place']; assert pl, 'no SG_PLACES entry for ' + key
LON0, LAT0, MX, MY = 114.05204820306326, 22.65607018202933, 103014.2, 110734.9   # gbareal frame
X, Y = (pl['lon'] - LON0)*MX, (pl['lat'] - LAT0)*MY; ax, ay = (REF['anchor']['lon'] - LON0)*MX, (REF['anchor']['lat'] - LAT0)*MY
rot = pl.get('rot', 0) or 0; c, s = math.cos(rot), math.sin(rot); dx, dz = X - ax, -(Y - ay)
def toref(x, z): return (dx + x*c + z*s, dz - x*s + z*c)          # model local -> ref local (+x east, +z south)
V = P.reshape(-1, 3)
low = V[V[:, 1] < 25]; H = MultiPoint([toref(x, z) for x, y, z in low[::max(1, len(low)//18000)]]).convex_hull
if H.geom_type == 'Polygon':
    hc = H.centroid; H = Polygon([(hc.x + (px - hc.x)*(1 + 3/max(1e-6, math.hypot(px - hc.x, pz - hc.y))), hc.y + (pz - hc.y)*(1 + 3/max(1e-6, math.hypot(px - hc.x, pz - hc.y)))) for px, pz in H.exterior.coords])
green = []
for t in P:
    if t[:, 1].max() < 4 or t[:, 1].min() < 4:
        q = Polygon([toref(t[k, 0], t[k, 2]) for k in range(3)])
        if q.area > 0.05: green.append(q)
G = unary_union(green) if green else Polygon()
hidden, kept, clash = [], [], []
for bb in REF['buildings']:
    R = bb['ring']; 
    if len(R) < 3: continue
    poly = Polygon(R).buffer(0); cx, cz = bb['centroid']
    inn = sum(1 for p in R if H.contains(Point(p)))
    if H.contains(Point(cx, cz)) or inn*2 > len(R): hidden.append((bb, poly))
    else:
        kept.append((bb, poly))
        if not G.is_empty and poly.intersection(G).area > 2: clash.append((bb, poly, poly.intersection(G).area))
tgts = [bb for bb in REF['buildings'] if bb.get('target')] or [bb for bb in REF['buildings'] if REF['meta'].get('osm') and bb.get('osm') == REF['meta'].get('osm')]
tgt = {'osm':REF['meta'].get('osm'), 'ring':list(unary_union([Polygon(bb['ring']).buffer(0) for bb in tgts]).convex_hull.exterior.coords)} if tgts else None   # the target footprint: the app pieces flagged target (refs_sz.py)
gc = G.centroid if not G.is_empty else None
print('%s: place lat %.6f lon %.6f rot %.4f | tris %d | hull area %d m2 | model <4 m plan %d m2' % (key, pl['lat'], pl['lon'], rot, n, H.area, G.area))
print('hidden real buildings (%d):' % len(hidden), ', '.join('%s %s h%.0f' % (bb.get('osm', '-'), bb.get('name') or '', bb['h']) for bb, _ in hidden[:40]))
print('CLASHES (%d):' % len(clash), ', '.join('%s %s %.0f m2' % (bb.get('osm', '-'), bb.get('name') or '', ar) for bb, _, ar in clash[:40]) or 'none')
if tgt and gc is not None:
    tp = Polygon(tgt['ring']).buffer(0); print('target footprint %s: area %d m2, centroid offset model-target %.1f m E, %.1f m S; overlap %.0f %% of the target' %
          (tgt['osm'], tp.area, gc.x - tp.centroid.x, gc.y - tp.centroid.y, 100*tp.intersection(G).area/max(1, tp.area)))
elif tgt:
    tp = Polygon(tgt['ring']).buffer(0); print('target footprint %s: area %d m2 (hull of the app pieces flagged target); the model has no faces below 4 m with plan area (no bottom cap), so no offset: compare the hull (blue) with the red outline' % (tgt['osm'], tp.area))
elif REF['meta'].get('osm') not in (None, '-', 'line'): print('target footprint', REF['meta'].get('osm'), 'not among the ref buildings (see unc)')
half = float(rest[0]) if rest else max(60, 1.3*REF['radius'] if REF['radius'] < 200 else 1.1*max(abs(v) for v in H.bounds) + 40)
S = 900; k = S/(2*half); img = Image.new('RGB', (S, S), (246, 246, 242)); d = ImageDraw.Draw(img)
px = lambda p: (S/2 + p[0]*k, S/2 + p[1]*k)
for r in REF['roads']:
    pts = [px(p) for p in r['pts']]
    if len(pts) >= 2: d.line(pts, fill=(90, 90, 110) if (r.get('br') or r.get('bridge')) else (200, 200, 205), width=2 if r['cls'] <= 9 else 1)
for bb, poly in kept: d.polygon([px(p) for p in bb['ring']], fill=(200, 200, 200), outline=(140, 140, 140))
for bb, poly in hidden: d.polygon([px(p) for p in bb['ring']], fill=(240, 150, 150), outline=(200, 40, 40))
for g in (G.geoms if G.geom_type == 'MultiPolygon' else [G] if not G.is_empty else []):
    d.polygon([px(p) for p in g.exterior.coords], fill=(90, 190, 90))
for bb, poly, ar in clash: d.polygon([px(p) for p in bb['ring']], outline=(255, 140, 0), width=3)
if tgt: d.polygon([px(p) for p in tgt['ring']], outline=(200, 0, 0), width=2)
if H.geom_type == 'Polygon': d.line([px(p) for p in H.exterior.coords], fill=(40, 90, 230), width=2)
d.text((8, 8), '%s  half %.0f m  N up' % (key, half), fill=(0, 0, 0))
img.save(outp); print('wrote', outp)
