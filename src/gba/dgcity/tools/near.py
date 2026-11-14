import json,sys
A=json.load(open('/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/gba/dgcity/tools/areas.json'))
la,lo,R=float(sys.argv[1]),float(sys.argv[2]),float(sys.argv[3])
def ext(r):
  o=[]
  for p in r:
    if p is None: break
    o.append(p)
  return o
for a in A:
  r=ext(a['r'][0]); xs=[(p[0]-lo)*103014.2 for p in r]; zs=[-(p[1]-la)*110734.9 for p in r]
  if min(xs)<R and max(xs)>-R and min(zs)<R and max(zs)>-R and (max(xs)-min(xs))<4*R: print(a['id'],a['t'],round(min(xs)),round(max(xs)),round(min(zs)),round(max(zs)),len(r))
