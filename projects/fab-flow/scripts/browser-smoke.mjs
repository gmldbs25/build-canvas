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

const sandbox = await fs.mkdtemp(path.join(os.tmpdir(), 'work6-static-'));
const deploymentDir = path.join(sandbox, 'build-canvas', 'fab-flow-preview');
await fs.mkdir(deploymentDir, { recursive: true });
await fs.cp(path.join(project,'dist-pages'),deploymentDir,{recursive:true});
const server = spawn('python3',
  ['-m','http.server','4179','--bind','127.0.0.1','--directory',sandbox],
  { cwd: project, stdio: ['ignore','pipe','pipe'] });
const logs = [];
server.stdout.on('data', data => logs.push(data.toString()));
server.stderr.on('data', data => logs.push(data.toString()));

async function ready() {
  for (let i = 0; i < 50; i++) {
    if (server.exitCode !== null) throw new Error('Vite preview exited: ' + logs.join(''));
    try {
      const response = await fetch('http://127.0.0.1:4179/build-canvas/fab-flow-preview/');
      if (response.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  throw new Error('Vite preview did not start: ' + logs.join(''));
}
let browser;
try {
  await ready();
  browser = await chromium.launch({
    headless: true,
    args: ['--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader','--disable-dev-shm-usage']
  });
  for (const [width,height] of [[1440,900],[390,844]]) {
    const page = await browser.newPage({ viewport: { width,height }, deviceScaleFactor: 1 });
    const faults=[];
    page.on('pageerror',e=>faults.push(String(e)));
    page.on('console',msg=>{ if(msg.type()==='error') faults.push(msg.text()); });
    page.on('response',response=>{if(response.status()>=400)faults.push('HTTP '+response.status()+' '+response.url());});
    const response = await page.goto('http://127.0.0.1:4179/build-canvas/fab-flow-preview/', { waitUntil:'domcontentloaded' });
    await page.waitForTimeout(1100);
    console.log('initial-debug',JSON.stringify({viewport:[width,height],status:response?.status(),title:await page.title(),text:(await page.locator('body').innerText()).slice(0,350),errors:faults.slice(0,8)}));
    await expect(page.locator('[data-camera-locked="true"]')).toBeVisible({timeout:30000});
    const tableauStats = await page.locator('.w6-root').evaluate(node => ({
      moving: Number(node.dataset.openingMoving), local: Number(node.dataset.openingLocalMoving),
    }));
    if(tableauStats.moving < 2 || tableauStats.local < 2) {
      throw new Error('Opening needs multiple real moving OHTs in one local frame: '+JSON.stringify(tableauStats));
    }
    const viewBefore=await page.evaluate(() => window.__FAB_3D__ && ({
      camera: window.__FAB_3D__.camera,
      following: window.__FAB_3D__.following,
      vehicles: window.__FAB_3D__.vehicles,
      tick: window.__FAB_3D__.tick
    }));
    await page.waitForTimeout(1800);
    const viewAfter=await page.evaluate(() => window.__FAB_3D__ && ({
      camera: window.__FAB_3D__.camera,
      following: window.__FAB_3D__.following,
      vehicles: window.__FAB_3D__.vehicles,
      tick: window.__FAB_3D__.tick
    }));
    if(!viewBefore?.camera || !viewAfter?.camera || viewBefore.following || viewAfter.following ||
        Math.abs(viewBefore.camera.target.x-viewAfter.camera.target.x)>0.02 ||
        Math.abs(viewBefore.camera.target.z-viewAfter.camera.target.z)>0.02 ||
        Math.abs(viewBefore.camera.span-viewAfter.camera.span)>0.02 ||
        viewAfter.tick<=viewBefore.tick) {
      throw new Error('Opening camera moved or native engine stalled: '+JSON.stringify({before:viewBefore?.camera,after:viewAfter?.camera,ticks:[viewBefore?.tick,viewAfter?.tick],following:viewAfter?.following}));
    }
    const movingInFrame=Object.entries(viewBefore.vehicles ?? {}).filter(([id,a]) => {
      const b=viewAfter.vehicles?.[id];
      return b && ['empty','loaded'].includes(a.phase) &&
        a.x >= 0 && a.x <= width && a.y >= 0 && a.y <= height &&
        Math.hypot(b.x-a.x,b.y-a.y) > 1.3;
    }).length;
    if(width===1440 && movingInFrame < 2){
      throw new Error('Opening has fewer than two visibly moving OHTs: '+JSON.stringify({movingInFrame,tableauStats,visible:Object.keys(viewBefore.vehicles||{}).length}));
    }
    console.log('opening-fixed-tableau',JSON.stringify({viewport:[width,height],tableauStats,movingInFrame,fromTick:viewBefore.tick,toTick:viewAfter.tick,span:viewAfter.camera.span}));
    await page.screenshot({path:path.join(evidence,'initial-'+width+'.png')});
    await expect(page.getByRole('heading', {name:'공장 안에도 교통체증이?'})).toBeVisible({timeout:5000});
    await expect(page.locator('.w6-root')).toHaveAttribute('data-scene-count','11');
    await expect(page.locator('[data-renderer="three-webgl"]')).toBeVisible({timeout:30000});
    const intro = await page.locator('.w6-root').evaluate(node => ({
      source: node.dataset.introSourceBay,
      destination: node.dataset.introDestinationBay,
      seed: Number(node.dataset.introSelectedSeed),
      distance: Number(node.dataset.introDirectedDistance),
    }));
    const sourceIndex = Number(intro.source?.match(/^B(\d+)$/)?.[1]);
    const targetIndex = Number(intro.destination?.match(/^B(\d+)$/)?.[1]);
    if (!Number.isInteger(sourceIndex) || targetIndex !== sourceIndex+1 || sourceIndex % 3 === 0 ||
        intro.distance < 130 || intro.distance > 850) {
      throw new Error('Intro trip must use adjacent left-to-right Bays, not same-Bay U-turn: ' + JSON.stringify(intro));
    }
    console.log('intro-native-neighbor', JSON.stringify(intro));
    // Work6 keeps its initial teaching scene close-up. Wheel/overview must
    // not spoil the intentional first full-FAB reveal in Scene 04.
    await expect(page.locator('[data-camera-locked="true"]')).toBeVisible();
    await expect(page.getByRole('button', {name:'전체 보기'})).toHaveCount(0);
    const lockedSpan = await page.evaluate(() => window.__FAB_3D__?.camera?.span ?? null);
    await page.locator('.three-scene-host').hover();
    await page.mouse.wheel(0, 720);
    await page.waitForTimeout(300);
    const lockedAfterWheel = await page.evaluate(() => window.__FAB_3D__?.camera?.span ?? null);
    if (lockedSpan !== null && lockedAfterWheel !== null && Math.abs(lockedSpan-lockedAfterWheel) > 1e-2) {
      throw new Error('Initial close-up camera zoom changed on mouse wheel');
    }

    await expect(page.locator('.three-scene-host canvas')).toBeVisible({timeout:30000});
    await page.getByRole('button',{name:/Scene 02:/}).click();
    await expect(page.getByRole('heading',{name:'무엇을 옮기는 걸까?'})).toBeVisible();
    await expect(page.getByText('웨이퍼를 보호하며 이동하는 전용 용기')).toBeVisible();
    await page.getByRole('button',{name:/Scene 03:/}).click();
    await expect(page.getByRole('heading',{name:'하나의 운송은 어떻게 완성될까?'})).toBeVisible();
    const startTick = Number(await page.locator('[data-simulation-tick]').getAttribute('data-simulation-tick'));
    await expect(page.getByText('왜 옮겨야 할까요?')).toBeVisible();
    await page.waitForTimeout(350);
    const beforeRequestView = await page.evaluate(() => ({
      worldId: window.__FAB_3D__?.worldId,
      camera: window.__FAB_3D__?.camera,
    }));
    await expect(page.getByText(/웨이퍼를 담은 보호 (용기|상자)/)).toBeVisible();
    await page.getByRole('button',{name:/다음 장비로 보내기/}).click();
    await expect(page.getByText('누가 옮겨 줄까요?')).toBeVisible({timeout:12000});
    await expect(page.getByText(/아직 차량은 움직이지 않았어요/)).toBeVisible({timeout:12000});
    await page.waitForTimeout(400);
    const afterRequestView = await page.evaluate(() => ({
      worldId: window.__FAB_3D__?.worldId,
      camera: window.__FAB_3D__?.camera,
    }));
    const beforeCamera = beforeRequestView.camera;
    const afterCamera = afterRequestView.camera;
    const diff = beforeCamera && afterCamera ? Math.max(
      Math.abs(beforeCamera.span - afterCamera.span),
      Math.abs(beforeCamera.target.x - afterCamera.target.x),
      Math.abs(beforeCamera.target.y - afterCamera.target.y),
      Math.abs(beforeCamera.target.z - afterCamera.target.z),
    ) : Infinity;
    if (!beforeRequestView.worldId || beforeRequestView.worldId !== afterRequestView.worldId ||
        !Number.isFinite(diff) || diff > 0.05) {
      throw new Error('Creating a FOUP must keep the same Native world and exact camera frame: ' +
        JSON.stringify({before:beforeRequestView,after:afterRequestView,diff}));
    }
    console.log('request-stable-camera', JSON.stringify({worldId:afterRequestView.worldId,span:afterCamera.span,cameraDiff:diff}));
    if (await page.locator('[data-simulation-tick]').count() !== 1) throw new Error('Native engine view disappeared after first transfer request');
    const nextTick=Number(await page.locator('[data-simulation-tick]').getAttribute('data-simulation-tick'));
    if(nextTick <= startTick) throw new Error('No real Native Tick after request action');
    await page.getByRole('button',{name:/담당 차량 정하기/}).click();
    await expect(page.getByText('차량은 어디로 가야 할까요?')).toBeVisible({timeout:12000});
    await expect(page.getByText('실제 OHT 이동 경로')).toBeVisible({timeout:12000});
    const nativeRoute=await page.evaluate(() => (window.__FAB_3D__?.routes || []).filter(route=>route.selected));
    if(nativeRoute.length===0 || nativeRoute.some(route=>route.links.length===0)) {
      throw new Error('Expected a selected native MCS path on real rail links after dispatch');
    }
    await page.screenshot({path:path.join(evidence, 'scene03-'+width+'.png')});
    if (width === 1440) {
      // A complete transport regression: the hoist must finish while the
      // camera remains in the close Scene 03 framing, not auto-reveal Bay.
      await page.getByRole('button', {name:/빈 차량이 가지러 가는 모습 보기/}).click();
      await expect(page.getByText('이제 무엇을 실을까요?')).toBeVisible({timeout:90000});
      await page.getByRole('button', {name:/FOUP 싣는 모습 보기/}).click();
      const pickupSamples = await page.evaluate(async () => {
        const samples = [];
        for (let sample = 0; sample < 36; sample++) {
          const handoff = window.__FAB_3D__?.carrierHandoff;
          if (handoff?.visible && Number.isFinite(handoff.centerY) &&
              (handoff.phase === 'pickup' || handoff.phase === 'loaded'))
            samples.push({phase:handoff.phase, height:handoff.centerY});
          await new Promise(resolve => setTimeout(resolve, 75));
        }
        return samples;
      });
      const pickupHeights = pickupSamples.map(item => item.height);
      if (pickupHeights.length < 3 ||
          pickupHeights.some((height, i) => i > 0 && height < pickupHeights[i-1] - 0.5) ||
          Math.min(...pickupHeights) < 7 ||
          !pickupSamples.some(item => item.phase === 'loaded' && item.height > 28 && item.height < 38.5) ||
          Math.abs(pickupHeights.at(-1) - 39) > 0.6) {
        throw new Error('Native pickup must keep rendering the last hoist travel tick after Engine phase becomes loaded: ' + JSON.stringify(pickupSamples));
      }
      console.log('native-pickup-heights',JSON.stringify(pickupSamples));
      await expect(page.getByText('어떤 길로 가면 될까요?')).toBeVisible({timeout:30000});
      await page.screenshot({path:path.join(evidence, 'scene03-pickup-'+width+'.png')});
      await page.getByRole('button', {name:/이동할 길 살펴보기/}).click();
      await expect(page.getByText('이제 다음 장비로 출발!')).toBeVisible({timeout:12000});
      const chosenRoute = await page.evaluate(() => (window.__FAB_3D__?.routes ?? []).find(route => route.selected));
      if (!chosenRoute?.links?.length) throw new Error('Adjacent-Bay transport has no genuine MCS path');
      console.log('native-loaded-route',JSON.stringify({links:chosenRoute.links.length,bays:[intro.source,intro.destination]}));
      await page.getByRole('button', {name:/운송 따라가기/}).click();
      await expect(page.getByText('도착하면 무엇을 할까요?')).toBeVisible({timeout:90000});
      const beforeDropoff = await page.evaluate(() => window.__FAB_3D__?.camera?.span ?? null);
      await page.getByRole('button', {name:/FOUP 내려놓기/}).click();
      await expect(page.getByText('한 건의 운송이 끝났어요.')).toBeVisible({timeout:30000});
      await page.waitForTimeout(350);
      const afterDropoff = await page.evaluate(() => window.__FAB_3D__?.camera?.span ?? null);
      if (beforeDropoff !== null && afterDropoff !== null && afterDropoff > beforeDropoff * 1.5) {
        throw new Error('Dropoff unexpectedly zoomed out before Scene 04 reveal');
      }
      await expect(page.locator('[data-camera-locked="true"]')).toBeVisible();
      const finalFoup = await page.evaluate(() => ({
        colors: window.__FAB_3D__?.portFoupColor,
        owners: window.__FAB_3D__?.physicalFoups
      }));
      if (!finalFoup.colors?.source || !finalFoup.colors?.stored ||
          finalFoup.colors.source.some((part, index) => Math.abs(part - finalFoup.colors.stored[index]) > .00001) ||
          !finalFoup.owners?.some(token => token.owner === 'stocker')) {
        throw new Error('Delivered FOUP must remain the same amber model at its Port: ' + JSON.stringify(finalFoup));
      }
      console.log('native-delivered-foup',JSON.stringify({colors:finalFoup.colors,stored:finalFoup.owners.filter(token => token.owner === 'stocker').length}));
      await page.screenshot({path:path.join(evidence, 'scene03-dropoff-'+width+'.png')});
      console.log('transport-finished',JSON.stringify({viewport:[width,height],beforeDropoff,afterDropoff}));
    }
    if (width === 1440) {
      const revealButton = page.getByRole('button', {name:/전체 FAB 살펴보기/});
      await expect(revealButton).toBeEnabled();
      const cameraBeforeReveal = await page.evaluate(() => window.__FAB_3D__?.camera);
      const originalCanvas = await page.locator('.three-scene-host canvas').evaluate(node => {
        node.dataset.work6CanvasIdentity = 'preserved-native-world';
        return node.dataset.work6CanvasIdentity;
      });
      if (!cameraBeforeReveal || originalCanvas !== 'preserved-native-world') {
        throw new Error('Could not capture close-up before the editorial reveal');
      }
      await revealButton.click();
      await expect(page.getByRole('heading',{name:'지금까지 본 건 공장의 극히 일부였다.'})).toBeVisible();
      await expect(page.locator('[data-camera-locked="false"]')).toBeVisible();
      await expect(page.getByRole('button',{name:'전체 FAB 살펴보기, 완료'})).toBeDisabled();
      await expect(page.getByRole('button',{name:/전체 FAB 보기/})).toHaveCount(0);
      await page.waitForTimeout(500);
      const earlyReveal = await page.evaluate(() => window.__FAB_3D__?.camera);
      await page.waitForTimeout(850);
      const middleReveal = await page.evaluate(() => window.__FAB_3D__?.camera);
      await page.waitForTimeout(2000);
      const finalReveal = await page.evaluate(() => window.__FAB_3D__?.camera);
      const canvasPreserved = await page.locator('.three-scene-host canvas').getAttribute('data-work6-canvas-identity');
      if (!earlyReveal || !middleReveal || !finalReveal ||
          !(cameraBeforeReveal.span < earlyReveal.span && earlyReveal.span < middleReveal.span && middleReveal.span < finalReveal.span) ||
          !(finalReveal.span >= cameraBeforeReveal.span * 5) ||
          canvasPreserved !== 'preserved-native-world') {
        throw new Error('Scene 03 -> 04 must be a monotone smooth zoom on the same native canvas: '+
          JSON.stringify({before:cameraBeforeReveal?.span,early:earlyReveal?.span,middle:middleReveal?.span,final:finalReveal?.span,canvasPreserved}));
      }
      console.log('native-cinematic-reveal',JSON.stringify({
        before:cameraBeforeReveal.span, early:earlyReveal.span,
        middle:middleReveal.span, final:finalReveal.span, preserved:true,
      }));
    } else {
      await page.getByRole('button',{name:/Scene 04:/}).click();
      await expect(page.getByRole('heading',{name:'지금까지 본 건 공장의 극히 일부였다.'})).toBeVisible();
      await expect(page.locator('[data-camera-locked="false"]')).toBeVisible();
      await expect(page.getByRole('button',{name:'전체 FAB 살펴보기, 완료'})).toBeDisabled();
      await page.waitForTimeout(3100);
    }
    await page.screenshot({path:path.join(evidence, 'scene04-'+width+'.png')});
    await page.getByRole('button',{name:/Scene 06:/}).click();
    await expect(page.getByRole('heading',{name:'멀리 있는 장비까지, 어느 길로 갈까?'})).toBeVisible();
    await expect(page.getByRole('button',{name:'MCS가 선택한 길'})).toBeVisible({timeout:45000});
    await expect(page.locator('.w6-decision-row')).toContainText('B01');
    await expect(page.locator('.w6-decision-row')).toContainText('B09');
    await expect(page.locator('.w6-decision-row')).toContainText('출발 Bay → 도착 Bay');
    await expect(page.locator('.w6-decision-row')).not.toContainText('모형 거리 단위');
    const nativeStudy = await page.locator('.w6-root').evaluate(node => ({
      seed: Number(node.dataset.routeStudySeed),
      source: node.dataset.routeStudySource,
      destination: node.dataset.routeStudyDestination,
    }));
    const selectedLongRoute = await page.evaluate(() => (window.__FAB_3D__?.routes ?? []).find(route => route.selected)?.links ?? []);
    const fromBayNo=Number(nativeStudy.source.match(/^B(\d+)$/)?.[1]);
    const toBayNo=Number(nativeStudy.destination.match(/^B(\d+)$/)?.[1]);
    const routeContrast = await page.locator('.w6-root').evaluate(node => ({
      distinct: Number(node.dataset.routeStudyDistinctFraction),
      separation: Number(node.dataset.routeStudySeparation),
      alternativeKind: node.dataset.routeStudyAlternativeKind,
    }));
    if(!nativeStudy.seed || !Number.isInteger(fromBayNo) || !Number.isInteger(toBayNo) ||
        Math.abs(Math.floor((fromBayNo-1)/3)-Math.floor((toBayNo-1)/3)) !== 2 ||
        Math.abs((fromBayNo-1)%3-(toBayNo-1)%3) !== 2 || selectedLongRoute.length < 12 ||
        routeContrast.distinct < .2 || routeContrast.separation < 360 ||
        !['native','detour'].includes(routeContrast.alternativeKind)){
      throw new Error('Scene 06 must use diagonal opposite Bays with meaningfully divergent genuine rail paths: '+JSON.stringify({nativeStudy,routeContrast,selectedLongRoute:selectedLongRoute.length}));
    }
    await page.getByRole('button',{name:'다른 가능한 길'}).click();
    await expect(page.locator('.w6-decision-row')).toContainText('우회 경로');
    await expect(page.locator('.w6-decision-copy')).toContainText('어디에서 갈라지는지');
    await expect.poll(
      async () => page.evaluate(() => (window.__FAB_3D__?.routes ?? []).find(route => route.selected)?.links?.join('|') ?? ''),
      {timeout:9000},
    ).not.toBe(selectedLongRoute.join('|'));
    const alternativeLongRoute = await page.evaluate(() => (window.__FAB_3D__?.routes ?? []).find(route => route.selected)?.links ?? []);
    if(alternativeLongRoute.length < 8)
      throw new Error('Native MCS alternative not actually shown on the directed rail network');
    await page.getByRole('button',{name:'두 경로 함께 보기'}).click();
    await expect.poll(async () => page.evaluate(() => window.__FAB_3D__?.routes?.length ?? 0),{timeout:9000}).toBe(2);
    console.log('native-route-study',JSON.stringify({nativeStudy,routeContrast,selectedLinks:selectedLongRoute.length,alternativeLinks:alternativeLongRoute.length}));
    await page.screenshot({path:path.join(evidence, 'scene06-'+width+'.png')});
    await page.getByRole('button',{name:/Scene 05:/}).click();
    await expect(page.getByRole('heading',{name:'차량은 아무 길로나 갈 수 없다.'})).toBeVisible();
    await expect(page.getByText('OHT가 이동하는 정해진 선로')).toBeVisible();

    await page.getByRole('button',{name:/Scene 07:/}).click();
    await expect(page.getByRole('heading',{name:'길을 찾았는데, 왜 기다려야 할까?'})).toBeVisible();
    await expect(page.locator('.w6-root')).toHaveAttribute('data-pressure-prepared','true',{timeout:120000});
    await expect(page.getByText('MCS는 경로를 결정한 뒤에도 변하는 교통 상황에 대응해야 합니다.')).toBeVisible();
    await expect(page.locator('.w6-root')).toHaveAttribute('data-pressure-verified','true');
    await expect(page.locator('.w6-root')).toHaveAttribute('data-pressure-fleet','64');
    const railEvidence = await page.locator('.w6-root').evaluate(node => ({
      vehicle: node.dataset.pressureVehicle, link: node.dataset.pressureQueue,
      wait: Number(node.dataset.pressureStartWait), fleet: Number(node.dataset.pressureFleet),
      active: Number(node.dataset.pressureActive), demand: Number(node.dataset.pressureDemandInterval),
      stagingClearance: Number(node.dataset.pressureStagingClearance),
      vehicleCount: Number(node.dataset.pressureVehicleCount),
      fleetChanges: Number(node.dataset.pressureFleetChanges)
    }));
    if (!railEvidence.vehicle || !railEvidence.link || railEvidence.wait < 3 ||
        railEvidence.active < 10 || railEvidence.demand !== 1 ||
        railEvidence.stagingClearance < 680 || railEvidence.vehicleCount !== railEvidence.fleet ||
        railEvidence.fleetChanges !== 0)
      throw new Error('Scene 07 is not a verified busy Native rail bottleneck: '+JSON.stringify(railEvidence));
    await expect(page.getByText('앞쪽 레일 점유로 대기 중')).toBeVisible({timeout:12000});
    console.log('scene07-verified-native-bottleneck',JSON.stringify(railEvidence));
    // Native state and scenario fleet remain fixed. Off-rail staging may
    // dispatch an already-existing OHT, but no extra vehicle can be added.
    const initialCount = await page.locator('.w6-root').getAttribute('data-pressure-vehicle-count');
    await page.waitForTimeout(1100);
    await expect(page.locator('.w6-root')).toHaveAttribute('data-pressure-vehicle-count',initialCount);
    await expect(page.locator('.w6-root')).toHaveAttribute('data-pressure-fleet-changes','0');
    await page.screenshot({path:path.join(evidence,'scene07-'+width+'.png')});
    // Same WebGL world persists through the entire future-facing narrative.
    await page.locator('.three-scene-host canvas').evaluate(el=>el.dataset.storyCanvas='kept');
    await page.getByRole('button',{name:/Scene 08:/}).click();
    await expect(page.getByRole('heading',{name:'하나의 FAB에서 동시에 벌어지는 일들.'})).toBeVisible();
    await expect(page.locator('.w6-root')).toHaveAttribute('data-fab-layout','large');
    await expect(page.locator('.three-scene-host canvas')).toHaveAttribute('data-story-canvas','kept');
    await expect(page.locator('.w6-multi-stage,.w6-intel-exhibit')).toHaveCount(0);
    const scene08Tick=await page.evaluate(()=>window.__FAB_3D__?.tick);
    await expect.poll(async()=>page.evaluate(()=>window.__FAB_3D__?.tick),{timeout:10000}).toBeGreaterThan(scene08Tick);
    await page.screenshot({path:path.join(evidence,'scene08-'+width+'.png')});
    await page.getByRole('button',{name:/Scene 09:/}).click();
    await expect(page.getByRole('heading',{name:'미래의 MCS는 무엇을 먼저 알아볼까?'})).toBeVisible();
    await expect(page.locator('.three-scene-host canvas')).toHaveAttribute('data-story-canvas','kept');
    await expect(page.locator('.w6-root')).toHaveAttribute('data-mcs-lens','traffic');
    await expect(page.locator('.w6-mcs-lens-note')).toContainText('레일 점유·대기 신호');
    await page.getByRole('button',{name:'기본 FAB 보기'}).click();
    await expect(page.locator('.w6-root')).toHaveAttribute('data-mcs-lens','normal');
    await page.getByRole('button',{name:'운행 신호 보기'}).click();
    await expect(page.locator('.w6-root')).toHaveAttribute('data-mcs-lens','traffic');
    await page.screenshot({path:path.join(evidence,'scene09-'+width+'.png')});
    await page.getByRole('button',{name:/Scene 10:/}).click();
    await expect(page.getByRole('heading',{name:'하나의 공장, 여러 가지 선택.'})).toBeVisible();
    await expect(page.locator('.three-scene-host canvas')).toHaveAttribute('data-story-canvas','kept');
    await expect(page.locator('.w6-root')).toHaveAttribute('data-fab-layout','large');
    await expect(page.locator('.w6-root')).toHaveAttribute('data-future-route','both');
    await expect.poll(async()=>page.evaluate(()=>window.__FAB_3D__?.routes?.length??0),{timeout:9000}).toBe(2);
    await page.getByRole('button',{name:'대안 경로'}).click();
    await expect(page.locator('.w6-root')).toHaveAttribute('data-future-route','alternative');
    await expect.poll(async()=>page.evaluate(()=>window.__FAB_3D__?.routes?.length??0),{timeout:9000}).toBe(1);
    await page.getByRole('button',{name:'함께 보기'}).click();
    await expect.poll(async()=>page.evaluate(()=>window.__FAB_3D__?.routes?.length??0),{timeout:9000}).toBe(2);
    const panel=await page.locator('.w6-narrative-v2').evaluate(el=>({
      overflow:getComputedStyle(el).overflowY,inside:getComputedStyle(el.querySelector('.w6-inner-controls')).overflowY,
      top:el.getBoundingClientRect().top,stage:document.querySelector('.w6-stage').getBoundingClientRect().top
    }));
    if(panel.overflow!=='visible'||panel.inside!=='visible'||panel.top<panel.stage-1)
      throw new Error('Scene 10 must fit without nested scroll: '+JSON.stringify(panel));
    await page.screenshot({path:path.join(evidence,'scene10-'+width+'.png')});
    await page.getByRole('button',{name:/Scene 11:/}).click();
    await expect(page.getByRole('heading',{name:'이제 직접 운영해 볼 차례.'})).toBeVisible();
    const explore=page.getByRole('link',{name:/FAB FLOW 시뮬레이터 직접 체험하기/});
    await expect(explore).toBeVisible();
    await expect(explore).toHaveAttribute('href','https://fabflow-yoon.vercel.app/');
    await expect(explore).toHaveAttribute('target','_blank');
    await expect(explore).toHaveAttribute('rel',/noopener noreferrer/);
    await page.screenshot({path:path.join(evidence, 'scene11-'+width+'.png')});
    const renderer=await page.locator('[data-renderer="three-webgl"]').count();
    if(renderer!==1) throw new Error('Native 3D renderer unexpectedly unmounted');
    if(faults.length) throw new Error('Browser JS/console errors: '+faults.join('\n').slice(0,3000));
    console.log(JSON.stringify({viewport:[width,height],nativeTick:nextTick,renderer:'three-webgl',scenes:[3,4,6],errors:0}));
    await page.close();
  }
} finally {
  if(browser) await browser.close();
  server.kill('SIGTERM');
  await fs.rm(sandbox, {recursive:true,force:true});
}
