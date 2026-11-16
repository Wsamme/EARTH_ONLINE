# Holland Road Shopping Centre — Batch 2

OSM way **152638469**, anchor 1.310314400, 103.795397554. The 1970s mall is
represented as a four-level street elevation with rooftop carpark/structures.
OSM's three levels / 9 m is low: the supplied valid tile measurement is roof
45.6 minus ground 25.9 ellipsoidal metres = **19.7 m including roof plant**.
The model's highest service structure reaches 19.7 m; occupied retail floors
remain lower. This is not a claim that all four floors span the full 19.7 m.

## Facade and roof

The current red/pink and cream boxed bays follow LN9267's 2024 photograph `(66)`
([Commons, CC BY-SA 4.0](https://commons.wikimedia.org/wiki/File:Holland_Village_13-05-2024(66).jpg)).
It was inspected directly. The older [Terence Ong photograph, CC BY 2.5](https://commons.wikimedia.org/wiki/File:Holland_Road_Shopping_Centre.JPG)
shows a green/white scheme, which is not used for the current cladding.

The real multi-segment OSM outline gives the road-facing curve and narrow rear
edge. The module adds cream piers, dark recessed glazing, projecting red bay
frames, an open ground arcade, blank illuminated panels, a stepped green roof
deck, a red roof canopy, small rooftop court, parking lines, service enclosures,
vents and roof lamps. Roof details and colour placement are interpreted from
the supplied images; exact mechanical equipment is not measured.

The first comparison showed an overly flat roof and a roof house on the wrong
end. Round 2 adds the upper green deck and red canopy, moves the roof house to
the observed southwest end, and adds court/plant detail. The final pass adds
continuous warm arcade soffit lines and explicitly illuminated blank panel
boxes. A close-camera audit then found the ground-floor core hid the recessed
shop glazing; the core is now set farther back and starts the upper mass above
the arcade, so the colonnade reads open. All HRSC views and the existing-module
regression were regenerated after this last correction. No logos, shop names, lettering or advertising are modeled.

## Night reference

[LTA's Circle Line book](https://www.lta.gov.sg/content/dam/ltagov/who_we_are/statistics_and_publications/books/pdf/Circle_Line_Book.pdf),
PDF page 39 (printed pages 76–77), contains a blue-hour photograph of the centre.
It was rendered and viewed locally. It shows a lit ground arcade and bright
panel boxes, but predates the red/cream repaint. It informs lighting placement,
not current facade colour or exact illumination intensity. The model's warm
arcade, blank panel emission and roof lights follow the app's night factor;
current-colour night photometry and roof light positions remain inferred.
The LTA image remains copyright its source and is local review evidence only.

## Silhouette measurement

All 16 supplied reference poses are rendered in day and night through the real
r128 appshot/browser-lock flow. The six core N/E/S/W/top/street views have manual
800×500 reference outlines rasterized to 1600×1000. N/E/W/street use labelled
observable crops; S covers the whole visible envelope and top covers the named
OSM-associated roof. Eight additional orbit views are visual checks; close NE/SW
references are dominated by foreground tile obstructions and are unscored.

An association audit found that the initial E/W/top outlines included an adjacent
lower roof wing continuing the facade beyond the named OSM footprint. Revision 2
uses explicit observable crops and the visible top roof junction. Both initial
and final models are scored with the same revision 2 masks. Initial annotations
remain in `tools/bv_batch2_annotations_v1.json`; the original broader-envelope
mean was 0.696326 and is retained externally. This correction is **not** a model
improvement. Reference masks are hand-drawn from the images, never generated from
the modeled mesh. OSM projection was used only to identify the correct part.

Ground and neighbouring roofs remain approximate in the app; no generic context
is hidden in these comparisons. The model stays on its named OSM footprint;
attached/adjacent generic wings are not silently enlarged into the new module.
The photo `(66)` camera is an approximate street match, not a surveyed pose.
The score is an occupancy check with roughly 5–10 annotation-pixel uncertainty,
not evidence of photographic facade fidelity. Final per-view results, triangle
counts and page/console checks are in [the area review](../REVIEW.md#batch-2-two-holland-village-malls).
