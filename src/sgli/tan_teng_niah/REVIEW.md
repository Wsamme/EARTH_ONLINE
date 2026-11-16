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

## Round 3 — local Street View pass

Inspected the richly painted frontal 2018-02 view and 2019-09 entry, then
2024-02 and newest 2026-04 rear/side views. The newest views show a predominantly
blue side wall and quieter green shutters; they do not show the current front.
Changed the upper shell from grey and the lower side walls from cream to blue, kept three individually coloured
front shutter bays with red/green/blue trim, and replaced side ground-floor rainbow
arches with rectangular green louvred openings. Upper side shutters also have
rectangular lintels; rainbow lunettes, pilasters and fascia are concentrated on
the front, with pale quieter side fascia. The red recessed entry and
blue/yellow columns remain, with blank signage panels.

The 11.5 m ridge / 7.8 m eaves and 3.85 m floor line remain tile-derived. The
saved 2023 Commons night photograph remains newer evidence for the front paint
and warm entry/globe lamps than the frontal Street View; no neon added. Gaps:
front-versus-side date conflict, fine carving and curved tile edges. No modern
rear equipment was copied from Street View imagery into runtime textures.

Round-3 night cross-check: re-inspected the saved external night photograph
listed above; reference remains outside the repository and no photographic
texture is used.

The matched frontal Street View render exposed a left/right bay paint reversal
in the local edge traversal. Final front shutters read pink on the viewer's
left, yellow/green in the centre and blue on the right, following the frontal
reference and the 2023 night photo. Round s2 refreshes this final paint pass.

## Round 3 final validation

Model **15,518 triangles**, 4 shared batches; maximum 11.50 m above anchor datum.

| n | e | s | w | top | close_ne | close_sw | street |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0.696 | 0.711 | 0.646 | 0.719 | 0.749 | 0.706 | 0.721 | 0.770 |

Tile n/e/s/w/top mean **0.704 → 0.704**; all-view mean **0.715 → 0.715**.
Nominal skyline mean **0.765 → 0.765**.

Final targeted tile and Street View round **s2** both report **zero page errors and zero console errors**. The complete six-slug s1 runs also report zero errors. Build syntax and finite-geometry checks pass. Sheets and verification remain outside git under `/workspace/eo_li_out/heritage/`.

**Shared skyline metric limitation:** the all-scene mask retains a blue/purple sky gradient, which the scorer's magenta threshold counts as solid. For example, an Angullia clear-sky pixel is RGB (134,162,221), and only 0.06% of that frame is detected as void. These nominal skyline scores cannot establish facade or precise skyline accuracy. The tile black/white landmark masks are unaffected. Diagnostic evidence is in `round3_skyline_mask_audit.json` outside git. The lead needs to apply background/sky overrides after frame hooks and explicitly suppress sky/weather in the mask pass. Shared tools were not edited.

Process-status note: the final s2 Street View shell wrapper ultimately returned
143 after writing every expected capture, both skyline scores and its
zero-page/console-error JSON. All 12 manifest entries across the two final slugs
have day, night, scene-mask and landmark-mask files. This status anomaly is
recorded in the external round3_manifest.json; no missing captures were found.
