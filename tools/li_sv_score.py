"""Skyline IoU + side-by-side sheets for li_sv_compare (Street View images are local reference only)."""
import json, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage
sv, dest, out, rnd, *sets = sys.argv[1:]

def sky_mask(img):
    a = np.asarray(img.convert('RGB')).astype(np.float32) / 255
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mx, mn = a.max(-1), a.min(-1); sat = (mx - mn) / (mx + 1e-6)
    cand = ((b >= r) & (b > 0.45) & (sat < 0.6)) | ((mx > 0.82) & (sat < 0.14))
    cand[-48:] = False  # skip the bottom (car/road glare)
    cand = ndimage.binary_opening(cand, iterations=2)
    lab, n = ndimage.label(cand)
    top = set(np.unique(lab[:6])) - {0}
    return np.isin(lab, list(top)) if top else np.zeros_like(cand)

res = {}
for s_ in sets:
    man = json.load(open(os.path.join(sv, s_, 'manifest.json')))
    od = os.path.join(dest, s_.replace('/', '_'))
    rows, scores = [], []
    for m in man:
        b = m['file'][:-4]; p = lambda k: os.path.join(od, f'{b}_{k}')
        if not os.path.exists(p('day.jpg')): continue
        ref = Image.open(os.path.join(sv, s_, m['file'])).convert('RGB')
        dark = np.asarray(ref.convert('L'))[:200].mean() < 70
        iou = None
        if not dark:
            sky = sky_mask(ref); solid_ref = ~sky
            am = np.asarray(Image.open(p('all.png')).convert('RGB').resize(ref.size)).astype(int); solid_mod = ~((am[..., 0] > 200) & (am[..., 2] > 200) & (am[..., 1] < 60))
            rows_ = slice(0, int(ref.size[1] * 0.75))  # upper 3/4: buildings vs sky
            A, B = solid_ref[rows_], solid_mod[rows_]
            iou = float((A & B).sum() / max(1, (A | B).sum()))
        scores.append({'file': m['file'], 'heading': m['heading'], 'date': m['date'], 'skyline_iou': iou, 'night_ref': bool(dark)})
        day = Image.open(p('day.jpg')).convert('RGB'); night = Image.open(p('night.jpg')).convert('RGB')
        if os.path.exists(p('lm.png')):  # outline target landmark on the reference
            e = Image.open(p('lm.png')).convert('L').resize(ref.size).filter(ImageFilter.FIND_EDGES).point(lambda v: 255 if v > 40 else 0).filter(ImageFilter.MaxFilter(3))
            ref2 = ref.copy(); ref2.paste((255, 230, 0), mask=e)
        else: ref2 = ref
        rows.append((ref2, day, night, f"{m['file']} {m['date']} h{m['heading']:.0f} p{m['pitch']:.0f} f{m['fov']}" + (f" skyIoU {iou:.2f}" if iou is not None else " (night ref)")))
    v = [x['skyline_iou'] for x in scores if x['skyline_iou'] is not None]
    res[s_] = {'mean_skyline_iou': round(float(np.mean(v)), 3) if v else None, 'n': len(v), 'views': scores}
    if rows:
        S = 320; sh = Image.new('RGB', (3 * S, len(rows) * (S + 18)), (20, 20, 20)); d = ImageDraw.Draw(sh)
        for i, (a, b2, c, lab) in enumerate(rows):
            for j, im in enumerate((a, b2, c)): sh.paste(im.resize((S, S)), (j * S, i * (S + 18) + 18))
            d.text((4, i * (S + 18) + 3), lab + '   | Street View (ref, landmark outline) | model day | model night', fill=(255, 255, 0))
        sh.save(os.path.join(out, 'sv', rnd, f"{s_.replace('/', '_')}_sv_compare.jpg"), quality=82)
    print(rnd, s_, 'skyline IoU', res[s_]['mean_skyline_iou'], 'n', res[s_]['n'])
fp = os.path.join(out, f'li_sv_iou_{rnd}.json'); old = json.load(open(fp)) if os.path.exists(fp) else {}
old.update(res); json.dump(old, open(fp, 'w'), indent=1)
