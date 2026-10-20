s = open('../nycreal/b6_misc.py').read()
def R(a, b, c=1):
    global s
    assert s.count(a) == c, (s.count(a), a[:100]); s = s.replace(a, b)
def cut(a, b, new):
    global s
    i = s.index(a); j = s.index(b, i); s = s[:i] + new + s[j:]
R("""# stage 6 (New York): districts (New York City neighbourhoods, New Jersey municipalities, Long Island / Westchester villages and
# census places), boroughs and counties, labels (places, POIs, waters), rail transit (subway, PATH, SIR, LIRR, Metro-North, NJ Transit,
# AirTrain, light rail) with elevation flags and deck heights on the bridges, stations, runways, stands, district lines""",
"""# stage 6 (Tokyo): districts (neighbourhoods inside the 23 special wards; the wards of Yokohama / Kawasaki / Saitama / Chiba; the other
# cities and towns), regions (the 23 wards and the municipalities), labels (places, POIs, waters), rail (tyo_lines: JR, Shinkansen,
# Tokyo Metro, Toei, private railways, AGT, monorails, trams) with elevation flags and deck heights on the bridges, stations, Haneda's
# runways and stands, district lines""")
R("from zh_names import zh as zhn, ZH\n", "from ja_names import zh_of, en_of, kanji_zh\n")
R("def zhof(t): return zhn(t.get('name:en') or t.get('name'), t.get('name:zh-Hans') or t.get('name:zh') or t.get('name:zh-CN'))", "def zhof(t): return zh_of(t) if t.get('name') else None")
cut("# ---------------- districts ----------------", "# ---------------- places ----------------", '''# ---------------- districts ----------------
# OSM Japan: admin_level 4 prefectures, 7 municipalities (the 23 special wards, cities, towns), 8 the wards of the designated cities
muni, dwards, wards23 = [], [], []
for oid, fw, t, wk in A:
    if t.get('boundary') != 'administrative' or not t.get('name'): continue
    al = t.get('admin_level')
    if al not in ('7', '8'): continue
    g = geo(wk)
    if g is None or g.is_empty: continue
    g = g.intersection(SQ)
    if g.area < 2e5 or LAND.intersection(g).area < 1e5: continue
    if al == '7': muni.append((t, g))
    else: dwards.append((t, g))
DES = ('横浜市', '川崎市', 'さいたま市', '千葉市', '相模原市')
for t, g in muni:
    if t['name'].endswith('区') and not any(t['name'].startswith(d) for d in DES): wards23.append((t, g))
print('municipalities', len(muni), 'designated-city wards', len(dwards), 'special wards', len(wards23))
W23 = unary_union([g for t, g in wards23]) if wards23 else Polygon()
w23p = prep(W23.buffer(1))
# neighbourhood seeds inside the 23 wards: place = suburb / quarter / neighbourhood with a wikidata entry or an English name (the
# well-known ones), at most ~170, the bigger kinds first
seedsrc = []
for t, (lon, lat) in NODES:
    pl = t.get('place')
    if pl in ('suburb', 'quarter', 'neighbourhood') and t.get('name'):
        x, y = w(lon, lat); seedsrc.append(({'suburb':0, 'quarter':1, 'neighbourhood':2}[pl], 0 if t.get('wikidata') else 1, 0 if t.get('name:en') else 1, t, x, y))
seedsrc.sort(key=lambda s_: s_[:3])
seeds = []
for pr_, wd_, en_, t, x, y in seedsrc:
    if not w23p.contains(Point(x, y)): continue
    if wd_ and en_: continue
    if any(math.hypot(x - s_[1], y - s_[2]) < 650 for s_ in seeds): continue
    seeds.append((t, x, y))
    if len(seeds) >= 175: break
print('neighbourhood seeds in the 23 wards', len(seeds))
hoods = []
if seeds:
    vor = voronoi_diagram(MultiPoint([(s_[1], s_[2]) for s_ in seeds]), envelope=W23.envelope.buffer(3000))
    cells = list(vor.geoms); ct = STRtree(cells)
    for t, x, y in seeds:
        c = next((cells[int(i)] for i in ct.query(Point(x, y)) if cells[int(i)].contains(Point(x, y))), None)
        if c is None: continue
        # inside its own ward only (cells do not cross ward lines)
        wd = next((g for tw, g in wards23 if g.contains(Point(x, y))), None)
        g = c.intersection(wd if wd is not None else W23)
        if not g.is_empty and g.area > 5e4: hoods.append((t['name'], t, g))
# the parts of a ward no seed reached stay with the ward
D = []
for t, g in wards23:
    D.append((t['name'], t, g))          # drawn first: the neighbourhood cells overwrite it
D += [(t['name'], t, g) for t, g in dwards]
dw = unary_union([g for t, g in dwards]) if dwards else Polygon()
for t, g in muni:
    if (t, g) in wards23 or any(t['name'].startswith(d) for d in DES) and dw.intersection(g).area > 0.5*g.area: continue
    D.append((t['name'], t, g))
room = 254 - len(hoods)
if len(D) > room:
    keep = set(id(d) for d in sorted(D, key=lambda d: -LAND.intersection(d[2]).area)[:room]); D = [d for d in D if id(d) in keep]
D += hoods
paimg = Image.new('L', (N, N), 0); PAS = []; PG = []
for i, (nm, t, g) in enumerate(D, 1):
    raster([g], CELL, i, paimg)
    gl = g.intersection(LAND); c = (gl if not gl.is_empty else g).representative_point()
    PAS.append({'en':en_of(t) or nm, 'zh':zhof(t) or nm, 'x':round(c.x), 'y':round(c.y), 'km2':round(gl.area/1e6, 2)}); PG.append(g)
assert len(PAS) < 255, len(PAS)
pa = np.asarray(paimg)
# regions: the 23 special wards and the municipalities (cities and towns; designated cities whole)
rgimg = Image.new('L', (N, N), 0); REGS = []
for t, g in muni:
    gl = g.intersection(LAND)
    if gl.area < 1e6: continue
    raster([g], CELL, len(REGS) + 1, rgimg); c = gl.representative_point()
    REGS.append({'en':en_of(t) or t['name'], 'zh':zhof(t) or t['name'], 'x':round(c.x), 'y':round(c.y), 'r':round(math.sqrt(gl.area/math.pi))})
assert len(REGS) < 255
rg = np.asarray(rgimg)
for i, P in enumerate(PAS, 1):
    m = pa == i; vals = rg[m]; P['reg'] = int(np.bincount(vals).argmax()) if vals.size else 0
print('PAS', len(PAS), 'REGS', len(REGS), [(r['en'], r['zh']) for r in REGS][:80])
np.save(OUT + 'pa.npy', pa); np.save(OUT + 'rg.npy', rg)
bnd = unary_union([g.boundary for g in PG])
bl2 = bnd.intersection(LAND.buffer(-35))
bl2 = linemerge(bl2) if bl2.geom_type == 'MultiLineString' else bl2
palines = []
for ln in (bl2.geoms if hasattr(bl2, 'geoms') else [bl2]):
    if ln.geom_type != 'LineString' or ln.length < 60: continue
    ln = ln.simplify(8); palines.append([[round(x), round(y)] for x, y in ln.coords])
print('pa lines', len(palines), sum(len(p) for p in palines))
''')
R("    nm = t.get('name:en') or t.get('name'); key = (nm, round(x/500), round(y/500))", "    nm = en_of(t) or t.get('name'); key = (nm, round(x/500), round(y/500))")
R("places = places[:2600]", "places = [p for p in places if p['k'] != 'neighbourhood' or p['pop'] or len(places) < 2600][:2600]")
R("    nm = t.get('name:en') or t['name']\n    if '(closed' in nm", "    nm = en_of(t) or t['name']\n    if '(closed' in nm")
# named waters: Tokyo Bay, the rivers and the ports
a = s.index("BIGW = ["); b = s.index("]\n", s.index("('Eastchester Bay'")) + 2
s = s[:a] + """BIGW = [('Tokyo Bay', '东京湾', 35.540, 139.860), ('Tokyo Bay', '东京湾', 35.450, 139.780), ('Sumida River', '隅田川', 35.7280, 139.8020), ('Sumida River', '隅田川', 35.6720, 139.7900),
        ('Arakawa River', '荒川', 35.7520, 139.7900), ('Arakawa River', '荒川', 35.6860, 139.8460), ('Tama River', '多摩川', 35.5720, 139.6850), ('Tama River', '多摩川', 35.6250, 139.5650),
        ('Edogawa River', '江户川', 35.7200, 139.8950), ('Edogawa River', '江户川', 35.8200, 139.8900), ('Naka River', '中川', 35.7300, 139.8550), ('Tsurumi River', '鹤见川', 35.5150, 139.6600),
        ('Port of Tokyo', '东京港', 35.6150, 139.7850), ('Port of Yokohama', '横滨港', 35.4500, 139.6650), ('Port of Kawasaki', '川崎港', 35.5000, 139.7500), ('Kyū-Edogawa River', '旧江户川', 35.6580, 139.8700),
        ('Shingashi River', '新河岸川', 35.7900, 139.6600), ('Ara River (Sumida)', '隅田川', 35.7560, 139.7510), ('Ayase River', '绫濑川', 35.7700, 139.8250), ('Funabashi Port', '船桥港', 35.6800, 139.9850)]
""" + s[b:]
R("""    big = k in ('sea', 'ocean', 'strait') or nm in ('Upper New York Bay', 'Lower New York Bay', 'Jamaica Bay', 'Newark Bay', 'Long Island Sound', 'Flushing Bay')
    waters.append({'en':t.get('name:en') or nm, 'zh':zhof(t), 'k':k, 'kd':None, 'x':round(x), 'y':round(y), 'mz':10 if big else 13, 'b':1 if big else 0})""",
"""    big = k in ('sea', 'ocean', 'strait') or nm in ('東京湾',)
    waters.append({'en':en_of(t) or nm, 'zh':zhof(t), 'k':k, 'kd':None, 'x':round(x), 'y':round(y), 'mz':10 if big else 13, 'b':1 if big else 0})""")
R("""    if not nm or g.area < 1.5e5 or ';' in nm or re.match(r'^[A-Z]{1,3}\\d', nm) or 'Evaporator' in nm: continue""", """    if not nm or g.area < 1.5e5 or ';' in nm: continue""")
R("""    waters.append({'en':nm, 'zh':d.get('zh') or zhn(nm), 'k':'reservoir' if d.get('water') == 'reservoir' or 'Reservoir' in nm else 'lake', 'kd':d.get('kind'), 'x':round(c.x), 'y':round(c.y), 'mz':10 if big else 13, 'b':1 if big else 0})""",
  """    waters.append({'en':nm, 'zh':d.get('zh') or nm, 'k':'reservoir' if d.get('water') == 'reservoir' else 'river' if d.get('kind') == 'river' else 'lake', 'kd':d.get('kind'), 'x':round(c.x), 'y':round(c.y), 'mz':10 if big else 13, 'b':1 if big else 0})""")
R("waters = [t for t in waters if t['en'] not in set(b[0] for b in BIGW)]", "_bz = set(b[1] for b in BIGW); waters = [t for t in waters if t['en'] not in set(b[0] for b in BIGW) and t['zh'] not in _bz]")
# rail
R("from nyc_lines import select as _select\nLINES = [(d['code'], d['rids'], d['en'], d['zh'], d['col'], d['grp'], d['lrt']) for d in _select(list(ROUTES.values()))]",
  "from tyo_lines import select as _select\n_WIN = set(wd[0] for wd in pickle.load(open(OUT + 'raw_ways.pkl', 'rb')))\nLINES = [(d['code'], d['rids'], d['en'], d['zh'], d['col'], d['grp'], d['lrt']) for d in _select(list(ROUTES.values()), _WIN)]\ndel _WIN")
R("    if wid in need: WAYS[wid] = (t, [w(*c) for c in cs])", "    if wid in need: WAYS[wid] = (t, [tuple(c) for c in cs])")
R("""# deck heights for the transit tracks on the road bridges (Manhattan Bridge lower level, Williamsburg Bridge, ...): the lowest road
# deck within 25 m (b4b sets those decks); special viaducts: the Culver Viaduct over the Gowanus (Smith-9th Sts, ~27 m), the
# Manhattan Valley Viaduct (125th St, ~17 m), the Broadway Bridge (Harlem River Ship Canal)""", """# deck heights for the transit tracks on the road bridges (the Yurikamome on the Rainbow Bridge's lower deck): the lowest road deck
# within 25 m (b4b sets those decks)""")
R("SPECIAL = [(box(*w(-73.9990, 40.6700), *w(-73.9925, 40.6765)), 26.5), (box(*w(-73.9620, 40.8118), *w(-73.9555, 40.8185)), 17.0), (box(*w(-73.9135, 40.8695), *w(-73.9095, 40.8745)), 15.0)]", "SPECIAL = []")
R("    G = kept['subway' if grp in ('subway',) else grp]", "    G = kept[grp]")
# stations: by the operator family, else any line within 70 m
a = s.index("def GRPTAG(t):"); b = s.index("print('stations'", a)
s = s[:a] + """def GRPTAG(t):
    s = (t.get('network', '') + ' ' + t.get('operator', '') + ' ' + t.get('name:en', '')).lower()
    if '新幹線' in s or 'shinkansen' in s: return {'shink', 'jr'}
    if '東京地下鉄' in s or '東京メトロ' in s or 'tokyo metro' in s: return {'metro'}
    if '東京都交通局' in s or '都営' in s or 'toei' in s: return {'toei', 'tram', 'agt'}
    if '横浜市交通局' in s or '横浜市営' in s: return {'ysub'}
    if 'jr' in s or '旅客鉄道' in s: return {'jr', 'shink'}
    if 'モノレール' in s or 'monorail' in s: return {'mono'}
    if 'ゆりかもめ' in s or 'yurikamome' in s or 'シーサイド' in s or 'ニューシャトル' in s: return {'agt'}
    return None
stations = []
for t, (lon, lat) in NODES:
    if not (t.get('railway') in ('station', 'halt') or (t.get('public_transport') == 'station' and any(t.get(k) == 'yes' for k in ('train', 'subway', 'light_rail', 'monorail', 'tram')))) or not t.get('name'): continue
    if t.get('bus') == 'yes' and t.get('railway') not in ('station', 'halt'): continue
    x, y = w(lon, lat)
    if not (-HALF < x < HALF and -HALF < y < HALF): continue
    g = GRPTAG(t)
    codes = []
    for code, rid, en, zh, col, grp, lrt in LINES:
        if g and grp not in g and not (grp == 'priv' and g == {'agt'}): continue
        if g is None and grp in ('metro', 'toei', 'jr', 'shink'): pass
        if any(abs(p[0] - x) < 90 and abs(p[1] - y) < 90 and math.hypot(p[0] - x, p[1] - y) < 90 for p in allpts[code]): codes.append(code)
    if not codes: continue
    nm = en_of(t) or t['name']; nm = re.sub(r'\\s+Station$', '', nm)
    if any(s_['en'] == nm and set(s_['codes']) & set(codes) and math.hypot(s_['x'] - x, s_['y'] - y) < 500 for s_ in stations): continue
    stations.append({'en':nm, 'zh':zhof(t) or nm, 'codes':codes[:8], 'x':round(x), 'y':round(y)})
""" + s[b:]
R("print('stations', len(stations), collections.Counter(s['codes'][0][0] for s in stations))", "print('stations', len(stations), collections.Counter(s_['codes'][0][0] for s_ in stations))")
# runways / stands: Haneda
R("AIRPORTS = {'JFK':(-73.800, 40.635, -73.770, 40.655), 'LGA':(-73.885, 40.768, -73.855, 40.780), 'EWR':(-74.190, 40.682, -74.170, 40.700)}", "AIRPORTS = {'HND':(139.760, 35.535, 139.800, 35.565)}")
R("APBOX = {'JFK':(-73.830, 40.615, -73.745, 40.665), 'LGA':(-73.895, 40.762, -73.850, 40.790), 'EWR':(-74.195, 40.665, -74.150, 40.712)}", "APBOX = {'HND':(139.735, 35.510, 139.840, 35.580)}")
R("R = load('roads.pkl'); Bl = load('buildings.pkl')", """R = load('roads.pkl')
# terminal buildings near Haneda from the compact building arrays (b5)
_Z = np.load(OUT + 'bldA.npz'); _x0, _y0 = w(139.735, 35.510); _x1, _y1 = w(139.840, 35.580)
_m = np.nonzero((_Z['cx'] > _x0) & (_Z['cx'] < _x1) & (_Z['cy'] > _y0) & (_Z['cy'] < _y1) & ~_Z['part'])[0]
class _B(dict): pass
Bl = {'b':[]}
for _k in _m:
    _a = _Z['RS'][_Z['BR'][_k]]; _b = _Z['RS'][_Z['BR'][_k] + 1]
    Bl['b'].append({'g':Polygon(_Z['XY'][_a:_b].astype(np.float64)), 't':int(_Z['t'][_k]) if _Z['area'][_k] < 6000 or int(_Z['t'][_k]) in (6, 13) else (10 if int(_Z['t'][_k]) in (0, 2, 4, 5, 7) else int(_Z['t'][_k]))})
del _Z""")
open('b6_misc.py', 'w').write(s)
