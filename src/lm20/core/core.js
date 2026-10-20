// ===== v20 core: evening light schedule for landmarks, light-show settings, the Marina Bay Sands laser show =====
{
  const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a)/(b - a))); return t*t*(3 - 2*t); };
  // the evening, by the clock: architectural lights ramp up at dusk, light shows peak around 19:45-20:15 and 20:45-21:15
  // (Garden Rhapsody / Spectra), offices go dark through the night, everything dims after midnight
  function lmSchedule(tod){
    const t = tod < 6 ? tod + 24 : tod;                                   // 6 .. 30
    const eve = sm(18.6, 19.5, t)*(1 - sm(23.2, 24.2, t));
    const pk = Math.max(Math.exp(-Math.pow((t - 20.0)/0.32, 2)), Math.exp(-Math.pow((t - 21.0)/0.32, 2)));
    LMS.show.value = Math.min(1, 0.4*eve + 0.65*pk);
    // office occupancy (fraction of lit windows): full by day, thinning out from 19:00, a few night owls, early risers
    const occ = t < 19 ? 1 : t < 23 ? 1 - 0.62*sm(19, 23, t) : t < 29 ? 0.38 - 0.26*sm(23, 26.5, t) + 0.5*sm(28.8, 30, t) : 0.12 + 0.88*sm(29, 31, t);
    LMS.occ.value = Math.max(0.1, Math.min(1, occ));
    LMS.dim.value = 1 - 0.42*sm(23.8, 25, t)*(1 - sm(28.5, 29.6, t));
  }
  HOOKS.time.push(tod => lmSchedule(tod));
  // real light shows and LED facades
  const LT = {mbs:{anim:'show', c2:'#ff5ad8'}, flyer:{anim:'cycle', c2:'#ff6fae'}, helix:{anim:'cycle', c2:'#56d6ff'}, sportshub:{anim:'cycle', c2:'#7a6cff'},
    artscience:{anim:'cycle', c2:'#ffcf7a'}, jewel:{anim:'show', c2:'#6fe0ff'}, esplanade:{anim:'breathe'}, fullerton:{anim:'breathe'}, merlion:{anim:'breathe'},
    changitower:{anim:'cycle', c2:'#5ab0ff'}, marinaone:{anim:'cycle', c2:'#9dffcf'}, capitaspring:{anim:'cycle', c2:'#a6ff8a'}, southbeach:{anim:'cycle', c2:'#8fd0ff'}};
  for (const [k, v] of Object.entries(LT)){ const D = LANDMARKS[k]; if (!D) continue; const base = D.lt || (D.cat === 'new' ? {m:1, c:'#d6e4ff', k:0.6} : {m:0, c:'#ffc98a', k:0.9}); D.lt = Object.assign({}, base, v); }
  if (SITES.gardens){ SITES.gardens.lt = Object.assign({}, SITES.gardens.lt || {m:0, c:'#ffd9a8', k:0.8}, {anim:'show', c2:'#c070ff'}); }
  // Marina Bay Sands: laser beams fanning over the bay from the SkyPark during the evening shows
  let laser = null;
  function buildLaser(){
    const g = new THREE.Group(), geo = new THREE.CylinderGeometry(0.3, 3.2, 1, 8, 1, true); geo.translate(0, 0.5, 0);
    for (let i = 0; i < 12; i++){ const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({color:0xffffff, transparent:true, opacity:0, blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide, fog:false})); m.renderOrder = 6; m.frustumCulled = false; g.add(m); }
    g.visible = false; scene.add(g); return g;
  }
  const q = new THREE.Quaternion(), e = new THREE.Euler(0, 0, 0, 'YXZ'), col = new THREE.Color();
  HOOKS.frame.push((t) => {
    const mbs = SGR.on && typeof landmarks !== 'undefined' ? landmarks.find(L => L.type === 'mbs') : null;
    const k = mbs ? Math.max(0, (LMS.show.value - 0.5)/0.5)*sm(0.5, 0.9, nightF) : 0;
    if (!k){ if (laser) laser.visible = false; return; }
    if (!laser) laser = buildLaser();
    laser.visible = true; laser.position.set(mbs.x, (mbs.top || 0) + 200, -mbs.y);
    const n = laser.children.length;
    for (let i = 0; i < n; i++){
      const b = laser.children[i], ph = i/n;
      // fan towards the bay (north-west of the hotel), sweeping and breathing
      const az = 0.8 + (ph - 0.5)*1.6 + 0.35*Math.sin(t*0.5 + i*1.3), el = 0.05 + 0.12*(0.5 + 0.5*Math.sin(t*0.8 + i*2.1));
      e.set(-(Math.PI/2 - el), az, 0); q.setFromEuler(e); b.quaternion.copy(q);
      b.scale.set(1, 1250 + 250*Math.sin(t*0.3 + i), 1);
      col.setHSL((t*0.05 + ph*0.5) % 1, 0.95, 0.6); b.material.color.copy(col);
      b.material.opacity = 0.2*k*(0.6 + 0.4*Math.sin(t*3.1 + i*0.7)*Math.sin(t*1.7 + i));
    }
  });
  window.LMS = LMS;
}
