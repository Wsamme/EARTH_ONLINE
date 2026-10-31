# Vision Exchange

- OSM footprint: way **368005267**, using `D.parts[0].p` for the podium. The independent two-wing tower plate is hand-authored inside that outline from the developer's aerial and street photographs, then checked against the supplied top-view image. The completed slab has a substantial northwest setback from the full podium; local long-axis tower range −45 to +74 m and cross-axis −8.5 to +14.8 m, with the narrow joint at +13.5 to +14.9 m.
- Built: four-storey retail/parking podium, staggered grey parking-screen cassettes, glazed lower floors, open fifth-level planted terrace with columns and pavilion, two long tapered blue-glass office wings separated by a dark vertical joint, twenty office floor divisions with fine mullions and mid-floor transoms, roof maintenance rails and low plant, modest entrance awnings. No logos, text, image textures, extracted meshes or adjacent railway geometry.
- **Height used 122.1 m**: `/workspace/je_refs/vision_exchange/meta.json`, `height.roof_p90_m`. Visually inspected all supplied north/east/south/top and close southwest reference images: they show the building **under construction with two tower cranes**, while official developer photographs show the finished building. The 144.2 m maximum includes a crane and is deliberately excluded from finished-building geometry. Main office enclosure 26.2–119.8 m; roof rails below 122.1 m; podium terrace 22.7 m (metadata roof p50). Intermediate levels are photo-derived proportions.
- Day references: Sim Lian Group developer project gallery, particularly `DJI_0049.png`, `DSC05277.png`, `DSC05744.png`, plus Design Link Architects `Vision-Exchange-Ground.png`. Source list and images kept outside the repository at `/workspace/je_photo_refs/vision_exchange/`.
- Night: shared `lmMat` office-window treatment through the SGBV glass helper, with dark opaque parking screens and lit retail glazing/blank panels. Real evening storefront photo **Claire Chua / SETHLUI.com, Chocobar front, article updated 1 Apr 2025** (https://sethlui.com/chocobar-singapore/; local `chocobar-front.jpg`) was visually inspected: it confirms bright lower-retail interiors, warm neighbouring retail light and localized blue/purple tenant lighting behind glazing. Developer's actual lobby photos `DSC05615.png`, `DSC05954.png`, `DSC05861-1.png` also verify warm interior lighting. This verifies the podium treatment only; **full office-tower exterior night occupancy/intensity remain approximate**. The supplied Dilip Kumar 500px photo was successfully retrieved and inspected, but depicts JEM Tower/JEM rather than Vision Exchange, so it is not used as a Vision night source. ENGIE's electrical-contractor project image was inspected too: its dusk tower is a rendering (with an inset daytime real photo), so it is supplemental design intent only.
- Known gaps: exact tower setbacks, floor heights and terrace planting placement remain estimates. Reference silhouettes include temporary tower cranes and the construction-state podium, so IoU cannot represent a perfect finished-building match. Perforations are represented as flat alternating screen panels; facade reflections are procedural, no literal image reproduction. No bridge is added: developer photos show the adjacent MRT viaduct; a separate pedestrian bridge location has not been verified.
- Verification: JavaScript syntax checked with `node --check`; root worker performs assembled-app build, matched-camera IoU and triangle/error reporting.

## Matched-camera refinement

Initial r5: n .696, e .811, s .764, w .770, top .759; close_ne .888, close_sw .820, street .820. Mean n/e/s/w/top .760; mean all .791. 20,416 triangles and zero page/console errors (root verification). The top and north overlays revealed a real northwest tower setback absent from the first version, plus an overly tapered north face. The corrected approximately 119 × 23.3 m slab follows the visible top roof corners and preserves the full OSM podium. Podium terrace raised from 19.3 to measured p50 22.7 m; terrace opening now 3.5 m. Final comparison below.


## Final verification and stopping reason

Final assembled-app comparison (`renders/final/verification.json`, root-run): **zero page errors and zero console errors; 18,294 triangles**.

| View | IoU |
| --- | ---: |
| n | .758 |
| e | .815 |
| s | .811 |
| w | .805 |
| top | .850 |
| close_ne | .946 |
| close_sw | .935 |
| street | .918 |

Mean n/e/s/w/top: **.808**; mean all eight: **.855**.

The final compare sheet plus north/east/top overlays were visually inspected. The large northwest model-only tower extension from r5 is removed. Remaining reference-only area includes two temporary tower cranes and the column-filled silhouettes beneath their booms, unfinished podium/construction grade and basement edges, and the 3 m footprint buffer. Minor roof/edge/setback differences remain estimates because the references show construction rather than the completed photographed building. Stop here: broadening the finished building to absorb those mask regions would add geometry unsupported by the real completed-building photographs. No cranes, unfinished cladding or fake basement mass were added. The warm podium night treatment has a real storefront photo cross-check; full tower office occupancy and intensity remain unverified, as disclosed above.


## Integration verification

The four owned modules register their measured heights locally, keeping runtime
cards, stats and shader height uniforms consistent while the protected shared
catalogue remains unchanged. Card labels follow the supplied reference metadata.
The lead should regenerate the shared catalogue using Vision's **122.1 m roof
p90**, excluding the temporary **144.2 m crane maximum**. Other maxima are
JTC 150.7 m, CPF 22.5 m and Town Hall 59.3 m.

`bash tools/bv_build.sh --test` passes. The independent command
`node tools/je_gateway_geometry.cjs --browser-report /workspace/eo_je_out/gateway/renders/final/verification.json`
exits 0: four models, 53,737 triangles, finite vertices, zero degenerate triangles,
consistent registration heights, all 40 day/night records, all 32 masks and four
complete IoU score sets. Browser reports have zero page and console errors.

Runner caveat: the render command wrapper reported SIGTERM 143 after the complete
comparison sheets, scores and final verification report had been written. The
independent artifact/geometry audit above exited 0 and verified those outputs;
the launcher exit status is recorded separately from the zero browser errors.

No shared source files, image references or generated pages are committed.
