import GUI from 'lil-gui';

export class UIManager {
    constructor(sceneSystem, physicsSystem) {
        this.gui = new GUI();
        
        // receive from App.js
        this.scene = sceneSystem;
        this.physics = physicsSystem;

        this.debugParams = {
            rotX: 0.0,
            rotY: 0.0,
            rotZ: 0.0,
            posX: 0.0,
            posY: 0.0,
            posZ: 0.0,
            swingSpeed: 0.0
        };

        this.params = {
            saber_toggle: true,
            saber_mode: true,
            color: '#00ff00',
            sensitivity: 0.5,
            inertia: 0.5,
            sound: false,
            music: false,
            algorithm: "A",
            // Handle material settings
            metalness: 0.9,
            roughness: 0.3,
            handleColor: '#666666'
        };

        this.scene.lightsaber.toggle(this.params.saber_toggle);
        this.scene.lightsaber.setMode(this.params.saber_mode);
        this.scene.lightsaber.setSoundEnable(this.params.sound);

        this.setupGUI();
    }

    setupGUI() {
        const debugFolder = this.gui.addFolder('Real-time Status');

        this.Velocity = debugFolder.add(this.debugParams, 'swingSpeed');
        this.Velocity.name('Swing Speed').decimals(3).disable().listen();
        this.rotX = debugFolder.add(this.debugParams, 'rotX');
        this.rotX.name('rotX').decimals(3).disable().listen();
        this.rotY = debugFolder.add(this.debugParams, 'rotY');
        this.rotY.name('rotY').decimals(3).disable().listen();
        this.rotZ = debugFolder.add(this.debugParams, 'rotZ');
        this.rotZ.name('rotZ').decimals(3).disable().listen();
        this.posX = debugFolder.add(this.debugParams, 'posX');
        this.posX.name('posX').decimals(3).disable().listen();
        this.posY = debugFolder.add(this.debugParams, 'posY');
        this.posY.name('posY').decimals(3).disable().listen();
        this.posZ = debugFolder.add(this.debugParams, 'posZ');
        this.posZ.name('posZ').decimals(3).disable().listen();



        const saber_folder = this.gui.addFolder('Saber Settings');

        saber_folder.add(this.params, 'saber_toggle').onChange((value) => {
            // pass the value to the scene.lightsaber
            this.scene.lightsaber.toggle(value);
        });
        const saber_mode = saber_folder.add(this.params, 'saber_mode');
        saber_mode.name("snoise");
        saber_mode.onChange((value) => {
            // pass the value to the physics
            this.scene.lightsaber.setMode(value)
        });
        // execute everytime value was changed
        saber_folder.addColor(this.params, 'color').onChange((value) => {
            // pass the value to the scene.lightsaber
            this.scene.lightsaber.setColor(value);
        });
        saber_folder.add(this.params, 'sensitivity', 0.1, 1.0).onChange((value) => {
            // pass the value to the physics
            this.physics.setSensitivity(value)
        });
        saber_folder.add(this.params, 'inertia', 0.1, 1.0).onChange((value) => {
            // pass the value to the physics
            this.physics.setInertia(value)
        });

        // Handle Material Settings
        const handleFolder = this.gui.addFolder('Handle Material');

        handleFolder.add(this.params, 'metalness', 0.0, 1.0).name('Metalness').onChange((value) => {
            this.scene.lightsaber.setMetalness(value);
        });

        handleFolder.add(this.params, 'roughness', 0.04, 1.0).name('Roughness').onChange((value) => {
            this.scene.lightsaber.setRoughness(value);
        });

        handleFolder.addColor(this.params, 'handleColor').name('Handle Color').onChange((value) => {
            this.scene.lightsaber.setHandleColor(value);
        });

        const music_folder = this.gui.addFolder('Sound Settings');

        const sound_toggle = music_folder.add(this.params, 'sound');
        sound_toggle.name("sound on/off");
        sound_toggle.onChange((value) => {
            this.scene.lightsaber.setSoundEnable(value);
        });
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
    updateStatus(saber_state) {
        this.debugParams.swingSpeed = saber_state.swingSpeed;
        this.debugParams.rotX = saber_state.rotX;
        this.debugParams.rotY = saber_state.rotY;
        this.debugParams.rotZ = saber_state.rotZ;
        this.debugParams.posX = saber_state.posX;
        this.debugParams.posY = saber_state.posY;
        this.debugParams.posZ = saber_state.posZ;
    }
}
