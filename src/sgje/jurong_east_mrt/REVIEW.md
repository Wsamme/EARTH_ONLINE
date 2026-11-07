# Jurong East MRT and bus interchange

## Geometry and sources

- Anchored on OSM station way **33737976** and bus interchange way **881935994**, using the supplied local metre polygons. Station's parallel long edges set the azimuth (29.3 degrees east of south).
- Three elevated island platforms, half-height screen doors, cream columns, an elevated concourse on open pilotis, stair cores, pale folded roof lids, narrow skylight strips and open red triangulated space frames. Existing app EW/NS viaducts and moving trains are retained.
- The main roof lids are 22 m above local ground; raised clerestories and trims reach **22.70 m**. Source: `/workspace/je_refs/jurong_east_mrt/meta.json`, sampled roof maximum 22.7 m (p90 22.3 m), roof ellipsoidal 41.25 m minus ground 18.54 m. The extension lid is 21.3 m. Module card/stats height is overridden locally to the measured 22.7 m. Three long raised glazing monitors were added after inspecting the supplied top and close elevations.
- The bus interchange is a shallow 6.3 m canopy on its exact branching OSM outline, with open boarding edges, salmon louvres, columns, seams and underside lamps. The 2023 photo depicts the interim interchange rather than a completed future integrated hub; no speculative tower or future station is added. [LTA’s relocation announcement](https://www.lta.gov.sg/content/ltagov/en/newsroom/2020/11/news-releases/relocation-of-jurong-east-bus-interchange-from-6-december-2020.html) confirms that it opened 6 December 2020 and operates pending the integrated hub planned around 2027.
- The station exterior photographs show chamfered/flat roof lids over space frames rather than a single barrel vault. Modelled the observed form.

Reference photos (all outside the repository):

- `exterior_tracks_20200919.jpg`: [Commons exterior and tracks](https://commons.wikimedia.org/wiki/File:NS1_EW24_Jurong_East_MRT_exterior_and_tracks_20200919_102610.jpg), zhenkang/ZKang123, CC BY-SA 4.0, 18 September 2020.
- `exterior_close_20200918.jpg`: [Commons exterior close up](https://commons.wikimedia.org/wiki/File:NS1_EW24_Jurong_East_MRT_exterior_close_up_20200918_141808.jpg), same author/licence/date. The red soffit and chamfered roof edge are particularly clear.
- Supplied 2024 platform photos: `commons_Jurong_East_MRT_Station_202406_jpg.jpg`, `commons_Jurong_East_MRT_Station_202407_jpg.jpg`, and `commons_NS1EW24_Jurong_East_MRT_Station_202410_jpg.jpg`; cream posts, red space frame, ceiling lamps, screen doors and mullions.
- `commons_Jurong_East_Bus_Interchange_10_11_2023_2_jpg.jpg`: [Commons bus interchange](https://commons.wikimedia.org/wiki/File:Jurong_East_Bus_Interchange_10-11-2023(2).jpg), LN9267, CC BY-SA 4.0; open perimeter, salmon louvres, white ceiling, round columns and inset lamps.

## Night lighting

Cross-checked `commons_Jurong_East_MRT_Singapore_At_Night_jpg.jpg`, [Commons night photo](https://commons.wikimedia.org/wiki/File:Jurong_East_MRT,_Singapore,_At_Night.jpg), Adsfghj., CC BY-SA 4.0, 22 September 2014. It shows mostly dark viaduct soffits and concrete piers, with local ambient spill; it does **not** establish a floodlit roof. The model accordingly keeps concrete, red framing and roofing unlit. Modest warm-neutral underside lamps and blank information panels use their own `lmMat` glow batch. No animated lighting, logos, route text or branding. Full station night illumination is only partly evidenced; precise lamp spacing/intensity is approximate.

## Checks and known gaps

- `node --check src/sgje/jurong_east_mrt/jurong_east_mrt.js`: pass.
- `node tools/je_hub_east_mrt_check.cjs`: finite coordinates, one registration, **31,760 triangles**, maximum height **22.70 m**, under 60k budget.
- Root worker coordinates full-app build, matched-camera IoU, night renders and page-error verification. Its initial browser run passed with zero page errors and console errors. Comparison values will be reported separately after the roof revision.
- Main height is now reference measured; precise platform widths and extension geometry remain approximate. Four actual track slots are represented by openings between platform strips; the app's simplified EW/NS track layout may not reproduce the full six-face/four-track operational arrangement.
- The long temporary footbridge to the bus interchange is not included: it is outside both supplied outlines and its exact plan is not yet established by the supplied images. No speculative Jurong Region Line station or future integrated transport hub; no runtime photograph textures or external meshes.

Final coordinated verification: `bash tools/bv_build.sh --test` passed. The final matched-camera run rendered all eight views plus two night views, with **zero pageErrors and zero consoleErrors**. Model has **31,760 triangles**. External reports: `/workspace/eo_je_out/hub_east/renders/final/verification.json` and `/workspace/eo_je_out/hub_east/je_iou.json`. Reproduce with `JE_VERIFY=1 bash tools/je_hub_east_run.sh tools/je_compare.mjs imm,perennial_business_city,jurong_east_mrt --round final`; the worker wrapper acquires the shared browser lock before starting its server and shuts the server down afterward.

## Tile epoch mismatch

The supplied district images visibly retain JCube and the first temporary bus interchange (red roof immediately beside the station). Current OSM way 881935994 and the 2023 bus photo instead show the relocated 2020 interim interchange to the southwest. In the reference top clip, that OSM area is grass and road. The model intentionally retains the current OSM/photo bus canopy; silhouette disagreement there is a documented epoch mismatch. Do not move the canopy to match obsolete tile imagery.

## Matched-camera r2 assessment

Full-app r2 camera comparison passed with zero page/console errors and 31,760 triangles. IoU: north **0.741**, east **0.605**, south **0.717**, west **0.576**, top **0.820**; cardinal/top mean **0.692**. Close NE **0.680**, close SW **0.576**, street **0.592**. These are the combined station/interim-bus masks, not a station-only score.

Inspected all five cardinal/top overlays against their original photos. The principal station roof axis, stepped outline, length, three parallel roof monitors and measured maximum align. Residual narrow red margins at the station correspond largely to the 3 m reference buffer and real open undercroft/rail areas that become solid in the column-filled reference. The model deliberately keeps the undercroft and platform space open.

The large red vertical rectangles in east and west views are a **column-fill artefact**: a screen column intersects both geographically separate station and interim-bus footprint fragments, and filling from the first to last target pixel incorrectly bridges their intervening empty space. The southern bus area additionally contains an older white tent, roads and grass in the tile epoch, unlike the present canopy. These are not missing station walls or a reason to enlarge the model. No geometrically justified massing change was established after r2. Further silhouette inflation would trade source fidelity for this scoring artefact. Station extension details and the long temporary footbridge remain the limitations listed above.

Final supplementary geometry/day-night check: both southeast and southwest views rendered by day and night; all vertex positions finite, under the 60k per-model triangle budget, zero page and console errors. Report: `/workspace/eo_je_out/hub_east/hub_east_verification.json`; local contact sheet: `/workspace/eo_je_out/hub_east/hub_east_final_contact.jpg`.
