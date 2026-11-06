import json
d=json.load(open('../ref_sg40f.json'))['targets']
want={'sgjurongtownhall':['w96764520'],'sgfusionopolis':['w175841411'],'sgbiopolis':['w168243409','w168243403','w168243410','w168243411','w168243404','w168243405','w168243407'],
 'sgstarvista':['w104352121'],'sgmediacorp':['w352920078'],'sgppps':['w765761861'],'sgfordfactory':['w243443837'],'sgbtrailstn':['w241116507']}
out={}
for k,ids in want.items():
  t=d[k]; out[k]={'a':[t['anchor']['lat'],t['anchor']['lon']],'b':{}}
  for b in t['buildings']:
    if b.get('osm') in ids:
      e={'r':[[round(p[0],1),round(p[1],1)] for p in b['ring']]}
      if b.get('parts'): e['p']=[[p['base'],p['top'],[[round(q[0],1),round(q[1],1)] for q in p['ring']]] for p in b['parts']]
      out[k]['b'][b['osm']]=e
print(json.dumps(out,separators=(',',':')))
