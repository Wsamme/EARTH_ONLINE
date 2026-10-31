# House of Tan Teng Niah — round 2 final

OSM 178436852; replaces `sgtantengniah`. Actual stepped two-storey plan,
recessed red entrance/five-foot way, blue/yellow columns, paired rainbow louvred
shutters, lunettes, geometric carved panels, fluted pilasters, multicolour fascia,
bracket dentils, timber doors, intersecting terracotta hip roofs, narrow physical
tile rolls, shallow green canopy and rear air conditioners. Sign panels are blank.

External meta.json maximum **11.5 m**, p90 **10.2 m**, p50 **8.6 m**. Main ridge
11.5 m, eaves 7.8 m, upper floor 3.85 m. Retained short equal-pitch hip ridges
and real roof overhangs after rechecking all round-2 views.

Night photo: Rosanazareth, 28 June 2023, CC BY-SA 4.0,
https://commons.wikimedia.org/wiki/File:HouseOfTanTengNiah.jpg . Saved `night.jpg`
and SOURCES.md remain in `/workspace/li_photo_refs/tan_teng_niah/`. It shows warm
globe lamps, a white streetlight, bright front shutters/columns and red entry,
with a dark roof. Round 2 gives that frontage its own stronger warm wash; sides
remain quieter. No all-window emission or rainbow neon.

Day paint/roof source:
https://www.visitsingapore.com/neighbourhood/featured-neighbourhood/little-india/tan-teng-niah-house/ .
Known gaps: fine carving and roof curvature are geometric approximations. The
older tile images have a front forecourt structure absent from the 2023 night
photo; it is omitted. Neighbouring roofs/trees and the 3 m buffer affect low n/s
IoU. No temporary stalls or enlarged shell were added to force the score.

## Final validation

**23,909 triangles**, 4 shared material batches.

| n | e | s | w | top | close_ne | close_sw | street |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0.695 | 0.712 | 0.645 | 0.718 | 0.749 | 0.708 | 0.725 | 0.769 |

Mean n/e/s/w/top **0.704**; all-view mean
**0.715**. Final matched-camera run: **r2final**.

`bash tools/bv_build.sh --test` and the offline finite-geometry check pass.
Matched-camera and independent detail checks have **zero page errors and zero
console errors**, with no retired landmarks still placed. Results, overlays,
comparison sheets, geometry and verification JSON stay under
`/workspace/eo_li_out/heritage/`, outside git. References/photos are never runtime
assets. No logos, brand text, photographic textures or external meshes are used.

Lead branch was merged without rebasing; its Deepavali `noHull` fix remains.
No shared source/data files were edited by this round-2 worker work.
