# stage 5 (Tokyo): ~4 million OSM buildings and building parts -> typed, height-estimated footprints, in compact arrays (no shapely
# object per building: the geometry work runs vectorized in chunks). Japan's OSM buildings: about 30 % carry a measured height
# (the PLATEAU / GSI imports), another 27 % storeys; the rest are estimated from the land use, the footprint and the type.
# Size strategy (the brief: staged data <= ~130 MB, every file <= 15 MB base64, bld0 <= 10.9 MB gzip, heap in the New York range):
#   - footprints under 20 m2 are dropped (sheds, kiosks, carports: ~240 000), roof-only structures under 60 m2 too;
#   - footprints simplified to 0.35 m; small buildings' estimated heights in 0.5 m steps and a low-entropy seed (b7) so they gzip well.
# Writes out/bldA.npz: per building h, base, t, wall rgb, roof index, rc rgb (+ flag), part flag, name index, osm key; ragged geometry
# (XY float32, ring offsets, building -> rings); out/bld_names.pkl.
import sys, collections, hashlib, re, time; sys.path.insert(0, '.')
from common import *
import shapely
from shapely import GeometryType
t0 = time.time()
Z = np.load(OUT + 'bld_raw.npz')
XY = Z['XY']; RS = Z['RS'].astype(np.int64); BR = Z['BR'].astype(np.int64); OID = Z['OID']; FW = Z['FW']; BV = Z['BV']; TI = Z['TI']
TG = load('bld_tags.pkl'); bvoc = TG['bvoc']; tags = TG['tags']
lu = np.load(OUT + 'lu.npy')
nb = len(BR) - 1
print('buildings in', nb, flush=True)
# ---- per building: first ring area and centre (vertex mean)
x = XY[:, 0].astype(np.float64); y = XY[:, 1].astype(np.float64)
cr = np.zeros(len(x)); cr[:-1] = x[:-1]*y[1:] - x[1:]*y[:-1]
cs = np.concatenate([[0.0], np.cumsum(cr)])
r0 = BR[:-1]; s0 = RS[r0]; e0 = RS[r0 + 1]
A = 0.5*np.abs(cs[e0 - 1] - cs[s0])
cxs = np.concatenate([[0.0], np.cumsum(x)]); cys = np.concatenate([[0.0], np.cumsum(y)])
n0 = np.maximum(1, e0 - s0 - 1)
CX = (cxs[e0 - 1] - cxs[s0])/n0; CY = (cys[e0 - 1] - cys[s0])/n0
del cr, cs, cxs, cys, x, y
import gc; gc.collect()
BVS = np.array(bvoc, dtype=object)
isp = np.array([k.startswith('part:') for k in bvoc])[BV]
bvv = np.array([k[5:] if k.startswith('part:') else k for k in bvoc], dtype=object)
# ---- tags of the ~1.4 million buildings that have more than building=*
def num(v):
    if v is None: return None
    v = str(v).strip().lower().replace(',', '.')
    m = re.match(r'^([0-9.]+)\s*(m|meters?|ft|feet|\'|)?', v)
    if not m: return None
    try: q = float(m.group(1))
    except ValueError: return None
    if m.group(2) in ('ft', 'feet', "'"): q *= 0.3048
    return q
H = np.full(nb, np.nan, np.float32); LV = np.full(nb, np.nan, np.float32); MH = np.zeros(nb, np.float32); ML = np.zeros(nb, np.float32)
AM = np.zeros(nb, np.uint8)        # 1 school/civic, 2 worship, 3 hospital, 4 parking, 5 hotel, 6 shop, 7 office, 8 storage tank, 9 underground / skip
RC = np.zeros((nb, 3), np.uint8); HRC = np.zeros(nb, bool); NAMEI = np.full(nb, -1, np.int32); names = []
def colour(v):
    if not v: return None
    v = v.strip().lower()
    C = {'white':(236,236,232), 'grey':(150,150,150), 'gray':(150,150,150), 'silver':(190,192,196), 'black':(60,60,62), 'red':(176,72,60), 'brown':(122,90,70), 'blue':(80,110,150), 'green':(90,130,96),
         'yellow':(220,200,120), 'beige':(222,208,180), 'orange':(206,120,70), 'darkgray':(100,100,100), 'darkgrey':(100,100,100), 'lightgrey':(200,200,200), 'lightgray':(200,200,200), 'tan':(210,180,140), 'maroon':(110,40,40), 'navy':(40,50,90)}
    if v in C: return C[v]
    m = re.match(r'^#?([0-9a-f]{6})$', v)
    if m: h = m.group(1); return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))
    return None
nlv = 0
for k in np.nonzero(TI >= 0)[0]:
    t = tags[TI[k]]
    if t.get('location') == 'underground' or t.get('disused') == 'yes' and False: AM[k] = 9; continue
    h = num(t.get('height'))
    if h is not None and 0 < h < 700: H[k] = h
    lv = num(t.get('building:levels'))
    if lv is not None and 0 < lv < 120: LV[k] = lv
    mh = num(t.get('min_height'))
    if mh: MH[k] = mh
    ml = num(t.get('building:min_level'))
    if ml: ML[k] = ml
    a = t.get('amenity')
    if a in ('school', 'college', 'university', 'library', 'townhall', 'fire_station', 'police', 'courthouse', 'kindergarten', 'community_centre'): AM[k] = 1
    elif a == 'place_of_worship' or t.get('religion'): AM[k] = 2
    elif a in ('hospital', 'clinic'): AM[k] = 3
    elif a == 'parking' or t.get('parking') == 'multi-storey': AM[k] = 4
    elif t.get('tourism') in ('hotel', 'motel', 'hostel'): AM[k] = 5
    elif t.get('man_made') == 'storage_tank': AM[k] = 8
    elif t.get('aeroway') in ('terminal', 'hangar') or t.get('public_transport') == 'station' or t.get('railway') == 'station': AM[k] = 10
    elif t.get('shop'): AM[k] = 6
    elif t.get('office'): AM[k] = 7
    c = colour(t.get('roof:colour'))
    if c: RC[k] = c; HRC[k] = True
    if t.get('name') and (A[k] > 1500 or t.get('wikidata') or (H[k] if not np.isnan(H[k]) else 0) > 60):
        NAMEI[k] = len(names); names.append((t.get('name'), t.get('name:en'), t.get('name:zh'), t.get('name:zh-Hans')))
print('tags read', round(time.time() - t0), 's; named big buildings', len(names), flush=True)
del tags, TG
# ---- keep
inside = (np.abs(CX) < HALF) & (np.abs(CY) < HALF)
bad = np.isin(bvv[BV], ['no', 'proposed', 'demolished', 'razed', 'destroyed', 'abandoned', 'ruins', 'collapsed']) | (AM == 9)
roofonly = bvv[BV] == 'roof'
keep = inside & ~bad & ((A >= 20) | (isp & (A >= 4))) & ~(roofonly & (A < 60))
print('kept', int(keep.sum()), 'of', nb, '; dropped under 20 m2', int((inside & ~bad & ~isp & (A < 20)).sum()), flush=True)
# ---- types
TYPEMAP = {'house':3, 'detached':3, 'semidetached_house':3, 'terrace':2, 'bungalow':3, 'static_caravan':13, 'cabin':3, 'farm':3, 'apartments':2, 'residential':2, 'dormitory':2, 'mixed_use':2,
    'commercial':4, 'retail':4, 'supermarket':4, 'kiosk':13, 'office':5, 'industrial':6, 'warehouse':6, 'manufacture':6, 'factory':6, 'service':6, 'storage_tank':15, 'school':7, 'university':7, 'college':7,
    'kindergarten':7, 'public':7, 'civic':7, 'government':7, 'fire_station':7, 'police':7, 'library':7, 'museum':7, 'townhall':7, 'courthouse':7, 'church':8, 'cathedral':8, 'chapel':8, 'mosque':8,
    'temple':8, 'synagogue':8, 'religious':8, 'shrine':8, 'hospital':9, 'clinic':9, 'train_station':10, 'transportation':10, 'hangar':10, 'terminal':10, 'parking':11, 'hotel':12, 'motel':12,
    'garage':13, 'garages':13, 'carport':13, 'shed':13, 'roof':13, 'greenhouse':13, 'hut':13, 'barn':6, 'stable':13, 'grandstand':7, 'stadium':7, 'sports_centre':7, 'sports_hall':7,
    'farm_auxiliary':13, 'toilets':13, 'bunker':13, 'gasometer':15, 'silo':15, 'water_tower':15, 'construction':0, 'yes':-1}
tv = np.array([TYPEMAP.get(k, -1) for k in bvv], np.int16)[BV].astype(np.int16)
for am, tt in ((1, 7), (2, 8), (3, 9), (4, 11), (5, 12), (8, 15), (10, 10)): tv[(AM == am)] = tt
tv[(AM == 6) & (tv < 0)] = 4; tv[(AM == 7) & (tv < 0)] = 5
ci = np.clip(((CX + HALF)/CELL).astype(int), 0, N - 1); cj = np.clip(((CY + HALF)/CELL).astype(int), 0, N - 1)
LC = lu[cj, ci]            # 0 none, 1 residential, 2 commercial, 3 industrial, 4 park, 6 school/hospital, 7 military/aerodrome
# building density around (for the unmapped land use): buildings per 300 m cell
bc = np.zeros((188, 188), np.float32); bi = np.clip(((CX + HALF)/300).astype(int), 0, 187); bj = np.clip(((CY + HALF)/300).astype(int), 0, 187)
np.add.at(bc, (bj[keep], bi[keep]), 1.0)
DEN = bc[bj, bi]           # ~90 buildings / 9 ha = suburban houses; 250+ = dense city
hasH = ~np.isnan(H); hasL = ~np.isnan(LV)
Hk = np.where(hasH, H, np.where(hasL, LV*3.1 + 0.8, np.nan))
# a cheap deterministic per-building random number from the OSM id
r = ((OID.astype(np.uint64)*np.uint64(2654435761) + FW.astype(np.uint64)*np.uint64(97)) % np.uint64(1000003)).astype(np.float64)/1000003.0
r2 = ((OID.astype(np.uint64)*np.uint64(40503) + np.uint64(7)) % np.uint64(999983)).astype(np.float64)/999983.0
und = tv < 0
# building=yes / unknown: from the land use, the footprint and the measured height when there is one
known = ~np.isnan(Hk)
t_ = np.full(nb, 0, np.int16)
house = (A < 130) & (LC != 2) & (LC != 3) & (~known | (Hk < 10.5))
house |= (A < 170) & (LC == 1) & (~known | (Hk < 10.0)) & (DEN < 260)
t_[house] = 3
t_[~house & (LC == 2)] = 4
t_[~house & (LC == 2) & ((A > 600) | (known & (Hk >= 30)))] = 5
t_[~house & (LC == 3)] = 6
t_[~house & (LC == 6)] = 7
t_[~house & (LC == 7)] = np.where(A[~house & (LC == 7)] > 2500, 10, 6)
rest = ~house & ~np.isin(LC, [2, 3, 6, 7])
t_[rest & (A < 40)] = 13
t_[rest & (A >= 40)] = 2
t_[rest & (A >= 40) & known & (Hk >= 45) & (DEN > 150)] = 5
tv = np.where(und, t_, tv)
# the business districts: Marunouchi / Ōtemachi / Nihonbashi / Yaesu, Ginza / Yūrakuchō, Shiodome / Shimbashi / Toranomon / Kasumigaseki,
# Roppongi / Akasaka, Shinjuku (west and east), Shibuya, Shinagawa (Kōnan), Ikebukuro (Sunshine), Ōsaki, Tennōzu, Minato Mirai / Yokohama
# station, Kawasaki station, Saitama-Shintoshin, Makuhari, Ariake / Toyosu: mid- and high-rise buildings there are offices and shops
CBD = [(139.7590, 35.6760, 139.7790, 35.6900), (139.7600, 35.6690, 139.7730, 35.6770), (139.7420, 35.6600, 139.7630, 35.6760), (139.7240, 35.6560, 139.7440, 35.6760),
       (139.6880, 35.6850, 139.7090, 35.6960), (139.6950, 35.6540, 139.7080, 35.6640), (139.7340, 35.6230, 139.7460, 35.6330), (139.7110, 35.7240, 139.7230, 35.7330),
       (139.7240, 35.6150, 139.7330, 35.6230), (139.7440, 35.6170, 139.7520, 35.6250), (139.6250, 35.4520, 139.6420, 35.4700), (139.6150, 35.4620, 139.6280, 35.4700),
       (139.6940, 35.5280, 139.7040, 35.5360), (139.6280, 35.8890, 139.6380, 35.8980), (140.0300, 35.6420, 140.0500, 35.6560), (139.7840, 35.6290, 139.8000, 35.6560)]
inCBD = np.zeros(nb, bool)
for lo0, la0, lo1, la1 in CBD:
    (x0_, y0_), (x1_, y1_) = w(lo0, la0), w(lo1, la1); inCBD |= (CX > x0_) & (CX < x1_) & (CY > y0_) & (CY < y1_)
hk_ = np.where(np.isnan(Hk), 0, Hk)
cb = inCBD & np.isin(tv, [2, 0]) & und & ((hk_ >= 18) | (~known & (A >= 300)))
tv[cb & ((A >= 500) | (hk_ >= 40))] = 5; tv[cb & ~((A >= 500) | (hk_ >= 40))] = 4
print('business districts: offices / shops', int((cb & (tv == 5)).sum()), int((cb & (tv == 4)).sum()), flush=True)
# explicit houses that are big are apartments / mixed
tv[(tv == 3) & (A > 400) & (~known | (Hk > 11))] = 2
# ---- heights
est = np.isnan(Hk)
def E(mask, lo, span): return np.where(mask, lo + span*r, 0.0)
he = np.zeros(nb)
t3 = tv == 3; he += E(t3, 6.2, 2.4)
t2 = tv == 2; he += np.where(t2 & (A < 250), 8.5 + 3.5*r, 0) + np.where(t2 & (A >= 250) & (A < 1200), 11.5 + 10*r, 0) + np.where(t2 & (A >= 1200), 17 + 22*r, 0)
t4 = tv == 4; he += np.where(t4 & (A < 200), 8.5 + 5*r, 0) + np.where(t4 & (A >= 200) & (A < 1500), 13 + 14*r, 0) + np.where(t4 & (A >= 1500), 14 + 16*r, 0)
t5 = tv == 5; he += np.where(t5 & (A < 600), 16 + 14*r, 0) + np.where(t5 & (A >= 600), 24 + 26*r, 0)
he += E(tv == 6, 7, 6) + E(tv == 7, 10, 7) + E(tv == 8, 7, 5) + E(tv == 9, 14, 14) + E(tv == 10, 10, 6) + E(tv == 11, 9, 9) + E(tv == 12, 18, 20) + E(tv == 13, 2.6, 1.0) + E(tv == 15, 10, 8) + E(tv == 0, 6, 4)
he = np.where(est, np.round(he*2)/2, Hk)            # estimated heights in 0.5 m steps
he = np.clip(he, 2.4, 640.0)
base = np.where(MH > 0, MH, ML*3.1).astype(np.float32)
he = he.astype(np.float32)
del H, LV, MH, ML, Hk, known, house, t_, rest, DEN, bc, bi, bj, ci, cj, E, inCBD, hk_, cb
print('types', sorted(collections.Counter(tv[keep].tolist()).items()), 'estimated', int((est & keep).sum()), flush=True)
# ---- colours: Tokyo walls (white, cream and grey siding, beige and brown tile, concrete, glass) and roofs
WALLS = {0:[(222,218,210),(206,204,198)], 2:[(232,230,224),(216,204,184),(206,204,200),(184,150,122),(226,214,200),(196,196,192),(238,236,230),(168,140,116)],
    3:[(236,232,222),(220,214,200),(206,206,204),(196,182,164),(228,222,210),(176,160,144),(214,218,220),(238,236,232)], 4:[(222,218,210),(204,200,194),(214,206,192),(190,186,182)],
    5:[(176,188,198),(200,204,208),(160,172,184),(214,214,212),(140,152,164)], 6:[(214,214,210),(196,200,202),(226,224,218)], 7:[(226,222,212),(208,204,196),(232,230,224)], 8:[(196,170,140),(150,110,80)],
    9:[(236,236,232),(222,226,228)], 10:[(210,212,214),(226,226,222)], 11:[(200,200,196),(214,212,206)], 12:[(226,222,214),(200,206,212)], 13:[(180,176,168),(160,156,150),(200,198,192)], 15:[(226,226,222)]}
W = np.zeros((nb, 3), np.uint8)
for tt, pal in WALLS.items():
    m = tv == tt
    if not m.any(): continue
    P = np.array(pal, np.uint8); W[m] = P[(r2[m]*len(pal)).astype(int) % len(pal)]
m = ~np.isin(tv, list(WALLS)); W[m] = WALLS[0][0]
ROOF = np.zeros(nb, np.uint8)        # palette (sgreal/mod_bld): 0 light grey, 1 dark grey, 2 terracotta, 3 blue-grey, 4 green, 5 white, 6 brown, 7 red
ROOF[:] = np.where(r2 < 0.35, 5, 0)
h3 = tv == 3; q = (r2*7.3) % 1.0
ROOF[h3] = np.select([q[h3] < 0.42, q[h3] < 0.62, q[h3] < 0.78, q[h3] < 0.9], [1, 3, 6, 0], 2)
ROOF[tv == 13] = np.where(r2[tv == 13] < 0.5, 1, 3)
ROOF[tv == 8] = 1
# ---- building parts -> their building (the smallest outline containing the part's centre)
pk = np.nonzero(keep & isp)[0]; bk = np.nonzero(keep & ~isp)[0]
print('parts', len(pk), flush=True)
def poly_of(k):
    a = BR[k]; b = BR[k + 1]
    rings = [XY[RS[q]:RS[q + 1]].astype(np.float64) for q in range(a, b)]
    try:
        g = shapely.Polygon(rings[0], rings[1:]) if len(rings) > 1 else shapely.Polygon(rings[0])
        if not g.is_valid: g = g.buffer(0)
    except Exception: return None
    return g
owner = np.full(nb, -1, np.int64)
if len(pk):
    PT = shapely.points(CX[pk], CY[pk]); tree = shapely.STRtree(PT)
    # candidate buildings: those whose bbox holds a part centre (check with the outline)
    BB = shapely.box(CX[bk] - np.sqrt(A[bk]) - 2, CY[bk] - np.sqrt(A[bk]) - 2, CX[bk] + np.sqrt(A[bk]) + 2, CY[bk] + np.sqrt(A[bk]) + 2)
    qb, qp = tree.query(BB, predicate='intersects')
    best = {}
    for b_, p_ in zip(qb, qp):
        kb = bk[b_]; kp = pk[p_]
        g = poly_of(kb)
        if g is None or not g.contains(shapely.Point(CX[kp], CY[kp])): continue
        if kp not in best or A[kb] < A[best[kp]]: best[kp] = kb
    for kp, kb in best.items(): owner[kp] = kb
    print('parts with an owner', len(best), 'of', len(pk), flush=True)
haveparts = np.zeros(nb, bool); haveparts[owner[owner >= 0]] = True
partok = isp & (owner >= 0)
# parts take the owner's type, wall (unless coloured) and roof; parts without height take levels or the owner's
tv[partok] = tv[owner[partok]]; W[partok] = W[owner[partok]]; ROOF[partok] = ROOF[owner[partok]]
keep &= ~(isp & (owner < 0))
keep &= ~(isp & (he <= base + 0.5))
# ---- geometry: simplify (0.35 m) and validate, in chunks
del r, r2, q, LC, AM, und, h3, t2, t3, t4, t5, m, BV
gc.collect()
sel = np.nonzero(keep)[0]
print('final', len(sel), 'buildings (parts %d, with parts %d)' % (int((keep & isp).sum()), int((keep & haveparts).sum())), flush=True)
OXY = []; ORS = [np.zeros(1, np.int64)]; OBR = [np.zeros(1, np.int64)]; ORS_last = [0]; OBR_last = [0]; okv = np.zeros(len(sel), bool)
CH = 250000
for c0 in range(0, len(sel), CH):
    ks = sel[c0:c0 + CH]
    # ragged arrays of these buildings
    rr = [np.arange(BR[k], BR[k + 1]) for k in ks]; rlist = np.concatenate(rr)
    rl = RS[rlist + 1] - RS[rlist]
    vidx = np.concatenate([np.arange(RS[q], RS[q + 1]) for q in rlist])
    coords = XY[vidx].astype(np.float64)
    roff = np.concatenate([[0], np.cumsum(rl)]); goff = np.concatenate([[0], np.cumsum([len(a) for a in rr])])
    try:
        G = shapely.from_ragged_array(GeometryType.POLYGON, coords, (roff, goff))
    except Exception as e:
        print('ragged failed, slow path', e, flush=True); G = np.array([poly_of(k) for k in ks], dtype=object)
    inv = ~shapely.is_valid(G)
    if inv.any():
        F = shapely.make_valid(G[inv])
        # largest polygon of the result
        out = []
        for g in F:
            ps = [p for p in shapely.get_parts(g) if p.geom_type == 'Polygon'] if g is not None else []
            out.append(max(ps, key=lambda p: p.area) if ps else shapely.Polygon())
        G[inv] = np.array(out, dtype=object)
    G = shapely.simplify(G, 0.35, preserve_topology=True)
    ok = ~shapely.is_empty(G) & (shapely.get_type_id(G) == 3) & (shapely.area(G) >= 4)
    okv[c0:c0 + len(ks)] = ok
    T, C, (RO, GO) = shapely.to_ragged_array(G[ok])
    OXY.append(C.astype(np.float32)); ORS.append(RO[1:].astype(np.int64) + ORS_last[0]); OBR.append(GO[1:].astype(np.int64) + OBR_last[0])
    ORS_last[0] += int(RO[-1]); OBR_last[0] += int(GO[-1])
    del G, coords, vidx, rr, rlist, T, C, RO, GO
    print('geometry', c0 + len(ks), round(time.time() - t0), 's', flush=True)
sel = sel[okv]
del XY; gc.collect()
OXY = np.concatenate(OXY); ORS = np.concatenate(ORS); OBR = np.concatenate(OBR)
Af = A[sel]
np.savez(OUT + 'bldA.npz', XY=OXY, RS=ORS, BR=OBR, h=he[sel].astype(np.float32), base=base[sel], t=tv[sel].astype(np.uint8), wall=W[sel], roof=ROOF[sel], rc=RC[sel], hrc=HRC[sel],
         part=(isp[sel]), haveparts=haveparts[sel], owner=np.where(isp[sel], owner[sel], -1), osm=sel.astype(np.int64), oid=OID[sel], fw=FW[sel], area=Af.astype(np.float32),
         cx=CX[sel].astype(np.float32), cy=CY[sel].astype(np.float32), name=NAMEI[sel], est=est[sel])
save(names, 'bld_names.pkl')
hh = he[sel]
print('saved', len(sel), 'buildings; >=100 m', int((hh >= 100).sum()), 'tallest', sorted(hh.tolist())[-8:], round(time.time() - t0), 's', flush=True)
