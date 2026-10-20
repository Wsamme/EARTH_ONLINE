/* ---------- v17 statistics panels for the real island ---------- */
function sgrRoadKm(){
  if (SGR.roadKm) return SGR.roadKm;
  const km = {hw:0, art:0, loc:0, svc:0, path:0, rw:0};
  for (const l of SGR.lines){
    if (l.flags & 8) continue; const P = l.P; let L = 0; for (let i = 2; i < P.length; i += 2) L += Math.hypot(P[i] - P[i-2], P[i+1] - P[i-1]);
    if (l.flags & 1) L /= 2;      // dual carriageways are drawn as two one-way lines: count the road once
    const c = l.c; if (c === 0) km.hw += L; else if (c === 1) km.art += L*0.5; else if (c <= 9) km.art += L; else if (c === 10) km.loc += L; else if (c === 11) km.svc += L; else if (c === 12) km.path += L; else if (c === 13) km.rw += L;
  }
  for (const k in km) km[k] /= 1000; SGR.roadKm = km; return km;
}
function sgrRenderStats(){
  const t = totals(), S = SGR.stats, km = sgrRoadKm();
  const pop = S.pop + t.floor[1]/40, jobs = S.jobs + jobsOf(t.floor);
  let zoned = 0; for (let k = 0; k < N*N; k++) if (zones[k]) zoned++;
  const mrtKm = net.mrt ? net.mrt.reduce((s, R) => s + R.L, 0)/1000 : 0, nSt = net.stations.filter(s => s.mrt).length;
  const rows = [
    ['人口（估算）', 'Pop. (est.)', fmtPop(pop), 'pop'],
    ['就业岗位（估算）', 'Jobs (est.)', fmtPop(jobs)],
    ['建筑', 'Buildings', (S.n + t.nBld).toLocaleString()],
    ['组屋', 'HDB blocks', S.hdb.toLocaleString()],
    ['百米以上高楼', 'Towers ≥ 100 m', String(S.tall)],
    ['总楼面面积', 'Floor area', `${((S.gfa + t.floor.reduce((a, b) => a + b, 0))/1e6).toFixed(0)} km²`],
    ['行政区', 'Planning areas', String(SGD.pas.length)],
    ['快速公路', 'Expressways', `${km.hw.toFixed(0)} km`],
    ['道路', 'Roads', `${(km.hw + km.art + km.loc).toFixed(0)} km`],
    ['小区与支路', 'Service roads', `${km.svc.toFixed(0)} km`],
    ['步道', 'Paths', `${km.path.toFixed(0)} km`],
    ['地铁 / 轻轨', 'MRT / LRT', `${nSt} 站 · ${mrtKm.toFixed(0)} km`],
    ['机场跑道', 'Runways', `${(SGR.base.runways || []).length} 条`],
    ['重新规划', 'Repainted', zoned ? `${(zoned*CELL*CELL/1e6).toFixed(2)} km²` : '—'],
    ['平均通勤', 'Commute', tRes ? `${tRes.avgMin.toFixed(1)} min${trafficStale ? '*' : ''}` : '—']
  ];
  $('#statList').innerHTML = rows.map(r => `<dt>${r[0]}<small>${r[1]}</small></dt><dd${r[3] ? ` class="${r[3]}"` : ''}>${r[2]}</dd>`).join('');
}
function sgrRenderIslandStats(){
  const S = SGR.stats;
  const rows = [['陆地面积', 'Land', `${world.landKm2.toFixed(0)} km²`], ['最高峰', 'Peak', `${world.peak.name[0]} ${Math.round(world.peak.h)} m`],
    ['森林覆盖', 'Forest', `${Math.round(world.forestPct*100)}%`], ['离岛', 'Islands', '圣淘沙 · 乌敏 · 德光'],
    ['建筑', 'Buildings', S ? `${S.n.toLocaleString()} 栋` : '…'], ['地图', 'Map', '1:1 · 56 × 56 km'], ['数据', 'Data', 'OpenStreetMap · Overture · HDB3D']];
  $('#islandStats').innerHTML = rows.map(r => `<dt>${r[0]}<small>${r[1]}</small></dt><dd>${r[2]}</dd>`).join('');
}
