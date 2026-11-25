import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';
const url='https://gmldbs25.github.io/build-canvas/web-evolution/';
await mkdir('work7-live-artifacts',{recursive:true});
const browser=await chromium.launch({headless:true});
const report=[];
function routeWithoutLang(value){const url=new URL(value);url.searchParams.delete('lang');return url.href;}
async function setLang(page,lang){
  if(await page.locator('.sidebar-language-options').isVisible()){
    await page.locator('.sidebar-language-options [data-language="'+lang+'"]').click();
  } else {
    await page.locator('#language-compact').click();
    await page.locator('.language-popover [data-language="'+lang+'"]').click();
  }
  await page.waitForFunction(lang=>document.querySelector('#screen')?.lang===lang,lang);
}
try {
  for(const [width,height,label] of [[1440,900,'desktop'],[390,844,'portrait'],[844,390,'landscape']]){
    const ctx=await browser.newContext({viewport:{width,height}});
    const page=await ctx.newPage();
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    const response=await page.goto(url+'?era=1993',{waitUntil:'domcontentloaded'});
    assert.equal(response.status(),200);
    await page.locator('#screen .page-content').waitFor();
    assert.equal(await page.locator('#screen').getAttribute('lang'),'en');
    await page.evaluate(()=>{window.__originalScreen=document.querySelector('#screen');window.__initialURL=location.href;});
    await page.screenshot({path:'work7-live-artifacts/'+label+'-en.png',fullPage:true});
    await setLang(page,'ko');
    assert.equal(await page.evaluate(()=>document.querySelector('#screen')===window.__originalScreen),true);
    assert.equal(routeWithoutLang(page.url()),routeWithoutLang(await page.evaluate(()=>window.__initialURL)));
    assert.equal(new URL(page.url()).searchParams.get('lang'),'ko');
    assert.match(await page.locator('#screen').innerText(),/[가-힣]/);
    await page.screenshot({path:'work7-live-artifacts/'+label+'-ko.png',fullPage:true});
    await page.reload();
    await page.locator('#screen .page-content').waitFor();
    assert.equal(await page.locator('#screen').getAttribute('lang'),'ko');
    await setLang(page,'en');
    const horizontalOverflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
    assert.ok(horizontalOverflow<=3,'horizontal overflow at '+label+': '+horizontalOverflow);
    for(const era of ['1998','2001','2005','2013','2023','2026']){
      const next=await page.goto(url+'?era='+era,{waitUntil:'domcontentloaded'});
      assert.equal(next.status(),200);
      await page.locator('#screen .page-content').waitFor();
      assert.equal(await page.locator('#exhibit-view').getAttribute('data-era'),era);
    }
    assert.equal(errors.length,0,errors.join('; '));
    report.push({label,status:response.status(),eras:7,overflow:horizontalOverflow,locale:'EN->KR->reload->EN'});
    await ctx.close();
  }
  const ctx=await browser.newContext({viewport:{width:1440,height:900}});
  const page=await ctx.newPage();
  await page.goto(url+'?era=2001');
  await page.locator('#classic-search-query').waitFor();
  await setLang(page,'ko');
  await page.locator('#classic-search-query').fill('월식');
  await page.locator('.classic-search-form button[type="submit"]').click();
  await page.locator('.classic-result').first().waitFor({timeout:12000});
  report.push({koreanSearchResults:await page.locator('.classic-result').count()});
  await page.goto(url+'?era=2023');
  await page.locator('#search-question').waitFor();
  const example=await page.locator('#search-question').inputValue();
  assert.ok(example.includes('제임스'),example);
  await page.locator('#search-question').fill('Typed astronomy query');
  await setLang(page,'en');
  assert.equal(await page.locator('#search-question').inputValue(),'Typed astronomy query');
  report.push({korean2023Default:example,customInput:'preserved'});
  await ctx.close();
  console.log('LIVE_WORK7_QA '+JSON.stringify({url,report}));
} finally { await browser.close(); }