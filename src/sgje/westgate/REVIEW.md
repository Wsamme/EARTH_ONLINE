# Westgate / Westgate Tower

Original hand-built geometry on OSM ways **158234014** (mall) and **368005268** (office tower). Registered as `sgje_westgate`; no sub-labels. No external meshes, photographic textures, logos or brand text ship with the model.

## Model and references

The real mall polygon carries the lower retail enclosure, glass ground frontages, broad pale facade panels, vertical green panels, horizontal joints, a long recessed court with gallery edges and pitched glazed atrium wings in an L around the central roof garden. Roof gardens, a screened service block, a small entrance canopy and the L2 connection toward the MRT complete the podium. The Wonderland play equipment is outside this pass, per the shared review scope; the planted terrace is represented.

The independent OSM office plate, translated 2.8 m west and 3.2 m north to align the upper facade with the matched north/east/top photographs, carries blue-grey curtain glazing, physical mullions, 4.3 m horizontal bands, a contrasting vertical seam, roof planting and a finned crown. The owner publishes 4.3 m floor-to-floor and describes a 20-storey office tower over the 7-storey mall; the brief's storey count is approximate. Geometry crown **141.1 m above grade**, from `/workspace/je_refs/westgate/meta.json`: roof159.05 minus ground17.99 ellipsoidal metres, rounded141.1. The maximum comes from the image-reference sampling; p90 roof height135.4m is a lower terrace/crown statistic, not substituted for the measured maximum. Mall main terrace is 28.8 m, atrium ridges 32.6 m, service screen about 34.4 m; these lower levels are photo estimates.

Photos inspected outside the repository:

- RSP architect project, especially `rsp_Westgate-5.png` exterior and `rsp_Westgate-1.png` court: https://rsp.design/project/westgate/
- `commons_View_of_Jurong_East_202406_jpg.jpg` (Fanz226, CC BY-SA4.0) and `commons_Westgate_Singapore_Void_View_2014_jpg.jpg` (Wing1990hk, CC BY3.0). The supplied `commons_Westgate_jpg.jpg` is only a logo and was not used as building evidence. The supplied `commons_Jurong_East_202406_2_jpg.jpg` shows the MRT/HDB area rather than the mall and was not used for facade detail.
- Owner specifications: https://www.westgate-tower.com.sg/

## Night check

Downloaded and visually inspected **`/workspace/je_photo_refs/westgate/capitaland_night.jpg`**, the official CapitaLand night photograph, sourced from https://www.capitaland.com/content/dam/capitaland-media-library/integrateddevelopment-urbandevelopment/Singapore/Singapore/Westgate/_EDK9512-HDR-Edit.jpg and its property page https://www.capitaland.com/en/find-a-property/global-property-listing/retail/westgate.html . It shows blue seam lighting, cool horizontal accents, occupied office floors and warm retail lighting. Those features inform the model. Sources recorded in external `SOURCES.md`.

The default slowly interpolates blue to violet with a period about 60 seconds, with no flashes, using a dedicated batched `lmMat` night surface and the app's clock/night uniforms. Blue/purple dynamic facade is additionally described in the brief and the supplied Reddit post https://www.reddit.com/r/singapore/comments/1mb0ttc/saw_this_while_stopped_at_red_light_nearby/ . The Reddit poster image returned 403; it was **not** visually inspected. This is a restrained default, not a reproduction of the SG60 programme. Signs are blank panels.

## Verification and limitations

Final camera-fit results and triangle count follow after reference delivery. The OSM tower contour is a simplified polygon; the small documented rigid translation fits the upper plate without increasing its area. The outline and does not encode every facade recess. Interior shops, play sculptures, tenant signage and engineering plant are intentionally simplified. Small bridge/roof/court placements and elevations are photo estimates, not surveyed construction dimensions. Shared `footprints.json` / label height remains provisional and is owned by the lead.


## Camera comparison rounds

Reference metadata supplied 2026-11-01; exact supplied cameras and isolated model masks, shared column-filled reference scoring. First pass r1: n0.893/e0.841/s0.912/w0.860/top0.918, five-view mean0.885. Rigid plate alignment and the photo-based roof refinement improved r2 to n0.902/e0.872/s0.915/w0.896/top0.938, mean0.905; close_NE0.941, close_SW0.937, street0.817 (all-view mean0.902). No area inflation was used. Remaining differences include the OSM simplification and +3m reference buffer, terrain/trees, unmodelled small recesses and roofs. A third final check will record the completed roof-service details; the massing is retained because no further change is justified by the source photos.

Both r1 and r2 report zero pageErrors and zero consoleErrors. The dedicated night-cycle check renders at0/15/30/45/60seconds with the same camera; visibly distinct intermediate hues return close to the starting blue at60seconds, consistent with a slow cycle. It also reports zero page/console errors. Live label/night-uniform height is141.1m via the module override; shared stats still report provisional110m until lead regenerates footprints metadata.


## Final build and design verification

`bash tools/bv_build.sh --test` passes, including the assembled app's JavaScript syntax check. The original-geometry check reports **26,168 triangles**, all finite vertex coordinates. The final day/night design run (`tools/je_malls_west_design.mjs`) reports **zero pageErrors and zero consoleErrors**. It checks J'Den day, night and garden-deck views, JEM night, and Westgate's 0/15/30/45/60-second night-cycle samples. Verification artifacts remain outside the repository under `/workspace/eo_je_out/malls_west/`.


## Final matched-camera result

Round `final`: **n 0.903**, **e 0.872**, **s 0.915**, **w 0.896**, **top 0.938**, **close_ne 0.941**, **close_sw 0.937**, **street 0.818**. Cardinal/top mean **0.905**; all-eight-view mean **0.902**.

The cardinal/top mean is unchanged from r2 after the final facade/plant details. Further massing edits are not justified by the photos: residual differences include the buffered reference silhouette, vegetation, small omitted recesses and OSM simplification. The model was not enlarged to chase those differences.

The final shared comparison completed with **zero pageErrors**, **zero consoleErrors**, and all 24 day-view landmark masks found. Final runtime triangle count: **26,168**. Raw statistics still carry the shared provisional height; actual model/label heights are documented above.
