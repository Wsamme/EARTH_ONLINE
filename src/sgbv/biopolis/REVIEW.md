# Biopolis — Batch 1 review

## Seven differentiated blocks and curved bridges

Chromos, Matrix, Genome, Proteos, Helios, Centros and Nanos retain their OSM plans and have distinct glass/opaque palettes, bay widths, screen rhythms and sun-shading. Proteos/Centros receive vertical fins; Nanos has a restrained mauve opaque tone. Bridges use gently curved ten-segment glazed routes with roofs and floors. Low canopies, entrances and planting attach to the seven block edges.

The shared materials are cached per landmark build and use one small procedural cube environment, with no external image textures. Existing mullion geometry remains. The three focus modules receive street work; control modules retain their established entrances and geometry.

## References and validation

Six supplied local-reference cameras (N/E/S/W/top/street) are captured before and after through the real r128 appshot/browser-lock flow. `meta.json` supplies the camera; the existing street fallback is `/tmp/bv/cams.jsonl`. No Google tiles are loaded and no reference meshes are extracted. Images remain outside git. The corresponding sheet is `/workspace/eo_codex_out/bv_refine_biopolis.jpg`.

The exact score, triangle totals, annotation corrections and full-app checks are recorded in [the batch review](../REVIEW.md#batch-1-existing-module-refinement-and-bugbot-fixes). Reproduce with `bash tools/bv_build.sh --test`, `bash src/lm33/kit/browser.sh node tools/bv_refine_render.mjs after`, `python3 tools/bv_refine_score.py`, and `python3 tools/bv_refine_sheet.py`. The baseline is pinned to `a69f9f2`; original beauty captures must be made against that generated baseline page before rebuilding.

## Remaining gaps

Facade assignments are photo-based interpretations, not measured elevations. Block heights and bridge bends remain estimates. Later-phase Biopolis buildings are outside this batch.

Real photographs are listed in the local `/workspace/bv_photo_refs/existing/SOURCES.md`. [yeowatzup (CC BY 2.0)](https://commons.wikimedia.org/wiki/File:Biopolis,_One-North,_Singapore_(3333011360).jpg) and [Henry Leong (CC BY-SA 2.0)](https://commons.wikimedia.org/wiki/File:Biopolis-Singapore-20080712.jpg) inform opaque panels, glazing and sun-shading.
