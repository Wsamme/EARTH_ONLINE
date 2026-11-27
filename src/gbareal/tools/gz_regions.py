# frame gz: the region polygons (lon/lat) from the OSM admin relations of the extracts -> data/regions.pkl (+ data/admin.json listing)
#   hk: Hong Kong SAR (relation 913110), sz: 深圳市 minus 深汕特别合作区, dg: 东莞市, gz: 广州市, and Guangzhou's 11 districts (admin_level 6)
import sys, json, time, pickle; sys.path.insert(0, '.')
from common import *
import osmium, shapely, shapely.wkb
from osmium.filter import KeyFilter
wkbf = osmium.geom.WKBFactory(); X0, Y0, X1, Y1 = BBOX; t0 = time.time()
got = {}; lst = []
for f in PBFS:
    for o in osmium.FileProcessor(f).with_locations('flex_mem').with_areas(KeyFilter('boundary')).with_filter(KeyFilter('boundary')):
        if not o.is_area() or o.from_way(): continue
        t = {k.k: k.v for k in o.tags}
        if t.get('boundary') != 'administrative' or t.get('admin_level') not in ('3', '4', '5', '6', '7'): continue
        try: g = shapely.wkb.loads(bytes.fromhex(wkbf.create_multipolygon(o))).buffer(0)
        except Exception as e: print('bad area', o.orig_id(), t.get('name'), e); continue
        b = g.bounds
        if b[2] < X0 or b[0] > X1 or b[3] < Y0 or b[1] > Y1: continue
        k = o.orig_id()
        if k in got: continue
        got[k] = (t, g); lst.append({'id':k, 'al':t.get('admin_level'), 'name':t.get('name'), 'en':t.get('name:en'), 'bounds':[round(v, 4) for v in b]})
    print('file', f.split('/')[-1], len(got), round(time.time() - t0), 's', flush=True)
def one(name, al=None):
    c = [(k, t, g) for k, (t, g) in got.items() if t.get('name') == name and (al is None or t.get('admin_level') == al)]
    assert c, name; c.sort(key=lambda r: -r[2].area); print(name, [(k, t.get('admin_level'), round(g.area, 4)) for k, t, g in c]); return c[0][2]
HK = got[913110][1] if 913110 in got else one('香港 Hong Kong')
SZ = one('深圳市', '5').difference(one('深汕特别合作区')).buffer(0); DG = one('东莞市', '5'); GZ = one('广州市', '5')
GZD = {}
for k, (t, g) in got.items():
    if t.get('admin_level') == '6' and g.representative_point().within(GZ) and g.intersection(GZ).area > 0.8*g.area: GZD[t.get('name')] = (k, t.get('name:en'), g)
print('Guangzhou districts', len(GZD), sorted((v[0], n, v[1]) for n, v in GZD.items()))
pickle.dump({'sz':SZ, 'dg':DG, 'hk':HK, 'gz':GZ, 'gzd':{n: (v[0], v[1], v[2]) for n, v in GZD.items()}}, open(DATA + 'regions.pkl', 'wb'))
json.dump(sorted(lst, key=lambda r: (r['al'], r['name'] or '')), open(DATA + 'admin.json', 'w'), ensure_ascii=False, indent=0)
print('GZ bounds', GZ.bounds, 'SZ', SZ.bounds, 'DG', DG.bounds, 'HK', HK.bounds, round(time.time() - t0), 's')
