# Ng Teng Fong / Jurong Community Hospital — reference fit, round 2

## Geometry

`ng_teng_fong.js` registers the single labelled `sgje_ng_teng_fong` campus.
The original anchor and all three OSM podium polygons remain in local metres
(+x east, +z south): acute hospital B way 368005263, community hospital C way
368005259, and outpatient clinics A way 320763066. No labelled subkeys, model
text, logos, photographic textures, external meshes or reference assets ship.

The reference fit replaces the previous podium-sized ward plates with inset
upper plates, a lower clinic-side ward wing, an articulated taller ward wing,
a rounded transverse service core and pale plant crown. The community wards
are inset from their podium. The clinic's upper block stops before its lower
terrace. Balcony slabs, green planter bands, rails, bay reveals, stair landing
edges, roof solar banks, small screened plant, roof gardens, sheltered links,
entrance canopies and blank lit panels are original batched geometry.

The long capsule on the northeast side is a low entrance canopy, not another
tall ward slab. This distinction is evident when the top image is read with
the close NE view. No helipad is established by the supplied photos, so none
is modelled.

## Heights and uncertainty

Source: `/workspace/je_refs/ng_teng_fong/meta.json`, supplied image-only
reference survey. The measured **site maximum is 94.2 m**, the roof p90 is
**81.3 m**, and the roof p50 is **25.9 m**. Ground is **18.13 m** and the highest
roof sample **112.37 m**, both WGS84 ellipsoidal elevations, not MSL. The source
uses the maximum of an inside-footprint grid and the 25th percentile of 36
outside ground samples. These are site-wide measurements, not independent
surveys of each tower.

Model elevations above the local terrain base:

| Element | Elevation used | Basis |
| --- | ---: | --- |
| B pale service crown | 94.2 m | measured site maximum |
| B main ward roof datum | 81.3 m | site p90, checked against matched views |
| B clinic-side ward roof datum | 57.5 m | top/cardinal/close-view fit |
| B common podium | 20 m | image fit; approximate |
| C ward roof / service crown | 57 / 61 m | image fit; approximate |
| C podium | 18 m | image fit; approximate |
| A clinic roof / crown | 44.5 / 47 m | image fit; approximate |
| A lower terrace | 14 m | image fit; approximate |
| Sheltered link floors / roof | 12 / 16.35 m | image fit; approximate |

Small parapets and plant rise above the ward datums: about 84 m on the main
ward, 60 m on the low wing, 59.5 m on C, and 48.4 m on A. The tallest geometry
remains 94.2 m. The measured maximum is applied in this owned module so runtime
landmark statistics agree; the shared footprints file is not edited.

## Photographic and night-lighting check

Day sources are the supplied top, N/E/S/W and close NE/SW images, the five
Commons photographs, and CPG's elevated exterior photograph. The local photo
folder `/workspace/je_photo_refs/ng_teng_fong/SOURCES.md` records the original
URLs, creators and licences. References remain outside the repository.

Night reference: HOK's **Ng Teng Fong Hospital Close Up Night**,
`/workspace/je_photo_refs/ng_teng_fong/hok_close_up_night.jpg`, linked from its
[27 March 2025 anniversary article](https://www.hok.com/news/2025-03/ng-teng-fong-general-hospital-celebrates-10-years-of-sustainable-design-excellence/).
It shows pale illuminated glazing, warmer recessed terrace soffits, dark
planters, and an unlit pale crown. Shared `lmMat` batches retain varied cool
ward-window lighting and warm entrance soffits; this pass adds recessed warm
balcony strips. The planted bands and crown faces have no self-glow; only the
sheltered underside of the crown has a warm strip, as in the HOK photograph. Exact
window occupancy, fixture placement and all canopy light colours remain
approximations. No coloured facade spectacle or red helipad lighting.

## Comparison and verification

The prescribed `bash tools/bv_build.sh --test` passes the assembled-app
syntax check. Full-app comparisons use port 8053 and
`JE_OUT=/workspace/eo_je_out/health`, through the shared browser lock.

The baseline rerun `r2_baseline_retry` uses the original module from commit
`1b5e45d`: runtime height 75 m and 53,775 triangles. `r3_fit` uses the inset
ward plates and corrected crown (46,882 triangles). `r4_final` incorporates
the clinic roof correction, garden surfaces, crown seams and sheltered soffit
lighting (47,784 triangles). The first baseline attempt lost its temporary
HTTP server while queued; the detached-server retry and both fitted rounds
all exit 0 with **zero pageErrors and zero consoleErrors**.

| View | Round 1 baseline | First fit | Final |
| --- | ---: | ---: | ---: |
| n | 0.754 | 0.808 | 0.819 |
| e | 0.752 | 0.846 | 0.842 |
| s | 0.781 | 0.857 | 0.858 |
| w | 0.759 | 0.793 | 0.794 |
| top | 0.856 | 0.864 | 0.860 |
| close_ne | 0.704 | 0.785 | 0.779 |
| close_sw | 0.709 | 0.796 | 0.796 |
| street | 0.697 | 0.774 | 0.777 |
| **Mean N/E/S/W/top** | 0.780 | 0.834 | 0.835 |
| **Mean all eight** | 0.751 | 0.815 | 0.816 |

The primary mean improves **0.780 → 0.835 (+0.055)**, with all eight views
improving over round 1. The final increment over the first fit is only 0.001:
the clinic roof now follows its rounded upper block, rather than extending a
tall slab across the lower terrace. An offline 2 m reduction to C changed the
primary mean by only about 0.001 and worsened close NE; it was not adopted.
Further height changes lack stronger evidence. Score improvements come from
the measured crown, inset upper plates and setbacks, not inflated site extras.

Final runtime: **47,784 triangles**, three material batches. Offline
construction agrees, with no non-finite positions. Local geometry bounds are
x −200.135 to 183.650 m, z −177.711 to 139.641 m, and y −0.5 to 94.2 m before
the standard terrain-base adjustment. This is 5,991 fewer triangles than the
original model, about 11% less.

All ten matched-camera day/night captures find the landmark. The final
S and close SW night images confirm dark roof gardens/planters and crown
faces with varied cool window lights. Six additional photographic review
captures in `night_review_r2/`, including lower `street_night.jpg` and
`balcony_night.jpg`, confirm the warmer sheltered soffit strips. That review
also exits 0 with zero page/console errors and the same runtime triangle count.
The lower views are close detail crops, not extra IoU cameras.

Final metrics: `/workspace/eo_je_out/health/je_iou.json`; round history:
`/workspace/eo_je_out/health/round_metrics.json`. Images, masks and verification
are in `renders/r2_baseline_retry/`, `renders/r3_fit/`, `renders/r4_final/` and
`night_review_r2/` under the same output root. The final compare sheet is
`ng_teng_fong_compare.jpg`. All outputs and reference imagery stay outside
the repository.


The standard scorer is unchanged: matched reference cameras, isolated model
mask, footprint +3 m reference mask with column filling. The comparison signal
includes trees, ground surfaces and conspicuous clipped terrain skirts under
A. Those skirts are not building walls; no artificial walls or inflated site
geometry were added to chase them. Street tiles were marked unsettled in the
source metadata, so that score is secondary.

An optional owned offline preview is available while the shared browser lock
is busy:

```sh
node tools/je_health_fit.mjs /workspace/eo_je_out/health/preview
OPENBLAS_NUM_THREADS=1 python3 tools/je_health_fit.py /workspace/eo_je_out/health/preview
```

It projects only our original model triangles, checks finite coordinates and
bounds, and writes local overlays. It does not read, sample or reconstruct any
reference mesh. Its planar camera approximation and rasterization differ from
the full app; its scores are preliminary, not the final browser scores.

## Remaining gaps

The site maximum is measured; individual tower and podium heights, upper
plate outlines, link elevations and roof equipment remain image estimates.
Balcony planting, roof arrays and mechanical enclosures are simplified.
Reference terrain skirts, the buffer, and vegetation limit silhouette IoU.
Night illumination is photographically informed, not a fixture survey.
No shared-code change is required.
