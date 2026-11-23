(function initializeInteractiveReading() {
  const root=document.querySelector('#intro-view');
  if (!root) return;
  const glossary = {
    cern: ['CERN · 유럽입자물리연구소','스위스 제네바 인근에 있는 국제 입자물리 연구기관입니다. 팀 버너스리는 이곳에서 연구 정보를 공유하기 위한 웹을 제안했습니다.'],
    hypertext: ['하이퍼텍스트 · 링크로 이어지는 문서','글 속의 링크를 선택해 다른 문서로 이동할 수 있는 방식입니다. 웹은 문서를 한곳에 모으지 않아도 서로 연결할 수 있도록 했습니다.'],
    mosaic: ['NCSA Mosaic · 그래픽 웹 브라우저','1993년 NCSA에서 개발한 브라우저입니다. 텍스트와 이미지를 같은 화면에서 볼 수 있게 해 초기 웹을 더 친숙하게 만들었습니다.'],
    geocities: ['GeoCities · 가상 동네 속 홈페이지','1990년대 사람들이 주제별 온라인 동네에 개인 홈페이지를 만들던 서비스입니다. 개인의 취향과 관심사를 웹에 표현하는 문화를 보여 줍니다.'],
    webring: ['웹링 · 취미 사이트의 이웃 링크','비슷한 주제의 개인 홈페이지들이 다음·이전 사이트로 연결되던 방식입니다. 검색어를 몰라도 이웃의 링크를 따라 새로운 페이지를 발견할 수 있었습니다.'],
    pagerank: ['PageRank · 링크 관계로 평가하는 중요도','웹페이지를 가리키는 다른 페이지들과 그 연결 구조를 분석해 상대적인 중요도를 계산하는 방법입니다. 단순 링크 개수만 세는 방식은 아니며, 검색 순위가 이것만으로 결정되지도 않습니다.'],
    web2: ['Web 2.0 · 참여 중심의 웹','사람들이 게시하고 댓글을 달고 협업하면서 서비스의 가치를 함께 만드는 웹의 흐름을 가리키는 말입니다. 하루아침에 새 웹 표준이 기존 표준을 대체했다는 뜻은 아닙니다.'],
    ajax: ['AJAX · 화면 일부만 갱신하는 방식','웹페이지 전체를 다시 불러오지 않고 서버에 필요한 데이터를 요청해 일부 화면만 바꿀 수 있는 개발 방식입니다. 웹이 앱처럼 반응하는 데 활용됐습니다.'],
    commoncrawl: ['Common Crawl · 공개 웹 수집 프로젝트','자동화된 프로그램으로 접근 가능한 웹페이지 일부를 정해진 시점에 수집하고 보존하는 프로젝트입니다. 공개 웹의 모든 페이지를 담는 것은 아닙니다.'],
    dataset: ['데이터셋 · 한 용도로 모은 자료 묶음','특정 분석이나 학습을 위해 자료를 모아 정리한 집합입니다. 웹에서 수집했다는 사실만으로 어느 AI 모델의 학습 데이터셋에 포함되는 것은 아닙니다.'],
    languagemodel: ['언어 모델 · 글의 패턴을 학습한 모델','앞뒤 문맥을 바탕으로 다음에 올 말이나 토큰을 예측하도록 학습한 AI 모델입니다. 웹페이지 주소 목록을 그대로 검색하는 시스템과는 다른 방식으로 작동합니다.'],
    token: ['토큰 · 모델이 처리하는 글의 단위','AI가 문장을 처리할 때 나누는 작은 단위입니다. 단어 하나일 수도 있고 단어의 일부나 문장부호일 수도 있습니다.'],
    weights: ['모델 가중치 · 학습으로 조정되는 수치','모델 안에서 입력 정보를 처리하는 방식을 결정하는 여러 수치입니다. 학습 중 예측 오류를 줄이도록 조정되며, 문서 주소를 정리한 검색 색인과는 다릅니다.'],
    pretrain: ['사전학습 · 기본 언어 능력을 익히는 과정','모델이 많은 예시에서 패턴을 배우도록 가중치를 조정하는 단계입니다. 답변할 때 검색 도구로 최신 웹페이지를 조회하는 일과는 구별됩니다.'],
    sge: ['SGE · 검색에서 생성형 답변을 보여 준 실험','Search Generative Experience의 줄임말입니다. Google이 2023년 Search Labs에서 검색 결과에 AI가 만든 개요를 보여 주려고 시작한 실험입니다.'],
    agent: ['AI 에이전트 · 도구를 이용해 일을 이어 가는 AI','질문에 글로 답하는 데서 나아가, 허용된 도구로 자료를 찾거나 여러 단계의 작업을 수행하는 시스템입니다. 실제 결제나 게시 같은 행동은 권한과 사용자 승인 조건을 따져야 합니다.']
  };
  const triggers=[...root.querySelectorAll('button[data-glossary]')];
  if (!triggers.length) return;
  const bubble=document.createElement('div');
  bubble.id='reading-tooltip';
  bubble.className='reading-tooltip';
  bubble.hidden=true;
  bubble.innerHTML='<div class="reading-tooltip-head"><strong data-reading-title></strong><button type="button" class="reading-tooltip-close" aria-label="설명 닫기">×</button></div><p data-reading-copy></p>';
  document.body.append(bubble);
  let active=null,pinned=false,focusReturn=null;
  const title=bubble.querySelector('[data-reading-title]');
  const copy=bubble.querySelector('[data-reading-copy]');
  const closeButton=bubble.querySelector('.reading-tooltip-close');
  function positionBubble(){
    if (!active || bubble.hidden) return;
    const rect=active.getBoundingClientRect();
    if (rect.bottom<0 || rect.top>window.innerHeight){hideBubble();return;}
    if (window.matchMedia('(max-width: 600px)').matches) {
      bubble.style.left='12px';bubble.style.right='12px';bubble.style.top='auto';bubble.style.bottom='12px';return;
    }
    bubble.style.bottom='auto';bubble.style.right='auto';
    const width=Math.min(360,window.innerWidth-24);
    bubble.style.width=width+'px';
    const left=Math.max(12,Math.min(rect.left,window.innerWidth-width-12));
    const approxHeight=bubble.offsetHeight||150;
    const top=rect.bottom+12+approxHeight < window.innerHeight-8 ? rect.bottom+9 : Math.max(12,rect.top-approxHeight-9);
    bubble.style.left=left+'px';bubble.style.top=top+'px';
  }
  function hideBubble(restoreFocus=false){
    if(active){
      active.setAttribute('aria-expanded','false');
      active.removeAttribute('aria-describedby');
    }
    const old=active;active=null;pinned=false;bubble.hidden=true;
    bubble.classList.remove('is-pinned');
    if(restoreFocus && old?.isConnected) old.focus({preventScroll:true});
  }
  function showBubble(trigger,hold=false){
    const data=glossary[trigger.dataset.glossary];
    if(!data)return;
    if(active && active!==trigger)hideBubble();
    active=trigger;pinned=hold;
    title.textContent=data[0];copy.textContent=data[1];
    bubble.hidden=false;bubble.classList.toggle('is-pinned',pinned);
    bubble.setAttribute('role',pinned?'dialog':'tooltip');
    if(pinned)bubble.setAttribute('aria-label',data[0]);
    else bubble.removeAttribute('aria-label');
    trigger.setAttribute('aria-expanded',String(pinned));
    trigger.setAttribute('aria-describedby','reading-tooltip');
    requestAnimationFrame(positionBubble);
  }
  for(const trigger of triggers){
    trigger.setAttribute('aria-controls','reading-tooltip');
    trigger.setAttribute('aria-expanded','false');
    trigger.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse'&&!pinned)showBubble(trigger);});
    trigger.addEventListener('pointerleave',()=>{if(!pinned&&active===trigger)hideBubble();});
    trigger.addEventListener('focus',()=>{if(!pinned)showBubble(trigger);});
    trigger.addEventListener('blur',()=>{if(!pinned&&active===trigger)hideBubble();});
    trigger.addEventListener('click',event=>{
      event.stopPropagation();
      if(active===trigger&&pinned){hideBubble();return;}
      showBubble(trigger,true);
    });
  }
  closeButton.addEventListener('click',()=>hideBubble(true));
  bubble.addEventListener('click',event=>event.stopPropagation());
  document.addEventListener('click',event=>{if(pinned&&!bubble.contains(event.target)&&!active?.contains(event.target))hideBubble();});
  const detail=document.querySelector('#reading-detail');
  let detailInvoker=null;
  const wide=window.matchMedia('(min-width: 1800px) and (min-height: 740px)');
  function closeDetail(){if(detail?.open)detail.close();}
  if(detail){
    const opener=root.querySelector('[data-reading-detail="pagerank"]');
    const slot=detail.querySelector('[data-reading-diagram]');
    const source=root.querySelector('#pagerank-explainer svg');
    if(opener&&slot&&source){
      const graphic=source.cloneNode(true);
      graphic.removeAttribute('aria-labelledby');
      graphic.setAttribute('aria-label','페이지 A와 B가 C를, C와 B가 D를 가리키는 링크 관계 예시');
      graphic.querySelectorAll('[id]').forEach(item=>{item.id += '-detail';});
      graphic.querySelectorAll('[marker-end]').forEach(item=>item.setAttribute('marker-end','url(#pagerank-arrow-detail)'));
      slot.append(graphic);
      opener.hidden=false;
      opener.addEventListener('click',()=>{
        hideBubble();
        detailInvoker=opener;
        if(wide.matches)detail.show();
        else detail.showModal();
        detail.querySelector('[data-reading-close]').focus({preventScroll:true});
      });
      detail.querySelector('[data-reading-close]').addEventListener('click',closeDetail);
      detail.addEventListener('close',()=>{if(detailInvoker?.isConnected)detailInvoker.focus({preventScroll:true});});
      detail.addEventListener('click',event=>{
        if(!detail.open||wide.matches)return;
        const r=detail.getBoundingClientRect();
        if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeDetail();
      });
      wide.addEventListener('change',()=>{if(detail.open)closeDetail();});
    }
  }
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&pinned){event.preventDefault();hideBubble(true);}
  });
  window.addEventListener('scroll',()=>{
    if(!pinned)hideBubble();
    else positionBubble();
  },{passive:true});
  window.addEventListener('resize',()=>{if(active)positionBubble();},{passive:true});
  window.addEventListener('hashchange',()=>{hideBubble();closeDetail();});
  window.addEventListener('popstate',()=>{hideBubble();closeDetail();});
  const observer=new MutationObserver(()=>{if(root.hidden){hideBubble();closeDetail();}});
  observer.observe(root,{attributes:true,attributeFilter:['hidden']});
  root.classList.add('reading-enhanced');
})();
