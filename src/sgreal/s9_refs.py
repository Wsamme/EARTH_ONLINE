# reference data for modelling Singapore landmarks: real footprints / parts / roads / POIs around each target (local metres, +x east, +z south)
import sys; sys.path.insert(0, '.')
from common import *
from shapely.geometry import box, Point
B = pickle.load(open(SGD + 'base15.pkl', 'rb')); Bl = load('buildings.pkl'); R = load('roads.pkl')
TYPES = {0:'generic', 1:'HDB', 2:'condo', 3:'house', 4:'commercial', 5:'office', 6:'industrial', 7:'civic', 8:'religious', 9:'hospital', 10:'transport', 11:'car park', 12:'hotel', 13:'shed', 14:'foreign', 15:'tank'}
TARGETS = {
 'A':[('raffleshotel', 'Raffles Hotel', 1.29480, 103.85450, 170), ('natgallery', 'National Gallery Singapore (former Supreme Court + City Hall)', 1.29030, 103.85150, 170), ('supremecourt', 'Supreme Court of Singapore (2005, Foster + Partners)', 1.29041, 103.85070, 120),
      ('victoria', 'Victoria Theatre and Concert Hall', 1.28835, 103.85158, 110), ('standrews', "St Andrew's Cathedral", 1.29234, 103.85225, 120), ('chijmes', 'CHIJMES', 1.29518, 103.85187, 110)],
 'B':[('natmuseum', 'National Museum of Singapore', 1.29656, 103.84842, 130), ('hillstreet', 'Old Hill Street Police Station (MCI)', 1.29071, 103.84817, 100), ('acm', 'Asian Civilisations Museum (Empress Place Building)', 1.28750, 103.85140, 130),
      ('duo', 'DUO (Ole Scheeren)', 1.29940, 103.85800, 150), ('parkview', 'Parkview Square', 1.30021, 103.85756, 90), ('natlibrary', 'National Library Building', 1.29761, 103.85425, 110)],
 'C':[('gateway', 'The Gateway (Beach Road, I. M. Pei)', 1.30040, 103.86320, 130), ('goldenmile', 'Golden Mile Complex', 1.30277, 103.86515, 130), ('southbeach', 'South Beach', 1.29500, 103.85620, 150),
      ('suntec', 'Suntec City (five towers, convention centre, Fountain of Wealth)', 1.29530, 103.85920, 260), ('indoorstadium', 'Singapore Indoor Stadium', 1.30082, 103.87429, 150), ('sportshub', 'National Stadium, Singapore Sports Hub', 1.30444, 103.87434, 230)],
 'D':[('sultanmosque', 'Masjid Sultan (Sultan Mosque)', 1.30222, 103.85900, 90), ('mariamman', 'Sri Mariamman Temple', 1.28268, 103.84521, 70), ('buddhatooth', 'Buddha Tooth Relic Temple and Museum', 1.28149, 103.84423, 90),
      ('thianhockkeng', 'Thian Hock Keng Temple', 1.28105, 103.84753, 80), ('peoplespark', "People's Park Complex", 1.28412, 103.84255, 120)],
 'F1':[('mbs', 'Marina Bay Sands', 1.283979, 103.859765, 260), ('artscience', 'ArtScience Museum', 1.28620, 103.85920, 90), ('helix', 'Helix Bridge', 1.28765, 103.86100, 170), ('float', 'The Float@Marina Bay (now NS Square)', 1.28890, 103.85930, 130),
       ('esplanade', 'Esplanade – Theatres on the Bay', 1.289478, 103.856014, 200), ('flyer', 'Singapore Flyer', 1.28940, 103.86323, 150), ('merlion', 'Merlion Park', 1.28681, 103.85432, 80), ('fullerton', 'The Fullerton Hotel', 1.28611, 103.85306, 130), ('barrage', 'Marina Barrage', 1.280943, 103.871976, 280)],
 'F2':[('mbfc', 'Marina Bay Financial Centre', 1.27970, 103.85470, 190), ('marinaone', 'Marina One', 1.27660, 103.85320, 160), ('guoco', 'Guoco Tower (Tanjong Pagar Centre)', 1.27690, 103.84600, 110), ('oneraffles', 'One Raffles Place', 1.28430, 103.85100, 110),
       ('uob', 'UOB Plaza', 1.28555, 103.84972, 110), ('republic', 'Republic Plaza', 1.28290, 103.85080, 90), ('lauPaSat', 'Lau Pa Sat (Telok Ayer Market)', 1.28063, 103.85040, 80), ('capitaspring', 'CapitaSpring', 1.28417, 103.85028, 90),
       ('parkroyal', 'PARKROYAL COLLECTION Pickering', 1.28566, 103.84626, 100), ('pinnacle', 'Pinnacle@Duxton', 1.27667, 103.84139, 180), ('interlace', 'The Interlace', 1.28259, 103.80324, 230)],
 'E':[('ionorchard', 'ION Orchard', 1.30398, 103.83201, 160), ('ngeeann', 'Ngee Ann City (Takashimaya)', 1.30259, 103.83476, 150), ('istana', 'The Istana (main building)', 1.30710, 103.84330, 160),
      ('reflections', 'Reflections at Keppel Bay (Daniel Libeskind)', 1.26520, 103.81570, 220), ('hendersonwaves', 'Henderson Waves bridge', 1.27560, 103.81550, 220)],
}
TARGETS.update({
 'W1':[('capitol', 'Capitol Singapore (Capitol Building + Capitol Theatre + Stamford House, with the Capitol Kempinski)', 1.29330, 103.85130, 130),
       ('rafflescity', 'Raffles City (Swissotel The Stamford tower 226 m, Raffles City Tower, Fairmont twin towers, podium) by I. M. Pei', 1.29391, 103.85334, 200),
       ('artshouse', 'The Arts House at the Old Parliament (Old Parliament House)', 1.28865, 103.85109, 80),
       ('parliament', 'Parliament House of Singapore (1999)', 1.28935, 103.85030, 120),
       ('cavenagh', 'Cavenagh Bridge (1869 suspension bridge over the Singapore River)', 1.28686, 103.85222, 80),
       ('anderson', 'Anderson Bridge (1910 steel arch bridge, Fullerton Road)', 1.28790, 103.85315, 90)],
 'W2':[('asiasquare', 'Asia Square Tower 1 and Tower 2', 1.27859, 103.85103, 160),
       ('ocbc', 'OCBC Centre (I. M. Pei, 1976, the "calculator" building, 198 m) with OCBC Centre East/South', 1.28501, 103.84920, 110),
       ('thesail', 'The Sail @ Marina Bay (two residential towers, 245 m and 215 m)', 1.28035, 103.85245, 110),
       ('cliffordpier', 'Clifford Pier (1933, now restaurant) and the Former Customs House on Collyer Quay', 1.28330, 103.85350, 110),
       ('ktmstation', 'Former Tanjong Pagar Railway Station (1932)', 1.27295, 103.83845, 120),
       ('firestation', 'Central Fire Station (1909, red-and-white "blood and bandages" striped, Hill Street) with the Civil Defence Heritage Gallery', 1.29214, 103.84901, 70)],
 'W3':[('goodshepherd', 'Cathedral of the Good Shepherd', 1.29605, 103.85122, 80),
       ('armenian', 'Armenian Church of Saint Gregory the Illuminator', 1.29310, 103.84940, 70),
       ('peranakan', 'Peranakan Museum (former Tao Nan School, 1912)', 1.29428, 103.84908, 70),
       ('sam', "Singapore Art Museum building (former Saint Joseph's Institution, 1867/1903, Bras Basah Road)", 1.29717, 103.85106, 100),
       ('mhfatimah', 'Masjid Hajjah Fatimah (1846, leaning minaret)', 1.30283, 103.86295, 70),
       ('malayheritage', 'Malay Heritage Centre (Istana Kampong Gelam, 1840)', 1.30324, 103.85985, 90)],
 'W4':[('tangplaza', 'Tang Plaza / TANGS department store with the Singapore Marriott Tang Plaza Hotel (pagoda roof crown)', 1.30503, 103.83302, 110),
       ('goodwood', 'Goodwood Park Hotel (1900, Teutonia Club tower block)', 1.30869, 103.83456, 130),
       ('istana', 'The Istana (main building, 1869)', 1.30710, 103.84292, 160),
       ('srinivasa', 'Sri Srinivasa Perumal Temple (Serangoon Road, 20 m gopuram)', 1.31355, 103.85643, 70),
       ('kmspks', 'Kong Meng San Phor Kark See Monastery (Bright Hill: Hall of Great Compassion, pagoda, Hall of No Form)', 1.36234, 103.83670, 250),
       ('shuanglin', 'Lian Shan Shuang Lin Monastery (Toa Payoh, 1898-1909, seven-storey Dragon Light Pagoda)', 1.33023, 103.85744, 160)],
 'W5':[('hendersonwaves', 'Henderson Waves pedestrian bridge (36 m above Henderson Road, 274 m long)', 1.27605, 103.81541, 200),
       ('reflections', 'Reflections at Keppel Bay (Daniel Libeskind, six curved glass towers up to 41 storeys + villas)', 1.26520, 103.81570, 240),
       ('vivocity', 'VivoCity (Toyo Ito, wavy roof, HarbourFront)', 1.26437, 103.82295, 260),
       ('chinesegarden', 'Chinese Garden at Jurong Lake Gardens (seven-storey Ru Yun pagoda, twin pagodas, White Rainbow Bridge, Bai Hong Qiao)', 1.33870, 103.73050, 260),
       ('kranji', 'Kranji War Memorial (Commonwealth War Graves, 1957: twelve columns, wing-shaped roof, Stone of Remembrance)', 1.41906, 103.75804, 180),
       ('tampineshub', 'Our Tampines Hub (community and sports hub, 2017)', 1.35315, 103.94051, 230)],
})
exec(open(ROOT + 'lm26/targets_sg.py').read())
parts_by = {}
for p in Bl['parts']: parts_by.setdefault(p['bid'], []).append(p)
for grp, lst in TARGETS.items():
    if len(sys.argv) > 1 and grp not in sys.argv[1:]: continue
    out = {'note':'Local metres around each anchor: +x east, +z south (three.js local axes before rotation). Real OSM/Overture data; heights are OSM values where floors/height are mapped, otherwise ESTIMATED (flag est). parts = OSM building:part pieces (base/top heights) where mapped.', 'targets':{}}
    for key, name, lat, lon, rad in lst:
        ax, ay = w(lon, lat); bx = box(ax - rad, ay - rad, ax + rad, ay + rad)
        loc = lambda x, y: [round(x - ax, 1), round(-(y - ay), 1)]
        T = {'name':name, 'anchor':{'lat':lat, 'lon':lon}, 'radius':rad, 'buildings':[], 'roads':[], 'pois':[]}
        for b in Bl['b']:
            g = b['g']
            if not g.intersects(bx): continue
            c = g.centroid
            e = {'name':b['name'], 'h':b['h'], 'floors':b['fl'], 'est':b['fl'] is None and not b['hdb'], 'type':TYPES[b['t']], 'area':round(g.area), 'centroid':loc(c.x, c.y), 'ring':[loc(x, y) for x, y in list(g.exterior.coords)[:-1]]}
            if b['id'] in Bl['have_parts']: e['parts'] = [{'base':p['base'], 'top':p['h'], 'ring':[loc(x, y) for x, y in list(p['g'].exterior.coords)[:-1]]} for p in parts_by.get(b['id'], [])]
            T['buildings'].append(e)
        for l in R['lines']:
            if l['c'] > 12 or not l['g'].intersects(bx): continue
            gg = l['g'].intersection(bx)
            for ln in (gg.geoms if hasattr(gg, 'geoms') else [gg]):
                if ln.geom_type == 'LineString' and ln.length > 8: T['roads'].append({'cls':l['c'], 'name':l['name'], 'pts':[loc(x, y) for x, y in ln.coords]})
        for p, g in B['pois']:
            q = proj(g) if g.geom_type == 'Point' else proj(g.representative_point())
            if bx.contains(q) and p.get('name') and p.get('kind') not in ('bench', 'waste_basket', 'atm', 'vending_machine', 'bicycle_parking', 'parking_entrance', 'bus_stop', 'toilets'): T['pois'].append({'name':p['name'], 'kind':p.get('kind'), 'at':loc(q.x, q.y)})
        T['pois'] = T['pois'][:60]
        out['targets'][key] = T
        print(grp, key, len(T['buildings']), len(T['roads']), len(T['pois']))
    json.dump(out, open(ROOT + ('lm26/ref_%s.json' if grp.startswith('sg') else 'lm20/ref_%s.json' if grp.startswith('W') else 'lm18/ref_%s.json') % grp, 'w'), ensure_ascii=False)
