import {clamp, lerp} from './model.mjs';

// These writers do not read layout. Semantic DOM is only reconciled at phase boundaries.
const attr=(node,key,value)=>{if(node&&node.getAttribute(key)!==String(value))node.setAttribute(key,value);};
const text=(node,value)=>{if(node&&node.textContent!==String(value))node.textContent=value;};
const style=(node,key,value)=>{if(node&&node.style[key]!==value)node.style[key]=value;};

export function bindMotion(root, id) {
  const one=s=>root.querySelector(s),all=s=>[...root.querySelectorAll(s)];
  const nodes=Object.fromEntries(['channel','conduction','verdict','vref-marker','vref-label','vth-label'].map(key=>[key,one(`[data-motion="${key}"]`)]));
  const electrons=all('.stored-electron'),bar=one('.vth-bar'),marker=one('.vth-marker');
  const compactLabel=one('.compact-voltage>span'),compactBar=one('.compact-voltage-track>b'),compactRef=one('.compact-voltage-track>i'),compactVerdict=one('.compact-voltage>strong');
  const curves=all('.distribution').map((node,i)=>({node,i,center:Number(node.dataset.center),half:Number(node.dataset.half)}));
  const densityNote=one('[data-motion="density-note"]');
  const bars=all('.wear-fill'),carrier=one('.flow-carrier'),packet=one('.flow-packet'),retry=one('.retry-reference i'),retryLabel=one('[data-motion="retry-label"]');
  const signals=all('.meaningful-flow,.program-electrons,.mapping-line');
  const desktop=one('.desktop-content'),screenTop=one('.screen-top'),offMessage=one('.power-off-message');
  const wash=all('.programming,.erasing .erase-page,.flash-block.erasing'),blocked=one('.blocked .erase-page.selected');
  const grid=one('.mapping-grid'),routes=one('.mapping-routes');
  const pages=all('[data-ppa]'),lbas=all('.lba');
  let geometry=null,copyPackets=[];

  // Called once after a mount/resize, at the next frame's read stage, never during paint.
  function measure() {
    if(!grid||!routes)return null;
    const box=grid.getBoundingClientRect();
    if(!box.width||!box.height)return null;
    const point=(node,side)=>{const r=node.getBoundingClientRect();return [(r[side]??(r.left+r.width/2))-box.left,r.top+r.height/2-box.top].map((v,i)=>v/(i?box.height:box.width)*(i?520:1000));};
    return {pages:Object.fromEntries(pages.map(node=>[node.dataset.ppa,{center:point(node),left:point(node,'left')}])),lbas:Object.fromEntries(lbas.map(node=>[node.dataset.action.split(':')[1],point(node,'right')]))};
  }
  function route(s, measured) {
    if(!measured||!routes)return;
    geometry=measured;
    const start=geometry.lbas[s.lba],end=geometry.pages[s.flash.mapping[s.lba]]?.left;
    if(!start||!end)return;
    const [x,y]=start,[a,b]=end;
    let html=`<path d="M${x} ${y}C${x+60} ${y} ${a-70} ${b} ${a} ${b}" fill="none" stroke="#a7d3e3" stroke-width="1.5" class="mapping-line"/>`;
    const moves=s.gcPlan&&['copy','mapping'].includes(s.gcPhase)?s.gcPlan.moves:s.writePlan&&['program','mapping'].includes(s.writePhase)?[s.writePlan]:[];
    const paths=[];
    for(const move of moves){
      const from=geometry.pages[move.from]?.center,to=geometry.pages[move.to]?.center;
      if(!from||!to)continue;
      const control=[(from[0]+to[0])/2+40,Math.min(from[1],to[1])-75];
      paths.push({from,to,control});
      html+=`<path d="M${from}Q${control} ${to}" fill="none" stroke="#d0ebf4" stroke-width="2" stroke-dasharray="5 7"/><circle class="copy-packet" r="4" fill="#d0ebf4"/>`;
    }
    routes.innerHTML=html;routes.setAttribute('preserveAspectRatio','none');
    copyPackets=[...routes.querySelectorAll('.copy-packet')].map((node,i)=>({node,...paths[i]}));
    signals.splice(0,signals.length,...all('.meaningful-flow,.program-electrons,.mapping-line'));
  }
  function paint(s, frame, elapsed=0) {
    const m=frame?.motion||{},p=frame?.motionProgress??1;
    style(root.firstElementChild,'opacity',String(m.replayOpacity??1));
    if(electrons.length){
      const q=m.charge??s.charge,vth=.2+q*.055,conduction=s.vref>vth;
      electrons.forEach((node,i)=>{const amount=clamp(q-i);attr(node,'opacity',lerp(.08,1,amount));attr(node,'transform',`translate(0 ${(1-amount)*26})`);});
      attr(bar,'transform',`translate(190 535) scale(${vth} 1)`);
      attr(marker,'transform',`translate(${190+vth*650} 0)`);
      text(nodes['vth-label'],`Vth ${vth.toFixed(2)} · 전압과 전하 수는 설명용 상대값`);
      text(compactLabel,`Vth ${vth.toFixed(2)}`);style(compactBar,'transform',`scaleX(${vth})`);
      if(id==='read'){
        attr(nodes['vref-marker'],'transform',`translate(${190+s.vref*650} 0)`);
        attr(nodes['vref-label'],'x',190+s.vref*650);text(nodes['vref-label'],`Vref ${s.vref.toFixed(2)}`);
        text(nodes.conduction,conduction?'도통 · 전류가 흐름':'비도통 · 전류 없음');text(nodes.verdict,conduction?'1':'0');
        attr(nodes.channel,'stroke',conduction?'#b3e2ec':'#688293');attr(nodes.channel,'stroke-width',conduction?5:2);
        attr(nodes.channel,'stroke-dasharray',conduction?'9 12':'none');attr(nodes.channel,'stroke-dashoffset',-elapsed/2600*60);
        style(compactRef,'transform',`translateX(${s.vref*100}%)`);text(compactVerdict,`판정 ${conduction?'1':'0'}`);
      }
    }
    if(id==='reliability')for(const {node,i,center,half} of curves){
      const mid=center+s.drift*(s.disturb?1:-1)*(i%2?42:58),spread=half+s.drift*12;
      // Affine transform of a fixed curve: no path parsing or DOM reconstruction per frame.
      attr(node,'transform',`translate(${mid} 0) scale(${spread/half} 1) translate(${-center} 0)`);
    }
    if(m.wearPlain)bars.forEach((node,i)=>style(node,'transform',`scaleY(${(i<6?m.wearPlain[i]:m.wearBalanced[i-6])/12})`));
    if(m.packetZone!==undefined){
      const zone=m.packetZone,position=zone<=1?zone*48:48+(zone-1)*52;
      style(carrier,'transform',`translateX(${position}%)`);style(packet,'transform',`translateX(${-20-zone*30}%)`);
    }
    const retryVref=m.retryVref??s.retryVref;
    if(retryVref!==undefined){style(retry,'transform',`translateX(${retryVref/1.25*100}%)`);text(retryLabel,`0.61 · Vref ${retryVref.toFixed(2)}`);}
    if(id==='reliability'&&s.drift>0)text(densityNote,s.compact?'분포가 점선을 넘으면 잘못 판정될 수 있습니다. 상대값 개념도.':'분포가 읽기 경계(점선)를 넘으면 잘못 판정될 수 있습니다.');
    if(id==='question'&&frame){
      const target=s.documentPhase===2?0:1,from=frame.index===3?0:1,opacity=lerp(from,target,p);
      style(desktop,'opacity',String(opacity));style(screenTop,'opacity',String(opacity));style(offMessage,'opacity',String(1-opacity));
    }
    for(const node of signals)attr(node,'stroke-dashoffset',-elapsed/(node.classList.contains('program-electrons')?700:2600)*60);
    for(const {node,from,to,control} of copyPackets){
      const point=[0,1].map(i=>(1-p)**2*from[i]+2*(1-p)*p*control[i]+p*p*to[i]);
      attr(node,'transform',`translate(${point})`);attr(node,'opacity',Math.sin(p*Math.PI));
    }
    if(frame){
      // Semantic classes stay discrete; only their visual emphasis uses the phase clock.
      wash.forEach(node=>style(node,'boxShadow',`inset 0 0 0 999px rgba(145,180,194,${(1-p)*.22})`));
      style(blocked,'transform',`translateX(${Math.sin(frame.progress*Math.PI*6)*(1-p)*5}px)`);
    }
  }
  return {measure,route,paint};
}
