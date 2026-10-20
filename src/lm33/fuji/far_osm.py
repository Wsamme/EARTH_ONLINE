# fuji stage 1 (run through lm33/kit/heavy.sh): land cover outside the Tokyo square from the Kanto OSM extract, 160 m cells.
# Writes out/cover_osm.npz: bld (building vertex count per cell), and 0/1 masks water, forest, field, urban (OSM polygons).
# The Kanto extract does not cover Yamanashi / Shizuoka (the Fuji side): those cells stay empty here (mkfar.py falls back to rules).
import sys, os, time, subprocess, numpy as np
from PIL import Image, ImageDraw
import osmium
from osmium.filter import KeyFilter
SC = '/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/'
OUT = SC + 'lm33/fuji/out/'; PBF = SC + 'tyodata/kanto.osm.pbf'
LON0, LAT0, MX, MY = 139.75, 35.66, 90549.1, 110952.7
CX0, CY0, CR, CNX, CNY = -117600.0, -72800.0, 160.0, 980, 770
t0 = time.time()
def run(*a):
    print('$', ' '.join(a), flush=True); subprocess.run(a, check=True)
far = OUT + 'far.osm.pbf'; fb = OUT + 'far_bld.osm.pbf'; fl = OUT + 'far_lu.osm.pbf'
if not os.path.exists(fl) or (not os.path.exists(fb) and not os.path.exists(OUT + 'cover_osm.npz')):
    run('osmium', 'extract', '-b', '138.42,35.00,140.20,36.12', '-s', 'simple', PBF, '-o', far, '--overwrite')
    if not os.path.exists(OUT + 'cover_osm.npz'): run('osmium', 'tags-filter', far, 'w/building', '-o', fb, '--overwrite')
    run('osmium', 'tags-filter', far, 'w/landuse', 'w/natural=water,wood,scrub,grassland,heath,wetland,beach,sand,bare_rock,scree',
        'w/water', 'w/waterway=riverbank', 'w/leisure=golf_course,park,nature_reserve,pitch',
        'r/landuse', 'r/natural=water,wood,scrub,grassland,wetland', 'r/water', 'r/waterway=riverbank', 'r/leisure=golf_course,park', '-o', fl, '--overwrite')
    os.remove(far)
print('filtered %.0f s' % (time.time() - t0), os.path.getsize(fl) >> 20, 'MB lu', flush=True)
# ---- building vertices per cell (nodes only: no location index needed)
bld = np.zeros((CNY, CNX), np.int32); nn = 0
if os.path.exists(OUT + 'cover_osm.npz'): bld = np.load(OUT + 'cover_osm.npz')['bld']; fb_skip = True
else: fb_skip = False
for o in ([] if fb_skip else osmium.FileProcessor(fb, osmium.osm.NODE)):
    x = (o.location.lon - LON0)*MX; y = (o.location.lat - LAT0)*MY
    i = int((x - CX0)//CR); j = int((y - CY0)//CR)
    if 0 <= i < CNX and 0 <= j < CNY: bld[j, i] += 1
    nn += 1
print('building nodes', nn, '%.0f s' % (time.time() - t0), flush=True)
# ---- land-use polygons
SS = 4   # polygons drawn at 40 m, averaged to the 160 m cells (fractions)
layers = {k: Image.new('L', (CNX*SS, CNY*SS), 0) for k in ('water', 'forest', 'field', 'urban')}
draw = {k: ImageDraw.Draw(v) for k, v in layers.items()}
def cls(t):
    lu, na, le = t.get('landuse'), t.get('natural'), t.get('leisure')
    if na == 'water' or 'water' in t or t.get('waterway') == 'riverbank' or lu in ('reservoir', 'basin'): return 'water'
    if lu == 'forest' or na in ('wood', 'scrub', 'heath'): return 'forest'
    if lu in ('farmland', 'meadow', 'orchard', 'vineyard', 'grass', 'farmyard', 'allotments', 'plant_nursery', 'recreation_ground', 'village_green', 'greenfield', 'cemetery') or na in ('grassland', 'wetland') or le in ('golf_course', 'park', 'nature_reserve', 'pitch'): return 'field'
    if lu in ('residential', 'commercial', 'industrial', 'retail', 'railway', 'construction', 'brownfield', 'garages', 'military', 'education', 'institutional', 'port'): return 'urban'
    return None
order = []   # (area, layer, outer rings, inner rings): big areas first so small ones (lakes in forests) paint over them
def px(r): return [((n.lon - LON0)*MX - CX0)/CR*SS for n in r], [((n.lat - LAT0)*MY - CY0)/CR*SS for n in r]
na = 0
for o in osmium.FileProcessor(fl).with_locations().with_areas(KeyFilter('landuse', 'natural', 'water', 'waterway', 'leisure')).with_filter(osmium.filter.EntityFilter(osmium.osm.AREA)):
    t = {k.k: k.v for k in o.tags}; c = cls(t)
    if not c: continue
    try:
        outs = []; inns = []
        for r in o.outer_rings():
            xs, ys = px(r); outs.append(list(zip(xs, ys)))
            for q in o.inner_rings(r): xs2, ys2 = px(q); inns.append(list(zip(xs2, ys2)))
    except osmium.InvalidLocationError: continue
    ar = 0
    for p in outs:
        xs = np.array([q[0] for q in p]); ys = np.array([q[1] for q in p]); ar += abs(np.dot(xs, np.roll(ys, 1)) - np.dot(ys, np.roll(xs, 1)))/2
    order.append((ar, c, outs, inns)); na += 1
print('areas', na, '%.0f s' % (time.time() - t0), flush=True)
order.sort(key=lambda a: -a[0])
PRI = {'urban': 0, 'field': 1, 'forest': 2, 'water': 3}
for ar, c, outs, inns in order:
    for p in outs:
        if len(p) >= 3: draw[c].polygon(p, fill=255)
    for p in inns:
        if len(p) >= 3: draw[c].polygon(p, fill=0)
M = {k: np.asarray(v).reshape(CNY, SS, CNX, SS).astype(np.float32).mean(axis=(1, 3)).round().astype(np.uint8) for k, v in layers.items()}
np.savez_compressed(OUT + 'cover_osm.npz', bld=bld, **M)
for k, v in M.items(): print(k, '%.1f %%' % (100*(v > 0).mean()))
Image.fromarray(np.clip(np.sqrt(bld)*12, 0, 255).astype(np.uint8)[::-1]).save(OUT + 'prev_bld.png')
[os.remove(f) for f in (fb, fl) if os.path.exists(f)]
print('done %.0f s' % (time.time() - t0))
