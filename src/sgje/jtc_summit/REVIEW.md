# JTC Summit

- Anchor and podium: OSM way **33738028**, from the supplied `footprints.json`, local metres east/south. Original procedural geometry only; no reference imagery ships.
- Main features: four-level curved public podium, independently articulated cream office wings with projecting slab shades, curved teal curtain wall with triple narrow horizontal rails, dark rear service spine, stepped roof railing and curved louvre crown. Entrance canopy and roof plant remain within the footprint.
- Maximum **150.7 m** to the slender mast, from `/workspace/je_refs/jtc_summit/meta.json` measured maximum (ground ellipsoid 17.46 m). Main curtain-wall top **139.1 m** uses the measured p90, public podium **22.6 m** uses the p50, and the **132.4 m** cream wing / **147.8 m** louvre crown split is estimated from the supplied photos and reference images. The p90/p50 levels are interpretation of the height distribution, rather than separately surveyed roof levels.
- Tower plan corrected against the top reference using real OSM building-part polygons **368005257** (glass) and **463193388** (cream bar), downloaded via the public OSM `way/<id>/full` API on 2026-11-01. The tower sits in the southwest half of its much broader public podium. These polygons supplement the supplied parent footprint; no mesh was used or extracted.
- The supplied `n.jpg` metadata reports `tiles_settled:false`; this lowers confidence in close facade detail, but the remaining reference views are marked settled.
- Architecture: [AWP Architects project page](https://awparchitects.com/project/jtc-summit/) describes a 32-storey office tower and four-storey public podium; the brief and leasing agent count 31 storeys, so no extra storey is implied by the metadata discrepancy.
- Daytime shape/material reference: `commons_The_JTC_Summit_jpg.jpg` and `commons_The_JTC_Summit_Singapore_20150611_01_jpg.jpg`, listed with authors and licences outside the repo in `/workspace/je_photo_refs/jtc_summit/SOURCES.md`.
- Dusk lighting reference: [Erwin Soo, JTC Summit (8491645671)](https://commons.wikimedia.org/wiki/File:JTC_Summit_(8491645671).jpg), local `commons_JTC_Summit_8491645671_jpg.jpg`. Inspected directly: approximately a few dozen small warm cream interior lights are visible, concentrated as isolated ceiling strips, with many dark teal panes and an otherwise unlit metallic facade. No blue, purple, red, or animated facade wash is visible; the crown itself is dark. The podium behind the trees is too occluded to verify its complete lighting pattern. The model uses the kit's shared `lmMat` office-window night shader and does not invent a coloured facade display. This is a dusk photo, not a verified deep-night lighting survey.
- Known gaps: louvre crown footprint is an inset of the glass OSM part; rooftop service locations and atrium roof segmentation are approximate. A deep-night view has not been verified. The module clones its own glass material after batched flush, preserves the inherited PBR/lmMat compiler, and applies photo-derived sparse occupancy: 5.5% tower cells / 28% podium cells, warm cream (1,.86,.65) isolated upper-window ceiling strips from 78–94% of each shader floor cell. The inherited artificial crown glow is removed. This remains an occupancy estimate rather than a reconstruction of each photographed lit window. Brand marks are deliberately omitted.
- Validation: `node --check` passed; parent district build and r4 browser comparison passed with **zero page errors and zero console errors**. Rendered geometry: **19,954 triangles** including rear facade piers.

## Final matched-camera results (r4)

| View | IoU |
| --- | ---: |
| n | 0.931 |
| e | 0.846 |
| s | 0.938 |
| w | 0.842 |
| top | 0.826 |
| close_ne | 0.819 |
| close_sw | 0.976 |
| street | 0.934 |

Mean n/e/s/w/top: **0.877**. Mean of all eight views: **0.889**. Compare sheet and masks are local-only under `/workspace/eo_je_out/gateway/`, round `renders/r4`.

## Stopping reason and remaining fit error

The photographed southwest curved glass silhouette fits closely (`close_sw` 0.976). The north/east and top overlays retain a narrow reference-only strip along the straight northeast cream rear bar: its OSM building-part plate appears slightly shallower than the photographed building. The broad southwest podium has a model-only rim in the top projection, with reference-only straight roof strips on its northeast side; podium roof profiles, terrain alignment, image photogrammetry and the 3 m clipping context all affect these residuals. The supplied camera cuts off the tower crown in the cardinal frames, so those scores do not verify crown detail. Roof/crown subdivisions remain approximate.

The model retains the real supplied parent and OSM building-part polygons instead of expanding plates solely to raise IoU. No speculative tree masses or extra footprint geometry were added. The r4 night rendering exposed overly bright 58% inherited occupancy. A subsequent material-only correction reduces tower occupancy to 5.5% and podium to 28%, narrows each light to an upper-window ceiling strip, makes light consistently warm cream, and removes inherited crown glow. The batched geometry and day silhouettes are unchanged; the parent performs the final night retest. Coloured floodlighting or animated displays were not added. Further fitting would need better evidence of the rear bar outline and an unobstructed roof/crown survey, rather than another silhouette-driven expansion.
