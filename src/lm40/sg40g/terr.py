import pickle,numpy as np,json,sys
SC='/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad'
H=pickle.load(open(SC+'/sgreal/out/terrain.pkl','rb'))['H']; TN=801; TS=56000/800
def hAt(x,y):
  fx=min(TN-1.0001,max(0,(x+28000)/TS)); fy=min(TN-1.0001,max(0,(y+28000)/TS))
  i=int(fx); j=int(fy); u=fx-i; v=fy-j
  a=H[j,i]; b=H[j,i+1]; c=H[j+1,i]; d=H[j+1,i+1]
  return (a*(1-u)+b*u)*(1-v)+(c*(1-u)+d*u)*v
def xy(lat,lon): return ((lon-103.845)*111290.5,(lat-1.315)*110574)
def gl(lat,lon,lx,lz):
  x,y=xy(lat,lon); return hAt(x+lx,y-lz)
if __name__=='__main__':
  lat,lon=float(sys.argv[1]),float(sys.argv[2])
  pts=json.loads(sys.argv[3])
  print([round(float(gl(lat,lon,p[0],p[1])),1) for p in pts])
_sea=None; _sg=None
def masks():
  global _sea,_sg
  if _sea is None:
    _sea=np.load(SC+'/sgreal/out/sea10.npy',mmap_mode='r'); _sg=np.load(SC+'/sgreal/out/sg10.npy',mmap_mode='r')
  return _sea,_sg
def seaAt(lat,lon,lx,lz):
  s,g=masks(); x,y=xy(lat,lon); x+=lx; y-=lz
  i=int((x+28000)/10); j=int((y+28000)/10); return int(s[j,i]), int(g[j,i])
def hC(x,y): return max(-0.3,hAt(x,y))
def lmbase(lat,lon,r):
  x0,y0=xy(lat,lon); hi=-1e9
  for a in range(12):
    for f in (0,0.35,0.7):
      th=a/12*2*math.pi; hi=max(hi,hC(x0+math.cos(th)*r*f,y0+math.sin(th)*r*f))
  return hi+0.6
import math
