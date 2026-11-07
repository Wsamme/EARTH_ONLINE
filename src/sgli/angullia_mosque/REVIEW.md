# Masjid Angullia — round 2 final

OSM 396336447. Current four-storey prayer hall, separately conserved
three-arch gate, upper pointed jali niches, tall blind/glazed front arches,
cream bands, side glazing, short corner roof tower, light steel roof pavilion,
service plant and entrance canopy. Current photographs show coral/cream paint;
old green gatehouse photographs are archival. Gate finials are about 6.9 m.

Current model parapet **19.9 m**, highest finial **25.6 m**, estimated from current
photographic proportions, **not a measured current height**. Current building and
storeys: https://www.extron.com/article/angullia and the official MUIS fact sheet:
https://www.nas.gov.sg/archivesonline/data/pdfdoc/20180223002/Fact%20Sheet%20-%20Masjid%20Angullia%20-%20Launch%20of%20Upgrading%20Project.pdf .
The fact sheet establishes replacement of the former building but gives no metre
height.

**The supplied tile images show the superseded red-roof, solid-dome mosque.**
Their max **13.3 m**, p90 9.0 m, p50 8.3 m cannot fit the post-2020 replacement.
Shared runtime height still says 13.3 m; lead should supply current-height metadata.
The official IoU below compares different buildings and is not a fit certificate.

Night photo: https://commons.wikimedia.org/wiki/File:Masjid_Angullia.jpg , saved
`commons.jpg` in `/workspace/li_photo_refs/angullia_mosque/` with SOURCES.md.
Added photographed upper sconces and a dedicated even wash for bronze jali
screens; their high lights do not use a ground-floodlight height falloff. Replaced
the office-window grid with restrained continuous interior light. This is a local
lmMat adaptation; no shared shader/core was changed.

Known gaps: historical reference mismatch, unmeasured current maximum, simplified
jali/roof-lattice joints and pointed curves. Lead needs current-era comparison
renders before accepting or rejecting current-building massing. The shell is not
compressed into the obsolete 13.3 m building just to improve IoU.

## Final validation

**18,794 triangles**, 5 shared material batches.

| n | e | s | w | top | close_ne | close_sw | street |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0.555 | 0.589 | 0.585 | 0.518 | 0.848 | 0.575 | 0.560 | 0.458 |

Mean n/e/s/w/top **0.619**; all-view mean
**0.586**. Final matched-camera run: **r2angullia**.

`bash tools/bv_build.sh --test` and the offline finite-geometry check pass.
Matched-camera and independent detail checks have **zero page errors and zero
console errors**, with no retired landmarks still placed. Results, overlays,
comparison sheets, geometry and verification JSON stay under
`/workspace/eo_li_out/heritage/`, outside git. References/photos are never runtime
assets. No logos, brand text, photographic textures or external meshes are used.

Lead branch was merged without rebasing; its Deepavali `noHull` fix remains.
No shared source/data files were edited by this round-2 worker work.

## Round 3 — local Street View pass

Inspected contact sheet and 2024-02 facade-facing panos 00/01, rear/alley 03/04,
and 2024-09 night pano 05. The long flank has four structural bays with paired upper niches, cream
horizontal framing at the ground-storey head and below the upper niche band,
broad recessed two-level glazing and reddish jali at the sill/ground storey.
Replaced three rows of office-window rectangles with that rhythm, added physical
diamond relief, a flat-headed large corner jali, the opposite flank's two large
glazed openings and small slit-window service bays, and changed coral/cream/glass colours to the newer views. The
separate three-arch conserved gate and its approximately 6.9 m finials remain.
The side roof rays in 2024-02 panos 00/01 intersect a 19.55 m roof plane at
local (9.08,-5.58) and (8.96,-11.28), using approximate roof pixels (320,110)
and (320,80). The new upper hall flank is therefore placed near x=9 m rather
than carrying forward the tapered x=11.45 corner of the old OSM building.
Original OSM ground paving and the freestanding gate stay in place.

A separate rear/side roof check in pano 04_1, around pixels (320,303–315),
puts the roof edge at approximately 19.2–20.6 m on the opposite facade plane,
consistent with retaining the current roof height within image-reading error.

The four-storey hall remains an estimated 19.9 m parapet / 25.6 m corner finial,
consistent with the manifest's near cameras and pitched-up roof views to roughly
2 m precision. This is an image-based estimate, not a surveyed height. Local
2024-09 night evidence supports warm upper niches and a darker facade. The old
13.3 m tile mosque is a different structure and is reported without fitting it.
Known gaps: exact jali motifs, diagonal recess returns, roof pavilion joints,
and the current hall's unsurveyed height. Screens are geometric abstractions.

Round-3 night cross-check: re-inspected the saved external night photograph
listed above; reference remains outside the repository and no photographic
texture is used.

## Round 3 final validation

Model **35,869 triangles**, 5 shared batches; maximum 25.60 m above anchor datum.

| n | e | s | w | top | close_ne | close_sw | street |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0.552 | 0.575 | 0.584 | 0.518 | 0.816 | 0.572 | 0.560 | 0.454 |

Tile n/e/s/w/top mean **0.619 → 0.609**; final all-view mean **0.579**.
Nominal skyline mean **0.561 → 0.559**.
The originally supplied Angullia baseline was 0.559; the completed lead before captures re-score to 0.561. Stale tile comparison remains exempt from fitting.

Build syntax and finite-geometry checks pass. Six-slug tile and Street View round **s1** both report **zero page errors and zero console errors**. Sheets and verification remain outside git under `/workspace/eo_li_out/heritage/`.

**Shared skyline metric limitation:** the all-scene mask retains a blue/purple sky gradient, which the scorer's magenta threshold counts as solid. For example, an Angullia clear-sky pixel is RGB (134,162,221), and only 0.06% of that frame is detected as void. These nominal skyline scores cannot establish facade or precise skyline accuracy. The tile black/white landmark masks are unaffected. Diagnostic evidence is in `round3_skyline_mask_audit.json` outside git. The lead needs to apply background/sky overrides after frame hooks and explicitly suppress sky/weather in the mask pass. Shared tools were not edited.
