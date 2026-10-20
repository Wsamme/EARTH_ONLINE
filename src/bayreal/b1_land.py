# stage 1: land / sea from the OSM coastline (land on the left of each way), inland water, pools, water lines (metres)
import sys, collections; sys.path.insert(0, '.')
from common import *
import shapely.wkb
from shapely.geometry import LineString, Polygon, MultiPolygon, box, Point
from shapely.ops import linemerge, unary_union, polygonize
from shapely.strtree import STRtree
R = pickle.load(open(OUT + 'raw.pkl', 'rb'))
SQ = box(-HALF - 800, -HALF - 800, HALF + 800, HALF + 800)
coast = []
for wid, t, cs in R['ways']:
    if t.get('natural') == 'coastline': coast.append(LineString([w(*c) for c in cs]))
print('coastline ways', len(coast))
segs = []       # oriented segments for the side test
for ln in coast:
    c = list(ln.coords)
    for a, b in zip(c, c[1:]): segs.append((a, b))
stree = STRtree([LineString([a, b]) for a, b in segs])
cl = unary_union([ln.intersection(SQ) for ln in coast] + [SQ.boundary])
faces = list(polygonize(cl))
print('faces', len(faces))
from shapely.prepared import prep
land = []
for f in faces:
    pf = prep(f); votes = 0
    for (a, b) in [segs[int(i)] for i in stree.query(f.boundary, predicate='intersects')][:4000:7] or []:
        mx, my = (a[0] + b[0])/2, (a[1] + b[1])/2; L = math.hypot(b[0] - a[0], b[1] - a[1])
        if L < 0.5: continue
        nx, ny = -(b[1] - a[1])/L, (b[0] - a[0])/L          # left normal
        if f.boundary.distance(Point(mx, my)) > 0.05: continue
        if pf.contains(Point(mx + nx*0.4, my + ny*0.4)): votes += 1
        elif pf.contains(Point(mx - nx*0.4, my - ny*0.4)): votes -= 1
    if votes > 0: land.append(f)
    if f.area > 5e6: print('face %.1f km2 votes %d' % (f.area/1e6, votes))
LAND = unary_union(land).buffer(0)
print('land km2 %.1f of square %.1f' % (LAND.area/1e6, SQ.area/1e6))
# inland water: lakes, reservoirs, salt ponds, rivers (polygons); swimming pools; water lines
fw, pools, wlines = [], [], []
for oid, fway, t, wk in R['areas']:
    nat = t.get('natural'); wt = t.get('water'); lu = t.get('landuse'); ww = t.get('waterway'); lei = t.get('leisure')
    if lei == 'swimming_pool' or t.get('amenity') == 'fountain':
        g = proj(shapely.wkb.loads(wk)); pools.append(g); continue
    is_w = nat == 'water' or lu in ('reservoir', 'basin', 'salt_pond') or ww in ('riverbank', 'dock') or (wt is not None and nat in (None, 'water'))
    if not is_w or nat == 'bay': continue
    if wt in ('pond', 'reflecting_pool') and t.get('intermittent') == 'yes': continue
    g = proj(shapely.wkb.loads(wk)).buffer(0)
    if g.is_empty: continue
    kind = 'salt_pond' if (lu == 'salt_pond' or wt in ('salt_pool', 'salt_pond', 'salt_evaporation')) else 'reservoir' if (lu == 'reservoir' or wt == 'reservoir') else 'river' if wt in ('river', 'canal', 'stream') or ww == 'riverbank' else 'basin' if (lu == 'basin' or wt == 'basin') else 'lake' if wt in ('lake', 'lagoon', 'oxbow') else 'water'
    fw.append(({'kind':kind, 'name':t.get('name'), 'zh':t.get('name:zh'), 'water':wt}, g))
for wid, t, cs in R['ways']:
    k = t.get('waterway')
    if k in ('river', 'stream', 'canal', 'drain') and t.get('tunnel') not in ('yes', 'culvert') and t.get('layer', '0') not in ('-1', '-2'):
        wlines.append(({'kind':k, 'name':t.get('name'), 'zh':t.get('name:zh')}, LineString([w(*c) for c in cs])))
FW = unary_union([g for p, g in fw]).intersection(LAND.buffer(60))
print('fresh km2 %.2f bodies %d pools %d lines %d' % (FW.area/1e6, len(fw), len(pools), len(wlines)), collections.Counter(p['kind'] for p, g in fw))
save({'sg':LAND, 'foreign':MultiPolygon(), 'fresh':FW, 'fresh_list':fw, 'pools':pools, 'wlines':wlines}, 'land.pkl')
# preview
from PIL import Image, ImageDraw
S = 1200; im = Image.new('RGB', (S, S), (120, 160, 185)); d = ImageDraw.Draw(im)
T = lambda x, y: ((x + HALF)/(2*HALF)*S, S - (y + HALF)/(2*HALF)*S)
for g in (LAND.geoms if hasattr(LAND, 'geoms') else [LAND]):
    d.polygon([T(*c) for c in g.exterior.coords], fill=(225, 220, 205))
    for r in g.interiors: d.polygon([T(*c) for c in r.coords], fill=(120, 160, 185))
for p, g in fw:
    for q in (g.geoms if hasattr(g, 'geoms') else [g]):
        if q.geom_type == 'Polygon': d.polygon([T(*c) for c in q.exterior.coords], fill=(200, 120, 160) if p['kind'] == 'salt_pond' else (90, 150, 200))
im.save(OUT + 'prev_land.png')
