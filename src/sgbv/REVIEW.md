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
