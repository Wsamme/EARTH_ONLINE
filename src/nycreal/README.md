# New York City 1:1 — data pipeline and build (City Brush v25)

Data: `nycdata/new-york.osm.pbf` + `nycdata/new-jersey.osm.pbf` (Geofabrik; objects on the state border are in both files and
are deduplicated by OSM type + id), `nycdata/terrain/12_x_y.png` (AWS terrarium z12, x 1201–1211, y 1535–1545).
Projection: x = (lon + 73.98)·84516, y = (lat − 40.70)·111048 (WGS84 metres per degree at 40.70°); square HALF 28000 (56 × 56 km,
like Singapore), CELL 25 (N 2240), terrain TS 70 (TN 801), tiles 2 km (28 × 28). Traffic drives on the right; Eastern Time with
US daylight saving.

Stages (run from `nycreal/`, outputs in `nycreal/out/`):
1. `b0_osm.py` → raw_{nodes,ways,bld,areas,routes}.pkl (both files, ~10 min)
2. `b1_land.py` → land.pkl (coastline faces; the Hudson north of the harbor, the Passaic / Hackensack are river polygons)
3. `b2_terrain.py` → terrain.pkl, fresh.pkl, 12 m rasters (DEM voids clamped: sea floor ≥ −28 m, land ≤ 260 m)
4. `b3_texture.py` → ground.webp, codes/lu.npy, landuse.pkl (north-eastern palette); `b3b_speckle.py` bakes all roofs into ground.webp
5. `b4_roads.py` → roads.pkl (+ `cp out/roads.pkl out/roads_b4.pkl`); `b4b_nycdecks.py` → the big bridges' deck profiles
   (re-runnable: it always starts from roads_b4.pkl)
6. `b5_buildings.py` → buildings.pkl (measured NYC heights, building parts, attached row houses → flat roofs)
7. `b6_misc.py` → misc.pkl, pa.npy, rg.npy (neighbourhoods / towns, boroughs / counties, labels, rail with deck heights, stations,
   runways, stands)
8. `b7_encode.py [HB AB]` → nyc_bld0..k, nyc_roads, nyc_water, nyc_base (.gz); `b7r_roads.py` re-encodes only the roads.
   Big buildings (bld0, decoded at start, drawn far away) = height ≥ HB m or area ≥ AB m² or parts (default 20 / 900; raise them if
   bld0 is over 10.9 MB gzip — the script stops with BLD0 TOO BIG). Small buildings in parts of ≤ 10.9 MB gzip (≤ 15 MB as base64).
   Road elevation: u8/5, or u8/2.5 when flag 32 (decks above 51 m).
9. `bash stage.sh` → `../sgreal/site/nycdata/nyc_*.txt` (gzip as base64) + ground.webp
10. `b9_refs.py [groups]` → `../nyc/ref_<group>.json` for landmark authors

Shared helpers: `common.py` (constants), `raster.py`, `zh_names.py` (Chinese names: boroughs, ~400 neighbourhoods and towns,
streets and avenues incl. numbered streets "West 42nd Street" → 西42街, parks, waters, bridges, airports, stations, landmarks),
`nyc_lines.py` (the transit lines drawn: 25 subway services + SIR, 4 PATH, AirTrain JFK, Hudson–Bergen and Newark light rail,
10 LIRR branches, 3 Metro-North lines, 10 NJ Transit lines; used by b4 — their ways are not plain rail — and b6).

App: `mkengine.py` generates `app/nycreal.js` + `app/nycstats.js` from the Singapore modules (mirrors the Bay generator: parts
streaming, two-level tile LOD, precomputed statistics, tree index, per-system trains; New York: `const SGR_US = true;
const SGR_NYC = true;`, els 12 m over the street, explicit track heights `mrt[].z` on the road bridges and high viaducts);
`patch_nyc.py` adapts the main code (titles, reset / Midtown buttons, overview camera, block height caps 300 / 540 m, right-hand
traffic, no circuit / cable car, the ports, the sun at 40.70 N 73.98 W in Eastern Time, F1 free drive keeping right from 42nd
Street, race card shown (v30: the Brooklyn Street Circuit, nyc/nyrace), label distances, street-running light rail, shop-sign districts and busy hubs);
`CITY=nyc python3 ../sgreal/patch17.py ../city-brush-v16.html out.html` builds it (New York landmark modules: `../nyc/<k>/<k>.js`,
`NYCLM=a,b` to choose). The map switch under the title (Singapore / Bay Area) is hidden in this build until it knows New York.
Test page: `bash mknyc.sh <name> [modules]` → `../sgreal/site/t_<name>.html` (data in `../sgreal/site/nycdata/`).
Landmark kit: `kit/` (in-situ harness with the New York terrain, water, roads and buildings) — see `../nyc/BRIEF.md`.

## Bridge decks (b4b_nycdecks.py) — road surface at mid-span, metres above the water
All OSM ways of a bridge (both directions, both levels, approach viaducts within 70 m of its axis) share one profile along the
axis: crowned main deck (2 m) over every water stretch, falling at the approach grade outside it, capped by ramps from the ground at
the structure's two ends; lower level = upper − gap. Clearances below (mean high water) from the Wikipedia infoboxes / articles
(checked 2026-10): George Washington 212 ft "accounting for the lower deck" (65 m), Verrazzano-Narrows 228 ft (69.5 m), Bayonne
215 ft after the 2019 Raise the Roadway project (ENR), Queensboro 130 ft, Brooklyn 127 ft (promenade 18 ft above the roadways),
Manhattan 135 ft, Williamsburg 135 ft, RFK Hell Gate span 143 ft (Harlem River lift span 55 ft, Bronx Kill 55 ft: generic),
Bronx-Whitestone 134 ft 10 in, Throgs Neck 142 ft, Goethals 140 ft, Outerbridge 143 ft, Pulaski Skyway 135 ft over both rivers,
Hell Gate (rail) 135 ft, Kosciuszko (2017) 90 ft. The deck-to-deck gaps (stiffening truss depths) are estimates.

| bridge | upper / single | lower | approach grade |
|---|---|---|---|
| George Washington | 75.0 | 66.5 | 3.5 % (both ends on high ground) |
| Verrazzano-Narrows | 78.5 | 71.0 | 6 % |
| Queensboro | 48.5 | 41.5 | 4.5 %, level across Roosevelt Island |
| Brooklyn | 46.0 promenade | 40.5 roadways, bike lane | 4 % |
| Manhattan | 49.5 | 42.5 (lower roadway, subway, paths) | 4 % |
| Williamsburg | 48.0 walkways | 43.0 roadways, subway | 4 % |
| RFK Hell Gate span | 46.0 | – | 7 % |
| Bronx-Whitestone | 45.0 | – | 3.5 % |
| Throgs Neck | 46.5 | – | 3.5 % |
| Bayonne | 68.0 | – | 6 % |
| Goethals | 45.5 | – | 4 % |
| Outerbridge | 45.0 | – | 4 % |
| Pulaski Skyway | 42.5 over the rivers, 26 between | – | 3.5 % |
| Kosciuszko | 29.0 | – | 4 % |
| Hell Gate (rail) | 42.5 | – | approach viaducts ramped at 1.5 % |

Elevated highways (FDR, BQE, Gowanus, Major Deegan, Van Wyck, Cross Bronx …) keep the generic b4 rule (6.6 m per crossing
level, 6 m viaducts, ramps at 5.5 %). Tunnels (Holland, Lincoln, Queens–Midtown, Hugh L. Carey, subway / PATH tubes) are not drawn.
Rail: the els at 12 m over the (smoothed) street; tracks within 25 m of a raised road deck take the lowest such deck (Manhattan
and Williamsburg Bridges); the Culver Viaduct over the Gowanus (Smith–9th Sts) 26.5 m, the Manhattan Valley Viaduct (125th St)
17 m, the Broadway Bridge 15 m.

## Results (v25 build, 2026-10-11)
- Buildings: 1 651 631 footprints (1 086 191 with mapped heights, 8 097 from levels, 557 343 estimated) + 19 389 building parts
  of 4 450 buildings; 249 720 attached houses became flat-roofed row houses. Encoded: 73 075 big records (≥ 20 m, ≥ 900 m², parts)
  in nyc_bld0, 1 593 781 small ones in 3 parts. Tallest: One World Trade Center 541 m (spire part), Central Park Tower, 111 W 57th,
  One Vanderbilt, 432 Park; 480 buildings ≥ 100 m.
- Roads: 367 022 records (383 081 merged lines before clipping; 1.94 M vertices), 22 791 names; 181 deck lines on the 15 big
  bridges + 272 joining ramps. Water: sea 31 k vertices, 5 861 fresh bodies, 51 k pools. Rail: 60 lines (255 drawn parts), 628
  stations; 9 runways at JFK / LGA / EWR, 130 stands. 254 districts (225 New York City neighbourhoods), 15 boroughs / counties.
- Staged data (`sgreal/site/nycdata/`, base64 of gzip): nyc_base 2.5 MB, nyc_bld0 3.1 MB, nyc_bld1..3 12.4 / 12.4 / 10.9 MB,
  nyc_roads 7.6 MB, nyc_water 4.6 MB, ground.webp 3.8 MB — 57.3 MB in all, largest file 12.4 MB.
- Browser (headless Chromium, software GL, 2 shared CPUs): full map — all 784 tiles built 168–228 s after opening, the three
  small-building files in after another 5–8 min (much faster on a real GPU, where the frames are not the bottleneck);
  `?near=` Midtown 1.5 km: 51 s / 222 s. JS heap (`performance.memory`, precise, after GC): full map 1477 MB after the start
  tiles, 1547 MB with all parts, 1605 MB at a Midtown close view, 1429 MB in the overview (V8 heap proper 366–434 MB; the rest
  is typed-array backing stores: world rasters, canvases, tile buffers). Singapore measured the same way (near Marina Bay): 1128 MB.
  Overview frame: 1541 draw calls, 12.1 M triangles; Midtown close: 213 calls, 6.8 M triangles.

## Testing
```
cd SC && bash nycreal/mknyc.sh nyc ""                 # sgreal/site/t_nyc.html (no New York landmark modules)
(setsid nohup bash lm20/kit/slot.sh env PAGE=t_nyc.html node lm20/kit/appshot.js nycreal/shots/full1 "$(cat nycreal/shots/views_full.json)" > nycreal/shots/full1.log 2>&1 &)
(setsid nohup bash lm20/kit/slot.sh env PAGE=t_nyc.html NEAR=40.7280,-73.9900,5600 node lm20/kit/appshot.js nycreal/shots/final "$(cat nycreal/shots/views_final.json)" > nycreal/shots/final.log 2>&1 &)
(setsid nohup bash lm20/kit/slot.sh env PAGE=t_nyc.html VIEWS=1 node nycreal/shots/memprobe.js > nycreal/shots/mem_full.log 2>&1 &)   # heap
```
Night views of the whole map are extremely slow in software GL (one frame > 15 min): shoot night views with `NEAR=`.

## Known issues
- George Washington Bridge, New Jersey end: the smoothed 70 m DEM keeps the Palisades' top (~88 m) over the real cut the
  approach runs in, so the roads there sit on the cliff top and climb ~13 m from the 75 m deck.
- Throgs Neck: the land mask splits its water crossing in two; the deck dips ~4 m between them.
- Until the landmark models exist, the big bridges show the road module's generic piers and pylons under the real-height decks.
- The map switch (Singapore / Bay Area) is hidden in the New York build; the Bay-only modules are inert here (the audio falls back
  to its default soundscape, the "Silicon Valley drive" is off; plain F1 free drive works, keeping right from 42nd Street).
- The Hudson north of the harbour, the Passaic and the Hackensack are river polygons (water level from the DEM, ~0.3 m) next to
  the sea surface (−0.05 m).

## v26 integration (landmark wave 1)
Deck fixes applied after b4b_nycdecks.py, in this order (each edits out/roads.pkl in place; backup before them: out/roads_pre_lmfix.pkl):
`../nyc/nyeastriver/er_deck_fix.py` → `../nyc/nybridgesa/gwb_deck_fix.py` → `../nyc/nybridgesa/vnb_deck_fix.py` →
`../nyc/nybridgesb/nybridgesb_deck_fix.py` → `../nyc/nyouter/boardwalk_fix.py` → `../nyc/parkave_fix.py` (Pershing Square viaduct),
then `b7r_roads.py`, `b6_misc.py`, `b7b_base.py`, `stage.sh`. The landmark models in nyc/<group>/ are fitted to these decks.
City features (three-city switch, NYC sound, NYC drive + taxi, yellow cabs / NYC buses, NYC weather) came from nyc/nycapp/ and were
copied over the production modules (originals in backup_v26/); lm20/signs/signs.js has a US shop vocabulary for the Bay and NYC.
Published: NYC artifact (index = NYC, sg.html, bay.html), SG artifact (+ nyc.html), Bay artifact (+ nyc.html); each holds all data.
