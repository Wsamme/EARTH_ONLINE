# Decode the staged Greater Bay app data (site/gbadata: base64 of gzip) into a compact pickle for the Shenzhen refs:
# buildings (rings in world metres, h, base, type, flags), road lines (class, flags, name, points, deck heights), terrain grid.
# Same decoding as sgreal/mod_bld/bld.js (SGB2) and sgreal/mod_roads/roads.js (SGR1). Read only.
# usage: bash SC/lm33/kit/heavy.sh python3 stage.py [gbadata dir]  -> stage.pkl (~Shenzhen + 3 km)
import sys, base64, gzip, json, pickle, struct, numpy as np
D = (sys.argv[1] if len(sys.argv) > 1 else '/home/claude/earth_online/site/gbadata') + '/'
def rd(n): return gzip.decompress(base64.b64decode(open(D + n).read().strip()))
B = json.loads(rd('gba_base.txt'))
HALF, TS, TN = B['HALF'], B['TS'], B['TN']
hb = base64.b64decode(B['H']); H = np.frombuffer(hb, dtype='<i2').astype(np.float32)/10; H = H.reshape(TN, TN)
X0, X1, Y0, Y1 = -63000, 63000, -63000, 63000   # whole square (Shenzhen spans most of it); filter later
def vu(u, o):
    v = 0; m = 1
    while True:
        b = u[o]; o += 1; v += (b & 127)*m; m *= 128
        if not b & 128: return v, o
def declist(u, o, ti, n, TILE, TXN, HALF0):
    ox = -HALF0 + (ti % TXN)*TILE; oy = -HALF0 + (ti//TXN)*TILE; out = []
    for k in range(n):
        f = u[o]; o += 1
        h, o = vu(u, o); base, o = vu(u, o); o += 3
        rs = u[o]; o += 1
        if rs == 255: o += 3
        seed = u[o]; o += 1
        nr, o = vu(u, o); rings = []; px = py = 0
        for r in range(nr):
            m, o = vu(u, o); R = []
            for i in range(m):
                a, o = vu(u, o); px += -(a + 1)//2 if a % 2 else a//2
                a, o = vu(u, o); py += -(a + 1)//2 if a % 2 else a//2
                R.append((ox + px/4, oy + py/4))
            if m >= 3: rings.append(R)
        out.append({'t':f & 31, 'foreign':bool(f & 32), 'part':bool(f & 64), 'big':bool(f & 128), 'h':h/10, 'base':base/10, 'seed':seed, 'rings':rings})
    return out, o
u = rd('gba_bld0.txt'); o = 4
TILE, o = vu(u, o); TXN, o = vu(u, o); HALF0 = TILE*TXN/2
nParts, o = vu(u, o); nT, o = vu(u, o); idx = []
for t in range(nT):
    ti, o = vu(u, o); nB, o = vu(u, o); lenB, o = vu(u, o); nS, o = vu(u, o); part, o = vu(u, o); offS, o = vu(u, o); lenS, o = vu(u, o)
    idx.append([ti, nB, lenB, nS, part, offS, lenS])
offB = o
for e in idx: e.append(offB); offB += e[2]
parts = {k: rd('gba_bld%d.txt' % k) for k in range(1, nParts + 1)}
bld = []
for ti, nB, lenB, nS, part, offS, lenS, ob in idx:
    if nB: L, _ = declist(u, ob, ti, nB, TILE, TXN, HALF0); bld += L
    if nS and part in parts: L, _ = declist(parts[part], offS, ti, nS, TILE, TXN, HALF0); bld += L
print('buildings', len(bld), flush=True)
names, refs = B['names'], B['refs']
lines = []
for C in B['roadChunks']:
    u = rd('gba_rc%d.txt' % C['k']); assert u[:4] == b'SGR1'; o = 4
    n, o = vu(u, o); px = py = 0
    for i in range(n):
        c = u[o]; f = u[o + 1]; o += 2
        ni, o = vu(u, o); ri, o = vu(u, o); npt, o = vu(u, o); P = []
        for k in range(npt):
            a, o = vu(u, o); b, o = vu(u, o)
            px += -(a + 1)//2 if a % 2 else a//2; py += -(b + 1)//2 if b % 2 else b//2
            P.append((px/4, py/4))
        E = None
        if f & 4:
            sc = 2.5 if f & 32 else 5; E = [x/sc for x in u[o:o + npt]]; o += npt
        nm = names[ni] if ni else None
        lines.append({'c':c, 'f':f, 'name':(nm[0] or nm[1]) if nm else None, 'zh':nm[1] if nm else None, 'P':P, 'E':E})
print('road lines', len(lines), flush=True)
pickle.dump({'frame':{k:B[k] for k in ('lon0', 'lat0', 'MX', 'MY', 'HALF', 'TS', 'TN', 'TILE')}, 'H':H, 'bld':bld, 'lines':lines}, open('/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/lm50/sz/stage.pkl', 'wb'), protocol=4)
print('ok')
