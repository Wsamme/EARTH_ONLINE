# road50/osm_tunnels.py — the drivable tunnel / underpass ways the road pipelines drop, read from an OSM extract (read only).
#   python3 road50/osm_tunnels.py <extract.osm.pbf> <out.json> lon0,lat0,lon1,lat1 [source description, e.g. the download URL]
# Kept: highway classes the app drives (motorway .. residential / unclassified / living_street / road, as b4_roads.py's HW table,
# classes 0-10) with tunnel=yes | building_passage, or layer < 0 (the pipelines skip both). Two passes (ways, then their nodes), no
# location index, so memory stays small (pass 2 filters the node ids in C++). Output: {source, timestamp, ways:[{id, tags, nodes:[[id, lon, lat], ...]}]}.
import sys, json, os, osmium
from osmium.filter import KeyFilter, IdFilter
PBF, OUT, BB = sys.argv[1], sys.argv[2], [float(v) for v in sys.argv[3].split(',')]
HW = {'motorway', 'motorway_link', 'trunk', 'trunk_link', 'primary', 'primary_link', 'secondary', 'secondary_link', 'tertiary', 'tertiary_link',
      'residential', 'unclassified', 'living_street', 'road', 'residential_link'}
KEEP = ('highway', 'tunnel', 'layer', 'oneway', 'junction', 'name', 'name:en', 'name:zh', 'name:zh-Hans', 'name:zh-Hant', 'ref', 'covered', 'bridge', 'access', 'motor_vehicle')
def under(t):
    if t.get('tunnel') in ('yes', 'building_passage'): return True
    try: return int(t.get('layer', '0').split(';')[0]) < 0 and t.get('bridge') in (None, 'no')
    except ValueError: return False
ways, need = [], set()
for o in osmium.FileProcessor(PBF, osmium.osm.WAY).with_filter(KeyFilter('highway')):
    t = {tg.k: tg.v for tg in o.tags}
    if t.get('highway') not in HW or not under(t): continue
    ways.append({'id':o.id, 'tags':{k: t[k] for k in KEEP if k in t}, 'nids':[n.ref for n in o.nodes]}); need.update(w for w in ways[-1]['nids'])
print('candidate ways', len(ways), 'nodes', len(need), flush=True)
loc = {}
for o in osmium.FileProcessor(PBF, osmium.osm.NODE).with_filter(IdFilter(need)):      # the node ids are filtered in C++
    loc[o.id] = (o.location.lon, o.location.lat)
out = []
for w in ways:
    pts = [[n, *loc[n]] for n in w['nids'] if n in loc]
    if len(pts) < 2 or not any(BB[0] <= p[1] <= BB[2] and BB[1] <= p[2] <= BB[3] for p in pts): continue
    out.append({'id':w['id'], 'tags':w['tags'], 'nodes':pts})
st = os.path.join(os.path.dirname(PBF), os.path.basename(PBF).replace('.osm.pbf', '.state.txt'))
ts = open(st).read().split('timestamp=')[-1].strip().replace('\\', '') if os.path.exists(st) else ''
SRC = sys.argv[4] if len(sys.argv) > 4 else os.path.basename(PBF)
json.dump({'source':SRC, 'timestamp':ts, 'bbox':BB, 'ways':out}, open(OUT, 'w'))
print('ways in the box', len(out), 'tunnel=yes', sum(1 for w in out if w['tags'].get('tunnel') == 'yes'), flush=True)
