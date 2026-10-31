"""Local-only reference manifest. Never runs the capture scripts or accesses keys."""
import json,math,os,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
OUT=Path(os.environ.get('BV_OUT','/workspace/eo_codex_out'))/'sv3';OUT.mkdir(parents=True,exist_ok=True)
meta=json.load(open(ROOT/'uploads/bv_refs/star_vista/meta.json'));lat0=meta['centroid']['lat'];lon0=meta['centroid']['lon']
fallback={}
p=Path('/tmp/bv/cams.jsonl')
if p.exists():
 for line in p.read_text().splitlines():
  c=json.loads(line)
  if '/star_vista/' in c['out']:fallback[Path(c['out']).stem]=c['cam']
views=[]
def add(name,file,c,source):
 if not file.exists():return
 views.append(dict(name=name,file=str(file),camera=c,source=source))
for n in ['n','e','s','w','top','street']:add('original_'+n,ROOT/'uploads/bv_refs/star_vista'/f'{n}.jpg',meta['shots'].get(n,fallback.get(n)),'meta.json / saved camera log')
# Exact output logs are preferred. Request-only previews are deliberately not
# admitted: score/capture only after an exact camera record has been supplied.
for suffix in ['a','b']:
 p=Path('/tmp/bv/sv3_out_'+suffix+'.json')
 if not p.exists():continue
 data=json.load(open(p))
 if isinstance(data,list):data={c['out']:c for c in data}
 for file,record in data.items():
  c=record.get('cam',record.get('camera',record));add(Path(file).stem,Path(file),c,p.name)
if '--preview' in sys.argv:
 # WGS84 ENU lookAt reconstruction for previews while the capture logs are still
 # being written. Final acceptance reruns without this flag using exact records.
 def ecef(lat,lon,h):
  lat,lon=map(math.radians,[lat,lon]);a=6378137;e2=6.69437999014e-3;n=a/math.sqrt(1-e2*math.sin(lat)**2)
  return [(n+h)*math.cos(lat)*math.cos(lon),(n+h)*math.cos(lat)*math.sin(lon),(n*(1-e2)+h)*math.sin(lat)]
 def llh(p):
  x,y,z=p;lon=math.atan2(y,x);r=math.hypot(x,y);lat=math.atan2(z,r*(1-6.69437999014e-3))
  for i in range(8):
   n=6378137/math.sqrt(1-6.69437999014e-3*math.sin(lat)**2);h=r/math.cos(lat)-n;lat=math.atan2(z,r*(1-6.69437999014e-3*n/(n+h)))
  return math.degrees(lat),math.degrees(lon),h
 def axes(lat,lon):
  p,l=map(math.radians,[lat,lon]);return [[-math.sin(l),math.cos(l),0],[-math.sin(p)*math.cos(l),-math.sin(p)*math.sin(l),math.cos(p)],[math.cos(p)*math.cos(l),math.cos(p)*math.sin(l),math.sin(p)]]
 existing={v['name']for v in views}
 for suffix in ['a','b']:
  for r in json.load(open('/tmp/bv/sv3_'+suffix+'.json')):
   file=Path(r['out']);name=file.stem
   if name in existing or not file.exists():continue
   if r.get('set'):c=dict(lat=r['lat'],lon=r['lon'],alt=r['alt'],heading=r['hd'],pitch=r['pt'],hfov=60)
   else:
    h,p=map(math.radians,[r['hd'],r['pt']]);enu=[-math.sin(h)*math.cos(p)*r['r'],-math.cos(h)*math.cos(p)*r['r'],-math.sin(p)*r['r']];base=ecef(r['lat'],r['lon'],r['h']);axes0=axes(r['lat'],r['lon']);cam=[base[k]+sum(enu[j]*axes0[j][k]for j in range(3))for k in range(3)];lat,lon,alt=llh(cam);v=[base[k]-cam[k]for k in range(3)];ax=axes(lat,lon);components=[sum(a*b for a,b in zip(v,u))/r['r']for u in ax];c=dict(lat=lat,lon=lon,alt=alt,heading=math.degrees(math.atan2(components[0],components[1]))%360,pitch=math.degrees(math.asin(components[2])),hfov=60)
   add(name,file,c,'PREVIEW WGS84 ENU reconstruction; replace with exact output log')
(OUT/'manifest.json').write_text(json.dumps(dict(anchor=[lat0,lon0],ground=19.4,views=views),indent=2))
print('Views available'+(' (includes request-derived previews)' if '--preview'in sys.argv else ' (exact logs only)'),len(views))
