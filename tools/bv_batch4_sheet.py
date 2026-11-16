"""Local evidence sheets only; outputs never enter the repository."""
from PIL import Image,ImageDraw,ImageOps,ImageFont
from pathlib import Path
import json
out=Path('/workspace/eo_codex_out');root=out/'bv_batch4'/'final';r=json.load(open(root/'iou.json'))
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',18)
small=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',15)
for slug in ['nucleos','fusionopolis_two']:
 views=['n','e','s','w','top']+(['orbit_h0225_p15']if slug=='fusionopolis_two'else[])
 rows=[]
 for v in views:
  score=next(x['iou']for x in r['views']if x['slug']==slug and x['view']==v)
  note=next(x['note']for x in r['views']if x['slug']==slug and x['view']==v)
  rows.append(([Path('/workspace/bv_refs')/slug/(v+'.jpg'),root/(slug+'_'+v+'_day.jpg'),root/(slug+'_'+v+'_night.jpg')],v+' | IoU %.4f | '%score+note))
 if slug=='fusionopolis_two':
  rows.append(([Path('/workspace/bv_photo_refs/f2/img19-11.jpg'),out/'f2_dusk_photo_day.jpg',out/'f2_dusk_photo_night.jpg'],'Dusk photo img19-11 (SG Mark) | approximate camera + model display crop, NOT IoU | context hidden'))
 else:
  rows.append(([Path('/workspace/bv_wip_codex/batch4/cpg/Nucleos-Building.jpg'),out/'nucleos_photo_day.jpg',out/'nucleos_photo_night.jpg'],'Built-project photo: CPG Nucleos-Building.jpg | approximate camera + model display crop, NOT IoU | context hidden'))
 w=1920;rh=450;c=Image.new('RGB',(w,100+rh*len(rows)),(20,25,30));d=ImageDraw.Draw(c)
 d.text((15,12),slug+' | reference images only, no runtime tiles | mean IoU %.4f'%r['means'][slug],font=font,fill='white')
 for j,title in enumerate(['REFERENCE (day / dusk)','MODEL DAY','MODEL NIGHT (inferred occupancy)']):d.text((j*640+12,55),title,font=font,fill='#d8e7ed')
 for i,(ps,title)in enumerate(rows):
  y=100+i*rh;d.text((12,y+5),title[:160],font=small,fill='#e5cba3')
  for j,p in enumerate(ps):
   im=Image.open(p).convert('RGB');
   if i==len(views)and j>0:im=im.crop((320,160,1230,710)if slug=='nucleos'else(380,0,1260,870))
   im=ImageOps.contain(im,(636,402));c.paste(im,(j*640+(640-im.width)//2,y+38+(402-im.height)//2))
 c.save(out/(slug+'_compare.jpg'),quality=94)
 # A smaller contact sheet for visual review.
 c.thumbnail((1200,2400));c.save(out/'bv_batch4'/(slug+'_contact.jpg'),quality=92)
