"""Contact sheets: reference left, exact-camera full-app render right. Local only."""
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageStat
refs, renders, out = map(Path, sys.argv[1:4])
views = ['n', 'e', 's', 'w', 'top', 'street']
font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 17)
for slug in sys.argv[4:]:
    sheet = Image.new('RGB', (1600, 6*534), '#182020')
    d = ImageDraw.Draw(sheet)
    for i, view in enumerate(views):
        for col, p in enumerate([refs / slug / (view+'.jpg'), renders / (slug+'_'+view+'.jpg')]):
            im = Image.open(p).convert('RGB')
            if col == 1 and max(ImageStat.Stat(im).stddev) < 8:
                raise ValueError(f'Blank render: {p}')
            im = im.resize((800, 500))
            sheet.paste(im, (col*800, i*534+34))
            d.text((col*800+12, i*534+8), f'{slug} / {view.upper()} — '+('REFERENCE' if col == 0 else 'MODEL / '+renders.name), fill='white', font=font)
    sheet.save(out / (slug+'.jpg'), quality=92)
    sheet.save(renders / (slug+'_sheet.jpg'), quality=90)
