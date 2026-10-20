# stage 1: land / sea / fresh water / foreign land, projected to metres
import sys; sys.path.insert(0, '.')
from common import *
from shapely.geometry import shape, box, MultiPolygon, Polygon
from shapely.ops import unary_union
B = pickle.load(open(SGD + 'base15.pkl', 'rb'))
U = pickle.load(open(SGD + 'ana/earth_union.pkl', 'rb'))
cty = json.load(open(ROOT + 'sg/0-country.geojson')); cty = cty['features'][0] if 'features' in cty else cty
C14 = proj(shape(cty['geometry'])).buffer(0)
zone = C14.buffer(1500)
comps = [proj(g) for g in U.geoms]
sg, foreign = [], []
for g in comps:
    rp = g.representative_point()
    inter = g.intersection(zone).area/g.area
    keep = inter > 0.5 or zone.contains(rp)
    lon, lat = ll(rp.x, rp.y)
    if g.area > 2e5: print('%s area %.2f km2 at %.4f %.4f frac %.2f' % ('SG ' if keep else 'XX ', g.area/1e6, lat, lon, inter))
    (sg if keep else foreign).append(g)
SGL = unary_union(sg); FOR = unary_union(foreign)
# inland water: lakes, reservoirs, rivers, canals, basins, ponds (polygons only)
FRESH_K = {'lake', 'river', 'canal', 'water', 'basin', 'reservoir', 'dock'}
fw, pools, lines = [], [], []
for p, g in B['water']:
    k = p.get('kind'); kd = p.get('kind_detail')
    if g.geom_type in ('Polygon', 'MultiPolygon'):
        if k in ('ocean', 'strait', 'bay', 'reef'): continue
        if k in ('swimming_pool', 'fountain'): pools.append(proj(g)); continue
        fw.append((p, proj(g)))
    elif g.geom_type in ('LineString', 'MultiLineString'):
        if p.get('tunnel') or p.get('is_tunnel'): continue
        lines.append(({'kind':k, 'name':p.get('name'), 'zh':p.get('name:zh-Hans') or p.get('name:zh')}, proj(g)))
FW = unary_union([g.buffer(0) for p, g in fw]).intersection(unary_union([SGL, FOR]).buffer(30))
print('SG land km2 %.1f foreign %.1f fresh %.2f pools %d water lines %d' % (SGL.area/1e6, FOR.area/1e6, FW.area/1e6, len(pools), len(lines)))
print('SG bounds', SGL.bounds, [ll(SGL.bounds[0], SGL.bounds[1]), ll(SGL.bounds[2], SGL.bounds[3])])
save({'sg':SGL, 'foreign':FOR, 'fresh':FW, 'fresh_list':fw, 'pools':pools, 'wlines':lines}, 'land.pkl')
