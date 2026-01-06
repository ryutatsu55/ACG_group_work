import * as THREE from 'three';
import { SoundController } from './SoundEffect.js';

// Blade shaders (volumetric light bar)
import bladeVertexShader from './blade.vert';
import bladeFragmentShader from './blade.frag';

// Handle shaders (metallic PBR)
import handleVertexShader from './handle.vert';
import handleFragmentShader from './handle.frag';

export class Lightsaber {
  constructor(scene, camera) {
    this.container = new THREE.Group();
    scene.add(this.container);

    this.camera = camera;
    this.isOn = null;
    this.currentScale = 0.0;

    // Blade uniforms (volumetric rendering)
    this.bladeUniforms = {
      uColor: { value: new THREE.Color('#00ff00') },
      uSwingSpeed: { value: 0.0 },
      uMode: { value: 1.0 },
      uTime: { value: 0.0 },
      uCameraPosLocal: { value: new THREE.Vector3() },
      uCoreIntensity: { value: 1.0 },
      uScatterDensity: { value: 1.0 }
    };

    // Handle uniforms (PBR metallic)
    this.handleUniforms = {
      // Material properties
      uBaseColor: { value: new THREE.Color('#666666') },
      uMetalness: { value: 0.9 },
      uRoughness: { value: 0.3 },
      // Blade light properties
      uBladeColor: { value: new THREE.Color('#00ff00') },
      uBladeIntensity: { value: 0.0 },
      uBladeTipWorld: { value: new THREE.Vector3(0, 4, 0) },
      uBladeBaseWorld: { value: new THREE.Vector3(0, 0, 0) },
      // Scene lighting
      uAmbientColor: { value: new THREE.Color('#ffffff') },
      uAmbientIntensity: { value: 0.15 }
    };

    // Legacy uniform reference (for backward compatibility with UI)
    this.uniforms = this.bladeUniforms;

    this.soundController = null;

    this._createHandle();
    this._createBlade();
  }

  // ============================================
  // Handle Creation (Metallic PBR)
  // ============================================
  _createHandle() {
    const handleGeo = new THREE.CylinderGeometry(0.1, 0.1, 1.0, 32);

    const handleMat = new THREE.ShaderMaterial({
      vertexShader: handleVertexShader,
      fragmentShader: handleFragmentShader,
      uniforms: this.handleUniforms,
      glslVersion: THREE.GLSL3,
      side: THREE.FrontSide
    });

    this.handle = new THREE.Mesh(handleGeo, handleMat);
    this.handle.position.y = -0.5;
    this.container.add(this.handle);

    // Initialize sound controller attached to handle
    this.soundController = new SoundController(this.camera, this.handle);
  }

  // ============================================
  // Blade Creation (Volumetric Light Bar)
  // ============================================
  _createBlade() {
    // Hollow cylinder for volumetric ray marching
    const bladeGeo = new THREE.CylinderGeometry(0.12, 0.12, 4.0, 32, 5, true);
    bladeGeo.translate(0, 2.0, 0);

    const bladeMat = new THREE.ShaderMaterial({
      vertexShader: bladeVertexShader,
      fragmentShader: bladeFragmentShader,
      uniforms: this.bladeUniforms,
      glslVersion: THREE.GLSL3,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.NormalBlending,
      depthWrite: false
    });

    this.blade = new THREE.Mesh(bladeGeo, bladeMat);
    this.container.add(this.blade);
    this.blade.scale.y = 0.0;
    this.blade.visible = false;
    this.bladeMat = bladeMat;
  }

  // ============================================
  // Public API (Backward Compatible)
  // ============================================

  setSoundEnable(bool) {
    if (this.soundController) {
      this.soundController.setEnable(bool);
    }
  }

  setColor(hex) {
    // Update blade color
    this.bladeUniforms.uColor.value.set(hex);
    // Sync handle's blade light color
    this.handleUniforms.uBladeColor.value.set(hex);
  }

  setSpeed(speed) {
    this.bladeUniforms.uSwingSpeed.value = speed;
  }

  setRotation(x, z) {
    this.container.rotation.x = x;
    this.container.rotation.z = z;
  }

  setPosition(x, y, z) {
    if (isNaN(x) || isNaN(y) || isNaN(z)) {
      return;
    }
    const xOffset = 0.0;
    const yOffset = 0.0;
    const zOffset = 2.0;

    this.container.position.x = x + xOffset;
    this.container.position.y = y + yOffset;
    this.container.position.z = z + zOffset;
  }

  setMode(mode) {
    this.bladeUniforms.uMode.value = mode;
  }

  // ============================================
  // Handle Material Controls
  // ============================================

  setMetalness(value) {
    this.handleUniforms.uMetalness.value = value;
  }

  setRoughness(value) {
    this.handleUniforms.uRoughness.value = value;
  }

  setHandleColor(hex) {
    this.handleUniforms.uBaseColor.value.set(hex);
  }

  // ============================================
  // Toggle and Animation
  // ============================================

  toggle(value) {
    this.isOn = value;
    this.soundController.toggle(value);
  }

  update(dt) {
    this.bladeUniforms.uTime.value += dt;

    // Blade scale animation
    const targetScale = this.isOn ? 1.0 : 0.0;
    const targetVelocity = this.isOn ? 1.0 : -1.0;

    if (Math.abs(this.currentScale - targetScale) > 0.05) {
      this.currentScale += 0.08 * targetVelocity;
    }

    this.blade.scale.y = this.currentScale;

    // Visibility optimization
    if (this.currentScale < 0.01) {
      this.blade.visible = false;
    } else {
      this.blade.visible = true;
    }

    // Update camera position in local space for blade shader
    this.bladeUniforms.uCameraPosLocal.value.copy(this.camera.position);
    this.container.updateMatrixWorld();
    const inverseMatrix = this.container.matrixWorld.clone().invert();
    this.bladeUniforms.uCameraPosLocal.value.applyMatrix4(inverseMatrix);

    // ============================================
    // Sync Blade Light to Handle
    // ============================================

    // Update blade intensity based on visibility
    this.handleUniforms.uBladeIntensity.value = this.currentScale;

    // Calculate blade tip and base in world space for handle lighting
    const bladeBase = new THREE.Vector3(0, 0, 0);
    const bladeTip = new THREE.Vector3(0, 4.0 * this.currentScale, 0);

    // Transform to world space
    bladeBase.applyMatrix4(this.container.matrixWorld);
    bladeTip.applyMatrix4(this.container.matrixWorld);

    this.handleUniforms.uBladeBaseWorld.value.copy(bladeBase);
    this.handleUniforms.uBladeTipWorld.value.copy(bladeTip);

    // Sound update
    const speed = this.bladeUniforms.uSwingSpeed.value;
    this.soundController.update(speed);
  }
}
