import type { OrthographicCamera, Vector3 } from 'three';

/** Recenters an asymmetric orthographic frustum without changing any point's projection. */
export function releaseFocusedProjection(camera: OrthographicCamera, target: Vector3): boolean {
  const centerX = (camera.left + camera.right) / 2;
  const centerY = (camera.top + camera.bottom) / 2;
  if (Math.abs(centerX) < 1e-10 && Math.abs(centerY) < 1e-10) return false;

  camera.updateMatrixWorld(true);
  const offset = camera.position.clone().set(0, 0, 0);
  const right = offset.clone().setFromMatrixColumn(camera.matrixWorld, 0);
  const up = offset.clone().setFromMatrixColumn(camera.matrixWorld, 1);
  offset.copy(right).multiplyScalar(centerX).addScaledVector(up, centerY);

  camera.position.add(offset);
  target.add(offset);
  camera.left -= centerX;
  camera.right -= centerX;
  camera.top -= centerY;
  camera.bottom -= centerY;
  camera.updateMatrixWorld(true);
  camera.updateProjectionMatrix();
  return true;
}
