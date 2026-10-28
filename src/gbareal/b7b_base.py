# re-write only the labels / rail / districts parts of gba_base.json.gz from misc.pkl (after a b6 re-run that kept the same
# districts; the statistics and rasters stay as b7 made them)
import sys, gzip; sys.path.insert(0, '.')
from common import *
M = load('misc.pkl'); p = OUT + 'gba_base.json.gz'
B = json.loads(gzip.decompress(open(p, 'rb').read()))
assert len(B['PAS']) == len(M['PAS']), 'districts changed: run b7_encode.py'
for k in ('PAS', 'REGS', 'places', 'pois', 'waters', 'mrt', 'stations', 'f1', 'runways', 'stands', 'palines', 'ropes'): B[k] = M[k]
open(p, 'wb').write(gzip.compress(json.dumps(B, separators=(',', ':'), ensure_ascii=False).encode(), 9)); print('base updated', len(B['stations']), 'stations')
