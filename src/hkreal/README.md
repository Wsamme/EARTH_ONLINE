# Hong Kong 1:1 — data pipeline and build (City Brush v37, phase A: the base city)

Data: `hkdata/guangdong.osm.pbf` (Geofabrik Guangdong: Hong Kong, Macau, Shenzhen …; read whole, filtered to the square),
`hkdata/terrain/12_x_y.png` (AWS terrarium z12, x 3342–3350, y 1783–1790).
Projection: x = (lon − 114.12)·103014.2, y = (lat − 22.34)·110734.9 (WGS84 metres per degree at 22.34°); square HALF 28000
(56 × 56 km, lon 113.848–114.392, lat 22.087–22.593), CELL 25 (N 2240), terrain TS 70 (TN 801), tiles 2 km (28 × 28).
Traffic keeps left (the Singapore engine's default); Hong Kong Time (UTC+8, no daylight saving: lm32/clock's `hk` zone); the sun
at 22.34 N 114.12 E (lm20/light's site table, patched); metric units. Shenzhen (and the other mainland land in the square) is
foreign context like Johor in the Singapore build: muted land (code 5), only roads of class ≤ 10 (flag 8), and its skyline as
type-14 buildings (flag 32): only buildings ≥ 40 m or ≥ 3000 m² are kept. Hong Kong / foreign = the OSM Hong Kong SAR boundary
(relation 913110, admin_level 3).

Stages (run from `hkreal/`, outputs in `hkreal/out/`; memory-heavy ones through `lm33/kit/heavy.sh`):
1. `b0_osm.py` → raw_{nodes,ways,bld,areas,routes}.pkl (the whole Guangdong file, 2 min, ~1.2 GB peak)
2. `b1_land.py` → land.pkl (coastline faces; split by the SAR boundary into `sg` = Hong Kong land, `foreign`, `all`; sea areas
   mapped as water circles — Crooked Harbour, Rocky Harbour … — are dropped)
3. `b2_terrain.py` → terrain.pkl, fresh.pkl, 12 m rasters. **The DEM carries the towers** (SRTM-based here: Tsim Sha Tsui read
   ~44 m, Wan Chai ~67 m, the airport platform ~19 m). Bare-earth estimate: despike, then where the OSM building coverage (plus the
   aerodrome) is ≥ 5 % (full weight at 17 %) the surface is replaced by a land-only grey opening (21 × 21 px ≈ 740 m, lowering at
   most 80 m): it removes bumps narrower than that and keeps planar slopes (the Mid-Levels); the country parks' hills are untouched.
   After: TST 9.9 m, Mong Kok 6.8, Causeway Bay 8.0, Sha Tin 5.6, the Peak 535 m, Tai Mo Shan 934 m (957 m real; 70 m grid).
4. `b3_texture.py` → ground.webp, codes/lu.npy, landuse.pkl (subtropical palette; land use inside Shenzhen only for green / beach /
   airport, all muted 60 % towards grey); `b3b_speckle.py` bakes the roofs into ground.webp
5. `b4_roads.py` → roads.pkl (+ `cp out/roads.pkl out/roads_b4.pkl`); `b4b_hkdecks.py` → the big bridges' decks (re-runnable),
   then `python3 ../hk/bridges/tm_deck_fix.py` (the bridges author's Tsing Ma profile: one vertical curve over the main span, a
   smooth Ma Wan side span meeting the Lantau Link viaduct at 54.0 / 47.5 m — no step at the abutment)
6. `b5_buildings.py` → buildings.pkl (see Buildings); then `b6_misc.py`, `b7_encode.py`, `stage.sh`, `b8_cover.py`
7. `b6_misc.py` → misc.pkl, pa.npy, rg.npy (neighbourhoods, districts, labels, rail, stations, the ropeway, runways, stands)
8. `b7_encode.py [HB AB]` → hk_bld0, hk_bld1, hk_roads, hk_water, hk_base (.gz); `b7r_roads.py` roads only; `b7b_base.py` labels /
   rail only. `bash stage.sh` → `../sgreal/site/hkdata/hk_*.txt` + ground.webp. `b8_cover.py` → `../sgreal/site/hkdata/hk_cover.txt`
   (runs lm32/cover/mkcover.py's New York / Bay branch on hkreal/out, Shenzhen polygons muted like the texture; lm32/detail loads
   `<prefix>_cover.txt`).

9. Landmark prep: `b9_targets.py` → `../hk/targets.json` (93 targets in 11 groups, each resolved against the OSM extract:
   footprint centroid, OSM id, area, heights); `b9_refs.py [groups]` → `../hk/ref_<group>.json` (real footprints / parts / roads
   with deck heights / POIs / a terrain grid around every target). Authors' brief: `../hk/BRIEF.md`; in-situ harness: `kit/`
   (as nycreal/kit, on hkreal/out; smoke test in `kit/test/`). `tools/findnames.py 'regex'` searches the extract by name.

Shared helpers: `common.py`, `raster.py`, `hk_names.py` (names: English from `name:en` or the Latin part of a bilingual `name`;
Chinese from `name:zh-Hans`, else `name:zh` / `name:zh-Hant` / `name:zh-HK` / the Chinese part of `name`, converted with OpenCC
`hk2s`, e.g. 青馬大橋 → 青马大桥, 彌敦道 → 弥敦道; Shenzhen names are Simplified already), `hk_lines.py` (the rail lines).

## Rail (hk_lines.py, b6)
All route relations of a line are chained (both directions, branches); overlapping track of one group is drawn once. Colours are
the OSM relations' `colour` tags: MTR East Rail #53b7e8, Tuen Ma #923011, Tsuen Wan #ed1d24, Kwun Tong #00ab4e, Island #007dc5,
Tseung Kwan O #7d499d, Tung Chung #f7943e, Airport Express #00888a, South Island #B6BD00, Disneyland Resort #f173ac; Light Rail
12 routes with their route colours (751P is #000000 in OSM and kept); the trams one network (the Shau Kei Wan – Kennedy Town
route's #5D3379, street-running: rails in the road); the Peak Tram (no OSM colour: a neutral #7a6a5a; it follows the slope);
Shenzhen Metro 17 lines faded 55 % towards grey (almost all underground in the square). Codes: the MTR abbreviations (EAL …),
L505 … (Light Rail), TR, PK, Z1 … (Shenzhen). Trains per system (hkreal.js `SGR_TRAIN`): MTR 8 cars of 22.5 m (SIL 3, DRL 4, AEL
8 at 28 m/s), Light Rail 2 × 20 m, trams 1 × 13 m, Peak Tram 2 cars, Shenzhen 6 × 19 m. Tracks within 25 m of a raised road deck
take the lowest deck (the Airport Express / Tung Chung Line inside Tsing Ma's and Kap Shui Mun's lower decks).
The Ngong Ping 360 ropeway (OSM aerialway way, simplified to its 4 stations: Tung Chung, the Airport Island and Nei Lak Shan
angle stations, Ngong Ping) replaces the Singapore Cable Car (`base.ropes`, patch_hk.py): spans between the stations with the
engine's generic towers, terminals 12 m and angle stations 22 m above the ground (generic, not sourced). No generic station box at
the Nei Lak Shan angle point (its landmark model hknp360angle_b stands on the real footprint, ~75 m away).

## Bridge decks (b4b_hkdecks.py) — road surface at mid-span, metres above the water
All OSM ways of a bridge (matched on `name` / `bridge:name`, both directions and levels, approach viaducts within 70 m of its
axis) share one profile along the axis (as in nycreal). Sources: Structurae (structurae.net), Wikipedia, and the Marine
Department's "height restrictions" leaflet (mardep.gov.hk hps_bridge.pdf: maximum vessel heights) and the 2017 LegCo brief on
the HZMB / TM-CLK navigation restrictions (checked 2026-10-16). The MD limits are 5 m under the published clearances where
both are known (Tsing Ma 62 / 57, Stonecutters 73.5 / 68.5), so "limit + 5 m" is used as the underside where no clearance is
published; deck depths are estimates unless given.

| bridge | upper / single | lower | basis |
|---|---|---|---|
| Tsing Ma | 69.5 | 63.0 (rail, typhoon lanes) | clearance 62 m (Structurae; Wikipedia gives the 53 m official restriction of the time; MD now 57 m); truss ~7.5 m est. |
| Kap Shui Mun | 54.5 | 48.0 | clearance 47 m, deck depth 7.46 m (Structurae); MD 41 m |
| Lantau Link across Ma Wan | ~54 level | ~47.5 | estimate: level between the two bridges, ramps only at Tsing Yi and Lantau |
| Stonecutters | 77.0 | – | clearance 73.5 m (Wikipedia, Structurae); box ~3.5 m est.; approach: Ngong Shuen Chau / East Tsing Yi viaducts |
| Ting Kau | 61.0 | – | MD 53 m + 5 m margin + ~3 m deck (estimate) |
| Cheung Tsing | 24.5 | – | MD 17 m (Tsing Tsuen / Tsing Yi bridges area) + 5 + 2.5 (estimate) |
| Ap Lei Chau | 21.5 | – | MD 14 m + 5 + 2.5 (estimate) |
| Tseung Kwan O Cross Bay Bridge | 24.5 | – | MD 17 m at its main span + 5 + 2.5 (estimate) |
| HZMB Hong Kong Link Road | 16.0 level | – | MD / LegCo 10–12 m over most of it + ~5 (estimate); its three 41 m navigation arches are not placed |

Shenzhen Bay Bridge, the Tuen Mun – Chek Lap Kok Link southern viaduct and all other bridges keep the generic b4 rules (sea
bridges 3 m + 3 % of the water length, ≤ 26 m; 6.6 m per crossing level for flyovers; 6 m viaducts; footbridges 5.6 m; ramps
5.5 %). Tunnels (Cross-Harbour, Western / Eastern Harbour, Tai Lam, TM-CLK northern tunnel, the MTR tubes) are not drawn.

## Buildings (b5_buildings.py)
OSM: 158 620 footprints in the square; 45 % carry `building:levels` (some `height`). Levels × 3.1 m (+1 m roof) — Hong Kong
towers are ~2.9–3.15 m floor to floor. Untagged buildings get a height drawn (by a per-building hash) from the measured
distribution of the tagged buildings of the same kind (`building=` value) and size class, Hong Kong and Shenzhen separately
(127 classes with ≥ 30 samples), so estate towers stay towers; the rest fall back to the template's estimates. **v37b (2026-10-17): the
estimate is local** — from the measured buildings of similar footprint (× 2.5) within 500 m when there are ≥ 8 (46 379 buildings),
else the class draw capped at the neighbourhood's 90th percentile (≥ 12 m; 15 m with no measured neighbours); caps: < 150 m² 12 m,
< 400 m² 30 m (unless the similar neighbours' median is above 30 m), < 60 buildings within 500 m / parks / the aerodrome 15 m,
forest cells 12 m, school / hospital land 35 m. 36 701 heights changed (23 290 lowered, 13 411 raised): e.g. the Ngong Ping
toilet 72 → 12 m, the Limousine Lounge at T1 85 → 15 m, the Happy Valley infield 88 → 15 m. New Territories
village houses (`building=house`, 3 storeys) get flat roofs (type 2). Business districts (Central / Admiralty / Wan Chai north,
Causeway Bay, Quarry Bay, TST, West Kowloon, Kowloon East): towers are offices. Building parts (3 445 of 1 239 buildings) stack.
Statistics: residents from floor area at ~21 m² gross per resident (Hong Kong flats ≈ 16 m² per person) → 7.5 million.

## Results (2026-10-16)
- Buildings: 128 454 kept (117 011 Hong Kong + 11 443 Shenzhen skyline; 23 117 smaller Shenzhen ones dropped); heights: 64 713
  from levels, 3 076 measured, 83 453 empirical draws, 329 estimates. Tallest: ICC 484 m, Two IFC 415.8, The Center 346, Nina
  Tower 318, Central Plaza 309, One Island East 298.4; Shenzhen: Ping An Finance Center 599.1 m, China Resources Tower 392.5.
  4 138 Hong Kong buildings ≥ 100 m. Encoded: 46 409 big records (≥ 20 m, ≥ 900 m², parts) in hk_bld0, 84 590 small in 1 part.
- Roads: 153 352 merged lines → 128 993 records (9 451 Shenzhen, 23 318 Shenzhen minor roads dropped), 6 275 names; ~92 deck lines
  on the 9 named structures + ~100 joining ramps. Water: sea 66 k vertices, 1 117 fresh bodies (reservoirs, fish ponds), pools.
- Rail: 41 lines (32 with drawn parts after deduplication, 261 parts): 10 MTR, 12 Light Rail, trams, Peak Tram, 17 Shenzhen Metro;
  354 stations (96 MTR, 70 Light Rail, 6 Peak Tram, 182 Shenzhen Metro). Ropeway: Ngong Ping 360. HKIA: 3 runways (3 799, 3 974,
  4 224 m segments in OSM), 81 stands. Districts: 249 (210 Hong Kong neighbourhoods = Voronoi cells of the suburb / town / quarter
  places inside each of the 18 districts, 39 Shenzhen subdistricts); regions: the 18 districts + 7 Shenzhen districts; 2 600
  places, 3 000 POIs, 482 named waters (Victoria Harbour added by hand: it has no named water area in OSM).
- Staged data (`sgreal/site/hkdata/`, base64 of gzip): hk_base 1.86 MB, hk_bld0 2.19 MB, hk_bld1 1.70 MB, hk_roads 3.58 MB,
  hk_water 1.74 MB, hk_cover 3.32 MB, ground.webp 1.68 MB — 16.1 MB in all, largest file 3.58 MB (New York: 57 MB).
- Browser (headless Chromium, software GL, 2 shared CPUs; JS heap = `performance.memory` after a CDP GC): full map ready (784
  tiles) in 106–108 s, the small-building part in at 214 s; heap 918 MB after the start tiles, 945 MB with the part, 962 MB at a
  Central close view, 874 MB in the overview (V8 heap proper 222–229 MB). `?near=` Central 3 km: ready 46 s, 685 MB. Overview
  frame: 1 060 draw calls, 7.0 M triangles; Kwai Tsing at 2.6 km: 240 calls, 7.6 M; Central harbour front: ~120 calls, 4.2 M.
  Zero page errors in all runs.

## Known issues
- The DEM correction is a filter, not survey data: the Central / Wan Chai hillside streets stay ~10–20 m too high in places,
  reclaimed waterfronts and the airport platform sit at ~0.2 m instead of their 4–7 m; Lion Rock reads ~400 m on the 70 m grid
  (495 m real), Tai Mo Shan 934 m (957 m).
- Deck heights partly estimated (table above); the HZMB link road's three high navigation arches are not modelled; elevated
  ramps on the Lantau end of the Lantau Link follow OSM `layer` with the generic 6.6 m rule; until landmark models exist the big
  bridges show the road module's generic piers.
- Building heights: 65 % of the Hong Kong buildings have measured levels or heights; the rest are statistical (the right height
  class, not the right building). Shenzhen untagged buildings are drawn the same way, so its skyline is plausible, not exact.
- Modules still keyed to Singapore here (they fall back to 'sg'): the flight places (lm24/fly), city-race curated routes, kaiju
  exits, the weather (tropical) and sound; the admin stars (lm24/admin) are off (no Hong Kong data: patch_hk makes admCity 'hk').
  Left-hand traffic and the nav module's left-hand drive come from the same fallback and are correct for Hong Kong.
- Cranes on the Kwai Tsing quays come from the engine's generic port builder (sgPort: coast segments next to industrial land
  inside two boxes; `man_made=container_terminal` is industrial in b3). sgPort's quay test read the old 20 m Singapore land-use
  grid (`sgLU(x, y) >> 2 === 3`), which never matches the real maps' N × N raster; patch_hk.py tests `SG.lu[k] === 3` at the
  same cell instead (the other real-map builds probably have the same dead test — for the integrator).
- The map switch shows Hong Kong pressed; its probes for sibling pages 404 in a test page (they exist only when published).

## Testing
```
cd SC && bash hkreal/mkhk.sh hk ""                    # sgreal/site/t_hk.html (no Hong Kong landmark modules yet)
(setsid nohup bash lm33/kit/browser.sh env PAGE=t_hk.html NEAR=22.2900,114.1650,4000 node lm20/kit/appshot.js hkreal/shots/c1 "$(cat hkreal/shots/views_c1.json)" > hkreal/shots/c1.log 2>&1 &)
(setsid nohup bash lm33/kit/browser.sh env PAGE=t_hk.html node lm20/kit/appshot.js hkreal/shots/full1 "$(cat hkreal/shots/views_full.json)" > hkreal/shots/full1.log 2>&1 &)
(setsid nohup bash lm33/kit/browser.sh env PAGE=t_hk.html VIEWS=1 node hkreal/shots/memprobe.js > hkreal/shots/mem_full.log 2>&1 &)   # heap + failed requests
```
The only failed requests are the map switch's probes for the sibling pages (sg.html, bay.html, nyc.html, tyo.html, index.html:
they exist only in a published artifact) and favicon.ico.
