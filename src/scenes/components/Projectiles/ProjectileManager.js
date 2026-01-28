import * as THREE from 'three';

export class ProjectileManager {
    constructor(scene, onHitCallback) {
        this.scene = scene;
        this.onHitCallback = onHitCallback;
        this.projectiles = []; // 現在画面にある弾のリスト

        // 弾の見た目設定 (赤い発光体)
        this.geometry = new THREE.SphereGeometry(0.1, 16, 16);
        this.material = new THREE.MeshStandardMaterial({
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 5.0,
            roughness: 0.4,
            metalness: 0.1
        });

        // ■ 追加: 火花(パーティクル)用の配列
        this.particles = [];
        // 火花の見た目（小さな黄色い箱や球）
        this.particleGeo = new THREE.SphereGeometry(0.04, 4, 4);
        this.particleMat = new THREE.MeshBasicMaterial({
            color: 0xffaa00,
            transparent: true,
            opacity: 1.0,
            blending: THREE.AdditiveBlending, // 重なると明るくなる
            depthWrite: false // 半透明描画の前後関係バグ防止
        });

        // 計算用の一時オブジェクト
        this.tempLineSaber = new THREE.Line3();
        this.tempLineProjectile = new THREE.Line3();
        this.tempVec = new THREE.Vector3();
        this.tempNormal = new THREE.Vector3();

        // 生成タイマー
        this.spawnTimer = 0;
        this.spawnInterval = 0.5; // 2秒ごとに発射
    }

    update(dt, lightsaber) {
        // 1. 新しい弾の生成 (Spawn)
        this.spawnTimer += dt;
        if (this.spawnTimer > this.spawnInterval) {
            this.spawnProjectile();
            this.spawnTimer = 0;
        }

        const bladeData = lightsaber ? lightsaber.getBladeData() : null;

        // 2. 弾の移動と削除 (Move & Cleanup)
        // 後ろからループするのは、削除したときにインデックスがずれないようにするため
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];

            // 手前（Z軸プラス方向）へ移動
            p.mesh.position.add(p.velocity.clone().multiplyScalar(dt));
        
            const targetPos = p.mesh.position.clone().add(p.velocity);
            p.mesh.lookAt(targetPos);

            // ★ 当たり判定ロジック ★
            if (p.active && bladeData) {
                // セーバーの線分をセット
                this.tempLineSaber.start.copy(bladeData.start);
                this.tempLineSaber.end.copy(bladeData.end);

                const dir = p.velocity.clone().normalize();
                const halfLen = 0.4;

                // 弾の後端
                this.tempLineProjectile.start.copy(p.mesh.position).sub(dir.clone().multiplyScalar(halfLen));
                // 弾の先端
                this.tempLineProjectile.end.copy(p.mesh.position).add(dir.clone().multiplyScalar(halfLen));

                // ★ 数学関数で「線分同士の最短距離」を計算
                const distance = this.dist3D_Segment_to_Segment(
                    this.tempLineSaber, 
                    this.tempLineProjectile
                );
                
                // 衝突判定 (弾の半径0.2 + セーバー半径)
                if (distance < (0.2 + bladeData.radius)) {
                    // 当たった時の処理！
                    console.log("Hit!"); 
                    lightsaber.triggerImpact();
                    this.onHitCallback();

                    // 反射ベクトルの計算
                    // (衝突点として、弾の中心を使う簡易計算)
                    this.tempLineSaber.closestPointToPoint(p.mesh.position, true, this.tempVec);
                    this.tempNormal.subVectors(p.mesh.position, this.tempVec).normalize();
                    const vDotN = p.velocity.dot(this.tempNormal);
                    p.velocity.sub(this.tempNormal.multiplyScalar(2 * vDotN));
                    
                    // おまけ: 弾かれた後は少し加速し、ランダムに散らす
                    p.velocity.multiplyScalar(1.5); 
                    p.velocity.x += (Math.random() - 0.5) * 1;
                    p.velocity.y += (Math.random() - 0.5) * 1;

                    p.mesh.material = p.mesh.material.clone(); // マテリアルを複製して個別に変更
                    p.mesh.material.color.setHex(0x00ff00); // 緑色に変化
                    p.mesh.material.emissive.setHex(0x00ff00);

                    // 4. 重複ヒットを防ぐフラグ
                    p.active = false;
                    
                    // 5. 火花を散らす
                    // this.spawnExplosion(this.tempVec, p.velocity);
                }
            }

            // 画面外(遠く)へ行ったら削除 (手前だけでなく、奥に弾き返された場合も考慮して範囲を広げる)
            if (p.mesh.position.z > 10 || p.mesh.position.z < -30 || Math.abs(p.mesh.position.x) > 30) { 
                this.removeProjectile(i);
            }
        }
        this.updateParticles(dt);
    }
    
    updateParticles(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= dt;
            p.mesh.position.add(p.velocity.clone().multiplyScalar(dt));
            
            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                this.particles.splice(i, 1);
            }
        }
    }

    spawnExplosion(pos, incidentVelocity) {
        const count = 5; // 粒子の数
        for (let i = 0; i < count; i++) {
            // 色をランダムにする（白～黄色～オレンジ）
            const colorVar = Math.random();
            let col = new THREE.Color(0xffffff); // 白
            if (colorVar < 0.3) col.setHex(0xffaa00); // オレンジ
            else if (colorVar < 0.6) col.setHex(0xffff00); // 黄色

            const mat = this.particleMat.clone();
            mat.color.copy(col);
            
            const mesh = new THREE.Mesh(this.particleGeo, mat);
            mesh.position.copy(pos);

            // 速度: 弾かれた方向にある程度沿わせつつ、爆発させる
            // incidentVelocity（弾の速度）を少し反映させると慣性っぽくてリアル
            const baseVel = incidentVelocity.clone().normalize().multiplyScalar(5);
            const spread = new THREE.Vector3(
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 10
            );
            
            const velocity = baseVel.add(spread);

            this.scene.add(mesh);
            this.particles.push({
                mesh,
                velocity,
                life: 1.0, // 寿命
                maxLife: 1.0
            });
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

        mesh.scale.set(0.3, 0.3, 4.0);

        this.scene.add(mesh);

        // 弾のデータを作成
        const projectile = {
            mesh: mesh,
            velocity: new THREE.Vector3(0, 0, 20), // 手前に向かって進む速度
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

    dist3D_Segment_to_Segment(line1, line2) {
        const u = line1.end.clone().sub(line1.start);
        const v = line2.end.clone().sub(line2.start);
        const w = line1.start.clone().sub(line2.start);

        const a = u.dot(u);
        const b = u.dot(v);
        const c = v.dot(v);
        const d = u.dot(w);
        const e = v.dot(w);
        const D = a * c - b * b;

        let sc, sN, sD = D;
        let tc, tN, tD = D;

        // 平行チェック
        if (D < 0.0001) {
            sN = 0.0;
            sD = 1.0;
            tN = e;
            tD = c;
        } else {
            sN = (b * e - c * d);
            tN = (a * e - b * d);
            if (sN < 0.0) { sN = 0.0; tN = e; tD = c; }
            else if (sN > sD) { sN = sD; tN = e + b; tD = c; }
        }

        if (tN < 0.0) {
            tN = 0.0;
            if (-d < 0.0) sN = 0.0;
            else if (-d > a) sN = sD;
            else { sN = -d; sD = a; }
        } else if (tN > tD) {
            tN = tD;
            if ((-d + b) < 0.0) sN = 0.0;
            else if ((-d + b) > a) sN = sD;
            else { sN = (-d + b); sD = a; }
        }

        sc = (Math.abs(sN) < 0.0001) ? 0.0 : sN / sD;
        tc = (Math.abs(tN) < 0.0001) ? 0.0 : tN / tD;

        // dP = w + (sc * u) - (tc * v)
        const dP = w.add(u.multiplyScalar(sc)).sub(v.multiplyScalar(tc));
        return dP.length();
    }
}
