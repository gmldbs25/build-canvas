import {pagesOf,encode} from './model.mjs';
const rect=(x,y,w,h,fill='#344956',stroke='#647c8d',extra='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="${fill}" stroke="${stroke}" ${extra}/>`;
const text=(x,y,t,fill='#afc2cf',size=20,extra='')=>`<text x="${x}" y="${y}" fill="${fill}" font-size="${size}" ${extra}>${t}</text>`;
const path=(d,stroke='#658596',extra='')=>`<path d="${d}" fill="none" stroke="${stroke}" ${extra.includes('stroke-width')?'':'stroke-width="1.5"'} ${extra}/>`;
const tip=(label,content,body,action='')=>`<g tabindex="0" role="${action?'button':'img'}" aria-label="${label}: ${content}" data-tip="${content}" ${action?`data-action="${action}"`:''}>${body}</g>`;
const svg=body=>`<svg viewBox="0 0 1000 680" class="diagram-svg" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="face" x2=".6" y2="1"><stop stop-color="#536674"/><stop offset="1" stop-color="#344957"/></linearGradient><linearGradient id="active-face" x2=".7" y2="1"><stop stop-color="#5b8297"/><stop offset="1" stop-color="#35576b"/></linearGradient><pattern id="invalid-hatch" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M0 8L8 0" stroke="#9c887c" opacity=".35"/></pattern></defs>${body}</svg>`;
const plate=(x,y,w,h,active=false,depth=12)=>rect(x+3,y+depth,w,h,'#1d303d','#2d4352')+rect(x,y,w,h,active?'url(#active-face)':'url(#face)',active?'#9dc9da':'#6a8291',active?'class="selection-pulse"':'');
export function dieDiagram() {
 let blocks='';
 for(let plane=0;plane<2;plane++){
  blocks+=rect(100+plane*340,110,315,255,'#263b49','#647a88');
  blocks+=text(120+plane*340,140,`Plane ${plane}`,'#bccdd7',19);
  for(let i=0;i<6;i++){
   const x=120+plane*340+(i%3)*96,y=167+Math.floor(i/3)*85,active=plane===0&&i===1;
   blocks+=tip('Block',`Plane ${plane} 안의 Block ${i}. 여러 Page를 묶어 지우는 단위입니다.`,plate(x,y,82,66,active,5)+Array.from({length:4},(_,j)=>path(`M${x+9} ${y+15+j*11}h62`,active?'#91c2d5':'#687f8d','opacity=".5"')).join(''),active?'go:4':'');
  }
 }
 return svg(`<g transform="matrix(1 -.25 .45 .72 -5 200)">${plate(65,70,720,340)}${blocks}${text(89,395,'Die','#c2d1db',23)}</g>${text(510,608,'한 Plane 안의 Block을 따라갑니다.','#7996a7',18,'text-anchor="middle"')}`);
}
export function blockDiagram(selected=3){
 let pages='';for(let i=7;i>=0;i--){const y=110+i*42;pages+=tip(`Page ${i}`,'Page는 읽고 쓰는 단위입니다. Block 전체가 함께 지워집니다.',plate(195,y,525,51,i===selected,7)+text(220,y+33,`Page ${i}`,i===selected?'#deeff6':'#9aafbd',18),i===selected?'go:5':'');}
 return svg(`<g transform="matrix(1 -.21 .4 .75 -20 160)">${pages}</g>${path('M850 225h15v285h-15')}${text(890,366,'Block','#adcad9',23)}${text(480,612,'Read / Program → Page   ·   Erase → Block','#94b1c1',19,'text-anchor="middle"')}`);
}
export function pageDiagram(){
 let cells='';for(let row=0;row<4;row++)for(let col=0;col<10;col++){const x=170+col*61,y=145+row*72,selected=row===1&&col===5;cells+=tip('Cell','전하 상태가 Vth를 바꾸는 최소 저장 소자입니다.',plate(x,y,43,49,selected,7)+text(x+21,y+31,selected?'0':'1',selected?'#edfaff':'#839aa9',17,'text-anchor="middle"'),selected?'go:6':'');}
 return svg(`<g transform="matrix(1 -.19 .38 .75 -30 180)">${plate(142,112,666,353)}${cells}${path('M155 240H812','#8fbccd','class="meaningful-flow" stroke-dasharray="7 13"')}${text(160,455,'Page','#b9cedb',23)}</g>${text(500,610,'한 Page를 구성하는 Cell 일부를 단순화한 모습','#819dad',18,'text-anchor="middle"')}`);
}
export function cellDiagram(s,scene){
 const q=s.charge,vth=.2+q*.055,conduction=s.vref>vth&&s.power;
 let electrons='';for(let i=0;i<q;i++){const x=331+(i%6)*48,y=289+Math.floor(i/6)*31;electrons+=`<circle class="electron" cx="${x}" cy="${y}" r="6" fill="#a9d7e6" style="--delay:${i*.15}s"/>`;}
 const read=scene==='read';
 return svg(`${path('M270 230V160H720V230','#7895a6')}${text(497,136,read?'기준 전압 Vref':'Control Gate','#b6d1df',22,'text-anchor="middle"')}${rect(249,214,494,42,'#465e70','#7791a2')}${rect(277,267,438,95,'#203442','#79919f')}${tip('전하 저장 영역',s.trap==='ct'?'Charge Trap: 절연막의 포획 상태에 전하를 저장합니다.':'Floating Gate: 전기적으로 절연된 도체에 전하를 저장합니다.',rect(306,280,380,70,s.trap==='ct'?'#354f5f':'#465b6c','#8eb6c8')+electrons)}${text(793,318,s.trap==='ct'?'Charge Trap':'Floating Gate','#aac9d9',19)}${path('M711 313h66')}${text(791,365,'절연층','#8fa8b8',18)}${path('M718 355h58')}${rect(216,378,560,136,'#2c4150','#617989')}${rect(243,379,111,57,'#5a7485','#8cabbc')}${rect(642,379,106,57,'#5a7485','#8cabbc')}${text(259,414,'Source','#dae9ef',18)}${text(666,414,'Drain','#dae9ef',18)}${path('M354 411H642',conduction?'#a1d6e8':'#536b7a',`stroke-width="${conduction?4:2}" ${conduction&&read?'class="meaningful-flow" stroke-dasharray="8 14"':''}`)}${text(500,485,read?(conduction?'전류가 흐릅니다':'전류가 흐르지 않습니다'):'Channel','#a4bccb',21,'text-anchor="middle"')}${scene==='program'&&s.pulsing?path('M477 392V330','#a9d7e6','class="program-electrons" stroke-dasharray="3 17" stroke-width="5"'):''}${path('M260 594H755','#5f7b8e')}${text(220,600,'Vth','#a8c5d7',21)}${rect(260,581,495*vth,25,'#4d7b91','none')}${text(776,601,`${vth.toFixed(2)} · 상대값`,'#aac9d9',20)}${read?`${path(`M${260+s.vref*495} 554v65`,'#d9d0af','stroke-dasharray="4 5"')}${text(260+s.vref*495,539,'Vref','#d9d0af',18,'text-anchor="middle"')}`:''}`);
}
export function densityDiagram(bits=1,drift=0,disturb=false){
 const n=2**bits,left=115,width=780;let curves='';
 for(let i=0;i<n;i++){
  const mid=left+(i+.5)*width/n+drift*(disturb?1:-1)*(i%2?42:58),half=Math.min(68,width/n*.39)+drift*12;
  curves+=`<path d="M${mid-half} 451C${mid-half*.58} 451 ${mid-half*.42} 239 ${mid} 238C${mid+half*.42} 239 ${mid+half*.58} 451 ${mid+half} 451Z" fill="${i===1?'#638ba1':'#3b586c'}" stroke="${i===1?'#a2c9da':'#7698ad'}" stroke-width="1.5" fill-opacity=".65" class="${i===1?'selection-pulse':''}"/>`;
  curves+=text(left+(i+.5)*width/n,491,`${i}`,'#abc4d2',bits===4?16:20,'text-anchor="middle"');
  if(i>0)curves+=path(`M${left+i*width/n} 208v249`,'#708c9e','stroke-dasharray="3 8" opacity=".55"');
 }
 return svg(`${text(115,135,`${bits} bit / Cell`,'#d4e6ef',35)}${text(895,135,`${n}개 상태`,'#a5c3d4',23,'text-anchor="end"')}${path('M115 197V455H915','#647e91')}${curves}${text(513,557,'문턱 전압 Vth →','#94b2c4',21,'text-anchor="middle"')}${text(513,605,'상태 번호 · 실제 치수와 분포가 아닌 개념도','#708e9f',17,'text-anchor="middle"')}`);
}
export function eraseDiagram(s){
 let pages='';for(let i=0;i<8;i++){const y=120+i*48,x=170;const free=s.erasePages[i]==='free',selected=s.selectedPage===i;
 pages+=tip(`Page ${i}`,free?'지워진 Page입니다. Program할 수 있습니다.':'이미 기록된 Page입니다. 다시 쓰려면 Block Erase가 필요합니다.',rect(x,y,630,39,free?'#1d303b':'#3a596d',selected?'#b4dbe9':'#536f82',selected?'stroke-width="2" class="selection-pulse"':'')+text(x+18,y+26,`Page ${i}`,'#b8cfdc',18)+text(x+609,y+26,free?'Free · 1111':'기록됨 · 0101',free?'#6e8b9d':'#a9cfe0',18,'text-anchor="end"'),`select-page:${i}`);}
 return svg(`${pages}${path('M838 119h15v375h-15')}${text(873,319,'Block','#aac4d2',22)}${text(482,581,s.eraseMessage,'#b6d3e2',22,'text-anchor="middle"')}`);
}
const pageColors={valid:'#466d82',invalid:'#433e3b',free:'#1b2b36'};
export function mappingDiagram(s){
 const f=s.flash;let body='';const selected=f.mapping[s.lba];
 [100,101,102].forEach((lba,i)=>{const y=178+i*98;body+=tip(`LBA ${lba}`,'Host는 논리 주소를 사용합니다. 물리 위치는 FTL이 연결합니다.',rect(40,y,155,58,lba===s.lba?'#365d73':'#273d4c',lba===s.lba?'#afdae9':'#58758a')+text(118,y+37,`LBA ${lba}`,'#d0e5ee',21,'text-anchor="middle"'),`lba:${lba}`);});
 body+=text(113,135,'Host','#9db7c9',21,'text-anchor="middle"')+text(292,295,'FTL','#abcbdc',27,'text-anchor="middle"');
 for(const b of f.blocks){const x=405+b.id*142;body+=text(x+57,128,`Block ${b.id}`,'#a2bdce',20,'text-anchor="middle"');
  for(let i=0;i<4;i++){const p=b.pages[i],y=162+i*79;body+=tip(p.ppa,`${p.state==='valid'?'유효':p.state==='invalid'?'무효':'비어 있는'} Page${p.lba!==null?`, LBA ${p.lba}의 데이터`:''}`,rect(x,y,116,60,pageColors[p.state],p.ppa===selected?'#b5deec':'#566e80',p.ppa===selected?'stroke-width="2"':'')+(p.state==='invalid'?rect(x,y,116,60,'url(#invalid-hatch)','none'):'')+text(x+58,y+25,`P${i}`,'#8da9ba',16,'text-anchor="middle"')+text(x+58,y+47,p.lba===null?'Free':`${p.lba} · v${p.value}`,p.state==='invalid'?'#ad9e95':'#bfd9e5',17,'text-anchor="middle"'));}
 }
 if(selected){const [b,p]=selected.match(/\d+/g).map(Number),y=178+([100,101,102].indexOf(s.lba))*98;body+=path(`M197 ${y+29}C315 ${y+29} 304 ${192+p*79} ${397+b*142} ${192+p*79}`,'#9dcbdc','class="mapping-line" stroke-width="2"');}
 if(s.lastWrite&&Date.now()-s.lastWrite.time<1000){const a=s.lastWrite.from.match(/\d+/g).map(Number),b=s.lastWrite.to.match(/\d+/g).map(Number);body+=path(`M${463+a[0]*142} ${192+a[1]*79}Q${620} 100 ${463+b[0]*142} ${192+b[1]*79}`,'#b7dfec','class="write-transfer" stroke-width="3"');}
 if(s.gcPlan&&s.gcPhase==='migration')for(const m of s.gcPlan.moves){const [b,p]=m.from.match(/\d+/g).map(Number),[toB,toP]=m.to.match(/\d+/g).map(Number);body+=path(`M${463+b*142} ${192+p*79}Q${450+toB*142} 78 ${463+toB*142} ${192+toP*79}`,'#c5e5ed','class="meaningful-flow" stroke-dasharray="6 9" stroke-width="3"');}
 body+=text(500,545,`LBA ${s.lba} → ${selected}`,'#c1dbe7',23,'text-anchor="middle"');
 body+=text(500,587,s.flashMessage,'#93afc0',19,'text-anchor="middle"');
 const counts=['valid','invalid','free'].map(state=>pagesOf(f).filter(p=>p.state===state).length);
 ['valid','invalid','free'].forEach((key,i)=>{body+=rect(230+i*210,629,18,18,pageColors[key],'#7c9bad')+text(260+i*210,644,`${key[0].toUpperCase()+key.slice(1)} ${counts[i]}`,'#8da9ba',18);});return svg(body);
}
export function wearDiagram(s){
 const max=Math.max(12,...s.wearCounts);let body='';
 for(let i=0;i<6;i++){const x=153+i*119,h=s.wearCounts[i]/max*280,bad=s.badBlock===i;body+=rect(x,174,74,300,'#1d303c','#3c5465')+rect(x,474-h,74,h||2,bad?'#64564e':s.lastWear===i?'#739fb4':'#43687e','none')+text(x+37,516,`B${i}`,'#a3c0d1',20,'text-anchor="middle"')+text(x+37,153,bad?'제외':`${s.wearCounts[i]}` ,bad?'#c3a996':'#c7e0eb',23,'text-anchor="middle"');if(bad)body+=path(`M${x} 176l74 295M${x+74} 176l-74 295`,'#b39581');}
 return svg(`${text(156,92,'P/E Cycle · 상대 비교','#a6c4d5',23)}${body}${text(500,596,s.balanced?'덜 사용한 Block을 먼저 선택합니다.':'같은 Block에 사용이 집중됩니다.','#a9c8d9',22,'text-anchor="middle"')}${text(500,642,'실제 내구 수명이나 불량 판정 기준을 나타내지 않습니다.','#7795a7',17,'text-anchor="middle"')}`);
}
export function eccDiagram(s){
 const original=encode(),result=s.eccResult;let body=text(125,140,'저장된 검사 정보와 함께 읽기','#bed5e1',28);
 body+=text(125,201,'데이터 4 bit + 검사 4 bit · 확장 Hamming (8,4)','#849fae',19);
 for(let i=0;i<8;i++){const x=125+i*97,changed=s.eccBits[i]!==original[i],corrected=result?.position===i;
 body+=tip(`${i+1}번 bit`,'클릭하면 이 bit를 뒤집습니다. 1 bit 복구와 2 bit 검출을 비교해 보세요.',rect(x,265,76,91,changed?'#604c40':corrected?'#466b7e':'#2e485a',changed?'#b9977e':'#81a9be',i===(result?.position??0)?'class="selection-pulse"':'')+text(x+38,327,s.eccBits[i],changed?'#ead7c3':'#d1e8f2',37,'text-anchor="middle"')+text(x+38,388,[2,4,5,6].includes(i)?'데이터':'검사','#8da8b9',16,'text-anchor="middle"'),`flip:${i}`);
 }
 body+=text(500,491,s.eccMessage,'#b8d7e6',23,'text-anchor="middle"');
 if(result)body+=text(500,540,result.status==='uncorrectable'?'복구할 수 없는 오류 → 다시 읽거나 실패 보고':`검증한 데이터: ${(result.data??[]).join(' ')}`,'#96b8cc',22,'text-anchor="middle"');
 body+=text(500,620,'복구 능력에는 한계가 있습니다. 실제 SSD의 LDPC를 단순화한 학습 예입니다.','#7695a8',17,'text-anchor="middle"');return svg(body);
}
export function flowDiagram(steps,active,write){
 const positions=steps.map((_,i)=>({x:110+(i%3)*295,y:108+Math.floor(i/3)*129}));let body='';
 for(let i=0;i<steps.length-1;i++){const a=positions[i],b=positions[i+1];const d=(i+1)%3===0?`M${a.x+107} ${a.y+71}v22H${b.x+107}V${b.y}`:`M${a.x+220} ${a.y+36}H${b.x}`;body+=path(d,i<active?'#8cbacf':'#334f63',i===active-1?'class="meaningful-flow" stroke-dasharray="6 10"':'');}
 for(let i=0;i<steps.length;i++){const p=positions[i];body+=rect(p.x,p.y,220,71,i===active?'#426a80':i<active?'#2c4759':'#1c303f',i===active?'#b2d9e7':'#506b7d',i===Math.max(0,active)?'class="selection-pulse"':'')+text(p.x+15,p.y+23,String(i+1).padStart(2,'0'),'#83a7bc',13)+text(p.x+110,p.y+46,steps[i],i===active?'#e1f1f7':'#a9c3d3',18,'text-anchor="middle"');}
 return svg(`${text(111,59,write?'Host Write → NAND':'NAND → Host Read','#bad4e3',24)}${body}`);
}
