import { chromium, expect } from '@playwright/test';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises';
import ts from 'typescript';
import os from 'node:os';

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidence = path.resolve(project, 'evidence');
await fs.mkdir(evidence, { recursive: true });


// Test the exact pure heading helper used by the Three.js OHT actor.
// Transpiling this no-import module allows the production static Pages smoke
// to check 360° seam handling without changing app globals or Native state.
const headingSource = await fs.readFile(path.join(project, 'src/sim/vehicleHeading.ts'), 'utf8');
const headingModule = ts.transpileModule(headingSource, {compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const { shortestHeadingDelta, continuousVehicleHeading } = await import(
  'data:text/javascript;base64,' + Buffer.from(headingModule).toString('base64')
);
const transitions = [
  [359,1,2], [1,359,-2], [170,-170,20], [-170,170,-20],
  [270,-90,0], [-90,270,0], [630,-90,0], [-630,90,0],
];
for(const [start,end,expected] of transitions){
  const actual=shortestHeadingDelta(start,end);
  if(Math.abs(actual-expected)>1e-8 ||
     Math.abs(continuousVehicleHeading(start,end)-start-expected)>1e-8)
    throw new Error('OHT heading seam introduced a full rotation: '+JSON.stringify({start,end,expected,actual}));
}
const railUturn=[175,179,-179,-175,-150,-120,-90,-60,-30,0,30,60,90,120,150,179,-179];
let followed=railUturn[0],maxStep=0;
for(const angle of railUturn.slice(1)){
  const next=continuousVehicleHeading(followed,angle);
  maxStep=Math.max(maxStep,Math.abs(next-followed));
  if(Math.abs(next-followed)>90)throw new Error('U-turn link boundary caused an extra spin: '+JSON.stringify({followed,angle,next}));
  followed=next;
}
console.log('oht-heading-seam-regression',JSON.stringify({cases:transitions.length,maxStep,final:followed}));

// Exercise the real confirmed-motion interpolation across TWO connected native
// links in ONE 0.5s tick. The old implementation compared every sample against
// the first heading, so a swept turn >180° jumped backward by a full 360°.
const moduleUrl = source => 'data:text/javascript;base64,' + Buffer.from(
  ts.transpileModule(source, {compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText
).toString('base64');
const headingUrl = moduleUrl(headingSource);
const geometrySource = await fs.readFile(path.join(project, 'src/sim/geometry.ts'), 'utf8');
const geometryUrl = moduleUrl(geometrySource.replaceAll("'./vehicleHeading'", "'" + headingUrl + "'"));
const motionSource = await fs.readFile(path.join(project, 'src/sim/motion.ts'), 'utf8');
const motionUrl = moduleUrl(motionSource.replaceAll("'./geometry'", "'" + geometryUrl + "'")
  .replaceAll("'./vehicleHeading'", "'" + headingUrl + "'"));
const { confirmedMotion } = await import(motionUrl);
function assertNativeTurn(sign) {
  const coords = [[0,0],[10,0],[20,10],[20,20],[10,30],[0,30],[-10,20],[-10,10]];
  const tangent = [0,45,90,135,179,-179,-135,-90].map(value => value * sign);
  const points = coords.map(([x,y],i) => ({x,y: y*sign,tangent:tangent[i]}));
  const layout = {
    nodes:[{id:'A',x:points[0].x,y:points[0].y,floor:0},{id:'B',x:points[4].x,y:points[4].y,floor:0},
      {id:'C',x:points[7].x,y:points[7].y,floor:0}],
    links:[{id:'curve-a',from:'A',to:'B',kind:'rail',path:points.slice(0,5)},
      {id:'curve-b',from:'B',to:'C',kind:'rail',path:points.slice(4)}],
  };
  const before = {node:'A',link:'curve-a',progress:0};
  const after = {node:'B',link:'curve-b',progress:1};
  const at = confirmedMotion(layout,before,after);
  let last = at(0).angle, maxStep = 0;
  for(let i=1;i<=120;i++) {
    const next = at(i/120).angle;
    const delta = next-last;
    maxStep = Math.max(maxStep,Math.abs(delta));
    if(!Number.isFinite(next) || delta*sign < -1e-7 || Math.abs(delta) > 22)
      throw Error('Native U-turn heading spun/reversed at frame '+i+': '+JSON.stringify({sign,last,next,delta}));
    last = next;
  }
  if (Math.abs(last-sign*270) > 1e-6)
    throw Error('Native 270-degree confirmed turn failed: '+JSON.stringify({sign,last,maxStep}));
  // A renderer heading can be on another 360° branch. It must use a stable
  // offset for the whole tick, instead of rewrapping each frame.
  for(const displayed of [-720,0,720]) {
    const offset = continuousVehicleHeading(displayed,at(0).angle)-at(0).angle;
    let prev = at(0).angle + offset;
    for(let i=1;i<=120;i++) {
      const heading=at(i/120).angle+offset;
      if((heading-prev)*sign < -1e-7 || Math.abs(heading-prev)>22)
        throw Error('Renderer branch reversed during confirmed turn '+JSON.stringify({sign,displayed,prev,heading}));
      prev=heading;
    }
  }
  return maxStep;
}
const uturnMax = [1,-1].map(assertNativeTurn);
console.log('oht-native-multilink-uturn',JSON.stringify({cases:2,maxStep:uturnMax}));

const sandbox = await fs.mkdtemp(path.join(os.tmpdir(), 'work6-static-'));
const deploymentDir = path.join(sandbox, 'build-canvas', 'fab-flow-preview');
await fs.mkdir(deploymentDir, { recursive: true });
await fs.cp(path.join(project, 'dist-pages'), deploymentDir, { recursive: true });
const server = spawn('python3',
  ['-m','http.server','4179','--bind','127.0.0.1','--directory',sandbox],
  { cwd: project, stdio: ['ignore','pipe','pipe'] });
const logs = [];
server.stdout.on('data', data => logs.push(data.toString()));
server.stderr.on('data', data => logs.push(data.toString()));
async function ready() {
  for (let i=0;i<50;i++) {
    if (server.exitCode !== null) throw Error('Static server exited: ' + logs.join(''));
    try {
      const response = await fetch('http://127.0.0.1:4179/build-canvas/fab-flow-preview/');
      if(response.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  throw Error('Static server not ready: ' + logs.join(''));
}
let browser;
try {
  await ready();
  browser = await chromium.launch({
    headless: true, args: ['--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader','--disable-dev-shm-usage']
  });
  for (const [width,height] of [[1440,900],[390,844]]) {
    const page = await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
    const faults = [];
    page.on('pageerror', e=>faults.push(String(e)));
    page.on('console', msg=>{if(msg.type()==='error') faults.push(msg.text());});
    page.on('response', resp=>{if(resp.status()>=400) faults.push('HTTP '+resp.status()+' '+resp.url());});
    const response = await page.goto('http://127.0.0.1:4179/build-canvas/fab-flow-preview/', {waitUntil:'domcontentloaded'});
    if(response?.status() !== 200) throw Error('Page status '+response?.status());
    await expect(page.locator('.w6-root')).toHaveAttribute('data-scene-count','8');
    await expect(page.locator('[data-renderer="three-webgl"]')).toBeVisible({timeout:45000});
    await expect(page.getByRole('heading',{name:'이 작은 공장은 어떻게 움직일까?'})).toBeVisible();
    const opening = await page.locator('.w6-root').evaluate(node=>({moving:Number(node.dataset.openingMoving),local:Number(node.dataset.openingLocalMoving)}));
    if(opening.moving < 2 || opening.local < 2) throw Error('Native opening lost real OHT activity: '+JSON.stringify(opening));
    const openingSpan = await page.evaluate(() => window.__FAB_3D__?.camera?.span);
    await page.screenshot({path:path.join(evidence,'engineering-opening-'+width+'.png')});

    await page.getByRole('button',{name:/Scene 02:/}).click();
    await expect(page.getByRole('heading',{name:'공장 안의 길은 어떻게 코드가 될까?'})).toBeVisible();
    await expect(page.locator('.w6-root')).toHaveAttribute('data-scene2-network','factory');
    await expect.poll(() => page.evaluate(() => window.__FAB_3D__?.networkPresentation?.equipmentVisible),{timeout:30000}).toBe(true);
    const factoryWorld = await page.evaluate(() => window.__FAB_3D__?.worldId);
    await page.screenshot({path:path.join(evidence,'scene2-factory-'+width+'.png')});
    await page.getByRole('button',{name:'길찾기 구조 보기'}).click();
    await expect(page.locator('.w6-root')).toHaveAttribute('data-scene2-network','network');
    await expect(page.getByText(/공장 속 실제 한 구간을 확대했어요/)).toBeVisible();
    await expect.poll(() => page.evaluate(() => window.__FAB_3D__?.networkPresentation),{timeout:30000})
      .toMatchObject({active:true,equipmentVisible:false,originalRailsVisible:true});
    const actualGraph = await page.evaluate(() => window.__FAB_3D__?.networkPresentation);
    if(!actualGraph || actualGraph.highlightedNativeLinks < 1 ||
       actualGraph.nodes < 1 || actualGraph.directedLinks < 1 ||
       actualGraph.directionArrows < 1 || actualGraph.ports < 1 ||
       !actualGraph.example?.portId || !actualGraph.example?.linkId || !actualGraph.example?.nodeId)
      throw Error('Scene 02 actual Native Node/Link/Port model missing: '+JSON.stringify(actualGraph));
    await expect(page.getByText('Node',{exact:true})).toBeVisible();
    await expect(page.getByText('Link',{exact:true})).toBeVisible();
    await expect(page.getByText('Port',{exact:true})).toBeVisible();
    if (width === 390) {
      const panel = await page.locator('.w6-narrative').boundingBox();
      if (!panel || panel.y < height * .50)
        throw Error('Scene 02 graph is hidden beneath the portrait narrative: '+JSON.stringify({panel,viewport:[width,height]}));
    }
    const sampleCamera = await page.evaluate(() => window.__FAB_3D__?.camera?.span);
    if(!Number.isFinite(sampleCamera) || sampleCamera > openingSpan*.9)
      throw Error('Scene 02 did not focus the real graph close-up: '+JSON.stringify({openingSpan,sampleCamera}));
    await page.waitForTimeout(250);
    await page.screenshot({path:path.join(evidence,'scene2-graph-'+width+'.png')});
    await page.getByRole('button',{name:'공장 보기'}).click();
    await expect(page.locator('.w6-root')).toHaveAttribute('data-scene2-network','factory');
    await expect.poll(() => page.evaluate(() => window.__FAB_3D__?.networkPresentation?.equipmentVisible)).toBe(true);
    await expect.poll(() => page.evaluate(() => window.__FAB_3D__?.networkPresentation?.highlightedNativeLinks)).toBe(0);
    const restoredWorld = await page.evaluate(() => window.__FAB_3D__?.worldId);
    if (factoryWorld !== restoredWorld)
      throw Error('Scene 02 toggle unexpectedly rebuilt original native 3D world');
    console.log('scene2-native-network-toggle',JSON.stringify({
      viewport:[width,height], nativeNodes:actualGraph.nodes, nativeLinks:actualGraph.directedLinks,
      directedArrows:actualGraph.directionArrows, nativePorts:actualGraph.ports,
      example:actualGraph.example, worldPreserved:true
    }));

    await page.getByRole('button',{name:/Scene 03:/}).click();
    await expect(page.getByRole('heading',{name:/상자 하나를 옮기는 데도 여러 단계/})).toBeVisible();
    await page.getByRole('button',{name:'한 단계씩'}).click();
    await expect(page.getByText(/요청이 등록됐어요/)).toBeVisible({timeout:20000});
    await page.getByRole('button',{name:'한 단계씩'}).click();
    await expect(page.getByText(/한 대가 이번 운송/)).toBeVisible({timeout:20000});
    const route = await page.evaluate(()=>(window.__FAB_3D__?.routes || []).filter(x=>x.selected));
    if(route.length === 0 || route.some(x=>!x.links?.length)) throw Error('Native selected route missing after dispatch');
    if(width===1440) {
      await page.getByRole('button',{name:'끝까지 자동 관찰하기'}).click();
      await expect(page.getByText(/운송이 완료됐습니다/)).toBeVisible({timeout:180000});
      await page.screenshot({path:path.join(evidence,'engineering-transport-'+width+'.png')});
    }

    await page.getByRole('button',{name:/Scene 04:/}).click();
    await expect(page.getByRole('heading',{name:'시뮬레이션의 1초는 어떻게 흐를까?'})).toBeVisible();
    const before = await page.locator('.w6-root').evaluate(node=>({time:Number(node.dataset.clockTime),tick:Number(node.dataset.clockTick)}));
    await page.getByRole('button',{name:'0.5초 한 Tick'}).click();
    const after = await page.locator('.w6-root').evaluate(node=>({time:Number(node.dataset.clockTime),tick:Number(node.dataset.clockTick)}));
    if(after.time !== before.time+0.5 || after.tick !== before.tick+1)
      throw Error('Native tick mismatch: '+JSON.stringify({before,after}));
    await page.getByRole('button',{name:'같은 조건으로 다시'}).click();
    const repeat = await page.locator('.w6-root').evaluate(node=>({time:Number(node.dataset.clockTime),tick:Number(node.dataset.clockTick)}));
    if(repeat.time!==before.time || repeat.tick!==before.tick) throw Error('Native reset is not deterministic');
    if(width===1440) {
      await page.getByRole('button',{name:'재생',exact:true}).click();
      await page.waitForTimeout(1100);
      await page.getByRole('button',{name:'일시정지'}).click();
      const t = Number(await page.locator('.w6-root').getAttribute('data-clock-time'));
      await page.waitForTimeout(700);
      const paused = Number(await page.locator('.w6-root').getAttribute('data-clock-time'));
      if(t!==paused) throw Error('Clock advanced after pause');
    }

    await page.getByRole('button',{name:/Scene 05:/}).click();
    await expect(page.getByRole('heading',{name:'가장 짧은 길이 항상 좋은 길일까?'})).toBeVisible();
    await expect(page.getByRole('button',{name:'함께 보기'})).toBeVisible({timeout:90000});
    await page.getByRole('button',{name:'다른 길'}).click();
    await expect(page.getByText(/버튼은 실제 운송 상태를 바꾸지 않습니다/)).toBeVisible();

    await page.getByRole('button',{name:/Scene 06:/}).click();
    await expect(page.getByRole('heading',{name:/모두 규칙대로 움직이는데/})).toBeVisible();
    if(width===1440) {
      await expect(page.locator('.w6-root')).toHaveAttribute('data-pressure-prepared','true',{timeout:120000});
      await expect(page.locator('.w6-root')).toHaveAttribute('data-pressure-verified','true');
      await page.screenshot({path:path.join(evidence,'engineering-traffic-'+width+'.png')});
    }

    await page.getByRole('button',{name:/Scene 07:/}).click();
    await expect(page.getByText('131',{exact:false})).toBeVisible();
    await expect(page.getByText('130',{exact:false})).toBeVisible();
    await expect(page.getByText(/이전 operational 2.1 실험/)).toBeVisible();
    await page.getByRole('button',{name:/Scene 08:/}).click();
    await expect(page.getByRole('heading',{name:/움직이는 화면 뒤에는/})).toBeVisible();
    await expect(page.getByRole('link',{name:/FAB FLOW 직접 체험하기/}))
      .toHaveAttribute('href','https://fabflow-yoon.vercel.app/');
    await page.waitForTimeout(1500);
    const endingSpan = await page.evaluate(() => window.__FAB_3D__?.camera?.span);
    if(!Number.isFinite(openingSpan) || !Number.isFinite(endingSpan) || endingSpan > openingSpan * 1.25)
      throw Error('Final native OHT camera lost readable scale: '+JSON.stringify({openingSpan,endingSpan}));
    await page.screenshot({path:path.join(evidence,'engineering-ending-'+width+'.png')});
    if(faults.length) throw Error('Browser faults: '+JSON.stringify(faults.slice(0,15)));
    console.log('engineering-smoke-pass',JSON.stringify({viewport:[width,height],opening,clockBefore:before,clockAfter:after}));
    await page.close();
  }
} finally {
  if(browser) await browser.close();
  server.kill('SIGTERM');
  await fs.rm(sandbox,{recursive:true,force:true});
}
