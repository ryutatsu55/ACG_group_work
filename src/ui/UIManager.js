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
            // Disney BRDF Handle material settings
            metallic: 0.9,
            roughness: 0.3,
            clearcoat: 0.0,
            clearcoatGloss: 1.0,
            sheen: 0.0,
            sheenTint: 0.5,
            subsurface: 0.0,
            handleColor: '#666666',
            // Bloom / Post-processing
            bloomStrength: 0.5,
            bloomRadius: 0.4,
            bloomThreshold: 0.1,
            exposure: 1.0
        };

        // 初期化時の反映
        if (this.scene.lightsaber) {
            this.scene.lightsaber.toggle(this.params.saber_toggle);
            this.scene.lightsaber.setMode(this.params.saber_mode);
            this.scene.lightsaber.setSoundEnable(this.params.sound);
        }

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
            this.scene.lightsaber.toggle(value);
        });
        const saber_mode = saber_folder.add(this.params, 'saber_mode');
        saber_mode.name("snoise");
        saber_mode.onChange((value) => {
            this.scene.lightsaber.setMode(value)
        });

        saber_folder.addColor(this.params, 'color').onChange((value) => {
            this.scene.lightsaber.setColor(value);
        });
        saber_folder.add(this.params, 'sensitivity', 0.1, 1.0).onChange((value) => {
            this.physics.setSensitivity(value)
        });
        saber_folder.add(this.params, 'inertia', 0.1, 1.0).onChange((value) => {
            this.physics.setInertia(value)
        });

        // Disney BRDF Handle Material Settings
        const handleFolder = this.gui.addFolder('Handle Material (Disney BRDF)');

        handleFolder.add(this.params, 'metallic', 0.0, 1.0).name('Metallic').onChange((value) => {
            if (this.scene.lightsaber) this.scene.lightsaber.setMetallic(value);
        });

        handleFolder.add(this.params, 'roughness', 0.04, 1.0).name('Roughness').onChange((value) => {
            if (this.scene.lightsaber) this.scene.lightsaber.setRoughness(value);
        });

        handleFolder.add(this.params, 'clearcoat', 0.0, 1.0).name('Clearcoat').onChange((value) => {
            if (this.scene.lightsaber) this.scene.lightsaber.setClearcoat(value);
        });

        handleFolder.add(this.params, 'clearcoatGloss', 0.0, 1.0).name('Clearcoat Gloss').onChange((value) => {
            if (this.scene.lightsaber) this.scene.lightsaber.setClearcoatGloss(value);
        });

        handleFolder.add(this.params, 'sheen', 0.0, 1.0).name('Sheen').onChange((value) => {
            if (this.scene.lightsaber) this.scene.lightsaber.setSheen(value);
        });

        handleFolder.add(this.params, 'sheenTint', 0.0, 1.0).name('Sheen Tint').onChange((value) => {
            if (this.scene.lightsaber) this.scene.lightsaber.setSheenTint(value);
        });

        handleFolder.add(this.params, 'subsurface', 0.0, 1.0).name('Subsurface').onChange((value) => {
            if (this.scene.lightsaber) this.scene.lightsaber.setSubsurface(value);
        });

        handleFolder.addColor(this.params, 'handleColor').name('Base Color').onChange((value) => {
            if (this.scene.lightsaber) this.scene.lightsaber.setHandleColor(value);
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
            if (this.scene.setMusicEnable) {
                this.scene.setMusicEnable(value);
            }
        });


        const render_folder = this.gui.addFolder('Rendering Settings');

        const algorithm_options = ["A", "B", "C"];
        const algorithm_select = render_folder.add(this.params, 'algorithm', algorithm_options);
        algorithm_select.name("Algorithm");
        algorithm_select.onChange((value) => {
            if (this.scene.lightsaber) {
                this.scene.lightsaber.setAlgorithm(value);
            }
        });

        // Post-Processing / Bloom Controls
        const bloomFolder = this.gui.addFolder('Post-Processing (Bloom)');

        bloomFolder.add(this.params, 'bloomStrength', 0.0, 3.0).name('Bloom Strength').onChange((value) => {
            if (this.scene.setBloomStrength) this.scene.setBloomStrength(value);
        });

        bloomFolder.add(this.params, 'bloomRadius', 0.0, 2.0).name('Bloom Radius').onChange((value) => {
            if (this.scene.setBloomRadius) this.scene.setBloomRadius(value);
        });

        bloomFolder.add(this.params, 'bloomThreshold', 0.0, 1.0).name('Bloom Threshold').onChange((value) => {
            if (this.scene.setBloomThreshold) this.scene.setBloomThreshold(value);
        });

        bloomFolder.add(this.params, 'exposure', 0.1, 3.0).name('Exposure').onChange((value) => {
            if (this.scene.setExposure) this.scene.setExposure(value);
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