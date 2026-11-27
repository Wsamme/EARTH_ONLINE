# lm50 — Hong Kong part of the modeller brief (phase 2)

Read `R/lm50/BRIEF.md` (round contract) and `R/lm40/BRIEF.md` (model contract, quality bar, budgets, night look, rules) first; this file replaces their Singapore-specific paths and kit for Hong Kong. `R = /home/claude/earth_online/src`, `SC = /tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/`, `K = SC/lm50/hk/kit`.

## Your group: files and frame

- **Module:** `R/hk/<group>/<group>.js` (e.g. `R/hk/hk50a/hk50a.js`). The HK build (`sgreal/patch17.py`, `CITY=hk`) globs every `R/hk/<dir>/<dir>.js` (folder name = file name) and concatenates it into the page, so **the moment your folder exists it is in the HK build**: keep the file loadable (no syntax errors, no top-level code outside your `{ … }` block) at every save. Phase-1 targets did not create these folders.
- Same format as every HK landmark module (examples: `R/hk/hkx_island/hkx_island.js`, `R/hk/hkv_island/hkv_island.js`, `R/hk/wanchai/wanchai.js`): one `{ … }` block that only assigns `LANDMARKS.<key> = {zh, en, cat, r, h, lt, build(){…}}` + `SG_PLACES.push({type:'<key>', lat, lon, rot})`, and `Object.assign(SITES, {...})` for sites. Secondary keys of a split structure get `label:false`. Never `Math.random` (use `LMCTX.rng()`).
- **Frame:** page metres x = (lon − 114.12)·103014.2, y = (lat − 22.34)·110734.9. A model is built in local metres, +x east, +y up, +z south, turned by `rot` (three.js rotation.y) and set on the highest ground under 0.35 r / 0.7 r + 0.6 m (the page's `placeLandmarkMesh`). The page hides every real building whose centroid (or more than half of its outline) lies inside the convex hull of your model's lower 25 m grown by 3 m.
- **Targets:** `R/lm50/targets_hk.json` → `targets[]` (key, zh, en, kind, lat, lon, r, osm, h, hs, note, unc, hero, group; plus osm_name, area_m2, h_app = what the page draws today, sheet_11SW14A). Use exactly these keys. `note` is a recognition hint, not a verified spec; only `h`/`hs` are checked. `h_app` and the refs' building heights are OSM / pipeline values, often wrong for towers.
- **Refs:** `R/lm50/ref_<group>.json` → `targets.<key>`: `meta`, `anchor`, `radius` (= max(120, 1.6 r, r + 60), ≤ 700), `ground`, `terrain` (35 m grid, rows north → south), `buildings` (OSM footprint `ring`, `osm`, `name`/`zh`, `h` as the page draws it, `floors`, `osm_height`, `type`, `parts` = the page's building:part pieces with base / top and OSM id), `roads` (the page's own lines; `bridge` + `elev` = deck height above ground per vertex), `areas` (named OSM polygons: parks, schools, hospitals …), `pois`. Targets anchored on an OSM area (temple compounds, campuses, estates, parks: `osm` of an area) find that polygon in `areas`, not in `buildings`. Local metres, +x east, +z south. Made with `SC/lm50/hk/hkrefs50.py` (see "Data notes").

## Data notes (Hong Kong)

- **The old HK refs pipeline could not run:** `hkreal/b9_refs.py` reads `hkreal/out/*.pkl`, which are gone from this machine (and the Geofabrik extract they came from is not reachable). `SC/lm50/hk/hkrefs50.py` replaces it with the same output format, built from the data the page itself draws (`site/hkdata/hk_bld0/1.bin`, `hk_roads.bin`, `hk_base.bin`, decoded by `SC/lm50/hk/appdata.py`) plus OSM ids / names / parts from the OSM API (tile cache `SC/lm50/hk/osm/`, fetched 27 Nov 2026). A footprint present in OSM today but not in the page's older extract shows `type: "not drawn by the page"` and `h: null`.
- **Heights:** `hs` cites Wikipedia / the tallest-buildings list where it has the building, else the Lands Department Building dataset (TopHeight − BaseHeight, mPD; roof level, no masts; for towers on podiums the top minus the lowest base of the same building). Treat page heights as unknown.
- **Terrain:** the page's ground is a bare-earth estimate on a 70 m grid. On the Mid-Levels and other slopes (hkcathedralic, hkkomtong, hkohelleah, hkmedsci, hk39conduit, hkaigburth, hkjusticeplace, hkfringe, hkstpaulsch, hkunionch, hkstjosephch, hkobservatory, hktaofongshan …) take foundations well below 0 (−8 … −15 m) and check the base against `terrain` in the refs.
- **Photo-textured official buildings (`R/hk/zz_tex`, sheet 11-SW-14A):** where that layer is on, a hand-made landmark whose anchor lies inside an official textured building is hidden (its label stays). Targets in that sheet are flagged `sheet_11SW14A: true` (listed per group below); model them normally — the coordinator decides which layer wins. `R/hk/zz_hk3d` now carries only official footbridges / walkways (`nohull`): do not model those.
- **Signs:** landmark models carry no text, logos or brand colours (the sign engine `hkv/hksigns` is separate and not part of this round).

## Kit — commands (each tested once in phase 1; see the test notes at the end)

Offline, as often as you like:
```
# existing models / sites near a point (evaluates R/hk/*/ and R/hkv/* modules; INSIDE r / INSIDE keep flags; add your file to see it too)
node $K/near.js <lat> <lon> [radius=600] [R/hk/<group>/<group>.js]
# count every HK landmark from the repo modules (SC/lmx/count.js reads the old SC/hk copy; this one reads R/hk)
node $K/count_hk.js hk
# stats: helper calls, triangles, build ms, materials, rmax vs r, y range vs h, placements (engine helpers from R/city-brush-v16.html + three r128)
node $K/nstat.js R/hk/<group>/<group>.js [key1,key2,...]
# shaded preview: dump the key, then render (azimuth 0 = camera south looking north, 90 = camera east; elevation deg; width px)
node $K/ndump.js R/hk/<group>/<group>.js <key> SC/lm50/hk/<group>/<key>.json && python3 $K/nrender.py SC/lm50/hk/<group>/<key>.json SC/lm50/hk/<group>/<key>.png 200 25 600
# plan overlay vs the real footprints (grey kept, red hidden, orange CLASH, blue hull, green model < 4 m); optional lat lon rot override
python3 $K/oplan.py SC/lm50/hk/<group>/<key>.json R/lm50/ref_<group>.json <key> SC/lm50/hk/<group>/<key>_plan.png [half_m|auto] [lat lon rot]
# corrected-anchor refs for one target: write a one-row targets file (same fields) and run the refs tool on it (light: ~0.3 GB, ~20 s)
cd SC/lm50/hk && python3 hkrefs50.py <my_targets.json> <outdir> <group>
```
Browser — **at most 2 runs per group**, always through the lock, detached, polled (pages build into `SC/lm50/hk/site/`, which links `hkdata/`):
```
# 1) build a test page with only the modules you need (your folder + neighbours; HKLM = R/hk folder names; omit for all)
bash $K/mkpage_hk.sh <group> <group>,<neighbour folders e.g. wanchai,hkv_island,hkx_island>
# 2) shoot views: [name, lat, lon, dist m, elev deg, azim deg, hour (12 day, 20.5 night), "optional JS", waitMs]
cd $SC && (setsid nohup bash lm33/kit/browser.sh node lm50/hk/kit/appshot_hk.js t_<group>.html lm50/hk/shots/<group> \
  '[["<key>_d",lat,lon,350,30,200,12],["<key>_n",lat,lon,350,30,200,20.5]]' > lm50/hk/shots/<group>.log 2>&1 &)
# 3) read the log (PAGEERR must be 0; FAILED-URLS only the sibling-page probes and favicon), LOOK at the PNGs, then delete the page:
rm SC/lm50/hk/site/t_<group>.html SC/lm50/hk/site/t_<group>-app.js
```
The first run with `HKLM=<your folder + neighbours>` is the in-situ batch (all your keys, several views each); the second is the full app (omit HKLM) or a second in-situ. A run takes the page ~1.5–3 min to settle plus ~5 s per view, and waits for the shared browser lock first.

## Groups

### hk50a — Central (west of Ice House St / Garden Rd), Sheung Wan, Sai Ying Pun, Kennedy Town, Mid-Levels west (29 keys, 4 ★)

| key | name | kind | h (m) | r | osm | notes |
|---|---|---|---|---|---|---|
| ★hkjusticeplace ⚠ | Justice Place (Former Central Government Offices) 律政中心（前中区政府合署） | heritage | 48.7 | 75 | w295407300 | anchored on the Main Wing footprint; East and West Wings are separate OSM footprints within r 75 (refs) |
| ★hkentertainment | Entertainment Building 娱乐行 | tower | 186.45 | 26 | w233135905 |  |
| hkninequeens ⚠ | 9 Queen's Road Central 皇后大道中九号 | tower | 187 | 52 | w295407307 | close to existing hk41w_stanchart (54 m, r 40): keep the hull off it |
| hkchaterhouse | Chater House 遮打大厦 | tower | 123.8 | 47 | w42293731 |  |
| hkmanyee | Man Yee Building 万宜大厦 | tower | 140.5 | 48 | w723231735 |  |
| hklhttower | LHT Tower 陆海通大厦 | tower | 126.2 | 30 | w200238459 |  |
| hkcentraltower | Central Tower 中汇大厦 | tower | 124.1 | 27 | w233137283 |  |
| hkworldwide | World-Wide House 环球大厦 | tower | 105.3 | 28 | r20013597 |  |
| hkwingonhouse | Wing On House 永安集团大厦 | tower | 94.2 | 30 | w148463271 |  |
| hkabcbldg | Agricultural Bank of China Building 中国农业银行大厦 | tower | 133.3 | 22 | w180126594 |  |
| ★hkbeabldg ⚠ | The Bank of East Asia Building 东亚银行大厦 | heritage | 91.2 | 33 | w1270638650 | close to existing hk41w_landmark (63 m, r 60): keep the hull off it |
| hkpedder | Pedder Building 毕打行 | heritage | — | 26 | w112685823 |  |
| hkfringe | Fringe Club (Old Dairy Farm Depot) 艺穗会（前牛奶公司仓库） | heritage | 14.5 | 22 | w407728663 |  |
| hkstpaulsch | St Paul's Church 圣保罗堂 | church | — | 21 | w558662185 |  |
| ★hkcathedralic | Cathedral of the Immaculate Conception 圣母无原罪主教座堂 | church | 20.2 | 44 | w217522625 |  |
| hkkomtong | Dr Sun Yat-sen Museum (Kom Tong Hall) 孙中山纪念馆（甘棠第） | heritage | 17.7 | 21 | w148461481 |  |
| hkohelleah | Ohel Leah Synagogue 莉亚堂（犹太庙） | religious | — | 18 | w417911577 |  |
| hkmedsci | Hong Kong Museum of Medical Sciences 香港医学博物馆 | heritage | — | 15 | w319658129 |  |
| hk39conduit | 39 Conduit Road 天汇 | tower | 192 | 23 | w538084225 |  |
| hkwestpoint | The Westpoint 西港中心（中联办大楼） | tower | 186 | 26 | r7771538 |  |
| hkhkplaza | Hong Kong Plaza 香港商业中心 | tower | 148.9 | 24 | w155738271 |  |
| hkmerton | The Merton 泓都 | tower | 197 | 60 | w155738166 |  |
| hklopan | Lo Pan Temple 鲁班先师庙 | temple | — | 15 | w832193018 |  |
| hkktpool | Kennedy Town Swimming Pool 坚尼地城游泳池 | sports | 16 | 86 | w557673787 |  |
| hksypcc | Sai Ying Pun Community Complex (Old Mental Hospital facade) 西营盘社区综合大楼 | heritage | 41.1 | 45 | w219119236 |  |
| hkcadogan | Cadogan 加多近山 | tower | 184 | 36 | w202156008 |  |
| hkmanhattanhts | Manhattan Heights 高逸华轩 | tower | 185 | 25 | w155738272 |  |
| hkcenotaph | The Cenotaph 和平纪念碑 | monument | — | 15 | w737551130 |  |
| hkhopyat | CCC Hop Yat Church 中华基督教会合一堂 | church | 23.4 | 34 | w232342814 |  |

Neighbours already modelled within ~150 m of your keys (module folders to include in in-situ runs: `admiralty,central,hkv41w,hkv_island,hkx_island,midlevels,peak`): hkhsbc, hkbocold, hkcheungkong, hkcfa, hkcityhall, hkifc1, hkifcmall, hkstation, hkexchange, hkjardine, hk41w_stanchart, hk41w_landmark, hk41w_belchers, hk41w_fourseasons, hk41w_centralmkt, hkvhangseng, hkvharbourbldg, hkvaia, hkvccb, hkvalexandra, hkvprinces, hkvmandarin, hkvhkclub, hkvgpo, hkvfix_jroof, hkthreegarden, hkpeaktram_kr, hkpeaktram_mr, hkpeaktram_mg, hkpeaktram_my, hkthecenter, hkstjohn, hkgovhouse, hkmanmo, hkpmq, hktaikwun, hkpeaktramlower, hkpark (site), hkzoo (site), hkhku (site)

### hk50b — Admiralty south, Wan Chai, Mid-Levels east (the only group with anchors in map sheet 11-SW-14A) (29 keys, 4 ★)

| key | name | kind | h (m) | r | osm | notes |
|---|---|---|---|---|---|---|
| ★hkbluehouse | Blue House 蓝屋 | heritage | — | 25 | w405793051 |  |
| hkoldwcpo | Old Wan Chai Post Office 旧湾仔邮政局 | heritage | — | 15 | w184798462 |  |
| ★hkhungshing | Hung Shing Temple (Wan Chai) 湾仔洪圣古庙 | temple | — | 15 | w743546705 |  |
| hknamkoo | Nam Koo Terrace 南固台 | heritage | — | 15 | w1308749556 |  |
| ★hkzenith ⚠ | The Zenith and Old Wan Chai Market 尚翘峰及旧湾仔街市 | tower | 143.5 | 55 | w201405840 | anchored on the old Wan Chai Market footprint (the podium); the three towers above are separate OSM footprints in the refs |
| hkdahsingfc | Dah Sing Financial Centre 大新金融中心 | tower | 150.6 | 27 | w200283000 |  |
| hkwuchung | Wu Chung House 胡忠大厦 | tower | 162.49 | 43 | w184798490 |  |
| hkhopewellhotel ⚠ | Hopewell Hotel 合和酒店 | tower | 132 | 100 | r19022421 | anchored on the OSM multipolygon of the whole Hopewell Centre II site (9 800 m2, steep slope): model the hotel tower and its podium only, clear of hkhopewell |
| hkavenue | The Avenue (Lee Tung Avenue) 囍汇（利东街） | tower | — | 70 | w742775155 |  |
| hkonehennessy | One Hennessy 壹轩尼诗 | tower | 133.9 | 34 | w200238637 |  |
| hkeverbright | Everbright Centre 光大中心 | tower | 132.4 | 31 | w148859003 |  |
| hksixpp | Six Pacific Place 太古广场六座 | tower | 130.2 | 28 | w1333188885 |  |
| hkharcourthouse | Harcourt House 夏悫大厦 | tower | 94 | 36 | w148859033 |  |
| hkchinaonline | China Online Centre 中国网络中心 | tower | 201 | 26 | w295779339 |  |
| hkuafc | United Asia Finance Centre 亚洲联合财务中心 | tower | 175.7 | 22 | w295779426 |  |
| hktimestower | Times Tower 新时代中心 | tower | 160.2 | 15 | w295102745 |  |
| hksunshineplaza | Sunshine Plaza 三湘大厦 | tower | 149.1 | 22 | w295779384 |  |
| hksouthorn | Southorn Centre 修顿中心 | tower | 115.1 | 27 | w148858987 |  |
| hkartscentre ⚠ | Hong Kong Arts Centre 香港艺术中心 | civic | 64.9 | 24 | w117088646 | close to existing hkvwcgov (112 m, r 152): keep the hull off it |
| hkqestadium | Queen Elizabeth Stadium 伊利沙伯体育馆 | sports | 29.7 | 41 | w260868015 |  |
| hkwcsportsground | Wan Chai Sports Ground 湾仔运动场 | sports | 12.5 | 54 | w184696920 |  |
| hkruttonjee | Ruttonjee Hospital 律敦治医院 | hospital | 47.2 | 60 | w198926349 |  |
| ★hkasiasociety | Asia Society Hong Kong Center (Former Explosives Magazine) 亚洲协会香港中心（前军火库） | heritage | — | 70 | w188934428 |  |
| hkhighcourt | High Court Building 高等法院大楼 | civic | 92.4 | 35 | w26434869 |  |
| hkunionch ⚠ | Union Church (Kennedy Road) 佑宁堂 | church | — | 17 | w1204073999 | close to existing hkpeaktram_kr (63 m, r 87): keep the hull off it |
| hkstjosephch | St Joseph's Church (Garden Road) 圣若瑟堂 | church | — | 29 | w532434630 |  |
| hkaigburth | Aigburth 誉皇居 | tower | 196 | 20 | w539895767 |  |
| hkoldwcpolice | Former Wan Chai Police Station (International Organization for Mediation) 前湾仔警署（国际调解院） | heritage | — | 36 | w250886398 |  |
| hksikhtemple | Khalsa Diwan Sikh Temple 锡克庙 | religious | 22.4 | 48 | w455888715 |  |

Neighbours already modelled within ~150 m of your keys (module folders to include in in-situ runs: `admiralty,hkv41e,hkv41w,hkv_island,hkx_island,midlevels,peak,wanchai`): hkboc, hklippo, hk41ehkapa, hk41epaktai, hk41w_threepp, hkvfefc, hkvadmctr, hkvunited, hkvpolicehq, hkvqgo, hkvconvplaza, hkvshkc, hkvharbourctr, hkvcrb, hkvwcgov, hkvshuion, hkvelizabeth, hkvfix_midvent, hkvfix_svent2, hkvfix_kongwan, hkpacificplace, hkpeaktram_kr, hkpeaktram_mr, hkpeaktram_mg, hkpeaktram_my, hkgovhouse, hkflagstaff, hkpeaktramlower, hkcentralplaza, hkcentralplaza_b, hkhopewell, hkpark (site), hkhappyvalley (site), hkzoo (site)

In map sheet 11-SW-14A (photo-textured official layer under evaluation): hkasiasociety, hkhighcourt.

### hk50c — Causeway Bay, Tai Hang, Tin Hau, North Point, Fortress Hill, Happy Valley east (29 keys, 4 ★)

| key | name | kind | h (m) | r | osm | notes |
|---|---|---|---|---|---|---|
| ★hkstatetheatre | State Theatre 皇都戏院 | heritage | — | 55 | w427345195 |  |
| hksunbeam | Sunbeam Theatre (Kiu Fai Mansion) 新光戏院（侨辉大厦） | heritage | 52.5 | 32 | w228769719 |  |
| ★hklinfa | Lin Fa Kung (Tai Hang) 大坑莲花宫 | temple | — | 15 | w545009671 |  |
| ★hkhawpar | Haw Par Mansion 虎豹别墅 | heritage | 18.3 | 24 | w671185103 |  |
| hknoonday ⚠ | Noonday Gun 怡和午炮 | monument | — | 40 | - | POI-only anchor: no footprint picked |
| hkleegarden2 ⚠ | Lee Garden Two 利园二期 | tower | 105.9 | 63 | w199305182 | close to existing hkvleegarden (76 m, r 70): keep the hull off it |
| hkleegarden3 ⚠ | Lee Garden Three 利园三期 | tower | 110.4 | 43 | w1424342887 | close to existing hkvleegarden (91 m, r 70): keep the hull off it |
| hkleetheatre | Lee Theatre Plaza 利舞台广场 | tower | 101 | 40 | w1424342877 |  |
| hkhanglung | Hang Lung Centre 恒隆中心 | tower | 86.1 | 35 | w171882800 |  |
| hkparklane | The Park Lane Hong Kong 柏宁酒店 | tower | 79.3 | 45 | w149400670 |  |
| hkeastpoint | East Point Centre (SOGO) 东角中心（崇光） | building | 83 | 40 | w294141091 |  |
| ★hkcentrallib | Hong Kong Central Library 香港中央图书馆 | civic | 59.6 | 56 | w856995407 |  |
| hkqueenscollege | Queen's College 皇仁书院 | school | 7.9 | 70 | w545322995 |  |
| hkstpaulhosp | St Paul's Hospital 圣保禄医院 | hospital | 95.9 | 50 | w113146404 |  |
| hkwindsorhouse | Windsor House 皇室堡 | tower | 134.9 | 51 | w171882809 |  |
| hkcitycorp | Citicorp Centre 万国宝通中心 | tower | 118.5 | 24 | w104276717 |  |
| hklesommet | Le Sommet 豪廷峰 | tower | 154.7 | 40 | w101959061 |  |
| hkislandlodge | Island Lodge 港涛轩 | tower | — | 25 | w230987765 |  |
| hkcitygarden | City Garden 城市花园 | tower | 80.1 | 130 | w101959360 |  |
| hknpferry | North Point Ferry Pier 北角码头 | pier | 7.1 | 60 | w228769725 |  |
| hkoistreet ⚠ | Oi! (Former Royal Hong Kong Yacht Club) 油街实现（前皇家香港游艇会会所） | heritage | — | 40 | r15916411 | anchored on the OSM arts-centre area (several small buildings); the 1908 red-brick club house is one of them: identify it from photos |
| hksanatorium ⚠ | Hong Kong Sanatorium & Hospital 养和医院 | hospital | — | 60 | w230722326 | footprint w230722326 matched by position only (OSM name: 中院 Central Block / Central Block / 中院) |
| hkbroadwood | Broadwood Twelve 乐天峰 | tower | 151.7 | 15 | w454484136 |  |
| hkshueyan | Hong Kong Shue Yan University 香港树仁大学 | campus | 105 | 90 | r16290361 |  |
| hkvictoriacentre | Victoria Centre 维多利中心 | tower | 106 | 55 | w200006083 |  |
| hkstmarycwb | St Mary's Church (Causeway Bay) 圣公会圣马利亚堂 | church | 18.7 | 33 | w779596323 |  |
| hkkingyinlei | King Yin Lei 景贤里 | heritage | 12.5 | 40 | w948435415 |  |
| hkstjude | St Jude's Church (North Point) 天主教圣犹达圣堂 | church | 18 | 28 | w764099765 |  |
| hknpmethodist | North Point Methodist Church 北角卫理堂 | church | — | 32 | w112907899 |  |

Neighbours already modelled within ~150 m of your keys (module folders to include in in-situ runs: `hkv41e,hkv_island,hkx_island,wanchai`): hk41etinhau, hkvwtc, hkvsino, hkvcbplaza, hkvhysan, hkvleegarden, hkvaianp, hkvoilst, hkvoilst2, hkvtaiping, hkvcustoms, hkvislandplace, hkvfix_svent, hktimessq, hkstadium, hkvicpark (site), hkhappyvalley (site)

### hk50d — Quarry Bay, Tai Koo, Sai Wan Ho, Shau Kei Wan, Chai Wan (27 keys, 3 ★)

| key | name | kind | h (m) | r | osm | notes |
|---|---|---|---|---|---|---|
| ★hkmonster | Yick Cheong Building and Montane Mansion ("Monster Building") 益昌大厦及海山楼（“怪兽大厦”） | tower | 65.6 | 70 | w296725043 |  |
| ★hkcityplaza | Cityplaza 太古城中心 | building | 16 | 110 | w28845847 |  |
| hkcityplaza1 | Cityplaza One 太古城中心一座 | tower | 80.8 | 43 | w100457817 |  |
| hkcityplaza3 | Cityplaza Three 太古城中心三座 | tower | 73.5 | 34 | w28869718 |  |
| hkcityplaza4 | Cityplaza Four 太古城中心四座 | tower | 74.1 | 39 | w28869719 |  |
| hkcambridgehouse | Cambridge House (Taikoo Place) 康桥大厦 | tower | 154.8 | 17 | w100652828 |  |
| hkwestlands | Westlands Centre 华兰中心 | tower | 82.7 | 38 | w296724603 |  |
| hkeastharbour | Eastern Harbour Centre 东港中心 | tower | 92 | 32 | w100652784 |  |
| hkkornhillplaza | Kornhill Plaza 康怡广场 | building | 43.4 | 70 | w28869806 |  |
| hkmtparker | Mount Parker Residences Mount Parker Residences | tower | 74.3 | 29 | w296724745 |  |
| hkfilmarchive | Hong Kong Film Archive 香港电影资料馆 | civic | 33.3 | 27 | w100010202 |  |
| hkswhcivic | Sai Wan Ho Municipal Services Building (Civic Centre) and Felicity Garden 西湾河市政大厦（文娱中心）及欣景花园 | civic | 80.2 | 60 | w813719017 |  |
| hkleikingwan | Lei King Wan 鲤景湾 | tower | — | 120 | r10483464 |  |
| hktamkung | Tam Kung Temple (Shau Kei Wan) 筲箕湾谭公庙 | temple | — | 15 | w558168332 |  |
| hkskwtinhau | Tin Hau Temple (Shau Kei Wan) 筲箕湾天后古庙 | temple | — | 15 | w152494866 |  |
| ★hkcoastaldef ⚠ | Hong Kong Museum of the War of Resistance and Coastal Defence (Lei Yue Mun Redoubt) 香港抗战及海防博物馆（鲤鱼门炮台） | heritage | — | 170 | w97788544 | site-sized OSM area (museum grounds, 6.9 ha): the redoubt with its tented roof is the core; batteries and tunnels on the slope |
| hklymparkhv ⚠ | Lei Yue Mun Park and Holiday Village 鲤鱼门公园度假村 | heritage | 79.2 | 220 | w557930264 | site-sized OSM area (Lei Yue Mun Park, 19 ha): model the former barrack blocks, not the whole park |
| hkeasternhosp ⚠ | Pamela Youde Nethersole Eastern Hospital 东区尤德夫人那打素医院 | hospital | — | 110 | w693575508 | footprint w693575508 matched by position only (OSM name: none) |
| hkyouthsquare | Youth Square 青年广场 | civic | 76.9 | 54 | w258413476 |  |
| hkswhpier | Sai Wan Ho Ferry Pier 西湾河码头 | pier | — | 17 | w492839530 |  |
| hkivechaiwan ⚠ | IVE (Chai Wan) 香港专业教育学院（柴湾） | campus | 20 | 90 | w323745049 | anchored on the OSM college area |
| hkhengfachuen ⚠ | Heng Fa Chuen 杏花邨 | estate | 59.7 | 230 | w205358842 | large estate (48 towers on the depot podium): one key with r 230, or split it into secondary keys (label:false) so no hull covers the neighbours |
| hkfireboat | Fireboat Alexander Grantham Exhibition Gallery 葛量洪号灭火轮展览馆 | heritage | — | 30 | w102225744 |  |
| hkeastcourts | Eastern Law Courts Building 东区法院大楼 | civic | 52.8 | 36 | w860828673 |  |
| hksalesian | Salesian Mission House 慈幼会修院 | heritage | 30.6 | 30 | w558168422 |  |
| hkholycross | Holy Cross Church (Sai Wan Ho) 天主教圣十字架堂 | church | 34.6 | 35 | w296724450 |  |
| hkchaiwanstn | Chai Wan Station 柴湾站 | station | 18 | 60 | w247200862 |  |

Neighbours already modelled within ~150 m of your keys (module folders to include in in-situ runs: `hkv41e,hkv_island,wanchai`): hk41egrandprom, hk41egrandprom_b, hk41egrandprom_c, hk41egrandprom_d, hk41egrandprom_e, hk41elawuk, hkvtaikoo1, hkvtaikoo2, hkvdorset, hkvpccw, hkvoxford, hkvlincoln, hkvberkshire, hkoneislandeast

### hk50e — Tsim Sha Tsui (inland), Jordan, Yau Ma Tei, Austin, West Kowloon (27 keys, 4 ★)

| key | name | kind | h (m) | r | osm | notes |
|---|---|---|---|---|---|---|
| ★hkkbs | Former Kowloon British School (Antiquities and Monuments Office) 前九龙英童学校（古物古迹办事处） | heritage | 9.7 | 24 | w692802859 |  |
| ★hkobservatory | Hong Kong Observatory (1883 Building) 香港天文台 | heritage | 52.5 | 35 | w692802873 |  |
| ★hkymttinhau | Tin Hau Temple (Yau Ma Tei) 油麻地天后庙 | temple | 8.2 | 40 | w198547890 |  |
| ★hkymttheatre | Yau Ma Tei Theatre and Red Brick Building 油麻地戏院及红砖屋 | heritage | 11 | 40 | w446811353 |  |
| hkfruitmarket | Yau Ma Tei Wholesale Fruit Market 油麻地果栏 | heritage | — | 90 | w423575201 |  |
| hkymtpolice ⚠ | Former Yau Ma Tei Police Station 油麻地警署 | heritage | — | 40 | w160323966 | anchored on the OSM area of the police station compound; pick the 1922 block from photos |
| hkrosary | Rosary Church 玫瑰堂 | church | — | 21 | w184758736 |  |
| hkkuc | Kowloon Union Church 九龙佑宁堂 | church | 8.5 | 35 | w457404733 |  |
| hkmirador | Mirador Mansion 美丽都大厦 | building | 51 | 45 | r15622416 |  |
| hkmiraplace | Mira Place 美丽华广场 | building | 52.2 | 70 | w51256967 |  |
| hktheone | The One THE ONE | tower | 155 | 52 | r21003835 |  |
| hkheritagedisc | Hong Kong Heritage Discovery Centre (Former Whitfield Barracks) 香港文物探知馆（前威菲路军营） | heritage | 10.7 | 50 | w99150699 |  |
| hkklnparksports | Kowloon Park Sports Centre and Swimming Pool 九龙公园体育馆及游泳池 | sports | 16.7 | 70 | w99149401 |  |
| hkscoutcentre | Hong Kong Scout Centre 香港童军中心 | building | 55 | 39 | w184573794 |  |
| hkdgs | Diocesan Girls' School 拔萃女书院 | school | 32 | 70 | w694338402 |  |
| hktungwahmuseum | Tung Wah Museum (Kwong Wah Hospital) 东华三院文物馆（广华医院） | heritage | 10.1 | 16 | w100768015 |  |
| hkwkgov | West Kowloon Government Offices 西九龙政府合署 | civic | 61.7 | 70 | w671222243 |  |
| hkfreespace | Freespace (West Kowloon) 自由空间 | civic | 12.1 | 39 | w549702816 |  |
| hksignalhill | Signal Hill Garden (Blackhead Point Tower) 讯号山公园（大包米讯号塔） | heritage | — | 15 | w642477553 |  |
| hkholidayinngm ⚠ | Holiday Inn Golden Mile 香港金域假日酒店 | tower | 52.9 | 49 | w254652838 | the existing hkchungking hull already reaches 122 m2 into this footprint: keep the new model off Chungking Mansions and check the overlay |
| hkgrandaustin | Grand Austin Grand Austin | tower | 95.4 | 80 | w670951084 |  |
| hkkwunchungmsb | Kwun Chung Municipal Services Building 官涌市政大厦 | civic | 54.4 | 39 | w185035566 |  |
| hkklnmethodist | Kowloon Methodist Church 循道卫理联合教会九龙堂 | church | 25.2 | 25 | w694500934 |  |
| hkwardmethodist | The Ward Memorial Methodist Church 循道卫理联合教会安素堂 | church | 16.6 | 26 | w695039113 |  |
| hkallsaints | All Saints' Cathedral (Mong Kok) 香港圣公会诸圣座堂 | church | 22.8 | 28 | w695857082 |  |
| hkymtlibrary | Yau Ma Tei Public Library 油麻地公共图书馆 | civic | 21 | 25 | w930598310 |  |
| hkmasjidibrahim | Masjid Ibrahim 亚伯拉罕清真寺 | religious | — | 22 | w785852481 |  |

Neighbours already modelled within ~150 m of your keys (module folders to include in in-situ runs: `hkv_kowloon,hkx_kowloon,kowlooneast,tst,westkowloon`): hkvdockside, hkvmasterpiece, hkvharbourcity, hkvsilvercord, hkvsunplaza, hkvchkcity, hkvvictoriatowers, hkvkimpton, hkvisquare, hkvsheraton, hkvwingonplaza, hkavenuestars_c, hkk11musea, hklangham, hkkowloonmosque, hkstandrew, hkchungking, hkhistorymuseum, hksciencemuseum, hkpeninsula, hkxiqu, hkpalacemuseum, hkwkstation, hkwkstation_b, hkpolyu (site)

### hk50f — Mong Kok, Prince Edward, Tai Kok Tsui, Sham Shui Po, Shek Kip Mei, Kowloon Tong, Cheung Sha Wan / Lai Chi Kok (30 keys, 4 ★)

| key | name | kind | h (m) | r | osm | notes |
|---|---|---|---|---|---|---|
| ★hkluisengchun | Lui Seng Chun 雷生春 | heritage | — | 15 | w746293594 |  |
| ★hkmeihohouse | Mei Ho House 美荷楼 | heritage | 15.9 | 32 | w151356145 |  |
| ★hkscad | Former North Kowloon Magistracy 前北九龙裁判法院 | heritage | 22.5 | 35 | w189786271 |  |
| hkjccac | Jockey Club Creative Arts Centre 赛马会创意艺术中心 | heritage | 28.3 | 44 | w184922636 |  |
| ★hkcitycmc | Run Run Shaw Creative Media Centre (CityU) 邵逸夫创意媒体中心 | civic | 39.2 | 60 | w209941429 |  |
| hkfestivalwalk | Festival Walk 又一城 | building | 37.2 | 110 | w26448717 |  |
| hkhkpc | HKPC Building 香港生产力促进局大楼 | civic | 32.8 | 57 | w167039176 |  |
| hkmkstadium | Mong Kok Stadium 旺角大球场 | stadium | 10.4 | 110 | w114127110 |  |
| hkgrandcentury | Grand Century Place 新世纪广场 | tower | 39.4 | 80 | w448055152 |  |
| hkpioneer | Pioneer Centre 始创中心 | tower | 86.6 | 60 | w174629895 |  |
| hksinocentre | Sino Centre 信和中心 | building | 77 | 21 | w316843331 |  |
| hkmkpolice | Mong Kok Police Station 旺角警署 | heritage | 35.5 | 49 | w203374562 |  |
| hkfayuenmsb | Fa Yuen Street Municipal Services Building 花园街市政大厦 | civic | 69 | 30 | w316843161 |  |
| hkmacpherson | MacPherson Place 麦花臣汇 | building | 93.1 | 39 | w494511957 |  |
| hkolympian | Olympian City 奥海城 | building | — | 130 | w26379409 |  |
| hkhermitage | The Hermitage 帝峰·皇殿 | tower | 234 | 80 | w316843375 |  |
| hkonesilversea | One Silversea 一号银海 | tower | 182 | 100 | w699056259 |  |
| hkdragoncentre | Dragon Centre 西九龙中心 | building | 45.1 | 66 | r16345072 |  |
| hkleichenguk | Lei Cheng Uk Han Tomb Museum 李郑屋汉墓博物馆 | heritage | — | 21 | w103426538 |  |
| hkssppolice | Sham Shui Po Police Station 深水埗警署 | heritage | 16.1 | 38 | w158899319 |  |
| hkdbs ⚠ | Diocesan Boys' School 拔萃男书院 | school | 25.9 | 90 | w428742325 | anchored on the OSM school area (6.3 ha campus): model the 1926 main building and its neighbours, identify them from photos |
| hkbanyan | Banyan Garden 泓景台 | tower | 191 | 110 | w189361889 |  |
| hkmanhattanhill | Manhattan Hill 曼克顿山 | tower | 193 | 80 | w235951658 |  |
| hkpeihomsb | Pei Ho Street Municipal Services Building 北河街市政大厦 | civic | 4.7 | 55 | w290041020 |  |
| hkhkbuach | HKBU Academic Community Hall 香港浸会大学大学会堂 | civic | 43.5 | 74 | w429459713 |  |
| hkclpclock | CLP Head Office (Clock Tower) 中华电力总部（中电钟楼） | heritage | 13.3 | 24 | w813663012 |  |
| hkstteresa | St Teresa's Church 圣德肋撒堂 | church | — | 45 | w1482812392 |  |
| hkgardenbakery | Garden Bakery Building 嘉顿面包大楼 | heritage | 31.7 | 30 | w355036737 |  |
| hkjaotsungi | Jao Tsung-I Academy (former Lai Chi Kok Hospital) 饶宗颐文化馆（前荔枝角医院） | heritage | 11.2 | 120 | w186494535 |  |
| hksspdispensary | Sham Shui Po Public Dispensary 深水埗公立医局 | heritage | — | 18 | w736310215 |  |

Neighbours already modelled within ~150 m of your keys (module folders to include in in-situ runs: `hkx_kowloon`): hklangham

### hk50g — Hung Hom, To Kwa Wan, Kai Tak, Kowloon City, Kowloon Bay, Kwun Tong, Choi Hung (28 keys, 4 ★)

| key | name | kind | h (m) | r | osm | notes |
|---|---|---|---|---|---|---|
| ★hkwhampoa | The Whampoa 黄埔号 | building | 15.4 | 40 | w151397985 |  |
| ★hkairside | Airside AIRSIDE | tower | 207 | 91 | w1212412229 |  |
| ★hkmegabox | MegaBox MegaBox | building | 165.9 | 80 | w125577492 |  |
| hkhunghomstn ⚠ | Hung Hom Station (MTR Hung Hom Building) 红磡站 | station | 16.5 | 150 | w33613720 | close to existing hkcoliseum (136 m, r 78): keep the hull off it |
| hkhauwong | Hau Wong Temple (Kowloon City) 侯王古庙 | temple | — | 24 | w133349298 |  |
| hkcattledepot ⚠ | Cattle Depot Artist Village 牛棚艺术村 | heritage | — | 70 | w225873672 | anchored on the OSM arts-centre area: the red-brick depot sheds inside it |
| hkekcc | East Kowloon Cultural Centre 东九文化中心 | civic | 27.9 | 108 | w695710804 |  |
| hkmanulifefc | Manulife Financial Centre 宏利金融中心 | tower | 96.1 | 70 | w153588654 |  |
| hkmc5 | Millennium City 5 (apm) 创纪之城五期（apm） | tower | 187 | 84 | r15079295 |  |
| hkaiakowloon | AIA Kowloon Tower (Landmark East) 友邦九龙大楼 | tower | 192 | 60 | w237132081 |  |
| hkgrandcentral | Grand Central (Kwun Tong) 凯汇 | tower | — | 110 | w736456938 |  |
| hkmtrhq | MTR Headquarters Building 港铁总部大楼 | tower | 59.2 | 27 | w117538397 |  |
| hkskyline | Skyline Tower 宏天广场 | tower | 146.8 | 34 | w183005389 |  |
| ★hkchoihung ⚠ | Choi Hung Estate 彩虹邨 | estate | — | 180 | w109748434 | estate of 11 slab blocks: anchored on Chui King House near its middle; r 180 covers the estate |
| hk8cwbr | 8 Clear Water Bay Road 清水湾道8号 | tower | 186 | 35 | w831682314 |  |
| hktradeind | Trade and Industry Tower 工业贸易大楼 | tower | 87.4 | 41 | w385568445 |  |
| hkkaitakarena ⚠ | Kai Tak Arena 启德体艺馆 | stadium | — | 162 | w1339751141 | OSM building w1339751141 is named "Kai Tak Sports Park" (the arena block, 25 000 m2); the hkkaitakstadium model includes the sports-park podium next to it: check the overlay for clashes |
| hkhunghomferry | Hung Hom Ferry Pier 红磡码头 | pier | 7 | 42 | r14944631 |  |
| hkkwuntongpier | Kwun Tong Ferry Pier 观塘渡轮码头 | pier | 6.8 | 51 | w228400796 |  |
| hkplazahollywood | Plaza Hollywood 荷里活广场 | building | 31.8 | 100 | w158126084 |  |
| hkholytrinity | Holy Trinity Cathedral (Kowloon City) 圣公会圣三一座堂 | church | 29.7 | 19 | w293266061 |  |
| hkkcmarket | Kowloon City Municipal Services Building 九龙城街市 | civic | 20.9 | 68 | w691441930 |  |
| hkmanhattanplace ⚠ | Manhattan Place Manhattan Place | tower | 185 | 56 | w231521812 | footprint w231521812 matched by position only (OSM name: none) |
| hkkaitakyouth ⚠ | Kai Tak Youth Sports Ground 启德青年运动场 | stadium | — | 110 | w609099607 | OSM area w609099607 "Kai Tak Sports Park / Kai Tak Youth Sports Ground" (3.4 ha): model the stands and track; check against the hkkaitakstadium hull |
| hkrafhangar | Former Royal Air Force Hangar (Kai Tak) 前皇家空军飞机库 | heritage | 9.6 | 27 | w1442094004 |  |
| hklungtsun | Lung Tsun Stone Bridge remnants 龙津石桥遗迹 | heritage | — | 50 | w1298780332 |  |
| hkklncitycourts | Kowloon City Law Courts Building 九龙城法院大楼 | civic | 55.1 | 43 | w887885233 |  |
| hkmillennity | The Millennity The Millennity | tower | — | 60 | w1046149745 |  |

Neighbours already modelled within ~150 m of your keys (module folders to include in in-situ runs: `hkv_kowloon,kowlooneast,tst`): hkvharbourfront, hkvkerry, hkvmetropolis, hkvmetrotower, hkvmetroresidence, hkkaitakstadium, hkchilin, hknanlian, hkwalledcity, hkcoliseum, hkpolyu (site)

### hk50h — Sha Tin, Tai Wai, Fo Tan, Science Park, Tai Po (20 keys, 3 ★)

| key | name | kind | h (m) | r | osm | notes |
|---|---|---|---|---|---|---|
| ★hkntp | New Town Plaza 新城市广场 | building | 24.1 | 130 | w1467369753 |  |
| ★hksttownhall | Sha Tin Town Hall 沙田大会堂 | civic | 24.3 | 63 | w159044473 |  |
| hkstlibrary | Sha Tin Public Library 沙田公共图书馆 | civic | 14.5 | 33 | w32559156 |  |
| hkstgov | Sha Tin Government Offices 沙田政府合署 | civic | 72.6 | 56 | w136845733 |  |
| hklekyuenbr ⚠ | Lek Yuen Bridge 沥源桥 | bridge | — | 50 | w667422111 | OSM maps the bridge as an area polygon (w667422111, 1 100 m2) over the Shing Mun River channel; its deck path is in the refs roads |
| hkstrace | Sha Tin Racecourse Grandstands 沙田马场看台 | stadium | — | 200 | w775258661 |  |
| hksportsinst | Hong Kong Sports Institute 香港体育学院 | campus | 14 | 180 | w169412851 |  |
| ★hksciencepark | Hong Kong Science Park (Charles K. Kao Auditorium) 香港科学园（高锟会议中心） | civic | 23.7 | 60 | w135716424 |  |
| hkpwh | Prince of Wales Hospital 威尔斯亲王医院 | hospital | — | 140 | w297892935 |  |
| hktaofongshan | Tao Fong Shan Christian Centre 道风山基督教丛林 | religious | — | 80 | w380723040 |  |
| hkpavfarm | The Pavilia Farm 柏傲庄 | tower | 208 | 130 | w860396728 |  |
| hkfestivalcity ⚠ | Festival City 名城 | tower | 187 | 170 | w149908306 | footprint w149908306 matched by position only (OSM name: 第3座 Tower 3 / Tower 3 / 第3座) |
| hkroyalpark ⚠ | Royal Park Hotel 帝都酒店 | tower | 54.2 | 48 | r20088591 | OSM relation r20088591 carries the New Town Plaza name with the hotel: confirm the hotel block and keep off hkntp |
| hkrailmuseum | Hong Kong Railway Museum (Old Tai Po Market Station) 香港铁路博物馆 | heritage | — | 15 | w191372999 |  |
| hktpmanmo | Man Mo Temple (Tai Po) 大埔文武二帝庙 | temple | 6.8 | 15 | w111524373 |  |
| hktaipocomplex | Tai Po Complex 大埔综合大楼 | civic | 55.3 | 69 | w111508789 |  |
| hkroyalascot ⚠ | Royal Ascot 骏景园 | tower | — | 170 | w255994215 | footprint w255994215 matched by position only (OSM name: 第8座 Block 8 / Block 8 / 第8座) |
| hklekyuen | Lek Yuen Estate 沥源邨 | estate | — | 150 | w32589754 |  |
| hkpalazzo ⚠ | The Palazzo 御龙山 | tower | 133.1 | 130 | w255994237 | anchored on The Palazzo shopping centre at the middle of the estate; the 10 towers are separate OSM footprints within r 130 |
| hkriverpark | The Riverpark 溱岸8号 | tower | 149 | 80 | w261065223 |  |

Neighbours already modelled within ~150 m of your keys (module folders to include in in-situ runs: `hkx_nt,kowlooneast`): hk10kbuddhas, hk10kbuddhas_c, hk10kbuddhas_d, hkchekung, hkheritagemuseum, hkcuhk (site)


## Kit test notes (phase 1)

What was run once in phase 1 (27 Nov 2026) and what it printed (shortened):

- `node $K/near.js 22.27380 114.17330 300` → 2 existing models (hk41epaktai 115 m, hkhopewell 201 m); modules 22, LANDMARKS 265, SITES 13.
- `node $K/count_hk.js hk` → `hk modules 21 | LANDMARKS 265 labelled 192 | SITES 13 labelled 13 | total labelled 205` (the old `SC/lmx/count.js hk` reads `SC/hk`, a stale copy with 18 modules: same totals today, but it will not see `R/hk/hk50x`).
- `node $K/nstat.js R/hk/hkx_island/hkx_island.js hkhenderson,hktimessq` → `hkhenderson calls 9 tris 52996 ms 143 mats 9 rmax 27.4 / r 32 y -4.3 .. 193.7 / h 193 places 22.280159,114.162134,rot 0` …
  (`calls` counts primitive helper calls through `lmAdd`; modules that merge their own triangle arrays through `LTris` show few calls and many triangles.)
- `node $K/ndump.js R/hk/hkv41e/hkv41e.js hk41epaktai $K/test_pt.json && python3 $K/nrender.py $K/test_pt.json $K/test_pt.png 200 25 500` → 340 triangles, PNG checked.
- `python3 hkrefs50.py t_test2.json . testb` then `python3 $K/oplan.py $K/test_pt.json ref_testb.json hk41epaktai $K/test_oplan.png 80` → `hidden 1 (w258296447 Pak Tai Temple), CLASHES 0`; PNG checked (green model on the red footprint).
- `bash $K/mkpage_hk.sh kittest hk50zz,admiralty,central,wanchai` → `ok … js 5480247` (page + app script ≈ 5.6 MB in `SC/lm50/hk/site/`).
- `bash lm33/kit/browser.sh node lm50/hk/kit/appshot_hk.js t_kittest.html lm50/hk/shots/kittest '[["wc_d",22.2745,114.1725,450,32,200,12],["wc_n",22.2745,114.1725,450,32,200,20.5]]'`
  → `PAGEERR 0`, `lm_labels 25` (only the modules in HKLM), heap 894 MB, FAILED-URLS = the sibling-page probes `/sg.html /bay.html /tyo.html /gba.html /nyc.html /index.html` (404 + aborted) and `/favicon.ico` only — that is the expected set; the matching `console.error Failed to load resource` lines are those same probes. PNGs checked (Wan Chai, day and night).
  After that run the ready test was tightened (wait for the page's tile queue, collapse the tool panel, let each view's tiles finish), because the first shots were taken while the city was still streaming in. Second run (same command, `lm50/hk/shots/kittest2`): `PAGEERR 0`, same FAILED-URLS set, labels 25, heap 1120 MB, PNGs checked — but draining the whole map's queue (784 tiles) took 629 s in software GL, so the script now waits at most `WAIT` s (default 120) before moving the camera; each view still waits up to 30 s for its own tiles.
- Every page built for a test is ≈ 5.6 MB: delete `t_<name>.html` and `t_<name>-app.js` from `SC/lm50/hk/site/` afterwards.

