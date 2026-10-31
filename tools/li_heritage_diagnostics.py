"""Report raw-vs-column-filled mask differences without changing official IoU.
Usage: python3 tools/li_heritage_diagnostics.py <render-directory> <slug>...
References/results stay outside git; only image masks are read.
"""
import json
import sys
from pathlib import Path
import numpy as np
from PIL import Image

renders = Path(sys.argv[1])
report = {}
for slug in sys.argv[2:]:
    views = {}
    for view in ('n', 'e', 's', 'w', 'top', 'close_ne', 'close_sw', 'street'):
        rp = Path('/workspace/li_refs') / slug / f'{view}_clip.png'
        mp = renders / f'{slug}_{view}_mask.png'
        if not rp.exists() or not mp.exists():
            continue
        a = np.asarray(Image.open(rp).convert('RGB')).astype(int)
        raw = ~((a[..., 0] > 200) & (a[..., 1] < 70) & (a[..., 2] > 200))
        filled = raw.copy()
        for x in np.flatnonzero(raw.any(axis=0)):
            ys = np.flatnonzero(raw[:, x])
            filled[ys[0]:ys[-1]+1, x] = True
        model = np.asarray(Image.open(mp).convert('L')) > 127
        def iou(ref):
            return round(float((ref & model).sum() / max(1, (ref | model).sum())), 3)
        views[view] = {
            'official_filled_iou': iou(filled),
            'raw_unfilled_iou_diagnostic_only': iou(raw),
            'pixels_added_by_column_fill': int((filled & ~raw).sum()),
            'fraction_of_filled_reference_added': round(float((filled & ~raw).sum() / max(1, filled.sum())), 3),
        }
    report[slug] = views
out = renders / 'heritage_mask_diagnostics.json'
out.write_text(json.dumps(report, indent=2) + '\n')
print(out)
for slug, views in report.items():
    print(slug, 'top', views.get('top'))
