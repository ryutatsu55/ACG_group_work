import * as THREE from 'three';

import vertexShader from '../shaders/saber.vert';
import fragmentShader from '../shaders/saber.frag';

export class Lightsaber {
  constructor(scene, camera) {
    this.container = new THREE.Group();
    scene.add(this.container);

    // Uniforms (シェーダに渡す変数)
    this.uniforms = {
      uColor: { value: new THREE.Color('#00ff00') },
      uSwingSpeed: { value: 0.0 },
      uMode: { value: 1.0 },
      uTime: { value: 0.0 },
      uCameraPosLocal: { value: new THREE.Vector3() }
    };

    this.isOn = true;       // スイッチの状態 (true: ON, false: OFF)
    this.currentScale = 0.0; // 現在の長さ (0.0 ~ 1.0)
    this.camera = camera;

    this.init();
  }

  init() {
    // 1. 持ち手 (Handle)
    const handleGeo = new THREE.CylinderGeometry(0.1, 0.1, 1.0, 16);
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.2 });
    this.handle = new THREE.Mesh(handleGeo, handleMat);
    this.handle.position.y = -0.5;
    this.container.add(this.handle);             

    // 2. 刃 (Blade) - ShaderMaterialを使用
    // const bladeGeo = new THREE.CylinderGeometry(0.1, 0.1, 4.0, 16);
    const bladeGeo = new THREE.CylinderGeometry(0.12, 0.12, 4.0, 32, 5, true);
    bladeGeo.translate(0, 2.0, 0); // 重心を調整

    this.bladeMat = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      uniforms: this.uniforms,
      
      // ★★★ これを追加！ ★★★
      glslVersion: THREE.GLSL3, 
      
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.NormalBlending,
      depthWrite: false
    });

    this.blade = new THREE.Mesh(bladeGeo, this.bladeMat);
    // this.blade.position.y = 2.0;
    this.container.add(this.blade);
    this.blade.scale.y = 0.0;
    this.blade.visible = false;

  }

  // ■ 外部から呼ばれる更新メソッド
  toggle(value) {
    this.isOn = value;
    
    // オマケ：音を鳴らすならここで triggerSound() とか呼ぶ

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

    // 反映
    this.blade.scale.y = this.currentScale;

    // 最適化：ほぼゼロなら非表示にする (描画負荷を下げるため)
    if (this.currentScale < 0.01) {
      this.blade.visible = false;
    } else {
      this.blade.visible = true;
    }

    this.uniforms.uCameraPosLocal.value.copy(this.camera.position);
    this.container.updateMatrixWorld(); // 最新の行列を確定
    const inverseMatrix = this.container.matrixWorld.clone().invert();
    this.uniforms.uCameraPosLocal.value.applyMatrix4(inverseMatrix);
  }

  // 色を変える (UI担当からの入力)
  setColor(hex) {
    this.uniforms.uColor.value.set(hex);
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
}
