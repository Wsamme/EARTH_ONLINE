"""Local-only comparison sheets and an explicitly unregistered OHV photo overlay."""
from pathlib import Path
import shutil,json
from PIL import Image,ImageDraw,ImageFont,ImageOps,ImageFilter
import numpy as np
out=Path('/workspace/eo_codex_out');base=out/'bv_batch2';stage=base/'final';photos=base/'photo_final'
if not (photos/'ohv_street_day.jpg').exists():photos=stage
hrsc=base/'photo_refit' if (base/'photo_refit/hrsc_photo66_day.jpg').exists() else photos
hrscStage=base/'hrsc_final' if (base/'hrsc_final/holland_road_sc_e_day.jpg').exists() else stage
if (hrscStage/'hrsc_photo66_day.jpg').exists():hrsc=hrscStage
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',17);small=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',13)
def cell(p):
 im=Image.open(p).convert('RGB');im.thumbnail((600,375));q=Image.new('RGB',(600,375),'#090d12');q.paste(im,((600-im.width)//2,(375-im.height)//2));return q
def sheet(slug):
 renders=hrscStage if slug=='holland_road_sc' else stage
 rows=[]
 for v in ['n','e','s','w','top','street']:
  note=v+' | exact supplied pose'+(' | HISTORICAL: pre-development; context only, no IoU'if slug=='one_holland_village'else' | geometry fit; context retained')
  rows.append((Path('/workspace/bv_refs')/slug/(v+'.jpg'),renders/(slug+'_'+v+'_day.jpg'),renders/(slug+'_'+v+'_night.jpg'),note))
 if slug=='one_holland_village':
  rows += [(Path('/workspace/bv_photo_refs/ohv/commons_Holland_Village_13_05_2024_40_jpg.jpg'),photos/'ohv_street_day.jpg',photos/'ohv_street_night.jpg','Photo (40), LN9267 / CC BY-SA 4.0 | APPROXIMATE camera; not photo IoU'),(Path('/workspace/bv_photo_refs/ohv/verified/vantaly_2.jpg'),photos/'ohv_court_day.jpg',photos/'ohv_court_night.jpg','Vantaly: Interlude courtyard | APPROXIMATE camera; original fin interpretation'),(Path('/workspace/bv_photo_refs/ohv/verified/plantwerkz_night.jpg'),photos/'ohv_terrace_day.jpg',photos/'ohv_terrace_night.jpg','Plantwerkz NIGHT reference | APPROXIMATE terrace camera; warm corridors')]
 else:
  for v in ['orbit_h0225_p15','orbit_h1575_p15']:rows.append((Path('/workspace/bv_refs')/slug/(v+'.jpg'),renders/(slug+'_'+v+'_day.jpg'),renders/(slug+'_'+v+'_night.jpg'),v+' | exact supplied pose; visual check only'))
  rows += [(Path('/workspace/bv_photo_refs/ohv/commons_Holland_Village_13_05_2024_66_jpg.jpg'),hrsc/'hrsc_photo66_day.jpg',hrsc/'hrsc_photo66_night.jpg','Photo (66), LN9267 / CC BY-SA 4.0 | current colours; APPROXIMATE street camera'),(Path('/workspace/bv_photo_refs/holland/lta_hrsc_night_crop.jpg'),hrsc/'hrsc_photo66_day.jpg',hrsc/'hrsc_photo66_night.jpg','LTA Circle Line book, p76: HISTORICAL NIGHT reference | lighting only; older repaint')]
 im=Image.new('RGB',(1800,90+len(rows)*410),'#16202a');d=ImageDraw.Draw(im);d.text((12,9),slug+' — original procedural reconstruction; references remain local',font=font,fill='white')
 for i,t in enumerate(['REFERENCE (images only)','MODEL DAY','MODEL NIGHT']):d.text((i*600+12,45),t,font=font,fill='#d5e3e9')
 for j,(a,b,c,label)in enumerate(rows):
  y=90+j*410
  for i,p in enumerate([a,b,c]):im.paste(cell(p),(i*600,y))
  d.text((10,y+378),label,font=small,fill='#e0e8e8')
 im.save(out/(slug+'_compare.jpg'),quality=93)
 im.resize((900,im.height//2)).save(base/(slug+'_contact.jpg'),quality=92)
for s in ['one_holland_village','holland_road_sc']:sheet(s)
# Same 4:3 frame, centre-crop the render only; no 2D alignment/warp is applied.
ref=Image.open('/workspace/bv_photo_refs/ohv/commons_Holland_Village_13_05_2024_40_jpg.jpg').convert('RGB').resize((800,600))
model=ImageOps.fit(Image.open(photos/'ohv_street_day.jpg').convert('RGB'),(800,600))
mask=ImageOps.fit(Image.open(photos/'ohv_street_day_mask.png').convert('L'),(800,600),method=Image.Resampling.NEAREST)
bound=np.asarray(mask.filter(ImageFilter.MaxFilter(3)))!=np.asarray(mask.filter(ImageFilter.MinFilter(3)))
a=ref.copy();dr=ImageDraw.Draw(a)
for P in [[(0,130),(152,231)],[(0,246),(201,324)],[(0,309),(200,337)],[(622,0),(651,310)],[(677,3),(676,286),(799,267)]]:dr.line(P,fill='#ffdf40',width=3)
b=np.asarray(model).copy();b[bound]=[40,225,255];b=Image.fromarray(b)
c=Image.blend(ref,model,.5);arr=np.asarray(c).copy();arr[bound]=[40,225,255];c=Image.fromarray(arr);dr=ImageDraw.Draw(c)
for P in [[(0,130),(152,231)],[(0,246),(201,324)],[(0,309),(200,337)],[(622,0),(651,310)]]:dr.line(P,fill='#ffdf40',width=3)
im=Image.new('RGB',(2400,680),'#16202a');dr=ImageDraw.Draw(im)
for i,(pic,label)in enumerate([(a,'PHOTO: visible architecture guides (yellow)'),(b,'MODEL: outer boundary (cyan), approximate camera'),(c,'50% OVERLAY: unregistered; NO quantitative IoU')]):im.paste(pic,(i*800,45));dr.text((i*800+10,10),label,font=font,fill='white')
dr.text((10,650),'Photo (40): LN9267, CC BY-SA 4.0. Render centre-cropped to 4:3; no registration or warp. The disagreement remains visible.',font=small,fill='white');im.save(out/'one_holland_village_photo_overlay.jpg',quality=93)
for m in ['day','night']:shutil.copyfile(photos/('ohv_overview_ne_'+m+'.jpg'),out/('one_holland_village_hero_'+m+'.jpg'))
(out/'one_holland_village_photo_check.json').write_text(json.dumps({'camera':'approximate local courtyard pose, recorded in photo_final/verification.json','tileIoU':None,'photoIoU':None,'overlay':'unregistered 50% blend with manual photo guides and rendered outer boundary; no warp; render centre-cropped to 4:3','limits':['Trees obscure much of the photo architecture','Internal retail bar and walkway plan approximate','Floor-to-floor metre heights and tower elevations estimated','Photo facade rhythm and planting density differ from model','No surveyed camera or quantitative outline agreement claimed']},indent=2))
