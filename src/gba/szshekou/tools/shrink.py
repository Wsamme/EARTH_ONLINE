# shrink every PNG under a folder to JPEG-ish small PNG (max 1000 px wide, palette) to save disk
import sys, os
from PIL import Image
for r, _, fs in os.walk(sys.argv[1]):
    for f in fs:
        if not f.endswith('.png'): continue
        p = os.path.join(r, f); im = Image.open(p).convert('RGB')
        if im.width > 1000: im = im.resize((1000, round(im.height*1000/im.width)), Image.LANCZOS)
        im.save(p[:-4] + '.jpg', quality=82); os.remove(p)
