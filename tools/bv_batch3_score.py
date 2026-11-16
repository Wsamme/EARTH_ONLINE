"""Five fixed Piazza reference-camera outlines; Elementum tile metric unavailable."""
from pathlib import Path
from PIL import Image,ImageDraw
import numpy as np,json,sys,hashlib
base=Path('/workspace/eo_codex_out/bv_batch3');stage=sys.argv[1]if len(sys.argv)>1 else'round1';out=base/stage
ann=json.load(open('tools/bv_batch3_annotations.json'));rows=[]
def poly(P):
 im=Image.new('L',(1600,1000));ImageDraw.Draw(im).polygon([(2*x,2*y)for x,y in P],fill=255);return np.asarray(im)>0
for a in ann['views']:
 ref=np.zeros((1000,1600),bool)
 for P in a['polygons']:ref|=poly(P)
 valid=poly(a['valid'])if'valid'in a else np.ones_like(ref)
 model=np.asarray(Image.open(out/('holland_piazza_'+a['view']+'_mask.png')).convert('L'))>127
 intersection=np.sum(model&ref&valid);union=np.sum((model|ref)&valid)
 rows.append({'view':a['view'],'iou':float(intersection/max(1,union)),'note':a['note'],'annotation_sha256':hashlib.sha256(json.dumps(a,sort_keys=True).encode()).hexdigest()})
 rgb=np.asarray(Image.open('/workspace/bv_refs/holland_piazza/'+a['view']+'.jpg').convert('RGB')).copy();rgb[ref&~model&valid]=[255,70,40];rgb[model&~ref&valid]=[40,110,255];rgb[model&ref&valid]=(rgb[model&ref&valid]*.6+np.array([50,230,90])*.4).astype('uint8');Image.fromarray(rgb).save(out/('holland_piazza_'+a['view']+'_iou.jpg'))
r={'method':ann['method'],'unscored':ann['unscored'],'piazza':rows,'mean':sum(x['iou']for x in rows)/len(rows),'elementum':{'tile_iou':None,'reason':'Supplied Elementum tiles predate the building; photo cameras approximate, no quantitative photo IoU claimed.'}};(out/'iou.json').write_text(json.dumps(r,indent=2));print(json.dumps(r,indent=2))
