import test from 'node:test';
import assert from 'node:assert/strict';
import {createDemo,sampleDemo,observationNotes} from '../demos.mjs';
import {scenes} from '../content.mjs';
import {assertFlash,pageAt,encode,decode,sampleThresholds,sampleBits} from '../model.mjs';

test('every scene has a watch narrative and replay preserves every flash mapping',()=>{
  for(const {id} of scenes){
    const frames=createDemo(id);
    assert.ok(frames.length||observationNotes[id],id);
    const duration=frames.reduce((sum,f)=>sum+f.duration,0),saved=JSON.stringify(frames);
    let elapsed=0;
    for(const frame of frames){
      for(const f of [frame.patch.flash,frame.patch.flowFlash].filter(Boolean)){
        assertFlash(f);
        for(const lba of [100,101,102])assert.ok(pageAt(f,f.mapping[lba]).value>=1);
      }
      assert.deepEqual(sampleDemo(frames,elapsed).patch,frame.patch);
      assert.deepEqual(sampleDemo(frames,elapsed+duration*100).patch,frame.patch);
      elapsed+=frame.duration;
    }
    assert.equal(JSON.stringify(frames),saved);
  }
});

test('watch scenes leave enough time to read the opening explanation',()=>{
  for(const {id} of scenes){
    const frames=createDemo(id);
    if(frames.length)assert.ok(frames[0].duration>=2000,id);
  }
});

test('GC starts from the FTL result and copies valid data before erasing',()=>{
  const ftl=createDemo('ftl'),gc=createDemo('gc');
  assert.deepEqual(ftl.at(-1).patch.flash,gc[0].patch.flash);
  const copied=gc[1].patch,mapped=gc[2].patch,erased=gc[3].patch;
  for(const move of copied.gcPlan.moves){
    assert.equal(copied.flash.mapping[move.lba],move.from);
    assert.equal(pageAt(copied.flash,move.to).state,'staged');
    assert.equal(mapped.flash.mapping[move.lba],move.to);
    assert.equal(pageAt(erased.flash,move.to).value,move.value);
  }
  assert.ok(erased.flash.blocks[erased.gcPlan.victim].pages.every(p=>p.state==='free'));
});

test('wear comparison always uses identical starting counts and work amounts',()=>{
  for(const {patch:{wearComparison:{plain,balanced,cycles}}} of createDemo('wear')){
    assert.equal(plain.reduce((s,n)=>s+n,0),9+cycles);
    assert.equal(balanced.reduce((s,n)=>s+n,0),9+cycles);
  }
  const {plain,balanced}=createDemo('wear').at(-1).patch.wearComparison;
  assert.equal(Math.max(...plain)-Math.min(...plain),8);
  assert.equal(Math.max(...balanced)-Math.min(...balanced),1);
});

test('Read and Retry use the same conduction rule and ramps leave charge unchanged',()=>{
  const original=encode(),thresholds=sampleThresholds(original,.34);
  for(const ref of [.05,.5,.64,.72,.95]){
    assert.deepEqual(sampleBits(original,.34,ref),thresholds.map(vth=>Number(ref>vth)));
  }
  const read=createDemo('read');
  for(const time of [0,2800,4000,6500,8000,11000])assert.equal(sampleDemo(read,time).patch.charge,8);
  assert.equal(createDemo('ecc')[3].patch.eccResult.status,'uncorrectable');
  assert.deepEqual(createDemo('ecc').at(-1).patch.eccBits,original);
  const write=createDemo('write').at(-1).patch.flowFlash;
  for(const f of createDemo('read-flow'))assert.deepEqual(f.patch.flowFlash,write);
});

test('display motion is continuous at display cadence while semantic snapshots remain exact',()=>{
  const program=createDemo('program'),opening=program[0].duration,pulse=program[1].duration;
  for(const hz of [60,120,144]){
    const step=1000/hz,samples=[];
    for(let elapsed=opening;elapsed<opening+pulse;elapsed+=step)samples.push(sampleDemo(program,elapsed).motion.charge);
    assert.equal(new Set(samples).size,samples.length,`${hz} Hz charge samples`);
  }
  const programDuration=program.reduce((sum,f)=>sum+f.duration,0);
  assert.equal(sampleDemo(program,0).motion.charge,0);
  assert.equal(sampleDemo(program,opening).motion.charge,0);
  assert.ok(Math.abs(sampleDemo(program,opening-.001).motion.charge)<.000001);
  assert.equal(sampleDemo(program,programDuration).motion.charge,0);
  assert.equal(sampleDemo(program,programDuration).motion.replayOpacity,0);
  const packageFrames=createDemo('package'),packageDuration=packageFrames.reduce((sum,f)=>sum+f.duration,0);
  assert.equal(sampleDemo(packageFrames,0).motion.lid,0);
  assert.equal(sampleDemo(packageFrames,packageDuration).motion.lid,1);

  const wear=createDemo('wear'),wearStart=wear[0].duration,firstCycle=wear[1].duration;
  const before=sampleDemo(wear,wearStart+firstCycle-.001),after=sampleDemo(wear,wearStart+firstCycle);
  assert.ok(before.motion.wearPlain[0]<after.motion.wearPlain[0]);
  assert.deepEqual(after.motion.wearPlain,wear[1].patch.wearComparison.plain);

  const read=createDemo('read'),rampStart=read[0].duration,rampDuration=read[1].duration;
  assert.equal(sampleDemo(read,rampStart).patch.vref,.35);
  assert.equal(sampleDemo(read,rampStart+rampDuration).patch.vref,.9);
  assert.ok(sampleDemo(read,rampStart+rampDuration/2).patch.vref>.35);
  const reliability=createDemo('reliability'),driftStart=reliability[0].duration;
  assert.equal(sampleDemo(reliability,driftStart).patch.drift,0);
  assert.ok(sampleDemo(reliability,driftStart+reliability[1].duration-.001).patch.drift>.999999);
  assert.equal(sampleDemo(reliability,driftStart+reliability[1].duration).patch.drift,0);

  const flow=createDemo('read-flow'),normalCycleEnd=flow.slice(0,6).reduce((sum,f)=>sum+f.duration,0);
  assert.equal(sampleDemo(flow,normalCycleEnd).motion.packetZone,undefined);
  const ecc=createDemo('ecc'),retryStart=ecc.slice(0,4).reduce((sum,f)=>sum+f.duration,0);
  assert.equal(sampleDemo(ecc,retryStart).motion.retryVref,.5);
  assert.equal(sampleDemo(ecc,retryStart+ecc[4].duration-.001).motion.retryVref.toFixed(2),'0.72');
});

test('Program reaches its target while pulsing, and Retry changes only during its sweep',()=>{
  const program=createDemo('program'),lastPulse=program.at(-2),complete=program.at(-1);
  assert.deepEqual(lastPulse.patch,{charge:10,power:true,pulsing:true});
  assert.equal(lastPulse.duration,1500);
  assert.deepEqual(complete.patch,{charge:10,power:true,pulsing:false});
  assert.equal(complete.duration,2800);
  const completeStart=program.slice(0,-1).reduce((sum,f)=>sum+f.duration,0);
  assert.equal(sampleDemo(program,completeStart).motion.charge,10);
  assert.equal(sampleDemo(program,completeStart+1000).motion.charge,10);

  const original=encode(),ecc=createDemo('ecc'),sweepStart=ecc.slice(0,4).reduce((sum,f)=>sum+f.duration,0),sweep=ecc[4];
  const below=sampleDemo(ecc,sweepStart+sweep.duration*.45),above=sampleDemo(ecc,sweepStart+sweep.duration*.65);
  for(const sample of [below,above]){
    assert.deepEqual(sample.patch.eccBits,sampleBits(original,.34,sample.patch.retryVref));
    assert.deepEqual(sample.patch.eccResult,decode(sample.patch.eccBits));
  }
  assert.ok(below.patch.retryVref<.611);
  assert.equal(below.patch.eccResult.status,'uncorrectable');
  assert.equal(below.patch.retried,false);
  assert.ok(above.patch.retryVref>.611);
  assert.equal(above.patch.eccResult.status,'clean');
  assert.equal(above.patch.retried,true);
  const finalStart=sweepStart+sweep.duration,final=sampleDemo(ecc,finalStart);
  assert.equal(final.patch.eccResult.status,'clean');
  assert.equal(final.patch.retryVref,.72);
  assert.equal(final.motion.retryVref,undefined);
  assert.equal(ecc.at(-1).ramp,null);
});

test('replay fades resettable loops instead of lowering charge or wear under their opening captions',()=>{
  const program=createDemo('program'),programDuration=program.reduce((sum,f)=>sum+f.duration,0);
  assert.ok(sampleDemo(program,programDuration-100).motion.replayOpacity<1);
  for(const elapsed of [0,300,1200]){
    const sample=sampleDemo(program,programDuration+elapsed);
    assert.equal(sample.index,0);
    assert.equal(sample.motion.charge,0);
    assert.equal(sample.patch.charge,0);
  }

  const wear=createDemo('wear'),wearDuration=wear.reduce((sum,f)=>sum+f.duration,0),opening=wear[0].patch.wearComparison;
  assert.equal(sampleDemo(wear,wearDuration).motion.replayOpacity,0);
  for(const elapsed of [0,300,1200]){
    const sample=sampleDemo(wear,wearDuration+elapsed);
    assert.equal(sample.index,0);
    assert.deepEqual(sample.motion.wearPlain,opening.plain);
    assert.deepEqual(sample.motion.wearBalanced,opening.balanced);
  }
});

test('loop progress honours unequal phase durations and sampler values cannot mutate frames',()=>{
  const question=createDemo('question'),duration=question.reduce((sum,f)=>sum+f.duration,0),elapsed=7000;
  assert.equal(sampleDemo(question,elapsed).loopProgress,elapsed/duration);
  assert.equal(sampleDemo(question,elapsed+duration).loopProgress,elapsed/duration);

  const ftl=createDemo('ftl'),sample=sampleDemo(ftl,0),saved=structuredClone(ftl[0].patch);
  sample.patch.flash.blocks[0].pages[0].state='mutated';
  assert.deepEqual(ftl[0].patch,saved);
  assert.deepEqual(sampleDemo(ftl,0).patch,saved);
});


test('Reliability experiment resets are hidden by matching fades at both boundaries',()=>{
 const frames=createDemo('reliability');let elapsed=0;
 for(let i=0;i<frames.length;i++){
  elapsed+=frames[i].duration;
  if(!frames[i].ramp?.drift)continue;
  assert.ok(sampleDemo(frames,elapsed-.01).motion.replayOpacity<1e-6);
  assert.equal(sampleDemo(frames,elapsed).motion.replayOpacity,0);
  assert.equal(sampleDemo(frames,elapsed).patch.drift,0);
  assert.equal(sampleDemo(frames,elapsed+350).motion.replayOpacity,1);
 }
 assert.equal(sampleDemo(frames,0).motion.replayOpacity,undefined);
});
