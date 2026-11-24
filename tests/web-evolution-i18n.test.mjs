import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getLocale, message, translateText, localeAudit, formatKoreanTime, formatMessage } from '../projects/web-evolution/i18n.js';

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
  assert.equal(translateText('Return to the ', 'ko'),'다음 페이지로 돌아갑니다: ');
  assert.equal(translateText('관측회 예시 질문은 전시 자료를 사용하고, 다른 천문 검색어는 NASA와 Spaceflight News의 공개 검색 API를 조회합니다.','ko'),'관측회 예시 질문은 전시 자료를 사용하고, 다른 천문 검색어는 NASA와 Spaceflight News의 공개 검색 API를 조회합니다.');
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

test('scenario calendar labels preserve civil dates and Korean ranges', () => {
  assert.equal(translateText('Thursday, November 19, 2026', 'ko'), '2026년 11월 19일 목요일');
  assert.equal(translateText('Friday, November 20, 2026', 'ko'), '2026년 11월 20일 금요일');
  assert.equal(translateText('Sunday, November 22, 2026', 'ko'), '2026년 11월 22일 일요일');
  assert.equal(translateText('FRI, NOV 20', 'ko'), '11월 20일 금요일');
  assert.equal(formatKoreanTime('7:48–7:53 p.m.'), '오후 7시 48분~오후 7시 53분');
  const notice = formatMessage('agent.note.advance', {
    dateKo: '2026년 11월 19일 목요일',
    forecastKo: '맑음.',
    issKo: '오후 7시 48분~오후 7시 53분',
    eventDateKo: '2026년 11월 22일 일요일',
    eventTimeKo: '오후 8시 0분',
  }, 'ko');
  assert.match(notice, /목요일로 이동했습니다/);
  assert.ok(!notice.includes('(으)로'));
  assert.match(notice, /11월 22일 일요일/);
  assert.equal(translateText('5 of 10 results', 'ko'), '검색 결과 10개 중 5개 표시');
});
