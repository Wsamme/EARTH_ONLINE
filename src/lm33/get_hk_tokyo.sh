#!/bin/bash
# City Brush — map data for Hong Kong and Tokyo (with Mount Fuji). Run on your computer:  bash get_hk_tokyo.sh
# Downloads (about 690 MB in all) into ~/Downloads/citybrush_bayarea/hk and .../tokyo:
#   guangdong-latest.osm.pbf  165 MB  OpenStreetMap, Geofabrik (Guangdong with Hong Kong and Macau: Hong Kong + Shenzhen)
#   kanto-latest.osm.pbf      495 MB  OpenStreetMap, Geofabrik (Kanto region: Tokyo, Kanagawa, Saitama, Chiba)
#   terrain tiles (72 + 280 small PNGs, ~25 MB)  AWS Terrain Tiles (terrarium, zoom 12): Hong Kong; Tokyo to Mount Fuji
# Big files are split into 300 MB parts (the link to Claude moves files up to 400 MB).
set -e
D="${CB_DIR:-$HOME/Downloads/citybrush_bayarea}"
mkdir -p "$D/hk/terrain" "$D/tokyo/terrain"
tiles(){ # dir x0 x1 y0 y1
  for x in $(seq $2 $3); do for y in $(seq $4 $5); do
    f="$1/terrain/12_${x}_${y}.png"; [ -s "$f" ] || curl -fsS --retry 3 -o "$f" "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/12/$x/$y.png"
  done; done; }

echo "== Hong Kong"
cd "$D/hk"
[ -s guangdong-latest.osm.pbf ] || curl -fL --retry 3 -o guangdong-latest.osm.pbf https://download.geofabrik.de/asia/china/guangdong-latest.osm.pbf
tiles "$D/hk" 3342 3350 1783 1790
COPYFILE_DISABLE=1 tar cf terrain.tar terrain

echo "== Tokyo + Mount Fuji"
cd "$D/tokyo"
[ -s kanto-latest.osm.pbf ] || curl -fL --retry 3 -o kanto-latest.osm.pbf https://download.geofabrik.de/asia/japan/kanto-latest.osm.pbf
rm -f kanto.part_*; split -b 300m kanto-latest.osm.pbf kanto.part_
tiles "$D/tokyo" 3623 3642 1608 1621
COPYFILE_DISABLE=1 tar cf terrain.tar terrain

echo "== done"; ls -la "$D/hk" "$D/tokyo"
