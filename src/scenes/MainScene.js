import * as THREE from 'three';
import { Lightsaber } from './components/Lightsaber.js';

export class MainScene {
    constructor() {
        // configure renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        document.body.appendChild(this.renderer.domElement);

        // define scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color('#360606');

        // define camera
        this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100);
        this.camera.position.set(0, 2, 8);
        this.camera.lookAt(0, 0, 0);

        // define light
        const dirLight = new THREE.DirectionalLight('#ffffffff', 1);
        dirLight.position.set(5, 5, 5);
        dirLight.target.position.set(0, 2, 0);
        this.scene.add(dirLight);

        // define light_saber
        this.lightsaber = new Lightsaber(this.scene, this.camera);

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
}
