# Masjid Angullia

OSM 396336447. Current four-storey prayer hall behind the separately conserved
three-arch gatehouse, pointed upper jali niches, two tall front blind/glazed
arches, cream bands and side glazing, a short corner roof tower, light steel
roof pavilion and small service plant. Current photographs show coral/cream
paint; the old green gatehouse image is archival. Gate pinnacles are fitted to
about **6.9 m**, independent of the much taller new hall. No lettering or logos.

Hall parapet about **19.9 m**, highest corner finial **25.6 m**: photographic
proportion estimates, not a measured current-building height. **18,566 triangles**,
four shared material batches. Source for the current form and storeys:
https://www.extron.com/article/angullia ; official redevelopment fact sheet:
https://www.nas.gov.sg/archivesonline/data/pdfdoc/20180223002/Fact%20Sheet%20-%20Masjid%20Angullia%20-%20Launch%20of%20Upgrading%20Project.pdf .
The fact sheet explicitly describes demolition of the former building and a new
four-storey hall, steel lattice dome and minaret; it gives no current metre height.

**The supplied tile references show the former two-storey mosque**, with a red
pitched roof and solid dome. Their maximum **13.3 m**, p90 9.0 m and p50 8.3 m
in `/workspace/li_refs/angullia_mosque/meta.json` therefore cannot establish the
height or silhouette of the post-2020 replacement. The model retains the current
photographed architecture; it has not been compressed into the obsolete shell.
The shared provisional 16 m also does not describe the model's current maximum.

Actual current night photo, inspected and saved outside git:
https://commons.wikimedia.org/wiki/File:Masjid_Angullia.jpg . Warm/white upper
sconces and a lit entry support restrained warm facade illumination, not an
all-green wash. Day exterior, archival gatehouse photos and official PDF are in
`/workspace/li_photo_refs/angullia_mosque/`, with SOURCES.md. No textures or meshes.

## Validation and limits

Offline finite geometry and build syntax checks pass. First r7 matched-camera
scores against the HISTORICAL building: n 0.555, e 0.591, s 0.587, w 0.519,
top 0.852, mean 0.621; close NE 0.576, close SW 0.560, street 0.456. These are
reported for transparency and are **not current-building acceptance scores**.
The high top score supports the OSM site position; elevated views compare two
different buildings. Page and console errors were zero. Final gate-height/detail
check follows. Upper jali, roof lattice joints and pointed-arch curves are simplified.

Lead action: obtain current-era reference images/measurements for this slug before
using IoU as a fit criterion; do not replace current heights with the old 13.3 m.

## Final verification snapshot

Round **r8**; 18566 triangles.

| n | e | s | w | top | close NE | close SW | street |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0.555 | 0.589 | 0.585 | 0.518 | 0.848 | 0.575 | 0.560 | 0.458 |

Mean n/e/s/w/top **0.619**; all-view mean **0.586**.
These scores compare against the superseded building and are not a current-building fit certificate.

Final full-app comparison and independent day/night detail runs have **zero page
errors and zero console errors**; retired placement list is empty. Final images,
verification.json and li_iou.json are under `/workspace/eo_li_out/heritage/`, outside git.

## Round 2

Re-inspected all supplied images: they still depict the superseded red-roof,
solid-dome mosque. Current Commons night and Extron day exteriors plus the official
MUIS redevelopment fact sheet establish the current four-storey hall. Retained
its estimated 19.9 m parapet / 25.6 m highest finial instead of compressing it to
obsolete 13.3 m metadata. No geometry was added to match the historical roof.

Added small upward sconces at the upper jali niches in the current night photo,
illuminated those bronze screens, and replaced the office-window emission grid
with quiet continuous interior light in a dedicated shared lmMat batch. The
freestanding gate, side entry canopy and restrained roof remain. Night source:
https://commons.wikimedia.org/wiki/File:Masjid_Angullia.jpg (saved commons.jpg).
Geometry check passes. The historical-reference scores remain a limitation, not a
certificate of the present-day massing. Lead still needs current-era reference
renders and current-height metadata; no shared file was edited.

Current night-photo check separated the upward-lit niche screens into an even
local wash batch: their lights originate at the high sconces, so they should not
use a ground floodlight's height falloff. This also avoids relying on the shared
13.3 m historical height for those high-level lights. Runtime maximum metadata
still needs the lead's correction. No shared shader/core was changed.
