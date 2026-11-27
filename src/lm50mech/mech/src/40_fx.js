
// ---- 40_fx.js ----
/* ================= effects and sound: the beam, the missiles, the carried rock, the drop's thrusters; own synthesis =================
   Particles reuse the creature mode's pools (KFX: dust, flames, debris, physics chunks, fires) and the flying mode's SGFX
   (explosions, sparks, scorch marks). Own meshes (built on first use): the beam (two additive cylinders: core and glow, a flare at
   the muzzle and at the impact), 24 instanced missiles, the rock. Sound on window.SGAudio's live context and its 'fx' bus (as the
   creature mode does), delayed and damped by the distance, panned: footfalls (a deep thud, a metal clank, hydraulic hiss), servo
   whine, punch whoosh / impact, shield zap, armour clang, the beam's hum (a loop while it fires), missile launches, the stomp, an
   alarm at low armour, a short fanfare. Nothing plays while the sound is off. */
const MF = (() => {
  // ---- meshes
  const BEAM_VS = 'varying vec3 vN; varying vec3 vV; varying float vY; void main(){ vY = position.y + 0.5; vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }';
  const BEAM_FS = 'uniform vec3 uC; uniform float uA; uniform float uT; varying vec3 vN; varying vec3 vV; varying float vY; void main(){ float f = abs(dot(normalize(vN), normalize(vV))); float w = pow(f, 1.6); float n = 0.82 + 0.18 * sin(vY * 140.0 - uT * 60.0); gl_FragColor = vec4(uC * w * n * uA, w * uA); }';
  let FX = null;
  function ensure(){
    if (FX) return FX;
    const g = new THREE.CylinderGeometry(1, 1, 1, 12, 1, true);
    const mk = (c, a) => new THREE.ShaderMaterial({uniforms:{uC:{value:new THREE.Color(c)}, uA:{value:a}, uT:{value:0}}, vertexShader:BEAM_VS, fragmentShader:BEAM_FS, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, side:THREE.DoubleSide});
    const core = new THREE.Mesh(g, mk(0xf2fdff, 1.0)), glow = new THREE.Mesh(g, mk(0x58d8ff, 0.55));
    for (const m of [core, glow]){ m.frustumCulled = false; m.visible = false; m.renderOrder = 8; scene.add(m); }
    // flares (muzzle, impact): additive sprites from a radial gradient
    const cv = document.createElement('canvas'); cv.width = cv.height = 64; const o = cv.getContext('2d'); let tex = null;
    if (o && o.createRadialGradient){ const gr = o.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(170,240,255,0.85)'); gr.addColorStop(1, 'rgba(60,180,255,0)'); o.fillStyle = gr; o.fillRect(0, 0, 64, 64); tex = new THREE.CanvasTexture(cv); }
    const fm = () => new THREE.SpriteMaterial({map:tex, color:0xffffff, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, fog:false});
    const fl0 = new THREE.Sprite(fm()), fl1 = new THREE.Sprite(fm()); for (const s of [fl0, fl1]){ s.visible = false; s.renderOrder = 9; scene.add(s); }
    // missiles: a body, a nose cone, four fins (merged), instanced
    const mg = missileGeo(), mm = new THREE.MeshLambertMaterial({color:0xd8d4c8}), msl = new THREE.InstancedMesh(mg, mm, 24); msl.count = 0; msl.frustumCulled = false; msl.name = 'mech_missiles'; scene.add(msl);
    FX = {core, glow, fl0, fl1, msl, rock:null, t:0}; return FX;
  }
  function missileGeo(){
    const parts = [new THREE.CylinderGeometry(0.5, 0.5, 5, 8), new THREE.ConeGeometry(0.5, 1.6, 8)]; parts[1].translate(0, 3.3, 0);
    for (let k = 0; k < 4; k++){ const f = new THREE.BoxGeometry(0.08, 1.4, 1.0); f.translate(0, -2.0, 0.75); f.rotateY(k*PI/2); parts.push(f); }
    const pos = [], nrm = []; for (const p of parts){ const q = p.index ? p.toNonIndexed() : p; pos.push(...q.attributes.position.array); nrm.push(...q.attributes.normal.array); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3)); g.rotateX(PI/2); return g;   // nose along +z
  }
  // the beam from o to h (world [x, y, z]); k what it hits; null hides it
  const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0), _dir = new THREE.Vector3(), _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion();
  function beamShow(o, h, k){
    const F = ensure(); if (!o){ F.core.visible = F.glow.visible = F.fl0.visible = F.fl1.visible = false; beamSnd(false); return; }
    F.t += 1/60; _a.set(o[0], o[2], -o[1]); _b.set(h[0], h[2], -h[1]); _dir.subVectors(_b, _a); const L = _dir.length(); _dir.normalize(); _q.setFromUnitVectors(_up, _dir);
    const fl = 0.85 + 0.15*Math.sin(F.t*53) + 0.08*Math.sin(F.t*91);
    for (const [m, r] of [[F.core, 2.0*fl], [F.glow, 6.5*fl]]){ m.visible = true; m.position.copy(_a).addScaledVector(_dir, L/2); m.quaternion.copy(_q); m.scale.set(r, L, r); m.material.uniforms.uT.value = F.t; }
    F.fl0.visible = true; F.fl0.position.copy(_a); F.fl0.scale.setScalar(24*fl); F.fl1.visible = k !== 'sky'; F.fl1.position.copy(_b); F.fl1.scale.setScalar((k === 'kaiju' ? 64 : 46)*fl);
    beamSnd(true, o, h);
  }
  // instanced missiles along their velocity
  const _o = new THREE.Object3D();
  function mslShow(L){
    const F = ensure(), M = F.msl; let n = 0;
    for (const m of L){ if (n >= 24) break; _o.position.set(m.x, m.z, -m.y); _a.set(m.x + m.vx, m.z + m.vz, -(m.y + m.vy)); _o.lookAt(_a); _o.updateMatrix(); M.setMatrixAt(n++, _o.matrix); }
    M.count = n; M.instanceMatrix.needsUpdate = true; M.visible = n > 0;
  }
  // the rock: an irregular block in the building's colour (in the right hand while carried, then flying and tumbling)
  function rockMake(C){
    const F = ensure(); if (F.rock){ scene.remove(F.rock); F.rock.geometry.dispose(); F.rock.material.dispose(); }
    const g = new THREE.DodecahedronGeometry(C.s*0.6, 0), p = g.attributes.position, sd = (C.s*1000) | 0;
    // (the polyhedron is not indexed: the same corner gets the same factor from a hash of its position, so the faces stay closed)
    for (let i = 0; i < p.count; i++){ const x = p.getX(i), y = p.getY(i), z = p.getZ(i), h = mulb((Math.round(x*50)*73856093) ^ (Math.round(y*50)*19349663) ^ (Math.round(z*50)*83492791) ^ sd)(), k = 0.75 + h*0.5; p.setXYZ(i, x*k*1.2, y*k*0.85, z*k); }
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({color:new THREE.Color(C.col[0]*0.9, C.col[1]*0.9, C.col[2]*0.9), flatShading:true})); m.castShadow = true; m.name = 'mech_rock'; scene.add(m); F.rock = m; C.mesh = m; return m;
  }
  function rockHold(){ const F = FX; if (!F || !F.rock || !ST.carry) return; const h = MC.W(MK.BI.handR, [-15.6, 24.8, 0.9]); F.rock.visible = true; F.rock.position.set(h[0], h[2] + ST.carry.s*0.25, -h[1]); }
  function rockThrow(){
    const C = ST.carry; if (!C) return; ST.carry = null; const S = ST.S, h = MC.W(MK.BI.handR, [-15.6, 24.8, 0.9]), A = ST.aim;
    let dx = A.x - h[0], dy = A.y - h[1], dz = A.z - h[2]; const dh = Math.hypot(dx, dy) || 1, v = 175, T = Math.max(0.2, Math.hypot(dh, dz)/v);
    ST.proj.push({x:h[0], y:h[1], z:h[2], vx:dx/T, vy:dy/T, vz:dz/T + 0.5*9.81*T, t:0, s:C.s, col:C.col, mesh:C.mesh, w:[1.3, 0.7, 2.1]}); void S;
  }
  function rockPose(p){ if (!p.mesh) return; p.mesh.visible = true; p.mesh.position.set(p.x, p.z, -p.y); p.mesh.rotation.set(p.t*p.w[0], p.t*p.w[1], p.t*p.w[2]); }
  function rockHide(p){ if (p.mesh){ p.mesh.visible = false; } }
  function hideAll(){ if (!FX) return; beamShow(null); FX.msl.count = 0; FX.msl.visible = false; if (FX.rock) FX.rock.visible = false; }
  // ---------------- sound (own synthesis on SGAudio's context) ----------------
  function au(){ try { const A = window.SGAudio, E = A && A._test && A._test.LIVE; if (!A || !A.on || !E || !E.ctx || E.ctx.state !== 'running') return null; return E; } catch (e){ return null; } }
  const camD = (x, y, z) => { const c = camera.position; return Math.hypot(c.x - x, c.y - (z || 0), -c.z - y); };
  function panOf(x, y){ try { const c = camera.position, v = new THREE.Vector3(x - c.x, 0, -y - c.z), r = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion); return v.normalize().dot(r.setY(0).normalize()) || 0; } catch (e){ return 0; } }
  const NB = {ctx:null, b:null};
  function noise(c){ if (NB.ctx === c && NB.b) return NB.b; const n = Math.floor(c.sampleRate*2), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0), r = mulb(4242); for (let i = 0; i < n; i++) d[i] = r()*2 - 1; NB.ctx = c; NB.b = b; return b; }
  function voice(x, y, z, k, reach){
    const E = au(); if (!E) return null; const c = E.ctx, d = camD(x, y, z), att = Math.min(1, (reach || 1.6)/(1 + d/600))*(k || 1); if (att < 0.015) return null;
    const g = c.createGain(), dst = (E.bus && (E.bus.fx || E.bus.f1)) || E.out; let n = g;
    if (c.createStereoPanner){ const p = c.createStereoPanner(); p.pan.value = clamp(panOf(x, y), -0.8, 0.8); g.connect(p); n = p; }
    n.connect(dst); if (E.rvIn && d > 250){ const s = c.createGain(); s.gain.value = Math.min(0.7, d/2500); g.connect(s); s.connect(E.rvIn); }
    return {c, g, t0:c.currentTime + Math.min(5, d/343) + 0.01, att};
  }
  const env = (g, t0, a, peak, hold, rel) => { g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t0 + a); g.gain.setValueAtTime(Math.max(0.0002, peak), t0 + a + hold); g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + hold + rel); };
  function osc(c, type, f, t0, dur, dst, gain){ const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.setValueAtTime(f, t0); g.gain.value = gain === undefined ? 1 : gain; o.connect(g); g.connect(dst); o.start(t0); o.stop(t0 + dur + 0.05); return o; }
  function nz(c, t0, dur, dst, type, f, q, gain){ const s = c.createBufferSource(), b = c.createBiquadFilter(), g = c.createGain(); s.buffer = noise(c); s.loop = true; b.type = type; b.frequency.value = f; if (q) b.Q.value = q; g.gain.value = gain === undefined ? 1 : gain; s.connect(b); b.connect(g); g.connect(dst); s.start(t0, (t0*7.31) % 1.5); s.stop(t0 + dur + 0.05); return {s, b, g}; }
  const SND = {
    step(V, k){ const {c, g, t0, att} = V; env(g, t0, 0.005, 0.95*att*k, 0.05, 0.9); const o = osc(c, 'sine', 62, t0, 1.0, g, 1); o.frequency.exponentialRampToValueAtTime(26, t0 + 0.6);
      nz(c, t0, 0.5, g, 'lowpass', 300, 0.7, 0.9); const cl = nz(c, t0 + 0.02, 0.25, g, 'bandpass', 1300, 6, 0.35); cl.g.gain.setValueAtTime(0.35, t0 + 0.02); cl.g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.25);
      const h = nz(c, t0 + 0.12, 0.6, g, 'highpass', 3500, 0.5, 0.0); h.g.gain.setValueAtTime(0.0001, t0 + 0.12); h.g.gain.exponentialRampToValueAtTime(0.16*k, t0 + 0.2); h.g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.7); },
    servo(V, k){ const {c, g, t0, att} = V; env(g, t0, 0.06, 0.22*att*k, 0.25, 0.3); const o = osc(c, 'sawtooth', 190, t0, 0.7, g, 0.5); o.frequency.linearRampToValueAtTime(310, t0 + 0.45); const b = c.createBiquadFilter(); void b; nz(c, t0, 0.6, g, 'bandpass', 900, 3, 0.4); },
    whoosh(V, k){ const {c, g, t0, att} = V; env(g, t0, 0.12, 0.45*att*k, 0.08, 0.35); const n = nz(c, t0, 0.6, g, 'bandpass', 300, 1.2, 1); n.b.frequency.exponentialRampToValueAtTime(1400, t0 + 0.3); },
    punch(V, k){ const {c, g, t0, att} = V; env(g, t0, 0.003, 1.0*att*k, 0.05, 1.2); for (const [f, a] of [[96, 1], [187, 0.45], [413, 0.3], [771, 0.18]]){ const o = osc(c, f > 300 ? 'square' : 'sine', f, t0, 1.3, g, a*0.5); o.frequency.exponentialRampToValueAtTime(f*0.7, t0 + 1.1); } nz(c, t0, 0.4, g, 'lowpass', 900, 0.8, 0.8); },
    punchB(V, k){ const {c, g, t0, att} = V; env(g, t0, 0.004, 0.7*att*k, 0.05, 0.8); osc(c, 'sine', 70, t0, 0.9, g, 0.8).frequency.exponentialRampToValueAtTime(32, t0 + 0.7); nz(c, t0, 0.7, g, 'lowpass', 600, 0.7, 0.9); },
    clang(V, k){ const {c, g, t0, att} = V; env(g, t0, 0.002, 0.8*att*k, 0.04, 1.4); for (const [f, a] of [[233, 0.5], [517, 0.35], [1131, 0.22], [1907, 0.12]]) osc(c, 'triangle', f, t0, 1.5, g, a); nz(c, t0, 0.3, g, 'bandpass', 2400, 2, 0.4); },
    shield(V, k){ const {c, g, t0, att} = V; env(g, t0, 0.004, 0.55*att*k, 0.06, 0.45); const o = osc(c, 'sine', 1500, t0, 0.6, g, 0.6); o.frequency.exponentialRampToValueAtTime(260, t0 + 0.45); const o2 = osc(c, 'square', 760, t0, 0.3, g, 0.12); o2.frequency.exponentialRampToValueAtTime(180, t0 + 0.3); },
    launch(V, k){ const {c, g, t0, att} = V; env(g, t0, 0.01, 0.5*att*k, 0.1, 0.9); const n = nz(c, t0, 1.1, g, 'bandpass', 500, 0.9, 1); n.b.frequency.exponentialRampToValueAtTime(2600, t0 + 0.8); osc(c, 'sine', 120, t0, 0.25, g, 0.6).frequency.exponentialRampToValueAtTime(50, t0 + 0.2); },
    stomp(V, k){ const {c, g, t0, att} = V; env(g, t0, 0.004, 1.0*att*k, 0.1, 2.0); osc(c, 'sine', 48, t0, 2.2, g, 1).frequency.exponentialRampToValueAtTime(20, t0 + 1.8); nz(c, t0, 1.6, g, 'lowpass', 220, 0.7, 1); },
    overheat(V, k){ const {c, g, t0, att} = V; env(g, t0, 0.01, 0.35*att*k, 0.6, 0.4); for (let i = 0; i < 3; i++) osc(c, 'square', 660, t0 + i*0.22, 0.12, g, 0.25); nz(c, t0, 1.0, g, 'highpass', 2500, 0.5, 0.5); },
    alarm(V, k){ const {c, g, t0, att} = V; env(g, t0, 0.01, 0.22*att*k, 0.75, 0.1); osc(c, 'square', 880, t0, 0.38, g, 0.4); osc(c, 'square', 660, t0 + 0.4, 0.38, g, 0.4); },
    fanfare(V, k){ const {c, g, t0, att} = V; env(g, t0, 0.01, 0.3*att*k, 1.6, 0.6); [523, 659, 784, 1047].forEach((f, i) => osc(c, 'square', f, t0 + i*0.16, i === 3 ? 0.9 : 0.15, g, 0.3)); },
    down(V, k){ const {c, g, t0, att} = V; env(g, t0, 0.02, 0.4*att*k, 1.0, 1.0); const o = osc(c, 'sawtooth', 440, t0, 2.0, g, 0.3); o.frequency.exponentialRampToValueAtTime(55, t0 + 1.8); },
    thrust(V, k){ const {c, g, t0, att} = V; env(g, t0, 0.3, 0.7*att*k, 2.2, 0.8); nz(c, t0, 3.4, g, 'lowpass', 700, 0.6, 1); osc(c, 'sawtooth', 70, t0, 3.4, g, 0.25); }
  };
  function snd(name, x, y, z, k){ try { const f = SND[name]; if (!f) return; const V = voice(x, y, z, 1, name === 'alarm' || name === 'fanfare' ? 40 : 1.8); if (V) f(V, k === undefined ? 1 : k); } catch (e){ /* optional */ } }
  // the beam's hum: a loop while it fires
  const BS = {on:false, o:null};
  function beamSnd(on, o, h){
    try { const E = au(); if (!on || !E){ if (BS.on && BS.n){ const c = BS.n.c, t = c.currentTime; BS.n.g.gain.cancelScheduledValues(t); BS.n.g.gain.setTargetAtTime(0.0001, t, 0.08); const N = BS.n; setTimeout(() => { try { for (const s of N.src) s.stop(); N.g.disconnect(); } catch (e){ /* */ } }, 600); } BS.on = false; BS.n = null; return; }
      const c = E.ctx, x = o ? o[0] : 0, y = o ? o[1] : 0, z = o ? o[2] : 0, d = camD(x, y, z), att = Math.min(1, 1.6/(1 + d/600));
      if (!BS.on){ const g = c.createGain(), dst = (E.bus && (E.bus.fx || E.bus.f1)) || E.out; g.gain.value = 0.0001; g.connect(dst); const t = c.currentTime, src = [];
        for (const [f, ty, a] of [[110, 'sawtooth', 0.35], [111.6, 'sawtooth', 0.3], [221, 'square', 0.08]]){ const os = c.createOscillator(), og = c.createGain(); os.type = ty; os.frequency.value = f; og.gain.value = a; const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1600; os.connect(og); og.connect(lp); lp.connect(g); os.start(t); src.push(os); }
        const ns = c.createBufferSource(); ns.buffer = noise(c); ns.loop = true; const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 4200; bp.Q.value = 1.4; const ng = c.createGain(); ng.gain.value = 0.25; ns.connect(bp); bp.connect(ng); ng.connect(g); ns.start(t); src.push(ns);
        BS.n = {c, g, src}; BS.on = true; }
      BS.n.g.gain.setTargetAtTime(0.32*att, c.currentTime, 0.05); void h;
    } catch (e){ BS.on = false; }
  }
  return {ensure, beamShow, mslShow, rockMake, rockHold, rockThrow, rockPose, rockHide, hideAll, snd, beamSnd, get FX(){ return FX; }};
})();
