# shrink.py <dir>: every PNG -> JPEG at half size (q 82), PNG removed (disk is tight)
import sys, glob, os
from PIL import Image
for f in glob.glob(os.path.join(sys.argv[1], '*.png')):
    im = Image.open(f).convert('RGB'); w, h = im.size
    if 'plan' in f: im = im.resize((w*2//3, h*2//3))
    else: im = im.resize((w*3//4, h*3//4))
    im.save(f[:-4] + '.jpg', quality=82); os.remove(f)
