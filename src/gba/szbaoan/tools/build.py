# assemble szbaoan.js from src/ (head comment, then one block with the parts in name order; @LKD@ -> tools/linkdata.js)
import glob, os
H = os.path.dirname(os.path.abspath(__file__)) + '/../'
parts = sorted(glob.glob(H + 'src/*.js'))
body = ''.join(open(p).read().rstrip() + '\n' for p in parts)
body = body.replace('@LKD@', open(H + 'tools/linkdata.js').read().strip())
import re
body = re.sub(r'@([A-Z0-9]+)@', lambda m: open(H + 'tools/' + m.group(1).lower() + '.txt').read().strip(), body)
open(H + 'szbaoan.js', 'w').write(open(H + 'src/00_head.txt').read() + '{\n' + body + '}\n')
print('szbaoan.js', len(body), 'bytes from', [os.path.basename(p) for p in parts])
