# lm50 Tokyo phase 1: resolve the target table (ty50_table.py) against current OSM (ty50_osm.py caches) and the app's staged map data
# (ty50_app.py), check that nothing is modelled already (ty50kit/hulls.js: the hulls the app computes for every placed landmark, and
# every site's keep polygon), and write R/lm50/targets_ty.json.
# usage: python3 ty50_targets.py            (prints one line per row and a summary; rows with an ERROR are left out of the JSON)
import json, os, sys, math, subprocess, collections
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import ty50_table as TT, ty50_app as A, ty50_osm as O
from shapely.geometry import Polygon, Point, MultiPolygon, LineString
from shapely.ops import unary_union
SCR = os.path.dirname(O.CACHE)
HULLS = os.path.join(SCR, 'hulls.json')
subprocess.run(['node', os.path.join(HERE, 'ty50kit', 'hulls.js'), HULLS], check=True, capture_output=True)
EX = json.load(open(HULLS))
EXP = [(o, Polygon([A.w(q[1], q[0]) for q in o['poly']])) for o in EX if o.get('poly') and len(o['poly']) >= 3]
EXISTING_KEYS = {o['key'] for o in EX}
from ty50_geom import geom
from shapely.geometry import LineString as _LS
def ll_of(x, y): lat, lon = A.ll(x, y); return round(lat, 6), round(lon, 6)
def tagnote(t):
    s = []
    if t.get('height'): s.append('height=%s' % t['height'])
    if t.get('building:levels'): s.append('building:levels=%s' % t['building:levels'])
    return ('OSM tags ' + ', '.join(s) + ' (mapper / PLATEAU values, not independently verified)') if s else ''
out, errs, seen_osm = [], [], {}
cache = {}
for r in TT.ROWS:
    g = r['group']
    if g not in cache:
        try: d = O.load(g)
        except FileNotFoundError: print('no OSM cache for', g, '(run ty50_osm.py', g + ')'); cache[g] = None; continue
        cache[g] = {e['type'][0] + str(e['id']): e for e in d['elements']}
    if cache[g] is None: continue
    E = cache[g]; spec = r['osm']; unc = [r['unc']] if r['unc'] else []
    msg = []; err = None
    if r['key'] in EXISTING_KEYS: err = 'key already used by an existing model'
    kind = 'b'
    if spec.startswith('a:'): kind = 'a'; oid = spec[2:]
    elif spec.startswith('line:'): kind = 'l'; oid = spec[5:]
    else: oid = spec
    e = E.get(oid)
    if e is None and not err: err = 'osm %s not in the group cache' % oid
    G = geom(e) if e is not None and not err else None
    if G is None and not err: err = 'no geometry for %s' % oid
    tags = e.get('tags', {}) if e is not None else {}
    anchor_osm = oid
    if not err and kind == 'a':
        cands = []
        for k2, e2 in E.items():
            t2 = e2.get('tags', {})
            if not t2.get('building') or t2.get('building:part') or e2['type'] == 'node': continue
            g2 = geom(e2)
            if g2 is None or g2.geom_type not in ('Polygon', 'MultiPolygon'): continue
            if G.contains(g2.representative_point()): cands.append((g2.area, k2, g2, t2))
        if not cands: err = 'no building inside the area %s' % oid
        else:
            cands.sort(key=lambda c: -c[0]); a2, anchor_osm, G, tags2 = cands[0]
            unc.append('anchored on the largest building inside precinct %s: %s %s (%d m2); confirm it is the right structure' % (oid, anchor_osm, tags2.get('name', '(unnamed)'), a2))
            tags = tags2
    if not err and kind == 'l':
        c = G.interpolate(0.5, normalized=True); cx, cy = c.x, c.y
        rr = max(math.hypot(x - cx, y - cy) for x, y in G.coords) + 6
        foot = None
    elif not err:
        if G.geom_type == 'LineString': err = 'open way for a building target'
        else:
            c = G.centroid; cx, cy = c.x, c.y
            pts = [p for poly in (G.geoms if G.geom_type == 'MultiPolygon' else [G]) for p in poly.exterior.coords]
            rr = max(math.hypot(x - cx, y - cy) for x, y in pts) + 3; foot = G
    app = None
    if not err and r['kind'] == 'bridge':
        # bridges: no building record; report the app's own bridge decks (road records with the bridge flag) over the outline
        RD = A.roads(); zone = (foot if foot is not None else G).buffer(4)
        decks = [l for l in RD if l['br'] and zone.intersects(LineString(l['pts']) if len(l['pts']) > 1 else Point(l['pts'][0]))]
        app = {'bridge_decks':len(decks), 'deck_elev_max':round(max([float(l['elev'].max()) for l in decks if l['elev'] is not None] or [0]), 1),
               'classes':sorted({l['c'] for l in decks})}
        p = Point(cx, cy)
        for o, P in EXP:
            if P.contains(p): err = 'TAKEN: anchor inside %s %s of %s' % (o['kind'], o['key'], o['mod']); break
        foot = None
    if not err and app is None:
        # the app's own record(s) on this footprint
        B = A.buildings(cx - rr - 60, cy - rr - 60, cx + rr + 60, cy + rr + 60)
        if foot is not None:
            fz = foot.buffer(2)
            inside = [b for b in B if not b['part'] and fz.contains(Point(b['cx'], b['cy']))]
            parts = [b for b in B if b['part'] and fz.contains(Point(b['cx'], b['cy']))]
            if inside:
                big = max(inside, key=lambda b: b['area'])
                hmax = max([b['h'] for b in inside + parts])
                app = {'records':len(inside), 'parts':len(parts), 'h_max':hmax, 'area_largest':round(big['area']), 'area_osm':round(foot.area), 'ratio':round(big['area']/max(1, foot.area), 2)}
                if app['ratio'] < 0.5 and len(inside) == 1: msg.append('app footprint smaller than OSM (ratio %.2f)' % app['ratio'])
            elif parts:
                app = {'records':0, 'parts':len(parts), 'h_max':max(b['h'] for b in parts), 'area_osm':round(foot.area)}
                msg.append('drawn as building:part pieces only (%d)' % len(parts))
            else:
                hit = [b for b in B if foot.intersects(Point(b['cx'], b['cy']).buffer(math.sqrt(b['area'])/2))]
                if hit: app = {'records':0, 'near':len(hit)}; msg.append('no app record centred on the OSM outline (%d near): outline changed since the v37 data' % len(hit)); unc.append('the app data (OSM of Oct 2026) has no record centred on this outline: check the refs')
                else: app = {'records':0}; msg.append('NOT IN APP (newer than the map data)'); unc.append('not in the app\'s map data (built later than the v37 OSM extract): the model stands on empty ground; check photos for the outline')
        # already modelled?
        p = Point(cx, cy)
        for o, P in EXP:
            if P.contains(p):
                err = 'TAKEN: anchor inside %s %s of %s' % (o['kind'], o['key'], o['mod']); break
            if foot is not None and P.intersects(foot):
                ov = P.intersection(foot).area/max(1, foot.area)
                if ov > 0.5: err = 'TAKEN: %.0f%% of the outline under %s %s' % (100*ov, o['kind'], o['key']); break
                if ov > 0.05: msg.append('%.0f%% of the outline under %s %s' % (100*ov, o['kind'], o['key']))
        if anchor_osm in seen_osm and not err: err = 'same OSM outline as ' + seen_osm[anchor_osm]
    if not err and r['h'] and app and app.get('h_max') is not None and app['h_max'] < 0.6*r['h']:
        unc.append('the app draws only %.0f m on this outline (verified height %s m): the tower may be missing from the app data or mapped as another outline' % (app['h_max'], r['h']))
    if err:
        errs.append((r['key'], err)); print('ERROR %-18s %-8s %s' % (r['key'], r['group'], err)); continue
    seen_osm[anchor_osm] = r['key']
    lat, lon = ll_of(cx, cy)
    hs = r['hs']; tn = tagnote(tags)
    if tn: hs = (hs + '; ' if hs else '') + tn + ' — https://www.openstreetmap.org/%s/%s' % ({'w':'way', 'r':'relation'}[anchor_osm[0]], anchor_osm[1:])
    if not hs: hs = 'no height source checked; app data height %.1f m (estimate or OSM)' % app['h_max'] if app and app.get('h_max') else 'no height source checked'
    row = dict(key=r['key'], zh=r['zh'], en=r['en'], kind=r['kind'], lat=lat, lon=lon, r=int(math.ceil(rr)),
               osm=('line' if kind == 'l' else anchor_osm), h=r['h'], hs=hs, note=r['note'], unc='; '.join(u for u in unc if u), hero=r['hero'], group=r['group'])
    if kind == 'l': row['osm_line'] = oid
    if kind == 'a': row['osm_area'] = oid
    row['osm_name'] = tags.get('name'); row['app'] = app
    out.append(row)
    print('ok    %-18s %-6s %s r=%-4d %s %s %s' % (r['key'], r['group'], row['osm'], row['r'], ('h=%s' % r['h']) if r['h'] else '', json.dumps(app), ' | '.join(msg)))
cnt = collections.Counter(o['group'] for o in out); her = collections.Counter(o['group'] for o in out if o['hero'])
print('rows', len(out), 'errors', len(errs), dict(sorted(cnt.items())), 'heroes', dict(sorted(her.items())))
json.dump({'note':'Round lm50, Tokyo targets (phase 1). lat/lon = centroid of the OSM outline (osm), r = max distance from it to the outline + 3 m '
                  '(bridges given by a line: midpoint, half length + 6 m). h = verified height (hs says what was checked and where) or null; OSM '
                  'height tags in hs are mapper / PLATEAU values, NOT verified. app = what the page draws today on that outline (records, parts, '
                  'max height, area ratio vs OSM) from site/tyodata. unc = why the anchor is uncertain. Every row was checked against the hulls of '
                  'all placed Tokyo landmarks and the keep polygons of all sites (ty50kit/hulls.js) on ' + __import__('time').strftime('%Y-%m-%d') + '.',
           'counts':dict(sorted(cnt.items())), 'targets':out}, open(os.path.join(HERE, 'targets_ty.json'), 'w'), ensure_ascii=False, indent=1)
