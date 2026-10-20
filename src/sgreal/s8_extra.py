# stage 8: airport stands and runways, planning-area boundary lines -> extra.pkl (merged into the base json by s7)
import sys; sys.path.insert(0, '.')
from common import *
from shapely.geometry import Point, LineString, box
from shapely.ops import unary_union, linemerge
from shapely.strtree import STRtree
from raster import polys_of
Bl = load('buildings.pkl'); R = load('roads.pkl'); L = load('land.pkl')
# runways (Changi, Seletar, Paya Lebar, Tengah) as centre lines with ends
rw = [l for l in R['lines'] if l['c'] == 13]
runways = []
for l in rw:
    cs = list(l['g'].coords); a, b = cs[0], cs[-1]
    if l['g'].length < 900: continue
    runways.append({'a':[round(a[0], 1), round(a[1], 1)], 'b':[round(b[0], 1), round(b[1], 1)], 'len':round(l['g'].length), 'name':l['name'] or ''})
print('runways', [(r['len'], ll(*r['a'])) for r in runways])
# aircraft stands around Changi's terminal piers
CH = box(*w(103.975, 1.325), *w(104.03, 1.375))
taxi = [l['g'] for l in R['lines'] if l['c'] == 14 and l['g'].intersects(CH)]
rds = [l['g'] for l in R['lines'] if l['c'] <= 10 and l['g'].intersects(CH)]
bl = [b['g'] for b in Bl['b'] if b['g'].intersects(CH)]
tt, rt, bt = STRtree(taxi), STRtree(rds), STRtree(bl)
terms = [b for b in Bl['b'] if b['t'] == 10 and b['g'].area > 12000 and b['g'].intersects(CH) and 'Jewel' not in (b['name'] or '') and 'Terminal 5' not in (b['name'] or '')]
stands = []
for b in terms:
    g = b['g'].simplify(4); ring = g.exterior; Lr = ring.length
    for k in range(int(Lr/62)):
        s0 = (k + 0.5)*62; p = ring.interpolate(s0); q = ring.interpolate(min(Lr, s0 + 3)); r = ring.interpolate(max(0, s0 - 3))
        tx, ty = q.x - r.x, q.y - r.y; n = math.hypot(tx, ty) or 1; nx, ny = ty/n, -tx/n         # ring is CCW: right normal points out
        c = Point(p.x + nx*40, p.y + ny*40)
        if g.contains(c): nx, ny = -nx, -ny; c = Point(p.x + nx*40, p.y + ny*40)
        dt = min((taxi[int(i)].distance(c) for i in tt.query(c.buffer(260))), default=1e9)
        dr = min((rds[int(i)].distance(c) for i in rt.query(c.buffer(60))), default=1e9)
        hit = any(bl[int(i)].intersects(c.buffer(14)) for i in bt.query(c.buffer(14)))
        if dt > 260 or dr < 45 or hit: continue
        if any(math.hypot(c.x - s[0], c.y - s[1]) < 58 for s in stands): continue
        stands.append([round(c.x, 1), round(c.y, 1), round(math.atan2(-ny, -nx), 3)])
print('stands', len(stands))
# planning-area boundaries inside the land
pas = json.load(open(ROOT + 'sg/2-planning-area.geojson'))['features']
from shapely.geometry import shape
bnd = unary_union([proj(shape(f['geometry'])).buffer(0).boundary for f in pas])
inner = L['sg'].buffer(-35)
bl2 = bnd.intersection(inner)
bl2 = linemerge(bl2) if bl2.geom_type == 'MultiLineString' else bl2
palines = []
for ln in (bl2.geoms if hasattr(bl2, 'geoms') else [bl2]):
    if ln.geom_type != 'LineString' or ln.length < 60: continue
    ln = ln.simplify(8); palines.append([[round(x), round(y)] for x, y in ln.coords])
print('pa lines', len(palines), sum(len(p) for p in palines))
save({'runways':runways, 'stands':stands, 'palines':palines}, 'extra.pkl')
