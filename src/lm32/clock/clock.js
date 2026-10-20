/* ================= v36 lm32/clock: time by speed or by the city's local time (window.SGClock) =================
   The time bar had one play speed (a day in ~36 s). Now, in the presets row:
   - 倍速 Speed: 1× · 10× · 60× · 600× · 2400× (the old speed) — the ▶ button plays at that speed (real seconds × speed);
   - 当地时间 Local time: the clock follows the real time now in the city, in its standard time zone (Singapore SGT, UTC+8; San
     Francisco Bay Area America/Los_Angeles PST/PDT; New York America/New_York EST/EDT, daylight saving by the browser's time-zone
     data), updated every second; the zone shows next to the clock. Moving the slider, a preset, ▶ or any other mode that sets the
     time (e.g. a scene that needs night) leaves local time.
   Both choices are remembered (localStorage, guarded). The weather's sped-up drying / cloud drift (wx: "todPlay ? 20 : 1") now
   applies only at fast speeds (≥ 600×) — lm32/clock/post_clock.py. Test handle: SGClock.state(). */
const SGClock = (() => {
const RATES = [1, 10, 60, 600, 2400];
const ZONES = {sg:{tz:'Asia/Singapore', ab:'SGT', zh:'新加坡时间'}, bay:{tz:'America/Los_Angeles', ab:null, zh:'太平洋时间'}, nyc:{tz:'America/New_York', ab:null, zh:'美东时间'},
  hk:{tz:'Asia/Hong_Kong', ab:'HKT', zh:'香港时间'}, tyo:{tz:'Asia/Tokyo', ab:'JST', zh:'日本时间'}};
let NARROW = null; try { NARROW = matchMedia('(max-width:640px)'); } catch (e){}
const C = {rate:2400, local:false, mine:null, last:0, ui:null, city:'sg', ab:'', err:null};
const ls = {get(k){ try { return localStorage.getItem(k); } catch (e){ return null; } }, set(k, v){ try { localStorage.setItem(k, v); } catch (e){} }};
function city(){ try { const p = SGR_PATH; return p.startsWith('bay') ? 'bay' : p.startsWith('nyc') ? 'nyc' : p.startsWith('hk') ? 'hk' : p.startsWith('tyo') ? 'tyo' : 'sg'; } catch (e){ return 'sg'; } }
const pick = (zh, en) => { const L = window.SGLang, m = L && L.mode; return m === 'zh' ? zh : m === 'en' ? en : zh + ' ' + en; };
// the city's wall-clock time now: [hours (fractional), zone abbreviation]
function localNow(){
  const Z = ZONES[C.city], d = new Date();
  try {
    const f = new Intl.DateTimeFormat('en-US', {timeZone:Z.tz, hour:'numeric', minute:'numeric', second:'numeric', hourCycle:'h23', timeZoneName:'short'});
    const P = {}; for (const p of f.formatToParts(d)) P[p.type] = p.value;
    const h = (+P.hour % 24) + (+P.minute)/60 + (+P.second)/3600;
    return [h, Z.ab || P.timeZoneName || ''];
  } catch (e){
    C.err = e.message; const off = {sg:8, bay:-8, nyc:-5, hk:8, tyo:9}[C.city];          // no time-zone data: standard time without daylight saving
    return [(((d.getUTCHours() + off) % 24) + 24) % 24 + d.getUTCMinutes()/60 + d.getUTCSeconds()/3600, Z.ab || ''];
  }
}
function hps(){ return C.rate/3600; }                 // game hours per real second
function setLocal(on){
  C.local = !!on; ls.set('cb.clock.local', C.local ? '1' : '0');
  if (C.local){ if (todPlay){ todPlay = false; const b = document.getElementById('tPlay'); if (b){ b.setAttribute('aria-pressed', 'false'); b.textContent = '▶'; } } C.last = 0; tick(true); }
  C.mine = null; paint();
}
function setRate(r){ C.rate = RATES.includes(r) ? r : 2400; ls.set('cb.clock.rate', String(C.rate)); paint(); }
function tick(force){
  if (!C.local) return;
  const now = performance.now(); if (!force && now - C.last < 1000) return; C.last = now;
  // someone else set the time (slider, preset, a mode): leave local time
  if (C.mine !== null && Math.abs(tod - C.mine) > 0.02 && Math.abs(Math.abs(tod - C.mine) - 24) > 0.02){ setLocal(false); return; }
  const [h, ab] = localNow(); C.ab = ab;
  setTod(h); C.mine = tod; paint();
}
function paint(){
  const U = C.ui; if (!U) return;
  const narrow = NARROW && NARROW.matches;        // phones: short labels, so the time bar keeps its two rows
  U.rate.textContent = narrow ? C.rate + '×' : pick('倍速', 'Speed') + ' ' + C.rate + '×';
  U.rate.title = pick('播放速度（▶）', 'Play speed (▶)');
  // the zone shows on the button itself while local time runs (no extra line in the time bar)
  U.local.textContent = C.local && C.ab ? (narrow ? C.ab : pick('当地时间', 'Local time') + ' · ' + C.ab) : narrow ? pick('当地', 'Local') : pick('当地时间', 'Local time');
  U.local.setAttribute('aria-pressed', String(C.local));
  U.local.title = pick(ZONES[C.city].zh + '，实时', ZONES[C.city].tz.replace('_', ' ') + ', live');
}
function ui(){
  if (C.ui) return; const bar = document.getElementById('timebar'); if (!bar) return;
  const st = document.createElement('style');
  st.textContent = `#timebar .tclk{display:flex;gap:6px;align-items:center;margin-left:8px;padding-left:8px;border-left:1px solid rgba(0,0,0,.12)}
#timebar .tclk button[aria-pressed="true"]{background:#1f2a24;color:#fff;border-color:#1f2a24}
body.night #timebar .tclk{border-left-color:rgba(255,255,255,.18)}
@media (max-width:640px){ #timebar .tclk{margin-left:2px;padding-left:4px;gap:4px} #timebar .tclk button{flex:none;padding:5px 6px} }`;
  document.head.appendChild(st);
  const pre = bar.querySelector('.tpre') || bar, box = document.createElement('div'); box.className = 'tclk';
  const rate = document.createElement('button'), local = document.createElement('button'); rate.type = local.type = 'button'; rate.id = 'tRate'; local.id = 'tLocal';
  box.append(rate, local); pre.appendChild(box);
  // the i18n observer must not rewrite these (they follow SGLang themselves)
  box.setAttribute('data-i18n-off', '');
  rate.addEventListener('click', () => { const i = RATES.indexOf(C.rate); setRate(RATES[(i + 1) % RATES.length]); });
  local.addEventListener('click', () => setLocal(!C.local));
  // the old controls leave local time
  const off = () => { if (C.local) setLocal(false); };
  const sl = document.getElementById('tSlider'); if (sl) sl.addEventListener('input', off, true);
  const pl = document.getElementById('tPlay'); if (pl) pl.addEventListener('click', off, true);
  bar.querySelectorAll('.tpre button[data-t]').forEach(b => b.addEventListener('click', off, true));
  C.ui = {rate, local}; paint();
  if (window.SGLang && SGLang.on) SGLang.on(paint);
  try { NARROW && NARROW.addEventListener('change', paint); } catch (e){}
}
HOOKS.boot.push(() => {
  C.city = city();
  const r = +ls.get('cb.clock.rate'); if (RATES.includes(r)) C.rate = r;
  ui();
  if (ls.get('cb.clock.local') === '1') setLocal(true);
});
HOOKS.frame.push(() => tick(false));
return {hps, fast:() => C.rate >= 600, setRate, setLocal, localNow, RATES,
  state:() => ({rate:C.rate, local:C.local, city:C.city, tz:ZONES[C.city].tz, ab:C.ab, tod:+tod.toFixed(4), play:todPlay, local_now:localNow(), err:C.err})};
})();
window.SGClock = SGClock;
