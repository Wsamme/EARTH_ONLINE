# IMM

Original procedural model on OSM way 33543880, with north car park way 429038696. The mall base follows the supplied OSM footprint; the cream upper warehouse/office body is recessed behind a lower west retail frontage with a planted deck. Includes grey ribbon windows, panel joints, pink/coral panel frontage, dark framed shop glazing, entrance hoods with pale columns, blank lit sign panels, ventilated car park slabs/piers, parking marks and restrained rooftop plant. All geometry is batched, with lmMat night materials; no images or logos ship.

## Heights and references

- Current modeled maximum 30 m (main roof parapet; plant tops just under 30 m), north car park 26.2 m, lower garden frontage 13.2 m. These are provisional photo-scaled estimates consistent with the supplied 30 m footprint estimate and OSM five-level tag; no measured meta.json was available when authored. The main block's details above the three retail levels are photo estimates.
- Day facades: Chainwit., Commons `IMM Mall Jurong East (2025) - img 01.jpg` (entrance), `img 03.jpg` (charcoal frontage and roof planting), Brhb25 `IMM building in Jurong.jpg` (cream rounded warehouse body and coloured lower frontage).
- Night cross-check: ICSC RECon Asia-Pacific Shopping Centre Tours 2019 brochure, page 5 real dusk photo: https://www.icsc.com/uploads/event_documents/2019APC_ShoppingCenterBrochure_P1.pdf . It shows warm orange/pale backlit frontage panels, warm ground-floor storefronts, dark upper trees and restrained upper block. Locally saved externally at `/workspace/je_photo_refs/imm/icsc_2019_imm_night.png` with PDF and source entry. The model uses warm lmMat emission on the coral frontage, entrance soffits and blank sign boxes.
- The 2025 image shows a newer charcoal treatment in part of the frontage; the model combines this shop-frame treatment with the documented coral-panel corner. No observed full-building night floodlight has been added.

## Verification and gaps

`node --check src/sgje/imm/imm.js` passes. Root worker coordinates the shared build, browser test, triangle count and silhouette rounds. Reference captures are still pending, so upper-body setbacks and height cannot yet be fitted to measured cameras. Front roof-garden extent, warehouse/office window positions, car-park roof layout and small plant are approximate. J-Walk extends beyond the owned footprint and is not invented as extra silhouette geometry. Sign text and logos intentionally omitted.
