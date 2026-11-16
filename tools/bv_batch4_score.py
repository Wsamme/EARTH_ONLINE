"""Fixed manual reference masks. Unknown street cameras are never scored."""
from pathlib import Path
from PIL import Image,ImageDraw
import numpy as np,json,sys,hashlib
out=Path('/workspace/eo_codex_out/bv_batch4')/(sys.argv[1]if len(sys.argv)>1 else'round1')
ann=json.load(open('tools/bv_batch4_annotations.json'));rows=[]
def poly(P):
 im=Image.new('L',(1600,1000));ImageDraw.Draw(im).polygon([(2*x,2*y)for x,y in P],fill=255);return np.asarray(im)>0
for a in ann['views']:
 s,v=a['slug'],a['view'];ref=np.zeros((1000,1600),bool)
 for P in a['polygons']:ref|=poly(P)
 for P in a.get('holes',[]):ref&=~poly(P)
 valid=poly(a['valid'])if'valid'in a else np.ones_like(ref)
 model=np.asarray(Image.open(out/(s+'_'+v+'_mask.png')).convert('L'))>127
 i=np.sum(model&ref&valid);u=np.sum((model|ref)&valid)
 rows.append(dict(slug=s,view=v,iou=float(i/max(1,u)),note=a['note'],annotation_sha256=hashlib.sha256(json.dumps(a,sort_keys=True).encode()).hexdigest()))
 rgb=np.asarray(Image.open('/workspace/bv_refs/'+s+'/'+v+'.jpg').convert('RGB')).copy();rgb[ref&~model&valid]=[255,70,40];rgb[model&~ref&valid]=[40,110,255];rgb[model&ref&valid]=(rgb[model&ref&valid]*.6+np.array([50,230,90])*.4).astype('uint8');Image.fromarray(rgb).save(out/(s+'_'+v+'_iou.jpg'))
r=dict(method=ann['method'],views=rows,means={s:sum(x['iou']for x in rows if x['slug']==s)/sum(x['slug']==s for x in rows) for s in ['nucleos','fusionopolis_two']});(out/'iou.json').write_text(json.dumps(r,indent=2));print(json.dumps(r,indent=2))
