import * as THREE from 'three';

export class ProjectileManager {
    constructor(scene) {
        this.scene = scene;
        this.projectiles = []; // 現在画面にある弾のリスト

        // 弾の見た目設定 (赤い発光体)
        this.geometry = new THREE.SphereGeometry(0.2, 16, 16);
        this.material = new THREE.MeshStandardMaterial({
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 2.0,
            roughness: 0.4,
            metalness: 0.1
        });

        // 生成タイマー
        this.spawnTimer = 0;
        this.spawnInterval = 2.0; // 2秒ごとに発射
    }

    update(dt) {
        // 1. 新しい弾の生成 (Spawn)
        this.spawnTimer += dt;
        if (this.spawnTimer > this.spawnInterval) {
            this.spawnProjectile();
            this.spawnTimer = 0;
        }

        // 2. 弾の移動と削除 (Move & Cleanup)
        // 後ろからループするのは、削除したときにインデックスがずれないようにするため
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];

            // 手前（Z軸プラス方向）へ移動
            p.mesh.position.add(p.velocity.clone().multiplyScalar(dt));

            // 回転させて躍動感を出す
            p.mesh.rotation.x += dt * 2;
            p.mesh.rotation.y += dt * 2;

            // 画面外（カメラの後ろ）に行ったら削除
            if (p.mesh.position.z > 10) { 
                this.removeProjectile(i);
            }
        }
    }

    spawnProjectile() {
        const mesh = new THREE.Mesh(this.geometry, this.material);

        // 出現位置: 
        // X: -2 ~ 2 (左右ランダム)
        // Y: 1 ~ 3 (高さランダム)
        // Z: -20 (奥の方)
        const x = (Math.random() - 0.5) * 4;
        const y = 1.0 + Math.random() * 2.0;
        const z = -20;

        mesh.position.set(x, y, z);
        this.scene.add(mesh);

        // 弾のデータを作成
        const projectile = {
            mesh: mesh,
            velocity: new THREE.Vector3(0, 0, 15), // 手前に向かって進む速度
            active: true
        };

        this.projectiles.push(projectile);
    }

    removeProjectile(index) {
        const p = this.projectiles[index];
        
        // シーンから削除
        this.scene.remove(p.mesh);
        
        // 配列から削除
        this.projectiles.splice(index, 1);
    }
}