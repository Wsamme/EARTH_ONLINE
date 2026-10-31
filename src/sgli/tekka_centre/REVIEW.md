# Tekka Centre

OSM 47198835 only. Two levels of open market galleries, columns, rails, purple fascias with short yellow/orange/green strokes, deep shallow pitched roof, entrance stairs and access ramp, louvred entrance screens and blank illuminated panels. No HDB towers included.

Height revision: `/workspace/li_refs/tekka_centre/meta.json` arrived during review. Its **68.9 m maximum is contaminated by the neighbouring HDB blocks**, clearly visible as clipped tower strips in `n_clip.png`; p50 is **12.1 m** and p90 **13.6 m**. The market uses a broad 11.95–12.08 m cyan/green roof, raised sawtooth monitors up to 13.6 m (13.66 m including ridge trim). Two-storey elevations scale consistently with that roof. Initial OSM `height=10` model is retained only as comparison round r1, not as the final fit. Standing seams, vent banks and monitor glazing are original hand-built geometry informed by reference images.

Shared change needed from lead: SGBV.skip currently retires generic footprints on any overlap. The OSM market outline touches/overlaps the residential HDB ways **178436578 (661 Buffalo), 178436579 (662), 178436580 (663)**. Independent OSM XML confirms vertices overlap in both directions; the first runtime review shows the towers absent. These should remain generic as requested, via a shared skip exception or more specific market masking. This worker has not changed core.js, footprints.json or generic-building code. The contaminated reference mask also means raw IoU is not a clean market-only score; do not add towers to improve it.

Photos inspected outside repository: `/workspace/li_photo_refs/tekka_centre/day.jpg` (Mothership September 2023 reopening, purple paint), `night.jpg` (Trip.com night photograph, older blue paint). Night photograph supports warm corridor spill, lit entrance panels and a dark roof, not a glowing whole market. Current-purple night photograph was not found; lighting uses older architectural evidence.

Pending measured-camera comparison and runtime triangle count.
