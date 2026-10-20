# San Francisco Bay Area 1:1 — data pipeline and build (City Brush v22)

Data (from the user's Mac, staged): `baydata/norcal.osm.pbf` (Geofabrik), `baydata/terrain/12_x_y.png` (AWS terrarium z12).
Projection: x = (lon + 122.19)·88300, y = (lat − 37.625)·110989; square HALF 36000, CELL 32 (N 2250), terrain TS 90 (TN 801), tiles 2 km.

Stages (run from `bayreal/`, outputs in `bayreal/out/`):
1. `b0_osm.py` → raw.pkl (then split raw_{nodes,ways,bld,areas,routes}.pkl)
2. `b1_land.py` → land.pkl (coastline faces)
3. `b2_terrain.py` → terrain.pkl, fresh.pkl, 12 m rasters
4. `b3_texture.py` → ground.webp, codes/lu.npy, landuse.pkl; `b3b_speckle.py` bakes all roofs into ground.webp
5. `b4_roads.py` → roads.pkl; then the deck fixes in this order:
   `b4b_bridges.py` → `../bay/ggb/ggb_deck_fix.py` → `../bay/baybridge/bb_deck_fix.py` → `../bay/bridges/bridges_deck_fix.py` → `b4c_ybi.py`
6. `b5_buildings.py` → buildings.pkl
7. `b6_misc.py` → misc.pkl, pa.npy, rg.npy (districts, labels, rail, stations, runways, stands)
8. `b7_encode.py` → bay_bld0..3, bay_roads, bay_water, bay_base (.gz); `b7r_roads.py` re-encodes only the roads
   (road elevation: u8/5, or u8/2.5 when flag 32 — decks above 51 m)
9. `b9_refs.py` → ../bay/ref_<group>.json (for model authors)

App: `mkengine.py` generates `app/bayreal.js` + `app/baystats.js` from the Singapore modules; `patch_bay.py` adapts the main
code; `CITY=bay python3 ../sgreal/patch17.py ../city-brush-v16.html out.html` builds it (Bay landmark modules: `../bay/<k>/<k>.js`).
Test page: `bash mkbay.sh <name> [modules]` → `../sgreal/site/t_<name>.html` (data in `../sgreal/site/baydata/`).
