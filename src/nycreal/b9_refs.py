# reference data for modelling New York landmarks: real footprints / parts / roads (with deck heights) / POIs around each target
# (local metres around the anchor, +x east, +z south) -> SC/nyc/ref_<group>.json
import sys, collections; sys.path.insert(0, '.')
from common import *
from shapely.geometry import box, Point
Bl = load('buildings.pkl'); R = load('roads.pkl'); NODES = pickle.load(open(OUT + 'raw_nodes.pkl', 'rb'))
T2 = load('terrain.pkl'); H = T2['H']
def ground(x, y):
    fx = (x + HALF)/TS; fy = (y + HALF)/TS; i = min(TN - 2, max(0, int(fx))); j = min(TN - 2, max(0, int(fy))); u = fx - i; v = fy - j
    return float(H[j, i]*(1 - u)*(1 - v) + H[j, i + 1]*u*(1 - v) + H[j + 1, i]*(1 - u)*v + H[j + 1, i + 1]*u*v)
TYPES = {0:'generic', 2:'apartment', 3:'house', 4:'commercial', 5:'office', 6:'industrial', 7:'civic', 8:'religious', 9:'hospital', 10:'transport', 11:'car park', 12:'hotel', 13:'shed', 15:'tank'}
TARGETS = {
 'midtown':[('empire', 'Empire State Building (1931, 381 m roof, 443 m tip, Art Deco setbacks, mooring mast, coloured crown lights)', 40.7484, -73.9857, 140),
        ('chrysler', 'Chrysler Building (1930, 319 m, stainless steel terraced crown with triangular windows, gargoyles)', 40.7516, -73.9755, 110),
        ('vanderbilt', 'One Vanderbilt (2020, 427 m, tapering terracotta-and-glass tower)', 40.7530, -73.9785, 110),
        ('grandcentral', 'Grand Central Terminal (1913, Beaux-Arts, the clock and sculpture group on 42nd Street, the Park Avenue Viaduct round it)', 40.7527, -73.9772, 200),
        ('metlife', 'MetLife Building (1963, 246 m, octagonal slab over Grand Central)', 40.7536, -73.9764, 110),
        ('nypl', 'New York Public Library main branch (1911, Beaux-Arts, marble) and Bryant Park', 40.7532, -73.9822, 200)],
 'midtown2':[('rockefeller', 'Rockefeller Center (30 Rockefeller Plaza 259 m, the plaza, the channel gardens, Radio City)', 40.7587, -73.9787, 260),
        ('stpatricks', "St. Patrick's Cathedral (1878, Gothic Revival, twin spires 101 m)", 40.7585, -73.9760, 110),
        ('park432', '432 Park Avenue (2015, 426 m, square grid of 10 m windows)', 40.7616, -73.9719, 80),
        ('cpt', 'Central Park Tower (2020, 472 m) and the 57th Street "Billionaires\' Row" towers', 40.7663, -73.9810, 220),
        ('steinway', 'Steinway Tower / 111 West 57th Street (2021, 435 m, terracotta and bronze, very slender)', 40.7647, -73.9776, 90),
        ('timessq', 'Times Square (the bow-tie, giant screens on the facades, One Times Square)', 40.7564, -73.9862, 220),
        ('un', 'United Nations Headquarters (Secretariat 1952, 155 m slab, General Assembly building)', 40.7489, -73.9680, 260)],
 'downtown':[('onewtc', 'One World Trade Center (2014, 417 m roof, 541 m with the spire, chamfered square plan)', 40.7130, -74.0132, 120),
        ('wtc', 'World Trade Center towers: 2 (planned), 3 WTC (329 m), 4 WTC (297 m), 7 WTC (228 m)', 40.7110, -74.0120, 320),
        ('memorial', 'National September 11 Memorial (the two square pools in the footprints of the Twin Towers) and the museum pavilion', 40.7115, -74.0134, 150),
        ('oculus', 'World Trade Center Transportation Hub "Oculus" (2016, white steel ribs)', 40.7114, -74.0110, 130),
        ('woolworth', 'Woolworth Building (1913, 241 m, Gothic, green copper crown)', 40.7124, -74.0083, 90),
        ('beekman', '8 Spruce Street (2011, 265 m, rippled steel facade)', 40.7110, -74.0056, 80),
        ('wallst', '40 Wall Street (1930, 283 m, green pyramid roof), 70 Pine Street (1932, 290 m), New York Stock Exchange (1903, temple front)', 40.7066, -74.0095, 260)],
 'eastriver':[('brooklynbridge', 'Brooklyn Bridge (1883, Gothic granite towers 84 m, main span 486 m, cables and diagonal stays, the promenade above the roadways)', 40.7061, -73.9969, 900),
        ('manhattanbridge', 'Manhattan Bridge (1909, steel towers 102 m, main span 448 m, double deck: roadways above, subway and roadway below; Beaux-Arts arch and colonnade on Canal St)', 40.7075, -73.9908, 1000),
        ('williamsburg', 'Williamsburg Bridge (1903, steel lattice towers 102 m, main span 488 m, subway in the middle)', 40.7134, -73.9723, 1000),
        ('queensboro', 'Ed Koch Queensboro Bridge (1909, cantilever truss, 1135 m over the East River and Roosevelt Island, double deck)', 40.7570, -73.9544, 1100),
        ('rfk', 'Robert F. Kennedy (Triborough) Bridge, the Hell Gate suspension span (1936, 421 m main span, towers 96 m)', 40.7800, -73.9260, 700),
        ('hellgate', 'Hell Gate Bridge (1917, steel through arch, 298 m, granite towers, railway)', 40.7824, -73.9216, 500)],
 'bigbridges':[('gwb', 'George Washington Bridge (1931, towers 184 m bare steel lattice, main span 1067 m, double deck, Palisades)', 40.8517, -73.9527, 1300),
        ('verrazzano', 'Verrazzano-Narrows Bridge (1964, towers 211 m, main span 1298 m, double deck)', 40.6066, -74.0447, 1500),
        ('bayonne', 'Bayonne Bridge (1931 steel arch 504 m; the road deck raised in 2019)', 40.6418, -74.1420, 900),
        ('goethals', 'Goethals Bridge (2017, twin cable-stayed spans 274 m, concrete towers)', 40.6355, -74.1977, 900),
        ('outerbridge', 'Outerbridge Crossing (1928, steel cantilever truss, 229 m main span)', 40.5246, -74.2470, 900),
        ('whitestone', 'Bronx-Whitestone Bridge (1939, suspension, main span 701 m, towers 115 m)', 40.8013, -73.8295, 1200),
        ('throgsneck', 'Throgs Neck Bridge (1961, suspension, main span 549 m, towers 105 m)', 40.8053, -73.7934, 1200)],
 'harbor':[('liberty', 'Statue of Liberty (1886, 93 m to the torch incl. the pedestal, copper green) on Liberty Island, Fort Wood star', 40.6892, -74.0445, 250),
        ('ellis', 'Ellis Island (the 1900 immigration station: red brick, limestone, four domed towers)', 40.6995, -74.0396, 350),
        ('governors', 'Governors Island (Fort Jay, Castle Williams, the hills)', 40.6895, -74.0168, 900),
        ('whitehall', 'Staten Island Ferry Whitehall Terminal (2005)', 40.7013, -74.0130, 150),
        ('stgeorge', 'St. George Ferry Terminal (Staten Island)', 40.6437, -74.0736, 200)],
 'west':[('hudsonyards', 'Hudson Yards (30 Hudson Yards 387 m with the triangular observation deck, 10 / 15 / 35 / 50 Hudson Yards, the Vessel, the Shed)', 40.7538, -74.0018, 400),
        ('highline', 'The High Line (elevated park on the old freight viaduct, 9 m above the street)', 40.7480, -74.0048, 700),
        ('littleisland', 'Little Island (2021, park on tulip-shaped concrete pots in the Hudson, Pier 55)', 40.7420, -74.0103, 150),
        ('flatiron', 'Flatiron Building (1902, 87 m, triangular, limestone and terracotta)', 40.7411, -73.9897, 80),
        ('centralpark', 'Central Park (bridges, Bethesda Terrace, Belvedere Castle, the Reservoir, the Mall)', 40.7829, -73.9654, 1400),
        ('met', 'The Metropolitan Museum of Art (Fifth Avenue Beaux-Arts facade, glass wings into the park)', 40.7794, -73.9632, 250),
        ('guggenheim', 'Solomon R. Guggenheim Museum (1959, Frank Lloyd Wright spiral)', 40.7830, -73.9590, 90),
        ('amnh', 'American Museum of Natural History (Romanesque and Beaux-Arts facades, the Rose Center glass cube with the sphere)', 40.7813, -73.9740, 250)],
 'outer':[('coney', 'Coney Island (the Wonder Wheel 1920, the Cyclone 1927, the Parachute Jump 1939, Luna Park, the boardwalk)', 40.5745, -73.9800, 500),
        ('yankee', 'Yankee Stadium (2009, limestone facade, the frieze)', 40.8296, -73.9262, 300),
        ('citifield', 'Mets ballpark (2009, brick arcades, rotunda)', 40.7571, -73.8458, 300),
        ('unisphere', 'Unisphere (1964 World\'s Fair steel globe, 43 m) and the New York State Pavilion towers, Flushing Meadows', 40.7465, -73.8452, 400),
        ('barclays', 'Barclays Center arena (2012, weathered steel lattice, the oculus canopy)', 40.6826, -73.9754, 220),
        ('rooseveltram', 'Roosevelt Island Tramway (aerial tram over the East River: towers, cables, two cabins)', 40.7593, -73.9590, 700),
        ('jerseycity', 'Jersey City waterfront (Exchange Place towers: 99 Hudson 270 m, Goldman Sachs Tower 238 m, Newport)', 40.7160, -74.0350, 700)],
 'air':[('jfk', 'John F. Kennedy International Airport (terminals 1, 4, 5, 7, 8, the new Terminal 6 and New Terminal One, the 1962 TWA Flight Center, the control tower)', 40.6413, -73.7781, 1800),
        ('lga', 'LaGuardia Airport (the new Terminal B 2020 with pedestrian bridges over the taxiway, Terminal C, the Marine Air Terminal 1940)', 40.7769, -73.8740, 1300),
        ('ewr', 'Newark Liberty International Airport (Terminal A 2022, Terminals B and C, AirTrain Newark monorail)', 40.6895, -74.1745, 1500)],
 'port':[('newarkport', 'Port Newark–Elizabeth Marine Terminal (container cranes, stacks)', 40.6830, -74.1480, 2000),
        ('redhook', 'Red Hook Container Terminal (Brooklyn)', 40.6830, -74.0100, 600),
        ('howlandhook', 'Howland Hook Marine Terminal (Staten Island)', 40.6400, -74.1850, 900)],
}
exec(open(ROOT + 'lm26/targets_nyc.py').read())
exec(open(ROOT + 'lm29/targets_nyc.py').read())
exec(open(ROOT + 'lm30/targets_nyc.py').read())
from shapely.strtree import STRtree
BT = STRtree([b['g'] for b in Bl['b']]); LT = STRtree([l['g'] for l in R['lines']])
parts_by = collections.defaultdict(list)
for p in Bl['parts']: parts_by[p['bid']].append(p)
os_ = __import__('os'); os_.makedirs(ROOT + 'nyc', exist_ok=True)
for grp, lst in TARGETS.items():
    if len(sys.argv) > 1 and grp not in sys.argv[1:]: continue
    out = {'note':'Local metres around each anchor: +x east, +z south (three.js local axes before rotation). Real OSM data; heights are OSM values where height/levels are mapped (almost all of New York City has measured heights from the city building import), otherwise estimated from the type and size. parts = OSM building:part pieces with base/top heights. roads: cls (see FORMATS), elev = deck height above the ground per vertex when the road is a bridge / flyover. ground = terrain height (m) at the anchor.', 'targets':{}}
    for key, name, lat, lon, rad in lst:
        ax, ay = w(lon, lat); bx = box(ax - rad, ay - rad, ax + rad, ay + rad)
        loc = lambda x, y: [round(x - ax, 1), round(-(y - ay), 1)]
        T = {'name':name, 'anchor':{'lat':lat, 'lon':lon}, 'radius':rad, 'ground':round(ground(ax, ay), 1), 'buildings':[], 'roads':[], 'pois':[]}
        for bi in sorted(int(k) for k in BT.query(bx, predicate='intersects')):
            b = Bl['b'][bi]; g = b['g']
            c = g.centroid
            e = {'name':b['name'], 'h':b['h'], 'floors':b['fl'], 'type':TYPES.get(b['t'], str(b['t'])), 'area':round(g.area), 'centroid':loc(c.x, c.y), 'ring':[loc(x, y) for x, y in list(g.exterior.coords)[:-1]]}
            if b['id'] in Bl['have_parts']: e['parts'] = [{'base':p['base'], 'top':p['h'], 'ring':[loc(x, y) for x, y in list(p['g'].exterior.coords)[:-1]]} for p in parts_by.get(b['id'], [])]
            T['buildings'].append(e)
        for i in sorted(int(k) for k in LT.query(bx, predicate='intersects')):
            l = R['lines'][i]
            if l['c'] > 17: continue
            el = R['elev'].get(i); cs = list(l['g'].coords)
            if l['g'].within(bx) or el is None:
                gg = l['g'].intersection(bx)
                for ln in (gg.geoms if hasattr(gg, 'geoms') else [gg]):
                    if ln.geom_type == 'LineString' and ln.length > 8:
                        e = {'cls':l['c'], 'name':l['name'], 'bridge':bool(l['br']), 'layer':l.get('layer', 0), 'pts':[loc(x, y) for x, y in ln.coords]}
                        if el is not None and len(el) == len(cs) and l['g'].within(bx): e['elev'] = [round(v, 1) for v in el]
                        T['roads'].append(e)
            else:
                # elevated line crossing the box: keep the vertices inside (with their deck heights)
                keep = [(c, h) for c, h in zip(cs, el) if bx.contains(Point(c))] if len(el) == len(cs) else []
                if len(keep) >= 2: T['roads'].append({'cls':l['c'], 'name':l['name'], 'bridge':bool(l['br']), 'layer':l.get('layer', 0), 'pts':[loc(*c) for c, h in keep], 'elev':[round(h, 1) for c, h in keep]})
        for t, (lon2, lat2) in NODES:
            x, y = w(lon2, lat2)
            if bx.contains(Point(x, y)) and t.get('name'):
                T['pois'].append({'name':t['name'], 'tags':{k:v for k, v in t.items() if k in ('tourism', 'amenity', 'historic', 'man_made', 'leisure', 'building', 'height', 'railway', 'natural', 'shop', 'aeroway')}, 'at':loc(x, y)})
        T['pois'] = T['pois'][:120]
        out['targets'][key] = T
        print(grp, key, len(T['buildings']), 'buildings', len(T['roads']), 'roads', len(T['pois']), 'pois', flush=True)
    json.dump(out, open(ROOT + 'nyc/ref_%s.json' % grp, 'w'), separators=(',', ':'))
print('done')
