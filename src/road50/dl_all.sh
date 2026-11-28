#!/bin/bash
# road50: download -> extract the tunnel ways -> delete the extract, one region at a time (openstreetmap.fr)
cd "$(dirname "$0")"
SC=/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad; DL=$SC/road50/dl; H=$SC/lm33/kit/heavy.sh
run(){ # region url out.json bbox
  bash dl.sh $1 $2 || return 1
  f=$DL/$1/$(basename $2)
  bash $H python3 osm_tunnels.py $f osm/$3 $4 $2 && rm -f $f && echo "$1 done, extract deleted"
}
# done: run singapore https://download.openstreetmap.fr/extracts/asia/singapore.osm.pbf tunnels_singapore.json 103.59,1.06,104.10,1.57
# done: run kanto https://download.openstreetmap.fr/extracts/asia/japan/kanto.osm.pbf tunnels_kanto.json 139.43,35.40,140.07,35.92
# done: run us-northeast https://download.openstreetmap.fr/extracts/north-america/us-northeast.osm.pbf tunnels_us-northeast.json -74.32,40.44,-73.64,40.96
run california https://download.openstreetmap.fr/extracts/north-america/us-west/california.osm.pbf tunnels_california.json -122.61,37.29,-121.77,37.96
