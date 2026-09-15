import test from 'node:test';
import assert from 'node:assert/strict';
import {createDemo,sampleDemo,observationNotes} from '../demos.mjs';
import {scenes} from '../content.mjs';
import {assertFlash,pageAt,encode,sampleThresholds,sampleBits} from '../model.mjs';

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
