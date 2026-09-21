import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {scenes,sceneLearning,hierarchyScenes,articleSections,articleReading,renderArticle,writeSteps,writeNotes,readSteps,readNotes,retrySteps,retryNotes} from '../content.mjs';

test('journey and all navigation targets remain complete after scene restructuring',async()=>{
 const ids=new Set(scenes.map(s=>s.id));assert.equal(ids.size,scenes.length);
 assert.deepEqual(new Set(Object.keys(sceneLearning)),ids);
 for(const s of scenes)assert.ok(sceneLearning[s.id].every(text=>text.length>20),`Missing explanation or action guidance: ${s.id}`);
 assert.equal(scenes[0].object,'computer');assert.equal(scenes.at(-1).object,'computer');
 for(const id of [...hierarchyScenes,'program','read','erase','address','ftl','gc','wear','ecc','write','read-flow'])assert.ok(ids.has(id),id);
 const sources=await Promise.all(['main.js','diagrams.mjs','index.html'].map(f=>readFile(new URL(`../${f}`,import.meta.url),'utf8')));
 for(const source of sources)for(const [,id] of source.matchAll(/(?:go:|data-go=")([a-z][a-z-]*)/g))assert.ok(ids.has(id),`Broken destination ${id}`);
});
test('static Article is source-complete without JavaScript and every reference has a name',async()=>{
 const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
 assert.equal(html.match(/<!-- article:start -->([\s\S]*?)<!-- article:end -->/)[1].trim(),renderArticle());
 assert.equal(new Set(articleSections.map(a=>a[0])).size,articleSections.length);
 for(const [id,title,a,b,c,sources,back] of articleSections){assert.ok(title&&a&&b&&c,id);assert.ok(scenes.some(s=>s.id===back));for(const [label,url] of sources){assert.ok(label.length>8);assert.equal(new URL(url).protocol,'https:');}}
});
test('every write, read and retry phase has its own explanatory result',()=>{
 for(const [steps,notes] of [[writeSteps,writeNotes],[readSteps,readNotes],[retrySteps,retryNotes]]){assert.equal(steps.length,notes.length);assert.ok(notes.every(Boolean));}
});
test('Article reading layers keep every source paragraph once and leave core caveats visible',()=>{
 const html=renderArticle();
 assert.deepEqual(Object.keys(articleReading),articleSections.map(section=>section[0]));
 for(const [id,,...rest] of articleSections){
  const section=html.split(`id="article-${id}"`)[1].split('</section>')[0];
  for(const paragraph of rest.slice(0,3))assert.equal(section.split(`<p>${paragraph}</p>`).length,2,`${id}: paragraph lost or repeated`);
  assert.ok(section.includes('class="article-key"'));
  assert.ok(!section.includes('<details open'));
 }
 const core=html.replace(/<details[\s\S]*?<\/details>/g,'');
 assert.ok(!core.includes('Flush는'));
 assert.ok(!core.includes('Dynamic Wear Leveling(동적 방식)'));
 for(const caveat of ['저장 버튼을 누른 순간 곧바로 모든 기록이 끝난다는 뜻은 아닙니다','그 모양이 실제 반도체 내부의 층 모양과 일치한다는 뜻은 아닙니다','비휘발성을 영구 보존과 혼동해서는 안 됩니다','3 bit 이상에서는 이 보장이 성립하지 않으므로','TLC에서는 같은 Cell 집합이 여러 논리 Page를 표현할 수 있습니다','실제 SSD의 ECC 전체 구현을 재현하는 모델은 아닙니다','어떤 오류든 Retry로 복원된다는 보장은 없습니다'])assert.ok(core.includes(caveat),caveat);
});
