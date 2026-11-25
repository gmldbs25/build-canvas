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
  assert.equal(formatKoreanTime('7:48–7:53 p.m.'), '오후 7시 48분~53분');
  const notice = formatMessage('agent.note.advance', {
    dateKo: '2026년 11월 19일 목요일',
    forecastKo: '맑음.',
    issKo: '오후 7시 48분~53분',
    eventDateKo: '2026년 11월 22일 일요일',
    eventTimeKo: '오후 8시',
  }, 'ko');
  assert.match(notice, /목요일로 이동했습니다/);
  assert.ok(!notice.includes('(으)로'));
  assert.match(notice, /11월 22일 일요일/);
  assert.equal(translateText('5 of 10 results', 'ko'), '검색 결과 10개 중 5개 표시');
});

 test('remaining QA strings localize with dynamic values', () => {
  for (const [source, expected] of [
    ['Nov 30, 2013 · 8:41 am', '2013년 11월 30일 · 오전 8시 41분'],
    ['Reply to Alex', 'Alex님에게 답글 작성'],
    ['Share an update', '소식 공유하기'],
    ['Attach an exhibit photo', '전시 사진 첨부'],
    ['All updates', '모든 소식'],
    ['You', '나'],
    ['Title', '제목'], ['Date', '날짜'], ['Time', '시간'], ['Location', '장소'],
    ['Delivered by', '제공:'], ['Add to plan', '계획에 추가'],
    ['Issued Thursday, November 19, 2026 · 2:00 p.m. local · Simulated bulletin', '발행: 2026년 11월 19일 목요일 · 오후 2시 (현지 시각) · 가상 공지'],
    ['local archive search in progress · step 3 of 4', '로컬 보관 자료 검색 중 · 4단계 중 3단계'],
    ['2 comments', '댓글 2개'], ['See more photos tagged', '태그로 사진 더 보기:'], ['1 of 1', '1개 중 1번째'],
  ]) assert.equal(translateText(source, 'ko'), expected, source);
  assert.equal(formatKoreanTime('8:00 p.m.'), '오후 8시');
  assert.equal(formatKoreanTime('8:58–9:03 p.m.'), '오후 8시 58분~9시 3분');
});


test('final QA localization labels and explicit search messages', () => {
  for (const [en,ko] of [["Fieldwork poster editor ↗","현장 관측 포스터 편집기 ↗"],["Photo credits ↗","사진 출처 ↗"],["Attach a photo","사진 첨부"],["Pacebook home","Pacebook 홈"],["Feed navigation","피드 탐색"],["Your feed","내 피드"],["Filter posts","게시물 필터"],["Discussion","토론"],["Friends and photo credits","친구 및 사진 출처"],["Enlarge photo shared by Alex","Alex님이 공유한 사진 확대"],["Photostream","사진 모음"],["Sets","앨범"],["↑ Upload","↑ 업로드"],["← Community photostream","← 커뮤니티 사진 모음"],["Browse the local index","로컬 색인 둘러보기"],["Example:","예시:"],["Search index sections","검색 색인 섹션"],["Keep","유지"],["Open notice →","공지 열기 →"],["SPACE RESEARCH + IMAGES","우주 연구 및 이미지"],["Source: NASA · Webb image release","출처: NASA · 웹 망원경 이미지 공개"],["OPTIONAL / 2013 FIELDWORK POSTER","선택 사항 / 2013 현장 관측 포스터"],["Observatory pages","천문대 페이지"],["Briefing settings and selected plan","브리핑 설정 및 선택한 계획"],["Zoom","확대"],["Open photo source ↗","사진 원본 열기 ↗"],["Photo","사진"],["Orbit Room pages","Orbit Room 페이지"],["Answer generation progress","답변 생성 진행률"],["Search navigation","검색 탐색"],["Checked Fri, Nov 20 · 2:00 p.m. local","확인: 11월 20일 금요일 · 오후 2시 (현지 시각)"]]) assert.equal(translateText(en,'ko'),ko,en);
  for (const topic of ['time','place','both']) for (const key of ['firstTitle','secondTitle','firstSnippet','secondSnippet']) assert.doesNotMatch(formatMessage('23.results.'+topic+'.'+key,{},'ko'),/[A-Za-z]/);
});
