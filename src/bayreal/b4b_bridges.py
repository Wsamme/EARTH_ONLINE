# stage 4b: real deck profiles for the bay bridges whose OSM ways carry the freeway's name (Bay Bridge = "Dwight D. Eisenhower
# Highway") or whose high-rise section is a hump in a long low trestle (San Mateo–Hayward, Dumbarton). Edits roads.pkl in place.
import sys; sys.path.insert(0, '.')
from common import *
from shapely.geometry import box, LineString, Point
R = load('roads.pkl'); lines = R['lines']; elev = R['elev']
TH = load('terrain.pkl')['H']
def hC(x, y):
    fx = min(TN - 1.0001, max(0, (x + HALF)/TS)); fy = min(TN - 1.0001, max(0, (y + HALF)/TS)); i, j = int(fx), int(fy); u, v = fx - i, fy - j
    h = (TH[j, i]*(1 - u) + TH[j, i + 1]*u)*(1 - v) + (TH[j + 1, i]*(1 - u) + TH[j + 1, i + 1]*u)*v
    return max(-0.3, float(h))
def dens(l, step=25):
    cs = list(l['g'].coords); P = [cs[0]]
    for a, b in zip(cs, cs[1:]):
        d = math.hypot(b[0] - a[0], b[1] - a[1]); n = max(1, int(math.ceil(d/step)))
        for k in range(1, n + 1): P.append((a[0] + (b[0] - a[0])*k/n, a[1] + (b[1] - a[1])*k/n))
    S = [0.0]
    for a, b in zip(P, P[1:]): S.append(S[-1] + math.hypot(b[0] - a[0], b[1] - a[1]))
    return P, S
YBI = w(-122.3655, 37.8105)
def ramped(i, cap, rp_a, rp_b):
    """deck at cap, ramps of grade rp_a from the start and rp_b from the end (from the ground + 0.6)"""
    l = lines[i]; P, S = dens(l); Lt = S[-1]; g = [hC(*p) for p in P]; g0, g1 = g[0] + 0.6, g[-1] + 0.6
    E = [round(max(0.0, min(cap, g0 + s*rp_a, g1 + (Lt - s)*rp_b) - gg), 2) for s, gg in zip(S, g)]
    l['g'] = LineString(P); elev[i] = E
def hump(i, base, peak, centre_ll, half):
    """a low trestle at 'base' m above the water with a raised-cosine high-rise section around centre_ll"""
    l = lines[i]; P, S = dens(l); g = [hC(*p) for p in P]; c = w(*centre_ll[::-1])
    k0 = min(range(len(P)), key=lambda k: math.hypot(P[k][0] - c[0], P[k][1] - c[1])); s0 = S[k0]; Lt = S[-1]
    E = []
    for s, gg in zip(S, g):
        d = abs(s - s0); top = base + (peak - base)*(0.5 + 0.5*math.cos(math.pi*d/half)) if d < half else base
        top = min(top, gg + 0.6 + s*0.05, gg + 0.6 + (Lt - s)*0.05) if gg > 0.5 else top          # ends land on the shore
        E.append(round(max(0.0, top - max(gg, -0.3)), 2))
    l['g'] = LineString(P); elev[i] = E
n = 0
WB = box(*w(-122.396, 37.783), *w(-122.364, 37.812)); EB = box(*w(-122.364, 37.806), *w(-122.300, 37.830))
for i, l in enumerate(lines):
    if not l['br'] or l['c'] > 12: continue
    g = l['g']; nm = l['name'] or ''; L = g.length
    if L > 2500 and g.intersects(WB) and l['c'] <= 1 and 'Eisenhower' in nm and g.centroid.x < YBI[0]:
        # western span: lower deck eastbound (layer 1), upper deck westbound (layer 2); 67 m clearance at mid-span
        ramped(i, 68.0 if l['layer'] <= 1 else 77.0, 0.10, 0.10); n += 1
    elif L > 2500 and g.intersects(EB) and g.centroid.x > YBI[0] and ('Eisenhower' in nm or 'Bay Bridge' in nm):
        # eastern span: the self-anchored suspension span next to Yerba Buena Island (58 m), the skyway down to Oakland
        c0 = g.coords[0]; near0 = math.hypot(c0[0] - YBI[0], c0[1] - YBI[1]) < math.hypot(g.coords[-1][0] - YBI[0], g.coords[-1][1] - YBI[1])
        ramped(i, 58.0 if l['c'] <= 1 else 57.4, 0.10 if near0 else 0.018, 0.018 if near0 else 0.10); n += 1
    elif 'San Mateo' in nm and 'Bridge' in nm and L > 3000:
        hump(i, 9.0, 42.0, (37.5868, -122.2425), 1500.0); n += 1
    elif 'Dumbarton' in nm and 'Bridge' in nm and L > 1500:
        hump(i, 9.0, 27.0, (37.5060, -122.1170), 650.0); n += 1
print('bridge decks set', n)
save({'lines':lines, 'elev':elev}, 'roads.pkl')
