import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { chromium } from 'playwright';

const root=resolve('dist-pages');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg'};
const server=createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const filePath=resolve(root,'.'+pathname);
  if(filePath!==root&&!filePath.startsWith(root+sep)){res.writeHead(403).end();return}
  const file=(await stat(filePath)).isDirectory()?resolve(filePath,'index.html'):filePath;
  const body=await readFile(file);
  res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream'}).end(body);
 }catch{res.writeHead(404).end('Not found')}
});
await new Promise((ok,fail)=>server.listen(4180,'127.0.0.1',err=>err?fail(err):ok()));
await mkdir('work7-quality-captures',{recursive:true});
const browser=await chromium.launch({headless:true});
const baseUrl='http://127.0.0.1:4180/web-evolution/';
const errors=[];
async function choose(page,lang){
 const panel=page.locator('.sidebar-language-options');
 if(await panel.isVisible())await panel.locator('[data-language="'+lang+'"]').click();
 else{await page.locator('#language-compact').click();await page.locator('.language-popover [data-language="'+lang+'"]').click()}
 await page.waitForFunction(l=>document.querySelector('#screen')?.lang===l,lang);
}
try{
 const ctx=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
 const page=await ctx.newPage();
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(baseUrl+'?era=1993&page=home');
 const lead=page.locator('[data-i18n-rich="93.home.lead"]');
 await lead.waitFor();
 const href=await lead.locator('a').getAttribute('href');
 await lead.locator('a').focus();
 const focusCheck=await page.evaluate(async()=>{
  const link=document.querySelector('[data-i18n-rich="93.home.lead"] a');
  const before=link===document.activeElement;
  const i18n=await import('./i18n.js');
  i18n.setLocale('ko');
  return {before,after:link===document.activeElement,linkStillConnected:link.isConnected};
 });
 assert.deepEqual(focusCheck,{before:true,after:true,linkStillConnected:true},'rich translation must preserve active link');
 assert.match(await lead.innerText(),/월드 와이드 웹은/);
 assert.match(await lead.innerText(),/하이퍼텍스트 링크/);
 assert.doesNotMatch(await lead.innerText(),/A document can point/);
 assert.equal(await lead.locator('a').getAttribute('href'),href);
 for(const id of ['93.home.directory','93.home.memo','93.home.lyra']){
  const text=await page.locator('[data-i18n-rich="'+id+'"]').innerText();
  assert.match(text,/[가-힣]/);
  assert.doesNotMatch(text,/observing records|a dated record|working exchange/);
 }
 await page.screenshot({path:'work7-quality-captures/1993-korean.png'});
 await page.locator('[data-i18n-rich="93.home.lead"] a').click();
 await page.waitForURL(/page=guide/);
 assert.match(await page.locator('.mosaic-page h2').innerText(),/링크/);
 await choose(page,'en');
 await page.goto(baseUrl+'?era=1998&page=links');
 await page.locator('[data-i18n-rich="98.links.nasa"]').waitFor();
 await choose(page,'ko');
 assert.match(await page.locator('[data-i18n-rich="98.links.nasa"]').innerText(),/우주 임무 소식/);
 assert.equal(await page.locator('[data-i18n-rich="98.links.nasa"] a').getAttribute('href'),'https://www.nasa.gov/');
 assert.match(await page.getByRole('link',{name:/좋은 사이트를 알고 있니/}).innerText(),/방명록/);
 await page.screenshot({path:'work7-quality-captures/1998-links-korean.png'});
 await page.goto(baseUrl+'?era=2005&page=eclipse-a');
 await page.locator('[data-favorite]').waitFor();
 await choose(page,'ko');
 assert.match(await page.locator('[data-favorite]').innerText(),/즐겨찾기에 추가/);
 await page.locator('[data-favorite]').click();
 assert.match(await page.locator('[data-favorite]').innerText(),/즐겨찾기에 저장됨/);
 await choose(page,'en');
 assert.match(await page.locator('[data-favorite]').innerText(),/In favorites/);
 await page.locator('[data-favorite]').click();
 assert.match(await page.locator('[data-favorite]').innerText(),/Add to favorites/);
 await page.goto(baseUrl+'?era=2013');
 await page.locator('.pace-post .pace-like-count').first().waitFor();
 const firstPost=page.locator('.pace-post').first();
 await firstPost.locator('[data-pace-like]').click();
 await choose(page,'ko');
 assert.match(await firstPost.locator('.pace-like-count').innerText(),/좋아요/);
 await choose(page,'en');
 assert.match(await firstPost.locator('.pace-like-count').innerText(),/likes/);
 await ctx.close();

 // Mock network failures deterministically. Locale switching itself must not refetch sources.
 const apiContext=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
 const apiPage=await apiContext.newPage();
 apiPage.on('pageerror',e=>errors.push(e.message));
 let requests=0;
 await apiPage.route(/(?:images-api\.nasa\.gov|spaceflightnewsapi\.net|api\.open-meteo\.com)/,route=>{
  requests++;
  route.abort('failed');
 });
 await apiPage.goto(baseUrl+'?era=2023&page=live');
 await apiPage.locator('#search-question').fill('Jupiter');
 await apiPage.locator('.search-form button[type=submit]').click();
 await apiPage.locator('.live-search-results[data-live-stage="error"]').waitFor({timeout:10000});
 await choose(apiPage,'ko');
 assert.match(await apiPage.locator('#live-search-status').innerText(),/접근하지 못했습니다|시간 초과/);
 assert.equal(await apiPage.locator('#search-question').inputValue(),'Jupiter');
 const failedRequestCount=requests;
 await choose(apiPage,'en');
 assert.equal(requests,failedRequestCount,'language toggle must not refetch failed sources');
 assert.match(await apiPage.locator('#live-search-status').innerText(),/could not be reached|timed out/);
 await apiPage.goto(baseUrl+'?era=2026&page=home');
 await apiPage.locator('#briefing-preferences').waitFor();
 await apiPage.locator('#briefing-preferences select[name="region"]').selectOption('coast');
 await apiPage.locator('#briefing-preferences button[type="submit"]').click();
 assert.match(await apiPage.locator('.preferences-feedback').innerText(),/Scenario settings updated/);
 let saved=await apiPage.evaluate(()=>JSON.parse(localStorage.getItem('build-canvas:web-evolution:agent-briefing')));
 assert.equal(saved.updateCode,'settings');
 await choose(apiPage,'ko');
 assert.match(await apiPage.locator('.preferences-feedback').innerText(),/시나리오 설정/);
 assert.doesNotMatch(await apiPage.locator('.preferences-feedback').innerText(),/Scenario settings/);
 assert.equal(await apiPage.evaluate(()=>localStorage.getItem('build-canvas:web-evolution:agent-briefing')),JSON.stringify(saved));
 await apiPage.reload();
 await apiPage.locator('.preferences-feedback').waitFor();
 assert.match(await apiPage.locator('.preferences-feedback').innerText(),/시나리오 설정/);
 const details=apiPage.locator('.briefing-scenario');
 if((await details.getAttribute('open'))===null)await details.locator('summary').click();
 await details.locator('[data-agent-action="advance-day"]').click();
 assert.match(await apiPage.locator('#briefing-update-note').innerText(),/ISS 통과 예상 시각/);
 saved=await apiPage.evaluate(()=>JSON.parse(localStorage.getItem('build-canvas:web-evolution:agent-briefing')));
 assert.equal(saved.updateCode,'advance');
 const raw=JSON.stringify(saved);
 await choose(apiPage,'en');
 assert.equal(await apiPage.evaluate(()=>localStorage.getItem('build-canvas:web-evolution:agent-briefing')),raw);
 assert.match(await apiPage.locator('#briefing-update-note').innerText(),/Scenario advanced to/);
 await choose(apiPage,'ko');
 assert.match(await apiPage.locator('#briefing-update-note').innerText(),/오후/);
 await apiPage.screenshot({path:'work7-quality-captures/2026-agent-korean.png'});
 assert.deepEqual(errors,[],'No page errors are allowed during quality QA');
 await apiContext.close();
 console.log('WORK7_QUALITY_QA_PASSED '+JSON.stringify({richLinks:true,languageFocus:true,photoFavorites:true,pacebookLikes:true,liveFailure:true,agentLegacyCompatible:true,errors:errors.length}));
}finally{
 await browser.close();
 await new Promise(ok=>server.close(ok));
}
