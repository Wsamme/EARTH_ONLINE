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
    sv1.update(read('li_sv_iou_s2.json'))  # Final Abdul recess / Tan bay-paint pass
    geometry = {g['slug']: g for g in map(json.loads,
                (OUT / 'geometry_round3.jsonl').read_text().splitlines())}
    verification = read('renders/s1/verification.json')
    if verification['pageErrors'] or verification['consoleErrors']:
        raise SystemExit('Browser verification reported page/console errors')
    if not all(v['landmark_found'] for v in verification['views']):
        raise SystemExit('A landmark was missing from a browser capture')
    final_tile_check = read('renders/s2/verification.json')
    if final_tile_check['pageErrors'] or final_tile_check['consoleErrors']:
        raise SystemExit('Final tile comparison reported errors')
    for round_name in ['s1', 's2']:
        street_log = (OUT / f'{round_name}.log').read_text().splitlines()
        street_check = json.loads(next(line for line in reversed(street_log)
                                       if line.startswith('{"pageErrors":')))
        if street_check['pageErrors'] or street_check['consoleErrors']:
            raise SystemExit(f'Street comparison {round_name} reported errors')
    summary = {}
    for slug in SLUGS:
        if len(after[slug]['views']) != 8 or not sv1[slug]['views']:
            raise SystemExit(f'Incomplete comparison for {slug}')
        a, b = before[slug]['mean_nesw_top'], after[slug]['mean_nesw_top']
        summary[slug] = {
            'tile_before': a, 'tile_after': b, 'tile_delta': round(b-a, 3),
            'tile_mean_all_before': before[slug]['mean_all'],
            'tile_mean_all_after': after[slug]['mean_all'],
            'tile_views': after[slug]['views'],
            'skyline_before': sv0[slug]['mean_skyline_iou'],
            'skyline_after': sv1[slug]['mean_skyline_iou'],
            'skyline_metric_verified': False,
            'skyline_caveat': 'Shared all-mask pass retains a sky gradient; scores are nominal.',
            'triangles': geometry[slug]['triangles'],
            'model_max_height_m': round(geometry[slug]['max'][1], 2),
            'runtime_height_metadata_m': verification['models'][slug]['height'],
            'final_round': 's2' if slug in ['abdul_gafoor', 'tan_teng_niah'] else 's1',
            'tile_guard_exempt': slug == 'angullia_mosque',
            'tile_regression_ok': slug == 'angullia_mosque' or b-a >= -.010001,
        }
        print(slug, json.dumps(summary[slug]))
    (OUT / 'round3_summary.json').write_text(json.dumps(summary, indent=2)+'\n')
    if not all(s['tile_regression_ok'] for s in summary.values()):
        raise SystemExit('Tile regression exceeds the per-slug allowance')
