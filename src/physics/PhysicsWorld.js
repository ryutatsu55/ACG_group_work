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

    // called from App.js for every frame
    update() {
        // rough angle
        const targetRotZ = -this.mouse.x * 1.5;
        const targetRotX = this.mouse.y * 1.0;

        // simple inertia
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