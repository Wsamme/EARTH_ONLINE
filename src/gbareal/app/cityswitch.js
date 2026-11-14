// GENERATED from sgreal/app/cityswitch.js by gbareal/tools/mkswitch.py - do not edit
/* ================= v23 / v26 / v37: switch between the real maps (Singapore · SF Bay Area · New York · Hong Kong · Tokyo) =================
   v37: five cities in a 3 + 2 grid. Cities published next to this page (probed once at start) open in place; the others open
   their own artifact (CB_LINKS below, filled in at publish time) in a new tab — each artifact holds only so much data.
   Publishing layout: every artifact has its own city as index.html and the other two cities next to it as sg.html / bay.html /
   nyc.html (e.g. Singapore first: index.html = Singapore, bay.html, nyc.html; New York first: index.html = New York, sg.html, bay.html).
   A button goes to <city>.html in the same folder when it exists (and is not this page), else to index.html when that page is that
   city. Which city a page is: its citybrush-map meta tag in the head (content sg, bay or nyc; patch17 writes it), or for pages built before
   the marker its <title> (New York City / San Francisco Bay Area / the plain Singapore title). Only the first few KB are read.
   The segment is rebuilt here with three buttons in every build (so the two-button HTML of older builds works too) and shown in all
   three builds; the current city is pressed. */
HOOKS.boot.push(() => {
  const CITIES = [
    {id:'sg',  zh:'新加坡',     en:'Singapore',   busy:'正在切换到新加坡… Switching to Singapore'},
    {id:'bay', zh:'旧金山湾区', en:'SF Bay Area', busy:'正在切换到旧金山湾区… Switching to the San Francisco Bay Area'},
    {id:'nyc', zh:'纽约',       en:'New York',    busy:'正在切换到纽约… Switching to New York City'},
    {id:'hk',  zh:'香港',       en:'Hong Kong',   busy:'正在切换到香港… Switching to Hong Kong'},
    {id:'tyo', zh:'东京',       en:'Tokyo',       busy:'正在切换到东京… Switching to Tokyo'},
    {id:'gba', zh:'大湾区',     en:'Greater Bay', busy:'正在切换到大湾区… Switching to the Greater Bay (Dongguan · Shenzhen · Hong Kong)'}];
  // each city's own artifact (opened in a new tab when that city is not published next to this page)
  const CB_LINKS = {sg:'https://claude.ai/artifact/JWrenra2o84JDA2TNcp3kR', bay:'https://claude.ai/artifact/KAqSgP5xdvToctTQQr28kE',
    nyc:'https://claude.ai/artifact/VqyeDs374SMPZAMikpYTos', hk:'https://claude.ai/artifact/46pYczMQtS1PANp9iE91nR', tyo:'https://claude.ai/artifact/PoNpCj8MxrjFFFUxddfzMn', gba:''};
  let cur = 'sg';
  try { if (typeof SGR_NYC !== 'undefined' && SGR_NYC) cur = 'nyc'; else if (typeof SGR_BAY !== 'undefined' && SGR_BAY) cur = 'bay';
    else if (typeof SGR_PATH === 'string' && /^(hk|tyo|gba)data\//.test(SGR_PATH)) cur = SGR_PATH.split('data/')[0]; } catch (e){ cur = 'sg'; }
  const seg = document.querySelector('.cityseg'); if (!seg) return;
  seg.innerHTML = CITIES.map(c => `<button type="button" data-city="${c.id}" aria-pressed="${c.id === cur}" title="${c.zh} ${c.en}">${c.zh}<small>${c.en}</small></button>`).join('');
  seg.style.display = ''; seg.hidden = false; seg.classList.add('city3', 'city6');
  // three buttons in the brand column (~230 px next to the collapse button, on phones too): tighter padding, the English line may clip
  const st = document.createElement('style');
  st.textContent = '.cityseg.city3{max-width:280px}.cityseg.city3 button{padding:6px 3px;min-width:0;white-space:nowrap}' +
    '.cityseg.city3 button small{font-size:9px;letter-spacing:-.02em;overflow:hidden;text-overflow:ellipsis}' +
    '.cityseg.city5{grid-auto-flow:row !important;grid-template-columns:repeat(6,1fr) !important}.cityseg.city5 button{grid-column:span 2}' +
    '.cityseg.city5 button:nth-child(n+4){grid-column:span 3;border-top:1px solid var(--rule)}' +
    '.cityseg.city5 button:not(:nth-child(1)):not(:nth-child(4)){border-left:1px solid var(--rule)}.cityseg.city5 button.ext small::after{content:" ↗"}' +
    '.cityseg.city6{grid-auto-flow:row !important;grid-template-columns:repeat(3,1fr) !important}.cityseg.city6 button:nth-child(n+4){border-top:1px solid var(--rule)}' +
    '.cityseg.city6 button:not(:nth-child(3n+1)){border-left:1px solid var(--rule)}.cityseg.city6 button.ext small::after{content:" ↗"}';
  document.head.appendChild(st);
  // which city a page is: the marker meta, else the title (pages published before the marker)
  const cityOfHead = s => {
    const m = /<meta[^>]+name=["']citybrush-map["'][^>]*>/i.exec(s);
    if (m){ const c = /content=["']([a-z]+)["']/i.exec(m[0]); if (c) return c[1].toLowerCase(); }
    const t = /<title>([^<]*)<\/title>/i.exec(s); if (!t) return null;
    return /New York/i.test(t[1]) ? 'nyc' : /Bay Area/i.test(t[1]) ? 'bay' : /City Brush/i.test(t[1]) ? 'sg' : '?';
  };
  // fetch the head of a page (a range request; servers that ignore it: read the stream only up to the title, then cancel)
  // -> null: not there; '?': there, city unknown; else the city id
  const headCity = async u => {
    let r = null;
    try { r = await fetch(u, {headers:{Range:'bytes=0-8191'}, cache:'no-store'}); } catch (e){ r = null; }
    if (!r || !r.ok){
      if (r && r.status !== 416 && r.status !== 405 && r.status !== 501) return null;
      try { const h = await fetch(u, {method:'HEAD', cache:'no-store'}); return h.ok ? '?' : null; } catch (e){ return null; }
    }
    let s = '';
    try {
      if (r.body && r.body.getReader && typeof TextDecoder !== 'undefined'){
        const rd = r.body.getReader(), dec = new TextDecoder();
        while (s.length < 65536){ const {done, value} = await rd.read(); if (done) break; s += dec.decode(value, {stream:true}); if (/<\/title>/i.test(s)) break; }
        try { rd.cancel(); } catch (e){ /* done */ }
      } else s = (await r.text()).slice(0, 65536);
    } catch (e){ return '?'; }
    return cityOfHead(s) || '?';
  };
  const here = new URL(location.href); here.hash = ''; here.search = '';
  // which cities are next to this page (probed once, in the background): the others link to their own artifact
  const local = {}; const okLink = u => /^https:\/\//.test(u || '');
  const probe = async to => { for (const name of [to + '.html', 'index.html']){ const u = new URL(name, here.href); if (u.pathname === here.pathname) continue;
      const c = await headCity(u.href); if (c === null) continue; if (c === to || (c === '?' && name !== 'index.html')) return u.href; } return null; };
  const probing = Promise.all(CITIES.filter(c => c.id !== cur).map(async c => { local[c.id] = await probe(c.id);
    const b = seg.querySelector(`button[data-city="${c.id}"]`); if (b && !local[c.id] && okLink(CB_LINKS[c.id])) b.classList.add('ext'); }));
  const openExt = to => { const u = CB_LINKS[to]; if (!okLink(u)) return false;
    let w = null; try { w = window.open(u, '_blank', 'noopener'); } catch (e){ w = null; }
    if (!w){ try { window.top.location.href = u; return true; } catch (e){ /* sandboxed */ } }
    showToast(`已在新标签页打开 · Opened in a new tab: ${u}`); return true; };
  for (const b of seg.querySelectorAll('button')){
    b.addEventListener('click', async () => {
      const to = b.dataset.city, C = CITIES.find(c => c.id === to); if (!C || to === cur || b.disabled) return;
      if (to in local){ if (local[to]){ showBusy(C.busy); location.href = local[to]; return; } if (openExt(to)) return; }
      b.disabled = true; showBusy(C.busy);
      for (const name of [to + '.html', 'index.html']){
        const u = new URL(name, here.href);
        if (u.pathname === here.pathname) continue;
        const c = await headCity(u.href);
        if (c === null) continue;
        if (c === to || (c === '?' && name !== 'index.html')){ location.href = u.href; return; }
      }
      b.disabled = false; hideBusy();
      if (!openExt(to)) showToast('这张地图没有和这一页放在一起 · That map is not published next to this page');
    });
  }
  window.SGCity = {cur, cities:CITIES.map(c => c.id), headCity, cityOfHead, links:CB_LINKS, local, probing};
});
