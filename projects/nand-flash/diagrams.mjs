import {pagesOf,encode} from './model.mjs';
const rect=(x,y,w,h,fill='#344956',stroke='#647c8d',extra='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="${fill}" stroke="${stroke}" ${extra}/>`;
const text=(x,y,t,fill='#afc2cf',size=20,extra='')=>`<text x="${x}" y="${y}" fill="${fill}" font-size="${size}" ${extra}>${t}</text>`;
const path=(d,stroke='#658596',extra='')=>`<path d="${d}" fill="none" stroke="${stroke}" ${extra.includes('stroke-width')?'':'stroke-width="1.5"'} ${extra}/>`;
const tip=(label,content,body,action='')=>`<g ${action?'tabindex="0" role="button"':'role="group"'} aria-label="${label}: ${content}" data-tip="${content}" ${action?`data-action="${action}"`:''}>${body}</g>`;
const svg=(body,name="diagram")=>`<svg viewBox="0 0 1000 680" class="diagram-svg" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="face" x2=".6" y2="1"><stop stop-color="#536674"/><stop offset="1" stop-color="#344957"/></linearGradient><linearGradient id="active-face" x2=".7" y2="1"><stop stop-color="#5b8297"/><stop offset="1" stop-color="#35576b"/></linearGradient><pattern id="invalid-hatch" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M0 8L8 0" stroke="#9c887c" opacity=".35"/></pattern></defs>${body}</svg>`.replaceAll('id="face"',`id="${name}-face"`).replaceAll('id="active-face"',`id="${name}-active-face"`).replaceAll('id="invalid-hatch"',`id="${name}-invalid-hatch"`).replaceAll('url(#face)',`url(#${name}-face)`).replaceAll('url(#active-face)',`url(#${name}-active-face)`).replaceAll('url(#invalid-hatch)',`url(#${name}-invalid-hatch)`);
const plate=(x,y,w,h,active=false,depth=12)=>rect(x+3,y+depth,w,h,'#1d303d','#2d4352')+rect(x,y,w,h,active?'url(#active-face)':'url(#face)',active?'#9dc9da':'#6a8291',active?'class="selection-pulse"':'');
export function dieDiagram(zoom=false) {
 if(zoom){
  let body=plate(125,100,710,360)+text(155,145,'Plane 0','#bed6e4',25);
  for(let i=0;i<6;i++){const x=157+(i%3)*216,y=181+Math.floor(i/3)*124;body+=tip(`Block ${i}`,'Plane 안의 Block. 전체가 함께 지워지는 영역입니다.',plate(x,y,180,95,i===1,8)+text(x+90,y+56,`Block ${i}`,i===1?'#d6eef7':'#9fb8c9',22,'text-anchor="middle"'),i===1?'go:block':'');}
  return svg(`<g transform="matrix(1 -.19 .32 .85 -35 145)">${body}</g>`,'plane');
 }

 let blocks='';
 for(let plane=0;plane<2;plane++){
  blocks+=rect(100+plane*340,110,315,255,'#263b49','#647a88');
  blocks+=text(120+plane*340,140,`Plane ${plane}`,'#bccdd7',19);
  for(let i=0;i<6;i++){
   const x=120+plane*340+(i%3)*96,y=167+Math.floor(i/3)*85,active=plane===0&&i===1;
   blocks+=tip('Block',`Plane ${plane} 안의 Block ${i}. 여러 Page를 묶어 지우는 단위입니다.`,plate(x,y,82,66,active,5)+Array.from({length:4},(_,j)=>path(`M${x+9} ${y+15+j*11}h62`,active?'#91c2d5':'#687f8d','opacity=".5"')).join(''),active?(zoom?'go:block':'go:plane'):'');
  }
 }
 return svg(`<g class="die-zoom" transform="${zoom?'translate(-245 -100) scale(1.6)':'translate(0 0)'}"><g transform="matrix(1 -.25 .45 .72 -5 200)">${plate(65,70,720,340)}${blocks}${text(89,395,'Die','#c2d1db',23)}</g></g>`,zoom?'plane':'die');
}
export function blockDiagram(selected=3){
 let pages='';for(let i=7;i>=0;i--){const y=110+i*42;pages+=tip(`Page ${i}`,'Page는 읽고 쓰는 단위입니다. Block 전체가 함께 지워집니다.',plate(195,y,525,51,i===selected,7)+text(220,y+33,`Page ${i}`,i===selected?'#deeff6':'#9aafbd',18),i===selected?'go:page':'');}
 return svg(`<g transform="matrix(1 -.21 .4 .75 -20 160)">${pages}</g>${path('M850 225h15v285h-15')}${text(890,366,'Block','#adcad9',23)}`,'block');
}
export function pageDiagram(){
 let cells='';for(let row=0;row<4;row++)for(let col=0;col<10;col++){const x=170+col*61,y=145+row*72,selected=row===1&&col===5;cells+=tip('Cell','전하 상태가 Vth를 바꾸는 최소 저장 소자입니다.',plate(x,y,43,49,selected,7)+`<circle cx="${x+21}" cy="${y+24}" r="${5+(row+col)%4}" fill="${selected?'#b6dfed':'#7c9dad'}"/>`,selected?'go:cell':'');}
 return svg(`<g transform="matrix(1 -.19 .38 .75 -30 180)">${plate(142,112,666,353)}${cells}${path('M155 240H812','#8fbccd','class="meaningful-flow" stroke-dasharray="7 13"')}${text(160,455,'Page','#b9cedb',23)}</g>`,'page');
}

export function computerDiagram(s, id) {
  const internal=id==='storage',ending=id==='ending',off=!ending&&(internal||s.documentPhase===2);
  const saved=ending||internal||s.documentPhase>0, restored=ending||s.documentPhase===3;
  return `<div class="computer-object ${off?'is-off':''} ${internal?'is-open':''}">
    <div class="computer-screen"><div class="screen-top"><span>내 컴퓨터</span><span>${off?'전원 꺼짐':restored?'다시 켜진 화면':'작업 중'}</span></div>
      <div class="desktop-content" ${off?'aria-hidden="true"':''}>
        <div class="document-window"><div class="document-title"><span class="file-icon" aria-hidden="true">≡</span> 기억.txt <span>${saved?'저장됨':'저장 전'}</span></div>
        <p>오늘의 생각을<br>내일도 꺼내볼 수 있도록.</p><div class="document-lines" aria-hidden="true"><i></i><i></i><i></i></div>
        <div class="document-status">${restored?'✓ 같은 문서가 다시 열렸습니다.':saved?'✓ 저장장치에 기록되었습니다.':'아직 저장하지 않은 문서입니다.'}</div></div>
      </div><div class="power-off-message" ${off?'':'aria-hidden="true"'}>화면은 꺼졌습니다.<br><span>저장한 문서는 어디에 있을까요?</span></div>
    </div><div class="computer-base"><div class="computer-components"><div class="ram-component"><span>RAM</span><small>작업 중인 데이터</small></div><div class="storage-component"><span>SSD</span><small>저장한 파일</small><i class="retained-file">기억.txt</i></div></div><div class="trackpad"></div></div>
    <div class="computer-caption">${internal?'전원 없이 남아 있는 쪽은 저장장치입니다.':ending?'다시 열린 한 장의 문서. 그 뒤에는 여러 계층의 협력이 있습니다.':off?'저장장치의 상태는 전원이 없어도 남습니다.':'① 저장　→　② 정상 종료　→　③ 다시 켜기'}</div>
  </div>`;
}

export function cellDiagram(s, scene) {
  const q=s.charge,vth=.2+q*.055,read=scene==='read',program=scene==='program',on=read||program||s.power;
  const conduction=s.vref>vth&&on;
  let electrons='';
  for(let i=0;i<10;i++) electrons+=`<circle class="stored-electron" cx="${320+(i%5)*46}" cy="${245+Math.floor(i/5)*30}" r="6" fill="#b4dfed" opacity="${i<q?1:.08}"/>`;
  const channel=path('M276 365H565',conduction&&read?'#b3e2ec':'#688293',`stroke-width="${conduction&&read?5:2}" ${conduction&&read?'class="meaningful-flow" stroke-dasharray="9 12"':''}`);
  const body=`${text(410,81,read?'가하는 기준 전압':program?'Program 전압 펄스':on?'전원 공급 중':'전원 꺼짐','#adc7d5',21,'text-anchor="middle"')}
    ${path('M410 98V158',on?'#9bc9db':'#3f5665',`stroke-width="2" ${program&&s.pulsing?'class="program-electrons"':''}`)}
    ${rect(212,158,400,45,'#4a6375','#8ba8b9')}${text(410,188,'Control Gate','#d5e8f1',21,'text-anchor="middle"')}
    ${rect(233,215,358,97,'#243b4b','#7596a8')}${rect(270,233,282,62,'#416176','#92b8ca')}${electrons}
    ${path('M592 264H640')}${text(654,262,'전하 저장 영역','#b8d0dd',21)}${text(654,294,'주변은 절연층','#8faab9',18)}
    ${rect(196,334,432,111,'#293f4f','#668394')}${rect(220,336,56,54,'#58788d','#8db4c7')}${rect(565,336,42,54,'#58788d','#8db4c7')}${channel}
    ${text(410,415,read?(conduction?'도통 · 전류가 흐름':'비도통 · 전류 없음'):'Channel','#c0d6e2',21,'text-anchor="middle"')}
    ${program&&s.pulsing?path('M410 350V281','#b9e5ee','class="program-electrons" stroke-dasharray="3 14" stroke-width="5"'):''}
    ${text(750,372,read?'SLC 판정 예시':program?'목표 Vth':on?'전하가 만든 차이':'전하 상태 유지','#8eafc1',18,'text-anchor="middle"')}
    ${text(750,427,read?(conduction?'1':'0'):program?`${Math.round(q/2)} / 5`:'Vth','#d8edf5',49,'text-anchor="middle"')}
    ${path('M190 549H843','#637e8e')}${text(145,556,'Vth','#b2cdda',20)}
    ${program?rect(190+.72*650,510,.07*650,68,'#355463','none')+text(190+.755*650,492,'목표 구간','#accfdc',18,'text-anchor="middle"'):''}
    ${rect(190,535,650*vth,27,'#5b8aa0','none','class="vth-bar"')}
    ${path(`M${190+vth*650} 522v56`,'#c3e6f0','stroke-width="2" class="vth-marker"')}
    ${read?path(`M${190+s.vref*650} 499v93`,'#d8c9a6','stroke-width="2" stroke-dasharray="5 5"')+text(190+s.vref*650,484,`Vref ${s.vref.toFixed(2)}`,'#dfd1b1',20,'text-anchor="middle"'):''}
    ${text(190,603,'낮음','#89a7b9',18)}${text(841,603,'높음','#89a7b9',18,'text-anchor="end"')}${text(510,640,`Vth ${vth.toFixed(2)} · 전압과 전하 수는 설명용 상대값`,'#819faf',18,'text-anchor="middle"')}`;
  if(s.compact) return `<div class="compact-cell">${svg(body,scene).replace('viewBox="0 0 1000 680"','viewBox="165 130 470 323"')}<p class="compact-cell-caption">전하 저장 영역 · 절연층 안에 유지되는 상태</p><div class="compact-voltage"><span>Vth ${vth.toFixed(2)}</span><div class="compact-voltage-track"><b style="width:${vth*100}%"></b>${read?`<i style="left:${s.vref*100}%"></i>`:''}${program?'<em></em>':''}</div><strong>${read?`판정 ${conduction?'1':'0'}`:program?`${q/2} / 5`:'상대값'}</strong></div></div>`;
  return svg(body,scene);
}

export function densityDiagram(bits=1,drift=0,disturb=false) {
  const n=2**bits,left=115,width=780;let curves='';
  for(let i=0;i<n;i++) {
    const center=left+(i+.5)*width/n,mid=center+drift*(disturb?1:-1)*(i%2?42:58),half=Math.min(68,width/n*.39)+drift*12;
    curves+=`<path class="distribution" d="M${mid-half} 431C${mid-half*.58} 431 ${mid-half*.42} 219 ${mid} 218C${mid+half*.42} 219 ${mid+half*.58} 431 ${mid+half} 431Z" fill="${i===1?'#648da3':'#3b586c'}" stroke="${i===1?'#b1d8e6':'#7698ad'}" stroke-width="1.5" fill-opacity=".65"/>`;
    curves+=text(center,467,`${i}`,'#aec9d8',n===16?18:21,'text-anchor="middle"');
    if(i>0)curves+=path(`M${left+i*width/n} 188v249`,'#9bb9c7','stroke-dasharray="3 8" opacity=".65"');
  }
  return svg(`${text(115,110,`${bits} bit / Cell`,'#d4e6ef',35)}${text(895,110,`${n}개 상태`,'#b5d0de',25,'text-anchor="end"')}${text(80,182,'Cell 수','#8ba9b9',18)}${path('M115 177V435H915','#647e91')}${curves}${text(500,526,'문턱 전압 Vth →','#b1cbd9',22,'text-anchor="middle"')}${text(500,582,drift?'분포가 읽기 경계(점선)를 넘으면 잘못 판정될 수 있습니다.':n===2?'두 상태 사이에 넓은 판정 여유가 있습니다.':`${n}개 상태를 구분하는 ${n-1}개 경계 · 상태 간 여유가 좁아집니다.`,'#aecad9',21,'text-anchor="middle"')}${text(500,632,'같은 전압 범위의 개념 비교 · 상태 번호는 실제 bit 부호가 아닙니다.','#819fae',17,'text-anchor="middle"')}`,'density');
}

export function eraseDiagram(s) {
  return `<div class="erase-object ${s.eraseEffect||''}"><div class="erase-request"><span>컴퓨터의 요청</span><strong>기억.txt 수정</strong><p>선택한 Page만 다시 쓸 수 있을까?</p><div class="constraint-equation"><b>Read / Program</b><span>Page 단위</span><b>Erase</b><span>Block 전체</span></div></div>
    <div class="erase-block"><div class="block-label">하나의 Block</div>${s.erasePages.map((p,i)=>`<button class="erase-page ${p} ${i===s.selectedPage?'selected':''}" data-action="select-page:${i}" aria-pressed="${i===s.selectedPage}" aria-label="Page ${i}, ${p==='free'?'Free':'기록됨'}"><span>Page ${i}</span><span>${p==='free'?'Free':'기록된 데이터'}</span><i aria-hidden="true">${p==='free'?'―':'▪ ▪ ▪ ▪ ▪ ▪ ▪ ▪'}</i></button>`).join('')}</div>
    <p class="object-message" role="status" aria-atomic="true">${s.eraseMessage}</p></div>`;
}

export function mappingDiagram(s) {
  const f=s.flash,selected=f.mapping[s.lba],counts=['valid','invalid','free','staged'].map(k=>pagesOf(f).filter(p=>p.state===k).length);
  const point=ppa=>{const [b,p]=ppa.match(/\d+/g).map(Number);return [356+b*160,163+p*89];};
  let routes='';
  if(selected){const [x,y]=point(selected);routes+=path(`M153 282C245 282 238 ${y} ${x-65} ${y}`,'#a3cfdf','class="mapping-line" stroke-width="2"');}
  const moves=s.gcPlan&&['copy','mapping'].includes(s.gcPhase)?s.gcPlan.moves:s.writePlan&&['program','mapping'].includes(s.writePhase)?[{from:s.writePlan.from,to:s.writePlan.to}]:[];
  for(const m of moves){if(!m.from)continue;const [x,y]=point(m.from),[a,b]=point(m.to);routes+=path(`M${x} ${y}Q${(x+a)/2} ${Math.min(y,b)-105} ${a} ${b}`,'#d1edf4','class="meaningful-flow" stroke-dasharray="6 10" stroke-width="3"');}
  const isGc=s.sceneId==='gc';
  const steps=isGc?['Valid 복사','Mapping 갱신','Block Erase','Free 확보']:['새 Page Program','Mapping 이동','옛 Page Invalid'];
  const phase=isGc?['idle','copy','mapping','erase','done'].indexOf(s.gcPhase)-1:['idle','program','mapping','done'].indexOf(s.writePhase)-1;
  return `<div class="mapping-object"><div class="mapping-grid"><div class="host-address"><span class="block-label">컴퓨터 · Host</span>${[100,101,102].map(lba=>`<button data-action="lba:${lba}" aria-pressed="${s.lba===lba}" class="lba ${s.lba===lba?'selected':''}">LBA ${lba}</button>`).join('')}<div class="mapping-readout"><small>FTL Mapping</small><b>LBA ${s.lba}</b><span>↓</span><strong>${selected}</strong></div></div>
    <svg class="mapping-routes" viewBox="0 0 1000 520" aria-hidden="true">${routes}</svg>
    <div class="flash-blocks">${f.blocks.map(b=>`<div class="flash-block ${s.gcPlan?.victim===b.id&&s.gcPhase!=='idle'?'victim':''} ${s.gcPhase==='erase'&&s.gcPlan?.victim===b.id?'erasing':''}"><div class="block-label">Block ${b.id}<small>${b.wear?`Erase ${b.wear}회`:''}</small></div>${b.pages.map((p,i)=>`<div class="flash-page ${p.state} ${p.ppa===selected?'mapped':''} ${p.ppa===s.writePlan?.to&&s.writePhase==='program'?'programming':''}" data-ppa="${p.ppa}" aria-label="${p.ppa}, ${p.state}${p.lba!==null?`, LBA ${p.lba}, 버전 ${p.value}`:''}"><span class="page-address">P${i}</span><strong>${p.lba===null?'―':`${p.lba} <em>v${p.value}</em>`}</strong><small>${{valid:'Valid',invalid:'Invalid',free:'Free',staged:'Program 완료'}[p.state]}</small></div>`).join('')}</div>`).join('')}</div></div>
    <div class="capacity-strip" aria-label="Valid ${counts[0]}, Invalid ${counts[1]}, Free ${counts[2]}, Mapping 갱신 대기 ${counts[3]}">${['valid','invalid','free','staged'].map((k,i)=>`<span class="${k}" style="flex:${counts[i]}"></span>`).join('')}</div>
    <div class="flash-legend"><span><i class="valid"></i>Valid <b>${counts[0]}</b></span><span><i class="invalid"></i>Invalid <b>${counts[1]}</b></span><span><i class="free"></i>Free <b>${counts[2]}</b></span>${counts[3]?`<span><i class="staged"></i>갱신 대기 <b>${counts[3]}</b></span>`:''}</div>
    ${s.sceneId==='address'?'':`<ol class="operation-steps">${steps.map((name,i)=>`<li class="${i===phase?'active':i<phase?'complete':''}"><span>${i+1}</span>${name}</li>`).join('')}</ol>`}
    <p class="object-message" role="status" aria-atomic="true">${s.flashMessage}</p></div>`;
}

export function wearDiagram(s) {
  const max=Math.max(12,...s.wearCounts);
  return `<div class="wear-object"><div class="wear-caption">Block별 P/E Cycle <span>설명용 횟수 비교</span></div><div class="wear-bars">${s.wearCounts.map((count,i)=>`<div class="wear-column ${s.badBlock===i?'bad':''} ${s.lastWear===i?'selected':''}"><strong>${s.badBlock===i?'제외':count}</strong><div class="wear-track"><div class="wear-fill" style="height:${count/max*100}%"></div></div><span>B${i}</span></div>`).join('')}</div><p class="object-message">${s.balanced?'덜 사용한 Block으로 다음 P/E를 분산합니다.':'같은 Block에 P/E가 집중됩니다.'}</p><p class="diagram-note">마모는 절연층과 읽기 특성의 변화입니다. 막대가 실제 수명을 예측하지는 않습니다.</p></div>`;
}

export function eccDiagram(s) {
  const original=encode(),result=s.eccResult;
  return `<div class="ecc-object"><div class="ecc-label"><span>데이터 4 bit + 검사 4 bit</span><strong>확장 Hamming (8,4)</strong></div><div class="bit-word">${s.eccBits.map((bit,i)=>`<button data-action="flip:${i}" class="bit ${bit!==original[i]?'changed':''} ${result?.position===i?'corrected':''}" aria-label="${i+1}번 bit ${bit}, ${[2,4,5,6].includes(i)?'데이터':'검사'}, 뒤집기" aria-pressed="${bit!==original[i]}"><small>${i+1}</small><b>${bit}</b><span>${[2,4,5,6].includes(i)?'데이터':'검사'}</span></button>`).join('')}</div>
    <div class="ecc-check ${result?.status||''}" role="status" aria-atomic="true"><span>${result?.status==='corrected'?'✓ 복구됨':result?.status==='uncorrectable'?'! 복구 한계':result?.status==='clean'?'✓ 검사 통과':'오류를 만들어 보세요'}</span><p>${s.eccMessage}</p>${result?.data?`<strong>읽은 데이터　${result.data.join(' ')}</strong>`:''}</div>
    ${s.eccSample?`<div class="retry-reference"><span>같은 전하 상태</span><div><i style="left:${s.retried?72:50}%"></i><b style="left:61%"></b><b style="left:82%"></b></div><span>Vref ${s.retried?'0.72':'0.50'}</span></div>`:''}
    <p class="diagram-note">1 bit 오류 복구 · 2 bit 오류 검출 · 현대 SSD의 BCH / LDPC 전체를 재현하지 않는 교육 모델</p></div>`;
}

export function flowDiagram(steps,active,write,s) {
  const done=active===steps.length-1, label=active<0?'기억.txt':steps[active];
  const flash=s.flowFlash,ppa=flash.mapping[100],page=pagesOf(flash).find(p=>p.ppa===ppa),block=flash.blocks[0];
  const zone=active<0?0:write?([0,0,1,1,2,1,2,0][active]):active===steps.length-1?0:[0,1,2,2,1,2,1][active];
  return `<div class="flow-object"><div class="flow-lanes">
    <div class="flow-host ${zone===0?'active':''}"><span class="zone-title">컴퓨터</span><div class="mini-screen"><span>기억.txt</span><p>${done?'오늘의 생각을<br>내일도 꺼내볼 수 있도록.':write?'문서 수정':'문서 열기'}</p><b>${done?`✓ v${page.value} ${write?'저장됨':'읽기 완료'}`:'Host'}</b></div></div>
    <div class="flow-controller ${zone===1?'active':''}"><span class="zone-title">SSD Controller</span><div class="controller-core"><b class="${/FTL|Mapping/.test(label)?'active':''}">FTL</b><span>LBA 100 → ${write&&active>=2&&active<5?`${ppa} · 새 위치 ${s.flowPlan?.to}`:ppa}</span><b class="${/ECC/.test(label)?'active':''}">ECC</b><span>${write?(active>=3?'데이터 + 검사 bit':'검사 bit 준비'):'오류 확인 · 복구'}</span></div></div>
    <div class="flow-nand ${zone===2?'active':''}"><span class="zone-title">NAND Flash</span><div class="flow-pages">${block.pages.map(p=>{
      // The model commits atomically; the overview reveals its two effects in sequence.
      const invalid=p.state==='invalid'&&(!write||active>=6);
      return `<div class="${p.state==='staged'||p.ppa===ppa&&active>=(write?5:2)?'programmed':''} ${invalid?'invalid':''}"><span>${p.ppa}</span><b>${p.lba===null?'Free':invalid?'Invalid':`v${p.value}`}</b></div>`;
    }).join('')}</div></div>
    <div class="flow-connection" aria-hidden="true"><span class="flow-packet zone-${zone}">${active<0?'요청 대기':label}</span></div>
    </div><ol class="flow-step-list">${steps.map((step,i)=>`<li class="${i===active?'active':i<active?'complete':''}"><span>${i+1}</span>${step}</li>`).join('')}</ol>
    <p class="diagram-note">${write?'처리 순서를 펼친 개념도 · 실제 SSD는 병렬 처리하며 캐시와 전원 차단 복구도 관리합니다.':'Retry는 필요할 때만 수행합니다. 재시도 후에도 복구할 수 없으면 읽기 실패를 보고합니다.'}</p></div>`;
}
