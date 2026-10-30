'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import type { AnalysisReport } from '@/sim/analysisTypes';
import { railAnalysisVisual } from '@/components/railAnalysisVisual';
import { closedRailCrossPositions, createRailOverlayBatch } from '@/components/railAnalysisBatch';
import type { DecorativeEquipment, Failure, Layout, SimulationState, Vehicle } from '@/sim/types';
import { pathForLink, pointAlongPath, vehiclePosition } from '@/sim/geometry';
import { buildRouteHighlightPaths, createRouteHighlightMaterial, routeHighlightRenderOrders } from '@/components/routeHighlights';
import { confirmedMotion } from '@/sim/motion';
import { fitProjectedFacility, overviewSafeRect, type CameraCommand, type ProjectedBounds, type ScreenRect } from '@/components/fabCamera';
import { releaseFocusedProjection } from '@/components/focusCameraHandoff';
import FacilitySceneFallback from '@/components/FacilityScene';
import type { TutorialStage } from '@/sim/tutorial';

type EssentialLabelKey = 'owner' | 'source' | 'destination' | 'selected-port';

type Props = {
  layout: Layout; state: SimulationState; floor: number; failures: Failure[]; storageCapacity: number;
  tickMs: number; running: boolean; selected?: string; trackedVehicle?: string; trackedRequest?: string;
  analysis?: AnalysisReport; analysisMode?: 'current' | 'recent';
  heatmap: boolean; view?: 'overview' | 'network' | 'traffic'; cameraCommand?: CameraCommand;
  /** Work6 narrative gate: preserve the close-up until its intentional reveal. */
  cameraLocked?: boolean;
  /** Work6-only visual easing for a newly registered real FOUP token. */
  softTokenEntrance?: boolean;
  onFollowChange?: (following: boolean) => void;
  plannedTutorialIngress?: { source: string; destination: string }; tutorialStage?: TutorialStage;
  focusNodes?: string[]; routeCandidates?: { nodes: string[]; links: string[]; distance: number; cost: number; selected: boolean }[];
  onSelect: (kind: 'vehicle' | 'port' | 'rail', id: string) => void; onFloorChange: (floor: number) => void;
};

export type RendererModel = {
  floor: number; rails: Array<{ id: string; points: { x: number; y: number }[]; kind: string; capacity: number }>;
  equipment: NonNullable<Layout['facility']>['equipment']; vehicles: Vehicle[]; parked: Vehicle[];
};

export function makeRendererModel(layout: Layout, state: SimulationState, floor: number): RendererModel {
  const nodes = new Map(layout.nodes.map(node => [node.id, node]));
  return {
    floor,
    rails: layout.links.filter(link => link.kind !== 'lifter' && nodes.get(link.from)?.floor === floor)
      .filter((link, index, all) => !link.resource || all.findIndex(other => other.resource === link.resource) === index)
      .map(link => ({ id: link.id, points: pathForLink(layout, link), kind: link.kind, capacity: link.capacity })),
    equipment: layout.facility?.equipment.filter(item => item.floor === floor) ?? [],
    vehicles: state.vehicles.filter(vehicle => {
      const pose = vehiclePosition(layout, vehicle);
      return !!pose && !vehicle.parked && pose.floor === floor;
    }),
    parked: state.vehicles.filter(vehicle => vehicle.parked && layout.parkingNodes?.includes(vehicle.node) && layout.nodes.find(node => node.id === vehicle.node)?.floor === floor),
  };
}

export function resolveRendererFollowOwner(state: SimulationState, requestId?: string, vehicleId?: string) {
  if (requestId) {
    const request = state.requests.find(item => item.id === requestId && item.phase !== 'completed');
    if (!request?.vehicle) return undefined;
    return state.vehicles.find(vehicle => vehicle.id === request.vehicle && vehicle.request === request.id && !vehicle.parked)?.id;
  }
  return state.vehicles.find(vehicle => vehicle.id === vehicleId && !vehicle.parked)?.id;
}

const palette = { floor: 0xe7e9df, tile: 0xf3f1e8, edge: 0xd3d8cd, rail: 0x506268, railGlow: 0x7e9694, mint: 0x8bbda7, ivory: 0xe7e4d6, shadow: 0x53645c, amber: 0xf0ad3d, blue: 0x7dabb4, dark: 0x536a67 };
const OHT_CABIN_GEOMETRY = new RoundedBoxGeometry(39, 15, 27, 2, 3);
const OHT_CABIN_MATERIAL = new THREE.MeshStandardMaterial({ color: 0x5aaa88, roughness: .52, metalness: .04 });
const OHT_WINDOW_GEOMETRY = new RoundedBoxGeometry(17, 8, 1.6, 2, .5);
const OHT_WINDOW_MATERIAL = new THREE.MeshStandardMaterial({ color: 0x315f63, roughness: .26, metalness: .08 });
const OHT_LAMP_GEOMETRY = new THREE.SphereGeometry(2.2, 8, 6);
const OHT_LAMP_MATERIAL = new THREE.MeshStandardMaterial({ color: 0xffdf97, emissive: 0x9b6b22, emissiveIntensity: .2, roughness: .35 });
const SHARED_OHT_GEOMETRIES = new Set<THREE.BufferGeometry>([OHT_CABIN_GEOMETRY, OHT_WINDOW_GEOMETRY, OHT_LAMP_GEOMETRY]);
const SHARED_OHT_MATERIALS = new Set<THREE.Material>([OHT_CABIN_MATERIAL, OHT_WINDOW_MATERIAL, OHT_LAMP_MATERIAL]);

function setCameraFrustum(camera: THREE.OrthographicCamera, span: number, width: number, height: number, offset: { x: number; y: number }) {
  const size = span, aspect = width / Math.max(1, height), shiftX = offset.x * size / Math.max(1, height), shiftY = offset.y * size / Math.max(1, height);
  camera.left = -size * aspect / 2 - shiftX; camera.right = size * aspect / 2 - shiftX;
  camera.top = size / 2 + shiftY; camera.bottom = -size / 2 + shiftY;
  camera.updateProjectionMatrix();
}

function largestUnobstructedRect(width: number, height: number, obstacles: ScreenRect[]): ScreenRect {
  const blocks = obstacles.map(rect => ({
    left: Math.max(0, rect.left - 8), right: Math.min(width, rect.right + 8),
    top: Math.max(0, rect.top - 8), bottom: Math.min(height, rect.bottom + 8),
  })).filter(rect => rect.right > rect.left && rect.bottom > rect.top);
  const xs = [...new Set([0, width, ...blocks.flatMap(rect => [rect.left, rect.right])])].sort((a, b) => a - b);
  const ys = [...new Set([0, height, ...blocks.flatMap(rect => [rect.top, rect.bottom])])].sort((a, b) => a - b);
  let best: ScreenRect = { left: 0, top: 0, right: 0, bottom: 0 }, bestArea = -1;
  for (let left = 0; left < xs.length - 1; left++) for (let right = left + 1; right < xs.length; right++) {
    for (let top = 0; top < ys.length - 1; top++) for (let bottom = top + 1; bottom < ys.length; bottom++) {
      const rect = { left: xs[left], right: xs[right], top: ys[top], bottom: ys[bottom] };
      if (blocks.some(block => rect.left < block.right && rect.right > block.left && rect.top < block.bottom && rect.bottom > block.top)) continue;
      const area = (rect.right - rect.left) * (rect.bottom - rect.top);
      if (area > bestArea) { best = rect; bestArea = area; }
    }
  }
  return best;
}

function mat(color: number, roughness = .76) { return new THREE.MeshStandardMaterial({ color, roughness, metalness: .03 }); }
export function normalizeGeometryForMerge(geometry: THREE.BufferGeometry) { return geometry.index ? geometry.toNonIndexed() : geometry.clone(); }
export function roundedBoxGeometry(size: [number, number, number], radius: number, segments = 1) {
  return new RoundedBoxGeometry(...size, Math.max(1, Math.floor(segments)), Math.max(0, Math.min(radius, Math.min(...size) / 2)));
}
/** Three front-facing exterior faces for stationary tokens seen from the fixed +X/+Y/+Z camera. */
export function positiveFacesBoxGeometry(size: [number, number, number]) {
  const [x, y, z] = size.map(value => value / 2);
  const positions: number[] = [], normals: number[] = [], indices: number[] = [];
  const face = (normal: [number, number, number], corners: Array<[number, number, number]>) => {
    const base = positions.length / 3;
    for (const corner of corners) { positions.push(...corner); normals.push(...normal); }
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  };
  face([1, 0, 0], [[x, -y, -z], [x, y, -z], [x, y, z], [x, -y, z]]);
  face([0, 1, 0], [[-x, y, -z], [-x, y, z], [x, y, z], [x, y, -z]]);
  face([0, 0, 1], [[-x, -y, z], [x, -y, z], [x, y, z], [-x, y, z]]);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setIndex(indices);
  geometry.computeBoundingBox(); geometry.computeBoundingSphere();
  return geometry;
}
export function chamferedBoxGeometry(size: [number, number, number], radius: number) {
  const half = size.map(value => value / 2), bevel = Math.max(0, Math.min(radius, Math.min(...size) * .2));
  const positions: number[] = [];
  const emit = (polygon: THREE.Vector3[]) => {
    for (let index = 1; index < polygon.length - 1; index++) {
      let a = polygon[0], b = polygon[index], c = polygon[index + 1];
      const normal = b.clone().sub(a).cross(c.clone().sub(a));
      const center = a.clone().add(b).add(c);
      if (normal.dot(center) < 0) [b, c] = [c, b];
      positions.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
    }
  };
  for (let axis = 0; axis < 3; axis++) for (const sign of [-1, 1]) {
    const other = [0, 1, 2].filter(item => item !== axis);
    const vertices = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([first, second]) => {
      const point = [0, 0, 0]; point[axis] = sign * half[axis]; point[other[0]] = first! * (half[other[0]] - bevel); point[other[1]] = second! * (half[other[1]] - bevel);
      return new THREE.Vector3(point[0], point[1], point[2]);
    });
    emit(vertices);
  }
  for (let firstAxis = 0; firstAxis < 3; firstAxis++) for (let secondAxis = firstAxis + 1; secondAxis < 3; secondAxis++) {
    const lengthAxis = 3 - firstAxis - secondAxis;
    for (const firstSign of [-1, 1]) for (const secondSign of [-1, 1]) {
      const edge = (lengthSign: number, side: 0 | 1) => {
        const point = [0, 0, 0];
        point[firstAxis] = firstSign * (side === 0 ? half[firstAxis] - bevel : half[firstAxis]);
        point[secondAxis] = secondSign * (side === 0 ? half[secondAxis] : half[secondAxis] - bevel);
        point[lengthAxis] = lengthSign * (half[lengthAxis] - bevel);
        return new THREE.Vector3(point[0], point[1], point[2]);
      };
      emit([edge(-1, 0), edge(-1, 1), edge(1, 1), edge(1, 0)]);
    }
  }
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) {
    emit([
      new THREE.Vector3(sx * (half[0] - bevel), sy * half[1], sz * (half[2] - bevel)),
      new THREE.Vector3(sx * half[0], sy * (half[1] - bevel), sz * (half[2] - bevel)),
      new THREE.Vector3(sx * (half[0] - bevel), sy * (half[1] - bevel), sz * half[2]),
    ]);
  }
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); geometry.computeVertexNormals(); geometry.computeBoundingBox(); geometry.computeBoundingSphere();
  return geometry;
}
type StaticMaterial = THREE.MeshStandardMaterial | THREE.MeshBasicMaterial;
export function prepareStaticGeometryForMerge(source: THREE.BufferGeometry, material: StaticMaterial, transform?: THREE.Matrix4) {
  const geometry = normalizeGeometryForMerge(source);
  if (transform) geometry.applyMatrix4(transform);
  // These batches use no texture maps. Strip UV and tangent data so every primitive
  // and rail tube can share one schema while preserving their authored normals.
  for (const name of Object.keys(geometry.attributes)) if (name !== 'position' && name !== 'normal') geometry.deleteAttribute(name);
  const position = geometry.getAttribute('position'), color = material.color;
  const colors = new Float32Array(position.count * 3);
  for (let index = 0; index < position.count; index++) colors.set([color.r, color.g, color.b], index * 3);
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  return geometry;
}
export function bakeStaticVertexLighting(geometry: THREE.BufferGeometry, lightDirection = new THREE.Vector3(-.43, .78, .45), ambient = .82, direct = .18) {
  const normal = geometry.getAttribute('normal'), color = geometry.getAttribute('color');
  if (!normal || !color) return geometry;
  const light = lightDirection.clone().normalize();
  for (let index = 0; index < normal.count; index++) {
    const shade = ambient + direct * Math.max(0, normal.getX(index) * light.x + normal.getY(index) * light.y + normal.getZ(index) * light.z);
    color.setXYZ(index, color.getX(index) * shade, color.getY(index) * shade, color.getZ(index) * shade);
  }
  color.needsUpdate = true;
  return geometry;
}
export function linearChannelToSrgb(linear: number) {
  const value = Math.max(0, Math.min(1, linear));
  return value <= .0031308 ? value * 12.92 : 1.055 * Math.pow(value, 1 / 2.4) - .055;
}
export function encodeVertexColorsForUnlitDisplay(geometry: THREE.BufferGeometry) {
  const color = geometry.getAttribute('color');
  if (!color) return geometry;
  for (let index = 0; index < color.count; index++) color.setXYZ(index, linearChannelToSrgb(color.getX(index)), linearChannelToSrgb(color.getY(index)), linearChannelToSrgb(color.getZ(index)));
  color.needsUpdate = true;
  return geometry;
}
export function isSoftwareRendererName(renderer: string) {
  return /swiftshader|llvmpipe|software(?: rasterizer| renderer)?|angle.*\bwarp\b/i.test(renderer);
}
function detectWebGLRenderer() {
  const canvas = document.createElement('canvas');
  const gl = (canvas.getContext('webgl2', { antialias: false }) ?? canvas.getContext('webgl', { antialias: false })) as WebGLRenderingContext | WebGL2RenderingContext | null;
  if (!gl) return { renderer: '', software: false };
  let renderer = '';
  try {
    const info = gl.getExtension('WEBGL_debug_renderer_info') as { UNMASKED_RENDERER_WEBGL: number } | null;
    renderer = String(gl.getParameter(info?.UNMASKED_RENDERER_WEBGL ?? gl.RENDERER) ?? '');
  } catch { renderer = ''; }
  finally { gl.getExtension('WEBGL_lose_context')?.loseContext(); }
  return { renderer, software: isSoftwareRendererName(renderer) };
}
function makeFastVertexColorMaterial() {
  const material = new THREE.MeshBasicMaterial({ color: 0xffffff, vertexColors: true, fog: false, toneMapped: false });
  material.onBeforeCompile = shader => { shader.fragmentShader = shader.fragmentShader.replace('#include <colorspace_fragment>', ''); };
  material.customProgramCacheKey = () => 'fab-preshaded-srgb-basic-v1';
  return material;
}
const LOW_DETAIL_VERTEX_MATERIAL = makeFastVertexColorMaterial();
function box(parent: THREE.Object3D, size: [number, number, number], position: [number, number, number], material: THREE.Material, radius?: number) {
  let ancestor: THREE.Object3D | null = parent, vehiclePart = false;
  while (ancestor) { if (ancestor.userData.kind === 'vehicle' || ancestor.userData.role === 'foup') { vehiclePart = true; break; } ancestor = ancestor.parent; }
  // Broad equipment shells account for most static triangles. Their large scale
  // reads as a clean block from the FAB camera; retain rounded detail on OHTs,
  // FOUPs, and smaller controls where the silhouette is visible.
  const retainRound = !!radius && (vehiclePart || Math.max(...size) <= 50);
  const geometry = retainRound ? roundedBoxGeometry(size, radius!) : radius ? chamferedBoxGeometry(size, radius) : new THREE.BoxGeometry(...size);
  const mesh = new THREE.Mesh(geometry, material); mesh.position.set(...position); mesh.castShadow = true; mesh.receiveShadow = true; mesh.userData.radius = radius;
  parent.add(mesh); return mesh;
}
function cylinder(parent: THREE.Object3D, radiusTop: number, radiusBottom: number, height: number, position: [number, number, number], material: THREE.Material, sides = 8) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, sides), material); mesh.position.set(...position); mesh.castShadow = true; parent.add(mesh); return mesh;
}
function labelSprite(text: string, color = '#334b47') {
  const canvas = document.createElement('canvas'); canvas.width = 320; canvas.height = 72;
  const ctx = canvas.getContext('2d')!; ctx.clearRect(0, 0, 320, 72); ctx.fillStyle = 'rgba(255,255,249,.9)'; ctx.beginPath(); ctx.roundRect(6, 6, 308, 60, 20); ctx.fill();
  ctx.fillStyle = color; ctx.font = '700 25px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 160, 36);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false, depthTest: false }));
  // THREE.Sprite defaults to a module-level quad geometry. Give every label
  // its own geometry so disposing a scene also unregisters its GPU buffers
  // from that scene's renderer without touching Three's shared template.
  sprite.geometry = sprite.geometry.clone();
  sprite.scale.set(82, 18, 1); sprite.renderOrder = 12; return sprite;
}

function mergeVehiclePart(parent: THREE.Group, skip?: THREE.Object3D, outputMaterial?: THREE.Material, fixedUnlit = false) {
  parent.updateMatrixWorld(true); const inverse = parent.matrixWorld.clone().invert(); const source: THREE.BufferGeometry[] = [], sourceMeshes: THREE.Mesh[] = [];
  parent.traverse(object => {
    if (!(object instanceof THREE.Mesh) || object === skip || object.userData.role === 'vehicle-merged' || object.userData.role === 'vehicle-state') return;
    let ancestor: THREE.Object3D | null = object.parent; while (ancestor && ancestor !== parent && ancestor !== skip) ancestor = ancestor.parent;
    if (skip && ancestor === skip) return;
    const material = object.material; if (Array.isArray(material) || !(material instanceof THREE.MeshStandardMaterial)) return;
    const geometry = normalizeGeometryForMerge(object.geometry); geometry.applyMatrix4(inverse.clone().multiply(object.matrixWorld));
    const color = material.color, vertexCount = geometry.attributes.position.count, colors = new Float32Array(vertexCount * 3);
    for (let index = 0; index < vertexCount; index++) { colors[index * 3] = color.r; colors[index * 3 + 1] = color.g; colors[index * 3 + 2] = color.b; }
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3)); source.push(geometry); sourceMeshes.push(object);
  });
  if (!source.length) return;
  let geometry = mergeGeometries(source, false); source.forEach(item => item.dispose()); if (!geometry) return;
  for (const mesh of sourceMeshes) { mesh.parent?.remove(mesh); if (!SHARED_OHT_GEOMETRIES.has(mesh.geometry)) mesh.geometry.dispose(); if (!Array.isArray(mesh.material) && !SHARED_OHT_MATERIALS.has(mesh.material)) mesh.material.dispose(); }
  geometry.computeVertexNormals();
  if (fixedUnlit) encodeVertexColorsForUnlitDisplay(bakeStaticVertexLighting(geometry, new THREE.Vector3(-.43, .78, .45), .88, .12));
  // Preserve faces, normals and colors while sharing repeated triangle vertices.
  const indexed = mergeVertices(geometry, 1e-5); geometry.dispose(); geometry = indexed;
  const merged = new THREE.Mesh(geometry, outputMaterial ?? new THREE.MeshLambertMaterial({ vertexColors: true })); merged.userData.role = 'vehicle-merged'; merged.castShadow = true; parent.add(merged);
}

function makeLowVehiclePrototype() {
  const mesh = new THREE.Mesh(makeFarOhtGeometry(), LOW_DETAIL_VERTEX_MATERIAL);
  mesh.userData.role = 'vehicle-merged'; mesh.castShadow = true;
  return mesh;
}

/** Far-screen silhouette: full chassis and front lamp face, with lamp sides omitted below the 28px detail threshold. */
export function makeFarOhtGeometry() {
  const body = new THREE.BoxGeometry(39, 12, 27); body.translate(0, 1, 0);
  const lamp = new THREE.PlaneGeometry(6, 2); lamp.translate(10, 5, 15);
  const colors = (geometry: THREE.BufferGeometry, hex: number) => {
    const color = new THREE.Color(hex), count = geometry.getAttribute('position').count, values = new Float32Array(count * 3);
    for (let index = 0; index < count; index++) values.set([color.r, color.g, color.b], index * 3);
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(values, 3));
    return geometry;
  };
  const pieces = [colors(body, 0x5aaa88), colors(lamp, 0xffdf97)];
  let geometry = mergeGeometries(pieces, false)!; pieces.forEach(piece => piece.dispose());
  bakeStaticVertexLighting(geometry, new THREE.Vector3(-.43, .78, .45), .88, .12);
  encodeVertexColorsForUnlitDisplay(geometry);
  const indexed = mergeVertices(geometry, 1e-5); geometry.dispose(); geometry = indexed;
  geometry.computeBoundingBox(); geometry.computeBoundingSphere();
  return geometry;
}

/** Update one presented actor branch and its ancestor transforms without walking unrelated world siblings. */
export function updatePresentedVehicleMatrices(root: THREE.Group) {
  root.updateWorldMatrix(true, true);
}

function makeLowFoupPrototype(centerY: number, stored = false, stationary = false) {
  const group = new THREE.Group();
  const geometry = stationary ? positiveFacesBoxGeometry([16, 16, 16]) : new THREE.BoxGeometry(16, 16, 16);
  const token = new THREE.Mesh(geometry, mat(stored ? 0x88b7a3 : palette.amber)); token.position.y = centerY; group.add(token);
  mergeVehiclePart(group, undefined, LOW_DETAIL_VERTEX_MATERIAL, true);
  return group.children.find(child => child.userData.role === 'vehicle-merged') as THREE.Mesh;
}

function addEquipment(group: THREE.Group, item: NonNullable<Layout['facility']>['equipment'][number], portName: string, selected: boolean, stored: number, capacity: number) {
  const w = item.width, d = item.height, y = 0;
  const body = mat(item.variant === 'stocker' ? 0x9ebfae : item.variant === 'lithography' ? 0xc2d7c9 : 0x91bea9);
  const trim = mat(0x789b89), white = mat(0xf3efe0), glass = new THREE.MeshStandardMaterial({ color: 0x5499a0, roughness: .3, metalness: .05 });
  const base = new THREE.Group(); base.position.set(item.x + w / 2, y, item.y + d / 2); base.userData = { kind: 'port', id: item.portId };
  // Individual decks and silhouettes make each process family readable at a glance.
  box(base, [w + 16, 5, d + 14], [0, 2, 0], mat(selected ? 0x9bcbbc : 0xd5ddce), 2);
  const contact = new THREE.Mesh(new THREE.CircleGeometry(Math.max(w, d) * .58, 12), new THREE.MeshBasicMaterial({ color: 0x52675a, transparent: true, opacity: .09, depthWrite: false })); contact.rotation.x = -Math.PI / 2; contact.scale.set(w / Math.max(w, d), d / Math.max(w, d), 1); contact.position.y = 3.1; base.add(contact);
  if (item.variant === 'stocker') {
    box(base, [w * .85, 58, d * .78], [0, 34, 0], body, 4);
    for (let row = 0; row < 5; row++) {
      box(base, [w * .7, 1.6, d * .66], [0, 15 + row * 9, 0], trim);
      for (let col = 1; col < 4; col++) box(base, [1.2, 7.2, d * .62], [-w * .35 + col * w * .175, 19 + row * 9, 0], trim);
    }
    for (const x of [-w * .38, w * .38]) box(base, [3, 64, 3], [x, 34, -d * .36], trim);
    box(base, [w * .86, 6, 8], [0, 67, 0], white);
  } else if (item.variant === 'lithography') {
    box(base, [w * .91, 46, d * .84], [0, 25, 0], body, 4);
    box(base, [w * .45, 38, d * .36], [0, 65, -d * .05], white, 3);
    box(base, [w * .22, 21, d * .26], [-w * .25, 58, d * .19], trim);
    box(base, [w * .12, 36, 3], [w * .12, 50, d * .42], glass);
    cylinder(base, 7, 9, 6, [w * .32, 52, -d * .28], mat(0xc6b777));
  } else if (item.variant === 'etch' || item.variant === 'deposition') {
    const radius = Math.min(w, d) * .17;
    const columns = item.variant === 'etch' ? 2 : 3;
    for (let i = 0; i < columns; i++) {
      const x = (i - (columns - 1) / 2) * radius * 2.15;
      cylinder(base, radius, radius * 1.12, 38 + (i % 2) * 4, [x, 24, -d * .04], i === 1 ? body : white, 8);
      cylinder(base, radius * .9, radius, 4, [x, 45 + (i % 2) * 4, -d * .04], trim, 8);
      box(base, [radius * .42, 17, radius * 1.5], [x + radius * .87, 28, d * .22], glass);
    }
    box(base, [w * .84, 11, d * .18], [0, 7.5, d * .32], trim);
  } else if (item.variant === 'metrology') {
    box(base, [w * .92, 27, d * .8], [0, 16, 0], body, 4);
    box(base, [w * .45, 21, d * .4], [0, 40, -d * .06], white, 3);
    box(base, [w * .13, 25, 5], [0, 52, d * .18], glass);
    cylinder(base, 8, 8, 4, [0, 29, d * .12], mat(0xd2bf86));
  } else if (item.variant === 'wet') {
    box(base, [w * .92, 23, d * .8], [0, 14, 0], body, 4);
    for (let i = 0; i < 4; i++) { const x = -w * .34 + i * w * .22; box(base, [w * .18, 5, d * .55], [x, 27, -d * .02], mat(i % 2 ? 0xb3d5d1 : 0xd2ded7)); box(base, [w * .16, 2, d * .44], [x, 30, -d * .02], glass); }
  } else {
    box(base, [w * .94, 31, d * .86], [0, 18, 0], body, 4);
    for (let i = 0; i < Math.min(4, capacity); i++) {
      const x = (i - 1.5) * w * .18;
      box(base, [2, 15, d * .2], [x, 26, 0], mat(0x789c89));
    }
  }
  // One visible handoff shelf aligns with the graph's true dock node.
  const dockLocalX = item.dock.x - (item.x + w / 2), dockLocalZ = item.dock.y - (item.y + d / 2);
  box(base, [w * .35, 2, 12], [dockLocalX, 9, dockLocalZ], mat(0x8fa69a));
  const pad = new THREE.Mesh(new THREE.CircleGeometry(7, 12), mat(0xf7d88e)); pad.rotation.x = -Math.PI / 2; pad.position.set(dockLocalX, 5.2, dockLocalZ); pad.userData.role = 'dynamic-port-pad'; base.add(pad);
  base.userData.selectionPad = pad;
  const text = labelSprite(selected && item.variant === 'stocker' ? `${portName} · ${stored}/${capacity} FOUP` : portName); text.position.set(0, 84, -d * .28); base.add(text);
  text.visible = selected;
  group.add(base);
  return base;
}

function addCoarseEquipment(group: THREE.Group, item: NonNullable<Layout['facility']>['equipment'][number]) {
  const w = item.width, d = item.height;
  const colors: Record<string, number> = { stocker: 0x9ebfae, lithography: 0xc2d7c9, etch: 0x91bea9, deposition: 0x91bea9, metrology: 0xc2d7c9, wet: 0x9ebfae };
  const heights: Record<string, number> = { stocker: 62, lithography: 64, etch: 48, deposition: 48, metrology: 42, wet: 34 };
  const x = item.x + w / 2, z = item.y + d / 2, height = heights[item.variant] ?? 40, baseColor = colors[item.variant] ?? 0x91bea9;
  const addBlock = (size: [number, number, number], position: [number, number, number], color: number) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), new THREE.MeshStandardMaterial({ color, roughness: .76, metalness: .03 })); mesh.position.set(...position); mesh.castShadow = false; mesh.userData.role = 'coarse-equipment'; group.add(mesh);
  };
  addBlock([w * .86, height, d * .78], [x, height / 2, z], baseColor);
  if (item.variant === 'stocker') {
    for (let row = 1; row <= 3; row++) addBlock([w * .72, 1.4, d * .8], [x, row * height / 4, z], 0x789b89);
  } else if (item.variant === 'lithography' || item.variant === 'metrology') {
    addBlock([w * .42, 18, d * .38], [x, height + 8, z - d * .08], 0xf3efe0);
  } else if (item.variant === 'etch' || item.variant === 'deposition') {
    for (const offset of [-.22, .22]) addBlock([w * .22, height * .72, d * .2], [x + w * offset, height * .78, z - d * .08], 0xf3efe0);
  } else if (item.variant === 'wet') {
    addBlock([w * .7, 5, d * .3], [x, height + 2.5, z], 0x5499a0);
  }
  const pad = new THREE.Mesh(new THREE.CircleGeometry(7, 12), new THREE.MeshBasicMaterial({ color: 0xf7d88e }));
  pad.rotation.x = -Math.PI / 2; pad.position.set(item.dock.x, 5.25, item.dock.y); pad.userData.role = 'low-port-pad-static'; group.add(pad);
}

/** Context machines have no handoff pad, FOUP inventory, status light or selection target. */
function addContextEquipment(group: THREE.Group, item: DecorativeEquipment, coarse = false) {
  const base = new THREE.Group();
  const height = item.variant === 'stocker' ? 58 : item.variant === 'lithography' ? 60 : item.variant === 'wet' ? 28 : 40;
  base.position.set(item.x + item.width / 2, 0, item.y + item.height / 2);
  base.userData.role = 'context-equipment';
  if (coarse) {
    // The fixed above-floor camera cannot see negative box faces. Keep family
    // silhouettes at overview scale without rebuilding close-range chambers.
    const block = (size: [number,number,number], position: [number,number,number], color: number) => {
      const mesh = new THREE.Mesh(positiveFacesBoxGeometry(size), mat(color));
      mesh.position.set(...position);base.add(mesh);
    };
    block([item.width*.9,height+4,item.height*.88],[0,(height+4)/2,0],item.variant==='stocker'?0x9ebfae:0xabc6b5);
    if (item.variant==='etch'||item.variant==='deposition') {
      const count=item.variant==='etch'?2:3;
      for(let i=0;i<count;i++)block([item.width*.2,12,item.height*.36],[(i-(count-1)/2)*item.width*.25,height+8,0],0xf3efe0);
    } else if (item.variant==='stocker') {
      for(const y of [20,44])block([item.width*.92,2,item.height*.9],[0,y,0],0x789b89);
    } else block([item.width*.6,8,item.height*.5],[0,height+8,0],item.variant==='wet'?0x7dafb1:0xf3efe0);
    group.add(base);return;
  }

  box(base, [item.width, 4, item.height], [0, 2, 0], mat(0xd5ddce));
  box(base, [item.width*.9, height, item.height*.88], [0, height/2+4, 0], mat(item.variant==='stocker'?0x9ebfae:0xabc6b5));
  if (item.variant==='etch'||item.variant==='deposition') {
    for(const side of [-1,1]) cylinder(base, Math.min(item.width,item.height)*.18, Math.min(item.width,item.height)*.2, 12, [side*item.width*.23,height+8,0], mat(0xf3efe0),8);
  } else if(item.variant==='stocker') {
    for(const row of [1,2,3]) box(base,[item.width*.92,2,item.height*.9],[0,8+row*12,0],mat(0x789b89));
  } else box(base,[item.width*.6,8,item.height*.5],[0,height+8,0],mat(item.variant==='wet'?0x7dafb1:0xf3efe0));
  group.add(base);
}

type SceneInteractionTarget =
  | { kind: 'port'; id: string; box: THREE.Box3 }
  | { kind: 'rail'; id: string; mesh: THREE.Mesh };

function addRail(scene: THREE.Group, points: { x: number; y: number }[], id: string, material: THREE.Material, targets: SceneInteractionTarget[], radius = 2.5) {
  if (points.length < 2) return;
  const tube = new THREE.Mesh(polylineTubeGeometry(points, 67, radius, 4), material);
  tube.userData = { kind: 'rail', id }; tube.castShadow = true; scene.add(tube);
  // A whole-polyline AABB can sit above an OHT cabin at a bend and steal its click.
  const pickTube = new THREE.Mesh(polylineTubeGeometry(points, 67, 2.5, 4), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, visible: false }));
  pickTube.userData = { kind: 'rail', id }; pickTube.visible = false; scene.add(pickTube); targets.push({ kind: 'rail', id, mesh: pickTube });
  const lower = new THREE.Mesh(polylineTubeGeometry(points, 63, 1.2, 3), mat(palette.railGlow)); scene.add(lower);
  const total = points.reduce((sum, p, i) => i ? sum + Math.hypot(p.x - points[i - 1].x, p.y - points[i - 1].y) : 0, 0);
  for (let distance = 120; distance < total - 60; distance += 220) {
    const f = distance / total, sample = pointAlongPath(points, f);
    const hanger = new THREE.Group(); hanger.position.set(sample.x, 67, sample.y); hanger.rotation.y = -sample.angle * Math.PI / 180; scene.add(hanger);
    box(hanger, [1.2, 39, 1.2], [0, 19, 0], mat(0x8e9b95)); box(hanger, [16, 2.2, 7], [0, 39, 0], mat(0x909c96));
  }
}

export function polylineTubeGeometry(points: { x: number; y: number }[], height: number, radius: number, radialSegments = 6) {
  const centers = points.map(point => new THREE.Vector3(point.x, height, point.y));
  const tangents = centers.map((center, index) => {
    const before = centers[Math.max(0, index - 1)], after = centers[Math.min(centers.length - 1, index + 1)];
    const tangent = after.clone().sub(before);
    return tangent.lengthSq() > 1e-8 ? tangent.normalize() : new THREE.Vector3(1, 0, 0);
  });
  const positions: number[] = [], normals: number[] = [], uvs: number[] = [], indices: number[] = [];
  centers.forEach((center, index) => {
    const tangent = tangents[index];
    const reference = Math.abs(tangent.y) > .9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
    const normal = tangent.clone().cross(reference).normalize();
    const binormal = tangent.clone().cross(normal).normalize();
    const ring: THREE.Vector3[] = [];
    for (let radial = 0; radial < radialSegments; radial++) {
      const angle = radial / radialSegments * Math.PI * 2;
      const offset = normal.clone().multiplyScalar(Math.cos(angle)).addScaledVector(binormal, Math.sin(angle)).normalize();
      ring.push(center.clone().addScaledVector(offset, radius));
      positions.push(ring[radial].x, ring[radial].y, ring[radial].z); normals.push(offset.x, offset.y, offset.z); uvs.push(index / Math.max(1, centers.length - 1), radial / radialSegments);
    }
  });
  for (let segment = 0; segment < centers.length - 1; segment++) for (let radial = 0; radial < radialSegments; radial++) {
    const a = segment * radialSegments + radial, b = segment * radialSegments + (radial + 1) % radialSegments;
    const c = (segment + 1) * radialSegments + radial, d = (segment + 1) * radialSegments + (radial + 1) % radialSegments;
    indices.push(a, c, b, b, c, d);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3)); geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); geometry.setIndex(indices); geometry.computeBoundingSphere();
  return geometry;
}

export const FOUP_CARRIED_CENTER_Y = -33;
export const FOUP_HANDOFF_HEIGHT = 23;
const LOW_OHT = makeLowVehiclePrototype();
const LOW_CARRIED_FOUP = makeLowFoupPrototype(FOUP_CARRIED_CENTER_Y);
const LOW_SOURCE_FOUP_TOKEN = makeLowFoupPrototype(8, false, true);
const LOW_STORED_FOUP_TOKEN = makeLowFoupPrototype(8, true, true);
const SOURCE_FOUP_TOKEN = LOW_SOURCE_FOUP_TOKEN, STORED_FOUP_TOKEN = LOW_STORED_FOUP_TOKEN;
export function foupHandoffOffset(phase: Vehicle['phase'], serviceRemaining: number) {
  const remaining = Math.max(0, Math.min(1, serviceRemaining / 1.5));
  return phase === 'pickup' ? -FOUP_HANDOFF_HEIGHT * remaining : phase === 'dropoff' ? -FOUP_HANDOFF_HEIGHT * (1 - remaining) : 0;
}

export function cameraCommandKeepsFollow(kind: CameraCommand['kind']) {
  return kind === 'follow' || kind === 'welcome';
}

export function rendererShouldFollow(following: boolean, localIntent: boolean, command?: CameraCommand['kind']) {
  return following && (localIntent || command === undefined || cameraCommandKeepsFollow(command));
}

export function rendererPixelRatio(quality: 'high' | 'balanced' | 'low', deviceRatio: number, softwareRenderer = false, fleetSize = 0) {
  const ratio = Number.isFinite(deviceRatio) && deviceRatio > 0 ? deviceRatio : 1;
  if (softwareRenderer) {
    const largeFleet = fleetSize >= 120;
    const cap = largeFleet ? quality === 'low' ? .5 : quality === 'balanced' ? .6 : 1 : quality === 'low' ? .75 : quality === 'balanced' ? .85 : 1;
    return Math.min(ratio, cap);
  }
  return quality === 'high' ? Math.min(ratio, 1.7) : quality === 'balanced' ? Math.min(ratio, 1.2) : 1;
}
export type PortFoupRecord = { portId: string; requestId: string };
export function rendererInventoryDisplayLimit(quality: 'high' | 'balanced' | 'low', softwareLargeFleet: boolean) {
  return !softwareLargeFleet || quality === 'high' ? 8 : quality === 'balanced' ? 6 : 4;
}
export function samplePortFoupInventory(source: readonly PortFoupRecord[], stored: readonly PortFoupRecord[], limit: number, selectedRequestId?: string) {
  const sample = (records: readonly PortFoupRecord[]) => {
    const byPort = new Map<string, PortFoupRecord[]>();
    for (const record of records) { const items = byPort.get(record.portId) ?? []; items.push(record); byPort.set(record.portId, items); }
    const displayed: PortFoupRecord[] = [];
    for (const items of byPort.values()) {
      const selectedIndex = items.findIndex(item => item.requestId === selectedRequestId);
      const ordered = selectedIndex > 0 ? [items[selectedIndex]!, ...items.slice(0, selectedIndex), ...items.slice(selectedIndex + 1)] : items;
      displayed.push(...ordered.slice(0, Math.max(0, Math.floor(limit))));
    }
    return displayed;
  };
  const displayedSource = sample(source), displayedStored = sample(stored);
  return { source: displayedSource, stored: displayedStored, sourceTotal: source.length, storedTotal: stored.length, omittedSource: source.length - displayedSource.length, omittedStored: stored.length - displayedStored.length };
}
export function rendererUsesDetailedGeometry(cameraSpan: number, zoom: number, viewportHeight: number, forced = false) {
  return forced || viewportHeight * Math.max(.1, zoom) / Math.max(1, cameraSpan) * 38 >= 28;
}
function welcomeCameraSpan(viewportWidth: number) {
  return viewportWidth < 650 ? 420 : 620;
}
export function rendererKeepsStaticDetail(cameraSpan: number, zoom: number, viewportHeight: number, wasDetailed: boolean, denseOverview = false) {
  const railDiameterPixels = 5 * viewportHeight * Math.max(.1, zoom) / Math.max(1, cameraSpan);
  // A small physical base margin must not collapse all tool detail at the
  // one-pixel boundary. Retain the existing entry threshold and hysteresis.
  return wasDetailed ? railDiameterPixels >= (denseOverview ? 1.65 : .98) : railDiameterPixels >= (denseOverview ? 2.1 : 1.3);
}
export function rendererVehicleDetail(cameraSpan: number, zoom: number, viewportHeight: number, wasDetailed: boolean, onScreen: boolean, forced = false) {
  if (forced) return true;
  if (!onScreen) return false;
  const bodyPixels = 39 * viewportHeight * Math.max(.1, zoom) / Math.max(1, cameraSpan);
  return wasDetailed ? bodyPixels >= 26 : bodyPixels >= 34;
}
export function railCenterlineSegments(points: Array<{ x: number; y: number }>, railHeight = 67) {
  const positions: number[] = [];
  for (let index = 1; index < points.length; index++) {
    const from = points[index - 1], to = points[index];
    positions.push(from.x, railHeight, from.y, to.x, railHeight, to.y);
  }
  return positions;
}
export function rendererCameraDistance(width: number, height: number, wideFrame: boolean) {
  // Keep all visible floor corners in front of the camera even when a request
  // is centered away from the floor midpoint. Orthographic scale is separate.
  return wideFrame ? Math.max(1200, (Math.max(0, width) + Math.max(0, height)) * .5 + 500) : 1200;
}
export function rendererCameraFar(width: number, height: number, distance: number) {
  return Math.max(6000, distance + (Math.max(0, width) + Math.max(0, height)) * 1.4 + 1000);
}
export function rendererFogRange(distance: number, width: number, height: number) {
  return { near: Math.max(1700, distance * .9), far: Math.max(4200, distance + (Math.max(0, width) + Math.max(0, height)) * .8) };
}
/** Translate along the view axis only: orthographic x/y framing and zoom stay identical. */
export function protectFacilityNearPlane(camera: THREE.OrthographicCamera, physicalBounds: THREE.Box3) {
  if (physicalBounds.isEmpty()) return 0;
  const forward = new THREE.Vector3(); camera.getWorldDirection(forward);
  let nearest = Infinity;
  for (let corner = 0; corner < 8; corner++) {
    const x = corner & 1 ? physicalBounds.max.x : physicalBounds.min.x, y = corner & 2 ? physicalBounds.max.y : physicalBounds.min.y, z = corner & 4 ? physicalBounds.max.z : physicalBounds.min.z;
    nearest = Math.min(nearest, (x - camera.position.x) * forward.x + (y - camera.position.y) * forward.y + (z - camera.position.z) * forward.z);
  }
  const retreat = Math.max(0, camera.near + 16 - nearest);
  if (retreat < 1e-6) return 0;
  camera.position.addScaledVector(forward, -retreat); camera.updateMatrixWorld();
  return retreat;
}

function updateCameraDepth(camera: THREE.OrthographicCamera, scene: THREE.Scene, bounds: { width: number; height: number }, target: { x: number; y: number; z: number }, depthBounds?: THREE.Box3) {
  if (depthBounds) protectFacilityNearPlane(camera, depthBounds);
  const distance = Math.hypot(camera.position.x - target.x, camera.position.y - target.y, camera.position.z - target.z);
  let far = rendererCameraFar(bounds.width, bounds.height, distance);
  if (depthBounds) {
    const forward = new THREE.Vector3(); camera.getWorldDirection(forward);
    for (let corner = 0; corner < 8; corner++) {
      const x = corner & 1 ? depthBounds.max.x : depthBounds.min.x, y = corner & 2 ? depthBounds.max.y : depthBounds.min.y, z = corner & 4 ? depthBounds.max.z : depthBounds.min.z;
      far = Math.max(far, (x - camera.position.x) * forward.x + (y - camera.position.y) * forward.y + (z - camera.position.z) * forward.z + 16);
    }
  }
  if (camera.far !== far) { camera.far = far; camera.updateProjectionMatrix(); }
  if (scene.fog instanceof THREE.Fog) Object.assign(scene.fog, rendererFogRange(distance, bounds.width, bounds.height));
}

function routeFrame(layout: Layout, sourcePortId: string, destinationPortId: string, aspect: number) {
  const nodes = new Map(layout.nodes.map(node => [node.id, node]));
  const source = layout.ports.find(port => port.id === sourcePortId), destination = layout.ports.find(port => port.id === destinationPortId);
  const a = source && nodes.get(source.node), b = destination && nodes.get(destination.node);
  if (!source || !destination || !a || !b) return undefined;
  const points = [{ x: a.x, z: a.y }, { x: b.x, z: b.y }];
  for (const port of [source, destination]) {
    const area = layout.areas.find(item => item.id === (port === source ? a.area : b.area));
    if (area) points.push({ x: area.x, z: area.y }, { x: area.x + area.width, z: area.y + area.height });
    const equipment = layout.facility?.equipment.find(item => item.portId === port.id);
    if (equipment) points.push({ x: equipment.x, z: equipment.y }, { x: equipment.x + equipment.width, z: equipment.y + equipment.height }, { x: equipment.dock.x, z: equipment.dock.y });
  }
  for (const link of layout.links.filter(item => item.kind !== 'lifter' && (item.from === a.id || item.to === a.id || item.from === b.id || item.to === b.id))) {
    const from = nodes.get(link.from), to = nodes.get(link.to);
    if (from?.floor !== a.floor || to?.floor !== a.floor) continue;
    points.push(...pathForLink(layout, link).map(point => ({ x: point.x, z: point.y })));
  }
  return projectedCameraFrame(points, aspect, 1.45, 300);
}

export function projectedCameraFrame(points: Array<{ x: number; z: number }>, aspect: number, padding = 1.2, minimumSpan = 280) {
  if (!points.length) return undefined;
  const projected = points.map(point => ({ x: (point.x - point.z) / Math.SQRT2, y: (point.x + point.z) * .515 }));
  const minX = Math.min(...projected.map(point => point.x)), maxX = Math.max(...projected.map(point => point.x));
  const minY = Math.min(...projected.map(point => point.y)), maxY = Math.max(...projected.map(point => point.y));
  const centerX = (minX + maxX) / 2, centerY = (minY + maxY) / 2, safeAspect = Math.max(.2, aspect);
  const span = Math.max(minimumSpan, maxY - minY, (maxX - minX) / safeAspect) * padding;
  const sum = centerY / .515, difference = centerX * Math.SQRT2;
  return { x: (sum + difference) / 2, z: (sum - difference) / 2, span };
}

export function facilityAreaCameraFrame(layout: Layout, areaId: string | undefined, floor: number, aspect: number, connected = false, extraPoints: Array<{ x: number; z: number }> = []) {
  const points = [...extraPoints], nodes = new Map(layout.nodes.map(node => [node.id, node]));
  const addArea = (id: string | undefined) => {
    const area = id && layout.areas.find(item => item.id === id && item.floor === floor);
    if (area) points.push({ x: area.x, z: area.y }, { x: area.x + area.width, z: area.y }, { x: area.x, z: area.y + area.height }, { x: area.x + area.width, z: area.y + area.height });
  };
  addArea(areaId);
  if (connected && areaId) for (const link of layout.links) {
    if (link.kind === 'lifter') continue;
    const from = nodes.get(link.from), to = nodes.get(link.to);
    if (!from || !to || from.floor !== floor || to.floor !== floor || from.area === to.area) continue;
    if (from.area !== areaId && to.area !== areaId) continue;
    addArea(from.area === areaId ? to.area : from.area);
    points.push(...pathForLink(layout, link).map(point => ({ x: point.x, z: point.y })));
  }
  return projectedCameraFrame(points, aspect, connected ? 1.18 : 1.14, connected ? 340 : 300);
}

export function fitProjectedOverviewSpan(width: number, height: number, aspect: number) {
  const projectedWidth = (width + height) / Math.SQRT2;
  const projectedHeight = (width + height) * .515 + 100;
  return Math.max(projectedHeight, projectedWidth / Math.max(.2, aspect)) * 1.12;
}

export function confirmedRendererMotion(layout: Layout, previous: Vehicle | undefined, current: Vehicle) {
  const semanticBoundary = previous && (previous.phase !== current.phase || previous.loaded !== current.loaded || previous.request !== current.request);
  if (semanticBoundary) {
    const pose = vehiclePosition(layout, current);
    return () => pose!;
  }
  return confirmedMotion(layout, previous, current);
}

function mergeStaticMeshes(root: THREE.Group, exclude: Set<THREE.Object3D>, targets: SceneInteractionTarget[]) {
  root.updateMatrixWorld(true);
  const staticGeometryStats: { sourceTriangles: number; batches: number; categories: Record<string, number> } = { sourceTriangles: 0, batches: 0, categories: {} };
  root.traverse(object => {
    if (object.userData.kind === 'port') targets.push({ box: new THREE.Box3().setFromObject(object), kind: 'port', id: object.userData.id });
  });
  const buckets = new Map<string, { parent: THREE.Object3D; material: StaticMaterial; geometries: THREE.BufferGeometry[]; meshes: THREE.Mesh[] }>();
  root.traverse(object => {
    if (!(object instanceof THREE.Mesh) || exclude.has(object) || !object.visible || object.userData.role === 'dynamic-port-pad') return;
    let parent = object.parent; while (parent && parent !== root && !exclude.has(parent)) parent = parent.parent;
    if (exclude.has(parent ?? object)) return;
    if (Array.isArray(object.material)) return;
    const material = object.material; if (!(material instanceof THREE.MeshStandardMaterial || material instanceof THREE.MeshBasicMaterial) || material.map) return;
    const key = `${material.transparent}|${material.opacity}|${material.wireframe}|${material.side}|${material.depthWrite}|${material.depthTest}`;
    const geometry = encodeVertexColorsForUnlitDisplay(bakeStaticVertexLighting(prepareStaticGeometryForMerge(object.geometry, material, object.matrixWorld))); geometry.computeBoundingBox(); geometry.computeBoundingSphere();
    const triangleCount = geometry.index ? geometry.index.count / 3 : geometry.getAttribute('position').count / 3;
    let categoryParent: THREE.Object3D = object;
    while (categoryParent.parent && categoryParent.parent !== root) categoryParent = categoryParent.parent;
    const category = categoryParent.name || 'other';
    staticGeometryStats.sourceTriangles += triangleCount;
    staticGeometryStats.categories[category] = (staticGeometryStats.categories[category] ?? 0) + triangleCount;
    const center = geometry.boundingBox?.getCenter(new THREE.Vector3()) ?? object.getWorldPosition(new THREE.Vector3());
    const cellSize = category === 'static-rails' || category === 'static-equipment' ? 600 : 1500;
    const cell = `${Math.floor(center.x / cellSize)}:${Math.floor(center.z / cellSize)}`;
    // Keep LOD categories in separate batches so toggling a group's detailed
    // geometry cannot accidentally leave its merged batch visible.
    const bucketKey = `${categoryParent.uuid}|${cell}|${key}`;
    const bucket = buckets.get(bucketKey) ?? { parent: categoryParent, material, geometries: [], meshes: [] }; bucket.geometries.push(geometry); bucket.meshes.push(object); buckets.set(bucketKey, bucket);
  });
  const materialsToDispose = new Set<THREE.Material>();
  for (const { parent, material, geometries, meshes } of buckets.values()) {
    const merged = mergeGeometries(geometries, false);
    geometries.forEach(geometry => geometry.dispose());
    if (!merged) continue;
    for (const source of meshes) {
      source.parent?.remove(source); source.geometry.dispose();
      const sourceMaterials = Array.isArray(source.material) ? source.material : [source.material];
      sourceMaterials.forEach(item => materialsToDispose.add(item));
    }
    const batchMaterial = makeFastVertexColorMaterial(); batchMaterial.transparent = material.transparent; batchMaterial.opacity = material.opacity; batchMaterial.wireframe = material.wireframe; batchMaterial.side = material.side; batchMaterial.depthWrite = material.depthWrite; batchMaterial.depthTest = material.depthTest;
    const mesh = new THREE.Mesh(merged, batchMaterial); mesh.frustumCulled = true; mesh.castShadow = false; mesh.receiveShadow = false; mesh.userData.role = 'merged-fab-static'; parent.add(mesh);
    staticGeometryStats.batches++;
  }
  materialsToDispose.forEach(material => material.dispose());
  return staticGeometryStats;
}

type VehicleMark = { root: THREE.Group; chassis: THREE.Group; physical: THREE.Group; foup: THREE.Group; halo: THREE.Mesh; sprite?: THREE.Sprite; badge: THREE.Mesh; waitBadge: THREE.Mesh; status: THREE.Mesh };

function addVehicle(group: THREE.Group, vehicle: Vehicle, selected: boolean, tracked: boolean): VehicleMark {
  const root = new THREE.Group(); root.userData = { kind: 'vehicle', id: vehicle.id }; group.add(root);
  const physical = new THREE.Group(); physical.userData.role = 'vehicle-physical'; root.add(physical);
  const chassis = new THREE.Group(); chassis.userData.role = 'vehicle-chassis'; physical.add(chassis);
  const shell = mat(0xe9ece3);
  box(chassis, [32, 10, 18], [0, 0, 0], shell, 4); box(chassis, [24, 3.4, 14], [0, -5.5, 0], mat(0x74ad91), 2);
  const status = new THREE.Mesh(VEHICLE_STATE_GEOMETRY, VEHICLE_STATE_MATERIAL); status.position.set(0, -9, 0); status.userData.role = 'vehicle-state'; status.name = 'vehicle-state'; chassis.add(status);
  box(chassis, [9, 5, 1.3], [5, -1, 9.2], mat(0x4e8585), .6);
  for (const x of [-8, 8]) for (const z of [-6, 6]) cylinder(chassis, 1.6, 1.6, 2, [x, 0, z], mat(0x435650), 8).rotation.x = Math.PI / 2;
  // The rail passes over the cart; two real hangers and a hoist support the FOUP below.
  for (const x of [-5, 5]) box(physical, [1.2, 18, 1.2], [x, -12, 0], mat(0x8e9c91));
  box(physical, [16, 2, 13], [0, -22, 0], mat(0xd2d8cb), 1);
  const foup = new THREE.Group(); foup.userData = { role: 'foup' }; physical.add(foup);
  box(foup, [16, 16, 16], [0, FOUP_CARRIED_CENTER_Y, 0], mat(palette.amber), 2); box(foup, [13, 3, 13], [0, FOUP_CARRIED_CENTER_Y + 9.5, 0], mat(0xffd986), 1);
  box(foup, [9, 9, 1], [0, FOUP_CARRIED_CENTER_Y, 8.5], mat(0xf7d99c), .4);
  // Include the shared cabin pieces in the merged, instanced vehicle prototype.
  const cabin = new THREE.Mesh(OHT_CABIN_GEOMETRY, OHT_CABIN_MATERIAL); cabin.position.y = 1; cabin.userData.role = 'oht-cabin'; chassis.add(cabin);
  const windshield = new THREE.Mesh(OHT_WINDOW_GEOMETRY, OHT_WINDOW_MATERIAL); windshield.position.set(4, 1.5, 13.25); windshield.userData.role = 'oht-window'; chassis.add(windshield);
  const frontLamp = new THREE.Mesh(OHT_LAMP_GEOMETRY, OHT_LAMP_MATERIAL); frontLamp.position.set(14, 1, 13); frontLamp.userData.role = 'oht-lamp'; chassis.add(frontLamp);
  mergeVehiclePart(physical, foup); mergeVehiclePart(foup);
  foup.visible = vehicle.loaded || vehicle.phase === 'pickup';
  const halo = new THREE.Mesh(new THREE.TorusGeometry(19, 1, 8, 40), mat(tracked ? 0x147c6d : 0x66a997));
  halo.rotation.x = Math.PI / 2; halo.position.y = -11; halo.userData.role = 'selection'; halo.visible = selected || tracked; root.add(halo);
  const sprite = tracked ? labelSprite(`${vehicle.id}  ·  ${vehicle.loaded ? 'FOUP 적재' : '빈 OHT'}`, '#104f48') : undefined;
  if (sprite) { sprite.position.set(0, 21, 0); sprite.userData.role = 'tracked-label'; root.add(sprite); }
  const badge = new THREE.Mesh(FAILURE_BADGE_GEOMETRY, FAILURE_BADGE_MATERIAL); badge.position.set(0, 15, 0); badge.visible = vehicle.failed; badge.userData.role = 'failure-badge'; root.add(badge);
  const waitBadge = new THREE.Mesh(WAIT_BADGE_GEOMETRY, WAIT_BADGE_MATERIAL); waitBadge.position.set(12, 11, 0); waitBadge.visible = vehicle.waiting > 0 && !vehicle.parked && !vehicle.failed; waitBadge.userData.role = 'waiting-badge'; root.add(waitBadge);
  return { root, chassis, physical, foup, halo, sprite, badge, waitBadge, status };
}

function cloneVehicleMark(prototype: VehicleMark, id: string): VehicleMark {
  const root = prototype.root.clone(true); root.userData = { kind: 'vehicle', id };
  const physical = root.children.find(child => child.userData.role === 'vehicle-physical') as THREE.Group;
  const chassis = physical.children.find(child => child.userData.role === 'vehicle-chassis') as THREE.Group;
  const foup = physical.children.find(child => child.userData.role === 'foup') as THREE.Group;
  const halo = root.children.find(child => child.userData.role === 'selection') as THREE.Mesh;
  halo.material = (prototype.halo.material as THREE.Material).clone();
  const sprite = root.children.find(child => child.userData.role === 'tracked-label') as THREE.Sprite | undefined;
  const badge = root.children.find(child => child.userData.role === 'failure-badge') as THREE.Mesh;
  const waitBadge = root.children.find(child => child.userData.role === 'waiting-badge') as THREE.Mesh;
  const status = chassis.children.find(child => child.userData.role === 'vehicle-state') as THREE.Mesh;
  return { root, chassis, physical, foup, halo, sprite, badge, waitBadge, status };
}

export type NativeOhtActorAssets = {
  bodyGeometry: THREE.BufferGeometry;
  bodyMaterial: THREE.Material;
  foupGeometry: THREE.BufferGeometry;
  foupMaterial: THREE.Material;
};

/** Export the existing merged OHT/FOUP look for a separate instanced native multi-floor renderer. */
export function createNativeOhtActorAssets(): NativeOhtActorAssets {
  const scratch = new THREE.Group();
  const sample: Vehicle = { id: 'native-prototype', node: '', progress: 0, route: [], phase: 'loaded', serviceRemaining: 0, loaded: true, waiting: 0, failed: false, distance: 0, parked: false, parkingPending: false, parkingSlot: 0 };
  const mark = addVehicle(scratch, sample, false, false);
  const body = mark.physical.children.find(child => child.userData.role === 'vehicle-merged') as THREE.Mesh | undefined;
  const foup = mark.foup.children.find(child => child.userData.role === 'vehicle-merged') as THREE.Mesh | undefined;
  if (!body || !foup) throw new Error('Unable to create the shared Native OHT prototype.');
  const assets = {
    bodyGeometry: body.geometry.clone(), bodyMaterial: cloneSceneMaterial(body.material as THREE.Material),
    foupGeometry: foup.geometry.clone(), foupMaterial: cloneSceneMaterial(foup.material as THREE.Material),
  };
  const keptGeometry = new Set([assets.bodyGeometry, assets.foupGeometry]);
  const keptMaterial = new Set([assets.bodyMaterial, assets.foupMaterial]);
  scratch.traverse(object => {
    if (object instanceof THREE.Mesh) {
      if (!SHARED_OHT_GEOMETRIES.has(object.geometry) && !keptGeometry.has(object.geometry)) object.geometry.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach(material => { if (!SHARED_OHT_MATERIALS.has(material) && !keptMaterial.has(material)) material.dispose(); });
    } else if (object instanceof THREE.Sprite) {
      // Sprite.geometry is THREE's shared quad, not scratch-owned geometry.
      object.material.map?.dispose();
      if (!SHARED_OHT_MATERIALS.has(object.material) && !keptMaterial.has(object.material)) object.material.dispose();
    }
  });
  return assets;
}

export function disposeNativeOhtActorAssets(assets: NativeOhtActorAssets) {
  assets.bodyGeometry.dispose(); assets.bodyMaterial.dispose(); assets.foupGeometry.dispose(); assets.foupMaterial.dispose();
}

export type NativePortFoupAssets = { sourceGeometry: THREE.BufferGeometry; sourceMaterial: THREE.Material; storedGeometry: THREE.BufferGeometry; storedMaterial: THREE.Material };

/** Reuse the static-scene source/stocker FOUP token artwork in a live instanced layer. */
export function createNativePortFoupAssets(): NativePortFoupAssets {
  return {
    sourceGeometry: LOW_SOURCE_FOUP_TOKEN.geometry.clone(), sourceMaterial: cloneSceneMaterial(LOW_SOURCE_FOUP_TOKEN.material as THREE.Material),
    storedGeometry: LOW_STORED_FOUP_TOKEN.geometry.clone(), storedMaterial: cloneSceneMaterial(LOW_STORED_FOUP_TOKEN.material as THREE.Material),
  };
}

export function disposeNativePortFoupAssets(assets: NativePortFoupAssets) {
  assets.sourceGeometry.dispose(); assets.sourceMaterial.dispose(); assets.storedGeometry.dispose(); assets.storedMaterial.dispose();
}

const WAIT_BADGE_GEOMETRY = new THREE.OctahedronGeometry(4.2, 0);
const WAIT_BADGE_MATERIAL = new THREE.MeshBasicMaterial({ color: 0xe59b32, toneMapped: false });
const FAILURE_BADGE_GEOMETRY = new THREE.OctahedronGeometry(5, 0);
const FAILURE_BADGE_MATERIAL = new THREE.MeshBasicMaterial({ color: 0xc64d42, toneMapped: false });
const VEHICLE_STATE_GEOMETRY = new THREE.BoxGeometry(15, 3, 12);
export function farVehicleStateGeometry() {
  const geometry = new THREE.TetrahedronGeometry(1, 0); geometry.computeBoundingBox();
  const size = geometry.boundingBox!.getSize(new THREE.Vector3());
  geometry.scale(15 / size.x, 3 / size.y, 12 / size.z);
  geometry.computeVertexNormals(); geometry.computeBoundingBox(); geometry.computeBoundingSphere();
  return geometry;
}
const FAR_VEHICLE_STATE_GEOMETRY = farVehicleStateGeometry();
const VEHICLE_STATE_MATERIAL = new THREE.MeshBasicMaterial({ color: 0xffffff });

export function setRouteLayer(layout: Layout, floor: number, layer: THREE.Group, routeCandidates?: Props['routeCandidates']) {
  const signature = JSON.stringify([floor, routeCandidates?.map(candidate => [candidate.links, candidate.selected]) ?? []]);
  if (layer.userData.routeSignature === signature) return;
  layer.userData.routeSignature = signature;
  for (const child of [...layer.children]) { layer.remove(child); child.traverse(object => { if (object instanceof THREE.Mesh) { object.geometry.dispose(); const material = object.material; (Array.isArray(material) ? material : [material]).forEach(item => item.dispose()); } }); }
  if (!routeCandidates?.length) return;
  // Rail tubes are centered at Y=67 with radius 2.5 (top=69.5). Keep the
  // screen-space overlay just above that surface; depth testing lets OHTs cover it.
  for (const [routeIndex, route] of buildRouteHighlightPaths(layout, floor, routeCandidates, 70.2).entries()) {
    const casing = new LineSegments2(new LineSegmentsGeometry().setPositions(route.positions), createRouteHighlightMaterial(route, true));
    const coreGeometry = new LineSegmentsGeometry().setPositions(route.positions);
    const core = new LineSegments2(coreGeometry, createRouteHighlightMaterial(route));
    if (!route.selected) { casing.computeLineDistances(); core.computeLineDistances(); }
    const renderOrders = routeHighlightRenderOrders(routeIndex);
    casing.renderOrder = renderOrders.casing;
    core.renderOrder = renderOrders.core;
    casing.userData.role = 'route-candidate-casing';
    core.userData = { role: 'route-candidate', selected: route.selected, candidateIndex: route.candidateIndex, links: route.linkIds };
    layer.add(casing, core);
  }
}

export function facilityFitPoints(root: THREE.Object3D, excluded: Set<THREE.Object3D>) {
  root.updateMatrixWorld(true);
  const points: THREE.Vector3[] = [];
  root.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    for (let parent: THREE.Object3D | null = object; parent; parent = parent.parent) if (!parent.visible || excluded.has(parent)) return;
    object.geometry.computeBoundingBox(); const b = object.geometry.boundingBox; if (!b) return;
    for (const x of [b.min.x,b.max.x]) for (const y of [b.min.y,b.max.y]) for (const z of [b.min.z,b.max.z]) points.push(new THREE.Vector3(x,y,z).applyMatrix4(object.matrixWorld));
  });
  return points;
}

function projectedFacilityBounds(points: THREE.Vector3[], camera: THREE.OrthographicCamera): ProjectedBounds {
  camera.updateMatrixWorld();
  const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,0), up = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,1);
  const result = {minX:Infinity,maxX:-Infinity,minY:Infinity,maxY:-Infinity};
  for(const p of points) {const x=p.dot(right),y=p.dot(up);result.minX=Math.min(result.minX,x);result.maxX=Math.max(result.maxX,x);result.minY=Math.min(result.minY,y);result.maxY=Math.max(result.maxY,y);}
  return result;
}

/** Presentation-only base: the cleanroom surface stays at y=0 and at its exact footprint. */
export function addFacilityPlinth(parent: THREE.Group, bounds: { x: number; y: number; width: number; height: number }) {
  const x = bounds.x + bounds.width / 2, z = bounds.y + bounds.height / 2;
  const contact = new THREE.Group(); contact.name = 'plinth-contact'; parent.add(contact);
  // One unlit perimeter strip: no hidden full-floor alpha overdraw, texture,
  // shadow map or per-frame work. Fade vertex alpha away from the plinth.
  const positions: number[] = [], colors: number[] = [], indices: number[] = [];
  for (const [spread, radius, alpha] of [[6, 4, .11], [23, 12, 0]] as const) {
    const hx = bounds.width / 2 + spread, hz = bounds.height / 2 + spread;
    const ring = [[-hx + radius, -hz], [hx - radius, -hz], [hx, -hz + radius], [hx, hz - radius], [hx - radius, hz], [-hx + radius, hz], [-hx, hz - radius], [-hx, -hz + radius]];
    for (const [px, pz] of ring) { positions.push(x + px, -29.2, z + pz); colors.push(0x53 / 255, 0x64 / 255, 0x5c / 255, alpha); }
  }
  for (let i = 0; i < 8; i++) { const next = (i + 1) % 8; indices.push(i, next, i + 8, next, next + 8, i + 8); }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 4)); geometry.setIndex(indices);
  geometry.computeBoundingBox(); geometry.computeBoundingSphere();
  const shade = makeFastVertexColorMaterial(); shade.transparent = true; shade.depthWrite = false; shade.side = THREE.DoubleSide; shade.forceSinglePass = true;
  const silhouette = new THREE.Mesh(geometry, shade); silhouette.userData.role = 'facility-contact-shadow'; contact.add(silhouette);
  box(parent, [bounds.width + 16, 20, bounds.height + 16], [x, -18, z], mat(0xbec6b8), 4);
  box(parent, [bounds.width, 8, bounds.height], [x, -4, z], mat(palette.floor), 2);
  return contact;
}

function buildScene(layout: Layout, state: SimulationState, floor: number, selected: string | undefined, trackedVehicle: string | undefined, storageCapacity: number) {
  const root = new THREE.Group(); const model = makeRendererModel(layout, state, floor);
  const bounds = layout.facility?.floorBounds.find(item => item.floor === floor) ?? { floor, x: 0, y: 0, width: layout.width, height: layout.height };
  const floorGroup = new THREE.Group(); floorGroup.name = 'static-floor'; root.add(floorGroup);
  const plinthContact = addFacilityPlinth(floorGroup, bounds);
  for (const area of layout.areas.filter(area => area.floor === floor)) {
    box(floorGroup, [area.width - 10, 2, area.height - 10], [area.x + area.width / 2, .5, area.y + area.height / 2], mat(0xf3f2e8));
    const rim = new THREE.Mesh(new THREE.BoxGeometry(area.width - 10, 1, area.height - 10), new THREE.MeshStandardMaterial({ color: 0xe3e2d6, wireframe: true })); rim.position.set(area.x + area.width / 2, 1.4, area.y + area.height / 2); floorGroup.add(rim);
    const areaText = `${area.id} · ${area.name.split(' · ')[0].replace('DEPOSITION', 'DEP').replace('METROLOGY', 'MET')}`;
    const sign = labelSprite(areaText); sign.userData.role = 'bay-label'; sign.scale.set(170, 38, 1); sign.position.set(area.x + 76, 17, area.y + 24); root.add(sign);
  }
  for (const aisle of layout.facility?.aisles.filter(item => item.floor === floor) ?? []) {
    box(floorGroup, [aisle.width, .4, aisle.height], [aisle.x + aisle.width / 2, 1.8, aisle.y + aisle.height / 2], mat(0xe9eee7));
  }
  const counts = new Map<string, number>();
  for (const item of state.storedFoups) counts.set(item.portId, (counts.get(item.portId) ?? 0) + 1);
  const ports = new Map(layout.ports.map(port => [port.id, port]));
  const tools = new THREE.Group(); tools.name = 'static-equipment'; root.add(tools);
  const equipmentGroups = new Map<string, THREE.Group>();
  for (const item of model.equipment) equipmentGroups.set(item.portId, addEquipment(tools, item, ports.get(item.portId)?.name ?? item.portId, selected === `port:${item.portId}`, counts.get(item.portId) ?? 0, ports.get(item.portId)?.capacity ?? storageCapacity));
  for (const item of layout.facility?.decorativeEquipment?.filter(e=>e.floor===floor) ?? []) addContextEquipment(tools,item);
  const lowEquipment = new THREE.Group(); lowEquipment.name = 'lod-equipment-low'; root.add(lowEquipment);
  for (const item of model.equipment) addCoarseEquipment(lowEquipment, item);
  for (const item of layout.facility?.decorativeEquipment?.filter(e=>e.floor===floor) ?? []) addContextEquipment(lowEquipment,item,true);
  const tokenLayer = new THREE.Group(); tokenLayer.userData.role = 'token-layer'; root.add(tokenLayer);
  const railMaterial = mat(palette.rail, .38);
  const rails = new THREE.Group(); rails.name = 'static-rails'; root.add(rails);
  const interactionTargets: SceneInteractionTarget[] = [];
  const lowRailPositions: number[] = [], lowRailColors: number[] = [];
  const spineMaterial = mat(0x376f69, .38);
  const portMaterial = mat(0x849791, .55);
  const shortcutMaterial = mat(0x9d8053, .38);
  for (const rail of model.rails) {
    const isSpine = rail.id.includes('spine') || rail.id.includes('central-');
    const isPort = /-port-(approach|depart)-/.test(rail.id);
    const roleColor=isPort?0x849791:isSpine?0x376f69:rail.id.includes('shortcut')?0x9d8053:palette.rail;
    const material = isSpine ? spineMaterial : rail.id.includes('shortcut') ? shortcutMaterial : railMaterial;
    addRail(rails, rail.points, rail.id, isPort ? portMaterial : material, interactionTargets, isPort ? 2 : 2.5);
    if (rail.id.includes('spine-forward') || rail.id.includes('spine-return') || rail.id.includes('central-')) {
      for (const t of [.3, .7]) {
        const p = pointAlongPath(rail.points, t), angle = p.angle * Math.PI / 180;
        const vertices = [[14, 0], [-9, -7], [-9, 7]].flatMap(([x, z]) => [p.x + x * Math.cos(angle) - z * Math.sin(angle), 71, p.y + x * Math.sin(angle) + z * Math.cos(angle)]);
        const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        const arrow = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: 0x21765e, side: THREE.DoubleSide })); rails.add(arrow);
      }
    }
    const segments=railCenterlineSegments(rail.points);lowRailPositions.push(...segments);
    const color = new THREE.Color(roleColor); for (let i = 0; i < segments.length / 3; i++) lowRailColors.push(color.r, color.g, color.b);
  }
  const lowRails = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ vertexColors: true }));
  lowRails.geometry.setAttribute('color', new THREE.Float32BufferAttribute(lowRailColors, 3));
  lowRails.geometry.setAttribute('position', new THREE.Float32BufferAttribute(lowRailPositions, 3)); lowRails.geometry.computeBoundingSphere(); lowRails.name = 'lod-rails-low'; lowRails.visible = false; root.add(lowRails);
  const statusLayer = new THREE.Group(); statusLayer.userData.role = 'rail-status-layer'; root.add(statusLayer);
  const statusMeshes = new Map<string, THREE.Mesh>();
  const statusPoints = new Map(model.rails.map(rail => [rail.id, rail.points]));
  const statusMetadata = new THREE.Group(); statusMetadata.name = 'rail-status-metadata'; statusMetadata.visible = false; root.add(statusMetadata);
  const overlayBatch = createRailOverlayBatch(model.rails.map(rail => ({ id: rail.id, geometry: polylineTubeGeometry(rail.points, 71, 3.15, 5) })));
  const overlayMesh = new THREE.Mesh(overlayBatch.geometry, new THREE.MeshBasicMaterial({ color: 0xffffff, vertexColors: true, transparent: true, depthWrite: false }));
  overlayMesh.name = 'rail-status-batch'; overlayMesh.renderOrder = -20; overlayMesh.frustumCulled = false; overlayMesh.visible = false; statusLayer.add(overlayMesh);
  const selectedRailOverlay = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ color: 0x8a62a1, transparent: true, opacity: .98, depthWrite: false }));
  selectedRailOverlay.name = 'selected-rail-status'; selectedRailOverlay.renderOrder = -10; selectedRailOverlay.frustumCulled = false; selectedRailOverlay.visible = false; statusLayer.add(selectedRailOverlay);
  let selectedRailOverlayId: string | undefined;
  const closureGeometry = new THREE.BufferGeometry(); closureGeometry.setAttribute('position', new THREE.Float32BufferAttribute([], 3));
  const closureMesh = new THREE.LineSegments(closureGeometry, new THREE.LineBasicMaterial({ color: 0x5a3d7a, transparent: true, depthTest: true, depthWrite: false }));
  closureMesh.name = 'rail-closure-batch'; closureMesh.renderOrder = -15; closureMesh.visible = false; statusLayer.add(closureMesh);
  let closedLinkIds: string[] = [];
  const linksByResource = new Map<string, Layout['links']>();
  for (const link of layout.links) if (link.resource) { const list = linksByResource.get(link.resource) ?? []; list.push(link); linksByResource.set(link.resource, list); }
  const statusLinks = new Map(model.rails.map(rail => { const link = layout.links.find(item => item.id === rail.id)!; return [rail.id, link.resource ? linksByResource.get(link.resource)! : [link]] as const; }));
  const nodeMap = new Map(layout.nodes.map(node => [node.id, node]));
  const stagingLabels = new Map<string, THREE.Sprite>();
  for (const id of layout.parkingNodes ?? []) {
    const node = nodeMap.get(id); if (!node || node.floor !== floor) continue;
    box(floorGroup, [30, 4, 30], [node.x, 2, node.y], mat(0xbed7ca), 4);
    const count = state.vehicles.filter(v => v.parked && v.node === id).length;
    const sign = labelSprite(`P · ${count}`); sign.scale.set(90, 20, 1); sign.position.set(node.x, 100, node.y); sign.userData.count = -1; root.add(sign); stagingLabels.set(id, sign);
  }
  const vehicleGroups = new Map<string, VehicleMark>();
  const vehicles = new THREE.Group(); root.add(vehicles);
  let vehiclePrototype: VehicleMark | undefined;
  // Allocate hidden marks for pooled OHTs too: they can depart without rebuilding the scene.
  for (const vehicle of state.vehicles) {
    const pose = vehiclePosition(layout, vehicle);
    if (!pose) continue;
    const mark = vehiclePrototype ? cloneVehicleMark(vehiclePrototype, vehicle.id) : vehiclePrototype = addVehicle(vehicles, vehicle, false, false);
    if (vehiclePrototype !== mark) vehicles.add(mark.root);
    mark.foup.visible = vehicle.loaded || vehicle.phase === 'pickup'; mark.badge.visible = vehicle.failed; mark.waitBadge.visible = vehicle.waiting > 0 && !vehicle.parked && !vehicle.failed;
    mark.root.visible = !vehicle.parked && pose.floor === floor;
    mark.root.position.set(pose.x, 72, pose.y); mark.physical.rotation.y = -pose.angle * Math.PI / 180;
    vehicleGroups.set(vehicle.id, mark);
  }
  const bodySources = [...vehicleGroups.keys()].map(id => {
    const mark = vehicleGroups.get(id)!;
    return { id, mark, body: mark.physical.children.find(child => child.userData.role === 'vehicle-merged') as THREE.Mesh | undefined, foup: mark.foup.children.find(child => child.userData.role === 'vehicle-merged') as THREE.Mesh | undefined };
  }).filter(item => item.body && item.foup);
  const vehicleInstanceIds = bodySources.map(item => item.id);
  let vehicleBodyInstances: THREE.InstancedMesh | undefined, lowVehicleBodyInstances: THREE.InstancedMesh | undefined, foupInstances: THREE.InstancedMesh | undefined, lowFoupInstances: THREE.InstancedMesh | undefined, stateInstances: THREE.InstancedMesh | undefined, farStateInstances: THREE.InstancedMesh | undefined, waitingInstances: THREE.InstancedMesh | undefined, failureInstances: THREE.InstancedMesh | undefined;
  const initialVisibleIds: string[] = [];
  let initialFoups = 0, initialStatus = 0, initialWaiting = 0, initialFailures = 0;
  if (bodySources.length) {
    root.updateMatrixWorld(true);
    const first = bodySources[0], firstBody = first.body!, firstFoup = first.foup!;
    vehicleBodyInstances = new THREE.InstancedMesh(firstBody.geometry, firstBody.material, bodySources.length);
    lowVehicleBodyInstances = new THREE.InstancedMesh(LOW_OHT.geometry, LOW_OHT.material as THREE.Material, bodySources.length);
    foupInstances = new THREE.InstancedMesh(firstFoup.geometry, firstFoup.material, bodySources.length);
    lowFoupInstances = new THREE.InstancedMesh(LOW_CARRIED_FOUP.geometry, LOW_CARRIED_FOUP.material as THREE.Material, bodySources.length);
    const stateGeometry = VEHICLE_STATE_GEOMETRY;
    const stateMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
    stateInstances = new THREE.InstancedMesh(stateGeometry, stateMaterial, bodySources.length);
    farStateInstances = new THREE.InstancedMesh(FAR_VEHICLE_STATE_GEOMETRY, stateMaterial.clone(), bodySources.length);
    waitingInstances = new THREE.InstancedMesh(WAIT_BADGE_GEOMETRY, WAIT_BADGE_MATERIAL, bodySources.length);
    failureInstances = new THREE.InstancedMesh(FAILURE_BADGE_GEOMETRY, FAILURE_BADGE_MATERIAL, bodySources.length);
    for (let index = 0; index < bodySources.length; index++) {
      const { mark, body, foup } = bodySources[index], sourceBody = body!, sourceFoup = foup!;
      const vehicle = state.vehicles.find(item => item.id === bodySources[index].id)!;
      sourceBody.parent?.remove(sourceBody); sourceFoup.parent?.remove(sourceFoup);
      mark.status.parent?.remove(mark.status);
      mark.status.visible = false;
      if (mark.root.visible) {
        vehicleBodyInstances.setMatrixAt(initialVisibleIds.length, mark.physical.matrixWorld); initialVisibleIds.push(bodySources[index].id);
        if (mark.foup.visible) foupInstances.setMatrixAt(initialFoups++, mark.foup.matrixWorld);
        stateInstances.setMatrixAt(initialStatus, mark.physical.matrixWorld.clone().multiply(mark.status.matrix));
        stateInstances.setColorAt(initialStatus++, new THREE.Color(vehicle.failed ? 0xc65d50 : vehicle.loaded ? 0xc68127 : 0x62a79a));
        mark.badge.updateMatrix(); mark.waitBadge.updateMatrix();
        if (mark.badge.visible) failureInstances.setMatrixAt(initialFailures++, mark.root.matrixWorld.clone().multiply(mark.badge.matrix));
        if (mark.waitBadge.visible) waitingInstances.setMatrixAt(initialWaiting++, mark.root.matrixWorld.clone().multiply(mark.waitBadge.matrix));
      }
      mark.badge.parent?.remove(mark.badge); mark.waitBadge.parent?.remove(mark.waitBadge);
    }
    vehicleBodyInstances.count = initialVisibleIds.length; lowVehicleBodyInstances.count = 0; foupInstances.count = initialFoups; lowFoupInstances.count = 0; stateInstances.count = initialStatus; farStateInstances.count = 0; waitingInstances.count = initialWaiting; failureInstances.count = initialFailures;
    vehicleBodyInstances.instanceMatrix.needsUpdate = true; lowVehicleBodyInstances.instanceMatrix.needsUpdate = true; foupInstances.instanceMatrix.needsUpdate = true; lowFoupInstances.instanceMatrix.needsUpdate = true; stateInstances.instanceMatrix.needsUpdate = true; waitingInstances.instanceMatrix.needsUpdate = true; failureInstances.instanceMatrix.needsUpdate = true;
    if (stateInstances.instanceColor) stateInstances.instanceColor.needsUpdate = true;
    for (const mesh of [vehicleBodyInstances, lowVehicleBodyInstances, foupInstances, lowFoupInstances, stateInstances, farStateInstances, waitingInstances, failureInstances]) { mesh.frustumCulled = false; mesh.castShadow = mesh === vehicleBodyInstances || mesh === lowVehicleBodyInstances; vehicles.add(mesh); }
  }
  const routeLayer = new THREE.Group(); routeLayer.userData.role = 'route-layer'; root.add(routeLayer);
  const focusLayer = new THREE.Group(); focusLayer.userData.role = 'focus-layer'; root.add(focusLayer);
  const railMeshes = new Map<string, THREE.Mesh>(); for (const object of rails.children) if (object instanceof THREE.Mesh && object.userData.kind === 'rail') railMeshes.set(object.userData.id, object);
  // Capture each physical primitive before batching. A batch's world AABB would
  // add empty corners and unnecessarily shrink the isometric miniature.
  const fitPoints = facilityFitPoints(root, new Set([vehicles, tokenLayer, routeLayer, focusLayer, statusLayer, statusMetadata, lowEquipment, plinthContact]));
  root.userData.fitPoints = fitPoints;
  // Also protect foreground depth in Follow/manual views. Screen-fit alone
  // cannot detect geometry sliced by the near plane inside the Canvas.
  root.userData.depthBounds = new THREE.Box3().setFromPoints(fitPoints).expandByScalar(32);
  const staticGeometryStats = mergeStaticMeshes(root, new Set([vehicles, tokenLayer, routeLayer, focusLayer, statusLayer, statusMetadata, plinthContact]), interactionTargets);
  {
    // Equipment and guideways never move. Cache their world transforms; actors,
    // FOUPs, status overlays and billboards keep their ordinary update ownership.
    root.updateMatrixWorld(true);
    for (const branch of [floorGroup, tools, lowEquipment, rails, lowRails]) branch.traverse(object => {
      if (object instanceof THREE.Sprite) return;
      object.matrixAutoUpdate = false;
      object.matrixWorldAutoUpdate = false;
    });
  }
  const ownedResources = ownSharedWorldResources(root);
  const ownGeometry = (source: THREE.BufferGeometry) => {
    let owned = ownedResources.geometries.get(source);
    if (!owned) { owned = source.clone(); ownedResources.geometries.set(source, owned); }
    return owned;
  };
  const ownMaterial = (source: THREE.Material) => {
    let owned = ownedResources.materials.get(source);
    if (!owned) { owned = cloneSceneMaterial(source); ownedResources.materials.set(source, owned); }
    trackDfgLutUniform(owned, ownedResources.dfgLutUniforms, ownedResources.trackedDfgMaterials);
    return owned;
  };
  const tokenPrototypes = {
    source: { geometry: ownGeometry(SOURCE_FOUP_TOKEN.geometry), material: ownMaterial(SOURCE_FOUP_TOKEN.material as THREE.Material) },
    stored: { geometry: ownGeometry(STORED_FOUP_TOKEN.geometry), material: ownMaterial(STORED_FOUP_TOKEN.material as THREE.Material) },
  };
  return { root, bounds, staticGeometryStats, stagingLabels, vehicleGroups, vehicleInstanceIds, highVehicleInstanceIds: initialVisibleIds, lowVehicleInstanceIds: [] as string[], vehicleBodyInstances, lowVehicleBodyInstances, foupInstances, lowFoupInstances, stateInstances, farStateInstances, waitingInstances, failureInstances, rails, lowRails, railMeshes, statusLayer, statusMeshes, statusPoints, statusLinks, statusMetadata, overlayBatch, overlayMesh, selectedRailOverlay, selectedRailOverlayId, closureMesh, closedLinkIds, tools, lowEquipment, tokenLayer, tokenOwners: [] as Array<{ requestId: string; owner: 'source' | 'stocker' }>, tokenPrototypes, dfgLutUniforms: ownedResources.dfgLutUniforms, equipmentGroups, routeLayer, focusLayer, interactionTargets, staticLodDetailed: true, denseOverview: true };
}

/** Build the same static Three.js floor used by the live scene for isolated visual previews. */
export function buildFacilityPreviewScene(layout: Layout, floor: number) {
  const state: SimulationState = {
    version: 'preview', time: 0, tick: 0, policy: 'DBR', requests: [], vehicles: [], demandIndex: 0,
    reroutes: 0, routingOperations: 0, vehicleBusySeconds: 0, vehicleWaitingSeconds: 0,
    eventLog: [], storedFoups: [], linkQueues: [],
  };
  const world = buildScene(layout, state, floor, undefined, undefined, 1);
  updateStaticLod(world, 12000, 1, 900);
  return world;
}

/** Move a frozen preview floor while keeping cached matrices, fit points and depth bounds aligned. */
export function translateFacilityPreviewScene(world: ReturnType<typeof buildScene>, y: number) {
  const prior = world.root.position.y, delta = y - prior;
  if (!delta) return;
  world.root.position.y = y;
  const flags = new Map<THREE.Object3D, [boolean, boolean]>();
  world.root.traverse(object => { if (object !== world.root) { flags.set(object, [object.matrixAutoUpdate, object.matrixWorldAutoUpdate]); object.matrixAutoUpdate = true; object.matrixWorldAutoUpdate = true; } });
  world.root.updateMatrixWorld(true);
  for (const [object, [matrixAutoUpdate, matrixWorldAutoUpdate]] of flags) { object.matrixAutoUpdate = matrixAutoUpdate; object.matrixWorldAutoUpdate = matrixWorldAutoUpdate; }
  const points = world.root.userData.fitPoints as THREE.Vector3[] | undefined;
  points?.forEach(point => { point.y += delta; });
  const depthBounds = world.root.userData.depthBounds as THREE.Box3 | undefined;
  if (depthBounds) depthBounds.translate(new THREE.Vector3(0, delta, 0));
}

/** Release all resources owned by a preview scene while preserving shared templates. */
export function disposeFacilityPreviewScene(world: ReturnType<typeof buildScene>) {
  disposeWorld(world);
}

function updateStaticLod(world: ReturnType<typeof buildScene>, cameraSpan: number, zoom: number, viewportHeight: number) {
  const detailed = rendererKeepsStaticDetail(cameraSpan, zoom, viewportHeight, world.staticLodDetailed, world.denseOverview);
  world.staticLodDetailed = detailed;
  world.rails.visible = detailed; world.lowRails.visible = !detailed;
  world.tools.visible = detailed; world.lowEquipment.visible = !detailed;
  for (const label of world.root.children.filter(child => child.userData.role === 'bridge-label')) label.visible = detailed;
}

/** Select the same static detail level used by the interactive scene. */
export function setFacilityPreviewLod(world: ReturnType<typeof buildScene>, cameraSpan: number, zoom: number, viewportHeight: number) {
  updateStaticLod(world, cameraSpan, zoom, viewportHeight);
}

const SHARED_WORLD_GEOMETRIES = new Set<THREE.BufferGeometry>([OHT_CABIN_GEOMETRY, OHT_WINDOW_GEOMETRY, OHT_LAMP_GEOMETRY, WAIT_BADGE_GEOMETRY, FAILURE_BADGE_GEOMETRY, VEHICLE_STATE_GEOMETRY, FAR_VEHICLE_STATE_GEOMETRY, SOURCE_FOUP_TOKEN.geometry, STORED_FOUP_TOKEN.geometry, LOW_OHT.geometry, LOW_CARRIED_FOUP.geometry]);
const SHARED_WORLD_MATERIALS = new Set<THREE.Material>([OHT_CABIN_MATERIAL, OHT_WINDOW_MATERIAL, OHT_LAMP_MATERIAL, WAIT_BADGE_MATERIAL, FAILURE_BADGE_MATERIAL, VEHICLE_STATE_MATERIAL, SOURCE_FOUP_TOKEN.material as THREE.Material, STORED_FOUP_TOKEN.material as THREE.Material, LOW_OHT.material as THREE.Material, LOW_CARRIED_FOUP.material as THREE.Material, LOW_DETAIL_VERTEX_MATERIAL]);

// Three attaches renderer-owned dispose listeners to GPU resources. Clone shared
// templates once per world so disposing that world releases its renderer without
// invalidating resources used by another live scene.
function cloneSceneMaterial(material: THREE.Material) {
  const clone = material.clone();
  clone.onBeforeCompile = material.onBeforeCompile;
  clone.customProgramCacheKey = material.customProgramCacheKey;
  return clone;
}

type DfgLutUniform = { value: unknown };

function trackDfgLutUniform(material: THREE.Material, uniforms: Set<DfgLutUniform>, tracked: WeakSet<THREE.Material>) {
  if (!(material instanceof THREE.MeshStandardMaterial || material instanceof THREE.MeshPhysicalMaterial) || tracked.has(material)) return;
  tracked.add(material);
  const originalCompile = material.onBeforeCompile;
  const originalCacheKeyValue = material.customProgramCacheKey();
  material.onBeforeCompile = function (shader, renderer) {
    originalCompile.call(this, shader, renderer);
    const uniform = shader.uniforms.dfgLUT;
    if (uniform) uniforms.add(uniform as DfgLutUniform);
  };
  material.customProgramCacheKey = () => originalCacheKeyValue;
}

function ownSharedWorldResources(root: THREE.Object3D) {
  const geometries = new Map<THREE.BufferGeometry, THREE.BufferGeometry>();
  const materials = new Map<THREE.Material, THREE.Material>();
  const dfgLutUniforms = new Set<DfgLutUniform>(), trackedDfgMaterials = new WeakSet<THREE.Material>();
  const ownMaterial = (material: THREE.Material) => {
    if (!SHARED_WORLD_MATERIALS.has(material)) {
      trackDfgLutUniform(material, dfgLutUniforms, trackedDfgMaterials);
      return material;
    }
    let owned = materials.get(material);
    if (!owned) {
      owned = cloneSceneMaterial(material);
      materials.set(material, owned);
    }
    trackDfgLutUniform(owned, dfgLutUniforms, trackedDfgMaterials);
    return owned;
  };
  root.traverse(object => {
    if (object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Points) {
      if (SHARED_WORLD_GEOMETRIES.has(object.geometry)) {
        const source = object.geometry;
        let owned = geometries.get(source);
        if (!owned) { const clone = source.clone(); geometries.set(source, clone); owned = clone; }
        object.geometry = owned;
      }
      object.material = Array.isArray(object.material) ? object.material.map(ownMaterial) : ownMaterial(object.material);
    } else if (object instanceof THREE.Sprite) object.material = ownMaterial(object.material) as THREE.SpriteMaterial;
  });
  return { geometries, materials, dfgLutUniforms, trackedDfgMaterials };
}

function disposeWorld(world: ReturnType<typeof buildScene>) {
  const disposedGeometries = new Set<THREE.BufferGeometry>(), disposedMaterials = new Set<THREE.Material>();
  const disposeGeometry = (geometry: THREE.BufferGeometry) => {
    if (!SHARED_WORLD_GEOMETRIES.has(geometry) && !disposedGeometries.has(geometry)) { disposedGeometries.add(geometry); geometry.dispose(); }
  };
  const disposeMaterial = (material: THREE.Material) => {
    if (!SHARED_WORLD_MATERIALS.has(material) && !disposedMaterials.has(material)) { disposedMaterials.add(material); material.dispose(); }
  };
  world.root.traverse(object => {
    if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
      if (object instanceof THREE.InstancedMesh) object.dispose();
      disposeGeometry(object.geometry);
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach(disposeMaterial);
    } else if (object instanceof THREE.Points) {
      disposeGeometry(object.geometry);
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach(disposeMaterial);
    } else if (object instanceof THREE.Sprite) { object.material.map?.dispose(); disposeMaterial(object.material); }
  });
  for (const prototype of Object.values(world.tokenPrototypes)) { disposeGeometry(prototype.geometry); disposeMaterial(prototype.material); }
  const disposedTextures = new Set<THREE.Texture>();
  for (const uniform of world.dfgLutUniforms) if (uniform.value instanceof THREE.Texture && !disposedTextures.has(uniform.value)) {
    disposedTextures.add(uniform.value);
    uniform.value.dispose();
  }
}

function nodeMapFloor(layout: Layout, nodeId: string) { return layout.nodes.find(node => node.id === nodeId)?.floor; }

export function pickSceneTarget(world: { vehicleGroups: Map<string, { root: THREE.Group }>; interactionTargets: SceneInteractionTarget[]; vehicleBodyInstances?: THREE.InstancedMesh; lowVehicleBodyInstances?: THREE.InstancedMesh; vehicleInstanceIds?: string[]; highVehicleInstanceIds?: string[]; lowVehicleInstanceIds?: string[] }, raycaster: THREE.Raycaster): { kind: 'vehicle' | 'port' | 'rail'; id: string } | undefined {
  let nearestInstance: { id: string; distance: number } | undefined;
  for (const mesh of [world.vehicleBodyInstances, world.lowVehicleBodyInstances]) if (mesh) {
    const hit = raycaster.intersectObject(mesh, false)[0];
    const ids = mesh === world.lowVehicleBodyInstances ? world.lowVehicleInstanceIds ?? world.vehicleInstanceIds : world.highVehicleInstanceIds ?? world.vehicleInstanceIds;
    const id = hit?.instanceId === undefined ? undefined : ids?.[hit.instanceId];
    if (id && hit && (!nearestInstance || hit.distance < nearestInstance.distance)) nearestInstance = { id, distance: hit.distance };
  }
  if (nearestInstance) return { kind: 'vehicle', id: nearestInstance.id };
  const vehicleRoots = [...world.vehicleGroups.values()].filter(mark => mark.root.visible).map(mark => mark.root);
  const vehicleHit = raycaster.intersectObjects(vehicleRoots, true).find(hit => { let parent: THREE.Object3D | null = hit.object; while (parent && !parent.userData.kind) parent = parent.parent; return parent?.userData.kind === 'vehicle'; });
  if (vehicleHit) { let object: THREE.Object3D | null = vehicleHit.object; while (object && !object.userData.kind) object = object.parent; if (object?.userData.kind === 'vehicle') return { kind: 'vehicle', id: object.userData.id as string }; }
  let best: { kind: 'vehicle' | 'port' | 'rail'; id: string; distance: number } | undefined;
  for (const target of world.interactionTargets) {
    const distance = target.kind === 'rail'
      ? raycaster.intersectObject(target.mesh, false)[0]?.distance
      : (() => { const point = raycaster.ray.intersectBox(target.box, new THREE.Vector3()); return point ? raycaster.ray.origin.distanceTo(point) : undefined; })();
    if (distance === undefined) continue;
    if (!best || distance < best.distance) best = { kind: target.kind, id: target.id, distance };
  }
  return best;
}

export default function ThreeFacilityScene(props: Props) {
  const { layout, state, floor, failures, storageCapacity, tickMs, running, selected, trackedVehicle, trackedRequest, analysis, analysisMode, heatmap, view = 'overview', cameraCommand, onFollowChange, onSelect, onFloorChange, routeCandidates, focusNodes, cameraLocked = false, softTokenEntrance = false } = props;
  const hostRef = useRef<HTMLDivElement>(null), rendererRef = useRef<THREE.WebGLRenderer | null>(null), sceneRef = useRef<THREE.Scene | null>(null), cameraRef = useRef<THREE.OrthographicCamera | null>(null), worldRef = useRef<ReturnType<typeof buildScene> | null>(null);
  const diagnosticRef = useRef<unknown>(null);
  const [rendererReady, setRendererReady] = useState(false), [worldRevision, setWorldRevision] = useState(0), [lodRevision, setLodRevision] = useState(0), [error, setError] = useState(''), [quality, setQuality] = useState<'high' | 'balanced' | 'low'>('high'), [graphicsInfo, setGraphicsInfo] = useState({ software: false, renderer: '' });
  const softwareLargeFleet = graphicsInfo.software && state.vehicles.length >= 120;
  const effectivePixelRatio = rendererPixelRatio(quality, typeof devicePixelRatio === 'number' ? devicePixelRatio : 1, graphicsInfo.software, state.vehicles.length);
  const [zoom, setZoom] = useState(1), [follow, setFollow] = useState(false), [label, setLabel] = useState('');
  const [reducedMotion, setReducedMotion] = useState(false);
  const qualityRef = useRef(quality), cameraCommandRef = useRef(cameraCommand);
  qualityRef.current = quality; cameraCommandRef.current = cameraCommand;
  const softwareGraphicsRef = useRef(false), softwareDetectionCompleteRef = useRef(false);
  const localFollowIntentRef = useRef(false), appliedCommandSequenceRef = useRef<number | undefined>(undefined);
  const cameraPresentationRef = useRef<() => void>(() => undefined), cameraPresentationDirtyRef = useRef(false);
  const continuousRenderRef = useRef(false), drawRef = useRef<() => void>(() => undefined);
  const cameraRestoreRef = useRef<{ position: [number, number, number]; target: { x: number; y: number; z: number }; span: number; overview: boolean; sequence?: number } | null>(null);
  const fleetRebuildCommandRef = useRef<{ sequence?: number } | null>(null);
  const appliedCameraWorldRef = useRef<{ world: NonNullable<typeof worldRef.current>; sequence: number } | null>(null);
  continuousRenderRef.current = running;
  useLayoutEffect(() => {
    if (softwareDetectionCompleteRef.current) return;
    const detected = detectWebGLRenderer();
    softwareDetectionCompleteRef.current = true;
    softwareGraphicsRef.current = detected.software;
    setGraphicsInfo(detected);
    if (detected.software) setQuality('low');
  }, []);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(query.matches);
    update(); query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  const prior = useRef<{ layout: Layout; state: SimulationState } | null>(null), animationRef = useRef<number | null>(null), dragRef = useRef<{ x: number; y: number; center: THREE.Vector3; target: { x: number; y: number; z: number } } | null>(null), raycaster = useMemo(() => new THREE.Raycaster(), []), pointer = useMemo(() => new THREE.Vector2(), []);
  const pinchGestureRef = useRef(false);
  const pointerPoints = useRef(new Map<number, { x: number; y: number }>()), pinchRef = useRef<{ distance: number; zoom: number; moved: boolean } | null>(null);
  const tokenEntranceRafRef = useRef<number | null>(null);
  const seenTokenKeysRef = useRef(new Set<string>());
  const stageRef = useRef<HTMLDivElement>(null), essentialLabelElements = useRef<Partial<Record<EssentialLabelKey, HTMLDivElement | null>>>({});
  const syncEssentialLabelBoundsRef = useRef<() => void>(() => undefined);
  const selectedRequest = trackedRequest ? state.requests.find(req => req.id === trackedRequest && req.phase !== 'completed') : undefined;
  const reciprocalOwner = selectedRequest?.vehicle ? state.vehicles.find(v => v.id === selectedRequest.vehicle && v.request === selectedRequest.id && !v.parked) : undefined;
  const activeWelcomeOwner = state.requests.find(request => request.phase !== 'completed' && request.vehicle && state.vehicles.some(vehicle => vehicle.id === request.vehicle && vehicle.request === request.id && !vehicle.parked));
  const welcomeAutoOwner = !trackedRequest && !trackedVehicle && cameraCommand?.kind === 'welcome' ? activeWelcomeOwner?.vehicle : undefined;
  const ownerId = resolveRendererFollowOwner(state, trackedRequest, trackedRequest ? reciprocalOwner?.id : trackedVehicle) ?? welcomeAutoOwner;
  const focusRequest = trackedRequest ? state.requests.find(item => item.id === trackedRequest && item.phase !== 'completed') : undefined;
  const essentialOwner = ownerId ? state.vehicles.find(vehicle => vehicle.id === ownerId) : undefined;
  const essentialOwnerText = essentialOwner ? `${essentialOwner.id} · ${essentialOwner.loaded ? 'FOUP 적재' : '빈 OHT'}${essentialOwner.waiting > 0 ? ` · 대기 ${essentialOwner.waitReason ?? ''}` : ''}`.trim() : '';
  const endpointNodeKey = focusNodes ? focusNodes.join('\u001f') : `${focusRequest?.source ?? ''}\u001f${focusRequest?.destination ?? ''}\u001f${props.plannedTutorialIngress?.source ?? ''}\u001f${props.plannedTutorialIngress?.destination ?? ''}`;
  const endpointNodeIds = useMemo(() => {
    if (focusNodes) return [...focusNodes];
    const ingress = focusRequest ? [focusRequest.source, focusRequest.destination] : props.plannedTutorialIngress ? [props.plannedTutorialIngress.source, props.plannedTutorialIngress.destination] : [];
    return ingress.map(portId => layout.ports.find(port => port.id === portId)?.node).filter((nodeId): nodeId is string => !!nodeId);
  }, [endpointNodeKey, layout.ports]);
  const essentialEndpoints = useMemo(() => endpointNodeIds.slice(0, 2).map((nodeId, index) => {
    const node = layout.nodes.find(item => item.id === nodeId), port = layout.ports.find(item => item.node === nodeId);
    return node?.floor === floor ? { key: index === 0 ? 'source' as const : 'destination' as const, nodeId, text: `${index === 0 ? '출발지' : '목적지'} · ${port?.name ?? nodeId}` } : undefined;
  }).filter((item): item is NonNullable<typeof item> => !!item), [endpointNodeIds, layout.nodes, layout.ports, floor]);
  const essentialSelectedPort = useMemo(() => {
    const port = selected?.startsWith('port:') ? layout.ports.find(item => item.id === selected.slice(5)) : undefined;
    const node = port && layout.nodes.find(item => item.id === port.node);
    return port && node?.floor === floor && !endpointNodeIds.includes(port.node) ? { nodeId: port.node, text: `선택 · ${port.name}` } : undefined;
  }, [selected, layout.ports, layout.nodes, floor, endpointNodeIds]);
  const inventoryDisplayLimit = rendererInventoryDisplayLimit(quality, softwareLargeFleet);
  const inventoryFloorPorts = useMemo(() => new Set((layout.facility?.equipment ?? []).filter(item => item.floor === floor).map(item => item.portId)), [layout, floor]);
  const sourceInventory = useMemo(() => state.requests.filter(request => (request.phase === 'pending' || request.phase === 'assigned') && inventoryFloorPorts.has(request.source)).map(request => ({ portId: request.source, requestId: request.id })), [state.requests, inventoryFloorPorts]);
  const storedInventory = useMemo(() => state.storedFoups.filter(token => inventoryFloorPorts.has(token.portId)).map(token => ({ portId: token.portId, requestId: token.requestId })), [state.storedFoups, inventoryFloorPorts]);
  const sampledInventory = useMemo(() => samplePortFoupInventory(sourceInventory, storedInventory, inventoryDisplayLimit, trackedRequest), [sourceInventory, storedInventory, inventoryDisplayLimit, trackedRequest]);
  const selectedInventoryPort = selected?.startsWith('port:') ? selected.slice(5) : undefined;
  const selectedInventoryCounts = selectedInventoryPort && inventoryFloorPorts.has(selectedInventoryPort) ? {
    sourceTotal: sourceInventory.filter(item => item.portId === selectedInventoryPort).length,
    sourceDrawn: sampledInventory.source.filter(item => item.portId === selectedInventoryPort).length,
    storedTotal: storedInventory.filter(item => item.portId === selectedInventoryPort).length,
    storedDrawn: sampledInventory.stored.filter(item => item.portId === selectedInventoryPort).length,
  } : undefined;
  const fleetKey = state.vehicles.map(vehicle => vehicle.id).join('|');
  const worldScopeRef = useRef<{ layout: Layout; floor: number; fleetKey: string } | null>(null);
  const tokenSignature = useMemo(() => JSON.stringify({ sources: sampledInventory.source, stored: sampledInventory.stored }), [sampledInventory]);
  const cameraSpanRef = useRef(740), cameraTargetRef = useRef({ x: 0, y: 34, z: 0 }), overviewRef = useRef(false);
  const cameraFrameModeRef = useRef<'overview' | 'follow' | 'rail' | 'manual'>('manual');
  const automaticFollowSpanRef = useRef<{ requested: number; fitted: number } | null>(null);
  const viewportSizeRef = useRef({ width: 1, height: 1 });
  const cameraSafeRectRef = useRef<ScreenRect>({ left: 0, top: 0, right: 1, bottom: 1 });
  const overviewFitRef = useRef<{ span: number; safe: ScreenRect; projected: ProjectedBounds; screen: ScreenRect } | null>(null);
  syncEssentialLabelBoundsRef.current = () => {
    const host = hostRef.current, stage = stageRef.current, overlay = host?.parentElement?.querySelector<HTMLElement>('.three-essential-labels');
    if (!host || !stage || !overlay) return;
    const hostRect = host.getBoundingClientRect(), stageRect = stage.getBoundingClientRect();
    overlay.style.left = `${hostRect.left - stageRect.left}px`; overlay.style.top = `${hostRect.top - stageRect.top}px`;
    overlay.style.width = `${hostRect.width}px`; overlay.style.height = `${hostRect.height}px`;
  };
  const clampZoom = (value: number) => {
    const b = worldRef.current?.bounds;
    const aspect = (hostRef.current?.clientWidth ?? 1) / Math.max(1, hostRef.current?.clientHeight ?? 1);
    const maxSpan = b ? Math.max(overviewFitRef.current?.span ?? 0, fitProjectedOverviewSpan(b.width, b.height, aspect)) * 1.6 : 12000;
    return Math.max(cameraSpanRef.current / maxSpan, Math.min(cameraSpanRef.current / 100, value));
  };
  const fitFollowSubject = () => {
    // Automatic framing leaves room for the complete loaded OHT and its label.
    // Refit from the requested span, not a transient sheet-opening fit.
    // An explicit camera gesture takes ownership of the scale already displayed.
    if (zoom !== 1) { automaticFollowSpanRef.current = null; return; }
    const safe = cameraSafeRectRef.current, height = viewportSizeRef.current.height;
    const previous = automaticFollowSpanRef.current;
    const requested = previous?.fitted === cameraSpanRef.current ? previous.requested : cameraSpanRef.current;
    cameraSpanRef.current = Math.max(requested,
      64 * height / Math.max(48, safe.bottom - safe.top - 16),
      110 * height / Math.max(80, safe.right - safe.left - 16));
    automaticFollowSpanRef.current = { requested, fitted: cameraSpanRef.current };
  };
  const resize = useCallback(() => {
    const host = hostRef.current, renderer = rendererRef.current, camera = cameraRef.current; if (!host || !renderer || !camera) return;
    syncEssentialLabelBoundsRef.current();
    const w = Math.max(1, host.clientWidth), h = Math.max(1, host.clientHeight);
    viewportSizeRef.current = { width: w, height: h };
    renderer.setSize(w, h, false); renderer.setPixelRatio(rendererPixelRatio(quality, devicePixelRatio || 1, softwareGraphicsRef.current, state.vehicles.length));
    const world = worldRef.current;
    const hostRect = host.getBoundingClientRect(), sandbox = host.closest('.sandbox-mode');
    const obstacles: ScreenRect[] = [];
    if (sandbox) for (const element of sandbox.querySelectorAll<HTMLElement>('.sandbox-hud-kpis,.map-toolbar,.three-controls,.sandbox-playback,.experience-toolbar,.selected-tr-summary,.three-scene-key,.current-tr-panel.open,[data-analysis-panel],.side-column,.sandbox-setup-card,.notice')) {
      if (getComputedStyle(element).visibility === 'hidden' || !element.getClientRects().length) continue;
      const r = element.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) obstacles.push({ left: r.left - hostRect.left, top: r.top - hostRect.top, right: r.right - hostRect.left, bottom: r.bottom - hostRect.top });
    }
    // A focused actor needs the largest actual free rectangle; the facility-fit
    // helper intentionally reserves aspect-ratio margins unsuitable for a carrier.
    cameraSafeRectRef.current = largestUnobstructedRect(w, h, obstacles);
    if (world && overviewRef.current) {
      const points = world.root.userData.fitPoints as THREE.Vector3[];
      const projected = projectedFacilityBounds(points, camera);
      const safe = overviewSafeRect(w,h,projected,obstacles), fit = fitProjectedFacility(projected,w,h,safe);
      overviewFitRef.current = {span:fit.span,safe,projected,screen:{left:(projected.minX-fit.x)*h/fit.span+w/2,right:(projected.maxX-fit.x)*h/fit.span+w/2,top:h/2-(projected.maxY-fit.y)*h/fit.span,bottom:h/2-(projected.minY-fit.y)*h/fit.span}};
      camera.updateMatrixWorld();
      const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,0), up = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,1);
      const target = new THREE.Vector3(cameraTargetRef.current.x,cameraTargetRef.current.y,cameraTargetRef.current.z);
      const offset = right.multiplyScalar(fit.x-target.dot(right)).add(up.multiplyScalar(fit.y-target.dot(up)));
      camera.position.add(offset); target.add(offset); cameraTargetRef.current = {x:target.x,y:target.y,z:target.z};
      camera.updateMatrixWorld();
      cameraSpanRef.current = fit.span;
      if(sceneRef.current) updateCameraDepth(camera,sceneRef.current,world.bounds,cameraTargetRef.current,world.root.userData.depthBounds);
    }
    const focusFraming = !overviewRef.current && (cameraFrameModeRef.current === 'follow' || cameraFrameModeRef.current === 'rail');
    if (focusFraming && cameraFrameModeRef.current === 'follow') fitFollowSubject();
    const size = cameraSpanRef.current / zoom;
    const safe = cameraSafeRectRef.current, offset = focusFraming
      ? { x: (safe.left + safe.right) / 2 - w / 2, y: (safe.top + safe.bottom) / 2 - h / 2 }
      : { x: 0, y: 0 };
    setCameraFrustum(camera, size, w, h, offset);
    cameraPresentationDirtyRef.current = true;
    if (worldRef.current) updateStaticLod(worldRef.current, cameraSpanRef.current, zoom, h);
    drawRef.current();
  }, [quality, zoom, follow, state.vehicles.length]);
  const resizeRef = useRef(resize); resizeRef.current = resize;
  useEffect(() => {
    if (error) return;
    const host = hostRef.current; if (!host) return;
    let renderer: THREE.WebGLRenderer | null = null;
    let teardown: (() => void) | null = null;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: quality === 'high' && !softwareGraphicsRef.current, alpha: false, powerPreference: 'high-performance' });
      renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.08; renderer.shadowMap.enabled = false;
      renderer.domElement.dataset.testid = 'fab-three-canvas'; renderer.domElement.setAttribute('aria-label', `${layout.name} isometric cleanroom WebGL scene`); renderer.domElement.setAttribute('role', 'img');
      let raf = 0, alive = true, cleanedUp = false;
      let observer: ResizeObserver | null = null;
      const cleanup = () => {
        if (cleanedUp) return;
        cleanedUp = true; alive = false;
        const activeRenderer = renderer;
        cancelAnimationFrame(raf); drawRef.current = () => undefined; cameraPresentationRef.current = () => undefined; cameraPresentationDirtyRef.current = false;
        observer?.disconnect(); observer = null;
        activeRenderer?.domElement.removeEventListener('webglcontextlost', onContextLost);
        const activeCameraCommandSequence = cameraCommandRef.current?.sequence;
        const oldWorld = worldRef.current;
        const hasPresentedCamera = !!oldWorld && (activeCameraCommandSequence === undefined || appliedCommandSequenceRef.current === activeCameraCommandSequence);
        if (qualityRef.current !== quality && cameraRef.current && hasPresentedCamera) cameraRestoreRef.current = {
          position: [cameraRef.current.position.x, cameraRef.current.position.y, cameraRef.current.position.z],
          target: { ...cameraTargetRef.current }, span: cameraSpanRef.current, overview: overviewRef.current,
          sequence: cameraCommandRef.current?.sequence,
        };
        if (oldWorld) { sceneRef.current?.remove(oldWorld.root); disposeWorld(oldWorld); worldRef.current = null; }
        if (appliedCameraWorldRef.current?.world === oldWorld) appliedCameraWorldRef.current = null;
        worldScopeRef.current = null; fleetRebuildCommandRef.current = null;
        const hostWithDiagnostic = host as HTMLDivElement & { __FAB_3D__?: unknown };
        const windowWithDiagnostic = window as Window & { __FAB_3D__?: unknown };
        const diagnostic = diagnosticRef.current;
        if (diagnostic !== null && hostWithDiagnostic.__FAB_3D__ === diagnostic) delete hostWithDiagnostic.__FAB_3D__;
        if (diagnostic !== null && windowWithDiagnostic.__FAB_3D__ === diagnostic) delete windowWithDiagnostic.__FAB_3D__;
        diagnosticRef.current = null;
        activeRenderer?.dispose();
        rendererRef.current = null; sceneRef.current = null; cameraRef.current = null;
        host.replaceChildren();
        setRendererReady(false);
        renderer = null; teardown = null;
      };
      teardown = cleanup;
      const onContextLost = (event: Event) => { event.preventDefault(); setError('The graphics context was lost'); cleanup(); };
      renderer.domElement.addEventListener('webglcontextlost', onContextLost);
      host.replaceChildren(renderer.domElement); rendererRef.current = renderer;
      const scene = new THREE.Scene(); scene.background = new THREE.Color(0xe8eee8); scene.fog = new THREE.Fog(0xe8eee8, 1700, 4200); sceneRef.current = scene;
      scene.add(new THREE.HemisphereLight(0xfff8e8, 0x6f897f, 2.05));
      const key = new THREE.DirectionalLight(0xfff4dd, 2.25); key.position.set(-600, 1100, 700); key.target.position.set(500, 0, 360); key.castShadow = false; scene.add(key, key.target);
      const camera = new THREE.OrthographicCamera(-500, 500, 500, -500, .1, 6000); camera.up.set(0, 1, 0); cameraRef.current = camera;
      setRendererReady(true); setError('');
      const render = () => { raf = 0; const activeRenderer = renderer; if (!alive || !activeRenderer) return; if (cameraPresentationDirtyRef.current) { cameraPresentationDirtyRef.current = false; cameraPresentationRef.current(); } activeRenderer.render(scene, camera); const presentedWorld = worldRef.current; if (presentedWorld?.overlayMesh.visible) presentedWorld.overlayBatch.markRendered(); const observation = (host as HTMLDivElement & { __FAB_3D__?: { draw: { calls: number; triangles: number; geometries: number; textures: number } } }).__FAB_3D__; if (observation) observation.draw = { calls: activeRenderer.info.render.calls, triangles: activeRenderer.info.render.triangles, geometries: activeRenderer.info.memory.geometries, textures: activeRenderer.info.memory.textures }; if (continuousRenderRef.current) raf = requestAnimationFrame(render); };
      const draw = () => { if (alive && !raf) raf = requestAnimationFrame(render); };
      drawRef.current = draw; draw();
      observer = new ResizeObserver(() => resizeRef.current()); observer.observe(host); resizeRef.current();
      return cleanup;
    } catch (e) {
      if (teardown) teardown(); else renderer?.dispose();
      renderer = null; teardown = null;
      setError(e instanceof Error ? e.message : 'WebGL could not initialize');
    }
  }, [layout.name, quality, error]);
  useEffect(() => { drawRef.current(); }, [running]);
  useEffect(() => { const renderer = rendererRef.current; if (!renderer) return; renderer.setPixelRatio(rendererPixelRatio(quality, devicePixelRatio || 1, softwareGraphicsRef.current, state.vehicles.length)); resizeRef.current(); }, [quality]);
  useEffect(() => { const renderer = rendererRef.current; if (!renderer) return; renderer.setPixelRatio(rendererPixelRatio(quality, devicePixelRatio || 1, softwareGraphicsRef.current, state.vehicles.length)); resizeRef.current(); }, [softwareLargeFleet]);
  useEffect(() => {
    const scene = sceneRef.current; if (!scene || !rendererReady) return;
    const previousScope = worldScopeRef.current;
    fleetRebuildCommandRef.current = null;
    let fleetRestore: typeof cameraRestoreRef.current = null;
    // Changing instance capacity must preserve the user's current view. A newer
    // camera command still wins through its distinct applied sequence below.
    if (worldRef.current && cameraRef.current && previousScope?.layout === layout && previousScope.floor === floor && previousScope.fleetKey !== fleetKey) {
      fleetRestore = {
        position: [cameraRef.current.position.x, cameraRef.current.position.y, cameraRef.current.position.z],
        target: { ...cameraTargetRef.current }, span: cameraSpanRef.current, overview: overviewRef.current,
        sequence: appliedCommandSequenceRef.current,
      };
      fleetRebuildCommandRef.current = { sequence: appliedCommandSequenceRef.current };
    }
    worldScopeRef.current = { layout, floor, fleetKey };
    if (worldRef.current) { scene.remove(worldRef.current.root); disposeWorld(worldRef.current); }
    const world = buildScene(layout, state, floor, selected, ownerId, storageCapacity); worldRef.current = world; scene.add(world.root); setWorldRevision(value => value + 1);
    const { bounds } = world, cx = bounds.x + bounds.width / 2, cz = bounds.y + bounds.height / 2;
    const firstArea = layout.areas.find(a => a.floor === floor) ?? bounds;
    // Open on the source bay and the nearest real shuttle; the whole route remains an explicit camera action.
    const nodes = new Map(layout.nodes.map(node => [node.id, node]));
    const ingress = props.plannedTutorialIngress;
    const source = ingress && layout.ports.find(port => port.id === ingress.source);
    const sourceNode = source && nodes.get(source.node);
    const nearVehicle = state.vehicles.map(vehicle => {
      const pose = vehiclePosition(layout, vehicle);
      if (pose?.floor === floor) return { x: pose.x, z: pose.y, floor: pose.floor };
      return undefined;
    }).filter((pose): pose is { x: number; z: number; floor: number } => !!pose && pose.floor === floor)
      .sort((a, b) => Math.hypot(a.x - (sourceNode?.x ?? 0), a.z - (sourceNode?.y ?? 0)) - Math.hypot(b.x - (sourceNode?.x ?? 0), b.z - (sourceNode?.y ?? 0)))[0];
    const nearDistance = sourceNode && nearVehicle ? Math.hypot(nearVehicle.x - sourceNode.x, nearVehicle.z - sourceNode.y) : Infinity;
    const includeVehicle = nearDistance < 250;
    const targetX = sourceNode ? includeVehicle ? (sourceNode.x + nearVehicle!.x) / 2 : sourceNode.x : firstArea.x + Math.min(firstArea.width * .32, 360);
    const targetZ = sourceNode ? includeVehicle ? (sourceNode.y + nearVehicle!.z) / 2 : sourceNode.y : firstArea.y + firstArea.height * .5;
    const restore = fleetRestore ?? cameraRestoreRef.current;
    const overview = restore?.overview ?? cameraCommand?.kind === 'overview'; const x = restore?.target.x ?? (overview ? cx : targetX), z = restore?.target.z ?? (overview ? cz : targetZ);
    overviewRef.current = overview;
    const aspect = (hostRef.current?.clientWidth ?? 1) / Math.max(1, hostRef.current?.clientHeight ?? 1);
    cameraTargetRef.current = restore ? { ...restore.target } : { x, y: 35, z };
    cameraSpanRef.current = restore?.span ?? (overview ? fitProjectedOverviewSpan(bounds.width, bounds.height, aspect) : includeVehicle ? Math.max(320, nearDistance * 1.7) : 320);
    const cam = cameraRef.current; if (cam) {
      const distance = rendererCameraDistance(bounds.width, bounds.height, overview);
      if (restore) cam.position.set(...restore.position); else cam.position.set(x + distance * .48, distance * .72, z + distance * .48);
      cam.lookAt(cameraTargetRef.current.x, cameraTargetRef.current.y, cameraTargetRef.current.z);
      updateCameraDepth(cam, scene, bounds, cameraTargetRef.current,world.root.userData.depthBounds);
    }
    resizeRef.current();
  }, [layout, floor, fleetKey, rendererReady, quality, props.plannedTutorialIngress]);
  useEffect(() => { const world = worldRef.current; if (world) { setRouteLayer(layout, floor, world.routeLayer, routeCandidates); drawRef.current(); } }, [layout, floor, routeCandidates, worldRevision]);
  useEffect(() => {
    const layer = worldRef.current?.focusLayer; if (!layer) return;
    for (const child of [...layer.children]) { layer.remove(child); child.traverse(object => { if (object instanceof THREE.Mesh) { object.geometry.dispose(); const material = object.material; (Array.isArray(material) ? material : [material]).forEach(item => item.dispose()); } else if (object instanceof THREE.Sprite) { object.material.map?.dispose(); object.material.dispose(); } }); }
    const nodes = new Map(layout.nodes.map(node => [node.id, node]));
    const ingressPorts = focusRequest ? [focusRequest.source, focusRequest.destination] : props.plannedTutorialIngress ? [props.plannedTutorialIngress.source, props.plannedTutorialIngress.destination] : undefined;
    const endpointNodes = ingressPorts?.map(portId => layout.ports.find(port => port.id === portId)?.node).filter((value): value is string => !!value);
    for (const [index, nodeId] of (focusNodes ?? endpointNodes ?? []).entries()) {
      const node = nodes.get(nodeId); if (!node || node.floor !== floor) continue;
      const color = index ? 0xd99a38 : 0x398e7e;
      const ring = new THREE.Mesh(new THREE.RingGeometry(20, 25, 40), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .92, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.set(node.x, 5, node.y); ring.userData.role = index ? 'destination' : 'source'; layer.add(ring);
      if (!softwareLargeFleet) { const label = labelSprite(`${index ? '목적지' : '출발지'} · ${layout.ports.find(port => port.node === nodeId)?.name ?? nodeId}`, index ? '#875b21' : '#28604e'); label.scale.set(92, 20, 1); label.position.set(node.x, 24, node.y); layer.add(label); }
    }
    if (selected?.startsWith('port:')) {
      const port = layout.ports.find(item => item.id === selected.slice(5)), node = port && nodes.get(port.node);
      if (node?.floor === floor) { const ring = new THREE.Mesh(new THREE.RingGeometry(28, 34, 40), new THREE.MeshBasicMaterial({ color: 0x28775f, transparent: true, opacity: .95, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.set(node.x, 6, node.y); ring.userData.role = 'selected-port'; layer.add(ring); }
    }
    drawRef.current();
  }, [layout, floor, focusNodes, focusRequest?.source, focusRequest?.destination, props.plannedTutorialIngress?.source, props.plannedTutorialIngress?.destination, selected, worldRevision, softwareLargeFleet]);
  useEffect(() => {
    const world = worldRef.current, layer = world?.tokenLayer; if (!world || !layer) return;
    if (tokenEntranceRafRef.current !== null) {
      cancelAnimationFrame(tokenEntranceRafRef.current);
      tokenEntranceRafRef.current = null;
    }
    for (const child of [...layer.children]) {
      layer.remove(child);
      if (child instanceof THREE.InstancedMesh) {
        child.dispose();
        const fadeMaterial = child.userData.fadeMaterial;
        if (fadeMaterial instanceof THREE.Material) fadeMaterial.dispose();
      }
    }
    const ports = new Map(layout.ports.map(port => [port.id, port]));
    const equipment = new Map((layout.facility?.equipment ?? []).map(item => [item.portId, item]));
    const usedSlots = new Map<string, number>();
    const servicingNodes = new Set(state.vehicles.filter(v => !v.parked && (v.phase === 'pickup' || v.phase === 'dropoff')).map(v => v.node));
    const nextSlot = (portId: string) => { const first = servicingNodes.has(ports.get(portId)?.node ?? '') ? 1 : 0; const slot = usedSlots.get(portId) ?? first; usedSlots.set(portId, slot + 1); return slot; };
    const sourceEntries: Array<{ requestId: string; x: number; z: number; slot: number }> = [], storedEntries: Array<{ requestId: string; x: number; z: number; slot: number }> = [];
    sampledInventory.source.forEach(token => { const item = equipment.get(token.portId); if (item) sourceEntries.push({ requestId: token.requestId, x: item.dock.x, z: item.dock.y, slot: nextSlot(token.portId) }); });
    sampledInventory.stored.forEach(token => { const item = equipment.get(token.portId); if (item) storedEntries.push({ requestId: token.requestId, x: item.dock.x, z: item.dock.y, slot: nextSlot(token.portId) }); });
    const fadingMaterials: THREE.Material[] = [];
    const addInstances = (entries: typeof sourceEntries, prototype: { geometry: THREE.BufferGeometry; material: THREE.Material }, owner: 'source' | 'stored') => {
      if (!entries.length) return;
      const newEntries = softTokenEntrance && entries.some(entry => !seenTokenKeysRef.current.has(`${owner}:${entry.requestId}`));
      const material = newEntries ? prototype.material.clone() : prototype.material;
      if (newEntries) { material.transparent = true; material.opacity = 0; material.depthWrite = false; fadingMaterials.push(material); }
      const mesh = new THREE.InstancedMesh(prototype.geometry, material, entries.length), matrix = new THREE.Matrix4();
      entries.forEach((entry, index) => {
        matrix.makeTranslation(entry.x + entry.slot % 4 * 18, 8, entry.z + Math.floor(entry.slot / 4) * 18);
        mesh.setMatrixAt(index, matrix);
        seenTokenKeysRef.current.add(`${owner}:${entry.requestId}`);
      });
      mesh.instanceMatrix.needsUpdate = true; mesh.frustumCulled = false;
      mesh.userData.role = 'token-inventory-instances';
      if (newEntries) mesh.userData.fadeMaterial = material;
      layer.add(mesh);
    };
    addInstances(sourceEntries, world.tokenPrototypes.source, 'source');
    addInstances(storedEntries, world.tokenPrototypes.stored, 'stored');
    if (fadingMaterials.length) {
      // Fade only the actual new FOUP artwork. The 3D scene/camera and
      // native request state stay mounted; other equipment never flashes.
      const started = performance.now(), duration = 900;
      const animate = (now: number) => {
        const progress = Math.min(1, (now - started) / duration);
        const eased = 1 - (1 - progress) ** 3;
        for (const material of fadingMaterials) material.opacity = eased;
        drawRef.current();
        if (progress < 1) tokenEntranceRafRef.current = requestAnimationFrame(animate);
        else tokenEntranceRafRef.current = null;
      };
      tokenEntranceRafRef.current = requestAnimationFrame(animate);
    }
    world.tokenOwners = [...sourceEntries.map(item => ({ requestId: item.requestId, owner: 'source' as const })), ...storedEntries.map(item => ({ requestId: item.requestId, owner: 'stocker' as const }))];
    // Port labels and shelves stay stable; exact occupancy remains available on the facility details panel.
    drawRef.current();
  }, [layout, floor, tokenSignature, trackedRequest, state.vehicles.filter(v=>v.phase==='pickup'||v.phase==='dropoff').map(v=>v.node).join('|'), worldRevision, softTokenEntrance]);
  useEffect(() => {
    if (cameraCommand?.kind !== 'welcome' || !activeWelcomeOwner?.vehicle) return;
    localFollowIntentRef.current = false; setFollow(true); onFollowChange?.(true);
  }, [cameraCommand?.kind, activeWelcomeOwner?.vehicle]);
  useEffect(() => {
    if (!follow || !ownerId) return;
    const vehicle = state.vehicles.find(item => item.id === ownerId && !item.parked);
    const pose = vehicle && vehiclePosition(layout, vehicle);
    if (pose && pose.floor !== floor) onFloorChange(pose.floor);
  }, [follow, ownerId, state.tick, floor, layout, onFloorChange]);
  useEffect(() => {
    const fleetRebuild = fleetRebuildCommandRef.current;
    fleetRebuildCommandRef.current = null;
    const cam = cameraRef.current, world = worldRef.current; if (!cam || !world || !cameraCommand) return;
    if (appliedCameraWorldRef.current?.world === world && appliedCameraWorldRef.current.sequence === cameraCommand.sequence) return;
    appliedCameraWorldRef.current = { world, sequence: cameraCommand.sequence };
    if (fleetRebuild && fleetRebuild.sequence === cameraCommand.sequence) return;
    if (localFollowIntentRef.current && appliedCommandSequenceRef.current === cameraCommand.sequence) return;
    appliedCommandSequenceRef.current = cameraCommand.sequence;
    const restored = cameraRestoreRef.current;
    if (restored && restored.sequence === cameraCommand.sequence) { cameraRestoreRef.current = null; return; }
    cameraRestoreRef.current = null;
    const bounds = world.bounds, vehicle = state.vehicles.find(v => v.id === (cameraCommand.vehicleId ?? ownerId) && !v.parked), pose = vehicle ? vehiclePosition(layout, vehicle) : undefined;
    const nodes = new Map(layout.nodes.map(node => [node.id, node]));
    let x = bounds.x + bounds.width / 2, z = bounds.y + bounds.height / 2;
    let span = cameraCommand.kind === 'overview' ? fitProjectedOverviewSpan(bounds.width, bounds.height, (hostRef.current?.clientWidth ?? 1) / Math.max(1, hostRef.current?.clientHeight ?? 1)) : Math.max(bounds.width, bounds.height) * 1.14;
    if (cameraCommand.kind === 'welcome' || cameraCommand.kind === 'opening' || cameraCommand.kind === 'bay' || cameraCommand.kind === 'connected' || cameraCommand.kind === 'request' || cameraCommand.kind === 'follow') {
      const aspect = (hostRef.current?.clientWidth ?? 1) / Math.max(1, hostRef.current?.clientHeight ?? 1);
      const cameraRequest = state.requests.find(item => item.id === (cameraCommand.requestId ?? trackedRequest));
      const targetRequest = cameraRequest?.phase === 'completed' ? undefined : cameraRequest;
      const frame = cameraCommand.kind === 'request' && targetRequest ? routeFrame(layout, targetRequest.source, targetRequest.destination, aspect) : undefined;
      const area = layout.areas.find(a => a.floor === floor) ?? bounds;
      const sourceId = targetRequest?.source ?? props.plannedTutorialIngress?.source;
      const sourcePort = sourceId ? layout.ports.find(port => port.id === sourceId) : undefined;
      const sourceNode = sourcePort && layout.nodes.find(node => node.id === sourcePort.node);
      const sourceNearest = sourceNode ? state.vehicles.map(item => {
        const pose = vehiclePosition(layout, item);
        if (pose?.floor === floor) return { x: pose.x, z: pose.y };
        return undefined;
      }).filter((point): point is { x: number; z: number } => !!point).sort((a, b) => Math.hypot(a.x - sourceNode.x, a.z - sourceNode.y) - Math.hypot(b.x - sourceNode.x, b.z - sourceNode.y))[0] : undefined;
      const includeVehicle = sourceNode && sourceNearest && Math.hypot(sourceNearest.x - sourceNode.x, sourceNearest.z - sourceNode.y) < 250;
      x = frame?.x ?? (includeVehicle ? (sourceNode.x + sourceNearest.x) / 2 : sourceNode?.x) ?? area.x + Math.min(area.width * .32, 360);
      z = frame?.z ?? (includeVehicle ? (sourceNode.y + sourceNearest.z) / 2 : sourceNode?.y) ?? area.y + area.height / 2;
      span = frame?.span ?? 320;
    }
    if (cameraCommand.kind === 'bay' || cameraCommand.kind === 'connected') {
      const cameraRequest = state.requests.find(item => item.id === (cameraCommand.requestId ?? trackedRequest));
      const completed = cameraRequest?.phase === 'completed';
      const requestSource = cameraRequest && layout.ports.find(port => port.id === cameraRequest.source);
      const requestDestination = cameraRequest && layout.ports.find(port => port.id === cameraRequest.destination);
      const sourceNode = requestSource && nodes.get(requestSource.node), destinationNode = requestDestination && nodes.get(requestDestination.node);
      const currentVehicle = state.vehicles.find(item => item.id === (cameraCommand.vehicleId ?? cameraRequest?.vehicle ?? ownerId) && !item.parked);
      const currentNode = currentVehicle && nodes.get(currentVehicle.node);
      const anchorNode = completed ? destinationNode : currentNode ?? sourceNode ?? destinationNode;
      const anchorAreaId = anchorNode?.area;
      const aspect = (hostRef.current?.clientWidth ?? 1) / Math.max(1, hostRef.current?.clientHeight ?? 1);
      const extraPoints = pose?.floor === floor && !completed ? [{ x: pose.x, z: pose.y }] : [];
      const frame = facilityAreaCameraFrame(layout, anchorAreaId, floor, aspect, cameraCommand.kind === 'connected', extraPoints);
      if (frame) { x = frame.x; z = frame.z; span = frame.span; }
    }
    if (cameraCommand.kind === 'rail' && cameraCommand.railId) {
      const link = layout.links.find(item => item.id === cameraCommand.railId);
      if (link) { const points = pathForLink(layout, link), point = pointAlongPath(points, .5); x = point.x; z = point.y; span = Math.max(370, Math.min(950, link.length * 1.7)); }
    }
    const welcomePresentation = cameraCommand.kind === 'welcome' && !!pose;
    if (pose && (cameraCommand.kind === 'follow' || welcomePresentation)) { x = pose.x; z = pose.y; span = welcomePresentation ? welcomeCameraSpan(hostRef.current?.clientWidth ?? 650) : 370; }
    localFollowIntentRef.current = false;
    if (cameraCommand.kind === 'cancel') { automaticFollowSpanRef.current = null; releaseProjection(); overviewRef.current = false; cameraFrameModeRef.current = 'manual'; localFollowIntentRef.current = false; setFollow(false); onFollowChange?.(false); resizeRef.current(); return; }
    if (!cameraCommandKeepsFollow(cameraCommand.kind)) { setFollow(false); onFollowChange?.(false); }
    if (welcomePresentation) { x -= Math.SQRT1_2 * 55; z += Math.SQRT1_2 * 55; }
    overviewRef.current = cameraCommand.kind === 'overview';
    cameraFrameModeRef.current = cameraCommand.kind === 'overview' ? 'overview'
      : cameraCommand.kind === 'rail' ? 'rail'
        : cameraCommand.kind === 'follow' || cameraCommand.kind === 'welcome' ? 'follow' : 'manual';
    if (cameraCommand.kind === 'follow' && !cameraCommand.resetZoom) {
      const automatic = automaticFollowSpanRef.current;
      span = zoom === 1 && automatic?.fitted === cameraSpanRef.current ? automatic.requested : cameraSpanRef.current / zoom;
    }
    automaticFollowSpanRef.current = null; cameraSpanRef.current = span; cameraTargetRef.current = { x, y: pose ? 72 : 35, z }; const distance = rendererCameraDistance(bounds.width, bounds.height, cameraCommand.kind !== 'follow' && cameraCommand.kind !== 'welcome'); cam.position.set(x + distance * .48, distance * .72, z + distance * .48); cam.lookAt(x, pose ? 72 : 35, z); if (sceneRef.current) updateCameraDepth(cam, sceneRef.current, bounds, cameraTargetRef.current,world.root.userData.depthBounds); setZoom(1); resizeRef.current();
    if (cameraCommand.kind === 'follow') { setFollow(true); onFollowChange?.(true); }
  }, [cameraCommand?.sequence, worldRevision]);
  useEffect(() => { resize(); }, [resize]);
  useEffect(() => {
    const shell = hostRef.current?.closest('.sandbox-mode'); if (error || !shell || !rendererReady) return;
    let frame = 0;
    const schedule = () => { if (!frame) frame = requestAnimationFrame(() => { frame = 0; resizeRef.current(); }); };
    const observer = new ResizeObserver(schedule);
    const watch = () => {
      for (const node of shell.querySelectorAll('.sandbox-hud-kpis,.sandbox-playback,.experience-toolbar,.selected-tr-summary,.map-toolbar,.current-tr-panel,[data-analysis-panel],.side-column,.sandbox-setup-card,.notice')) observer.observe(node);
      schedule();
    };
    watch();
    const mutations = new MutationObserver(watch);
    // Only structural/chrome changes; moving labels and published clock text
    // must never cause camera fitting in the playback render loop.
    const card = hostRef.current?.closest('.map-card'); if (card) mutations.observe(card, {childList:true});
    const column = hostRef.current?.closest('.map-column'); if (column) mutations.observe(column, {childList:true,attributes:true,attributeFilter:['class','data-focus-mode']});
    mutations.observe(shell, {childList:true,attributes:true,attributeFilter:['class']});
    for (const node of shell.querySelectorAll('.current-tr-panel,.map-column')) mutations.observe(node, {attributes:true,attributeFilter:['class','data-focus-mode']});
    shell.addEventListener('transitionend',schedule);
    return () => { observer.disconnect(); mutations.disconnect(); cancelAnimationFrame(frame); shell.removeEventListener('transitionend',schedule); };
  }, [rendererReady, worldRevision, error]);
  useEffect(() => {
    if (error) return;
    const world = worldRef.current; if (!world) return;
    const before = prior.current; prior.current = { layout, state };
    const oldVehicles = before?.layout === layout && state.tick === before.state.tick + 1 ? new Map(before.state.vehicles.map(v => [v.id, v])) : new Map<string, Vehicle>();
    const nodes = new Map(layout.nodes.map(node => [node.id, node]));
    for (const [id, sign] of world.stagingLabels) {
      const count = state.vehicles.filter(v => v.parked && v.node === id).length;
      if (sign.userData.count === count) continue;
      const canvas = sign.material.map?.image as HTMLCanvasElement | undefined, ctx = canvas?.getContext('2d');
      if (ctx) { ctx.clearRect(0, 0, 320, 72); ctx.fillStyle = 'rgba(255,255,249,.9)'; ctx.beginPath(); ctx.roundRect(6, 6, 308, 60, 20); ctx.fill(); ctx.fillStyle = '#334b47'; ctx.font = '700 48px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(`P · ${count}`, 160, 36); sign.material.map!.needsUpdate = true; sign.userData.count = count; }
    }
    const animations = state.vehicles.flatMap(vehicle => {
      const mark = world.vehicleGroups.get(vehicle.id); if (!mark) return [];
      const pose = vehiclePosition(layout, vehicle);
      mark.root.visible = !vehicle.parked && !!pose && pose.floor === floor;
      if (pose) mark.root.position.set(pose.x, 72, pose.y);
      mark.halo.visible = selected === `vehicle:${vehicle.id}` || ownerId === vehicle.id;
      if (mark.halo.material instanceof THREE.MeshStandardMaterial) mark.halo.material.color.set(ownerId === vehicle.id ? 0x147c6d : 0x66a997);
      if (ownerId === vehicle.id) {
        if (!mark.sprite && !softwareLargeFleet) { mark.sprite = labelSprite('', '#104f48'); mark.sprite.position.set(0, 21, 0); mark.sprite.userData.role = 'tracked-label'; mark.root.add(mark.sprite); }
        if (mark.sprite) mark.sprite.visible = !softwareLargeFleet;
        const labelText = `${vehicle.id} · ${vehicle.loaded ? 'FOUP 적재' : '빈 OHT'}${vehicle.waiting > 0 ? ` · 대기 ${vehicle.waitReason ?? ''}` : ''}`.trim();
        if (mark.sprite && mark.sprite.userData.labelText !== labelText) {
          const label = mark.sprite.material.map?.image as HTMLCanvasElement | undefined, ctx = label?.getContext('2d');
          if (ctx) { ctx.clearRect(0, 0, 320, 72); ctx.fillStyle = 'rgba(255,255,249,.9)'; ctx.beginPath(); ctx.roundRect(6, 6, 308, 60, 20); ctx.fill(); ctx.fillStyle = '#104f48'; ctx.font = '700 25px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(labelText, 160, 36); mark.sprite.material.map!.needsUpdate = true; mark.sprite.userData.labelText = labelText; }
        }
      } else if (mark.sprite) mark.sprite.visible = false;
      mark.badge.visible = vehicle.failed;
      mark.waitBadge.visible = vehicle.waiting > 0 && !vehicle.parked && !vehicle.failed;
      const carried = vehicle.loaded || vehicle.phase === 'pickup'; mark.foup.visible = carried;
      const from = oldVehicles.get(vehicle.id);
      const currentFoupY = foupHandoffOffset(vehicle.phase, vehicle.serviceRemaining);
      const previousFoupY = from ? foupHandoffOffset(from.phase, from.serviceRemaining) : currentFoupY;
      mark.foup.position.y = currentFoupY;
      if (!mark.root.visible) return [];
      const motion = confirmedRendererMotion(layout, from, vehicle);
      return [{ vehicle, ...mark, motion, previousFoupY, currentFoupY }];
    });
    const linkCounts = new Map<string, number>(), vehicleById = new Map(state.vehicles.map(vehicle => [vehicle.id, vehicle]));
    for (const vehicle of state.vehicles) if (vehicle.link) linkCounts.set(vehicle.link, (linkCounts.get(vehicle.link) ?? 0) + 1);
    const queueCounts = new Map((state.linkQueues ?? []).map(queue => [queue.linkId, queue.vehicleIds.length]));
    const analysisRails = new Map(analysis?.rails.map(rail => [rail.linkId, rail]) ?? []);
    let hasActiveOverlay = false;
    let selectedOverlayId: string | undefined;
    const closedRails: Array<{ points: Array<{ x: number; y: number }>; closed: boolean }> = [];
    for (const [linkId, related] of world.statusLinks) {
      const blocked = failures.some(failure => failure.start <= state.time && state.time < failure.start + failure.duration && related.some(link => failure.target === link.id || failure.target === link.resource));
      const traffic = related.reduce((sum, item) => sum + (linkCounts.get(item.id) ?? 0), 0);
      const queued = related.reduce((sum, item) => sum + (queueCounts.get(item.id) ?? 0), 0);
      const selectedRail = related.some(item => selected === `rail:${item.id}`);
      const samples = related.flatMap(item => analysisRails.get(item.id) ?? []);
      const sample = samples[0] && { ...samples[0],
        currentQueue: samples.reduce((sum, item) => sum + item.currentQueue, 0),
        waitingSeconds: samples.reduce((sum, item) => sum + item.waitingSeconds, 0),
        closed: samples.some(item => item.closed),
      };
      const visual = railAnalysisVisual(sample, analysisMode, analysis?.windowObservedSeconds ?? 0);
      const active = selectedRail || blocked || (analysis ? visual.active : (traffic > 0 || queued > 0) && (heatmap || view === 'traffic'));
      let mesh = world.statusMeshes.get(linkId);
      // Metadata meshes preserve per-link diagnostics while the visible geometry is batched.
      if (active && !mesh) {
        mesh = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false }));
        mesh.userData.role = 'rail-status-metadata';
        const closedCue = new THREE.Group(); closedCue.name = 'closure-cross'; mesh.add(closedCue);
        world.statusMetadata.add(mesh); world.statusMeshes.set(linkId, mesh);
      }
      if (mesh) {
        mesh.visible = active;
        const material = mesh.material as THREE.MeshBasicMaterial;
        material.color.set(selectedRail ? 0x8a62a1 : blocked ? 0x84649e : analysis ? visual.color : queued > 0 ? 0xe59b32 : view === 'traffic' ? 0x51a9bd : 0x69b791);
        material.opacity = selectedRail ? .98 : blocked ? .88 : analysis ? .78 : Math.min(.94, .38 + Math.log2(traffic + queued + 1) * .2);
        const cue = mesh.getObjectByName('closure-cross'); if (cue) cue.visible = blocked;
        const opacity = selectedRail ? .98 : blocked ? .88 : analysis ? .78 : Math.min(.94, .38 + Math.log2(traffic + queued + 1) * .2);
        world.overlayBatch.setStyle(linkId, material.color, active && !selectedRail ? opacity : 0);
      }
      hasActiveOverlay ||= active && !selectedRail;
      if (active && selectedRail) selectedOverlayId = linkId;
      if (blocked) closedRails.push({ points: world.statusPoints.get(linkId) ?? [], closed: true });
    }
    world.overlayMesh.visible = hasActiveOverlay;
    world.overlayBatch.flushUpdateRanges();
    if (world.selectedRailOverlayId !== selectedOverlayId) {
      world.selectedRailOverlay.geometry.dispose();
      world.selectedRailOverlay.geometry = selectedOverlayId
        ? polylineTubeGeometry(world.statusPoints.get(selectedOverlayId) ?? [], 71, 3.15, 5)
        : new THREE.BufferGeometry();
      world.selectedRailOverlayId = selectedOverlayId;
    }
    world.selectedRailOverlay.visible = selectedOverlayId !== undefined;
    const nextClosedIds = [...world.statusLinks.keys()].filter(linkId => closedRails.some(rail => rail.points === world.statusPoints.get(linkId)));
    if (nextClosedIds.join('\0') !== world.closedLinkIds.join('\0')) {
      const positions = closedRailCrossPositions(closedRails);
      world.closureMesh.geometry.dispose();
      world.closureMesh.geometry = new THREE.BufferGeometry();
      world.closureMesh.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      world.closureMesh.geometry.computeBoundingSphere();
      world.closureMesh.visible = positions.length > 0;
      world.closedLinkIds = nextClosedIds;
    }
    for (const object of world.tools.children) if (object instanceof THREE.Group && object.userData.kind === 'port') { const pad = object.userData.selectionPad as THREE.Mesh; if (pad.material instanceof THREE.MeshStandardMaterial) pad.material.color.set(selected === `port:${object.userData.id}` ? 0x43a58d : 0xf7d88e); const label = object.children.find(child => child instanceof THREE.Sprite); if (label) label.visible = selected === `port:${object.userData.id}` && !softwareLargeFleet; }
    const foupOwners = [
      ...state.requests.filter(request => request.phase === 'pending' || request.phase === 'assigned').map(request => ({ requestId: request.id, owner: 'source', portId: request.source })),
      ...state.requests.filter(request => request.phase === 'pickup' || request.phase === 'loaded' || request.phase === 'dropoff').map(request => ({ requestId: request.id, owner: 'vehicle', vehicleId: request.vehicle })),
      ...state.storedFoups.map(token => ({ requestId: token.requestId, owner: 'stocker', portId: token.portId })),
    ];
    const physicalFoups = [
      ...world.tokenOwners,
      ...Array.from(world.vehicleGroups.values()).filter(mark => mark.root.visible && mark.foup.visible).map(mark => ({ requestId: vehicleById.get(mark.root.userData.id as string)?.request, owner: 'vehicle' })),
    ];
    const followed = animations.find(item => item.vehicle.id === ownerId);
    if (world.stateInstances?.instanceColor) world.stateInstances.instanceColor.needsUpdate = true;
    const nextDiagnosticAt = { value: 0 }, screenPoint = new THREE.Vector3(), essentialLabelPoint = new THREE.Vector3();
    const updateStagingLabels = () => {
      const perPixel = cameraSpanRef.current / zoom / Math.max(1, viewportSizeRef.current.height);
      for (const sign of world.root.children.filter(child => child.userData.role === 'bay-label')) sign.visible = perPixel >= .9 && 1800 / perPixel >= 260;
      for (const sign of world.stagingLabels.values()) { sign.scale.set(64 * perPixel, 18 * perPixel, 1); sign.visible = layout.areas.length <= 2 || 1800 / perPixel >= 160; }
    };
    const updateEssentialLabels = (camera: THREE.OrthographicCamera | null) => {
      if (!softwareLargeFleet) return;
      const host = hostRef.current;
      const hide = (key: EssentialLabelKey) => { const element = essentialLabelElements.current[key]; if (element) element.hidden = true; };
      if (!camera || !host) { (['owner', 'source', 'destination', 'selected-port'] as EssentialLabelKey[]).forEach(hide); return; }
      const project = (key: EssentialLabelKey, x: number, y: number, z: number) => {
        const element = essentialLabelElements.current[key]; if (!element) return;
        essentialLabelPoint.set(x, y, z).project(camera);
        const visible = essentialLabelPoint.z >= -1 && essentialLabelPoint.z <= 1 && essentialLabelPoint.x >= -1 && essentialLabelPoint.x <= 1 && essentialLabelPoint.y >= -1 && essentialLabelPoint.y <= 1;
        element.hidden = !visible;
        if (visible) {
          const { width, height } = viewportSizeRef.current;
          const left = (essentialLabelPoint.x + 1) * .5 * width, top = (1 - essentialLabelPoint.y) * .5 * height;
          if (left < 0 || left > width || top < 0 || top > height) element.hidden = true;
          else {
            element.style.left = `${left}px`; element.style.top = `${top}px`;
            // Clamp the label's box, not the OHT/port projection. Percentages in
            // translate resolve against the label itself, avoiding layout reads
            // in the animation loop while keeping long labels inside the host.
            element.style.transform = `translate(clamp(${8 - left}px, -50%, calc(${width - 8 - left}px - 100%)), -100%)`;
          }
        }
      };
      const ownerMark = ownerId ? world.vehicleGroups.get(ownerId) : undefined;
      if (essentialOwnerText && ownerMark?.root.visible) project('owner', ownerMark.root.position.x, 93, ownerMark.root.position.z); else hide('owner');
      for (const key of ['source', 'destination'] as const) {
        const endpoint = essentialEndpoints.find(item => item.key === key), node = endpoint && layout.nodes.find(item => item.id === endpoint.nodeId);
        if (node) project(key, node.x, 24, node.y); else hide(key);
      }
      const selectedNode = essentialSelectedPort && layout.nodes.find(item => item.id === essentialSelectedPort.nodeId);
      if (selectedNode) project('selected-port', selectedNode.x, 24, selectedNode.y); else hide('selected-port');
    };
    if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
    const refreshInstances = () => {
      const camera = cameraRef.current; camera?.updateMatrixWorld();
      updateStaticLod(world, cameraSpanRef.current, zoom, viewportSizeRef.current.height);

      if (world.vehicleBodyInstances && world.lowVehicleBodyInstances && world.foupInstances && world.lowFoupInstances && world.stateInstances && world.farStateInstances && world.waitingInstances && world.failureInstances) {
        const currentVehicles = vehicleById;
        const frustum = camera ? new THREE.Frustum().setFromProjectionMatrix(camera.projectionMatrix.clone().multiply(camera.matrixWorldInverse)) : undefined;
        const actorBounds = new THREE.Sphere(new THREE.Vector3(), 80);
        const highIds: string[] = [], lowIds: string[] = [];
        let highFoups = 0, lowFoups = 0, statusCount = 0, farStatusCount = 0, waitingCount = 0, failureCount = 0;
        world.vehicleInstanceIds.forEach((id, index) => {
          const mark = world.vehicleGroups.get(id), vehicle = currentVehicles.get(id);
          if (!mark || !vehicle) return;
          updatePresentedVehicleMatrices(mark.root); mark.status.updateMatrix();
          let onScreen = true;
          if (frustum) { actorBounds.center.setFromMatrixPosition(mark.root.matrixWorld); onScreen = frustum.intersectsSphere(actorBounds); }
          const forcedDetail = selected === `vehicle:${id}` || ownerId === id;
          const closeDetail = rendererVehicleDetail(cameraSpanRef.current, zoom, viewportSizeRef.current.height, mark.root.userData.highDetail === true, onScreen, forcedDetail);
          mark.root.userData.highDetail = closeDetail;
          // Keep every actor on this floor submitted. Offscreen actors use the
          // cheap mesh, so paused pan never loses objects or clipped hoists.
          if (!mark.root.visible) return;
          if (closeDetail) {
            world.vehicleBodyInstances!.setMatrixAt(highIds.length, mark.physical.matrixWorld); highIds.push(id);
            if (mark.foup.visible) { world.foupInstances!.setMatrixAt(highFoups++, mark.foup.matrixWorld); }
          } else {
            world.lowVehicleBodyInstances!.setMatrixAt(lowIds.length, mark.physical.matrixWorld); lowIds.push(id);
            if (mark.foup.visible) world.lowFoupInstances!.setMatrixAt(lowFoups++, mark.physical.matrixWorld.clone().multiply(new THREE.Matrix4().makeTranslation(0, mark.foup.position.y, 0)));
          }
          const statusColor = new THREE.Color(vehicle.failed ? 0xc65d50 : vehicle.loaded ? 0xc68127 : 0x62a79a);
          if (closeDetail) {
            world.stateInstances!.setMatrixAt(statusCount, mark.physical.matrixWorld.clone().multiply(mark.status.matrix));
            world.stateInstances!.setColorAt(statusCount++, statusColor);
          } else {
            world.farStateInstances!.setMatrixAt(farStatusCount, mark.physical.matrixWorld.clone().multiply(mark.status.matrix));
            world.farStateInstances!.setColorAt(farStatusCount++, statusColor);
          }
          mark.badge.updateMatrix(); mark.waitBadge.updateMatrix();
          if (mark.badge.visible) world.failureInstances!.setMatrixAt(failureCount++, mark.root.matrixWorld.clone().multiply(mark.badge.matrix));
          if (mark.waitBadge.visible) world.waitingInstances!.setMatrixAt(waitingCount++, mark.root.matrixWorld.clone().multiply(mark.waitBadge.matrix));
        });
        world.highVehicleInstanceIds = highIds; world.lowVehicleInstanceIds = lowIds;
        world.vehicleBodyInstances.count = highIds.length; world.lowVehicleBodyInstances.count = lowIds.length;
        world.foupInstances.count = highFoups; world.lowFoupInstances.count = lowFoups; world.stateInstances.count = statusCount; world.farStateInstances.count = farStatusCount;
        world.waitingInstances.count = waitingCount; world.failureInstances.count = failureCount;
        world.vehicleBodyInstances.instanceMatrix.needsUpdate = true; world.lowVehicleBodyInstances.instanceMatrix.needsUpdate = true; world.foupInstances.instanceMatrix.needsUpdate = true; world.lowFoupInstances.instanceMatrix.needsUpdate = true; world.stateInstances.instanceMatrix.needsUpdate = true; world.farStateInstances.instanceMatrix.needsUpdate = true; world.waitingInstances.instanceMatrix.needsUpdate = true; world.failureInstances.instanceMatrix.needsUpdate = true;
        world.vehicleBodyInstances.boundingSphere = null; world.lowVehicleBodyInstances.boundingSphere = null;
        if (world.stateInstances.instanceColor) world.stateInstances.instanceColor.needsUpdate = true;
        if (world.farStateInstances.instanceColor) world.farStateInstances.instanceColor.needsUpdate = true;
      }
    };
    const publishDiagnostic = (projected: Record<string, unknown>) => {
      const camera = cameraRef.current;
      if (projected) {
      const host = hostRef.current; if (host) host.dataset.projectedVehicles = JSON.stringify(projected);
      const renderer = rendererRef.current;
      if (renderer && camera) {
        const inventorySampled = sampledInventory.omittedSource + sampledInventory.omittedStored > 0;
        const diagnostic = { captureFrame: () => { if (!sceneRef.current) return null; renderer.render(sceneRef.current, camera); return renderer.domElement.toDataURL('image/png'); }, inspectResources: () => {
          let objects = 0; const materials = new Set<THREE.Material>(), geometries = new Set<THREE.BufferGeometry>();
          world.root.traverse(object => {
            objects++;
            const renderable = object as THREE.Mesh;
            if (renderable.geometry) geometries.add(renderable.geometry);
            if (renderable.material) for (const material of Array.isArray(renderable.material) ? renderable.material : [renderable.material]) materials.add(material);
          });
          return { objects, materials: materials.size, geometries: geometries.size };
        }, renderer: 'three-webgl', analysis: { enabled: !!analysis, mode: analysisMode ?? 'recent', windowSeconds: analysis?.windowSeconds ?? null, rails: [...world.statusMeshes].filter(([,mesh])=>mesh.visible).map(([id,mesh])=>({id,color: (mesh.material as THREE.MeshBasicMaterial).color.getHexString(),geometry:mesh.geometry.uuid,closed:mesh.getObjectByName('closure-cross')?.visible??false})) }, equipment: { ports: layout.ports.length, functional: layout.facility?.equipment.length ?? 0, context: layout.facility?.decorativeEquipment?.length ?? 0 }, staging: { representation: 'off-rail-pool-counts', parked: state.vehicles.filter(v => v.parked).length, pools: Object.fromEntries([...world.stagingLabels].map(([id, sign]) => [id, sign.userData.count])) }, graphics: { ...graphicsInfo, fleetSize: state.vehicles.length, pixelRatio: renderer.getPixelRatio(), adaptiveReason: softwareLargeFleet ? 'software-renderer-large-fleet' : null }, inventoryDisplayLimit, inventorySampled, omittedSource: sampledInventory.omittedSource, omittedStored: sampledInventory.omittedStored, inventory: { sourceActual: sampledInventory.sourceTotal, sourceDrawn: sampledInventory.source.length, storedActual: sampledInventory.storedTotal, storedDrawn: sampledInventory.stored.length }, time: state.time, tick: state.tick, overviewFit: overviewRef.current ? overviewFitRef.current : null, camera: { x: camera.position.x, y: camera.position.y, z: camera.position.z, target: { ...cameraTargetRef.current }, span: cameraSpanRef.current / zoom, near: camera.near, far: camera.far }, vehicles: projected, foupOwners, physicalFoups, routes: routeCandidates?.map(route => ({ links: route.links, selected: route.selected })) ?? [], traffic: Object.fromEntries(Array.from(world.railMeshes.keys(), id => [id, linkCounts.get(id) ?? 0])), queues: Object.fromEntries(Array.from(world.railMeshes.keys(), id => [id, queueCounts.get(id) ?? 0])), draw: { calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures }, staticGeometry: world.staticGeometryStats, staticDetail: world.staticLodDetailed, submitted: { allVehicles: world.vehicleInstanceIds.length, otherFloorVehicles: world.vehicleInstanceIds.length - (world.vehicleBodyInstances?.count ?? 0) - (world.lowVehicleBodyInstances?.count ?? 0) - state.vehicles.filter(v => v.parked).length, detailedVehicleIds: [...world.highVehicleInstanceIds], simpleVehicleIds: [...world.lowVehicleInstanceIds], bodies: (world.vehicleBodyInstances?.count ?? 0) + (world.lowVehicleBodyInstances?.count ?? 0), carriers: (world.foupInstances?.count ?? 0) + (world.lowFoupInstances?.count ?? 0), stateIndicators: (world.stateInstances?.count ?? 0) + (world.farStateInstances?.count ?? 0), detailedStateIndicators: world.stateInstances?.count ?? 0, farStateIndicators: world.farStateInstances?.count ?? 0, waiting: world.waitingInstances?.count ?? 0, failed: world.failureInstances?.count ?? 0, portFoups: world.tokenOwners.length, omittedSource: sampledInventory.omittedSource, omittedStored: sampledInventory.omittedStored }, following: follow, selected: selected ?? null };
        if (host) (host as HTMLDivElement & { __FAB_3D__?: unknown }).__FAB_3D__ = diagnostic;
        if (!host?.closest('[data-policy-world]')) (window as Window & { __FAB_3D__?: unknown }).__FAB_3D__ = diagnostic;
        diagnosticRef.current = diagnostic;
      }
      }
    };
    const apply = (fraction: number) => {
      const diagnosticDue = performance.now() >= nextDiagnosticAt.value;
      if (diagnosticDue) nextDiagnosticAt.value = performance.now() + 240;
      const projected: Record<string, { x: number; y: number; worldX: number; worldZ: number; height: number; heading: number; floor: number; loaded: boolean; foupAttached: boolean; phase: Vehicle['phase']; requestId?: string }> | undefined = diagnosticDue ? {} : undefined;
      const camera = cameraRef.current;
      if (rendererShouldFollow(follow, localFollowIntentRef.current, cameraCommand?.kind) && followed && camera) { overviewRef.current = false; cameraFrameModeRef.current = 'follow'; const pose = followed.motion(fraction); const welcome = cameraCommand?.kind === 'welcome'; const welcomeOffset = welcome ? 55 : 0; const cameraX = pose.x - Math.SQRT1_2 * welcomeOffset, cameraZ = pose.y + Math.SQRT1_2 * welcomeOffset; cameraTargetRef.current = { x: cameraX, y: 72, z: cameraZ }; const distance = 1200; camera.position.set(cameraX + distance * .48, distance * .72, cameraZ + distance * .48); camera.lookAt(cameraX, 72, cameraZ); fitFollowSubject(); const { width, height } = viewportSizeRef.current, safe = cameraSafeRectRef.current, offset = { x: (safe.left + safe.right) / 2 - width / 2, y: (safe.top + safe.bottom) / 2 - height / 2 }; setCameraFrustum(camera, cameraSpanRef.current / zoom, width, height, offset); if (sceneRef.current) updateCameraDepth(camera, sceneRef.current, world.bounds, cameraTargetRef.current,world.root.userData.depthBounds); }
      camera?.updateMatrixWorld();
      for (const item of animations) {
        const pose = item.motion(fraction); item.root.position.set(pose.x, 72, pose.y);
        item.physical.rotation.y = -pose.angle * Math.PI / 180;
        // Interpolate the existing FAB FLOW hoist pose between genuine Engine
        // service ticks. No simulated FOUP ownership/phase is modified.
        item.foup.position.y = THREE.MathUtils.lerp(item.previousFoupY, item.currentFoupY, fraction);
        // A completed pickup is reflected at the confirmed tick boundary; during pickup service, the hoist carries its token.
        item.foup.visible = item.vehicle.loaded || item.vehicle.phase === 'pickup';
        if (camera && projected) { const point = new THREE.Vector3(pose.x, 72, pose.y).project(camera), { width, height } = viewportSizeRef.current; projected[item.vehicle.id] = { x: (point.x + 1) / 2 * width, y: (1 - point.y) / 2 * height, worldX: pose.x, worldZ: pose.y, height: 72, heading: pose.angle, floor: pose.floor, loaded: item.vehicle.loaded, foupAttached: item.vehicle.loaded || item.vehicle.phase === 'pickup', phase: item.vehicle.phase, requestId: item.vehicle.request }; }
      }
      updateStagingLabels();
      updateEssentialLabels(camera);
      refreshInstances();
      if (projected) publishDiagnostic(projected);
      drawRef.current();
    };
    cameraPresentationRef.current = () => {
      refreshInstances();
      const camera = cameraRef.current; if (!camera) return;
      updateStagingLabels();
      updateEssentialLabels(camera);
      const projected: Record<string, unknown> = {};
      for (const item of animations) {
        screenPoint.copy(item.root.position).project(camera);
        const { width, height } = viewportSizeRef.current;
        projected[item.vehicle.id] = { x: (screenPoint.x + 1) / 2 * width, y: (1 - screenPoint.y) / 2 * height, worldX: item.root.position.x, worldZ: item.root.position.z, height: 72, heading: -item.physical.rotation.y * 180 / Math.PI, floor, loaded: item.vehicle.loaded, foupAttached: item.vehicle.loaded || item.vehicle.phase === 'pickup', phase: item.vehicle.phase, requestId: item.vehicle.request };
      }
      publishDiagnostic(projected);
    };
    if (!running || reducedMotion || !animations.length) { apply(1); return; }
    const started = performance.now(); const animate = (now: number) => { const f = Math.min(1, (now - started) / Math.max(16, tickMs)); apply(f); if (f < 1) animationRef.current = requestAnimationFrame(animate); }; animate(started);
    return () => {
      if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
      cameraPresentationRef.current = () => undefined;
    };
  }, [layout, state, running, reducedMotion, tickMs, ownerId, follow, zoom, selected, failures, analysis, analysisMode, heatmap, view, floor, worldRevision, cameraCommand?.sequence, lodRevision, graphicsInfo, softwareLargeFleet, essentialOwnerText, essentialEndpoints, essentialSelectedPort, inventoryDisplayLimit, sampledInventory, error]);
  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => { if (cameraLocked) return; const camera = cameraRef.current; if (!camera) return; (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId); pointerPoints.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointerPoints.current.size === 2) { pinchGestureRef.current = true; const [a, b] = Array.from(pointerPoints.current.values()); pinchRef.current = { distance: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)), zoom, moved: false }; dragRef.current = null; }
    else if (pointerPoints.current.size === 1) dragRef.current = { x: event.clientX, y: event.clientY, center: camera.position.clone(), target: { ...cameraTargetRef.current } };
    setLabel(''); };
  const releaseProjection = () => {
    const camera = cameraRef.current;
    if (!camera) return false;
    const target = new THREE.Vector3(cameraTargetRef.current.x, cameraTargetRef.current.y, cameraTargetRef.current.z);
    const changed = releaseFocusedProjection(camera, target);
    if (changed) cameraTargetRef.current = { x: target.x, y: target.y, z: target.z };
    return changed;
  };
  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => { if (cameraLocked) return; const host = hostRef.current, camera = cameraRef.current; if (!host || !camera) return;
    if (pointerPoints.current.has(event.pointerId)) pointerPoints.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pinchRef.current && pointerPoints.current.size >= 2) { overviewRef.current = false; cameraFrameModeRef.current = 'manual'; automaticFollowSpanRef.current = null; releaseProjection(); const [a, b] = Array.from(pointerPoints.current.values()); pinchRef.current.moved = true; setZoom(clampZoom(pinchRef.current.zoom * Math.hypot(a.x - b.x, a.y - b.y) / pinchRef.current.distance)); return; }
    if (dragRef.current) {
      if (Math.hypot(event.clientX - dragRef.current.x, event.clientY - dragRef.current.y) <= 5) return;
      overviewRef.current = false; cameraFrameModeRef.current = 'manual'; automaticFollowSpanRef.current = null; localFollowIntentRef.current = false; setFollow(false); onFollowChange?.(false);
      if (releaseProjection() && dragRef.current) dragRef.current = { ...dragRef.current, center: camera.position.clone(), target: { ...cameraTargetRef.current } };
      const { x, y, center, target: origin } = dragRef.current, scale = cameraSpanRef.current / zoom / Math.max(240, host.clientHeight);
      camera.updateMatrixWorld();
      const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0); right.y = 0; right.normalize();
      const screenUp = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1); screenUp.y = 0;
      const correction = Math.max(.1, screenUp.lengthSq());
      const screenX = event.clientX - x, screenY = event.clientY - y;
      const worldX = (-screenX * right.x + screenY * screenUp.x / correction) * scale;
      const worldZ = (-screenX * right.z + screenY * screenUp.z / correction) * scale;
      camera.position.set(center.x + worldX, center.y, center.z + worldZ);
      cameraTargetRef.current = { x: origin.x + worldX, y: origin.y, z: origin.z + worldZ };
      camera.lookAt(cameraTargetRef.current.x, cameraTargetRef.current.y, cameraTargetRef.current.z);
      if (sceneRef.current && worldRef.current) updateCameraDepth(camera, sceneRef.current, worldRef.current.bounds, cameraTargetRef.current,worldRef.current.root.userData.depthBounds);
      cameraPresentationDirtyRef.current = true; drawRef.current(); return;
    }
    const rect = host.getBoundingClientRect(); pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1); raycaster.setFromCamera(pointer, camera); const info = worldRef.current ? pickSceneTarget(worldRef.current, raycaster) : undefined;
    if (info?.kind === 'port') setLabel(layout.ports.find(p => p.id === info.id)?.name ?? info.id); else if (info?.kind === 'vehicle') setLabel(`${info.id} · OHT`); else if (info?.kind === 'rail') setLabel(`${info.id} · directed guideway`); else setLabel('');
  };
  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => { const host = hostRef.current, camera = cameraRef.current, wasPinching = !!pinchRef.current || pinchGestureRef.current; pointerPoints.current.delete(event.pointerId); if (wasPinching) { if (pointerPoints.current.size < 2) pinchRef.current = null; if (!pointerPoints.current.size) pinchGestureRef.current = false; dragRef.current = null; return; } if (dragRef.current) { const moved = Math.hypot(event.clientX - dragRef.current.x, event.clientY - dragRef.current.y); dragRef.current = null; if (moved > 5) return; }
    if (!host || !camera) return; const rect = host.getBoundingClientRect(); pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1); raycaster.setFromCamera(pointer, camera);
    const info = worldRef.current ? pickSceneTarget(worldRef.current, raycaster) : undefined; if (info) onSelect(info.kind, info.id);
  };
  const zoomBy = (scale: number) => { if (cameraLocked) return; overviewRef.current = false; cameraFrameModeRef.current = 'manual'; automaticFollowSpanRef.current = null; releaseProjection(); setLabel(''); setZoom(value => clampZoom(value * scale)); };
  const wheelZoomRef = useRef(zoomBy); wheelZoomRef.current = zoomBy;
  useEffect(() => {
    const host = hostRef.current; if (!host) return;
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      if (cameraLocked || !event.deltaY) return;
      const pixels = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? host.clientHeight : 1);
      wheelZoomRef.current(Math.exp(-Math.max(-200, Math.min(200, pixels)) * .002));
    };
    host.addEventListener('wheel', wheel, { passive: false });
    return () => host.removeEventListener('wheel', wheel);
  }, [rendererReady, cameraLocked]);
  const centerOverview = () => { if (cameraLocked) return; localFollowIntentRef.current = false; setFollow(false); onFollowChange?.(false); overviewRef.current = true; cameraFrameModeRef.current = 'overview'; setZoom(1); setLodRevision(value => value + 1); const b = worldRef.current?.bounds; const cam = cameraRef.current; if (b && cam) { const { width, height } = viewportSizeRef.current, x = b.x + b.width / 2, z = b.y + b.height / 2, d = rendererCameraDistance(b.width, b.height, true), aspect = width / Math.max(1, height); cameraSpanRef.current = fitProjectedOverviewSpan(b.width, b.height, aspect); cameraTargetRef.current = { x, y: 35, z }; cam.position.set(x + d * .48, d * .72, z + d * .48); cam.far = rendererCameraFar(b.width, b.height, d); if (sceneRef.current?.fog instanceof THREE.Fog) { sceneRef.current.fog.near = Math.max(1700, d * .9); sceneRef.current.fog.far = Math.max(4200, d + (b.width + b.height) * .8); } cam.updateProjectionMatrix(); cam.lookAt(x, 35, z); resizeRef.current(); } };
  const names = useMemo(() => new Map(layout.ports.map(p => [p.id, p.name])), [layout.ports]);
  void names;
  const qualityTitle = !graphicsInfo.renderer ? '3D 품질' : softwareLargeFleet
    ? `소프트웨어 렌더러의 대규모 차량 장면은 응답성을 위해 해상도를 낮춥니다. 현재 DPR ${effectivePixelRatio.toFixed(2)}`
    : `현재 렌더 해상도 DPR ${effectivePixelRatio.toFixed(2)}`;
  if (error) return <div className="three-fallback-shell"><div className="three-status" role="status">3D 렌더러를 시작할 수 없어 접근 가능한 2D 지도를 표시합니다.</div><FacilitySceneFallback {...props} /></div>;
  return <div ref={stageRef} className={`map-stage facility-stage three-stage${rendererReady ? ' renderer-ready' : ''}`} data-renderer="three-webgl" data-simulation-time={state.time} data-simulation-tick={state.tick} data-camera-following={follow} data-quality={quality} aria-label="Isometric FAB scene" data-camera-locked={cameraLocked ? "true" : "false"}>
    <div ref={hostRef} className="three-scene-host" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={event => { dragRef.current = null; pointerPoints.current.delete(event.pointerId); pinchRef.current = null; if (!pointerPoints.current.size) pinchGestureRef.current = false; }} onDoubleClick={cameraLocked ? undefined : centerOverview} />
    {softwareLargeFleet && <div className="three-essential-labels" aria-hidden="true">
      {essentialOwnerText && <div hidden className="three-essential-label owner" ref={element => { essentialLabelElements.current.owner = element; }}>{essentialOwnerText}</div>}
      {essentialEndpoints.map(endpoint => <div hidden key={endpoint.key} className={`three-essential-label ${endpoint.key}`} ref={element => { essentialLabelElements.current[endpoint.key] = element; }}>{endpoint.text}</div>)}
      {essentialSelectedPort && <div hidden className="three-essential-label selected-port" ref={element => { essentialLabelElements.current['selected-port'] = element; }}>{essentialSelectedPort.text}</div>}
    </div>}
    {!rendererReady && <div className="three-status" role="status">{error ? `3D 렌더러를 시작할 수 없어 기존 지도를 사용합니다. ${error}` : '3D FAB 준비 중…'}</div>}
    {label && <div className="three-hover-label" aria-live="polite">{label}</div>}
    {!cameraLocked && <div className="three-controls" aria-label="3D camera controls"><button onClick={() => zoomBy(1.2)} aria-label="확대">＋</button><button onClick={() => zoomBy(.84)} aria-label="축소">−</button><button onClick={centerOverview} aria-label="전체 보기">⌖</button><button className={follow ? 'active' : ''} disabled={!ownerId} onClick={() => { const next = !follow; if (!next) { automaticFollowSpanRef.current = null; releaseProjection(); } overviewRef.current = false; cameraFrameModeRef.current = next ? 'follow' : 'manual'; localFollowIntentRef.current = next; setFollow(next); onFollowChange?.(next); }} aria-label="선택 OHT 따라가기">◎</button><select aria-label="3D 품질" title={qualityTitle} value={quality} onChange={event => setQuality(event.target.value as typeof quality)}><option value="high">높음</option><option value="balanced">보통</option><option value="low">절전</option></select></div>}
    {softwareLargeFleet && (sampledInventory.omittedSource + sampledInventory.omittedStored > 0 || selectedInventoryCounts) && <div className="three-inventory-note" aria-label="Port FOUP 표시 정보">
      {(sampledInventory.omittedSource + sampledInventory.omittedStored > 0) && <span>포트 FOUP 간소화 · 준비·보관 각각 포트당 최대 {inventoryDisplayLimit}개 표시 (실제 수량 유지)</span>}
      {selectedInventoryCounts && <strong>선택 {layout.ports.find(port => port.id === selectedInventoryPort)?.name ?? selectedInventoryPort} · 준비 {selectedInventoryCounts.sourceDrawn}/{selectedInventoryCounts.sourceTotal} 표시 · 보관 {selectedInventoryCounts.storedDrawn}/{selectedInventoryCounts.storedTotal} 표시</strong>}
    </div>}
    <div className="three-scene-key"><span><i className="key-oht"/> OHT</span><span><i className="key-foup"/> FOUP</span><span><i className="key-rail"/> Elevated guideway</span></div>
  </div>;
}
