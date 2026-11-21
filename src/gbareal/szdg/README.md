# Shenzhen and Dongguan buildings for the Greater Bay page (v43, 21 Nov 2026)

These tools replace the Shenzhen (SZ) and Dongguan (DG) buildings in `site/gbadata/gba_bld*.txt`. Hong Kong and context
buildings are copied byte for byte. The rest of the Greater Bay data (roads, terrain, labels) is not touched.

## Sources
- **Footprints**: Overture Maps buildings, release 2026-11-18.0 (`ov_bbox.py` reads only the row groups inside the box
  113.50–114.65 E, 22.43–23.16 N, with HTTP range requests; no account or key). In SZ/DG these are OpenStreetMap buildings (ODbL)
  and the East Asian buildings ML footprints (Shi et al., Zenodo 8174931, CC BY 4.0). Overture `building_part` gives tower parts.
- **Heights**, in this order:
  1. the tall-building lists in `data/` (CTBUH Skyscraper Center, cross-checked with Wikipedia, Wikidata and OSM; every row has its
     sources): SZ 580 completed buildings of 100 m or more (567 with a position), DG 25;
  2. OSM `height` / `building:levels` as carried by Overture;
  3. 3D-GloBFP (Che et al. 2024, ESSD 16:5357, CC BY 4.0) tiles 2264, 2265 and 2269 from figshare: an ML estimate for 2020, about
     ±13 m, far too low for towers;
  4. an estimate by footprint size (when nothing else matched).
- Towers under construction, stalled, on hold or proposed (`data/ctbuh_sz_status.json`, `towers_dg.json` `not_completed`) do not get
  their planned OSM height. A Shenzhen OSM height of 250 m or more with no CTBUH entry within 80 m is dropped too (CTBUH covers every
  250 m+ building in Shenzhen).
- City of each building: the page's own district raster (`gba_base` `pa`; ids above 255 are stored mod 256, resolved by the nearest
  district centre; `pa` 0 = outside Hong Kong, Shenzhen and Dongguan).

## Run
```
W=<work dir>; python3 -I ov_bbox.py <overture part url> 113.50 22.43 114.65 23.16 $W/ov/b377.parquet   # and b378, b379, parts
python3 -I s1_load.py $W            # Overture -> page frame, city per building
python3 -I s2_gfp.py $W             # 3D-GloBFP height per footprint (polygon containing the centroid)
python3 -I s3_build.py $W 100       # heights, tower lists, types and colours; keeps footprints >= 100 m2 (and all with OSM height,
                                    # levels, parts, or 30 m+)
python3 -I s4_encode.py $W $W/out   # new gba_bld0..k.txt and gba_base.txt (part count, statistics) from the files in $W/orig/
```
Paths to the 3D-GloBFP shapefiles are at the top of `s2_gfp.py`.

## Result (this build)
- Footprints: SZ 342,715 and DG 501,317 kept (of 533,261 and 911,777 in Overture); the page had 82,078 and 29,659.
- Height sources, SZ: list 508, OSM height 1,569, OSM levels 13,931, 3D-GloBFP 240,008, size estimate 86,699.
  DG: list 17, OSM height 166, OSM levels 788, 3D-GloBFP 312,063, size estimate 188,283.
- Files: bld0 8.6 MB, bld1 13.0 MB, bld2 3.6 MB (base64 text), was 4.0 + 3.1 MB.
- Headless check (software GL): 0 page errors; small-building parts loaded at 168 s (was 84 s); JS heap after GC up to 1.85 GB
  in Shenzhen / Dongguan views (was up to 1.55 GB); triangles per view about the same.
- The population / jobs estimate in the stats card is computed from floor area as before; with the new heights it reads about
  56 million (was 19 million) and is an estimate, not data.
