# Indian Heritage Centre — round 2 final

OSM 176326997, actual irregular plan. Four-storey gallery, Campbell Lane
baoli glass facade, stepped circulation, diagonal ground supports, carved stone
portal, shallow steps, opaque side/rear galleries, small vertical/service windows,
dark fins, planted terraces and stepped roof service volumes. No second mural
facade: the southeast elevation is predominantly opaque in the reference views.
Two ground-level rear service openings were added in round 2.

Meta.json maximum **22.4 m**, p90 **21.5 m**, p50 **20.5 m**. Model gallery/terrace
edge 19.1 m, dark lower roof 20.5 m, upper services 21.74 m, small plant maximum
22.4 m. Public authorship: Robert Greg Shand Architects / URBNarc.

Night source: lighting designer ONG&ONG,
https://www.ong-ong.com/projects/civic/indian-heritage-centre-singapore/ . Saved
`night.jpg` and SOURCES.md are in `/workspace/li_photo_refs/indian_heritage_centre/`.
Round 2 replaces plain diagonal crossings with short horizontal baoli junctions,
and adds original geometric colonnade/stepped-tower mural motifs behind the glass.
A vertex-colour-preserving shared lmMat batch provides strong mural backlighting;
glass tint fades at night, while roof and opaque sides stay quiet.

Day source:
https://commons.wikimedia.org/wiki/File:Indian_Heritage_Centre,_Singapore_-_20150423-01.jpg .
Known gaps: the mural is an original geometric interpretation, not the actual
photographic artwork. Fine glass folds, portal carving, planting and roof plant
are simplified. The 3 m buffer and neighbouring shophouse geometry affect n/e/w
scores; the measured gallery was not enlarged to fill them.

## Final validation

**11,790 triangles**, 5 shared material batches.

| n | e | s | w | top | close_ne | close_sw | street |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0.647 | 0.689 | 0.722 | 0.688 | 0.860 | 0.760 | 0.799 | 0.854 |

Mean n/e/s/w/top **0.721**; all-view mean
**0.752**. Final matched-camera run: **r2final**.

`bash tools/bv_build.sh --test` and the offline finite-geometry check pass.
Matched-camera and independent detail checks have **zero page errors and zero
console errors**, with no retired landmarks still placed. Results, overlays,
comparison sheets, geometry and verification JSON stay under
`/workspace/eo_li_out/heritage/`, outside git. References/photos are never runtime
assets. No logos, brand text, photographic textures or external meshes are used.

Lead branch was merged without rebasing; its Deepavali `noHull` fix remains.
No shared source/data files were edited by this round-2 worker work.

## Round 3 — Street View evidence audit

Inspected the local contact sheet first, then its manifest. The 2024-03
exterior panos point predominantly at the opposite shophouse row; 2019-09 and
2018-02 entries include shops/interiors. None provides an unobstructed view of
the IHC baoli glass facade. These images cannot justify a new facade colour,
storey height or screen pattern. Retained the measured 22.4 m maximum, 19.1 m
gallery edge and existing glass/stepped screen geometry. The previously saved
ONG&ONG night photograph remains the lighting reference; no new Street View
images were requested, copied into the repository or exposed at runtime.

The round-3 matched-camera sheets and skyline scores are recorded with the
final validation below. Their whole-scene skyline agreement includes opposite
shops and should not be read as a facade-specific IHC accuracy score. A correctly
aimed exterior reference is still needed from the lead; no shared change made.

Round-3 night cross-check: re-inspected the saved external night photograph
listed above; reference remains outside the repository and no photographic
texture is used.

## Round 3 final validation

Model **11,790 triangles**, 5 shared batches; maximum 22.40 m above anchor datum.

| n | e | s | w | top | close_ne | close_sw | street |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0.647 | 0.689 | 0.722 | 0.688 | 0.860 | 0.760 | 0.799 | 0.854 |

Tile n/e/s/w/top mean **0.721 → 0.721**; final all-view mean **0.752**.
Nominal skyline mean **0.693 → 0.693**.

Build syntax and finite-geometry checks pass. Six-slug tile and Street View round **s1** both report **zero page errors and zero console errors**. Sheets and verification remain outside git under `/workspace/eo_li_out/heritage/`.

**Shared skyline metric limitation:** the all-scene mask retains a blue/purple sky gradient, which the scorer's magenta threshold counts as solid. For example, an Angullia clear-sky pixel is RGB (134,162,221), and only 0.06% of that frame is detected as void. These nominal skyline scores cannot establish facade or precise skyline accuracy. The tile black/white landmark masks are unaffected. Diagnostic evidence is in `round3_skyline_mask_audit.json` outside git. The lead needs to apply background/sky overrides after frame hooks and explicitly suppress sky/weather in the mask pass. Shared tools were not edited.
