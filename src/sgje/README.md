# Jurong East / Jurong Gateway landmarks

Normal `LANDMARKS` modules for the Jurong Gateway hub around Jurong East MRT
(EW24 / NS1). `sgreal/patch17.py` assembles them. They reuse the Buona Vista kit
(`src/sgbv/core.js`) through a thin wrapper (`src/sgje/core.js`), which
registers every module as `sgje_<slug>`. Stats go to `window.JurongEast.stats`.

Conventions are the same as `src/sgbv/`:
- Coordinates are metres east / south of a WGS84 anchor, with y up.
- Footprints are taken from OSM (© OpenStreetMap contributors, ODbL).
- Materials are shared and batched, and night shaders come from `lmMat`.
- There are no photographic textures, logos or brand text, and no external
  meshes or tile services at runtime.

`footprints.json` is generated outside the repo from an OSM API extract
(bbox 103.736–103.750 / 1.326–1.338). Heights are measured from the
reference-tile roofs where the tiles are current. Otherwise they are official
or estimated, and each entry's `height_source` says which.

| Module | OSM ids | Group |
| --- | --- | --- |
| westgate | way 158234014, way 368005268 (tower) | malls_west |
| jem | ways 620519197, 978644313, 368005256 (tower) | malls_west |
| j_den | way 158227102 (former JCube site) | malls_west |
| imm | ways 33543880, 429038696 (car park) | hub_east |
| perennial_business_city | way 173029751 | hub_east |
| jurong_east_mrt | way 33737976, bus interchange way 881935994 | hub_east |
| ng_teng_fong | ways 368005263, 368005259, 320763066 | health |
| vision_exchange | way 368005267 | gateway |
| jtc_summit | way 33738028 | gateway |
| cpf_jurong | way 103752945 | gateway |
| jurong_town_hall | way 96764520 | gateway |

Open `index.html?view=je` for a wide view of the district.

## Build and verify

```bash
bash tools/bv_build.sh --test
python3 -m http.server 8048 --directory site
# matched-camera comparison against image-only reference renders (kept outside the repo)
JE_REFS=/workspace/je_refs JE_OUT=/workspace/eo_je_out \
  bash src/lm33/kit/browser.sh node tools/je_compare.mjs westgate,jem --round r1
```

`tools/je_compare.mjs` renders each landmark from the reference cameras. The
day and night views use the full scene. The silhouette mask draws only that
landmark's group, in white on black. `tools/je_score.py` then computes IoU
against the reference silhouettes and writes the compare sheets.
