import test from 'node:test';
import assert from 'node:assert/strict';
import {timeline,createFlash,writeLba,planGc,migrateGc,eraseGc,assertFlash,pagesOf,pageAt,encode,decode,sampleBits,wearCycle} from '../model.mjs';

test('all scroll boundaries are continuous and reversible, with a settle interval',()=>{
 for(let i=0;i<19;i++){
  assert.equal(timeline(i+.4,20).blend,0);
  assert.equal(timeline(i+.99999,20).current,i+1);
  assert.equal(timeline(i+1,20).from,i+1);
 }
 const forward=Array.from({length:1901},(_,i)=>timeline(i/100,20));
 for(let i=1900;i>=0;i--)assert.deepEqual(timeline(i/100,20),forward[i]);
});
test('out-of-place update preserves every LBA and invalidates the old location',()=>{
 const f=createFlash(),old=f.mapping[100],w=writeLba(f);
 assert.notEqual(w.to,old);assert.equal(pageAt(f,old).state,'invalid');assert.equal(f.mapping[100],w.to);assert.equal(pageAt(f,w.to).value,2);assertFlash(f);
});
test('GC cannot erase until all valid data and mapping have moved',()=>{
 const f=createFlash();writeLba(f);writeLba(f);const p=planGc(f),before=Object.fromEntries(Object.keys(f.mapping).map(lba=>[lba,pageAt(f,f.mapping[lba]).value]));
 assert.throws(()=>eraseGc(f,p),/Migrate/);migrateGc(f,p);assertFlash(f);eraseGc(f,p);assertFlash(f);
 assert.ok(f.blocks[p.victim].pages.every(p=>p.state==='free'));assert.equal(f.blocks[p.victim].wear,1);
 for(const [lba,value] of Object.entries(before))assert.equal(pageAt(f,f.mapping[lba]).value,value);
});
test('repeated updates and GC neither lose values nor overwrite valid pages',()=>{
 const f=createFlash();for(let i=0;i<180;i++){
  if(pagesOf(f).filter(p=>p.state==='free').length<5){const p=planGc(f);assert.ok(p);migrateGc(f,p);eraseGc(f,p);}
  assert.ok(writeLba(f,100+i%3).ok);assertFlash(f);
 }
 for(const lba of [100,101,102])assert.equal(pageAt(f,f.mapping[lba]).value,61);
});
test('full flash rejects a write without corrupting the mapping',()=>{
 const f=createFlash();while(writeLba(f).ok){}const before=JSON.stringify(f);assert.equal(writeLba(f).ok,false);assert.equal(JSON.stringify(f),before);assertFlash(f);
});
test('SECDED corrects every one-bit error and detects every two-bit error for all data',()=>{
 for(let n=0;n<16;n++){
  const data=[3,2,1,0].map(i=>(n>>i)&1),code=encode(data);assert.deepEqual(decode(code).data,data);
  for(let i=0;i<8;i++){const one=[...code];one[i]^=1;assert.deepEqual(decode(one).data,data);assert.equal(decode(one).position,i);
   for(let j=i+1;j<8;j++){const two=[...one];two[j]^=1;assert.equal(decode(two).status,'uncorrectable');}
  }
 }
});
test('read retry resamples unchanged cells against a changed reference',()=>{
 const code=encode();assert.equal(decode(sampleBits(code,.34,.5)).status,'uncorrectable');assert.deepEqual(sampleBits(code,.34,.72),code);assert.deepEqual(code,encode());
});
test('wear distribution reduces imbalance and excludes bad blocks',()=>{
 let uniform=[0,0,0,0,0,0],hot=[0,0,0,0,0,0];for(let i=0;i<30;i++){uniform=wearCycle(uniform,true,0).counts;hot=wearCycle(hot,false,0).counts;}
 assert.equal(uniform[0],0);assert.equal(hot[0],0);assert.ok(Math.max(...uniform)-Math.min(...uniform.slice(1))<=1);assert.equal(hot[1],30);
});

test('staged writes retain the old mapping until commit and reject stale plans', async()=>{
 const {planWrite,programWrite,commitWrite}=await import('../model.mjs');
 const f=createFlash(),old=f.mapping[100],plan=planWrite(f),stale=planWrite(f);
 assert.throws(()=>commitWrite(f,plan),/Program before/);
 programWrite(f,plan);
 assert.equal(f.mapping[100],old);assert.equal(pageAt(f,old).state,'valid');
 assert.equal(pageAt(f,plan.to).state,'staged');assertFlash(f);
 assert.throws(()=>programWrite(f,stale),/changed/);
 commitWrite(f,plan);assert.equal(f.mapping[100],plan.to);assert.equal(pageAt(f,old).state,'invalid');assertFlash(f);
 assert.throws(()=>commitWrite(f,plan),/Program before/);
});
test('GC copy, mapping and erase preserve distinct observable stages',async()=>{
 const {copyGc,mapGc}=await import('../model.mjs');
 const f=createFlash();writeLba(f);writeLba(f);const p=planGc(f),before={...f.mapping};
 assert.throws(()=>mapGc(f,p),/Copy valid/);copyGc(f,p);
 assert.deepEqual(f.mapping,before);p.moves.forEach(m=>{assert.equal(pageAt(f,m.to).state,'staged');assert.equal(pageAt(f,m.from).state,'valid');});assertFlash(f);
 assert.throws(()=>eraseGc(f,p),/Migrate/);mapGc(f,p);
 p.moves.forEach(m=>{assert.equal(f.mapping[m.lba],m.to);assert.equal(pageAt(f,m.to).state,'valid');});assertFlash(f);
 eraseGc(f,p);assert.ok(f.blocks[p.victim].pages.every(p=>p.state==='free'));assertFlash(f);
});
test('scene-specific scroll distances round-trip at every boundary and in reverse',async()=>{
 const {sceneOffsets,positionAt,distanceAt}=await import('../model.mjs');
 const {scenes}=await import('../content.mjs');const offsets=sceneOffsets(scenes.map(s=>s.length));
 for(let i=(scenes.length-1)*100;i>=0;i--){const p=i/100;assert.ok(Math.abs(positionAt(distanceAt(p,offsets),offsets)-p)<1e-10);}
 for(let i=0;i<scenes.length-1;i++){assert.equal(timeline(i+scenes[i].hold-.01,scenes.length,scenes.map(s=>s.hold)).blend,0);}
 assert.equal(positionAt(-10,offsets),0);assert.equal(positionAt(999,offsets),scenes.length-1);
});
