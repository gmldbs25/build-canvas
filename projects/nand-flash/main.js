import { scenes, sceneIndex, sceneLearning, hierarchy, hierarchyScenes, articleSections, writeSteps, writeNotes, readSteps, readNotes, retrySteps, retryNotes } from './content.mjs';
import { clamp, lerp, smooth, timeline, sceneOffsets, positionAt, distanceAt, createFlash, planWrite, programWrite, commitWrite, planGc, copyGc, mapGc, eraseGc, encode, decode, sampleBits, wearCycle } from './model.mjs';
import { computerDiagram, dieDiagram, blockDiagram, pageDiagram, cellDiagram, densityDiagram, eraseDiagram, mappingDiagram, wearDiagram, eccDiagram, flowDiagram } from './diagrams.mjs';
import {createDemo, sampleDemo, observationNotes} from './demos.mjs';
import {bindMotion} from './motion.mjs';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const reduced=matchMedia('(prefers-reduced-motion: reduce)'), compact=matchMedia('(max-width: 900px), (max-aspect-ratio: 1/1)');
const state={
  documentPhase:0,power:true,opened:false,charge:0,pulsing:false,vref:.5,bits:1,
  selectedPage:3,erasePages:Array(8).fill('used'),eraseMessage:'Page를 선택하고 Program을 시도해 보세요.',eraseEffect:'',
  flash:createFlash(),lba:100,flashMessage:'LBA를 선택하면 현재 물리 위치가 연결됩니다.',writePlan:null,writePhase:'idle',gcPlan:null,gcPhase:'idle',busy:false,
  wearCounts:[2,3,1,2,0,1],balanced:false,badBlock:-1,lastWear:-1,drift:0,disturb:false,
  eccBits:encode(),eccResult:null,eccMessage:'bit 하나를 뒤집고 ECC를 실행해 보세요.',eccSample:false,retried:false,
  flowStep:-1,retry:false,flowFlash:createFlash(),flowPlan:null,readExample:10,sceneId:'question',compact:compact.matches,
};
const count=scenes.length,offsets=sceneOffsets(scenes.map(s=>s.length)),holds=scenes.map(s=>s.hold);
let current=-1,position=0,frameQueued=false,scrollDirty=true,playRaf=0,animationToken=0,initialized=false;
let manual=false,paused=false,focusPaused=false,demoFrames=[],demoFrame=null,demoElapsed=0,demoLastTime=0;
const visibleState=()=>!manual&&demoFrame?{...state,...demoFrame.patch}:state;
let height=innerHeight,transaction=null,pulseTimer=0,effectTimer=0;
const story=$('#story'),scene=$('.scene'),guide=$('.scene-guide'),panel=$('#graphic-panel'),incoming=$('#incoming-panel'),dialog=$('#toc-dialog');
let motion=null,geometryDirty=false,storyHeight=0,scrollState=null,motionReduced=reduced.matches;
const viewport=$('.viewport'),figure=$('#ssd-figure'),camera=$('#ssd-camera'),lid=$('#package-lid'),lidOutline=lid.querySelectorAll('rect')[1],lidLabel=lid.querySelector('text');
const nand=$('#nand-target'),interior=$('#package-interior'),dies=$('#die-stack'),progress=$('#progress'),scaleMarker=$('.scale-marker');
const contextNodes=['#pcb','#controller-141','#nand-352','#nand-716','#ground-shadow'].map($);
const hierarchyNode=$('.hierarchy'),scaleNode=$('.scale'),intro=$('.intro'),bridge=$('.scene-bridge');
const visibility=new Map([[panel,false],[figure,false]]);
const observer=new IntersectionObserver(entries=>{for(const entry of entries)visibility.set(entry.target,entry.isIntersecting);wakeDemo();},{rootMargin:'-95px 0px -95px 0px'});
observer.observe(panel);observer.observe(figure);
const homeUrl=new URL('../',window.location.href), idNow=()=>scenes[current]?.id;
const indexOf=id=>typeof id==='number'?id:sceneIndex(id);
$('.identity').href=homeUrl.href;$('.home-link').href=homeUrl.href;
$('.hierarchy ol').innerHTML=hierarchy.map((name,i)=>`<li><button data-go="${hierarchyScenes[i]}">${name}</button></li>`).join('');
const hierarchyItems=$$('.hierarchy li');
$('#scene-toc').innerHTML=scenes.map((s,i)=>`<button data-go="${s.id}"><span>${String(i+1).padStart(2,'0')}</span><strong>${s.title.replaceAll('<br>',' ')}</strong><small>${s.part}</small></button>`).join('');
$('#article-toc').innerHTML=articleSections.map(([id,title])=>`<a href="#article-${id}">${title}</a>`).join('');
progress.step=".01";progress.max=(count-1)*100;$('.scene-count').textContent=` / ${count}`;
const btn=(label,action,primary=false,attrs='')=>`<button data-action="${action}" class="${primary?'primary-button':'text-button'}" ${attrs}>${label}</button>`;
const toggle=(values,key,selected,label)=>`<div class="segmented" role="group" aria-label="${label}">${values.map(([value,name])=>btn(name,`${key}:${value}`,false,`aria-pressed="${String(selected)===String(value)}"`)).join('')}</div>`;
const range=(key,label,min,max,value,step=1)=>`<label class="control-range"><span>${label} <output>${Number(value).toFixed(2)}</output></span><input type="range" data-range="${key}" min="${min}" max="${max}" step="${step}" value="${value}" aria-label="${label}"></label>`;
function manualControls(id) {
  switch(id) {
    case 'question':return btn(['문서 저장하기','저장 후 정상 종료','컴퓨터 다시 켜기','다시 해보기'][state.documentPhase],'document',true)+ (state.documentPhase===3?btn('기억이 남은 곳으로 →','go:storage'): '');
    case 'storage':return btn('SSD를 따라가기 →','go:ssd',true);
    case 'ssd':return btn('NAND Package로 들어가기 →','go:package',true);
    case 'package':return btn(state.opened?'덮개 닫기':'내부 살펴보기','lid',true)+btn('Die로 들어가기 →','go:die');
    case 'die':return btn('Plane으로 들어가기 →','go:plane',true);
    case 'plane':return btn('Block으로 들어가기 →','go:block',true);
    case 'block':return btn('Page로 들어가기 →','go:page',true);
    case 'page':return btn('Cell로 들어가기 →','go:cell',true)+btn('논리 Page와 Cell의 관계 ↗','article:structure');
    case 'cell':return toggle([[2,'전하가 적은 상태'],[8,'전하가 많은 상태']],'charge',state.charge,'저장 전하 상태')+btn(state.power?'전원 끄기':'전원 켜기','power',true);
    case 'density':return toggle([[1,'SLC · 1 bit'],[2,'MLC · 2 bit'],[3,'TLC · 3 bit'],[4,'QLC · 4 bit']],'bits',state.bits,'Cell당 bit 수');
    case 'program':return btn(state.charge>=10?'목표 상태에 도착':'Program 펄스 가하기','pulse',true,`aria-disabled="${state.charge>=10}"`)+btn('지워진 상태로 초기화','cell-reset');
    case 'read':return range('vref','기준 전압 Vref · 상대값',.05,.95,state.vref,.01)+toggle([[0,'지워진 Cell'],[10,'Program된 Cell'],...(![0,10].includes(state.readExample)?[[state.readExample,'직전 Program 상태']]:[])],'charge',state.charge,'읽을 Cell의 상태');
    case 'erase':return btn('선택한 Page Read','page-read')+btn('선택한 Page Program','page-program',true)+btn('Block 전체 Erase','block-erase')+btn('초기화','erase-reset');
    case 'address':return btn('LBA 100 수정해 보기 →','go:ftl',true);
    case 'ftl':return btn(state.busy?'수정 중…':'LBA 100의 데이터 수정','update',true)+btn('초기화','flash-reset')+btn('쓸 공간을 되찾으려면 →','go:gc');
    case 'gc':{const ready=state.flash.blocks.some(b=>b.pages.some(p=>p.state==='invalid'));return btn(state.busy?'GC 진행 중…':ready?'GC 실행':'먼저 LBA 100 수정','gc-start',true)+btn('LBA 100 다시 수정','update')+btn('초기화','flash-reset');}
    case 'wear':return toggle([[0,'분산 끄기'],[1,'분산 켜기']],'balanced',Number(state.balanced),'Wear Leveling')+btn('P/E Cycle 6회 실행','wear',true)+btn(state.badBlock<0?'B0를 Bad Block으로 제외':'제외 해제','bad')+btn('초기화','wear-reset');
    case 'reliability':return toggle([[0,'시간 경과 · Retention'],[1,'반복 읽기 · Read Disturb']],'disturb',Number(state.disturb),'상태 변화 원인')+range('drift','상태 변화 정도',0,1,state.drift,.01);
    case 'ecc':return btn('ECC로 확인·복구','ecc',true)+btn('전압 판정 오류 예시','read-errors')+btn('Read Retry','retry')+btn('초기화','ecc-reset');
    case 'write':return btn(state.flowStep<0?'Write 시작':state.flowStep<writeSteps.length-1?'다음 단계 →':'Write 다시 보기','flow-next',true)+btn('처음 단계로','flow-reset');
    case 'read-flow':return btn(state.flowStep<0?'Read 시작':state.flowStep<(state.retry?retrySteps:readSteps).length-1?'다음 단계 →':'Read 다시 보기','flow-next',true)+toggle([[0,'일반 Read'],[1,'Retry 포함']],'retry-path',Number(state.retry),'읽기 경로');
    case 'ending':return btn('기억의 원리를 더 자세히 ↗','article',true)+btn('처음부터 다시','go:question');
    default:return '';
  }
}
function controls(id) {
  if(!demoFrames.length)return id==='ending'?manualControls(id):'';
  return btn(manual?'자동으로 보기':'직접 살펴보기', 'demo-mode', false, `aria-expanded="${manual}"`)
    +(manual?manualControls(id):'');
}
function diagram(index) {
  const {id,object}=scenes[index];
  const preview=index===current?[]:createDemo(id),initial=preview.length?sampleDemo(preview,reduced.matches?preview.reduce((sum,f)=>sum+f.duration,0)-1:0)?.patch:{};
  const state=index===current?visibleState():{...visibleState(),...initial},s={...state,sceneId:id};
  switch(object) {
    case 'computer':return computerDiagram(s,id);
    case 'structure':return id==='die'||id==='plane'?dieDiagram(id==='plane'):id==='block'?blockDiagram():pageDiagram(s.compact);
    case 'cell':return cellDiagram(s,id);
    case 'density':return densityDiagram(state.bits,0,false,state.compact);
    case 'erase':return eraseDiagram(s);
    case 'mapping':return mappingDiagram(s);
    case 'wear':return wearDiagram(s);
    case 'reliability':return densityDiagram(3,state.drift,state.disturb,state.compact);
    case 'ecc':return eccDiagram(s);
    case 'flow':return flowDiagram(id==='write'?writeSteps:state.retry?retrySteps:readSteps,state.flowStep,id==='write',s);
    default:return '';
  }
}
// Preserve stable nodes while values change: focus, bars and curves can move continuously.
function patchNode(old,fresh) {
  if(!old||old.nodeType!==fresh.nodeType||old.nodeName!==fresh.nodeName){old?.replaceWith(fresh.cloneNode(true));return;}
  if(old.nodeType===Node.TEXT_NODE){if(old.nodeValue!==fresh.nodeValue)old.nodeValue=fresh.nodeValue;return;}
  if(old.nodeType!==Node.ELEMENT_NODE)return;
  for(const a of [...old.attributes])if(!fresh.hasAttribute(a.name))old.removeAttribute(a.name);
  for(const a of [...fresh.attributes])if(old.getAttribute(a.name)!==a.value)old.setAttribute(a.name,a.value);
  const next=[...fresh.childNodes],previous=[...old.childNodes];
  next.forEach((n,i)=>previous[i]?patchNode(previous[i],n):old.appendChild(n.cloneNode(true)));
  previous.slice(next.length).forEach(n=>n.remove());
}
function labelGraphic(target,index) {
  target.dataset.index=index;target.dataset.object=scenes[index].object;target.dataset.layout=scenes[index].layout;
}
function paintGraphic(replace=false) {
  const stable=scenes[current].object==='structure'&&panel.dataset.index===String(current)&&!replace;
  if(!stable){
    const html=diagram(current);
    if(replace||!panel.firstChild)panel.innerHTML=html;
    else {const template=document.createElement('template');template.innerHTML=html;patchNode(panel.firstChild,template.content.firstChild);}
  }
  labelGraphic(panel,current);prepareGraphic();
  motion=bindMotion(panel,idNow());geometryDirty=true;
  motion.paint(visibleState(),manual||reduced.matches?null:demoFrame,demoElapsed);queueFrame();
}
function prepareGraphic() {
  // Repeated narration stays visual; manual experiments keep their live results.
  panel.querySelectorAll('[role="status"]').forEach(el=>el.setAttribute('aria-live',manual?'polite':'off'));
  if(!manual&&demoFrames.length)panel.querySelectorAll('[data-action]').forEach(el=>{
    el.setAttribute('tabindex','-1');el.setAttribute('aria-disabled','true');
  });
}
function result() {
  const state=visibleState();
  const id=idNow();let message='';
  if(id==='question')message=['직접 저장하고 전원을 꺼보세요.','저장장치에 기록을 마쳤습니다. 이제 정상 종료해 보세요.','전기가 없어졌는데, 이 정보는 어디에 남아 있을까요?','전원 없이도 남는 기억을 찾아갑니다.'][state.documentPhase];
  if(id==='storage')message='저장과 정상 종료를 마친 예시입니다. 갑작스러운 전원 차단과 캐시는 Article에서 설명합니다.';
  if(id==='page')message='TLC / QLC에서는 같은 Cell 집합이 여러 논리 Page의 bit를 함께 표현합니다.';
  if(id==='cell')message=state.power?'0과 1은 글자가 아니라, 물리적 상태를 해석한 값입니다.':'전원을 꺼도 전하와 Vth 차이는 남습니다. 영구 보존을 뜻하지는 않습니다.';
  if(id==='density')message=`Cell당 ${state.bits} bit · ${2**state.bits}개 상태 · ${state.bits===1?'넓은 판정 여유':'더 높은 밀도와 더 정밀한 오류 관리'}`;
  if(id==='program')message=state.charge>=10?'확인 완료 · 목표 Vth 구간에 도착했습니다.':'펄스 → 전하 이동 → Vth 확인. 목표에 도달할 때까지 반복합니다.';
  if(id==='read')message=state.vref>.2+state.charge*.055?'Vref > Vth · 도통 → 이 SLC 예시에서는 1로 판정':'Vref ≤ Vth · 비도통 → 이 SLC 예시에서는 0으로 판정';
  if(id==='erase')message='그렇다면, 다른 데이터는 지우지 않고 파일만 수정하려면?';
  if(['address','ftl','gc'].includes(id))message=compact.matches?'LBA 1개 ↔ Page 1개로 줄인 교육 모델':'LBA 한 개 ↔ Page 한 개로 줄인 교육 모델 · Invalid는 아직 지워지지 않은 데이터입니다.';
  if(id==='reliability')message=state.disturb?'반복 읽기 전압은 같은 String의 선택되지 않은 Cell에도 영향을 줄 수 있습니다.':'저장 전하는 시간이 지나면서 변할 수 있습니다. 그래프는 실제 수명이나 측정값이 아닙니다.';
  if(id==='ecc')message=state.eccSample?'Read Retry는 판정 기준을 바꿉니다. 저장된 전하는 바꾸지 않습니다.':'bit를 직접 뒤집어 1 bit 복구와 2 bit 검출을 비교하세요.';
  if(id==='write'&&state.flowStep>=0)message=writeNotes[state.flowStep];
  if(id==='read-flow'&&state.flowStep>=0)message=(state.retry?retryNotes:readNotes)[state.flowStep];
  if(id==='ending')message='컴퓨터 → SSD → NAND → Cell → Software → 컴퓨터';
  if($('#scene-result').textContent!==message)$('#scene-result').textContent=message;
  $('#scene-result').setAttribute('aria-live',manual?'polite':'off');
}
function guidance() {
  paintDemoProgress();
  $('.guide-label').textContent=manual?'직접 해보기':demoFrame?`${demoFrame.index+1} / ${demoFrame.total}`:'살펴보기';
  if(!manual){$('#guide-instruction').textContent=demoFrame?.caption||observationNotes[idNow()]||scenes[current].next;return;}
  const id=idNow();let hint=sceneLearning[id][1];
  if(id==='question')hint=[hint,'같은 버튼으로 정상 종료하세요. 저장한 문서는 어디에 남을까요?','컴퓨터를 다시 켜서 기억.txt가 남아 있는지 확인하세요.','문서가 돌아왔습니다. 이제 기억이 남아 있는 SSD를 따라갑니다.'][state.documentPhase];
  if(id==='package'&&state.opened)hint='덮개 아래의 Die 또는 “Die로 들어가기” 버튼을 누르세요.';
  if(id==='program'&&state.charge>=10)hint='목표에 도착했습니다. 초기화해 비교하거나 다음 Read 장면으로 이동하세요.';
  if(id==='gc'&&!state.flash.blocks.some(b=>b.pages.some(p=>p.state==='invalid'))&&!state.busy)hint='아직 옛 데이터가 없습니다. 먼저 LBA 100을 수정하면 GC할 공간이 생깁니다.';
  if(['ftl','gc'].includes(id)&&state.busy)hint='진행 중인 단계를 보세요. 밝은 Page와 주소 연결이 순서대로 바뀝니다.';
  if(id==='ecc'&&state.eccBits.some((v,i)=>v!==encode()[i]))hint=state.eccSample?'같은 전하를 다시 읽는 Read Retry를 실행하고 결과를 비교하세요.':'오류를 만들었습니다. “ECC로 확인·복구”를 눌러 결과를 보세요.';
  $('#guide-instruction').textContent=hint;
}
function refresh(replace=false) {
  if(current<0)return;
  const active=document.activeElement,focus=active?.dataset.action,restore=active?.closest('#scene-controls');
  $('#scene-controls').innerHTML=controls(idNow());paintGraphic(replace);result();guidance();
  if(focus&&restore)$('#scene-controls').querySelector(`[data-action="${focus}"]`)?.focus({preventScroll:true});
  if(state.busy)$('#scene-controls').querySelectorAll('button[data-action]').forEach(b=>{if(!b.dataset.action.startsWith('go:'))b.setAttribute('aria-disabled','true');});
  schedule();
}
function finishTransaction() {
  if(!transaction)return;
  animationToken++;
  if(transaction.type==='write'){
    if(!transaction.plan.committed)commitWrite(state.flash,transaction.plan);
    state.writePhase='done';state.flashMessage=`LBA 100 → ${transaction.plan.to} · v${transaction.plan.value} · 옛 Page는 Invalid`;
  }else {
    const p=transaction.plan;
    if(!p.copied)copyGc(state.flash,p);
    if(!p.migrated)mapGc(state.flash,p);
    if(!p.erased){eraseGc(state.flash,p);p.erased=true;}
    state.gcPhase='done';state.flashMessage=`Block ${p.victim} 전체가 Free입니다. 보존한 데이터는 새 위치에 있습니다.`;
  }
  state.busy=false;transaction=null;
}
function setScene(index) {
  if(current===index)return;
  finishTransaction();
  // Reuse the two live diagrams at the midpoint; a dense Die is not rebuilt on handoff.
  if(incoming.dataset.index===String(index)){
    const previous=[...panel.childNodes],next=[...incoming.childNodes],previousIndex=Number(panel.dataset.index);
    panel.replaceChildren(...next);incoming.replaceChildren(...previous);
    labelGraphic(panel,index);if(Number.isInteger(previousIndex)&&previousIndex>=0)labelGraphic(incoming,previousIndex);
  }
  current=index;const s=scenes[index];state.sceneId=s.id;
  scene.dataset.scene=s.id;scene.dataset.layout=s.layout;scene.dataset.object=s.object;hideTip();if(compact.matches)scene.scrollTop=0;
  if(s.id==='cell'&&!state.charge)state.charge=8;
  if(s.id==='program'&&!state.programVisited){state.charge=0;state.programVisited=true;}
  if(s.id==='read')state.readExample=state.charge;
  if(s.id==='write'){state.flowStep=-1;state.flowFlash=createFlash();state.flowPlan=null;}
  if(s.id==='read-flow'){if(state.flowPlan?.programmed&&!state.flowPlan.committed)commitWrite(state.flowFlash,state.flowPlan);state.flowStep=-1;}
  manual=false;focusPaused=false;demoFrames=createDemo(s.id);demoElapsed=reduced.matches?Math.max(0,demoFrames.reduce((sum,f)=>sum+f.duration,0)-1):0;
  demoFrame=sampleDemo(demoFrames,demoElapsed);demoLastTime=0;
  scene.dataset.mode='watch';scene.dataset.hasDemo=String(demoFrames.length>0);
  $('#part-label').textContent=s.part;$('#scene-title').innerHTML=s.title;$('#scene-description').innerHTML=s.body.replaceAll('<br>','<br> ');
  $('#scene-context').textContent=sceneLearning[s.id][0];
  $('#scene-subtitle').hidden=s.id!=='question';
  $('#scene-number').textContent=String(index+1).padStart(2,'0');$('#previous').disabled=index===0;
  $('#next-label').textContent=index===count-1?'자세히 읽기':scenes[index+1].title.replaceAll('<br>',' ');
  $('#scroll-label').textContent=index<=sceneIndex('page')?'스크롤하여 더 가까이':index===count-1?'아래에서 자세히 읽기':'보고 나면, 스크롤로 계속';
  $('#scene-bridge').textContent=s.next;
  $$('#scene-toc button').forEach((b,i)=>{if(i===index)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});
  refresh(panel.dataset.index!==String(index));
  updateSceneChrome();
  wakeDemo();
}
function queueFrame(){if(!frameQueued){frameQueued=true;requestAnimationFrame(onFrame);}}
function schedule(){scrollDirty=true;queueFrame();}
function onFrame(now){
  frameQueued=false;
  // All geometry reads precede this frame's writes; newly mounted diagrams wait one frame.
  const measured=geometryDirty&&!compact.matches?motion?.measure():null;geometryDirty=false;
  if(measured)motion.route(visibleState(),measured);
  syncMotionPreference();
  if(scrollDirty){scrollDirty=false;render();}
  if(demoCanRun())tickDemo(now);else demoLastTime=0;
  if(geometryDirty||scrollDirty||demoCanRun())queueFrame();
}
function reveal(el,opacity){el.style.opacity=opacity;el.style.visibility=opacity<.001?'hidden':'visible';if(el.inert!==(opacity<.5))el.inert=opacity<.5;}
function render() {
  position=positionAt(scrollY/height,offsets);const t=timeline(position,count,holds);scrollState=t;setScene(t.current);
  const a=t.from,b=t.to,u=reduced.matches?(t.blend<.5?0:1):t.blend,ai=scenes[a].id,bi=scenes[b].id;
  const fade=reduced.matches?1:1-Math.sin(u*Math.PI)*.48;intro.style.opacity=fade;bridge.style.opacity=fade;
  const sa=scenes[a].object==='ssd',sb=scenes[b].object==='ssd';
  const poses={ssd:[1,1346.53,516.86],package:[2.45,1230,560]};
  let pose=sa?poses[ai]:sb?poses[bi]:poses.ssd;
  if(sa&&sb)pose=pose.map((v,i)=>lerp(v,poses[bi][i],u));
  else if(ai==='package')pose=[lerp(2.45,3.4,u),1230,560];
  else if(bi==='ssd')pose=[lerp(.72,1,u),1346.53,516.86];
  let [scale,x,y]=pose;if(compact.matches)x-=lerp(ai==='package'?65:130,bi==='package'?65:130,u);
  lidOutline.setAttribute('stroke-width',lerp(1.7,.7,clamp((scale-1)/1.45)));
  lidLabel.setAttribute('font-size',lerp(20,14,clamp((scale-1)/1.45)));
  camera.setAttribute('transform',`translate(${x} ${y}) scale(${scale}) translate(-1346.53 -516.86)`);
  const context=ai==='ssd'&&bi==='package'?1-smooth(u):ai==='package'?0:1;
  contextNodes.forEach(node=>{node.style.opacity=context;});
  paintLid(u,ai,bi);
  reveal(figure,sa?(sb?1:1-u):sb?u:0);
  const structural=a>=sceneIndex('package')&&a<=sceneIndex('page'),primary=t.current===a;
  const outAlpha=structural?1-u:clamp(1-u*2),inAlpha=structural?u:clamp((u-.5)*2);
  if(a!==b&&u>0&&u<1){
    const other=primary?b:a;
    if(incoming.dataset.index!==String(other)){incoming.innerHTML=diagram(other);labelGraphic(incoming,other);}
    panel.style.transform=structural?`scale(${primary?1+u*.65:.8+u*.2})`:`translateY(${primary?-u*16:(1-u)*16}px)`;
    reveal(panel,primary?(sa?0:outAlpha):(sb?0:inAlpha));
    incoming.style.transform=structural?`scale(${primary?.8+u*.2:1+u*.65})`:`translateY(${primary?(1-u)*16:-u*16}px)`;
    incoming.style.opacity=primary?(sb?0:inAlpha):(sa?0:outAlpha);incoming.style.visibility='visible';
  }else{panel.style.transform='';reveal(panel,scenes[current].object==='ssd'?0:1);incoming.style.transform='';incoming.style.opacity=0;incoming.style.visibility='hidden';}
  scaleMarker.style.transform=`translateY(${clamp((lerp(a,b,u)-2)/6)*285}px)`;
  progress.value=position*100;progress.style.setProperty('--progress',`${position/(count-1)*100}%`);
  const transitioning=String(t.blend>.02&&t.blend<.98);if(scene.dataset.transitioning!==transitioning)scene.dataset.transitioning=transitioning;
  scene.classList.toggle('motion-paused',paused||focusPaused||manual||reduced.matches||dialog.open||document.hidden||scrollY>storyHeight-height*.5);
  if(viewport.inert!==(scrollY>=storyHeight))viewport.inert=scrollY>=storyHeight;
}
function paintLid(u=scrollState?.blend||0,ai=scenes[scrollState?.from??current]?.id,bi=scenes[scrollState?.to??current]?.id){
  const packageVisible=ai==='package'||bi==='package';
  const demoLid=idNow()==='package'?(manual||reduced.matches?Number(visibleState().opened):demoFrame?.motion?.lid??0):0;
  const amount=ai==='package'?1-(1-demoLid)*(1-smooth(u/.4)):bi==='package'?demoLid*smooth((u-.5)/.5):0;
  const lidOpen=amount>.05;
  interior.style.opacity=packageVisible?1:0;
  nand.setAttribute('role',lidOpen?'group':'button');nand.setAttribute('tabindex',lidOpen?'-1':'0');
  lid.style.transform=`translate(${89*amount}px,${-102*amount}px)`;
  lid.style.opacity=ai==='package'?1-u:1;
  dies.style.visibility=packageVisible&&lidOpen?'visible':'hidden';
  figure.style.transform=compact.matches?`translateY(${30*amount}px)`:'';
}
function updateSceneChrome(){
  const physical=current<=sceneIndex('cell')||idNow()==='ending';
  const h=idNow()==='ending'?0:Math.max(0,hierarchyScenes.indexOf(idNow()==='storage'?'question':idNow()));
  hierarchyItems.forEach((li,i)=>{if(i===h)li.setAttribute('aria-current','step');else li.removeAttribute('aria-current');});
  hierarchyNode.style.opacity=physical?1:0;hierarchyNode.inert=!physical;
  scaleNode.style.opacity=physical&&current>=sceneIndex('ssd')&&idNow()!=='ending'?1:0;
  $('#object-name').textContent=idNow()==='package'?'NAND Package':'SSD';$('#object-note').textContent=idNow()==='package'?'Die가 들어 있는 패키지':'Controller가 관리 · NAND가 저장';
  progress.setAttribute('aria-valuetext',`${current+1} / ${count} · ${scenes[current].title.replaceAll('<br>',' ')}`);
  updatePlayback();
}

function resize() {
  const old=initialized?position:null,oldEnd=offsets.at(-2)*height;const wasInStory=scrollY<=oldEnd;
  height=innerHeight;state.compact=compact.matches;
  // Geometry keeps its original canvas on wide screens; text sizes compensate in CSS.
  const fit=Math.min(innerWidth/1920,height/1080);scene.style.transform=compact.matches?'':`translate(-50%,-50%) scale(${fit})`;scene.style.setProperty('--fit',fit);
  storyHeight=offsets.at(-2)*height+height;story.style.height=`${storyHeight}px`;
  $('#ssd-figure .world').setAttribute('viewBox',compact.matches?'510 245 1240 650':'0 0 1920 1080');
  if(old!==null&&wasInStory)scrollTo(0,distanceAt(old,offsets)*height);
  initialized=true;delete incoming.dataset.index;if(current>=0)refresh(true);schedule();
}
function stopPlay(){cancelAnimationFrame(playRaf);}
function updatePlayback() {
  const stopped=paused||focusPaused||reduced.matches||manual||!demoFrames.length;
  $('#play').hidden=!demoFrames.length;
  $('#play').disabled=reduced.matches||manual;
  $('#play').setAttribute('aria-pressed',String(!stopped));
  $('#play').setAttribute('aria-label',stopped?'장면 애니메이션 재생':'장면 애니메이션 일시정지');
  $('#play-label').textContent=reduced.matches?'정지 화면':stopped?'재생':'일시정지';
  $('#play-icon').textContent=stopped?'▷':'Ⅱ';
  $('#play').title=reduced.matches?'동작 줄임 설정에 따라 결과를 정지 화면으로 보여줍니다. 직접 살펴보기도 사용할 수 있습니다.':'';
}
function demoCanRun() {
  if(manual||paused||focusPaused||reduced.matches||document.hidden||dialog.open||!demoFrames.length||scrollY>=storyHeight-height*.4)return false;
  if(scrollState?.blend>.02&&scrollState.blend<.98)return false;
  return visibility.get(idNow()==='package'?figure:panel);
}
function wakeDemo(){if(demoCanRun())queueFrame();}
function paintDemoProgress(){guide.style.setProperty('--loop-progress',String(demoFrame?.loopProgress??0));}
function tickDemo(now) {
  if(demoLastTime)demoElapsed+=Math.max(0,now-demoLastTime);
  demoLastTime=now;
  const next=sampleDemo(demoFrames,demoElapsed),phaseChanged=next.index!==demoFrame?.index;
  const verdictChanged=idNow()==='ecc'&&next.patch.eccBits.join('')!==demoFrame?.patch.eccBits.join('');
  demoFrame=next;
  if(phaseChanged||verdictChanged){paintGraphic();result();if(phaseChanged)guidance();}
  motion?.paint(visibleState(),demoFrame,demoElapsed);
  paintDemoProgress();
  if(idNow()==='package')paintLid();
}
function pauseDemo(){focusPaused=true;demoLastTime=0;updatePlayback();schedule();}
function goTo(target) {
  stopPlay();hideTip();if(dialog.open)dialog.close();
  const articleTarget=target==='article'||String(target).startsWith('article-');
  const index=articleTarget?count-1:clamp(indexOf(target),0,count-1);
  const article=articleTarget?document.getElementById(target):null;
  const to=articleTarget?(article?.getBoundingClientRect().top+scrollY||storyHeight):distanceAt(index,offsets)*height,from=scrollY;
  function finish(){stopPlay();render();if(articleTarget)article?.focus({preventScroll:true});else $('#scene-title').focus({preventScroll:true});}
  if(reduced.matches){scrollTo(0,to);finish();return;}
  const duration=Math.min(1600,650+Math.abs(to-from)/height*55),start=performance.now();
  function tick(now){const p=clamp((now-start)/duration);scrollTo(0,lerp(from,to,smooth(p)));if(p<1)playRaf=requestAnimationFrame(tick);else finish();}
  playRaf=requestAnimationFrame(tick);
}
function showTip(el){if(!el?.dataset.tip)return;$('#tooltip').textContent=el.dataset.tip;$('#tooltip').hidden=false;el.setAttribute('aria-describedby','tooltip');}
function hideTip(){$('#tooltip').hidden=true;$$('[aria-describedby="tooltip"]').forEach(el=>el.removeAttribute('aria-describedby'));}
const delay=ms=>new Promise(r=>setTimeout(r,reduced.matches?0:ms));
async function update() {
  const plan=planWrite(state.flash);
  if(!plan.ok){state.flashMessage='Free Page가 없습니다. GC로 공간을 확보하세요.';refresh();return;}
  state.busy=true;state.lba=100;state.gcPhase='idle';state.gcPlan=null;state.writePlan=plan;transaction={type:'write',plan};
  const token=++animationToken;programWrite(state.flash,plan);state.writePhase='program';
  state.flashMessage=`① ${plan.to}에 v${plan.value} Program · 기존 Mapping은 아직 ${plan.from}`;refresh();
  await delay(1200);if(token!==animationToken)return;
  commitWrite(state.flash,plan);state.writePhase='mapping';state.flashMessage=`② LBA 100의 Mapping → ${plan.to} · 이제 새 데이터가 현재 값입니다.`;refresh();
  await delay(1100);if(token!==animationToken)return;
  finishTransaction();refresh();
}
async function gc() {
  const plan=planGc(state.flash);
  if(!plan){state.flashMessage='아직 회수할 Invalid Page가 없습니다. 먼저 LBA 100을 수정해 보세요.';refresh();return;}
  state.busy=true;state.gcPlan=plan;state.writePlan=null;state.writePhase='idle';transaction={type:'gc',plan};const token=++animationToken;
  state.gcPhase='copy';copyGc(state.flash,plan);state.flashMessage=`① Block ${plan.victim}의 Valid Page ${plan.moves.length}개를 새 위치로 복사`;refresh();
  await delay(1200);if(token!==animationToken)return;
  mapGc(state.flash,plan);state.gcPhase='mapping';state.flashMessage='② Mapping 갱신 · 원래 Block의 Valid 데이터가 모두 보존되었습니다.';refresh();
  await delay(1100);if(token!==animationToken)return;
  state.gcPhase='erase';state.flashMessage=`③ Block ${plan.victim} 전체 Erase`;refresh();
  await delay(1000);if(token!==animationToken)return;
  finishTransaction();refresh();
}
function eraseEffect(value){clearTimeout(effectTimer);state.eraseEffect=value;effectTimer=setTimeout(()=>{state.eraseEffect='';if(idNow()==='erase')paintGraphic();},750);}
async function action(value) {
  stopPlay();const [key,val]=value.split(':');
  if(key==='go'){goTo(val);return;}
  if(key==='article'){goTo(val?`article-${val}`:'article');return;}
  if(key==='demo-mode'){
    finishTransaction();manual=!manual;demoLastTime=0;scene.dataset.mode=manual?'manual':'watch';
    if(!manual){paused=false;focusPaused=false;demoElapsed=reduced.matches?Math.max(0,demoFrames.reduce((sum,f)=>sum+f.duration,0)-1):0;demoFrame=sampleDemo(demoFrames,demoElapsed);}
    refresh(true);updatePlayback();wakeDemo();return;
  }
  if(!manual&&demoFrames.length)return;
  if(state.busy)return;
  switch(key) {
    case 'document':state.documentPhase=(state.documentPhase+1)%4;break;
    case 'power':state.power=!state.power;break;
    case 'lid':state.opened=!state.opened;break;
    case 'bits':state.bits=Number(val);break;
    case 'charge':state.charge=Number(val);break;
    case 'cell-reset':state.charge=0;state.pulsing=false;clearTimeout(pulseTimer);break;
    case 'pulse':if(state.charge<10){state.charge=Math.min(10,state.charge+2);state.pulsing=true;clearTimeout(pulseTimer);pulseTimer=setTimeout(()=>{state.pulsing=false;if(idNow()==='program')paintGraphic();},750);}break;
    case 'select-page':state.selectedPage=Number(val);state.eraseMessage=`Page ${val} 선택됨`;break;
    case 'page-read':state.eraseMessage=`Page ${state.selectedPage} Read · ${state.erasePages[state.selectedPage]==='free'?'지워진 상태':'기록된 데이터'}를 읽었습니다.`;eraseEffect('reading');break;
    case 'page-program':if(state.erasePages[state.selectedPage]==='free'){state.erasePages[state.selectedPage]='used';state.eraseMessage=`Page ${state.selectedPage}에 새 데이터를 기록했습니다.`;eraseEffect('programming');}else{state.eraseMessage='Program 불가 · 이미 기록된 Page에 자유롭게 덮어쓸 수 없습니다.';eraseEffect('blocked');}break;
    case 'block-erase':state.erasePages.fill('free');state.eraseMessage='Block 전체 Erase · 다른 Page의 데이터도 모두 지워졌습니다.';eraseEffect('erasing');break;
    case 'erase-reset':state.erasePages.fill('used');state.eraseMessage='Page를 선택하고 Program을 시도해 보세요.';break;
    case 'lba':state.lba=Number(val);break;
    case 'update':await update();return;
    case 'gc':await gc();return;
    case 'gc-start':if(state.flash.blocks.some(b=>b.pages.some(p=>p.state==='invalid')))await gc();else await update();return;
    case 'flash-reset':state.flash=createFlash();state.writePlan=null;state.writePhase='idle';state.gcPhase='idle';state.gcPlan=null;state.flashMessage='초기 Mapping입니다. LBA 100을 수정해 보세요.';break;
    case 'balanced':state.balanced=Boolean(Number(val));break;
    case 'bad':state.badBlock=state.badBlock<0?0:-1;break;
    case 'wear':for(let i=0;i<6;i++){const r=wearCycle(state.wearCounts,state.balanced,state.badBlock);state.wearCounts=r.counts;state.lastWear=r.index;}break;
    case 'wear-reset':state.wearCounts=[2,3,1,2,0,1];state.badBlock=-1;state.lastWear=-1;break;
    case 'disturb':state.disturb=Boolean(Number(val));break;
    case 'flip':{const original=encode(),i=Number(val),errors=state.eccBits.filter((v,j)=>v!==original[j]).length;if(errors>=2&&state.eccBits[i]===original[i]){state.eccMessage='최대 2 bit까지 비교합니다. 먼저 바꾼 bit를 되돌려 주세요.';break;}state.eccBits[i]^=1;state.eccResult=null;state.eccSample=false;state.eccMessage='읽은 bit가 바뀌었습니다. ECC로 확인해 보세요.';break;}
    case 'ecc':{const d=decode(state.eccBits);state.eccResult=d;state.eccMessage=d.status==='corrected'?`${d.position+1}번 bit의 오류를 찾아 복구했습니다.`:d.status==='clean'?'오류가 없는 부호입니다.':'2 bit 오류를 검출했습니다. 이 부호로는 복구할 수 없습니다.';if(d.status==='corrected')state.eccBits=d.code;break;}
    case 'read-errors':state.eccBits=sampleBits(encode(),.34,.5);state.eccSample=true;state.retried=false;state.eccResult=null;state.eccMessage='전압 기준을 넘어 두 bit가 잘못 판정된 예시입니다.';break;
    case 'retry':if(state.eccSample){state.eccBits=sampleBits(encode(),.34,.72);state.eccResult=decode(state.eccBits);state.retried=true;state.eccMessage='Vref 0.50 → 0.72 · 같은 전하를 다시 판정하고 ECC 확인을 통과했습니다.';}else state.eccMessage='전압 판정 오류 예시를 먼저 선택하세요. 임의의 bit 반전을 무조건 되돌리는 기능은 아닙니다.';break;
    case 'ecc-reset':state.eccBits=encode();state.eccResult=null;state.eccSample=false;state.retried=false;state.eccMessage='bit 하나를 뒤집고 ECC를 실행해 보세요.';break;
    case 'flow-next':{
      const write=idNow()==='write',max=write?writeSteps.length:(state.retry?retrySteps:readSteps).length;
      state.flowStep=(state.flowStep+1)%max;
      if(write){
        if(state.flowStep===0){state.flowFlash=createFlash();state.flowPlan=null;}
        if(state.flowStep===2)state.flowPlan=planWrite(state.flowFlash);
        if(state.flowStep===4)programWrite(state.flowFlash,state.flowPlan);
        if(state.flowStep===5)commitWrite(state.flowFlash,state.flowPlan);
      }
      break;
    }
    case 'flow-reset':state.flowStep=-1;state.flowFlash=createFlash();state.flowPlan=null;break;
    case 'retry-path':state.retry=Boolean(Number(val));state.flowStep=-1;break;
    default:return;
  }
  refresh();
}
document.addEventListener('click',event=>{const a=event.target.closest('[data-action]');if(a){action(a.dataset.action);return;}const g=event.target.closest('[data-go]');if(g){goTo(g.dataset.go);return;}if(event.target.closest('[data-article]'))goTo('article');});
document.addEventListener('input',event=>{const el=event.target;if(!el.dataset.range)return;stopPlay();state[el.dataset.range]=Number(el.value);el.closest('label').querySelector('output').textContent=Number(el.value).toFixed(2);paintGraphic();result();});
document.addEventListener('pointerover',event=>showTip(event.target.closest('[data-tip]')));
document.addEventListener('pointerout',event=>{if(event.target.closest('[data-tip]')&&!event.relatedTarget?.closest?.('[data-tip]'))hideTip();});
document.addEventListener('focusin',event=>showTip(event.target.closest('[data-tip]')));document.addEventListener('focusout',hideTip);
$('#nand-target').dataset.tip='NAND Flash는 비휘발성 저장을 담당합니다. 클릭하면 더 가까이 들어갑니다.';
$('#controller-141').dataset.tip='Controller의 Firmware가 주소 변환, 오류 복구와 NAND 동작을 관리합니다.';
$('#controller-141').style.pointerEvents='auto';$('#controller-141').setAttribute('tabindex','0');$('#controller-141').setAttribute('role','group');$('#controller-141').setAttribute('aria-label','Controller · 저장 관리');
$('#die-stack').dataset.tip='Die는 반도체 칩입니다. 클릭하면 내부 구획으로 들어갑니다.';
$('#die-stack').dataset.action='go:die';$('#die-stack').setAttribute('tabindex','0');$('#die-stack').setAttribute('role','button');$('#die-stack').setAttribute('aria-label','Die 내부로 들어가기');
$('#nand-target').addEventListener('click',event=>{if(event.target.closest('[data-action]'))return;if(idNow()==='package')action('lid');else goTo('package');});
$('#nand-target').addEventListener('keydown',event=>{if(event.target.closest('[data-action]'))return;if(event.key==='Enter'||event.key===' '){event.preventDefault();if(idNow()==='package')action('lid');else goTo('package');}});
$('#progress').addEventListener('input',event=>{stopPlay();scrollTo(0,distanceAt(Number(event.target.value)/100,offsets)*height);});
$('#previous').addEventListener('click',()=>goTo(current-1));$('#next').addEventListener('click',()=>goTo(current===count-1?'article':current+1));
$('#play').addEventListener('click',()=>{paused=!(paused||focusPaused);focusPaused=false;demoLastTime=0;updatePlayback();schedule();wakeDemo();});
$('#contents').addEventListener('click',()=>{stopPlay();dialog.showModal();schedule();});$('#close-toc').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',schedule);
addEventListener('keydown',event=>{
  const isEditingTarget=target=>target instanceof Element&&Boolean(target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"], [data-code-editor], .monaco-editor, .CodeMirror'));
  if(!event.metaKey&&!event.ctrlKey&&!event.altKey&&!event.isComposing&&!isEditingTarget(event.target)&&event.key.toLowerCase()==='h'){window.location.assign(homeUrl.href);return;}
  if(event.key==='Escape'){stopPlay();pauseDemo();hideTip();if(dialog.open)dialog.close();return;}
  if(event.key==='Tab')pauseDemo();
  if(isEditingTarget(event.target)||event.metaKey||event.ctrlKey||event.altKey||event.isComposing)return;
  if((event.key==='Enter'||event.key===' ')&&event.target.matches('g[data-action]')){event.preventDefault();action(event.target.dataset.action);return;}
  if(event.key.toLowerCase()==='o'){event.preventDefault();if(dialog.open)dialog.close();else{stopPlay();dialog.showModal();schedule();}return;}
  if(dialog.open)return;
  if(scrollY<storyHeight){if(event.key==='ArrowRight'){event.preventDefault();goTo(current===count-1?'article':current+1);}if(event.key==='ArrowLeft'){event.preventDefault();goTo(current-1);}}
  if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(event.key))stopPlay();
});
addEventListener('scroll',schedule,{passive:true});addEventListener('wheel',stopPlay,{passive:true});addEventListener('touchstart',stopPlay,{passive:true});addEventListener('resize',resize);
scene.addEventListener('scroll',()=>{demoLastTime=0;wakeDemo();},{passive:true});
new ResizeObserver(()=>{geometryDirty=true;queueFrame();}).observe(panel);
document.addEventListener('visibilitychange',()=>{demoLastTime=0;if(document.hidden)stopPlay();schedule();});
function syncMotionPreference(){
  // Also checked by an already-running frame: stop immediately if the live query changes
  // before its change event is delivered, keeping the final state and playback UI in sync.
  if(motionReduced===reduced.matches)return;
  motionReduced=reduced.matches;stopPlay();demoLastTime=0;
  if(motionReduced){demoElapsed=Math.max(0,demoFrames.reduce((sum,f)=>sum+f.duration,0)-1);demoFrame=sampleDemo(demoFrames,demoElapsed);refresh(true);}
  updatePlayback();schedule();
}
reduced.addEventListener('change',syncMotionPreference);
addEventListener('pageshow',schedule);resize();schedule();
