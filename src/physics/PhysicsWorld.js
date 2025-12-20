export class PhysicsWorld {
    constructor() {
        this.mouse = { x: 0, y: 0 }; // (-1 ~ 1)
        this.saberState = {
            rotationX: 0,
            rotationZ: 0,
            swingSpeed: 0
        };

        this.prevMouse = { x: 0, y: 0 };

        this.sense = 0.5;

        this.inertia = 0.5;

        this.setupInput();
    }

    setupInput() {
        window.addEventListener('mousemove', (e) => {
        // clip to (-1 ~ 1)
        this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        });
    }

    update() {
        // rough angle
        const targetRotZ = -this.mouse.x * 1.5;
        const targetRotX = this.mouse.y * 1.0;

        // simple inertia
        this.saberState.rotationZ += (targetRotZ - this.saberState.rotationZ) * (1/(20*this.inertia));
        this.saberState.rotationX += (targetRotX - this.saberState.rotationX) * (1/(20*this.inertia));

        // 3. 速度を計算 (移動量の絶対値)
        const dist = Math.sqrt(
        Math.pow(this.mouse.x - this.prevMouse.x, 2) + 
        Math.pow(this.mouse.y - this.prevMouse.y, 2)
        );
        this.saberState.swingSpeed = dist * this.sense * 100.0;

        // 次のフレームのために保存
        this.prevMouse.x = this.mouse.x;
        this.prevMouse.y = this.mouse.y;
    }

    // App.js がデータを取りに来るためのゲッター
    getSaberState() {
        return this.saberState;
    }

    setSensitivity(value) {
        this.sense = value;
    }

    setInertia(value) {
        this.inertia = value;
    }
}