import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { Lightsaber } from './components/LightSaber/Lightsaber.js';
import { Floor } from './components/Floor/Floor.js';
import { Stars } from './components/Stars/Stars.js';

export class MainScene {
    constructor() {
        // configure renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        document.body.appendChild(this.renderer.domElement);

        // define scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color('#000000');
        this.scene.fog = new THREE.Fog('#000000', 10, 50);

        // define camera
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
        this.camera.position.set(0, 2, 6);
        this.camera.lookAt(0, 1, 0);

        // define light
        const dirLight = new THREE.DirectionalLight('#ffffff', 1);
        dirLight.position.set(5, 5, 5);
        this.scene.add(dirLight);

        // define light_saber
        this.lightsaber = new Lightsaber(this.scene, this.camera);
        this.floor = new Floor(this.scene);
        this.stars = new Stars(this.scene);

        // Setup post-processing with bloom
        this._setupPostProcessing();

        // resister a function to event listener('resize')
        window.addEventListener('resize', this.onResize.bind(this));
    }

    _setupPostProcessing() {
        const renderScene = new RenderPass(this.scene, this.camera);

        // UnrealBloomPass parameters: resolution, strength, radius, threshold
        this.bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            1.5,    // strength - intensity of bloom
            0.4,    // radius - spread of bloom
            0.1     // threshold - brightness cutoff for bloom
        );

        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(renderScene);
        this.composer.addPass(this.bloomPass);
    }

    // called from App.js
    render() {
        this.composer.render();
    }
    // called from window(eventlistener)
    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setSize(window.innerWidth, window.innerHeight);
    }
}
