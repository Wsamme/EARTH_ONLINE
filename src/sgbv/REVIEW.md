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


## Batch 2: two Holland Village malls

Added **One Holland Village** and **Holland Road Shopping Centre**, with separate
modules, original procedural geometry and per-module reviews. No existing module
geometry changes. No reference images, textures, tiles or meshes are loaded at
runtime. PR #5's body is left unchanged for the owner's later batch summary.

### Area selection and deferred targets

| Target | OSM identity | Selection / status |
| --- | --- | --- |
| One Holland Village | way 1226724186 | New major mall and mixed-use village north of Buona Vista; built this batch, including verified northern residential footprints |
| Holland Road Shopping Centre | way 152638469 | Distinct existing mall with current red/cream facade and valid tile references; built this batch |
| Holland Piazza | way 152752624 | Third nearby mall, deferred; supplied photograph (61) belongs here, not OHV |
| Elementum | way 981964001 | Nearby one-north neighbour; selected for a later batch, unchanged here |
| Nucleos | relation 21450449 / outer way 305516250 | Nearby Biopolis neighbour; deferred, unchanged here |
| Fusionopolis Two | ways 448605477 / 448605478 / 448605479 | Nearby research cluster; deferred, unchanged here |
| Rochester Mall | existing rochester module | Already modeled; no duplicate module |
| Anchorpoint / Queensway SC / IKEA Alexandra | outside selected radius | Excluded because farther than 2 km from the focus area |

### Evidence corrections and height provenance

**The supplied photo `(61)` is Holland Piazza**, as the facade lettering shows.
Its colourful undulating exterior is not One Holland Village. OHV's *Interlude*
is suspended under its courtyard canopy: [Vantaly](https://www.vantaly.com/en/project/68622cb530cb4c0020457a86)
and [ERCO / SWITCH](https://www.erco.com/en/inspiration/projects/interlude-by-tomislav-topic-one-holland-village-singapore/)
confirm the installation and 3000 K upward wash. The module uses an original,
simplified colour-field under an approximately sited 540 m²-plan ETFE canopy.
[Plantwerkz's day/night photographs](https://www.plantwerkz.com/one-holland-village)
inform the steps, planted terraces and warm corridor lines.

OHV's supplied Google tiles **predate the development**. Its 38.5 m tile sample
and metadata's obsolete “up to ~10 storeys” description are not used as building
heights. The [developer release](https://www.fareast.com/globalassets/media-library/fareast/aboutus/newsroom/press-release-pdfs/20230111-OHV-Residences-achieves-80-per-cent-sales.pdf)
supports three retail floors, offices L4–L7, Sereen 34 floors, Quincy 28 floors
(including serviced residences L1–L19 and private residences L21–L28), and Leven
three floors plus terrace. The OSM extract confirms Sereen way 1115524529,
address-5 Quincy way 1115524527, and named Leven way 1115524518 north of the mall.
Southern candidate 1226724187 is not a residential tower and is not replaced.
**OHV metre heights are estimated**: 112 m Sereen, 98 m Quincy, 12 m Leven roof,
and 28.5 m commercial roof. No surveyed or official tower metre heights were found.
The model uses documented levels plus explicit floor/slab allowances; it does
not mislabel clear ceiling heights as floor-to-floor dimensions.

HRSC uses measured roof 45.6 minus ground 25.9 ellipsoidal metres = **19.7 m**,
including roof plant. OSM's three levels / 9 m is low. The current red/pink and
cream facade follows [LN9267's 2024 photo (66), CC BY-SA 4.0](https://commons.wikimedia.org/wiki/File:Holland_Village_13-05-2024(66).jpg).
Older green/white photographs are not used for current colours. An [LTA night
photograph](https://www.lta.gov.sg/content/dam/ltagov/who_we_are/statistics_and_publications/books/pdf/Circle_Line_Book.pdf)
(PDF p39, printed p76) supports the lit arcade and bright panel boxes, but is
historical; current-colour night photometry and roof lamps remain inferred.

### Fitting, photo checks and IoU

The first round exposed HRSC's overly flat roof and misplaced roof house.
The second added the green upper deck, red roof canopy, court/parking detail
and moved the roof house to the southwest end. The final model also recesses the ground-floor core so it no longer hides the
shop glazing or closes the arcade. It adds warm arcade
and corridor lines, a photo-interpreted inner retail bar at OHV, and canopy glow.
Some initial approximate OHV cameras landed in walls and were rejected. The
final photo-only pass uses a checked open-court position and recorded street /
terrace poses. The initial south-east and southwest overviews were obstructed by generic HDB
context; the accepted northeast overview retains full context. An HRSC street
camera was also moved clear of a generated tree, without hiding context.

HRSC per-view raw silhouette IoU at the supplied camera poses:

| View | First model | Final model | Scoring scope |
| --- | ---: | ---: | --- |
| e | 0.790450 | 0.764557 | Visible mapped portion crop; attached low wing beyond the named OSM footprint excluded |
| n | 0.803394 | 0.811197 | Northern visible roof/body crop; southern foreground excluded |
| s | 0.736555 | 0.714644 | Whole visible building envelope |
| w | 0.732946 | 0.739002 | Visible rear elevation crop; adjacent low roof wing excluded |
| top | 0.834283 | 0.833107 | Named OSM footprint roof; adjacent low roof above the visible junction excluded |
| street | 0.846108 | 0.855466 | Observable right-hand facade crop; foreground tree excluded |

Six-view mean: **0.790623 → 0.786329**. The small occupancy
decrease follows the corrected open arcade and setback ground glazing. The
closed-core version scored higher but hid the real shopfront recess. Masks
were not changed again to remove this decline. This metric does not establish
facade fidelity or measure the added roof detail.

N/E/W/street scores are explicit observable crops; S is the whole visible
envelope and top is the named-footprint roof. Eight additional orbit views are
visual checks, not scored. Close NE/SW tile images are obstructed and unscored.
The initial E/W/top annotations inadvertently included an adjacent lower roof
wing beyond the named OSM footprint. Revision 2 corrects this association using
explicit crops and the visible roof junction; **both rounds use identical
revision-2 masks**. Initial annotations and the original broader-envelope mean
0.696326 remain as diagnostic history. This correction is not a geometry gain.
Manual masks are never derived from the model; OSM projection identified the
object association only. Boundary uncertainty is approximately 5–10 pixels at
800 px annotation width. Final masks and hashes are committed as small numeric
annotations, while source images and output overlays remain outside git.

**OHV tile IoU: unavailable**, because the imagery predates the mall. The exact
historical cameras remain in the sheet for ground/context only; they can crop
new towers. Photo (40), Plantwerkz's night view and Vantaly's canopy photographs
are compared against approximate courtyard/street/terrace cameras. The separate
`one_holland_village_photo_overlay.jpg` shows manual photo architecture guides
and the rendered boundary over a 50% blend. It is explicitly **unregistered**,
with no warp or quantitative photo IoU. The render is centre-cropped to the same
4:3 frame. Massing, planting density and gallery alignment disagreement remain
visible; this is a diagnostic check, not a claim of a surveyed camera match.

### Geometry, materials and full-app validation

- `one_holland_village`: **29,553 triangles**, zero degenerate triangles.
- `holland_road_sc`: **5,640 triangles**, zero degenerate triangles.

All eleven modules: **377,385 triangles**, plus unchanged EW rail detail
**29,304**, giving **406,689 total Buona Vista added triangles**. This is the
addition's total, not a fixed triangle count for the entire streamed city. The
geometry budget is now 450,000 including rails for eleven modules (previously
nine); actual usage is below it. The full city's per-frame triangle counts
are view-dependent (3,351,845–4,934,952 in the established camera checks)
and recorded in `existing/verification.json`.

The geometry provenance check hashes all original nine modules against
`692594e`: every oriented triangle is identical. Both additions have finite
vertices, no degenerate triangles, correct OSM anchors and expected height bounds.
Materials reuse the existing cached PBR/glass and night-window shaders; canopy
and warm-light batches share materials. ETFE owns a cloned material so opacity
changes do not mutate cached landmark materials. No additional post-processing.

The accepted OHV run and targeted final HRSC rerun together capture **32 reference poses in both day/night**,
plus approximate photo/overview views. The final HRSC run reports **zero page errors, zero console
errors and 67 runnable shader programs**. The independent regression run
covers **54 established cameras plus nine night views**, also with zero
page/console errors and all 63 programs runnable. The final photo-only run
also completes without page/console/shader errors. These checks use real r128
through appshot and the browser lock; physical-GPU execution is not claimed.

`core.js` now counts extra canopy/light batches in module statistics. The appshot
readiness check reads the catalogue size rather than assuming nine modules;
`patch17.py` registers the two new modules. The production page is regenerated
through the normal `bv_build.sh --test` flow and its inline script syntax-checks.
Source hashes in `hrsc_final/verification.json` match the current code/generated
page after the ground-floor core correction. OHV source and its earlier accepted
images remain unchanged. The existing-camera regression is repeated after this
last geometry adjustment.

### Outputs, reproduction and remaining gaps

Local outputs, never committed:

- `/workspace/eo_codex_out/one_holland_village_compare.jpg`
- `/workspace/eo_codex_out/holland_road_sc_compare.jpg`
- `/workspace/eo_codex_out/one_holland_village_photo_overlay.jpg`
- `/workspace/eo_codex_out/one_holland_village_photo_check.json`
- `/workspace/eo_codex_out/one_holland_village_hero_day.jpg` and `_night.jpg`
- `/workspace/eo_codex_out/bv_batch2/`: individual views, masks, IoU JSON,
  geometry provenance and full-app verification.

After the box reboot, all temporary dependencies and logs were restored under
`/workspace/bv_wip_codex/`, with OSM at `/workspace/bv_data/map_ext.osm`. Reference
camera/height metadata is in `/workspace/bv_refs/<slug>/meta.json`; no ephemeral
Google services or API keys are needed. Reproduce using:

```sh
BV_VENDOR=/workspace/bv_wip_codex/vendor TMPDIR=/workspace/bv_wip_codex bash tools/bv_build.sh --test
PLAYWRIGHT_CORE=/workspace/bv_wip_codex/node_modules/playwright-core TMPDIR=/workspace/bv_wip_codex bash src/lm33/kit/browser.sh node tools/bv_batch2_render.mjs final
BV_NEW_ONLY=holland_road_sc PLAYWRIGHT_CORE=/workspace/bv_wip_codex/node_modules/playwright-core TMPDIR=/workspace/bv_wip_codex bash src/lm33/kit/browser.sh node tools/bv_batch2_render.mjs hrsc_final
BV_PHOTOS_ONLY=1 PLAYWRIGHT_CORE=/workspace/bv_wip_codex/node_modules/playwright-core TMPDIR=/workspace/bv_wip_codex bash src/lm33/kit/browser.sh node tools/bv_batch2_render.mjs photo_final
PLAYWRIGHT_CORE=/workspace/bv_wip_codex/node_modules/playwright-core TMPDIR=/workspace/bv_wip_codex bash src/lm33/kit/browser.sh node tools/bv_batch2_regression.mjs
BV_PHOTOS_ONLY=1 BV_PHOTO_FILTER=hrsc_photo66 PLAYWRIGHT_CORE=/workspace/bv_wip_codex/node_modules/playwright-core TMPDIR=/workspace/bv_wip_codex bash src/lm33/kit/browser.sh node tools/bv_batch2_render.mjs photo_refit
python3 tools/bv_batch2_score.py hrsc_final
python3 tools/bv_batch2_sheet.py
node tools/bv_batch2_check.cjs
THREE_JS=/workspace/bv_wip_codex/vendor/package/build/three.min.js node tools/bv_geometry.cjs
```

The local HTTP server serves `site/` on port 8047. The regression tool reuses the
54 preserved camera records from the external Batch-1 baseline report, avoiding
the wiped `/tmp` street-camera file. Supplementary Plantwerkz/Vantaly/LTA photos
retain their source copyright; no open licence or redistribution permission is
claimed. They are local review references only. Module reviews link the Commons
photographs and licences. No images/renders are committed or attached to PR #5.

Neither mall reaches photographic replica fidelity. OHV's internal bar, canopy
siting, tower elevations and balcony patterns are approximate; the photo check
exposes differences in gallery rhythm, landscaping and circulation. HRSC's rear
and roof equipment remain simplified, and its raw silhouette score includes
terrain/model differences. Flat app grading and generic context limit street
matches. Night intensities are visual approximations; the HRSC night source is
historical. See each module review for documented versus inferred details.


## Batch 3: Holland Piazza and Elementum

Added separate modules for **Holland Piazza (way 152752624)** and **Elementum
(way 981964001)**, using the WGS84 OSM extract at
`/workspace/bv_data/map_ext.osm`. Footprint coordinates, anchors, heights and
registration are in the regular catalogue/build flow. The previous eleven
modules retain identical oriented triangle hashes against `9f02be6`.
No reference images or Google meshes are shipped or loaded at runtime.
PR #5's body is deliberately unchanged.

These complete two targets deferred in the Batch-2 selection table. Nucleos
and Fusionopolis Two remain deferred; Rochester Mall is already modeled, and
the out-of-radius Alexandra/Queensway malls remain excluded.

### Holland Piazza: completed facade versus construction-stage tiles

Anchor: **1.310724717, 103.795249567**. The supplied measurement gives
**39.1 − 27.0 = 12.1 m** including the roof tier; OSM's 2 levels / 9 m is low
for the complete envelope. The preserved footprint supplies its bent sides
and rounded end. Glazing bands, recessed ground shops, canopies, stairs and
muted, undulating coloured fascia follow [LN9267's 2024 photo (61), CC BY-SA 4.0](https://commons.wikimedia.org/wiki/File:Holland_Village_13-05-2024(61).jpg).
That photo, supplied in the OHV directory, identifies **Holland Piazza** and is
not an OHV reference. Roof accommodation/plant is smaller and set back, leaving
visible planting. Individual panel placement, floor allocation and roof details
remain photo interpretations. Warm shopfront/window occupancy and thin canopy
lighting are inferred because no current night photograph was supplied.

The tiles show blue construction hoarding and unfinished roof surfaces. They
validate a general envelope and location, not the completed colours or panel
layout. The model intentionally represents the completed photograph. The first
roof block was too dominant and concealed planting; the revised northern block
preserves the footprint/height but gives the garden space to read.

Five-view raw silhouette IoU uses the same unchanged, manually traced masks
for both rounds. Annotation hashes are recorded in the external JSON:

| View | First | Final | Scoring scope |
| --- | ---: | ---: | --- |
| n | 0.745082 | 0.745825 | Visible construction-stage outer envelope |
| e | 0.865831 | 0.861254 | Observable upper crop; foreground HRSC roof excluded |
| s | 0.786100 | 0.786027 | Observable upper crop; adjacent foreground roof excluded |
| w | 0.699190 | 0.709209 | Visible outer envelope, construction hoarding is not a material target |
| top | 0.799067 | 0.799219 | Visible roof footprint |
| street | — | — | Unavailable: fractured tiles / foreground obstruction |

Mean: **0.779054 → 0.780307**. The small increase is below
manual-boundary uncertainty and is not proof of replica fidelity. E and S are
explicit observable crops; N/W/top are visible envelope checks. Street IoU is
unavailable because the tile boundary is obscured by fractures and an adjacent
building. Eight additional orbit poses are visual-only. The 14 poses actually
recorded in metadata are rendered in day/night; unrecorded close-image files
are not claimed as exact-camera checks. No masks were revised after the first
model comparison. Approximately 5–10 annotation-pixel uncertainty applies.

### Elementum: conflicting official data and photographic reconstruction

Anchor: **1.306377973, 103.792762555**. The old tiles predate the building;
their 21.7 m sample is not a current height. **Tile IoU is unavailable.** The
recorded poses show historical context/ground level only and may crop the new
building. The reconstructed lab plates and public realm use the OSM envelope,
architect information and supplied photographs instead.

[SOM](https://www.som.com/projects/biopolis-phase-6-at-one-north/) publishes
**63 m / 12 storeys**. [CTBUH / Skyscraper Center](https://www.skyscrapercenter.com/building/elementum/50970)
lists **92.6 m architectural/tip, 76 m occupied and 13 floors**. A speculative
stack above a 63 m roof would not explain the higher occupied level. No distinct
29.6 m tower/exhaust extension is supported by the inspected photos. The model
therefore uses SOM's 63 m envelope, keeps the discrepancy unresolved, and does
not claim that one source has been disproved. Its 2023/2024 completion metadata
also differs between the sources. No invented 92.6 m silhouette is added.

The model represents the U, retreating western arm and inner lab faces, sloped
eaves and finer intermediate aluminium fins. The intermediate bands are not
extra occupied floors. A genuinely open ground forum supports the L2–L3 podium
to 18 m, with a skylight and a modeled 900 m² planted roof surface. An initial
rectangular garden overlapped too much lab footprint; it is reshaped within the
open U, and the triangulated planted area after subtracting the smaller skylight
is independently checked. Aperture dimensions, individual upper plates, planters
and paths are inferred rather than surveyed. No company logos or model lettering.

The [LUCI / Light Collab project account](https://www.luci.co.jp/led/en/gallery/Elementum/)
specifies 3000 K grazing/washing and credits DCA Architects and ND Photography.
Its lobby photograph was viewed directly; it supports warm lower-level treatment,
not an exterior night photometric claim. The app approximates warm wall/soffit
light with shared emissive materials and lower-level shader emission; lab
windows use cool white. Their exterior intensity and occupancy remain inferred.
No new post-processing or dynamic light arrays are added.

Marc Tan / Studio Periphery photographs supplied through SOM were checked for
the rounded elevation (01), U/setbacks (08/11), garden (16), entrance (19) and
atrium/skylight (20). The CTBUH interior credits include Kevin Siyuan / Shiya
Creative Studio. These remain reference-only, with source copyright retained.
The module review provides the full source notes and height decision.

### Photo checks, context visibility and visual gaps

The separate front, setback, garden and atrium cameras are **approximate**, with
poses recorded in the render report. Initial cameras that landed in a neighbouring
building or lab edge were rejected. Selected streamed/synthetic context and
non-reference landmarks are suppressed only for photo diagnostics; Elementum
and the adjacent Metropolis (or Piazza and HRSC) remain. Some separately generated
rail/road/vehicle context remains. Normal reference-camera renders and the hero
retain full app context. This visibility adjustment is not production code.

`elementum_photo_check.jpg` shows manual photo outline guides, the rendered
boundary and an unregistered 50% blend, with no alignment warp or quantitative
photo IoU. The render is centre-cropped to 16:9. It exposes the remaining mismatch
rather than asserting a surveyed camera. The U and rounded facade read at street
and district scales, but exact facade proportions, inner corners, setback depths,
garden detail and public-space grading remain simplified. Piazza still differs
in fascia curvature, glazing depth and roof equipment. Both night treatments are
visual approximations. Neither model reaches photographic replica fidelity.

### Geometry, performance and full-app verification

- `holland_piazza`: **3,706 triangles**, finite coordinates and zero degenerate triangles.
- `elementum`: **18,169 triangles**, finite coordinates and zero degenerate triangles.

Thirteen modules: **399,260 triangles**, plus unchanged EW rail detail
**29,304**, for **428,564 total Buona Vista addition triangles**,
below the existing 450,000 budget including rails. This is not a constant full-city
frame total; streamed city counts vary with camera. All eleven previous modules
hash identically to `9f02be6`. Elementum's actual green mesh measures
**900.000018 m²** after triangulation. Bounds and
height checks pass at 12.1 m / 63 m.

All **28 recorded new-module poses** are captured in both day/night, plus
approximate photo views. The final Elementum targeted run reports **zero page
errors, zero console errors and 70 runnable shader programs**. The
existing-eleven regression covers **66 established cameras and eleven
night views**, also with zero page/console errors and all 66 programs
runnable. The final photo-only diagnostic pass likewise reports zero errors.
The last inner-setback/garden corrections are covered by the final targeted
Elementum run; the prior modules remain geometry-identical. Software WebGL is
used through the real r128 appshot/browser-lock flow; physical-GPU testing is
not claimed. Source hashes in the latest Elementum report match the current
source and regenerated test page.

Shared materials, a small procedural reflection map and the existing night
uniforms keep the additions inexpensive. Thin lights stop casting shadows after
mesh merging, and the skylight owns a cloned material. No image assets, branding,
Google runtime requests or API keys are introduced. `patch17.py` registers the
two modules; `bv_build.sh --test` regenerates and syntax-checks production HTML.

### Local outputs and reproduction

- `/workspace/eo_codex_out/holland_piazza_compare.jpg`
- `/workspace/eo_codex_out/elementum_compare.jpg`
- `/workspace/eo_codex_out/elementum_photo_check.jpg` and `.json`
- `/workspace/eo_codex_out/elementum_hero_day.jpg` and `_night.jpg`
- `/workspace/eo_codex_out/bv_batch3/`: individual images, IoU, masks, geometry
  provenance and browser reports. No images are committed or attached to PR #5.

Temporary dependencies/logs stay under `/workspace/bv_wip_codex/`. The OSM extract,
reference cameras and photos remain in their supplied `/workspace` directories.
The local HTTP server serves `site/` on port 8047. Reproduce with:

```sh
BV_VENDOR=/workspace/bv_wip_codex/vendor TMPDIR=/workspace/bv_wip_codex bash tools/bv_build.sh --test
PLAYWRIGHT_CORE=/workspace/bv_wip_codex/node_modules/playwright-core TMPDIR=/workspace/bv_wip_codex bash src/lm33/kit/browser.sh node tools/bv_batch3_render.mjs final
BV_PHOTOS_ONLY=1 PLAYWRIGHT_CORE=/workspace/bv_wip_codex/node_modules/playwright-core TMPDIR=/workspace/bv_wip_codex bash src/lm33/kit/browser.sh node tools/bv_batch3_render.mjs photo_final
BV_NEW_ONLY=elementum PLAYWRIGHT_CORE=/workspace/bv_wip_codex/node_modules/playwright-core TMPDIR=/workspace/bv_wip_codex bash src/lm33/kit/browser.sh node tools/bv_batch3_render.mjs elementum_final
PLAYWRIGHT_CORE=/workspace/bv_wip_codex/node_modules/playwright-core TMPDIR=/workspace/bv_wip_codex bash src/lm33/kit/browser.sh node tools/bv_batch3_regression.mjs
python3 tools/bv_batch3_score.py final
python3 tools/bv_batch3_sheet.py
node tools/bv_batch3_check.cjs
THREE_JS=/workspace/bv_wip_codex/vendor/package/build/three.min.js node tools/bv_geometry.cjs
```

The regression reuses preserved core poses from the external Batch-1 report and
adds the Batch-2 mall poses from their metadata. The source photos are never
production textures. SOM/CTBUH/LUCI images retain their source copyright; no open
licence is claimed. The Piazza photo is LN9267 / CC BY-SA 4.0. References are
used only in local comparisons and are not redistributed in the repository.
