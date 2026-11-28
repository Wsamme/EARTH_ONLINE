# road50: the named tunnels R6 added for a city (from out/<city>_repair_tun.json): name, ways, km, example way ids
import json, sys, collections
r = json.load(open(f'out/{sys.argv[1]}_repair_tun.json'))
by = collections.defaultdict(list)
for c in r['changes']:
    if c['rule'] in ('R6', 'R6b'): by[c['osmName'] or '(unnamed)'].append(c)
pat = sys.argv[2:] or None
rows = sorted(by.items(), key=lambda kv: -sum(c['len'] for c in kv[1]))
for k, L in rows:
    if pat and not any(p.lower() in k.lower() for p in pat): continue
    print(f"{k}: {len(L)} ways, {sum(c['len'] for c in L)/1000:.1f} km, e.g. {', '.join(c['osm'] for c in L[:3])}")
