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

Inspected the local contact sheet first, then its manifest. The 2024-03/06
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
