# match CTBUH completed Shenzhen buildings (>= MINH m) with OSM building footprints (name / height / distance) -> web/match.json
import sys, json, math, re
sys.path.insert(0, __import__('os').path.dirname(__import__('os').path.abspath(__file__)))
from lib import *
MINH = float(sys.argv[1]) if len(sys.argv) > 1 else 150
A = json.load(open(SC + 'web/ctbuh_sz.json'))
O = [e for e in json.load(open(SC + 'web/osm_bld.json'))['elements'] if 'center' in e]
def norm(s): return re.sub(r'[\s·・\-()（）]', '', s or '')
out = []
for a in A:
    if a['status'] != 'COM' or not a['height_architecture'] or float(a['height_architecture']) < MINH: continue
    h = float(a['height_architecture'])
    if not a['latitude']: print('NOCOORD', a['name_intl'], h, a.get('name_chinese'), file=sys.stderr); continue
    lat, lon = float(a['latitude']), float(a['longitude'])
    zh = norm(a.get('name_chinese') or a.get('name_local'))
    best = []
    for e in O:
        c = e['center']; d = dist(lat, lon, c['lat'], c['lon'])
        if d > 400: continue
        t = e['tags']; on = norm(t.get('name')); oh = H(t)
        sc = d
        if zh and on and (zh in on or on in zh) and len(on) >= 3: sc -= 300
        if oh and abs(oh - h) < 3: sc -= 150
        elif oh and abs(oh - h) < 12: sc -= 60
        best.append((sc, d, e))
    best.sort(key=lambda t: t[0])
    m = best[0] if best else None
    r = {'ctbuh':a['id'], 'en':a['name_intl'], 'zh':a.get('name_chinese') or a.get('name_local'), 'h':h, 'floors':a['floors_above'], 'year':a['completed'], 'lat':lat, 'lon':lon, 'use':a['main_use_01'], 'addr':a['address']}
    if m:
        e = m[2]; r.update({'osm':e['type'][0] + str(e['id']), 'osm_name':e['tags'].get('name'), 'osm_h':H(e['tags']), 'olat':e['center']['lat'], 'olon':e['center']['lon'], 'd':round(m[1]), 'score':round(m[0])})
        r['occ'] = occupied(e['center']['lat'], e['center']['lon'])
    out.append(r)
json.dump(out, open(SC + 'web/match.json', 'w'), ensure_ascii=False, indent=0)
for r in sorted(out, key=lambda r: -r['h']):
    print('%6.1f %-42s %-14s %4s %-9s %-12s d%4s s%5s %s' % (r['h'], r['en'][:42], (r['zh'] or '')[:14], r['year'], r.get('osm',''), (r.get('osm_name') or '')[:12], r.get('d'), r.get('score'), r.get('occ', '')[:2] if r.get('occ') else ''))
