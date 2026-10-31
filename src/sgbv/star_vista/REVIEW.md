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
Blue theatre floodlighting and warm reveal/atrium strips are steady; there is no
animated advertising or brand text.

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

Final per-view results and remaining gaps are appended after all capture batches
and the final full-app verification are complete.
