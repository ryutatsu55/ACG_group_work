import * as THREE from 'three';
import { SoundController } from './SoundEffect.js';

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

    // Blade color (used for emissive and light)
    this.bladeColor = new THREE.Color('#00ff00');

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

    // Legacy uniform reference (for backward compatibility)
    this.bladeUniforms = {
      uColor: { value: this.bladeColor },
      uSwingSpeed: { value: 0.0 },
      uMode: { value: 1.0 },
      uTime: { value: 0.0 }
    };
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
  // Blade Creation (Emissive Material + Light)
  // ============================================
  _createBlade() {
    const bladeHeight = 4.0;
    const bladeRadius = 0.08;

    // Capsule geometry for rounded ends
    const bladeGeo = new THREE.CapsuleGeometry(bladeRadius, bladeHeight, 4, 16);
    bladeGeo.translate(0, bladeHeight / 2, 0);

    // MeshStandardMaterial with strong emissive
    this.bladeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,           // White base
      emissive: this.bladeColor, // Colored glow
      emissiveIntensity: 5.0,    // Strong emission
      transparent: false,
      roughness: 0.3,
      metalness: 0.0
    });

    this.blade = new THREE.Mesh(bladeGeo, this.bladeMat);
    this.container.add(this.blade);
    this.blade.scale.y = 0.0;
    this.blade.visible = false;

    // PointLight attached to blade for environment lighting
    this.bladeLight = new THREE.PointLight(
      this.bladeColor,
      150,    // intensity
      50,     // distance
      2       // decay
    );
    this.bladeLight.position.y = bladeHeight / 2;
    this.blade.add(this.bladeLight);
  }

  // ============================================
  // Public API
  // ============================================

  setSoundEnable(bool) {
    if (this.soundController) {
      this.soundController.setEnable(bool);
    }
  }

  setColor(hex) {
    this.bladeColor.set(hex);
    // Update blade material emissive
    this.bladeMat.emissive.set(hex);
    // Update point light color
    this.bladeLight.color.set(hex);
    // Sync handle's blade light color
    this.handleUniforms.uBladeColor.value.set(hex);
    // Legacy uniform
    this.bladeUniforms.uColor.value.set(hex);
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

    // Update light intensity based on blade scale
    this.bladeLight.intensity = 150 * this.currentScale;

    // Update emissive intensity based on scale
    this.bladeMat.emissiveIntensity = 5.0 * this.currentScale;

    this.container.updateMatrixWorld();

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
