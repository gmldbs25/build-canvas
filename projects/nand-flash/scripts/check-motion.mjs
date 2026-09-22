// Optional browser regression runner; supply a locally installed Playwright module and Chromium.
// WORK4_URL=http://localhost:4176/build-canvas/nand-flash/ WORK4_PLAYWRIGHT=/path/to/playwright/index.mjs WORK4_CHROMIUM=/path/to/chrome node projects/nand-flash/scripts/check-motion.mjs
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {scenes} from '../content.mjs';
const {chromium}=await import(process.env.WORK4_PLAYWRIGHT||'playwright');
const browser=await chromium.launch({headless:true,...(process.env.WORK4_CHROMIUM?{executablePath:process.env.WORK4_CHROMIUM}:{})});
const url=process.env.WORK4_URL||'http://localhost:4175/build-canvas/nand-flash/';
const out=process.env.WORK4_QA_OUT||'/tmp/work4-continuous-qa';
await mkdir(out,{recursive:true});
const errors=[],report={};
const index=id=>scenes.findIndex(s=>s.id===id);
const scrub=async(page,position)=>{
  await page.locator('#progress').evaluate((node,value)=>{node.value=value*100;node.dispatchEvent(new Event('input',{bubbles:true}));},position);
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
};
const checkErrors=page=>{page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});};
try {
  const page=await browser.newPage({viewport:{width:1280,height:720}});checkErrors(page);await page.goto(url);
  await page.locator('#play').click();
  const snapshots=[];
  for(let i=0;i<scenes.length;i++){
    await scrub(page,i);assert.equal(await page.locator('.scene').getAttribute('data-scene'),scenes[i].id);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  }
  // Reverse scrolling must not slam an already-open package lid shut at its anchor.
  await scrub(page,3);await page.locator('#play').click();await page.waitForTimeout(3700);await page.locator('#play').click();
  await scrub(page,3.001);const lidBefore=await page.locator('#package-lid').evaluate(node=>new DOMMatrix(getComputedStyle(node).transform).e);
  await scrub(page,2.999);const lidAfter=await page.locator('#package-lid').evaluate(node=>new DOMMatrix(getComputedStyle(node).transform).e);
  assert.ok(lidBefore>1);assert.ok(Math.abs(lidAfter-lidBefore)<1);
  // Dense physical layers survive the semantic handoff and follow forward/reverse input exactly.
  await scrub(page,4.49);
  await page.evaluate(()=>{window.__die=document.querySelector('#graphic-panel svg');window.__plane=document.querySelector('#incoming-panel svg');});
  await scrub(page,4.51);
  assert.ok(await page.evaluate(()=>window.__plane===document.querySelector('#graphic-panel svg')&&window.__die===document.querySelector('#incoming-panel svg')));
  for(const position of [2.1,2.101,2.5,2.99,3,3.4,4.49,4.51,5.1,6.7,7.49,7.51]){
    await scrub(page,position);
    snapshots.push(await page.evaluate(()=>({camera:document.querySelector('#ssd-camera').getAttribute('transform'),panel:document.querySelector('#graphic-panel').style.transform,incoming:document.querySelector('#incoming-panel').style.transform})));
  }
  const reverse=[];
  for(const position of [2.1,2.101,2.5,2.99,3,3.4,4.49,4.51,5.1,6.7,7.49,7.51].reverse()){
    await scrub(page,position);reverse.unshift(await page.evaluate(()=>({camera:document.querySelector('#ssd-camera').getAttribute('transform'),panel:document.querySelector('#graphic-panel').style.transform,incoming:document.querySelector('#incoming-panel').style.transform})));
  }
  assert.deepEqual(reverse,snapshots);assert.notEqual(snapshots[0].camera,snapshots[1].camera);
  await scrub(page,index('read'));await page.locator('#play').click();await page.waitForTimeout(3400);
  const ramp=await page.evaluate(async()=>{
    const root=document.querySelector('#graphic-panel'),marker=root.querySelector('[data-motion="vref-marker"]');
    let additions=0,frames=0,changes=0,last=marker.getAttribute('transform');
    const observer=new MutationObserver(records=>{for(const record of records)if(record.type==='childList')additions+=[...record.addedNodes].filter(node=>node.nodeType===1).length;});observer.observe(root,{subtree:true,childList:true});
    await new Promise(resolve=>{let first;const tick=now=>{first??=now;frames++;const value=marker.getAttribute('transform');if(last!==value)changes++;last=value;if(now-first<1000)requestAnimationFrame(tick);else resolve();};requestAnimationFrame(tick);});
    observer.disconnect();return {frames,changes,additions,stable:marker===root.querySelector('[data-motion="vref-marker"]')};
  });
  assert.equal(ramp.additions,0);assert.ok(ramp.stable);assert.ok(ramp.changes>=ramp.frames-2);report.actualRamp=ramp;
  await page.locator('#play').click();const paused=await page.locator('[data-motion="vref-marker"]').getAttribute('transform');await page.waitForTimeout(250);assert.equal(await page.locator('[data-motion="vref-marker"]').getAttribute('transform'),paused);
  await page.locator('#play').click();await page.waitForTimeout(100);assert.notEqual(await page.locator('[data-motion="vref-marker"]').getAttribute('transform'),paused);
  await page.keyboard.press('Tab');const tabPaused=await page.locator('[data-motion="vref-marker"]').getAttribute('transform');await page.waitForTimeout(100);assert.equal(await page.locator('[data-motion="vref-marker"]').getAttribute('transform'),tabPaused);
  await page.locator('#scene-title').focus();await page.keyboard.press('ArrowRight');await page.waitForFunction(()=>document.querySelector('.scene').dataset.scene==='erase'&&document.activeElement.id==='scene-title');
  await page.keyboard.press('ArrowLeft');await page.waitForFunction(()=>document.querySelector('.scene').dataset.scene==='read'&&document.activeElement.id==='scene-title');
  await page.keyboard.press('o');assert.ok(await page.locator('#toc-dialog').evaluate(node=>node.open));await page.keyboard.press('Escape');assert.ok(!await page.locator('#toc-dialog').evaluate(node=>node.open));
  await page.locator('[data-action="demo-mode"]').click();assert.equal(await page.locator('.scene').getAttribute('data-mode'),'manual');
  await page.locator('[data-range="vref"]').fill('0.95');assert.match(await page.locator('#scene-result').textContent(),/도통 →/);
  await scrub(page,index('ftl'));await page.locator('[data-action="demo-mode"]').click();await page.locator('[data-action="update"]').click();await page.waitForFunction(()=>document.querySelector('#scene-result')&&document.querySelector('.mapping-readout strong')?.textContent==='B0:P3');await page.waitForTimeout(1300);
  await scrub(page,index('gc'));await page.locator('[data-action="demo-mode"]').click();await page.locator('[data-action="gc-start"]').click();await page.waitForFunction(()=>document.querySelector('[data-ppa="B0:P0"]')?.classList.contains('free'));assert.equal(await page.locator('.mapping-readout strong').textContent(),'B1:P2');
  // A wheel interrupts automatic navigation, including its eventual focus transfer.
  await scrub(page,2);await page.locator('#next').click();await page.waitForTimeout(120);await page.mouse.wheel(0,-120);await page.waitForTimeout(160);const interrupted=await page.evaluate(()=>scrollY);await page.waitForTimeout(700);assert.equal(await page.evaluate(()=>scrollY),interrupted);
  const box=await page.locator('#progress').boundingBox();await page.mouse.move(box.x+box.width*.2,box.y);await page.mouse.down();await page.mouse.move(box.x+box.width*.75,box.y,{steps:40});await page.mouse.move(box.x+box.width*.35,box.y,{steps:40});await page.mouse.up();assert.ok(Number(await page.locator('#progress').inputValue())>500);
  await scrub(page,scenes.length-1);await page.locator('#next').click();await page.waitForFunction(()=>document.activeElement.id==='article');await page.locator('#article-computer summary').click();assert.ok(await page.locator('#article-computer details').evaluate(node=>node.open));await page.locator('#article .article-top [data-go="question"]').click();await page.waitForFunction(()=>document.querySelector('.scene').dataset.scene==='question');
  await page.screenshot({path:`${out}/desktop.png`});await page.close();
  report.desktop='22 scenes, physical handoff/reversal, live ramp, pause/resume, keyboard, manual FTL/GC, wheel interruption, scrubber drag, Article passed';

  // Deterministic rAF delivery verifies that application rendering accepts every 8.3/6.9ms callback.
  // This is a cadence contract test, NOT a claim about hardware presentation FPS.
  report.deliveredCadence=[];
  for(const hz of [60,120,144]){
    const p=await browser.newPage({viewport:{width:1280,height:720}});checkErrors(p);
    await p.addInitScript(()=>{let id=0,now=0;const queue=new Map();window.requestAnimationFrame=fn=>{queue.set(++id,fn);return id;};window.cancelAnimationFrame=id=>queue.delete(id);window.__step=delta=>{now+=delta;const callbacks=[...queue.values()];queue.clear();callbacks.forEach(fn=>fn(now));};});
    await p.goto(url);await p.evaluate(()=>window.__step(1));await p.waitForTimeout(100);
    await p.locator('#progress').evaluate((node,i)=>{node.value=i*100;node.dispatchEvent(new Event('input',{bubbles:true}));window.__step(1);},index('read'));await p.waitForTimeout(100);
    const result=await p.evaluate(hz=>{
      window.__step(1);for(let i=0;i<hz*3.4;i++)window.__step(1000/hz);
      const marker=document.querySelector('[data-motion="vref-marker"]'),root=document.querySelector('#graphic-panel');
      const observer=new MutationObserver(()=>{});observer.observe(root,{subtree:true,childList:true});
      let previous=marker.getAttribute('transform'),changes=0;
      for(let i=0;i<hz;i++){window.__step(1000/hz);const next=marker.getAttribute('transform');if(next!==previous)changes++;previous=next;}
      const additions=observer.takeRecords().flatMap(r=>[...r.addedNodes]).filter(n=>n.nodeType===1).length;observer.disconnect();return {hz,changes,additions};
    },hz);
    assert.equal(result.changes,hz);assert.equal(result.additions,0);report.deliveredCadence.push(result);await p.close();
  }
  for(const [width,height] of [[390,844],[320,568]]){
    const p=await browser.newPage({viewport:{width,height},isMobile:true,hasTouch:true});checkErrors(p);await p.goto(url);await p.locator('#play').click();
    for(let i=0;i<scenes.length;i++){await scrub(p,i);assert.equal(await p.locator('.scene').getAttribute('data-scene'),scenes[i].id);assert.ok(await p.locator('.scene').evaluate(node=>node.scrollWidth-node.clientWidth<=1),`${width}: ${scenes[i].id}`);}
    await scrub(p,11);
    const touch=await p.context().newCDPSession(p),x=width/2,startY=height*.7;
    await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y:startY}]});
    for(let step=1;step<=8;step++){await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:startY-step*22}]});await p.waitForTimeout(20);}
    await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(150);
    assert.ok(await p.locator('.scene').evaluate(node=>node.scrollTop)>0,`${width}: touch scroll`);
    await p.screenshot({path:`${out}/mobile-${width}.png`});await p.close();
  }
  report.mobile='390×844 and 320×568: 22 scenes, no horizontal overflow, native touch scroll passed';
  const reduced=await browser.newPage({viewport:{width:1280,height:720},reducedMotion:'reduce'});checkErrors(reduced);await reduced.goto(url);
  for(const id of ['package','program','read','gc','wear','ecc']){
    await scrub(reduced,index(id));assert.ok(await reduced.locator('#play').isDisabled());const before=await reduced.locator('#graphic-panel').innerHTML();await reduced.waitForTimeout(120);assert.equal(await reduced.locator('#graphic-panel').innerHTML(),before);
  }
  await reduced.emulateMedia({reducedMotion:'no-preference'});await reduced.waitForFunction(()=>!document.querySelector('#play').disabled);
  await reduced.emulateMedia({reducedMotion:'reduce'});await reduced.waitForFunction(()=>document.querySelector('#play').disabled);
  await scrub(reduced,index('read'));await reduced.locator('[data-action="demo-mode"]').click();await reduced.locator('[data-range="vref"]').fill('0.95');assert.match(await reduced.locator('#scene-result').textContent(),/도통 →/);
  await reduced.locator('[data-range="vref"]').focus();await reduced.keyboard.press('h');assert.equal(reduced.url(),url);
  await reduced.locator('#scene-title').focus();await reduced.keyboard.press('ArrowLeft');assert.equal(await reduced.locator('.scene').getAttribute('data-scene'),'program');
  await reduced.keyboard.press('h');await reduced.waitForURL(new URL('../',url).href);await reduced.close();report.reduced='static final states, manual experiment, keyboard and H/input guard passed';
  assert.deepEqual(errors,[]);report.errors=errors;
  await writeFile(`${out}/report.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
} finally {await browser.close();}
