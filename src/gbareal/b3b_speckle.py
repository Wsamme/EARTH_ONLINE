# stage 3b: bake the roofs of all buildings into the ground texture (17.6 m per pixel), so the far tiles — which only draw the
# big buildings in 3D — still show the grain of the neighbourhoods (the 3D houses appear on top when the camera comes near)
import sys; sys.path.insert(0, '.')
from common import *
from PIL import Image, ImageDraw
S = 4096; SS = 2*S
img = Image.open(OUT + 'ground_base.webp' if __import__('os').path.exists(OUT + 'ground_base.webp') else OUT + 'ground.webp').convert('RGB')
img.save(OUT + 'ground_base.webp', quality=92) if not __import__('os').path.exists(OUT + 'ground_base.webp') else None
PAL = [(196, 194, 188), (120, 124, 128), (172, 96, 72), (150, 164, 176), (138, 160, 110), (230, 230, 226), (110, 90, 80), (190, 92, 60)]
Bd = load('buildings.pkl')
col = Image.new('RGB', (SS, SS), (0, 0, 0)); msk = Image.new('L', (SS, SS), 0)
dc = ImageDraw.Draw(col); dm = ImageDraw.Draw(msk)
f = lambda c: [((x + HALF)/(2*HALF)*SS, (HALF - y)/(2*HALF)*SS) for x, y in c]
n = 0
for b in Bd['b']:
    g = b['g']
    if g.geom_type != 'Polygon': continue
    rc = b['rc'] or PAL[b['roof'] if b['roof'] < len(PAL) else 0]
    if b['t'] in (2, 4, 5, 6, 7, 10, 11, 12) and not b['rc']: rc = (184, 182, 176) if b['t'] != 6 else (196, 196, 192)
    # a touch darker than the roof itself (walls and shadow at this scale)
    rc = tuple(int(v*0.86) for v in rc)
    P = f(g.exterior.coords)
    if len(P) < 3: continue
    dc.polygon(P, fill=rc); dm.polygon(P, fill=255); n += 1
print('drawn', n, flush=True)
del Bd
col = col.resize((S, S), Image.BOX); msk = msk.resize((S, S), Image.BOX)
G = np.asarray(img).astype(np.float32); C = np.asarray(col).astype(np.float32); A = np.asarray(msk).astype(np.float32)[..., None]/255.0
# the colour image is averaged over the whole 2x2 block (zeros outside): undo that by the coverage
C = np.where(A > 0.01, C/np.maximum(A, 0.01), 0)
k = 0.8
out = G*(1 - A*k) + C*A*k
Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save(OUT + 'ground.webp', quality=90, method=6)
Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)[1800:2400, 2000:2600]).save(OUT + 'prev_speckle_kln.png')
print('saved', __import__('os').path.getsize(OUT + 'ground.webp'))
