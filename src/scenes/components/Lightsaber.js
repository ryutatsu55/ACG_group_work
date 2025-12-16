import * as THREE from 'three';

import vertexShader from '../shaders/saber.vert';
import fragmentShader from '../shaders/saber.frag';

export class Lightsaber {
  constructor(scene) {
    this.container = new THREE.Group();
    scene.add(this.container);

    // Uniforms (シェーダに渡す変数)
    this.uniforms = {
      uColor: { value: new THREE.Color('#00ff00') },
      uSwingSpeed: { value: 0.0 }
    };

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
    const bladeGeo = new THREE.PlaneGeometry(0.4, 4.0); // 光る板として表現（または円柱でも可）
    bladeGeo.translate(0, 2.0, 0); // 重心を調整

    this.bladeMat = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      uniforms: this.uniforms,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending, // 加算合成で光らせる
      depthWrite: false
    });

    this.bladeMat = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      uniforms: this.uniforms,
      
      // ★★★ これを追加！ ★★★
      glslVersion: THREE.GLSL3, 
      
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.blade = new THREE.Mesh(bladeGeo, this.bladeMat);
    this.container.add(this.blade);
  }

  // ■ 外部から呼ばれる更新メソッド

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
}