# Jurong East MRT and bus interchange

## Geometry and sources

- Anchored on OSM station way **33737976** and bus interchange way **881935994**, using the supplied local metre polygons. Station's parallel long edges set the azimuth (29.3 degrees east of south).
- Three elevated island platforms, half-height screen doors, cream columns, an elevated concourse on open pilotis, stair cores, pale folded roof lids, narrow skylight strips and open red triangulated space frames. Existing app EW/NS viaducts and moving trains are retained.
- The main roof is 22 m above local ground (22.18 m including the skylight frames). This is explicitly the **provisional footprint estimate**, not a measured or official height: the reference directory has no `meta.json` yet. The extension lid is 21.3 m. This needs fitting when imagery arrives.
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
- `node tools/je_hub_east_mrt_check.cjs`: finite coordinates, one registration, **27,662 triangles**, maximum height **22.18 m**, under 60k budget.
- Root worker coordinates full-app build, matched-camera IoU, night renders and page-error verification. No imagery references were present at initial model completion, so no IoU is claimed here.
- Roof heights, exact platform widths and extension geometry remain estimates pending image-camera comparison. Four actual track slots are represented by openings between platform strips; the app's simplified EW/NS track layout may not reproduce the full six-face/four-track operational arrangement.
- The long temporary footbridge to the bus interchange is not included: it is outside both supplied outlines and its exact plan is not yet established by the supplied images. No speculative Jurong Region Line station or future integrated transport hub; no runtime photograph textures or external meshes.
