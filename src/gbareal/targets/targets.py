# Greater Bay map (gbareal): the Shenzhen and Dongguan landmark / site targets -> SC/gba/targets.json (b9_targets.py of hkreal for
# the new frame; refs.py makes the reference files from it). Reads gbareal/out (buildings.pkl, land.pkl) and names.pkl here (find.py).
# Each target names its OSM object ('b:w123' building, 'a:r123' area / multipolygon) or, for point features, 'n:lat,lon'. Resolution:
# the footprint centroid (lat/lon), its area, the OSM height / levels, the tallest building of this build inside an area (towers given
# by their plot are re-anchored on that tower, the plot kept under 'plot'), the region (hk / sz / dg / other: land.pkl) and r.
# h = known overall height (m) where verified (sources in the notes / BRIEF), else null; h_osm = OSM's value, h_app = this build's.
# usage (from SC): bash lm33/kit/heavy.sh python3 gbareal/targets/find.py x   (once: builds names.pkl, ~60 MB; delete it after)
#                 bash lm33/kit/heavy.sh python3 gbareal/targets/targets.py
import sys, os, json, math, pickle, collections
HERE = os.path.dirname(os.path.abspath(__file__)) + '/'; sys.path.insert(0, HERE + '..')
from common import *
import shapely.wkb
from shapely.geometry import Point
from shapely.strtree import STRtree
G = collections.OrderedDict(); AREA = {}
def T(group, key, zh, en, kind, src, h, notes, r=None, hero=False, existing=None):
    G.setdefault(group, []).append(dict(key=key, zh=zh, en=en, kind=kind, src=src, h=h, notes=notes, r=r, hero=hero, existing=existing))
V37 = 'hk/shenzhen/shenzhen.js (v37 skyline-level model, ~4 kB per tower): UPGRADE to the Hong Kong standard under the same key'
V38 = 'hk/hkx_nt/hkx_nt.js (v38, Hong Kong standard): keep; check it in situ on this map (ground, decks) and only fix what is wrong'
# ================= Shenzhen =================
g = 'szcbd'; AREA[g] = 'Futian CBD towers (Shennan Road, Yitian Road, Fuhua Road; Upper Hills to the north)'
T(g, 'hkpingan', '平安金融中心', 'Ping An Finance Center', 'tower', 'b:w535860513', 599.1, 'Futian, 2017: the tallest in Shenzhen; tapering granite-and-glass tower, continuous stainless-steel ribs at the four chamfered corners rising to the crown and the spire top; the lit crown is the city\'s beacon at night', hero=True, existing=V37)
T(g, 'hkszse', '深圳证券交易所', 'Shenzhen Stock Exchange', 'tower', 'b:w923157986', 245.8, 'OMA 2013: square glass tower with the huge "raised podium" platform cantilevered about 36 m above the ground', existing=V38)
T(g, 'szenergy', '深圳能源大厦', 'Shenzhen Energy Mansion', 'tower', 'a:w776897369', 218, 'BIG 2017: two towers (north 218 m architectural, 219.1 m tip; south 110 m) whose facades are a pleated white skin folding open and closed in long vertical waves (the folds shade the glass); joined by a podium', hero=True)
T(g, 'szdabaihui', '大百汇广场', 'Dabaihui Plaza', 'tower', 'b:w612997286', 375.6, '2021, 70 floors: slender glass office tower on Shennan Road at the CBD, the second tallest in Futian')
T(g, 'szexcellence', '卓越世纪中心', 'Excellence Century Plaza', 'tower', 'a:w546581819', 280, '2010: four towers on one plot south of Ping An; Tower 1 280 m (60 floors), Tower 2 250 m; dark glass with vertical fins')
T(g, 'szpresstower', '深圳特区报业大厦', 'Shenzhen Special Zone Press Tower', 'tower', 'b:w925221216', 260, '1998, 48 floors: tower on Shennan Road at the CBD with a tall open crown frame over the roof')
T(g, 'szcmbtower', '招商银行大厦', 'China Merchants Bank Tower', 'tower', 'b:w545225932', 249, '2001, 53 floors: the bank\'s former headquarters on Shennan Road (no name or logo on the model)')
T(g, 'szneo', 'NEO绿景广场', 'NEO Tower A', 'tower', 'a:w1305353913', 273, '2011 (formerly Lvjing Plaza): tower A 273 m, 56 floors, with its lower twin towers on Shennan Road at Chegongmiao')
T(g, 'szupperhills', '深业上城', 'Shum Yip Upperhills', 'tower', 'a:w674566923', 388.1, 'North of Lianhuashan: Tower 1 388.1 m (2020), Tower 2 299.3 m (2017), over a terraced "town" podium of low blocks and roof gardens', hero=True)
T(g, 'szcec', '深圳会展中心', 'Shenzhen Convention and Exhibition Center', 'building', 'b:w146862823', None, 'At the south end of the CBD axis (2004): a long low hall under a vast flat roof on a grid of slender columns, glazed all round; the main hall and its big portico face the Civic Center', hero=True)
T(g, 'szgangxia', '岗厦北综合交通枢纽', 'Gangxia North Hub', 'station', 'b:r15525717', None, 'Metro interchange (2022) at Shennan / Caitian Road: underground, but famous for its giant glazed oculus ("Shenzhen Eye") at street level; model the oculus, its plaza and entrances (anchor = the station footprint: find the oculus in the refs)')
g = 'szcivic'; AREA[g] = 'Futian civic axis: Civic Center, Cultural Center, Lianhuashan, Central Park, the border ports'
T(g, 'szcivic', '市民中心', 'Shenzhen Civic Center', 'building', 'b:r10837975', 84.7, 'Lee/Timchula: the city hall under one 486 m long, 154 m wide curved "wing" roof (truss 1998, cladding 2004) over a central block and two side wings; part of the Shenzhen Museum inside; the axis of the CBD', hero=True)
T(g, 'szlibrary', '深圳图书馆', 'Shenzhen Library', 'building', 'b:w146867406', None, 'Arata Isozaki (Shenzhen Cultural Center, with the Concert Hall): long glass hall with a curved curtain wall over a stone base on Fuzhong Road', hero=True)
T(g, 'szconcerthall', '深圳音乐厅', 'Shenzhen Concert Hall', 'building', 'b:w146867409', None, 'Arata Isozaki, 2007: 1 800-seat vineyard hall in a glass box; the golden tree-like columns in the glazed foyer; joined to the Library', hero=True)
T(g, 'szmocape', '深圳市当代艺术与城市规划馆', 'Museum of Contemporary Art and Planning Exhibition (MOCAPE)', 'museum', 'b:w456331569', None, 'Coop Himmelb(l)au 2016: a big flat box wrapped in a perforated metal skin with a free-form glazed "cloud" cut into it and the plaza under it; north of the Civic Center', hero=True)
T(g, 'szchildpalace', '深圳市少年宫', "Shenzhen Children's Palace", 'building', 'b:w269895570', None, 'Children\'s cultural centre on the axis next to MOCAPE: glass volumes and a tower-like science hall')
T(g, 'szbookcity', '深圳书城中心城', 'Shenzhen Book City Central', 'building', 'b:w925221215', None, 'Long low bookstore mall on the central axis between the Civic Center and Lianhuashan, under a long roof with a glazed central street')
T(g, 'szlianhuashan', '莲花山公园', 'Lianhuashan Park', 'park', 'a:w41281446', None, 'Hill park at the north end of the axis: the bronze Deng Xiaoping statue (2000) on the summit plaza looking south over the CBD, the kite lawn, the lake (site)')
T(g, 'szcentralpark', '深圳中心公园', 'Shenzhen Central Park', 'park', 'a:r17354200', None, 'Long park along the Futian River between Futian and Luohu: lawns, the river, footbridges, trees (site)')
T(g, 'szfutianport', '福田口岸', 'Futian Port', 'building', 'b:w130965710', None, 'Boundary control point to Lok Ma Chau Spur Line (2007): long glass-and-steel hall over the Shenzhen River approach and the footbridge')
T(g, 'szhuanggang', '皇岗口岸联检大楼', 'Huanggang Port (new joint inspection building)', 'building', 'b:w1493617272', None, 'The new Huanggang control point building (rebuilt in the 2020s, co-location with Hong Kong); check its state in photos and the refs (anchor = the OSM footprint)')
T(g, 'szmangrove', '福田红树林生态公园', 'Futian Mangrove Ecological Park', 'park', 'a:w545246937', None, 'Mangroves and boardwalks on the Shenzhen Bay shore beside the Futian reserve, the Hong Kong skyline of Mai Po across the water (site)')
g = 'szluohu'; AREA[g] = 'Luohu and Huaqiangbei: Shennan East Road, the old centre, the railway station and Lo Wu'
T(g, 'hkkingkey', '京基100', 'KK100', 'tower', 'b:w781166572', 441.8, 'Luohu 2011, 100 floors: slender tower with a softly bulging, curved profile (wider in the middle), the curved glass crown; vertical fins', hero=True, existing=V37)
T(g, 'szdiwang', '地王大厦', 'Shun Hing Square (Diwang Tower)', 'tower', 'b:w64601041', 384, '1996, 69 floors: early all-steel supertall; very slim slab with rounded ends, green-blue glass, a stepped top with the two tall masts; next to KK100', hero=True)
T(g, 'szguomao', '国贸大厦', 'Guomao Building (International Foreign Trade Centre)', 'tower', 'b:w271080469', 160, '1985, 50 floors: the "Shenzhen speed" tower; cylindrical revolving restaurant on floors 48-49 and a helipad on top; tallest in China 1985-87', hero=True)
T(g, 'szseg', '赛格广场', 'SEG Plaza', 'tower', 'b:w64896107', 291.6, '2000, 71 floors: octagonal grey-glass tower over the Huaqiangbei electronics market podium (its rooftop masts since removed)')
T(g, 'szcitymark', '城脉中心', 'Citymark Centre', 'tower', 'b:w1271754601', 388.3, '2022, 70 floors: slim tower north of the railway in Luohu (Caiwuwei / Hubei)')
T(g, 'szbaoneng', '宝能中心', 'Baoneng Center', 'tower', 'b:w612995536', 327.3, '2019, 65 floors: tower in north Luohu')
T(g, 'szgrandtheatre', '深圳大剧院', 'Shenzhen Grand Theatre', 'building', 'b:w179274427', None, '1989 theatre on Shennan Road at the foot of Diwang: a glass-walled hall under a big flat roof slab (one of the city\'s first cultural buildings)')
T(g, 'szstation', '深圳站', 'Shenzhen Railway Station', 'station', 'b:w174194694', None, 'Main station of the old Guangzhou-Kowloon line beside Lo Wu: long concourse with a big roof, the square in front, the Luohu Commercial City next door')
T(g, 'szluohuport', '罗湖口岸', 'Luohu Port (Lo Wu Control Point)', 'building', 'b:w189787553', None, 'Joint inspection building over the Shenzhen River by the railway station, the footbridge to Lo Wu (Hong Kong)')
T(g, 'szdongmen', '东门商业步行街', 'Dongmen Pedestrian Street', 'site', 'a:w1238852261', None, 'The old market town of Shenzhen: pedestrian lanes, arcades, the old Siwei Tower area; paving, lamps, trees (site; no shop signs)')
T(g, 'szhuaqiangbei', '华强北', 'Huaqiangbei Road', 'site', 'n:22.5470,114.0853', None, 'The electronics market street: Huaqiang North Road, pedestrianised over the metro (2017), with its malls on both sides (site: paving, canopies, trees, lamps; no signs). Anchor = a point on the road, uncertain: take the street from the refs', r=600)
T(g, 'szmuseumold', '深圳博物馆古代艺术馆', 'Shenzhen Museum (Ancient Art, old building)', 'museum', 'a:w183106483', None, 'The 1988 museum building in Lizhi Park\'s corner on Shennan Road: a low pavilion block with a big overhanging roof')
g = 'szhouhai'; AREA[g] = 'Nanshan Houhai and Shenzhen Bay: the towers, the Sports Center, the bay and the port'
T(g, 'hkcrtower', '华润大厦', 'China Resources Tower', 'tower', 'b:w529272473', 392.5, 'Nanshan 2018, the "spring bamboo shoot": 56 slender diagonal ribs converging to a pointed top over a glass skin; the ribs taper into a lattice at the crown, lit at night', hero=True, existing=V37)
T(g, 'hkszbaysports', '深圳湾体育中心（春茧）', 'Shenzhen Bay Sports Center ("Spring Cocoon")', 'stadium', 'a:w542049855', None, 'AXS Satow, 2011: stadium, arena and natatorium under one white perforated lattice shell by the bay', existing=V38)
T(g, 'hkszbaybridge', '深圳湾公路大桥', 'Shenzhen Bay Bridge', 'bridge', 'a:r15750001', None, '2007 cable-stayed bridge across Deep Bay with inclined single-pylon spans to Hong Kong (built as sub-keys hkszbaybridge_*)', existing=V38)
T(g, 'sztencent', '腾讯滨海大厦', 'Tencent Seafront Towers', 'tower', 'a:w737149477', 245.8, 'NBBJ 2017: two towers (50 and 41 floors) joined by three bridging "links" at low, middle and high levels; glass with sun-shade fins (no logo)', hero=True)
T(g, 'szhanking', '汉京中心', 'Hanking Center', 'tower', 'b:w925221226', 358.9, 'Morphosis 2018, 65 floors (plot a:w694609126; anchor = the unnamed 3 038 m2 footprint at the plot centre, height missing in OSM: check the tower / core split in the refs): the column-free office floors stand beside a detached service core ("detached core design"); check the joints and the crown in photos', hero=True)
T(g, 'szonebay', '深圳湾一号', 'One Shenzhen Bay', 'tower', 'a:w560519734', 341.4, 'Tower 7 (2018, 71 floors), the tallest of the One Shenzhen Bay group facing the bay, with a lit crown')
T(g, 'szbayinno', '深圳湾创新科技中心', 'Shenzhen Bay Innovation and Technology Centre', 'tower', 'a:w534150962', 311.1, '2020 twin towers: Tower 1 311.1 m (69 floors), Tower 2 247.2 m')
T(g, 'szcmbhq', '招商银行全球总部大厦', 'China Merchants Bank Global Headquarters', 'tower', 'b:w1443942674', None, 'Foster + Partners with CCDI (2025, 77 floors) at the Shenzhen Bay Super Headquarters Base: main tower about 387-393 m (sources differ; h left null)')
T(g, 'szhuiyun', '深湾汇云中心', 'Huiyun Center', 'tower', 'a:w818049954', 359.2, '2023, 80 floors: the tallest of the Shenwan Huiyun complex over the metro depot at the Shenzhen Bay Super Headquarters Base')
T(g, 'sztalentpark', '深圳人才公园', 'Shenzhen Talent Park', 'park', 'a:r18459537', None, 'Bay-side park round the inner lake (Houhai): the elevated circular walkway, lawns, the view of the Houhai towers (site)')
T(g, 'szbayport', '深圳湾口岸', 'Shenzhen Bay Port', 'building', 'b:w240804171', None, 'Boundary control point (2007) at the Shenzhen end of the Shenzhen Bay Bridge: the long passenger hall with a curved roof and the vehicle inspection plazas')
T(g, 'szszu', '深圳大学（粤海校区）', 'Shenzhen University (Yuehai Campus)', 'site', 'a:r13900447', None, 'Campus in Nanshan by the Houhai towers: the lake, the library, the stadium, the teaching blocks (site on the real footprints)')
g = 'szshekou'; AREA[g] = 'Shekou, Chiwan, Qianhai and Nantou'
T(g, 'szseaworld', '海上世界（明华轮）', 'Sea World (the Minghua ship)', 'site', 'a:w543176177', None, 'Shekou plaza round the landlocked cruise liner Minghua (ex-Ancerville, built 1962 at Saint-Nazaire, 168 m x 22 m, at Shekou since 1983): white hull, the funnel; the fountain plaza and lanes round it. The ship is not an OSM footprint: find it in the refs / photos', hero=True)
T(g, 'szdesignsociety', '海上世界文化艺术中心', 'Sea World Culture and Arts Center (Design Society)', 'museum', 'a:w740022007', None, 'Maki and Associates: stacked white boxes cantilevering over the sea-front plaza, the stepped roof terraces and the big glazed openings towards the bay', hero=True)
T(g, 'szcruise', '蛇口邮轮中心', 'Shekou Cruise Center (Prince Bay)', 'building', 'b:r12528133', None, 'Ferry / cruise terminal at Prince Bay: long wavy-roofed hall on the shore with the gangways')
T(g, 'szchiwantinhau', '赤湾天后宫', 'Chiwan Tin Hau Temple', 'temple', 'a:w248980045', None, 'Temple of the sea goddess at Chiwan (rebuilt in the Ming / Qing style): halls stepping up the hill axis, red walls, glazed roofs, the archway and stone steps', hero=True)
T(g, 'szsongtomb', '宋少帝陵', 'Tomb of the Last Song Emperor', 'heritage', 'a:r16115644', None, 'The tomb of the boy emperor Zhao Bing at Chiwan: stone terraces, the stele and the tomb mound on the hillside')
T(g, 'szleftfort', '赤湾左炮台', 'Chiwan Left Fort', 'heritage', 'n:22.471330,113.886457', None, 'Qing coastal battery on the hill top above Chiwan port: the gun emplacements, walls, and the Lin Zexu statue nearby (22.4717 N, 113.8866 E). Point anchor: take the fort from the refs', r=150)
T(g, 'sznantou', '南头古城', 'Nantou Ancient City', 'site', 'a:w219961346', None, 'Walled county town (walls built 1394; seat of Xin\'an County from 1573): about 680 x 500 m; the south gate (10 m wide, 4.5 m tall), the east gate, the lanes of Qing houses, the restored main street (site)', hero=True)
T(g, 'szqianhaistone', '前海石公园', 'Qianhai Stone Park', 'park', 'a:w542328084', None, 'Waterfront park with the "Qianhai Stone" boulder (the area\'s symbol) facing the Qianhai towers (site)')
T(g, 'szqhconf', '前海国际会议中心', 'Qianhai International Conference Center', 'building', 'b:w858787224', None, 'Conference centre (2021) in Qianhai: long low hall under a wide overhanging roof on slender columns, set in water gardens')
T(g, 'szqhshimao', '世茂前海中心', 'Shimao Qianhai Centre', 'tower', 'b:w773895107', 294.3, '2020, 62 floors: the tallest tower of Qianhai (OSM height 330: use the verified 294.3)')
T(g, 'szqhhub', '前海深港青年梦工场', 'Qianhai Shenzhen-Hong Kong Youth Innovation Hub', 'site', 'a:w376516134', None, 'Low campus of incubator buildings round a garden, the Qianhai start-up showcase (site)')
T(g, 'szshekouport', '蛇口集装箱码头', 'Shekou Container Terminal', 'site', 'a:r15788753', None, 'Container port at Shekou / Chiwan: the quay cranes along the berths, the stacks, the gantries (site: cranes are the point)')
g = 'szoct'; AREA[g] = 'Overseas Chinese Town (OCT), Xili and the University Town'
T(g, 'szwindow', '世界之窗', 'Window of the World', 'site', 'a:w236402460', None, 'Theme park (1993, 48 ha, about 130 reproductions): the 108 m Eiffel Tower replica dominates; the pyramids, the Taj Mahal, the glass pyramid entrance (site: architecture only, no characters, no signage)', hero=True)
T(g, 'szsplendid', '锦绣中华民俗村', 'Splendid China Folk Village', 'site', 'a:w236402467', None, 'Miniature China (Great Wall, palaces, pagodas at reduced scale) and the folk-culture village of ethnic houses (site)')
T(g, 'szhappyvalley', '欢乐谷', 'Happy Valley Shenzhen', 'site', 'a:w181234737', None, 'Amusement park in OCT: roller coasters, the drop tower, the lake (site: rides as structures, no brand imagery)')
T(g, 'szocth', '欢乐海岸', 'OCT Harbour', 'site', 'a:w322631274', None, 'Waterfront leisure quarter on the lake by Shenzhen Bay: low pavilions, the boardwalks and the wetland (site)')
T(g, 'szocttower', '华侨城大厦', 'OCT Tower', 'tower', 'b:w694439493', 300, '2020, 60 floors: diamond (rhombus) footprint turned to limit shading; glass with vertical fins', hero=True)
T(g, 'szhexiangning', '何香凝美术馆', 'He Xiangning Art Museum', 'museum', 'b:r17068951', None, 'National art museum (1997): low white stone-and-glass block with a courtyard and pool, Lingnan modernism')
T(g, 'szoctloft', '华侨城创意文化园', 'OCT-LOFT Creative Culture Park', 'site', 'a:w741581536', None, 'Converted 1980s factory blocks (the original OCT industrial area): concrete frames, brick, the vines and courtyards (site)')
T(g, 'szsafari', '深圳野生动物园', 'Shenzhen Safari Park', 'site', 'a:w249696516', None, 'Zoo in Xili under the hills: drive-through enclosures, pavilions, paths (site; animals optional, no mascots)')
T(g, 'szsustech', '南方科技大学', 'Southern University of Science and Technology', 'site', 'a:w456349157', None, 'Campus in Xili round the hills and lake: the library, the white teaching blocks and the new research towers (site)')
T(g, 'szhitsz', '哈尔滨工业大学（深圳）', 'Harbin Institute of Technology, Shenzhen (University Town)', 'site', 'a:w319515452', None, 'University Town campus beside Xili Lake (with Peking and Tsinghua graduate schools next door): the teaching blocks round the central lawn (site)')
g = 'szbaoan'; AREA[g] = "Bao'an: the airport, Shenzhen World, Bao'an centre and the Shenzhen-Zhongshan Link"
T(g, 'szt3', '深圳宝安国际机场T3航站楼', "Shenzhen Bao'an Airport Terminal 3", 'building', 'b:w222145025', None, 'Studio Fuksas, opened 28 Nov 2013: 1.5 km long, about 500 000 m2, "manta ray" form; a double skin of white honeycomb panels with hexagonal glazed openings over the whole roof and walls; the long finger pier (honeycomb glows at night)', hero=True)
T(g, 'szsatellite', '深圳机场卫星厅', "Shenzhen Airport Satellite Concourse", 'building', 'b:w877295774', None, 'The X-shaped satellite concourse north of T3 (its piers radiating from a central hall), glazed')
T(g, 'szatctower', '深圳机场塔台', 'Shenzhen Airport Control Tower', 'tower', 'b:w478460848', None, 'The control tower on the airfield (OSM height 98 m, unverified): slim shaft with the glazed cab')
T(g, 'szworld', '深圳国际会展中心', 'Shenzhen World Exhibition & Convention Center', 'building', 'b:w785606096', None, 'Opened Nov 2019: 400 000 m2 in phase 1; sixteen 20 000 m2 halls lined along a central corridor (glass-roofed upper concourse), the 50 000 m2 mega-hall and the conference halls; over 1.5 km long', hero=True)
T(g, 'szbaoanstadium', '宝安体育场', "Bao'an Stadium", 'stadium', 'b:r9249893', 39.65, 'gmp 2011, 40 050 seats: 245.8 x 245.8 m, 39.65 m high; the stands ringed by a "bamboo forest" of slim green steel columns (up to 32 m, 55-80 cm diameter) and a membrane roof hung from cables (230 m ring, 54 m cantilever)', hero=True)
T(g, 'szbayglory', '湾区之光摩天轮', 'Bay Glory Ferris Wheel', 'attraction', 'b:w914175455', 128, 'Opened 18 Apr 2021 at OH Bay (Qianhai Bay): 128 m high, 113.3 m diameter, 28 cabins on a cantilevered wheel; LED-lit rim at night', hero=True)
T(g, 'szbayeye', '湾区之眼（深圳书城湾区城）', 'Eyes of the GBA (Bay Area Book City)', 'building', 'a:w535309716', None, 'Two low curved halls (north and south) facing OH Bay round a central opening, the "eye"; green roofs')
T(g, 'szszlink', '深中通道伶仃洋大桥', 'Lingdingyang Bridge (Shenzhen-Zhongshan Link)', 'bridge', 'a:w1465183400', None, 'Suspension bridge of the Shenzhen-Zhongshan Link (opened 30 June 2024): 1 666 m main span, towers 270 m; west of the West Artificial Island where the 6.7 km tunnel from Shenzhen surfaces. Region: in the estuary (check the deck height in situ; the generic deck rule is far too low for it: write a deck fix)', hero=True)
T(g, 'szxiwan', '西湾红树林公园', 'Xiwan Mangrove Park', 'park', 'a:r16078708', None, 'Bao\'an\'s coastal park: the mangrove boardwalk and the seawall promenade on the estuary (site)')
T(g, 'szwaterlands', '海上田园', 'Shenzhen Waterlands Resort', 'site', 'a:w316491108', None, 'Wetland park on fish ponds at Shajing: water channels, pavilions, boardwalks (site)')
g = 'sznorth'; AREA[g] = 'Longhua, Guangming, Longgang and Pingshan (north and east districts)'
T(g, 'sznorthstation', '深圳北站', 'Shenzhen North Railway Station', 'station', 'b:w1212433645', None, 'High-speed hub (HSR 26 Dec 2011): the big roof over the tracks; metro Lines 4 and 6 run elevated through the east square under the roof; the elevated passage at the 9 m level', hero=True)
T(g, 'szartmuseum', '深圳美术馆新馆', 'Shenzhen Art Museum (new building)', 'museum', 'b:w1178327405', None, 'Longhua cultural district by the North Station: with the Library North Branch (Second Library) one pair of white buildings round a plaza')
T(g, 'szlibnorth', '深圳图书馆北馆', 'Shenzhen Library North Branch (Second Library)', 'building', 'b:w1178327404', None, 'The second city library next to the new Art Museum: a long white block with deep vertical fins')
T(g, 'szscimuseum', '深圳科学技术馆', 'Shenzhen Science and Technology Museum', 'museum', 'a:w1455699525', None, 'Zaha Hadid Architects (with BIAD), opened 1 May 2025, Guangming: one sweeping rounded "spaceship" volume facing the city, stepping down into terraces over the Science Park on its west side; stainless-steel panels anodised from deep blue to greys', hero=True)
T(g, 'szguanlan', '观澜古墟', 'Guanlan Ancient Market', 'site', 'a:w1284417908', None, 'Restored market street of arcaded shophouses (qilou) and the old watch towers on the Guanlan River (site)')
T(g, 'szdafen', '大芬油画村', 'Dafen Oil Painting Village', 'site', 'a:w248181066', None, 'The painters\' village in Longgang: lanes of studios and galleries with paintings on the walls (no copies of real artworks needed), the art museum (site)')
T(g, 'szgalaxy', '星河WORLD', 'Galaxy World Towers', 'tower', 'b:w1190193566', 356, '2023 twin towers (71 floors each) at Bantian, Longgang: two identical towers side by side (west w1190193566 = anchor, east w1190193567; OSM says 369 m), lit crowns')
T(g, 'szuniversiade', '深圳大运中心', 'Shenzhen Universiade Sports Centre', 'site', 'a:w542808029', None, 'gmp, 2011 Summer Universiade: stadium (60 334 seats), arena (18 000) and natatorium (3 000), each wrapped in a faceted "crystal" shell of triangular translucent panels on a steel lattice, round a lake (site)', hero=True)
T(g, 'szcuhksz', '香港中文大学（深圳）', 'The Chinese University of Hong Kong, Shenzhen', 'site', 'a:r10129044', None, 'Campus (2014) on the hills next to the Universiade Centre: the lower and upper campuses, red-brick and stone blocks, the library (site)')
T(g, 'szhehu', '鹤湖新居', 'Hehu Xinju (Longgang Hakka walled house)', 'heritage', 'a:w1088961704', None, 'Large Qing Hakka walled house in Longgang: square enclosure with corner watch towers, rows of halls round courtyards, grey walls and tiled roofs; the Hakka folk museum')
T(g, 'szdawan', '大万世居', 'Dawan Shiju (Pingshan Hakka walled house)', 'heritage', 'b:w784652604', None, 'Qing Hakka walled compound in Pingshan: rectangular, moat in front, corner towers, the ancestral hall axis, grey roofs')
T(g, 'szpingshantheatre', '坪山大剧院', 'Pingshan Grand Theater', 'building', 'a:w878478259', None, 'Theatre in Pingshan centre. Anchor uncertain: the OSM object of that name is the planted area round it; find the building in the refs')
g = 'szeast'; AREA[g] = 'Wutong Shan, Fairy Lake, Yantian, Dameisha and Dapeng'
T(g, 'szwutongtv', '梧桐山电视塔', 'Wutong Shan TV Tower', 'tower', 'b:w275168893', None, 'Transmission tower on Small Wutong above Luohu, the landmark on the ridge seen from the city (height unverified: take it from photos)')
T(g, 'szwutong', '大梧桐', 'Big Wutong (Wutong Shan summit)', 'site', 'n:22.582278,114.214639', None, 'The highest peak of Shenzhen, 943.7 m (the app\'s 70 m grid reads lower): the summit rocks, the paths and the summit marker (site; no text)', r=300)
T(g, 'szhongfa', '弘法寺', 'Hongfa Temple', 'temple', 'a:w246372603', None, 'Chan temple (1985-1992) at the foot of Wutong Shan in the Fairy Lake garden: about forty buildings up the hill axis, the mountain gate, the Hall of the Four Heavenly Kings, the Mahavira Hall, the bell and drum towers; yellow walls, glazed roofs', hero=True)
T(g, 'szxianhu', '仙湖植物园', 'Fairy Lake Botanical Garden', 'park', 'a:w270859682', None, 'The botanical garden round Fairy Lake under Wutong Shan: the lake, glasshouses, pavilions (site)')
T(g, 'szreservoir', '深圳水库', 'Shenzhen Reservoir', 'site', 'a:r417246', None, 'The reservoir that stores the Dongjiang water for Shenzhen and Hong Kong: the dam and its spillway, the lake shore (site: the dam)')
T(g, 'szyantian', '盐田港', 'Yantian Port', 'site', 'a:w261283912', None, 'One of the world\'s biggest container ports: the long quays with rows of quay cranes, the stacks and the mountains behind (site)')
T(g, 'szchungying', '中英街', 'Chung Ying Street', 'site', 'n:22.544452,114.226097', None, 'The border street in Sha Tau Kok: one side Shenzhen, one side Hong Kong (1899 border line); the warning bell monument, the boundary stones, the low shops (site). Anchor = the warning-bell node', r=300, hero=True)
T(g, 'szvanke', '万科中心', 'Vanke Center (Dameisha)', 'building', 'a:w1210907099', None, 'Steven Holl 2009, the "horizontal skyscraper": a long bent bar floating over a tropical garden on eight cores up to 50 m apart, under the 35 m height limit; perforated louvred facade; green roof (the OSM area is tagged school: check)', hero=True)
T(g, 'szdameisha', '大梅沙海滨公园', 'Dameisha Beach', 'park', 'a:w730043029', None, 'The public beach of Yantian: the sand, the promenade, palms, the sculptures (site)')
T(g, 'szocteast', '东部华侨城茵特拉根小镇', 'OCT East (Interlaken Town)', 'site', 'a:r9079150', None, 'Mountain resort above Dameisha: the Swiss-style town square, the lake and the lodges (site: architecture only, no signage)')
T(g, 'szdapeng', '大鹏所城', 'Dapeng Fortress', 'site', 'a:w404249608', None, 'Ming coastal fortress (1394) against pirates: the square walled town with its gates, the lanes of Qing houses and the generals\' mansions (site)', hero=True)
T(g, 'szjiaochangwei', '较场尾', 'Jiaochangwei', 'site', 'a:w523210525', None, 'Beach village of guesthouses south of the fortress on Dapeng Bay: colourful low houses, the beach (site)')
# ================= Dongguan =================
g = 'dgcity'; AREA[g] = 'Dongguan centre: Nancheng central square, Dongcheng and old Guancheng'
T(g, 'dgcityhall', '东莞市行政办事中心', 'Dongguan Administrative Center (City Hall)', 'building', 'a:w619355200', None, 'The city hall at the north end of the central square: a vast symmetric block with a colonnade and a big flat roof, facing the axis', hero=True)
T(g, 'dgsquare', '东莞中心广场', 'Dongguan Central Square', 'park', 'a:w520278681', None, 'The long axis of lawns, fountains and trees between the City Hall and the theatre / library / museum cluster (site)')
T(g, 'dgyulan', '玉兰大剧院', 'Yulan Grand Theatre', 'building', 'b:w520281241', None, 'The city theatre on the central square: a shell-like roof form over the glass foyer (named after the city flower, the yulan)', hero=True)
T(g, 'dglibrary', '东莞图书馆', 'Dongguan Library', 'building', 'b:w520281240', None, 'The main city library on the central square beside the Yulan theatre: glass-and-stone block with a big atrium')
T(g, 'dgmuseum', '东莞市博物馆', 'Dongguan Museum (central square)', 'museum', 'a:w1387794621', None, 'The museum site on the central square (check in photos whether it is open or under construction; the old museum is in Guancheng, b:w520439671)')
T(g, 'dgexhibition', '东莞市展览馆', 'Dongguan Exhibition Hall', 'building', 'b:w520278682', None, 'The exhibition hall on the central square axis')
T(g, 'dgtba', '环球经贸中心（台商大厦）', 'Dongguan TBA Tower', 'tower', 'a:w1077123840', 289, '2013, 68 floors (Taiwan Business Association tower / Global Trade Plaza) on Dongguan Avenue by the central square')
T(g, 'dgminying', '民盈·国贸中心', 'Minying International Trade Center', 'tower', 'a:w797864952', 422.6, 'T2 422.6 m, 96 floors (opened 2021), the tallest in Dongguan, with its shorter sister towers on the mall podium', hero=True)
T(g, 'dgkeyuan', '可园', 'Keyuan Garden', 'site', 'a:w619355190', None, 'One of the four great Lingnan gardens (1850, Zhang Jingxiu): grey-brick pavilions, corridors and the tall look-out pavilion, ponds (site)', hero=True)
T(g, 'dgyingen', '迎恩门城楼', "Ying'en Gate", 'heritage', 'b:w520439670', None, 'The surviving west gate of the old walled city of Dongguan (Ming): the brick-and-stone gate base with its tiled gate tower', hero=True)
T(g, 'dgqifeng', '旗峰公园', 'Qifeng Park (Huangqi Hill)', 'park', 'a:w520436667', None, 'Hill park on Huangqi Shan east of the centre: the paths, the pavilions and the giant red lantern on the summit (find it in the refs / photos) (site)')
g = 'dghumen'; AREA[g] = 'Humen and the Pearl River mouth: the bridges and the Opium War sites, Houjie'
T(g, 'dghumenbridge', '虎门大桥', 'Humen Bridge', 'bridge', 'a:w697359843', None, 'Opened 9 June 1997: suspension bridge, 888 m main span (navigation clearance 60 m) across the Pearl River from Humen (Dongguan) to Nansha; the auxiliary channel bridge is a concrete rigid frame 150 + 270 + 150 m (clearance 40 m); main bridge 4.588 km. Write a deck fix (the generic deck rule is far too low)', hero=True)
T(g, 'dgnansha', '南沙大桥坭洲水道桥', 'Nansha Bridge (Nizhou Waterway Bridge)', 'bridge', 'a:w687712144', None, 'Opened 2 April 2019 (the second Humen bridge, Shatian in Dongguan to Nansha): suspension bridge with a 1 688 m main span. Deck fix needed', hero=True)
T(g, 'dgdasha', '南沙大桥大沙水道桥', 'Nansha Bridge (Dasha Waterway Bridge)', 'bridge', 'a:w687712143', None, 'The western suspension span of the Nansha Bridge (1 200 m main span), on the Guangzhou side (context region)')
T(g, 'dgopiumwar', '鸦片战争博物馆（林则徐销烟池）', 'Opium War Museum and the Opium Destruction Pools', 'museum', 'a:w856669492', None, 'Humen: the site of Lin Zexu\'s destruction of opium (1839): the two square pools, the memorial, the museum halls (site + museum; anchor = the memorial area, the museum is b:w856669491)', hero=True)
T(g, 'dgweiyuan', '威远炮台', 'Weiyuan Fort', 'heritage', 'b:w583396711', None, 'Qing battery on Weiyuan Island by the Humen Bridge: the long curved granite gun wall with embrasures facing the river', hero=True)
T(g, 'dgseabattle', '海战博物馆', 'Humen Naval Battle Museum', 'museum', 'a:w583396710', None, 'Museum on Weiyuan Island at the foot of the Humen Bridge: the low halls, the sculpture plaza')
T(g, 'dgshajiao', '沙角炮台', 'Shajiao Fort', 'heritage', 'n:22.762054,113.664495', None, 'Qing fort on the Shajiao headland at the river mouth: batteries and walls on the hill. Point anchor: find it in the refs', r=300)
T(g, 'dghumenstation', '虎门站', 'Humen Railway Station', 'station', 'b:w291507024', None, 'High-speed station (Guangzhou-Shenzhen-Hong Kong line, 2011): long roof over the elevated platforms')
T(g, 'dgexpo', '广东现代国际展览中心', 'Guangdong Modern International Exhibition Center', 'building', 'a:w129632150', None, 'Houjie: the exhibition halls of the furniture fair, the domed central hall, and the hotel tower beside it')
T(g, 'dgyuehui', '粤晖园', 'Yuehui Garden', 'site', 'a:w618218708', None, 'Large Lingnan-style garden at Daojiao: lakes, bridges, pavilions and corridors (site)')
g = 'dgsongshan'; AREA[g] = 'Songshan Lake, Dalang, Liaobu, Zhangmutou, Chashan, Shilong and Fenggang'
T(g, 'dgoxhorn', '华为溪流背坡村', 'Huawei Ox Horn Campus', 'site', 'a:w1112670101', None, 'Opened April 2019 on the south shore of Songshan Lake: twelve groups of buildings in European town styles linked by a red mountain-railway style tram; lakes, bridges (site: architecture only, no logos)', hero=True)
T(g, 'dgdgut', '东莞理工学院（松山湖校区）', 'Dongguan University of Technology (Songshan Lake)', 'site', 'a:w583565412', None, 'Campus on the lake shore: the library, teaching blocks on the hill (site)')
T(g, 'dgcsns', '中国散裂中子源', 'China Spallation Neutron Source', 'building', 'a:w558947793', None, 'The national research facility at Dalang: the long accelerator buildings and the target station hall (site-like: the low industrial-science halls)')
T(g, 'dgbasketball', '东莞篮球中心', 'Dongguan Basketball Centre', 'stadium', 'b:w344966677', None, 'The basketball arena (home of the Guangdong team): an oval arena with a sweeping metal roof and glass base')
T(g, 'dgguanyin', '观音山国家森林公园', 'Guanyinshan National Forest Park', 'site', 'a:w1336411510', None, 'Forest park in Zhangmutou with the large white stone Guanyin statue on the summit terrace and the temple halls (anchor = the park: find the statue in the refs; height unverified)')
T(g, 'dgnanshe', '南社明清古村落', 'Nanshe Ancient Village', 'site', 'a:w433788826', None, 'Ming-Qing village in Chashan: the long pond with ancestral halls on both banks, grey-brick houses, watch towers (site)', hero=True)
T(g, 'dgstation', '东莞站', 'Dongguan Railway Station', 'station', 'b:w337173806', None, 'The station at Shilong / Changping on the Guangzhou-Kowloon line: the station building and its square')
T(g, 'dgsouthstation', '东莞南站', 'Dongguan South Railway Station', 'station', 'b:w889622740', None, 'High-speed station at Fenggang on the Ganzhou-Shenzhen line: the station hall over the tracks')
# ---------------- resolve against this build ----------------
if __name__ == '__main__':
    R = pickle.load(open(HERE + 'names.pkl', 'rb'))
    idx = {(k, oid): (t, wk) for k, oid, t, wk in R if k in ('b', 'a')}
    LAND = load('land.pkl'); REG = [(k, LAND[k]) for k in ('hk', 'sz', 'dg')]; del LAND
    def region(x, y):
        p = Point(x, y)
        for k, poly in REG:
            if poly.contains(p): return k
        return 'other'
    Bd = load('buildings.pkl')['b']; BT = STRtree([b['g'] for b in Bd]); byid = {b['id']: b for b in Bd}
    out = {'note':'Shenzhen and Dongguan landmark and site targets for the Greater Bay map (City Brush, gbareal; see gba/BRIEF.md). lat/lon = the centroid '
           'of the named OSM footprint (osm = its id: w way, r relation; towers given by their plot are anchored on the tallest building of this build inside '
           'it, the plot kept under plot). h = verified overall height (m) or null; h_osm = OSM height / levels; h_app = this build\'s height. r = suggested '
           'model radius (m). region = hk / sz / dg / other (context) at the anchor. existing = a key already modelled in a Hong Kong module (count it, do '
           'not duplicate it). hero = a recognisable detailed replica. Names: zh Simplified, en English.', 'areas':AREA, 'groups':{}}
    n = 0
    for grp, L in G.items():
        out['groups'][grp] = []
        for d in L:
            kind_, ref = d['src'].split(':', 1); e = {k: d[k] for k in ('key', 'zh', 'en', 'kind', 'h', 'notes')}
            if kind_ in ('b', 'a'):
                hit = idx.get((kind_, ref)) or idx.get(('a' if kind_ == 'b' else 'b', ref))
                if hit: t, wk = hit; g = proj(shapely.wkb.loads(wk)).buffer(0)
                else: assert kind_ == 'b' and ref in byid, (d['key'], d['src']); t = {}; g = byid[ref]['g']     # an unnamed footprint of this build
                c = g.centroid
                lon, lat = ll(c.x, c.y); e.update(lat=round(lat, 6), lon=round(lon, 6), osm=ref, area_m2=round(g.area))
                e['h_osm'] = t.get('height') or (('%s levels' % t['building:levels']) if t.get('building:levels') else None)
                bb = [byid.get(ref)] if byid.get(ref) else [Bd[int(k)] for k in BT.query(g) if Bd[int(k)]['g'].representative_point().within(g)]
                bb = [b for b in bb if b]
                if bb:
                    b = max(bb, key=lambda b: b['h']); bc = b['g'].centroid; blon, blat = ll(bc.x, bc.y)
                    if b['id'] != ref and d['kind'] == 'tower': e['tallest'] = {'osm':b['id'], 'h':b['h'], 'lat':round(blat, 6), 'lon':round(blon, 6), 'name':b['name'] or b.get('zh')}
                    else: e['h_app'] = b['h']
                ext = max(math.hypot(x - c.x, y - c.y) for x, y in g.exterior.coords) if g.geom_type == 'Polygon' else max(math.hypot(x - c.x, y - c.y) for p in g.geoms for x, y in p.exterior.coords)
                e['r'] = d['r'] or int(min(1600, max(30, ext*1.05 if d['kind'] == 'bridge' else min(ext*1.05, math.sqrt(g.area/math.pi)*1.8))))
            else:
                lat, lon = map(float, ref.split(',')); e.update(lat=lat, lon=lon, osm=None, r=d['r'] or 300)
            if d['kind'] == 'tower' and e.get('tallest'):
                e['plot'] = {'lat':e['lat'], 'lon':e['lon'], 'osm':e['osm']}; e['lat'], e['lon'], e['osm'] = e['tallest']['lat'], e['tallest']['lon'], e['tallest']['osm']
                e['h_app'] = e['tallest']['h']; e['r'] = d['r'] or max(40, int(math.sqrt(byid[e['osm']]['g'].area/math.pi)*1.8))
                del e['tallest']
            x, y = w(e['lon'], e['lat']); e['region'] = region(x, y); e['city'] = grp[:2]
            if d['hero']: e['hero'] = True
            if d['existing']: e['existing'] = d['existing']
            out['groups'][grp].append(e); n += 1
    os.makedirs(ROOT + 'gba', exist_ok=True)
    json.dump(out, open(ROOT + 'gba/targets.json', 'w'), ensure_ascii=False, indent=1)
    keys = [e['key'] for L in out['groups'].values() for e in L]; assert len(keys) == len(set(keys)), 'duplicate keys'
    print('targets', n, {g: len(v) for g, v in out['groups'].items()})
    for g_, L in out['groups'].items():
        for e in L: print('%-10s %-18s %9.5f %10.5f r %4d h %-6s osm-h %-10s app %-6s %-5s %s%s' % (g_, e['key'], e['lat'], e['lon'], e['r'], e['h'], e.get('h_osm'), e.get('h_app'), e['region'], e['osm'], ' plot ' + e['plot']['osm'] if e.get('plot') else ''))
