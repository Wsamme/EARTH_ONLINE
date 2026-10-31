# Masjid Abdul Gafoor — round 2 final

OSM 176326990; replaces `sgabdulgafoor`. Top/n/e references exposed a
180-degree reversal in the inherited architectural frame. The corrected main
prayer hall/cupola occupies the northwest roof; the sunburst/entrance faces
southeast into the court. The southwest frontage has low green-roofed wings,
and a narrow clay-roof ancillary wing stands on the eastern side of the court.
The courtyard stays open. Features include five cusped front bays, open side
verandahs, pilasters, 22 parapet turrets, small onion domes, 25 sunburst rays,
hexagonal cupola, steps and service plant. Inscription areas are blank.

Meta.json gives ground **14.65 m**, roof max **25.42 m** ellipsoidal: difference
**10.8 m**, p90 **4.3 m**, p50 **3.4 m**. Finial remains 10.8 m and main roof
4.3 m; low frontage about 3.5 m, clay-roof wing eaves 3.4 m / ridge 5.05 m.
The low sampling percentiles include court/low wings and are not a survey of each
architectural element. White/green paint and the five-bay frontage follow NHB's
current restoration photograph:
https://www.roots.gov.sg/stories-landing/stories/Abdul-Gafoor-Mosque/Abdul-Gafoor-Mosque-A-Sensitive-Restoration .

Night evidence: saved `nhb_page40.png`, printed p40 / PDF p42 of NHB's 2018
Little India trail booklet, showing an actual 1992 URA night photograph:
https://www.roots.gov.sg/-/media/Roots/Files/little-india-heritage-trail/nhb_littleindia-trail-booklet_2018.pdf?la=en .
It supports warm frontage light; the tree obscures the roof. Repeated round-2
web searches did not establish contemporary dome lighting. Restrained green dome
wash follows the brief and remains **unverified**. All photos/SOURCES.md stay in
`/workspace/li_photo_refs/abdul_gafoor/` outside git.

Known gaps: height/ground sampling uncertainty, abstracted ornament, simplified
interiors and omitted temporary awnings. Correcting the reversed hall and removing
the oversized extension reduced official mean **0.698 → 0.688** despite a much
closer top-view roof arrangement; this decline is not hidden. Remaining red
perimeter includes the 3 m buffer; no mass was inflated to raise scores.

## Final validation

**45,397 triangles**, 4 shared material batches.

| n | e | s | w | top | close_ne | close_sw | street |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0.656 | 0.689 | 0.670 | 0.663 | 0.761 | 0.699 | 0.723 | 0.561 |

Mean n/e/s/w/top **0.688**; all-view mean
**0.678**. Final matched-camera run: **r2c**.

`bash tools/bv_build.sh --test` and the offline finite-geometry check pass.
Matched-camera and independent detail checks have **zero page errors and zero
console errors**, with no retired landmarks still placed. Results, overlays,
comparison sheets, geometry and verification JSON stay under
`/workspace/eo_li_out/heritage/`, outside git. References/photos are never runtime
assets. No logos, brand text, photographic textures or external meshes are used.

Lead branch was merged without rebasing; its Deepavali `noHull` fix remains.
No shared source/data files were edited by this round-2 worker work.
