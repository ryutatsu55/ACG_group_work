
// src/controls/dragOrbitPerspective.js
import * as THREE from 'three';

export function createDragOrbitPerspective({
  camera,
  domElement,
  getTargetWorld = null,     // () => THREE.Vector3 (world space), default (0,0,0)
  rotateSpeed = 0.0025,
  minPolarAngle = 0.1,
  maxPolarAngle = Math.PI - 0.1,
  dragThresholdPx = 4,
  minRadius = 0.1,
  resetAnimSec = 0.25,
  defaultTargetWorld = null, // THREE.Vector3
  defaultSpherical = null,   // { radius, phi, theta }
} = {}) {
  if (!camera || !domElement || !camera.isPerspectiveCamera) {
    console.warn('[dragOrbitPerspective] invalid camera/domElement or not PerspectiveCamera');
    return { setEnabled(){}, update(){}, dispose(){}, setDefault(){} };
  }

  let enabled = false, ptrActive = false, dragging = false, suppressNextClick = false;
  let startX = 0, startY = 0, lastX = 0, lastY = 0;

  // World-space state
  const targetW = new THREE.Vector3();
  const camW    = new THREE.Vector3();
  const offsetW = new THREE.Vector3();

  const spherical = new THREE.Spherical();
  let lastGoodRadius = 3;

  // Reset animation
  let resetting = false, resetT = 0;
  const startSph = new THREE.Spherical();
  const endSph   = new THREE.Spherical();
  const startTW  = new THREE.Vector3();
  const endTW    = new THREE.Vector3();

  // Defaults
  const _default = {
    targetW: (defaultTargetWorld?.isVector3) ? defaultTargetWorld.clone() : new THREE.Vector3(0,0,0),
    spherical: {
      radius: defaultSpherical?.radius ?? 3,
      phi:    defaultSpherical?.phi    ?? Math.PI/2,
      theta:  defaultSpherical?.theta  ?? 0
    }
  };

  function getWorldTarget() {
    if (typeof getTargetWorld === 'function') {
      targetW.copy(getTargetWorld() || new THREE.Vector3(0,0,0));
    } else {
      targetW.set(0,0,0);
    }
  }

  function updateWorldMatrices() {
    camera.updateMatrixWorld(true);
    camera.parent?.updateMatrixWorld(true);
  }

  function assignLocalFromWorld(worldPos) {
    if (camera.parent) {
      const local = worldPos.clone();
      camera.parent.worldToLocal(local);
      camera.position.copy(local);
    } else {
      camera.position.copy(worldPos);
    }
    camera.updateMatrixWorld(true);
  }

  function syncFromCamera() {
    updateWorldMatrices();
    getWorldTarget();
    camera.getWorldPosition(camW);
    offsetW.copy(camW).sub(targetW);
    spherical.setFromVector3(offsetW).makeSafe();

    if (!Number.isFinite(spherical.radius) || spherical.radius < minRadius) {
      spherical.radius = Math.max(lastGoodRadius, 3);
      offsetW.setFromSpherical(spherical);
      camW.copy(targetW).add(offsetW);
      assignLocalFromWorld(camW);
      camera.lookAt(targetW);
    } else {
      lastGoodRadius = spherical.radius;
    }
  }

  function applyToCamera() {
    spherical.makeSafe();
    spherical.phi = THREE.MathUtils.clamp(spherical.phi, minPolarAngle, maxPolarAngle);
    if (!Number.isFinite(spherical.radius) || spherical.radius < minRadius) {
      spherical.radius = Math.max(lastGoodRadius, 3);
    }
    lastGoodRadius = spherical.radius;

    offsetW.setFromSpherical(spherical);
    camW.copy(targetW).add(offsetW);
    assignLocalFromWorld(camW);
    camera.lookAt(targetW);
  }

  function beginResetAnimation() {
    resetting = true; resetT = 0;
    updateWorldMatrices(); getWorldTarget();
    startTW.copy(targetW); endTW.copy(_default.targetW);
    startSph.copy(spherical);
    endSph.radius = _default.spherical.radius;
    endSph.phi    = THREE.MathUtils.clamp(_default.spherical.phi, minPolarAngle, maxPolarAngle);
    endSph.theta  = _default.spherical.theta;
  }

  function stepResetAnimation(dt) {
    if (!resetting) return;
    const dur = Math.max(0.001, resetAnimSec);
    resetT = Math.min(1, resetT + dt / dur);
    const t = resetT * resetT * (3 - 2 * resetT); // smoothstep

    targetW.lerpVectors(startTW, endTW, t);
    spherical.radius = THREE.MathUtils.lerp(startSph.radius, endSph.radius, t);
    spherical.phi    = THREE.MathUtils.lerp(startSph.phi,    endSph.phi,    t);
    spherical.theta  = THREE.MathUtils.lerp(startSph.theta,  endSph.theta,  t);

    applyToCamera();
    if (resetT >= 1) resetting = false;
  }

  function onPointerDown(e) {
    if (!enabled || e.button !== 0) return;
    ptrActive = true; dragging = false; suppressNextClick = false;
    startX = lastX = e.clientX; startY = lastY = e.clientY;

    syncFromCamera();
    try { domElement.setPointerCapture(e.pointerId); } catch {}
    domElement.style.cursor = 'grabbing';
    e.preventDefault(); e.stopPropagation();
  }

  function onPointerMove(e) {
    if (!enabled || !ptrActive) return;

    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;

    const tdx = e.clientX - startX, tdy = e.clientY - startY;
    if (!dragging && (tdx*tdx + tdy*tdy) >= dragThresholdPx*dragThresholdPx) {
      dragging = true; suppressNextClick = true;
    }

    if (dragging) {
      spherical.theta -= dx * rotateSpeed;
      spherical.phi   -= dy * rotateSpeed;
      getWorldTarget(); // pivot may be dynamic
      applyToCamera();
    }

    e.preventDefault(); e.stopPropagation();
  }

  function onPointerUp(e) {
    if (!enabled || !ptrActive) return;
    ptrActive = false;
    try { domElement.releasePointerCapture(e.pointerId); } catch {}
    domElement.style.cursor = enabled ? 'grab' : 'auto';

    const tdx = e.clientX - startX, tdy = e.clientY - startY;
    const wasClick = (tdx*tdx + tdy*tdy) < dragThresholdPx*dragThresholdPx;
    if (wasClick) beginResetAnimation();

    e.preventDefault(); e.stopPropagation();
  }

  function onClickCapture(e) {
    if (!enabled) return;
    if (suppressNextClick) {
      e.preventDefault(); e.stopImmediatePropagation?.();
      suppressNextClick = false;
    }
  }

  function onMouseDownCapture(e) {
    if (!enabled) return;
    if (e.button === 0) { e.preventDefault(); e.stopImmediatePropagation(); }
  }

  function setEnabled(v) {
    enabled = !!v;
    domElement.style.cursor = enabled ? 'grab' : 'auto';
    if (enabled) { syncFromCamera(); }
  }

  function update(dt = 0) {
    if (!enabled) return;
    if (!ptrActive && typeof getTargetWorld === 'function') {
      const prev = targetW.clone();
      getWorldTarget();
      if (!prev.equals(targetW)) applyToCamera();
    }
    if (resetting) stepResetAnimation(dt);
  }

  function setDefault({ targetW: t, spherical: sph } = {}) {
    if (t?.isVector3) _default.targetW.copy(t);
    if (sph?.radius !== undefined) _default.spherical.radius = sph.radius;
    if (sph?.phi    !== undefined) _default.spherical.phi    = sph.phi;
    if (sph?.theta  !== undefined) _default.spherical.theta  = sph.theta;
  }

  function dispose() {
    domElement.removeEventListener('pointerdown', onPointerDown, { capture: false });
    domElement.removeEventListener('pointermove', onPointerMove, { capture: false });
    domElement.removeEventListener('pointerup',   onPointerUp,   { capture: false });
    domElement.removeEventListener('pointercancel', onPointerUp, { capture: false });
    domElement.removeEventListener('mousedown', onMouseDownCapture, true);
    domElement.removeEventListener('click', onClickCapture, true);
  }

  domElement.addEventListener('pointerdown', onPointerDown, { passive: false });
  domElement.addEventListener('pointermove', onPointerMove, { passive: false });
  domElement.addEventListener('pointerup',   onPointerUp,   { passive: false });
  domElement.addEventListener('pointercancel', onPointerUp, { passive: true  });
  domElement.addEventListener('mousedown', onMouseDownCapture, true);
  domElement.addEventListener('click',      onClickCapture, true);

  // Capture current view as default if none provided
  if (!defaultTargetWorld || !defaultSpherical) {
    updateWorldMatrices(); getWorldTarget(); camera.getWorldPosition(camW);
    offsetW.copy(camW).sub(targetW);
    const sph = new THREE.Spherical().setFromVector3(offsetW).makeSafe();
    _default.targetW.copy(targetW);
    _default.spherical.radius = sph.radius || 3;
    _default.spherical.phi    = sph.phi;
    _default.spherical.theta  = sph.theta;
  }

  return { setEnabled, update, dispose, setDefault };
}
