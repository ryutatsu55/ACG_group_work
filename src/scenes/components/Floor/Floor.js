import * as THREE from 'three';
import vertexShader from './floor.vert';
import fragmentShader from './floor.frag';

export class Floor {
    constructor(scene) {
        // 管理用のコンテナを作る（あとで床ごと動かしたくなった時に便利）
        this.container = new THREE.Group();
        scene.add(this.container);

        this.init();
    }

    init() {
        // 1. 床のジオメトリ
        const geometry = new THREE.PlaneGeometry(200, 200);

        // 2. 床専用シェーダ (JS内に直接書いてしまいます)
        const material = new THREE.ShaderMaterial({
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            transparent: false,
            side: THREE.FrontSide,
            depthWrite: true,
            uniforms: {
                uColor: { value: new THREE.Color('#d8d8d8') },
            },
            glslVersion: THREE.GLSL3
        });

        const floor = new THREE.Mesh(geometry, material);
        floor.rotation.x = -Math.PI / 2; // 寝かせる
        floor.position.y = -4.0;         // 位置調整
        
        this.container.add(floor);
    }
}