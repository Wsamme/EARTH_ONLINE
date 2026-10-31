# Jurong East review notes

## Target selection
These are the commercial and civic landmarks within about 600 m of the
Jurong East MRT interchange, with the malls around the hub first:
- **Malls:** Westgate, JEM, IMM and J'Den.
- **Interchange:** Jurong East MRT and the bus interchange.
- **Offices and civic buildings:** Vision Exchange, JTC Summit, Perennial
  Business City, CPF Jurong and Jurong Town Hall (a national monument).
- **Hospital:** Ng Teng Fong General Hospital with Jurong Community Hospital.

Exclusions:
- Big Box / Genting Lane industrial sites, the Science Centre and the Lakeside
  area are more than 1 km away.
- HDB blocks are left to the generic OSM building pass.
- Westgate Wonderland and the Jurong Lake Gardens are outside the scope.

## Silhouette IoU method
The reference renders are images only (CesiumJS, headless) and are never
committed or loaded by the app. For each matched camera:
1. The reference silhouette is the tileset clipped to the target's OSM footprints,
   buffered by 3 m, on a magenta background.
2. Photogrammetry merges tree canopies into the mesh, so the reference mask is
   column-filled between its first and last target pixel to close the
   occlusion holes in the facades.
3. The model mask renders only the landmark group.

Treat the numbers as an approximate fit signal, not ground truth. Trees, the
3 m buffer and adjacent podiums inside the buffer all add error.

## Known caveats
- **J'Den** (40-storey residential over a 2-level retail podium, on the
  former JCube site) is still being built, with TOP expected 2027/28. The
  reference tiles show the earlier state of the site, so tile IoU does not
  apply. The model follows the published design and artist's impressions and
  is marked approximate.
- Vision Exchange, Perennial Business City and CPF Jurong have no Commons
  photos. Their facade detail and night lighting come from tile references and
  public descriptions only.
