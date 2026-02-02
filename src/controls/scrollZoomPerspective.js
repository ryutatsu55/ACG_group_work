import * as THREE from 'three';

export function addScrollZoomPerspective({
  camera,
  domElement,
  minFov = 22,      // smaller FOV -> more zoom-in
  maxFov = 75,
  zoomSpeed = 1.0,  // sensitivity
  smooth = 0.2,     // 0~1 (higher -> snappier)
} = {}) {
  let targetFov = THREE.MathUtils.clamp(camera.fov, minFov, maxFov);

  const onWheel = (e) => {
    const delta = (e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY); 
    targetFov += delta * 0.02 * zoomSpeed;     
    targetFov = THREE.MathUtils.clamp(targetFov, minFov, maxFov);
    e.preventDefault();                   
  };

  const update = () => {
    const next = THREE.MathUtils.lerp(camera.fov, targetFov, smooth);
    if (Math.abs(next - camera.fov) > 1e-4) {
      camera.fov = next;
      camera.updateProjectionMatrix();  
    }
  };

  domElement.addEventListener('wheel', onWheel, { passive: false });

  return {
    update,
    dispose() { domElement.removeEventListener('wheel', onWheel); },
  };

}
