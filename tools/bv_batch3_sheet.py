"""Local reference/day/night sheets. No source images are copied into the repo."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont,ImageOps,ImageFilter
import numpy as np,json,shutil
out=Path('/workspace/eo_codex_out');base=out/'bv_batch3';piazza=base/'final';elementum=base/'elementum_final';photo=base/'photo_final'
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',17);small=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',13)
refs=Path('/workspace/bv_photo_refs/elementum')
def som(number):return next(refs.glob('Elementum_SOM*_'+number+'_large*.jpg'))
def fit(p):
 im=Image.open(p).convert('RGB');im.thumbnail((600,375));q=Image.new('RGB',(600,375),'#090e14');q.paste(im,((600-im.width)//2,(375-im.height)//2));return q
def sheet(slug,stage,extra):
 rows=[]
 for v in ['n','e','s','w','top','street']:
  note=(v+' | exact supplied pose | '+('PRE-DEVELOPMENT CONTEXT ONLY: no current-building IoU'if slug=='elementum'else'construction-stage massing; street unscored'))
  rows.append((Path('/workspace/bv_refs')/slug/(v+'.jpg'),stage/(slug+'_'+v+'_day.jpg'),stage/(slug+'_'+v+'_night.jpg'),note))
 rows+=extra;im=Image.new('RGB',(1800,90+len(rows)*410),'#16212b');d=ImageDraw.Draw(im)
 d.text((12,10),slug+' — original procedural model; reference photos remain local',font=font,fill='white')
 for i,s in enumerate(['REFERENCE (images only)','MODEL DAY','MODEL NIGHT']):d.text((i*600+12,47),s,font=font,fill='#d6e5e9')
 for j,(a,b,c,note)in enumerate(rows):
  y=90+j*410
  for i,p in enumerate([a,b,c]):im.paste(fit(p),(i*600,y))
  d.text((10,y+379),note,font=small,fill='#dbe6e8')
 im.save(out/(slug+'_compare.jpg'),quality=93);im.resize((900,im.height//2)).save(base/(slug+'_contact.jpg'),quality=92)
sheet('holland_piazza',piazza,[(Path('/workspace/bv_photo_refs/ohv/commons_Holland_Village_13_05_2024_61_jpg.jpg'),photo/'piazza_photo61_day.jpg',photo/'piazza_photo61_night.jpg','Photo (61): LN9267 / CC BY-SA 4.0 | APPROXIMATE camera; selected context suppressed; night inferred')])
extra=[]
for num,name,label in [('01','elementum_front','rounded outer elevation'),('08','elementum_setbacks','U and terraces'),('16','elementum_garden','roof garden'),('20','elementum_atrium','open forum / skylight')]:extra.append((som(num),photo/(name+'_day.jpg'),photo/(name+'_night.jpg'),'Marc Tan / Studio Periphery via SOM | '+label+' | APPROXIMATE camera; selected context suppressed'))
extra.append((refs/'luci/luci_4.jpg',photo/'elementum_atrium_day.jpg',photo/'elementum_atrium_night.jpg','LUCI / ND Photography: INTERIOR 3000 K reference only | approximate atrium interpretation; no exterior night survey'))
sheet('elementum',elementum,extra)
# Explicitly unregistered diagnostic; no pixel-overlap statistic is claimed.
ref=Image.open(som('01')).convert('RGB').resize((800,450));model=ImageOps.fit(Image.open(photo/'elementum_front_day.jpg').convert('RGB'),(800,450));mask=ImageOps.fit(Image.open(photo/'elementum_front_day_mask.png').convert('L'),(800,450),method=Image.Resampling.NEAREST)
bound=np.asarray(mask.filter(ImageFilter.MaxFilter(3)))!=np.asarray(mask.filter(ImageFilter.MinFilter(3)))
outline=[(258,88),(286,86),(540,88),(558,91),(570,98),(575,109),(575,367),(564,375),(552,378),(357,378),(344,364),(338,349),(335,325),(335,296),(328,293),(323,306),(322,361),(295,365),(281,364),(281,349),(273,347),(272,326),(272,306),(262,300),(259,274),(258,248),(258,222),(258,197),(258,171),(258,146),(258,120),(258,88)]
a=ref.copy();ImageDraw.Draw(a).line(outline,fill='#ffdf40',width=2);arr=np.asarray(model).copy();arr[bound]=[40,225,255];b=Image.fromarray(arr);arr=np.asarray(Image.blend(ref,model,.5)).copy();arr[bound]=[40,225,255];c=Image.fromarray(arr);ImageDraw.Draw(c).line(outline,fill='#ffdf40',width=2)
im=Image.new('RGB',(2400,530),'#16212b');d=ImageDraw.Draw(im)
for i,(q,title)in enumerate([(a,'PHOTO: manual outline guide (yellow)'),(b,'MODEL: rendered boundary (cyan), approximate pose'),(c,'50% UNREGISTERED BLEND: no quantitative photo IoU')]):im.paste(q,(800*i,45));d.text((800*i+10,10),title,font=font,fill='white')
d.text((10,500),'Photo: Marc Tan / Studio Periphery via SOM. Model centre-cropped to 16:9; no alignment warp. Generic context suppressed only in this photo diagnostic.',font=small,fill='white');im.save(out/'elementum_photo_check.jpg',quality=93)
(out/'elementum_photo_check.json').write_text(json.dumps({'tileIoU':None,'photoIoU':None,'reason':'Pre-development tiles; approximate, unregistered photo cameras cannot support quantitative photo IoU.','heightChoice':'SOM 63m / 12 levels. CTBUH 92.6m / 13 floors / 76m occupied remains unresolved; no invented stacks.','context':'Selected streamed/synthetic context and non-reference landmarks suppressed in photo diagnostics; full context retained in normal poses and hero.','checks':['Rounded glass/aluminium elevation and intermediate fins present','Stepped U and open ground forum present','Triangulated planted roof area 900m² after skylight subtraction','Warm lower soffit and cool lab-window palette present'],'gaps':['Unsurveyed camera and ground levels','Upper plate/setback layout estimated from photos','Facade proportions and individual joints simplified','Garden layout and skylight size estimated','No exterior night photometric validation']},indent=2))
for mode in ['day','night']:shutil.copyfile(elementum/('elementum_hero_'+mode+'.jpg'),out/('elementum_hero_'+mode+'.jpg'))
