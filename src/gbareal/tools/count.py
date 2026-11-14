# gbareal: measure the OSM content of the new extent per region (Hong Kong, Shenzhen, Dongguan, other): buildings, building parts,
# tagged heights / levels, roads by class (count, km). Writes data/count.json and data/bcent.npz (building centroids for density maps).
import sys, json, math, time, collections, pickle
import numpy as np, osmium, shapely, shapely.wkb
from shapely.geometry import shape
from osmium.filter import KeyFilter
D = '/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/gbareal/data/'
G = json.load(open(D + 'regions.geojson'))
reg = {}
for f in G['features']:
    n = f['properties'].get('name')
    if n in ('深圳市', '东莞市', '深汕特别合作区') and f['geometry']['type'] in ('Polygon', 'MultiPolygon'): reg[n] = shape(f['geometry']).buffer(0)
SZ = reg['深圳市'].difference(reg['深汕特别合作区']).buffer(0); DG = reg['东莞市']
# Hong Kong SAR from the adm extract
wkbf = osmium.geom.WKBFactory(); HK = None
for o in osmium.FileProcessor(D + 'adm.osm.pbf').with_locations().with_areas(KeyFilter('boundary')):
    if o.is_area() and o.orig_id() == 913110 and not o.from_way(): HK = shapely.wkb.loads(bytes.fromhex(wkbf.create_multipolygon(o))).buffer(0)
pickle.dump({'sz':SZ, 'dg':DG, 'hk':HK}, open(D + 'regions.pkl', 'wb'))
for g in (SZ, DG, HK): shapely.prepare(g)
MX, MY = 103014.2, 110734.9
def region(lon, lat):
    lon = np.asarray(lon); lat = np.asarray(lat); r = np.full(lon.shape, 3, np.int8)
    r[shapely.contains_xy(HK, lon, lat)] = 0; r[shapely.contains_xy(SZ, lon, lat)] = 1; r[shapely.contains_xy(DG, lon, lat)] = 2
    return r
HWC = {'motorway':0, 'motorway_link':1, 'trunk':2, 'trunk_link':3, 'primary':4, 'primary_link':5, 'secondary':6, 'secondary_link':7, 'tertiary':8, 'tertiary_link':9,
      'residential':10, 'unclassified':10, 'living_street':10, 'road':10, 'service':11, 'busway':11, 'footway':12, 'cycleway':12, 'path':12, 'pedestrian':12, 'track':12, 'steps':12, 'bridleway':12}
bl = []; rd = []; t0 = time.time(); nparts = []
fp = osmium.FileProcessor(D + 'gba.osm.pbf').with_locations('flex_mem').with_areas(KeyFilter('building', 'building:part')).with_filter(KeyFilter('building', 'building:part', 'highway', 'railway'))
for o in fp:
    if o.is_way():
        hw = o.tags.get('highway')
        if hw in HWC and o.tags.get('area') != 'yes':
            try: cs = [(n.lon, n.lat) for n in o.nodes]
            except osmium.InvalidLocationError: continue
            if len(cs) < 2: continue
            a = np.array(cs); L = float(np.hypot(np.diff(a[:, 0])*MX, np.diff(a[:, 1])*MY).sum()); m = a[len(a)//2]
            rd.append((m[0], m[1], HWC[hw], L, len(cs), o.tags.get('bridge') not in (None, 'no'), o.tags.get('tunnel') not in (None, 'no')))
    elif o.is_area():
        t = o.tags
        part = 'building:part' in t and 'building' not in t
        if not part and t.get('building') in ('no', None): continue
        x0 = 1e9; s = 0.0; n = 0; sx = sy = 0.0; A = 0.0
        try:
            for r in o.outer_rings():
                c = [(nd.lon, nd.lat) for nd in r]
                for (ax, ay), (bx, by) in zip(c, c[1:]): A += (ax*MX)*(by*MY) - (bx*MX)*(ay*MY)
                for q in c: sx += q[0]; sy += q[1]; n += 1
        except Exception: continue
        if not n: continue
        lv = t.get('building:levels'); h = t.get('height')
        f = lambda v: float(v.split(';')[0].replace('m', '').strip()) if v else 0.0
        try: lv = f(lv)
        except ValueError: lv = 0.0
        try: h = f(h)
        except ValueError: h = 0.0
        bl.append((sx/n, sy/n, abs(A)/2, lv, h, part))
    if (len(bl) + len(rd)) % 500000 == 0 and bl: print(len(bl), len(rd), round(time.time() - t0), flush=True)
print('read', len(bl), len(rd), round(time.time() - t0), 's', flush=True)
B = np.array(bl, np.float64); R = np.array(rd, np.float64)
br = region(B[:, 0], B[:, 1]); rr = region(R[:, 0], R[:, 1])
np.savez_compressed(D + 'bcent.npz', lon=B[:, 0].astype(np.float32), lat=B[:, 1].astype(np.float32), area=B[:, 2].astype(np.float32), lv=B[:, 3].astype(np.float32), h=B[:, 4].astype(np.float32), part=B[:, 5].astype(bool), reg=br)
NAMES = ['hk', 'sz', 'dg', 'other']
out = {}
HX0, HX1, HY0, HY1 = 114.12 - 28000/MX, 114.12 + 28000/MX, 22.34 - 28000/MY, 22.34 + 28000/MY
inhk = (B[:, 0] >= HX0) & (B[:, 0] <= HX1) & (B[:, 1] >= HY0) & (B[:, 1] <= HY1)
for k, nm in enumerate(NAMES):
    m = (br == k) & (B[:, 5] == 0); p = (br == k) & (B[:, 5] == 1); q = rr == k
    out[nm] = {'buildings':int(m.sum()), 'parts':int(p.sum()), 'with_levels':int(((B[:, 3] > 0) & m).sum()), 'with_height':int(((B[:, 4] > 0) & m).sum()),
               'ge40m_tagged':int((((B[:, 4] >= 40) | (B[:, 3]*3.1 >= 40)) & m).sum()), 'area_km2':round(float(B[m, 2].sum())/1e6, 1),
               'in_hk_square':int((m & inhk).sum()),
               'roads':{c: [int(((R[:, 2] == c) & q).sum()), round(float(R[(R[:, 2] == c) & q, 3].sum())/1000)] for c in range(13)},
               'road_vertices':int(R[q, 4].sum()), 'bridges':int((R[q, 5] > 0).sum()), 'tunnels':int((R[q, 6] > 0).sum())}
json.dump(out, open(D + 'count.json', 'w'), indent=1)
for nm in NAMES: o = out[nm]; print(nm, {k: v for k, v in o.items() if k != 'roads'}, 'roads', sum(v[0] for v in o['roads'].values()), 'km', sum(v[1] for v in o['roads'].values()))
