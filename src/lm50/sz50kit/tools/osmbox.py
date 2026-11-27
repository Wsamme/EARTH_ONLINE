# OSM data around each target for the refs (Overpass mirror maps.mail.ru): buildings / parts / land-use areas / named nodes with geometry,
# cached per box in osmbox/<key>.json.  usage: python3 osmbox.py <targets json> [key ...]     (network only, no heavy memory)
import json, os, sys, subprocess, time, math
SZ = '/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/lm50/sz/'
URL = 'https://maps.mail.ru/osm/tools/overpass/api/interpreter'
os.makedirs(SZ + 'osmbox', exist_ok=True)
MX, MY = 103014.2, 110734.9
def rad_of(r): return max(120, min(1600, int(r*1.6)))
def fetch_box(key, lat, lon, rad, force=False):
    f = SZ + 'osmbox/%s.json' % key
    if os.path.exists(f) and not force: return json.load(open(f))
    dlat = (rad + 30)/MY; dlon = (rad + 30)/MX
    bb = '%.6f,%.6f,%.6f,%.6f' % (lat - dlat, lon - dlon, lat + dlat, lon + dlon)
    q = ('[out:json][timeout:170];(way["building"]({b});relation["building"]({b});way["building:part"]({b});'
         'way["landuse"]({b});relation["landuse"]({b});way["leisure"]({b});relation["leisure"]({b});'
         'way["amenity"~"university|school|college|hospital|place_of_worship|parking|marketplace"]({b});relation["amenity"~"university|school|college|hospital"]({b});'
         'way["natural"~"water|wood|beach|scrub|wetland"]({b});way["tourism"]({b});relation["tourism"]({b});way["man_made"~"pier|breakwater"]({b});way["historic"]({b});'
         'node["name"]({b}););out geom;').format(b=bb)
    for attempt in range(6):
        out = subprocess.run(['curl', '-sS', '-m', '200', URL, '--data-urlencode', 'data=' + q], capture_output=True, text=True).stdout
        try: d = json.loads(out); break
        except Exception: time.sleep(10 + 10*attempt)
    else: raise SystemExit('overpass failed for %s: %s' % (key, out[:200]))
    d = {'bbox':bb, 'elements':d['elements']}
    json.dump(d, open(f, 'w'), ensure_ascii=False, separators=(',', ':'))
    return d
if __name__ == '__main__':
    T = json.load(open(sys.argv[1])); want = set(sys.argv[2:])
    for t in T:
        if want and t['key'] not in want and t['group'] not in want: continue
        d = fetch_box(t['key'], t['lat'], t['lon'], rad_of(t['r']))
        print(t['key'], len(d['elements']), flush=True)
