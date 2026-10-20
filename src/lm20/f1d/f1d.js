// ===== City Brush v21 · lm20/f1d — F1 驾驶模式 · F1 drive mode =====
// A detailed modern F1 car (current-regulation proportions: 5.6 m × 2.0 m, halo, long low nose on a four-element front wing,
// undercut sidepods, engine cover with fin, rear wing with DRS flap and beam wing, floor and diffuser, 18-inch wheels with covers
// and coloured tyre sidewalls, mirrors, cockpit with steering wheel and helmet). Invented liveries only.
// It replaces the simple circuit cars (net.f1.im is hidden) and adds a driving mode with two choices:
//   赛道 Race  — the Marina Bay Street Circuit: start lights, lap / sector timing, ten AI cars, track limits, walls;
//   城市 Free  — start where the camera looks and drive anywhere on the real streets (flyovers and bridges: the deck nearest
//                the car's height), off-road on the ground; buildings, landmark models, the sea and the traffic are solid.
// Cameras: cockpit (drawn in an overlay pass with its own near plane: HOOKS.render), T-cam, chase. Keyboard, touch, gamepad.
// While driving the app's orbit controls, keyboard navigation, labels, tilt-shift and panels are bypassed and restored on exit.
// Test handle: window.SGF1 (enter / exit / sim / hold / state / cam / view / tp / stats).
// [lm20/f1track] per-vertex circuit widths when net.f1 carries them (startI, hl / hr white lines, wl / wr walls): the racing line, AI
// lateral moves, track limits and the race walls follow them; without them the old constants apply (10.05 m walls, 7 m lines).
// [lm22/svdrive] 硅谷开车 Silicon Valley drive (the San Francisco Bay Area map only; Singapore is unchanged): a road car instead of the
// F1 - three invented, unbranded modern cars (electric sedan, SUV, sports coupe; 4.6-5 m: body, glass, wheels, lamps, interior),
// road-car physics (1.8-2.3 t, 250-360 kW, no downforce, road tyres, ABS / ESC, automatic or single-speed, speed-sensitive steering,
// sprung body roll and pitch), head / tail / brake / reverse lamps and indicators, a light pool on the road at night, chase / bonnet /
// interior cameras (bonnet and interior in the overlay pass), a US HUD (mph, P R N D, speed-limit sign from the road class, miles),
// seven start places on real roads in the right-most lane. The F1 free drive stays as the second card (and drives in the Bay again:
// the frame hook no longer needs a circuit). Bay-only behaviour is decided at run time (SGR_BAY, tested lazily inside functions).
// Test handle additions: SGF1.enter('car', {place, car, col}), SGF1.rc, state().veh / mph / limit / prnd.
// [nyc/nycapp] 纽约开车 New York drive (the New York City map; SGR_NYC, tested lazily): the same road car with nine start places on the
// named roads heading the right way (Times Square on 7th Ave, Fifth Ave at Central Park South, FDR Drive, the West Side Highway, the
// Brooklyn Bridge towards Brooklyn, Park Ave at Grand Central, the Queensboro Bridge, the Belt Parkway by the Verrazzano, from here),
// a fourth car (an invented yellow city taxi: a generic hybrid sedan in taxi yellow with a plain roof light, no text or markings) and
// New York speed limits (the 25 mph city default; FDR / Harlem River Drive 40, the West Side Highway 30, the East River bridges 30,
// expressways and parkways 50; New Jersey / Nassau / Westchester by road class). The Bay keeps its places, cars and limits.
// [lm24/drive] v27: the car collides with everything in every mode and map (buildings on and off the roads, the landmark models' real
// faces, lamp poles, masts, parapets, piers, portals, signal poles, bus shelters, trees, the traffic both ways, the circuit walls in
// free drive too, the sea), with impulses, friction, spin and 1/240 s sub-steps; a damage model (four zones; dents, broken lamps and
// glass, a hanging bumper / lost front wing, steam, smoke and fire, less power / grip / brakes, a pull, a wreck state; R repairs);
// breakable trees and poles (window.SGBreak); hit traffic cars are knocked out of their lane, damaged, stop, hoot and are cleared
// later; no traffic during a race and nothing solid inside the circuit's walls (road-module poles there are hidden by a shader patch
// of the road paths material, the traffic module's props vetoed); a closer-to-real driving feel (brake pressure ramp, ABS per axle,
// brake balance, engine braking by gear, progressive keyboard pedals, eased steering with self-centring, a tyre curve that falls off
// past its peak, a handbrake that locks the rear wheels, reverse only from a standstill); a pickup truck, a 12 m city bus and a
// motorbike (leaning) in the road-car picker (the traffic module's models). Test handle: SGF1.crash {state, log, test, sweep, aiCheck,
// corridor, repair}.
// [lm25/net] v28 multiplayer hooks (window.SGF1.mp): remote players drawn (F1 instanced, road cars with their own lamps, the traffic
// module's models for pickup / bus / motorbike) and solid for the player's car (two-body impulses on our side; a remote that overlaps us
// when it appears stays a ghost until we are apart); the F1 race with remote players on the grid on the synchronised clock (lights,
// lap times), no AI cars, the server's standings in the timing tower; lap / finish callbacks; a grid placement; a key hook. Inert solo.
// [lm27/destruct] v30 collisions: the car can be thrown, tumble and roll over (a rigid box about its centre of mass: SGF1.crash.impulse /
// hit from the creature, blasts, debris bodies and falling buildings; heavy side hits by high vehicles; off deck edges at speed), lands
// on its wheels and drives on or stays on its roof / side until R; plastic car-car impacts at speed, glancing friction, the full
// angular response; SGBreak.blast (trees / poles in a radius fall away from it); SGF1.crash.body() for window.SGPhys.
// [lm28/drivecam] v31: fear cameras (threat: the car and the creature in one frame; bumper; side tracking; look back over the shoulder
// / from the airbox / the roof / the rear bumper / round the front; blends; speed FOV, a dolly-zoom and a heartbeat when the creature
// is close; a live rear view on the mirrors and as picture-in-picture while a creature is out), full cabins for the road cars,
// the motorbike and the bus (RCINT), a smooth capped
// collision shake, SGF1.obstacles(fn) for the army. Test handle: SGF1.cams / cam(name) / lookBack / rear / dcam / obstacles.
{
const PI = Math.PI, TAU = PI*2;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a)*t;
const wrapA = a => { a = (a + PI) % TAU; if (a < 0) a += TAU; return a - PI; };
const sstep = (a, b, x) => { const t = clamp((x - a)/(b - a), 0, 1); return t*t*(3 - 2*t); };
const gnd = (x, y) => (typeof SGRoads !== 'undefined' && SGRoads.ground) ? SGRoads.ground(x, y) : hC(x, y);
// [lm22/svdrive] the Bay Area build declares the top-level const SGR_BAY after the modules: test it lazily (never at module top level)
let IS_BAY = null;
function isBay(){ if (IS_BAY === null){ try { IS_BAY = typeof SGR_BAY !== 'undefined' && !!SGR_BAY; } catch (e){ return false; } } return IS_BAY; }
// [nyc/nycapp] the New York City build (SGR_NYC, also declared after the modules); the road car runs in both US maps
let IS_NYC = null;
function isNyc(){ if (IS_NYC === null){ try { IS_NYC = typeof SGR_NYC !== 'undefined' && !!SGR_NYC; } catch (e){ return false; } } return IS_NYC; }
const isRC = () => isBay() || isNyc();
//<PHYS>
// ---- vehicle dynamics: single-track model with load transfer, downforce, traction control and stability help.
// [lm24/drive] v27 driving feel: a tyre curve that rises like the old tanh, peaks and then falls off gently with slip (no snap, no
// instant spin); per-axle brakes behind a hydraulic ramp (~0.17 s to full pressure) with a front / rear balance and ABS (an axle's
// brake force is what its tyres hold next to the cornering force, modulated just under the limit, so the car still steers); engine
// braking by gear; a handbrake that locks the rear wheels (the rear tyres slide: braking and little side grip); steering eased near
// its target and self-centring faster with speed; reverse only from a standstill, the throttle brakes a car rolling backwards first;
// damage (env.dmg: power, grip, brakes, a pull, top speed, wreck) from the damage model.
const PH = {m:798, Iz:1000, a:1.66, b:1.94, hcg:0.30, P:760e3, CdA:1.56, rho:1.2, kDF:3.1, dfF:0.43, muF:1.62, muR:1.72, aPk:0.095, rr:0.013, g:9.81,
  gears:[0, 88, 128, 163, 198, 233, 268, 302, 345], rpmMax:12000, rpmIdle:4200, bias:0.57, bMax:6.5, eb:0.11, vmax:100};
const DMG0 = {pow:1, gripF:1, gripR:1, pull:0, brake:1, vmax:1, wreck:false};
// normalised side force of an axle vs slip (x = slip angle / peak slip): tanh-like rise, ~13 % fall-off far beyond the peak
function tyreY(x){ const ax = x < 0 ? -x : x, t = Math.tanh(ax), f = ax > 1.4 ? t*(1 - 0.13*sstep(1.4, 4.5, ax)) : t; return x < 0 ? -f : f; }
// steering: towards the target at a limited rate, eased near it; released, it self-centres (slower when parked, faster at speed)
function steerStep(C, tgt, ms, su, h, kIn, kOut, base){
  const e = tgt - C.delta, inw = Math.abs(tgt) > 1e-4 && e*tgt > 0, rate = (inw ? kIn : kOut*(0.45 + 0.55*Math.min(1, su/12)))*ms + base;
  const d = e*Math.min(1, 16*h); C.delta += d > rate*h ? rate*h : d < -rate*h ? -rate*h : d;
}
// the brake system: pressure builds up in ~0.17 s, releases in ~0.08 s
function brakeRamp(C, p, h){ const b = C.bf || 0, d = p - b; C.bf = b + (d > 6*h ? 6*h : d < -12*h ? -12*h : d); return C.bf; }
// reverse: hold the brake at a standstill (road cars: release after stopping, then press again); moving backwards the throttle is a
// brake until the car stands, then it selects drive
function revLogic(C, I, su, u, h, rc){
  if (rc){ if (I.brk > 0.5 && su > 0.6 && !C.rev) C.brkHold = true; else if (I.brk < 0.1) C.brkHold = false; }
  if (!C.rev && !(rc && C.brkHold) && I.brk > 0.5 && su < 0.5 && I.thr < 0.1){ C.revT = (C.revT || 0) + h; if (C.revT > 0.35) C.rev = true; } else if (!C.rev) C.revT = 0;
  if (C.rev && ((I.thr > 0.1 && u > -0.4) || u > 1)){ C.rev = false; C.revT = 0; }
}
// per-axle brakes with ABS: demand (balance) vs what each axle's tyres hold beside their side force; returns the braking force
function absBrakes(C, bp, dem, bias, capF, capR, h){
  if (bp < 0.002){ C.abs = false; return 0; }
  const dF = dem*bias, dR = dem*(1 - bias), k = 0.935 + 0.035*Math.sin((C.absT = (C.absT || 0) + h)*88);
  const onF = dF > capF*0.95, onR = dR > capR*0.95; C.abs = onF || onR;
  return (onF ? capF*k : dF) + (onR ? capR*k : dR);
}
function f1MaxSteer(u){ const s = Math.abs(u); return 0.36/(1 + (s/30)*(s/30)) + 0.05; }
// ---- [lm30/phys2] v33 vehicle dynamics: surfaces, vertical load, lateral load transfer, combined slip, torque curves, suspension heave
// Per vehicle (P2V): tc = traction control (1: every driven tyre stays inside its friction circle; less lets the wheels spin and trades
// side grip for it: power oversteer with rear drive, power understeer with front drive), esc = stability control (1 strict; the sports
// coupe 0.35: it lets the car slide to ~20 deg before it steps in; off for 1.3 s after the handbrake), rsF = front share of the roll
// stiffness (> 0.5: the front pair loses more grip in a turn - understeer), eps = tyre load sensitivity, shape = the engine's torque
// curve (ev: constant torque then constant power), tcm = torque-converter multiplication at stall, f / z = suspension frequency (Hz) /
// damping ratio, tr = bump travel to the bump stop (m).
const P2V = {
  f1:{tc:0.8, esc:0.8, capX:1.22, rsF:0.52, eps:0.1, track:1.6, f:3.2, z:0.5, tr:0.05},
  sedan:{tc:0.92, esc:1, rsF:0.6, eps:0.2, shape:'ev', f:1.45, z:0.4, tr:0.12},
  suv:{tc:0.95, esc:1, rsF:0.62, eps:0.22, shape:'turbo', tcm:0.9, f:1.3, z:0.38, tr:0.14},
  coupe:{tc:0.45, esc:0.35, rsF:0.53, eps:0.18, shape:'na', tcm:0.8, f:1.7, z:0.45, tr:0.10},
  taxi:{tc:0.95, esc:1, rsF:0.63, eps:0.2, shape:'na', tcm:0.9, f:1.35, z:0.36, tr:0.12},
  pickup:{tc:0.8, esc:0.9, rsF:0.6, eps:0.22, shape:'turbo', tcm:1, f:1.25, z:0.34, tr:0.16},
  bus:{tc:0.95, esc:1, rsF:0.55, eps:0.15, shape:'diesel', tcm:1.2, f:1.1, z:0.32, tr:0.12},
  moto:{tc:0.75, esc:0.85, rsF:0.5, eps:0.15, shape:'bike', tcm:0, f:1.8, z:0.42, tr:0.12}};
// torque curves: [rpm / rpm max, torque / peak torque]
const P2TQ = {na:[[0, 0.45], [0.12, 0.62], [0.4, 0.86], [0.65, 1], [0.85, 0.96], [1, 0.84]], turbo:[[0, 0.4], [0.12, 0.55], [0.24, 1], [0.7, 1], [0.86, 0.9], [1, 0.74]],
  diesel:[[0, 0.5], [0.26, 0.62], [0.42, 1], [0.65, 1], [0.85, 0.86], [1, 0.7]], bike:[[0, 0.4], [0.15, 0.55], [0.5, 0.82], [0.78, 1], [0.92, 0.96], [1, 0.88]]};
function p2Tq(S, x){ if (x <= S[0][0]) return S[0][1]; for (let i = 1; i < S.length; i++) if (x <= S[i][0]){ const a = S[i - 1], b = S[i]; return a[1] + (b[1] - a[1])*(x - a[0])/(b[0] - a[0]); } return S[S.length - 1][1]; }
// surfaces: [grip, rolling resistance (g), roughness (m), loose (dust)]
const P2S = {road:[1, 0, 0.003, 0], pave:[0.93, 0.004, 0.007, 0], service:[0.95, 0.003, 0.01, 0], track:[1, 0, 0.002, 0], kerb:[0.9, 0.004, 0.022, 0],
  grass:[0.56, 0.05, 0.028, 1], dirt:[0.63, 0.04, 0.032, 1], sand:[0.46, 0.15, 0.02, 1]};
const P2 = {rz:new Float64Array(8), ri:0, rn:0, rd:0, slope:0, rf:0, sk:'road', S:P2S.road, wet:0, rain:0, snow:0, wxT:0, load:1, air:false, spin:0, slide:0, puffT:0, kb:false, X:null, key:'', jumps:0, lands:0, hardLand:0, maxS:0, trips:0, rough:0, odoR:0, kerb:false};
// the vehicle's parameters (cached per car): the table above plus the drive-line (wheel radius, overall ratio per gear, peak torque)
function p2V(){
  const key = F1.veh === 'car' ? (RCM.key || 'sedan') : 'f1';
  if (P2.X && P2.key === key && (key === 'f1' || P2.X.P === RCP)) return P2.X;
  const X = Object.assign({tc:0.9, esc:1, rsF:0.6, eps:0.2, shape:'na', tcm:0.9, f:1.4, z:0.38, tr:0.12}, P2V[key] || {}); X.P = key === 'f1' ? PH : RCP;
  if (key !== 'f1'){ const R = RCAR[key] || RCAR.sedan, Pp = RCP; X.track = (R.g && R.g.track) || 1.6; X.rw = (R.g && R.g.r) || 0.35;
    if (Pp.gears){ const wmx = Pp.rpmMax*PI/30, S = P2TQ[X.shape] || P2TQ.na; X.S = S; X.ig = Pp.gears.map(v => v > 0 ? wmx/((v/3.6)/X.rw) : 0);
      let best = 0; for (let x = 0.1; x <= 1.0001; x += 0.01) best = Math.max(best, p2Tq(S, x)*x*wmx); X.Tpk = Pp.P/Math.max(1, best); } }
  P2.X = X; P2.key = key; return X;
}
// engine force at the wheels: an electric motor (constant torque, then constant power) or the engine's torque curve through the gear
// (and the torque converter when pulling away)
function p2Drive(C, P, X, su, thr, D){
  if (!P.gears || !X.ig) return thr*Math.min(P.Fmax, P.P*D.pow/Math.max(su, 1));
  const g = clamp(C.gear | 0, 1, 8), rpmW = su/X.rw*X.ig[g]*30/PI;
  let rpm = Math.max(P.idle, rpmW), mult = 1;
  if (X.tcm > 0 && g <= 2){ const stall = P.idle + (P.rpmMax*0.4 - P.idle)*thr; if (rpmW < stall){ rpm = stall; mult = 1 + X.tcm*(1 - rpmW/stall); } }
  if (rpmW > P.rpmMax*1.01) return 0;     // the rev limiter (top gear at the limiter)
  const T = X.Tpk*p2Tq(X.S, Math.min(1, rpm/P.rpmMax))*D.pow;
  return Math.min(thr*T*mult*X.ig[g]/X.rw*0.9, P.Fmax*1.35);
}
// a pair of tyres in a turn: the outer one carries dN more, the inner one less, and together they hold less (load sensitivity)
function p2LoadK(dn, N, eps){ const x = Math.min(1, dn/Math.max(1, N*0.5)); return 1 - eps*x*x; }
// the driven axle: a friction ellipse (capX along, capY across). TC keeps the drive force inside it beside the side force; with less
// TC the wheels spin (up to the tyre's full longitudinal grip) and the side force gives way; beyond the grip (spinning) both fall off
// -> P2A [Fx, Fy', spin]
const P2A = [0, 0, 0];
function p2Axle(dem, capX, capY, Fy, tc){
  const qy = capY > 0 ? Fy/capY : 0, lim = capX*Math.sqrt(Math.max(0, 1 - qy*qy));
  if (dem <= lim || capX <= 0){ P2A[0] = Math.min(dem, lim); P2A[1] = Fy; P2A[2] = 0; return P2A; }
  let fx = lim + (1 - tc)*(Math.min(dem, capX) - lim), fy = Fy; const over = (1 - tc)*Math.min(1, Math.max(0, dem - capX)/Math.max(capX, 1));
  if (fx > lim){ const qx = fx/capX, r = capY*Math.sqrt(Math.max(0, 1 - qx*qx)); if (Math.abs(fy) > r) fy = Math.sign(fy)*r; }
  fx *= 1 - 0.15*over; fy *= 1 - 0.55*over;
  P2A[0] = fx; P2A[1] = fy; P2A[2] = (1 - tc)*Math.min(1.5, (dem - lim)/Math.max(capX, 1)); return P2A;
}
// keyboard (digital) steering: a little more automatic counter-steer in a slide
const p2Digital = I => I.steer === 0 || I.steer === 1 || I.steer === -1;
// the land under the car: the app's nature grid (3 vegetation, 4 beach sand)
function p2Nat(x, y){ try { if (typeof nat === 'undefined' || typeof cx2i !== 'function') return 0; return nat[cx2i(y)*N + cx2i(x)]; } catch (e){ return 0; } }
// on the circuit: the red-white kerbs just outside the white lines at the corners
function p2Kerb(C){
  if (!TR || C.tri === undefined) return false; const i = C.tri | 0, d = C.trd || 0, sd = d >= 0 ? 0 : 1, H = (sd ? (TR.hr && TR.hr[i]) : (TR.hl && TR.hl[i])) || 7, a = Math.abs(d);
  if (a < H + 0.08 || a > H + 1.4) return false;
  try { const K = window.F1T && window.F1T.W && window.F1T.W.KIN; if (K && K[sd] && K[sd].length > i && (!net || !net.f1 || net.f1 === TR.F)) return K[sd][i] > 0; } catch (e){ /* */ }
  const n = TR.DX.length, i0 = (i - 3 + n) % n, i1 = (i + 3) % n; return 1 - (TR.DX[i0]*TR.DX[i1] + TR.DY[i0]*TR.DY[i1]) > 0.004;
}
// per sub-step: the surface under the car (grip, rolling resistance, roughness), rain / snow on the road, the vertical load; true when
// the car was tripped over
function surfEnv(C, race, h){
  let s;
  if (C.kind === 'ground'){ const v = p2Nat(C.x, C.y); s = v === 4 ? 'sand' : v === 5 ? 'dirt' : 'grass'; }
  else if (C.kind === 'track') s = p2Kerb(C) ? 'kerb' : 'track';
  else s = C.c === 11 ? 'service' : (C.c === 12 || SQ.k === 2) ? 'pave' : 'road';
  P2.sk = s; const S = P2.S = P2S[s] || P2S.road;
  if ((P2.wxT -= h) <= 0){ P2.wxT = 1; let r = 0, sn = 0; try { const W = window.SGWx; if (W && W.state){ const st = W.state; r = +st.rain || 0; sn = +st.snow || 0; } } catch (e){ /* optional */ } P2.rain = r; P2.snow = sn; }
  P2.wet += ((P2.rain > 0.04 ? Math.min(1, 0.45 + P2.rain) : 0) - P2.wet)*h/(P2.rain > 0.04 ? 10 : 90);
  const paved = !S[3], wetK = paved ? 1 - 0.3*P2.wet : 1 - 0.12*P2.wet, snowK = 1 - (paved ? 0.5 : 0.3)*Math.min(1, P2.snow);
  ENV.grip = S[0]*wetK*snowK; ENV.roll = S[1] + (S[3] ? 0.01*P2.wet : 0); ENV.drag = 1; ENV.load = P2.load;
  P2.kb = KEYS.size > 0 && !TOUCH.used;
  if (!P2.hooked){ P2.hooked = true; try { if (window.SGF1 && !window.SGF1.dyn) window.SGF1.dyn = p2State; } catch (e){ /* */ } }
  // a car sliding sideways off the road into soft ground digs in and is tripped over (beyond its static stability)
  const loose = !!S[3];
  if (loose && !P2.wasLoose && F1.veh === 'car' && !race && !AIR.on){ const ssf = rollSSF(), vl = Math.abs(C.v);
    if (vl > 5.4*ssf && Math.abs(Math.atan2(C.v, Math.abs(C.u) + 0.1)) > 0.5){ const sg = C.v > 0 ? 1 : -1, sn = Math.sin(C.psi), cs = Math.cos(C.psi); P2.wasLoose = loose; P2.trips++; rollStart(-sn*sg, cs*sg, vl, ssf, 'trip'); return true; } }
  P2.wasLoose = loose;
  return false;
}
// the body's vertical motion on its springs: it follows the contact through the suspension (dips load the tyres, crests unload them),
// bumps and kerbs shake it, a step down or a crest taken faster than gravity lets it follow lifts the wheels; a long flight goes to
// the rigid body (AIR: rotation, landing on any corner). Returns true when the car took off.
function vertStep(C, h, zPrev, race){
  // (the F1's downforce presses it onto its springs like more weight: it takes far more to unload its wheels at speed)
  const X = p2V(), wn = 2*PI*X.f, k = wn*wn, c = 2*X.z*wn, g = 9.81 + (F1.veh === 'car' ? 0 : PH.kDF*C.u*C.u*(ENV.df || 1)/PH.m), droop = g/k + 0.05;
  if (!(C.zb > -1e8) || Math.abs(C.zb - C.z) > 3){ C.zb = C.z; C.vzb = 0; }
  const su = Math.abs(C.u), lim = 0.55*su + 0.5;
  // roughness of the surface (and the kerb blocks) as a small vertical texture under the tyres; the tyres and the unsprung masses
  // filter it (a ~4 Hz low pass on the reference the springs work against): the body floats over fine texture, rocks on long waves
  P2.odoR += su*h; const amp = P2.S[2]*(1 + 0.5*Math.min(1, su/25)), o = P2.odoR, rough = P2.sk === 'kerb' ? amp*(Math.abs(Math.sin(o*PI/1.25)) - 0.5)*2 : amp*(Math.sin(o*1.3) + 0.6*Math.sin(o*3.1 + 1.3) + 0.4*Math.sin(o*5.9 + 2.1))*0.5;
  // the contact's rise / fall: the ramp speed comes from the surface's slope over the last 1.5 m travelled (samples every 25 cm of the
  // raw surface under the car; a jump steeper than ~19 deg between samples starts over): a ramp moves the springs' reference with its
  // speed, a step (a kerb, a seam in the data) only passes through the tyres and the springs (absorbed over ~40 ms, no launch)
  const raw = C.zs, RZ = P2.rz; P2.rd += su*h;
  if (P2.rn === 0 || Math.abs(raw - RZ[(P2.ri + 7) & 7]) > 0.015 + 0.3*P2.rd){ for (let q = 0; q < 8; q++) RZ[q] = raw; P2.rn = 1; P2.rd = 0; }
  while (P2.rd >= 0.25){ P2.rd -= 0.25; RZ[P2.ri] = raw; P2.ri = (P2.ri + 1) & 7; if (P2.rn < 8) P2.rn++; }
  const nS = Math.min(6, P2.rn - 1), slp = nS > 0 ? (RZ[(P2.ri + 7) & 7] - RZ[(P2.ri + 7 - nS) & 7])/(nS*0.25) : 0;
  const rm = 0.32*su + 0.005, kf = Math.min(1, h/0.04);
  const vRamp = clamp(clamp(slp, -0.35, 0.35)*su, -rm, rm);
  if (!(C.zf > -1e8) || Math.abs(C.zf - C.z) > 1.5){ C.zf = C.z; P2.rf = rough; }
  C.zf += vRamp*h; C.zf += (C.z - C.zf)*kf; const rfP = P2.rf; P2.rf += (rough - P2.rf)*kf; P2.rough = rough;
  const zc = C.zf + P2.rf, vg = vRamp + (P2.rf - rfP)/h; void zPrev;
  P2.slope = slp;
  const s = C.zb - zc, rel = C.vzb - vg;
  let Fm = s < droop ? g - k*s - c*rel : 0; if (Fm < 0) Fm = 0;
  C.vzb += (Fm - g)*h; C.zb += C.vzb*h;
  // the bump stop: rigid beyond the travel (a hard landing / a big step): damage from the closing speed beyond ~7 m/s
  const s2 = C.zb - zc;
  if (s2 < -X.tr){ C.zb = zc - X.tr; if (C.vzb < vg){ const imp = vg - C.vzb; C.vzb = vg; Fm = Math.max(Fm, g + Math.min(3, imp*0.4)*g);
      if (imp > 3.2){ P2.lands++; if (imp > P2.hardLand) P2.hardLand = imp; if (CRS.time - (P2.landT || 0) > 0.3){ P2.landT = CRS.time; sfx('crash', C.x, C.y, C.z, clamp((imp - 2)/10, 0.15, 0.8)); }
        if (imp > 6.5) contact(KND.GROUND, imp, 0.5*pvOf().m*(imp - 5)*(imp - 5)*0.6, 0, 0, 0, 0, 0, null); } } }
  P2.load += (clamp(Fm/g, 0, 2.3) - P2.load)*Math.min(1, h/0.03);   // the tyres' relaxation
  P2.air = Fm <= 0 && s2 > droop - 0.02; if (s2 > P2.maxS) P2.maxS = s2;
  // a real jump: the rigid body takes it (the car keeps its pitch and the pitch rate the ramp gave it)
  if (P2.air && s2 > 0.45 && su > 8 && !race && !AIR.on){
    // it leaves at the ramp's slope; the front loses its support before the rear: a nose-down turn (less the faster it goes)
    const cs = Math.cos(C.psi), sn = Math.sin(C.psi), L = F1.veh === 'car' ? RCP.a + RCP.b : PH.a + PH.b, pr = clamp(-2*L/Math.max(su, 5), -0.6, 0);
    C.pitch = C.pitchS = Math.atan(clamp(P2.slope, -0.5, 0.5)); C.dive = 0;
    C.zv = C.zb + (C.dzv || 0); P2.jumps++;
    airStart(0, 0, C.vzb, pr*sn, -pr*cs, 0, 'jump'); return true;
  }
  return false;
}
// the body's heave for the renderer (compression shown at 60 %) and the pitch rate of the wheels' plane (a ramp lip turns the car)
function p2Heave(C, dt){
  const s = (C.zb > -1e8 ? C.zb - C.z : 0); C.ptR = dt > 0 ? (C.pitchS - (C.ptP === undefined ? C.pitchS : C.ptP))/dt : 0; C.ptP = C.pitchS;
  const vib = (P2.sk === 'kerb' || P2.S[3]) && !P2.air ? P2.rough*0.6 : 0;   // the kerb blocks / rough ground shake the body (what the springs filter)
  return (s < 0 ? Math.max(s*0.6, -0.08) : Math.min(s, 3)) + vib;
}
// skid marks: dark strips on the road behind the sliding tyres (one instanced mesh, a ring of 640 segments, ~0.3 m each; they stay)
const SKM = {mesh:null, n:640, i:0, last:[null, null], M:null, used:0};
function skmInit(){
  if (SKM.mesh || typeof THREE === 'undefined' || typeof scene === 'undefined') return !!SKM.mesh;
  const g = new THREE.PlaneBufferGeometry(1, 1); g.rotateX(-PI/2);
  const m = new THREE.MeshBasicMaterial({color:0x0b0b0c, transparent:true, opacity:0.42, depthWrite:false, polygonOffset:true, polygonOffsetFactor:-2, polygonOffsetUnits:-2});
  const im = new THREE.InstancedMesh(g, m, SKM.n); im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); im.count = 0; im.frustumCulled = false; im.renderOrder = 2; im.name = 'f1skid';
  SKM.M = im.instanceMatrix.array; SKM.M.fill(0); SKM.mesh = im; scene.add(im); return true;
}
function skmAdd(k, x, y, z, w){
  const L = SKM.last[k]; if (!L){ SKM.last[k] = [x, y, z]; return; }
  const dx = x - L[0], dy = y - L[1], d = Math.hypot(dx, dy); if (d < 0.3) return; if (d > 3 || Math.abs(z - L[2]) > 0.5){ L[0] = x; L[1] = y; L[2] = z; return; }
  if (!skmInit()) return; const i = SKM.i, o = i*16, M = SKM.M, c = dx/d, s = dy/d, mx = (x + L[0])/2, my = (y + L[1])/2, mz = Math.max(z, L[2]) + 0.035;
  // three.js frame: x east, y up, -z north; the strip's local x along the motion, z across
  M[o] = c*d; M[o + 1] = 0; M[o + 2] = -s*d; M[o + 3] = 0; M[o + 4] = 0; M[o + 5] = 1; M[o + 6] = 0; M[o + 7] = 0;
  M[o + 8] = s*w; M[o + 9] = 0; M[o + 10] = c*w; M[o + 11] = 0; M[o + 12] = mx; M[o + 13] = mz; M[o + 14] = -my; M[o + 15] = 1;
  SKM.i = (i + 1) % SKM.n; SKM.used = Math.min(SKM.n, SKM.used + 1); SKM.mesh.count = SKM.used; SKM.mesh.instanceMatrix.needsUpdate = true;
  L[0] = x; L[1] = y; L[2] = z;
}
// tyre smoke (a drift, wheelspin, the handbrake), dust off loose ground, spray on a wet road, skid marks on a dry road
function tyreFx(C, dt){
  const su = Math.abs(C.u); P2.slide = 0; if (su < 2.5 || AIR.on || P2.air || !F1.on){ SKM.last[0] = SKM.last[1] = null; return; }
  const beta = Math.abs(Math.atan2(C.v, su)), sl = Math.max(beta > 0.1 ? (beta - 0.1)*4 : 0, P2.spin*1.2, INP.hb > 0.5 && su > 5 ? 0.7 : 0, C.abs && su > 12 ? 0.25 : 0);
  P2.slide = sl; const loose = P2.S[3], wet = P2.wet > 0.3 && !loose;
  { const marks = sl > 0.35 && !loose && P2.sk !== 'kerb', cs = Math.cos(C.psi), sn = Math.sin(C.psi), b = F1.veh === 'car' ? RCP.b : PH.b, tw = (p2V().track || 1.6)*0.5, z = C.z, one = F1.veh === 'car' && RCM.key === 'moto';
    for (let k = 0; k < 2; k++){ if (!marks || (one && k)){ SKM.last[k] = null; continue; } const sd = k ? 1 : -1, ox = one ? 0 : tw*sd; skmAdd(k, C.x - cs*b + sn*ox, C.y - sn*b - cs*ox, z, one ? 0.16 : F1.veh === 'car' ? 0.22 : 0.34); } }
  if (sl < 0.3 && !(loose && su > 9) && !(wet && su > 14)) return;
  if ((P2.puffT -= dt) > 0) return; P2.puffT = loose ? 0.05 : wet ? 0.07 : 0.06;
  const cs = Math.cos(C.psi), sn = Math.sin(C.psi), X = p2V(), b = F1.veh === 'car' ? RCP.b : PH.b, tw = (X.track || 1.6)*0.5, z = carZ(C);
  for (const sd of (F1.veh === 'car' && RCM.key === 'moto' ? [0] : [-1, 1])){
    const px = C.x - cs*b + sn*tw*sd, py = C.y - sn*b - cs*tw*sd;
    try { const fx = window.SGFX;
      if (loose){ if (fx && fx.dust) fx.dust(px, py, z, clamp(0.25 + su/30 + sl, 0, 1)); }
      else if (wet){ if (fx && fx.spray) fx.spray(px, py, z, clamp(su/35, 0.2, 0.9)); }
      else if (sl > 0.3 && Math.random() < clamp(sl, 0.3, 1)) smkEmit(px, py, z + 0.25, 'steam');
    } catch (e){ /* optional */ }
  }
}
// the test handle SGF1.dyn() (attached at boot and on the first drive step: the API object is not edited)
if (typeof HOOKS !== 'undefined' && HOOKS.boot) HOOKS.boot.push(() => { try { if (window.SGF1) window.SGF1.dyn = p2State; } catch (e){ /* */ } });
function p2State(){ const C = CAR; return {surface:P2.sk, grip:+ENV.grip.toFixed(3), wet:+P2.wet.toFixed(2), load:+P2.load.toFixed(2), air:P2.air, spin:+P2.spin.toFixed(2), slide:+P2.slide.toFixed(2),
  heave:+((C.zb || C.z) - C.z).toFixed(3), skid:SKM.used, vzb:+(C.vzb || 0).toFixed(2), jumps:P2.jumps, lands:P2.lands, hardLand:+P2.hardLand.toFixed(2), trips:P2.trips, gear:C.gear, rpm:Math.round(C.rpm || 0), beta:+(Math.abs(C.u) > 1 ? Math.atan2(C.v, Math.abs(C.u)) : 0).toFixed(3), r:+C.r.toFixed(3), kmh:+(C.u*3.6).toFixed(1)}; }
function f1Phys(C, I, h, env){
  // C: {u, v, r, delta, ax, rev, revT, bf}  car frame: u forward, v left, r yaw rate (CCW). I: {thr, brk, steer, hb}. env: {grip, drag, df, roll, assist, dmg, load}
  // [lm30/phys2] the vertical load (env.load: dips, crests, kerbs, a wheel in the air), lateral load transfer, combined slip at the rear
  const m = PH.m, g = PH.g, L = PH.a + PH.b, a = PH.a, b = PH.b, u = C.u, su = Math.abs(u), D = env.dmg || DMG0, X = p2V();
  const grip = env.grip, lf = env.load === undefined ? 1 : env.load;
  // steering: speed-sensitive lock, a little automatic counter-steer when the rear steps out; damage pulls to one side
  const beta = su > 6 ? Math.atan2(C.v, su) : 0, ms = f1MaxSteer(u);
  steerStep(C, clamp(I.steer + D.pull, -1, 1)*ms, ms, su, h, 7.2, 10, 0.25);
  const delta = C.delta + (su > 8 ? Math.max(-0.12, Math.min(0.12, 0.6*Math.sign(beta)*Math.max(0, Math.abs(beta) - 0.06)*env.assist)) : 0);
  const DF = PH.kDF*u*u*env.df*(0.55 + 0.45*D.gripF), ax = C.ax || 0;
  let Nf = (m*g*b/L + DF*PH.dfF)*lf - m*ax*PH.hcg*0.6/L, Nr = (m*g*a/L + DF*(1 - PH.dfF))*lf + m*ax*PH.hcg*0.6/L;
  Nf = Math.max(0.15*m*g*Math.min(1, lf), Nf); Nr = Math.max(0.15*m*g*Math.min(1, lf), Nr);
  revLogic(C, I, su, u, h, false);
  const thr = C.rev ? I.brk : I.thr, bp = brakeRamp(C, C.rev ? I.thr : I.brk, h), hb = I.hb > 0.5 && su > 0.5;
  const dN = m*Math.abs(C.ay || 0)*PH.hcg/X.track, kAF = p2LoadK(dN*X.rsF, Nf, X.eps), kAR = p2LoadK(dN*(1 - X.rsF), Nr, X.eps);
  const muF = PH.muF*grip*D.gripF*kAF, muR = PH.muR*grip*D.gripR*kAR;
  // lateral tyre forces; the handbrake locks the rear wheels: their force opposes the sliding contact patch
  let Fyf = 0, Fyr = 0, Fb = 0;
  if (su > 0.3){
    const af = Math.atan2(C.v + a*C.r, su) - delta*Math.sign(u || 1), ar = Math.atan2(C.v - b*C.r, su);
    Fyf = -muF*Nf*tyreY(af/PH.aPk);
    if (hb){ const vy = C.v - b*C.r, vp = Math.hypot(su, vy) || 1, k = 0.8*muR*Nr; Fyr = -k*vy/vp; Fb += k*su/vp; }
    else Fyr = -muR*Nr*tyreY(ar/PH.aPk);
  }
  // longitudinal: power through the rear tyres; traction control lets them spin a little (wheelspin out of slow corners costs side grip)
  let Fx = 0; P2.spin = 0;
  if (thr > 0 && !hb && !D.wreck){
    if (C.rev){ const lim = Math.sqrt(Math.max(0, (muR*Nr)*(muR*Nr) - Fyr*Fyr))*0.97; Fx = -Math.min(thr*6000, lim)*(u > -7 ? 1 : 0); }
    else { const dem = thr*PH.P*D.pow/Math.max(su, 6)*clamp((PH.vmax*D.vmax - u)/3, 0, 1), A = p2Axle(dem, muR*Nr*(X.capX || 1), muR*Nr, Fyr, P2.kb ? Math.max(0.9, X.tc) : X.tc); Fx = A[0]; Fyr = A[1]; P2.spin = A[2]; }
  }
  // brakes: balance 57 % front, ABS per axle; engine braking off the throttle (more in the low gears)
  Fb += absBrakes(C, bp, bp*PH.bMax*m*g*D.brake*Math.min(1, lf + 0.2), PH.bias, Math.sqrt(Math.max(0, (muF*Nf)*(muF*Nf) - Fyf*Fyf)), hb ? 0 : Math.sqrt(Math.max(0, (muR*Nr)*(muR*Nr) - Fyr*Fyr)), h);
  if (thr < 0.05 && !C.rev && su > 1) Fb += PH.eb*m*g*Math.min(lf, 1)*Math.min(2.2, Math.sqrt(PH.gears[8]/PH.gears[Math.max(1, Math.min(8, C.gear | 0))]));
  const Fd = 0.5*PH.rho*PH.CdA*u*su*env.drag + (su > 0.05 ? Math.sign(u)*(PH.rr*(Nf + Nr) + env.roll*m*g*Math.min(1, lf)) : 0);
  const cd = Math.cos(delta), sd = Math.sin(delta);
  let du = (Fx - Fd - Fyf*sd)/m + C.v*C.r, dv = (Fyf*cd + Fyr)/m - u*C.r, dr = (a*Fyf*cd - b*Fyr)/PH.Iz;
  // brakes never push the car backwards
  const bd = Fb/m*h;
  let nu = u + du*h; if (Fb > 0){ if (Math.abs(nu) <= bd) nu = 0; else nu -= Math.sign(nu)*bd; }
  C.ax = (nu - u)/h*0.1 + (C.ax || 0)*0.9;
  C.u = nu; C.v += dv*h; C.r += dr*h;
  // low speed: blend to the kinematic bicycle (the tyre model is singular at a standstill) - only with the wheels on the ground
  const w = Math.max(0, Math.min(1, (Math.abs(C.u) - 2)/5));
  // [lm30/phys2] ... limited to what the tyres can do (a spin or a sideways shove after a hit dies out, not at once)
  if (w < 1 && lf > 0.3){ const rk = C.u*Math.tan(delta)/L, tr = C.r*w + rk*(1 - w), tv = C.v*w + rk*b*(1 - w), aL = PH.muR*grip*lf*g, dR = aL*L*0.5*m/PH.Iz*h + 0.4*h, dV = aL*h + 0.2*h;
    C.r += clamp(tr - C.r, -dR, dR); C.v += clamp(tv - C.v, -dV, dV); }
  // stability help (ESC): keep the yaw rate near what the tyres can hold, bleed off big body-slip angles (not with the handbrake on)
  if (env.assist && su > 6 && !hb && lf > 0.3){ const rl = 1.12*PH.muR*grip*(g + DF/m)/su; if (Math.abs(C.r) > rl) C.r -= (C.r - Math.sign(C.r)*rl)*Math.min(1, 10*h); }
  if (su > 5 && lf > 0.3){ const bb = Math.atan2(C.v, su); if (Math.abs(bb) > (hb ? 0.6 : 0.2*env.assist + 0.15)) C.v *= 1 - 3*h; }
  C.ay = (Fyf*cd + Fyr)/m;
}
//</PHYS>
//<GEO>
// ---- the car model. Local frame: +X forward, +Y up, +Z right; origin on the ground under the centre of mass.
// Front axle x = +1.66, rear axle x = -1.94 (3.6 m wheelbase), wheel radius 0.36 m (720 mm tyre on an 18-inch rim).
// Vertex attributes: colour, slot (0 fixed colour, 1 livery primary, 2 secondary, 3 accent; per instance), gl (gloss 0..1, >1.5 = lamp)
const F1GEO = (() => {
  const C_CARB = [0.075, 0.08, 0.088], C_CARB2 = [0.17, 0.175, 0.18], C_TYRE = [0.06, 0.06, 0.066], C_RIM = [0.22, 0.23, 0.24], C_GLASS = [0.66, 0.74, 0.82],
        C_VISOR = [0.05, 0.06, 0.09], C_RAIN = [1, 0.12, 0.08], C_INT = [0.045, 0.047, 0.05], W = [1, 1, 1], C_DISP = [0.06, 0.14, 0.2], C_GLOVE = [0.16, 0.16, 0.17], C_HALO = [0.11, 0.115, 0.12];
  const GB = () => ({p:[], c:[], s:[], g:[], idx:[], vn:0});
  const gv = (B, x, y, z, col, slot, gl) => { B.p.push(x, y, z); B.c.push(col[0], col[1], col[2]); B.s.push(slot); B.g.push(gl); return B.vn++; };
  // +1 if triangle (a, b, c) faces away from the reference point
  function osign(B, a, b, c, rx, ry, rz){
    const P = B.p, ax = P[a*3], ay = P[a*3+1], az = P[a*3+2];
    const ux = P[b*3] - ax, uy = P[b*3+1] - ay, uz = P[b*3+2] - az, vx = P[c*3] - ax, vy = P[c*3+1] - ay, vz = P[c*3+2] - az;
    const nx = uy*vz - uz*vy, ny = uz*vx - ux*vz, nz = ux*vy - uy*vx;
    const mx = (ax + P[b*3] + P[c*3])/3 - rx, my = (ay + P[b*3+1] + P[c*3+1])/3 - ry, mz = (az + P[b*3+2] + P[c*3+2])/3 - rz, d = nx*mx + ny*my + nz*mz;
    return d > 1e-12 ? 1 : d < -1e-12 ? -1 : 0;
  }
  const gto = (B, a, b, c, rx, ry, rz) => { if (osign(B, a, b, c, rx, ry, rz) >= 0) B.idx.push(a, b, c); else B.idx.push(a, c, b); };
  // hexahedron from 8 corners (0-3 one ring, 4-7 the other, same order): flat faces
  const HF = [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]];
  function hexa(B, Q, col, slot, gl){
    let cx = 0, cy = 0, cz = 0; for (const q of Q){ cx += q[0]/8; cy += q[1]/8; cz += q[2]/8; }
    for (const f of HF){ const v = f.map(k => gv(B, Q[k][0], Q[k][1], Q[k][2], col, slot, gl)); gto(B, v[0], v[1], v[2], cx, cy, cz); gto(B, v[0], v[2], v[3], cx, cy, cz); }
  }
  const boxR = (B, x0, x1, y0, y1, z0, z1, col, slot, gl) => hexa(B, [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], col, slot, gl);
  const box = boxR;
  // a bar from p to q with a w (sideways) × t (upwards) section
  function bar(B, p, q, w, t, col, slot, gl){
    const dx = q[0] - p[0], dy = q[1] - p[1], dz = q[2] - p[2], L = Math.hypot(dx, dy, dz) || 1, ux = dx/L, uy = dy/L, uz = dz/L;
    let sx = uy*0 - uz*1, sy = uz*0 - ux*0, sz = ux*1 - uy*0; let sl = Math.hypot(sx, sy, sz); if (sl < 0.2){ sx = 0; sy = -uz; sz = uy; sl = Math.hypot(sx, sy, sz); }
    sx /= sl; sy /= sl; sz /= sl; const tx = sy*uz - sz*uy, ty = sz*ux - sx*uz, tz = sx*uy - sy*ux;
    const c = (o, a, b) => [o[0] + sx*a*w/2 + tx*b*t/2, o[1] + sy*a*w/2 + ty*b*t/2, o[2] + sz*a*w/2 + tz*b*t/2];
    hexa(B, [c(p, -1, -1), c(p, 1, -1), c(p, 1, 1), c(p, -1, 1), c(q, -1, -1), c(q, 1, -1), c(q, 1, 1), c(q, -1, 1)], col, slot, gl);
  }
  // a wing element from z = za to zb: leading edge (x, y) at each end, chord, angle of attack (trailing edge higher), thickness
  function wing(B, za, xa, ya, zb, xb, yb, ch, ang, t, col, slot, gl){
    const cx = ch*Math.cos(ang), cy = ch*Math.sin(ang);
    hexa(B, [[xa, ya, za], [xa - cx, ya + cy, za], [xb - cx, yb + cy, zb], [xb, yb, zb], [xa, ya + t, za], [xa - cx, ya + cy + t, za], [xb - cx, yb + cy + t, zb], [xb, yb + t, zb]], col, slot, gl);
  }
  // lofted surface through rings [[y, z], ...] at stations x; smooth normals; optional flat end caps
  function loft(B, secs, colFn, capA, capB){
    const M = secs[0].r.length, v0 = B.vn, K = secs.length;
    const cen = secs.map(s => { let y = 0, z = 0; for (const p of s.r){ y += p[0]; z += p[1]; } return [s.x, y/M, z/M]; });
    for (let i = 0; i < K; i++){ const s = secs[i]; for (let j = 0; j < M; j++){ const p = s.r[j], c = colFn(s.x, p[0], p[1], j, s); gv(B, s.x, p[0], p[1], c[0], c[1], c[2]); } }
    let vote = 0; const Q = [];
    for (let i = 0; i < K - 1; i++) for (let j = 0; j < M; j++){
      const a = v0 + i*M + j, b = v0 + i*M + (j + 1) % M, c = v0 + (i + 1)*M + (j + 1) % M, d = v0 + (i + 1)*M + j; Q.push(a, b, c, d);
      const rx = (cen[i][0] + cen[i+1][0])/2, ry = (cen[i][1] + cen[i+1][1])/2, rz = (cen[i][2] + cen[i+1][2])/2;
      vote += osign(B, a, b, c, rx, ry, rz) + osign(B, a, c, d, rx, ry, rz);
    }
    for (let q = 0; q < Q.length; q += 4){ const a = Q[q], b = Q[q+1], c = Q[q+2], d = Q[q+3]; if (vote >= 0) B.idx.push(a, b, c, a, c, d); else B.idx.push(a, c, b, a, d, c); }
    const cap = (i, ref, col, slot, gl) => { const s = secs[i], o = cen[i], cv = gv(B, o[0], o[1], o[2], col, slot, gl), R = s.r.map(p => gv(B, s.x, p[0], p[1], col, slot, gl));
      for (let j = 0; j < M; j++) gto(B, cv, R[j], R[(j + 1) % M], ref[0], ref[1], ref[2]); };
    if (capA) cap(0, cen[1], capA[0], capA[1], capA[2]);
    if (capB) cap(K - 1, cen[K - 2], capB[0], capB[1], capB[2]);
  }
  // surface of revolution: profile [[r, a]] around axis 'y' (a = height) or 'z' (a = depth); closed = the profile is a loop
  function lathe(B, prof, axis, o, segs, colFn, closed, refR){
    const M = prof.length, v0 = B.vn;
    for (let k = 0; k < segs; k++){ const t = k/segs*TAU, ct = Math.cos(t), st = Math.sin(t);
      for (let j = 0; j < M; j++){ const r = prof[j][0], a = prof[j][1], c = colFn(r, a, t, j, k);
        if (axis === 'y') gv(B, o[0] + r*ct, o[1] + a, o[2] + r*st, c[0], c[1], c[2]); else gv(B, o[0] + r*ct, o[1] + r*st, o[2] + a, c[0], c[1], c[2]); } }
    let ra = 0; for (const p of prof) ra += p[1]/M;
    for (let k = 0; k < segs; k++){ const t = (k + 0.5)/segs*TAU, ct = Math.cos(t), st = Math.sin(t), k2 = (k + 1) % segs;
      const ref = axis === 'y' ? [o[0] + refR*ct, o[1] + ra, o[2] + refR*st] : [o[0] + refR*ct, o[1] + refR*st, o[2] + ra];
      for (let j = 0; j < (closed ? M : M - 1); j++){ const j2 = (j + 1) % M, a = v0 + k*M + j, b = v0 + k*M + j2, c = v0 + k2*M + j2, d = v0 + k2*M + j;
        gto(B, a, b, c, ref[0], ref[1], ref[2]); gto(B, a, c, d, ref[0], ref[1], ref[2]); } }
  }
  // a tube along a path (no caps); rz squashes the section vertically
  function tube(B, path, r, sides, rz, col, slot, gl){
    const v0 = B.vn, n = path.length;
    for (let i = 0; i < n; i++){
      const a = path[Math.max(0, i - 1)], b = path[Math.min(n - 1, i + 1)]; let tx = b[0] - a[0], ty = b[1] - a[1], tz = b[2] - a[2]; const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
      let nx = -tz, ny = 0, nz = tx; let nl = Math.hypot(nx, nz); if (nl < 0.1){ nx = 0; ny = tz; nz = -ty; nl = Math.hypot(ny, nz); } nx /= nl; ny /= nl; nz /= nl;
      const bx = ty*nz - tz*ny, by = tz*nx - tx*nz, bz = tx*ny - ty*nx;
      for (let k = 0; k < sides; k++){ const q = k/sides*TAU, c = Math.cos(q)*r, s = Math.sin(q)*r*rz, p = path[i];
        const wy = by >= 0 ? 1 : -1;   // keep the squash axis vertical-ish
        gv(B, p[0] + nx*c + bx*s*wy, p[1] + ny*c + by*s*wy, p[2] + nz*c + bz*s*wy, col, slot, gl); }
    }
    for (let i = 0; i < n - 1; i++){ const p = path[i], q = path[i + 1], rx = (p[0] + q[0])/2, ry = (p[1] + q[1])/2, rzz = (p[2] + q[2])/2;
      for (let k = 0; k < sides; k++){ const k2 = (k + 1) % sides, a = v0 + i*sides + k, b = v0 + i*sides + k2, c = v0 + (i + 1)*sides + k2, d = v0 + (i + 1)*sides + k;
        gto(B, a, b, c, rx, ry, rzz); gto(B, a, c, d, rx, ry, rzz); } }
  }
  // Catmull-Rom subdivision of key rows (each row: numbers; row[0] is the station)
  function crKeys(K, sub){
    const out = [], n = K.length;
    for (let i = 0; i < n - 1; i++){ const p0 = K[Math.max(0, i - 1)], p1 = K[i], p2 = K[i + 1], p3 = K[Math.min(n - 1, i + 2)];
      for (let s = 0; s < sub; s++){ const t = s/sub, t2 = t*t, t3 = t2*t;
        out.push(p1.map((_, k) => 0.5*(2*p1[k] + (-p0[k] + p2[k])*t + (2*p0[k] - 5*p1[k] + 4*p2[k] - p3[k])*t2 + (-p0[k] + 3*p1[k] - 3*p2[k] + p3[k])*t3))); } }
    out.push(K[n - 1].slice()); return out;
  }
  const crPath = (P, sub) => crKeys(P, sub);
  // chassis / nose / engine cover cross-section: 22 points, bottom centre first; dip = cockpit opening depth
  function bodyRing(w, yb, yt, dip){
    const h = yt - yb, dw = dip > 0.02 ? Math.min(0.215, 0.52*w) : 0.40*w;
    const half = [[yb, 0], [yb, 0.45*w], [yb + 0.012, 0.80*w], [yb + 0.10*h, 0.965*w], [yb + 0.34*h, w], [yb + 0.60*h, 0.975*w], [yb + 0.82*h, 0.90*w], [yb + 0.95*h, 0.75*w],
                  [yt, 0.60*w], [yt - dip*0.75, dw], [yt - dip, dw*0.55], [yt - dip, 0]];
    const R = half.map(p => [p[0], p[1]]); for (let j = half.length - 2; j >= 1; j--) R.push([half[j][0], -half[j][1]]); return R;
  }
  // sidepod section: boxy, undercut below the middle
  function podRing(cz, hw, yb, yt){
    const R = [], M = 18, ym = yb + (yt - yb)*0.56;
    for (let j = 0; j < M; j++){ const t = j/M*TAU, c = Math.cos(t), s = Math.sin(t), e = 2/3.4, sy = Math.sign(s)*Math.pow(Math.abs(s), e), sz = Math.sign(c)*Math.pow(Math.abs(c), e);
      const y = s >= 0 ? ym + sy*(yt - ym) : ym + sy*(ym - yb), w = hw*(s >= 0 ? 1 : 0.6 + 0.4*(1 + sy)); R.push([y, cz + sz*w]); }
    return R;
  }
  // body stations: [x, half width, bottom, top, cockpit dip]
  const BK = [[2.74, 0.06, 0.232, 0.268, 0], [2.62, 0.10, 0.208, 0.302, 0], [2.38, 0.142, 0.192, 0.355, 0], [2.04, 0.182, 0.18, 0.418, 0],
    [1.68, 0.222, 0.17, 0.482, 0], [1.32, 0.268, 0.155, 0.545, 0], [0.96, 0.318, 0.14, 0.605, 0], [0.64, 0.368, 0.126, 0.66, 0],
    [0.44, 0.404, 0.12, 0.692, 0], [0.30, 0.42, 0.12, 0.70, 0.20], [0.06, 0.43, 0.12, 0.705, 0.27], [-0.24, 0.43, 0.12, 0.712, 0.27],
    [-0.44, 0.425, 0.12, 0.725, 0.15], [-0.56, 0.42, 0.12, 0.79, 0], [-0.68, 0.40, 0.12, 0.925, 0], [-0.86, 0.33, 0.12, 0.962, 0],
    [-1.10, 0.30, 0.12, 0.87, 0], [-1.40, 0.27, 0.12, 0.74, 0], [-1.74, 0.22, 0.13, 0.585, 0], [-2.04, 0.16, 0.16, 0.465, 0],
    [-2.30, 0.11, 0.20, 0.38, 0], [-2.50, 0.065, 0.24, 0.33, 0]];
  const topAt = x => { for (let i = 0; i < BK.length - 1; i++){ const a = BK[i], b = BK[i + 1]; if (x <= a[0] && x >= b[0]){ const t = (a[0] - x)/(a[0] - b[0]); return a[3] + (b[3] - a[3])*t; } } return 0.3; };

  function buildBody(){
    const B = GB();
    // monocoque, nose and engine cover in one loft
    const secs = crKeys(BK, 3).map(k => { const dip = Math.max(0, k[4]); return {x:k[0], w:k[1], yb:k[2], yt:k[3], dip, r:bodyRing(k[1], k[2], k[3], dip)}; });
    loft(B, secs, (x, y, z, j, s) => {
      if (s.dip > 0.03 && j >= 9 && j <= 13) return [C_INT, 0, 0.1];
      const h = s.yt - s.yb;
      if (y < s.yb + 0.013) return [C_CARB, 0, 0.35];
      if (x > 2.44) return [W, 3, 0.9];
      if (Math.abs(z) < 0.04 && y > s.yt - 0.02 && x > 0.5 && x <= 2.44) return [W, 3, 0.9];
      if (x < -0.62 && x > -1.0 && y > s.yt - 0.07) return [W, 3, 0.9];
      if (y < s.yb + 0.36*h) return [W, 2, 0.85];
      return [W, 1, 0.92];
    }, [W, 3, 0.8], [C_CARB, 0, 0.4]);
    // sidepods (undercut, coke-bottle taper), black inlets
    const PK = [[0.40, 0.60, 0.16, 0.17, 0.50], [0.26, 0.61, 0.19, 0.15, 0.548], [0.02, 0.625, 0.19, 0.14, 0.565], [-0.38, 0.605, 0.18, 0.13, 0.545],
                [-0.78, 0.555, 0.158, 0.13, 0.48], [-1.12, 0.49, 0.122, 0.13, 0.40], [-1.42, 0.41, 0.075, 0.13, 0.31], [-1.66, 0.34, 0.035, 0.13, 0.235]];
    for (const sd of [-1, 1]){
      const ps = crKeys(PK, 2).map(k => ({x:k[0], yb:k[3], yt:k[4], r:podRing(k[1]*sd, k[2], k[3], k[4]).map(p => [p[0], p[1]])}));
      loft(B, ps, (x, y, z, j, s) => { const h = s.yt - s.yb; if (y < s.yb + 0.03) return [C_CARB, 0, 0.3]; if (y > s.yb + 0.6*h) return [W, 1, 0.92]; return [W, 2, 0.85]; },
        [C_INT, 0, 0.1], [W, 2, 0.6]);
      // inlet lip (overhanging top edge of the inlet)
      box(B, 0.39, 0.43, 0.49, 0.525, sd > 0 ? 0.44 : -0.77, sd > 0 ? 0.77 : -0.44, W, 1, 0.9);
    }
    // floor with the cut-outs ahead of the rear tyres
    const FL = [[1.08, -0.30], [0.80, -0.64], [0.38, -0.86], [-1.28, -0.88], [-1.52, -0.62], [-2.30, -0.57], [-2.30, 0.57], [-1.52, 0.62], [-1.28, 0.88], [0.38, 0.86], [0.80, 0.64], [1.08, 0.30]];
    slab(B, FL, 0.045, 0.072, C_CARB, 0, 0.3);
    // floor edge fences
    for (const sd of [-1, 1]) hexa(B, [[0.38, 0.07, sd*0.83], [-1.25, 0.07, sd*0.85], [-1.25, 0.07, sd*0.87], [0.38, 0.07, sd*0.85], [0.38, 0.15, sd*0.83], [-1.25, 0.10, sd*0.85], [-1.25, 0.10, sd*0.87], [0.38, 0.15, sd*0.85]], C_CARB, 0, 0.3);
    // diffuser: ramp and strakes
    hexa(B, [[-1.50, 0.05, -0.55], [-2.40, 0.31, -0.55], [-2.40, 0.31, 0.55], [-1.50, 0.05, 0.55], [-1.50, 0.066, -0.55], [-2.40, 0.326, -0.55], [-2.40, 0.326, 0.55], [-1.50, 0.066, 0.55]], C_CARB, 0, 0.3);
    for (const z of [-0.54, -0.36, -0.16, 0.16, 0.36, 0.54]) hexa(B, [[-1.56, 0.03, z - 0.006], [-2.40, 0.03, z - 0.006], [-2.40, 0.03, z + 0.006], [-1.56, 0.03, z + 0.006], [-1.56, 0.07, z - 0.006], [-2.40, 0.31, z - 0.006], [-2.40, 0.31, z + 0.006], [-1.56, 0.07, z + 0.006]], C_CARB, 0, 0.3);
    // front wing: four elements sweeping up into the endplates
    const ZS = [-0.975, -0.92, -0.80, -0.64, -0.45, -0.22, 0, 0.22, 0.45, 0.64, 0.80, 0.92, 0.975];
    const FE = [{x:2.88, ch:0.30, y:0.072, ang:0.08, t:0.022, rise:0.025, sw:0.00, slot:2}, {x:2.60, ch:0.205, y:0.112, ang:0.30, t:0.018, rise:0.07, sw:0.10, slot:1},
                {x:2.42, ch:0.175, y:0.165, ang:0.46, t:0.016, rise:0.10, sw:0.14, slot:1}, {x:2.27, ch:0.15, y:0.228, ang:0.62, t:0.015, rise:0.12, sw:0.18, slot:3}];
    for (const e of FE){ const at = z => { const f = clamp((Math.abs(z) - 0.42)/0.555, 0, 1); return [e.x - e.sw*f, e.y + e.rise*f*f]; };
      for (let i = 0; i < ZS.length - 1; i++){ const a = at(ZS[i]), b = at(ZS[i + 1]); wing(B, ZS[i], a[0], a[1], ZS[i + 1], b[0], b[1], e.ch, e.ang, e.t, W, e.slot, 0.85); } }
    for (const sd of [-1, 1]){ const z0 = sd*0.968, z1 = sd*0.988;
      hexa(B, [[2.90, 0.035, z0], [2.18, 0.05, z0], [2.18, 0.05, z1], [2.90, 0.035, z1], [2.90, 0.19, z0], [2.18, 0.36, z0], [2.18, 0.36, z1], [2.90, 0.19, z1]], W, 2, 0.85); }
    // nose pillars down to the mainplane
    for (const sd of [-1, 1]) hexa(B, [[2.70, 0.09, sd*0.05], [2.50, 0.10, sd*0.05], [2.50, 0.10, sd*0.065], [2.70, 0.09, sd*0.065], [2.66, 0.24, sd*0.05], [2.46, 0.22, sd*0.05], [2.46, 0.22, sd*0.065], [2.66, 0.24, sd*0.065]], C_CARB, 0, 0.4);
    // front wheel deflectors above the front tyres
    for (const sd of [-1, 1]){ const pt = (th, r) => [1.66 + r*Math.cos(th*PI/180), 0.36 + r*Math.sin(th*PI/180)];
      for (const [t0, t1] of [[62, 84], [84, 106]]){ const a = pt(t0, 0.41), b = pt(t1, 0.41), za = sd*0.70, zb = sd*0.93;
        hexa(B, [[a[0], a[1], za], [b[0], b[1], za], [b[0], b[1], zb], [a[0], a[1], zb], [a[0], a[1] + 0.012, za], [b[0], b[1] + 0.012, za], [b[0], b[1] + 0.012, zb], [a[0], a[1] + 0.012, zb]], W, 2, 0.8); } }
    // suspension: wishbones, push / pull rods, track rods (front at x 1.66, rear at x -1.94)
    for (const sd of [-1, 1]){ const z = v => v*sd, k = C_CARB;
      bar(B, [1.92, 0.47, z(0.19)], [1.70, 0.50, z(0.62)], 0.045, 0.014, k, 0, 0.4); bar(B, [1.40, 0.46, z(0.21)], [1.64, 0.50, z(0.62)], 0.045, 0.014, k, 0, 0.4);
      bar(B, [1.98, 0.23, z(0.16)], [1.68, 0.22, z(0.64)], 0.05, 0.016, k, 0, 0.4); bar(B, [1.30, 0.22, z(0.18)], [1.64, 0.22, z(0.64)], 0.05, 0.016, k, 0, 0.4);
      bar(B, [1.62, 0.27, z(0.58)], [1.50, 0.50, z(0.20)], 0.035, 0.02, k, 0, 0.4); bar(B, [1.86, 0.36, z(0.18)], [1.80, 0.36, z(0.62)], 0.03, 0.012, k, 0, 0.4);
      bar(B, [-1.70, 0.50, z(0.13)], [-1.92, 0.54, z(0.56)], 0.045, 0.014, k, 0, 0.4); bar(B, [-2.20, 0.50, z(0.12)], [-1.96, 0.54, z(0.56)], 0.045, 0.014, k, 0, 0.4);
      bar(B, [-1.62, 0.21, z(0.13)], [-1.92, 0.20, z(0.58)], 0.05, 0.016, k, 0, 0.4); bar(B, [-2.24, 0.22, z(0.12)], [-1.97, 0.20, z(0.58)], 0.05, 0.016, k, 0, 0.4);
      bar(B, [-1.90, 0.25, z(0.52)], [-1.80, 0.48, z(0.15)], 0.035, 0.02, k, 0, 0.4); bar(B, [-2.12, 0.36, z(0.13)], [-2.06, 0.36, z(0.56)], 0.03, 0.012, k, 0, 0.4); }
    // rear wing: endplates, mainplane, DRS flap, beam wing, central pylon
    for (const sd of [-1, 1]){ const z0 = sd*0.462, z1 = sd*0.482;
      hexa(B, [[-2.28, 0.40, z0], [-2.80, 0.42, z0], [-2.80, 0.42, z1], [-2.28, 0.40, z1], [-2.40, 0.975, z0], [-2.80, 0.99, z0], [-2.80, 0.99, z1], [-2.40, 0.975, z1]], W, 2, 0.85); }
    const RZ = [-0.462, -0.30, 0, 0.30, 0.462];
    for (let i = 0; i < RZ.length - 1; i++){ const ya = 0.745 + 0.03*Math.abs(RZ[i])/0.462, yb = 0.745 + 0.03*Math.abs(RZ[i + 1])/0.462;
      wing(B, RZ[i], -2.30, ya, RZ[i + 1], -2.30, yb, 0.30, 0.22, 0.028, W, 1, 0.9);
      wing(B, RZ[i], -2.50, ya + 0.115, RZ[i + 1], -2.50, yb + 0.115, 0.23, 0.58, 0.018, W, 3, 0.9); }
    wing(B, -0.40, -2.30, 0.395, 0.40, -2.30, 0.395, 0.13, 0.30, 0.016, C_CARB, 0, 0.4);
    wing(B, -0.40, -2.43, 0.455, 0.40, -2.43, 0.455, 0.12, 0.55, 0.016, C_CARB, 0, 0.4);
    hexa(B, [[-2.34, 0.30, -0.008], [-2.46, 0.30, -0.008], [-2.46, 0.30, 0.008], [-2.34, 0.30, 0.008], [-2.42, 0.76, -0.008], [-2.53, 0.76, -0.008], [-2.53, 0.76, 0.008], [-2.42, 0.76, 0.008]], C_CARB, 0, 0.4);
    // rain light
    box(B, -2.535, -2.49, 0.262, 0.312, -0.036, 0.036, C_RAIN, 0, 2.5);
    // engine cover fin
    const FX = [-0.92, -1.15, -1.40, -1.62, -1.84, -2.06];
    for (let i = 0; i < FX.length - 1; i++){ const xa = FX[i], xb = FX[i + 1], ta = 0.955 + (xa + 0.92)*0.31, tb = 0.955 + (xb + 0.92)*0.31, ba = topAt(xa) - 0.02, bb = topAt(xb) - 0.02;
      hexa(B, [[xa, ba, -0.006], [xb, bb, -0.006], [xb, bb, 0.006], [xa, ba, 0.006], [xa, ta, -0.006], [xb, tb, -0.006], [xb, tb, 0.006], [xa, ta, 0.006]], W, 3, 0.9); }
    // airbox inlet and the T-cam pod on top of it
    hexa(B, [[-0.62, 0.835, -0.095], [-0.67, 0.835, -0.095], [-0.67, 0.835, 0.095], [-0.62, 0.835, 0.095], [-0.645, 0.915, -0.07], [-0.695, 0.915, -0.07], [-0.695, 0.915, 0.07], [-0.645, 0.915, 0.07]], C_INT, 0, 0.1);
    box(B, -0.98, -0.80, 0.955, 1.002, -0.032, 0.032, W, 3, 0.9);
    // halo: hoop around the head and the central pillar
    const HL = [[-0.50, 0.70, -0.25], [-0.44, 0.83, -0.27], [-0.30, 0.925, -0.265], [-0.10, 0.955, -0.23], [0.06, 0.962, -0.165], [0.155, 0.962, -0.085], [0.185, 0.962, 0],
                [0.155, 0.962, 0.085], [0.06, 0.962, 0.165], [-0.10, 0.955, 0.23], [-0.30, 0.925, 0.265], [-0.44, 0.83, 0.27], [-0.50, 0.70, 0.25]];
    tube(B, crPath(HL, 3), 0.031, 10, 0.8, C_HALO, 0, 0.7);
    tube(B, crPath([[0.18, 0.962, 0], [0.26, 0.935, 0], [0.36, 0.845, 0], [0.45, 0.745, 0], [0.52, 0.69, 0]], 3), 0.024, 8, 1.0, C_HALO, 0, 0.7);
    // mirrors: housings on posts, glass facing the driver
    for (const sd of [-1, 1]){ const z0 = sd*0.455, z1 = sd*0.60;
      box(B, 0.36, 0.415, 0.648, 0.695, Math.min(z0, z1), Math.max(z0, z1), W, 1, 0.9);
      box(B, 0.354, 0.361, 0.653, 0.69, Math.min(sd*0.462, sd*0.593), Math.max(sd*0.462, sd*0.593), C_GLASS, 0, 1.0);
      bar(B, [0.40, 0.535, sd*0.52], [0.392, 0.652, sd*0.525], 0.018, 0.03, C_CARB, 0, 0.4); }
    // headrest pads beside the helmet
    for (const sd of [-1, 1]) box(B, -0.50, -0.14, 0.63, 0.775, Math.min(sd*0.158, sd*0.215), Math.max(sd*0.158, sd*0.215), C_CARB2, 0, 0.2);
    const nNoHelmet = B.idx.length;
    // helmet (last: the cockpit view leaves it out)
    const HR = 0.136, hp = []; for (let i = 0; i <= 9; i++){ const ph = (-62 + i*152/9)*PI/180; hp.push([Math.max(0, HR*Math.cos(ph)), HR*Math.sin(ph)*1.04]); }
    lathe(B, hp, 'y', [-0.33, 0.865, 0], 16, (r, a, t) => { const fr = Math.cos(t); if (a > -0.022 && a < 0.046 && fr > 0.25) return [C_VISOR, 0, 1.0]; if (a > 0.09) return [W, 1, 0.9]; return [W, 3, 0.9]; }, false, 0);
    return {B, nNoHelmet};
  }
  function slab(B, pts, y0, y1, col, slot, gl){
    const V2 = pts.map(p => new THREE.Vector2(p[0], p[1])), tris = THREE.ShapeUtils.triangulateShape(V2, []);
    const top = pts.map(p => gv(B, p[0], y1, p[1], col, slot, gl)), bot = pts.map(p => gv(B, p[0], y0, p[1], col, slot, gl));
    for (const t of tris){ const cx = (pts[t[0]][0] + pts[t[1]][0] + pts[t[2]][0])/3, cz = (pts[t[0]][1] + pts[t[1]][1] + pts[t[2]][1])/3;
      gto(B, top[t[0]], top[t[1]], top[t[2]], cx, y0 - 1, cz); gto(B, bot[t[0]], bot[t[1]], bot[t[2]], cx, y1 + 1, cz); }
    let A = 0; for (let i = 0; i < pts.length; i++){ const a = pts[i], b = pts[(i + 1) % pts.length]; A += a[0]*b[1] - b[0]*a[1]; }
    const sg = A > 0 ? 1 : -1;
    for (let i = 0; i < pts.length; i++){ const a = pts[i], b = pts[(i + 1) % pts.length], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1, ix = -dz/l*sg*0.05, iz = dx/l*sg*0.05;
      const v = [gv(B, a[0], y0, a[1], col, slot, gl), gv(B, b[0], y0, b[1], col, slot, gl), gv(B, b[0], y1, b[1], col, slot, gl), gv(B, a[0], y1, a[1], col, slot, gl)];
      const rx = (a[0] + b[0])/2 + ix, rz = (a[1] + b[1])/2 + iz, ry = (y0 + y1)/2; gto(B, v[0], v[1], v[2], rx, ry, rz); gto(B, v[0], v[2], v[3], rx, ry, rz); }
  }
  // 18-inch wheel: slick tyre (sidewall stripe = compound colour, slot 1), wheel cover with a three-blade pattern; axle along Z, outer face +Z
  function buildWheel(){
    const B = GB();
    const TP = [[0.234, 0.168], [0.25, 0.181], [0.266, 0.188], [0.272, 0.19], [0.292, 0.194], [0.30, 0.195], [0.318, 0.192], [0.334, 0.187], [0.348, 0.172], [0.356, 0.15],
                [0.3605, 0.10], [0.362, 0.0], [0.3605, -0.10], [0.356, -0.15], [0.348, -0.172], [0.334, -0.187], [0.30, -0.195], [0.266, -0.188], [0.234, -0.168]];
    lathe(B, TP, 'z', [0, 0, 0], 26, (r, a) => (a > 0.15 && r > 0.269 && r < 0.296) ? [W, 1, 0.35] : (r < 0.24 ? [C_RIM, 0, 0.6] : [C_TYRE, 0, 0.22]), true, 0.30);
    const segs = 24;
    lathe(B, [[0, 0.158], [0.05, 0.16], [0.155, 0.168], [0.17, 0.171], [0.205, 0.173], [0.236, 0.169]], 'z', [0, 0, 0], segs, (r, a, t, j, k) => {
      if (r >= 0.168 && r <= 0.206) return [W, 2, 0.9];
      if (r > 0.03 && r < 0.16 && (k % 8) < 2) return [W, 3, 0.9];
      return [C_RIM, 0, 0.8]; }, false, 0);
    lathe(B, [[0, -0.158], [0.236, -0.169]], 'z', [0, 0, 0], 16, () => [C_CARB2, 0, 0.3], false, 0);
    return B;
  }
  // steering wheel with gloves; local frame: X toward the nose (the face looks at the driver), centre at the origin
  function buildSteer(){
    const B = GB(), k = 0.8, box = (B, x0, x1, y0, y1, z0, z1, col, slot, gl) => boxR(B, x0*k, x1*k, y0*k, y1*k, z0*k, z1*k, col, slot, gl);
    box(B, -0.014, 0.014, -0.062, 0.056, -0.112, 0.112, C_CARB, 0, 0.5);
    for (const sd of [-1, 1]){ const za = sd*0.104, zb = sd*0.152;
      box(B, -0.03, 0.022, -0.088, 0.07, Math.min(za, zb), Math.max(za, zb), C_CARB2, 0, 0.3);
      box(B, -0.075, -0.012, -0.045, 0.06, Math.min(sd*0.097, sd*0.165), Math.max(sd*0.097, sd*0.165), W, 1, 0.35);
      box(B, -0.045, -0.012, 0.058, 0.08, Math.min(sd*0.03, sd*0.095), Math.max(sd*0.03, sd*0.095), C_CARB2, 0, 0.3); }
    box(B, -0.02, -0.013, -0.028, 0.034, -0.052, 0.052, C_DISP, 0, 1.0);
    for (let k = 0; k < 15; k++){ const z = -0.07 + k*0.01, col = k < 5 ? [0.1, 0.9, 0.3] : k < 10 ? [1, 0.15, 0.1] : [0.25, 0.5, 1]; box(B, -0.02, -0.014, 0.041, 0.05, z - 0.0035, z + 0.0035, col, 0, 0.5); }
    for (const [y, z, c] of [[-0.045, -0.07, [0.9, 0.7, 0.1]], [-0.045, 0.07, [0.2, 0.6, 1]], [-0.05, -0.03, [0.9, 0.9, 0.9]], [-0.05, 0.03, [0.9, 0.2, 0.2]]]) box(B, -0.022, -0.013, y - 0.008, y + 0.008, z - 0.008, z + 0.008, c, 0, 0.6);
    return B;
  }
  function toGeo(B){
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(B.p, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(B.c, 3));
    g.setAttribute('slot', new THREE.Float32BufferAttribute(B.s, 1)); g.setAttribute('gl', new THREE.Float32BufferAttribute(B.g, 1));
    g.setIndex(B.idx); g.computeVertexNormals(); g.computeBoundingSphere(); return g;
  }
  function build(){ const b = buildBody(), w = buildWheel(), s = buildSteer(); return {body:toGeo(b.B), nNoHelmet:b.nNoHelmet, wheel:toGeo(w), steer:toGeo(s)}; }
  return {build, H:{GB, gv, gto, hexa, boxR, bar, loft, lathe, tube, crKeys, slab, toGeo}};
})();
//</GEO>
//<RCAR>
/* ================= [lm22/svdrive] road cars: specs, physics, geometry ================= */
// ph (SI): m mass, Iz yaw inertia, a / b centre of mass -> front / rear axle, hcg height of the centre of mass, P peak power, Fmax the
// motor / first-gear force cap at the wheels, CdA, road tyres mu (no downforce), aPk tyre peak slip angle, drive = front share of the
// drive (0 rear, 0.5 all-wheel), vmax limiter, vrev reverse limit, coast = regen / engine braking (g), lock = road-wheel steering lock,
// roll / pitch = body attitude per m/s2, gears = km/h at the rev limit per gear (automatic) or null (single-speed electric)
// g: the body: LB lower-body keys [x, half width, bottom, top (bonnet / belt / deck), crown]; GH greenhouse keys [x, roof y (null: the
// belt), roof half width, crown]; ws / rw windscreen and rear window x ranges; win side windows; cP: pillar behind it painted; doors
// (gap x), handles, mirror x, head / tail lamp (x range, ring range f), eye (driver, left-hand drive), bonnet camera x, chase [d, h]
const RCAR = {
  sedan:{zh:'电动轿车', en:'Electric sedan', spec:'双电机四驱 · 300 kW · 2.1 t', ev:true,
    ph:{bk:0.97, bias:0.68, m:2100, Iz:4400, a:1.42, b:1.50, hcg:0.50, P:300e3, Fmax:15000, CdA:0.53, rho:1.2, muF:1.0, muR:1.0, aPk:0.10, rr:0.011, drive:0.5, vmax:62.6, vrev:7, coast:0.11, lock:0.58, roll:0.0048, pitch:0.0032, rpmMax:16000, idle:0, gears:null},
    g:{xf:2.35, xr:-2.53, r:0.352, rimR:0.245, tyreW:0.245, track:1.64, gap:0.05,
      LB:[[2.35, 0.58, 0.36, 0.60, 0], [2.32, 0.80, 0.25, 0.655, 0.02], [2.24, 0.90, 0.19, 0.705, 0.035], [2.05, 0.95, 0.165, 0.755, 0.045], [1.60, 0.97, 0.15, 0.815, 0.05],
        [1.10, 0.975, 0.145, 0.865, 0.05], [0.80, 0.978, 0.14, 0.895, 0.045], [0.30, 0.98, 0.14, 0.925, 0.03], [-0.60, 0.98, 0.14, 0.945, 0.03], [-1.40, 0.978, 0.145, 0.965, 0.03],
        [-1.95, 0.965, 0.16, 0.98, 0.03], [-2.30, 0.93, 0.20, 0.985, 0.025], [-2.47, 0.86, 0.28, 0.97, 0.015], [-2.53, 0.74, 0.36, 0.945, 0]],
      GH:[[0.86, null, 0.73, 0], [0.62, 1.04, 0.70, 0.02], [0.38, 1.20, 0.665, 0.035], [0.12, 1.35, 0.64, 0.045], [-0.05, 1.405, 0.63, 0.05], [-0.42, 1.445, 0.62, 0.05],
        [-0.88, 1.435, 0.605, 0.05], [-1.25, 1.33, 0.59, 0.045], [-1.60, 1.18, 0.575, 0.035], [-1.85, 1.07, 0.565, 0.02], [-2.05, null, 0.555, 0]],
      ws:[0.86, -0.05], rw:[-0.90, -2.05], glassRoof:true, blackRoof:false, win:[[0.72, -0.52], [-0.62, -1.28], [-1.36, -1.72]], cP:-1.72,
      doors:[0.96, -0.57, -1.12], handles:[[-0.32, -0.46], [-0.95, -1.07]], mirror:0.72, clad:false,
      head:[2.12, 2.31, 7.4, 8.9], tail:[-2.52, -2.30, 7.7, 9.1], frontBar:true, rearBar:true, spokes:5, aero:true, rimCol:[0.62, 0.64, 0.67], intCol:[0.11, 0.11, 0.12], seatCol:[0.82, 0.80, 0.76],
      eye:[-0.36, 1.15, -0.37], bonnet:1.15, chase:[6.4, 2.0]}},
  suv:{zh:'SUV 越野车', en:'SUV', spec:'V6 双涡轮 · 8 速自动 · 250 kW · 2.3 t', ev:false,
    ph:{bk:0.93, bias:0.7, m:2300, Iz:5400, a:1.40, b:1.55, hcg:0.66, P:250e3, Fmax:11500, CdA:0.89, rho:1.2, muF:0.97, muR:0.97, aPk:0.11, rr:0.013, drive:0.4, vmax:58.1, vrev:7, coast:0.05, lock:0.56, roll:0.0078, pitch:0.0045, rpmMax:6500, idle:750, gears:[0, 52, 84, 120, 155, 190, 225, 260, 300]},
    g:{xf:2.40, xr:-2.55, r:0.378, rimR:0.254, tyreW:0.255, track:1.68, gap:0.07,
      LB:[[2.40, 0.66, 0.44, 0.80, 0], [2.37, 0.84, 0.33, 0.865, 0.02], [2.28, 0.94, 0.27, 0.925, 0.03], [2.05, 0.975, 0.235, 0.98, 0.04], [1.50, 0.99, 0.215, 1.035, 0.045],
        [0.95, 0.99, 0.21, 1.075, 0.04], [0.40, 0.99, 0.21, 1.095, 0.03], [-0.60, 0.99, 0.21, 1.115, 0.025], [-1.60, 0.99, 0.215, 1.13, 0.02], [-2.20, 0.97, 0.245, 1.135, 0.02],
        [-2.46, 0.92, 0.31, 1.125, 0.015], [-2.55, 0.84, 0.42, 1.10, 0]],
      GH:[[1.02, null, 0.75, 0], [0.86, 1.30, 0.72, 0.02], [0.68, 1.52, 0.695, 0.035], [0.52, 1.675, 0.675, 0.045], [0.40, 1.715, 0.665, 0.05], [-0.60, 1.735, 0.66, 0.05],
        [-1.50, 1.725, 0.655, 0.05], [-2.12, 1.705, 0.65, 0.045], [-2.33, 1.62, 0.64, 0.03], [-2.45, 1.40, 0.63, 0.015], [-2.50, null, 0.62, 0]],
      ws:[1.02, 0.40], rw:[-2.14, -2.50], glassRoof:false, blackRoof:true, win:[[0.86, -0.32], [-0.44, -1.28], [-1.40, -2.14]], cP:-2.14,
      doors:[0.92, -0.38, -1.10], handles:[[-0.14, -0.29], [-0.89, -1.03]], mirror:0.84, clad:true,
      head:[2.16, 2.37, 7.6, 8.95], tail:[-2.54, -2.36, 7.4, 9.0], frontBar:false, rearBar:false, spokes:6, aero:false, rimCol:[0.70, 0.72, 0.74], intCol:[0.09, 0.09, 0.10], seatCol:[0.42, 0.30, 0.22],
      eye:[-0.08, 1.41, -0.38], bonnet:1.30, chase:[7.0, 2.35]}},
  coupe:{zh:'跑车', en:'Sports coupe', spec:'V8 · 8 速自动 · 后驱 · 360 kW · 1.8 t', ev:false,
    ph:{bk:1.0, bias:0.64, m:1780, Iz:3300, a:1.30, b:1.42, hcg:0.46, P:360e3, Fmax:13500, CdA:0.62, rho:1.2, muF:1.08, muR:1.1, aPk:0.09, rr:0.012, drive:0, vmax:80.5, vrev:7, coast:0.06, lock:0.55, roll:0.0032, pitch:0.0024, rpmMax:7500, idle:850, gears:[0, 64, 100, 140, 180, 218, 254, 290, 330]},
    g:{xf:2.28, xr:-2.36, r:0.348, rimR:0.254, tyreW:0.265, track:1.62, gap:0.04,
      LB:[[2.28, 0.60, 0.30, 0.52, 0], [2.25, 0.82, 0.20, 0.575, 0.02], [2.16, 0.92, 0.15, 0.625, 0.035], [1.95, 0.955, 0.13, 0.675, 0.05], [1.40, 0.97, 0.12, 0.755, 0.06],
        [0.85, 0.962, 0.12, 0.815, 0.05], [0.40, 0.955, 0.12, 0.845, 0.035], [-0.30, 0.955, 0.12, 0.86, 0.03], [-1.10, 0.978, 0.125, 0.875, 0.03], [-1.70, 0.985, 0.14, 0.885, 0.03],
        [-2.10, 0.955, 0.18, 0.885, 0.025], [-2.30, 0.87, 0.26, 0.865, 0.015], [-2.36, 0.75, 0.34, 0.84, 0]],
      GH:[[0.74, null, 0.71, 0], [0.45, 0.975, 0.67, 0.02], [0.10, 1.145, 0.63, 0.035], [-0.25, 1.265, 0.595, 0.045], [-0.55, 1.295, 0.58, 0.05], [-0.85, 1.275, 0.57, 0.045],
        [-1.20, 1.18, 0.555, 0.04], [-1.55, 1.05, 0.545, 0.03], [-1.80, 0.95, 0.535, 0.015], [-1.98, null, 0.525, 0]],
      ws:[0.74, -0.32], rw:[-0.92, -1.98], glassRoof:false, blackRoof:true, win:[[0.58, -0.96], [-1.04, -1.46]], cP:-1.46,
      doors:[0.84, -0.98], handles:[[-0.70, -0.84]], mirror:0.60, clad:false,
      head:[2.06, 2.25, 7.5, 9.0], tail:[-2.35, -2.17, 7.3, 9.0], frontBar:false, rearBar:true, spokes:10, aero:false, rimCol:[0.20, 0.21, 0.23], intCol:[0.07, 0.07, 0.08], seatCol:[0.55, 0.08, 0.07],
      eye:[-0.64, 1.03, -0.36], bonnet:1.05, chase:[6.2, 1.85]}}};
// [nyc/nycapp] the New York taxi: a generic mid-size hybrid sedan (notchback, 4.85 m), front-wheel drive, automatic
RCAR.taxi = {zh:'出租车', en:'City taxi', spec:'混合动力 · 前驱 · 自动 · 150 kW · 1.65 t', ev:false, taxi:true,
  ph:{bk:0.95, bias:0.68, m:1650, Iz:2900, a:1.30, b:1.50, hcg:0.53, P:150e3, Fmax:7800, CdA:0.64, rho:1.2, muF:0.95, muR:0.95, aPk:0.10, rr:0.011, drive:1, vmax:50, vrev:7, coast:0.07, lock:0.60, roll:0.0062, pitch:0.0042, rpmMax:6000, idle:800, gears:[0, 45, 75, 105, 135, 160, 185, 205, 225]},
  g:Object.assign({}, RCAR.sedan.g, {xf:2.36, xr:-2.48, r:0.335, rimR:0.215, tyreW:0.225, track:1.58,
    LB:[[2.36, 0.58, 0.37, 0.62, 0], [2.33, 0.80, 0.26, 0.67, 0.02], [2.25, 0.89, 0.20, 0.72, 0.035], [2.05, 0.93, 0.175, 0.77, 0.045], [1.60, 0.95, 0.16, 0.83, 0.05],
      [1.10, 0.955, 0.155, 0.875, 0.05], [0.80, 0.958, 0.15, 0.90, 0.045], [0.30, 0.96, 0.15, 0.925, 0.03], [-0.60, 0.96, 0.15, 0.945, 0.03], [-1.40, 0.958, 0.155, 0.98, 0.03],
      [-1.75, 0.95, 0.165, 1.02, 0.03], [-2.20, 0.92, 0.20, 1.03, 0.025], [-2.40, 0.86, 0.28, 1.01, 0.012], [-2.48, 0.74, 0.37, 0.98, 0]],
    GH:[[0.92, null, 0.74, 0], [0.66, 1.08, 0.70, 0.02], [0.36, 1.27, 0.665, 0.035], [0.08, 1.42, 0.645, 0.045], [-0.30, 1.475, 0.635, 0.05], [-0.95, 1.46, 0.62, 0.05],
      [-1.22, 1.36, 0.605, 0.04], [-1.48, 1.18, 0.59, 0.025], [-1.68, null, 0.58, 0]],
    ws:[0.92, 0.04], rw:[-0.98, -1.68], glassRoof:false, blackRoof:false, win:[[0.78, -0.48], [-0.58, -1.16]], cP:-1.18,
    doors:[0.98, -0.53, -1.14], handles:[[-0.30, -0.44], [-0.92, -1.04]], mirror:0.78, clad:false,
    head:[2.12, 2.32, 7.4, 8.9], tail:[-2.47, -2.27, 7.8, 9.2], frontBar:false, rearBar:false, spokes:5, aero:true, rimCol:[0.55, 0.56, 0.58], intCol:[0.10, 0.10, 0.11], seatCol:[0.16, 0.16, 0.17],
    eye:[-0.40, 1.16, -0.37], bonnet:1.15, chase:[6.4, 2.05], roofLight:[-0.38, 0.62, 0.30, 0.22]})};
// [lm24/drive] three more road vehicles (drawn with the traffic module's generic models: SGTraffic.model): a pickup truck, a 12 m city
// bus and a motorbike that leans into the bends. g.ext = the traffic model, mx = the model centre ahead of the centre of mass, circ / cr /
// bodyc = the collision circles, lean = a motorbike's roll into the turn
RCAR.pickup = {zh:'皮卡', en:'Pickup truck', spec:'V8 · 10 速自动 · 四驱 · 300 kW · 2.6 t', ev:false, ext:'pickup', kind:'truck',
  ph:{bk:0.9, bias:0.68, m:2600, Iz:6200, a:1.62, b:1.78, hcg:0.78, P:300e3, Fmax:14500, CdA:1.15, rho:1.2, muF:0.9, muR:0.9, aPk:0.115, rr:0.014, drive:0.3, vmax:50, vrev:7, coast:0.06, lock:0.55, roll:0.009, pitch:0.005, rpmMax:5800, idle:700, gears:[0, 45, 72, 100, 130, 160, 185, 205, 230]},
  g:{xf:2.8, xr:-2.8, r:0.41, track:1.72, mx:0.1, chase:[8.2, 2.7], eye:[0.32, 1.6, -0.38], bonnet:1.55, bonnetY:1.2, circ:[1.75, 0, -1.75], cr:1.04, bodyc:[2.4, 0.9, 1.2, 1.02, 0, 1.03, -1.2, 1.02, -2.45, 0.9], paint:true}};
RCAR.bus = {zh:'城市巴士', en:'City bus', spec:'柴油 · 6 速自动 · 12 米 · 220 kW · 12.5 t', ev:false, ext:'usbus', kind:'bus',
  ph:{bk:0.82, bias:0.6, m:12500, Iz:125000, a:4.4, b:1.7, hcg:1.15, P:220e3, Fmax:62000, CdA:5.4, rho:1.2, muF:0.82, muR:0.85, aPk:0.13, rr:0.009, drive:0, vmax:25, vrev:4, coast:0.06, lock:0.62, roll:0.011, pitch:0.004, rpmMax:2300, idle:600, gears:[0, 20, 33, 48, 64, 80, 92, 100, 108]},
  g:{xf:6.1, xr:-6.1, r:0.5, track:2.1, mx:0.5, chase:[17, 5.2], eye:[5.1, 2.25, -0.75], bonnet:5.9, bonnetY:2.4, circ:[4.9, 2.45, 0, -2.45, -4.9], cr:1.32, bodyc:[5.6, 1.25, 2.8, 1.32, 0, 1.32, -2.8, 1.32, -5.6, 1.25], paint:false}};
RCAR.moto = {zh:'摩托车', en:'Motorbike', spec:'双缸 · 6 速 · 70 kW · 260 kg（含骑手）', ev:false, ext:'moto', kind:'motorbike',
  ph:{bk:0.92, bias:0.72, m:260, Iz:70, a:0.72, b:0.68, hcg:0.62, P:70e3, Fmax:4200, CdA:0.42, rho:1.2, muF:1.0, muR:1.0, aPk:0.12, rr:0.012, drive:0, vmax:60, vrev:1.4, coast:0.09, lock:0.5, roll:0, pitch:0.007, rpmMax:10500, idle:1300, gears:[0, 62, 98, 128, 156, 182, 205, 216, 230]},
  g:{xf:1.05, xr:-1.05, r:0.3, track:0.2, mx:0, chase:[4.6, 1.75], eye:[-0.1, 1.42, 0], bonnet:0.55, bonnetY:1.1, circ:[0.7, 0, -0.7], cr:0.42, bodyc:[0.95, 0.38, 0, 0.42, -0.95, 0.38], paint:true, lean:true}};
const RC_TAXI_PAINT = [0.97, 0.71, 0.06];                     // taxi yellow (plain paint, no markings)
const RC_KEYS = ['sedan', 'suv', 'coupe'];
const rcKeys = () => (isNyc() ? RC_KEYS.concat('taxi') : RC_KEYS).concat(rcExtOK() ? ['pickup', 'bus', 'moto'] : []);
const rcExtOK = () => { try { return !!(window.SGTraffic && window.SGTraffic.model); } catch (e){ return false; } };
// invented paint colours
const RC_COLS = [{zh:'珍珠白', en:'Pearl white', c:[0.84, 0.85, 0.84]}, {zh:'曜石黑', en:'Obsidian', c:[0.03, 0.033, 0.04]}, {zh:'月光银', en:'Silver', c:[0.58, 0.60, 0.62]},
  {zh:'深海蓝', en:'Deep blue', c:[0.05, 0.14, 0.34]}, {zh:'赤焰红', en:'Red', c:[0.60, 0.04, 0.045]}, {zh:'松林绿', en:'Pine green', c:[0.07, 0.22, 0.16]}];
let RCP = RCAR.sedan.ph;          // the road car being driven (physics)
// speed-sensitive steering lock: full lock in town, about what the tyres can hold at speed (keyboard steering stays drivable)
function rcMaxSteer(u){ const P = RCP, s = Math.abs(u), L = P.a + P.b; return Math.min(P.lock, 1.45*L*9.81*Math.min(P.muF, P.muR)/Math.max(1, s*s)) + 0.012; }
function rcPhys(C, I, h, env){
  // [lm30/phys2] the vertical load (env.load), lateral load transfer by the roll stiffness split (understeer / oversteer by car), combined
  // slip on the driven axles (traction control strength by car: wheelspin, power oversteer / understeer), the engine's torque curve
  // through the gears, stability control by car (the coupe lets it slide; off for 1.3 s after the handbrake), more counter-steer help
  // on a keyboard in a slide
  const P = RCP, m = P.m, g = 9.81, a = P.a, b = P.b, L = a + b, u = C.u, su = Math.abs(u), grip = env.grip, D = env.dmg || DMG0, X = p2V();
  const lf = env.load === undefined ? 1 : env.load, kb = P2.kb;
  const beta = su > 4 ? Math.atan2(C.v, su) : 0, ms = rcMaxSteer(u);
  steerStep(C, clamp(I.steer + D.pull, -1, 1)*ms, ms, su, h, 2.0, 2.8, 0.2);
  const hbOn = I.hb > 0.5 && su > 0.5; C.hbT = hbOn ? 1.3 : Math.max(0, (C.hbT || 0) - h);
  const esc = C.hbT > 0 ? 0 : X.esc, csMax = esc < 0.6 ? (kb ? 0.2 : 0.14) : 0.08, csK = esc < 0.6 && kb && p2Digital(I) ? 0.9 : 0.5;
  const delta = C.delta + (su > 6 ? Math.max(-csMax, Math.min(csMax, csK*Math.sign(beta)*Math.max(0, Math.abs(beta) - 0.05)*env.assist)) : 0);
  const ax = C.ax || 0;
  let Nf = (m*g*b/L)*lf - m*ax*P.hcg/L, Nr = (m*g*a/L)*lf + m*ax*P.hcg/L;
  Nf = Math.max(0.12*m*g*Math.min(1, lf), Nf); Nr = Math.max(0.12*m*g*Math.min(1, lf), Nr);
  // automatic: hold the brake at a standstill to engage reverse (after stopping: release it and press again); throttle selects drive
  revLogic(C, I, su, u, h, true);
  const thr = C.rev ? I.brk : I.thr, bp = brakeRamp(C, C.rev ? I.thr : I.brk, h), hb = hbOn;
  if (thr > 0.05 && !C.rev) C.park = false;
  // lateral load transfer: m ay hcg / track, split front / rear by the roll stiffness; the pair of tyres holds less (load sensitivity)
  const dN = Gm(X)*m*Math.abs(C.ay || 0)*P.hcg/X.track, kAF = p2LoadK(dN*X.rsF, Nf, X.eps), kAR = p2LoadK(dN*(1 - X.rsF), Nr, X.eps);
  const muF = P.muF*grip*D.gripF*kAF, muR = P.muR*grip*D.gripR*kAR;
  let Fyf = 0, Fyr = 0, Fb = 0;
  if (su > 0.3){ const af = Math.atan2(C.v + a*C.r, su) - delta*Math.sign(u || 1), ar = Math.atan2(C.v - b*C.r, su);
    Fyf = -muF*Nf*tyreY(af/P.aPk);
    // the handbrake locks the rear wheels: their friction opposes the sliding contact patch (braking, little side grip)
    if (hb){ const vy = C.v - b*C.r, vp = Math.hypot(su, vy) || 1, k = 0.78*muR*Nr; Fyr = -k*vy/vp; Fb += k*su/vp; }
    else Fyr = -muR*Nr*tyreY(ar/P.aPk); }
  // drive: the engine / motor force (torque curve, gear, torque converter; the limiter; shift dips) split over the driven axles, each
  // through its friction circle (traction control by car); an all-wheel drive's coupling sends the torque to the axle that grips
  let Fx = 0; P2.spin = 0;
  if (thr > 0 && !C.park && !D.wreck){
    const tc = kb ? Math.max(X.tc, 0.75) : X.tc;
    if (C.rev){ const lim = Math.sqrt(Math.max(0, (muR*Nr)*(muR*Nr) - Fyr*Fyr)) + (P.drive > 0 ? Math.sqrt(Math.max(0, (muF*Nf)*(muF*Nf) - Fyf*Fyf)) : 0); Fx = -Math.min(thr*P.Fmax*0.45*D.pow, lim)*(u > -P.vrev ? 1 : 0); }
    else {
      const dem = p2Drive(C, P, X, su, thr, D)*Math.max(0, Math.min(1, (P.vmax*D.vmax - u)/1.5))*((C.shiftT || 0) > 0 ? 0.4 : 1);
      let dF = dem*P.drive, dR = dem - dF;
      if (P.drive > 0 && P.drive < 1){ const lF = Math.sqrt(Math.max(0, (muF*Nf)*(muF*Nf) - Fyf*Fyf)), lR = hb ? 0 : Math.sqrt(Math.max(0, (muR*Nr)*(muR*Nr) - Fyr*Fyr));
        if (dF > lF && dR < lR){ const t = Math.min(dF - lF, lR - dR); dF -= t; dR += t; } else if (dR > lR && dF < lF){ const t = Math.min(dR - lR, lF - dF); dR -= t; dF += t; } }
      if (dF > 0){ const A = p2Axle(dF, muF*Nf, muF*Nf, Fyf, tc); Fx += A[0]; Fyf = A[1]; P2.spin = Math.max(P2.spin, A[2]); }
      if (dR > 0 && !hb){ const A = p2Axle(dR, muR*Nr, muR*Nr, Fyr, tc); Fx += A[0]; Fyr = A[1]; P2.spin = Math.max(P2.spin, A[2]); }
    }
  }
  // brakes (balance, ABS per axle beside the cornering force), engine braking / regen by gear off the throttle, the parking brake
  Fb += absBrakes(C, bp, bp*1.35*m*g*D.brake*Math.min(1, lf + 0.2), P.bias || 0.66, Math.sqrt(Math.max(0, (muF*Nf)*(muF*Nf) - Fyf*Fyf))*P.bk, hb ? 0 : Math.sqrt(Math.max(0, (muR*Nr)*(muR*Nr) - Fyr*Fyr))*P.bk, h);
  if (thr < 0.05 && !C.rev && su > 0.4) Fb += P.coast*m*g*Math.min(1, lf)*Math.min(1, su/3)*(P.gears ? Math.min(2.2, Math.sqrt(P.gears[8]/P.gears[Math.max(1, Math.min(8, C.gear | 0))])) : 1);
  if (C.park) Fb += m*g;
  const Fd = 0.5*P.rho*P.CdA*u*su*env.drag + (su > 0.05 ? Math.sign(u)*(P.rr*(Nf + Nr) + env.roll*m*g*Math.min(1, lf)) : 0);
  const cd = Math.cos(delta), sd = Math.sin(delta);
  const du = (Fx - Fd - Fyf*sd)/m + C.v*C.r, dv = (Fyf*cd + Fyr)/m - u*C.r, dr = (a*Fyf*cd - b*Fyr)/P.Iz;
  const bd = Fb/m*h;
  let nu = u + du*h; if (Fb > 0){ if (Math.abs(nu) <= bd) nu = 0; else nu -= Math.sign(nu)*bd; }
  C.ax = (nu - u)/h*0.1 + (C.ax || 0)*0.9;
  C.u = nu; C.v += dv*h; C.r += dr*h;
  // low speed: the kinematic bicycle (the tyre model is singular at a standstill) - only with the wheels on the ground
  const w = Math.max(0, Math.min(1, (Math.abs(C.u) - 1.5)/4));
  // [lm30/phys2] ... but the tyres need time to stop a spin or a sideways shove (after a hit): the blend is limited to what they can do
  if (w < 1 && lf > 0.3){ const rk = C.u*Math.tan(delta)/L, tr = C.r*w + rk*(1 - w), tv = C.v*w + rk*b*0.25*(1 - w), aL = Math.min(P.muF, P.muR)*grip*lf*g, dR = aL*L*0.5*m/P.Iz*h + 0.4*h, dV = aL*h + 0.2*h;
    C.r += clamp(tr - C.r, -dR, dR); C.v += clamp(tv - C.v, -dV, dV); }
  // stability control: the yaw rate the tyres can hold, big body slip bled off; by car (esc) and relaxed after the handbrake
  if (env.assist && su > 4 && !hb && esc > 0 && lf > 0.3){ const rl = (1.06 + (1 - esc)*0.9)*Math.min(P.muF, P.muR)*grip*g/su; if (Math.abs(C.r) > rl) C.r -= (C.r - Math.sign(C.r)*rl)*Math.min(1, 12*esc*h); }
  if (su > 4 && lf > 0.3){ const bb = Math.abs(Math.atan2(C.v, su)), bl = hb || esc <= 0 ? 0.6 : 0.12 + (1 - esc)*0.3;
    if (bb > bl){ const k2 = hb || esc <= 0 ? 4 : (1 + 3*esc) + (bb > bl*1.35 ? 8*(1 - esc) : 0); C.v *= 1 - k2*h; if (esc > 0 && !hb && bb > bl*1.35) C.r *= 1 - 3*(1 - esc)*h; } }
  C.ay = (Fyf*cd + Fyr)/m;
}
// the motorbike leans instead of transferring load; everything else rolls on its springs
function Gm(X){ return F1.veh === 'car' && RCM.key === 'moto' ? 0 : 1; }
// gears / revs: an 8-speed automatic (shift points follow the throttle, a short torque dip per upshift) or the electric motor's speed
function rcGears(C, dt){
  const P = RCP, kmh = Math.abs(C.u)*3.6; C.shiftT = Math.max(0, (C.shiftT || 0) - dt); C.shiftW = Math.max(0, (C.shiftW || 0) - dt);
  if (!P.gears){ C.gear = 1; C.rpm += (kmh*P.rpmMax/230 - C.rpm)*Math.min(1, dt*20); return; }
  const G = P.gears, rm = P.rpmMax;
  if (C.rev){ C.gear = -1; C.rpm += (Math.max(P.idle, rm*kmh/40) + C.brk*900 - C.rpm)*Math.min(1, dt*8); return; }
  if (C.gear < 1) C.gear = 1;
  const thr = C.thr, up = 1900 + (rm*0.93 - 1900)*Math.pow(thr, 1.4), dn = 1100 + (rm*0.5 - 1100)*thr;
  let r = rm*kmh/G[C.gear];
  if (C.shiftW <= 0){
    if (r > up && C.gear < 8){ C.gear++; C.shiftT = 0.16*thr + 0.05; C.shiftW = 0.7; }
    else if (C.gear > 1 && rm*kmh/G[C.gear - 1] < Math.min(dn, rm*0.88)){ C.gear--; C.shiftW = 0.5; }
  }
  r = rm*kmh/G[C.gear];
  // torque converter: the engine runs above the wheel speed when pulling away
  const tc = C.gear <= 2 && kmh < 30 ? P.idle + thr*(rm*0.42)*(1 - kmh/30) : 0;
  C.rpm += (Math.min(rm*1.01, Math.max(P.idle, r, tc)) - C.rpm)*Math.min(1, dt*(C.shiftT > 0 ? 25 : 10));
}

const RCGEO = (() => {
  const {GB, gv, gto, hexa, boxR, bar, loft, lathe, tube} = F1GEO.H;
  const W = [1, 1, 1], BLK = [0.028, 0.03, 0.034], UND = [0.045, 0.045, 0.05], GLS = [0.055, 0.07, 0.085], CHR = [0.72, 0.74, 0.77], TYR = [0.05, 0.05, 0.055],
        HEAD = [0.93, 0.96, 1.0], HOUS = [0.10, 0.11, 0.13], TAIL = [0.55, 0.035, 0.03], BRKC = [0.80, 0.05, 0.04], REVC = [0.52, 0.53, 0.55], INDC = [0.98, 0.52, 0.06],
        PLATE = [0.88, 0.88, 0.84], DISP = [0.05, 0.09, 0.14], DISC = [0.34, 0.34, 0.35];
  // shape-preserving cubic (PCHIP) through the key rows, per column: no overshoot between unevenly spaced keys
  function pchip(xs, ys){
    const n = xs.length, h = [], s = [], d = new Array(n);
    for (let i = 0; i < n - 1; i++){ h[i] = xs[i + 1] - xs[i]; s[i] = (ys[i + 1] - ys[i])/h[i]; }
    d[0] = s[0]; d[n - 1] = s[n - 2];
    for (let i = 1; i < n - 1; i++){ if (s[i - 1]*s[i] <= 0) d[i] = 0; else { const w1 = 2*h[i] + h[i - 1], w2 = h[i] + 2*h[i - 1]; d[i] = (w1 + w2)/(w1/s[i - 1] + w2/s[i]); } }
    return x => { if (x <= xs[0]) return ys[0]; if (x >= xs[n - 1]) return ys[n - 1]; let i = 0; while (i < n - 2 && x > xs[i + 1]) i++;
      const t = (x - xs[i])/h[i], t2 = t*t, t3 = t2*t; return (2*t3 - 3*t2 + 1)*ys[i] + (t3 - 2*t2 + t)*h[i]*d[i] + (-2*t3 + 3*t2)*ys[i + 1] + (t3 - t2)*h[i]*d[i + 1]; };
  }
  function sampler(K){ const S = K.slice().sort((p, q) => p[0] - q[0]), xs = S.map(r => r[0]), F = []; for (let c = 1; c < K[0].length; c++) F.push(pchip(xs, S.map(r => r[c]))); return x => [x].concat(F.map(f => f(x))); }
  const inR = (x, r) => x <= r[0] && x >= r[1];
  function stations(x0, x1, step, extra){
    const s = [x0, x1]; for (let x = x0 - step; x > x1; x -= step) s.push(x); for (const e of extra) if (e < x0 && e > x1) s.push(e);
    s.sort((p, q) => q - p); const o = [s[0]]; for (const v of s) if (o[o.length - 1] - v > 0.0012) o.push(v); return o;
  }
  function build(key){
    const D = RCAR[key], G = D.g, P = D.ph, a = P.a, b = P.b, LB = sampler(G.LB);
    const GHK = G.GH.map(k => [k[0], k[1] === null ? LB(k[0])[3] : k[1], k[2], k[3]]), GH = sampler(GHK);
    // lower body half ring (13 points, bottom centre -> side -> top centre) with the wheel arches cut out of the side
    const archs = [[a, G.r + G.gap], [-b, G.r + G.gap]];
    const lbHalf = x => { const k = LB(x), w = k[1], yb = k[2], yt = k[3], cr = k[4], h = Math.max(0.05, yt - yb);
      const Q = [[yb, 0], [yb, 0.5*w], [yb + 0.015, 0.84*w], [yb + 0.07*h, 0.955*w], [yb + 0.22*h, 0.99*w], [yb + 0.45*h, w], [yb + 0.70*h, 0.995*w], [yb + 0.86*h, 0.975*w],
        [yb + 0.95*h, 0.935*w], [yt, 0.83*w], [yt + cr*0.55, 0.56*w], [yt + cr*0.9, 0.26*w], [yt + cr, 0]];
      for (const [ax, R] of archs){ const dx = Math.abs(x - ax); if (dx <= R){ const ay = Math.min(yt - 0.012, G.r + Math.sqrt(R*R - dx*dx)); for (let j = 2; j <= 8; j++) if (Q[j][0] < ay) Q[j][0] = ay; } }
      return Q; };
    const full = (half, mid) => { const R = half.map(p => [p[0], p[1]]); for (let j = half.length - 2; j >= (mid ? 1 : 0); j--) R.push([half[j][0], -half[j][1]]); return R; };
    const B = GB();
    // ---- lower body
    const ex = []; for (const [ax, R] of archs){ ex.push(ax + R + 0.004, ax - R - 0.004, ax + R - 0.001, ax - R + 0.001); for (let d = -R + 0.05; d < R; d += 0.05) ex.push(ax + d); }
    for (const k of G.LB) ex.push(k[0]);
    const lbS = stations(G.xf, G.xr, 0.1, ex).map(x => ({x, r:full(lbHalf(x), true)}));
    const archAt = x => archs.some(([ax, R]) => Math.abs(x - ax) <= R + 0.002);
    loft(B, lbS, (x, y, z, j) => { const hj = j <= 12 ? j : 24 - j;
      if (hj <= 1) return [UND, 0, 0.15];
      if (hj === 2 || (G.clad && hj <= 4 && (archAt(x) || hj <= 3))) return [BLK, 0, 0.3];
      return [W, 1, 0.95]; }, [W, 1, 0.9], [W, 1, 0.9]);
    // ---- greenhouse (windscreen, side glass, pillars, roof, rear window)
    const ghRing = x => { const k = LB(x), yb = k[3], wb = 0.80*k[1], g = GH(x), yr = Math.max(yb, g[1]), wr = g[2], cr = g[3], hs = yr - yb, q = Math.max(0, Math.min(1, hs/0.12));
      return [[yb - 0.03, wb + 0.008], [yb + 0.005, wb], [yb + 0.016*q, wb - 0.002], [yb + 0.5*hs, 0.5*(wb + wr) + 0.012*q], [yr - 0.05*q, wr + 0.006*q], [yr - 0.04*q, wr],
        [yr - 0.008*q, wr - 0.03*q], [yr, wr - 0.055*q], [yr + cr*0.6, wr*0.62], [yr + cr*0.92, wr*0.28], [yr + cr, 0]]; };
    const gx = [G.ws[1] + 0.003, G.ws[1] - 0.003, G.rw[0] + 0.003, G.rw[0] - 0.003, G.cP + 0.003, G.cP - 0.003]; for (const w of G.win) gx.push(w[0] + 0.003, w[0] - 0.003, w[1] + 0.003, w[1] - 0.003);
    for (const k of G.GH) gx.push(k[0]);
    const ghS = stations(G.ws[0], G.rw[1], 0.08, gx).map(x => ({x, r:full(ghRing(x), true)}));
    const side = x => G.win.some(w => x <= w[0] - 0.002 && x >= w[1] + 0.002), roofGlass = x => inR(x, [G.ws[0], G.ws[1] - 0.001]) || inR(x, [G.rw[0] + 0.001, G.rw[1]]) || (G.glassRoof && x < G.ws[1] && x > G.rw[0]);
    const PNT = [W, 1, 0.95], RF = G.blackRoof ? [BLK, 0, 0.7] : PNT, GL = [GLS, 0, 1.25], TRIM = [BLK, 0, 0.55];
    loft(B, ghS, (x, y, z, j) => { const hj = j <= 10 ? j : 20 - j;
      if (hj <= 1) return TRIM;
      if (hj <= 4) return side(x) ? GL : (x < G.cP ? PNT : TRIM);
      if (hj <= 6) return RF;
      return roofGlass(x) ? GL : RF; }, null, null);
    // ---- surface decals (lamps, shut lines, handles): patches on the lower body's ring parameter f (0 bottom centre .. 12 top centre)
    const lbPt = (x, f, sd) => { const Q = lbHalf(x), i = Math.max(0, Math.min(11, Math.floor(f))), t = Math.min(1, f - i), p = Q[i], q = Q[i + 1]; return [x, p[0] + (q[0] - p[0])*t, (p[1] + (q[1] - p[1])*t)*sd]; };
    function decal(x0, x1, f0, f1, sd, nx, nf, col, slot, gl, off){
      const V = [], N = [];
      for (let i = 0; i <= nx; i++){ const x = x0 + (x1 - x0)*i/nx, row = [];
        for (let j = 0; j <= nf; j++){ const f = f0 + (f1 - f0)*j/nf, p = lbPt(x, f, sd), e = 0.006;
          const A = lbPt(Math.min(G.xf, x + e), f, sd), Bm = lbPt(Math.max(G.xr, x - e), f, sd), Cp = lbPt(x, Math.min(12, f + 0.04), sd), Cm = lbPt(x, Math.max(0, f - 0.04), sd);
          const tx = [A[0] - Bm[0], A[1] - Bm[1], A[2] - Bm[2]], tf = [Cp[0] - Cm[0], Cp[1] - Cm[1], Cp[2] - Cm[2]];
          let n = [tx[1]*tf[2] - tx[2]*tf[1], tx[2]*tf[0] - tx[0]*tf[2], tx[0]*tf[1] - tx[1]*tf[0]]; const nl = Math.hypot(n[0], n[1], n[2]) || 1; n = n.map(v => v/nl);
          const k = LB(x), my = (k[2] + k[3])/2; if (n[1]*(p[1] - my) + n[2]*p[2] < 0) n = n.map(v => -v);
          row.push(gv(B, p[0] + n[0]*off, p[1] + n[1]*off, p[2] + n[2]*off, col, slot, gl)); N.push([p[0] - n[0]*0.3, p[1] - n[1]*0.3, p[2] - n[2]*0.3]); }
        V.push(row); }
      const nn = nf + 1;
      for (let i = 0; i < nx; i++) for (let j = 0; j < nf; j++){ const r = N[i*nn + j]; gto(B, V[i][j], V[i + 1][j], V[i + 1][j + 1], r[0], r[1], r[2]); gto(B, V[i][j], V[i + 1][j + 1], V[i][j + 1], r[0], r[1], r[2]); }
    }
    const hd = G.head, tl = G.tail;
    for (const sd of [-1, 1]){
      // headlamp: dark housing, a slim LED strip (the lamp), an amber indicator below it
      decal(hd[0], hd[1], hd[2], hd[3], sd, 5, 3, HOUS, 0, 1.0, 0.004);
      decal(hd[0] + 0.015, hd[1] - 0.005, hd[3] - 0.32, hd[3] - 0.06, sd, 5, 1, HEAD, 0, 2, 0.007);
      decal(hd[0] + 0.11, hd[1] - 0.02, hd[2] + 0.08, hd[2] + 0.42, sd, 3, 1, HEAD, 0, 2, 0.007);
      decal(hd[0] + 0.02, hd[0] + 0.09, hd[2] + 0.05, hd[2] + 0.4, sd, 2, 1, INDC, 0, sd < 0 ? 6 : 7, 0.0075);
      // tail lamp: red lens (tail), brake segment, reverse lamp, indicator
      decal(tl[0], tl[1], tl[2], tl[3], sd, 5, 3, TAIL, 0, 3, 0.004);
      decal(tl[0] + 0.01, tl[1] - 0.04, tl[3] - 0.45, tl[3] - 0.08, sd, 4, 1, BRKC, 0, 4, 0.007);
      decal(tl[0] + 0.005, tl[0] + 0.05, tl[2] + 0.05, tl[2] + 0.45, sd, 2, 1, REVC, 0, 5, 0.007);
      decal(tl[1] - 0.10, tl[1] - 0.015, tl[2] + 0.05, tl[2] + 0.55, sd, 2, 1, INDC, 0, sd < 0 ? 6 : 7, 0.0072);
      // door shut lines and handles
      for (const dx of G.doors) decal(dx + 0.003, dx - 0.003, 3.05, 9.0, sd, 1, 8, BLK, 0, 0.2, 0.0025);
      for (const hx of G.handles) decal(hx[0], hx[1], 7.0, 7.32, sd, 2, 1, G.clad ? CHR : BLK, 0, 0.9, 0.006);
      // bonnet shut line along the top edge and across the nose; a black cowl strip at the windscreen base
      decal(G.ws[0] - 0.06, G.xf - 0.32, 9.35, 9.5, sd, 6, 1, BLK, 0, 0.2, 0.0025);
      decal(G.xf - 0.32 + 0.003, G.xf - 0.32 - 0.003, 9.4, 12, sd, 1, 4, BLK, 0, 0.2, 0.0025);
    }
    // ---- front and rear faces: grille / intake, light bars, plates (boxes just proud of the end caps)
    { const kf = LB(G.xf), w = kf[1], yb = kf[2], yt = kf[3], x = G.xf;
      if (G.clad){ boxR(B, x - 0.03, x + 0.012, yb + 0.12, yt - 0.06, -0.62*w, 0.62*w, BLK, 0, 0.6);
        for (let k = 0; k < 4; k++){ const y = yb + 0.15 + k*(yt - yb - 0.24)/3.5; boxR(B, x + 0.008, x + 0.02, y, y + 0.012, -0.6*w, 0.6*w, CHR, 0, 1.0); } }
      else boxR(B, x - 0.03, x + 0.01, yb + 0.03, yb + 0.12, -0.7*w, 0.7*w, BLK, 0, 0.4);
      if (G.frontBar) boxR(B, x - 0.02, x + 0.006, yt - 0.035, yt - 0.02, -0.82*w, 0.82*w, HEAD, 0, 2);
      if (!G.clad) boxR(B, x - 0.02, x + 0.016, yb + 0.13, yb + 0.28, -0.16, 0.16, PLATE, 0, 0.4); }
    { const kr = LB(G.xr), w = kr[1], yb = kr[2], yt = kr[3], x = G.xr;
      boxR(B, x - 0.016, x + 0.02, yb + 0.15, yb + 0.30, -0.16, 0.16, PLATE, 0, 0.4);
      boxR(B, x - 0.012, x + 0.02, yb + 0.02, yb + 0.08, -0.75*w, 0.75*w, BLK, 0, 0.3);
      if (G.rearBar) boxR(B, x - 0.016, x + 0.012, yt - 0.075, yt - 0.045, -0.8*w, 0.8*w, TAIL, 0, 3); }
    // third brake lamp (top of the rear window / hatch), a shark-fin antenna, the coupe's lip spoiler
    if (key === 'suv'){ const xr = G.rw[0], g = GH(xr - 0.02); boxR(B, xr - 0.06, xr - 0.01, g[1] - 0.02, g[1] + 0.004, -0.14, 0.14, BRKC, 0, 4); }
    else { const xb = G.rw[1] - 0.02, k = LB(xb); boxR(B, xb - 0.05, xb + 0.01, k[3] + k[4] - 0.004, k[3] + k[4] + 0.016, -0.16, 0.16, BRKC, 0, 4); }
    { const xr = G.rw[0];
      const xa = xr + 0.14, ga = GH(xa); hexa(B, [[xa + 0.09, ga[1] + ga[3], -0.03], [xa - 0.05, ga[1] + ga[3], -0.03], [xa - 0.05, ga[1] + ga[3], 0.03], [xa + 0.09, ga[1] + ga[3], 0.03],
        [xa + 0.0, ga[1] + ga[3] + 0.06, -0.012], [xa - 0.05, ga[1] + ga[3] + 0.065, -0.012], [xa - 0.05, ga[1] + ga[3] + 0.065, 0.012], [xa + 0.0, ga[1] + ga[3] + 0.06, 0.012]], BLK, 0, 0.6);
      if (key === 'coupe'){ const xs = G.xr + 0.06, k = LB(xs); hexa(B, [[xs + 0.16, k[3] + k[4], -0.7], [xs, k[3] + k[4], -0.72], [xs, k[3] + k[4], 0.72], [xs + 0.16, k[3] + k[4], 0.7],
        [xs + 0.14, k[3] + k[4] + 0.01, -0.7], [xs - 0.01, k[3] + k[4] + 0.045, -0.72], [xs - 0.01, k[3] + k[4] + 0.045, 0.72], [xs + 0.14, k[3] + k[4] + 0.01, 0.7]], BLK, 0, 0.7); } }
    // [nyc/nycapp] the taxi's roof light: a plain light box on a dark base (no text), lit softly (gl 8, like the displays)
    if (G.roofLight){ const [rx, rw, rh, rl] = G.roofLight, gr = GH(rx), yr = gr[1] + gr[3];
      boxR(B, rx - rl/2 - 0.02, rx + rl/2 + 0.02, yr - 0.02, yr + 0.035, -rw/2 - 0.02, rw/2 + 0.02, BLK, 0, 0.5);
      boxR(B, rx - rl/2, rx + rl/2, yr + 0.035, yr + 0.035 + rh*0.55, -rw/2, rw/2, [0.93, 0.91, 0.84], 0, 8);
      boxR(B, rx - rl/2 + 0.02, rx + rl/2 - 0.02, yr + 0.035 + rh*0.55, yr + 0.035 + rh*0.62, -rw/2 + 0.02, rw/2 - 0.02, [0.85, 0.84, 0.80], 0, 0.6); }
    // ---- mirrors: a painted housing on a short arm, the glass facing back
    for (const sd of [-1, 1]){ const x = G.mirror, k = LB(x), y = k[3] + 0.01, z0 = 0.80*k[1], z1 = k[1] + 0.17;
      bar(B, [x, y - 0.02, sd*z0], [x - 0.04, y + 0.02, sd*(k[1] + 0.06)], 0.05, 0.03, BLK, 0, 0.5);
      hexa(B, [[x + 0.02, y + 0.0, sd*(k[1] + 0.03)], [x - 0.10, y - 0.01, sd*(k[1] + 0.03)], [x - 0.10, y - 0.01, sd*z1], [x - 0.02, y + 0.0, sd*z1],
        [x + 0.02, y + 0.11, sd*(k[1] + 0.035)], [x - 0.10, y + 0.115, sd*(k[1] + 0.035)], [x - 0.10, y + 0.115, sd*(z1 - 0.01)], [x - 0.03, y + 0.10, sd*(z1 - 0.015)]], W, 1, 0.95);
      boxR(B, x - 0.105, x - 0.099, y + 0.01, y + 0.105, Math.min(sd*(k[1] + 0.045), sd*(z1 - 0.012)), Math.max(sd*(k[1] + 0.045), sd*(z1 - 0.012)), [0.55, 0.62, 0.68], 0, 1.25);
 }
    // the lower body's lid over the cabin (belt height, inside the greenhouse) goes last: the interior view leaves it out
    let nNoCabin = B.idx.length;
    { const P = B.p, keep = [], cab = [], x0 = G.rw[1] + 0.05, x1 = G.ws[0] + 0.02;
      const isCab = v => { const x = P[v*3], y = P[v*3 + 1], z = P[v*3 + 2]; if (x < x0 || x > x1) return false; const k = LB(x); return y >= k[3] - 0.004 && y <= k[3] + k[4] + 0.004 && Math.abs(z) <= 0.835*k[1] + 0.005; };
      for (let t = 0; t < B.idx.length; t += 3){ const a0 = B.idx[t], a1 = B.idx[t + 1], a2 = B.idx[t + 2]; (isCab(a0) && isCab(a1) && isCab(a2) ? cab : keep).push(a0, a1, a2); }
      nNoCabin = keep.length; B.idx = keep.concat(cab); }
    const body = B;
    // ---- wheel: road tyre (axle along Z, outer face +Z), spokes, brake disc
    const Wb = GB(), r = G.r, rr = G.rimR, hw = G.tyreW/2;
    lathe(Wb, [[rr - 0.006, hw*0.8], [rr + 0.012, hw*0.93], [rr + 0.03, hw], [r - 0.04, hw], [r - 0.012, hw*0.88], [r - 0.002, hw*0.55], [r, 0], [r - 0.002, -hw*0.55], [r - 0.012, -hw*0.88], [r - 0.04, -hw],
      [rr + 0.03, -hw], [rr + 0.012, -hw*0.93], [rr - 0.006, -hw*0.8]], 'z', [0, 0, 0], 28, () => [TYR, 0, 0.12], true, (r + rr)/2);
    const RIM = G.rimCol;
    lathe(Wb, [[rr + 0.004, hw*0.84], [rr - 0.004, hw*0.9], [rr - 0.02, hw*0.86], [rr - 0.03, hw*0.6]], 'z', [0, 0, 0], 28, () => [RIM, 0, 0.95], false, rr - 0.08);
    const disc = (z, r0, r1, n, col, gl) => { const v0 = Wb.vn; for (let k = 0; k < n; k++){ const t = k/n*2*Math.PI; gv(Wb, Math.cos(t)*r0, Math.sin(t)*r0, z, col, 0, gl); gv(Wb, Math.cos(t)*r1, Math.sin(t)*r1, z, col, 0, gl); }
      for (let k = 0; k < n; k++){ const k2 = (k + 1) % n, a0 = v0 + k*2, a1 = a0 + 1, b0 = v0 + k2*2, b1 = b0 + 1; Wb.idx.push(a0, a1, b1, a0, b1, b0); } };
    disc(-hw*0.35, 0, rr - 0.01, 20, [0.06, 0.06, 0.065], 0.2);
    disc(hw*0.05, 0.085, rr - 0.05, 20, DISC, 0.5);
    if (G.aero) disc(hw*0.62, 0.05, rr - 0.025, 24, [0.16, 0.17, 0.18], 0.7);
    const ns = G.spokes;
    for (let k = 0; k < ns; k++){ const t = (ns === 10 ? Math.floor(k/2)*2*Math.PI/5 + (k % 2 ? 0.17 : -0.17) : k*2*Math.PI/ns), c = Math.cos(t), s = Math.sin(t), tx = -s, ty = c;
      const ri = 0.055, ro = rr - 0.028, wi = ns === 10 ? 0.022 : G.aero ? 0.07 : 0.045, wo = ns === 10 ? 0.03 : G.aero ? 0.11 : 0.06, zf = hw*0.66, zo = hw*0.80, th = 0.03;
      hexa(Wb, [[c*ri - tx*wi, s*ri - ty*wi, zf - th], [c*ro - tx*wo, s*ro - ty*wo, zo - th], [c*ro + tx*wo, s*ro + ty*wo, zo - th], [c*ri + tx*wi, s*ri + ty*wi, zf - th],
        [c*ri - tx*wi, s*ri - ty*wi, zf], [c*ro - tx*wo, s*ro - ty*wo, zo], [c*ro + tx*wo, s*ro + ty*wo, zo], [c*ri + tx*wi, s*ri + ty*wi, zf]], RIM, 0, 0.95); }
    lathe(Wb, [[0.0, hw*0.74], [0.04, hw*0.72], [0.065, hw*0.64]], 'z', [0, 0, 0], 16, () => [[0.12, 0.12, 0.13], 0, 0.8], false, 0.0);
    // ---- interior (drawn only in the overlay views): dashboard, displays, console, seats, door trims, pillars, headliner, mirror
    const I = GB(), e = G.eye, IC = G.intCol, SC = G.seatCol, LT = [0.58, 0.57, 0.55], xA = G.ws[0], xW = G.ws[1];
    const xh = e[0] - 0.08, yh = e[1] - 0.68, dR = e[0] + 0.58, yT = LB(dR)[3] + 0.08;
    let dF = dR; for (let x = dR; x < xA; x += 0.01){ if (GH(x)[1] < yT + 0.05) break; dF = x; }
    const wD = 0.80*LB(dR)[1] - 0.04;
    hexa(I, [[dF, yT - 0.32, -wD], [dR, yT - 0.32, -wD], [dR, yT - 0.32, wD], [dF, yT - 0.32, wD], [dF, yT, -wD], [dR, yT, -wD], [dR, yT, wD], [dF, yT, wD]], IC, 0, 0.3);
    boxR(I, dR - 0.06, dR + 0.002, yT - 0.30, yT - 0.12, -wD, wD, [IC[0]*1.6, IC[1]*1.6, IC[2]*1.6], 0, 0.4);
    boxR(I, dR - 0.03, dR + 0.12, yT, yT + 0.065, e[2] - 0.19, e[2] + 0.19, IC, 0, 0.35);
    boxR(I, dR - 0.034, dR - 0.026, yT + 0.008, yT + 0.058, e[2] - 0.16, e[2] + 0.16, DISP, 0, 8);
    hexa(I, [[dR - 0.02, yT - 0.12, -0.15], [dR - 0.04, yT - 0.12, -0.15], [dR - 0.04, yT - 0.12, 0.15], [dR - 0.02, yT - 0.12, 0.15], [dR + 0.01, yT + 0.07, -0.15], [dR - 0.01, yT + 0.07, -0.15], [dR - 0.01, yT + 0.07, 0.15], [dR + 0.01, yT + 0.07, 0.15]], IC, 0, 0.5);
    hexa(I, [[dR - 0.041, yT - 0.105, -0.135], [dR - 0.045, yT - 0.105, -0.135], [dR - 0.045, yT - 0.105, 0.135], [dR - 0.041, yT - 0.105, 0.135], [dR - 0.011, yT + 0.055, -0.135], [dR - 0.015, yT + 0.055, -0.135], [dR - 0.015, yT + 0.055, 0.135], [dR - 0.011, yT + 0.055, 0.135]], DISP, 0, 8);
    boxR(I, e[0] - 0.42, dR - 0.03, yh - 0.20, yh + 0.12, -0.11, 0.11, IC, 0, 0.35);
    boxR(I, xA - 0.1, e[0] - 1.7, yh - 0.26, yh - 0.22, -0.75, 0.75, [0.05, 0.05, 0.055], 0, 0.1);
    for (const sz of [e[2], -e[2]]){
      boxR(I, xh - 0.14, xh + 0.36, yh - 0.12, yh + 0.02, sz - 0.25, sz + 0.25, SC, 0, 0.3);
      hexa(I, [[xh - 0.10, yh, sz - 0.26], [xh - 0.24, yh, sz - 0.26], [xh - 0.24, yh, sz + 0.26], [xh - 0.10, yh, sz + 0.26], [xh - 0.24, yh + 0.60, sz - 0.23], [xh - 0.37, yh + 0.60, sz - 0.23], [xh - 0.37, yh + 0.60, sz + 0.23], [xh - 0.24, yh + 0.60, sz + 0.23]], SC, 0, 0.3);
      boxR(I, xh - 0.39, xh - 0.27, yh + 0.62, yh + 0.80, sz - 0.13, sz + 0.13, SC, 0, 0.3); }
    boxR(I, xh - 1.10, xh - 0.62, yh - 0.10, yh + 0.04, -0.66, 0.66, SC, 0, 0.3);
    hexa(I, [[xh - 1.02, yh, -0.68], [xh - 1.16, yh, -0.68], [xh - 1.16, yh, 0.68], [xh - 1.02, yh, 0.68], [xh - 1.14, yh + 0.55, -0.62], [xh - 1.28, yh + 0.55, -0.62], [xh - 1.28, yh + 0.55, 0.62], [xh - 1.14, yh + 0.55, 0.62]], SC, 0, 0.3);
    const xc = Math.max(G.rw[0], e[0] - 1.6);
    for (const sd of [-1, 1]){
      for (let i = 0; i < 6; i++){ const x0 = xA - 0.04 + (xc - xA + 0.04)*i/6, x1 = xA - 0.04 + (xc - xA + 0.04)*(i + 1)/6, k0 = LB(x0), k1 = LB(x1);
        hexa(I, [[x0, yh - 0.2, sd*(k0[1] - 0.06)], [x1, yh - 0.2, sd*(k1[1] - 0.06)], [x1, yh - 0.2, sd*(k1[1] - 0.11)], [x0, yh - 0.2, sd*(k0[1] - 0.11)],
          [x0, k0[3] + 0.008, sd*(k0[1] + 0.01)], [x1, k1[3] + 0.008, sd*(k1[1] + 0.01)], [x1, k1[3] + 0.008, sd*(0.80*k1[1] - 0.05)], [x0, k0[3] + 0.008, sd*(0.80*k0[1] - 0.05)]], i % 3 === 1 ? [IC[0]*1.5, IC[1]*1.5, IC[2]*1.5] : IC, 0, 0.3); }
      // A-pillar (inside) from the cowl to the roof header, B-pillar
      const ka = LB(xA - 0.02), gw = GH(xW);
      bar(I, [xA - 0.02, ka[3] + 0.01, sd*(0.80*ka[1] - 0.035)], [xW - 0.02, gw[1] - 0.035, sd*(gw[2] - 0.07)], 0.075, 0.055, LT, 0, 0.3);
      if (G.doors.length > 2){ const xb = G.doors[1] - 0.05, kb = LB(xb), gb = GH(xb); bar(I, [xb, kb[3], sd*(0.80*kb[1] - 0.04)], [xb, gb[1] - 0.03, sd*(gb[2] - 0.06)], 0.11, 0.05, LT, 0, 0.3); }
    }
    // headliner (a glass roof keeps only its side rails), the interior mirror on its stem, sun visors
    { const x0 = xW - 0.01, x1 = G.rw[0] + 0.02, g0 = GH(x0), g1 = GH(x1), gm = GH((x0 + x1)/2), yl = Math.min(g0[1], g1[1], gm[1]) - 0.035;
      if (G.glassRoof){ for (const sd of [-1, 1]) boxR(I, x1, x0, yl - 0.01, yl + 0.012, Math.min(sd*(gm[2] - 0.13), sd*(gm[2] - 0.02)), Math.max(sd*(gm[2] - 0.13), sd*(gm[2] - 0.02)), LT, 0, 0.3);
        boxR(I, x0 - 0.12, x0 + 0.005, yl - 0.012, yl + 0.012, -gm[2] + 0.04, gm[2] - 0.04, LT, 0, 0.3); }
      else boxR(I, x1, x0, yl - 0.01, yl + 0.012, -gm[2] + 0.03, gm[2] - 0.03, LT, 0, 0.3);
      bar(I, [x0 - 0.05, yl, 0], [x0 - 0.08, yl - 0.06, 0], 0.02, 0.02, BLK, 0, 0.4);
      boxR(I, x0 - 0.11, x0 - 0.075, yl - 0.13, yl - 0.06, -0.13, 0.13, BLK, 0, 0.5);
      boxR(I, x0 - 0.103, x0 - 0.10, yl - 0.125, yl - 0.065, -0.122, 0.122, [0.55, 0.62, 0.68], 0, 1.25);
      for (const sd of [-1, 1]) boxR(I, x0 - 0.26, x0 - 0.02, yl - 0.035, yl - 0.012, Math.min(sd*0.08, sd*0.62), Math.max(sd*0.08, sd*0.62), LT, 0, 0.2); }
    // steering column
    const sw = [e[0] + 0.45, e[1] - 0.33, e[2]];
    bar(I, [sw[0] + 0.03, sw[1] - 0.02, sw[2]], [dR + 0.05, yT - 0.16, sw[2]], 0.07, 0.07, IC, 0, 0.3);
    // ---- steering wheel (local: X toward the nose, the rim in the YZ plane)
    const S = GB(), R0 = 0.185, rim = []; for (let k = 0; k <= 40; k++){ const t = k/40*2*Math.PI; rim.push([0, Math.cos(t)*R0, Math.sin(t)*R0]); }
    tube(S, rim, 0.017, 8, 1.0, [0.06, 0.06, 0.065], 0, 0.35);
    for (const t of [Math.PI/2, -Math.PI/2, Math.PI]) bar(S, [0.012, 0, 0], [0.004, Math.cos(t)*(R0 - 0.01), Math.sin(t)*(R0 - 0.01)], 0.045, 0.018, [0.12, 0.12, 0.13], 0, 0.6);
    boxR(S, -0.01, 0.035, -0.055, 0.045, -0.06, 0.06, [0.08, 0.08, 0.09], 0, 0.5);
    return {body, nNoCabin, wheel:Wb, int:I, steer:S, sw,
      lamps:{head:[G.xf + 0.06, LB(hd[1])[3] - 0.06, 0.62*LB(G.xf - 0.1)[1]], tail:[G.xr - 0.06, LB(tl[0])[3] - 0.07, 0.66*LB(G.xr + 0.1)[1]]},
      wpos:[[a, r, -G.track/2, 1, 1], [a, r, G.track/2, 1, 1], [-b, r, -G.track/2, 1, 0], [-b, r, G.track/2, 1, 0]],
      bonnetY:LB(G.bonnet)[3] + LB(G.bonnet)[4], LB, GH};
  }
  return {build};
})();
// the road car material: slot 1 = the paint (a uniform), gl = gloss (glass 1.25: stronger sky reflection) or a lamp code
// (2 head, 3 tail, 4 brake, 5 reverse, 6 / 7 indicators left / right, 8 displays) lit by the uniforms
const RU = {paint:{value:new THREE.Color(0.84, 0.85, 0.84)}, lamp:{value:new THREE.Vector4(0, 0, 0, 0)}, ind:{value:new THREE.Vector3(0, 0, 0.6)}, cab:{value:new THREE.Vector4(0, 0, 0, 0)}, cabP:{value:new THREE.Vector3()}};
const matRC = new THREE.MeshPhongMaterial({vertexColors:true, shininess:90, specular:new THREE.Color(0.5, 0.5, 0.5)});
//</RCAR>
//<RCINT>
/* ================= [lm28/drivecam] the cabins of the road vehicles (drawn only in the overlay views) ================= */
// Built per vehicle from its own body keys (RCGEO's lower body / greenhouse samplers LB / GH, windscreen ws, rear window rw, side
// windows win, door gaps doors, the eye) in the road car material's vertex format (colour, slot (1 = the paint), gl = gloss; 8 =
// displays (glow), 9 = ambient strips (glow at night)): a dashboard swept across the cabin under the windscreen, a hooded instrument
// cluster with two abstract dials (the needles are drawn apart and turn with the speed and the revs), a centre screen with an abstract
// map, air vents, a brushed trim band and an ambient light strip; a three-spoke steering wheel with an airbag hub (no badge), the
// column shroud and two stalks; the driver's gloved hands on the rim (the sleeves are solved per frame); a centre console with the
// gear selector, cup holders and an armrest; shaped front seats with bolsters and headrests, the rear bench; door trims (armrest,
// handle, pull, speaker, switches, shut lines, an ambient strip); the pillars (A along the windscreen, B, C / D), the headliner (the
// side rails and the headers under a glass roof), sun visors, grab handles, the dome lamp, the interior mirror; the floor, the parcel
// shelf / load cover; the wiper arms at the base of the windscreen. The pickup (drawn by the traffic module outside) gets its own
// cab (an extended cab, its bonnet line and mirrors); the motorbike its rider's view (tank, cowl, screen, clocks, bars, mirrors);
// the bus its driver's place and the saloon. Mirror glass is described
// (centre, axes, size, the region of the rear view it shows) for the live mirrors of the camera module.
const RCINT = (() => {
  const {GB, gv, gto, bar, tube} = F1GEO.H;
  const A3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], S3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], K3 = (a, k) => [a[0]*k, a[1]*k, a[2]*k];
  const D3 = (a, b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2], X3 = (a, b) => [a[1]*b[2] - a[2]*b[1], a[2]*b[0] - a[0]*b[2], a[0]*b[1] - a[1]*b[0]];
  const N3 = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0]/l, a[1]/l, a[2]/l]; };
  const MIX = (a, b, t) => [a[0] + (b[0] - a[0])*t, a[1] + (b[1] - a[1])*t, a[2] + (b[2] - a[2])*t], SCL = (c, k) => [c[0]*k, c[1]*k, c[2]*k];
  const BLK = [0.022, 0.023, 0.026], DK = [0.045, 0.046, 0.05], CHR = [0.66, 0.68, 0.71], MET = [0.40, 0.41, 0.43], SCRN = [0.03, 0.045, 0.065], CARP = [0.05, 0.05, 0.054];
  const GLOVE = [0.15, 0.105, 0.075], SLEEVE = [0.075, 0.09, 0.13], RUB = [0.035, 0.035, 0.038], MIRB = [0.30, 0.34, 0.38];
  const XA = [1, 0, 0], YA = [0, 1, 0], ZA = [0, 0, 1];
  const F0 = (o, X, Y, Z) => ({o, X:X || XA, Y:Y || YA, Z:Z || ZA});
  // a frame turned about Z (pitch, the X axis tilts up) then about Y (yaw)
  const FP = (o, pitch, yaw) => { const cp = Math.cos(pitch || 0), sp = Math.sin(pitch || 0), cy = Math.cos(yaw || 0), sy = Math.sin(yaw || 0);
    const X = [cp*cy, sp, -cp*sy], Y = [-sp*cy, cp, sp*sy], Z = [sy, 0, cy]; return {o, X, Y, Z}; };
  const at = (F, x, y, z) => [F.o[0] + F.X[0]*x + F.Y[0]*y + F.Z[0]*z, F.o[1] + F.X[1]*x + F.Y[1]*y + F.Z[1]*z, F.o[2] + F.X[2]*x + F.Y[2]*y + F.Z[2]*z];
  // a quad a b c d (around) facing away from the point r
  function quad(B, a, b, c, d, col, gl, r, slot){ const s = slot || 0, i = [a, b, c, d].map(p => gv(B, p[0], p[1], p[2], col, s, gl)); gto(B, i[0], i[1], i[2], r[0], r[1], r[2]); gto(B, i[0], i[2], i[3], r[0], r[1], r[2]); }
  // a rectangle at c spanned by U (half hu) and V (half hv), facing N
  const panel = (B, c, U, V, N, hu, hv, col, gl, slot) => quad(B, A3(A3(c, K3(U, -hu)), K3(V, -hv)), A3(A3(c, K3(U, hu)), K3(V, -hv)), A3(A3(c, K3(U, hu)), K3(V, hv)), A3(A3(c, K3(U, -hu)), K3(V, hv)), col, gl, A3(c, K3(N, -1)), slot);
  // a smooth surface through rows of points R[i][j], shared vertices, every quad facing away from ref(i, j)
  function grid(B, R, col, gl, ref, slot){
    const n = R.length, m = R[0].length, v0 = B.vn;
    for (let i = 0; i < n; i++) for (let j = 0; j < m; j++){ const p = R[i][j]; gv(B, p[0], p[1], p[2], typeof col === 'function' ? col(i, j) : col, slot || 0, gl); }
    for (let i = 0; i < n - 1; i++) for (let j = 0; j < m - 1; j++){ const a = v0 + i*m + j, b = a + 1, c = a + m + 1, d = a + m, r = typeof ref === 'function' ? ref(i, j) : ref;
      gto(B, a, b, c, r[0], r[1], r[2]); gto(B, a, c, d, r[0], r[1], r[2]); }
  }
  // a closed profile [[x, y], ...] (a simple polygon) swept along Z from z0 to z1 in frame F (flat caps)
  function prism(B, P, z0, z1, col, gl, F, slot){
    F = F || F0([0, 0, 0]); const s = slot || 0; let A = 0; for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i + 1) % P.length]; A += a[0]*b[1] - b[0]*a[1]; } const sg = A > 0 ? 1 : -1;
    const tris = THREE.ShapeUtils.triangulateShape(P.map(p => new THREE.Vector2(p[0], p[1])), []);
    for (const [z, rz] of [[z0, z0 - 1], [z1, z1 + 1]]){ const v = P.map(p => { const q = at(F, p[0], p[1], z); return gv(B, q[0], q[1], q[2], col, s, gl); });
      for (const t of tris){ const cx = (P[t[0]][0] + P[t[1]][0] + P[t[2]][0])/3, cy = (P[t[0]][1] + P[t[1]][1] + P[t[2]][1])/3, r = at(F, cx, cy, z === z0 ? z0 + 1 : z1 - 1); gto(B, v[t[0]], v[t[1]], v[t[2]], r[0], r[1], r[2]); } void rz; }
    for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i + 1) % P.length], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, ix = -dy/l*sg*0.02, iy = dx/l*sg*0.02;
      quad(B, at(F, a[0], a[1], z0), at(F, b[0], b[1], z0), at(F, b[0], b[1], z1), at(F, a[0], a[1], z1), col, gl, at(F, (a[0] + b[0])/2 + ix, (a[1] + b[1])/2 + iy, (z0 + z1)/2), s); }
  }
  // a rounded box: half sizes hx, hy, hz, edge radius r, in frame F (smooth sides, rounded ends)
  function rrect(hy, hz, r, ns){ const R = []; r = Math.max(0.0004, Math.min(r, hy - 1e-4, hz - 1e-4));
    for (let q = 0; q < 4; q++){ const cy = (q === 0 || q === 3) ? hy - r : r - hy, cz = q < 2 ? hz - r : r - hz;
      for (let s = 0; s <= ns; s++){ const a = (q + s/ns)*PI/2; R.push([cy + Math.cos(a)*r, cz + Math.sin(a)*r]); } }
    return R; }
  function rbox(B, F, hx, hy, hz, r, col, gl, ns, slot){
    ns = ns || 2; r = Math.min(r, hx*0.98, hy*0.98, hz*0.98); const sl = slot || 0, st = [], ne = 2;
    for (let s = 0; s <= ne; s++){ const a = s/ne*PI/2; st.push([-hx + r*(1 - Math.cos(a)), r*(1 - Math.sin(a))]); }
    for (let s = ne; s >= 0; s--){ const a = s/ne*PI/2; st.push([hx - r*(1 - Math.cos(a)), r*(1 - Math.sin(a))]); }
    const v0 = B.vn; let M = 0;
    for (const [x, d] of st){ const R = rrect(hy - d, hz - d, Math.max(0.0004, r - d), ns); M = R.length; for (const p of R){ const q = at(F, x, p[0], p[1]); gv(B, q[0], q[1], q[2], col, sl, gl); } }
    const o = F.o;
    for (let i = 0; i < st.length - 1; i++) for (let j = 0; j < M; j++){ const a = v0 + i*M + j, b = v0 + i*M + (j + 1) % M, c = v0 + (i + 1)*M + (j + 1) % M, d = v0 + (i + 1)*M + j; gto(B, a, b, c, o[0], o[1], o[2]); gto(B, a, c, d, o[0], o[1], o[2]); }
    for (const i of [0, st.length - 1]){ const x = st[i][0], c = at(F, x, 0, 0), cv = gv(B, c[0], c[1], c[2], col, sl, gl), R = rrect(hy - st[i][1], hz - st[i][1], 0.0004, ns).map(p => { const q = at(F, x, p[0], p[1]); return gv(B, q[0], q[1], q[2], col, sl, gl); });
      for (let j = 0; j < R.length; j++) gto(B, cv, R[j], R[(j + 1) % R.length], o[0], o[1], o[2]); }
  }
  // a frustum from p to q, radii r0 / r1 (capped)
  function taper(B, p, q, r0, r1, n, col, gl){
    const ax = N3(S3(q, p)), h = Math.abs(ax[1]) < 0.9 ? YA : XA, u = N3(X3(ax, h)), w = X3(ax, u), v0 = B.vn, m = (A3(p, q)).map(x => x/2);
    for (const [c, r] of [[p, r0], [q, r1]]) for (let k = 0; k < n; k++){ const t = k/n*TAU, e = A3(c, A3(K3(u, Math.cos(t)*r), K3(w, Math.sin(t)*r))); gv(B, e[0], e[1], e[2], col, 0, gl); }
    for (let k = 0; k < n; k++){ const a = v0 + k, b = v0 + (k + 1) % n, c = b + n, d = a + n; gto(B, a, b, c, m[0], m[1], m[2]); gto(B, a, c, d, m[0], m[1], m[2]); }
    for (const [c, s] of [[p, 0], [q, n]]){ const cv = gv(B, c[0], c[1], c[2], col, 0, gl); for (let k = 0; k < n; k++) gto(B, cv, v0 + s + k, v0 + s + (k + 1) % n, m[0], m[1], m[2]); }
  }
  // flat discs and annulus sectors in the plane (U, V), facing N
  function arc(B, c, U, V, N, r0, r1, a0, a1, n, col, gl){ const ref = A3(c, K3(N, -1)), P = (r, t) => A3(c, A3(K3(U, Math.cos(t)*r), K3(V, Math.sin(t)*r)));
    for (let i = 0; i < n; i++){ const t0 = a0 + (a1 - a0)*i/n, t1 = a0 + (a1 - a0)*(i + 1)/n; quad(B, P(r0, t0), P(r1, t0), P(r1, t1), P(r0, t1), col, gl, ref); } }
  function disc(B, c, U, V, N, r, n, col, gl){ const ref = A3(c, K3(N, -1)), cv = gv(B, c[0], c[1], c[2], col, 0, gl), R = [];
    for (let k = 0; k < n; k++){ const t = k/n*TAU, p = A3(c, A3(K3(U, Math.cos(t)*r), K3(V, Math.sin(t)*r))); R.push(gv(B, p[0], p[1], p[2], col, 0, gl)); }
    for (let k = 0; k < n; k++) gto(B, cv, R[k], R[(k + 1) % n], ref[0], ref[1], ref[2]); }
  // an air vent on a face (c, U across, V up, N out): a dark recess and slats
  function vent(B, c, U, V, N, hu, hv, col){ panel(B, A3(c, K3(N, 0.001)), U, V, N, hu, hv, BLK, 0.2);
    rbox(B, F0(A3(c, K3(N, 0.004)), U, V, N), hu + 0.008, hv + 0.008, 0.004, 0.003, col, 0.6);
    for (let k = -1; k <= 1; k++) rbox(B, F0(A3(A3(c, K3(V, k*hv*0.55)), K3(N, 0.006)), U, V, N), hu - 0.004, 0.003, 0.004, 0.0015, DK, 0.5); }
  // ---- the screens: abstract instrument dials and an abstract map (no text, no logos)
  function dials(B, c, U, V, N, hu, hv, out){
    panel(B, c, U, V, N, hu, hv, SCRN, 8);
    const R = Math.min(hv*0.78, hu*0.42), o = K3(N, 0.0012), RING = [0.42, 0.52, 0.62], TICK = [0.72, 0.8, 0.88];
    for (const [s, red] of [[-1, false], [1, true]]){ const cc = A3(A3(c, K3(U, s*hu*0.5)), o);
      arc(B, cc, U, V, N, R*0.9, R, -PI/4, 5*PI/4, 18, RING, 8);
      if (red) arc(B, A3(cc, K3(N, 0.0004)), U, V, N, R*0.86, R, -PI/4, PI/8, 5, [0.85, 0.16, 0.1], 8);
      else arc(B, A3(cc, K3(N, 0.0004)), U, V, N, R*0.86, R, 0.85*PI, 5*PI/4, 4, [0.2, 0.75, 0.5], 8);
      for (let k = 0; k <= 8; k++){ const t = 5*PI/4 - k*(3*PI/2)/8, d = A3(K3(U, Math.cos(t)), K3(V, Math.sin(t))), p = A3(cc, K3(d, R*0.78)), q = A3(cc, K3(d, R*0.88)), m = K3(A3(p, q), 0.5);
        quad(B, A3(p, K3(X3(N, d), 0.0018)), A3(q, K3(X3(N, d), 0.0018)), A3(q, K3(X3(N, d), -0.0018)), A3(p, K3(X3(N, d), -0.0018)), TICK, 8, A3(m, K3(N, -1))); }
      disc(B, A3(cc, K3(N, 0.0006)), U, V, N, R*0.1, 10, [0.15, 0.17, 0.2], 8);
      out.push({c:cc, U, V, N, r:R*0.8, kind:s < 0 ? 'speed' : 'power'}); }
    // the middle: an abstract readout (bars) and a few dim indicator dots
    const m = A3(c, o); panel(B, m, U, V, N, hu*0.16, hv*0.5, [0.07, 0.1, 0.14], 8);
    for (let k = 0; k < 3; k++) panel(B, A3(A3(m, K3(V, hv*(0.28 - k*0.26))), K3(N, 0.0005)), U, V, N, hu*(0.11 - k*0.02), hv*0.05, [[0.35, 0.75, 1.0], [0.6, 0.66, 0.72], [0.3, 0.85, 0.55]][k], 8);
  }
  function mapScreen(B, c, U, V, N, hu, hv){
    const L = (u, v, l) => A3(A3(A3(c, K3(U, u*hu)), K3(V, v*hv)), K3(N, 0.0007*l)), ref = A3(c, K3(N, -1));
    const rect = (u0, v0, u1, v1, col, l) => quad(B, L(u0, v0, l), L(u1, v0, l), L(u1, v1, l), L(u0, v1, l), col, 8, ref);
    const line = (pts, w, col, l) => { for (let k = 0; k < pts.length - 1; k++){ const a = pts[k], b = pts[k + 1], du = (b[0] - a[0])*hu, dv = (b[1] - a[1])*hv, d = Math.hypot(du, dv) || 1, nu = -dv/d*w/hu, nv = du/d*w/hv;
      quad(B, L(a[0] - nu, a[1] - nv, l), L(b[0] - nu, b[1] - nv, l), L(b[0] + nu, b[1] + nv, l), L(a[0] + nu, a[1] + nv, l), col, 8, ref); } };
    rect(-1, -1, 1, 1, [0.05, 0.075, 0.1], 0);
    rect(-1, -1, -0.25, -0.35, [0.06, 0.15, 0.27], 1);                      // water
    rect(0.35, 0.25, 0.85, 0.75, [0.07, 0.2, 0.11], 1);                      // a park
    for (let i = 0; i < 5; i++) for (let j = 0; j < 4; j++){ const u = -0.15 + i*0.22, v = -0.75 + j*0.42; if (u > 0.3 && v > 0.2) continue; rect(u, v, u + 0.15, v + 0.3, [0.1, 0.12, 0.15], 1); }
    line([[-1, 0.12], [1, 0.12]], 0.006, [0.42, 0.46, 0.52], 2); line([[0.1, -1], [0.1, 0.8]], 0.006, [0.42, 0.46, 0.52], 2); line([[-0.3, -1], [0.95, 0.9]], 0.009, [0.85, 0.7, 0.32], 2);
    line([[-0.55, -0.85], [-0.05, -0.3], [0.1, 0.12], [0.55, 0.12], [0.62, 0.6]], 0.011, [0.25, 0.62, 1.0], 3);       // the route
    { const p = L(-0.05, -0.3, 4); quad(B, A3(p, K3(V, 0.016)), A3(A3(p, K3(U, 0.011)), K3(V, -0.01)), p, A3(A3(p, K3(U, -0.011)), K3(V, -0.01)), [0.95, 0.96, 1.0], 8, ref); }
    rect(-1, 0.84, 1, 1, [0.03, 0.04, 0.055], 2); rect(-1, -1, 1, -0.84, [0.03, 0.04, 0.055], 2);       // status bar, dock
    for (let k = 0; k < 5; k++) rect(-0.5 + k*0.22, -0.97, -0.4 + k*0.22, -0.87, [[0.3, 0.6, 0.95], [0.4, 0.8, 0.5], [0.95, 0.65, 0.3], [0.75, 0.75, 0.8], [0.85, 0.4, 0.5]][k], 3);
  }
  // ---- the steering wheel (local: X toward the nose, the rim in the YZ plane), radius R0
  function wheel(R0, rimR, hub){
    const S = GB(), rim = []; for (let k = 0; k <= 40; k++){ const t = k/40*TAU; rim.push([0, Math.cos(t)*R0, Math.sin(t)*R0]); }
    tube(S, rim, rimR, 10, 1.0, [0.05, 0.05, 0.055], 0, 0.45);
    const SP = [0.1, 0.1, 0.11];
    for (const sg of [-1, 1]){   // the 3 / 9 o'clock spokes: flat, tapered, with abstract buttons
      const a = [0.012, -0.008, sg*0.055], b = [0.003, -0.018, sg*(R0 - 0.01)], u = N3(S3(b, a));
      quad(S, A3(a, [0, 0.026, 0]), A3(b, [0, 0.02, 0]), A3(b, [0, -0.02, 0]), A3(a, [0, -0.028, 0]), SP, 0.6, [0.05, -0.01, (a[2] + b[2])/2]);
      quad(S, A3(a, [0.012, 0.026, 0]), A3(b, [0.008, 0.02, 0]), A3(b, [0.008, -0.02, 0]), A3(a, [0.012, -0.028, 0]), SP, 0.6, [-0.05, -0.01, (a[2] + b[2])/2]);
      for (let k = 0; k < 2; k++) for (let j = 0; j < 2; j++) rbox(S, F0([-0.0015, -0.018 + 0.018*j, sg*(0.085 + 0.022*k)]), 0.003, 0.0065, 0.008, 0.002, [0.16, 0.17, 0.19], 0.7, 1);
      void u; }
    quad(S, [0.014, -0.05, -0.02], [0.004, -(R0 - 0.01), -0.024], [0.004, -(R0 - 0.01), 0.024], [0.014, -0.05, 0.02], SP, 0.6, [0.05, -0.1, 0]);
    quad(S, [0.024, -0.05, -0.02], [0.012, -(R0 - 0.01), -0.024], [0.012, -(R0 - 0.01), 0.024], [0.024, -0.05, 0.02], SP, 0.6, [-0.05, -0.1, 0]);
    rbox(S, F0([0.004, -0.004, 0]), hub[0], hub[1], hub[2], 0.03, [0.075, 0.075, 0.08], 0.45, 3);       // the airbag hub (no badge)
    rbox(S, F0([0.03, -0.004, 0]), 0.022, hub[1]*0.8, hub[2]*0.8, 0.015, BLK, 0.3, 2);
    return S;
  }
  // the driver's gloved hands at 9 and 3 o'clock (wheel-local); wrist points (local) for the sleeves
  function hands(R0, rimR){
    const H = GB(), out = [];
    for (const sg of [-1, 1]){ const rp = [0, 0, sg*R0], Rr = [0, 0, sg], T = [0, sg, 0];
      const arcP = []; for (let k = 0; k <= 6; k++){ const t = -0.27 + k*0.09, c = Math.cos(t), s = Math.sin(t); arcP.push([0, s*R0, sg*c*R0]); }
      tube(H, arcP, rimR + 0.017, 8, 0.92, GLOVE, 0, 0.25);                                   // fingers around the rim
      rbox(H, F0(A3(rp, A3(K3(Rr, 0.022), [-0.022, 0.006, 0])), [0, 1, 0], [1, 0, 0], [0, 0, 1]), 0.05, 0.026, 0.036, 0.022, GLOVE, 0.25, 2);   // the back of the hand
      rbox(H, F0(A3(rp, [-0.012, 0.045, -sg*0.012]), N3([0.3, 1, -sg*0.5]), N3([1, -0.3, 0]), N3(X3(N3([0.3, 1, -sg*0.5]), N3([1, -0.3, 0])))), 0.026, 0.012, 0.012, 0.011, GLOVE, 0.25, 2);  // the thumb
      void T; out.push(A3(rp, A3(K3(Rr, 0.03), [-0.06, -0.012, 0]))); }
    return {H, wrist:out};
  }
  // a sleeve (unit length along +Z, tapered, with a cuff ring at the wrist end): instanced, solved per frame
  function sleeve(){ const B = GB(); taper(B, [0, 0, 0], [0, 0, 1], 0.036, 0.05, 10, SLEEVE, 0.2); taper(B, [0, 0, -0.005], [0, 0, 0.05], 0.041, 0.041, 10, [0.07, 0.075, 0.085], 0.2); return B; }
  // a gauge needle (local: along +X from the hub, in the XY plane, facing +Z)
  function needle(){ const B = GB(); quad(B, [-0.006, -0.0016, 0], [1, -0.0007, 0], [1, 0.0007, 0], [-0.006, 0.0016, 0], [1.0, 0.36, 0.14], 8, [0.5, 0, -1]);
    disc(B, [0, 0, 0.0004], XA, YA, ZA, 0.0042, 8, [0.2, 0.2, 0.22], 8); return B; }
  // ---- the cabin of a car with RCGEO keys (sedan, SUV, coupe, taxi)
  function car(key, g, Gx){
    const G = Gx || RCAR[key].g, LB = g.LB, GH = g.GH, e = G.eye, ex = e[0], ey = e[1], ez = e[2], dz = Math.abs(ez), I = GB(), mir = [], gauges = [];
    const IC = G.intCol, IC2 = MIX(IC, [0.36, 0.36, 0.37], 0.45), SCc = G.seatCol, SCd = SCL(SCc, 0.72), HLc = key === 'coupe' ? [0.13, 0.13, 0.14] : [0.52, 0.51, 0.49], HLd = SCL(HLc, 0.82);
    const AMB = key === 'coupe' ? [1.0, 0.42, 0.12] : key === 'taxi' ? [0.95, 0.85, 0.6] : [0.35, 0.62, 1.0];
    const xA = G.ws[0], xW = G.ws[1], xR0 = G.rw[0], xR1 = G.rw[1], belt = x => LB(x)[3], wO = x => LB(x)[1], flo = x => LB(x)[2] + 0.11;
    const shellZ = (x, y) => { const k = LB(x), w = k[1], yb = k[2], yt = k[3], h = Math.max(0.05, yt - yb);
      const Q = [[yb + 0.015, 0.84*w], [yb + 0.07*h, 0.955*w], [yb + 0.22*h, 0.99*w], [yb + 0.45*h, w], [yb + 0.70*h, 0.995*w], [yb + 0.86*h, 0.975*w], [yb + 0.95*h, 0.935*w], [yt, 0.83*w]];
      if (y <= Q[0][0]) return Q[0][1]; for (let i = 0; i < Q.length - 1; i++) if (y <= Q[i + 1][0]) return Q[i][1] + (Q[i + 1][1] - Q[i][1])*(y - Q[i][0])/Math.max(1e-6, Q[i + 1][0] - Q[i][0]); return Q[Q.length - 1][1]; };
    const ring = x => { const k = LB(x), yb = k[3], q = GH(x), yr = Math.max(yb, q[1]); return {yb, wb:0.80*k[1], yr, wr:q[2], cr:q[3], q:clamp((yr - yb)/0.12, 0, 1)}; };
    const glassZ = (x, y) => { const r = ring(x), t = clamp((y - r.yb)/Math.max(0.03, r.yr - r.yb), 0, 1); return r.wb + (r.wr - r.wb)*t + 0.012*r.q*4*t*(1 - t); };
    const trimZ = (x, y) => shellZ(x, y) - 0.075;
    const inWin = (x, m) => G.win.some(w => x <= w[0] + m && x >= w[1] - m);
    const xh = ex - 0.08, yh = ey - 0.68, xd = ex + 0.60, yT = Math.min(belt(xd) + 0.07, ey - 0.13), rear = key !== 'coupe' || true, xhr = xh - (key === 'coupe' ? 0.74 : 0.86), yhr = yh + 0.03;
    const xEnd = xR1 + 0.03, xFront = Math.min(xA, G.doors[0]) - 0.01;
    // -- the dashboard: one profile swept across the cabin (its top kept under the windscreen)
    const wD = glassZ(xd, yT) - 0.012, b0 = belt(xA) + 0.012, prof = [];
    for (let k = 0; k <= 7; k++){ const s = k/7, x = xA - 0.03 + (xd + 0.06 - xA + 0.03)*s, y = Math.min(b0 + (yT - b0)*sstep(0, 1, Math.pow(s, 0.8)), GH(x)[1] - 0.03); prof.push([x, y]); }
    prof.push([xd + 0.02, yT - 0.004], [xd, yT - 0.022], [xd - 0.008, yT - 0.055], [xd - 0.012, yT - 0.2], [xd + 0.04, yT - 0.32], [xd + 0.2, yT - 0.42], [xd + 0.42, flo(xd + 0.42) + 0.12], [xA - 0.03, flo(xA) + 0.12]);
    prism(I, prof, -wD, wD, IC, 0.32);
    // the cluster hood on the driver's side and the cluster screen under its lip (tilted back)
    prism(I, [[xd + 0.25, yT - 0.002], [xd + 0.12, yT + 0.082], [xd - 0.012, yT + 0.084], [xd - 0.034, yT + 0.064], [xd - 0.03, yT + 0.054], [xd + 0.06, yT + 0.05], [xd + 0.14, yT + 0.01]], ez - 0.2, ez + 0.2, SCL(IC, 0.8), 0.3);
    { const bot = [xd - 0.03, yT - 0.088], top = [xd - 0.012, yT + 0.05], V = N3([top[0] - bot[0], top[1] - bot[1], 0]), N = N3(X3(ZA, V)), c = [(bot[0] + top[0])/2, (bot[1] + top[1])/2, ez];
      rbox(I, F0(A3(c, K3(N, -0.006)), N, V, ZA), 0.006, 0.075, 0.178, 0.006, BLK, 0.4);
      dials(I, A3(c, K3(N, 0.0005)), ZA, V, N, 0.165, 0.062, gauges); }
    // the brushed trim band, the vents and the ambient strip on the face of the dash
    const scHu = key === 'sedan' ? 0 : key === 'coupe' ? 0.105 : 0.13, scHv = key === 'coupe' ? 0.062 : 0.074;
    { const N = [-1, 0, 0], yb = yT - 0.125, cut = [[-wD + 0.01, -1]], gaps = [[ez - 0.2, ez + 0.2]].concat(scHu ? [[-scHu - 0.03, scHu + 0.03]] : []).sort((a, b) => a[0] - b[0]);
      let zc = -wD + 0.01; const R = []; for (const gq of gaps){ if (gq[0] > zc) R.push([zc, gq[0]]); zc = Math.max(zc, gq[1]); } R.push([zc, wD - 0.01]); void cut;
      for (const [z0, z1] of R) if (z1 > z0 + 0.02) rbox(I, F0([xd - 0.016, yb, (z0 + z1)/2]), 0.006, 0.014, (z1 - z0)/2, 0.005, MET, 0.85);
      rbox(I, F0([xd - 0.015, yT - 0.06, 0]), 0.004, 0.0025, wD - 0.02, 0.002, AMB, 9);
      for (const z of [-wD + 0.13, wD - 0.13]) vent(I, [xd - 0.012, yT - 0.165, z], ZA, YA, N, 0.065, 0.032, MET);
      for (const z of [-0.2, 0.2]) vent(I, [xd - 0.012, key === 'sedan' ? yT - 0.2 : yT - 0.255, key === 'sedan' ? z*0.75 : z*0.55], ZA, YA, N, 0.05, 0.026, MET); }
    // the centre screen: a floating tablet (the electric sedan) or set into the dash face
    if (key === 'sedan'){ const V = N3([0.26, 1, 0]), N = N3(X3(ZA, V)), c = [xd + 0.045, yT + 0.062, 0];
      rbox(I, F0(A3(c, K3(N, -0.008)), N, V, ZA), 0.008, 0.09, 0.168, 0.008, BLK, 0.5); mapScreen(I, A3(c, K3(N, 0.0005)), ZA, V, N, 0.158, 0.082);
      rbox(I, F0([xd + 0.07, yT + 0.005, 0]), 0.04, 0.012, 0.05, 0.008, BLK, 0.4); }
    else { const hu = scHu, hv = scHv, V = N3([0.12, 1, 0]), N = N3(X3(ZA, V)), c = [xd - 0.022, yT - 0.045 - hv, 0];
      rbox(I, F0(A3(c, K3(N, -0.004)), N, V, ZA), 0.008, hv + 0.012, hu + 0.012, 0.008, BLK, 0.5); mapScreen(I, A3(c, K3(N, 0.004)), ZA, V, N, hu, hv); }
    // the steering column shroud and the two stalks (the column axis tilts up by the wheel's angle)
    // the wheel's rim kept under the sight line from the eye to the dials (a high seat over a low dash: the wheel sits lower)
    // (and no lower than 0.43 m under the eye: the rim stays in view)
    const sw = [ex + 0.45, Math.max(ey - 0.43, Math.min(ey - 0.33, ey + 0.651*(yT - 0.07 - ey) - 0.191)), ez], tilt = 0.44, CA = [Math.cos(tilt), Math.sin(tilt), 0], CU = [-Math.sin(tilt), Math.cos(tilt), 0];
    rbox(I, F0(A3(sw, K3(CA, 0.16)), CA, CU, ZA), 0.11, 0.05, 0.055, 0.03, BLK, 0.35);
    for (const sg of [-1, 1]){ const p = A3(A3(sw, K3(CA, 0.075)), A3(K3(CU, 0.018), [0, 0, sg*0.05])), q = A3(A3(p, K3(CA, -0.03)), [0, -0.03, sg*0.12]);
      bar(I, p, q, 0.014, 0.014, BLK, 0, 0.5); rbox(I, F0(q, N3(S3(q, p)), YA, N3(X3(N3(S3(q, p)), YA))), 0.025, 0.01, 0.01, 0.006, DK, 0.5); }
    // -- the centre console: the stack, the tunnel top, the gear selector, cup holders, the armrest
    { const yc = yh + 0.15, x2 = xh + 0.06;
      prism(I, [[xd + 0.07, yT - 0.11], [xd - 0.012, yT - 0.15], [xd - 0.07, yc + 0.06], [xd - 0.12, yc], [x2, yc], [x2 - 0.04, yc + 0.07], [xh - 0.3, yc + 0.08], [xh - 0.33, yc + 0.02], [xh - 0.35, flo(xh)], [xd + 0.32, flo(xd + 0.32)]], -0.115, 0.115, IC, 0.3);
      rbox(I, F0([xh - 0.12, yc + 0.095, 0]), 0.2, 0.025, 0.105, 0.02, SCc, 0.3);
      vent(I, [xd - 0.05, yT - 0.3, 0], ZA, N3([0.6, 1, 0]), N3(X3(ZA, N3([0.6, 1, 0]))), 0.07, 0.022, MET);
      const xg = (xd - 0.12 + x2)/2 + 0.04;
      if (key === 'sedan') { rbox(I, F0([xg, yc + 0.012, 0]), 0.045, 0.012, 0.035, 0.01, BLK, 0.6); rbox(I, F0([xg, yc + 0.025, 0]), 0.025, 0.006, 0.018, 0.005, CHR, 0.9); }
      else { rbox(I, F0([xg, yc + 0.01, 0]), 0.05, 0.012, 0.045, 0.01, BLK, 0.3); taper(I, [xg, yc + 0.01, 0], [xg - 0.02, yc + 0.1, 0], 0.009, 0.008, 8, key === 'coupe' ? MET : BLK, 0.6);
        rbox(I, FP([xg - 0.022, yc + 0.12, 0], 0.2, 0), 0.03, 0.026, 0.024, 0.018, key === 'coupe' ? MET : BLK, 0.7); rbox(I, F0([xg - 0.02, yc + 0.098, 0]), 0.013, 0.004, 0.013, 0.004, CHR, 0.9); }
      for (const z of [-0.045, 0.045]){ const c = [xg - 0.13, yc + 0.002, z]; disc(I, c, XA, ZA, YA, 0.032, 12, BLK, 0.2); arc(I, A3(c, [0, 0.001, 0]), XA, ZA, YA, 0.032, 0.037, 0, TAU, 12, CHR, 0.9); } }
    // -- seats
    function seat(x, y, z, w, col, cold, hr){
      const c0 = FP([x + 0.13, y - 0.03, z], 0.1, 0); rbox(I, c0, 0.25, 0.055, w/2 - 0.05, 0.045, col, 0.3, 3);
      for (const s of [-1, 1]) rbox(I, FP(at(c0, 0, 0.03, s*(w/2 - 0.045)), 0.1, 0), 0.24, 0.06, 0.045, 0.035, cold, 0.3, 2);
      const rec = 0.4, Bk = [-Math.sin(rec), Math.cos(rec), 0], Nb = [Math.cos(rec), Math.sin(rec), 0], b0 = [x - 0.11, y + 0.02, z], cb = A3(b0, K3(Bk, 0.3));
      rbox(I, F0(cb, Bk, Nb, ZA), 0.31, 0.06, w/2 - 0.05, 0.045, col, 0.3, 3);
      for (const s of [-1, 1]) rbox(I, F0(A3(A3(b0, K3(Bk, 0.25)), [0.03*Nb[0], 0.03*Nb[1], s*(w/2 - 0.045)]), Bk, Nb, ZA), 0.22, 0.06, 0.04, 0.03, cold, 0.3, 2);
      rbox(I, F0(A3(A3(b0, K3(Bk, 0.3)), K3(Nb, -0.065)), Bk, Nb, ZA), 0.3, 0.012, w/2 - 0.02, 0.01, SCL(cold, 0.6), 0.3, 1);            // the seat back's shell
      if (hr){ const ht = A3(b0, K3(Bk, 0.6)), hc = A3(A3(ht, K3(Bk, 0.13)), K3(Nb, 0.015));
        rbox(I, F0(hc, Bk, Nb, ZA), 0.085, 0.055, 0.13, 0.04, col, 0.3, 3);
        for (const s of [-1, 1]) bar(I, A3(ht, [0, -0.02, s*0.06]), A3(A3(hc, K3(Bk, -0.06)), [0, 0, s*0.06]), 0.012, 0.012, CHR, 0, 0.9); }
      rbox(I, F0([x + 0.12, (y - 0.09 + flo(x))/2, z]), 0.2, Math.max(0.03, (y - 0.09 - flo(x))/2), w/2 - 0.08, 0.02, BLK, 0.3, 1);
    }
    for (const s of [-1, 1]) seat(xh, yh, s*dz, 0.52, SCc, SCd, true);
    // the rear bench (2 places in the coupe, 3 in the others); the pickup's cab: a back wall around its small rear window
    if (G.noRear){ const xb = xR0 + 0.03, y0 = flo(xb), y1 = GH(xb)[1] - 0.03, w = trimZ(xb, (y0 + belt(xb))/2) - 0.01, wy0 = belt(xb) + 0.1, wy1 = y1 - 0.12, ww = 0.55, rf = [xb - 1, 0, 0];
      for (const [za, zb, ya, yb] of [[-w, w, y0, wy0], [-w, w, wy1, y1], [-w, -ww, wy0, wy1], [ww, w, wy0, wy1]]) quad(I, [xb, ya, za], [xb, ya, zb], [xb, yb, zb], [xb, yb, za], ya < wy0 ? IC : HLc, 0.3, rf);
      for (const [a, b] of [[[xb, wy0, -ww], [xb, wy0, ww]], [[xb, wy1, -ww], [xb, wy1, ww]], [[xb, wy0, -ww], [xb, wy1, -ww]], [[xb, wy0, ww], [xb, wy1, ww]]]) bar(I, a, b, 0.03, 0.03, HLd, 0, 0.3); }
    else { const zr = trimZ(xhr, yhr) - 0.03, n = key === 'coupe' ? 2 : 3, c0 = FP([xhr + 0.13, yhr - 0.03, 0], 0.08, 0);
      if (key === 'coupe') for (const s of [-1, 1]) seat(xhr, yhr, s*0.33, 0.44, SCc, SCd, false);
      else { rbox(I, c0, 0.25, 0.06, zr, 0.05, SCc, 0.3, 3); rbox(I, F0([xhr + 0.12, (yhr - 0.09 + flo(xhr))/2, 0]), 0.22, Math.max(0.03, (yhr - 0.09 - flo(xhr))/2), zr - 0.02, 0.02, BLK, 0.3, 1); }
      const rec = 0.47, Bk = [-Math.sin(rec), Math.cos(rec), 0], Nb = [Math.cos(rec), Math.sin(rec), 0], b0 = [xhr - 0.1, yhr + 0.02, 0], len = key === 'coupe' ? 0.5 : 0.58;
      if (key !== 'coupe'){ rbox(I, F0(A3(b0, K3(Bk, len/2)), Bk, Nb, ZA), len/2, 0.07, zr, 0.05, SCc, 0.3, 3);
        for (const z of [-0.36, 0.36]) rbox(I, F0(A3(A3(b0, K3(Bk, len/2 - 0.02)), [0.04*Nb[0], 0.04*Nb[1], z + 0.24*Math.sign(z)]), Bk, Nb, ZA), len/2 - 0.05, 0.07, 0.04, 0.035, SCd, 0.3, 2); }
      const zs = n === 2 ? [-0.33, 0.33] : [-0.36, 0, 0.36];
      for (const z of zs){ const ht = A3(b0, K3(Bk, len)), hc = A3(A3(ht, K3(Bk, 0.11)), [0, 0, z]); rbox(I, F0(hc, Bk, Nb, ZA), 0.07, 0.05, z === 0 ? 0.09 : 0.12, 0.035, SCc, 0.3, 2);
        for (const s of [-1, 1]) bar(I, A3(ht, [0, -0.02, z + s*0.05]), A3(A3(hc, K3(Bk, -0.05)), [0, 0, s*0.05]), 0.011, 0.011, CHR, 0, 0.9); }
      // the parcel shelf / load cover from the backrest to the rear window
      const xs0 = (b0[0] + Bk[0]*len) - 0.02, xs1 = xR1 + 0.025;
      if (xs0 > xs1 + 0.05){ const R = []; for (let k = 0; k <= 6; k++){ const x = xs0 + (xs1 - xs0)*k/6, y = belt(x) + 0.006, w = glassZ(x, y + 0.01) - 0.004; R.push([[x, y, -w], [x, y, 0], [x, y, w]]); }
        grid(I, R, key === 'suv' ? [0.04, 0.04, 0.045] : CARP, 0.15, (i, j) => [R[i][j][0], R[i][j][1] - 1, R[i][j][2]]);
        if (key !== 'suv') for (const z of [-0.45, 0.45]) disc(I, [(xs0 + xs1)/2, belt((xs0 + xs1)/2) + 0.009, z], XA, ZA, YA, 0.07, 12, BLK, 0.3);
        rbox(I, F0([xs1 + 0.04, belt(xs1 + 0.04) + 0.02, 0]), 0.03, 0.015, 0.12, 0.01, BLK, 0.4); }
      { const xb = Math.max(xs1 + 0.02, Math.min(xs0, xhr - 0.42)), yb = flo(xb), yt = belt(xb), w = shellZ(xb, (yb + yt)/2) - 0.06; quad(I, [xb, yb, -w], [xb, yb, w], [xb, yt, w], [xb, yt, -w], CARP, 0.1, [xb - 1, (yb + yt)/2, 0]); }
      if (key === 'coupe') rbox(I, F0([xhr + 0.05, yhr - 0.02, 0]), 0.3, 0.06, 0.1, 0.04, IC, 0.3, 2);
    }
    // -- the floor (carpet) and the transmission tunnel
    { const xa = xd + 0.42, xb = G.noRear ? xR0 + 0.03 : Math.max(xR1 + 0.06, xhr - 0.45), R = []; for (let k = 0; k <= 8; k++){ const x = xa + (xb - xa)*k/8, y = flo(x), w = shellZ(x, y) - 0.03; R.push([[x, y, -w], [x, y, -0.13], [x, y + 0.006, 0], [x, y, 0.13], [x, y, w]]); }
      grid(I, R, CARP, 0.1, (i, j) => [R[i][j][0], R[i][j][1] - 1, R[i][j][2]]);
      rbox(I, F0([(xa + xb)/2, flo((xa + xb)/2) + 0.05, 0]), (xa - xb)/2, 0.05, 0.12, 0.04, CARP, 0.1, 2); }
    // -- the side trims: door panels below the belt (one continuous trim: no see-through slits), shut lines, armrests, handles
    for (const sd of [-1, 1]){
      const xs = []; for (let x = xFront; x > xEnd; x -= 0.08) xs.push(x); xs.push(xEnd);
      const zt = (x, y) => sd*Math.min(trimZ(x, y), shellZ(x, y) - 0.03), Y = x => [flo(x) + 0.01, yh + 0.06, belt(x) - 0.22, belt(x) - 0.1, belt(x) - 0.035, belt(x) + 0.012];
      const row = (x, j) => { const y = Y(x)[j]; return [x, y, j === 5 ? sd*(glassZ(x, y) - 0.012) : j === 2 ? zt(x, y) - sd*0.004 : zt(x, y)]; };
      const out = (i, j, R) => { const p = R[i][j]; return [p[0], p[1] + 0.02, sd*3]; };
      for (const [j0, j1, col] of [[0, 2, IC], [2, 3, IC2], [3, 5, IC]]){ const R = xs.map(x => { const r = []; for (let j = j0; j <= j1; j++) r.push(row(x, j)); return r; }); grid(I, R, col, 0.3, (i, j) => out(i, j, R)); }
      for (const dx of G.doors.slice(1)) if (dx < xFront && dx > xEnd){ const a = row(dx, 0), b = row(dx, 4); quad(I, A3(a, [0.004, 0, -sd*0.003]), A3(a, [-0.004, 0, -sd*0.003]), A3(b, [-0.004, 0, -sd*0.003]), A3(b, [0.004, 0, -sd*0.003]), BLK, 0.2, [dx, (a[1] + b[1])/2, sd*3]); }
      // armrests, door handles, pulls, speakers, switches, the ambient strip, per door
      const dr = G.doors, nd = dr.length - 1;
      for (let d = 0; d < nd; d++){ const x0 = Math.min(dr[d], xFront) - 0.06, x1 = Math.max(dr[d + 1], xEnd) + 0.06, front = d === 0; if (x0 - x1 < 0.25) continue;
        const ya = (front ? yh : yhr) + 0.2, xm = (x0 + x1)/2, za = sd*(Math.abs(zt(xm, ya)) - 0.05);
        rbox(I, FP([xm - 0.02, ya, za], 0, 0), (x0 - x1)/2 - 0.08, 0.03, 0.05, 0.025, SCL(IC2, 0.9), 0.3, 2);
        rbox(I, F0([xm - 0.02, ya + 0.032, za - sd*0.02]), (x0 - x1)/2 - 0.12, 0.003, 0.003, 0.002, AMB, 9);
        const xhd = x0 - 0.16, yhd = belt(xhd) - 0.13, zhd = sd*(Math.abs(zt(xhd, yhd)) - 0.012);
        rbox(I, F0([xhd, yhd, zhd + sd*0.006]), 0.05, 0.022, 0.006, 0.006, BLK, 0.3); rbox(I, F0([xhd + 0.01, yhd, zhd - sd*0.004]), 0.035, 0.009, 0.007, 0.005, CHR, 0.95);
        rbox(I, F0([xm + 0.12, ya - 0.04, za + sd*0.02]), 0.05, 0.012, 0.025, 0.01, BLK, 0.3);
        if (front){ const ys = flo(x0) + 0.2, zs = sd*(Math.abs(zt(x0 - 0.2, ys)) - 0.004); disc(I, [x0 - 0.2, ys, zs], XA, YA, [0, 0, -sd], 0.075, 14, BLK, 0.3); arc(I, [x0 - 0.2, ys, zs - sd*0.002], XA, YA, [0, 0, -sd], 0.075, 0.085, 0, TAU, 14, MET, 0.7);
          for (let k = 0; k < (sd === Math.sign(ez) ? 4 : 1); k++) rbox(I, F0([xm + 0.13 - k*0.03, ya + 0.034, za - sd*0.012]), 0.011, 0.004, 0.012, 0.003, [0.1, 0.1, 0.11], 0.5); } }
      // the pillars and the trims above the belt where there is no side window (A-pillar base, B, C / D)
      const segs = []; let run = null;
      for (let x = xFront; x >= xEnd - 1e-6; x -= 0.02){ const w = inWin(x, -0.006); if (!w && !run) run = [x, x]; if (!w && run) run[1] = x; if (w && run){ segs.push(run); run = null; } }
      if (run) segs.push(run);
      for (const [xa, xb] of segs){ if (xa - xb < 0.02) continue; const n = Math.max(1, Math.ceil((xa - xb)/0.05)), R = [];
        for (let k = 0; k <= n; k++){ const x = xa + (xb - xa)*k/n, r = ring(x), y0 = r.yb + 0.012, y1 = r.yr - 0.05*r.q, row = [];
          for (let j = 0; j <= 4; j++){ const y = y0 + (y1 - y0)*j/4; row.push([x, y, sd*(glassZ(x, y) - 0.028)]); } R.push(row); }
        grid(I, R, HLc, 0.3, (i, j) => [R[i][j][0], R[i][j][1], sd*3]);
        for (const [x, i] of [[xa, 0], [xb, n]]) if (inWin(x + (i ? -0.03 : 0.03), 0)) for (let j = 0; j < 4; j++){ const p = R[i][j], q = R[i][j + 1], po = [p[0], p[1], sd*(Math.abs(p[2]) + 0.024)], qo = [q[0], q[1], sd*(Math.abs(q[2]) + 0.024)];
          quad(I, p, q, qo, po, HLd, 0.3, [x + (i ? 1 : -1), (p[1] + q[1])/2, 0]); }
        if (G.doors.some(d => d <= xa + 0.05 && d >= xb - 0.05) && xa < xA - 0.2){ const xm = (xa + xb)/2, yb2 = ring(xm).yr - 0.17;     // a seat belt on the B-pillar
          rbox(I, F0([xm, yb2, sd*(glassZ(xm, yb2) - 0.045)]), 0.025, 0.02, 0.012, 0.006, BLK, 0.4);
          quad(I, [xm - 0.022, yb2, sd*(glassZ(xm, yb2) - 0.05)], [xm + 0.022, yb2, sd*(glassZ(xm, yb2) - 0.05)], [xm + 0.03, flo(xm) + 0.35, sd*(trimZ(xm, flo(xm) + 0.35) - 0.03)], [xm - 0.014, flo(xm) + 0.35, sd*(trimZ(xm, flo(xm) + 0.35) - 0.03)], [0.06, 0.06, 0.065], 0.2, [xm, yb2, sd*3]); } }
      // the A-pillar along the windscreen's side edge and the C-pillar edge along the rear window
      const corner = x => { const r = ring(x); return [x, r.yr - 0.045*r.q - 0.012, sd*(r.wr - 0.03)]; };
      { const P = []; for (let k = 0; k <= 9; k++) P.push(corner(xA - 0.02 + (xW + 0.03 - xA + 0.02)*k/9)); tube(I, P, 0.042, 8, 0.7, HLc, 0, 0.3); }
      { const P = []; for (let k = 0; k <= 9; k++) P.push(corner(xR0 - 0.03 + (xR1 + 0.04 - xR0 + 0.03)*k/9)); tube(I, P, 0.038, 8, 0.7, HLc, 0, 0.3); }
      // a grab handle above the passenger doors
      for (let d = 0; d < nd; d++){ if (d === 0 && sd === Math.sign(ez)) continue; const xm = (Math.min(G.doors[d], xFront) + Math.max(G.doors[d + 1], xEnd))/2, r = ring(xm); if (G.glassRoof && d) continue;
        bar(I, [xm + 0.1, r.yr - 0.07, sd*(r.wr - 0.06)], [xm - 0.1, r.yr - 0.07, sd*(r.wr - 0.06)], 0.02, 0.02, HLd, 0, 0.3); }
    }
    // -- the headliner (under a glass roof: the side rails, the front header and a bow at the B-pillars), sun visors, dome lamp, mirror
    { const xa = xW - 0.004, xb = xR0 + 0.006, n = Math.max(2, Math.ceil((xa - xb)/0.1)), H = (x, half) => { const r = ring(x), q = r.q, P = [[r.yr - 0.05*q, r.wr + 0.006*q], [r.yr - 0.04*q, r.wr], [r.yr - 0.008*q, r.wr - 0.03*q], [r.yr, r.wr - 0.055*q], [r.yr + r.cr*0.6, r.wr*0.62], [r.yr + r.cr*0.92, r.wr*0.28], [r.yr + r.cr, 0]];
        const row = P.map(p => [x, p[0] - 0.032, p[1] - 0.03]); return half ? row : row.concat(row.slice(0, -1).reverse().map(p => [p[0], p[1], -p[2]])); };
      const mk = (x0, x1, nn, half, sg) => { const R = []; for (let k = 0; k <= nn; k++) R.push(H(x0 + (x1 - x0)*k/nn, half).map(p => half ? [p[0], p[1], sg*p[2]] : p)); grid(I, R, HLc, 0.25, (i, j) => [R[i][j][0], R[i][j][1] + 1, R[i][j][2]*0.5]); };
      if (G.glassRoof){ for (const sg of [-1, 1]){ const R = []; for (let k = 0; k <= n; k++){ const x = xa + (xb - xa)*k/n; R.push(H(x, true).slice(0, 4).map(p => [p[0], p[1], sg*p[2]])); } grid(I, R, HLc, 0.25, (i, j) => [R[i][j][0], R[i][j][1] + 1, R[i][j][2]*0.5]); }
        mk(xa, xa - 0.13, 2, false); mk(xb + 0.1, xb, 1, false); const xbp = G.doors[1]; mk(xbp + 0.05, xbp - 0.05, 1, false); }
      else mk(xa, xb, n, false);
      // the dome lamp, the sun visors (folded up against the headliner), the interior mirror on its stem
      const x0 = xW - 0.02, r0 = ring(x0 - 0.12), yl = r0.yr + r0.cr - 0.034;
      if (!G.glassRoof) { rbox(I, F0([x0 - 0.2, yl - 0.012, 0]), 0.05, 0.012, 0.11, 0.01, HLd, 0.3); for (const z of [-0.06, 0.06]) rbox(I, F0([x0 - 0.2, yl - 0.024, z]), 0.02, 0.002, 0.03, 0.002, [0.9, 0.86, 0.75], 9); }
      for (const sg of [-1, 1]){ const xc = x0 - 0.13, r = ring(xc), y = r.yr + r.cr*0.6 - 0.05; rbox(I, FP([xc, y, sg*0.34], -0.08, 0), 0.115, 0.012, 0.17, 0.01, HLd, 0.25, 2);
        rbox(I, F0([xc + 0.1, y + 0.012, sg*0.07]), 0.012, 0.012, 0.015, 0.006, HLd, 0.3); }
      // the interior mirror ~0.5 m ahead of the eye, a little above it (on the glass when the header is close over the driver)
      const mx = Math.max(x0 - 0.09, ex + 0.5), mTop = Math.min(yl + 0.005, GH(mx + 0.03)[1] - 0.02), mc = [mx, Math.max(ey + 0.04, Math.min(yl - 0.1, ey + 0.14, mTop - 0.07)), 0];
      const md = N3([ex - mc[0], (ey - mc[1])*0.6, ez - mc[2]]), mz = N3(X3(YA, md)), my = X3(md, mz);
      bar(I, [mx + 0.025, mTop, 0], A3(mc, K3(md, -0.02)), 0.018, 0.018, BLK, 0, 0.4);
      if (mx > x0 - 0.06) rbox(I, F0([mx + 0.035, mTop + 0.012, 0], N3([GH(mx + 0.1)[1] - GH(mx - 0.1)[1], -0.2, 0]).map(v => -v), YA, ZA), 0.03, 0.008, 0.035, 0.005, BLK, 0.3);   // the glass mount
      rbox(I, F0(mc, md, my, mz), 0.018, 0.036, 0.125, 0.015, BLK, 0.45, 2);
      mir.push({c:A3(mc, K3(md, 0.0185)), U:mz, V:my, N:md, hu:0.115, hv:0.028, u0:0.36, u1:0.64, v0:0.49, v1:0.66}); }
    // a vehicle drawn by the traffic module (the pickup): its own bonnet, wings and mirror housings in the cabin view
    if (G.own){ const O = G.own, xf = O.xf, R = [];
      for (let k = 0; k <= 6; k++){ const x = xA + 0.01 + (xf - xA - 0.01)*k/6, y = O.hood(x), row = []; for (let j = 0; j <= 6; j++){ const z = -O.hw + 2*O.hw*j/6; row.push([x, y - 0.03*Math.pow(Math.abs(z)/O.hw, 4), z]); } R.push(row); }
      grid(I, R, [1, 1, 1], 0.95, (i, j) => [R[i][j][0], R[i][j][1] - 1, R[i][j][2]], 1);
      prism(I, [[xA + 0.02, belt(xA) + 0.01], [xA + 0.12, belt(xA) + 0.035], [xA + 0.12, belt(xA) - 0.05], [xA + 0.02, belt(xA) - 0.05]], -O.hw + 0.05, O.hw - 0.05, BLK, 0.3);
      for (const sd of [-1, 1]){ const x = G.mirror, y = belt(x) + 0.08, z0 = O.hw + 0.02, z1 = O.hw + 0.24;
        bar(I, [x + 0.02, y - 0.06, sd*(O.hw - 0.04)], [x - 0.02, y + 0.02, sd*(z0 + 0.03)], 0.04, 0.03, BLK, 0, 0.5);
        rbox(I, F0([x - 0.03, y + 0.11, sd*(z0 + z1)/2]), 0.05, 0.13, (z1 - z0)/2, 0.03, BLK, 0.5, 2);
        mir.push({c:[x - 0.0815, y + 0.11, sd*(z0 + z1)/2], U:[0, 0, 1], V:[0, 1, 0], N:[-1, 0, 0], hu:(z1 - z0)/2 - 0.02, hv:0.11, u0:sd < 0 ? 0.72 : 0.0, u1:sd < 0 ? 1.0 : 0.28, v0:0.25, v1:0.75}); } }
    // the side mirrors' glass (on the body: RCGEO's housings) for the live mirrors
    if (!G.own) for (const sd of [-1, 1]){ const x = G.mirror, k = LB(x), y = k[3] + 0.01, za = k[1] + 0.045, zb = k[1] + 0.17 - 0.012, xg = x - 0.105 - 0.0016;
      mir.push({c:[xg, y + 0.0575, sd*(za + zb)/2], U:[0, 0, 1], V:[0, 1, 0], N:[-1, 0, 0], hu:(zb - za)/2 - 0.002, hv:0.045, u0:sd < 0 ? 0.70 : 0.0, u1:sd < 0 ? 1.0 : 0.30, v0:0.28, v1:0.72}); }
    // the wiper arms resting at the base of the windscreen (outside)
    for (const z0 of [-0.42, 0.18]){ const p = [xA + 0.05, belt(xA) + 0.025, z0], q = [xA - 0.01, belt(xA) + 0.05, z0 + 0.62]; bar(I, p, q, 0.016, 0.012, BLK, 0, 0.4); bar(I, A3(p, [-0.01, 0.012, 0.05]), A3(q, [-0.006, 0.006, -0.02]), 0.01, 0.008, RUB, 0, 0.3); }
    const R0 = key === 'coupe' ? 0.178 : 0.185, hd = hands(R0, 0.019);
    return {int:I, steer:wheel(R0, 0.019, [0.028, 0.055, 0.068]), hands:hd.H, wrist:hd.wrist, sw, tilt, R0, mir, gauges, shoulder:[[ex - 0.06, ey - 0.23, ez - 0.19], [ex - 0.06, ey - 0.23, ez + 0.19]], cab:[xd - 0.05, yT - 0.05, 0], rearCam:[G.xr - 0.25, Math.max(GH(xR1)[1], belt(xR1)) + 0.35, 0], own:!!G.own};
  }
  // the pickup's extended cab, from the traffic module's model numbers (model x + 0.1 = car x): 5.6 x 2.02 m, belt 1.12, roof 1.91,
  // windscreen 1.75 -> 0.95, the cab's back -0.25 / -0.35; no rear seats
  function pickup(){
    const roof = x => x >= 1.75 ? 1.12 : x > 0.95 ? 1.13 + (1.91 - 1.13)*(1.75 - x)/0.8 : x > -0.25 ? 1.91 : x > -0.35 ? 1.91 - (1.91 - 1.14)*(-0.25 - x)/0.1 : 1.14;
    const LB = x => [x, 1.0, 0.44, x > 1.75 ? 1.12 - (x - 1.75)*0.05 : 1.12, 0], GH = x => [x, roof(x), 0.86, 0.025];
    const G = {eye:[0.32, 1.6, -0.38], ws:[1.75, 0.95], rw:[-0.25, -0.33], win:[[1.68, -0.1]], doors:[1.62, -0.33], mirror:1.62, glassRoof:false, xr:-2.7, noRear:true,
      intCol:[0.08, 0.08, 0.085], seatCol:[0.2, 0.19, 0.18], own:{xf:2.86, hw:0.98, hood:x => 1.12 - (x - 1.75)*0.06}};
    return car('pickup', {LB, GH}, G);
  }
  // the motorbike seen by its rider (the traffic module's model outside, the paint slot): the tank and the cowl in the paint, a small
  // tinted screen, a clock pod with two dials, mirrors on stalks (live), the rider's knees; the bars turn with the steering about the
  // steering head (tilt = its angle: local X runs down the head toward the front axle, the bars lie in its YZ plane), gloved hands on
  // the grips, sleeves to the shoulders of a rider leaning in
  function moto(){
    const I = GB(), mir = [], gauges = [], PAINT = [0.8, 0.8, 0.8], TRS = [0.09, 0.1, 0.12];
    rbox(I, FP([0.15, 0.9, 0], 0.14, 0), 0.31, 0.075, 0.155, 0.065, PAINT, 0.9, 3, 1);                       // the tank
    rbox(I, FP([0.17, 0.968, 0], 0.14, 0), 0.06, 0.006, 0.045, 0.005, CHR, 0.9, 2);                        // its cap (plain)
    rbox(I, FP([0.1, 0.85, 0], 0.14, 0), 0.34, 0.03, 0.172, 0.02, BLK, 0.3);                                // the frame rails under it
    rbox(I, F0([-0.45, 0.84, 0]), 0.27, 0.05, 0.15, 0.045, BLK, 0.2, 3);                                    // the seat
    rbox(I, FP([0.63, 1.0, 0], 0.55, 0), 0.13, 0.1, 0.19, 0.07, PAINT, 0.9, 3, 1);                         // the headlamp cowl
    { const c = [0.71, 1.18, 0], V = N3([0.45, 1, 0]), N = N3(X3(ZA, V));                                    // the screen (smoked)
      panel(I, c, ZA, V, N, 0.15, 0.075, [0.035, 0.04, 0.045], 0.7); panel(I, c, ZA, V, K3(N, -1), 0.15, 0.075, [0.035, 0.04, 0.045], 0.7);   // smoked
      rbox(I, F0(A3(c, K3(V, -0.075)), N, V, ZA), 0.006, 0.01, 0.16, 0.005, BLK, 0.3); }
    { const V = N3([0.75, 0.66, 0]), N = N3(X3(ZA, V)), c = [0.57, 1.13, 0];                                 // the clock pod, facing the rider
      rbox(I, F0(A3(c, K3(N, -0.014)), N, V, ZA), 0.014, 0.058, 0.115, 0.01, BLK, 0.4); dials(I, A3(c, K3(N, 0.0005)), ZA, V, N, 0.1, 0.046, gauges); }
    for (const sd of [-1, 1]){                                                                              // the mirrors (glass facing back)
      bar(I, [0.62, 1.1, sd*0.17], [0.58, 1.24, sd*0.29], 0.014, 0.014, BLK, 0, 0.5);
      rbox(I, F0([0.585, 1.26, sd*0.335]), 0.022, 0.042, 0.068, 0.018, BLK, 0.5, 2);
      mir.push({c:[0.5612, 1.26, sd*0.335], U:[0, 0, 1], V:[0, 1, 0], N:[-1, 0, 0], hu:0.058, hv:0.034, u0:sd < 0 ? 0.68 : 0.0, u1:sd < 0 ? 1.0 : 0.32, v0:0.3, v1:0.7});
      bar(I, [0.5, 1.0, sd*0.09], [0.68, 0.62, sd*0.1], 0.04, 0.04, CHR, 0, 0.9);                             // the fork legs
      rbox(I, FP([-0.02, 0.86, sd*0.205], -0.3, 0), 0.24, 0.065, 0.065, 0.055, TRS, 0.2, 3); }              // the rider's knees
    // the bars (steer frame: X down the steering head, Y forward-up across it, Z right)
    const S = GB(), R0 = 0.31, path = [];
    for (let k = -6; k <= 6; k++){ const z = k/6*0.37, w = Math.max(0, Math.abs(z) - 0.12)/0.25; path.push([-0.03*w*w, -0.06*w*w, z]); }
    tube(S, path, 0.011, 8, 1.0, CHR, 0, 0.8);
    rbox(S, F0([0.012, 0.005, 0]), 0.022, 0.05, 0.11, 0.012, BLK, 0.5, 2);                                  // the top clamp
    for (const sd of [-1, 1]){ const g0 = [-0.012, -0.024, sd*0.26], g1 = [-0.03, -0.06, sd*0.37];
      tube(S, [g0, g1], 0.017, 10, 1.0, RUB, 0, 0.2);                                                         // the grips
      taper(S, g1, A3(g1, [-0.002, -0.004, sd*0.02]), 0.016, 0.016, 8, CHR, 0.9);                           // the bar ends
      bar(S, [-0.002, 0.03, sd*0.17], [-0.02, 0.035, sd*0.34], 0.012, 0.006, MET, 0, 0.7);                   // the levers
      rbox(S, F0([-0.004, 0.0, sd*0.19]), 0.02, 0.022, 0.026, 0.01, BLK, 0.4, 2); }                          // the switch gear
    const Hd = GB(), wrist = [];
    for (const sd of [-1, 1]){ const g = [-0.02, -0.042, sd*0.315];
      rbox(Hd, F0(A3(g, [-0.004, 0.008, 0])), 0.032, 0.036, 0.046, 0.024, GLOVE, 0.25, 2);                    // the fist round the grip
      rbox(Hd, F0(A3(g, [-0.03, -0.012, -sd*0.032])), 0.012, 0.012, 0.02, 0.01, GLOVE, 0.25, 2);              // the thumb
      wrist.push(A3(g, [-0.03, -0.05, -sd*0.03])); }
    return {int:I, steer:S, hands:Hd, wrist, sw:[0.5, 1.03, 0], tilt:-1.12, R0, mir, gauges, bars:true, open:true,
      shoulder:[[-0.05, 1.2, -0.21], [-0.05, 1.2, 0.21]], cab:[0.45, 1.15, 0], rearCam:[-1.3, 1.5, 0]};
  }
  // the city bus from the driver's seat (the traffic module's model outside, drawn around it here: car x = model x + 0.5): the
  // windscreen frame and the destination box over it, the dashboard with the clocks, a big flat wheel, the fare box, the front door
  // (kerb side, +z), the saloon (window pillars, seats, grab rails, the ceiling with its light strips, the back wall), outside mirrors
  function bus(){
    const I = GB(), mir = [], gauges = [], e = [5.1, 2.25, -0.75], ex = e[0], ey = e[1], ez = e[2];
    const XF = 6.52, XB = -5.52, W = 1.2, FL = 0.42, WIN0 = 1.05, WIN1 = 2.45, CEIL = 3.05, WALL = [0.62, 0.64, 0.66], CEILc = [0.8, 0.8, 0.78], SEAT = [0.12, 0.2, 0.34], STEEL = [0.7, 0.72, 0.74];
    // the floor (the driver's platform raised), the ceiling with two light strips, the side walls under / over the windows
    rbox(I, F0([(XF + XB)/2, FL - 0.02, 0]), (XF - XB)/2, 0.02, W, 0.01, [0.16, 0.17, 0.18], 0.2);
    rbox(I, F0([ex - 0.1, FL + 0.18, ez]), 0.75, 0.18, 0.45, 0.03, [0.2, 0.21, 0.22], 0.2);
    rbox(I, F0([(XF + XB)/2, CEIL + 0.02, 0]), (XF - XB)/2, 0.02, W, 0.01, CEILc, 0.2);
    for (const z of [-0.62, 0.62]) rbox(I, F0([(XF - 0.3 + XB)/2, CEIL - 0.01, z]), (XF - 0.3 - XB)/2, 0.012, 0.05, 0.01, [0.95, 0.94, 0.88], 9);
    for (const sd of [-1, 1]){ const z = sd*W;
      rbox(I, F0([(XF + XB)/2, (FL + WIN0)/2, z]), (XF - XB)/2, (WIN0 - FL)/2, 0.03, 0.01, WALL, 0.25);
      rbox(I, F0([(XF + XB)/2, (WIN1 + CEIL)/2, z]), (XF - XB)/2, (CEIL - WIN1)/2, 0.03, 0.01, WALL, 0.25);
      for (let x = XB + 0.1; x < XF - 0.4; x += 1.55){ if (sd > 0 && x > 4.8 && x < 6.3) continue; rbox(I, F0([x, (WIN0 + WIN1)/2, z]), 0.05, (WIN1 - WIN0)/2, 0.04, 0.02, WALL, 0.3); }
      bar(I, [XB + 0.3, WIN1 + 0.12, z - sd*0.12], [XF - 1.4, WIN1 + 0.12, z - sd*0.12], 0.028, 0.028, STEEL, 0, 0.85); }    // grab rails
    // the back wall with its window, the seats (two by two, facing forward) behind the driver's partition
    rbox(I, F0([XB, (FL + WIN0)/2, 0]), 0.03, (WIN0 - FL)/2 + 0.02, W, 0.01, WALL, 0.25); rbox(I, F0([XB, (WIN1 + CEIL)/2 + 0.1, 0]), 0.03, (CEIL - WIN1)/2 - 0.1, W, 0.01, WALL, 0.25);
    for (const z of [-W + 0.08, W - 0.08]) rbox(I, F0([XB, (WIN0 + WIN1)/2, z]), 0.03, (WIN1 - WIN0)/2, 0.08, 0.01, WALL, 0.25);
    for (let x = 3.3; x > XB + 0.6; x -= 0.82) for (const sd of [-1, 1]){ if (sd > 0 && x > 0.4 && x < 1.6) continue;
      const zc = sd*0.75; rbox(I, F0([x, FL + 0.42, zc]), 0.22, 0.05, 0.42, 0.03, SEAT, 0.2); rbox(I, FP([x - 0.22, FL + 0.75, zc], 1.45, 0), 0.32, 0.04, 0.42, 0.03, SEAT, 0.2);
      bar(I, [x, FL + 0.38, zc], [x, FL + 0.05, zc], 0.04, 0.04, STEEL, 0, 0.6); }
    rbox(I, F0([ex - 0.62, (FL + 1.72)/2, ez]), 0.03, (1.72 - FL)/2, 0.48, 0.02, [0.24, 0.25, 0.27], 0.3);                       // the driver's partition
    for (const z of [-0.1, 0.1]) bar(I, [ex - 0.7, FL, z], [ex - 0.7, CEIL, z], 0.035, 0.035, STEEL, 0, 0.85);               // poles
    // the front: the windscreen frame (two panes), the destination box, the dashboard
    for (const z of [-W, 0, W]) bar(I, [XF, 0.95, z*0.985], [XF - 0.04, CEIL, z*0.985], z ? 0.09 : 0.05, 0.07, [0.1, 0.1, 0.11], 0, 0.4);
    rbox(I, F0([XF - 0.15, 2.82, 0]), 0.15, 0.24, W, 0.02, [0.13, 0.14, 0.15], 0.3);
    rbox(I, F0([XF - 0.02, 0.68, 0]), 0.03, 0.26, W, 0.01, [0.13, 0.14, 0.15], 0.3);
    const yT = 1.72; prism(I, [[XF - 0.04, 0.95], [XF - 0.04, yT - 0.05], [XF - 0.2, yT], [ex + 0.62, yT + 0.02], [ex + 0.55, yT - 0.08], [ex + 0.6, 1.2], [ex + 0.75, FL + 0.3], [XF - 0.04, FL + 0.3]], -W + 0.05, 0.35, [0.14, 0.15, 0.16], 0.3);
    { const V = N3([0.35, 1, 0]), N = N3(X3(ZA, V)), c = [ex + 0.6, yT + 0.035, ez];
      rbox(I, F0(A3(c, K3(N, -0.01)), N, V, ZA), 0.01, 0.075, 0.2, 0.008, BLK, 0.4); dials(I, A3(c, K3(N, 0.0005)), ZA, V, N, 0.19, 0.065, gauges); }
    for (let k = 0; k < 6; k++) rbox(I, F0([ex + 0.66, yT + 0.03, 0.05 + k*0.05]), 0.02, 0.006, 0.018, 0.004, [[0.3, 0.6, 0.95], [0.4, 0.8, 0.5], [0.95, 0.65, 0.3], [0.75, 0.75, 0.8], [0.85, 0.4, 0.5], [0.3, 0.6, 0.95]][k], 8);
    rbox(I, F0([5.55, 0.95, 0.3]), 0.14, 0.22, 0.13, 0.03, [0.25, 0.27, 0.3], 0.5);                                           // the fare box (plain)
    rbox(I, F0([5.55, 1.2, 0.3]), 0.1, 0.03, 0.09, 0.02, [0.05, 0.08, 0.1], 8);
    // the front door (two glass leaves in frames, kerb side)
    for (const x of [5.2, 5.85]) for (const y of [FL + 0.05, WIN1 + 0.05, (FL + WIN1)/2]) bar(I, [x - 0.3, y, W - 0.02], [x + 0.3, y, W - 0.02], 0.05, 0.04, [0.15, 0.16, 0.17], 0, 0.4);
    for (const x of [4.9, 5.5, 5.55, 6.15]) bar(I, [x, FL, W - 0.02], [x, WIN1 + 0.08, W - 0.02], 0.05, 0.04, [0.15, 0.16, 0.17], 0, 0.4);
    // the outside mirrors on their arms (glass facing back)
    for (const sd of [-1, 1]){ const z = sd*(W + 0.36); bar(I, [XF - 0.05, 2.75, sd*(W + 0.05)], [XF + 0.18, 2.6, z], 0.05, 0.04, BLK, 0, 0.4);
      rbox(I, F0([XF + 0.2, 2.25, z]), 0.05, 0.3, 0.12, 0.04, BLK, 0.4, 2);
      mir.push({c:[XF + 0.1484, 2.25, z], U:[0, 0, 1], V:[0, 1, 0], N:[-1, 0, 0], hu:0.1, hv:0.27, u0:sd < 0 ? 0.74 : 0.0, u1:sd < 0 ? 1.0 : 0.26, v0:0.2, v1:0.8}); }
    // the wheel: big, nearly flat; the column
    const tilt = -1.12, sw = [ex + 0.42, ey - 0.66, ez], CA = [Math.cos(tilt), Math.sin(tilt), 0];   // the rim faces up and back; the column runs down into the dash
    bar(I, A3(sw, K3(CA, 0.06)), A3(sw, K3(CA, 0.55)), 0.09, 0.09, BLK, 0, 0.35);
    const R0 = 0.235, hd = hands(R0, 0.02);
    return {int:I, steer:wheel(R0, 0.02, [0.03, 0.06, 0.07]), hands:hd.H, wrist:hd.wrist, sw, tilt, R0, mir, gauges, shoulder:[[ex - 0.08, ey - 0.25, ez - 0.2], [ex - 0.08, ey - 0.25, ez + 0.2]],
      cab:[ex + 0.6, yT, ez], rearCam:[XB - 0.2, 3.5, 0]};
  }
  return {car, pickup, moto, bus, wheel, hands, sleeve, needle, H:{quad, panel, grid, prism, rbox, taper, arc, disc, vent, dials, mapScreen, F0, FP, at, A3, S3, K3, N3, X3, D3, MIX, SCL}};
})();
//</RCINT>


/* ================= the world the car drives in ================= */
// ---- the circuit (from net.f1: closed polyline P[0..n], heights y, cumulative length cum, total L)
let TR = null;
const AI_MU = 1.78;
// [lm27/nyrace] the race runs on whichever circuit net.f1 holds (lm20/f1track: Marina Bay; nyc/nyrace: the Brooklyn Street Circuit):
// its name (net.f1.name [zh, en]: HUD, flash, tray card), default race length (net.f1.laps until the player picks one) and the AI's
// overtaking-straight speed (net.f1.aiStraight, m/s) come with it; without them the Marina Bay values apply
const trName = () => { const F = typeof net !== 'undefined' && net && net.f1; return F && F.name ? F.name : ['滨海湾街道赛道', 'Marina Bay Street Circuit']; };
function trackInit(){
  const F = net && net.f1; if (!F || !F.P || F.n < 20){ TR = null; return null; }
  if (TR && TR.F === F) return TR;
  const n = F.n, L = F.L, X = new Float64Array(n + 1), Y = new Float64Array(n + 1);
  for (let i = 0; i <= n; i++){ X[i] = F.P[i][0]; Y[i] = F.P[i][1]; }
  const DX = new Float32Array(n), DY = new Float32Array(n);
  for (let i = 0; i < n; i++){ const dx = X[i + 1] - X[i], dy = Y[i + 1] - Y[i], l = Math.hypot(dx, dy) || 1; DX[i] = dx/l; DY[i] = dy/l; }
  const wrap = i => ((i % n) + n) % n;
  const NX = new Float32Array(n), NY = new Float32Array(n);   // vertex normals (left)
  for (let i = 0; i < n; i++){ const a = wrap(i - 1); let dx = DX[a] + DX[i], dy = DY[a] + DY[i]; const l = Math.hypot(dx, dy) || 1; NX[i] = -dy/l; NY[i] = dx/l; }
  const deck = new Uint8Array(n + 1); for (let i = 0; i <= n; i++) deck[i] = Math.abs(F.y[i] - (hC(X[i], Y[i]) + 0.95)) > 0.05 ? 1 : 0;
  // start line (as in sgF1: the vertex nearest the first raw point) and the pit straight (same rule as sgF1)
  let startI = 0; { const s0 = SGD && SGD.f1 && SGD.f1.length ? SGD.f1[0] : [X[0], Y[0]]; let bd = Infinity; for (let i = 0; i < n; i++){ const d = Math.hypot(X[i] - s0[0], Y[i] - s0[1]); if (d < bd){ bd = d; startI = i; } } }
  if (F.startI !== undefined) startI = F.startI;
  const at = i => [X[wrap(i)], Y[wrap(i)]], head = i => { const a = at(i), b = at(i + 1); return Math.atan2(b[1] - a[1], b[0] - a[0]); };
  const turn = new Float32Array(n); for (let i = 0; i < n; i++) turn[i] = wrapA(head(i + 2) - head(i - 2));
  let sA = startI, sB = startI; while (Math.abs(turn[wrap(sA - 1)]) < 0.035 && (startI - sA) < 160) sA--; while (Math.abs(turn[wrap(sB + 1)]) < 0.035 && (sB - startI) < 160) sB++;
  const dirAt = i => { const a = at(i - 1), b = at(i + 1), l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [(b[0] - a[0])/l, (b[1] - a[1])/l]; };
  const flyer = sgXY(1.2894, 103.86323), d0 = dirAt(startI), v0 = [-d0[1], d0[0]], ps = at(startI);
  const side = Math.hypot(ps[0] + v0[0]*40 - flyer[0], ps[1] + v0[1]*40 - flyer[1]) > Math.hypot(ps[0] - v0[0]*40 - flyer[0], ps[1] - v0[1]*40 - flyer[1]) ? 1 : -1;
  const pit = new Uint8Array(n); for (let i = sA; i <= sB; i++) pit[wrap(i)] = 1;
  // racing line: shortest path inside +-LIM (relaxation), then a minimum-curvature pass (biharmonic smoothing of the line, clamped)
  const off = new Float32Array(n), LIM = 6.0, LL = new Float32Array(n), LR = new Float32Array(n);
  for (let i = 0; i < n; i++){ LL[i] = F.hl ? clamp(F.hl[i] - 1.15, 0.3, LIM) : LIM; LR[i] = F.hr ? clamp(F.hr[i] - 1.15, 0.3, LIM) : LIM; }
  for (let it = 0; it < 300; it++) for (let i = 0; i < n; i++){ const a = wrap(i - 1), b = wrap(i + 1);
    const mx = (X[a] + NX[a]*off[a] + X[b] + NX[b]*off[b])/2 - X[i], my = (Y[a] + NY[a]*off[a] + Y[b] + NY[b]*off[b])/2 - Y[i];
    off[i] += (clamp(mx*NX[i] + my*NY[i], -LR[i], LL[i]) - off[i])*0.6; }
  { const qx = new Float64Array(n), qy = new Float64Array(n);
    for (let it = 0; it < 2600; it++){
      const h = it < 1000 ? 4 : it < 1900 ? 2 : 1;
      for (let i = 0; i < n; i++){ qx[i] = X[i] + NX[i]*off[i]; qy[i] = Y[i] + NY[i]*off[i]; }
      for (let i = 0; i < n; i++){ let a = i - 2*h, b = i - h, c = i + h, d = i + 2*h; if (a < 0) a += n; if (b < 0) b += n; if (c >= n) c -= n; if (d >= n) d -= n;
        const gx = qx[a] - 4*qx[b] + 6*qx[i] - 4*qx[c] + qx[d], gy = qy[a] - 4*qy[b] + 6*qy[i] - 4*qy[c] + qy[d];
        let o = off[i] - 0.06*(gx*NX[i] + gy*NY[i]); off[i] = o < -LR[i] ? -LR[i] : o > LL[i] ? LL[i] : o; } } }
  // curvature of the line and the speed the AI can carry (downforce grows with speed), braking and traction limits
  const QX = new Float64Array(n), QY = new Float64Array(n); for (let i = 0; i < n; i++){ QX[i] = X[i] + NX[i]*off[i]; QY[i] = Y[i] + NY[i]*off[i]; }
  const kap = new Float32Array(n);
  for (let i = 0; i < n; i++){ const a = wrap(i - 2), c = wrap(i + 2); const ax = QX[a], ay = QY[a], bx = QX[i], by = QY[i], cx = QX[c], cy = QY[c];
    const cr = Math.abs((bx - ax)*(cy - ay) - (by - ay)*(cx - ax)), d = Math.hypot(bx - ax, by - ay)*Math.hypot(cx - bx, cy - by)*Math.hypot(cx - ax, cy - ay); kap[i] = d > 1e-6 ? 2*cr/d : 0; }
  const kap2 = kap.slice(); for (let i = 0; i < n; i++) kap[i] = Math.max(kap2[wrap(i - 1)]*0.7, kap2[i], kap2[wrap(i + 1)]*0.7);
  const VT = 89, vmax = new Float32Array(n), kk = AI_MU*PH.kDF/PH.m;
  for (let i = 0; i < n; i++) vmax[i] = kap[i] > kk + 1e-5 ? Math.min(VT, Math.sqrt(AI_MU*PH.g/(kap[i] - kk))) : VT;
  const ds = i => F.cum[i + 1] - F.cum[i];
  for (let pass = 0; pass < 2; pass++){
    for (let k = 2*n - 1; k >= 0; k--){ const i = wrap(k), j = wrap(k + 1); vmax[i] = Math.min(vmax[i], Math.sqrt(vmax[j]*vmax[j] + 2*40*ds(i))); }
    for (let k = 0; k < 2*n; k++){ const i = wrap(k), j = wrap(k + 1), v = vmax[i], acc = Math.min(10.5, Math.max(0.5, (PH.P/Math.max(v, 6) - 0.5*PH.rho*PH.CdA*v*v)/PH.m)); vmax[j] = Math.min(vmax[j], Math.sqrt(v*v + 2*acc*ds(i))); }
  }
  const straight = new Uint8Array(n); for (let i = 0; i < n; i++){ let m = 1e9; for (let k = 0; k < 30; k++) m = Math.min(m, vmax[wrap(i + k)]); straight[i] = m > (F.aiStraight || 62) ? 1 : 0; }
  // projection grid (40 m cells, segments padded by 16 m)
  const GC = 40, grid = new Map(); let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
  for (let i = 0; i < n; i++){ const x0 = Math.min(X[i], X[i + 1]) - 16, x1 = Math.max(X[i], X[i + 1]) + 16, y0 = Math.min(Y[i], Y[i + 1]) - 16, y1 = Math.max(Y[i], Y[i + 1]) + 16;
    bx0 = Math.min(bx0, x0); by0 = Math.min(by0, y0); bx1 = Math.max(bx1, x1); by1 = Math.max(by1, y1);
    for (let gy = Math.floor(y0/GC); gy <= Math.floor(y1/GC); gy++) for (let gx = Math.floor(x0/GC); gx <= Math.floor(x1/GC); gx++){ const k = gy*100003 + gx; let l = grid.get(k); if (!l) grid.set(k, l = []); l.push(i); } }
  const sStart = F.cum[startI];
  TR = {F, n, L, X, Y, DX, DY, NX, NY, deck, startI, sStart, side, pit, sA, sB, off, vmax, straight, kap, grid, GC, bb:[bx0, by0, bx1, by1], cx:(bx0 + bx1)/2, cy:(by0 + by1)/2, wrap,
    LL, LR, wl:F.wl || null, wr:F.wr || null, hl:F.hl || null, hr:F.hr || null};
  // the static minimap path is rebuilt for the new circuit
  MAP.trk = null;
  return TR;
}
// nearest point of the circuit centreline: {i, t, s, d (left +), dist}
const TPJ = {i:0, t:0, s:0, d:0, dist:1e9};
function trProj(x, y, out){
  out = out || TPJ; out.dist = 1e9; if (!TR) return null;
  const l = TR.grid.get(Math.floor(y/TR.GC)*100003 + Math.floor(x/TR.GC)); if (!l) return null;
  let best = 1e18, bi = -1, bt = 0;
  for (let q = 0; q < l.length; q++){ const i = l[q], ax = TR.X[i], ay = TR.Y[i], dx = TR.X[i + 1] - ax, dy = TR.Y[i + 1] - ay, l2 = dx*dx + dy*dy || 1;
    const t = clamp(((x - ax)*dx + (y - ay)*dy)/l2, 0, 1), px = ax + dx*t - x, py = ay + dy*t - y, d2 = px*px + py*py; if (d2 < best){ best = d2; bi = i; bt = t; } }
  const i = bi, ax = TR.X[i], ay = TR.Y[i], cum = TR.F.cum;
  out.i = i; out.t = bt; out.s = cum[i] + (cum[i + 1] - cum[i])*bt; out.dist = Math.sqrt(best);
  out.d = (x - (ax + (TR.X[i + 1] - ax)*bt))*(-TR.DY[i]) + (y - (ay + (TR.Y[i + 1] - ay)*bt))*TR.DX[i];
  return out;
}
// height of the circuit surface (bridges: the deck profile; elsewhere draped 0.9 m above the ground like the track mesh)
function trSurf(i, t, x, y){ const F = TR.F, j = i + 1; if (TR.deck[i] || TR.deck[j]) return F.y[i] + (F.y[j] - F.y[i])*t - 0.07; return hC(x, y) + 0.9; }
// point on the circuit at arc length s with lateral offset d: [x, y, i, t, dirx, diry]
function trAt(s, d, out){
  const L = TR.L, cum = TR.F.cum; s = ((s % L) + L) % L; let lo = 0, hi = TR.n;
  while (hi - lo > 1){ const m = (lo + hi) >> 1; if (cum[m] <= s) lo = m; else hi = m; }
  const i = lo, t = clamp((s - cum[i])/Math.max(1e-6, cum[i + 1] - cum[i]), 0, 1), j = (i + 1) % TR.n;
  let nx = TR.NX[i] + (TR.NX[j] - TR.NX[i])*t, ny = TR.NY[i] + (TR.NY[j] - TR.NY[i])*t; const nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl;
  out[0] = TR.X[i] + (TR.X[i + 1] - TR.X[i])*t + nx*d; out[1] = TR.Y[i] + (TR.Y[i + 1] - TR.Y[i])*t + ny*d; out[2] = i; out[3] = t; out[4] = ny; out[5] = -nx;
  return out;
}

// ---- drivable roads: SGR.lines classes 0-11 (roads, service), 13-14 (runways, taxiways), 18 (raceway); 500 m blocks, 25 m cells
const RD_OFF = [.18, .18, .18, .18, .18, .18, .18, .18, .18, .18, .14, .10, .06, .24, .13, .15, .18, .10, .18];
const RD_WID = [[26, 13], [6.5, 6.5], [20, 11], [6.5, 6.5], [15, 10], [6, 6], [12, 8], [5.5, 5.5], [9.5, 7], [5, 5], [7, 5.5], [4.5, 4], [2.5, 2.5], [60, 60], [23, 23], [4, 4], [3, 3], [4, 4], [12, 12]];
const RD_ZH = ['高速公路', '高速匝道', '快速路', '快速路匝道', '主干道', '主干道匝道', '次干道', '次干道匝道', '支路', '支路匝道', '街道', '小路', '步道', '跑道', '滑行道', '铁路', '单轨', '栈桥', '赛道'];
const RD_EN = ['Expressway', 'Slip road', 'Major road', 'Slip road', 'Arterial', 'Slip road', 'Collector', 'Slip road', 'Local road', 'Slip road', 'Street', 'Service road', 'Path', 'Runway', 'Taxiway', 'Rail', 'Monorail', 'Pier', 'Raceway'];
const drivable = c => c <= 11 || c === 13 || c === 14 || c === 18;
const RI = {G:500, CS:25, NB:0, coarse:null, blocks:new Map(), lines:null};
function riCoarse(){
  if (RI.coarse && RI.lines === SGR.lines) return;
  const t0 = performance.now(), G = RI.G, NB = RI.NB = Math.ceil(2*HALF/G), map = new Map(), Ls = SGR.lines;
  for (let li = 0; li < Ls.length; li++){
    const l = Ls[li]; if (!drivable(l.c)) continue;
    const P = l.P, pad = RD_WID[l.c][(l.flags & 1) ? 1 : 0]/2 + 2; let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (let k = 0; k < P.length; k += 2){ const x = P[k], y = P[k + 1]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    const a = Math.max(0, Math.floor((x0 - pad + HALF)/G)), b = Math.min(NB - 1, Math.floor((x1 + pad + HALF)/G)), c = Math.max(0, Math.floor((y0 - pad + HALF)/G)), d = Math.min(NB - 1, Math.floor((y1 + pad + HALF)/G));
    for (let by = c; by <= d; by++) for (let bx = a; bx <= b; bx++){ const k = by*NB + bx; let L = map.get(k); if (!L) map.set(k, L = []); L.push(li); }
  }
  RI.coarse = map; RI.lines = SGR.lines; RI.blocks.clear(); RI.ms = performance.now() - t0;
}
function riBlock(bx, by){
  const key = by*RI.NB + bx; let B = RI.blocks.get(key); if (B) return B;
  const G = RI.G, CS = RI.CS, NC = G/CS, x0 = -HALF + bx*G, y0 = -HALF + by*G, list = RI.coarse.get(key) || [], Ls = SGR.lines;
  const cnt = new Int32Array(NC*NC + 1), segs = [];
  const skipL = typeof sgrSkipLine === 'function' ? sgrSkipLine : null;
  for (const li of list){
    const l = Ls[li]; if (skipL && l.c >= 10 && skipL(li)) continue;
    const P = l.P, hw = RD_WID[l.c][(l.flags & 1) ? 1 : 0]/2 + 1.2;
    for (let k = 0; k + 3 < P.length; k += 2){
      const ax = P[k], ay = P[k + 1], bx2 = P[k + 2], by2 = P[k + 3];
      const i0 = Math.max(0, Math.floor((Math.min(ax, bx2) - hw - x0)/CS)), i1 = Math.min(NC - 1, Math.floor((Math.max(ax, bx2) + hw - x0)/CS));
      const j0 = Math.max(0, Math.floor((Math.min(ay, by2) - hw - y0)/CS)), j1 = Math.min(NC - 1, Math.floor((Math.max(ay, by2) + hw - y0)/CS));
      if (i0 > i1 || j0 > j1) continue;
      segs.push(li, k >> 1, i0, i1, j0, j1);
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) cnt[j*NC + i + 1]++;
    }
  }
  for (let c = 0; c < NC*NC; c++) cnt[c + 1] += cnt[c];
  const fill = cnt.slice(0, NC*NC), SL = new Int32Array(cnt[NC*NC]), SK = new Int32Array(cnt[NC*NC]);
  for (let q = 0; q < segs.length; q += 6){ for (let j = segs[q + 4]; j <= segs[q + 5]; j++) for (let i = segs[q + 2]; i <= segs[q + 3]; i++){ const f = fill[j*NC + i]++; SL[f] = segs[q]; SK[f] = segs[q + 1]; } }
  B = {cnt, SL, SK, x0, y0, NC};
  RI.blocks.set(key, B); if (RI.blocks.size > 160){ const k0 = RI.blocks.keys().next().value; RI.blocks.delete(k0); }
  return B;
}
// all road surfaces under (x, y): fills RC (reused) with {z, c, li, k, t, d, hw, dx, dy}
const RC = []; let RCn = 0;
for (let i = 0; i < 24; i++) RC.push({z:0, c:0, li:0, k:0, t:0, d:0, hw:0, dx:1, dy:0});
function roadCands(x, y){
  RCn = 0; if (!RI.coarse) return 0;
  const bx = Math.floor((x + HALF)/RI.G), by = Math.floor((y + HALF)/RI.G); if (bx < 0 || by < 0 || bx >= RI.NB || by >= RI.NB) return 0;
  const B = riBlock(bx, by), i = Math.floor((x - B.x0)/RI.CS), j = Math.floor((y - B.y0)/RI.CS); if (i < 0 || j < 0 || i >= B.NC || j >= B.NC) return 0;
  const c0 = B.cnt[j*B.NC + i], c1 = B.cnt[j*B.NC + i + 1], Ls = SGR.lines; let gp = null;
  for (let q = c0; q < c1 && RCn < RC.length; q++){
    const l = Ls[B.SL[q]], k = B.SK[q], P = l.P, ax = P[k*2], ay = P[k*2 + 1], dx = P[k*2 + 2] - ax, dy = P[k*2 + 3] - ay, l2 = dx*dx + dy*dy; if (l2 < 1e-4) continue;
    const t = clamp(((x - ax)*dx + (y - ay)*dy)/l2, 0, 1), cx = ax + dx*t, cy = ay + dy*t, ll = Math.sqrt(l2), d = ((x - cx)*(-dy) + (y - cy)*dx)/ll, ad = Math.hypot(x - cx, y - cy);
    const hw = RD_WID[l.c][(l.flags & 1) ? 1 : 0]/2; if (ad > hw + 0.35) continue;
    const e = l.E ? l.E[k] + (l.E[k + 1] - l.E[k])*t : 0, al = e < 1 ? e : 1;
    if (gp === null) gp = gnd(x, y);
    const gc = al > 0 ? gnd(cx, cy) : gp, R = RC[RCn++];
    R.z = gp + (gc - gp)*al + e + RD_OFF[l.c]; R.c = l.c; R.li = B.SL[q]; R.k = k; R.t = t; R.d = d; R.hw = hw; R.dx = dx/ll; R.dy = dy/ll;
  }
  return RCn;
}
// the surface under the car: the road deck (or circuit) nearest the car's height within a step window, else the ground
const SQ = {z:0, kind:'ground', c:-1, li:-1, hw:0, d:0, dx:1, dy:0, blocked:false, bdx:0, bdy:0, tr:false, tri:-1, trt:0, trd:0, trs:0};
const SURF_UP = 1.05, SURF_DN = 1.35, SURF_PASS = {t:0};
function surfQ(x, y, zh, race, out){
  out = out || SQ; out.blocked = false; out.obs = false; out.tr = false; out.c = -1; out.li = -1;
  const lo = zh - SURF_DN, hi = zh + SURF_UP;
  // the circuit
  if (TR){ const p = trProj(x, y); if (p && p.dist < (race ? 1e9 : 10.4)){ const z = trSurf(p.i, p.t, x, y);
    out.trd = p.d; out.tri = p.i; out.trt = p.t; out.trs = p.s;
    if (race || (z >= lo && z <= hi)){ out.z = z; out.kind = 'track'; out.tr = true; out.c = 18; out.hw = 7; out.d = p.d; out.dx = TR.DX[p.i]; out.dy = TR.DY[p.i]; if (race) return out; } } }
  if (race){ out.z = gnd(x, y); out.kind = 'ground'; return out; }
  // roadDrive: where the roads module has indexed the tile, stand on exactly what it draws (its index holds the very triangles of the
  // road meshes: carriageways, junction surfaces, footways, decks) - no invisible road where the mesh has a gap, no step between the
  // polyline estimate and the drawn deck; the polyline candidates below only while the index is not built yet
  if (typeof SGRoads !== 'undefined' && SGRoads.surfaceReady && SGRoads.surfaceReady(x, y)){
    out.k = 0;
    const r = SGRoads.surfaceAt(x, y, zh);
    if (r && r.z >= lo && r.z <= hi){
      out.k = r.k || 0;
      if (!(out.tr && out.z >= r.z - 0.3)){ out.z = r.z; out.kind = 'road'; out.c = r.c; out.li = r.li; out.hw = r.hw || 4; out.d = 0; out.dx = r.dir[0]; out.dy = r.dir[1]; out.tr = false; }
      return out;
    }
    if (out.tr) return out;
    // [roadfix] a hole in the drawn surface (junction fills): stay on the road centre line of this level if one runs here
    { const nc = roadCands(x, y); let bq = -1, be = 1e9;
      for (let q = 0; q < nc; q++){ const R = RC[q]; if (R.c > 11 || Math.abs(R.d) > R.hw - 0.4 || R.z < lo || R.z > hi) continue; const e = Math.abs(R.z - zh); if (e < be){ be = e; bq = q; } }
      if (bq >= 0){ const R = RC[bq]; out.z = R.z; out.kind = 'road'; out.c = R.c; out.li = R.li; out.hw = R.hw; out.d = R.d; out.dx = R.dx; out.dy = R.dy; return out; } }
    const g = gnd(x, y);
    out.z = g; out.kind = 'ground'; out.c = -1; out.hw = 0;
    if (g < lo || g > hi){ out.blocked = true; out.bdx = 0; out.bdy = 0; return out; }
    // the side of a low deck just above the car (1.05-2.6 m): stop against it (its parapet is an obstacle; low ramps have none)
    const up = SGRoads.surfaceAt(x, y, zh + 1.8);
    if (up && up.z > hi && up.z < zh + 2.6 && up.z - g > 1.6 && !SURF_PASS.t){ out.blocked = true; out.bdx = up.dir[0]; out.bdy = up.dir[1]; out.obs = true; }
    return out;
  }
  // roads
  let best = -1, be = 1e9, obs = -1;
  const n = roadCands(x, y);
  for (let q = 0; q < n; q++){ const R = RC[q];
    if (R.z >= lo && R.z <= hi){ const e = Math.abs(R.z - zh) - (R.c <= 10 ? 0.05 : 0) - (R.li === CAR.li ? 0.2 : 0); if (e < be){ be = e; best = q; } }
    else if (R.z > hi && R.z < zh + 2.6 && R.z - gnd(x, y) > 1.6) obs = q; }
  out.k = 0;
  if (out.tr && (best < 0 || out.z >= RC[best].z - 0.3)) return out;   // the circuit surface lies on top of the streets it uses
  if (best >= 0){ const R = RC[best]; out.z = R.z; out.kind = 'road'; out.c = R.c; out.li = R.li; out.hw = R.hw; out.d = R.d; out.dx = R.dx; out.dy = R.dy; out.tr = false; return out; }
  if (out.tr) return out;
  const g = gnd(x, y);
  out.z = g; out.kind = 'ground'; out.c = -1; out.hw = 0;
  if (g < lo || g > hi){ out.blocked = true; out.bdx = 0; out.bdy = 0; }
  else if (obs >= 0 && !SURF_PASS.t){ out.blocked = true; out.bdx = RC[obs].dx; out.bdy = RC[obs].dy; out.obs = true; }
  return out;
}

// ---- buildings: per 2 km tile, edges of the real footprints (hidden ones skipped) in a 20 m grid; built a few hundred per frame
const BI = new Map(), BIC = 20;
function biTileOf(x, y){ const T = SGR.base ? SGR.base.TILE : 2000, TX = Math.round(2*HALF/T), tx = Math.floor((x + HALF)/T), ty = Math.floor((y + HALF)/T); return tx < 0 || ty < 0 || tx >= TX || ty >= TX ? -1 : ty*TX + tx; }
function biGet(ti){
  let T = BI.get(ti); if (T) return T;
  const TL = SGR.base ? SGR.base.TILE : 2000, TX = Math.round(2*HALF/TL);
  T = {ti, list:(SGR.bldData && SGR.bldData.tiles.get(ti)) || [], k:0, E:[], ready:false, x0:-HALF + (ti % TX)*TL, y0:-HALF + Math.floor(ti/TX)*TL, NC:Math.round(TL/BIC), stamp:null};
  BI.set(ti, T); return T;
}
function biWork(T, budget){
  const skip = typeof sgrSkipB === 'function' ? sgrSkipB : null;
  while (T.k < T.list.length && budget-- > 0){
    const b = T.list[T.k++]; if (skip && skip(b)) continue;
    const R0 = b.rings[0], m0 = R0.length >> 1, st = Math.max(1, Math.floor(m0/12)); let gmin = 1e9;
    for (let i = 0; i < m0; i += st) gmin = Math.min(gmin, hC(R0[i*2], R0[i*2 + 1]));
    const z0 = b.base > 2 ? gmin + b.base : gmin - 3, z1 = gmin + b.h;
    for (const R of b.rings){ const m = R.length >> 1; for (let i = 0; i < m; i++){ const j = (i + 1) % m; T.E.push(R[i*2], R[i*2 + 1], R[j*2], R[j*2 + 1], z0, z1); } }
  }
  if (T.k >= T.list.length && !T.ready){
    const NC = T.NC, E = T.E, ne = E.length/6, cnt = new Int32Array(NC*NC + 1);
    const cells = (q, f) => { const i0 = clamp(Math.floor((Math.min(E[q], E[q + 2]) - T.x0)/BIC), 0, NC - 1), i1 = clamp(Math.floor((Math.max(E[q], E[q + 2]) - T.x0)/BIC), 0, NC - 1),
      j0 = clamp(Math.floor((Math.min(E[q + 1], E[q + 3]) - T.y0)/BIC), 0, NC - 1), j1 = clamp(Math.floor((Math.max(E[q + 1], E[q + 3]) - T.y0)/BIC), 0, NC - 1);
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) f(j*NC + i); };
    for (let e = 0; e < ne; e++) cells(e*6, c => cnt[c + 1]++);
    for (let c = 0; c < NC*NC; c++) cnt[c + 1] += cnt[c];
    const fill = cnt.slice(0, NC*NC), L = new Int32Array(cnt[NC*NC]);
    for (let e = 0; e < ne; e++) cells(e*6, c => { L[fill[c]++] = e; });
    T.EF = new Float32Array(E); T.E = null; T.cnt = cnt; T.L = L; T.stamp = new Int32Array(ne); T.ready = true;
  }
  return T.ready;
}
// keep the tiles near the car indexed (the one under the car right away, neighbours a few hundred buildings per frame)
function biPrefetch(x, y){
  if (!SGR.bldData) return;
  const ti = biTileOf(x, y); if (ti < 0) return;
  const T = biGet(ti); if (!T.ready) biWork(T, 1e9);
  let budget = 260;
  for (const [dx, dy] of [[600, 0], [-600, 0], [0, 600], [0, -600], [600, 600], [-600, 600], [600, -600], [-600, -600]]){
    const t2 = biTileOf(x + dx, y + dy); if (t2 < 0 || t2 === ti) continue; const T2 = biGet(t2); if (!T2.ready){ biWork(T2, budget); return; } }
  if (BI.size > 14){ for (const [k, T3] of BI){ const c = [T3.x0 + 1000, T3.y0 + 1000]; if (Math.hypot(c[0] - x, c[1] - y) > 3500) BI.delete(k); if (BI.size <= 10) break; } }
}
let biQ = 1;
// push a circle (cx, cy, r) out of the building walls between heights z0..z1: returns the largest push in PUSH
const PUSH = {x:0, y:0, nx:0, ny:0, depth:0};
function biCircle(cx, cy, r, z0, z1){
  PUSH.depth = 0; const ti = biTileOf(cx, cy); if (ti < 0) return false; const T = BI.get(ti); if (!T || !T.ready) return false;
  const NC = T.NC, E = T.EF, i0 = clamp(Math.floor((cx - r - T.x0)/BIC), 0, NC - 1), i1 = clamp(Math.floor((cx + r - T.x0)/BIC), 0, NC - 1), j0 = clamp(Math.floor((cy - r - T.y0)/BIC), 0, NC - 1), j1 = clamp(Math.floor((cy + r - T.y0)/BIC), 0, NC - 1);
  const q = ++biQ; let hit = false;
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++){ const c = j*NC + i;
    for (let k = T.cnt[c]; k < T.cnt[c + 1]; k++){ const e = T.L[k]; if (T.stamp[e] === q) continue; T.stamp[e] = q; const o = e*6;
      if (E[o + 5] < z0 + 0.3 || E[o + 4] > z1) continue;
      const ax = E[o], ay = E[o + 1], dx = E[o + 2] - ax, dy = E[o + 3] - ay, l2 = dx*dx + dy*dy || 1e-9, t = clamp(((cx - ax)*dx + (cy - ay)*dy)/l2, 0, 1);
      const px = cx - (ax + dx*t), py = cy - (ay + dy*t), dd = Math.hypot(px, py);
      if (dd < r && r - dd > PUSH.depth){ PUSH.depth = r - dd; if (dd > 1e-6){ PUSH.nx = px/dd; PUSH.ny = py/dd; } else { const L = Math.sqrt(l2); PUSH.nx = -dy/L; PUSH.ny = dx/L; } hit = true; } } }
  return hit;
}
// the first wall crossed by the segment a -> b (chase camera): fraction 0..1
function biRay(ax, ay, bx, by, z0, z1){
  const ti = biTileOf(ax, ay); if (ti < 0) return 1; const T = BI.get(ti); if (!T || !T.ready) return 1;
  const NC = T.NC, E = T.EF, i0 = clamp(Math.floor((Math.min(ax, bx) - T.x0)/BIC), 0, NC - 1), i1 = clamp(Math.floor((Math.max(ax, bx) - T.x0)/BIC), 0, NC - 1),
        j0 = clamp(Math.floor((Math.min(ay, by) - T.y0)/BIC), 0, NC - 1), j1 = clamp(Math.floor((Math.max(ay, by) - T.y0)/BIC), 0, NC - 1);
  const q = ++biQ, rx = bx - ax, ry = by - ay; let tmin = 1;
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++){ const c = j*NC + i;
    for (let k = T.cnt[c]; k < T.cnt[c + 1]; k++){ const e = T.L[k]; if (T.stamp[e] === q) continue; T.stamp[e] = q; const o = e*6; if (E[o + 5] < z0 || E[o + 4] > z1) continue;
      const sx = E[o + 2] - E[o], sy = E[o + 3] - E[o + 1], den = rx*sy - ry*sx; if (Math.abs(den) < 1e-9) continue;
      const qx = E[o] - ax, qy = E[o + 1] - ay, t = (qx*sy - qy*sx)/den, u = (qx*ry - qy*rx)/den; if (t >= 0 && t < tmin && u >= 0 && u <= 1) tmin = t; } }
  return tmin;
}
// landmark models: convex ground plans (SGR.hulls)
function hullCircle(cx, cy, r){
  PUSH.depth = 0; if (!SGR.hulls) return false; let hit = false;
  for (const H of SGR.hulls.values()){ const b = H.bb; if (cx < b[0] - r || cx > b[2] + r || cy < b[1] - r || cy > b[3] + r) continue;
    const P = H.P, n = P.length; let A = 0; for (let i = 0; i < n; i++){ const a = P[i], c = P[(i + 1) % n]; A += a[0]*c[1] - c[0]*a[1]; } const sg = A >= 0 ? 1 : -1;
    let inside = true, minIn = 1e9, inx = 0, iny = 0, bd = 1e9, bnx = 0, bny = 0;
    for (let i = 0; i < n; i++){ const a = P[i], c = P[(i + 1) % n], ex = c[0] - a[0], ey = c[1] - a[1], el = Math.hypot(ex, ey) || 1, onx = ey/el*sg, ony = -ex/el*sg;   // outward normal
      const sd = (cx - a[0])*onx + (cy - a[1])*ony; if (sd > 0) inside = false; if (-sd < minIn){ minIn = -sd; inx = onx; iny = ony; }
      const t = clamp(((cx - a[0])*ex + (cy - a[1])*ey)/(el*el), 0, 1), px = cx - (a[0] + ex*t), py = cy - (a[1] + ey*t), dd = Math.hypot(px, py);
      if (dd < bd){ bd = dd; if (dd > 1e-6){ bnx = px/dd; bny = py/dd; } else { bnx = onx; bny = ony; } } }
    let depth = 0, nx = 0, ny = 0;
    if (inside){ depth = minIn + r; nx = inx; ny = iny; } else if (bd < r){ depth = r - bd; nx = bnx; ny = bny; }
    if (depth > PUSH.depth){ PUSH.depth = depth; PUSH.nx = nx; PUSH.ny = ny; hit = true; } }
  return hit;
}
// roadDrive: the street / park trees of the built tile under (cx, cy) (sgrTrees: an instanced trunk per tree, a child of the crowns):
// trunk circles in a 10 m grid, cached per tile until the tile rebuilds its trees
const TRK = new Map();
function trunks(ti){
  const T = SGR.tiles && SGR.tiles.get(ti); if (!T || !T.trees || !T.trees.visible) return null;
  let a = TRK.get(ti); if (a && a.src === T.trees) return a;
  const tk = T.trees.children.find(o => o.isInstancedMesh); if (!tk) return null;
  if (a && a.src !== T.trees) for (const B of BRK.trees.slice()) if (B.src === a.src) treeRestore(B);
  // trees standing on a drawn carriageway or junction surface (the app plants them off the road polylines only) are not solid
  const sa = typeof SGRoads !== 'undefined' && SGRoads.surfaceReady; if (sa && !SGRoads.surfaceReady(T.cx, T.cy)) return null;
  const M = tk.instanceMatrix.array, g = new Map();
  for (let i = 0; i < tk.count; i++){ const q = i*16, px = M[q + 12], py = -M[q + 14], r = Math.hypot(M[q], M[q + 1], M[q + 2]), h = Math.hypot(M[q + 4], M[q + 5], M[q + 6]), k = Math.floor(px/10)*100000 + Math.floor(py/10);
    if (sa){ const s = SGRoads.surfaceAt(px, py, M[q + 13] + 0.3); if (s && s.k !== 2 && Math.abs(s.z - M[q + 13] - 0.3) < 1) continue; }
    if (r < 1e-3) continue;                                                // trimmed (f1track corridor) or broken
    let L = g.get(k); if (!L) g.set(k, L = []); L.push(px, py, r*0.9, M[q + 13], M[q + 13] + h, i); }
  a = {src:T.trees, tk, g, broken:new Set()}; TRK.set(ti, a); if (TRK.size > 12) TRK.delete(TRK.keys().next().value);
  return a;
}
const TREEHIT = {a:null, L:null, q:-1};
function treeCircle(cx, cy, r, z){
  PUSH.depth = 0; TREEHIT.a = null; const a = trunks(biTileOf(cx, cy)); if (!a) return false;
  const i0 = Math.floor((cx - r - 1)/10), i1 = Math.floor((cx + r + 1)/10), j0 = Math.floor((cy - r - 1)/10), j1 = Math.floor((cy + r + 1)/10);
  for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++){ const L = a.g.get(i*100000 + j); if (!L) continue;
    for (let q = 0; q < L.length; q += 6){ if (L[q + 4] < z + 0.08 || L[q + 3] > z + 1.0 || (a.broken.size && a.broken.has(L[q + 5]))) continue; const dx = cx - L[q], dy = cy - L[q + 1], d = Math.hypot(dx, dy), pen = r + L[q + 2] - d;
      if (pen > PUSH.depth){ PUSH.depth = pen; TREEHIT.a = a; TREEHIT.L = L; TREEHIT.q = q; if (d > 1e-6){ PUSH.nx = dx/d; PUSH.ny = dy/d; } else { PUSH.nx = 1; PUSH.ny = 0; } } } }
  return PUSH.depth > 0;
}
// the sea and the reservoirs: bilinear wetness of the 25 m land-cover raster (1 sea, 2 fresh water)
function wetAt(x, y){
  const fx = (x + HALF)/CELL - 0.5, fy = (y + HALF)/CELL - 0.5, i = Math.floor(fx), j = Math.floor(fy), u = fx - i, v = fy - j;
  const w = (a, b) => { a = clamp(a, 0, N - 1); b = clamp(b, 0, N - 1); const c = nat[b*N + a]; return c === 1 || c === 2 ? 1 : 0; };
  return (w(i, j)*(1 - u) + w(i + 1, j)*u)*(1 - v) + (w(i, j + 1)*(1 - u) + w(i + 1, j + 1)*u)*v;
}
function waterCircle(cx, cy, r){
  PUSH.depth = 0; const wc = wetAt(cx, cy); if (wc < 0.35) return false;
  const h = CELL*0.5, gx = (wetAt(cx + h, cy) - wetAt(cx - h, cy))/(2*h), gy = (wetAt(cx, cy + h) - wetAt(cx, cy - h))/(2*h), gl = Math.hypot(gx, gy);
  if (gl < 1e-5){ if (wc > 0.5){ PUSH.depth = 0.3; PUSH.nx = 0; PUSH.ny = 0; return true; } return false; }
  const dist = (wc - 0.35)/gl; PUSH.depth = dist; PUSH.nx = -gx/gl; PUSH.ny = -gy/gl; return dist > 0;
}
// an oriented box (other cars): push a circle out of it
function obbCircle(cx, cy, r, ox, oy, hx, hy, hl, hw){
  const dx = cx - ox, dy = cy - oy, lx = dx*hx + dy*hy, ly = -dx*hy + dy*hx;
  const qx = clamp(lx, -hl, hl), qy = clamp(ly, -hw, hw), ex = lx - qx, ey = ly - qy, d = Math.hypot(ex, ey);
  if (d >= r) return false;
  let nlx, nly, depth;
  if (d > 1e-6){ nlx = ex/d; nly = ey/d; depth = r - d; }
  else { const px = hl - Math.abs(lx), py = hw - Math.abs(ly); if (px < py){ nlx = Math.sign(lx) || 1; nly = 0; depth = px + r; } else { nlx = 0; nly = Math.sign(ly) || 1; depth = py + r; } }
  PUSH.nx = nlx*hx - nly*hy; PUSH.ny = nlx*hy + nly*hx; PUSH.depth = depth; return true;
}

/* ================= cars, liveries, state ================= */
const NC = 11;   // car 0 = the player, 1..10 = AI (invented teams; no real names, numbers or sponsors)
const LIV = [
  {code:'YOU', p:[0.86, 0.10, 0.13], s:[0.95, 0.95, 0.95], a:[0.10, 0.10, 0.11]},
  {code:'VLT', p:[0.98, 0.82, 0.10], s:[0.16, 0.17, 0.19], a:[0.10, 0.75, 0.90]},
  {code:'GLC', p:[0.93, 0.95, 0.97], s:[0.42, 0.70, 0.92], a:[0.06, 0.12, 0.30]},
  {code:'VPR', p:[0.45, 0.85, 0.15], s:[0.07, 0.08, 0.08], a:[0.95, 0.95, 0.95]},
  {code:'DSK', p:[0.42, 0.18, 0.62], s:[0.98, 0.55, 0.10], a:[0.95, 0.95, 0.95]},
  {code:'AUR', p:[0.05, 0.60, 0.60], s:[0.90, 0.20, 0.55], a:[0.95, 0.95, 0.95]},
  {code:'CRB', p:[0.12, 0.12, 0.13], s:[0.98, 0.45, 0.08], a:[0.62, 0.64, 0.66]},
  {code:'CBT', p:[0.10, 0.25, 0.75], s:[0.95, 0.95, 0.95], a:[0.98, 0.80, 0.10]},
  {code:'SND', p:[0.80, 0.68, 0.42], s:[0.25, 0.18, 0.12], a:[0.08, 0.08, 0.08]},
  {code:'EMB', p:[0.55, 0.06, 0.08], s:[0.09, 0.09, 0.10], a:[0.95, 0.72, 0.25]},
  {code:'MNT', p:[0.60, 0.92, 0.80], s:[0.12, 0.30, 0.35], a:[0.98, 0.98, 0.98]}];
const TYRE = [[0.92, 0.13, 0.12], [0.98, 0.82, 0.12], [0.95, 0.95, 0.93]];
const CAR_TYRE = [0, 0, 1, 0, 2, 1, 0, 1, 2, 0, 1];
const F1 = {on:false, mode:null, cam:0, laps:3, t:0, saved:null, msgT:0, ms:0, built:false};
const CAR = {x:0, y:0, z:0, zs:0, zv:0, dzv:0, pitchS:0, rollS:0, dive:0, lean:0, psi:0, u:0, v:0, r:0, delta:0, ax:0, ay:0, rev:false, revT:0, gear:1, rpm:4200, pitch:0, roll:0, wspin:0, kind:'road', c:-1, li:-1,
  rdx:1, rdy:0, trd:0, tri:0, hit:0, odo:0, vtop:0, thr:0, brk:0, steer:0};
const KEYS = new Set(), TOUCH = {steer:0, thr:0, brk:0, used:false}, INP = {thr:0, brk:0, steer:0, hb:0};
let SCRIPT = null;
const ENV = {grip:1, drag:1, df:1, roll:0, assist:1};
const RACE = {state:'off', t:0, lights:0, goT:0, hold:1, laps:3, prog:0, rel:0, lap:0, lapBase:0, lapT0:0, sec:0, secT0:0, secs:[0, 0, 0], bestSec:[1e9, 1e9, 1e9], last:0, best:0, inv:false,
  offT:0, wrongT:0, fin:null, order:[], fastest:1e9};
const AI = [];

/* ================= input ================= */
// [lm24/drive] progressive keyboard pedals: a key press starts at a light pedal and builds up while held (full after ~0.2 s), a tap
// gives partial braking / throttle, release lets go in ~0.1 s; analog inputs (gamepad triggers, touch pedals) pass straight through
const KPED = {thr:0, brk:0};
function keyPedal(k, on, dt, p0, up, dn){ const v = KPED[k]; KPED[k] = on ? (v < p0 ? p0 : Math.min(1, v + up*dt)) : Math.max(0, v - dn*dt); return KPED[k]; }
function readInput(dt){
  if (MPN.ap && F1.on){ const A = F1.veh === 'car' ? rcAutoInput(MPN.ap) : autoInput(MPN.ap); INP.thr = A.thr; INP.brk = A.brk; INP.steer = A.steer; INP.hb = A.hb || 0; return INP; }   // [lm25/net] test autopilot
  if (SCRIPT){ INP.thr = SCRIPT.thr || 0; INP.brk = SCRIPT.brk || 0; INP.steer = SCRIPT.steer || 0; INP.hb = SCRIPT.hb || 0; return INP; }
  const k = c => KEYS.has(c); dt = dt || 1/60;
  let thr = keyPedal('thr', k('KeyW') || k('ArrowUp'), dt, 0.35, 3.2, 8), brk = keyPedal('brk', k('KeyS') || k('ArrowDown'), dt, 0.3, 3.8, 10), st = ((k('KeyA') || k('ArrowLeft')) ? 1 : 0) - ((k('KeyD') || k('ArrowRight')) ? 1 : 0), hb = k('Space') ? 1 : 0;
  thr = Math.max(thr, TOUCH.thr); brk = Math.max(brk, TOUCH.brk); if (Math.abs(TOUCH.steer) > Math.abs(st)) st = TOUCH.steer;
  const gps = navigator.getGamepads ? navigator.getGamepads() : null;
  if (gps) for (const g of gps){ if (!g || !g.connected) continue;
    const ax = g.axes[0] || 0; if (Math.abs(ax) > 0.12 && Math.abs(ax) > Math.abs(st)) st = -Math.sign(ax)*Math.pow((Math.abs(ax) - 0.12)/0.88, 1.4);
    const bv = i => g.buttons[i] ? (g.buttons[i].value || (g.buttons[i].pressed ? 1 : 0)) : 0;
    thr = Math.max(thr, bv(7), bv(0)); brk = Math.max(brk, bv(6), bv(1)); if (bv(2) > 0.5) hb = 1;
    if (bv(3) > 0.5 && !readInput.y){ readInput.y = true; nextCam(); } else if (bv(3) < 0.5) readInput.y = false;
    { const lb = bv(4) > 0.5; if (lb !== !!readInput.lb){ readInput.lb = lb; dcLb(lb, 'pad'); } if (bv(5) > 0.5 && !readInput.rb){ readInput.rb = true; dcThreatToggle(); } else if (bv(5) < 0.5) readInput.rb = false; }   // [lm28/drivecam]
    break; }
  INP.thr = thr; INP.brk = brk; INP.steer = clamp(st, -1, 1); INP.hb = hb;
  return INP;
}

/* ================= the player's car: sub-stepped dynamics, the surface, collisions ================= */
const H_SUB = 1/240, CIRC = [1.9, 0, -1.9], CR = 0.95, BODYC = [2.3, 0.8, 1.66, 1.0, 0, 0.95, -1.94, 1.0, -2.6, 0.5], ROB = {depth:0, nx:0, ny:0}, HOLD = {thr:0, brk:1, steer:0, hb:0}, SQ2 = Object.assign({}, SQ), TPJ2 = {i:0, t:0, s:0, d:0, dist:0};
const OBS = []; let OBSn = 0;
for (let i = 0; i < 40; i++) OBS.push({x:0, y:0, hx:1, hy:0, hl:2, hw:1, z:0, vx:0, vy:0, w:0, id:0, m:0, crash:false, k:'', ai:null});
const TRAF_PREV = new Map(); let trafT = 0;
function gatherObs(race){
  OBSn = 0; const C = CAR;
  for (const a of AI){ if (OBSn >= OBS.length) break; const dx = a.x - C.x, dy = a.y - C.y; if (dx*dx + dy*dy > 900) continue;
    const o = OBS[OBSn++]; o.x = a.x; o.y = a.y; o.hx = Math.cos(a.psi); o.hy = Math.sin(a.psi); o.hl = 2.75; o.hw = 0.97; o.z = a.z; o.vx = o.hx*a.v; o.vy = o.hy*a.v; o.w = 0; o.id = 0; o.m = 0; o.crash = false; o.k = 'ai'; o.ai = a; }
  if (MPN.n) mpObs(C);   // [lm25/net] remote players
  if (OBP.list.length) obpGather(C, race);   // [lm28/drivecam] window.SGArmy and other providers
  // v22: the real-map traffic module (lm20/traffic) owns the vehicles there: its oriented boxes
  if (!race && typeof window !== 'undefined' && window.SGTraffic && window.SGTraffic.obstacles && window.SGTraffic.enabled !== false){
    const L = window.SGTraffic.obstacles(C.x, C.y, 40, gatherObs.buf || (gatherObs.buf = []));
    for (const t of L){ if (OBSn >= OBS.length) break; const o = OBS[OBSn++]; o.x = t.x; o.y = t.y; o.hx = t.hx; o.hy = t.hy; o.hl = t.hl; o.hw = t.hw; o.z = t.z;
      o.vx = t.vx !== undefined ? t.vx : t.hx*(t.v || 0); o.vy = t.vy !== undefined ? t.vy : t.hy*(t.v || 0); o.w = t.w || 0; o.id = t.id || 0; o.m = t.m || 0; o.crash = !!t.crash; o.k = t.k || ''; }
  }
  if (race || typeof cars === 'undefined' || !cars || !cars.visible || !carState) return;
  const A = cars.instanceMatrix.array, n = Math.min(carState.length, cars.count), now = performance.now()/1000, fdt = Math.max(1e-3, now - trafT); trafT = now;
  for (let i = 0; i < n && OBSn < OBS.length; i++){ const q = i*16, px = A[q + 12], py = -A[q + 14], dx = px - C.x, dy = py - C.y; if (dx*dx + dy*dy > 1600){ TRAF_PREV.delete(i); continue; }
    const sx = Math.hypot(A[q], A[q + 1], A[q + 2]); if (sx < 0.05) continue; const sy = Math.hypot(A[q + 4], A[q + 5], A[q + 6]), sz = Math.hypot(A[q + 8], A[q + 9], A[q + 10]);
    const o = OBS[OBSn++]; o.x = px; o.y = py; o.hx = A[q]/sx; o.hy = -A[q + 2]/sx; o.hl = sx/2; o.hw = sz/2; o.z = A[q + 13] - sy/2; o.w = 0; o.id = 0; o.m = 0; o.crash = false; o.k = 'app';
    // their velocity, from the last frame (traffic moves on rails; impacts use the relative speed)
    const pv = TRAF_PREV.get(i); if (pv && fdt < 0.3){ o.vx = clamp((px - pv[0])/fdt, -40, 40); o.vy = clamp((py - pv[1])/fdt, -40, 40); } else { o.vx = 0; o.vy = 0; }
    if (pv){ pv[0] = px; pv[1] = py; } else TRAF_PREV.set(i, [px, py]); }
  if (TRAF_PREV.size > 400) TRAF_PREV.clear();
}
const copyQ = (a, b) => { for (const k in b) a[k] = b[k]; };
// an impulse at contact arm (ax, ay) from the centre of mass along the normal n (pointing away from the obstacle)
function impact(C, nx, ny, ax, ay, e, mu, ovx, ovy){
  const cs = Math.cos(C.psi), sn = Math.sin(C.psi); let Vx = C.u*cs - C.v*sn, Vy = C.u*sn + C.v*cs;
  const pvx = Vx - C.r*ay - (ovx || 0), pvy = Vy + C.r*ax - (ovy || 0), vn = pvx*nx + pvy*ny; if (vn >= 0) return 0;
  const PV = F1.veh === 'car' ? RCP : PH, an = ax*ny - ay*nx, j = -(1 + e)*vn/(1/PV.m + an*an/PV.Iz);
  const tx = -ny, ty = nx, vt = pvx*tx + pvy*ty, at = ax*ty - ay*tx; let jt = -vt/(1/PV.m + at*at/PV.Iz); jt = clamp(jt, -mu*j, mu*j);
  Vx += (j*nx + jt*tx)/PV.m; Vy += (j*ny + jt*ty)/PV.m; C.r += 0.5*(an*j + at*jt)/PV.Iz; C.r = clamp(C.r, -2.5, 2.5);
  C.u = Vx*cs + Vy*sn; C.v = -Vx*sn + Vy*cs; C.hit = Math.max(C.hit, -vn);
  return -vn;
}
function pushOut(C, ax, ay, e, mu, ovx, ovy){ const d = Math.min(PUSH.depth, 1.2); C.x += PUSH.nx*d; C.y += PUSH.ny*d; impact(C, PUSH.nx, PUSH.ny, ax, ay, e, mu, ovx, ovy); }
function subStep(h, I, hold, race){
  const C = CAR; if (SURF_PASS.t > 0) SURF_PASS.t -= h;
  if (hold){ C.u = C.v = C.r = 0; C.rev = false; C.revT = 0; C.delta += clamp(I.steer*f1MaxSteer(0) - C.delta, -2*h, 2*h); return; }
  if (surfEnv(C, race, h)) return;   // [lm30/phys2] the surface, wet / snow, the vertical load; true: tripped over
  const car = F1.veh === 'car', Gv = car && RCM.key ? RCAR[RCM.key].g : null, CI = car ? (Gv && Gv.circ || RC_CIRC) : CIRC, CRv = car ? (Gv && Gv.cr || RC_CR) : CR, BC = car ? (Gv && Gv.bodyc || RC_BODYC) : BODYC;
  if (car) rcPhys(C, I, h, ENV); else f1Phys(C, hold ? HOLD : I, h, ENV);
  C.psi = wrapA(C.psi + C.r*h);
  let cs = Math.cos(C.psi), sn = Math.sin(C.psi);
  const vx = C.u*cs - C.v*sn, vy = C.u*sn + C.v*cs;
  let nx = C.x + vx*h, ny = C.y + vy*h;
  surfQ(nx, ny, C.z, race, SQ);
  if (SQ.blocked){
    let ex = SQ.bdx, ey = SQ.bdy; if (!ex && !ey && C.kind !== 'ground'){ ex = C.rdx; ey = C.rdy; }
    let moved = false;
    if (ex || ey){ const al = vx*ex + vy*ey, tx = C.x + ex*al*h, ty = C.y + ey*al*h; surfQ(tx, ty, C.z, race, SQ2); if (!SQ2.blocked){ nx = tx; ny = ty; copyQ(SQ, SQ2); moved = true; } }
    let wnx, wny; if (ex || ey){ wnx = -ey; wny = ex; if (wnx*vx + wny*vy > 0){ wnx = -wnx; wny = -wny; } } else { const vl = Math.hypot(vx, vy) || 1; wnx = -vx/vl; wny = -vy/vl; }
    if (moved) impact(C, wnx, wny, 0, 0, 0.12, 0.25);
    else {   // could not slide either: stop against it (a little bounce back)
      const vl = Math.hypot(vx, vy) || 1; impact(C, -vx/vl, -vy/vl, 0, 0, 0.15, 0.6); nx = C.x; ny = C.y; const wasObs = SQ.obs; surfQ(nx, ny, C.z, race, SQ); SQ.blocked = false;
      // data oddities (a ramp deck crossing low over a road): after half a second against it, let the car through
      if (wasObs){ C.stuckT = (C.stuckT || 0) + h; if (C.stuckT > 0.5){ SURF_PASS.t = 1.5; C.stuckT = 0; } } }
  }
  C.x = clamp(nx, -HALF + 40, HALF - 40); C.y = clamp(ny, -HALF + 40, HALF - 40);
  C.kind = SQ.kind; C.c = SQ.c; if (SQ.li >= 0) C.li = SQ.li; else if (SQ.kind !== 'road') C.li = -1;
  if (SQ.kind !== 'ground'){ C.rdx = SQ.dx; C.rdy = SQ.dy; }
  if (SQ.tr){ C.trd = SQ.trd; C.tri = SQ.tri; }
  // [lm27/destruct] off a deck edge / a ramp lip at speed: airborne (ballistic, it may land hard or roll)
  if (!race && !hold && C.z - SQ.z > 1.5 && Math.abs(C.u) > 15 && !SURF_PASS.t){ airStart(0, 0, clamp(C.vzS || 0, -3, 6), 0, 0, 0, 'edge'); return; }
  const zPrev = C.z;
  C.zs = SQ.z; const dz = C.zs - C.z; if (Math.abs(dz) < 0.25) C.z = C.zs; else C.z += dz*Math.min(1, h*30);
  C.vzS = (C.vzS || 0)*0.9 + 0.1*clamp((C.z - zPrev)/h, -20, 20);
  if (vertStep(C, h, zPrev, race)) return;   // [lm30/phys2] heave, wheels off the ground, a jump
  // walls (race), buildings, landmark models, water, other cars: three circles along the car
  // [lm24/drive] everything is solid in every mode and map: buildings on and off the roads (a wall standing on a drawn carriageway is
  // the data's overlap: passed), the landmark models' real faces (column grid) instead of their convex ground plans, two-body impacts
  // with the traffic; contacts are recorded for the damage, the sounds and the breakables
  const elev = !race && C.z - gnd(C.x, C.y) > 2.5, rc = F1.veh === 'car', zb0 = C.z + (rc ? 0.3 : 0.18), zb1 = C.z + (rc ? 1.35 : 0.95);
  // a landmark whose face grid is not built yet: its convex ground plan off the public roads (as before)
  const lmPend = !race && !elev && LMG.job !== null && LMG.job !== undefined, onPublic = C.kind === 'track' || (C.kind === 'road' && SQ.k !== 2 && (C.c <= 10 || C.c === 13 || C.c === 14 || C.c === 18));
  for (let k = 0; k < CI.length; k++){
    cs = Math.cos(C.psi); sn = Math.sin(C.psi);
    const ax = cs*CI[k], ay = sn*CI[k], cx = C.x + ax, cy = C.y + ay;
    if (race && TR){ const p = trProj(cx, cy, TPJ2); if (p){ const ps = TR.pit[p.i] ? TR.side : 0, limL = (TR.wl ? TR.wl[p.i] - 0.3 : ps === 1 ? 12.4 : 10.05) - CR, limR = (TR.wr ? TR.wr[p.i] - 0.3 : ps === -1 ? 12.4 : 10.05) - CR, Nx = -TR.DY[p.i], Ny = TR.DX[p.i];
      if (p.d > limL){ PUSH.depth = p.d - limL; PUSH.nx = -Nx; PUSH.ny = -Ny; push2(C, ax, ay, 0.1, 0.18, KND.WALL); }
      else if (p.d < -limR){ PUSH.depth = -limR - p.d; PUSH.nx = Nx; PUSH.ny = Ny; push2(C, ax, ay, 0.1, 0.18, KND.WALL); } } }
    // [lm24/drive] free drive: the circuit's concrete walls (where f1track draws them) are solid from both sides
    else if (TR && cx > TR.bb[0] - 20 && cx < TR.bb[2] + 20 && cy > TR.bb[1] - 20 && cy < TR.bb[3] + 20){ const p = trProj(cx, cy, TPJ2);
      if (p && p.dist < 16 && Math.abs(C.z - trSurf(p.i, p.t, cx, cy)) < 1.6){ const NW = window.F1T && window.F1T.W && window.F1T.W.NOWALL, Nx = -TR.DY[p.i], Ny = TR.DX[p.i];
        for (let sd = 0; sd < 2; sd++){ if (NW && NW[sd] && NW[sd][p.i]) continue; const w = sd ? (TR.wr ? TR.wr[p.i] : 10.05) : (TR.wl ? TR.wl[p.i] : 10.05), dd = sd ? -p.d : p.d, w0 = w - 0.3, w1 = w + 0.25;
          if (dd > w0 - CRv && dd < w1 + CRv){ const inside = dd < (w0 + w1)*0.5, sg = sd ? -1 : 1; PUSH.depth = inside ? dd - (w0 - CRv) : (w1 + CRv) - dd; PUSH.nx = (inside ? -Nx : Nx)*sg; PUSH.ny = (inside ? -Ny : Ny)*sg; push2(C, ax, ay, 0.1, 0.2, KND.WALL); } } } }
    { if (bldCircle(cx, cy, CRv, C.z, C.z + 1.05)) push2(C, ax, ay, 0.15, 0.3, KND.BLD);
      if (lmgCircle(cx, cy, CRv, zb0, zb1)) push2(C, ax, ay, 0.15, 0.3, KND.LM);
      else if (lmPend && !onPublic && hullCircle(cx, cy, CRv)) push2(C, ax, ay, 0.15, 0.3, KND.LM);
      if (C.kind === 'ground' && !elev && waterCircle(cx, cy, CRv)){ const st = PUSH.depth; push2(C, ax, ay, 0.05, 0.5, KND.WATER); if (st > 0.2 && Math.abs(C.u) > 3 && CRS.time - (CRS.splT || 0) > 1){ CRS.splT = CRS.time; sfx('splash', cx, cy, C.z, clamp(Math.abs(C.u)/20, 0.3, 1)); } }
    }
    for (let q = 0; q < OBSn; q++){ const o = OBS[q]; if (o.k === 'ext' ? obpOut(o, C) : Math.abs(o.z - C.z) > 2.2) continue; if (obbCircle(cx, cy, CRv, o.x, o.y, o.hx, o.hy, o.hl, o.hw)) carHit(C, ax, ay, o, CRv); }   // [lm28/drivecam] boxes by height
  }
  // roadDrive: what the roads module draws solid - lamp poles, deck parapets, piers and pier caps, tunnel portals, masts - and the trees:
  // five circles along the body (front wing, axles, middle, rear wing). [lm24/drive] the road module's obstacles come from our own copy
  // (each identified: lamp poles break when hit hard enough, the others are rigid); signal poles (breakable) and bus shelters; trees
  // break or shake
  {
    for (let k = 0; k < BC.length; k += 2){
      cs = Math.cos(C.psi); sn = Math.sin(C.psi);
      const ax = cs*BC[k], ay = sn*BC[k], cx = C.x + ax, cy = C.y + ay, rr = BC[k + 1];
      if (obxCircle(cx, cy, rr, C.z + 0.08, C.z + 1.0)){ const T = OBX.PUSHT, i = OBX.PUSHI, kd = T.kind[i];
        if (kd === OBK.POLE) breakOrHit(C, ax, ay, poleEb(T.d[i*10 + 5]), KND.POLE, null, (dx, dy, E) => roadPoleBreak(T, i, dx, dy, E));
        else push2(C, ax, ay, 0.12, 0.3, kd === OBK.RAIL ? KND.RAIL : kd === OBK.MAST ? KND.MAST : KND.PIER); }
      else if (typeof SGRoads !== 'undefined' && SGRoads.pushCircle && !obxTile(cx, cy) && SGRoads.pushCircle(cx, cy, rr, C.z + 0.08, C.z + 1.0, ROB) > 0 && ROB.depth > 0){ PUSH.depth = ROB.depth; PUSH.nx = ROB.nx; PUSH.ny = ROB.ny; push2(C, ax, ay, 0.12, 0.3, KND.RAIL); }
      if (PROPS.list.length && propsCircle(cx, cy, rr, C.z + 0.08, C.z + 1.2)){ const P = PROPS.hit;
        if (P.kind === 'sig') breakOrHit(C, ax, ay, 40e3, KND.SIG, null, (dx, dy, E) => sigBreak(P, dx, dy, E)); else push2(C, ax, ay, 0.15, 0.35, KND.SHELTER); }
      if (treeCircle(cx, cy, rr, C.z)){ const a = TREEHIT.a, L = TREEHIT.L, q = TREEHIT.q, r = L[q + 2];
        const broke = breakOrHit(C, ax, ay, treeEb(r), KND.TREE, null, (dx, dy, E) => treeBreak(a, L, q, dx, dy, E));
        if (!broke){ const c = CT.find(t => t.kind === KND.TREE); if (c && c.vn > 0.8) treeShake(a, L, q, -PUSH.nx, -PUSH.ny, clamp(c.vn*0.012, 0.01, 0.07)); } }
    }
  }
}
const SQP = Object.assign({}, SQ);
function zAt(x, y, race){ surfQ(x, y, CAR.z, race, SQP); return SQP.blocked ? CAR.zs : SQP.z; }
function driveTick(dt){
  if (!(dt > 0)) return; dt = Math.min(dt, 0.1);
  const race = F1.mode === 'race', C = CAR, I = readInput(dt), hold = race && RACE.state === 'grid';
  C.thr = hold ? 0 : I.thr; C.brk = hold ? 1 : I.brk; C.steer = I.steer; C.hit = 0;
  gatherObs(race);
  // SGRoads v2 answers surface queries from per-tile indexes: build them around (and ahead of) the car in small slices, use them when ready
  if (!race && typeof SGRoads !== 'undefined' && SGRoads.surfaceAt){
    if (SGRoads.surfacePrefetch){ F1.sa = SGRoads.surfacePrefetch(C.x, C.y, 1.0);
      if (F1.sa && Math.abs(C.u) > 25) SGRoads.surfacePrefetch(C.x + Math.cos(C.psi)*260, C.y + Math.sin(C.psi)*260, 0.5); }
    else F1.sa = true;
    // roadDrive: never drive on estimates: the tile under the car (and the one it is about to enter) is indexed now if the
    // prefetch has not caught up (a rare hitch instead of a car floating over / sinking into the drawn road)
    if (SGRoads.surfaceReady){ if (!SGRoads.surfaceReady(C.x, C.y)) SGRoads.surfaceAt(C.x, C.y, C.z);
      const ax = C.x + Math.cos(C.psi)*Math.abs(C.u)*0.15, ay = C.y + Math.sin(C.psi)*Math.abs(C.u)*0.15; if (!SGRoads.surfaceReady(ax, ay)) SGRoads.surfaceAt(ax, ay, C.z); }
  } else F1.sa = false;
  const n = Math.max(1, Math.ceil(dt/H_SUB - 1e-6)), h = dt/n;
  for (let s = 0; s < n && !AIR.on; s++) subStep(h, I, hold, race);
  if (AIR.on) airTick(dt);   // [lm27/destruct] thrown / tumbling / rolled over
  obpHits();   // [lm28/drivecam]
  dmgTick(dt);
  // the traffic sees the car (a leader in its lane: the vehicles behind brake for it)
  { const TP = window.SGTraffic && window.SGTraffic.player; if (TP){ const cs = Math.cos(C.psi), sn = Math.sin(C.psi), Gv = F1.veh === 'car' && RCM.key ? RCAR[RCM.key].g : null;
      TP.on = !race; TP.x = C.x; TP.y = C.y; TP.z = C.z; TP.vx = C.u*cs - C.v*sn; TP.vy = C.u*sn + C.v*cs; TP.hl = Gv ? (Gv.xf - Gv.xr)/2 : 2.8; TP.hw = Gv ? (Gv.circ && Gv.cr > 1.2 ? 1.3 : Gv.lean ? 0.4 : 0.95) : 1.0; } }
  if (!race){ PROPS.t += dt; if (PROPS.t > 0.25 || Math.hypot(C.x - (PROPS.x || 0), C.y - (PROPS.y || 0)) > 8){ PROPS.t = 0; PROPS.x = C.x; PROPS.y = C.y; if (window.SGTraffic && window.SGTraffic.props) window.SGTraffic.props(C.x, C.y, 45, PROPS.list); } }
  else PROPS.list.length = 0;
  if (AIR.on) return;   // [lm27/destruct] the pose comes from the rigid body
  if (F1.veh === 'car'){ rcAttitude(C, dt); return; }
  // attitude: roadDrive: the plane through the four wheel contacts (a wheel up on a kerb, a crest, a camber); the wheels follow that plane
  // (pitchS / rollS, height zv), the body adds a touch of dive, squat and roll on top
  const cs = Math.cos(C.psi), sn = Math.sin(C.psi), wz = (lx, lz) => zAt(C.x + cs*lx + sn*lz, C.y + sn*lx - cs*lz, race);
  const zFL = wz(1.66, -0.8), zFR = wz(1.66, 0.8), zRL = wz(-1.94, -0.78), zRR = wz(-1.94, 0.78);
  const zf = (zFL + zFR)*0.5, zr = (zRL + zRR)*0.5, zl = (zFL + zRL)*0.5, zri = (zFR + zRR)*0.5;
  const ptS = clamp(Math.atan2(zf - zr, 3.6), -0.3, 0.3), rlS = clamp(Math.atan2(zl - zri, 1.59), -0.25, 0.25), dzv = clamp(zr + (zf - zr)*(1.94/3.6) - C.z, -0.4, 0.4);
  const k = Math.min(1, dt*12), ks = Math.min(1, dt*25);
  C.pitchS += (ptS - C.pitchS)*ks; C.rollS += (rlS - C.rollS)*ks; C.dzv += (dzv - C.dzv)*ks; C.zv = C.z + C.dzv + p2Heave(C, dt);   // [lm30/phys2] heave
  C.dive += (clamp(C.ax, -60, 30)*0.0004 - C.dive)*k;   // [lm24/drive] nose down under braking (was nose up)
  C.lean += (clamp(C.ay || 0, -50, 50)*0.0004 - C.lean)*k;   // [lm30/phys2] roll into the turn (was inside the comment above)
  C.pitch = C.pitchS + C.dive; C.roll = C.rollS + C.lean;
  C.wspin = (C.wspin + C.u*dt/0.36) % (TAU*1000);
  // gears and revs (8-speed, seamless, automatic)
  const kmh = Math.abs(C.u)*3.6, G = PH.gears;
  if (C.rev) C.gear = -1;
  else { if (C.gear < 1) C.gear = 1; let r = 12000*kmh/G[C.gear];
    if (r > 11700 && C.gear < 8){ C.gear++; r = 12000*kmh/G[C.gear]; } else if (C.gear > 1 && 12000*kmh/G[C.gear - 1] < 10400){ C.gear--; r = 12000*kmh/G[C.gear]; }
    C.rpm += (Math.max(PH.rpmIdle + C.thr*(C.gear === 1 && kmh < 40 ? 6200 : 0), Math.min(12200, r)) - C.rpm)*Math.min(1, dt*14); }
  if (C.rev) C.rpm += (PH.rpmIdle + 2500*C.brk - C.rpm)*Math.min(1, dt*10);
  C.odo += Math.abs(C.u)*dt; C.vtop = Math.max(C.vtop, kmh);
  if (race) raceTick(dt);
}

/* ================= race: start lights, laps and sectors, track limits, results ================= */
function gridPos(k){ const i = TR.wrap(TR.startI - Math.round(k*1.6)); return [TR.F.cum[i] - 3.0, k % 2 ? -3.4 : 3.4]; }
const PSLOT = 6;
function placePlayerOnTrack(s, d, v){
  const p = trAt(s, d, TMPA), C = CAR; C.x = p[0]; C.y = p[1]; C.psi = Math.atan2(p[5], p[4]); C.u = v || 0; C.v = 0; C.r = 0; C.delta = 0; C.rev = false; C.revT = 0;
  C.z = C.zs = C.zv = trSurf(p[2], p[3], p[0], p[1]); C.kind = 'track'; C.pitch = 0; C.roll = 0; C.pitchS = C.rollS = C.dzv = C.dive = C.lean = 0; C.gear = 1; C.rpm = PH.rpmIdle;
}
const TMPA = [0, 0, 0, 0, 0, 0];
function raceStart(){
  if (!trackInit()) return false;
  dmgRepair(); trafficSuspend(true);
  const L = TR.L;
  const g = gridPos(MPN.race ? clamp(MPN.race.slot | 0, 0, 21) : PSLOT); placePlayerOnTrack(g[0], g[1], 0); if (MPN.race){ AI.length = 0; MPN.sep.clear(); }
  Object.assign(RACE, {state:'grid', t:0, lights:0, goT:0, hold:0.5 + Math.random()*1.8, laps:F1.laps, lap:0, lapBase:0, sec:0, secs:[0, 0, 0], bestSec:[1e9, 1e9, 1e9], last:0, best:0, inv:false, offT:0, wrongT:0, fin:null, order:[], fastest:1e9});
  RACE.rel = (((g[0] - TR.sStart) % L) + L) % L; RACE.prog = RACE.rel - L;
  if (MPN.race){ RACE.hold = Math.max(0, (MPN.race.goAt - MPN.race.lightsAt)/1000 - 5.6); RACE.laps = F1.laps; RACE.t = (performance.now() - MPN.race.lightsAt)/1000; }
  let k = 1; const rr = mulberry32(2026 + (Date.now() & 1023));
  for (const a of AI){ if (k === PSLOT) k++; const gp = gridPos(k++); a.s = gp[0]; a.d = gp[1]; a.lastD = gp[1]; a.v = 0; a.ot = 0; a.otT = 0; a.push = 0; a.rel = (((a.s - TR.sStart) % L) + L) % L; a.prog = a.rel - L; a.fin = null; a.lap = 0; a.lapT0 = 0; a.best = 0;
    a.skill = 0.94 + rr()*0.06; }
  hudRaceReset();
  return true;
}
function raceTick(dt){
  const R = RACE, L = TR.L, C = CAR; if (MPN.race) R.t = (performance.now() - MPN.race.lightsAt)/1000; else R.t += dt;
  if (R.state === 'grid'){
    R.lights = Math.min(5, Math.floor(R.t - 0.6));
    if (R.t >= 5.6 + R.hold){ R.state = 'race'; R.goT = MPN.race ? 5.6 + R.hold : R.t; R.lights = 0; R.lapT0 = R.goT; R.secT0 = R.goT; R.lapBase = 0; R.sec = 0; R.lap = 1; flash('出发！ GO!', 1.2, 'go');
      for (const a of AI){ a.lapT0 = R.t; a.lap = 1; } }
    return;
  }
  const p = trProj(C.x, C.y, TPJ2); if (!p) return;
  let rel = (((p.s - TR.sStart) % L) + L) % L, dd = rel - R.rel; if (dd < -L/2) dd += L; if (dd > L/2) dd -= L; R.prog += dd; R.rel = rel;
  if (R.state === 'race'){
    while (R.prog >= R.lapBase + L*(R.sec + 1)/3){
      const st = R.t - R.secT0; R.secs[R.sec] = st; R.secT0 = R.t;
      if (st < R.bestSec[R.sec]) R.bestSec[R.sec] = st;
      if (R.sec === 2){
        const lt = R.t - R.lapT0; R.last = lt; R.lapT0 = R.t; R.lapBase += L; R.sec = 0;
        if (!R.inv && (!R.best || lt < R.best)) R.best = lt;
        const fastest = !R.inv && lt < R.fastest; if (fastest) R.fastest = lt;
        if (MPN.race && MPN.onLap){ try { MPN.onLap({lap:R.lap, rt:R.t - R.goT, lt, inv:R.inv}); } catch (e){ console.warn('[f1d/mp] onLap', e); } }
        if (R.lap >= R.laps){ R.state = 'done'; R.fin = R.t - R.goT; R.showRes = true; break; }
        R.lap++; R.inv = false;
        flash(`第 ${R.lap} 圈 · Lap ${R.lap}/${R.laps} · ${fmtT(lt)}${fastest ? ' · 最快圈 Fastest lap' : ''}`, 2.2, fastest ? 'purple' : '');
        hudSecsReset();
      } else R.sec++;
    }
    // track limits: all four wheels beyond the white line
    if (Math.abs(p.d) > (TR.hl ? (p.d > 0 ? TR.hl[p.i] : TR.hr[p.i]) + 1.05 : 8.05)){ R.offT += dt; if (R.offT > 0.25 && !R.inv){ R.inv = true; flash('赛道界限 · 本圈不计成绩 · Track limits — lap time deleted', 2.4, 'warn'); } } else R.offT = 0;
    const fw = Math.cos(C.psi)*TR.DX[p.i] + Math.sin(C.psi)*TR.DY[p.i];
    if (fw < -0.3 && Math.abs(C.u) > 3){ R.wrongT += dt; if (R.wrongT > 1.2 && R.wrongT - dt <= 1.2) flash('逆行 · Wrong way', 2, 'warn'); } else R.wrongT = 0;
  }
  // standings: finished cars by finish time, the rest by progress
  const ent = [{car:0, prog:R.prog, fin:R.fin}]; for (const a of AI) ent.push({car:a.car, prog:a.prog, fin:a.fin});
  ent.sort((a, b) => (a.fin !== null && b.fin !== null) ? a.fin - b.fin : a.fin !== null ? -1 : b.fin !== null ? 1 : b.prog - a.prog);
  R.order = ent;
  if (R.showRes){ R.showRes = false; raceFinish(); }
}
function raceFinish(){
  if (MPN.race){ flash(`完赛 · Finished · ${fmtT(RACE.fin)}`, 3, 'go'); if (MPN.onFinish){ try { MPN.onFinish({rt:RACE.fin, best:RACE.best}); } catch (e){ console.warn('[f1d/mp] onFinish', e); } } return; }
  const pos = RACE.order.findIndex(e => e.car === 0) + 1;
  flash(`完赛 · Finished · P${Math.max(1, pos)}`, 3, 'go'); showResults();
}
const fmtT = t => { if (!t || !isFinite(t)) return '–:––.–––'; const m = Math.floor(t/60), s = t - m*60; return `${m}:${s < 10 ? '0' : ''}${s.toFixed(3)}`; };

/* ================= AI cars: a racing line, a speed profile, gaps and overtakes ================= */
function aiInit(){
  AI.length = 0; if (!TR || MPN.race) return;
  const rr = mulberry32(1965);
  for (let k = 1; k < NC; k++) AI.push({car:k, s:TR.sStart + 30 + (k - 1)*TR.L/10 + rr()*40, d:0, v:40, prog:0, rel:0, skill:0.94 + rr()*0.06, ot:0, otD:0, otT:0, push:0, fin:null, lap:0, lapT0:0, best:0,
    x:0, y:0, z:0, psi:0, pitch:0, wspin:0, steer:0, lastD:0});
}
const aiAcc = v => Math.min(10.5, Math.max(0.4, (PH.P/Math.max(v, 6) - 0.5*PH.rho*PH.CdA*v*v)/PH.m));
function aiTick(dt){
  if (!TR || !AI.length || !(dt > 0)) return; dt = Math.min(dt, 0.1);
  const L = TR.L, race = F1.on && F1.mode === 'race', go = !race || RACE.state !== 'grid', pace = race ? 1 : 0.84;
  // the player, when on or next to the circuit, is one of the cars the AI sees
  let ps = null; if (F1.on){ const p = trProj(CAR.x, CAR.y, TPJ2); if (p && Math.abs(p.d) < 11 && Math.abs(CAR.z - trSurf(p.i, p.t, CAR.x, CAR.y)) < 2) ps = {s:p.s, d:p.d, v:Math.max(0, CAR.u*(Math.cos(CAR.psi)*TR.DX[p.i] + Math.sin(CAR.psi)*TR.DY[p.i]))}; }
  for (const a of AI){
    trAt(a.s, a.d, TMPA); const i = TMPA[2];
    if (!go){ a.v = 0; a.lastD = a.d; aiPose(a, dt); continue; }
    let vt = TR.vmax[i]*a.skill*pace, gap = 1e9, ov = 0, od = 0; a.push = 0;
    const see = o => { let ds = (((o.s - a.s) % L) + L) % L; if (ds > L/2) ds -= L; const dl = o.d - a.d;
      if (ds > 0 && ds < 70 && Math.abs(dl) < 2.3 && ds < gap){ gap = ds; ov = o.v; od = o.d; }
      if (Math.abs(ds) < 6.2 && Math.abs(dl) < 2.4) a.push = dl > 0 ? -1 : 1; };
    for (const o of AI) if (o !== a) see(o);
    if (ps) see(ps);
    if (gap < 70){ const safe = 7 + a.v*0.16; vt = Math.min(vt, ov + (gap - safe)*0.9);
      if (!a.ot && ((TR.straight[i] && gap < 45 && TR.vmax[i]*a.skill*pace > ov + 2) || (gap < 16 && ov < 6))){ const c1 = od + 3.6, c2 = od - 3.6, hiL = Math.min(5.6, TR.LL[i]), hiR = Math.min(5.6, TR.LR[i]); const ok1 = c1 <= hiL && c1 >= -hiR, ok2 = c2 <= hiL && c2 >= -hiR;
        if (ok1 || ok2){ a.ot = 1; a.otD = ok1 && (!ok2 || Math.abs(c1 - a.d) < Math.abs(c2 - a.d)) ? c1 : c2; a.otT = 5; } } }
    a.otT -= dt; if (a.otT <= 0) a.ot = 0;
    let dT = a.ot ? a.otD : TR.off[i]; if (a.push) dT = clamp(a.d + a.push*1.8, -Math.min(5.6, TR.LR[i]), Math.min(5.6, TR.LL[i]));
    dT = clamp(dT, -TR.LR[i], TR.LL[i]);
    a.lastD = a.d; a.d += clamp(dT - a.d, -1.2, 1.2)*Math.min(1, dt*(0.7 + a.v/45)); a.d = clamp(a.d, -TR.LR[i] - 0.25, TR.LL[i] + 0.25);
    vt = Math.max(0, vt);
    if (vt > a.v) a.v = Math.min(vt, a.v + aiAcc(a.v)*dt); else a.v = Math.max(vt, a.v - 40*dt);
    a.s += a.v*dt;
    if (race && RACE.state !== 'grid'){ a.prog += a.v*dt;
      if (a.prog >= a.lap*L && a.lap >= 1){ const lt = RACE.t - a.lapT0; a.lapT0 = RACE.t; if (!a.best || lt < a.best) a.best = lt; if (lt < RACE.fastest) RACE.fastest = lt;
        if (a.lap >= RACE.laps && a.fin === null) a.fin = RACE.t - RACE.goT; a.lap++; } }
    if (a.s > 1e7) a.s -= Math.floor(a.s/L)*L;
    aiPose(a, dt);
  }
}
function aiPose(a, dt){
  const p = trAt(a.s, a.d, TMPA), i = p[2], t = p[3];
  const lat = dt > 0 && a.v > 1 ? Math.atan2((a.d - a.lastD)/dt, a.v) : 0;
  a.x = p[0]; a.y = p[1]; a.psi = Math.atan2(p[5], p[4]) + clamp(lat, -0.25, 0.25); a.z = trSurf(i, t, a.x, a.y);
  const ds = TR.F.cum[i + 1] - TR.F.cum[i]; a.pitch = (TR.deck[i] && TR.deck[i + 1]) ? Math.atan2(TR.F.y[i + 1] - TR.F.y[i], ds || 1) : 0;
  a.wspin = (a.wspin + a.v*dt/0.36) % (TAU*1000);
  const k = TR.kap[i]*Math.sign((TR.DX[i]*TR.DY[TR.wrap(i + 2)] - TR.DY[i]*TR.DX[TR.wrap(i + 2)]) || 1); a.steer = clamp(k*3.6*4, -1, 1)*0.6;
}

// the nearest drivable road to (x, y) (public roads first, the height zp when given), facing along dir; two-way roads: the left lane
function spawnFree(x, y, dir, zp){
  riCoarse();
  const G = RI.G, NB = RI.NB, seen = new Set(), Ls = SGR.lines; let best = null, bs = 1e18;
  const bx0 = Math.floor((x + HALF)/G), by0 = Math.floor((y + HALF)/G);
  for (let ring = 0; ring <= 3 && (!best || ring <= 1); ring++) for (let by = by0 - ring; by <= by0 + ring; by++) for (let bx = bx0 - ring; bx <= bx0 + ring; bx++){
    if (Math.max(Math.abs(bx - bx0), Math.abs(by - by0)) !== ring || bx < 0 || by < 0 || bx >= NB || by >= NB) continue;
    const list = RI.coarse.get(by*NB + bx); if (!list) continue;
    for (const li of list){ if (seen.has(li)) continue; seen.add(li); const l = Ls[li]; if (l.c > 11 || (l.flags & 8)) continue; const P = l.P;
      for (let k = 0; k + 3 < P.length; k += 2){ const ax = P[k], ay = P[k + 1], dx = P[k + 2] - ax, dy = P[k + 3] - ay, l2 = dx*dx + dy*dy; if (l2 < 4) continue;
        const t = clamp(((x - ax)*dx + (y - ay)*dy)/l2, 0.05, 0.95), px = ax + dx*t, py = ay + dy*t, d = Math.hypot(px - x, py - y);
        const e = l.E ? l.E[k >> 1] + (l.E[(k >> 1) + 1] - l.E[k >> 1])*t : 0;
        let sc = d + (l.c === 11 ? 90 : l.c === 10 ? 12 : 0) + ((l.flags & 16) || (l.c & 1) ? 6 : 0) + (zp !== undefined ? Math.abs(gnd(px, py) + e - zp)*6 : (e > 0.5 ? 25 : 0));
        if (sc < bs){ bs = sc; best = {l, li, k, t, px, py, dx, dy, l2}; } } }
  }
  if (!best) return false;
  const l = best.l, L = Math.sqrt(best.l2); let ux = best.dx/L, uy = best.dy/L;
  const ow = (l.flags & 1) !== 0; if (!ow && dir && ux*dir[0] + uy*dir[1] < 0){ ux = -ux; uy = -uy; }
  const hw = RD_WID[l.c][ow ? 1 : 0]/2, off = ow ? Math.min(1.8, hw*0.3) : hw*0.5, sx = best.px - uy*off, sy = best.py + ux*off;   // keep left
  const C = CAR; C.x = sx; C.y = sy; C.psi = Math.atan2(uy, ux); C.u = 0; C.v = 0; C.r = 0; C.delta = 0; C.rev = false; C.revT = 0; C.gear = 1; C.pitch = 0; C.roll = 0; C.pitchS = C.rollS = C.dzv = C.dive = C.lean = 0;
  const n = roadCands(sx, sy); let z = gnd(sx, sy), bz = 1e9;
  for (let q = 0; q < n; q++){ if (RC[q].li === best.li){ z = RC[q].z; break; } const e2 = Math.abs(RC[q].z - (zp !== undefined ? zp : z)); if (e2 < bz){ bz = e2; z = RC[q].z; } }
  // roadDrive: index the tiles around the spawn point now and stand on the drawn surface
  if (typeof SGRoads !== 'undefined' && SGRoads.surfaceAt){ if (SGRoads.surfacePrefetch) SGRoads.surfacePrefetch(sx, sy, 300); const r = SGRoads.surfaceAt(sx, sy, z); if (r && Math.abs(r.z - z) < 1.5) z = r.z; }
  C.z = C.zs = C.zv = z; C.kind = 'road'; C.c = l.c; C.li = best.li; C.rdx = ux; C.rdy = uy;
  BI.clear(); biPrefetch(C.x, C.y);
  return true;
}

/* ================= meshes: 11 bodies + 44 wheels (instanced), rain lights; the cockpit overlay scene ================= */
const U = {amb:{value:0.05}, sky:{value:new THREE.Color(0.6, 0.7, 0.8)}, glow:{value:0.6}};
const matF1Car = new THREE.MeshPhongMaterial({vertexColors:true, shininess:70, specular:new THREE.Color(0.34, 0.34, 0.34)});
matF1Car.onBeforeCompile = sh => {
  Object.assign(sh.uniforms, {uAmb:U.amb, uSky:U.sky, uGlow:U.glow});
  sh.vertexShader = sh.vertexShader
    .replace('#include <common>', '#include <common>\nattribute float slot;\nattribute float gl;\nattribute vec3 iC1;\nattribute vec3 iC2;\nattribute vec3 iC3;\nvarying float vGl;')
    .replace('#include <color_vertex>', 'vColor = color;\nif (slot > 0.5) vColor = slot < 1.5 ? iC1 : (slot < 2.5 ? iC2 : iC3);\nvGl = gl;');
  sh.fragmentShader = sh.fragmentShader
    .replace('#include <common>', '#include <common>\nuniform float uAmb;\nuniform vec3 uSky;\nuniform float uGlow;\nvarying float vGl;')
    .replace('#include <aomap_fragment>', 'reflectedLight.directSpecular *= min(vGl, 1.0);\n#include <aomap_fragment>')
    .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n{ float fr = pow(1.0 - clamp(abs(dot(normalize(vViewPosition), normal)), 0.0, 1.0), 3.0);\n  totalEmissiveRadiance += uSky * fr * 0.3 * min(vGl, 1.0) + diffuseColor.rgb * uAmb;\n  if (vGl > 1.5) totalEmissiveRadiance += diffuseColor.rgb * uGlow; }');
};
const matF1Rain = new THREE.PointsMaterial({size:1.1, map:lampTex, color:0xff2814, transparent:true, opacity:0, depthWrite:false, blending:THREE.AdditiveBlending, sizeAttenuation:true});
const M = {body:null, wheel:null, rain:null, G:null, tris:0};
const OV = {scene:null, cam:null, hemi:null, sun:null, body:null, bodyH:null, wheel:null, steer:null};
function instColors(geo, n, f){
  for (const k of ['iC1', 'iC2', 'iC3']) geo.setAttribute(k, new THREE.InstancedBufferAttribute(new Float32Array(n*3), 3));
  for (let i = 0; i < n; i++){ const c = f(i); geo.attributes.iC1.setXYZ(i, c[0][0], c[0][1], c[0][2]); geo.attributes.iC2.setXYZ(i, c[1][0], c[1][1], c[1][2]); geo.attributes.iC3.setXYZ(i, c[2][0], c[2][1], c[2][2]); }
}
function ensureMeshes(){
  if (F1.built) return; F1.built = true;
  const G = M.G = F1GEO.build();
  instColors(G.body, NC, i => [LIV[i].p, LIV[i].s, LIV[i].a]);
  instColors(G.wheel, NC*4, i => [TYRE[CAR_TYRE[i >> 2]], LIV[i >> 2].s, LIV[i >> 2].a]);
  instColors(G.steer, 1, () => [LIV[0].p, LIV[0].s, LIV[0].a]);
  M.body = new THREE.InstancedMesh(G.body, matF1Car, NC); M.wheel = new THREE.InstancedMesh(G.wheel, matF1Car, NC*4);
  for (const m of [M.body, M.wheel]){ m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.frustumCulled = false; m.castShadow = true; m.receiveShadow = true; m.name = 'f1d'; m.visible = false; scene.add(m); }
  const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(NC*3), 3));
  M.rain = new THREE.Points(rg, matF1Rain); M.rain.frustumCulled = false; M.rain.renderOrder = 5; M.rain.visible = false; scene.add(M.rain);
  M.tris = (G.body.index.count/3)*NC + (G.wheel.index.count/3)*NC*4;
  // the overlay: the player's car again (no helmet in the cockpit view), its wheels and the steering wheel, near plane 3 cm
  const gNH = new THREE.BufferGeometry(); for (const k in G.body.attributes) gNH.setAttribute(k, G.body.attributes[k]); gNH.setIndex(G.body.index); gNH.setDrawRange(0, G.nNoHelmet);
  OV.scene = new THREE.Scene(); OV.cam = new THREE.PerspectiveCamera(70, 1, 0.03, 60);
  OV.hemi = new THREE.HemisphereLight(0xffffff, 0x888888, 0.7); OV.sun = new THREE.DirectionalLight(0xffffff, 0.7); OV.scene.add(OV.hemi, OV.sun, OV.sun.target);
  OV.body = new THREE.InstancedMesh(gNH, matF1Car, 1); OV.bodyH = new THREE.InstancedMesh(G.body, matF1Car, 1); OV.wheel = new THREE.InstancedMesh(G.wheel, matF1Car, 4); OV.steer = new THREE.InstancedMesh(G.steer, matF1Car, 1);
  for (const m of [OV.body, OV.bodyH, OV.wheel, OV.steer]){ m.frustumCulled = false; OV.scene.add(m); }
}
const _mc = new THREE.Matrix4(), _ml = new THREE.Matrix4(), _mw = new THREE.Matrix4(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _e = new THREE.Euler(0, 0, 0, 'YZX'),
      _p = new THREE.Vector3(), _s = new THREE.Vector3(1, 1, 1), _v = new THREE.Vector3(), _v2 = new THREE.Vector3(), _ZERO = new THREE.Matrix4().makeScale(0, 0, 0), _UP = new THREE.Vector3(0, 1, 0);
const _mc2 = new THREE.Matrix4(), carZ = C => C.zv === undefined || !isFinite(C.zv) ? C.z : C.zv;
function carMat(out, x, y, z, psi, pitch, roll){ _e.set(roll, psi, pitch, 'YZX'); _q.setFromEuler(_e); _p.set(x, z, -y); _s.set(1, 1, 1); return out.compose(_p, _q, _s); }
const WPOS = [[1.66, 0.36, -0.80, 0.753, 1], [1.66, 0.36, 0.80, 0.753, 1], [-1.94, 0.36, -0.78, 1, 0], [-1.94, 0.36, 0.78, 1, 0]];
function wheelMat(out, carM, k, steer, spin, WP){
  const w = (WP || WPOS)[k], left = w[2] < 0;
  _e.set(0, (w[4] ? steer : 0) + (left ? PI : 0), left ? spin : -spin, 'YZX'); _q.setFromEuler(_e); _p.set(w[0], w[1], w[2]); _s.set(1, 1, w[3]);
  _ml.compose(_p, _q, _s); return out.multiplyMatrices(carM, _ml);
}
function steerMat(out, carM, a){ _e.set(-a, 0, 0.36, 'ZXY'); _q.setFromEuler(_e); _p.set(0.19, 0.645, 0); _s.set(1, 1, 1); _ml.compose(_p, _q, _s); return out.multiplyMatrices(carM, _ml); }
let meshVis = false;
function updateMeshes(){
  if (!M.body) return;
  let show = !!TR && moverGroup.visible;
  if (show && !F1.on){ const c = camera.position, dx = Math.max(0, Math.abs(c.x - TR.cx) - (TR.bb[2] - TR.bb[0])/2), dz = Math.max(0, Math.abs(-c.z - TR.cy) - (TR.bb[3] - TR.bb[1])/2); show = Math.hypot(dx, dz, c.y) < 6500; }
  if (F1.on) show = true;
  if (F1.hide || (F1.on && F1.veh === 'car')) show = false;
  meshVis = show; M.body.visible = M.wheel.visible = show; M.rain.visible = show && nightF > 0.12; if (!show) return;
  const rp = M.rain.geometry.attributes.position.array;
  if (F1.on){ const C = CAR; carMat(_mc, C.x, C.y, carZ(C), C.psi, C.pitch, C.roll); M.body.setMatrixAt(0, DMG.f1m ? _ZERO : _mc);
    carMat(_mc2, C.x, C.y, carZ(C), C.psi, C.pitchS === undefined ? C.pitch : C.pitchS, C.rollS === undefined ? C.roll : C.rollS);
    for (let k = 0; k < 4; k++) M.wheel.setMatrixAt(k, wheelMat(_mw, _mc2, k, C.delta, C.wspin));
    _v.set(-2.52, 0.29, 0).applyMatrix4(_mc); rp[0] = _v.x; rp[1] = _v.y; rp[2] = _v.z; }
  else { M.body.setMatrixAt(0, _ZERO); for (let k = 0; k < 4; k++) M.wheel.setMatrixAt(k, _ZERO); rp[0] = rp[1] = rp[2] = -1e5; }
  for (let i = 1; i < NC; i++){ const a = AI[i - 1];
    if (!a){ M.body.setMatrixAt(i, _ZERO); for (let k = 0; k < 4; k++) M.wheel.setMatrixAt(i*4 + k, _ZERO); continue; }
    carMat(_mc, a.x, a.y, a.z, a.psi, a.pitch, 0); M.body.setMatrixAt(i, _mc);
    for (let k = 0; k < 4; k++) M.wheel.setMatrixAt(i*4 + k, wheelMat(_mw, _mc, k, a.steer*0.25, a.wspin));
    _v.set(-2.52, 0.29, 0).applyMatrix4(_mc); rp[i*3] = _v.x; rp[i*3 + 1] = _v.y; rp[i*3 + 2] = _v.z; }
  M.body.instanceMatrix.needsUpdate = true; M.wheel.instanceMatrix.needsUpdate = true; M.rain.geometry.attributes.position.needsUpdate = true;
  matF1Rain.opacity = sstep(0.1, 0.6, nightF)*0.95; matF1Rain.size = 1.1;
  U.amb.value = 0.04 + nightF*0.26; U.glow.value = 0.5 + nightF*1.6; U.sky.value.copy(scene.background).multiplyScalar(0.55 + 0.45*(1 - nightF));
}

/* ================= cameras ================= */
const CAMN = [['驾驶舱', 'Cockpit'], ['T 型摄像头', 'T-cam'], ['追尾', 'Chase'], ['环绕', 'Orbit'], ['威胁追踪', 'Threat'], ['保险杠', 'Bumper'], ['侧面跟拍', 'Side']];
const CV = {pos:new THREE.Vector3(), q:new THREE.Quaternion(), fov:70, near:1, cpsi:0, t:1, dur:1.4, from:new THREE.Vector3(), fromQ:new THREE.Quaternion(), az:200, el:12, d:9, shake:0, chD:7};
const _mlook = new THREE.Matrix4();
function nextCam(dir){ if (CV.t < 1 && F1.veh !== 'car') CV.t = 1; dcCycle(dir || 1); }   // [lm28/drivecam] the new cameras join the cycle
function hfovToV(h){ const a = Math.max(0.3, camera.aspect || (innerWidth/innerHeight)); return clamp(2*Math.atan(Math.tan(h*PI/360)/a)*180/PI, 46, 92); }
function camStep(dt){
  // [lm28/drivecam] the threat camera without a creature is the chase camera
  const t0 = performance.now(), cam0 = F1.cam, K = dcKai(); if (cam0 === 4 && !K.on) F1.cam = F1.veh === 'car' ? 0 : 2;
  try { camStep0(dt); } finally { F1.cam = cam0; DC.ms = DC.ms*0.95 + (performance.now() - t0)*0.05; }
}
function camStep0(dt){
  if (F1.veh === 'car'){ rcCam(dt); return; }
  const C = CAR, kmh = Math.abs(C.u)*3.6;
  carMat(_mc, C.x, C.y, carZ(C), C.psi, C.pitch, C.roll); _q2.setFromRotationMatrix(_mc);
  let near = 0.75, fov;
  if (F1.cam === 0 || F1.cam === 1){
    const ck = F1.cam === 0;
    _v.set(ck ? -0.29 : -1.18, ck ? 0.865 : 1.43, 0).applyMatrix4(_mc); CV.pos.copy(_v);
    _e.set(ck ? -0.04 : -0.15, -PI/2, 0, 'YXZ'); _q.setFromEuler(_e); CV.q.copy(_q2).multiply(_q);
    CV.shake = 0;   // [lm28/drivecam] the vibration and the impact shake: smooth and capped (dcPost)
    fov = hfovToV((ck ? 96 : 84) + 6*Math.min(1, kmh/320)); near = ck ? 0.75 : 0.9;
  } else if (F1.cam === 2){
    const cs = Math.cos(C.psi), sn = Math.sin(C.psi), vx = C.u*cs - C.v*sn, vy = C.u*sn + C.v*cs, vh = Math.atan2(vy, vx);
    const tgt = C.u > 3 ? C.psi + 0.55*wrapA(vh - C.psi) : C.psi;
    CV.cpsi += wrapA(tgt - CV.cpsi)*Math.min(1, dt*4.2);
    let d = 6.6 + Math.min(1.6, kmh*0.005); const h = 1.95 + Math.min(0.5, kmh*0.0015);
    const ex = C.x - Math.cos(CV.cpsi)*d, ey = C.y - Math.sin(CV.cpsi)*d;
    if (F1.mode !== 'race'){ const f = biRay(C.x, C.y, ex, ey, C.z, C.z + h + 1); if (f < 1) d = Math.max(2.4, f*d - 0.7); }
    CV.chD += (d - CV.chD)*Math.min(1, dt*(d < CV.chD ? 12 : 2));
    const cx = C.x - Math.cos(CV.cpsi)*CV.chD, cy = C.y - Math.sin(CV.cpsi)*CV.chD;
    // a car right behind ours would fill the screen: rise above it
    let lift = 0; for (const a of AI){ const dx = a.x - cx, dy = a.y - cy; if (dx*dx + dy*dy < 16 && Math.abs(a.z - C.z) < 2) lift = 1.6; }
    CV.lift = (CV.lift || 0) + (lift - (CV.lift || 0))*Math.min(1, dt*5);
    const cz = Math.max(C.z + h + CV.lift, gnd(cx, cy) + 0.7);
    CV.pos.set(cx, cz, -cy); _v.set(C.x + Math.cos(CV.cpsi)*5, C.z + 0.85, -(C.y + Math.sin(CV.cpsi)*5));
    _mlook.lookAt(CV.pos, _v, _UP); CV.q.setFromRotationMatrix(_mlook);
    fov = hfovToV(78 + 8*Math.min(1, kmh/320)); near = 1.0;
  } else if (F1.cam >= 4 && dcCam(dt)){ fov = DCR.fov; near = DCR.near;   // [lm28/drivecam] threat, bumper, side
  } else {
    const a = (CV.az*PI/180) + C.psi + PI, e = CV.el*PI/180;
    CV.pos.set(C.x + Math.cos(a)*Math.cos(e)*CV.d, C.z + 0.5 + Math.sin(e)*CV.d, -(C.y + Math.sin(a)*Math.cos(e)*CV.d)); _v.set(C.x, C.z + 0.5, -C.y);
    _mlook.lookAt(CV.pos, _v, _UP); CV.q.setFromRotationMatrix(_mlook); fov = 34; near = 0.5;
  }
  { const r = dcPost(dt, fov, near); fov = r.fov; near = r.near; }   // [lm28/drivecam] look back, blends, FOV, dolly-zoom, shake
  CV.fov = fov; CV.near = near;
  // entering: fly from the orbit view into the car
  if (CV.t < 1){ CV.t = Math.min(1, CV.t + dt/CV.dur); const k = CV.t < 0.5 ? 2*CV.t*CV.t : 1 - Math.pow(-2*CV.t + 2, 2)/2;
    camera.position.lerpVectors(CV.from, CV.pos, k); camera.quaternion.copy(CV.fromQ).slerp(CV.q, k); camera.fov = lerp(F1.saved ? F1.saved.fov : 38, fov, k); }
  else { camera.position.copy(CV.pos); camera.quaternion.copy(CV.q); camera.fov = fov; }
  applyCam();
  // the orbit pivot rides along (tile streaming order, shadows): 30 m ahead of the car
  controls.target.set(C.x + Math.cos(C.psi)*30, C.z, -(C.y + Math.sin(C.psi)*30));
}
function applyCam(){ camera.near = CV.t < 1 ? Math.max(CV.near, 1) : CV.near; camera.far = 70000; camera.updateProjectionMatrix(); camera.updateMatrixWorld(); }
HOOKS.prerender.push(() => {
  // the circuit's night glow strip floats 0.3 m above the asphalt: keep it faint while our cars drive through it
  if (meshVis && typeof matF1Glow !== 'undefined') matF1Glow.opacity *= F1.on ? 0.25 : 0.5;
  if (!F1.on) return; if (CV.t >= 1){ camera.position.copy(CV.pos); camera.quaternion.copy(CV.q); camera.fov = CV.fov; } applyCam(); });
// the cockpit pass: the player's car close to the eye, in a frame centred on the camera (no float jitter), its own near plane
HOOKS.render.push(() => {
  if (F1.on) dcRender();   // [lm28/drivecam] the rear view (mirrors, picture-in-picture)
  if (F1.on && F1.veh === 'car' && OV.scene && CV.t >= 0.85){ rcOverlay(); dcPip(); return; }
  const ovF = dcOvF1(); if (!F1.on || !OV.scene || ovF < 0 || CV.t < 0.85){ if (F1.on) dcPip(); return; }
  const C = CAR, cp = camera.position, ck = ovF === 0;
  carMat(_mc, C.x, C.y, carZ(C), C.psi, C.pitch, C.roll); _mc.elements[12] -= cp.x; _mc.elements[13] -= cp.y; _mc.elements[14] -= cp.z;
  OV.body.visible = ck; OV.bodyH.visible = !ck; (ck ? OV.body : OV.bodyH).setMatrixAt(0, _mc); (ck ? OV.body : OV.bodyH).instanceMatrix.needsUpdate = true;
  carMat(_mc2, C.x, C.y, carZ(C), C.psi, C.pitchS === undefined ? C.pitch : C.pitchS, C.rollS === undefined ? C.roll : C.rollS); _mc2.elements[12] -= cp.x; _mc2.elements[13] -= cp.y; _mc2.elements[14] -= cp.z;
  for (let k = 0; k < 4; k++) OV.wheel.setMatrixAt(k, wheelMat(_mw, _mc2, k, C.delta, C.wspin)); OV.wheel.instanceMatrix.needsUpdate = true;
  OV.steer.visible = ck; if (ck){ OV.steer.setMatrixAt(0, steerMat(_mw, _mc, C.delta*3.4)); OV.steer.instanceMatrix.needsUpdate = true; }
  OV.cam.position.set(0, 0, 0); OV.cam.quaternion.copy(camera.quaternion); OV.cam.fov = camera.fov; OV.cam.aspect = camera.aspect; OV.cam.near = 0.03; OV.cam.far = 60; OV.cam.updateProjectionMatrix(); OV.cam.updateMatrixWorld();
  OV.hemi.color.copy(hemi.color); OV.hemi.groundColor.copy(hemi.groundColor); OV.hemi.intensity = hemi.intensity; OV.sun.color.copy(sun.color); OV.sun.intensity = sun.intensity*0.92;
  OV.sun.position.copy(sun.position).sub(sun.target.position); OV.sun.target.position.set(0, 0, 0); OV.sun.target.updateMatrixWorld();
  dcMirF1(_mc, ck);
  const ac = renderer.autoClear, ar = renderer.info.autoReset; renderer.autoClear = false; renderer.info.autoReset = false;
  renderer.clearDepth(); renderer.render(OV.scene, OV.cam); renderer.autoClear = ac; renderer.info.autoReset = ar;
  if (OV.mirF1) OV.mirF1.visible = false; dcPip();
});

/* ================= engine sound (Web Audio, synthesised: a V6 firing note, a sub-harmonic and a little noise; toggle with the button or M) ================= */
const AUD = {ctx:null, on:true, g:null, f:null, o:[], ng:null};
// [lm20/audio] when the app's sound system (window.SGAudio) is present it plays the F1 sounds: this engine stands down and the
// 声音 button / M key switch the sound system's F1 group (f1Ext returns its state)
const audExt = () => (window.SGAudio && window.SGAudio.f1Ext) ? window.SGAudio : null;
function audStart(){
  { const X = audExt(); if (X){ X.f1Ext(AUD.on, false); return; } }
  if (AUD.ctx || !AUD.on) { if (AUD.ctx && AUD.ctx.state === 'suspended' && AUD.on) AUD.ctx.resume().catch(() => {}); return; }
  try {
    const A = window.AudioContext || window.webkitAudioContext; if (!A) return; const c = AUD.ctx = new A();
    const g = AUD.g = c.createGain(); g.gain.value = 0; g.connect(c.destination);
    const f = AUD.f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1500; f.Q.value = 1.6; f.connect(g);
    const mk = (type, gain) => { const o = c.createOscillator(), og = c.createGain(); o.type = type; og.gain.value = gain; o.connect(og); og.connect(f); o.start(); AUD.o.push(o); return o; };
    mk('sawtooth', 0.55); mk('sawtooth', 0.35); mk('square', 0.22);
    const nb = c.createBuffer(1, c.sampleRate, c.sampleRate), d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random()*2 - 1;
    const ns = c.createBufferSource(); ns.buffer = nb; ns.loop = true; const nf = c.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = 2400; nf.Q.value = 0.7;
    const ng = AUD.ng = c.createGain(); ng.gain.value = 0; ns.connect(nf); nf.connect(ng); ng.connect(g); ns.start();
  } catch (e){ AUD.ctx = null; }
}
function audTick(){
  const c = AUD.ctx; if (!c || audExt()) return; const t = c.currentTime, C = CAR, live = F1.on && AUD.on && !(HUD.el && HUD.el.hidden);
  const fr = Math.max(60, C.rpm/60*3);
  AUD.o[0].frequency.setTargetAtTime(fr, t, 0.025); AUD.o[1].frequency.setTargetAtTime(fr*1.007, t, 0.025); AUD.o[2].frequency.setTargetAtTime(fr*0.5, t, 0.025);
  AUD.f.frequency.setTargetAtTime(700 + C.thr*2300 + C.rpm*0.08, t, 0.05);
  AUD.g.gain.setTargetAtTime(live ? 0.028 + 0.05*C.thr + 0.012*Math.min(1, Math.abs(C.u)/80) : 0, t, live ? 0.06 : 0.15);
  AUD.ng.gain.setTargetAtTime(live ? Math.min(0.05, Math.abs(C.u)/90*0.05) : 0, t, 0.1);
}
function audToggle(v){ const X = audExt(); if (X){ AUD.on = X.f1Ext(v === undefined ? null : !!v, true); } else { AUD.on = v === undefined ? !AUD.on : !!v; if (AUD.on) audStart(); } if (AUD.ctx && !X){ if (AUD.on) AUD.ctx.resume().catch(() => {}); else AUD.g.gain.setTargetAtTime(0, AUD.ctx.currentTime, 0.05); }
  const b = document.getElementById('f1SndB'); if (b){ b.querySelector('b').textContent = AUD.on ? '声音 开' : '声音 关'; b.setAttribute('aria-pressed', String(AUD.on)); } }

/* ================= [lm22/svdrive] the road car in the world: meshes, lamps, light pool, start places, cameras ================= */
const RC_CIRC = [1.55, 0, -1.55], RC_CR = 0.97, RC_BODYC = [2.05, 0.8, 1.0, 0.96, 0, 0.97, -1.0, 0.97, -2.05, 0.85];
const RC_LANES = [[6, 3], [2, 2], [6, 3], [1, 1], [4, 3], [1, 1], [4, 2], [1, 1], [2, 2], [1, 1], [2, 1], [0, 0]];
// US speed limits (mph) from the road class: freeway, ramp, expressway, ramp, major arterial, ramp, arterial, ramp, collector, ramp, local, service
const RC_LIMIT = [65, 45, 50, 35, 40, 30, 35, 25, 30, 25, 25, 15];
const RC_CAMN = [['追尾', 'Chase'], ['引擎盖', 'Bonnet'], ['车内', 'Interior'], ['环绕', 'Orbit'], ['威胁追踪', 'Threat'], ['保险杠', 'Bumper'], ['侧面跟拍', 'Side']];
// start places on real roads: the nearest segment of the named road heading the right way, then the right-most lane
const RC_PLACES = [
  {id:'apple', zh:'Apple Park · 库比蒂诺', en:'Cupertino · N Tantau Ave', lat:37.3340, lon:-122.0056, hdg:0, m:l => l.name && /Tantau/.test(l.name[0])},
  {id:'google', zh:'Googleplex · 山景城', en:'Mountain View · Amphitheatre Pkwy', lat:37.4229, lon:-122.0845, hdg:90, m:l => l.name && /Amphitheatre Parkway/.test(l.name[0])},
  {id:'stanford', zh:'斯坦福 · 棕榈大道', en:'Stanford · Palm Drive, Palo Alto', lat:37.4396, lon:-122.1661, hdg:197, m:l => l.name && /^Palm Drive/.test(l.name[0]) && l.c <= 8},
  {id:'sanjose', zh:'圣何塞市中心', en:'Downtown San José · Santa Clara St', lat:37.3341, lon:-121.8925, hdg:59, m:l => l.name && /Santa Clara Street/.test(l.name[0])},
  {id:'santaclara', zh:'圣克拉拉 · 体育场旁', en:'Santa Clara · Tasman Dr by the stadium', lat:37.4050, lon:-121.9685, hdg:62, m:l => l.name && /^Tasman Drive/.test(l.name[0])},
  {id:'i280', zh:'I-280 · 沙丘路附近', en:'I-280 near Sand Hill Rd', lat:37.4125, lon:-122.2058, hdg:120, r:900, m:l => l.c === 0 && l.ref && /280/.test(l.ref)},
  {id:'us101', zh:'US-101 · 山景城', en:'US-101 · Mountain View', lat:37.4105, lon:-122.0790, hdg:123, r:900, m:l => l.c === 0 && l.ref && /101/.test(l.ref)},
  {id:'here', zh:'从这里出发', en:'From here (where the camera looks)'}];
// [nyc/nycapp] New York start places: the named road (OSM name / ref) heading the right way (bearings: the Manhattan grid runs 29 deg
// east of north; avenues uptown 29, downtown 209), then the right-most lane
const RC_PLACES_NY = [
  {id:'times', zh:'时代广场 · 第七大道', en:'Times Square · 7th Ave southbound', lat:40.7592, lon:-73.9850, hdg:209, m:l => l.name && /^(7th Avenue|Seventh Avenue)$/.test(l.name[0])},
  {id:'fifth', zh:'第五大道 · 中央公园南', en:'Fifth Ave at Central Park South', lat:40.7641, lon:-73.9729, hdg:209, m:l => l.name && /^(5th Avenue|Fifth Avenue)$/.test(l.name[0])},
  {id:'fdr', zh:'罗斯福快速路 FDR', en:'FDR Drive northbound · East 23rd St', lat:40.7352, lon:-73.9747, hdg:20, r:700, m:l => l.c <= 3 && l.name && /FDR Drive|Franklin D\.? Roosevelt/.test(l.name[0])},
  {id:'westside', zh:'西区高速 9A', en:'West Side Highway (NY 9A) · Chelsea Piers', lat:40.7465, lon:-74.0083, hdg:20, r:700, m:l => l.c <= 6 && ((l.ref && /9A/.test(l.ref)) || (l.name && /West Side Highway|Joe DiMaggio Highway/.test(l.name[0])))},
  {id:'brooklynbr', zh:'布鲁克林大桥 → 布鲁克林', en:'Brooklyn Bridge, Manhattan to Brooklyn', lat:40.7110, lon:-74.0028, hdg:122, r:500, m:l => l.name && /^Brooklyn Bridge$/.test(l.name[0])},
  {id:'parkave', zh:'公园大道 · 中央车站', en:'Park Ave at Grand Central', lat:40.7499, lon:-73.9787, hdg:29, r:450, m:l => l.name && /^Park Avenue( Viaduct)?$/.test(l.name[0])},
  {id:'queensboro', zh:'皇后区大桥', en:'Queensboro Bridge toward Queens', lat:40.7598, lon:-73.9598, hdg:118, r:500, m:l => l.name && /Queensboro Bridge/.test(l.name[0])},
  {id:'belt', zh:'环带公园大道 · 韦拉札诺桥', en:'Belt Parkway by the Verrazzano', lat:40.6046, lon:-74.0262, hdg:95, r:900, m:l => l.c <= 1 && l.name && /Belt Parkway|Shore Parkway/.test(l.name[0])},
  {id:'here', zh:'从这里出发', en:'From here (where the camera looks)'}];
const rcPlaces = () => isNyc() ? RC_PLACES_NY : RC_PLACES;
// New York speed limits (mph): the city default 25 (2014); named exceptions; expressways / parkways 50; outside the five boroughs
// (New Jersey, Nassau, Westchester) by road class
const RC_LIMIT_NJ = [55, 35, 50, 30, 40, 25, 35, 25, 30, 25, 25, 15];
const NYL = new Map();
function nyBorough(x, y){ try { if (!SG.pa || !SGD || !SGD.pas) return ''; const pi = SG.pa[cx2i(y)*N + cx2i(x)], A = pi ? SGD.pas[pi - 1] : null, Rg = A ? SGD.regs[A.reg - 1] : null; return Rg ? Rg.en : ''; } catch (e){ return ''; } }
function nyLimit(li){
  let v = NYL.get(li); if (v !== undefined) return v;
  const l = SGR.lines[li], c = Math.min(11, l.c), nm = (l.name && l.name[0]) || '', ref = l.ref || '', P = l.P, m = (P.length >> 2) << 1;
  const city = /^(Manhattan|Brooklyn|Queens|The Bronx|Staten Island)$/.test(nyBorough(P[m], P[m + 1]));
  if (/FDR Drive|Franklin D\.? Roosevelt|Harlem River Drive/.test(nm)) v = 40;
  else if (/West Side Highway|Joe DiMaggio/.test(nm) || /(^|;\s*)NY 9A/.test(ref)) v = 30;
  else if (/^(Brooklyn|Manhattan|Williamsburg|Ed Koch Queensboro|Queensboro) Bridge/.test(nm)) v = 30;
  else if (!city) v = RC_LIMIT_NJ[c];
  else v = c === 0 ? 50 : c === 1 ? 30 : c === 11 ? 15 : 25;
  NYL.set(li, v); return v;
}
const rcLimitOf = (li, c) => isNyc() && li >= 0 && SGR.lines && SGR.lines[li] ? nyLimit(li) : RC_LIMIT[Math.min(11, c)];
const RCM = {extC:{}, extM:null, key:null, G:null, geo:{}, built:false, col:0, lights:'auto', headOn:false, ind:0, indT:0, indArm:0, place:'apple', vis:false, poolRows:null};
function rcGeo(key){
  let G = RCM.geo[key]; if (G) return G; const g = RCGEO.build(key), H = F1GEO.H;
  G = RCM.geo[key] = Object.assign({key, body:H.toGeo(g.body), wheel:H.toGeo(g.wheel), lamps:g.lamps, wpos:g.wpos, bonnetY:g.bonnetY, r:RCAR[key].g.r}, dcCabGeo(key, g));   // [lm28/drivecam] the cabin
  // the interior view's body: the same buffers without the lid over the cabin
  const gc = new THREE.BufferGeometry(); for (const k in G.body.attributes) gc.setAttribute(k, G.body.attributes[k]); gc.setIndex(G.body.index); gc.setDrawRange(0, g.nNoCabin); gc.boundingSphere = G.body.boundingSphere; G.bodyNC = gc;
  G.tris = {body:G.body.index.count/3, wheel:G.wheel.index.count/3, int:G.int.index.count/3, steer:G.steer.index.count/3}; G.tris.car = G.tris.body + 4*G.tris.wheel;
  return G;
}
const POOL_D = [0.3, 1.5, 3.5, 6.5, 10.5, 15.5, 22, 30, 40, 52], POOL_C = 9;
function rcEnsure(key){
  ensureMeshes();
  if (!RCM.built){ RCM.built = true;
    matRC.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, {uAmb:U.amb, uSky:U.sky, uPaint:RU.paint, uLamp:RU.lamp, uInd:RU.ind, uCab:RU.cab, uCabP:RU.cabP});
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nattribute float slot;\nattribute float gl;\nuniform vec3 uPaint;\nvarying float vGl;')
        .replace('#include <color_vertex>', 'vColor = color;\nif (slot > 0.5) vColor = uPaint;\nvGl = gl;');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform float uAmb;\nuniform vec3 uSky;\nuniform vec4 uLamp;\nuniform vec3 uInd;\nuniform vec4 uCab;\nuniform vec3 uCabP;\nvarying float vGl;')
        .replace('#include <aomap_fragment>', 'reflectedLight.directSpecular *= min(vGl, 1.0);\n#include <aomap_fragment>')
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n{ float fr = pow(1.0 - clamp(abs(dot(normalize(vViewPosition), normal)), 0.0, 1.0), 3.0), g = min(vGl, 1.25);\n'
          + '  totalEmissiveRadiance += uSky * (fr * (g > 1.1 ? 0.8 : 0.34 * g) + (g > 1.1 ? 0.09 : 0.0)) + diffuseColor.rgb * uAmb;\n'
          + '  if (vGl > 1.5){ float k = vGl < 2.5 ? uLamp.x : vGl < 3.5 ? uLamp.y : vGl < 4.5 ? uLamp.z : vGl < 5.5 ? uLamp.w : vGl < 6.5 ? uInd.x : vGl < 7.5 ? uInd.y : vGl < 8.5 ? uInd.z : uCab.w; totalEmissiveRadiance += diffuseColor.rgb * k; }'
          + '  vec3 cq = -vViewPosition - uCabP; totalEmissiveRadiance += diffuseColor.rgb * uCab.rgb / (1.0 + dot(cq, cq)*6.0); }');
    };
    const G0 = rcGeo(key || 'sedan');
    RCM.body = new THREE.Mesh(G0.body, matRC); RCM.wheel = new THREE.InstancedMesh(G0.wheel, matRC, 4); RCM.wheel.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    for (const m of [RCM.body, RCM.wheel]){ m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; m.visible = false; m.matrixAutoUpdate = false; m.name = 'svdrive'; scene.add(m); }
    RCM.ovBody = new THREE.Mesh(G0.bodyNC, matRC); RCM.ovInt = new THREE.Mesh(G0.int, matRC); RCM.ovSteer = new THREE.Mesh(G0.steer, matRC);
    for (const m of [RCM.ovBody, RCM.ovInt, RCM.ovSteer]){ m.frustumCulled = false; m.matrixAutoUpdate = false; m.visible = false; OV.scene.add(m); }
    dcCabInit();
    // the light pool of the headlamps on the road (additive, draped on a few height samples ahead; US low beam: a little to the right)
    const nv = POOL_D.length*POOL_C, pg = new THREE.BufferGeometry(), col = new Float32Array(nv*3), idx = [];
    for (let i = 0; i < POOL_D.length; i++) for (let j = 0; j < POOL_C; j++){ const d = POOL_D[i], t = j/(POOL_C - 1)*2 - 1;
      const I = (Math.abs(t) > 0.99 ? 0 : 1)*(sstep(0.0, 3.0, d)*(1 - sstep(24, 52, d))*Math.exp(-2.6*t*t)*(1.2/(1 + d*0.035)) + (d < 2 ? 0.22*Math.exp(-3*t*t) : 0));
      const k = (i*POOL_C + j)*3; col[k] = col[k + 1] = col[k + 2] = Math.min(1, I); }
    for (let i = 0; i < POOL_D.length - 1; i++) for (let j = 0; j < POOL_C - 1; j++){ const a = i*POOL_C + j, b = a + 1, c = a + POOL_C, d = c + 1; idx.push(a, c, b, b, c, d); }
    pg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(nv*3), 3).setUsage(THREE.DynamicDrawUsage)); pg.setAttribute('color', new THREE.BufferAttribute(col, 3)); pg.setIndex(idx);
    RCM.poolMat = new THREE.MeshBasicMaterial({vertexColors:true, color:new THREE.Color(1, 0.93, 0.8), transparent:true, opacity:0, blending:THREE.AdditiveBlending, depthWrite:false, polygonOffset:true, polygonOffsetFactor:-2, polygonOffsetUnits:-4, side:THREE.DoubleSide});
    RCM.pool = new THREE.Mesh(pg, RCM.poolMat); RCM.pool.frustumCulled = false; RCM.pool.visible = false; RCM.pool.renderOrder = 4; scene.add(RCM.pool);
    // lamp glare sprites (night): two headlamps, two tail / brake lamps
    const mkSpr = (c, size) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3)); const m = new THREE.PointsMaterial({size, map:lampTex, color:c, transparent:true, opacity:0, depthWrite:false, blending:THREE.AdditiveBlending, sizeAttenuation:true});
      const p = new THREE.Points(g, m); p.frustumCulled = false; p.visible = false; p.renderOrder = 5; scene.add(p); return p; };
    RCM.sprH = mkSpr(0xfff4e0, 1.5); RCM.sprT = mkSpr(0xff2a1c, 0.9);
  }
  if (key && RCM.key !== key){ const ext = RCAR[key].ext, G = rcGeo(ext ? 'sedan' : key); RCM.key = key; RCM.G = G; RCP = RCAR[key].ph;
    for (const k in RCM.extC) RCM.extC[k].visible = false; RCM.extM = null; if (ext){ try { RCM.extM = rcExtMesh(key); } catch (e){ console.warn('[f1d] vehicle model', e); } } else rcVoiceStop();
    RCM.body.geometry = G.body; RCM.wheel.geometry = G.wheel; RCM.ovBody.geometry = G.bodyNC; RCM.ovInt.geometry = G.int; RCM.ovSteer.geometry = G.steer; dcCabKey(key); }
  rcPaint();
}
// [lm24/drive] the traffic module's model as the player's vehicle (one instance; paint + lamp / indicator / damage codes in iCol)
function rcExtMesh(key){
  let m = RCM.extC[key]; if (m) return m;
  const M = window.SGTraffic.model(RCAR[key].ext); m = new THREE.InstancedMesh(M.geo, M.mat, 1); m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; m.visible = false; m.name = 'svdrive-' + key; scene.add(m); RCM.extC[key] = m; return m;
}
let rcVoiceOn = false;
function rcVoice(){
  const k = RCM.key && RCAR[RCM.key].kind; if (!k || !F1.on || F1.veh !== 'car'){ rcVoiceStop(); return; }
  try { const A = window.SGAudio; if (!A || !A.vehicle) return; const C = CAR; rcVoiceOn = true;
    A.vehicle('drive', k, {x:C.x, y:C.y, z:carZ(C) + 1, throttle:C.thr || 0, speed:Math.abs(C.u), rpm:clamp((C.rpm || 0)/RCP.rpmMax, 0, 1), inside:F1.cam === 1 || F1.cam === 2, damage:clamp(DMG.total/2.4, 0, 1)}); } catch (e){ /* optional */ }
}
function rcVoiceStop(){ if (!rcVoiceOn) return; rcVoiceOn = false; try { if (window.SGAudio && window.SGAudio.vehicleStop) window.SGAudio.vehicleStop('drive'); } catch (e){ /* optional */ } }
function rcPaint(){ RU.paint.value.setRGB(...(RCM.key === 'taxi' ? RC_TAXI_PAINT : RC_COLS[RCM.col].c)); }
function rcHide(){ if (!RCM.built) return; for (const m of [RCM.body, RCM.wheel, RCM.pool, RCM.sprH, RCM.sprT]) m.visible = false; for (const k in RCM.extC) RCM.extC[k].visible = false; RCM.vis = false; rcVoiceStop(); }
const _pv = new THREE.Vector3();
function rcUpdate(dt){
  if (!RCM.built) return; const on = F1.on && F1.veh === 'car' && !F1.hide;
  if (!on){ if (RCM.vis) rcHide(); return; }
  RCM.vis = true; const C = CAR, G = RCM.G;
  carMat(_mc, C.x, C.y, carZ(C), C.psi, C.pitch, C.roll); RCM.body.matrix.copy(_mc); RCM.body.matrixWorldNeedsUpdate = true; RCM.body.visible = true;
  if (RCM.extM){ const Gx = RCAR[RCM.key].g, m = RCM.extM, cs = Math.cos(C.psi), sn = Math.sin(C.psi);
    carMat(_mc2, C.x + cs*Gx.mx, C.y + sn*Gx.mx, carZ(C), C.psi, C.pitch, C.roll); m.setMatrixAt(0, _mc2); m.instanceMatrix.needsUpdate = true;
    const braking = (!C.rev && C.brk > 0.05) || (C.rev && C.thr > 0.05), blink = (RCM.indT % 0.76) < 0.4;
    let fl = (braking ? 1 : 0) + ((RCM.ind === -1 || RCM.ind === 2) ? 2 : 0) + ((RCM.ind === 1 || RCM.ind === 2) ? 4 : 0) + (RCAR[RCM.key].kind === 'motorbike' || RCM.lights === 'on' ? 8 : 0); void blink;
    if (DMG.ext && DMG.ext.lev > 0) fl += 16*DMG.ext.lev + 256*Math.round(clamp((DMG.ext.ix/9.6 + 1)*0.5, 0, 1)*31) + 8192*Math.round(clamp((DMG.ext.iz/1.4 + 1)*0.5, 0, 1)*7);
    const ic = m.geometry.attributes.iCol, pc = Gx.paint ? RC_COLS[RCM.col].c : [0.95, 0.95, 0.94], dk = 1 - 0.3*clamp(DMG.total/2.4, 0, 1);
    ic.array[0] = pc[0]*dk; ic.array[1] = pc[1]*dk; ic.array[2] = pc[2]*dk; ic.array[3] = fl; ic.needsUpdate = true;
    m.visible = !dcHideBody(); RCM.body.visible = RCM.wheel.visible = false; RCM.sprH.visible = RCM.sprT.visible = false;
    RCM.indT += dt; rcVoice();
    const nf = nightF, headOn = RCM.lights === 'on' || (RCM.lights === 'auto' && nf > 0.22); RCM.headOn = headOn; U.amb.value = 0.04 + nf*0.26;
    const glow = sstep(0.12, 0.55, nf), cs2 = cs, sn2 = sn, x0 = Gx.xf, pool = headOn && glow > 0.01; RCM.pool.visible = pool; RCM.poolMat.opacity = glow*0.62*(RCM.lights === 'off' ? 0 : 1);
    if (pool){ const P = RCM.pool.geometry.attributes.position.array, zc = carZ(C);
      for (let i = 0; i < POOL_D.length; i++){ const d = POOL_D[i] + x0 - 0.2, half = 1.0 + POOL_D[i]*0.30, sh = POOL_D[i]*0.035, cx = C.x + cs2*d, cy = C.y + sn2*d;
        let z = zAt(cx, cy, false); if (!isFinite(z) || Math.abs(z - zc) > 6) z = zc; z += 0.07 + Math.min(0.12, POOL_D[i]*0.004);
        for (let j = 0; j < POOL_C; j++){ const t = j/(POOL_C - 1)*2 - 1, lat = t*half - sh, px = cx + sn2*lat, py = cy - cs2*lat, k = (i*POOL_C + j)*3; P[k] = px; P[k + 1] = z; P[k + 2] = -py; } }
      RCM.pool.geometry.attributes.position.needsUpdate = true; }
    return; }
  carMat(_mc2, C.x, C.y, carZ(C), C.psi, C.pitchS, C.rollS);
  for (let k = 0; k < 4; k++) RCM.wheel.setMatrixAt(k, wheelMat(_mw, _mc2, k, C.delta, C.wspin, G.wpos));
  RCM.wheel.instanceMatrix.needsUpdate = true; RCM.wheel.matrixWorldNeedsUpdate = true; RCM.wheel.visible = true;
  // the interior view draws the car (without the lid over the cabin) in the overlay pass only
  if (dcHideBody()){ RCM.body.visible = false; RCM.wheel.visible = DC.bt < 1; }
  // lamps: headlamps (auto at dusk / night, L to switch), daytime running lamps, tail, brake, reverse, indicators, displays
  const nf = nightF, headOn = RCM.lights === 'on' || (RCM.lights === 'auto' && nf > 0.22); RCM.headOn = headOn;
  const braking = (!C.rev && C.brk > 0.05) || (C.rev && C.thr > 0.05) || (Math.abs(C.u) < 0.3 && !C.park && C.brk > 0.05);
  RCM.indT += dt; const blink = (RCM.indT % 0.76) < 0.4 ? 1 : 0;
  RU.lamp.value.set(headOn ? 1.9 : (RCM.lights === 'off' ? 0.25 : 0.7), braking ? 2.2 : headOn ? 0.95 : 0, braking ? 2.8 : headOn ? 0.55 : 0, C.rev ? 1.9 : 0);
  RU.ind.value.set((RCM.ind === -1 || RCM.ind === 2) ? 2.6*blink : 0, (RCM.ind === 1 || RCM.ind === 2) ? 2.6*blink : 0, 0.45 + nf*0.5);
  U.amb.value = 0.04 + nf*0.26; U.sky.value.copy(scene.background).multiplyScalar(0.55 + 0.45*(1 - nf));
  // indicators cancel themselves after the turn (the steering wound in that way, then back)
  if (RCM.ind === -1 || RCM.ind === 1){ const s = C.steer*RCM.ind; if (s > 0.35) RCM.indArm = Math.min(2, RCM.indArm + dt); else if (RCM.indArm > 0.4 && Math.abs(C.steer) < 0.08){ RCM.ind = 0; RCM.indArm = 0; } }
  // light pool and glare sprites
  const glow = sstep(0.12, 0.55, nf), cs = Math.cos(C.psi), sn = Math.sin(C.psi), Gs = RCAR[RCM.key].g, x0 = Gs.xf;
  const pool = headOn && glow > 0.01; RCM.pool.visible = pool; RCM.poolMat.opacity = glow*0.62*(RCM.lights === 'off' ? 0 : 1);
  if (pool){ const P = RCM.pool.geometry.attributes.position.array, zc = carZ(C);
    for (let i = 0; i < POOL_D.length; i++){ const d = POOL_D[i] + x0 - 0.2, half = 1.0 + POOL_D[i]*0.30, sh = POOL_D[i]*0.035, cx = C.x + cs*d, cy = C.y + sn*d;
      let z = zAt(cx, cy, false); if (!isFinite(z) || Math.abs(z - zc) > 6) z = zc; z += 0.07 + Math.min(0.12, POOL_D[i]*0.004);
      for (let j = 0; j < POOL_C; j++){ const t = j/(POOL_C - 1)*2 - 1, lat = t*half - sh, px = cx + sn*lat, py = cy - cs*lat, k = (i*POOL_C + j)*3; P[k] = px; P[k + 1] = z; P[k + 2] = -py; } }
    RCM.pool.geometry.attributes.position.needsUpdate = true; }
  const L = G.lamps, inside = F1.cam === 1 || F1.cam === 2;
  RCM.sprH.visible = glow > 0.01 && headOn && !inside; RCM.sprT.visible = glow > 0.01 && (headOn || braking);
  RCM.sprH.material.opacity = glow*0.95; RCM.sprT.material.opacity = Math.max(glow*(headOn ? 0.55 : 0), braking ? 0.35 + glow*0.6 : 0); RCM.sprT.material.size = braking ? 1.35 : 0.85;
  const sp = (pts, p) => { const a = pts.geometry.attributes.position.array; for (const s of [0, 1]){ _pv.set(p[0], p[1], s ? p[2] : -p[2]).applyMatrix4(_mc); a[s*3] = _pv.x; a[s*3 + 1] = _pv.y; a[s*3 + 2] = _pv.z; } pts.geometry.attributes.position.needsUpdate = true; };
  if (RCM.sprH.visible) sp(RCM.sprH, L.head); if (RCM.sprT.visible) sp(RCM.sprT, L.tail);
}
// attitude (the road plane under the four wheels, then a sprung body: roll and pitch with a little overshoot), gears, odometer
function rcAttitude(C, dt){
  const P = RCP, Gs = RCAR[RCM.key].g, cs = Math.cos(C.psi), sn = Math.sin(C.psi), wz = (lx, lz) => zAt(C.x + cs*lx + sn*lz, C.y + sn*lx - cs*lz, false), tw = Gs.track/2, L = P.a + P.b;
  const zFL = wz(P.a, -tw), zFR = wz(P.a, tw), zRL = wz(-P.b, -tw), zRR = wz(-P.b, tw);
  const zf = (zFL + zFR)*0.5, zr = (zRL + zRR)*0.5, zl = (zFL + zRL)*0.5, zri = (zFR + zRR)*0.5;
  const ptS = clamp(Math.atan2(zf - zr, L), -0.3, 0.3), rlS = clamp(Math.atan2(zl - zri, Gs.track), -0.25, 0.25), dzv = clamp(zr + (zf - zr)*(P.b/L) - C.z, -0.4, 0.4);
  const ks = Math.min(1, dt*25);
  C.pitchS += (ptS - C.pitchS)*ks; C.rollS += (rlS - C.rollS)*ks; C.dzv += (dzv - C.dzv)*ks; C.zv = C.z + C.dzv + p2Heave(C, dt);   // [lm30/phys2] heave
  // sprung body: target roll / pitch from the accelerations, a damped spring (about 1.4 Hz, slightly underdamped)
  const tR = clamp(C.ay || 0, -12, 12)*P.roll, tP = clamp(C.ax || 0, -12, 8)*P.pitch*1.35, wn = 8.5, ze = 0.55, n = Math.max(1, Math.ceil(dt/0.008)), h = dt/n;
  for (let i = 0; i < n; i++){ C.lv = (C.lv || 0) + (wn*wn*(tR - C.lean) - 2*ze*wn*(C.lv || 0))*h; C.lean += C.lv*h; C.pv = (C.pv || 0) + (wn*wn*(tP - C.dive) - 2*ze*wn*(C.pv || 0))*h; C.dive += C.pv*h; }
  if (Gs.lean){ const tl = clamp(-Math.atan2(C.ay || 0, 9.81), -0.75, 0.75)*Math.min(1, Math.abs(C.u)/4); C.lean = (C.lean0 || 0) + (tl - (C.lean0 || 0))*Math.min(1, dt*7); C.lean0 = C.lean; C.lv = 0; C.rollS = 0; }
  C.pitch = C.pitchS + C.dive; C.roll = C.rollS + C.lean;
  C.wspin = (C.wspin + C.u*dt/Gs.r) % (TAU*1000);
  rcGears(C, dt);
  // park again after standing still with the handbrake on for a moment
  if (Math.abs(C.u) < 0.2 && INP.hb > 0.5){ C.parkT = (C.parkT || 0) + dt; if (C.parkT > 1.2) C.park = true; } else C.parkT = 0;
  const kmh = Math.abs(C.u)*3.6; C.odo += Math.abs(C.u)*dt; C.vtop = Math.max(C.vtop, kmh);
}
function rcPlace(sx, sy, ux, uy, li, l, zp){
  const C = CAR; C.x = sx; C.y = sy; C.psi = Math.atan2(uy, ux); C.u = 0; C.v = 0; C.r = 0; C.delta = 0; C.rev = false; C.revT = 0; C.gear = 1; C.pitch = 0; C.roll = 0;
  C.pitchS = C.rollS = C.dzv = C.dive = C.lean = C.lv = C.pv = 0; C.park = true; C.shiftT = C.shiftW = 0; C.brkHold = false; AUTO.li = -1;
  const n = roadCands(sx, sy); let z = gnd(sx, sy), bz = 1e9;
  for (let q = 0; q < n; q++){ if (RC[q].li === li){ z = RC[q].z; break; } const e2 = Math.abs(RC[q].z - (zp !== undefined ? zp : z)); if (e2 < bz){ bz = e2; z = RC[q].z; } }
  if (typeof SGRoads !== 'undefined' && SGRoads.surfaceAt){ if (SGRoads.surfacePrefetch) SGRoads.surfacePrefetch(sx, sy, 300); const r = SGRoads.surfaceAt(sx, sy, z); if (r && Math.abs(r.z - z) < 1.5) z = r.z; }
  C.z = C.zs = C.zv = z; C.kind = 'road'; C.c = l.c; C.li = li; C.rdx = ux; C.rdy = uy;
  BI.clear(); biPrefetch(C.x, C.y);
  return true;
}
// the right-most lane of a road (the roads module's US marking layout)
function rcLaneOff(l){
  const ow = (l.flags & 1) !== 0, c = Math.min(11, l.c), wd = RD_WID[c][ow ? 1 : 0], hw = wd/2, LN = RC_LANES[c][ow ? 1 : 0];
  if (ow){ const shR = c === 0 ? 2.0 : c <= 3 ? 0.7 : 0.4, shL = c === 0 ? 0.9 : c <= 3 ? 0.5 : 0.4, N = Math.max(1, LN), lw = (wd - shR - shL)/N; return hw - shR - lw/2; }
  const N = Math.max(1, LN >> 1), inE = c <= 2 ? 0.6 : 0.35, lw = (hw - inE)/N; return LN < 2 ? hw*0.5 : (N - 0.5)*lw;
}
function spawnPlace(p){
  riCoarse(); const q = sgXY(p.lat, p.lon), hx = Math.sin(p.hdg*PI/180), hy = Math.cos(p.hdg*PI/180), Ls = SGR.lines, G = RI.G, NB = RI.NB, R = p.r || 600;
  let best = null, bs = 1e18; const seen = new Set();
  for (let by = Math.floor((q[1] - R + HALF)/G); by <= Math.floor((q[1] + R + HALF)/G); by++) for (let bx = Math.floor((q[0] - R + HALF)/G); bx <= Math.floor((q[0] + R + HALF)/G); bx++){
    if (bx < 0 || by < 0 || bx >= NB || by >= NB) continue; const list = RI.coarse.get(by*NB + bx); if (!list) continue;
    for (const li of list){ if (seen.has(li)) continue; seen.add(li); const l = Ls[li]; if (l.c > 11 || (l.flags & 8) || !p.m(l)) continue; const P = l.P, ow = (l.flags & 1) !== 0;
      for (let k = 0; k + 3 < P.length; k += 2){ const ax = P[k], ay = P[k + 1], dx = P[k + 2] - ax, dy = P[k + 3] - ay, l2 = dx*dx + dy*dy; if (l2 < 25) continue;
        const Lg = Math.sqrt(l2), c = (dx*hx + dy*hy)/Lg; if (ow && c < 0.45) continue;
        const t = clamp(((q[0] - ax)*dx + (q[1] - ay)*dy)/l2, 0.1, 0.9), px = ax + dx*t, py = ay + dy*t, d = Math.hypot(px - q[0], py - q[1]); if (d > R) continue;
        const sc = d + (1 - Math.abs(c))*80 + (l.E && l.E[k >> 1] > 0.5 ? 40 : 0), sg = c < 0 ? -1 : 1;
        if (sc < bs){ bs = sc; best = {l, li, px, py, ux:dx/Lg*sg, uy:dy/Lg*sg}; } } } }
  if (!best) return false;
  const off = rcLaneOff(best.l);
  return rcPlace(best.px + best.uy*off, best.py - best.ux*off, best.ux, best.uy, best.li, best.l);
}
function rcCam(dt){
  const C = CAR, G = RCM.G, Gs = RCAR[RCM.key].g, kmh = Math.abs(C.u)*3.6;
  carMat(_mc, C.x, C.y, carZ(C), C.psi, C.pitch, C.roll); _q2.setFromRotationMatrix(_mc);
  let near = 0.75, fov;
  if (F1.cam === 1 || F1.cam === 2){
    const ins = F1.cam === 2, e = Gs.eye;
    _v.set(ins ? e[0] : Gs.bonnet, ins ? e[1] : (Gs.bonnetY !== undefined ? Gs.bonnetY : G.bonnetY) + 0.26, ins ? e[2] : 0).applyMatrix4(_mc); CV.pos.copy(_v);
    _e.set(ins ? -0.07 : -0.06, -PI/2, 0, 'YXZ'); _q.setFromEuler(_e); CV.q.copy(_q2).multiply(_q);
    CV.shake = 0;   // [lm28/drivecam] the vibration and the impact shake: smooth and capped (dcPost)
    fov = hfovToV((ins ? 90 : 82) + 5*Math.min(1, kmh/250)); near = 0.75;
  } else if (F1.cam === 0){
    const cs = Math.cos(C.psi), sn = Math.sin(C.psi), vx = C.u*cs - C.v*sn, vy = C.u*sn + C.v*cs, vh = Math.atan2(vy, vx);
    const tgt = C.u > 2 ? C.psi + 0.5*wrapA(vh - C.psi) : C.u < -2 ? C.psi : C.psi;
    CV.cpsi += wrapA(tgt - CV.cpsi)*Math.min(1, dt*3.6);
    let d = Gs.chase[0] + Math.min(1.4, kmh*0.006); const h = Gs.chase[1] + Math.min(0.45, kmh*0.0018);
    const ex = C.x - Math.cos(CV.cpsi)*d, ey = C.y - Math.sin(CV.cpsi)*d;
    { const f = biRay(C.x, C.y, ex, ey, C.z, C.z + h + 1); if (f < 1) d = Math.max(2.6, f*d - 0.7); }
    CV.chD += (d - CV.chD)*Math.min(1, dt*(d < CV.chD ? 12 : 2));
    const cx = C.x - Math.cos(CV.cpsi)*CV.chD, cy = C.y - Math.sin(CV.cpsi)*CV.chD, cz = Math.max(C.z + h, gnd(cx, cy) + 0.8);
    CV.pos.set(cx, cz, -cy); _v.set(C.x + Math.cos(CV.cpsi)*4.5, C.z + 1.0, -(C.y + Math.sin(CV.cpsi)*4.5));
    _mlook.lookAt(CV.pos, _v, _UP); CV.q.setFromRotationMatrix(_mlook);
    fov = hfovToV(74 + 8*Math.min(1, kmh/250)); near = 0.8;
  } else if (F1.cam >= 4 && dcCam(dt)){ fov = DCR.fov; near = DCR.near;   // [lm28/drivecam] threat, bumper, side
  } else {
    const a = (CV.az*PI/180) + C.psi + PI, e = CV.el*PI/180;
    CV.pos.set(C.x + Math.cos(a)*Math.cos(e)*CV.d, C.z + 0.7 + Math.sin(e)*CV.d, -(C.y + Math.sin(a)*Math.cos(e)*CV.d)); _v.set(C.x, C.z + 0.7, -C.y);
    _mlook.lookAt(CV.pos, _v, _UP); CV.q.setFromRotationMatrix(_mlook); fov = 34; near = 0.5;
  }
  { const r = dcPost(dt, fov, near); fov = r.fov; near = r.near; }   // [lm28/drivecam] look back, blends, FOV, dolly-zoom, shake
  CV.fov = fov; CV.near = near;
  if (CV.t < 1){ CV.t = Math.min(1, CV.t + dt/CV.dur); const k = CV.t < 0.5 ? 2*CV.t*CV.t : 1 - Math.pow(-2*CV.t + 2, 2)/2;
    camera.position.lerpVectors(CV.from, CV.pos, k); camera.quaternion.copy(CV.fromQ).slerp(CV.q, k); camera.fov = lerp(F1.saved ? F1.saved.fov : 38, fov, k); }
  else { camera.position.copy(CV.pos); camera.quaternion.copy(CV.q); camera.fov = fov; }
  applyCam();
  controls.target.set(C.x + Math.cos(C.psi)*30, C.z, -(C.y + Math.sin(C.psi)*30));
}
// the bonnet / interior pass: the car (and its cabin) close to the eye, in a frame centred on the camera, its own near plane
const _ms = new THREE.Matrix4();
function rcOverlay(){
  const ov = dcOvRC(); if (!RCM.built || !ov){ dcCabHide(); return; }
  const C = CAR, cp = camera.position, ins = ov === 2, X = RCM.extM ? RCM.CX : null, G = X || RCM.G;
  carMat(_mc, C.x, C.y, carZ(C), C.psi, C.pitch, C.roll); _mc.elements[12] -= cp.x; _mc.elements[13] -= cp.y; _mc.elements[14] -= cp.z;
  RCM.ovInt.geometry = G.int; RCM.ovSteer.geometry = G.steer; if (!X){ const dm = DMG.geo && DMG.key === RCM.key; RCM.ovBody.geometry = dcCamInCab() ? (dm ? DMG.geoNC : RCM.G.bodyNC) : (dm ? DMG.geo : RCM.G.body); }   // the lid over the cabin only from outside (blends); dents kept
  for (const m of [RCM.ovBody, RCM.ovInt, RCM.ovSteer]){ m.matrix.copy(_mc); m.matrixWorldNeedsUpdate = true; m.visible = true; }
  RCM.ovBody.visible = !X; RCM.ovInt.visible = RCM.ovSteer.visible = ins;
  const spin = G.cab && G.cab.bars ? C.delta : clamp(C.delta*14, -7.5, 7.5);   // a motorbike's bars turn by the steering angle
  if (ins){ _e.set(-spin, 0, G.cab ? G.cab.tilt : 0.44, 'ZXY'); _q.setFromEuler(_e); _p.set(G.sw[0], G.sw[1], G.sw[2]); _s.set(1, 1, 1); _ml.compose(_p, _q, _s); RCM.ovSteer.matrix.multiplyMatrices(_mc, _ml); }
  const keep = [OV.body.visible, OV.bodyH.visible, OV.wheel.visible, OV.steer.visible]; OV.body.visible = OV.bodyH.visible = OV.wheel.visible = OV.steer.visible = false;
  OV.cam.position.set(0, 0, 0); OV.cam.quaternion.copy(camera.quaternion); OV.cam.fov = camera.fov; OV.cam.aspect = camera.aspect; OV.cam.near = 0.03; OV.cam.far = 60; OV.cam.updateProjectionMatrix(); OV.cam.updateMatrixWorld();
  if (ins) dcCabFrame(G, _mc, spin); else dcCabHide();
  OV.hemi.color.copy(hemi.color); OV.hemi.groundColor.copy(hemi.groundColor); OV.hemi.intensity = hemi.intensity; OV.sun.color.copy(sun.color); OV.sun.intensity = sun.intensity*0.92;
  OV.sun.position.copy(sun.position).sub(sun.target.position); OV.sun.target.position.set(0, 0, 0); OV.sun.target.updateMatrixWorld();
  const ac = renderer.autoClear, ar = renderer.info.autoReset; renderer.autoClear = false; renderer.info.autoReset = false; renderer.clearDepth();
  if (ins && !(G.cab && G.cab.open)){   // two passes sharing the depth: the body in the full light, then the cabin in the shade of its roof (and its own light)
    const cab = [RCM.ovInt, RCM.ovSteer, RCM.ovHands, RCM.ovArms, RCM.ovNdl, RCM.ovMir], cv = cab.map(m => !!(m && m.visible)), cw = RU.cab.value.w, cr = RU.cab.value.x, cg = RU.cab.value.y, cb = RU.cab.value.z;
    if (RCM.ovBody.visible){ for (const m of cab) if (m) m.visible = false; RU.cab.value.set(0, 0, 0, 0); renderer.render(OV.scene, OV.cam); RU.cab.value.set(cr, cg, cb, cw); cab.forEach((m, i) => { if (m) m.visible = cv[i]; }); RCM.ovBody.visible = false; }
    const si = OV.sun.intensity, hi = OV.hemi.intensity; OV.sun.intensity = si*(G.cab && G.cab.own ? 0.7 : 0.45); OV.hemi.intensity = hi*0.85; renderer.render(OV.scene, OV.cam); OV.sun.intensity = si; OV.hemi.intensity = hi;   // (the pickup's cab carries its bonnet: less shade)
  } else renderer.render(OV.scene, OV.cam);
  renderer.autoClear = ac; renderer.info.autoReset = ar;
  OV.body.visible = keep[0]; OV.bodyH.visible = keep[1]; OV.wheel.visible = keep[2]; OV.steer.visible = keep[3];
  RCM.ovBody.visible = RCM.ovInt.visible = RCM.ovSteer.visible = false; dcCabHide();
}
function rcKey(c){
  if (c === 'KeyL'){ RCM.lights = RCM.lights === 'auto' ? 'on' : RCM.lights === 'on' ? 'off' : 'auto'; flash(RCM.lights === 'auto' ? '大灯 自动 · Lights auto' : RCM.lights === 'on' ? '大灯 开 · Lights on' : '大灯 关 · Lights off', 1.2); }
  else if (c === 'KeyQ' || c === 'KeyE'){ const d = c === 'KeyQ' ? -1 : 1; RCM.ind = RCM.ind === d ? 0 : d; RCM.indT = 0; RCM.indArm = 0; }
  else if (c === 'KeyZ'){ RCM.ind = RCM.ind === 2 ? 0 : 2; RCM.indT = 0; }
}

//<DRIVECAM>
/* ================= [lm28/drivecam] fear cameras, live mirrors / rear view, cabin extras, obstacle providers ================= */
// Cameras (both vehicles; the old ones keep their numbers): F1 0 cockpit, 1 T-cam, 2 chase, 3 orbit; road car 0 chase, 1 bonnet,
// 2 interior, 3 orbit; new for both: 4 threat (frames the car and the creature when a creature game is on, else the chase), 5 bumper
// (low, wide), 6 side (a camera car alongside, on the side away from the creature). C cycles (Shift+C back; the threat cam joins the
// cycle while a creature is out), V toggles the threat cam, 1-7 pick one, B looks back (hold, or tap to latch; the button and the
// gamepad's LB too): in the cabin the driver turns over the shoulder towards the creature (or straight back through the rear window),
// the F1 / bonnet views use a camera on the airbox / roof looking back, the bumper view the rear bumper, the outside views swing round
// to the front of the car and look back past it. Switching cameras blends in ~0.5 s (car-relative position and aim). Every view gets a
// speed-dependent field of view, a slow dolly-zoom and a heartbeat pulse as the creature closes in, and a smooth, capped collision
// shake instead of the old per-frame random jitter. The rear view (P: auto / on / off): a low-resolution render target (384 x 128,
// 120 deg, 1500 m deep, every third frame (every sixth when it costs > 3.5 ms), the shadow map and the scene's matrices reused), live while
// a creature is out (or always with P = on): on the cabin's mirrors (interior and both door mirrors, mirrored), the F1's mirrors and, in the
// outside views, as a picture-in-picture at the top right; otherwise the mirrors show their dark glass (no cost).
// SGF1.obstacles(fn): oriented boxes from providers (window.SGArmy) collided with in the car's own step (two-body impulses by mass)
// and fn.onHit(id, {jx, jy, speed}) once per frame per box hit.
const DCN = {f1:['cockpit', 'tcam', 'chase', 'orbit', 'threat', 'bumper', 'side'], car:['chase', 'bonnet', 'interior', 'orbit', 'threat', 'bumper', 'side']};
const DC = {lb:0, lbE:0, lbSg:1, lbOn:false, lbLatch:false, lbs:{t0:0, skip:false}, prev:-1, bt:1, bp:new THREE.Vector3(), bk:new THREE.Vector3(), bfov:60,
  fovS:0, dz:0, beat:0, sh:0, shT:0, shR:[1.3, 2.1, 0.7, 3.3, 0.4, 2.6], hitT:0, side:{a:null, s:1, blk:0, sw:0}, thr:{a:null, fov:60, h:0},
  K:{on:false, x:0, y:0, fx:0, fy:0, fz:0, top:0, H:100, d:1e9, cl:0},
  rear:{mode:'auto', rt:null, cam:null, mat:null, n:0, every:3, ms:0, msMax:0, calls:0, live:false, pip:false, ready:false, el:null, rect:null, rk:0},
  ms:0, mode:'', last:{p:new THREE.Vector3(), k:new THREE.Vector3(), fov:60}};
const _dv = new THREE.Vector3(), _dv2 = new THREE.Vector3(), _dv3 = new THREE.Vector3(), _dq = new THREE.Quaternion(), _de = new THREE.Euler(0, 0, 0, 'YXZ'), _dm = new THREE.Matrix4();
const dcNames = () => F1.veh === 'car' ? DCN.car : DCN.f1;
const dcEase = t => t <= 0 ? 0 : t >= 1 ? 1 : t*t*(3 - 2*t);
// ---- the creature: SGKaiju's posed body (body() spheres, the head) or its position
function dcKai(){
  const K = DC.K; K.on = false;
  try { const S = window.SGKaiju; if (!S || !S.on) return K; const G = S._ && S._.KG && S._.KG.G, P = G && G.P; if (!P || !isFinite(P.x)) return K;
    let cx = P.x, cy = P.y, top = (P.z || 0) + 80, fx = P.x, fy = P.y, fz = top;
    const B = typeof S.body === 'function' ? S.body() : null;
    if (B && B.length){ let sx = 0, sy = 0, sw = 0, tz = -1e9; for (const b of B){ if (!b || !isFinite(b.x)) continue; const w = b.r*b.r + 1; sx += b.x*w; sy += b.y*w; sw += w; if (b.z + b.r > tz){ tz = b.z + b.r; fx = b.x; fy = b.y; fz = b.z; } } if (sw > 0){ cx = sx/sw; cy = sy/sw; top = tz; } }
    const O = G.O; if (O && O.head && isFinite(O.head[0]) && (O.head[0] || O.head[1])){ fx = O.head[0]; fy = O.head[1]; fz = O.head[2]; top = Math.max(top, fz + 8); }
    const g0 = gnd(cx, cy); K.on = true; K.x = cx; K.y = cy; K.fx = fx; K.fy = fy; K.fz = fz; K.top = top; K.H = Math.max(25, top - Math.max(g0, -2)); K.d = Math.hypot(CAR.x - cx, CAR.y - cy);
    K.cl = sstep(1.3*K.H + 90, 0.45*K.H + 25, K.d);   // 0 far .. 1 very close (a 100 m creature: from 220 m to 70 m)
  } catch (e){ K.on = false; }
  return K;
}
// ---- car-local <-> world (three.js coordinates; the car's yaw only)
function dcToLocal(out, w, C){ const cs = Math.cos(C.psi), sn = Math.sin(C.psi), dx = w.x - C.x, dy = w.y - carZ(C), dz = w.z + C.y; return out.set(dx*cs - dz*sn, dy, dx*sn + dz*cs); }
function dcToWorld(out, l, C){ const cs = Math.cos(C.psi), sn = Math.sin(C.psi); return out.set(C.x + l.x*cs + l.z*sn, carZ(C) + l.y, -C.y - l.x*sn + l.z*cs); }
// a pose in the car frame: local eye point and a direction (theta: from the nose towards the right, pitch up) -> CV.pos / CV.q (with the car's attitude)
function dcLocalPose(lx, ly, lz, th, pit){
  const C = CAR; carMat(_mc, C.x, C.y, carZ(C), C.psi, C.pitch, C.roll); _q2.setFromRotationMatrix(_mc);
  _v.set(lx, ly, lz).applyMatrix4(_mc); CV.pos.copy(_v); _de.set(pit, -PI/2 - th, 0, 'YXZ'); _dq.setFromEuler(_de); CV.q.copy(_q2).multiply(_dq);
}
const dcLook = (p, t) => { _mlook.lookAt(p, t, _UP); CV.q.setFromRotationMatrix(_mlook); };
// the aim point of the current CV pose (10 m ahead)
const dcAim = out => out.set(0, 0, -10).applyQuaternion(CV.q).add(CV.pos);
// ---- the new cameras. They set CV.pos / CV.q and return {fov (vertical), near}
const DCR = {fov:60, near:0.8};
function dcChaseDims(){ if (F1.veh === 'car'){ const g = RCAR[RCM.key].g; return [g.chase[0], g.chase[1], g.xf + (g.mx || 0), g.xr + (g.mx || 0)]; } return [6.6, 1.95, 2.9, -2.6]; }
function dcThreat(dt){
  const C = CAR, K = DC.K, T = DC.thr, dm = dcChaseDims(); if (!K.on) return null;
  let ux = C.x - K.x, uy = C.y - K.y; const D = Math.hypot(ux, uy) || 1; ux /= D; uy /= D;
  // away from the creature, swung a little to one side and towards behind the car (still drivable)
  let az = Math.atan2(uy, ux) + 0.45, ab = C.psi + PI; az = az + wrapA(ab - az)*0.28;
  let d = dm[0]*1.3 + 1.5; const h = dm[1] + 1.1 + 1.6*sstep(150, 500, K.d), z0 = carZ(C);
  // room for the camera: of five bearings round the preferred one, the freest (a wall right behind the camera is no view), every 0.4 s
  T.ev = (T.ev || 0) - dt; if (T.a === null || T.ev <= 0){ T.ev = 0.4; let best = -1e9;
    for (const o of [0, -0.5, 0.5, -1.0, 1.0]){ const a = az + o, f = biRay(C.x, C.y, C.x + Math.cos(a)*(d + 4), C.y + Math.sin(a)*(d + 4), z0, z0 + h + 1), sc = Math.min(1, f*(d + 4)/d)*10 - Math.abs(o)*3.2 - (T.a !== null && Math.abs(wrapA(a - T.a)) > 0.3 ? 0.8 : 0);
      if (sc > best){ best = sc; T.o = o; } } }
  az += T.o || 0;
  if (T.a === null){ T.a = az; T.fov = 62; T.h = 0; } T.a += wrapA(az - T.a)*Math.min(1, dt*1.5);
  const ex = C.x + Math.cos(T.a)*d, ey = C.y + Math.sin(T.a)*d; { const f = biRay(C.x, C.y, ex, ey, z0, z0 + h + 1); if (f < 1) d = Math.max(3, f*d - 0.8); }
  const cx = C.x + Math.cos(T.a)*d, cy = C.y + Math.sin(T.a)*d, cz = Math.max(z0 + h, gnd(cx, cy) + 1.0);
  CV.pos.set(cx, cz, -cy);
  // aim between the car and the creature's head, the field of view wide enough for both
  // (when both do not fit in 96 deg - the creature right over us - the car stays ~25 deg off the aim, clear of the dashboard HUD, and
  // the head goes out at the top)
  _dv.set(C.x, z0 + 0.8, -C.y).sub(CV.pos).normalize(); _dv2.set(K.fx, K.fz, -K.fy).sub(CV.pos).normalize();
  const ang = Math.acos(clamp(_dv.dot(_dv2), -1, 1)), tk = ang > 1e-3 ? lerp(0.45, Math.min(0.45, 0.44/ang), sstep(1.3, 1.65, ang)) : 0;
  _v2.crossVectors(_dv, _dv2); if (_v2.lengthSq() > 1e-9){ _v2.normalize(); _dv3.copy(_dv).applyAxisAngle(_v2, tk*ang); } else _dv3.copy(_dv);
  if (_dv3.y > 0.8){ _dv3.y = 0.8; _dv3.normalize(); }
  dcLook(CV.pos, _v.copy(CV.pos).add(_dv3));
  const a = Math.max(0.5, camera.aspect || innerWidth/innerHeight); let need = 0;
  for (const w of [_dv, _dv2]){ _v2.copy(w).applyQuaternion(_dq.copy(CV.q).invert()); const z = Math.max(0.05, -_v2.z); need = Math.max(need, Math.abs(Math.atan(_v2.y/z)), Math.abs(Math.atan(_v2.x/z/a))); }
  const vf = clamp(need*2*180/PI + 12, 52, 96); T.fov += (vf - T.fov)*Math.min(1, dt*2.2);
  DCR.fov = T.fov; DCR.near = 0.8; return DCR;
}
function dcSide(dt){
  const C = CAR, S = DC.side, dm = dcChaseDims(), z0 = carZ(C), K = DC.K;
  // the side away from the creature (it fills the background), else the side with room; hysteresis
  let want = S.s;
  if (K.on){ const lat = (K.x - C.x)*(-Math.sin(C.psi)) + (K.y - C.y)*Math.cos(C.psi); if (Math.abs(lat) > 0.3*K.d) want = lat > 0 ? -1 : 1; }
  S.sw = want !== S.s ? S.sw + dt : 0; if (S.sw > 1.5){ S.s = want; S.sw = 0; }
  const L = 7.4 + dm[0]*0.22, tgt = S.s*1.75;   // +-100 deg from the nose (a little behind the side), the whole car in frame
  if (S.a === null) S.a = tgt; S.a += wrapA(tgt - S.a)*Math.min(1, dt*1.2);
  let d = L; const ex = C.x + Math.cos(C.psi + S.a)*d, ey = C.y + Math.sin(C.psi + S.a)*d;
  { const f = biRay(C.x, C.y, ex, ey, z0, z0 + 2.5); if (f < 1){ d = Math.max(2.8, f*d - 0.6); S.blk += dt; if (S.blk > 0.8 && !K.on){ S.s = -S.s; S.blk = 0; } } else S.blk = 0; }
  const cx = C.x + Math.cos(C.psi + S.a)*d, cy = C.y + Math.sin(C.psi + S.a)*d, cz = Math.max(z0 + 1.75 + 0.05*Math.sin(performance.now()/1000*1.3), gnd(cx, cy) + 0.9);   // over the roofs of the traffic alongside
  CV.pos.set(cx, cz, -cy); const lead = 0.5 + Math.min(1.6, Math.abs(C.u)*0.03);
  dcLook(CV.pos, _v.set(C.x + Math.cos(C.psi)*lead, z0 + 0.75, -(C.y + Math.sin(C.psi)*lead)));
  DCR.fov = 44; DCR.near = 0.8; return DCR;
}
function dcBumper(back){
  const dm = dcChaseDims(), car = F1.veh === 'car', k = car ? RCAR[RCM.key].kind : 'f1';
  const h = !car ? 0.3 : k === 'bus' ? 1.0 : k === 'motorbike' ? 0.85 : RCAR[RCM.key].g.r + 0.14;
  dcLocalPose(back ? dm[3] - 0.08 : dm[2] + 0.08, h, 0, back ? PI : 0, back ? -0.06 : -0.025);
  DCR.fov = hfovToV(108); DCR.near = 0.3; return DCR;
}
// ---- the look-back poses (local position + aim) for each kind of view
function dcKind(i){ const car = F1.veh === 'car'; if (car){ if (i === 2) return 'cabin'; if (i === 1) return 'roof'; } else if (i === 0 || i === 1) return 'f1ck'; return i === 5 ? 'bumper' : 'ext'; }
function dcLbTheta(sideSign){
  // the creature's bearing in the car frame (0 nose, +pi/2 right); behind: aim at it, else straight back; turn over the inboard shoulder
  const C = CAR, K = DC.K; let th = PI;
  if (K.on){ const dx = K.fx - C.x, dy = K.fy - C.y, b = Math.atan2(dx*Math.sin(C.psi) - dy*Math.cos(C.psi), dx*Math.cos(C.psi) + dy*Math.sin(C.psi)); if (Math.abs(b) > 1.75) th = b; }
  if (sideSign < 0){ if (th < 0) th += TAU; th = clamp(th, 2.2, 4.0); } else { if (th > 0) th -= TAU; th = clamp(th, -4.0, -2.2); }
  return th;
}
function dcLbPitch(lp){ const C = CAR, K = DC.K; if (!K.on) return -0.05; const d = Math.hypot(K.fx - C.x, K.fy - C.y) || 1; return clamp(Math.atan2(K.fz - (carZ(C) + lp), d)*0.7, -0.08, 0.42); }
function dcPost(dt, fov, near){
  const C = CAR, K = DC.K, cur = F1.cam, car = F1.veh === 'car';   // DC.K: queried once per frame in camStep
  if (DC.lb === 0){ let sg = 1; if (K.on){ const lat = (K.x - C.x)*(-Math.sin(C.psi)) + (K.y - C.y)*Math.cos(C.psi); sg = lat > 0 ? 1 : -1; } DC.lbSg = sg; }   // local +z = right: swing on the creature's far side
  // look back: a head turn (0.35 s) in the cabin / cockpit, a 0.6 s swing round the car outside (smoothstep in time)
  const kind = dcKind(cur), lbDur = kind === 'cabin' || kind === 'f1ck' ? 0.35 : kind === 'roof' ? 0.4 : 0.6;
  DC.lb = clamp(DC.lb + (DC.lbOn ? 1 : -1)*dt/lbDur, 0, 1); DC.lbE = dcEase(DC.lb);
  if (CV.t < 1){ DC.bt = 1; DC.last.fov = fov; return {fov, near}; }
  const e = DC.lbE;
  if (e > 0){
    if (kind === 'cabin'){
      // the driver turns: the eye moves inboard and a little up, the yaw sweeps over the shoulder
      const g = RCAR[RCM.key].g, eye = g.eye, sg = eye[2] < 0 ? -1 : 1, th = dcLbTheta(sg), pit = RCAR[RCM.key].kind === 'bus' ? -0.06 : dcLbPitch(eye[1]);   // (a bus: along the saloon to its back window)
      dcLocalPose(eye[0] + 0.06*e, eye[1] + 0.03*e, eye[2]*(1 - 0.75*e), th*e, lerp(-0.07, pit, e)); near = Math.min(near, 0.75);
    } else {
      _v3b.copy(CV.pos); dcAim(_v3c); dcToLocal(_lp0, _v3b, C); dcToLocal(_lk0, _v3c, C);
      if (kind === 'roof' || kind === 'f1ck'){ const g = car ? RCAR[RCM.key].g : null, y = car ? (g.bonnetY !== undefined ? g.bonnetY : RCM.G.bonnetY) + (g.kind === 'bus' ? 1.3 : 0.62) : 1.13, x = car ? g.xr*0.25 : -0.95;
        dcLocalPose(x, y, 0, PI, -0.09 + dcLbPitch(y)*0.5); }
      else if (kind === 'bumper') dcBumper(true);
      else { const dm = dcChaseDims(), d = dm[0]*0.95, h = dm[1] + 0.55, z0 = carZ(C), fx = Math.cos(C.psi), fy = Math.sin(C.psi);
        let dd = d; { const f = biRay(C.x, C.y, C.x + fx*d, C.y + fy*d, z0, z0 + h + 1); if (f < 1) dd = Math.max(2.6, f*d - 0.6); }
        const px = C.x + fx*dd, py = C.y + fy*dd; CV.pos.set(px, Math.max(z0 + h, gnd(px, py) + 0.8), -py);
        if (K.on) _v.set(lerp(C.x - fx*25, K.fx, 0.3), lerp(z0 + 1.5, K.fz, 0.25), -lerp(C.y - fy*25, K.fy, 0.3)); else _v.set(C.x - fx*25, z0 + 1.2, -(C.y - fy*25));
        dcLook(CV.pos, _v); }
      if (e < 1){ dcToLocal(_lp1, CV.pos, C); dcAim(_v3c); dcToLocal(_lk1, _v3c, C);
        // outside: swing round the car (polar angle, radius and height), on one side for the whole turn; the aim slides across
        if (kind === 'ext' || kind === 'bumper'){ const a0 = Math.atan2(_lp0.z, _lp0.x), a1 = Math.atan2(_lp1.z, _lp1.x), r0 = Math.hypot(_lp0.x, _lp0.z), r1 = Math.hypot(_lp1.x, _lp1.z);
          let da = wrapA(a1 - a0); if (Math.abs(da) > 2.4) da = DC.lbSg*Math.abs(da); const an = a0 + da*e, rr = Math.max(lerp(r0, r1, e), 2.4 + 0.6*Math.sin(PI*e));
          _lp1.set(Math.cos(an)*rr, lerp(_lp0.y, _lp1.y, e) + 0.6*Math.sin(PI*e), Math.sin(an)*rr); }
        else _lp1.lerpVectors(_lp0, _lp1, e);
        _lk1.lerpVectors(_lk0, _lk1, e); dcToWorld(CV.pos, _lp1, C); dcLook(CV.pos, dcToWorld(_v3c, _lk1, C)); }
      if (kind === 'bumper') near = Math.min(near, 0.3);
      fov = lerp(fov, kind === 'ext' ? hfovToV(84) : kind === 'bumper' ? hfovToV(108) : hfovToV(92), e);
    }
  }
  // switching cameras: blend from where the last view was (car-relative position and aim)
  if (DC.bt < 1){ DC.bt = Math.min(1, DC.bt + dt/0.55); const k = dcEase(DC.bt);
    dcToLocal(_lp1, CV.pos, C); dcAim(_v3c); dcToLocal(_lk1, _v3c, C); _lp1.lerpVectors(DC.bp, _lp1, k); _lk1.lerpVectors(DC.bk, _lk1, k);
    dcToWorld(CV.pos, _lp1, C); dcLook(CV.pos, dcToWorld(_v3c, _lk1, C)); fov = lerp(DC.bfov, fov, k); near = Math.min(near, 0.3 + 0.7*k); }
  // speed: a wider view; the creature close: a slow dolly-zoom (outside views: pulled back to keep the car's size) and a heartbeat
  const kmh = Math.abs(C.u)*3.6, out = kind === 'ext' && e < 0.5, sp = Math.pow(Math.min(1, kmh/260), 1.2)*(out ? 7 : 4.5);
  DC.fovS += (sp - DC.fovS)*Math.min(1, dt*1.5); DC.dz += ((K.on ? K.cl : 0) - DC.dz)*Math.min(1, dt*(K.on ? 0.8 : 2));
  let f2 = fov + DC.fovS;
  if (DC.dz > 0.002){
    const f3 = f2*(1 - (cur === 4 ? 0 : out ? 0.22 : 0.08)*DC.dz);   // (the threat camera keeps its framing of both: only the heartbeat)
    if (out && cur !== 3 && cur !== 4){ _dv.set(C.x, carZ(C) + 0.8, -C.y); const off = _dv2.copy(CV.pos).sub(_dv), d0 = Math.max(0.5, off.length()), d1 = Math.min(d0 + 9, d0*Math.tan(f2*PI/360)/Math.tan(f3*PI/360));
      const nx = _dv.x + off.x/d0*d1, nz = _dv.z + off.z/d0*d1; if (biRay(C.x, C.y, nx, -nz, carZ(C), carZ(C) + 2) >= 1){ CV.pos.copy(_dv).addScaledVector(off, d1/d0); f2 = f3; } else f2 = lerp(f2, f3, 0.4); }
    else f2 = f3;
    DC.beat += dt*(1.1 + 1.3*DC.dz); const ph = DC.beat % 1, pulse = Math.exp(-ph*14)*(1 - Math.exp(-ph*60)) + 0.6*Math.exp(-Math.max(0, ph - 0.22)*16)*(ph > 0.22 ? 1 : 0);
    f2 += pulse*1.6*DC.dz; }
  fov = clamp(f2, 22, 110);
  // shake: impacts above 1.5 m/s and the road at speed -> smooth noise (three sines per axis), capped
  if (C.hit > 1.5){ const k = clamp((C.hit - 1.5)/9, 0, 1); if (k > DC.sh){ DC.sh = k; for (let i = 0; i < 6; i++) DC.shR[i] = Math.random()*TAU; } }
  DC.sh *= Math.exp(-dt*4.5); DC.shT += dt;
  const ins = kind === 'cabin' || kind === 'f1ck', vib = Math.min(1, kmh/260)*(ins ? 0.14 : 0.05), amp = Math.min(1, DC.sh + vib);
  if (amp > 0.001){ const t = DC.shT, R = DC.shR, n = (a, b, c) => 0.6*Math.sin(t*a + R[b]) + 0.4*Math.sin(t*c + R[(b + 3) % 6]);
    const ar = (ins ? 0.012 : 0.007)*amp, ap = (ins ? 0.004 : 0.02)*amp;
    _de.set(clamp(ar*n(71, 0, 109), -0.02, 0.02), clamp(ar*n(83, 1, 47), -0.02, 0.02), clamp(0.6*ar*n(59, 2, 97), -0.012, 0.012), 'YXZ'); _dq.setFromEuler(_de); CV.q.multiply(_dq);
    _dv.set(clamp(ap*n(53, 3, 89), -0.03, 0.03), clamp(ap*n(67, 4, 113), -0.03, 0.03), 0).applyQuaternion(CV.q); CV.pos.add(_dv); }
  // remember the final pose (car-relative) for the next switch
  dcToLocal(DC.last.p, CV.pos, C); dcAim(_v3c); dcToLocal(DC.last.k, _v3c, C); DC.last.fov = fov;
  return {fov, near};
}
const _v3b = new THREE.Vector3(), _v3c = new THREE.Vector3(), _lp0 = new THREE.Vector3(), _lk0 = new THREE.Vector3(), _lp1 = new THREE.Vector3(), _lk1 = new THREE.Vector3();
// the new cameras inside camStep / rcCam (indices 4..6)
function dcCam(dt){
  const i = F1.cam; let r = null;
  if (i === 4) r = dcThreat(dt);
  else if (i === 5) r = dcBumper(false);
  else if (i === 6) r = dcSide(dt);
  return r;
}
// ---- switching
function dcSetCam(i, instant){
  const n = dcNames(); if (typeof i === 'string') i = n.indexOf(i); if (!(i >= 0 && i < n.length)) return false;
  if (i !== F1.cam && !instant && F1.on && CV.t >= 1){ DC.prev = F1.cam; DC.bp.copy(DC.last.p); DC.bk.copy(DC.last.k); DC.bfov = DC.last.fov; DC.bt = 0; }
  else if (instant) DC.bt = 1;
  F1.cam = i; CV.cpsi = CAR.psi; if (F1.veh === 'car' && RCM.key) CV.chD = RCAR[RCM.key].g.chase[0];
  DC.thr.a = null; DC.side.a = null; hudCam(); return true;
}
function dcCycle(dir){
  const ord = [0, 1, 2, 4, 6, 5].filter(i => i !== 4 || DC.K.on), n = ord.length; let k = ord.indexOf(F1.cam); if (k < 0) k = dir > 0 ? -1 : 0;
  dcSetCam(ord[(k + dir + n) % n]);
}
function dcThreatToggle(){ if (F1.cam === 4) dcSetCam(DC.tPrev !== undefined && DC.tPrev !== 4 ? DC.tPrev : 0); else { DC.tPrev = F1.cam; dcSetCam(4); } if (!DC.K.on) flash('没有怪兽 · 追尾视角 · No creature: chase view', 1.4); }
function dcLb(on, src){
  const L = DC.lbs, now = performance.now()/1000; void src;
  if (on){ if (DC.lbLatch){ DC.lbLatch = false; DC.lbOn = false; L.skip = true; } else { DC.lbOn = true; L.t0 = now; L.skip = false; } }
  else { if (L.skip) L.skip = false; else if (DC.lbOn && now - L.t0 < 0.28) DC.lbLatch = true; else DC.lbOn = false; }
  hudCam(); dcBtn();
}
function dcRearMode(m){
  const R = DC.rear, M = ['auto', 'on', 'off']; R.mode = m && M.includes(m) ? m : M[(M.indexOf(R.mode) + 1) % 3];
  if (!m) flash(R.mode === 'auto' ? '后视 自动（怪兽出现时）· Rear view auto (with a creature)' : R.mode === 'on' ? '后视镜 实时 + 画中画 开 · Rear view on' : '后视 关 · Rear view off', 1.3);
  return R.mode;
}
function dcKey(c, e){
  if (c === 'KeyB'){ if (!e.repeat) dcLb(true, 'key'); return true; }
  if (c === 'KeyV'){ if (!e.repeat) dcThreatToggle(); return true; }
  if (c === 'KeyP'){ if (!e.repeat) dcRearMode(); return true; }
  const m = /^Digit([1-7])$/.exec(c); if (m){ if (!e.repeat) dcSetCam(+m[1] - 1); return true; }
  return false;
}
function dcReset(){ DC.lbOn = DC.lbLatch = false; DC.lb = DC.lbE = 0; DC.bt = 1; DC.prev = -1; DC.thr.a = null; DC.side.a = null; DC.sh = 0; DC.dz = 0; DC.fovS = 0; if (DC.rear.el) DC.rear.el.hidden = true; DC.rear.ready = false; dcBtn(); }
// ---- which overlay pass: road car 0 none / 1 the body (bonnet) / 2 the body and the cabin; F1 -1 none / 0 cockpit / 1 with the helmet
function dcOvRC(){
  if (!F1.on || F1.veh !== 'car' || CV.t < 0.85) return 0;
  const cur = F1.cam, pv = DC.bt < 1 ? DC.prev : -1;
  if (RCM.extM){ if (!RCM.CX) return 0; return ((cur === 2 && DC.bt >= 0.5) || (pv === 2 && DC.bt < 0.5)) ? 2 : 0; }
  if (cur === 2 || pv === 2) return 2;
  if (cur === 1 || pv === 1) return 1;
  return 0;
}
// the camera inside the cabin (within 0.75 m of the driver's eye)? The overlay then draws the body without the lid over the cabin
function dcCamInCab(){ if (F1.veh !== 'car' || !RCM.key) return false; const e = RCAR[RCM.key].g.eye; dcToLocal(_dv3, camera.position, CAR); return Math.hypot(_dv3.x - e[0], _dv3.y - e[1], _dv3.z - e[2]) < 0.75; }
function dcHideBody(){ if (!F1.on || F1.veh !== 'car' || CV.t < 0.85) return false; if (RCM.extM && !RCM.CX) return F1.cam === 2 && DC.bt >= 0.5; return dcOvRC() === 2; }
function dcOvF1(){
  if (!F1.on || F1.veh === 'car' || CV.t < 0.85) return -1; const cur = F1.cam, pv = DC.bt < 1 ? DC.prev : -1;
  if (cur > 1 && !(pv === 0 || pv === 1)) return -1;
  return ((cur === 0 && DC.bt >= 0.5) || (pv === 0 && DC.bt < 0.5)) && DC.lbE < 0.3 ? 0 : 1;
}
// ---- the cabins: geometry per car (RCGEO cars in rcGeo; the pickup separately), the overlay extras (hands, sleeves, needles, mirrors)
function dcCabGeo(key, g){
  const H = F1GEO.H;
  try { const c = RCINT.car(key, g); return {int:H.toGeo(c.int), steer:H.toGeo(c.steer), sw:c.sw, cab:dcCabPack(c)}; }
  catch (e){ console.warn('[f1d] cabin', e); return {int:H.toGeo(g.int), steer:H.toGeo(g.steer), sw:g.sw}; }
}
function dcCabPack(c){
  const H = F1GEO.H, mg = new THREE.BufferGeometry(), P = [], UV = [], I = [];
  for (const m of c.mir){ const v0 = P.length/3;
    for (const [s, t] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]){ for (let k = 0; k < 3; k++) P.push(m.c[k] + m.U[k]*s*m.hu + m.V[k]*t*m.hv); UV.push(s < 0 ? m.u1 : m.u0, t < 0 ? m.v0 : m.v1); }
    // facing N (towards the eye)
    const a = [P[v0*3 + 3] - P[v0*3], P[v0*3 + 4] - P[v0*3 + 1], P[v0*3 + 5] - P[v0*3 + 2]], b = [P[v0*3 + 6] - P[v0*3], P[v0*3 + 7] - P[v0*3 + 1], P[v0*3 + 8] - P[v0*3 + 2]];
    const n = [a[1]*b[2] - a[2]*b[1], a[2]*b[0] - a[0]*b[2], a[0]*b[1] - a[1]*b[0]]; if (n[0]*m.N[0] + n[1]*m.N[1] + n[2]*m.N[2] > 0) I.push(v0, v0 + 1, v0 + 2, v0, v0 + 2, v0 + 3); else I.push(v0, v0 + 2, v0 + 1, v0, v0 + 3, v0 + 2); }
  mg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); mg.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); mg.setIndex(I); mg.computeBoundingSphere();
  return {hands:H.toGeo(c.hands), mir:mg, gauges:c.gauges, tilt:c.tilt, R0:c.R0, wrist:c.wrist, shoulder:c.shoulder, cabP:c.cab, rearCam:c.rearCam, eye:c.eye || null, bars:!!c.bars, open:!!c.open, own:!!c.own, tris:c.int.idx.length/3 + c.steer.idx.length/3 + c.hands.idx.length/3};
}
function dcCabInit(){
  const H = F1GEO.H; if (RCM.ovHands) return;
  RCM.ovHands = new THREE.Mesh(new THREE.BufferGeometry(), matRC); RCM.ovArms = new THREE.InstancedMesh(H.toGeo(RCINT.sleeve()), matRC, 4); RCM.ovNdl = new THREE.InstancedMesh(H.toGeo(RCINT.needle()), matRC, 2);
  dcRearEnsure(); RCM.ovMir = new THREE.Mesh(new THREE.BufferGeometry(), DC.rear.mat);
  for (const m of [RCM.ovHands, RCM.ovArms, RCM.ovNdl, RCM.ovMir]){ m.frustumCulled = false; m.matrixAutoUpdate = false; m.visible = false; OV.scene.add(m); }
  for (const m of [RCM.ovArms, RCM.ovNdl]) m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
}
// a vehicle drawn by the traffic module with its own cabin (the pickup, the motorbike's rider view); built when chosen
function dcCabKey(key){
  RCM.CX = null; if (!RCAR[key] || !RCAR[key].ext) return;
  const H = F1GEO.H; RCM.cabX = RCM.cabX || {};
  if (!(key in RCM.cabX)){ let X = null; try { const c = key === 'pickup' ? RCINT.pickup() : key === 'moto' ? RCINT.moto() : key === 'bus' ? RCINT.bus() : null; if (c){ c.eye = RCAR[key].g.eye; X = {int:H.toGeo(c.int), steer:H.toGeo(c.steer), sw:c.sw, cab:dcCabPack(c)}; } } catch (e){ console.warn('[f1d] cabin', key, e); } RCM.cabX[key] = X; }
  RCM.CX = RCM.cabX[key];
}
// per frame in the cabin view: the hands on the rim (they follow the wheel within +-110 deg), the sleeves (two-bone arms from the
// shoulders), the needles, the mirrors, the cabin light
const _ha = [new THREE.Vector3(), new THREE.Vector3()], _hs = new THREE.Vector3(), _he = new THREE.Vector3(), _hd = new THREE.Vector3(), _hp = new THREE.Vector3(), _hb = new THREE.Vector3(), _hm = new THREE.Matrix4();
function dcCabFrame(G, mc, spin){
  const cab = G.cab; if (!cab) return;
  const hs = clamp(spin, -0.95, 0.95);   // the hands turn with the wheel up to ~55 deg, then the rim slides through them _e.set(-hs, 0, cab.tilt, 'ZXY'); _q.setFromEuler(_e); _p.set(G.sw[0], G.sw[1], G.sw[2]); _s.set(1, 1, 1); _ml.compose(_p, _q, _s);
  RCM.ovHands.geometry = cab.hands; RCM.ovHands.matrix.multiplyMatrices(mc, _ml); RCM.ovHands.matrixWorldNeedsUpdate = true; RCM.ovHands.visible = true;
  for (let s = 0; s < 2; s++){ const W = _ha[s].set(cab.wrist[s][0], cab.wrist[s][1], cab.wrist[s][2]).applyMatrix4(_ml), S = _hs.set(cab.shoulder[s][0], cab.shoulder[s][1], cab.shoulder[s][2]);
    const a = 0.3, b = 0.29, dir = _hd.copy(W).sub(S), d = Math.min(a + b - 1e-3, dir.length()); dir.normalize();
    const pole = _hp.set(0, -1, s ? 0.6 : -0.6), pp = pole.addScaledVector(dir, -pole.dot(dir)).normalize(), ca = (a*a + d*d - b*b)/(2*a*d), sa = Math.sqrt(Math.max(0, 1 - ca*ca));
    _he.copy(S).addScaledVector(dir, a*ca).addScaledVector(pp, a*sa);
    for (const [k, p, q] of [[s*2, W, _he], [s*2 + 1, _he, S]]){ const z = _hb.copy(q).sub(p), L = z.length(); z.normalize(); const x = _v2.set(0, 1, 0).cross(z); if (x.lengthSq() < 1e-6) x.set(1, 0, 0); x.normalize(); const y = _v.copy(z).cross(x);
      _hm.makeBasis(x, y, z.multiplyScalar(L)).setPosition(p); if (k % 2) _hm.scale(_dv.set(1.12, 1.12, 1)); RCM.ovArms.setMatrixAt(k, _dm.multiplyMatrices(mc, _hm)); } }
  RCM.ovArms.instanceMatrix.needsUpdate = true; RCM.ovArms.matrixWorldNeedsUpdate = true; RCM.ovArms.visible = true; RCM.ovArms.matrix.identity();
  const C = CAR, rc = RCP, gs = cab.gauges;
  for (let k = 0; k < 2 && k < gs.length; k++){ const g = gs[k], f = g.kind === 'speed' ? clamp(Math.abs(C.u)*2.23694/160, 0, 1) : clamp(rc.gears ? ((C.rpm || 0) - 0)/(rc.rpmMax || 7000) : 0.12 + 0.88*Math.abs(C.thr || 0)*Math.min(1, Math.abs(C.u)/6 + 0.2), 0, 1);
    const t = 5*PI/4 - f*1.5*PI, ct = Math.cos(t), st = Math.sin(t), ux = g.U[0]*ct + g.V[0]*st, uy = g.U[1]*ct + g.V[1]*st, uz = g.U[2]*ct + g.V[2]*st, vx = -g.U[0]*st + g.V[0]*ct, vy = -g.U[1]*st + g.V[1]*ct, vz = -g.U[2]*st + g.V[2]*ct;
    _hm.set(ux*g.r, vx, g.N[0], g.c[0] + g.N[0]*0.002, uy*g.r, vy, g.N[1], g.c[1] + g.N[1]*0.002, uz*g.r, vz, g.N[2], g.c[2] + g.N[2]*0.002, 0, 0, 0, 1); RCM.ovNdl.setMatrixAt(k, _dm.multiplyMatrices(mc, _hm)); }
  RCM.ovNdl.instanceMatrix.needsUpdate = true; RCM.ovNdl.matrix.identity(); RCM.ovNdl.matrixWorldNeedsUpdate = true; RCM.ovNdl.visible = true;
  const R = DC.rear; RCM.ovMir.visible = R.live && R.ready; if (RCM.ovMir.visible){ RCM.ovMir.geometry = cab.mir; RCM.ovMir.matrix.copy(mc); RCM.ovMir.matrixWorldNeedsUpdate = true; }
  // the cabin light: displays' spill and an ambient strip at night (a term of the road car material, in the overlay only)
  const nf = typeof nightF === 'number' ? nightF : 0, ck = cab.open ? 0.25 : 1; RU.cab.value.set((0.10 + 0.32*nf)*ck, (0.14 + 0.42*nf)*ck, (0.22 + 0.62*nf)*ck, 0.15 + 0.85*sstep(0.1, 0.6, nf));   // (an open motorbike: only the clocks' glow)
  _dv.set(cab.cabP[0], cab.cabP[1], cab.cabP[2]).applyMatrix4(mc).applyMatrix4(OV.cam.matrixWorldInverse); RU.cabP.value.copy(_dv);
}
function dcCabHide(){ for (const m of [RCM.ovHands, RCM.ovArms, RCM.ovNdl, RCM.ovMir]) if (m) m.visible = false; RU.cab.value.set(0, 0, 0, 0); }
// ---- the rear view: a small render target from behind the car, every third frame
function dcRearEnsure(){
  const R = DC.rear; if (R.rt) return;
  R.rt = new THREE.WebGLRenderTarget(384, 128, {minFilter:THREE.LinearFilter, magFilter:THREE.LinearFilter, generateMipmaps:false, depthBuffer:true, stencilBuffer:false});
  R.cam = new THREE.PerspectiveCamera(60, 3, 0.5, 1500); R.mat = new THREE.MeshBasicMaterial({map:R.rt.texture, color:new THREE.Color(0.86, 0.88, 0.9), fog:false});
  R.pipScene = new THREE.Scene(); R.pipCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 2); const pg = new THREE.PlaneGeometry(2, 2), uv = pg.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, 1 - uv.getX(i));
  R.pip = false; R.pipMesh = new THREE.Mesh(pg, new THREE.MeshBasicMaterial({map:R.rt.texture, fog:false, depthTest:false, depthWrite:false})); R.pipMesh.position.z = -1; R.pipScene.add(R.pipMesh);
}
function dcRender(){
  const R = DC.rear; R.live = false; R.pip = false;
  if (!F1.on || R.mode === 'off' || CV.t < 0.85){ if (R.el && !R.el.hidden) R.el.hidden = true; return; }
  const car = F1.veh === 'car', ins = car ? dcOvRC() === 2 : dcOvF1() === 0;
  // auto: live only while a creature is out (mirrors and picture-in-picture); P = on: always; without it the mirrors show dark glass
  const want = R.mode === 'on' || DC.K.on;
  R.pip = !ins && DC.lbE < 0.5 && want;
  R.live = (ins && want) || R.pip;
  if (R.el && R.el.hidden === R.pip) R.el.hidden = !R.pip;
  if (!R.live) return;
  dcRearEnsure(); R.every = R.ms > 3.5 ? 6 : 3; if ((R.n++ % R.every) && R.ready) return;   // 20 Hz (10 Hz on a slow device)
  const C = CAR, cabG = car ? (RCM.extM ? RCM.CX : RCM.G) : null, g = car ? RCAR[RCM.key].g : null;
  const rp = cabG && cabG.cab ? cabG.cab.rearCam : car ? [g.xr + (g.mx || 0) - 0.4, (g.bonnetY || 1.2) + 0.6, 0] : [-2.95, 1.05, 0];
  carMat(_mc2, C.x, C.y, carZ(C), C.psi, 0, 0); _q2.setFromRotationMatrix(_mc2); R.cam.position.set(rp[0], rp[1], rp[2]).applyMatrix4(_mc2);
  _de.set(-0.03, PI/2, 0, 'YXZ'); _dq.setFromEuler(_de); R.cam.quaternion.copy(_q2).multiply(_dq); R.cam.updateProjectionMatrix(); R.cam.updateMatrixWorld();
  const t0 = performance.now(), rt0 = renderer.getRenderTarget(), ac = renderer.autoClear, ar = renderer.info.autoReset, su = renderer.shadowMap.autoUpdate, sa = scene.autoUpdate, c0 = renderer.info.render.calls;
  try { renderer.shadowMap.autoUpdate = false; scene.autoUpdate = false; renderer.info.autoReset = false; renderer.autoClear = true; renderer.setRenderTarget(R.rt); renderer.render(scene, R.cam); }
  catch (e){ console.error('[f1d] rear view', e); R.mode = 'off'; }
  finally { renderer.setRenderTarget(rt0); renderer.autoClear = ac; renderer.info.autoReset = ar; renderer.shadowMap.autoUpdate = su; scene.autoUpdate = sa; }
  const ms = performance.now() - t0; R.ms = R.ms ? R.ms*0.9 + ms*0.1 : ms; R.msMax = Math.max(R.msMax*0.995, ms); R.calls = renderer.info.render.calls - c0; R.ready = true;
}
const _sz = new THREE.Vector2();
function dcPip(){
  const R = DC.rear; if (!R.pip || !R.ready || !R.el || R.el.hidden) return;
  if (!R.rect || (R.rk++ % 30) === 0){ const a = R.el.getBoundingClientRect(), b = renderer.domElement.getBoundingClientRect(); R.rect = [a.left - b.left + 2, b.bottom - a.bottom + 2, a.width - 4, a.height - 4]; }
  const [x, y, w, h] = R.rect; if (!(w > 8 && h > 8)) return;
  renderer.getSize(_sz); const ac = renderer.autoClear, ar = renderer.info.autoReset;
  renderer.autoClear = false; renderer.info.autoReset = false; renderer.setViewport(x, y, w, h); renderer.setScissor(x, y, w, h); renderer.setScissorTest(true);
  renderer.render(R.pipScene, R.pipCam);
  renderer.setScissorTest(false); renderer.setViewport(0, 0, _sz.x, _sz.y); renderer.setScissor(0, 0, _sz.x, _sz.y); renderer.autoClear = ac; renderer.info.autoReset = ar;
}
// the F1's mirrors (sidepods) in the cockpit view
function dcMirF1(mc, ck){
  const R = DC.rear; if (!OV.scene) return;
  if (!OV.mirF1){ dcRearEnsure(); const g = new THREE.BufferGeometry(), P = [], UV = [], I = [];
    for (const sd of [-1, 1]){ const v0 = P.length/3, z0 = sd*0.465, z1 = sd*0.59, u0 = sd < 0 ? 0.62 : 0.0, u1 = sd < 0 ? 1.0 : 0.38;
      for (const [z, y, u, v] of [[z0, 0.656, sd < 0 ? u0 : u1, 0.42], [z1, 0.656, sd < 0 ? u1 : u0, 0.42], [z1, 0.687, sd < 0 ? u1 : u0, 0.58], [z0, 0.687, sd < 0 ? u0 : u1, 0.58]]){ P.push(0.3525, y, z); UV.push(u, v); }
      I.push(v0, v0 + 2, v0 + 1, v0, v0 + 3, v0 + 2); }
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setIndex(I);
    OV.mirF1 = new THREE.Mesh(g, new THREE.MeshBasicMaterial({map:R.rt.texture, color:new THREE.Color(0.86, 0.88, 0.9), fog:false, side:THREE.DoubleSide})); OV.mirF1.frustumCulled = false; OV.mirF1.matrixAutoUpdate = false; OV.scene.add(OV.mirF1); }
  OV.mirF1.visible = !!ck && R.live && R.ready; if (OV.mirF1.visible){ OV.mirF1.matrix.copy(mc); OV.mirF1.matrixWorldNeedsUpdate = true; }
}
// ---- the HUD: the look-back button (top row; a round thumb button on touch screens), the rear-view frame, the camera name
const DC_CSS = `.f1pip{position:absolute;right:16px;top:calc(92px + env(safe-area-inset-top,0px));width:min(26vw,300px);aspect-ratio:3/1;border:2px solid rgba(255,255,255,.42);border-radius:9px;box-shadow:0 6px 22px rgba(0,0,0,.35);pointer-events:none;box-sizing:border-box}
.f1pip[hidden]{display:none}
.f1pip span{position:absolute;left:7px;bottom:4px;font:600 9px var(--font-mono);letter-spacing:.08em;color:#fff;text-shadow:0 1px 2px #000;opacity:.85}
.f1b.on{background:rgba(190,60,40,.85)}
.f1lbT{position:absolute;right:16px;bottom:calc(152px + env(safe-area-inset-bottom,0px));width:68px;height:68px;border-radius:50%;border:1px solid rgba(255,255,255,.25);background:rgba(12,17,20,.62);color:#fff;font:700 14px var(--font-ui);display:flex;flex-direction:column;align-items:center;justify-content:center;touch-action:none;cursor:pointer}
.f1lbT small{font:400 8.5px var(--font-mono);opacity:.8;letter-spacing:.06em}
.f1lbT.on{background:rgba(190,60,40,.85)}
@media (max-width:760px){.f1pip{right:auto;left:10px;top:calc(112px + env(safe-area-inset-top,0px));width:44vw}}`;
function dcHud(h){
  const st = document.createElement('style'); st.textContent = DC_CSS; document.head.appendChild(st);
  const q = id => h.querySelector('#' + id); DC.rear.el = q('f1Pip');
  for (const el of [q('f1LbB'), q('f1LbT')]){ if (!el) continue;
    el.addEventListener('pointerdown', e => { try { el.setPointerCapture(e.pointerId); } catch (_){ } el._d = true; dcLb(true, 'btn'); e.preventDefault(); });
    const up = () => { if (!el._d) return; el._d = false; dcLb(false, 'btn'); }; el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('lostpointercapture', up);
    el.addEventListener('click', e => e.preventDefault()); }
}
function dcBtn(){ if (!HUD.el) return; for (const id of ['f1LbB', 'f1LbT']){ const b = HUD.el.querySelector('#' + id); if (b){ b.classList.toggle('on', DC.lbOn); b.setAttribute('aria-pressed', String(DC.lbOn)); } } }
// ---- obstacle providers (window.SGArmy, the creature's feet / legs / tail): oriented boxes collided with in the car's step.
// fn(x, y, r) -> [{id, x, y, hx, hy, hdg, z0, h, m, vx, vy}]: half sizes (m), heading (rad), bottom height z0 (world metres like
// SGF1.CAR.z; default the ground there; 'z' is read too), height h (default 3), mass m (kg; Infinity or missing: immovable), optional
// velocity (m/s: a sweeping limb hits with its own speed). Only boxes the car reaches in height are solid (it passes under a belly).
const OBP = {list:[], hits:0, n:0, err:0, top:1.5, key:'', last:null};
for (let i = 0; i < 32; i++) OBS.push({x:0, y:0, hx:1, hy:0, hl:2, hw:1, z:0, h:0, vx:0, vy:0, w:0, id:0, m:0, crash:false, k:'', ai:null, ext:null});
function obpTop(){
  const k = F1.veh === 'car' ? RCM.key : 'f1'; if (OBP.key === k) return OBP.top; OBP.key = k;
  if (F1.veh !== 'car' || !RCAR[k]){ OBP.top = 0.98; return OBP.top; }
  const Rk = RCAR[k], Gv = Rk.g; let roof = 0; if (Gv.GH) for (const g of Gv.GH) if (g[1]) roof = Math.max(roof, g[1]);
  OBP.top = roof || (Rk.kind === 'bus' ? 3.1 : Rk.kind === 'truck' ? 1.9 : Rk.kind === 'motorbike' ? 1.35 : 1.5); return OBP.top;
}
function obpGather(C, race){
  const top = obpTop(); let n = 0; void race;
  for (const fn of OBP.list){ let L = null; try { L = fn(C.x, C.y, 45); } catch (e){ if (!fn._dcErr) console.error('[f1d] obstacles', e); fn._dcErr = (fn._dcErr || 0) + 1; OBP.err++; continue; } if (!L || !L.length) continue;
    for (const t of L){ if (OBSn >= OBS.length) break; if (!t || !isFinite(t.x) || !isFinite(t.y)) continue;
      const hl = Math.max(0.1, +t.hx || 1), hw = Math.max(0.1, +t.hy || 1), R = 42 + Math.max(hl, hw), dx = t.x - C.x, dy = t.y - C.y; if (dx*dx + dy*dy > R*R) continue;
      const z0 = isFinite(t.z0) ? +t.z0 : isFinite(t.z) ? +t.z : gnd(t.x, t.y), h = t.h > 0 ? +t.h : 3;
      if (z0 > C.z + top + 1 || z0 + h < C.z - 1) continue;   // out of reach in height (the exact test is per sub-step)
      const o = OBS[OBSn++], a = t.hdg || 0; o.x = t.x; o.y = t.y; o.hx = Math.cos(a); o.hy = Math.sin(a); o.hl = hl; o.hw = hw; o.z = z0; o.h = h;
      o.vx = isFinite(t.vx) ? +t.vx : 0; o.vy = isFinite(t.vy) ? +t.vy : 0; o.w = 0; o.id = 0; o.m = t.m > 0 && isFinite(t.m) ? +t.m : 0; o.crash = false; o.k = 'ext'; o.ai = null;
      const X = o.ext || (o.ext = {}); X.fn = fn; X.id = t.id; X.jx = 0; X.jy = 0; X.sp = 0; n++; } }
  OBP.n = n;
}
// per sub-step: does the car (its body from 0.12 m to its roof) reach the box in height?
const obpOut = (o, C) => o.z > C.z + OBP.top - 0.05 || o.z + o.h < C.z + 0.12;
function obpHits(){
  for (let q = 0; q < OBSn; q++){ const o = OBS[q]; if (o.k !== 'ext' || !o.ext || !(o.ext.jx || o.ext.jy)) continue; const X = o.ext; OBP.hits++;
    OBP.last = {id:X.id, jx:Math.round(X.jx), jy:Math.round(X.jy), speed:+X.sp.toFixed(2), t:+CRS.time.toFixed(2)};
    try { if (X.fn.onHit) X.fn.onHit(X.id, {jx:X.jx, jy:X.jy, speed:X.sp}); } catch (e){ if (!X.fn._dcErrH) console.error('[f1d] obstacle hit', e); X.fn._dcErrH = 1; OBP.err++; } X.jx = X.jy = 0; X.sp = 0; }
}
function obpReg(fn, on){ if (typeof fn !== 'function') return OBP.list.length; const i = OBP.list.indexOf(fn); if (on === false){ if (i >= 0) OBP.list.splice(i, 1); return OBP.list.length; } if (i < 0) OBP.list.push(fn); return () => obpReg(fn, false); }
//</DRIVECAM>

/* ================= entering and leaving the drive mode ================= */
function saveApp(){
  F1.saved = {fov:camera.fov, minD:controls.minDistance, maxP:controls.maxPolarAngle, damp:controls.enableDamping, en:controls.enabled, tilt:TILT.on};
  controls.enabled = false; controls.minDistance = 0.01; controls.maxPolarAngle = PI; controls.enableDamping = false;
  keysHeld.clear(); if (spaceHeld){ spaceHeld = false; applyControlMode(); }
  if (tour) startTour(false); fly = null; if (TILT.on) setTilt(false);
  // map labels are hidden while driving; skip their per-frame placement too
  F1.saved.labels = labelItems; labelItems = [];
}
function restoreApp(){
  const S = F1.saved; if (!S) return;
  controls.enabled = S.en; controls.minDistance = S.minD; controls.maxPolarAngle = S.maxP; controls.enableDamping = S.damp; camera.fov = S.fov; camera.updateProjectionMatrix();
  if (!labelItems.length && S.labels) labelItems = S.labels;
  if (S.tilt) setTilt(true); F1.saved = null;
}
function f1Enter(mode, opts){
  try { if (typeof window !== 'undefined' && window.SGFly && window.SGFly.on) window.SGFly.exit(); } catch (e){ }   // v27: one vehicle mode at a time
  if (!SGR.on || !SGR.lines){ showToast('F1 驾驶需要真实新加坡地图 · F1 drive needs the real Singapore map'); return false; }
  if (mode === 'car') return rcEnter(opts || {});
  ensureMeshes(); trackInit(); riCoarse();
  if (mode === 'race' && !TR){ showToast('赛道还没有建好 · The circuit is not ready yet'); return false; }
  const was = F1.on;
  if (!was){ saveApp(); CV.from.copy(camera.position); CV.fromQ.copy(camera.quaternion); CV.t = 0; }
  F1.on = true; F1.mode = mode; F1.veh = 'f1'; if (!AI.length) aiInit(); dmgRepair();
  trafficSuspend(mode === 'race');
  if (mode === 'race'){ raceStart(); F1.cam = 0; }
  else {
    RACE.state = 'off';
    const tx = controls.target.x, ty = -controls.target.z, f = new THREE.Vector3(); camera.getWorldDirection(f);
    if (!spawnFree(tx, ty, [f.x, -f.z])){ if (!spawnFree(sgXY(1.2905, 103.8545)[0], sgXY(1.2905, 103.8545)[1], [1, 0])){ F1.on = false; restoreApp(); showToast('附近没有可以开的路 · No road nearby'); return false; } }
    CAR.odo = 0; CAR.vtop = 0;
  }
  CV.cpsi = CAR.psi; BI.clear(); biPrefetch(CAR.x, CAR.y);
  document.body.classList.add('f1on'); hudShow(true); audStart();
  const tr = $('#tray'); if (tr) tr.classList.add('closed');
  flash(mode === 'race' ? trName().join(' · ') : '城市自由驾驶 · Free drive', 2.2);
  return true;
}
function f1Exit(){
  if (!F1.on) return;
  dcReset();   // [lm28/drivecam]
  F1.on = false; F1.mode = null; RACE.state = 'off'; SCRIPT = null; KEYS.clear(); TOUCH.steer = TOUCH.thr = TOUCH.brk = 0; trafficSuspend(false); if (window.SGTraffic && window.SGTraffic.player) window.SGTraffic.player.on = false; if (DMG.f1m) DMG.f1m.visible = false;
  document.body.classList.remove('f1on'); hudShow(false); audTick(); rcHide(); setTimeout(() => { if (!F1.on && AUD.ctx) AUD.ctx.suspend().catch(() => {}); }, 700);
  restoreApp();
  const C = CAR, b = C.psi; controls.target.set(C.x, C.z, -C.y); camera.position.set(C.x - Math.cos(b)*170, C.z + 125, -(C.y - Math.sin(b)*170)); camera.up.set(0, 1, 0); camera.lookAt(controls.target); controls.update();
  updateMeshes();
}
// [lm22/svdrive] the road car: choose the car, the paint and the start place, spawn in the right-most lane, chase camera first
function rcEnter(o){
  if (!isRC()) return false;
  if (o.car && RCAR[o.car] && rcKeys().includes(o.car)) RCM.carSel = o.car; if (o.col !== undefined && o.col >= 0 && o.col < RC_COLS.length) RCM.col = o.col | 0; if (o.place && rcPlaces().some(p => p.id === o.place)) RCM.place = o.place;
  if (!rcPlaces().some(p => p.id === RCM.place)) RCM.place = rcPlaces()[0].id;
  ensureMeshes(); trackInit(); riCoarse(); rcEnsure(RCM.carSel || 'sedan');
  const was = F1.on;
  if (!was){ saveApp(); CV.from.copy(camera.position); CV.fromQ.copy(camera.quaternion); CV.t = 0; }
  const keep = {on:F1.on, mode:F1.mode, veh:F1.veh};
  F1.on = true; F1.mode = 'free'; F1.veh = 'car'; RACE.state = 'off'; trafficSuspend(false); dmgRepair();
  const p = rcPlaces().find(q => q.id === RCM.place) || rcPlaces()[0];
  let ok = p.lat !== undefined && spawnPlace(p);
  if (!ok){ const tx = controls.target.x, ty = -controls.target.z, f = new THREE.Vector3(); camera.getWorldDirection(f); ok = spawnFree(tx, ty, [f.x, -f.z]);
    if (ok){ CAR.lv = CAR.pv = 0; CAR.shiftT = CAR.shiftW = 0; CAR.park = true; } }
  if (!ok){ Object.assign(F1, keep); if (!was) restoreApp(); showToast('附近没有可以开的路 · No road nearby'); return false; }
  CAR.odo = 0; CAR.vtop = 0; F1.cam = 0; CV.cpsi = CAR.psi; CV.chD = RCAR[RCM.key].g.chase[0]; BI.clear(); biPrefetch(CAR.x, CAR.y); RCM.ind = 0; RCM.limit = 0;
  document.body.classList.add('f1on'); hudShow(true); audStart();
  const tr = $('#tray'); if (tr) tr.classList.add('closed');
  if (window.SGLang && SGLang.mode && SGLang.mode !== 'both'){ const Lp = (a, b) => SGLang.pick(a, b);   // [lm31/i18n] one language
    flash('\u2060' + Lp(isNyc() ? '纽约开车' : '硅谷开车', isNyc() ? 'New York drive' : 'Silicon Valley drive') + ' · ' + Lp(RCAR[RCM.key].zh, RCAR[RCM.key].en) + (p.lat !== undefined ? ' · ' + Lp(p.zh, p.en) : ''), 2.4); } else
  flash(isNyc() ? `纽约开车 · ${RCAR[RCM.key].zh} · ${p.lat !== undefined ? p.zh : 'New York drive'}` : `硅谷开车 · ${RCAR[RCM.key].zh} · ${p.lat !== undefined ? p.zh : 'Silicon Valley drive'}`, 2.4);
  return true;
}
function resetCar(){
  dmgRepair();
  if (F1.mode === 'race' && TR){ const p = trProj(CAR.x, CAR.y, TPJ2); if (p) placePlayerOnTrack(p.s, clamp(p.d, -5, 5), 0); }
  else { spawnFree(CAR.x, CAR.y, [Math.cos(CAR.psi), Math.sin(CAR.psi)], CAR.z); if (F1.veh === 'car'){ CAR.lv = CAR.pv = 0; CAR.shiftT = CAR.shiftW = 0; CAR.park = false; } }
  CV.cpsi = CAR.psi; flash('复位 · Reset', 1);
}

/* ================= HUD ================= */
const F1CSS = `
.dock-tabs{grid-template-columns:repeat(7,1fr)!important}
.dtab.f1tab i{background:#3b2326;color:#ff7d6e}
.dtab.f1tab[aria-selected="true"] i{background:#1f2a2f;color:#ff7d6e}
.f1pick{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.f1card{appearance:none;border:1px solid var(--rule);background:var(--panel);border-radius:9px;padding:10px 11px 9px;text-align:left;cursor:pointer;display:flex;flex-direction:column;gap:3px;color:var(--ink);min-width:0;font:inherit}
.f1card:hover{background:var(--panel-2);border-color:var(--ink)}
.f1card b{font-size:15px;font-weight:700;letter-spacing:.04em;display:flex;align-items:center;gap:7px}
.f1card b i{font-style:normal;display:grid;place-items:center;width:22px;height:22px;border-radius:6px;background:#1f2a2f;color:#ff7d6e;font-size:12px}
.f1card span{font-size:12px;font-weight:500}
.f1card small{font:400 10px/1.45 var(--font-mono);color:var(--muted)}
.f1opts{display:flex;align-items:center;gap:10px;font-size:12px;color:var(--muted);flex-wrap:wrap}
.f1opts .seg{min-width:150px}
body.f1on .panel,body.f1on .stats,body.f1on .dock,body.f1on .timebar,body.f1on .scalebar,body.f1on #labels,body.f1on .uihint{display:none!important}
body.f1on .busy{z-index:9;left:50%;transform:translateX(-50%);top:calc(74px + env(safe-area-inset-top,0px));opacity:.85}
.f1hud{position:fixed;inset:0;z-index:6;overflow:hidden;user-select:none;-webkit-user-select:none;touch-action:none;color:#eef2f3;font-family:var(--font-ui);-webkit-tap-highlight-color:transparent}
.f1hud[hidden]{display:none!important}
.f1p{background:rgba(12,17,20,.74);border:1px solid rgba(255,255,255,.1);border-radius:10px;box-shadow:0 8px 26px rgba(0,0,0,.22)}
.f1top{position:absolute;left:16px;right:16px;top:calc(14px + env(safe-area-inset-top,0px));display:flex;justify-content:space-between;align-items:flex-start;gap:10px;pointer-events:none}
.f1top>*{pointer-events:auto}
.f1info{padding:10px 12px 11px;width:220px;box-sizing:border-box}
.f1hdr{display:flex;align-items:baseline;gap:4px}
.f1hdr b{font:600 26px/1 var(--font-mono)}
.f1hdr small{font:500 12px var(--font-mono);color:#9fb0b8}
.f1hdr span{margin-left:auto;font:500 12px var(--font-mono);color:#cfd8dc;letter-spacing:.06em}
.f1lt{font:500 22px/1.2 var(--font-mono);font-variant-numeric:tabular-nums;margin-top:6px}
.f1lt.inv{color:#9aa4a8;text-decoration:line-through}
.f1secs{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;margin-top:6px}
.f1secs i{font:500 10px/1 var(--font-mono);font-style:normal;text-align:center;padding:4px 0;border-radius:4px;background:rgba(255,255,255,.08);color:#9fb0b8}
.f1secs i.g{background:#1f9d55;color:#fff}.f1secs i.y{background:#c9a227;color:#1b1e1c}.f1secs i.p{background:#8e44ad;color:#fff}.f1secs i.n{background:rgba(255,255,255,.22);color:#fff}
.f1kv{display:grid;grid-template-columns:auto 1fr;gap:3px 10px;margin:8px 0 0;font-size:11px}
.f1kv dt{color:#9fb0b8;white-space:nowrap}.f1kv dd{margin:0;text-align:right;font:500 12px var(--font-mono);font-variant-numeric:tabular-nums;white-space:nowrap}
.f1kv dd.p{color:#d39bf0}
.f1tower{list-style:none;margin:9px 0 0;padding:7px 0 0;border-top:1px solid rgba(255,255,255,.1);display:flex;flex-direction:column;gap:2px;font:500 11px/1.25 var(--font-mono)}
.f1tower li{display:grid;grid-template-columns:18px 4px 1fr auto;gap:6px;align-items:center;color:#cfd8dc;padding:1px 3px;border-radius:3px}
.f1tower li i{height:11px;border-radius:2px}
.f1tower li.me{background:rgba(255,255,255,.14);color:#fff}
.f1tower li small{color:#9fb0b8;font-size:10px}
.f1road b{display:block;font-size:17px;font-weight:700;letter-spacing:.04em;line-height:1.25;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.f1road small{display:block;font:400 10.5px var(--font-mono);color:#9fb0b8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:2px}
.f1road em{font-style:normal;display:inline-block;margin-left:6px;padding:1px 5px;border-radius:3px;background:#f2c14e;color:#1b1e1c;font:600 10px var(--font-mono);vertical-align:2px}
.f1right{display:flex;flex-direction:column;align-items:flex-end;gap:6px}
.f1btns{display:flex;gap:6px}
.f1b{appearance:none;cursor:pointer;color:#eef2f3;padding:6px 10px 5px;display:flex;flex-direction:column;align-items:center;gap:1px;min-width:56px;font:inherit}
.f1b b{font-size:13px;font-weight:600}.f1b small{font:400 8.5px var(--font-mono);color:#9fb0b8;letter-spacing:.06em;white-space:nowrap}
.f1b:hover{background:rgba(40,52,58,.9)}
.f1b.x{background:rgba(150,30,30,.78)}.f1b.x:hover{background:rgba(185,40,40,.9)}
.f1camn{font:500 10.5px var(--font-mono);color:#cfd8dc;padding:3px 8px;border-radius:999px;background:rgba(12,17,20,.6)}
.f1dmg{display:flex;align-items:center;gap:7px;padding:5px 9px;border-radius:10px;font:500 10px var(--font-mono);color:#cfd8dc;background:rgba(12,17,20,.62)}
.f1dmg[hidden]{display:none}
.f1dmg svg{width:22px;height:38px}.f1dmg svg path{fill:#3ddc84;transition:fill .25s}.f1dmg svg path.y{fill:#f2c14e}.f1dmg svg path.o{fill:#ff8a3d}.f1dmg svg path.r{fill:#ff3b30}
.f1dmg b{font:600 11px var(--font-mono);color:#fff;display:block}.f1dmg.wreck b{color:#ff6b5e}
.f1lights{position:absolute;left:50%;top:calc(16% + env(safe-area-inset-top,0px));transform:translateX(-50%);display:flex;gap:10px;padding:10px 14px;background:#0d0f10;border-radius:10px;border:2px solid #2a2e30;box-shadow:0 10px 30px rgba(0,0,0,.4)}
.f1lights span{width:34px;height:34px;border-radius:50%;background:#2b1212;box-shadow:inset 0 0 0 3px #1a0b0b}
.f1lights span.on{background:radial-gradient(circle at 40% 35%,#ff8a7a,#e01b0b 55%,#8c0d05);box-shadow:0 0 18px #ff2a14,inset 0 0 0 3px #5a0b05}
.f1msg{position:absolute;left:50%;top:calc(30% + env(safe-area-inset-top,0px));transform:translateX(-50%);font:700 22px/1.3 var(--font-ui);letter-spacing:.04em;text-align:center;padding:8px 16px;border-radius:10px;background:rgba(12,17,20,.62);opacity:0;transition:opacity .25s;pointer-events:none;max-width:calc(100% - 40px)}
.f1msg.on{opacity:1}.f1msg.go{color:#59e38a}.f1msg.warn{color:#ffcf4a}.f1msg.purple{color:#d39bf0}
.f1dash{position:absolute;left:50%;transform:translateX(-50%);bottom:calc(16px + env(safe-area-inset-bottom,0px));padding:9px 14px 10px;display:flex;flex-direction:column;gap:7px;min-width:236px;box-sizing:border-box}
.f1leds{display:grid;grid-template-columns:repeat(15,1fr);gap:3px}
.f1leds i{height:6px;border-radius:3px;background:rgba(255,255,255,.12)}
.f1leds i.g{background:#3be07a}.f1leds i.r{background:#ff3b30}.f1leds i.b{background:#4aa3ff}
.f1row{display:flex;align-items:center;gap:12px}
.f1ped{display:flex;gap:4px;height:46px}
.f1ped span{width:7px;border-radius:3px;background:rgba(255,255,255,.12);display:flex;align-items:flex-end;overflow:hidden}
.f1ped b{display:block;width:100%;height:0;background:#3be07a}.f1ped span+span b{background:#ff4d40}
.f1spd{display:flex;flex-direction:column;align-items:flex-end;flex:1}
.f1spd b{font:500 44px/1 var(--font-mono);font-variant-numeric:tabular-nums}
.f1spd small{font:400 9.5px var(--font-mono);color:#9fb0b8;letter-spacing:.14em}
.f1gear{font:600 34px/1 var(--font-mono);width:44px;height:50px;display:grid;place-items:center;border:2px solid rgba(255,255,255,.28);border-radius:8px}
.f1map{position:absolute;left:16px;bottom:calc(16px + env(safe-area-inset-bottom,0px));width:176px;height:176px;border-radius:12px}
.f1hint{position:absolute;right:16px;bottom:calc(16px + env(safe-area-inset-bottom,0px));padding:8px 11px;font-size:11px;line-height:1.55;color:#cfd8dc;max-width:250px}
.f1hint kbd{font:500 10px var(--font-mono);padding:0 4px;border-radius:3px;background:rgba(255,255,255,.14);color:#fff}
.f1touch{display:none}
.f1hud.touch .f1touch{display:block}
.f1hud.touch .f1hint{display:none}
.f1steer{position:absolute;left:14px;bottom:calc(14px + env(safe-area-inset-bottom,0px));width:min(46vw,250px);height:96px;border-radius:48px;background:rgba(12,17,20,.55);border:1px solid rgba(255,255,255,.16);display:flex;align-items:center;justify-content:space-between;padding:0 18px;box-sizing:border-box;font-size:22px;color:rgba(255,255,255,.55);touch-action:none}
.f1knob{position:absolute;left:50%;top:50%;width:62px;height:62px;margin:-31px 0 0 -31px;border-radius:50%;background:rgba(238,242,243,.88);box-shadow:0 4px 14px rgba(0,0,0,.35);pointer-events:none}
.f1pedals{position:absolute;right:14px;bottom:calc(14px + env(safe-area-inset-bottom,0px));display:flex;gap:10px;align-items:flex-end}
.f1pedal{appearance:none;border:1px solid rgba(255,255,255,.2);border-radius:14px;color:#fff;font:700 15px var(--font-ui);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;touch-action:none;cursor:pointer}
.f1pedal small{font:400 9px var(--font-mono);letter-spacing:.08em;opacity:.8}
.f1pedal.brk{width:76px;height:96px;background:rgba(170,30,25,.62)}.f1pedal.thr{width:84px;height:128px;background:rgba(30,140,70,.62)}
.f1pedal.on{filter:brightness(1.45)}
.f1hud.touch .f1dash{bottom:calc(150px + env(safe-area-inset-bottom,0px));min-width:200px;padding:7px 11px 8px}
.f1hud.touch .f1spd b{font-size:34px}.f1hud.touch .f1gear{width:36px;height:42px;font-size:28px}.f1hud.touch .f1ped{height:38px}
.f1res{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(380px,calc(100% - 32px));padding:16px 18px;box-sizing:border-box}
.f1res h3{margin:0 0 2px;font-size:19px}.f1res p{margin:0 0 10px;font:400 11px var(--font-mono);color:#9fb0b8}
.f1res ol{list-style:none;margin:0 0 12px;padding:0;display:flex;flex-direction:column;gap:3px;font:500 12px var(--font-mono)}
.f1res li{display:grid;grid-template-columns:22px 5px 1fr auto auto;gap:8px;align-items:center;padding:2px 4px;border-radius:4px}
.f1res li i{height:13px;border-radius:2px}.f1res li.me{background:rgba(255,255,255,.14)}.f1res li small{color:#9fb0b8}
.f1res .f1btns{justify-content:flex-end}
@media (max-width:760px){
  .f1top{left:10px;right:10px;top:calc(10px + env(safe-area-inset-top,0px))}
  .f1info{width:150px;padding:8px 10px}
  .f1kv{font-size:10px;gap:2px 6px}.f1kv dd{font-size:11px}
  .f1lights{top:calc(26% + env(safe-area-inset-top,0px))}
  .f1tower{display:none}
  .f1hdr b{font-size:21px}.f1lt{font-size:17px}
  .f1b{min-width:40px;padding:6px 6px 5px}.f1b b{font-size:12px}.f1b small{display:none}
  .f1camn{font-size:9.5px}
  .f1map{width:112px;height:112px;left:auto;right:10px;bottom:auto;top:calc(118px + env(safe-area-inset-top,0px))}
  .f1lights span{width:26px;height:26px}
  .f1msg{font-size:16px}
  .f1road b{font-size:14px}
  .tray-pane[data-cat="f1"] .keys,.f1card small,.f1opts>span:last-child{display:none}
  .f1card{padding:8px 9px 7px}.f1card b{font-size:14px}
}`;
const HUD = {el:null, last:{}};
const svgFlag = '<svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="M4 2v16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M5 3h11v8H5z" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M5 3h2.75v2.67H5zM10.5 3h2.75v2.67H10.5zM7.75 5.67h2.75v2.66H7.75zM13.25 5.67H16v2.66h-2.75zM5 8.33h2.75V11H5zM10.5 8.33h2.75V11H10.5z" fill="currentColor"/></svg>';
function buildUI(){
  if (document.getElementById('f1Hud')) return;
  const st = document.createElement('style'); st.textContent = F1CSS; document.head.appendChild(st);
  // dock tab + tray pane
  CATS.f1 = ['F1 驾驶', 'F1 Drive', 'view', '赛道比赛 · 城市自由驾驶 · 第一人称驾驶舱视角'];
  const tabs = document.querySelector('.dock-tabs'), tray = document.getElementById('tray'), foot = document.getElementById('brushRow');
  if (tabs && tray){
    const b = document.createElement('button'); b.className = 'dtab f1tab'; b.setAttribute('role', 'tab'); b.dataset.cat = 'f1'; b.setAttribute('aria-selected', 'false'); b.id = 'f1Tab';
    b.innerHTML = `<i>${svgFlag}</i><span>驾驶</span><small>F1 Drive</small>`; b.title = 'F1 驾驶 · F1 drive mode'; tabs.appendChild(b);
    b.addEventListener('click', () => { const tr = document.getElementById('tray'); if (dockCat === 'f1' && !tr.classList.contains('closed')){ tr.classList.add('closed'); return; } showCat('f1', true); const br = document.getElementById('brushRow'); if (br) br.hidden = true; });
    const p = document.createElement('div'); p.className = 'tray-pane'; p.dataset.cat = 'f1'; p.hidden = true;
    p.innerHTML = `<div class="f1pick">
  <button class="f1card" id="f1GoRace" type="button"><b><i>${svgFlag}</i>赛道 Race</b><span id="f1RaceName">滨海湾街道赛道 · Marina Bay</span><small>5 盏发车灯、计圈与分段计时、10 辆 AI 赛车、赛道界限<br>Start lights · lap &amp; sector times · 10 AI cars</small></button>
  <button class="f1card" id="f1GoFree" type="button"><b><i>◎</i>城市 Free drive</b><span>真实街道 · Real streets</span><small>从当前视角出发：高架、桥梁、全岛道路都能开<br>Starts where the camera looks · flyovers, bridges</small></button>
</div>
<div class="f1opts"><span>圈数 Laps</span><div class="seg" role="group" aria-label="圈数 Laps"><button data-laps="1" aria-pressed="false">1</button><button data-laps="3" aria-pressed="true">3</button><button data-laps="5" aria-pressed="false">5</button></div><span>默认第一人称驾驶舱视角 · Cockpit view first</span></div>
<dl class="keys"><dt>W / ↑ · S / ↓</dt><dd>油门 · 刹车（停稳后倒车）Throttle · brake (reverse when stopped)</dd><dt>A D / ← →</dt><dd>转向 Steer</dd><dt>空格 Space</dt><dd>手刹 Handbrake</dd><dt>C · R · Esc</dt><dd>切换视角 · 复位并修复 · 退出 Camera · reset &amp; repair · exit</dd><dt>B · V · P · 1-7</dt><dd>回看 · 威胁视角 · 后视镜 / 画中画 · 直选视角 Look back · threat cam · rear view · pick a camera</dd><dt>N · M · K</dt><dd>导航（选目的地）· 大地图 · 声音 Navigation (destination) · big map · sound</dd><dt>手机 Phone</dt><dd>左侧方向盘 · 右侧油门/刹车 Steer left · pedals right</dd></dl>`;
    tray.insertBefore(p, foot || null);
    p.querySelector('#f1GoRace').addEventListener('click', () => f1Enter('race'));
    p.querySelector('#f1GoFree').addEventListener('click', () => f1Enter('free'));
    p.querySelectorAll('[data-laps]').forEach(x => x.addEventListener('click', () => { F1.laps = +x.dataset.laps; F1.lapsUser = true; p.querySelectorAll('[data-laps]').forEach(y => y.setAttribute('aria-pressed', String(y === x))); }));
    p.dataset.tab = '1'; HUD.pane = p; HUD.tab = b;
  }
  // the HUD
  const h = document.createElement('div'); h.className = 'f1hud'; h.id = 'f1Hud'; h.hidden = true;
  h.innerHTML = `<div class="f1top">
  <div>
    <div class="f1info f1p" id="f1Race"><div class="f1hdr"><b id="f1Pos">P–</b><small id="f1PosN">/11</small><span id="f1LapN">LAP 1/3</span></div>
      <div class="f1lt" id="f1LapT">0:00.000</div><div class="f1secs"><i id="f1S0">S1</i><i id="f1S1">S2</i><i id="f1S2">S3</i></div>
      <dl class="f1kv"><dt>上圈 Last</dt><dd id="f1Last">–</dd><dt>最快 Best</dt><dd id="f1Best">–</dd></dl><ol class="f1tower" id="f1Tower"></ol></div>
    <div class="f1info f1p" id="f1Free" hidden><div class="f1road"><b id="f1Road">—</b><small id="f1RoadEn">—</small></div>
      <dl class="f1kv"><dt>里程 Distance</dt><dd id="f1Odo">0.00 km</dd><dt>极速 Top speed</dt><dd id="f1Top">0 km/h</dd></dl></div>
  </div>
  <div class="f1right"><div class="f1btns"><button class="f1b f1p" id="f1SndB" type="button" aria-pressed="true"><b>声音 开</b><small>SOUND · K</small></button><button class="f1b f1p" id="f1LbB" type="button" aria-pressed="false"><b>回看</b><small>LOOK BACK · B</small></button><button class="f1b f1p" id="f1CamB" type="button"><b>视角</b><small>CAMERA · C</small></button><button class="f1b f1p" id="f1ResetB" type="button"><b>复位</b><small>RESET · R</small></button><button class="f1b f1p x" id="f1ExitB" type="button"><b>退出</b><small>EXIT · ESC</small></button></div><div class="f1camn" id="f1CamN">驾驶舱 Cockpit</div><div class="f1dmg" id="f1Dmg" hidden><svg viewBox="0 0 22 38" aria-hidden="true"><path data-z="f" d="M4 3h14l2 6H2z"/><path data-z="l" d="M2 11h3v16H2z"/><path data-z="r" d="M17 11h3v16h-3z"/><path data-z="b" d="M2 29h18l-2 6H4z"/></svg><span><b id="f1DmgV">0%</b>损坏 DAMAGE</span></div></div>
</div>
<div class="f1lights" id="f1Lights" hidden><span></span><span></span><span></span><span></span><span></span></div>
<div class="f1msg" id="f1Msg"></div>
<div class="f1pip" id="f1Pip" hidden><span>后视 REAR · P</span></div>
<canvas class="f1map f1p" id="f1Map" width="176" height="176" aria-label="小地图 Minimap"></canvas>
<div class="f1dash f1p" id="f1Dash"><div class="f1leds" id="f1Leds">${'<i></i>'.repeat(15)}</div><div class="f1row"><div class="f1ped"><span><b id="f1Thr"></b></span><span><b id="f1Brk"></b></span></div><div class="f1spd"><b id="f1Spd">0</b><small>KM/H</small></div><div class="f1gear" id="f1Gear">N</div></div></div>
<div class="f1hint f1p" id="f1Hint"><kbd>W</kbd><kbd>↑</kbd> 油门 throttle · <kbd>S</kbd><kbd>↓</kbd> 刹车 brake<br><kbd>A</kbd><kbd>D</kbd> 转向 steer · <kbd>空格</kbd> 手刹 handbrake<br><kbd>C</kbd> 视角 camera · <kbd>R</kbd> 复位修复 reset/repair<br><kbd>B</kbd> 回看 look back · <kbd>V</kbd> 威胁 threat · <kbd>P</kbd> 后视 rear<br><kbd>N</kbd> 导航 nav · <kbd>M</kbd> 地图 map · <kbd>K</kbd> 声音 sound · <kbd>H</kbd> 提示 hints · <kbd>Esc</kbd> 退出 exit</div>
<div class="f1touch" id="f1Touch"><button class="f1lbT" id="f1LbT" type="button" aria-pressed="false">回看<small>LOOK</small></button><div class="f1steer" id="f1Steer"><span>◀</span><span>▶</span><i class="f1knob" id="f1Knob"></i></div>
  <div class="f1pedals"><button class="f1pedal brk" id="f1BrkP" type="button">刹车<small>BRAKE</small></button><button class="f1pedal thr" id="f1ThrP" type="button">油门<small>THROTTLE</small></button></div></div>
<div class="f1res f1p" id="f1Res" hidden></div>`;
  document.body.appendChild(h); HUD.el = h;
  const $h = id => h.querySelector('#' + id);
  HUD.q = {pos:$h('f1Pos'), lapN:$h('f1LapN'), lapT:$h('f1LapT'), s:[$h('f1S0'), $h('f1S1'), $h('f1S2')], last:$h('f1Last'), best:$h('f1Best'), tower:$h('f1Tower'), race:$h('f1Race'), free:$h('f1Free'),
    road:$h('f1Road'), roadEn:$h('f1RoadEn'), odo:$h('f1Odo'), top:$h('f1Top'), camN:$h('f1CamN'), lights:$h('f1Lights'), msg:$h('f1Msg'), leds:[...$h('f1Leds').children], thr:$h('f1Thr'), brk:$h('f1Brk'),
    spd:$h('f1Spd'), gear:$h('f1Gear'), knob:$h('f1Knob'), res:$h('f1Res'), hint:$h('f1Hint'), brkP:$h('f1BrkP'), thrP:$h('f1ThrP'), dmg:$h('f1Dmg'), dmgV:$h('f1DmgV'), dmgZ:[...$h('f1Dmg').querySelectorAll('path')]};
  MAP.cv = $h('f1Map'); MAP.ctx = MAP.cv.getContext('2d');
  $h('f1CamB').addEventListener('click', () => nextCam()); dcHud(h);   // [lm28/drivecam]
  // [lm30/nav] the sound / reset / exit buttons (their handlers had been commented out by the line above)
  $h('f1SndB').addEventListener('click', () => audToggle()); $h('f1ResetB').addEventListener('click', () => resetCar()); $h('f1ExitB').addEventListener('click', () => f1Exit());
  h.addEventListener('wheel', e => e.preventDefault(), {passive:false}); h.addEventListener('contextmenu', e => e.preventDefault());
  // touch: steering pad (drag left / right) and pedals
  const pad = $h('f1Steer');
  const sUpd = e => { const r = pad.getBoundingClientRect(); let x = ((e.clientX - r.left)/r.width)*2 - 1; x = Math.abs(x) < 0.07 ? 0 : x; TOUCH.steer = -clamp(x*1.3, -1, 1); };
  pad.addEventListener('pointerdown', e => { try { pad.setPointerCapture(e.pointerId); } catch (_){ } pad._id = e.pointerId; sUpd(e); TOUCH.used = true; e.preventDefault(); });
  pad.addEventListener('pointermove', e => { if (pad._id === e.pointerId) sUpd(e); });
  const sEnd = e => { if (pad._id === e.pointerId){ pad._id = null; TOUCH.steer = 0; } }; pad.addEventListener('pointerup', sEnd); pad.addEventListener('pointercancel', sEnd);
  for (const [el, k] of [[HUD.q.brkP, 'brk'], [HUD.q.thrP, 'thr']]){
    el.addEventListener('pointerdown', e => { try { el.setPointerCapture(e.pointerId); } catch (_){ } TOUCH[k] = 1; TOUCH.used = true; el.classList.add('on'); e.preventDefault(); });
    const up = () => { TOUCH[k] = 0; el.classList.remove('on'); }; el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('lostpointercapture', up); }
  h.addEventListener('pointerdown', e => { if (e.pointerType === 'touch' && !h.classList.contains('touch')){ h.classList.add('touch'); } });
  if (isRC() && HUD.pane && HUD.tab) rcTrayUI(HUD.tab, HUD.pane);
}
function hudShow(on){
  if (!HUD.el) return; HUD.el.hidden = !on; if (!on){ HUD.q.res.hidden = true; return; }
  const touch = (window.matchMedia && matchMedia('(pointer: coarse)').matches) || innerWidth <= 760 || TOUCH.used; HUD.el.classList.toggle('touch', touch);
  HUD.q.race.hidden = F1.mode !== 'race'; HUD.q.free.hidden = F1.mode === 'race'; HUD.q.res.hidden = true; HUD.last = {}; MAP.rx = 1e9; hudCam(); hudRaceReset(); rcHudShow();
}
function hudCam(){ if (HUD.q) HUD.q.camN.textContent = ((F1.veh === 'car' ? RC_CAMN : CAMN)[F1.cam] || ['', '']).join(' ') + (DC.lbOn ? ' · 回看 Look back' : ''); }
function hudRaceReset(){ if (!HUD.q) return; HUD.last = {}; hudSecsReset(); HUD.q.last.textContent = '–'; HUD.q.best.textContent = '–'; HUD.q.tower.innerHTML = ''; }
function hudSecsReset(){ if (!HUD.q) return; for (const s of HUD.q.s) s.className = ''; }
let msgTimer = null;
function flash(t, dur, cls){ if (!HUD.q) return; const m = HUD.q.msg; m.textContent = t; m.className = 'f1msg on' + (cls ? ' ' + cls : ''); clearTimeout(msgTimer); msgTimer = setTimeout(() => { m.className = 'f1msg'; }, (dur || 1.6)*1000); }
const setT = (el, k, v) => { if (HUD.last[k] !== v){ HUD.last[k] = v; el.textContent = v; } };
function hudTick(){
  const q = HUD.q; if (!q || HUD.el.hidden) return; const C = CAR, kmh = Math.round(Math.abs(C.u)*3.6);
  setT(q.spd, 'spd', String(kmh)); setT(q.gear, 'gear', C.rev ? 'R' : (kmh < 1 && C.thr < 0.05 ? 'N' : String(C.gear)));
  const lit = Math.round(clamp((C.rpm - 9000)/2800, 0, 1)*15); if (HUD.last.leds !== lit){ HUD.last.leds = lit; q.leds.forEach((el, i) => { el.className = i < lit ? (i < 5 ? 'g' : i < 10 ? 'r' : 'b') : ''; }); }
  const th = Math.round(C.thr*100), br = Math.round(Math.max(C.brk, INP.hb ? 0.6 : 0)*100); if (HUD.last.th !== th){ HUD.last.th = th; q.thr.style.height = th + '%'; } if (HUD.last.br !== br){ HUD.last.br = br; q.brk.style.height = br + '%'; }
  const kx = Math.round(-C.steer*40); if (HUD.last.kx !== kx){ HUD.last.kx = kx; q.knob.style.transform = `translateX(${kx*1.6}px)`; }
  q.brkP.classList.toggle('on', TOUCH.brk > 0); q.thrP.classList.toggle('on', TOUCH.thr > 0);
  // [lm24/drive] damage: the four zones of a top view, the total in %
  { const pc = DMG.wreck ? 100 : Math.round(clamp(DMG.total/2.4, 0, 1)*100), key = pc + (DMG.wreck ? 'w' : '') + [DMG.f, DMG.l, DMG.r, DMG.b].map(v => v < 0.12 ? 0 : v < 0.45 ? 1 : v < 0.85 ? 2 : 3).join('');
    if (HUD.last.dmg !== key){ HUD.last.dmg = key; q.dmg.hidden = DMG.total < 0.02; q.dmg.classList.toggle('wreck', DMG.wreck); q.dmgV.textContent = DMG.wreck ? '损毁 WRECK' : pc + '%';
      for (const el of q.dmgZ){ const v = DMG[el.dataset.z]; el.setAttribute('class', v < 0.12 ? '' : v < 0.45 ? 'y' : v < 0.85 ? 'o' : 'r'); } } }
  if (F1.mode === 'race'){
    const R = RACE; q.lights.hidden = R.state !== 'grid';
    if (R.state === 'grid'){ const n = R.lights; if (HUD.last.li !== n){ HUD.last.li = n; [...q.lights.children].forEach((s, i) => s.classList.toggle('on', i < n)); } }
    const pos = R.order.length ? R.order.findIndex(e => e.car === 0) + 1 : PSLOT;
    if (MPN.race && MPN.pos){ setT(q.pos, 'pos', 'P' + MPN.pos); const pn = document.getElementById('f1PosN'); if (pn && HUD.last.of !== MPN.of){ HUD.last.of = MPN.of; pn.textContent = '/' + MPN.of; } } else setT(q.pos, 'pos', 'P' + pos); setT(q.lapN, 'lapN', R.state === 'done' ? 'FINISH' : `LAP ${Math.max(1, Math.min(R.lap, R.laps))}/${R.laps}`);
    const lt = R.state === 'race' ? R.t - R.lapT0 : R.state === 'done' ? R.last : 0; setT(q.lapT, 'lapT', fmtT(lt).replace('–:––.–––', '0:00.000')); q.lapT.classList.toggle('inv', R.inv);
    for (let s = 0; s < 3; s++){ const done = R.state === 'race' && s < R.sec, cur = R.state === 'race' && s === R.sec;
      const cls = cur ? 'n' : done ? (R.secs[s] <= R.bestSec[s] + 1e-6 ? 'g' : 'y') : ''; const txt = done ? R.secs[s].toFixed(1) : 'S' + (s + 1); setT(q.s[s], 's' + s, txt); if (q.s[s].className !== cls) q.s[s].className = cls; }
    setT(q.last, 'last', R.last ? fmtT(R.last) : '–'); setT(q.best, 'best', R.best ? fmtT(R.best) : '–'); q.best.classList.toggle('p', !!R.best && R.best <= R.fastest + 1e-6);
    if (MPN.race && MPN.tower){ const sg = MPN.tower.map(e => e.name + e.gap + (e.me ? '*' : '')).join(','); if (sg !== HUD.last.sig){ HUD.last.sig = sg; const esc = t => String(t).replace(/[&<>"]/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'})[c]);
      q.tower.innerHTML = MPN.tower.map((e, i) => { const L = MP_LIV[(e.col | 0) % MPC]; return `<li class="${e.me ? 'me' : ''}"><span>${i + 1}</span><i style="background:rgb(${L.p.map(v => Math.round(v*255)).join(',')})"></i><span>${esc(e.name)}</span><small>${esc(e.gap)}</small></li>`; }).join(''); } }
    else {
    const sig = R.order.map(e => e.car).join(',');
    if (((hudTick.n = (hudTick.n || 0) + 1) % 10 === 0 || sig !== HUD.last.sig) && R.order.length){ HUD.last.sig = sig;
      const lead = R.order[0]; q.tower.innerHTML = R.order.map((e, i) => { const L = LIV[e.car], gap = i === 0 ? (e.fin !== null ? 'FIN' : 'LEAD') : (e.fin !== null ? '+' + Math.max(0, e.fin - (lead.fin || 0)).toFixed(1) : '+' + (Math.max(0, lead.prog - e.prog)/55).toFixed(1));
        return `<li class="${e.car === 0 ? 'me' : ''}"><span>${i + 1}</span><i style="background:rgb(${L.p.map(v => Math.round(v*255)).join(',')})"></i><span>${L.code}</span><small>${gap}</small></li>`; }).join(''); }
    }
  } else {
    q.lights.hidden = true;
    const l = C.li >= 0 && SGR.lines ? SGR.lines[C.li] : null; let zh, en;
    if (C.kind === 'track'){ const nm = trName(); zh = 'F1 ' + nm[0]; en = nm[1]; }
    else if (C.kind === 'ground' || !l){ zh = '路外 Off road'; en = '地面 · ground'; }
    else { zh = (l.name && (l.name[1] || l.name[0])) || RD_ZH[l.c]; en = (l.name && l.name[0] ? l.name[0] : RD_EN[l.c]) + (l.E && C.z - gnd(C.x, C.y) > 3 ? ' · 高架 elevated' : ''); }
    const key = zh + '|' + en + '|' + (l && l.ref || '');
    if (HUD.last.road !== key){ HUD.last.road = key; q.road.innerHTML = ''; q.road.textContent = zh; if (l && l.ref && C.kind === 'road'){ const em = document.createElement('em'); em.textContent = l.ref; q.road.appendChild(em); } q.roadEn.textContent = en; }
    if (F1.veh === 'car'){ setT(q.odo, 'odo', (C.odo/1609.344).toFixed(2) + ' mi'); setT(q.top, 'top', Math.round(C.vtop/1.609344) + ' mph'); rcHudTick(); }
    else { setT(q.odo, 'odo', (C.odo/1000).toFixed(2) + ' km'); setT(q.top, 'top', Math.round(C.vtop) + ' km/h'); }
  }
  mapDraw();
}
function showResults(){
  const q = HUD.q; if (!q) return; const R = RACE, me = R.order.findIndex(e => e.car === 0) + 1, lead = R.order[0];
  q.res.innerHTML = `<h3>完赛 · P${me} / ${R.order.length}</h3><p>${R.laps} 圈 laps · 用时 time ${fmtT(R.fin)} · 最快圈 best ${R.best ? fmtT(R.best) : '–'}</p><ol>${R.order.map((e, i) => { const L = LIV[e.car];
    const tt = e.fin !== null ? (i === 0 ? fmtT(e.fin) : '+' + (e.fin - lead.fin).toFixed(3)) : '+' + Math.max(0, (lead.prog - e.prog)/55).toFixed(1) + ' s';
    return `<li class="${e.car === 0 ? 'me' : ''}"><span>${i + 1}</span><i style="background:rgb(${L.p.map(v => Math.round(v*255)).join(',')})"></i><span>${L.code}${e.car === 0 ? ' · 你 You' : ''}</span><small>${tt}</small><span></span></li>`; }).join('')}</ol>
    <div class="f1btns"><button class="f1b f1p" type="button" data-a="again"><b>再赛一场</b><small>RACE AGAIN</small></button><button class="f1b f1p" type="button" data-a="drive"><b>继续开</b><small>KEEP DRIVING</small></button><button class="f1b f1p x" type="button" data-a="exit"><b>退出</b><small>EXIT</small></button></div>`;
  q.res.hidden = false;
  q.res.querySelectorAll('[data-a]').forEach(b => b.addEventListener('click', () => { const a = b.dataset.a; q.res.hidden = true; if (a === 'again'){ raceStart(); } else if (a === 'exit') f1Exit(); }));
}

/* ================= [lm22/svdrive] HUD and tray for the road car (built in the Bay Area build only) ================= */
const svgCar = '<svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="M2.6 13.2l1.7-4.4C4.7 7.8 5.5 7.3 6.6 7.3h6.8c1.1 0 1.9.5 2.3 1.5l1.7 4.4v2.6h-2.2v-1.4H4.8v1.4H2.6z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><circle cx="6.2" cy="12.2" r="1.05" fill="currentColor"/><circle cx="13.8" cy="12.2" r="1.05" fill="currentColor"/></svg>';
const RC_SIL = {sedan:'M2 16.5C2 13.5 4 12.6 9 12L19 11.2C23 8.4 27 6.2 33 6C40 5.8 45 7.6 50 10.6L57 11.6C60.5 12.2 62 13.6 62 16.5Z',
  suv:'M2 16.5L2.6 12C3 10.6 6 10 11 9.8L16 9.6L21 4.6C22 4 24 3.8 27 3.8L54 3.8C57 3.8 58.5 4.6 59.4 6.5L61.5 10.5C62 12 62 14 62 16.5Z',
  coupe:'M2 16.5C2 14.4 4 13.6 9 13L21 12C26 8.8 30 7.4 35 7.3C41 7.2 45 8.6 51 11.6L58 12.6C61 13.1 62 14.4 62 16.5Z'};
const RC_PT = {apple:['Apple Park', '库比蒂诺 Cupertino'], google:['Googleplex', '山景城 Mountain View'], stanford:['斯坦福 Stanford', 'Palm Drive · Palo Alto'], sanjose:['圣何塞市中心', 'Downtown San José'],
  santaclara:['圣克拉拉 Santa Clara', 'Tasman Dr · 体育场旁'], i280:['I-280', '沙丘路 Sand Hill Rd'], us101:['US-101', '山景城 Mountain View'], here:['从这里出发', 'From here']};
RC_SIL.pickup = 'M2 16.5L2.4 12.4C2.8 11 5 10.5 9 10.3L20 10L24 5.2C25 4.4 26.5 4.2 29 4.2L37 4.2C38.5 4.2 39 5 39 6.5L39 10.2L61 10.2C61.8 10.2 62 11 62 12L62 16.5Z';
RC_SIL.bus = 'M2 16.5L2 5C2 3.6 3 3 4.5 3L59.5 3C61 3 62 3.8 62 5.2L62 16.5Z';
RC_SIL.moto = 'M10 16.5L18 10.5L26 10L30 7L36 7L40 10L47 10.5L54 16.5L46 16.5L40 12.5L24 12.5L18 16.5Z';
RC_SIL.taxi = 'M2 16.5C2 13.6 4 12.7 9 12.2L18.5 11.4C22.5 8.3 26 6.6 31 6.4L31 4.6L37 4.6L37 6.4C42 6.6 45.5 8.4 48.5 11.2L58 12C61 12.5 62 13.8 62 16.5Z';
const RC_PT_NY = {times:['时代广场', '7th Ave · Times Sq'], fifth:['第五大道', '中央公园南 CPS'], fdr:['FDR Drive', '东河 East River'], westside:['西区高速', 'NY 9A · Chelsea'],
  brooklynbr:['布鲁克林大桥', '→ Brooklyn'], parkave:['公园大道', 'Grand Central'], queensboro:['皇后区大桥', 'Queensboro Br'], belt:['Belt Pkwy', '韦拉札诺 Verrazzano'], here:['从这里出发', 'From here']};
const RC_CSS = `
.dtab.f1tab.rctab i{background:#21342b;color:#7fe0a6}
.dtab.f1tab.rctab[aria-selected="true"] i{background:#1f2a2f;color:#7fe0a6}
.tray:has(.tray-pane[data-cat="f1"]:not([hidden])){max-height:min(560px, 72vh)}
.rcpanel{border:1px solid var(--rule);background:var(--panel);border-radius:10px;padding:10px 12px 12px;display:flex;flex-direction:column;gap:7px;margin-bottom:8px}
.rchead b{font-size:15px;font-weight:700;letter-spacing:.03em;display:flex;align-items:center;gap:7px}
.rchead b i{font-style:normal;display:grid;place-items:center;width:22px;height:22px;border-radius:6px;background:#21342b;color:#7fe0a6}
.rchead b span{font-weight:500;font-size:13px;color:var(--muted)}
.rchead small{display:block;font:400 10px/1.45 var(--font-mono);color:var(--muted);margin-top:2px}
.rclab{font:600 10px var(--font-mono);letter-spacing:.08em;color:var(--muted)}
.rcplaces{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px}
.rccars{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
.rcplaces button,.rccars button{appearance:none;border:1px solid var(--rule);background:transparent;border-radius:7px;padding:5px 7px 6px;text-align:left;cursor:pointer;color:var(--ink);font:inherit;display:flex;flex-direction:column;gap:1px;min-width:0}
.rcplaces button:hover,.rccars button:hover{border-color:var(--ink)}
.rcplaces b,.rccars b{font-size:11.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.rcplaces small,.rccars small,.rccars em{font:400 9.5px/1.3 var(--font-mono);color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-style:normal}
.rcplaces button[aria-pressed="true"],.rccars button[aria-pressed="true"]{background:var(--ink);color:var(--panel);border-color:var(--ink)}
.rcplaces button[aria-pressed="true"] small,.rccars button[aria-pressed="true"] small,.rccars button[aria-pressed="true"] em{color:var(--panel);opacity:.75}
.rccars svg{width:100%;height:22px;display:block;margin-bottom:2px}
.rcfoot{display:flex;align-items:center;gap:10px;justify-content:space-between;margin-top:2px}
.rccols{display:flex;gap:7px;align-items:center}
.rccols button{appearance:none;width:22px;height:22px;border-radius:50%;border:1px solid rgba(0,0,0,.25);background:var(--c);cursor:pointer;padding:0}
.rccols button[aria-pressed="true"]{outline:2px solid var(--ink);outline-offset:2px}
.rcgo{appearance:none;border:0;border-radius:8px;background:#1d6b42;color:#fff;font:700 14px var(--font-ui);padding:9px 18px;cursor:pointer;white-space:nowrap}
.rcgo:hover{background:#238251}
.rcdash{position:absolute;left:50%;transform:translateX(-50%);bottom:calc(16px + env(safe-area-inset-bottom,0px));padding:10px 14px;display:flex;align-items:center;gap:14px}
.rclim{width:46px;height:58px;box-sizing:border-box;background:#fff;color:#111;border:2.5px solid #111;border-radius:6px;box-shadow:0 0 0 2px #fff;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:var(--font-ui)}
.rclim small{font:700 7.5px/1.05 var(--font-ui);letter-spacing:.03em;text-align:center}
.rclim b{font:700 22px/1 var(--font-ui);margin-top:3px}
.rclim.na{opacity:.3}
.rclim.over{animation:rcpulse 1.3s ease-in-out infinite}
@keyframes rcpulse{0%,100%{box-shadow:0 0 0 2px #fff}50%{box-shadow:0 0 0 2px #fff,0 0 0 7px rgba(255,196,64,.85)}}
.rcspd{display:flex;align-items:flex-end;gap:7px}
.rcspd b{font:500 46px/.9 var(--font-mono);font-variant-numeric:tabular-nums;min-width:2.2ch;text-align:right;transition:color .3s}
.rcspd b.over{color:#ffcf4a}
.rcspd span{display:flex;flex-direction:column;gap:4px;padding-bottom:2px}
.rcspd small{font:600 11px var(--font-mono);letter-spacing:.12em;color:#cfd8dc}
.rcspd em{font:400 10px var(--font-mono);font-style:normal;color:#9fb0b8;white-space:nowrap}
.rcside{display:flex;flex-direction:column;gap:7px;align-items:center}
.rcprnd{display:flex;gap:2px;align-items:center;font:600 13px var(--font-mono)}
.rcprnd i{font-style:normal;width:17px;text-align:center;padding:2px 0;border-radius:4px;color:#64737a}
.rcprnd i.on{background:#eef2f3;color:#111}
.rcprnd b{font:500 10px var(--font-mono);color:#9fb0b8;width:12px;text-align:left;margin-left:2px}
.rcicons{display:flex;gap:9px;font:600 12px var(--font-mono);color:#46545a}
.rcicons i{font-style:normal}
.rcicons i.on{color:#3be07a}.rcicons i.hl.on{color:#5fb0ff}.rcicons i.hl.auto{color:#8fa0a8}
.f1hud.touch .rcdash{bottom:calc(150px + env(safe-area-inset-bottom,0px));padding:7px 11px;gap:10px}
.f1hud.touch .rcspd b{font-size:34px}.f1hud.touch .rclim{width:38px;height:48px}.f1hud.touch .rclim b{font-size:18px}
.rcplaces.ny{grid-template-columns:repeat(3,minmax(0,1fr))}.rccars.ny{grid-template-columns:repeat(2,minmax(0,1fr))}.rccars.x6{grid-template-columns:repeat(3,minmax(0,1fr))}.rccars.ny.x6{grid-template-columns:repeat(4,minmax(0,1fr))}.rccols.off button{opacity:.3;pointer-events:none}
@media (max-width:760px){ .rcplaces{grid-template-columns:repeat(2,minmax(0,1fr))} .rcdash{gap:10px;padding:7px 10px} .rcspd b{font-size:34px} }`;
const RC_HINT = '<kbd>W</kbd><kbd>↑</kbd> 油门 throttle · <kbd>S</kbd><kbd>↓</kbd> 刹车/倒车 brake<br><kbd>A</kbd><kbd>D</kbd> 转向 steer · <kbd>空格</kbd> 手刹 handbrake<br><kbd>C</kbd> 视角 camera · <kbd>R</kbd> 复位修复 · <kbd>L</kbd> 大灯 lights<br><kbd>B</kbd> 回看 look back · <kbd>V</kbd> 威胁 threat · <kbd>P</kbd> 后视 rear<br><kbd>Q</kbd><kbd>E</kbd> 转向灯 indicators · <kbd>N</kbd> 导航 · <kbd>M</kbd> 地图 · <kbd>K</kbd> 声音 · <kbd>Esc</kbd> 退出';
const rcPrefKey = () => isNyc() ? 'cityBrush.nydrive' : 'cityBrush.svdrive';
function rcLoadPrefs(){ try { const s = JSON.parse(localStorage.getItem(rcPrefKey()) || 'null'); if (s){ if (rcPlaces().some(p => p.id === s.place)) RCM.place = s.place; if (RCAR[s.car] && rcKeys().includes(s.car)) RCM.carSel = s.car; if (s.col >= 0 && s.col < RC_COLS.length) RCM.col = s.col | 0; } } catch (e){ /* storage blocked */ } }
function rcSavePrefs(){ try { localStorage.setItem(rcPrefKey(), JSON.stringify({place:RCM.place, car:RCM.carSel || 'sedan', col:RCM.col})); } catch (e){ /* storage blocked */ } }
// the Bay tray: the Silicon Valley road-car panel above the F1 free-drive card; the Drive tab
function rcTrayUI(tab, pane){
  const st = document.createElement('style'); st.textContent = RC_CSS; document.head.appendChild(st);
  const NY = isNyc(), PL = rcPlaces(), PT = NY ? RC_PT_NY : RC_PT, KS = rcKeys();
  if (NY){ RCM.place = PL[0].id; RCM.carSel = 'taxi'; }
  rcLoadPrefs(); if (!RCM.carSel) RCM.carSel = 'sedan';
  CATS.f1 = ['驾驶', 'Drive', 'view', NY ? '纽约开车（真实街道 · 靠右行驶）· F1 自由驾驶' : '硅谷开车（真实街道 · 靠右行驶）· F1 自由驾驶'];
  tab.classList.add('rctab'); tab.innerHTML = `<i>${svgCar}</i><span>驾驶</span><small>Drive</small>`; tab.title = '驾驶 · Drive';
  const box = document.createElement('div'); box.className = 'rcpanel';
  box.innerHTML = `<div class="rchead"><b><i>${svgCar}</i>${NY ? '纽约开车 <span>New York drive</span>' : '硅谷开车 <span>Silicon Valley drive</span>'}</b><small>一辆现代道路车 · 真实街道 · 靠右行驶 · 限速牌与 mph · A modern road car on the real streets, keep right</small></div>
<div class="rclab">出发地点 · START</div>
<div class="rcplaces${NY ? ' ny' : ''}" role="group" aria-label="出发地点 Start place">${PL.map(p => `<button type="button" data-place="${p.id}" aria-pressed="false" title="${p.zh} · ${p.en}"><b>${PT[p.id][0]}</b><small>${PT[p.id][1]}</small></button>`).join('')}</div>
<div class="rclab">车型 · CAR</div>
<div class="rccars${NY ? ' ny' : ''}${KS.length > 5 ? ' x6' : ''}" role="group" aria-label="车型 Car">${KS.map(k => `<button type="button" data-car="${k}" aria-pressed="false"><svg viewBox="0 0 64 22" aria-hidden="true"><path d="${RC_SIL[k]}" fill="currentColor"/><circle cx="15" cy="16.5" r="4" fill="currentColor"/><circle cx="15" cy="16.5" r="2.2" fill="var(--panel)"/><circle cx="50" cy="16.5" r="4" fill="currentColor"/><circle cx="50" cy="16.5" r="2.2" fill="var(--panel)"/></svg><b>${RCAR[k].zh} · ${RCAR[k].en}</b><em>${RCAR[k].spec}</em></button>`).join('')}</div>
<div class="rcfoot"><div class="rccols" role="group" aria-label="颜色 Colour"><span class="rclab">颜色 · COLOUR</span>${RC_COLS.map((c, i) => `<button type="button" data-col="${i}" aria-pressed="false" title="${c.zh} ${c.en}" aria-label="${c.zh} ${c.en}" style="--c:rgb(${c.c.map(v => Math.round(Math.pow(v, 0.8)*255)).join(',')})"></button>`).join('')}</div>
<button type="button" class="rcgo" id="rcGo">出发 Drive ▸</button></div>`;
  const pick = pane.querySelector('.f1pick'); pane.insertBefore(box, pick);
  const sync = () => { box.querySelectorAll('[data-place]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.place === RCM.place)));
    box.querySelectorAll('[data-car]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.car === RCM.carSel)));
    box.querySelectorAll('[data-col]').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.col === RCM.col)));
    const cols = box.querySelector('.rccols'); if (cols) cols.classList.toggle('off', RCM.carSel === 'taxi' || RCM.carSel === 'bus'); };
  box.querySelectorAll('[data-place]').forEach(b => b.addEventListener('click', () => { RCM.place = b.dataset.place; sync(); rcSavePrefs(); }));
  box.querySelectorAll('[data-car]').forEach(b => b.addEventListener('click', () => { RCM.carSel = b.dataset.car; sync(); rcSavePrefs(); }));
  box.querySelectorAll('[data-col]').forEach(b => b.addEventListener('click', () => { RCM.col = +b.dataset.col; sync(); rcSavePrefs(); if (RCM.built) rcPaint(); }));
  box.querySelector('#rcGo').addEventListener('click', () => f1Enter('car', {place:RCM.place, car:RCM.carSel, col:RCM.col}));
  sync();
  // the F1 card: free drive only (no street circuit in the Bay)
  const fc = pane.querySelector('#f1GoFree'); if (fc) fc.innerHTML = `<b><i>${svgFlag}</i>F1 自由驾驶 F1 free drive</b><span>F1 赛车 · 真实街道 · F1 car on the real streets</span><small>从当前视角出发：高架、桥梁都能开<br>Starts where the camera looks · flyovers, bridges</small>`;
  const op = pane.querySelector('.f1opts'); if (op) op.hidden = true;
  const keys = pane.querySelector('dl.keys'); if (keys) keys.insertAdjacentHTML('beforeend', '<dt>' + (NY ? '纽约开车' : '硅谷开车') + ' Road car</dt><dd>停稳后松开再按 S 倒车 · P R N D 自动挡 Stopped: release, press S again to reverse</dd><dt>L · Q / E</dt><dd>大灯（自动 / 开 / 关）· 左 / 右转向灯 Lights · indicators</dd>');
  // the road car's dashboard in the HUD
  const h = HUD.el; if (!h) return;
  h.insertAdjacentHTML('beforeend', `<div class="rcdash f1p" id="rcDash" hidden><div class="rclim" id="rcLim" title="限速 Speed limit"><small>SPEED<br>LIMIT</small><b id="rcLimV">–</b></div>
<div class="rcspd"><b id="rcSpd">0</b><span><small>MPH</small><em id="rcKmh">0 km/h</em></span></div>
<div class="rcside"><div class="rcprnd" id="rcPrnd"><i>P</i><i>R</i><i>N</i><i>D</i><b id="rcGn"></b></div><div class="rcicons"><i id="rcIL" title="左转向灯 Left indicator">◀</i><i class="hl" id="rcHL" title="大灯 Headlamps">◉</i><i id="rcIR" title="右转向灯 Right indicator">▶</i></div></div></div>`);
  const $h = id => h.querySelector('#' + id);
  HUD.rc = {el:$h('rcDash'), lim:$h('rcLim'), limV:$h('rcLimV'), spd:$h('rcSpd'), kmh:$h('rcKmh'), prnd:[...$h('rcPrnd').querySelectorAll('i')], gn:$h('rcGn'), il:$h('rcIL'), ir:$h('rcIR'), hl:$h('rcHL'), dash:$h('f1Dash'), hint0:HUD.q.hint.innerHTML, last:{}};
}
function rcHudShow(){
  const R = HUD.rc; if (!R) return; const car = F1.veh === 'car';
  R.el.hidden = !car; R.dash.hidden = car; HUD.q.hint.innerHTML = car ? RC_HINT : R.hint0; R.last = {};
}
function rcHudTick(){
  const R = HUD.rc; if (!R || R.el.hidden) return; const C = CAR, L = R.last, set = (el, k, v) => { if (L[k] !== v){ L[k] = v; el.textContent = v; } };
  const mph = Math.abs(C.u)*2.23694, ms = Math.round(mph);
  set(R.spd, 'spd', String(ms)); set(R.kmh, 'kmh', Math.round(Math.abs(C.u)*3.6) + ' km/h');
  // the speed limit of the road under the car (kept over junction surfaces; none off road)
  if (C.kind === 'road' && C.c >= 0 && C.c <= 11) RCM.limit = rcLimitOf(C.li, C.c); else if (C.kind === 'ground') RCM.limit = 0;
  const lim = RCM.limit || 0; set(R.limV, 'lim', lim ? String(lim) : '–'); R.lim.classList.toggle('na', !lim);
  const over = lim > 0 && mph > lim + 5; if (L.over !== over){ L.over = over; R.lim.classList.toggle('over', over); R.spd.classList.toggle('over', over); }
  const g = C.park ? 0 : C.rev ? 1 : 3; if (L.g !== g){ L.g = g; R.prnd.forEach((el, i) => el.classList.toggle('on', i === g)); }
  set(R.gn, 'gn', g === 3 && RCP.gears ? String(C.gear) : '');
  const bl = (RCM.indT % 0.76) < 0.4; R.il.classList.toggle('on', (RCM.ind === -1 || RCM.ind === 2) && bl); R.ir.classList.toggle('on', (RCM.ind === 1 || RCM.ind === 2) && bl);
  R.hl.classList.toggle('on', RCM.headOn); R.hl.classList.toggle('auto', !RCM.headOn && RCM.lights === 'auto');
}
// the test autopilot for the road car: the road ahead in the right-most lane, the speed limit (or vset mph), slower into bends
// the line to follow: the candidates under points ahead, aligned with the car, the same road preferred (no exits / slip roads)
const AUTO = {li:-1};
function rcAutoLine(){
  const C = CAR, cs = Math.cos(C.psi), sn = Math.sin(C.psi), cur = AUTO.li >= 0 ? SGR.lines[AUTO.li] : null; let best = -1, bs = 1e9;
  for (const ahead of [5, 12, 20]){
    const n = roadCands(C.x + cs*ahead, C.y + sn*ahead);
    for (let q = 0; q < n; q++){ const R = RC[q], l = SGR.lines[R.li]; if (l.c > 11 || (cur && cur.c < 11 && l.c === 11)) continue;
      const al = R.dx*cs + R.dy*sn; if ((l.flags & 1) && al < 0.3) continue;
      const sc = (1 - Math.abs(al))*2 + Math.min(3, Math.abs(R.z - C.z))*0.6 + ((l.flags & 16) && !(cur && (cur.flags & 16)) ? 0.8 : 0) + (cur && l.c !== cur.c ? 0.5 : 0)
        + (cur && (l.ref || '') !== (cur.ref || '') ? 0.4 : 0) + (cur && l.name && cur.name && l.name[0] !== cur.name[0] ? 0.3 : 0) + (R.li === AUTO.li ? -0.4 : 0);
      if (sc < bs){ bs = sc; best = R.li; } }
    if (best >= 0) break;
  }
  if (best >= 0) AUTO.li = best; else if (C.li >= 0 && C.kind === 'road') AUTO.li = C.li;
  return AUTO.li >= 0 ? SGR.lines[AUTO.li] : null;
}
function rcAutoInput(thrCap, vset){
  const C = CAR, ms = rcMaxSteer(C.u); let want = C.psi, vt = vset ? vset/2.23694 : 25;
  const l = rcAutoLine();
  if (l){ if (!vset) vt = rcLimitOf(AUTO.li, l.c)/2.23694;
    const P = l.P, m = P.length >> 1; let bk = 0, bd = 1e18, bt = 0;
    for (let k = 0; k < m - 1; k++){ const ax = P[k*2], ay = P[k*2 + 1], dx = P[k*2 + 2] - ax, dy = P[k*2 + 3] - ay, l2 = dx*dx + dy*dy || 1, t = clamp(((C.x - ax)*dx + (C.y - ay)*dy)/l2, 0, 1), d = (ax + dx*t - C.x)**2 + (ay + dy*t - C.y)**2; if (d < bd){ bd = d; bk = k; bt = t; } }
    const dx = P[bk*2 + 2] - P[bk*2], dy = P[bk*2 + 3] - P[bk*2 + 1], sg = (l.flags & 1) ? 1 : (dx*Math.cos(C.psi) + dy*Math.sin(C.psi) >= 0 ? 1 : -1);
    const walk = dist => { let rest = dist, k = bk, x = P[bk*2] + dx*bt, y = P[bk*2 + 1] + dy*bt;
      while (rest > 0){ const nk = sg > 0 ? k + 1 : k, tx = P[nk*2], ty = P[nk*2 + 1], d = Math.hypot(tx - x, ty - y); if (d >= rest){ x += (tx - x)/d*rest; y += (ty - y)/d*rest; break; } rest -= d; x = tx; y = ty; k += sg; if (k < 0 || k >= m - 1){ x += Math.cos(C.psi)*rest; y += Math.sin(C.psi)*rest; break; } }
      return [x, y]; };
    const off = rcLaneOff(l), a = walk(9 + Math.abs(C.u)*0.55), b = walk(14 + Math.abs(C.u)*0.55), hx = Math.atan2(b[1] - a[1], b[0] - a[0]);
    const tx = a[0] + Math.sin(hx)*off, ty = a[1] - Math.cos(hx)*off; want = Math.atan2(ty - C.y, tx - C.x);
    const f = walk(30 + Math.abs(C.u)*1.6), ang = Math.abs(wrapA(Math.atan2(f[1] - C.y, f[0] - C.x) - C.psi)); vt = Math.min(vt, Math.max(5, 34*(1 - ang/0.75)));
  }
  // keep a gap to the traffic ahead in the lane
  { const cs = Math.cos(C.psi), sn = Math.sin(C.psi); for (let q = 0; q < OBSn; q++){ const o = OBS[q], dx = o.x - C.x, dy = o.y - C.y, f = dx*cs + dy*sn, lat = -dx*sn + dy*cs;
      if (f > 2 && f < 60 && Math.abs(lat) < 2.0 && Math.abs(o.z - C.z) < 2.5){ const ov = Math.max(0, o.vx*cs + o.vy*sn); vt = Math.min(vt, ov + Math.max(0, f - 10 - C.u*0.9)*0.4); } } }
  const err = wrapA(want - C.psi), u = C.u;
  return {thr:u < vt - 0.4 ? clamp((vt - u)*0.35, 0.12, thrCap) : 0, brk:u > vt + 0.8 ? clamp((u - vt)*0.25, 0.05, 1) : 0, steer:clamp(err*2.4/Math.max(0.04, ms), -1, 1), hb:0};
}

/* ================= minimap: the circuit (race) or the streets around the car, heading up (free) ================= */
const MAP = {cv:null, ctx:null, off:null, oc:null, rx:1e9, ry:1e9, sc:0, trk:null, frame:0};
function mapDraw(){
  const cv = MAP.cv; if (!cv || (MAP.frame++ % 2)) return;
  const css = cv.clientWidth || 176, dpr = Math.min(2, window.devicePixelRatio || 1), S = Math.round(css*dpr); if (cv.width !== S){ cv.width = cv.height = S; MAP.rx = 1e9; MAP.trk = null; }
  const ctx = MAP.ctx, C = CAR; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, S, S);
  if (F1.mode === 'race' && TR){
    const bw = TR.bb[2] - TR.bb[0], bh = TR.bb[3] - TR.bb[1], k = S*0.84/Math.max(bw, bh), ox = S/2 - TR.cx*k, oy = S/2 + TR.cy*k;
    if (!MAP.trk){ const p = new Path2D(); for (let i = 0; i <= TR.n; i++){ const x = ox + TR.X[i]*k, y = oy - TR.Y[i]*k; if (i) p.lineTo(x, y); else p.moveTo(x, y); } MAP.trk = p; }
    ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 7*dpr; ctx.stroke(MAP.trk); ctx.strokeStyle = '#d9dee0'; ctx.lineWidth = 2.6*dpr; ctx.stroke(MAP.trk);
    const sx = ox + TR.X[TR.startI]*k, sy = oy - TR.Y[TR.startI]*k; ctx.fillStyle = '#fff'; ctx.fillRect(sx - 3*dpr, sy - 3*dpr, 6*dpr, 6*dpr);
    for (const a of AI){ const L = LIV[a.car]; ctx.fillStyle = `rgb(${L.p.map(v => Math.round(v*255)).join(',')})`; ctx.beginPath(); ctx.arc(ox + a.x*k, oy - a.y*k, 3.4*dpr, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.lineWidth = 1*dpr; ctx.stroke(); }
    ctx.fillStyle = '#ff3b30'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2*dpr; ctx.beginPath(); ctx.arc(ox + C.x*k, oy - C.y*k, 4.8*dpr, 0, TAU); ctx.fill(); ctx.stroke();
    return;
  }
  // free drive: a road layer around the car (redrawn when the car leaves its middle), drawn rotated so that the heading points up
  const kmh = Math.abs(C.u)*3.6, sc = (kmh < 70 ? 0.5 : kmh < 170 ? 0.33 : 0.22)*dpr, R = 512;
  if (!MAP.off){ MAP.off = document.createElement('canvas'); MAP.off.width = MAP.off.height = R; MAP.oc = MAP.off.getContext('2d'); }
  if (sc !== MAP.sc || Math.hypot(C.x - MAP.rx, C.y - MAP.ry)*sc > R*0.22){ MAP.sc = sc; MAP.rx = C.x; MAP.ry = C.y; mapRoads(); }
  ctx.save(); ctx.translate(S/2, S*0.58); ctx.rotate(C.psi - PI/2); ctx.drawImage(MAP.off, -((C.x - MAP.rx)*sc + R/2), -(-(C.y - MAP.ry)*sc + R/2)); ctx.restore();
  ctx.save(); ctx.translate(S/2, S*0.58); ctx.fillStyle = '#ff3b30'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.6*dpr; ctx.beginPath(); ctx.moveTo(0, -8*dpr); ctx.lineTo(5.5*dpr, 6*dpr); ctx.lineTo(0, 3*dpr); ctx.lineTo(-5.5*dpr, 6*dpr); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
  if (!MAP.font) MAP.font = (getComputedStyle(document.body).getPropertyValue('--font-mono') || 'monospace').trim();
  // north arrow (the map turns with the car)
  { const al = C.psi - PI/2, r = S*0.4, nx = S/2 + Math.sin(al)*r, ny = S*0.58 - Math.cos(al)*r; ctx.fillStyle = 'rgba(12,17,20,.8)'; ctx.beginPath(); ctx.arc(nx, ny, 7*dpr, 0, TAU); ctx.fill();
    ctx.fillStyle = '#f2c14e'; ctx.font = `600 ${9*dpr}px ${MAP.font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('N', nx, ny + 0.5*dpr); }
}
function mapRoads(){
  const o = MAP.oc, R = 512, sc = MAP.sc, rx = MAP.rx, ry = MAP.ry, half = R/2/sc; o.clearRect(0, 0, R, R);
  if (!RI.coarse) return; const G = RI.G, NB = RI.NB, Ls = SGR.lines, seen = new Set(), byC = [[], [], [], []];
  for (let by = Math.floor((ry - half + HALF)/G); by <= Math.floor((ry + half + HALF)/G); by++) for (let bx = Math.floor((rx - half + HALF)/G); bx <= Math.floor((rx + half + HALF)/G); bx++){
    if (bx < 0 || by < 0 || bx >= NB || by >= NB) continue; const list = RI.coarse.get(by*NB + bx); if (!list) continue;
    for (const li of list){ if (seen.has(li)) continue; seen.add(li); const c = Ls[li].c; byC[c <= 1 ? 3 : c <= 9 || c === 18 ? 2 : c === 10 || c === 13 || c === 14 ? 1 : 0].push(li); } }
  const style = [['rgba(160,170,176,.45)', 2.6], ['rgba(200,208,212,.75)', 5], ['rgba(232,236,238,.95)', 8], ['#f2c14e', 12]];
  o.lineCap = 'round'; o.lineJoin = 'round';
  for (let g = 0; g < 4; g++){ o.strokeStyle = style[g][0]; o.lineWidth = Math.max(1.2, style[g][1]*sc*1.3); o.beginPath();
    for (const li of byC[g]){ const P = Ls[li].P; for (let k = 0; k < P.length; k += 2){ const x = (P[k] - rx)*sc + R/2, y = -(P[k + 1] - ry)*sc + R/2; if (k) o.lineTo(x, y); else o.moveTo(x, y); } }
    o.stroke(); }
  if (TR){ o.strokeStyle = 'rgba(255,90,70,.9)'; o.lineWidth = Math.max(2, 10*sc); o.beginPath(); for (let i = 0; i <= TR.n; i++){ const x = (TR.X[i] - rx)*sc + R/2, y = -(TR.Y[i] - ry)*sc + R/2; if (i) o.lineTo(x, y); else o.moveTo(x, y); } o.stroke(); }
}

/* ================= keyboard (capture phase: the app's own navigation never sees the keys while driving) ================= */
addEventListener('keydown', e => {
  if (!F1.on) return; const t = e.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
  if (e.ctrlKey || e.metaKey || /^F\d+$/.test(e.code)) return;
  const c = e.code;
  if (MPN.keyFn && MPN.keyFn(c, e)){ e.preventDefault(); e.stopImmediatePropagation(); return; }   // [lm25/net]
  if (c === 'Escape') f1Exit();
  else if (c === 'KeyC'){ if (!e.repeat) nextCam(e.shiftKey ? -1 : 1); }
  else if (dcKey(c, e)){ /* [lm28/drivecam] B V P 1-7 */ }
  else if (c === 'KeyR'){ if (!e.repeat) resetCar(); }
  else if (c === 'KeyK'){ if (!e.repeat) audToggle(); }   // [lm30/nav] M = the big map (lm30/nav), sound on K
  else if (c === 'KeyH'){ if (!e.repeat && HUD.q) HUD.q.hint.hidden = !HUD.q.hint.hidden; }
  else if (F1.veh === 'car' && (c === 'KeyL' || c === 'KeyQ' || c === 'KeyE' || c === 'KeyZ')){ if (!e.repeat) rcKey(c); }
  else KEYS.add(c);
  e.preventDefault(); e.stopImmediatePropagation();
}, true);
addEventListener('keyup', e => { if (!F1.on) return; KEYS.delete(e.code); if (e.code === 'KeyB') dcLb(false, 'key'); e.stopImmediatePropagation(); }, true);
addEventListener('blur', () => KEYS.clear());

/* ================= hooks ================= */
HOOKS.boot.push(() => buildUI());
// [lm27/nyrace] the race card follows the circuit of this map
function raceCardSync(){
  const F = net && net.f1, p = HUD.pane; if (!p) return;
  const nm = trName(), sp = p.querySelector('#f1RaceName'); if (sp) sp.textContent = nm[0] + ' · ' + nm[1].replace(/ Street Circuit$/, '');
  const op = p.querySelector('.f1opts'); if (op && isRC()) op.hidden = !F;
  if (F && F.laps && !F1.lapsUser && !MPN.race){ F1.laps = clamp(F.laps | 0, 1, 9); p.querySelectorAll('[data-laps]').forEach(y => y.setAttribute('aria-pressed', String(+y.dataset.laps === F1.laps))); }
}
HOOKS.net.push(() => { if (net.f1 && net.f1.im) net.f1.im.visible = false; trackInit(); aiInit(); if (F1.on && F1.mode === 'race' && !TR) f1Exit(); try { raceCardSync(); } catch (e){ console.error('f1d race card', e); } });
HOOKS.frame.push((t, dt) => {
  if (SGR.on && !net.f1 && !F1.on && (BRK.trees.length || BRK.poles.length || BRK.shakes.length)) breakTick(dt);
  if (!SGR.on){ if (F1.on) f1Exit(); if (M.body && meshVis){ M.body.visible = M.wheel.visible = M.rain.visible = false; meshVis = false; } if (RCM.vis) rcHide(); return; }
  if (!net.f1 && !F1.on) return;
  const t0 = performance.now();
  if (net.f1 && net.f1.im && net.f1.im.visible) net.f1.im.visible = false;   // our cars replace the simple circuit cars
  ensureMeshes();
  if (!TR || TR.F !== net.f1){ trackInit(); aiInit(); }
  if (F1.on) driveTick(dt);
  const c = camera.position, far = !F1.on && TR && Math.hypot(Math.max(0, Math.abs(c.x - TR.cx) - 1500), Math.max(0, Math.abs(-c.z - TR.cy) - 1500), c.y) > 6500;
  if (!far) aiTick(dt);
  updateMeshes(); rcUpdate(dt);
  if (F1.on){ camStep(dt); hudTick(); biPrefetch(CAR.x, CAR.y);
    // tile streaming: the queue of unbuilt tiles is ordered from a point ahead of the car
    if (SGR.queue && SGR.queue.length && ((F1.sq = (F1.sq || 0) + 1) % 20 === 0) && typeof sgrSortQueue === 'function'){ const T = controls.target, sx = T.x, sz = T.z;
      T.x = CAR.x + Math.cos(CAR.psi)*300; T.z = -(CAR.y + Math.sin(CAR.psi)*300); sgrSortQueue(); T.x = sx; T.z = sz; } }
  if (AUD.ctx) audTick();
  crashTick(dt); corridorTick();
  F1.ms = F1.ms*0.95 + (performance.now() - t0)*0.05;
});

/* ================= [lm24/drive] v27: the car collides with everything, damage, breakable trees and poles ================= */
// What the car hits (free drive, all three maps): real buildings everywhere (a wall that stands on a drawn carriageway - a footprint
// overlapping the road in the data - lets the car through), the landmark models by their real geometry (a 1 m column grid of their
// steep faces between ground and 90 m, built near the car a slice per frame: towers, piers, railings, kerbs; decks and floors are not
// walls), the road module's solid things (its own obstacle records, copied per road tile: lamp poles, high masts, deck parapets,
// median barriers, piers, tunnel portals - each one identified, so poles can break), street / park trees (breakable), the traffic
// module's signal poles (breakable) and bus shelters, the traffic cars and buses (two-body impulses: they are knocked out of their lane,
// spin, stop, hoot and show their damage), the sea. Contacts are resolved every 1/240 s sub-step (0.35 m at 300 km/h: no tunnelling)
// with restitution and friction and a positional split by mass.
// Damage: four zones (front, rear, left, right) collect the impact energy; dents (vertex displacement of the car's own copy of its body
// around the impact point), broken lamps and glass, a hanging bumper / lost front wing, steam then smoke then fire (window.SGFX when
// present, else a small pooled sprite system), less power, grip, brakes and top speed, a pull to the damaged side, a wreck state at
// extreme damage (R repairs). Sounds through SGAudio.fx (crash, crunch, scrape, glass, tyre, treefall, polebreak), all guarded.
// Breakables (window.SGBreak = {hitTree, hitPole, near}): a tree or pole hit hard enough falls over (a pivot at its base, it settles
// on the ground, stays for a few minutes or until its tile rebuilds); small hits shake a tree; the car loses the speed the object took.
const KND = {WALL:1, BLD:2, LM:3, WATER:4, CAR:5, POLE:6, RAIL:7, PIER:8, TREE:9, SIG:10, SHELTER:11, MAST:12, DEBRIS:13, GROUND:14};
const KNAME = ['', 'wall', 'building', 'landmark', 'water', 'car', 'pole', 'rail', 'pier', 'tree', 'signal', 'shelter', 'mast', 'debris', 'ground'];
const CRS = {time:0, snd:{}, log:[], logOn:false, hits:0, breaks:{tree:0, pole:0, sig:0}, scrapeT:0, tyreT:0, skid:false, frameHit:null, lastSnd:{}};
function sfx(name, x, y, z, k){
  CRS.snd[name] = (CRS.snd[name] || 0) + 1;
  try { const A = window.SGAudio; if (A && A.fx) A.fx(name, {x, y, z, k:clamp(k, 0, 1)}); } catch (e){ /* the sound system is optional */ }
}
const pvOf = () => F1.veh === 'car' ? RCP : PH;

// ---- contacts of the current frame (strongest per kind feed the damage and the sounds)
const CT = []; let CTn = 0;
for (let i = 0; i < 24; i++) CT.push({kind:0, vn:0, E:0, x:0, y:0, z:0, nx:0, ny:0, lx:0, ly:0, vt:0, ref:null});
function contact(kind, vn, E, ax, ay, nx, ny, vt, ref){
  const C = CAR; let c = null;
  for (let i = 0; i < CTn; i++) if (CT[i].kind === kind){ c = CT[i]; break; }
  if (!c){ if (CTn >= CT.length) return; c = CT[CTn++]; c.kind = kind; c.vn = -1; c.E = 0; c.vt = 0; }
  if (vt > c.vt) c.vt = vt;
  if (vn <= c.vn) return;
  const cs = Math.cos(C.psi), sn = Math.sin(C.psi);
  c.vn = vn; c.E = Math.max(c.E, E); c.x = C.x + ax; c.y = C.y + ay; c.z = C.z + 0.5; c.nx = nx; c.ny = ny; c.lx = ax*cs + ay*sn; c.ly = -ax*sn + ay*cs; c.ref = ref || null;
}
// an impulse on the car at arm (ax, ay) along n (away from the obstacle) against a fixed obstacle moving at (ovx, ovy); returns the
// approach speed, records the contact
function impact2(C, nx, ny, ax, ay, e, mu, ovx, ovy, kind, ref){
  // [lm30/phys2] the full angular response at the contact point (the friction acts at the body's side, about 0.9 m out from the circle
  // centre the arm (ax, ay) points to): a glancing or off-centre hit spins the car as much as the impulse says; a hard sideways hit
  // against a low parapet / railing trips a high car over (beyond its static stability)
  const cs = Math.cos(C.psi), sn = Math.sin(C.psi); let Vx = C.u*cs - C.v*sn, Vy = C.u*sn + C.v*cs;
  const pvx = Vx - C.r*ay - (ovx || 0), pvy = Vy + C.r*ax - (ovy || 0), vn = pvx*nx + pvy*ny; if (vn >= 0) return 0;
  const PV = pvOf(), an = ax*ny - ay*nx, k = 1/PV.m + an*an/PV.Iz, j = -(1 + e)*vn/k;
  const tx = -ny, ty = nx, vt = pvx*tx + pvy*ty - 0.9*C.r, at = ax*ty - ay*tx - 0.9; let jt = -vt/(1/PV.m + at*at/PV.Iz); jt = clamp(jt, -mu*j, mu*j);
  Vx += (j*nx + jt*tx)/PV.m; Vy += (j*ny + jt*ty)/PV.m; C.r += (an*j + at*jt)/PV.Iz; C.r = clamp(C.r, -4, 4);
  C.u = Vx*cs + Vy*sn; C.v = -Vx*sn + Vy*cs; C.hit = Math.max(C.hit, -vn);
  if (kind) contact(kind, -vn, 0.5*vn*vn/k*(1 - e*e), ax, ay, nx, ny, Math.abs(vt), ref);
  if (kind === KND.RAIL && F1.veh === 'car' && !AIR.on && F1.mode !== 'race'){
    const lat = Math.abs(-(j*nx + jt*tx)*sn + (j*ny + jt*ty)*cs)/PV.m, ssf = rollSSF();
    if (lat > 5.2*ssf && Math.abs(-nx*sn + ny*cs) > 0.75){ P2.trips++; rollStart(-nx, -ny, lat, ssf, 'trip'); }
  }
  return -vn;
}
function push2(C, ax, ay, e, mu, kind, ref, ovx, ovy){ const d = Math.min(PUSH.depth, 1.2); C.x += PUSH.nx*d; C.y += PUSH.ny*d; return impact2(C, PUSH.nx, PUSH.ny, ax, ay, e, mu, ovx, ovy, kind, ref); }
// the normal approach speed at arm (ax, ay) along n (positive: closing), without changing anything
function approach(C, nx, ny, ax, ay){ const cs = Math.cos(C.psi), sn = Math.sin(C.psi), Vx = C.u*cs - C.v*sn - C.r*ay, Vy = C.u*sn + C.v*cs + C.r*ax; return -(Vx*nx + Vy*ny); }
function effMass(C, nx, ny, ax, ay){ const PV = pvOf(), an = ax*ny - ay*nx; return 1/(1/PV.m + an*an/PV.Iz); }
// a breakable thing in the way: with more energy than it takes to break it, it breaks and takes that energy (x1.3) from the car's
// normal speed; otherwise an ordinary impact. Returns true if it broke.
function breakOrHit(C, ax, ay, Eb, kind, ref, onBreak){
  const nx = PUSH.nx, ny = PUSH.ny, vn = approach(C, nx, ny, ax, ay); if (vn <= 0){ push2(C, ax, ay, 0.12, 0.3, kind, ref); return false; }
  const me = effMass(C, nx, ny, ax, ay), E = 0.5*me*vn*vn;
  if (E > Eb){
    const v2 = Math.sqrt(Math.max(0, vn*vn - 2*Eb*1.3/me)), dv = vn - v2, cs = Math.cos(C.psi), sn = Math.sin(C.psi), PV = pvOf();
    let Vx = C.u*cs - C.v*sn, Vy = C.u*sn + C.v*cs; const j = dv*me, an = ax*ny - ay*nx;
    Vx += j*nx/PV.m; Vy += j*ny/PV.m; C.r = clamp(C.r + 0.4*an*j/PV.Iz, -2.5, 2.5); C.u = Vx*cs + Vy*sn; C.v = -Vx*sn + Vy*cs; C.hit = Math.max(C.hit, dv*2);
    contact(kind, dv*1.6, Eb*0.6, ax, ay, nx, ny, 0, ref);
    onBreak(-nx, -ny, E);
    return true;
  }
  push2(C, ax, ay, 0.12, 0.3, kind, ref);
  return false;
}

// ---- the road module's obstacles, copied per road tile (2 km) with their identity: kind, a corridor / broken flag
const OBX = {tiles:new Map(), PUSHI:-1, PUSHT:null};
const OBK = {POLE:1, MAST:2, RAIL:3, PIER:4};
function obxTile(x, y){
  if (typeof SGRoads === 'undefined' || !SGRoads.obstaclesNear || !SGRoads.surfaceReady) return null;
  const TL = 2000, TX = Math.round(2*HALF/TL), tx = Math.floor((x + HALF)/TL), ty = Math.floor((y + HALF)/TL); if (tx < 0 || ty < 0 || tx >= TX || ty >= TX) return null;
  const ti = ty*TX + tx; let T = OBX.tiles.get(ti); if (T) return T;
  if (!SGRoads.surfaceReady(x, y)) return null;
  const cx = -HALF + (tx + 0.5)*TL, cy = -HALF + (ty + 0.5)*TL, L = SGRoads.obstaclesNear(cx, cy, 1500) || [], n = L.length;
  const d = new Float32Array(n*10), kind = new Uint8Array(n), off = new Uint8Array(n);
  for (let i = 0; i < n; i++){ const o = L[i], q = i*10, box = o.type === 'box';
    d[q] = box ? 1 : 0; d[q+1] = o.x0; d[q+2] = o.y0; d[q+3] = o.x1; d[q+4] = o.y1; d[q+5] = o.r; d[q+6] = o.z0; d[q+7] = o.z1; d[q+8] = o.a; d[q+9] = o.b;
    if (box) kind[i] = OBK.PIER; else if (Math.abs(o.x1 - o.x0) < 1e-3 && Math.abs(o.y1 - o.y0) < 1e-3) kind[i] = o.r <= 0.22 && o.z1 - o.z0 > 2.5 ? OBK.POLE : OBK.MAST; else kind[i] = OBK.RAIL; }
  const CS = 8, NC = TL/CS, x0 = cx - TL/2, y0 = cy - TL/2, cnt = new Int32Array(NC*NC + 1), bb = new Int16Array(n*4), cl = v => v < 0 ? 0 : v >= NC ? NC - 1 : v;
  for (let i = 0; i < n; i++){ const q = i*10; let a, b, c, e;
    if (d[q] === 0){ const r = d[q+5]; a = Math.min(d[q+1], d[q+3]) - r; c = Math.max(d[q+1], d[q+3]) + r; b = Math.min(d[q+2], d[q+4]) - r; e = Math.max(d[q+2], d[q+4]) + r; }
    else { const ex = Math.abs(d[q+3])*d[q+8] + Math.abs(d[q+4])*d[q+9], ey = Math.abs(d[q+4])*d[q+8] + Math.abs(d[q+3])*d[q+9]; a = d[q+1] - ex; c = d[q+1] + ex; b = d[q+2] - ey; e = d[q+2] + ey; }
    bb[i*4] = cl(Math.floor((a - x0)/CS)); bb[i*4+1] = cl(Math.floor((b - y0)/CS)); bb[i*4+2] = cl(Math.floor((c - x0)/CS)); bb[i*4+3] = cl(Math.floor((e - y0)/CS));
    for (let gy = bb[i*4+1]; gy <= bb[i*4+3]; gy++) for (let gx = bb[i*4]; gx <= bb[i*4+2]; gx++) cnt[gy*NC + gx + 1]++; }
  for (let i = 0; i < NC*NC; i++) cnt[i+1] += cnt[i];
  const ref = new Int32Array(cnt[NC*NC]), fill = cnt.slice(0, NC*NC);
  for (let i = 0; i < n; i++) for (let gy = bb[i*4+1]; gy <= bb[i*4+3]; gy++) for (let gx = bb[i*4]; gx <= bb[i*4+2]; gx++) ref[fill[gy*NC + gx]++] = i;
  T = {ti, x0, y0, n, d, kind, off, CS, NC, cnt, ref, stamp:new Int32Array(n), q:0};
  obxCorridor(T);
  for (const B of BRK.poles) if (B.kind === 'road' && B.ti === ti && B.i < n) T.off[B.i] = 2;
  OBX.tiles.set(ti, T); if (OBX.tiles.size > 10){ for (const k of OBX.tiles.keys()){ if (k !== ti){ OBX.tiles.delete(k); break; } } }
  return T;
}
// the F1 circuit (Singapore): what stands inside its walls is not there (f1track keeps the city off the corridor; poles of the real
// streets it uses are hidden by the pole shader)
function obxCorridor(T){
  if (!TR) return;
  const b = TR.bb; if (T.x0 > b[2] + 20 || T.x0 + 2000 < b[0] - 20 || T.y0 > b[3] + 20 || T.y0 + 2000 < b[1] - 20) return;
  const d = T.d;
  for (let i = 0; i < T.n; i++){ const q = i*10, cap = d[q] === 0, len = cap ? Math.hypot(d[q+3] - d[q+1], d[q+4] - d[q+2]) : 0, ns = cap ? Math.max(1, Math.ceil(len/2)) : 0;
    for (let k = 0; k <= ns; k++){ const f = ns ? k/ns : 0, x = cap ? d[q+1] + (d[q+3] - d[q+1])*f : d[q+1], y = cap ? d[q+2] + (d[q+4] - d[q+2])*f : d[q+2];
      const p = trProj(x, y, TPJ3); if (!p || p.dist > 16) continue;
      const wl = TR.wl ? TR.wl[p.i] : 10.05, wr = TR.wr ? TR.wr[p.i] : 10.05, ext = cap ? d[q+5] : Math.max(d[q+8], d[q+9]);
      if (p.d - ext > wl - 0.2 || p.d + ext < -wr + 0.2) continue;
      const z = trSurf(p.i, p.t, x, y); if (d[q+7] < z + 0.1 || d[q+6] > z + 2.2) continue;
      T.off[i] = 1; if (T.kind[i] === OBK.POLE) hideAdd(x, y, d[q+6], d[q+7], true); break; } }
}
const TPJ3 = {i:0, t:0, s:0, d:0, dist:0};
// push a circle out of the obstacles of the tile under it (corridor / broken ones skipped); PUSH + OBX.PUSHI / PUSHT = the one hit
function obxCircle(x, y, r, z0, z1){
  PUSH.depth = 0; OBX.PUSHI = -1; const T = obxTile(x, y); if (!T || !T.n) return false;
  const CS = T.CS, NC = T.NC, d = T.d, cl = v => v < 0 ? 0 : v >= NC ? NC - 1 : v;
  const a = cl(Math.floor((x - r - T.x0)/CS)), b = cl(Math.floor((y - r - T.y0)/CS)), c = cl(Math.floor((x + r - T.x0)/CS)), e = cl(Math.floor((y + r - T.y0)/CS));
  const q = ++T.q;
  for (let gy = b; gy <= e; gy++) for (let gx = a; gx <= c; gx++){ const k = gy*NC + gx;
    for (let p = T.cnt[k]; p < T.cnt[k+1]; p++){
      const id = T.ref[p]; if (T.stamp[id] === q) continue; T.stamp[id] = q; if (T.off[id]) continue;
      const o = id*10; if (d[o+7] < z0 || d[o+6] > z1) continue;
      let pen, nx, ny;
      if (d[o] === 0){
        const ax = d[o+1], ay = d[o+2], ex = d[o+3] - ax, ey = d[o+4] - ay, l2 = ex*ex + ey*ey; let t = l2 > 1e-9 ? ((x - ax)*ex + (y - ay)*ey)/l2 : 0; t = t < 0 ? 0 : t > 1 ? 1 : t;
        const px = x - ax - ex*t, py = y - ay - ey*t, dd = Math.sqrt(px*px + py*py); pen = r + d[o+5] - dd; if (pen <= 0) continue;
        if (dd > 1e-6){ nx = px/dd; ny = py/dd; } else { const l = Math.sqrt(l2) || 1; nx = -ey/l; ny = ex/l; }
      } else {
        const ux = d[o+3], uy = d[o+4], dx = x - d[o+1], dy = y - d[o+2], la = dx*ux + dy*uy, lb = -dx*uy + dy*ux, ha = d[o+8], hb = d[o+9];
        const qa = la < -ha ? -ha : la > ha ? ha : la, qb = lb < -hb ? -hb : lb > hb ? hb : lb, ea = la - qa, eb = lb - qb, dd = Math.sqrt(ea*ea + eb*eb);
        let na, nb;
        if (dd > 1e-6){ if (dd >= r) continue; pen = r - dd; na = ea/dd; nb = eb/dd; }
        else { const pa = ha - Math.abs(la), pb = hb - Math.abs(lb); if (pa < pb){ na = la < 0 ? -1 : 1; nb = 0; pen = pa + r; } else { na = 0; nb = lb < 0 ? -1 : 1; pen = pb + r; } }
        nx = na*ux - nb*uy; ny = na*uy + nb*ux;
      }
      if (pen > PUSH.depth){ PUSH.depth = pen; PUSH.nx = nx; PUSH.ny = ny; OBX.PUSHI = id; OBX.PUSHT = T; }
    } }
  return PUSH.depth > 0;
}
// lamp pole break energy (J): steel break-away poles ~35-60 kJ, US wooden utility poles more
const poleEb = r => r >= 0.17 ? 150e3 : r >= 0.15 ? 70e3 : 45e3;

// ---- road poles hidden in the road module's meshes (its paths material and lamp glows): a vertex shader patch with a uniform list
// (broken poles and the poles inside the F1 circuit corridor); the pole / arm / lantern vertices are recognised by their colours
const HIDE = {list:[], max:96, arr:new Float32Array(96*4), n:{value:0}, bb:{value:new THREE.Vector4(1e9, 1e9, -1e9, -1e9)}, done:false, mats:[]};
HIDE.u = {value:HIDE.arr};
function hideAdd(x, y, zb, zt, perm){
  for (const h of HIDE.list) if (Math.abs(h.x - x) < 0.05 && Math.abs(h.y - y) < 0.05) return h;
  const h = {x, y, zb, zt, perm:!!perm}; HIDE.list.push(h);
  if (HIDE.list.length > HIDE.max){ const k = HIDE.list.findIndex(q => !q.perm); HIDE.list.splice(k >= 0 ? k : 0, 1); }
  hideSync(); return h;
}
function hideDel(h){ const k = HIDE.list.indexOf(h); if (k >= 0){ HIDE.list.splice(k, 1); hideSync(); } }
function hideSync(){
  const A = HIDE.arr, n = Math.min(HIDE.max, HIDE.list.length); let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (let i = 0; i < n; i++){ const h = HIDE.list[i]; A[i*4] = h.x; A[i*4+1] = -h.y; A[i*4+2] = h.zb; A[i*4+3] = h.zt; x0 = Math.min(x0, h.x - 7); x1 = Math.max(x1, h.x + 7); y0 = Math.min(y0, -h.y - 7); y1 = Math.max(y1, -h.y + 7); }
  HIDE.n.value = n; HIDE.bb.value.set(x0, y0, x1, y1); hidePatch();
}
const HIDE_GLSL = `uniform vec4 uHide[96]; uniform int uHideN; uniform vec4 uHideBB;
float poleCol(vec3 c){ vec3 k = c*255.0; const float e = 2.6;
  if (all(lessThan(abs(k - vec3(154.0, 161.0, 166.0)), vec3(e))) || all(lessThan(abs(k - vec3(123.0, 130.0, 135.0)), vec3(e))) || all(lessThan(abs(k - vec3(201.0, 206.0, 209.0)), vec3(e)))) return 1.0;
  if (all(lessThan(abs(k - vec3(169.0, 173.0, 172.0)), vec3(e))) || all(lessThan(abs(k - vec3(133.0, 138.0, 139.0)), vec3(e))) || all(lessThan(abs(k - vec3(183.0, 187.0, 188.0)), vec3(e)))) return 1.0;
  if (all(lessThan(abs(k - vec3(110.0, 93.0, 74.0)), vec3(e))) || all(lessThan(abs(k - vec3(87.0, 73.0, 58.0)), vec3(e))) || all(lessThan(abs(k - vec3(232.0, 230.0, 220.0)), vec3(e)))) return 1.0;
  return 0.0; }
float hidden(vec3 wp, float colOk, float rArm, float lo, float hi){
  if (uHideN == 0 || wp.x < uHideBB.x || wp.x > uHideBB.z || wp.z < uHideBB.y || wp.z > uHideBB.w || colOk < 0.5) return 0.0;
  for (int i = 0; i < 96; i++){ if (i >= uHideN) break; vec4 h = uHide[i]; vec2 d = wp.xz - h.xy; float dd = dot(d, d);
    if (dd < 0.13 && wp.y > h.z - 0.45 && wp.y < h.w + 0.25) return 1.0;
    if (dd < rArm*rArm && wp.y > h.w + lo && wp.y < h.w + hi) return 1.0; }
  return 0.0; }
`;
function hidePatch(){
  if (HIDE.done || typeof SGRoads === 'undefined') return; let MS = null; try { MS = SGRoads.materials; } catch (e){ return; } if (!MS || !MS.surf) return;
  HIDE.done = true;
  const patch = (m, pts) => { if (!m || m.userData.f1hide) return; m.userData.f1hide = true; const prev = m.onBeforeCompile;
    m.onBeforeCompile = function(sh, r){ if (prev) prev.call(this, sh, r); sh.uniforms.uHide = HIDE.u; sh.uniforms.uHideN = HIDE.n; sh.uniforms.uHideBB = HIDE.bb;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n' + HIDE_GLSL)
        .replace('#include <project_vertex>', '#include <project_vertex>\n{ vec4 hwp = modelMatrix*vec4(transformed, 1.0); float hc = ' + (pts ? '1.0' : 'poleCol(color.rgb)') + ';\n'
          + '  if (hidden(hwp.xyz, hc, ' + (pts ? '7.2, -1.1, 1.5' : '6.4, -0.8, 1.25') + ') > 0.5) gl_Position = vec4(2.0, 2.0, 2.0, 1.0); }'); };
    const k0 = m.customProgramCacheKey ? m.customProgramCacheKey.bind(m) : null; m.customProgramCacheKey = () => (k0 ? k0() : '') + '|f1hide';
    m.needsUpdate = true; HIDE.mats.push(m); };
  patch(MS.surf[2], false); if (MS.lamp && MS.lamp.isPointsMaterial) patch(MS.lamp, true);
  // the street light's pool on the road (night) fades out round a hidden pole
  const mk = MS.mark; if (mk && !mk.userData.f1hide){ mk.userData.f1hide = true; const prev = mk.onBeforeCompile;
    mk.onBeforeCompile = function(sh, r){ if (prev) prev.call(this, sh, r); sh.uniforms.uHide = HIDE.u; sh.uniforms.uHideN = HIDE.n; sh.uniforms.uHideBB = HIDE.bb;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vHideW;').replace('#include <project_vertex>', '#include <project_vertex>\nvHideW = (modelMatrix*vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vHideW;\nuniform vec4 uHide[96]; uniform int uHideN; uniform vec4 uHideBB;')
        .replace('#include <fog_fragment>', '{ if (vPool > 0.5 && uHideN > 0 && vHideW.x > uHideBB.x - 20.0 && vHideW.x < uHideBB.z + 20.0 && vHideW.z > uHideBB.y - 20.0 && vHideW.z < uHideBB.w + 20.0){ float k = 1.0;\n'
          + '  for (int i = 0; i < 96; i++){ if (i >= uHideN) break; vec4 h = uHide[i]; if (abs(vHideW.y - h.z) < 4.0) k = min(k, smoothstep(13.0, 26.0, length(vHideW.xz - h.xy))); }\n  gl_FragColor *= k; } }\n#include <fog_fragment>'); };
    const k0 = mk.customProgramCacheKey ? mk.customProgramCacheKey.bind(mk) : null; mk.customProgramCacheKey = () => (k0 ? k0() : '') + '|f1hide'; mk.needsUpdate = true; HIDE.mats.push(mk); }
}

// ---- trees: the trunk circles (TRK, trunks()) carry the instance index; broken / shaking trees
const BRK = {trees:[], poles:[], shakes:[], life:240};
const _m4 = new THREE.Matrix4(), _m4b = new THREE.Matrix4(), _m4c = new THREE.Matrix4(), _qv = new THREE.Quaternion(), _ax = new THREE.Vector3(), _pv2 = new THREE.Vector3();
function treeEb(r){ return 2.6e6*r*r*r; }   // trunk radius 0.2 m: 21 kJ, 0.38 m: 143 kJ, 0.5 m: 325 kJ
// knock a tree over: hide its instance (crown + trunk), a dynamic copy falls about its base towards (dx, dy)
function treeBreak(a, L, q, dx, dy, E){
  const idx = L[q + 5], src = a.src, tk = a.tk; if (idx === undefined || !src || a.broken.has(idx)) return null;
  a.broken.add(idx);
  const M0c = new Float32Array(16), M0t = new Float32Array(16); for (let k = 0; k < 16; k++){ M0c[k] = src.instanceMatrix.array[idx*16 + k]; M0t[k] = tk ? tk.instanceMatrix.array[idx*16 + k] : 0; }
  shakeStop(src, idx);
  const zero = _ZERO; src.setMatrixAt(idx, zero); src.instanceMatrix.needsUpdate = true; if (tk){ tk.setMatrixAt(idx, zero); tk.instanceMatrix.needsUpdate = true; }
  const mc = new THREE.InstancedMesh(src.geometry, src.material, 1), mt = tk ? new THREE.InstancedMesh(tk.geometry, tk.material, 1) : null;
  if (src.instanceColor){ mc.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(3), 3); for (let k = 0; k < 3; k++) mc.instanceColor.array[k] = src.instanceColor.array[idx*3 + k]; }
  for (const m of [mc, mt]) if (m){ m.castShadow = true; m.frustumCulled = false; m.name = 'f1fallen'; scene.add(m); }
  const dl = Math.hypot(dx, dy) || 1, B = {kind:'tree', a, src, tk, idx, M0c, M0t, mc, mt, x:M0t[12], y:-M0t[14], z:M0t[13], dx:dx/dl, dy:dy/dl, th:0.04, thV:0.25 + Math.min(1.2, Math.sqrt(E/2e5)), t:0, h:Math.max(3, M0c[13] - M0t[13]), done:false};
  // it comes to rest when the crown's underside meets the ground (the crown squashes a little)
  B.end = clamp(Math.acos(clamp(Math.hypot(M0c[4], M0c[5], M0c[6])*0.75/B.h, 0, 1)) + 0.12, 1.05, 1.45);
  BRK.trees.push(B); treeFallPose(B);
  CRS.breaks.tree++; sfx('treefall', B.x, B.y, B.z + 2, Math.min(1, 0.5 + B.h/12));
  if (BRK.trees.length > 24){ treeRestore(BRK.trees[0]); }
  return B;
}
function treeFallPose(B){
  // rotation about the horizontal axis perpendicular to the fall direction, pivot at the trunk base
  _ax.set(-B.dy, 0, -B.dx).normalize(); _qv.setFromAxisAngle(_ax, B.th);
  _m4.makeRotationFromQuaternion(_qv); const px = B.x, py = B.z, pz = -B.y;
  _m4b.makeTranslation(px, py, pz).multiply(_m4).multiply(_m4c.makeTranslation(-px, -py, -pz));
  _m4c.fromArray(B.M0c); _m4.multiplyMatrices(_m4b, _m4c); B.mc.setMatrixAt(0, _m4); B.mc.instanceMatrix.needsUpdate = true;
  if (B.mt){ _m4c.fromArray(B.M0t); _m4.multiplyMatrices(_m4b, _m4c); B.mt.setMatrixAt(0, _m4); B.mt.instanceMatrix.needsUpdate = true; }
}
function treeRestore(B){
  const i = BRK.trees.indexOf(B); if (i >= 0) BRK.trees.splice(i, 1);
  for (const m of [B.mc, B.mt]) if (m){ scene.remove(m); }
  if (B.src && B.src.parent){ _m4.fromArray(B.M0c); B.src.setMatrixAt(B.idx, _m4); B.src.instanceMatrix.needsUpdate = true; if (B.tk){ _m4.fromArray(B.M0t); B.tk.setMatrixAt(B.idx, _m4); B.tk.instanceMatrix.needsUpdate = true; } }
  if (B.a) B.a.broken.delete(B.idx);
}
// a small hit: the tree sways about its base and settles
function treeShake(a, L, q, dx, dy, amp){
  const idx = L[q + 5], src = a.src; if (idx === undefined || !src) return;
  for (const S of BRK.shakes) if (S.src === src && S.idx === idx){ S.amp = Math.max(S.amp*Math.exp(-2.6*S.t), amp); S.t = 0; return; }
  const M0c = new Float32Array(16), M0t = new Float32Array(16); for (let k = 0; k < 16; k++){ M0c[k] = src.instanceMatrix.array[idx*16 + k]; M0t[k] = a.tk ? a.tk.instanceMatrix.array[idx*16 + k] : 0; }
  const dl = Math.hypot(dx, dy) || 1; BRK.shakes.push({src, tk:a.tk, idx, M0c, M0t, t:0, amp, dx:dx/dl, dy:dy/dl, x:M0t[12], y:-M0t[14], z:M0t[13]});
}
function shakeStop(src, idx){ for (let i = BRK.shakes.length - 1; i >= 0; i--){ const S = BRK.shakes[i]; if (S.src === src && S.idx === idx) BRK.shakes.splice(i, 1); } }
function breakTick(dt){
  // falling trees: a rod falling about its base (theta'' = 1.5 g / H sin theta), a small bounce on the ground, then lying there
  for (let i = BRK.trees.length - 1; i >= 0; i--){ const B = BRK.trees[i]; B.t += dt;
    if (!B.src.parent || B.t > BRK.life){ treeRestore(B); continue; }
    if (!B.done){ const end = B.end || 1.4; B.thV += 1.5*9.81/B.h*Math.sin(B.th)*dt; B.th += B.thV*dt;
      if (B.th >= end){ B.th = end; if (B.thV > 0.6){ B.thV = -B.thV*0.22; } else { B.done = true; B.thV = 0; } if (!B.thumped){ B.thumped = true; sfx('debris', B.x + B.dx*B.h*0.7, B.y + B.dy*B.h*0.7, B.z, 0.5); } }
      treeFallPose(B); } }
  for (let i = BRK.shakes.length - 1; i >= 0; i--){ const S = BRK.shakes[i]; S.t += dt;
    const done = S.t > 2.2 || !S.src.parent, a = done ? 0 : S.amp*Math.exp(-2.6*S.t)*Math.sin(S.t*2*PI*1.6);
    _ax.set(-S.dy, 0, -S.dx).normalize(); _qv.setFromAxisAngle(_ax, a); _m4.makeRotationFromQuaternion(_qv);
    _m4b.makeTranslation(S.x, S.z, -S.y).multiply(_m4).multiply(_m4c.makeTranslation(-S.x, -S.z, S.y));
    if (S.src.parent){ _m4c.fromArray(S.M0c); _m4.multiplyMatrices(_m4b, _m4c); S.src.setMatrixAt(S.idx, _m4); S.src.instanceMatrix.needsUpdate = true;
      if (S.tk){ _m4c.fromArray(S.M0t); _m4.multiplyMatrices(_m4b, _m4c); S.tk.setMatrixAt(S.idx, _m4); S.tk.instanceMatrix.needsUpdate = true; } }
    if (done) BRK.shakes.splice(i, 1); }
  // falling poles (road lamp poles, signal poles)
  for (let i = BRK.poles.length - 1; i >= 0; i--){ const B = BRK.poles[i]; B.t += dt;
    if (B.t > BRK.life){ poleRestore(B); continue; }
    if (!B.done){ B.thV += 1.5*9.81/B.h*Math.sin(B.th)*dt; B.th += B.thV*dt;
      if (B.th >= 1.5){ B.th = 1.5; if (B.thV > 0.8) B.thV = -B.thV*0.25; else { B.done = true; B.thV = 0; } if (!B.thumped){ B.thumped = true; sfx('debris', B.x + B.dx*B.h*0.8, B.y + B.dy*B.h*0.8, B.z, 0.45); } }
      _ax.set(-B.dy, 0, -B.dx).normalize(); _qv.setFromAxisAngle(_ax, B.th); B.mesh.quaternion.copy(B.q0).premultiply(_qv); } }
}
// a fallen pole: a generic tapered pole (and an arm with a lantern / a signal head) in the original's colours, rotating about its base
const POLEMAT = new THREE.MeshLambertMaterial({vertexColors:true});
function poleMesh(h, r0, arm, ax, ay, kind){
  const P = [], Cc = [], I = [], us = isRC(), cP = kind === 'sig' ? [0.42, 0.44, 0.45] : us ? [0.66, 0.68, 0.67] : [0.6, 0.63, 0.65], cD = kind === 'sig' ? [0.3, 0.31, 0.32] : us ? [0.52, 0.54, 0.55] : [0.48, 0.51, 0.53], cH = kind === 'sig' ? [0.09, 0.09, 0.1] : [0.79, 0.81, 0.82];
  const v = (x, y, z, c) => { P.push(x, y, z); Cc.push(c[0], c[1], c[2]); return P.length/3 - 1; };
  const N = 6;
  for (let k = 0; k < N; k++){ const a0 = k/N*TAU, a1 = (k + 1)/N*TAU, c = k % 2 ? cD : cP, r1 = Math.max(0.06, r0*0.55);
    const i0 = v(Math.cos(a0)*r0, 0, Math.sin(a0)*r0, c), i1 = v(Math.cos(a1)*r0, 0, Math.sin(a1)*r0, c), i2 = v(Math.cos(a1)*r1, h, Math.sin(a1)*r1, c), i3 = v(Math.cos(a0)*r1, h, Math.sin(a0)*r1, c);
    I.push(i0, i2, i1, i0, i3, i2); }
  const box = (x0, x1, y0, y1, z0, z1, c) => { const b = P.length/3; for (const [x, y, z] of [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]]) v(x, y, z, c);
    for (const f of [[0, 1, 2, 3], [7, 6, 5, 4], [0, 4, 5, 1], [1, 5, 6, 2], [2, 6, 7, 3], [3, 7, 4, 0]]) I.push(b + f[0], b + f[2], b + f[1], b + f[0], b + f[3], b + f[2]); };
  if (kind === 'sig'){ box(-0.18, 0.18, h - 1.25, h - 0.1, -0.26, 0.26, cH); if (arm > 0) box(-0.06, 0.06, h + 1.9, h + 2.0, 0, arm, cD); }
  else if (arm > 0){ box(-0.05, 0.05, h - 0.05, h + 0.12, 0, arm, cD); box(-0.22, 0.22, h - 0.12, h + 0.06, arm - 0.1, arm + 0.6, cH); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3)); g.setIndex(I); g.computeVertexNormals();
  const m = new THREE.Mesh(g, POLEMAT); m.castShadow = true; m.name = 'f1fallen';
  // local +z = the arm direction (ax, ay) in the world
  m.rotation.y = Math.atan2(ax, -ay); m.updateMatrix();
  return m;
}
function poleBreak(kind, x, y, z0, z1, r, dx, dy, E, extra){
  const h = Math.max(3, z1 - z0 - 0.2), L = Math.hypot(dx, dy) || 1;
  let ax = extra && extra.ax !== undefined ? extra.ax : 0, ay = extra && extra.ay !== undefined ? extra.ay : 0, arm = extra && extra.arm !== undefined ? extra.arm : 0;
  if (kind === 'road'){
    // the arm reaches over the road: the nearest road centreline
    const n = roadCands(x, y); let bd = 1e9; for (let q = 0; q < n; q++){ const R = RC[q]; if (Math.abs(R.d) < bd){ bd = Math.abs(R.d); ax = -(-R.dy)*Math.sign(R.d || 1); ay = -(R.dx)*Math.sign(R.d || 1); } }
    if (!(ax || ay)){ ax = -dx/L; ay = -dy/L; } arm = 1.8;
  }
  const m = poleMesh(h, Math.max(0.09, r), arm, ax, ay, kind); m.position.set(x, z0 + 0.1, -y); scene.add(m);
  const B = {kind, x, y, z:z0, h, dx:dx/L, dy:dy/L, th:0.03, thV:0.35 + Math.min(1.4, Math.sqrt(E/1.5e5)), t:0, mesh:m, q0:m.quaternion.clone(), done:false};
  if (extra) Object.assign(B, extra);
  BRK.poles.push(B); if (BRK.poles.length > 30) poleRestore(BRK.poles[0]);
  CRS.breaks[kind === 'sig' ? 'sig' : 'pole']++; sfx('polebreak', x, y, z0 + 1, Math.min(1, 0.45 + E/3e5)); sfx('glass', x, y, z0 + h, 0.4);
  return B;
}
function poleRestore(B){
  const i = BRK.poles.indexOf(B); if (i >= 0) BRK.poles.splice(i, 1);
  scene.remove(B.mesh); B.mesh.geometry.dispose();
  if (B.hide) hideDel(B.hide);
  if (B.kind === 'road'){ const T = OBX.tiles.get(B.ti); if (T && T.off[B.i] === 2) T.off[B.i] = 0; }
}

// ---- the traffic module's signal poles and bus shelters near the car (breakable signal poles)
const PROPS = {list:[], t:1, x:0, y:0};
function propsCircle(x, y, r, z0, z1){
  PUSH.depth = 0; PROPS.hit = null; const L = PROPS.list;
  for (let i = 0; i < L.length; i++){ const P = L[i]; if (P.z + P.h < z0 || P.z > z1) continue;
    if (P.kind === 'sig'){ const dx = x - P.x, dy = y - P.y, dd = Math.hypot(dx, dy), pen = r + P.r - dd; if (pen > PUSH.depth){ PUSH.depth = pen; PUSH.nx = dd > 1e-6 ? dx/dd : 1; PUSH.ny = dd > 1e-6 ? dy/dd : 0; PROPS.hit = P; } }
    else if (obbCircle(x, y, r, P.x, P.y, P.hx, P.hy, P.hl, P.hw) && PUSH.depth > 0){ PROPS.hit = P; if (PUSH.depth > 1.2) PUSH.depth = 1.2; } }
  return PUSH.depth > 0;
}

// ---- landmark models: a 1 m column grid of their steep faces (ground .. +90 m), built near the car a slice of triangles per frame
const LMG = {grids:new Map(), job:null, t:0};
function lmgJob(L, g){
  const meshes = []; g.updateMatrixWorld(true);
  g.traverse(o => { if (!(o.isMesh || o.isInstancedMesh) || !o.geometry || !o.geometry.attributes.position || !o.visible) return; const a = o.geometry.attributes.position; if (!a.array) return;
    if (o.isInstancedMesh && o.count > 300) return; meshes.push(o); });
  const H = SGR.hulls && SGR.hulls.get(L.id), bb = H ? H.bb : [L.x - 300, L.y - 300, L.x + 300, L.y + 300];
  const x0 = Math.floor(bb[0] - 12), y0 = Math.floor(bb[1] - 12), nx = Math.ceil(bb[2] + 12) - x0, ny = Math.ceil(bb[3] + 12) - y0;
  return {L, g, meshes, mi:0, ti:0, ii:0, x0, y0, nx, ny, base:(L.top || 0) - 3, cells:new Map(), tris:0, samples:0, t0:performance.now()};
}
const _tv = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()], _tm = new THREE.Matrix4();
function lmgWork(J, budgetMs){
  const t0 = performance.now(), zTop = J.base + 95;
  while (J.mi < J.meshes.length){
    const o = J.meshes[J.mi], geo = o.geometry, pa = geo.attributes.position, idx = geo.index, nT = idx ? idx.count/3 : pa.count/3, nI = o.isInstancedMesh ? o.count : 1;
    while (J.ii < nI){
      if (o.isInstancedMesh){ o.getMatrixAt(J.ii, _tm); _tm.premultiply(o.matrixWorld); } else _tm.copy(o.matrixWorld);
      while (J.ti < nT){
        const t = J.ti++; if ((t & 255) === 255 && performance.now() - t0 > budgetMs) return false;
        for (let k = 0; k < 3; k++){ const vi = idx ? idx.getX(t*3 + k) : t*3 + k; _tv[k].fromBufferAttribute(pa, vi).applyMatrix4(_tm); }
        const A = _tv[0], B = _tv[1], C = _tv[2];
        const zmin = Math.min(A.y, B.y, C.y), zmax = Math.max(A.y, B.y, C.y); if (zmax < J.base || zmin > zTop) continue;
        // steep faces only (walls, piers, railings, kerb faces): normal mostly horizontal
        const ux = B.x - A.x, uy = B.y - A.y, uz = B.z - A.z, vx = C.x - A.x, vy = C.y - A.y, vz = C.z - A.z, nxx = uy*vz - uz*vy, nyy = uz*vx - ux*vz, nzz = ux*vy - uy*vx, nl = Math.hypot(nxx, nyy, nzz);
        if (nl < 1e-9 || Math.abs(nyy)/nl > 0.62) continue;
        J.tris++;
        const le = Math.max(Math.hypot(ux, uy, uz), Math.hypot(vx, vy, vz), Math.hypot(B.x - C.x, B.y - C.y, B.z - C.z)), n = Math.min(160, Math.max(1, Math.ceil(le/0.7)));
        for (let i = 0; i <= n; i++) for (let j = 0; j <= n - i; j++){ const a = i/n, b = j/n, px = A.x + ux*a + vx*b, py = A.y + uy*a + vy*b, pz = A.z + uz*a + vz*b;
          if (py < J.base || py > zTop) continue; const cx = Math.floor(px) - J.x0, cy = Math.floor(-pz) - J.y0; if (cx < 0 || cy < 0 || cx >= J.nx || cy >= J.ny) continue;
          J.samples++; const key = cy*J.nx + cx; let iv = J.cells.get(key); if (!iv){ J.cells.set(key, [py, py]); continue; }
          // merge into the cell's z intervals (gap < 0.5 m)
          let m = false; for (let q = 0; q < iv.length; q += 2){ if (py >= iv[q] - 0.5 && py <= iv[q + 1] + 0.5){ if (py < iv[q]) iv[q] = py; if (py > iv[q + 1]) iv[q + 1] = py; m = true; break; } }
          if (!m){ if (iv.length < 12) iv.push(py, py); else { iv[iv.length - 1] = Math.max(iv[iv.length - 1], py); } } }
      }
      J.ti = 0; J.ii++;
    }
    J.ii = 0; J.mi++;
  }
  // finalise: merge touching intervals, a flat Float32Array per cell
  const cells = new Map();
  let cut = 0;
  for (const [k, iv] of J.cells){
    // the F1 circuit: nothing solid between its walls (the circuit runs over the landmark's deck there)
    if (TR){ const cx = J.x0 + (k % J.nx) + 0.5, cy = J.y0 + Math.floor(k/J.nx) + 0.5; if (inCircuit(cx, cy, -0.4)){ const p = trProj(cx, cy, TPJ4); if (p){ const z = trSurf(p.i, p.t, cx, cy); let lo = 1e9, hi = -1e9; for (let q = 0; q < iv.length; q += 2){ lo = Math.min(lo, iv[q]); hi = Math.max(hi, iv[q + 1]); } if (hi > z && lo < z + 2.5){ cut++; continue; } } } }
    const P = []; for (let q = 0; q < iv.length; q += 2) P.push([iv[q] - 0.25, iv[q + 1] + 0.25]); P.sort((a, b) => a[0] - b[0]);
    const out = []; for (const p of P){ const l = out[out.length - 1]; if (l && p[0] <= l[1] + 0.3) l[1] = Math.max(l[1], p[1]); else out.push(p.slice()); }
    cells.set(k, Float32Array.from(out.flat())); }
  LMG.grids.set(J.L.id, {id:J.L.id, g:J.g, x0:J.x0, y0:J.y0, nx:J.nx, ny:J.ny, cells, pass:new Map(), tris:J.tris, samples:J.samples, cut, ms:+(performance.now() - J.t0).toFixed(0)});
  return true;
}
// keep the grids of the landmarks within ~150 m of the car built (one job at a time, ~3 ms per frame)
function lmgTick(x, y){
  if (typeof landmarks === 'undefined' || typeof lmMeshes === 'undefined') return;
  if (LMG.job){ if (lmgWork(LMG.job, 3)) LMG.job = null; return; }
  if ((LMG.t = (LMG.t + 1) % 15) !== 0) return;
  for (const L of landmarks){ const g = lmMeshes.get(L.id); if (!g) continue; const G = LMG.grids.get(L.id); if (G && G.g === g) continue;
    const H = SGR.hulls && SGR.hulls.get(L.id), bb = H ? H.bb : null; const d = bb ? Math.hypot(Math.max(0, bb[0] - x, x - bb[2]), Math.max(0, bb[1] - y, y - bb[3])) : Math.hypot(L.x - x, L.y - y) - 300;
    if (d > 150) continue; LMG.job = lmgJob(L, g); return; }
  if (LMG.grids.size > 8){ for (const [id, G] of LMG.grids){ const L = landmarks.find(q => q.id === id); if (!L || Math.hypot(L.x - x, L.y - y) > 2500){ LMG.grids.delete(id); break; } } }
}
// push a circle out of the landmark faces between heights z0..z1 (each solid 1 m cell is a disc of radius 0.6 m)
function lmgCircle(x, y, r, z0, z1){
  PUSH.depth = 0; if (!LMG.grids.size) return false;
  for (const G of LMG.grids.values()){
    const i0 = Math.floor(x - r - 0.6) - G.x0, i1 = Math.floor(x + r + 0.6) - G.x0, j0 = Math.floor(y - r - 0.6) - G.y0, j1 = Math.floor(y + r + 0.6) - G.y0;
    if (i1 < 0 || j1 < 0 || i0 >= G.nx || j0 >= G.ny) continue;
    for (let j = Math.max(0, j0); j <= Math.min(G.ny - 1, j1); j++) for (let i = Math.max(0, i0); i <= Math.min(G.nx - 1, i1); i++){
      const key = j*G.nx + i, iv = G.cells.get(key); if (!iv) continue;
      let hit = false; for (let q = 0; q < iv.length; q += 2) if (iv[q] < z1 && iv[q + 1] > z0){ hit = true; break; } if (!hit) continue;
      const cx = G.x0 + i + 0.5, cy = G.y0 + j + 0.5, dx = x - cx, dy = y - cy, dd = Math.hypot(dx, dy), pen = r + 0.6 - dd;
      if (pen <= PUSH.depth) continue;
      // a face standing on the drawn carriageway (the model's deck / railing a little off the mapped road) does not close the road
      let pc = G.pass.get(key); if (pc === undefined || Math.abs(pc.z - z0) > 1.2){ pc = {z:z0, p:onCarriageway(cx, cy, z0 - 0.3)}; G.pass.set(key, pc); } if (pc.p) continue;
      if (pen > PUSH.depth){ PUSH.depth = pen; if (dd > 1e-6){ PUSH.nx = dx/dd; PUSH.ny = dy/dd; } else { PUSH.nx = 1; PUSH.ny = 0; } } } }
  return PUSH.depth > 0;
}

// ---- buildings: a wall standing on a drawn carriageway (the data's footprint overlapping a road) is not solid
function onCarriageway(x, y, z){
  if (typeof SGRoads !== 'undefined' && SGRoads.surfaceReady && SGRoads.surfaceReady(x, y)){ const r = SGRoads.surfaceAt(x, y, z + 0.6); return !!(r && r.k !== 2 && Math.abs(r.z - z) < 1.6); }
  const n = roadCands(x, y); for (let q = 0; q < n; q++){ const R = RC[q]; if ((R.c <= 11 || R.c === 13 || R.c === 14 || R.c === 18) && Math.abs(R.d) < R.hw - 0.2 && Math.abs(R.z - z) < 1.6) return true; }
  return false;
}
function bldCircle(cx, cy, r, z0, z1){
  PUSH.depth = 0; const ti = biTileOf(cx, cy); if (ti < 0) return false; const T = BI.get(ti); if (!T || !T.ready) return false;
  if (!T.pass) T.pass = new Uint8Array(T.EF.length/6);
  const NC = T.NC, E = T.EF, i0 = clamp(Math.floor((cx - r - T.x0)/BIC), 0, NC - 1), i1 = clamp(Math.floor((cx + r - T.x0)/BIC), 0, NC - 1), j0 = clamp(Math.floor((cy - r - T.y0)/BIC), 0, NC - 1), j1 = clamp(Math.floor((cy + r - T.y0)/BIC), 0, NC - 1);
  const q = ++biQ;
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++){ const c = j*NC + i;
    for (let k = T.cnt[c]; k < T.cnt[c + 1]; k++){ const e = T.L[k]; if (T.stamp[e] === q) continue; T.stamp[e] = q; const o = e*6;
      if (E[o + 5] < z0 + 0.3 || E[o + 4] > z1 || T.pass[e] === 2) continue;
      const ax = E[o], ay = E[o + 1], dx = E[o + 2] - ax, dy = E[o + 3] - ay, l2 = dx*dx + dy*dy || 1e-9, t = clamp(((cx - ax)*dx + (cy - ay)*dy)/l2, 0, 1);
      const px = cx - (ax + dx*t), py = cy - (ay + dy*t), dd = Math.hypot(px, py);
      if (dd < r && r - dd > PUSH.depth){
        let nx, ny; if (dd > 1e-6){ nx = px/dd; ny = py/dd; } else { const L = Math.sqrt(l2); nx = -dy/L; ny = dx/L; }
        if (!T.pass[e]){ const wx = ax + dx*t, wy = ay + dy*t; T.pass[e] = onCarriageway(wx - nx*0.7, wy - ny*0.7, z0) ? 2 : 1; if (T.pass[e] === 2) continue; }
        PUSH.depth = r - dd; PUSH.nx = nx; PUSH.ny = ny; } } }
  return PUSH.depth > 0;
}

// ---- two bodies: the car and a traffic vehicle (or an AI car on its rails: infinite mass); the traffic module gets the impulse
function carHit(C, ax, ay, o, CRv){
  // [lm30/phys2] arms at the contact point for both bodies (the full spin from an off-centre hit), the heavier vehicle's bumper lifts
  // the lighter one (a bus or a truck throws a small car), side hits roll a car over by the impulse it takes (any mass)
  const PV = pvOf(), nx = PUSH.nx, ny = PUSH.ny, d = Math.min(PUSH.depth, 1.2), m2 = o.m || 0, share = m2 ? m2/(PV.m + m2) : 1;
  C.x += nx*d*share; C.y += ny*d*share; if (m2){ o.x -= nx*d*(1 - share); o.y -= ny*d*(1 - share); }
  const cs = Math.cos(C.psi), sn = Math.sin(C.psi), px = C.x + ax - nx*CRv, py = C.y + ay - ny*CRv, rx = px - o.x, ry = py - o.y, r1x = px - C.x, r1y = py - C.y;
  let Vx = C.u*cs - C.v*sn, Vy = C.u*sn + C.v*cs;
  const ovx = (o.vx || 0) - (o.w || 0)*ry, ovy = (o.vy || 0) + (o.w || 0)*rx, rvx = Vx - C.r*r1y - ovx, rvy = Vy + C.r*r1x - ovy, vn = rvx*nx + rvy*ny; if (vn >= 0) return;
  const I2 = m2 ? m2*(4*o.hl*o.hl + 4*o.hw*o.hw)/12 : 0, an1 = r1x*ny - r1y*nx, an2 = rx*ny - ry*nx;
  const k = 1/PV.m + an1*an1/PV.Iz + (m2 ? 1/m2 + an2*an2/I2 : 0), e = clamp(0.34 + 0.012*vn, 0.08, 0.3), j = -(1 + e)*vn/k;   // [lm27/destruct] plastic at speed
  const tx = -ny, ty = nx, vt = rvx*tx + rvy*ty, at1 = r1x*ty - r1y*tx, at2 = rx*ty - ry*tx, kt = 1/PV.m + at1*at1/PV.Iz + (m2 ? 1/m2 + at2*at2/I2 : 0); let jt = clamp(-vt/kt, -0.5*j, 0.5*j);
  Vx += (j*nx + jt*tx)/PV.m; Vy += (j*ny + jt*ty)/PV.m; C.r = clamp(C.r + (an1*j + at1*jt)/PV.Iz, -4, 4);
  C.u = Vx*cs + Vy*sn; C.v = -Vx*sn + Vy*cs; C.hit = Math.max(C.hit, -vn);
  const E = 0.5*vn*vn/k*(1 - e*e);
  contact(KND.CAR, -vn, E, ax, ay, nx, ny, Math.abs(vt), o);
  // [lm27/destruct] a heavy vehicle's side hit: beyond the static stability the car rolls over, away from the impact
  if ((m2 > 0.25*PV.m || (!m2 && o.k === 'ext' && (o.vx*o.vx + o.vy*o.vy) > 9)) && !AIR.on){ const lat = Math.abs(-(j*nx + jt*tx)*Math.sin(C.psi) + (j*ny + jt*ty)*Math.cos(C.psi))/PV.m, ssf = rollSSF(); if (lat > 4.2*ssf) rollStart(nx, ny, lat, ssf, 'side'); }
  if (o.ext && o.k === 'ext'){ o.ext.jx -= j*nx + jt*tx; o.ext.jy -= j*ny + jt*ty; o.ext.sp = Math.max(o.ext.sp, -vn); }   // [lm28/drivecam] reported once per frame
  if (m2 && o.id && window.SGTraffic && window.SGTraffic.hit){
    const jx = -(j*nx + jt*tx), jy = -(j*ny + jt*ty), jz = Math.hypot(jx, jy)*clamp((PV.m/m2 - 1.2)*0.06, 0, 0.3)*clamp((-vn - 4)/8, 0, 1);
    o.vx = (o.vx || 0) + jx/m2; o.vy = (o.vy || 0) + jy/m2; o.w = (o.w || 0) + (rx*jy - ry*jx)/I2;
    if (!o.crash){ o.crash = true; }
    window.SGTraffic.hit(o.id, jx, jy, px, py, E, jz);
  }
}

// ---- the player's damage: four zones, effects on the car, the look (dents, lamps, glass, bumper, wing), smoke and fire
const DMG = {f:0, b:0, l:0, r:0, wreck:false, env:{pow:1, gripF:1, gripR:1, pull:0, brake:1, vmax:1, wreck:false}, geo:null, src:null, key:null, glass:0, lamps:0, smokeT:0, fireT:0, bumper:false, wing:false, msgT:0, total:0};
ENV.dmg = DMG.env;
const DCAP = () => F1.veh === 'car' ? 230e3*clamp(RCP.m/2000, 0.3, 6) : 120e3;   // a bus takes far more than a motorbike
function dmgZone(lx, ly){ const ax = Math.abs(lx)/2.3, ay = Math.abs(ly)/0.95; return ax >= ay ? (lx > 0 ? 'f' : 'b') : (ly > 0 ? 'l' : 'r'); }
function dmgApply(c){
  if (c.kind === KND.WATER) return;
  const E = c.E; if (E < 2500) return;
  const z = dmgZone(c.lx, c.ly), inc = E/DCAP(); DMG[z] = Math.min(1.6, DMG[z] + inc);
  DMG.total = DMG.f + DMG.b + DMG.l + DMG.r;
  dmgVisual(c, inc);
  dmgEffects();
  if (!DMG.wreck && (Math.max(DMG.f, DMG.b, DMG.l, DMG.r) >= 1.25 || DMG.total >= 2.4)){ DMG.wreck = true; DMG.env.wreck = true; flash('车辆损毁 · 按 R 修复 · Wrecked — press R to repair', 4, 'warn'); sfx('crunch', CAR.x, CAR.y, CAR.z + 0.6, 1); }
}
function dmgEffects(){
  const P = F1.veh === 'car', E = DMG.env, cl = v => clamp(v, 0, 1);
  E.pow = DMG.wreck ? 0 : 1 - 0.6*cl(((P ? DMG.f : DMG.b) - 0.35)/0.8) - 0.15*cl((DMG.total - 1)/1.2);
  E.gripF = 1 - (P ? 0.18 : 0.3)*cl((DMG.f - 0.45)/0.7) - 0.08*cl((Math.max(DMG.l, DMG.r) - 0.5)/0.8);
  E.gripR = 1 - 0.15*cl((DMG.b - 0.5)/0.8) - 0.08*cl((Math.max(DMG.l, DMG.r) - 0.5)/0.8);
  E.pull = clamp((DMG.l - DMG.r)*0.07 + (DMG.f > 0.6 ? 0.02*Math.sign(DMG.l - DMG.r) : 0), -0.09, 0.09);
  E.brake = 1 - 0.25*cl((Math.max(DMG.f, DMG.l, DMG.r) - 0.7)/0.6);
  E.vmax = 1 - 0.4*cl((DMG.total - 0.7)/1.3);
}
function dmgRepair(){
  if (AIR.on) airEnd(false);   // [lm27/destruct] R: upright again
  DMG.f = DMG.b = DMG.l = DMG.r = DMG.total = 0; DMG.wreck = false; DMG.ext = null; DMG.glass = DMG.lamps = 0; DMG.bumper = DMG.wing = false; DMG.smokeT = DMG.fireT = 0;
  Object.assign(DMG.env, {pow:1, gripF:1, gripR:1, pull:0, brake:1, vmax:1, wreck:false});
  dmgGeoReset();
}
// the car's own copy of its body for dents (road car: RCM.body / overlay; F1: a single-instance copy of the player's car)
function dmgGeoReset(){
  if (!DMG.geo) return;
  if (DMG.key === 'f1'){ if (DMG.f1m){ scene.remove(DMG.f1m); DMG.f1m = null; } if (OV.body){ OV.body.geometry = DMG.ovNH0; OV.bodyH.geometry = DMG.ovH0; } }
  else if (RCM.built && RCM.G){ RCM.body.geometry = RCM.G.body; RCM.ovBody.geometry = RCM.G.bodyNC; }
  DMG.geo.dispose(); if (DMG.geoNC) DMG.geoNC.dispose(); DMG.geo = DMG.geoNC = null; DMG.key = null;
}
function dmgGeoEnsure(){
  const key = F1.veh === 'car' ? RCM.key : 'f1'; if (key !== 'f1' && RCAR[key] && RCAR[key].ext) return null;
  if (DMG.geo && DMG.key === key) return DMG.geo; dmgGeoReset();
  if (key === 'f1'){ if (!M.G) return null; const src = M.G.body, g = new THREE.BufferGeometry();
    for (const k in src.attributes) g.setAttribute(k, src.attributes[k].clone()); g.setIndex(src.index);
    for (const k of ['iC1', 'iC2', 'iC3']){ const a = new THREE.InstancedBufferAttribute(new Float32Array(3), 3); a.setXYZ(0, src.attributes[k].getX(0), src.attributes[k].getY(0), src.attributes[k].getZ(0)); g.setAttribute(k, a); }
    g.boundingSphere = src.boundingSphere; DMG.geo = g; DMG.src = src; DMG.key = key;
    const m = DMG.f1m = new THREE.InstancedMesh(g, matF1Car, 1); m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.frustumCulled = false; m.castShadow = true; m.receiveShadow = true; m.name = 'f1d-dmg'; scene.add(m);
    const gNH = new THREE.BufferGeometry(); for (const k in g.attributes) gNH.setAttribute(k, g.attributes[k]); gNH.setIndex(g.index); gNH.setDrawRange(0, M.G.nNoHelmet); DMG.geoNC = gNH;
    if (OV.body){ DMG.ovNH0 = OV.body.geometry; DMG.ovH0 = OV.bodyH.geometry; OV.body.geometry = gNH; OV.bodyH.geometry = g; }
    return g; }
  if (!RCM.built || !RCM.G) return null;
  const src = RCM.G.body, g = new THREE.BufferGeometry(); for (const k in src.attributes) g.setAttribute(k, src.attributes[k].clone()); g.setIndex(src.index); g.boundingSphere = src.boundingSphere;
  const gc = new THREE.BufferGeometry(); for (const k in g.attributes) gc.setAttribute(k, g.attributes[k]); gc.setIndex(g.index); gc.setDrawRange(0, RCM.G.bodyNC.drawRange.count); gc.boundingSphere = g.boundingSphere;
  DMG.geo = g; DMG.geoNC = gc; DMG.src = src; DMG.key = key; RCM.body.geometry = g; RCM.ovBody.geometry = gc;
  return g;
}
// dents: vertices near the impact point move in along the impact direction (strongest at bumper height, a little crumple noise);
// lamps there go dark and their lenses grey, glass there cracks (white-grey, matt); a heavy front hit drops one side of the bumper
// (road car) or the front wing (F1)
function dmgVisual(c, inc){
  if (F1.veh === 'car' && RCM.key && RCAR[RCM.key].ext){ const Gx = RCAR[RCM.key].g, cs = Math.cos(CAR.psi), sn = Math.sin(CAR.psi), nl = Math.hypot(c.nx, c.ny) || 1, dnx = (c.nx*cs + c.ny*sn)/nl, dnz = -(-c.nx*sn + c.ny*cs)/nl;
    const lev = Math.round(clamp(Math.max(DMG.f, DMG.b, DMG.l, DMG.r)/1.2, 0, 1)*15); if (!DMG.ext || lev > DMG.ext.lev) DMG.ext = {lev, ix:c.lx - dnx*Gx.cr - Gx.mx, iz:-c.ly - dnz*Gx.cr}; return; }
  const g = dmgGeoEnsure(); if (!g) return;
  const P = g.attributes.position, A = P.array, Cc = g.attributes.color.array, GL = g.attributes.gl.array, n = P.count, car = F1.veh === 'car';
  const nl = Math.hypot(c.nx, c.ny) || 1, cs = Math.cos(CAR.psi), sn = Math.sin(CAR.psi);
  const dnx = (c.nx*cs + c.ny*sn)/nl, dnz = -(-c.nx*sn + c.ny*cs)/nl;      // the push direction in the model frame (x fwd, z right)
  const ix = c.lx - dnx*0.95, iz = -c.ly - dnz*0.95;                        // the contact point on the body
  const depth = Math.min(car ? 0.34 : 0.26, 0.05 + inc*(car ? 0.5 : 0.42)), R = 0.55 + Math.min(1.2, inc*2.2), hy = car ? 0.55 : 0.35;
  const crack = c.vn > 6 || inc > 0.12;
  let lampHit = 0, glassHit = 0;
  for (let i = 0; i < n; i++){ const x = A[i*3], y = A[i*3 + 1], z = A[i*3 + 2], d = Math.hypot(x - ix, z - iz); if (d > R) continue;
    const w = (1 - d/R), ww = w*w*(1 - Math.min(0.75, Math.abs(y - hy)*0.6)), nz = Math.sin(x*12.9898 + z*78.233 + y*37.719)*43758.5453, nn = nz - Math.floor(nz);
    A[i*3] += dnx*depth*ww*(0.75 + 0.5*nn); A[i*3 + 2] += dnz*depth*ww*(0.75 + 0.5*nn); A[i*3 + 1] -= depth*0.25*ww*nn;
    const gl = GL[i];
    if (gl > 1.5 && w > 0.25 && crack){ GL[i] = 0.4; Cc[i*3] *= 0.35; Cc[i*3 + 1] *= 0.35; Cc[i*3 + 2] *= 0.38; lampHit++; }
    else if (gl > 1.1 && gl < 1.4 && w > 0.3 && crack){ GL[i] = 0.35; Cc[i*3] = 0.62 + 0.15*nn; Cc[i*3 + 1] = 0.64 + 0.15*nn; Cc[i*3 + 2] = 0.66 + 0.15*nn; glassHit++; }
    else if (w > 0.4 && inc > 0.08 && gl < 1.1){ const k = 1 - 0.25*w; Cc[i*3] *= k; Cc[i*3 + 1] *= k; Cc[i*3 + 2] *= k; } }
  // the bumper / the front wing
  if (DMG.f > 0.55 && !DMG.bumper){ DMG.bumper = true; const side = c.ly > 0 ? -1 : 1, xf = car ? RCAR[RCM.key].g.xf : 2.9;
    for (let i = 0; i < n; i++){ const x = A[i*3], y = A[i*3 + 1], z = A[i*3 + 2];
      if (car ? (x > xf - 0.32 && y < 0.62) : (x > 2.25 && y < 0.42)){ const s = clamp((z*side + 0.9)/1.8, 0, 1); A[i*3 + 1] = Math.max(0.03, y - (car ? 0.22 : 0.3)*s*s); A[i*3] -= 0.06*s; } } }
  if (lampHit){ DMG.lamps += lampHit; sfx('glass', c.x, c.y, CAR.z + 0.7, 0.6); }
  if (glassHit){ DMG.glass += glassHit; if (!lampHit) sfx('glass', c.x, c.y, CAR.z + 1.1, 0.7); }
  P.needsUpdate = true; g.attributes.color.needsUpdate = true; g.attributes.gl.needsUpdate = true; g.computeVertexNormals();
}
// smoke: window.SGFX.smoke / fire when the effects module is there, else pooled additive-free sprites (one Points call)
const SMK = {pts:null, n:48, i:0, p:null, v:null, life:null, age:null, col:null, size:null, mat:null};
function smkInit(){
  if (SMK.pts) return; const n = SMK.n, g = new THREE.BufferGeometry();
  SMK.p = new Float32Array(n*3).fill(-1e5); SMK.v = new Float32Array(n*3); SMK.life = new Float32Array(n); SMK.age = new Float32Array(n).fill(1e9); SMK.col = new Float32Array(n*3); SMK.size = new Float32Array(n);
  g.setAttribute('position', new THREE.BufferAttribute(SMK.p, 3).setUsage(THREE.DynamicDrawUsage)); g.setAttribute('color', new THREE.BufferAttribute(SMK.col, 3).setUsage(THREE.DynamicDrawUsage)); g.setAttribute('size', new THREE.BufferAttribute(SMK.size, 1).setUsage(THREE.DynamicDrawUsage));
  SMK.mat = new THREE.ShaderMaterial({uniforms:{uTex:{value:lampTex}, uScale:{value:600}}, transparent:true, depthWrite:false,
    vertexShader:'attribute float size; attribute vec3 color; varying vec3 vC; varying float vA; uniform float uScale; void main(){ vec4 mv = modelViewMatrix*vec4(position, 1.0); gl_Position = projectionMatrix*mv; gl_PointSize = clamp(size*uScale/max(-mv.z, 0.5), 1.0, 400.0); vC = color; vA = fract(size*7.0); }',
    fragmentShader:'uniform sampler2D uTex; varying vec3 vC; varying float vA; void main(){ vec4 t = texture2D(uTex, gl_PointCoord); gl_FragColor = vec4(vC, t.a*0.55); }'});
  SMK.pts = new THREE.Points(g, SMK.mat); SMK.pts.frustumCulled = false; SMK.pts.renderOrder = 6; SMK.pts.name = 'f1smoke'; scene.add(SMK.pts);
}
function smkEmit(x, y, z, kind){
  const fx = window.SGFX; if (fx && fx.smoke && kind !== 'steam'){ try { if (kind === 'fire' && fx.fire) fx.fire(x, y, z, 1.2, 1.5); else fx.smoke(x, y, z, kind === 'black' ? 2.2 : 1.2, 2.5); return; } catch (e){ /* fall back to our sprites */ } }
  smkInit(); const i = SMK.i = (SMK.i + 1) % SMK.n;
  SMK.p[i*3] = x; SMK.p[i*3 + 1] = z; SMK.p[i*3 + 2] = -y; SMK.v[i*3] = (Math.random() - 0.5)*0.6; SMK.v[i*3 + 1] = kind === 'fire' ? 2.6 : 1.3 + Math.random()*0.6; SMK.v[i*3 + 2] = (Math.random() - 0.5)*0.6;
  SMK.age[i] = 0; SMK.life[i] = kind === 'fire' ? 0.7 : kind === 'steam' ? 1.6 : 3.2;
  const c = kind === 'fire' ? [1.0, 0.55, 0.15] : kind === 'steam' ? [0.9, 0.9, 0.9] : kind === 'black' ? [0.12, 0.12, 0.12] : [0.45, 0.45, 0.46]; SMK.col.set(c, i*3); SMK.size[i] = 0.6;
}
function smkTick(dt){
  if (!SMK.pts) return; let live = 0; const h = renderer.domElement.height/renderer.getPixelRatio() || 800; SMK.mat.uniforms.uScale.value = h/(2*Math.tan(camera.fov*PI/360));
  for (let i = 0; i < SMK.n; i++){ if (SMK.age[i] > SMK.life[i]){ SMK.p[i*3 + 1] = -1e5; SMK.size[i] = 0; continue; } live++; SMK.age[i] += dt; const k = SMK.age[i]/SMK.life[i];
    for (let a = 0; a < 3; a++) SMK.p[i*3 + a] += SMK.v[i*3 + a]*dt; SMK.size[i] = 0.6 + k*3.2; if (k > 0.85){ SMK.col[i*3] *= 0.97; SMK.col[i*3 + 1] *= 0.97; SMK.col[i*3 + 2] *= 0.97; } }
  SMK.pts.visible = live > 0; for (const k of ['position', 'color', 'size']) SMK.pts.geometry.attributes[k].needsUpdate = true;
}
function dmgTick(dt){
  // contacts of this frame -> damage, sounds
  const C = CAR; let best = null;
  for (let i = 0; i < CTn; i++){ const c = CT[i]; if (c.vn < 0) continue; CRS.hits++;
    if (CRS.logOn && CRS.log.length < 400) CRS.log.push({t:+RACE.t.toFixed(2), kind:KNAME[c.kind], vn:+c.vn.toFixed(2), E:Math.round(c.E), x:+c.x.toFixed(1), y:+c.y.toFixed(1), s:TR ? +(trProj(c.x, c.y, TPJ3) || {s:0}).s.toFixed(0) : null});
    dmgApply(c);
    const k = clamp(c.vn/14, 0, 1);
    if (c.vn > 1.6 && c.kind !== KND.WATER){ const last = CRS.lastSnd[c.kind] || 0; if (CRS.time - last > 0.25 || c.vn > 6){ CRS.lastSnd[c.kind] = CRS.time; sfx('crash', c.x, c.y, c.z, k); if (c.E > 70e3 || c.vn > 9) sfx('crunch', c.x, c.y, c.z, clamp(c.E/300e3, 0.4, 1)); } }
    if (c.vt > 2.5 && c.vn < 4 && c.kind !== KND.WATER && c.kind !== KND.TREE){ CRS.scrapeT -= dt; if (CRS.scrapeT <= 0){ CRS.scrapeT = 0.12; sfx('scrape', c.x, c.y, c.z, clamp(c.vt/25, 0.15, 1)); DMG[dmgZone(c.lx, c.ly)] = Math.min(1.6, DMG[dmgZone(c.lx, c.ly)] + c.vt*0.00035); } }
    if (!best || c.vn > best.vn) best = c; }
  CRS.frameHit = best ? {kind:KNAME[best.kind], vn:best.vn} : null;
  CTn = 0;
  // tyres: a skid burst when the slip angle or the ABS / handbrake slide starts at speed
  const su = Math.abs(C.u), beta = su > 3 ? Math.abs(Math.atan2(C.v, su)) : 0, sk = su > 8 && (beta > 0.16 || (INP.hb > 0.5 && su > 6) || (C.abs && su > 14 && (C.bf || 0) > 0.9));
  const sk2 = sk || (P2.spin > 0.45 && su > 3 && !AIR.on);   // [lm30/phys2] wheelspin squeals too; tyre smoke, dust, spray
  if (sk2 && !CRS.skid && CRS.time - CRS.tyreT > 0.6){ CRS.tyreT = CRS.time; sfx('tyre', C.x, C.y, C.z, clamp(su/40, 0.3, 1)); } CRS.skid = sk2;
  tyreFx(C, dt);
  // steam / smoke / fire
  const mx = Math.max(DMG.f, DMG.b, DMG.l, DMG.r);
  if (mx > 0.55){ DMG.smokeT -= dt; if (DMG.smokeT <= 0){ const car = F1.veh === 'car', cs = Math.cos(C.psi), sn = Math.sin(C.psi), ex = car ? 1.3 : -1.6, ez = car ? 1.0 : 0.9;
      DMG.smokeT = DMG.wreck ? 0.07 : mx > 0.9 ? 0.12 : 0.22; smkEmit(C.x + cs*ex, C.y + sn*ex, carZ(C) + ez, DMG.wreck ? 'black' : mx > 0.9 ? 'smoke' : 'steam');
      if (DMG.wreck && (DMG.fireT += 1) % 3 === 0) smkEmit(C.x + cs*ex, C.y + sn*ex, carZ(C) + ez - 0.2, 'fire'); } }
  smkTick(dt);
  if (DMG.f1m){ carMat(_mc, C.x, C.y, carZ(C), C.psi, C.pitch, C.roll); DMG.f1m.setMatrixAt(0, _mc); DMG.f1m.instanceMatrix.needsUpdate = true; DMG.f1m.visible = F1.on && F1.veh !== 'car' && !F1.hide && meshVis; }
}

// ---- [lm27/destruct] the car in the air: thrown, tumbling, rolled over
// A rigid box about the centre of mass (x from the rear to the front bumper, the track +- the body sides, the wheels' contact up to the
// roof; box inertia, the yaw inertia at least the car's own), integrated at 120 Hz: gravity, its 8 corners against the surface under it
// (the deck nearest its height, else the ground; impulses with restitution and friction; landing damage beyond 7 m/s), pushed out of
// buildings (the drive module's own edge index), water (a splash; it floats down to the roof line and stays). Upright and touching with
// the wheels it drives on (heading, speeds and yaw rate from the body); at rest on its roof or side it is stuck until R. The pose is
// written back to the car (origin on the ground under the centre of mass, yaw / pitch / roll), so every renderer and camera follows.
const AIR = {on:false, rolled:false, wet:false, wetMsg:false, t:0, rest:0, x:0, y:0, z:0, vx:0, vy:0, vz:0, qx:0, qy:0, qz:0, qw:1, wx:0, wy:0, wz:0,
  xf:2, xr:-2, hw:0.95, h:1.4, hcg:0.5, m:1500, iIx:0, iIy:0, iIz:0, gz:0, gx:1e9, gy:1e9, gzr:0, ox:0, oy:0, n:0, src:'', touch:false, wheels:0, hard:0};
const AR = new Float64Array(9), _aq = new THREE.Quaternion(), _ae = new THREE.Euler(0, 0, 0, 'YZX');
const ACX = new Float64Array(8), ACY = new Float64Array(8), ACZ = new Float64Array(8), ACP = new Float64Array(8), ACJ = new Float64Array(8), ACW = new Uint8Array(8), AB = new Float64Array(3);
function airDims(){
  if (F1.veh === 'car' && RCM.key){ const Rk = RCAR[RCM.key], Gv = Rk.g, k = Rk.kind;
    let roof = 0; if (Gv.GH) for (const g of Gv.GH) if (g[1]) roof = Math.max(roof, g[1]);
    AIR.xf = Gv.xf; AIR.xr = Gv.xr; AIR.hw = Gv.lean ? 0.38 : (Gv.track || 1.6)/2 + 0.14; AIR.h = roof || (k === 'bus' ? 3.1 : k === 'truck' ? 1.9 : k === 'motorbike' ? 1.35 : 1.5);
    AIR.hcg = RCP.hcg || 0.55; AIR.m = RCP.m; }
  else { AIR.xf = 2.85; AIR.xr = -2.75; AIR.hw = 1.0; AIR.h = 0.98; AIR.hcg = PH.hcg; AIR.m = PH.m; }
  const L = AIR.xf - AIR.xr, W = 2*AIR.hw, H = AIR.h, m = AIR.m;
  AIR.iIx = 12/(m*(W*W + H*H)); AIR.iIy = 12/(m*(L*L + H*H)); AIR.iIz = 1/Math.max(m*(L*L + W*W)/12, pvOf().Iz);
}
// the static stability factor (track / 2 hcg): how hard a side hit must be to roll the vehicle
function rollSSF(){ if (F1.veh !== 'car' || !RCM.key) return 3.2; const Gv = RCAR[RCM.key].g; return Gv.lean ? 0.35 : (Gv.track || 1.6)/(2*(RCP.hcg || 0.55)); }
function airRot(){ const x = AIR.qx, y = AIR.qy, z = AIR.qz, w = AIR.qw, R = AR;
  R[0] = 1 - 2*(y*y + z*z); R[1] = 2*(x*y - z*w); R[2] = 2*(x*z + y*w); R[3] = 2*(x*y + z*w); R[4] = 1 - 2*(x*x + z*z); R[5] = 2*(y*z - x*w); R[6] = 2*(x*z - y*w); R[7] = 2*(y*z + x*w); R[8] = 1 - 2*(x*x + y*y); }
// the world inverse inertia times v -> AB
function airII(vx, vy, vz){ const R = AR, a0 = (R[0]*vx + R[3]*vy + R[6]*vz)*AIR.iIx, a1 = (R[1]*vx + R[4]*vy + R[7]*vz)*AIR.iIy, a2 = (R[2]*vx + R[5]*vy + R[8]*vz)*AIR.iIz;
  AB[0] = R[0]*a0 + R[1]*a1 + R[2]*a2; AB[1] = R[3]*a0 + R[4]*a1 + R[5]*a2; AB[2] = R[6]*a0 + R[7]*a1 + R[8]*a2; }
// the car's yaw / pitch / roll (the model's three.js Euler 'YZX': x roll, y yaw = psi, z pitch) <-> a world (z up) quaternion
function airFromCar(C){ _ae.set(C.roll || 0, C.psi, C.pitch || 0, 'YZX'); _aq.setFromEuler(_ae); AIR.qx = _aq.x; AIR.qy = -_aq.z; AIR.qz = _aq.y; AIR.qw = _aq.w; }
function airPose(C){
  airRot(); const R = AR, hc = AIR.hcg;
  C.x = AIR.x - R[2]*hc; C.y = AIR.y - R[5]*hc; C.z = C.zs = C.zv = AIR.z - R[8]*hc;
  _aq.set(AIR.qx, AIR.qz, -AIR.qy, AIR.qw); _ae.setFromQuaternion(_aq, 'YZX');
  C.roll = C.rollS = _ae.x; C.psi = _ae.y; C.pitch = C.pitchS = _ae.z; C.dzv = 0; C.dive = 0; C.lean = 0; C.lv = C.pv = 0;
  const fx = R[0], fy = R[3], fl = Math.hypot(fx, fy) || 1; C.u = (AIR.vx*fx + AIR.vy*fy)/fl; C.v = (-AIR.vx*fy + AIR.vy*fx)/fl; C.r = AIR.wz;
  AIR.ox = C.x; AIR.oy = C.y;
}
function airStart(dvx, dvy, dvz, wx, wy, wz, src){
  const C = CAR;
  if (!AIR.on){
    airDims(); airFromCar(C); airRot();
    const oz = carZ(C); AIR.x = C.x + AR[2]*AIR.hcg; AIR.y = C.y + AR[5]*AIR.hcg; AIR.z = oz + AR[8]*AIR.hcg + 0.02;
    const cs = Math.cos(C.psi), sn = Math.sin(C.psi); AIR.vx = C.u*cs - C.v*sn; AIR.vy = C.u*sn + C.v*cs; AIR.vz = 0;
    AIR.wx = 0; AIR.wy = 0; AIR.wz = clamp(C.r || 0, -3, 3); AIR.on = true; AIR.wet = false; AIR.wetMsg = false; AIR.t = 0; AIR.gx = 1e9; AIR.n++; AIR.hard = 0;
    C.delta = 0; C.rev = false;
  }
  AIR.vx += dvx || 0; AIR.vy += dvy || 0; AIR.vz += dvz || 0; AIR.wx += wx || 0; AIR.wy += wy || 0; AIR.wz += wz || 0;
  AIR.rolled = false; AIR.rest = 0; AIR.src = src || ''; AIR.t = Math.min(AIR.t, 0.05);
  airPose(C);
  return true;
}
// back to driving (drive: on its wheels, speeds from the body) or just off (R / the car was placed elsewhere)
function airEnd(drive){
  if (!AIR.on) return; AIR.on = false; AIR.rolled = false;
  const C = CAR;
  if (drive){ airRot(); const fx = AR[0], fy = AR[3], fl = Math.hypot(fx, fy) || 1, ux = fx/fl, uy = fy/fl;
    C.psi = Math.atan2(uy, ux); C.u = AIR.vx*ux + AIR.vy*uy; C.v = -AIR.vx*uy + AIR.vy*ux; C.r = clamp(AIR.wz, -2.5, 2.5);
    C.z = C.zs = C.zv = AIR.gz; C.pitch = C.roll = C.pitchS = C.rollS = C.dzv = C.dive = C.lean = 0; C.lv = C.pv = 0; C.vzS = 0; C.delta = 0; C.kind = 'road';
    C.zb = C.z; C.vzb = clamp(AIR.vz, -4, 0); C.ptP = undefined; }   // [lm30/phys2] the springs take the landing
}
// the surface under the body: the deck nearest its height, else the ground (cached for small moves)
function airGround(){
  const x = AIR.x, y = AIR.y, zr = AIR.z - AIR.hcg + 0.6;
  if (Math.abs(x - AIR.gx) < 0.5 && Math.abs(y - AIR.gy) < 0.5 && Math.abs(zr - AIR.gzr) < 1.5) return AIR.gz;
  surfQ(x, y, zr, false, SQP); let g = SQP.blocked ? gnd(x, y) : SQP.z; if (!isFinite(g)) g = gnd(x, y);
  AIR.gx = x; AIR.gy = y; AIR.gzr = zr; AIR.gz = g; return g;
}
function airStep(h){
  const C = CAR;
  AIR.vz -= 9.81*h;
  if (AIR.wet){ const k = Math.exp(-2.5*h); AIR.vx *= k; AIR.vy *= k; AIR.vz = AIR.vz*k - 0.3*(1 - k); AIR.wx *= k; AIR.wy *= k; AIR.wz *= k; }
  else { const k = 1 - 0.02*h; AIR.vx *= k; AIR.vy *= k; AIR.wx *= 1 - 0.08*h; AIR.wy *= 1 - 0.08*h; AIR.wz *= 1 - 0.08*h; }
  AIR.x += AIR.vx*h; AIR.y += AIR.vy*h; AIR.z += AIR.vz*h;
  const qx = AIR.qx, qy = AIR.qy, qz = AIR.qz, qw = AIR.qw, wx = AIR.wx, wy = AIR.wy, wz = AIR.wz, hh = 0.5*h;
  let nx = qx + hh*(wx*qw + wy*qz - wz*qy), ny = qy + hh*(wy*qw + wz*qx - wx*qz), nz = qz + hh*(wz*qw + wx*qy - wy*qx), nw = qw + hh*(-wx*qx - wy*qy - wz*qz);
  const l = 1/Math.sqrt(nx*nx + ny*ny + nz*nz + nw*nw); AIR.qx = nx*l; AIR.qy = ny*l; AIR.qz = nz*l; AIR.qw = nw*l;
  airRot();
  const R = AR, g = airGround();
  // water: it floats down to the roof line and stays
  if (wetAt(AIR.x, AIR.y) > 0.5 && AIR.z < 0.5 && g < 0.2){
    if (!AIR.wet){ AIR.wet = true; sfx('splash', AIR.x, AIR.y, 0, clamp(Math.hypot(AIR.vx, AIR.vy, AIR.vz)/12, 0.4, 1)); try { if (window.SGFX && window.SGFX.splash) window.SGFX.splash(AIR.x, AIR.y, 0, 1.2); } catch (e){ /* optional */ } }
    const zf = -AIR.h + AIR.hcg + 0.35; if (AIR.z < zf){ AIR.z = zf; if (AIR.vz < 0) AIR.vz = 0; }
    AIR.touch = true; AIR.wheels = 0;
    if (Math.hypot(AIR.vx, AIR.vy, AIR.vz) < 0.6) AIR.rest += h; return;
  }
  // the 8 corners against the surface
  // [lm30/phys2] upright, the four wheel corners stand on springs (the car's suspension: frequency, damping, the static deflection
  // below the box; rigid beyond the bump-stop travel), so a jump lands on its suspension, bounces and settles
  const X2 = p2V(), wn2 = 2*PI*X2.f, s0 = 9.81/(wn2*wn2), kc = AIR.m*wn2*wn2*0.25, cc = 2*X2.z*wn2*AIR.m*0.25, upr = R[8] > 0.6;
  let n = 0, maxPen = 0, wheels = 0, hard = 0;
  for (let c = 0; c < 8; c++){
    const lx = (c & 1) ? AIR.xf : AIR.xr, ly = (c & 2) ? AIR.hw : -AIR.hw, lz = (c & 4) ? AIR.h - AIR.hcg : -AIR.hcg;
    const rx = R[0]*lx + R[1]*ly + R[2]*lz, ry = R[3]*lx + R[4]*ly + R[5]*lz, rz = R[6]*lx + R[7]*ly + R[8]*lz, sp = upr && !(c & 4), pen = g - (AIR.z + rz) + (sp ? s0 : 0);
    if (pen <= 0) continue;
    ACX[n] = rx; ACY[n] = ry; ACZ[n] = rz; ACP[n] = pen; ACJ[n] = 0; ACW[n] = (c & 4) ? 0 : sp ? 2 : 1; n++; const pr = sp ? pen - s0 - X2.tr : pen; if (pr > maxPen) maxPen = pr; if (!(c & 4)) wheels++;
  }
  AIR.touch = n > 0; AIR.wheels = wheels;
  if (n){
    const im = 1/AIR.m;
    for (let it = 0; it < 2; it++) for (let c = 0; c < n; c++){
      const rx = ACX[c], ry = ACY[c], rz = ACZ[c];
      const vcz = AIR.vz + AIR.wx*ry - AIR.wy*rx; if (it === 0 && -vcz > hard && (ACW[c] !== 2 || ACP[c] > s0 + X2.tr)) hard = -vcz;
      airII(ry, -rx, 0); const kn = im + (AB[0]*ry - AB[1]*rx), e = it === 0 && vcz < -2.5 ? (ACW[c] === 2 ? 0.05 : 0.22) : 0;   // a bottomed-out suspension does not bounce
      let jn;
      if (ACW[c] === 2 && ACP[c] < s0 + X2.tr){ if (it > 0) jn = 0; else { jn = Math.max(0, kc*ACP[c] - cc*vcz)*h; ACJ[c] = jn; } }
      else { jn = -(1 + e)*vcz/kn; const j0 = ACJ[c]; ACJ[c] = Math.max(0, j0 + jn); jn = ACJ[c] - j0; }
      if (jn !== 0){ AIR.vz += jn*im; AIR.wx += AB[0]*jn; AIR.wy += AB[1]*jn; AIR.wz += AB[2]*jn; }
      // friction: wheels roll along the car (little resistance that way), everything else slides
      let ux = AIR.vx + AIR.wy*rz - AIR.wz*ry, uy = AIR.vy + AIR.wz*rx - AIR.wx*rz;
      if (ACW[c] && R[8] > 0.5){ const fx = R[0], fy = R[3], fl = Math.hypot(fx, fy) || 1, along = (ux*fx + uy*fy)/fl; ux -= along*fx/fl*0.97; uy -= along*fy/fl*0.97; }
      const ut = Math.hypot(ux, uy);
      if (ut > 1e-5 && ACJ[c] > 0){ const tx = ux/ut, ty = uy/ut, cx = -rz*ty, cy = rz*tx, cz = rx*ty - ry*tx; airII(cx, cy, cz);
        const kt = im + ((AB[1]*rz - AB[2]*ry)*tx + (AB[2]*rx - AB[0]*rz)*ty), jt = -Math.min(ut/kt, 0.65*ACJ[c]);
        AIR.vx += jt*tx*im; AIR.vy += jt*ty*im; AIR.wx += AB[0]*jt; AIR.wy += AB[1]*jt; AIR.wz += AB[2]*jt; }
    }
    AIR.z += Math.max(0, maxPen - 0.005)*0.85;
    const kr = Math.exp(-(n >= 3 ? 2.5 : 0.6)*h); AIR.wx *= kr; AIR.wy *= kr; AIR.wz *= kr;
    // a hard landing / impact: damage and sound at the lowest corner (beyond 7 m/s)
    if (hard > 7 && CRS.time - (AIR.hitT || 0) > 0.25){ AIR.hitT = CRS.time; let k = 0; for (let c = 1; c < n; c++) if (ACP[c] > ACP[k]) k = c;
      contact(KND.GROUND, hard, 0.5*AIR.m*(hard - 5)*(hard - 5)*0.8, AIR.x + ACX[k] - C.x, AIR.y + ACY[k] - C.y, -ACX[k], -ACY[k], 0, null); }
  }
  // a car body does not spin faster than ~1.3 turns a second
  let w2 = AIR.wx*AIR.wx + AIR.wy*AIR.wy + AIR.wz*AIR.wz; if (w2 > 64){ const k = 8/Math.sqrt(w2); AIR.wx *= k; AIR.wy *= k; AIR.wz *= k; w2 = 64; }
  const v2 = AIR.vx*AIR.vx + AIR.vy*AIR.vy + AIR.vz*AIR.vz;
  if (AIR.touch && v2 < 0.25 && w2 < 0.25) AIR.rest += h; else AIR.rest = 0;
  // buildings: push the body out of the walls (the drive module's index around the car)
  const zb = AIR.z - AIR.hcg;
  if (bldCircle(AIR.x, AIR.y, AIR.hw + 0.35, zb, zb + AIR.h)){
    const d = Math.min(PUSH.depth, 1.5), bx = PUSH.nx, by = PUSH.ny; AIR.x += bx*d; AIR.y += by*d; const vn = AIR.vx*bx + AIR.vy*by;
    if (vn < 0){ AIR.vx -= 1.2*vn*bx; AIR.vy -= 1.2*vn*by; AIR.wz += clamp((AIR.vx*by - AIR.vy*bx)*0.05, -1.5, 1.5); if (-vn > 3) contact(KND.BLD, -vn, 0.25*AIR.m*vn*vn, bx*-AIR.hw, by*-AIR.hw, bx, by, 0, null); }
  }
}
function airTick(dt){
  const C = CAR;
  if (Math.hypot(C.x - AIR.ox, C.y - AIR.oy) > 15){ airEnd(false); return; }     // placed elsewhere (enter, teleport, reset, a test)
  AIR.t += dt;
  if (AIR.rolled){ airPose(C); C.u = C.v = C.r = 0; return; }
  const n = Math.max(1, Math.ceil(dt*120 - 1e-6)), h = dt/n;
  for (let s = 0; s < n; s++) airStep(h);
  airPose(C);
  const up = AR[8], sp = Math.hypot(AIR.vx, AIR.vy, AIR.vz), wsp = Math.hypot(AIR.wx, AIR.wy, AIR.wz);
  if (!AIR.wet && AIR.touch && AIR.wheels >= 3 && up > 0.8 && wsp < 2.5 && (sp < 3 || Math.abs(AIR.vz) < 2.5) && AIR.t > 0.12){ airEnd(true); return; }
  if (AIR.rest > 0.9 || (AIR.wet && AIR.rest > 0.6)){ AIR.rolled = true; C.u = C.v = C.r = 0;
    flash(AIR.wet ? '落水 · 按 R 复位 · In the water — press R' : '翻车了 · 按 R 复位 · Rolled over — press R', 5, 'warn'); }
}
// a heavy side hit: rolls the car away from it (the top moves along the push n)
function rollStart(nx, ny, dv, ssf, src){
  const ex = dv - 4.2*ssf, rate = clamp(2.2 + 0.5*ex, 2.2, 6.5);
  airStart(0, 0, clamp(1.2 + 0.12*dv, 1.2, 4), -ny*rate, nx*rate, (Math.random() - 0.5)*0.6, src || 'roll');
  sfx('crunch', CAR.x, CAR.y, CAR.z + 0.8, clamp(dv/14, 0.5, 1));
}
// SGF1.crash.impulse(x, y, z, r, k): a radial push (k m/s at the centre, falling off to 0 at r, heavier vehicles less) - thrown and
// spinning when strong enough, a shove otherwise; damage from the blast
function extImpulse(x, y, z, r, k){
  if (!F1.on || !(r > 0)) return 0; const C = CAR, PV = pvOf();
  const dx = C.x - x, dy = C.y - y, dz = carZ(C) + 0.8 - (z || 0), d = Math.hypot(dx, dy, dz); if (d > r) return 0;
  const f = 1 - d/r, dv = k*f*clamp(Math.sqrt(1500/PV.m), 0.3, 1.3); if (dv < 0.5) return 0;
  const hl = Math.hypot(dx, dy) || 1, ux = dx/hl, uy = dy/hl, vh = dv*0.85, vz = dv*(0.4 + 0.35*f);
  const cs = Math.cos(C.psi), sn = Math.sin(C.psi);
  contact(KND.DEBRIS, dv, 0.5*PV.m*dv*dv*0.18, -ux*1.2, -uy*1.2, ux, uy, 0, null);
  if (dv > 4.5 || AIR.on){ const sp = clamp(dv*0.22, 0.4, 5), s2 = Math.sin(x*12.9898 + y*78.233)*0.5;
    airStart(ux*vh, uy*vh, vz, -uy*sp + s2, ux*sp - s2*0.5, s2*1.5, 'impulse'); }
  else { let Vx = C.u*cs - C.v*sn, Vy = C.u*sn + C.v*cs; Vx += ux*vh; Vy += uy*vh; C.u = Vx*cs + Vy*sn; C.v = -Vx*sn + Vy*cs; C.r = clamp(C.r + (Math.random() - 0.5)*dv*0.3, -3.5, 3.5); }
  return 1;
}
// SGF1.crash.hit(jx, jy, jz, px, py, pz, E, kind): an impulse (N s) at a world point from debris / a falling building / a thrown car;
// E (J) feeds the damage. Strong or lifting hits make the car airborne
function extHit(jx, jy, jz, px, py, pz, E, kind){
  if (!F1.on) return false; const C = CAR, PV = pvOf(), kd = kind === 'building' ? KND.BLD : kind === 'car' ? KND.CAR : KND.DEBRIS;
  const jh = Math.hypot(jx, jy), nx = jh > 1e-6 ? jx/jh : 0, ny = jh > 1e-6 ? jy/jh : 0, ax = px - C.x, ay = py - C.y;
  contact(kd, Math.hypot(jh, jz || 0)/PV.m*1.5, E || 0, ax, ay, nx, ny, 0, null);
  if (AIR.on){ airRot(); const rx = px - AIR.x, ry = py - AIR.y, rz = (pz || AIR.z) - AIR.z; AIR.vx += jx/AIR.m; AIR.vy += jy/AIR.m; AIR.vz += (jz || 0)/AIR.m;
    airII(ry*(jz || 0) - rz*jy, rz*jx - rx*(jz || 0), rx*jy - ry*jx); AIR.wx += AB[0]; AIR.wy += AB[1]; AIR.wz += AB[2]; AIR.rolled = false; AIR.rest = 0; return true; }
  const cs = Math.cos(C.psi), sn = Math.sin(C.psi); let Vx = C.u*cs - C.v*sn, Vy = C.u*sn + C.v*cs;
  const dvh = jh/PV.m, dvz = (jz || 0)/PV.m, lat = Math.abs(-jx*sn + jy*cs)/PV.m;
  if (dvz > 3.5 || lat > 4.2*rollSSF() || dvh > 9){ airStart(jx/PV.m, jy/PV.m, Math.max(dvz, 0.8 + 0.15*dvh), -ny*clamp(lat*0.5, 0, 5), nx*clamp(lat*0.5, 0, 5), (ax*jy - ay*jx)/Math.max(PV.Iz, 1), kind || 'hit'); return true; }
  Vx += jx/PV.m; Vy += jy/PV.m; C.u = Vx*cs + Vy*sn; C.v = -Vx*sn + Vy*cs; C.r = clamp(C.r + 0.85*(ax*jy - ay*jx)/PV.Iz, -3.5, 3.5);
  return true;
}
// the car's box for window.SGPhys (centre of the box, heading, half extents, velocity, mass) - one shared object
const AIRB = {x:0, y:0, z:0, psi:0, hl:2.4, hw:0.95, h:1.5, vx:0, vy:0, m:1500};
function carBody(){
  if (!F1.on) return null; const C = CAR;
  if (!AIR.on) airDims();
  const cs = Math.cos(C.psi), sn = Math.sin(C.psi), mid = (AIR.xf + AIR.xr)/2;
  AIRB.x = C.x + cs*mid; AIRB.y = C.y + sn*mid; AIRB.z = carZ(C); AIRB.psi = C.psi; AIRB.hl = (AIR.xf - AIR.xr)/2; AIRB.hw = AIR.hw; AIRB.h = AIR.h; AIRB.m = AIR.m;
  if (AIR.on){ AIRB.vx = AIR.vx; AIRB.vy = AIR.vy; } else { AIRB.vx = C.u*cs - C.v*sn; AIRB.vy = C.u*sn + C.v*cs; }
  return AIRB;
}
function airState(){ airRot(); return {on:AIR.on, rolled:AIR.rolled, wet:AIR.wet, n:AIR.n, src:AIR.src, t:+AIR.t.toFixed(2), z:+AIR.z.toFixed(2), up:+AR[8].toFixed(2), v:+Math.hypot(AIR.vx, AIR.vy, AIR.vz).toFixed(2), w:+Math.hypot(AIR.wx, AIR.wy, AIR.wz).toFixed(2), ground:+AIR.gz.toFixed(2)}; }

// ---- per frame (free drive): the props near the car, the landmark grids, the breakables, the hide patch
function crashTick(dt){
  CRS.time += dt; hidePatch();
  if (F1.on){ const C = CAR;
    lmgTick(C.x, C.y); }
  breakTick(dt);
}

// ---- the race: no traffic while a race runs (from the start lights to the results); back in free drive / after leaving
function trafficSuspend(on){ try { if (window.SGTraffic && 'suspend' in window.SGTraffic) window.SGTraffic.suspend = !!on; } catch (e){ /* optional module */ } }
// the road tiles under the circuit: their obstacle copies mark (and the pole shader hides) whatever stands inside the walls; indexed in
// the background near the circuit (a few ms per frame), at once around the grid when a race starts
const CORR = {tiles:null, F:null, done:0};
function corridorTiles(){
  if (CORR.F === TR.F && CORR.tiles) return CORR.tiles; const set = new Map(), TL = 2000;
  for (let i = 0; i < TR.n; i += 3) for (const o of [-12, 0, 12]){ const x = TR.X[i] + TR.NX[i]*o, y = TR.Y[i] + TR.NY[i]*o, tx = Math.floor((x + HALF)/TL), ty = Math.floor((y + HALF)/TL), k = ty*1000 + tx; if (!set.has(k)) set.set(k, [x, y]); }
  CORR.tiles = [...set.values()]; CORR.F = TR.F; CORR.done = 0; return CORR.tiles;
}
function corridorPrefetch(now){
  if (!TR || typeof SGRoads === 'undefined' || !SGRoads.surfaceReady) return; const L = corridorTiles();
  for (const p of L){ if (obxTileReady(p)) continue; if (now){ SGRoads.surfaceAt(p[0], p[1], 0); obxTile(p[0], p[1]); } }
}
function obxTileReady(p){ const TL = 2000, TX = Math.round(2*HALF/TL), ti = Math.floor((p[1] + HALF)/TL)*TX + Math.floor((p[0] + HALF)/TL); return OBX.tiles.has(ti); }
// nothing of the traffic module's street furniture inside the circuit's walls (signal poles, shelters, bus bays)
const TPJ4 = {i:0, t:0, s:0, d:0, dist:0};
function inCircuit(x, y, m){ if (!TR) return false; const b = TR.bb; if (x < b[0] - 20 || x > b[2] + 20 || y < b[1] - 20 || y > b[3] + 20) return false; const p = trProj(x, y, TPJ4); if (!p || p.dist > 18) return false;
  return p.d < (TR.wl ? TR.wl[p.i] : 10.05) + (m || 0) && p.d > -(TR.wr ? TR.wr[p.i] : 10.05) - (m || 0); }
function corridorTick(){
  if (window.SGTraffic && 'propVeto' in window.SGTraffic && CORR.veto !== TR){ CORR.veto = TR; window.SGTraffic.propVeto = TR ? (x, y) => inCircuit(x, y, 0.6) : null; }
  if (!TR || !SGR.on || typeof SGRoads === 'undefined' || !SGRoads.surfacePrefetch) return; const L = corridorTiles(); if (CORR.done >= L.length) return;
  const c = camera.position; if (!(F1.on && F1.mode === 'race') && ((SGR.queue && SGR.queue.length) || Math.hypot(Math.max(0, Math.abs(c.x - TR.cx) - 1500), Math.max(0, Math.abs(-c.z - TR.cy) - 1500), c.y) > 4000)) return;
  const race = F1.on && F1.mode === 'race'; let n = 0;
  for (const p of L){ if (obxTileReady(p)){ n++; continue; } if (SGRoads.surfaceReady(p[0], p[1])) obxTile(p[0], p[1]); else SGRoads.surfacePrefetch(p[0], p[1], race ? 6 : 2.5); break; }
  CORR.done = n;
}
// window.SGBreak: for other modules (aircraft crashes): knock trees / poles near a point
window.SGBreak = {
  // the tree nearest (x, y) within 3 m: falls along (dirX, dirY) if energy (J) is enough for its trunk, else shakes
  hitTree(x, y, dirX, dirY, energy){ const a = trunks(biTileOf(x, y)); if (!a) return false; let best = -1, bd = 3;
    let BL = null;
    for (let i = Math.floor((x - 4)/10); i <= Math.floor((x + 4)/10); i++) for (let j = Math.floor((y - 4)/10); j <= Math.floor((y + 4)/10); j++){ const L = a.g.get(i*100000 + j); if (!L) continue;
      for (let q = 0; q < L.length; q += 6){ if (a.broken.has(L[q + 5])) continue; const d = Math.hypot(L[q] - x, L[q + 1] - y); if (d < bd){ bd = d; best = q; BL = L; } } }
    if (best < 0) return false;
    if ((energy || 0) > treeEb(BL[best + 2])){ treeBreak(a, BL, best, dirX || 1, dirY || 0, energy); return 'fell'; } treeShake(a, BL, best, dirX || 1, dirY || 0, 0.06); return 'shook'; },
  // the road lamp pole / signal pole nearest (x, y) within 3 m
  hitPole(x, y, dirX, dirY, energy){ const T = obxTile(x, y); let best = -1, bd = 3;
    if (T){ for (let i = 0; i < T.n; i++){ if (T.kind[i] !== OBK.POLE || T.off[i]) continue; const d = Math.hypot(T.d[i*10 + 1] - x, T.d[i*10 + 2] - y); if (d < bd){ bd = d; best = i; } } }
    if (best >= 0){ if ((energy || 0) < poleEb(T.d[best*10 + 5])) return 'held'; roadPoleBreak(T, best, dirX || 1, dirY || 0, energy); return 'fell'; }
    const L = window.SGTraffic && window.SGTraffic.props ? window.SGTraffic.props(x, y, 3, []) : []; let P = null; for (const q of L) if (q.kind === 'sig' && Math.hypot(q.x - x, q.y - y) < bd){ bd = Math.hypot(q.x - x, q.y - y); P = q; }
    if (!P) return false; if ((energy || 0) < 40e3) return 'held'; sigBreak(P, dirX || 1, dirY || 0, energy); return 'fell'; },
  // what is near (x, y) within r: {trees, poles, signals}
  near(x, y, r){ const out = {trees:0, poles:0, signals:0}; const a = trunks(biTileOf(x, y));
    if (a) for (let i = Math.floor((x - r)/10); i <= Math.floor((x + r)/10); i++) for (let j = Math.floor((y - r)/10); j <= Math.floor((y + r)/10); j++){ const L = a.g.get(i*100000 + j); if (L) for (let q = 0; q < L.length; q += 6) if (!a.broken.has(L[q + 5]) && Math.hypot(L[q] - x, L[q + 1] - y) < r) out.trees++; }
    const T = obxTile(x, y); if (T) for (let i = 0; i < T.n; i++) if (T.kind[i] === OBK.POLE && !T.off[i] && Math.hypot(T.d[i*10 + 1] - x, T.d[i*10 + 2] - y) < r) out.poles++;
    if (window.SGTraffic && window.SGTraffic.props) for (const q of window.SGTraffic.props(x, y, r, [])) if (q.kind === 'sig' && Math.hypot(q.x - x, q.y - y) < r) out.signals++;
    return out; },
  // [lm27/destruct] a blast at (x, y): trees and lamp poles within r fall away from it (energy E J at the centre, falling off with
  // the square of the distance); the 8 nearest trees that break, the rest sway; up to 6 poles. Returns {trees, shook, poles}
  blast(x, y, r, E){ let n = 0, ns = 0, np = 0; E = E || 3e5; const a = trunks(biTileOf(x, y));
    if (a){ const cand = []; for (let i = Math.floor((x - r)/10); i <= Math.floor((x + r)/10); i++) for (let j = Math.floor((y - r)/10); j <= Math.floor((y + r)/10); j++){ const L = a.g.get(i*100000 + j); if (!L) continue;
        for (let q = 0; q < L.length; q += 6){ if (a.broken.has(L[q + 5])) continue; const d = Math.hypot(L[q] - x, L[q + 1] - y); if (d < r) cand.push([d, L, q]); } }
      cand.sort((p, q) => p[0] - q[0]);
      for (const [d, L, q] of cand){ const f = 1 - d/r, e = E*f*f, dx = d > 0.1 ? (L[q] - x)/d : 1, dy = d > 0.1 ? (L[q + 1] - y)/d : 0;
        if (n < 8 && e > treeEb(L[q + 2])){ if (treeBreak(a, L, q, dx, dy, e)) n++; } else if (ns < 24 && f > 0.15){ treeShake(a, L, q, dx, dy, clamp(0.02 + 0.08*f, 0.02, 0.1)); ns++; } } }
    const T = obxTile(x, y);
    if (T) for (let i = 0; i < T.n && np < 6; i++){ if (T.kind[i] !== OBK.POLE || T.off[i]) continue; const px = T.d[i*10 + 1], py = T.d[i*10 + 2], d = Math.hypot(px - x, py - y); if (d > r) continue;
      const f = 1 - d/r; if (E*f*f > poleEb(T.d[i*10 + 5])){ roadPoleBreak(T, i, d > 0.1 ? (px - x)/d : 1, d > 0.1 ? (py - y)/d : 0, E*f*f); np++; } }
    return {trees:n, shook:ns, poles:np}; },
  get broken(){ return {trees:BRK.trees.length, poles:BRK.poles.length, total:Object.assign({}, CRS.breaks)}; }
};
function roadPoleBreak(T, i, dx, dy, E){
  const d = T.d, q = i*10; T.off[i] = 2;
  const h = hideAdd(d[q + 1], d[q + 2], d[q + 6], d[q + 7], false);
  return poleBreak('road', d[q + 1], d[q + 2], d[q + 6] + 0.2, d[q + 7], d[q + 5], dx, dy, E, {ti:T.ti, i, hide:h});
}
function sigBreak(P, dx, dy, E){
  if (window.SGTraffic && window.SGTraffic.breakProp) window.SGTraffic.breakProp(P.key);
  const k = PROPS.list.indexOf(P); if (k >= 0) PROPS.list.splice(k, 1);
  return poleBreak('sig', P.x, P.y, P.z, P.z + P.h, 0.09, dx, dy, E, {arm:P.arm || 0, ax:P.arm ? P.ax : P.hx, ay:P.arm ? P.ay : P.hy});
}

/* ================= test handle ================= */
function autoInput(thrCap){
  const C = CAR, ms = f1MaxSteer(C.u); let want = C.psi, vt = 1e9;
  if (F1.mode === 'race' && TR){ const p = trProj(C.x, C.y, TPJ2); if (p){ const tA = trAt(p.s + 16 + Math.abs(C.u)*0.35, 0, TMPA), i = tA[2], tx = TR.X[i] + TR.NX[i]*TR.off[i], ty = TR.Y[i] + TR.NY[i]*TR.off[i];
    want = Math.atan2(ty - C.y, tx - C.x); for (let k = 0; k < 60; k++){ const j = (p.i + k) % TR.n, dd = Math.max(0, k*5 - Math.abs(C.u)*0.25); vt = Math.min(vt, Math.sqrt(TR.vmax[j]*TR.vmax[j]*1.02 + 2*26*dd)); }
    for (const a of AI){ let ds = (((a.s - p.s) % TR.L) + TR.L) % TR.L; if (ds > TR.L/2) ds -= TR.L; if (ds > 2 && ds < 90 && Math.abs(a.d - p.d) < 2.6) vt = Math.min(vt, a.v + Math.max(0, ds - 10 - Math.abs(C.u)*0.15)*0.7); } } }
  else { const l = C.li >= 0 && C.kind === 'road' ? SGR.lines[C.li] : null;
    if (l){ const P = l.P, m = P.length >> 1; let bk = 0, bd = 1e18, bt = 0;
      for (let k = 0; k < m - 1; k++){ const ax = P[k*2], ay = P[k*2 + 1], dx = P[k*2 + 2] - ax, dy = P[k*2 + 3] - ay, l2 = dx*dx + dy*dy || 1, t = clamp(((C.x - ax)*dx + (C.y - ay)*dy)/l2, 0, 1), d = (ax + dx*t - C.x)**2 + (ay + dy*t - C.y)**2; if (d < bd){ bd = d; bk = k; bt = t; } }
      const dx = P[bk*2 + 2] - P[bk*2], dy = P[bk*2 + 3] - P[bk*2 + 1], sg = dx*Math.cos(C.psi) + dy*Math.sin(C.psi) >= 0 ? 1 : -1;
      let rest = 12 + Math.abs(C.u)*0.5, k = bk, x = P[bk*2] + dx*bt, y = P[bk*2 + 1] + dy*bt;
      while (rest > 0){ const nk = sg > 0 ? k + 1 : k, tx = P[nk*2], ty = P[nk*2 + 1], d = Math.hypot(tx - x, ty - y); if (d >= rest){ x += (tx - x)/d*rest; y += (ty - y)/d*rest; break; } rest -= d; x = tx; y = ty; k += sg; if (k < 0 || k >= m - 1){ x += Math.cos(C.psi)*rest; y += Math.sin(C.psi)*rest; break; } }
      if (!(l.flags & 1)){ const hx = Math.atan2(y - C.y, x - C.x); x -= Math.sin(hx)*RD_WID[l.c][0]*0.25; y += Math.cos(hx)*RD_WID[l.c][0]*0.25; }   // keep left
      want = Math.atan2(y - C.y, x - C.x); } }
  // [lm24/drive] keep a gap to the cars ahead (the AI cars in a race, the traffic in the city): no ramming
  { const cs = Math.cos(C.psi), sn = Math.sin(C.psi); for (let q = 0; q < OBSn; q++){ const o = OBS[q], dx = o.x - C.x, dy = o.y - C.y, f = dx*cs + dy*sn, lat = -dx*sn + dy*cs;
      if (f > 1 && f < 80 && Math.abs(lat) < 2.4 && Math.abs(o.z - C.z) < 2.5){ const ov = Math.max(0, o.vx*cs + o.vy*sn); vt = Math.min(vt, ov + Math.max(0, f - 9 - Math.abs(C.u)*0.12)*0.8);
        if (f < 30 && Math.abs(lat) < 1.6) want += clamp((lat > 0 ? -1 : 1)*0.5*(1 - f/30), -0.3, 0.3)*0.4; } } }
  const err = wrapA(want - C.psi);
  return {thr:C.u < vt - 1 ? thrCap : 0, brk:C.u > vt + 2 ? clamp((C.u - vt)*0.3, 0.3, 1) : 0, steer:clamp(err*3/Math.max(0.12, ms), -1, 1), hb:0};
}
/* ================= [lm25/net] multiplayer hooks: remote players drawn and solid, the F1 race with remote players on the grid ================= */
// window.SGF1.mp (used by lm25/net/net.js; inert until called):
//   remotes(list)   the remote players now: [{id, veh:'f1'|'car'|'air'|'none', key, col (livery 0-11), paint (road-car paint index), x, y, z,
//                   psi, pitch, roll, delta (front wheel angle, rad), v (m/s along the heading), vx, vy, brake, head, rev, indL, indR,
//                   hidden, ghost}]. F1 cars: one instanced body / wheel mesh (+ rain lights); road cars: the same models as the player's
//                   with their own lamp uniforms; pickup / bus / motorbike: the traffic module's models. Aircraft are drawn by net.js.
//                   Every remote car on the ground within 2.2 m of our height is solid for the player's car (two-body impulses on our
//                   side, with its mass); one that overlaps us when it appears stays a ghost until we are apart (spawns, resets).
//   race(o)         o = {slot, laps, lightsAt, goAt (performance.now() ms)}: the Marina Bay race on the synchronised clock (lights from
//                   lightsAt, out at goAt), grid slot `slot`, no AI cars; race(null) ends it (the AI cars come back).
//   tower(rows, pos, of)  standings from the server for the timing tower [{name, col, gap, me}]
//   onLap / onFinish      callbacks: lap {lap, rt, lt, inv}; finish {rt, best}
//   place(x, y, psi)      the car standing still at a grid spot (city race / escape start)
//   local(out)            the player's vehicle for snapshots; color(k) the player's own F1 livery in a room (-1 = the solo red)
//   palette               the 12 player liveries {code, p, s, a}; key(fn) a key hook while driving (fn(code, e) -> true = consumed)
const MP_LIV = LIV.concat([{code:'NEO', p:[0.98, 0.45, 0.72], s:[0.12, 0.12, 0.14], a:[0.95, 0.95, 0.95]}]);
const MPC = 12;
const MPN = {list:[], n:0, race:null, tower:null, pos:0, of:0, onLap:null, onFinish:null, keyFn:null, f1:null, cars:new Map(), sep:new Map(), col:-1, spr:null, t:0};
function mpDims(r){
  if (r.veh === 'car' && RCAR[r.key]){ const g = RCAR[r.key].g; return [(g.xf - g.xr)/2, g.lean ? 0.4 : g.circ && g.cr > 1.2 ? 1.3 : (g.track || 1.6)/2 + 0.12, RCAR[r.key].ph.m, g.mx || 0]; }
  return [2.75, 0.97, PH.m, 0];
}
function mpF1Ensure(){
  if (MPN.f1) return MPN.f1; ensureMeshes(); const G = M.G;
  const mk = (src, n) => { const g = new THREE.BufferGeometry(); for (const k in src.attributes) if (!/^iC\d$/.test(k)) g.setAttribute(k, src.attributes[k]); g.setIndex(src.index);
    g.boundingSphere = src.boundingSphere; for (const k of ['iC1', 'iC2', 'iC3']) g.setAttribute(k, new THREE.InstancedBufferAttribute(new Float32Array(n*3), 3)); return g; };
  const body = new THREE.InstancedMesh(mk(G.body, MPC), matF1Car, MPC), wheel = new THREE.InstancedMesh(mk(G.wheel, MPC*4), matF1Car, MPC*4);
  for (const m of [body, wheel]){ m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.frustumCulled = false; m.castShadow = true; m.receiveShadow = true; m.name = 'f1d-mp'; m.visible = false; m.count = 0; scene.add(m); }
  const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MPC*3), 3));
  const rain = new THREE.Points(rg, matF1Rain); rain.frustumCulled = false; rain.renderOrder = 5; rain.visible = false; scene.add(rain);
  MPN.f1 = {body, wheel, rain, cols:new Int16Array(MPC).fill(-1)}; return MPN.f1;
}
function mpF1Color(F, i, k){
  if (F.cols[i] === k) return; F.cols[i] = k; const L = MP_LIV[((k % MPC) + MPC) % MPC], gb = F.body.geometry.attributes, gw = F.wheel.geometry.attributes;
  gb.iC1.setXYZ(i, ...L.p); gb.iC2.setXYZ(i, ...L.s); gb.iC3.setXYZ(i, ...L.a); gb.iC1.needsUpdate = gb.iC2.needsUpdate = gb.iC3.needsUpdate = true;
  for (let w = 0; w < 4; w++){ gw.iC1.setXYZ(i*4 + w, ...TYRE[(k + i) % 3]); gw.iC2.setXYZ(i*4 + w, ...L.s); gw.iC3.setXYZ(i*4 + w, ...L.a); } gw.iC1.needsUpdate = gw.iC2.needsUpdate = gw.iC3.needsUpdate = true;
}
// the road cars' shader with per-car uniforms (one function text: every remote car shares one program, each has its own lamps / paint)
function mpRcCompile(Uo){
  return sh => {
    Object.assign(sh.uniforms, {uAmb:U.amb, uSky:U.sky, uPaint:Uo.paint, uLamp:Uo.lamp, uInd:Uo.ind});
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float slot;\nattribute float gl;\nuniform vec3 uPaint;\nvarying float vGl;')
      .replace('#include <color_vertex>', 'vColor = color;\nif (slot > 0.5) vColor = uPaint;\nvGl = gl;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uAmb;\nuniform vec3 uSky;\nuniform vec4 uLamp;\nuniform vec3 uInd;\nvarying float vGl;')
      .replace('#include <aomap_fragment>', 'reflectedLight.directSpecular *= min(vGl, 1.0);\n#include <aomap_fragment>')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n{ float fr = pow(1.0 - clamp(abs(dot(normalize(vViewPosition), normal)), 0.0, 1.0), 3.0), g = min(vGl, 1.25);\n'
        + '  totalEmissiveRadiance += uSky * (fr * (g > 1.1 ? 0.8 : 0.34 * g) + (g > 1.1 ? 0.09 : 0.0)) + diffuseColor.rgb * uAmb;\n'
        + '  if (vGl > 1.5){ float k = vGl < 2.5 ? uLamp.x : vGl < 3.5 ? uLamp.y : vGl < 4.5 ? uLamp.z : vGl < 5.5 ? uLamp.w : vGl < 6.5 ? uInd.x : vGl < 7.5 ? uInd.y : uInd.z; totalEmissiveRadiance += diffuseColor.rgb * k; } }');
  };
}
function mpCarDispose(O){ for (const m of [O.body, O.wheel, O.ext]) if (m){ scene.remove(m); } if (O.ext && O.ext.geometry) O.ext.geometry.dispose(); if (O.mat) O.mat.dispose(); }
function mpCar(r){
  let O = MPN.cars.get(r.id); if (O && O.key === r.key) return O;
  if (O){ mpCarDispose(O); MPN.cars.delete(r.id); }
  const R = RCAR[r.key]; if (!R) return null;
  O = {key:r.key, ws:0, indT:Math.random(), U:{paint:{value:new THREE.Color(0.8, 0.8, 0.8)}, lamp:{value:new THREE.Vector4()}, ind:{value:new THREE.Vector3(0, 0, 0.6)}}};
  try {
    if (R.ext){ if (!rcExtOK()) return null; const Mx = window.SGTraffic.model(R.ext); O.ext = new THREE.InstancedMesh(Mx.geo, Mx.mat, 1); O.ext.instanceMatrix.setUsage(THREE.DynamicDrawUsage); }
    else { O.G = rcGeo(r.key); O.mat = new THREE.MeshPhongMaterial({vertexColors:true, shininess:90, specular:new THREE.Color(0.5, 0.5, 0.5)}); O.mat.onBeforeCompile = mpRcCompile(O.U);
      O.body = new THREE.Mesh(O.G.body, O.mat); O.wheel = new THREE.InstancedMesh(O.G.wheel, O.mat, 4); O.wheel.instanceMatrix.setUsage(THREE.DynamicDrawUsage); O.body.matrixAutoUpdate = false; }
  } catch (e){ console.warn('[f1d/mp] model', r.key, e); return null; }
  for (const m of [O.body, O.wheel, O.ext]) if (m){ m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; m.visible = false; m.name = 'f1d-mp-car'; scene.add(m); }
  MPN.cars.set(r.id, O); return O;
}
function mpSprites(){
  if (MPN.spr) return MPN.spr;
  const mk = (c, size) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MPC*2*3), 3)); g.setDrawRange(0, 0);
    const p = new THREE.Points(g, new THREE.PointsMaterial({size, map:lampTex, color:c, transparent:true, opacity:0, depthWrite:false, blending:THREE.AdditiveBlending, sizeAttenuation:true}));
    p.frustumCulled = false; p.visible = false; p.renderOrder = 5; scene.add(p); return p; };
  MPN.spr = {h:mk(0xfff4e0, 1.5), t:mk(0xff2a1c, 1.1)}; return MPN.spr;
}
// before every render: the remote cars' poses (net.js updates the list in its frame hook)
function mpDraw(dt){
  const L = MPN.list, n = MPN.n; let nf1 = 0, nh = 0, nt = 0;
  if (!SGR.on && !n) return;
  const nfv = typeof nightF === 'number' ? nightF : 0, glow = sstep(0.12, 0.55, nfv), seen = MPN.seen || (MPN.seen = new Set()); seen.clear();
  const F = n ? mpF1Ensure() : MPN.f1, spr = n ? mpSprites() : MPN.spr, hp = spr ? spr.h.geometry.attributes.position.array : null, tp = spr ? spr.t.geometry.attributes.position.array : null;
  const C = CAR, cp = camera.position;
  for (let i = 0; i < n; i++){ const r = L[i]; if (!r) continue; seen.add(r.id);
    // separation for the ghost rule (a remote that overlaps us when it appears or respawns is not solid until we are apart)
    const dxc = r.x - C.x, dyc = r.y - C.y, dc2 = dxc*dxc + dyc*dyc; if (!F1.on || dc2 > 64 || Math.abs(r.z - C.z) > 3) MPN.sep.set(r.id, true); if (r.ghost) MPN.sep.delete(r.id);
    if (r.hidden || !SGR.on) continue;
    const far = (r.x - cp.x)**2 + (-r.y - cp.z)**2 > 9e6;            // > 3 km from the camera: the name tag only
    r.ws = ((r.ws || 0) + (r.v || 0)*dt/(r.veh === 'car' && RCAR[r.key] ? RCAR[r.key].g.r : 0.36)) % (TAU*1000);
    if (r.veh === 'f1' && F && nf1 < MPC && !far){ const k = nf1++; mpF1Color(F, k, r.col | 0);
      carMat(_mc, r.x, r.y, r.z, r.psi, r.pitch || 0, r.roll || 0); F.body.setMatrixAt(k, _mc);
      for (let w = 0; w < 4; w++) F.wheel.setMatrixAt(k*4 + w, wheelMat(_mw, _mc, w, r.delta || 0, r.ws));
      _v.set(-2.52, 0.29, 0).applyMatrix4(_mc); const rp = F.rain.geometry.attributes.position.array; rp[k*3] = _v.x; rp[k*3 + 1] = _v.y; rp[k*3 + 2] = _v.z;
      if (r.brake && nt < MPC*2){ tp[nt*3] = _v.x; tp[nt*3 + 1] = _v.y; tp[nt*3 + 2] = _v.z; nt++; } }
    else if (r.veh === 'car'){ const O = mpCar(r); if (!O) continue; O.seen = true;
      if (far){ for (const m of [O.body, O.wheel, O.ext]) if (m) m.visible = false; continue; }
      const R = RCAR[r.key], braking = !!r.brake, head = !!r.head; O.indT += dt; const blink = (O.indT % 0.76) < 0.4 ? 1 : 0;
      const pc = r.key === 'taxi' ? RC_TAXI_PAINT : RC_COLS[((r.paint | 0) % RC_COLS.length + RC_COLS.length) % RC_COLS.length].c;
      if (O.ext){ const cs = Math.cos(r.psi), sn = Math.sin(r.psi), mx = R.g.mx || 0; carMat(_mc2, r.x + cs*mx, r.y + sn*mx, r.z, r.psi, r.pitch || 0, r.roll || 0); O.ext.setMatrixAt(0, _mc2); O.ext.instanceMatrix.needsUpdate = true;
        const ic = O.ext.geometry.attributes.iCol, pcx = R.g.paint ? pc : [0.95, 0.95, 0.94]; ic.array[0] = pcx[0]; ic.array[1] = pcx[1]; ic.array[2] = pcx[2];
        ic.array[3] = (braking ? 1 : 0) + (r.indL && blink ? 2 : 0) + (r.indR && blink ? 4 : 0) + (head || R.kind === 'motorbike' ? 8 : 0); ic.needsUpdate = true; O.ext.visible = true; }
      else { const G = O.G; O.U.paint.value.setRGB(pc[0], pc[1], pc[2]);
        O.U.lamp.value.set(head ? 1.9 : 0.7, braking ? 2.2 : head ? 0.95 : 0, braking ? 2.8 : head ? 0.55 : 0, r.rev ? 1.9 : 0);
        O.U.ind.value.set(r.indL ? 2.6*blink : 0, r.indR ? 2.6*blink : 0, 0.45 + nfv*0.5);
        carMat(_mc, r.x, r.y, r.z, r.psi, r.pitch || 0, r.roll || 0); O.body.matrix.copy(_mc); O.body.matrixWorldNeedsUpdate = true; O.body.visible = true;
        for (let w = 0; w < 4; w++) O.wheel.setMatrixAt(w, wheelMat(_mw, _mc, w, r.delta || 0, r.ws, G.wpos)); O.wheel.instanceMatrix.needsUpdate = true; O.wheel.visible = true;
        // lamp glare at dusk / night (shared point sprites for every remote car)
        if (glow > 0.01 && G.lamps){ for (const s of [0, 1]){ if (head && nh < MPC*2){ _pv.set(G.lamps.head[0], G.lamps.head[1], s ? G.lamps.head[2] : -G.lamps.head[2]).applyMatrix4(_mc); hp[nh*3] = _pv.x; hp[nh*3 + 1] = _pv.y; hp[nh*3 + 2] = _pv.z; nh++; }
          if ((head || braking) && nt < MPC*2){ _pv.set(G.lamps.tail[0], G.lamps.tail[1], s ? G.lamps.tail[2] : -G.lamps.tail[2]).applyMatrix4(_mc); tp[nt*3] = _pv.x; tp[nt*3 + 1] = _pv.y; tp[nt*3 + 2] = _pv.z; nt++; } } } } }
  }
  if (F){ F.body.count = nf1; F.wheel.count = nf1*4; F.body.visible = F.wheel.visible = nf1 > 0; F.rain.geometry.setDrawRange(0, nf1); F.rain.visible = nf1 > 0 && nfv > 0.12;
    if (nf1){ F.body.instanceMatrix.needsUpdate = true; F.wheel.instanceMatrix.needsUpdate = true; F.rain.geometry.attributes.position.needsUpdate = true; } }
  if (spr){ spr.h.geometry.setDrawRange(0, nh); spr.t.geometry.setDrawRange(0, nt); spr.h.visible = nh > 0; spr.t.visible = nt > 0; spr.h.material.opacity = glow*0.95; spr.t.material.opacity = Math.max(0.35 + glow*0.6, 0.5);
    if (nh) spr.h.geometry.attributes.position.needsUpdate = true; if (nt) spr.t.geometry.attributes.position.needsUpdate = true; }
  // remote cars that left (or changed to another vehicle): free their meshes
  for (const [id, O] of MPN.cars){ if (!O.seen){ if (!seen.has(id)){ mpCarDispose(O); MPN.cars.delete(id); } else for (const m of [O.body, O.wheel, O.ext]) if (m) m.visible = false; } O.seen = false; }
  if (MPN.sep.size > 64) for (const id of MPN.sep.keys()) if (!seen.has(id)) MPN.sep.delete(id);
}
HOOKS.prerender.push((t, dt) => { if (MPN.n || (MPN.f1 && MPN.f1.body.visible) || MPN.cars.size) mpDraw(Math.min(0.1, dt || 1/60)); });
// the remote cars as obstacles (gatherObs): oriented boxes with their velocity and mass
function mpObs(C){
  for (let i = 0; i < MPN.n && OBSn < OBS.length; i++){ const r = MPN.list[i]; if (!r || r.hidden || r.ghost || (r.veh !== 'f1' && r.veh !== 'car') || !MPN.sep.get(r.id)) continue;
    const dx = r.x - C.x, dy = r.y - C.y; if (dx*dx + dy*dy > 900) continue;
    const d = mpDims(r), cs = Math.cos(r.psi), sn = Math.sin(r.psi), o = OBS[OBSn++];
    o.x = r.x + cs*d[3]; o.y = r.y + sn*d[3]; o.hx = cs; o.hy = sn; o.hl = d[0]; o.hw = d[1]; o.z = r.zs !== undefined ? r.zs : r.z; o.vx = r.vx || 0; o.vy = r.vy || 0; o.w = 0; o.id = 0; o.m = d[2]; o.crash = false; o.k = 'net'; o.ai = null; }
}
function mpPlace(x, y, psi, zh){
  const C = CAR; riCoarse(); let z = gnd(x, y);
  if (typeof SGRoads !== 'undefined' && SGRoads.surfacePrefetch) SGRoads.surfacePrefetch(x, y, 300);
  surfQ(x, y, zh !== undefined ? zh : z + 0.3, false, SQP); if (!SQP.blocked) z = SQP.z;
  if (typeof SGRoads !== 'undefined' && SGRoads.surfaceAt){ const r = SGRoads.surfaceAt(x, y, z); if (r && Math.abs(r.z - z) < 1.5) z = r.z; }
  C.x = x; C.y = y; C.psi = psi; C.u = C.v = C.r = C.delta = 0; C.rev = false; C.revT = 0; C.gear = 1; C.pitch = C.roll = 0; C.pitchS = C.rollS = C.dzv = C.dive = C.lean = 0; C.bf = 0;
  C.z = C.zs = C.zv = z; C.kind = SQP.blocked ? 'ground' : SQP.kind; C.c = SQP.c; C.li = SQP.li; C.rdx = Math.cos(psi); C.rdy = Math.sin(psi);
  if (F1.veh === 'car'){ C.lv = C.pv = 0; C.shiftT = C.shiftW = 0; C.park = false; }
  BI.clear(); biPrefetch(x, y); CV.cpsi = psi; CV.t = 1; return true;
}
const MPAPI = {
  remotes(list){ MPN.list = list || []; MPN.n = MPN.list.length; return MPN.n; },
  race(o){
    if (!o){ const was = !!MPN.race; MPN.race = null; MPN.tower = null; if (was) aiInit(); return null; }
    MPN.race = Object.assign({slot:0, laps:3}, o); F1.laps = clamp(o.laps | 0, 1, 9);
    if (!F1.on || F1.mode !== 'race' || F1.veh !== 'f1'){ if (!f1Enter('race')){ MPN.race = null; return false; } } else { raceStart(); hudShow(true); }
    if (o.cam !== undefined) F1.cam = o.cam;
    return true; },
  tower(rows, pos, of){ MPN.tower = rows || null; if (pos) MPN.pos = pos; if (of) MPN.of = of; return true; },
  set onLap(f){ MPN.onLap = f; }, set onFinish(f){ MPN.onFinish = f; },
  place(x, y, psi, z){ return F1.on ? mpPlace(x, y, psi, z) : false; },
  local(o){ const C = CAR, car = F1.veh === 'car'; o = o || {};
    o.on = F1.on; o.veh = !F1.on ? 'none' : car ? 'car' : 'f1'; o.key = car ? RCM.key : 'f1'; o.paint = car ? RCM.col : MPN.col;
    o.x = C.x; o.y = C.y; o.z = carZ(C); o.zs = C.z; o.psi = C.psi; o.pitch = C.pitch || 0; o.roll = C.roll || 0;
    const cs = Math.cos(C.psi), sn = Math.sin(C.psi); o.vx = C.u*cs - C.v*sn; o.vy = C.u*sn + C.v*cs; o.u = C.u; o.delta = C.delta || 0; o.thr = C.thr || 0; o.brk = C.brk || 0; o.rev = !!C.rev;
    o.rpm = car ? clamp((C.rpm || 0)/(RCP.rpmMax || 7000), 0, 1) : clamp(((C.rpm || 4200) - 4000)/8200, 0, 1); o.head = car ? !!RCM.headOn : (typeof nightF === 'number' && nightF > 0.2);
    o.ind = car ? RCM.ind : 0; o.wreck = !!DMG.wreck; o.braking = (!C.rev && C.brk > 0.05) || (C.rev && C.thr > 0.05);
    o.mode = F1.mode; o.race = RACE.state; o.prog = RACE.prog; o.lap = RACE.lap; o.trackLen = TR ? TR.L : 0; return o; },
  color(k){ MPN.col = k; if (!M.G) return k; const L = k >= 0 ? MP_LIV[k % MPC] : LIV[0], gb = M.G.body.attributes, gw = M.G.wheel.attributes;
    gb.iC1.setXYZ(0, ...L.p); gb.iC2.setXYZ(0, ...L.s); gb.iC3.setXYZ(0, ...L.a); gb.iC1.needsUpdate = gb.iC2.needsUpdate = gb.iC3.needsUpdate = true;
    for (let w = 0; w < 4; w++){ gw.iC2.setXYZ(w, ...L.s); gw.iC3.setXYZ(w, ...L.a); } gw.iC2.needsUpdate = gw.iC3.needsUpdate = true;
    if (M.G.steer){ const gs = M.G.steer.attributes; gs.iC1.setXYZ(0, ...L.p); gs.iC2.setXYZ(0, ...L.s); gs.iC3.setXYZ(0, ...L.a); gs.iC1.needsUpdate = gs.iC2.needsUpdate = gs.iC3.needsUpdate = true; }
    return k; },
  get palette(){ return MP_LIV.map(L => ({code:L.code, p:L.p.slice(), s:L.s.slice(), a:L.a.slice()})); },
  get rcCols(){ return RC_COLS.map(c => c.c.slice()); },
  dims(veh, key){ return mpDims({veh, key}); },
  key(fn){ MPN.keyFn = typeof fn === 'function' ? fn : null; },
  // test helper: the built-in autopilot drives in real time through the normal frame loop (thr caps the throttle; 0 / null = off)
  autopilot(thr){ MPN.ap = thr > 0 ? Math.min(1, thr) : 0; return MPN.ap; },
  get state(){ return {n:MPN.n, race:MPN.race ? Object.assign({}, MPN.race) : null, cars:MPN.cars.size, f1:MPN.f1 ? MPN.f1.body.count : 0, solid:[...MPN.sep.entries()].filter(e => e[1]).length, pos:MPN.pos, of:MPN.of}; }
};
window.SGF1 = {
  enter:(m, o) => f1Enter(m || 'free', o), exit:() => f1Exit(),
  // [lm25/kaiju] a tile's buildings changed (destroyed): drop its collision index (rebuilt lazily through sgrSkipB)
  bldDirty(ti){ BI.delete(ti); return true; },
  mp:MPAPI,   // [lm25/net] multiplayer hooks
  // simulate sec seconds at 60 Hz with a fixed input {thr, brk, steer, hb}
  sim(sec, inp){ const keep = SCRIPT; SCRIPT = Object.assign({thr:0, brk:0, steer:0, hb:0}, inp || {}); const n = Math.round(sec*60), t0 = performance.now();
    for (let i = 0; i < n; i++){ driveTick(1/60); aiTick(1/60); breakTick(1/60); if (i % 20 === 0) biPrefetch(CAR.x, CAR.y); }
    const ms = (performance.now() - t0)/Math.max(1, n); SCRIPT = keep; updateMeshes(); rcUpdate(1/60); CV.t = 1; CV.cpsi = CAR.psi; camStep(1/60); hudTick(); const s = this.state(); s.simMsPerFrame = +ms.toFixed(3); return s; },
  // a test autopilot: the racing line on the circuit, the road ahead in the city (thr caps the throttle)
  auto(sec, thr){ const n = Math.round(sec*60); thr = thr === undefined ? 1 : thr;
    for (let i = 0; i < n; i++){ SCRIPT = F1.veh === 'car' ? rcAutoInput(thr, arguments[2]) : autoInput(thr); driveTick(1/60); aiTick(1/60); breakTick(1/60); if (i % 20 === 0) biPrefetch(CAR.x, CAR.y); }
    SCRIPT = null; updateMeshes(); rcUpdate(1/60); CV.t = 1; CV.cpsi = CAR.psi; camStep(1/60); hudTick(); return this.state(); },
  hold(inp){ SCRIPT = inp ? Object.assign({thr:0, brk:0, steer:0, hb:0}, inp) : null; return !!SCRIPT; },
  meshes(on){ F1.hide = on === false; updateMeshes(); return !F1.hide; },
  laps(n){ F1.laps = Math.max(1, Math.min(9, n | 0)); F1.lapsUser = true; return F1.laps; },
  go(){ if (RACE.state === 'grid') RACE.t = 5.6 + RACE.hold; return RACE.state; },
  cam(i){ if (i === undefined) return dcNames()[F1.cam]; if (typeof i === 'string'){ i = dcNames().indexOf(i); if (i < 0) return null; }   // [lm28/drivecam] an index or a name
    F1.cam = i; CV.t = 1; CV.cpsi = CAR.psi; CV.chD = F1.veh === 'car' ? RCAR[RCM.key].g.chase[0] : 7; DC.bt = 1; DC.thr.a = null; DC.side.a = null; hudCam(); return (F1.veh === 'car' ? RC_CAMN : CAMN)[i]; },
  cams(){ return dcNames().slice(); },
  lookBack(on, now){ if (on !== undefined){ DC.lbOn = DC.lbLatch = !!on; if (now) DC.lb = DC.lbE = on ? 1 : 0; hudCam(); dcBtn(); } return DC.lbOn; },
  rear(mode){ return mode ? dcRearMode(mode) : DC.rear.mode; },
  obstacles(fn, on){ return obpReg(fn, on); },
  get dcam(){ const R = DC.rear, K = DC.K, G = F1.veh === 'car' ? (RCM.extM ? RCM.CX : RCM.G) : null; return {cam:dcNames()[F1.cam], camMs:+DC.ms.toFixed(3), lookBack:+DC.lbE.toFixed(2), blend:+DC.bt.toFixed(2), fov:+camera.fov.toFixed(1), shake:+DC.sh.toFixed(3), dolly:+DC.dz.toFixed(3),
    creature:K.on ? {d:Math.round(K.d), h:Math.round(K.H), close:+K.cl.toFixed(2)} : null, rear:{mode:R.mode, live:R.live, pip:R.pip, ms:+R.ms.toFixed(2), msMax:+R.msMax.toFixed(2), calls:R.calls}, overlay:F1.veh === 'car' ? dcOvRC() : dcOvF1(),
    cabinTris:G && G.cab ? Math.round(G.cab.tris) : null, obstacles:{providers:OBP.list.length, n:OBP.n, hits:OBP.hits, errors:OBP.err, last:OBP.last}}; },
  view(az, el, d){ F1.cam = 3; CV.az = az; CV.el = el; CV.d = d; CV.t = 1; hudCam(); return true; },
  hud(on){ if (HUD.el) HUD.el.style.display = on === false ? 'none' : ''; return on; },
  tp(lat, lon, hdg, z){ const q = sgXY(lat, lon), a = (hdg || 0)*PI/180; const ok = spawnFree(q[0], q[1], [Math.sin(a), Math.cos(a)], z); CV.cpsi = CAR.psi; CV.t = 1; return ok && this.state(); },
  state(){ const C = CAR, l = C.li >= 0 ? SGR.lines[C.li] : null;
    return {on:F1.on, mode:F1.mode, veh:F1.veh || 'f1', car:F1.veh === 'car' ? RCM.key : null, cam:(F1.veh === 'car' ? RC_CAMN : CAMN)[F1.cam][1],
      mph:+(C.u*2.23694).toFixed(1), limit:F1.veh === 'car' ? (RCM.limit || 0) : null, prnd:F1.veh === 'car' ? (C.park ? 'P' : C.rev ? 'R' : 'D' + (RCP.gears ? C.gear : '')) : null, lights:RCM.headOn, pitch:+(C.pitch*57.3).toFixed(2), roll:+(C.roll*57.3).toFixed(2), x:+C.x.toFixed(1), y:+C.y.toFixed(1), z:+C.z.toFixed(2), ground:+gnd(C.x, C.y).toFixed(2), hdg:+(90 - C.psi*180/PI).toFixed(0), kmh:+(C.u*3.6).toFixed(1), gear:C.gear, rpm:Math.round(C.rpm),
      kind:C.kind, cls:C.c, road:l ? ((l.name && l.name[0]) || l.ref || RD_EN[l.c]) : null, ref:l ? l.ref : null, race:RACE.state, lap:RACE.lap, pos:RACE.order.length ? RACE.order.findIndex(e => e.car === 0) + 1 : null,
      last:RACE.last ? +RACE.last.toFixed(3) : null, best:RACE.best ? +RACE.best.toFixed(3) : null, inv:RACE.inv, ai:AI.map(a => +(a.v*3.6).toFixed(0)), msAvg:+F1.ms.toFixed(3)}; },
  stats(){ return {tris:M.tris, bodyTris:M.G ? M.G.body.index.count/3 : 0, wheelTris:M.G ? M.G.wheel.index.count/3 : 0, steerTris:M.G ? M.G.steer.index.count/3 : 0, cars:NC,
      drawCalls:{main:3, shadow:2, overlay:(F1.on && F1.cam < 2) ? 3 : 0}, msAvg:+F1.ms.toFixed(3), roadIndexMs:RI.ms ? +RI.ms.toFixed(1) : null, roadBlocks:RI.blocks.size, bldTiles:BI.size, lapLen:TR ? +TR.L.toFixed(0) : null}; },
  bench(n){ n = n || 120; const t0 = performance.now(); for (let i = 0; i < n; i++){ driveTick(1/60); aiTick(1/60); updateMeshes(); camStep(1/60); hudTick(); } return +((performance.now() - t0)/n).toFixed(3); },
  surf(lat, lon, zh){ const q = sgXY(lat, lon); surfQ(q[0], q[1], zh || 0, false, SQP); const n = roadCands(q[0], q[1]); return {q:Object.assign({}, SQP), cands:RC.slice(0, n).map(r => ({z:+r.z.toFixed(2), c:r.c, li:r.li, d:+r.d.toFixed(1)}))}; },
  // elevated roads near a point (for tests): [{li, name, ref, cls, maxE, lat, lon, hdg}]
  elev(lat, lon, r, minE){ const q = sgXY(lat, lon), out = [];
    SGR.lines.forEach((l, li) => { if (!l.E || l.c > 10) return; const P = l.P; let best = -1, bk = 0; for (let k = 0; k < P.length; k += 2){ if (Math.hypot(P[k] - q[0], P[k + 1] - q[1]) < r && l.E[k >> 1] > best){ best = l.E[k >> 1]; bk = k; } }
      if (best >= (minE || 6)){ const k = Math.min(bk, P.length - 4), hd = 90 - Math.atan2(P[k + 3] - P[k + 1], P[k + 2] - P[k])*180/PI; out.push({li, name:l.name ? l.name[0] : null, ref:l.ref, cls:l.c, ow:l.flags & 1, maxE:+best.toFixed(1), lat:+(SG.lat0 + P[bk + 1]/SG.MY).toFixed(5), lon:+(SG.lon0 + P[bk]/SG.MX).toFixed(5), hdg:Math.round(hd)}); } });
    return out.sort((a, b) => b.maxE - a.maxE).slice(0, 12); },
  get CAR(){ return CAR; }, get RACE(){ return RACE; }, get TR(){ return TR; },
  // [lm22/svdrive] the road car: places / cars / colours, lamps, indicators, a summary for the sound system ({key, ev, rpmMax, idle, ind})
  rc:{get places(){ return rcPlaces().map(p => p.id); }, get cars(){ return rcKeys().slice(); }, get cols(){ return RC_COLS.map(c => c.en); },
    lights(v){ if (v) RCM.lights = v; return RCM.lights; }, ind(v){ if (v !== undefined) { RCM.ind = v; RCM.indT = 0; } return RCM.ind; }, col(i){ RCM.col = i | 0; if (RCM.built) rcPaint(); return RCM.col; },
    limit(li){ return rcLimitOf(li, SGR.lines[li].c); },
    get info(){ const k = RCM.key; return k ? {key:k, kind:RCAR[k].kind || 'car', ev:!!RCAR[k].ev, rpmMax:RCAR[k].ph.rpmMax, idle:RCAR[k].ph.idle, ind:RCM.ind, indT:RCM.indT, head:RCM.headOn} : null; },
    stats(){ return RCM.G ? Object.assign({key:RCM.key}, RCM.G.tris) : null; },
    // per-piece cost (ms per frame over n frames at 60 Hz): physics + collisions, the car's meshes / lamps, camera, HUD + minimap, building index
    prof(n){ n = n || 120; const T = {}, run = (k, f) => { const a = performance.now(); for (let i = 0; i < n; i++) f(); T[k] = +((performance.now() - a)/n).toFixed(3); };
      run('drive', () => driveTick(1/60)); run('rcUpdate', () => rcUpdate(1/60)); run('cam', () => camStep(1/60)); run('hud', () => hudTick()); run('bldIndex', () => biPrefetch(CAR.x, CAR.y)); run('f1meshes', () => updateMeshes());
      return T; }},
  // [lm20/audio] read-only views for the sound system: the mode state and the AI cars ({x, y, z, psi, v, ...})
  get F1(){ return F1; }, get AI(){ return AI; },
  // [lm24/drive] collisions, damage, breakables: state, contact log, scripted crashes, the circuit sweep
  crash:{
    // [lm27/destruct] external impulses and hits (window.SGPhys, the kaiju module), the car's box, the airborne state, test helpers
    impulse:(x, y, z, r, k) => extImpulse(x, y, z, r, k),
    hit:(jx, jy, jz, px, py, pz, E, kind) => extHit(jx, jy, jz, px, py, pz, E, kind),
    body:() => carBody(),
    get air(){ return airState(); },
    roll(side, dv){ if (!F1.on) return false; const C = CAR, sg = side < 0 ? -1 : 1, nx = -Math.sin(C.psi)*sg, ny = Math.cos(C.psi)*sg; rollStart(nx, ny, dv || 12, rollSSF(), 'test'); return airState(); },
    launch(vx, vy, vz, wx, wy, wz){ if (!F1.on) return false; airStart(vx, vy, vz, wx, wy, wz, 'test'); return airState(); },
    state(){ return {dmg:{f:+DMG.f.toFixed(3), b:+DMG.b.toFixed(3), l:+DMG.l.toFixed(3), r:+DMG.r.toFixed(3), total:+DMG.total.toFixed(3), wreck:DMG.wreck, lamps:DMG.lamps, glass:DMG.glass, bumper:DMG.bumper},
      env:Object.assign({}, DMG.env), sounds:Object.assign({}, CRS.snd), breaks:Object.assign({}, CRS.breaks), fallen:{trees:BRK.trees.length, poles:BRK.poles.length, shaking:BRK.shakes.length}, hits:CRS.hits,
      hidden:HIDE.list.length, hiddenPerm:HIDE.list.filter(h => h.perm).length, obxTiles:OBX.tiles.size, props:PROPS.list.length, smoke:SMK.pts ? SMK.pts.visible : false,
      lmGrids:[...LMG.grids.values()].map(G => ({id:G.id, cells:G.cells.size, cut:G.cut, tris:G.tris, ms:G.ms})), lmJob:LMG.job ? LMG.job.L.id : null, traffic:window.SGTraffic ? {suspend:!!window.SGTraffic.suspend, crashes:window.SGTraffic.crashes ? window.SGTraffic.crashes() : null} : null}; },
    log(on){ if (on !== undefined){ CRS.logOn = !!on; if (on) CRS.log.length = 0; } return CRS.log.slice(); },
    repair(){ dmgRepair(); return true; },
    sounds(){ return Object.assign({}, CRS.snd); },
    // drive into the nearest tree / pole / signal / car / building at kmh (coasting from 9 m away); o: {side:true (T-bone a car), sec, thr}
    test(kind, kmh, o){ o = o || {}; const C = CAR, v = kmh/3.6; let tx = 0, ty = 0, info = null, dir = null;
      biPrefetch(C.x, C.y); if (typeof SGRoads !== 'undefined' && SGRoads.surfaceAt) SGRoads.surfaceAt(C.x, C.y, C.z);
      if (kind === 'tree'){ const a = trunks(biTileOf(C.x, C.y)); if (!a) return {err:'no trees'}; let bd = o.r || 600;
        for (const L of a.g.values()) for (let q = 0; q < L.length; q += 6){ if (a.broken.has(L[q + 5]) || (o.minR && L[q + 2] < o.minR) || (o.maxR && L[q + 2] > o.maxR)) continue; const d = Math.hypot(L[q] - C.x, L[q + 1] - C.y); if (d < bd){ bd = d; tx = L[q]; ty = L[q + 1]; info = {r:+L[q + 2].toFixed(2), Eb:Math.round(treeEb(L[q + 2]))}; } } }
      else if (kind === 'pole'){ const T = obxTile(C.x, C.y); if (!T) return {err:'no road index'}; let bd = o.r || 600;
        for (let i = 0; i < T.n; i++){ if (T.kind[i] !== OBK.POLE || T.off[i]) continue; const d = Math.hypot(T.d[i*10 + 1] - C.x, T.d[i*10 + 2] - C.y); if (d < bd){ bd = d; tx = T.d[i*10 + 1]; ty = T.d[i*10 + 2]; info = {r:+T.d[i*10 + 5].toFixed(2), h:+(T.d[i*10 + 7] - T.d[i*10 + 6]).toFixed(1), Eb:poleEb(T.d[i*10 + 5])}; } } }
      else if (kind === 'signal'){ const L = window.SGTraffic && window.SGTraffic.props ? window.SGTraffic.props(C.x, C.y, o.r || 600, []) : []; let bd = 1e9;
        for (const P of L) if (P.kind === 'sig'){ const d = Math.hypot(P.x - C.x, P.y - C.y); if (d < bd){ bd = d; tx = P.x; ty = P.y; info = {key:P.key, h:P.h}; } } }
      else if (kind === 'car'){ const L = window.SGTraffic ? window.SGTraffic.obstacles(C.x, C.y, o.r || 400, []) : []; let bd = 1e9, B = null;
        for (const t of L){ if (t.crash || (o.type && t.k !== o.type) || (!o.type && t.hl > 3.2)) continue; const d = Math.hypot(t.x - C.x, t.y - C.y); if (d < bd && d > 4){ bd = d; B = t; } }
        if (!B) return {err:'no traffic'}; tx = B.x; ty = B.y; info = {id:B.id, k:B.k, m:B.m, v:+(B.v || 0).toFixed(1)}; dir = o.side ? [-B.hy, B.hx] : [B.hx, B.hy]; if (!o.side){ tx -= B.hx*B.hl; ty -= B.hy*B.hl; } }
      else if (kind === 'building'){ const T = BI.get(biTileOf(C.x, C.y)); if (!T || !T.ready) return {err:'no buildings'}; const E = T.EF; let bd = o.r || 500;
        for (let e = 0; e < E.length/6; e++){ const q = e*6, ex = E[q + 2] - E[q], ey = E[q + 3] - E[q + 1], l = Math.hypot(ex, ey); if (l < 9 || E[q + 5] - E[q + 4] < 6) continue; const mx = E[q] + ex/2, my = E[q + 1] + ey/2, d = Math.hypot(mx - C.x, my - C.y);
          if (d < bd){ const nx = ey/l, ny = -ex/l; if (bldCircle(mx + nx*6, my + ny*6, 3, gnd(mx, my), gnd(mx, my) + 2)) continue; bd = d; tx = mx; ty = my; dir = [-nx, -ny]; info = {len:+l.toFixed(1), h:+(E[q + 5] - E[q + 4]).toFixed(1)}; } } }
      if (!info) return {err:'nothing found', kind};
      if (!dir){ const dx = tx - C.x, dy = ty - C.y, l = Math.hypot(dx, dy) || 1; dir = [dx/l, dy/l]; }
      const back = (o.dist || 9) + (F1.veh === 'car' ? 2.3 : 2.6);
      C.x = tx - dir[0]*back; C.y = ty - dir[1]*back; C.psi = Math.atan2(dir[1], dir[0]); C.v = 0; C.r = 0; C.delta = 0; C.rev = false; C.park = false; C.bf = 0;
      surfQ(C.x, C.y, gnd(C.x, C.y) + 0.3, false, SQP); C.z = C.zs = C.zv = SQP.blocked ? gnd(C.x, C.y) : SQP.z; C.kind = SQP.kind; C.u = v;
      const snd0 = Object.assign({}, CRS.snd), br0 = Object.assign({}, CRS.breaks); dmgRepair(); CRS.logOn = true; CRS.log.length = 0;
      const st = this.state; const r = window.SGF1.sim(o.sec || 2.5, {thr:o.thr || 0, brk:0, steer:0, hb:0});
      const snd = {}; for (const k in CRS.snd) if (CRS.snd[k] !== (snd0[k] || 0)) snd[k] = CRS.snd[k] - (snd0[k] || 0);
      const br = {}; for (const k in CRS.breaks) if (CRS.breaks[k] !== br0[k]) br[k] = CRS.breaks[k] - br0[k];
      CRS.logOn = false;
      return {kind, kmh, target:info, after:{kmh:r.kmh, x:r.x, y:r.y}, dmg:{f:+DMG.f.toFixed(2), b:+DMG.b.toFixed(2), l:+DMG.l.toFixed(2), r:+DMG.r.toFixed(2), wreck:DMG.wreck, lamps:DMG.lamps, glass:DMG.glass, bumper:DMG.bumper},
        env:{pow:+DMG.env.pow.toFixed(2), grip:+DMG.env.gripF.toFixed(2), pull:+DMG.env.pull.toFixed(3)}, contacts:CRS.log.slice(0, 8), sounds:snd, broke:br,
        traffic:kind === 'car' && window.SGTraffic.crashes ? window.SGTraffic.crashes() : undefined}; },
    // the circuit: everything solid between the walls (buildings, landmark faces, road obstacles, trees, signal poles), sampled every
    // 2 m along the circuit at lateral offsets: [{kind, s, d, depth}]
    sweep(step){ if (!TR) return {err:'no circuit'}; corridorPrefetch(true); step = step || 2; const out = [], seen = new Set();
      for (let i = 0; i < TR.n; i += 10){ const ti = biTileOf(TR.X[i], TR.Y[i]); if (ti >= 0){ const Tb = biGet(ti); if (!Tb.ready) biWork(Tb, 1e9); } }
      if (typeof landmarks !== 'undefined') for (const q of landmarks){ const H = SGR.hulls && SGR.hulls.get(q.id), b = H ? H.bb : null; if (!b || b[2] < TR.bb[0] || b[0] > TR.bb[2] || b[3] < TR.bb[1] || b[1] > TR.bb[3]) continue;
        let near = false; for (let i = 0; i < TR.n && !near; i += 4) if (TR.X[i] > b[0] - 15 && TR.X[i] < b[2] + 15 && TR.Y[i] > b[1] - 15 && TR.Y[i] < b[3] + 15) near = true;
        if (near && !LMG.grids.has(q.id) && lmMeshes.get(q.id)){ const J = lmgJob(q, lmMeshes.get(q.id)); while (!lmgWork(J, 1e9)); } }
      for (let s = 0; s < TR.L; s += step){ for (let dd = -9; dd <= 9; dd += 1.5){ const p = trAt(TR.sStart + s, dd, TMPA), i = p[2], x = p[0], y = p[1];
          if (dd > (TR.wl ? TR.wl[i] : 10) - 1.1 || dd < -(TR.wr ? TR.wr[i] : 10) + 1.1) continue;
          const z = trSurf(i, p[3], x, y), tests = [['building', () => bldCircle(x, y, 0.9, z, z + 1.05)], ['landmark', () => lmgCircle(x, y, 0.9, z + 0.18, z + 1.2)], ['road', () => obxCircle(x, y, 0.9, z + 0.08, z + 1.0)], ['tree', () => treeCircle(x, y, 0.9, z)]];
          for (const [k, f] of tests){ if (f()){ const key = k + Math.round(x/3) + ',' + Math.round(y/3); if (seen.has(key)) continue; seen.add(key);
            out.push({kind:k, s:Math.round(s), d:dd, depth:+PUSH.depth.toFixed(2), x:Math.round(x), y:Math.round(y), sub:k === 'road' && OBX.PUSHI >= 0 ? ['', 'pole', 'mast', 'rail', 'pier'][OBX.PUSHT.kind[OBX.PUSHI]] : undefined}); } } } }
      return out; },
    // the AI cars now: anything solid of the city inside their bodies (three circles each): [{car, kind, s, depth}]
    aiCheck(){ const out = []; for (const a of AI){ const cs = Math.cos(a.psi), sn = Math.sin(a.psi);
        for (const o of [1.9, 0, -1.9]){ const x = a.x + cs*o, y = a.y + sn*o;
          for (const [k, f] of [['building', () => bldCircle(x, y, 0.95, a.z, a.z + 1.05)], ['landmark', () => lmgCircle(x, y, 0.95, a.z + 0.18, a.z + 0.95)], ['road', () => obxCircle(x, y, 0.95, a.z + 0.08, a.z + 1.0)], ['tree', () => treeCircle(x, y, 0.95, a.z)]])
            if (f()) out.push({car:a.car, kind:k, s:Math.round(((a.s - TR.sStart) % TR.L + TR.L) % TR.L), depth:+PUSH.depth.toFixed(2)}); } }
      return out; },
    corridor(){ return {tiles:CORR.tiles ? CORR.tiles.length : 0, done:CORR.done, hidden:HIDE.list.filter(h => h.perm).length}; },
    lmg(){ const L = []; if (typeof landmarks !== 'undefined') for (const q of landmarks) L.push({id:q.id, type:q.type, x:Math.round(q.x), y:Math.round(q.y)}); return L; },
    lmgBuild(id){ const L = landmarks.find(q => q.id === id); if (!L) return null; const J = lmgJob(L, lmMeshes.get(id)); while (!lmgWork(J, 1e9)); const G = LMG.grids.get(id); return {cells:G.cells.size, tris:G.tris, samples:G.samples, ms:G.ms}; },
    get DMG(){ return DMG; }, get BRK(){ return BRK; }, get HIDE(){ return HIDE; }
  }
};
}
