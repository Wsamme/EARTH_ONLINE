/* ---------- gba: the roads in chunks of 4 x 4 tiles (8 km, base.roadChunks, gba_rc<k>.txt) loaded around the camera ----------
   The roads module prepares one lines array (junctions, road grids): when chunks come into range (camera within 22 km, 3D as the
   tile levels; all within 28 km are fetched together) or leave it (beyond 42 km, dropped in batches of 6 or with the next load),
   SGR.lines is rebuilt from the loaded chunks, re-prepared, and the built tiles get their roads again. The roads are drawn only
   up to the far level (19 km), so nothing visible is missing. While driving / flying (line indices in use) the swap waits. */
const SGR_RC_NEED = 22000, SGR_RC_PRE = 28000, SGR_RC_DROP = 42000;
function sgrRcDist(C, x, y, h){ const b = C.bb, dx = Math.max(0, b[0] - x, x - b[2]), dy = Math.max(0, b[1] - y, y - b[3]); return Math.hypot(dx, dy, Math.max(0, (h || 0) - 20)*0.9); }
async function sgrRcFetch(list){
  const bufs = await Promise.all(list.map(C => sgrFetch('gba_rc' + C.k + '.txt')));
  list.forEach((C, i) => SGR.rc.set(C.k, SGRoads.decode(bufs[i], SGR.base.names, SGR.base.refs)));
}
function sgrRcJoin(){ const L = []; for (const k of [...SGR.rc.keys()].sort((a, b) => a - b)) for (const l of SGR.rc.get(k)) L.push(l); return L; }
function sgrRcHold(){ try { return !!((window.SGFly && SGFly.on) || (window.SGF1 && SGF1.F1 && SGF1.F1.on)); } catch (e){ return false; } }
function sgrRcTick(){
  if (!SGR.rc || SGR.rcBusy || !SGR.base || !SGR.base.roadChunks || !SGR.tiles.size) return;
  const c = camera.position, d = C => sgrRcDist(C, c.x, -c.z, c.y), CH = SGR.base.roadChunks;
  if (c.y > 15000) return;          // high views (the overview) draw no roads: keep what is loaded, load nothing
  if (!SGR.rcMeta) SGR.rcMeta = new Map(CH.map(C => [C.k, C]));
  const need = CH.filter(C => !SGR.rc.has(C.k) && d(C) < SGR_RC_NEED), drop = [...SGR.rc.keys()].filter(k => d(SGR.rcMeta.get(k)) > SGR_RC_DROP);
  if (!need.length && drop.length < 6) return;
  if (sgrRcHold()) return;
  SGR.rcBusy = true; const add = CH.filter(C => !SGR.rc.has(C.k) && d(C) < SGR_RC_PRE), t0 = performance.now();
  sgrRcFetch(add).then(() => { for (const k of drop) SGR.rc.delete(k); sgrSwapLines(); SGR.rcLog = (SGR.rcLog || []).concat([{add:add.length, drop:drop.length, lines:SGR.lines.length, ms:Math.round(performance.now() - t0), prepMs:SGR.rcPrepMs}]); })
    .catch(e => console.error('road chunks', e)).finally(() => { SGR.rcBusy = false; });
}
function sgrSwapLines(){
  const old = SGR.lines, L = sgrRcJoin();
  SGRoads.dispose(old); SGR.lines = L; SGR.rcPrepMs = Math.round(SGRoads.prepare(L));
  SGR.treeIdx = null; SGR.allIdx = null; SGR.lineIdx = null; SGR.faceCache = null; SGR.dangle = null;
  SGR.roadLabels = SGRoads.labels(L).filter(r => !r.foreign && (r.cls <= 8 || r.en)).slice(0, 4200);
  SGR.graphSegs = sgrGraphSegs();
  try { if (window.SGTraffic) (SGTraffic.dropNet || SGTraffic.reset)(); } catch (e){ console.warn('traffic drop', e); }
  for (const T of SGR.tiles.values()){ if (!T.done || (T.lv || 0) < 2) continue;
    if (T.road){ for (const k of ['major', 'minor', 'paths']) if (T.road[k]){ SGR.group.remove(T.road[k]); T.road[k].traverse(q => { if (q.geometry) q.geometry.dispose(); }); } T.road = null; }
    SGR.dirty.add(T.ti); sgrEnq(T); }
  SGR.lodQ = true; SGR.linesGen = (SGR.linesGen || 0) + 1; syncLabels();
}
