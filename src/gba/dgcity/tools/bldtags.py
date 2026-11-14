import pickle,sys,shapely.wkb
SC='/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad'
W=set(sys.argv[1:])
for rec in pickle.load(open(SC+'/gbareal/out/raw_bld.pkl','rb')):
  oid,fw,t=rec[:3]; k=('w' if fw else 'r')+str(oid)
  if k in W: print(k,t)
