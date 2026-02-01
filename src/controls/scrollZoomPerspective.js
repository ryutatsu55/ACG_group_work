import * as THREE from 'three';

export function addScrollZoomPerspective({
  camera,
  domElement,
  minFov = 22,      // smaller FOV = more zoom-in
  maxFov = 75,
  zoomSpeed = 1.0,  // sensitivity
  smooth = 0.2,     // 0..1 (higher = snappier)
} = {}) {
  let targetFov = THREE.MathUtils.clamp(camera.fov, minFov, maxFov);

  const onWheel = (e) => {
    const delta = (e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY); // normalize FF/others
    targetFov += delta * 0.02 * zoomSpeed;     // wheel down -> wider FOV (zoom out)
    targetFov = THREE.MathUtils.clamp(targetFov, minFov, maxFov);
    e.preventDefault();                        // stop page scroll while over canvas
  };

  const update = () => {
    const next = THREE.MathUtils.lerp(camera.fov, targetFov, smooth);
    if (Math.abs(next - camera.fov) > 1e-4) {
      camera.fov = next;
      camera.updateProjectionMatrix();         // apply changes to projection
    }
  };

  domElement.addEventListener('wheel', onWheel, { passive: false }); // important

  return {
    update,
    dispose() { domElement.removeEventListener('wheel', onWheel); },
  };
  
}
