import * as THREE from 'three';
import { Lightsaber } from './components/Lightsaber.js';

export class MainScene {
  constructor() {
    // レンダラー設定
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    document.body.appendChild(this.renderer.domElement);

    // シーン設定
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x111111);

    // カメラ設定
    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    this.camera.position.set(0, 2, 8);

    // ライト設定
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 5, 5);
    this.scene.add(dirLight);

    // ライトセーバーの生成
    this.lightsaber = new Lightsaber(this.scene);

    // リサイズイベント
    window.addEventListener('resize', this.onResize.bind(this));
  }

  // App.js から呼ばれる描画メソッド
  render() {
    this.renderer.render(this.scene, this.camera);
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}