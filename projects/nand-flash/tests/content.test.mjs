import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {scenes,hierarchyScenes,articleSections,renderArticle,writeSteps,writeNotes,readSteps,readNotes,retrySteps,retryNotes} from '../content.mjs';

test('journey and all navigation targets remain complete after scene restructuring',async()=>{
 const ids=new Set(scenes.map(s=>s.id));assert.equal(ids.size,scenes.length);
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
