import pickle, sys, json, shapely.wkb
R = pickle.load(open(sys.argv[1], 'rb'))
want = set(sys.argv[2].split(','))
out = {}
for kind, oid, t, wk in R:
    if oid in want:
        g = shapely.wkb.loads(wk)
        if g.geom_type == 'MultiPolygon': g = max(g.geoms, key=lambda p: p.area)
        c = g.centroid
        out[oid] = {'name': t.get('name'), 'c': [c.y, c.x], 'ring': [[round(y, 7), round(x, 7)] for x, y in g.exterior.coords]}
json.dump(out, open(sys.argv[3], 'w'))
for k, v in out.items(): print(k, v['name'], v['c'], len(v['ring']))
