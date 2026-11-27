import json, subprocess, time
OV = 'https://maps.mail.ru/osm/tools/overpass/api/interpreter'
def ov(q, tries=8):
    for k in range(tries):
        r = subprocess.run(['curl', '-s', '--max-time', '300', OV, '--data-urlencode', 'data=' + q], capture_output=True, text=True)
        try: return json.loads(r.stdout)['elements']
        except Exception: time.sleep(8*(k + 1))
    raise SystemExit('overpass failed: ' + q[:120])
