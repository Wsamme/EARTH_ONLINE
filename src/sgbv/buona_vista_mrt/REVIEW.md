# Buona Vista Mrt — Batch 1 review

## Surface-only replacement masking

Way 823046125 is the underground Circle Line box and is excluded from generic-building suppression. Surface EW station/canopy parts still mask. The station architecture and added rail geometry are unchanged. Shared surface shading adds subtle face tone, spandrel rhythm and base darkening.

The shared materials are cached per landmark build and use one small procedural cube environment, with no external image textures. Existing mullion geometry remains. The three focus modules receive street work; control modules retain their established entrances and geometry.

## References and validation

Six supplied local-reference cameras (N/E/S/W/top/street) are captured before and after through the real r128 appshot/browser-lock flow. `meta.json` supplies the camera; the existing street fallback is `/tmp/bv/cams.jsonl`. No Google tiles are loaded and no reference meshes are extracted. Images remain outside git. The corresponding sheet is `/workspace/eo_codex_out/bv_refine_buona_vista_mrt.jpg`.

The exact score, triangle totals, annotation corrections and full-app checks are recorded in [the batch review](../REVIEW.md#batch-1-existing-module-refinement-and-bugbot-fixes). Reproduce with `bash tools/bv_build.sh --test`, `bash src/lm33/kit/browser.sh node tools/bv_refine_render.mjs after`, `python3 tools/bv_refine_score.py`, and `python3 tools/bv_refine_sheet.py`. The baseline is pinned to `a69f9f2`; original beauty captures must be made against that generated baseline page before rebuilding.

## Remaining gaps

Station access stairs and structural joints remain simplified; OSM generic buildings have approximate heights.

Real photographs are listed in the local `/workspace/bv_photo_refs/existing/SOURCES.md`. [Fanz226 May 2024 (CC BY-SA 4.0)](https://commons.wikimedia.org/wiki/File:Buona_Vista_MRT_Station_202405.jpg), [July 2024 (CC BY-SA 4.0)](https://commons.wikimedia.org/wiki/File:Buona_Vista_MRT_Station_202407.jpg), and [Wzhkevin (CC BY-SA 4.0)](https://commons.wikimedia.org/wiki/File:Buona_Vista_MRT_Station_from_Commonwealth_Avenue_West.jpg) distinguish the above-ground EW canopy from the underground Circle Line box.

The shipped generic dataset restores three records: tile 374/index 689 (9.8 m,
OSM way 827002002), tile 374/index 713 (9.6 m, way 827002001), and tile 375/index
1537 (9.7 m). The last footprint matches both ways 736566589 and 852002643 in
the two local OSM snapshots, so the exact historical ID is ambiguous. All are
unnamed `building=yes`; no unsupported building names are assigned. Maximum
vertex matching errors are 0.33–0.53 m. A conservative footprint/prism-versus-
station-triangle test finds zero overlap candidates for all three records
(5 cm vertical tolerance, quantized generic geometry).
