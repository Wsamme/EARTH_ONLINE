import json, numpy as np
from terr import *
SC='/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad'
fw=np.load(SC+'/sgreal/out/fw10.npy',mmap_mode='r'); sea=np.load(SC+'/sgreal/out/sea10.npy',mmap_mode='r')
S=json.load(open('sites.json'))
CELL=8
out=[]; tgrid={}
for k,s in S.items():
  la,lo=s['anchor']['lat'],s['anchor']['lon']; x0,y0=xy(la,lo)
  b=s['bbox']; bx0=int(np.floor(b[0]/CELL))*CELL; bz0=int(np.floor(b[1]/CELL))*CELL; nx=int(np.ceil((b[2]-bx0)/CELL))+1; nz=int(np.ceil((b[3]-bz0)/CELL))+1
  rows=[]
  wcount=0
  for j in range(nz):
    z=bz0+j*CELL+CELL/2; row=''
    for i in range(nx):
      x=bx0+i*CELL+CELL/2; wx=x0+x; wy=y0-z; ii=int((wx+28000)/10); jj=int((wy+28000)/10)
      w=bool(fw[jj,ii] or sea[jj,ii]); row+='1' if w else '0'; wcount+=w
    rows.append(row)
  # RLE: alternating run lengths starting with '0'
  flat=''.join(rows); runs=[]; cur='0'; n=0
  for ch in flat:
    if ch==cur: n+=1
    else: runs.append(n); cur=ch; n=1
  runs.append(n)
  f1=lambda a: [round(v,1) for v in a]
  bl=[[b['n'], b['t'], round(b['h'],1), 1 if b['e'] else 0, b['o'], f1(b['ob']), [v for p in b['r'] for v in p]] for b in s['bld']]
  out.append('  %s:{lat:%s, lon:%s, keep:%s, wm:{x0:%d, z0:%d, nx:%d, nz:%d, c:%d, rle:%s},\n    bld:%s,\n    paths:%s,\n    pois:%s}'%(k, la, lo, json.dumps(s['keep'],separators=(',',':')), bx0,bz0,nx,nz,CELL, json.dumps(runs,separators=(',',':')), json.dumps(bl,separators=(',',':'),ensure_ascii=False), json.dumps(s['paths'],separators=(',',':')), json.dumps(s['pois'],separators=(',',':'),ensure_ascii=False)))
  print(k,'water cells',wcount,'of',nx*nz)
  # test terrain grid (10 m) for the offline harness
  g=[]
  for j in range(nz):
    z=bz0+j*CELL+CELL/2
    g.append([round(float(hC(x0+bx0+i*CELL+CELL/2, y0-z)),2) for i in range(nx)])
  tgrid[k]=dict(x0=bx0+CELL/2,z0=bz0+CELL/2,c=CELL,nx=nx,nz=nz,h=g)
open('sitedata.js','w').write('const SGD40 = {\n'+',\n'.join(out)+'\n};\n')
json.dump(tgrid,open('test_terrain.json','w'))
