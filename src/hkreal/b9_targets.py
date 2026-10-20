# stage 9a (Hong Kong): the landmark / site target list -> SC/hk/targets.json (used by b9_refs.py for the reference files).
# Each target names its OSM object ('b:w123' building, 'a:r123' area / multipolygon, 'R:123' route relation, 'W:123' way) or,
# for point features, 'n:lat,lon'. The script resolves it against this build's OSM extract: the footprint centroid (lat/lon),
# its area, the tallest building inside an area (id, height, centroid) and the OSM height / levels; it stops on an unresolved id.
# h = known overall height (m, top of structure / roof as noted) where certain, else null (see h_osm and the buildings in the refs).
import sys, json, collections; sys.path.insert(0, '.')
from common import *
import shapely.wkb
from shapely.geometry import Point, LineString
from shapely.strtree import STRtree
G = collections.OrderedDict()
def T(group, key, zh, en, kind, src, h, notes, r=None):
    G.setdefault(group, []).append(dict(key=key, zh=zh, en=en, kind=kind, src=src, h=h, notes=notes, r=r))
# ---- Central: towers, piers, the station
g = 'central'
T(g, 'hkifc2', '国际金融中心二期', 'Two International Finance Centre', 'tower', 'b:w25589595', 412, 'Tapering curtain-wall tower (Cesar Pelli, 2003) with setbacks and a crown of vertical fins; the tallest on Hong Kong Island; on the harbour reclamation above Hong Kong Station')
T(g, 'hkifc1', '国际金融中心一期', 'One International Finance Centre', 'tower', 'b:w148554945', 210, 'The lower sister of Two IFC, same tapering language; joined by the IFC Mall podium')
T(g, 'hkifcmall', '国际金融中心商场', 'IFC Mall', 'building', 'b:r13849938', None, 'Podium with a glass roof garden between the IFC towers and the Four Seasons; the Airport Express in-town check-in hall below')
T(g, 'hkstation', '香港站', 'Hong Kong Station', 'station', 'b:r16793912', None, 'MTR Airport Express / Tung Chung Line terminus under the IFC podium: above ground only the entrances and the podium (model with hkifcmall)')
T(g, 'hkexchange', '交易广场', 'Exchange Square', 'tower', 'a:w26434739', 188, 'Three granite-and-silver-glass towers (One and Two 188 m, Three 144 m) on a podium with a plaza; the bus terminus underneath')
T(g, 'hkjardine', '怡和大厦', 'Jardine House', 'tower', 'b:w42293714', 178.5, '1972 tower with about 1 750 round porthole windows on a white aluminium facade')
T(g, 'hkcentralpiers', '中环码头', 'Central Piers', 'pier', 'a:r14944632', None, 'Row of ferry piers 2-10 with pavilion roofs (colonial-revival style, 2006) along the Central harbourfront')
T(g, 'hkstarferryc', '中环天星码头', 'Central Star Ferry Pier', 'pier', 'b:w1483823682', None, 'Pier 7: Edwardian-revival two-storey pier with a clock tower (2006) for the Star Ferry to Tsim Sha Tsui')
T(g, 'hkwheel', '香港摩天轮', 'Hong Kong Observation Wheel', 'attraction', 'a:w323202866', 60, 'About 60 m Ferris wheel with enclosed gondolas on the Central harbourfront, LED-lit at night')
T(g, 'hkcentralfront', '中环海滨长廊', 'Central Harbourfront', 'park', 'a:w734745074', None, 'The waterfront promenade and lawns between the piers and the wheel (site: paving, lawns, trees, lamps)')
# ---- Admiralty / Central east: the banks, Legco, Tamar
g = 'admiralty'
T(g, 'hkboc', '中银大厦', 'Bank of China Tower', 'tower', 'b:w25604760', 367.4, 'I. M. Pei 1990: four triangular glass shafts rising to different heights, exposed X-bracing in white, two masts; granite podium and water gardens; the height includes the masts')
T(g, 'hkhsbc', '汇丰总行大厦', 'HSBC Main Building', 'tower', 'b:w295407347', 178.8, 'Norman Foster 1985: exposed steel suspension trusses (coat-hanger frames) in grey, three stepped slabs, the open ground-floor plaza and the two bronze lions')
T(g, 'hkcheungkong', '长江集团中心', 'Cheung Kong Center', 'tower', 'a:w295407286', 283, 'Square glass-and-steel tower (1999), a grid lit by changing coloured lights at night; gardens around it')
T(g, 'hklippo', '力宝中心', 'Lippo Centre', 'tower', 'a:w47174644', 186, 'Twin octagonal towers (Paul Rudolph, 1988) with projecting glass bay clusters, "koala trees"; Tower 2 186 m, Tower 1 172 m')
T(g, 'hkcfa', '终审法院', 'Court of Final Appeal (former Legislative Council Building)', 'heritage', 'b:w42293414', None, 'Neoclassical granite building (1912) with a central dome, Ionic colonnades and the statue of Justice on the pediment; Statue Square in front')
T(g, 'hkbocold', '中国银行大厦（旧）', 'Bank of China Building (1950)', 'heritage', 'a:w148784109', None, 'Art Deco granite tower (1950) with stepped massing, next to the HSBC building')
T(g, 'hkcityhall', '香港大会堂', 'Hong Kong City Hall', 'heritage', 'a:w101959040', None, 'Modernist civic complex (1962): low block, high block, memorial garden and shrine on Edinburgh Place')
T(g, 'hklegco', '立法会综合大楼', 'Legislative Council Complex', 'building', 'b:w925188472', None, 'Glass-and-white-frame building at Tamar (2011) beside the open "door" of the government headquarters')
T(g, 'hkcgo', '政府总部', 'Central Government Offices (Tamar)', 'building', 'a:w918333902', None, 'Two office blocks joined high up, forming the giant open door facing the harbour (2011)')
T(g, 'hktamar', '添马公园', 'Tamar Park', 'park', 'a:w138602057', None, 'The lawn sloping from the "door" to the harbourfront promenade')
# ---- Mid-Levels and Sheung Wan heritage
g = 'midlevels'
T(g, 'hkthecenter', '中环中心', 'The Center', 'tower', 'b:w148228888', 346, 'Steel-framed tower (1998) with a stepped crown and a mast; horizontal neon bands changing colour at night')
T(g, 'hkstjohn', '圣约翰座堂', "St John's Cathedral", 'heritage', 'b:w107497695', None, 'Anglican cathedral (1849): Victorian Gothic, cream walls, square west tower with crenellations, lancet windows')
T(g, 'hkgovhouse', '香港礼宾府', 'Government House', 'heritage', 'b:w42258038', None, 'Colonial residence (1855) remodelled 1940s with a Japanese-style tower and tiled roofs, white walls, gardens')
T(g, 'hkflagstaff', '旧三军司令官邸（茶具文物馆）', 'Flagstaff House (Museum of Tea Ware)', 'heritage', 'b:w42255475', None, 'Greek-revival colonial house (1846) with verandahs, white, in Hong Kong Park')
T(g, 'hktaikwun', '大馆', 'Tai Kwun (former Central Police Station)', 'heritage', 'a:w591035975', None, 'Police station, magistracy and Victoria Prison compound (1864-1919): red-brick and granite blocks with verandahs round the parade ground, plus two new cast-aluminium blocks (Herzog & de Meuron, 2018)')
T(g, 'hkmanmo', '文武庙', 'Man Mo Temple', 'temple', 'a:w319658451', None, 'Hollywood Road temple (1847): grey-brick halls, green-tiled roofs with ceramic ridge figures, giant incense coils inside')
T(g, 'hkwesternmkt', '西港城', 'Western Market', 'heritage', 'b:w26599372', None, 'Edwardian market hall (1906): red and cream brick bands, corner towers, arched windows')
T(g, 'hkpmq', '元创方', 'PMQ (former Police Married Quarters)', 'heritage', 'a:w242554453', None, 'Two 1951 modernist slab blocks with galleries round a courtyard, on the site of the Central School')
T(g, 'hkjamia', '些利街清真寺', 'Jamia Mosque', 'temple', 'b:w228196397', None, 'Small mosque (1890, rebuilt 1915) on Shelley Street with a minaret and arched verandah, pale green and white')
T(g, 'hkzoo', '香港动植物公园', 'Hong Kong Zoological and Botanical Gardens', 'park', 'a:r12955557', None, 'Victorian gardens (1871) with the fountain terrace, aviaries and the bandstand pavilion (site)')
# ---- The Peak and the south side
g = 'peak'
T(g, 'hkpeaktower', '凌霄阁', 'Peak Tower', 'building', 'b:w143716612', None, 'Terry Farrell 1997: wok / crescent-shaped roof bowl on a stone base; the Sky Terrace 428 m above the sea; the Peak Tram upper terminus inside')
T(g, 'hkpeakgalleria', '山顶广场', 'The Peak Galleria', 'building', 'b:w156335591', None, 'Terraced mall next to the Peak Tower with a roof viewing deck')
T(g, 'hkpeaktram', '山顶缆车', 'Peak Tram', 'line', 'R:3264047', None, 'Funicular (1888) from Garden Road to the Peak: one track with a passing loop, stops, steep cuttings and viaducts; the cars; the line itself is drawn by the app (rail layer, code PK)')
T(g, 'hkpeaktramlower', '山顶缆车花园道总站', 'Peak Tram Garden Road terminus', 'station', 'a:w636324517', None, 'Lower terminus next to St John\'s Building, Garden Road')
T(g, 'hkhku', '香港大学', 'The University of Hong Kong', 'site', 'a:r4246029', None, 'Campus on the hillside: the Main Building (1912, red brick and granite, clock tower, Ionic columns), Centennial Campus terraces (site)')
T(g, 'hkoceanpark', '海洋公园', 'Ocean Park (site)', 'site', 'a:r3676813', None, 'Marine theme park on two sides of a headland joined by a cable car; site only: buildings, paths, the cable car, the ocean tower — no characters, brand imagery or signage')
T(g, 'hkmurray', '美利楼', 'Murray House', 'heritage', 'b:w96843417', None, 'Victorian colonnaded building (1846, rebuilt 1998 at Stanley): granite columns on three storeys of verandahs, tiled roof')
# ---- Wan Chai, Causeway Bay, Quarry Bay
g = 'wanchai'
T(g, 'hkcentralplaza', '中环广场', 'Central Plaza', 'tower', 'b:w27087018', 374, 'Triangular tower (1992) in gold and silver glass with a pyramid top and mast; the neon "clock" bands at the crown change colour every 15 minutes')
T(g, 'hkcec', '香港会议展览中心', 'Hong Kong Convention and Exhibition Centre', 'building', 'a:w754002052', None, 'Extension (1997) on an island in the harbour with a curved, wing-like aluminium roof and glass curtain walls')
T(g, 'hkbauhinia', '金紫荆广场', 'Golden Bauhinia Square', 'monument', 'a:w998741825', None, 'Gilded bauhinia flower sculpture on a granite plinth by the harbour, flag poles')
T(g, 'hkhopewell', '合和中心', 'Hopewell Centre', 'tower', 'b:w88391069', 216, 'Cylindrical tower (1980) with a revolving restaurant crown and external glass lifts, on the Wan Chai hillside')
T(g, 'hkhappyvalley', '跑马地马场', 'Happy Valley Racecourse', 'stadium', 'a:r8049451', None, 'Racecourse in the valley bowl with the long grandstands on its west side and sports pitches in the infield (site)')
T(g, 'hkstadium', '香港大球场', 'Hong Kong Stadium', 'stadium', 'a:w230843881', None, 'Bowl stadium (1994, 40 000 seats) with white tubular roof arches over the two long stands')
T(g, 'hkvicpark', '维多利亚公园', 'Victoria Park', 'park', 'a:w4182605', None, 'Large park in Causeway Bay: lawns, the statue of Queen Victoria, the tennis centre, the swimming pool (site)')
T(g, 'hkoneislandeast', '港岛东中心', 'One Island East', 'tower', 'b:w100457821', 298.4, 'Tall square office tower (2008) at Taikoo Place with chamfered glass corners and a lit crown')
# ---- Tsim Sha Tsui
g = 'tst'
T(g, 'hkclocktower', '尖沙咀钟楼', 'Tsim Sha Tsui Clock Tower', 'heritage', 'b:w37664321', 44, 'Red brick and granite clock tower (1915) of the former Kowloon-Canton Railway terminus, with a small cupola and lightning rod')
T(g, 'hkculturalcentre', '香港文化中心', 'Hong Kong Cultural Centre', 'building', 'b:w37664345', None, 'Windowless pink-tiled concert hall and theatres (1989) with a great sloping curved roof facing the harbour')
T(g, 'hkspacemuseum', '香港太空馆', 'Hong Kong Space Museum', 'museum', 'a:w184731574', None, 'White egg-shaped planetarium dome (1980) with tiled shell, next to the Cultural Centre')
T(g, 'hkmuseumart', '香港艺术馆', 'Hong Kong Museum of Art', 'museum', 'b:w37664699', None, 'Museum on the promenade, rebuilt 2019 with a glazed top floor and a grid facade, pink tiles below')
T(g, 'hkavenuestars', '星光大道', 'Avenue of Stars', 'park', 'a:r14947605', None, 'Harbourfront promenade (rebuilt 2019) on a deck over the water with a wavy canopy and benches; the classic skyline viewpoint')
T(g, 'hkstarferrytst', '尖沙咀天星码头', 'Tsim Sha Tsui Star Ferry Pier', 'pier', 'b:r14941145', None, 'Star Ferry pier (1957) with its green-and-white piers and gangways')
T(g, 'hkoceanterminal', '海运大厦', 'Ocean Terminal', 'building', 'b:w112453139', None, 'Long cruise terminal pier with shops (1966), the Ocean Terminal Deck at its tip (2017) with a stepped lawn viewing deck')
T(g, 'hkpeninsula', '香港半岛酒店', 'The Peninsula Hong Kong', 'heritage', 'a:w709674355', None, '1928 hotel: H-shaped neoclassical block with a forecourt fountain, the 1994 tower with a rooftop heliport behind')
T(g, 'hk1881', '1881公馆（前水警总部）', '1881 Heritage (former Marine Police Headquarters)', 'heritage', 'a:w184553178', None, 'Victorian compound (1884) on a knoll: verandahed main building, the round time-ball tower, stables; a new granite plaza below')
T(g, 'hkcoliseum', '香港体育馆', 'Hong Kong Coliseum', 'building', 'b:r19130615', None, 'Inverted-pyramid indoor arena (1983) on four giant legs above the Hung Hom station podium')
# ---- West Kowloon
g = 'westkowloon'
T(g, 'hkicc', '环球贸易广场', 'International Commerce Centre', 'tower', 'b:w25590249', 484, 'The tallest in Hong Kong (2010): square tower with re-entrant corners, tapering slightly, sky100 observation deck, LED light show facade; above Kowloon Station')
T(g, 'hkmplus', 'M+博物馆', 'M+ (museum of visual culture)', 'museum', 'b:w549702815', None, 'Herzog & de Meuron 2021: a horizontal podium and a thin vertical slab whose harbour facade is an LED screen; green ceramic louvres')
T(g, 'hkxiqu', '戏曲中心', 'Xiqu Centre', 'building', 'b:w545997140', None, 'Chinese opera theatre (2019) like a lantern: wavy aluminium fins with a split entrance opening at the corner')
T(g, 'hkpalacemuseum', '香港故宫文化博物馆', 'Hong Kong Palace Museum', 'museum', 'a:w640750810', None, 'Museum (2022) with a stacked, flaring form inspired by bronze vessels, gold-anodised panels, a central atrium cut')
T(g, 'hkwkstation', '西九龙站', 'Hong Kong West Kowloon Station', 'station', 'b:w623740603', None, 'High-speed rail terminus (2018): a sweeping glass and steel roof that rises like a wave to a vaulted window over the harbour, a walkable green roof')
T(g, 'hkkowloonstation', '九龙站', 'Kowloon Station', 'station', 'b:w1415166825', None, 'Airport Express station under the Union Square towers (podium only; the ICC rises from it)')
# ---- Kowloon east and the New Territories
g = 'kowlooneast'
T(g, 'hkkaitakcruise', '启德邮轮码头', 'Kai Tak Cruise Terminal', 'building', 'b:w209720470', 30, 'Long terminal (2013) at the tip of the old runway with a pleated, wave-like roof and a park on top')
T(g, 'hkkaitakstadium', '启德主场馆', 'Kai Tak Stadium (Kai Tak Sports Park)', 'stadium', 'a:w609099609', None, 'The 50 000-seat main stadium (2025) with a retractable roof and a bowl of white fins, in the Kai Tak Sports Park (with the indoor arena and the public sports ground)')
T(g, 'hkwongtaisin', '黄大仙祠', 'Wong Tai Sin Temple', 'temple', 'a:w264462808', None, 'Large Taoist temple complex: red columns, golden-yellow tiled roofs, the main altar hall, the Nine Dragon Wall, gardens, the Lion Rock behind')
T(g, 'hkchilin', '志莲净苑', 'Chi Lin Nunnery', 'temple', 'a:w109743814', None, 'Tang-style Buddhist complex (1998) in timber without nails: halls with grey-tiled roofs round lotus ponds')
T(g, 'hknanlian', '南莲园池', 'Nan Lian Garden', 'park', 'a:w86041251', None, 'Tang-style garden opposite Chi Lin: the golden Pavilion of Absolute Perfection on a red bridge over a pond, rock gardens')
T(g, 'hklionrock', '狮子山', 'Lion Rock', 'peak', 'n:22.35301,114.18717', 495, 'Granite hill whose summit looks like a crouching lion facing west (495 m); terrain feature: the summit rocks only')
T(g, 'hkwalledcity', '九龙寨城公园', 'Kowloon Walled City Park', 'park', 'a:r1650915', None, 'Jiangnan-style park (1995) on the site of the demolished walled city: the old yamen, south gate remains, pavilions')
T(g, 'hkpolyu', '香港理工大学', 'The Hong Kong Polytechnic University', 'site', 'a:r1662329', None, 'Dense red-brick campus (1970s) of linked blocks and podium walkways; the Jockey Club Innovation Tower (Zaha Hadid, 2013) at its north-east corner')
T(g, 'hkust', '香港科技大学', 'HKUST', 'site', 'a:w40664120', None, 'Campus on the Clear Water Bay hillside terraces down to the sea: the Atrium, the red sundial sculpture, the waterfront (site)')
T(g, 'hkcuhk', '香港中文大学', 'The Chinese University of Hong Kong', 'site', 'a:r7802779', None, 'Large hill campus above Tolo Harbour: the University Mall and the Pond of Reflection, the Sir Run Run Shaw Hall, colleges on the slopes (site)')
# ---- Bridges and the west
g = 'bridges'
T(g, 'hktsingma', '青马大桥', 'Tsing Ma Bridge', 'bridge', 'a:w635348630', 206, 'Double-deck suspension bridge (1997), main span 1 377 m, concrete portal towers ~206 m, the streamlined stiffening truss (road on top, rail and typhoon lanes inside); the app draws the decks at 69.5 / 63 m')
T(g, 'hkkapshuimun', '汲水门大桥', 'Kap Shui Mun Bridge', 'bridge', 'a:w635348629', None, 'Double-deck cable-stayed bridge (1997), main span 430 m, two H-shaped concrete towers, fan stays; decks drawn at 54.5 / 48 m')
T(g, 'hktingkau', '汀九桥', 'Ting Kau Bridge', 'bridge', 'a:r16007342', 201.55, 'Cable-stayed bridge (1998) with three slender single-leg towers stabilised by transverse stays and the longitudinal stabilising cables; two decks side by side; spans 448 + 475 m')
T(g, 'hkstonecutters', '昂船洲大桥', 'Stonecutters Bridge', 'bridge', 'a:r4045407', 293.5, 'Cable-stayed bridge (2009), main span 1 018 m, twin aerodynamic decks, two single tapering towers (293.5 m) (concrete below, stainless-steel skin above); deck drawn at 77 m')
T(g, 'hkhzmblink', '港珠澳大桥香港连接路', 'HZMB Hong Kong Link Road', 'bridge', 'a:r14373678', None, 'Long sea viaduct from the boundary crossing island to the HKSAR boundary, with three higher navigation arches (41 m vessel height limit); deck drawn ~16 m (estimate)')
T(g, 'hkninatower', '如心广场', 'Nina Tower', 'tower', 'b:w112284860', 318, 'Tsuen Wan tower (2007): two stepped slabs joined, square plan with a skeletal glass crown')
# ---- Lantau: the airport, Ngong Ping, Disneyland
g = 'lantau'
T(g, 'hkt1', '香港国际机场一号客运大楼', 'HKIA Terminal 1', 'building', 'b:w772085062', None, 'Norman Foster 1998: Y-shaped terminal with a light vaulted steel roof in long barrels over the halls and piers')
T(g, 'hkt2', '香港国际机场二号客运大楼', 'HKIA Terminal 2', 'building', 'b:w1204348925', None, 'Terminal 2 (rebuilt for the three-runway system): curved roof over the departure hall')
T(g, 'hkmidfield', '一号客运大楼中场客运廊', 'HKIA T1 Midfield Concourse', 'building', 'b:w393009711', None, 'Y-shaped satellite concourse (2016) between the runways, linked by the automated people mover')
T(g, 'hkskypier', '海天客运码头', 'SkyPier', 'building', 'b:w181594810', None, 'Ferry terminal for the Pearl River Delta ports at the east of the airport island')
T(g, 'hkatc', '航空交通控制塔', 'HKIA Air Traffic Control Tower', 'tower', 'b:w393439479', None, 'The control tower with its glazed cab, west of Terminal 1')
T(g, 'hkasiaworld', '亚洲国际博览馆', 'AsiaWorld-Expo', 'building', 'b:w23398992', None, 'Exhibition halls (2005) with a rolling roof of linked vaults')
T(g, 'hkbuddha', '天坛大佛', 'Tian Tan Buddha', 'statue', 'a:w45659816', 34, 'Bronze seated Buddha (1993), 34 m, on a three-level altar platform modelled on the Temple of Heaven, 268 steps up from Ngong Ping')
T(g, 'hkpolin', '宝莲禅寺', 'Po Lin Monastery', 'temple', 'a:r7157639', None, 'Buddhist monastery: the Grand Hall of Ten Thousand Buddhas with yellow roofs, red columns, the Main Shrine Hall, the courtyard')
T(g, 'hknp360tc', '昂坪360东涌缆车站', 'Ngong Ping 360 Tung Chung Terminal', 'station', 'b:w26321659', None, 'Cable-car terminal in Tung Chung (2006); the ropeway itself is drawn by the app (base.ropes)')
T(g, 'hknp360angle', '昂坪360机场岛转向站', 'Ngong Ping 360 Airport Island Angle Station', 'station', 'b:w102141136', None, 'Angle station on the airport island where the line turns (with the Nei Lak Shan angle station, way 107670304)')
T(g, 'hknp360ng', '昂坪360昂坪缆车站', 'Ngong Ping 360 Ngong Ping Terminal', 'station', 'b:w103947139', None, 'Upper terminal at Ngong Ping village')
T(g, 'hkdisney', '香港迪士尼乐园（场地）', 'Hong Kong Disneyland (site)', 'site', 'a:w377094298', None, 'Theme park at Penny\'s Bay; site only: ground, paths, lakes, buildings as plain architecture — no characters, brand imagery, castle replica or signage')
# ---- Shenzhen skyline (context across the Shenzhen River and Bay)
g = 'shenzhen'
T(g, 'hkpingan', '平安金融中心', 'Ping An Finance Center', 'tower', 'b:w535860513', 599.1, 'Futian, 2017: tapering granite-and-glass tower with stainless-steel ribs at the corners and a spire top')
T(g, 'hkcrtower', '华润大厦', 'China Resources Tower', 'tower', 'b:w529272473', 392.5, 'Nanshan, 2018: "spring bamboo shoot" — 56 slender ribs converging to a pointed top')
T(g, 'hkkingkey', '京基100', 'KK100', 'tower', 'b:w781166572', 441.8, 'Luohu, 2011: tower with a curved, softly bulging profile and a curved glass crown')
T(g, 'hkszbaybridge', '深圳湾公路大桥', 'Shenzhen Bay Bridge', 'bridge', 'a:r15750001', None, 'Cable-stayed bridge (2007) across Deep Bay with inclined single-pylon spans; the Hong Kong part (relation 15750001) and the Shenzhen part')

# ---------------- resolve against the OSM extract ----------------
if __name__ == '__main__':
    import pickle
    BLD = pickle.load(open(OUT + 'raw_bld.pkl', 'rb')); AR = pickle.load(open(OUT + 'raw_areas.pkl', 'rb'))
    idx = {}
    for src, L in (('b', BLD), ('a', AR)):
        for oid, fw, t, wk in L: idx[(src, ('w' if fw else 'r') + str(oid))] = (t, wk)
    Bd = load('buildings.pkl')['b']; BT = STRtree([b['g'] for b in Bd]); byid = {b['id']: b for b in Bd}
    ROUTES = {r[0]: r for r in pickle.load(open(OUT + 'raw_routes.pkl', 'rb'))}
    WAYS = None
    out = {'note':'Hong Kong landmark and site targets for City Brush v37 (see hk/BRIEF.md). lat/lon = the centroid of the named OSM footprint '
           '(osm = its id: w way, r relation; for areas, tallest = the tallest building of this build inside it). h = known overall height where '
           'certain (m), h_osm = the OSM height / levels value of the footprint; r = suggested model radius (m). Names: zh Simplified, en English.', 'groups':{}}
    n = 0
    for grp, L in G.items():
        out['groups'][grp] = []
        for d in L:
            kind_, ref = d['src'].split(':', 1); e = {k: d[k] for k in ('key', 'zh', 'en', 'kind', 'h', 'notes')}
            if kind_ in ('b', 'a'):
                hit = idx.get((kind_, ref)) or idx.get(('a' if kind_ == 'b' else 'b', ref))
                assert hit, (d['key'], d['src'])
                t, wk = hit; g = proj(shapely.wkb.loads(wk)).buffer(0); c = g.centroid
                lon, lat = ll(c.x, c.y); e.update(lat=round(lat, 6), lon=round(lon, 6), osm=ref, area_m2=round(g.area))
                e['h_osm'] = t.get('height') or (('%s levels' % t['building:levels']) if t.get('building:levels') else None)
                bb = [byid.get(ref)] if byid.get(ref) else [Bd[int(k)] for k in BT.query(g) if Bd[int(k)]['g'].representative_point().within(g)]
                bb = [b for b in bb if b]
                if bb:
                    b = max(bb, key=lambda b: b['h']); bc = b['g'].centroid; blon, blat = ll(bc.x, bc.y)
                    if b['id'] != ref and d['kind'] in ('tower', 'station', 'building', 'heritage', 'pier'): e['tallest'] = {'osm':b['id'], 'h':b['h'], 'lat':round(blat, 6), 'lon':round(blon, 6), 'name':b['name']}
                    elif e['h_osm'] is None: e['h_app'] = b['h']
                ext = max(math.hypot(x - c.x, y - c.y) for x, y in g.exterior.coords) if g.geom_type == 'Polygon' else max(math.hypot(x - c.x, y - c.y) for p in g.geoms for x, y in p.exterior.coords)
                e['r'] = d['r'] or int(min(1600, max(30, ext*1.05 if d['kind'] == 'bridge' else min(ext*1.05, math.sqrt(g.area/math.pi)*1.8))))
            elif kind_ == 'R':
                rid = int(ref); rt = ROUTES[rid]
                if WAYS is None: WAYS = {wid: cs for wid, t, cs in pickle.load(open(OUT + 'raw_ways.pkl', 'rb'))}
                pts = [w(*q) for typ, wref, role in rt[2] if typ == 'w' and wref in WAYS for q in WAYS[wref]]
                ln = LineString(pts); c = ln.centroid; lon, lat = ll(c.x, c.y)
                e.update(lat=round(lat, 6), lon=round(lon, 6), osm='r' + ref, length_m=round(ln.length/2), r=d['r'] or int(max(math.hypot(x - c.x, y - c.y) for x, y in pts)*1.05))
            elif kind_ == 'n':
                lat, lon = map(float, ref.split(',')); e.update(lat=lat, lon=lon, osm=None, r=d['r'] or 300)
            if d['kind'] == 'tower' and e.get('tallest'):          # a tower given by its plot: the tower's own footprint is the anchor
                e['plot'] = {'lat':e['lat'], 'lon':e['lon'], 'osm':e['osm']}; e['lat'], e['lon'], e['osm'] = e['tallest']['lat'], e['tallest']['lon'], e['tallest']['osm']
                if not e.get('h_osm'): e['h_app'] = e['tallest']['h']
                del e['tallest']
            out['groups'][grp].append(e); n += 1
    os_ = __import__('os'); os_.makedirs(ROOT + 'hk', exist_ok=True)
    json.dump(out, open(ROOT + 'hk/targets.json', 'w'), ensure_ascii=False, indent=1)
    print('targets', n, {g: len(v) for g, v in out['groups'].items()})
    for g_, L in out['groups'].items():
        for e in L: print('%-12s %-16s %9.5f %10.5f r %4d h %s osm-h %s %s' % (g_, e['key'], e['lat'], e['lon'], e['r'], e['h'], e.get('h_osm'), ('tallest %s %.0f m' % (e['tallest']['osm'], e['tallest']['h'])) if e.get('tallest') else ''))
