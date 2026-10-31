"""Project original model triangles for a quick local massing preview; no mesh input."""
import sys,json,math
from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw
out=Path(sys.argv[1]);meta=json.load(open('/workspace/je_refs/ng_teng_fong/meta.json'))
g=json.load(open(out/'geometry.json'));V=np.array(g['positions']).reshape(-1,3)
W,H=meta['image']['size'];f=W/(2*math.tan(math.pi/6));scores={}
for name,s in meta['shots'].items():
 hd,pt=map(math.radians,[s['heading'],s['pitch']]);forward=np.array([math.sin(hd)*math.cos(pt),math.sin(pt),-math.cos(hd)*math.cos(pt)])
 right=np.array([math.cos(hd),0,math.sin(hd)]);up=np.cross(right,forward)
 c=meta['centroid'];eye=np.array([(s['lon']-c['lon'])*111320*math.cos(math.radians(c['lat'])),s['alt']-meta['height']['ground_ellipsoidal_m'],-(s['lat']-c['lat'])*110574])
 R=V-eye;z=R@forward;xy=np.column_stack((W/2+f*(R@right)/z,H/2-f*(R@up)/z)).reshape(-1,3,2)
 im=Image.new('L',(W,H));d=ImageDraw.Draw(im)
 for p,zz in zip(xy,z.reshape(-1,3)):
  if np.min(zz)>.1:d.polygon([tuple(v) for v in np.clip(p,-10000,10000)],fill=255)
 im.save(out/f'ng_teng_fong_{name}_mask.png')
 # supplied beauty reference is solely an offline overlay background
 src=np.array(Image.open('/workspace/je_refs/ng_teng_fong/'+name+'_clip.png').convert('RGB'));R=~((src[:,:,0]>200)&(src[:,:,1]<70)&(src[:,:,2]>200))
 for x in np.where(R.any(0))[0]:
  ys=np.where(R[:,x])[0];R[ys[0]:ys[-1]+1,x]=True
 M=np.array(im)>127;rgb=np.array(Image.open('/workspace/je_refs/ng_teng_fong/'+name+'.jpg'))
 rgb[R&~M]=[255,70,40];rgb[M&~R]=[40,110,255];rgb[M&R]=(rgb[M&R]*.55+np.array([50,230,90])*.45).astype('uint8');Image.fromarray(rgb).save(out/(name+'_overlay.jpg'))
 scores[name]=round(float((M&R).sum()/max(1,(M|R).sum())),3)
 print(name,scores[name])
base=[scores[v] for v in ['n','e','s','w','top']]
(out/'preview_iou.json').write_text(json.dumps({'preview_only':True,'views':scores,'mean_nesw_top':round(sum(base)/5,3)},indent=2))
