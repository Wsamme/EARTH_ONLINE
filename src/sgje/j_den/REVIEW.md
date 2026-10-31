# J'Den review

## Design and sources

This is an **approximate future-design model**, not a model of the old JCube building in the reference tiles. It follows the published tower impression, Garden Oasis plan and official brochure: two staggered parallel residential wings joined around a central core, bronze vertical dividers, blue-grey glazing, deep shadowed balcony bays, pale projecting slab fronts and metre-wide bronze dividers; the open planted sky terrace at **level 24**; two retail levels with a scalloped bronze veil and dark clerestory; a planted level-three deck, long pool and clubhouse with softened corners and a thin curved eave; a short level-two sheltered J'Walk connection. The podium uses the full real OSM way **158227102** in `footprints.json`. No additional label/sub-key is registered.

- [CapitaLand official project](https://www.capitaland.com/en/development/our-portfolio/residential/j-den.html): 38 residential levels, including a sky terrace, above two commercial levels; Surbana Jurong architect.
- [CapitaLand official launch release, 26 October 2023, annex p5](https://www.capitaland.com/content/dam/capitaland-newsroom/International/2023/october/jden-launch/20231026_J%27den%20launch%20news%20release.pdf): **150 metres above mean sea level**. This is not 150 m above local grade.
- [CapitaLand official brochure](https://www.capitaland.com/content/dam/sites/jden/assets/pdf/E-%20Brochure%20%28EN%29.pdf): level-24 sky terrace, level-three garden and pool plan.
- [Requested gallery](https://jden-condo.sg/gallery), `design_tower.jpg` and `design_night.jpg`, and [garden plan](https://jden-condo.sg/site-plan), `design_site.jpg`: artist impressions (authorised marketing-agent site, not the developer). Downloaded and visually inspected; reference files remain outside the repository in `/workspace/je_photo_refs/j_den/` and are listed in its SOURCES.md.

## Height and design check

The mesh crown is **139 m above grade**, using the official 150 m AMSL maximum minus an **estimated 11 m local ground level**. The 11 m is an explicitly provisional conversion, not an official surveyed ground datum. The two retail levels reach 10.55 m; the residential storey rhythm is 3.3 m starting at 11.2 m; the sky terrace is at 80.5 m; the roof reaches 139 m. The shared metadata currently has a provisional 130 m height. Lead should update the display height / source to the modeled value or a survey-based AMSL conversion when available; this worker does not edit shared footprints.

Design-matched check against `design_tower.jpg`: the tower has the two slab wings and a tall, narrow silhouette, dark glazed ends, contrasting bronze stacks, an open green notch above its midpoint, a two-storey landscaped podium with a varying-height bronze screen and a covered retail-level bridge. The level-24 notch is approximately 58% of mesh height, consistent with the published elevation's location. The plan and balcony layout are simplified; exact dimensions are not asserted.

**Tile IoU is not applicable** to this future-design model because the reference tiles predate J'Den. Raw per-view numbers, if available, are recorded by the parent comparison run solely as historical-state diagnostics and must not be used to shrink the tower toward JCube.

## Night lighting

The inspected night reference is the **clubhouse artist impression**, `design_night.jpg`, from the requested gallery: warm interior lighting, quiet warm apartment windows and a dark blue-grey exterior. The model uses a local PBR wrapper around `lmMat`, retaining its night/time/fog uniforms. Apartment glazing has a deterministic sparse warm occupancy pattern (approximately 17% of cells), reduced brightness and a 3.3 m floor rhythm; retail glazing uses a denser warm pattern. The inherited office-grid glow is disabled. No coloured tower LEDs or floodlit crown are invented. There is no completed-building night photograph, so this is a design-matched treatment rather than an as-built night verification.

## Known gaps

- Approximate new tower floorplate dimensions, slab offsets, setback details and local-ground conversion; no as-built height survey.
- Pool curves, planting, podium screens and clubhouse are reduced geometry. Individual apartment plans are not reproduced.
- The short J'Walk connector is indicative; the full route crosses beyond this worker's site ownership.
- Procedural sparse warm window illumination is an approximation of apartment occupancy. No actual future lighting schedule is claimed.
- Render triangle count and page-error validation are recorded in the parent's final verification report.

## Runtime design review

The initial runtime day/night renders were compared with the published tower and clubhouse impressions. The first pass read too much like an office curtain wall. The second pass adds dark full-height balcony recesses, projecting pale balcony floor fronts, metre-wide bronze divider stacks and darker glass rails. It replaces dense white office-window emission with sparse warm apartment lighting. H-plan dimensions and overall 139 m crown are retained; the perspective differs from the artist impression, so exact image-width agreement is not claimed.


## Final build and design verification

`bash tools/bv_build.sh --test` passes, including the assembled app's JavaScript syntax check. The original-geometry check reports **54,100 triangles**, all finite vertex coordinates. The final day/night design run (`tools/je_malls_west_design.mjs`) reports **zero pageErrors and zero consoleErrors**. It checks J'Den day, night and garden-deck views, JEM night, and Westgate's 0/15/30/45/60-second night-cycle samples. Verification artifacts remain outside the repository under `/workspace/eo_je_out/malls_west/`.

The supplied historical reference metadata measures the former building at **37.3 m** (54.61 m roof minus 17.32 m ground in the ellipsoidal reference frame). This height is not used for J'Den and cannot convert the official future 150 m AMSL limit directly: the vertical datums differ. Raw historical-state IoUs below are not applicable to design fidelity. The current model's label and night-height uniform use 139 m; shared stored height remains the lead-owned provisional 130 m.


## Final matched-camera result

**NOT APPLICABLE to future-design fidelity.** The following are raw historical-state tile diagnostics only; the image cameras often crop the new tower above the old building frame. Round `final`: **n 0.602**, **e 0.606**, **s 0.601**, **w 0.621**, **top 0.634**, **close_ne 0.689**, **close_sw 0.715**, **street 0.530**. Cardinal/top mean **0.613**; all-eight-view mean **0.625**.

The final shared comparison completed with **zero pageErrors**, **zero consoleErrors**, and all 24 day-view landmark masks found. Final runtime triangle count: **54,100**. Raw statistics still carry the shared provisional height; actual model/label heights are documented above.
