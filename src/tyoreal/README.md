# Tokyo 1:1 — data pipeline and build (City Brush v37)

Data: `tyodata/kanto.osm.pbf` (Geofabrik Kantō, 495 MB) and `tyodata/terrain/12_x_y.png` (AWS terrarium z12, x 3623–3642, y 1608–1621;
the main map uses x 3634–3641, y 1609–1616). Projection: x = (lon − 139.75)·90549.1, y = (lat − 35.66)·110952.7 (WGS84 metres per degree
at 35.66 N); the same square as Singapore / New York: HALF 28000 (lon 139.441–140.059, lat 35.408–35.912), CELL 25 (N 2240), terrain
TS 70 (TN 801), 2 km tiles (28 × 28). Traffic keeps left (as Singapore); Japan Standard Time (UTC+9, no daylight saving); the sun at
35.66 N 139.75 E; metric units.

## Test page (for the fuji agent and the integrator)
```
cd SC && bash tyoreal/mktyo.sh tyo ""          # -> sgreal/site/t_tyo.html (data in sgreal/site/tyodata/, no Tokyo landmark modules)
(setsid nohup bash lm33/kit/browser.sh env PAGE=t_tyo.html NEAR=35.6812,139.7671,2500 node lm20/kit/appshot.js tyoreal/shots/x '[["v",35.6812,139.7671,1600,24,200,12,"",6000]]' > tyoreal/shots/x.log 2>&1 &)
```
`EXTRA_MODS=lm33/fuji/fuji.js bash tyoreal/mktyo.sh tyofuji ""` adds a module after the Tokyo list (patch17's EXTRA_MODS).
`tyoreal/shots/shot.js` = lm20/kit/appshot.js that also logs every HTTP status ≥ 400 with its URL (`[http] 404 /...`).

## Stages (run from `tyoreal/`, outputs in `tyoreal/out/`; every memory-heavy step through `bash ../lm33/kit/heavy.sh`)
0. `osmium extract -b 139.38,35.35,140.12,35.97 -s simple kanto.osm.pbf -o out/tyo.osm.pbf` (275 MB; the `smart` / `complete_ways`
   strategies need > 3.5 GB on this file and were killed) and `osmium tags-filter kanto.osm.pbf r/type=multipolygon,boundary -o
   out/mp.osm.pbf` (25 MB: the multipolygon / boundary relations of all Kantō with their members — the long river, forest and city
   polygons reaching past the extract are complete there).
   - `b0a_bld.py` → bld_raw.npz + bld_tags.pkl: the buildings and building parts in compact arrays (float32 projected rings, offsets,
     OSM ids, building-value codes, the kept tags of the 1.4 M that have more than building=*). 4 139 818 in the square + 1 km.
   - `b0b_osm.py` → raw_{nodes,ways,areas,routes}.pkl (ways with projected numpy coordinates and a reduced tag set; way areas from
     tyo.osm.pbf, relation areas from mp.osm.pbf).
1. `b1_land.py` → land.pkl (coastline faces; rivers / lakes as fresh water; names: `ja_names.py`)
2. `b2_terrain.py` → terrain.pkl, fresh.pkl, 12 m rasters (sea floor ≥ −28 m, land ≤ 700 m); out/peak.json (highest point of the square:
   the Tama Hills at 35.635 N 139.469 E, 132 m). The terrarium tiles over Tokyo are a surface model (buildings and tree belts raise
   the city by 10–60 m: Odaiba read 20–60 m, the Marunouchi blocks 15–20 m), so the vertex heights get a grey opening over 630 m
   (9 × 9 vertices) and a light Gaussian smoothing: buildings, stadiums and tree belts go, valleys and the plateaus stay
   (Tokyo Station ~7 m, Shinjuku ~34 m, Shibuya ~30 m: its valley is narrower than the window). The opening runs over land
   only (the sea's depths would pull the coast down); land beyond a 48 m shore band (New York 84 m; the narrow piers and landfills of the bay) stays ≥ 1.5 m, clear of the sea surface
   (the low reclaimed bay land read ~0 m and the sea showed through it at a distance)
3. `b3_texture.py` → ground.webp, codes/lu.npy, landuse.pkl (Kantō palette, paddy fields); `b3b_speckle.py` bakes all roofs into ground.webp
4. `b4_roads.py` → roads.pkl (+ `cp out/roads.pkl out/roads_b4.pkl`, out/rail_ways_in.pkl); `b4b_tyodecks.py` → the bay bridges' decks
   (re-runnable: always starts from roads_b4.pkl)
5. `b5_buildings.py` → bldA.npz, bld_names.pkl (types, heights, colours; vectorized, chunked shapely 2 geometry; peak ~2.9 GB)
6. `b6_misc.py` → misc.pkl, pa.npy, rg.npy (districts, regions, labels, rail, stations, Haneda's runways and stands)
7. `b7_encode.py [HB AB] [--bld-only]` → tyo_bld0..6, tyo_roads, tyo_water, tyo_base (.gz). Buildings are encoded vectorized (a numpy
   token stream turned into varints; `_check_bld.py` decodes everything again and checks counts and byte use). Big buildings (bld0)
   = height ≥ HB or area ≥ AB or parts (default 30 m / 1500 m²).
8. `bash stage.sh` → `../sgreal/site/tyodata/tyo_*.txt` (gzip as base64) + ground.webp + tyo_cover.txt (`mkcover_tyo.py`: a copy of
   lm32/cover/mkcover.py with Tokyo in its city table). The fuji agent's `tyo_far*` files in the same folder are left alone.

Shared helpers: `common.py`, `raster.py`, `ja_names.py` (Chinese labels: name:zh-Hans / name:zh, else the Japanese name when it is all
kanji — Japanese shinjitai → traditional by a table, then opencc t2s; 駅 → 站; ヶ dropped and ノ → 之 between kanji (霞ヶ関 → 霞关, 虎ノ門 →
虎之门), 々 repeated — else a small dictionary of kana names (お台場 → 台场, 東京スカイツリー → 东京晴空塔 …), else the English name; English
from name:en, then name:ja-Latn / name:ja_rm), `tyo_lines.py` (the rail lines drawn; used by b4 and b6).

App: `mkengine.py` generates `app/tyoreal.js` + `app/tyostats.js` from the Singapore modules (as nycreal/mkengine.py: parts streaming, two-level
tile LOD, precomputed statistics, tree index, per-system trains; `const SGR_PATH = 'tyodata/'; const SGR_TYO = true;` — no SGR_US).
Tokyo specifics: near level of detail within 2.7 km (New York 4.3 km), far tiles without residential lanes / service roads / paths,
no street trees on residential lanes, Japanese train models (JR / Metro / private 20 m cars, Shinkansen 25 m × 16, AGT, monorail, trams),
elevated railway viaducts 9.5 m over the street (generic), the Sumida as the main river, the Tama Hills as the highest point.
`patch_tyo.py` (MODS, APP, apply) adapts the main code: titles, reset / Tokyo Station buttons, overview camera, block height caps
180 / 320 m, no Sentosa cable car, no street circuit (F1 free drive from Tokyo Station, keeping left), the ports (Ōi, Aomi, Honmoku,
Daikoku, Kawasaki), the sun at 35.66 N 139.75 E in JST, district label distances, street-running trams, shop-sign districts
(Yokohama Chinatown, Kabukichō, Asakusa, Akihabara, Ameyoko, Shin-Ōkubo, Shimokitazawa, Harajuku, Shibuya Center-gai …), 20 busy hubs,
and lm24/admin sees an unknown city (no Singapore stars). `CITY=tyo python3 ../sgreal/patch17.py ../city-brush-v16.html out.html`
builds it; Tokyo landmark modules: `../tyo/<k>/<k>.js`, `TYOLM=a,b` to choose (none yet).

## Size strategy (buildings)
OSM Japan maps almost every building: 3 995 109 footprints have their first vertex in the square (4.14 M with the 1 km margin; mean
7.0 vertices, median footprint 64 m²; 30 % carry a measured height — the PLATEAU / GSI imports —, 27 % storeys). Kept:
- footprints under 20 m² dropped (226 648: sheds, kiosks, carports), roof-only structures under 60 m² too;
- footprints simplified to 0.35 m (shapely 2, vectorized), 0.25 m quantization as in New York;
- estimated heights in 0.5 m steps and a low-entropy seed (0–15) on the small records (the decoder mixes the record index into its
  random numbers), so they gzip to ~15 bytes per building;
- small buildings in 6 part files (≤ 10.2 MB gzip each), the big ones (≥ 30 m or ≥ 1500 m², parts: 72 417) in bld0 (2.0 MB gzip);
- roads: paths that only duplicate a road's sidewalk (≥ 75 % within 9 m of a road centreline: 30 300), paths under 25 m, unnamed service
  roads under 40 m (driveways) and parking aisles are not encoded (615 454 → 393 687 records).

## Bridge decks (b4b_tyodecks.py) — road surface at mid-span, metres above the sea
Same method as New York: every bridge is one structure; all its OSM ways (both decks, both directions, the approach viaducts in its
corridor) share one profile along the bridge axis (crowned hump over each water stretch, falling at the approach grade outside it,
ramped from the ground at the structure's ends; Rainbow Bridge: no ground ends, its approaches stay ≥ 26 m like the generic Shuto
level). Sources (Japanese Wikipedia, checked 2026-10-16):

| bridge | source | upper / single | lower |
|---|---|---|---|
| Rainbow Bridge (レインボーブリッジ) | girder clearance 52 m (≥ 50 m required for the channel) | 61.5 (Shuto Daiba Route; gap 7.5 m: estimate) | 54.0 (Route 482, Yurikamome, walkways) |
| Tokyo Gate Bridge (東京ゲートブリッジ) | navigation clearance A.P. +54.6 m (A.P. ≈ 1.1 m below mean sea level) | 56.0 (+2.5 m deck: estimate) | – |
| Yokohama Bay Bridge (横浜ベイブリッジ) | clearance about 55 m | 65.0 (Shuto Bayshore Route; gap 8 m: estimate) | 57.0 (Route 357) |
| Tsurumi Tsubasa Bridge (鶴見つばさ橋) | "海面から路面までの高さ 57m" (sea to road surface) | 57.0 | – |
| Aqua-Line bridge section (アクアブリッジ, Umihotaru – Kisarazu) | no sourced height (raised near Umihotaru for a 2 000 GT channel) | generic sea-bridge rule (≤ 26 m) | – |

Everything else takes the generic b4 rule: 6.6 m per crossing level / OSM layer (the stacked Shuto Expressway; capped at 5 levels =
33 m), 6 m viaducts, ramps at 5.5 %. OSM Japan puts layer=1 on nearly every bridge, so over-water bridges also get the sea / river
rule when that is higher. Tunnels (the Aqua-Line tunnel, Yamate tunnel, subway tubes) are not drawn. Rail: elevated viaducts 9.5 m
over the street (generic, from the OSM bridge tags); tracks within 25 m of a bay-bridge deck (≥ 40 m) take that deck (the Yurikamome
on the Rainbow Bridge's lower deck, 54 m).

## Rail (tyo_lines.py, b6)
Generic from the OSM route relations (train, subway, light_rail, monorail, tram) that run ≥ 1.2 km inside the square; services are
not lines: relations named only in kana (はやて, さざなみ …), "… 列車", through services (直通), liners, airport / sky-access
expresses, freight (臨海鉄道), combined services of private railways (京成本線・千葉線 …) and short shuttles are skipped; one line per
(system, name without service type / direction). Colours from the relations' `colour` (defaults where none: JR #7A8A7A, private
#A08070). The Tōkaidō Shinkansen has no line relation in this extract: its のぞみ / ひかり / こだま service relation is drawn as the line.
93 lines drawn (336 parts): 20 JR, 2 Shinkansen (Tōhoku, Tōkaidō), 9 Tokyo Metro, 7 Toei / third-sector subways (incl. Minatomirai,
Saitama Rapid, Tōyō Rapid), 2 Yokohama Municipal Subway, 47 private railway lines (Tōkyū, Keiō, Odakyū, Seibu, Tōbu, Keisei, Keikyū,
Sōtetsu, Hokusō, TX, Rinkai …), 2 AGT (Yurikamome, Nippori-Toneri Liner), 2 monorails (Tokyo Monorail, Disney Resort Line), 2 trams
(Toden Arakawa, Tōkyū Setagaya). 988 stations (matched to lines within 90 m, by operator family). Overlapping track of one system is
drawn once.

## Results (v37 build, 2026-10-17)
- Buildings: 3 757 721 records (1 213 317 with a measured height or storeys, 2 544 404 estimated) incl. 38 951 building parts of
  17 226 buildings; types: 2.97 M houses, 641 k apartments, 41 k shops, 4 k offices + business-district offices / shops, 42 k
  industrial, 40 k civic … 851 buildings ≥ 100 m, 93 ≥ 200 m; tallest: Tokyo Skytree 634 m (a tower: landmark later), Tokyo Tower 333 m,
  Azabudai Hills Mori JP Tower 325 m, Yokohama Landmark Tower 296 m, Toranomon Hills Station Tower 266 m. Statistics (precomputed):
  3.70 M counted buildings, 1 803 km² floor area, ~19.2 M residents, ~6.3 M jobs.
- Roads: 393 687 records (648 142 merged lines before the filters and clipping; 3.1 M vertices), 6 657 names; 60 600 elevated lines
  (Shuto Expressway and bridges), 52 deck lines on the 4 bay bridges + 67 joining ramps. Water: sea 4 448 vertices (Tokyo Bay),
  1 347 fresh water bodies (the rivers — Sumida, Arakawa, Tama, Edogawa, Naka, Tsurumi … — and ponds), 2 946 pools.
- Rail: 93 lines (336 drawn parts), 988 stations; Haneda's 4 runways (A, B, C, D) and 108 stands at its terminals.
- Districts: 254 (175 neighbourhoods inside the 23 special wards as Voronoi cells of the well-known place nodes, clipped by their ward;
  the designated cities' wards; the other cities and towns), 81 regions (the 23 wards and the municipalities); 1 730 places,
  3 000 POIs, 36 named waters.
- Staged data (`sgreal/site/tyodata/`, base64 of gzip): tyo_base 2.8 MB, tyo_bld0 2.7 MB, tyo_bld1..6 13.3 / 13.3 / 13.5 / 13.6 / 13.6 /
  13.3 MB, tyo_roads 9.1 MB, tyo_water 1.3 MB, tyo_cover 6.6 MB, ground.webp 4.8 MB — 107.8 MB in all (+ the fuji agent's tyo_far*),
  largest file 13.6 MB.
- Browser (headless Chromium, software GL, 2 shared CPUs; `shots/memprobe.js`, performance.memory after a forced GC): full map — all
  784 tiles built 112 s after opening (New York 168–228 s), the six small-building files in after 621 s. JS heap: 1911 MB after the
  start tiles, 1974 MB with all parts, 2068 MB at a Marunouchi close view, 2125 MB at a Shinjuku close view, 1868 MB in the overview
  (V8 heap proper 424–511 MB, as New York's 366–434 MB; the rest is typed-array backing stores). That is ~30 % above New York
  (1477 / 1547 / 1605 / 1429 MB). Scene geometry at the start: 700 MB (New York 565 MB); the remaining difference sits in typed arrays
  of the shared modules that scale with the road and building counts. What was done for it: far tiles without residential lanes /
  service roads / paths (−226 MB at the start), near level of detail within 2.7 km instead of 4.3 km, no street trees on residential
  lanes, the road filters above (−50 MB). Overview frame: 1406 draw calls, 13.7 M triangles; Marunouchi at 1.5 km: 178 calls, 6.8 M.
  `?near=` Tokyo Station 5.2 km: tiles in 69 s, all parts in another 357 s.

## Testing
```
cd SC && bash tyoreal/mktyo.sh tyo ""
(setsid nohup bash lm33/kit/browser.sh bash tyoreal/shots/run_shots.sh > tyoreal/shots/run_shots.log 2>&1 &)     # the screenshot sets A-D + full map
(setsid nohup bash lm33/kit/browser.sh env PAGE=t_tyo.html VIEWS=1 node tyoreal/shots/memprobe.js > tyoreal/shots/mem.log 2>&1 &)   # heap
```
Views: `shots/views_{A,B,C,D,full}.json` (A Tokyo Station / Ginza / Rainbow Bridge / Odaiba / night, B Shinjuku / Shibuya / Harajuku,
C Haneda / Tsurumi Tsubasa, D Minato Mirai / Yokohama Bay Bridge, full: overview, the bay, the skyline from the bay).
Zero page errors. The test server answers 404 for favicon.ico and for the map switch's probes of the other cities' pages
(sg.html, bay.html, nyc.html, hk.html, index.html: sgreal/app/cityswitch.js looks for cities published next to the page; they exist
only in the published artifacts).

## Known issues
- The heap is ~30 % above New York's (see Results).
- The city-aware modules (lm24/fly places, lm30/nav, lm25/cityrace tracks, lm28/army, lm25/kaiju spawn places, lm20/f1d start places,
  lm20/wx climate, lm20/audio, lm20/traffic vehicles) do not know Tokyo yet and fall back to Singapore's tables (their Singapore lat/lon
  places land outside the map); lm24/admin is switched off for Tokyo (it drew Singapore's seats of government in metres).
- Building heights: 68 % are estimated (land use, footprint, type; business-district boxes make mid-rise buildings offices / shops);
  OSM Japan's land use is sparse (residential land use on 2 % of the cells), so many unmapped mid-rise blocks are typed apartments.
- Terrain: the surface model's opening keeps narrow valleys a little high (Shibuya station ~30 m instead of ~15 m) and puts the
  reclaimed bay land and the zero-metre zone east of the Sumida at the 1.5 m floor.
- Bridge decks: only the four bay bridges have sourced heights; the Aqua Bridge keeps the generic sea rule; Rainbow / Gate / Bay Bridge
  deck gaps and deck structure depths are estimates. Until landmark models exist the bay bridges show the road module's generic piers.
- Rail: lines come from OSM route relations; where a line has no colour tag it is drawn in a default (JR grey-green, private brown);
  the Tōkaidō Shinkansen is drawn from its のぞみ service relation; overlapping through-service tracks of different systems are drawn
  once per system.
- Stations with several operators appear once per operator (e.g. Tokyo: JR and the Marunouchi Line).

## Screenshots (v37 build; `tyoreal/shots/final_*`, NEAR test pages: tiles beyond the NEAR radius are not built)
- `final_A/marunouchi.png` — Ōtemachi / Marunouchi towers, Tokyo Station, the Shuto C1 Inner Circular Route, the Imperial Palace moat
- `final_A/ginza.png` — Ginza, Kabuki-za, Harumi-dōri, the elevated Yamanote / Keihin-Tōhoku tracks at Yūrakuchō
- `final_A/odaiba_top.png` — Daiba / Odaiba from above: the Rainbow Bridge's Daiba approach loops, the Yurikamome, Odaiba beach, the Daiba forts
- `final_A/rainbow_bridge.png` — the Rainbow Bridge from Shibaura (afternoon)
- `final_A/marunouchi_night.png` — Marunouchi at night
- `final_B/shinjuku_west.png` — the Nishi-Shinjuku skyscrapers from the east (Shinjuku Station, Kōshū Kaidō)
- `final_C/haneda.png` — Haneda: four runways, taxiways, terminals and parked aircraft
- `final_D/minatomirai.png` — Minato Mirai 21: Landmark Tower, Cosmo World, Pacifico, Rinkō Park
- `final_D/bay_bridge.png` — the Yokohama Bay Bridge at dusk
- `final_full/overview.png`, `final_full/skyline_from_bay.png` — the whole map with the ward / city labels and populations; Kōtō /
  Toyosu / Harumi from over the bay at dusk

## Landmark kit (v37 phase B preparation)
- `b9_targets.py` → `../tyo/targets.json`: 84 targets in 11 groups (marunouchi 7, palace 7, ginza 7, minato 8, asakusa 10, shibuya 7,
  shinjuku 6, ueno 6, bay 9, airport 6, yokohama 11; keys `ty…`). It asserts that every target's OSM building / area id exists in this
  build (bld_raw.npz / raw_areas.pkl). Point targets (`n:lat,lon`): Nijūbashi, Shibuya Crossing, Akihabara, Rainbow Bridge,
  Tokyo Gate Bridge.
- `b9_refs.py` → `../tyo/ref_<group>.json` (footprints, parts, roads with deck heights, POIs, terrain around each target).
- `tools/find.py 'regex' …` searches the OSM buildings / areas (NODES=1: nodes too) by name; it prints ids for b9_targets.
- `kit/` is the in-situ harness on the Tokyo data (copied from hkreal/kit and reading tyoreal/out/tyo_*). Smoke test:
  `kit/test/kittest.js` (a block on Kaminarimon) → `kit/test/shots/`, 0 page errors.
- Brief for the model authors: `../tyo/BRIEF.md`.

## Road labels without a name
Many Shuto Expressway pieces carry only a ref (C2, B, K1 …). b7 names them after the other pieces with the same ref (495 pieces),
and the engine's road label falls back to the ref alone (it printed "null C2" before). The staged base was checked: no string
contains null / undefined / None / NaN, and every label entry has en and zh.

## Road levels (v37 fix after the landmark authors' report)
- **Layer-aware level loop** (`b4_roads.py`): a bridge is put above a crossing bridge only when its OSM layer is higher, or the
  layers are equal and it ranks after it (class priority, length). Before, the New York rule (class priority, length) ignored the
  layer, so short street bridges went ABOVE the Shuto Expressway: Chūō-dōri at Nihonbashi read 27 m over the C1 at 20.4 m, and
  their ramps lifted Shōwa-dōri and local streets to 20–33 m. 9 484 lines changed by more than 1 m (9 282 lowered); 5 490
  streets that ramps had lifted are flat again.
- **Low bridges.** A layer ≤ 1 bridge mostly over water (a river or canal bridge) is a low bridge: level 0, and the river / sea
  rules give its height. A layer ≤ 1 footway bridge that crosses no road or rail (over a stream, a pond or nothing) is a low
  deck: 1.2 m over water, else flat (3 510 lowfoot).
- **Railways.** Railway viaducts (plain rail at level ≤ 1) sit at 9.5 m, as in the rail layer. The Tōbu line beside the Skytree
  Town is at 9.5 m (it read ~33 m before).
- **Ramps.** b4b's ramps from the bay bridges' ends no longer lift a stacked Shuto viaduct (it keeps its own level).
- **Landmark deck fixes.** They run after b4b_tyodecks.py: `../tyo/marunouchi/nihonbashi_deck_fix.py` (road at 4.5 m over the
  river), `../tyo/bay/gate_deck_fix.py`, `../tyo/yokohama/bb_deck_fix.py`. Then b6_misc.py, b7_encode.py, stage.sh.
- **Verified.** Rainbow 61.6 / 54.1. Gate Bridge symmetric, 56.1 at mid-span (main piers 54.4 / 54.6). Bay Bridge lower =
  upper − 8.0 ± 0.1 m between the anchor piers.

## v39 integration (v38 landmark groups tyx_central, tyx_west, tyx_north; 2026-10-28)
- Modules: 14 (`tyo/<k>/<k>.js`). `node lmx/count.js tyo`: 117 LANDMARKS + 16 SITES, 114 labelled before `tyoreal/app/tyo_post.js`
  unlabels the sub-keys tymetgympool, tymetgymsub, tyyebisuchateau → **111 labelled keys** (v37: 84). No key placed twice, none defined
  in two modules.
- Superseded v37 blocks removed (backups `*.v39.bak`): SITES tycrossing, tymeijijingu, tystadium in `tyo/shibuya/shibuya.js` and tygyoen
  in `tyo/shinjuku/shinjuku.js` (with their site data); in `tyo/ueno/ueno.js` the Ueno Park site no longer draws or labels Kiyomizu
  Kannon-dō and Ueno Tōshō-gū (landmarks tykiyomizu / tytoshogu now) nor the National Museum of Western Art label (tywesternart).
- OSM labels dropped (`tyo_post.js`, TYO_DROP_LABELS, by English name + position): POIs "MUFG Stadium" (naming-rights name of the
  National Stadium) and "New National Stadium" (r10071391), "Meiji Jingu Main Shrine" at the south gate, "Hama-rikyu Gardens"
  (POI and place) under the site label.
- Intro cards (`lm33/info_tyo`, labelled.js → build.js → info_tyo.js, `node validate.js` clean): +27 entries for the new labelled
  keys, `site:tyhamarikyu`, and 3 parent links for the renamed tyx_west site-building labels; 165 entries.
- Build: `bash tyo39/build39_tyo.sh` → `pub39/tyo/index.html` (+ `pub39/tyo/tyodata/`, hard links to `sgreal/site/tyodata/`); the
  staged data are unchanged since v37 (no deck fixes in the v38 groups).
