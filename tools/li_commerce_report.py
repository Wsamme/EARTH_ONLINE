"""Summarise locally rendered commerce comparisons, matching Street View filenames."""
import json, sys
from pathlib import Path
root = Path('/workspace/eo_li_out')
out = root / 'commerce'
before = json.loads((out / 'li_iou_r2_final.json').read_text())
after = json.loads((out / 'li_iou.json').read_text())
sv_before = json.loads((root / 'li_sv_iou_before.json').read_text())
round_name = sys.argv[1] if len(sys.argv) > 1 else 's2'
sv_after = json.loads((out / f'li_sv_iou_{round_name}.json').read_text())
report = {}
for slug in sorted(set(before) | set(after) | set(sv_after)):
    row = {}
    if slug in before and slug in after:
        row['tile_before'] = before[slug]['mean_nesw_top']
        row['tile_after'] = after[slug]['mean_nesw_top']
        row['tile_views'] = after[slug]['views']
        if row['tile_after'] < row['tile_before'] - .01:
            raise SystemExit('tile regression exceeds .01: ' + slug)
    if slug in sv_before and slug in sv_after:
        old = {p['file']: p for p in sv_before[slug]['views']}
        matched = [(old[p['file']]['skyline_iou'], p['skyline_iou']) for p in sv_after[slug]['views'] if p['file'] in old and old[p['file']]['skyline_iou'] is not None and p['skyline_iou'] is not None]
        if matched:
            row['skyline_before'] = round(sum(v[0] for v in matched) / len(matched), 3)
            row['skyline_after'] = round(sum(v[1] for v in matched) / len(matched), 3)
            row['matched_panos'] = len(matched)
    report[slug] = row
print(json.dumps(report, indent=2))
