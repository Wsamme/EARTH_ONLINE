// ===== City Brush v28 · lm25/net — 多人 Multiplayer (client) =====
// Play the three real maps together through a small game server (lm25/net/server: Node + ws, rooms with 4-letter codes, up to 12
// players). A 多人 Multiplayer tab (dock + tray pane, bilingual): the server address (?server= in the page URL, else a
// <meta name="citybrush-server">, else the saved setting, else this page's own host), your name and colour, create a room (mode, laps,
// difficulty, route) or join one by its code or from the list, ready / start. Modes:
//   F1 赛道赛 F1 race (Singapore and New York pages: Marina Bay / Brooklyn): remote players take the grid places of the AI cars, the start lights go out at the same server
//      time everywhere, laps / positions / results from the server (window.SGF1.mp in lm25/net/f1d.js);
//   城市街道赛 City race (any map): every client generates the same route from the server's seed (window.SGRace), a staggered grid,
//      checkpoint times checked on the server, live ranking through SGRace.setOpponents;
//   逃离 Escape (any map): the host's page runs the creature (window.SGKaiju), the server relays its state and the destroyed buildings to the
//      others (hand-over when the host leaves); the caught become spectators; reach the extraction point or survive the timer;
//   自由巡游 Free cruise: drive or fly together, join any time, go to a friend.
// Netcode: your own vehicle is fully local (no input lag) and sends a 44-byte binary snapshot 15 times a second; the server relays
// everyone's newest snapshots at 20 Hz; remote vehicles are drawn ~100 ms in the past, interpolated between snapshots (cubic Hermite
// with their velocities; dead reckoning for up to 0.35 s when packets are late; small corrections blend out); the clock is synced with
// ping / pong (the fastest round trips). Remote cars are solid for your car (impulses on your side). Name tags, brake and head lamps,
// the same car / F1 models (aircraft: simple stand-in shapes), text chat (T or Enter while driving), a spectator camera.
// A room of another map: a message and a button to switch to that map's page (sg.html / bay.html / nyc.html / index.html), which
// then joins the room by itself (?server=&join=CODE).
// Test handle: window.SGNet {connect, create, join, leave, ready, start, chat, state, remotes, spectate, debug}.
{
//<CODEC>
// the wire format (same as lm25/net/server/proto.js): 44-byte snapshots up, WORLD frames (8-byte header + 44 bytes per player) down
const NETP = (() => {
  const SNAP = 1, WORLD = 2, LEN = 44, HDR = 8, TAU = Math.PI*2;
  const FLAG = {BRAKE:1, HEAD:2, REVERSE:4, IND_L:8, IND_R:16, WRECK:32, HORN:64, HIDDEN:128};
  const VEH = {none:0, f1:1, sedan:2, suv:3, coupe:4, taxi:5, pickup:6, bus:7, moto:8, lark:16, egret:17, swift:18, petrel:19, dragonfly:20, hummingbird:21};
  const VEHN = {}; for (const k in VEH) VEHN[VEH[k]] = k;
  const i16 = v => Math.max(-32768, Math.min(32767, Math.round(v)));
  function encode(s){
    const b = new ArrayBuffer(LEN), d = new DataView(b);
    d.setUint8(0, SNAP); d.setUint8(1, s.veh | 0); d.setUint16(2, (s.seq | 0) & 0xffff, true); d.setUint32(4, Math.floor(s.t) >>> 0, true);
    d.setFloat32(8, s.x, true); d.setFloat32(12, s.y, true); d.setFloat32(16, s.z, true);
    let a = (s.psi || 0) % TAU; if (a < 0) a += TAU; d.setUint16(20, Math.round(a/TAU*65536) & 0xffff, true);
    d.setInt16(22, i16((s.pitch || 0)*1e4), true); d.setInt16(24, i16((s.roll || 0)*1e4), true);
    d.setInt16(26, i16((s.vx || 0)/0.02), true); d.setInt16(28, i16((s.vy || 0)/0.02), true); d.setInt16(30, i16((s.vz || 0)/0.02), true);
    d.setInt8(32, Math.max(-127, Math.min(127, Math.round((s.steer || 0)*127))));
    d.setUint8(33, Math.max(0, Math.min(255, Math.round((s.thr || 0)*255)))); d.setUint8(34, Math.max(0, Math.min(255, Math.round((s.brk || 0)*255))));
    d.setUint8(35, s.flags & 255); d.setUint16(36, (s.pi | 0) & 0xffff, true); d.setFloat32(38, s.pm || 0, true);
    d.setUint8(42, Math.max(0, Math.min(255, Math.round((s.rpm || 0)*255)))); d.setUint8(43, (s.variant | 0) & 255);
    return b;
  }
  function entry(d, o){
    return {slot:d.getUint8(o), veh:d.getUint8(o + 1), seq:d.getUint16(o + 2, true), t:d.getUint32(o + 4, true), x:d.getFloat32(o + 8, true), y:d.getFloat32(o + 12, true), z:d.getFloat32(o + 16, true),
      psi:d.getUint16(o + 20, true)/65536*TAU, pitch:d.getInt16(o + 22, true)/1e4, roll:d.getInt16(o + 24, true)/1e4, vx:d.getInt16(o + 26, true)*0.02, vy:d.getInt16(o + 28, true)*0.02, vz:d.getInt16(o + 30, true)*0.02,
      steer:d.getInt8(o + 32)/127, thr:d.getUint8(o + 33)/255, brk:d.getUint8(o + 34)/255, flags:d.getUint8(o + 35), pi:d.getUint16(o + 36, true), pm:d.getFloat32(o + 38, true), rpm:d.getUint8(o + 42)/255, variant:d.getUint8(o + 43)};
  }
  function decodeWorld(ab){
    const d = new DataView(ab); if (d.byteLength < HDR || d.getUint8(0) !== WORLD) return null;
    const n = d.getUint8(1), out = {tick:d.getUint16(2, true), t:d.getUint32(4, true), list:[]};
    for (let k = 0, o = HDR; k < n && o + LEN <= d.byteLength; k++, o += LEN){ const e = entry(d, o); if (isFinite(e.x) && isFinite(e.y) && isFinite(e.z)) out.list.push(e); }
    return out;
  }
  const seqNewer = (a, b) => { const d = (a - b) & 0xffff; return d !== 0 && d < 0x8000; };
  return {SNAP, WORLD, LEN, HDR, FLAG, VEH, VEHN, encode, decodeWorld, seqNewer};
})();
//</CODEC>
//<INTERP>
// the server clock and the remote players' poses (pure functions: also run by the node tests)
const NETI = (() => {
  const TAU = Math.PI*2, wrap = a => { a = (a + Math.PI) % TAU; if (a < 0) a += TAU; return a - Math.PI; };
  // the server clock: offsets (server - local) of the fastest round trips; small changes are slewed (no jumps in the remote motion)
  function clock(){
    return {S:[], off:0, rtt:0, jit:0, ready:false, n:0,
      add(rtt, off){
        this.n++; this.S.push({rtt, off}); if (this.S.length > 16) this.S.shift();
        const by = this.S.slice().sort((a, b) => a.rtt - b.rtt), best = by.slice(0, Math.max(1, Math.ceil(by.length/3))).map(s => s.off).sort((a, b) => a - b);
        const tgt = best[best.length >> 1]; this.rtt = by[by.length >> 1].rtt; this.jit = by[by.length - 1].rtt - by[0].rtt;
        if (!this.ready || Math.abs(tgt - this.off) > 120){ this.off = tgt; this.ready = true; } else this.off += Math.max(-8, Math.min(8, tgt - this.off));
      },
      init(off){ if (!this.ready) this.off = off; },     // a first guess (the welcome) until the first real round trip
      now(local){ return local + this.off; }};
  }
  // a remote player's snapshots in server-time order; late (older sequence) ones are dropped
  function push(R, s){
    if (R.lastSeq !== undefined && !(((s.seq - R.lastSeq) & 0xffff) !== 0 && ((s.seq - R.lastSeq) & 0xffff) < 0x8000)) return false;
    R.lastSeq = s.seq; const B = R.buf || (R.buf = []); let i = B.length; while (i > 0 && B[i - 1].t > s.t) i--; B.splice(i, 0, s);
    if (B.length > 48) B.splice(0, B.length - 48); R.lastT = s.t; return true;
  }
  const h00 = u => 2*u*u*u - 3*u*u + 1, h10 = u => u*u*u - 2*u*u + u, h01 = u => -2*u*u*u + 3*u*u, h11 = u => u*u*u - u*u;
  const KEYS = ['steer', 'thr', 'brk', 'rpm', 'pm'];
  // the pose at server time T: cubic Hermite between the snapshots around T (positions and their velocities), angles along the shorter
  // arc; past the newest: dead reckoning for up to maxEx s (with the last yaw rate), then hold ('stale'); before the oldest: the oldest
  function sample(R, T, o, maxEx){
    const B = R.buf; if (!B || !B.length) return null; maxEx = maxEx === undefined ? 0.35 : maxEx;
    while (B.length > 3 && B[1].t <= T - 200) B.shift();
    let a = null, b = null, ia = -1;
    for (let i = B.length - 1; i >= 0; i--) if (B[i].t <= T){ a = B[i]; b = B[i + 1] || null; ia = i; break; }
    if (!a){ a = B[0]; Object.assign(o, a); o.mode = 'early'; o.tp = false; return o; }
    o.veh = a.veh; o.flags = a.flags; o.pi = a.pi; o.variant = a.variant; o.tp = false;
    if (b && b.t > a.t){
      const dt = (b.t - a.t)/1000, u = (T - a.t)/(b.t - a.t), jump = Math.hypot(b.x - a.x, b.y - a.y), vmax = Math.max(Math.hypot(a.vx, a.vy), Math.hypot(b.vx, b.vy));
      if (jump > Math.max(30, vmax*dt*2.5 + 10)){ const s = u < 0.5 ? a : b; Object.assign(o, s); o.mode = 'interp'; o.tp = true; return o; }   // a reset / respawn: no curve through it
      const H0 = h00(u), H1 = h10(u)*dt, H2 = h01(u), H3 = h11(u)*dt;
      o.x = H0*a.x + H1*a.vx + H2*b.x + H3*b.vx; o.y = H0*a.y + H1*a.vy + H2*b.y + H3*b.vy; o.z = H0*a.z + H1*a.vz + H2*b.z + H3*b.vz;
      o.vx = a.vx + (b.vx - a.vx)*u; o.vy = a.vy + (b.vy - a.vy)*u; o.vz = a.vz + (b.vz - a.vz)*u;
      o.psi = wrap(a.psi + wrap(b.psi - a.psi)*u); o.pitch = a.pitch + (b.pitch - a.pitch)*u; o.roll = a.roll + (b.roll - a.roll)*u;
      for (const k of KEYS) o[k] = a[k] + (b[k] - a[k])*u;
      if (u > 0.5){ o.flags = b.flags; o.pi = b.pi; o.veh = b.veh; o.variant = b.variant; }
      o.mode = 'interp'; return o;
    }
    // past the newest snapshot: extrapolate with its velocity and the yaw rate between the last two
    const ex = Math.min((T - a.t)/1000, maxEx), p = ia > 0 ? B[ia - 1] : null, wz = p && a.t > p.t ? wrap(a.psi - p.psi)/((a.t - p.t)/1000) : 0;
    Object.assign(o, a); o.x = a.x + a.vx*ex; o.y = a.y + a.vy*ex; o.z = a.z + a.vz*ex; o.psi = wrap(a.psi + Math.max(-1.5, Math.min(1.5, wz))*ex);
    o.mode = (T - a.t)/1000 > maxEx ? 'stale' : 'extrap'; return o;
  }
  // the buffer depth per remote player: how old its snapshots are when they arrive (its uplink + the server tick + our downlink): mean +
  // 1.5 deviations + half a snapshot interval (a short dead reckoning covers the rest), at least `base` (100 ms); it grows fast (and on
  // underruns), shrinks slowly (no time warp)
  function ageAdd(R, age){ if (!(age > -500 && age < 5000)) return; if (R.ageM === undefined){ R.ageM = age; R.ageD = 15; } else { const d = age - R.ageM; R.ageM += d*0.08; R.ageD += (Math.abs(d) - R.ageD)*0.08; } }
  function delayStep(R, dt, under, base, iv){
    base = base || 100; iv = iv || 67; const tgt = Math.min(600, Math.max(base, (R.ageM || 0) + 1.5*(R.ageD || 0) + 0.5*iv));
    if (R.delay === undefined) R.delay = tgt; if (under) R.delay = Math.min(600, R.delay + 6);
    R.delay = R.delay < tgt ? Math.min(tgt, R.delay + 150*dt) : Math.max(tgt, R.delay - 25*dt); return R.delay;
  }
  return {clock, push, sample, wrap, ageAdd, delayStep};
})();
//</INTERP>

/* ================= state ================= */
const NV = NETP.VEH, NFL = NETP.FLAG;
const RC_KEYS = ['sedan', 'suv', 'coupe', 'taxi', 'pickup', 'bus', 'moto'], AIR_KEYS = ['lark', 'egret', 'swift', 'petrel', 'dragonfly', 'hummingbird'];
const CITY_N = {sg:['新加坡', 'Singapore'], bay:['旧金山湾区', 'SF Bay Area'], nyc:['纽约', 'New York']};
const MODE_N = {f1:['F1 赛道赛', 'F1 race'], cityrace:['城市街道赛', 'City race'], escape:['逃离克苏鲁', 'Escape the creature'], free:['自由巡游', 'Free cruise']};
const STATE_N = {lobby:['大厅', 'lobby'], countdown:['倒计时', 'countdown'], racing:['进行中', 'racing'], results:['成绩', 'results'], playing:['进行中', 'open']};
// 12 player colours (the F1 liveries' main colour; the same order as SGF1.mp.palette)
const PAL0 = [[0.86, 0.10, 0.13], [0.98, 0.82, 0.10], [0.93, 0.95, 0.97], [0.45, 0.85, 0.15], [0.42, 0.18, 0.62], [0.05, 0.60, 0.60], [0.12, 0.12, 0.13], [0.10, 0.25, 0.75], [0.80, 0.68, 0.42], [0.55, 0.06, 0.08], [0.60, 0.92, 0.80], [0.98, 0.45, 0.72]];
const PCOL = k => { const c = PAL0[((k | 0) % 12 + 12) % 12]; return `rgb(${c.map(v => Math.round(v*255)).join(',')})`; };
const PREF = 'cityBrush.net', SESS = 'cityBrush.net.sess';
const N = {ws:null, url:'', st:'off', want:false, retry:0, retryT:null, id:null, token:null, name:'', col:0, room:null, players:new Map(), bySlot:new Map(), me:null,
  clock:NETI.clock(), seq:0, sendAcc:0, snapHz:15, pingT:0, pingN:0, delay:100, rooms:[], rank:null, results:null, chat:[], race:null, spec:{on:false, id:null, mode:'chase', pos:null},
  bytesIn:0, bytesOut:0, frames:0, snapsOut:0, warn:{}, kj:{on:false, owner:false, last:0, tgtT:0}, esc:null, route:null, extSent:false, lastLocal:null, flyPrev:null, joinAfter:null, dbg:{extrap:0, interp:0, stale:0, early:0}};
const LOC = {};       // the local vehicle (SGF1.mp.local / SGFly.state)
const F1CITIES = ['sg', 'nyc'];   // [lm27/nyrace] the maps with a circuit
const city = () => { try { if (typeof SGR_NYC !== 'undefined' && SGR_NYC) return 'nyc'; if (typeof SGR_BAY !== 'undefined' && SGR_BAY) return 'bay'; } catch (e){ /* Singapore */ } return 'sg'; };
const perfOf = srvT => srvT - N.clock.off;            // a server time as performance.now() time
const srvNow = () => N.clock.now(performance.now());
const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'})[c]);
const F1on = () => !!(window.SGF1 && SGF1.F1 && SGF1.F1.on), FLYon = () => !!(window.SGFly && SGFly.on);
function loadPrefs(){ try { const s = JSON.parse(localStorage.getItem(PREF) || 'null'); if (s){ N.name = s.name || ''; N.col = s.col | 0; N.savedUrl = s.server || ''; } } catch (e){ /* private mode */ }
  if (!N.name) N.name = 'Driver ' + (10 + Math.floor(Math.random()*89)); }
function savePrefs(){ try { localStorage.setItem(PREF, JSON.stringify({name:N.name, col:N.col, server:N.savedUrl || ''})); } catch (e){ /* private mode */ } }
function loadSess(){ try { return JSON.parse(sessionStorage.getItem(SESS) || 'null'); } catch (e){ return null; } }
function saveSess(){ try { sessionStorage.setItem(SESS, JSON.stringify({id:N.id, token:N.token, url:N.url, room:N.room ? N.room.code : null})); } catch (e){ /* private mode */ } }
// where the server is: ?server= in the page URL, a <meta name="citybrush-server">, the saved setting, else this page's own host
function defaultUrl(){
  try { const q = new URLSearchParams(location.search).get('server'); if (q) return normUrl(q); } catch (e){ /* no URL */ }
  const m = document.querySelector('meta[name="citybrush-server"]'); if (m && m.content) return normUrl(m.content);
  if (window.CITYBRUSH_SERVER) return normUrl(String(window.CITYBRUSH_SERVER));
  if (N.savedUrl) return N.savedUrl;
  if (/^https?:$/.test(location.protocol) && location.host) return (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host;
  return '';
}
function normUrl(u){ u = String(u || '').trim(); if (!u) return ''; if (/^https?:\/\//i.test(u)) u = u.replace(/^http/i, 'ws'); if (!/^wss?:\/\//i.test(u)) u = (location.protocol === 'https:' ? 'wss://' : 'ws://') + u; return u.replace(/\/+$/, ''); }

/* ================= connection ================= */
function send(o){ const ws = N.ws; if (!ws || ws.readyState !== 1) return false; const s = JSON.stringify(o); ws.send(s); N.bytesOut += s.length; return true; }
function connect(url){
  url = normUrl(url || N.url || defaultUrl()); if (!url){ uiMsg('请先填写服务器地址 · Enter the server address first', 'warn'); return false; }
  if (N.ws && N.url === url && (N.st === 'open' || N.st === 'connecting')) return true;
  disconnect(true); N.url = url; N.want = true; N.st = 'connecting'; uiRefresh();
  let ws; try { ws = new WebSocket(url); } catch (e){ N.st = 'off'; uiMsg('地址无效 · Invalid address: ' + e.message, 'warn'); uiRefresh(); return false; }
  ws.binaryType = 'arraybuffer'; N.ws = ws;
  ws.onopen = () => { if (N.ws !== ws) return; N.retry = 0; const S = loadSess(); const resume = S && S.url === url && S.id ? S : null;
    send({t:'hello', v:1, name:N.name, col:N.col, city:city(), id:resume ? resume.id : N.id, token:resume ? resume.token : N.token});
    N.pingN = 0; N.pingT = 0; };
  ws.onmessage = ev => { if (N.ws !== ws) return; const d = ev.data;
    if (typeof d === 'string'){ N.bytesIn += d.length; let m; try { m = JSON.parse(d); } catch (e){ return; } try { onMsg(m); } catch (e){ console.error('[net] message', m && m.t, e); } }
    else { N.bytesIn += d.byteLength; onWorld(d); } };
  ws.onclose = ev => { if (N.ws !== ws) return; N.ws = null; const was = N.st; N.st = N.want ? 'retry' : 'off';
    if (ev.code === 4001){ N.want = false; N.st = 'off'; uiMsg('这个账号在另一个窗口连接了 · Connected from another window', 'warn'); }
    if (N.want){ const d = Math.min(15000, 800*Math.pow(1.8, N.retry++)); clearTimeout(N.retryT); N.retryT = setTimeout(() => { if (N.want) connect(N.url); }, d);
      if (was === 'open') uiMsg('连接断开，正在重连… · Connection lost, reconnecting…', 'warn'); }
    for (const R of N.players.values()) R.away = true; uiRefresh(); };
  ws.onerror = () => { /* onclose follows */ };
  return true;
}
function disconnect(keepRoom){
  N.want = false; clearTimeout(N.retryT); const ws = N.ws; N.ws = null; if (ws){ try { ws.close(1000, 'bye'); } catch (e){ /* closed */ } }
  N.st = 'off'; if (!keepRoom){ leaveLocal(); } uiRefresh();
}
function onMsg(m){
  switch (m.t){
    case 'pong': { const t = performance.now(), rtt = t - m.c; if (rtt >= 0 && rtt < 10000) N.clock.add(rtt, m.s + rtt/2 - t); return; }
    case 'welcome': N.id = m.id; N.token = m.token; N.st = 'open'; N.snapHz = (m.cfg && m.cfg.snapHz) || 15; N.clock.init(m.now - performance.now() + 25); saveSess();
      if (!m.room && N.room) leaveLocal();
      if (!m.room && N.joinAfter){ const c = N.joinAfter; N.joinAfter = null; join(c); }
      uiRefresh(); return;
    case 'rooms': N.rooms = m.list || []; uiRooms(); return;
    case 'room': onRoom(m); return;
    case 'err': onErr(m); return;
    case 'warn': if (!N.warn[m.code]){ N.warn[m.code] = 1; uiMsg((m.code === 'route-mismatch' ? '你的路线和房主的不一样 · Your route differs from the host’s' : m.msg || m.code), 'warn'); } return;
    case 'left': { const R = N.players.get(m.id); if (!R) return; dropRemote(R); chatLine(null, `${R.name} 离开了 · left`, true); return; }
    case 'away': { const R = N.players.get(m.id); if (R) R.away = true; uiPlayers(); return; }
    case 'back': { const R = N.players.get(m.id); if (R) R.away = false; uiPlayers(); return; }
    case 'host': if (N.room){ N.room.host = m.id; uiRefresh(); if (m.id === N.id) uiMsg('你现在是房主 · You are the host now'); } return;
    case 'chat': chatLine(m, m.text); return;
    case 'countdown': onCountdown(m); return;
    case 'go': if (N.race) N.race.go = true; uiBig(''); return;
    case 'rank': onRank(m); return;
    case 'you': if (N.race) N.race.me = m.race; return;
    case 'fin': { const R = N.players.get(m.id); chatLine(null, `🏁 ${R ? R.name : m.id === N.id ? N.name : '?'} 完赛 · finished ${fmtS(m.t2)}`, true); return; }
    case 'dnf': if (m.id === N.id) startSpectate(); return;
    case 'flag': { const R = N.players.get(m.id); chatLine(null, `⚠ ${R ? R.name : m.id === N.id ? N.name : '?'} 成绩存疑 · flagged by the server checks`, true); return; }
    case 'results': onResults(m); return;
    case 'route': N.routeSrv = m.route; if (N.race && N.race.mode === 'escape' && m.route && m.route.ext && !N.esc) N.esc = {x:m.route.ext[0], y:m.route.ext[1], r:m.route.ext[2]}; return;
    case 'kj': if (!N.kj.owner && window.SGKaiju && SGKaiju.applyState){ try { SGKaiju.applyState(m.s); } catch (e){ console.warn('[net] kaiju state', e); } } N.kj.lastS = m.s; return;
    case 'destroy': if (!N.kj.owner && window.SGKaiju && SGKaiju.destroy && Array.isArray(m.list)){ try { SGKaiju.destroy(m.list.map(a => a[0] === 'L' ? {lm:String(a[1])} : a.length >= 5 ? {tile:a[0], idx:a[1], fx:a[2], fy:a[3], e:a[4]} : {tile:a[0], idx:a[1]})); } catch (e){ console.warn('[net] kaiju destroy', e); } } return;
    case 'owner': onOwner(m); return;
    case 'caught': onCaught(m); return;
    case 'extracted': { if (m.id === N.id){ uiBig('逃脱成功！ESCAPED', 3000, 'go'); startSpectate(); } const R = N.players.get(m.id); chatLine(null, `🚁 ${R ? R.name : m.id === N.id ? N.name : '?'} 逃脱 · escaped`, true); return; }
  }
}
function onErr(m){
  if (m.code === 'city'){ cityDialog(m.city, m.room); return; }
  const T = {'no-room':'没有这个房间 · No room with this code', 'full':'房间已满 · The room is full', 'not-host':'只有房主可以这样做 · Only the host can do that', 'rate':'太快了，请稍等 · Too fast, wait a moment',
    'f1-sg':'F1 赛道赛在新加坡和纽约地图 · The F1 race is on the Singapore and New York maps', 'full-server':'服务器房间已满 · The server has no free rooms', 'bad-state':'现在不能开始 · Cannot start now'};
  uiMsg(T[m.code] || m.msg || m.code, 'warn');
}

/* ================= the room ================= */
function onRoom(m){
  const first = !N.room || N.room.code !== m.code; N.room = m; saveSess();
  const ids = new Set();
  for (const p of m.players){ ids.add(p.id); if (p.id === N.id){ N.me = p; continue; }
    let R = N.players.get(p.id); if (!R){ R = {id:p.id, buf:[], pose:{}, vis:null, err:{x:0, y:0, z:0}, away:false, r:{id:p.id}}; N.players.set(p.id, R); }
    if (R.slot !== undefined && R.slot !== p.slot) N.bySlot.delete(R.slot);
    R.slot = p.slot; R.name = p.name; R.col = p.col; R.role = p.role; R.away = p.away; N.bySlot.set(p.slot, R); }
  for (const R of [...N.players.values()]) if (!ids.has(R.id)) dropRemote(R);
  if (first){ N.chat.length = 0; if (UI.q.plog) UI.q.plog.innerHTML = ''; N.results = null; N.rank = null; chatLine(null, `进入房间 ${m.code} · ${MODE_N[m.mode][0]} ${MODE_N[m.mode][1]}`, true);
    if (m.mode === 'free' && !F1on() && !FLYon()) uiMsg('自由巡游：开车或飞行即可加入 · Free cruise: start driving or flying to join');
    try { window.SGF1 && SGF1.mp && SGF1.mp.color(N.me ? N.me.col : -1); } catch (e){ /* old drive module */ } }
  // a race in progress that we are part of (a reconnect / page reload): pick it up
  // (or one we joined late: spectating, the creature shown)
  if ((m.state === 'countdown' || m.state === 'racing') && !N.race && N.me && m.grid) onCountdown({seed:m.seed, routeId:m.routeId, startAt:m.startAt, lightsAt:m.lightsAt, endAt:m.endAt, grid:m.grid, laps:m.cfg.laps, cfg:m.cfg, owner:m.owner, resume:true, state:m.state});
  if (m.state === 'lobby' && N.race) endRace();
  uiRefresh();
}
function dropRemote(R){ N.players.delete(R.id); if (N.bySlot.get(R.slot) === R) N.bySlot.delete(R.slot); if (R.tag){ R.tag.remove(); R.tag = null; } if (R.air){ scene.remove(R.air); R.air.material.dispose(); R.air = null; } if (N.spec.id === R.id) N.spec.id = null; }
function leaveLocal(){
  if (N.race) endRace(); N.room = null; N.me = null; for (const R of [...N.players.values()]) dropRemote(R); N.players.clear(); N.bySlot.clear(); N.results = null; N.rank = null;
  stopSpectate(); try { window.SGF1 && SGF1.mp && (SGF1.mp.remotes([]), SGF1.mp.color(-1)); } catch (e){ /* old drive module */ } saveSess(); uiRefresh(); uiResults(false);
}
function create(mode, o){ o = o || {}; if (!N.ws) connect(); const c = city();
  if (mode === 'f1' && !F1CITIES.includes(c)){ cityDialog('sg', null, 'f1'); return false; }
  const doIt = () => send({t:'create', mode, city:c, cfg:o.cfg || {}, priv:!!o.priv, name:o.name || ''});
  if (N.st === 'open') return doIt(); N.onOpen = doIt; return true; }
function join(code){ code = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); if (!code) return false; const r = N.rooms.find(x => x.code === code);
  if (r && r.city !== city()){ cityDialog(r.city, code); return false; }
  if (N.st !== 'open'){ N.joinAfter = code; connect(); return true; } return send({t:'join', code, city:city()}); }
function leave(){ if (N.race) retire(); send({t:'leave'}); leaveLocal(); }

/* ================= races and modes ================= */
const fmtS = t => { if (t == null || !isFinite(t)) return '–'; const m = Math.floor(t/60), s = t - m*60; return `${m}:${s < 10 ? '0' : ''}${s.toFixed(2)}`; };
// the staggered grid behind a start point (2 abreast, 8 m apart): [x, y, psi]
function gridSpot(st, k){ const psi = st.psi, cs = Math.cos(psi), sn = Math.sin(psi), row = Math.floor(k/2), lat = (k % 2 ? -1 : 1)*1.9, back = 7 + row*8;
  return [st.x - cs*back - sn*lat, st.y - sn*back + cs*lat, psi]; }
// a route's start heading: compass degrees (lm25/cityrace) -> the math angle
const hdgPsi = h => (h === undefined || h === null || !isFinite(h)) ? 0 : (90 - h)*Math.PI/180;
// progress along the route (metres; bigger = further): the passed checkpoints' s plus the part of the next leg already driven
function routeProg(x, y, cp){ const R = N.route; if (!R || !R.cps.length) return 0; const n = R.cps.length; if (cp >= n) return R.cps[n - 1].s;
  const nx = R.cps[cp], s0 = cp > 0 ? R.cps[cp - 1].s : 0; return s0 + Math.max(0, (nx.s - s0) - Math.hypot(x - nx.x, y - nx.y)); }
function routeHash(R){ let h = 2166136261 >>> 0; const add = v => { const s = String(Math.round(v*10)); for (let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } };
  if (R.start){ add(R.start.x); add(R.start.y); } for (const c of R.cps || []){ add(c.x); add(c.y); } return (h >>> 0).toString(16); }
function ensureDriving(){
  if (F1on() && SGF1.F1.mode !== 'race') return true; try { if (FLYon()) SGFly.exit(); } catch (e){ /* optional */ }
  try { if (window.SGF1 && SGF1.mp) SGF1.mp.race(null); } catch (e){ /* optional */ }   // leaving the circuit race: free drive (the city)
  if (!window.SGF1) return false;
  if (city() !== 'sg'){ try { if (SGF1.enter('car', {})) return true; } catch (e){ /* F1 then */ } }
  return !!SGF1.enter('free');
}
function onCountdown(m){
  if (!N.room) return; const mode = N.room.mode, slot = m.grid && N.id in m.grid ? m.grid[N.id] : -1;
  N.results = null; uiResults(false); N.extSent = false; N.esc = null; N.route = null; N.warn = {};
  N.race = {mode, seed:m.seed, routeId:m.routeId, startAt:m.startAt, lightsAt:m.lightsAt, endAt:m.endAt, slot, laps:m.laps || 3, cfg:m.cfg || {}, go:false, cp:0, me:null, fin:false, owner:m.owner, hostAt:m.hostAt};
  // back after a page reload in the middle of a race: the lap / checkpoint count is gone with the page, so watch this one (DNF)
  if (slot >= 0 && m.resume && m.state === 'racing' && (mode === 'f1' || mode === 'cityrace')){ send({t:'ev', k:'retire'}); N.race.slot = -1; uiMsg('比赛已经开始，这一场观战 · The race is on: you watch this one'); }
  const racer = N.race.slot >= 0;
  if (!racer){ startSpectate(); uiRefresh(); return; }
  stopSpectate();
  if (mode === 'f1'){
    if (!window.SGF1 || !SGF1.mp){ uiMsg('这个页面没有 F1 多人模块 · This page has no multiplayer F1', 'warn'); return; }
    try { if (FLYon()) SGFly.exit(); } catch (e){ /* optional */ }
    SGF1.mp.color(N.me ? N.me.col : 0);
    SGF1.mp.onLap = e => send({t:'ev', k:'lap', lap:e.lap, rt:+e.rt.toFixed(3), lt:+e.lt.toFixed(3), inv:!!e.inv});
    SGF1.mp.onFinish = e => { N.race.fin = true; uiBig('完赛 · FINISHED ' + fmtS(e.rt), 2500, 'go'); };
    const ok = SGF1.mp.race({slot, laps:N.race.laps, lightsAt:perfOf(m.lightsAt), goAt:perfOf(m.startAt), cam:m.resume ? undefined : 0});
    if (!ok){ uiMsg('赛道还没准备好 · The circuit is not ready', 'warn'); return; }
    if (N.room.host === N.id){ const L = SGF1.mp.local(LOC); if (L.trackLen) send({t:'ev', k:'track', len:+L.trackLen.toFixed(1)}); }
  } else if (mode === 'cityrace' || mode === 'escape'){
    const R = makeRoute(mode, m); N.route = R;
    if (!R){ uiMsg('这个页面没有城市赛模块 · This page has no city-race module', 'warn'); return; }
    // escape: the extraction point is the route's checkpoint farthest from the start (a loop route ends where it starts)
    if (mode === 'escape'){ let e = R.cps[R.cps.length - 1], bd = -1; for (const c of R.cps){ const d = Math.hypot(c.x - R.start.x, c.y - R.start.y); if (d > bd){ bd = d; e = c; } } N.esc = {x:e.x, y:e.y, r:Math.max(40, e.w || 40)}; }
    let hash = routeHash(R); try { if (R.raw && window.SGRace && SGRace.hash) hash = String(SGRace.hash(R.raw)); } catch (e){ /* own hash */ }
    send({t:'ev', k:'route', hash, ncp:R.cps.length, len:R.lengthM || 0, cps:R.cps.slice(0, 200).map(c => [+c.x.toFixed(1), +c.y.toFixed(1), +(c.w || 20).toFixed(1)]),
      start:[+R.start.x.toFixed(1), +R.start.y.toFixed(1), +R.start.psi.toFixed(3)], ext:N.esc ? [+N.esc.x.toFixed(1), +N.esc.y.toFixed(1), N.esc.r] : undefined});
    if (!ensureDriving()){ uiMsg('无法开始驾驶 · Cannot start driving here', 'warn'); return; }
    if (mode === 'cityrace' && window.SGRace && SGRace.start){ try { SGRace.start(R.raw, {at:perfOf(m.startAt), solo:false, ai:0, ghost:false}); } catch (e){ console.warn('[net] SGRace.start', e); } }
    const g = gridSpot(R.start, slot); N.race.grid = g; try { SGF1.mp.place(g[0], g[1], g[2]); } catch (e){ console.warn('[net] place', e); }
    if (mode === 'escape'){ N.kj.owner = m.owner === N.id; N.kj.on = false; }
  }
  uiRefresh();
}
// the route every client builds from the server's seed (window.SGRace), else a fallback from the host's position (escape)
function makeRoute(mode, m){
  const S = window.SGRace, c = city(); let raw = null;
  const len = mode === 'escape' ? 2600 : (m.cfg && m.cfg.len) || 3000, o = {km:Math.max(3, Math.min(12, len/1000)), len, lengthM:len, city:c};
  // a curated route by its id ('sg:marina'), else a route from the server's seed: the same on every client (SGRace.generate is deterministic)
  try { if (S && S.generate && m.routeId) raw = S.generate(m.routeId, o); } catch (e){ console.warn('[net] curated route', e); }
  try { if (!raw && S && S.generate) raw = S.generate(m.seed, o); } catch (e){ console.warn('[net] generate', e); }
  if (raw && raw.start && raw.cps && raw.cps.length){ let s = 0, px = raw.start.x, py = raw.start.y;   // metres along the route at each checkpoint (the route's own s, else straight lines)
    const cps = raw.cps.map(q => { s = isFinite(q.s) ? q.s : s + Math.hypot(q.x - px, q.y - py); px = q.x; py = q.y; return {x:q.x, y:q.y, w:q.w || 20, s}; });
    return {raw, start:{x:raw.start.x, y:raw.start.y, psi:hdgPsi(raw.start.hdg)}, cps, lengthM:raw.lengthM || s}; }
  if (mode !== 'escape') return null;
  // fallback (no route module): start at the host's car, the extraction 1.8 km away in a seeded direction
  const h = m.hostAt || (N.lastLocal ? {x:N.lastLocal.x, y:N.lastLocal.y, hdg:N.lastLocal.psi} : null); if (!h) return null;
  const a = ((m.seed % 3600)/3600)*Math.PI*2, ex = h.x + Math.cos(a)*1800, ey = h.y + Math.sin(a)*1800;
  return {raw:null, start:{x:h.x, y:h.y, psi:h.hdg || 0}, cps:[{x:ex, y:ey, w:60}], lengthM:1800};
}
function onRank(m){
  N.rank = m.list || []; const me = N.rank.find(r => r.id === N.id);
  if (N.race && N.race.mode === 'f1' && window.SGF1 && SGF1.mp){
    const lead = N.rank[0];
    SGF1.mp.tower(N.rank.map((r, i) => ({name:r.name.slice(0, 9), col:r.col, me:r.id === N.id, gap:i === 0 ? (r.fin != null ? 'FIN' : 'LEAD') : r.dnf ? 'DNF' : r.fin != null && lead.fin != null ? '+' + (r.fin - lead.fin).toFixed(1) : r.gap != null ? '+' + r.gap.toFixed(1) : ''})), me ? me.pos : 0, N.rank.length);
  }
  uiRank();
}
function onResults(m){
  N.results = m; N.rank = m.list; const R = N.race;
  if (R && R.mode === 'escape') kaijuStop();
  if (R && R.mode === 'cityrace' && window.SGRace && SGRace.stop){ /* the route HUD stays until the player leaves the results */ }
  uiResults(true);
}
function endRace(){
  const R = N.race; N.race = null; N.extSent = false; N.esc = null;
  try { if (R && R.mode === 'f1' && window.SGF1 && SGF1.mp) SGF1.mp.race(null); } catch (e){ /* optional */ }
  try { if (R && R.mode === 'cityrace' && window.SGRace && SGRace.stop) SGRace.stop(); } catch (e){ /* optional */ }
  if (R && R.mode === 'escape') kaijuStop();
  hideBeacon(); uiBig(''); uiRefresh();
}
function retire(){ if (N.race && !N.race.fin) send({t:'ev', k:'retire'}); }
// escape: the creature on the owner's page (local AI) or driven by the relayed state (the others)
function kaijuStart(){
  const K = window.SGKaiju, R = N.race; if (!K || !K.start || !R || N.kj.on) return;
  const spawn = N.kj.lastS && isFinite(N.kj.lastS.x) ? {x:N.kj.lastS.x, y:N.kj.lastS.y} : 'auto';
  // localId: this player's id (the owner's targets carry the room's player ids); goal 'mp': the room's server keeps time and results;
  // keep: a hand-over continues with the destroyed city as it is
  try { K.start({seed:R.seed, spawn, difficulty:(R.cfg && R.cfg.diff) | 0, species:(R.cfg && R.cfg.species) || 'cthulhu', remote:!N.kj.owner, localId:N.id, goal:'mp', keep:spawn !== 'auto'}); N.kj.on = true; } catch (e){ console.warn('[net] SGKaiju.start', e); }
  if (!N.kj.hooked){ N.kj.hooked = true;
    try { K.onDestroy && K.onDestroy(list => { if (N.kj.owner && N.race && Array.isArray(list) && list.length) for (let i = 0; i < list.length; i += 200) send({t:'ev', k:'destroy', list:list.slice(i, i + 200).map(b => b.lm ? ['L', String(b.lm)] : isFinite(b.fx) && isFinite(b.fy) ? [b.tile | 0, b.idx | 0, +(+b.fx).toFixed(3), +(+b.fy).toFixed(3), +(+(b.e || 0.6)).toFixed(2)] : [b.tile | 0, b.idx | 0])}); }); } catch (e){ /* optional */ }
    try { K.onCatch && K.onCatch(id => { if (N.kj.owner && N.race) send({t:'ev', k:'catch', id}); }); } catch (e){ /* optional */ } }
}
function kaijuStop(){ if (N.kj.on){ try { window.SGKaiju && SGKaiju.stop && SGKaiju.stop(); } catch (e){ /* optional */ } } N.kj.on = false; N.kj.owner = false; N.kj.lastS = null; }
function onOwner(m){
  const was = N.kj.owner; N.kj.owner = m.id === N.id; if (m.s) N.kj.lastS = m.s;
  if (N.kj.owner && !was && N.race && N.race.mode === 'escape'){ uiMsg('你接管了怪物 · You run the creature now (the host left)'); if (N.kj.on){ kaijuStop(); N.kj.owner = true; N.kj.lastS = m.s; } if (N.race.go || srvNow() >= N.race.startAt) kaijuStart(); }
  else if (!N.kj.owner && was && N.kj.on){ kaijuStop(); kaijuStart(); }
}
function onCaught(m){
  const R = N.players.get(m.id), nm = R ? R.name : m.id === N.id ? N.name : '?';
  chatLine(null, `🐙 ${nm} 被抓住了 · was caught`, true);
  if (m.id === N.id){ uiBig('被抓住了！CAUGHT', 3000, 'warn'); setTimeout(() => { if (N.room) startSpectate(); }, 1200); }
}

/* ================= snapshots: the local vehicle up, the remote ones down ================= */
function readLocal(){
  const L = LOC; L.ok = false;
  if (F1on() && window.SGF1.mp){ SGF1.mp.local(L); L.code = L.veh === 'car' ? (NV[L.key] || NV.sedan) : NV.f1; L.vz = 0; L.ok = true; L.variant = L.veh === 'car' ? (L.paint | 0) : Math.max(0, N.me ? N.me.col : 0); }
  else if (FLYon()){ const s = SGFly.state(); if (s && isFinite(s.x)){ const t = performance.now(), P = N.flyPrev;
      L.x = s.x; L.y = s.y; L.z = s.z; L.zs = s.z; L.psi = (90 - s.hdg)*Math.PI/180; L.pitch = (s.pitch || 0)*Math.PI/180; L.roll = (s.roll || 0)*Math.PI/180;
      if (P && t - P.t > 5){ const dt = (t - P.t)/1000; L.vx = (s.x - P.x)/dt; L.vy = (s.y - P.y)/dt; L.vz = (s.z - P.z)/dt; } else { L.vx = L.vy = L.vz = 0; }
      if (!P || t - P.t > 60) N.flyPrev = {t, x:s.x, y:s.y, z:s.z};
      L.code = NV[s.type] || NV.lark; L.veh = 'air'; L.key = s.type; L.delta = 0; L.thr = s.thr || 0; L.brk = 0; L.rev = false; L.rpm = s.thr || 0; L.head = typeof nightF === 'number' && nightF > 0.2; L.ind = 0;
      L.wreck = !!s.crashed; L.braking = false; L.variant = N.me ? N.me.col : 0; L.ok = true; } }
  if (L.ok) N.lastLocal = {x:L.x, y:L.y, z:L.z, psi:L.psi};
  return L;
}
function sendSnap(){
  const L = readLocal(); if (!L.ok || !N.room || N.st !== 'open') return;
  const R = N.race; let pi = 0, pm = 0;
  if (R && R.mode === 'f1'){ pi = L.lap | 0; pm = isFinite(L.prog) ? L.prog : 0; }
  else if (R && R.mode === 'cityrace' && window.SGRace && SGRace.progress){ try { const p = SGRace.progress(); if (p){ pi = p.cp | 0; pm = isFinite(p.s) ? +p.s : routeProg(L.x, L.y, pi); /* route metres: the module's along-route s, else ours */ } } catch (e){ /* optional */ } }
  const fl = (L.braking ? NFL.BRAKE : 0) | (L.head ? NFL.HEAD : 0) | (L.rev ? NFL.REVERSE : 0) | ((L.ind === -1 || L.ind === 2) ? NFL.IND_L : 0) | ((L.ind === 1 || L.ind === 2) ? NFL.IND_R : 0) | (L.wreck ? NFL.WRECK : 0);
  const b = NETP.encode({veh:L.code, seq:N.seq = (N.seq + 1) & 0xffff, t:srvNow(), x:L.x, y:L.y, z:L.z, psi:L.psi, pitch:L.pitch, roll:L.roll, vx:L.vx, vy:L.vy, vz:L.vz || 0,
    steer:Math.max(-1, Math.min(1, (L.delta || 0)/0.8)), thr:L.thr, brk:L.brk, flags:fl, pi, pm, rpm:L.rpm, variant:L.variant});
  N.ws.send(b); N.bytesOut += b.byteLength; N.snapsOut++;
}
function onWorld(ab){
  const W = NETP.decodeWorld(ab); if (!W) return; N.frames++;
  const now = srvNow(); for (const e of W.list){ if (N.me && e.slot === N.me.slot) continue; const R = N.bySlot.get(e.slot); if (!R) continue; if (NETI.push(R, e)) NETI.ageAdd(R, now - e.t); R.away = false; R.lastRecv = performance.now(); }
}
// every frame: the remote poses at (server time - delay), smoothed, to the drive module (cars) and our own aircraft / tags
const REM = [];
function remoteTick(dt){
  const now = srvNow(); let k = 0, dmax = 0;
  for (const R of N.players.values()){
    const P = R.buf && R.buf.length ? NETI.sample(R, now - (R.delay || N.delay), R.pose) : null;
    if (!P){ if (R.tag) R.tag.hidden = true; if (R.air) R.air.visible = false; continue; }
    const under = (P.mode === 'extrap' || P.mode === 'stale') && R.lastRecv && performance.now() - R.lastRecv < 1000; N.dbg[P.mode]++;
    NETI.delayStep(R, dt, under, 100, 1000/N.snapHz); dmax = Math.max(dmax, R.delay);
    // blend out corrections (a late packet after extrapolating): the shown pose eases to the sampled one in ~0.12 s
    const V = R.vis || (R.vis = {x:P.x, y:P.y, z:P.z, px:P.x, py:P.y, pz:P.z}), E = R.err;
    const ex = V.px + (P.vx || 0)*dt, ey = V.py + (P.vy || 0)*dt, jx = P.x - ex, jy = P.y - ey, jz = P.z - V.pz - (P.vz || 0)*dt;
    if (P.tp || Math.hypot(jx, jy) > 25){ E.x = E.y = E.z = 0; R.ghostT = performance.now() + 1500; }
    else if (Math.hypot(jx, jy) > 0.25){ E.x -= jx; E.y -= jy; E.z -= jz; }
    const kd = Math.exp(-dt/0.12); E.x *= kd; E.y *= kd; E.z *= kd; V.px = P.x; V.py = P.y; V.pz = P.z;
    V.x = P.x + E.x; V.y = P.y + E.y; V.z = P.z + E.z;
    const vname = NETP.VEHN[P.veh] || 'none', isCar = P.veh >= 2 && P.veh <= 8, isAir = P.veh >= 16, fl = P.flags | 0;
    const r = R.r; r.id = R.id; r.veh = P.veh === 1 ? 'f1' : isCar ? 'car' : isAir ? 'air' : 'none'; r.key = vname; r.col = R.col | 0; r.paint = P.variant | 0;
    r.x = V.x; r.y = V.y; r.z = V.z; r.zs = V.z; r.psi = P.psi; r.pitch = P.pitch; r.roll = P.roll; r.delta = (P.steer || 0)*0.8; r.vx = P.vx; r.vy = P.vy;
    r.v = (P.vx || 0)*Math.cos(P.psi) + (P.vy || 0)*Math.sin(P.psi); r.brake = !!(fl & NFL.BRAKE); r.head = !!(fl & NFL.HEAD); r.rev = !!(fl & NFL.REVERSE); r.indL = !!(fl & NFL.IND_L); r.indR = !!(fl & NFL.IND_R);
    r.hidden = !!(fl & NFL.HIDDEN) || P.veh === 0; r.ghost = R.away || (R.ghostT && performance.now() < R.ghostT) || (N.race && !N.race.go && N.race.mode !== 'f1');
    R.stale = P.mode === 'stale'; if (R.stale && R.lastRecv && performance.now() - R.lastRecv > 4000) r.hidden = true;   // stopped sending (left the car)
    if (r.veh === 'car' || r.veh === 'f1') REM[k++] = r;
    airTick(R, r); tagTick(R, r);
  }
  REM.length = k;
  try { if (window.SGF1 && SGF1.mp) SGF1.mp.remotes(REM); } catch (e){ /* old drive module */ }
  N.delay = dmax || 100;   // the deepest per-player buffer (shown in the state)
}

/* ================= remote aircraft (simple stand-in shapes in the player's colour) and name tags ================= */
const AIRG = {};
function boxGeo(list){   // [[cx, cy, cz, sx, sy, sz, r, g, b], ...] -> one non-indexed geometry with normals and colours (x forward, y up, z right)
  const P = [], Nn = [], Cc = [], F = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  for (const b of list){ const [cx, cy, cz, sx, sy, sz, r, g, bb] = b;
    for (const n of F){ const ax = n[0] ? 0 : n[1] ? 1 : 2, u = (ax + 1) % 3, v = (ax + 2) % 3, s = [sx/2, sy/2, sz/2], c = [cx, cy, cz], q = [];
      for (const [a, bq] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]){ const p = c.slice(); p[ax] += (n[0] + n[1] + n[2])*s[ax]; p[u] += a*s[u]; p[v] += bq*s[v]; q.push(p); }
      const sgn = n[0] + n[1] + n[2], tri = sgn > 0 ? [0, 1, 2, 0, 2, 3] : [0, 2, 1, 0, 3, 2];
      for (const i of tri){ P.push(...q[i]); Nn.push(...n); Cc.push(r, g, bb); } } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3)); return g;
}
function airGeo(key){
  if (AIRG[key]) return AIRG[key]; const W = 0.92, Gy = 0.55;   // white, grey; the paint (1,1,1 here) is tinted by the material colour
  let L;
  if (key === 'dragonfly') L = [[0, 1.2, 0, 4.2, 1.9, 1.9, 1, 1, 1], [-4.2, 1.5, 0, 4.4, 0.35, 0.35, 1, 1, 1], [-6.2, 2.1, 0, 0.9, 1.4, 0.15, 1, 1, 1], [0, 2.45, 0, 10.7, 0.05, 0.5, Gy, Gy, Gy], [0, 2.45, 0, 0.5, 0.05, 10.7, Gy, Gy, Gy], [0, 0.2, 0, 3.4, 0.12, 2.2, Gy, Gy, Gy]];
  else if (key === 'hummingbird') L = [[0, 0.15, 0, 0.35, 0.15, 0.35, 1, 1, 1], [0, 0.15, 0, 0.9, 0.05, 0.08, Gy, Gy, Gy], [0, 0.15, 0, 0.08, 0.05, 0.9, Gy, Gy, Gy]];
  else if (key === 'petrel') L = [[0, 2.2, 0, 37.6, 4, 4, W, W, W], [0, 1.6, 0, 6, 0.5, 35.8, W, W, W], [-15.5, 3, 0, 3.5, 0.3, 12.5, W, W, W], [-15.8, 6.5, 0, 4, 6, 0.4, 1, 1, 1], [2, 0.5, -5.8, 4, 2.2, 2.2, Gy, Gy, Gy], [2, 0.5, 5.8, 4, 2.2, 2.2, Gy, Gy, Gy], [0, 2.3, 0, 30, 0.6, 4.1, 1, 1, 1]];
  else if (key === 'swift') L = [[0, 1.5, 0, 16, 2, 2, W, W, W], [0.5, 1, 0, 3, 0.3, 15, W, W, W], [-7, 4.4, 0, 2.4, 0.25, 5.5, W, W, W], [-6.6, 3.2, 0, 2.6, 2.6, 0.3, 1, 1, 1], [-4.5, 2, -1.6, 2.6, 1.1, 1.1, Gy, Gy, Gy], [-4.5, 2, 1.6, 2.6, 1.1, 1.1, Gy, Gy, Gy], [0, 1.55, 0, 12, 0.4, 2.05, 1, 1, 1]];
  else L = [[0, 1.3, 0, 7.6, 1.3, 1.2, W, W, W], [0.6, 2.05, 0, 1.6, 0.15, 11, 1, 1, 1], [-3.4, 1.5, 0, 1.1, 0.12, 3.4, W, W, W], [-3.5, 2.2, 0, 1.2, 1.3, 0.12, 1, 1, 1], [3.9, 1.3, 0, 0.2, 1.8, 0.12, Gy, Gy, Gy], [0.3, 0.45, 0, 1.6, 0.12, 2.2, Gy, Gy, Gy]];
  return AIRG[key] = boxGeo(L);
}
const _ae = new THREE.Euler(0, 0, 0, 'YZX');
function airTick(R, r){
  if (r.veh !== 'air' || r.hidden || !SGR.on){ if (R.air) R.air.visible = false; return; }
  if (!R.air || R.air.userData.key !== r.key){ if (R.air){ scene.remove(R.air); R.air.material.dispose(); }
    const m = new THREE.MeshLambertMaterial({vertexColors:true, color:new THREE.Color(PCOL(R.col))}); R.air = new THREE.Mesh(airGeo(r.key), m); R.air.userData.key = r.key; R.air.castShadow = true; R.air.name = 'net-air'; scene.add(R.air); }
  const A = R.air; A.visible = true; A.position.set(r.x, r.z, -r.y); _ae.set(r.roll || 0, r.psi, r.pitch || 0, 'YZX'); A.rotation.copy(_ae);
}
const _tv = new THREE.Vector3();
function tagTick(R, r){
  if (!N.tagsOn || r.hidden || !SGR.on || (R.stale && !R.away && R.lastRecv && performance.now() - R.lastRecv > 8000)){ if (R.tag) R.tag.hidden = true; return; }
  if (!R.tag){ const d = document.createElement('div'); d.className = 'netTag'; d.innerHTML = '<i></i><b></b><small></small>'; document.body.appendChild(d); R.tag = d; R.tagK = ''; }
  const up = r.veh === 'air' ? 6 : r.key === 'bus' ? 4.2 : 2.3; _tv.set(r.x, r.z + up, -r.y);
  const cam = camera, dist = cam.position.distanceTo(_tv); _tv.project(cam);
  if (_tv.z > 1 || _tv.z < -1 || dist > 4000 || Math.abs(_tv.x) > 1.2 || Math.abs(_tv.y) > 1.2){ R.tag.hidden = true; return; }
  const x = (_tv.x*0.5 + 0.5)*innerWidth, y = (-_tv.y*0.5 + 0.5)*innerHeight, s = Math.max(0.6, Math.min(1, 160/Math.max(1, dist)) + 0.25);
  R.tag.hidden = false; R.tag.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) translate(-50%,-100%) scale(${s.toFixed(2)})`;
  const key = R.name + '|' + R.col + '|' + (R.away ? 1 : 0) + '|' + Math.round(dist/10);
  if (key !== R.tagK){ R.tagK = key; R.tag.firstChild.style.background = PCOL(R.col); R.tag.children[1].textContent = R.name; R.tag.children[2].textContent = R.away ? '离线 away' : dist > 60 ? Math.round(dist) + ' m' : ''; R.tag.classList.toggle('away', !!R.away); }
}

/* ================= spectator camera ================= */
function specList(){ return [...N.players.values()].filter(R => R.buf && R.buf.length && R.r && !R.r.hidden && R.r.veh !== 'none'); }
function startSpectate(id){
  try { if (F1on()) SGF1.exit(); } catch (e){ /* optional */ } try { if (FLYon()) SGFly.exit(); } catch (e){ /* optional */ }
  const L = specList(); N.spec.on = true; N.spec.id = id || (L[0] && L[0].id) || null; N.spec.pos = null; N.spec.savedEn = controls.enabled; N.spec.near = camera.near; document.body.classList.add('netspec'); uiRefresh();
}
function stopSpectate(){ if (!N.spec.on) return; N.spec.on = false; document.body.classList.remove('netspec'); controls.enabled = N.spec.savedEn !== false; if (N.spec.near){ camera.near = N.spec.near; camera.updateProjectionMatrix(); } N.spec.pos = null; uiRefresh(); }
function specCycle(d){ const L = specList(); if (!L.length) return; let i = L.findIndex(R => R.id === N.spec.id); i = ((i + d) % L.length + L.length) % L.length; N.spec.id = L[i].id; N.spec.pos = null; uiRefresh(); }
const _sp = new THREE.Vector3(), _sl = new THREE.Vector3();
function specCam(dt){
  if (!N.spec.on || F1on() || FLYon()) return;
  let R = N.players.get(N.spec.id); if (!R || !R.vis){ const L = specList(); if (L.length){ N.spec.id = L[0].id; R = L[0]; uiRefresh(); } }
  if (!R || !R.vis || !R.r) return; const r = R.r, cs = Math.cos(r.psi), sn = Math.sin(r.psi);
  if (N.spec.mode === 'orbit'){ const T = controls.target; _sl.set(r.x - T.x, r.z - T.y, -r.y - T.z); if (_sl.lengthSq() > 4e6){ controls.target.set(r.x, r.z, -r.y); camera.position.set(r.x - cs*40, r.z + 25, -(r.y - sn*40)); } else { camera.position.add(_sl); T.add(_sl); } controls.enabled = true; return; }
  controls.enabled = false;
  const back = r.veh === 'air' ? (r.key === 'petrel' ? 70 : 28) : r.key === 'bus' ? 18 : 9.5, up = r.veh === 'air' ? back*0.3 : r.key === 'bus' ? 5.5 : 3.2;
  _sp.set(r.x - cs*back, r.z + up, -(r.y - sn*back));
  if (!N.spec.pos){ N.spec.pos = _sp.clone(); } else N.spec.pos.lerp(_sp, 1 - Math.exp(-dt*5));
  camera.position.copy(N.spec.pos); _sl.set(r.x + cs*6, r.z + 1.2, -(r.y + sn*6)); camera.up.set(0, 1, 0); camera.lookAt(_sl);
  controls.target.set(r.x, r.z, -r.y); camera.near = 0.5; camera.updateProjectionMatrix();
}

/* ================= the per-frame work ================= */
function netFrame(t, dt){
  if (!N.room){ if (N.st === 'open') pingTick(); return; }
  pingTick();
  // snapshots at snapHz (accumulated so the rate holds at any frame rate)
  N.sendAcc += dt; const per = 1/N.snapHz; if (N.sendAcc >= per){ N.sendAcc = Math.min(N.sendAcc - per, per); sendSnap(); }
  remoteTick(dt);
  const R = N.race;
  if (R){ const now = srvNow();
    if (!R.go && now >= R.startAt){ R.go = true; }
    if (R.mode === 'cityrace' || R.mode === 'escape'){
      if (!R.go){ const s = Math.ceil((R.startAt - now)/1000); if (R.mode === 'escape' || !(window.SGRace && SGRace.start)) uiBig(s > 0 ? String(s) : '', 0, 'count');
        // keep the grid spot until the start (a route module may put the car on the start line)
        if (R.grid && F1on() && window.SGF1 && SGF1.mp){ const L = SGF1.mp.local(LOC); if (Math.hypot(L.x - R.grid[0], L.y - R.grid[1]) > 4 && Math.abs(L.u) < 0.5) SGF1.mp.place(R.grid[0], R.grid[1], R.grid[2]); } }
      else if (R.goShown !== true){ R.goShown = true; if (R.mode === 'escape') uiBig('快逃！RUN!', 1500, 'go'); else if (!(window.SGRace && SGRace.start)) uiBig('出发！GO!', 1200, 'go'); }
    }
    if (R.mode === 'cityrace' && R.go && R.slot >= 0 && window.SGRace && SGRace.progress){ try { const p = SGRace.progress(); if (p && (p.cp | 0) > R.cp){ for (let c = R.cp + 1; c <= (p.cp | 0); c++) send({t:'ev', k:'cp', cp:c, rt:+((now - R.startAt)/1000).toFixed(3), ncp:p.ncp}); R.cp = p.cp | 0; if (p.finished) R.fin = true; } } catch (e){ /* optional */ }
      // the others for the race HUD: checkpoints passed, metres to their next checkpoint (from their route metres), position, colour
      if ((N.oppT = (N.oppT || 0) + dt) > 0.25){ N.oppT = 0; const Rt = N.route, nc = Rt ? Rt.cps.length : 0;
        try { SGRace.setOpponents && SGRace.setOpponents([...N.players.values()].filter(Q => Q.pose && Q.buf && Q.buf.length && Q.vis).map(Q => { const rk = N.rank && N.rank.find(x => x.id === Q.id), cp = Q.pose.pi | 0, nx = nc ? Rt.cps[Math.min(cp, nc - 1)] : null;
          return {id:Q.id, name:Q.name, cp, dist:nx ? Math.max(0, nx.s - (Q.pose.pm || 0)) : 0, t:rk && rk.fin != null ? rk.fin : null, finished:!!(rk && rk.fin != null), x:Q.vis.x, y:Q.vis.y, color:PCOL(Q.col)}; })); } catch (e){ /* optional */ } } }
    if (R.mode === 'escape'){
      if (R.go && !N.kj.on && !N.results && N.room.state !== 'results' && N.room.state !== 'lobby') kaijuStart();
      if (N.kj.owner && N.kj.on && window.SGKaiju){ const K = SGKaiju;
        if (now - N.kj.last > 100){ N.kj.last = now; try { const s = K.state && K.state(); if (s) send({t:'ev', k:'kj', s}); } catch (e){ /* optional */ } }
        if (now - N.kj.tgtT > 250){ N.kj.tgtT = now; const T = [];
          if (R.slot >= 0 && F1on() && !(R.me && (R.me.caught || R.me.extracted))){ const L = readLocal(); if (L.ok) T.push({id:N.id, x:L.x, y:L.y, z:L.z}); }
          const rk = new Map((N.rank || []).map(x => [x.id, x]));
          for (const Q of N.players.values()){ const x = rk.get(Q.id); if (Q.vis && Q.r && !Q.r.hidden && Q.r.veh !== 'none' && !(x && (x.caught || x.extracted || x.dnf))) T.push({id:Q.id, x:Q.vis.x, y:Q.vis.y, z:Q.vis.z}); }
          try { K.setTargets && K.setTargets(T); } catch (e){ /* optional */ } } }
      if (N.esc){ showBeacon(N.esc); if (R.go && !N.extSent && F1on() && R.slot >= 0){ const L = readLocal(); if (L.ok && Math.hypot(L.x - N.esc.x, L.y - N.esc.y) < N.esc.r){ N.extSent = true; send({t:'ev', k:'extract'}); } } }
    }
    // leaving the car during a race = retiring (then spectating)
    if (R.go && R.slot >= 0 && !R.fin && !R.retired && N.room.state === 'racing' && (R.mode === 'f1' || R.mode === 'cityrace') && !F1on() && !N.spec.on){ R.retired = true; retire(); startSpectate(); }
  }
  hudTick(dt);
}
function pingTick(){ const t = performance.now(), gap = N.pingN < 6 ? 250 : 2000; if (t - N.pingT > gap && N.st === 'open'){ N.pingT = t; N.pingN++; send({t:'ping', c:t, r:Math.round(N.clock.rtt)}); } }
HOOKS.frame.push((t, dt) => netFrame(t, dt));
HOOKS.prerender.push((t, dt) => specCam(Math.min(0.1, dt || 1/60)));

/* ================= the extraction beacon (escape) ================= */
let BEACON = null;
function showBeacon(E){
  if (!SGR.on) return;
  if (!BEACON){ const g = new THREE.CylinderGeometry(1, 1, 1, 24, 1, true); const m = new THREE.MeshBasicMaterial({color:0x39e6a0, transparent:true, opacity:0.32, depthWrite:false, side:THREE.DoubleSide, blending:THREE.AdditiveBlending});
    BEACON = new THREE.Mesh(g, m); BEACON.renderOrder = 6; BEACON.name = 'net-beacon'; scene.add(BEACON); }
  const z = typeof hC === 'function' ? hC(E.x, E.y) : 0, h = 260; BEACON.visible = true; BEACON.position.set(E.x, z + h/2, -E.y); BEACON.scale.set(E.r*0.35, h, E.r*0.35);
  BEACON.material.opacity = 0.22 + 0.12*Math.sin(performance.now()/300);
}
function hideBeacon(){ if (BEACON) BEACON.visible = false; }

/* ================= UI: the dock tab and tray pane, the in-game panel, chat, results, the city dialog ================= */
const NET_CSS = `
.dock-tabs{grid-template-columns:repeat(8,minmax(0,1fr))!important}
.dock-tabs .dtab{min-width:0;overflow:hidden}.dock-tabs .dtab small{overflow:hidden;text-overflow:ellipsis;max-width:100%}
.dtab.nettab i{background:#1d2f3b;color:#7cc8ff}
.netpane{display:flex;flex-direction:column;gap:9px;font-size:12px;min-height:0;overflow-y:auto;flex:1 1 auto}#tray:has(> .netpane:not([hidden])){overflow:hidden}
.netpane .row{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
.netpane input[type=text]{flex:1;min-width:0;font:inherit;padding:6px 8px;border:1px solid var(--rule);border-radius:7px;background:var(--panel);color:var(--ink)}
.netpane button.nb{appearance:none;font:inherit;font-size:12px;padding:6px 10px;border:1px solid var(--rule);border-radius:7px;background:var(--panel);color:var(--ink);cursor:pointer;white-space:nowrap}
.netpane button.nb:hover{border-color:var(--ink)} .netpane button.nb.pri{background:#1d2f3b;color:#fff;border-color:#1d2f3b} .netpane button.nb:disabled{opacity:.45;cursor:default}
.netpane button.nb[aria-pressed=true]{background:var(--ink);color:var(--panel)}
.netpane h4{margin:2px 0 0;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);font-weight:600}
.netpane .dot{width:8px;height:8px;border-radius:50%;background:#999;display:inline-block}
.netpane .dot.open{background:#2bb673}.netpane .dot.connecting,.netpane .dot.retry{background:#e6a23c}
.netpane .sw{display:flex;gap:4px;flex-wrap:wrap}.netpane .sw button{width:20px;height:20px;border-radius:5px;border:2px solid transparent;cursor:pointer;padding:0}
.netpane .sw button[aria-pressed=true]{border-color:var(--ink);box-shadow:0 0 0 1px var(--panel) inset}
.netpane .modes{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.netpane .modes button{text-align:left;padding:7px 8px;border:1px solid var(--rule);border-radius:8px;background:var(--panel);color:var(--ink);cursor:pointer;font:inherit;display:flex;flex-direction:column;gap:1px}
.netpane .modes button b{font-size:12.5px}.netpane .modes button small{font:400 10px/1.3 var(--font-mono);color:var(--muted)}
.netpane .modes button[aria-pressed=true]{border-color:var(--ink);background:var(--panel-2)}.netpane .modes button:disabled{opacity:.4}
.netpane ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:3px}
.netpane li{display:grid;grid-template-columns:auto 1fr auto;gap:7px;align-items:center;padding:5px 7px;border:1px solid var(--rule);border-radius:7px}
.netpane li i{width:10px;height:10px;border-radius:3px;display:inline-block}
.netpane li small{font:400 10px var(--font-mono);color:var(--muted)}
.netpane .code{font:600 24px/1 var(--font-mono);letter-spacing:.12em}
.netpane .card{border:1px solid var(--rule);border-radius:9px;padding:9px;display:flex;flex-direction:column;gap:7px;background:var(--panel-2)}
.netpane .msg{font-size:11px;color:#b5651d}
.netpane .muted{color:var(--muted);font-size:11px}
.netpane .pchat{display:flex;flex-direction:column;gap:5px}.netpane .pchat .log{display:flex;flex-direction:column;gap:2px;font-size:11.5px;max-height:120px;overflow:auto}
.netpane .pchat .log p{margin:0}.netpane .pchat .log p.sys{color:var(--muted);font-size:10.5px}
.netTag{position:fixed;left:0;top:0;z-index:5;pointer-events:none;display:flex;align-items:center;gap:4px;padding:2px 6px 2px 3px;border-radius:5px;background:rgba(12,17,20,.62);color:#fff;font:600 11px/1.2 var(--font-ui);white-space:nowrap;transform-origin:50% 100%}
.netTag i{width:4px;height:13px;border-radius:2px}.netTag small{font:400 9.5px var(--font-mono);color:#b9c6cc}.netTag.away{opacity:.5}
.netHud{position:fixed;right:16px;top:calc(120px + env(safe-area-inset-top,0px));width:236px;z-index:7;color:#eef2f3;font-family:var(--font-ui);display:flex;flex-direction:column;gap:6px;pointer-events:none}
.netHud[hidden]{display:none}
.netHud>*{pointer-events:auto;background:rgba(12,17,20,.74);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:8px 10px;box-shadow:0 8px 26px rgba(0,0,0,.22)}
.netHud .hd{display:flex;gap:6px;align-items:baseline;font:600 13px var(--font-mono)}.netHud .hd small{font:400 10px var(--font-mono);color:#9fb0b8;margin-left:auto}
.netHud .st{font-size:11px;color:#cfd8dc;margin-top:3px}
.netHud ol{list-style:none;margin:5px 0 0;padding:0;display:flex;flex-direction:column;gap:2px;font:500 11px/1.25 var(--font-mono)}
.netHud ol li{display:grid;grid-template-columns:16px 4px 1fr auto;gap:6px;align-items:center;padding:1px 3px;border-radius:3px}.netHud ol li i{height:11px;border-radius:2px}
.netHud ol li.me{background:rgba(255,255,255,.14)}.netHud ol li small{color:#9fb0b8;font-size:10px}.netHud ol li.out{opacity:.5}
.netHud .chat[hidden]{display:none}.netHud .chat{display:flex;flex-direction:column;gap:3px;font-size:11.5px;max-height:150px;overflow:hidden}
.netHud .chat p{margin:0;line-height:1.3;word-break:break-word}.netHud .chat p b{font-weight:600}.netHud .chat p.sys{color:#9fb0b8;font-size:10.5px}
.netHud .chat input{font:inherit;width:100%;box-sizing:border-box;padding:5px 7px;border-radius:6px;border:1px solid rgba(255,255,255,.2);background:rgba(0,0,0,.35);color:#fff}
body.netspec .panel,body.netspec .stats,body.netspec .dock,body.netspec .timebar,body.netspec .scalebar,body.netspec #labels,body.netspec .uihint,body.netspec #tray{display:none!important}
.netHud .spec{display:flex;align-items:center;gap:6px;font-size:12px}.netHud .spec b{flex:1;text-align:center}
.netHud button{appearance:none;font:inherit;font-size:11px;padding:4px 8px;border-radius:6px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.08);color:#fff;cursor:pointer}
.netBig{position:fixed;left:50%;top:32%;transform:translate(-50%,-50%);z-index:8;pointer-events:none;font:700 64px/1 var(--font-mono);color:#fff;text-shadow:0 4px 18px rgba(0,0,0,.5);letter-spacing:.04em;text-align:center}
.netBig.go{color:#7dffb0}.netBig.warn{color:#ff8a7a}.netBig.count{font-size:96px}.netBig small{display:block;font:500 15px var(--font-ui);margin-top:10px;color:#e0e6e8}
.netDlg{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:9;width:min(420px,calc(100vw - 32px));max-height:80vh;overflow:auto;box-sizing:border-box;background:rgba(12,17,20,.9);color:#eef2f3;border:1px solid rgba(255,255,255,.14);border-radius:12px;padding:14px 16px;font-family:var(--font-ui);box-shadow:0 18px 50px rgba(0,0,0,.4)}
.netDlg[hidden]{display:none}.netDlg h3{margin:0 0 4px;font-size:17px}.netDlg p{margin:4px 0 10px;font-size:12.5px;color:#cfd8dc}
.netDlg ol{list-style:none;margin:8px 0;padding:0;display:flex;flex-direction:column;gap:3px;font:500 12px var(--font-mono)}
.netDlg ol li{display:grid;grid-template-columns:22px 5px 1fr auto;gap:8px;align-items:center;padding:4px 6px;border-radius:5px;background:rgba(255,255,255,.05)}.netDlg ol li.me{background:rgba(255,255,255,.16)}
.netDlg ol li i{height:13px;border-radius:2px}.netDlg ol li small{color:#9fb0b8}
.netDlg .btns{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.netDlg button{appearance:none;font:inherit;font-size:12.5px;padding:7px 12px;border-radius:8px;border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.08);color:#fff;cursor:pointer}
.netDlg button.pri{background:#2a6f97;border-color:#2a6f97}
@media (max-width:760px){.netHud{width:200px;right:8px;top:calc(96px + env(safe-area-inset-top,0px))}.netHud .chat{max-height:90px}.netBig{font-size:44px}.netBig.count{font-size:64px}}
`;
const svgNet = '<svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><circle cx="7" cy="7" r="2.6" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="14" cy="8.5" r="2.1" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M2.5 16.5c.6-2.9 2.4-4.4 4.5-4.4s3.9 1.5 4.5 4.4M11.6 13c.6-.9 1.4-1.4 2.4-1.4 1.8 0 3.1 1.2 3.6 3.6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
const UI = {pane:null, hud:null, big:null, dlg:null, res:null, q:{}, mode:'free', cfg:{laps:3, diff:1, time:180, routeId:'', species:'cthulhu'}, priv:false, bigT:null, msgT:null};
function buildUI(){
  if (document.getElementById('netHud')) return;
  const st = document.createElement('style'); st.textContent = NET_CSS; document.head.appendChild(st);
  const tabs = document.querySelector('.dock-tabs'), tray = document.getElementById('tray'), foot = document.getElementById('brushRow');
  if (tabs && tray){
    if (typeof CATS !== 'undefined') CATS.mp = ['多人', 'Multiplayer', 'view', '和朋友一起：F1 赛道赛、城市街道赛、逃离克苏鲁、自由巡游'];
    const b = document.createElement('button'); b.className = 'dtab nettab'; b.setAttribute('role', 'tab'); b.dataset.cat = 'mp'; b.setAttribute('aria-selected', 'false'); b.id = 'netTab';
    b.innerHTML = `<i>${svgNet}</i><span>多人</span><small>Multiplayer</small>`; b.title = '多人 · Multiplayer'; tabs.appendChild(b);
    b.addEventListener('click', () => { const tr = document.getElementById('tray'); if (typeof dockCat !== 'undefined' && dockCat === 'mp' && !tr.classList.contains('closed')){ tr.classList.add('closed'); return; } if (typeof showCat === 'function') showCat('mp', true); const br = document.getElementById('brushRow'); if (br) br.hidden = true; uiRefresh(); if (N.st === 'open') send({t:'list'}); });
    const p = document.createElement('div'); p.className = 'tray-pane netpane'; p.dataset.cat = 'mp'; p.hidden = true; p.dataset.tab = '1'; tray.insertBefore(p, foot || null); UI.pane = p;
    p.innerHTML = `
<div class="row"><span class="dot" id="netDot"></span><input type="text" id="netUrl" placeholder="wss://game.example.com" aria-label="服务器 Server" spellcheck="false"><button class="nb" id="netConn" type="button">连接 Connect</button></div>
<div class="row"><input type="text" id="netName" maxlength="16" aria-label="名字 Name" placeholder="名字 Name"><div class="sw" id="netSw" role="group" aria-label="颜色 Colour"></div></div>
<div class="msg" id="netMsg" hidden></div>
<div id="netLobby">
  <h4>创建房间 · Create a room</h4>
  <div class="modes" id="netModes">
    <button type="button" data-m="f1"><b>F1 赛道赛</b><small>${city() === 'nyc' ? 'Brooklyn · 布鲁克林' : city() === 'sg' ? 'Marina Bay · 滨海湾' : '新加坡 · 纽约 SG · NYC only'}</small></button>
    <button type="button" data-m="cityrace"><b>城市街道赛</b><small>City race · same route</small></button>
    <button type="button" data-m="escape"><b>逃离克苏鲁</b><small>Escape the creature</small></button>
    <button type="button" data-m="free"><b>自由巡游</b><small>Free cruise · join anytime</small></button>
  </div>
  <div class="row" id="netOpts"></div>
  <div class="row"><label class="muted"><input type="checkbox" id="netPriv"> 私人房间 private (code only)</label><span style="flex:1"></span><button class="nb pri" id="netCreate" type="button">创建 Create</button></div>
  <h4>加入 · Join</h4>
  <div class="row"><input type="text" id="netCode" maxlength="6" placeholder="房间码 CODE" style="text-transform:uppercase;font-family:var(--font-mono);letter-spacing:.1em"><button class="nb pri" id="netJoin" type="button">加入 Join</button><button class="nb" id="netRefresh" type="button" title="刷新 Refresh">↻</button></div>
  <ul id="netRooms"></ul>
</div>
<div id="netRoom" hidden></div>
<div class="pchat" id="netPChat" hidden><div class="log" id="netPLog"></div><input type="text" id="netPIn" maxlength="160" placeholder="聊天 Chat (Enter)"></div>`;
    UI.q = {dot:p.querySelector('#netDot'), url:p.querySelector('#netUrl'), conn:p.querySelector('#netConn'), name:p.querySelector('#netName'), sw:p.querySelector('#netSw'), msg:p.querySelector('#netMsg'),
      lobby:p.querySelector('#netLobby'), modes:p.querySelector('#netModes'), opts:p.querySelector('#netOpts'), priv:p.querySelector('#netPriv'), create:p.querySelector('#netCreate'), code:p.querySelector('#netCode'),
      join:p.querySelector('#netJoin'), refresh:p.querySelector('#netRefresh'), rooms:p.querySelector('#netRooms'), room:p.querySelector('#netRoom'), pchat:p.querySelector('#netPChat'), plog:p.querySelector('#netPLog'), pin:p.querySelector('#netPIn')};
    const q = UI.q;
    q.url.value = N.url || defaultUrl(); q.name.value = N.name;
    q.sw.innerHTML = PAL0.map((c, i) => `<button type="button" data-c="${i}" style="background:${PCOL(i)}" aria-label="颜色 colour ${i + 1}" aria-pressed="${i === N.col}"></button>`).join('');
    q.sw.addEventListener('click', e => { const c = e.target.dataset && e.target.dataset.c; if (c === undefined) return; N.col = +c; savePrefs(); q.sw.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(+x.dataset.c === N.col))); });
    q.name.addEventListener('change', () => { N.name = q.name.value.trim().slice(0, 16) || N.name; q.name.value = N.name; savePrefs(); send({t:'name', name:N.name}); });
    q.conn.addEventListener('click', () => { if (N.st === 'open' || N.st === 'connecting' || N.st === 'retry'){ if (N.room) leave(); disconnect(); return; } N.savedUrl = normUrl(q.url.value); savePrefs(); connect(q.url.value); });
    q.url.addEventListener('keydown', e => { if (e.key === 'Enter') q.conn.click(); });
    q.modes.addEventListener('click', e => { const b = e.target.closest('button[data-m]'); if (!b || b.disabled) return; UI.mode = b.dataset.m; uiModes(); });
    q.create.addEventListener('click', () => { const c = {}; if (UI.mode === 'f1' || UI.mode === 'cityrace') c.laps = UI.cfg.laps; if (UI.mode === 'escape'){ c.diff = UI.cfg.diff; c.time = UI.cfg.time; c.species = UI.cfg.species || 'cthulhu'; } if ((UI.mode === 'cityrace' || UI.mode === 'escape') && UI.cfg.routeId) c.routeId = UI.cfg.routeId;
      create(UI.mode, {cfg:c, priv:q.priv.checked}); });
    q.join.addEventListener('click', () => join(q.code.value)); q.code.addEventListener('keydown', e => { if (e.key === 'Enter') join(q.code.value); });
    q.refresh.addEventListener('click', () => { if (N.st === 'open') send({t:'list'}); else connect(); });
    q.rooms.addEventListener('click', e => { const b = e.target.closest('button[data-code]'); if (!b) return; if (b.dataset.city && b.dataset.city !== city()) cityDialog(b.dataset.city, b.dataset.code); else join(b.dataset.code); });
    q.room.addEventListener('click', e => { const b = e.target.closest('button[data-a]'); if (!b) return; const a = b.dataset.a;
      if (a === 'ready') send({t:'ready', v:!(N.me && N.me.ready)}); else if (a === 'start') startRoom(); else if (a === 'leave') leave();
      else if (a === 'drive'){ ensureDriving(); } else if (a === 'spec'){ N.spec.on ? stopSpectate() : startSpectate(); } else if (a === 'goto') gotoPlayer(b.dataset.id);
      else if (a === 'laps'){ send({t:'cfg', cfg:{laps:+b.dataset.v}}); } else if (a === 'copy'){ try { navigator.clipboard.writeText(shareLink()); uiMsg('链接已复制 · Link copied'); } catch (_){ uiMsg(shareLink()); } } });
    q.pin.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter'){ const t = q.pin.value.trim(); if (t) send({t:'chat', text:t}); q.pin.value = ''; } });
    q.pin.addEventListener('keyup', e => e.stopPropagation());
    uiModes();
  }
  // in-game panel (visible while in a room), big centre text, dialogs
  const h = document.createElement('div'); h.className = 'netHud'; h.id = 'netHud'; h.hidden = true;
  h.innerHTML = `<div id="netHB"><div class="hd"><span id="netHCode">—</span><span id="netHMode"></span><small id="netHPing"></small></div><div class="st" id="netHSt"></div><ol id="netHRank"></ol></div>
<div id="netSpec" class="spec" hidden><button type="button" data-s="-1">◀</button><b id="netSpecN">—</b><button type="button" data-s="1">▶</button><button type="button" data-s="m" title="追尾 / 环绕 Chase / orbit">🎥</button><button type="button" data-s="x" title="停止观战 Stop watching">✕</button></div>
<div class="chat" id="netChat"><div id="netChatL"></div><input type="text" id="netChatIn" maxlength="160" placeholder="T 聊天 · chat (Enter)" hidden></div>`;
  document.body.appendChild(h); UI.hud = h;
  UI.big = document.createElement('div'); UI.big.className = 'netBig'; UI.big.hidden = true; document.body.appendChild(UI.big);
  UI.dlg = document.createElement('div'); UI.dlg.className = 'netDlg'; UI.dlg.hidden = true; document.body.appendChild(UI.dlg);
  UI.res = document.createElement('div'); UI.res.className = 'netDlg'; UI.res.id = 'netRes'; UI.res.hidden = true; document.body.appendChild(UI.res);
  const ci = h.querySelector('#netChatIn');
  ci.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter'){ const t = ci.value.trim(); if (t) send({t:'chat', text:t}); ci.value = ''; ci.hidden = true; ci.blur(); } else if (e.key === 'Escape'){ ci.value = ''; ci.hidden = true; ci.blur(); } });
  ci.addEventListener('keyup', e => e.stopPropagation());
  h.querySelector('#netChatL').addEventListener('click', () => openChat());
  h.querySelector('#netSpec').addEventListener('click', e => { const s = e.target.dataset && e.target.dataset.s; if (!s) return; if (s === 'm'){ N.spec.mode = N.spec.mode === 'chase' ? 'orbit' : 'chase'; N.spec.pos = null; } else if (s === 'x') stopSpectate(); else specCycle(+s); });
  UI.res.addEventListener('click', e => { const b = e.target.closest('button[data-a]'); if (!b) return; const a = b.dataset.a; uiResults(false);
    if (a === 'again'){ send({t:'reset'}); setTimeout(() => startRoom(), 200); } else if (a === 'lobby'){ send({t:'reset'}); endRace(); } else if (a === 'drive'){ endRace(); stopSpectate(); ensureDriving(); } else if (a === 'leave') leave(); else endRace(); });
  // chat / spectator keys while driving (the drive module consumes keys first: its hook), and when not driving
  try { window.SGF1 && SGF1.mp && SGF1.mp.key((c) => { if (!N.room) return false; if (c === 'KeyT' || c === 'Enter'){ openChat(); return true; } return false; }); } catch (e){ /* old drive module */ }
  addEventListener('keydown', e => { if (!N.room) return; const t = e.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return; if (F1on() || FLYon()) return;
    if (e.code === 'KeyT' || (e.code === 'Enter' && !e.repeat)){ openChat(); e.preventDefault(); } else if (N.spec.on && (e.code === 'Tab' || e.code === 'BracketRight')){ specCycle(1); e.preventDefault(); } else if (N.spec.on && e.code === 'BracketLeft'){ specCycle(-1); e.preventDefault(); } });
}
function openChat(){ const ci = UI.hud && UI.hud.querySelector('#netChatIn'); if (!ci) return; ci.hidden = false; ci.parentNode.hidden = false; setTimeout(() => ci.focus(), 0); }
function startRoom(){ const L = readLocal(); send({t:'start', at:L.ok ? {x:+L.x.toFixed(1), y:+L.y.toFixed(1), hdg:+L.psi.toFixed(3)} : (N.lastLocal ? {x:N.lastLocal.x, y:N.lastLocal.y, hdg:N.lastLocal.psi} : null)}); }
function shareLink(){ const u = new URL(location.href); u.hash = ''; u.searchParams.set('server', N.url); if (N.room) u.searchParams.set('join', N.room.code); return u.href; }
function gotoPlayer(id){ const R = N.players.get(id); if (!R || !R.vis) return; if (!ensureDriving()) return; const r = R.r, cs = Math.cos(r.psi), sn = Math.sin(r.psi); try { SGF1.mp.place(r.x - cs*14, r.y - sn*14, r.psi); } catch (e){ /* optional */ } }
function uiMsg(t, cls){ if (typeof showToast === 'function') showToast(t); const m = UI.q.msg; if (!m) return; m.textContent = t; m.hidden = false; m.className = 'msg' + (cls ? ' ' + cls : ''); clearTimeout(UI.msgT); UI.msgT = setTimeout(() => { m.hidden = true; }, 6000); }
function uiBig(t, ms, cls){ const b = UI.big; if (!b) return; if (!t){ b.hidden = true; return; } if (b.textContent !== t || b.hidden){ b.textContent = t; } b.className = 'netBig' + (cls ? ' ' + cls : ''); b.hidden = false; clearTimeout(UI.bigT); if (ms) UI.bigT = setTimeout(() => { b.hidden = true; }, ms); }
// the curated routes of this map (SGRace.routes) as a select; '' = a random route from the server's seed
function routeSel(c, none){ let opts = `<option value="">${none}</option>`; try { if (window.SGRace && SGRace.routes) for (const r of SGRace.routes(c) || []){ const id = r.id || (r.route && r.route.id), nm = r.name || r.zh || id; if (id) opts += `<option value="${esc(id)}" ${UI.cfg.routeId === id ? 'selected' : ''}>${esc(Array.isArray(nm) ? nm.join(' · ') : nm)}</option>`; } } catch (e){ /* optional */ }
  return `<select id="netRoute" class="nb">${opts}</select>`; }
function uiModes(){ const q = UI.q; if (!q.modes) return; const c = city();
  q.modes.querySelectorAll('button[data-m]').forEach(b => { b.setAttribute('aria-pressed', String(b.dataset.m === UI.mode)); if (b.dataset.m === 'f1') b.title = F1CITIES.includes(c) ? '' : '只在新加坡和纽约地图 · Singapore and New York maps only'; });
  const lapSeg = `<span class="muted">圈数 Laps</span>${[1, 3, 5].map(n => `<button class="nb" type="button" data-laps="${n}" aria-pressed="${UI.cfg.laps === n}">${n}</button>`).join('')}`;
  let h = '';
  if (UI.mode === 'f1') h = lapSeg + '<span class="muted">· 无 AI 车 no AI cars</span>';
  else if (UI.mode === 'cityrace') h = routeSel(c, '随机路线 Random route') + (window.SGRace ? '' : '<span class="msg">（这个页面没有城市赛模块 · no city-race module on this page）</span>');
  else if (UI.mode === 'escape') h = routeSel(c, '随机地点 Random place') + `<span class="muted">难度 Difficulty</span>${[['0', '易 easy'], ['1', '中 normal'], ['2', '难 hard']].map(([v, n]) => `<button class="nb" type="button" data-diff="${v}" aria-pressed="${UI.cfg.diff === +v}">${n}</button>`).join('')}<span class="muted">${UI.cfg.time/60} 分钟 min</span>` + (window.SGKaiju && SGKaiju.species ? `<span style="flex-basis:100%"></span><span class="muted">怪兽 Creature</span>${SGKaiju.species().concat([{id:'random', zh:'随机', en:'Random'}]).map(s => `<button class="nb" type="button" data-sp="${s.id}" aria-pressed="${(UI.cfg.species || 'cthulhu') === s.id}">${s.zh} <small>${s.en}</small></button>`).join('')}` : '') + (window.SGKaiju ? `<span style="flex-basis:100%"></span><span class="muted">不用服务器也能玩 · No server needed:</span><button class="nb pri" type="button" data-solo="1">单人直接玩 Play solo ▸</button>` : '<span class="msg">（没有怪物模块 · no creature module）</span>');
  else h = '<span class="muted">随时加入，开车或飞行都可以 · join anytime, drive or fly</span>';
  q.opts.innerHTML = h;
  q.opts.querySelectorAll('[data-laps]').forEach(b => b.addEventListener('click', () => { UI.cfg.laps = +b.dataset.laps; uiModes(); }));
  q.opts.querySelectorAll('[data-diff]').forEach(b => b.addEventListener('click', () => { UI.cfg.diff = +b.dataset.diff; uiModes(); }));
  q.opts.querySelectorAll('[data-sp]').forEach(b => b.addEventListener('click', () => { UI.cfg.species = b.dataset.sp; uiModes(); }));
  q.opts.querySelectorAll('[data-solo]').forEach(b => b.addEventListener('click', () => { if (window.SGKaiju && SGKaiju.play){ const t = document.getElementById('tray'); if (t) t.classList.add('closed'); SGKaiju.play({difficulty:UI.cfg.diff, species:UI.cfg.species || 'cthulhu'}); } }));
  const rs = q.opts.querySelector('#netRoute'); if (rs) rs.addEventListener('change', () => { UI.cfg.routeId = rs.value; });
  q.create.disabled = UI.mode === 'f1' && !F1CITIES.includes(c);
}
function uiRooms(){ const q = UI.q; if (!q.rooms) return; const c = city();
  if (!N.rooms.length){ q.rooms.innerHTML = `<li><span></span><span class="muted">${N.st === 'open' ? '还没有公开房间 · No public rooms yet' : '未连接 · Not connected'}</span><span></span></li>`; return; }
  q.rooms.innerHTML = N.rooms.map(r => `<li><i style="background:${r.city === c ? '#2bb673' : '#8a96a0'}"></i><span><b style="font-family:var(--font-mono)">${esc(r.code)}</b> ${esc(MODE_N[r.mode] ? MODE_N[r.mode][0] : r.mode)}<br><small>${esc(CITY_N[r.city] ? CITY_N[r.city][1] : r.city)} · ${r.n}/${r.max} · ${esc(STATE_N[r.state] ? STATE_N[r.state][1] : r.state)} · ${esc(r.host)}</small></span>`
    + `<button class="nb" type="button" data-code="${esc(r.code)}" data-city="${esc(r.city)}">${r.city === c ? '加入 Join' : '→ ' + esc(CITY_N[r.city] ? CITY_N[r.city][0] : r.city)}</button></li>`).join(''); }
function uiPlayers(){ uiRoomCard(); uiRank(); }
function uiRoomCard(){
  const q = UI.q; if (!q.room) return; const R = N.room;
  q.lobby.hidden = !!R; q.room.hidden = !R; if (!R) return;
  const host = R.host === N.id, list = R.players.slice().sort((a, b) => (a.grid ?? 99) - (b.grid ?? 99) || a.slot - b.slot), allReady = R.players.every(p => p.id === R.host || p.ready || p.away);
  const idle = R.state === 'lobby' || R.state === 'results';
  q.room.innerHTML = `<div class="card"><div class="row"><span class="code">${esc(R.code)}</span><span><b>${esc(MODE_N[R.mode][0])}</b><br><small class="muted">${esc(MODE_N[R.mode][1])} · ${esc(CITY_N[R.city][0])} · ${esc(STATE_N[R.state] ? STATE_N[R.state][0] + ' ' + STATE_N[R.state][1] : R.state)}</small></span><span style="flex:1"></span><button class="nb" type="button" data-a="copy" title="复制邀请链接 Copy invite link">🔗</button></div>
<ul>${list.map(p => `<li><i style="background:${PCOL(p.col)}"></i><span>${p.id === R.host ? '★ ' : ''}${esc(p.name)}${p.id === N.id ? ' · 你 you' : ''}<br><small>${p.away ? '离线 away' : p.role === 'spec' ? '观战 spectating' : p.ready ? '✓ 准备 ready' : R.mode === 'free' ? '' : '…'}${p.flagged ? ' · ⚠' : ''}</small></span>${p.id !== N.id && R.mode === 'free' ? `<button class="nb" type="button" data-a="goto" data-id="${esc(p.id)}">去 Go</button>` : '<span></span>'}</li>`).join('')}</ul>
${R.mode === 'f1' && host && idle ? `<div class="row"><span class="muted">圈数 Laps</span>${[1, 3, 5].map(n => `<button class="nb" type="button" data-a="laps" data-v="${n}" aria-pressed="${R.cfg.laps === n}">${n}</button>`).join('')}</div>` : ''}
<div class="row">${R.mode === 'free' ? `<button class="nb pri" type="button" data-a="drive">开车 Drive</button>` : idle ? (host ? `<button class="nb pri" type="button" data-a="start" ${allReady ? '' : 'title="还有人没准备好 · not everyone is ready"'}>开始 Start${allReady ? '' : ' (!)'}</button>` : `<button class="nb pri" type="button" data-a="ready" aria-pressed="${!!(N.me && N.me.ready)}">${N.me && N.me.ready ? '✓ 已准备 Ready' : '准备 Ready'}</button>`) : ''}
<button class="nb" type="button" data-a="spec">${N.spec.on ? '停止观战 Stop watching' : '观战 Spectate'}</button><span style="flex:1"></span><button class="nb" type="button" data-a="leave">离开 Leave</button></div>
${R.mode === 'f1' && !F1CITIES.includes(city()) ? '<div class="msg">F1 赛道赛在新加坡和纽约地图 · The F1 race is on the Singapore and New York maps</div>' : ''}</div>`;
}
function uiRank(){
  const h = UI.hud; if (!h) return; const R = N.room; h.hidden = !R || paneOpen(); if (UI.q.pchat) UI.q.pchat.hidden = !R; if (!R) return;
  h.querySelector('#netHCode').textContent = R.code; h.querySelector('#netHMode').textContent = MODE_N[R.mode][0];
  const L = N.rank && (R.state === 'racing' || R.state === 'results' || R.state === 'countdown') ? N.rank : R.players.map(p => ({id:p.id, name:p.name, col:p.col, away:p.away}));
  const showRank = !(N.race && N.race.mode === 'f1' && F1on());     // the F1 timing tower shows it while racing
  const ol = h.querySelector('#netHRank'); ol.hidden = !showRank;
  if (showRank) ol.innerHTML = L.slice(0, 12).map((r, i) => { const s = r.extracted ? '逃脱 OUT' : r.caught ? '被抓 CAUGHT' : r.dnf ? 'DNF' : r.fin != null ? fmtS(r.fin) : r.away ? 'away' : R.mode === 'cityrace' && r.cp != null ? 'CP ' + r.cp : r.gap != null ? '+' + r.gap : '';
    return `<li class="${r.id === N.id ? 'me' : ''} ${r.caught || r.dnf || r.away ? 'out' : ''}"><span>${N.rank ? i + 1 : ''}</span><i style="background:${PCOL(r.col)}"></i><span>${esc(r.name)}</span><small>${esc(s)}</small></li>`; }).join('');
}
function paneOpen(){ const tr = document.getElementById('tray'); return !!(UI.pane && !UI.pane.hidden && tr && !tr.classList.contains('closed') && !document.body.classList.contains('f1on')); }
function hudTick(dt){
  const h = UI.hud; if (!h) return; if (N.room && (UI.paneT = (UI.paneT || 0) + dt) > 0.3){ UI.paneT = 0; const hid = paneOpen(); if (h.hidden !== hid) h.hidden = hid; } if (h.hidden) return; if ((UI.hudT = (UI.hudT || 0) + dt) < 0.2) return; UI.hudT = 0;
  const R = N.room, Rc = N.race; let st = '';
  h.querySelector('#netHPing').textContent = N.st === 'open' ? Math.round(N.clock.rtt) + ' ms' : N.st === 'retry' ? '重连 reconnecting' : '离线 offline';
  if (R){ const now = srvNow();
    if (Rc && R.state === 'countdown') st = `开始倒计时 · starts in ${Math.max(0, (Rc.startAt - now)/1000).toFixed(1)} s`;
    else if (Rc && Rc.mode === 'escape' && R.state === 'racing'){ const left = Math.max(0, (Rc.endAt - now)/1000); let d = ''; if (N.esc && N.lastLocal){ d = ` · 撤离点 extraction ${Math.round(Math.hypot(N.esc.x - N.lastLocal.x, N.esc.y - N.lastLocal.y))} m`; } st = `剩余 ${fmtS(left)} left${d}${N.kj.owner ? ' · 你控制怪物 you run the creature' : ''}`; }
    else if (Rc && R.state === 'racing') st = `比赛中 · racing ${fmtS(Math.max(0, (now - Rc.startAt)/1000))}`;
    else if (R.state === 'results') st = '成绩 · results';
    else if (R.mode === 'free') st = `${R.players.length} 人在线 · ${R.players.length} in the room`;
    else st = `等待开始 · waiting for the host (${R.players.filter(p => p.ready).length}/${R.players.length} ready)`; }
  h.querySelector('#netHSt').textContent = st;
  const sp = h.querySelector('#netSpec'); sp.hidden = !N.spec.on; if (N.spec.on){ const T = N.players.get(N.spec.id); h.querySelector('#netSpecN').textContent = (T ? '观战 ' + T.name : '观战 · nobody to watch') + (N.spec.mode === 'orbit' ? ' (环绕)' : ''); }
  const now = performance.now(); for (const p of h.querySelectorAll('#netChatL p')) if (now - (+p.dataset.t) > 14000) p.remove();
  const cb = h.querySelector('#netChat'), ci = h.querySelector('#netChatIn'), empty = !h.querySelector('#netChatL').children.length && ci.hidden; if (cb.hidden !== empty) cb.hidden = empty;   // no empty chat box
}
function chatLine(m, text, sys){
  const L = UI.hud && UI.hud.querySelector('#netChatL'); N.chat.push({name:m ? m.name : null, text, sys:!!sys}); if (N.chat.length > 60) N.chat.shift();
  const PL = UI.q.plog; if (PL){ const p2 = document.createElement('p'); if (sys) p2.className = 'sys'; if (m){ const b = document.createElement('b'); b.style.color = PCOL(m.col); b.textContent = m.name + ': '; p2.appendChild(b); p2.appendChild(document.createTextNode(text)); } else p2.textContent = text;
    PL.appendChild(p2); while (PL.children.length > 30) PL.firstChild.remove(); PL.scrollTop = PL.scrollHeight; }
  if (!L) return; const p = document.createElement('p'); p.dataset.t = performance.now(); if (sys) p.className = 'sys';
  if (m){ const b = document.createElement('b'); b.style.color = PCOL(m.col); b.textContent = m.name + ': '; p.appendChild(b); p.appendChild(document.createTextNode(text)); } else p.textContent = text;
  L.appendChild(p); while (L.children.length > 6) L.firstChild.remove(); L.parentNode.hidden = false;
}
function uiResults(on){
  const D = UI.res; if (!D) return; if (!on || !N.results){ D.hidden = true; return; }
  const M = N.results, R = N.room, host = R && R.host === N.id, list = M.list || [], me = list.findIndex(r => r.id === N.id) + 1;
  const val = (r, i) => M.mode === 'escape' ? (r.extracted ? '逃脱 escaped ' + fmtS(r.fin) : r.survived ? '幸存 survived' : r.caught ? '被抓 caught ' + fmtS(r.caughtAt != null ? r.caughtAt : null) : 'DNF')
    : r.dnf ? 'DNF' : r.fin != null ? (i === 0 ? fmtS(r.fin) : '+' + (r.fin - list[0].fin).toFixed(3)) : '–';
  const title = M.mode === 'escape' ? (list.some(r => r.extracted || r.survived) ? '有人逃出来了 · Some escaped' : '怪物赢了 · The creature wins') : `成绩 · Results${me ? ` · P${me}` : ''}`;
  D.innerHTML = `<h3>${esc(title)}</h3><p>${esc(MODE_N[M.mode][0])} · ${esc(MODE_N[M.mode][1])}${M.mode === 'f1' ? ` · ${R ? R.cfg.laps : ''} 圈 laps` : ''}</p>
<ol>${list.map((r, i) => `<li class="${r.id === N.id ? 'me' : ''}"><span>${i + 1}</span><i style="background:${PCOL(r.col)}"></i><span>${esc(r.name)}${r.flagged ? ' ⚠' : ''}${r.best ? ` <small>best ${fmtS(r.best)}</small>` : ''}</span><small>${esc(val(r, i))}</small></li>`).join('')}</ol>
<div class="btns">${host ? '<button class="pri" type="button" data-a="again">再来一局 Rematch</button><button type="button" data-a="lobby">回大厅 Lobby</button>' : ''}<button type="button" data-a="drive">继续开 Keep driving</button><button type="button" data-a="leave">离开房间 Leave</button></div>`;
  D.hidden = false;
}
// a room on another map: offer that map's page (the same folder: <city>.html, else index.html when it is that city), then join there
function cityDialog(to, code, mode){
  const D = UI.dlg; if (!D) return; const C = CITY_N[to] || [to, to];
  D.innerHTML = `<h3>${mode === 'f1' ? 'F1 赛道赛在新加坡和纽约地图' : '这个房间在另一张地图上'}</h3><p>${mode === 'f1' ? 'The F1 race is on the Singapore and New York maps.' : `Room ${esc(code || '')} plays on the ${esc(C[1])} map (${esc(C[0])}). You are on the ${esc(CITY_N[city()][1])} map.`}<br>切换到${esc(C[0])}地图后会自动加入房间 · Switch maps and you will join the room there.</p>
<div class="btns"><button class="pri" type="button" data-a="go">切换到 ${esc(C[0])} · Switch to ${esc(C[1])}</button><button type="button" data-a="x">取消 Cancel</button></div>`;
  D.hidden = false;
  D.querySelector('[data-a="x"]').onclick = () => { D.hidden = true; };
  D.querySelector('[data-a="go"]').onclick = async () => { const b = D.querySelector('[data-a="go"]'); b.disabled = true; b.textContent = '查找页面… finding the page';
    const here = new URL(location.href); here.hash = ''; const S = window.SGCity;
    for (const name of [to + '.html', 'index.html']){ const u = new URL(name, here.href); if (u.pathname === here.pathname) continue;
      let c = null; try { c = S && S.headCity ? await S.headCity(u.href) : (await fetch(u.href, {method:'HEAD'})).ok ? '?' : null; } catch (e){ c = null; }
      if (c === null) continue;
      if (c === to || (c === '?' && name !== 'index.html')){ if (N.url) u.searchParams.set('server', N.url); if (code) u.searchParams.set('join', code); location.href = u.href; return; } }
    b.disabled = false; b.textContent = `切换到 ${C[0]} · Switch to ${C[1]}`; D.querySelector('p').insertAdjacentHTML('beforeend', '<br><b>这张地图没有和这一页放在一起 · That map is not published next to this page.</b>'); };
}
function uiRefresh(){
  const q = UI.q; if (q.dot){ q.dot.className = 'dot ' + N.st; q.conn.textContent = N.st === 'off' ? '连接 Connect' : '断开 Disconnect'; q.url.disabled = N.st !== 'off'; if (N.url && N.st !== 'off') q.url.value = N.url; }
  uiRooms(); uiRoomCard(); uiRank(); uiModes2();
}
function uiModes2(){ /* the create buttons follow the connection */ const q = UI.q; if (q.create) q.create.textContent = N.st === 'open' ? '创建 Create' : '连接并创建 Connect + create'; }

/* ================= start-up (connect / rejoin) ================= */
HOOKS.boot.push(() => {
  loadPrefs(); N.tagsOn = true; buildUI();
  let auto = null; try { const sp = new URLSearchParams(location.search); auto = sp.get('join'); if (sp.get('server') || auto) N.url = defaultUrl(); } catch (e){ /* no URL */ }
  const S = loadSess();
  // a page reload in a room (same tab), or ?join=CODE from an invite link / the map switch: connect and (re)join
  if (auto){ N.joinAfter = auto.toUpperCase(); connect(N.url || defaultUrl()); }
  else if (S && S.room && S.url){ N.url = S.url; connect(S.url); }
  if (UI.q.url) UI.q.url.value = N.url || defaultUrl();
  N.onOpen = null;
});
window.SGNet = {
  connect:u => connect(u), disconnect:() => disconnect(), create:(mode, o) => create(mode, o), join:c => join(c), leave:() => leave(), ready:v => send({t:'ready', v:v !== false}),
  start:() => startRoom(), chat:t => send({t:'chat', text:t}), goto:id => gotoPlayer(id || ([...N.players.keys()][0])), spectate:(on, id) => on === false ? stopSpectate() : startSpectate(id), cycle:d => specCycle(d || 1),
  send:o => send(o), get N(){ return N; }, get UI(){ return UI; }, NETP, NETI,
  state(){ const R = N.room; return {st:N.st, url:N.url, id:N.id, name:N.name, room:R ? {code:R.code, mode:R.mode, city:R.city, state:R.state, host:R.host === N.id, n:R.players.length} : null,
    rtt:+N.clock.rtt.toFixed(1), off:+N.clock.off.toFixed(1), delay:+N.delay.toFixed(0), remotes:N.players.size, race:N.race ? {mode:N.race.mode, slot:N.race.slot, go:N.race.go, cp:N.race.cp, fin:N.race.fin} : null,
    spec:N.spec.on ? N.spec.id : null, bytesIn:N.bytesIn, bytesOut:N.bytesOut, frames:N.frames, snapsOut:N.snapsOut, kaiju:{on:N.kj.on, owner:N.kj.owner}, esc:N.esc, results:N.results ? N.results.list.map(r => [r.name, r.fin, r.dnf, r.caught, r.extracted]) : null, dbg:Object.assign({}, N.dbg)}; },
  remotes(){ return [...N.players.values()].map(R => ({id:R.id, name:R.name, slot:R.slot, away:!!R.away, buf:R.buf ? R.buf.length : 0, veh:R.r ? R.r.veh : null, key:R.r ? R.r.key : null, x:R.vis ? +R.vis.x.toFixed(1) : null, y:R.vis ? +R.vis.y.toFixed(1) : null, mode:R.pose ? R.pose.mode : null})); }
};
// connect first, then the action that asked for it
const _welcome = () => { if (N.onOpen){ const f = N.onOpen; N.onOpen = null; f(); } };
HOOKS.frame.push(() => { if (N.onOpen && N.st === 'open' && N.id) _welcome(); });
}
