# stage 0a (Tokyo): the buildings and building parts of the square, in compact arrays (OSM Japan maps almost every building:
# ~4 million footprints here, too many for one shapely object each). Reads out/tyo.osm.pbf (osmium extract -s simple of the Kantō
# file, lon 139.38-140.12, lat 35.35-35.97) and writes out/bld_raw.npz + out/bld_tags.pkl:
#   XY float32 (projected metres), ring offsets, building -> first ring, ring counts; per building: OSM id, from_way, building value code,
#   index of its kept tags (or -1)
import sys, time, collections, gc; sys.path.insert(0, '.')
from common import *
import osmium
from osmium.filter import KeyFilter
from array import array
PBF = OUT + 'tyo.osm.pbf'
X0, Y0, X1, Y1 = BBOX
BKEEP = {'building:part', 'height', 'min_height', 'building:levels', 'building:min_level', 'roof:levels', 'name', 'name:en', 'name:ja', 'name:zh', 'name:zh-Hans', 'roof:colour', 'building:colour', 'roof:shape',
         'roof:height', 'amenity', 'shop', 'tourism', 'location', 'layer', 'man_made', 'leisure', 'office', 'religion', 'aeroway', 'parking', 'railway', 'public_transport', 'wikidata', 'building:material',
         'roof:material', 'building:levels:underground', 'disused', 'abandoned'}
fp = osmium.FileProcessor(PBF).with_locations('flex_mem').with_areas(KeyFilter('building', 'building:part')).with_filter(KeyFilter('building', 'building:part'))
XY = array('f'); RS = array('I', [0]); BR = array('I', [0]); OID = array('q'); FW = array('b'); BV = array('H'); TI = array('i')
bvoc = {}; tags = []; t0 = time.time(); cnt = collections.Counter()
for o in fp:
    if not o.is_area(): continue
    t = o.tags
    bv = t.get('building'); bp = t.get('building:part')
    if bv in (None, 'no') and bp is None: continue
    nr = 0; inside = False
    try:
        for outer in o.outer_rings():
            for ring in [outer] + list(o.inner_rings(outer)):
                k = 0
                for n in ring:
                    lon, lat = n.lon, n.lat
                    if X0 <= lon <= X1 and Y0 <= lat <= Y1: inside = True
                    XY.append((lon - LON0)*MX); XY.append((lat - LAT0)*MY); k += 1
                RS.append(RS[-1] + k); nr += 1
    except osmium.InvalidLocationError:
        cnt['badloc'] += 1
        # roll back the rings of this object
        while len(RS) - 1 > BR[-1]: RS.pop()
        del XY[2*RS[-1]:]
        continue
    if not inside or nr == 0:
        while len(RS) - 1 > BR[-1]: RS.pop()
        del XY[2*RS[-1]:]
        cnt['outside'] += 1; continue
    BR.append(len(RS) - 1)
    OID.append(o.orig_id()); FW.append(1 if o.from_way() else 0)
    key = bv if bv is not None else ('part:' + bp)
    if key not in bvoc: bvoc[key] = len(bvoc)
    BV.append(bvoc[key])
    kt = {k: v for k, v in ((tg.k, tg.v) for tg in t) if k in BKEEP}
    if kt: TI.append(len(tags)); tags.append(kt)
    else: TI.append(-1)
    cnt['bld'] += 1
    if cnt['bld'] % 500000 == 0: print(dict(cnt), len(XY)//2, 'vertices', round(time.time() - t0), 's', flush=True)
print('done', dict(cnt), len(XY)//2, 'vertices', len(tags), 'tag dicts', round(time.time() - t0), 's', flush=True)
del fp; gc.collect()
np.savez(OUT + 'bld_raw.npz', XY=np.frombuffer(XY, np.float32).reshape(-1, 2), RS=np.frombuffer(RS, np.uint32), BR=np.frombuffer(BR, np.uint32),
         OID=np.frombuffer(OID, np.int64), FW=np.frombuffer(FW, np.int8), BV=np.frombuffer(BV, np.uint16), TI=np.frombuffer(TI, np.int32))
save({'bvoc':[k for k, v in sorted(bvoc.items(), key=lambda kv: kv[1])], 'tags':tags}, 'bld_tags.pkl')
print('saved', round(time.time() - t0), 's')
