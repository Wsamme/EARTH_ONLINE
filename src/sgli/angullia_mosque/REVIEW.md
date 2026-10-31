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
