import {pagesOf,encode,sampleThresholds} from './model.mjs';
const rect=(x,y,w,h,fill='#344956',stroke='#647c8d',extra='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="${fill}" stroke="${stroke}" ${extra}/>`;
const text=(x,y,t,fill='#afc2cf',size=20,extra='')=>`<text x="${x}" y="${y}" fill="${fill}" font-size="${size}" ${extra}>${t}</text>`;
const path=(d,stroke='#658596',extra='')=>`<path d="${d}" fill="none" stroke="${stroke}" ${extra.includes('stroke-width')?'':'stroke-width="1.5"'} ${extra}/>`;
const tip=(label,content,body,action='')=>`<g ${action?'tabindex="0" role="button"':'role="group"'} aria-label="${label}: ${content}" data-tip="${content}" ${action?`data-action="${action}"`:''}>${body}</g>`;
const svg=(body,name="diagram")=>`<svg viewBox="0 0 1000 680" class="diagram-svg" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="face" x2=".6" y2="1"><stop stop-color="#536674"/><stop offset="1" stop-color="#344957"/></linearGradient><linearGradient id="active-face" x2=".7" y2="1"><stop stop-color="#5b8297"/><stop offset="1" stop-color="#35576b"/></linearGradient><pattern id="invalid-hatch" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M0 8L8 0" stroke="#9c887c" opacity=".35"/></pattern></defs>${body}</svg>`.replaceAll('id="face"',`id="${name}-face"`).replaceAll('id="active-face"',`id="${name}-active-face"`).replaceAll('id="invalid-hatch"',`id="${name}-invalid-hatch"`).replaceAll('url(#face)',`url(#${name}-face)`).replaceAll('url(#active-face)',`url(#${name}-active-face)`).replaceAll('url(#invalid-hatch)',`url(#${name}-invalid-hatch)`);
const plate=(x,y,w,h,active=false,depth=12)=>rect(x+3,y+depth,w,h,'#1d303d','#2d4352')+rect(x,y,w,h,active?'url(#active-face)':'url(#face)',active?'#9dc9da':'#6a8291',active?'class="selection-pulse"':'');
const target=(x,y,w,h)=>`<path class="target-frame" d="M${x} ${y+18}v-18h18 M${x+w-18} ${y}h18v18 M${x+w} ${y+h-18}v18h-18 M${x+18} ${y+h}h-18v-18"/><g transform="translate(${x+w-13} ${y-13})"><rect class="target-badge" width="27" height="27" rx="6"/><path class="target-arrow" d="M8 19L19 8M9 8h10v10"/></g>`;
const microArray=(x,y,w,h,columns=8,rows=5)=>Array.from({length:rows},(_,r)=>Array.from({length:columns},(_,c)=>rect(x+c*w/columns,y+r*h/rows,w/columns-3,h/rows-3,'#314c5b','#658494','stroke-width=".5"')).join('')).join('');
export function dieDiagram(zoom=false) {
 if(zoom){
  let body=plate(125,100,710,390)+text(155,141,'Plane 0','#bed6e4',25);
  for(let i=0;i<6;i++){const x=157+(i%3)*216,y=174+Math.floor(i/3)*127;body+=tip(`Block ${i}`,'Plane 안의 Block. 전체가 함께 지워지는 영역입니다.',plate(x,y,180,104,i===1,8)+microArray(x+14,y+12,152,45,8,3)+text(x+90,y+84,`Block ${i}`,i===1?'#d6eef7':'#9fb8c9',22,'text-anchor="middle"')+(i===1?target(x-5,y-5,190,114):''),i===1?'go:block':'');}
  body+=rect(157,438,612,27,'#263e4c','#708f9e')+text(463,458,'선택 · 읽기 회로','#9cb9ca',18,'text-anchor="middle"');
  return svg(`<g transform="matrix(1 -.15 .26 .84 -5 125)">${body}</g>${text(520,639,'표시된 Block 1 선택 →','#bfdce9',22,'text-anchor="middle"')}`,'plane');
 }
 let body=plate(87,77,724,453,false,16)+rect(101,90,695,425,'#233945','#6a8795');
 // Bond pads and buses explain how dense storage arrays connect to peripheral logic.
 for(let i=0;i<24;i++){const x=118+i*27.4;body+=rect(x,97,15,10,'#8b9b99','#a5b5b6','stroke-width=".5"')+rect(x,498,15,10,'#7c9196','#a5b5b6','stroke-width=".5"');}
 for(let p=0;p<2;p++){
  const x=130+p*331;
  let plane=rect(x,127,302,282,p===0?'#355464':'#2a424f',p===0?'#98c1d0':'#536d7a')+text(x+17,157,`Plane ${p}`,'#d4e6ed',24);
  for(let r=0;r<4;r++)for(let c=0;c<4;c++){const bx=x+36+c*62,by=177+r*45;plane+=rect(bx,by,55,37,'#2f4855','#6b8a9a','stroke-width=".8"')+microArray(bx+5,by+5,47,28,6,4);}
  plane+=rect(x+11,177,15,175,'#607f8e','#88a6b4')+rect(x+36,365,241,26,'#486576','#88a6b4')+text(x+158,384,'읽기 회로','#b6d0dd',17,'text-anchor="middle"');
  body+=tip(`Plane ${p}`,'저장 배열과 동작 회로로 구성된 구획입니다.',plane+(p===0?target(x-6,121,314,294):''),p===0?'go:plane':'');
  for(let i=0;i<7;i++)body+=path(`M${x+45+i*30} 410v${12+i*2}h${p===0?34:-34}v${23-i*2}`,'#6f98a9','stroke-width="1"');
 }
 body+=rect(142,451,330,30,'#3e5866','#7292a3')+text(307,473,'주소 선택 · 동작 제어','#b1cbd9',18,'text-anchor="middle"')+rect(496,451,240,30,'#3b5665','#7292a3')+text(616,473,'데이터 입출력','#b1cbd9',18,'text-anchor="middle"');
 return svg(`<g transform="matrix(1 -.16 .25 .86 -5 117)">${body}</g>${text(506,625,'Plane 0 선택 →','#c1dde9',24,'text-anchor="middle"')}${text(506,662,'배열 · 주변 회로 · 연결부를 펼친 개념도','#8ca9ba',18,'text-anchor="middle" class="diagram-detail"')}`,'die');
}
export function blockDiagram(selected=3){
 let pages='';for(let i=7;i>=0;i--){const y=110+i*42;pages+=tip(`Page ${i}`,'Page는 읽고 쓰는 단위입니다. Block 전체가 함께 지워집니다.',plate(195,y,525,51,i===selected,7)+text(220,y+33,`Page ${i}`,i===selected?'#deeff6':'#9aafbd',18)+microArray(337,y+12,358,24,24,2)+(i===selected?target(189,y-4,537,56):''),i===selected?'go:page':'');}
 return svg(`<g transform="matrix(1 -.21 .4 .75 -20 160)">${pages}</g>${path('M850 225h15v285h-15')}${text(890,366,'Block','#adcad9',23)}`,'block');
}
export function pageDiagram(compact=false){
 let array=plate(91,116,536,319,false,12)+rect(105,133,35,281,'#4d6c7c','#8aa9b9');
 for(let c=0;c<12;c++)array+=path(`M${171+c*37} 120V486`,'#658697','stroke-width="1.2"');
 for(let r=0;r<6;r++){
  const y=159+r*42,active=r===2;
  array+=path(`M114 ${y+11}H615`,active?'#c0e3ee':'#536f80',`stroke-width="${active?4:1.5}"`);
  for(let c=0;c<12;c++)array+=rect(157+c*37,y,28,23,active?'#6691a4':'#2d4656',active?'#bcdde9':'#567485','stroke-width="1"')+`<ellipse cx="${171+c*37}" cy="${y+11}" rx="5" ry="7" fill="${active?'#c5e3ed':'#7896a5'}"/>`;
 }
 array+=tip('Cell 선택','선택한 저장 소자 안으로 들어갑니다.',rect(410,238,48,38,'transparent','none')+target(410,238,48,38),'go:cell');
 let readout=rect(112,486,507,63,'#294555','#749cad')+text(365,530,compact?'읽기 회로':'읽기 회로 · 각 Cell의 상태를 판정','#c3dfeb',compact?36:22,'text-anchor="middle"');
 for(let c=0;c<12;c++)readout+=path(`M${171+c*37} 550v26`,'#789fb1')+rect(158+c*37,576,27,26,'#466b80','#8ab5c8')+text(171+c*37,595,c%3===0?'0':'1','#d4eaf4',17,'text-anchor="middle"');
 const magnified=tip('Cell 확대','선택한 저장 소자 안으로 들어갑니다.',`<circle cx="811" cy="287" r="108" fill="#233b4a" stroke="#779bac" stroke-width="2"/>${rect(739,223,145,24,'#567f93','#a5c8d6')}${rect(745,259,133,46,'#416579','#87afc2')}${rect(759,270,105,24,'#87b3c5','#c5e6ef')}${rect(736,320,151,32,'#355467','#7ba3b5')}${path('M760 336h100','#b5dbe7','stroke-width="3"')}${target(701,177,220,220)}${text(811,434,'Cell 안으로 →','#c9e7f3',25,'text-anchor="middle"')}`,'go:cell');
 return svg(`${text(357,84,compact?'Cell 집합 선택':'저장 배열에서 Cell 집합 선택','#b7d2df',compact?36:25,'text-anchor="middle"')}${array}${path('M458 257L670 230H700','#afd7e7','stroke-width="2"')}${magnified}${readout}${text(365,645,compact?'Page 데이터':'판정한 bit의 묶음 = Page 데이터','#bbd9e7',compact?36:24,'text-anchor="middle"')}${text(812,502,'연결 관계를 펼친 개념도','#8eabba',18,'text-anchor="middle" class="diagram-detail"')}${text(812,534,'0 / 1은 읽기 회로의 출력','#8eabba',18,'text-anchor="middle" class="diagram-detail"')}`,'page');
}

export function computerDiagram(s, id) {
  const internal=id==='storage',ending=id==='ending',off=!ending&&(internal||s.documentPhase===2);
  const saved=ending||internal||s.documentPhase>0, restored=ending||s.documentPhase===3;
  const keys=Array.from({length:4},(_,r)=>Array.from({length:14},(_,c)=>rect(132+c*52+r*3,19+r*24,44,18,'#243b4b','#658292','stroke-width="1"')).join('')).join('');
  const keyboard=`<svg class="computer-keyboard" viewBox="0 0 1000 220" aria-hidden="true">${rect(115,8,777,110,'#1b2f3d','#516f80')}${keys}${rect(375,117,250,16,'#263f50','#6b8696')}${rect(395,148,210,57,'#365366','#6e8b9c')}${Array.from({length:12},(_,i)=>path(`M82 ${24+i*7}h15M910 ${24+i*7}h15`,'#78909d','opacity=".5"')).join('')}${path('M39 174h42m-37 15h20M931 176h35','#93a8b1','stroke-width="5"')}</svg>`;
  const motherboard=`<svg class="motherboard" viewBox="0 0 1000 270" aria-hidden="true">${rect(101,14,798,239,'#263f4a','#74919e')}${rect(128,35,217,176,'#304b57','#587988')}${rect(173,70,126,98,'#486673','#89a8b6')}${text(236,128,'CPU','#c6d9e0',26,'text-anchor="middle"')}${Array.from({length:10},(_,i)=>path(`M${181+i*12} 68V50M${181+i*12} 171v23M153 ${79+i*8}h18`,'#91a8b1','stroke-width="3"')).join('')}${Array.from({length:6},(_,i)=>path(`M301 ${86+i*12}H${380+i*8}V${48+i*7}H865`,'#6a93a3','stroke-width="1.2"')).join('')}${path('M309 153H381V209H793V170','#aad4df','stroke-width="3"')}${rect(432,212,168,25,'#3a5360','#678695')}${text(516,230,'입출력 연결','#a8c4d2',17,'text-anchor="middle"')}${Array.from({length:12},(_,i)=>rect(410+i*36,18,17,10,'#8da19f','#a3b6b7')).join('')}${Array.from({length:4},(_,i)=>`<circle cx="${i%2?881:119}" cy="${i<2?30:236}" r="5" fill="#253c48" stroke="#a1b5bd"/>`).join('')}</svg>`;
  return `<div class="computer-object ${off?'is-off':''} ${internal?'is-open':''}">
    <div class="computer-screen"><div class="camera-lens" aria-hidden="true"></div><div class="screen-top"><span>내 컴퓨터</span><span>${off?'전원 꺼짐':restored?'다시 켜진 화면':'작업 중'}</span></div>
      <div class="desktop-content" ${off?'aria-hidden="true"':''}>
        <div class="document-window"><div class="document-title"><span class="file-icon" aria-hidden="true">≡</span> 기억.txt <span>${saved?'저장됨':'저장 전'}</span></div>
        <p>오늘의 생각을<br>내일도 꺼내볼 수 있도록.</p><div class="document-lines" aria-hidden="true"><i></i><i></i><i></i></div>
        <div class="document-status">${restored?'✓ 같은 문서가 다시 열렸습니다.':saved?'✓ 저장장치에 기록되었습니다.':'아직 저장하지 않은 문서입니다.'}</div></div>
      </div><div class="power-off-message" ${off?'':'aria-hidden="true"'}>화면은 꺼졌습니다.<br><span>저장한 문서는 어디에 있을까요?</span></div>
    </div><div class="computer-hinge" aria-hidden="true"></div><div class="computer-base">${keyboard}<div class="computer-components">${motherboard}<div class="ram-component"><div class="ram-chips" aria-hidden="true"><i></i><i></i><i></i><i></i></div><span>RAM</span><small>전원 꺼짐 · 작업 공간</small></div><button class="storage-component" data-action="go:ssd" aria-label="파일이 남은 SSD 안으로 들어가기"><div class="ssd-chips" aria-hidden="true"><i></i><i></i><i></i></div><span>SSD <b aria-hidden="true">↗</b></span><small>저장한 파일이 남는 곳</small><i class="retained-file">기억.txt</i></button></div></div>
    <div class="computer-caption">${internal?'CPU · RAM · SSD의 연결을 펼친 개념도':ending?'다시 열린 한 장의 문서. 그 뒤에는 여러 계층의 협력이 있습니다.':off?'저장장치의 상태는 전원이 없어도 남습니다.':'① 저장　→　② 정상 종료　→　③ 다시 켜기'}</div>
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

export function densityDiagram(bits=1,drift=0,disturb=false,compact=false) {
  const n=2**bits,left=115,width=780;let curves='';
  for(let i=0;i<n;i++) {
    const center=left+(i+.5)*width/n,mid=center+drift*(disturb?1:-1)*(i%2?42:58),half=Math.min(68,width/n*.39)+drift*12;
    curves+=`<path class="distribution" d="M${mid-half} 431C${mid-half*.58} 431 ${mid-half*.42} 219 ${mid} 218C${mid+half*.42} 219 ${mid+half*.58} 431 ${mid+half} 431Z" fill="${i===1?'#648da3':'#3b586c'}" stroke="${i===1?'#b1d8e6':'#7698ad'}" stroke-width="1.5" fill-opacity=".65"/>`;
    curves+=text(center,467,`${i}`,'#aec9d8',n===16?18:21,'text-anchor="middle"');
    if(i>0)curves+=path(`M${left+i*width/n} 188v249`,'#9bb9c7','stroke-dasharray="3 8" opacity=".65"');
  }
  if(compact)return `<div class="compact-density"><div><b>${bits} bit / Cell · ${n}개 상태</b><span>높이 = Cell 수</span></div>${svg(`${path('M115 177V435H915','#647e91')}${curves}`,'density').replace('viewBox="0 0 1000 680"','viewBox="85 170 850 325"')}<p>낮은 Vth <span>문턱 전압 →</span> 높은 Vth</p><small>${drift?'분포가 점선을 넘으면 잘못 판정될 수 있습니다.':`${n-1}개의 경계로 상태를 구분합니다.`} 상대값 개념도.</small></div>`;
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
  return `<div class="mapping-object"><div class="mapping-grid"><div class="host-address"><span class="block-label">컴퓨터 · Host</span>${[100,101,102].map(lba=>`<button data-action="lba:${lba}" aria-pressed="${s.lba===lba}" class="lba ${s.lba===lba?'selected':''}">LBA ${lba}</button>`).join('')}<div class="mapping-readout"><small>FTL · 주소 연결</small><b>LBA ${s.lba}</b><span>↓</span><strong>${selected}</strong></div></div>
    <svg class="mapping-routes" viewBox="0 0 1000 520" aria-hidden="true">${routes}</svg>
    <div class="flash-blocks">${f.blocks.map(b=>`<div class="flash-block ${s.gcPlan?.victim===b.id&&s.gcPhase!=='idle'?'victim':''} ${s.gcPhase==='erase'&&s.gcPlan?.victim===b.id?'erasing':''}"><div class="block-label">Block ${b.id}<small>${b.wear?`Erase ${b.wear}회`:''}</small></div>${b.pages.map((p,i)=>`<div class="flash-page ${p.state} ${p.ppa===selected?'mapped':''} ${p.ppa===s.writePlan?.to&&s.writePhase==='program'?'programming':''}" data-ppa="${p.ppa}" aria-label="${p.ppa}, ${p.state}${p.lba!==null?`, LBA ${p.lba}, 버전 ${p.value}`:''}"><span class="page-address">P${i}</span><strong>${p.lba===null?'―':`${p.lba} <em>v${p.value}</em>`}</strong><small>${{valid:'Valid',invalid:'Invalid',free:'Free',staged:'기록 완료'}[p.state]}</small></div>`).join('')}</div>`).join('')}</div></div>
    <div class="capacity-strip" aria-label="Valid ${counts[0]}, Invalid ${counts[1]}, Free ${counts[2]}, Mapping 갱신 대기 ${counts[3]}">${['valid','invalid','free','staged'].map((k,i)=>`<span class="${k}" style="flex:${counts[i]}"></span>`).join('')}</div>
    <div class="flash-legend"><span><i class="valid"></i><span>Valid <b>${counts[0]}</b><small>현재 데이터</small></span></span><span><i class="invalid"></i><span>Invalid <b>${counts[1]}</b><small>남아 있는 옛 데이터</small></span></span><span><i class="free"></i><span>Free <b>${counts[2]}</b><small>지워져 쓸 수 있음</small></span></span>${counts[3]?`<span><i class="staged"></i>갱신 대기 <b>${counts[3]}</b></span>`:''}</div>
    ${s.sceneId==='address'?'':`<ol class="operation-steps">${steps.map((name,i)=>`<li class="${i===phase?'active':i<phase?'complete':''}"><span>${i+1}</span>${name}</li>`).join('')}</ol>`}
    <p class="object-message" role="status" aria-atomic="true">${s.flashMessage}</p></div>`;
}

export function wearDiagram(s) {
  if(s.wearComparison){
    const {plain,balanced,cycles}=s.wearComparison;
    const bars=(counts)=>counts.map((count,i)=>`<div class="wear-column"><strong>${count}</strong><div class="wear-track"><div class="wear-fill" style="height:${count/12*100}%"></div></div><span>B${i}</span></div>`).join('');
    return `<div class="wear-object wear-comparison"><div class="wear-caption">같은 시작 상태 · 같은 P/E ${cycles}회 <span>P/E = 쓰기·지우기 한 차례</span></div><div class="wear-pair">${[[plain,'한곳에 집중'],[balanced,'덜 사용한 곳으로 분산']].map(([counts,label])=>`<section><h2>${label}</h2><div class="wear-bars">${bars(counts)}</div><p>가장 많이 쓴 곳과 적게 쓴 곳의 차이 <b>${Math.max(...counts)-Math.min(...counts)}회</b></p></section>`).join('')}</div><p class="diagram-note">이미 생긴 마모는 되돌아가지 않습니다. 다음 사용을 나누어 편차를 줄입니다.</p></div>`;
  }
  const max=Math.max(12,...s.wearCounts);
  return `<div class="wear-object"><div class="wear-caption">Block별 P/E Cycle <span>쓰기·지우기 횟수 비교</span></div><div class="wear-bars">${s.wearCounts.map((count,i)=>`<div class="wear-column ${s.badBlock===i?'bad':''} ${s.lastWear===i?'selected':''}"><strong>${s.badBlock===i?'제외':count}</strong><div class="wear-track"><div class="wear-fill" style="height:${count/max*100}%"></div></div><span>B${i}</span></div>`).join('')}</div><p class="object-message">${s.balanced?'덜 사용한 Block으로 다음 P/E를 분산합니다.':'같은 Block에 P/E가 집중됩니다.'}</p><p class="diagram-note">마모는 절연층과 읽기 특성의 변화입니다. 막대가 실제 수명을 예측하지는 않습니다.</p></div>`;
}

export function eccDiagram(s) {
  const original=encode(),result=s.eccResult;
  return `<div class="ecc-object"><div class="ecc-label"><span>데이터 4 bit + 검사 4 bit</span><strong>교육용 SECDED</strong></div><div class="bit-word">${s.eccBits.map((bit,i)=>`<button data-action="flip:${i}" class="bit ${bit!==original[i]?'changed':''} ${result?.position===i?'corrected':''}" aria-label="${i+1}번 bit ${bit}, ${[2,4,5,6].includes(i)?'데이터':'검사'}, 뒤집기" aria-pressed="${bit!==original[i]}"><small>${i+1}</small><b>${bit}</b><span>${[2,4,5,6].includes(i)?'데이터':'검사'}</span></button>`).join('')}</div>
    <div class="ecc-check ${result?.status||''}" role="status" aria-atomic="true"><span>${result?.status==='corrected'?'✓ 복구됨':result?.status==='uncorrectable'?'! 복구 한계':result?.status==='clean'?'✓ 검사 통과':s.eccBits.some((bit,i)=>bit!==original[i])?'오류가 생긴 상태':'데이터와 검사 bit'}</span><p>${s.eccMessage}</p>${result?.data?`<strong>읽은 데이터　${result.data.join(' ')}</strong>`:''}</div>
    ${s.eccSample?`<div class="retry-reference"><span>3·7번 Cell의 Vth</span><div><i style="left:${(s.retried?.72:.5)/1.25*100}%"></i><b style="left:${sampleThresholds(original,.34)[2]/1.25*100}%"></b></div><span>0.61 · Vref ${s.retried?'0.72':'0.50'}</span></div>`:''}
    <p class="diagram-note">1 bit 오류 복구 · 2 bit 오류 검출 · 실제 SSD의 ECC는 Article에서 더 살펴봅니다.</p></div>`;
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
