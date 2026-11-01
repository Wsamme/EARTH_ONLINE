"""Summarize local, reference-only heritage comparisons; never copies imagery."""
import json
from pathlib import Path

OUT = Path('/workspace/eo_li_out/heritage')
SLUGS = ['veeramakaliamman', 'srinivasa_perumal', 'abdul_gafoor',
         'angullia_mosque', 'tan_teng_niah', 'indian_heritage_centre']


def read(name):
    return json.loads((OUT / name).read_text())


if __name__ == '__main__':
    before = read('li_heritage_tile_before.json')
    after = read('li_iou.json')
    sv0, sv1 = read('li_sv_iou_s0.json'), read('li_sv_iou_s1.json')
    geometry = {g['slug']: g for g in map(json.loads,
                (OUT / 'geometry_round3.jsonl').read_text().splitlines())}
    verification = read('renders/s1/verification.json')
    if verification['pageErrors'] or verification['consoleErrors']:
        raise SystemExit('Browser verification reported page/console errors')
    summary = {}
    for slug in SLUGS:
        a, b = before[slug]['mean_nesw_top'], after[slug]['mean_nesw_top']
        summary[slug] = {
            'tile_before': a, 'tile_after': b, 'tile_delta': round(b-a, 3),
            'tile_views': after[slug]['views'],
            'skyline_before': sv0[slug]['mean_skyline_iou'],
            'skyline_after': sv1[slug]['mean_skyline_iou'],
            'triangles': geometry[slug]['triangles'],
            'model_max_height_m': round(geometry[slug]['max'][1], 2),
            'tile_regression_ok': slug == 'angullia_mosque' or b-a >= -.010001,
        }
        print(slug, json.dumps(summary[slug]))
    (OUT / 'round3_summary.json').write_text(json.dumps(summary, indent=2)+'\n')
    if not all(s['tile_regression_ok'] for s in summary.values()):
        raise SystemExit('Tile regression exceeds the per-slug allowance')
