# stage 3c (gbareal): the roofs of all buildings baked into the 8192 px ground texture (as b3b does for the 4096 px one, at 1:1 instead
# of 2x supersampling, blended in strips so the peak stays < ~1 GB) -> out/ground8k.webp (staged as gbadata/ground8k.webp)
import sys; sys.path.insert(0, '.')
from common import *
from PIL import Image, ImageDraw
S = 8192
img = Image.open(OUT + 'ground8k_base.webp').convert('RGB')
PAL = [(196, 194, 188), (120, 124, 128), (172, 96, 72), (150, 164, 176), (138, 160, 110), (230, 230, 226), (110, 90, 80), (190, 92, 60)]
Bd = load('buildings.pkl')
col = Image.new('RGB', (S, S), (0, 0, 0)); msk = Image.new('L', (S, S), 0); dc = ImageDraw.Draw(col); dm = ImageDraw.Draw(msk)
f = lambda c: [((x + HALF)/(2*HALF)*S, (HALF - y)/(2*HALF)*S) for x, y in c]
n = 0
for b in Bd['b']:
    g = b['g']
    if g.geom_type != 'Polygon': continue
    rc = b['rc'] or PAL[b['roof'] if b['roof'] < len(PAL) else 0]
    if b['t'] in (2, 4, 5, 6, 7, 10, 11, 12) and not b['rc']: rc = (184, 182, 176) if b['t'] != 6 else (196, 196, 192)
    rc = tuple(int(v*0.86) for v in rc); P = f(g.exterior.coords)
    if len(P) < 3: continue
    dc.polygon(P, fill=rc); dm.polygon(P, fill=200); n += 1      # 200: ~ the 2x2 box average of b3b at the edges
del Bd
print('drawn', n, flush=True)
out = Image.new('RGB', (S, S)); k = 0.8; ST = 512
for y0 in range(0, S, ST):
    box = (0, y0, S, min(S, y0 + ST))
    G = np.asarray(img.crop(box)).astype(np.float32); C = np.asarray(col.crop(box)).astype(np.float32); A = np.asarray(msk.crop(box)).astype(np.float32)[..., None]/255.0
    out.paste(Image.fromarray(np.clip(G*(1 - A*k) + C*A*k, 0, 255).astype(np.uint8)), box[:2])
out.save(OUT + 'ground8k.webp', quality=86, method=4)
print('saved', __import__('os').path.getsize(OUT + 'ground8k.webp'))
