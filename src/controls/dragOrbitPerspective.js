import * as THREE from 'three';

export function createDragOrbitPerspective({
    camera,
    domElement,
    getTargetWorld = null,
    rotateSpeed = 0.0025,
    minPolarAngle = 0.1,
    maxPolarAngle = Math.PI - 0.1,
    dragThresholdPx = 4,
    minRadius = 0.1,
    resetAnimSec = 0.25,
    defaultTargetWorld = null,
    defaultSpherical = null,
    enabled: enabledInit = true,
} = {}) {
    if (!camera || !domElement || !camera.isPerspectiveCamera) {
        console.warn('[dragOrbitPerspective] invalid camera/domElement or not PerspectiveCamera');
        return { setEnabled() { }, update() { }, dispose() { }, setDefault() { } };
    }

    let enabled = !!enabledInit;

    let ptrActive = false, dragging = false, suppressNextClick = false;
    let startX = 0, startY = 0, lastX = 0, lastY = 0;

    const targetW = new THREE.Vector3();
    const camW = new THREE.Vector3();
    const offsetW = new THREE.Vector3();

    const spherical = new THREE.Spherical();
    let lastGoodRadius = 3;

    let resetting = false, resetT = 0;
    const startSph = new THREE.Spherical();
    const endSph = new THREE.Spherical();
    const startTW = new THREE.Vector3();
    const endTW = new THREE.Vector3();

    const keyPan = { left: false, right: false, up: false, down: false };

    const basePanUnitsPerSec = 1.5;
    const panScaleWithRadius = 0.35;

    const _default = {
        targetW: (defaultTargetWorld?.isVector3) ? defaultTargetWorld.clone() : new THREE.Vector3(0, 0, 0),
        spherical: {
            radius: defaultSpherical?.radius ?? 3,
            phi: defaultSpherical?.phi ?? Math.PI / 2,
            theta: defaultSpherical?.theta ?? 0
        }
    };

    const _tmpDir = new THREE.Vector3();
    const _tmpRight = new THREE.Vector3();
    const _tmpUp = new THREE.Vector3();
    const _disp = new THREE.Vector3();

    function panCameraWorld(dx, dy) {
        updateWorldMatrices();

        camera.getWorldDirection(_tmpDir).normalize();
        _tmpRight.crossVectors(_tmpDir, camera.up).normalize();
        _tmpUp.copy(camera.up).normalize();

        _disp.set(0, 0, 0)
            .addScaledVector(_tmpRight, dx) // +x = right
            .addScaledVector(_tmpUp, dy); // +y = up

        targetW.add(_disp);
        camera.getWorldPosition(camW).add(_disp);

        assignLocalFromWorld(camW);

        offsetW.copy(camW).sub(targetW);
        spherical.setFromVector3(offsetW).makeSafe();
        lastGoodRadius = spherical.radius;
    }

    function getWorldTarget() {
        if (typeof getTargetWorld === 'function') {
            targetW.copy(getTargetWorld() || new THREE.Vector3(0, 0, 0));
        } else {
            targetW.set(0, 0, 0);
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
        endSph.phi = THREE.MathUtils.clamp(_default.spherical.phi, minPolarAngle, maxPolarAngle);
        endSph.theta = _default.spherical.theta;
    }

    function stepResetAnimation(dt) {
        if (!resetting) return;
        const dur = Math.max(0.001, resetAnimSec);
        resetT = Math.min(1, resetT + dt / dur);
        const t = resetT * resetT * (3 - 2 * resetT); // smoothstep

        targetW.lerpVectors(startTW, endTW, t);
        spherical.radius = THREE.MathUtils.lerp(startSph.radius, endSph.radius, t);
        spherical.phi = THREE.MathUtils.lerp(startSph.phi, endSph.phi, t);
        spherical.theta = THREE.MathUtils.lerp(startSph.theta, endSph.theta, t);

        applyToCamera();
        if (resetT >= 1) resetting = false;
    }

    function onPointerDown(e) {
        if (!enabled || e.button !== 0) return;
        ptrActive = true; dragging = false; suppressNextClick = false;
        startX = lastX = e.clientX; startY = lastY = e.clientY;

        syncFromCamera();
        try { domElement.setPointerCapture(e.pointerId); } catch { }
        domElement.style.cursor = 'grabbing';
        e.preventDefault(); e.stopPropagation();
    }

    function onPointerMove(e) {
        if (!enabled || !ptrActive) return;

        const dx = e.clientX - lastX, dy = e.clientY - lastY;
        lastX = e.clientX; lastY = e.clientY;

        const tdx = e.clientX - startX, tdy = e.clientY - startY;
        if (!dragging && (tdx * tdx + tdy * tdy) >= dragThresholdPx * dragThresholdPx) {
            dragging = true; suppressNextClick = true;
        }

        if (dragging) {
            spherical.theta -= dx * rotateSpeed; // azimuth
            spherical.phi -= dy * rotateSpeed; // polar
            getWorldTarget(); // pivot may be dynamic
            applyToCamera();
        }

        e.preventDefault(); e.stopPropagation();
    }

    function onPointerUp(e) {
        if (!enabled || !ptrActive) return;
        ptrActive = false;
        try { domElement.releasePointerCapture(e.pointerId); } catch { }
        domElement.style.cursor = enabled ? 'grab' : 'auto';

        const tdx = e.clientX - startX, tdy = e.clientY - startY;
        const wasClick = (tdx * tdx + tdy * tdy) < dragThresholdPx * dragThresholdPx;
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

    function onKeyDown(e) {
        if (!enabled) return;

        if (e.target && e.target.closest && e.target.closest('#ui-panel')) return;

        switch (e.code) {
            case 'ArrowLeft': keyPan.left = true; e.preventDefault(); break;
            case 'ArrowRight': keyPan.right = true; e.preventDefault(); break;
            case 'ArrowUp': keyPan.up = true; e.preventDefault(); break;
            case 'ArrowDown': keyPan.down = true; e.preventDefault(); break;
            default: break;
        }
    }

    function onKeyUp(e) {
        switch (e.code) {
            case 'ArrowLeft': keyPan.left = false; break;
            case 'ArrowRight': keyPan.right = false; break;
            case 'ArrowUp': keyPan.up = false; break;
            case 'ArrowDown': keyPan.down = false; break;
            default: break;
        }
    }

    function setEnabled(v) {
        enabled = !!v;
        domElement.style.cursor = enabled ? 'grab' : 'auto';
        if (enabled) { syncFromCamera(); }
    }

    function update(dt = 0) {
        if (!enabled) return;

        if (keyPan.left || keyPan.right || keyPan.up || keyPan.down) {
            const dist = Math.max(spherical.radius, 0.0001);
            const unitsPerSec = basePanUnitsPerSec + panScaleWithRadius * dist;

            const dx = ((keyPan.right ? 1 : 0) - (keyPan.left ? 1 : 0)) * unitsPerSec * dt;
            const dy = ((keyPan.up ? 1 : 0) - (keyPan.down ? 1 : 0)) * unitsPerSec * dt;

            if (dx !== 0 || dy !== 0) {
                getWorldTarget();
                panCameraWorld(dx, dy);
            }
        }

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
        if (sph?.phi !== undefined) _default.spherical.phi = sph.phi;
        if (sph?.theta !== undefined) _default.spherical.theta = sph.theta;
    }

    function dispose() {
        domElement.removeEventListener('pointerdown', onPointerDown);
        domElement.removeEventListener('pointermove', onPointerMove);
        domElement.removeEventListener('pointerup', onPointerUp);
        domElement.removeEventListener('pointercancel', onPointerUp);
        domElement.removeEventListener('mousedown', onMouseDownCapture, true);
        domElement.removeEventListener('click', onClickCapture, true);
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
    }

    domElement.addEventListener('pointerdown', onPointerDown, { passive: false });
    domElement.addEventListener('pointermove', onPointerMove, { passive: false });
    domElement.addEventListener('pointerup', onPointerUp, { passive: false });
    domElement.addEventListener('pointercancel', onPointerUp, { passive: true });
    domElement.addEventListener('mousedown', onMouseDownCapture, true);
    domElement.addEventListener('click', onClickCapture, true);

    window.addEventListener('keydown', onKeyDown, { passive: false });
    window.addEventListener('keyup', onKeyUp, { passive: true });


    if (!defaultTargetWorld || !defaultSpherical) {
        updateWorldMatrices(); getWorldTarget(); camera.getWorldPosition(camW);
        offsetW.copy(camW).sub(targetW);
        const sph = new THREE.Spherical().setFromVector3(offsetW).makeSafe();
        _default.targetW.copy(targetW);
        _default.spherical.radius = sph.radius || 3;
        _default.spherical.phi = sph.phi;
        _default.spherical.theta = sph.theta;
    }

    domElement.style.cursor = enabled ? 'grab' : 'auto';
    if (enabled) { syncFromCamera(); }

    return { setEnabled, update, dispose, setDefault };
}