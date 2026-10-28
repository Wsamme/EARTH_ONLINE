# stage 9a (Tokyo): the landmark / site target list -> SC/tyo/targets.json (used by b9_refs.py for the reference files).
# Each target names its OSM object ('b:w123' building / part, 'a:r123' area / multipolygon) or, for point features (bridges given
# by their middle, crossings, gates without a footprint), 'n:lat,lon'. The script resolves it against this build's OSM data (the
# compact building arrays of b0a / b5 and raw_areas.pkl): the footprint centroid (lat/lon), its area, the OSM height / levels, the
# tallest building of this build inside an area; it STOPS (assert) on an unresolved id.
# h = known overall height (m, top of structure / roof as noted) only where certain, else null (see h_osm / h_app and the refs).
import sys, json, collections, math; sys.path.insert(0, '.')
from common import *
G = collections.OrderedDict()
def T(group, key, zh, en, kind, src, h, notes, r=None):
    G.setdefault(group, []).append(dict(key=key, zh=zh, en=en, kind=kind, src=src, h=h, notes=notes, r=r))
# ---- Marunouchi / Ōtemachi / Nihonbashi
g = 'marunouchi'
T(g, 'tytokyostation', '东京站丸之内站舍', 'Tokyo Station Marunouchi Building', 'heritage', 'b:r4856156', None, 'Red-brick station building (Tatsuno Kingo, 1914), ~335 m long, three storeys with the two domed octagonal halls at the north and south ends and the central entrance; restored to its 1914 form in 2012 (the domes and the third storey rebuilt)')
T(g, 'tymarubiru', '丸之内大厦', 'Marunouchi Building', 'tower', 'b:w145394394', None, 'Office tower (2002) on a 31 m podium that keeps the old Marunouchi street-wall height; the tower set back above it')
T(g, 'tyshinmaru', '新丸之内大厦', 'Shin-Marunouchi Building', 'tower', 'b:r3816171', None, 'Office tower (2007) opposite the Marunouchi Building across Gyōkō-dōri, same podium line, glass tower set back above')
T(g, 'tyjptower', 'JP塔', 'JP Tower', 'tower', 'b:w145394391', None, 'Office tower (2012) behind the preserved façade of the former Tokyo Central Post Office (KITTE, 1931) facing the Marunouchi station square')
T(g, 'tytokiwabashi', '常盘桥塔', 'Tokiwabashi Tower', 'tower', 'b:w859375772', None, 'Office tower (2021) of the Tokyo Torch development north of Tokyo Station; its taller sister Torch Tower is under construction (not in the map)')
T(g, 'tygranroof', '东京站八重洲口 GranRoof', 'Tokyo Station Yaesu Entrance (GranRoof)', 'building', 'b:w145412784', None, 'The long white membrane canopy (2013) over the Yaesu side pedestrian deck between the two Gran Tokyo towers')
T(g, 'tynihonbashi', '日本桥', 'Nihonbashi Bridge', 'bridge', 'a:w550689172', None, 'Twin-arch granite bridge (1911) over the Nihonbashi River with bronze kirin and lion statues and lamp posts; the elevated Shuto Expressway runs right above it (the road deck is drawn by the app)')
# ---- The Imperial Palace and Nagatachō
g = 'palace'
T(g, 'tynijubashi', '二重桥', 'Nijūbashi (Seimon Ishibashi and Tetsubashi)', 'bridge', 'n:35.67985,139.75210', None, 'The palace main gate bridges: the stone double-arch Seimon Ishibashi in front and the iron Seimon Tetsubashi behind over the Nijūbashi Moat, with ornate lamps; the Fushimi turret behind', r=160)
T(g, 'tyfushimi', '伏见橹', 'Fushimi-yagura', 'heritage', 'b:w184212776', None, 'Two-storey white plastered corner turret of Edo Castle with grey tile roofs and the stone wall below, on the moat behind Nijūbashi')
T(g, 'tyeastgardens', '皇居东御苑', 'East Gardens of the Imperial Palace', 'site', 'a:r5415394', None, 'Former Edo Castle inner citadel: the castle-keep stone base (tenshudai), stone walls, moats, gates (Ōtemon), the Hyakunin-bansho guardhouse, lawns and gardens (SITE)')
T(g, 'tykokyogaien', '皇居外苑', 'Kokyo Gaien National Garden', 'site', 'a:r3551852', None, 'The palace forecourt: gravel plaza with clipped black pines, the moats and stone walls, Sakuradamon (SITE)')
T(g, 'tydiet', '国会议事堂', 'National Diet Building', 'building', 'b:r3361370', None, 'Granite parliament (1936): symmetrical wings for the two houses and a central stepped-pyramid tower')
T(g, 'tyakasaka', '迎宾馆赤坂离宫', 'Akasaka Palace (State Guest House)', 'heritage', 'b:r6109212', None, 'Neo-Baroque palace (1909) with two curved front wings around the main court, green copper roofs and the fountain garden behind')
T(g, 'tyyasukuni', '靖国神社', 'Yasukuni Shrine', 'heritage', 'b:w144379616', None, 'Shrine worship hall (haiden) with the main hall (honden) behind, the great steel torii and the shinmon gate on the approach; architecture only', r=220)
# ---- Ginza, Shiodome, Tsukiji
g = 'ginza'
T(g, 'tywako', '和光大楼', 'Wako Building (Ginza clock tower)', 'heritage', 'b:w103509469', None, 'Neo-Renaissance corner building (1932) at Ginza 4-chōme with its curved façade and the clock tower; no shop name on the model')
T(g, 'tykabukiza', '歌舞伎座', 'Kabuki-za', 'heritage', 'b:r4859313', None, 'Kabuki theatre (rebuilt 2013) in the Momoyama revival style: white walls, the big karahafu gable over the entrance, tiled roofs; the 29-storey Kabuki-za Tower behind it')
T(g, 'tykabukizatower', '歌舞伎座塔', 'Kabuki-za Tower', 'tower', 'b:w662901403', None, 'The office tower rising behind the theatre (model with tykabukiza)')
T(g, 'tyshiodomecc', '汐留城市中心', 'Shiodome City Center', 'tower', 'b:w151481757', None, 'Glass office tower of the Shiodome redevelopment')
T(g, 'tydentsu', '电通总部大楼', 'Dentsu Building', 'tower', 'b:w151481755', None, 'Curved, blade-shaped glass tower (Jean Nouvel, 2002); no company name on the model')
T(g, 'tyntv', '日本电视台塔', 'Nippon Television Tower', 'tower', 'b:w151481850', None, 'Office / broadcast tower at Shiodome; no logos')
T(g, 'tytsukiji', '筑地本愿寺', 'Tsukiji Hongan-ji', 'heritage', 'a:w540410517', None, 'Buddhist temple (1934, Itō Chūta) in an ancient-Indian style: stone hall with a domed central roof and side towers', r=120)
# ---- Shiba / Roppongi / Toranomon
g = 'minato'
T(g, 'tytokyotower', '东京塔', 'Tokyo Tower', 'tower', 'b:r4247312', 333, 'Lattice steel tower (1958), 333 m, painted in international orange and white bands; main deck ~150 m, top deck ~250 m; the FootTown building at its base')
T(g, 'tyzojoji', '增上寺大殿', 'Zōjō-ji Daiden', 'heritage', 'b:w751591140', None, 'The temple main hall below Tokyo Tower')
T(g, 'tysangedatsu', '增上寺三解脱门', 'Zōjō-ji Sangedatsumon', 'heritage', 'b:w30516556', None, 'Two-storey vermilion temple gate (1622), the oldest wooden building in central Tokyo')
T(g, 'tymidtown', '东京中城大厦', 'Tokyo Midtown Tower', 'tower', 'b:w103007069', 248, 'Office / hotel tower (2007), 248 m, the tallest of Tokyo Midtown, over the Midtown Garden')
T(g, 'tyroppongimori', '六本木新城森大厦', 'Roppongi Hills Mori Tower', 'tower', 'b:w153924771', 238, 'Office tower (2003), 238 m, with the museum / observation crown and the flared base; Maman spider sculpture out of scope')
T(g, 'tyazabudai', '麻布台之丘森JP塔', 'Azabudai Hills Mori JP Tower', 'tower', 'b:w1158739441', 325, 'Japan\'s tallest building (2023), 325 m, softly curved tapering glass tower')
T(g, 'tytoranomon', '虎之门之丘森大厦', 'Toranomon Hills Mori Tower', 'tower', 'b:w390949465', None, 'Office / hotel tower (2014) over the Loop Road No. 2 tunnel, with rounded corners and the crown')
T(g, 'tytoranomonst', '虎之门之丘车站大厦', 'Toranomon Hills Station Tower', 'tower', 'b:w1158726591', None, 'Tower (2023) over Toranomon Hills station with the glass top box')
# ---- Asakusa and Oshiage
g = 'asakusa'
T(g, 'tyskytree', '东京晴空塔', 'Tokyo Skytree', 'tower', 'b:w288269147', 634, 'Broadcasting tower (2012), 634 m: triangular steel-lattice base morphing to a circle, observation decks at 350 m (Tembō Deck) and 450 m (Tembō Galleria), the antenna mast on top; white with a faint blue tint')
T(g, 'tysolamachi', '东京晴空街道', 'Tokyo Solamachi', 'building', 'b:r7967788', None, 'The long commercial complex at the foot of the Skytree (part of the Skytree Town); no shop names')
T(g, 'tysolamachieast', '东京晴空塔东塔', 'Tokyo Skytree East Tower', 'tower', 'b:w362351418', None, 'Office tower at the east end of the Skytree Town')
T(g, 'tykaminarimon', '雷门', 'Kaminarimon', 'heritage', 'b:w173154849', None, 'Sensō-ji\'s outer gate with the huge red paper lantern (chōchin) and the Fūjin / Raijin statues')
T(g, 'tyhozomon', '宝藏门', 'Hōzōmon', 'heritage', 'b:w573271561', None, 'Two-storey vermilion inner gate of Sensō-ji with lanterns, at the end of Nakamise')
T(g, 'tysensoji', '浅草寺本堂', 'Sensō-ji Main Hall', 'heritage', 'b:w91008673', None, 'Main hall (rebuilt 1958) with its steep, sweeping tiled roof and vermilion columns')
T(g, 'typagoda', '浅草寺五重塔', 'Sensō-ji Five-storey Pagoda', 'heritage', 'b:w173154770', None, 'Vermilion five-storey pagoda (rebuilt 1973) west of the Hōzōmon with its finial')
T(g, 'tynakamise', '仲见世商店街', 'Nakamise-dōri', 'site', 'a:w859751371', None, 'The ~250 m shopping street of small vermilion shop rows between Kaminarimon and Hōzōmon (SITE: generic shopfronts, no names)')
T(g, 'tyasahihall', '隅田川畔啤酒厅（金色火焰）', 'Sumida riverside beer hall (golden flame building)', 'building', 'b:w155874922', None, 'Black granite inverted-trapezoid hall (Philippe Starck, 1989) crowned with the large golden "flame" sculpture; generic form only, no brand')
T(g, 'tyasahitower', '隅田川畔啤酒总部大楼', 'Sumida riverside brewery headquarters tower', 'tower', 'b:w155874930', None, 'The amber-glass tower next to the hall, shaped like a glass of beer with a white top; no brand')
# ---- Shibuya, Harajuku, the Olympic district
g = 'shibuya'
T(g, 'tyscramble', '涩谷SCRAMBLE SQUARE', 'Shibuya Scramble Square', 'tower', 'b:w617560918', 230, 'Tower (2019), 230 m, over Shibuya Station with the open-air Shibuya Sky rooftop deck')
T(g, 'tymeijiotorii', '明治神宫大鸟居', 'Meiji Jingū Ōtorii', 'heritage', 'b:w469908912', 12, 'The great wooden torii (cypress) on the north approach; 12 m high')
T(g, 'tyyoyogi1', '国立代代木竞技场第一体育馆', 'Yoyogi National Gymnasium (first gymnasium)', 'building', 'b:w101925760', None, 'Tange Kenzō\'s 1964 suspension-roof arena: the two cables between concrete masts, the swooping roof in two crescents')
T(g, 'tyyoyogi2', '国立代代木竞技场第二体育馆', 'Yoyogi National Gymnasium (second gymnasium)', 'building', 'b:w72541058', None, 'The smaller round arena with its single-mast spiral roof')
# ---- Shinjuku
g = 'shinjuku'
T(g, 'tytmg1', '东京都厅第一本厅舍', 'Tokyo Metropolitan Government Building No. 1', 'tower', 'b:w89877471', 243, 'Tange Kenzō\'s twin-tower city hall (1991), 243 m, the towers split at the 33rd floor; granite grid façade')
T(g, 'tytmg2', '东京都厅第二本厅舍', 'Tokyo Metropolitan Government Building No. 2', 'tower', 'b:w89877420', None, 'The stepped second building of the city hall')
T(g, 'tycocoon', '东京MODE学园蚕茧大厦', 'Mode Gakuen Cocoon Tower', 'tower', 'b:w145495557', 204, 'Elliptical school tower (2008), 204 m, wrapped in a crossing white lattice (the "cocoon")')
T(g, 'typarktower', '新宿柏悦大厦', 'Shinjuku Park Tower', 'tower', 'b:w153148303', None, 'Three stepped granite / glass towers (1994, Tange) with pyramid tops')
T(g, 'tysumitomo', '新宿住友大厦', 'Shinjuku Sumitomo Building', 'tower', 'b:r2266005', None, 'Triangular office tower (1974) with the glass-roofed triangle plaza at its foot')
# ---- Ueno, Akihabara, Bunkyō
g = 'ueno'
T(g, 'tytnm', '东京国立博物馆本馆', 'Tokyo National Museum, Honkan', 'heritage', 'b:r2737745', None, 'Imperial-crown-style museum hall (1938): Western concrete building with a tiled Japanese roof')
T(g, 'tyuenopark', '上野恩赐公园', 'Ueno Park', 'site', 'a:r18158889', None, 'Park with Shinobazu Pond, the museums\' grounds, the zoo and temples (SITE: landscape, keep the museum buildings)')
T(g, 'tyakiba', '秋叶原电器街', 'Akihabara Electric Town', 'site', 'n:35.69840,139.77310', None, 'Chūō-dōri\'s electronics and anime shop buildings with dense signage (abstract signs only, no brands)', r=300)
T(g, 'tytokyodome', '东京巨蛋', 'Tokyo Dome', 'building', 'b:w20028328', None, 'Air-supported white membrane dome stadium (1988)')
T(g, 'tydomecity', '东京巨蛋城游乐园', 'Tokyo Dome City Attractions', 'site', 'a:w345293593', None, 'The amusement park next to the dome: the hub-less Ferris wheel and the roller coaster through the LaQua building (SITE)')
T(g, 'tykorakuen', '小石川后乐园', 'Koishikawa Kōrakuen', 'site', 'a:w20028327', None, 'Edo-period stroll garden with the central pond and the Engetsu-kyō full-moon bridge (SITE)')
# ---- The bay: Odaiba, Toyosu, Kasai, Urayasu
g = 'bay'
T(g, 'tyrainbow', '彩虹大桥', 'Rainbow Bridge', 'bridge', 'n:35.63630,139.76370', None, 'Suspension bridge (1993): 570 m main span, two white towers 126 m high, double deck (upper Shuto Daiba Route, lower Route 482 + Yurikamome + walkways), the Shibaura loop approach; deck heights in BRIEF', r=1100)
T(g, 'tyfujitv', '台场球体大楼', 'Odaiba sphere office building', 'building', 'b:w287770734', None, 'Two lattice towers joined by sky corridors and the big titanium-clad sphere (Tange, 1997); generic form, no broadcaster logos')
T(g, 'tybigsight', '东京国际展示场', 'Tokyo Big Sight', 'building', 'a:r7743566', None, 'The conference tower of four inverted pyramids on legs and the exhibition halls around it')
T(g, 'tytoyosu', '丰洲市场', 'Toyosu Market', 'building', 'b:w629546000', None, 'The fish intermediate-wholesale hall (block 6) of the market that replaced Tsukiji in 2018; the roof garden; the other blocks nearby')
T(g, 'tygatebridge', '东京门大桥', 'Tokyo Gate Bridge', 'bridge', 'n:35.61150,139.82700', None, 'Truss-box bridge (2012) with the two "dinosaur" humps of its main span (440 m) over the Tokyo East Channel; top 87.8 m (A.P.); deck heights in BRIEF', r=1500)
T(g, 'tykasaiwheel', '钻石与花之大摩天轮', 'Diamond and Flower Ferris Wheel', 'tower', 'a:w161931777', None, 'Ferris wheel of Kasai Rinkai Park; night lights in patterns')
T(g, 'tykasai', '葛西临海公园', 'Kasai Rinkai Park', 'site', 'a:w689336469', None, 'Bayside park: lawns, the aquarium glass dome, the beaches and the bird sanctuary (SITE)')
T(g, 'tydisneyland', '东京迪士尼乐园（主题公园用地）', 'Tokyo Disneyland (theme park site)', 'site', 'a:w1282875870', None, 'SITE only: generic theme-park landscape, paths, lagoon and pavilions; no characters, no castle replica, no brand imagery, no signage')
T(g, 'tydisneysea', '东京迪士尼海洋（主题公园用地）', 'Tokyo DisneySea (theme park site)', 'site', 'a:w203538370', None, 'SITE only: generic harbour-themed landscape, water and pavilions; no volcano replica, no characters, no brand imagery')
# ---- Haneda and the outer cities
g = 'airport'
T(g, 'tyhnd1', '羽田机场第1航站楼', 'Haneda Terminal 1', 'building', 'b:w500688113', None, 'Domestic terminal (1993) with its long curved roof and piers; no airline liveries')
T(g, 'tyhnd2', '羽田机场第2航站楼', 'Haneda Terminal 2', 'building', 'b:r18910656', None, 'Domestic / international terminal (2004) east of the tower')
T(g, 'tyhnd3', '羽田机场第3航站楼', 'Haneda Terminal 3', 'building', 'b:w82592609', None, 'International terminal (2010) with the wave roof and the multi-storey car park')
T(g, 'tyhndtower', '羽田机场塔台', 'Haneda control tower', 'tower', 'b:w319515856', None, 'The tall slender control tower between Terminals 1 and 2 (h_osm given; verify)')
T(g, 'tysaitamaarena', '埼玉超级竞技场', 'Saitama Super Arena', 'building', 'b:w23876795', None, 'Arena (2000) at Saitama-Shintoshin with its movable block and the big curved roof')
T(g, 'tymakuhari', '幕张展览馆', 'Makuhari Messe', 'building', 'b:w374815914', None, 'Exhibition halls (1989, Maki Fumihiko) with the wavy roof line by the bay')
# ---- Yokohama
g = 'yokohama'
T(g, 'tylandmark', '横滨地标大厦', 'Yokohama Landmark Tower', 'tower', 'b:w64891750', 296, 'Tower (1993), 296 m, granite tapering shaft with the stepped top, over the Landmark Plaza and the old Dock Yard Garden')
T(g, 'tycosmoclock', '横滨宇宙时钟21', 'Cosmo Clock 21', 'tower', 'b:w363854124', None, 'The giant Ferris wheel of Cosmo World with a digital clock in its hub and lit spokes')
T(g, 'tyqueens', '皇后广场横滨塔A', "Queen's Tower A", 'tower', 'b:w85646024', None, "The tallest of the three stepped Queen's Square towers (A, B, C) next to the Landmark Tower")
T(g, 'typacifico', '横滨国际和平会议场', 'Pacifico Yokohama', 'building', 'b:w319351389', None, 'Convention centre with the sail-shaped InterContinental hotel and the shell-roofed national convention hall')
T(g, 'tyredbrick', '横滨红砖仓库', 'Yokohama Red Brick Warehouse', 'heritage', 'b:w72998296', None, 'The two red-brick customs warehouses (1911 / 1913) with iron balconies (model both: buildings 1 and 2)')
T(g, 'tyosanbashi', '横滨港大栈桥国际客船码头', 'Ōsanbashi Pier (Yokohama International Passenger Terminal)', 'pier', 'a:w84830302', None, 'The 2002 pier terminal (FOA): a long undulating timber and grass roof deck')
T(g, 'tymarinetower', '横滨海洋塔', 'Yokohama Marine Tower', 'tower', 'b:w319050351', None, 'Decagonal steel lattice lighthouse-tower (1961) by Yamashita Park')
T(g, 'tyhikawamaru', '冰川丸', 'Hikawa Maru', 'heritage', 'b:w130991780', None, 'The 1930 ocean liner moored as a museum ship at Yamashita Park (black hull, white superstructure, one funnel)')
T(g, 'tychinatown', '横滨中华街', 'Yokohama Chinatown', 'site', 'a:w445258887', None, 'The district with its decorated paifang gates (Zenrin-mon, Chōyō-mon, Suzaku-mon, Genbu-mon, Enpei-mon ...) and the Kanteibyō temple (SITE: gates and lanterns, no shop names)')
T(g, 'tybaybridge', '横滨港湾大桥', 'Yokohama Bay Bridge', 'bridge', 'a:w552391549', None, 'Cable-stayed bridge (1989), 460 m main span, double deck (upper Shuto Bayshore Route, lower Route 357), H-shaped towers; deck heights in BRIEF', r=900)
T(g, 'tytsubasa', '鹤见翼桥', 'Tsurumi Tsubasa Bridge', 'bridge', 'a:w1059145032', None, 'Single-tower cable-stayed bridge (1994), 510 m main span, inverted-Y tower 183 m; road 57 m above the sea (BRIEF)', r=1100)
# ---- v38: more landmarks (to 100 distinct per city); targets of v37 never built moved here
gx = 'tyx_central'
T(gx, 'tyforum', '东京国际论坛', 'Tokyo International Forum', 'building', 'b:w144508545', None, 'Rafael Viñoly 1996: the glass hall, a 207 m ship-hull-shaped atrium with a steel roof truss, beside four cubic hall blocks')
T(gx, 'tyboj', '日本银行本店', 'Bank of Japan Head Office', 'heritage', 'b:r3069611', None, 'Neo-baroque stone building (1896, Tatsuno Kingo) with a central dome; the later annexes behind')
T(gx, 'tykandamyojin', '神田明神', 'Kanda Myōjin', 'temple', 'a:w89431876', None, 'Shrine with the vermilion-and-gold concrete main hall (1934) and the Zuishinmon gate')
T(gx, 'tynikolai', '尼古拉堂', 'Holy Resurrection Cathedral (Nikolai-dō)', 'heritage', 'a:r4080936', None, 'Byzantine-style Orthodox cathedral (1891) with a green copper dome and a bell tower')
T(gx, 'tyhie', '日枝神社', 'Hie Shrine', 'temple', 'a:w509411458', None, 'Akasaka shrine on a hill: the main hall, the escalator approach and the tunnel of red torii gates')
T(gx, 'tykachidoki', '胜哄桥', 'Kachidoki Bridge', 'bridge', 'a:w549492916', None, 'Bascule bridge (1940) over the Sumida, two steel arches either side of the (now fixed) double-leaf bascule span')
T(gx, 'tyeitai', '永代桥', 'Eitai Bridge', 'bridge', 'a:w1060000228', None, 'Steel tied-arch bridge (1926) over the Sumida, painted blue')
T(gx, 'tykiyosu', '清洲桥', 'Kiyosu Bridge', 'bridge', 'a:w856821159', None, 'Self-anchored suspension bridge (1928) over the Sumida, modelled on a Cologne bridge, painted blue')
T(gx, 'tyhamarikyu', '滨离宫恩赐庭园', 'Hama-rikyū Gardens', 'site', 'a:w7836744', None, 'Edo-era garden on the bay with the tidal pond, the teahouse on its island and the bridges, framed by the Shiodome towers (site)')
T(gx, 'tyedotokyo', '江户东京博物馆', 'Edo-Tokyo Museum', 'museum', 'b:w76187056', None, 'Museum (1993, Kikutake Kiyonori): a huge box raised on four massive legs over an open plaza, shaped like an old storehouse')
T(gx, 'tykokugikan', '两国国技馆', 'Ryōgoku Kokugikan', 'stadium', 'a:w76187058', None, 'Sumo arena (1985) with the green copper hipped roof in traditional style')
gx = 'tyx_west'
T(gx, 'tycrossing', '涩谷十字路口', 'Shibuya Crossing', 'site', 'n:35.65950,139.70050', None, 'The scramble crossing in front of the Hachikō exit: zebra stripes in every direction, the big video screens on the surrounding buildings (abstract content, no ads)', r=140)
T(gx, 'tymeijijingu', '明治神宫', 'Meiji Jingū', 'site', 'a:w469908925', None, 'The shrine forest (~70 ha) with the gravel approaches, torii and the main shrine compound (cypress halls with copper roofs) (SITE)')
T(gx, 'tystadium', '国立竞技场', 'Japan National Stadium', 'site', 'a:w499552719', None, 'The 2019 stadium (Kuma Kengo): layered timber eaves around the bowl, planted terraces (model on the stadium\'s footprint inside this sports area)')
T(gx, 'tygyoen', '新宿御苑', 'Shinjuku Gyoen National Garden', 'site', 'a:w15772074', None, 'Former imperial garden: French formal, English landscape and Japanese gardens, ponds, the greenhouse (SITE)')
T(gx, 'tymetgym', '东京体育馆', 'Tokyo Metropolitan Gymnasium', 'building', 'a:w153182207', None, 'Maki Fumihiko 1990: the main arena with a helmet-like metal roof, the pool hall and the plaza')
T(gx, 'tyoperacity', '东京歌剧城', 'Tokyo Opera City Tower', 'tower', 'b:w312628595', None, 'Office tower (1996) with a stepped top over the concert hall and theatre podium')
T(gx, 'tydocomo', 'NTT都科摩代代木大厦', 'NTT Docomo Yoyogi Building', 'tower', 'b:w137189971', None, 'Tower (2000) with an Art Deco-like stepped spire and a clock near the top; no logos')
T(gx, 'tymitsui', '新宿三井大厦', 'Shinjuku Mitsui Building', 'tower', 'b:w145495565', None, 'Dark tower (1974) with an exposed steel grid facade on a sunken plaza')
T(gx, 'tykeioplaza', '京王广场大饭店', 'Keio Plaza Hotel', 'tower', 'b:w116596175', None, 'White hotel (1971, the first skyscraper of Nishi-Shinjuku) with the main tower and the south tower; no hotel names')
T(gx, 'tycamii', '东京清真寺', 'Tokyo Camii', 'temple', 'a:w155508308', None, 'Ottoman-style mosque (2000) with a central dome and a slender minaret')
T(gx, 'tyyebisu', '惠比寿花园广场', 'Yebisu Garden Place Tower', 'tower', 'b:w93182025', None, 'Ebisu complex (1994) on the old brewery: the 40-storey tower over the plaza, the château-style restaurant building; no brand names (the anchor is the Garden Place footprint: find the tower in the refs)', r=220)
gx = 'tyx_north'
T(gx, 'tynact', '国立新美术馆', 'The National Art Center, Tokyo', 'museum', 'a:w103425086', None, 'Kurokawa Kishō 2007: an undulating glass curtain wall with two inverted concrete cones inside the atrium')
T(gx, 'tysunshine60', '阳光60大厦', 'Sunshine 60', 'tower', 'b:w314155355', None, 'Ikebukuro tower (1978), once the tallest in Asia: plain rectangular shaft with the observation deck; on the Sunshine City complex')
T(gx, 'tystmary', '东京圣玛利亚主教座堂', "St. Mary's Cathedral, Tokyo", 'temple', 'a:w120704384', None, 'Tange Kenzō 1964: eight hyperbolic stainless-steel shells rising to a cross-shaped skylight, the separate 60 m bell tower')
T(gx, 'tywesternart', '国立西洋美术馆', 'The National Museum of Western Art', 'museum', 'a:w203960903', None, 'Le Corbusier 1959 (World Heritage): a square box on pilotis with the later wings, in Ueno Park')
T(gx, 'tytoshogu', '上野东照宫', 'Ueno Tōshō-gū', 'temple', 'b:w145344085', None, 'Shrine (1651) with the gilded Karamon gate and main hall, the stone lantern avenue and the five-storey pagoda nearby')
T(gx, 'tykiyomizu', '清水观音堂', 'Kiyomizu Kannon-dō', 'temple', 'b:w138585452', None, 'Ueno temple (1631) on a wooden stage over the slope, modelled on Kyoto\'s Kiyomizu-dera; the "moon pine" in front')
T(gx, 'tytakanawa', '高轮Gateway站', 'Takanawa Gateway Station', 'station', 'n:35.6355,139.7404', None, 'JR station (2020, Kuma Kengo): a big white origami-like membrane roof on a timber and steel frame over the tracks; find its footprint in the refs')
T(gx, 'tyyokostadium', '横滨球场', 'Yokohama Stadium', 'stadium', 'b:r2958080', None, 'Baseball stadium (1978) in Yokohama Park with its steep stands and the light towers')
T(gx, 'tysankeien', '三溪园三重塔', 'Sankei-en Three-storied Pagoda', 'heritage', 'b:w95639574', None, 'The 1457 pagoda of the former Tōmyō-ji, moved to Sankei-en garden in Yokohama, on its hill above the pond')
# ---------------- resolve against this build's OSM data ----------------
if __name__ == '__main__':
    import shapely.wkb
    from shapely.geometry import Polygon
    Z = np.load(OUT + 'bld_raw.npz'); XY = Z['XY']; RS = Z['RS']; BR = Z['BR']; OID = Z['OID']; FW = Z['FW']; TI = Z['TI']
    TG = load('bld_tags.pkl'); tags = TG['tags']
    bidx = {('w' if f else 'r') + str(o): k for k, (o, f) in enumerate(zip(OID.tolist(), FW.tolist()))}
    AR = {('w' if fw else 'r') + str(oid): (t, wk) for oid, fw, t, wk in pickle.load(open(OUT + 'raw_areas.pkl', 'rb'))}
    A = np.load(OUT + 'bldA.npz'); acx = A['cx']; acy = A['cy']; ah = A['h']; aoid = A['oid']; afw = A['fw']; apart = A['part']
    def ring(k):
        rs = RS[BR[k]]; re_ = RS[BR[k] + 1]; return Polygon(XY[rs:re_].astype(np.float64)).buffer(0)
    out = {'note':'Tokyo landmark and site targets for City Brush v37 (see tyo/BRIEF.md). lat/lon = the centroid of the named OSM footprint '
           '(osm = its id: w way, r relation; n: = a point given here for bridges / crossings). h = known overall height where certain (m), '
           'h_osm = the OSM height / levels value of the footprint, h_app = the height this build gives it; r = suggested model radius (m). '
           'For areas, tallest = the tallest building of this build inside it. Names: zh Simplified, en English.', 'groups':{}}
    n = 0
    for grp, L in G.items():
        out['groups'][grp] = []
        for d in L:
            kind_, ref = d['src'].split(':', 1); e = {k: d[k] for k in ('key', 'zh', 'en', 'kind', 'h', 'notes')}
            if kind_ == 'b':
                assert ref in bidx, (d['key'], d['src'])
                k = bidx[ref]; g = ring(k); t = tags[TI[k]] if TI[k] >= 0 else {}
            elif kind_ == 'a':
                assert ref in AR or ref in bidx, (d['key'], d['src'])
                if ref in AR: t, wk = AR[ref]; g = proj(shapely.wkb.loads(wk)).buffer(0)
                else: k = bidx[ref]; g = ring(k); t = tags[TI[k]] if TI[k] >= 0 else {}
            if kind_ in ('b', 'a'):
                c = g.centroid; lon, lat = ll(c.x, c.y)
                e.update(lat=round(lat, 6), lon=round(lon, 6), osm=ref, area_m2=round(g.area))
                e['h_osm'] = t.get('height') or (('%s levels' % t['building:levels']) if t.get('building:levels') else None)
                x0, y0, x1, y1 = g.bounds
                m = np.nonzero((acx > x0) & (acx < x1) & (acy > y0) & (acy < y1) & ~apart)[0]
                from shapely.geometry import Point
                m = [j for j in m if g.contains(Point(float(acx[j]), float(acy[j])))]
                if m:
                    j = max(m, key=lambda j: ah[j]); jid = ('w' if afw[j] else 'r') + str(aoid[j])
                    if jid == ref: e['h_app'] = round(float(ah[j]), 1)
                    elif kind_ == 'a' and d['kind'] not in ('bridge', 'pier'):
                        blon, blat = ll(float(acx[j]), float(acy[j])); e['tallest'] = {'osm':jid, 'h':round(float(ah[j]), 1), 'lat':round(blat, 6), 'lon':round(blon, 6)}
                ext = max(math.hypot(x - c.x, y - c.y) for x, y in (g.exterior.coords if g.geom_type == 'Polygon' else [q for p in g.geoms for q in p.exterior.coords]))
                e['r'] = d['r'] or int(min(1600, max(30, ext*1.05 if d['kind'] in ('bridge', 'site') else min(ext*1.05, math.sqrt(g.area/math.pi)*1.8))))
            else:
                lat, lon = map(float, ref.split(',')); e.update(lat=lat, lon=lon, osm=None, r=d['r'] or 300)
            out['groups'][grp].append(e); n += 1
    keys = [e['key'] for L in out['groups'].values() for e in L]; assert len(keys) == len(set(keys)), 'duplicate keys'
    os_ = __import__('os'); os_.makedirs(ROOT + 'tyo', exist_ok=True)
    json.dump(out, open(ROOT + 'tyo/targets.json', 'w'), ensure_ascii=False, indent=1)
    print('targets', n, {g: len(v) for g, v in out['groups'].items()})
    for g_, L in out['groups'].items():
        for e in L: print('%-11s %-16s %9.5f %10.5f r %4d h %s osm-h %s app-h %s %s' % (g_, e['key'], e['lat'], e['lon'], e['r'], e['h'], e.get('h_osm'), e.get('h_app'), ('tallest %s %.0f m' % (e['tallest']['osm'], e['tallest']['h'])) if e.get('tallest') else ''))
