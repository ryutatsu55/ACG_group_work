import * as THREE from 'three';
import { SoundController } from './SoundEffect.js';

// Handle shaders (metallic PBR)
import handleVertexShader from './handle.vert';
import handleFragmentShader from './handle.frag';

import vertexShader from './saber.vert';
import fragmentShader from './saber.frag';

export class Lightsaber {
  constructor(scene, camera, listener) {
    this.container = new THREE.Group();
    scene.add(this.container);
    
    this.camera = camera;
    this.listener = listener;

    this.algorithm = "A";

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

    // Legacy uniform reference (for Shader Blade A)
    this.bladeUniforms = {
      uColor: { value: this.bladeColor },
      uSwingSpeed: { value: 0.0 },
      uMode: { value: 1.0 },
      uTime: { value: 0.0 },
      uCameraPosLocal: { value: new THREE.Vector3() }
    };
    // Algorithm A が参照する uniforms
    this.uniforms = this.bladeUniforms;

    this.isOn = null;       // スイッチの状態 (true: ON, false: OFF)
    this.currentScale = 0.0; // 現在の長さ (0.0 ~ 1.0)

    this.soundController = null;

    this.init();
  }

  init() {
    // // 1. 持ち手 (Handle)
    // const handleGeo = new THREE.CylinderGeometry(0.1, 0.1, 1.0, 16);
    // const handleMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.2 });
    // this.handle = new THREE.Mesh(handleGeo, handleMat);
    // this.handle.position.y = -0.5;
    // this.container.add(this.handle);

    // this.soundController = new SoundController(this.listener, this.handle);

    this._createHandle();
    this._createBladeA();
    this._createBladeB();
    this.setAlgorithm(this.algorithm);
  }

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
    this.soundController = new SoundController(this.listener, this.handle);
  }

  _createBladeA(){
    // 2. 刃 (Blade) - ShaderMaterialを使用
    // const bladeGeo = new THREE.CylinderGeometry(0.1, 0.1, 4.0, 16);
    const bladeGeo = new THREE.CylinderGeometry(0.12, 0.12, 4.0, 32, 5, true);
    bladeGeo.translate(0, 2.0, 0); // 重心を調整

    this.bladeMat = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      uniforms: this.bladeUniforms,
      glslVersion: THREE.GLSL3, 
      
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.NormalBlending,
      depthWrite: true
    });

    this.bladeA = new THREE.Mesh(bladeGeo, this.bladeMat);
    this.container.add(this.bladeA);
    this.bladeA.visible = false;

  }

  _createBladeB(){
    const bladeHeight = 4.0;
    const bladeRadius = 0.08; // 0.12ではなく0.08

    // Capsule geometry
    const bladeGeo = new THREE.CapsuleGeometry(bladeRadius, bladeHeight, 4, 16);
    bladeGeo.translate(0, bladeHeight / 2, 0);

    // MeshStandardMaterial
    this.bladeMatB = new THREE.MeshStandardMaterial({
      color: 0xffffff,           // White base
      emissive: this.bladeColor, // Colored glow
      emissiveIntensity: 5.0,  
      transparent: false,
      roughness: 0.3,
      metalness: 0.0
    });

    this.bladeB = new THREE.Mesh(bladeGeo, this.bladeMatB);
    this.container.add(this.bladeB);
    this.bladeB.visible = false;

    // PointLight attached to blade
    this.bladeLightB = new THREE.PointLight(
      this.bladeColor,
      150,    // intensity
      50,     // distance
      2       // decay
    );
    this.bladeLightB.position.y = bladeHeight / 2;
    this.bladeB.add(this.bladeLightB);
  }

  setAlgorithm(type) {
    this.algorithm = type;
    
    this._updateVisibility();
    
    console.log(`Algorithm switched to: ${type}`);
  }

  _updateVisibility() {
    const isVisibleSize = this.currentScale > 0.01;

    if (this.bladeA) {
        this.bladeA.visible = (this.algorithm === "A" && isVisibleSize);
    }

    if (this.bladeB) {
        this.bladeB.visible = (this.algorithm === "B" && isVisibleSize);
        if (this.bladeLightB) {
            this.bladeLightB.visible = this.bladeB.visible;
        }
    }
  }

  setSoundEnable(bool) {
    if (this.soundController) {
      this.soundController.setEnable(bool);
    }
  }

  // 色を変える (UI担当からの入力)
  setColor(hex) {
    this.bladeColor.set(hex);
    this.uniforms.uColor.value.set(hex);

    if (this.bladeMatB) this.bladeMatB.emissive.set(hex);
    if (this.bladeLightB) this.bladeLightB.color.set(hex);

    this.handleUniforms.uBladeColor.value.set(hex);
  }

  // 速度を反映する (Physics担当からの入力)
  setSpeed(speed) {
    this.uniforms.uSwingSpeed.value = speed;
  }

  // 姿勢を反映する (Physics担当からの入力)
  setRotation(x, z) {
    this.container.rotation.x = x;
    this.container.rotation.z = z;
  }

  // 姿勢を反映する (Physics担当からの入力)
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

  setMode(mode){
    this.uniforms.uMode.value = mode;
  }

  // Handle Material Controls
  setMetalness(value) {
    this.handleUniforms.uMetalness.value = value;
  }
  setRoughness(value) {
    this.handleUniforms.uRoughness.value = value;
  }
  setHandleColor(hex) {
    this.handleUniforms.uBaseColor.value.set(hex);
  }

  // ■ 外部から呼ばれる更新メソッド
  toggle(value) {
    this.isOn = value;
    
    this.soundController.toggle(value);
  }
  
  // ■ 毎フレーム呼ばれるアニメーション更新
  update(dt) {
    this.uniforms.uTime.value += dt;
    // 目標値 (ONなら1.0、OFFなら0.0)
    const targetScale = this.isOn ? 1.0 : 0.0;
    const targetVelocity = this.isOn ? 1.0 : -1.0

    // 線形補間 (Lerp) で滑らかに変化させる
    // 「今の値」に「(目標 - 今) * 0.1」を足すと、ゆっくり近づく動きになる
    if(Math.abs(this.currentScale-targetScale) > 0.05){
      this.currentScale += 0.08 * targetVelocity;
    }
    // A (Shader)
    if (this.bladeA) {
      this.bladeA.scale.y = this.currentScale;
      // Shader用の行列計算など
      this.bladeUniforms.uCameraPosLocal.value.copy(this.camera.position);
      this.container.updateMatrixWorld();
      const inverseMatrix = this.container.matrixWorld.clone().invert();
      this.bladeUniforms.uCameraPosLocal.value.applyMatrix4(inverseMatrix);
    }

    // B (Standard)
    if (this.bladeB) {
      this.bladeB.scale.y = this.currentScale;
      // ライトの強さ連動
      if (this.bladeLightB) this.bladeLightB.intensity = 150 * this.currentScale;
      if (this.bladeMatB) this.bladeMatB.emissiveIntensity = 5.0 * this.currentScale;
    }
    this._updateVisibility();

    this.handleUniforms.uBladeIntensity.value = this.currentScale;

    // Calculate blade tip and base in world space for handle lighting
    const bladeBase = new THREE.Vector3(0, 0, 0);
    const bladeTip = new THREE.Vector3(0, 4.0 * this.currentScale, 0);

    this.container.updateMatrixWorld(); // 念のため更新
    bladeBase.applyMatrix4(this.container.matrixWorld);
    bladeTip.applyMatrix4(this.container.matrixWorld);

    this.handleUniforms.uBladeBaseWorld.value.copy(bladeBase);
    this.handleUniforms.uBladeTipWorld.value.copy(bladeTip);
    
    const speed = this.uniforms.uSwingSpeed.value;
    this.soundController.update(speed);
  }
}
