"""Little India: silhouette IoU + compare sheets. Local only; never reads meshes, never ships references.
python3 tools/li_score.py <refs> <renders> <out> slug...
Reference mask = <view>_clip.png (Google tiles clipped to the OSM footprint, magenta = background).
Model mask = <slug>_<view>_mask.png (only the target landmark group, white on black).
"""
import sys, json
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont
refs, ren, out = map(Path, sys.argv[1:4])
font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 18)
SCORED = ['n', 'e', 's', 'w', 'top', 'close_ne', 'close_sw', 'street']
FILL = True
agg_p = out / 'li_iou.json'
agg = json.loads(agg_p.read_text()) if agg_p.exists() else {}
def refmask(p):
    a = np.asarray(Image.open(p).convert('RGB')).astype(int)
    m = ~((a[..., 0] > 200) & (a[..., 1] < 70) & (a[..., 2] > 200))
    # photogrammetry merges foreground tree canopies into the mesh, so clipping leaves holes in facades;
    # fill each column between its first and last target pixel (building silhouettes are vertically convex)
    if FILL:
        idx = np.where(m.any(0))[0]
        for x in idx:
            ys = np.where(m[:, x])[0]; m[ys[0]:ys[-1] + 1, x] = True
    return m
for slug in sys.argv[4:]:
    if not (refs / slug / 'meta.json').exists():
        print('skip (no refs)', slug); continue
    meta = json.loads((refs / slug / 'meta.json').read_text())
    rows = {}
    for v in SCORED:
        rp, mp = refs / slug / (v + '_clip.png'), ren / f'{slug}_{v}_mask.png'
        if not (rp.exists() and mp.exists()):
            continue
        R = refmask(rp); M = np.asarray(Image.open(mp).convert('L').resize(R.shape[::-1])) > 127
        u = (R | M).sum(); rows[v] = round(float((R & M).sum() / max(1, u)), 3)
        rgb = np.asarray(Image.open(refs / slug / (v + '.jpg')).convert('RGB').resize(R.shape[::-1])).copy()
        rgb[R & ~M] = [255, 70, 40]; rgb[M & ~R] = [40, 110, 255]; rgb[M & R] = (rgb[M & R] * .55 + np.array([50, 230, 90]) * .45).astype('uint8')
        Image.fromarray(rgb).save(ren / f'{slug}_{v}_iou.jpg', quality=88)
    base = [rows[v] for v in ['n', 'e', 's', 'w', 'top'] if v in rows]
    res = {'views': rows, 'mean_nesw_top': round(sum(base) / len(base), 3) if base else None,
           'mean_all': round(sum(rows.values()) / len(rows), 3) if rows else None,
           'height_m': meta['height']['value_m'], 'method': 'footprint(+3 m)-clipped Google-tile silhouette (column-filled) vs isolated landmark silhouette, matched Cesium camera'}
    agg[slug] = res
    # compare: reference | model day | model night, for S and close_sw, plus IoU overlay row
    W, H = 800, 500
    pick = [v for v in ['s', 'close_sw'] if (ren / f'{slug}_{v}_day.jpg').exists()]
    sheet = Image.new('RGB', (3 * W, len(pick) * (H + 34) + H + 34), '#182020'); d = ImageDraw.Draw(sheet)
    for i, v in enumerate(pick):
        for c, (lab, p) in enumerate([('REFERENCE (Google 3D Tiles, local only)', refs / slug / (v + '.jpg')), ('MODEL day', ren / f'{slug}_{v}_day.jpg'), ('MODEL night', ren / f'{slug}_{v}_night.jpg')]):
            if p.exists(): sheet.paste(Image.open(p).convert('RGB').resize((W, H)), (c * W, i * (H + 34) + 34))
            d.text((c * W + 10, i * (H + 34) + 8), f'{slug} / {v} - {lab}' + (f'  IoU {rows.get(v)}' if c == 1 and v in rows else ''), fill='white', font=font)
    y = len(pick) * (H + 34)
    for c, v in enumerate(['n', 'e', 'top']):
        p = ren / f'{slug}_{v}_iou.jpg'
        if p.exists(): sheet.paste(Image.open(p).resize((W, H)), (c * W, y + 34))
        d.text((c * W + 10, y + 8), f'{v} IoU {rows.get(v)} (red=ref only, blue=model only, green=both)', fill='white', font=font)
    sheet.save(out / f'{slug}_compare.jpg', quality=88)
    print(slug, json.dumps(res))
agg_p.write_text(json.dumps(agg, indent=1))
