import * as THREE from 'three';

export function createDragOrbit({
  camera,
  domElement,
  getTarget = null,          // () => Vector3   (pivot). Default: (0,0,0)
  rotateSpeed = 0.0025,      // radians per pixel
  minPolarAngle = 0.1,       // clamp to avoid flipping
  maxPolarAngle = Math.PI - 0.1,
  dragThresholdPx = 4,       // movement to count as a drag
  resetAnimSec = 0.25,       // animation time when resetting
  // Optionally override default orientation at construction:
  defaultTarget = null,      // Vector3
  defaultSpherical = null,   // { radius, phi, theta }
} = {}) {
  if (!camera || !domElement) {
    console.warn('[dragOrbit] camera or domElement missing');
    return { setEnabled(){}, update(){}, dispose(){}, setDefault(){} };
  }

  let enabled = false;

  // State
  let ptrActive = false;     // pointer is currently pressed
  let dragging = false;      // we crossed threshold
  let suppressNextClick = false; // prevents global click handlers once a drag happened
  let startX = 0, startY = 0;
  let lastX = 0, lastY = 0;

  // Orientation state
  const target = new THREE.Vector3();
  const spherical = new THREE.Spherical();
  const offset = new THREE.Vector3();

  // Reset animation
  let resetting = false;
  let resetT = 0; // [0..1]
  const startSph = new THREE.Spherical();
  const endSph = new THREE.Spherical();
  const startTarget = new THREE.Vector3();
  const endTarget = new THREE.Vector3();

  // Helpers ------------------------------------------------------------

  function readTarget() {
    if (typeof getTarget === 'function') {
      target.copy(getTarget() || new THREE.Vector3(0,0,0));
    }
  }

  function syncFromCamera() {
    readTarget();
    offset.copy(camera.position).sub(target);
    spherical.setFromVector3(offset);
    spherical.makeSafe();
  }

  function applyToCamera() {
    spherical.makeSafe();
    spherical.phi = Math.max(minPolarAngle, Math.min(maxPolarAngle, spherical.phi));
    offset.setFromSpherical(spherical);
    camera.position.copy(target).add(offset);
    camera.lookAt(target);
    // (No need to updateProjectionMatrix unless FOV/zoom changed elsewhere)
  }

  function setDefaultFromCurrent() {
    // Called at init if no default given; captures current view as "default".
    const curTarget = new THREE.Vector3();
    if (typeof getTarget === 'function') {
      curTarget.copy(getTarget() || new THREE.Vector3(0,0,0));
    }
    const curOff = camera.position.clone().sub(curTarget);
    const sph = new THREE.Spherical().setFromVector3(curOff).makeSafe();

    _default.target.copy(curTarget);
    _default.spherical.radius = sph.radius;
    _default.spherical.phi    = sph.phi;
    _default.spherical.theta  = sph.theta;
  }

  const _default = {
    target: (defaultTarget && defaultTarget.isVector3) ? defaultTarget.clone() : new THREE.Vector3(0,0,0),
    spherical: {
      radius: (defaultSpherical && Number.isFinite(defaultSpherical.radius)) ? defaultSpherical.radius : 1,
      phi:    (defaultSpherical && Number.isFinite(defaultSpherical.phi))    ? defaultSpherical.phi    : Math.PI/2,
      theta:  (defaultSpherical && Number.isFinite(defaultSpherical.theta))  ? defaultSpherical.theta  : 0,
    }
  };

  if (!defaultTarget || !defaultSpherical) {
    // Capture current camera orientation as default when not provided
    setDefaultFromCurrent();
  }

  function beginResetAnimation() {
    // Start animating from current orientation to default orientation
    resetting = true;
    resetT = 0;

    // from
    readTarget();
    startTarget.copy(target);
    startSph.copy(spherical);

    // to
    endTarget.copy(_default.target);
    endSph.radius = _default.spherical.radius;
    endSph.phi    = THREE.MathUtils.clamp(_default.spherical.phi, minPolarAngle, maxPolarAngle);
    endSph.theta  = _default.spherical.theta;
  }

  function stepResetAnimation(dt) {
    if (!resetting) return;
    const duration = Math.max(0.001, resetAnimSec);
    resetT = Math.min(1, resetT + dt / duration);

    // Smoothstep for nicer feel
    const t = resetT * resetT * (3 - 2 * resetT);

    // Lerp target
    target.lerpVectors(startTarget, endTarget, t);

    // Slerp-ish for spherical angles: linear in angles usually feels fine for small deltas
    spherical.radius = THREE.MathUtils.lerp(startSph.radius, endSph.radius, t);
    spherical.phi    = THREE.MathUtils.lerp(startSph.phi,    endSph.phi,    t);
    spherical.theta  = THREE.MathUtils.lerp(startSph.theta,  endSph.theta,  t);

    applyToCamera();
    if (resetT >= 1) resetting = false;
  }

  // Pointer handlers ---------------------------------------------------

  function onPointerDown(e) {
    if (!enabled || e.button !== 0) return;      // left button only for orbit
    ptrActive = true;
    dragging = false;
    suppressNextClick = false;
    startX = lastX = e.clientX;
    startY = lastY = e.clientY;

    // Re-sync spherical with current camera before manipulation
    syncFromCamera();

    // Capture so we keep getting moves even outside canvas
    try { domElement.setPointerCapture(e.pointerId); } catch {}
    domElement.style.cursor = 'grabbing';

    // Prevent global handlers (e.g., your click-to-toggle)
    e.preventDefault();
    e.stopPropagation();
  }

  function onPointerMove(e) {
    if (!enabled || !ptrActive) return;

    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;

    lastX = e.clientX;
    lastY = e.clientY;

    // Check drag threshold against total distance from start
    const totalDx = e.clientX - startX;
    const totalDy = e.clientY - startY;
    if (!dragging && (totalDx * totalDx + totalDy * totalDy) >= (dragThresholdPx * dragThresholdPx)) {
      dragging = true;
      suppressNextClick = true; // prevent global click on release
    }

    if (dragging) {
      // Rotate
      spherical.theta -= dx * rotateSpeed; // horizontal drag => azimuth
      spherical.phi   -= dy * rotateSpeed; // vertical drag   => polar
      console.log('theta:', spherical.theta.toFixed(2), 'phi:', spherical.phi.toFixed(2));
      applyToCamera();
    }

    e.preventDefault();
    e.stopPropagation();
  }

  function onPointerUp(e) {
    if (!enabled || !ptrActive) return;
    ptrActive = false;

    try { domElement.releasePointerCapture(e.pointerId); } catch {}
    domElement.style.cursor = enabled ? 'grab' : 'auto';

    // If it was a click (no significant drag), reset to default
    const totalDx = e.clientX - startX;
    const totalDy = e.clientY - startY;
    const wasClick = (totalDx * totalDx + totalDy * totalDy) < (dragThresholdPx * dragThresholdPx);

    if (wasClick) {
      beginResetAnimation();
    }

    e.preventDefault();
    e.stopPropagation();
  }

  // Suppress the actual "click" event when we've dragged,
  // so your app's global click handler (toggle) won't fire.
  function onClick(e) {
    if (!enabled) return;
    if (suppressNextClick) {
      e.preventDefault();
      e.stopImmediatePropagation?.();
      e.stopPropagation();
      suppressNextClick = false; // consume once
    }
  }

  // Public API ---------------------------------------------------------

  function setEnabled(v) {
    enabled = !!v;
    domElement.style.cursor = enabled ? 'grab' : 'auto';
    // If enabling now, sync spherical to current camera so the first drag is smooth
    if (enabled) {
      syncFromCamera();
    }
  }

  function update(dt = 0) {
    if (!enabled) return;
    // If target moves (e.g., following the saber) and you're NOT dragging,
    // keep the camera aimed at the moving target without changing angles.
    if (!ptrActive && typeof getTarget === 'function') {
      const prev = target.clone();
      readTarget();
      if (!prev.equals(target)) {
        // Keep angular orientation but follow new target
        offset.setFromSpherical(spherical);
        camera.position.copy(target).add(offset);
        camera.lookAt(target);
      }
    }
    // Handle reset animation if active
    if (resetting) stepResetAnimation(dt);
  }

  function setDefault({ target: tgt, spherical: sph } = {}) {
    if (tgt?.isVector3) _default.target.copy(tgt);
    if (sph && Number.isFinite(sph.radius)) _default.spherical.radius = sph.radius;
    if (sph && Number.isFinite(sph.phi))    _default.spherical.phi    = sph.phi;
    if (sph && Number.isFinite(sph.theta))  _default.spherical.theta  = sph.theta;
  }

  function dispose() {
    domElement.removeEventListener('pointerdown', onPointerDown);
    domElement.removeEventListener('pointermove', onPointerMove);
    domElement.removeEventListener('pointerup',   onPointerUp);
    domElement.removeEventListener('pointercancel', onPointerUp);
    domElement.removeEventListener('click', onClick, true);
  }

  // Wire listeners
    domElement.addEventListener('pointerdown', onPointerDown, { passive: false });
    domElement.addEventListener('pointermove', onPointerMove, { passive: false });
    domElement.addEventListener('pointerup',   onPointerUp,   { passive: false });
    domElement.addEventListener('pointercancel', onPointerUp, { passive: true  });

    // NEW: eat mousedown at capture phase when enabled so document's handler won't toggle
    function stopMouseDown(e) {
    if (!enabled) return;
    // If our orbit is active, prevent the global toggle from seeing this click
    e.preventDefault();
    e.stopImmediatePropagation();
    }
    domElement.addEventListener('mousedown', stopMouseDown, true);  // capture phase

    return { setEnabled, update, dispose, setDefault };
}
