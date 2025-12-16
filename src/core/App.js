import { MainScene } from '../scenes/MainScene.js';
import { PhysicsWorld } from '../physics/PhysicsWorld.js';
import { UIManager } from '../ui/UIManager.js';

export class App {
  constructor() {
    // 1. 各システムを初期化
    this.sceneSystem = new MainScene();
    this.physicsSystem = new PhysicsWorld();
    
    // UIには操作対象を渡す
    this.uiSystem = new UIManager(this.sceneSystem, this.physicsSystem);

    // ループ開始
    this.animate();
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));

    // A. 物理計算を実行 (Physics)
    this.physicsSystem.update();
    const physicsData = this.physicsSystem.getSaberState();

    // B. 計算結果を見た目に反映 (Physics -> Scene)
    const saber = this.sceneSystem.lightsaber;
    saber.setRotation(physicsData.rotationX, physicsData.rotationZ);
    saber.setSpeed(physicsData.swingSpeed);

    // C. 描画 (Scene)
    this.sceneSystem.render();
  }
}