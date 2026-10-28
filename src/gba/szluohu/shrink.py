# convert PNG shots in a dir to JPEG (q 80) and delete the PNGs: python3 shrink.py dir [maxw]
import sys, os
from PIL import Image
d = sys.argv[1]; mw = int(sys.argv[2]) if len(sys.argv) > 2 else 1400
for f in os.listdir(d):
    if f.endswith('.png'):
        p = os.path.join(d, f); im = Image.open(p).convert('RGB')
        if im.width > mw: im = im.resize((mw, int(im.height*mw/im.width)))
        im.save(p[:-4] + '.jpg', quality=80); os.remove(p)
