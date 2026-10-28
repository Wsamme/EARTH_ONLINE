import pickle,sys
SC='/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad'
N=pickle.load(open(SC+'/gbareal/out/raw_nodes.pkl','rb'))
print(type(N),len(N)); print(repr(N[0])[:200] if isinstance(N,list) else list(N.items())[:1])
Q=[(23.04536,113.737963,400,'keyuan'),(23.044825,113.745342,200,'yingen'),(23.019106,113.769808,1500,'qifeng'),(23.012036,113.746105,300,'museum'),(23.0234,113.7466,300,'cityhall'),(23.0199,113.7456,600,'square')]
for la,lo,R,nm in Q:
  print('==',nm)
  for rec in N:
    try:
      t=rec[0]; lon,lat=rec[1]
    except Exception: continue
    x=(lon-lo)*103014.2; z=-(lat-la)*110734.9
    if abs(x)<R and abs(z)<R and isinstance(t,dict) and ('name' in t or 'historic' in t or 'tourism' in t or 'man_made' in t): print(' ',round(x),round(z),t)
