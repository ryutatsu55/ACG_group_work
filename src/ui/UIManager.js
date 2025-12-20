import GUI from 'lil-gui';

export class UIManager {
    constructor(sceneSystem, physicsSystem) {
        this.gui = new GUI();
        
        // receive from App.js
        this.scene = sceneSystem;
        this.physics = physicsSystem;

        this.debugParams = {
            velocity: 0.0,
            angle: 0.0
        };

        this.params = {
            color: '#00ff00',
            sensitivity: 0.5,
            inertia: 0.5,
            music: true,
            algorithm: "A"
        };

        this.setupGUI();
    }

    setupGUI() {
        const debugFolder = this.gui.addFolder('Real-time Status');

        this.ctrlVelocity = debugFolder.add(this.debugParams, 'velocity');
        this.ctrlVelocity.name('Swing Speed').disable().listen();
        this.ctrlAngle = debugFolder.add(this.debugParams, 'angle');
        this.ctrlAngle.name('Angle (rad)').disable().listen();



        const saber_folder = this.gui.addFolder('Saber Settings');

        // execute everytime value was changed
        saber_folder.addColor(this.params, 'color').onChange((value) => {
            // pass the value to the scene.lightsaber
            this.scene.lightsaber.setColor(value);
        });
        saber_folder.add(this.params, 'sensitivity', 0.0, 1.0).onChange((value) => {
            // pass the value to the physics
            this.physics.setSensitivity(value)
        });
        saber_folder.add(this.params, 'inertia', 0.1, 1.0).onChange((value) => {
            // pass the value to the physics
            this.physics.setInertia(value)
        });


        const music_folder = this.gui.addFolder('music Settings');

        const music_toggle = music_folder.add(this.params, 'music');
        music_toggle.name("music on/off");
        music_toggle.onChange((value) => {

        });


        const render_folder = this.gui.addFolder('rendering Settings');

        const algorithm_options = ["A", "B", "C"];
        const algorithm_select = render_folder.add(this.params, 'algorithm', algorithm_options);
        algorithm_select.name("algorithm");
        algorithm_select.onChange((value) => {

        });
    }

    // App.js update saber_state which App.js gets from PhysicsWorld.js
    updateStatus(velocity, angle) {
        this.debugParams.velocity = velocity.toFixed(2); 
        this.debugParams.angle = angle.toFixed(2);
    }
}
