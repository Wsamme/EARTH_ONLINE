/* ---------- gba: the inland water bodies merged per 8 km cell (each body keeps its level as the vertices' height; 4 540 bodies were one mesh each) ---------- */
function sgrWater(){
  sgrDisposeGroup(SGR.waterGroup);
  const Wd = SGR.water;
  const s = new THREE.Mesh(sgrWaterGeo(Wd.sea, () => -0.05), sea.material); s.renderOrder = 1; SGR.waterGroup.add(s);
  const cells = new Map(), G = 8000;
  for (const b of Wd.bodies){ const m = b.m; if (!m.V.length) continue; const k = Math.floor((m.V[1]/4 + HALF)/G)*100 + Math.floor((m.V[0]/4 + HALF)/G); let L = cells.get(k); if (!L) cells.set(k, L = []); L.push(b); }
  for (const L of cells.values()){
    let nv = 0, ni = 0; for (const b of L){ nv += b.m.V.length/2; ni += b.m.I.length; }
    const pos = new Float32Array(nv*3), nor = new Float32Array(nv*3), idx = new Uint32Array(ni); let v = 0, o = 0;
    for (const b of L){ const V = b.m.V, I = b.m.I, n = V.length/2; for (let i = 0; i < n; i++){ pos[(v + i)*3] = V[i*2]/4; pos[(v + i)*3 + 1] = b.lv - 0.05; pos[(v + i)*3 + 2] = -V[i*2 + 1]/4; nor[(v + i)*3 + 1] = 1; } for (let i = 0; i < I.length; i++) idx[o++] = I[i] + v; v += n; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setIndex(new THREE.BufferAttribute(idx, 1)); g.computeBoundingSphere();
    const m = new THREE.Mesh(g, sea.material); m.renderOrder = 1; SGR.waterGroup.add(m);
  }
  for (const f of Wd.flat){
    const pier = f.kind === 3, m = new THREE.Mesh(sgrWaterGeo(f.m, pier ? (x, y) => Math.max(1.7, hC(x, y) + 0.35) : (x, y) => hC(x, y) + 0.12), pier ? matSgrPier : f.kind === 2 ? matSgrPool : matSgrPond);
    m.receiveShadow = true; SGR.waterGroup.add(m);
  }
}
