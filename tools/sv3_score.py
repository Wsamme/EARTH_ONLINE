"""Fixed, hand-corrected photo masks versus actual isolated rendered geometry.
Masks remain fixed across all iterations. Unannotated/occluded views are listed
without a fabricated IoU. A 2 px tolerance check quantifies outline sensitivity.
"""
import json,os,hashlib
from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw,ImageFont,ImageFilter
ROOT=Path(__file__).resolve().parents[1];OUT=Path(os.environ.get('BV_OUT','/workspace/eo_codex_out'));P=OUT/'sv3'
manifest=json.load(open(P/'manifest.json'));ann=json.load(open(ROOT/'src/sgbv/star_vista/silhouettes.json'))
round=os.environ.get('ROUND','final');D=P/round;rows=[]
def extrema(a,dilate):
 # Separable boolean min/max, avoiding Pillow's slow large rank filter.
 n=10;h,w=a.shape
 p=np.pad(a,((0,0),(n,n)),constant_values=not dilate);r=np.zeros_like(a)if dilate else np.ones_like(a)
 op=np.logical_or if dilate else np.logical_and
 for i in range(2*n+1):op(r,p[:,i:i+w],out=r)
 p=np.pad(r,((n,n),(0,0)),constant_values=not dilate);r=np.zeros_like(a)if dilate else np.ones_like(a)
 for i in range(2*n+1):op(r,p[i:i+h,:],out=r)
 return r

def polygon(points):
 im=Image.new('L',(1600,1000));ImageDraw.Draw(im).polygon([(x*2,y*2)for x,y in points],fill=255);return np.array(im)>0
for v in manifest['views']:
 n=v['name'];a=ann.get(n);row=dict(view=n,camera_source=v['source'])
 if a and a.get('unscorable'):row.update(before=None,after=None,status=a['unscorable']);rows.append(row);continue
 if not a:row.update(before=None,after=None,status='No reviewed annotation yet');rows.append(row);continue
 ref=polygon(a['polygon']);valid=polygon(a['valid'])if 'valid'in a else np.ones_like(ref)
 for poly in a.get('exclude',[]):valid&=~polygon(poly)
 before=None;after=None
 for r,k in [('baseline','before'),(round,'after')]:
  f=P/r/(n+'_mask.png')
  if not f.exists():continue
  model=np.array(Image.open(f).convert('L'))>127
  inter=np.sum(ref&model&valid);union=np.sum((ref|model)&valid);iou=float(inter/union)if union else 0
  row[k]=float(f'{iou:.5f}')
  eroded=extrema(ref,False);dilated=extrema(ref,True);stable=valid&~(dilated&~eroded);den=np.sum((ref|model)&stable);row[k+'_outside_10px_boundary']=float(f'{np.sum(ref&model&stable)/den:.5f}')if den else None
  if k=='after':
   rgb=np.array(Image.open(v['file']).convert('RGB')).copy();rgb[ref&~model&valid]=[255,80,60];rgb[model&~ref&valid]=[40,130,255];rgb[ref&model&valid]=(rgb[ref&model&valid]*.55+np.array([50,220,80])*.45).astype('uint8');Image.fromarray(rgb).save(D/(n+'_iou.jpg'))
 row.update(status=a.get('confidence','manual'),annotation_sha256=hashlib.sha256(json.dumps(a,sort_keys=True).encode()).hexdigest(),valid_fraction=float(f'{valid.mean():.4f}'));rows.append(row)
report=dict(method='Fixed manual photo silhouettes vs isolated actual geometry; masks at 1600x1000; explicit validity exclusions for occlusion. No geometry-ground-truth claim.',round=round,views=rows)
paired=[r for r in rows if r.get('before')is not None and r.get('after')is not None]
report['paired_scored_views']=len(paired)
for k in ['before','after']:
 vals=[r[k]for r in paired];report['mean_'+k]=sum(vals)/len(vals)if vals else None
(OUT/'star_vista_v3_iou.json').write_text(json.dumps(report,indent=2))
(P/(round+'_iou.json')).write_text(json.dumps(report,indent=2))
# Several bounded sheets instead of a single unreadably tall image.
cats=[('star_vista_v3',[v for v in manifest['views']if v['name'].startswith('original_')]),('star_vista_v3_orbit',[v for v in manifest['views']if v['name'].startswith('orbit')]),('star_vista_v3_close',[v for v in manifest['views']if v['name'].startswith('cu_')]),('star_vista_v3_close150',[v for v in manifest['views']if v['name'].startswith('close150')]),('star_vista_v3_top_street',[v for v in manifest['views']if v['name'].startswith(('top_','street_'))])]
for title,vs in cats:
 for k in range(0,len(vs),8):
  batch=[v for v in vs[k:k+8]if(D/(v['name']+'.jpg')).exists()]
  if not batch:continue
  sheet=Image.new('RGB',(1600,len(batch)*524),'#182129');draw=ImageDraw.Draw(sheet)
  for i,v in enumerate(batch):
   for j,file in enumerate([v['file'],D/(v['name']+'.jpg')]):
    im=Image.open(file).convert('RGB');im.thumbnail((800,500));sheet.paste(im,(j*800,i*524+24));draw.text((j*800+12,i*524+6),v['name']+' | '+('REFERENCE'if j==0 else'MODEL '+round),fill='white')
  suffix=''if k==0 else '_'+str(k//8+1);sheet.save(OUT/(title+suffix+'.jpg'),quality=93)
print(json.dumps(report,indent=2))
