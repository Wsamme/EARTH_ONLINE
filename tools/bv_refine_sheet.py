"""Local-only reference | baseline | final sheets; no assets copied into git."""
from pathlib import Path
import json
from PIL import Image,ImageDraw,ImageFont
out=Path('/workspace/eo_codex_out');base=out/'bv_batch1'
data=json.load(open('src/sgbv/footprints.json'))
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',18)
small=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',14)
for slug in data:
 views=['n','e','s','w','top','street'];sheet=Image.new('RGB',(1800,6*405+78),'#18212b');d=ImageDraw.Draw(sheet)
 d.text((15,8),slug+' — Batch 1; exact recorded cameras; full app context',font=font,fill='white')
 for c,label in enumerate(['LOCAL REFERENCE (photo only)','BEFORE — a69f9f2','AFTER — Batch 1']):d.text((c*600+12,42),label,font=font,fill='#dae8ef')
 for r,v in enumerate(views):
  for c,p in enumerate([Path('/workspace/bv_refs')/slug/(v+'.jpg'),base/'before'/(slug+'_'+v+'.jpg'),base/'after'/(slug+'_'+v+'.jpg')]):
   im=Image.open(p).convert('RGB').resize((600,375));y=78+r*405;sheet.paste(im,(c*600,y));d.text((c*600+10,y+378),v+' | existing terrain/context may occlude street views',font=small,fill='#dae8ef')
 sheet.save(out/('bv_refine_'+slug+'.jpg'),quality=93)
 # Nine-row visual overview can be read in one image.
 thumb=sheet.resize((900,1254));thumb.save(base/(slug+'_contact.jpg'),quality=90)
