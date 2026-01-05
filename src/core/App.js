import { MainScene } from '../scenes/MainScene.js';
import { PhysicsWorld } from '../physics/PhysicsWorld.js';
import { UIManager } from '../ui/UIManager.js';
import Stats from "stats.js";
import * as THREE from 'three';

export class App {
  constructor() {
    this.clock = new THREE.Clock();
    this.stats = new Stats();
    this.stats.showPanel(0); // 0: FPS, 1: ms, 2: mb
    document.body.appendChild(this.stats.dom);

    this.sceneSystem = new MainScene();
    this.physicsSystem = new PhysicsWorld();

    // this.physicsSystem.onClick = () => {
    //   this.sceneSystem.lightsaber.toggle();
    // };
    
    this.uiSystem = new UIManager(this.sceneSystem, this.physicsSystem);

    // roop start
    this.animate();
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));
    const dt = this.clock.getDelta();

    this.stats.begin();

    // A. 物理計算を実行 (Physics)
    // calc some physical data like pos, angle, speed etc...
    // decide how the objects will behave, move or illuminate based on input like mouse
    this.physicsSystem.update();
    const physicsData = this.physicsSystem.getSaberState();

    // B. 計算結果を見た目に反映 (Physics -> Scene)
    // calc how objects look and render based on the data we get from physics System
    const saber = this.sceneSystem.lightsaber;
    saber.setRotation(physicsData.rotX, physicsData.rotZ);
    saber.setPosition(physicsData.posX, physicsData.posY, physicsData.posZ);
    saber.setSpeed(physicsData.swingSpeed);
    saber.update(dt);
    const stars = this.sceneSystem.stars;
    stars.update();

    // C. インジケーター更新 (UI)
    this.uiSystem.updateStatus(physicsData);


    this.sceneSystem.render();

    this.stats.end();
  }
}
