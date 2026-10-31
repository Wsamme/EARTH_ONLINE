# J'Den review

## Design and sources

This is an **approximate future-design model**, not a model of the old JCube building in the reference tiles. It follows the published tower impression, Garden Oasis plan and official brochure: two staggered parallel residential wings joined around a central core, bronze vertical dividers, blue-grey glazing and thin balcony slabs; the open planted sky terrace at **level 24**; two retail levels with a scalloped bronze veil and dark clerestory; a planted level-three deck, long pool and clubhouse with softened corners and a thin curved eave; a short level-two sheltered J'Walk connection. The podium uses the full real OSM way **158227102** in `footprints.json`. No additional label/sub-key is registered.

- [CapitaLand official project](https://www.capitaland.com/en/development/our-portfolio/residential/j-den.html): 38 residential levels, including a sky terrace, above two commercial levels; Surbana Jurong architect.
- [CapitaLand official launch release, 26 October 2023, annex p5](https://www.capitaland.com/content/dam/capitaland-newsroom/International/2023/october/jden-launch/20231026_J%27den%20launch%20news%20release.pdf): **150 metres above mean sea level**. This is not 150 m above local grade.
- [CapitaLand official brochure](https://www.capitaland.com/content/dam/sites/jden/assets/pdf/E-%20Brochure%20%28EN%29.pdf): level-24 sky terrace, level-three garden and pool plan.
- [Requested gallery](https://jden-condo.sg/gallery), `design_tower.jpg` and `design_night.jpg`, and [garden plan](https://jden-condo.sg/site-plan), `design_site.jpg`: artist impressions (authorised marketing-agent site, not the developer). Downloaded and visually inspected; reference files remain outside the repository in `/workspace/je_photo_refs/j_den/` and are listed in its SOURCES.md.

## Height and design check

The mesh crown is **139 m above grade**, using the official 150 m AMSL maximum minus an **estimated 11 m local ground level**. The 11 m is an explicitly provisional conversion, not an official surveyed ground datum. The two retail levels reach 10.55 m; the residential storey rhythm is 3.3 m starting at 11.2 m; the sky terrace is at 80.5 m; the roof reaches 139 m. The shared metadata currently has a provisional 130 m height. Lead should update the display height / source to the modeled value or a survey-based AMSL conversion when available; this worker does not edit shared footprints.

Design-matched check against `design_tower.jpg`: the tower has the two slab wings and a tall, narrow silhouette, dark glazed ends, contrasting bronze stacks, an open green notch above its midpoint, a two-storey landscaped podium with a varying-height bronze screen and a covered retail-level bridge. The level-24 notch is approximately 58% of mesh height, consistent with the published elevation's location. The plan and balcony layout are simplified; exact dimensions are not asserted.

**Tile IoU is not applicable** to this future-design model because the reference tiles predate J'Den. Raw per-view numbers, if available, are recorded by the parent comparison run solely as historical-state diagnostics and must not be used to shrink the tower toward JCube.

## Night lighting

The inspected night reference is the **clubhouse artist impression**, `design_night.jpg`, from the requested gallery: warm interior lighting, quiet warm apartment windows and a dark blue-grey exterior. The model uses the shared `lmMat`-derived glazing shader and warm retail/apartment lighting; no coloured tower LEDs or floodlit crown are invented. There is no completed-building night photograph, so this is a design-matched treatment rather than an as-built night verification.

## Known gaps

- Approximate new tower floorplate dimensions, slab offsets, setback details and local-ground conversion; no as-built height survey.
- Pool curves, planting, podium screens and clubhouse are reduced geometry. Individual apartment plans are not reproduced.
- The short J'Walk connector is indicative; the full route crosses beyond this worker's site ownership.
- Shared shader window illumination is an approximation of apartment occupancy. No actual future lighting schedule is claimed.
- Render triangle count and page-error validation are recorded in the parent's final verification report.
