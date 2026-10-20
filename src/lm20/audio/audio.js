/* ================= v22 add-on: sound — a procedural Web Audio sound system for both real maps (lm20/audio) =================
   Every sound is synthesised at run time (oscillators, custom periodic waves, filtered noise, small buffers generated once per
   AudioContext: bird phrases, insect loops, bells, clicks). No audio files, no network. Off by default: the 声音 Sound button in the
   time bar opens a panel (master on/off + volume, seven groups with volume and mute); the choice and the volumes are kept in
   localStorage ('cityBrush.audio'); a later visit shows "点按开启 Tap to resume" until one tap resumes the AudioContext.
   What it listens to (read-only):
   - camera / controls: the AudioListener sits at the camera with its orientation; camera height above ground blends street sound
     (vehicles, crossings, birds) into a soft city wash and wind for high views; land cover (nat) and land use (SG.lu) sampled
     around the view drive the beds; tod / nightF the time of day.
   - traffic (window.SGTraffic): the nearest / loudest vehicles get pooled 3-D voices (engine periodic wave from a gear model +
     tyre noise, Doppler, distance low-pass): cars, taxis, vans, pickups (V8), lorries, motorcycles, buses (diesel idle, air-brake
     hiss and door beeps at stops); rare horns (rarer in Singapore); the pedestrian-crossing ticker at the signal nearest a
     street-level listener (slow locator tick, fast during the green man, read from the signal lamps).
   - rail (net.trains): MRT / LRT, BART, Caltrain (horn), Muni / VTA light rail (gong), the F-line, cable cars (bells, the cable
     slot hum along the routes): rumble, rolling noise, traction whine, rail-joint clatter, viaduct boom, tunnels muffled, station
     chimes as a train runs through a station near the listener.
   - aircraft (window.SGAir.SIM): take-off roar with fan buzz-saw, approach whine, reverse thrust on the roll-out, taxi idle,
     engine start, APU hum at the gates.
   - port (window.SGPort / window.BayPort) and ships (port berths, anchored ships): yard machinery hum, container clangs, crane
     travel alarms, reversing beepers, ship horns now and then (sound travels at 343 m/s).
   - weather (window.SGWx): rain (hiss, patter, drops), wind and storm gusts, thunder after each lightning flash (delay from the
     distance), the Golden Gate fog horns in the Bay's marine layer.
   - nature: birds by day (Singapore: koel, bulbul, magpie-robin, kingfisher, myna, oriole, dove; Bay: song / white-crowned
     sparrow, house finch, crow, mourning dove, gulls by the water, scrub jay), cicadas at dusk, night insects, frogs, geckos and
     nightjars (Singapore), crickets, chorus frogs and the odd owl (Bay); waves and wind by the sea.
   - F1 drive (window.SGF1): engine from rpm / throttle (V6 periodic wave, exhaust / intake, turbo whistle, gear-shift cuts,
     limiter, overrun crackle), tyre squeal from slip, kerbs, bumps, collisions, wind, start-light beeps, the AI cars (Doppler),
     crowd near the grandstands. With the lm20/audio/f1d.js copy, f1d's own simple engine stands down and its 声音 button / M key
     drive this group.
   - [lm22/svdrive] the road car (SGF1.F1.veh === 'car', Bay map): an electric motor whine and hum (single-speed) or a petrol V6 / V8
     from the automatic gearbox's rpm (shift dips), tyre squeal, rolling road noise, wind, bumps / collisions, the indicator relay;
     muffled in the interior view; the same 'f1' group (labelled 驾驶 Driving in the Bay), master volume / mute and HUD button.
   - UI: clicks for buttons / tabs / toggles, a brush while painting, a chime when a repaint has finished building.
   - [nyc/nycapp] New York City (SGR_NYC, tested lazily): a denser traffic wash (sparser at night) with car horns in the street voices
     and a scatter of distant honks (impatient chains by day, rare at night), sirens now and then (police / ambulance wail and yelp,
     the fire engines' mechanical growl and air horn) passing in the distance with the echo of the street canyons, the subway: steel
     trains loud on the els (viaduct boom, rail joints, wheel / brake screech in bursts and on curves), PATH, commuter-rail horns
     (LIRR, Metro-North, NJ Transit), light-rail gongs; harbour and ferry horns, tug toots and big-ship blasts near the water (more in
     fog); wind gusting and whistling around the towers from ~60 m up; in the big parks (Central Park, Prospect Park ...) the traffic
     fades, leaves rustle and the birds take over by day (house sparrow, American robin, northern cardinal, blue jay, mourning dove,
     rock pigeon, starling, crows, gulls by the water); crickets and katydids at night, the odd owl in the parks; snow muffles the city.
   - [lm24/sound] v27: area soundscapes for all three maps (街区声景 Neighbourhoods): the buildings around the listener (per-tile grid of
     footprint per kind, made lazily for the tiles near the listener), land use / cover, POIs, a road grid (highways, elevated decks) and per-city tables of hawker
     centres / food streets, shopping streets and nightlife pick and crossfade the beds: shopping streets (a wide crowd of formant
     talkers, footsteps, music through the shop doors; door chimes, scanner beeps, wordless vendor calls, laughter, buskers), hawker
     centres / food streets (chatter, woks and ladles, sizzle, plates, cleavers), parks (leaves, children at play, dogs, bicycle bells,
     joggers, ducks and geese by the water, the city's birds), residential streets (evening TV murmur, air-conditioners, children,
     dogs, mahjong tiles in Singapore), industry (hum, whine, a press, clangs, beepers, air hiss), highways (tyre roar, expansion
     joints; under a flyover the deck's boom and more reverb), lapping water, nightlife bass, construction (jackhammer, pile driver),
     rain on leaves / awnings / water / gutters. From ~20 m to ~260 m up they fade out: high views keep only the city hum and wind.
   - [lm24/sound] landmark ambiences (地标 Landmarks, 3 positional voices): 23 in Singapore, 18 in the Bay Area, 19 in New York (see
     LM_SG / LM_BAY / LM_NY), with show times, game nights and opening hours from the clock.
   - [lm24/sound] SGAudio.fx(name, {x, y, z, k}) one-shot effects (碰撞与爆炸 Crashes & effects) and SGAudio.vehicle(id, kind, p) /
     vehicleStop(id) continuous vehicle voices (prop, jet, heli, bus, truck, motorbike, boat; the 驾驶 group) for the drive and fly
     modes; safe in any call order and rate, with the sound on or off.
   Mix: group buses -> master -> compressor -> a soft clipper (linear to 0.7, never reaches full scale) -> output; a generated
   convolution reverb on group sends. Budget: <= 37 positional voices (pooled per kind, nearest / loudest win), beds and voices
   disconnected while silent, parameters move by AudioParam automation (setTargetAtTime); the director costs ~0.1-0.3 ms per frame
   (the bank is generated in 0.8 ms slices during the first seconds; [lm24/sound] the sounds of single landmarks / buskers only when first
   needed). Suspends while the page is hidden.
   Reads (no changes to other modules): SGTraffic._int (VEH: positions from the link geometry, V.cd, bus states; PR.heads / lamps
   for the crossings), net.trains / net.mrt / net.stations, SGAir.SIM.ac, SGPort / BayPort.T, regionGroup ships, SGWx.state and
   the cloud material's uFlashP (lightning), SGF1.CAR / RACE / TR (+ F1 / AI with the f1d copy), SG.lu / nat, painting / tool.
   Test handle: window.SGAudio {enable(), disable(), toggle(), fx(name, p), vehicle(id, kind, p), vehicleStop(id), on, state, settings, set(group, v), mute(group, m), master(v),
   panel(open), stats(), f1Ext(on, user), _test:{render(opts) (offline, sim-time stepped), analyse, bench(n), prof(n), step(t, dt),
   vehCheck(), trainPass(t, maxD, horizon), ui:{...}, LIVE, UIS, ...}} */
{
const AU_KEY = 'cityBrush.audio';
const AU_GROUPS = [
  {id:'amb',  zh:'城市环境',  en:'City ambience',    v:0.8},
  {id:'area', zh:'街区声景',  en:'Neighbourhoods',   v:0.8},
  {id:'lm',   zh:'地标',      en:'Landmarks',        v:0.8},
  {id:'trf',  zh:'交通',      en:'Traffic',          v:0.8},
  {id:'rail', zh:'轨道交通',  en:'Rail',             v:0.8},
  {id:'air',  zh:'飞机与船',  en:'Aircraft & ships', v:0.8},
  {id:'nat',  zh:'自然与天气', en:'Nature & weather', v:0.8},
  {id:'f1',   zh:'F1 · 驾驶 · 飞行', en:'F1, drive & fly', v:0.85},
  {id:'fx',   zh:'碰撞与爆炸', en:'Crashes & effects', v:0.85},
  {id:'ui',   zh:'界面',      en:'Interface',        v:0.6}];
const AU_SEND = {amb:0.04, area:0.08, lm:0.12, trf:0.10, rail:0.16, air:0.12, nat:0.10, f1:0.03, fx:0.2, ui:0};   // reverb sends
const AS = {on:false, master:0.8, g:{}, m:{}};
for (const G of AU_GROUPS){ AS.g[G.id] = G.v; AS.m[G.id] = false; }
const PI = Math.PI, TAU = 2*PI, C_SND = 343;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a)*t;
const sstep = (a, b, x) => { const t = clamp((x - a)/(b - a), 0, 1); return t*t*(3 - 2*t); };
const rnd = Math.random, rr = (a, b) => a + (b - a)*rnd(), ri = (a, b) => Math.floor(rr(a, b + 1));
const pick = A => A[Math.floor(rnd()*A.length)];
function asLoad(){
  try {
    const s = JSON.parse(localStorage.getItem(AU_KEY) || 'null');
    if (s && typeof s === 'object'){
      AS.on = !!s.on; if (isFinite(s.master)) AS.master = clamp(+s.master, 0, 1);
      for (const G of AU_GROUPS){ if (s.g && isFinite(s.g[G.id])) AS.g[G.id] = clamp(+s.g[G.id], 0, 1); if (s.m) AS.m[G.id] = !!s.m[G.id]; }
    }
  } catch (e){ /* storage blocked or bad JSON: defaults */ }
}
let asSaveT = 0;
function asSave(){ clearTimeout(asSaveT); asSaveT = setTimeout(() => { try { localStorage.setItem(AU_KEY, JSON.stringify(AS)); } catch (e){ /* blocked */ } }, 250); }
// the Bay build (SGR_BAY is a top-level const declared after the modules: only look once the page runs)
let AU_BAY = null;
function auBay(){ if (AU_BAY === null){ try { AU_BAY = typeof SGR_BAY !== 'undefined' && !!SGR_BAY; } catch (e){ return false; } } return AU_BAY; }
// [nyc/nycapp] the New York City build (SGR_NYC, also a top-level const declared after the modules)
let AU_NYC = null;
function auNyc(){ if (AU_NYC === null){ try { AU_NYC = typeof SGR_NYC !== 'undefined' && !!SGR_NYC; } catch (e){ return false; } } return AU_NYC; }
const auReal = () => { try { return typeof SGR !== 'undefined' && !!SGR.on; } catch (e){ return false; } };
const auNetVis = () => { try { return !!showNet && moverGroup.visible; } catch (e){ return true; } };

/* ---------------------------------------------------------------- the generated bank ----------------------------------------
   noise loops at the context rate (stereo: independent channels), a reverb impulse response, engine / jet periodic waves, and
   phrases / loops / strikes rendered by a small note synthesiser at 22.05 kHz (birds, frogs, insects, bells, ticks, clangs). */
const NSR = 22050;
// a loop that wraps without a click: the tail is cross-faded into the head
function loopify(a, m){ const n = a.length - m, o = new Float32Array(n); for (let i = 0; i < n; i++) o[i] = a[i]; for (let i = 0; i < m; i++){ const w = i/m; o[i] = a[i]*w + a[n + i]*(1 - w); } return o; }
function normRms(a, r){ let s = 0; for (let i = 0; i < a.length; i++) s += a[i]*a[i]; const k = r/Math.sqrt(s/a.length || 1); for (let i = 0; i < a.length; i++) a[i] *= k; return a; }
function normPeak(a, p){ let m = 0; for (let i = 0; i < a.length; i++){ const v = Math.abs(a[i]); if (v > m) m = v; } if (m > 0){ const k = p/m; for (let i = 0; i < a.length; i++) a[i] *= k; } return a; }
function nWhite(n){ const a = new Float32Array(n); for (let i = 0; i < n; i++) a[i] = rnd()*2 - 1; return a; }
function nPink(n){ const a = new Float32Array(n); let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < n; i++){ const w = rnd()*2 - 1; b0 = 0.99886*b0 + w*0.0555179; b1 = 0.99332*b1 + w*0.0750759; b2 = 0.969*b2 + w*0.153852; b3 = 0.8665*b3 + w*0.3104856; b4 = 0.55*b4 + w*0.5329522; b5 = -0.7616*b5 - w*0.016898; a[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + w*0.5362; b6 = w*0.115926; }
  return a; }
function nBrown(n){ const a = new Float32Array(n); let l = 0; for (let i = 0; i < n; i++){ l = (l + 0.02*(rnd()*2 - 1))/1.02; a[i] = l; } return a; }
function mkBuf(ctx, chans, sr){ const b = ctx.createBuffer(chans.length, chans[0].length, sr || ctx.sampleRate); for (let c = 0; c < chans.length; c++) b.getChannelData(c).set(chans[c]); return b; }
// stereo noise loops; ds: a lower sample rate for the low-frequency colours (the browser resamples on playback)
function noiseBuf(ctx, kind, sec, ds){
  const sr = Math.max(8000, Math.round(ctx.sampleRate/(ds || 1))), n = Math.floor(sec*sr), m = Math.floor(0.05*sr), f = kind === 'w' ? nWhite : kind === 'p' ? nPink : nBrown;
  return mkBuf(ctx, [normRms(loopify(f(n + m), m), 0.25), normRms(loopify(f(n + m), m), 0.25)], sr);
}
// reverb: early reflections + an exponentially decaying, darkening stereo tail
function mkIR(ctx, sec){
  const sr = ctx.sampleRate, n = Math.floor(sec*sr), L = new Float32Array(n), R = new Float32Array(n);
  for (const A of [L, R]){
    let lp = 0;
    for (let i = 0; i < n; i++){ const t = i/sr, k = 0.2 + 0.75*Math.exp(-t*2.2); lp += ((rnd()*2 - 1) - lp)*k; A[i] = lp*Math.exp(-6.9*t/sec)*(t < 0.012 ? t/0.012 : 1); }
    for (let r = 0; r < 9; r++){ const i = Math.floor(rr(0.008, 0.09)*sr); A[i] += rr(-0.6, 0.6)*Math.exp(-i/sr*8); }
  }
  return mkBuf(ctx, [normPeak(L, 0.6), normPeak(R, 0.6)]);
}
// periodic waves: amplitude per harmonic of the base frequency, random phases (less peaky, more natural)
function mkWave(ctx, amps){
  const n = amps.length + 1, re = new Float32Array(n), im = new Float32Array(n);
  for (let k = 1; k < n; k++){ const p = rnd()*TAU; re[k] = amps[k - 1]*Math.cos(p); im[k] = amps[k - 1]*Math.sin(p); }
  return ctx.createPeriodicWave(re, im);
}
function waveAmps(n, f){ const a = []; for (let k = 1; k <= n; k++) a.push(Math.max(0, f(k))); return a; }
function mkWaves(ctx){
  const W = {};
  // inline four (base = crank rate): 2nd order firing, its harmonics, a little 1st / odd for unevenness
  W.i4 = mkWave(ctx, waveAmps(32, k => (k % 2 === 0 ? 1/Math.pow(k/2, 0.9) : 0.12/k) + (k === 1 ? 0.15 : 0)));
  // diesel six (base = crank): 3rd order firing, rich knock harmonics
  W.d6 = mkWave(ctx, waveAmps(48, k => (k % 3 === 0 ? 0.9/Math.pow(k/3, 0.7) : 0.22/Math.sqrt(k)) * (k < 3 ? 0.8 : 1)));
  // cross-plane V8 (base = half the crank rate): 4th order firing (k 8) and the half-order burble
  W.v8 = mkWave(ctx, waveAmps(48, k => (k % 8 === 0 ? 1/Math.pow(k/8, 0.8) : k % 2 === 0 ? 0.32/Math.pow(k, 0.5) : 0.18/Math.pow(k, 0.6))));
  // single / twin (base = half the crank rate): pulse-like rasp
  W.m1 = mkWave(ctx, waveAmps(48, k => 0.9/Math.pow(k, 0.65) * (k === 1 ? 0.5 : 1)));
  // F1 V6 (base = half the crank rate, k 6 = firing): firing harmonics, 1.5 orders, a hybrid-era rasp on top
  W.f1 = mkWave(ctx, waveAmps(64, k => (k % 6 === 0 ? 1/Math.pow(k/6, 0.75) : k % 3 === 0 ? 0.32/Math.pow(k/3, 0.6) : 0.08) + (k > 24 ? 0.12/Math.sqrt(k - 23) : 0) + (k <= 2 ? 0.1 : 0)));
  // jet fan buzz-saw (base = shaft rate): every harmonic, irregular
  W.buzz = mkWave(ctx, waveAmps(64, k => 0.6/Math.pow(k, 0.55)*(0.5 + rnd())));
  // ship horn: a strong, slightly hollow reed tone
  W.horn = mkWave(ctx, waveAmps(30, k => 1/Math.pow(k, 0.8)*(k % 2 ? 1 : 0.65)));
  return W;
}
/* ---- note synthesiser: note {t, d, f0, f1, f2 (mid point of a 3-point glide), cv (glide curve), a, h:[harmonic amps], fm:[rate, depth],
   am:[rate, depth], nz (noisy part: lowpassed noise ring-modulated by the carrier), at, rl (attack / release s), dk (exp decay s)}.
   Resumable: st = {i, ph, lp, lp2} carries a note across calls of at most maxN samples (the bank is built in small slices). */
function nsynth(arr, sr, N, st, maxN){
  const n0 = Math.floor(N.t*sr), len = Math.max(2, Math.floor(N.d*sr)), H = N.h || [1], nh = H.length, at = Math.max(1, (N.at || 0.006)*sr), rl = Math.max(1, (N.rl || 0.02)*sr);
  const fm = N.fm, am = N.am, nz = N.nz || 0, nyq = sr*0.46, dk = N.dk ? 1/(N.dk*sr) : 0, cv = N.cv || 1, A = N.a === undefined ? 1 : N.a, f2 = N.f2;
  let ph = st.ph, lp = st.lp, lp2 = st.lp2, i = st.i; const iEnd = Math.min(len, i + maxN);
  for (; i < iEnd; i++){
    const k = n0 + i; if (k >= arr.length){ i = len; break; } if (k < 0) continue;
    const u = i/len, tt = i/sr;
    let f = f2 !== undefined ? (u < 0.5 ? lerp(N.f0, f2, sstep(0, 1, u*2)) : lerp(f2, N.f1, sstep(0, 1, u*2 - 1))) : (cv === 1 ? N.f0 + (N.f1 - N.f0)*u : lerp(N.f0, N.f1, Math.pow(u, cv)));
    if (fm) f *= 1 + fm[1]*Math.sin(TAU*fm[0]*tt);
    ph += TAU*f/sr;
    let s = 0; for (let h = 0; h < nh; h++){ if ((h + 1)*f > nyq) break; s += H[h]*Math.sin((h + 1)*ph); }
    if (nz){ lp += ((rnd()*2 - 1) - lp)*0.45; lp2 += (lp - lp2)*0.45; s = s*(1 - nz) + nz*2.2*lp2*Math.sin(ph); }
    let e = Math.min(1, i/at, (len - i)/rl); e = e*e*(3 - 2*e);
    if (dk) e *= Math.exp(-i*dk);
    if (am) e *= 1 - am[1]*(0.5 - 0.5*Math.cos(TAU*am[0]*tt));
    arr[k] += A*e*s;
  }
  st.ph = ph; st.lp = lp; st.lp2 = lp2; st.i = i;
  return i >= len;
}
// ---- species: each returns [notes, duration]
const SP = {
  // Asian koel: "ko-EL", repeated, climbing
  koel(){ const N = []; let t = 0.05, f = rr(620, 700); const n = ri(3, 6);
    for (let i = 0; i < n; i++){ N.push({t, d:0.13, f0:f*0.9, f1:f, a:0.55, h:[1, 0.16, 0.05], at:0.015, rl:0.03}); N.push({t:t + 0.18, d:0.3, f0:f*1.02, f1:f*1.45, cv:0.7, a:0.9, h:[1, 0.14, 0.05], at:0.02, rl:0.06}); t += rr(0.62, 0.74); f *= rr(1.03, 1.06); }
    return [N, t + 0.1]; },
  bulbul(){ const N = []; let t = 0.03; const n = ri(4, 7);
    for (let i = 0; i < n; i++){ const d = rr(0.05, 0.12), f = rr(1500, 2600); N.push({t, d, f0:f, f1:f*rr(0.8, 1.3), a:rr(0.6, 1), h:[1, 0.3, 0.08], fm:[rr(30, 60), 0.03], at:0.008, rl:0.02}); t += d + rr(0.02, 0.08); }
    return [N, t + 0.05]; },
  robin(){ const N = []; let t = 0.03; const n = ri(6, 10);
    for (let i = 0; i < n; i++){ const d = rr(0.07, 0.24), f = rr(1800, 4000); N.push({t, d, f0:f, f2:f*rr(0.8, 1.25), f1:f*rr(0.85, 1.2), a:rr(0.5, 1), h:[1, 0.08], fm:rnd() < 0.3 ? [rr(20, 32), 0.05] : null, at:0.01, rl:0.03}); t += d + rr(0.04, 0.14); }
    return [N, t + 0.05]; },
  kingfisher(){ const N = []; let t = 0.03; const n = ri(5, 8);
    for (let i = 0; i < n; i++){ N.push({t, d:0.09, f0:2650, f1:2250, a:1 - i*0.05, h:[1, 0.6, 0.35, 0.2], nz:0.35, at:0.006, rl:0.02}); t += rr(0.15, 0.18); }
    return [N, t + 0.05]; },
  myna(){ const N = []; let t = 0.03; const n = ri(6, 12);
    for (let i = 0; i < n; i++){ const d = rr(0.04, 0.18), f = rr(900, 2800); N.push({t, d, f0:f, f1:f*rr(0.7, 1.4), a:rr(0.5, 1), h:[1, 0.5, 0.3, 0.2], nz:rr(0.2, 0.6), at:0.006, rl:0.02}); t += d + rr(0.03, 0.12); }
    return [N, t + 0.05]; },
  oriole(){ const N = []; let t = 0.03; const fs = [rr(1300, 1500), rr(1600, 1800), rr(1500, 1700), rr(1700, 1900)];
    for (let i = 0; i < 4; i++){ const d = rr(0.14, 0.24); N.push({t, d, f0:fs[i]*0.92, f2:fs[i]*1.06, f1:i === 3 ? fs[i]*0.7 : fs[i], a:0.9, h:[1, 0.1, 0.03], at:0.02, rl:0.05}); t += d + rr(0.02, 0.06); }
    return [N, t + 0.05]; },
  dove(){ const N = [], f = rr(470, 540);
    N.push({t:0.03, d:0.24, f0:f*0.92, f1:f, a:0.6, h:[1, 0.25, 0.08], at:0.03, rl:0.06});
    N.push({t:0.33, d:0.36, f0:f, f1:f*0.92, a:0.8, h:[1, 0.25, 0.08], am:[28, 0.6], at:0.03, rl:0.06});
    N.push({t:0.78, d:0.4, f0:f*0.9, f1:f*0.82, a:0.7, h:[1, 0.25, 0.08], at:0.04, rl:0.1});
    return [N, 1.25]; },
  nightjar(){ const N = []; let t = 0.03; const n = ri(6, 14);
    for (let i = 0; i < n; i++){ N.push({t, d:0.06, f0:1150, f1:950, a:0.85, h:[1, 0.5, 0.3], nz:0.45, at:0.004, rl:0.02}); t += rr(0.36, 0.4); }
    return [N, t + 0.05]; },
  gecko(){ const N = []; let t = 0.03; const n = ri(5, 8);
    for (let i = 0; i < n; i++){ N.push({t, d:0.045, f0:3200, f1:2600, a:1 - i*0.08, h:[1, 0.4], nz:0.5, at:0.003, rl:0.015}); t += rr(0.15, 0.2); }
    return [N, t + 0.05]; },
  bullfrog(){ const N = []; let t = 0.03; const n = ri(1, 2), f = rr(150, 200);
    for (let i = 0; i < n; i++){ N.push({t, d:0.45, f0:f*1.05, f1:f*0.92, a:0.8, h:[0.6, 1, 0.8, 0.55, 0.4, 0.3, 0.2, 0.12], am:[22, 0.7], at:0.03, rl:0.08}); t += 0.7; }
    return [N, t]; },
  tokfrog(){ const N = []; let t = 0.03; const n = ri(3, 6), f = rr(1100, 1500);
    for (let i = 0; i < n; i++){ N.push({t, d:0.035, f0:f, f1:f*0.9, a:0.9, h:[1, 0.3], nz:0.3, at:0.003, rl:0.015}); t += rr(0.18, 0.24); }
    return [N, t + 0.05]; },
  // ---- the Bay
  sparrow(){ const N = []; let t = 0.03;
    for (let i = 0; i < 3; i++){ N.push({t, d:0.08, f0:3300, f1:3000, a:0.8, h:[1, 0.1], at:0.006, rl:0.02}); t += 0.13; }
    N.push({t, d:0.32, f0:4500, f1:4300, a:0.6, h:[1, 0.2], fm:[80, 0.07], nz:0.45, at:0.01, rl:0.03}); t += 0.38;
    for (let i = 0; i < 8; i++){ N.push({t, d:0.04, f0:2800, f1:3400, a:0.75, h:[1, 0.15], at:0.004, rl:0.01}); t += 0.066; }
    N.push({t:t + 0.05, d:0.12, f0:3000, f1:2600, a:0.7, h:[1, 0.1], at:0.01, rl:0.03});
    return [N, t + 0.25]; },
  finch(){ const N = []; let t = 0.03; const n = ri(16, 24);
    for (let i = 0; i < n; i++){ const d = rr(0.03, 0.07), f = rr(2000, 5000); N.push({t, d, f0:f, f1:f*rr(0.8, 1.25), a:rr(0.5, 1), h:[1, 0.12], at:0.004, rl:0.01}); t += d + rr(0.01, 0.04); }
    N.push({t, d:0.24, f0:3500, f1:2200, a:0.8, h:[1, 0.3], nz:0.4, at:0.01, rl:0.04});
    return [N, t + 0.3]; },
  crow(){ const N = []; let t = 0.03; const n = ri(2, 4);
    for (let i = 0; i < n; i++){ N.push({t, d:0.28, f0:rr(640, 690), f1:560, a:0.9, h:[0.5, 1, 0.8, 0.6, 0.5, 0.35, 0.25, 0.2], nz:0.4, at:0.02, rl:0.05}); t += rr(0.42, 0.5); }
    return [N, t + 0.05]; },
  mdove(){ const N = [], f = rr(440, 500);
    N.push({t:0.03, d:0.22, f0:f*0.85, f1:f*1.08, a:0.55, h:[1, 0.15], at:0.03, rl:0.05});
    N.push({t:0.3, d:0.5, f0:f*1.12, f1:f*1.0, a:0.85, h:[1, 0.15], at:0.04, rl:0.08});
    for (let i = 0; i < 3; i++) N.push({t:0.95 + i*0.55, d:0.45, f0:f*0.92, f1:f*0.88, a:0.55, h:[1, 0.15], at:0.05, rl:0.1});
    return [N, 2.6]; },
  gull(){ const N = []; let t = 0.03; const n = ri(3, 6);
    for (let i = 0; i < n; i++){ const d = rr(0.24, 0.34); N.push({t, d, f0:rr(1400, 1650), f1:rr(950, 1100), cv:0.6, a:0.9, h:[0.7, 1, 0.6, 0.4, 0.3], nz:0.15, at:0.015, rl:0.05}); t += d + rr(0.08, 0.16); }
    if (rnd() < 0.6) for (let i = 0; i < ri(4, 6); i++){ N.push({t, d:0.12, f0:1250, f1:1100, a:0.7, h:[0.7, 1, 0.5, 0.3], nz:0.2, at:0.01, rl:0.03}); t += 0.17; }
    return [N, t + 0.05]; },
  wcsparrow(){ const N = []; let t = 0.03;
    N.push({t, d:0.5, f0:3700, f1:3550, a:0.8, h:[1, 0.08], at:0.03, rl:0.05}); t += 0.58;
    for (let i = 0; i < 2; i++){ N.push({t, d:0.2, f0:4200, f1:4000, a:0.55, h:[1, 0.2], nz:0.5, at:0.01, rl:0.03}); t += 0.26; }
    for (let i = 0; i < 5; i++){ N.push({t, d:0.05, f0:3100, f1:2900, a:0.7, h:[1, 0.1], at:0.005, rl:0.015}); t += 0.083; }
    return [N, t + 0.1]; },
  jay(){ const N = []; let t = 0.03; const n = ri(2, 3);
    for (let i = 0; i < n; i++){ N.push({t, d:0.22, f0:2000, f1:3000, cv:0.8, a:0.9, h:[1, 0.7, 0.5, 0.4], nz:0.55, at:0.01, rl:0.04}); t += rr(0.32, 0.38); }
    return [N, t + 0.05]; },
  chorusfrog(){ const N = []; let t = 0.03; const n = ri(2, 4);
    for (let i = 0; i < n; i++){ N.push({t, d:0.11, f0:2100, f1:2350, a:0.9, h:[1, 0.5], nz:0.2, am:[90, 0.9], at:0.005, rl:0.02}); N.push({t:t + 0.2, d:0.13, f0:2200, f1:2450, a:0.85, h:[1, 0.5], nz:0.2, am:[90, 0.9], at:0.005, rl:0.02}); t += rr(0.5, 0.65); }
    return [N, t + 0.05]; },
  owl(){ const N = [], f = rr(300, 350), D = [0.2, 0.14, 0.4, 0.3, 0.3], G = [0.05, 0.25, 0.08, 0.25, 0.2]; let t = 0.03;
    for (let i = 0; i < 5; i++){ N.push({t, d:D[i], f0:f*(i === 2 ? 1.04 : 1), f1:f*0.97, a:i === 2 ? 0.9 : 0.6, h:[1, 0.12], at:0.03, rl:0.05}); t += D[i] + G[i]; }
    return [N, t]; },
  // ---- [nyc/nycapp] New York
  // house sparrow: a run of 'cheep' chirps
  hsparrow(){ const N = []; let t = 0.03; const n = ri(4, 9);
    for (let i = 0; i < n; i++){ const d = rr(0.06, 0.1), f = rr(2800, 3500); N.push({t, d, f0:f*0.95, f2:f*1.18, f1:f*0.86, a:rr(0.6, 1), h:[1, 0.35, 0.12], nz:0.15, at:0.006, rl:0.02}); t += d + rr(0.12, 0.3); }
    return [N, t + 0.05]; },
  // American robin: caroling phrases of rising / falling whistles ('cheerily cheer-up')
  amrobin(){ const N = []; let t = 0.03; const np = ri(2, 3);
    for (let p = 0; p < np; p++){ const n = ri(2, 4); for (let i = 0; i < n; i++){ const d = rr(0.14, 0.24), f = rr(2000, 2700); N.push({t, d, f0:f*0.88, f2:f*1.12, f1:f*rr(0.82, 1.05), a:rr(0.65, 1), h:[1, 0.1, 0.03], at:0.015, rl:0.04}); t += d + rr(0.06, 0.12); } t += rr(0.35, 0.6); }
    return [N, t]; },
  // northern cardinal: repeated down-slurred whistles
  cardinal(){ const N = []; let t = 0.03; const n = ri(4, 8), f = rr(3600, 4200), up = rnd() < 0.4;
    for (let i = 0; i < n; i++){ const d = up ? 0.12 : 0.17; N.push({t, d, f0:up ? f*0.55 : f, f1:up ? f : f*0.48, cv:0.7, a:0.9, h:[1, 0.06], at:0.01, rl:0.03}); t += d + (up ? 0.06 : 0.09); }
    return [N, t + 0.05]; },
  // rock pigeon: a throaty 'coo-roo-coo'
  pigeon(){ const N = [], f = rr(380, 450);
    N.push({t:0.03, d:0.32, f0:f*1.05, f1:f*0.95, a:0.6, h:[1, 0.55, 0.3, 0.12], am:[34, 0.55], nz:0.12, at:0.04, rl:0.06});
    N.push({t:0.42, d:0.45, f0:f*1.18, f2:f*1.25, f1:f*0.98, a:0.85, h:[1, 0.55, 0.3, 0.12], am:[30, 0.6], nz:0.12, at:0.05, rl:0.08});
    N.push({t:0.98, d:0.38, f0:f, f1:f*0.9, a:0.55, h:[1, 0.5, 0.25, 0.1], am:[30, 0.5], nz:0.12, at:0.05, rl:0.1});
    return [N, 1.45]; },
  // European starling: whistles, clicks and wheezes
  starling(){ const N = []; let t = 0.03; const n = ri(8, 14);
    for (let i = 0; i < n; i++){ const k = rnd(), d = k < 0.4 ? rr(0.1, 0.3) : k < 0.7 ? rr(0.02, 0.05) : rr(0.15, 0.35), f = k < 0.4 ? rr(1500, 6000) : rr(2000, 4500);
      N.push(k < 0.4 ? {t, d, f0:f, f1:f*rr(0.5, 1.6), a:rr(0.5, 0.9), h:[1, 0.08], at:0.01, rl:0.03} : k < 0.7 ? {t, d, f0:f, f1:f, a:0.7, h:[1, 0.5, 0.3], nz:0.8, at:0.002, rl:0.01} : {t, d, f0:f, f1:f*0.9, a:0.5, h:[1, 0.4], nz:0.65, fm:[rr(40, 80), 0.06], at:0.02, rl:0.04});
      t += d + rr(0.04, 0.15); }
    return [N, t + 0.05]; },
  // katydid: 'ka-ty-did', two or three pulsed rasps
  katydid(){ const N = []; let t = 0.03; const n = ri(2, 3), f = rr(4300, 5200);
    for (let i = 0; i < n; i++){ N.push({t, d:rr(0.06, 0.09), f0:f, f1:f*0.97, a:0.9, h:[1, 0.3], nz:0.45, am:[170, 0.9], at:0.004, rl:0.01}); t += rr(0.15, 0.2); }
    return [N, t + 0.05]; }
};
const BIRDS_SG = ['koel', 'bulbul', 'robin', 'kingfisher', 'myna', 'oriole', 'dove'];
const BIRDS_BAY = ['sparrow', 'finch', 'crow', 'mdove', 'gull', 'wcsparrow', 'jay'];
const NIGHT_SG = ['nightjar', 'gecko', 'bullfrog', 'tokfrog'], NIGHT_BAY = ['chorusfrog', 'owl'];
const BIRDS_NY = ['hsparrow', 'amrobin', 'cardinal', 'jay', 'mdove', 'pigeon', 'gull', 'starling', 'crow'], NIGHT_NY = ['katydid', 'owl'];
/* ---- the bank is built in slices: a job is a function returning true when done; each call does < ~0.5 ms of work.
   Loops and strikes are sums of "voices": fn(a, i0, i1) adds samples i0..i1 to the channel array a (state in the closure). */
const CH = 2048;
function voicesJob(E, key, sec, nch, mkVoices, loop, peak){
  const n = Math.ceil(sec*NSR), m = loop ? Math.floor(0.2*NSR) : 0, A = []; let c = -1, V = null, vi = 0, i0 = 0;
  return () => {
    if (c < 0 || vi >= V.length){
      if (c >= 0) A[c] = loop ? normPeak(loopify(A[c], m), peak || 0.8) : A[c];
      c++;
      if (c >= nch){ if (!loop){ let mx = 0; for (const a of A) for (let i = 0; i < a.length; i++){ const v = Math.abs(a[i]); if (v > mx) mx = v; } if (mx > 0) for (const a of A){ const k = (peak || 0.9)/mx; for (let i = 0; i < a.length; i++) a[i] *= k; } }
        E.bank[key] = mkBuf(E.ctx, A, NSR); return true; }
      A[c] = new Float32Array(n + m); V = mkVoices(c); vi = 0; i0 = 0; return false;
    }
    const a = A[c], i1 = Math.min(a.length, i0 + CH); V[vi](a, i0, i1); i0 = i1; if (i0 >= a.length){ vi++; i0 = 0; } return false;
  };
}
function phraseJob(E, key, sp){
  let N = null, a = null, k = 0, st = null;
  return () => {
    if (!N){ const r = SP[sp](); N = r[0]; a = new Float32Array(Math.ceil(r[1]*NSR)); return false; }
    if (k < N.length){ if (!st) st = {i:0, ph:rnd()*TAU, lp:0, lp2:0}; if (nsynth(a, NSR, N[k], st, CH)){ k++; st = null; } return false; }
    E.bank[key] = mkBuf(E.ctx, [normPeak(a, 0.9)], NSR); return true;
  };
}
// cicadas: pulse-modulated 4.3-5.8 kHz carriers with slow swells, one rising whine
function vCicada(){
  const V = [];
  for (let v = 0; v < 3; v++){
    const fc = rr(4300, 5800), fp = rr(150, 230), sw = rr(0.18, 0.4), ph0 = rnd()*TAU, amp = rr(0.5, 1), rise = v === 2; let ph = 0;
    V.push((a, i0, i1) => { for (let i = i0; i < i1; i++){ const t = i/NSR, sl = 0.55 + 0.45*Math.sin(TAU*sw*t + ph0), q = (t*0.4) % 1, f = rise ? fc*(0.8 + 0.25*q) : fc;
      ph += TAU*f/NSR; const p = 0.5 + 0.5*Math.sin(TAU*fp*t + v), p2 = p*p; a[i] += amp*sl*sl*p2*p2*Math.sin(ph)*(rise ? sstep(0, 0.6, q)*(1 - sstep(0.85, 1, q)) : 1); } });
  }
  return V;
}
// night insects: Singapore katydids / crickets (continuous and gated trills 4-7.5 kHz); the Bay's field crickets (3-4 pulse chirps)
function vInsects(bay){
  const V = [];
  if (!bay) for (let v = 0; v < 5; v++){ const fc = rr(4000, 7500), pr = rr(30, 70), on = rr(0.4, 1), per = rr(0.7, 2.2), off = rnd()*per, amp = rr(0.3, 1); let ph = 0;
    V.push((a, i0, i1) => { for (let i = i0; i < i1; i++){ const t = i/NSR; ph += TAU*fc/NSR; if (((t + off) % per) >= per*on) continue; const p = 0.5 + 0.5*Math.sin(TAU*pr*t); a[i] += amp*p*p*Math.sin(ph); } }); }
  else for (let v = 0; v < 4; v++){ const fc = rr(4200, 5000), per = rr(0.45, 0.75), np = ri(3, 4), off = rnd()*per, amp = rr(0.4, 1); let ph = 0;
    V.push((a, i0, i1) => { for (let i = i0; i < i1; i++){ const t = (i/NSR + off) % per, k = Math.floor(t/0.032), u = (t - k*0.032)/0.018; ph += TAU*fc/NSR; if (k < np && u < 1) a[i] += amp*Math.sin(PI*u)*Math.sin(ph); } }); }
  return V;
}
// rain drops: short decaying plinks with a click
function vDrops(sec){
  const n = Math.ceil(sec*NSR) + Math.floor(0.2*NSR), k = Math.floor(sec*170), D = [];
  for (let j = 0; j < k; j++) D.push([Math.floor(rnd()*(n - 400)), rr(1400, 5200), rr(0.002, 0.009)*NSR, Math.pow(rnd(), 2.2)]);
  D.sort((p, q) => p[0] - q[0]);
  return [(a, i0, i1) => { for (const [s0, f, tau, amp] of D){ if (s0 >= i1 || s0 + 400 <= i0) continue; for (let i = Math.max(i0, s0); i < Math.min(i1, s0 + 400); i++){ const q = i - s0; a[i] += amp*Math.exp(-q/tau)*(Math.sin(TAU*f*q/NSR) + (q < 12 ? rr(-0.6, 0.6) : 0)); } } }];
}
// a struck bell / chime / gong: inharmonic partials [ratio, amplitude, decay factor]
function vBell(f, partials, decay){
  return partials.filter(p => f*p[0] < NSR*0.45).map(([r, amp, dk]) => { const fr = f*r, ph = rnd()*TAU, td = decay*dk;
    return (a, i0, i1) => { for (let i = i0; i < i1; i++){ const t = i/NSR; a[i] += amp*Math.exp(-t/td)*Math.sin(TAU*fr*t + ph)*Math.min(1, i/20); } }; });
}
function vClang(){
  const V = vBell(1, [[175*rr(0.9, 1.1), 1, 0.9], [410*rr(0.9, 1.1), 0.7, 0.6], [760*rr(0.9, 1.1), 0.5, 0.45], [1190*rr(0.9, 1.1), 0.35, 0.3], [1730*rr(0.9, 1.1), 0.25, 0.2], [2450*rr(0.9, 1.1), 0.15, 0.12]], 1);
  let lp = 0; V.push((a, i0, i1) => { for (let i = i0; i < Math.min(i1, 900); i++){ lp += ((rnd()*2 - 1) - lp)*0.6; a[i] += 1.4*lp*Math.exp(-i/120); } });
  return V;
}
function vTick(f, body, at){ let lp = 0; const s0 = Math.floor((at || 0)*NSR); return [(a, i0, i1) => { for (let i = Math.max(i0, s0); i < Math.min(i1, s0 + 1300); i++){ const t = (i - s0)/NSR; lp += ((rnd()*2 - 1) - lp)*0.5; a[i] += Math.exp(-t/0.004)*lp*0.8 + body*Math.exp(-t/0.018)*Math.sin(TAU*f*t); } }]; }
function vBeeps(f, n, on, off){ return [(a, i0, i1) => { for (let i = i0; i < i1; i++){ const t = i/NSR, k = Math.floor(t/(on + off)), u = t - k*(on + off); if (k >= n || u >= on) continue; const e = Math.min(1, u*NSR/60, (on - u)*NSR/120); a[i] += e*(Math.sin(TAU*f*t) + 0.25*Math.sin(TAU*3*f*t)); } }]; }
// rail joints: one car length passing a joint: four axle hits (two bogies): steel clack, rubber-tyre thump or the cable-car grip
function jointLoop(gap, sp, kind){
  const per = gap/sp, a = new Float32Array(Math.ceil(per*NSR)), bc = gap*0.35, ax = [-bc - 1.25, -bc + 1.25, bc - 1.25, bc + 1.25];
  for (const x of ax){ const i0 = Math.floor(((x + gap/2)/sp)*NSR) % a.length; let lp = 0;
    for (let i = 0; i < 0.12*NSR; i++){ const t = i/NSR, k = (i0 + i) % a.length; lp += ((rnd()*2 - 1) - lp)*0.4;
      a[k] += kind === 'rubber' ? 0.9*Math.exp(-t/0.03)*Math.sin(TAU*70*t) + 0.2*lp*Math.exp(-t/0.01)
        : kind === 'cable' ? 0.5*lp*Math.exp(-t/0.006) + 0.4*Math.exp(-t/0.02)*Math.sin(TAU*520*t)
        : 0.9*lp*Math.exp(-t/0.005) + 0.7*Math.exp(-t/0.035)*Math.sin(TAU*240*t) + 0.35*Math.exp(-t/0.015)*Math.sin(TAU*710*t); } }
  return normPeak(a, 0.9);
}
// the bank jobs (run in slices in the live context, all at once offline)
function bankJobs(E){
  const ny = auNyc(), bay = auBay() || ny, J = [];      // New York: the US sounds of the Bay (crickets, signal ticks, door beeps) with its own birds
  for (const s of ny ? BIRDS_NY : bay ? BIRDS_BAY : BIRDS_SG) for (let v = 0; v < 2; v++) J.push(phraseJob(E, s + v, s));
  for (const s of ny ? NIGHT_NY : bay ? NIGHT_BAY : NIGHT_SG) for (let v = 0; v < 2; v++) J.push(phraseJob(E, s + v, s));
  if (!bay) J.push(voicesJob(E, 'cicada', 5.2, 2, vCicada, true));
  J.push(voicesJob(E, 'insects', 4.6, 2, () => vInsects(bay), true));
  J.push(voicesJob(E, 'drops', 2.6, 2, () => vDrops(2.6), true));
  J.push(voicesJob(E, 'bell', 1.6, 1, () => vBell(1046, [[1, 1, 1], [2.32, 0.6, 0.55], [4.25, 0.45, 0.35], [6.63, 0.25, 0.22], [9.1, 0.12, 0.15]], 0.9)));
  J.push(voicesJob(E, 'gong', 1.4, 1, () => vBell(660, [[1, 1, 1], [2.76, 0.5, 0.5], [5.4, 0.3, 0.3], [8.9, 0.12, 0.2]], 0.8)));
  [784, 659, 523].forEach((f, i) => J.push(voicesJob(E, 'chime' + i, i === 2 ? 1.8 : 1.4, 1, () => vBell(f, [[1, 1, 1], [2, 0.25, 0.5], [3, 0.12, 0.3]], i === 2 ? 0.8 : 0.7))));
  J.push(voicesJob(E, 'clang0', 1.4, 1, vClang)); J.push(voicesJob(E, 'clang1', 1.4, 1, vClang));
  J.push(voicesJob(E, 'doorbeep', 0.62, 1, () => vBeeps(bay ? 1320 : 2050, 3, 0.11, 0.09), false, 0.8));
  J.push(voicesJob(E, 'alarm', 1.82, 1, () => vBeeps(2700, 6, 0.18, 0.12), false, 0.8));
  J.push(voicesJob(E, 'reverse', 3.02, 1, () => vBeeps(1180, 5, 0.32, 0.28), false, 0.8));
  // pedestrian signal ticks: the slow locator and the fast walk loops (one tick at the start of each period)
  J.push(voicesJob(E, 'xslow', bay ? 1.0 : 1.05, 1, () => vTick(bay ? 1500 : 880, bay ? 0.4 : 1.0), false));
  J.push(voicesJob(E, 'xfast', bay ? 0.125 : 0.14, 1, () => vTick(bay ? 1500 : 1250, bay ? 0.4 : 0.7), false));
  return J.concat(bankJobs27(E));
}
/* ---------------------------------------------------------------- [lm24/sound] v27 bank: voices, crowds, music, animals, impacts ----
   Everything below is rendered at 22.05 kHz in small slices like the rest of the bank (no samples, no words):
   - a formant talker (glottal buzz through three moving formants, consonant noise, utterances and pauses) makes the crowd babble,
     children at play, laughter, wordless vendor calls, ride screams, a stadium roar and a chant-like pad (vowels only);
   - walkers' footsteps, applause, a hawker kitchen (woks, ladles, sizzle, plates, cleavers), a jackhammer, flags, hooves;
   - music rendered from generated note lists (random keys, scales and rhythms: nothing recognisable): shop music heard through
     doors, light-show pads and arpeggios, busker phrases (guitar, sax, steel pan, violin), a carousel waltz, ballpark organ riffs,
     a lounge piano, a carillon, a hand-drum circle;
   - animals (dogs, sea lions, parrots, gibbons, ducks, geese) with the note synthesiser;
   - impact buffers for SGAudio.fx (metal crunch, glass, debris, wood creak). */
const VOW = [[730, 1090, 2440], [530, 1840, 2480], [270, 2290, 3010], [570, 840, 2410], [300, 870, 2240], [660, 1720, 2410], [520, 1190, 2390], [490, 1350, 1690]];
const VOW_A = [[730, 1090, 2440], [660, 1720, 2410], [620, 1200, 2500]], VOW_OU = [[570, 840, 2410], [300, 870, 2240], [450, 900, 2300], [600, 1000, 2400]];
// a constant-peak band-pass biquad: [b0, a1, a2] at o[k..k+2] (y = b0 (x - x2) - a1 y1 - a2 y2)
function bqCo(f, q, o, k){ const w = TAU*Math.min(f, NSR*0.45)/NSR, al = Math.sin(w)/(2*q), a0 = 1 + al; o[k] = al/a0; o[k + 1] = -2*Math.cos(w)/a0; o[k + 2] = (1 - al)/a0; }
// one talker over n samples. o: f0 (Hz), fs (formant scale), syl [min, max] per utterance, dur [s] per syllable, gl [pitch glide range],
// cons (consonant probability), pause [s], lvl, breath (noise in the voice), decl (pitch declination per syllable), vow (vowel set)
// a fast noise source (xorshift32): -1..1
let NZS = 0x9e3779b9 | 0;
const nzf = () => { NZS ^= NZS << 13; NZS ^= NZS >>> 17; NZS ^= NZS << 5; return NZS/2147483648; };
function vTalker(n, o){
  const S = [], vw = o.vow || VOW; let t = Math.floor(rr(0, o.lead === undefined ? 0.8 : o.lead)*NSR);
  while (t < n - 400){
    const ns = ri(o.syl[0], o.syl[1]); let f0 = o.f0*rr(0.9, 1.12), V = pick(vw);
    for (let s = 0; s < ns && t < n - 400; s++){
      const d = Math.floor(NSR*rr(o.dur[0], o.dur[1])), W = pick(vw), f1 = f0*rr(o.gl[0], o.gl[1]);
      S.push(t, t + d, f0, f1, V[0], W[0], V[1], W[1], rnd() < o.cons ? ri(1, 3) : 0, rr(0.55, 1));
      t += d; f0 = f1*(1 + (o.decl === undefined ? -0.015 : o.decl)); if (f0 < o.f0*0.65) f0 = o.f0*0.75; V = W;
    }
    t += Math.floor(NSR*rr(o.pause[0], o.pause[1]));
  }
  const NS = S.length/10, C = new Float64Array(9), lvl = o.lvl || 1, br = o.breath || 0.04, fs = o.fs || 1, Z = new Float64Array(16);
  Z[1] = rnd(); Z[15] = (rnd()*2147483647) | 1;
  // state in Z (copied to locals per call: closure variables would stay in memory on every access):
  // 0 si, 1 ph, 2 sl, 3 nl, 4 nl2, 5 cc, 6 ve, 7 vt, 8 ce, 9 finc, 10 cons, 11 x1, 12 x2, 13-14 spare, 15 noise seed; Y: filter states
  const Y = new Float64Array(6);
  return (a, i0, i1) => {
    let si = Z[0], ph = Z[1], sl = Z[2], nl = Z[3], nl2 = Z[4], cc = Z[5], ve = Z[6], vt = Z[7], ce = Z[8], finc = Z[9], cons = Z[10], x1 = Z[11], x2 = Z[12], ns = Z[15] | 0;
    let ya1 = Y[0], ya2 = Y[1], yb1 = Y[2], yb2 = Y[3], yc1 = Y[4], yc2 = Y[5];
    const c0 = C, end = NS;
    for (let i = i0; i < i1; i++){
      while (si < end && i >= S[si*10 + 1]) si++;
      if (si >= end) break;
      const b = si*10, s0 = S[b];
      if (i < s0){ vt = 0; ve *= 0.995; if (ve < 1e-4) continue; }
      else if ((cc++ & 31) === 0){ const u = (i - s0)/(S[b + 1] - s0), w = sstep(0.15, 0.85, u); cons = S[b + 8]; const nas = cons === 3 && u < 0.3;
        bqCo(nas ? 280 : (S[b + 4] + (S[b + 5] - S[b + 4])*w)*fs, 6, c0, 0); bqCo(nas ? 1100 : (S[b + 6] + (S[b + 7] - S[b + 6])*w)*fs, 9, c0, 3); bqCo(2650*fs, 10, c0, 6);
        finc = (S[b + 2] + (S[b + 3] - S[b + 2])*u)/NSR; const on = cons ? 0.2 : 0.05; vt = sstep(on, on + 0.12, u)*(1 - sstep(0.72, 1, u))*S[b + 9];
        ce = cons === 1 && u < on ? 0.12*sstep(0, on*0.4, u)*(1 - sstep(on*0.7, on, u))*S[b + 9] : cons === 2 && u > on - 0.04 && u < on ? 0.25*S[b + 9] : 0; }
      ve += (vt - ve)*0.08;
      ph += finc; if (ph >= 1) ph -= 1;
      sl += ((1 - 2*ph) - sl)*0.3;
      ns ^= ns << 13; ns ^= ns >>> 17; ns ^= ns << 5; const w = ns/2147483648; nl += (w - nl)*0.5;
      const x = (sl + nl*br)*ve, xd = x - x2;
      const ya = c0[0]*xd - c0[1]*ya1 - c0[2]*ya2; ya2 = ya1; ya1 = ya;
      const yb = c0[3]*xd - c0[4]*yb1 - c0[5]*yb2; yb2 = yb1; yb1 = yb;
      const yc = c0[6]*xd - c0[7]*yc1 - c0[8]*yc2; yc2 = yc1; yc1 = yc;
      x2 = x1; x1 = x;
      let s = ya + 0.8*yb + 0.35*yc;
      if (ce){ if (cons === 1){ nl2 += (w - nl2)*0.9; s += (w - nl2)*ce; } else s += w*ce; }
      a[i] += lvl*s;
    }
    Z[0] = si; Z[1] = ph; Z[2] = sl; Z[3] = nl; Z[4] = nl2; Z[5] = cc; Z[6] = ve; Z[7] = vt; Z[8] = ce; Z[9] = finc; Z[10] = cons; Z[11] = x1; Z[12] = x2; Z[15] = ns;
    Y[0] = ya1; Y[1] = ya2; Y[2] = yb1; Y[3] = yb2; Y[4] = yc1; Y[5] = yc2;
  };
}
const TK = {      // talker presets
  adult:  () => { const f = rnd() < 0.5; return {f0:f ? rr(175, 235) : rr(95, 140), fs:f ? 1.13 : 1, syl:[3, 13], dur:[0.13, 0.3], gl:[0.93, 1.07], cons:0.55, pause:[0.15, 1.4], lvl:rr(0.25, 1), breath:0.05}; },
  near:   () => { const f = rnd() < 0.5; return {f0:f ? rr(180, 230) : rr(100, 135), fs:f ? 1.13 : 1, syl:[4, 14], dur:[0.14, 0.28], gl:[0.92, 1.08], cons:0.6, pause:[0.3, 2.2], lvl:rr(0.7, 1), breath:0.05}; },
  kid:    () => ({f0:rr(260, 390), fs:1.28, syl:[2, 8], dur:[0.12, 0.32], gl:[0.82, 1.28], cons:0.4, pause:[0.3, 2.2], lvl:rr(0.3, 1), breath:0.07, decl:0}),
  shriek: () => ({f0:rr(480, 720), fs:1.3, syl:[1, 2], dur:[0.35, 0.8], gl:[0.75, 1.4], cons:0.1, pause:[1.2, 4.5], lvl:rr(0.4, 0.9), breath:0.12, decl:0, vow:VOW_A}),
  laugh:  () => { const f = rnd() < 0.5; return {f0:f ? rr(200, 260) : rr(110, 150), fs:f ? 1.12 : 1, syl:[4, 8], dur:[0.1, 0.15], gl:[0.94, 1.02], cons:1.01, pause:[3, 3], lvl:1, breath:0.25, decl:-0.03, vow:VOW_A, lead:0.05}; },
  call:   () => { const f = rnd() < 0.4; return {f0:f ? rr(210, 280) : rr(150, 210), fs:f ? 1.1 : 1, syl:[2, 4], dur:[0.32, 0.8], gl:[0.82, 1.25], cons:0.35, pause:[4, 4], lvl:1, breath:0.08, decl:0, lead:0.05}; },
  scream: () => ({f0:rr(380, 760), fs:rr(1.1, 1.3), syl:[1, 2], dur:[0.6, 1.6], gl:[0.7, 1.35], cons:0.05, pause:[0.2, 0.8], lvl:rr(0.4, 1), breath:0.25, decl:0, vow:VOW_A, lead:0.3}),
  roar:   () => ({f0:rr(130, 300), fs:rr(1, 1.2), syl:[1, 3], dur:[0.3, 0.9], gl:[0.9, 1.15], cons:0.2, pause:[0, 0.4], lvl:rr(0.3, 1), breath:0.22, decl:0, vow:VOW_A}),
  chant:  f => ({f0:f*rr(0.995, 1.005), fs:1, syl:[4, 9], dur:[0.45, 1.1], gl:[0.995, 1.005], cons:0.12, pause:[0.05, 0.35], lvl:rr(0.6, 1), breath:0.03, decl:-0.001, vow:VOW_OU, lead:0.1})};
// a crowd loop / one-shot from talkers (k per channel)
const talkJob = (E, key, sec, nch, k, preset, loop, peak) => voicesJob(E, key, sec, nch, () => { const n = Math.ceil((sec + 0.2)*NSR), V = []; for (let i = 0; i < k; i++) V.push(vTalker(n, typeof preset === 'function' ? preset(i) : TK[preset]())); return V; }, loop, peak);
// a short event inside a buffer: fn(q) = sample at local index q, len samples, from sample s0
const evV = (s0, len, fn) => (a, i0, i1) => { const a0 = Math.max(i0, s0), a1 = Math.min(i1, s0 + len, a.length); for (let i = a0; i < a1; i++) a[i] += fn(i - s0); };
// a struck metal / ceramic / glass object: inharmonic partials [f, amp, tau s]
function hitV(s0, P, amp){ const n = P.length, c = new Float64Array(n), sn = new Float64Array(n), re = new Float64Array(n), im = new Float64Array(n), dc = new Float64Array(n); let len = 0;
  for (let j = 0; j < n; j++){ const w = TAU*Math.min(P[j][0], NSR*0.45)/NSR, ph = rnd()*TAU, g = P[j][1]*amp; c[j] = Math.cos(w); sn[j] = Math.sin(w); re[j] = g*Math.cos(ph); im[j] = g*Math.sin(ph); dc[j] = Math.exp(-1/(P[j][2]*NSR)); len = Math.max(len, Math.ceil(P[j][2]*6*NSR)); }
  return evV(s0, len, q => { let o = 0; for (let j = 0; j < n; j++){ const r = (re[j]*c[j] - im[j]*sn[j])*dc[j], i2 = (re[j]*sn[j] + im[j]*c[j])*dc[j]; re[j] = r; im[j] = i2; o += i2; } return q < 12 ? o*q/12 : o; }); }
// a filtered noise burst: one-pole low-pass (lp 0-1 coefficient) and high-pass by difference (hp), decay tau s
function burstV(s0, amp, tau, lp, hp){ let l = 0, l2 = 0, e = amp; const k = Math.exp(-1/(tau*NSR)), len = Math.ceil(tau*7*NSR);
  return evV(s0, len, q => { l += (nzf() - l)*lp; const o = hp ? l - l2 : l; l2 += (l - l2)*0.08; e *= k; return q < 4 ? e*o*q/4 : e*o; }); }
// footsteps of walkers (heel + toe), a loop
function vSteps(n, k, run){
  const V = [];
  for (let w = 0; w < k; w++){ const per = run ? rr(0.31, 0.36) : rr(0.48, 0.62), amp = rr(0.25, 1)*(run ? 1.3 : 1), lp = rr(0.25, 0.6); let t = rr(0, 1)*NSR;
    while (t < n - 2000){ V.push(burstV(Math.floor(t), amp, run ? 0.012 : 0.008, lp, true)); if (!run) V.push(burstV(Math.floor(t + rr(0.05, 0.08)*NSR), amp*0.6, 0.014, lp*0.7, true));
      V.push(hitV(Math.floor(t), [[rr(95, 140), amp*0.5, 180/NSR]], 1)); t += per*rr(0.96, 1.04)*NSR; if (rnd() < 0.04) t += rr(0.5, 2)*NSR; } }
  return V;
}
// applause: k clappers, swelling and dying away
function vClaps(n, k){ const V = []; for (let c = 0; c < k; c++){ const per = rr(0.16, 0.24), lp = rr(0.3, 0.7), amp = rr(0.3, 1), t1 = n*rr(0.55, 0.95); let t = rr(0.02, 0.4)*NSR;
  while (t < t1){ const e = Math.min(1, t/(0.3*NSR))*(1 - Math.max(0, (t - t1*0.6)/(t1*0.4))); V.push(burstV(Math.floor(t), amp*e, 0.006, lp, true)); t += per*rr(0.9, 1.1)*NSR; } } return V; }
// the hawker kitchen: ladles on woks, scraping, sizzle, plates, cleavers, cutlery
function vHawker(n){
  const V = []; let t = rr(0, 0.5)*NSR;
  while (t < n - 4000){
    const r = rnd(), s0 = Math.floor(t);
    if (r < 0.32){ const base = rr(1250, 2100), m = ri(3, 8); let u = s0; for (let j = 0; j < m; j++){ V.push(hitV(u, [[base, 1, rr(0.05, 0.14)], [base*2.31, 0.55, 0.08], [base*3.86, 0.3, 0.05], [base*5.2, 0.18, 0.03]], rr(0.25, 0.6))); V.push(burstV(u + 300, rr(0.08, 0.18), 0.05, 0.7, true)); u += Math.floor(rr(0.11, 0.22)*NSR); } }
    else if (r < 0.5){ const len = Math.floor(rr(1.2, 3.2)*NSR), amp = rr(0.08, 0.16); let l = 0, l2 = 0, cr = 0;
      V.push(evV(s0, len, q => { const w = nzf(); l += (w - l)*0.9; const h = l - l2; l2 += (l - l2)*0.2; if (rnd() < 0.004) cr = rr(0.5, 1.2); cr *= 0.93; const e = Math.min(1, q/2000)*Math.min(1, (len - q)/6000); return amp*e*(h*0.8 + cr*w); })); }
    else if (r < 0.68){ const m = ri(1, 3); let u = s0; for (let j = 0; j < m; j++){ const f = rr(2600, 4200); V.push(hitV(u, [[f, 1, rr(0.03, 0.07)], [f*1.47, 0.6, 0.04], [f*2.2, 0.3, 0.02]], rr(0.15, 0.4))); u += Math.floor(rr(0.06, 0.25)*NSR); } }
    else if (r < 0.8){ const m = ri(2, 6); let u = s0; for (let j = 0; j < m; j++){ V.push(hitV(u, [[rr(120, 160), 0.5, 350/NSR]], 1)); V.push(burstV(u, 0.3, 0.004, 0.5, true)); u += Math.floor(rr(0.18, 0.3)*NSR); } }
    else { const m = ri(2, 5); let u = s0; for (let j = 0; j < m; j++){ const f = rr(5200, 7800); V.push(hitV(u, [[f, 1, 0.012], [f*1.3, 0.5, 0.008]], rr(0.08, 0.2))); u += Math.floor(rr(0.04, 0.15)*NSR); } }
    t += rr(0.15, 0.7)*NSR;
  }
  return V;
}
// a jackhammer burst (one-shot)
function vJack(n){ const V = []; let t = 0.05*NSR; const per = 1/rr(21, 27); while (t < n - 3000){ if (rnd() < 0.985){ V.push(burstV(Math.floor(t), 0.7, 0.006, 0.6, false)); V.push(hitV(Math.floor(t), [[rr(160, 200), 0.8, 0.02], [1700, 0.2, 0.01]], 1)); } t += per*NSR; } return V; }
// flags flapping in the wind: flutter-modulated noise with snaps (loop)
function vFlags(n){ const V = []; for (let k = 0; k < 3; k++){ let l = 0, ph = rnd(), fr = rr(5, 9), sn = 0; const amp = rr(0.4, 1);
  V.push((a, i0, i1) => { for (let i = i0; i < i1; i++){ if ((i & 255) === 0){ fr = clamp(fr + rr(-0.6, 0.6), 4, 13); if (rnd() < 0.03) sn = 1; } ph += fr/NSR; if (ph >= 1) ph -= 1; const w = nzf(); l += (w - l)*0.35; const p = 1 - 2*Math.abs(ph - 0.5); sn *= 0.97; a[i] += amp*(l*p*p*p*0.9 + w*sn*0.6); } }); }
  return V; }
// hooves at a walk (four beats per stride), wheels rumbling (loop)
function vHooves(n){ const V = [], st = rr(1.05, 1.25); let t = 0.02*NSR, k = 0; while (t < n - 2000){ const f = rr(1600, 2300); V.push(burstV(Math.floor(t), 0.9*(k % 2 ? 0.8 : 1), 0.007, 0.55, true)); V.push(hitV(Math.floor(t), [[f, 0.35, 0.02], [rr(380, 460), 0.5, 0.025]], 1)); t += (st/4)*rr(0.92, 1.08)*NSR*(k % 2 ? 0.85 : 1.15); k++; }
  let l = 0; V.push((a, i0, i1) => { for (let i = i0; i < i1; i++){ l += (nzf() - l)*0.02; a[i] += l*0.6; } }); return V; }
// a wood creak: stick-slip pulses gliding in rate through two body resonances (one-shot)
function vCreak(n){ const V = []; let t = 0.02*NSR, r = rr(40, 70); const r1 = rr(120, 260); while (t < n*0.85){ const u = t/n; const f = rr(380, 520), g = 0.6*Math.sin(PI*u); V.push(hitV(Math.floor(t), [[f, g, 0.012], [f*2.3, g*0.5, 0.008]], 1)); t += NSR/(r + (r1 - r)*u + rr(-8, 8)); } return V; }
// glass breaking: a crack, then tinkling shards falling (one-shot)
function vGlass(n){ const V = [burstV(0, 1, 0.004, 0.95, true)]; for (let j = 0; j < 110; j++){ const t = Math.floor(Math.pow(rnd(), 1.8)*n*0.8) + 200, f = rr(2500, 8500); V.push(hitV(t, [[f, 1, rr(0.006, 0.04)], [f*rr(1.3, 1.8), 0.5, rr(0.004, 0.02)]], rr(0.05, 0.5)*Math.exp(-t/(0.5*NSR)))); } return V; }
// debris / a metal crunch: many small impacts, a low crumple under them (one-shot)
function vDebris(n, metal){ const V = []; const m = metal ? 70 : 45;
  for (let j = 0; j < m; j++){ const t = Math.floor(Math.pow(rnd(), metal ? 2.4 : 1.4)*n*0.85), f = metal ? rr(500, 2600) : rr(700, 3200), g = rr(0.1, 0.6)*(metal ? Math.exp(-t/(0.35*NSR)) : 1);
    V.push(hitV(t, metal ? [[f, 1, rr(0.02, 0.09)], [f*1.71, 0.6, 0.04], [f*2.93, 0.35, 0.025]] : [[f, 1, rr(0.01, 0.04)], [f*1.5, 0.4, 0.015]], g)); V.push(burstV(t, g*0.6, 0.01, 0.4, false)); }
  if (metal){ let l = 0, e = 1.4; const k = Math.exp(-1/(0.25*NSR)); V.push((a, i0, i1) => { for (let i = i0; i < i1; i++){ l += (nzf() - l)*0.08; a[i] += l*e; e *= k; } }); }
  return V; }
// hand-drum circle (loop): bass tones and slaps on a 16-step grid, several players
function vDrums(n){ const V = [], bpm = rr(96, 112), st = 60/bpm/4*NSR, steps = Math.floor(n/st);
  for (let p = 0; p < 4; p++){ const pat = []; for (let s = 0; s < 16; s++) pat.push(rnd() < (s % 4 === 0 ? 0.75 : s % 2 === 0 ? 0.4 : 0.22) ? (rnd() < 0.45 ? 1 : 2) : 0); const f0 = rr(70, 95), amp = rr(0.5, 1);
    for (let s = 0; s < steps; s++){ const v = pat[s % 16]; if (!v) continue; const t = Math.floor(s*st + rr(-0.006, 0.006)*NSR); if (t < 0) continue;
      if (v === 1){ V.push(hitV(t, [[f0, amp, 1500/NSR], [f0*1.5, amp*0.3, 300/NSR]], 1)); }
      else { V.push(burstV(t, amp*0.8, 0.02, 0.5, true)); V.push(hitV(t, [[rr(330, 420), 0.6*amp, 0.04], [rr(700, 800), 0.3*amp, 0.02]], 1)); } } }
  return V; }
// ---- music: notes for the note synthesiser
const SCALES = {maj:[0, 2, 4, 5, 7, 9, 11], pent:[0, 2, 4, 7, 9], minp:[0, 3, 5, 7, 10], dor:[0, 2, 3, 5, 7, 9, 10], mix:[0, 2, 4, 5, 7, 9, 10]};
const hz = (root, sc, deg, oct) => { const L = sc.length, o = Math.floor(deg/L), d = ((deg % L) + L) % L; return root*Math.pow(2, (sc[d] + 12*(o + (oct || 0)))/12); };
const INS = {
  pluck: (t, f, d, a) => ({t, d, f0:f, f1:f, a, h:[1, 0.62, 0.45, 0.3, 0.22, 0.15, 0.1, 0.07, 0.05], dk:Math.min(0.5, d*0.5), at:0.003, rl:0.05}),
  sax:   (t, f, d, a) => ({t, d, f0:f*0.985, f2:f, f1:f, a, h:[1, 0.95, 0.8, 0.62, 0.48, 0.36, 0.26, 0.18, 0.12, 0.08], fm:[5.2, 0.009], nz:0.1, at:0.045, rl:0.07}),
  vln:   (t, f, d, a) => ({t, d, f0:f, f1:f, a, h:[1, 0.5, 0.36, 0.26, 0.2, 0.16, 0.12, 0.1, 0.08, 0.06], fm:[5.8, 0.007], nz:0.04, at:0.09, rl:0.12}),
  pan:   (t, f, d, a) => ({t, d:Math.max(d, 0.5), f0:f, f1:f, a, h:[1, 0.32, 0.5, 0.2, 0.12], dk:0.32, at:0.002, rl:0.1}),
  organ: (t, f, d, a) => ({t, d, f0:f, f1:f, a, h:[1, 0.8, 0.55, 0.5, 0, 0.35, 0, 0.3], am:[6.4, 0.18], at:0.008, rl:0.04}),
  piano: (t, f, d, a) => ({t, d:Math.max(d, 0.8), f0:f, f1:f, a, h:[1, 0.48, 0.3, 0.2, 0.12, 0.08, 0.05], dk:0.5 + 120/f, at:0.002, rl:0.25}),
  pad:   (t, f, d, a) => ({t, d, f0:f, f1:f, a, h:[1, 0.5, 0.33, 0.25, 0.2, 0.15], fm:[0.25 + rnd()*0.3, 0.003], at:Math.min(0.8, d*0.3), rl:Math.min(1.4, d*0.4)}),
  bass:  (t, f, d, a) => ({t, d, f0:f, f1:f, a, h:[1, 0.45, 0.2, 0.1], dk:0.35, at:0.008, rl:0.06}),
  glock: (t, f, d, a) => ({t, d:0.7, f0:f, f1:f, a, h:[1, 0, 0, 0.25], dk:0.25, at:0.001, rl:0.05}),
  kick:  (t, f, d, a) => ({t, d:0.22, f0:130, f1:45, cv:0.35, a, h:[1], dk:0.09, at:0.001, rl:0.03}),
  hat:   (t, f, d, a) => ({t, d:0.05, f0:7000, f1:7000, a, h:[1], nz:1, dk:0.012, at:0.001, rl:0.01})};
// a phrase on a grid: k beats per bar, n bars, chords (scale degrees), melody walk; returns notes for channel c
function songNotes(o){
  const N = [], sc = SCALES[o.sc], root = o.root, beat = 60/o.bpm, bars = o.bars, bpb = o.bpb || 4, chords = o.ch;
  for (let b = 0; b < bars; b++){
    const t0 = b*bpb*beat + (o.lead || 0), cd = chords[b % chords.length];
    if (o.pad) for (const d of [0, 2, 4]) N.push(INS[o.pad](t0, hz(root, sc, cd + d, -1)*rr(0.997, 1.003), bpb*beat*1.02, 0.18));
    if (o.bass) for (let k = 0; k < bpb; k += o.bassEvery || 2) N.push(INS[o.bass](t0 + k*beat, hz(root, sc, cd + (k && o.bassWalk ? pick([0, 4, 2]) : 0), -2), beat*1.6, 0.5));
    if (o.comp) for (let k = 0; k < bpb; k++){ if (o.waltz && !k) continue; for (const d of [0, 2, 4]) N.push(INS[o.comp](t0 + k*beat + (o.swing && k % 2 ? beat*0.1 : 0), hz(root, sc, cd + d, 0), beat*0.45, 0.14)); }
    if (o.arp){ const st = o.arpStep || 0.25; for (let k = 0; k < bpb/st; k++){ const d = [0, 2, 4, 7, 4, 2][k % 6]; N.push(INS[o.arp](t0 + k*st*beat, hz(root, sc, cd + d, o.arpOct || 1), st*beat*2, 0.2*(k % 4 ? 0.7 : 1))); } }
    if (o.drum){ for (let k = 0; k < bpb; k++){ if (k % 2 === 0) N.push(INS.kick(t0 + k*beat, 0, 0, 0.6)); N.push(INS.hat(t0 + (k + 0.5)*beat, 0, 0, 0.12)); } }
  }
  if (o.mel){ let deg = ri(0, 4), t = o.lead || 0; const T = bars*bpb*beat - 0.4;
    while (t < T){ const rest = rnd() < (o.rest || 0.2); const d = beat*pick(o.rh || [0.5, 0.5, 1, 1, 1.5, 2]);
      if (!rest) N.push(INS[o.mel](t, hz(root, sc, deg, o.melOct || 1), Math.min(d*0.95, T - t), o.melA || 0.45));
      t += d; deg = clamp(deg + pick([-2, -1, -1, 1, 1, 2, 0, 3, -3]), -2, 9); }
  }
  return N;
}
// a wavetable version of nsynth for the music (one table lookup per sample instead of a sine per harmonic; tables cached by the
// harmonic recipe and the octave band of the highest frequency, harmonics above Nyquist dropped)
const WT = 2048, WTC = new Map();
function wtab(H, fmax){
  const band = Math.ceil(Math.log2(Math.max(20, fmax))*2), key = H.join(',') + '|' + band; let T = WTC.get(key); if (T) return T;
  const ftop = Math.pow(2, band/2); T = new Float32Array(WT + 1);
  for (let h = 0; h < H.length; h++){ if (!H[h] || (h + 1)*ftop > NSR*0.46) continue; const g = H[h]; for (let i = 0; i <= WT; i++) T[i] += g*Math.sin(TAU*(h + 1)*i/WT); }
  WTC.set(key, T); return T;
}
function nsynthT(arr, sr, N, st, maxN){
  const n0 = Math.floor(N.t*sr), len = Math.max(2, Math.floor(N.d*sr)), at = Math.max(1, (N.at || 0.006)*sr), rl = Math.max(1, (N.rl || 0.02)*sr);
  const fm = N.fm, am = N.am, nz = N.nz || 0, cv = N.cv || 1, A = N.a === undefined ? 1 : N.a, f2 = N.f2;
  if (!st.T){ st.T = wtab(N.h || [1], Math.max(N.f0, N.f1, f2 || 0)*(fm ? 1 + fm[1] : 1)); st.e = 1; st.k = N.dk ? Math.exp(-1/(N.dk*sr)) : 1; st.ph = rnd(); }
  const T = st.T, k = st.k; let ph = st.ph, lp = st.lp, lp2 = st.lp2, i = st.i, e1 = st.e; const iEnd = Math.min(len, i + maxN);
  for (; i < iEnd; i++){
    const kk = n0 + i; if (kk >= arr.length){ i = len; break; }
    const u = i/len;
    let f = f2 !== undefined ? (u < 0.5 ? lerp(N.f0, f2, sstep(0, 1, u*2)) : lerp(f2, N.f1, sstep(0, 1, u*2 - 1))) : (cv === 1 ? N.f0 + (N.f1 - N.f0)*u : lerp(N.f0, N.f1, Math.pow(u, cv)));
    if (fm) f *= 1 + fm[1]*Math.sin(TAU*fm[0]*i/sr);
    ph += f/sr; ph -= Math.floor(ph);
    const x = ph*WT, j = x | 0; let s = T[j] + (T[j + 1] - T[j])*(x - j);
    if (nz){ lp += (nzf() - lp)*0.45; lp2 += (lp - lp2)*0.45; s = s*(1 - nz) + nz*2.2*lp2*Math.sin(TAU*ph); }
    let e = i < at ? i/at : 1; const r = (len - i)/rl; if (r < e) e = r; e = e*e*(3 - 2*e);
    e *= e1; e1 *= k;
    if (am) e *= 1 - am[1]*(0.5 - 0.5*Math.cos(TAU*am[0]*i/sr));
    if (kk >= 0) arr[kk] += A*e*s;
  }
  st.ph = ph; st.lp = lp; st.lp2 = lp2; st.i = i; st.e = e1;
  return i >= len;
}
// notes -> a buffer (mono or one note list per channel), resumable like phraseJob; loop: cross-faded loop
function notesJob(E, key, sec, nch, mkNotes, loop, peak){
  const n = Math.ceil(sec*NSR), m = loop ? Math.floor(0.25*NSR) : 0, A = []; let c = -1, N = null, k = 0, st = null;
  return () => {
    if (c < 0 || k >= N.length){
      if (c >= 0 && loop) A[c] = loopify(A[c], m);
      c++;
      if (c >= nch){ let mx = 0; for (const a of A) for (let i = 0; i < a.length; i++){ const v = Math.abs(a[i]); if (v > mx) mx = v; } if (mx > 0) for (const a of A){ const g = (peak || 0.85)/mx; for (let i = 0; i < a.length; i++) a[i] *= g; }
        E.bank[key] = mkBuf(E.ctx, A, NSR); return true; }
      A[c] = new Float32Array(n + m); N = mkNotes(c); k = 0; st = null; return false;
    }
    if (!st) st = {i:0, ph:0, lp:0, lp2:0, T:null};
    if (nsynthT(A[c], NSR, N[k], st, CH*2)){ k++; st = null; }
    return false;
  };
}
// carillon / temple bells: one bell = inharmonic partials as separate decaying sines
const bellNotes = (t, f, a, dk) => [[0.5, 0.5, 1.6], [1, 1, 1], [1.19, 0.45, 0.7], [1.5, 0.35, 0.6], [2, 0.5, 0.5], [2.5, 0.2, 0.35], [3.0, 0.15, 0.25]].map(([r, g, k]) => ({t, d:dk*k*3.2, f0:f*r, f1:f*r, a:a*g, h:[1], dk:dk*k, at:0.002, rl:0.1}));
// animals for the note synthesiser (phraseJob): [notes, duration]
Object.assign(SP, {
  dog(){ const N = []; let t = 0.03; const n = ri(1, 4), f = rr(300, 420);
    for (let i = 0; i < n; i++){ const d = rr(0.12, 0.18); N.push({t, d, f0:f*0.9, f2:f*1.25, f1:f*0.7, a:rr(0.75, 1), h:[0.4, 1, 0.9, 0.75, 0.6, 0.5, 0.4, 0.3, 0.22, 0.15], nz:0.42, at:0.006, rl:0.04}); t += d + rr(0.12, 0.35); }
    return [N, t + 0.05]; },
  yap(){ const N = []; let t = 0.03; const n = ri(2, 6), f = rr(650, 900);
    for (let i = 0; i < n; i++){ const d = rr(0.06, 0.1); N.push({t, d, f0:f, f2:f*1.2, f1:f*0.85, a:rr(0.7, 1), h:[0.6, 1, 0.7, 0.4, 0.25], nz:0.3, at:0.004, rl:0.02}); t += d + rr(0.1, 0.22); }
    return [N, t + 0.05]; },
  sealion(){ const N = []; let t = 0.03; const n = ri(3, 7), f = rr(190, 280);
    for (let i = 0; i < n; i++){ const d = rr(0.18, 0.28); N.push({t, d, f0:f*1.1, f2:f*1.2, f1:f*0.85, a:rr(0.7, 1), h:[0.5, 1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.25, 0.2], nz:0.5, am:[rr(28, 40), 0.45], at:0.012, rl:0.04}); t += d + rr(0.12, 0.3); }
    return [N, t + 0.05]; },
  parrot(){ const N = []; let t = 0.03; const n = ri(2, 6);
    for (let i = 0; i < n; i++){ const d = rr(0.12, 0.26), f = rr(1500, 2300); N.push({t, d, f0:f, f2:f*rr(1.1, 1.4), f1:f*rr(0.8, 1.1), a:rr(0.6, 1), h:[1, 0.7, 0.45, 0.3], nz:0.6, fm:[rr(40, 80), 0.08], at:0.006, rl:0.03}); t += d + rr(0.05, 0.25); }
    return [N, t + 0.05]; },
  gibbon(){ const N = []; let t = 0.03, gap = 0.55; const n = ri(7, 13), f = rr(520, 620);
    for (let i = 0; i < n; i++){ const u = i/n, d = lerp(0.42, 0.22, u), lo = f*(1 + u*0.5), hi = lo*rr(1.7, 2.1); N.push({t, d, f0:lo, f2:hi, f1:lo*0.9, a:0.6 + 0.4*u, h:[1, 0.18, 0.05], at:0.02, rl:0.05}); t += d + gap; gap = Math.max(0.08, gap*0.82); }
    return [N, t + 0.1]; },
  duck(){ const N = []; let t = 0.03; const n = ri(2, 6), f = rr(260, 340);
    for (let i = 0; i < n; i++){ const d = rr(0.13, 0.2); N.push({t, d, f0:f*1.1, f1:f*0.85, a:1 - i*0.1, h:[0.3, 0.7, 1, 0.85, 0.7, 0.55, 0.45, 0.35, 0.25], nz:0.5, at:0.01, rl:0.04}); t += d + rr(0.08, 0.18); }
    return [N, t + 0.05]; },
  goose(){ const N = []; let t = 0.03; const n = ri(1, 4), f = rr(380, 460);
    for (let i = 0; i < n; i++){ const d = rr(0.22, 0.34); N.push({t, d, f0:f*0.9, f2:f*1.12, f1:f*0.95, a:0.9, h:[0.4, 1, 0.8, 0.55, 0.4, 0.25], nz:0.3, at:0.02, rl:0.05}); t += d + rr(0.15, 0.4); }
    return [N, t + 0.05]; }
});
// the bank jobs of v27: the common sounds of the area beds and the effects up front; the rest (music, shows, bells, stadium roar,
// screams, animals of one landmark ...) is generated when a landmark or a busker first asks for it (bankWant), so a session only holds
// what it has used
function bankJobs27(E){
  const J = [];
  J.push(talkJob(E, 'babble', 5, 2, 8, 'adult', true, 0.8));
  J.push(voicesJob(E, 'steps', 4, 2, () => vSteps(Math.ceil(4.2*NSR), 6, false), true, 0.8));
  J.push(voicesJob(E, 'hawker', 6, 2, () => vHawker(Math.ceil(6.2*NSR)), true, 0.8));
  J.push(talkJob(E, 'kids', 4, 2, 6, i => i < 4 ? TK.kid() : TK.shriek(), true, 0.8));
  J.push(notesJob(E, 'shopmus0', 8, 1, () => songNotes({sc:pick(['maj', 'mix']), root:rr(196, 262), bpm:120, bars:4, ch:pick([[0, 4, 5, 3], [0, 5, 3, 4], [5, 3, 0, 4]]), pad:'pad', bass:'bass', bassEvery:1, mel:pick(['pluck', 'organ', 'glock']), melA:0.35, drum:true}), true, 0.8));
  J.push(notesJob(E, 'shopmus1', 8, 1, () => songNotes({sc:'dor', root:rr(170, 220), bpm:90, bars:3, ch:[0, 3, 4], pad:'pad', bass:'bass', bassEvery:2, bassWalk:true, mel:'piano', melA:0.3, rest:0.35, comp:'piano', swing:true}), true, 0.8));
  J.push(talkJob(E, 'laugh', 1.6, 1, 2, 'laugh', false, 0.85));
  J.push(talkJob(E, 'call0', 3.2, 1, 1, 'call', false, 0.85)); J.push(talkJob(E, 'call1', 3.2, 1, 1, 'call', false, 0.85));
  J.push(voicesJob(E, 'run', 3, 1, () => vSteps(Math.ceil(3.2*NSR), 1, true), true, 0.8));
  for (const s of ['dog', 'yap', 'duck', 'goose']) J.push(phraseJob(E, s + '0', s), phraseJob(E, s + '1', s));
  // impacts (SGAudio.fx)
  J.push(voicesJob(E, 'crunch', 1.4, 1, () => vDebris(Math.ceil(1.4*NSR), true), false, 0.9));
  J.push(voicesJob(E, 'glass', 1.6, 1, () => vGlass(Math.ceil(1.6*NSR)), false, 0.9));
  J.push(voicesJob(E, 'debris', 1.6, 1, () => vDebris(Math.ceil(1.6*NSR), false), false, 0.9));
  J.push(voicesJob(E, 'creak', 1.3, 1, () => vCreak(Math.ceil(1.3*NSR)), false, 0.9));
  J.push(voicesJob(E, 'ping', 1.6, 1, () => vBell(rr(950, 1300), [[1, 1, 1], [2.76, 0.45, 0.5], [5.4, 0.25, 0.3]], 0.45)));
  J.push(voicesJob(E, 'jack', 2.4, 1, () => vJack(Math.ceil(2.4*NSR)), false, 0.85));
  return J;
}
// the sounds made on demand: key -> job maker
const LAZY27 = {
  applause: E => voicesJob(E, 'applause', 4, 2, () => vClaps(Math.ceil(4*NSR), 30), false, 0.85),
  roar: E => talkJob(E, 'roar', 5, 2, 12, 'roar', true, 0.8),
  scream: E => talkJob(E, 'scream', 3, 1, 5, 'scream', false, 0.85),
  flags: E => voicesJob(E, 'flags', 4, 2, () => vFlags(Math.ceil(4.2*NSR)), true, 0.8),
  tbell: E => voicesJob(E, 'tbell', 7, 1, () => vBell(rr(95, 115), [[1, 1, 1], [2.02, 0.6, 0.6], [2.98, 0.35, 0.45], [4.1, 0.2, 0.3], [5.4, 0.1, 0.2]], 2.6), false, 0.9),
  hbell: E => voicesJob(E, 'hbell', 2.6, 1, () => { const V = []; let t = 0.02*NSR; for (let k = 0; k < 18; k++){ const f = rr(2350, 2500); V.push(hitV(Math.floor(t), [[f, 1, 0.35], [f*2.7, 0.3, 0.12]], rr(0.4, 0.8))); t += rr(0.09, 0.14)*NSR; } return V; }, false, 0.85),
  busk0: E => notesJob(E, 'busk0', 8, 1, () => songNotes({root:rr(180, 250), sc:'maj', bpm:rr(80, 96), bars:4, ch:[0, 3, 4, 0], arp:'pluck', arpOct:0, arpStep:0.5, mel:'pluck', melA:0.4}), false, 0.85),
  busk1: E => notesJob(E, 'busk1', 8, 1, () => songNotes({root:rr(180, 250), sc:'minp', bpm:rr(70, 84), bars:3, ch:[0, 3, 4], bass:'bass', bassEvery:2, mel:'sax', melA:0.55, rh:[1, 1, 1.5, 2, 0.5]}), false, 0.85),
  busk2: E => notesJob(E, 'busk2', 8, 1, () => songNotes({root:rr(180, 250), sc:'maj', bpm:rr(104, 116), bars:4, ch:[0, 3, 4, 0], mel:'pan', melA:0.5, rh:[0.5, 0.5, 0.5, 1], comp:'pan'}), false, 0.85),
  busk3: E => notesJob(E, 'busk3', 8, 1, () => songNotes({root:rr(180, 250), sc:pick(['dor', 'maj']), bpm:rr(66, 80), bars:3, ch:[0, 5, 3], mel:'vln', melA:0.5, rh:[1, 1, 2, 1.5], rest:0.08}), false, 0.85),
  // light shows (Supertrees, Spectra, the Rain Vortex, Times Square screens): slow pads, a shimmering arpeggio, bass swells
  show: E => notesJob(E, 'show', 12, 2, c => songNotes({sc:pick(['maj', 'dor']), root:E.showRoot || (E.showRoot = rr(130, 175)), bpm:80, bars:4, ch:[0, 5, 3, 4], pad:'pad', bass:'bass', bassEvery:4, arp:c ? 'glock' : 'pluck', arpOct:c ? 2 : 1, arpStep:0.25}), true, 0.8),
  carousel: E => notesJob(E, 'carousel', 8, 1, () => songNotes({sc:'maj', root:rr(220, 280), bpm:168, bpb:3, bars:7, ch:[0, 4, 4, 0, 3, 0, 4], bass:'organ', bassEvery:3, comp:'organ', waltz:true, mel:'glock', melA:0.5, melOct:1, rh:[1, 1, 1, 2, 0.5]}), true, 0.8),
  organ0: E => notesJob(E, 'organ0', 3.2, 1, () => songNotes({sc:'maj', root:rr(260, 330), bpm:150, bars:2, ch:[0, 4], mel:'organ', melA:0.6, rh:[0.5, 0.5, 0.5, 1], rest:0.05}), false, 0.85),
  organ1: E => notesJob(E, 'organ1', 3.2, 1, () => songNotes({sc:'mix', root:rr(240, 300), bpm:140, bars:2, ch:[0, 3], mel:'organ', melA:0.6, rh:[0.5, 1, 0.5, 1.5], rest:0.05}), false, 0.85),
  piano: E => notesJob(E, 'piano', 9, 1, () => songNotes({sc:pick(['maj', 'dor']), root:rr(200, 250), bpm:72, bars:3, ch:[0, 5, 3], comp:'piano', mel:'piano', melA:0.4, rest:0.3, rh:[0.5, 1, 1.5, 2]}), false, 0.85),
  carillon: E => notesJob(E, 'carillon', 9, 1, () => { const N = []; const root = rr(330, 420); let t = 0.05; for (let k = 0; k < 10; k++){ N.push(...bellNotes(t, hz(root, SCALES.maj, ri(0, 7), 0), 0.5, 0.8)); t += pick([0.45, 0.45, 0.9]); } return N; }, false, 0.85),
  chant: E => talkJob(E, 'chant', 8, 2, 5, () => TK.chant(E.chantF || (E.chantF = rr(110, 128))), true, 0.8),
  drums: E => voicesJob(E, 'drums', 4, 2, () => vDrums(Math.ceil(4.2*NSR)), true, 0.8),
  hooves: E => voicesJob(E, 'hooves', 3.5, 1, () => vHooves(Math.ceil(3.7*NSR)), true, 0.8),
  gibbon0: E => phraseJob(E, 'gibbon0', 'gibbon'), gibbon1: E => phraseJob(E, 'gibbon1', 'gibbon'),
  sealion0: E => phraseJob(E, 'sealion0', 'sealion'), sealion1: E => phraseJob(E, 'sealion1', 'sealion'),
  parrot0: E => phraseJob(E, 'parrot0', 'parrot'), parrot1: E => phraseJob(E, 'parrot1', 'parrot')
};
// ask for a sound of the bank: queued once (offline renders make it at once)
function bankWant(E, key){
  if (E.bank[key] || !LAZY27[key]) return; const P = E.pend || (E.pend = {}); if (P[key]) return; P[key] = 1;
  const job = LAZY27[key](E); if (E.offline){ while (!job()); bedsAttach(E); } else (E.jobs || (E.jobs = [])).push(job);
}

/* ---------------------------------------------------------------- the engine: buses, reverb, listener, beds, voice pools ------- */
const PV_CAP = {veh:9, rail:3, air:3, f1ai:3, xing:2, port:1, evt:3, lm:3, uv:5, fx:5};     // 37 positional voices at most ([lm24/sound]: landmarks, vehicles, effects)
const PV_MAX = 37;
function mkEngine(ctx, offline, cache){
  const E = {ctx, offline, sr:ctx.sampleRate, T:0, bank:{}, jobs:null, bus:{}, send:{}, beds:{}, pv:[], nPV:0, L:null, S:null, wx:null,
    tm:{amb:0.11}, ms:0, msMax:0, frames:0, err:null, f1:null, xs:{}, events:0};
  const out = E.out = ctx.createGain(); out.gain.value = 1;
  const comp = E.comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -12; comp.knee.value = 8; comp.ratio.value = 6; comp.attack.value = 0.002; comp.release.value = 0.25;
  const post = E.post = ctx.createGain(); post.gain.value = 1.0;
  // a safety soft-clipper after the compressor: linear to 0.7, then a tanh knee that never reaches 1 (no hard clipping)
  const lim = E.lim = ctx.createWaveShaper(); { const n = 4096, c = new Float32Array(n); for (let i = 0; i < n; i++){ const x = i/(n - 1)*2 - 1, a = Math.abs(x); c[i] = a < 0.7 ? x : Math.sign(x)*(0.7 + 0.28*Math.tanh((a - 0.7)/0.28)); } lim.curve = c; lim.oversample = '2x'; }
  out.connect(comp); comp.connect(post); post.connect(lim); lim.connect(ctx.destination);
  const rv = ctx.createConvolver(); rv.normalize = true; rv.buffer = mkIR(ctx, 2.0);
  const rvIn = E.rvIn = ctx.createGain(), rvOut = E.rvOutG = ctx.createGain(); rvOut.gain.value = 0.55; rvIn.connect(rv); rv.connect(rvOut); rvOut.connect(out);
  E.wbus = {};      // [lm24/sound] per-group extra reverb sends that follow the group's volume / mute
  for (const G of AU_GROUPS){ const b = ctx.createGain(); b.gain.value = 0; b.connect(out); const s = ctx.createGain(); s.gain.value = AU_SEND[G.id]; b.connect(s); s.connect(rvIn); E.bus[G.id] = b; E.send[G.id] = s;
    const w = ctx.createGain(); w.gain.value = 0; w.connect(rvIn); E.wbus[G.id] = w; }
  E.noise = cache ? cache.noise : {w:noiseBuf(ctx, 'w', 2), p:noiseBuf(ctx, 'p', 4, 2), b:noiseBuf(ctx, 'b', 4, 4)};      // [lm24/sound] tests: a bank cache shared by offline renders
  E.waves = mkWaves(ctx);
  E.L = {x:0, y:0, z:0, px:0, py:0, pz:0, vx:0, vy:0, vz:0, fx:0, fy:0, fz:-1, ux:0, uy:1, uz:0, wx:0, wy:0, gnd:0, alt:0, tx:0, ty:0, yaw:0, init:false};
  E.S = {sea:0, fresh:0, forest:0, park:0, beach:0, res:0, com:0, ind:0, pub:0, port:0, urban:0.5, green:0, water:0, dSea:9999, dFresh:9999, greenNear:0, t:-9};
  E.wx = {rain:0, wind:0.4, bolt:0, mar:0, reach:-4, cb:0, dark:0, mode:'clear', t:-9};
  mkBeds(E); mkBeds27(E);
  if (cache){ E.bank = cache.bank; E.jobs = []; Object.assign(E, cache.extra || {}); }
  else E.jobs = bankJobs(E);
  if (offline) while (E.jobs.length){ if (E.jobs[0]()) E.jobs.shift(); }
  return E;
}
function engineApply(E, all){   // settings -> bus gains (all: tests, every group at its default)
  const t = E.ctx.currentTime;
  for (const G of AU_GROUPS){ const v = all ? G.v : (AS.m[G.id] ? 0 : AS.g[G.id]); E.bus[G.id].gain.setTargetAtTime(v*v*1.25, t, 0.05); E.wbus[G.id].gain.setTargetAtTime(v*v*1.25, t, 0.05); }
  E.out.gain.setTargetAtTime(all ? 0.64 : AS.master*AS.master, t, 0.05);
}
// ---- one-shot helpers (nodes made per event: events are rare)
function nSrc(E, buf, t0, dur, rate, dest, loop){
  const s = E.ctx.createBufferSource(); s.buffer = buf; s.loop = !!loop; s.playbackRate.value = rate || 1; s.connect(dest);
  const off = loop ? rnd()*buf.duration*0.9 : 0; s.start(t0, off); if (dur) s.stop(t0 + dur); return s;
}
function nOsc(E, type, f, t0, t1, dest){ const o = E.ctx.createOscillator(); if (typeof type === 'string') o.type = type; else o.setPeriodicWave(type); o.frequency.value = f; o.connect(dest); o.start(t0); o.stop(t1); return o; }
function nGain(E, dest, v){ const g = E.ctx.createGain(); g.gain.value = v === undefined ? 1 : v; g.connect(dest); return g; }
function nFilt(E, type, f, q, dest){ const b = E.ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; b.connect(dest); return b; }
// an envelope gain: attack a, hold h at peak p, release (time constant r)
function nEnv(E, dest, t0, a, p, h, r){ const g = E.ctx.createGain(); g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(p, t0 + a); g.gain.setValueAtTime(p, t0 + a + h); g.gain.setTargetAtTime(0, t0 + a + h, r); g.connect(dest); return g; }
// AudioParam targets
const PT = (p, v, t, tau) => p.setTargetAtTime(v, t, tau);
// ---- beds: non-positional layers, each with an output gain that is connected only while audible
function mkBeds(E){
  const c = E.ctx, B = E.beds;
  const bed = (k, group) => { const o = c.createGain(); o.gain.value = 0; B[k] = {out:o, bus:E.bus[group], on:false, zt:0, v:0}; return B[k]; };
  const loop = (buf, rate) => { const s = c.createBufferSource(); s.buffer = buf; s.loop = true; s.playbackRate.value = rate || 1; s.start(0, rnd()*buf.duration*0.9); return s; };
  const filt = (type, f, q) => { const b = c.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; return b; };
  const gain = v => { const g = c.createGain(); g.gain.value = v; return g; };
  const chain = (...n) => { for (let i = 0; i < n.length - 1; i++) n[i].connect(n[i + 1]); return n[n.length - 1]; };
  // city wash: distant traffic, a low rumble and a mid roar
  { const b = bed('wash', 'amb'); b.lp1 = filt('lowpass', 260, 0.5); b.lp2 = filt('lowpass', 700, 0.5); b.g2 = gain(0.5);
    chain(loop(E.noise.b), b.lp1, b.out); chain(loop(E.noise.p), b.lp2, b.g2, b.out); }
  // urban hum: air-conditioning plant, transformers, the far city
  { const b = bed('hum', 'amb'); b.bp = filt('bandpass', 125, 1.1); chain(loop(E.noise.p), b.bp, b.out);
    const o = c.createOscillator(); o.frequency.value = 100; const og = gain(0.05); chain(o, og, b.out); o.start(); const o2 = c.createOscillator(); o2.frequency.value = 50.3; const og2 = gain(0.04); chain(o2, og2, b.out); o2.start(); }
  // street murmur: footsteps and talk under the traffic (commercial streets by day)
  { const b = bed('murmur', 'amb'); b.am = gain(0.6); chain(loop(E.noise.p), filt('bandpass', 480, 0.9), filt('peaking', 1400, 1.2), b.am, b.out); }
  // wind: a moving band of pink noise and a thin whistle
  { const b = bed('wind', 'nat'); b.bp = filt('bandpass', 420, 0.8); b.g1 = gain(1); b.wh = filt('bandpass', 2400, 4); b.g2 = gain(0.12);
    chain(loop(E.noise.p, 0.9), b.bp, b.g1, b.out); chain(loop(E.noise.w), b.wh, b.g2, b.out); }
  // waves: swell rumble and foam hiss (the director breathes them)
  { const b = bed('waves', 'nat'); b.g1 = gain(0.8); b.g2 = gain(0.25); b.lp = filt('lowpass', 380, 0.6);
    chain(loop(E.noise.b, 0.8), b.lp, b.g1, b.out); chain(loop(E.noise.w), filt('bandpass', 1900, 0.6), b.g2, b.out); }
  // rain: hiss, heavy patter; drops join when the bank has them
  { const b = bed('rain', 'nat'); b.g1 = gain(0.7); b.g2 = gain(0.3); b.g3 = gain(0);
    chain(loop(E.noise.w), filt('highpass', 500, 0.5), filt('lowpass', 9000, 0.5), b.g1, b.out); chain(loop(E.noise.p), filt('lowpass', 1000, 0.5), b.g2, b.out); b.g3.connect(b.out); }
  // insect / cicada loops (attached when generated)
  { const b = bed('insects', 'nat'); b.need = 'insects'; }
  { const b = bed('cicada', 'nat'); b.need = 'cicada'; }
  // the cable-car slot: a rumbling whir along the cable routes (San Francisco)
  { const b = bed('cable', 'rail'); b.g2 = gain(0.35); chain(loop(E.noise.b), filt('bandpass', 170, 1.6), b.out); chain(loop(E.noise.p), filt('bandpass', 950, 5), b.g2, b.out); }
  // crowd at the grandstands (F1)
  { const b = bed('crowd', 'f1'); b.am = gain(0.7); chain(loop(E.noise.p), filt('bandpass', 700, 0.7), filt('peaking', 2400, 1.5), b.am, b.out); }
  // [nyc/nycapp] leaves rustling in the big parks (New York): high pink noise breathing with the gusts
  if (auNyc()){ const b = bed('leaves', 'nat'); b.am = gain(0.6); chain(loop(E.noise.p, 1.1), filt('highpass', 1800, 0.6), filt('lowpass', 7000, 0.5), b.am, b.out); }
  // brush while painting
  { const b = bed('brush', 'ui'); b.bp = filt('bandpass', 1300, 1.1); b.g2 = gain(0.25); chain(loop(E.noise.p), b.bp, b.out); chain(loop(E.noise.w), filt('highpass', 4200, 0.6), b.g2, b.out); }
  E.bedLoop = loop;
}
// attach generated loops to their beds once the bank has them
function bedsAttach(E){
  const B = E.beds;
  for (const k in B){ const b = B[k]; if (b.need && !b.src && E.bank[b.need]){ b.src = E.bedLoop(E.bank[b.need]); b.src.connect(b.out); } }
  if (!B.rain.dsrc && E.bank.drops){ B.rain.dsrc = E.bedLoop(E.bank.drops); B.rain.dsrc.connect(B.rain.g3); }
  bedsAttach27(E);
}
function bedSet(E, k, v, tau){
  const b = E.beds[k], t = E.ctx.currentTime; if (!b) return;
  v = v > 1e-4 ? v : 0;
  if (v > 0){ if (!b.on){ b.out.connect(b.bus); b.on = true; } b.zt = E.T; }
  else if (b.on && E.T - b.zt > 4 + 5*(tau || 0.5)){ b.out.disconnect(); b.on = false; }
  if (Math.abs(v - b.v) > 1e-4 || v === 0){ PT(b.out.gain, v, t, tau || 0.5); b.v = v; }
}
// ---- positional voices
function mkPanner(c){ const p = c.createPanner(); p.panningModel = 'equalpower'; p.distanceModel = 'inverse'; p.refDistance = 1; p.rolloffFactor = 0; p.maxDistance = 1e6; return p; }
function pvGet(E, kind, group){
  for (const V of E.pv) if (V.kind === kind && !V.busy) return V;
  let n = 0; for (const V of E.pv) if (V.kind === kind) n++;
  if (n >= PV_CAP[kind] || E.pv.length >= PV_MAX) return null;
  const c = E.ctx, V = {E, kind, group, busy:false, on:false, key:null, fresh:true, offAt:0, d:1e9, until:0,
    inp:c.createGain(), lp:c.createBiquadFilter(), g:c.createGain(), pan:mkPanner(c)};
  V.lp.type = 'lowpass'; V.lp.frequency.value = 16000; V.lp.Q.value = 0.5; V.lp.channelCount = 1; V.lp.channelCountMode = 'explicit';
  V.g.gain.value = 0; V.inp.connect(V.lp); V.lp.connect(V.g); V.g.connect(V.pan);
  E.pv.push(V); return V;
}
function pvTake(V, key, t){ V.busy = true; V.key = key; V.fresh = true; V.offAt = 0; if (!V.on){ V.pan.connect(V.E.bus[V.group]); V.on = true; } V.g.gain.cancelScheduledValues(t); V.g.gain.setValueAtTime(0, t); }
function pvFree(V, t){ if (!V.busy) return; V.busy = false; V.key = null; PT(V.g.gain, 0, t, 0.08); V.offAt = t + 0.6; }
function pvPlace(V, x, y, z, t){
  const p = V.pan;
  if (p.positionX){ if (V.fresh){ p.positionX.cancelScheduledValues(t); p.positionY.cancelScheduledValues(t); p.positionZ.cancelScheduledValues(t); p.positionX.setValueAtTime(x, t); p.positionY.setValueAtTime(y, t); p.positionZ.setValueAtTime(z, t); }
    else { PT(p.positionX, x, t, 0.035); PT(p.positionY, y, t, 0.035); PT(p.positionZ, z, t, 0.035); } }
  else p.setPosition(x, y, z);
}
// level with distance (inverse law from ref, exponent k) and air absorption; wet: rain / fog absorb a little more
const airLP = (d, wet) => clamp(17500/(1 + d/(wet ? 115 : 150)), 140, 17500);
function pvLevel(V, lvl, d, ref, k, t, extraLP){
  const E = V.E, g = lvl*Math.pow(Math.min(1, ref/Math.max(d, 0.5)), k || 1), wet = E.wx.rain > 0.2 || E.wx.mar > 0.4;
  PT(V.g.gain, g, t, V.fresh ? 0.06 : 0.05);
  PT(V.lp.frequency, Math.min(airLP(d, wet), extraLP || 2e4), t, 0.06);
  V.d = d; V.lvl = g;
}
// Doppler factor for a source at (sx, sy, sz) moving with (vx, vy, vz), three.js coordinates
function dop(E, sx, sy, sz, vx, vy, vz){
  const L = E.L; let dx = L.x - sx, dy = L.y - sy, dz = L.z - sz; const d = Math.hypot(dx, dy, dz) || 1; dx /= d; dy /= d; dz /= d;
  const vs = clamp(vx*dx + vy*dy + vz*dz, -160, 160), vl = clamp(L.vx*dx + L.vy*dy + L.vz*dz, -60, 60);
  return clamp((C_SND - vl)/(C_SND - vs), 0.62, 1.6);
}
// free event voices whose sound has ended; disconnect voices that have faded out
function pvSweep(E, t){
  let n = 0;
  for (const V of E.pv){
    if (V.kind === 'evt' && V.busy && t > V.until) pvFree(V, t);
    if (!V.busy && V.on && V.offAt && t > V.offAt){ V.pan.disconnect(); V.on = false; V.offAt = 0; }
    if (V.on) n++;
  }
  E.nPV = n;
}
// an event voice at a world position (x, y world metres, h height): fn(V, t0) makes the sound into V.inp and returns its duration
function evtAt(E, x, y, h, lvl, ref, delay, fn, group){
  const V = pvGet(E, 'evt', group || 'air'); if (!V) return false;
  if (V.group !== (group || 'air')){ if (V.on){ V.pan.disconnect(); V.on = false; } V.group = group || 'air'; }
  const t = E.ctx.currentTime, t0 = t + (delay || 0) + 0.02, L = E.L, d = Math.hypot(x - L.x, h - L.y, -y - L.z);
  pvTake(V, 'evt', t); pvPlace(V, x, h, -y, t); V.fresh = false;
  const g = lvl*Math.min(1, ref/Math.max(d, 1)), wet = E.wx.rain > 0.2 || E.wx.mar > 0.4;
  V.g.gain.setValueAtTime(g, t0 - 0.01); V.lp.frequency.setValueAtTime(airLP(d, wet), t0 - 0.01);
  const dur = fn(V, t0, d) || 2;
  V.until = t0 + dur + 0.3; E.events++;
  return true;
}

/* ---------------------------------------------------------------- listener, the scene around the view, beds, nature, weather ---- */
const _v3 = typeof THREE !== 'undefined' ? new THREE.Vector3() : null;
function listen(E, dt){
  const L = E.L, c = camera, p = c.position, t = E.ctx.currentTime;
  c.getWorldDirection(_v3);
  const m = c.matrixWorld.elements, fx = _v3.x, fy = _v3.y, fz = _v3.z, ux = m[4], uy = m[5], uz = m[6];
  const jump = !L.init || Math.hypot(p.x - L.x, p.y - L.y, p.z - L.z) > 250;
  if (jump || !(dt > 0)){ L.vx = L.vy = L.vz = 0; }
  else { const k = Math.min(1, dt*5); L.vx += ((p.x - L.x)/dt - L.vx)*k; L.vy += ((p.y - L.y)/dt - L.vy)*k; L.vz += ((p.z - L.z)/dt - L.vz)*k; }
  L.x = p.x; L.y = p.y; L.z = p.z; L.fx = fx; L.fy = fy; L.fz = fz;
  const A = E.ctx.listener;
  if (A.positionX){
    if (jump){ for (const [q, v] of [[A.positionX, p.x], [A.positionY, p.y], [A.positionZ, p.z]]){ q.cancelScheduledValues(t); q.setValueAtTime(v, t); } }
    else { PT(A.positionX, p.x, t, 0.02); PT(A.positionY, p.y, t, 0.02); PT(A.positionZ, p.z, t, 0.02); }
    PT(A.forwardX, fx, t, 0.02); PT(A.forwardY, fy, t, 0.02); PT(A.forwardZ, fz, t, 0.02);
    PT(A.upX, ux, t, 0.02); PT(A.upY, uy, t, 0.02); PT(A.upZ, uz, t, 0.02);
  } else { A.setPosition(p.x, p.y, p.z); A.setOrientation(fx, fy, fz, ux, uy, uz); }
  L.wx = p.x; L.wy = -p.z;
  let g = 0; try { g = Math.max(0, hC(L.wx, L.wy)); } catch (e){ g = 0; }
  L.gnd = g; L.alt = Math.max(0, p.y - g);
  const tg = controls.target; L.tx = tg.x; L.ty = -tg.z;
  // horizontal forward (world x east, y north) and the right-hand vector for stereo placement of non-3-D sounds
  let hx = fx, hy = -fz; const hl = Math.hypot(hx, hy); if (hl > 1e-3){ hx /= hl; hy /= hl; } else { hx = Math.sin(controls.getAzimuthalAngle ? -controls.getAzimuthalAngle() : 0); hy = 1; }
  L.hx = hx; L.hy = hy; L.rx = hy; L.ry = -hx;
  L.init = true;
}
// stereo position of a world point (x, y) for a non-3-D sound: -1 left .. 1 right
function panOf(E, x, y){ const L = E.L, dx = x - L.wx, dy = y - L.wy, d = Math.hypot(dx, dy) || 1; return clamp((dx*L.rx + dy*L.ry)/d, -1, 1)*0.85; }
// land cover / land use around what the camera sees (around the camera low down, around the target from high up)
const RING = [[1, 0], [0.866, 0.5], [0.5, 0.866], [0, 1], [-0.5, 0.866], [-0.866, 0.5], [-1, 0], [-0.866, -0.5], [-0.5, -0.866], [0, -1], [0.5, -0.866], [0.866, -0.5]];
function cellAt(x, y){ if (Math.abs(x) >= HALF || Math.abs(y) >= HALF) return -1; return cx2i(y)*N + cx2i(x); }
function sceneSample(E){
  const S = E.S, L = E.L;
  let ok = false; try { ok = typeof nat !== 'undefined' && !!nat && nat.length === N*N; } catch (e){ ok = false; }
  if (!ok) return;
  const lu = (typeof SG !== 'undefined' && SG.lu && SG.lu.length === N*N) ? SG.lu : null;
  const k = sstep(40, 700, L.alt)*0.9, cx = lerp(L.wx, L.tx, k), cy = lerp(L.wy, L.ty, k), R = clamp(60 + L.alt*0.9, 80, 3000);
  let sea = 0, fresh = 0, forest = 0, beach = 0, park = 0, res = 0, com = 0, ind = 0, pub = 0, port = 0, other = 0;
  for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++){
    const q = cellAt(cx + (i + rr(-0.45, 0.45))*R/3, cy + (j + rr(-0.45, 0.45))*R/3);
    if (q < 0){ sea++; continue; }
    const v = nat[q];
    if (v === 1) sea++; else if (v === 2) fresh++; else if (v === 3) forest++; else if (v === 4) beach++;
    else { const u = lu ? lu[q] : 0; if (u === 4) park++; else if (u === 1) res++; else if (u === 2) com++; else if (u === 3) ind++; else if (u === 6) pub++; else if (u === 7) port++; else other++; }
  }
  const f = 1/49, a = S.t < 0 ? 1 : 0.5, sm = (key, v) => { S[key] += (v - S[key])*a; };
  sm('sea', sea*f); sm('fresh', fresh*f); sm('forest', forest*f); sm('beach', beach*f); sm('park', park*f); sm('res', res*f); sm('com', com*f); sm('ind', ind*f); sm('pub', pub*f); sm('port', port*f);
  sm('urban', (res + com + ind + pub + port + other*0.6)*f); sm('green', (forest + park)*f); sm('water', (sea + fresh)*f);
  // distance to the sea / fresh water from the listener's ground point, green right around it
  let dSea = 1500, dFresh = 1500, gN = 0;
  const RS = [20, 45, 90, 160, 260, 400, 600, 900];
  outer: for (const r of RS){ for (const d of RING){ const q = cellAt(L.wx + d[0]*r, L.wy + d[1]*r); if (q < 0 || nat[q] === 1){ dSea = r; break outer; } } }
  outer2: for (const r of RS){ if (r > 400) break; for (const d of RING){ const q = cellAt(L.wx + d[0]*r, L.wy + d[1]*r); if (q >= 0 && nat[q] === 2){ dFresh = r; break outer2; } } }
  for (const d of RING){ const q = cellAt(L.wx + d[0]*70, L.wy + d[1]*70); if (q >= 0 && (nat[q] === 3 || (lu && lu[q] === 4))) gN++; }
  { const q = cellAt(L.wx, L.wy); if (q >= 0 && nat[q] === 1) dSea = 0; }
  S.dSea = S.t < 0 ? dSea : lerp(S.dSea, dSea, 0.6); S.dFresh = dFresh; sm('greenNear', gN/12);
  S.t = E.T;
}
function wxRead(E){
  const X = E.wx, W = window.SGWx;
  if (!W){ X.rain = 0; X.wind = 0.4; X.bolt = 0; X.mar = 0; X.cb = 0; X.dark = 0; return; }
  let s = null; try { s = W.state; X.mode = W.mode; } catch (e){ s = null; }
  if (!s) return;
  X.rain = s.rain || 0; X.snow = s.snow || 0; X.fog = s.fog || 0; X.wind = s.wind === undefined ? 0.4 : s.wind; X.bolt = s.bolt || 0; X.mar = s.mar || 0; X.reach = s.reach === undefined ? -4 : s.reach; X.cb = s.cb || 0; X.dark = s.dark || 0; X.vis = s.vis || 0;
}
// time-of-day activity curves
function birdAct(h, bay){
  const d0 = bay ? 5.5 : 6.4, d1 = bay ? 6.4 : 7.1;
  const dawn = sstep(d0, d1, h)*(1 - sstep(d1 + 0.6, d1 + 2.4, h));
  const daytime = sstep(d1, d1 + 1, h)*(1 - sstep(17.8, 19.5, h))*0.42;
  const eve = sstep(16.8, 17.8, h)*(1 - sstep(18.9, 19.6, h))*0.65;
  return Math.max(dawn, daytime, eve);
}
const nightOf = h => h > 12 ? sstep(18.6, 19.9, h) : 1 - sstep(5.3, 6.5, h);
const duskOf = h => sstep(18.2, 18.9, h)*(1 - sstep(19.4, 20.3, h));
function ambUpdate(E){
  const S = E.S, L = E.L, X = E.wx, R = E.trf || {n250:0, nAll:0}, h = typeof tod === 'number' ? tod : 12, nf = typeof nightF === 'number' ? nightF : 0, day = 1 - nf;
  const t = E.ctx.currentTime, B = E.beds, bay = auBay(), real = auReal();
  const street = 1 - sstep(25, 260, L.alt), high = sstep(150, 1800, L.alt), far = sstep(1500, 9000, L.alt);
  // ---- traffic wash: the vehicles the traffic module runs around the view, else the land use
  const dNear = clamp(R.n250/26, 0, 1), dZone = clamp(R.nAll/700, 0, 1), urb = S.urban;
  let wash = (0.1 + 0.9*urb)*(0.22 + 0.78*Math.max(dNear*street, dZone*(0.5 + 0.5*high)))*(0.5 + 0.5*day);
  if (!real || !auNetVis()) wash = 0.25*urb*(0.5 + 0.5*day);
  const ny = auNyc(), parkQ = ny ? clamp(S.greenNear*1.15 + (S.park + S.forest)*0.8 - S.com*0.4, 0, 1)*(1 - sstep(80, 500, L.alt)) : 0, snow = X.snow || 0;
  if (ny){ wash *= (1.3 + 0.25*S.com)*(0.55 + 0.45*day)*(1 - 0.62*parkQ)*(1 - 0.35*snow); E.parkQ = parkQ; }
  wash *= lerp(1, 0.55, high)*(1 - 0.6*far)*(1 - 0.45*dNear*street);      // near busy roads the voiced vehicles carry the sound
  bedSet(E, 'wash', 0.30*wash, 0.8);
  PT(B.wash.lp1.frequency, lerp(260, 160, high), t, 0.8); PT(B.wash.lp2.frequency, lerp(1500, 380, high), t, 0.8); PT(B.wash.g2.gain, lerp(0.95, 0.25, high), t, 0.8);
  // ---- urban hum (air-conditioning plant): relatively stronger at night, under a high view it is part of the wash
  bedSet(E, 'hum', 0.10*(S.res + S.com*1.2 + S.ind*1.4)*(0.65 + 0.35*nf)*(1 - 0.7*high), 1);
  // ---- street murmur: commercial streets in the daytime
  const mur = S.com*street*sstep(7, 9, h)*(1 - sstep(21.5, 23.5, h))*(1 - 0.7*X.rain)*(ny ? 1.35*(1 - 0.4*snow) : 1) + (ny ? 0.25*parkQ*street*sstep(8, 10, h)*(1 - sstep(19, 21, h))*(1 - X.rain) : 0);
  bedSet(E, 'murmur', 0.16*mur*(E.murK === undefined ? 1 : E.murK), 0.8); if (mur > 0.01) PT(B.murmur.am.gain, rr(0.35, 1), t, 0.12);
  // ---- wind: altitude, the sea, the weather, gusts
  if (!E.gustT || E.T > E.gustT){ E.gustT = E.T + rr(1.2, 4.5); E.gust = rr(0, 1); }
  const coast = 1 - sstep(30, 600, S.dSea), storm = clamp(X.wind - 0.5, 0, 0.5)*2;
  const tower = ny ? sstep(55, 320, L.alt)*(1 - 0.5*far) : 0;      // New York: gusts and whistles around the towers from ~60 m up
  const wind = (0.05 + 0.32*high + 0.14*far + 0.12*coast*street + 0.45*storm*X.dark + 0.3*tower)*(0.6 + 0.8*(X.wind || 0.4))*(0.55 + 0.75*E.gust*(0.4 + storm + 0.6*tower));
  bedSet(E, 'wind', 0.22*wind, 1.1);
  PT(B.wind.bp.frequency, 260 + 520*E.gust + 380*high + 300*storm + 260*tower, t, 1.2); PT(B.wind.g2.gain, 0.06 + 0.25*high*E.gust + 0.3*tower*E.gust, t, 1);
  if (ny && !E.A){ const lv = 0.07*parkQ*(1 - 0.85*high)*(0.4 + 0.6*E.gust)*(0.5 + 0.8*(X.wind || 0.4))*(1 - 0.8*snow); bedSet(E, 'leaves', lv, 0.9); if (lv > 0.005) PT(B.leaves.am.gain, rr(0.35, 1), t, 0.35); }
  // ---- waves: swells by the shore, a soft sea wash over open water
  const shore = (1 - sstep(15, 380, S.dSea))*(1 - sstep(60, 700, L.alt)), open = S.sea*(1 - far)*0.35;
  const wv = Math.max(shore, open)*(0.7 + 0.6*storm);
  if (wv > 0.01){
    if (!E.swellT || E.T > E.swellT){ const p = rr(5.5, 9.5); E.swellT = E.T + p; PT(B.waves.g1.gain, rr(0.7, 1.15), t, 0.9); PT(B.waves.g1.gain, rr(0.25, 0.4), t + p*0.35, 1.5);
      PT(B.waves.g2.gain, 0.06, t, 0.5); PT(B.waves.g2.gain, rr(0.3, 0.55)*shore + 0.05, t + p*0.3, 0.25); PT(B.waves.g2.gain, 0.05, t + p*0.3 + 0.9, 1.2); }
    PT(B.waves.lp.frequency, lerp(420, 260, high), t, 1);
  }
  bedSet(E, 'waves', 0.32*wv, 1.2);
  // ---- rain
  const rk = X.rain*(1 - 0.5*high)*(1 - 0.6*far);
  bedSet(E, 'rain', 0.32*Math.pow(rk, 0.75), 0.9);
  if (rk > 0.001){ PT(B.rain.g2.gain, 0.15 + 0.55*Math.pow(X.rain, 1.5), t, 1); PT(B.rain.g3.gain, 0.55*street*X.rain, t, 1); }
  // ---- insects at night, cicadas at dusk (Singapore)
  const hab = clamp(S.green*1.5 + S.greenNear + S.res*0.25 + S.water*0.2, 0, 1), nt = nightOf(h);
  bedSet(E, 'insects', (bay ? 0.07 : ny ? 0.06 : 0.11)*nt*(0.25 + 0.75*hab)*(1 - 0.85*high)*(1 - 0.6*X.rain)*(1 - snow)*(E.eveT > E.T ? 1.3 : 1), 1.5);
  if (!bay && !ny){ const cic = (duskOf(h)*1.0 + 0.3*sstep(7.5, 9, h)*(1 - sstep(17, 18.3, h)))*clamp(S.forest*1.8 + S.greenNear*0.6 + S.park*0.5, 0, 1);
    bedSet(E, 'cicada', 0.10*cic*(1 - 0.85*high)*(1 - 0.8*X.rain)*(E.eveT > E.T ? 1.4 : 1), 1.5); }
  // ---- the cable-car slot (San Francisco)
  if (bay) bedSet(E, 'cable', E.cableD < 200 ? 0.22*(1 - sstep(8, 110, E.cableD))*street*(auNetVis() ? 1 : 0) : 0, 0.6);
}
// ---- nature events: birds by day, frogs / geckos / nightjars / owls at night (one-shot buffers, stereo placed)
function natEvent(E, key, dist, lvl){
  const b = E.bank[key + (rnd() < 0.5 ? 0 : 1)]; if (!b) return;
  const L = E.L, a = rnd()*TAU, r = dist, x = L.wx + Math.cos(a)*r, y = L.wy + Math.sin(a)*r, hb = rr(2, 14);
  const d = Math.hypot(r, L.alt - hb), c = E.ctx, t0 = c.currentTime + rr(0.02, 0.2);
  const g = c.createGain(); g.gain.value = lvl*Math.min(1, 8/Math.max(d, 1));
  let tail = g;
  if (d > 60){ const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = airLP(d, E.wx.rain > 0.2); g.connect(f); tail = f; }
  if (c.createStereoPanner){ const p = c.createStereoPanner(); p.pan.value = panOf(E, x, y); tail.connect(p); p.connect(E.bus.nat); } else tail.connect(E.bus.nat);
  const s = c.createBufferSource(); s.buffer = b; s.playbackRate.value = rr(0.95, 1.05); s.connect(g); s.start(t0);
  E.events++;
}
function natUpdate(E, dt){
  const S = E.S, L = E.L, X = E.wx, h = typeof tod === 'number' ? tod : 12, ny = auNyc(), bay = auBay() || ny;
  const street = 1 - sstep(30, 380, L.alt); if (street <= 0.01 || !E.bank.koel0 && !E.bank.sparrow0 && !E.bank.hsparrow0) return;
  const hab = clamp(S.greenNear*1.2 + S.green*0.9 + S.res*0.35 + S.pub*0.3 + S.water*0.15 + (E.A ? E.A.park*0.4 : 0), 0, 1.5);      // [lm24/sound] parks a little livelier
  const chorus = E.chorusT > E.T ? 2.2 : 1;
  const act = birdAct(h, bay)*(1 - 0.85*X.rain)*(1 - 0.4*X.mar)*chorus*(1 - 0.6*clamp(X.wind - 0.6, 0, 0.4)/0.4);
  const rate = 1.1*act*hab*street*(ny ? (1 + 1.6*(E.parkQ || 0))*(1 - 0.7*(X.snow || 0)) : 1), dist = () => rr(10, 70) + L.alt*0.3;
  if (rnd() < rate*dt){
    let sp;
    if (!bay){ const W = [['koel', (h < 9.5 ? 2.5 : 0.6)*(0.4 + S.res + S.green)], ['bulbul', 1.4*(S.green + S.res*0.6 + 0.2)], ['robin', 1.1*(S.green + S.res*0.5 + 0.1)], ['kingfisher', 0.8*(S.water*2 + S.green*0.5 + (S.dFresh < 200 ? 0.6 : 0))],
        ['myna', 1.4*(S.urban + 0.1)], ['oriole', 0.7*(S.green + 0.1)], ['dove', 0.9*(S.res + S.park + 0.1)*(h < 11 ? 1.5 : 1)]];
      sp = wpick(W); }
    else if (ny){ const W = [['hsparrow', 1.6*(S.urban + S.res*0.5 + 0.2)], ['amrobin', (h < 9.5 ? 1.7 : 0.7)*(S.green + S.res*0.6 + 0.1)], ['cardinal', 1.0*(S.green + S.res*0.4 + 0.1)],
        ['jay', 0.6*(S.green + 0.05)], ['mdove', (h < 10 ? 0.9 : 0.4)*(S.res + S.park + 0.1)], ['pigeon', 1.5*(S.urban + S.com + 0.1)*(1 - 0.6*(E.parkQ || 0))],
        ['gull', 2.4*(1 - sstep(80, 700, S.dSea)) + 0.1*S.urban], ['starling', 1.0*(S.urban*0.5 + S.green*0.6 + 0.1)], ['crow', 0.5*(S.park + S.green + 0.05)]];
      sp = wpick(W); }
    else { const W = [['sparrow', 1.3*(S.green + S.res*0.6 + 0.15)], ['finch', 1.3*(S.res + S.green*0.5 + 0.1)], ['crow', 0.9*(S.urban + S.park + 0.1)], ['mdove', (h < 10 ? 1.2 : 0.5)*(S.res + S.park + 0.1)],
        ['gull', 2.4*(1 - sstep(80, 700, S.dSea)) + 0.1*S.urban], ['wcsparrow', 1.0*(S.green + S.res*0.5 + 0.1)], ['jay', 0.7*(S.green + 0.1)]];
      sp = wpick(W); }
    natEvent(E, sp, dist(), sp === 'koel' || sp === 'gull' || sp === 'kingfisher' || sp === 'crow' || sp === 'cardinal' ? 0.5 : 0.36);
  }
  // night animals
  const nt = nightOf(h), wetBoost = 1 + 1.5*X.rain;
  if (nt > 0.05){
    const nr = nt*street*(1 - 0.5*X.rain);
    if (!bay){
      if (rnd() < 0.05*nr*(S.res + S.green*0.8 + 0.1)*dt) natEvent(E, 'nightjar', rr(30, 120) + L.alt*0.3, 0.45);
      if (rnd() < 0.12*nr*(S.res + S.com*0.5 + 0.05)*dt) natEvent(E, 'gecko', rr(6, 30) + L.alt*0.3, 0.3);
      if (rnd() < 0.10*nr*wetBoost*(S.water*2 + (S.dFresh < 250 ? 0.8 : 0) + S.green*0.6)*dt) natEvent(E, 'bullfrog', rr(20, 80) + L.alt*0.3, 0.45);
      if (rnd() < 0.18*nr*wetBoost*(S.green + S.water + 0.1)*dt) natEvent(E, 'tokfrog', rr(10, 50) + L.alt*0.3, 0.3);
    } else if (ny){
      if (rnd() < 0.3*nr*(1 - (X.snow || 0))*(S.green*1.2 + (E.parkQ || 0) + S.res*0.2 + 0.02)*dt) natEvent(E, 'katydid', rr(8, 50) + L.alt*0.3, 0.32);
      if (rnd() < 0.01*nr*((E.parkQ || 0) + S.green*0.5 + 0.01)*dt) natEvent(E, 'owl', rr(60, 200) + L.alt*0.3, 0.45);
    } else {
      if (rnd() < 0.16*nr*wetBoost*(S.water*2 + (S.dFresh < 250 ? 0.8 : 0) + S.green*0.8 + 0.05)*dt) natEvent(E, 'chorusfrog', rr(10, 60) + L.alt*0.3, 0.4);
      if (rnd() < 0.012*nr*(S.green + S.park + 0.05)*dt) natEvent(E, 'owl', rr(60, 200) + L.alt*0.3, 0.45);
    }
  }
}
function wpick(W){ let s = 0; for (const w of W) s += Math.max(0, w[1]); let r = rnd()*s; for (const w of W){ r -= Math.max(0, w[1]); if (r <= 0) return w[0]; } return W[0][0]; }
// ---- thunder after each lightning flash (the weather module moves its flash uniform uFlashP to every strike)
function wxUpdate(E, dt){
  if (!E.flashU && E.T > (E.flashScan || 0)){
    E.flashScan = E.T + 3;
    try { for (const o of scene.children){ const m = o.material; if (m && m.uniforms && m.uniforms.uFlashP){ const v = m.uniforms.uFlashP.value; E.flashU = v; E.fl = [v.x, v.y, v.z]; break; } } } catch (e){ /* no scene */ }
  }
  if (E.flashU){ const v = E.flashU, f = E.fl; if (v.x !== f[0] || v.y !== f[1] || v.z !== f[2]){ f[0] = v.x; f[1] = v.y; f[2] = v.z; thunder(E, v.x, v.y, v.z); } }
  if (auBay() && auReal()) fogHorns(E, dt);
  if (auNyc() && auReal()) nyUpdate(E, dt);
}
function thunder(E, x, top, z){
  const c = E.ctx, L = E.L; let gy = 0; try { gy = Math.max(0, hC(x, -z)); } catch (e){ gy = 0; }
  const cy = clamp(L.y, gy, top), d = Math.hypot(x - L.x, cy - L.y, z - L.z);
  let delay = d/C_SND; if (delay > 8) delay = 8 + (delay - 8)*0.3; delay = Math.min(delay, 15);
  const t0 = c.currentTime + delay + 0.05, near = 1 - sstep(500, 4500, d), lvl = clamp(3.4*Math.pow(1200/Math.max(d, 250), 0.9), 0.08, 3.2);
  const pan = c.createStereoPanner ? c.createStereoPanner() : c.createGain(); if (pan.pan) pan.pan.value = panOf(E, x, -z)*0.8; pan.connect(E.bus.nat);
  const send = nGain(E, E.rvIn, 0.35); pan.connect(send);
  // the rumble: brown noise through a darkening low-pass, a train of grains
  const env = c.createGain(); env.gain.setValueAtTime(0, t0); env.connect(pan);
  const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.7; const f0 = lerp(260, 1200, near); lp.frequency.setValueAtTime(f0, t0); lp.frequency.setTargetAtTime(f0*0.35, t0 + 0.3, 2.2); lp.connect(env);
  const src = nSrc(E, E.noise.b, t0, 9, 1, lp, true);
  let tt = t0 + (near > 0.3 ? 0.06 : 0.15); const n = ri(6, 13);
  for (let i = 0; i < n; i++){ const a = lvl*rr(0.35, 1)*Math.exp(-(tt - t0)/3.2)*(i === 0 ? 1.3 : 1); env.gain.setTargetAtTime(a, tt, rr(0.02, 0.12)); tt += rr(0.12, 0.55); env.gain.setTargetAtTime(a*rr(0.2, 0.45), tt, rr(0.25, 0.7)); tt += rr(0.1, 0.5); }
  env.gain.setTargetAtTime(0, tt, 1.1); src.stop(tt + 6);
  // a near strike: the crack first
  if (near > 0.15){ const g = nEnv(E, pan, t0, 0.004, 0.75*near*lvl, 0.03, 0.05); const hp = nFilt(E, 'highpass', 900, 0.6, g); nSrc(E, E.noise.w, t0, 0.5, 1, hp, true);
    const g2 = nEnv(E, pan, t0 + 0.02, 0.01, 0.8*near*lvl, 0.15, 0.25); const bp = nFilt(E, 'bandpass', 1800, 0.5, g2); nSrc(E, E.noise.p, t0, 1.6, 1, bp, true); }
  E.events++; E.lastThunder = {d:Math.round(d), delay:+delay.toFixed(2), lvl:+lvl.toFixed(3)};
}
// ---- the Golden Gate fog signals: two-tone diaphone at mid-span, the south tower's pair, Lime Point and Mile Rock
const FOGHORNS = [
  {lat:37.8199, lon:-122.4783, h:68, per:36, f:[190, 152], blasts:1, dur:2.1, lvl:2.2},
  {lat:37.8106, lon:-122.4770, h:22, per:40, f:[165, 165], blasts:2, dur:1.6, lvl:1.6},
  {lat:37.8262, lon:-122.4792, h:12, per:30, f:[218, 218], blasts:1, dur:2.6, lvl:1.4},
  {lat:37.7932, lon:-122.5101, h:14, per:30, f:[240, 240], blasts:1, dur:2.0, lvl:1.2}];
function fogHorns(E, dt){
  const X = E.wx, fog = clamp(X.mar*1.3*(X.reach > -1.5 ? 1 : 0.35), 0, 1);
  if (!E.fhP){ E.fhP = FOGHORNS.map((F, i) => { const q = sgXY(F.lat, F.lon); return {F, x:q[0], y:q[1], next:i*7 + 2}; }); }
  if (fog < 0.15) return;
  const L = E.L;
  for (const H of E.fhP){
    if (E.T < H.next) continue;
    H.next = E.T + H.F.per;
    const d = Math.hypot(H.x - L.wx, H.y - L.wy, H.F.h - L.y); if (d > 14000) continue;
    const delay = Math.min(d/C_SND, 20), F = H.F;
    evtAt(E, H.x, H.y, F.h, F.lvl*fog, 250, delay, (V, t0) => {
      const c = E.ctx, g = c.createGain(); g.gain.setValueAtTime(0, t0); g.connect(V.inp); const rs = nGain(E, E.rvIn, 0.45); g.connect(rs);
      const lp = nFilt(E, 'lowpass', 1600, 0.8, g), pk = c.createBiquadFilter(); pk.type = 'peaking'; pk.frequency.value = 420; pk.Q.value = 1.2; pk.gain.value = 6; pk.connect(lp);
      const o = c.createOscillator(); o.setPeriodicWave(E.waves.horn); o.connect(pk); const o2 = c.createOscillator(); o2.setPeriodicWave(E.waves.horn); const g2 = nGain(E, pk, 0.5); o2.connect(g2);
      let tt = t0;
      for (let b = 0; b < F.blasts; b++){
        const two = F.f[0] !== F.f[1], d1 = F.dur*(two ? 0.62 : 1);
        o.frequency.setValueAtTime(F.f[0], tt); o2.frequency.setValueAtTime(F.f[0]*1.004, tt);
        g.gain.setTargetAtTime(1, tt, 0.08);
        if (two){ o.frequency.setValueAtTime(F.f[0], tt + d1); o.frequency.linearRampToValueAtTime(F.f[1], tt + d1 + 0.12); o2.frequency.setValueAtTime(F.f[0]*1.004, tt + d1); o2.frequency.linearRampToValueAtTime(F.f[1]*1.004, tt + d1 + 0.12);
          // the diaphone's closing grunt: a falling growl
          o.frequency.setValueAtTime(F.f[1], tt + F.dur - 0.35); o.frequency.linearRampToValueAtTime(F.f[1]*0.72, tt + F.dur); }
        g.gain.setTargetAtTime(0, tt + F.dur, 0.12);
        tt += F.dur + 1.1;
      }
      o.start(t0); o2.start(t0); o.stop(tt + 1); o2.stop(tt + 1);
      return tt - t0 + 0.8;
    }, 'nat');
  }
}

/* ---------------------------------------------------------------- [nyc/nycapp] New York City: honks, sirens, harbour horns -------
   Non-positional events placed in stereo around the listener (the traffic module's own vehicles keep their 3-D voices and horns):
   - distant honks: rate from the traffic around the view (n250 / nAll), the land use and the time (rush hours most, few at night),
     single taps, double taps and impatient chains, each a car / van horn pair through the street canyons (low-pass by distance,
     reverb send);
   - sirens: every ~1-4 min in the dense city: an approaching / receding police or ambulance siren (wail, then yelp near the
     crossings) or a fire engine (the mechanical growl winding up and down, air-horn blasts), its pitch falling as it passes;
   - harbour: near the water, ferry and tug horns now and then and a big ship far off; one prolonged blast every ~2 min in fog. */
function nyUpdate(E, dt){
  const NYH = E.nyh || (E.nyh = {honk:2, siren:rr(6, 30), harbour:rr(5, 20)});     // per engine (the live one, test renders)
  const S = E.S, L = E.L, X = E.wx, R = E.trf || {n250:0, nAll:0}, h = typeof tod === 'number' ? tod : 12, nf = typeof nightF === 'number' ? nightF : 0;
  const street = 1 - sstep(60, 900, L.alt), urb = clamp(S.urban + S.com*0.5, 0, 1.2), pq = E.parkQ || 0, net = auNetVis();
  const rush = Math.max(sstep(6.8, 8, h)*(1 - sstep(9.5, 10.5, h)), sstep(16, 17, h)*(1 - sstep(19, 20.5, h)));
  // distant honks
  NYH.honk -= dt;
  if (NYH.honk <= 0){
    const dens = net ? clamp(R.n250/20 + R.nAll/900, 0.15, 1.6) : 0.4, k = urb*dens*(0.25 + 0.75*(1 - nf))*(1 + 0.8*rush)*(1 - 0.75*pq)*(1 - 0.5*(X.snow || 0))*(0.35 + 0.65*street)*(net ? 1 : 0.3);
    NYH.honk = k > 0.02 ? rr(0.6, 3.2)/Math.min(2.4, k)*1.6 : rr(4, 9);
    if (k > 0.02 && rnd() < Math.min(1, k*1.2)){
      const n = rnd() < 0.18 + 0.2*rush ? ri(2, 5) : 1, a = rnd()*TAU, d = rr(35, 260) + L.alt*0.6, x = L.wx + Math.cos(a)*d, y = L.wy + Math.sin(a)*d;
      let tt = E.ctx.currentTime + rr(0.02, 0.3); const big = rnd() < 0.15;
      for (let i = 0; i < n; i++){ nyHorn(E, x + rr(-15, 15), y + rr(-15, 15), d, tt, big, n > 1 && i > 0); tt += n > 2 ? rr(0.25, 0.9) : rr(0.35, 1.6); }
    }
  }
  // sirens
  NYH.siren -= dt;
  if (NYH.siren <= 0){
    const k = clamp(urb*1.2, 0.15, 1.2)*(0.7 + 0.3*(1 - nf));
    NYH.siren = rr(55, 200)/k;
    if (L.alt < 2500 && net) nySiren(E, rnd() < 0.3 ? 'fire' : 'wail', 1 - 0.5*pq);
  }
  // the harbour: ferries, tugs, ships; fog signals
  NYH.harbour -= dt;
  if (NYH.harbour <= 0){
    const fog = clamp((X.fog || 0)*1.2, 0, 1);
    NYH.harbour = fog > 0.3 ? rr(60, 130) : rr(25, 75);
    if (S.dSea < 2200 && L.alt < 2500){
      const p = nyWater(E, rr(250, 2400)); if (p){ const d = Math.hypot(p[0] - L.wx, p[1] - L.wy), r = rnd(), big = r < 0.18, tug = !big && r < 0.45;
        if (tug) nyTug(E, p, d); else shipHorn(E, [p[0], p[1], big ? 220 : 45], d); }
    }
  }
}
// a point on the water around the listener (12 directions, the nearest sea cell beyond rmin)
function nyWater(E, rmin){
  const L = E.L, o = ri(0, 11);
  for (let j = 0; j < 12; j++){ const D = RING[(o + j) % 12]; for (const f of [1, 1.4, 1.9, 2.6]){ const r = rmin*f, x = L.wx + D[0]*r, y = L.wy + D[1]*r, q = cellAt(x, y); if (q >= 0 && nat[q] === 1) return [x, y]; } }
  return null;
}
function nyPanOut(E, x, y, d, lvl, send){
  const c = E.ctx, g = c.createGain(); g.gain.value = lvl;
  const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = airLP(d, E.wx.rain > 0.2)*0.8; g.connect(lp);
  let tail = lp; if (c.createStereoPanner){ const p = c.createStereoPanner(); p.pan.value = panOf(E, x, y); lp.connect(p); tail = p; }
  tail.connect(E.bus.trf); if (send) tail.connect(nGain(E, E.rvIn, send));
  return g;
}
// one car / van horn pair (square waves through a horn-like band), a tap or a lean on it
function nyHorn(E, x, y, d, t0, big, tap){
  const lvl = clamp(0.5*Math.pow(40/Math.max(d, 25), 0.9), 0.02, 0.5)*(big ? 1.3 : 1), out = nyPanOut(E, x, y, d, lvl, 0.35);
  const dur = tap ? rr(0.08, 0.2) : rnd() < 0.3 ? rr(0.9, 2.2) : rr(0.18, 0.6), f = big ? [rr(290, 330), rr(360, 400)] : [rr(400, 450), rr(500, 560)];
  const g = nEnv(E, out, t0, 0.01, 0.6, dur, 0.03), bp = nFilt(E, 'bandpass', big ? 1300 : 1800, 0.7, g);
  nOsc(E, 'square', f[0], t0, t0 + dur + 0.2, bp); nOsc(E, 'square', f[1], t0, t0 + dur + 0.2, bp);
  E.events++;
}
// a siren passing in the distance: the source moves on a straight line past the listener (closest 120-700 m), pitch falls as it passes
function nySiren(E, kind, k){
  const c = E.ctx, L = E.L, t0 = c.currentTime + 0.05, dmin = rr(120, 700) + L.alt*0.5, v = rr(9, 15), T = rr(20, 34), a = rnd()*TAU;
  const ux = Math.cos(a), uy = Math.sin(a), cx = L.wx - uy*dmin, cy = L.wy + ux*dmin;
  const g = c.createGain(); g.gain.setValueAtTime(0, t0);
  const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.6; lp.frequency.setValueAtTime(300, t0); g.connect(lp);
  const pan = c.createStereoPanner ? c.createStereoPanner() : null; if (pan){ lp.connect(pan); pan.connect(E.bus.trf); pan.connect(nGain(E, E.rvIn, 0.55)); } else { lp.connect(E.bus.trf); lp.connect(nGain(E, E.rvIn, 0.55)); }
  // the siren voice: a sawtooth (police / ambulance) or a rich growl (fire), frequency = centre + LFO
  const o = c.createOscillator(), lfo = c.createOscillator(), dep = c.createGain(), sh = c.createBiquadFilter(); sh.type = 'peaking'; sh.frequency.value = 1100; sh.Q.value = 0.8; sh.gain.value = 5; sh.connect(g);
  o.connect(sh); lfo.connect(dep); dep.connect(o.frequency); o.detune.setValueAtTime(0, t0); if (pan) pan.pan.setValueAtTime(0, t0);
  if (kind === 'fire'){ o.type = 'sawtooth'; o.frequency.setValueAtTime(420, t0); lfo.type = 'sine'; lfo.frequency.setValueAtTime(0.09, t0); dep.gain.setValueAtTime(330, t0); }
  else { o.type = 'sawtooth'; o.frequency.setValueAtTime(1000, t0); lfo.type = 'triangle'; lfo.frequency.setValueAtTime(rr(0.22, 0.3), t0); dep.gain.setValueAtTime(380, t0); }
  // the path: gain, low-pass, pan and Doppler sampled every 0.5 s
  const n = Math.ceil(T/0.5);
  for (let i = 0; i <= n; i++){
    const tt = t0 + i*0.5, s = (i*0.5 - T/2)*v, x = cx + ux*s, y = cy + uy*s, d = Math.hypot(x - L.wx, y - L.wy, L.alt + 2);
    const rv = s/Math.max(d, 1)*v, D = clamp(C_SND/(C_SND + rv), 0.9, 1.1), env = Math.min(1, i/4, (n - i)/5);
    g.gain.linearRampToValueAtTime(env*k*clamp(0.75*Math.pow(150/d, 1.05), 0.004, 0.45), tt);
    lp.frequency.linearRampToValueAtTime(airLP(d, E.wx.rain > 0.2)*0.55, tt);
    if (pan) pan.pan.linearRampToValueAtTime(panOf(E, x, y), tt);
    if (kind !== 'fire'){ o.detune.linearRampToValueAtTime(1200*Math.log2(D), tt);
      // near the crossing it switches to the fast yelp, then back to the wail
      if (i === Math.floor(n*0.42)){ lfo.frequency.setValueAtTime(3.6, tt); dep.gain.setValueAtTime(320, tt); }
      if (i === Math.floor(n*0.62)){ lfo.frequency.setValueAtTime(0.26, tt); dep.gain.setValueAtTime(380, tt); } }
    else o.detune.linearRampToValueAtTime(1200*Math.log2(D), tt);
  }
  const t1 = t0 + T + 0.5; o.start(t0); lfo.start(t0); o.stop(t1); lfo.stop(t1);
  // the fire engine's air horn: blasts as it pushes through the crossing
  if (kind === 'fire'){ const ah = nGain(E, g, 1); for (let b = 0; b < ri(2, 4); b++){ const tb = t0 + T*0.4 + b*rr(0.8, 1.5), db = rr(0.5, 1.2), eg = nEnv(E, ah, tb, 0.03, 0.9, db, 0.08);
      const bp = nFilt(E, 'lowpass', 1400, 0.7, eg); for (const f of [233, 294, 349]) nOsc(E, 'sawtooth', f, tb, tb + db + 0.4, bp); } }
  E.events++; E.lastSiren = {kind, dmin:Math.round(dmin), T:+T.toFixed(1)};
}
// a tug's double toot
function nyTug(E, p, d){
  const f0 = rr(150, 210);
  evtAt(E, p[0], p[1], 8, 1.2, 150, Math.min(20, d/C_SND), (V, t0) => {
    const c = E.ctx, g = c.createGain(); g.gain.setValueAtTime(0, t0); g.connect(V.inp); g.connect(nGain(E, E.rvIn, 0.45));
    const lp = nFilt(E, 'lowpass', 2200, 0.7, g), o = c.createOscillator(); o.setPeriodicWave(E.waves.horn); o.frequency.value = f0; o.connect(lp);
    let tt = t0; for (let b = 0; b < 2; b++){ const dd = b ? rr(0.9, 1.5) : rr(0.4, 0.7); g.gain.setTargetAtTime(1, tt, 0.05); g.gain.setTargetAtTime(0, tt + dd, 0.08); tt += dd + 0.5; }
    o.start(t0); o.stop(tt + 1); return tt - t0 + 1;
  }, 'air');
}

/* ---------------------------------------------------------------- traffic: pooled vehicle voices, buses, horns, crossings -------- */
// per vehicle type: engine wave and its base divisor (rpm / div = wave base), idle / low / high rpm in a gear, gear top speeds (m/s),
// engine and tyre levels, reference distance (m), score weight (who gets a voice), horn pair (Hz)
const VK = {
  sedan:  {w:'i4', div:60,  idle:760,  rl:1400, rh:3000, gears:[4.5, 9, 14, 20, 27],        eL:0.30, tL:1.0,  ref:4.5, lv:1.0, horn:[415, 520]},
  hatch:  {w:'i4', div:60,  idle:820,  rl:1500, rh:3300, gears:[4.5, 9, 14, 20, 27],        eL:0.32, tL:0.95, ref:4.5, lv:1.0, horn:[440, 550]},
  mpv:    {w:'i4', div:60,  idle:720,  rl:1300, rh:2800, gears:[4.5, 9, 14, 20, 27],        eL:0.30, tL:1.05, ref:4.5, lv:1.0, horn:[400, 500]},
  suv:    {w:'i4', div:60,  idle:700,  rl:1300, rh:2800, gears:[4.5, 9, 14, 20, 27],        eL:0.34, tL:1.1,  ref:4.5, lv:1.05, horn:[400, 500]},
  pickup: {w:'v8', div:120, idle:650,  rl:1200, rh:2600, gears:[5, 10, 16, 23, 30],         eL:0.50, tL:1.15, ref:5,   lv:1.3, horn:[380, 475]},
  taxi:   {w:'i4', div:60,  idle:800,  rl:1300, rh:2700, gears:[4.5, 9, 14, 20, 27],        eL:0.20, tL:1.0,  ref:4.5, lv:0.95, horn:[430, 540]},
  van:    {w:'d6', div:60,  idle:800,  rl:1200, rh:2700, gears:[4, 8, 13, 19, 25],          eL:0.42, tL:1.1,  ref:5,   lv:1.2, horn:[390, 490]},
  lorry:  {w:'d6', div:60,  idle:600,  rl:900,  rh:2000, gears:[3, 6, 9, 13, 17, 21, 25],   eL:0.85, tL:1.5,  ref:6,   lv:2.2, horn:[300, 370]},
  olorry: {w:'d6', div:60,  idle:620,  rl:950,  rh:2100, gears:[3, 6, 9, 13, 17, 21, 25],   eL:0.75, tL:1.4,  ref:6,   lv:2.0, horn:[310, 380]},
  moto:   {w:'m1', div:120, idle:1400, rl:3200, rh:7400, gears:[3, 6.5, 10.5, 15, 21, 28],  eL:0.85, tL:0.25, ref:3.5, lv:1.9, horn:[620, 650]},
  bus:    {w:'d6', div:60,  idle:650,  rl:900,  rh:2000, gears:[3, 6, 9.5, 13, 18],         eL:0.70, tL:1.4,  ref:6,   lv:2.0, horn:[320, 400], bus:1},
  dd:     {w:'d6', div:60,  idle:640,  rl:900,  rh:2000, gears:[3, 6, 9.5, 13, 18],         eL:0.72, tL:1.45, ref:6,   lv:2.1, horn:[320, 400], bus:1},
  artic:  {w:'d6', div:60,  idle:620,  rl:900,  rh:1900, gears:[3, 6, 9.5, 13, 18],         eL:0.75, tL:1.55, ref:6.5, lv:2.2, horn:[320, 400], bus:1},
  usbus:  {w:'d6', div:60,  idle:640,  rl:900,  rh:1900, gears:[3, 6, 9.5, 13, 18],         eL:0.45, tL:1.4,  ref:6,   lv:1.8, horn:[330, 415], bus:1},
  usartic:{w:'d6', div:60,  idle:620,  rl:900,  rh:1900, gears:[3, 6, 9.5, 13, 18],         eL:0.48, tL:1.5,  ref:6.5, lv:1.9, horn:[330, 415], bus:1}};
function rpmOf(K, v, acc){
  if (v < 0.35) return K.idle;
  const G = K.gears; let g = 0; while (g < G.length && v > G[g]) g++;
  const lo = g ? G[g - 1] : 0, hi = g < G.length ? G[g] : G[G.length - 1]*1.35, u = clamp((v - lo)/Math.max(1, hi - lo), 0, 1);
  return lerp(g ? K.rl*0.9 : K.rl*0.75, K.rh, u)*(1 + 0.12*clamp(acc/1.5, 0, 1));
}
// vehicle position (world x, y, deck height z, travel direction dx, dy): the traffic module's path geometry, read-only
const TGS = 7;
function tGeoPos(g, s, t, out){
  const A = g.A, n = g.n; if (s <= 0) s = 0; else if (s >= g.Lt) s = g.Lt;
  let lo = 0, hi = n - 2; while (lo < hi){ const m = (lo + hi + 1) >> 1; if (A[m*TGS + 2] <= s) lo = m; else hi = m - 1; }
  const a = lo*TGS, b = a + TGS, d = A[b + 2] - A[a + 2], f = d > 1e-6 ? (s - A[a + 2])/d : 0;
  const xa = A[a] + A[a + 3]*t, ya = A[a + 1] + A[a + 4]*t, xb = A[b] + A[b + 3]*t, yb = A[b + 1] + A[b + 4]*t;
  const w = (t/(g.hw || 1))*0.5 + 0.5, za = A[a + 6] + (A[a + 5] - A[a + 6])*w, zb = A[b + 6] + (A[b + 5] - A[b + 6])*w;
  out.x = xa + (xb - xa)*f; out.y = ya + (yb - ya)*f; out.z = za + (zb - za)*f;
  let dx = A[b] - A[a], dy = A[b + 1] - A[a + 1]; const l = Math.hypot(dx, dy) || 1; out.dx = dx/l; out.dy = dy/l;
  return out;
}
function tDlPos(dl, u, t, out){ if (dl.dir > 0) tGeoPos(dl.g, dl.a + u, t, out); else { tGeoPos(dl.g, dl.b - u, -t, out); out.dx = -out.dx; out.dy = -out.dy; } return out; }
function vehPos(V, out){
  const uq = V.u - V.len*0.5, L = V.cnL || 0;
  if (V.cn && V.uC0 > -1e8 && uq < V.uC0 + L){
    if (uq >= V.uC0 || !V.pdl){ const c = V.cn, t = clamp((uq - V.uC0)/(L || 1), 0, 1), u = 1 - t;
      out.x = u*u*c.x0 + 2*u*t*c.cx + t*t*c.x1; out.y = u*u*c.y0 + 2*u*t*c.cy + t*t*c.y1; out.z = c.z0 + (c.z1 - c.z0)*t;
      const dx = 2*u*(c.cx - c.x0) + 2*t*(c.x1 - c.cx), dy = 2*u*(c.cy - c.y0) + 2*t*(c.y1 - c.cy), l = Math.hypot(dx, dy) || 1; out.dx = dx/l; out.dy = dy/l; return out; }
    return tDlPos(V.pdl, V.pu + (uq - V.uC0), V.pt || 0, out);
  }
  const dl = V.dl, t = dl.lane ? dl.lane[V.ln < dl.nL ? V.ln : dl.nL - 1] || 0 : 0;
  return tDlPos(dl, uq, t, out);
}
const _vq = {x:0, y:0, z:0, dx:0, dy:0};
function vehBuild(V){
  const E = V.E, c = E.ctx;
  V.oE = c.createOscillator(); V.oE.setPeriodicWave(E.waves.i4); V.wk = 'i4';
  V.eLP = c.createBiquadFilter(); V.eLP.type = 'lowpass'; V.eLP.Q.value = 0.9; V.eG = c.createGain(); V.eG.gain.value = 0;
  V.oE.connect(V.eLP); V.eLP.connect(V.eG); V.eG.connect(V.inp);
  V.nS = c.createBufferSource(); V.nS.buffer = E.noise.w; V.nS.loop = true;
  V.tBP = c.createBiquadFilter(); V.tBP.type = 'bandpass'; V.tBP.Q.value = 0.38; V.tG = c.createGain(); V.tG.gain.value = 0;
  V.nS.connect(V.tBP); V.tBP.connect(V.tG); V.tG.connect(V.inp);
  V.oE.start(); V.nS.start(0, rnd()*2);
}
function trafficUpdate(E, dt){
  const T = window.SGTraffic, R = E.trf || (E.trf = {n250:0, nAll:0, scan:0, upd:0, xs:0.07, topV:[], topS:[], n:0, xv:[], xw:[]});
  let ok = false; try { ok = !!(T && T._int && T._int.VEH && auReal() && auNetVis() && T.enabled && !T.paused); } catch (e){ ok = false; }
  const t = E.ctx.currentTime;
  if (!ok){ for (const V of E.pv) if (V.busy && (V.kind === 'veh' || V.kind === 'xing')) pvFree(V, t); R.n250 = R.n250*0.9; R.nAll = R.nAll*0.9; return; }
  R.scan -= dt; if (R.scan <= 0){ R.scan = 0.1; vehScan(E, R, T._int.VEH, t); }
  R.upd -= dt; if (R.upd <= 0){ const step = Math.max(R.upd + 1/30, 1/30); R.upd = 1/30; vehVoices(E, step, t); }
  R.xs -= dt; if (R.xs <= 0){ R.xs = 0.2; xingUpdate(E, T._int, t); }
}
const VK_TOP = 12;
function vehScan(E, R, VEH, t){
  const TV = R.topV, TS = R.topS; let n = 0, n250 = 0, nAll = 0;
  const street = E.L.alt < 400;
  for (let i = 0; i < VEH.length; i++){
    const V = VEH[i]; if (!V.alive) continue; nAll++;
    const d = V.cd; if (!(d >= 0)) continue;
    if (d < 250) n250 += 0.3 + 0.7*Math.min(1, V.v/12);
    if (!street || d > 330) continue;
    const K = VK[V.T.k] || VK.sedan, s = K.lv*(0.3 + Math.min(1.6, V.v/12) + (V.acc > 0.4 ? 0.3 : 0))/Math.max(16, d*d);
    if (n < VK_TOP){ let j = n++; while (j > 0 && TS[j - 1] < s){ TS[j] = TS[j - 1]; TV[j] = TV[j - 1]; j--; } TS[j] = s; TV[j] = V; }
    else if (s > TS[VK_TOP - 1]){ let j = VK_TOP - 1; while (j > 0 && TS[j - 1] < s){ TS[j] = TS[j - 1]; TV[j] = TV[j - 1]; j--; } TS[j] = s; TV[j] = V; }
  }
  R.n = n; R.n250 = n250; R.nAll = nAll;
  // keep the voices whose vehicle is still among the best 12, give free voices to the best unvoiced ones
  for (const P of E.pv){ if (P.kind !== 'veh' || !P.busy) continue; let keep = false; if (P.key.alive) for (let j = 0; j < n; j++) if (TV[j] === P.key){ keep = true; break; } if (!keep) pvFree(P, t); }
  for (let j = 0; j < n; j++){
    const V = TV[j]; let has = false; for (const P of E.pv) if (P.kind === 'veh' && P.busy && P.key === V){ has = true; break; } if (has) continue;
    if (j >= 9) break;
    const P = pvGet(E, 'veh', 'trf'); if (!P) break;
    if (!P.oE) vehBuild(P);
    pvTake(P, V, t);
    const K = VK[V.T.k] || VK.sedan; P.K = K; if (P.wk !== K.w){ P.oE.setPeriodicWave(E.waves[K.w]); P.wk = K.w; }
    P.busSt = V.bus ? V.bus.st : -1; P.hornT = E.T + rr(2, 8);
  }
  for (let j = n; j < TV.length; j++) TV[j] = null;
}
function vehVoices(E, step, t){
  const L = E.L, bay = auBay(), wet = E.wx.rain;
  for (const P of E.pv){
    if (P.kind !== 'veh' || !P.busy) continue;
    const V = P.key; if (!V.alive){ pvFree(P, t); continue; }
    vehPos(V, _vq);
    const K = P.K, x = _vq.x, y = _vq.y, z = _vq.z + (K.bus || K.lv > 2 ? 1.3 : 0.7), v = V.v;
    const sx = x, sy = z, sz = -y, vx = _vq.dx*v, vz = -_vq.dy*v, d = Math.hypot(sx - L.x, sy - L.y, sz - L.z);
    const D = dop(E, sx, sy, sz, vx, 0, vz); P.D = D; P.v = v;
    pvPlace(P, sx, sy, sz, t);
    const rpm = rpmOf(K, v, V.acc), load = clamp(V.acc/1.4, 0, 1), idle = v < 0.35;
    const fb = rpm/K.div*D;
    PT(P.oE.frequency, fb, t, P.fresh ? 0.001 : 0.06);
    const fire = rpm/60*(K.w === 'd6' ? 3 : K.w === 'm1' ? 0.5 : K.w === 'v8' ? 4 : 2);
    PT(P.eLP.frequency, clamp(fire*(3.5 + 7*load) + 220, 150, 6000), t, 0.08);
    PT(P.eG.gain, K.eL*(idle ? 0.45 : 0.55 + 0.6*load), t, 0.12);
    const tk = clamp((v/14)*(v/14), 0, 4.5)*(1 + 0.8*wet);
    PT(P.tG.gain, K.tL*0.5*tk, t, 0.1);
    PT(P.tBP.frequency, (700 + v*38 + wet*1100)*D, t, 0.1);
    PT(P.nS.playbackRate, D, t, 0.1);
    pvLevel(P, 1.25, d, K.ref, 1, t);
    P.fresh = false;
    // buses: arrive (air brake, doors), leave (door beeps, door hiss)
    if (V.bus){ const st = V.bus.st; if (st !== P.busSt){ if (st === 1) busEvt(E, P, 'arrive', t); else if (st === 2 && P.busSt === 1) busEvt(E, P, 'leave', t); P.busSt = st; } }
    // horns: rare (Singapore rarer), likelier when held up and the queue moves
    if (E.T > P.hornT){
      const imp = V.wait > 2 && V.nxt && V.nxt.v > 2.5 ? 12 : 1, rate = (auNyc() ? 1/320*(0.25 + 0.75*(1 - (typeof nightF === 'number' ? nightF : 0))) : bay ? 1/900 : 1/2600)*imp;
      if (rnd() < rate*step*30) horn(E, P.inp, t + 0.02, K); P.hornT = E.T + 1;
    }
  }
}
function hiss(E, dest, t0, dur, amp, f){ const g = nEnv(E, dest, t0, 0.012, amp, dur*0.25, dur*0.3); const hp = nFilt(E, 'highpass', f || 2400, 0.7, g); nSrc(E, E.noise.w, t0, dur*2.2, 1, hp, true); }
function busEvt(E, P, kind, t){
  if (kind === 'arrive'){ hiss(E, P.inp, t + 0.1, 0.8, 0.55, 2600); hiss(E, P.inp, t + 1.6, 0.6, 0.35, 1800); }
  else { if (E.bank.doorbeep) nSrc(E, E.bank.doorbeep, t + 0.05, 0, 1, nGain(E, P.inp, 0.3)); hiss(E, P.inp, t + 0.9, 0.5, 0.35, 1800); hiss(E, P.inp, t + 1.8, 0.35, 0.3, 3000); }
  E.events++;
}
function horn(E, dest, t0, K){
  const n = rnd() < 0.35 ? 2 : 1;
  for (let k = 0; k < n; k++){
    const ts = t0 + k*0.3, d = n === 2 ? 0.16 : rr(0.3, 0.7), g = nEnv(E, dest, ts, 0.01, 0.42, d, 0.02);
    const bp = nFilt(E, 'bandpass', 1700, 0.7, g);
    nOsc(E, 'square', K.horn[0], ts, ts + d + 0.15, bp); nOsc(E, 'square', K.horn[1], ts, ts + d + 0.15, bp);
  }
  E.events++;
}
// pedestrian signals near a street-level listener: slow locator ticks, fast ticks while the green man is on. The state comes
// from the signal lamps the traffic module draws (PR.heads, four lamp instances per head: red, amber, green, arrow).
function xingBuild(V){
  const E = V.E, c = E.ctx;
  V.gS = c.createGain(); V.gF = c.createGain(); V.gS.gain.value = 1; V.gF.gain.value = 0; V.gS.connect(V.inp); V.gF.connect(V.inp);
  V.sS = c.createBufferSource(); V.sS.buffer = E.bank.xslow; V.sS.loop = true; V.sS.connect(V.gS); V.sS.start();
  V.sF = c.createBufferSource(); V.sF.buffer = E.bank.xfast; V.sF.loop = true; V.sF.connect(V.gF); V.sF.start();
}
function xingUpdate(E, I, t){
  const L = E.L, PR = I.PR, xs = E.trf.xv, xw = E.trf.xw;
  let n = 0;
  if (PR && PR.heads && PR.lamps && E.bank.xslow && L.alt < 45){
    const H = PR.heads, C = PR.lamps.C;
    let b0 = -1, d0 = 3600, b1 = -1, d1 = 3600;
    for (let i = 0; i < H.length; i++){ const h = H[i], d = (h.x - L.wx)*(h.x - L.wx) + (h.y - L.wy)*(h.y - L.wy); if (d < d0){ b1 = b0; d1 = d0; b0 = i; d0 = d; } else if (d < d1 && (b0 < 0 || H[b0].S !== h.S || H[b0].g !== h.g)){ b1 = i; d1 = d; } }
    for (const b of [b0, b1]){ if (b < 0) continue; const h = H[b];
      // green man for the crossing over this approach: its own traffic held at red while the other group has green
      const red = C[(b*4)*3] > 0.9 && C[(b*4)*3 + 1] < 0.2; let other = false;
      if (red) for (let j = 0; j < H.length; j++){ const k = H[j]; if (k.S === h.S && k.g !== h.g && C[(j*4 + 2)*3 + 1] > 0.9){ other = true; break; } }
      xw[n] = red && other; xs[n++] = h; }
  }
  for (const P of E.pv){ if (P.kind !== 'xing' || !P.busy) continue; let keep = false; for (let j = 0; j < n; j++) if (xs[j] === P.key){ keep = true; break; } if (!keep) pvFree(P, t); }
  for (let j = 0; j < n; j++){
    const h = xs[j]; let P = null; for (const Q of E.pv) if (Q.kind === 'xing' && Q.busy && Q.key === h){ P = Q; break; }
    if (!P){ P = pvGet(E, 'xing', 'trf'); if (!P) break; if (!P.sS) xingBuild(P); pvTake(P, h, t); }
    const sx = h.x, sy = h.z - 0.8, sz = -h.y, d = Math.hypot(sx - L.x, sy - L.y, sz - L.z);
    pvPlace(P, sx, sy, sz, t); pvLevel(P, 0.65, d, 2.5, 1, t); P.fresh = false;
    PT(P.gS.gain, xw[j] ? 0 : 1, t, 0.02); PT(P.gF.gain, xw[j] ? 0.85 : 0, t, 0.02);
  }
  for (let j = n; j < xs.length; j++) xs[j] = null;
}

/* ---------------------------------------------------------------- rail: MRT / LRT, BART, Caltrain, light rail, cable cars ------- */
const RK = {
  mrt:     {lv:1.3, rum:1.0, roll:1.0,  wh:[1050, 0.10], jk:'steel',  ref:14},
  lrt:     {lv:0.75, rum:0.5, roll:0.9, wh:[1500, 0.16], jk:'rubber', ref:10},
  bart:    {lv:1.5, rum:1.1, roll:1.25, wh:[1250, 0.13], jk:'steel',  ref:14, sq:1},
  caltrain:{lv:1.5, rum:1.3, roll:1.1,  wh:[820, 0.09],  jk:'steel',  ref:14, horn:1},
  muni:    {lv:0.9, rum:0.7, roll:0.8,  wh:[760, 0.12],  jk:'steel',  ref:10, gong:1, sq:0.5},
  vta:     {lv:0.9, rum:0.7, roll:0.8,  wh:[760, 0.12],  jk:'steel',  ref:10, gong:1},
  street:  {lv:0.9, rum:0.8, roll:0.9,  wh:[480, 0.16],  jk:'steel',  ref:9,  gong:1},
  cable:   {lv:0.7, rum:0.6, roll:0.4,  wh:[0, 0],       jk:'cable',  ref:7,  bell:1},
  // [nyc/nycapp] New York: steel subway trains (loud on the els, squeal on curves), PATH, commuter rail with horns, light rail
  nysub:   {lv:1.75, rum:1.35, roll:1.35, wh:[880, 0.08],  jk:'steel',  ref:15, sq:1.3, el:1},
  nypath:  {lv:1.5, rum:1.2, roll:1.2,  wh:[1150, 0.1],   jk:'steel',  ref:14, sq:0.8, el:1},
  nyrr:    {lv:1.6, rum:1.35, roll:1.15, wh:[700, 0.07],  jk:'steel',  ref:14, horn:1},
  nylrt:   {lv:0.9, rum:0.7, roll:0.8,  wh:[760, 0.12],  jk:'steel',  ref:10, gong:1, sq:0.4}};
function railKind(T){
  const R = T.R, code = (R.line && R.line.code) || '';
  if (auNyc()){ const c0 = code[0]; return c0 === 'S' ? 'nysub' : c0 === 'P' ? 'nypath' : c0 === 'A' ? 'lrt' : (c0 === 'H' || c0 === 'W') ? 'nylrt' : 'nyrr'; }
  if (!auBay()) return R.lrt ? 'lrt' : 'mrt';
  if (T.cc || code[0] === 'K') return 'cable'; if (code === 'MF') return 'street'; if (code[0] === 'M') return 'muni'; if (code[0] === 'V') return 'vta'; if (code === 'CT') return 'caltrain';
  return 'bart';
}
const _rq = {x:0, y:0, h:0, cls:0, dx:1, dy:0, i:0};
function routeAtA(R, s, out){
  const P = R.P, cum = R.cum, n = P.length; let lo = 0, hi = n - 1;
  while (lo < hi - 1){ const m = (lo + hi) >> 1; if (cum[m] <= s) lo = m; else hi = m; }
  const f = clamp((s - cum[lo])/Math.max(1e-6, cum[hi] - cum[lo]), 0, 1), a = P[lo], b = P[hi];
  out.x = a[0] + (b[0] - a[0])*f; out.y = a[1] + (b[1] - a[1])*f; out.h = R.yR[lo] + (R.yR[hi] - R.yR[lo])*f; out.cls = R.cls[f < 0.5 ? lo : hi];
  const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; out.dx = dx/l; out.dy = dy/l; out.i = lo; return out;
}
// head arc length and direction of a train at time t (the app's stepMovers formula)
function trainHead(T, t){ const R = T.R, L2 = 2*R.L, ph = (((t*(T.sp || 75) + T.ph) % L2) + L2) % L2; return ph < R.L ? [ph, 1] : [L2 - ph, -1]; }
function trainLen(T){ return ((T.cars || 6) - 1)*(T.gap || 26) + (T.sc ? T.sc[0] : 20); }
// the point of the train nearest the listener (arc length)
function trainNear(T, t, lx, ly){
  const R = T.R, [s0, dir] = trainHead(T, t), len = trainLen(T);
  let bs = s0, bd = 1e18;
  for (let k = 0; k <= 6; k++){ const s = clamp(s0 - dir*len*k/6, 0, R.L); routeAtA(R, s, _rq); const d = (_rq.x - lx)*(_rq.x - lx) + (_rq.y - ly)*(_rq.y - ly); if (d < bd){ bd = d; bs = s; } }
  for (let st = len/12; st > 1; st *= 0.5){ for (const s of [bs - st, bs + st]){ const lo = Math.min(s0, s0 - dir*len), hi = Math.max(s0, s0 - dir*len); if (s < lo || s > hi || s < 0 || s > R.L) continue; routeAtA(R, s, _rq); const d = (_rq.x - lx)*(_rq.x - lx) + (_rq.y - ly)*(_rq.y - ly); if (d < bd){ bd = d; bs = s; } } }
  return [bs, dir, s0];
}
function railBuild(V){
  const E = V.E, c = E.ctx, loop = (b) => { const s = c.createBufferSource(); s.buffer = b; s.loop = true; s.start(0, rnd()*b.duration*0.9); return s; };
  const F = (type, f, q) => { const b = c.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; return b; }, G = () => { const g = c.createGain(); g.gain.value = 0; return g; };
  V.rS = loop(E.noise.b); V.rLP = F('lowpass', 280, 0.7); V.rPK = F('peaking', 85, 1.4); V.rPK.gain.value = 0; V.rG = G(); V.rS.connect(V.rLP); V.rLP.connect(V.rPK); V.rPK.connect(V.rG); V.rG.connect(V.inp);
  V.oS = loop(E.noise.p); V.oBP = F('bandpass', 900, 0.7); V.oG = G(); V.oS.connect(V.oBP); V.oBP.connect(V.oG); V.oG.connect(V.inp);
  V.wO = c.createOscillator(); V.wO.type = 'sawtooth'; V.wBP = F('bandpass', 1000, 4); V.wG = G(); V.wO.connect(V.wBP); V.wBP.connect(V.wG); V.wG.connect(V.inp); V.wO.start();
  V.qS = loop(E.noise.p); V.qBP = F('bandpass', 3600, 12); V.qG = G(); V.qS.connect(V.qBP); V.qBP.connect(V.qG); V.qG.connect(V.inp);
  V.jG = G(); V.jG.connect(V.inp); V.jS = null; V.jk = null;
}
function railUpdate(E, t, dt){
  const R = E.rl || (E.rl = {scan:0.05, upd:0.016, top:[], topS:[], st:0, stNear:[], cab:0, cabPts:null, cabSrc:null});
  const now = E.ctx.currentTime, L = E.L;
  let trains = null; try { trains = auReal() && auNetVis() && typeof net !== 'undefined' && net.trains && net.trains.length ? net.trains : null; } catch (e){ trains = null; }
  if (!trains){ for (const V of E.pv) if (V.kind === 'rail' && V.busy) pvFree(V, now); E.cableD = 1e9; return; }
  // stations near the listener (chimes), cable routes (the slot hum)
  R.st -= dt; if (R.st <= 0){ R.st = 1; R.stNear.length = 0; try { for (const S of net.stations || []) if (S.mrt && S.p && Math.hypot(S.p[0] - L.wx, S.p[1] - L.wy) < 450) R.stNear.push(S); } catch (e){ /* */ } }
  if (auBay()){ R.cab -= dt; if (R.cab <= 0){ R.cab = 0.5; E.cableD = cableDist(E, R, L.wx, L.wy); } }
  R.scan -= dt;
  if (R.scan <= 0){
    R.scan = 0.1;
    const TP = R.top, TS = R.topS; let n = 0;
    for (const T of trains){
      if (!T.R || !T.R.L) continue;
      const [s0] = trainHead(T, t); routeAtA(T.R, s0, _rq);
      if (Math.abs(_rq.x - L.wx) > 2600 || Math.abs(_rq.y - L.wy) > 2600) continue;
      const [bs] = trainNear(T, t, L.wx, L.wy); routeAtA(T.R, bs, _rq);
      const d = Math.hypot(_rq.x - L.x, _rq.h + (T.y || 2) - L.y, -_rq.y - L.z); if (d > 1400) continue;
      const K = RK[railKind(T)], est = K.lv*0.75*(_rq.cls === 2 ? 0.05 : 1)*Math.pow(Math.min(1, K.ref/Math.max(d, 1)), 0.85); if (est < 0.01) continue;
      const s = est/Math.max(d, 8);
      if (n < 5){ let j = n++; while (j > 0 && TS[j - 1] < s){ TS[j] = TS[j - 1]; TP[j] = TP[j - 1]; j--; } TS[j] = s; TP[j] = T; }
      else if (s > TS[4]){ let j = 4; while (j > 0 && TS[j - 1] < s){ TS[j] = TS[j - 1]; TP[j] = TP[j - 1]; j--; } TS[j] = s; TP[j] = T; }
    }
    for (const P of E.pv){ if (P.kind !== 'rail' || !P.busy) continue; let keep = false; for (let j = 0; j < n; j++) if (TP[j] === P.key){ keep = true; break; } if (!keep) pvFree(P, now); }
    for (let j = 0; j < n && j < 3; j++){
      const T = TP[j]; let has = false; for (const P of E.pv) if (P.kind === 'rail' && P.busy && P.key === T){ has = true; break; } if (has) continue;
      const P = pvGet(E, 'rail', 'rail'); if (!P) break;
      if (!P.rS) railBuild(P);
      pvTake(P, T, now);
      const kind = railKind(T), K = RK[kind]; P.K = K; P.rk = kind; P.bellT = E.T + rr(0.5, 4); P.gongT = E.T + rr(3, 15); P.hornT = P.hornT || 0;
      const jk = 'j_' + K.jk + '_' + (T.gap || 26) + '_' + (T.sp || 18);
      if (P.jk !== jk){ if (P.jS){ try { P.jS.stop(); } catch (e){} P.jS.disconnect(); }
        if (!E.bank[jk]) E.bank[jk] = mkBuf(E.ctx, [jointLoop(T.gap || 26, T.sp || 18, K.jk)], NSR);
        const s = E.ctx.createBufferSource(); s.buffer = E.bank[jk]; s.loop = true; s.connect(P.jG); s.start(now, rnd()*s.buffer.duration); P.jS = s; P.jk = jk; }
    }
    for (let j = n; j < TP.length; j++) TP[j] = null;
  }
  R.upd -= dt; if (R.upd > 0) return; R.upd = 1/30;
  for (const P of E.pv){
    if (P.kind !== 'rail' || !P.busy) continue;
    const T = P.key, K = P.K, [bs, dir, s0] = trainNear(T, t, L.wx, L.wy); routeAtA(T.R, bs, _rq);
    const sx = _rq.x, sy = _rq.h + (T.y || 2) + 0.5, sz = -_rq.y, sp = T.sp || 18, d = Math.hypot(sx - L.x, sy - L.y, sz - L.z);
    const vx = _rq.dx*sp*dir, vz = -_rq.dy*sp*dir, D = dop(E, sx, sy, sz, vx, 0, vz), tun = _rq.cls === 2, via = _rq.cls === 1; P.D = D; P.via = via; P.tun = tun;
    // curvature around the nearest point (wheel squeal on tight curves)
    let curv = 0; if (K.sq){ const ax = _rq.dx, ay = _rq.dy; routeAtA(T.R, Math.min(T.R.L, bs + 25), _rq); const bx = _rq.dx, by = _rq.dy; curv = Math.abs(Math.atan2(ax*by - ay*bx, ax*bx + ay*by)); routeAtA(T.R, bs, _rq); }
    pvPlace(P, sx, sy, sz, now);
    const spk = sp/18;
    PT(P.rG.gain, K.rum*0.8*(0.6 + 0.4*spk), now, 0.1); PT(P.rLP.frequency, via ? 380 : 260, now, 0.3); PT(P.rPK.gain, via ? 9 : 0, now, 0.3);
    PT(P.oG.gain, K.roll*0.55*spk*spk, now, 0.1); PT(P.oBP.frequency, (650 + sp*18)*D, now, 0.1); PT(P.oS.playbackRate, D, now, 0.1);
    if (K.wh[0]){ PT(P.wO.frequency, K.wh[0]*spk*D*(1 + 0.01*Math.sin(E.T*0.7)), now, 0.1); PT(P.wBP.frequency, K.wh[0]*spk*D, now, 0.1); PT(P.wG.gain, K.wh[1], now, 0.2); } else PT(P.wG.gain, 0, now, 0.2);
    PT(P.qG.gain, K.sq ? clamp((curv - 0.05)*6, 0, 1)*0.5*K.sq : 0, now, 0.4);
    PT(P.jG.gain, 0.5*spk, now, 0.2); if (P.jS) PT(P.jS.playbackRate, D, now, 0.1);
    pvLevel(P, K.lv*0.75*(tun ? 0.05 : 1), d, K.ref, 0.85, now, tun ? 160 : 2e4);
    P.fresh = false;
    // events: station chimes, Caltrain horn, cable-car bells, light-rail gongs
    routeAtA(T.R, s0, _rq); const hx = _rq.x, hy = _rq.y, hz = _rq.h + 3;
    for (const S of R.stNear){ if (Math.hypot(S.p[0] - hx, S.p[1] - hy) < 40 && P.stLast !== S && L.alt < 160 && Math.hypot(S.p[0] - L.wx, S.p[1] - L.wy) < 300){ P.stLast = S; stationChime(E, S.p[0], S.p[1], hz); } }
    if (K.horn && E.T > P.hornT && d < 950 && d > 30 && (_rq.dx*dir*(L.wx - hx) + _rq.dy*dir*(L.wy - hy)) > 0){ P.hornT = E.T + 75; trainHorn(E, P, now); }
    if (K.bell && E.T > P.bellT && d < 260){ P.bellT = E.T + rr(5, 15); bellPattern(E, P, now); }
    if (K.el && via && d < 320 && E.T > (P.sqT || 0)){ P.sqT = E.T + rr(5, 14); if (rnd() < 0.7) elScreech(E, P, now, clamp(1 - d/320, 0.2, 1)); }
    if (K.gong && E.T > P.gongT && d < 200){ P.gongT = E.T + rr(18, 40); if (E.bank.gong) for (let k = 0; k < 2; k++) nSrc(E, E.bank.gong, now + 0.05 + k*0.32, 0, rr(0.98, 1.02), nGain(E, P.inp, 0.45)); E.events++; }
  }
}
// [nyc/nycapp] a wheel / brake screech burst of a subway train on an el: narrow bands of noise and a gliding whistle
function elScreech(E, P, t, k){
  const c = E.ctx, dur = rr(0.8, 2.6), f = rr(2600, 4400), g = c.createGain(); g.gain.setValueAtTime(0, t); g.connect(P.inp);
  const a = 0.32*k; g.gain.setTargetAtTime(a, t + 0.02, 0.08); g.gain.setTargetAtTime(a*rr(0.4, 0.8), t + dur*0.4, 0.2); g.gain.setTargetAtTime(0, t + dur, 0.15);
  const bp = nFilt(E, 'bandpass', f, 18, g); nSrc(E, E.noise.w, t, dur + 1, 1, bp, true);
  const bp2 = nFilt(E, 'bandpass', f*1.52, 22, nGain(E, g, 0.6)); nSrc(E, E.noise.w, t, dur + 1, 1, bp2, true);
  const o = c.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(f*0.98, t); o.frequency.linearRampToValueAtTime(f*rr(0.93, 1.06), t + dur); o.connect(nGain(E, g, 0.05)); o.start(t); o.stop(t + dur + 1);
  E.events++;
}
function stationChime(E, x, y, h){
  if (!E.bank.chime0) return;
  evtAt(E, x, y, h, 0.5, 20, 0, (V, t0) => { for (let k = 0; k < 3; k++) nSrc(E, E.bank['chime' + k], t0 + k*0.42, 0, 1, nGain(E, V.inp, 0.55)); return 2.6; }, 'rail');
}
// Caltrain's three-chime horn at the crossings: long, long, short, long
function trainHorn(E, P, t){
  const c = E.ctx, g = c.createGain(); g.gain.setValueAtTime(0, t); g.connect(P.inp); const bp = nFilt(E, 'lowpass', 2600, 0.7, g);
  const pat = [[0, 1.3], [1.6, 1.3], [3.2, 0.55], [4.0, 2.0]];
  for (const [a, d] of pat){ g.gain.setTargetAtTime(0.55, t + a, 0.03); g.gain.setTargetAtTime(0, t + a + d, 0.06); }
  for (const f of [311.1, 370, 466.2]){ const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.connect(bp); o.start(t); o.stop(t + 6.6); }
  E.events++;
}
// the gripman's bell: rhythms of strikes
function bellPattern(E, P, t){
  if (!E.bank.bell) return;
  const pats = [[0, 0.16], [0, 0.18, 0.5, 0.68], [0, 0.14, 0.28, 0.6, 0.74, 0.88, 1.2], [0, 0.4], [0, 0.12, 0.24, 0.36, 0.48]], p = pick(pats);
  for (const a of p) nSrc(E, E.bank.bell, t + 0.05 + a, 0, rr(0.985, 1.015), nGain(E, P.inp, rr(0.45, 0.6)));
  E.events++;
}
// distance to the nearest cable-car route (sampled every ~12 m)
function cableDist(E, R, x, y){
  try {
    if (R.cabSrc !== net.mrt){ R.cabSrc = net.mrt; const pts = [];
      for (const M of net.mrt || []){ const code = M.line && M.line.code || ''; if (code[0] !== 'K') continue; const P = M.P;
        for (let i = 0; i < P.length - 1; i++){ const a = P[i], b = P[i + 1], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1])/12)); for (let k = 0; k < n; k++) pts.push(a[0] + (b[0] - a[0])*k/n, a[1] + (b[1] - a[1])*k/n); } }
      R.cabPts = new Float32Array(pts); }
    const P = R.cabPts; if (!P || !P.length) return 1e9;
    let b = 1e18; for (let i = 0; i < P.length; i += 2){ const dx = P[i] - x, dy = P[i + 1] - y, d = dx*dx + dy*dy; if (d < b) b = d; }
    return Math.sqrt(b);
  } catch (e){ return 1e9; }
}

/* ---------------------------------------------------------------- aircraft (window.SGAir.SIM) -------------------------------------- */
function acZ(SIM, ac){
  let g = 0; try { g = Math.max(0, hC(ac.M[0], ac.M[1])); } catch (e){ g = 0; }
  if (ac.st === 'approach') return (ac.rw && ac.rw.y !== undefined ? ac.rw.y : SIM.rwY || g) + ac.alt;
  if (ac.st === 'takeoff') return ac.alt > 0 ? (ac.drw && ac.drw.y !== undefined ? ac.drw.y : SIM.rwYD || g) + ac.alt : g;
  return g;
}
const apuOn = ac => ((ac.id*0.618 + 0.3) % 1) < 0.6;
function airLvl(ac){
  const sz = ac.F && ac.F.code === 'F' ? 1.3 : ac.F && ac.F.code === 'E' ? 1.15 : ac.F && ac.F.code === 'C' ? 0.9 : 0.75;
  const st = ac.st;
  return sz*(st === 'takeoff' ? 3 : st === 'approach' ? 1.2 : st === 'roll' ? (ac.spd > 30 ? 2 : 0.35) : st === 'taxi' || st === 'hold' ? 0.35 : st === 'start' ? 0.4 : st === 'park' ? (apuOn(ac) ? 0.12 : 0) : 0.12);
}
function airBuild(V){
  const E = V.E, c = E.ctx, loop = (b) => { const s = c.createBufferSource(); s.buffer = b; s.loop = true; s.start(0, rnd()*b.duration*0.9); return s; };
  const F = (type, f, q) => { const b = c.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; return b; }, G = () => { const g = c.createGain(); g.gain.value = 0; return g; };
  V.aS = loop(E.noise.p); V.aLP = F('lowpass', 1500, 0.6); V.aG = G(); V.aS.connect(V.aLP); V.aLP.connect(V.aG); V.aG.connect(V.inp);
  V.uS = loop(E.noise.b); V.uLP = F('lowpass', 150, 0.7); V.uG = G(); V.uS.connect(V.uLP); V.uLP.connect(V.uG); V.uG.connect(V.inp);
  V.bO = c.createOscillator(); V.bO.setPeriodicWave(E.waves.buzz); V.bLP = F('lowpass', 2600, 0.6); V.bG = G(); V.bO.connect(V.bLP); V.bLP.connect(V.bG); V.bG.connect(V.inp); V.bO.start();
  V.wO = c.createOscillator(); V.wG = G(); V.wO.connect(V.wG); V.wG.connect(V.inp); V.wO.start();
  V.w2 = c.createOscillator(); V.w2G = G(); V.w2.connect(V.w2G); V.w2G.connect(V.inp); V.w2.start();
}
function airUpdate(E, dt){
  const R = E.ar || (E.ar = {scan:0.083, upd:0.008, top:[], topS:[]}), now = E.ctx.currentTime, L = E.L;
  let SIM = null; try { SIM = auReal() && auNetVis() && window.SGAir && window.SGAir.SIM && window.SGAir.SIM.ac ? window.SGAir.SIM : null; } catch (e){ SIM = null; }
  if (!SIM){ for (const V of E.pv) if (V.kind === 'air' && V.busy) pvFree(V, now); return; }
  R.scan -= dt;
  if (R.scan <= 0){
    R.scan = 0.2; const TP = R.top, TS = R.topS; let n = 0;
    for (const ac of SIM.ac){
      if (!ac || ac.st === 'gone' || !ac.M) continue;
      const lv = airLvl(ac); if (!lv) continue;
      const dx = ac.M[0] - L.wx, dy = ac.M[1] - L.wy; if (Math.abs(dx) > 12000 || Math.abs(dy) > 12000) continue;
      const z = acZ(SIM, ac), d = Math.hypot(dx, dy, z - L.y); if (ac.st === 'park' && d > 500) continue; if (Math.min(2.2, lv)*1.1*Math.min(1, 70/Math.max(d, 1)) < 0.006) continue;
      const s = lv/Math.max(d, 40);
      if (n < 5){ let j = n++; while (j > 0 && TS[j - 1] < s){ TS[j] = TS[j - 1]; TP[j] = TP[j - 1]; j--; } TS[j] = s; TP[j] = ac; }
      else if (s > TS[4]){ let j = 4; while (j > 0 && TS[j - 1] < s){ TS[j] = TS[j - 1]; TP[j] = TP[j - 1]; j--; } TS[j] = s; TP[j] = ac; }
    }
    for (const P of E.pv){ if (P.kind !== 'air' || !P.busy) continue; let keep = false; for (let j = 0; j < n; j++) if (TP[j] === P.key && P.key.st !== 'gone'){ keep = true; break; } if (!keep) pvFree(P, now); }
    for (let j = 0; j < n && j < 3; j++){
      const ac = TP[j]; let has = false; for (const P of E.pv) if (P.kind === 'air' && P.busy && P.key === ac){ has = true; break; } if (has) continue;
      const P = pvGet(E, 'air', 'air'); if (!P) break; if (!P.aS) airBuild(P); pvTake(P, ac, now);
    }
    for (let j = n; j < TP.length; j++) TP[j] = null;
  }
  R.upd -= dt; if (R.upd > 0) return; R.upd = 1/30;
  for (const P of E.pv){
    if (P.kind !== 'air' || !P.busy) continue;
    const ac = P.key, st = ac.st; if (st === 'gone'){ pvFree(P, now); continue; }
    const c = Math.cos(ac.h || 0), s = Math.sin(ac.h || 0), z = acZ(SIM, ac) + 3.5, sx = ac.M[0] + c*4, sy = ac.M[1] + s*4;
    const climb = st === 'takeoff' && ac.alt > 0 ? Math.min(13, 2 + (ac.lift || 0)*2.2) : st === 'approach' ? -3.7 : 0;
    const vx = c*(ac.spd || 0), vz = -s*(ac.spd || 0), d = Math.hypot(sx - L.x, z - L.y, -sy - L.z), D = dop(E, sx, z, -sy, vx, climb, vz); P.D = D;
    pvPlace(P, sx, z, -sy, now);
    // thrust recipe per phase: roar (low-passed pink), rumble, fan buzz-saw, compressor / fan whine, a second whine
    let roar = 0.1, rlp = 1100, rum = 0.05, buzz = 0, bf = 90, wh = 0.3, wf = 2900, w2 = 0.1, w2f = 5800, lvl = airLvl(ac);
    if (st === 'takeoff'){ const k = ac.alt > 600 ? 0.75 : 1; roar = 1*k; rlp = 2600; rum = 0.9*k; buzz = ac.alt < 800 ? 0.32 : 0.12; bf = 92; wh = 0.12; wf = 2400; w2 = 0.05; }
    else if (st === 'approach'){ roar = 0.55; rlp = 1700; rum = 0.3; buzz = 0; wh = 0.42; wf = 3150; w2 = 0.18; w2f = 1575; }
    else if (st === 'roll'){ if (ac.spd > 30){ roar = 0.95; rlp = 1300; rum = 0.85; buzz = 0.14; bf = 78; wh = 0.15; wf = 2600; } }
    else if (st === 'start'){ const u = clamp(1 - ((ac.startT || 0) - SIM.T)/12, 0, 1); roar = 0.05 + 0.08*u; wh = 0.32*u; wf = lerp(500, 2900, u); w2 = 0.1*u; w2f = wf*2; }
    else if (st === 'park' || st === 'push' || st === 'pushwait'){ roar = 0.06; rlp = 800; rum = 0.02; buzz = 0.1; bf = 215; wh = 0.28; wf = 430; w2 = 0.08; w2f = 7200; }
    PT(P.aG.gain, roar, now, 0.2); PT(P.aLP.frequency, rlp, now, 0.3); PT(P.aS.playbackRate, D, now, 0.1);
    PT(P.uG.gain, rum, now, 0.2);
    PT(P.bG.gain, buzz, now, 0.3); PT(P.bO.frequency, bf*D, now, 0.1);
    PT(P.wG.gain, wh*0.35, now, 0.3); PT(P.wO.frequency, wf*D, now, 0.1); PT(P.w2G.gain, w2*0.3, now, 0.3); PT(P.w2.frequency, w2f*D, now, 0.1);
    pvLevel(P, Math.min(2.2, lvl)*1.1, d, 70, 1, now);
    P.fresh = false;
  }
}

/* ---------------------------------------------------------------- the port: yard hum, clangs, alarms, beepers; ship horns --------- */
function portUpdate(E, dt){
  const R = E.po || (E.po = {scan:0.12, ev:0, ship:rr(20, 50), ships:[], shipScan:0, near:null, d:1e9}), now = E.ctx.currentTime, L = E.L;
  let P = null; try { P = auReal() && auNetVis() ? (window.SGPort || window.BayPort || null) : null; } catch (e){ P = null; }
  R.scan -= dt;
  if (R.scan <= 0){
    R.scan = 0.5; R.near = null; R.d = 1e9;
    if (P && P.T) for (const T of P.T){ if (T.closed || !T.bb) continue; const bx = clamp(L.wx, T.bb[0], T.bb[2]), by = clamp(L.wy, T.bb[1], T.bb[3]), d = Math.hypot(bx - L.wx, by - L.wy, L.alt + 5); if (d < R.d){ R.d = d; R.near = T; R.bx = bx; R.by = by; } }
    let V = null; for (const Q of E.pv) if (Q.kind === 'port' && Q.busy){ V = Q; break; }
    if (R.near && R.d < 2500){
      if (!V){ V = pvGet(E, 'port', 'air'); if (V){ if (!V.hS) portBuild(V); pvTake(V, 'port', now); } }
      if (V){ const g = Math.max(0, hC(R.bx, R.by)) + 12; pvPlace(V, R.bx, g, -R.by, now); pvLevel(V, 0.55*(R.near.work && R.near.work.length ? 1 : 0.6), Math.hypot(R.bx - L.x, g - L.y, -R.by - L.z), 90, 1, now); PT(V.cG.gain, rr(0.15, 0.6), now, 0.3); V.fresh = false; }
    } else if (V) pvFree(V, now);
  }
  // yard events near a working terminal
  if (R.near && R.d < 900){
    const k = 1 - R.d/900, T = R.near, cr = T.work && T.work.length ? T.work : T.cranes;
    if (rnd() < 0.45*k*dt && cr && cr.length){ const C = pick(cr); const x = C.x !== undefined ? C.x : C.p ? C.p[0] : null, y = C.y !== undefined ? C.y : C.p ? C.p[1] : null; if (x !== null && E.bank.clang0) evtAt(E, x + rr(-20, 20), y + rr(-20, 20), rr(4, 30), 0.8, 30, 0, (V2, t0) => { nSrc(E, E.bank['clang' + ri(0, 1)], t0, 0, rr(0.85, 1.15), nGain(E, V2.inp, 0.8)); return 1.4; }, 'air'); }
    if (rnd() < 0.035*k*dt && cr && cr.length && E.bank.alarm){ const C = pick(cr); if (C.x !== undefined) evtAt(E, C.x, C.y, 25, 0.35, 30, 0, (V2, t0) => { nSrc(E, E.bank.alarm, t0, 0, 1, nGain(E, V2.inp, 0.6)); return 2; }, 'air'); }
    if (rnd() < 0.05*k*dt && E.bank.reverse){ const x = rr(T.bb[0], T.bb[2]), y = rr(T.bb[1], T.bb[3]); evtAt(E, x, y, 3, 0.3, 20, 0, (V2, t0) => { nSrc(E, E.bank.reverse, t0, 0, 1, nGain(E, V2.inp, 0.6)); return 3.2; }, 'air'); }
  }
  // ship horns now and then (sound takes d / 343 s to arrive)
  R.shipScan -= dt; if (R.shipScan <= 0){ R.shipScan = 15; shipList(R, P); }
  R.ship -= dt;
  if (R.ship <= 0){
    R.ship = rr(40, 110);
    if (L.alt < 3000 && R.ships.length){
      let tot = 0; const W = []; for (const s of R.ships){ const d = Math.hypot(s[0] - L.wx, s[1] - L.wy); if (d > 9000) continue; const w = 1/Math.max(300, d); W.push([s, w, d]); tot += w; }
      if (W.length){ let r = rnd()*tot, S = W[0]; for (const w of W){ r -= w[1]; if (r <= 0){ S = w; break; } } shipHorn(E, S[0], S[2]); }
    }
  }
}
function portBuild(V){
  const E = V.E, c = E.ctx, loop = (b) => { const s = c.createBufferSource(); s.buffer = b; s.loop = true; s.start(0, rnd()*b.duration*0.9); return s; };
  V.hS = loop(E.noise.b); const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 130; const g = c.createGain(); g.gain.value = 1; V.hS.connect(lp); lp.connect(g); g.connect(V.inp);
  const o = c.createOscillator(); o.frequency.value = 49; const og = c.createGain(); og.gain.value = 0.12; o.connect(og); og.connect(V.inp); o.start();
  const o2 = c.createOscillator(); o2.frequency.value = 98.5; const og2 = c.createGain(); og2.gain.value = 0.06; o2.connect(og2); og2.connect(V.inp); o2.start();
  V.cS = loop(E.noise.p); const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 750; bp.Q.value = 1.4; V.cG = c.createGain(); V.cG.gain.value = 0.3; V.cS.connect(bp); bp.connect(V.cG); V.cG.connect(V.inp);
}
// ships: berthed at the terminals, anchored in the strait / the bay, ferries
function shipList(R, P){
  const out = R.ships; out.length = 0;
  try { if (P && P.T) for (const T of P.T) for (const s of T.ships || []) out.push([s.x, s.y, s.L || 200]); } catch (e){ /* */ }
  try { for (const m of regionGroup.children) if (m.material === matShip) out.push([m.position.x, -m.position.z, 220]); } catch (e){ /* */ }
  try { for (const F of net.ferries || []) if (F.m) out.push([F.m.position.x, -F.m.position.z, 40]); } catch (e){ /* */ }
}
function shipHorn(E, s, d){
  const big = s[2] > 120, f0 = big ? rr(68, 98) : rr(170, 260), nb = big ? (rnd() < 0.6 ? 1 : 2) : ri(1, 3), long = nb === 1 ? rr(3, 5.5) : rr(0.9, 1.4);
  evtAt(E, s[0], s[1], big ? 35 : 10, big ? 2.6 : 1.4, 150, Math.min(25, d/C_SND), (V, t0) => {
    const c = E.ctx, g = c.createGain(); g.gain.setValueAtTime(0, t0); g.connect(V.inp); g.connect(nGain(E, E.rvIn, 0.5));
    const pk = c.createBiquadFilter(); pk.type = 'peaking'; pk.frequency.value = big ? 320 : 700; pk.Q.value = 1; pk.gain.value = 8; const lp = nFilt(E, 'lowpass', big ? 1500 : 2600, 0.7, g); pk.connect(lp);
    const o = c.createOscillator(), o2 = c.createOscillator(); o.setPeriodicWave(E.waves.horn); o2.setPeriodicWave(E.waves.horn); o.frequency.value = f0; o2.frequency.value = f0*1.006; o.connect(pk); const g2 = nGain(E, pk, 0.6); o2.connect(g2);
    let tt = t0; for (let b = 0; b < nb; b++){ g.gain.setTargetAtTime(1, tt, 0.09); g.gain.setTargetAtTime(0, tt + long, 0.15); tt += long + 1.0; }
    o.start(t0); o2.start(t0); o.stop(tt + 1); o2.stop(tt + 1);
    return tt - t0 + 1.2;
  }, 'air');
}

/* ---------------------------------------------------------------- F1 drive (window.SGF1) --------------------------------------------
   The player's car (non-positional, in front of / around the listener): V6 periodic wave from rpm (two detuned oscillators),
   throttle-driven drive into a tanh shaper, exhaust low-pass and formant, intake roar, turbo whistle, gearbox whine, a gain cut
   at each upshift, a limiter stutter, overrun pops; tyre squeal from body slip / lateral load / lock-ups / launch wheelspin; kerb
   rumble (race: the circuit kerbs at the corners), bump and collision thumps, wind; start-light beeps; the AI cars as positional
   voices with Doppler; the crowd near the grandstands. */
const F1_CAMS = ['Cockpit', 'T-cam', 'Chase', 'Orbit'];
const F1_STANDS = [[1.2915, 103.8522], [1.2876, 103.8596], [1.2927, 103.8604], [1.2899, 103.8556]];   // Padang, Bay, Turn 1, Esplanade
function tanhCurve(k){ const n = 2048, a = new Float32Array(n), tk = Math.tanh(k); for (let i = 0; i < n; i++){ const x = i/(n - 1)*2 - 1; a[i] = Math.tanh(k*x)/tk; } return a; }
function f1Build(E){
  const c = E.ctx, F = E.f1 = {on:false, lastGear:1, popNext:0, hitT:0, bumpT:0, zv0:null, dz0:0, lights:0, rs:'off', lap:0, cheer:0, kerbOn:false};
  const G = v => { const g = c.createGain(); g.gain.value = v; return g; }, Fi = (type, f, q) => { const b = c.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; return b; };
  const loop = (b) => { const s = c.createBufferSource(); s.buffer = b; s.loop = true; s.start(0, rnd()*b.duration*0.9); return s; };
  const osc = (w, f) => { const o = c.createOscillator(); if (typeof w === 'string') o.type = w; else o.setPeriodicWave(w); o.frequency.value = f; o.start(); return o; };
  F.out = G(0); F.cut = G(1); F.cut.connect(F.out);
  F.lfo = osc('square', 23); F.lfoG = G(0); F.lfo.connect(F.lfoG); F.lfoG.connect(F.cut.gain);
  F.o1 = osc(E.waves.f1, 35); F.o2 = osc(E.waves.f1, 35); F.drv = G(0.5); F.o1.connect(F.drv); const g2 = G(0.6); F.o2.connect(g2); g2.connect(F.drv);
  F.sh = c.createWaveShaper(); F.sh.curve = tanhCurve(2.2); F.sh.oversample = '2x';
  F.xLP = Fi('lowpass', 3000, 0.8); F.xPK = Fi('peaking', 1150, 1); F.xPK.gain.value = 4; F.xG = G(0);
  F.drv.connect(F.sh); F.sh.connect(F.xLP); F.xLP.connect(F.xPK); F.xPK.connect(F.xG); F.xG.connect(F.cut);
  F.iS = loop(E.noise.p); F.iBP = Fi('bandpass', 2500, 1.4); F.iG = G(0); F.iS.connect(F.iBP); F.iBP.connect(F.iG); F.iG.connect(F.cut);
  F.tO = osc('sine', 3000); F.tG = G(0); F.tO.connect(F.tG); F.tG.connect(F.cut);
  F.gO = osc('triangle', 400); F.gG = G(0); F.gO.connect(F.gG); F.gG.connect(F.out);
  F.pS = loop(E.noise.w); F.pBP = Fi('bandpass', 1700, 1.1); F.pG = G(0); F.pS.connect(F.pBP); F.pBP.connect(F.pG); F.pG.connect(F.out);
  F.qS = loop(E.noise.p); F.qA = Fi('bandpass', 1150, 5); F.qB = Fi('bandpass', 2300, 7); F.qG = G(0); F.qS.connect(F.qA); F.qS.connect(F.qB); F.qA.connect(F.qG); F.qB.connect(F.qG); F.qG.connect(F.out);
  F.kO = osc('square', 40); F.kLP = Fi('lowpass', 170, 0.8); F.kG = G(0); F.kO.connect(F.kLP); F.kLP.connect(F.kG); F.kG.connect(F.out);
  F.hS = loop(E.noise.b); F.hLP = Fi('lowpass', 120, 0.7); F.hG = G(0); F.hS.connect(F.hLP); F.hLP.connect(F.hG); F.hG.connect(F.out);
  F.cS = loop(E.noise.w); F.cHP = Fi('highpass', 1600, 0.7); F.cG = G(0); F.cS.connect(F.cHP); F.cHP.connect(F.cG); F.cG.connect(F.out);
  F.wS = loop(E.noise.p); F.wBP = Fi('bandpass', 650, 0.6); F.wG = G(0); F.wS.connect(F.wBP); F.wBP.connect(F.wG); F.wG.connect(F.out);
  return F;
}
// state of the drive mode without allocations (the f1d copy exposes F1 / AI; the stock f1d only state())
function f1State(E){
  const S = window.SGF1; if (!S) return null;
  try {
    const C = S.CAR; if (!C) return null;
    if ('F1' in S){ const F = S.F1; return {on:!!F.on, mode:F.mode, cam:F.cam | 0, C, R:S.RACE, TR:S.TR, AI:S.AI, ext:true, veh:F.veh, rc:F.veh === 'car' && S.rc ? S.rc.info : null}; }
    // the stock f1d: no F1 view; the drive mode shows as body.f1on, a race as RACE.state (cheaper than state() every frame)
    const R = S.RACE, on = document.body.classList.contains('f1on');
    return {on, mode:R && R.state !== 'off' ? 'race' : 'free', cam:2, C, R, TR:S.TR, AI:null, ext:false};
  } catch (e){ return null; }
}
function f1Update(E, dt){
  const st = f1State(E), t = E.ctx.currentTime;
  if (st && st.on && st.veh === 'car' && st.rc && st.rc.kind && st.rc.kind !== 'car'){ f1Quiet(E, t); if (E.rc) rcAudOff(E, t); return; }   // v27: bus / truck / motorbike voices come from SGAudio.vehicle
  if (st && st.on && st.veh === 'car' && st.rc){ f1Quiet(E, t); rcAud(E, st, t, dt); return; }
  if (E.rc) rcAudOff(E, t);
  if (!st || !st.on){
    if (E.f1 && E.f1.on){ const F = E.f1; F.on = false; PT(F.out.gain, 0, t, 0.08); F.offAt = t + 1; bedSet(E, 'crowd', 0, 0.5); }
    if (E.f1 && !E.f1.on && E.f1.offAt && t > E.f1.offAt){ E.f1.out.disconnect(); E.f1.offAt = 0; }
    for (const V of E.pv) if (V.kind === 'f1ai' && V.busy) pvFree(V, t);
    return;
  }
  const F = E.f1 || f1Build(E), C = st.C, L = E.L;
  if (!F.on){ if (!F.offAt) F.out.connect(E.bus.f1); F.offAt = 0; F.on = true; F.lastGear = C.gear; F.zv0 = null; F.rs = st.R ? st.R.state : 'off'; F.lights = st.R ? st.R.lights : 0; }
  const u = Math.abs(C.u), rpmS = C.rpm, thr = C.thr || 0, race = st.mode === 'race', R = st.R;
  // revs on the grid while the lights come on
  let rpm = rpmS, thrA = thr;
  if (race && R && R.state === 'grid' && R.lights >= 1){ rpm = 9200 + 900*Math.sin(E.T*2.3) + 300*Math.sin(E.T*7.1); thrA = 0.55; }
  // listener distance (orbit camera) and camera position
  const cx = C.x, cy = C.y, cz = (C.zv !== undefined ? C.zv : C.z) + 0.7, dc = Math.hypot(cx - L.x, cz - L.y, -cy - L.z);
  const camK = st.cam === 0 ? 1 : st.cam === 1 ? 0.95 : st.cam === 2 ? 0.85 : Math.pow(Math.min(1, 9/Math.max(dc, 1)), 0.75);
  PT(F.out.gain, 0.36*camK, t, 0.1);
  // ---- engine (the stock f1d plays its own engine: stand down unless the copy delegates to us)
  const eng = st.ext ? 1 : 0, fb = rpm/120, ck = st.cam === 0 ? 0.8 : 1;
  PT(F.o1.frequency, fb, t, 0.012); PT(F.o2.frequency, fb*1.0035, t, 0.012);
  PT(F.drv.gain, 0.35 + 0.75*thrA, t, 0.03);
  PT(F.xLP.frequency, (900 + 5200*thrA + rpm*0.28)*ck, t, 0.03);
  PT(F.xG.gain, eng*(0.30 + 0.38*thrA + 0.14*rpm/12000), t, 0.03);
  PT(F.iBP.frequency, 1600 + rpm*0.16, t, 0.03); PT(F.iG.gain, eng*0.30*thrA*rpm/12000, t, 0.04);
  PT(F.tO.frequency, 2600 + rpm*0.32 + thrA*900, t, 0.08); PT(F.tG.gain, eng*0.022*thrA*rpm/12000, t, 0.1);
  PT(F.gO.frequency, 30 + u*38, t, 0.05); PT(F.gG.gain, eng*0.018*Math.min(1, u/30), t, 0.1);
  // limiter: square-wave stutter on the cut gain
  const lim = rpmS > 12050 && thr > 0.8;
  PT(F.lfoG.gain, lim ? 0.42 : 0, t, 0.01); if (lim !== F.lim){ PT(F.cut.gain, lim ? 0.58 : 1, t, 0.01); F.lim = lim; }
  // gear changes: a 40 ms cut on upshifts, a blip and pops on downshifts
  if (C.gear !== F.lastGear){
    if (C.gear > F.lastGear && C.gear > 1){ const g = F.cut.gain; g.cancelScheduledValues(t); g.setValueAtTime(lim ? 0.58 : 1, t); g.linearRampToValueAtTime(0.15, t + 0.012); g.linearRampToValueAtTime(lim ? 0.58 : 1, t + 0.055); f1Thump(E, F, t, 0.18, 0.04); }
    else if (C.gear < F.lastGear && C.gear >= 1){ F.popNext = Math.max(F.popNext, t); F.popBurst = t + 0.35; }
    F.lastGear = C.gear;
  }
  // overrun crackle
  if (eng && ((thr < 0.05 && rpmS > 6500 && u > 15) || (F.popBurst && t < F.popBurst))){
    if (F.popNext < t) F.popNext = t + 0.01;
    while (F.popNext < t + 0.12){ const tp = F.popNext, a = rr(0.08, 0.5)*(F.popBurst > t ? 1.4 : 1); const g = F.pG.gain; g.setValueAtTime(0, tp); g.linearRampToValueAtTime(a, tp + 0.002); g.setTargetAtTime(0, tp + 0.004, 0.007); PT(F.pBP.frequency, rr(900, 2600), tp, 0.001); F.popNext += rr(0.035, 0.16); }
  }
  // tyres: body slip, lateral load near the limit, lock-ups, launch wheelspin
  const beta = Math.atan2(Math.abs(C.v || 0), Math.max(u, 1)), ay = Math.abs(C.ay || 0), brk = C.brk || 0;
  let slip = Math.max(0, beta - 0.035)*7 + Math.max(0, ay/42 - 0.92)*2.5 + (brk > 0.7 && u > 18 && (C.ax || 0) < -32 ? 0.3 : 0) + (thr > 0.9 && u > 1 && u < 14 && C.gear <= 2 ? 0.35 : 0);
  if (C.kind === 'ground') slip *= 0.3;
  slip = clamp(slip, 0, 1);
  PT(F.qG.gain, 0.42*slip*Math.min(1, u/6), t, 0.05); PT(F.qA.frequency, 1050 + 250*slip + 60*Math.sin(E.T*13), t, 0.05);
  // kerbs (race: on the kerb band of a corner) and bumps / collisions
  let kerb = false; const TR = st.TR;
  if (race && TR && C.kind === 'track' && C.tri >= 0 && TR.kap){ const i = C.tri, d = C.trd || 0, edge = d >= 0 ? (TR.hl ? TR.hl[i] : 7) : (TR.hr ? TR.hr[i] : 7);
    kerb = Math.abs(TR.kap[i]) > 1/170 && Math.abs(d) > edge - 0.35 && Math.abs(d) < edge + 1.5 && u > 3; }
  PT(F.kG.gain, kerb ? 0.55*Math.min(1, u/20) : 0, t, 0.02); PT(F.kO.frequency, clamp(u/0.9, 18, 95), t, 0.02);
  const zv = C.zv !== undefined ? C.zv : C.z;
  if (F.zv0 !== null && dt > 0){ const dz = (zv - F.zv0)/dt, az = Math.abs(dz - F.dz0)/dt; if (az > 30 && u > 4 && E.T - F.bumpT > 0.12){ F.bumpT = E.T; f1Thump(E, F, t, clamp((az - 30)/90, 0.1, 0.8), 0); } F.dz0 = dz; }
  F.zv0 = zv;
  if ((C.hit || 0) > 0.8 && E.T - F.hitT > 0.15){ F.hitT = E.T; const k = clamp(C.hit/9, 0.15, 1); f1Thump(E, F, t, k, k > 0.45 ? k : 0); }
  // wind
  PT(F.wG.gain, clamp((u/85)*(u/85), 0, 1.6)*0.32*(st.cam === 0 ? 1.3 : 1), t, 0.1); PT(F.wBP.frequency, 450 + u*8 + 120*Math.sin(E.T*3.1), t, 0.1);
  // start lights: a beep per light; the crowd cheers at the start and as the car crosses the line
  if (R){
    if (R.state === 'grid' && R.lights > F.lights && R.lights >= 1) f1Beep(E, F, t);
    if (R.state === 'race' && F.rs === 'grid') F.cheer = E.T + 7;
    if (R.lap !== F.lap && R.state === 'race'){ F.cheer = Math.max(F.cheer, E.T + 3.5); F.lap = R.lap; }
    F.lights = R.lights; F.rs = R.state;
  }
  let crowd = 0;
  if (race && R && R.state !== 'off'){ let dmin = 1e9; for (const s of E.f1Stands || (E.f1Stands = F1_STANDS.map(p => sgXY(p[0], p[1])))) dmin = Math.min(dmin, Math.hypot(s[0] - L.wx, s[1] - L.wy));
    if (TR && TR.X && TR.startI !== undefined) dmin = Math.min(dmin, Math.hypot(TR.X[TR.startI] - L.wx, TR.Y[TR.startI] - L.wy));
    crowd = (1 - sstep(60, 420, dmin))*(0.5 + (F.cheer > E.T ? 0.9 : 0)); }
  bedSet(E, 'crowd', 0.18*crowd, F.cheer > E.T ? 0.4 : 1); if (crowd > 0.01) PT(E.beds.crowd.am.gain, rr(0.5, 1), t, 0.15);
  // AI cars (positional)
  f1Ai(E, st, t);
}
/* [lm22/svdrive] the road car's sound */
function f1Quiet(E, t){
  if (E.f1 && E.f1.on){ const F = E.f1; F.on = false; PT(F.out.gain, 0, t, 0.08); F.offAt = t + 1; bedSet(E, 'crowd', 0, 0.5); }
  if (E.f1 && !E.f1.on && E.f1.offAt && t > E.f1.offAt){ E.f1.out.disconnect(); E.f1.offAt = 0; }
  for (const V of E.pv) if (V.kind === 'f1ai' && V.busy) pvFree(V, t);
}
function rcAudOff(E, t){
  const A = E.rc; if (A.on){ A.on = false; PT(A.out.gain, 0, t, 0.08); A.offAt = t + 1; }
  if (!A.on && A.offAt && t > A.offAt){ A.out.disconnect(); A.offAt = 0; }
}
function rcAudBuild(E){
  const c = E.ctx, A = E.rc = {on:false, offAt:0, lastGear:1, hitT:0, bumpT:0, zv0:null, dz0:0, indOn:false, key:null};
  const G = v => { const g = c.createGain(); g.gain.value = v; return g; }, Fi = (type, f, q) => { const b = c.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; return b; };
  const loop = b => { const s = c.createBufferSource(); s.buffer = b; s.loop = true; s.start(0, rnd()*b.duration*0.9); return s; };
  const osc = (w, f) => { const o = c.createOscillator(); if (typeof w === 'string') o.type = w; else o.setPeriodicWave(w); o.frequency.value = f; o.start(); return o; };
  A.out = G(0); A.mix = Fi('lowpass', 18000, 0.5); A.mix.connect(A.out);
  // petrol engine: two detuned periodic-wave oscillators (half the crank rate) -> drive -> tanh -> low-pass; intake noise
  A.cut = G(1); A.cut.connect(A.mix);
  A.o1 = osc(E.waves.v8, 40); A.o2 = osc(E.waves.v8, 40); A.drv = G(0.5); A.o1.connect(A.drv); const g2 = G(0.55); A.o2.connect(g2); g2.connect(A.drv);
  A.sh = c.createWaveShaper(); A.sh.curve = tanhCurve(1.8); A.lp = Fi('lowpass', 1200, 0.9); A.eg = G(0);
  A.drv.connect(A.sh); A.sh.connect(A.lp); A.lp.connect(A.eg); A.eg.connect(A.cut);
  A.iS = loop(E.noise.p); A.iBP = Fi('bandpass', 900, 1.2); A.iG = G(0); A.iS.connect(A.iBP); A.iBP.connect(A.iG); A.iG.connect(A.cut);
  // electric: the motor / inverter whine (two tones) and a low hum
  A.m1 = osc('sine', 300); A.m2 = osc('triangle', 700); A.mG = G(0); A.m2G = G(0); A.m1.connect(A.mG); A.m2.connect(A.m2G); A.mG.connect(A.mix); A.m2G.connect(A.mix);
  A.hum = osc('sine', 55); A.humG = G(0); A.hum.connect(A.humG); A.humG.connect(A.mix);
  // tyre squeal, rolling road noise, wind, thumps
  A.qS = loop(E.noise.p); A.qA = Fi('bandpass', 1000, 5); A.qB = Fi('bandpass', 2100, 7); A.qG = G(0); A.qS.connect(A.qA); A.qS.connect(A.qB); A.qA.connect(A.qG); A.qB.connect(A.qG); A.qG.connect(A.mix);
  A.rS = loop(E.noise.b); A.rLP = Fi('lowpass', 400, 0.7); A.rG = G(0); A.rS.connect(A.rLP); A.rLP.connect(A.rG); A.rG.connect(A.mix);
  A.wS = loop(E.noise.p); A.wBP = Fi('bandpass', 600, 0.6); A.wG = G(0); A.wS.connect(A.wBP); A.wBP.connect(A.wG); A.wG.connect(A.mix);
  A.hS = loop(E.noise.b); A.hLP = Fi('lowpass', 130, 0.7); A.hG = G(0); A.hS.connect(A.hLP); A.hLP.connect(A.hG); A.hG.connect(A.out);
  return A;
}
function rcAud(E, st, t, dt){
  const A = E.rc || rcAudBuild(E), C = st.C, I = st.rc, L = E.L;
  if (!A.on){ if (!A.offAt) A.out.connect(E.bus.f1); A.offAt = 0; A.on = true; A.zv0 = null; A.lastGear = C.gear; }
  if (I.key !== A.key){ A.key = I.key;
    if (!I.ev){ const w = I.key === 'coupe' ? E.waves.v8 : I.key === 'taxi' ? E.waves.i4 : (E.waves.v6 || (E.waves.v6 = mkWave(E.ctx, waveAmps(48, k => (k % 6 === 0 ? 1/Math.pow(k/6, 0.85) : k % 3 === 0 ? 0.26/Math.pow(k/3, 0.7) : 0.05/Math.sqrt(k)) + (k <= 2 ? 0.08 : 0)))));
      A.o1.setPeriodicWave(w); A.o2.setPeriodicWave(w); } }
  const u = Math.abs(C.u), thr = C.thr || 0, brk = C.brk || 0, kmh = u*3.6, ins = st.cam === 2, orbit = st.cam === 3;
  const cx = C.x, cy = C.y, cz = (C.zv !== undefined ? C.zv : C.z) + 0.7, dc = Math.hypot(cx - L.x, cz - L.y, -cy - L.z);
  const camK = orbit ? Math.pow(Math.min(1, 8/Math.max(dc, 1)), 0.75) : ins ? 0.9 : 1;
  PT(A.out.gain, 0.4*camK, t, 0.1); PT(A.mix.frequency, ins ? 2400 : 16000, t, 0.15);
  if (I.ev){
    PT(A.eg.gain, 0, t, 0.05); PT(A.iG.gain, 0, t, 0.05);
    const fm = 110 + kmh*10.5, load = Math.max(thr, (brk > 0.05 || thr < 0.05) && u > 2 ? 0.3 : 0);
    PT(A.m1.frequency, fm, t, 0.03); PT(A.m2.frequency, fm*2.37, t, 0.03);
    PT(A.mG.gain, (0.008 + 0.045*load)*Math.min(1, u/3), t, 0.06); PT(A.m2G.gain, 0.011*load*Math.min(1, u/8), t, 0.06);
    PT(A.hum.frequency, 46 + kmh*0.5, t, 0.1); PT(A.humG.gain, 0.018*Math.min(1, u/2 + thr), t, 0.1);
  } else {
    PT(A.mG.gain, 0, t, 0.05); PT(A.m2G.gain, 0, t, 0.05); PT(A.humG.gain, 0, t, 0.05);
    const rpm = C.rpm || I.idle, rm = I.rpmMax || 6500, fb = rpm/(I.key === 'taxi' ? 60 : 120);
    PT(A.o1.frequency, fb, t, 0.015); PT(A.o2.frequency, fb*1.004, t, 0.015);
    PT(A.drv.gain, 0.35 + 0.8*thr, t, 0.04); PT(A.lp.frequency, 450 + 2600*thr + rpm*0.25, t, 0.04);
    PT(A.eg.gain, (I.key === 'coupe' ? 1.15 : 0.85)*(0.18 + 0.30*thr + 0.10*rpm/rm), t, 0.04);
    PT(A.iBP.frequency, 600 + rpm*0.25, t, 0.04); PT(A.iG.gain, 0.15*thr*rpm/rm, t, 0.05);
    if (C.gear !== A.lastGear){ if (C.gear > A.lastGear && C.gear > 1){ const g = A.cut.gain; g.cancelScheduledValues(t); g.setValueAtTime(1, t); g.linearRampToValueAtTime(0.35, t + 0.03); g.linearRampToValueAtTime(1, t + 0.17); } A.lastGear = C.gear; }
  }
  // tyres near the limit, sliding, wheelspin; rolling road noise (louder off road); wind
  const beta = Math.atan2(Math.abs(C.v || 0), Math.max(u, 1)), ay = Math.abs(C.ay || 0);
  let slip = Math.max(0, beta - 0.05)*6 + Math.max(0, ay/9.81 - 0.82)*3 + (thr > 0.9 && u > 1 && u < 9 && I.key === 'coupe' ? 0.25 : 0) + (brk > 0.8 && u > 15 && (C.ax || 0) < -8.5 ? 0.15 : 0);
  if (C.kind === 'ground') slip *= 0.3;
  slip = clamp(slip, 0, 1);
  PT(A.qG.gain, 0.34*slip*Math.min(1, u/5), t, 0.05); PT(A.qA.frequency, 950 + 220*slip + 50*Math.sin(E.T*11), t, 0.05);
  PT(A.rG.gain, Math.min(1, u/28)*(C.kind === 'ground' ? 0.55 : 0.24), t, 0.1); PT(A.rLP.frequency, 220 + u*14, t, 0.1);
  PT(A.wG.gain, clamp((u/60)*(u/60), 0, 1.4)*0.3, t, 0.1); PT(A.wBP.frequency, 420 + u*9 + 90*Math.sin(E.T*2.7), t, 0.1);
  // bumps and collisions
  const zv = C.zv !== undefined ? C.zv : C.z;
  if (A.zv0 !== null && dt > 0){ const dz = (zv - A.zv0)/dt, az = Math.abs(dz - A.dz0)/dt; if (az > 25 && u > 3 && E.T - A.bumpT > 0.12){ A.bumpT = E.T; rcThump(E, A, t, clamp((az - 25)/90, 0.08, 0.6)); } A.dz0 = dz; }
  A.zv0 = zv;
  if ((C.hit || 0) > 0.8 && E.T - A.hitT > 0.15){ A.hitT = E.T; rcThump(E, A, t, clamp(C.hit/8, 0.15, 1)); if (C.hit > 3){ const g = nEnv(E, A.out, t, 0.002, clamp(C.hit/14, 0.1, 0.7), 0.01, 0.05); nSrc(E, E.noise.w, t, 0.25, 1, nFilt(E, 'highpass', 1400, 0.7, g)); } }
  // the indicator relay: tick on, tock off
  if (I.ind){ const on = (I.indT % 0.76) < 0.4; if (on !== A.indOn){ A.indOn = on; const g = nEnv(E, A.out, t, 0.001, on ? 0.55 : 0.4, 0.003, 0.012); nSrc(E, E.noise.w, t, 0.05, 1, nFilt(E, 'bandpass', on ? 2700 : 1900, 2.5, g)); E.events++; } }
  else A.indOn = false;
}
function rcThump(E, A, t, amp){ const g = A.hG.gain; g.cancelScheduledValues(t); g.setValueAtTime(0, t); g.linearRampToValueAtTime(amp*1.5, t + 0.006); g.setTargetAtTime(0, t + 0.01, 0.07); E.events++; }
function f1Thump(E, F, t, amp, crack){
  const g = F.hG.gain; g.cancelScheduledValues(t); g.setValueAtTime(0, t); g.linearRampToValueAtTime(amp*1.6, t + 0.006); g.setTargetAtTime(0, t + 0.01, 0.06);
  if (crack){ const c = F.cG.gain; c.cancelScheduledValues(t); c.setValueAtTime(0, t); c.linearRampToValueAtTime(crack*0.9, t + 0.003); c.setTargetAtTime(0, t + 0.006, 0.03); }
  E.events++;
}
function f1Beep(E, F, t){ const g = nEnv(E, F.out, t, 0.004, 0.75, 0.16, 0.02); nOsc(E, 'sine', 1760, t, t + 0.35, g); const g2 = nGain(E, g, 0.3); nOsc(E, 'sine', 3520, t, t + 0.35, g2); E.events++; }
function f1AiBuild(V){
  const E = V.E, c = E.ctx;
  V.o = c.createOscillator(); V.o.setPeriodicWave(E.waves.f1); V.lp2 = c.createBiquadFilter(); V.lp2.type = 'lowpass'; V.lp2.frequency.value = 3000; V.eg = c.createGain(); V.eg.gain.value = 0.7;
  V.o.connect(V.lp2); V.lp2.connect(V.eg); V.eg.connect(V.inp); V.o.start();
  V.nS = c.createBufferSource(); V.nS.buffer = E.noise.p; V.nS.loop = true; const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 800; bp.Q.value = 0.6; V.ng = c.createGain(); V.ng.gain.value = 0;
  V.nS.connect(bp); bp.connect(V.ng); V.ng.connect(V.inp); V.nS.start(0, rnd()*3);
}
const F1_GEARS = [0, 88, 128, 163, 198, 233, 268, 302, 345];
function f1Ai(E, st, t){
  const A = st.AI, L = E.L;
  if (!A || !A.length || st.mode !== 'race'){ for (const V of E.pv) if (V.kind === 'f1ai' && V.busy) pvFree(V, t); return; }
  const top = E.f1top || (E.f1top = []); top.length = 0;
  for (const a of A){ if (a.x === undefined) continue; const d = Math.hypot(a.x - L.wx, a.y - L.wy); if (d < 450) top.push(a); }
  top.sort((p, q) => Math.hypot(p.x - L.wx, p.y - L.wy) - Math.hypot(q.x - L.wx, q.y - L.wy)); if (top.length > 3) top.length = 3;
  for (const P of E.pv) if (P.kind === 'f1ai' && P.busy && top.indexOf(P.key) < 0) pvFree(P, t);
  for (const a of top){
    let P = null; for (const Q of E.pv) if (Q.kind === 'f1ai' && Q.busy && Q.key === a){ P = Q; break; }
    if (!P){ P = pvGet(E, 'f1ai', 'f1'); if (!P) break; if (!P.o) f1AiBuild(P); pvTake(P, a, t); }
    const v = a.v || 0, kmh = v*3.6; let g = 1; while (g < 8 && 12000*kmh/F1_GEARS[g] > 11700) g++;
    const rpm = clamp(12000*kmh/F1_GEARS[g], 6500, 12100), sx = a.x, sy = (a.z || 0) + 0.6, sz = -a.y, d = Math.hypot(sx - L.x, sy - L.y, sz - L.z);
    const D = dop(E, sx, sy, sz, Math.cos(a.psi || 0)*v, 0, -Math.sin(a.psi || 0)*v);
    pvPlace(P, sx, sy, sz, t); PT(P.o.frequency, rpm/120*D, t, P.fresh ? 0.001 : 0.03); PT(P.lp2.frequency, 2000 + rpm*0.25, t, 0.05); PT(P.ng.gain, 0.25*Math.min(1, v/60), t, 0.1);
    pvLevel(P, 1.1, d, 6, 1, t); P.fresh = false;
  }
}

/* ---------------------------------------------------------------- UI: the speaker button and panel, UI sounds, brush, build chime --- */
const SND_SVG = {
  on:'<path d="M3.5 9.4h3.3l4.9-4v13.2l-4.9-4H3.5z"/><path d="M15.2 9.1a4 4 0 0 1 0 5.8"/><path d="M17.9 6.4a7.6 7.6 0 0 1 0 11.2"/>',
  off:'<path d="M3.5 9.4h3.3l4.9-4v13.2l-4.9-4H3.5z"/><path d="M15.6 9.6l4.8 4.8M20.4 9.6l-4.8 4.8"/>',
  wait:'<path d="M3.5 9.4h3.3l4.9-4v13.2l-4.9-4H3.5z"/><circle cx="17.6" cy="12" r="2.2"/>'};
const svgI = k => `<svg viewBox="0 0 24 24" aria-hidden="true">${SND_SVG[k]}</svg>`;
let LIVE = null;
const auRunning = () => !!(LIVE && LIVE.ctx.state === 'running');
function sndCSS(){
  const st = document.createElement('style');
  st.textContent = `
.sndwrap{position:relative;flex:none;display:flex}
.sndbtn{height:34px;display:flex;align-items:center;gap:6px;padding:0 10px 0 7px;border:1px solid var(--rule);background:var(--panel);border-radius:8px;cursor:pointer;color:var(--ink);white-space:nowrap}
.sndbtn:hover{background:var(--panel-2)}
.sndbtn[aria-expanded="true"]{background:var(--panel-2);border-color:var(--ink)}
.sndi{width:20px;height:20px;display:grid;place-items:center;color:var(--muted);position:relative}
.sndbtn[data-st="on"] .sndi{color:var(--ink)}
.sndbtn[data-st="wait"] .sndi{color:#b4581e}
.sndi svg,.sndrow svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round;display:block}
.sndt{display:flex;flex-direction:column;align-items:flex-start;line-height:1.12}
.sndt b{font-size:12.5px;font-weight:500}
.sndt small{font:400 9.5px var(--font-mono);color:var(--muted)}
.sndmenu{position:absolute;top:calc(100% + 15px);left:50%;transform:translateX(calc(-50% + var(--snddx, 0px)));width:300px;box-sizing:border-box;background:var(--panel);border:1px solid var(--rule);border-radius:10px;box-shadow:0 10px 32px rgba(27,30,28,.18);padding:10px 10px 11px;z-index:6;display:flex;flex-direction:column;gap:7px;color:var(--ink)}
.sndhd{display:flex;align-items:center;gap:8px;padding:0 2px}
.sndhd b{font-size:13px;font-weight:500}
.sndhd small{font:400 10.5px var(--font-mono);color:var(--muted);letter-spacing:.07em;text-transform:uppercase}
.sndsw{margin-left:auto;display:flex;align-items:center;gap:7px;border:1px solid var(--rule);background:var(--panel);border-radius:999px;padding:4px 10px 4px 5px;cursor:pointer;color:var(--ink);font-size:12px}
.sndsw i{width:30px;height:18px;border-radius:9px;background:var(--rule);position:relative;flex:none;transition:background .15s}
.sndsw i::after{content:"";position:absolute;left:2px;top:2px;width:14px;height:14px;border-radius:50%;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.25);transition:left .15s}
.sndsw[aria-checked="true"] i{background:#2c7a5a}
.sndsw[aria-checked="true"] i::after{left:14px}
.sndsw small{font:400 9.5px var(--font-mono);color:var(--muted)}
.sndrow{display:grid;grid-template-columns:28px 1fr 104px 30px;align-items:center;gap:6px;min-height:30px}
.sndrow.mst{grid-template-columns:1fr 132px 30px;padding:2px 2px 6px;border-bottom:1px solid var(--rule);margin-bottom:2px}
.sndrow .lb{display:flex;flex-direction:column;line-height:1.15;min-width:0}
.sndrow .lb span{font-size:12px}
.sndrow .lb small{font:400 9px var(--font-mono);color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sndrow input[type=range]{width:100%;min-width:0;margin:0}
.sndrow output{font:400 10px var(--font-mono);color:var(--muted);text-align:right;font-variant-numeric:tabular-nums}
.sndmute{width:28px;height:28px;border:1px solid var(--rule);background:var(--panel);border-radius:7px;display:grid;place-items:center;cursor:pointer;color:var(--ink);padding:0}
.sndmute svg{width:17px;height:17px}
.sndmute:hover{background:var(--panel-2)}
.sndmute[aria-pressed="true"]{color:var(--muted);background:var(--panel-2)}
.sndrow.muted .lb,.sndrow.muted input,.sndrow.muted output{opacity:.45}
.sndmenu.off .sndgrp,.sndmenu.off .mst input,.sndmenu.off .mst output{opacity:.5}
.sndnote{margin:2px 0 0;padding:0 2px;font-size:11px;line-height:1.45;color:var(--muted)}
.sndgrp{display:flex;flex-direction:column;gap:3px}
@media (prefers-reduced-motion:no-preference){ .sndbtn[data-st="wait"] .sndi circle{animation:sndpulse 1.4s ease-in-out infinite} }
@keyframes sndpulse{0%,100%{opacity:1}50%{opacity:.25}}
@media (prefers-reduced-motion:reduce){ .sndsw i,.sndsw i::after{transition:none} }
body.night .sndbtn{background:#1f2a2f;border-color:#2d3b42;color:#eef2f3}
body.night .sndbtn:hover,body.night .sndbtn[aria-expanded="true"]{background:#2a373d;border-color:#46565e}
body.night .sndbtn .sndt small{color:#a9b5bb}
body.night .sndbtn[data-st="on"] .sndi{color:#eef2f3}
body.night .sndbtn[data-st="wait"] .sndi{color:#f0a868}
body.night .sndmenu{background:#1f2a2f;border-color:#2d3b42;box-shadow:0 12px 34px rgba(8,12,16,.45);color:#eef2f3}
body.night .sndhd small,body.night .sndrow .lb small,body.night .sndrow output,body.night .sndnote,body.night .sndsw small{color:#a9b5bb}
body.night .sndsw,body.night .sndmute{background:#24323a;border-color:#33434b;color:#eef2f3}
body.night .sndmute:hover{background:#2c3b43}
body.night .sndrow.mst{border-color:#33434b}
body.night .sndsw i{background:#46565e}
body.night .sndsw[aria-checked="true"] i{background:#3f9a74}
@media (max-width:760px){
  .sndmenu{top:auto;bottom:calc(100% + 12px);left:auto;right:-4px;transform:translateX(var(--snddx, 0px));width:min(300px, calc(100vw - 24px))}
  .sndbtn{padding:0 9px 0 6px;gap:5px}
  .sndt small{display:none}
}
@media (max-width:374px){ .sndt{display:none} .sndbtn{padding:0 7px} }`;
  document.head.appendChild(st);
}
function sndPlace(m){
  const w = document.getElementById('sndWrap'), tb = document.getElementById('timebar'); if (!w || !tb) return;
  m.style.top = m.style.bottom = ''; m.style.setProperty('--snddx', '0px');
  const wr = w.getBoundingClientRect(), tr = tb.getBoundingClientRect(), h = m.offsetHeight, gap = 8;
  const below = () => { m.style.top = (tr.bottom - wr.top + gap) + 'px'; m.style.bottom = 'auto'; };
  const above = () => { m.style.bottom = (wr.bottom - tr.top + gap) + 'px'; m.style.top = 'auto'; };
  const fitB = innerHeight - tr.bottom >= h + gap + 4, fitA = tr.top >= h + gap + 4;
  if (innerWidth <= 760) (fitA || !fitB ? above : below)(); else (fitB || !fitA ? below : above)();
  const r = m.getBoundingClientRect(); let dx = 0;
  if (r.left < 8) dx = 8 - r.left; else if (r.right > innerWidth - 8) dx = innerWidth - 8 - r.right;
  m.style.setProperty('--snddx', Math.round(dx) + 'px');
}
function sndMenu(open){
  const m = document.getElementById('sndMenu'), b = document.getElementById('sndBtn'); if (!m) return;
  m.hidden = !open; b.setAttribute('aria-expanded', String(!!open));
  const bar = document.getElementById('timebar'); if (bar) bar.style.zIndex = open ? '7' : '';
  if (open){ sndSync(); sndPlace(m); }
}
function sndSync(){
  const b = document.getElementById('sndBtn'); if (!b) return;
  const run = auRunning(), st = AS.on ? (run ? 'on' : 'wait') : 'off';
  b.dataset.st = st;
  document.getElementById('sndIco').innerHTML = svgI(st);
  document.getElementById('sndSt').textContent = st === 'on' ? '开 On' : st === 'wait' ? '点按开启 Tap' : '关 Off';
  b.title = st === 'wait' ? '声音：点按恢复 · Sound: tap to resume' : `声音 ${st === 'on' ? '开' : '关'} · Sound ${st === 'on' ? 'on' : 'off'}`; b.setAttribute('aria-label', b.title);
  const m = document.getElementById('sndMenu'); if (!m) return;
  m.classList.toggle('off', !AS.on);
  const sw = document.getElementById('sndOn'); sw.setAttribute('aria-checked', String(AS.on)); sw.querySelector('span').innerHTML = AS.on ? '开 <small>On</small>' : '关 <small>Off</small>';
  const mv = document.getElementById('sndVol'); mv.value = Math.round(AS.master*100); document.getElementById('sndVolO').textContent = mv.value;
  for (const G of AU_GROUPS){ const r = m.querySelector(`.sndrow[data-g="${G.id}"]`); if (!r) continue; const mu = AS.m[G.id];
    r.classList.toggle('muted', mu); const bt = r.querySelector('.sndmute'); bt.setAttribute('aria-pressed', String(mu)); bt.innerHTML = svgI(mu ? 'off' : 'on');
    bt.title = `${mu ? '取消静音' : '静音'} ${G.zh} · ${mu ? 'Unmute' : 'Mute'} ${G.en}`; bt.setAttribute('aria-label', bt.title);
    const s = r.querySelector('input'); s.value = Math.round(AS.g[G.id]*100); r.querySelector('output').textContent = s.value; }
  f1BtnSync();
}
// the F1 HUD's sound button mirrors the F1 group (with the lm20/audio f1d copy)
function f1BtnSync(){ const b = document.getElementById('f1SndB'); if (!b || !(window.SGF1 && 'F1' in window.SGF1)) return; const on = AS.on && !AS.m.f1; const q = b.querySelector('b'); if (q) q.textContent = on ? '声音 开' : '声音 关'; b.setAttribute('aria-pressed', String(on)); }
function sndUI(){
  const bar = document.getElementById('timebar'); if (!bar || document.getElementById('sndBtn')) return;
  if (auBay() || auNyc()){ const g = AU_GROUPS.find(x => x.id === 'f1'); if (g){ g.zh = '驾驶与飞行'; g.en = 'Drive & fly'; } }
  sndCSS();
  const w = document.createElement('div'); w.className = 'sndwrap'; w.id = 'sndWrap';
  w.innerHTML = `<button class="sndbtn" id="sndBtn" type="button" aria-haspopup="true" aria-expanded="false" aria-controls="sndMenu" data-st="off"><span class="sndi" id="sndIco">${svgI('off')}</span><span class="sndt"><b>声音</b><small id="sndSt">关 Off</small></span></button>
<div class="sndmenu off" id="sndMenu" role="dialog" aria-label="声音 Sound" hidden>
  <div class="sndhd"><b>声音</b><small>Sound</small><button type="button" class="sndsw" id="sndOn" role="switch" aria-checked="false" aria-label="声音开关 Sound on/off"><i></i><span>关 <small>Off</small></span></button></div>
  <div class="sndrow mst"><div class="lb"><span>总音量</span><small>Master volume</small></div><input type="range" id="sndVol" min="0" max="100" step="1" aria-label="总音量 Master volume"><output id="sndVolO">80</output></div>
  <div class="sndgrp">${AU_GROUPS.map(G => `<div class="sndrow" data-g="${G.id}"><button type="button" class="sndmute" aria-pressed="false"></button><div class="lb"><span>${G.zh}</span><small>${G.en}</small></div><input type="range" min="0" max="100" step="1" aria-label="${G.zh} ${G.en} 音量 volume"><output>0</output></div>`).join('')}</div>
  <p class="sndnote">全部声音实时合成，随视角与时间变化 · All sounds are synthesised live and follow the view and the time of day</p>
</div>`;
  const wx = document.getElementById('wxWrap'), slider = document.getElementById('tSlider');
  if (wx && wx.parentNode === bar) wx.after(w); else if (slider && slider.parentNode === bar) slider.after(w); else bar.appendChild(w);
  document.getElementById('sndBtn').addEventListener('click', e => {
    e.stopPropagation();
    if (AS.on && !auRunning()){ auEnable(); return; }          // a later visit: one tap resumes
    sndMenu(document.getElementById('sndMenu').hidden);
  });
  document.getElementById('sndOn').addEventListener('click', () => { if (AS.on) auDisable(); else auEnable(); });
  document.getElementById('sndVol').addEventListener('input', e => { AS.master = clamp(e.target.value/100, 0, 1); document.getElementById('sndVolO').textContent = e.target.value; if (LIVE) engineApply(LIVE); asSave(); uiSlideTick(e.target); });
  for (const G of AU_GROUPS){
    const r = document.querySelector(`#sndMenu .sndrow[data-g="${G.id}"]`);
    r.querySelector('input').addEventListener('input', e => { AS.g[G.id] = clamp(e.target.value/100, 0, 1); r.querySelector('output').textContent = e.target.value; if (LIVE) engineApply(LIVE); asSave(); uiSlideTick(e.target); });
    r.querySelector('.sndmute').addEventListener('click', () => { AS.m[G.id] = !AS.m[G.id]; if (LIVE) engineApply(LIVE); asSave(); sndSync(); });
  }
  document.addEventListener('pointerdown', e => { const m = document.getElementById('sndMenu'); if (m && !m.hidden && !e.target.closest('#sndWrap')) sndMenu(false); }, true);
  let w0 = innerWidth; addEventListener('resize', () => { if (innerWidth !== w0){ w0 = innerWidth; sndMenu(false); } });
  document.addEventListener('keydown', e => { const m = document.getElementById('sndMenu'); if (e.key === 'Escape' && m && !m.hidden){ sndMenu(false); document.getElementById('sndBtn').focus(); } });
  // UI sounds: clicks on controls (capture: before the controls act), the brush, placements
  document.addEventListener('click', uiClickEv, true);
  try {
    canvas.addEventListener('pointerdown', e => { UIS.lx = e.clientX; UIS.ly = e.clientY; UIS.lt = performance.now(); UIS.v = 0; const tl = curTool(); UIS.stroke = e.button === 0 && paintTool(tl); if (e.button === 0 && tl === 'landmark' && auRunning()) uiPlace(LIVE); }, {passive:true});
    canvas.addEventListener('pointermove', e => { const now = performance.now(); if (UIS.lt){ const dt = Math.max(1, now - UIS.lt), v = Math.hypot(e.clientX - UIS.lx, e.clientY - UIS.ly)/dt*1000; UIS.v = Math.max(UIS.v*0.7, v); } UIS.lx = e.clientX; UIS.ly = e.clientY; UIS.lt = now; }, {passive:true});
    const up = () => { if (UIS.stroke){ UIS.stroke = false; if (LIVE){ UIS.await = LIVE.T || 0.001; UIS.saw = false; } } };
    canvas.addEventListener('pointerup', up, {passive:true}); canvas.addEventListener('pointercancel', up, {passive:true});
  } catch (e){ /* no canvas (tests) */ }
  sndSync();
}
const UIS = {lx:0, ly:0, lt:0, v:0, stroke:false, await:0, saw:false, slide:new WeakMap()};
const curTool = () => { try { return typeof effectiveTool === 'function' ? effectiveTool() : tool; } catch (e){ return ''; } };
const paintTool = tl => !!tl && tl !== 'road' && tl !== 'elev' && tl !== 'mway' && tl !== 'landmark' && tl !== 'view';
function uiClickEv(e){
  if (!auRunning()) return;
  const el = e.target && e.target.closest ? e.target.closest('button, [role="tab"], [role="menuitemradio"], [role="switch"], input[type="checkbox"], input[type="radio"], select, summary, label') : null;
  if (!el || el.disabled) return;
  if (el.tagName === 'LABEL' && el.querySelector('input')) return;      // the input's own click follows
  const role = el.getAttribute('role'), tab = role === 'tab' || role === 'menuitemradio' || !!el.closest('.seg, .tpre, [role="tablist"]');
  const tog = el.type === 'checkbox' || el.type === 'radio' || role === 'switch';
  uiClick(LIVE, tog ? 'toggle' : tab ? 'tab' : 'btn', tog ? (el.type === 'checkbox' || el.type === 'radio' ? el.checked : el.getAttribute('aria-checked') !== 'true') : true);
}
function uiClick(E, kind, up){
  const c = E.ctx, t = c.currentTime + 0.004, f = kind === 'tab' ? 1250 : kind === 'toggle' ? (up ? 1500 : 1050) : 1750;
  const g = nEnv(E, E.bus.ui, t, 0.0015, 0.2, 0.004, 0.011);
  const o = c.createOscillator(); o.type = 'triangle'; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f*0.6, t + 0.03); o.connect(g); o.start(t); o.stop(t + 0.09);
  const n = nEnv(E, E.bus.ui, t, 0.0005, 0.08, 0.001, 0.003), hp = nFilt(E, 'highpass', 3500, 0.7, n); nSrc(E, E.noise.w, t, 0.03, 1, hp, true);
  if (kind === 'toggle'){ const t2 = t + 0.05, f2 = up ? f*1.33 : f*0.75, g2 = nEnv(E, E.bus.ui, t2, 0.0015, 0.16, 0.004, 0.012); const o2 = c.createOscillator(); o2.type = 'triangle'; o2.frequency.setValueAtTime(f2, t2); o2.frequency.exponentialRampToValueAtTime(f2*0.62, t2 + 0.03); o2.connect(g2); o2.start(t2); o2.stop(t2 + 0.09); }
}
// a quiet tick as a slider passes each tenth (the time slider: each hour)
function uiSlideTick(el){
  if (!auRunning()) return;
  const step = el.id === 'tSlider' ? 1 : 10, v = Math.floor(+el.value/step), last = UIS.slide.get(el);
  UIS.slide.set(el, v); if (last === undefined || last === v) return;
  const E = LIVE, c = E.ctx, t = c.currentTime + 0.003, g = nEnv(E, E.bus.ui, t, 0.001, 0.07, 0.002, 0.006), o = c.createOscillator(); o.type = 'sine'; o.frequency.value = 2400 + (v % 4)*120; o.connect(g); o.start(t); o.stop(t + 0.05);
}
function uiPlace(E){ const c = E.ctx, t = c.currentTime + 0.005, g = nEnv(E, E.bus.ui, t, 0.002, 0.3, 0.01, 0.05), o = c.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(320, t); o.frequency.exponentialRampToValueAtTime(140, t + 0.12); o.connect(g); o.start(t); o.stop(t + 0.35); }
function uiChime(E){
  const c = E.ctx, t = c.currentTime + 0.02, notes = [1318.5, 1661.2, 1975.5];
  notes.forEach((f, i) => { const ts = t + i*0.11, g = nEnv(E, E.bus.ui, ts, 0.004, 0.16 - i*0.02, 0.02, 0.35); nOsc(E, 'sine', f, ts, ts + 1.6, g); const g2 = nGain(E, g, 0.18); nOsc(E, 'sine', f*2.76, ts, ts + 0.6, g2); });
  E.events++;
}
function uiUpdate(E, dt){
  // the brush: a soft scrape while painting zones, louder and brighter with the pointer speed
  let br = 0; try { br = UIS.fake || (typeof painting !== 'undefined' && painting && UIS.stroke && paintTool(curTool())) ? 1 : 0; } catch (e){ br = 0; }
  UIS.v *= Math.exp(-dt*5);
  const sp = clamp(UIS.v/1400, 0, 1);
  bedSet(E, 'brush', br ? 0.05 + 0.28*sp : 0, br ? 0.04 : 0.12);
  if (br) PT(E.beds.brush.bp.frequency, 800 + 1600*sp, E.ctx.currentTime, 0.05);
  // the chime when the repainted tiles have been rebuilt
  if (UIS.await){
    let d = 0; try { d = SGR.dirty ? SGR.dirty.size : 0; } catch (e){ d = 0; }
    if (d > 0) UIS.saw = true;
    else if (UIS.saw){ uiChime(E); UIS.await = 0; }
    else if (E.T - UIS.await > 2) UIS.await = 0;
    if (UIS.await && E.T - UIS.await > 120) UIS.await = 0;
  }
}

/* ---------------------------------------------------------------- [lm24/sound] v27 area soundscapes --------------------------------
   What is around the listener, sampled every 0.5 s (no work while the sound is off):
   - the real buildings (each tile near the listener is summarised once into a 100 m grid of footprint area per kind: flats / condos,
     houses, shops / malls / hotels, offices, industry / sheds, civic / schools / hospitals, places of worship, transport / car parks,
     towers >= 60 m), the land use and land cover rasters (SG.lu / nat), the POIs of the base (malls, markets, parks, worship, stadiums,
     theme parks, beaches ...), a road grid of the expressways / trunk roads and every elevated deck (built in slices once per map:
     distance to a highway, a deck overhead = under a flyover), and small per-city tables (hawker centres / food streets, shopping
     streets, nightlife).
   - from these: weights for a shopping street, a food street / hawker centre, a park, a residential street, industry / port, a
     highway, the waterfront (lapping water), under a deck, nightlife; they crossfade the beds of the 'area' group (街区声景
     Neighbourhoods) and drive events placed in stereo around the listener (door chimes, scanner beeps, wordless vendor calls,
     laughter, buskers, dogs, bicycle bells, joggers, ducks, mahjong tiles, clangs, beepers, expansion joints, a jackhammer ...).
   - everything here fades out from ~20 m to ~260 m above the ground: from high up only the city hum and the wind remain.
   - rain: on leaves (parks), on awnings (shopping / food streets), on water, trickling gutters, layered into the rain bed. */
const AR = {bt:new Map(), tile:2000, tx:28, rg:null, rgSrc:null, rgI:0, rgTmp:null, poi:null, poiSrc:null, bdSrc:null};
const AR_K = 9;             // 0 flats / condos, 1 houses, 2 shops / malls / hotels, 3 offices, 4 industry, 5 civic, 6 worship, 7 transport / car parks, 8 towers
const AR_T = [0, 0, 0, 1, 2, 3, 4, 5, 6, 5, 7, 7, 2, 4, 0, 4];   // building type -> kind (14 foreign context: ignored)
// the 100 m grid of one tile, made when the listener first comes near it (again if its building list grew: small parts load later)
function tileGrid(ti){
  let D = AR.bt.get(ti); const now = performance.now(); if (D && D.chk > now) return D;
  let list = null; try { list = SGR.bldData && SGR.bldData.tiles.get(ti); } catch (e){ list = null; }
  if (!list || !list.length){ if (!D){ D = {G:null, len:0, chk:0}; AR.bt.set(ti, D); } D.chk = now + 5000; return D; }
  if (D && D.len === list.length){ D.chk = now + 10000; return D; }
  const TL = AR.tile, tx = ti % AR.tx, ty = Math.floor(ti/AR.tx), x0 = -AR.tx*TL/2 + tx*TL, y0 = -AR.tx*TL/2 + ty*TL, n = Math.ceil(TL/100), G = new Uint16Array(n*n*AR_K);
  for (const B of list){ if (!B || B.foreign || (B.part && !B.topPart) || B.t === 14) continue; const i = Math.floor((B.cx - x0)/100), j = Math.floor((B.cy - y0)/100); if (i < 0 || j < 0 || i >= n || j >= n) continue;
    const a = (B.area || 100)/2, k = (j*n + i)*AR_K, q = k + AR_T[B.t]; G[q] = Math.min(65535, G[q] + a); if (B.h >= 60) G[k + 8] = Math.min(65535, G[k + 8] + a); }
  D = {G, x0, y0, n, len:list.length, chk:now + 10000}; AR.bt.set(ti, D); return D;
}
// footprint fractions per kind within radius R of (x, y) (o: Float32Array(AR_K)); returns the built fraction
function bldMix(x, y, R, o){
  o.fill(0); let tot = 0, wsum = 0, made = 0;
  try { const B = SGR.bldData; if (B !== AR.bdSrc){ AR.bdSrc = B; AR.bt.clear(); if (B && B.TILE){ AR.tile = B.TILE; AR.tx = B.TX || 28; } } } catch (e){ return 0; }
  const TL = AR.tile, H0 = AR.tx*TL/2;
  const tx0 = Math.floor((x - R + H0)/TL), tx1 = Math.floor((x + R + H0)/TL), ty0 = Math.floor((y - R + H0)/TL), ty1 = Math.floor((y + R + H0)/TL);
  for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++){
    if (tx < 0 || ty < 0 || tx >= AR.tx || ty >= AR.tx) continue;
    const ti = ty*AR.tx + tx; let D = AR.bt.get(ti); if ((!D || D.chk <= performance.now()) && made < 1){ D = tileGrid(ti); made++; }     // at most one new grid per call
    if (!D || !D.G) continue; const n = D.n;
    const i0 = Math.max(0, Math.floor((x - R - D.x0)/100)), i1 = Math.min(n - 1, Math.floor((x + R - D.x0)/100)), j0 = Math.max(0, Math.floor((y - R - D.y0)/100)), j1 = Math.min(n - 1, Math.floor((y + R - D.y0)/100));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++){
      const cx = D.x0 + i*100 + 50, cy = D.y0 + j*100 + 50, d = Math.hypot(cx - x, cy - y); if (d > R + 50) continue;
      const w = 1 - 0.6*Math.min(1, d/(R + 50)), k = (j*n + i)*AR_K; wsum += w*5000;
      for (let q = 0; q < AR_K; q++){ const v = D.G[k + q]*w; o[q] += v; if (q < 8) tot += v; }
    }
  }
  if (wsum > 0){ for (let q = 0; q < AR_K; q++) o[q] /= wsum; return tot/wsum; }
  return 0;
}
// ---- the road grid: expressways / trunk roads (classes 0-3) and every elevated deck, 50 m cells, built in slices
function areaRoadsStep(budget){
  let lines = null; try { lines = SGR.lines; } catch (e){ lines = null; }
  if (!lines || !lines.length) return;
  if (AR.rgSrc !== lines){ AR.rgSrc = lines; AR.rg = null; AR.rgI = 0; AR.rgTmp = {seg:[], map:new Map()}; }
  if (AR.rg) return;
  const t0 = performance.now(), S = AR.rgTmp.seg, M = AR.rgTmp.map; let HALFm = 28000; try { HALFm = HALF; } catch (e){ /* */ }
  const W = Math.ceil(2*HALFm/100);
  while (AR.rgI < lines.length){
    const l = lines[AR.rgI++]; if (!l || (l.flags & 8)) continue;
    const hw = l.c <= 3, el = !!l.E; if (!hw && !el) continue;
    const P = l.P;
    for (let k = 0; k + 3 < P.length; k += 2){
      const za = el ? l.E[k >> 1] : 0, zb = el ? l.E[(k >> 1) + 1] : 0; if (!hw && za < 3 && zb < 3) continue;
      const si = S.length/7; S.push(P[k], P[k + 1], P[k + 2], P[k + 3], za, zb, l.c + (l.flags & 1 ? 32 : 0));
      const c0 = Math.floor((Math.min(P[k], P[k + 2]) - 15 + HALFm)/100), c1 = Math.floor((Math.max(P[k], P[k + 2]) + 15 + HALFm)/100), r0 = Math.floor((Math.min(P[k + 1], P[k + 3]) - 15 + HALFm)/100), r1 = Math.floor((Math.max(P[k + 1], P[k + 3]) + 15 + HALFm)/100);
      for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++){ const key = r*W + c; const a = M.get(key); if (a) a.push(si); else M.set(key, [si]); }
    }
    if ((AR.rgI & 255) === 0 && performance.now() - t0 > budget) return;
  }
  // a compact index: sorted cell keys, offsets into one list of segment ids
  const keys = Int32Array.from(M.keys()).sort(), off = new Int32Array(keys.length + 1); let n = 0; for (let i = 0; i < keys.length; i++){ off[i] = n; n += M.get(keys[i]).length; } off[keys.length] = n;
  const ids = new Int32Array(n); for (let i = 0; i < keys.length; i++) ids.set(M.get(keys[i]), off[i]);
  AR.rg = {seg:new Float32Array(S), keys, off, ids, W, HALF:HALFm}; AR.rgTmp = null;
}
function rgCell(R, key){ const K = R.keys; let lo = 0, hi = K.length - 1; while (lo <= hi){ const m = (lo + hi) >> 1, v = K[m]; if (v === key) return m; if (v < key) lo = m + 1; else hi = m - 1; } return -1; }
// distance to the nearest highway (m), a deck overhead (cover 0-1) and its height above the listener
function roadNear(x, y, alt, o){
  o.dHw = 1e4; o.cover = 0; o.over = 0; o.nHw = 0;
  const R = AR.rg; if (!R) return o;
  const W = R.W, c0 = Math.floor((x + R.HALF)/100), r0 = Math.floor((y + R.HALF)/100), S = R.seg;
  for (let r = r0 - 1; r <= r0 + 1; r++) for (let c = c0 - 1; c <= c0 + 1; c++){
    const ci = rgCell(R, r*W + c); if (ci < 0) continue;
    for (let q = R.off[ci]; q < R.off[ci + 1]; q++){ const b = R.ids[q]*7, ax = S[b], ay = S[b + 1], dx = S[b + 2] - ax, dy = S[b + 3] - ay, L2 = dx*dx + dy*dy || 1;
      const u = clamp(((x - ax)*dx + (y - ay)*dy)/L2, 0, 1), px = ax + dx*u, py = ay + dy*u, d = Math.hypot(x - px, y - py), z = S[b + 4] + (S[b + 5] - S[b + 4])*u, cls = S[b + 6] & 31, one = S[b + 6] & 32, hw = cls <= 1;      // expressways and their links (the traffic voices carry the trunk roads)
      if (hw){ const dd = Math.hypot(d, Math.max(0, z - alt)); if (dd < o.dHw) o.dHw = dd; if (d < 120) o.nHw++; }
      const halfW = (cls <= 1 ? (one ? 7 : 13) : cls <= 3 ? (one ? 5.5 : 10) : cls <= 6 ? 6 : 4) + 3;
      if (z > alt + 2.5 && d < halfW + 10){ const k = 1 - sstep(halfW, halfW + 10, d); if (k > o.cover){ o.cover = k; o.over = z - alt; } }
    }
  }
  return o;
}
// ---- POIs of the base by kind (malls, markets, parks, worship ...)
const POI_K = {mall:'mall', marketplace:'market', park:'park', garden:'park', nature_reserve:'park', place_of_worship:'worship', stadium:'stadium', theme_park:'theme', water_park:'theme', zoo:'zoo', beach:'beach', hotel:'hotel', attraction:'attr', sports_centre:'sport'};
function poiNear(x, y, o){
  let P = null; try { P = SGR.base && SGR.base.pois; } catch (e){ P = null; }
  for (const k in o) o[k] = 1e4;
  if (!P) return o;
  if (AR.poiSrc !== P){ AR.poiSrc = P; AR.poi = P.filter(p => POI_K[p.k]).map(p => [p.x, p.y, POI_K[p.k], p.kd]); }
  for (const p of AR.poi){ const dx = p[0] - x, dy = p[1] - y; if (dx > 900 || dx < -900 || dy > 900 || dy < -900) continue; const d = Math.hypot(dx, dy); if (d < o[p[2]]) o[p[2]] = d; }
  return o;
}
// ---- per-city places (lat, lon, radius m): food (hawker centres, food streets, markets), shops (shopping streets / hubs), nite (nightlife)
const AREA_SG = {
  food:[[1.28063, 103.8504, 80], [1.2803, 103.8447, 55], [1.2825, 103.8431, 65], [1.2795, 103.8467, 45], [1.2853, 103.8457, 50], [1.2850, 103.8325, 55], [1.3120, 103.8395, 70], [1.2895, 103.8562, 55],
    [1.3061, 103.8508, 65], [1.3031, 103.8641, 55], [1.3080, 103.8854, 70], [1.3644, 103.8664, 55], [1.3245, 103.8140, 45], [1.3065, 103.9339, 65], [1.3328, 103.9385, 55], [1.3109, 103.7881, 50],
    [1.2869, 103.8079, 55], [1.3530, 103.9440, 55], [1.3237, 103.8546, 55], [1.3168, 103.8986, 65], [1.3015, 103.8556, 55], [1.2827, 103.8698, 60], [1.2823, 103.8441, 70], [1.3404, 103.7057, 55],
    [1.3726, 103.8935, 55], [1.4291, 103.8354, 55], [1.3500, 103.8487, 55], [1.3330, 103.7422, 55], [1.3196, 103.7642, 50], [1.2770, 103.8432, 45]],
  shop:[[1.3035, 103.8340, 950], [1.2995, 103.8555, 380], [1.3335, 103.7425, 520], [1.3535, 103.9445, 450], [1.3180, 103.8930, 420], [1.2945, 103.8575, 600], [1.2645, 103.8220, 380], [1.3205, 103.8435, 320],
    [1.3505, 103.8720, 320], [1.4360, 103.7865, 380], [1.3505, 103.8485, 260], [1.3695, 103.8480, 320], [1.3325, 103.8475, 320], [1.2915, 103.8495, 300], [1.3008, 103.8455, 260], [1.2840, 103.8435, 300],
    [1.3070, 103.8525, 380], [1.3005, 103.8590, 300], [1.2785, 103.8455, 250], [1.3125, 103.8780, 400]],
  nite:[[1.2906, 103.8465, 220], [1.2869, 103.8492, 160], [1.2914, 103.8395, 170], [1.2795, 103.8435, 140], [1.3115, 103.8780, 400]]};
const AREA_BAY = {
  food:[[37.7941, -122.4078, 260], [37.7524, -122.4155, 320], [37.7955, -122.3937, 90], [37.8080, -122.4177, 160], [37.8065, -122.4320, 80], [37.7854, -122.4294, 130], [37.7998, -122.2700, 220],
    [37.7998, -122.4100, 180], [37.3488, -121.8947, 180], [37.8700, -122.2685, 160], [37.7765, -122.4235, 120]],
  shop:[[37.7880, -122.4075, 330], [37.4433, -122.1714, 220], [37.3256, -121.9457, 220], [37.3209, -121.9480, 200], [37.7841, -122.4070, 260], [37.4447, -122.1615, 260], [37.8045, -122.2710, 260],
    [37.8698, -122.2675, 260], [37.7690, -122.4480, 260], [37.7600, -122.4350, 220], [37.3943, -122.0790, 200]],
  nite:[[37.7980, -122.4070, 260], [37.7610, -122.4200, 300], [37.7860, -122.4130, 200]]};
const AREA_NY = {
  food:[[40.7158, -73.9970, 300], [40.7191, -73.9973, 160], [40.7424, -74.0061, 90], [40.8550, -73.8880, 220], [40.7590, -73.8303, 320], [40.7476, -73.8913, 260], [40.7478, -73.9866, 130],
    [40.7186, -73.9881, 70], [40.6400, -74.0170, 260], [40.7270, -73.9860, 220]],
  shop:[[40.7600, -73.9750, 420], [40.7233, -74.0030, 380], [40.7505, -73.9880, 280], [40.6905, -73.9850, 220], [40.8100, -73.9480, 280], [40.7580, -73.9855, 260], [40.7406, -73.9900, 260],
    [40.7210, -73.9880, 260], [40.7055, -74.0110, 220], [40.8620, -73.8900, 200]],
  nite:[[40.7270, -73.9860, 300], [40.7200, -73.9880, 260], [40.7190, -73.9580, 300], [40.7420, -74.0060, 200]]};
function areaPlaces(){
  if (AR.pl && AR.plCity === (auNyc() ? 'ny' : auBay() ? 'bay' : 'sg')) return AR.pl;
  const T = auNyc() ? AREA_NY : auBay() ? AREA_BAY : AREA_SG, o = {};
  try { for (const k in T) o[k] = T[k].map(p => { const q = sgXY(p[0], p[1]); return [q[0], q[1], p[2]]; }); } catch (e){ return null; }
  AR.pl = o; AR.plCity = auNyc() ? 'ny' : auBay() ? 'bay' : 'sg'; return o;
}
// 0-1: inside (1) to beyond 1.6 r (0) of the nearest place of a list
function placeK(L, x, y){ let k = 0; if (!L) return 0; for (const p of L){ const dx = p[0] - x, dy = p[1] - y; if (Math.abs(dx) > p[2]*1.7 || Math.abs(dy) > p[2]*1.7) continue; const v = 1 - sstep(p[2]*0.6, p[2]*1.6, Math.hypot(dx, dy)); if (v > k) k = v; } return k; }
// ---- the sampler: area weights in E.A
const _bm = new Float32Array(AR_K), _rn = {dHw:1e4, cover:0, over:0, nHw:0}, _pn = {mall:1e4, market:1e4, park:1e4, worship:1e4, stadium:1e4, theme:1e4, zoo:1e4, beach:1e4, hotel:1e4, attr:1e4, sport:1e4};
function areaSample(E){
  const L = E.L, S = E.S, A = E.A || (E.A = {shop:0, food:0, park:0, res:0, ind:0, hw:0, cover:0, lap:0, nite:0, office:0, built:0, worship:0, dHw:1e4, over:0, near:0, tun:0, beach:0, mixT:-9});
  const x = L.wx, y = L.wy;
  const built = bldMix(x, y, 160, _bm), b = _bm;
  roadNear(x, y, L.alt, _rn); poiNear(x, y, _pn);
  const PL = areaPlaces(), food = placeK(PL && PL.food, x, y), shopP = placeK(PL && PL.shop, x, y), nite = placeK(PL && PL.nite, x, y);
  const near = 1 - sstep(20, 260, L.alt);
  // shopping street: shops / malls / hotels around, the commercial land use, malls, shopping hubs
  const shop = clamp(b[2]*3.2 + S.com*0.55 + (1 - sstep(60, 320, _pn.mall))*0.5 + shopP*0.75 + b[3]*0.6, 0, 1);
  const foodK = clamp(food + (1 - sstep(40, 160, _pn.market))*0.9, 0, 1);
  const park = clamp(S.greenNear*1.15 + (S.park + S.forest)*0.8 - S.com*0.4 - built*1.2 + (1 - sstep(80, 300, _pn.park))*0.25, 0, 1);
  let res = clamp((b[0] + b[1]*1.2)*2.6 + S.res*0.6 - shop*0.5, 0, 1);
  // built-up but unclassified (no land-use polygon, small buildings still loading): most likely homes
  if (shop < 0.3 && park < 0.3) res = Math.max(res, clamp((S.urban - S.com - S.ind)*0.5 + built*1.5, 0, 0.6));
  const ind = clamp(b[4]*2.4 + S.ind*0.8 + S.port*0.6 - shop*0.3, 0, 1);
  const hw = (1 - sstep(25, 220, _rn.dHw))*clamp(0.5 + _rn.nHw*0.1, 0.5, 1);
  const lap = Math.max(1 - sstep(10, 90, S.dFresh), (1 - sstep(10, 70, S.dSea))*0.6);
  const a = A.mixT < 0 ? 1 : 0.5, sm = (k, v) => { A[k] += (v - A[k])*a; };
  sm('shop', shop); sm('food', foodK); sm('park', park); sm('res', res); sm('ind', ind); sm('hw', hw); sm('lap', lap); sm('nite', Math.max(nite, shop*0.3)); sm('office', clamp(b[3]*3 + b[8]*2, 0, 1)); sm('built', clamp(built*2, 0, 1));
  sm('worship', 1 - sstep(30, 140, _pn.worship)); sm('beach', clamp(Math.max(S.beach*2.5, 1 - sstep(80, 350, _pn.beach)) - built, 0, 1));
  // below the ground (a road tunnel while driving): fully covered, the tunnel's reverb
  let below = 0; try { below = camera.position.y - L.gnd; } catch (e){ below = 0; }
  A.tun = below < -1.5 ? 1 : 0; if (A.tun) _rn.cover = 1;
  A.cover += (_rn.cover - A.cover)*0.7; A.over = _rn.over; A.dHw = _rn.dHw; A.near = near; A.mixT = E.T;
  A.poi = _pn; A.bm = b;
}
// ---- the beds (group 'area'), the rain layers, attached loops
function mkBeds27(E){
  const c = E.ctx, B = E.beds;
  const bed = (k, group) => { const o = c.createGain(); o.gain.value = 0; B[k] = {out:o, bus:E.bus[group], on:false, zt:0, v:0, att:[]}; return B[k]; };
  const loop = (buf, rate) => { const s = c.createBufferSource(); s.buffer = buf; s.loop = true; s.playbackRate.value = rate || 1; s.start(0, rnd()*buf.duration*0.9); return s; };
  const filt = (type, f, q) => { const b = c.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; return b; };
  const gain = v => { const g = c.createGain(); g.gain.value = v; return g; };
  const chain = (...n) => { for (let i = 0; i < n.length - 1; i++) n[i].connect(n[i + 1]); return n[n.length - 1]; };
  const osc = (f, type, g, dest) => { const o = c.createOscillator(); o.type = type || 'sine'; o.frequency.value = f; const og = gain(g); o.connect(og); og.connect(dest); o.start(); return o; };
  // a bank loop to attach later: [bank key, destination node, playback rate]
  const att = (b, key, dest, rate) => b.att.push({key, dest, rate:rate || 1, src:null});
  // shopping street: two babble loops at different speeds (a wide crowd), footsteps, music heard through the shop doors
  { const b = bed('shop', 'area'); b.lp = filt('lowpass', 4200, 0.5); b.lp.connect(b.out); b.g1 = gain(0.8); b.g1.connect(b.lp); b.g2 = gain(0.6); b.g2.connect(b.lp); b.g3 = gain(0.35); b.g3.connect(b.out);
    b.mus = filt('bandpass', 700, 0.6); b.gm = gain(0); chain(b.mus, b.gm, b.out); b.m0 = gain(1); b.m1 = gain(0); b.m0.connect(b.mus); b.m1.connect(b.mus);
    att(b, 'babble', b.g1, 1); att(b, 'babble', b.g2, 0.93); att(b, 'steps', b.g3, 1); att(b, 'shopmus0', b.m0, 1); att(b, 'shopmus1', b.m1, 1); }
  // food street / hawker centre: chatter and the kitchens
  { const b = bed('food', 'area'); b.lp = filt('lowpass', 5000, 0.5); b.lp.connect(b.out); b.g1 = gain(0.75); b.g1.connect(b.lp); b.g2 = gain(0.9); b.g2.connect(b.out);
    att(b, 'babble', b.g1, 1.05); att(b, 'hawker', b.g2, 1); }
  // park: leaves breathing with the gusts, children at a playground, a far crowd on the lawns
  { const b = bed('park', 'area'); b.am = gain(0.6); chain(loop(E.noise.p, 1.1), filt('highpass', 1800, 0.6), filt('lowpass', 7000, 0.5), b.am, b.out);
    b.kl = filt('lowpass', 3200, 0.5); b.gk = gain(0); chain(b.kl, b.gk, b.out); b.gc = gain(0); b.gc.connect(b.kl); att(b, 'kids', b.kl, 1); att(b, 'babble', b.gc, 0.9); }
  // residential street: a TV / talk murmur through windows, air-conditioner compressors and fans, children in the afternoon
  { const b = bed('res', 'area'); b.tv = filt('bandpass', 520, 0.9); b.g1 = gain(0); chain(b.tv, b.g1, b.out); att(b, 'babble', b.tv, 0.97);
    b.g2 = gain(0); b.g2.connect(b.out); chain(loop(E.noise.p, 0.9), filt('bandpass', 430, 1.2), b.g2); osc(49, 'sine', 0.06, b.g2); osc(98.5, 'sine', 0.035, b.g2); osc(147, 'triangle', 0.012, b.g2);
    b.kl = filt('lowpass', 2600, 0.5); b.g3 = gain(0); chain(b.kl, b.g3, b.out); att(b, 'kids', b.kl, 0.96); }
  // industry / port yard: machine hum, a whine, a press thumping
  { const b = bed('ind', 'area'); b.g1 = gain(0.9); chain(loop(E.noise.b, 0.9), filt('lowpass', 150, 0.8), b.g1, b.out); b.g2 = gain(1); b.g2.connect(b.out);
    osc(50, 'sine', 0.08, b.g2); osc(100, 'sine', 0.05, b.g2); osc(150.5, 'sine', 0.03, b.g2); b.wh = c.createOscillator(); b.wh.frequency.value = 1180; b.gw = gain(0.012); b.wh.connect(b.gw); b.gw.connect(b.out); b.wh.start();
    b.th = gain(0); chain(loop(E.noise.b, 0.6), filt('lowpass', 110, 1.2), b.th, b.out); }
  // highway: tyre roar (passing swells), a hiss, the deck boom under a flyover
  { const b = bed('hw', 'area'); b.g1 = gain(0.8); b.bp = filt('bandpass', 950, 0.55); chain(loop(E.noise.p, 1), b.bp, b.g1, b.out); b.g2 = gain(0.12); chain(loop(E.noise.w), filt('highpass', 3500, 0.6), b.g2, b.out);
    b.g3 = gain(0); chain(loop(E.noise.b, 0.8), filt('lowpass', 140, 1.4), b.g3, b.out); }
  // lapping water by a river, a canal, a marina or a seawall
  { const b = bed('lap', 'area'); b.g1 = gain(0.8); chain(loop(E.noise.b, 1.3), filt('lowpass', 520, 0.9), b.g1, b.out); b.g2 = gain(0.35); b.g2.connect(b.out); b.dl = filt('bandpass', 1400, 0.8); b.dl.connect(b.g2); att(b, 'drops', b.dl, 0.55); }
  // nightlife: muffled bass from the bars, a livelier crowd
  { const b = bed('nite', 'area'); b.lp = filt('lowpass', 260, 0.9); b.g1 = gain(1); chain(b.lp, b.g1, b.out); att(b, 'shopmus0', b.lp, 1); b.g2 = gain(0.6); b.g2.connect(b.out); att(b, 'babble', b.g2, 1.08); }
  // rain variants (the rain bed's extra layers): on leaves, on awnings, on water, trickling gutters
  { const r = B.rain; r.g4 = gain(0); chain(loop(E.noise.p, 1.2), filt('highpass', 2600, 0.6), r.g4, r.out); r.g5 = gain(0); r.aw = filt('bandpass', 760, 1.3); chain(r.aw, r.g5, r.out); att(r.att ? r : Object.assign(r, {att:[]}), 'drops', r.aw, 0.42);
    r.g6 = gain(0); chain(loop(E.noise.w), filt('highpass', 5200, 0.5), r.g6, r.out); r.g7 = gain(0); chain(loop(E.noise.p, 0.8), filt('bandpass', 2200, 3), r.g7, r.out); }
  E.bedLoop27 = loop;
}
function bedsAttach27(E){
  for (const k in E.beds){ const b = E.beds[k]; if (!b.att) continue; for (const a of b.att){ if (a.src || !E.bank[a.key]) continue; a.src = E.bedLoop27(E.bank[a.key], a.rate); a.src.connect(a.dest); } }
}
// ---- time-of-day curves
const win = (h, a, b, e) => sstep(a - e, a, h)*(1 - sstep(b, b + e, h));
// ---- the beds from the weights (every 0.25 s)
function areaUpdate(E){
  const A = E.A; if (!A) return;
  const B = E.beds, t = E.ctx.currentTime, L = E.L, X = E.wx, h = typeof tod === 'number' ? tod : 12, nf = typeof nightF === 'number' ? nightF : 0, sg = !auBay() && !auNyc();
  const near = 1 - sstep(20, 240, L.alt), close = 1 - sstep(10, 120, L.alt), rain = X.rain || 0, snow = X.snow || 0, dry = (1 - 0.65*rain)*(1 - 0.5*snow);
  const real = auReal(); if (!real){ for (const k of ['shop', 'food', 'park', 'res', 'ind', 'hw', 'lap', 'nite']) bedSet(E, k, 0, 0.8); return; }
  // shopping streets: open ~10-22 (Singapore later), busiest in the evening; music only where shops are open
  const open = win(h, 9.6, sg ? 22.2 : 21.2, 0.6), busy = 0.55 + 0.45*win(h, 11.5, 14, 1) + 0.4*win(h, 17.5, 21, 1);
  const shop = A.shop*(1 - 0.6*A.food)*open*busy*dry*near;
  bedSet(E, 'shop', 0.26*shop, 0.9);
  // one shop's music at a time: another door, another song every minute or so
  if (shop > 0.003 && E.T > (E.musT || 0)){ E.musT = E.T + rr(40, 90); E.musI = 1 - (E.musI || 0); PT(B.shop.m0.gain, E.musI ? 0 : 1, t, 2); PT(B.shop.m1.gain, E.musI ? 1 : 0, t, 2); }
  if (shop > 0.003){ PT(B.shop.lp.frequency, lerp(1400, 5200, close), t, 0.6); PT(B.shop.g3.gain, 0.45*close, t, 0.5); PT(B.shop.gm.gain, 0.22*open*(0.4 + 0.6*close), t, 1); PT(B.shop.mus.frequency, rr(500, 1100), t, 2); }
  // hawker centres / food streets: breakfast, lunch, dinner, supper
  const meals = sg ? 0.35 + 0.65*Math.max(win(h, 7, 9, 0.8), win(h, 11.5, 14, 0.8), win(h, 18, 21.5, 0.8)) + 0.2*win(h, 21.5, 24, 1)
    : 0.3 + 0.7*Math.max(win(h, 11.5, 14, 0.8), win(h, 18, 21.5, 0.8));
  const fo = A.food*meals*win(h, sg ? 6 : 8, sg ? 25 : 23, 0.8)*(1 - 0.4*rain)*near;
  bedSet(E, 'food', 0.3*fo, 0.9);
  if (fo > 0.003){ PT(B.food.lp.frequency, lerp(1500, 6000, close), t, 0.6); PT(B.food.g2.gain, 0.8*close + 0.15, t, 0.6); }
  // parks: leaves with the gusts; children at play by day (afternoons most); people on the lawns
  const pk = Math.max(A.park, A.beach*0.8)*near*(1 - 0.75*snow);
  const lv = pk*(0.35 + 0.65*(0.4 + 0.6*E.gust)*(0.5 + 0.8*(X.wind || 0.4)));
  const kids = win(h, 8.5, 19.5, 1)*(0.5 + 0.5*win(h, 16, 19, 1))*(1 - 0.85*rain)*(1 - 0.8*snow);
  bedSet(E, 'park', pk > 0.003 ? 0.17*lv + 0.05*pk*kids*close : 0, 0.9);
  if (pk > 0.003){ PT(B.park.am.gain, rr(0.35, 1), t, 0.35); PT(B.park.gk.gain, 0.9*kids*(1 - sstep(60, 400, A.poi ? A.poi.park : 400)*0.5), t, 1); PT(B.park.gc.gain, (0.25 + 0.5*A.beach)*win(h, 9, 20, 1)*(1 - rain), t, 1); }
  // residential streets: the evening TV murmur, air-conditioning (Singapore: day and night), children after school
  const rs = A.res*(1 - 0.5*A.shop)*near;
  const tv = win(h, 18.5, 23.5, 0.8)*(1 - 0.3*rain), ac = sg ? 0.6 + 0.4*nf : 0.25 + 0.3*win(h, 12, 18, 2), kd = win(h, 15, 19.5, 1)*(1 - 0.9*rain)*(1 - snow);
  bedSet(E, 'res', rs > 0.003 ? rs*(0.12*tv + 0.06*ac + 0.07*kd)*close + 0.02*rs*ac : 0, 1);
  if (rs > 0.003){ PT(B.res.g1.gain, 0.8*tv, t, 1); PT(B.res.g2.gain, 0.9*ac, t, 1); PT(B.res.g3.gain, 0.7*kd, t, 1); }
  // industry: working hours mostly (the port runs round the clock: SGPort / BayPort voices it)
  const id = A.ind*near*(0.35 + 0.65*win(h, 7, 19, 1));
  bedSet(E, 'ind', 0.16*id, 1);
  if (id > 0.003){ PT(B.ind.gw.gain, 0.012*(0.4 + 0.6*E.gust), t, 1); if (!E.pressT || E.T > E.pressT){ E.pressT = E.T + rr(4, 12); const per = rr(0.9, 1.6); for (let k = 0; k < 6; k++){ const tk = t + k*per; B.ind.th.gain.setTargetAtTime(rr(0.6, 1)*(rnd() < 0.5 ? 1 : 0), tk, 0.01); B.ind.th.gain.setTargetAtTime(0, tk + 0.08, 0.06); } } }
  // highways: tyre roar with passing swells; under a deck: the boom
  const R = E.trf || {n250:0}, traffic = auNetVis() ? clamp(0.35 + R.n250/30, 0.35, 1) : 0.3;
  const hwv = Math.max(A.hw, A.cover)*near*(0.35 + 0.65*(1 - nf*0.6))*traffic;
  bedSet(E, 'hw', 0.17*hwv, 0.8);
  if (hwv > 0.003){ PT(B.hw.g1.gain, rr(0.45, 1.05), t, 0.18); PT(B.hw.bp.frequency, (850 + rr(-120, 160))*(1 + 0.5*rain), t, 0.3); PT(B.hw.g2.gain, 0.1 + 0.25*rain, t, 0.5); PT(B.hw.g3.gain, 1.1*A.cover, t, 0.4); }
  // reverb under decks / bridges (the slap of the concrete), a bit more in street canyons
  const space = clamp(A.cover*0.9 + A.tun*0.6 + A.office*0.25*(1 - sstep(30, 150, L.alt)), 0, 1.4);
  if (E.rvOutG) PT(E.rvOutG.gain, 0.55 + 0.75*space, t, 0.6);
  // lapping water (rivers, canals, marinas)
  bedSet(E, 'lap', 0.09*A.lap*(1 - sstep(15, 180, L.alt))*(0.7 + 0.5*E.gust), 0.9);
  if (A.lap > 0.01) PT(B.lap.g1.gain, rr(0.4, 1), t, 0.15);
  // nightlife: bars and clubs after dark
  const nt = A.nite*win(h, 19.5, 26, 1)*near*(1 - 0.5*rain);
  bedSet(E, 'nite', 0.12*nt*(0.3 + 0.7*close), 1);
  // the old street murmur steps back where the crowd beds play
  E.murK = 1 - clamp((shop + fo)*1.5, 0, 0.7);
  // rain layers: on leaves in green places, awnings in shopping / food streets, on the water, in the gutters
  if (rain > 0.001){ const r = B.rain, st = 1 - sstep(25, 260, L.alt);
    PT(r.g4.gain, 0.6*clamp(A.park + S_green(E), 0, 1)*st, t, 1); PT(r.g5.gain, 0.9*clamp(A.shop + A.food + A.res*0.4, 0, 1)*st, t, 1);
    PT(r.g6.gain, 0.5*clamp(E.S.water*1.5 + A.lap, 0, 1)*st, t, 1); PT(r.g7.gain, 0.3*clamp(A.built + A.res, 0, 1)*st*(0.5 + 0.5*rain), t, 1); }
}
const S_green = E => clamp(E.S.green*1.2 + E.S.greenNear, 0, 1);
/* ---- events around the listener (per frame, Poisson rates); one-shot buffers placed in stereo, low-passed with distance */
function areaOne(E, key, d, lvl, group, rate, send, x, y){
  const b = E.bank[key]; if (!b) return null;
  const L = E.L, c = E.ctx; if (x === undefined){ const a = rnd()*TAU; x = L.wx + Math.cos(a)*d; y = L.wy + Math.sin(a)*d; }
  const dd = Math.hypot(d, L.alt), t0 = c.currentTime + rr(0.02, 0.15), g = c.createGain(); g.gain.value = lvl*Math.min(1, 10/Math.max(dd, 1));
  let tail = g; if (dd > 30){ const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = airLP(dd, E.wx.rain > 0.2)*0.8; g.connect(f); tail = f; }
  const out = E.bus[group || 'area'];
  if (c.createStereoPanner){ const p = c.createStereoPanner(); p.pan.value = panOf(E, x, y); tail.connect(p); p.connect(out); if (send) p.connect(nGain(E, E.wbus[group || 'area'], send)); } else { tail.connect(out); if (send) tail.connect(nGain(E, E.wbus[group || 'area'], send)); }
  const s = c.createBufferSource(); s.buffer = b; s.playbackRate.value = rate || rr(0.96, 1.04); s.connect(g); s.start(t0);
  E.events++; return s;
}
// a quick synthesised blip into the area bus (door chimes, scanner beeps, bicycle bells, mahjong tiles)
function areaTone(E, kind, d){
  const c = E.ctx, L = E.L, a = rnd()*TAU, x = L.wx + Math.cos(a)*d, y = L.wy + Math.sin(a)*d, dd = Math.hypot(d, L.alt), t0 = c.currentTime + 0.03;
  const g = c.createGain(); g.gain.value = Math.min(1, 10/Math.max(dd, 1)); let tail = g;
  if (dd > 30){ const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = airLP(dd, false)*0.8; g.connect(f); tail = f; }
  if (c.createStereoPanner){ const p = c.createStereoPanner(); p.pan.value = panOf(E, x, y); tail.connect(p); p.connect(E.bus.area); p.connect(nGain(E, E.wbus.area, 0.2)); } else tail.connect(E.bus.area);
  if (kind === 'door'){ const f0 = pick([659, 698, 784, 880]), sc = pick([[1, 0.8], [1, 1.26], [1, 0.75, 0.6], [1, 1.19, 1.5]]); sc.forEach((r, i) => { const ts = t0 + i*0.32, e = nEnv(E, g, ts, 0.004, 0.16, 0.02, 0.35); nOsc(E, 'sine', f0*r, ts, ts + 1.4, e); nOsc(E, 'sine', f0*r*2.01, ts, ts + 0.5, nGain(E, e, 0.15)); }); }
  else if (kind === 'scan'){ const n = rnd() < 0.3 ? 2 : 1, f = rr(2300, 3100); for (let i = 0; i < n; i++){ const ts = t0 + i*0.16, e = nEnv(E, g, ts, 0.002, 0.07, 0.07, 0.01); nOsc(E, 'square', f, ts, ts + 0.15, nFilt(E, 'lowpass', 5000, 0.7, e)); } }
  else if (kind === 'bike'){ const n = ri(1, 3); for (let i = 0; i < n; i++){ const ts = t0 + i*rr(0.14, 0.2), e = nEnv(E, g, ts, 0.001, 0.22, 0.005, 0.25); for (const [r, v] of [[1, 1], [2.32, 0.5], [3.9, 0.3]]) nOsc(E, 'sine', 3100*r*0.5, ts, ts + 1.2, nGain(E, e, v*0.5)); } }
  else if (kind === 'mahjong'){ let ts = t0; const n = ri(10, 26); for (let i = 0; i < n; i++){ const e = nEnv(E, g, ts, 0.0005, rr(0.03, 0.08), 0.001, 0.006); nOsc(E, 'triangle', rr(2600, 4200), ts, ts + 0.05, e); ts += rr(0.015, 0.09)*(rnd() < 0.15 ? 4 : 1); } }
  else if (kind === 'joint'){ const v = rr(0.6, 1); for (let i = 0; i < 2; i++){ const ts = t0 + i*rr(0.11, 0.16), e = nEnv(E, g, ts, 0.002, 0.5*v, 0.01, 0.05); const o = c.createOscillator(); o.frequency.setValueAtTime(72, ts); o.frequency.exponentialRampToValueAtTime(38, ts + 0.12); o.connect(e); o.start(ts); o.stop(ts + 0.4); nSrc(E, E.noise.b, ts, 0.12, 1, nFilt(E, 'lowpass', 320, 0.7, nGain(E, e, 1.2)), true); } }
  else if (kind === 'hiss') hiss(E, g, t0, rr(0.4, 0.9), 0.25, 2000);
  else if (kind === 'pile'){ let ts = t0; for (let i = 0; i < ri(4, 9); i++){ const e = nEnv(E, g, ts, 0.002, 0.9, 0.01, 0.12); const o = c.createOscillator(); o.frequency.setValueAtTime(95, ts); o.frequency.exponentialRampToValueAtTime(42, ts + 0.2); o.connect(e); o.start(ts); o.stop(ts + 0.8); nSrc(E, E.noise.p, ts, 0.06, 1, nFilt(E, 'bandpass', 1400, 1.2, nGain(E, e, 0.8)), true); ts += rr(1.1, 1.5); } }
  E.events++;
}
// a busker staying a while at a spot near the listener (shopping streets, squares): phrases of one instrument with pauses
function buskUpdate(E, dt, k){
  const L = E.L, Bk = E.busk;
  if (Bk && (E.T > Bk.until || Math.hypot(Bk.x - L.wx, Bk.y - L.wy) > 160 || k < 0.05)){ E.busk = null; return; }
  if (!Bk){ if (k > 0.15 && rnd() < 0.02*k*dt){ const a = rnd()*TAU, d = rr(20, 55); E.busk = {x:L.wx + Math.cos(a)*d, y:L.wy + Math.sin(a)*d, until:E.T + rr(60, 150), next:E.T + 0.5, key:'busk' + ri(0, 3)}; bankWant(E, E.busk.key); bankWant(E, 'applause'); } return; }
  if (E.T >= Bk.next){ const d = Math.hypot(Bk.x - L.wx, Bk.y - L.wy); const s = areaOne(E, Bk.key, d, 0.55, 'area', 1, 0.25, Bk.x, Bk.y); Bk.next = E.T + (s ? 8 + rr(1.5, 6) : 2); if (s && rnd() < 0.2) areaOne(E, 'applause', d + 5, 0.12, 'area', 1, 0.2, Bk.x, Bk.y); }
}
// a jogger running past: the running-steps loop panned across over a few seconds
function jogger(E){
  const b = E.bank.run; if (!b) return; const c = E.ctx, t0 = c.currentTime + 0.05, T = rr(5, 8), d = rr(4, 14), g = c.createGain(); g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(0.25*Math.min(1, 6/d), t0 + T*0.5); g.gain.linearRampToValueAtTime(0, t0 + T);
  const p = c.createStereoPanner ? c.createStereoPanner() : null, dir = rnd() < 0.5 ? -1 : 1; let tail = g; if (p){ p.pan.setValueAtTime(-0.85*dir, t0); p.pan.linearRampToValueAtTime(0.85*dir, t0 + T); g.connect(p); tail = p; }
  tail.connect(E.bus.area); const s = c.createBufferSource(); s.buffer = b; s.loop = true; s.playbackRate.value = rr(0.95, 1.08); s.connect(g); s.start(t0); s.stop(t0 + T + 0.1); E.events++;
}
function areaEvents(E, dt){
  const A = E.A; if (!A || !auReal()) return;
  const L = E.L, X = E.wx, h = typeof tod === 'number' ? tod : 12, nf = typeof nightF === 'number' ? nightF : 0, sg = !auBay() && !auNyc(), ny = auNyc();
  const near = 1 - sstep(15, 200, L.alt); if (near < 0.02){ E.busk = null; return; }
  const rain = X.rain || 0, dry = 1 - 0.8*rain, day = 1 - nf, ev = (rate) => rnd() < rate*dt*near, D = (a, b) => rr(a, b) + L.alt*0.4;
  const open = win(h, 9.6, sg ? 22.2 : 21.2, 0.6), shop = A.shop*open*dry, food = A.food*win(h, 6.5, 24, 1)*dry, park = A.park*dry, res = A.res, ind = A.ind*win(h, 7, 19, 1);
  // shopping streets
  if (ev(0.09*shop)) areaTone(E, 'door', D(6, 35));
  if (ev(0.12*shop*(1 - 0.7*A.office))) areaTone(E, 'scan', D(5, 18));
  if (ev(0.035*(shop*0.6 + food))) areaOne(E, 'call' + ri(0, 1), D(15, 60), 0.35, 'area', rr(0.95, 1.05), 0.2);
  if (ev(0.05*(shop + food + A.nite*win(h, 19, 25, 1)))) areaOne(E, 'laugh', D(6, 30), 0.3, 'area', rr(0.92, 1.08), 0.15);
  buskUpdate(E, dt, (shop*(1 - 0.5*A.office) + park*0.4)*win(h, 10.5, 22, 1)*dry);
  // parks
  if (ev(0.03*(park + res*0.5)*win(h, 6, 22, 1))) areaOne(E, rnd() < 0.6 ? 'dog' + ri(0, 1) : 'yap' + ri(0, 1), D(25, 110), 0.4, 'area');
  if (ev(0.03*park*win(h, 6.5, 20, 1)*(1 - (X.snow || 0)))) areaTone(E, 'bike', D(6, 30));
  if (ev(0.035*park*(0.4 + win(h, 6, 8.5, 0.5) + win(h, 17, 20, 0.5))*(1 - (X.snow || 0)))) jogger(E);
  if (ev(0.05*(1 - sstep(30, 180, E.S.dFresh))*win(h, 6, 19.5, 1)*(park + 0.3))) areaOne(E, (rnd() < 0.6 ? 'duck' : 'goose') + ri(0, 1), D(20, 90), 0.4, 'area');
  // residential: dogs, mahjong tiles from a void deck or an open window (Singapore, evenings), a door
  if (ev(0.02*res*win(h, 7, 23, 1))) areaOne(E, rnd() < 0.5 ? 'dog' + ri(0, 1) : 'yap' + ri(0, 1), D(30, 140), 0.35, 'area');
  if (sg && ev(0.025*res*win(h, 19.5, 25, 1))) areaTone(E, 'mahjong', D(15, 50));
  // industry / port yards
  if (ev(0.12*ind) && E.bank.clang0) areaOne(E, 'clang' + ri(0, 1), D(30, 160), 0.5, 'area', rr(0.85, 1.15), 0.25);
  if (ev(0.035*ind) && E.bank.reverse) areaOne(E, 'reverse', D(30, 120), 0.3, 'area', 1, 0.2);
  if (ev(0.04*ind)) areaTone(E, 'hiss', D(20, 90));
  // highways: expansion joints (louder and more often under a deck)
  const R = E.trf || {n250:0};
  if (ev((0.25*A.hw + 1.1*A.cover)*clamp(0.3 + R.n250/25, 0.3, 1.2)*(1 - 0.6*nf))) areaTone(E, 'joint', A.cover > 0.3 ? rr(5, 25) : D(20, 120));
  // construction (weekday working hours): a jackhammer, a pile driver
  const bld = clamp(A.built + A.res*0.5 + A.office, 0, 1)*win(h, 8, 18, 0.5)*(1 - A.park);
  if (ev((ny ? 0.012 : sg ? 0.008 : 0.005)*bld)) areaOne(E, 'jack', D(60, 260), 0.45, 'area', rr(0.9, 1.1), 0.3);
  if (ev(0.002*bld)) areaTone(E, 'pile', D(150, 450));
}
/* ---------------------------------------------------------------- [lm24/sound] v27 landmark ambiences --------------------------------
   Positional voices (pool kind 'lm', 3 at most, group 'lm' 地标 Landmarks) for the landmarks near the listener: every 0.5 s the
   table of the current city is scored (level x schedule x distance inside the audible radius) and the best three get a voice at the
   landmark (its SG_PLACES / LANDMARKS position when the model is placed, else the coordinates below). A voice is a small graph built
   from layers: filtered noise (water, wind, roar), loops from the bank (crowds, music, kitchens, flags, hooves), tones (hums),
   timed one-shots (bells, gongs, barks, horns, screams, applause) and a few special makers (roller-coaster runs, ballpark game
   events, light-show water jets, a carillon at set hours). Schedules follow the clock (tod): light shows at their show times,
   ballparks on game nights, rides while the parks are open, carillons on the hour. Respectful places stay simple (the mosque's
   courtyard: water, doves, a soft murmur, no call to prayer; the 9/11 Memorial: water only). */
const LMS = {
  always: () => 1,
  day: h => win(h, 7, 19.5, 0.8),
  open: h => win(h, 10, 21.5, 0.5),
  park: h => win(h, 10, 19, 0.5),
  eve: h => win(h, 17, 23.5, 0.8),
  late: h => win(h, 10, 23, 0.8),
  night: h => nightOf(h),
  dusk: h => win(h, 18.5, 23, 0.6),
  gr: h => Math.max(win(h, 19.75, 20.0, 0.03), win(h, 20.75, 21.0, 0.03)),             // Garden Rhapsody 19:45 / 20:45
  spectra: h => Math.max(win(h, 20, 20.25, 0.03), win(h, 21, 21.25, 0.03), win(h, 22, 22.25, 0.03)),
  vortex: h => Math.max(win(h, 20, 20.15, 0.02), win(h, 21, 21.15, 0.02), win(h, 22, 22.15, 0.02), win(h, 23, 23.15, 0.02)),
  game: h => win(h, 19.1, 22.4, 0.3),
  rink: h => win(h, 9, 23, 0.5),
  bell: h => Math.max(win(h, 7.8, 8.05, 0.02), win(h, 12, 12.2, 0.02), win(h, 18, 18.25, 0.02)),
  hour: h => { const f = h - Math.floor(h); return f < 0.05 && h > 7.5 && h < 21.5 ? 1 : 0; },
  nyse: h => Math.max(win(h, 9.48, 9.52, 0.005), win(h, 15.98, 16.02, 0.005)),
  wknd: h => win(h, 12, 18.5, 0.7),
  station: h => win(h, 5.5, 25.5, 0.5)
};
/* layers: ['n', colour 'w'|'p'|'b', filter type, f, Q, gain, AM depth, schedule]   noise
           ['l', bank key, gain, playback rate, schedule, filter [type, f, Q]?]     loop
           ['e', [bank keys], gain, period [min, max] s, rate [min, max], schedule, burst [n min, n max, gap s]]   one-shots
           ['o', [freqs], type, gain, schedule, AM [rate, depth]?]                     tones
           ['x', maker name, gain, schedule]                                          special makers (LMX)
   a landmark: [name, lat, lon, height m, audible radius m, level, schedule, layers, SG_PLACES / LANDMARKS keys to snap to] */
const N_FOUNT = s => [['n', 'w', 'bandpass', 1500, 0.45, 0.55*s, 0.25], ['n', 'p', 'lowpass', 900, 0.6, 0.6*s, 0.2], ['l', 'drops', 0.5*s, 1.25]];
const N_FALL = (s, indoor) => [['n', 'p', 'lowpass', indoor ? 1100 : 2200, 0.5, 0.9*s, 0.12], ['n', 'b', 'lowpass', 320, 0.7, 0.9*s, 0.1], ['n', 'w', 'highpass', 3200, 0.5, 0.12*s, 0.2]];
const N_CROWD = (g, rate, sch) => [['l', 'babble', g, rate || 1, sch], ['l', 'babble', g*0.7, (rate || 1)*0.94, sch]];
const N_BUSK = (g, sch) => [['e', ['busk0', 'busk1', 'busk2', 'busk3'], g, [10, 16], [1, 1], sch], ['e', ['applause'], g*0.25, [40, 90], [0.95, 1.05], sch]];
const LM_SG = [
  ['Merlion fountain', 1.28681, 103.85445, 3, 230, 1.0, 'always', [...N_FOUNT(1.3), ...N_CROWD(0.35, 1, 'day')], ['merlion']],
  ['Supertree Grove', 1.2816, 103.8636, 8, 420, 1.0, 'always', [['l', 'show', 1.0, 1, 'gr'], ...N_CROWD(0.3, 1, 'eve'), ['l', 'kids', 0.15, 1, 'park'], ['e', ['applause'], 0.4, [40, 60], [1, 1], 'gr']], []],
  ['Cloud Forest waterfall', 1.2840, 103.8657, 10, 190, 0.9, 'always', [...N_FALL(0.9, true), ...N_CROWD(0.2, 1, 'open')], []],
  ['Spectra show', 1.2850, 103.8590, 2, 450, 1.1, 'always', [['l', 'show', 1.1, 0.97, 'spectra'], ['x', 'jets', 0.6, 'spectra'], ...N_CROWD(0.35, 1, 'eve'), ['e', ['applause'], 0.5, [50, 70], [1, 1], 'spectra']], []],
  ['Esplanade buskers', 1.2897, 103.8558, 2, 260, 0.9, 'always', [...N_BUSK(0.7, 'eve'), ...N_CROWD(0.3, 1, 'eve'), ['n', 'b', 'lowpass', 420, 0.8, 0.25, 0.5]], ['esplanade']],
  ['Buddha Tooth Relic Temple', 1.28149, 103.84423, 6, 200, 0.9, 'always', [['l', 'chant', 0.45, 1, 'day'], ['e', ['tbell'], 0.6, [25, 50], [0.98, 1.02], 'day'], ['e', ['gong'], 0.35, [30, 70], [0.6, 0.7], 'day'], ['e', ['bell'], 0.2, [12, 30], [0.5, 0.56], 'day'], ...N_CROWD(0.15, 1, 'day')], ['buddhatooth']],
  ['Thian Hock Keng', 1.28105, 103.84753, 4, 150, 0.8, 'always', [['e', ['tbell'], 0.5, [35, 70], [1.15, 1.25], 'day'], ['e', ['gong'], 0.3, [40, 80], [0.75, 0.8], 'day'], ['n', 'p', 'bandpass', 2600, 2, 0.05, 0.6], ...N_CROWD(0.12, 0.95, 'day')], ['thianhockkeng']],
  ['Sri Mariamman Temple', 1.28268, 103.84521, 4, 160, 0.85, 'always', [['e', ['hbell'], 0.4, [14, 30], [0.95, 1.05], 'day', [1, 2, 3]], ['x', 'drum', 0.35, 'day'], ...N_CROWD(0.15, 1, 'day')], ['mariamman']],
  ['Sultan Mosque courtyard', 1.302225, 103.858989, 2, 160, 0.75, 'always', [['n', 'p', 'bandpass', 2400, 1.6, 0.12, 0.5], ['l', 'drops', 0.3, 0.8], ['e', ['dove0', 'dove1'], 0.35, [8, 20], [0.95, 1.05], 'day'], ...N_CROWD(0.12, 0.96, 'day')], ['sultanmosque']],
  ['Jewel Rain Vortex', 1.360222, 103.98975, 20, 280, 1.1, 'always', [...N_FALL(1.4, true), ['l', 'show', 0.7, 1.03, 'vortex'], ...N_CROWD(0.3, 1, 'late')], ['jewel']],
  ['Universal Studios', 1.2540, 103.8238, 8, 520, 1.1, 'open', [['x', 'coaster', 1, 'open'], ['l', 'carousel', 0.35, 1.02, 'open'], ...N_CROWD(0.45, 1, 'open'), ['l', 'kids', 0.25, 1, 'open']], []],
  ['F1 pit building', 1.2914, 103.8640, 4, 260, 0.7, 'day', [['x', 'wrench', 0.6, 'day'], ['o', [100, 200, 300], 'sine', 0.04, 'day'], ['n', 'b', 'lowpass', 160, 0.8, 0.3, 0.3], ['e', ['chime0', 'chime1', 'chime2'], 0.2, [40, 90], [1, 1], 'day', [3, 3, 0.42, 'seq']]], []],
  ['Lau Pa Sat satay street', 1.28063, 103.8504, 4, 200, 0.9, 'always', [['l', 'hawker', 0.8, 1, 'late'], ...N_CROWD(0.5, 1.04, 'late'), ['n', 'w', 'highpass', 3000, 0.6, 0.12, 0.5, 'eve']], ['lauPaSat']],
  ['Newton Food Centre', 1.3120, 103.8395, 4, 170, 0.85, 'always', [['l', 'hawker', 0.8, 0.97, 'late'], ...N_CROWD(0.45, 1, 'late'), ['e', ['call0', 'call1'], 0.4, [12, 30], [0.95, 1.05], 'late']], []],
  ['Orchard Road', 1.3036, 103.8320, 3, 380, 0.95, 'open', [...N_CROWD(0.7, 1, 'open'), ['l', 'steps', 0.4, 1, 'open'], ...N_BUSK(0.55, 'open')], ['ionorchard']],
  ['Singapore Flyer', 1.28940, 103.86323, 30, 260, 0.75, 'always', [['n', 'b', 'lowpass', 130, 1, 0.5, 0.15], ['o', [60, 120.4], 'sine', 0.05, 'always', [0.2, 0.3]], ['e', ['creak'], 0.25, [10, 25], [0.5, 0.7], 'always'], ...N_CROWD(0.2, 1, 'late')], ['flyer']],
  ['Clarke Quay nights', 1.2906, 103.8465, 3, 260, 0.9, 'always', [['l', 'shopmus0', 0.5, 1, 'eve', ['lowpass', 300, 0.9]], ['l', 'shopmus1', 0.1, 1.06, 'eve', ['bandpass', 900, 0.7]], ...N_CROWD(0.55, 1.06, 'eve'), ['e', ['laugh'], 0.4, [5, 14], [0.9, 1.1], 'eve']], []],
  ['National Stadium', 1.30444, 103.87435, 30, 600, 1.0, 'game', [['x', 'stadium', 1, 'game']], ['sportshub']],
  ['Singapore Zoo', 1.4043, 103.7930, 8, 600, 1.0, 'day', [['e', ['gibbon0', 'gibbon1'], 0.6, [25, 60], [0.95, 1.05], 'day'], ['e', ['koel0', 'koel1'], 0.4, [12, 30], [1, 1], 'day'], ...N_CROWD(0.25, 1, 'park'), ['l', 'kids', 0.2, 1, 'park']], []],
  ['Night Safari', 1.4021, 103.7880, 8, 500, 0.9, 'night', [['l', 'insects', 0.5, 1, 'night'], ['e', ['bullfrog0', 'tokfrog0', 'nightjar0'], 0.4, [6, 15], [0.95, 1.05], 'night'], ['e', ['gibbon0'], 0.3, [60, 140], [0.9, 1], 'night'], ...N_CROWD(0.12, 0.95, 'dusk')], []],
  ['Marina Barrage', 1.280943, 103.871976, 4, 300, 0.75, 'always', [['n', 'p', 'bandpass', 500, 0.7, 0.35, 0.5], ['n', 'b', 'lowpass', 260, 0.7, 0.4, 0.2], ['l', 'kids', 0.25, 1, 'park'], ...N_CROWD(0.2, 1, 'park')], ['barrage']],
  ['Raffles Hotel courtyard', 1.295263, 103.854371, 3, 140, 0.7, 'always', [...N_FOUNT(0.5), ['e', ['piano'], 0.35, [12, 20], [1, 1], 'eve'], ...N_CROWD(0.15, 0.97, 'late')], ['raffleshotel']],
  ['Botanic Gardens Swan Lake', 1.3095, 103.8155, 2, 260, 0.7, 'always', [['e', ['goose0', 'goose1', 'duck0'], 0.4, [10, 30], [0.95, 1.05], 'day'], ['e', ['koel0', 'oriole0', 'bulbul0'], 0.45, [6, 16], [1, 1], 'day'], ['l', 'drops', 0.2, 0.6], ...N_CROWD(0.15, 1, 'park')], []]
];
const LM_BAY = [
  ['Golden Gate Bridge', 37.8199, -122.4783, 67, 900, 1.0, 'always', [['x', 'ggsing', 0.8, 'always'], ['n', 'b', 'lowpass', 220, 0.8, 0.6, 0.2], ['n', 'p', 'bandpass', 700, 0.7, 0.4, 0.5]], ['ggbridge']],
  ['Powell St turntable', 37.7849, -122.4078, 2, 220, 0.9, 'always', [...N_CROWD(0.55, 1, 'late'), ...N_BUSK(0.6, 'late'), ['e', ['bell'], 0.5, [8, 20], [0.98, 1.02], 'late', [3, 7, 0.16]]], []],
  ['Cable Car Barn', 37.7946, -122.4115, 3, 200, 0.9, 'day', [['n', 'b', 'lowpass', 170, 1.2, 0.8, 0.1], ['n', 'p', 'bandpass', 380, 3, 0.35, 0.2], ['o', [31.5, 63, 94.5], 'sine', 0.08, 'always'], ['l', 'hooves', 0.0, 1]], []],
  ['Pier 39 sea lions', 37.8100, -122.4105, 2, 320, 1.0, 'always', [['e', ['sealion0', 'sealion1'], 0.8, [2, 6], [0.92, 1.08], 'always', [1, 3, 0.6]], ['e', ['gull0', 'gull1'], 0.45, [5, 14], [0.95, 1.05], 'day'], ['l', 'carousel', 0.18, 1, 'open'], ...N_CROWD(0.35, 1, 'late'), ['n', 'b', 'lowpass', 420, 0.8, 0.3, 0.5]], ['pier39c', 'pier39']],
  ["Fisherman's Wharf", 37.8080, -122.4177, 2, 280, 0.9, 'always', [['e', ['gull0', 'gull1'], 0.5, [4, 10], [0.95, 1.05], 'day'], ['x', 'rigging', 0.5, 'always'], ['o', [37, 74, 111], 'sawtooth', 0.012, 'day', [0.7, 0.4]], ...N_CROWD(0.4, 1, 'late'), ['l', 'hawker', 0.25, 0.9, 'late'], ['n', 'b', 'lowpass', 450, 0.8, 0.3, 0.5]], []],
  ['Oracle Park', 37.7786, -122.3893, 25, 700, 1.0, 'game', [['x', 'ballgame', 1, 'game']], ['oraclepark']],
  ['Chase Center plaza', 37.7680, -122.3877, 5, 260, 0.7, 'eve', [...N_CROWD(0.45, 1.02, 'eve'), ['l', 'shopmus0', 0.2, 1, 'eve', ['lowpass', 400, 0.8]]], ['chasecenter']],
  ['Stanford Main Quad', 37.4275, -122.1697, 3, 320, 0.8, 'always', [...N_FOUNT(0.7), ...N_CROWD(0.3, 1, 'day'), ['e', ['carillon'], 0.6, [12, 14], [1, 1], 'hour'], ['x', 'bikes', 0.6, 'day']], []],
  ['Alcatraz', 37.8267, -122.4230, 10, 650, 0.9, 'always', [['x', 'surf', 0.9, 'always'], ['e', ['gull0', 'gull1'], 0.45, [4, 12], [0.95, 1.05], 'day'], ['x', 'buoy', 0.5, 'always'], ['n', 'p', 'bandpass', 600, 0.6, 0.3, 0.6]], ['alcatraz']],
  ['Embarcadero BART vents', 37.7929, -122.3971, 2, 160, 0.8, 'day', [['x', 'bart', 0.8, 'late']], []],
  ['Ferry Building', 37.7955, -122.3937, 4, 300, 0.9, 'always', [...N_CROWD(0.45, 1, 'day'), ['e', ['carillon'], 0.5, [12, 14], [1.05, 1.05], 'hour'], ['e', ['gull0', 'gull1'], 0.35, [6, 16], [1, 1], 'day'], ['l', 'hawker', 0.15, 0.9, 'day']], ['ferrybuilding']],
  ['Telegraph Hill parrots', 37.8024, -122.4058, 60, 280, 0.8, 'day', [['e', ['parrot0', 'parrot1'], 0.6, [3, 9], [0.9, 1.1], 'day', [1, 3, 0.5]], ['n', 'p', 'bandpass', 500, 0.6, 0.25, 0.6]], ['coittower']],
  ['Palace of Fine Arts', 37.8029, -122.4484, 3, 280, 0.75, 'always', [['e', ['duck0', 'duck1', 'goose0', 'goose1'], 0.45, [6, 16], [0.95, 1.05], 'day'], ['l', 'drops', 0.25, 0.7], ...N_CROWD(0.2, 1, 'park'), ...N_BUSK(0.35, 'wknd')], ['palacefa']],
  ['Golden Gate Park drum circle', 37.7700, -122.4560, 2, 260, 0.85, 'wknd', [['l', 'drums', 0.8, 1, 'wknd'], ...N_CROWD(0.3, 1, 'wknd')], []],
  ['Grant Avenue', 37.7941, -122.4064, 2, 240, 0.85, 'late', [...N_CROWD(0.55, 1.02, 'late'), ['x', 'mahjong', 0.4, 'late'], ['l', 'busk2', 0.0, 1]], []],
  ['Lake Merritt', 37.8030, -122.2580, 2, 450, 0.75, 'always', [['e', ['goose0', 'goose1', 'duck0', 'duck1'], 0.5, [5, 14], [0.95, 1.05], 'day'], ['x', 'joggers', 0.5, 'day'], ['l', 'drops', 0.2, 0.6]], ['lakemerritt']],
  ['Sather Tower', 37.8721, -122.2578, 30, 450, 0.85, 'always', [['e', ['carillon'], 0.8, [11, 12], [0.95, 0.95], 'bell'], ['e', ['carillon'], 0.6, [12, 14], [0.95, 0.95], 'hour'], ...N_CROWD(0.25, 1, 'day'), ['x', 'bikes', 0.5, 'day']], []],
  ['Ocean Beach surf', 37.7600, -122.5110, 2, 700, 1.0, 'always', [['x', 'surf', 1.3, 'always'], ['n', 'p', 'bandpass', 500, 0.6, 0.35, 0.6]], []]
];
const LM_NY = [
  ['Times Square', 40.7580, -73.9855, 5, 380, 1.1, 'always', [...N_CROWD(0.85, 1.03, 'always'), ['o', [120, 240, 360], 'sawtooth', 0.006, 'always'], ['o', [9800], 'sine', 0.004, 'always'], ['x', 'honks', 0.8, 'always'], ['x', 'sirens', 1, 'always'], ['l', 'show', 0.18, 1.06, 'always', ['bandpass', 900, 0.5]], ...N_BUSK(0.5, 'late'), ['l', 'steps', 0.4, 1.05]], ['nytimessq', 'nytkts']],
  ['Bethesda Fountain', 40.7740, -73.9712, 3, 260, 0.95, 'always', [...N_FOUNT(1.0), ...N_BUSK(0.6, 'park'), ...N_CROWD(0.3, 1, 'day')], []],
  ['Central Park carriages', 40.7663, -73.9757, 2, 200, 0.8, 'day', [['x', 'carriage', 0.8, 'day'], ...N_CROWD(0.2, 1, 'day')], []],
  ['Coney Island', 40.5745, -73.9780, 15, 650, 1.1, 'open', [['x', 'coaster', 1, 'open'], ['l', 'carousel', 0.4, 1, 'open'], ...N_CROWD(0.5, 1.02, 'open'), ['l', 'kids', 0.25, 1, 'open'], ['e', ['gull0', 'gull1'], 0.4, [5, 12], [1, 1], 'day'], ['e', ['creak'], 0.3, [8, 18], [0.6, 0.8], 'open']], ['nyconey', 'nyconeycyc']],
  ['Yankee Stadium', 40.8296, -73.9262, 25, 750, 1.0, 'game', [['x', 'ballgame', 1, 'game']], ['nyyankee']],
  ['Citi Field', 40.7571, -73.8458, 25, 750, 1.0, 'game', [['x', 'ballgame', 1, 'game']], ['nycitifield']],
  ['Grand Central concourse', 40.7527, -73.9772, 12, 170, 0.9, 'station', [...N_CROWD(0.7, 0.98, 'station'), ['l', 'steps', 0.6, 1, 'station'], ['e', ['chime0', 'chime1', 'chime2'], 0.35, [25, 60], [1, 1], 'station', [3, 3, 0.42, 'seq']]], ['nygrandcentral']],
  ['Brooklyn Bridge', 40.7061, -73.9969, 40, 600, 1.0, 'always', [['x', 'ggsing', 0.45, 'always'], ['n', 'b', 'lowpass', 220, 0.8, 0.6, 0.2], ['n', 'p', 'bandpass', 800, 0.7, 0.4, 0.5], ['l', 'steps', 0.35, 0.9, 'day', ['bandpass', 600, 1.2]], ['x', 'bikes', 0.5, 'day']], ['nybrooklynbridge']],
  ['Statue of Liberty ferries', 40.6900, -74.0430, 6, 650, 0.95, 'always', [['x', 'ferry', 0.9, 'day'], ['e', ['gull0', 'gull1'], 0.4, [5, 14], [1, 1], 'day'], ['n', 'b', 'lowpass', 450, 0.8, 0.35, 0.5], ...N_CROWD(0.3, 1, 'open')], ['nyliberty']],
  ['Battery ferry slips', 40.7013, -74.0130, 4, 380, 0.85, 'always', [['x', 'ferry', 1, 'late'], ['e', ['gull0', 'gull1'], 0.35, [6, 16], [1, 1], 'day'], ...N_CROWD(0.35, 1, 'late')], ['nywhitehall']],
  ['Wall Street', 40.7069, -74.0113, 4, 220, 0.85, 'always', [...N_CROWD(0.5, 1.02, 'day'), ['l', 'steps', 0.5, 1.08, 'day'], ['x', 'nysebell', 0.9, 'always']], ['nynyse', 'nywallst']],
  ['Rockefeller rink', 40.7587, -73.9787, 2, 200, 0.9, 'rink', [['x', 'skates', 0.7, 'rink'], ['l', 'carousel', 0.25, 0.92, 'rink', ['lowpass', 2500, 0.6]], ...N_CROWD(0.35, 1, 'rink')], ['nyrockefeller']],
  ['High Line', 40.7480, -74.0048, 9, 260, 0.75, 'day', [['l', 'steps', 0.55, 0.97, 'day'], ...N_CROWD(0.25, 1, 'day'), ['e', ['amrobin0', 'cardinal0', 'hsparrow0'], 0.35, [6, 15], [1, 1], 'day']], ['nyhighlinespur'],
    [[40.7398, -74.0081], [40.7440, -74.0068], [40.7480, -74.0048], [40.7500, -74.0040], [40.7520, -74.0018], [40.7539, -74.0016]]],
  ['UN flag row', 40.7500, -73.9680, 6, 220, 0.85, 'always', [['l', 'flags', 0.8, 1, 'always'], ['e', ['ping'], 0.3, [2, 6], [0.9, 1.1], 'always', [1, 3, 0.35]], ['n', 'p', 'bandpass', 600, 0.6, 0.25, 0.6]], ['nyunflags']],
  ['9/11 Memorial pools', 40.7115, -74.0134, 0, 220, 0.9, 'always', [...N_FALL(1.3, false), ['n', 'b', 'lowpass', 220, 0.7, 0.4, 0.05]], ['nymemorial']],
  ['Washington Square', 40.7308, -73.9973, 2, 260, 0.9, 'always', [...N_FOUNT(0.8), ...N_BUSK(0.65, 'late'), ...N_CROWD(0.4, 1, 'late'), ['x', 'bikes', 0.4, 'day']], []],
  ['Bryant Park carousel', 40.7536, -73.9832, 2, 200, 0.8, 'park', [['l', 'carousel', 0.45, 1, 'park'], ...N_CROWD(0.35, 1, 'late'), ['l', 'kids', 0.2, 1, 'park']], []],
  ['Unisphere fountain', 40.7465, -73.8452, 3, 260, 0.85, 'always', [...N_FOUNT(1.4), ...N_CROWD(0.2, 1, 'park'), ['l', 'kids', 0.15, 1, 'park']], ['nyunisphere']],
  ['Mott Street', 40.7158, -73.9980, 2, 220, 0.85, 'late', [...N_CROWD(0.55, 1.03, 'late'), ['x', 'mahjong', 0.35, 'late'], ['l', 'hawker', 0.25, 0.95, 'late']], []]
];
// special makers: each returns {upd(V, t, k, d, dt)} and schedules its sounds into dst (the voice input)
const LMX = {
  // a roller coaster: the chain lift clacking, the drop roar, screams; a run every 40-80 s
  coaster(E, V, dst, g){ let next = E.T + rr(2, 12);
    return {upd(k){ if (k < 0.05 || E.T < next) return; next = E.T + rr(40, 80); const c = E.ctx, t0 = c.currentTime + 0.05, lift = rr(6, 9);
      const cg = nEnv(E, dst, t0, 0.5, 0.35*g, lift - 0.5, 0.2), o = c.createOscillator(); o.type = 'square'; o.frequency.setValueAtTime(7, t0); o.frequency.linearRampToValueAtTime(9, t0 + lift); const bp = nFilt(E, 'bandpass', 1800, 2.5, cg); const og = nGain(E, bp, 1); o.connect(og); o.start(t0); o.stop(t0 + lift + 1);
      const td = t0 + lift + 0.4, rg = c.createGain(); rg.gain.setValueAtTime(0, td); rg.gain.linearRampToValueAtTime(1.1*g, td + 1.2); rg.gain.setTargetAtTime(0.5*g, td + 2.5, 1); rg.gain.setTargetAtTime(0, td + 6, 1.2); rg.connect(dst);
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(300, td); lp.frequency.linearRampToValueAtTime(1600, td + 1.4); lp.frequency.linearRampToValueAtTime(500, td + 7); lp.connect(rg);
      nSrc(E, E.noise.b, td, 10, 1, lp, true); nSrc(E, E.noise.p, td, 10, 1, nGain(E, lp, 0.6), true);
      if (E.bank.scream){ nSrc(E, E.bank.scream, td + 0.6, 0, rr(0.95, 1.05), nGain(E, dst, 0.7*g)); if (rnd() < 0.6) nSrc(E, E.bank.scream, td + 3.2, 0, rr(0.9, 1.1), nGain(E, dst, 0.45*g)); }
      E.events++; }}; },
  // a ballpark on a game night: the crowd's roar breathing, the bat crack + a cheer swell, organ riffs, PA chimes
  ballgame(E, V, dst, g){ const c = E.ctx, rg = nGain(E, dst, 0); let sA = null, sB = null, next = E.T + rr(4, 10), org = E.T + rr(10, 25);
    return {upd(k){ if (!sA && E.bank.roar){ sA = E.bedLoop(E.bank.roar); sA.connect(rg); sB = E.bedLoop(E.bank.babble || E.bank.roar); sB.playbackRate.value = 0.9; sB.connect(rg); V.stop.push(sA, sB); }
      const t = c.currentTime; PT(rg.gain, (0.35 + 0.25*rnd())*g*k, t, 0.6);
      if (k > 0.1 && E.T > next){ next = E.T + rr(14, 40); const t0 = t + 0.05, big = rnd() < 0.35;
        nSrc(E, E.noise.w, t0, 0.05, 1, nFilt(E, 'bandpass', 2200, 1.2, nEnv(E, dst, t0, 0.001, 0.9*g, 0.004, 0.012)), true);
        rg.gain.setTargetAtTime((big ? 1.4 : 0.9)*g*k, t0 + 0.3, 0.4); rg.gain.setTargetAtTime(0.45*g*k, t0 + (big ? 5 : 2.5), 1.5); if (big && E.bank.applause) nSrc(E, E.bank.applause, t0 + 1, 0, 1, nGain(E, dst, 0.6*g)); E.events++; }
      if (k > 0.1 && E.T > org){ org = E.T + rr(30, 70); const key = rnd() < 0.5 ? 'organ0' : 'organ1'; if (E.bank[key]) nSrc(E, E.bank[key], t + 0.05, 0, 1, nFilt(E, 'lowpass', 3000, 0.6, nGain(E, dst, 0.45*g))); } }}; },
  // a stadium concert / match night without the bat (Singapore)
  stadium(E, V, dst, g){ const c = E.ctx, rg = nGain(E, dst, 0); let sA = null, next = E.T + rr(5, 15);
    return {upd(k){ if (!sA && E.bank.roar){ sA = E.bedLoop(E.bank.roar); sA.connect(rg); V.stop.push(sA); } const t = c.currentTime; PT(rg.gain, (0.4 + 0.3*rnd())*g*k, t, 0.8);
      if (k > 0.1 && E.T > next){ next = E.T + rr(20, 50); rg.gain.setTargetAtTime(1.3*g*k, t + 0.1, 0.5); rg.gain.setTargetAtTime(0.5*g*k, t + 4, 1.5); if (E.bank.applause) nSrc(E, E.bank.applause, t + 0.5, 0, 1, nGain(E, dst, 0.5*g)); E.events++; } }}; },
  // light-show water jets: whooshes and splashes
  jets(E, V, dst, g){ let next = E.T + 1; return {upd(k){ if (k < 0.05 || E.T < next) return; next = E.T + rr(2, 6); const c = E.ctx, t0 = c.currentTime + 0.05, d = rr(1.2, 3.5), e = c.createGain(); e.gain.setValueAtTime(0, t0); e.gain.linearRampToValueAtTime(0.5*g*k, t0 + 0.25); e.gain.setTargetAtTime(0, t0 + d, 0.5); e.connect(dst);
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 0.7; bp.frequency.setValueAtTime(700, t0); bp.frequency.linearRampToValueAtTime(2600, t0 + d); bp.connect(e); nSrc(E, E.noise.w, t0, d + 3, 1, bp, true); E.events++; }}; },
  // a temple drum: slow strokes in phrases
  drum(E, V, dst, g){ let next = E.T + rr(3, 10); return {upd(k){ if (k < 0.05 || E.T < next) return; next = E.T + rr(20, 45); const c = E.ctx; let tt = c.currentTime + 0.05; const n = ri(4, 10), per = rr(0.45, 0.8);
    for (let i = 0; i < n; i++){ const e = nEnv(E, dst, tt, 0.004, g*k*(i % 4 === 0 ? 1 : 0.6), 0.02, 0.18); const o = c.createOscillator(); o.frequency.setValueAtTime(88, tt); o.frequency.exponentialRampToValueAtTime(60, tt + 0.3); o.connect(e); o.start(tt); o.stop(tt + 1.2); tt += per*(i % 4 === 3 ? 1.6 : 1); } E.events++; }}; },
  // impact-wrench bursts from the pit garages
  wrench(E, V, dst, g){ let next = E.T + rr(3, 10); return {upd(k){ if (k < 0.05 || E.T < next) return; next = E.T + rr(6, 20); const c = E.ctx, t0 = c.currentTime + 0.05, d = rr(0.5, 1.4), e = nEnv(E, dst, t0, 0.02, 0.4*g*k, d, 0.05);
    const o = c.createOscillator(); o.type = 'square'; o.frequency.setValueAtTime(rr(105, 130), t0); const lp = nFilt(E, 'bandpass', 1800, 1.2, e); o.connect(lp); o.start(t0); o.stop(t0 + d + 0.4); nSrc(E, E.noise.w, t0, d + 0.3, 1, nFilt(E, 'highpass', 3000, 0.6, nGain(E, e, 0.25)), true); E.events++; }}; },
  // a suspension bridge singing in the wind (railing / cable tones swelling with the gusts)
  ggsing(E, V, dst, g){ const c = E.ctx, sg = nGain(E, dst, 0), os = []; for (const f of [rr(395, 405), rr(497, 505), rr(592, 602)]){ const o = c.createOscillator(); o.frequency.value = f; const og = nGain(E, sg, 0.33); o.connect(og); o.start(); os.push(o); }
    V.stop.push(...os); return {upd(k){ const w = clamp(((E.wx.wind === undefined ? 0.4 : E.wx.wind) - 0.35)*2, 0, 1); PT(sg.gain, 0.035*g*k*w*(0.3 + 0.7*(E.gust || 0.5)), c.currentTime, 0.8); }}; },
  // halyards slapping masts at a marina, creaking pontoons
  rigging(E, V, dst, g){ let next = E.T + 1; return {upd(k){ if (k < 0.05 || E.T < next) return; next = E.T + rr(0.8, 3)/(0.5 + (E.gust || 0.5)); if (E.bank.ping) nSrc(E, E.bank.ping, E.ctx.currentTime + 0.03, 0, rr(0.7, 1.4), nGain(E, dst, rr(0.1, 0.35)*g*k)); if (rnd() < 0.15 && E.bank.creak) nSrc(E, E.bank.creak, E.ctx.currentTime + 0.05, 0, rr(0.4, 0.6), nGain(E, dst, 0.2*g*k)); }}; },
  // big surf on rocks / a beach: breakers in sets
  surf(E, V, dst, g){ const c = E.ctx, lp = nFilt(E, 'lowpass', 400, 0.7, nGain(E, dst, 1)), e1 = nGain(E, lp, 0), hp = nFilt(E, 'bandpass', 1500, 0.6, nGain(E, dst, 1)), e2 = nGain(E, hp, 0);
    V.stop.push(nSrc(E, E.noise.b, c.currentTime, 0, 0.8, e1, true), nSrc(E, E.noise.w, c.currentTime, 0, 1, e2, true)); let next = E.T;
    return {upd(k){ if (E.T < next) return; const p = rr(6, 12), t = c.currentTime; next = E.T + p; const a = rr(0.6, 1.2)*g*k*(0.7 + 0.6*clamp(((E.wx.wind || 0.4) - 0.3), 0, 1));
      e1.gain.setTargetAtTime(1.2*a, t, 0.6); e1.gain.setTargetAtTime(0.3*a, t + p*0.4, 1.4); e2.gain.setTargetAtTime(0.05*a, t, 0.3); e2.gain.setTargetAtTime(0.7*a, t + p*0.3, 0.12); e2.gain.setTargetAtTime(0.08*a, t + p*0.3 + 1.2, 1); }}; },
  // a bell buoy rocking in the swell
  buoy(E, V, dst, g){ let next = E.T + 2; return {upd(k){ if (E.T < next) return; next = E.T + rr(2.5, 8); const n = ri(1, 2); for (let i = 0; i < n; i++) if (E.bank.bell) nSrc(E, E.bank.bell, E.ctx.currentTime + 0.05 + i*rr(0.4, 0.9), 0, rr(0.5, 0.56), nGain(E, dst, rr(0.3, 0.6)*g*k)); }}; },
  // BART under the street: a rumble through the vents and the wheel screech
  bart(E, V, dst, g){ let next = E.T + rr(5, 15); return {upd(k){ if (k < 0.05 || E.T < next) return; next = E.T + rr(60, 150)/3; const c = E.ctx, t0 = c.currentTime + 0.05, d = rr(8, 14);
    const e = c.createGain(); e.gain.setValueAtTime(0, t0); e.gain.linearRampToValueAtTime(0.8*g*k, t0 + d*0.45); e.gain.linearRampToValueAtTime(0, t0 + d); e.connect(dst); nSrc(E, E.noise.b, t0, d + 1, 1, nFilt(E, 'lowpass', 180, 1, e), true);
    const s = c.createGain(); s.gain.setValueAtTime(0, t0); s.gain.setTargetAtTime(0.18*g*k, t0 + d*0.35, 0.3); s.gain.setTargetAtTime(0, t0 + d*0.7, 0.4); s.connect(dst); nSrc(E, E.noise.w, t0, d + 1, 1, nFilt(E, 'bandpass', rr(3200, 4200), 22, s), true); nSrc(E, E.noise.w, t0, d + 1, 1, nFilt(E, 'bandpass', rr(5200, 6000), 25, nGain(E, s, 0.6)), true); E.events++; }}; },
  // bicycles: bells and a freewheel ticking past
  bikes(E, V, dst, g){ let next = E.T + rr(2, 8); return {upd(k){ if (k < 0.05 || E.T < next) return; next = E.T + rr(8, 25); const c = E.ctx, t0 = c.currentTime + 0.05, n = ri(1, 2);
    for (let i = 0; i < n; i++){ const ts = t0 + i*0.17, e = nEnv(E, dst, ts, 0.001, 0.25*g*k, 0.005, 0.25); for (const [r, v] of [[1, 1], [2.32, 0.5], [3.9, 0.3]]) nOsc(E, 'sine', 1550*r, ts, ts + 1.2, nGain(E, e, v*0.5)); }
    const f = nEnv(E, dst, t0 + 0.4, 0.3, 0.05*g*k, 1.5, 0.4), o = c.createOscillator(); o.type = 'square'; o.frequency.value = rr(18, 26); o.connect(nFilt(E, 'bandpass', 4200, 2, f)); o.start(t0); o.stop(t0 + 3.5); E.events++; }}; },
  // mahjong tiles from upstairs windows
  mahjong(E, V, dst, g){ let next = E.T + rr(2, 8); return {upd(k){ if (k < 0.05 || E.T < next) return; next = E.T + rr(6, 18); const c = E.ctx; let ts = c.currentTime + 0.05; const n = ri(10, 24);
    for (let i = 0; i < n; i++){ const e = nEnv(E, dst, ts, 0.0005, rr(0.04, 0.1)*g*k, 0.001, 0.006); nOsc(E, 'triangle', rr(2600, 4200), ts, ts + 0.05, e); ts += rr(0.015, 0.09)*(rnd() < 0.15 ? 4 : 1); } E.events++; }}; },
  // joggers passing on a lakeside path
  joggers(E, V, dst, g){ let next = E.T + rr(3, 10); return {upd(k){ if (k < 0.05 || E.T < next || !E.bank.run) return; next = E.T + rr(10, 25); const c = E.ctx, t0 = c.currentTime + 0.05, T = rr(4, 7), e = c.createGain(); e.gain.setValueAtTime(0, t0); e.gain.linearRampToValueAtTime(0.4*g*k, t0 + T/2); e.gain.linearRampToValueAtTime(0, t0 + T); e.connect(dst); const s = nSrc(E, E.bank.run, t0, T + 0.1, rr(0.95, 1.08), e, true); void s; }}; },
  // a horse carriage passing: hooves and wheels, a snort
  carriage(E, V, dst, g){ let next = E.T + rr(2, 8); return {upd(k){ if (k < 0.05 || E.T < next || !E.bank.hooves) return; next = E.T + rr(25, 50); const c = E.ctx, t0 = c.currentTime + 0.05, T = rr(12, 18), e = c.createGain(); e.gain.setValueAtTime(0, t0); e.gain.linearRampToValueAtTime(0.7*g*k, t0 + T/2); e.gain.linearRampToValueAtTime(0, t0 + T); e.connect(dst); nSrc(E, E.bank.hooves, t0, T + 0.1, rr(0.95, 1.05), e, true);
    const sn = nEnv(E, dst, t0 + T*0.4, 0.05, 0.15*g*k, 0.2, 0.15); nSrc(E, E.noise.p, t0 + T*0.4, 0.8, 1, nFilt(E, 'bandpass', 700, 1.5, sn), true); E.events++; }}; },
  // ferries: engine idle, a horn as they leave, the wash
  ferry(E, V, dst, g){ const c = E.ctx, eg = nGain(E, dst, 0), o = c.createOscillator(); o.setPeriodicWave(E.waves.d6); o.frequency.value = 9; o.connect(nFilt(E, 'lowpass', 300, 0.8, eg)); o.start(); V.stop.push(o); let next = E.T + rr(5, 20);
    return {upd(k){ PT(eg.gain, 0.3*g*k, c.currentTime, 1); if (k < 0.05 || E.T < next) return; next = E.T + rr(60, 140); const L = E.L, p = V.pos; if (p) shipHorn(E, [p[0], p[1], 45], Math.hypot(p[0] - L.wx, p[1] - L.wy)); }}; },
  // the opening / closing bell (9:30, 16:00)
  nysebell(E, V, dst, g){ let rung = -1; return {upd(k, h){ const w = LMS.nyse(h); if (w < 0.5){ rung = -1; return; } const slot = h < 12 ? 0 : 1; if (rung === slot) return; rung = slot; const c = E.ctx, t0 = c.currentTime + 0.05, d = 10, e = nEnv(E, dst, t0, 0.01, 0.35*g, d, 0.1);
    const o = c.createOscillator(); o.type = 'square'; o.frequency.value = 1180; const am = c.createOscillator(), ad = c.createGain(); am.frequency.value = 22; ad.gain.value = 0.5; am.connect(ad); const vg = c.createGain(); vg.gain.value = 0.5; ad.connect(vg.gain); o.connect(vg); vg.connect(nFilt(E, 'bandpass', 2300, 1.5, e)); o.start(t0); am.start(t0); o.stop(t0 + d + 0.5); am.stop(t0 + d + 0.5);
    if (E.bank.applause) nSrc(E, E.bank.applause, t0 + 1, 0, 1, nGain(E, dst, 0.5*g)); E.events++; }}; },
  // ice skaters: blade strides and stops
  skates(E, V, dst, g){ let next = E.T; return {upd(k){ if (k < 0.05 || E.T < next) return; next = E.T + rr(0.25, 0.9); const c = E.ctx, t0 = c.currentTime + 0.03, d = rr(0.25, 0.6), stop = rnd() < 0.08, e = nEnv(E, dst, t0, d*0.4, (stop ? 0.3 : 0.12)*g*k, d*0.3, 0.08);
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = stop ? 1 : 2.2; bp.frequency.setValueAtTime(stop ? 2500 : rr(3200, 4800), t0); bp.frequency.linearRampToValueAtTime(stop ? 1800 : rr(4200, 6000), t0 + d); bp.connect(e); nSrc(E, E.noise.w, t0, d + 0.6, 1, bp, true); }}; },
  // sirens through the busiest crossroads: more often than the city's own (nyUpdate)
  sirens(E, V, dst, g){ let next = E.T + rr(20, 60); return {upd(k){ if (k < 0.05 || E.T < next) return; next = E.T + rr(60, 150); if (auNyc()) nySiren(E, rnd() < 0.3 ? 'fire' : 'wail', 0.8*g); }}; },
  // a city crossroads: horns (taps, leans, chains)
  honks(E, V, dst, g){ let next = E.T + 1; return {upd(k){ if (k < 0.05 || E.T < next) return; next = E.T + rr(1.2, 5); const L = E.L, p = V.pos || [L.wx, L.wy], a = rnd()*TAU, d = Math.max(20, Math.hypot(p[0] - L.wx, p[1] - L.wy)) + rr(0, 60);
    nyHorn(E, L.wx + Math.cos(a)*d, L.wy + Math.sin(a)*d, d, E.ctx.currentTime + 0.05, rnd() < 0.2, rnd() < 0.3); }}; }
};
// a landmark list in world coordinates for the current city (snapped to the placed models)
function lmDefs(){
  const city = auNyc() ? 'ny' : auBay() ? 'bay' : 'sg'; if (LMD.city === city && LMD.list) return LMD.list;
  const T = city === 'ny' ? LM_NY : city === 'bay' ? LM_BAY : LM_SG, out = [];
  let PL = null; try { PL = SG_PLACES; } catch (e){ PL = null; }
  for (const D of T){
    let x, y; try { const q = sgXY(D[1], D[2]); x = q[0]; y = q[1]; } catch (e){ continue; }
    if (PL && D[8]) for (const k of D[8]){ const p = PL.find(q => q.type === k); if (p){ const q = sgXY(p.lat, p.lon); if (Math.hypot(q[0] - x, q[1] - y) < 150){ x = q[0]; y = q[1]; } break; } }
    const line = D[9] ? D[9].map(p => sgXY(p[0], p[1])) : null;
    out.push({name:D[0], x, y, h:D[3], r:D[4], lvl:D[5], on:LMS[D[6]] || LMS.always, layers:D[7], line});
  }
  LMD.city = city; LMD.list = out; return out;
}
const LMD = {city:null, list:null};
// the point of a landmark nearest the listener (a polyline for the long ones)
function lmPoint(D, x, y, o){
  if (!D.line){ o[0] = D.x; o[1] = D.y; return o; }
  let bd = 1e18; for (let i = 0; i + 1 < D.line.length; i++){ const a = D.line[i], b = D.line[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx*dx + dy*dy || 1, u = clamp(((x - a[0])*dx + (y - a[1])*dy)/L2, 0, 1), px = a[0] + dx*u, py = a[1] + dy*u, d = (px - x)*(px - x) + (py - y)*(py - y); if (d < bd){ bd = d; o[0] = px; o[1] = py; } }
  return o;
}
// build a landmark's layers into a voice
const LMX_NEEDS = {coaster:['scream'], ballgame:['roar', 'applause', 'organ0', 'organ1'], stadium:['roar', 'applause'], carriage:['hooves'], nysebell:['applause']};
function lmBuild(E, V, D){
  const c = E.ctx; V.stop = []; V.lay = []; V.D = D; V.pos = [D.x, D.y];
  for (const Ly of D.layers){
    const kind = Ly[0];
    if (kind === 'l') bankWant(E, Ly[1]); else if (kind === 'e') for (const k of Ly[1]) bankWant(E, k); else if (kind === 'x') for (const k of LMX_NEEDS[Ly[1]] || []) bankWant(E, k);
    if (kind === 'n'){ const g = c.createGain(); g.gain.value = 0; g.connect(V.inp); const f = c.createBiquadFilter(); f.type = Ly[2]; f.frequency.value = Ly[3]; f.Q.value = Ly[4]; f.connect(g);
      V.stop.push(nSrc(E, E.noise[Ly[1]], c.currentTime, 0, rr(0.95, 1.05), f, true)); V.lay.push({k:'n', g, base:Ly[5], am:Ly[6] || 0, on:LMS[Ly[7]] || null}); }
    else if (kind === 'l'){ const g = c.createGain(); g.gain.value = 0; g.connect(V.inp); let dest = g; if (Ly[5]){ const f = c.createBiquadFilter(); f.type = Ly[5][0]; f.frequency.value = Ly[5][1]; f.Q.value = Ly[5][2]; f.connect(g); dest = f; }
      V.lay.push({k:'l', g, dest, key:Ly[1], base:Ly[2], rate:Ly[3] || 1, on:LMS[Ly[4]] || null, src:null}); }
    else if (kind === 'e'){ const g = c.createGain(); g.gain.value = 1; g.connect(V.inp); V.lay.push({k:'e', g, keys:Ly[1], base:Ly[2], per:Ly[3], rate:Ly[4], on:LMS[Ly[5]] || null, burst:Ly[6] || null, next:E.T + rr(0.5, Ly[3][0])}); }
    else if (kind === 'o'){ const g = c.createGain(); g.gain.value = 0; g.connect(V.inp); for (const f of Ly[1]){ const o = c.createOscillator(); o.type = Ly[2]; o.frequency.value = f*rr(0.998, 1.002); o.connect(g); o.start(); V.stop.push(o); }
      V.lay.push({k:'o', g, base:Ly[3], on:LMS[Ly[4]] || null, am:Ly[5] || null}); }
    else if (kind === 'x' && LMX[Ly[1]]){ const g = c.createGain(); g.gain.value = 1; g.connect(V.inp); V.lay.push({k:'x', g, on:LMS[Ly[3]] || null, X:LMX[Ly[1]](E, V, g, Ly[2])}); }
  }
}
function lmKill(V){ if (V.stop) for (const s of V.stop){ try { s.stop(); } catch (e){ /* already stopped */ } try { s.disconnect(); } catch (e){ /* */ } } if (V.lay) for (const l of V.lay){ try { l.g.disconnect(); } catch (e){ /* */ } if (l.src){ try { l.src.stop(); l.src.disconnect(); } catch (e){ /* */ } } }
  V.stop = null; V.lay = null; V.D = null; }
const _lp = [0, 0];
function lmUpdate(E, dt){
  const R = E.lmS || (E.lmS = {scan:0, top:[], topS:[], upd:0}), now = E.ctx.currentTime, L = E.L, h = typeof tod === 'number' ? tod : 12;
  // voices that were let go: stop their sources once faded
  for (const V of E.pv) if (V.kind === 'lm' && !V.busy && V.stop && now > V.dieAt) lmKill(V);
  if (!auReal()){ for (const V of E.pv) if (V.kind === 'lm' && V.busy){ pvFree(V, now); V.dieAt = now + 0.7; } return; }
  R.scan -= dt;
  if (R.scan <= 0){
    R.scan = 0.5; const TP = R.top, TS = R.topS; let n = 0;
    for (const D of lmDefs()){
      const dx = D.x - L.wx, dy = D.y - L.wy; if (!D.line && (Math.abs(dx) > D.r + 50 || Math.abs(dy) > D.r + 50)) continue;
      lmPoint(D, L.wx, L.wy, _lp); const d = Math.hypot(_lp[0] - L.wx, _lp[1] - L.wy, (D.h + L.gnd) - L.y); if (d > D.r) continue;
      const act = D.on(h); if (act < 0.02) continue;
      const s = D.lvl*act*(1 - d/D.r)/Math.max(d, 20);
      if (n < 3){ let j = n++; while (j > 0 && TS[j - 1] < s){ TS[j] = TS[j - 1]; TP[j] = TP[j - 1]; j--; } TS[j] = s; TP[j] = D; }
      else if (s > TS[2]){ let j = 2; while (j > 0 && TS[j - 1] < s){ TS[j] = TS[j - 1]; TP[j] = TP[j - 1]; j--; } TS[j] = s; TP[j] = D; }
    }
    for (const V of E.pv){ if (V.kind !== 'lm' || !V.busy) continue; let keep = false; for (let j = 0; j < n; j++) if (TP[j] === V.key){ keep = true; break; } if (!keep){ pvFree(V, now); V.dieAt = now + 0.7; } }
    for (let j = 0; j < n; j++){
      const D = TP[j]; let has = false; for (const V of E.pv) if (V.kind === 'lm' && V.busy && V.key === D){ has = true; break; } if (has) continue;
      const V = pvGet(E, 'lm', 'lm'); if (!V) break;
      if (V.stop) lmKill(V);
      pvTake(V, D, now); lmBuild(E, V, D);
    }
    for (let j = n; j < TP.length; j++) TP[j] = null;
  }
  R.upd -= dt; if (R.upd > 0) return; const step = Math.max(0.1, -R.upd + 0.1); R.upd = 0.1;
  for (const V of E.pv){
    if (V.kind !== 'lm' || !V.busy || !V.lay) continue;
    const D = V.key; lmPoint(D, L.wx, L.wy, _lp); V.pos = [_lp[0], _lp[1]];
    const z = D.h + L.gnd, d = Math.hypot(_lp[0] - L.wx, _lp[1] - L.wy, z - L.y), act = D.on(h);
    pvPlace(V, _lp[0], z, -_lp[1], now);
    // a big landmark is heard from its whole extent: the reference distance grows with the radius
    pvLevel(V, D.lvl*act*(1 - sstep(D.r*0.65, D.r, d)), d, Math.max(25, D.r*0.12), 1, now);
    V.fresh = false;
    for (const l of V.lay){
      const k = l.on ? l.on(h) : 1;
      if (l.k === 'n'){ PT(l.g.gain, l.base*k*(1 - l.am*rnd()), now, 0.25); }
      else if (l.k === 'o'){ PT(l.g.gain, l.base*k*(l.am ? 1 - l.am[1]*(0.5 + 0.5*Math.sin(E.T*TAU*l.am[0])) : 1), now, 0.3); }
      else if (l.k === 'l'){ if (!l.src && E.bank[l.key] && l.base > 0){ l.src = E.bedLoop(E.bank[l.key]); l.src.playbackRate.value = l.rate; l.src.connect(l.dest); } PT(l.g.gain, l.base*k, now, 0.6); }
      else if (l.k === 'e'){ if (k > 0.05 && E.T >= l.next){ l.next = E.T + rr(l.per[0], l.per[1]); const seq = l.burst && l.burst[3] === 'seq', key = pick(l.keys);
        if (E.bank[seq ? l.keys[0] : key]){ const nb = l.burst ? ri(l.burst[0], l.burst[1]) : 1; for (let i = 0; i < nb; i++){ const b = E.bank[seq ? l.keys[i % l.keys.length] : key]; if (b) nSrc(E, b, now + 0.03 + i*(l.burst && l.burst[2] ? l.burst[2] : rr(0.3, 0.8)), 0, rr(l.rate[0], l.rate[1]), nGain(E, l.g, l.base*k*(seq ? 1 : rr(0.7, 1)))); } E.events++; } } }
      else if (l.k === 'x') l.X.upd(k, h, step);
    }
  }
}
/* ---------------------------------------------------------------- [lm24/sound] v27 vehicle voices: SGAudio.vehicle / vehicleStop -------
   SGAudio.vehicle(id, kind, p) stores the latest state of a vehicle (any call order, any rate, also while the sound is off);
   the director gives the five nearest / loudest of them a voice (pool kind 'uv', group 'f1': master volume, mute and the
   驾驶 Driving switch apply). kinds: prop (piston single: firing / blade-pass buzz, exhaust, prop wash), jet (fan buzz-saw, fan /
   compressor whine, roar, rumble), heli (main-rotor blade slap, tail rotor, turbine whine, exhaust), bus / truck (diesel six,
   turbo whistle, tyres, air-brake hiss when it stops), motorbike (twin, intake rasp, chain), boat (engine through the water,
   hull slap, wake). p = {x, y, z, throttle, speed, rpm, inside, damage}: world metres (z = height), 0-1 controls, m/s; rpm
   derives from throttle / speed when missing. Doppler from the motion between calls; inside = the cockpit / cab view: centred,
   low-passed, more rumble. damage: misfire stutter, rattles, a whistle (aircraft). A vehicle not updated for 1 s fades out.
   SGAudio.vehicleStop(id) fades it out now. */
const UV = new Map(), UV_KINDS = {prop:1, jet:1, heli:1, bus:1, truck:1, motorbike:1, boat:1};
const UVK = {prop:{lvl:1.5, ref:12}, jet:{lvl:2.2, ref:60}, heli:{lvl:2.0, ref:30}, bus:{lvl:1.8, ref:6}, truck:{lvl:2.0, ref:6}, motorbike:{lvl:2.4, ref:4}, boat:{lvl:1.1, ref:8}};
const fin = (v, d) => (typeof v === 'number' && isFinite(v)) ? v : d;
function uvSet(id, kind, p){
  if (id === undefined || id === null || !UV_KINDS[kind]) return false;
  p = p || {}; const now = performance.now()/1000; let U = UV.get(id);
  const x = fin(p.x, U ? U.x : 0), y = fin(p.y, U ? U.y : 0), z = fin(p.z, U ? U.z : 0);
  if (!U){ if (UV.size > 48) for (const [k, W] of UV) if (now - W.t > 2 || W.stop) UV.delete(k);
    if (UV.size > 96) return false;
    U = {id, kind, x, y, z, vx:0, vy:0, vz:0, t:now, thr:0, spd:0, rpm:-1, inside:false, dmg:0, stop:false, n:0}; UV.set(id, U); }
  else {
    const dt = now - U.t, jump = Math.hypot(x - U.x, y - U.y, z - U.z);
    if (dt > 0.004 && dt < 0.5 && jump < 400){ const k = Math.min(1, dt*6); U.vx += ((x - U.x)/dt - U.vx)*k; U.vy += ((y - U.y)/dt - U.vy)*k; U.vz += ((z - U.z)/dt - U.vz)*k; }
    else if (jump >= 400){ U.vx = U.vy = U.vz = 0; }
    if (dt > 0.004 || jump > 0) U.t = now;
  }
  if (U.kind !== kind){ U.kind = kind; U.rebuild = true; }
  if (typeof p.vx === 'number' && isFinite(p.vx) && typeof p.vy === 'number' && isFinite(p.vy)){ U.vx = p.vx; U.vy = p.vy; U.vz = fin(p.vz, 0); }     // optional: the caller's own velocity (m/s)
  U.x = x; U.y = y; U.z = z; U.thr = clamp(fin(p.throttle, U.thr), 0, 1); U.spd = Math.max(0, fin(p.speed, Math.hypot(U.vx, U.vy, U.vz)));
  U.rpm = typeof p.rpm === 'number' && isFinite(p.rpm) ? clamp(p.rpm, 0, 1) : -1; U.inside = !!p.inside; U.dmg = clamp(fin(p.damage, 0), 0, 1); U.stop = false; U.n++;
  return true;
}
function uvStop(id){ const U = UV.get(id); if (U) U.stop = true; return !!U; }
// the graph of a vehicle voice (all into V.inp): built once per kind on the pooled voice
function uvBuild(E, V, kind){
  const c = E.ctx; if (V.uvNodes) uvKill(V);
  const N = V.uvNodes = [], G = v => { const g = c.createGain(); g.gain.value = v; return g; }, F = (type, f, q) => { const b = c.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; return b; };
  const osc = (w, f) => { const o = c.createOscillator(); if (typeof w === 'string') o.type = w; else o.setPeriodicWave(w); o.frequency.value = f; o.start(); N.push(o); return o; };
  const loop = (b, rate) => { const s = c.createBufferSource(); s.buffer = b; s.loop = true; s.playbackRate.value = rate || 1; s.start(0, rnd()*b.duration*0.9); N.push(s); return s; };
  const W = E.waves, A = V.uv = {kind};
  if (!W.prop) W.prop = mkWave(c, waveAmps(40, k => (k % 2 === 0 ? 1/Math.pow(k/2, 0.75) : 0.35/Math.pow(k, 0.6)) + (k === 1 ? 0.5 : 0)));
  if (!W.slap) W.slap = mkWave(c, waveAmps(24, k => 1/Math.pow(k, 0.35)));
  // a damage stutter / rattle stage shared by all kinds
  A.mix = G(1); A.mix.connect(V.inp); A.dmgG = G(0); A.dmgG.connect(V.inp);
  loop(E.noise.p, 1).connect(F('bandpass', 1900, 2.5)).connect(A.dmgG);
  A.rumG = G(0); loop(E.noise.b, 0.8).connect(F('lowpass', 110, 0.9)).connect(A.rumG); A.rumG.connect(V.inp);            // interior rumble
  if (kind === 'prop'){
    A.o = osc(W.prop, 40); A.lp = F('lowpass', 1200, 0.8); A.eg = G(0); A.o.connect(A.lp); A.lp.connect(A.eg); A.eg.connect(A.mix);
    A.o2 = osc(W.m1, 20); A.eg2 = G(0); A.o2.connect(F('lowpass', 700, 0.7)).connect(A.eg2); A.eg2.connect(A.mix);
    A.ws = loop(E.noise.p); A.wbp = F('bandpass', 900, 0.6); A.wg = G(0); A.ws.connect(A.wbp); A.wbp.connect(A.wg); A.wg.connect(A.mix);
  } else if (kind === 'jet'){
    A.aS = loop(E.noise.p); A.aLP = F('lowpass', 1500, 0.6); A.aG = G(0); A.aS.connect(A.aLP); A.aLP.connect(A.aG); A.aG.connect(A.mix);
    A.uS = loop(E.noise.b); A.uG = G(0); A.uS.connect(F('lowpass', 150, 0.7)).connect(A.uG); A.uG.connect(A.mix);
    A.bO = osc(W.buzz, 60); A.bLP = F('lowpass', 2600, 0.6); A.bG = G(0); A.bO.connect(A.bLP); A.bLP.connect(A.bG); A.bG.connect(A.mix);
    A.wO = osc('sine', 2900); A.wG = G(0); A.wO.connect(A.wG); A.wG.connect(A.mix); A.w2 = osc('sine', 6000); A.w2G = G(0); A.w2.connect(A.w2G); A.w2G.connect(A.mix);
  } else if (kind === 'heli'){
    // blade slap: band noise amplitude-modulated by a sharp pulse at the blade-pass rate, plus the tonal thump
    A.sl = osc(W.slap, 20); A.slD = G(0.5); A.slN = G(0.5); A.sl.connect(A.slD); A.slD.connect(A.slN.gain);
    loop(E.noise.p, 0.9).connect(F('bandpass', 420, 0.9)).connect(A.slN); A.slG = G(0); A.slN.connect(A.slG); A.slG.connect(A.mix);
    A.th = osc(W.slap, 20); A.thLP = F('lowpass', 160, 0.9); A.thG = G(0); A.th.connect(A.thLP); A.thLP.connect(A.thG); A.thG.connect(A.mix);
    A.tr = osc('sawtooth', 105); A.trG = G(0); A.tr.connect(F('lowpass', 1300, 0.7)).connect(A.trG); A.trG.connect(A.mix);
    A.tw = osc('sine', 6400); A.tw2 = osc('sine', 3150); A.twG = G(0); A.tw.connect(A.twG); A.tw2.connect(A.twG); A.twG.connect(A.mix);
    A.xS = loop(E.noise.p); A.xG = G(0); A.xS.connect(F('lowpass', 900, 0.6)).connect(A.xG); A.xG.connect(A.mix);
  } else if (kind === 'bus' || kind === 'truck' || kind === 'motorbike'){
    const mb = kind === 'motorbike';
    A.o = osc(mb ? W.m1 : W.d6, 30); A.o2 = osc(mb ? W.m1 : W.d6, 30); A.drv = G(0.5); A.o.connect(A.drv); const g2 = G(0.5); A.o2.connect(g2); g2.connect(A.drv);
    A.lp = F('lowpass', 900, 0.9); A.eg = G(0); A.drv.connect(A.lp); A.lp.connect(A.eg); A.eg.connect(A.mix);
    A.iS = loop(E.noise.p); A.iBP = F('bandpass', mb ? 1500 : 800, 1.1); A.iG = G(0); A.iS.connect(A.iBP); A.iBP.connect(A.iG); A.iG.connect(A.mix);
    A.tb = osc('sine', 3500); A.tbG = G(0); A.tb.connect(A.tbG); A.tbG.connect(A.mix);
    A.tS = loop(E.noise.w); A.tBP = F('bandpass', 900, 0.4); A.tG = G(0); A.tS.connect(A.tBP); A.tBP.connect(A.tG); A.tG.connect(A.mix);
  } else if (kind === 'boat'){
    A.o = osc(W.i4, 20); A.lp = F('lowpass', 500, 0.9); A.eg = G(0); A.o.connect(A.lp); A.lp.connect(A.eg); A.eg.connect(A.mix);
    A.am = osc('sine', 7); A.amD = G(0.35); A.am.connect(A.amD); A.amD.connect(A.eg.gain);
    A.hS = loop(E.noise.b, 1.1); A.hG = G(0); A.hS.connect(F('lowpass', 330, 0.8)).connect(A.hG); A.hG.connect(A.mix);
    A.kS = loop(E.noise.w); A.kBP = F('bandpass', 1800, 0.5); A.kG = G(0); A.kS.connect(A.kBP); A.kBP.connect(A.kG); A.kG.connect(A.mix);
  }
  N.push(A.mix, A.dmgG, A.rumG);
}
function uvKill(V){ if (V.uvNodes) for (const n of V.uvNodes){ try { if (n.stop) n.stop(); } catch (e){ /* */ } try { n.disconnect(); } catch (e){ /* */ } } V.uvNodes = null; V.uv = null; }
// the gear model for the road vehicles (rpm 0-1 of the kind's range)
const UV_RPM = {bus:[650, 2100, VK.bus], truck:[600, 2000, VK.lorry], motorbike:[1300, 9500, VK.moto], boat:[700, 5200, null]};
function uvUpdate(E, dt){
  const now = performance.now()/1000, t = E.ctx.currentTime, L = E.L;
  // forget vehicles that stopped or went quiet, pick the voiced ones
  const top = E.uvTop || (E.uvTop = []); top.length = 0;
  for (const U of UV.values()){
    if (U.stop || now - U.t > 1.0){ if (now - U.t > 30 || U.stop) { U.dead = true; } continue; }
    const K = UVK[U.kind]; U.d = Math.hypot(U.x - L.x, U.z - L.y, -U.y - L.z); U.s = U.inside ? 1e9 : K.lvl*K.ref/Math.max(U.d, 3);
    if (U.inside || U.s > 0.004) top.push(U);
  }
  for (const [id, U] of UV) if (U.dead) UV.delete(id);
  top.sort((a, b) => b.s - a.s); if (top.length > 5) top.length = 5;
  for (const V of E.pv){ if (V.kind !== 'uv') continue; if (V.busy && top.indexOf(V.key) < 0){ pvFree(V, t); V.dieAt = t + 0.8; } if (!V.busy && V.uvNodes && t > V.dieAt) uvKill(V); }
  for (const U of top){
    let V = null; for (const Q of E.pv) if (Q.kind === 'uv' && Q.busy && Q.key === U){ V = Q; break; }
    if (!V){ V = pvGet(E, 'uv', 'f1'); if (!V) break; pvTake(V, U, t); U.rebuild = true; }
    if (U.rebuild || !V.uv || V.uv.kind !== U.kind){ uvBuild(E, V, U.kind); U.rebuild = false; V.fresh = true; }
    uvVoice(E, V, U, t, dt);
  }
}
function uvVoice(E, V, U, t, dt){
  const A = V.uv, L = E.L, kind = U.kind, K = UVK[kind];
  // position (three.js) and Doppler; inside: just in front of the listener (centred), no Doppler
  let sx = U.x, sy = U.z, sz = -U.y, D = 1;
  if (U.inside){ sx = L.x + L.fx*0.6; sy = L.y + L.fy*0.6; sz = L.z + L.fz*0.6; }
  else D = dop(E, sx, sy, sz, U.vx, U.vz, -U.vy);
  pvPlace(V, sx, sy, sz, t);
  const thr = U.thr, spd = U.spd, dmg = U.dmg, ins = U.inside;
  // rpm 0-1: given, else from throttle (aircraft) or a gear model (road vehicles, boats)
  let r = U.rpm;
  if (r < 0){ if (kind === 'prop' || kind === 'jet' || kind === 'heli') r = 0.25 + 0.75*thr;
    else { const R = UV_RPM[kind]; if (R[2]){ const rpm = rpmOf(R[2], spd, thr*1.5); r = clamp((rpm - R[0])/(R[1] - R[0]), 0, 1); } else r = clamp(0.15 + 0.6*thr + spd/30, 0, 1); } }
  A.r = r;
  // damage: a misfiring stutter (random dips), rattles, a whistle for the aircraft
  let stut = 1; if (dmg > 0.25 && rnd() < dmg*0.35) stut = rr(0.15, 0.7);
  PT(A.dmgG.gain, dmg > 0.15 ? dmg*0.18*(0.3 + rnd()) : 0, t, 0.03);
  PT(A.rumG.gain, ins ? 0.25 + 0.25*thr : 0, t, 0.2);
  if (kind === 'prop'){
    const rpm = 600 + 2100*r, fb = rpm/60*2*D;            // two-blade prop at crank speed: blade-pass = firing (4-cyl)
    PT(A.o.frequency, fb/2, t, 0.04); PT(A.o2.frequency, fb/2*1.003, t, 0.04);
    PT(A.lp.frequency, (500 + 2600*thr + 400*r)*(ins ? 0.6 : 1), t, 0.06); PT(A.eg.gain, (0.35 + 0.5*thr)*stut, t, 0.03); PT(A.eg2.gain, 0.25*(0.4 + 0.6*thr)*stut, t, 0.03);
    PT(A.wg.gain, clamp(spd/60, 0, 1.4)*0.35, t, 0.15); PT(A.wbp.frequency, (500 + spd*14)*D, t, 0.15);
  } else if (kind === 'jet'){
    const n1 = 0.22 + 0.78*r, air = spd > 15;
    PT(A.aG.gain, (0.12 + 0.95*thr*thr)*stut, t, 0.2); PT(A.aLP.frequency, (900 + 1900*thr)*(ins ? 0.35 : 1), t, 0.3); PT(A.aS.playbackRate, D, t, 0.1);
    PT(A.uG.gain, 0.08 + 0.8*thr, t, 0.2);
    PT(A.bO.frequency, (40 + 60*n1)*D, t, 0.1); PT(A.bG.gain, thr > 0.6 && !ins ? 0.3*(thr - 0.6)/0.4 : 0, t, 0.3);
    PT(A.wO.frequency, (1400 + 2000*n1)*D*(1 + (dmg > 0.4 ? 0.04*Math.sin(E.T*9) : 0)), t, 0.1); PT(A.wG.gain, (ins ? 0.03 : 0.11)*(air && thr < 0.5 ? 1.4 : 1) + dmg*0.08, t, 0.3);
    PT(A.w2.frequency, (3600 + 3200*n1)*D, t, 0.1); PT(A.w2G.gain, ins ? 0.01 : 0.035, t, 0.3);
  } else if (kind === 'heli'){
    const bp = (4 + 17.5*r)*D;                              // four blades at ~5.3 rev/s at full rotor speed
    PT(A.sl.frequency, bp, t, 0.08); PT(A.th.frequency, bp, t, 0.08); PT(A.slG.gain, (0.25 + 0.6*thr + clamp(spd/70, 0, 0.4))*r*stut, t, 0.1); PT(A.thG.gain, 0.6*r, t, 0.1);
    PT(A.tr.frequency, bp*5.3, t, 0.08); PT(A.trG.gain, 0.06*r, t, 0.1);
    PT(A.tw.frequency, (4800 + 1800*r)*D, t, 0.1); PT(A.tw2.frequency, (2300 + 900*r)*D, t, 0.1); PT(A.twG.gain, (ins ? 0.03 : 0.022)*(0.3 + 0.7*r), t, 0.2);
    PT(A.xG.gain, 0.25*(0.3 + 0.7*thr), t, 0.2);
  } else if (kind === 'bus' || kind === 'truck' || kind === 'motorbike'){
    const R = UV_RPM[kind], rpm = R[0] + (R[1] - R[0])*r, mb = kind === 'motorbike', fb = rpm/(mb ? 120 : 60)*D;
    PT(A.o.frequency, fb, t, 0.05); PT(A.o2.frequency, fb*1.004, t, 0.05);
    const fire = rpm/60*(mb ? 1 : 3); PT(A.lp.frequency, clamp(fire*(3 + 6*thr) + 200, 150, mb ? 7000 : 4500)*(ins ? 0.55 : 1), t, 0.06);
    PT(A.drv.gain, 0.4 + 0.6*thr, t, 0.05); PT(A.eg.gain, (mb ? 0.55 : kind === 'truck' ? 0.6 : 0.5)*(0.45 + 0.55*thr)*stut, t, 0.05);
    PT(A.iBP.frequency, (mb ? 900 : 500) + rpm*(mb ? 0.18 : 0.4), t, 0.06); PT(A.iG.gain, (mb ? 0.22 : 0.08)*thr*r, t, 0.08);
    PT(A.tb.frequency, (2600 + 2400*r)*D, t, 0.1); PT(A.tbG.gain, mb ? 0 : (kind === 'truck' ? 0.03 : 0.015)*thr*r, t, 0.2);
    const tk = clamp((spd/14)*(spd/14), 0, 4); PT(A.tG.gain, 0.35*tk*(ins ? 0.5 : 1)*(mb ? 0.3 : 1), t, 0.1); PT(A.tBP.frequency, (650 + spd*35)*D, t, 0.1); PT(A.tS.playbackRate, D, t, 0.1);
    // the air brakes: a hiss as a bus / truck comes to rest
    if (!mb){ if (U.spdPrev > 1.2 && spd < 0.4 && E.T - (U.hissT || 0) > 4){ U.hissT = E.T; hiss(E, A.mix, t + 0.05, 0.9, 0.5, 2600); } U.spdPrev = spd; }
  } else if (kind === 'boat'){
    const rpm = 700 + 4500*r, fb = rpm/60*D;
    PT(A.o.frequency, fb, t, 0.06); PT(A.lp.frequency, (300 + 700*thr)*(ins ? 0.7 : 1), t, 0.1); PT(A.eg.gain, (0.25 + 0.5*thr)*stut, t, 0.06); PT(A.am.frequency, 3 + 6*r, t, 0.2);
    PT(A.hG.gain, 0.25 + clamp(spd/12, 0, 1)*0.5, t, 0.2); PT(A.kG.gain, clamp(spd/15, 0, 1.2)*0.3, t, 0.2); PT(A.kBP.frequency, 1300 + spd*40, t, 0.2);
  }
  // level: the kind's reference distance outside; a steady level inside
  if (ins){ PT(V.g.gain, 0.42*K.lvl*0.5, t, 0.08); PT(V.lp.frequency, kind === 'jet' ? 700 : kind === 'heli' ? 1600 : 2200, t, 0.1); V.lvl = 0.42; V.d = 0; }
  else pvLevel(V, K.lvl, U.d, K.ref, 1, t);
  V.fresh = false;
}
/* ---------------------------------------------------------------- [lm24/sound] v27 effects: SGAudio.fx(name, {x, y, z, k}) -------------
   One-shot positional effects at world (x, y), height z, strength k 0-1 (pool kind 'fx', 5 at most, group 'fx' 碰撞与爆炸 Crashes &
   effects; 'horn' goes to the traffic group). Sound travels at 343 m/s (a far explosion arrives late). Each name has a minimum
   interval (a drive loop may call every frame): crash (body thump, crumple, a rattle of parts), crunch (heavy: metal crumple,
   deep thump, debris), scrape (continuous while called, k = speed: a grinding voice that fades 0.15 s after the last call),
   glass (shatter and tinkle), tyre (a skid burst), treefall (creak, cracking branches, the swoosh of the crown, the thud, leaves),
   polebreak (a metal snap, the pole swinging down, the clang), explosion (crack, boom, a long rumble, falling debris; big ones
   shake the low end), debris, splash (into water: slap, plunge, bubbles), horn (a car horn). When the pool is full a stronger
   event steals the oldest effect voice. */
const FX_GAP = {crash:0.07, crunch:0.15, glass:0.12, tyre:0.18, treefall:0.3, polebreak:0.25, explosion:0.06, debris:0.1, splash:0.15, horn:0.12};
const FX_LVL = {crash:[1.5, 8], crunch:[2.0, 10], glass:[1.0, 6], tyre:[1.8, 8], treefall:[1.6, 15], polebreak:[1.4, 10], explosion:[2.0, 40], debris:[1.0, 8], splash:[1.1, 10], horn:[1.0, 6]};
const FXS = {n:0, drop:0};
function fxPlay(E, name, x, y, z, k){
  const L = E.L, now = E.ctx.currentTime; if (!L.init) return false;
  const FL = E.fxLast || (E.fxLast = {}); if (E.T - (FL[name] === undefined ? -9 : FL[name]) < FX_GAP[name]) return false; FL[name] = E.T;
  const d = Math.hypot(x - L.x, z - L.y, -y - L.z), lv = FX_LVL[name], g = lv[0]*(0.35 + 0.65*k);
  if (g*Math.min(1, lv[1]/Math.max(d, 1)) < 0.002) return false;
  const group = name === 'horn' ? 'trf' : 'fx';
  let V = pvGet(E, 'fx', group);
  if (!V){ let old = null; for (const Q of E.pv) if (Q.kind === 'fx' && Q.busy && Q.key !== 'scrape' && (!old || Q.t0 < old.t0)) old = Q; if (!old || (name !== 'explosion' && name !== 'crunch' && name !== 'crash')){ FXS.drop++; return false; } pvFree(old, now); V = old; }
  if (V.group !== group){ if (V.on){ V.pan.disconnect(); V.on = false; } V.group = group; }
  const delay = Math.min(6, d/C_SND), t0 = now + delay + 0.01;
  pvTake(V, name, now); pvPlace(V, x, z, -y, now); V.fresh = false; V.t0 = now;
  const wet = E.wx.rain > 0.2 || E.wx.mar > 0.4, gain = g*Math.pow(Math.min(1, lv[1]/Math.max(d, 1)), 1);
  V.g.gain.cancelScheduledValues(now); V.g.gain.setValueAtTime(0, now); V.g.gain.setValueAtTime(gain, t0 - 0.005); V.lp.frequency.cancelScheduledValues(now); V.lp.frequency.setValueAtTime(airLP(d, wet), now);
  const dur = FXM[name](E, V.inp, t0, k, d) || 1.5;
  V.until = t0 + dur + 0.3; V.kind = 'fx'; FXS.n++; E.events++;
  return true;
}
// a decaying sine sweep (thumps, booms)
function fxThump(E, dst, t0, f0, f1, dur, amp){ const c = E.ctx, e = nEnv(E, dst, t0, 0.003, amp, 0.01, dur*0.35), o = c.createOscillator(); o.frequency.setValueAtTime(f0, t0); o.frequency.exponentialRampToValueAtTime(f1, t0 + dur); o.connect(e); o.start(t0); o.stop(t0 + dur*2 + 0.2); return e; }
// a filtered noise burst
function fxNoise(E, dst, t0, col, type, f, q, a, h, r){ const e = nEnv(E, dst, t0, a, 1, h, r), bf = nFilt(E, type, f, q, e); nSrc(E, E.noise[col], t0, a + h + r*6 + 0.1, rr(0.9, 1.1), bf, true); return e; }
const fxBuf = (E, dst, key, t0, rate, amp) => { if (!E.bank[key]) return false; nSrc(E, E.bank[key], t0, 0, rate, nGain(E, dst, amp)); return true; };
const FXM = {
  crash(E, dst, t0, k){ fxThump(E, dst, t0, 110, 42, 0.2, 0.9*(0.4 + 0.6*k)); fxNoise(E, nGain(E, dst, 0.7*k + 0.2), t0, 'p', 'bandpass', 700 + 600*k, 0.8, 0.002, 0.03, 0.06);
    if (!fxBuf(E, dst, 'crunch', t0 + 0.01, rr(1.15, 1.4), 0.5*k + 0.15)) fxNoise(E, nGain(E, dst, 0.4*k), t0, 'w', 'bandpass', 2400, 1.2, 0.002, 0.05, 0.1);
    if (k > 0.5) fxBuf(E, dst, 'debris', t0 + 0.08, rr(1.1, 1.3), 0.25*k); return 1.6; },
  crunch(E, dst, t0, k){ fxThump(E, dst, t0, 85, 30, 0.35, 0.8); fxNoise(E, nGain(E, dst, 0.8), t0, 'b', 'lowpass', 500, 0.8, 0.003, 0.12, 0.2);
    fxBuf(E, dst, 'crunch', t0 + 0.01, rr(0.8, 0.95), 0.9); fxBuf(E, dst, 'debris', t0 + 0.18, rr(0.85, 1), 0.45*k + 0.15); if (k > 0.6) fxBuf(E, dst, 'glass', t0 + 0.05, rr(0.9, 1.1), 0.35*k); return 2.2; },
  glass(E, dst, t0, k){ if (!fxBuf(E, dst, 'glass', t0, rr(0.9, 1.12), 0.8)) fxNoise(E, dst, t0, 'w', 'highpass', 4000, 0.7, 0.001, 0.02, 0.15); return 1.7; },
  tyre(E, dst, t0, k){ const d = 0.25 + 0.55*k, e = nEnv(E, dst, t0, 0.03, 0.55, d, 0.08), c = E.ctx;
    const b1 = c.createBiquadFilter(); b1.type = 'bandpass'; b1.Q.value = 5; b1.frequency.setValueAtTime(rr(1000, 1250), t0); b1.frequency.linearRampToValueAtTime(rr(850, 1000), t0 + d); b1.connect(e);
    const b2 = nFilt(E, 'bandpass', rr(2100, 2500), 7, nGain(E, e, 0.6)); nSrc(E, E.noise.p, t0, d + 0.6, 1, b1, true); nSrc(E, E.noise.p, t0, d + 0.6, 1, b2, true);
    const o = c.createOscillator(); o.frequency.setValueAtTime(rr(1050, 1200), t0); o.frequency.linearRampToValueAtTime(rr(900, 1000), t0 + d); o.connect(nGain(E, e, 0.05)); o.start(t0); o.stop(t0 + d + 0.5); return d + 0.6; },
  treefall(E, dst, t0, k){ const c = E.ctx;
    fxBuf(E, dst, 'creak', t0, rr(0.45, 0.6), 0.7); fxBuf(E, dst, 'debris', t0 + 0.25, rr(0.55, 0.7), 0.6);                       // the trunk splits, branches crack
    fxNoise(E, nGain(E, dst, 0.3), t0, 'w', 'highpass', 3000, 0.5, 0.01, 0.03, 0.04);
    const w = c.createGain(); w.gain.setValueAtTime(0, t0 + 0.4); w.gain.linearRampToValueAtTime(0.5, t0 + 1.4); w.gain.linearRampToValueAtTime(0, t0 + 1.9); w.connect(dst);   // the crown's swoosh
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 0.8; bp.frequency.setValueAtTime(400, t0 + 0.4); bp.frequency.linearRampToValueAtTime(1600, t0 + 1.8); bp.connect(w); nSrc(E, E.noise.p, t0 + 0.4, 2, 1, bp, true);
    fxThump(E, dst, t0 + 1.85, 70, 30, 0.4, 1.1); fxNoise(E, nGain(E, dst, 0.9), t0 + 1.85, 'b', 'lowpass', 260, 0.8, 0.004, 0.08, 0.25);   // the thud
    fxNoise(E, nGain(E, dst, 0.45), t0 + 1.85, 'p', 'highpass', 2200, 0.6, 0.02, 0.3, 0.4); fxBuf(E, dst, 'debris', t0 + 1.9, rr(0.7, 0.85), 0.35);   // leaves, twigs
    return 3.6; },
  polebreak(E, dst, t0, k){ fxNoise(E, nGain(E, dst, 0.7), t0, 'w', 'bandpass', 2600, 1, 0.001, 0.015, 0.03); fxBuf(E, dst, 'ping', t0, rr(0.5, 0.65), 0.6); fxThump(E, dst, t0, 140, 60, 0.12, 0.6);
    fxBuf(E, dst, 'creak', t0 + 0.15, rr(1.3, 1.6), 0.35);
    const tl = t0 + rr(0.9, 1.2); fxBuf(E, dst, 'clang0', tl, rr(0.7, 0.85), 0.9); fxThump(E, dst, tl, 90, 40, 0.25, 0.8); fxBuf(E, dst, 'debris', tl + 0.05, 1.2, 0.3); return 2.8; },
  explosion(E, dst, t0, k, d){ const c = E.ctx, big = 0.5 + k, near = 1 - sstep(80, 1500, d);
    if (near > 0.05) fxNoise(E, nGain(E, dst, 0.9*near), t0, 'w', 'highpass', 1500, 0.5, 0.001, 0.02, 0.04);        // the crack
    const e = c.createGain(); e.gain.setValueAtTime(0, t0); e.gain.linearRampToValueAtTime(0.6*big, t0 + 0.015); e.gain.setTargetAtTime(0.25*big, t0 + 0.1, 0.25); e.gain.setTargetAtTime(0, t0 + 0.8, 0.9 + 0.6*k); e.connect(dst);
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.7; lp.frequency.setValueAtTime(lerp(500, 2400, near), t0); lp.frequency.setTargetAtTime(160, t0 + 0.05, 0.5); lp.connect(e);
    nSrc(E, E.noise.b, t0, 6, 1, lp, true); nSrc(E, E.noise.p, t0, 6, 1, nGain(E, lp, 0.6), true);
    fxThump(E, dst, t0, 60, 22, 0.9 + 0.6*k, 0.5*big);                                              // the low-end shake
    fxBuf(E, dst, 'debris', t0 + rr(0.25, 0.5), rr(0.55, 0.75), 0.5*big*(0.3 + 0.7*near)); fxBuf(E, dst, 'crunch', t0 + 0.05, rr(0.5, 0.6), 0.35*big);
    if (k > 0.5) fxBuf(E, dst, 'debris', t0 + rr(0.9, 1.4), rr(0.8, 1), 0.3*near);
    return 6; },
  debris(E, dst, t0, k){ if (!fxBuf(E, dst, 'debris', t0, rr(0.85, 1.15), 0.9)) fxNoise(E, dst, t0, 'p', 'bandpass', 1800, 1, 0.002, 0.1, 0.2); return 1.8; },
  splash(E, dst, t0, k){ const c = E.ctx, s = 0.4 + 0.6*k, e = nEnv(E, dst, t0, 0.004, 0.6*s, 0.05, 0.12 + 0.25*k);
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.8; lp.frequency.setValueAtTime(5000, t0); lp.frequency.exponentialRampToValueAtTime(500, t0 + 0.5 + 0.4*k); lp.connect(e); nSrc(E, E.noise.w, t0, 1.6, 1, lp, true);
    fxThump(E, dst, t0 + 0.02, 140, 55, 0.3, 0.45*s); fxBuf(E, dst, 'drops', t0 + 0.15, rr(0.5, 0.7), 0.5*s);
    const b = nEnv(E, dst, t0 + 0.2, 0.05, 0.25*s, 0.4 + 0.6*k, 0.3), bp = nFilt(E, 'bandpass', 900, 3, b); nSrc(E, E.noise.p, t0 + 0.2, 2, 1, bp, true); return 2.2; },
  horn(E, dst, t0, k){ const d = 0.15 + 0.85*k*k, g = nEnv(E, dst, t0, 0.01, 0.42, d, 0.03), bp = nFilt(E, 'bandpass', 1700, 0.7, g), f = rr(400, 450);
    nOsc(E, 'square', f, t0, t0 + d + 0.2, bp); nOsc(E, 'square', f*1.25, t0, t0 + d + 0.2, bp); return d + 0.3; }
};
// the scrape: one continuous voice while the calls keep coming
function fxScrape(E, x, y, z, k){
  const L = E.L, t = E.ctx.currentTime; let V = null; for (const Q of E.pv) if (Q.kind === 'fx' && Q.busy && Q.key === 'scrape'){ V = Q; break; }
  if (!V){ V = pvGet(E, 'fx', 'fx'); if (!V) return false; if (V.group !== 'fx'){ if (V.on){ V.pan.disconnect(); V.on = false; } V.group = 'fx'; } pvTake(V, 'scrape', t); V.t0 = t;
    const c = E.ctx; V.sc = {g:nGain(E, V.inp, 0)}; const S = V.sc;
    S.b1 = nFilt(E, 'bandpass', 2800, 9, S.g); S.b2 = nFilt(E, 'bandpass', 4300, 12, nGain(E, S.g, 0.7)); S.b3 = nFilt(E, 'bandpass', 900, 1.5, nGain(E, S.g, 0.6));
    S.s = [nSrc(E, E.noise.w, t, 0, 1, S.b1, true), nSrc(E, E.noise.w, t, 0, 1.03, S.b2, true), nSrc(E, E.noise.p, t, 0, 1, S.b3, true)];
    S.o = c.createOscillator(); S.o.type = 'sawtooth'; S.o.frequency.value = 90; S.o.connect(nFilt(E, 'lowpass', 600, 1, nGain(E, S.g, 0.05))); S.o.start(t); S.s.push(S.o); }
  const S = V.sc, d = Math.hypot(x - L.x, z - L.y, -y - L.z); V.lastScr = E.T; V.until = t + 1e6;
  pvPlace(V, x, z, -y, t); pvLevel(V, 1.3*(0.3 + 0.7*k), d, 8, 1, t); V.fresh = false;
  PT(S.g.gain, 0.5 + 0.5*rnd(), t, 0.03); PT(S.b1.frequency, rr(2300, 3300)*(0.85 + 0.3*k), t, 0.05); PT(S.b2.frequency, rr(3800, 5000), t, 0.05); PT(S.o.frequency, 60 + 140*k + rr(-10, 10), t, 0.05);
  return true;
}
function fxUpdate(E){
  const t = E.ctx.currentTime;
  for (const V of E.pv){
    if (V.kind !== 'fx') continue;
    if (V.busy && V.key === 'scrape' && E.T - V.lastScr > 0.15){ pvFree(V, t); V.scEnd = t + 0.6; }
    if (V.sc && !(V.busy && V.key === 'scrape') && t > (V.scEnd || 0)){ for (const s of V.sc.s){ try { s.stop(); } catch (e){ /* */ } try { s.disconnect(); } catch (e){ /* */ } } try { V.sc.g.disconnect(); } catch (e){ /* */ } V.sc = null; }
    if (V.busy && V.key !== 'scrape' && t > V.until) pvFree(V, t);
  }
}
function auFx(name, p){
  const E = LIVE; if (!E || E.err || !AS.on || E.ctx.state !== 'running' || !p) return false;
  const x = fin(p.x, NaN), y = fin(p.y, NaN); if (!isFinite(x) || !isFinite(y)) return false;
  let z = fin(p.z, NaN); if (!isFinite(z)){ try { z = Math.max(0, hC(x, y)) + 0.5; } catch (e){ z = 0.5; } }
  const k = clamp(fin(p.k, 0.6), 0, 1);
  try { if (name === 'scrape') return fxScrape(E, x, y, z, k); if (!FXM[name]) return false; return fxPlay(E, name, x, y, z, k); }
  catch (e){ console.warn('[audio] fx ' + name + ': ' + String(e && e.message || e).slice(0, 200)); return false; }
}
/* ---------------------------------------------------------------- the director, the live context, hooks, the test handle ---------- */
function every(E, k, per, dt){ const v = (E.tm[k] === undefined ? 0 : E.tm[k]) - dt; if (v <= 0){ E.tm[k] = v + per > 0 ? v + per : per; return true; } E.tm[k] = v; return false; }
function direct(E, t, dt){
  E.T += dt;
  if (E.jobs && E.jobs.length){ const t0 = performance.now(); let n = 0; while (E.jobs.length && performance.now() - t0 < 0.8){ if (E.jobs[0]()){ E.jobs.shift(); n++; } } if (n) bedsAttach(E); }
  listen(E, dt);
  if (every(E, 'scene', 0.5, dt)){ sceneSample(E); wxRead(E); if (E.S.t >= 0) areaSample(E); }
  if (every(E, 'amb', 0.25, dt)){ ambUpdate(E); areaUpdate(E); }
  areaRoadsStep(0.4);            // builds (in slices) once per road set, a no-op afterwards
  natUpdate(E, dt);
  areaEvents(E, dt);
  lmUpdate(E, dt);
  wxUpdate(E, dt);
  trafficUpdate(E, dt);
  railUpdate(E, t, dt);
  airUpdate(E, dt);
  portUpdate(E, dt);
  f1Update(E, dt);
  uvUpdate(E, dt);
  fxUpdate(E);
  uiUpdate(E, dt);
  pvSweep(E, E.ctx.currentTime);
}
function auCtx(){ const A = window.AudioContext || window.webkitAudioContext; if (!A) return null; try { return new A({latencyHint:'interactive'}); } catch (e){ try { return new A(); } catch (e2){ return null; } } }
// switch the sound on (call from a user gesture: it creates / resumes the AudioContext)
function auEnable(){
  AS.on = true; asSave();
  if (!LIVE){ const c = auCtx(); if (!c){ AS.on = false; sndSync(); if (typeof showToast === 'function') showToast('此浏览器不支持网页音频 · Web Audio is not available'); return false; } LIVE = mkEngine(c, false); }
  engineApply(LIVE);
  const p = LIVE.ctx.resume(); const done = () => { sndSync(); if (auRunning()) uiChimeOn(LIVE); };
  if (p && p.then) p.then(done, () => sndSync()); else done();
  if (typeof showToast === 'function') showToast('声音 开 · Sound on');
  sndSync(); return true;
}
function auDisable(){
  AS.on = false; asSave();
  if (LIVE){ const E = LIVE; PT(E.out.gain, 0, E.ctx.currentTime, 0.04); setTimeout(() => { if (!AS.on && E.ctx.state === 'running') E.ctx.suspend().then(sndSync, sndSync); }, 220); }
  if (typeof showToast === 'function') showToast('声音 关 · Sound off');
  sndSync();
}
function uiChimeOn(E){ const c = E.ctx, t = c.currentTime + 0.03; [784, 1175].forEach((f, i) => { const ts = t + i*0.09, g = nEnv(E, E.bus.ui, ts, 0.004, 0.12, 0.02, 0.18); nOsc(E, 'sine', f, ts, ts + 0.9, g); }); }
// ---- hooks
HOOKS.boot.push(() => { asLoad(); sndUI(); try { const ts = document.getElementById('tSlider'); if (ts) ts.addEventListener('input', e => uiSlideTick(e.target)); } catch (e){ /* */ } });
HOOKS.frame.push((t, dt) => {
  const E = LIVE; if (!E || E.err || E.ctx.state !== 'running' || !AS.on) return;
  const t0 = performance.now();
  try { direct(E, t, Math.min(dt || 0, 0.1)); }
  catch (e){ E.err = String(e && e.stack || e); console.error('[audio] stopped: ' + E.err.slice(0, 300)); }
  const ms = performance.now() - t0; E.ms = E.ms*0.97 + ms*0.03; E.frames++; if (E.frames > 30 && ms > E.msMax) E.msMax = ms;
});
// time of day: a dawn chorus burst when the clock is moved into the morning, an insect / cicada swell into the evening
let auTodLast = null;
HOOKS.time.push(h => {
  const E = LIVE; if (E && auTodLast !== null && Math.abs(h - auTodLast) > 0.05){
    const inDawn = x => x > 5.6 && x < 8.2, inEve = x => x > 18.1 && x < 19.8;
    if (inDawn(h) && !inDawn(auTodLast)) E.chorusT = E.T + 9;
    if (inEve(h) && !inEve(auTodLast)) E.eveT = E.T + 12;
  }
  auTodLast = h;
});
document.addEventListener('visibilitychange', () => {
  const E = LIVE; if (!E) return;
  if (document.hidden){ if (E.ctx.state === 'running'){ E.hid = true; E.ctx.suspend().catch(() => {}); } }
  else if (E.hid){ E.hid = false; if (AS.on) E.ctx.resume().then(sndSync, sndSync); }
});
// ---- tests: render a scene offline (deterministic, sim-time stepped) and analyse it
function auAnalyse(buf){
  const L = buf.getChannelData(0), R = buf.getChannelData(1), n = L.length, sr = buf.sampleRate, w = Math.floor(sr*0.1);
  let pk = 0, s2 = 0, clip = 0; const st = [];
  for (let i = 0; i < n; i++){ const a = Math.abs(L[i]), b = Math.abs(R[i]); if (a > pk) pk = a; if (b > pk) pk = b; if (a > 0.999 || b > 0.999) clip++; s2 += L[i]*L[i] + R[i]*R[i]; }
  for (let i0 = 0; i0 + w <= n; i0 += w){ let s = 0; for (let i = i0; i < i0 + w; i++) s += L[i]*L[i] + R[i]*R[i]; st.push(+(10*Math.log10(s/(2*w) + 1e-12)).toFixed(1)); }
  const srt = st.slice().sort((a, b) => a - b), q = p => srt[Math.min(srt.length - 1, Math.floor(p*srt.length))];
  return {peakDb:+(20*Math.log10(pk + 1e-12)).toFixed(2), rmsDb:+(10*Math.log10(s2/(2*n) + 1e-12)).toFixed(2), clip, st100:st, p10:q(0.1), p50:q(0.5), p90:q(0.9), max100:srt[srt.length - 1]};
}
function auPcm(buf, ds){
  ds = ds || 1; const L = buf.getChannelData(0), R = buf.getChannelData(1), n = Math.floor(L.length/ds), I = new Int16Array(n*2);
  for (let i = 0; i < n; i++){ I[2*i] = clamp(Math.round(L[i*ds]*32767), -32768, 32767); I[2*i + 1] = clamp(Math.round(R[i*ds]*32767), -32768, 32767); }
  const u8 = new Uint8Array(I.buffer); let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
  return btoa(s);
}
async function auRender(o){
  const sr = o.sr || 44100, sec = o.sec || 8, fps = o.fps || 30, ctx = new OfflineAudioContext(2, Math.ceil(sec*sr), sr);
  // the bank (and the noise loops) are made once per sample rate and shared by the renders (time, memory)
  const C = auRender.cache && auRender.cache.sr === sr && o.cache !== false ? auRender.cache : null;
  const E = mkEngine(ctx, true, C); bedsAttach(E); engineApply(E, true);
  if (!C) auRender.cache = {sr, bank:E.bank, noise:E.noise, extra:{showRoot:E.showRoot, chantF:E.chantF}};
  if (o.pre) o.pre(E);
  const steps = Math.floor(sec*fps), tms = []; let err = null, voices = 0, vmax = 0, log = [];
  for (let k = 0; k < steps; k++){
    const tk = k/fps;
    ctx.suspend(tk).then(() => {
      try { if (o.step) o.step((o.t0 || 0) + tk, 1/fps, k, E); const a = performance.now(); direct(E, (o.t0 || 0) + tk, k ? 1/fps : 0); tms.push(performance.now() - a); voices += E.nPV; vmax = Math.max(vmax, E.nPV);
        if (o.log && k % (o.logEvery || 30) === 0) log.push(o.log(E, k)); }
      catch (e){ err = err || String(e && e.stack || e).slice(0, 600); }
      ctx.resume();
    });
  }
  const buf = await ctx.startRendering();
  const an = auAnalyse(buf), ms = tms.slice().sort((a, b) => a - b);
  return {err, an, dirMs:+(tms.reduce((a, b) => a + b, 0)/Math.max(1, tms.length)).toFixed(3), dirMs95:+(ms[Math.floor(ms.length*0.95)] || 0).toFixed(3), voicesAvg:+(voices/Math.max(1, steps)).toFixed(1), voicesMax:vmax, events:E.events, log,
    pcm:o.pcm === false ? null : auPcm(buf, o.ds || 1), sr:sr/(o.ds || 1), beds:Object.fromEntries(Object.entries(E.beds).map(([k, b]) => [k, +b.v.toFixed(3)])), scene:Object.fromEntries(Object.entries(E.S).map(([k, v]) => [k, +(+v).toFixed(3)])), trf:E.trf ? {n250:+E.trf.n250.toFixed(1), nAll:E.trf.nAll} : null, thunder:E.lastThunder || null};
}
window.SGAudio = {
  enable:() => auEnable(), disable:() => auDisable(), toggle:() => AS.on ? auDisable() : auEnable(),
  // [lm24/sound] shared contracts: one-shot effects and continuous vehicle voices (safe in any order, at any rate, sound on or off)
  fx:(name, p) => auFx(name, p),
  vehicle:(id, kind, p) => { try { return uvSet(id, kind, p); } catch (e){ return false; } },
  vehicleStop:id => { try { return uvStop(id); } catch (e){ return false; } },
  get on(){ return AS.on; }, get state(){ return LIVE ? LIVE.ctx.state : 'none'; }, get settings(){ return JSON.parse(JSON.stringify(AS)); },
  set:(g, v) => { if (!(g in AS.g)) return false; AS.g[g] = clamp(+v, 0, 1); if (LIVE) engineApply(LIVE); asSave(); sndSync(); return AS.g[g]; },
  mute:(g, m) => { if (!(g in AS.m)) return false; AS.m[g] = m === undefined ? !AS.m[g] : !!m; if (LIVE) engineApply(LIVE); asSave(); sndSync(); return AS.m[g]; },
  master:v => { AS.master = clamp(+v, 0, 1); if (LIVE) engineApply(LIVE); asSave(); sndSync(); return AS.master; },
  panel:o => { sndMenu(o === undefined ? document.getElementById('sndMenu').hidden : !!o); return true; },
  // the f1d copy's 声音 button / M key: on = true / false / null (toggle); user = from a user gesture. Returns the F1 sound state.
  f1Ext(on, user){
    if (user){ const cur = AS.on && !AS.m.f1, want = on === null || on === undefined ? !cur : !!on; AS.m.f1 = !want; if (want && !AS.on) auEnable(); else { if (LIVE) engineApply(LIVE); asSave(); } sndSync(); return want; }
    if (AS.on && LIVE && LIVE.ctx.state !== 'running' && !document.hidden) LIVE.ctx.resume().then(sndSync, sndSync);
    setTimeout(f1BtnSync, 0); return AS.on && !AS.m.f1;
  },
  stats(){ const E = LIVE; if (!E) return {state:'none', on:AS.on};
    return {state:E.ctx.state, on:AS.on, ms:+E.ms.toFixed(3), msMax:+E.msMax.toFixed(3), frames:E.frames, voices:E.nPV, pool:E.pv.length, events:E.events, err:E.err, bankLeft:E.jobs ? E.jobs.length : 0, sr:E.ctx.sampleRate,
      beds:Object.fromEntries(Object.entries(E.beds).map(([k, b]) => [k, +b.v.toFixed(3)])), scene:Object.fromEntries(Object.entries(E.S).map(([k, v]) => [k, +(+v).toFixed(3)])), alt:+E.L.alt.toFixed(1),
      byKind:E.pv.reduce((o, V) => { if (V.busy) o[V.kind] = (o[V.kind] || 0) + 1; return o; }, {}),
      area:E.A ? Object.fromEntries(['shop', 'food', 'park', 'res', 'ind', 'hw', 'cover', 'lap', 'nite', 'office', 'built', 'beach', 'tun'].map(k => [k, +E.A[k].toFixed(2)])) : null,
      landmarks:E.pv.filter(V => V.kind === 'lm' && V.busy).map(V => V.key.name + ' ' + Math.round(V.d) + ' m'), vehicles:UV.size, fxPlayed:FXS.n, fxDropped:FXS.drop, roadGrid:AR.rg ? AR.rg.seg.length/7 : 0, bldTiles:AR.bt.size}; },
  _test:{
    render:auRender, analyse:auAnalyse, direct, mkEngine, get LIVE(){ return LIVE; },
    // CPU of the director on the live engine: n calls at 60 Hz sim time
    bench(n){ const E = LIVE; if (!E) return null; while (E.jobs.length){ if (E.jobs[0]()) E.jobs.shift(); } bedsAttach(E); n = n || 120; const ms = [];
      for (let i = 0; i < n; i++){ const a = performance.now(); direct(E, performance.now()/1000, 1/60); ms.push(performance.now() - a); } ms.sort((a, b) => a - b);
      return {mean:+(ms.reduce((a, b) => a + b, 0)/n).toFixed(3), p50:+ms[n >> 1].toFixed(3), p95:+ms[Math.floor(n*0.95)].toFixed(3), max:+ms[n - 1].toFixed(3), voices:E.nPV}; },
    // per-stage cost (ms per call) of the director on the live engine over n calls at 60 Hz
    prof(n){ const E = LIVE; if (!E) return null; n = n || 300; const P = {}, st = [['listen', dt => listen(E, dt)], ['scene', dt => { if (every(E, 'scene', 0.5, dt)){ sceneSample(E); wxRead(E); } }], ['amb', dt => { if (every(E, 'amb', 0.25, dt)) ambUpdate(E); }],
        ['nat', dt => natUpdate(E, dt)], ['wx', dt => wxUpdate(E, dt)], ['traffic', dt => trafficUpdate(E, dt)], ['rail', dt => railUpdate(E, performance.now()/1000, dt)], ['air', dt => airUpdate(E, dt)], ['port', dt => portUpdate(E, dt)], ['f1', dt => f1Update(E, dt)], ['area', dt => { if (every(E, 'scene2', 0.5, dt)) areaSample(E); if (every(E, 'amb2', 0.25, dt)) areaUpdate(E); areaEvents(E, dt); }], ['lm', dt => lmUpdate(E, dt)], ['uv', dt => uvUpdate(E, dt)], ['fx', () => fxUpdate(E)], ['ui', dt => uiUpdate(E, dt)], ['sweep', () => pvSweep(E, E.ctx.currentTime)]];
      for (const [k] of st) P[k] = {sum:0, max:0};
      for (let i = 0; i < n; i++){ E.T += 1/60; for (const [k, f] of st){ const a = performance.now(); f(1/60); const d = performance.now() - a; P[k].sum += d; if (d > P[k].max) P[k].max = d; } }
      const o = {}; for (const k in P) o[k] = [+(P[k].sum/n).toFixed(4), +P[k].max.toFixed(2)]; return o; },
    // step the world like the main loop (movers, planes, monorail, the hooks) at sim time t
    step(t, dt){ try { stepMovers(t, dt); } catch (e){ /* */ } try { if (SGR.on){ if (typeof sgrStepPlanes === 'function') sgrStepPlanes(t); if (typeof sgrStepMono === 'function') sgrStepMono(t); } } catch (e){ /* */ } runHooks('frame', t, dt); },
    // vehicle positions computed here vs the traffic module's own obstacles(): max / mean distance (m)
    vehCheck(){ const T = window.SGTraffic; if (!T) return null; const L = camera.position, x = L.x, y = -L.z, ob = T.obstacles(x, y, 400), VEH = T._int.VEH; let n = 0, mx = 0, sum = 0;
      for (const V of VEH){ if (!V.alive) continue; vehPos(V, _vq); if (Math.hypot(_vq.x - x, _vq.y - y) > 380) continue; let b = 1e9; for (const o of ob) b = Math.min(b, Math.hypot(o.x - _vq.x, o.y - _vq.y)); n++; mx = Math.max(mx, b); sum += b; }
      return {n, obstacles:ob.length, maxErr:+mx.toFixed(2), meanErr:+(sum/Math.max(1, n)).toFixed(2)}; },
    // the next moment (s from t) a train passes within maxD of the camera, and which line
    // (the train is still > 4 maxD away 8 s before, so a render from dt - 6 s hears it come)
    trainPass(t, maxD, horizon){ const L = camera.position, lx = L.x, ly = -L.z; let best = null;
      const dAt = (T, tt) => { const [bs] = trainNear(T, tt, lx, ly); routeAtA(T.R, bs, _rq); return Math.hypot(_rq.x - lx, _rq.y - ly); };
      for (let dt = 0; dt < (horizon || 600); dt += 0.5){ for (const T of net.trains || []){ const d = dAt(T, t + dt); if (d < maxD && dAt(T, t + dt - Math.max(8, 4*maxD/(T.sp || 18))) > 2.5*maxD){ dAt(T, t + dt); best = {dt, d:+d.toFixed(1), line:T.R.line && T.R.line.code, kind:railKind(T), cls:_rq.cls, h:+_rq.h.toFixed(1)}; break; } } if (best) break; }
      return best; },
    // UI sounds on an engine (offline tests): click(kind, up), chime(), place(), brush(level)
    ui:{click:(E, k, up) => uiClick(E, k, up), chime:E => uiChime(E), place:E => uiPlace(E), on:E => uiChimeOn(E), brush:(E, speed) => { UIS.fake = speed > 0; UIS.v = speed || 0; }},
    UIS, railKind, vehPos, VK, RK, SP, AS,
    // [lm24/sound] area / landmark / vehicle / effect internals for the tests
    AR, UV, FXS, lmDefs, areaSample, bldMix, roadNear:(x, y, alt) => roadNear(x, y, alt, {}), poiNear:(x, y) => poiNear(x, y, {}), areaRoadsStep, auFx, uvSet, uvStop,
    LM:{sg:LM_SG, bay:LM_BAY, ny:LM_NY}, fxDirect:(E, name, x, y, z, k) => name === 'scrape' ? fxScrape(E, x, y, z, k) : fxPlay(E, name, x, y, z, k),
    // [nyc/nycapp] New York events on an engine (offline tests; call after the first direct() so the listener is set)
    ny:{siren:(E, kind) => { nySiren(E, kind || 'wail', 1); return E.lastSiren; }, horn:(E, big) => { nyHorn(E, E.L.wx + 60, E.L.wy + 20, 63, E.ctx.currentTime + 0.05, !!big, false); return true; },
      tug:E => { nyTug(E, [E.L.wx + 400, E.L.wy], 400); return true; }, ship:E => { shipHorn(E, [E.L.wx - 600, E.L.wy, 45], 600); return true; }, update:(E, dt) => nyUpdate(E, dt)}}
};
}
