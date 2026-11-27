# GZ_PLAN — all of Guangzhou on the Greater Bay map (lm50 / v48, 27–28 Nov 2026)

Owner, 28 Nov 2026: "大湾区把广州也拉进来，整个广州". Guangzhou (广州市, OSM relation 3287346, 11 districts incl. Conghua, Zengcheng,
Huadu, Nansha) spans lon 112.952–114.055, lat 22.561–23.936 (OSM boundary). The October square (HALF 63 km: lon 113.4405–114.6636,
lat 22.0871–23.2249) holds only Nansha, eastern Panyu / Huangpu and southern Zengcheng, as muted context.

## 1. Frame: keep the origin, grow HALF symmetrically to 147 km

- **The origin does not move** (lon0 114.0520475, lat0 22.6560705, metres per degree 103014.2 / 110734.9). World x / y of every existing
  thing (Hong Kong / Shenzhen landmark modules, gba/* modules, targets in R/lm50 written in the current frame) stay valid.
- **Why symmetric**: the engine (page template + ~20 shared modules: sgreal, lm20 traffic, lm24 fly/admin, lm32 detail, lm27 phys …)
  assumes a square centred on the origin in more than 60 places (`(x + HALF)/CELL`, `-HALF + i*TS`, `Math.abs(x) < HALF` …).
  An offset square would mean editing all of them in shared code used by every city: too risky for this round.
- **Why 147 km**: the half-width must (a) be an odd number of km, so 2 km tile edges stay on the same lattice (old tile (tx, ty) =
  new tile (tx + 42, ty + 42): the released building tiles can be moved byte for byte, coordinates in a tile are relative to its
  corner), (b) be a multiple of 70 m / 140 m so terrain vertices coincide with the old ones (HALF ≡ 0 mod 7000 and odd thousands →
  63, 77, 91, 105, 119, 133, 147 km), and (c) reach Conghua's northern tip (y = +141.4 km). 133 km reaches only 23.857 N. → **147 km**:
  294 × 294 km, lon 112.625–115.479, lat 21.329–23.984 (5.3 km margin north of Conghua, 36 km west of Huadu / Conghua).
- The square is 5.4× the October area; most of the new area is context (Foshan, Qingyuan, Huizhou, Zhongshan, the sea south of HK).

## 2. Grids and memory (the JS heap must stay near today's ~1.75–2.05 GB headless)

| | October (HALF 63 km) | v48 (HALF 147 km) |
|---|---|---|
| engine cell | 50 m, N 2520, 6.35 M cells (~55 B/cell ≈ 350 MB) | **100 m**, N 2940, 8.64 M cells (≈ 475 MB, +125 MB) |
| terrain grid | 70 m, TN 1801, 3.24 M vertices | **140 m**, TN 2101, 4.41 M vertices (+9 MB); chunks 21 × 21 of 100 × 100 |
| fine water / land rasters (pipeline) | 25 m, 5040² | 50 m, 5880² |
| tiles | 2 km, 63 × 63 | 2 km, 147 × 147 (only tiles with content are listed) |
| ground texture (4096 px) | 30.8 m/px | 71.8 m/px (lm32/detail still draws the vector cover sharp near the camera) |

50 m cells would be 34.6 M cells (≈ 1.9 GB) and 70 m cells 17.6 M (≈ 970 MB): not affordable. 70 m terrain would be 17.6 M vertices
and a base file of ~16 MB (over the 15 MB staged-file limit). The cell size only drives the engine rasters (land / water / zoning /
district / brush; the painting tools are gone from this page since v47), not the buildings or roads, which stay vector data.

**Detail level for Guangzhou: a full core ('sg') region like Shenzhen**: all OSM buildings (with the same height estimation, region-keyed
statistics: GZ = region 4), all roads with names, land use, its 11 districts as regions and its subdistricts / towns as
neighbourhoods, places / POIs / waters, Baiyun airport (CAN) runways and stands. Shenzhen / Dongguan keep their released Overture +
3D-GloBFP buildings (szdg); Guangzhou gets OSM footprints only (Overture's ML footprints would add ~1–2 M buildings: not affordable).
Traffic graph as Shenzhen (classes 0–3).

**Context outside the core cities and outside the October square** (new): big buildings only (≥ 3000 m² or tagged ≥ 40 m / 13 levels),
roads up to tertiary, land cover / water, cities and towns, priority-1/2 POIs. Inside the October square the context is unchanged.

## 3. Data

- **OSM** (ODbL, © OpenStreetMap contributors): openstreetmap.fr extracts `asia/china/guangdong`, `hong_kong`, `macau` (27 Nov 2026,
  sequence 7390049; 196.5 + 44.1 + 3.7 MB, md5 checked). `download.geofabrik.de` resets connections from this container;
  openstreetmap.fr works. b0 reads the three files (duplicates skipped).
- **DEM**: AWS Terrain Tiles (terrarium, `s3.amazonaws.com/elevation-tiles-prod`, Mapzen / Tilezen; sources incl. SRTM, public
  domain / see the Terrain Tiles attribution), z12 x 3329–3361, y 1766–1799 = 1122 tiles (256 already in the repo, 866 fetched,
  37 MB). b2 averages the mosaic 2 × 2 (~70 m pixels for the 140 m vertices).
- No Google data. Overture / 3D-GloBFP / CTBUH data stay as released in the old-square tiles (not re-fetched).

## 4. Pipeline (test copy, does not touch production)

Working copy: `SC/lm50/gz/gbareal` (copy of `R/gbareal`, `GBA_FRAME=gz` in common.py selects the new frame; the default is the
October frame, so the repo pipeline behaves as before). Outputs `SC/lm50/gz/out`, staged test data `SC/lm50/gz/gbadata`, test page
`SC/lm50/gz/gba_test.html`. Runner: `SC/lm50/gz/tools/run.sh <log> <stage>` (heavy lock, logs peak RSS).

Changes by stage:
- tools/gz_regions.py (new): HK / SZ (minus Shenshan) / DG / GZ polygons and Guangzhou's 11 districts from the extracts (replaces the
  missing data/regions.pkl).
- b0: three extracts; far-context filter (above); node index on disk (the in-memory index peaked at 3.2 GB).
- b1: Guangzhou = core region 4 ('gz' in land.pkl).
- b2: tile range from the square, 2 × 2 averaging, no gap-fill index arrays when every tile is present.
- b3: land cut by a quadtree (the 2 km loop over 87 k cells against the whole land polygon would take an hour).
- b5: region 4; Zhujiang New Town / Tianhe North as a CBD box (towers there typed as offices).
- b6: Guangzhou districts (REGS after Dongguan, HK's 18 stay first), Guangzhou subdistricts / towns as districts, CAN runways and
  stands, places / POIs caps 7000 / 7500 with the far-context filter.
- b7: **buildings merge**: the October-square tiles keep the released records of site/gbadata byte for byte (moved to the new tile
  index), minus the old context records inside Guangzhou, plus the fresh Guangzhou buildings; statistics recomputed over everything.
  Roads, water, base: fresh for the whole square (same OSM processing as October, newer snapshot). base gets `capP` / `capI` (label
  caps for the app: 4600 / 5200 here, 3000 / 3500 when absent).
- b4b_hkdecks + the HK deck fixes (tools/hkfix.py), b7c road chunks, b8 cover, b3b roofs: run as before on the new outputs.

## 5. App (adaptive: the same code works with the October data)

gbareal.js / patch_gba.py / gbstats.js: fog, far plane, orbit distance from HALF; label caps from base; overview camera and the
"126 × 126 km" text from HALF; subtitle gets 广州 when the base is the big square; sea plane 900 km.

## 6. Pipeline run (27 Nov 2026, frame gz, SC/lm50/gz/logs)

| stage | time | peak RSS | notes |
|---|---|---|---|
| gz_regions | 11 s | 0.7 GB | GZ 3287346 + 11 districts; SZ 3464353 − Shenshan 9223823; DG 3464319; HK 913110 |
| b0 | 131 s | **3.16 GB** | 374 358 buildings, 675 123 ways; node index in memory (now on disk for reruns) |
| b1 | 115 s | 2.38 GB | land 52 775 km² of 87 379; GZ region 7 426 km² (incl. water) |
| b2 | 189 s | 2.27 GB | 1122 / 1122 DEM tiles, 0 placeholder cells, H −15 … 1287 m (height cap raised 1000 → 2000 m in frame gz) |
| b3 | 45 s | **2.76 GB** | 119 295 land-use polygons; the 8192 px canvas (ground8k_base) is the peak |
| b4 | 77 s | **3.15 GB** | raw_ways.pkl of the 294 km square |
| b5 | 72 s | 1.20 GB | 322 221 buildings (HK 117 443, SZ 81 501, DG 29 791, GZ **75 566**, context 17 920) |
| b6 | 96 s | **3.25 GB** | 687 districts (283 subdistricts / towns), 40 regions (HK 18, SZ 10, DG 1, GZ 11), 7000 places, 7500 POIs, CAN 5 runway lines + 180 stands, Guangzhou Metro 358 parts / 312 stations |
| b3b, b7, b7c, b8 | 9 / 39 / 21 / 19 s | ≤ 1.8 GB | |

Stages over 2.5 GB (b0, b3, b4, b6) ran alone under the heavy lock; to bring them under 2.5 GB for reruns: b0 node index on disk
(done), b4 / b6 should stream raw_ways instead of loading the pickle, b3 should skip ground8k_base (the 8k option) in frame gz.

Data built (SC/lm50/gz/gbadata, 77 MB; production 51 MB): base 8.35 MB, bld0 9.84, bld1 12.95, bld2 4.76, water 13.91, cover 10.82,
877 road chunks (12.2 MB gz in all, largest 0.30 MB), ground.webp 1.50 MB; largest file 13.9 MB (limit 15).
- Buildings 1 059 232: released records kept 974 471 (230 554 big + 743 917 small; 1833 of 1977 old tiles byte for byte, the other
  144 are the Nansha / Panyu / Huangpu edge where 2 119 old context records in Guangzhou were replaced), fresh 84 341 (GZ 75 566,
  far context 8 775). Statistics (estimates): 1 028 012 buildings, 8 858 ≥ 100 m.
- Roads 411 598 records: released kept 258 794 (dropped 9 593 old context roads in Guangzhou), fresh Guangzhou 99 176, fresh outside
  53 628. Hong Kong's deck fixes (Tsing Ma, Shenzhen Bay Bridge, Avenue of Stars) come with the released records:
  `hk/bridges/tm_deck_fix.py` no longer exists anywhere, so a fresh road build would lose the Tsing Ma profile.
- Rail: the released MTR / Light Rail / tram / Peak Tram / Shenzhen Metro (335 parts, 558 stations, Ngong Ping 360) + Guangzhou Metro.
- Water 10.4 MB gz (28 MB raw: the delta's fish ponds, 14 221 bodies; October 4.26 MB staged).
