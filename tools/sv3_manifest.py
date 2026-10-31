"""Local-only reference manifest. Never runs the capture scripts or accesses keys."""
import json,math,os
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
(OUT/'manifest.json').write_text(json.dumps(dict(anchor=[lat0,lon0],ground=19.4,views=views),indent=2))
print('Exact-camera views available:',len(views))
