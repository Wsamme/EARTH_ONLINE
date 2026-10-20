# reference data for modelling Bay Area landmarks: real footprints / parts / roads (with deck heights) / POIs around each target
# (local metres around the anchor, +x east, +z south) -> SC/bay/ref_<group>.json
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
 'ggb':[('ggb', 'Golden Gate Bridge (1937 suspension bridge, towers 227 m, main span 1280 m, International Orange)', 37.8199, -122.4783, 1700),
        ('fortpoint', 'Fort Point (1861 brick fort under the bridge\'s southern arch)', 37.8106, -122.4771, 150)],
 'baybridge':[('baywest', 'San Francisco–Oakland Bay Bridge, western span (1936: two suspension spans with a central anchorage, double deck)', 37.7983, -122.3778, 1600),
        ('bayeast', 'Bay Bridge eastern span (2013: self-anchored suspension span with a single 160 m tower, and the skyway)', 37.8160, -122.3330, 1800),
        ('ybi', 'Yerba Buena Island (tunnel, the transition structures)', 37.8095, -122.3640, 600)],
 'sfdt':[('transamerica', 'Transamerica Pyramid (1972, 260 m)', 37.7952, -122.4028, 130), ('salesforce', 'Salesforce Tower (2018, 326 m)', 37.7897, -122.3972, 140),
        ('transitcenter', 'Salesforce Transit Center (2018, rooftop park, perforated white skin)', 37.7895, -122.3965, 380), ('fremont181', '181 Fremont (2018, 245 m, diagonal bracing)', 37.7898, -122.3951, 90),
        ('millennium', 'Millennium Tower (2009, 197 m)', 37.7905, -122.3962, 90), ('bofa555', '555 California Street (Bank of America Center, 1969, 237 m, red granite)', 37.7920, -122.4036, 120),
        ('embarcadero', 'Embarcadero Center (four towers, John Portman, outline lights)', 37.7947, -122.3986, 260), ('ferrybuilding', 'Ferry Building (1898, clock tower 75 m)', 37.7955, -122.3937, 160),
        ('rincon', 'One Rincon Hill (2008, 188 m)', 37.7856, -122.3925, 100)],
 'sfciv':[('cityhall', 'San Francisco City Hall (1915, Beaux-Arts dome 94 m)', 37.7793, -122.4193, 170), ('coit', 'Coit Tower (1933, 64 m, Telegraph Hill)', 37.8024, -122.4058, 110),
        ('palacefa', 'Palace of Fine Arts (1915 rotunda and colonnades, lagoon)', 37.8029, -122.4484, 220), ('paintedladies', 'Painted Ladies (Victorian row houses, Steiner Street at Alamo Square)', 37.7762, -122.4327, 110),
        ('grace', 'Grace Cathedral (Nob Hill)', 37.7919, -122.4134, 110), ('sutro', 'Sutro Tower (1973 TV mast, 298 m, three-legged)', 37.7552, -122.4528, 140),
        ('legion', 'California Palace of the Legion of Honor', 37.7845, -122.5008, 160)],
 'sfwater':[('oraclepark', 'Oracle Park (ballpark, 2000)', 37.7786, -122.3893, 240), ('chase', 'Chase Center (arena, 2019)', 37.7680, -122.3877, 200),
        ('alcatraz', 'Alcatraz Island (cellhouse, lighthouse, ruins)', 37.8267, -122.4230, 380), ('pier39', 'Pier 39 and Fisherman\'s Wharf', 37.8087, -122.4098, 300),
        ('ghirardelli', 'Ghirardelli Square (clock tower, sign)', 37.8059, -122.4229, 110), ('deyoung', 'de Young Museum (2005, twisted tower, perforated copper)', 37.7714, -122.4686, 170),
        ('conservatory', 'Conservatory of Flowers (1879 glasshouse)', 37.7726, -122.4602, 110)],
 'east':[('tribune', 'Oakland Tribune Tower (1923)', 37.8022, -122.2711, 70), ('oaktemple', 'Oakland California Temple (LDS, 1964)', 37.8064, -122.1985, 160),
        ('lakemerritt', 'Lake Merritt (Necklace of Lights, Pergola, Boathouse)', 37.8040, -122.2590, 900), ('oakcityhall', 'Oakland City Hall (1914)', 37.8053, -122.2723, 110),
        ('paramount', 'Paramount Theatre and Fox Oakland Theatre (Art Deco, vertical signs)', 37.8097, -122.2683, 160), ('coliseum', 'Oakland Coliseum and Arena', 37.7516, -122.2005, 350)],
 'ucb':[('ucb', 'University of California, Berkeley (Sather Tower 94 m, Doe Library, South Hall, Wheeler, Memorial Stadium, the Campanile esplanade)', 37.8719, -122.2585, 900)],
 'stanford':[('stanford', 'Stanford University (Main Quad, Memorial Church, Hoover Tower 87 m, the Oval, Palm Drive, Green Library, Stanford Stadium)', 37.4275, -122.1697, 1100)],
 'apple':[('applepark', 'Apple Park (2017 ring building, 461 m diameter, Steve Jobs Theater)', 37.3349, -122.0090, 800)],
 'google':[('googleplex', 'Googleplex (Mountain View) and Google Bay View (2022, canopy roofs)', 37.4220, -122.0841, 900), ('bayview', 'Google Bay View campus', 37.4040, -122.0640, 500)],
 'sv':[('levis', 'Levi\'s Stadium (2014)', 37.4033, -121.9694, 300), ('hangarone', 'Hangar One, Moffett Field (1933 airship hangar)', 37.4174, -122.0548, 300),
        ('chm', 'Computer History Museum', 37.4143, -122.0774, 150), ('sapcenter', 'SAP Center (San Jose arena)', 37.3327, -121.9012, 200),
        ('winchester', 'Winchester Mystery House', 37.3184, -121.9511, 150), ('nvidia', 'NVIDIA Endeavor and Voyager (triangular buildings)', 37.3708, -121.9640, 300),
        ('sjcityhall', 'San José City Hall (2005, rotunda)', 37.3378, -121.8853, 150)],
 'sfo':[('sfo', 'San Francisco International Airport terminals (International Terminal, Harvey Milk Terminal 1, Terminal 2, Terminal 3, control tower)', 37.6160, -122.3870, 1500)],
 'bridges':[('sanmateo', 'San Mateo–Hayward Bridge (high-rise steel girder section near the west end, long trestle)', 37.5870, -122.2440, 1500),
        ('dumbarton', 'Dumbarton Bridge (1982, concrete girder high section)', 37.5065, -122.1155, 1500),
        ('rsr', 'Richmond–San Rafael Bridge (1956, double-deck cantilever spans)', 37.9350, -122.4310, 1700)],
}
exec(open(ROOT + 'lm26/targets_bay.py').read())
exec(open(ROOT + 'lm29/targets_bay.py').read())
parts_by = collections.defaultdict(list)
for p in Bl['parts']: parts_by[p['bid']].append(p)
os_ = __import__('os'); os_.makedirs(ROOT + 'bay', exist_ok=True)
for grp, lst in TARGETS.items():
    if len(sys.argv) > 1 and grp not in sys.argv[1:]: continue
    out = {'note':'Local metres around each anchor: +x east, +z south (three.js local axes before rotation). Real OSM data; heights are OSM values where height/levels are mapped (most of San Francisco has real heights), otherwise estimated from the type and size (most suburban houses). parts = OSM building:part pieces with base/top heights. roads: cls (see FORMATS), elev = deck height above the ground per vertex when the road is a bridge / flyover. ground = terrain height (m) at the anchor.', 'targets':{}}
    for key, name, lat, lon, rad in lst:
        ax, ay = w(lon, lat); bx = box(ax - rad, ay - rad, ax + rad, ay + rad)
        loc = lambda x, y: [round(x - ax, 1), round(-(y - ay), 1)]
        T = {'name':name, 'anchor':{'lat':lat, 'lon':lon}, 'radius':rad, 'ground':round(ground(ax, ay), 1), 'buildings':[], 'roads':[], 'pois':[]}
        for b in Bl['b']:
            g = b['g']
            if not g.intersects(bx): continue
            c = g.centroid
            e = {'name':b['name'], 'h':b['h'], 'floors':b['fl'], 'type':TYPES.get(b['t'], str(b['t'])), 'area':round(g.area), 'centroid':loc(c.x, c.y), 'ring':[loc(x, y) for x, y in list(g.exterior.coords)[:-1]]}
            if b['id'] in Bl['have_parts']: e['parts'] = [{'base':p['base'], 'top':p['h'], 'ring':[loc(x, y) for x, y in list(p['g'].exterior.coords)[:-1]]} for p in parts_by.get(b['id'], [])]
            T['buildings'].append(e)
        for i, l in enumerate(R['lines']):
            if l['c'] > 17 or not l['g'].intersects(bx): continue
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
        T['pois'] = T['pois'][:80]
        out['targets'][key] = T
        print(grp, key, len(T['buildings']), 'buildings', len(T['roads']), 'roads', len(T['pois']), 'pois', flush=True)
    json.dump(out, open(ROOT + 'bay/ref_%s.json' % grp, 'w'), separators=(',', ':'))
print('done')
