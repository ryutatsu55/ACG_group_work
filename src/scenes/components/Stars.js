import * as THREE from 'three';

export class Stars {
    constructor(scene) {
        this.container = new THREE.Group();
        scene.add(this.container);

        this.init();
    }

    init() {
        const starCount = 2000;
        const positions = new Float32Array(starCount * 3);
        const minRadius = 15.0;
        const maxRadius = 150.0;
        
        for(let i = 0; i < starCount; i++) {
            const r = minRadius + Math.random() * (maxRadius - minRadius);

            const theta = 2 * Math.PI * Math.random();
            const phi = Math.acos(Math.random()); 

            const x = r * Math.sin(phi) * Math.cos(theta);
            const y = r * Math.cos(phi);
            const z = r * Math.sin(phi) * Math.sin(theta);
            
            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;
        }
    
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const material = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.15,
            sizeAttenuation: true,
            transparent: true,
            opacity: 0.8
        });
        
        this.stars = new THREE.Points(geometry, material);
        this.container.add(this.stars);
    }

    update() {
        this.container.rotation.y += 0.0002;
    }
}