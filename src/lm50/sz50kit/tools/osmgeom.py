# fetch OSM geometry for ways / relations (Overpass, maps.mail.ru mirror), cached in web/geom.json: id -> {tags, rings:[[lon,lat]...] (outer rings), inner}
import json, os, subprocess, sys
CACHE = '/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/lm50/sz/web/geom.json'
URL = 'https://maps.mail.ru/osm/tools/overpass/api/interpreter'
def load():
    C = json.load(open(CACHE)) if os.path.exists(CACHE) else {}
    return {k: v for k, v in C.items() if v.get('rings')}   # retry entries without geometry
def join(ways):
    # join member ways (lists of [lon,lat]) into closed rings
    ways = [w[:] for w in ways if len(w) > 1]; rings = []
    while ways:
        r = ways.pop(0)
        while r[0] != r[-1]:
            for i, w in enumerate(ways):
                if w[0] == r[-1]: r += w[1:]; ways.pop(i); break
                if w[-1] == r[-1]: r += w[::-1][1:]; ways.pop(i); break
                if w[-1] == r[0]: r = w + r[1:]; ways.pop(i); break
                if w[0] == r[0]: r = w[::-1] + r[1:]; ways.pop(i); break
            else: break
        if len(r) >= 4: rings.append(r)
    return rings
def fetch(ids):
    C = load(); need = [i for i in ids if i not in C and i[0] in 'wr']
    for k in range(0, len(need), 150):
        part = need[k:k + 150]
        W = [i[1:] for i in part if i[0] == 'w']; R = [i[1:] for i in part if i[0] == 'r']
        q = '[out:json][timeout:120];(' + ('way(id:%s);' % ','.join(W) if W else '') + ('relation(id:%s);' % ','.join(R) if R else '') + ');out geom;'
        import time
        for attempt in range(5):
            out = subprocess.run(['curl', '-sS', '-m', '180', URL, '--data-urlencode', 'data=' + q], capture_output=True, text=True).stdout
            try: els = json.loads(out)['elements']; break
            except Exception: time.sleep(15)
        else: raise SystemExit('overpass failed: ' + out[:300])
        for e in els:
            key = e['type'][0] + str(e['id'])
            if e['type'] == 'way': C[key] = {'tags':e.get('tags', {}), 'rings':[[[p['lon'], p['lat']] for p in e['geometry']]], 'inner':[]}
            else:
                ow = [[[p['lon'], p['lat']] for p in m['geometry']] for m in e.get('members', []) if m['type'] == 'way' and m.get('role') in ('outer', '', 'outline') and 'geometry' in m]
                if not ow: ow = [[[p['lon'], p['lat']] for p in m['geometry']] for m in e.get('members', []) if m['type'] == 'way' and m.get('role') != 'inner' and 'geometry' in m]
                iw = [[[p['lon'], p['lat']] for p in m['geometry']] for m in e.get('members', []) if m['type'] == 'way' and m.get('role') == 'inner' and 'geometry' in m]
                C[key] = {'tags':e.get('tags', {}), 'rings':join(ow), 'inner':join(iw)}
        json.dump(C, open(CACHE, 'w'), ensure_ascii=False)
    return C
if __name__ == '__main__':
    C = fetch(sys.argv[1:]); print(len(C))
