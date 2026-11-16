# IMM

Original procedural model on OSM way 33543880, with north car park way 429038696. The mall base follows the supplied OSM footprint; the cream upper warehouse/office body is recessed behind a lower west retail frontage with a planted deck. Includes grey ribbon windows, panel joints, pink/coral panel frontage, dark framed shop glazing, entrance hoods with pale columns, blank lit sign panels, ventilated car park slabs/piers, parking marks and restrained rooftop plant. All geometry is batched, with lmMat night materials; no images or logos ship.

## Heights and references

- Measured maximum **31.6 m** from `/workspace/je_refs/imm/meta.json`, with roof p90 **30.6 m**, median **26.2 m**. Model service deck / car park are 26.2 m; broad central roof cover rises to 30.6 m, and narrow perimeter service heads reach 31.6 m. Lower garden frontage is photo-scaled at 13.2 m. Local module height/source overrides preserve the measured card/stats height without changing shared footprint data. Ground in the reference is 15.53 m ellipsoidal.
- Supplied n/e/s/w/top image-only references confirm the broad shallow roof cover, two-level central cover/skirt, substantial perimeter plant, low west roof garden with white tensile canopies, ventilated north car park and cream strip-window elevations. Images inform original hand-built geometry only.
- Day facades: Chainwit., Commons `IMM Mall Jurong East (2025) - img 01.jpg` (entrance), `img 03.jpg` (charcoal frontage and roof planting), Brhb25 `IMM building in Jurong.jpg` (cream rounded warehouse body and coloured lower frontage).
- Night cross-check: ICSC RECon Asia-Pacific Shopping Centre Tours 2019 brochure, page 5 real dusk photo: https://www.icsc.com/uploads/event_documents/2019APC_ShoppingCenterBrochure_P1.pdf . It shows warm orange/pale backlit frontage panels, warm ground-floor storefronts, dark upper trees and restrained upper block. Locally saved externally at `/workspace/je_photo_refs/imm/icsc_2019_imm_night.png` with PDF and source entry. The model uses warm lmMat emission on the coral frontage, entrance soffits and blank sign boxes.
- The 2025 image shows a newer charcoal treatment in part of the frontage; the model combines this shop-frame treatment with the documented coral-panel corner. No observed full-building night floodlight has been added.

## Verification and gaps

`node --check src/sgje/imm/imm.js` passes. Root worker coordinates the shared build, browser test, triangle count and silhouette rounds. Measured reference captures are available and were visually checked for the first refinement; root coordinates matched-camera silhouette fitting. East and street reference renders report `tiles_settled: false`; close southwest view is obscured by a neighbouring tower. Front roof-garden extent, warehouse/office window positions, car-park parking marks and individual small plant are approximate. Roof deck height was corrected from the initial 29 m assumption to the 26.2 m measured median, with the observed central raised roof separately modeled. Tensile garden covers and perimeter plant groups were added after visual review. J-Walk extends beyond the owned footprint and is not invented as extra silhouette geometry. Sign text and logos intentionally omitted.

Final coordinated verification: `bash tools/bv_build.sh --test` passed. The final matched-camera run rendered all eight views plus two night views, with **zero pageErrors and zero consoleErrors**. Model has **10,263 triangles**. External reports: `/workspace/eo_je_out/hub_east/renders/final/verification.json` and `/workspace/eo_je_out/hub_east/je_iou.json`. Reproduce with `JE_VERIFY=1 bash tools/je_hub_east_run.sh tools/je_compare.mjs imm,perennial_business_city,jurong_east_mrt --round final`; the worker wrapper acquires the shared browser lock before starting its server and shuts the server down afterward.

## Final comparison (r2)

Root's matched-camera app run reports **10,263 triangles**, zero page errors, zero console errors and all requested landmark views found. `node --check` also passes.

| View | IoU |
| --- | ---: |
| n | 0.958 |
| e | 0.948 |
| s | 0.955 |
| w | 0.969 |
| top | 0.959 |
| close_ne | 0.955 |
| close_sw | 0.963 |
| street | 0.854 |
| Mean n/e/s/w/top | **0.958** |
| Mean all eight | **0.945** |

The first round had mean n/e/s/w/top 0.954. The second round improved to 0.958 after correcting the service deck to the measured median and adding the observed raised roof covers, garden canopies and plant. Reviewed n/e/s/w/top/street r2 overlays externally under `/workspace/eo_je_out/hub_east/renders/r2/`. The main mass and rounded end fit closely. Remaining outline residuals concentrate along small rooftop plant / frontage garden edges and the 3 m buffered footprint boundary; top view includes tree crowns and minor real footprint variation. Street is substantially obstructed by neighbouring photogrammetry, and its reference is marked unsettled. More silhouette optimization would encourage unsupported edge expansion or distortion, so retain the photo-correct roof articulation at this round. No broadening was used to chase the reference buffer.

Final supplementary geometry/day-night check: both southeast and southwest views rendered by day and night; all vertex positions finite, under the 60k per-model triangle budget, zero page and console errors. Report: `/workspace/eo_je_out/hub_east/hub_east_verification.json`; local contact sheet: `/workspace/eo_je_out/hub_east/hub_east_final_contact.jpg`.
