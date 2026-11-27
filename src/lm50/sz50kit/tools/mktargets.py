# Build R/lm50/targets_sz.json from cands_sz.py: OSM footprint geometry (Overpass), CTBUH heights, app-data presence, occupancy checks.
# usage: bash SC/lm33/kit/heavy.sh python3 mktargets.py [--write]   (prints a review table; --write writes the json)
import sys, json, re, math
SZ = '/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/lm50/sz/'
sys.path.insert(0, __import__('os').path.dirname(__import__('os').path.abspath(__file__)))   # code here, data in SZ
from lib import INV, occupied, dist
import osmgeom
from cands_sz import C
from shapely.geometry import Polygon, Point
from shapely.ops import unary_union
import appbld as A
CT = {a['id']: a for a in json.load(open(SZ + 'web/ctbuh_sz.json'))}
keys = [c[0] for c in C]; dup = {k for k in keys if keys.count(k) > 1}
inv = {i['k'] for i in INV}
assert not dup, dup
clash = [k for k in keys if k in inv]; assert not clash, clash
G = osmgeom.fetch([c[3] for c in C])
def slug(s): return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')
rows = []; probs = []
EXTRA = {   # further sources checked for this round (WebFetch / WebSearch, 27 Nov 2026)
 'szbroadcast':'Chinese name 深圳邮电信息枢纽中心大厦, 240.7 m, 48 floors, 2001: https://en.wikipedia.org/wiki/Shenzhen_Broadcasting_Center_Building',
 'szavicplaza':'Chinese name 深圳中航广场, 254 m incl. spire, 52 floors, 2012: https://en.wikipedia.org/wiki/AVIC_Plaza (OSM name 交通银行大厦, alt_name 深圳中航广场)',
 'szbayopera':'Bay Opera of Shenzhen (深圳滨海演艺中心), Bao\'an, near the Bay Glory wheel; 1500-seat opera hall + 598-seat theatre; opened 17 Sep 2021: https://www.eyeshenzhen.com/content/2021-09/09/content_24555496.htm',
 'sznatmuseum':'opened 28 Jul 2026: https://www.stheadline.com/zh-hans/gba-news/3595955/',
 'szintlart':'opened May 2026: https://www.chinanews.com.cn/dwq/2026/05-31/10631883.shtml',
}
for key, grp, hero, osm, ct, zh, en, kind, note, unc in C:
    g = G.get(osm)
    if not g or not g['rings']: probs.append((key, 'no geometry for ' + osm)); continue
    polys = []
    for r in g['rings']:
        pts = [A.w(lon, lat) for lon, lat in r]
        if len(pts) >= 4: polys.append(Polygon(pts).buffer(0))
    P = unary_union(polys)
    if g.get('inner'):
        for r in g['inner']:
            pts = [A.w(lon, lat) for lon, lat in r]
            if len(pts) >= 4: P = P.difference(Polygon(pts).buffer(0))
    c = P.centroid; lat, lon = A.ll(c.x, c.y)
    rmax = max(math.hypot(x - c.x, y - c.y) for poly in (P.geoms if hasattr(P, 'geoms') else [P]) for x, y in poly.exterior.coords)
    t = g['tags']
    # app data: buildings of this build inside the footprint (centroid inside, or > half the area)
    inside = []
    for i in A.BT.query(P):
        b = A.S['bld'][int(i)]; bg = A.G[int(i)]
        if bg.is_empty: continue
        if P.contains(bg.representative_point()) or bg.intersection(P).area > 0.5*bg.area: inside.append((b['h'], b['part'], bg.area))
    happ = max([h for h, p, a in inside], default=None)
    occ = occupied(lat, lon)
    h = None; hs = ''
    if ct:
        a = CT[ct]; h = float(a['height_architecture'])
        hs = 'CTBUH Skyscraper Center: %s, %.1f m architectural height, %s floors above ground, completed %s (record %d) https://www.skyscrapercenter.com/building/%s/%d' % (a['name_intl'], h, a['floors_above'], a['completed'], ct, slug(a['name_intl']), ct)
        zh = zh or a.get('name_chinese') or a.get('name_local')
    osmurl = 'https://www.openstreetmap.org/%s/%s' % ({'w':'way', 'r':'relation'}[osm[0]], osm[1:])
    hs = (hs + '; ' if hs else '') + 'footprint / name: OSM %s "%s"%s %s' % (osm, t.get('name', ''), (' (height tag %s)' % t['height']) if t.get('height') else '', osmurl)
    if not ct: hs += '; height not verified (null)'
    if key in EXTRA: hs += '; ' + EXTRA[key]
    r = max(20, int(math.ceil(rmax + 5)))
    if not zh: probs.append((key, 'no zh name'))
    row = {'key':key, 'zh':zh, 'en':en, 'kind':kind, 'lat':round(lat, 6), 'lon':round(lon, 6), 'r':r, 'osm':osm, 'h':h, 'hs':hs, 'note':note, 'unc':unc, 'hero':bool(hero), 'group':grp,
           'area_m2':round(P.area), 'h_app':happ, 'n_app':len(inside), 'osm_name':t.get('name'), 'occ':occ}
    row['unc'] = unc
    rows.append(row)
    if not inside:
        probs.append((key, 'no app building inside the footprint'))
        row['unc'] = (unc + '; ' if unc else '') + 'footprint not in the app\'s building data (small OSM outline or open ground): the model adds it'
    if occ: probs.append((key, 'occupied: %s' % occ))
import collections
cnt = collections.Counter(r['group'] for r in rows); hc = collections.Counter(r['group'] for r in rows if r['hero'])
print('groups', dict(sorted(cnt.items())), 'heroes', dict(sorted(hc.items())), 'total', len(rows))
for r in rows: print('%-16s %-6s %s %-26s %6s %-6s app%-6s n%-3d r%-4d %8dm2 %s' % (r['key'], r['group'], '*' if r['hero'] else ' ', (r['osm_name'] or '')[:26], r['h'], r['kind'][:6], r['h_app'], r['n_app'], r['r'], r['area_m2'], r['zh']))
print('PROBLEMS', len(probs)); [print('  ', k, m) for k, m in probs]
json.dump(rows, open(SZ + 'rows.json', 'w'), ensure_ascii=False, indent=0)
if '--write' in sys.argv:
    K = ['key', 'zh', 'en', 'kind', 'lat', 'lon', 'r', 'osm', 'h', 'hs', 'note', 'unc', 'hero', 'group', 'osm_name', 'area_m2', 'h_app']
    out = [{k: r[k] for k in K} for r in sorted(rows, key=lambda r: (r['group'], not r['hero'], r['key']))]
    json.dump(out, open('/home/claude/earth_online/src/lm50/targets_sz.json', 'w'), ensure_ascii=False, indent=1)
    print('wrote', len(out))
