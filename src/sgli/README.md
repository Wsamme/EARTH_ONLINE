# Little India landmarks

Normal `LANDMARKS` modules for Little India (Serangoon Road between Sungei Road
and Syed Alwi Road, around Little India MRT NE7 / DT12). `sgreal/patch17.py`
assembles them. They reuse the Buona Vista kit (`src/sgbv/core.js`) through a
thin wrapper (`src/sgli/core.js`) that registers every module as `sgli_<slug>`.
Stats go to `window.LittleIndia.stats`. A module may list older landmark types it
supersedes (`register(..., ['sgveeramakali'])`); their `SG_PLACES` entries are
removed so the two never overlap.

Conventions are the same as `src/sgbv/`:
- Coordinates are metres east / south of a WGS84 anchor, with y up.
- Footprints are taken from OSM (© OpenStreetMap contributors, ODbL).
- Materials are shared and batched, and night shaders come from `lmMat`.
- There are no photographic textures, logos or brand text, and no external
  meshes or tile services at runtime.

`footprints.json` is generated outside the repo from an OSM API extract
(bbox around 1.300–1.316 / 103.846–103.860). Each entry's `height_source`
records whether the height is tile-measured or provisional.

| Module | OSM ids | Group | Supersedes |
| --- | --- | --- | --- |
| veeramakaliamman | ways 155991884, 1078263462 (annex) | heritage | sgveeramakali |
| srinivasa_perumal | way 481614952, compound landuse 686747406 | heritage | srinivasa |
| abdul_gafoor | way 176326990 | heritage | sgabdulgafoor |
| angullia_mosque | way 396336447 | heritage | |
| tan_teng_niah | way 178436852 | heritage | sgtantengniah |
| indian_heritage_centre | way 176326997 | heritage | |
| tekka_centre | way 47198835 | commerce | |
| mustafa_centre | ways 47198841, 178437069–178437074 | commerce | |
| little_india_arcade | way 176326900 + Campbell Lane shophouses | commerce | |
| city_square_mall | ways 102429452, 361112097 | commerce | |
| deepavali_lightup | Serangoon Road / Campbell Lane centrelines (no footprint) | commerce | |

Open `index.html?view=li` for a wide view of the district.

## Build and verify

```bash
bash tools/bv_build.sh --test
python3 -m http.server 8049 --directory site
# matched-camera comparison against image-only reference renders (kept outside the repo)
LI_REFS=/workspace/li_refs LI_OUT=/workspace/eo_li_out \
  bash src/lm33/kit/browser.sh node tools/li_compare.mjs veeramakaliamman --round r1
```

`tools/li_compare.mjs` renders each landmark from the reference cameras (day,
night, and a white-on-black mask of the landmark group only); `tools/li_score.py`
computes silhouette IoU and writes `<slug>_compare.jpg` sheets. `--hero` also
writes `li_area_hero_day.jpg` / `li_area_hero_night.jpg`.
