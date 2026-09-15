import {createFlash, planWrite, programWrite, commitWrite, planGc, copyGc, mapGc, eraseGc, encode, decode, sampleBits, wearCycle, clamp, lerp, smooth} from './model.mjs';
import {writeSteps, writeNotes, readSteps, readNotes, retrySteps, retryNotes} from './content.mjs';

// Immutable teaching snapshots: watching never mutates the reader's manual experiment.
const frame = (caption, patch = {}, duration = 2800, ramp = null) => ({caption, patch: structuredClone(patch), duration, ramp});
function writtenFlash() {
  const flash = createFlash(), plan = planWrite(flash);
  programWrite(flash, plan); commitWrite(flash, plan);
  return flash;
}
export function createDemo(id) {
  const frames=createFrames(id);
  // Establish the starting state briefly, then show the first change promptly.
  if(frames.length)frames[0].duration=600;
  return frames;
}
function createFrames(id) {
  switch (id) {
    case 'question': return [
      frame('문서를 편집하는 동안에는 RAM이 작업을 맡습니다.', {documentPhase:0}),
      frame('저장하면 문서가 SSD에 기록됩니다.', {documentPhase:1}),
      frame('정상 종료. 화면이 꺼져도 저장된 상태는 남습니다.', {documentPhase:2}, 3300),
      frame('다시 켜면 같은 문서가 돌아옵니다. 이 과정을 반복해서 봅니다.', {documentPhase:3}, 4000),
    ];
    case 'package': return [
      frame('기판에서 보이는 것은 반도체 칩을 보호하는 패키지입니다.', {opened:false}),
      frame('덮개 안의 얇은 Die에 실제 저장 소자가 들어 있습니다.', {opened:true}, 4800),
    ];
    case 'cell': return [
      frame('전하가 적으면 전류가 흐르기 시작하는 문턱도 낮습니다.', {charge:2,power:true}),
      frame('저장 전하가 많아지면 문턱 전압 Vth가 높아집니다.', {charge:8,power:true}),
      frame('전원을 꺼도 전하와 Vth의 차이는 남습니다. 영구 보존을 뜻하지는 않습니다.', {charge:8,power:false}, 4200),
    ];
    case 'density': return [1,2,3,4].map(bits=>frame(`${['SLC','MLC','TLC','QLC'][bits-1]}: 한 Cell에 ${bits} bit, ${2**bits}개 상태. ${bits===1?'경계 사이에 여유가 있습니다.':'상태가 많을수록 더 정밀한 판정이 필요합니다.'}`, {bits}, 3400));
    case 'program': return [
      frame('지워진 상태에서 시작합니다. 밝은 구간이 기록할 목표입니다.', {charge:0,power:true,pulsing:false}),
      ...[2,4,6,8].map((charge,i)=>frame(`${i+1}번째 펄스 → 전하 이동 → Vth 확인. 아직 목표에 도달하지 않았습니다.`, {charge,power:true,pulsing:true}, 1500)),
      frame('목표에 도착하면 펄스를 멈춥니다. 전하 상태가 데이터로 남습니다.', {charge:10,power:true,pulsing:false}, 4200),
    ];
    case 'read': return [
      frame('같은 Cell을 계속 읽습니다. 저장 전하와 Vth 0.64는 그대로입니다.', {charge:8,vref:.35,power:true}),
      frame('기준 전압이 Vth를 넘는 순간, 전류가 흐르고 1로 판정됩니다.', {charge:8,vref:.35,power:true}, 4500, {vref:[.35,.9]}),
      frame('기준을 다시 낮추면 0으로 읽힙니다. 바뀐 것은 전하가 아닌 판정 기준입니다.', {charge:8,vref:.9,power:true}, 4500, {vref:[.9,.35]}),
    ];
    case 'erase': return [
      frame('Page 3의 데이터만 고치고 싶습니다.', {selectedPage:3,erasePages:Array(8).fill('used'),eraseEffect:'',eraseMessage:'Page 하나를 선택했습니다.'}),
      frame('이미 기록한 Page에는 원하는 값을 자유롭게 덮어쓸 수 없습니다.', {selectedPage:3,erasePages:Array(8).fill('used'),eraseEffect:'blocked',eraseMessage:'Program 불가 · 먼저 지워진 공간이 필요합니다.'}, 3300),
      frame('Erase는 Block 전체에 적용됩니다. 이웃 Page도 함께 지워집니다.', {selectedPage:3,erasePages:Array(8).fill('free'),eraseEffect:'erasing',eraseMessage:'Block 전체가 Free · 다른 데이터까지 지워졌습니다.'}, 3300),
      frame('이제 쓸 수 있지만 다른 데이터는 사라졌습니다. 그래서 새 자리에 쓰는 방법이 필요합니다.', {selectedPage:3,erasePages:Array.from({length:8},(_,i)=>i===3?'used':'free'),eraseEffect:'programming',eraseMessage:'Page 3 Program 완료 · 다음은 다른 데이터를 보존하는 방법입니다.'}, 4000),
    ];
    case 'address': return [100,101,102].map(lba=>frame(`LBA ${lba}을 따라가면 ${createFlash().mapping[lba]}에 도착합니다. FTL이 두 주소를 연결합니다.`, {flash:createFlash(),lba,writePlan:null,gcPlan:null,writePhase:'idle',gcPhase:'idle',flashMessage:`LBA ${lba} → ${createFlash().mapping[lba]}`}, 3000));
    case 'ftl': {
      const flash=createFlash(), plan=planWrite(flash), base={flash,lba:100,writePlan:plan,gcPlan:null,gcPhase:'idle'};
      const frames=[frame('① 같은 LBA 100의 내용을 v1에서 v2로 수정합니다.', {...base,writePhase:'idle',flashMessage:'현재 주소 B0:P0 · v1'}, 3000)];
      programWrite(flash,plan);
      frames.push(frame('② 새 Page에 먼저 기록합니다. 주소는 아직 옛 데이터를 가리킵니다.', {...base,writePhase:'program',flashMessage:`${plan.to}에 v2 기록 완료 · 현재 주소는 ${plan.from}`}, 3400));
      commitWrite(flash,plan);
      frames.push(frame('③ 기록이 끝나면 주소표를 새 위치로 옮깁니다.', {...base,writePhase:'mapping',flashMessage:`LBA 100 → ${plan.to} · 이제 v2가 현재 데이터입니다.`}, 3200));
      frames.push(frame('④ 옛 Page는 Invalid. 내용은 남아 있지만 더는 현재 데이터가 아닙니다.', {...base,writePhase:'done',flashMessage:'같은 논리 주소 · 달라진 물리 위치 · 옛 Page는 아직 지워지지 않았습니다.'}, 4400));
      return frames;
    }
    case 'gc': {
      const flash=writtenFlash(), plan=planGc(flash), base={flash,lba:100,gcPlan:plan,writePlan:null,writePhase:'idle'};
      const frames=[frame('① 방금 수정한 Block입니다. Invalid가 있어도 바로 덮어쓸 수 없습니다.', {...base,gcPhase:'idle',flashMessage:'Block 0 · Valid와 Invalid가 섞여 있습니다.'}, 3000)];
      copyGc(flash,plan);
      frames.push(frame('② 아직 필요한 Valid 데이터를 다른 Block에 먼저 복사합니다.', {...base,gcPhase:'copy',flashMessage:`보존할 Page ${plan.moves.length}개 복사 · 원본은 그대로`}, 3400));
      mapGc(flash,plan);
      frames.push(frame('③ 주소표를 갱신합니다. 이제 새 복사본을 통해 데이터를 읽습니다.', {...base,gcPhase:'mapping',flashMessage:'모든 논리 주소가 보존된 복사본에 연결되었습니다.'}, 3200));
      eraseGc(flash,plan);plan.erased=true;
      frames.push(frame('④ 원래 Block을 통째로 지웁니다. 다른 데이터는 새 위치에 안전하게 남습니다.', {...base,gcPhase:'erase',flashMessage:'Block 0 Erase 완료 · 지워진 공간은 다시 쓸 수 있습니다.'}, 2800));
      frames.push(frame('⑤ Free 공간을 되찾았습니다. 다음 반복에서는 같은 시작 상태로 돌아갑니다.', {...base,gcPhase:'done',flashMessage:'LBA 100 · v2 보존 / Block 0의 Page 4개가 Free'}, 4000));
      return frames;
    }
    case 'wear': {
      let plain=[2,3,1,2,0,1], balanced=[...plain];
      const frames=[frame('두 경우 모두 같은 사용량에서 시작합니다. 같은 횟수를 더해 비교합니다.', {wearComparison:{plain,balanced,cycles:0}}, 2800)];
      for(let i=1;i<=6;i++) {
        plain=wearCycle(plain,false).counts;balanced=wearCycle(balanced,true).counts;
        frames.push(frame(i===6?'같은 6회라도, 덜 사용한 Block을 고르면 사용량 차이가 작아집니다.':'같은 작업이 들어옵니다. 왼쪽은 한곳에, 오른쪽은 덜 사용한 곳에 기록합니다.', {wearComparison:{plain,balanced,cycles:i}},i===6?4400:1400));
      }
      return frames;
    }
    case 'reliability': return [
      frame('처음에는 상태 분포가 판정 경계 안에 있습니다.', {disturb:false,drift:0}),
      frame('시간이 지나 전하가 변하면, 분포 일부가 읽기 경계를 넘을 수 있습니다.', {disturb:false,drift:0}, 4500, {drift:[0,1]}),
      frame('다시 처음 상태. 이번에는 반복 읽기의 영향을 봅니다.', {disturb:true,drift:0}),
      frame('읽기 전압의 영향으로 이웃 Cell의 분포도 변할 수 있습니다.', {disturb:true,drift:0}, 4500, {drift:[0,1]}),
    ];
    case 'ecc': {
      const original=encode(), one=[...original];one[2]^=1;
      const corrected=decode(one), errors=sampleBits(original,.34,.5), failed=decode(errors), retry=sampleBits(original,.34,.72);
      return [
        frame('데이터 4 bit에 검사 4 bit를 함께 저장했습니다.', {eccBits:original,eccResult:null,eccMessage:'저장한 부호 · 데이터와 검사 정보의 관계를 확인합니다.',eccSample:false,retried:false}),
        frame('읽은 bit 하나가 달라졌습니다. 검사 정보로 위치를 찾습니다.', {eccBits:one,eccResult:null,eccMessage:'3번 bit 오류 · ECC 검사 전',eccSample:false}),
        frame('1 bit 오류는 위치를 찾아 고칩니다. 원래 데이터를 얻었습니다.', {eccBits:corrected.code,eccResult:corrected,eccMessage:'3번 bit를 복구했습니다.',eccSample:false}, 3400),
        frame('이번에는 전압 판정으로 2 bit가 잘못 읽혔습니다.', {eccBits:errors,eccResult:failed,eccMessage:'2 bit 오류 검출 · 이 작은 ECC만으로는 복구할 수 없습니다.',eccSample:true,retried:false}, 3600),
        frame('같은 Cell을 다른 기준으로 다시 읽습니다. 이 예시는 올바른 판정을 되찾습니다.', {eccBits:retry,eccResult:decode(retry),eccMessage:'Vref 0.50 → 0.72 · 재판정 후 ECC 검사 통과',eccSample:true,retried:true}, 4500),
      ];
    }
    case 'write': {
      const flowFlash=createFlash();let flowPlan=null;
      return writeSteps.map((_,flowStep)=>{
        if(flowStep===2)flowPlan=planWrite(flowFlash);
        if(flowStep===4)programWrite(flowFlash,flowPlan);
        if(flowStep===5)commitWrite(flowFlash,flowPlan);
        return frame(writeNotes[flowStep],{flowFlash,flowPlan,flowStep},flowStep===writeSteps.length-1?4000:2400);
      });
    }
    case 'read-flow': return [false,true].flatMap(retry=>(retry?retrySteps:readSteps).map((_,flowStep)=>frame(`${retry?'재판정이 필요한 읽기':'일반적인 읽기'} · ${(retry?retryNotes:readNotes)[flowStep]}`, {flowFlash:writtenFlash(),flowPlan:null,flowStep,retry},flowStep===(retry?retrySteps:readSteps).length-1?3800:2300)));
    default: return [];
  }
}

export function sampleDemo(frames, elapsed) {
  if(!frames.length)return null;
  const duration=frames.reduce((sum,f)=>sum+f.duration,0);
  let time=((elapsed%duration)+duration)%duration,index=0;
  while(index<frames.length-1&&time>=frames[index].duration)time-=frames[index++].duration;
  const f=frames[index],patch={...f.patch};
  for(const [key,[from,to]] of Object.entries(f.ramp||{}))patch[key]=lerp(from,to,smooth(clamp(time/(f.duration*.8))));
  return {patch,caption:f.caption,index,total:frames.length,progress:time/f.duration,duration};
}

export const observationNotes={
  storage:'저장과 정상 종료를 마친 예시입니다. RAM의 작업은 사라져도 SSD의 문서는 남습니다.',
  ssd:'Controller는 저장을 관리하고, NAND는 상태를 기억합니다. 스크롤하면 NAND 안으로 들어갑니다.',
  die:'한 Die의 저장 배열은 Plane으로 나뉩니다. 밝은 구획을 따라 더 가까이 들어갑니다.',
  plane:'Plane 안에 모여 있는 Block. 밝은 Block이 다음에 살펴볼 영역입니다.',
  block:'읽고 쓸 때는 Page 하나씩, 지울 때는 이 Block 전체가 함께 바뀝니다.',
  page:'Cell의 판정을 모으면 Page 데이터가 됩니다. TLC·QLC는 같은 Cell 집합으로 여러 논리 Page를 표현합니다.',
  ending:'전하를 남기는 물리, 위치를 잇는 주소표, 오류를 고치는 정보가 함께 파일을 기억합니다.',
};
