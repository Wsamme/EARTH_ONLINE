# Nucleos — Batch 4

Original procedural model anchored at **1.3017442930, 103.7921585488**.
OSM relation **21450449** has outer way **305516250** and inner courtyard way
**1562916650**. Masses follow OSM parts **1562916645–1562916649** from the supplied
OSM API extract, including the low planted wing, intermediate roof and elevated
link. Outer footprint is also used for generic-building replacement masking.
The two lab blocks retain an open west-facing canyon and the mapped inner void.

The supplied tile maximum is **54.7 m** (roof 76.4 minus ground 21.7 ellipsoidal m).
OSM part tags instead estimate 38/41 m; they are not a surveyed height source.
Main lab envelopes are fitted at 47.5/49.5 m, with parapets/screens/roof equipment
up to 54.7 m. This interprets the tile maximum as including roof services; their
precise elevations and plant layout are approximate. Seven deep lab-storey
bands, not extra occupied floors, are used on the principal blocks.

Irregular pale/grey panels, narrow dark glazing cells, darker north cladding,
roof screens/partitions, planted links, modest hanging greenery and the red
north entrance canopy distinguish the model. Roof equipment and planting are
simplified originals. Shared batched materials, private cool-white lab-window
shader and a lit bridge use no postprocessing. Thin lighting cannot cast shadows
after the app merge. Night occupancy/intensity are **inferred**: the supplied
AGWMS image is a design render, not evidence for an exterior night installation.

## Sources and evidence

- [CPG built project](https://cpgcorp.com.sg/project/nucleos-singapore/): seven-storey
  twin blocks, 2014, open central corridor and sky terraces; architectural design
  by CPG with **Perkins+Will as concept designer**. Built photographs were viewed
  (`Nucleos-Building`, `Nucleos-Between-Buildings`, `Nucleos-Greenery`,
  `Nucleos-North-Entrance-1`; site upload directory 2024/10). © CPG / original
  photographer, no open licence claimed; local reference only.
- [CapitaLand property page](https://www.capitaland.com/sg/en/lease/businesspark-industrial-logistics1/campaign/global-property-listing/businesspark-industrial-logistics/nucleos.html):
  two seven-storey towers and planted sky bridge.
- [AGWMS design/project page](https://www.agwms.com/nucleos), supplied
  `agwms_05c73d8f.jpg`: white-panel / green-wall design reference. Hadid's
  masterplan role is distinct from the built-building architect credits above.
  The supplied image is **not an as-built photograph**; current tile images and
  CPG photos take precedence. Source-page sustainability claims differ, so no
  Green Mark rating is encoded in the model.
- OSM contributors, ODbL: relation/parts above. Supplied offline Google/Cesium
  image references `n/e/s/w/top.jpg`, metadata and attribution preserved in the
  external comparison. Never textures or runtime data.

## Fitting and verification

| View | Silhouette IoU |
|---|---:|
| n | 0.8723 |
| e | 0.9050 |
| s | 0.9171 |
| w | 0.8877 |
| top | 0.8726 |
| **Mean** | **0.8910** |

The supplied cameras are reconstructed from the shot-plan formula, not original
survey records. `street` has no known pose and is **excluded from IoU**. Fixed
manual outlines at 800×500 are rasterized at 2× and compared with a raw-model
white mask at 1600×1000. Cropped views exclude foreground occluders; the model
mask includes these modules only, not neighbouring buildings. Trees/minor
occlusions and 5–10 annotation-pixel uncertainty limit the metric. It measures
projected occupancy, not material/architectural fidelity. Reference images and
render outputs stay outside git. No Google services or meshes are loaded.

North and east use upper crops because Solaris/other foreground roofs hide the
lower envelope; south, west and top use whole visible envelopes with mapped
courtyard retained. All five annotation hashes are fixed across the three rounds.
Mean 0.89094 → 0.89094 → **0.89095**: lighting and canopy changes have negligible
silhouette effect. Ground-eye comparison to CPG's built photo uses an approximate
camera; synthetic/generic context and other landmarks are hidden **only in that
photo diagnostic**, never in normal matched views or area heroes. The comparison uses an explicitly labelled model display crop; no warp. No photo IoU
or exact perspective match is claimed.

**10,522 triangles**, no nonfinite vertices or degenerate triangles. All previous
13 module geometries hash identically to `ffd3bca`. Full-app evidence, per-view
masks and outputs are documented in the area REVIEW. Remaining gaps: exact
service-floor/plant heights, bridge glazing/structure, panel placement and garden
species; lighting is an interpretation, not a photographed survey.
