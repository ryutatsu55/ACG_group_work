import * as THREE from 'three';
import { Lightsaber } from './components/LightSaber/Lightsaber.js';
import { Floor } from './components/Floor/Floor.js';
import { Stars } from './components/Stars/Stars.js';

export class MainScene {
    constructor() {
        // configure renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        document.body.appendChild(this.renderer.domElement);

        // define scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color('#000000');
        this.scene.fog = new THREE.Fog('#000000', 10, 50);

        // define camera
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
        this.camera.position.set(0, 2, 6);
        this.camera.lookAt(0, 1, 0);

        this.listener = new THREE.AudioListener();
        this.camera.add(this.listener);

        this.bgm = new THREE.Audio(this.listener);
        const audioLoader = new THREE.AudioLoader();
        audioLoader.load('music/bgm.m4a', (buffer) => {
            this.bgm.setBuffer(buffer);
            this.bgm.setLoop(true);
            this.bgm.setVolume(0.1);
        });

        // define light
        const dirLight = new THREE.DirectionalLight('#ffffff', 1);
        dirLight.position.set(5, 5, 5);
        this.scene.add(dirLight);

        // define light_saber
        this.lightsaber = new Lightsaber(this.scene, this.camera, this.listener);
        this.floor = new Floor(this.scene);
        this.stars = new Stars(this.scene);

        // resister a function to event listener('resize')
        window.addEventListener('resize', this.onResize.bind(this));
    }

    // called from App.js
    render() {
        this.renderer.render(this.scene, this.camera);
    }
    // called from window(eventlistener)
    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    setMusicEnable(enabled) {
        if (!this.bgm || !this.bgm.buffer) return;
        
        if (enabled) {
            if (!this.bgm.isPlaying) this.bgm.play();
            this.bgm.setVolume(0.1);
        } else {
            this.bgm.setVolume(0.0);
        }
    }
}
