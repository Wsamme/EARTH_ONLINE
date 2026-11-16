"""Fixed photo annotations versus isolated model masks, same cameras both rounds."""
from pathlib import Path
import json,hashlib,os
import numpy as np
from PIL import Image,ImageDraw
root=Path(__file__).resolve().parents[1];out=Path('/workspace/eo_codex_out/bv_batch1')
ann=json.load(open(root/'tools/bv_refine_annotations.json'));rows=[]
def poly(points):
 im=Image.new('L',(1600,1000));ImageDraw.Draw(im).polygon([(2*x,2*y)for x,y in points],fill=255);return np.asarray(im)>0
for a in ann['views']:
 ref=np.zeros((1000,1600),bool)
 for p in a['polygons']:ref|=poly(p)
 for p in a.get('holes',[]):ref&=~poly(p)
 valid=poly(a['valid'])if 'valid'in a else np.ones_like(ref)
 for p in a.get('exclude',[]):valid&=~poly(p)
 row={'slug':a['slug'],'view':a['view'],'note':a.get('note','manual visible outline'),'annotation_sha256':hashlib.sha256(json.dumps(a,sort_keys=True).encode()).hexdigest()}
 for stage in ['before','after']:
  directory='before' if stage=='before' else os.environ.get('BV_STAGE','after')
  p=out/directory/(a['slug']+'_'+a['view']+'_mask.png')
  if not p.exists():continue
  m=np.asarray(Image.open(p).convert('L'))>127
  row[stage]=int(np.sum(m&ref&valid))/max(1,int(np.sum((m|ref)&valid)))
  rgb=np.asarray(Image.open('/workspace/bv_refs/'+a['slug']+'/'+a['view']+'.jpg').convert('RGB')).copy()
  rgb[m&ref&valid]=(rgb[m&ref&valid]*.55+np.array([30,220,70])*.45).astype('uint8');rgb[ref&~m&valid]=[255,70,50];rgb[m&~ref&valid]=[40,120,255]
  Image.fromarray(rgb).save(out/directory/(a['slug']+'_'+a['view']+'_iou.jpg'))
 rows.append(row)
means={}
for slug in sorted({r['slug']for r in rows}):
 rs=[r for r in rows if r['slug']==slug];means[slug]={'scoredViews':len(rs)}
 for stage in ['before','after']:
  vals=[r[stage]for r in rs if stage in r];means[slug][stage]=sum(vals)/len(vals)if vals else None
report={'method':ann['method'],'views':rows,'modules':means};(out/'iou.json').write_text(json.dumps(report,indent=2));print(json.dumps(means,indent=2))
