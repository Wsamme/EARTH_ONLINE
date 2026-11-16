# Fusionopolis Two — Batch 4

Original model on OSM ways **448605477 (Innovis), 448605478 (Synthesis),
448605479 (Kinesis)**, anchored at **1.2986882200, 103.7889917033**. All three
footprints come directly from the supplied OSM API extract, including its nodes
beyond the query bbox. The independent masses and spaces between them remain.

Innovis has 18-storey organization, upper lab envelope 97 m and an angular crown
up to the supplied tile maximum **105.2 m** (130.1 minus 24.9 ellipsoidal m).
The thin crown accent/parapet makes actual bounds **105.43 m**. Kinesis is modeled
at **64 m / 11 storeys**, Synthesis at **48 m / five deep cleanroom bands**.
These secondary heights are visual estimates fitted to the images, not official
height measurements. Curtain-wall panels vary by bay/floor, with a cheap shader mullion/pane grid, dark spandrel
belts, aluminium floor rails, roof louvres/plant and distinctive lobby V supports.
Cleanroom K-bracing is deliberately expressed. A dark recessed sky-garden face
suggests depth; its back wall is retained (it is **not a fully surveyed through
opening**). Ground routes between blocks, lobby glazing and a covered link are
simplified. No logos, brand text, signage or advertising is modeled.

Blue-white lab windows, warm lobby strips and a cool-white crown/V accent follow
the supplied dusk photograph. The exact circuit locations, occupancy and
brightness are **inferred**. Lighting strips stand outside the glazing, share one
emissive material and have shadows disabled after `lmMerge`. Surface shaders
clone cached materials and use private program keys; no neighbouring material
is mutated. Three.js r128, no added lights/postprocessing or runtime imagery.

## Sources

- [SG Mark project description](https://sgmark.org/winners/fusionopolis-two/):
  2015 opening; P&T / ARUP / PB / DL-KPK design team; 18-storey Innovis and
  11-storey Kinesis, vibration-sensitive Synthesis cleanrooms with K-bracing,
  aluminium-clad double glazing and sky terraces.
- Supplied SG Mark dusk photo
  [img19-11.jpg](https://sgmark.org/wp-content/uploads/winners/1326/img19-11.jpg),
  reference only; no open licence claimed. Viewed for blue glass, lit crown and
  lobby / lower diagonal supports. Photographer not identified in supplied notes.
- OSM tags cite [P&T](https://web.p-t-group.com/en/project-detail.php?projects_id=65&projects_category_id=&projects_name=Fusionopolis-2A);
  that page timed out during this pass, so verification above relies on SG Mark.
- OSM contributors, ODbL; offline Google/Cesium reference renders and reconstructed
  camera metadata in `/workspace/bv_refs/fusionopolis_two/`, images never committed.

## Fitting

| View | Silhouette IoU |
|---|---:|
| n | 0.8717 |
| e | 0.7868 |
| s | 0.8245 |
| w | 0.8650 |
| top | 0.7493 |
| orbit_h0225_p15 | 0.8534 |
| **Mean** | **0.8251** |

The supplied cameras are reconstructed from the shot-plan formula, not original
survey records. `street` has no known pose and is **excluded from IoU**. Fixed
manual outlines at 800×500 are rasterized at 2× and compared with a raw-model
white mask at 1600×1000. Cropped views exclude foreground occluders; the model
mask includes these modules only, not neighbouring buildings. Trees/minor
occlusions and 5–10 annotation-pixel uncertainty limit the metric. It measures
projected occupancy, not material/architectural fidelity. Reference images and
render outputs stay outside git. No Google services or meshes are loaded.

North/east use upper crops; west scores only the exposed right-hand part because
Fusionopolis One covers the rest. South, top and the one supplied orbit are
scored as target-envelope unions. The top annotation revision removed an
unrelated eastern-neighbour roof and retained the lower Kinesis envelope; **all
rounds were rescored against that same corrected annotation**. Mean progression:
**0.81314 → 0.82417 → 0.82512**. Round 1 had a dark smooth facade and wrong crown
slope; round 2 reoriented the crown and introduced cool lab lighting; round 3
added crown louvres/belts, a finer shader mullion/pane grid and moved buried lighting strips outside the glazing.

The street tile camera is unknown and unscored. A separate approximate camera
compares the dusk photo, with synthetic/generic context and other landmarks hidden
only for this diagnostic. The model is display-cropped without warping. It is not a registered photo overlap or quantitative
photo IoU. Normal matched views and area heroes retain all context.

**8,970 triangles**, finite coordinates, no degenerate triangles. Main gaps are
Kinesis upper-terrace/profile detail (top score remains 0.7493), exact through
openings, refined curtain-wall depth/reflections, crown details and secondary
heights. The result is a recognizable procedural approximation, not a replica
of a survey or the Google mesh. See area REVIEW for full-app validation.
