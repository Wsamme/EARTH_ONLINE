# Buona Vista / one-north landmarks

Nine normal `LANDMARKS` / `SG_PLACES` modules, assembled by `sgreal/patch17.py`.
Coordinates follow the existing Singapore convention: metres east / south of a
WGS84 anchor, y up. The shared helper batches triangles by material and uses
`lmMat` for the app's night shaders. Facade bay colours provide original fake
reflections, with physical floor bands and mullions. No photographic textures,
logos, model text, tile services or external meshes are used.

`footprints.json` contains OSM way polygons, transformed to local metres from
`/tmp/bv/map.osm` (read-only input). © OpenStreetMap contributors, ODbL.
Heights are the supplied measured roof-minus-ground values; individual cluster
roof levels and design details are estimates from the six supplied photo views.
The renderer's 70 m terrain is retained, with each model on the anchor ground;
its ellipsoidal offset is removed when placing comparison cameras.

| Module | OSM ways | Measured maximum (m) |
| --- | --- | ---: |
| star_vista | 104352121 | 74.5 |
| metropolis | 1563020894, 1563020891, 1563020893 | 113.4 |
| buona_vista_mrt | 152592566, 823046125, 1131873757, 1187773826 | 19.0 |
| biopolis | 168243403, 168243404, 168243405, 168243407, 168243409, 168243410, 168243411 | 77.7 |
| fusionopolis_one | 175841411, 173033567, 173033568, 173033570 | 135.9 |
| solaris | 123988232, 777420337, 777420338 | 80.1 |
| galaxis | 175841412 | 93.7 |
| mediacorp | 352920078 | 76.0 |
| rochester | 167472309, 167472303, 167472305 | 138.0 |

All nine keys start with `sgbv_`. None has labelled subkeys. The normal landmark
hull pass suppresses the generic OSM buildings. The custom MRT module replaces
the generic station canopy; the existing app draws the EW viaduct and trains.
Open `index.html?view=bv` for a wide view of the district.

## Build and verify

From the repository root:

```bash
bash tools/bv_build.sh --test
python3 -m http.server 8047 --directory site
# In another shell, with playwright-core installed:
PLAYWRIGHT_CORE=/tmp/bv/node_modules/playwright-core \
  bash src/lm33/kit/browser.sh node tools/bv_compare.mjs --round final
THREE_JS=/tmp/earth-online-vendor/package/build/three.min.js node tools/bv_geometry.cjs
```

The test uses `sgreal/mktest.py` and its `__t` full-app hooks. The city briefs refer
to appshot.js and browser.sh, but this checkout did not include those files; the
portable implementations added here retain that appshot/test-page/browser-lock
flow. `appshot.js` also accepts JSON views for independent full-app smoke shots.
No production page depends on these tools or on a build server.

Comparison inputs default to `uploads/bv_refs/<slug>`. Cameras come first from
`meta.json`; missing camera records come from the supplied `/tmp/bv/cams.jsonl`
(`BV_CAMERAS` overrides it). Missing records fail explicitly. All six views use
1600×1000, a 60° horizontal field of view, the recorded heading/pitch and altitude
minus `ground_ellipsoidal_m`, added to the scene's anchor ground. `BV_REFS`,
`BV_OUT`, `URL`, `CHROME`, `BV_ONLY` are optional overrides. The sheet generator
needs Pillow. Outputs go outside the repo to `/workspace/eo_codex_out`, including
labelled six-view JPG sheets, hero day/night JPGs, camera logs and page errors.
References and renders are ignored by git and are never PR attachments.

See `REVIEW.md` for the comparison rounds and remaining limitations.

For independent appshot smoke views (with the same server running):

```bash
NEAR=1.3013,103.7900,2500 bash src/lm33/kit/browser.sh \
  node src/lm20/kit/appshot.js /workspace/eo_codex_out/appshot \
  "$(cat src/sgbv/tools/views.json)"
```

The replacement mask also includes three legacy Metropolis podium polygons from
`site/sgdata/sg_bld.txt`; their generic height estimates otherwise obscure the
replacement towers. Source polygons are recorded in `context_parts`. The added
geometry totals 293,236 triangles, including rails; existing city context is
retained. Singapore's generated page omits its former Google Fonts links, so the
comparison flow makes no Google service requests.
