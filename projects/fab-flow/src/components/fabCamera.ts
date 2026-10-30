export type CameraFrame = { x: number; y: number; w: number; h: number };
export type WorldBounds = { x: number; y: number; width: number; height: number };
export type Point = { x: number; y: number };
export type ScreenRect = { left: number; top: number; right: number; bottom: number };
export type ProjectedBounds = { minX: number; maxX: number; minY: number; maxY: number };

/** Largest unobstructed view at the facility's projected aspect. Coordinates are CSS pixels. */
export function overviewSafeRect(width: number, height: number, bounds: ProjectedBounds, obstacles: readonly ScreenRect[]): ScreenRect {
  const margin = Math.min(18, width * .025, height * .04);
  const outer = { left: margin, top: margin, right: width - margin, bottom: height - margin };
  const blocks = obstacles.filter(r => r.right > outer.left && r.left < outer.right && r.bottom > outer.top && r.top < outer.bottom)
    .map(r => ({ left: Math.max(outer.left,r.left-10), right: Math.min(outer.right,r.right+10), top: Math.max(outer.top,r.top-10), bottom: Math.min(outer.bottom,r.bottom+10) }));
  const xs = [...new Set([outer.left,outer.right,...blocks.flatMap(r=>[r.left,r.right])])].sort((a,b)=>a-b);
  const ys = [...new Set([outer.top,outer.bottom,...blocks.flatMap(r=>[r.top,r.bottom])])].sort((a,b)=>a-b);
  const projectedWidth = Math.max(1,bounds.maxX-bounds.minX), projectedHeight = Math.max(1,bounds.maxY-bounds.minY);
  const findBest = (minimumWidth: number, minimumHeight: number): ScreenRect | null => {
    let best: ScreenRect | null = null, bestScale = 0, bestArea = 0;
    for(let l=0;l<xs.length-1;l++) for(let r=l+1;r<xs.length;r++) for(let t=0;t<ys.length-1;t++) for(let b=t+1;b<ys.length;b++) {
      const rect={left:xs[l],right:xs[r],top:ys[t],bottom:ys[b]}, w=rect.right-rect.left,h=rect.bottom-rect.top;
      if(w<minimumWidth||h<minimumHeight||blocks.some(o=>rect.left<o.right&&rect.right>o.left&&rect.top<o.bottom&&rect.bottom>o.top)) continue;
      const scale=Math.min(w/projectedWidth,h/projectedHeight), area=w*h;
      if(scale>bestScale+1e-7 || Math.abs(scale-bestScale)<1e-7&&area>bestArea) {best=rect;bestScale=scale;bestArea=area;}
    }
    return best;
  };
  const standard = findBest(Math.min(160,width*.35),Math.min(120,height*.3));
  if (standard) return standard;
  // On compact screens, preserve a visible unobstructed band when HUD and
  // drawers leave less than the normal overview minimum. If overlays cover
  // the whole host, retain the previous full-host fallback.
  return findBest(Math.min(32,width*.35),Math.min(32,height*.3)) ?? outer;
}

/** Fit the measured 3D projection without changing the camera's orientation. */
export function fitProjectedFacility(bounds: ProjectedBounds, width: number, height: number, safe: ScreenRect, padding=1.08) {
  const span=Math.max((bounds.maxY-bounds.minY)*height/Math.max(1,safe.bottom-safe.top), (bounds.maxX-bounds.minX)*height/Math.max(1,safe.right-safe.left))*padding;
  return { span, x:(bounds.minX+bounds.maxX)/2-((safe.left+safe.right)/2-width/2)*span/height,
    y:(bounds.minY+bounds.maxY)/2+((safe.top+safe.bottom)/2-height/2)*span/height };
}

export type CameraLod = 'close' | 'mid' | 'overview';
export type CameraCommand = {
  sequence: number;
  kind: 'welcome' | 'opening' | 'tableau' | 'follow' | 'request' | 'bay' | 'connected' | 'overview' | 'cancel' | 'rail';
  /** Fixed educational close-up: world coordinates, never bound to an OHT. */
  frame?: { x: number; z: number; span: number };
  railId?: string;
  requestId?: string;
  vehicleId?: string;
  resetZoom?: boolean;
};

export function clampFrame(frame: CameraFrame, bounds: WorldBounds, aspect: number): CameraFrame {
  const safeAspect = Number.isFinite(aspect) && aspect > 0 ? aspect : 1;
  const minWidth = Math.min(bounds.width, 24 * safeAspect);
  const maxWidth = Math.min(bounds.width * 1.8, bounds.height * 1.8 * safeAspect);
  const w = Math.max(minWidth, Math.min(maxWidth, frame.w));
  const h = w / safeAspect;
  const xMin = bounds.x - Math.max(0, w - bounds.width) / 2;
  const yMin = bounds.y - Math.max(0, h - bounds.height) / 2;
  const x = Math.max(xMin, Math.min(bounds.x + bounds.width - w + Math.max(0, w - bounds.width) / 2, frame.x));
  const y = Math.max(yMin, Math.min(bounds.y + bounds.height - h + Math.max(0, h - bounds.height) / 2, frame.y));
  return { x, y, w, h };
}

export function fitCamera(points: readonly Point[], viewportWidth: number, viewportHeight: number, padding = 1.18): CameraFrame | null {
  if (!points.length || viewportWidth <= 0 || viewportHeight <= 0) return null;
  const xs = points.map(point => point.x), ys = points.map(point => point.y);
  const centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
  const centerY = (Math.min(...ys) + Math.max(...ys)) / 2;
  const aspect = viewportWidth / viewportHeight;
  const spanX = Math.max(80, Math.max(...xs) - Math.min(...xs));
  const spanY = Math.max(80, Math.max(...ys) - Math.min(...ys));
  let w = Math.max(spanX * padding, spanY * padding * aspect);
  let h = w / aspect;
  if (h < spanY * padding) { h = spanY * padding; w = h * aspect; }
  return { x: centerX - w / 2, y: centerY - h / 2, w, h };
}

export function followFrame(frame: CameraFrame, position: Point, aspect: number): CameraFrame {
  const safeAspect = Number.isFinite(aspect) && aspect > 0 ? aspect : frame.w / frame.h;
  const height = frame.w / safeAspect;
  return { x: position.x - frame.w / 2, y: position.y - height / 2, w: frame.w, h: height };
}

/** Derive a viewport-shaped frame from a persistent intent without changing its zoom span. */
export function resizeCameraFrame(intent: CameraFrame, aspect: number, center?: Point): CameraFrame {
  const safeAspect = Number.isFinite(aspect) && aspect > 0 ? aspect : intent.w / intent.h;
  const width = Math.max(intent.w, intent.h * safeAspect);
  const height = width / safeAspect;
  const centerX = center?.x ?? intent.x + intent.w / 2;
  const centerY = center?.y ?? intent.y + intent.h / 2;
  return { x: centerX - width / 2, y: centerY - height / 2, w: width, h: height };
}

/** Wide welcome views show the whole facility; portrait welcome views cover the first bay. */
export function welcomeCameraFrame(bounds: WorldBounds, area: Pick<WorldBounds, 'x' | 'y' | 'width' | 'height'> | undefined, aspect: number): CameraFrame {
  const safeAspect = Number.isFinite(aspect) && aspect > 0 ? aspect : 1;
  if (safeAspect >= 1) {
    const width = Math.max(bounds.width * 1.04, bounds.height * 1.04 * safeAspect);
    const height = width / safeAspect;
    return { x: bounds.x + bounds.width / 2 - width / 2, y: bounds.y + bounds.height / 2 - height / 2, w: width, h: height };
  }
  const focus = area ?? bounds;
  const height = focus.height * 1.25;
  const width = height * safeAspect;
  return { x: focus.x + focus.width / 2 - width / 2, y: focus.y + focus.height / 2 - height / 2, w: width, h: height };
}

export function cameraLod(frame: CameraFrame, viewportWidth: number, viewportHeight: number): CameraLod {
  const pixelsPerUnit = Math.min(viewportWidth / frame.w, viewportHeight / frame.h);
  const chassisPixels = pixelsPerUnit * 26;
  return chassisPixels >= 22 ? 'close' : chassisPixels >= 9 ? 'mid' : 'overview';
}

export function interpolateFrame(from: CameraFrame, to: CameraFrame, fraction: number): CameraFrame {
  const t = Math.min(1, Math.max(0, fraction));
  const eased = 1 - (1 - t) * (1 - t) * (1 - t);
  return {
    x: from.x + (to.x - from.x) * eased,
    y: from.y + (to.y - from.y) * eased,
    w: from.w + (to.w - from.w) * eased,
    h: from.h + (to.h - from.h) * eased,
  };
}
