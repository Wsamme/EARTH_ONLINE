# shrink shots in a folder: PNG -> JPEG quality 82 (width <= 1100), delete the PNG
import sys, os
from PIL import Image
for d in sys.argv[1:]:
    for f in sorted(os.listdir(d)):
        if not f.endswith('.png'): continue
        p = os.path.join(d, f); im = Image.open(p).convert('RGB')
        if im.width > 1100: im = im.resize((1100, round(im.height*1100/im.width)), Image.LANCZOS)
        im.save(p[:-4] + '.jpg', quality=82); os.remove(p)
