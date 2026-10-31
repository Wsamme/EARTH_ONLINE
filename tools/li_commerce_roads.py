"""Check light-up supports against available independent OSM context extracts.
These external extracts are review-only and are never included in the app.
"""
import json, math, xml.etree.ElementTree as ET
from pathlib import Path
D=json.loads(Path('src/sgli/footprints.json').read_text())['deepavali_lightup']
P=sorted({tuple(p) for s in D['streets'] if s['name']=='Serangoon Road' for p in s['p'] if -600<=p[1]<=297},key=lambda p:-p[1])
poles=[];carry=32*.55;arch=0
for p,q in zip(P,P[1:]):
 dx,dz=q[0]-p[0],q[1]-p[1];length=math.hypot(dx,dz)
 while carry<length:
  x,z=p[0]+dx*carry/length,p[1]+dz*carry/length
  for side in [-1,1]:
   width={4:5.5,5:5,6:4.5,7:4.5,8:4.5,20:5,21:4,32:5,33:5.5}.get(arch,6)
   if arch==3:continue
   poles.append((x-dz/length*side*width,z+dx/length*side*width))
  arch+=1
  carry+=32
 carry-=length

def inside(P,x,z):
 result=False
 for p,q in zip(P,P[1:]+P[:1]):
  if (p[1]>z)!=(q[1]>z) and x<(q[0]-p[0])*(z-p[1])/(q[1]-p[1])+p[0]:result=not result
 return result
buildings={}
for src in [Path('/workspace/li_data/map.osm')]+[Path('/workspace/li_photo_refs')/slug/'osm_context.xml' for slug in ['little_india_arcade','mustafa_centre']]:
 if not src.exists():continue
 root=ET.parse(src).getroot();nodes={n.attrib['id']:((float(n.attrib['lon'])-D['lon'])*111320*math.cos(D['lat']*math.pi/180),(D['lat']-float(n.attrib['lat']))*111320) for n in root.findall('node')}
 for w in root.findall('way'):
  tags={t.attrib['k']:t.attrib['v'] for t in w.findall('tag')}
  if 'building'in tags or 'building:part'in tags:buildings[w.attrib['id']]=[nodes[n.attrib['ref']] for n in w.findall('nd')]
collisions=[{'pole':i,'osm':bid} for i,(x,z) in enumerate(poles) for bid,poly in buildings.items() if inside(poly,x,z)]
result={'poles':len(poles),'context_buildings_checked':len(buildings),'collisions':collisions,'limit':'All available buildings in the local district OSM extract plus two detailed context extracts; OSM coverage is not a survey.'}
out=Path('/workspace/eo_li_out/commerce');out.mkdir(exist_ok=True,parents=True);(out/'deepavali_context_clearance.json').write_text(json.dumps(result,indent=2));print(json.dumps(result))
if collisions:raise SystemExit(1)
