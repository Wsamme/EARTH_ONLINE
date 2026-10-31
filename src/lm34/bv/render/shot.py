#!/usr/bin/env python3
# 用和参考图相同的相机，把每栋楼渲出来，再和参考图拼成左右对比。
# 用法：python3 shot.py [slug ...]     不写 slug 就是全部九栋，外加几张日景/夜景全貌。
import json, os, sys, time, subprocess, shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]          # src/lm34/bv
REFS = Path('/tmp/bv_refs/bv_refs')
OUT = Path(os.environ.get('BV_OUT', '/tmp/bv_shots'))
HARNESS = Path(__file__).resolve().parent / 'harness.html'
PORT = 8765
VIEWS = ['n', 'e', 's', 'w', 'top']
SLUGS = ['star_vista', 'metropolis', 'buona_vista_mrt', 'biopolis', 'fusionopolis_one', 'solaris', 'galaxis', 'mediacorp', 'rochester']

def chrome(url, dest, w=1600, h=1000):
    # 截图写完之后 Chrome 经常不自己退出，所以到点就收，只要文件在就算成功。
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists(): dest.unlink()
    cmd = [
        'google-chrome', '--headless=new', '--no-sandbox', '--disable-dev-shm-usage',
        '--enable-unsafe-swiftshader', '--hide-scrollbars', '--force-device-scale-factor=1',
        f'--user-data-dir=/tmp/chrome-bv-{os.getpid()}',
        f'--window-size={w},{h}', f'--screenshot={dest}', url,
    ]
    try:
        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=45)
    except subprocess.TimeoutExpired:
        subprocess.run(['pkill', '-f', 'chrome-bv'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    if not dest.exists() or dest.stat().st_size < 5000:
        raise RuntimeError('screenshot failed for ' + url)

def serve():
    # 已经在跑就复用
    import socket
    s = socket.socket(); s.settimeout(0.3)
    try:
        s.connect(('127.0.0.1', PORT)); s.close(); return None
    except OSError:
        pass
    proc = subprocess.Popen(['python3', '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'],
                            cwd=str(ROOT), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(0.4)
    return proc

def write_page(meta):
    html = HARNESS.read_text()
    blob = json.dumps(meta)
    html = html.replace('<script id="meta" type="application/json">{}</script>',
                        '<script id="meta" type="application/json">%s</script>' % blob, 1)
    path = Path(__file__).resolve().parent / '_shot.html'
    path.write_text(html)
    return path

def composite(ref, model, dest, caption):
    from PIL import Image, ImageDraw, ImageFont
    a = Image.open(ref).convert('RGB')
    b = Image.open(model).convert('RGB')
    if b.size != a.size:
        b = b.resize(a.size, Image.Resampling.LANCZOS)
    bar = 36
    canvas = Image.new('RGB', (a.width * 2, a.height + bar), (24, 26, 28))
    canvas.paste(a, (0, bar))
    canvas.paste(b, (a.width, bar))
    d = ImageDraw.Draw(canvas)
    d.text((12, 8), caption + '    ·    left reference    right model', fill=(230, 230, 230))
    dest.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(dest, quality=86)

def main():
    want = sys.argv[1:] or SLUGS
    OUT.mkdir(parents=True, exist_ok=True)
    proc = serve()
    try:
        base = f'http://127.0.0.1:{PORT}/render/_shot.html'
        for slug in want:
            meta = json.loads((REFS / slug / 'meta.json').read_text())
            write_page(meta)
            for view in VIEWS:
                shot = (meta.get('shots') or {}).get(view)
                model = OUT / 'model' / f'{slug}_{view}.png'
                print('render', slug, view, 'shot' if shot else 'synth', flush=True)
                chrome(f'{base}?b={slug}&v={view}', model)
                ref = REFS / slug / f'{view}.jpg'
                if ref.exists():
                    composite(ref, model, OUT / 'cmp' / f'{slug}_{view}.jpg', f'{slug}  {view}' + ('' if shot else '  (camera reconstructed)'))
        # 日景 / 夜景全貌
        write_page({})
        for hero, night in [('all', 0), ('all', 1), ('north', 0), ('north', 1), ('south', 0), ('south', 1)]:
            dest = OUT / 'hero' / f'{hero}_{"night" if night else "day"}.png'
            print('hero', hero, night, flush=True)
            chrome(f'{base}?hero={hero}&night={night}', dest)
    finally:
        if proc: proc.terminate()

if __name__ == '__main__':
    main()
