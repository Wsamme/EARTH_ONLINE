"""Join local OSM ways to actual restored decoded records; no network access."""
from pathlib import Path
import json,xml.etree.ElementTree as ET,math
base=Path('/workspace/eo_codex_out/bv_batch1/after');report=json.load(open(base/'bugbot_runtime.json'))
assert report['restored'], 'No restored generic records found'
assert all(r['stationTriangleOverlapCandidates']==0 for r in report['restored']), 'Restored building intersects station triangle bounds'
nodes={};ways={}
for filename in ['/tmp/bv/map.osm','/tmp/bv/map_ext.osm']:
 root=ET.parse(filename).getroot()
 for n in root.findall('node'):nodes[n.attrib['id']]=(float(n.attrib['lat']),float(n.attrib['lon']))
 for w in root.findall('way'):ways[w.attrib['id']]=([x.attrib['ref']for x in w.findall('nd')],{x.attrib['k']:x.attrib['v']for x in w.findall('tag')})
for r in report['restored']:
 matches=[]
 for wid,(ids,tags)in ways.items():
  if not ('building'in tags or 'building:part'in tags):continue
  xy=[((nodes[n][1]-103.845)*111290.5,-(nodes[n][0]-1.315)*110574)for n in ids if n in nodes]
  if not xy:continue
  # Vertex quantization in the shipped generic dataset is 0.25 m.
  distances=[min(math.dist(p,q)for q in xy)for p in r['ring']]
  error=max(distances)
  if error<2:matches.append({'way':int(wid),'name':tags.get('name','unnamed building'),'maxVertexDistanceM':round(error,3),'tags':tags})
 r['osmMatches']=sorted(matches,key=lambda x:x['maxVertexDistanceM'])
(base/'bugbot_osm_join.json').write_text(json.dumps(report,indent=2))
for r in report['restored']:print(r['tile'],r['index'],r['stationTriangleOverlapCandidates'],r['osmMatches'])
