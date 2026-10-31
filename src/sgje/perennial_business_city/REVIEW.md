# Perennial Business City

OSM way **173029751**, eight-storey connected former Big Box warehouse/retail structure. Uses the supplied OSM anchor and complete polygon at the lower levels; the upper slab omits only the rounded southwest carpark spiral. No unlabelled subkeys.

Built broad white industrial office elevations with teal ribbon windows and physical mullions, 7.5/5 m storey rhythm, olive/gold vertical perforated screen accents, full-height curved carpark spiral, glazed entrances/canopies, blank lit sign panels, rooftop garden, solar rows, open roof frame and screened plant. All original batched geometry, no logos, image textures or external meshes.

Height **49.05 m** from the official owner's `assets/img/sectional-plan.jpg`: L1 0, L2 7.5, L3 15, L4 22.5, L5 27.5, L6 32.5, L7 37.5, L8 45, top 49.05 m. The module updates its own SGJE data height/source before registration; shared footprints.json is untouched. The owner's completed-building photos establish a broad white slab and teal lower volumes, not separate office towers. Approximate upper ribbon heights are 23.5–25.5, 28.5–30.5, 33.5–35.5 and 39–43.7 m; roof frame 48.8–49.05 m. OSM controls all main plan dimensions (~275 m east-west and ~247 m north-south overall extents).

Sources consulted 2026-11-01 (downloaded references stay outside repository in `/workspace/je_photo_refs/perennial_business_city/`):
- https://www.perennialholdings.com/properties/singapore/sg-perennial-business-city-rev.html — completed exterior photos `official_Perennial-5.jpg` and `official_Perennial-6.jpg`, eight-level business park description, rooftop garden, more than 1,800 rooftop solar panels.
- https://perennialbusinesscity.com.sg/ — official sectional plan (`official_sectional-plan.jpg`), completed reverse-side exterior (`site_branding.jpg`), courtyard impression (`site_hero-courtyard3-full.jpg`). Exact original image URLs recorded in external SOURCES.md.

Night lighting: restrained warm occupancy behind dark teal glazing and blank entrance light panels using lmMat. Cross-checked the real rooftop dusk/event photographs in JurongHealth Campus’s official report, **R.O.S.C. Doctors Night 2025**, 16 May 2025: https://www.jhcmoments.com/rosc-doctors-night . External reference `hospital_rooftop_night_0.jpg` shows the landscaped deck, white open roof frame and simple garden lamp posts against a dusk sky; `hospital_rooftop_night_2.jpg` shows temporary event tent/string lighting, which is deliberately not reproduced. These images support a quiet rooftop rather than an illuminated facade spectacle. **A real exterior facade night photograph remains unavailable**, so window occupancy, entrance brightness and facade lighting are conservative approximations. The official courtyard image is an architectural dusk impression, not a real night photo.

Known gaps: no matched-camera image refs or meta.json were available at first implementation. Exact roof garden, solar panel and plant locations, the L8 partial coverage and open frame, facade bay-to-bay glazing/screen positions, and external J-walk bridge geometry remain approximate. The bridge is omitted rather than invented across adjoining properties. Garden and solar areas are schematic inside the original footprint. IoU pending root verification; not asserted without references. Offline actual THREE build passed: **31,892 triangles**, finite vertices, maximum y **49.05 m**. Full browser pageErrors pending the coordinated build.

Final coordinated verification: `bash tools/bv_build.sh --test` passed. The final matched-camera run rendered all eight views plus two night views, with **zero pageErrors and zero consoleErrors**. Model has **30,287 triangles**. External reports: `/workspace/eo_je_out/hub_east/renders/final/verification.json` and `/workspace/eo_je_out/hub_east/je_iou.json`. Reproduce with `JE_VERIFY=1 bash tools/je_hub_east_run.sh tools/je_compare.mjs imm,perennial_business_city,jurong_east_mrt --round final`; the worker wrapper acquires the shared browser lock before starting its server and shuts the server down afterward.

Reference image fit pass: arrived n/e/s/w and close images show the **older Big Box facade** (green/red/orange), preceding the documented completed Perennial redevelopment. Retain modern white/teal facade. The images resolve the rounded southwest projection as an approximately 40 m, eight-level carpark spiral; corrected from the provisional low terrace to full-height open slots, white slab bands and vertical ribs. Main slab and open roof frame massing remain consistent with the official sectional plan. Meta.json still absent at this pass.

Final reference cross-check: `/workspace/je_refs/perennial_business_city/meta.json` reports ground 17.18 m ellipsoidal, roof median **44.3 m**, roof p90 **49.2 m**, and isolated maximum **53.4 m** above ground. The official **49.05 m** roof frame agrees with p90 within 0.15 m; retained official height rather than inflating the envelope to an isolated sample. The top image confirms the broad connected slab, northwest amphitheatre/deck area and southwest carpark roof opening. Modern solar/garden refurbishment differs from the old reference roof, so current panel positions remain approximate. No further footprint/massing expansion is justified. Corrected geometry validation: **30,287 triangles**, all finite vertices, maximum y **49.05 m** (supersedes the initial 31,892-triangle version). Final matched-camera IoU and browser verification to be recorded by root.

Baseline IoU floor investigation: raw `e_clip.png` contains gray vertical panels beneath the physical facade (front corner approximately y544 in the clipped reference versus y498 at the visible facade/plaza junction in `e.jpg`). Similar jagged extensions appear beneath the entrance in the north clipped image. The roof edges and visible facade base largely align with the model. This is consistent with a clipped photogrammetry underside/skirt artifact, with column filling further increasing the reference-only area; it does not justify extending the modeled building underground or enlarging the height. This interpretation is based on the raw image comparison, not access to reference mesh data. Ground and camera calibration remain a possible smaller contributor, but no physically supported module-local base correction was identified. The reference also predates the Perennial facade/roof refurbishment.

Final matched-camera comparison (`/workspace/eo_je_out/hub_east/renders/final/`), all eight views:

| View | IoU |
| --- | ---: |
| n | 0.818 |
| e | 0.837 |
| s | 0.824 |
| w | 0.840 |
| top | 0.905 |
| close_ne | 0.727 |
| close_sw | 0.741 |
| street | 0.601 |
| Mean n/e/s/w/top | **0.845** |
| Mean all eight | **0.787** |

Compared with baseline r1 (n 0.816, e 0.834, s 0.823, w 0.839, top 0.915), all four cardinal scores improve slightly while top decreases; the five-view mean remains 0.845 at three-decimal precision. Retained the photo-correct approximately 40 m carpark spiral and real roof opening despite that unchanged rounded mean. The final west/close southwest overlays confirm the spiral's visible envelope fits the photographed building; top confirms its plan footprint. Residual reference-only bottom strips remain consistent with the clipped underside/skirt evidence described above. Peripheral blue/red plan strips and old Big Box versus modern Perennial roof/facade differences limit closer numerical agreement; no further physical geometry change was justified. This is a qualified convergence, not a claim that the reference is reproduced exactly.

Final verification: **zero pageErrors, zero consoleErrors**, **30,287 triangles**, finite geometry, maximum local height **49.05 m**. No photographic reference or external mesh is included in the module.

Final supplementary geometry/day-night check: both southeast and southwest views rendered by day and night; all vertex positions finite, under the 60k per-model triangle budget, zero page and console errors. Report: `/workspace/eo_je_out/hub_east/hub_east_verification.json`; local contact sheet: `/workspace/eo_je_out/hub_east/hub_east_final_contact.jpg`.
