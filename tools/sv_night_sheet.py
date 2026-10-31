"""Local-only comparison sheets; never copies reference photos into the repo."""
from pathlib import Path
from PIL import Image, ImageOps, ImageDraw, ImageFont
import json
out=Path('/workspace/eo_codex_out'); raw=out/'sv_night'; refs=Path('/workspace/sv_night_refs')
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',16)
small=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',12)
rows=[('commons_Star_Vista_in_your_face_8527566637.jpg','front'),('ledinside_01.jpg','side'),('commons_Star_Vista_8522414945.jpg','side'),('ledinside_07.jpg','plaza')]
w,h=600,410
sheet=Image.new('RGB',(w*3,h*len(rows)+100),'#111923');d=ImageDraw.Draw(sheet)
for row,(photo,view) in enumerate(rows):
 for col,path in enumerate([refs/photo,raw/(view+'_0.jpg'),raw/(view+'_1.jpg')]):
  im=ImageOps.contain(Image.open(path),(w-12,h-80));x=col*w;y=row*h+38
  sheet.paste(im,(x+(w-im.width)//2,y+(h-80-im.height)//2))
  title=['REAL PHOTO','NORMAL NIGHT | show=0','SHOW NIGHT | show=1 (inferred)'][col]
  d.text((x+10,row*h+8),title,font=font,fill='#e6eff9')
  d.text((x+10,row*h+h-38),photo,font=small,fill='#ced8e6')
  d.text((x+10,row*h+h-20),'Approximate angle; geometry fixed at Star Vista v3',font=small,fill='#899bab')
d.text((12,h*len(rows)+6),'Photos: Erwin Soo / CC BY 2.0 (Commons); Toshio Kaneko / LPA (LEDinside press references).',font=font,fill='white')
d.text((12,h*len(rows)+33),'Lighting comparison only: exposures, cameras and context differ; model has procedural glass and floor fountain lights.',font=small,fill='#ced8e6')
d.text((12,h*len(rows)+55),'Full source URLs and licence attribution: star_vista_night_sources.txt. Reference photographs are local review inputs only.',font=small,fill='#ced8e6')
sheet.save(out/'star_vista_night_compare.jpg',quality=94)
frames=[];strip=Image.new('RGB',(1200,3*280),'#111923');sd=ImageDraw.Draw(strip)
for i in range(9):
 im=ImageOps.contain(Image.open(raw/f'cycle_1_{i}.jpg'),(800,500));canvas=Image.new('RGB',(800,530),'#111923');canvas.paste(im,(0,25));ImageDraw.Draw(canvas).text((12,6),f'SHOW NIGHT | {i}s | inferred facade cues',font=font,fill='white');frames.append(canvas)
 thumb=ImageOps.contain(im,(400,250));x=(i%3)*400;y=(i//3)*280;strip.paste(thumb,(x,y+25));sd.text((x+8,y+3),f'show=1 | t={i}s',font=font,fill='white')
frames[0].save(out/'star_vista_show_anim.gif',save_all=True,append_images=frames[1:-1],duration=1000,loop=0)
strip.save(out/'star_vista_show_strip.jpg',quality=94)
credits=['Local review artefacts; reference photographs are not project assets.','LEDinside photos: Toshio Kaneko / Lighting Planners Associates (press references).','https://ledinside.com/gallery/view/24','https://www.ledinside.com/lighting/2013/10/surreal_architecture_falling_on_the_ground_the_star_performing_arts_centre_star_vista','Commons images: source file pages and original licences below; comparison uses unmodified photos resized to fit.']
for entry in json.load(open(refs/'commons.json')):
 if any(entry.get('file')==p for p,_ in rows):
  credits.append('\n'+entry['file']+'\n'+'Erwin Soo'+' / '+entry.get('lic','')+'\n'+entry['page'])
(out/'star_vista_night_sources.txt').write_text('\n'.join(credits)+'\nLicence: https://creativecommons.org/licenses/by/2.0/\n')
