# test-only: inject a camera / state hook into the scratch test page (never into the module)
import sys
p=sys.argv[1]; s=open(p,encoding='utf-8').read()
h="let sgSites = [];"
assert s.count(h)==1
hook=h+"\nwindow.__dgT = {look(lat, lon, d, el, az, hr){ const q = sgXY(lat, lon), y = Math.max(0, hC(q[0], q[1])), e = el*Math.PI/180, a = az*Math.PI/180; setTod(hr); camera.position.set(q[0] + Math.sin(a)*Math.cos(e)*d, y + Math.sin(e)*d, -q[1] + Math.cos(a)*Math.cos(e)*d); controls.target.set(q[0], y, -q[1]); controls.update(); lodTick(); return Math.round(y); }, tick(){ lodTick(); }, info(){ return [sgSites.filter(s => s.key.startsWith('dg')).map(s => s.key + ':' + Math.round(s.top)), landmarks.filter(l => l.type.startsWith('dg')).map(l => l.type)]; }};"
open(p,'w',encoding='utf-8').write(s.replace(h,hook))
print('hooked')
