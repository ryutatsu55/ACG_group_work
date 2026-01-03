export class PhysicsWorld {
    constructor() {
        this.mouse = { x: 0, y: 0 }; // (-1 ~ 1)
        this.saberState = {
            positionX: 0,
            positionY: 0,
            positionZ: 0,
            rotationX: 0,
            rotationZ: 0,
            swingSpeed: 0
        };

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

        window.addEventListener('click', (e) => {
            // UIパネル(lil-gui)をクリックしたときは反応しないようにする安全装置
            if (e.target.closest('.lil-gui')) return;

            // App.js から預かった関数があれば実行する
            if (this.onClick) {
                this.onClick();
            }
        });
    }

    // called from App.js for every frame
    update() {
        // rough angle
        const radius = Math.max(Math.pow(this.mouse.x, 2), Math.pow(this.mouse.y, 2));
        const targetPosX = this.mouse.x * 6.0 * this.sense;
        const targetPosY = this.mouse.y * 6.0 * this.sense;
        const targetPosZ = -5.0 * (1.0 - radius);
        const targetRotZ = -this.mouse.x * Math.PI * this.sense;
        const targetRotX = -Math.PI/4 + this.mouse.y * Math.PI * this.sense;

        // simple inertia
        this.saberState.positionX += (targetPosX - this.saberState.positionX) * (1/(20*this.inertia));
        this.saberState.positionY += (targetPosY - this.saberState.positionY) * (1/(20*this.inertia));
        this.saberState.positionZ += (targetPosZ - this.saberState.positionZ) * (1/(20*this.inertia));
        this.saberState.rotationZ += (targetRotZ - this.saberState.rotationZ) * (1/(20*this.inertia));
        this.saberState.rotationX += (targetRotX - this.saberState.rotationX) * (1/(20*this.inertia));

        // calc speed vec
        const dist = Math.sqrt(
        Math.pow(this.mouse.x - this.prevMouse.x, 2) + 
        Math.pow(this.mouse.y - this.prevMouse.y, 2)
        );
        this.saberState.swingSpeed = dist * this.sense * 100.0;

        // save previous pos for next calc
        this.prevMouse.x = this.mouse.x;
        this.prevMouse.y = this.mouse.y;
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
