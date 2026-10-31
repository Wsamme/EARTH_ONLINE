# Star Vista v3 working review

This follow-up changes only the Star Vista model and shared measurement tools.
The anchor remains OSM way **104352121**, with the supplied measured maximum
**74.5 m** (public project height 75 m). Other eight landmark sources stay intact.
The generated Singapore page must be regenerated after module changes.

## Public references and verified constraints

- [Aedas project page](https://www.aedas.com/en/project/the-star/): Andrew
  Bromberg/Aedas, completion 2012 and 62,000 m² mixed retail/cultural complex.
- [Architect-provided account, photographs, plans and section on ArchDaily](https://www.archdaily.com/510587/the-star-andrew-bromberg-of-aedas):
  75 m height, 33 m grand foyer, open southern elevation, faceted theatre enclosure
  and a 5,000-seat auditorium with two balconies. The section, ground plan,
  north elevation, amphitheatre, foyer and south night photograph were inspected
  as references only. The building has glass fissures and acoustically treated
  cladding ribbons; a uniform aluminium-box description is insufficient.
- [Mall operator](https://thestarvista.sg/about-us): retail **B1–L2**, performing
  arts centre **L3–L11**, parking **B2–B4**, retail opening September 2012.
  [Irrigation contractor](https://www.netatech.com.sg/projects/the-star-vista)
  describes 15 storeys overall. This is not treated as 15 identical exposed
  office floors; level numbering includes below-ground accommodation.
- [Structural engineer Thornton Tomasetti](https://www.thorntontomasetti.com/project/star-vista):
  sloping supports, four-storey-deep wall trusses and an almost 80 m external
  skybridge informed the floating theatre and recessed foyer structure.
- [Lighting Planners Associates](https://www.lighting.co.jp/en/projects/the-star-vista-and-the-star/):
  outline lighting and an illuminated theatre enclosure informed steady warm
  reveal strips, restrained blue theatre lighting and a brighter atrium.

No external geometry was downloaded. Public images and the supplied tile-render
photographs remain outside git; no photograph is a model texture.

## Measurement and geometry

`measurements.json` separates verified dimensions from photo estimates and gives
uncertainties. Selected roof corners were checked with perspective rays from the
original top and elevation cameras. The shell sections are analytic, original
surfaces, not dense photogrammetry or extracted tile geometry.

The main corrections are independently varying roof height/crossfall, west-end
folds and recessed glass slots, a high roof ending before a separate lower east
apron, the deep horizontal reveal, and distinct lower ribbons. Fine panel grids
are clipped at the large diagonal fold lines so normals do not form a staircase.
Roof surfaces face upward; main outer/inner faces have independent winding and
non-indexed flat normals. The roof has different northern/southern tones, dense
ribs, a southern fan, a skylight slit and equipment below the northern screen.

The base has three retail galleries, set-back upper foyer glazing, sloping
columns, escalators, a recessed amphitheatre, a curved retail rim, a low north
entrance canopy, plaza steps and planting. Ground variation and the detailed
interior circulation remain approximations.

## Materials and night

The model creates a small six-face procedural cube environment in memory; it has
no asset request or photo content. r128 Lambert materials retain the app's
`lmShader` night integration while adding cube reflections, subtle panel tones
and flat shading. Brighter diffuse fill compensates for shaded pale cladding.
Blue theatre floodlighting now follows the documented slow cycle, with an
optional artistic show variant described below. There is no animated advertising
or brand text.

## Silhouette protocol

`tools/sv3_manifest.py` reads local photographs and exact camera logs. Its optional
`--preview` reconstructs WGS84 ENU lookAt poses while the external capture batches
are unfinished; those records are labelled PREVIEW. Final acceptance must rerun
without that option after both exact logs arrive.

`tools/sv3_render.mjs` uses the existing full-app appshot/browser-lock flow and
renders an isolated white mask of the actual model from the same camera. It
builds the mask before the app's mesh merge, retaining context labels, and removes
vegetation-coloured triangles consistently. External paving and city buildings
are excluded. The old model is loaded from the pre-follow-up commit for baseline.

`silhouettes.json` contains hand-reviewed PHOTO outlines at 800×500, scaled to the
1600×1000 captures. They are not generated from the proposed model. Ground edges
are uncertain by roughly 5–10 pixels at the annotation scale. Explicit valid
regions/exclusions handle foreground buildings, vegetation and cranes. Completely
hidden views have null IoU with a reason, not a fabricated score. Close-up and
cropped-view IoUs do not certify the complete building envelope.

`tools/sv3_score.py` reports raw intersection/union against the same annotations
for both versions, plus a diagnostic excluding a 10 px boundary band. Aggregate
means use only paired scored views. IoU measures occupancy, not cladding fidelity;
manual outline uncertainty and reference tile distortions limit precision.

## Reproduction

```bash
bash tools/bv_build.sh --test
python3 -m http.server 8047 --directory site
# Another shell. Set PLAYWRIGHT_CORE and CHROME when defaults are unavailable.
python3 tools/sv3_manifest.py
# Baseline source from before the Star Vista-only follow-up:
git show 249c3ae:src/sgbv/star_vista/star_vista.js > /tmp/star_vista_before.js
MASK_ONLY=1 SOURCE=/tmp/star_vista_before.js \
  bash src/lm33/kit/browser.sh node tools/sv3_render.mjs baseline
bash src/lm33/kit/browser.sh node tools/sv3_render.mjs final
ROUND=final python3 tools/sv3_score.py
```

The score tool needs Python Pillow and NumPy. Output defaults to
`/workspace/eo_codex_out`; override `BV_OUT` if needed. The new references and logs
are read-only local inputs, never runtime dependencies. Exact camera output logs
are `/tmp/bv/sv3_out_a.json` and `/tmp/bv/sv3_out_b.json`.

## Final acceptance

All 67 exact cameras render with zero page/console errors. The independent
six-view full-app appshot also passes. The final source hash is recorded beside
the camera poses. A transient Chrome WebGL-context initialization failure was
rejected; the fresh-browser reruns passed.

The model has 76,232 triangles including context, a 74.67 m maximum including
seams, upward roof normals and no degenerate triangles. All nine plus rails total
343,389 triangles. Other eight geometry records remain identical. Raw mean IoU
is 0.800 → 0.845 across 62 paired observable/cropped views; five obstructed views
have no score. 58 paired views improve and four regress. All six original views improve; the small north street crop drops
0.025.

The complete per-view table, source citations, method contributions and remaining
limitations are in [the district review's v3 section](../REVIEW.md#star-vista-v3-follow-up--exact-camera-result).
Southern enclosure curvature, etched/translucent cladding, internal truss shading,
retail terraces and local grading remain approximate. The model is not yet a
photographic replica. All final comparison sheets and both heroes were inspected.


For independent appshot and geometry verification:

```bash
NEAR=1.30687671,103.78846253,1700 bash src/lm33/kit/browser.sh \
  node src/lm20/kit/appshot.js /workspace/eo_codex_out/sv3/appshot_final \
  "$(cat src/sgbv/tools/star_vista_v3_views.json)"
node tools/sv3_check.cjs
node tools/bv_geometry.cjs
python3 tools/sv3_measure.py
```
## Night and show lighting

Normal night is the default whenever the app's `nightF` is on. Use
`site/index.html?view=bv&show=1` for the artistic show variant; `show=0` forces
normal lighting. An absent or unrecognised value also means normal lighting.
There is no automatic concert schedule, exterior beam, logo or media facade.

The [LPA project](https://www.lighting.co.jp/en/projects/the-star-vista-and-the-star/)
provides the outline-light / luminous-theatre intent. The
[LEDinside article](https://www.ledinside.com/lighting/2013/10/surreal_architecture_falling_on_the_ground_the_star_performing_arts_centre_star_vista)
and [Toshio Kaneko/LPA gallery](https://ledinside.com/gallery/view/24) document
the 20-second blue/turquoise cycle, RGB bowl wash, cool-white fibre contours,
5000K outlines against 3000K interiors, corridor lines, reflected soffit light,
colour-changing fountain and step LEDs. These inform the implemented palette,
existing slab-edge emitters, retail glazing, escalator rails, soffits, step risers
and fountain floor emitters. Colour temperatures are visual RGB approximations.

The local originals were viewed before tuning: `ledinside_01` supplies the
blue-hour warm-base / white-line balance; `02` supplies the violet foyer and fibre
curves; `04–06` supply retail and corridor brightness; `07–08` supply fountain
and under-nosing details. The larger Commons front and side photographs constrain
the distant read. The source images remain outside the repository and are never
textures or runtime assets. LEDinside images are credited press references, not
asserted to have a Creative Commons licence.

Commons file-page credits/licences for the reviewed night photographs:

- [Front, 8527566637](https://commons.wikimedia.org/wiki/File:Star_Vista..._in_your_face!_(8527566637).jpg),
  [side, 8522414945](https://commons.wikimedia.org/wiki/File:Star_Vista_(8522414945).jpg),
  [side, 8522630927](https://commons.wikimedia.org/wiki/File:Star_Vista_(8522630927).jpg),
  [dusk, 8523297048](https://commons.wikimedia.org/wiki/File:Star_Vista_at_dusk_(8523297048).jpg),
  [observation deck](https://commons.wikimedia.org/wiki/File:Star_Vista_from_the_observation_deck_(8523389346).jpg):
  Erwin Soo, CC BY 2.0.
- [Distant night, 20130303](https://commons.wikimedia.org/wiki/File:The_Star_Vista,_Singapore,_at_night_-_20130303.jpg):
  Erwin Soo, CC BY 2.0; attribution accompanies the external comparison artefacts.
- [Foyer](https://commons.wikimedia.org/wiki/File:The_Star_Performing_Arts_Center_in_Singapore.jpg):
  Aedas, CC BY-SA 2.0.
- [Fountain](https://commons.wikimedia.org/wiki/File:Fountain_at_The_Star_Vista,_Singapore_-_20121021.jpg):
  Jacklee, CC BY-SA 4.0. File-page author credits are included with external review outputs.

[Shioklist](https://shioklist.sg/venues/the-star-theatre) describes the etched-glass
lantern effect (supplied reference; page unavailable during this verification).
[Wikipedia](https://en.wikipedia.org/wiki/The_Star_Performing_Arts_Centre)
supplies venue/concert context, not evidence for a specific exterior show cue.
[Attendees reporting foyer queues](https://www.reddit.com/r/askSingapore/comments/149no3r/)
and a [first-person concert account](https://thefangirlverdict.com/2023/12/18/i-was-there-junho-the-moment-singapore-2023/)
support brighter occupied foyers. They do not establish a programmed exterior
show. The eight-second blue/turquoise/violet/magenta palette, broad slow sweep,
soft moving leakage pulses and extra foyer brightness are explicitly **inferred**
art direction. No claim is made that a real concert uses these exact cues.

The current pass uses r128 Lambert `onBeforeCompile` shaders and the app's
shared `uNight`. A shared time uniform drives the 20-second normal cycle and
inferred eight-second show palette. Every enclosure facet, including its end
caps, receives the soft blue-white wash, a broad spatial gradient and a modest
view-dependent edge brightening. Roof planes remain unlit. Show pulses and a
slow sweep modulate the whole enclosure. This is an etched-glass approximation,
not true optical transmission.

Separate thin lighting beams trace the slab perimeters, prows and actual large
fold diagonals. Three shared lighting materials cover cool-white outlines,
warm corridor/step strips, and fountain jets/nozzles. The fountain consists of
21 slender, crossed, tapered jet ribbons with soft alpha edges and fading tips.
Its floor spots cycle blue/violet/magenta more quickly in show mode. Retail uses
darker glazing, deterministic bay occupancy, shaded lower reveals, dark frame
gaps and warm ceiling bands; show mode raises foyer warmth and brightness.
The soffits and nearby existing paving receive bounded warm-white emission as
a cheap substitute for reflected light. No additional light sources, textures,
postprocessing passes, advertising or people were added.

The original v3 court is recessed below grade. Both the island terrain and the
v3 context slab had covered the step/fountain floor. A local fragment mask now
opens only their overlapping surfaces inside the original 13 × 14 m court
ellipse; it does not move or remove any vertex. The original court floor,
steps, architectural surfaces and other eight landmarks remain intact. The
terrain mask is spatially restricted to this Star Vista court and its ground
height. This visibility correction applies in production, in day and night.

There are **5,448 added lighting triangles**: Star Vista is now **81,680 total including context**,
with the original **76,232 oriented triangles bit-identical** to `9e9e32a`.
Bounds and the 74.6749 m maximum are unchanged. The lighting batch is tagged so
`tools/sv_night_check.cjs` compares the original surfaces separately and reports
the exact addition. `tools/sv3_check.cjs` still checks the total budget, finite
coordinates, upward roof normals and absence of degenerate triangles.

### Pass 2 visual rounds

| Round | Changes and observed result | Remaining issue at that round |
|---|---|---|
| 1 | Whole-envelope wash, merged white edge strips, varied retail ceiling light, step LEDs and fountain ribbons. The rectangular-panel-only effect was removed. | Lantern too navy; jets/steps too harsh; initial street cameras obstructed and plaza camera under an escalator. |
| 2 | Raised blue-white lantern fill, creamier step light, softened fountain ribbons and warmer floor spill. | Real street views exposed conflicts with neighbouring landmark positions; continuous ground still buried the lower court. |
| 3 | Opened the original court with local fragment masks; lit remaining enclosure end caps; used actual fold diagonals; tapered jet tips and lifted floor/riser fill. Refined street-camera variants within this round and selected the clear views. | V3's angular shell, retail massing and stair/canopy arrangement still differ from the photographs; the result is not a calibrated photographic replica. |

The final comparison has four rows: `ledinside_01` (SW blue-hour), Commons
`8527566637` (front reference), Commons `8522414945` (E/NE low reference), and
`ledinside_07` (close court). `ledinside_02` separately informed the interior
wash and cool-white fibre contours. The cameras are at ground/eye height, with
the plaza camera inside the recessed court. Generic streamed context, synthetic
city meshes and traffic are hidden **only in comparison renders** to avoid
occlusion and nearby headlight/billboard flare. The other eight landmarks are
retained; full context returns for the heroes, animation and day checks. Some
rail/context structures remain visible. Camera bearings, perspective and lens
matching are estimates; see the verification JSON for the exact poses.

Limits: the original v3 shape cannot reproduce the real bowl curvature or glass
segmentation without a separate geometry revision. There is no true light
transport, volumetric haze, water simulation or new bloom. Jet ribbons and floor
spots suggest the fountain lighting; they do not reproduce spray, splash or
reflections. Retail depth is procedural shading, not furnished interiors. The
step layout is the preserved v3 approximation. Show colours, sweep and leakage
remain artistic inference rather than a claim about a real concert cue sheet.

Reproduce with `bash tools/bv_build.sh --test`, `node tools/sv3_check.cjs`,
`node tools/sv_night_check.cjs`, `node tools/bv_geometry.cjs`, then
`bash src/lm33/kit/browser.sh node tools/sv_night_render.mjs` against the local
server on port 8047. Output goes to `/workspace/eo_codex_out/`.

Pass 2 acceptance uses the generated full app, not a standalone material
viewer. The renderer checks the initial URL show override, court terrain mask,
page/console errors and shader diagnostics. The final batch includes five views,
nine time samples and a daylight check in each mode (30 captures). All final
side-by-sides, both heroes and the nine-frame strip are inspected. The GIF uses
eight one-second frames across the show palette. Photos, captures, intermediate
rounds, source hashes and camera/error reports stay in `/workspace/eo_codex_out/`.

Final acceptance: all 30 cycle/day/view captures plus 10 fresh-load view checks
pass with zero page/console errors and runnable shader programs. Initial
`show=1` and absent-parameter normal mode both pass; the court mask works on
the generated page before any source reload. The generated page contains the
exact reviewed module. Other eight geometry records match the v3 baseline.
The final comparison, heroes and animation strip were inspected directly.
