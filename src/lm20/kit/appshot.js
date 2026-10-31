/* Portable full-app appshot harness, using sgreal/mktest.py's window.__t.
 * Usage: PAGE=t_bv.html URL=http://127.0.0.1:8047 NEAR=lat,lon,radius
 *   bash src/lm33/kit/browser.sh node src/lm20/kit/appshot.js out '[views]'
 * view = {name,lat,lon,dx,dy,dz,tod,js}; js has access to `t` (__t).
 */
const fs=require('node:fs'),path=require('node:path');
async function getChromium(){let p=process.env.PLAYWRIGHT_CORE||'/tmp/bv/node_modules/playwright-core';try{return require(p).chromium;}catch{throw new Error('Set PLAYWRIGHT_CORE to an installed playwright-core package');}}
async function openApp(options={}){
 const chromium=await getChromium();const browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-gpu-sandbox']});
 const page=await browser.newPage({viewport:{width:1600,height:1000},deviceScaleFactor:1});const errors=[],consoleErrors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',msg=>{if(msg.type()==='error'&&!msg.text().includes('404'))consoleErrors.push(msg.text());});
 const url=new URL(options.page||process.env.PAGE||'t_bv.html',options.url||process.env.URL||'http://127.0.0.1:8047/');url.searchParams.set('view','bv');if(options.near||process.env.NEAR)url.searchParams.set('near',options.near||process.env.NEAR);
 await page.addInitScript(()=>{const raf=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=cb=>raf(t=>{if(!window.__freeze)cb(t);});});
 await page.goto(url.href,{waitUntil:'domcontentloaded',timeout:120000});
 await page.waitForFunction(()=>window.__t?.SGR?.tiles?.size>0&&Object.keys(window.BuonaVista?.stats||{}).length===9,null,{timeout:180000});
 await page.evaluate(()=>{window.__budget=250;window.__t.ev("todPlay=false; if(typeof CLOCK!=='undefined') CLOCK.on=false; controls.enableDamping=false; controls.minPolarAngle=0; controls.maxPolarAngle=Math.PI; controls.maxDistance=100000; controls.minDistance=.01;");});
 let ready=false;for(let i=0;i<180;i++){const state=await page.evaluate(()=>({queue:__t.SGR.queue.length,dirty:__t.SGR.dirty.size,done:[...__t.SGR.tiles.values()].filter(t=>t.done).length}));if(i%15===0)console.log('tiles',state);if(!state.queue&&!state.dirty){ready=true;break;}await page.waitForTimeout(1000);}
 await page.evaluate(()=>{window.__freeze=true;});
 if(!ready)throw new Error('App tile queue did not settle');
 if(errors.length||consoleErrors.length)console.log('APP ERRORS',errors,consoleErrors);
 return {browser,page,errors,consoleErrors};
}
module.exports={openApp};
if(require.main===module)(async()=>{const out=process.argv[2];if(!out)throw new Error('Output directory required');fs.mkdirSync(out,{recursive:true});const views=JSON.parse(process.argv[3]||'[]'),app=await openApp();const {page,browser}=app;const results=[];for(const v of views){const png=await page.evaluate(v=>{const t=window.__t,q=t.sgXY(v.lat,v.lon),y=t.hC(...q);t.setTod(v.tod??13);t.controls.target.set(q[0],y+(v.targetY||30),-q[1]);t.camera.position.set(q[0]+v.dx,y+v.dy,-q[1]+v.dz);t.camera.fov=v.fov||42;t.camera.near=1;t.camera.updateProjectionMatrix();t.controls.update();if(v.js)t.ev(v.js);t.ev("runHooks('frame',1,0);runHooks('prerender',1,0)");t.renderer.render(t.scene,t.camera);return t.renderer.domElement.toDataURL('image/png').split(',')[1];},v);fs.writeFileSync(path.join(out,v.name+'.png'),Buffer.from(png,'base64'));results.push(v.name);}
 const stats=await page.evaluate(()=>({models:BuonaVista.stats,render:__t.renderer.info.render,camera:__t.camera.position.toArray()}));const report={pageErrors:app.errors,consoleErrors:app.consoleErrors,views:results,...stats};fs.writeFileSync(path.join(out,'appshot.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));await browser.close();if(app.errors.length||app.consoleErrors.length)process.exitCode=1;})().catch(e=>{console.error(e);process.exit(1);});
