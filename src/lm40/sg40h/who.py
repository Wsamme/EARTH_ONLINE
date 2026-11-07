# python3 who.py refkey ox oz "e,n;e,n;..."  -> osm ids of the buildings whose centroid is nearest each plan point (model origin at ref (ox,oz))
import sys, json, math
T = json.load(open('../ref_sg40h.json'))['targets'][sys.argv[1]]; ox, oz = float(sys.argv[2]), float(sys.argv[3])
for q in sys.argv[4].split(';'):
    e, n = map(float, q.split(',')); x, z = ox + e, oz - n
    b = min(T['buildings'], key=lambda b: math.hypot(b['centroid'][0] - x, b['centroid'][1] - z))
    print(q, b['osm'], b['name'], b['h'], b['area'], round(math.hypot(b['centroid'][0] - x, b['centroid'][1] - z), 1))
