# lm50 Tokyo: current OSM data around the targets, from the Overpass API (the Kantō .pbf of the v37 pipeline is no longer on this
# machine; overpass-api.de is not reachable from here, the maps.mail.ru mirror is). One query per cluster of targets (boxes merged when
# they overlap), cached as JSON:  <cache>/g_<group>.json = {'boxes': [[s, w, n, e], ...], 'elements': [...]}
#   ways / relations: building, building:part (geometry + tags), land-use / leisure / amenity / tourism / historic / man_made areas
#   (geometry), named nodes (tags).
# usage: python3 ty50_osm.py <group> [<group> ...]   (needs the targets table; positions from the first-pass cache, see below)
import json, os, sys, subprocess, time, math
HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.environ.get('TY50_CACHE', '/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/lm50/ty/osm')
OVERPASS = os.environ.get('OVERPASS', 'https://maps.mail.ru/osm/tools/overpass/api/interpreter')
def overpass(q, out):
    for k in range(4):
        r = subprocess.run(['curl', '-s', '-m', '600', '--data-urlencode', 'data=' + q, OVERPASS, '-o', out], capture_output=True)
        try:
            d = json.load(open(out))
            if 'elements' in d: return d
        except Exception: pass
        print('  overpass retry', k + 1, r.returncode, flush=True); time.sleep(20*(k + 1))
    raise SystemExit('overpass failed')
def boxes_for(points, margin_m=750):
    """points [(lat, lon)] -> merged boxes [s, w, n, e] with the margin"""
    B = []
    for lat, lon in points:
        dl = margin_m/110952.7; do = margin_m/90549.1; B.append([lat - dl, lon - do, lat + dl, lon + do])
    merged = True
    while merged:
        merged = False
        for i in range(len(B)):
            for j in range(i + 1, len(B)):
                a, b = B[i], B[j]
                if a[0] <= b[2] and b[0] <= a[2] and a[1] <= b[3] and b[1] <= a[3]:
                    u = [min(a[0], b[0]), min(a[1], b[1]), max(a[2], b[2]), max(a[3], b[3])]
                    if (u[2] - u[0])*110952.7*(u[3] - u[1])*90549.1 < 16e6: B[i] = u; del B[j]; merged = True; break
            if merged: break
    return B
def fetch(group, points):
    os.makedirs(CACHE, exist_ok=True); out = os.path.join(CACHE, 'g_%s.json' % group)
    B = boxes_for(points); els = {}
    for k, b in enumerate(B):
        bb = '%.6f,%.6f,%.6f,%.6f' % tuple(b)
        q = ('[out:json][timeout:500];(way["building"](%s);relation["building"](%s);way["building:part"](%s);relation["building:part"](%s);'
             'way["landuse"](%s);relation["landuse"](%s);way["leisure"](%s);relation["leisure"](%s);way["amenity"](%s);relation["amenity"](%s);'
             'way["tourism"](%s);way["historic"](%s);way["man_made"](%s);relation["man_made"](%s);way["natural"="water"](%s););out geom;'
             'node["name"](%s);out tags;') % ((bb,)*16)
        tmp = out + '.part%d' % k
        d = overpass(q, tmp); os.remove(tmp)
        for e in d['elements']: els[e['type'][0] + str(e['id'])] = e
        print(group, 'box', k + 1, '/', len(B), bb, len(d['elements']), 'elements', flush=True); time.sleep(5)
    json.dump({'boxes':B, 'elements':list(els.values())}, open(out, 'w'), separators=(',', ':'), ensure_ascii=False)
    print(group, 'cached', out, len(els), 'elements', round(os.path.getsize(out)/1e6, 1), 'MB', flush=True)
def fetch_rel(group):
    """re-fetch the relations of a cached group with their members' geometry ('out geom tags' drops relation members) and merge"""
    out = os.path.join(CACHE, 'g_%s.json' % group); d = json.load(open(out)); els = {e['type'][0] + str(e['id']): e for e in d['elements']}
    for k, b in enumerate(d['boxes']):
        bb = '%.6f,%.6f,%.6f,%.6f' % tuple(b)
        q = ('[out:json][timeout:500];(relation["building"](%s);relation["building:part"](%s);relation["landuse"](%s);relation["leisure"](%s);'
             'relation["amenity"](%s);relation["man_made"](%s);relation["tourism"](%s););out geom;') % ((bb,)*7)
        r = overpass(q, out + '.rel')
        for e in r['elements']: els['r' + str(e['id'])] = e
        print(group, 'relations box', k + 1, len(r['elements']), flush=True); os.remove(out + '.rel'); time.sleep(5)
    d['elements'] = list(els.values()); json.dump(d, open(out, 'w'), separators=(',', ':'), ensure_ascii=False)
def load(group):
    f = os.path.join(CACHE, 'g_%s.json' % group)
    if os.path.exists(f + '.gz'): import gzip; return json.load(gzip.open(f + '.gz', 'rt'))
    return json.load(open(f))
if __name__ == '__main__':
    # positions of the table rows from the first-pass tag caches (osm/*.json: Overpass 'out tags center' dumps made while picking)
    sys.path.insert(0, HERE); import ty50_table as TT
    C = {}
    for f in os.listdir(CACHE):
        if f.endswith('.json') and not f.startswith('g_'):
            for e in json.load(open(os.path.join(CACHE, f)))['elements']:
                if 'center' in e: C[e['type'][0] + str(e['id'])] = (e['center']['lat'], e['center']['lon'])
    if sys.argv[1] == '--rel':
        for g in sys.argv[2:]: fetch_rel(g)
        raise SystemExit(0)
    for g in sys.argv[1:]:
        pts = []
        for r in TT.ROWS:
            if r['group'] != g: continue
            oid = r['osm'].split(':')[-1]
            if oid in C: pts.append(C[oid])
            else: print('  no first-pass position for', r['key'], r['osm'])
        fetch(g, pts)
