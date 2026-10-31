# Buona Vista visual review

The local photo references are not shipped. The external output directory holds
all exact-camera renders and labelled comparison sheets, with prior rounds in
separate directories. Each round covers N/E/S/W/top/street for all nine sites.
The final report below distinguishes model features from unresolved differences.

## First silhouette review → second renders

Each row records the three largest observed differences in the first six-view
sheet, followed by the corresponding corrections.

| Building | Three largest differences | Corrections |
| --- | --- | --- |
| Star Vista | Front shell too high relative to rear; southern shell too wide at its east tip; five-storey glazed base too tall and missing the intermediate metal ribbon | Reversed the shell height hierarchy; shortened/tapered the southern span; reduced shopping galleries to three levels and added a folded aluminium ribbon |
| Metropolis | Upper/lower blocks too similar in footprint; terrace slightly low; older OSM boxes obstruct the street view | Enlarged upper block relative to lower; lifted terrace by 2 m; added footprint-containment masking, including older blocks that contain replacement footprints |
| Buona Vista MRT | Concourse too solid/tall; roof lanterns too flat; entrance wing roof too high | Lowered concourse; raised lanterns; lowered entrance and added platform-edge door frames |
| Biopolis | Roofs look like stepped solid caps; large opaque lab elevations missing; external framing too sparse | Replaced raised roof caps with plant/parapets; added bronze slotted elevations to Chromos/Helios/Nanos; retained white external frames and enclosed bridges |
| Fusionopolis One | Flat crowns; western tower too short; upper sky gardens too narrow | Added swept crown profiles with two distinct oculi; raised western wing; added broad multi-floor white garden cages |
| Solaris | Sunshades lack projecting ledges; roof frame is an oval; roof gardens are flat lawns | Added physical louvre floor plates; rebuilt angular asymmetric frame; added planting beds, paths and trees |
| Galaxis | Long arm of office L too short; north cassette facade hidden behind glass; roof clutter too prominent | Extended tall arm southward; moved patterned cassettes outside glazing; used broad silver roof screen |
| Mediacorp | Studio fills too much of undercroft; theatre/upper volume lack intermediate massing; roof/service band too uniform | Narrowed/lowered studio and added opaque studio panels; added cantilever supports and planted slot; retained separate roof fans and service aisles |
| Rochester | Hotel incorrectly low; mall roof too low/flat; opaque tower spine missing | Restored OSM 102 m hotel and 36 m mall; added conservatory roof ribs; moved rose-beige spine outside the glazing |

The initial manual capture exposed an app interaction: the adaptive near plane
from the wide opening view clipped close shots. Those diagnostic captures were
replaced. Valid comparison rounds use an explicit 0.3 m near plane, exact recorded
poses and the app's frame/prerender lighting hooks. The geometry and production
camera are not moved to compensate for reference differences.

## Second silhouette review → third renders

All nine second-round sheets were inspected before these changes. Each row
records the three main remaining shape issues and the next correction.

| Building | Three main differences | Corrections |
| --- | --- | --- |
| Star Vista | Abrupt roof downturn; squared shell ends; atrium reads as a filled terrace | Smoothed the stepped roof profile, angled end caps, and opened an annular amphitheatre |
| Metropolis | Gables concealed by glazing; lower block insufficiently recessed; obstructing legacy podium | Moved gable surfaces outward, increased lower inset, and later masked the three legacy podium polygons separately |
| Buona Vista MRT | Roof lacks structural rhythm; platform edges sparse; track bed lacks rails | Added canopy trusses and edge frames; added rails, sleepers and joints along the app's actual EW alignment |
| Biopolis | Plant caps too bulky; opaque lab elevations too plain; bridge surroundings bare | Reduced caps, added layered slotted screens, and added merged trees around the linked blocks |
| Fusionopolis One | Oculi appear filled; crowns too flat; gardens lack deep framing | Cut actual roof openings, swept the crowns, and deepened white garden cages |
| Solaris | Facade too uniformly striped; ramp disconnected at upper wing; roof paths form an implausible radial pattern | Added broad glass slots, rebuilt one continuous morphing helical ramp, and replaced roof paths with perimeter/meandering paths |
| Galaxis | South elevation resembles north checker facade; L leg still weak; roof screen too fragmented | Added southern floor edges, reinforced long leg, and consolidated screen |
| Mediacorp | Studio too glazed; undercroft lacks supports; core merges with upper bar | Added opaque studio panels, cantilever supports and distinct cylindrical core |
| Rochester | Opaque spine too wide; balconies too shallow; mall conservatory too flat | Narrowed/lightened pink spine, added projecting balconies and pitched roof ribs |

## Materials and final validation

Subsequent six-view passes inspected all nine buildings again. Changes included
less saturated glass bay colours, office-window night materials using the
existing app shader, softer Rochester cladding, roof gardens, and the final
Solaris ramp/roof revision. The final full pass contains 54 exact-camera views;
the final Solaris revision has an additional six-view pass. All these final
runs reported zero page errors and zero console errors. The independent full-app
appshot flow also covers district day/night and four closer views.

The geometry check reports **263,932 model triangles**, plus **29,304 triangles**
for added EW rail detail: **293,236 total added triangles**. This is the addition's
budget, not the full city's draw count. All nine meshes contain finite vertices;
model maximum heights are within 2 m of the supplied measured values. Roof plant,
trees and parapets account for small differences. The generated inline script
passes `node --check`.

These are original, detailed procedural reconstructions, but they do **not yet
reach photographic replica fidelity**. Exact camera matching does not remove
the differences in the existing terrain, adjacent generic buildings or lighting.
The reference images remain local and are not shipped or attached to the PR.

| Building | Features represented | Remaining visual differences |
| --- | --- | --- |
| Star Vista | OSM anchor, split leaning shells, roof grid, stepped galleries and open amphitheatre | Shell folds, end curvature and underside remain simplified; close street surfaces differ materially |
| Metropolis | Twin measured-height towers, inset blocks, terrace slots and low podium | Offsets are more regular; roof plant, gable details and reflections are approximate |
| Buona Vista MRT | OSM station parts, canopy lanterns, platform edges and actual EW viaduct/rail alignment | Access concourse, stairs and structural joints are simplified; terrain differs |
| Biopolis | Seven real footprint blocks, linked bridges, external frames and screened lab elevations | Individual block heights are estimates; roof plant, facade patterns and landscape are approximate |
| Fusionopolis One | Three curved plates, two roof oculi, garden cages and bridges | Crown curves, oculus proportions and garden truss arrangement are not exact |
| Solaris | Unequal wings, horizontal louvres, continuous planted ramp, atrium and roof frame | Terraces are too regular; ramp route, truss layout and planting density differ |
| Galaxis | L plan, pilotis, north checker facade, southern horizontal bands and roof screen | Cassette arrangement, annex details and roof equipment are simplified |
| Mediacorp | Floating tapered bar, theatre/studio volumes, cylindrical core and roof fans | Undercroft, studio massing, roof services and metal finish remain approximate |
| Rochester | One cranked main tower, hotel/mall footprints, balconies, pink spine and ribbed mall roof | Balcony stacks, roof profiles and mall facade are simplified |

## Star Vista v3 follow-up — exact-camera result

This section supersedes the earlier Star Vista assessment and triangle totals.
The other eight model sources and geometry records are unchanged. OSM anchor:
**way 104352121**, measured roof maximum **74.5 m**. The new mesh reaches 74.67 m
including roof seams, with **76,232 triangles including its context**. All nine
models plus added rails total **343,389 triangles**.

All 61 new references and the original six were inspected. Final acceptance uses
all **67 supplied exact camera poses** at 1600×1000 / horizontal FOV 60°, with
ellipsoidal altitude minus ground 19.4 m added to the scene anchor ground. The
67-camera render, baseline mask run and independent six-view full-app appshot
reported **zero page and console errors**. Source hashes match the final module.
A transient Chrome WebGL-context initialization failure caused rejected attempts;
the fresh-browser reruns above succeeded and are the accepted results.

### What the methods changed

1. The expanded orbit/top/close references exposed the high roof's stop before a
   lower eastern apron, western glass slots, varying crossfall and folded soffit.
2. Public architectural research fixed retail B1–L2 and the floating theatre /
   33 m foyer interpretation. Sources: [operator](https://thestarvista.sg/about-us),
   [Aedas](https://www.aedas.com/en/project/the-star/),
   [architect account, plans, section and photographs](https://www.archdaily.com/510587/the-star-andrew-bromberg-of-aedas),
   [structural engineer](https://www.thorntontomasetti.com/project/star-vista), and
   [lighting designer](https://www.lighting.co.jp/en/projects/the-star-vista-and-the-star/).
   The full source notes and measurement assumptions are in
   [star_vista/REVIEW.md](star_vista/REVIEW.md) and `measurements.json`.
3. Sparse photo-ray checks and repeated fixed-mask IoU comparisons guided roof
   control sections, west reach, reveal depth, base and canopy corrections.
4. Folded surfaces now have clipped panel triangles, independent face winding,
   upward roof normals, seams and roof grids. The geometry check finds no
   degenerate triangles or nonfinite positions.
5. An in-memory procedural cube map adds r128-compatible reflections. Panel tones,
   warm outline/atrium strips and restrained blue theatre light replace a uniformly
   dull night enclosure; no photographs or logos are applied to the mesh.
6. Street work adds the curved retail rim, open court, foyer supports, escalators,
   low north canopy, northeast entrance connector, plaza steps and planting.

The first three major silhouette problems were the uniform box-like roof sweep,
the over-deep reveal / flat underside, and the disconnected retail base. Successive
geometry rounds replaced them with separate roof sections/apron, a shallower slot
and folded soffit, and connected curved galleries/canopies. Material rounds then
reduced tone checkerboarding, added reflection and lighting, and removed seam-beam
shadow speckling. All final comparison sheets and both heroes were inspected.

### Measurement limits and remaining status

Mean raw IoU is **0.800 → 0.845** across **62 paired observable/cropped views**.
58 paired views improve and four regress. All six original views improve. The north street crop regresses by 0.025; this
small, heavily obstructed crop is not evidence of a fully observed base. Five
views have unavailable scores because the building boundary is hidden. They were
rendered and remain in the sheets. Cropped-view IoU is not a whole-building score.

The same final hand-reviewed photo masks are used for both versions. Corrections
to inaccurate initial outlines were applied to both, and are recorded by annotation
hashes in the JSON report. Masks have roughly 5–10 px uncertainty at the 800 px
annotation width. The JSON includes an additional diagnostic outside a 10 px
rendered-image boundary band. IoU is an occupancy metric, not proof of material or
construction accuracy.

The model is more recognisable, but **still does not reach photographic replica
fidelity**. Its southern curved enclosure remains too planar, the main reveals
and fold positions are approximate, and the pale cladding lacks the real etched
glass/translucency and internal truss shading. Retail terraces, ramps, gardens and
site grading remain simplified; the flat app terrain limits the below-ground
amphitheatre. Night light is an approximation, not a photometric recreation.
These gaps are visible in the supplied comparisons and should remain review items.

Outputs are local only: `/workspace/eo_codex_out/star_vista_v3.jpg`, the numbered
orbit/top/street/close/close150 sheets, `star_vista_v3_hero_day.jpg`,
`star_vista_v3_hero_night.jpg`, and `star_vista_v3_iou.json`. No reference image or
render is committed or attached to the PR. See the module review for reproduction.

### Per-view raw silhouette IoU

| View | Before | After | Scoring scope |
| --- | ---: | ---: | --- |
| original_n | 0.766 | 0.801 | Visible envelope |
| original_e | 0.778 | 0.816 | Visible envelope |
| original_s | 0.887 | 0.912 | Visible envelope |
| original_w | 0.732 | 0.802 | Crop / exclusions |
| original_top | 0.809 | 0.859 | Visible envelope |
| original_street | 0.791 | 0.821 | Crop / exclusions |
| orbit_h0000_p15 | — | — | Unavailable: obstructed |
| orbit_h0000_p35 | 0.796 | 0.870 | Crop / exclusions |
| orbit_h0225_p15 | 0.844 | 0.914 | Crop / exclusions |
| orbit_h0225_p35 | 0.819 | 0.892 | Visible envelope |
| orbit_h0450_p15 | 0.725 | 0.809 | Visible envelope |
| orbit_h0450_p35 | 0.859 | 0.915 | Visible envelope |
| orbit_h0675_p15 | 0.741 | 0.810 | Visible envelope |
| orbit_h0675_p35 | 0.859 | 0.906 | Visible envelope |
| orbit_h0900_p15 | 0.702 | 0.777 | Visible envelope |
| orbit_h0900_p35 | 0.832 | 0.879 | Visible envelope |
| orbit_h1125_p15 | 0.783 | 0.790 | Visible envelope |
| orbit_h1125_p35 | 0.803 | 0.833 | Visible envelope |
| orbit_h1350_p15 | 0.767 | 0.762 | Visible envelope |
| orbit_h1350_p35 | 0.753 | 0.766 | Visible envelope |
| orbit_h1575_p15 | 0.712 | 0.743 | Visible envelope |
| orbit_h1575_p35 | 0.814 | 0.831 | Visible envelope |
| orbit_h1800_p15 | 0.738 | 0.789 | Visible envelope |
| orbit_h1800_p35 | 0.755 | 0.799 | Visible envelope |
| orbit_h2025_p15 | 0.755 | 0.800 | Visible envelope |
| orbit_h2025_p35 | 0.803 | 0.870 | Visible envelope |
| orbit_h2250_p15 | 0.748 | 0.785 | Visible envelope |
| orbit_h2250_p35 | 0.796 | 0.849 | Visible envelope |
| orbit_h2475_p15 | 0.753 | 0.799 | Visible envelope |
| orbit_h2475_p35 | 0.815 | 0.856 | Visible envelope |
| orbit_h2700_p15 | 0.729 | 0.756 | Visible envelope |
| orbit_h2700_p35 | 0.772 | 0.806 | Visible envelope |
| orbit_h2925_p15 | 0.751 | 0.772 | Visible envelope |
| orbit_h2925_p35 | 0.788 | 0.829 | Visible envelope |
| orbit_h3150_p15 | 0.777 | 0.806 | Visible envelope |
| orbit_h3150_p35 | 0.839 | 0.828 | Visible envelope |
| orbit_h3375_p15 | 0.821 | 0.845 | Crop / exclusions |
| orbit_h3375_p35 | 0.841 | 0.873 | Crop / exclusions |
| close150_h000 | 0.782 | 0.882 | Cropped view |
| close150_h045 | 0.890 | 0.909 | Cropped view |
| close150_h090 | 0.868 | 0.906 | Cropped view |
| close150_h135 | 0.796 | 0.837 | Cropped view |
| close150_h180 | 0.876 | 0.915 | Cropped view |
| close150_h225 | 0.818 | 0.893 | Cropped view |
| close150_h270 | 0.798 | 0.869 | Cropped view |
| close150_h315 | 0.825 | 0.869 | Cropped view |
| street_s | 0.714 | 0.778 | Crop / exclusions |
| street_n | 0.949 | 0.924 | Crop / exclusions |
| street_e | 0.870 | 0.888 | Crop / exclusions |
| street_w | — | — | Unavailable: obstructed |
| top_full | 0.805 | 0.854 | Visible envelope |
| top_ne | 0.664 | 0.684 | Cropped view |
| top_nw | 0.891 | 0.948 | Cropped view |
| top_se | 0.781 | 0.868 | Cropped view |
| top_sw | 0.944 | 0.928 | Cropped view |
| cu_edge_east | 0.790 | 0.855 | Cropped view |
| cu_edge_west | 0.836 | 0.880 | Crop / exclusions |
| cu_edge_north | 0.864 | 0.901 | Crop / exclusions |
| cu_edge_south | 0.758 | 0.841 | Cropped view |
| cu_reveal_south | 0.769 | 0.884 | Crop / exclusions |
| cu_reveal_north | 0.843 | 0.921 | Crop / exclusions |
| cu_atrium_top | 0.828 | 0.889 | Cropped view |
| cu_atrium_side | 0.844 | 0.853 | Cropped view |
| cu_glassbase_north | — | — | Unavailable: obstructed |
| cu_glassbase_south | — | — | Unavailable: obstructed |
| cu_glassbase_east | 0.750 | 0.863 | Crop / exclusions |
| cu_glassbase_west | — | — | Unavailable: obstructed |

## Star Vista night/show lighting

Pass 2 replaces the single luminous rectangle with a continuous, edge-brightened
blue-white enclosure. It retains the documented 20-second blue/turquoise cycle,
keeps the roof planes dark, adds crisp cool-white slab/fold/prow strips and uses
darker retail glazing with varied warm bays and ceiling bands. Soffit emission,
visible step-nosing strips, fountain floor lights and 21 tapered jet ribbons
complete the warm base. `show=1` raises foyer warmth/brightness and introduces
inferred whole-enclosure pulses and sweeps with an eight-second wider palette;
`show=0` or no parameter selects normal night. All lighting follows the app's
night factor. There are no sky beams, event schedule, logos or advertising.

The local court fragment mask prevents terrain and context paving from burying
the existing below-grade step/fountain floor. Architectural vertex positions
remain unchanged. Added lighting contributes **5,448 triangles**, making Star
Vista **81,680 total**; the **76,232 original oriented triangles** hash identically
to `9e9e32a`. Bounds, maximum height, roof normals and other eight building
geometry records remain unchanged, with zero degenerate triangles.

See [Night and show lighting](star_vista/REVIEW.md#night-and-show-lighting) for
three visual rounds, per-photo observations, exact reproduction, licences and
limits. Sources include [LPA](https://www.lighting.co.jp/en/projects/the-star-vista-and-the-star/),
[LEDinside](https://www.ledinside.com/lighting/2013/10/surreal_architecture_falling_on_the_ground_the_star_performing_arts_centre_star_vista),
its [gallery](https://ledinside.com/gallery/view/24), Commons originals and
attendee accounts. The show cue is explicitly inferred. The preserved v3 shell,
retail and stair layout still differ from the real venue; procedural glass,
retail shading and jet ribbons do not supply physical transmission or water.

`tools/sv_night_render.mjs` uses the real r128 appshot/browser-lock flow. The four
comparison rows use eye-height SW, front, E/NE and close-court cameras; generic
context/traffic is hidden only for these comparisons, while other landmarks
remain. Heroes and animation restore full context. Outputs and validation JSON
are under `/workspace/eo_codex_out/` and are not committed.


## Batch 1: existing module refinement and Bugbot fixes

Baseline: `a69f9f2`. No new buildings. Fusionopolis One receives recessed sky
gardens, separate glazing rhythms and unequal swept crowns; Metropolis receives
unequal floor-band offsets, measured 113.4/104 m envelopes and an English-only
label; Biopolis receives seven distinct facade treatments and curved enclosed
bridges. Low entrance glazing, sheltered canopies and planter beds attach to
these three modules' street edges. Shared cached standard materials improve
all default Buona Vista batches with roughness/metalness differences, subtle
face tone, glass spandrels and base darkening. Star Vista retains its specialized
night shader. No photographs, logos, advertising or new post-processing are used.

### Matched camera evidence and triangle budget

All nine modules have six before/after full-app images at the supplied
N/E/S/W/top/street cameras: **54 pairs**, with original context retained.
The 12 manually annotated, observable views below supply the silhouette metric:
two each for the three focus modules and one top/partial control for the others.
Thus these scores are limited visible-envelope checks, not complete six-view
IoUs or measurements of facade fidelity. Street furnishings below 3 m,
vegetation, and Star Vista lighting/context are excluded from architecture masks.
The same fixed masks, validity windows and camera transforms are used for both
versions. Per-view values and annotation hashes are in the external `iou.json`.

| Module | Scored views | IoU before → after | Triangles before → after |
| --- | ---: | ---: | ---: |
| mediacorp | 1 | 0.599365 → 0.599365 | 13,833 → 13,833 |
| fusionopolis_one | 2 | 0.897970 → 0.898284 | 47,039 → 50,985 |
| buona_vista_mrt | 1 | 0.690773 → 0.690773 | 5,122 → 5,122 |
| solaris | 1 | 0.788923 → 0.788923 | 38,403 → 38,403 |
| rochester | 1 | 0.688578 → 0.688578 | 29,835 → 29,835 |
| star_vista | 1 | 0.788432 → 0.788783 | 81,680 → 81,416 |
| metropolis | 2 | 0.778045 → 0.782347 | 22,688 → 37,051 |
| biopolis | 2 | 0.764847 → 0.765756 | 68,257 → 72,871 |
| galaxis | 1 | 0.579285 → 0.579285 | 12,676 → 12,676 |

Model totals: **319,533 → 342,192**. EW rail detail remains **29,304**;
total added geometry is **348,837 → 371,496**, below the 400,000 budget.
Finite-coordinate and height checks pass. Mediacorp, MRT, Solaris, Rochester and
Galaxis retain identical oriented triangle-coordinate hashes. Star Vista deletes
only 264 erroneous arc-closing triangles; remaining v3 architecture matches the
original after that explicitly permitted deletion. Lighting remains 5,448 triangles.

### Iteration and annotation audit

1. The first matched-camera round exposed silhouette loss from shrinking entire
   Fusionopolis tower bodies. The outer bodies were restored while retaining the
   deeper sky-garden recesses. Protruding Biopolis shade ends were shortened.
2. The next round restored full-width bridge floors/roofs and improved entrance
   placement. Those low street details are assessed visually rather than in the
   architecture mask. Broad facade and garden improvements remain modest at
   district distance.
3. A photo-only annotation audit found that the initial Biopolis outline included
   unmodelled later-phase buildings and that the Star Vista mask filled exposed
   courtyard ground. Revision 2 corrects those two errors, and **both baseline
   and final are rescored with revision 2**. The initial annotations remain in
   `tools/bv_refine_annotations_v1.json`; final ones are in
   `tools/bv_refine_annotations.json`. This correction is not a geometry gain.
   The model-mask vegetation filter was also corrected to retain the mint MRT
   canopy and remove tree trunks, then regenerated for both versions.

The final acceptance masks yield no decrease in any of the 12 scored views.
Gains are small relative to roughly 4–8 annotation-pixel uncertainty at 800 px;
these numbers support non-regression, not a claim of statistically meaningful
replica improvement. For transparency, the initial, erroneous masks gave mean
Biopolis 0.56997 → 0.56894 and Star Vista 0.78513 → 0.78470. Those are retained
as diagnostic history and are not the acceptance masks. Annotated reference
boundaries are never generated from the model.

### Bugbot fixes and verification

- **Underground MRT mask:** way 823046125 is omitted from replacement masks;
  the modeled surface station parts still suppress overlapping generic boxes.
  The actual restored decoded records, local OSM associations and conservative
  triangle/prism collision results are in `after/bugbot_osm_join.json`.
  Three shipped records reappear: 374/689 (9.8 m, way 827002002), 374/713
  (9.6 m, way 827002001), and 375/1537 (9.7 m, matching coincident footprints
  in local snapshots 736566589 / 852002643; historical ID ambiguous). All are
  unnamed `building=yes`. All three have zero conservative station overlap
  candidates (5 cm vertical tolerance); OSM vertex matching errors are 0.33–0.53 m.
- **Names:** Metropolis is English-only; Fusionopolis One retains 启汇城一期.
  The source contract checks both registered labels.
- **Open amphitheatre arc:** `facade` and `rim` skip the closing chord when
  `closed=false`. An open-path segment check and oriented-triangle comparison
  verify the change.
- **Safe GLSL powers:** every Star Vista `pow` base is explicitly nonnegative
  through `max` or `abs`, including the Fresnel rounding case. The full app
  compiles the shaders successfully under r128 software WebGL. Physical-GPU
  execution was not available; the undefined negative-base expression is removed.
- **Thin-strip shadows:** all strip materials, including mode 10, carry a tag;
  the frame hook disables casting after `lmMerge` resets new meshes. Both a test
  executing the real merge routine and the final placed meshes verify this.
- **Court material isolation:** `courtCut` owns a clone, defines and cache key,
  preserves the prior compiler callback, and never modifies cached `lmMat`.
  A shared-cache test builds Rochester before Star Vista and compares its
  callback/defines/user data afterwards. Runtime checks find no neighbouring
  landmark with a court-cut material. Low Rochester/Metropolis/MRT captures
  supply the visual check against local-coordinate holes.

`node tools/bv_bugbot_check.cjs`, `node tools/bv_refine_geometry.cjs`,
`node tools/bv_geometry.cjs`, `node tools/sv3_check.cjs` and
`node tools/sv_night_check.cjs` record the independent contracts. The normal
`bv_build.sh --test` flow regenerates and syntax-checks `site/index.html`.
The final appshot/browser-lock run covers all 54 cameras, nine night views and
three low neighbour views: **zero page errors, zero console errors and all 63
shader programs runnable**. See `after/verification.json` for the full results. Only accepted, completed runs count; interrupted harness attempts
are retained in external logs and do not count as successful verification.

### References, outputs and honest limits

Per-module `REVIEW.md` files explain changes, source licences and limitations.
Local reference cameras and metadata are in `/workspace/bv_refs/<slug>/`.
Real photographs are listed in `/workspace/bv_photo_refs/existing/SOURCES.md`:
Biopolis (yeowatzup CC BY 2.0, Henry Leong CC BY-SA 2.0), MRT (Fanz226 and
Wzhkevin CC BY-SA 4.0), and Metropolis (Erwin Soo CC BY 2.0). Their Commons
file links are in the corresponding module reviews. Photos are consulted only;
no tiles or reference meshes are loaded or extracted.

The local outputs are `/workspace/eo_codex_out/bv_refine_<slug>.jpg` for all nine
modules, each containing reference | baseline | final at six cameras, plus
`/workspace/eo_codex_out/bv_batch1/` with masks, scores, audits and night/neighbour
captures. `tools/bv_refine_render.mjs`, `bv_refine_score.py` and
`bv_refine_sheet.py` reproduce the final flow. No photos or renders are committed.

The models still do not reach photographic replica fidelity. Fusionopolis crown
curves/trusses and some slots are simplified; Metropolis offsets are approximate;
Biopolis block elevations, heights and bridge bends remain interpretations.
Existing district grading, generic context and sparse landscaping still limit
street resemblance. The five control modules gain shading, with their previous
street geometry retained. No additional malls or buildings are introduced in
this batch. PR #5's body is deliberately left unchanged for the owner's later
batch summary.
