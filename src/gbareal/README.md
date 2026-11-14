# gbareal — Dongguan + Shenzhen + Hong Kong in one map (City Brush, prototype 2026-10-28)

A copy of hkreal's pipeline and engine generator for one continuous map from Dongguan through Shenzhen to Hong Kong. hkreal/, hk/,
the Hong Kong release and the other cities are not touched (gbareal reads hkreal/mkengine.py, hkreal/patch_hk.py, sgreal/patch17.py
and the hk/ deck-fix scripts, and writes only gbareal/, sgreal/site/gbadata/ and sgreal/site/t_gba.html).

## Frame and grids (common.py)
- Projection: Hong Kong's (x = (lon − 114.12)·103014.2, y = (lat − 22.34)·110734.9) moved by a whole number of tiles:
  **x_gba = x_hk + 7000, y_gba = y_hk − 35000** (HK_DX, HK_DY). Origin lon 114.0520475, lat 22.6560705; metres per degree unchanged.
- Square: HALF 63000 (126 × 126 km, lon 113.4405–114.6636, lat 22.0871–23.2249). Hong Kong's square is tiles tx 21–48, ty 0–27; its
  2 km tile edges, 70 m terrain vertices and the cells all coincide with the Hong Kong map's (HALF 63 km: 2·HALF is a multiple of
  2000 and 70; the shift is ≡ 7000 mod 14000), and Hong Kong's southern edge (22.087 N) is the square's.
- CELL **50 m** (N 2520, 6.35 M cells; Hong Kong 25 m, N 2240, 5.0 M): the engine allocates ~55 bytes per cell (zones, nat, slope,
  distances, SATs, overlays …); 25 m over 126 km would be 25.4 M cells ≈ 1.4 GB. TS 70 m (TN 1801, 3.24 M vertices), 2 km tiles
  (63 × 63 = 3969). Fine water / land rasters 25 m (Hong Kong 12 m). Ground texture 4096 px = 30.8 m/px (Hong Kong 13.7 m/px;
  lm32/detail draws the vector cover sharp within ~8 km of the camera).
- Regions (b1, land.pkl): 0 Hong Kong (relation 913110), 1 Shenzhen (深圳市 3464353 minus 深汕特别合作区), 2 Dongguan (东莞市 3464319),
  3 other = context (Macau, Zhuhai, Zhongshan, Guangzhou-Nansha, Huizhou: muted land, roads ≤ class 10, buildings ≥ 40 m or ≥ 3000 m²).
  'sg' / non-foreign = Hong Kong + Shenzhen + Dongguan: all buildings, all roads, land use, labels.

## Data
- OSM: data/gba.osm.pbf = `osmium extract -b 113.48,22.08,114.67,23.22 --strategy=complete_ways hkdata/guangdong.osm.pbf` (76 MB).
- DEM: SC/gbadata/terrain (terrarium z12 x 3338–3353, y 1775–1790, 256 tiles, fetched by the coordinator once s3 was allowed;
  the 72 Hong Kong tiles are hard links). The square needs x 3338–3352, y 1776–1790 (225); all present, so the flat-placeholder
  fallback in b2 (land 3 m, water 2 m, 700 m blend; terrain.pkl 'demok', base 'demGap') is inactive (0 gap cells).
- tools/count.py → data/count.json, data/bcent.npz, data/regions.pkl: OSM content per region (below).

## Stages (cwd gbareal/, each through `bash gbareal/run.sh <stage>` = lm33/kit/heavy.sh)
b0_osm → b1_land → b2_terrain → b3_texture → b4_roads (+ `cp out/roads.pkl out/roads_b4.pkl`) → b4b_hkdecks →
`tools/hkfix.py ../hk/bridges/tm_deck_fix.py` (moves its Tsing Ma axis by HK_DX/HK_DY) → `tools/hkfix.py ../hk/hkx_nt/deck_fix.py` →
`tools/hkfix.py ../hk/hkx_kowloon/aos_deck_fix.py` → b5_buildings → b6_misc → b3b_speckle → b7_encode → `bash gbareal/stage.sh`
→ b8_cover. Whole chain ~14 min (b0 77 s, b2 70 s, b3 2 min, b4 1 min, b5 1.5 min, b6 1.2 min, b7 30 s), peak < 2 GB.
Changes from hkreal: regions instead of the SAR boundary; 25 m rasters; the full DEM range; region-keyed height statistics
(b5) and the Shenzhen / Dongguan CBD boxes; Shenzhen's 10 districts, its subdistricts and Dongguan's towns as districts (16-bit
district raster, no 254 cap), 4500 places, 5000 POIs; Shenzhen Bao'an (SZX) runways and stands; b4 tests "over water" against all
land (Hong Kong tested against Hong Kong land only); b7 water-body levels from b2 (no 12 m label raster on disk).

## App (mkengine.py, patch_gba.py, tools/patch17_gba.py, mkgba.sh)
`bash gbareal/mkgba.sh gba` → sgreal/site/t_gba.html. mkengine runs hkreal/mkengine.py's transformations on a copy, writing
app/gbareal.js, then: gbadata paths; 16-bit districts; **tile levels** near < 4.3 km (everything), far < 16 km (big buildings,
roads without service roads / paths), sky < 70 km (horizontal distance + 0.45 × camera height: buildings ≥ 45 m, merged per 8 km
block of 4 × 4 tiles, no roads), else nothing (tiles are disposed; the texture's baked roofs remain); **chunked terrain**
(18 × 18 chunks of 100 × 100 segments, LOD steps 1/2/4/10/20 by distance, skirts, normals from the grid; sculpting rebuilds chunks);
inland water merged per 8 km cell; fog / camera range for 126 km. patch_gba: patch_hk's patches + the Nei Lak Shan test and
hksigns' HK_PATHS moved into this frame, hksigns' tile grid / origin from the map, admin stars and clock as Hong Kong, camera far
260 km, sea plane 420 km, overview camera. Hong Kong landmark modules (hk/*) are NOT in the prototype (see Next).
Test shots: `gbareal/shots/probe.js` (through lm33/kit/browser.sh): per view draw calls, triangles, frame ms, heap after GC.

## Results (2026-10-28, shots/p2.log, shots/hkbase.log = the same probe on the Hong Kong page t_hk.html)
- OSM in the square (tools/count.py): buildings HK 119 244 / SZ 82 210 / DG 29 820 / other 56 686 (+ parts 3 365 / 1 250 / 131 / 592);
  with levels HK 57 020, SZ 15 329, DG 864; road ways HK 183 920 (15 975 km), SZ 100 845 (21 168 km), DG 45 091 (16 804 km), other 90 430.
- Built: 238 943 buildings (HK 117 053, SZ 81 268, DG 29 760, context 10 862; 45 558 small context ones dropped), 268 387 road records
  (19 059 names), 4 540 water bodies, 510 districts. Staged (sgreal/site/gbadata): base 6.04 MB, bld0 3.97, bld1 3.08, roads 9.02,
  water 4.26, cover 6.16, ground.webp 1.83 = 34.4 MB (Hong Kong 16.1 MB); largest file 9.02 MB.
- Browser (headless, software GL): map on 39 s (HK 30), start tiles 65 s (HK 59), small-building part 106 s (HK 112); JS heap after GC
  1 755 MB at the start, ~2 050 MB after touring (HK 916 / ~900). Clearing all tiles frees only ~30 MB: the heap is the decoded data and
  engine structures (6.35 M-cell grids ≈ 350 MB, 1 018 531 traffic-graph segments vs 181 422, 268 k road lines, 14 k label elements).
- Frames: overview 492 calls / 2.6 M tris / 6.3 s (HK overview 1 009 / 7.0 M / 15.4 s); Futian 400 / 4.6 M / 11.0 s; Nanshan 320 / 3.7 M /
  9.2 s; Dongguan 342 / 3.1 M / 6.1 s; HK harbour 263 / 4.0 M / 10.6 s (HK page 227 / 6.1 M / 14.9 s). Terrain 0.14–0.54 M tris. 0 page errors.
- Known: ground texture 30.8 m/px (HK 13.7); no roads beyond 16 km; the map switch does not know 'gba'; Dongguan's OSM building
  coverage is sparse (29 820 footprints, 864 with levels); Shenzhen / Dongguan Metro not yet drawn (Shenzhen Metro still faded context,
  Dongguan Line 2 skipped); Hong Kong landmark modules not loaded (frame audit needed).

## Round 2 (2026-10-28 afternoon): memory, Hong Kong landmarks, map switch, sharper ground option
- **Road chunks** (b7c_roads.py, tools/rc_app.js): the roads as 228 files of 4 × 4 tiles (8 km; gba_rc<k>.txt, 6.75 MB gz in all,
  largest 0.31 MB) by the tile of each line's midpoint, one names table (base.names) and a chunk table (base.roadChunks). The app
  loads the chunks within 28 km of the start view (43 of 228 at Central: 137 k of 268 k lines); later, when a chunk within 22 km of
  the camera (3D distance, as the tile levels) is missing, all within 28 km are fetched, chunks beyond 42 km are dropped (in batches),
  SGR.lines is rebuilt and re-prepared (1.3–2.0 s) and the built tiles get their roads again. No swaps above 15 km (overview) or
  while driving / flying (line indices in use). The whole network is still written as gba_roads.txt (same names table) for pages
  built before the chunks. After a swap: the roads module's dispose also clears its deferred detail jobs and junction-geometry
  cache (patch_gba), lm20/traffic drops its network (SGTraffic.dropNet, patch_gba) and rebuilds it lazily.
- **Traffic graph**: Hong Kong keeps road classes 0–9; Shenzhen, Dongguan and the context only 0–3 (motorways, trunk roads, links).
- **Labels**: places capped at 3000, POIs at 3500 (Hong Kong 2600 / 3000).
- **Hong Kong landmarks**: tools/mkhklm.py → app/hklm/<name>.js, the 16 hk/ modules as generated copies; a shim at the top of each
  module's block shadows sgXY / hC / hAt / SGRoads.ground with Hong Kong-frame versions, so their W0 / LL / toLL helpers and their
  Hong Kong-frame data stay consistent; everything they hand the engine is lat/lon or local metres. lm33/info_hk is loaded. The
  Peak Tram rail fix (hk/hkx_island/tools/pk_rail_fix.py) runs on gba_base through tools/hkfix.py. GBA_HKLM=a,b selects modules.
- **Map switch**: tools/mkswitch.py → app/cityswitch.js (sgreal/app/cityswitch.js + 大湾区 Greater Bay, 3 + 3 grid); apply(src) is
  the same edit for the shared file (not applied: the other cities' pages are unchanged).
- **Ground**: b3 also writes the 8192 px texture; b3c_ground8k.py bakes the roofs into it (ground8k.webp, 5.2 MB); `GBA_TEX=8192`
  builds a page that uses it (SGR_TEX 8192). Not the default (see the report for its memory).
- mkgba.sh <name> "" builds without the gba/<name> landmark folders other agents are writing (they are picked up by default).
