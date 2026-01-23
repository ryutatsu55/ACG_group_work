export class PhysicsWorld {
    constructor() {
        this.mouse = { x: 0, y: 0 }; // (-1 ~ 1)
        this.saberState = {
            rotX: 0.0,
            rotY: 0.0,
            rotZ: 0.0,
            posX: 0.0,
            posY: 0.0,
            posZ: 0.0,
            swingSpeed: 0.0
        };

        this.prevPos = { x: 0, y: 0 };

        this.prevMouse = { x: 0, y: 0 };

        this.sense = 0.5;

        this.inertia = 0.5;

        this.onClick = null;

        this.setupInput();
    }

    setupInput() {
        window.addEventListener('mousemove', (e) => {
            // clip to (-1 ~ 1)
            this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        });

        // window.addEventListener('click', (e) => {
        //     if (e.target.closest('.lil-gui')) return;

        //     if (this.onClick) {
        //         this.onClick();
        //     }
        // });
    }

    // called from App.js for every frame
    update(dt) {
        // Normalize dt to 60fps baseline (1/60 ≈ 0.0167)
        const dtNorm = dt / 0.0167;

        // rough angle
        const radius = Math.max(Math.pow(this.mouse.x, 2), Math.pow(this.mouse.y, 2));
        const targetPosX = this.mouse.x * 7.0 * this.sense;
        const targetPosY = this.mouse.y * 5.0 * this.sense;
        const targetPosZ = -3.0 * (1.0 - radius);
        const targetRotZ = -this.mouse.x * Math.PI * this.sense;
        const targetRotX = -Math.PI / 3 + this.mouse.y * Math.PI * this.sense;

        // Framerate-independent inertia using exponential smoothing
        // Higher inertia = slower response, base smoothing factor adjusted by dt
        const smoothingFactor = 1.0 - Math.exp(-dtNorm / (20 * this.inertia));

        this.saberState.posX += (targetPosX - this.saberState.posX) * smoothingFactor;
        this.saberState.posY += (targetPosY - this.saberState.posY) * smoothingFactor;
        this.saberState.posZ += (targetPosZ - this.saberState.posZ) * smoothingFactor;
        this.saberState.rotZ += (targetRotZ - this.saberState.rotZ) * smoothingFactor;
        this.saberState.rotX += (targetRotX - this.saberState.rotX) * smoothingFactor;

        // calc speed vec (normalized by dt for consistent speed measurement)
        const dist = Math.sqrt(
            Math.pow(this.saberState.posX - this.prevPos.x, 2) +
            Math.pow(this.saberState.posY - this.prevPos.y, 2)
        );
        // Normalize speed by dt to get velocity (distance per second)
        this.saberState.swingSpeed = (dt > 0) ? dist / dt : 0;

        // save previous pos for next calc
        this.prevPos.x = this.saberState.posX;
        this.prevPos.y = this.saberState.posY;
    }

    // called from App.js to get state
    getSaberState() {
        return this.saberState;
    }

    // called from UImanager.js every time the value is changed
    setSensitivity(value) {
        this.sense = value;
    }

    // called from UImanager.js every time the value is changed
    setInertia(value) {
        this.inertia = value;
    }
}
