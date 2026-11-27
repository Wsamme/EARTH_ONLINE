// ===== City Brush v48 · lm50mech/mech — 机甲 · Mech mode: pilot a giant mech and fight the creature (owner's request 28 Nov 2026) =====
// The mech: an original design built procedurally here (no franchise look, no logos, no text): a ~71 m heavy engineering walker in
// bone-white armour over a charcoal frame with safety-orange accents - a low, wide sensor head with a recessed visor band and an
// asymmetric antenna / dish, a deep chest with a crew hatch, heat vents, a back-mounted power pack with radiator fins and two exhaust
// stacks, rounded shoulder blocks carrying six-cell missile pods and floodlights, a beam emitter barrel on the right forearm, an
// armour plate on the left, orange knee caps, wide feet with heel spurs and toe caps. 24 rigid bones in one skinned mesh per level of
// detail (LOD 0 / 1 / 2, one draw call each + shadow; ~40 k / ~7 k / ~1.6 k triangles), a second small unlit mesh for the lamps, glow
// sprites and floodlight pools on the ground at night.
// Animation (procedural, every frame): world-space foot planting - each foot stays where it landed on the terrain (KW.ground: the
// street, or the bed where it wades) and steps to a target ahead of the body (cadence from the speed; idle shuffles when it turns),
// two-bone leg IK with the knee forward, pelvis height from the legs' reach plus a bob and a landing dip, lean / sway / twist, arms
// by two-bone IK (swinging against the legs, guard, punches, grabbing, aiming the beam), head look, finger open / close; heavy
// footfalls shake the camera (the creature mode's calm shake, KG.shakeEv) and throw up dust.
// The mode (window.SGMech; from the creature tab's 方式 AS row: 机甲 Mech, or #mech in the URL, #mech-<species> for another creature):
// the mech drops in at the camera's target (a road nearby), the creature rises (SGKaiju.start({mech:{hp}}): it hunts the mech, the
// army comes in and keeps hindering it). Third-person camera (mouse / drag / right stick; ground- and building-aware). Weapons:
// punches (alternating fists, hit test against SGKaiju.body() spheres), grab (wrench the creature and throw it off balance; next to a
// building: rip a chunk out and carry it, then throw it), the arm beam (hold; overheats), a 12-missile salvo from the shoulder pods
// (homing on the part under the crosshair), a stomp shockwave. The creature takes damage only in this mode (kaiju.js [v48 mech]
// hook: damage, onEvent) and falls when its hit points are gone; its strikes, stomps, sweeps and body hit the mech (shield first, then
// armour). Win / lose card. The mech's feet, legs, body, fists and every miss bring buildings down through the creature mode's own
// destruction (KW.apply / KW.blast: bld.js collapses, debris, dust, fires), throw traffic aside and hit landmarks.
// Sound synthesised on window.SGAudio's context ('fx' bus; nothing when the sound is off) plus its fx() one-shots.
// Lazy: nothing is built until the first game (model, HUD, listeners); the frame hook returns at once while the mode is off.
// Contract: window.SGMech {play(o), stop(), on, status(), input(o), act(name, on), sim(sec, dt), stats(), _}.
// Built from lm50mech/mech/src/*.js by lm50mech/mech/mk.sh (load after lm25/kaiju and lm28/army).
{
const SGMECH_ = (() => {
const PI = Math.PI, TAU = PI*2;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v, lerp = (a, b, t) => a + (b - a)*t;
const sstep = (a, b, x) => { const t = clamp((x - a)/(b - a), 0, 1); return t*t*(3 - 2*t); };
const wrapA = a => { a = (a + PI) % TAU; if (a < 0) a += TAU; return a - PI; };
function mulb(a){ return function(){ a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0)/4294967296; }; }
// the creature mode's internals (lm25/kaiju): world (KW), effects (KFX), game (KG), presentation (KSX); guarded
const KJ = () => window.SGKaiju || null;
const KW_ = () => { const K = KJ(); return K && K._ ? K._.KW : null; };
const KFX_ = () => { const K = KJ(); return K && K._ ? K._.KFX : null; };
const KG_ = () => { const K = KJ(); return K && K._ ? K._.KG : null; };
const gnd = (x, y) => { const W = KW_(); try { return W ? Math.max(-18, W.ground(x, y)) : hC(x, y); } catch (e){ return 0; } };
const wet = (x, y) => { const W = KW_(); try { return W ? W.isWater(x, y) : false; } catch (e){ return false; } };
const night = () => typeof nightF !== 'undefined' ? nightF : 0;
