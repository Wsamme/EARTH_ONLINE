# Turn the base64 gzip text files (<city>data/*.txt) into raw gzip (<city>data/*.bin).
# The page loads the .bin files. Run this from the repo root after a data rebuild.
# 把 base64 的 gzip 文本还原成原始 gzip。页面读的是 .bin。数据重新生成后，在仓库根目录运行。
import base64, pathlib, sys
root = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else 'site')
n = before = after = 0
for p in sorted(root.glob('*data/*.txt')):
    raw = p.read_bytes()
    data = base64.b64decode(raw.strip())
    if data[:2] != b'\x1f\x8b':
        raise SystemExit('not gzip: ' + str(p))
    p.with_suffix('.bin').write_bytes(data)
    before += len(raw); after += len(data); n += 1
print('%d files, text %.1f MB, gzip %.1f MB' % (n, before / 1e6, after / 1e6))
