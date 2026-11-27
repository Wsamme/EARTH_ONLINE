# lm50 Shenzhen — modeller brief, city part (Greater Bay page)

Read `R/lm50/BRIEF.md` (the round), `R/lm40/BRIEF.md` (the model contract, quality bar, budgets, rules), `R/gba/BRIEF.md` and
`R/gba/BRIEF_V41.md` (Greater Bay conventions: frame, base height, hiding real buildings, bridges, Shenzhen night) first; this file
adds what is specific to the lm50 Shenzhen groups. `R = /home/claude/earth_online/src`, `SC = /tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad`,
`K = R/lm50/sz50kit`, `H = SC/lm33/kit/heavy.sh`, `B = SC/lm33/kit/browser.sh`.

## Targets, groups, refs
- `R/lm50/targets_sz.json` — 212 rows (8 groups, 25-27 each, 4 heroes each): `key zh en kind lat lon r osm h hs note unc hero group`
  plus `osm_name` (the OSM name of the footprint), `area_m2` and `h_app` (the tallest app building on the footprint today).
  lat / lon = centroid of the OSM footprint `osm`; `r` = the footprint's radius + 5 m (a suggestion: set your own `r`).
  `h` is verified only where `hs` gives a source: 127 towers carry the CTBUH Skyscraper Center architectural height (record id and URL in
  `hs`); civic / heritage rows have `h: null` (not verified: judge from photos, say it is an estimate). `note` is a recognition hint,
  not a spec. Every key is a real structure **not yet on the Greater Bay page**: checked by evaluating every module the build loads
  (`R/gba/*/*.js` and `R/gbareal/app/hklm/*.js`, 328 placements + 57 sites) — no target footprint touches an existing landmark hull
  (vertices below 25 m, +3 m) or site keep polygon, and no two targets share or touch a footprint.
- `R/lm50/ref_<group>.json` — the refs, format of `R/gba/ref_*.json` (gbareal/targets/refs.py) plus `meta` (the target row) and
  `areas` (as lm40): per key `anchor radius sel ground terrain buildings roads areas pois`, local metres around the anchor (+x east,
  +z south), box = 1.6 r (120-1600 m; big sites: footprint + 200 m).
  **Made from the app's own data**: `gbareal/out` (what refs.py reads) no longer exists on this machine, so `K/tools/refs_sz.py`
  decodes the staged page data (`site/gbadata`, 22 Nov build: base, bld0-2, the 228 road chunks) and takes OSM ids / names / levels,
  land-use areas and POIs from OSM (Overpass, 27 Nov). `buildings[]`: `ring` (+ `holes`), `h` (the app's height), `base`, `type`,
  `area`, `centroid`, `parts` (the app's building:part pieces on it, base / top), `target: true` on the app footprints lying on the
  target's own OSM footprint (`meta.osm`: what your model replaces), and when an OSM outline fits it (best intersection-over-union)
  `osm`, `name`, `zh`, `floors`, `h_osm`. `roads[]`: `cls`, `name`, `bridge`, `pts`, `elev` (deck height above ground per vertex; the app data has no OSM
  `layer`). The app has far more footprints than OSM (481 986 app footprints in the box round Shenzhen vs 82 210 OSM buildings in Shenzhen
  in the October count: other footprint sources, no names / heights): those have no `osm`. Towers are sometimes several app pieces on one OSM outline (e.g. szpafcs: 4 pieces 196-289 m); the app hides all pieces under
  your hull.
- Command that made them (27 Nov): `cd $K/tools && python3 osmbox.py ../../targets_sz.json && bash $H python3 refs_sz.py`
  (OSM boxes cached in `SC/lm50/sz/osmbox/`; ~1 min of work under the heavy lock).
- Re-anchored refs for one key (if your anchor moves): `cd $K/tools && bash $H python3 refs_sz.py --reref sz50x_1 <key> <lat> <lon> <radius>`
  → `R/lm50/ref_sz50x_1.json` (fetches its own OSM box; ~1 min + the lock wait).
- Tools that made the targets (for the coordinator): `K/tools/` (cands_sz.py = the curated list, mktargets.py, match.py = CTBUH↔OSM,
  inv.js = inventory of existing models, osmgeom.py / osmbox.py = Overpass, stage.py + szcut.py = decoder of site/gbadata →
  `SC/lm50/sz/stage_sz.pkl`). Data stays in `SC/lm50/sz/` (stage_sz.pkl 126 MB, osmbox/ and web/ caches).

## Your module and how the build takes it
- Folder / file: **`R/gba/sz50x/sz50x.js`** (x = a … h), one `{ … }` block: `LANDMARKS.<key> = {...}` + `SG_PLACES.push({type, lat, lon, rot})`,
  sites via `Object.assign(SITES, {...})`. Keys exactly as in targets_sz.json; `cat:'new'` / `'old'`.
- The Greater Bay build (`gbareal/tools/patch17_gba.py`, CITY=gba; run through `SC/gbabuild/build.sh`, which copies `R/gbareal` and
  `R/gba` into `SC/gbabuild/src`) **globs `gba/*/*.js` and keeps a file only if its name equals its folder name**, sorted by folder
  name — so `R/gba/sz50a/sz50a.js` is picked up with no list to edit, and loads *before* the older `gba/sz*` groups (`'sz50a' < 'szbaoan'`).
  `GBALM=a,b` limits the gba folders (the Hong Kong copies `gbareal/app/hklm/*.js` always load). Never write `site/gba.html`; the
  coordinator builds the release page.
- Frame: place by lat / lon only. The Greater Bay origin (lon0 114.052048203, lat0 22.656070182) and metres per degree are unchanged
  by the lm50 Guangzhou extension (the other agent's `SC/lm50/gz/gbareal/common.py`: same origin, the square grows to HALF 147 km, 100 m
  cells); don't use HALF, tiles or cell sizes in your module. Your refs come from the current page data (built 22 Nov); after the
  Guangzhou rebuild the terrain grid and the estimated heights of real buildings may differ a little.
- Base height, hiding, bridges, night lighting, no logos / text: as `R/gba/BRIEF.md`. Traffic drives on the right in Shenzhen.

## Kit — commands (each run once for this brief on 27 Nov; existing group szcbd stood in for a sz50 module)
Offline, as often as you like (no browser; ~0.1-10 s):
```
cd $K
node near.js <lat> <lon> [r=600] [../../gba/sz50x/sz50x.js]      # existing models near a point: landmark hulls (INSIDE / distance) and site keeps
node nstat.js ../../gba/sz50x/sz50x.js [key1,key2]                # tris, calls, mats, ms, rmax, y range, last SG_PLACES entry
node ndump.js ../../gba/sz50x/sz50x.js <key> ../../gba/sz50x/tmp/<key>.bin && \
  python3 nrender.py ../../gba/sz50x/tmp/<key>.bin ../../gba/sz50x/tmp/<key>.png 0 <h/2> 0 <dist> 20 200 400 400   # shaded preview (model coords)
python3 oplan.py ../../gba/sz50x/sz50x.js <key> ../ref_sz50x.json [<refkey>] ../../gba/sz50x/tmp/<key>_plan.png [half m]   # plan vs real footprints
#   prints hidden real buildings, CLASHES (kept buildings your lower 4 m overlaps), the offset to the target footprint (the app pieces
#   flagged target in the refs); PNG: grey kept, red hidden, orange clash, blue hull, green model below 4 m, red outline = target
```
(tested: `node nstat.js ../../gba/szcbd/szcbd.js szneo,szdabaihui`, `node ndump.js … szneo` + `nrender.py`, `node near.js 22.5384 114.0226 600`,
`python3 oplan.py ../../gba/szcbd/szcbd.js szneo <reref of szneo> out.png`). The offline kit is `R/lm50/ty50kit` adapted: the builder
helpers come from the page template the Greater Bay build uses (`SC/gbabuild/src/city-brush-v16.html`, 14 Nov snapshot), three.js r128,
flat ground; `near.js` / `hulls.js` evaluate `R/gba/*/*.js` + `gbareal/app/hklm/_pre.js` + `hklm/*.js` (6 Hong Kong landmarks fail to
build offline — material colour helper — none of them in Shenzhen). Look at every PNG with the Read tool.

Browser (at most 2 runs per group; through the browser lock, detached, poll the log):
```
cd $K && bash $H bash mkpage_sz.sh sz50x sz50x          # in-situ page: only your group + the Hong Kong copies -> SC/lm50/sz/site/t_sz50x.html (~2 s)
(cd $K && NEAR=<lat>,<lon> setsid nohup bash $B node appshot_sz.js t_sz50x.html $R/gba/sz50x/shots/app1 \
  '[["<key>_d",lat,lon,500,30,200,13,"",8000],["<key>_n",lat,lon,500,30,200,20.5,"",8000]]' > $R/gba/sz50x/app1.log 2>&1 &)
```
Views `[name, lat, lon, distance m, elevation °, azimuth ° (0 = camera south looking north), hour (20.5 = night), "optional JS", waitMs]`.
The log prints readiness, per-view calls / tris, landmark label count, heap, every failed request (FAILED-URLS) and PAGEERR.
Pass = 0 PAGEERR and only the expected failures: 404 + ERR_ABORTED for the city-switch probes `/sg.html /bay.html /nyc.html
/hk.html /tyo.html /index.html` and 404 `/favicon.ico` (13 lines, and 11 matching "Failed to load resource" console errors). Tested run (27 Nov,
GBALM=szcbd page, NEAR=22.5384,114.0226, 2 views): ready in 48 s, 0 PAGEERR, 198 labels, heap 1555 MB, ~2.0 M tris day / 3.8 M night.
Tiles are still streaming at the default wait ("Building the real city 35/2602" in the shot): give `waitMs` 6000-10000 for the views you judge. For the full-app check build `mkpage_sz.sh sz50x_all all` instead (every
module). Delete the page afterwards (`rm $SC/lm50/sz/site/t_sz50x*.html`, ~7-9 MB); keep shots small and `tmp/` out of the module.
The old Greater Bay in-situ harness `R/gbareal/targets/kit` does **not** run any more (it needs `gbareal/out/*.bin.gz`,
`hkreal/kit/engine_helpers.js` + `lmbase.js` and chromium-1194, all gone): use the test page above; the offline `oplan.py` replaces its
plan overlay.

## Groups

### sz50a — Futian CBD (Shennan to Fuhua, Xinzhou Rd to Huanggang Rd) (27 keys)

Module `R/gba/sz50a/sz50a.js`, refs `R/lm50/ref_sz50a.json`. Existing neighbours: szdabaihui, szexcellence, szenergy, szcec, szgangxia (gba/szcbd); hkpingan (gba/szcbd upgrade of hklm/shenzhen.js); hkszse (hklm/hkx_nt.js); szlibrary, szmocape (gba/szcivic). Closest: szcentralcon 97 m and szwongtee 113 m from szdabaihui; sztaiping / szbosera / szccb / szcmbsz 163-184 m from hkszse.

| key | name | kind | h (m) | footprint | note |
|---|---|---|---|---|---|
| ★szpafcs | Ping An Finance Center South / 平安金融中心南塔 | tower | 285.95 | w773719240 (2456 m²) | the 51-storey sister tower just south of Ping An Finance Center on Yitian Road |
| ★szsmgtower | Shenzhen Media Group Tower / 广电金融中心 | tower | 232.4 | w776182836 (2822 m²) | office tower on Pengcheng 1st Road at the west edge of the CBD |
| ★sztaiping | Taiping Finance Tower / 深圳太平金融大厦 | tower | 228 | w269895573 (2877 m²) | China Taiping headquarters on Yitian Road north of Fuhua Road |
| ★szwongtee | Wongtee Plaza / 皇庭中心 | tower | 253.55 | w612997285 (6933 m²) | office tower on Fuhua Road (CTBUH address), north of the Convention Center |
| szanlian | Anlian Tower / 安联大厦 | tower | 162 | w270044025 (2637 m²) | office tower on Jintian Road, CBD north-east |
| szbosera | Southern Bosera Building / 南方博时基金大厦 | tower | 208 | w529086137 (2247 m²) | fund-company tower on Yitian Road, CBD north |
| szbroadcast | Shenzhen Broadcasting Center / 深圳邮电信息枢纽中心大厦 | tower | 240.65 | w269950857 (1988 m²) | office tower on Fuhua Road (aka Shenzhen Telecommunication Centre in CTBUH) |
| szccb | China Construction Bank Building / 深圳建设银行大厦 | tower | 230 | w529086138 (2625 m²) | bank tower on Fuzhong 3rd Road, CBD north-west |
| szcentralcon | Centralcon Group Tower / 中洲大厦 | tower | 200 | w270044910 (2551 m²) | office tower on Jintian Road |
| szcgn | China Guangdong Nuclear Power South Tower / 中广核大厦南楼 | tower | 177 | w270044015 (2893 m²) | office tower on Shennan Avenue, CBD east |
| szchinalife | China Life Tower / 深圳中国人寿大厦 | tower | 165 | w617224818 (1875 m²) | office tower at the west edge of the CBD on Shennan Avenue |
| szcmbsz | China Merchants Bank Shenzhen Branch Building / 招商银行深圳分行大厦 | tower | 178.85 | w529086139 (6481 m²) | bank tower on Fuzhong 3rd Road, CBD north-west |
| szcmobile | China Mobile Building / 中国移动深圳信息大厦 | tower | 177 | w925221214 (3668 m²) | telecom office tower on Jintian Road |
| szessence | Essence Financial Securities Headquarters / 安信金融大厦 | tower | 193.5 | w612997283 (1966 m²) | office tower on Jintian Road, CBD west |
| szgalaxycentury | Galaxy Century Building A / 星河世纪大厦 | tower | 170 | w345406920 (1589 m²) | office tower on Caitian Road / Shennan Avenue, east of the CBD |
| szgoldenland | Golden Land Center / 金地中心 | tower | 168.9 | w776141685 (2388 m²) | office tower on Jintian Road |
| szguosen | Guosen Securities Tower / 国信金融大厦 | tower | 228 | w612997276 (1954 m²) | office tower on Mintian Road, CBD west |
| szguoyin | Guoyin Minsheng Financial Building / 国银金融中心大厦 | tower | 159.7 | w545448764 (1890 m²) | office tower at Fuzhong Road, CBD north-east |
| szhansen | Hansen Mansion / 瀚森大厦 | tower | 150.5 | w776898831 (1559 m²) | office tower south of the CBD |
| szicc | International Chamber of Commerce Tower / 荣超国际商会中心 | tower | 215.95 | w241491633 (4773 m²) | office tower on Yitian Road, CBD south-west |
| szlihe | Lihe Tower (Dinghe Tower) / 深圳鼎和大厦 | tower | 230.86 | w270044919 (5401 m²) | office tower on Jintian Road |
| szmarcopolo | Marco Polo Shenzhen (Temasek Tower) / 特美思大厦 | tower | 159.3 | w241116492 (5403 m²) | hotel tower at the west edge of the CBD |
| sznoble | Noble Tower / 诺德中心 | tower | 193.2 | w160902163 (2211 m²) | office tower at Fuzhong 3rd Road and Jintian Road |
| szpapc | Ping An Property & Casualty Insurance Tower / 平安财险大厦 | tower | 208.5 | w1253254379 (2108 m²) | office tower on Yitian Road next to Ping An Finance Center |
| szrongchaoa | Rongchao Tower A / 荣超中心A座 | tower | 193 | w269895565 (1909 m²) | office tower on Yitian Road, CBD north |
| szrongchaob | Rongchao Commercial Center Block B / 荣超中心B座 | tower | 141 | w304053218 (1286 m²) | second tower of the Rongchao Center on Yitian Road |
| szrongchaoetc | Rongchao Economic Trade Center (Landmark) / 荣超经贸中心 | tower | 206 | w270044916 (3613 m²) | office tower on Jintian Road, CBD north-east |

### sz50b — Futian south and west: Free Trade Zone, Huanggang, Shixia, Shazui, Chegongmiao, Xiangmihu (25 keys)

Module `R/gba/sz50b/sz50b.js`, refs `R/lm50/ref_sz50b.json`. Existing neighbours: szneo (200 m from szcktower), szcmbtower (205 m) (gba/szcbd).

| key | name | kind | h (m) | footprint | note |
|---|---|---|---|---|---|
| ★szcfc | Shenzhen CFC Changfu Centre / 长富中心 | tower | 304.3 | w875261266 (2083 m²) | the 304 m tower of the Futian Free Trade Zone by the Shenzhen River |
| ★szcfuturea | C Future City Block A / 中洲湾1栋A座 | tower | 295.95 | w1238125149 (1996 m²) | the west twin of Centralcon's Zhongzhou Bay towers on Binhe Avenue at Shangsha |
| ★szepca | East Pacific Center Tower A / 东海国际公寓A座 | tower | 306 | w545225939 (1676 m²) | 306 m, 85-floor residential tower (CTBUH aka EPI Residences Tower A), the tallest of the East Pacific Center group |
| ★szriverfront | Riverfront Times Square / 京基滨河时代广场 | tower | 293 | w349913546 (2566 m²) | Kingkey supertall on Binhe Avenue at Xiasha |
| szbojina | Bojin Business Plaza Tower 1 / 博今商务广场1 | tower | 260.9 | w450057891 (2409 m²) | office tower on Tairan 8th Road, Chegongmiao |
| szbojinb | Bojin Business Plaza Tower 2 / 博今商务广场2 | tower | 201.7 | w1305286512 (1723 m²) | second tower of Bojin Business Plaza |
| szcfutureb | C Future City Block B / 中洲湾1栋B座 | tower | 290.75 | w1238125150 (1996 m²) | the east twin of the Zhongzhou Bay towers |
| szcktower | Shenzhen Metro Che Kung Temple Hub Tower / 深铁置业大厦 | tower | 268.8 | w1163682854 (3556 m²) | the tower over the Chegongmiao metro hub at Shennan Avenue and Xiangmihu Road |
| szcoastal | Coastal Center / 深圳海岸中心 | tower | 225 | w1265298848 (1951 m²) | office tower at 24 Futian Road |
| szepcb | East Pacific Center Tower B / 东海国际公寓B座 | tower | 261 | w545225940 (1778 m²) | second residential tower of the East Pacific Center group (the app's 261 m footprint; OSM height tag 283.6 is not the CTBUH height) |
| szepcc | East Pacific Center Tower C (The Langham) / 东海朗廷酒店 | tower | 206 | w545225936 (1817 m²) | hotel tower of the East Pacific Center group |
| szexchange | Shenzhen International Exchange Center / 深圳国际交流中心 | civic | — | w1080860977 (135836 m²) | conference centre by Xiangmi Lake |
| szftculture | Futian Culture Square / 福田区文化广场 | civic | — | w779037738 (2269 m²) | district cultural centre building |
| szgreenviewa | Greenview Hongshuwan Yihao Tower A / 绿景红树湾壹号A栋 | tower | 180 | w1431618942 (1897 m²) | residential tower by the Shenzhen Bay shore at Shazui |
| szguotong | Guotong Building / 国通大厦 | tower | 201 | w1431605019 (1436 m²) | 1997 tower on Binhe Road (aka Shenzhen Radio Tower) |
| szhongsheng | Hongsheng Temple / 洪圣古庙 | temple | — | w1431618935 (1397 m²) | Hung Shing temple (OSM historic=temple) in Shazui |
| szhouwang | Hau Wong Temple (Xiasha) / 侯王庙 | temple | — | w1305597260 (431 m²) | small village temple next to the Huang Siming hall |
| szhuangsiming | Huang Siming Ancestral Hall / 黄思铭公世祠 | temple | — | w349913644 (118 m²) | ancestral hall of the Huang clan in Shazui / Xiasha |
| szshixiatower | Shixia Watchtower / 石厦碉楼 | heritage | — | w684241533 (24 m²) | old village watchtower kept among the Shixia towers **⚠ footprint not in the app's building data (small OSM outline or open ground): the model adds it** |
| szstanthony | St. Anthony's Catholic Church / 圣安多尼教堂 | church | — | w270299560 (1327 m²) | Catholic church in western Futian |
| szwaltonheights | Walton Heights (Four Points by Sheraton) / 深圳福朋喜来登酒店 | tower | 199 | w135961007 (1673 m²) | hotel tower on Guihua Road in the Futian Free Trade Zone |
| szwaltonmansion | Walton Mansion / 加福华尔登府邸 | tower | 239 | w875238056 (886 m²) | residential tower at Jintian Road and Fuqiang Road near Huanggang |
| szxintian | Xintian CBC Tower A / 新天世纪商务中心A座 | tower | 180 | w684241536 (2422 m²) | office tower on Shixia Street |
| szyanghou | Shixia Yanghou Temple / 石厦杨侯宫 | temple | — | w1040162371 (342 m²) | village temple in Shixia |
| szziyuanyuan | Ziyuanyuan Tower / 紫元元大厦 | tower | 210 | w1252773733 (1015 m²) | office tower on Binhe Avenue |

### sz50c — Futian north and east: Lianhua north, Meilin, Bagualing / Shangbu sports district, Huaqiang South (25 keys)

Module `R/gba/sz50c/sz50c.js`, refs `R/lm50/ref_sz50c.json`. Existing neighbours: szseg (gba/szluohu, 144 m from szelecst), szhuaqiangbei site (gba/szluohu), szlibrary / szmocape / szconcerthall / szchildpalace (gba/szcivic, 155-249 m from szjiangsu / szsinolife), szgangxia (gba/szcbd), szcentralpark / szlianhuashan sites (keep polygons do not reach any target).

| key | name | kind | h (m) | footprint | note |
|---|---|---|---|---|---|
| ★szguanshanyue | Guan Shanyue Art Museum / 关山月美术馆 | museum | — | w170144292 (4576 m²) | art museum at the foot of Lianhua Mountain on Hongli Road |
| ★szgym | Shenzhen Gymnasium / 深圳体育馆 | stadium | — | w927162338 (19790 m²) | the arena next to Shenzhen Stadium |
| ★szhonkwok | Hon Kwok City Center / 汉国城市商业中心 | tower | 329.4 | w617463314 (1932 m²) | 329 m tower on Shennan Middle Road east of Central Park |
| ★szstadium | Shenzhen Stadium / 深圳体育场 | stadium | — | w284814238 (42575 m²) | stadium in Futian's sports district on Sungang West Road (OSM address) |
| szarchives | Shenzhen Archives Center / 深圳档案中心 | civic | — | w945992133 (15776 m²) | municipal archives building |
| szartacademy | Shenzhen Art Academy / 深圳画院 | museum | — | w1432667121 (1775 m²) | painting academy and gallery |
| szaviccenter | AVIC Center Office Tower / 中航中心 | tower | 216.4 | w616351250 (2100 m²) | office tower on Huafu Road |
| szavicplaza | Shenzhen AVIC Plaza / 深圳中航广场 | tower | 254 | w616351219 (2486 m²) | office tower on Shennan Road in the AVIC (Huaqiang South) zone |
| szchristian | Shenzhen Christian Church / 基督教深圳堂 | church | — | w181707725 (1906 m²) | Protestant church in Meilin |
| szciticintl | CITIC International Building / 中信国际大厦 | tower | 258 | w1252231013 (2860 m²) | office tower on Songling Road east of Huaqiangbei |
| szculturectr | Shenzhen Cultural Center / 深圳市文化馆 | civic | — | w706872174 (2702 m²) | municipal cultural centre |
| szelecst | Electronics Science & Technology Building / 电子科技大厦 | tower | 181 | w476254579 (6279 m²) | 2000 tower on Shennan Middle Road at Huaqiang South |
| szgcifc | Great China IFC Block A / 大中华IFC-A座 | tower | 180 | w345409514 (1876 m²) | office tower on Shennan Avenue east of the CBD |
| szintlst | Shenzhen International Science and Technology Building / 国际科技大厦 | tower | 182 | w665895624 (1711 m²) | 1997 tower on Shennan Middle Road |
| szjiangsu | Jiangsu Mansion (First Tower) / 江苏大厦 | tower | 208 | w617162830 (1854 m²) | 2001 tower on Yitian Road north of Shennan Avenue |
| szmartyrs | Shenzhen Revolutionary Martyrs Memorial Hall / 革命烈士纪念馆 | monument | — | w641794202 (1170 m²) | memorial hall; the city's revolutionary martyrs monument (OSM n3888037644) stands next to it |
| szmosque | Shenzhen Mosque / 深圳清真寺 | mosque | — | w461689681 (2027 m²) | the city mosque in Shangmeilin |
| szopera | Shenzhen Opera and Dance Theatre / 深圳歌剧舞剧院 | theatre | — | w1243207424 (1459 m²) | theatre building |
| szsciencehall | Shenzhen Science Hall / 深圳科学馆 | museum | — | w257397881 (7705 m²) | old science hall on Shangbu **⚠ OSM area is tagged building=no: find the hall footprint inside it** |
| szshooting | Shenzhen Shooting Hall / 深圳射击馆 | stadium | — | w1571277359 (4624 m²) | shooting hall of the Shenzhen Stadium sports area |
| szsinolife | Sino Life Insurance Building / 生命保险大厦 | tower | 219 | w617162834 (4718 m²) | office tower on Fuzhong Road north of the Civic Center |
| szswim | Shenzhen Swimming and Diving Hall / 深圳游泳跳水馆 | stadium | — | w285027814 (12889 m²) | aquatics hall of the Shenzhen Stadium sports area |
| szwenbo | Wenbo Tower / 文博大厦 | tower | 208 | w779037722 (2168 m²) | office tower on Lianhua Road |
| szworldtrade | World Trade Plaza / 世界贸易广场 | tower | 170 | w665895626 (3250 m²) | office tower on Shennan Middle Road |
| szyouthctr | Shenzhen Adolescent Activity Center / 深圳市青少年活动中心 | civic | — | w771863437 (21541 m²) | youth activity centre |

### sz50d — Luohu: Caiwuwei, Renmin South, Hubei, Sungang, Buxin, Shuibei, Liantang / Wenjindu ports (27 keys)

Module `R/gba/sz50d/sz50d.js`, refs `R/lm50/ref_sz50d.json`. Existing neighbours: szdiwang + szdiwang_b (gba/szluohu: 158 m from szopenuniv, 168 m from szcrbuilding), szguomao, szgrandtheatre, szstation, szdongmen site (gba/szluohu), hkkingkey (298 m).

| key | name | kind | h (m) | footprint | note |
|---|---|---|---|---|---|
| ★szgdhcity | GDH City Tower 1 / 粤海置地大厦 | tower | 303.1 | w1215835804 (2588 m²) | 303 m landmark tower of the former Kingway brewery redevelopment (CTBUH), Tai Bai Road, Luohu |
| ★szhuaxun | Huaxun Center (ECCOM Center) / 华讯中心 | tower | 286 | w1413961365 (1866 m²) | 286 m tower off Honggui Road |
| ★szsdb | Shenzhen Development Bank Building / 深圳发展银行大厦 | tower | 183.62 | w243511449 (3422 m²) | 1996 bank tower on Shennan Middle Road at Hongling Road (now Ping An Bank Building) |
| ★szuctower | Shenzhen Urban Construction Tower / 深圳城建云启大厦 | tower | 333 | w1207071444 (1634 m²) | 333 m tower on Hongling Middle Road, the tallest in Luohu after KK100 |
| szartmuseumold | Shenzhen Art Museum (Donghu Park building) / 深圳美术馆 | museum | — | w371598154 (1226 m²) | the original art museum building in Donghu Park |
| szcrbuilding | China Resources Building (Luohu) / 华润大厦 | tower | 132 | w243511447 (2092 m²) | China Resources tower on Shennan East Road |
| szfishermen | Yumin Village History Exhibition Hall / 渔民村村史展览馆 | museum | — | w1251643010 (199 m²) | village history hall of Yumin Village by the Shenzhen River |
| szgcwfc | Greater China World Financial Center Tower 1 / 大中华环球金融中心 | tower | 208.2 | w1449609597 (1753 m²) | office tower on Luohu Station Road |
| szgrandhyatt | Grand Hyatt Shenzhen / 深圳君悦酒店 | tower | 194.7 | w243511445 (2486 m²) | hotel tower on Bao'an South Road |
| szhungcheung | Hung Cheung Plaza / 鸿昌广场 | tower | 218 | w239698281 (4882 m²) | 2004 tower on Shennan East Road |
| szjinpifang | Jinpifang (former Kingway brewery) / 金啤坊 | civic | — | w1131928377 (11668 m²) | arts centre (OSM) next to GDH City, on the former Kingway brewery site |
| szkerry1 | Shenzhen Kerry Centre (Luohu) / 深圳嘉里中心 | tower | 170 | w525263930 (3162 m²) | 1997 office tower on Renmin South Road |
| szliantang | Liantang Port Passenger Inspection Building / 莲塘口岸旅检大楼 | port | — | w740789574 (8476 m²) | border crossing building of the Liantang port (to Heung Yuen Wai, Hong Kong) |
| szluohugym | Luohu Gymnasium / 罗湖体育馆 | stadium | — | w173111511 (6694 m²) | district arena of the Luohu sports centre |
| szluohuswim | Luohu Natatorium / 罗湖游泳馆 | stadium | — | w173111504 (1407 m²) | swimming hall of the Luohu sports centre |
| szopenuniv | Shenzhen Open University / 深圳开放大学 | campus | — | w979927783 (12478 m²) | university building in central Luohu |
| szshanglong | Shanglong Building (Luohu Business Center) / 罗湖商务中心大厦 | tower | 228 | w239698251 (1447 m²) | 2004 tower on Shennan East Road |
| szshencheng | Shencheng Investment Center / 深城投中心 | tower | 170 | w1431913854 (1298 m²) | office tower on Binhe Road |
| szshenfang | Shen Fang Plaza / 深房广场 | tower | 173 | w389143924 (4272 m²) | 1996 tower on Renmin South Road |
| szshenye | Shen Ye Center / 深业中心 | tower | 155 | w243511450 (3190 m²) | office tower on Shennan Middle Road |
| szshuibeiintl | Shuibei International Center / 水贝国际中心 | tower | 197.5 | w1241339586 (4071 m²) | tower in the Shuibei jewellery district |
| szsinolink | Sinolink Building / 百仕达大厦 | tower | 167.2 | w647417426 (1214 m²) | tower at Cuizhu / Taining |
| sztrainmuseum | Three Express Trains Museum / 三趟快车博物馆 | museum | — | w1471803525 (1550 m²) | museum named after the "three express trains" (三趟快车) |
| szwanfo | Wan Fo Temple / 万佛禅寺 | temple | — | w1552795954 (8862 m²) | Buddhist temple in eastern Luohu |
| szwenjindu | Wenjindu Port Joint Inspection Building / 文锦渡口岸联检大楼 | port | — | w274729236 (5664 m²) | border control building of the Man Kam To crossing |
| szwfc | World Finance Center Tower A / 世界金融中心A座 | tower | 222.38 | w665904247 (1522 m²) | 2003 tower on Shennan East Road |
| szyanlord | Shenzhen Yanlord Reverie Plaza / 深圳仁恒遐想广场 | tower | 198 | w1418232313 (1143 m²) | office tower on Wenjin South Road |

### sz50e — Nanshan Houhai, Shenzhen Bay and the Science Park (27 keys)

Module `R/gba/sz50e/sz50e.js`, refs `R/lm50/ref_sz50e.json`. Existing neighbours: szhanking, sztencent, szbayinno, szonebay, hkcrtower (gba/szhouhai), szszu and sztalentpark sites (gba/szhouhai), hkszbaysports (hklm/hkx_nt.js).

| key | name | kind | h (m) | footprint | note |
|---|---|---|---|---|---|
| ★szcapitalplaza | Shenzhen Capital Plaza / 红土创新广场 | tower | 261.3 | w1190833384 (1948 m²) | Shenzhen Capital Group tower at Houhai |
| ★szchuneng | China Chuneng Tower / 中国储能大厦 | tower | 288.6 | w489106865 (2158 m²) | 289 m tower at Shennan Avenue / Science Park |
| ★szpoly | Shenzhen Poly Theater / 深圳保利剧院 | theatre | — | w235150407 (7431 m²) | theatre at Houhai (OSM amenity=theatre) |
| ★szzhongzhou | Shenzhen Zhongzhou Holdings Financial Center / 深圳市中洲控股金融中心A座 | tower | 300.8 | w376393436 (2159 m²) | 301 m office tower at Houhai |
| szbaidu | Baidu International Building East Tower / 百度国际大厦 | tower | 189.3 | w545699483 (3174 m²) | office tower at Houhai |
| szcaixun | Caixun Technology Building / 彩讯科技大厦 | tower | 160 | w1081134198 (1762 m²) | office tower of the Science Park |
| szcasc | CASC International Center North Tower / 航天科技广场A座 | tower | 232 | w737426464 (2060 m²) | office tower at Houhai |
| szclp | CLP Great Wall Building South Tower / 中电长城大厦南塔 | tower | 199.6 | w220656015 (2443 m²) | office tower of the Science Park |
| szcnooc | CNOOC Tower 1 / 中海油大厦A座 | tower | 210 | w736645095 (2080 m²) | CNOOC tower at Houhai |
| szcrlande | CR Land Building Tower E / 华润置地大厦E座 | tower | 199.6 | w533679802 (1715 m²) | office tower of the China Resources City (Dachong) area |
| szdacheng | Dacheng Fund Headquarter Building / 大成基金总部大厦 | tower | 130 | w1190833379 (4060 m²) | office tower at Houhai |
| szdachongintl | Dachong International Center / 大冲国际中心 | tower | 196 | w488882761 (1899 m²) | office tower of the China Resources City (Dachong) area |
| szexchouhai | Excellence Houhai Financial Center / 卓越·后海中心 | tower | 210 | w737426467 (4185 m²) | office tower at Houhai |
| szhengyub | Hengyu Jinrong Center Block B / 恒裕金融中心B座 | tower | 258 | w1190833415 (2174 m²) | office tower at Houhai |
| szhengyuc | Hengyu Jinrong Center Block C / 恒裕金融中心C座 | tower | 258 | w1190750264 (1204 m²) | office tower at Houhai |
| szhytera | Hytera Headquarters / 海能达全球总部大厦 | tower | 257.5 | w1356839141 (4608 m²) | office tower at Houhai |
| szkexin | Kexing Science Park Tower D1 / 科兴科学园D1栋 | tower | 204.75 | w533912154 (2979 m²) | tallest tower of the Kexing Science Park |
| szlenovo | Shenzhen Lenovo Tower 1A / 联想后海中心A座 | tower | 203.85 | w1190750255 (2802 m²) | office tower at Houhai |
| szminmetals | Minmetals Financial Center / 五矿金融华南大厦 | tower | 145.3 | w1190833393 (1524 m²) | office tower at Houhai |
| sznsmuseum | Nanshan Museum / 南山博物馆 | museum | — | w330499627 (5740 m²) | district museum at Nanshan centre |
| szrongchaohq | Rongchao Headquarters Tower / 深圳荣超高新区联合总部大厦 | tower | 230 | w533466841 (3198 m²) | office tower at Houhai |
| szsteelmuseum | China Steel Structure Museum / 中国钢结构博物馆 | museum | — | w586623958 (1681 m²) | museum at Houhai |
| szszustation | Shenzhen University Subway Station Tower / 地铁科技大厦 | tower | 249 | w747970504 (7303 m²) | tower over Shenzhen University metro station |
| sztencentold | Tencent Tower (Science Park) / 腾讯大厦 | tower | 193.2 | w600815118 (1641 m²) | the 2009 headquarters tower in the Science Park, before the Seafront Towers |
| sztianxia | Tianxia International Center Block A / 田厦国际中心 | tower | 196.8 | w238405855 (2064 m²) | office tower at Nanshan centre |
| szvctower | Shenzhen Venture Capital - Private Enterprise Tower / 深圳湾创业投资大厦 | tower | 202.4 | w737149481 (3174 m²) | office tower at Houhai |
| szzte | ZTE Research and Development Center / ZTE中兴通讯研发大楼 | tower | 153.8 | w533912184 (1532 m²) | R&D tower of the Science Park |

### sz50f — Qianhai, Shekou / Prince Bay and the Bao'an centre (27 keys)

Module `R/gba/sz50f/sz50f.js`, refs `R/lm50/ref_sz50f.json`. Existing neighbours: szqhshimao (106 m from szsfhq), szqhconf, szdesignsociety (170 m from szcmtower), szseaworld site, szqhhub / szqianhaistone sites (gba/szshekou); szbaoanstadium, szbayeye, szbayglory (gba/szbaoan) near szbaoangym / szbayopera.

| key | name | kind | h (m) | footprint | note |
|---|---|---|---|---|---|
| ★szbaochen | OCT Baochen Tower / 寶辰大廈 | tower | 230 | w1025842580 (2152 m²) | tower in the Bao'an centre by the bay |
| ★szbayopera | Bay Opera of Shenzhen / 深圳滨海演艺中心 | theatre | — | w777460301 (10304 m²) | opera house on the Bao'an waterfront near the Bay Glory wheel (1500-seat opera hall + 598-seat theatre, opened Sep 2021) |
| ★szcrqh1 | China Resources Qianhai Center Tower 1 / 华润前海中心T1 | tower | 298.5 | w773895096 (2712 m²) | the tallest of the China Resources Qianhai towers **⚠ OSM names the matched footprint 前海人寿大厦; CTBUH point 31 m away: check** |
| ★szhoroy | China Horoy Qianhai Guanze Office Tower 1 / 深圳前海冠泽金融中心办公楼1 | tower | 293 | w774864174 (2955 m²) | 293 m tower in Qianhai |
| szbaoangov | Bao'an District Government / 宝安区政府 | civic | — | w259065197 (14351 m²) | district government building |
| szbaoangym | Bao'an Gymnasium / 宝安体育馆 | stadium | — | w265287342 (20271 m²) | arena of the Bao'an sports centre (the stadium is modelled: szbaoanstadium) |
| szbaoanlight | White Lighthouse (Bao'an) / 白色灯塔 | lighthouse | — | w722834979 (22 m²) | lighthouse on the Bao'an shore **⚠ footprint not in the app's building data (small OSM outline or open ground): the model adds it** |
| szchiwanhq | Chiwan Headquarters Building / 赤湾总部大厦 | tower | 156.9 | w1075436003 (2147 m²) | office tower at Chiwan |
| szcmmuseum | China Merchants History Museum / 招商局历史博物馆 | museum | — | w542438542 (1537 m²) | museum at Shekou |
| szcmtower | China Merchants Tower / 招商局广场写字楼 | tower | 211 | w248985519 (2372 m²) | China Merchants office tower at Shekou |
| szcrqh2 | China Resources Qianhai Center Tower 2 / 华润前海大厦B座 | tower | 231.3 | w773895097 (2299 m²) | tower of the China Resources Qianhai group |
| szcrqh5 | China Resources Qianhai Center Tower 5 / 华润前海大厦A座 | tower | 248.9 | w773895103 (2428 m²) | tower of the China Resources Qianhai group |
| szctfqh | Chow Tai Fook Headquarters North Tower (Qianhai) / 前海周大福金融大厦 | tower | 211.4 | w1240997204 (2556 m²) | office tower in Qianhai |
| szcvc | China Venture Capital Tower A / 中国国有资本风投大厦-A塔 | tower | 249.75 | w1191341157 (1994 m²) | office tower in Qianhai |
| szfishwharf | Fisherman's Wharf Shekou Tower 1 / 华侨城蛇口渔人码头1栋 | tower | 261 | w1238744666 (2241 m²) | tower at the Shekou fishing port redevelopment |
| szgrandsea | Prince Bay Grand Sea Building / 太子湾泓玺大厦 | tower | 202 | w1345128168 (879 m²) | residential tower at Prince Bay |
| szhony | Hony Center Headquarters / 弘毅大厦 | tower | 172 | w774864185 (1754 m²) | office tower in Qianhai |
| szoldcounty | Former Bao'an County Government / 宝安县政府旧址 | heritage | — | r19768681 (1842 m²) | the old county government buildings |
| szprinceplaza | Prince Plaza / 太子广场 | tower | 204.81 | w783232528 (2041 m²) | tower at Shekou Prince Bay |
| szqhexpo | Qianhai Exhibition Center / 前海展示厅 | museum | — | w556687137 (2566 m²) | Qianhai planning exhibition hall |
| szqhmuseum | Qianhai Museum / 前海博物馆 | museum | — | w1327466582 (21434 m²) | museum in Qianhai |
| szruiwan | OCT Ruiwan Mansion / 瑞湾大厦 | tower | 224.9 | w955406076 (2594 m²) | tower in the Bao'an centre |
| szruixi | Prince Bay Ruixi Residences / 太子湾瑞玺大厦 | tower | 244 | w1390887795 (978 m²) | residential tower at Prince Bay |
| szsatcom | Satellite Communication Operations Building / 星通大厦 | tower | 230 | w955406077 (2454 m²) | tower in the Bao'an centre |
| szsfhq | SF Express Headquarters Building / 顺丰速运总部大楼 | tower | 200 | w773895110 (2595 m²) | office tower in Qianhai |
| szszwest | Shenzhen West Railway Station / 深圳西站 | station | — | w239166251 (5580 m²) | railway station at Nantou / Qianhai |
| szxinchengcheck | Former SEZ Xincheng Checkpoint Hall / 旧深圳经济特区新城检查站验证厅 | heritage | — | w520359313 (1446 m²) | hall of the old Special Economic Zone border checkpoint |

### sz50g — North-west: Liuxiandong, University Town, Longhua, Bao'an north (Xixiang, Fuyong, Shajing, Xinqiao), Guangming (27 keys)

Module `R/gba/sz50g/sz50g.js`, refs `R/lm50/ref_sz50g.json`. Existing neighbours: sznorthstation (gba/sznorth, 361-366 m from szhbchuilong / szhuide), szscimuseum (gba/sznorth, near szintlart), szhitsz / szsafari / szsustech sites (gba/szoct, University Town), szworld / szwaterlands (gba/szbaoan, near szsnowworld).

| key | name | kind | h (m) | footprint | note |
|---|---|---|---|---|---|
| ★szfengyan | Fengyan Temple / 凤岩古庙 | temple | — | r15571010 (1274 m²) | hillside temple (OSM ele 190 m) near Fenghuang Ancient Village, Fuyong |
| ★szgmculture | Guangming Culture and Art Center / 光明文化艺术中心 | civic | — | w919126943 (45626 m²) | cultural centre of Guangming |
| ★szhuide | Huide Tower / 新城CBD商务中心 | tower | 258 | w706973059 (1972 m²) | the tallest tower of Longhua near Shenzhen North Station **⚠ zh is the OSM name of the footprint (name:en Huide Tower); CTBUH gives no Chinese name** |
| ★szzhigu | Nanshan Zhigu Tower / 南山智谷大厦 | tower | 259.4 | w1432686552 (2499 m²) | 259 m tower at Liuxiandong |
| szdjisky | DJI Sky City Tower 2 / 天空之城东塔 | tower | 213 | r15569215 (2553 m²) | DJI headquarters east tower at Liuxiandong (west tower r14781210, 195 m) |
| szgmgov | Guangming District Government / 光明区人民政府 | civic | — | w729759114 (1626 m²) | district government building |
| szgmsci | Guangming Science City Exhibition Center / 光明科学城展示中心 | museum | — | w1363046633 (3931 m²) | exhibition centre of Guangming Science City |
| szgmstation | Guangmingcheng Railway Station / 光明城站 | station | — | r17451845 (43821 m²) | high-speed railway station of Guangming |
| szhbchuilong | HBC Huilong Center / HBC汇隆中心 | tower | 205.5 | w706973057 (2440 m²) | office tower at Shenzhen North Station |
| szintlart | Shenzhen International Museum of Art / 深圳国际美术馆 | museum | — | w1159016970 (57948 m²) | art museum in Guangming, opened end of May 2026 |
| szkic | KIC Cloud City Block A / 创智云城A座 | tower | 255 | w1081126150 (2378 m²) | office tower at Liuxiandong |
| szkicb | KIC Cloud City Block B / 创智云城B座 | tower | 215 | w1081126145 (2413 m²) | second KIC Cloud City tower at Liuxiandong |
| szlhculture | Longhua Culture and Art Center / 龙华文化艺术中心 | civic | — | w260572122 (6878 m²) | cultural centre of Longhua |
| szlhdigital | Longhua Digital Innovation Center Building A / 龙华区数字创新中心A座 | tower | 249.7 | w1158925360 (2331 m²) | office tower near Shenzhen North Station |
| szlhgov | Longhua District Government / 龙华区人民政府 | civic | — | w280446292 (1445 m²) | district government building |
| szmaozhou | Maozhou River Sports and Arts Center / 茅洲河体育艺术中心 | civic | — | w1421700397 (8637 m²) | sports and arts centre by the Maozhou River |
| szpkuhsbc | Peking University HSBC Business School / 北京大学汇丰商学院 | campus | — | w1178215146 (10701 m²) | business school building in University Town |
| szrescue | Memorial of the Great Rescue of Cultural Figures / 中国文化名人大营救纪念馆 | monument | — | w761166472 (2321 m²) | memorial hall at Baishilong, Longhua |
| szshajingchen | Chen Clan Ancestral Hall (Shajing) / 驸马祖雍睦堂陈氏大宗祠 | heritage | — | w1445692971 (574 m²) | ancestral hall in old Shajing |
| szsnowworld | Qianhai Snow World / 前海冰雪世界 | civic | — | w1430504337 (58745 m²) | indoor snow park (OSM sports centre) north of Shenzhen World |
| sztanglang | Tanglang City Tower A / 塘朗城西楼 | tower | 196.7 | w614172715 (1584 m²) | tower over Tanglang depot / station |
| szubtech | UBTECH Headquarters / 优必选机器人大厦 | tower | 212 | w1191351147 (2250 m²) | office tower at Liuxiandong |
| szutstadium | University Town Stadium / 大学城体育中心体育场 | stadium | — | r7664887 (8086 m²) | stadium of the Shenzhen University Town sports centre |
| szwangdazhong | Memorial Temple of Wang Dazhong / 王大中丞祠 | heritage | — | w1442092538 (404 m²) | Qing memorial temple at Xixiang |
| szxiligate | Xili Lake Archway / 西丽湖牌坊 | heritage | — | w1312039822 (122 m²) | memorial archway at Xili Lake |
| szxinqiaozeng | Zeng Clan Ancestral Hall (Xinqiao) / 曾氏大宗祠 | heritage | — | w1447624761 (1052 m²) | ancestral hall in old Xinqiao |
| szyicheng | China Horoy Yicheng Center Tower 1 / 壹成环智中心D座 | tower | 247.55 | w1425491566 (1954 m²) | office tower in Longhua |

### sz50h — East: Buji, Longgang centre, Pingshan / Kengzi, Yantian / Shatoujiao, Dapeng (27 keys)

Module `R/gba/sz50h/sz50h.js`, refs `R/lm50/ref_sz50h.json`. Existing neighbours: none within 350 m (gba/szeast sites szchungying, szyantian, szdameisha, szocteast and gba/sznorth szuniversiade / szcuhksz are further away; szstkpagoda / szstkport are ~400-600 m from szchungying).

| key | name | kind | h (m) | footprint | note |
|---|---|---|---|---|---|
| ★szeaststation | Shenzhen East Railway Station / 深圳东站 | station | — | w759768371 (16177 m²) | railway station at Buji |
| ★szlgstadium | Longgang Sports Center Stadium / 龙岗区体育中心体育场 | stadium | — | w544137305 (3580 m²) | stadium of the Longgang sports centre |
| ★szlongtian | Longtian Shiju / 龙田世居 | heritage | — | w782971964 (17126 m²) | old 世居 walled-house compound at Kengzi, Pingshan (OSM tourism=museum) |
| ★szxiaomeisha | Xiaomeisha Ocean World / 小梅沙海洋世界 | site | — | r13353284 (52836 m²) | aquarium resort at Xiaomeisha |
| szchonghua | Chonghua Temple / 重华寺 | temple | — | w979756356 (1372 m²) | Buddhist temple in Kuichong |
| szdongjiang | East River Column Memorial / 东江纵队纪念馆 | monument | — | w881258815 (7558 m²) | memorial museum in Pingshan |
| szdpadmin | Dapeng New District Administration / 大鹏新区管理委员会 | civic | — | w730267716 (5810 m²) | administration building of Dapeng |
| szgaoling | Gaoling Watchtower / 高岭炮楼 | heritage | — | w1057088032 (80 m²) | old fortified watchtower at Nan'ao **⚠ footprint not in the app's building data (small OSM outline or open ground): the model adds it** |
| szgeopark | Dapeng Peninsula National Geopark Museum / 大鹏半岛国家地质公园博物馆 | museum | — | w263308355 (4574 m²) | geopark museum at Nan'ao |
| szlggov | Longgang District Government / 龙岗区人民政府 | civic | — | w240800632 (6758 m²) | district government building |
| szlgventure | Longgang Venture Capital Building / 龙岗创投大厦 | tower | 192 | w1420336894 (5503 m²) | office tower at Longgang centre |
| szlongxing | Longxing Temple / 龙兴寺 | temple | — | w1424962436 (37762 m²) | Buddhist temple in Longgang |
| szlowcarbon | Low Carbon City Exhibition Pavilion / 低碳展览馆 | civic | — | w1367279592 (2208 m²) | exhibition pavilion of the International Low Carbon City at Pingdi |
| szmeigang | Meigang Shiju / 梅冈世居 | heritage | — | w1018425248 (4445 m²) | old 世居 house compound in Longgang (OSM historic=building) |
| sznatmuseum | Shenzhen Natural History Museum / 深圳自然博物馆 | museum | — | w1448550277 (43452 m²) | natural history museum in Pingshan, opened 28 Jul 2026 |
| szpsfootball | Pingshan Football Stadium / 坪山足球场 | stadium | — | w166210502 (16602 m²) | football stadium in Pingshan **⚠ footprint not in the app's building data (small OSM outline or open ground): the model adds it** |
| szpsgov | Pingshan District Government / 坪山区人民政府 | civic | — | w861316459 (7064 m²) | district government building |
| szpsgym | Pingshan Sports Center Gymnasium / 坪山体育中心体育馆 | stadium | — | w544028221 (6777 m²) | arena of the Pingshan sports centre |
| szpsstation | Shenzhen Pingshan Railway Station / 深圳坪山站 | station | — | w262842616 (44172 m²) | high-speed railway station of Pingshan |
| szstkpagoda | Sha Tau Kok Old Pagoda / 沙头角古塔 | heritage | — | w608474093 (150 m²) | old pagoda at Shatoujiao |
| szstkport | Shatoujiao Port / 沙头角口岸 | port | — | w138665729 (3441 m²) | border crossing building to Sha Tau Kok |
| sztianan | Longgang Tianan Cyberpark Phase 4 Tower / 天安中心大厦 | tower | 200 | w1416689219 (2511 m²) | office tower at Longgang centre |
| szvankelg | Vanke Longgang Office Tower / 万科大厦 | tower | 155 | w1449595803 (1660 m²) | office tower at Longgang centre |
| szvankeonecity | Vanke One City Office Tower / 壹海国际中心 | tower | 220 | w1245159269 (1362 m²) | office tower at Yantian |
| szxinqiaoshiju | Xinqiao Shiju / 新乔世居 | heritage | — | w822250774 (9644 m²) | old 世居 walled-house compound at Kengzi (OSM tourism=museum) |
| szyantiangov | Yantian District Government / 盐田区政府 | civic | — | w273176442 (4239 m²) | district government building |
| szyanzi | Pingshan Yanzi Lake International Exhibition Center / 坪山燕子湖国际会展中心 | civic | — | w819300440 (98528 m²) | exhibition centre by Yanzi Lake |

## Uncertain anchors (⚠ in the tables) and data quirks
- szsciencehall: the OSM object is an area tagged `building=no`; find the hall among the app footprints inside it (ref `buildings`).
- szcrqh1: OSM names the footprint 前海人寿大厦; CTBUH places China Resources Qianhai Center T1 31 m away (height matches the app):
  confirm from photos before modelling.
- szhuide: `zh` is the OSM name (name:en Huide Tower); CTBUH gives no Chinese name.
- szshixiatower, szbaoanlight, szgaoling (small towers) and szpsfootball (open stadium ground) have no app building on the footprint:
  the model adds the structure; nothing is hidden.
- szepcb uses the app's 261 m footprint w545225940 (the CTBUH point matched an unnamed 180 m piece first; OSM's height tag 283.6 is not
  the CTBUH height). szdjisky's relation r15569215 is the east tower (213 m); the 195 m west tower r14781210 next to it is not a target.
- szavicplaza: OSM's main name is 交通银行大厦 (alt_name 深圳中航广场; Wikipedia AVIC Plaza 深圳中航广场, 254 m incl. spire).
- Names: `zh` comes from CTBUH or the OSM footprint name; `en` from CTBUH, OSM `name:en` or a plain translation of the OSM name for
  civic / heritage rows (fix it if you find the official English name, and say so).
- Heights in `buildings[].h` are the app's (OSM height / levels or an estimate), often wrong for towers — use `h` / `hs` of the target.
