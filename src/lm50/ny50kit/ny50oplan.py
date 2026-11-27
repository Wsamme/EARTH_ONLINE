# plan overlay of a landmark against the real footprints of its ref (like lm26/kit/oplan.js, for the New York page):
#   python3 ny50oplan.py <module.js> <key> <ref_<group>.json> <refkey> <out.png> [half m = ref radius]
# Places the key with its last SG_PLACES entry like the app (ny50tool.js plan), builds the app's hull (lower 25 m, +3 m) and applies the
# app's hide rule (sgrSkipB: building centroid inside the hull, or more than half of its outline vertices inside). Prints the hidden
# real buildings (osm id, name, h), CLASHES (kept buildings that the model's lower 4 m overlaps) and the offset between the model's
# low plan and the hidden footprints. PNG (north up): grey kept, red hidden, orange clash, blue hull, green model below 4 m, roads.
import sys, json, subprocess, os, math
from PIL import Image, ImageDraw
from shapely.geometry import Polygon, Point, MultiPoint
K = os.path.dirname(os.path.abspath(__file__))
mod, key, refp, rk, outp = sys.argv[1:6]; half = float(sys.argv[6]) if len(sys.argv) > 6 else None
tmp = outp + '.plan.json'
subprocess.run(['node', K + '/ny50tool.js', 'plan', mod, key, tmp], check=True, stdout=subprocess.DEVNULL)
PL = json.load(open(tmp)); os.remove(tmp)
T = json.load(open(refp))['targets'][rk]
MX, MY, LON0, LAT0 = 84516.0, 111048.0, -73.98, 40.70
ax, ay = (T['anchor']['lon'] - LON0)*MX, (T['anchor']['lat'] - LAT0)*MY
L = lambda p: (p[0] - ax, -(p[1] - ay))            # NYC metres -> ref local (+x east, +z south)
hull = Polygon([L(p) for p in PL['hull']]); low = [L(p) for p in PL['low']]
half = half or T['radius']; S = 900/(2*half)
img = Image.new('RGB', (900, 900), 'white'); d = ImageDraw.Draw(img)
P = lambda x, z: (450 + x*S, 450 + z*S)
for r in T['roads']:
    if len(r['pts']) > 1: d.line([P(*q) for q in r['pts']], fill=(150, 150, 210) if r.get('bridge') else (205, 205, 205), width=max(1, int(S*(6 if r['cls'] <= 5 else 3))))
hidden, clash, kept = [], [], []
lowpts = MultiPoint(low) if low else None
for b in T['buildings']:
    ring = b['ring']; g = Polygon(ring).buffer(0)
    if g.is_empty: continue
    c = g.centroid; inn = sum(1 for q in ring if hull.contains(Point(q)))
    if hull.contains(c) or inn*2 > len(ring): hidden.append((b, g))
    elif lowpts is not None and g.buffer(-0.5).intersects(lowpts): clash.append((b, g))
    else: kept.append((b, g))
for lst, col in ((kept, (190, 190, 190)), (hidden, (225, 70, 60)), (clash, (255, 150, 30))):
    for b, g in lst:
        for q in ([g] if g.geom_type == 'Polygon' else list(g.geoms)): d.polygon([P(*xy) for xy in q.exterior.coords], fill=col, outline=(90, 90, 90))
for q in low[::max(1, len(low)//20000)]: d.point(P(*q), fill=(30, 160, 60))
d.line([P(*xy) for xy in hull.exterior.coords], fill=(40, 80, 230), width=2)
d.text((8, 8), '%s  (N up, %d m across)  grey kept / red hidden / orange clash / blue hull / green model < 4 m' % (key, 2*half), fill=(0, 0, 0))
img.save(outp)
print('placed', PL['place']); print('hull area %.0f m2, model low points %d' % (hull.area, len(low)))
print('HIDDEN', len(hidden)); [print('  ', b.get('osm'), (b.get('name') or '')[:40], 'h', b['h'], 'area', b['area']) for b, g in hidden]
print('CLASHES', len(clash)); [print('  ', b.get('osm'), (b.get('name') or '')[:40], 'h', b['h'], 'area', b['area']) for b, g in clash]
if hidden and low:
    from shapely.ops import unary_union
    hc = unary_union([g for b, g in hidden]).centroid; mc = MultiPoint(low).convex_hull.centroid
    print('centroid offset model - hidden footprints: dx %.1f m east, dz %.1f m south' % (mc.x - hc.x, mc.y - hc.y))
print('->', outp)
