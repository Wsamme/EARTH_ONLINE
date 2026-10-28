# OSM ways (raw_ways) in the OCT box that are not ordinary roads -> tools/ways.json (for Splendid China / Happy Valley features)
import pickle, json
OUT='/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/gbareal/out/'
B=(113.955,22.518,114.000,22.550); res=[]
for wid,t,pts in pickle.load(open(OUT+'raw_ways.pkl','rb')):
    if not pts: continue
    lon,lat=pts[len(pts)//2]
    if not (B[0]<=lon<=B[2] and B[1]<=lat<=B[3]): continue
    hw=t.get('highway')
    if hw and not t.get('name') and set(t)<= {'highway','surface','footway','service','lit','oneway','access','layer','bridge','tunnel','incline','foot','bicycle','width','lanes','maxspeed','sidewalk','smoothness','motor_vehicle','covered','steps','step_count','handrail','ramp','segregated','crossing','area','level'}: continue
    res.append({'id':wid,'t':t,'pts':[[round(a,6),round(b,6)] for a,b in pts]})
json.dump(res,open('/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/gba/szoct/tools/ways.json','w'),ensure_ascii=False)
print(len(res))
