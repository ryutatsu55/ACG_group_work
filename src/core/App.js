import { MainScene } from '../scenes/MainScene.js';
import { PhysicsWorld } from '../physics/PhysicsWorld.js';
import { UIManager } from '../ui/UIManager.js';
import '../style.css'
import Stats from "stats.js";
import * as THREE from 'three';
// import { Sound } from './Sound.js';
import { addScrollZoomPerspective } from '../controls/scrollZoomPerspective.js';
import { createDragOrbitPerspective } from '../controls/dragOrbitPerspective.js';

export class App {
  constructor() {
    this.clock = new THREE.Clock();
    this.stats = new Stats();
    this.stats.showPanel(0); // 0: FPS, 1: ms, 2: mb
    document.body.appendChild(this.stats.dom);

    this.sceneSystem = new MainScene();
    this.physicsSystem = new PhysicsWorld();

    const camera = this.sceneSystem.getCamera();
    const dom = this.sceneSystem.getDomElement();

    // Initialize scroll-to-zoom
    this.scrollZoom = addScrollZoomPerspective({
      camera,
      domElement: dom,
      minFov: 22,
      maxFov: 75,
      zoomSpeed: 1.0,
      smooth: 0.2,
    });

    // this.physicsSystem.onClick = () => {
    //   this.sceneSystem.lightsaber.toggle();
    // };

    this.uiSystem = new UIManager(this.sceneSystem, this.physicsSystem);

    this.dragOrbit = createDragOrbitPerspective({
      camera,
      domElement: dom,
      rotateSpeed: 0.0025,
      dragThresholdPx: 4,
      resetAnimSec: 0.25,

    });

    this.dragOrbit.setDefault({
      targetW: new THREE.Vector3(0, 0, 0),
      spherical: { radius: 3, phi: Math.PI / 2, theta: 0 }
    });

    if (this.uiSystem && typeof this.uiSystem.onTrackingPauseChanged === 'function') {
      this.uiSystem.onTrackingPauseChanged((paused) => {
        this.dragOrbit.setEnabled(paused);
      });
    }

    // loop start
    this.animate();
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));
    const dt = this.clock.getDelta();
    this.stats.begin();

    // physics -> scene updates...
    this.physicsSystem.update(dt);
    const physicsData = this.physicsSystem.getSaberState();
    const saber = this.sceneSystem.lightsaber;
    saber.setRotation(physicsData.rotX, physicsData.rotZ);
    saber.setPosition(physicsData.posX, physicsData.posY, physicsData.posZ);
    saber.setSpeed(physicsData.swingSpeed);
    saber.update(dt);

    this.sceneSystem.updateBloom();
    const floor = this.sceneSystem.floor;
    if (floor && floor.updateFromLightsaber) floor.updateFromLightsaber(saber);
    this.sceneSystem.stars.update();
    this.sceneSystem.projectileManager.update(dt, this.sceneSystem.lightsaber);

    this.uiSystem.updateStatus(physicsData);

    const cam = this.sceneSystem.getCamera();
    console.log('camera type:', cam && (cam.isPerspectiveCamera ? 'Perspective' : cam.isOrthographicCamera ? 'Orthographic' : typeof cam));
    console.log('initial fov:', cam.fov, 'zoom:', cam.zoom);

    if (this.scrollZoom) this.scrollZoom.update();

    if (this.dragOrbit) this.dragOrbit.update(dt);

    this.sceneSystem.render();
    this.stats.end();
  }
}
