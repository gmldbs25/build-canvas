import { scenes,hierarchy,hierarchyScenes,articleSections,writeSteps,writeNotes,readSteps,readNotes,retrySteps } from './content.mjs';
import { clamp,lerp,smooth,timeline,createFlash,writeLba,planGc,migrateGc,eraseGc,encode,decode,sampleBits,wearCycle } from './model.mjs';
import { dieDiagram,blockDiagram,pageDiagram,cellDiagram,densityDiagram,eraseDiagram,mappingDiagram,wearDiagram,eccDiagram,flowDiagram } from './diagrams.mjs';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),portrait=matchMedia('(max-aspect-ratio: 1/1)');
const state={power:true,opened:false,trap:'ct',charge:5,pulsing:false,vref:.5,bits:1,selectedPage:3,erasePages:Array(8).fill('used'),eraseMessage:'Page를 선택해 동작을 비교해 보세요.',flash:createFlash(),lastWrite:null,lba:100,flashMessage:'같은 LBA가 현재 Page를 가리킵니다.',gcPlan:null,gcPhase:'idle',busy:false,wearCounts:[2,3,1,2,0,1],balanced:false,badBlock:-1,lastWear:-1,drift:0,disturb:false,eccBits:encode(),eccResult:null,eccMessage:'bit를 클릭해 오류를 만들어 보세요.',eccSample:false,flowStep:-1,retry:false};
const count=scenes.length;let current=-1,position=0,frameQueued=false,playRaf=0,playing=false,animationToken=0,lastSize=innerHeight,initialized=false;
const story=$('#story'),scene=$('.scene'),panel=$('#graphic-panel'),incoming=$('#incoming-panel'),dialog=$('#toc-dialog');
const pitch=()=>innerHeight*1.12;
const homeUrl=new URL('../',window.location.href);
$('.identity').href=homeUrl.href;$('.home-link').href=homeUrl.href;
$('.hierarchy ol').innerHTML=hierarchy.map((name,i)=>`<li><button data-go="${hierarchyScenes[i]}">${name}</button></li>`).join('');
$('#scene-toc').innerHTML=scenes.map((s,i)=>`<button data-go="${i}"><span>${String(i+1).padStart(2,'0')}</span><strong>${s.title.replace('<br>',' ')}</strong><small>${s.part}</small></button>`).join('');
$('#article-toc').innerHTML=articleSections.map(([id,title])=>`<a href="#article-${id}">${title}</a>`).join('');
// The article is also pre-rendered by the build helper for no-JS reading.
if(!$('#article-sections').children.length)$('#article-sections').innerHTML=articleSections.map(([id,title,a,b,url])=>`<section id="article-${id}" class="article-section"><h3>${title}</h3><p>${a}</p><p>${b}</p><a class="source" href="${url}" target="_blank" rel="noreferrer">기술 자료 ↗</a></section>`).join('');
const btn=(label,action,primary=false,attrs='')=>`<button data-action="${action}" class="${primary?'primary-button':'text-button'}" ${attrs}>${label}</button>`;
const toggle=(values,key,selected)=>`<div class="segmented" role="group" aria-label="${key}">${values.map(([value,label])=>btn(label,`${key}:${value}`,false,`aria-pressed="${String(selected)===String(value)}"`)).join('')}</div>`;
const range=(key,label,min,max,value,step=1)=>`<label class="control-range"><span>${label}</span><input type="range" data-range="${key}" min="${min}" max="${max}" step="${step}" value="${value}" aria-label="${label}"></label>`;
function controls(id){switch(id){
 case 'question':return btn(state.power?'전원 끄기':'전원 켜기','power',true,'aria-pressed="'+!state.power+'"');
 case 'ssd':return btn('NAND Package로 들어가기 ↗','go:2',true);
 case 'package':return btn(state.opened?'덮개 닫기':'내부 살펴보기','lid',true)+btn('Die로 들어가기 ↗','go:3');
 case 'die':return btn('Block으로 들어가기 ↗','go:4',true);
 case 'block':return btn('Page로 들어가기 ↗','go:5',true);
 case 'page':return btn('Cell로 들어가기 ↗','go:6',true);
 case 'cell':return toggle([['ct','Charge Trap'],['fg','Floating Gate']],'trap',state.trap)+btn(state.power?'전원 끄기':'전원 켜기','power');
 case 'density':return toggle([[1,'SLC'],[2,'MLC'],[3,'TLC'],[4,'QLC']],'bits',state.bits);
 case 'program':return btn('Program 펄스 가하기','pulse',true,`aria-disabled="${state.charge>=10}"`)+btn('실험 초기화','cell-reset');
 case 'read':return range('vref','기준 전압 Vref · 상대값',.05,.95,state.vref,.01)+toggle([[0,'지워진 Cell'],[10,'Program된 Cell']],'charge',state.charge);
 case 'erase':return `<div class="control-row">${btn('Read','page-read')}${btn('Program','page-program')}</div>`+btn('Block 전체 Erase','block-erase',true)+btn('실험 초기화','erase-reset');
 case 'address':return btn('LBA 100 수정해 보기 ↗','go:12',true);
 case 'ftl':return btn('LBA 100의 데이터 수정','update',true)+btn('초기화','flash-reset')+btn('GC로 공간 확보 ↗','go:13');
 case 'gc':return btn('GC 실행','gc',true)+btn('LBA 100 다시 수정','update')+btn('초기화','flash-reset');
 case 'wear':return toggle([[0,'분산 끄기'],[1,'분산 켜기']],'balanced',Number(state.balanced))+btn('P/E Cycle 6회 실행','wear',true)+btn(state.badBlock<0?'B0를 Bad Block으로 제외':'Bad Block 제외 해제','bad')+btn('초기화','wear-reset');
 case 'reliability':return toggle([[0,'Retention'],[1,'Read Disturb']],'disturb',Number(state.disturb))+range('drift',state.disturb?'반복 읽기에 따른 변화':'시간 경과에 따른 변화',0,1,state.drift,.01)+btn('ECC로 이어보기 ↗','go:16');
 case 'ecc':return btn('ECC로 확인·복구','ecc',true)+btn('전압 판정 오류 예시','read-errors')+btn('Read Retry','retry')+btn('초기화','ecc-reset');
 case 'write':return btn(state.flowStep<0?'Write 시작':state.flowStep<writeSteps.length-1?'다음 단계 →':'Write 다시 보기','flow-next',true)+btn('처음 단계로','flow-reset');
 case 'read-flow':return btn(state.flowStep<0?'Read 시작':state.flowStep<(state.retry?retrySteps:readSteps).length-1?'다음 단계 →':'Read 다시 보기','flow-next',true)+toggle([[0,'일반 Read'],[1,'Retry 포함']],'retry-path',Number(state.retry));
 case 'ending':return btn('자세히 읽기 ↗','article',true)+btn('처음부터 다시','go:0');
 default:return '';}}
function diagram(index){const id=scenes[index].id;switch(scenes[index].object){case 'structure':return id==='die'?dieDiagram():id==='block'?blockDiagram():id==='page'?pageDiagram():'';case 'cell':return cellDiagram(state,id);case 'density':return densityDiagram(state.bits);case 'erase':return eraseDiagram(state);case 'mapping':return mappingDiagram(state);case 'wear':return wearDiagram(state);case 'reliability':return densityDiagram(3,state.drift,state.disturb);case 'ecc':return eccDiagram(state);case 'flow':return flowDiagram(id==='write'?writeSteps:state.retry?retrySteps:readSteps,state.flowStep,id==='write');default:return '';}}
function result(){const id=scenes[current]?.id;let text='';
 if(id==='question'||id==='cell')text=state.power?'전원 공급 중 · NAND의 저장 상태는 유지됩니다.':'전원 꺼짐 · 저장된 전하와 데이터는 남아 있습니다.';
 if(id==='density')text=`Cell당 ${state.bits} bit · ${2**state.bits}개의 상태를 구분합니다.`;
 if(id==='program')text=state.charge>=10?'목표 Vth에 도착했습니다. 실제 Program에는 확인 과정이 반복됩니다.':`펄스를 가하면 전하가 늘고 Vth가 높아집니다.`;
 if(id==='read')text=state.vref>.2+state.charge*.055?`Vref > Vth · 도통 · SLC 예시 판정 1`:`Vref ≤ Vth · 비도통 · SLC 예시 판정 0`;
 if(id==='erase')text='실제 Page·Cell 수를 줄여 보여주는 실험입니다.';
 if(id==='gc')text=state.gcPhase==='migration'?'① Valid Page 이동 · Mapping 갱신':state.gcPhase==='erase'?'② 원본 Block Erase':state.gcPhase==='done'?'③ Free Block 확보 · 다시 쓸 수 있습니다.':'Valid → 보존  /  Invalid → 폐기  /  Free → 기록 가능';
 if(id==='ftl')text='예시에서는 LBA 한 개를 Page 한 개에 대응시킵니다.';
 if(id==='ecc')text=state.eccSample?'Read Retry는 전압 기준을 바꿉니다. 저장된 전하는 바꾸지 않습니다.':'학습 모델: 1 bit 오류 복구 · 2 bit 오류 검출';
 if(id==='write'&&state.flowStep>=0)text=writeNotes[state.flowStep];
 if(id==='read-flow'&&state.flowStep>=0)text=state.retry&&state.flowStep>=6?['기준 전압을 바꿔 같은 Page를 다시 읽습니다.','오류가 복구 가능한지 다시 확인합니다.','검증한 데이터를 Host에 반환합니다.'][state.flowStep-6]:readNotes[state.flowStep];
 $('#scene-result').textContent=text;}
function refresh(){if(current<0)return;const focus=document.activeElement?.dataset.action;
 $('#scene-controls').innerHTML=controls(scenes[current].id);panel.innerHTML=diagram(current);result();
 if(focus)document.querySelector(`[data-action="${focus}"]`)?.focus({preventScroll:true});
 $('#scene-controls').querySelectorAll('button,input').forEach(b=>{if(state.busy)b.disabled=true;});schedule();}
function setScene(index){if(current===index)return;
 if(state.busy){animationToken++;state.busy=false;if(state.gcPhase==='migration'&&state.gcPlan){migrateGc(state.flash,state.gcPlan);eraseGc(state.flash,state.gcPlan);}else if(state.gcPhase==='erase'&&state.gcPlan)eraseGc(state.flash,state.gcPlan);state.gcPhase='done';state.flashMessage='GC를 완료하여 Free Block을 확보했습니다.';}
 current=index;scene.dataset.scene=scenes[index].id;hideTip();
 if(index===13&&state.flash.version===0){writeLba(state.flash);writeLba(state.flash);state.flashMessage='수정으로 Invalid Page가 생긴 상태입니다.';}
 if(index===8){state.power=true;state.charge=0;}
 if(index===9){state.power=true;if(!state.charge)state.charge=10;}
 if(index===17||index===18)state.flowStep=-1;
 $('#part-label').textContent=scenes[index].part;$('#scene-title').innerHTML=scenes[index].title;$('#scene-description').innerHTML=scenes[index].body;
 $('#scene-subtitle').hidden=index!==0&&index!==1;
 $('#scene-number').textContent=String(index+1).padStart(2,'0');$('#previous').disabled=index===0;$('#next-label').textContent=index===count-1?'자세히 읽기':scenes[index+1].title.replace('<br>',' ');
 $('#scroll-label').textContent=index<6?'스크롤하여 내부로 이동':index===count-1?'아래에서 자세히 읽기':'직접 조작하고 다음으로 스크롤';
 $$('#scene-toc button').forEach((b,i)=>{if(i===index)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});
 refresh();}
function schedule(){if(!frameQueued){frameQueued=true;requestAnimationFrame(render);}}
function reveal(el,opacity){el.style.opacity=opacity;el.style.visibility=opacity<.001?'hidden':'visible';el.inert=opacity<.5;}
function render(){frameQueued=false;position=clamp(scrollY/pitch(),0,count-1);const t=timeline(position,count);setScene(t.current);
 const a=t.from,b=t.to,u=reduced.matches?(t.blend<.5?0:1):t.blend;
 scene.style.setProperty('--scene-fade',1-Math.sin(u*Math.PI)*.72);
 const isStructure=i=>i<=2||i===19;const sa=isStructure(a),sb=isStructure(b);
 let ssdAlpha=sa?(sb?1:1-u):sb?u:0;
 let pose=[1,1346.53,516.86];
 const poses={0:[.80,1400,552],1:[1,1346.53,516.86],2:[2.45,1230,560],19:[1,1346.53,516.86]};
 if(sa&&sb)pose=poses[a].map((v,i)=>lerp(v,poses[b][i],u));
 else if(a===2){pose=[lerp(2.45,4.5,u),lerp(1230,1220,u),lerp(560,580,u)];}
 else if(sb){pose=poses[b];if(b===19)pose=[lerp(1.6,1,u),1346.53,516.86];}
 let [scale,x,y]=pose;if(portrait.matches)x-=a===2?65:130;
 $('#ssd-camera').setAttribute('transform',`translate(${x} ${y}) scale(${scale}) translate(-1346.53 -516.86)`);
 const context=a===1&&b===2?1-smooth(u):a===2?0:1;
 ['#pcb','#controller-141','#nand-352','#nand-716','#ground-shadow'].forEach(id=>{$(id).style.opacity=context;});
 $('#controller-141').style.opacity=(!state.power&&a<=1?.25:1)*context;
 $('#package-interior').style.opacity=a===2||b===2?1:0;
 const lidOpen=(current===2&&state.opened)||(a===2&&u>.12);
 $('#nand-target').setAttribute('role',lidOpen?'group':'button');$('#nand-target').setAttribute('tabindex',lidOpen?'-1':'0');
 $('#package-lid').style.transform=lidOpen?'translate(89px, -102px)':'translate(0,0)';
 $('#package-lid').style.opacity=a===2?1-smooth(u*.95):1;
 $('#package-lid').style.transition=reduced.matches?'none':'transform 650ms cubic-bezier(.22,.7,.18,1)';
 $('#package-lid').querySelectorAll('rect')[1].setAttribute('stroke-width',lerp(1.7,.7,clamp((scale-1)/1.45)));
 $('#package-lid').querySelector('text').setAttribute('font-size',lerp(20,14,clamp((scale-1)/1.45)));
 $('#ssd-figure').style.transform=portrait.matches&&lidOpen?'translateY(66px)':'';
 reveal($('#ssd-figure'),ssdAlpha);
 $('#object-caption').style.opacity=a===b||u<.1||u>.9?1:0;
 $('#object-name').textContent=current===2?'NAND Package':'SSD';$('#object-note').textContent=current===2?'Die가 들어 있는 패키지':'데이터를 담는 드라이브';
 // Each level contains the next structure. Move toward that selected region as its internal view appears.
 const structural=a>=2&&a<=5;
 const selectedOrigins={2:[57,44],3:[40,51],4:[49,48],5:[61,47]};
 panel.style.transformOrigin=structural?`${selectedOrigins[a][0]}% ${selectedOrigins[a][1]}%`:'50% 50%';
 if(a!==b&&u>0&&u<1){
  const primary=t.current===a;
  if(primary){panel.style.transform=structural?`scale(${1+u*1.5})`:`translateY(${-u*22}px)`;reveal(panel,sa?0:1-u);}
  else{panel.style.transform=structural?`scale(${.58+u*.42})`:`translateY(${(1-u)*22}px)`;reveal(panel,sb?0:u);}
  const other=primary?b:a;const key=`${other}-${state.flash.version}`;
  if(incoming.dataset.key!==key){incoming.innerHTML=diagram(other);incoming.dataset.key=key;}
  incoming.style.transformOrigin=structural?`${selectedOrigins[a][0]}% ${selectedOrigins[a][1]}%`:'50% 50%';
  incoming.style.transform=primary?(structural?`scale(${.58+u*.42})`:`translateY(${(1-u)*22}px)`):(structural?`scale(${1+u*1.5})`:`translateY(${-u*22}px)`);
  incoming.style.opacity=(primary?(sb?0:u):(sa?0:1-u));incoming.style.visibility='visible';
 }else{panel.style.transform='';reveal(panel,isStructure(current)?0:1);incoming.style.opacity=0;incoming.style.visibility='hidden';}
 const h=current<=1||current===19?0:current<=6?current-1:5;
 $$('.hierarchy li').forEach((li,i)=>{if(i===h)li.setAttribute('aria-current','step');else li.removeAttribute('aria-current');});
 const physical=current<=6||current===19;$('.hierarchy').style.opacity=physical?1:0;$('.hierarchy').inert=!physical;$('.scale').style.opacity=physical?1:0;
 const scaleProgress=current===19?0:clamp((lerp(a,b,u)-1)/5);$('.scale-marker').style.transform=`translateY(${scaleProgress*(portrait.matches?121:285)}px)`;
 $('#progress').value=Math.round(position*100);$('#progress').style.setProperty('--progress',`${position/(count-1)*100}%`);$('#progress').setAttribute('aria-valuetext',`${current+1} / ${count} · ${scenes[current].title.replace('<br>',' ')}`);
 scene.classList.toggle('motion-paused',reduced.matches||dialog.open||document.hidden||scrollY>story.offsetHeight-innerHeight*.5);
}
function resize(){const old=initialized?position:null;const fit=Math.min(innerWidth/1920,innerHeight/1080);scene.style.transform=portrait.matches?'':`translate(-50%, -50%) scale(${fit})`;scene.style.setProperty('--fit',fit);
 story.style.height=`${(count-1)*pitch()+innerHeight}px`;$('#ssd-figure .world').setAttribute('viewBox',portrait.matches?'510 245 1240 650':'0 0 1920 1080');
 if(old!==null&&scrollY<((count-1)*lastSize*1.12+lastSize))scrollTo(0,old*pitch());lastSize=innerHeight;initialized=true;schedule();}
function stopPlay(){cancelAnimationFrame(playRaf);playing=false;$('#play').setAttribute('aria-pressed','false');$('#play-label').textContent='자동 재생';$('#play-icon').textContent='▷';}
function goTo(index,auto=false){stopPlay();hideTip();if(dialog.open)dialog.close();const to=index==='article'?story.offsetHeight:clamp(Number(index),0,count-1)*pitch(),from=scrollY;
 if(reduced.matches){scrollTo(0,to);return;}
 const duration=auto?Math.max(1800,Math.abs(to-from)/pitch()*5000):Math.min(2100,750+Math.abs(to-from)/pitch()*120),start=performance.now();if(auto){playing=true;$('#play').setAttribute('aria-pressed','true');$('#play-label').textContent='일시 정지';$('#play-icon').textContent='Ⅱ';}
 function tick(now){const p=clamp((now-start)/duration);scrollTo(0,lerp(from,to,auto?p:smooth(p)));if(p<1)playRaf=requestAnimationFrame(tick);else stopPlay();}playRaf=requestAnimationFrame(tick);}
function showTip(el){if(!el?.dataset.tip)return;$('#tooltip').textContent=el.dataset.tip;$('#tooltip').hidden=false;}
function hideTip(){$('#tooltip').hidden=true;}
const delay=ms=>new Promise(r=>setTimeout(r,reduced.matches?0:ms));
async function gc(){if(state.busy)return;const plan=planGc(state.flash);if(!plan){state.flashMessage='GC 대상 또는 이동할 Free Page가 없습니다. 데이터를 수정하거나 초기화해 보세요.';refresh();return;}
 state.busy=true;state.gcPlan=plan;state.gcPhase='migration';state.flashMessage=`Block ${plan.victim}에서 Valid Page ${plan.moves.length}개 보존`;const token=++animationToken;refresh();await delay(1100);if(token!==animationToken)return;
 migrateGc(state.flash,plan);state.gcPhase='erase';state.flashMessage='Mapping 갱신 완료 · 원본 Block을 지웁니다.';refresh();await delay(900);if(token!==animationToken)return;
 eraseGc(state.flash,plan);state.busy=false;state.gcPhase='done';state.flashMessage=`Block ${plan.victim}의 모든 Page가 Free가 되었습니다.`;refresh();}
async function action(value){stopPlay();if(state.busy)return;const [key,val]=value.split(':');switch(key){
 case 'go':goTo(Number(val));return;
 case 'article':goTo('article');return;
 case 'power':state.power=!state.power;break;
 case 'lid':state.opened=!state.opened;break;
 case 'trap':state.trap=val;break;
 case 'bits':state.bits=Number(val);break;
 case 'charge':state.charge=Number(val);break;
 case 'cell-reset':state.charge=0;state.pulsing=false;break;
 case 'pulse':if(state.charge<10){state.charge=Math.min(10,state.charge+2);state.pulsing=true;setTimeout(()=>{state.pulsing=false;if(current===8)refresh();},800);}break;
 case 'select-page':state.selectedPage=Number(val);state.eraseMessage=`Page ${val} 선택됨`;break;
 case 'page-read':state.eraseMessage=`Page ${state.selectedPage} Read → ${state.erasePages[state.selectedPage]==='free'?'1111':'0101'}`;break;
 case 'page-program':if(state.erasePages[state.selectedPage]==='free'){state.erasePages[state.selectedPage]='used';state.eraseMessage=`Page ${state.selectedPage}에 0101 기록`;}else state.eraseMessage='이미 기록된 Page · 자유로운 overwrite는 불가능합니다.';break;
 case 'block-erase':state.erasePages.fill('free');state.eraseMessage='Block 전체 Erase → 모든 Page가 Free';break;
 case 'erase-reset':state.erasePages.fill('used');state.eraseMessage='Page를 선택해 동작을 비교해 보세요.';break;
 case 'lba':state.lba=Number(val);break;
 case 'update':{const w=writeLba(state.flash);state.lastWrite=w.ok?{...w,time:Date.now()}:null;state.lba=100;state.gcPhase='idle';state.flashMessage=w.ok?`${w.from} → ${w.to} · 새 Page에 v${w.value} 기록`:'Free Page가 부족합니다. GC로 공간을 확보하세요.';break;}
 case 'flash-reset':state.flash=createFlash();state.lastWrite=null;state.gcPhase='idle';state.gcPlan=null;state.flashMessage='초기 Mapping으로 돌아왔습니다.';break;
 case 'gc':gc();return;
 case 'balanced':state.balanced=Boolean(Number(val));break;
 case 'bad':state.badBlock=state.badBlock<0?0:-1;break;
 case 'wear':for(let i=0;i<6;i++){const r=wearCycle(state.wearCounts,state.balanced,state.badBlock);state.wearCounts=r.counts;state.lastWear=r.index;}break;
 case 'wear-reset':state.wearCounts=[2,3,1,2,0,1];state.badBlock=-1;state.lastWear=-1;break;
 case 'disturb':state.disturb=Boolean(Number(val));break;
 case 'flip':{const original=encode(),i=Number(val),errors=state.eccBits.filter((v,j)=>v!==original[j]).length;if(errors>=2&&state.eccBits[i]===original[i]){state.eccMessage='이 실험은 최대 2 bit 오류까지 비교합니다. 먼저 한 bit를 되돌려 주세요.';break;}}state.eccBits[Number(val)]^=1;state.eccResult=null;state.eccSample=false;state.eccMessage='읽은 bit가 바뀌었습니다. ECC로 확인해 보세요.';break;
 case 'ecc':{const d=decode(state.eccBits);state.eccResult=d;state.eccMessage=d.status==='corrected'?`${d.position+1}번 bit의 오류를 복구했습니다.`:d.status==='clean'?'검사 결과 오류가 없습니다.':'2 bit 오류를 검출했습니다. 이 부호로는 복구할 수 없습니다.';if(d.status==='corrected')state.eccBits=d.code;break;}
 case 'read-errors':state.eccBits=sampleBits(encode(),.34,.5);state.eccSample=true;state.eccResult=null;state.eccMessage='같은 전압 기준으로 읽어 여러 bit가 잘못 판정되었습니다.';break;
 case 'retry':if(state.eccSample){state.eccBits=sampleBits(encode(),.34,.72);state.eccResult=decode(state.eccBits);state.eccMessage='기준 전압 0.50 → 0.72 · 다시 읽은 값을 ECC로 확인했습니다.';}else state.eccMessage='전압 판정 오류 예시를 먼저 선택하세요. 임의의 bit 반전은 Retry로 되돌리지 않습니다.';break;
 case 'ecc-reset':state.eccBits=encode();state.eccResult=null;state.eccSample=false;state.eccMessage='bit를 클릭해 오류를 만들어 보세요.';break;
 case 'flow-next':{const max=current===17?writeSteps.length:(state.retry?retrySteps:readSteps).length;state.flowStep=(state.flowStep+1)%max;break;}
 case 'flow-reset':state.flowStep=-1;break;
 case 'retry-path':state.retry=Boolean(Number(val));state.flowStep=-1;break;
 default:return;
}refresh();}
document.addEventListener('click',event=>{const a=event.target.closest('[data-action]');if(a){action(a.dataset.action);return;}const g=event.target.closest('[data-go]');if(g){goTo(g.dataset.go);return;}if(event.target.closest('[data-article]'))goTo('article');});
document.addEventListener('input',event=>{const el=event.target;if(!el.dataset.range)return;stopPlay();state[el.dataset.range]=Number(el.value);panel.innerHTML=diagram(current);result();});
document.addEventListener('pointerover',event=>{const el=event.target.closest('[data-tip]');if(el)showTip(el);});
document.addEventListener('pointerout',event=>{if(event.target.closest('[data-tip]')&&!event.relatedTarget?.closest?.('[data-tip]'))hideTip();});
document.addEventListener('focusin',event=>showTip(event.target.closest('[data-tip]')));document.addEventListener('focusout',hideTip);
$('#nand-target').dataset.tip='NAND Flash는 전원이 꺼져도 데이터를 기억합니다. 클릭하면 더 가까이 들어갑니다.';
$('#die-stack').dataset.tip='Die는 실제 데이터를 담는 반도체 칩입니다. 클릭하면 칩 내부로 들어갑니다.';$('#die-stack').dataset.action='go:3';$('#die-stack').setAttribute('tabindex','0');$('#die-stack').setAttribute('role','button');$('#die-stack').setAttribute('aria-label','Die 내부로 들어가기');
$('#nand-target').addEventListener('click',event=>{if(event.target.closest('[data-action]'))return;if(current===2)action('lid');else goTo(2);});
$('#nand-target').addEventListener('keydown',e=>{if(e.target.closest('[data-action]'))return;if(e.key==='Enter'||e.key===' '){e.preventDefault();if(current===2)action('lid');else goTo(2);}});
$('#progress').addEventListener('input',e=>{stopPlay();scrollTo(0,Number(e.target.value)/100*pitch());});
$('#previous').addEventListener('click',()=>goTo(current-1));$('#next').addEventListener('click',()=>goTo(current===count-1?'article':current+1));
$('#play').addEventListener('click',()=>{if(playing){stopPlay();return;}if(current===count-1)scrollTo(0,0);goTo(count-1,true);});
$('#contents').addEventListener('click',()=>{stopPlay();dialog.showModal();schedule();});$('#close-toc').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',schedule);
addEventListener('keydown',event=>{
 const isEditingTarget=target=>target instanceof Element&&Boolean(target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"], [data-code-editor], .monaco-editor, .CodeMirror'));
 if (!event.metaKey && !event.ctrlKey && !event.altKey && !event.isComposing && !isEditingTarget(event.target) && event.key.toLowerCase() === 'h') {window.location.assign(homeUrl.href);return;}
 if(event.key==='Escape'){stopPlay();hideTip();if(dialog.open)dialog.close();return;}
 if(isEditingTarget(event.target)||event.metaKey||event.ctrlKey||event.altKey||event.isComposing)return;
 if((event.key==='Enter'||event.key===' ')&&event.target.matches('g[data-action]')){event.preventDefault();action(event.target.dataset.action);return;}
 if(event.key.toLowerCase()==='o'){event.preventDefault();if(dialog.open)dialog.close();else{stopPlay();dialog.showModal();schedule();}return;}
 if(dialog.open)return;
 if(event.key==='ArrowRight'){event.preventDefault();goTo(current+1);}if(event.key==='ArrowLeft'){event.preventDefault();goTo(current-1);}
 if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(event.key))stopPlay();
});
addEventListener('scroll',schedule,{passive:true});addEventListener('wheel',stopPlay,{passive:true});addEventListener('touchstart',stopPlay,{passive:true});addEventListener('resize',resize);document.addEventListener('visibilitychange',()=>{if(document.hidden)stopPlay();schedule();});reduced.addEventListener('change',()=>{stopPlay();schedule();});
addEventListener('pageshow',schedule);resize();render();
