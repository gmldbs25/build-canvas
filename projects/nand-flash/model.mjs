// Deliberately small teaching models. Geometry, voltages and capacities are illustrative.
export const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
export const lerp = (a,b,t) => a+(b-a)*t;
export const smooth = t => {t=clamp(t);return t*t*(3-2*t);};
export function timeline(position, count) {
 const p=clamp(position,0,count-1), from=Math.floor(p), to=Math.min(from+1,count-1);
 const blend=smooth((p-from-.54)/.46);
 return {from,to,blend,current:blend<.5?from:to,position:p};
}
export function createFlash() {
 const blocks=Array.from({length:4},(_,b)=>({id:b,wear:0,bad:false,pages:Array.from({length:4},(_,p)=>({ppa:`B${b}:P${p}`,state:'free',lba:null,value:null}))}));
 const flash={blocks,mapping:{},writes:0,version:0};
 [100,101,102].forEach((lba,i)=>{const page=blocks[0].pages[i];Object.assign(page,{state:'valid',lba,value:1});flash.mapping[lba]=page.ppa;});
 return flash;
}
export const pagesOf=f=>f.blocks.flatMap(b=>b.pages);
export const pageAt=(f,ppa)=>pagesOf(f).find(p=>p.ppa===ppa);
export function writeLba(f,lba=100) {
 const available=f.blocks.filter(b=>!b.bad).flatMap(b=>b.pages).find(p=>p.state==='free');
 if(!available)return {ok:false,reason:'free'};
 const old=pageAt(f,f.mapping[lba]), value=(old?.value??0)+1;
 Object.assign(available,{state:'valid',lba,value});f.mapping[lba]=available.ppa;
 if(old)old.state='invalid';f.writes++;f.version++;
 return {ok:true,from:old?.ppa,to:available.ppa,lba,value};
}
// A GC plan reserves destinations; apply migrations before erasing the victim.
export function planGc(f) {
 const candidates=f.blocks.filter(b=>!b.bad&&b.pages.some(p=>p.state==='invalid')).sort((a,b)=>b.pages.filter(p=>p.state==='invalid').length-a.pages.filter(p=>p.state==='invalid').length);
 for(const victim of candidates){
  const valid=victim.pages.filter(p=>p.state==='valid');
  const free=f.blocks.filter(b=>!b.bad&&b.id!==victim.id).flatMap(b=>b.pages).filter(p=>p.state==='free');
  if(free.length>=valid.length)return {version:f.version,victim:victim.id,moves:valid.map((p,i)=>({from:p.ppa,to:free[i].ppa,lba:p.lba,value:p.value}))};
 }
 return null;
}
export function migrateGc(f,plan) {
 if(plan.version!==f.version)throw new Error('GC state changed');
 for(const m of plan.moves){const from=pageAt(f,m.from),to=pageAt(f,m.to);if(from.state!=='valid'||to.state!=='free')throw new Error('GC invalid source/destination');}
 for(const m of plan.moves){Object.assign(pageAt(f,m.to),{state:'valid',lba:m.lba,value:m.value});pageAt(f,m.from).state='invalid';f.mapping[m.lba]=m.to;f.writes++;}
 f.version++;plan.version=f.version;plan.migrated=true;
}
export function eraseGc(f,plan) {
 if(!plan.migrated||plan.version!==f.version)throw new Error('Migrate valid pages before erase');
 const b=f.blocks[plan.victim];if(b.pages.some(p=>p.state==='valid'))throw new Error('Cannot erase valid data');
 b.pages.forEach(p=>Object.assign(p,{state:'free',lba:null,value:null}));b.wear++;f.version++;
}
export function assertFlash(f) {
 const valid=pagesOf(f).filter(p=>p.state==='valid');
 if(new Set(valid.map(p=>p.lba)).size!==valid.length)throw new Error('Duplicate valid LBA');
 for(const [lba,ppa] of Object.entries(f.mapping)){const p=pageAt(f,ppa);if(!p||p.state!=='valid'||String(p.lba)!==lba)throw new Error('Broken mapping');}
 for(const p of valid)if(f.mapping[p.lba]!==p.ppa)throw new Error('Unmapped valid page');
 return true;
}
// Extended Hamming (8,4): one bit correction, two bit detection. Not an SSD LDPC emulator.
export function encode(data=[1,0,1,1]) {
 const c=[0,0,data[0],0,data[1],data[2],data[3],0];
 c[0]=c[2]^c[4]^c[6];c[1]=c[2]^c[5]^c[6];c[3]=c[4]^c[5]^c[6];c[7]=c.slice(0,7).reduce((a,b)=>a^b,0);return c;
}
export function decode(code) {
 const c=[...code];const syndrome=(c[0]^c[2]^c[4]^c[6])+2*(c[1]^c[2]^c[5]^c[6])+4*(c[3]^c[4]^c[5]^c[6]);
 const parity=c.reduce((a,b)=>a^b,0);
 if(syndrome&&!parity)return {status:'uncorrectable',code:c,position:null};
 const position=parity?(syndrome?syndrome-1:7):null;
 if(position!==null)c[position]^=1;
 return {status:position!==null?'corrected':'clean',code:c,position,data:[c[2],c[4],c[5],c[6]]};
}
export function sampleBits(original,shift=.12,reference=.5) {
 return original.map((bit,i)=>Number((bit?.78:.22)+shift*(i%2?.75:1.15)>reference));
}
export function wearCycle(counts,balanced,bad=-1) {
 const next=[...counts];const eligible=next.map((v,i)=>({v,i})).filter(x=>x.i!==bad);
 const index=balanced?eligible.reduce((a,b)=>a.v<=b.v?a:b).i:eligible[0].i;
 next[index]++;return {counts:next,index};
}
