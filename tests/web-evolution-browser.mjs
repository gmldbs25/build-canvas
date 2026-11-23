import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { chromium } from 'playwright';

const root=resolve('dist-pages');
const types={'.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.ico':'image/x-icon'};
const server=createServer(async (req,res)=>{
  try {
    const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
    const target=resolve(root,'.'+pathname);
    if(target!==root&&!target.startsWith(root+sep)) {res.writeHead(403).end();return;}
    let file=target;
    if((await stat(file)).isDirectory())file=resolve(file,'index.html');
    const data=await readFile(file);
    res.writeHead(200,{'content-type':types[extname(file)]||'application/octet-stream','cache-control':'no-store'}).end(data);
  } catch {res.writeHead(404).end('Not found');}
});
await new Promise((ok,fail)=>server.listen(4179,'127.0.0.1',err=>err?fail(err):ok()));
const browser=await chromium.launch({headless:true});
const baseUrl='http://127.0.0.1:4179/web-evolution/';
const localeKey='build-canvas:web-evolution:locale';
async function choose(page,lang){
  const large=page.locator('.sidebar-language-options');
  if(await large.isVisible())await large.locator('[data-language="'+lang+'"]').click();
  else {
    await page.locator('#language-compact').click();
    await page.locator('.language-popover [data-language="'+lang+'"]').click();
  }
  await page.waitForFunction(l=>document.querySelector('#screen')?.lang===l,lang);
}
const sizes=[[1920,1080],[1600,900],[1440,900],[1366,768],[1280,720],[1024,768],[768,1024],[390,844],[844,390]];
let checked=0;
try {
  for(const [width,height] of sizes){
    const context=await browser.newContext({viewport:{width,height}});
    const page=await context.newPage();
    await page.goto(baseUrl+'?era=1993',{waitUntil:'domcontentloaded'});
    await page.locator('#screen .mosaic-page').waitFor();
    assert.equal(await page.evaluate(k=>localStorage.getItem(k),localeKey),null);
    await page.evaluate(()=>{window.__screenRef=document.querySelector('#screen');window.__originalHref=location.href});
    await choose(page,'ko');
    assert.equal(await page.evaluate(k=>localStorage.getItem(k),localeKey),'ko');
    assert.equal(await page.evaluate(()=>window.__screenRef===document.querySelector('#screen')),true);
    assert.equal(await page.evaluate(()=>window.__originalHref===location.href),true);
    await page.reload({waitUntil:'domcontentloaded'});
    await page.locator('#screen .mosaic-page').waitFor();
    assert.equal(await page.locator('#screen').getAttribute('lang'),'ko');
    await choose(page,'en');
    assert.equal(await page.locator('#screen').getAttribute('lang'),'en');
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
    assert.ok(overflow<=3,'document overflows '+width+'x'+height+' by '+overflow+'px');
    await context.close();
    checked++;
  }
  const context=await browser.newContext({viewport:{width:1600,height:900}});
  const page=await context.newPage();
  await page.goto(baseUrl+'?era=1998&page=guestbook');
  await page.locator('#guestbook-form').waitFor();
  await page.locator('#guestbook-form input[name=name]').fill('Visitor');
  await page.locator('#guestbook-form textarea').fill('Untranslated user text');
  await choose(page,'ko');
  assert.equal(await page.locator('#guestbook-form textarea').inputValue(),'Untranslated user text');
  await page.goto(baseUrl+'?era=2001');
  await page.locator('#classic-search-query').waitFor();
  assert.equal(await page.locator('#classic-search-query').inputValue(),'월식');
  await page.locator('#classic-search-query').fill('월식');
  await page.locator('.classic-search-form button[type=submit]').click();
  await page.locator('.classic-results').waitFor();
  await page.locator('.classic-result').first().waitFor({timeout:7500});
  const searchHref=page.url();
  await choose(page,'en');
  assert.equal(page.url(),searchHref);
  assert.ok((await page.locator('.classic-result').count())>0);
  await page.goto(baseUrl+'?era=2013');
  await page.locator('#pace-status').fill('Draft text stays unchanged');
  await choose(page,'ko');
  assert.equal(await page.locator('#pace-status').inputValue(),'Draft text stays unchanged');
  await page.goto(baseUrl+'?era=2023');
  await page.locator('#search-question').waitFor();
  assert.equal(await page.locator('#search-question').inputValue(),'제임스 웹 우주망원경');
  await page.locator('#search-question').fill('Custom astronomy query');
  await choose(page,'en');
  assert.equal(await page.locator('#search-question').inputValue(),'Custom astronomy query');
  await page.locator('[data-search=both]').click();
  await page.locator('.search-result-shell').waitFor();
  const resultUrl=page.url();
  await choose(page,'ko');
  assert.equal(page.url(),resultUrl);
  await page.goto(baseUrl+'?era=2013&page=poster');
  await page.locator('.poster-editor input[name=title]').fill('Custom saved poster');
  const saved=await page.evaluate(()=>localStorage.getItem('web-evolution-fieldwork-poster-v1'));
  await choose(page,'en');
  assert.equal(await page.locator('.poster-editor input[name=title]').inputValue(),'Custom saved poster');
  assert.equal(await page.evaluate(()=>localStorage.getItem('web-evolution-fieldwork-poster-v1')),saved);
  await page.goto(baseUrl+'?era=2026');
  await page.locator('.briefing-workspace').waitFor();
  let requests=0;
  page.on('request',req=>{if(/spaceflightnewsapi|open-meteo/.test(req.url()))requests++});
  await page.waitForTimeout(250);
  const before=requests;
  const agentSaved=await page.evaluate(()=>localStorage.getItem('build-canvas:web-evolution:agent-briefing'));
  await choose(page,'ko');
  await page.waitForTimeout(400);
  assert.equal(requests,before,'language toggle refetched sources');
  assert.equal(await page.evaluate(()=>localStorage.getItem('build-canvas:web-evolution:agent-briefing')),agentSaved);
  await context.close();
  // Audit every registered exhibit route in the selected Korean locale.
  const routeContext=await browser.newContext({viewport:{width:1440,height:900}});
  const routePage=await routeContext.newPage();
  await routePage.goto(baseUrl+'?era=1993',{waitUntil:'domcontentloaded'});
  await routePage.locator('#screen .page-content').waitFor();
  await choose(routePage,'ko');
  const routes=await routePage.evaluate(async()=>{
    const [history,classic,modern]=await Promise.all([import('./eras.js'),import('./classic-search.js'),import('./modern.js')]);
    const all={...history.eras,'2001':classic.classicSearchEra,...modern.modernEras};
    return Object.entries(all).flatMap(([era,data])=>Object.keys(data.pages).map(page=>({era,page})));
  });
  assert.equal(routes.length,75,'expected all 75 curated pages');
  const untranslated=new Map();
  const englishFragments=new Map();
  for(const {era,page:pageId} of routes){
    await routePage.goto(baseUrl+'?era='+era+'&page='+encodeURIComponent(pageId),{waitUntil:'domcontentloaded'});
    await routePage.locator('#screen .page-content').waitFor();
    assert.equal(await routePage.locator('#screen').getAttribute('lang'),'ko');
    const result=await routePage.evaluate(()=>{
      const root=document.querySelector('#screen .page-content');
      const nodes=[...root.querySelectorAll('h1,h2,h3,p,li,td,th')].filter(n=>!n.closest('[data-no-translate],pre,code,.monitor-news,.live-result-list'));
      const english=nodes.map(n=>n.textContent.trim().replace(/\s+/g,' '))
        .filter(s=>!/[가-힣]/.test(s)&&(/[a-z]+(?:\s+[a-z]+){5,}/i).test(s)).slice(0,3);
      // Detect English fragments within mixed EN/KR paragraphs. A paragraph-level
      // regex misses these because a single Hangul character hides untranslated nodes.
      const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
      const fragments=[];let node;
      while((node=walker.nextNode())){
        const el=node.parentElement;
        if(!el||el.closest('pre,code,[data-no-translate],.monitor-news,.monitor-excerpt,.live-result-list,.live-image-grid,.source-reference-card,.photo-credit,.source-note-check'))continue;
        const s=node.nodeValue.trim().replace(/\\s+/g,' ');
        if(!/[가-힣]/.test(s)&&/(?:\\b[A-Za-z][A-Za-z'’–-]*\\s+){4,}[A-Za-z]/.test(s))fragments.push(s.slice(0,150));
      }
      return {length:root.innerText?.length||root.textContent?.length||0,english,fragments:fragments.slice(0,8)};
    });
    assert.ok(result.length>15,'missing page content at '+era+'/'+pageId);
    if(result.english.length)untranslated.set(era+'/'+pageId,result.english);
    if(result.fragments.length)englishFragments.set(era+'/'+pageId,result.fragments);
  }
  console.log('All 75 Work 7 exhibit routes loaded in Korean mode.');
  const samples=[...untranslated].slice(0,70).map(([route,texts])=>({route,examples:texts.map(t=>t.slice(0,170))}));
  console.log('KOREAN_COPY_REVIEW '+JSON.stringify({routesWithLongEnglishText:untranslated.size,samples}));
  console.log('KOREAN_NODE_REVIEW '+JSON.stringify({routesWithEnglishFragments:englishFragments.size,samples:[...englishFragments].slice(0,40).map(([route,fragments])=>({route,fragments}))}));
  await routeContext.close();

  console.log('Work 7 bilingual browser smoke passed: 9 viewports, guestbook, local search, Pacebook, Orbit Search, poster and agent.');
} finally {
  await browser.close();
  await new Promise(ok=>server.close(ok));
}
