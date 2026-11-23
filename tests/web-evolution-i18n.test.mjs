import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getLocale, message, translateText, localeAudit } from '../projects/web-evolution/i18n.js';

test('locale starts in English without browser storage',()=>{
  assert.equal(getLocale(),'en');
  assert.ok(localeAudit().catalogKeys>=300);
});
test('seven eras have bilingual route labels and stable nontranslatable names',()=>{
  for(const era of ['1993','1998','2001','2005','2013','2023','2026']){
    assert.ok(message('sidebar.era.'+era,'en'));
    assert.ok(message('sidebar.era.'+era,'ko'));
  }
  assert.equal(message('era.1998.pages.home.title','en'),'The Orbit Room');
  assert.equal(translateText('Search results','ko'),'검색 결과');
});
test('locale selection cannot call a page renderer or change the browser route',()=>{
  const source=readFileSync(new URL('../projects/web-evolution/main.js',import.meta.url),'utf8');
  assert.match(source,/subscribeLocale\(syncLanguageUI\)/);
  const start=source.indexOf('function syncLanguageUI()');
  const stop=source.indexOf('function syncNotesLanguage()',start);
  const segment=source.slice(start,stop);
  for(const call of ['renderPageBody(', 'renderPage(', 'goTo(', 'selectEra(', 'replaceExhibitState(', 'pushExhibitState(', 'updateSchedule(']){
    assert.ok(!segment.includes(call),'locale toggle must not invoke '+call);
  }
});
test('2023 default English, Korean examples and old user query remain independently representable',()=>{
  const source=readFileSync(new URL('../projects/web-evolution/modern.js',import.meta.url),'utf8');
  assert.match(source,/defaultLiveQuestion = 'James Webb Space Telescope'/);
  assert.match(source,/koreanQuestions =/);
  assert.match(source,/getLocale\(\)/);
});
test('user-generated fields are explicitly protected',()=>{
  const root='projects/web-evolution/';
  const source=['main.js','pacebook.js','photo.js','poster.js'].map(f=>readFileSync(new URL('../'+root+f,import.meta.url),'utf8')).join('\n');
  assert.match(source,/data-no-translate/);
});
